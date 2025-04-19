import { Group } from "three";
import { Emitter } from "./Emitter";
import { BigParticle } from "./BigParticle";

/**
 * パーティクルエミッター
 */
export class ParticleEmitter extends Emitter {
  public container: Group;
  private PRE_CACHE_PARTICLES = 100;
  private _particleActive: BigParticle[];
  private _particlePool: BigParticle[];

  /**
   * @param numParticles 1フレーム間に発生させる Particle 数
   * @param startVx
   * @param startVy
   * @param startVz
   */
  constructor(
    private numParticles: number,
    private startVx: number,
    private startVy: number,
    private startVz: number,
  ) {
    super();

    this.container = new Group();

    this._particleActive = [];
    this._particlePool = [];

    /* 予め必要そうな分だけ作成しておく */
    for (let i = 0; i < this.PRE_CACHE_PARTICLES; i++) {
      this._particlePool.push(new BigParticle());
    }
  }

  /**
   * パーティクルを発生させます。
   * @param x パーティクルの発生X座標
   * @param y パーティクルの発生Y座標
   * @param z パーティクルの発生Z座標
   */
  public emit(x: number, y: number, z: number) {
    for (let i = 0; i < this.numParticles; i++) {
      this.getNewParticle(x, y, z);
    }
  }

  /**
   * パーティクルを更新します。
   * @param deltaTime 前フレームからの経過時間（秒）
   */
  public updateParticles(deltaTime: number) {
    this._particleActive.forEach((p) => {
      if (!p.getIsDead()) {
        p.update(deltaTime);
      } else {
        this.removeParticle(p);
      }
    });
  }

  /**
   * パーティクルを追加します。
   * @param emitX
   * @param emitY
   * @param emitZ
   */
  private getNewParticle(emitX: number, emitY: number, emitZ: number) {
    const particle = this.fromPool();
    particle.resetParameters(
      emitX,
      emitY,
      emitZ,
      this.startVx,
      this.startVy,
      this.startVz,
    );
    this._particleActive.push(particle);
    this.container.add(particle);
    return particle;
  }

  /**
   * パーティクルを削除します。
   * @param particle
   */
  public removeParticle(particle: BigParticle): void {
    this.container.remove(particle);

    const index = this._particleActive.indexOf(particle);
    if (index > -1) {
      this._particleActive.splice(index, 1);
    }

    this.toPool(particle);
  }

  /**
   * アクティブなパーティクルを取り出します。
   * @returns {BigParticle[]}
   */
  public getActiveParticles(): BigParticle[] {
    return this._particleActive;
  }

  /**
   * プールからインスタンスを取り出します。
   * プールになければ新しいインスタンスを作成します。
   * @returns {BigParticle}
   */
  private fromPool(): BigParticle {
    return this._particlePool.length > 0
      ? (this._particlePool.shift() as BigParticle)
      : new BigParticle();
  }

  /**
   * プールにインスタンスを格納します。
   * @param particle
   */
  private toPool(particle: BigParticle): void {
    this._particlePool.push(particle);
  }
}
