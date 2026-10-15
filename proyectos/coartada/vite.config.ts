import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const serverPort = Number(process.env.SERVER_PORT ?? 3000);

export default defineConfig({
  root: fileURLToPath(new URL('./src/client', import.meta.url)),
  publicDir: fileURLToPath(new URL('./src/client/public', import.meta.url)),
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('./dist/client', import.meta.url)),
    emptyOutDir: true,
    target: 'es2020',
    assetsInlineLimit: 0,
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/socket.io': { target: `http://127.0.0.1:${serverPort}`, ws: true },
      '/healthz': { target: `http://127.0.0.1:${serverPort}` },
    },
  },
});
