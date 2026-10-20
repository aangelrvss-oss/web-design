// Per-device conveniences only (never game state).
import { useSyncExternalStore } from 'react';

export interface Prefs {
  sound: boolean;
  reduceMotion: boolean;
  /** A short buzz at a few timed moments, where the phone supports it (lib/haptics.ts). */
  vibrate: boolean;
  lastName: string;
}

const KEY = 'coartada:prefs';
const systemReduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
let prefs: Prefs = { sound: false, reduceMotion: systemReduced, vibrate: true, lastName: '' };
try {
  const raw = localStorage.getItem(KEY);
  if (raw) prefs = { ...prefs, ...JSON.parse(raw) };
} catch {
  /* storage unavailable: defaults */
}
const listeners = new Set<() => void>();

export function getPrefs(): Prefs {
  return prefs;
}

export function setPrefs(patch: Partial<Prefs>): void {
  prefs = { ...prefs, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
  document.documentElement.classList.toggle('reduce-motion', prefs.reduceMotion);
  listeners.forEach((l) => l());
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => prefs,
    () => prefs,
  );
}

document.documentElement.classList.toggle('reduce-motion', prefs.reduceMotion);
