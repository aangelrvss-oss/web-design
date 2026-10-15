// Round generator: builds a fair, internally consistent "real night" from a scenario,
// a list of players and a seed. Same inputs + same seed ⇒ identical round.
//
// Guarantees (enforced here and re-checked by validateSetup / tests):
//  - Only the culprit was in the scene zone at the crime slot.
//  - Every player holds exactly MEMORIES_PER_PLAYER true co-location memories.
//  - No memory places anyone at the scene at the crime slot (no smoking gun).
//  - 1–2 memories held by non-accomplices place the culprit somewhere at another slot
//    (so lying at those slots is risky).
//  - At least one non-culprit "decoy" shares the culprit's true zone at both trace slots
//    (so the traces alone never identify the culprit).
//  - Between ~25% and ~75% of non-culprits are vouched for at the crime slot by a memory.

import { createRng, type Rng } from '../rng';
import type { ScenarioDef } from '../content/types';
import {
  MEMORIES_PER_PLAYER,
  SLOT_COUNT,
  type Memory,
  type PlayerId,
  type Role,
  type RoundSetup,
  type Trace,
} from '../types';
import { assignEncargos } from './encargos';

export interface GenerateInput {
  scenario: ScenarioDef;
  players: PlayerId[];
  seed: string;
  encargos: boolean;
}

export function zoneCountFor(n: number): number {
  return n <= 6 ? 4 : 5;
}

export function rolesFor(n: number): { complices: number } {
  return { complices: n >= 6 ? 1 : 0 };
}

const MAX_ATTEMPTS = 600;

export function generateRound(input: GenerateInput): RoundSetup {
  const { scenario, players, seed } = input;
  const n = players.length;
  const rng = createRng(`${seed}|${scenario.id}|${players.length}`);

  // 1. Zones in play and the scene.
  const sceneZone = rng.pick(scenario.sceneZones);
  const k = zoneCountFor(n);
  let zones = scenario.zones.map((z) => z.id);
  while (zones.length > k) {
    const droppable = zones.filter((z) => z !== sceneZone);
    const drop = rng.pick(droppable);
    zones = zones.filter((z) => z !== drop);
  }
  const crimeSlot = rng.int(SLOT_COUNT);

  // 2. Roles.
  const order = rng.shuffle(players);
  const culprit = order[0];
  const accomplice = rolesFor(n).complices > 0 ? order[1] : null;
  const roles: Record<PlayerId, Role> = {};
  for (const p of players) roles[p] = 'inocente';
  roles[culprit] = 'culpable';
  if (accomplice) roles[accomplice] = 'complice';
  const innocents = players.filter((p) => roles[p] === 'inocente');

  const otherSlots = [0, 1, 2].filter((s) => s !== crimeSlot);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const truth = buildNight(rng, players, zones, culprit, innocents, crimeSlot, sceneZone, otherSlots, n);
    if (!truth) continue;
    const decoys = players.filter(
      (p) => p !== culprit && otherSlots.every((s) => truth.night[p][s] === truth.night[culprit][s]),
    );
    const memories = pickMemories(rng, players, truth.night, culprit, accomplice, crimeSlot, decoys);
    if (!memories) continue;

    const traceSlots = rng.shuffle(otherSlots);
    const traces: Trace[] = traceSlots.map((slot) => {
      const zone = truth.night[culprit][slot];
      const def = scenario.zones.find((z) => z.id === zone)!;
      return { slot, zone, text: def.trace };
    });

    const setup: RoundSetup = {
      seed,
      scenarioId: scenario.id,
      zones,
      scene: { zone: sceneZone, slot: crimeSlot },
      roles,
      truth: truth.night,
      memories,
      traces,
      encargos: null,
      decoys,
      attempts: attempt,
    };
    if (input.encargos) setup.encargos = assignEncargos(rng, setup);
    return setup;
  }
  throw new Error(`generateRound: no valid night for ${scenario.id} with ${n} players (seed ${seed})`);
}

function buildNight(
  rng: Rng,
  players: PlayerId[],
  zones: string[],
  culprit: PlayerId,
  innocents: PlayerId[],
  crimeSlot: number,
  sceneZone: string,
  otherSlots: number[],
  n: number,
): { night: Record<PlayerId, string[]> } | null {
  const night: Record<PlayerId, string[]> = {};
  for (const p of players) night[p] = new Array(SLOT_COUNT).fill('');

  // Culprit: at the scene at the crime slot; elsewhere with a mild tendency to stay put.
  night[culprit][crimeSlot] = sceneZone;
  for (const s of otherSlots) {
    const prev = s > 0 ? night[culprit][s - 1] : '';
    night[culprit][s] = prev && rng.chance(0.3) ? prev : rng.pick(zones);
  }

  // Decoys: innocents that share the culprit's zones at both trace slots.
  const decoyCount = n >= 8 ? 2 : 1;
  const decoys = rng.shuffle(innocents).slice(0, decoyCount);
  for (const d of decoys) {
    for (const s of otherSlots) night[d][s] = night[culprit][s];
    night[d][crimeSlot] = rng.pick(zones.filter((z) => z !== sceneZone));
  }

  // Everyone else, slot by slot, with a "crowd" bias so groups form naturally.
  const fixed = new Set([culprit, ...decoys]);
  for (let s = 0; s < SLOT_COUNT; s++) {
    const counts: Record<string, number> = Object.fromEntries(zones.map((z) => [z, 0]));
    for (const p of fixed) if (night[p][s]) counts[night[p][s]]++;
    for (const p of rng.shuffle(players.filter((q) => !fixed.has(q)))) {
      const weights = zones.map((z) => {
        if (s === crimeSlot && z === sceneZone) return 0;
        let w = counts[z] + 0.7;
        if (s > 0 && night[p][s - 1] === z) w *= 1.5;
        return w;
      });
      const z = zones[rng.weighted(weights)];
      night[p][s] = z;
      counts[z]++;
    }
  }

  // Sanity: nobody but the culprit at the scene at the crime slot.
  for (const p of players) {
    if (p !== culprit && night[p][crimeSlot] === sceneZone) return null;
  }
  // Avoid degenerate nights where one zone holds almost everyone at every slot.
  for (let s = 0; s < SLOT_COUNT; s++) {
    const used = new Set(players.map((p) => night[p][s]));
    if (used.size < (n <= 5 ? 2 : 3)) return null;
  }
  return { night };
}

function pickMemories(
  rng: Rng,
  players: PlayerId[],
  night: Record<PlayerId, string[]>,
  culprit: PlayerId,
  accomplice: PlayerId | null,
  crimeSlot: number,
  decoys: PlayerId[],
): Record<PlayerId, Memory[]> | null {
  // Candidate co-locations per player.
  const options: Record<PlayerId, Memory[]> = {};
  for (const p of players) {
    options[p] = [];
    for (let s = 0; s < SLOT_COUNT; s++) {
      for (const q of players) {
        if (q === p || night[q][s] !== night[p][s]) continue;
        options[p].push({ with: q, slot: s, zone: night[p][s] });
      }
    }
    if (options[p].length < MEMORIES_PER_PLAYER) return null;
  }

  const nonCulprits = players.filter((p) => p !== culprit);
  const minVouch = Math.max(1, Math.round(nonCulprits.length * 0.25));
  const maxVouch = Math.max(minVouch, Math.round(nonCulprits.length * 0.75));
  const small = players.length <= 5;
  const maxCulpritMemories = small ? 1 : 2;
  // Half the rounds the decoy(s) can be cleared by an honest memory at the crime slot;
  // the other half at least one decoy stays unvouched, so logic alone can't finish the job.
  const wantDecoysCleared = rng.chance(small ? 0.35 : 0.5);

  for (let tries = 0; tries < 40; tries++) {
    const memories: Record<PlayerId, Memory[]> = {};
    for (const p of players) {
      // Prefer variety: weight memories about the crime slot a bit higher (that is where
      // vouching matters) and avoid two memories at the same slot when possible.
      const pool = rng.shuffle(options[p]);
      const chosen: Memory[] = [];
      for (const m of pool) {
        if (chosen.length >= MEMORIES_PER_PLAYER) break;
        if (chosen.some((c) => c.with === m.with && c.slot === m.slot)) continue;
        if (chosen.some((c) => c.slot === m.slot) && pool.some((o) => !chosen.some((c) => c.slot === o.slot) && o !== m)) {
          if (rng.chance(0.6)) continue;
        }
        chosen.push(m);
      }
      if (chosen.length < MEMORIES_PER_PLAYER) {
        for (const m of pool) {
          if (chosen.length >= MEMORIES_PER_PLAYER) break;
          if (!chosen.includes(m)) chosen.push(m);
        }
      }
      memories[p] = chosen.sort((a, b) => a.slot - b.slot);
    }

    // Memories about the culprit held by anyone who would publish them.
    const aboutCulprit = players
      .filter((p) => p !== culprit && p !== accomplice)
      .flatMap((p) => memories[p])
      .filter((m) => m.with === culprit).length;
    if (aboutCulprit < 1 || aboutCulprit > maxCulpritMemories) continue;

    // Non-culprits vouched for at the crime slot by an honest-side memory.
    const vouched = new Set(
      players
        .filter((p) => p !== culprit && p !== accomplice)
        .flatMap((p) => memories[p])
        .filter((m) => m.slot === crimeSlot)
        .map((m) => m.with),
    );
    if (vouched.size < minVouch || vouched.size > maxVouch) continue;
    if (decoys.every((d) => vouched.has(d)) !== wantDecoysCleared) continue;
    return memories;
  }
  return null;
}
