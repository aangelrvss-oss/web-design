import { hash32 } from '../core/rng';
import { CHARACTERS, MODIFIERS, type CharacterId, type Modifier } from '../data/characters';

/** Local calendar date key. The daily is defined by the player's local date at run start,
 *  so a run that crosses midnight still counts for the day it started. */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface DailySpec {
  date: string;
  seed: number;
  character: CharacterId;
  modifier: Modifier;
}

export function dailySpec(date: string): DailySpec {
  const seed = hash32(`brainrot-daily:${date}`);
  return {
    date,
    seed,
    character: CHARACTERS[seed % CHARACTERS.length].id,
    modifier: MODIFIERS[(seed >>> 8) % MODIFIERS.length],
  };
}

/** Milliseconds until local midnight (when the next daily starts). */
export function msUntilNextDaily(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return next.getTime() - now.getTime();
}
