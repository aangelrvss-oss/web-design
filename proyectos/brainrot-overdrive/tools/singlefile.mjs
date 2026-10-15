// Packs dist/ into ONE self-contained HTML fragment (JS, CSS and fonts inlined) for
// previews: open it in a browser or publish it as an artifact. Run `npm run build` first.
// Output: preview/brainrot-overdrive.html (gitignored, like other projects' previews).
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const jsFile = html.match(/src="\.\/(assets\/[^"]+\.js)"/)[1];
const cssFile = html.match(/href="\.\/(assets\/[^"]+\.css)"/)[1];
let css = fs.readFileSync(path.join(dist, cssFile), 'utf8');
// fonts → data URIs (only latin subsets are needed for the game's text)
css = css.replace(/@font-face\{[^}]*\}/g, (block) => {
  const m = block.match(/url\(\.\/([^)]+\.woff2)\)/);
  if (!m) return block;
  if (!/-latin-(wght|ext)/.test(m[1])) return ''; // drop cyrillic/vietnamese subsets
  const b64 = fs.readFileSync(path.join(dist, 'assets', m[1])).toString('base64');
  return block.replace(m[0], `url(data:font/woff2;base64,${b64})`);
});
const js = fs.readFileSync(path.join(dist, jsFile), 'utf8').replace(/<\/script/gi, '<\\/script');
const inlineStyle = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];

const out = `<title>BRAINROT OVERDRIVE</title>
<meta name="theme-color" content="#07040f">
<style>${inlineStyle}
html,body{background:#07040f;color:#f4ecff;color-scheme:dark}
${css}</style>
${body.trim()}
<script type="module">${js}</script>
`;
fs.mkdirSync('preview', { recursive: true });
const file = path.join('preview', 'brainrot-overdrive.html');
fs.writeFileSync(file, out);
console.log(`${file} ${(out.length / 1048576).toFixed(2)} MB`);
