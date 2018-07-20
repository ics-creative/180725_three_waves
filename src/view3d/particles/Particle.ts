import {
  AdditiveBlending,
  BoxBufferGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneBufferGeometry,
  TextureLoader
} from "three";

/**
 * 粒子クラスです。
 */
export class Particle extends Object3D {
  public x: number;
  public y: number;
  public z: number;
  public alpha: number;
  public scaleValue: number;
  public vx: number;
  public vy: number;
  public life: number;
  public size: number;
  public vSize: number;
  public baseAlpha: number;

  private _count: number;
  private _destroy: boolean;
  private MAX_SIZE: number = 128;

  private _mesh: Mesh;

  /**
   * コンストラクタ
   * @constructor
   */
  constructor() {
    super();

    const size =
      Math.random() *
        Math.random() *
        Math.random() *
        Math.random() *
        this.MAX_SIZE +
      2;
    this.size = size;

    const geometry = new PlaneBufferGeometry(200, 200);
    const list = ["fire_particle.png", "circle.png", "circle_border.png"];

    const material = new MeshBasicMaterial({
      color: new Color().setHSL(
        0.5 + Math.random() * 0.3,
        0.1,
        0.5 + Math.random() * 0.5
      ),
      map: new TextureLoader().load(
        list[Math.floor(list.length * Math.random())]
      ),
      blending: AdditiveBlending,
      transparent: true
    });
    const mesh = new Mesh(geometry, material);
    this.add(mesh);
    this._mesh = mesh;

    const colorHsl = new Color().setHSL(0, 0, (20 + Math.random() * 50) / 100);

    // this.graphics.clear();
    // if (Math.random() < 0.4) {
    //   // もやっとした円
    //   this.graphics.beginRadialGradientFill(
    //     [colorHsl, "#000000"],
    //     [0.0, 1.0],
    //     0,
    //     0,
    //     0,
    //     0,
    //     0,
    //     this.size
    //   );
    // } else if (Math.random() < 0.1) {
    //   // 輪郭だけの円
    //   this.graphics
    //     .setStrokeStyle(1) // 線の太さ
    //     .beginStroke(Graphics.getRGB(255, 255, 255));
    // } else if (Math.random() < 0.3) {
    //   // 輪郭だけの円
    //   this.graphics
    //     .setStrokeStyle(1.5) // 線の太さ
    //     .beginStroke(Graphics.getRGB(255, 255, 255));
    // } else {
    //   // キリッとした円
    //   this.graphics.beginFill(colorHsl);
    // }
    //
    // this.graphics.drawCircle(0, 0, this.size);
    // this.graphics.endFill();

    // 大量のオブジェクトを重ねるとおかしくなる
    // this.compositeOperation = "lighter";
    //
    // this.mouseEnabled = false;
    // const padding = 2;
    // this.cache(
    //   -this.size - padding,
    //   -this.size - padding,
    //   this.size * 2 + padding * 2,
    //   this.size * 2 + padding * 2
    // );

    this._destroy = true;
  }

  /**
   * パーティクルをリセットします。
   * @param emitX
   * @param emitY
   */
  public resetParameters(
    emitX: number,
    emitY: number,
    emitZ: number,
    startVx: number,
    startVy: number
  ): void {
    this.x = emitX;
    this.y = emitY;
    this.z = emitZ;
    this.vx = (Math.random() - 0.5) * startVx;
    this.vy = (Math.random() - 0.5) * startVy;
    this.life = Math.random() * Math.random() * 400 + 40;
    this.vSize = Math.random() * 0.5;
    this.baseAlpha = 0.7;
    this._destroy = false;
    this._count = 0;

    this.alpha = 1.0;
    this.scaleValue = 1.0;
  }

  /**
   * パーティクル個別の内部計算を行います。
   * @method
   */
  public update(): void {
    // 重力計算
    this.vy += 0.05;

    // 摩擦計算
    this.vx *= 0.98;
    this.vy *= 0.98;

    this.x += this.vx;
    this.y += this.vy;

    this.position.set(this.x, this.y, this.z);

    this._count++;

    const maxD: number = 1 - this._count / this.life;
    const sizeNew: number = 1 - (this._count / this.life) * this.vSize;

    this.alpha = Math.random() * 0.3 + this.baseAlpha * maxD;
    this.scaleValue = sizeNew;

    this._mesh.scale.setLength(sizeNew);
    (this._mesh.material as MeshBasicMaterial).opacity = this.alpha;

    // 死亡フラグ
    if (this.life < this._count) {
      this._destroy = true;
      (this.parent as Object3D).remove(this);
    }
  }

  /**
   * パーティクルが死んでいるかどうかを確認します。
   * @returns {boolean}
   * @method
   */
  public getIsDead(): boolean {
    return this._destroy;
  }
}
