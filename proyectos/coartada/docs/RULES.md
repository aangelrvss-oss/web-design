# COARTADA: rules specification (v1.1)

This is the binding specification. The engine (`src/shared/engine/`) implements exactly this; every number here is a constant in `src/shared/types.ts`. Player-facing text is Spanish; terms are given in Spanish with English glosses. The in-game rules (`src/client/screens/Rules.tsx`) and the guide (`src/client/screens/Guide.tsx`) say the same in plain Spanish.

## 0. Glossary (the words the interface uses)

| Term | Meaning |
|---|---|
| **Ronda** (round) | One complete investigation: from dealing roles to verdict and points. |
| **Partida** (match) | The set of rounds played in a row (3, 5 or 8; default 5; or unlimited). Points accumulate over the match. |
| **Coartada** (alibi) | The place a person declares for **one** hour. |
| **Declaración** (declaration) | A person's three coartadas, one per hour, sealed together. |
| **Recuerdo** (memory) | Private, true information: "at hour H you were in place P with X". Incomplete by design. |
| **Prueba** (evidence) | Reliable information about where the culprit really was at an hour. Two per round. |
| **Testimonio** (testimony) | A public statement "I was with X at hour H", compared with X's coartada. Can be true or false. |
| **Señalar** (point) | Secretly choosing who should get the last defense. |
| **Objetivo secreto** (secret objective; `encargo` in code) | Optional side mission worth +1. |

## 1. Summary

An absurd incident happened and one participant is the culprit. Everyone secretly seals a declaration (where they were at each of three hours); all coartadas appear on a shared board at the same time. Players publish testimonies ("I was with Marta at 23:00") and the app marks each one as matching, contradicting or not comparable with Marta's coartada. Two pieces of evidence, always true, show where the culprit really was at the other two hours. The most-pointed person gets a short last defense. Then a secret vote: catch the culprit and the innocents win; otherwise the culprit (and accomplice) win.

## 2. Players and roles

| Players | Culpable | Cómplice | Inocentes | Places in play | Group size (timing) |
|---|---|---|---|---|---|
| 4 | 1 | 0 | 3 | 4 | small |
| 5 | 1 | 0 | 4 | 4 | small |
| 6 | 1 | 1 | 4 | 4 | medium |
| 7 | 1 | 1 | 5 | 5 | medium |
| 8 | 1 | 1 | 6 | 5 | large |
| 9 | 1 | 1 | 7 | 5 | large |
| 10 | 1 | 1 | 8 | 5 | large |

- 4–10 participants per round (recommended 5–8). A room holds at most 10 members.
- Roles are dealt uniformly at random by a seeded generator; each round is independent.
- **Inocente** wins if the culprit is accused. **Culpable** wins if anyone else, or nobody, is accused. **Cómplice** (6+ players) wins with the culprit. Culprit and accomplice know each other's identity and nothing else about each other.

## 3. Information

Private, delivered by the server only to its owner: role (and partner for culprit/accomplice), true night (place at each hour), two memories, secret objective (if enabled).

Public from the start: the case, the places in play, the three hours, and the **scene** (place and hour of the incident).

Generator guarantees (checked for every case and player count by `npm run validate`, by tests, and at server boot):

- Only the culprit was at the scene at the crime hour.
- No memory places anyone at the scene at the crime hour.
- At least one non-culprit ("decoy") shares the culprit's true places at both evidence hours, so evidence alone never identifies the culprit.
- Honest players hold 1 memory (4–5 players) or 1–2 memories (6+) placing the culprit at a non-crime hour.
- About a quarter to three quarters of non-culprits can be vouched for at the crime hour by an honest memory; in half of the rounds every decoy is vouchable.
- Case data: exactly 5 places with distinct names and distinct evidence texts, 2–3 plausible scene places, three valid `HH:MM` hours in chronological order (crossing midnight at most once).

## 4. Round sequence

| # | Phase | Decisions | Ends early when |
|---|---|---|---|
| 1 | **Declaración** | Secret, simultaneous | every connected participant has sealed |
| 2 | **Investigación, prueba 1** | Public testimonies; secret pointing; "Pedir prueba 2" | every connected participant has asked for evidence 2 |
| 3 | **Investigación, prueba 2** | Same; "Pedir terminar" | every connected participant has asked to finish |
| 4 | **Última defensa** (only if someone was pointed at) | None; the defender speaks | the defender (or the host) ends it, or the defender disconnects |
| 5 | **Votación** | Secret, simultaneous | every connected participant has voted |
| 5b | **Desempate** (only on a tie) | Secret, among the tied | every connected participant has voted |
| 6 | **Veredicto** | None | the host starts the next round |

### 4.0 Timers

All deadlines are absolute server timestamps; clients only display them. The host can end any timed phase early ("Terminar esta fase"), with the same effect as the timer running out. Timers come from one function, `timingsFor(pace, players)`: the pace sets the base (for 6–7 players) and the group size adjusts the investigation and the vote.

| Seconds | Rápido | Normal | Relajado |
|---|---|---|---|
| Declaración | 75 | 120 | 180 |
| Investigación 1 / 2 (6–7 players) | 75 / 105 | 120 / 150 | 150 / 180 |
| … 4–5 players (×0.85) | 65 / 90 | 100 / 130 | 130 / 155 |
| … 8–10 players (×1.2) | 90 / 125 | 145 / 180 | 180 / 215 |
| Última defensa | 12 | 15 | 20 |
| Votación (8–10 players: +10) | 30 | 45 | 60 |
| Desempate | 25 | 30 | 40 |

Maximum round length with every timer used (verdict and runoff excluded), normal pace: 6.8 min (4–5), 7.5 min (6–7), 8.6 min (8–10). A table that finishes early plays faster.

### 4.1 Declaración

Each participant chooses one place per hour and **seals** the declaration. Nothing is pre-filled for anyone (so sealing order reveals nothing). Sealed declarations are final. Anyone may lie anywhere; the culprit must lie at least at the crime hour or the declaration places them at the scene.

Choices are saved as a private draft once all three hours are chosen. When the timer runs out: a complete draft is sealed as is; otherwise the participant gets an **automatic declaration** equal to their true night, except that the culprit's never names the scene at the crime hour (a seeded random other place). Automatic declarations are publicly marked "automática". While declaring, the public only sees *who* has sealed.

### 4.2 Reveal

All coartadas appear at once on the board (places × hours, one pin per person). The scene cell is hatched red.

### 4.3 Investigación: evidence and testimonies

- Evidence 1 appears when the investigation starts; evidence 2 when the second step starts. Each states: the physical clue, the **proven fact** ("la persona culpable estuvo en P a las H"), and which declared coartadas fit it (a fact about claims, not about truth), with the warning that the culprit may have lied at that hour.
- **Testimonios.** Up to 3 per participant per round, never the same person + hour twice. A testimony is always "Estuve con X en [my declared place at H] a las H": the place comes from the speaker's own coartada.
- Each testimony is marked by comparing it **only with X's sealed coartada**:
  - **Coincide**: X declared the same place. This means the two versions fit, *not* that either is true.
  - **Contradice**: X declared another place. At least one of the two is lying. Both pins get a red ring at that hour.
  - **Sin contraste**: X's declaration is automatic (X never sealed), so there is no claim of X's to compare with.
- The software never says who lied; the truth is shown only at the verdict.
- **Asking to move on.** "Pedir prueba 2" / "Pedir terminar". When every connected participant has asked, the step ends. Any new testimony clears all requests, so a late revelation always gets a reaction.

### 4.4 Última defensa (new in v1.1)

- During the whole investigation each participant may **secretly point** at one other participant (not themself) as the person who should defend themself, and change or withdraw that choice until the investigation ends. The public only sees how many participants are pointing at someone.
- When the investigation ends, pointers from participants are counted:
  - **Most pointed** → that person defends (`senalado`).
  - **Tie for most** → a draw among the tied, seeded with the round seed (`sorteo`): reproducible, reveals nothing, never blocks.
  - **Nobody pointed** → no defense, straight to the vote (`nadie_senalado`).
  - **Chosen person disconnected or gone** → no defense, straight to the vote (`desconectado`).
- The defense lasts the pace's defense time (15 s on normal). The defender speaks aloud. Nothing can be changed: declarations, testimonies, pointers, requests and votes are all rejected during it.
- It ends when the timer runs out, when the defender presses "He terminado mi defensa", when the host ends the phase, or when the defender disconnects. Then the vote starts with its own timer.
- What is public: who defends, how many pointers they received, and whether a draw decided. Who pointed at whom is never shown during the round; it is sent to every device with the verdict data, but the v1.1 interface does not display it (the verdict screen shows the vote count per person). The defense reveals no role.
- Single-phone mode: there is no secret pointing; the group decides aloud whom to hear (or nobody) and the app records that choice.

### 4.5 Votación

- Every participant votes for one other participant. Votes are final and hidden until the verdict; the public only sees who has voted.
- No vote before the deadline = abstention.
- The participant with most votes is accused. No votes at all → nobody accused. A tie for most (with ≥1 vote) → **runoff** among the tied only; everyone votes again (tied players vote for another tied player). A tied or empty runoff → nobody accused.

### 4.6 Veredicto

Revealed to everyone: the tally (runoff tally if there was one, labeled), the accused and their stamp, every role, every true night against every declaration (lies struck through), which testimonies were true, all memories, objectives and whether they were completed, pointers, evidence, per-player score lines and the round seed.

## 5. Victory

| Outcome | Winners |
|---|---|
| The accused is the culprit | All inocentes |
| The accused is an innocent or the accomplice, or nobody is accused | The culprit and the accomplice |

Secret objectives never change the winners.

## 6. Scoring

Points are added when the round reaches the verdict and accumulate over the match.

| Reason (as shown) | Who | Points |
|---|---|---|
| El grupo acusó a la persona culpable | each inocente, if the culprit is accused | +2 |
| Se libró de la acusación | the culprit, if not accused | +4 |
| La persona a la que cubría se libró | the accomplice, if the culprit is not accused | +3 |
| Votó a la persona culpable en la primera votación | each inocente whose **first-round** vote named the culprit, whatever the outcome | +1 |
| Destapó una mentira con un testimonio verdadero | anyone whose testimony was marked "contradice", was true (speaker and subject really were there) and therefore exposed a real lie; max once per round | +1 |
| Cumplió su objetivo secreto | objective completed (if enabled) | +1 |

Edge cases (each covered by a test in `tests/audit-cases.test.ts` or `tests/rules-v11.test.ts`):

- **Correct vote, culprit escapes:** the innocent still gets +1.
- **Two rewards for related events:** yes, by design. An innocent can get +2 (group) and +1 (vote). One testimony can give "destapó una mentira" and complete a "contradict" objective.
- **Culprit caught, with accomplice:** the accomplice gets 0.
- **Accomplice accused:** the culprit escapes; culprit +4, accomplice +3.
- **No valid vote / tied runoff:** nobody accused; culprit +4, accomplice +3; innocents 0 (nobody voted correctly in the first round) or +1 for those who did.
- **Runoff votes** never award the "+1 voted the culprit" point.
- **Match ended early:** rounds that reached the verdict keep their points; an unfinished round awards nothing.
- **Testimonies about an automatic declaration** ("sin contraste") never award "destapó una mentira" and never complete "corroborated"/"contradict" objectives.

## 7. Match structure

- Rounds per match: 3, 5 (default), 8 or unlimited. After the last round the host opens the final standings. "Nueva partida" resets all scores and returns to the lobby. The host may also return to the lobby between rounds (scores kept); never mid-round.
- **A new round resets** case, roles, true nights, memories, evidence, objectives, declarations, testimonies, pointers, defense, votes and timers. Only scores carry over. The same case is not repeated within the last 12 rounds of a room.

## 8. Connections and leaving

| Situation | Rule |
|---|---|
| Disconnect mid-round | Stays a participant. Timers continue. "Ends early" counts only connected participants. A missing declaration becomes automatic; a missing vote is an abstention. If the defender disconnects, the defense ends. |
| Reconnect | Same seat, role and private card, restored with the session token stored on that device. |
| Leave on purpose mid-round | Treated as permanently disconnected for the rest of the round; removed when it ends. |
| Join mid-round | Watches the public board without a private card; plays from the next round. |
| Host disconnects | Keeps the role for 20 s; then it passes to the longest-connected present player. Timers keep running meanwhile. |
| Fewer than 4 connected | The current round continues to its end; a new one cannot start. |
| Empty room | Deleted 15 min after the last person disconnects; any room idle for 6 h is deleted. |

## 9. Secret objectives (optional, off by default)

| Objective (as shown) | Completed when |
|---|---|
| Que X reciba al menos 2 votos en la primera votación (el tuyo no cuenta) | ≥ 2 first-round votes for X from others |
| Que nadie te vote en la primera votación | 0 first-round votes for you |
| Vota a la misma persona que X en la primera votación | you and X voted for the same person |
| Que otra persona publique un testimonio que coincida con alguna de tus coartadas | someone else's testimony about you is "coincide" |
| Publica un testimonio que contradiga la coartada de X | one of your testimonies about X is "contradice" |
| Que tu declaración diga que estuviste en P al menos a una hora | your sealed declaration names P (always a place you never visited, so it requires a lie) |

Lying for an objective is allowed; a true testimony that contradicts that lie gives its author +1 and makes the liar look suspicious. Objectives never change the winners.

## 10. What the software verifies

- **Consistency** between public statements (testimony vs. coartada), instantly.
- **Truth**, only at the verdict.
- Never: who is lying in a contradiction, whether someone "acted guilty", or whether a defense was convincing. The vote decides.

## 11. Worked example (5 players, example round generated by the real engine)

This is an **example round produced by the engine**, not a game played by people. Its data lives in `src/shared/content/example.ts`, and `tests/guide-example.test.ts` regenerates it from the seed to keep the guide and this section exact.

`generateRound({ scenario: 'boda-tarta', players: ['Ana','Bruno','Carla','Dani','Eva'], seed: 'ejemplo-5' })`

**Case.** *La tarta de la boda.* **Scene: La capilla a las 00:00.** Places in play: La cocina, El jardín, La barra libre, La capilla.

| Player | Role | True night 22:00 / 23:00 / 00:00 | Memories |
|---|---|---|---|
| Ana | **Culpable** | Jardín / Jardín / **Capilla** | Eva, Jardín, 22:00; Bruno, Jardín, 23:00 |
| Bruno | Inocente | Cocina / Jardín / Barra | Ana, Jardín, 23:00; Carla, Barra, 00:00 |
| Carla | Inocente | Barra / Jardín / Barra | Eva, Jardín, 23:00; Bruno, Barra, 00:00 |
| Dani | Inocente | Barra / Cocina / Barra | Carla, Barra, 22:00; Bruno, Barra, 00:00 |
| Eva | Inocente (decoy) | Jardín / Jardín / Barra | Bruno, Barra, 00:00; Carla, Barra, 00:00 |

Evidence 1: El jardín a las 23:00. Evidence 2: El jardín a las 22:00.

1. **Declaration.** The four innocents tell the truth. Ana declares Jardín / Jardín / **Barra libre** (a lie at the crime hour only).
2. **Reveal.** At 00:00 all five pins are in La barra libre; the scene is empty.
3. **Evidence 1** fits Ana, Bruno, Carla and Eva. Testimonies: Bruno "estuve con Carla en La barra libre a las 00:00" → *coincide* (and is true); Ana "estuve con Eva en La barra libre a las 00:00" → *coincide* (and is false). Eva doesn't remember Ana there, which proves nothing by itself.
4. **Evidence 2** fits only Ana and Eva.
5. **Pointing.** Bruno, Carla, Dani and Eva point at Ana; Ana points at Eva → Ana defends for 15 s.
6. **Vote.** Bruno → Ana, Carla → Eva, Dani → Ana, Eva → Ana, Ana → Eva. Ana 3, Eva 2 → **Ana accused: CULPABLE**.
7. **Points.** Bruno +3, Dani +3, Eva +3, Carla +2, Ana 0.

Counterfactuals: if Dani had voted Eva, Eva (innocent) would be accused: Ana +4, Bruno and Eva +1. If Ana had also lied at 23:00 ("La cocina"), Bruno's true memory "estuve con Ana en El jardín a las 23:00" would be marked *contradice* and give Bruno +1 at the verdict.

## 12. Single-phone mode (pass-and-play)

Same rules, one device, no network. Differences: secret steps (declaration, vote, runoff) happen one person at a time behind "Pasa el móvil a X / Soy X" and "Ocultar y pasar" screens, **without timers**; each person reads their file privately during their turn. Investigation and defense are timed and shared. Testimonies are entered by first choosing who speaks; memories are never shown on the shared screen. "Sacar la prueba 2" and "Terminar investigación" are pressed by whoever holds the phone; at "Terminar investigación" the group chooses aloud whom to hear in the last defense, or nobody.

## 13. Safety and tone

No real secrets, personal information or dares. Fictional, absurd incidents. Names are free text (16 characters max), kept only in server memory for the life of the room.
