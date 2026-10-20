// Character portraits: the twelve dossier illustrations (ink, cream paper, a dark red accent),
// cut from the approved character sheet into a head crop for pins and a half-length card for the
// picker. Local files, inlined in the standalone demo. Purely visual: no portrait looks more or
// less guilty, and a portrait never replaces the player's own name.
import type { AvatarId } from '../../shared/characters';

const files = import.meta.glob<string>('../assets/characters/*.webp', { eager: true, import: 'default' });
const src = (name: string) => files[`../assets/characters/${name}.webp`];

const LABEL: Record<AvatarId, string> = {
  periodista: 'Periodista',
  detective: 'Detective',
  profesora: 'Profesora',
  cocinero: 'Cocinero',
  empresaria: 'Empresaria',
  mecanico: 'Mecánico',
  abogado: 'Abogado',
  estudiante: 'Estudiante',
  medica: 'Médica',
  banquero: 'Banquero',
  camarera: 'Camarera',
  artista: 'Artista',
};

/** Visual description of a character (picker captions and accessible text; never a player's name). */
export function avatarLabel(id: AvatarId): string {
  return LABEL[id];
}

/** Head and shoulders, square: inside round pins. */
export function Portrait({ id, className }: { id: AvatarId; className?: string }) {
  return <img className={className} src={src(id)} alt="" width={128} height={128} draggable={false} decoding="async" />;
}

/** Half-length card with the character's prop: the picker. */
export function PortraitCard({ id, className }: { id: AvatarId; className?: string }) {
  return <img className={className} src={src(`${id}-card`)} alt="" width={165} height={297} draggable={false} decoding="async" />;
}
