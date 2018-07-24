import { Texture, TextureLoader } from "three";

export class TextureManager {
  static circle: Texture = new TextureLoader().load("circle.png");
  static circle_border: Texture = new TextureLoader().load("circle_border.png");
  static fire_particle: Texture = new TextureLoader().load("fire_particle.png");
}
