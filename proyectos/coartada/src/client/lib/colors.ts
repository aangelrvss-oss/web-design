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

/**
 * Short labels for names under small portraits (board, "who has sealed/voted"). The whole name if
 * it fits, else its first word, else a prefix with a dot; whenever two people would get the same
 * label, both get a longer prefix until they differ. Never the same label for two people.
 */
export function shortNames(players: { id: string; name: string }[], max = 6): Record<string, string> {
  const level: Record<string, number> = {};
  const label = (p: { id: string; name: string }) => {
    const n = p.name.trim();
    const chars = Array.from(n);
    if (chars.length <= max) return n;
    const [first, second] = n.split(/\s+/);
    const lvl = level[p.id];
    if (lvl === 0 && Array.from(first).length <= max) return first;
    // Same first name: the initial of the second word ("Ana L.").
    if (lvl === 1 && second && Array.from(first).length <= max) return `${first} ${Array.from(second)[0]}.`;
    const k = max - 1 + lvl;
    if (k >= chars.length) return n;
    return chars.slice(0, k).join('').trimEnd() + '.';
  };
  for (const p of players) level[p.id] = 0;
  for (let round = 0; round < 40; round++) {
    const groups = new Map<string, string[]>();
    for (const p of players) {
      const l = label(p);
      groups.set(l, [...(groups.get(l) ?? []), p.id]);
    }
    const clashes = [...groups.values()].filter((ids) => ids.length > 1);
    if (!clashes.length) break;
    for (const ids of clashes) for (const id of ids) level[id]++;
  }
  return Object.fromEntries(players.map((p) => [p.id, label(p)]));
}
