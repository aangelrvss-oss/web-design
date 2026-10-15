# BRAINROT OVERDRIVE — Game Design

## 1. Pitch

You are **NPC #404**, a background character who gained sentience mid-scroll. The Feed — a corrupted,
infinite social arena — sends absurd creatures to pull you back in. Survive 8 minutes, scroll past
**The Doomscroller** (4:00), and make **The Algorithm** (8:00) let you log off.

Top-down arena survival roguelite. Short runs (≤ 9 min), instant restart, builds that get gloriously
out of hand. Original characters, names, art and sound; inspired by genre patterns, not by any one game.

## 2. Research notes (short, focused)

Sources: a handful of articles and reviews found via web search on 2026-10-15 (listed in the final
report). Verified = stated by several sources or by the developer; speculation = my inference.

| Game | Observation | Status | What we took |
|---|---|---|---|
| Vampire Survivors | Attacks are automatic; the player's job is movement and choices. Minimal learning curve. | Verified (several sources) | Auto-fire, movement-first play, 1-of-3 level-up choices |
| Vampire Survivors | Even failed runs give progress (unlocks), driving "one more run". | Verified | Small set of achievements that unlock characters |
| Megabonk (2025) | Viral through streamers: high chaos, unpredictable runs, meme-y tone. Critics: "shallow but addictive". | Verified (reviews) | Chaos must stay readable; humour in names/announcer, not noise |
| Megabonk | Terrain/verticality added tactical depth over the 2D formula. | Verified | We add tactical depth through **telegraphed enemy attacks** and boss mechanics instead of terrain |
| CloverPit / Balatro | Fun comes from anticipating outcomes and discovering how items combine. | Verified (developer + reviews) | Synergies are learnable combos; cards name the combo that unlocked them |
| CloverPit | A large item pool dilutes the odds of finding the synergies you need. | Verified (review criticism) | Small pool (33 upgrades incl. 6 weapons) + a **discovery guarantee**: a newly unlocked synergy is always offered next level |
| Genre | Rewards should arrive quickly; long dry spells kill momentum. | Speculation backed by our pacing sim | First level-up ≈ 10–15 s; elites drop loot crates mid-wave |

## 3. Emotional arc of a run

| Phase | Time | Feeling | How |
|---|---|---|---|
| Opening | 0:00–1:30 | "I get it, I'm strong" | Slow pursuers only, quick first level-up, tutorial hints that vanish as you do them |
| Build-up | 1:30–4:00 | "My build is becoming a thing" | Dashers, ranged and splitter enemies; first elite + loot crate; synergies unlock |
| Mid boss | 4:00 | "Oh no, it's huge" | The Doomscroller: segmented worm with charge, bombardment and bullet rings |
| Escalation | 5:00–8:00 | "This is chaos and I'm the chaos" | Encirclement hordes, Any% rush, double elites; Overdrive moments |
| Finale | 8:00+ | "Read the floor or die" | The Algorithm: 3 phases, ending with **TOUCH GRASS** (stand in a grass patch or take a pulse) |
| End | — | "One more" | Grade, funny title from real stats, records, unlocks, instant retry (R) |

## 4. Core mechanics

- **Move** (WASD/arrows, left-thumb joystick). Responsive: exponential acceleration and friction.
- **Auto-fire** primary weapon toward the mouse (or nearest threat with auto-aim/touch; bosses and elites
  are prioritised).
- **Dash** (Space/Shift/right-click, touch button): 0.17 s burst, invulnerable, 1.55 s cooldown shown on the HUD.
- **Overdrive** (E/F, touch OD): kills fill a meter (decays if you stop killing, getting hit costs 14%).
  Full → 7 s of double fire rate, +25% damage, a knockback blast and a music filter sweep. Risk/reward:
  hold it for a boss or burn it to escape a swarm.
- **Combo**: kills within 2.6 s chain; every 25 kills +0.25× score (max 3×). A hit resets it.
- **XP gems** (cyan 1, magenta 5, gold 20+) merge past 280 on the floor. Magnet range upgrades.
- **Items**: grass (heals 22%), router (pulls every gem), loot crate (elite drop: rare-or-better pick).

## 5. Enemies (all original)

| Enemy | Role | Readability |
|---|---|---|
| Smooth Brain | Basic pursuer, swarms | Pink, googly eyes, one (1) brain fold |
| Any% Andy | Fast/fragile dasher | Crouches + flashes, a lane line shows the dash, then commits |
| Hot Take | Ranged, kites at 230–350 px | Mouth glows before spitting a warm bullet |
| Absolute Unit | Heavy, telegraphed slam | Raises arms; a warm circle fills to its edge exactly when it lands |
| Ratio → Reply | Splitter | Speech bubble pops into two fast replies |
| Copypasta (elite) | Duplicates itself every 3.4 s | Marching-ants selection box; kill the crowned original to delete all copies |
| Certified (elite) | Any archetype promoted | Gold crown + aura, ×9 HP, stronger patterns, drops a loot crate |

**Bosses**
- *The Doomscroller* (6,400 HP, 2 phases): a worm of phone screens. **Infinite Scroll** (telegraphed charge,
  doubled in phase 2), **Notification Barrage** (8–12 staggered bomb circles around you), **Rage Bait**
  (rings of bullets). Every segment is a hitbox.
- *The Algorithm* (18,000 HP, 3 phases): a floating eye-in-a-triangle whose iris tracks you.
  **Feed Spiral** (bullet spiral), **Shadowban Beam** (tracks, locks, fires; 3-beam fan later),
  **Engagement Farming** (summons), and phase 3's **TOUCH GRASS** (3.4 s countdown, safe zones heal).
- **Phase locks**: a boss can't be pushed past a phase gate until that phase has run ≥ 9 s, and is briefly
  shielded during transitions — strong builds still see every pattern; weak builds aren't affected.

**Wave director** (`logic/waves.ts`, pure, seeded): target population and spawn rate grow per minute; new
archetypes join at 0:40 / 1:25 / 2:10 / 2:55; scripted events (elites, encirclement ring with an escape gap,
line rush, bosses). Spawns are placed off-screen and never closer than ~85% of the view radius. Population
is hard-capped (190, or 120 on the low visual tier); enemy HP/damage scale with time.

## 6. Weapons, upgrades, synergies

6 weapons (max 4 slots), 5 levels each: **Clout Cannon** (aimed bolts), **Fidget Orbit** (orbiting blades),
**Bass Drop** (shockwave), **Wi-Fi Zap** (chain lightning), **Reply Guys** (homing missiles),
**Tea Spill** (burning, slowing puddles).

15 passives (damage, attack speed, projectiles, area, speed, max HP, regen, crit chance/damage, magnet,
XP, damage reduction, pierce, dash, projectile speed/duration) and 3 **cursed** trade-offs
(Glass Cannon, Doomscrolling, Unhinged Mode). Rarities: common / rare / epic / legendary.

**9 synergies** — each is code, not a description (enforced by `tests/design.test.ts`):

| Synergy | Requires | Effect |
|---|---|---|
| Ricochet Rizz | Cannon 2 + (Unfiltered or Split) | Bolts bounce to new enemies (+2) |
| Critical Meltdown | Lucky Streak 2 or Brutal Honesty | Crits explode for 45% splash |
| Domino Theory | Bass Drop, Big Brain 2 or Reply Guys 2 | 30% of kills detonate; detonations chain (capped per frame → visible cascade) |
| Comeback Arc | Thicc Skin, Copium or Hydrate | Below 40% HP: +35% damage, heal 4 every 8 kills |
| Burnout Trail | Speedrun Tech or Zoomies 2 | Dashing leaves a burning neon trail |
| Static Spin | Orbit + Zap | Spinner hits can launch zap chains |
| Ratio'd | Reply Guys 2 | Missile kills release 3 mini-missiles (no recursion) |
| Electric Tea | Tea Spill + Zap | Zapping an enemy in tea shocks the whole puddle |
| Main Character Syndrome | (Thicc 2 or Hydrate 2) + (Gym 2 or Cannon 4) | At full HP: +50% damage, giant golden bolts |

Build directions: **Projectile** (cannon/split/pierce/ricochet), **Area** (bass drop/tea/big brain/domino),
**Crit** (lucky/brutal/meltdown), **Chain** (zap/static/electric tea), **Tank/Comeback** (thicc/copium/regen).

## 7. Progression & replayability

- Records (best score/time/level/kills/combo, totals), 11 achievements, 3 unlockable characters:
  Gym Bro (survive 3:00), The Gremlin (beat The Doomscroller), Spill Queen (3 synergies in a run).
- **Daily challenge**: seed = hash of the player's **local** date; fixed character + modifier
  (Big Brain / Speedrun / Glass / Swarm / Crit Day). A run belongs to the date it started on; the best score is
  stored per date. Local only — never presented as a global leaderboard.
- Permanent progression is deliberately small: characters change the opening, not raw power.

## 8. Visual identity & asset strategy

"Ink sticker in a neon void": every sprite is drawn at boot with Canvas 2D (`art/textures.ts`) at 2× and shown
at 0.5×. Shapes are unioned with a thick ink outline (stroke all → fill all), lit by a top-left gradient,
with small expressive faces. Layers: parallax void of drifting shards (0.35×), grid floor with decals and slow
additive light pools, a magenta "firewall" border, screen-space dust motes, CSS vignette. FX: additive sparks
aligned to velocity, shards, rings, lightning polylines, afterimages, bitmap-font damage numbers (capped).
UI uses the same language: chunky Unbounded display type, ink borders, hard offset shadows.

## 9. Audio

Web Audio only (`audio/audio.ts`): ~28 synthesized SFX with rate limits and a voice cap; a procedural
16-step soundtrack (A minor, i–VI–III–VII) whose layers follow the run (menu pad → drums/bass → hats/arp →
boss lead), with a filter sweep in Overdrive and a low-pass duck while paused. The AudioContext is created
on the first user gesture; nothing is scheduled before that. Master/music/SFX volumes and mute persist.

## 10. Technical architecture

```
src/
  main.ts            Phaser config (DPR-aware, Scale.NONE + zoom 1/dpr), resize, boot
  app.ts             Shell: menus, run lifecycle, results, records, settings, persistence
  config/balance.ts  All tuning numbers
  data/              Enemies, weapons, upgrades/synergies, characters/modifiers, achievements, text
  logic/             Pure: stats, upgrade offers, combat math, waves, run stats/score, daily seed
  core/              Seeded RNG, spatial grid, input (global, bound once), save (versioned, sanitised)
  art/               Palette + procedural textures + bitmap font
  audio/             SFX + procedural music
  systems/           Player, enemies, shots, weapons, pickups, hazards (telegraphs), bosses, FX
  scenes/            Boot (texture bake), Menu (living backdrop), Game (the hub)
  ui/                DOM HUD/menus/cards, icons (inline SVG), touch controls, CSS
tests/               Vitest: logic, systems, design guards
qa/                  Playwright e2e, autopilot pacing sim, perf probe
```

Key engineering decisions: fixed-capacity pools for enemies, projectiles, pickups, puddles, numbers and rings;
a uniform spatial grid rebuilt each step; deferred enemy removal; stats recomputed from scratch on every
upgrade (no drift); scene state reset in `init()`; all scene resources released on SHUTDOWN; modals pause the
whole scene (update, tweens, particles) so pausing is consistent; menus own the keyboard while open.

## 11. Risks and how they're tested

| Risk | Mitigation | Test |
|---|---|---|
| Leaks across restarts | Pools, SHUTDOWN cleanup, global input | e2e: 6 restarts, display list & listener counts constant |
| Unfair spawns | Off-screen placement with distance floor; escape gap in rings | unit + code review |
| Unbounded population | Hard cap honoured by director and scene | unit test over 8 simulated minutes |
| Dominant build / boss melt | Phase locks, nerfed outlier, late scaling | autopilot pacing sim (5 runs) |
| Undiscoverable synergies | Discovery guarantee + weight | unit test (offer frequency) |
| Corrupt/blocked storage | Sanitised load, try/catch | unit tests (corrupt JSON, throwing storage) |
| Autoplay policy | Lazy AudioContext on gesture | e2e: no context before gesture, running after |
| Mobile layout/touch | Floating joystick, big buttons, safe areas | e2e at 390×844 (DPR 2) + landscape |
