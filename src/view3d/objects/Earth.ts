import {
  AdditiveBlending,
  Color,
  Mesh,
  MeshPhongMaterial,
  PlaneGeometry,
} from "three";
import * as noise from "simplenoise";

const SEGMENT = 75;
const LENGTH = 4000;

export class Earth extends Mesh {
  constructor() {
    // 箱を作成
    const geometry = new PlaneGeometry(
      LENGTH * 2,
      LENGTH * 2,
      SEGMENT,
      SEGMENT
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
    const vertices = geometry.vertices;

    vertices.forEach((vertex, index) => {
      const col = index % (SEGMENT + 1);
      const row = Math.floor(index / (SEGMENT + 1));

      const z = noise.perlin3(col / 20, row / 20, delta / 5000) * 200;

      vertex.setZ(z);
    });
    geometry.verticesNeedUpdate = true;
  }
}
