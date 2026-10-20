import type { AvatarId } from './characters';
// Shared game types. The server owns the full RoomState; clients only ever receive
// PublicView (identical for everyone) plus their own PrivateView.

export type PlayerId = string;
export type Role = 'inocente' | 'culpable' | 'complice';
export type Phase = 'lobby' | 'declare' | 'investigate' | 'defense' | 'vote' | 'runoff' | 'result' | 'final';
export type Pace = 'relajado' | 'normal' | 'rapido';

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 10;
export const SLOT_COUNT = 3;
export const MEMORIES_PER_PLAYER = 2;
export const MAX_TESTIMONIES = 3;
export const NAME_MAX = 16;

export interface Settings {
  pace: Pace;
  /** Rounds per match; 0 = no limit. */
  rounds: 0 | 3 | 5 | 8;
  /** Secret side missions (+1 point each). */
  encargos: boolean;
  /** Experimental rules for test games (docs/PRUEBA-FALSA.md). Off (null) by default. */
  variant: Variant | null;
  /** Prueba falsificable only: chance (%) that the culprit gets the opportunity to forge in a
   *  round. A test condition for balance experiments; 100 is the rule as first prototyped. */
  forgeryChance: ForgeryChance;
}

export type ForgeryChance = 100 | 50 | 25;
export const FORGERY_CHANCES: readonly ForgeryChance[] = [100, 50, 25];

/** Experimental rule sets. There is one: «Prueba falsificable». */
export type Variant = 'prueba_falsa';

export const DEFAULT_SETTINGS: Settings = { pace: 'normal', rounds: 5, encargos: false, variant: null, forgeryChance: 100 };

/** Seconds per timed step for 6–7 players (the reference group size). */
export const PACE_TIMINGS: Record<Pace, StepTimings> = {
  relajado: { declare: 180, investigate1: 150, investigate2: 180, defense: 30, vote: 60, runoff: 40 },
  normal: { declare: 120, investigate1: 120, investigate2: 150, defense: 25, vote: 45, runoff: 30 },
  rapido: { declare: 75, investigate1: 75, investigate2: 105, defense: 15, vote: 30, runoff: 25 },
};

export interface StepTimings {
  declare: number;
  investigate1: number;
  investigate2: number;
  defense: number;
  vote: number;
  runoff: number;
}

export type GroupSize = 'pequeno' | 'mediano' | 'grande';

export function groupSize(players: number): GroupSize {
  return players <= 5 ? 'pequeno' : players <= 7 ? 'mediano' : 'grande';
}

/**
 * Adjustments by group size, applied on top of the pace. Small groups talk less and
 * finish sooner; large groups get more discussion and a little more time to read the
 * longer vote list. Declaring and defending don't depend on group size.
 */
export const SIZE_ADJUST: Record<GroupSize, { investigateFactor: number; voteExtra: number }> = {
  pequeno: { investigateFactor: 0.85, voteExtra: 0 },
  mediano: { investigateFactor: 1, voteExtra: 0 },
  grande: { investigateFactor: 1.2, voteExtra: 10 },
};

const round5 = (s: number) => Math.round(s / 5) * 5;

/** The single source of truth for every timer in a round. */
export function timingsFor(pace: Pace, players: number): StepTimings {
  const base = PACE_TIMINGS[pace];
  const adj = SIZE_ADJUST[groupSize(players)];
  return {
    declare: base.declare,
    investigate1: round5(base.investigate1 * adj.investigateFactor),
    investigate2: round5(base.investigate2 * adj.investigateFactor),
    defense: base.defense,
    vote: base.vote + adj.voteExtra,
    runoff: base.runoff,
  };
}

/** "At slot s you were in zone z with player `with`." Always true. */
export interface Memory {
  with: PlayerId;
  slot: number;
  zone: string;
}

/** Forensic trace: always true, always about the culprit. */
export interface Trace {
  slot: number;
  zone: string;
  text: string;
}

export type EncargoKind =
  | 'votes_on' // target receives ≥ 2 votes not counting yours
  | 'no_votes' // nobody votes for you
  | 'same_vote' // you vote the same person as target
  | 'corroborated' // someone else's testimony matches your alibi
  | 'contradict' // you publish a testimony that contradicts target's alibi
  | 'claim_zone'; // your alibi places you in zone at least once

export interface Encargo {
  kind: EncargoKind;
  target?: PlayerId;
  zone?: string;
}

export interface RoundSetup {
  seed: string;
  scenarioId: string;
  /** Zone ids in play, display order. */
  zones: string[];
  scene: { zone: string; slot: number };
  roles: Record<PlayerId, Role>;
  /** True location per slot. */
  truth: Record<PlayerId, string[]>;
  memories: Record<PlayerId, Memory[]>;
  /** Two traces, in reveal order. */
  traces: Trace[];
  encargos: Record<PlayerId, Encargo> | null;
  /** Players whose true night matches both traces apart from the culprit. */
  decoys: PlayerId[];
  /** Generation attempts used (debug). */
  attempts: number;
}

export interface Testimony {
  id: number;
  by: PlayerId;
  subject: PlayerId;
  slot: number;
  /** The speaker's declared zone at that slot ("I was with X in Z"). */
  zone: string;
  at: number;
}

export type ScoreReason =
  | 'grupo_gana' // innocent, culprit caught: +2
  | 'culpable_escapa' // culprit escaped: +4
  | 'complice_escapa' // accomplice, culprit escaped: +3
  | 'voto_certero' // innocent who voted the culprit in the main vote: +1
  | 'cazador' // published a true testimony that exposed a real lie: +1
  | 'encargo'; // completed the secret side mission: +1

export const SCORE_POINTS: Record<ScoreReason, number> = {
  grupo_gana: 2,
  culpable_escapa: 4,
  complice_escapa: 3,
  voto_certero: 1,
  cazador: 1,
  encargo: 1,
};

export interface ScoreLine {
  reason: ScoreReason;
  points: number;
}

export interface Outcome {
  accused: PlayerId | null;
  culpritCaught: boolean;
  /** Main vote tally (votes received). */
  tally: Record<PlayerId, number>;
  runoffTally: Record<PlayerId, number> | null;
  /** Slots where each player's declaration differed from the truth. */
  lies: Record<PlayerId, number[]>;
  encargoDone: Record<PlayerId, boolean> | null;
  score: Record<PlayerId, ScoreLine[]>;
  /** Testimony ids that exposed a real lie. */
  exposing: number[];
}

export interface RoundState {
  number: number;
  setup: RoundSetup;
  participants: PlayerId[];
  declarations: Record<PlayerId, { zones: string[]; auto: boolean } | undefined>;
  /** Unlocked alibi drafts (private; used if the timer runs out). */
  drafts: Record<PlayerId, string[]>;
  testimonies: Testimony[];
  tracesRevealed: 0 | 1 | 2;
  ready: PlayerId[];
  votes: Record<PlayerId, PlayerId>;
  runoff: { candidates: PlayerId[]; votes: Record<PlayerId, PlayerId> } | null;
  /** Secret "who should defend themself" picks made during the investigation. */
  pointers: Record<PlayerId, PlayerId>;
  /** Set when the investigation ends: who defends and how they were chosen. */
  defense: DefenseInfo | null;
  outcome: Outcome | null;
  startedAt: number;
  /** Experimental rules, copied from the settings when the round starts (null: a normal round). */
  variant: Variant | null;
  /** Prueba falsificable only: the chance this round was played with (copied when it started). */
  forgeryChance?: ForgeryChance;
  /** Prueba falsificable only: whether the culprit got the opportunity to forge, drawn once when
   *  the round started (secret: the culprit knows; everyone else, at the verdict). */
  forgeryAllowed?: boolean;
  /** Prueba falsificable only: the culprit's forgery (secret until the verdict). */
  forgery?: Forgery | null;
  /** Prueba falsificable only: which revealed piece of evidence each participant wants examined. */
  examineMarks?: Record<PlayerId, number>;
  /** Prueba falsificable only: set when the investigation ends. */
  examination?: Examination | null;
}

/** «The evidence of hour `slot` will say `zone`» instead of where the culprit really was. */
export interface Forgery {
  slot: number;
  zone: string;
}

export interface Examination {
  /** The examined piece of evidence (index in reveal order), or null when nobody asked. */
  index: number | null;
  /** Two pieces had the same marks and a seeded draw chose. */
  tied: boolean;
  result: 'autentica' | 'falsa' | null;
}

export interface DefenseInfo {
  /** Most-pointed person; null when nobody pointed at anyone. */
  defender: PlayerId | null;
  /** How many people pointed at the defender. */
  pointerCount: number;
  /** How many people shared the top count (2+ means a seeded draw decided). */
  tiedCount: number;
  /** senalado/sorteo: the defense happens. nadie_senalado/desconectado: straight to the vote. */
  reason: 'senalado' | 'sorteo' | 'nadie_senalado' | 'desconectado';
}

export interface PlayerRec {
  id: PlayerId;
  name: string;
  color: number;
  token: string;
  joinedAt: number;
  connected: boolean;
  lastSeen: number;
  /** Explicitly left; kept until the current round ends so the round stays consistent. */
  left: boolean;
  score: number;
  /** The character this player is drawn as (cosmetic). Unique in the room; null only if none was free. */
  avatar: AvatarId | null;
}

export interface RoundRecord {
  number: number;
  scenarioId: string;
  seed: string;
  culprit: PlayerId;
  accomplice: PlayerId | null;
  accused: PlayerId | null;
  caught: boolean;
}

export interface RoomState {
  code: string;
  createdAt: number;
  updatedAt: number;
  hostId: PlayerId;
  players: PlayerRec[];
  settings: Settings;
  phase: Phase;
  phaseEndsAt: number | null;
  round: RoundState | null;
  roundsPlayed: number;
  history: RoundRecord[];
  recentScenarios: string[];
  nextTestimonyId: number;
}
