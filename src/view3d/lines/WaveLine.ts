import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Line,
  LineBasicMaterial,
  Object3D,
  Vector3,
} from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";

const noise = new SimplexNoise();

export class WaveLine extends Object3D {
  private lines: Line[];
  constructor(countZ: number, maxLines: number, step: number) {
    super();

    this.lines = [];

    [...Array(step).keys()].forEach((countY) => {
      const material = new LineBasicMaterial({
        color: new Color().setHSL(
          0.6 + (countZ / maxLines) * 0.2,
          0.5,
          0.2 + (countY / step) * 0.4,
        ),
        transparent: true,
        opacity: 0.2 * (countY / step) * (countZ / maxLines),
        blendAlpha: AdditiveBlending,
      });
      const geometry = new BufferGeometry();

      const points: Vector3[] = [];

      const max = 100;
      const lineWidth = 25;

      [...Array(max).keys()].forEach((countX) => {
        points.push(
          new Vector3(
            (max / 2 - countX) * lineWidth,
            0,
            (countZ - maxLines / 2) * 100 + 0,
          ),
        );
      });
      geometry.setFromPoints(points);

      const line = new Line(geometry, material);
      this.add(line);
      this.lines.push(line);
    });
  }

  public update(deltaTime: number, j: number): void {
    this.lines.forEach((line, k) => {
      const geometry = line.geometry;
      const attributesPosition = geometry.attributes
        .position as BufferAttribute;

      for (let i = 0; i < attributesPosition.count; i++) {
        const time = (Date.now() + k * 50) / 5000 + j * 300;
        const nextY = noise.noise3d(i / 100, time, 0) * 250;

        attributesPosition.setY(i, nextY);
      }
      attributesPosition.needsUpdate = true;
    });
  }
}
