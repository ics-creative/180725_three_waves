import {
  AdditiveBlending,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry
} from "three";
import { toTexture } from "../utils/ThreeAssetUtil";
import * as ImageBg from "../../assets/bg.png";

export class BackGround extends Group {
  constructor() {
    super();
    this.init();
  }

  async init() {
    // 背景を作成
    const geometry = new PlaneGeometry(700, 700);
    const material = new MeshBasicMaterial({
      map: await toTexture(ImageBg),
      blending: AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });

    const mesh = new Mesh(geometry, material);
    this.add(mesh);
  }
}
