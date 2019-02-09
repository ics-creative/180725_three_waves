import { World } from "./view3d/World";
import * as dat from "dat.gui";
import { DebugInfo } from "./view3d/data/DebugInfo";

let world: World;
let worker: any;
let enabledOffscreenCanvas =
  "transferControlToOffscreen" in document.createElement("canvas");
const USE_DEBUG: boolean = false;

// ------------------------------------
// デバッグのための情報を定義
// ------------------------------------
// カスタマイズパラメーターの定義
const visibleInfo = new DebugInfo();
const _debugInfo = visibleInfo;
if (USE_DEBUG) {
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

// DOM構築後に実行開始
window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  const params = {
    visibleInfo
  };
  const size = {
    type: "resize",
    width: innerWidth,
    height: innerHeight,
    devicePixelRatio: devicePixelRatio
  };
  if (enabledOffscreenCanvas === true) {
    // Workerを作成し、OffscreenCanvasを渡す
    worker = new Worker("./worker.js");

    const offscreenCanvas = canvas["transferControlToOffscreen"]();
    worker.postMessage(
      {
        type: "init",
        // Canvas要素の描画コントロールをOffscreenCanvasに委譲する
        canvas: offscreenCanvas,
        ...params
      },
      [offscreenCanvas]
    );

    worker.postMessage(size);
  } else {
    // コンテンツを再生します。
    world = new World({
      // 普通のCanvas要素を送る
      canvas: canvas,
      ...params
    });
    world.resize(size);
  }
});

window.addEventListener("resize", event => {
  const size = {
    type: "resize",
    width: innerWidth,
    height: innerHeight,
    devicePixelRatio: devicePixelRatio
  };

  if (enabledOffscreenCanvas === true) {
    worker.postMessage(size);
  } else {
    world.resize(size);
  }
});
