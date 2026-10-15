// All player-facing copy lives here (Spanish, Spain).
import type { ErrorCode } from '../../shared/protocol';
import type { PublicView } from '../../shared/engine/views';
import type { Phase, Role, ScoreReason } from '../../shared/types';

export const ERRORS: Record<ErrorCode, string> = {
  invalid: 'Eso no se puede hacer así.',
  rate_limited: 'Demasiado rápido. Espera un segundo.',
  no_room: 'No existe ninguna sala con ese código.',
  bad_token: 'No se pudo recuperar tu sitio en la sala.',
  not_in_room: 'Sin conexión con la sala. Reconectando…',
  too_many_rooms: 'Has creado demasiadas salas seguidas. Prueba en unos minutos.',
  server_busy: 'El servidor no responde. Comprueba la conexión.',
  not_host: 'Solo quien dirige la sala puede hacer eso.',
  wrong_phase: 'Ese momento ya pasó.',
  not_participant: 'Estás mirando esta ronda; entras en la siguiente.',
  already_done: 'Eso ya está hecho.',
  not_enough_players: 'Hacen falta al menos 4 personas conectadas.',
  too_many_players: 'Máximo 10 personas por ronda.',
  room_full: 'La sala está llena (10 personas).',
  limit_reached: 'Ya has usado tus 3 testimonios.',
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
  inocente: 'Tú no fuiste. Ayuda al grupo a acusar a quien sí.',
  culpable: 'Fuiste tú. Que acusen a cualquier otra persona.',
  complice: 'No lo hiciste, pero cubres a quien sí. Que no le acusen.',
};

export const PHASE_NAME: Record<Phase, string> = {
  lobby: 'Sala de espera',
  declare: 'Declaración',
  investigate: 'Investigación',
  vote: 'Votación',
  runoff: 'Desempate',
  result: 'Veredicto',
  final: 'Clasificación final',
};

export const SCORE_TEXT: Record<ScoreReason, string> = {
  grupo_gana: 'El grupo pilló al culpable',
  culpable_escapa: 'Te saliste con la tuya',
  complice_escapa: 'Tu culpable escapó',
  voto_certero: 'Votaste al culpable',
  cazador: 'Tu testimonio destapó una mentira',
  encargo: 'Cumpliste tu encargo',
};

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
