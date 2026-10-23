// Prepara un clip para la secuencia de la portada. El original no se toca.
//
//   node tools/video/prepare.mjs <clip.mp4>            inspecciona y codifica
//   node tools/video/prepare.mjs <clip.mp4> --inspect  solo inspecciona
//   node tools/video/prepare.mjs <clip.mp4> --portrait solo la versión vertical
//
// 1. Inspección: formato, duración, resolución, fps, tamaño, intervalo real
//    entre fotogramas clave, cortes de escena detectados y una hoja de
//    contactos (assets-src/video/) para decidir tiempos, encuadres y lados del
//    texto en src/film.mjs.
// 2. Codificación para scrub, no para reproducción: un único archivo a la
//    resolución de origen, GOP denso, alta calidad, etiquetas de color del
//    original, sin audio. Más VP9 para navegadores sin H.264.
// 3. Póster (primer fotograma) y un fotograma fijo por escena, en WebP a
//    resolución completa, para la carga, el movimiento reducido y el fallo.
// 3b. Versión vertical para móvil (FILM.portrait): recorte del original a su
//    resolución que sigue un recorrido de cámara, con su póster y una hoja de
//    contactos del recorrido para revisarlo.
// 4. film.json con la duración real: build.mjs convierte con ella los tiempos
//    de las escenas en ventanas de scroll.
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FILM } from '../../src/film.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const proj = resolve(here, '../..');
const out = join(proj, 'site/assets/film');
const lab = join(proj, 'assets-src/video');

const input = process.argv[2];
const inspectOnly = process.argv.includes('--inspect');
const portraitOnly = process.argv.includes('--portrait');
if (!input || !existsSync(input)) {
  console.error('uso: node tools/video/prepare.mjs <clip.mp4> [--inspect]');
  process.exit(1);
}
mkdirSync(out, { recursive: true });
mkdirSync(lab, { recursive: true });

const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const mb = (f) => (statSync(f).size / 1048576).toFixed(2) + ' MB';

function probe(file) {
  const j = JSON.parse(run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file]));
  const v = j.streams.find((s) => s.codec_type === 'video');
  const [n, d] = (v.avg_frame_rate || v.r_frame_rate).split('/').map(Number);
  // Fotogramas clave reales: el scrub depende de ellos, no de lo que diga el contenedor.
  const keys = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-skip_frame', 'nokey', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', file])
    .trim().split('\n').map(Number).filter((x) => !Number.isNaN(x));
  const gaps = keys.slice(1).map((t, i) => t - keys[i]);
  return {
    file: basename(file),
    codec: v.codec_name, profile: v.profile, pixfmt: v.pix_fmt,
    color: { space: v.color_space, primaries: v.color_primaries, transfer: v.color_transfer, range: v.color_range },
    width: v.width, height: v.height, fps: +(n / d).toFixed(3),
    duration: +Number(j.format.duration).toFixed(3),
    frames: Number(v.nb_frames) || null,
    bitrateKbps: Math.round(Number(j.format.bit_rate) / 1000),
    sizeMB: +(Number(j.format.size) / 1048576).toFixed(2),
    audio: j.streams.some((s) => s.codec_type === 'audio'),
    keyframes: keys.length,
    // Con un solo fotograma clave, el hueco es el clip entero.
    maxKeyGapS: gaps.length ? +Math.max(...gaps).toFixed(3) : +Number(j.format.duration).toFixed(3),
  };
}

const src = probe(input);
console.log('Original:', src);

// Cortes de escena (cambio brusco de imagen) para contrastar con los tiempos de film.mjs.
// showinfo escribe en stderr, de ahí el 2>&1.
const cutTimes = run('bash', ['-c', `ffmpeg -hide_banner -i "$1" -vf "select='gt(scene,0.28)',showinfo" -an -f null - 2>&1 | grep -o 'pts_time:[0-9.]*' | cut -d: -f2`, '_', input])
  .trim().split('\n').filter(Boolean).map((x) => +Number(x).toFixed(2));
console.log('Cortes detectados (s):', cutTimes.length ? cutTimes.join(', ') : 'ninguno');

// Hoja de contactos: un fotograma cada medio segundo con su tiempo impreso.
const step = Math.max(src.duration / 32, 0.25);
const sheet = join(lab, `contactos-${basename(input).replace(/\.[^.]+$/, '')}.jpg`);
run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-vf',
  `fps=1/${step.toFixed(3)},scale=400:-2,drawtext=text='%{pts\\:hms}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile=4x8:padding=4:color=white`,
  '-frames:v', '1', '-q:v', '3', sheet]);
console.log('Hoja de contactos:', sheet);
writeFileSync(join(lab, 'inspeccion.json'), JSON.stringify({ source: src, sceneCuts: cutTimes, contactSheetStepS: +step.toFixed(3) }, null, 2) + '\n');

if (inspectOnly) process.exit(0);

// ---- versión vertical (móvil) -------------------------------------------
// Centro del recorte en función del tiempo: tramos con curva coseno entre los
// puntos de FILM.portrait.path, limitados a los bordes del original.
const P = FILM.portrait;
const cropX = () => {
  const pts = P.path, maxX = src.width - P.w;
  const seg = (i) => {
    const [t0, c0] = pts[i], [t1, c1] = pts[i + 1];
    return `${c0}+(${c1 - c0})*(0.5-0.5*cos(PI*(t-${t0})/${t1 - t0}))`;
  };
  let e = String(pts[pts.length - 1][1]);
  for (let i = pts.length - 2; i >= 0; i--) e = `if(lt(t,${pts[i + 1][0]}),${seg(i)},${e})`;
  return `clip((${e})-${P.w / 2},0,${maxX})`;
};
const cropF = () => `crop=w=${P.w}:h=${src.height}:x='${cropX()}':y=0`;
function encodePortrait() {
  const fpsP = Math.round(src.fps) || 24, gopP = Math.max(2, Math.round(fpsP / 6));
  const tagP = [...(src.color.space ? ['-colorspace', src.color.space] : []), ...(src.color.primaries ? ['-color_primaries', src.color.primaries] : []),
    ...(src.color.transfer ? ['-color_trc', src.color.transfer] : []), ...(src.color.range ? ['-color_range', src.color.range] : [])];
  const mp4 = join(out, 'film-v.mp4'), wbm = join(out, 'film-v.webm');
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-an', '-vf', cropF(), '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'veryslow', '-crf', '17',
    '-g', String(gopP), '-keyint_min', String(gopP), '-sc_threshold', '0', ...tagP, '-movflags', '+faststart', mp4]);
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-an', '-vf', cropF(), '-pix_fmt', 'yuv420p',
    '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '26', '-g', String(gopP), '-keyint_min', String(gopP),
    '-row-mt', '1', '-deadline', 'good', '-cpu-used', '1', ...tagP, wbm]);
  // Fidelidad frente al mismo recorte del original.
  const ssimP = (f) => +Number(run('bash', ['-c', `ffmpeg -hide_banner -i "$1" -i "$2" -lavfi "[1:v]$3,settb=1/${fpsP},setpts=N[a];[0:v]settb=1/${fpsP},setpts=N[b];[a][b]ssim" -f null - 2>&1 | grep -o 'All:[0-9.]*' | cut -d: -f2`, '_', f, input, cropF()]).trim()).toFixed(4);
  // Póster vertical: el mismo primer fotograma, recortado igual que el clip.
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-vf', cropF(), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '90', '-compression_level', '6', join(out, 'poster-v.webp')]);
  // Hoja de contactos del recorrido: dónde cae el recorte en cada momento.
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', mp4, '-vf',
    `fps=2,scale=160:-2,drawtext=text='%{pts\\:hms}':x=4:y=4:fontsize=12:fontcolor=white:box=1:boxcolor=black@0.6,tile=10x2:padding=4:color=white`,
    '-frames:v', '1', '-q:v', '3', join(lab, 'recorte-movil.jpg')]);
  const e = probe(mp4);
  return {
    w: e.width, h: e.height, media: P.media,
    mp4: { file: 'film-v.mp4', sizeMB: e.sizeMB, maxKeyGapS: e.maxKeyGapS, ssim: ssimP(mp4) },
    webm: { file: 'film-v.webm', sizeMB: +(statSync(wbm).size / 1048576).toFixed(2), ssim: ssimP(wbm) },
  };
}
if (portraitOnly) {
  const metaFile = join(out, 'film.json');
  const meta = JSON.parse(readFileSync(metaFile, 'utf8'));
  meta.portrait = encodePortrait();
  writeFileSync(metaFile, JSON.stringify(meta, null, 2) + '\n');
  console.log('Vertical:', meta.portrait);
  process.exit(0);
}

// Codificación para scrub: un solo archivo para todos los dispositivos.
// - Resolución de origen, nunca ampliada (un 720p llevado a 1080p pesa más y
//   no gana detalle) ni reducida para móvil: a pantalla completa un teléfono
//   necesita toda la que hay.
// - Un fotograma clave cada 1/6 s (GOP 4 a 24 fps): el móvil busca rápido y
//   el escritorio también.
// - Calidad alta (H.264 CRF 17, VP9 CRF 26): SSIM >= 0,993 frente al original.
// - Mismas etiquetas de color que el original, sin conversión.
// - Sin audio (se recorre, no se reproduce) y con faststart.
const film = join(out, 'film.mp4');
const webm = join(out, 'film.webm');
const fps = Math.round(src.fps) || 24;
const h = Math.min(1080, src.height);
const gop = Math.max(2, Math.round(fps / 6));
const tag = (c) => [
  ...(c.space ? ['-colorspace', c.space] : []),
  ...(c.primaries ? ['-color_primaries', c.primaries] : []),
  ...(c.transfer ? ['-color_trc', c.transfer] : []),
  ...(c.range ? ['-color_range', c.range] : []),
];
const scale = src.height > h ? ['-vf', `scale=-2:${h}:flags=lanczos`] : [];
run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-an', ...scale, '-pix_fmt', 'yuv420p',
  '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'veryslow', '-crf', '17',
  '-g', String(gop), '-keyint_min', String(gop), '-sc_threshold', '0', ...tag(src.color), '-movflags', '+faststart', film]);
// Alternativa VP9 para los navegadores sin H.264 (Chromium libre, algunos
// Firefox de Linux). film.js elige el formato antes de que el motor pida el clip.
run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-an', ...scale, '-pix_fmt', 'yuv420p',
  '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '26', '-g', String(gop), '-keyint_min', String(gop),
  '-row-mt', '1', '-deadline', 'good', '-cpu-used', '1', ...tag(src.color), webm]);

// Fidelidad medida, fotograma a fotograma (misma base de tiempo en ambos: el
// WebM redondea los tiempos al milisegundo y sin esto empareja mal).
const ssim = (f) => {
  const r = run('bash', ['-c', `ffmpeg -hide_banner -i "$1" -i "$2" -lavfi "[0:v]scale=${src.width}:${src.height}:flags=bicubic,settb=1/${fps},setpts=N[a];[1:v]settb=1/${fps},setpts=N[b];[a][b]ssim" -f null - 2>&1 | grep -o 'All:[0-9.]*' | cut -d: -f2`, '_', f, input]);
  return +Number(r.trim()).toFixed(4);
};

// Póster y fotogramas fijos, sacados del original a su resolución completa.
// El póster es el primer fotograma: el vídeo lo sustituye sin salto.
const still = (t, file) => run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(t), '-i', input,
  '-frames:v', '1', '-c:v', 'libwebp', '-quality', '90', '-compression_level', '6', file]);
still(0, join(out, 'poster.webp'));
for (const s of FILM.scenes) still(Math.min(s.still ?? s.t0 + (s.t1 - s.t0) * 0.55, src.duration - 0.05), join(out, `still-${s.key}.webp`));

const enc = probe(film);
const meta = {
  source: src.file,
  sourceInfo: { width: src.width, height: src.height, fps: src.fps, bitrateKbps: src.bitrateKbps, keyframes: src.keyframes, color: src.color },
  duration: enc.duration,
  width: enc.width, height: enc.height, fps: enc.fps,
  mp4: { file: 'film.mp4', sizeMB: enc.sizeMB, maxKeyGapS: enc.maxKeyGapS, ssim: ssim(film) },
  webm: { file: 'film.webm', sizeMB: +(statSync(webm).size / 1048576).toFixed(2), ssim: ssim(webm) },
  sceneCuts: cutTimes,
  portrait: encodePortrait(),
};
writeFileSync(join(out, 'film.json'), JSON.stringify(meta, null, 2) + '\n');
console.log('MP4:', film, mb(film), `GOP máx. ${enc.maxKeyGapS}s`, `SSIM ${meta.mp4.ssim}`);
console.log('WebM:', webm, mb(webm), `SSIM ${meta.webm.ssim}`);
console.log('Vertical:', meta.portrait);
console.log('Ahora: revisar la hoja de contactos, ajustar src/film.mjs y ejecutar node src/build.mjs');
