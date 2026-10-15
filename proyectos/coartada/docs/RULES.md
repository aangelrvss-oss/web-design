# COARTADA: rules specification

This is the binding specification. The engine (`src/shared/engine/`) implements exactly this; where a number appears here it is the constant in `src/shared/types.ts`. Player-facing text is Spanish; role and phase names are given in Spanish with English glosses.

## 1. Summary in one breath

Something absurd happened last night and one of you did it. Everyone secretly declares where they were at each of three hours; all the alibis flip onto a shared board at the same time. You can testify "I was with Marta at 23:00" and the board says whether that matches what Marta declared. Two pieces of forensic evidence appear: they never lie and they say where the culprit really was at the other two hours. Then everyone votes in secret. Catch the culprit and the group wins; miss and the culprit gets away with it.

## 2. Players and roles

| Players | Culpable (culprit) | Cómplice (accomplice) | Inocentes | Places in play |
|---|---|---|---|---|
| 4 | 1 | 0 | 3 | 4 |
| 5 | 1 | 0 | 4 | 4 |
| 6 | 1 | 1 | 4 | 4 |
| 7 | 1 | 1 | 5 | 5 |
| 8 | 1 | 1 | 6 | 5 |
| 9 | 1 | 1 | 7 | 5 |
| 10 | 1 | 1 | 8 | 5 |

- Minimum 4, maximum 10 participants per round. Recommended 5–8.
- A room holds at most 10 members (people who left are not counted).
- Roles are dealt uniformly at random from a seeded generator. Each round is independent.

**Inocente.** Did not do it. Wins with the group if the culprit is accused.
**Culpable.** Did it. Wins if anyone else (or nobody) is accused.
**Cómplice.** Did not do it, but covers for the culprit and wins if the culprit is not accused. The culprit and the accomplice know each other's identity and nothing else about each other.

A player never has conflicting win conditions: the role decides the team result. Optional *encargos* (section 9) are separate +1 bonuses and never change who wins.

## 3. What each player knows

At the start of a round every participant receives, privately, from the server only to that player:

1. **Role** (and, for culprit/accomplice, the partner's name).
2. **True night ("tu noche real")**: the place they were at each of the three hours. Everyone has one.
3. **Two memories ("recuerdos")**: true facts of the form *"At H you were in P with X."* Memories are always true but deliberately incomplete: you were possibly with other people you do not remember. Not remembering someone is not evidence.
4. **Encargo** (only if enabled).

Public to everyone from the start: the case (title, venue, incident), the places in play, the three hours, and **the scene: the place and hour of the incident** (for example "La capilla a las 00:00").

Guaranteed by the generator (verified for every scenario and every player count by `npm run validate`):

- Only the culprit was at the scene at the crime hour. Every innocent and the accomplice were elsewhere.
- Nobody holds a memory of the culprit at the crime hour (no smoking gun).
- At least one non-culprit (the "decoy") was in exactly the same places as the culprit at both other hours, so the evidence alone never identifies the culprit.
- Honest players together hold 1 memory (4–5 players) or 1–2 memories (6+) placing the culprit somewhere at a non-crime hour. Lying at those hours is risky.
- Between about a quarter and three quarters of the non-culprits can be vouched for at the crime hour by an honest memory. In half of the rounds every decoy is vouchable; in the other half at least one is not.

## 4. Round sequence

| # | Phase | Decisions | Timer (Normal / Relaxed / Fast) | Ends early when |
|---|---|---|---|---|
| 1 | **Declaración** (declaration) | Secret, simultaneous | 120 / 180 / 75 s | every connected participant has sealed |
| 2 | **Investigación, prueba 1** | Public testimonies; private "ready" | 120 / 150 / 75 s | every connected participant is ready |
| 3 | **Investigación, prueba 2** | Same | 150 / 180 / 105 s | every connected participant is ready |
| 4 | **Votación** (vote) | Secret, simultaneous | 45 / 60 / 30 s | every connected participant has voted |
| 4b | **Desempate** (runoff, only on a tie) | Secret, simultaneous | 30 / 40 / 25 s | every connected participant has voted |
| 5 | **Veredicto** (result) | None | — | the host starts the next round |

All deadlines are absolute server timestamps. Clients only display them. The host can end any timed step early ("Saltar al siguiente paso"), which has exactly the same effect as the timer running out.

### 4.1 Declaración

Each participant chooses one place for each of the three hours from the places in play and **seals** it. Nothing is pre-filled for anyone (so the order in which people seal reveals nothing). Sealed alibis are final.

- Anyone may lie anywhere. The culprit must lie at least at the crime hour, or the alibi places them at the scene.
- Unsealed choices are saved as a private draft. If the timer runs out: a complete draft is sealed as is; a participant with no complete draft receives an **automatic alibi** equal to their true night, except that a culprit's automatic alibi never names the scene at the crime hour (a seeded random other place is used). Automatic alibis are publicly marked "(auto)".
- While declaring, the public sees only *who* has sealed, never *what*.

### 4.2 The reveal

When the phase ends all alibis appear on the board at once: a grid of places × hours with each player's pin in the cell they declared. The scene cell is hatched red.

### 4.3 Investigación and evidence

- At the start of investigation **evidence 1** (prueba 1) is revealed; when step 2 starts **evidence 2** is revealed. Each says: *"[physical clue]. El culpable estuvo en [place] a las [hour]."* The two pieces of evidence cover the two non-crime hours, in random order, and are always true.
- **Testimonies.** A participant may publish up to **3** testimonies per round. A testimony is always *"Estuve con [X] en [my declared place at H] a las [H]"*: the place is taken from the speaker's own sealed alibi, so you cannot place someone at the scene without placing yourself there too. The same speaker cannot repeat the same person + hour.
- The board automatically marks every testimony:
  - **Cuadra** (matches) if X declared the same place at H;
  - **No cuadra** (contradicts) otherwise. Both pins get a red ring at that hour.
  The software never decides *who* lied in a contradiction; that is for the table.
- Testimonies may be true (from your memories) or invented. The server does not check them against the truth until the round ends.
- **Ready.** Each participant can mark "Estoy listo". When every connected participant is ready, the step ends early. Any new testimony clears everyone's ready mark, so a late revelation always gets a reaction.

### 4.4 Votación

- Every participant votes for exactly one other participant (not themselves). Votes are final and hidden until the verdict; the public only sees *who* has voted.
- Players who do not vote before the deadline abstain.
- **Resolution.** The participant with the most votes is accused.
  - If no votes were cast, nobody is accused.
  - If two or more tie for most votes (with at least one vote), a **runoff** is held among the tied players only. Everyone votes again (tied players vote for one of the other tied players).
  - If the runoff is tied again or receives no votes, nobody is accused.
- If nobody is accused, the culprit escapes.

### 4.5 Veredicto

The server reveals, to everyone: the vote tally, the accused and their stamp (culprit / accomplice / innocent), every role, every true night against every declared alibi (lies struck through), all memories, the encargos and whether they were completed, the evidence, the per-player score lines, and the round seed.

## 5. Victory

| Outcome | Winners |
|---|---|
| The accused is the culprit | All inocentes |
| The accused is an innocent or the accomplice, or nobody is accused | The culprit and the accomplice |

## 6. Scoring

Points accumulate across the rounds of a match.

| Reason (on screen) | Who | Points |
|---|---|---|
| El grupo pilló al culpable | each inocente, if the culprit is accused | +2 |
| Te saliste con la tuya | the culprit, if not accused | +4 |
| Tu culpable escapó | the accomplice, if the culprit is not accused | +3 |
| Votaste al culpable | each inocente whose first-round vote named the culprit, whatever the outcome | +1 |
| Tu testimonio destapó una mentira | anyone who published a testimony that (a) contradicts the subject's alibi, (b) is true (speaker and subject really were in that place at that hour) and therefore (c) exposes a real lie. Max once per round | +1 |
| Cumpliste tu encargo | encargo completed (if enabled) | +1 |

Why these numbers: the culprit is one person against the table, so a successful escape is worth more than one share of a group win; an innocent who reads the culprit correctly still scores in a lost round, so quiet but sharp players are rewarded. Truthful exposure of lies is rewarded regardless of team, which also punishes reckless lying by anyone.

## 7. Match structure

- The host picks 3, 5 or 8 rounds, or no limit (default 5). After the last round the host opens the final standings (podium + case history). "Nueva partida" resets scores and returns to the lobby.
- The same scenario is not repeated within the last 12 rounds of a room (or within `catalogue − 1` if the catalogue is smaller).
- The host may return to the lobby between rounds (scores kept) to change settings.

## 8. Connection rules

| Situation | Rule |
|---|---|
| Disconnect mid-round | The player stays a participant. Timers continue. "Ends early" checks only count connected participants. A missing alibi becomes automatic; a missing vote is an abstention. |
| Reconnect | Same seat, same role and private card, restored from the server with the session token stored on that device. |
| Leave on purpose mid-round | Treated as permanently disconnected for the rest of the round; removed from the room when the round ends. Cannot rejoin with the old seat. |
| Join while a round is running | Enters as a spectator: sees the public board, has no private card and cannot act. Plays from the next round. |
| Host disconnects | The host keeps the role for 20 s (a refresh does not lose it). Then the role passes to the longest-connected present player. The match continues meanwhile because timers are server-controlled. |
| Host removes a player | Only players who are disconnected, or anyone while not mid-round. |
| Fewer than 4 connected | The current round continues to its end; a new round cannot start. |
| Empty room | Deleted 15 minutes after the last person disconnects; any room is deleted after 6 hours without activity. |

## 9. Encargos (optional, off by default)

Each participant receives one secret side mission. Completion is evaluated by the server at the verdict, only from objective data:

| Encargo | Completed when |
|---|---|
| Que X reciba al menos 2 votos (el tuyo no cuenta) | ≥ 2 first-round votes for X from people other than you |
| Que nadie te vote | 0 first-round votes for you |
| Vota a la misma persona que X | you and X voted for the same person in the first round |
| Que otra persona publique un testimonio que cuadre con tu coartada | someone else's testimony about you is marked "Cuadra" |
| Publica un testimonio que contradiga la coartada de X | one of your testimonies about X is marked "No cuadra" |
| Que tu coartada diga que estuviste en P | your sealed alibi names P at least once (P is always a place you never actually visited, so it requires a lie) |

Encargos never change team victory. They create plausible innocent reasons to lie or to push suspicion, which is the point.

## 10. Lies: what the software verifies and what it does not

- The software verifies **consistency between public statements** (testimony vs. declared alibi) the moment they are made.
- The software verifies **truth** only at the verdict (lies struck through, "cazador" points).
- Who is lying in a contradiction, whether someone "acted guilty", or whether a story was convincing is never decided by the software. It is decided by the vote.

## 11. Worked example (5 players, real engine output)

Generated with `generateRound({ scenario: 'boda-tarta', players: ['Ana','Bruno','Carla','Dani','Eva'], seed: 'ejemplo-5' })`.

**Case.** *La tarta de la boda.* Someone took a huge bite out of the wedding cake. **Scene: La capilla a las 00:00.** Places in play (5 players → 4): La cocina, El jardín, La barra libre, La capilla.

**Private cards** (each person sees only their own row):

| Player | Role | True night 22:00 / 23:00 / 00:00 | Memories |
|---|---|---|---|
| Ana | **Culpable** | Jardín / Jardín / **Capilla** | with Eva in Jardín at 22:00; with Bruno in Jardín at 23:00 |
| Bruno | Inocente | Cocina / Jardín / Barra | with Ana in Jardín at 23:00; with Carla in Barra at 00:00 |
| Carla | Inocente | Barra / Jardín / Barra | with Eva in Jardín at 23:00; with Bruno in Barra at 00:00 |
| Dani | Inocente | Barra / Cocina / Barra | with Carla in Barra at 22:00; with Bruno in Barra at 00:00 |
| Eva | Inocente (decoy) | Jardín / Jardín / Barra | with Bruno in Barra at 00:00; with Carla in Barra at 00:00 |

Hidden from everyone until the verdict: evidence 1 = *Pétalos de buganvilla…: El culpable estuvo en El jardín a las 23:00*; evidence 2 = *El jardín a las 22:00*.

**Declaration.** Four innocents tell the truth. Ana must lie at 00:00. Everybody else was at the open bar at midnight, so she seals *Jardín / Jardín / Barra libre*, a crowded and safe-sounding lie, and keeps the truth elsewhere (she does not know which hours the evidence will cover).

**Reveal.** At 00:00 all five pins sit in La barra libre; the scene (La capilla) is empty. Nobody stands out yet.

**Investigation, evidence 1** (Jardín at 23:00). Ana, Bruno, Carla and Eva declared Jardín at 23:00, so Dani is effectively cleared. Testimonies:

- Bruno: "Estuve con Carla en La barra libre a las 00:00." **Cuadra.**
- Dani: "Estuve con Bruno en La barra libre a las 00:00." **Cuadra.**
- Ana, bluffing: "Estuve con Eva en La barra libre a las 00:00." **Cuadra**, because Eva also declared the bar. Eva protests that she does not remember Ana there; Ana answers that memories are incomplete. Both are allowed to be true, and that is the argument.

**Evidence 2** (Jardín at 22:00). Only Ana and Eva declared Jardín at 22:00. The table is down to two suspects. Carla points out that Ana testified *about* Eva while nobody has testified *about* Ana at midnight; Eva cannot produce a midnight voucher either.

**Vote.** Bruno → Ana, Carla → Eva, Dani → Ana, Eva → Ana, Ana → Eva. Ana 3, Eva 2: **Ana is accused and stamped CULPABLE.** The group wins.

**Score.** Bruno +3 (+2 group, +1 vote), Dani +3, Eva +3, Carla +2 (voted for Eva), Ana 0.

**Two counterfactuals to show the dilemma:**

- *If Dani had voted Eva*, Eva would have 3 votes and be accused. She is innocent, so Ana escapes: Ana +4; Bruno and Eva +1 each for voting correctly; Carla and Dani 0.
- *If Ana had also lied at 23:00* ("La cocina") to dodge evidence 1, Bruno could publish his true memory "Estuve con Ana en El jardín a las 23:00". The board would mark it **No cuadra**, and since the truth matches Bruno, he would earn +1 *cazador* at the verdict whatever the outcome. Lying more avoids evidence but feeds witnesses; lying less keeps you consistent but inside the evidence. That trade-off is the heart of the game.

## 12. Single-phone mode (pass-and-play)

Same rules, one device. Differences:

- Secret steps (declaration, vote, runoff) happen one person at a time behind a "Pasa el móvil a X / Soy X" hand-off screen and a "Ocultar y pasar" screen afterwards. These steps have no timer.
- Investigation happens on the shared screen with its timer. Testimonies are entered by first choosing who is speaking; memories are not shown on the shared screen (each person reads them during their private turn).
- "Siguiente prueba" / "A votar" are pressed by whoever holds the phone (no ready marks).
- Nothing is sent over the network.

## 13. Safety and tone

The game never asks for real secrets, personal information, dares or anything embarrassing about real people. The incidents are fictional and absurd; the deception is about a made-up evening. Names are free text (16 characters max) and stored only in server memory for the life of the room.
