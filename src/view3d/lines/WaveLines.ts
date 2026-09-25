import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  Color,
  DynamicDrawUsage,
  Group,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  Scene,
  Sphere,
  Sprite,
  Vector3,
  Vector4,
} from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";

const noise = new SimplexNoise();
const DEPTH_COUNT = 10;
const LINES_PER_DEPTH = 100;
const POINT_COUNT = 100;
const CENTER_POINT_COUNT = 60;
const POINT_SPACING = 25;
const EDGE_POINT_COUNT = (POINT_COUNT - CENTER_POINT_COUNT) / 2;
const EDGE_GROWTH = 1.2;
const NOISE_LENGTH = 2500;
const LINE_COUNT = DEPTH_COUNT * LINES_PER_DEPTH;
const INDEX_COUNT_PER_LINE = (POINT_COUNT - 1) * 2;

// 100点のうち中央60点は元の密度を保ち、左右20点ずつで有限の表示幅を確保する。
const xCoordinates = Float32Array.from({ length: POINT_COUNT }, (_, i) => {
  const point = i - EDGE_POINT_COUNT;
  const basePoint = Math.max(0, Math.min(CENTER_POINT_COUNT - 1, point));
  const distance = point - basePoint;
  const extension = (POINT_SPACING * (EDGE_GROWTH ** Math.abs(distance) - 1)) / (EDGE_GROWTH - 1);
  return (CENTER_POINT_COUNT / 2 - basePoint) * POINT_SPACING - Math.sign(distance) * extension;
});
// 頂点を配置し直しても、波の位置と波長を変えない。
const noiseCoordinates = Float64Array.from(xCoordinates, (x) => 0.5 - x / NOISE_LENGTH);

/** 透明オブジェクトの描画順を保ちながら、連続する波線をまとめて描画する。 */
export class WaveLines extends Group {
  private readonly positions: BufferAttribute;
  private readonly colors: BufferAttribute;
  private readonly indices: BufferAttribute;
  private readonly material = new LineBasicMaterial({ vertexColors: true, transparent: true });
  private readonly batches: LineSegments[] = [];
  private readonly barriers: number[] = [];
  private readonly centers = new Float64Array(LINE_COUNT * 3);
  private readonly depths = new Float64Array(LINE_COUNT);
  private readonly order = Array.from({ length: LINE_COUNT }, (_, i) => i);
  private readonly previousOrder = new Int32Array(LINE_COUNT).fill(-1);
  private readonly projection = new Matrix4();
  private readonly center = new Vector4();
  private centersInitialized = false;

  constructor() {
    super();
    const positions = new Float32Array(LINE_COUNT * POINT_COUNT * 3);
    const colors = new Float32Array(LINE_COUNT * POINT_COUNT * 4);
    const color = new Color();

    for (let j = 0; j < DEPTH_COUNT; j++) {
      for (let k = 0; k < LINES_PER_DEPTH; k++) {
        color.setHSL(0.6 + (j / DEPTH_COUNT) * 0.2, 0.5, 0.2 + (k / LINES_PER_DEPTH) * 0.4);
        const alpha = 0.2 * (k / LINES_PER_DEPTH) * (j / DEPTH_COUNT);
        for (let i = 0; i < POINT_COUNT; i++) {
          const vertex = (j * LINES_PER_DEPTH + k) * POINT_COUNT + i;
          positions[vertex * 3] = xCoordinates[i];
          positions[vertex * 3 + 2] = (j - DEPTH_COUNT / 2) * 100;
          colors[vertex * 4] = color.r;
          colors[vertex * 4 + 1] = color.g;
          colors[vertex * 4 + 2] = color.b;
          colors[vertex * 4 + 3] = alpha;
        }
      }
    }

    const positionAttribute = new BufferAttribute(positions, 3).setUsage(DynamicDrawUsage);
    const indexAttribute = new BufferAttribute(
      new Uint32Array(LINE_COUNT * INDEX_COUNT_PER_LINE),
      1,
    ).setUsage(DynamicDrawUsage);
    this.positions = positionAttribute;
    this.colors = new BufferAttribute(colors, 4);
    this.indices = indexAttribute;
  }

  /** シーンの行列更新後、描画リストを作る前に呼ぶ。 */
  public prepare(camera: Camera, scene: Scene): void {
    if (!this.visible) return;
    // 元の透明線と同じく、各線の初回の境界中心を奥行きソートに使う。
    if (!this.centersInitialized) this.initializeCenters();
    this.projection
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      .multiply(this.matrixWorld);
    for (let line = 0; line < LINE_COUNT; line++) {
      const offset = line * 3;
      this.depths[line] = this.center
        .set(this.centers[offset], this.centers[offset + 1], this.centers[offset + 2], 1)
        .applyMatrix4(this.projection).z;
    }
    this.order.sort((a, b) => this.depths[b] - this.depths[a] || a - b);
    this.updateIndices();

    // 背景・粒子が間に入る位置で分割する。全線を1バッチにすると合成色が変わる。
    this.barriers.length = 0;
    this.projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    scene.traverseVisible((object) => {
      if (object.parent === this || !object.layers.test(camera.layers)) return;
      if (!(object instanceof Mesh || object instanceof Sprite)) return;
      if (
        Array.isArray(object.material) ||
        !object.material.transparent ||
        !object.material.visible
      )
        return;
      if (object instanceof Sprite) {
        this.center.setFromMatrixPosition(object.matrixWorld);
      } else {
        if (!object.geometry.boundingSphere) object.geometry.computeBoundingSphere();
        const center = object.geometry.boundingSphere!.center;
        this.center.set(center.x, center.y, center.z, 1).applyMatrix4(object.matrixWorld);
      }
      this.barriers.push(this.center.applyMatrix4(this.projection).z);
    });
    this.barriers.sort((a, b) => b - a);

    let start = 0;
    let batchCount = 0;
    for (const depth of this.barriers) {
      let end = start;
      while (end < LINE_COUNT && this.depths[this.order[end]] >= depth) end++;
      if (end > start) this.prepareBatch(batchCount++, start, end);
      start = end;
    }
    if (start < LINE_COUNT) this.prepareBatch(batchCount++, start, LINE_COUNT);
    for (let i = batchCount; i < this.batches.length; i++) this.batches[i].visible = false;
  }

  private prepareBatch(index: number, start: number, end: number): void {
    let batch = this.batches[index];
    if (!batch) {
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", this.positions);
      geometry.setAttribute("color", this.colors);
      geometry.setIndex(this.indices);
      geometry.boundingSphere = new Sphere(new Vector3(), Math.hypot(xCoordinates[0], 500, 1000));
      batch = new LineSegments(geometry, this.material);
      batch.matrixAutoUpdate = false;
      batch.frustumCulled = false;
      this.batches.push(batch);
      this.add(batch);
    }
    batch.visible = true;
    batch.matrixWorld.copy(this.matrixWorld);
    batch.geometry.setDrawRange(start * INDEX_COUNT_PER_LINE, (end - start) * INDEX_COUNT_PER_LINE);
    // このバッチの深度区間内にある線を、Three.jsのソート用中心にする。
    batch.geometry.boundingSphere!.center.fromArray(
      this.centers,
      this.order[Math.floor((start + end) / 2)] * 3,
    );
  }

  public update(animationTime: number): void {
    const positions = this.positions.array;
    let offset = 1;
    for (let j = 0; j < DEPTH_COUNT; j++) {
      for (let k = 0; k < LINES_PER_DEPTH; k++) {
        const time = (animationTime + k * 50) / 5000 + j * 300;
        for (let i = 0; i < POINT_COUNT; i++, offset += 3) {
          positions[offset] = noise.noise3d(noiseCoordinates[i], time, 0) * 250;
        }
      }
    }
    this.positions.needsUpdate = true;
  }

  private initializeCenters(): void {
    const positions = this.positions.array;
    for (let line = 0; line < LINE_COUNT; line++) {
      let minY = Infinity;
      let maxY = -Infinity;
      const offset = line * POINT_COUNT * 3;
      // 外側の疎な頂点に影響されないよう、中央部分からソート用の中心を求める。
      for (let i = EDGE_POINT_COUNT; i < EDGE_POINT_COUNT + CENTER_POINT_COUNT; i++) {
        const y = positions[offset + i * 3 + 1];
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      this.centers[line * 3] = 12.5;
      this.centers[line * 3 + 1] = (minY + maxY) / 2;
      this.centers[line * 3 + 2] = positions[offset + 2];
    }
    this.centersInitialized = true;
  }

  private updateIndices(): void {
    const indices = this.indices.array;
    let changed = false;
    for (let slot = 0; slot < LINE_COUNT; slot++) {
      const line = this.order[slot];
      if (this.previousOrder[slot] === line) continue;
      this.previousOrder[slot] = line;
      changed = true;
      const vertex = line * POINT_COUNT;
      const offset = slot * INDEX_COUNT_PER_LINE;
      for (let i = 0; i < POINT_COUNT - 1; i++) {
        indices[offset + i * 2] = vertex + i;
        indices[offset + i * 2 + 1] = vertex + i + 1;
      }
    }
    if (changed) this.indices.needsUpdate = true;
  }
}
