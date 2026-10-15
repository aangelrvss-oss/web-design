# BRAINROT OVERDRIVE — working notes for Claude

Original top-down arena-survival roguelite. Phaser 3.90 (WebGL) + TypeScript + Vite. DOM for all UI.
Everything (art, sound, music) is generated at runtime — there are no image or audio files.

## Commands (run inside `proyectos/brainrot-overdrive/`)

```bash
npm install
npm run dev            # http://127.0.0.1:5173/
npm run build          # tsc --noEmit + vite build → dist/
npm test               # vitest unit tests (pure logic, no browser)
npm run qa             # e2e in headless Chromium; needs `npm run dev` running (or pass a URL)
node qa/pacing.mjs [url] [runs]   # autopilot runs → pacing report
node qa/perf.mjs [url]            # CPU cost per frame under heavy load
```

QA hooks exist only with `?qa` in the URL (`window.__bro`, `window.__app`, `window.__audio`).
Headless Chromium here has no GPU (software WebGL ≈ 4 FPS, Phaser clamps delta to 16 ms), so tests
advance the real simulation with `__bro.advance(seconds, autoPick, renderEach)` instead of waiting.

## Architecture rules

- `src/config/balance.ts` + `src/data/*` hold every tunable number and all content. Tune there.
- `src/logic/*` is pure (no Phaser/DOM) and unit-tested. Keep it that way.
- `src/systems/*` are Phaser-side systems; they talk to the game only through `GameCtx` (`systems/ctx.ts`).
- `src/scenes/GameScene.ts` is the hub: damage/kill pipeline, synergies, combo, overdrive, level-ups.
- `src/app.ts` is the shell: menus, persistence, run lifecycle. `src/ui/*` is DOM-only.
- Gameplay randomness uses the seeded `Rng` streams (daily runs depend on it); `Math.random` only for visuals.
- Enemy removal is deferred (`EnemySystem.flush()`), so grid indices stay valid during a step. Always
  check `e.active` when iterating.
- Input listeners are global and bound once (`core/input.ts`); never add per-scene DOM listeners.
  Anything registered in a scene must be removed in `GameScene.cleanup()` (SHUTDOWN).
- Colour language: cool (cyan/violet/magenta) = player; warm (orange/red) = danger; gold = elite/crit.
- A new synergy must be checked with `has('<id>')` somewhere in `src/` — `tests/design.test.ts` enforces it.

## Docs

- `docs/GAME_DESIGN.md` — design, research notes, systems, risks.
- `docs/CHECKPOINT.md` — verified state, test results, known issues, next steps. Update it when you change things.
