// Builds the standalone demo (single-phone mode + guide). Fonts are inlined as data
// URIs; scripts/build-demo.mjs then folds JS and CSS into one HTML file.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./src/client', import.meta.url)),
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('./dist/demo-build', import.meta.url)),
    emptyOutDir: true,
    target: 'es2020',
    assetsInlineLimit: 10_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { input: fileURLToPath(new URL('./src/client/demo.html', import.meta.url)) },
  },
});
