# ICSのヒーロースペース

https://ics-web.jp/ で掲載されている3D表現のコードです。  
本番サイトで利用しているものです。

再生はこちらからどうぞ

- https://ics-creative.github.io/180725_three_waves/

## 外部からの制御

本体スクリプトの読み込み後、表示中の描画を操作できます。初期状態は自動再生です。

```js
window.threeWaves.pause(); // 描画を停止
window.threeWaves.play(); // 停止位置から再開
window.threeWaves.isPlaying; // 再生状態
await window.threeWaves.ready; // 初期化完了を待つ
```

`pause()` / `play()` は初期化完了前にも呼び出せます。OSの「視差効果を減らす」設定を尊重します。

描画とアニメーション計算は Web Worker 内で実行します。HTML の canvas を OffscreenCanvas として Worker に渡し、Worker 内で WebGPU バックエンドを初期化します。WebGPU 専用のため WebGL2 には切り替えません。WebGPU の初期化に失敗した場合、`ready` は reject します。

`?inspector=true` を付けると Three.js Inspector の「Parameters」で各要素の表示を切り替えられます。設定は Worker に送られ、描画は Worker 内のままです。レンダラーの計測タブは Worker 内のレンダラーに接続できないため表示しません。

## 関連リポジトリ

- https://github.com/ics-creative/151118_createjs_title
- https://github.com/ics-creative/180725_two_waves
