import {
  Color,
  Geometry,
  Line,
  LineBasicMaterial,
  Object3D,
  Vector3
} from "three";

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
          0.3 + (k / step) * 0.5
        )
      });
      const geometry = new Geometry();

      const max = 400;

      [...Array(max).keys()].forEach((i) => {
        geometry.vertices.push(
          new Vector3((max / 2 - i) * 5, 0, (j - maxLines / 2) * 150 + 250)
        );
      });

      const line = new Line(geometry, material);
      this.add(line);
      this.lines.push(line);
    });
  }

  public update(delta: number, noise, j: number): void {
    this.lines.forEach((line, k) => {
      const geometry = line.geometry as Geometry;
      const vertices = geometry.vertices;

      vertices.forEach((vertex, i) => {
        const y =
          noise.perlin3(i / 100, (delta + k * 100) / 10000 + j * 300, 0) * 100;

        vertex.setY(y);
      });
      geometry.verticesNeedUpdate = true;
    });
  }
}
