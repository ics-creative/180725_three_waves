import { defineConfig } from 'vite';

export default defineConfig({
  // プロジェクトルートディレクトリ
  root: '.',
  // ビルド成果物の出力先ディレクトリ
  build: {
    outDir: 'docs',
    // Web Worker用の設定
    rollupOptions: {
      input: {
        main: './index.html', // メインのエントリーポイント
        worker: './src/worker.ts' // Workerのエントリーポイント
      },
      output: {
        // Workerファイルを別々に出力する設定
        entryFileNames: assetInfo => {
          return assetInfo.name === 'worker' ? 'worker.js' : 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    }
  },
  server: {
    // 開発サーバー起動時にブラウザを開く
    open: true
  }
}); 