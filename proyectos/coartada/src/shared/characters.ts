// The twelve characters a player can pick to be drawn as. Purely visual: they have no ability,
// no relation to roles and are never shown instead of the player's own name.
export const AVATARS = [
  'periodista',
  'detective',
  'profesora',
  'cocinero',
  'empresaria',
  'mecanico',
  'abogado',
  'estudiante',
  'medica',
  'banquero',
  'camarera',
  'artista',
] as const;

export type AvatarId = (typeof AVATARS)[number];

export function isAvatar(x: unknown): x is AvatarId {
  return typeof x === 'string' && (AVATARS as readonly string[]).includes(x);
}
