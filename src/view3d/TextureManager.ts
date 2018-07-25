import { Texture, TextureLoader } from "three";

import * as ImageCircle from "../assets/circle.png";
import * as ImageCircleBorder from "../assets/circle_border.png";
import * as ImageParticle from "../assets/fire_particle.png";

/**
 * テクスチャーを一元管理するためのクラスです。
 */
export class TextureManager {
  /** ●模様のテクスチャーです。 */
  static circle: Texture = new TextureLoader().load(ImageCircle);

  /** ◯模様のテクスチャーです。 */
  static circle_border: Texture = new TextureLoader().load(ImageCircleBorder);

  /** もやっとした◎模様のテクスチャーです。 */
  static fire_particle: Texture = new TextureLoader().load(ImageParticle);
}
