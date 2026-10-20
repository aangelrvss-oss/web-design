import type { AvatarId } from '../characters';
// Projections of the authoritative RoomState. This file is the privacy boundary:
// publicView() is broadcast to everyone, privateView() goes only to its owner.
// Roles, true nights, memories, drafts, encargos and votes are NEVER in publicView
// until the round is resolved.

import type { ScenarioDef } from '../content/types';
import { MAX_TESTIMONIES, type DefenseInfo, type Encargo, type Examination, type Forgery, type Memory, type Outcome, type Phase, type PlayerId, type Role, type RoomState, type Settings, type Trace, type Variant } from '../types';
import { testimonyStatus, type TestimonyStatus } from './encargos';
import { examineCounts, forgeryAllowed, shownTraces, type TraceStatus } from './prueba-falsa';

export interface PublicPlayer {
  id: PlayerId;
  name: string;
  color: number;
  connected: boolean;
  left: boolean;
  score: number;
  isHost: boolean;
  /** Character drawn for this player (cosmetic, public). */
  avatar: AvatarId | null;
}

export interface PublicTestimony {
  id: number;
  by: PlayerId;
  subject: PlayerId;
  slot: number;
  zone: string;
  /** Comparison with the subject's sealed alibi only (see testimonyStatus). */
  status: TestimonyStatus;
}

export interface PublicReveal {
  roles: Record<PlayerId, Role>;
  truth: Record<PlayerId, string[]>;
  memories: Record<PlayerId, Memory[]>;
  encargos: Record<PlayerId, Encargo> | null;
  votes: Record<PlayerId, PlayerId>;
  runoffVotes: Record<PlayerId, PlayerId> | null;
  /** Who pointed at whom for the last defense. */
  pointers: Record<PlayerId, PlayerId>;
  traces: Trace[];
  seed: string;
  outcome: Outcome;
  /** Prueba falsificable: what the culprit forged (null: nothing, or a normal round). */
  forgery: Forgery | null;
  /** Prueba falsificable: whether the culprit had the opportunity to forge (null: normal round). */
  forgeryAllowed: boolean | null;
}

/** A published piece of evidence. `status` only exists in a round with «Prueba falsificable»:
 *  while «sin_peritar», what it shows may be false. */
export interface PublicTrace extends Trace {
  status?: TraceStatus;
  /** Once exposed: what the forged version said. */
  forgedZone?: string;
  forgedText?: string;
}

export interface PublicRound {
  number: number;
  scenario: {
    id: string;
    title: string;
    venue: string;
    incident: string;
    culpritAction: string;
    slots: string[];
    zones: { id: string; name: string }[];
    sceneNote: string | null;
  };
  scene: { zone: string; slot: number };
  /** Experimental rules this round is played with (its own copy; null: normal round). */
  variant: Variant | null;
  /** Prueba falsificable: the chance (%) of an opportunity to forge this round was played with.
   *  Never whether it was granted (that is in `reveal`). Null in a normal round. */
  forgeryChance: number | null;
  participants: PlayerId[];
  /** Who has locked an alibi (declare phase). */
  locked: PlayerId[];
  /** Declared alibis — only once the declare phase is over. */
  declarations: Record<PlayerId, { zones: string[]; auto: boolean }> | null;
  traces: PublicTrace[];
  testimonies: PublicTestimony[];
  /** Prueba falsificable: marks per published piece (how many, never whose) and, once the
   *  investigation ends, the examination. Null in a normal round. */
  examination: { counts: number[]; done: Examination | null } | null;
  ready: PlayerId[];
  voted: PlayerId[];
  runoff: { candidates: PlayerId[]; voted: PlayerId[] } | null;
  /** How many participants currently point at someone (not at whom). */
  pointedCount: number;
  /** Who defends and why; public from the end of the investigation. */
  defense: DefenseInfo | null;
  reveal: PublicReveal | null;
}

export interface PublicView {
  code: string;
  phase: Phase;
  phaseEndsAt: number | null;
  hostId: PlayerId;
  settings: Settings;
  roundsPlayed: number;
  players: PublicPlayer[];
  round: PublicRound | null;
  history: { number: number; scenarioTitle: string; culprit: PlayerId; accused: PlayerId | null; caught: boolean }[];
}

export interface PrivateView {
  playerId: PlayerId;
  inRound: boolean;
  role: Role | null;
  truth: string[] | null;
  memories: Memory[] | null;
  /** Culprit ↔ accomplice know each other (nothing else about each other's night). */
  partner: { id: PlayerId; role: Role } | null;
  encargo: Encargo | null;
  draft: string[] | null;
  declared: string[] | null;
  vote: PlayerId | null;
  runoffVote: PlayerId | null;
  /** Your own secret pick for the last defense. */
  pointer: PlayerId | null;
  testimoniesLeft: number;
  /** Prueba falsificable: the forgery, only for the culprit (and the accomplice once the declaration ends). */
  forgery: Forgery | null;
  /** Prueba falsificable: whether you may forge this round. Only the culprit's own view has it. */
  canForge: boolean | null;
  /** Prueba falsificable: which piece of evidence you marked for examination. */
  examineMark: number | null;
}

export function publicView(room: RoomState, scenarios: ScenarioDef[]): PublicView {
  const round = room.round;
  let pubRound: PublicRound | null = null;
  if (round) {
    const scenario = scenarios.find((s) => s.id === round.setup.scenarioId)!;
    const after = (phases: Phase[]) => phases.includes(room.phase);
    const declared = after(['investigate', 'defense', 'vote', 'runoff', 'result', 'final']);
    const resolved = after(['result', 'final']) && !!round.outcome;
    pubRound = {
      number: round.number,
      scenario: {
        id: scenario.id,
        title: scenario.title,
        venue: scenario.venue,
        incident: scenario.incident,
        culpritAction: scenario.culpritAction,
        slots: scenario.slots.slice(),
        zones: round.setup.zones.map((id) => ({ id, name: scenario.zones.find((z) => z.id === id)!.name })),
        sceneNote: scenario.sceneNotes?.[round.setup.scene.zone] ?? null,
      },
      scene: { ...round.setup.scene },
      variant: round.variant ?? null,
      forgeryChance: round.variant === 'prueba_falsa' ? (round.forgeryChance ?? 100) : null,
      participants: round.participants.slice(),
      locked: round.participants.filter((id) => !!round.declarations[id]),
      declarations: declared
        ? Object.fromEntries(
            round.participants.map((id) => [id, { zones: round.declarations[id]!.zones.slice(), auto: round.declarations[id]!.auto }]),
          )
        : null,
      traces:
        round.variant === 'prueba_falsa'
          ? shownTraces(round, resolved ? 2 : round.tracesRevealed, (z) => scenario.zones.find((x) => x.id === z)!.trace)
          : round.setup.traces.slice(0, resolved ? 2 : round.tracesRevealed).map((t) => ({ ...t })),
      examination: round.variant === 'prueba_falsa' ? { counts: examineCounts(round), done: round.examination ?? null } : null,
      testimonies: round.testimonies.map((t) => ({
        id: t.id,
        by: t.by,
        subject: t.subject,
        slot: t.slot,
        zone: t.zone,
        status: testimonyStatus(round, t),
      })),
      ready: room.phase === 'investigate' ? round.ready.slice() : [],
      voted: Object.keys(round.votes),
      runoff: round.runoff ? { candidates: round.runoff.candidates.slice(), voted: Object.keys(round.runoff.votes) } : null,
      pointedCount: Object.keys(round.pointers).filter((id) => round.participants.includes(id)).length,
      defense: round.defense ? { ...round.defense } : null,
      reveal: resolved
        ? {
            roles: { ...round.setup.roles },
            truth: structuredClone(round.setup.truth),
            memories: structuredClone(round.setup.memories),
            encargos: round.setup.encargos ? structuredClone(round.setup.encargos) : null,
            votes: { ...round.votes },
            runoffVotes: round.runoff ? { ...round.runoff.votes } : null,
            pointers: { ...round.pointers },
            traces: round.setup.traces.map((t) => ({ ...t })),
            seed: round.setup.seed,
            outcome: structuredClone(round.outcome!),
            forgery: round.forgery ? { ...round.forgery } : null,
            forgeryAllowed: round.variant === 'prueba_falsa' ? forgeryAllowed(round) : null,
          }
        : null,
    };
  }
  return {
    code: room.code,
    phase: room.phase,
    phaseEndsAt: room.phaseEndsAt,
    hostId: room.hostId,
    settings: { ...room.settings },
    roundsPlayed: room.roundsPlayed,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      connected: p.connected,
      left: p.left,
      score: p.score,
      isHost: p.id === room.hostId,
      avatar: p.avatar,
    })),
    round: pubRound,
    history: room.history.map((h) => ({
      number: h.number,
      scenarioTitle: scenarios.find((s) => s.id === h.scenarioId)?.title ?? h.scenarioId,
      culprit: h.culprit,
      accused: h.accused,
      caught: h.caught,
    })),
  };
}

export function privateView(room: RoomState, playerId: PlayerId): PrivateView {
  const round = room.round;
  const inRound = !!round && round.participants.includes(playerId);
  if (!round || !inRound) {
    return {
      playerId,
      inRound: false,
      role: null,
      truth: null,
      memories: null,
      partner: null,
      encargo: null,
      draft: null,
      declared: null,
      vote: null,
      runoffVote: null,
      pointer: null,
      testimoniesLeft: 0,
      forgery: null,
      canForge: null,
      examineMark: null,
    };
  }
  const { setup } = round;
  const role = setup.roles[playerId];
  let partner: PrivateView['partner'] = null;
  const culprit = Object.keys(setup.roles).find((p) => setup.roles[p] === 'culpable')!;
  const accomplice = Object.keys(setup.roles).find((p) => setup.roles[p] === 'complice') ?? null;
  if (role === 'culpable' && accomplice) {
    partner = { id: accomplice, role: 'complice' };
  } else if (role === 'complice') {
    partner = { id: culprit, role: 'culpable' };
  }
  return {
    playerId,
    inRound: true,
    role,
    truth: setup.truth[playerId].slice(),
    memories: setup.memories[playerId].map((m) => ({ ...m })),
    partner,
    encargo: setup.encargos ? { ...setup.encargos[playerId] } : null,
    draft: round.drafts[playerId]?.slice() ?? null,
    declared: round.declarations[playerId]?.zones.slice() ?? null,
    vote: round.votes[playerId] ?? null,
    runoffVote: round.runoff?.votes[playerId] ?? null,
    pointer: round.pointers[playerId] ?? null,
    testimoniesLeft: MAX_TESTIMONIES - round.testimonies.filter((t) => t.by === playerId).length,
    // The culprit always sees their own choice; the accomplice, the final one once the declaration ends.
    forgery:
      round.forgery && (role === 'culpable' || (role === 'complice' && room.phase !== 'declare')) ? { ...round.forgery } : null,
    canForge: round.variant === 'prueba_falsa' && role === 'culpable' ? forgeryAllowed(round) : null,
    examineMark: round.examineMarks?.[playerId] ?? null,
  };
}
