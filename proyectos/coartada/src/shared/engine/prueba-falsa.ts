// Experimental rules «Prueba falsificable» (docs/PRUEBA-FALSA.md). Off by default: nothing here runs
// unless the round copied `variant: 'prueba_falsa'` from the settings when it started.
//
// The true evidence (round.setup.traces) is never modified. The forgery is kept apart and only
// changes what the public view SHOWS for one piece of evidence, until an examination exposes it.
// To retire the variant: delete this file, the two actions in game.ts that use it, the `variant`
// setting and the fields marked «Prueba falsificable» in types.ts and views.ts.

import { createRng } from '../rng';
import type { Examination, Forgery, ForgeryChance, RoundState, Trace } from '../types';

/** Whether the culprit gets the opportunity to forge this round: drawn once, from the round's seed
 *  (its own stream, so nothing else generated from the seed changes). 100 % never draws. */
export function drawForgeryOpportunity(seed: string, chance: ForgeryChance): boolean {
  if (chance >= 100) return true;
  return createRng(`falsificar|${seed}`).next() * 100 < chance;
}

/** Rounds from before the chance existed have no draw: they always had the opportunity. */
export const forgeryAllowed = (round: RoundState): boolean => round.forgeryAllowed !== false;

/** A forgery is valid if its hour has a piece of evidence and its place is in play but is not the true one. */
export function validForgery(round: RoundState, f: Forgery): boolean {
  const t = round.setup.traces.find((x) => x.slot === f.slot);
  return !!t && round.setup.zones.includes(f.zone) && f.zone !== t.zone;
}

/** Marks per published piece of evidence (public: how many, never whose). */
export function examineCounts(round: RoundState): number[] {
  const counts = new Array(round.tracesRevealed).fill(0);
  for (const [id, i] of Object.entries(round.examineMarks ?? {})) {
    if (round.participants.includes(id) && i < counts.length) counts[i]++;
  }
  return counts;
}

/** When the investigation ends: the most-marked piece is examined (a seeded draw breaks a tie). */
export function resolveExamination(round: RoundState): Examination {
  const counts = examineCounts(round);
  const max = Math.max(0, ...counts);
  if (max === 0) return (round.examination = { index: null, tied: false, result: null });
  const top = counts.map((c, i) => (c === max ? i : -1)).filter((i) => i >= 0);
  const index = top.length === 1 ? top[0] : createRng(`peritaje|${round.setup.seed}`).pick(top);
  const forged = !!round.forgery && round.setup.traces[index].slot === round.forgery.slot;
  return (round.examination = { index, tied: top.length > 1, result: forged ? 'falsa' : 'autentica' });
}

export type TraceStatus = 'sin_peritar' | 'autentica' | 'falsa';

/** What each published piece of evidence shows, and its status. A forged piece that has not been
 *  exposed has exactly the same fields as an authentic one that has not been examined. */
export function shownTraces(
  round: RoundState,
  count: number,
  traceText: (zone: string) => string,
): (Trace & { status: TraceStatus; forgedZone?: string; forgedText?: string })[] {
  const ex = round.examination;
  const exposed = ex?.result === 'falsa';
  const f = round.forgery ?? null;
  return round.setup.traces.slice(0, count).map((t, i) => {
    const isForged = !!f && f.slot === t.slot;
    if (exposed) {
      // Only one can be false, so once the false one is found both are known.
      return isForged
        ? { slot: t.slot, zone: t.zone, text: t.text, status: 'falsa' as const, forgedZone: f!.zone, forgedText: traceText(f!.zone) }
        : { slot: t.slot, zone: t.zone, text: t.text, status: 'autentica' as const };
    }
    const status: TraceStatus = ex && ex.index === i ? 'autentica' : 'sin_peritar';
    return isForged
      ? { slot: t.slot, zone: f!.zone, text: traceText(f!.zone), status }
      : { slot: t.slot, zone: t.zone, text: t.text, status };
  });
}
