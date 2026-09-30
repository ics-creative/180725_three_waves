import type { DebugInfo } from "./view3d/data/DebugInfo";
import type { RenderSize, WorkerRequest, WorkerResponse } from "./worker-protocol";
import type { Tab } from "three/addons/inspector/ui/Tab.js";

/** Worker内のWebGPUシーンを操作するためのインターフェース。 */
export interface ThreeWavesControls {
  /** レンダラーとシーン素材の初期化が完了すると解決する。 */
  readonly ready: Promise<void>;
  /** 初期化が完了し、アニメーションが再生中かどうか。 */
  readonly isPlaying: boolean;
  /** 現在のシーン状態からアニメーションを再開する。 */
  play(): void;
  /** 最後の描画を残してアニメーションを停止する。 */
  pause(): void;
}

declare global {
  interface Window {
    threeWaves: ThreeWavesControls;
  }
}

const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

// ------------------------------------
// デバッグのための情報を定義
// ------------------------------------
// カスタマイズパラメーターの定義
const visibleInfo: DebugInfo = {
  bg: true,
  earth: true,
  particlesBig: true,
  particlesDust: true,
  waves: true,
};

let renderWorker: Worker | undefined;
let playRequested = true;
let initialized = false;

/** Workerに渡す画面サイズとモーション設定を取得する。 */
const createSizeObject = (): RenderSize => ({
  width: innerWidth,
  height: innerHeight,
  devicePixelRatio,
  enabledMotion: !mediaQuery.matches,
});

/** Workerの描画サイズとモーション設定の案内を更新する。 */
const resize = (): void => {
  const size = createSizeObject();
  renderWorker?.postMessage({ type: "resize", size } satisfies WorkerRequest);
  document.querySelector(".reduceMotionWarn")?.toggleAttribute("hidden", size.enabledMotion);
};

/** Three.js InspectorのParametersをWorkerの表示設定に接続する。 */
async function initInspector(worker: Worker): Promise<void> {
  const { Inspector } = await import("three/addons/inspector/Inspector.js");
  const inspector = new Inspector();
  const controls = inspector.createParameters("Display");

  for (const key of Object.keys(visibleInfo) as (keyof DebugInfo)[]) {
    controls.add(visibleInfo, key).onChange(() => {
      worker.postMessage({
        type: "visibility",
        visibleInfo: { ...visibleInfo },
      } satisfies WorkerRequest);
    });
  }

  // レンダラーを参照する計測タブはWorker越しに使えないため、Parametersだけを残す。
  const { parameters, profiler } = inspector as typeof inspector & {
    parameters: Tab;
    profiler: { tabs: Record<string, Tab>; togglePanel(): void };
  };
  for (const tab of Object.values(profiler.tabs)) {
    if (tab !== parameters) inspector.removeTab(tab);
  }

  document.body.append(inspector.domElement);
  inspector.setActiveTab(parameters);
  profiler.togglePanel();
}

/** キャンバスをWorkerに渡し、WebGPUの初期化完了を待つ。 */
async function init(): Promise<void> {
  if (document.readyState === "loading") {
    await new Promise<void>((resolve) => {
      document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
    });
  }

  const canvas = document.querySelector<HTMLCanvasElement>("#mainCanvas");
  if (!canvas) throw new Error("Three.js Waves: #mainCanvas was not found.");

  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const offscreen = canvas.transferControlToOffscreen();
  const worker = new Worker(new URL("./render.worker.ts", import.meta.url), { type: "module" });
  renderWorker = worker;

  const ready = new Promise<void>((resolve, reject) => {
    worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type === "ready") {
        initialized = true;
        resolve();
      } else if (event.data.type === "error") {
        reject(new Error(event.data.message));
      }
    });
    worker.addEventListener("error", (event) => reject(event.error ?? new Error(event.message)), {
      once: true,
    });
  });

  worker.postMessage(
    {
      type: "init",
      canvas: offscreen,
      visibleInfo: { ...visibleInfo },
      size: createSizeObject(),
      autoPlay: playRequested,
    } satisfies WorkerRequest,
    [offscreen],
  );
  resize();
  await Promise.all([
    ready,
    new URLSearchParams(location.search).get("inspector") === "true"
      ? initInspector(worker)
      : Promise.resolve(),
  ]);
  window.dispatchEvent(new Event("three-waves-ready"));
}

window.addEventListener("resize", resize);
mediaQuery.addEventListener("change", resize);

window.threeWaves = Object.freeze({
  ready: init(),
  get isPlaying() {
    return initialized && playRequested;
  },
  play() {
    playRequested = true;
    renderWorker?.postMessage({ type: "play" } satisfies WorkerRequest);
  },
  pause() {
    playRequested = false;
    renderWorker?.postMessage({ type: "pause" } satisfies WorkerRequest);
  },
});

/** 埋め込み元のページから再生・停止の指示を受け取る。 */
window.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (event.source !== window.parent) return;
  const data = event.data;
  if (
    typeof data !== "object" ||
    data === null ||
    !("type" in data) ||
    data.type !== "three-waves" ||
    !("action" in data)
  )
    return;
  if (data.action === "pause") window.threeWaves.pause();
  if (data.action === "play") window.threeWaves.play();
});
