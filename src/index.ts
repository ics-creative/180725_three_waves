import { World } from "./view3d/World";
import { DebugInfo } from "./view3d/data/DebugInfo";

let world: World | undefined;
let playRequested = true;

export interface ThreeWavesControls {
  /** レンダラーと画像の初期化完了。失敗時はrejectする。 */
  readonly ready: Promise<void>;
  readonly isPlaying: boolean;
  play(): void;
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

// 後からスクリプトを読み込む組み込み先でも初期化する。
async function init(): Promise<void> {
  if (document.readyState === "loading") {
    await new Promise<void>((resolve) => {
      document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
    });
  }

  const canvas = document.querySelector<HTMLCanvasElement>("#mainCanvas");
  if (!canvas) throw new Error("Three.js Waves: #mainCanvas が見つかりません。");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  world = new World({
    canvas,
    visibleInfo,
    enabledMotion: !mediaQuery.matches,
    autoPlay: playRequested,
    inspectorEnabled: new URLSearchParams(location.search).get("inspector") !== "false",
  });

  resize(); // 初回リサイズ呼び出し
  await world.ready;
  window.dispatchEvent(new Event("three-waves-ready"));
}

const resize = () => {
  const obj = createSizeObject();
  world?.resize(obj);

  // .reduceMotionWarn の表示制御は維持
  const dom = document.querySelector(".reduceMotionWarn");
  if (!obj.enabledMotion) {
    dom?.removeAttribute("hidden");
  } else {
    dom?.setAttribute("hidden", "true");
  }
};

window.addEventListener("resize", resize);
mediaQuery.addEventListener("change", resize);

// createSizeObject は enabledMotion を返す
const createSizeObject = (): {
  width: number;
  devicePixelRatio: number;
  height: number;
  enabledMotion: boolean;
} => ({
  width: innerWidth,
  height: innerHeight,
  devicePixelRatio: devicePixelRatio,
  enabledMotion: !Boolean(mediaQuery?.matches),
});

window.threeWaves = Object.freeze({
  ready: init(),
  get isPlaying() {
    return world?.isPlaying ?? false;
  },
  play() {
    playRequested = true;
    world?.play();
  },
  pause() {
    playRequested = false;
    world?.pause();
  },
});

// 別オリジンのiframeとして組み込む場合の制御窓口。
const parentOrigins = new Set([location.origin, "https://ics-web.jp", "https://www.ics-web.jp"]);
window.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (event.source !== window.parent || !parentOrigins.has(event.origin)) return;
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
