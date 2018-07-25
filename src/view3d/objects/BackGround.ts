import {
  AdditiveBlending,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  TextureLoader
} from "three";
import * as ImageBg from "../../assets/bg.png";

export class BackGround extends Mesh {
  constructor() {
    // 背景を作成
    const geometry = new PlaneGeometry(700, 700);
    const material = new MeshBasicMaterial({
      map: new TextureLoader().load(ImageBg),
      blending: AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });

    super(geometry, material);
  }
}
