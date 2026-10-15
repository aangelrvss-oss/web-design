// npm run texts — inventory of every player-facing string in the client (JSX text and
// string/template literals that look like Spanish prose), written to docs/TEXT_INVENTORY.md,
// plus automatic checks for terminology and typography. Exits 1 if a check fails.
import ts from 'typescript';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIRS = ['src/client', 'src/shared/engine/encargos.ts'];

/** Terms replaced by the v1.1 glossary. Each maps to the preferred wording. */
const FORBIDDEN: [RegExp, string][] = [
  [/\bencargos?\b/i, 'objetivo secreto'],
  [/\bcaso \d/i, 'ronda N'],
  [/\b(el|al|del) culpable\b/i, 'la persona culpable'],
  [/\bdestap\w* (las )?coartadas/i, 'revelar las coartadas'],
  [/\bsellar coartada\b/i, 'sellar declaración'],
  [/\bestoy listo\b/i, 'pedir prueba 2 / pedir terminar'],
  [/\bcrimen\b/i, 'incidente'],
  [/\bpartida real\b|\bronda real\b/i, 'ronda de ejemplo'],
];

interface Entry {
  file: string;
  line: number;
  text: string;
}

function files(p: string): string[] {
  const full = join(ROOT, p);
  if (statSync(full).isFile()) return [full];
  return readdirSync(full).flatMap((f) => files(join(p, f)));
}

const prose = (s: string) => /[a-záéíóúñ]{3,}\s+[a-záéíóúñ]/i.test(s) || /[¿¡áéíóúñ]/.test(s);

const entries: Entry[] = [];
for (const file of DIRS.flatMap(files).filter((f) => /\.(tsx?|mts)$/.test(f))) {
  const src = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const add = (node: ts.Node, text: string) => {
    const t = text.replace(/\s+/g, ' ').trim();
    if (!t || !prose(t)) return;
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    entries.push({ file: relative(ROOT, file), line: line + 1, text: t });
  };
  const visit = (node: ts.Node) => {
    // Skip import paths, comments are not nodes; skip CSS/class strings heuristically.
    if (ts.isImportDeclaration(node)) return;
    if (ts.isJsxText(node)) add(node, node.text);
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const parent = node.parent;
      const isAttrName =
        parent && ts.isJsxAttribute(parent) && ['className', 'role', 'type', 'key', 'id', 'href'].includes(parent.name.getText());
      if (!isAttrName) add(node, node.text);
    } else if (ts.isTemplateExpression(node)) {
      add(node, node.head.text + node.templateSpans.map((s) => '{…}' + s.literal.text).join(''));
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

const problems: string[] = [];
for (const e of entries) {
  const where = `${e.file}:${e.line}`;
  for (const [re, use] of FORBIDDEN) if (re.test(e.text)) problems.push(`${where} término «${e.text.match(re)![0]}» → usar «${use}»: ${e.text}`);
  if (/ {2,}/.test(e.text)) problems.push(`${where} espacios dobles: ${e.text}`);
  if (/ [.,;:!?»)]/.test(e.text.replace(/\{…\}/g, 'x'))) problems.push(`${where} espacio antes de puntuación: ${e.text}`);
  const count = (c: string) => e.text.split(c).length - 1;
  if (count('¿') !== count('?') && count('?') > 0 && !/\?\.|\?\)/.test(e.text)) problems.push(`${where} ¿? desparejados: ${e.text}`);
  if (count('¡') !== count('!') && count('!') > 0) problems.push(`${where} ¡! desparejados: ${e.text}`);
  if (count('«') !== count('»')) {
    // A JSX text node may be split around an expression; only flag fully literal strings.
    if (!e.text.includes('{…}') && e.file.endsWith('.ts')) problems.push(`${where} «» desparejadas: ${e.text}`);
  }
}

const byFile = new Map<string, Entry[]>();
for (const e of entries) byFile.set(e.file, [...(byFile.get(e.file) ?? []), e]);
let md = `# Inventario de textos visibles\n\nGenerado por \`npm run texts\` (no editar a mano). ${entries.length} textos en ${byFile.size} archivos.\n`;
md += `Comprobaciones automáticas: terminología (${FORBIDDEN.length} términos sustituidos), espacios dobles, espacio antes de puntuación, signos ¿? ¡! y comillas «».\n`;
md += `\nResultado: ${problems.length === 0 ? 'sin problemas detectados' : `${problems.length} problemas`}.\n`;
for (const [file, list] of byFile) {
  md += `\n## ${file}\n\n`;
  for (const e of list) md += `- L${e.line}: ${e.text.replace(/\|/g, '\\|')}\n`;
}
writeFileSync(join(ROOT, 'docs/TEXT_INVENTORY.md'), md);
console.log(`${entries.length} textos → docs/TEXT_INVENTORY.md`);
if (problems.length) {
  console.error(`\n✗ ${problems.length} problema(s):`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('✓ Terminología y tipografía sin problemas detectables automáticamente.');
