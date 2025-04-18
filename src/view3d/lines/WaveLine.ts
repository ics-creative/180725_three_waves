import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Line,
  LineBasicMaterial,
  Object3D,
  Vector3,
} from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise";

const noise = new SimplexNoise();

export class WaveLine extends Object3D {
  private lines: Line[];
  constructor(j: number, maxLines: number, step: number) {
    super();

    this.lines = [];

    [...Array(step).keys()].forEach((k) => {
      const material = new LineBasicMaterial({
        color: new Color().setHSL(
          0.6 + (j / maxLines) * 0.2,
          0.5,
          0.2 + (k / step) * 0.4,
        ),
      });
      const geometry = new BufferGeometry();

      const points: Vector3[] = [];

      const max = 200;

      [...Array(max).keys()].forEach((i) => {
        points.push(
          new Vector3((max / 2 - i) * 10, 0, (j - maxLines / 2) * 100 + 500),
        );
      });
      geometry.setFromPoints(points);

      const line = new Line(geometry, material);
      this.add(line);
      this.lines.push(line);
    });
  }

  public update(delta: number, j: number): void {
    this.lines.forEach((line, k) => {
      const geometry = line.geometry;
      const attributesPosition = geometry.attributes
        .position as BufferAttribute;

      for (let i = 0; i < attributesPosition.count; i++) {
        const nextY =
          noise.noise3d(i / 100, (delta + k * 50) / 10000 + j * 300, 0) * 200;

        attributesPosition.setY(i, nextY);
      }
      attributesPosition.needsUpdate = true;
    });
  }
}
