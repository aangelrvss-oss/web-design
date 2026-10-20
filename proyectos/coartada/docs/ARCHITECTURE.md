# COARTADA: architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) everywhere | One type system for engine, wire protocol, server and client |
| Client | React 19 + Vite 7, plain CSS design tokens | Small, fast mobile web app; no UI kit to fight |
| Realtime | Socket.IO 4 (WebSocket with HTTP long-polling fallback) | Reconnection, acks and rooms built in; works behind most proxies |
| Validation | Zod schemas for every client→server message | Malformed input never reaches the engine |
| Server | Node 20+ (`node:http` + Socket.IO), bundled to one file with esbuild | Deploy = `node dist/server.mjs`, no `node_modules` at runtime |
| Persistence | In-memory rooms with TTL cleanup | A party game session is ephemeral; nothing personal is stored |
| Tests | Vitest (engine, privacy, content, real multi-client server), Playwright (real browsers) | Rules and privacy are verified against the real implementation |

No hosted backend, database, accounts, analytics or third-party runtime services. No secrets are needed.

## Layout

```
proyectos/coartada/
  src/shared/              ← used by server AND client (single-phone mode)
    types.ts               constants, state types, timingsFor(pace, players), scoring table
    rng.ts                 seeded PRNG (xmur3 + sfc32)
    protocol.ts            Zod schemas for client messages, ack/error codes
    engine/generate.ts     seeded round generator (true nights, memories, evidence, decoys)
    engine/game.ts         authoritative state machine: actions, timers, votes, scoring
    engine/encargos.ts     secret objectives: dealing, evaluation, text; testimonyStatus()
    engine/views.ts        THE privacy boundary: publicView() / privateView()
    engine/prueba-falsa.ts experimental «Prueba falsificable» (off by default; docs/PRUEBA-FALSA.md)
    content/types.ts       scenario schema
    content/scenarios/     one file per case (25)
    content/validate.ts    shape checks (incl. HH:MM chronological hours) + generated-round invariants
    content/example.ts     the guide's example round (regenerated and checked by a test)
  src/server/
    app.ts                 HTTP static server, Socket.IO handlers, validation, rate limiting
    rooms.ts               RoomManager: rooms, sockets↔players, timers, broadcast, cleanup
    main.ts                env config + start
  src/client/
    net/store.ts           socket client, session, reconnection, snapshot store
    screens/               Home, Lobby, Declare, Investigate, Defense, Vote, Result/Final, Local, Rules, Guide
    ui/kit.tsx, ui/game.tsx  design-system components; board, private file, evidence
    ui/pruebaFalsa.tsx     the experimental «Prueba falsificable» UI (only mounted in those rounds)
    lib/                   copy (Spanish), summaries, sound, vibration (haptics), prefs, private notes, colors
    styles/app.css         tokens + components
  tests/                   vitest suites
  e2e/                     Playwright: multi-device match, single-phone match, axe-core accessibility audit
  scripts/                 dev, build-server, build-demo, validate-content, simulate, text-inventory
```

## State machine

```
lobby ──start──▶ declare ──all sealed | timer──▶ investigate(1) ──all ready | timer──▶ investigate(2)
   ▲                                                                                     │
   │                                                              all ready | timer │ beginDefense()
   │                                                                                     ▼
   │                          nobody pointed | defender absent ◀──────────────────── defense
   │                                        │                     defender/host ends | timer │
   │                                        ▼                                                ▼
 final ◀──last round── result ◀── runoff ◀──tie── vote ◀──────────────────────────────────────┘
   │                     │ ▲                 └──clear winner | no votes | timer──▶ result
   └──new match──▶ lobby  └─┴──────────────── next round ──────────────────────────────────
```

- `beginDefense()` counts `round.pointers` from participants only. Most pointers → defender; a tie is broken with `createRng('defensa|' + seed)` over the sorted tied ids (deterministic, announced as "sorteo"); zero pointers or an absent defender skip straight to the vote. The result is stored in `round.defense` with its reason (`senalado`, `sorteo`, `nadie_senalado`, `desconectado`).
- Timers come from `timingsFor(pace, players)` only: pace base × group-size factor (4–5 ×0.85, 6–7 ×1, 8–10 ×1.2 and +10 s of vote), investigation rounded to 5 s.

- Every action is a pure function on `RoomState` that validates phase, membership, host rights, duplicates and payload, and returns `{ok}` or `{ok:false, error}`. Nothing throws on bad input.
- The clock is injected (`now`). The server owns real time: after each change `RoomManager` schedules a single `setTimeout` for `phaseEndsAt` and calls `tick()`. Deadlines are absolute timestamps; clients only render them (with a clock-offset estimate from `serverNow`).
- "End early" checks count only connected participants, so a dropped phone never blocks the table.
- Victory and score are computed by `computeOutcome()` on the server from roles, declarations, testimonies and votes. Clients cannot submit scores, roles or results; there is no message for it.

## Public vs. private data

`views.ts` is the only code that turns server state into something a client sees.

| Data | Public view | Private view (owner only) |
|---|---|---|
| Room code, names, colors, connection, host, scores, settings | ✓ | |
| Case, places, hours, scene | ✓ | |
| Who has sealed / voted / is ready | ✓ | |
| Declared alibis | only after the declaration phase | own sealed alibi + own draft |
| Evidence | only revealed ones | |
| Testimonies + status (coincide / contradice / sin contraste) | ✓ | own remaining count |
| Secret pointers for the last defense | count only during investigation; who → whom in the verdict data (not displayed by the v1.1 UI) | own pointer |
| Defender and reason | ✓ once the defense starts | |
| Role, partner | at the verdict | ✓ |
| True night, memories, encargo | at the verdict | ✓ |
| Votes (who → whom), seed | at the verdict (the UI displays the per-person tally and the seed) | own vote |
| Session tokens | never | never (only once, in the join ack) |

The server sends each socket `{pub, priv}` where `priv` is computed for the player bound to that socket. There is no client-side filtering of secrets: secret data is simply not in other players' payloads. Tests assert this on raw payloads (`tests/server.test.ts`) and on the WebSocket frames real browsers receive (`e2e/match.mjs`).

## Identity, reconnection, rooms

- Joining returns `{code, playerId, token}`; the token is 24 random bytes (base64url), stored in `localStorage` on that device only, and never sent to anyone else. The URL only ever contains the room code (`/?sala=KXRT`).
- On reconnect (network back, tab visible again, page reload) the client sends `room:resume {code, playerId, token}`; the server compares tokens in constant time and rebinds the socket. The player gets their exact state back.
- A player may have several sockets (two tabs); all receive the same state.
- Room codes: 4 letters from a 20-consonant alphabet (160,000 codes), generated with `crypto.randomBytes`, collision-checked. A code only grants a lobby seat or, mid-round, a spectator view of public information.
- Cleanup sweep every 60 s: rooms with nobody connected for 15 min, or idle for 6 h, are deleted with their timers.

## Abuse protection

- Every message schema is `.strict()`; unknown fields, wrong types, wrong lengths, unknown events → `invalid`.
- `maxHttpBufferSize` 16 KB: oversized frames drop that socket only.
- Per-socket token bucket (20 burst, 6/s); repeated flooding disconnects the socket.
- Room creation limited per IP (30 per 10 min; set `TRUST_PROXY=1` behind a proxy so the real client IP is used); global `MAX_ROOMS`.
- Names are NFC-normalized, stripped of control/zero-width/bidi characters, trimmed to 16 characters, de-duplicated; React escapes all text.
- HTTP: strict CSP (`script-src 'self'`), `X-Frame-Options: DENY`, `nosniff`, `no-referrer`, a restrictive `Permissions-Policy`, path-traversal guard, only GET/HEAD.

## Single-phone mode

`screens/Local.tsx` runs the same `engine/game.ts` in the browser and routes the screens' `send()` calls to it as "whoever holds the phone". Secret steps are gated by hand-off screens; no network is used. The online privacy model is unaffected: online rounds are generated on the server with a random seed that the client never sees before the verdict.

On the shared investigation screen the testimony sheet gets a stripped private view (declared alibi and testimonies left; no role, truth, memories, partner, objective or forgery). "Ver un expediente en privado" re-reads one person's file behind a hand-off. With «Prueba falsificable» on, `Local.tsx` handles `game:forge` and, when the investigation ends (button or clock), stops the clock and collects each person's `examine()` behind hand-offs with no count shown, then calls `forceAdvance` so `beginDefense` resolves the examination as online (`docs/PRUEBA-FALSA.md` §4b).

The setup screen gives each row a character through the engine's own `chooseAvatar` (one per person), after clearing the automatic ones. The private notebook (`lib/notes.ts`) is keyed by room, round, case and player like online, but for the single-phone room it is kept in memory only and cleared when a match starts or ends; it opens only behind the «Soy X» hand-off.

`lib/haptics.ts`: an optional short vibration (`navigator.vibrate`, Android Chrome) when the last defense ends and in the last seconds of a vote you haven't cast. One per moment (keyed by room, round and phase), switchable in the menu (`prefs.vibrate`, on by default), a no-op where unsupported; the screen always shows the same moment. The vote's timing and timeout are untouched.

## Character portraits

The twelve portraits are WebP files in `src/client/assets/characters/` (a 128 px head for pins and a half-length card for the lobby picker), cut from the approved character sheet. Vite serves them from `/assets` in the app (allowed by the CSP's `img-src 'self'`) and inlines them in the standalone demo. Total ≈ 180 KB.

## Case scenes

Each of the 25 cases has its own ink scene, `src/client/assets/scenes/{id}.svg` (320 × 120, 2–3.3 KB, 68 KB in total), mapped explicitly in `CASE_SCENE` (`src/client/ui/ambience.tsx`) and shown as a decorative `<img alt="">` in the case header. The app serves each one as a separate file from `/assets`, fetched only when that case is played; the demo inlines them. Once an illustration is imported for a case (`scripts/import-scene.mjs` → `{id}.webp` at 1440 × 810 plus `{id}-720.webp`, served with `srcset`), it is shown instead of the drawing in its own 16:9 frame (taller than the drawings' 8:3 strip); a file that fails to load falls through to the drawing, then to the generic inline scene (`docs/ESCENAS-higgsfield.md`). The six generic inline scenes stay as the last fallback (`onError`, or a new case without a file). Scenes are visual only: nothing in `src/shared` imports them. Matrix and visual review: `docs/ESCENAS.md`.

## Testing

| Suite | What it covers |
|---|---|
| `tests/engine.test.ts` | player counts, host rights, names, host grace/transfer, every phase transition, timers and auto-alibis, early advance with disconnected players, testimonies (limits, duplicates, readiness reset), votes (self/unknown/double), ties, runoffs, no-vote, disconnection during voting, all scoring paths, cazador, encargos, match end, scenario rotation, leaving mid-round |
| `tests/content-privacy.test.ts` | catalogue size, validation of every case × every player count, seed reproducibility, role scaling, fair seat distribution, public view never leaks secrets in any phase, private view only describes its owner |
| `tests/rules-v11.test.ts` | v1.1: `timingsFor` for every pace and size; defense selection, ties by seeded draw, nobody pointed, changed/cleared pointers, defender offline or leaving, early end (defender/host only), every pace; testimony statuses incl. automatic alibis; scoring edge cases; full rounds with 4, 5, 6, 7, 8 and 10 players |
| `tests/audit-cases.test.ts` | the 16 rule situations of the v1.1 audit (catch/escape with and without accomplice, abstentions, double tie, automatic alibis, coincide ≠ truth, objectives on/off, new round reset, final standings, leaving in any phase) plus no double vote around the defense |
| `tests/guide-example.test.ts` | regenerates the guide's example round from its seed and checks every fact the guide states |
| `tests/server.test.ts` | real Socket.IO server + independent clients: full 5-player match with rematch and a leak audit of every payload; token reconnection (bad token, another player's id); malformed/oversized/unauthorized messages; rate limiting; host disconnect handover; disconnect during vote; late joiners as spectators; kick; leave; room cleanup; fresh room after a finished one; HTTP health/method checks |
| `e2e/match.mjs` | 4–10 real Chromium sessions (all but one at 390×844 touch, 1 desktop 1280×860): join by code and by link, reload, full round through the UI including secret pointing and the last defense, WebSocket-frame privacy audit (pointers never leave the server before the verdict; a private note written on one phone is in no frame sent or received and on no other screen), rematch, closing a tab and rejoining mid-round, offline/online recovery, no horizontal overflow at 320 px, axe-core audit of 7 screens, screenshots |
| `e2e/un-movil.mjs` | single-phone mode end to end (app and demo file): a 5-round match + new match at 320/360/390 px with privacy checks at every hand-off and shared screen, roles and scores checked against the final standings; «Prueba falsificable» with 6 players, both examination outcomes |
| `e2e/local.mjs` | single-phone mode: 4 players, hand-offs, testimony, pointing and defense, votes, verdict, next round; with `DEMO=1` against the standalone file, also the guide (axe-core audit, no overflow) |
| `tests/characters.test.ts`, `tests/short-names.test.ts` | characters: one per member, refused when taken (also simultaneous requests), lobby only, kept offline and across rounds, freed on leaving or kick, unrelated to roles; short names under portraits are unique and readable |
| `tests/round-facts.test.ts`, `tests/ambience.test.ts` | the verdict's case file states only facts from the reveal data (nothing secret is public before it); every case has its own scene file (none shared, none missing, none unused, self-contained SVG), the decorative image is silent, a case without a file falls back to its generic scene, and nothing in `src/shared` imports the scenes |
| `tests/engine-golden.test.ts` | golden fingerprints of the rules: every case's dealt night, roles, memories, evidence and objectives for 4–10 players, the resolution and scoring of 36 scripted rounds, the score table; visual or tooling work must never move them |
| `tests/sim-core.test.ts` | the balance simulator: reproducible by seed, never blocks, a variant round is the same base round plus information, a verified tip is always true |
| `tests/quick-guide.test.ts`, `tests/ring.test.ts` | the quick guide states the engine's own points, timers and limits and never explains play modes; the evidence loop's geometry (snug around its group, inside its cell) |
| `e2e/rounds.mjs` | round 1 → 2 with two phones offline during the verdict: the host sees them listed as offline; everyone plays the same round 2 (4–6 browsers; with 4, the start is refused until 4 are connected) |
| `e2e/evidence.mjs` | the evidence loop encloses all and only the pins of its cell, fitted to the group (0–6 pins, 4–10 players, 320–800 px) |
| `e2e/ux.mjs` | real game on «Rápido» (4–10 browsers, one at 320 px with reduced motion; `LONG=1` for long names): «Nueva prueba» notice in sync and only once (also with a locked phone, an offline phone, a reload and the quick guide), pointing found and registered, testifying from a pin without accidental publication, big countdown from 15 s without layout shift in declaration, investigation, vote and a forced runoff, defense clock, touch targets, axe-core audits |
| `scripts/simulate.ts` | 7,200 seeded rounds per mode through the engine with scripted bots (`scripts/sim/core.ts`), incl. pointing and defense; `INDEPENDENT=1` makes each bot decide alone (balance indicator, not human data) |
| `scripts/balance.ts` | balance audit (`npm run balance`): 95% intervals, culprit strategies, points by role, objectives, information ablations and the experimental variants (Informante, Chivatazo) simulated outside the engine and compared round by round on the same seeds → `docs/EQUILIBRIO-datos.md` |
| `e2e/scenes.mjs` | the build serves 25 distinct scene files byte-identical to the sources; in real rounds the declaration screen shows the scene of the case being played, loaded and decorative, at 320–390 px without horizontal scroll; with the scene file blocked the generic scene is drawn; axe-core audit |
| `scripts/text-inventory.ts` | `npm run texts`: inventory of every visible string → `docs/TEXT_INVENTORY.md`, fails on forbidden terms and typographic errors |
