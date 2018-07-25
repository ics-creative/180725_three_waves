module.exports = {
  mode: 'development',
  // 出力フォルダー
  output: {
    path: __dirname + '/docs',
  },
  module: {
    rules: [
      {
        // 拡張子 .ts の場合
        test: /\.ts$/,
        // TypeScript をコンパイルする
        use: "ts-loader"
      },
      {
        // 対象となるファイルの拡張子
        test: /\.(jpg|png)$/,
        // 画像をBase64として取り込む
        loader: 'url-loader'
      }

    ]
  },
  // import 文で .ts ファイルを解決するため
  resolve: {
    extensions: [
      ".ts", ".js", ".json"
    ],
  },
  devtool: 'source-map',
  serve: {
    open: true,
    content: 'docs/',
    port: 5000
  },
};
