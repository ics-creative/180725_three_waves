import {
  DirectionalLight,
  Fog,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer
} from "three";

import { BigParticleGroup } from "./particles/BigParticleGroup";
import { DustParticleGroup } from "./objects/DustParticleGroup";
import { DebugInfo } from "./data/DebugInfo";

import { Earth } from "./objects/Earth";
import { WaveLines } from "./lines/WaveLines";
import { BackGround } from "./objects/BackGround";
import { TextureManager } from "./TextureManager";

/**
 * 空間の登場人物を管理するためのインターフェースです。
 */
interface IThreeObjects {
  /** 地面 */
  earth: Earth;
  /** 背景 */
  bg: BackGround;
  /** 波模様 */
  waveLines: WaveLines;
  /** 画面中央に発生するでかい粒子 */
  bigParticleGroup: BigParticleGroup;
  /** 塵のように発生する微粒子 */
  dustParticleGroup: DustParticleGroup;
}

/**
 * メインの3D管理クラスです。
 */
export class World {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;

  private _objects: IThreeObjects;
  private _debugInfo: DebugInfo;
  private _needResize: boolean = false;
  private _width: number;
  private _height: number;
  private _devicePixelRatio: number;

  constructor({ canvas, visibleInfo }) {
    this._debugInfo = visibleInfo;

    // Three.jsで使用する場合、内部でstyle.widthにアクセスするため指定する
    canvas.style = { width: 0, height: 0 };

    this.init({ canvas, visibleInfo });
  }

  private async init({ canvas, visibleInfo }) {
    await TextureManager.init();

    // ------------------------------------
    // 3Dの初期化
    // ------------------------------------
    {
      // レンダラーを作成
      this.renderer = new WebGLRenderer({
        antialias: false,
        canvas
      });

      // シーンを作成
      const scene = new Scene();
      this.scene = scene;
      scene.fog = new Fog(0x000000, 50, 3500);

      // カメラを作成
      // FOV:90 = 35mmLens: 18mm
      const camera = new PerspectiveCamera(30, 1.0, 1, 100000);
      camera.position.set(0, 50, 1000);
      camera.lookAt(new Vector3(0, 0, 0));
      this.camera = camera;

      // 平行光源を生成
      const light = new DirectionalLight(0xffffff);
      light.position.set(1, 1, 1);
      scene.add(light);
    }

    // ------------------------------------
    // 3D上の登場人物を配置
    // ------------------------------------
    {
      const objects: IThreeObjects = {
        earth: null,
        bg: null,
        waveLines: null,
        bigParticleGroup: null,
        dustParticleGroup: null
      };
      this._objects = objects;

      {
        // 地面を作成
        const mesh = new Earth();
        mesh.position.y = -200;
        mesh.rotateX(-Math.PI / 2);
        mesh.rotateZ(Math.PI / 3);
        this.scene.add(mesh);
        objects.earth = mesh;
      }

      {
        // 波線を作成
        const group = new WaveLines();
        this.scene.add(group);
        objects.waveLines = group;
      }

      {
        // パーティクル群を作成
        const group = new BigParticleGroup(2);
        this.scene.add(group);
        objects.bigParticleGroup = group;
      }

      {
        // 背景を作成
        const mesh = new BackGround();
        this.scene.add(mesh);
        objects.bg = mesh;
      }

      {
        // パーティクルを作成
        const group = new DustParticleGroup(10000, -200, +500, 200);
        this.scene.add(group);
        objects.dustParticleGroup = group;
      }
    }

    this.tick(0);
  }

  private tick(delta: number): void {
    requestAnimationFrame(delta => {
      this.tick(delta);
    });

    {
      // カメラを動かす
      this.camera.position.x = Math.cos(Date.now() / 3000) * 50;
      this.camera.position.y = Math.sin(Date.now() / 5000) * 100 + 50;
      this.camera.lookAt(new Vector3(0, 0, 0));
    }

    {
      // 登場人物の更新
      this._objects.earth.update(delta); // 地面のうねうね
      this._objects.waveLines.update(delta); // 波のうねうね
      this._objects.dustParticleGroup.update(delta); // 昇天する粒子
      this._objects.bigParticleGroup.update(delta); // 昇天する粒子

      this._objects.bg.lookAt(this.camera.position); // 背景はカメラに向ける
    }

    // 表示有無を更新
    if (this._debugInfo) {
      this._objects.bg.visible = this._debugInfo.bg;
      this._objects.bigParticleGroup.visible = this._debugInfo.particles;
      this._objects.dustParticleGroup.visible = this._debugInfo.clouds;
      this._objects.earth.visible = this._debugInfo.earth;
      this._objects.waveLines.visible = this._debugInfo.waves;
    }

    if (this._needResize === true) {
      this.resizeCore();
      this._needResize = false;
    }

    // 描画
    this.renderer.render(this.scene, this.camera);
  }

  public resize({ width, height, devicePixelRatio }): void {
    console.log(this);
    this._width = width;
    this._height = height;
    this._devicePixelRatio = devicePixelRatio;
    this._needResize = true;
    console.log(width, height, devicePixelRatio);
  }

  private resizeCore() {
    // サイズを取得
    const width = this._width;
    const height = this._height;

    // レンダラーのサイズを調整する
    console.log(this.renderer);
    this.renderer.setPixelRatio(this._devicePixelRatio);
    this.renderer.setSize(width, height);

    // カメラのアスペクト比を正す
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // 背景の縦横比を調整
    const sx = width / height;
    const sy = 1.0;
    this._objects.bg.scale.set(sx, sy, 1.0);
  }
}
