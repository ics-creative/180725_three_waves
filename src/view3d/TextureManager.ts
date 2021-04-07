import { Texture } from "three";

import * as ImageCircle from "../assets/circle.png";
import * as ImageCircleBorder from "../assets/circle_border.png";
import * as ImageParticle from "../assets/fire_particle.png";
import { toTexture } from "./utils/ThreeAssetUtil";

/**
 * テクスチャーを一元管理するためのクラスです。
 */
export class TextureManager {
  static async init() {
    TextureManager.circle = await toTexture(ImageCircle.default);
    TextureManager.circle_border = await toTexture(ImageCircleBorder.default);
    TextureManager.fire_particle = await toTexture(ImageParticle.default);
  }
  /** ●模様のテクスチャーです。 */
  static circle: Texture;

  /** ◯模様のテクスチャーです。 */
  static circle_border: Texture;

  /** もやっとした◎模様のテクスチャーです。 */
  static fire_particle: Texture;
}
