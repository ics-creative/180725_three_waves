import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  Mesh,
  MeshPhongMaterial,
  PlaneGeometry,
} from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise";

const SEGMENT = 75;
const LENGTH = 4000;

const noise = new SimplexNoise();

export class Earth extends Mesh {
  constructor() {
    // 箱を作成
    const geometry = new PlaneGeometry(
      LENGTH * 2,
      LENGTH * 2,
      SEGMENT,
      SEGMENT,
    );
    const material = new MeshPhongMaterial({
      color: new Color().setHSL(0.7, 0.5, 0.5),
      blending: AdditiveBlending,
      wireframe: true,
    });
    super(geometry, material);
  }

  update(delta: number) {
    const geometry = this.geometry as PlaneGeometry;

    const attributesPosition = geometry.attributes.position as BufferAttribute;

    for (let i = 0; i < attributesPosition.count; i++) {
      const col = i % (SEGMENT + 1);
      const row = Math.floor(i / (SEGMENT + 1));

      const nextZ = noise.noise3d(col / 20, row / 20, delta / 5000) * 200;

      attributesPosition.setZ(i, nextZ);
    }

    // 更新するように指示を出しておく
    attributesPosition.needsUpdate = true;
  }
}
