/** Versioned localStorage persistence. Every read/write is guarded: private windows,
 *  blocked storage or corrupt JSON fall back to defaults instead of crashing. */
export interface Settings {
  master: number; // 0..1
  music: number;
  sfx: number;
  muted: boolean;
  shake: number; // 0..1
  intensity: 'low' | 'medium' | 'high';
  reducedMotion: boolean;
  aim: 'mouse' | 'auto';
  damageNumbers: boolean;
  showFps: boolean;
}

export interface Records {
  bestScore: number;
  bestTime: number;
  bestLevel: number;
  bestKills: number;
  bestCombo: number;
  runs: number;
  victories: number;
  totalKills: number;
}

export interface SaveData {
  v: 1;
  settings: Settings;
  records: Records;
  achievements: string[];
  /** Daily best score keyed by local date (YYYY-MM-DD) of the run's start. */
  daily: Record<string, number>;
  seenTutorial: boolean;
  lastCharacter: string;
}

export const SAVE_KEY = 'brainrot-overdrive/save';

export function defaultSettings(): Settings {
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    master: 0.8, music: 0.6, sfx: 0.8, muted: false, shake: 0.7, intensity: 'high',
    reducedMotion: reduced, aim: 'mouse', damageNumbers: true, showFps: false,
  };
}

export function defaultSave(): SaveData {
  return {
    v: 1,
    settings: defaultSettings(),
    records: { bestScore: 0, bestTime: 0, bestLevel: 0, bestKills: 0, bestCombo: 0, runs: 0, victories: 0, totalKills: 0 },
    achievements: [],
    daily: {},
    seenTutorial: false,
    lastCharacter: 'npc',
  };
}

const num = (v: unknown, d: number, lo = -Infinity, hi = Infinity) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;

/** Merge untrusted parsed JSON onto defaults, type-checking each field. */
export function sanitizeSave(raw: unknown): SaveData {
  const d = defaultSave();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<SaveData> & Record<string, unknown>;
  const s = (r.settings ?? {}) as Partial<Settings>;
  const ds = d.settings;
  const settings: Settings = {
    master: num(s.master, ds.master, 0, 1),
    music: num(s.music, ds.music, 0, 1),
    sfx: num(s.sfx, ds.sfx, 0, 1),
    muted: typeof s.muted === 'boolean' ? s.muted : ds.muted,
    shake: num(s.shake, ds.shake, 0, 1),
    intensity: s.intensity === 'low' || s.intensity === 'medium' || s.intensity === 'high' ? s.intensity : ds.intensity,
    reducedMotion: typeof s.reducedMotion === 'boolean' ? s.reducedMotion : ds.reducedMotion,
    aim: s.aim === 'auto' || s.aim === 'mouse' ? s.aim : ds.aim,
    damageNumbers: typeof s.damageNumbers === 'boolean' ? s.damageNumbers : ds.damageNumbers,
    showFps: typeof s.showFps === 'boolean' ? s.showFps : ds.showFps,
  };
  const rec = (r.records ?? {}) as Partial<Records>;
  const records = Object.fromEntries(
    Object.entries(d.records).map(([k, v]) => [k, num((rec as Record<string, unknown>)[k], v, 0)]),
  ) as unknown as Records;
  const achievements = Array.isArray(r.achievements) ? r.achievements.filter((a): a is string => typeof a === 'string') : [];
  const daily: Record<string, number> = {};
  if (r.daily && typeof r.daily === 'object') {
    for (const [k, v] of Object.entries(r.daily)) if (/^\d{4}-\d{2}-\d{2}$/.test(k)) daily[k] = num(v, 0, 0);
  }
  return {
    v: 1,
    settings,
    records,
    achievements: [...new Set(achievements)],
    daily,
    seenTutorial: r.seenTutorial === true,
    lastCharacter: typeof r.lastCharacter === 'string' ? r.lastCharacter : d.lastCharacter,
  };
}

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

function storage(): StorageLike | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadSave(store: StorageLike | null = storage()): SaveData {
  try {
    const txt = store?.getItem(SAVE_KEY);
    return txt ? sanitizeSave(JSON.parse(txt)) : defaultSave();
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData, store: StorageLike | null = storage()): boolean {
  try {
    store?.setItem(SAVE_KEY, JSON.stringify(data));
    return !!store;
  } catch {
    return false;
  }
}
