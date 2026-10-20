// Every case has its own illustrated scene: one file per case, never shared, never missing, and the
// generic scenes still cover every case as a fallback. Scenes are decoration only: the engine never
// reads them (the golden fingerprints in engine-golden.test.ts pin the rules themselves).
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../src/shared/content/scenarios';
import { AMBIENCE_INTRO, CASE_AMBIENCE, CASE_SCENE, CaseScene, scenePhoto, sceneUrl } from '../src/client/ui/ambience';

const DIR = new URL('../src/client/assets/scenes/', import.meta.url);
const files = readdirSync(DIR).filter((f) => f.endsWith('.svg'));
const photos = readdirSync(DIR).filter((f) => f.endsWith('.webp'));
const svg = (file: string) => readFileSync(new URL(`${file}.svg`, DIR), 'utf8');
const ids = SCENARIOS.map((s) => s.id).sort();

describe('case scenes', () => {
  it('maps every case in the catalogue, and only those, to its own scene file', () => {
    expect(Object.keys(CASE_SCENE).sort()).toEqual(ids);
    for (const id of ids) expect(sceneUrl(id), id).toBeTruthy();
  });

  it('never gives two cases the same file, and leaves no file unused', () => {
    const used = Object.values(CASE_SCENE);
    expect(new Set(used).size).toBe(used.length);
    expect(files.map((f) => f.replace(/\.svg$/, '')).sort()).toEqual([...used].sort());
  });

  it('has no two identical drawings (a byte check; the visual review is in docs/ESCENAS.md)', () => {
    const hashes = Object.values(CASE_SCENE).map((f) => createHash('sha256').update(svg(f)).digest('hex'));
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it('keeps every scene a small, self-contained SVG of the same frame', () => {
    for (const file of Object.values(CASE_SCENE)) {
      const src = svg(file);
      expect(src.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120">'), file).toBe(true);
      expect(src.trimEnd().endsWith('</svg>'), file).toBe(true);
      // Nothing to fetch or run: no scripts, no external images or fonts, no links.
      expect(src, file).not.toMatch(/<script|<image|<foreignObject|@import|url\(|href="(?!#)|on[a-z]+=/i);
      expect(Buffer.byteLength(src), file).toBeLessThan(6_000);
    }
  });

  it('keeps the generic scenes as a fallback that covers every case', () => {
    expect(Object.keys(CASE_AMBIENCE).sort()).toEqual(ids);
    const used = new Set(Object.values(CASE_AMBIENCE));
    expect(used.size).toBe(Object.keys(AMBIENCE_INTRO).length);
  });

  it('draws the case scene as a silent image, and the generic scene for a case without a file', () => {
    const own = renderToStaticMarkup(createElement(CaseScene, { scenarioId: 'boda-tarta' }));
    // Its illustration once imported, else its drawing (a file URL in the app build; the test
    // runner inlines small assets as data URIs).
    if (scenePhoto('boda-tarta')) {
      expect(own).toMatch(/<img [^>]*src="[^"]*boda-tarta-720\.webp"/);
      expect(own).toContain('data-scene="boda-tarta-ilustracion"');
    } else {
      expect(own).toMatch(/<img [^>]*src="([^"]*boda-tarta[^"]*\.svg|data:image\/svg\+xml[^"]*)"/);
      expect(own).toContain('data-scene="boda-tarta"');
    }
    expect(own).toMatch(/<img [^>]*alt=""/);
    expect(own).not.toContain('<svg');

    expect(sceneUrl('caso-nuevo-sin-escena')).toBeNull();
    const fallback = renderToStaticMarkup(createElement(CaseScene, { scenarioId: 'caso-nuevo-sin-escena' }));
    expect(fallback).toContain('<svg');
    expect(fallback).toContain('aria-hidden="true"');
    expect(fallback).toContain('data-scene="generic-fiesta"');
    expect(fallback).not.toContain('<img');
  });

  it('only holds illustrations that belong to a case, always in both sizes', () => {
    const cases = new Set(Object.values(CASE_SCENE));
    for (const f of photos) {
      const m = f.match(/^(.+?)(-720)?\.webp$/)!;
      expect(cases.has(m[1]), f).toBe(true);
      expect(photos, f).toContain(m[2] ? `${m[1]}.webp` : `${m[1]}-720.webp`);
      expect(readFileSync(new URL(f, DIR)).subarray(8, 12).toString(), f).toBe('WEBP');
    }
  });

  it("prefers a case's illustration, needs both of its sizes, and never borrows another case's", () => {
    const p = (f: string) => `../assets/scenes/${f}`;
    const both = { [p('museo-jabali.webp')]: '/a/museo-1440.webp', [p('museo-jabali-720.webp')]: '/a/museo-720.webp' };
    expect(scenePhoto('museo-jabali', both)).toEqual({ small: '/a/museo-720.webp', large: '/a/museo-1440.webp' });
    expect(scenePhoto('museo-jabali', { [p('museo-jabali.webp')]: '/a/museo-1440.webp' })).toBeNull();
    expect(scenePhoto('rodaje-trufa', both)).toBeNull();
    expect(scenePhoto('caso-nuevo-sin-escena', both)).toBeNull();
    // Without illustrations (today) every case shows its own drawing.
    for (const id of ids) if (!photos.some((f) => f.startsWith(`${CASE_SCENE[id]}.`))) expect(scenePhoto(id)).toBeNull();
  });

  it('records one Higgsfield job per case, never shared, as a hash (scripts/scene-jobs.json)', () => {
    const jobs = JSON.parse(readFileSync(new URL('../scripts/scene-jobs.json', import.meta.url), 'utf8'));
    delete jobs._;
    expect(Object.keys(jobs).sort()).toEqual(ids);
    const values = Object.values(jobs) as string[];
    // SHA-256 of each job id: the ids themselves stay out of the repository.
    for (const v of values) expect(v).toMatch(/^[0-9a-f]{64}$/);
    expect(new Set(values).size).toBe(values.length);
  });

  it('keeps the rules apart: nothing in the shared engine or content imports the scenes', () => {
    const walk = (dir: URL): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(new URL(`${e.name}/`, dir)) : e.name.endsWith('.ts') ? [readFileSync(new URL(e.name, dir), 'utf8')] : [],
      );
    for (const src of walk(new URL('../src/shared/', import.meta.url))) expect(src).not.toMatch(/ambience|assets\/scenes|client\//);
  });
});
