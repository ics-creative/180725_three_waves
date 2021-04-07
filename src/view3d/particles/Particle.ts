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
export class Particle extends Object3D {
  public x: number = 0;
  public y: number = 0;
  public z: number = 0;
  public alpha: number = 0;
  public scaleValue: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public vz: number = 0;
  public life: number = 0;
  public vSize: number = 0;
  public baseAlpha: number = 0;

  private _count: number = 0;
  private _destroy: boolean;

  private _mesh: Sprite;

  /**
   * コンストラクタ
   * @constructor
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
        0.1,
        0.5 + Math.random() * 0.5
      ),
      map: list[Math.floor(list.length * Math.random())],
      blending: AdditiveBlending,
      depthTest: true,
      depthWrite: true,
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
    startVz: number
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
   * @method
   */
  public update(): void {
    // 重力計算
    this.vy += 0.05;

    // 摩擦計算
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.vz *= 0.98;

    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    this.position.set(this.x, this.y, this.z);

    this._count++;

    const maxD: number = 1 - this._count / this.life;
    const sizeNew: number = 1 - (this._count / this.life) * this.vSize;

    this.alpha = Math.random() * 0.3 + this.baseAlpha * maxD;

    this.scaleValue = sizeNew * MAX_PARTICLE_SIZE;

    this._mesh.scale.setLength(this.scaleValue);
    (this._mesh.material as SpriteMaterial).opacity = this.alpha;

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
