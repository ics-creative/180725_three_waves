import { Group } from "three";
import { WaveLine } from "./WaveLine";

export class WaveLines extends Group {
  private lines: WaveLine[];

  constructor() {
    super();

    const lines: WaveLine[] = [];
    const maxLines = 10;

    [...Array(maxLines).keys()].forEach((j) => {
      {
        const line = new WaveLine(
          j,
          maxLines,
          Math.max(1, Math.round(j ** 3 / 60)),
        );
        this.add(line);
        lines.push(line);
      }
    });
    this.lines = lines;
  }

  public update(delta: number): void {
    this.lines.forEach((line, j) => {
      line.update(delta, j);
    });
  }
}
