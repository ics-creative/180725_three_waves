import { World } from "./view3d/World";
import type { WorkerRequest, WorkerResponse } from "./worker-protocol";

const worker = self as unknown as {
  postMessage(message: WorkerResponse): void;
  addEventListener(type: "message", listener: (event: MessageEvent<WorkerRequest>) => void): void;
};

// ページはinitを先に送るため、後続の指示ではworldが初期化済みになる。
let world: World;

/** 渡されたキャンバス上にWebGPUシーンを作り、初期化完了を通知する。 */
async function initialize(message: Extract<WorkerRequest, { type: "init" }>): Promise<void> {
  world = new World({
    canvas: message.canvas,
    visibleInfo: message.visibleInfo,
    enabledMotion: message.size.enabledMotion,
    autoPlay: message.autoPlay,
  });
  world.resize(message.size);
  await world.ready;
  worker.postMessage({ type: "ready" });
}

/** ページからの指示をWorker内のシーンに適用する。 */
worker.addEventListener("message", ({ data }) => {
  switch (data.type) {
    case "init":
      void initialize(data).catch((error: unknown) => {
        worker.postMessage({
          type: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      });
      break;
    case "resize":
      world.resize(data.size);
      break;
    case "visibility":
      world.updateDebugInfo(data.visibleInfo);
      break;
    case "play":
      world.play();
      break;
    case "pause":
      world.pause();
      break;
  }
});
