import { World } from "./view3d/World";
import * as ImageTitle from "./assets/title.png";

// DOM構築後に実行開始
window.addEventListener("DOMContentLoaded", () => {
  // コンテンツを再生します。
  new World();

  const title = document.createElement("img");
  title.src = ImageTitle;
  title.width = 400;
  title.height = 160;
  title.id = "mainTitle";
  document.body.appendChild(title);

  setTimeout(() => {
    title.classList.add("show");
  }, 100);
});
