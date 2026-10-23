// Prepara un clip para la secuencia de la portada. El original no se toca.
//
//   node tools/video/prepare.mjs <clip.mp4>            inspecciona y codifica
//   node tools/video/prepare.mjs <clip.mp4> --inspect  solo inspecciona
//
// 1. Inspección: formato, duración, resolución, fps, tamaño, intervalo real
//    entre fotogramas clave, cortes de escena detectados y una hoja de
//    contactos (assets-src/video/) para decidir tiempos, encuadres y lados del
//    texto en src/film.mjs.
// 2. Codificación para scrub, no para reproducción (ajustes del encode.sh de
//    Scroll-craft: GOP denso, sin audio, faststart), sin ampliar el original.
// 3. Póster (primer fotograma útil) y un fotograma fijo por escena, en WebP,
//    para la carga, el movimiento reducido y el fallo de vídeo.
// 4. film.json con la duración real: build.mjs convierte con ella los tiempos
//    de las escenas en ventanas de scroll.
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FILM } from '../../src/film.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const proj = resolve(here, '../..');
const out = join(proj, 'site/assets/film');
const lab = join(proj, 'assets-src/video');

const input = process.argv[2];
const inspectOnly = process.argv.includes('--inspect');
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

// Codificación para scrub. Mismos ajustes que el encode.sh de Scroll-craft
// (x264 high, preset slow, GOP fijo sin cortes por escena, sin audio,
// faststart) pero sin ampliar nunca el original: un 720p llevado a 1080p pesa
// más y no gana detalle. Escritorio: resolución de origen hasta 1080p, un
// fotograma clave cada 1/4 s. Móvil: hasta 540p, cada 1/6 s.
const desk = join(out, 'film.mp4');
const mob = join(out, 'film-m.mp4');
const fps = Math.round(src.fps) || 24;
const hDesk = Math.min(1080, src.height);
const hMob = Math.min(540, src.height);
const gDesk = Math.max(2, Math.round(fps / 4));
const gMob = Math.max(2, Math.round(fps / 6));
const h264 = (file, h, gop, crf) => run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-an',
  '-vf', `scale=-2:${h}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow',
  '-crf', String(crf), '-g', String(gop), '-keyint_min', String(gop), '-sc_threshold', '0', '-movflags', '+faststart', file]);
h264(desk, hDesk, gDesk, 21);
h264(mob, hMob, gMob, 24);
// Alternativa VP9 para los navegadores sin H.264 (Chromium libre, algunos
// Firefox de Linux). Mismo GOP denso; film.js elige el formato antes de que el
// motor pida el clip.
const vp9 = (file, h, gop, crf) => run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-an',
  '-vf', `scale=-2:${h}:flags=lanczos,format=yuv420p`, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(crf),
  '-g', String(gop), '-keyint_min', String(gop), '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', file]);
vp9(join(out, 'film.webm'), hDesk, gDesk, 33);
vp9(join(out, 'film-m.webm'), hMob, gMob, 36);

// Póster y fotogramas fijos, sacados del original (no de una recodificación).
// El póster es el fotograma con el que abre el acto, así que no hay salto
// cuando el vídeo lo sustituye. Cada escena puede fijar su fotograma (still).
const wDesk = Math.min(1600, src.width);
const still = (t, w, file) => run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(t), '-i', input,
  '-frames:v', '1', '-vf', `scale=${w}:-2:flags=lanczos`, '-c:v', 'libwebp', '-quality', '80', '-compression_level', '6', file]);
still(0, wDesk, join(out, 'poster.webp'));
still(0, Math.min(960, wDesk), join(out, 'poster-m.webp'));
for (const s of FILM.scenes) {
  const t = Math.min(s.still ?? s.t0 + (s.t1 - s.t0) * 0.55, src.duration - 0.05);
  still(t, wDesk, join(out, `still-${s.key}.webp`));
  still(t, Math.min(960, wDesk), join(out, `still-${s.key}-m.webp`));
}

const enc = probe(desk);
const encM = probe(mob);
const meta = {
  source: src.file,
  duration: enc.duration,
  width: enc.width, height: enc.height, fps: enc.fps,
  desktop: { file: 'film.mp4', sizeMB: enc.sizeMB, maxKeyGapS: enc.maxKeyGapS },
  mobile: { file: 'film-m.mp4', width: encM.width, height: encM.height, sizeMB: encM.sizeMB, maxKeyGapS: encM.maxKeyGapS },
  webm: { desktopMB: +(statSync(join(out, 'film.webm')).size / 1048576).toFixed(2), mobileMB: +(statSync(join(out, 'film-m.webm')).size / 1048576).toFixed(2) },
  sceneCuts: cutTimes,
};
writeFileSync(join(out, 'film.json'), JSON.stringify(meta, null, 2) + '\n');
console.log('Escritorio:', desk, mb(desk), `GOP máx. ${enc.maxKeyGapS}s`);
console.log('Móvil:', mob, mb(mob), `GOP máx. ${encM.maxKeyGapS}s`);
console.log('Ahora: revisar la hoja de contactos, ajustar src/film.mjs y ejecutar node src/build.mjs');
