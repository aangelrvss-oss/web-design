// npm run build:demo → two self-contained files (JS, CSS and fonts inlined, no server):
//   dist/coartada-un-movil.html   full document: open from disk or any static host
//   dist/coartada-artifact.html   same page without the document skeleton (claude.ai artifacts add it)
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

execSync('npx vite build --config vite.demo.config.ts', { stdio: 'inherit' });
const dir = 'dist/demo-build/assets';
const files = readdirSync(dir);
const stray = files.filter((f) => !f.endsWith('.js') && !f.endsWith('.css'));
if (stray.length) throw new Error(`assets were not inlined: ${stray.join(', ')}`);
const read = (ext) => files.filter((f) => f.endsWith(ext)).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
const css = read('.css');
// Escape raw control/invisible characters (a minifier can emit them inside strings);
// some viewers and sanitizers choke on them.
const js = read('.js')
  .replace(/<\/script/gi, '<\\/script')
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

const meta = `<title>Coartada</title>
<meta name="description" content="Coartada: juego de deducción social. Versión de un solo móvil y guía rápida.">`;
const style = `<style>${css}</style>`;
const body = `<div id="root"></div>\n<script type="module">${js}</script>`;

const full = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#171C24">
${meta}
${style}
</head>
<body>
${body}
</body>
</html>
`;
writeFileSync('dist/coartada-un-movil.html', full);
writeFileSync('dist/coartada-artifact.html', `${meta}\n${style}\n${body}\n`);
console.log(`dist/coartada-un-movil.html (${(full.length / 1024).toFixed(0)} KB) + dist/coartada-artifact.html`);
