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

Inspectorは起動時のURLに `?inspector=false` を付けるとOFFになります。未指定または `?inspector=true` でONです。
iframeの場合は `src` に指定してください。OFF時はInspectorのUI・計測を初期化しません。

## 関連リポジトリ

- https://github.com/ics-creative/151118_createjs_title
- https://github.com/ics-creative/180725_two_waves
