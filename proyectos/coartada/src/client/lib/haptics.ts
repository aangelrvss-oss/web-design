// Optional vibration: one short buzz at two moments that matter when the phone is not in your
// hand (the last seconds to vote while you haven't, and the end of the last defense). Only where
// the browser has navigator.vibrate (Android Chrome; iPhones and desktops simply do nothing), never
// repeated for the same moment, and switchable off in the menu. Always alongside something on
// screen: the big countdown, the vote screen itself.
import { useEffect, useRef } from 'react';
import type { PublicView } from '../../shared/engine/views';
import { getPrefs } from './prefs';

const done = new Set<string>();

export const canVibrate = (): boolean => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

/** Buzz once for `key` (a moment of a round); later calls with the same key do nothing. */
export function cue(key: string, pattern: number | number[] = 120): boolean {
  if (!getPrefs().vibrate || done.has(key)) return false;
  done.add(key);
  if (!canVibrate()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

/** The last defense has just ended (the vote, a runoff or the verdict comes next). */
export function useDefenseEndCue(pub: PublicView | null): void {
  const prev = useRef<string | null>(null);
  const phase = pub?.phase ?? null;
  useEffect(() => {
    if (prev.current === 'defense' && phase && phase !== 'defense' && pub?.round) cue(`${pub.code}|${pub.round.number}|defense-end`, [70, 50, 70]);
    prev.current = phase;
  }, [phase, pub]);
}
