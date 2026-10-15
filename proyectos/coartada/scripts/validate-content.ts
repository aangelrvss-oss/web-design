// npm run validate — checks every scenario for shape errors and generates rounds for
// every player count (4–10) to prove each one is internally consistent and playable.
import { SCENARIOS } from '../src/shared/content/scenarios';
import { validateCatalogue } from '../src/shared/content/validate';

const seeds = Number(process.argv[2] ?? 25);
const t0 = Date.now();
const errors = validateCatalogue(SCENARIOS, seeds);
const zoneNames = new Map<string, string[]>();
for (const s of SCENARIOS) for (const z of s.zones) zoneNames.set(z.name, [...(zoneNames.get(z.name) ?? []), s.id]);
const repeated = [...zoneNames.entries()].filter(([, v]) => v.length > 2);

console.log(`${SCENARIOS.length} scenarios · ${seeds} seeds × 7 player counts each · ${Date.now() - t0} ms`);
if (repeated.length) {
  console.log('\nNote — zone names used in 3+ scenarios (fine, but watch for sameness):');
  for (const [name, ids] of repeated) console.log(`  ${name}: ${ids.join(', ')}`);
}
if (errors.length) {
  console.error(`\n✗ ${errors.length} problem(s):`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log('\n✓ All scenarios valid.');
