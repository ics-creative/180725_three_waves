import { World } from "./view3d/World";

// DOM構築後に実行開始
window.addEventListener("DOMContentLoaded", () => {
  // コンテンツを再生します。
  new World();
});
