import { Group } from "three";
import { ParticleEmitter } from "./ParticleEmitter";

export class BigParticleGroup extends Group {
  private _emitter: ParticleEmitter;
  private _emissionRemainder = 0;

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
    this._emitter.updateParticles(deltaTime);
    // 60fps時の発生密度を、画面のリフレッシュレートにかかわらず保つ。
    this._emissionRemainder += deltaTime * 60;
    const emissionCount = Math.floor(this._emissionRemainder + 1e-9);
    this._emissionRemainder -= emissionCount;

    for (let i = 0; i < emissionCount; i++) {
      // 手前ほどパーティクルの発生位置を狭める。
      const distance = 6000 * Math.random() - 5000;
      const range = (1000 - distance) / 6000;
      const wide = 4500 * range + 500;
      // フレーム内の出生時刻からの経過分だけ進める。
      const age = Math.max(0, (emissionCount - 1 - i + this._emissionRemainder) / 60);
      this._emitter.emit(
        wide * (Math.random() - 0.5),
        200 * (Math.random() - 0.5) - 100,
        distance,
        age,
      );
    }
  }
}
