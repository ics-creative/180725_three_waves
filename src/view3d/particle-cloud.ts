import {
  AdditiveBlending,
  Geometry,
  Object3D,
  Points,
  PointsMaterial,
  TextureLoader,
  Vector3
} from "three";

/**
 * パーティクルのクラウドです。
 */
export class ParticleCloud extends Object3D {
  private _geometry: Geometry;
  private _speedList: number[] = [];

  /**
   * コンストラクターです。
   * @param {number} coefficient 係数です。
   * @param {number} zStart
   * @param {number} zEnd
   */
  constructor(
    coefficient: number,
    private zStart: number,
    private zEnd: number
  ) {
    super();

    // 形状データを作成
    const geometry = new Geometry();
    const numParticles = coefficient * 100;
    const SIZE = 5000;
    for (let i = 0; i < numParticles; i++) {
      geometry.vertices.push(
        new Vector3(
          SIZE * (Math.random() - 0.5),
          (zEnd - zStart) * Math.random() + zStart,
          SIZE * (Math.random() - 0.5)
        )
      );

      this._speedList[i] = 2 * Math.random() * Math.random();
    }
    // マテリアルを作成
    const texture = new TextureLoader().load("circle.png");
    const material = new PointsMaterial({
      size: 5,
      blending: AdditiveBlending,
      transparent: true,
      alphaTest: 0.1, // 矩形領域に黒枠表示されるのを防ぐため
      depthTest: true,
      map: texture
    });

    // 物体を作成
    const mesh = new Points(geometry, material);
    mesh.position.set(0, 0, 0);
    this.add(mesh);

    this._geometry = geometry;
  }

  public update(): void {
    // 星を動かす
    this._geometry.vertices.map((vertex: Vector3, index: number) => {
      vertex.y += this._speedList[index];

      if (vertex.y > this.zEnd) {
        vertex.y = this.zStart;
      }
    });

    // 更新するように指示を出しておく
    this._geometry.verticesNeedUpdate = true;
  }
}
