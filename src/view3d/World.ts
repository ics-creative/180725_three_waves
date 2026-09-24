import { DirectionalLight, Fog, PerspectiveCamera, Scene, SRGBColorSpace, Vector3 } from "three";
import { WebGPURenderer } from "three/webgpu";
import { Inspector } from "three/addons/inspector/Inspector.js";

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
  public readonly ready: Promise<void>;
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
  private _motionEnabled = true;
  private _isPlaying: boolean;
  private _initialized = false;
  private _animationTime = Date.now();
  private _canvas: HTMLCanvasElement;
  private _lastTimestamp: number | null = null;
  private readonly onFrame = (timestamp: number) => this.tick(timestamp);

  constructor({
    canvas,
    visibleInfo,
    enabledMotion,
    autoPlay = true,
    inspectorEnabled = true,
  }: {
    canvas: HTMLCanvasElement;
    visibleInfo: DebugInfo;
    enabledMotion: boolean;
    autoPlay?: boolean;
    inspectorEnabled?: boolean;
  }) {
    this._debugInfo = visibleInfo;
    this._motionEnabled = enabledMotion;
    this._isPlaying = autoPlay;
    this._canvas = canvas;

    // ------------------------------------
    // 3Dの初期化
    // ------------------------------------
    {
      // シーンを作成
      const scene = new Scene();
      scene.name = "Three.js Waves";
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

    this.ready = this.init(inspectorEnabled);
  }

  private async init(inspectorEnabled: boolean) {
    await TextureManager.init();

    // レンダラーを作成
    this.renderer = new WebGPURenderer({
      antialias: false,
      // 黒背景を不透明にし、透明キャンバスの合成方法による明度の変化を防ぐ。
      alpha: false,
      canvas: this._canvas,
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
        await mesh.ready;
        this.scene.add(mesh);
        objects.bg = mesh;
      }

      {
        // パーティクルを作成
        const group = new DustParticleGroup(5000, -200, +500, 200);
        this.scene.add(group);
        objects.dustParticleGroup = group;
      }
    }

    this.scene.onBeforeRender = () => this._objects.waveLines?.prepare(this.camera, this.scene);
    this.renderer.setTransparentSort((a, b) => {
      const waves = this._objects.waveLines!;
      // 同じ深度では、元の波線が背景・粒子より先に作られていた順序も保つ。
      const aId = a.object!.parent === waves ? waves.id : a.id!;
      const bId = b.object!.parent === waves ? waves.id : b.id!;
      return (
        a.groupOrder! - b.groupOrder! || a.renderOrder! - b.renderOrder! || b.z! - a.z! || aId - bId
      );
    });
    if (inspectorEnabled) this.initInspector();
    this._initialized = true;
    this._animationTime = Date.now();
    await this.renderer.setAnimationLoop(this._isPlaying ? this.onFrame : null);
  }

  /** 初期化前の呼び出しも保持し、停止位置から描画を再開する。 */
  public play(): void {
    if (this._isPlaying) return;
    this._isPlaying = true;
    this._lastTimestamp = null;
    this._needRender = true;
    if (this._initialized) void this.renderer.setAnimationLoop(this.onFrame);
  }

  /** 最後の画像を残し、アプリの更新・描画コールバックを停止する。 */
  public pause(): void {
    if (!this._isPlaying) return;
    this._isPlaying = false;
    this._lastTimestamp = null;
    if (this._initialized) void this.renderer.setAnimationLoop(null);
  }

  public get isPlaying(): boolean {
    return this._initialized && this._isPlaying;
  }

  private initInspector(): void {
    const inspector = new Inspector();
    this.renderer.inspector = inspector;

    const parameters = inspector.createParameters("Display");

    for (const key of Object.keys(this._debugInfo) as (keyof DebugInfo)[]) {
      parameters.add(this._debugInfo, key).onChange(() => {
        this._needRender = true;
      });
    }

    inspector.hide();
  }

  private tick(timestamp: number): void {
    if (!this._isPlaying) return;
    // デルタタイムを計算
    let deltaTime = 0;
    if (this._lastTimestamp !== null) {
      // タブ復帰時の長い空白を一度に処理しない。
      deltaTime = Math.min((timestamp - this._lastTimestamp) / 1000, 0.1);
    }
    this._lastTimestamp = timestamp;

    if (this._needRender) this.updateVisibility();

    // リサイズ処理
    let needsResizeRender = false;
    if (this._needResize) {
      this.resizeCore();
      this._needResize = false;
      needsResizeRender = true;
    }

    let needsAnimationRender = false;
    if (this._motionEnabled) {
      this._animationTime += deltaTime * 1000;
      // カメラ移動
      this.camera.position.x = Math.cos(this._animationTime / 5000) * 500;
      this.camera.position.y = Math.sin(this._animationTime / 5000) * 100 + 50;
      // this.camera.position.z = 0;
      this.camera.lookAt(0, 0, 0);
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
        if (this._debugInfo.waves) this._objects.waveLines.update(this._animationTime);
        if (this._debugInfo.particlesDust) this._objects.dustParticleGroup.update(deltaTime);
        if (this._debugInfo.particlesBig) this._objects.bigParticleGroup.update(deltaTime);
        this._objects.bg.lookAt(this.camera.position);
        needsAnimationRender = true;
      }
    }

    // モーション停止中も、Inspector の操作やリサイズを描画へ反映する。
    if (this._needRender || needsResizeRender || needsAnimationRender) {
      this.renderer.render(this.scene, this.camera);
      this._needRender = false;
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
    this._motionEnabled = enabledMotion;
  }

  private resizeCore() {
    // サイズを取得
    const width = this._width;
    const height = this._height;

    // レンダラーのサイズを調整する
    this.renderer.setPixelRatio(this._devicePixelRatio);
    this.renderer.setSize(width, height, false);

    // カメラのアスペクト比を正す
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // 背景の縦横比を調整
    const sx = width / height;
    const sy = 1.0;
    this._objects.bg?.scale.set(sx, sy, 1.0);
  }

  private updateVisibility(): void {
    const objects = this._objects;
    if (objects.bg) objects.bg.visible = this._debugInfo.bg;
    if (objects.earth) objects.earth.visible = this._debugInfo.earth;
    if (objects.bigParticleGroup) objects.bigParticleGroup.visible = this._debugInfo.particlesBig;
    if (objects.dustParticleGroup)
      objects.dustParticleGroup.visible = this._debugInfo.particlesDust;
    if (objects.waveLines) objects.waveLines.visible = this._debugInfo.waves;
  }
}
