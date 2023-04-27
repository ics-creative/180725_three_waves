module.exports = {
  mode: 'development',
  entry: {
    main: './src/index.ts',
    worker: './src/worker.ts',
  },
  // 出力フォルダー
  output: {
    path: __dirname + '/docs',
    // 出力ファイル名
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        // 拡張子 .ts の場合
        test: /\.ts$/,
        // TypeScript をコンパイルする
        use: 'ts-loader',
      },
      {
        // 対象となるファイルの拡張子
        test: /\.(gif|png|jpg|eot|wof|woff|ttf|svg)$/,
        // 画像をBase64として取り込む
        type: 'asset/inline',
      },
    ],
  },
  // import 文で .ts ファイルを解決するため
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  // ローカル開発用環境を立ち上げる
  // 実行時にブラウザが自動的に localhost を開く
  devServer: {
    static: 'docs/',
    open: true,
  },
  // ES5(IE11等)向けの指定
  target: ['web', 'es5'],
};
