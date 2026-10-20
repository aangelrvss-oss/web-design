// Case ambience. Every case has its own scene, loaded as a separate image only when that case is
// played, in order of preference:
//  1. its illustration (assets/scenes/{file}.webp at 1440 px plus {file}-720.webp), once one has
//     been imported (scripts/import-scene.mjs, docs/ESCENAS-higgsfield.md);
//  2. its ink drawing (assets/scenes/{file}.svg);
//  3. the generic scene of its kind of place, drawn inline below.
// A file that fails to load falls through to the next one. All of it is decorative: the case's own
// data (incident, hours, places, evidence) is untouched and always shown as text, and nothing here
// is read by the engine.
import { useState, type ReactNode } from 'react';

const sceneFiles = import.meta.glob<string>('../assets/scenes/*.svg', { eager: true, import: 'default' });
// The single-file demo carries only the 720 px illustrations (vite.demo.config.ts), so it stays light;
// the app serves both sizes as separate files.
const SMALL_ONLY = import.meta.env.VITE_SCENE_PHOTOS === 'small';
const photoFiles = SMALL_ONLY
  ? import.meta.glob<string>('../assets/scenes/*-720.webp', { eager: true, import: 'default' })
  : import.meta.glob<string>('../assets/scenes/*.webp', { eager: true, import: 'default' });

/** Each case's own scene file (without extension). One file per case, never shared: a test checks it. */
export const CASE_SCENE: Record<string, string> = {
  'boda-tarta': 'boda-tarta',
  'piso-gato': 'piso-gato',
  'oficina-aspirador': 'oficina-aspirador',
  'abuela-viral': 'abuela-viral',
  'navidad-amigo-invisible': 'navidad-amigo-invisible',
  'crucero-gorra': 'crucero-gorra',
  'tren-vaho': 'tren-vaho',
  'casa-rural-fantasma': 'casa-rural-fantasma',
  'camping-chanclas': 'camping-chanclas',
  'albergue-sello': 'albergue-sello',
  'vecinos-audio': 'vecinos-audio',
  'verbena-gigante': 'verbena-gigante',
  'escape-candado': 'escape-candado',
  'karaoke-cancion': 'karaoke-cancion',
  'gimnasio-ballenas': 'gimnasio-ballenas',
  'padel-red': 'padel-red',
  'festival-bocata': 'festival-bocata',
  'museo-jabali': 'museo-jabali',
  'rodaje-trufa': 'rodaje-trufa',
  'teatro-corona': 'teatro-corona',
  'biblioteca-arcoiris': 'biblioteca-arcoiris',
  'excursion-jirafa': 'excursion-jirafa',
  'calabaza-selfie': 'calabaza-selfie',
  'observatorio-ovni': 'observatorio-ovni',
  'despedida-video': 'despedida-video',
};

/** URL of the case's own scene, or null when it has none (then the generic scene is drawn). */
export function sceneUrl(scenarioId: string): string | null {
  const file = CASE_SCENE[scenarioId];
  return (file && sceneFiles[`../assets/scenes/${file}.svg`]) || null;
}

export interface ScenePhoto {
  /** 720 px wide: phones. */
  small: string;
  /** 1440 px wide: dense screens and desktop. */
  large: string;
}

/** The case's illustration, when both of its sizes have been imported; otherwise null. */
export function scenePhoto(scenarioId: string, files: Record<string, string> = photoFiles): ScenePhoto | null {
  const file = CASE_SCENE[scenarioId];
  if (!file) return null;
  const small = files[`../assets/scenes/${file}-720.webp`];
  const large = files[`../assets/scenes/${file}.webp`] ?? (SMALL_ONLY ? small : undefined);
  return large && small ? { small, large } : null;
}

export type Ambience = 'fiesta' | 'noche' | 'viaje' | 'trabajo' | 'deporte' | 'cultura';

/** Kind of place of each case: its intro line, and the generic scene used as a fallback. */
export const CASE_AMBIENCE: Record<string, Ambience> = {
  'boda-tarta': 'fiesta',
  'piso-gato': 'fiesta',
  'abuela-viral': 'fiesta',
  'navidad-amigo-invisible': 'fiesta',
  'despedida-video': 'fiesta',
  'calabaza-selfie': 'fiesta',
  'karaoke-cancion': 'noche',
  'festival-bocata': 'noche',
  'verbena-gigante': 'noche',
  'crucero-gorra': 'viaje',
  'tren-vaho': 'viaje',
  'albergue-sello': 'viaje',
  'camping-chanclas': 'viaje',
  'casa-rural-fantasma': 'viaje',
  'oficina-aspirador': 'trabajo',
  'vecinos-audio': 'trabajo',
  'rodaje-trufa': 'trabajo',
  'gimnasio-ballenas': 'deporte',
  'padel-red': 'deporte',
  'excursion-jirafa': 'deporte',
  'escape-candado': 'deporte',
  'museo-jabali': 'cultura',
  'biblioteca-arcoiris': 'cultura',
  'teatro-corona': 'cultura',
  'observatorio-ovni': 'cultura',
};

export const AMBIENCE_INTRO: Record<Ambience, string> = {
  fiesta: 'Una celebración que acabó en expediente.',
  noche: 'La noche iba bien hasta que dejó de ir.',
  viaje: 'Lejos de casa, nadie tiene una coartada cómoda.',
  trabajo: 'Horario de trabajo: todo el mundo vigila a todo el mundo.',
  deporte: 'Mucho sudor, mucha prisa y un misterio.',
  cultura: 'Silencio, por favor: se investiga.',
};

const INK = '#2b2721';
const RED = '#a52a22';
const BLUE = '#2e5b88';
const PAPER = '#efe8d8';
const L = { fill: 'none', stroke: INK, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const SCENES: Record<Ambience, ReactNode> = {
  fiesta: (
    <>
      {/* bunting */}
      <path d="M10 18c50 18 110 18 150 4 40 14 100 14 150-4" {...L} />
      {[30, 62, 94, 126, 194, 226, 258, 290].map((x, i) => (
        <path key={x} d={`M${x - 9} ${22 + (i % 4 === 1 || i % 4 === 2 ? 6 : 2)}l9 16 9-16z`} fill={i % 2 ? RED : PAPER} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      ))}
      {/* cake */}
      <path d="M128 98V74h64v24zM136 74V58h48v16" fill={PAPER} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M128 82c8 5 16 5 21 0s14-5 21 0 15 5 22 0M136 64c8 4 16 4 24 0s16-4 24 0" {...L} />
      <path d="M150 58v-9M160 58v-11M170 58v-9" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M150 46c-2-3 0-6 0-6s2 3 0 6M160 44c-2-3 0-6 0-6s2 3 0 6M170 46c-2-3 0-6 0-6s2 3 0 6" fill={RED} stroke={RED} strokeWidth="1.2" />
      {/* a bite */}
      <path d="M192 74c-4 2-4 7 0 9" fill={PAPER} stroke={INK} strokeWidth="2" />
      {/* balloons and glasses */}
      <ellipse cx="64" cy="62" rx="12" ry="15" fill={RED} stroke={INK} strokeWidth="2" />
      <ellipse cx="84" cy="56" rx="11" ry="14" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M64 77c2 8-3 14 0 22M84 70c-3 9 3 17 0 28" {...L} strokeWidth={1.4} />
      <path d="M236 70l6 18h-12zM236 88v10M228 98h16M262 66l6 22h-12zM262 88v10M254 98h16" {...L} />
      <path d="M232 76h8M258 74h8" stroke={RED} strokeWidth="2" />
    </>
  ),
  noche: (
    <>
      {/* spotlights */}
      <path d="M70 12l40 90H30zM250 12l40 90H210z" fill={INK} opacity="0.08" />
      <path d="M70 12l-40 90M70 12l40 90M250 12l-40 90M250 12l40 90" {...L} strokeWidth={1} strokeDasharray="3 5" />
      {/* microphone on a stand */}
      <rect x="152" y="22" width="16" height="26" rx="8" fill={INK} />
      <path d="M152 33h16M152 39h16" stroke={PAPER} strokeWidth="1.4" />
      <path d="M147 40c0 12 26 12 26 0M160 52v40M146 100l14-8 14 8" {...L} />
      {/* notes */}
      <path d="M100 46v-18l14-4v18" {...L} />
      <ellipse cx="97" cy="47" rx="4" ry="3" fill={RED} />
      <ellipse cx="111" cy="43" rx="4" ry="3" fill={RED} />
      <path d="M212 36v-14" {...L} />
      <ellipse cx="209" cy="37" rx="4" ry="3" fill={INK} />
      {/* skyline */}
      <path d="M10 104V84h18V72h14v32M262 104V80h16V66h20v38" fill="none" stroke={INK} strokeWidth="2" />
      <path d="M16 90h4M34 80h4M268 88h4M284 74h4M290 86h4" stroke={RED} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  viaje: (
    <>
      {/* waves / road */}
      <path d="M10 100c20-8 40-8 60 0s40 8 60 0 40-8 60 0 40 8 60 0 40-8 60 0" {...L} strokeWidth={1.6} />
      {/* suitcase with stickers */}
      <rect x="110" y="42" width="100" height="54" rx="6" fill={PAPER} stroke={INK} strokeWidth="2.4" />
      <path d="M144 42v-8h32v8M110 58h100" {...L} />
      <circle cx="134" cy="76" r="9" fill={RED} stroke={INK} strokeWidth="1.6" />
      <rect x="170" y="66" width="26" height="18" rx="2" fill={BLUE} stroke={INK} strokeWidth="1.6" transform="rotate(-8 183 75)" />
      <path d="M128 76h12M174 74h16" stroke={PAPER} strokeWidth="1.6" />
      {/* ticket */}
      <path d="M232 30h58v26h-58z" fill={PAPER} stroke={INK} strokeWidth="2" transform="rotate(6 261 43)" />
      <path d="M248 36v22" stroke={INK} strokeWidth="1.4" strokeDasharray="2 3" transform="rotate(6 261 43)" />
      <path d="M256 40h26M256 46h18" stroke={RED} strokeWidth="2" transform="rotate(6 261 43)" />
      {/* compass rose */}
      <circle cx="56" cy="48" r="20" {...L} />
      <path d="M56 26l5 22-5 22-5-22z" fill={RED} stroke={INK} strokeWidth="1.4" />
      <path d="M34 48h44" {...L} strokeWidth={1.4} />
    </>
  ),
  trabajo: (
    <>
      {/* desk */}
      <path d="M20 96h280" {...L} />
      {/* lamp */}
      <path d="M60 96h30M75 96V62l22-20" {...L} />
      <path d="M90 32l22 12-10 14-22-12z" fill={INK} />
      <path d="M104 56l20 40H72z" fill={INK} opacity="0.08" />
      {/* folders and stamp */}
      <path d="M130 96V70h70v26z" fill={PAPER} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M136 70v-8h56v8" fill="#d8c397" stroke={INK} strokeWidth="2" />
      <path d="M140 80h40M140 87h28" stroke={INK} strokeWidth="1.4" />
      <rect x="182" y="76" width="14" height="14" rx="2" fill={RED} transform="rotate(-10 189 83)" />
      {/* mug */}
      <path d="M222 96V72h22v24zM244 78c8 0 8 12 0 12" fill={PAPER} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M228 66c-2-4 2-6 0-10M236 66c-2-4 2-6 0-10" {...L} strokeWidth={1.4} />
      {/* wall clock */}
      <circle cx="270" cy="38" r="18" fill={PAPER} stroke={INK} strokeWidth="2.2" />
      <path d="M270 38V27M270 38l8 5" stroke={RED} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  deporte: (
    <>
      {/* court lines */}
      <path d="M20 100h280M160 100V62" {...L} />
      <path d="M100 100V70h120v30" {...L} strokeWidth={1.4} strokeDasharray="4 4" />
      {/* net */}
      <path d="M120 62h80M120 62v24M200 62v24M120 74h80M140 62v24M160 62v24M180 62v24" stroke={INK} strokeWidth="1.2" />
      {/* ball */}
      <circle cx="76" cy="46" r="13" fill="#d9c74a" stroke={INK} strokeWidth="2" />
      <path d="M66 38c6 4 6 12 0 16M86 38c-6 4-6 12 0 16" {...L} strokeWidth={1.4} />
      <path d="M52 56l-14 8M50 46h-16" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
      {/* stopwatch */}
      <circle cx="252" cy="54" r="22" fill={PAPER} stroke={INK} strokeWidth="2.4" />
      <path d="M246 28h12M252 28v4" {...L} />
      <path d="M252 54V40" stroke={RED} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M252 54a14 14 0 0 1 12 7" stroke={RED} strokeWidth="5" fill="none" opacity="0.5" />
    </>
  ),
  cultura: (
    <>
      {/* classical facade */}
      <path d="M90 40l70-26 70 26z" fill={PAPER} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M96 46h128M96 96h128" {...L} />
      {[108, 132, 156, 180, 204].map((x) => (
        <path key={x} d={`M${x} 50v42M${x + 8} 50v42`} stroke={INK} strokeWidth="1.6" />
      ))}
      <path d="M80 102h160" {...L} strokeWidth={3} />
      <circle cx="160" cy="30" r="4" fill={RED} />
      {/* book */}
      <path d="M22 92l24-10 24 10V64l-24-10-24 10z" fill={PAPER} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M46 54v38" {...L} strokeWidth={1.4} />
      <path d="M50 66l14-5M50 72l14-5" stroke={RED} strokeWidth="1.6" />
      {/* telescope and stars */}
      <path d="M262 52l38-16 4 10-38 16z" fill={INK} />
      <path d="M272 58l-10 40M276 58l10 40" {...L} />
      <path d="M286 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM250 22l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill={BLUE} />
    </>
  ),
};

/** The case's scene in a strip of paper, with its intro line (declaration screen). */
export function CaseScene({ scenarioId, className = 'case-scene' }: { scenarioId: string; className?: string }) {
  const amb = CASE_AMBIENCE[scenarioId] ?? 'fiesta';
  const photo = scenePhoto(scenarioId);
  const url = sceneUrl(scenarioId);
  // Sources that failed to load, so the next one in line is shown (and a later case with working
  // files shows its own scene again).
  const [failed, setFailed] = useState<string[]>([]);
  const fail = (src: string) => setFailed((f) => [...f, src]);
  let art: ReactNode;
  let kind: string;
  if (photo && !failed.includes(photo.large)) {
    kind = `${scenarioId}-ilustracion`;
    art = (
      <img
        className="scene-photo"
        src={photo.small}
        srcSet={`${photo.small} 720w, ${photo.large} 1440w`}
        sizes="(max-width: 460px) 100vw, 420px"
        alt=""
        width={1440}
        height={810}
        draggable={false}
        decoding="async"
        onError={() => fail(photo.large)}
      />
    );
  } else if (url && !failed.includes(url)) {
    kind = scenarioId;
    art = <img src={url} alt="" width={320} height={120} draggable={false} decoding="async" onError={() => fail(url)} />;
  } else {
    kind = `generic-${amb}`;
    art = (
      <svg viewBox="0 0 320 110" aria-hidden focusable="false">
        <rect width="320" height="110" fill="#e4d7b8" />
        <path d="M0 0h320v110H0z" fill="none" stroke="#c9b07e" strokeWidth="2" />
        {SCENES[amb]}
      </svg>
    );
  }
  return (
    <figure className={className} data-scene={kind}>
      {art}
      <figcaption>{AMBIENCE_INTRO[amb]}</figcaption>
    </figure>
  );
}
