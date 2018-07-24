import { Group } from "three";
import { ParticleEmitter } from "./ParticleEmitter";

export class ParticleContainer extends Group {
  private _emitter: ParticleEmitter;
  private _tickCount: number = 0;

  constructor(numParticlesPerFrame: number) {
    super();

    this._emitter = new ParticleEmitter(numParticlesPerFrame, 3.0, 3.0, 3.0);
    this.add(this._emitter.container);

    this.enterFrameHandler();
  }

  /**
   * エンターフレームイベント
   * @param event
   */
  private enterFrameHandler(event: Event = null): void {
    requestAnimationFrame(() => {
      this.enterFrameHandler();
    });

    this._tickCount = this._tickCount + 1;
    if (this._tickCount % 2 == 0) {
      this._emitter.emit(
        2000 * (Math.random() - 0.5),
        200 * (Math.random() - 0.5) + -100,
        5000 * (Math.random() - 0.5)
      );
    }

    this._emitter.update();
  }
}
