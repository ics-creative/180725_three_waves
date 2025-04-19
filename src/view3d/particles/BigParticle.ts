import {
  AdditiveBlending,
  Color,
  Object3D,
  Sprite,
  SpriteMaterial,
} from "three";
import { TextureManager } from "../TextureManager";

const MAX_PARTICLE_SIZE = 100;

/**
 * 粒子クラスです。
 */
export class BigParticle extends Object3D {
  public x = 0;
  public y = 0;
  public z = 0;
  public alpha = 0;
  public scaleValue = 0;
  public vx = 0;
  public vy = 0;
  public vz = 0;
  public life = 0;
  public vSize = 0;
  public baseAlpha = 0;

  private _count = 0;
  private _destroy: boolean;

  private _mesh: Sprite;

  /**
   * コンストラクタ
   */
  constructor() {
    super();

    const list = [
      TextureManager.circle,
      TextureManager.circle_border,
      TextureManager.fire_particle,
    ];

    const material = new SpriteMaterial({
      color: new Color().setHSL(
        0.5 + Math.random() * 0.3,
        0.7 + Math.random() * 0.2,
        0.6 + Math.random() * 0.2,
      ),
      map: list[Math.floor(list.length * Math.random())],
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      fog: true,
    });
    const mesh = new Sprite(material);

    this.add(mesh);
    this._mesh = mesh;

    this._destroy = true;
  }

  /**
   * パーティクルをリセットします。
   */
  public resetParameters(
    emitX: number,
    emitY: number,
    emitZ: number,
    startVx: number,
    startVy: number,
    startVz: number,
  ): void {
    this.x = emitX;
    this.y = emitY;
    this.z = emitZ;
    this.vx = (Math.random() - 0.5) * startVx;
    this.vy = (Math.random() - 0.5) * startVy;
    this.vz = (Math.random() - 0.5) * startVz;
    this.life = Math.random() * Math.random() * 400 + 40;
    this.vSize = Math.random() * 0.2;
    this.baseAlpha = 1.0;
    this._destroy = false;
    this._count = 0;

    this.alpha = 1.0;
    this.scaleValue = 1.0;
  }

  /**
   * パーティクル個別の内部計算を行います。
   * @param deltaTime 前フレームからの経過時間（秒）
   */
  public update(deltaTime: number): void {
    // 基準の速度係数 (60fps基準)
    const baseSpeedFactor = 60;

    // --- 時間ベースの計算を再適用 ---
    // 重力計算
    const gravity = 0.05 * baseSpeedFactor;
    this.vy += gravity * deltaTime;

    // 摩擦計算 (指数関数的減衰に変更)
    const frictionFactor = Math.pow(0.98, deltaTime * baseSpeedFactor);
    this.vx *= frictionFactor;
    this.vy *= frictionFactor;
    this.vz *= frictionFactor;

    // 位置更新
    this.x += this.vx * deltaTime * baseSpeedFactor;
    this.y += this.vy * deltaTime * baseSpeedFactor;
    this.z += this.vz * deltaTime * baseSpeedFactor;
    // --- ここまで時間ベース計算 ---

    this.position.set(this.x, this.y, this.z);

    // 経過時間を加算
    this._count++;

    // 徐々に小さく、アルファを0に近づける (ここはフレームベースのまま)
    const maxD: number = 1 - this._count / this.life;
    const sizeNew: number = 1 - (this._count / this.life) * this.vSize;

    this.alpha = Math.random() * 0.3 + this.baseAlpha * maxD;
    this.scaleValue = sizeNew * MAX_PARTICLE_SIZE;

    this._mesh.scale.setLength(this.scaleValue);
    (this._mesh.material as SpriteMaterial).opacity = this.alpha;

    // 死亡フラグ (フレームベースのまま)
    if (this.life < this._count) {
      this._destroy = true;
      (this.parent as Object3D)?.remove(this);
    }
  }

  /**
   * パーティクルが死んでいるかどうかを確認します。
   */
  public getIsDead(): boolean {
    return this._destroy;
  }
}
