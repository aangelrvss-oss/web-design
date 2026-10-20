// Builds the standalone demo (single-phone mode + guide). Fonts are inlined as data
// URIs; scripts/build-demo.mjs then folds JS and CSS into one HTML file.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./src/client', import.meta.url)),
  publicDir: false,
  plugins: [react()],
  // The demo is offline-only: keep the network client out of the bundle.
  resolve: { alias: { 'socket.io-client': fileURLToPath(new URL('./src/client/net/no-socket.ts', import.meta.url)) } },
  // Only the 720 px case illustrations go into the single file (src/client/ui/ambience.tsx).
  define: { 'import.meta.env.VITE_SCENE_PHOTOS': JSON.stringify('small') },
  build: {
    outDir: fileURLToPath(new URL('./dist/demo-build', import.meta.url)),
    emptyOutDir: true,
    // Older iPhones / in-app browsers too.
    target: ['es2019', 'safari13', 'chrome80'],
    assetsInlineLimit: 10_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { input: fileURLToPath(new URL('./src/client/demo.html', import.meta.url)) },
  },
});
