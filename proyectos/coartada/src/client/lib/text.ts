// All player-facing copy lives here (Spanish, Spain).
import type { ErrorCode } from '../../shared/protocol';
import type { PublicView } from '../../shared/engine/views';
import type { Phase, Role, ScoreReason } from '../../shared/types';

export const ERRORS: Record<ErrorCode, string> = {
  invalid: 'Esa acción no es válida ahora mismo.',
  rate_limited: 'Demasiado rápido. Espera un segundo.',
  no_room: 'No existe ninguna sala con ese código.',
  bad_token: 'No se pudo recuperar tu sitio en la sala.',
  not_in_room: 'Sin conexión con la sala. Reconectando…',
  too_many_rooms: 'Has creado demasiadas salas seguidas. Prueba en unos minutos.',
  server_busy: 'El servidor no responde. Comprueba la conexión.',
  not_host: 'Solo quien dirige la sala puede hacer eso.',
  wrong_phase: 'Esa acción ya no está disponible en esta fase.',
  not_participant: 'Estás viendo esta ronda sin jugar; jugarás en la siguiente.',
  already_done: 'Eso ya está hecho.',
  not_enough_players: 'Hacen falta al menos 4 personas conectadas.',
  too_many_players: 'Máximo 10 personas por ronda.',
  room_full: 'La sala está llena (10 personas).',
  limit_reached: 'Ya has publicado tus 3 testimonios de esta ronda.',
  unknown_player: 'Esa persona ya no está en la sala.',
};

export function errorText(code: string | undefined): string {
  return (code && ERRORS[code as ErrorCode]) || 'Algo ha fallado. Inténtalo otra vez.';
}

export const ROLE_NAME: Record<Role, string> = {
  inocente: 'Inocente',
  culpable: 'Culpable',
  complice: 'Cómplice',
};

export const ROLE_GOAL: Record<Role, string> = {
  inocente: 'No lo hiciste. Ganas si el grupo acusa a la persona culpable.',
  culpable: 'Lo hiciste tú. Ganas si el grupo acusa a otra persona o a nadie.',
  complice: 'No lo hiciste, pero sabes quién fue. Ganas si no acusan a esa persona.',
};

export const PHASE_NAME: Record<Phase, string> = {
  lobby: 'Sala de espera',
  declare: 'Declaración',
  investigate: 'Investigación',
  defense: 'Última defensa',
  vote: 'Votación',
  runoff: 'Desempate',
  result: 'Veredicto',
  final: 'Clasificación final',
};

export const SCORE_TEXT: Record<ScoreReason, string> = {
  grupo_gana: 'El grupo acusó a la persona culpable',
  culpable_escapa: 'Se libró de la acusación',
  complice_escapa: 'La persona a la que cubría se libró',
  voto_certero: 'Votó a la persona culpable en la primera votación',
  cazador: 'Destapó una mentira con un testimonio verdadero',
  encargo: 'Cumplió su objetivo secreto',
};

/** Steps shown in the phase indicator. */
export const PHASE_STEPS: { phases: Phase[]; label: string }[] = [
  { phases: ['declare'], label: 'Declaración' },
  { phases: ['investigate'], label: 'Investigación' },
  { phases: ['defense'], label: 'Última defensa' },
  { phases: ['vote', 'runoff'], label: 'Votación' },
  { phases: ['result', 'final'], label: 'Veredicto' },
];

export const PACE_TEXT = { relajado: 'Relajado', normal: 'Normal', rapido: 'Rápido' } as const;

export function playerName(pub: PublicView | null, id: string | null | undefined): string {
  if (!pub || !id) return '¿?';
  return pub.players.find((p) => p.id === id)?.name ?? 'Alguien que se fue';
}

export function zoneName(pub: PublicView | null, id: string | null | undefined): string {
  return pub?.round?.scenario.zones.find((z) => z.id === id)?.name ?? '¿?';
}

export function lowerFirst(s: string): string {
  return s.charAt(0).toLocaleLowerCase('es') + s.slice(1);
}

export function slotLabel(pub: PublicView | null, slot: number): string {
  return pub?.round?.scenario.slots[slot] ?? '';
}

/** "a las 23:00" / "a la 01:00" */
export function atHour(label: string): string {
  return /^0?1[:.]/.test(label) ? `a la ${label}` : `a las ${label}`;
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}
