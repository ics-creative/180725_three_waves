import {
  DirectionalLight,
  Fog,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
} from "three";
import { WebGPURenderer } from "three/webgpu";

import { BigParticleGroup } from "./particles/BigParticleGroup";
import { DustParticleGroup } from "./objects/DustParticleGroup";
import { DebugInfo } from "./data/DebugInfo";

import { Earth, LENGTH } from "./objects/Earth";
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
  private renderer!: WebGPURenderer;
  private readonly _objects: IThreeObjects;
  private readonly _debugInfo: DebugInfo;
  private _needResize = false;
  private _needRender = true;
  private _width = 960;
  private _height = 540;
  private _devicePixelRatio = 1;
  private _reducedMotionPreferred: boolean = true;
  private _canvas: OffscreenCanvas | HTMLCanvasElement;
  private _lastTimestamp: number | null = null;

  constructor({
    canvas,
    visibleInfo,
    enabledMotion,
  }: {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    visibleInfo: DebugInfo;
    enabledMotion: boolean;
  }) {
    this._debugInfo = visibleInfo;
    this._reducedMotionPreferred = enabledMotion;
    this._canvas = canvas;

    // Three.jsで使用する場合、内部でstyle.widthにアクセスするため指定する
    (canvas as any).style = { width: 0, height: 0 };

    // ------------------------------------
    // 3Dの初期化
    // ------------------------------------
    {
      // シーンを作成
      const scene = new Scene();
      this.scene = scene;
      scene.fog = new Fog(0x000000, 200, 4000);

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

    // レンダラーを作成
    this.renderer = new WebGPURenderer({
      antialias: false,
      canvas: this._canvas as HTMLCanvasElement,
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    await this.renderer.init();

    // ------------------------------------
    // 3D上の登場人物を配置
    // ------------------------------------
    {
      const objects = this._objects;

      {
        // 地面を作成
        const mesh = new Earth();
        mesh.position.y = -200;
        mesh.position.z = -LENGTH + 500;
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

    this.tick = this.tick.bind(this);
    // テクスチャーの転送が終わっていないのでやむなく
    setTimeout(() => {
      this.tick(0);
    }, 16);
  }

  private _count = 0;
  private tick(timestamp: number): void {
    requestAnimationFrame(this.tick);

    // デルタタイムを計算
    let deltaTime = 0;
    if (this._lastTimestamp !== null) {
      deltaTime = (timestamp - this._lastTimestamp) / 1000;
    } else {
      deltaTime = 1 / 60; // 初回デフォルト
    }
    this._lastTimestamp = timestamp;

    // リサイズ処理
    let needsResizeRender = false;
    if (this._needResize) {
      this.resizeCore();
      this._needResize = false;
      needsResizeRender = true;
    }

    let needsAnimationRender = false;
    if (this._reducedMotionPreferred === true) {
      // カメラ移動
      this.camera.position.x = Math.cos(Date.now() / 5000) * 500;
      this.camera.position.y = Math.sin(Date.now() / 5000) * 100 + 50;
      // this.camera.position.z = 0;
      this.camera.lookAt(new Vector3(0, 0, 0));
      needsAnimationRender = true;

      // オブジェクト更新 (null チェックを含む)
      if (
        this._objects.bg &&
        this._objects.bigParticleGroup &&
        this._objects.dustParticleGroup &&
        this._objects.earth &&
        this._objects.waveLines
      ) {
        if (this._debugInfo.earth) this._objects.earth.update(deltaTime);
        if (this._debugInfo.waves) this._objects.waveLines.update(deltaTime);
        if (this._debugInfo.particlesDust)
          this._objects.dustParticleGroup.update(deltaTime);
        if (this._debugInfo.particlesBig)
          this._objects.bigParticleGroup.update(deltaTime);
        this._objects.bg.lookAt(this.camera.position);
        needsAnimationRender = true;

        // 表示有無更新
        if (this._debugInfo) {
          this._objects.bg.visible = this._debugInfo.bg;
          this._objects.bigParticleGroup.visible = this._debugInfo.particlesBig;
          this._objects.dustParticleGroup.visible =
            this._debugInfo.particlesDust;
          this._objects.earth.visible = this._debugInfo.earth;
          this._objects.waveLines.visible = this._debugInfo.waves;
        }
      }
    }

    // 描画: リサイズがあった場合、またはアニメーションが実行された場合
    if (needsResizeRender || needsAnimationRender) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public resize({
    width,
    height,
    devicePixelRatio,
    enabledMotion,
  }: {
    width: number;
    devicePixelRatio: number;
    height: number;
    enabledMotion: boolean;
  }): void {
    this._width = width;
    this._height = height;
    this._devicePixelRatio = devicePixelRatio;
    this._needResize = true;
    this._needRender = true;
    this._reducedMotionPreferred = enabledMotion;
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

  /**
   * デバッグ情報を更新します。
   * メインスレッドの dat.gui からの変更を反映するために使用されます。
   * @param newInfo 更新された DebugInfo オブジェクト
   */
  public updateDebugInfo(newInfo: DebugInfo): void {
    // Note: オブジェクト全体を置き換えるか、プロパティごとにコピーするかは設計次第。
    //       今回はシンプルに全体を置き換える。
    Object.assign(this._debugInfo, newInfo);
    // 更新後、すぐに表示に反映させるためにレンダリングを要求する
    this._needRender = true;
  }
}
