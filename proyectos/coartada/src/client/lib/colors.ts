// Player pin colours: distinct on paper and on ink, none of them stamp-red
// (red is reserved for contradictions and actions).
// All ten keep white initials at ≥ 4.5:1 contrast (WCAG AA for small bold text).
export const PIN_COLORS = ['#2f5d8a', '#36704a', '#8a5a12', '#7a4c8c', '#1d6b6a', '#9a5236', '#56652b', '#8c3c62', '#4a4a9c', '#6b5040'];

export function pinColor(index: number): string {
  return PIN_COLORS[index % PIN_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return Array.from(parts[0]).slice(0, 2).join('').toUpperCase();
  return (Array.from(parts[0])[0] + Array.from(parts[1])[0]).toUpperCase();
}
