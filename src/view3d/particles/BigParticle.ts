import { AdditiveBlending, Color, Object3D, Sprite, SpriteMaterial } from "three";
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
  private _flicker = 0;
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
    this.baseAlpha = 0.3;
    this._destroy = false;
    this._count = 0;
    this._flicker = 0;

    this.alpha = 1.0;
    this.scaleValue = 1.0;
  }

  /**
   * パーティクル個別の内部計算を行います。
   * @param deltaTime 前フレームからの経過時間（秒）
   */
  public update(deltaTime: number): void {
    const frameDelta = deltaTime * 60;
    // 60fpsの摩擦・重力を時間幅に合わせて積分し、120fpsでも同じ軌道を保つ。
    const friction = 0.98;
    const decay = Math.pow(friction, frameDelta);
    const distanceFactor = (friction * (1 - decay)) / (1 - friction);
    const terminalVelocity = (0.05 * friction) / (1 - friction);
    this.x += this.vx * distanceFactor;
    this.y += terminalVelocity * frameDelta + (this.vy - terminalVelocity) * distanceFactor;
    this.z += this.vz * distanceFactor;
    this.vx *= decay;
    this.vy = terminalVelocity + (this.vy - terminalVelocity) * decay;
    this.vz *= decay;

    this.position.set(this.x, this.y, this.z);

    const previousFrame = Math.floor(this._count + 1e-9);
    this._count += frameDelta;
    // 明滅の乱数も60Hzで更新する。
    for (let i = previousFrame; i < Math.floor(this._count + 1e-9); i++) {
      this._flicker = Math.random() * 0.1;
    }

    // 寿命・縮小・フェードも経過時間に比例させる。
    const maxD: number = 1 - this._count / this.life;
    const sizeNew: number = 1 - (this._count / this.life) * this.vSize;

    this.alpha = this._flicker + this.baseAlpha * maxD;
    this.scaleValue = sizeNew * MAX_PARTICLE_SIZE;

    this._mesh.scale.setLength(this.scaleValue);
    (this._mesh.material as SpriteMaterial).opacity = this.alpha;

    // 回収はEmitterがまとめて行う。
    if (this._count + 1e-9 >= this.life) {
      this._destroy = true;
    }
  }

  /**
   * パーティクルが死んでいるかどうかを確認します。
   */
  public getIsDead(): boolean {
    return this._destroy;
  }
}
