/**
 * パーティクル発生装置。マウス座標から速度を計算する。
 */
export class Emitter {
  /** 速度(X方向) */
  public vy = 0;
  /** 速度(Y方向) */
  public x = 0;
  /** マウスのX座標 */
  public latestY = 0;
  /** マウスのY座標 */
  public latestX = 0;
  /** パーティクル発生のX座標 */
  public y = 0;
  /** パーティクル発生のY座標 */
  public vx = 0;

  /**
   * @constructor
   */
  constructor() {}

  /**
   * パーティクルエミッターの計算を行います。
   * この計算によりマウスの引力が計算されます。
   */
  public update(): void {
    const dx: number = this.latestX - this.x;
    const dy: number = this.latestY - this.y;
    const d: number = Math.sqrt(dx * dx + dy * dy) * 0.2;
    const rad: number = Math.atan2(dy, dx);

    this.vx += Math.cos(rad) * d;
    this.vy += Math.sin(rad) * d;

    this.vx *= 0.4;
    this.vy *= 0.4;

    this.x += this.vx;
    this.y += this.vy;
  }
}
