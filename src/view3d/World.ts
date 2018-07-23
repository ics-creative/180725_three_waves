import {
  AdditiveBlending,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  PlaneBufferGeometry,
  PlaneGeometry,
  Scene,
  TextureLoader,
  Vector3,
  WebGLRenderer
} from "three";

import * as noise from "simplenoise";
import { ParticleContainer } from "./particles/ParticleContainer";
import { ParticleCloud } from "./particle-cloud";
import { WaveLine } from "./lines/WaveLine";

const SEGMENT = 100;
const LENGTH = 5000;

export class World {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private earth: Mesh;
  private lines: WaveLine[];
  private particleContainer: ParticleContainer;
  private cloud: ParticleCloud;

  constructor() {
    // レンダラーを作成
    const renderer = new WebGLRenderer();
    this.renderer = renderer;
    // canvasをbodyに追加
    document.body.appendChild(renderer.domElement);

    // シーンを作成
    const scene = new Scene();
    this.scene = scene;
    // scene.fog = new Fog(0x000000, 50, 2000);

    // カメラを作成
    // FOV:90 = 35mmLens: 18mm
    const camera = new PerspectiveCamera(30, 1.0, 1, 100000);
    camera.position.set(0, 100, 1000);
    camera.lookAt(new Vector3(0, 0, 0));

    this.camera = camera;

    {
      // 箱を作成
      const geometry = new PlaneGeometry(
        LENGTH * 2,
        LENGTH * 2,
        SEGMENT,
        SEGMENT
      );
      const material = new MeshPhongMaterial({
        color: new Color().setHSL(0.75, 0.8, 0.2),
        // flatShading: true,
        blending: AdditiveBlending,
        wireframe: true
      });
      const box = new Mesh(geometry, material);
      box.position.y = -200;
      box.rotateX(-Math.PI / 2);
      box.rotateZ(Math.PI / 3);
      scene.add(box);
      this.earth = box;
    }

    // 平行光源を生成
    const light = new DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    scene.add(light);

    noise.seed(0);

    const lines = [];
    const maxLines = 15;
    new Array(maxLines).fill(0).forEach((el, j) => {
      {
        const line = new WaveLine(
          j,
          maxLines,
          Math.max(1, Math.round(j ** 3 / 80))
        );
        scene.add(line);
        lines.push(line);
      }
    });
    this.lines = lines;

    const p = new ParticleContainer(1);
    this.scene.add(p);
    this.particleContainer = p;

    {
      // 背景を作成
      const geometory = new PlaneBufferGeometry(20000, 20000);
      const material = new MeshBasicMaterial({
        map: new TextureLoader().load("bg.png")
      });

      const mesh = new Mesh(geometory, material);
      mesh.position.setZ(-20000);

      scene.add(mesh);
    }

    {
      // パーティクルを作成
      const cloud = new ParticleCloud(10, -500, +1000);
      scene.add(cloud);
      this.cloud = cloud;
    }

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
      const geometry = this.earth.geometry as PlaneGeometry;
      const vertices = geometry.vertices;

      vertices.forEach((vertex, index) => {
        const col = index % (SEGMENT + 1);
        const row = Math.floor(index / (SEGMENT + 1));

        const z = noise.perlin3(col / 50, row / 50, delta / 10000) * 200;

        vertex.setZ(z);
      });
      geometry.verticesNeedUpdate = true;
    }

    this.lines.forEach((line, j) => {
      line.update(delta, noise, j);
    });

    this.cloud.update();
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
