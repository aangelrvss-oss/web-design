// Player pin colours: distinct on paper and on ink, none of them stamp-red
// (red is reserved for contradictions and actions).
export const PIN_COLORS = ['#2f5d8a', '#3c7a4e', '#b07a24', '#7a4c8c', '#23807f', '#9a5236', '#5b6b2f', '#8c3c62', '#4a4a9c', '#6b5040'];

export function pinColor(index: number): string {
  return PIN_COLORS[index % PIN_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return Array.from(parts[0]).slice(0, 2).join('').toUpperCase();
  return (Array.from(parts[0])[0] + Array.from(parts[1])[0]).toUpperCase();
}
