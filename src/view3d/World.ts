import {
  Color,
  DirectionalLight,
  Fog,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer
} from "three";

import * as noise from "simplenoise";

const SEGMENT = 100;
const LENGTH = 1000;

export class World {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private box: Mesh;

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
    const camera = new PerspectiveCamera(45, 1.0, 1, 10000);
    camera.position.set(0, 0, 1000);
    this.camera = camera;

    // 箱を作成
    const geometry = new PlaneGeometry(
      LENGTH * 2,
      LENGTH * 2,
      SEGMENT,
      SEGMENT
    );
    const material = new MeshStandardMaterial({
      color: new Color().setHSL(0,0,0.5),
      flatShading: true
      // wireframe: true,
    });
    const box = new Mesh(geometry, material);
    box.position.z = -5;
    box.rotateX(-Math.PI / 4);
    scene.add(box);
    this.box = box;

    // 平行光源を生成
    const light = new DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    scene.add(light);

    noise.seed(0);

    window.addEventListener("resize", event => {
      this.resize();
    });
    this.resize();

    this.tick(0);

    console.log((this.box.geometry as PlaneGeometry).vertices);
  }

  tick(delta) {
    requestAnimationFrame(delta => {
      this.tick(delta);
    });

    const geometry = this.box.geometry as PlaneGeometry;
    const vertices = geometry.vertices;

    vertices.forEach((vertex, index) => {
      const col = index % (SEGMENT + 1);
      const row = Math.floor(index / (SEGMENT + 1));

      const z = noise.perlin3(col / 50, row / 50, delta / 5000) * 200;

      vertex.setZ(z);
    });
    geometry.verticesNeedUpdate = true;

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
