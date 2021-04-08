import { World } from "./view3d/World";
import { DebugInfo } from "./view3d/data/DebugInfo";

onmessage = (event) => {
  switch (event.data.type) {
    case "init":
      init(event.data);
      break;
    case "resize":
      resize(event.data);
      break;
  }
};

let world: World;
const init = (data: { canvas: OffscreenCanvas; visibleInfo: DebugInfo }) => {
  // コンテンツを再生します。
  world = new World(data);
};

const resize = (data: {
  width: number;
  type: "resize";
  devicePixelRatio: number;
  height: number;
  enabledMotion: boolean;
}) => {
  world.resize(data);
};
