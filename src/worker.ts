import { World } from "./view3d/World";

onmessage = event => {
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
function init(data) {
  // コンテンツを再生します。
  world = new World(data);
}

function resize(data) {
  world.resize(data);
}
