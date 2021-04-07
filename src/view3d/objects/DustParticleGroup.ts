import {
  AdditiveBlending,
  Geometry,
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
  private _geometry: Geometry;
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
    private yVariance: number
  ) {
    super();

    // 形状データを作成
    const geometry = new Geometry();
    const numParticles = particleNum;
    const SIZE = 3000;
    for (let i = 0; i < numParticles; i++) {
      geometry.vertices.push(
        new Vector3(
          SIZE * (Math.random() - 0.5),
          yVariance * Math.random() + yStart,
          SIZE * (Math.random() - 0.5)
        )
      );

      this._speedList[i] = Math.random() * Math.random();
    }
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

  public update(delta: number): void {
    // 星を動かす
    this._geometry.vertices.map((vertex: Vector3, index: number) => {
      vertex.y += this._speedList[index];

      if (vertex.y > this.yEnd) {
        vertex.y = this.yStart;
      }
    });

    // 更新するように指示を出しておく
    this._geometry.verticesNeedUpdate = true;
  }
}
