import { BufferAttribute, Color, LineBasicMaterial, LineSegments, PlaneGeometry } from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";

// 変更: 解像度を上げる (75 -> 150)
const SEGMENT = 150;
export const LENGTH = 2000;

const noise = new SimplexNoise();

export class Earth extends LineSegments {
  // 追加: 経過時間を保持する変数
  private _elapsedTime = 0;

  constructor() {
    const geometry = new PlaneGeometry(LENGTH * 2, LENGTH * 2, SEGMENT, SEGMENT);
    // 各頂点を右隣・下隣だけにつなぎ、対角線のない格子にする。
    const indices: number[] = [];
    for (let y = 0; y <= SEGMENT; y++) {
      for (let x = 0; x <= SEGMENT; x++) {
        const i = y * (SEGMENT + 1) + x;
        if (x < SEGMENT) indices.push(i, i + 1);
        if (y < SEGMENT) indices.push(i, i + SEGMENT + 1);
      }
    }
    geometry.setIndex(indices);
    const material = new LineBasicMaterial({
      // 照明の影響を受けないため、元の床に合わせて明度を抑える。
      color: new Color().setHSL(0.7, 0.7, 0.1),
    });
    super(geometry, material);
  }

  update(deltaTime: number) {
    // 経過時間を加算
    this._elapsedTime += deltaTime;

    const geometry = this.geometry as PlaneGeometry;
    const attributesPosition = geometry.attributes.position as BufferAttribute;

    // 目標の進行速度 (元の timestamp / 5000 相当)
    const timeFactor = 0.2;

    for (let i = 0; i < attributesPosition.count; i++) {
      const col = i % (SEGMENT + 1);
      const row = Math.floor(i / (SEGMENT + 1));

      // 変更: 累積時間と係数を使って time を計算
      const time = this._elapsedTime * timeFactor;
      const nextZ = noise.noise3d(col / 60, row / 60, time) * 200;

      attributesPosition.setZ(i, nextZ);
    }

    // 更新するように指示を出しておく
    attributesPosition.needsUpdate = true;
  }
}
