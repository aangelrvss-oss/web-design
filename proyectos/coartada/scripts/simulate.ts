// Balance simulator: plays thousands of seeded rounds through the real engine with
// simple scripted bots, and reports how often the group catches the culprit.
//
// Bots are NOT humans: they never read faces, never bluff socially and use a fixed
// suspicion formula. The numbers show whether the information structure is sane
// (neither trivially solvable nor hopeless), not how a real table will play.
//
//   npm run simulate              # default 300 rounds per configuration
//   npm run simulate -- 1000      # more rounds

import { playRound, type CulpritStrategy } from './sim/core';
import { timingsFor } from '../src/shared/types';

function main() {
  const rounds = Number(process.argv[2] ?? 300);
  const strategies: CulpritStrategy[] = ['minimo', 'esquiva', 'total'];
  const sizes = [4, 5, 6, 7, 8, 10];
  const pct = (a: number, b: number) => `${((100 * a) / b).toFixed(1)}%`.padStart(6);
  console.log(`COARTADA v1.1 — simulación con bots: ${rounds} rondas por celda (${rounds * sizes.length * strategies.length} en total)`);
  console.log(process.env.INDEPENDENT ? 'Modo: cada bot decide por su cuenta (sin consenso de mesa).' : 'Modo: la mesa comparte criterio de desempate (consenso tras hablar).');
  console.log('Bots, no personas: deducen con una fórmula fija, no leen caras ni cambian de idea tras la defensa.\n');
  console.log('jug. | estrategia | grupo gana | culpable escapa | cómplice escapa | desempate | nadie acusado | defensa | sorteo | defiende culpable | compatibles (verdad / declarado) | inválidas');
  const totals: Record<string, { caught: number; n: number }> = {};
  let stuck = 0;
  for (const n of sizes) {
    for (const strategy of strategies) {
      const acc = { caught: 0, runoff: 0, nobody: 0, acc: 0, defense: 0, tie: 0, defCulprit: 0, compT: 0, compD: 0, invalid: 0 };
      for (let i = 0; i < rounds; i++) {
        let r;
        try {
          r = playRound({ n, seed: `${n}-${strategy}-${i}`, strategy, noise: 0.5, independent: !!process.env.INDEPENDENT });
        } catch (err) {
          stuck++;
          console.error(`  ronda bloqueada o inválida (${n}, ${strategy}, ${i}): ${(err as Error).message}`);
          continue;
        }
        if (r.caught) acc.caught++;
        if (r.runoff) acc.runoff++;
        if (r.nobodyAccused) acc.nobody++;
        if (r.hasAccomplice && !r.caught) acc.acc++;
        if (r.defenseHeld) acc.defense++;
        if (r.defenseTie) acc.tie++;
        if (r.defenderIsCulprit) acc.defCulprit++;
        acc.compT += r.compatibleTruth;
        acc.compD += r.compatibleDeclared;
        if (r.invalid) acc.invalid++;
      }
      (totals[strategy] ??= { caught: 0, n: 0 }).caught += acc.caught;
      totals[strategy].n += rounds;
      const accEsc = n >= 6 ? pct(acc.acc, rounds) : '   n/a';
      console.log(
        `${String(n).padStart(4)} | ${strategy.padEnd(10)} | ${pct(acc.caught, rounds).padStart(10)} | ${pct(rounds - acc.caught, rounds).padStart(15)} | ${accEsc.padStart(15)} | ${pct(acc.runoff, rounds).padStart(9)} | ${pct(acc.nobody, rounds).padStart(13)} | ${pct(acc.defense, rounds).padStart(7)} | ${pct(acc.tie, rounds).padStart(6)} | ${pct(acc.defCulprit, rounds).padStart(17)} | ${(acc.compT / rounds).toFixed(2).padStart(14)} / ${(acc.compD / rounds).toFixed(2).padStart(4)}     | ${String(acc.invalid).padStart(9)}`,
      );
    }
  }
  console.log('\nMedia del grupo por estrategia del culpable:');
  for (const [k, v] of Object.entries(totals)) console.log(`  ${k}: el grupo gana ${((100 * v.caught) / v.n).toFixed(1)}%`);
  console.log(`\nRondas bloqueadas o con estado inválido: ${stuck}`);
  console.log('\nDuración máxima por ronda con los temporizadores (sin veredicto ni desempate), ritmo normal:');
  for (const n of sizes) {
    const t = timingsFor('normal', n);
    const secs = t.declare + t.investigate1 + t.investigate2 + t.defense + t.vote;
    console.log(`  ${n} jugadores: ${(secs / 60).toFixed(1)} min (declaración ${t.declare}s, investigación ${t.investigate1}+${t.investigate2}s, defensa ${t.defense}s, votación ${t.vote}s)`);
  }
}

main();

