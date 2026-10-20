// Private theory notes (the «cuaderno»). They live only in this browser, keyed by room, round,
// case and player; nothing here ever goes through the game's connection, so nobody else, the
// host included, can see them. They give no points and add no information about the case. They
// do not follow you to another phone or browser, and old rounds are dropped to keep it small.
// With one shared phone (LOCAL_CODE) they stay in memory only: the game itself does too, and
// nothing private is left in the browser afterwards. A new match clears them (clearNotes).
import { useCallback, useSyncExternalStore } from 'react';
import type { PublicView } from '../../shared/engine/views';

export type Suspicion = 0 | 1 | 2; // no mark · doubts · suspect

/** One line of your own: something you noticed, or a contradiction you spotted. */
export interface Clue {
  id: string;
  kind: 'obs' | 'contra';
  text: string;
}

export interface Notes {
  suspicion: Record<string, Suspicion>;
  /** One line per person: why. */
  why: Record<string, string>;
  /** Things to check again: a person at an hour ("id@slot") or a piece of evidence ("P1"). */
  review: string[];
  /** Why each of those, keyed like `review`. */
  reviewWhy: Record<string, string>;
  clues: Clue[];
  /** Older free text (before the list of clues); moved into `clues` when loaded. */
  general: string;
}

const PREFIX = 'coartada:notes:';
/** Room code of the single-phone game (screens/Local.tsx). */
export const LOCAL_CODE = 'MOVIL';
const INDEX = 'coartada:notes-index';
const KEEP_ROUNDS = 8;
export const WHY_MAX = 140;
export const GENERAL_MAX = 1000;
export const CLUE_MAX = 200;

const EMPTY: Notes = { suspicion: {}, why: {}, review: [], reviewWhy: {}, clues: [], general: '' };

const isLocal = (key: string) => key.startsWith(`${PREFIX}${LOCAL_CODE}|`);

/** Notes saved before the list of clues keep their free text as the first clue. */
function migrate(n: Notes): Notes {
  if (!n.general.trim() || n.clues.length) return n;
  return { ...n, clues: [{ id: 'g', kind: 'obs', text: n.general.trim().slice(0, GENERAL_MAX) }], general: '' };
}

export function notesKey(pub: PublicView, me: string): string {
  const r = pub.round!;
  return `${PREFIX}${pub.code}|${r.number}|${r.scenario.id}|${me}`;
}

function load(key: string): Notes {
  if (isLocal(key)) return EMPTY;
  try {
    const raw = localStorage.getItem(key);
    return raw ? migrate({ ...EMPTY, ...JSON.parse(raw) }) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function save(key: string, notes: Notes): void {
  if (isLocal(key)) return;
  try {
    localStorage.setItem(key, JSON.stringify(notes));
    const index: string[] = JSON.parse(localStorage.getItem(INDEX) ?? '[]');
    const next = [...index.filter((k) => k !== key), key];
    for (const old of next.slice(0, Math.max(0, next.length - KEEP_ROUNDS))) localStorage.removeItem(old);
    localStorage.setItem(INDEX, JSON.stringify(next.slice(-KEEP_ROUNDS)));
  } catch {
    /* storage unavailable: notes last until the page is closed */
  }
}

// One shared copy per key, so every part of the screen that shows the notes stays in step.
const cache = new Map<string, Notes>();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const get = (key: string) => {
  if (!cache.has(key)) cache.set(key, load(key));
  return cache.get(key)!;
};

/** A new match in this room: forget every round's notes of it, on this device. */
export function clearNotes(code: string): void {
  const mine = (k: string) => k.startsWith(`${PREFIX}${code}|`);
  for (const k of [...cache.keys()]) if (mine(k)) cache.delete(k);
  try {
    const index: string[] = JSON.parse(localStorage.getItem(INDEX) ?? '[]');
    for (const k of index.filter(mine)) localStorage.removeItem(k);
    localStorage.setItem(INDEX, JSON.stringify(index.filter((k) => !mine(k))));
  } catch {
    /* storage unavailable: nothing was kept */
  }
  listeners.forEach((l) => l());
}

/** This round's notes for this player on this device. */
export function useNotes(pub: PublicView, me: string): [Notes, (patch: (n: Notes) => Notes) => void] {
  const key = notesKey(pub, me);
  const notes = useSyncExternalStore(subscribe, () => get(key), () => get(key));
  const update = useCallback(
    (patch: (n: Notes) => Notes) => {
      const next = patch(get(key));
      cache.set(key, next);
      save(key, next);
      listeners.forEach((l) => l());
    },
    [key],
  );
  return [notes, update];
}

export const SUSPICION_TEXT: Record<Suspicion, string> = { 0: 'Sin marcar', 1: 'Dudas', 2: 'Sospecho' };
