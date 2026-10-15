// Content & round validation. Used by `npm run validate`, by the test suite and by the
// server at boot (a broken scenario never reaches a match).

import { generateRound, rolesFor } from '../engine/generate';
import { MEMORIES_PER_PLAYER, MAX_PLAYERS, MIN_PLAYERS, SLOT_COUNT, type RoundSetup } from '../types';
import type { ScenarioDef } from './types';

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "23:30" → minutes since midnight, or null if it is not a valid clock time. */
export function parseClock(label: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(label);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Strictly increasing within one night: at most one wrap past midnight, total span < 12 h. */
function chronological(times: number[]): boolean {
  let wraps = 0;
  let span = 0;
  for (let i = 1; i < times.length; i++) {
    let d = times[i] - times[i - 1];
    if (d <= 0) {
      wraps++;
      d += 24 * 60;
    }
    span += d;
  }
  return wraps <= 1 && span < 12 * 60;
}
const ZONE_RE = /^[a-z0-9]+$/;

export function validateScenarioShape(s: ScenarioDef): string[] {
  const e: string[] = [];
  const where = `[${s.id}]`;
  if (!ID_RE.test(s.id)) e.push(`${where} id must be kebab-case ascii`);
  if (!s.title || s.title.length > 32) e.push(`${where} title missing or > 32 chars`);
  if (!s.venue || s.venue.length > 80) e.push(`${where} venue missing or > 80 chars`);
  if (!s.incident || s.incident.length < 40 || s.incident.length > 240) e.push(`${where} incident must be 40–240 chars`);
  if (!s.culpritAction || s.culpritAction.length > 70) e.push(`${where} culpritAction missing or > 70 chars`);
  if (/^[A-ZÁÉÍÓÚ]/.test(s.culpritAction)) e.push(`${where} culpritAction should start lowercase (it follows a name)`);
  if (!Array.isArray(s.slots) || s.slots.length !== SLOT_COUNT) e.push(`${where} needs exactly ${SLOT_COUNT} slots`);
  else {
    if (new Set(s.slots).size !== SLOT_COUNT) e.push(`${where} slot labels must be unique`);
    if (s.slots.some((l) => !l || l.length > 12)) e.push(`${where} slot labels must be 1–12 chars`);
    const times = s.slots.map(parseClock);
    if (times.some((t) => t === null)) e.push(`${where} slot labels must be HH:MM times`);
    else if (!chronological(times as number[])) e.push(`${where} slots must be in chronological order (crossing midnight once is fine)`);
  }
  if (!Array.isArray(s.zones) || s.zones.length !== 5) e.push(`${where} needs exactly 5 zones`);
  const ids = new Set<string>();
  const traces = new Set<string>();
  for (const z of s.zones ?? []) {
    if (!ZONE_RE.test(z.id)) e.push(`${where} zone id "${z.id}" must be lowercase ascii without spaces`);
    if (ids.has(z.id)) e.push(`${where} duplicate zone id ${z.id}`);
    ids.add(z.id);
    if (!z.name || z.name.length > 22) e.push(`${where} zone ${z.id} name missing or > 22 chars`);
    if (!z.trace || z.trace.length < 15 || z.trace.length > 110) e.push(`${where} zone ${z.id} trace must be 15–110 chars`);
    if (z.trace && !/[.!…]$/.test(z.trace.trim())) e.push(`${where} zone ${z.id} trace should end with a period`);
    if (z.trace && /culpable/i.test(z.trace)) e.push(`${where} zone ${z.id} trace must not mention the culprit (the app adds that)`);
    if (traces.has(z.trace)) e.push(`${where} duplicate trace text`);
    traces.add(z.trace);
  }
  const names = (s.zones ?? []).map((z) => z.name.toLocaleLowerCase('es'));
  if (new Set(names).size !== names.length) e.push(`${where} zone names must be unique`);
  if (!Array.isArray(s.sceneZones) || s.sceneZones.length < 2) e.push(`${where} needs ≥ 2 sceneZones`);
  for (const z of s.sceneZones ?? []) if (!ids.has(z)) e.push(`${where} sceneZone ${z} is not a zone`);
  for (const z of Object.keys(s.sceneNotes ?? {})) {
    if (!(s.sceneZones ?? []).includes(z)) e.push(`${where} sceneNote for non-scene zone ${z}`);
    const note = s.sceneNotes![z];
    if (!note || note.length > 120) e.push(`${where} sceneNote ${z} must be 1–120 chars`);
  }
  if (!Array.isArray(s.tags) || s.tags.length === 0) e.push(`${where} needs at least one tag`);
  return e;
}

/** Invariants every generated round must satisfy. Returns a list of violations. */
export function validateSetup(setup: RoundSetup, players: string[]): string[] {
  const e: string[] = [];
  const n = players.length;
  const roles = Object.values(setup.roles);
  const culprits = players.filter((p) => setup.roles[p] === 'culpable');
  const accomplices = players.filter((p) => setup.roles[p] === 'complice');
  if (roles.length !== n) e.push('role count mismatch');
  if (culprits.length !== 1) e.push('exactly one culprit required');
  if (accomplices.length !== rolesFor(n).complices) e.push('wrong accomplice count');
  const culprit = culprits[0];
  const { slot: T, zone: S } = setup.scene;
  if (!setup.zones.includes(S)) e.push('scene zone not in play');
  if (setup.zones.length !== (n <= 6 ? 4 : 5)) e.push('wrong zone count');

  for (const p of players) {
    const night = setup.truth[p];
    if (!night || night.length !== SLOT_COUNT) e.push(`night of ${p} malformed`);
    else if (!night.every((z) => setup.zones.includes(z))) e.push(`night of ${p} uses zones not in play`);
    if (p !== culprit && night?.[T] === S) e.push(`${p} was at the scene at the crime hour`);
  }
  if (setup.truth[culprit]?.[T] !== S) e.push('culprit not at the scene at the crime hour');

  for (const p of players) {
    const mems = setup.memories[p] ?? [];
    if (mems.length !== MEMORIES_PER_PLAYER) e.push(`${p} has ${mems.length} memories`);
    const keys = new Set(mems.map((m) => `${m.with}|${m.slot}`));
    if (keys.size !== mems.length) e.push(`${p} has duplicate memories`);
    for (const m of mems) {
      if (m.with === p) e.push(`${p} remembers themself`);
      if (!players.includes(m.with)) e.push(`${p} remembers unknown player`);
      if (setup.truth[p][m.slot] !== m.zone || setup.truth[m.with]?.[m.slot] !== m.zone) e.push(`${p} has a false memory`);
      if (m.slot === T && m.zone === S) e.push(`${p} has a smoking-gun memory`);
    }
  }

  if (setup.traces.length !== 2) e.push('needs two traces');
  const traceSlots = setup.traces.map((t) => t.slot);
  if (new Set(traceSlots).size !== 2 || traceSlots.includes(T)) e.push('traces must cover the two non-crime slots');
  for (const t of setup.traces) if (setup.truth[culprit][t.slot] !== t.zone) e.push('trace does not match the culprit');
  const decoys = players.filter((p) => p !== culprit && setup.traces.every((t) => setup.truth[p][t.slot] === t.zone));
  if (decoys.length < 1) e.push('traces identify the culprit on their own');

  if (setup.encargos) {
    for (const p of players) {
      const enc = setup.encargos[p];
      if (!enc) e.push(`${p} lacks an encargo`);
      else {
        if (enc.target !== undefined && (enc.target === p || !players.includes(enc.target))) e.push(`${p} encargo target invalid`);
        if (enc.kind === 'claim_zone' && !setup.zones.includes(enc.zone!)) e.push(`${p} encargo zone invalid`);
      }
    }
  }
  return e;
}

/** Full check of a scenario: shape + generation across every player count. */
export function validateScenario(s: ScenarioDef, seedsPerCount = 25): string[] {
  const errors = validateScenarioShape(s);
  if (errors.length) return errors;
  for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
    const players = Array.from({ length: n }, (_, i) => `j${i}`);
    for (let i = 0; i < seedsPerCount; i++) {
      try {
        const setup = generateRound({ scenario: s, players, seed: `val-${i}`, encargos: i % 2 === 0 });
        const v = validateSetup(setup, players);
        if (v.length) errors.push(`[${s.id}] n=${n} seed=val-${i}: ${v.join('; ')}`);
      } catch (err) {
        errors.push(`[${s.id}] n=${n} seed=val-${i}: ${(err as Error).message}`);
      }
      if (errors.length > 5) return errors;
    }
  }
  return errors;
}

export function validateCatalogue(all: ScenarioDef[], seedsPerCount = 25): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const titles = new Set<string>();
  for (const s of all) {
    if (ids.has(s.id)) errors.push(`duplicate scenario id ${s.id}`);
    if (titles.has(s.title)) errors.push(`duplicate scenario title ${s.title}`);
    ids.add(s.id);
    titles.add(s.title);
    errors.push(...validateScenario(s, seedsPerCount));
  }
  return errors;
}
