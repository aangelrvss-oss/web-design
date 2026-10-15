# BRAINROT OVERDRIVE

An original top-down arena-survival roguelite for the browser. You're NPC #404, a background character who
gained sentience mid-scroll. Survive the Feed for 8 minutes, build absurd synergies, scroll past
The Doomscroller and make The Algorithm let you log off.

- Phaser 3.90 (WebGL) + TypeScript + Vite; DOM interface
- All art, sound effects and music are generated in code — no external assets, no network at runtime
- Desktop (keyboard + mouse) and mobile (touch joystick + buttons)
- Progress (settings, records, achievements, daily bests) saved in `localStorage` on this device only

## Play locally

```bash
cd proyectos/brainrot-overdrive
npm install
npm run dev        # → http://127.0.0.1:5173/
```

Production build: `npm run build`, then `npm run preview` (→ http://127.0.0.1:4173/) or serve `dist/` with any static server.

## Controls

| Action | Desktop | Touch |
|---|---|---|
| Move | WASD / arrows | Drag on the left half |
| Aim | Mouse (or auto-aim in Settings) | Automatic |
| Attack | Automatic | Automatic |
| Dash (invulnerable) | Space / Shift / right-click | DASH button |
| Overdrive | E / F | OD button |
| Pick upgrade | Click or 1 / 2 / 3, R to reroll | Tap |
| Pause | Esc / P | ❚❚ button |

## Tests

```bash
npm test                         # unit tests (logic, persistence, design guards)
npm run dev & npm run qa         # end-to-end checks in headless Chromium
node qa/pacing.mjs URL 4         # autopilot runs → pacing report
node qa/perf.mjs URL             # CPU cost per frame under heavy load
```

Docs: [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) · [`docs/CHECKPOINT.md`](docs/CHECKPOINT.md) · [`CLAUDE.md`](CLAUDE.md)

Fonts: Unbounded and Space Grotesk (SIL Open Font License), bundled via Fontsource.
