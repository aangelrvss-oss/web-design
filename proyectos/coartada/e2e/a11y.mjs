// Basic automated accessibility check with axe-core (WCAG 2 A/AA rules).
// Reports serious and critical violations; a page with none still needs manual review.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
// Evaluated directly (not as a <script> tag) so the app's strict CSP stays on.
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

export async function auditA11y(page, label, errors, report = []) {
  await page.evaluate(axeSource);
  const res = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target?.join(' ') ?? '' }));
  });
  const bad = res.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  report.push({ screen: label, violations: res });
  for (const v of bad) errors.push(`a11y ${label}: ${v.id} (${v.impact}, ${v.nodes} nodos, p. ej. ${v.sample})`);
  return res;
}
