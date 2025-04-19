import * as dat from "dat.gui";
import { DebugInfo } from "./view3d/data/DebugInfo";

let worker: Worker;

const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const USE_DEBUG = true;

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
  title: true,
};
if (USE_DEBUG) {
  // GUIパラメータの準備
  const gui = new dat.GUI();

  // 変更: ループを使ってコントローラーとリスナーを追加
  Object.keys(visibleInfo).forEach((key) => {
    gui.add(visibleInfo, key as keyof DebugInfo).onChange(() => {
      worker?.postMessage({
        type: "updateVisibleInfo",
        visibleInfo: visibleInfo,
      });
    });
  });

  gui.closed = true; // 閉じておく
}

// DOM構築後に実行開始
window.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.querySelector("#mainCanvas") as HTMLCanvasElement;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Workerを作成し、OffscreenCanvasを渡す
  worker = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });

  const offscreenCanvas = canvas.transferControlToOffscreen();
  worker.postMessage(
    {
      type: "init",
      canvas: offscreenCanvas,
      visibleInfo,
    },
    [offscreenCanvas],
  );

  resize(); // 初回リサイズ呼び出し
});

const resize = () => {
  const obj = createSizeObject();
  worker.postMessage(obj);

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
  type: "resize";
  devicePixelRatio: number;
  height: number;
  enabledMotion: boolean;
} => ({
  type: "resize",
  width: innerWidth,
  height: innerHeight,
  devicePixelRatio: devicePixelRatio,
  enabledMotion: !Boolean(mediaQuery?.matches),
});

// .offscreenMessage の表示制御
{
  const dom = document.querySelector(".offscreenMessage");

  dom?.removeAttribute("hidden");
}
