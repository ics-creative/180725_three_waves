import {
  DirectionalLight,
  Fog,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer
} from "three";
import * as dat from "dat.gui";

import { BigParticleGroup } from "./particles/BigParticleGroup";
import { DustParticleGroup } from "./objects/DustParticleGroup";
import { DebugInfo } from "./data/DebugInfo";

import { Earth } from "./objects/Earth";
import { WaveLines } from "./lines/WaveLines";
import { BackGround } from "./objects/BackGround";
import { Dummy } from "./objects/Dummy";

const USE_DEBUG: boolean = false;

/**
 * 空間の登場人物を管理するためのインターフェースです。
 */
interface IThreeObjects {
  /** 地面 */
  earth: Earth;
  /** 背景 */
  bg: BackGround;
  /** 波模様 */
  waveLines: Dummy;
  /** 画面中央に発生するでかい粒子 */
  bigParticleGroup: BigParticleGroup;
  /** 塵のように発生する微粒子 */
  dustParticleGroup: DustParticleGroup;
}

/**
 * メインの3D管理クラスです。
 */
export class World {
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly renderer: WebGLRenderer;

  private readonly _objects: IThreeObjects;
  private readonly _debugInfo: DebugInfo;
  private _needResize: boolean = false;

  constructor() {
    // ------------------------------------
    // デバッグのための情報を定義
    // ------------------------------------
    // カスタマイズパラメーターの定義
    const visibleInfo = new DebugInfo();
    this._debugInfo = visibleInfo;
    if (USE_DEBUG === true) {
      // GUIパラメータの準備
      const gui = new dat.GUI();
      gui.add(visibleInfo, "bg");
      gui.add(visibleInfo, "earth");
      gui.add(visibleInfo, "particles");
      gui.add(visibleInfo, "clouds");
      gui.add(visibleInfo, "waves");
      gui.add(visibleInfo, "title").onChange(flag => {
        // 強引に参照
        const title = document.querySelector("#mainTitle") as HTMLElement;
        // 表示を切り替える
        title.className = flag ? "show" : "";
      });
      gui.closed = true; // 閉じておく
    }

    // ------------------------------------
    // 3Dの初期化
    // ------------------------------------
    {
      // レンダラーを作成
      this.renderer = new WebGLRenderer({
        antialias: false,
        canvas: document.querySelector("canvas")
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
        const group = new Dummy();
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
        const group = new DustParticleGroup(1000, -200, +500, 200);
        this.scene.add(group);
        objects.dustParticleGroup = group;
      }
    }

    window.addEventListener("resize", event => {
      this.resize();
    });
    this.resize();

    this.tick(0);
  }

  private _count = 0;

  private tick(delta: number): void {
    requestAnimationFrame(delta => {
      this.tick(delta);
    });

    if (this._count++ % 3 !== 0) {
      return;
    }

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

  private resize(): void {
    this._needResize = true;
  }
  private resizeCore() {
    // サイズを取得
    const width = window.innerWidth;
    const height = window.innerHeight;

    // レンダラーのサイズを調整する
    this.renderer.setPixelRatio(1);
    // this.renderer.setPixelRatio(window.devicePixelRatio);
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
