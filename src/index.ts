import * as dat from "dat.gui";
import { DebugInfo } from "./view3d/data/DebugInfo";

let world: any;
let worker: any;
const enabledOffscreenCanvas =
  "transferControlToOffscreen" in document.createElement("canvas");

const USE_DEBUG: boolean = false;

// ------------------------------------
// デバッグのための情報を定義
// ------------------------------------
// カスタマイズパラメーターの定義
const visibleInfo = new DebugInfo();
if (USE_DEBUG) {
  // GUIパラメータの準備
  const gui = new dat.GUI();
  gui.add(visibleInfo, "bg");
  gui.add(visibleInfo, "earth");
  gui.add(visibleInfo, "particles");
  gui.add(visibleInfo, "clouds");
  gui.add(visibleInfo, "waves");
  gui.closed = true; // 閉じておく
}

// DOM構築後に実行開始
window.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  const params = {
    visibleInfo,
  };
  if (enabledOffscreenCanvas) {
    // Workerを作成し、OffscreenCanvasを渡す
    worker = new Worker("./worker.js");

    const offscreenCanvas = canvas.transferControlToOffscreen();
    worker.postMessage(
      {
        type: "init",
        // Canvas要素の描画コントロールをOffscreenCanvasに委譲する
        canvas: offscreenCanvas,
        ...params,
      },
      [offscreenCanvas]
    );

    worker.postMessage(createSizeObject());
  } else {
    // @ts-ignore
    const { World } = await import("./view3d/World");
    // コンテンツを再生します。
    world = new World({
      // 普通のCanvas要素を送る
      canvas: canvas,
      ...params,
    });
    world.resize(createSizeObject());
  }
});

window.addEventListener("resize", (event) => {
  if (enabledOffscreenCanvas) {
    worker.postMessage(createSizeObject());
  } else {
    world.resize(createSizeObject());
  }
});

const createSizeObject = (): {
  width: number;
  type: "resize";
  devicePixelRatio: number;
  height: number;
} => ({
  type: "resize",
  width: innerWidth,
  height: innerHeight,
  devicePixelRatio: devicePixelRatio,
});
