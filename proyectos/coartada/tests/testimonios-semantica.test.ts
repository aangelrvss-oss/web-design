// What a testimony is, and what the app can and cannot say about it (docs/PRUEBA-FALSA.md, section 1).
// Mentir en un testimonio es una regla deliberada (RULES.md: «Can be true or false»); estas pruebas
// fijan las cuatro categorías para que ningún cambio las mezcle:
//  - afirmación de un jugador: el motor la acepta sin compararla con la verdad;
//  - coincidencia comprobada por el motor: dos afirmaciones encajan (no que sean verdad);
//  - contradicción demostrada: al menos una de las dos es falsa (no cuál);
//  - declaración que no puede verificarse: la coartada de X es automática (sin contraste).
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../src/shared/content/scenarios';
import { declare, testify, tick } from '../src/shared/engine/game';
import { testimonyStatus } from '../src/shared/engine/encargos';
import { publicView } from '../src/shared/engine/views';
import { started, T0 } from './helpers';

/** A round in the investigation: everyone seals the truth except the culprit, who lies at the crime. */
function investigating(n = 5, seed = 'testimonios') {
  const s = started(n, seed);
  const { room, setup, culprit } = s;
  const T = setup.scene.slot;
  return { ...s, T, room, setup, culprit };
}

describe('testimonios: qué afirma un jugador y qué comprueba el motor', () => {
  it('el motor acepta una afirmación inventada (no sale de ningún recuerdo) y solo la compara con la coartada', () => {
    const { room, setup, culprit, innocents, T, ids } = investigating();
    // The culprit claims, at the crime hour, the zone one innocent truly was in: a lie that
    // the innocent's sealed alibi will "match".
    const witness = innocents[0];
    const lieZone = setup.truth[witness][T];
    for (const p of ids) {
      const zones = setup.truth[p].slice();
      if (p === culprit) zones[T] = lieZone;
      expect(declare(room, p, zones, true, T0).ok).toBe(true);
    }
    expect(room.phase).toBe('investigate');
    // Nothing in the culprit's memories says they were with the witness at the crime hour.
    expect(setup.memories[culprit].some((m) => m.with === witness && m.slot === T)).toBe(false);
    const res = testify(room, culprit, witness, T, T0);
    expect(res.ok).toBe(true);
    const t = room.round!.testimonies.at(-1)!;
    // The place is not chosen by the speaker: it is their own declared place at that hour.
    expect(t.zone).toBe(lieZone);
    // «Coincide»: the two public versions fit…
    expect(testimonyStatus(room.round!, t)).toBe('coincide');
    // …and it is false: the culprit was at the scene at that hour.
    expect(setup.truth[culprit][T]).toBe(setup.scene.zone);
    expect(setup.truth[culprit][T]).not.toBe(t.zone);
  });

  it('una contradicción demuestra que al menos una versión es falsa, no cuál; el veredicto distingue cuál era', () => {
    const { room, setup, culprit, innocents, T, ids } = investigating(6, 'contradiccion');
    for (const p of ids) {
      const zones = setup.truth[p].slice();
      if (p === culprit) zones[T] = setup.zones.find((z) => z !== setup.scene.zone)!;
      declare(room, p, zones, true, T0);
    }
    const round = room.round!;
    // A true testimony that contradicts a false alibi: an innocent who really was with the
    // culprit at another hour, if the culprit lied there… Build the two cases explicitly instead:
    // (a) an innocent claims to have been with another innocent where that one did NOT declare.
    const pair = innocents
      .flatMap((a) => innocents.filter((b) => b !== a).map((b) => [a, b] as const))
      .map(([a, b]) => ({ a, b, slot: [0, 1, 2].find((s) => setup.truth[a][s] !== setup.truth[b][s]) }))
      .find((x) => x.slot !== undefined);
    if (!pair) throw new Error('every innocent spent the whole night together in this seed');
    const { a, b } = pair;
    const slotWhereApart = pair.slot!;
    expect(testify(room, a, b, slotWhereApart, T0).ok).toBe(true);
    const falseClaim = round.testimonies.at(-1)!;
    expect(testimonyStatus(round, falseClaim)).toBe('contradice');
    // The public view says only «contradice»: never which of the two is lying.
    const pub = publicView(room, SCENARIOS);
    const shown = pub.round!.testimonies.find((t) => t.id === falseClaim.id)!;
    expect(Object.keys(shown).sort()).toEqual(['by', 'id', 'slot', 'status', 'subject', 'zone']);
    expect(shown.status).toBe('contradice');
    // Here the speaker lied (b's sealed alibi is the truth): no real lie was exposed.
    expect(setup.truth[b][slotWhereApart]).not.toBe(falseClaim.zone);
  });

  it('solo una contradicción con un testimonio verdadero sobre una coartada falsa cuenta como mentira destapada', async () => {
    const { computeOutcome } = await import('../src/shared/engine/game');
    // Search seeds for a culprit memory at a non-crime hour, so the culprit can lie there and be
    // contradicted by someone who truly was with them.
    for (let k = 0; k < 40; k++) {
      const { room, setup, culprit, ids, T } = investigating(6, `destapar-${k}`);
      const m = ids
        .filter((p) => p !== culprit)
        .flatMap((p) => setup.memories[p].map((mm) => ({ by: p, ...mm })))
        .find((mm) => mm.with === culprit && mm.slot !== T);
      if (!m) continue;
      for (const p of ids) {
        const zones = setup.truth[p].slice();
        if (p === culprit) {
          zones[T] = setup.zones.find((z) => z !== setup.scene.zone)!;
          zones[m.slot] = setup.zones.find((z) => z !== setup.truth[culprit][m.slot])!; // lies here too
        }
        declare(room, p, zones, true, T0);
      }
      expect(testify(room, m.by, culprit, m.slot, T0).ok).toBe(true);
      const round = room.round!;
      const t = round.testimonies.at(-1)!;
      expect(testimonyStatus(round, t)).toBe('contradice');
      const outcome = computeOutcome(round, null);
      expect(outcome.exposing).toContain(t.id); // true testimony + false alibi = a real lie exposed
      expect(outcome.score[m.by].some((l) => l.reason === 'cazador')).toBe(true);
      return;
    }
    throw new Error('no seed with a usable memory about the culprit');
  });

  it('una coartada automática no se puede contrastar: «sin contraste», nunca coincide ni contradice', () => {
    const { room, setup, ids, innocents } = investigating(5, 'sin-contraste');
    const silent = innocents[1];
    for (const p of ids) if (p !== silent) declare(room, p, setup.truth[p].slice(), true, T0);
    expect(room.phase).toBe('declare');
    tick(room, room.phaseEndsAt!); // the timer runs out: `silent` gets an automatic alibi
    expect(room.phase).toBe('investigate');
    expect(room.round!.declarations[silent]!.auto).toBe(true);
    const speaker = innocents[0];
    testify(room, speaker, silent, 0, T0);
    const t = room.round!.testimonies.at(-1)!;
    expect(testimonyStatus(room.round!, t)).toBe('sin_contraste');
    const pub = publicView(room, SCENARIOS);
    expect(pub.round!.testimonies.find((x) => x.id === t.id)!.status).toBe('sin_contraste');
  });

  it('antes del veredicto la vista pública no dice nunca si un testimonio es cierto', () => {
    const { room, setup, ids } = investigating(5, 'sin-verdad');
    for (const p of ids) declare(room, p, setup.truth[p].slice(), true, T0);
    const [a] = ids;
    const m = setup.memories[a][0];
    testify(room, a, m.with, m.slot, T0);
    const json = JSON.stringify(publicView(room, SCENARIOS));
    expect(json).not.toMatch(/"truth"|"memories"|"roles"|"exposing"|"cierto"|"verdadero"/i);
    expect(publicView(room, SCENARIOS).round!.reveal).toBeNull();
  });
});
