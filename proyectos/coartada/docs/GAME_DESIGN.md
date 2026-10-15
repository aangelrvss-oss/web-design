# COARTADA: game design

> *Las pruebas nunca mienten. Tus amigos, a lo mejor sí.*

**Status:** implemented and playable (see `CHECKPOINT.md`). Precise rules: `RULES.md`. Research behind the decisions: `RESEARCH.md`.

## 1. The game in one paragraph

Coartada is a 4–10 player social-deduction party game for friends in the same room, each on their own phone. An absurd incident happened at a venue (the wedding cake has a bite out of it; the landlord's cat now has a mohawk) and one of the players did it. Everyone secretly declares where they were at three hours; all alibis flip onto a shared board at the same instant. Players testify ("I was with Marta at 23:00") and the board instantly marks whether that matches Marta's alibi. Two pieces of forensic evidence appear during the discussion. They are always true and say where the culprit *really* was at the other two hours. A secret vote decides. One round takes 6–9 minutes.

**The 60-second pitch** (what the host says out loud): *"One of us did something stupid last night. We all secretly say where we were at three times, and then we flip them all at once. If you say you were with someone, the board tells us whether their story matches. Then the evidence comes out: it never lies, and it says where the culprit really was at the other times. Whoever lied to dodge it is in trouble. Then we vote."*

## 2. Central mechanic: sealed alibis vs. delayed evidence

The culprit has to commit to a whole alibi **before** knowing which hours the evidence will cover. They can:

- **Lie only where they must** (the crime hour): consistent with every witness, but the evidence will place them, truthfully, in the same rooms as at least one innocent "decoy". They will be one of two or three suspects.
- **Lie more to dodge the evidence**: off the evidence trail, but anyone who really was with them at those hours can publish a memory that the board marks **No cuadra**.

Everyone else's job is to read the board, publish what they remember, and decide who in a contradiction is lying. The software verifies **consistency between public statements** instantly and **truth** only at the end; it never decides who lied. People do.

Each element feeds the others:

| Element | What it creates | What it feeds |
|---|---|---|
| Simultaneous sealed alibis | One reveal moment for the whole table, no first-mover disadvantage, no tell from who answers fast | A board everyone argues over |
| Private true memories (incomplete) | A reason for each person to speak and a reason to doubt ("I don't remember you there") | Testimonies |
| Testimonies checked against alibis | Instant, objective contradictions without a referee | Accusations; +1 for truthfully exposing a lie |
| Evidence that never lies, revealed late | Narrowing suspects mid-discussion; the culprit's lie-or-not dilemma | The vote |
| Secret simultaneous vote + runoff | A single clean decision; no elimination, no waiting | The verdict reveal |

## 3. Candidate concepts considered

| | A. Versión oficial (initial hypothesis) | B. **Coartada: alibi board** (chosen) | C. Pacto de silencio |
|---|---|---|---|
| Core | Group must agree on WHO/HOW/WHY of an incident; fragments of truth are private; manipulators push a false version | Secret alibis on a shared timeline; testimonies checked automatically; true forensic evidence revealed late | Group "gets its story straight", then each player answers interrogation questions separately; an outsider who wasn't there must fake it |
| Novelty | Medium | High: no game found that combines simultaneous alibi commitment, automatic contradiction marking and delayed true evidence (see RESEARCH §5) | Low: very close to The Chameleon / Spyfall / Undercover |
| Explain in 60 s | Hard: "convincing" story and fragment logic | Yes | Yes |
| Social interaction | High but drifts into abstract debate | High, anchored on concrete claims ("you said kitchen!") | Medium: clue-giving is constrained |
| Replayability | Depends on hand-written plots | Seeded nights × 25 cases × 4–10 players × varied hours | Word lists |
| Fairness | Hard: "most convincing story" is subjective, the software can't adjudicate | Every rule resolves objectively; balance measurable by simulation | Good |
| Mobile usability | Lots of reading | 3 taps to declare, 2 taps to testify, 1 to vote | Good |
| Implementation cost | High (hand-authored logic per plot) | Medium (one generator, data-driven cases) | Low |
| Memorable moments | Medium | The flip, "no cuadra", evidence 2 landing on someone, the stamp | Answer reveal |

**Decision: B.** It keeps the original premise (a group explaining a strange incident, with private knowledge and liars) but replaces "agree on a convincing story", which software can't judge, with *where were you*, which it can. The decisive advantage is that contradictions are objective while who lied stays social.

What was deliberately **left out**: night actions and role swaps (ONUW), card claims and challenges (Coup), word clues (Chameleon), elimination (Werewolf), an assassin step (Avalon), currencies and progression. Each would add rules without strengthening the alibi-vs-evidence dilemma.

## 4. Roles

Three roles, dealt by the server:

- **Inocente.** Knows their true night and two true memories. Wins if the culprit is accused.
- **Culpable.** Was at the scene at the crime hour. Must lie there at least. Wins if not accused.
- **Cómplice** (6+ players). Knows who the culprit is and wins with them. Can vouch for the culprit with a fake testimony, but only if they happened to declare the same place: testimonies always use the speaker's own alibi. The culprit is **not** told where the accomplice was. Simulation showed that hint made fake vouching too strong.

## 5. Why it is more than a reskin

- **Werewolf/Avalon** hide teams and resolve with talk and votes; Coartada adds a *structured, checkable* public record (the board) that changes the conversation from "I trust you" to "your story doesn't match hers at 23:00".
- **Spyfall/Chameleon/Undercover** hide a single fact from one outsider; here *everyone* holds partial truths, the liar knows everything, and lying is a multi-hour commitment.
- **Deception: Murder in Hong Kong** uses true but ambiguous forensic clues from a human forensic scientist; Coartada's evidence is exact, delivered by the app, and timed to punish over-lying.
- **Letters from Whitechapel / Scotland Yard** have a hidden path and true sightings, but one player versus the rest in a long board game. Coartada compresses that into a 7-minute party round where anyone could be hiding the path.
- **Among Us meetings** compare location claims against logs; here the "logs" are other people's memories, and the app checks consistency automatically.

## 6. Content strategy

- **Cases are data** (`src/shared/content/scenarios/*.ts`): title, venue, incident, culprit action (for summaries), three hours, five places each with a physical trace, the places where the incident can plausibly happen, and a note per scene place. Adding a case = adding one file.
- **25 hand-reviewed cases** at launch: weddings, shared flats, offices, a 90th birthday, Christmas lunch, a cruise, a night train, a rural house, a campsite, a Camino hostel, a residents' meeting, a village fiesta, an escape room, karaoke, a gym, a padel tournament, a music festival, a museum, a cooking-show shoot, a school play, a library, a school trip, a giant-pumpkin contest, an observatory and a hen party.
- **Variation without new writing:** each round draws a seeded true night, roles, memories, evidence order, which hours are the crime hour, which of 2–3 plausible scene places is used, and which four of five places are in play for small groups. The same case plays differently every time.
- **Validation** (`npm run validate`, also run in tests and at server boot): shape and length checks, plus 25 generated rounds × 7 player counts per case, each checked against the invariants in RULES §3.
- **Tone:** absurd, specific and harmless; light internet-culture touches (group chats, voice notes, read receipts, a viral clip) that won't date quickly. No real people, brands, politics or cruelty. Humor comes from fiction and playful lying, never from real secrets.
- **No AI at runtime.** Summaries ("Ana le pegó un mordisco a la tarta… pero juró que estaba en la barra libre") and mentions ("Cazador de mentiras", "Mentira gratuita", "Cabeza de turco") are templates filled from the round data.

## 7. Example round

See RULES §11 for a complete 5-player round generated by the real engine, with private cards, testimonies, both pieces of evidence, the vote and the scoring, plus two counterfactuals.

## 8. Modes

- **Online, one phone each (primary).** Room code, invite link and QR. Server-authoritative. Players can be in the same room (recommended) or on a video call.
- **Single phone (pass-and-play).** The same engine runs in the browser; secret steps go round the table behind hand-off screens. Good when only one person has the game open or connectivity is poor. It is clearly labeled and never pretends to be online.

## 9. Pacing

| Step | Normal |
|---|---|
| Read the case + declare | ≤ 2:00 |
| Discussion with evidence 1 | ≤ 2:00 |
| Discussion with evidence 2 | ≤ 2:30 |
| Vote (+ runoff) | ≤ 0:45 (+0:30) |
| Verdict | ~1:00 |

Typically 6–9 minutes. Every step ends early once all connected players have acted, so a sharp table plays faster. Nobody is ever eliminated or waiting on a single player's turn.

## 10. Visual identity and audio

- **Desk and documents.** Ink-blue desk (`#171C24`), ivory paper (`#EFE8D8`), kraft folder (`#D8C397`). Two inks carry meaning on paper: rubber-stamp red (`#C2362C`) for actions and contradictions, ballpoint blue (`#2E5B88`) for corroboration and evidence.
- **Type.** Archivo (condensed, 800–900) for titles and stamps; Instrument Sans for interface text; Courier Prime only for "typed documents" (incident, private file, testimonies).
- **Signature moments.** The confidential file opens from behind redaction bars; all pins flip onto the kraft board together; evidence is circled in ballpoint on the board; the verdict lands as an inked stamp (CULPABLE / INOCENTE).
- **Audio.** Synthesized with Web Audio (no files, no network), **muted by default**. Sounds only accompany public moments everyone experiences at once (phase changes, flip, verdict, last-5-second ticks). There are no role-specific sounds, so nothing leaks to people nearby.
- **Accessibility.** 44 px+ touch targets, safe-area padding, reduced-motion support (system setting + in-app switch), semantic grid/table roles on the board, focus outlines, sentence-case copy.

## 11. Known design limitations

- Balance numbers come from scripted bots (RULES/CHECKPOINT); real tables will differ. Not yet playtested with people.
- With 9–10 players the board gets crowded (up to 10 pins in a cell) and the bots' catch rate drops to ~41–49%.
- Encargos are off by default; their effect on balance has not been simulated.
