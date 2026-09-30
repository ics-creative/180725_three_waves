import type { DebugInfo } from "./view3d/data/DebugInfo";

/** ページからWorkerへ渡す画面サイズとモーション設定。 */
export interface RenderSize {
  width: number;
  height: number;
  devicePixelRatio: number;
  enabledMotion: boolean;
}

/** ページから描画Workerへ送る指示。 */
export type WorkerRequest =
  | {
      type: "init";
      canvas: OffscreenCanvas;
      visibleInfo: DebugInfo;
      size: RenderSize;
      autoPlay: boolean;
    }
  | { type: "resize"; size: RenderSize }
  | { type: "visibility"; visibleInfo: DebugInfo }
  | { type: "play" | "pause" };

/** 描画Workerからページへ返す初期化結果。 */
export type WorkerResponse = { type: "ready" } | { type: "error"; message: string };
