// Shared game types. The server owns the full RoomState; clients only ever receive
// PublicView (identical for everyone) plus their own PrivateView.

export type PlayerId = string;
export type Role = 'inocente' | 'culpable' | 'complice';
export type Phase = 'lobby' | 'declare' | 'investigate' | 'vote' | 'runoff' | 'result' | 'final';
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
}

export const DEFAULT_SETTINGS: Settings = { pace: 'normal', rounds: 5, encargos: false };

/** Seconds per timed step. */
export const PACE_TIMINGS: Record<Pace, { declare: number; investigate1: number; investigate2: number; vote: number; runoff: number }> = {
  relajado: { declare: 120, investigate1: 150, investigate2: 180, vote: 60, runoff: 40 },
  normal: { declare: 90, investigate1: 120, investigate2: 150, vote: 45, runoff: 30 },
  rapido: { declare: 60, investigate1: 75, investigate2: 105, vote: 30, runoff: 25 },
};

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
  outcome: Outcome | null;
  startedAt: number;
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
