import { Group } from "three";
import { ParticleEmitter } from "./ParticleEmitter";

export class BigParticleGroup extends Group {
  private _emitter: ParticleEmitter;
  private _count = 0;

  constructor(numParticlesPerFrame: number) {
    super();

    this._emitter = new ParticleEmitter(numParticlesPerFrame, 3.0, 3.0, 3.0);
    this.add(this._emitter.container);
  }

  /**
   * エンターフレームイベント
   * @param deltaTime 前フレームからの経過時間（秒）
   */
  public update(deltaTime: number): void {
    this._count++;
    if (this._count % 1 === 0) {
      // 手前ほどパーティックルの発生位置を狭める
      const far = { x: 5000, z: -3500 };
      const near = { x: 500, z: 1000 };

      const distance = (near.z - far.z) * Math.random() + far.z;
      const range = (near.z - distance) / (near.z - far.z);
      const wide = (far.x - near.x) * range + near.x;

      this._emitter.emit(
        wide * (Math.random() - 0.5),
        200 * (Math.random() - 0.5) + -100,
        distance,
      );
    }

    this._emitter.updateParticles(deltaTime);
  }
}
