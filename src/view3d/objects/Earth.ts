import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  Mesh,
  MeshPhongMaterial,
  PlaneGeometry,
} from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";

const SEGMENT = 75;
const LENGTH = 4000;

const noise = new SimplexNoise();

export class Earth extends Mesh {
  // 追加: 経過時間を保持する変数
  private _elapsedTime = 0;

  constructor() {
    // 箱を作成
    const geometry = new PlaneGeometry(
      LENGTH * 2,
      LENGTH * 2,
      SEGMENT,
      SEGMENT,
    );
    const material = new MeshPhongMaterial({
      color: new Color().setHSL(0.7, 0.5, 0.5),
      blending: AdditiveBlending,
      wireframe: true,
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
      const nextZ = noise.noise3d(col / 20, row / 20, time) * 200;

      attributesPosition.setZ(i, nextZ);
    }

    // 更新するように指示を出しておく
    attributesPosition.needsUpdate = true;
  }
}
