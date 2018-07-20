import { Group } from "three";
import { ParticleEmitter } from "./ParticleEmitter";

/**
 * 大量のパーティクルを発生させてみた
 * マウスを押してる間でてくるよ
 * @see http://wonderfl.net/c/4WjT
 * @class demo.ParticleSample
 */

export class ParticleContainer extends Group {
  private _emitter: ParticleEmitter;
  private _emitterForMouse: ParticleEmitter;

  private _isMouseMoved: boolean = false;

  private _tickCount: number = 0;

  set isMouseMoved(value: boolean) {
    this._isMouseMoved = true;
  }

  constructor(numParticlesPerFrame: number) {
    super();

    this._emitter = new ParticleEmitter(numParticlesPerFrame, 2.0, 2.0);
    this.add(this._emitter.container);

    this._emitterForMouse = new ParticleEmitter(2, 6.0, 6.0);
    this.add(this._emitterForMouse.container);

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
      // this._emitter.emit(
      //   window.innerWidth * Math.random(),
      //   (window.innerHeight / 5) * (Math.random() - 0.5) +
      //     (window.innerHeight * 6) / 10
      // );
      this._emitter.emit(
        5000 * (Math.random() - 0.5),
        (window.innerHeight / 5) * (Math.random() - 0.5) + -1.0,
        10000 * (Math.random() - 0.5)
      );
    }

    this._emitter.update();

    if (this._isMouseMoved == true) {
      // let pt = this.globalToLocal(
      //   this.getStage().mouseX,
      //   this.getStage().mouseY
      // );
      // this._emitterForMouse.emit(pt.x, pt.y);
      this._isMouseMoved = false;
    }

    this._emitterForMouse.update();

    // const hue =
    //   Math.sin((((-1 * Date.now()) / 400) * Math.PI) / 180) * 45 + 200;
    // // 背景
    // const color1 = new Color().setHSL(hue/360, 100/100, 60/100);
    // const color2 = new Color().setHSL((hue + 120)/360, 100/100, 40/100);
    //
    // this._bg.graphics
    //   .clear()
    //   .beginLinearGradientFill(
    //     [color1, color2],
    //     [0, 1],
    //     0,
    //     0,
    //     0,
    //     window.innerHeight
    //   )
    //   .drawRect(0, 0, window.innerWidth, window.innerHeight);
  }
}
