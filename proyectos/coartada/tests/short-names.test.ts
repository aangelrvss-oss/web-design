// The names under the small portraits must stay readable and never be the same for two people.
import { describe, expect, it } from 'vitest';
import { shortNames } from '../src/client/lib/colors';

const run = (names: string[]) => {
  const ps = names.map((name, i) => ({ id: `p${i}`, name }));
  const s = shortNames(ps);
  return names.map((_, i) => s[`p${i}`]);
};

describe('short names under portraits', () => {
  it('keeps short names whole and shortens long ones with a dot', () => {
    expect(run(['Ana', 'Bruno', 'Maximiliano', 'Fernando Javier', 'Inmaculada'])).toEqual(['Ana', 'Bruno', 'Maxim.', 'Ferna.', 'Inmac.']);
  });

  it('never gives two people the same label, however alike their names are', () => {
    const groups = [
      ['Maricarmen', 'Mariano', 'Mariana', 'María José', 'María Luisa'],
      ['Fernando Javier', 'Fernando López', 'Fernanda'],
      ['Ana', 'Ana 2', 'Ana María', 'Anabel'],
      ['Concepción', 'Concha', 'Conchita', 'Consuelo', 'Constantino'],
    ];
    for (const names of groups) {
      const labels = run(names);
      expect(new Set(labels).size).toBe(names.length);
      // Every label still starts like the name it stands for.
      labels.forEach((l, i) => expect(names[i].startsWith(l.replace(/\.$/, ''))).toBe(true));
    }
  });

  it('uses the first word when it fits and is unique', () => {
    expect(run(['Luis Miguel', 'Eva'])).toEqual(['Luis', 'Eva']);
    expect(run(['Ana López', 'Ana'])).toEqual(['Ana L.', 'Ana']);
  });
});
