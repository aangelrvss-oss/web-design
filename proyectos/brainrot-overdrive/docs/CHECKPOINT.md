# CHECKPOINT — BRAINROT OVERDRIVE

_Last updated: 2026-10-15. Everything below marked "verified" was run in this environment; anything
not verifiable here is listed under "Not verified"._

## How to run

```bash
cd proyectos/brainrot-overdrive
npm install
npm run dev                 # http://127.0.0.1:5173/
# production
npm run build && npm run preview   # http://127.0.0.1:4173/
```

From the repo root: `npm run dev:brainrot` / `build:brainrot` / `test:brainrot` (after `npm install` in the project folder).

## What exists

A complete, playable game:

- **Flow**: animated main menu → (character select after the first run) → run → pause → level-up/crate
  picks → death or victory → results (grade, generated title, stats, build breakdown, achievements,
  share) → instant retry (R) or menu. Records, settings and "How to" screens. Daily challenge.
- **Gameplay**: responsive movement, auto-fire with mouse aim or auto-aim, invulnerable dash, Overdrive
  meter, kill combo with score multiplier, XP gems with magnet/merging, grass heals, router vacuum, loot crates.
- **Content**: 4 characters (3 unlockable), 6 weapons × 5 levels, 15 passives, 3 cursed trade-offs,
  9 synergies (all implemented as interactions), 5 enemy archetypes (+ the Reply split-off), the Copypasta elite + Certified elites,
  2 multi-phase bosses (The Doomscroller, The Algorithm with the TOUCH GRASS mechanic), scripted waves
  (hordes with escape gaps, rushes), 5 daily modifiers, 11 achievements.
- **Presentation**: procedural ink-sticker art for every sprite, layered arena (parallax void, grid floor,
  decals, light pools, firewall border), particles/rings/lightning/afterimages, hit-flash, knockback,
  hit-stop, restrained configurable shake, bitmap damage numbers (capped), boss title cards, announcer.
- **Audio**: synthesized SFX + procedural adaptive soundtrack; master/music/SFX volume + mute.
- **Settings** (persisted): volumes, mute, shake, visual intensity (also caps crowd size), reduced
  motion, aim mode, damage numbers, FPS counter, reset progress.
- **Mobile**: floating joystick, DASH and OD buttons with cooldown, auto-aim, safe-area aware layout,
  portrait and landscape.

Architecture and design rationale: `docs/GAME_DESIGN.md`. Working rules: `CLAUDE.md`.

## Test results (actual)

| Check | Command | Result |
|---|---|---|
| Type check + production build | `npm run build` | ✅ passes (bundle 1.36 MB JS / 376 kB gzip, mostly Phaser) |
| Unit tests | `npm test` | ✅ 42/42 (RNG, spatial grid, XP curve, weapons, upgrade eligibility/stacking/offers, forced synergy offers, stats clamping, combat math, score/grade/titles, wave director determinism/cap/boss timing/escalation, save round-trip + corrupt/blocked storage, daily seed + midnight boundary, achievements, design guards) |
| End-to-end (dev server) | `npm run qa` | ✅ 52/52 |
| End-to-end (production `vite preview`) | `node qa/e2e.mjs http://127.0.0.1:4173/` | ✅ 52/52 |
| Runtime console errors | e2e collects `pageerror`/console errors in every flow | ✅ none |

The e2e suite drives real headless Chromium (Playwright) and covers: menu + keyboard navigation; no
AudioContext before a gesture and a running one after; SFX synthesis; WASD/arrow movement; dash
cooldown + i-frames; first level-up time; number-key picks and reroll; Esc pause freezes time and
resumes; death → results with title; share reports its real outcome (clipboard path in headless);
retry resets state; 6 restart cycles with constant display-list size and listener counts; quit to menu;
settings + best score + achievements persist across reload; reduced-motion class; records screen;
character select + locked character refusal; daily seed/modifier + per-date best; full victory against
The Algorithm; Doomscroller spawn, phase lock and defeat; mobile 390×844 @2× (no overflow, touch
controls, joystick moves the player, touch dash, cards fit) and landscape resize; desktop resize; blur auto-pause.

## Balance / pacing evidence

`qa/pacing.mjs` runs the real game with a simple autopilot (kites enemies, grabs gems, frame-perfect
reactive dash, ignores telegraphs, **picks upgrades at random**). Latest batch of 5 runs:

- First level-up at ~10–15 s; level 2–3 by 0:20; level 8–16 at the 4:00 boss.
- 2/5 victories (≈ 8:45 total run time), deaths at 4:01, 5:41 and 6:49.
- The Doomscroller fight: 20–60 s. The Algorithm fight: ~40–45 s (phase locks guarantee ≥ 9 s per phase).

Tuning history (all driven by these runs): early spawns moved closer (first reward was too slow), Reply
Guys + Split Personality outlier nerfed (it deleted The Algorithm in ~7 s), phase locks added, late HP
scaling and boss HP raised (5/5 wins was too easy), synergy discovery guarantee added (synergies
appeared in only ~4% of offers), crowd cleared on boss arrival (deaths spiked at boss spawn).
This is reasoned tuning plus bot evidence, **not** statistically validated human balance.

## Performance

- CPU cost per frame (simulation + sprite sync) with ~110–200 enemies, 15+ projectiles, maxed build:
  **0.51 ms average, 1.2 ms p95** on the production build (`qa/perf.mjs`); one 25 ms outlier frame
  (likely GC / first-use compilation).
- JS heap after GC is flat across 8 consecutive runs (≈ 48 MB each) — no leak across restarts.
- Bounded pools: enemies (190 / 120 on low), player shots 420, enemy shots 320, particles per emitter
  160–700, damage numbers from a 70-object pool (≤ 14 regular + 12 crit live), rings 48, puddles 90, gems merge past 280.
- The "low" visual tier reduces particles, hides non-crit numbers, disables ambient motes and lowers the crowd cap.

## Not verified / limitations

- **GPU frame rate on real hardware was not measured.** This container has no GPU; headless Chromium uses
  software WebGL at ~4 FPS, so rendering cost could not be profiled. Expected to be light (batched sprites,
  additive blending, no post-processing shaders) but it needs a check on a mid-range phone.
- **Audio was not listened to.** Verified only that the context starts after a gesture, voices are created and
  nothing throws.
- Tested only in Chromium (desktop + mobile emulation). Safari/iOS and Firefox are untested.
- Visual screenshots in `qa/out/` taken via `advance()` can show effects lingering longer than in real play
  (software rendering); judge feel on real hardware.
- Once any touch input is used, the session keeps auto-aim and touch controls (by design for phones; on a
  touchscreen laptop the mouse-aim setting is ignored for that session).
- No gamepad support.

## Next priorities

1. Play-test on real hardware (desktop GPU + a mid-range Android/iPhone): frame time, touch feel, audio mix.
2. Human balance pass: record a few real runs and compare with the autopilot curve.
3. Code-split Phaser to reduce the initial bundle; add a PWA manifest/service worker for installable offline play.
4. More content per build direction (one more weapon per tag, a third boss variant) once the core is validated.
