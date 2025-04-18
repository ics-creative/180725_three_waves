import { defineConfig } from 'vite';

export default defineConfig({
  // プロジェクトルートディレクトリ
  root: '.',
  // ビルド成果物の出力先ディレクトリ
  build: {
    outDir: 'docs',
  },
  server: {
    // 開発サーバー起動時にブラウザを開く
    open: true
  }
});
