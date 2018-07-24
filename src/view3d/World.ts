import {
  AdditiveBlending,
  Color,
  DirectionalLight,
  Fog,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  TextureLoader,
  Vector3,
  WebGLRenderer
} from "three";

import * as noise from "simplenoise";
import { ParticleContainer } from "./particles/ParticleContainer";
import { ParticleCloud } from "./ParticleCloud";
import { WaveLine } from "./lines/WaveLine";

const SEGMENT = 200;
const LENGTH = 4000;

export class World {
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private _meshEarth: Mesh;
  private _meshBg: Mesh;
  private lines: WaveLine[];
  private particleContainer: ParticleContainer;
  private cloud: ParticleCloud;

  constructor() {
    // レンダラーを作成
    const renderer = new WebGLRenderer({
      antialias: devicePixelRatio === 1.0
    });
    this.renderer = renderer;
    // canvasをbodyに追加
    document.body.appendChild(renderer.domElement);

    // シーンを作成
    const scene = new Scene();
    this.scene = scene;
    scene.fog = new Fog(0x000000, 50, 4000);

    // カメラを作成
    // FOV:90 = 35mmLens: 18mm
    const camera = new PerspectiveCamera(30, 1.0, 1, 100000);
    camera.position.set(0, 50, 1000);
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
        color: new Color().setHSL(0.75, 0.75, 0.5),
        blending: AdditiveBlending,
        wireframe: true
      });
      const mesh = new Mesh(geometry, material);
      mesh.position.y = -200;
      mesh.rotateX(-Math.PI / 2);
      mesh.rotateZ(Math.PI / 3);
      scene.add(mesh);
      this._meshEarth = mesh;
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
          Math.max(1, Math.round(j ** 3 / 60))
        );
        scene.add(line);
        lines.push(line);
      }
    });
    this.lines = lines;

    const p = new ParticleContainer(2);
    this.scene.add(p);
    this.particleContainer = p;

    {
      // 背景を作成
      const geometry = new PlaneGeometry(700, 700);
      const material = new MeshBasicMaterial({
        map: new TextureLoader().load("bg.png"),
        blending: AdditiveBlending,
        transparent: true,
        depthTest: false,
        depthWrite: false
      });

      const mesh = new Mesh(geometry, material);
      // mesh.position.setZ(+750);

      scene.add(mesh);
      this._meshBg = mesh;
    }

    {
      // パーティクルを作成
      const cloud = new ParticleCloud(10000, -200, +500, 200);
      scene.add(cloud);
      this.cloud = cloud;
    }

    window.addEventListener("resize", event => {
      this.resize();
    });
    this.resize();

    this.tick(0);
  }

  private tick(delta): void {
    requestAnimationFrame(delta => {
      this.tick(delta);
    });

    // 地面のうねうね
    {
      const geometry = this._meshEarth.geometry as PlaneGeometry;
      const vertices = geometry.vertices;

      vertices.forEach((vertex, index) => {
        const col = index % (SEGMENT + 1);
        const row = Math.floor(index / (SEGMENT + 1));

        const z = noise.perlin3(col / 20, row / 20, delta / 5000) * 200;

        vertex.setZ(z);
      });
      geometry.verticesNeedUpdate = true;
    }

    this.lines.forEach((line, j) => {
      line.update(delta, noise, j);
    });

    this.cloud.update();

    // カメラを動かす
    this.camera.position.x = Math.cos(Date.now() / 3000) * 50;
    this.camera.position.y = Math.sin(Date.now() / 2000) * 50 + 25;
    this.camera.lookAt(new Vector3(0, 0, 0));

    this._meshBg.lookAt(this.camera.position);

    // 描画
    this.renderer.render(this.scene, this.camera);
  }

  private resize(): void {
    // サイズを取得
    const width = window.innerWidth;
    const height = window.innerHeight;

    // レンダラーのサイズを調整する
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);

    // カメラのアスペクト比を正す
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // 背景の縦横比を調整
    const sx = width / height;
    const sy = 1.0;
    this._meshBg.scale.set(sx, sy, 1.0);
  }
}
