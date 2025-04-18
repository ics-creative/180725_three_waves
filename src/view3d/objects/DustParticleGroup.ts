import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  Points,
  PointsMaterial,
  Vector3,
} from "three";
import { TextureManager } from "../TextureManager";

/**
 * 塵のようなパーティクルです。
 */
export class DustParticleGroup extends Group {
  private _geometry: BufferGeometry;
  private _speedList: number[] = [];

  /**
   * コンストラクターです。
   * @param {number} particleNum パーティクルの個数。
   * @param {number} yStart
   * @param {number} yEnd
   * @param yVariance
   */
  constructor(
    particleNum: number,
    private yStart: number,
    private yEnd: number,
    private yVariance: number,
  ) {
    super();

    // 形状データを作成
    const geometry = new BufferGeometry();
    const numParticles = particleNum;
    const SIZE = 3000;
    const points: Vector3[] = [];
    for (let i = 0; i < numParticles; i++) {
      points.push(
        new Vector3(
          SIZE * (Math.random() - 0.5),
          yVariance * Math.random() + yStart,
          SIZE * (Math.random() - 0.5),
        ),
      );

      this._speedList[i] = Math.random() * Math.random();
    }
    geometry.setFromPoints(points);

    // マテリアルを作成
    const texture = TextureManager.circle;
    const material = new PointsMaterial({
      size: 3,
      blending: AdditiveBlending,
      transparent: true,
      depthTest: true,
      depthWrite: true,
      map: texture,
    });

    // 物体を作成
    const mesh = new Points(geometry, material);
    mesh.position.set(0, 0, 0);
    this.add(mesh);

    this._geometry = geometry;
  }

  public update(deltaTime: number): void {
    const attributesPosition = this._geometry.attributes
      .position as BufferAttribute;
    // 基準の速度係数 (60fps基準)
    const baseSpeedFactor = 60;

    // 星を動かす
    const nextPositions: number[] = [];
    for (let i = 0; i < attributesPosition.count; i++) {
      const y = attributesPosition.getY(i);

      // 変更: 移動量を deltaTime ベースに
      let nextY = y + this._speedList[i] * deltaTime * baseSpeedFactor;

      if (nextY > this.yEnd) {
        nextY = this.yStart;
      }

      attributesPosition.setY(i, nextY);
    }

    // 更新するように指示を出しておく
    attributesPosition.needsUpdate = true;
  }
}
