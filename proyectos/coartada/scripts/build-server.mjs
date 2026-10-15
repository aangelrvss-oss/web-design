// Bundles the server (engine + content + socket.io) into one ESM file: dist/server.mjs.
// Production then needs only Node and the dist/ folder.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/server/main.ts'],
  outfile: 'dist/server.mjs',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  sourcemap: true,
  legalComments: 'none',
  // Optional native speedups of `ws`; it falls back to JS when they are absent.
  external: ['bufferutil', 'utf-8-validate'],
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
});
console.log('dist/server.mjs built');
