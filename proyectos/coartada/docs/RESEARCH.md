# COARTADA: Reference Research

## 1. Scope and method

- **Date:** 2026-10-15.
- **Method:** About 40 targeted web searches and page fetches. Sources were publisher and app-store pages, Wikipedia entries (which cite publisher rules and press reviews), rules summaries, fan wikis and reviews. Direct WebFetch failed for some domains (DNS errors for wikipedia.org and officialgamerules.org), so those pages were read through Firecrawl instead. BoardGameGeek pages were not fetched directly. Where BGG is mentioned, the figure comes from a secondary page that cites it.
- **Labels used below:**
  - **Verified (source):** the fact comes from a linked source we read.
  - **Design hypothesis:** our own inference or recommendation. It still needs playtesting.
  - **Not verified:** we looked and could not confirm it, or we did not check it.
- **What was not verified:** official rulebook PDFs (we used rules summaries instead), precise teach times (every teach time in the table is a Design hypothesis), Perudo's commercial publisher details, and the current status of an official Blood on the Clocktower app.

---

## 2. Reference summaries

Each entry gives the facts first, then why it works and its weaknesses. Lines start with **V** for Verified (source) or **H** for Design hypothesis.

### Triple Agent! (Tasty Rook, 2017, mobile app)
- **V** ([App Store](https://apps.apple.com/app/triple-agent/id1247445624), [Come Out & Play](https://comeoutandplay.org/portfolio/triple-agent), [TouchArcade](https://toucharcade.com/community/threads/triple-agent-a-game-of-deception-for-5-9-people-beta-this-week.307359/)):
  - One phone is passed around. It takes 5–7 players (9 with the expansion) and about 10 minutes.
  - Players are secretly Service agents or VIRUS double agents. VIRUS knows the lineup and starts outnumbered.
  - Each player gets a private "operation" that may reveal information, switch their team or change their win condition. Players may lie about it.
  - One secret vote imprisons a player. If it is a double agent, the Service wins. Otherwise VIRUS wins.
- **H:** True but uncheckable private information plus loyalty that can change means nobody is ever safely cleared, and the single vote means nobody is eliminated. Passing one phone makes turns sequential and slow.

### Perudo / Liar's Dice (traditional Dudo; *Bluff* won the 1993 Spiel des Jahres)
- **V** ([Wikipedia](https://en.wikipedia.org/wiki/Liar%27s_dice)):
  - Dice are hidden under cups. Each turn a player raises the bid ("at least N of face F under all cups") or challenges it.
  - A challenge reveals all dice, and the loser loses a die. The last player with dice wins.
  - The expected count of any face is one-sixth of the unknown dice, which gives a strong probability baseline.
- **H:** Pressure builds as the bid climbs, and each challenge is a single reveal everyone watches. Weaknesses: eliminated players wait, and strategy is partly solvable through probability.

### Undercover / Mr. White (Yanstar Studio app)
- **V** ([official rules](https://yanstarstudio.com/undercover-how-to-play)):
  - It takes 3–20 players. Modes: pass-and-play on one phone, a private room on each player's own phone, or a public online room.
  - Civilians share a word, the Undercover gets a similar word, and Mr. White gets none.
  - Each round: describe your word, discuss, vote. The player voted out is eliminated and stops voting.
  - An eliminated Mr. White wins by guessing the Civilians' word.
- **V (forum opinion, [Bulbagarden](https://bulbagarden.net/threads/out-of-the-loop.282705/latest)):** groups keep Mr. White in until last to deny him the guess.
- **H:** The Undercover may not know they are the odd one out, and that self-doubt is funny. Elimination causes downtime.

### Spyfall (Alexandr Ushan, Hobby World 2014; Cryptozoic in English)
- **V** ([Wikipedia](https://en.wikipedia.org/wiki/Spyfall_(card_game)), [RulesPal](https://rulespal.com/spyfall/rulebook)):
  - It takes 3–8 players, rounds last about 8 minutes, and it was nominated for the 2016 Spiel des Jahres.
  - Everyone except the spy sees the location. Players question each other freely.
  - Each player can call one vote per round, and it must be unanimous. The spy may stop the clock and guess the location.
  - Points depend on how the round ended, over about 5 rounds.
- **H:** Insiders must prove they know the location without leaking it. Groups fall back on the same stock questions over time.

### The Chameleon (Rikki Tahta, Big Potato, 2017)
- **V** ([Wikipedia](https://en.wikipedia.org/wiki/The_Chameleon_(party_game)), [Big Potato](https://bigpotato.com/blog/how-to-play-the-chameleon-instructions)):
  - It takes 3–8 players and about 15 minutes, and it won Best Party Game at UK Games Expo 2017.
  - A 16-word grid plus dice and code cards show everyone except the Chameleon the secret word.
  - Each player gives a one-word clue, then the group votes by plurality. A caught Chameleon can still win by guessing the word.
  - Clues that are too obvious help the Chameleon, and clues that are too cryptic look suspicious.
  - Forbes said anyone can play "without even reading the instructions".
- **H:** The rules are as minimal as they get. Over a long session, rounds feel samey.

### Coup (Rikki Tahta, Indie Boards & Cards / La Mame, 2012)
- **V** ([Wikipedia](https://en.wikipedia.org/wiki/Coup_(card_game))):
  - It takes 2–6 players and about 15 minutes. Each player holds two hidden character cards.
  - Players claim any character to take its action. Anyone can challenge, and the loser of the challenge loses a card.
  - Losing both cards eliminates you. Kotaku noted the Rebellion variant can "drag on".
- **H:** Every claim is a risk you can measure, and challenges resolve instantly. Weaknesses: elimination, and players ganging up on the leader.

### One Night Ultimate Werewolf (Bézier Games; designer details and year Not verified)
- **V** ([Wikipedia](https://en.wikipedia.org/wiki/Ultimate_Werewolf), [RulesPal via search](https://rulespal.com/one-night-ultimate-werewolf/rulebook)):
  - The game is one night and one day, with one vote.
  - An app narrates the night wake order. Robber and Troublemaker swap cards, so a player's final role can differ from their starting one.
  - Critics credited it with fixing player elimination.
- **H:** Even honest players doubt whether their information is still current. Long chains of swaps confuse newcomers.

### Avalon / Secret Hitler (hidden teams, voting, assassin)
- **V, Avalon** (Don Eskridge, 5–10 players; [Wikipedia](https://en.wikipedia.org/wiki/The_Resistance_(game)), [Dized](https://rules.dized.com/game/rZluqS52QmGdpoVxcmVLtg/faq), [I Slay the Dragon](https://islaythedragon.com/game-reviews/what-happens-in-avalon-a-review-of-the-resistance-avalon/)):
  - Players vote on proposed teams, and team members secretly play Success or Fail.
  - After good completes three quests, the Assassin gets one guess at Merlin. Merlin knows who is evil but must hide that knowledge.
  - A play report found discussion kept restarting right before votes and suggested a timer ([Mechanics of Magic](https://mechanicsofmagic.com/2021/04/13/critical-play-comparative-analysis-avalon/)).
- **V, Secret Hitler** (Boxleiter, Maranges, Temkin; 5–10 players, about 45 minutes; [Tulsa](https://utulsa.edu/secret-hitler/)): the deck has more fascist policies than liberal ones, so honest players sometimes pass bad laws.
- **H:** A final targeted guess keeps the losing side dangerous. A lopsided deck gives liars an excuse that sounds honest.

### Hidden-agenda games
- **V:**
  - **Don't Get Got! (Big Potato)** ([retailer](https://www.firetoys.co.uk/products/dont-get-got-a-secret-missions-party-game)): each player has six secret missions to trick others. The first to complete three wins.
  - **Two Rooms and a Boom (Tuesday Knight Games)** ([publisher](https://tuesdayknightgames.com/products/two-rooms-and-a-boom), [Miami U.](https://sites.miamioh.edu/tabletop/?p=1736)): grey characters have personal win conditions. For example, the Gambler predicts the winning team.
- **H:** A small side-goal gives innocents a reason to act, but it can muddy the deduction.

### Deception: Murder in Hong Kong (Tobey Ho, Grey Fox, 2015)
- **V** ([Wikipedia](https://en.wikipedia.org/wiki/Deception:_Murder_in_Hong_Kong), [Board Game Blitz](https://www.boardgameblitz.com/posts/20/how-to-play-deception-murder-in-hong-kong), [Spielbound](https://www.spielbound.org/node/8828)):
  - It takes 4–12 players and about 20 minutes.
  - Every player shows four means cards and four clue cards. The Murderer secretly picks one of each from their own spread.
  - The Forensic Scientist knows the solution and communicates only by placing bullets on scene tiles. There are three rounds, and one tile is swapped each later round.
  - Each player in turn gets 30 seconds to talk. Each player has one badge for a single accusation, and a wrong accusation costs it.
  - If the case is solved, the Murderer can still win by identifying the Witness.
- **H:** This is our closest forensic reference: truthful but ambiguous evidence, revealed over time. Its weak point is the human Forensic Scientist, which is a hard role to play well.

### Phone and browser references
- **V, Jackbox** ([Western U.](https://pma.uwo.ca/jackbox-games/)): players type a 4-letter room code at jackbox.tv in a phone browser, with no install.
- **V, Push The Button** (4–10 players; [Jackbox](https://www-origin.jackboxgames.com/blog/the-jackbox-party-pack-six-is-available-now), [PC Games](https://www.pcgames.de/The-Jackbox-Party-Pack-6-Spiel-72295/Tests/party-smartphone-handy-tablet-halloween-1335082/), [Steam](https://steamcommunity.com/app/1005300/discussions/0/1696095261003253330)):
  - A rotating captain picks a test and its subjects. Aliens get slightly different prompts and can "hack" one test.
  - Each player can press the button once per game, and an ejection needs every remaining player to agree.
  - Pressing pauses the timer, so presses get hoarded for the end.
- **V, Fakin' It** ([wiki](https://jackboxgames.fandom.com/wiki/Fakin%27_It), [Jackbox](https://www.jackboxgames.com/games/physical/fakin-it-board-game)):
  - Every phone shows a secret task except the Faker's. The answers are physical: raising hands, pointing, making faces.
  - A reviewer noted that moving prompts onto phones for remote play helped the Faker.
- **V, Werewords app** ([Dized](https://rules.dized.com/game/lt3bmW-WSx6c2iP_IOWJKw/bZjeDFGLRZ-a7FjaQeG9Ig/app-overview)): the app runs the night phase and the timers. The yes/no tokens stay physical, and the app requires the physical game.
- **V, Insider (Oink)** ([Casual Game Revolution](https://casualgamerevolution.com/node/3135)): about 5 minutes of 20-questions while a hidden Insider steers. The first vote targets the player who guessed the word.
- **V, Among Us** ([Admin](https://among-us.fandom.com/wiki/Guide:Admin), [Vitals](https://among-us.fandom.com/wiki/Guide:Vitals)): players state where they were in meetings. Admin counts, Vitals and door logs confirm or break those claims.
- **V, Blood on the Clocktower** ([Wikipedia](https://en.wikipedia.org/wiki/Blood_on_the_Clocktower), [townsquare](https://github.com/aisen-lopez/townsquare-vue)): online play uses a web app and Discord, and fan-made grimoire tools exist. Not verified: whether an official in-person phone app exists.

---

## 3. Mechanics comparison

All teach times are **Design hypothesis**. Players and time are **Verified** where cited above.

| Game | Players | Time | Hidden info | Deception tool | Resolution | Elimination? | Teach | Digital fit |
|---|---|---|---|---|---|---|---|---|
| Triple Agent! | 5–9 | ~10 min | Team + private ops | Lie about your op | One secret vote | No | ~3 min | Native (one passed phone) |
| Perudo | 2–6+ (Not verified) | 15–30 min (Not verified) | Own dice | Bids | Challenge → reveal | Yes | ~2 min | High |
| Undercover | 3–20 | 10–20 min | Word (maybe wrong) | Vague description | Repeated votes | Yes | ~2 min | Native (own phones/room) |
| Spyfall | 3–8 | ~8 min/round | Location + role | Q&A | Unanimous vote / spy guess | No | ~3 min | High |
| Chameleon | 3–8 | ~15 min | Secret word | One-word clue | Plurality vote + guess | No | ~1 min | High |
| Coup | 2–6 | ~15 min | 2 role cards | Claims | Challenge → reveal | Yes | ~5 min | High |
| ONUW | 3–10 (Not verified) | ~10 min | Role (may change) | Claims | One simultaneous vote | No | ~5 min | App narrates |
| Avalon | 5–10 | ~30 min | Team + Merlin | Votes, mission cards | Missions + assassin | No | ~10 min | Medium |
| Deception: MiHK | 4–12 | ~20 min | Solution, roles | Steering talk | Badge accusations | No | ~10 min | Medium-high |
| Push The Button | 4–10 | ~15 min | Alien / human | Mismatched answers | Unanimous eject | No | ~3 min (guided) | Native |
| Among Us (meetings) | 4–15 (Not verified) | 10–15 min | Role, location | Location claims | Plurality vote | Yes | ~5 min | Native |

---

## 4. Cross-cutting findings

**Tension between friends (Design hypothesis, supported by the sources above):**
- Tension peaks when someone has to commit publicly before they have full information. Examples are a Coup claim, a Perudo bid and a Chameleon word.
- The best moments are when a commitment collides with a truth the game cannot dispute: a reveal, a flip, a dice count.
- Calling out a friend is socially cheap when the game supplies the accusation, for example "the app says your alibi contradicts Ana's". It is expensive when the accusation has to come from your gut.

**Simultaneous secret decisions and simultaneous reveals:**
- Verified: practitioners describe simultaneous selection as a guessing game about what others will do. They also say it speeds up play ([The Players' Aid](https://theplayersaid.com/2016/09/15/best-3-games-with-simultanious-action-selection/), [BGDF](https://www.bgdf.com/forum/archive/archive-game-creation/topics-game-design/tigd-sources-tension)).
- Verified caveat: once revealed, choices must still feel meaningful, or the tension turns into frustration ([GameBanshee/BattleTech update](https://www.gamebanshee.com/kxq64)).
- Design hypothesis: a simultaneous flip also removes any advantage from going last, which a sequential round always has. Spyfall, Chameleon and Undercover all use sequential turns.

**Why rounds feel different (Design hypothesis):**
- Variety comes from content: the Chameleon topics, the Spyfall locations, the Undercover word pairs.
- It also comes from role mixes, as in ONUW and Avalon, and from evidence that arrives in a changing order, as in Deception's swapped scene tiles.
- Rule-light games repeat quickly unless the content keeps changing.

**What makes games easy to teach (Design hypothesis):**
- There is one sentence that sums up each side's goal.
- Players learn through the first round rather than before it. Push The Button runs tutorial rounds, and Undercover needs no setup.
- The device enforces the rules. The ONUW and Werewords apps narrate and time the game.
- The Chameleon shows that a minimal ruleset is the main selling point reviewers mention (Verified, Forbes via Wikipedia).

**Causes of downtime, repetition and unfairness:**
- Verified:
  - Player elimination: Werewolf, Coup, Perudo and Undercover remove players. ONUW was praised specifically for removing elimination ([Wikipedia](https://en.wikipedia.org/wiki/Ultimate_Werewolf), [Bézier blog](https://beziergames.com/blogs/news/why-limited-player-elimination-is-a-good-thing)).
  - Discussion stalling right before votes ([Avalon play report](https://mechanicsofmagic.com/2021/04/13/critical-play-comparative-analysis-avalon/)).
  - Bandwagon voting when there is no public evidence ([Mechanics of Magic](https://mechanicsofmagic.com/2026/07/27/critical-play-competitive-analysis-144/)).
- Design hypothesis:
  - Passing a single device creates queues.
  - A human clue-giver who plays badly or unevenly.
  - Information overload, as in ONUW's chains of card swaps.
  - Solved openings, as in Perudo's probability baseline and Spyfall's stock questions.

**Digital / mobile UX patterns:**
- Verified:
  - A short room code entered on a web page, with no app install (Jackbox; ALIBI uses a 6-character code; MAFIA 374 joins by QR).
  - Each player keeps their role on their own phone (Undercover private rooms, Push The Button, Fakin' It).
  - The app runs night phases and timers (ONUW, Werewords).
  - Important actions stay physical and in the room (Fakin' It's hand raises, Werewords' tokens). One reviewer noted that moving those actions onto phones changed the balance of Fakin' It.
- Design hypothesis:
  - Keep the phone for private information and secret input. Answers, accusations and arguments should happen out loud.
  - Use a shared "table" view (any phone or a TV) only for simultaneous reveals.
  - Make every phone screen glanceable in about 2 seconds.

**Humor (Design hypothesis, guidance only):**
- Use familiar messaging-app conventions rather than specific memes. Good candidates:
  - Read receipts ("seen at 21:04").
  - Voice-note waveforms as a testimony skin.
  - "Typing…" indicators while someone writes a testimony.
  - Disappearing stories as alibi "proof".
  - Group-chat renames.
  - Location-sharing pins ("Find my friends").
- These have been around for years and will age slowly.
- Make the humor come from situations the game creates, such as "your alibi says gym; your read receipt says otherwise". Avoid quoting a specific trend.
- Keep it light and never cruel. Players accuse friends, so the jokes should mock the alibi, not the person.

---

## 5. Similar-mechanic check: the alibi board

**Searches run:** "alibi timeline social deduction game declare locations contradiction", "board game murderer alibi time slots location cards", "phone party game alibi … room code", plus hidden-movement and Among Us follow-ups.

**What exists (Verified unless noted):**

- **Où étiez-vous? (Christian Lemay and Pascal Roussel, 2008, 5–20 players)** ([BoardGameMatcher](https://boardgamematcher.com/game/ou-etiez-vous)):
  - Two suspects get 3 minutes to prepare a shared alibi, then are questioned separately. Mismatched answers mean guilty.
  - It is about contradiction, but it is cooperative and verbal. There is no board, no time slots and no evidence.
- **Alibi (iPhone app, Julien Le Ber, 2023)** ([App Store](https://apps.apple.com/us/app/alibi/id6455989638)): two teammates have 60 seconds to memorize an alibi, then must match their answers in front of a judge. It works on the same principle as Où étiez-vous? and is not social deduction.
- **Alibis (storytelling deduction game, reviewed Feb 2026)** ([Frontline Gaming](https://frontlinegaming.org/2026/02/04/alibis-board-game-review/)): players tell stories, true or invented, about mysterious events, and inconsistencies reveal motives. The review mentions no locations, time grid or automated checking. Its designer and publisher are not verified.
- **ALIBI (FH Salzburg student project, 2026, browser, mobile-first)** ([portfolio](https://portfolio.fh-salzburg.ac.at/projects/2026-alibi-a-multiplayer-social-deduction-game)):
  - Players join with a 6-character code and need no account.
  - It deals secret roles (Citizens, Conspirators, Investigator), a private clue each, discussion, votes, and night phases in larger games.
  - **It shares our name concept and our room-join model,** but the page shows no location/time-slot board and no contradiction engine.
  - Risk: confusion over the name "Alibi" when translated into English.
- **Three Night Alibi** (student design, [Mechanics of Magic](https://mechanicsofmagic.com/2022/04/21/7092/)) and **Perfect Alibi** (card deduction, [review](https://miniaturemarket.com/reviewcorner/perfect-alibi-review)): players argue alibis or ask "where/when" questions. Neither has a simultaneous declared timeline. These were read only as search summaries.
- **Hidden-movement games: Letters from Whitechapel, Scotland Yard** ([Unfiltered Gamer](https://unfilteredgamer.com/review-letters-from-whitechapel/), [rules summary PDF](https://www.orderofgamers.com/downloads/LettersFromWhitechapel_v1.pdf)):
  - Jack secretly writes down his path. The police uncover clues showing he passed through certain locations at some point.
  - **This is conceptually the closest match to our "traces show where the culprit really was at other times".** It is one player against the rest, not a party game.
- **Among Us meetings:** players state locations, and Admin, Vitals and door logs confirm or refute them. **This is the closest digital match to "claimed location versus objective record".** The records are real-time and partial, and players have to check them by hand.

**How COARTADA differs (Design hypothesis):**
1. **Everyone commits a full alibi (3 slots) at the same moment, before any discussion.** No reference we found makes every player, innocent or guilty, commit a structured timeline simultaneously.
2. **The app checks contradictions automatically.** Public testimonies are matched against declared alibis and marked as contradicted or corroborated. In Among Us and Où étiez-vous?, players or a moderator have to spot contradictions themselves.
3. **The culprit's decision under uncertainty.** The culprit must decide how much to lie before knowing which traces will come out. This combines Perudo-style risk management with hidden-movement clues.
4. **Innocents hold true but partial memories.** Their sightings resemble Triple Agent's operations and the Seer in ONUW. The difference is that they are tied to a grid where they can be checked.
5. **Forensic evidence is always true and app-driven.** Deception relies on a human Forensic Scientist. In our design the app is the neutral source, so nobody has to play that hard role.

**Honest risk:** the parts are familiar: an alibi theme, hidden movement, Among Us-style claims and Deception-style forensics. Our originality depends on combining them: a simultaneous structured declaration, an automatic contradiction engine, and the culprit's lying budget. It does not depend on any single mechanic. Avoid using just "Alibi" in English marketing, and present the concept as "declare and flip" rather than "murder mystery".

---

## 6. Opportunities for differentiation (Design hypothesis)

- **Simultaneous alibi flip as the signature moment.** Put it on the shared screen with a short countdown. No other reference uses this beat.
- **"Lying budget" for the culprit.** Lie more and you risk more contradictions with sightings. Lie less and you risk traces. This makes the Perudo-style risk legible to the culprit.
- **No elimination.** Use one final secret vote, as in Triple Agent! and ONUW, so everyone plays to the end. An Avalon-style last chance could follow, for example the culprit names the player who held the key memory.
- **The app as an impartial forensic scientist.** It removes Deception's hardest role and makes evidence consistent.
- **Automatic contradiction and corroboration marks.** Players argue about why there is a contradiction, not whether there is one. This cuts the rules-lawyering and stalling seen in Avalon reports.
- **Give innocents meaningful private information.** Memories should be true but partial, so innocents also have something to decide, such as when to reveal a memory and to whom. That counters Werewolf's "nothing to do" problem.
- **Vary rounds through content.** Rotate maps, locations and trace types, and change which time slot the crime falls in. Rule-light games go stale without changing content.
- **Built-in timers and a "lock discussion" moment** to stop discussion stalling before the vote.
- **Phone for secrets, voice for accusations.** Keep testimonies short and structured, using tap-to-build sentences, so the argument happens out loud. The Fakin' It reviewer's observation backs this up.
- **Join flow:** a 4–6 character code plus a QR code, no accounts, rejoin after the screen locks, and one person hosting on any phone or TV.
- **Messaging-app humor:** use read receipts, voice-note waveforms and "typing…" indicators as the visual style of testimony, rather than meme references.
- **Optional side-objectives** (Don't Get Got!, Two Rooms' Gambler) for experienced groups only, to keep the first teach to one sentence.

---

## 7. Sources

- https://apps.apple.com/app/triple-agent/id1247445624
- https://comeoutandplay.org/portfolio/triple-agent
- https://toucharcade.com/community/threads/triple-agent-a-game-of-deception-for-5-9-people-beta-this-week.307359/
- https://en.wikipedia.org/wiki/Liar%27s_dice
- https://yanstarstudio.com/undercover-how-to-play
- https://apps.apple.com/app/id946882449
- https://bulbagarden.net/threads/out-of-the-loop.282705/latest
- https://en.wikipedia.org/wiki/Spyfall_(card_game)
- https://rulespal.com/spyfall/rulebook
- https://en.wikipedia.org/wiki/The_Chameleon_(party_game)
- https://bigpotato.com/blog/how-to-play-the-chameleon-instructions
- https://en.wikipedia.org/wiki/Coup_(card_game)
- https://en.wikipedia.org/wiki/Ultimate_Werewolf
- https://rulespal.com/one-night-ultimate-werewolf/rulebook
- https://beziergames.com/blogs/news/why-limited-player-elimination-is-a-good-thing
- https://en.wikipedia.org/wiki/The_Resistance_(game)
- https://rules.dized.com/game/rZluqS52QmGdpoVxcmVLtg/faq
- https://islaythedragon.com/game-reviews/what-happens-in-avalon-a-review-of-the-resistance-avalon/
- https://mechanicsofmagic.com/2021/04/13/critical-play-comparative-analysis-avalon/
- https://utulsa.edu/secret-hitler/
- https://www.firetoys.co.uk/products/dont-get-got-a-secret-missions-party-game
- https://tuesdayknightgames.com/products/two-rooms-and-a-boom
- https://sites.miamioh.edu/tabletop/?p=1736
- https://theologyofgames.com/blog/2015/7/28/2-rooms-and-a-boom-a-single-take-preview
- https://en.wikipedia.org/wiki/Deception:_Murder_in_Hong_Kong
- https://www.boardgameblitz.com/posts/20/how-to-play-deception-murder-in-hong-kong
- https://www.spielbound.org/node/8828
- https://pma.uwo.ca/jackbox-games/
- https://www.facebook.com/JackboxGames/posts/looking-to-play-jackbox-games-but-dont-know-how-dude-its-so-easy/1541673634671568/
- https://www-origin.jackboxgames.com/blog/the-jackbox-party-pack-six-is-available-now
- https://www.pcgames.de/The-Jackbox-Party-Pack-6-Spiel-72295/Tests/party-smartphone-handy-tablet-halloween-1335082/
- https://steamcommunity.com/app/1005300/discussions/0/1696095261003253330
- https://jackboxgames.fandom.com/wiki/Fakin%27_It
- https://www.jackboxgames.com/games/physical/fakin-it-board-game
- https://rules.dized.com/game/lt3bmW-WSx6c2iP_IOWJKw/bZjeDFGLRZ-a7FjaQeG9Ig/app-overview
- https://apps.apple.com/us/app/-/id1243586902
- https://casualgamerevolution.com/node/3135
- https://oinkgames.com/en/games/analog/insider
- https://among-us.fandom.com/wiki/Guide:Admin
- https://among-us.fandom.com/wiki/Guide:Vitals
- https://en.wikipedia.org/wiki/Blood_on_the_Clocktower
- https://github.com/aisen-lopez/townsquare-vue
- https://theplayersaid.com/2016/09/15/best-3-games-with-simultanious-action-selection/
- https://www.bgdf.com/forum/archive/archive-game-creation/topics-game-design/tigd-sources-tension
- https://www.gamebanshee.com/kxq64
- https://mechanicsofmagic.com/2026/07/27/critical-play-competitive-analysis-144/
- https://boardgamematcher.com/game/ou-etiez-vous
- https://apps.apple.com/us/app/alibi/id6455989638
- https://frontlinegaming.org/2026/02/04/alibis-board-game-review/
- https://portfolio.fh-salzburg.ac.at/projects/2026-alibi-a-multiplayer-social-deduction-game
- https://mechanicsofmagic.com/2022/04/21/7092/
- https://miniaturemarket.com/reviewcorner/perfect-alibi-review
- https://unfilteredgamer.com/review-letters-from-whitechapel/
- https://www.orderofgamers.com/downloads/LettersFromWhitechapel_v1.pdf

**Could not access directly:** officialgamerules.org (DNS failure); Wikipedia through WebFetch (DNS failure, read through Firecrawl instead); the RulesPal Deception rulebook (redirected to the home page; Board Game Blitz used instead); BoardGameGeek pages (not fetched).
