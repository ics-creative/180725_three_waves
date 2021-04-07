import {
  DirectionalLight,
  Fog,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
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
  earth: Earth | null;
  /** 背景 */
  bg: BackGround | null;
  /** 波模様 */
  waveLines: WaveLines | null;
  /** 画面中央に発生するでかい粒子 */
  bigParticleGroup: BigParticleGroup | null;
  /** 塵のように発生する微粒子 */
  dustParticleGroup: DustParticleGroup | null;
}

/**
 * メインの3D管理クラスです。
 */
export class World {
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private _objects: IThreeObjects;
  private readonly _debugInfo: DebugInfo;
  private _needResize = false;
  private _width = 960;
  private _height = 540;
  private _devicePixelRatio = 1;

  constructor({
    canvas,
    visibleInfo,
  }: {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    visibleInfo: DebugInfo;
  }) {
    this._debugInfo = visibleInfo;

    // Three.jsで使用する場合、内部でstyle.widthにアクセスするため指定する
    if (canvas instanceof OffscreenCanvas) {
      (canvas as any).style = { width: 0, height: 0 };
    }

    // ------------------------------------
    // 3Dの初期化
    // ------------------------------------
    {
      // レンダラーを作成
      this.renderer = new WebGLRenderer({
        antialias: false,
        canvas,
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
    const objects: IThreeObjects = {
      earth: null,
      bg: null,
      waveLines: null,
      bigParticleGroup: null,
      dustParticleGroup: null,
    };
    this._objects = objects;

    this.init();
  }

  private async init() {
    await TextureManager.init();

    // ------------------------------------
    // 3D上の登場人物を配置
    // ------------------------------------
    {
      const objects = this._objects;

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
        const group = new BigParticleGroup(1);
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

  private _count = 0;
  private tick(delta: number): void {
    requestAnimationFrame((delta) => {
      this.tick(delta);
    });

    if (this._count++ % 2 === 0) {
      return;
    }

    {
      // カメラを動かす
      this.camera.position.x = Math.cos(Date.now() / 3000) * 50;
      this.camera.position.y = Math.sin(Date.now() / 5000) * 100 + 50;
      this.camera.lookAt(new Vector3(0, 0, 0));
    }

    // TypeScriptの型絞り込みのため
    if (!this._objects.bg) {
      return;
    }
    if (!this._objects.bigParticleGroup) {
      return;
    }
    if (!this._objects.dustParticleGroup) {
      return;
    }
    if (!this._objects.earth) {
      return;
    }
    if (!this._objects.waveLines) {
      return;
    }

    {
      // 登場人物の更新
      if (this._debugInfo.bg) this._objects.earth.update(delta); // 地面のうねうね
      if (this._debugInfo.waves) this._objects.waveLines.update(delta); // 波のうねうね
      if (this._debugInfo.clouds) this._objects.dustParticleGroup.update(delta); // 昇天する粒子
      if (this._debugInfo.particles)
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

  public resize({
    width,
    height,
    devicePixelRatio,
  }: {
    width: number;
    devicePixelRatio: number;
    height: number;
  }): void {
    this._width = width;
    this._height = height;
    this._devicePixelRatio = devicePixelRatio;
    this._needResize = true;
  }

  private resizeCore() {
    // サイズを取得
    const width = this._width;
    const height = this._height;

    // レンダラーのサイズを調整する
    this.renderer.setPixelRatio(this._devicePixelRatio);
    this.renderer.setSize(width, height);

    // カメラのアスペクト比を正す
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // 背景の縦横比を調整
    const sx = width / height;
    const sy = 1.0;
    this._objects.bg?.scale.set(sx, sy, 1.0);
  }
}
