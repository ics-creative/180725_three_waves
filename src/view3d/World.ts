import {
  Color,
  DirectionalLight,
  Fog,
  Geometry,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer
} from "three";

import * as noise from "simplenoise";
import { ParticleContainer } from "./particles/ParticleContainer";

const SEGMENT = 200;
const LENGTH = 2000;

export class World {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private box: Mesh;
  private lines: Line[];
  private particleContainer: ParticleContainer;

  constructor() {
    // レンダラーを作成
    const renderer = new WebGLRenderer();
    this.renderer = renderer;
    // canvasをbodyに追加
    document.body.appendChild(renderer.domElement);

    // シーンを作成
    const scene = new Scene();
    this.scene = scene;
    scene.fog = new Fog(0x000000, 50, 2000);

    // カメラを作成
    // FOV:90 = 35mmLens: 18mm
    const camera = new PerspectiveCamera(90, 1.0, 1, 10000);
    camera.position.set(0, 0, 1000);

    this.camera = camera;

    {
      // 箱を作成
      const geometry = new PlaneGeometry(
        LENGTH * 2,
        LENGTH * 2,
        SEGMENT,
        SEGMENT
      );
      const material = new MeshStandardMaterial({
        color: new Color().setHSL(0, 0, 0.5),
        // flatShading: true
        wireframe: true
      });
      const box = new Mesh(geometry, material);
      box.position.y = -200;
      box.rotateX(-Math.PI / 2);
      scene.add(box);
      this.box = box;
    }

    // 平行光源を生成
    const light = new DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    scene.add(light);

    noise.seed(0);

    const lines = [];
    const maxLines = 75;
    new Array(maxLines).fill(0).forEach((el, j) => {
      {
        const material = new LineBasicMaterial({
          color: new Color().setHSL(0.4 + (j / maxLines) * 0.2, 1.0, 0.75),
          linewidth: 10
        });
        const geometry = new Geometry();

        const max = 400;
        new Array(max).fill(0).forEach((el, i) => {
          geometry.vertices.push(
            new Vector3((max / 2 - i) * 5, 0, (j - maxLines / 2) * 30)
          );
        });

        const line = new Line(geometry, material);

        scene.add(line);

        lines.push(line);
      }
    });
    this.lines = lines;

    const p = new ParticleContainer(1);
    this.scene.add(p);
    this.particleContainer = p;

    window.addEventListener("resize", event => {
      this.resize();
    });
    this.resize();

    this.tick(0);
  }

  tick(delta) {
    requestAnimationFrame(delta => {
      this.tick(delta);
    });

    {
      const geometry = this.box.geometry as PlaneGeometry;
      const vertices = geometry.vertices;

      vertices.forEach((vertex, index) => {
        const col = index % (SEGMENT + 1);
        const row = Math.floor(index / (SEGMENT + 1));

        const z = noise.perlin3(col / 50, row / 50, delta / 5000) * 200;

        vertex.setZ(z);
      });
      geometry.verticesNeedUpdate = true;
    }

    this.lines.forEach((line, j) => {
      const geometry = line.geometry as Geometry;
      const vertices = geometry.vertices;

      vertices.forEach((vertex, i) => {
        const y = noise.perlin3(i / 50, delta / 10000 + j * 300, 0) * 100;

        vertex.setY(y);
      });
      geometry.verticesNeedUpdate = true;
    });

    // this.particleContainer.update();

    // 描画
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    // サイズを取得
    const width = window.innerWidth;
    const height = window.innerHeight;

    // レンダラーのサイズを調整する
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);

    // カメラのアスペクト比を正す
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
