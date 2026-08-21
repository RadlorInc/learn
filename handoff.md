# Session Handoff — Milo Story Mode

> 📐 **READ [docs/chapter-craft.md](docs/chapter-craft.md) FIRST, EVERY SESSION, BEFORE TOUCHING ANY 3–11 STORY CHAPTER.**
> It is the standing answer to *how we want the animation, the art and the voice* — the shape of a
> chapter, how cycles and travel must agree, what may be an answer object, how to choose a backdrop,
> how to generate a new drawn cycle, how Milo speaks, and how to verify any of it.
> Everything in it was paid for by a founder catching it on a screenshot. **Most of those rules were
> already learned in chapter 1, forgotten, and re-learned the hard way in a later chapter** — that
> file exists so the next session starts from them instead of rediscovering them.
> When a new correction lands, put the GENERAL rule there, not just the fix.
>
> ---
>
> ## 📍 WHERE THE 9–11 BAND IS — read this before touching it
>
> **The port is FINISHED at eight** (founder's call, 2026-08-14: treat 9–11 like 12–18, same engine,
> same format, **AR as the thing that makes it its own band**). EIGHT chapters are across and
> **the last two are deliberately staying storybook — founder's call, 2026-08-16: *"woh dono chapter
> waise hi rahenge… bina neon mein"***. So this table is the finished state, not a to-do list.
> ⚠️ **The two halves work completely differently — check which kind you are in before you touch
> one.** Do NOT port `OrderDesk` or `LevelRun`; they are storybook `SkillBeat` on purpose, and both
> pass the C7 gate as they are. The band is mixed by design.
>
> | | chapter | file | answers with |
> |---|---|---|---|
> | ✅ | `decimals` | `teen/games/CoinTrayGame.tsx` | two wells · hand or taps |
> | ✅ | `factorsMultiples` | `teen/games/FactorLabGame.tsx` | a count · hand or taps |
> | ✅ | `fractionsCompare` | `teen/games/PizzaCounterGame.tsx` | a count (never 0) |
> | ✅ | `measurementUnits` | `teen/games/HeightBarGame.tsx` | two places · tens then ones |
> | ✅ | `anglesSymmetry` | `teen/games/AngleShopGame.tsx` | a degree OR a set of axes · tilt |
> | ✅ | `wordProblems` | `teen/games/MissionBriefGame.tsx` | the shell's AnswerPad |
> | ✅ | `areaPerimeter` | `teen/games/EmptyPlotGame.tsx` | a PLACE on a plan · **hands apart** |
> | ✅ | `dataGraphs` | `teen/games/LoadingBayGame.tsx` | a stack OR a count · hand or taps |
> | 🔒 | `bigNumbers` | `story/OrderDesk.tsx` | storybook · SkillBeat — **staying storybook, do not port** |
> | 🔒 | `rounding` | `story/LevelRun.tsx` | storybook · SkillBeat — **staying storybook, do not port** |
>
> **⚠️ THE 3D IS GONE.** `story/FloorPlot.tsx` (1,380 lines of react-three-fiber) and `story/plotSite.ts`
> (628 lines of procedural site) are DELETED — founder's call, 2026-08-15: *"totally remove that 3d
> concept"*. ✅ The four dead dependencies (`three` / `@react-three/fiber` / `@react-three/drei` /
> `@types/three`) were **uninstalled 2026-08-16**; production dependencies are 10 → 7.
>
> **To add or change a ported chapter:** it is a data file — palette, `makeTask` L1/L2/L3, a
> self-running tutorial, a `GameConfig`. Mirror `CoinTrayGame.tsx`. Shared parts are
> `teen/games/parts/kidKit.tsx` (palette · `KeyRow` · `Cue` · `PIP`/`PAD` · `useLatest`) and the
> engine is `teen/games/parts/GameShell.tsx`.
> - `band: '9-11'` is what buys the ten-round loop. ⚠️ It used to also mean *no*
>   resume-at-difficulty; **every band resumes now** — founder's call, 2026-08-20. See 🎚️.
> - `hand: {…}` is the whole AR wiring — the shell owns the camera, both doors, the dwell and the
>   gate. Readings in use: a finger COUNT (five chapters — and in The Loading Bay ONE count means a
>   stack number on one round type and a quantity on another), a TILT (The Angle Shop) and a two-hand
>   SPAN (The Empty Plot, and the first one ever scored — see 🏗️ for the noise arithmetic).
> - `coverage: {…}` withholds the mastery exit until every reading has been asked.
> - ⚠️ **The maths still lives in `story/<module>.ts`** (`cents` · `factors` · `pizza` · `inches` ·
>   `angles` · `words` · `plotMaths` · `cargo`), untouched by the port and still carrying every gate. **Put a rule there, not
>   in the data file** — that split is the only reason ten chapters can share one engine.
> - ⚠️ **Author an instrument BIG.** `FitSlot` runs at `max={1}` on landscape: it only ever shrinks.
> - Previews are **`/teen-preview?c=<id>`**. `/story?ch=` now rejects all EIGHT keys by design; only
>   `bignum` and `round` still resolve there.
>
> **The band-level gate is `src/__tests__/bandOnGameShell.test.ts`** — it holds the rules that used to
> be repeated per chapter (rounds, resume, the fist guard, the dwell key, both doors, coverage).
>
> ⚠️ **Biggest outstanding gaps, in order:** ✅ the camera path has been driven on the shell (The
> Empty Plot, span → dwell → graded) · ✅ the scratch-pad collision is FIXED (2026-08-16) · ✅ the
> walkthrough's missing `FitSlot` is FIXED (2026-08-16 — it had NO scale-to-fit on the legacy path,
> which is the path every 9–11 chapter takes) · **the EXPLORE beats were dropped and not replaced**
> (the largest remaining loss — The Height Bar's span reading now ships in no beat at all) · **the
> re-teach has never been seen fire anywhere in the band** · ⚠️ **AR has never been driven with a
> REAL HAND on a real camera** — MediaPipe is proven to boot on prod under the enforced CSP
> (`Graph successfully started running.`, 0 violations), but the band's defining feature is
> unverified end to end and only the founder can close it. Everything is committed; prod is on
> **sw v120**.
>
> 📍 **WHERE THINGS LIVE NOW (2026-08-19).** **TWO repos, two Vercel projects, two hosts.**
>
> | | |
> |---|---|
> | **the product** | `RadlorInc/learn` → **`https://adaptivelearn.radlor.com`** — this repo |
> | **the company site** | `RadlorInc/website` → **`https://radlor.com`** — at `../radlor-site` |
>
> ⚠️ **Both repos must stay PUBLIC until Vercel is Pro** — Hobby refuses a private *org-owned* repo
> through the Git integration. `git remote` here is `https://github.com/RadlorInc/learn.git`.
> ⚠️ **The org was RENAMED `RadlorMain` → `RadlorInc` on 2026-08-20.** Repo ID `1248492657` is
> unchanged, so Vercel's link survives — but GitHub 301s the old name only until somebody claims
> it, so nothing may reference `RadlorMain`. Both remotes were re-pointed and verified.
> Support address **support@radlor.com** (⚠️ may have no mailbox — see 🇺🇸 §⑥); mi2utor is retired.
>
> ⚠️ **THE TWO PROPERTIES DESCRIBE ONE ENTITY AND THAT IS LOAD-BEARING.** Both emit
> `SoftwareApplication` with the identical `@id` `https://adaptivelearn.radlor.com/#app`, and both
> point `publisher` at `https://radlor.com/#organization` — **declared once on radlor.com and only
> REFERENCED here.** Retyping either string silently splits the product in half. They live in
> `src/app/site.ts` (`APP_ID`/`COMPANY_ID`) and `../radlor-site/site.ts`, and
> `src/__tests__/publicSeo.test.ts` asserts the exact values.
>
> ⚠️ **`SOCIAL` IN `../radlor-site/site.ts` IS LOAD-BEARING AND FOUR OF ITS SIX LINKS LIVE IN A
> GODADDY PANEL.** It feeds `Organization.sameAs`, the footer and `llms.txt` from one list. Four go
> through our own `*.radlor.com` forwards, so a forward silently repointed at a platform homepage
> tells every answer engine that the entity called Radlor **is Facebook**. **Run `npm run
> check:social` after any GoDaddy edit and before any deploy that touches it** — ⚠️ that script and its
> npm alias live in **`../radlor-site`, NOT this repo** (verified 2026-08-21: there is no `check:social`
> in this package.json and no `scripts/check-social.sh` here), so run it from there. It follows each
> link to its final URL and fails on a bare homepage.
>
> ⚠️ **radlor.com's production domain is the APEX.** `www` 308s to it. Flipping that breaks every
> canonical, because the `@id` above is the apex. Full story + the traps in the 🇺🇸 and 🏗️ blocks.
>
> ---
>
> _(Everything below is the running session history — newest first, most recent ~5 sessions only.
> Older blocks are in [docs/handoff-archive.md](docs/handoff-archive.md), which is NOT auto-loaded —
> `grep` it. This file is inlined into every session's context, so move blocks out rather than
> letting it grow. The craft rules live in chapter-craft.md, not here.)_

> 📐 **2026-08-21 — A TESTER'S FOUR BUGS, THEN EVERY CHAPTER SWEPT FOR RESPONSIVENESS, AND FINALLY THE GUTTHI THIS FILE HAS CARRIED FOR WEEKS: ⚠️⚠️ A `useRef` GUARD WAS FREEZING TEN CHAPTERS' DEMOS — IN DEV ONLY — AND THE EARLIER SESSION'S "IT WORKS ON PROD" RULED IT OUT BACKWARDS.** `tsc` 0 · **1360/1360** (+4) · **267/267 e2e** · `next build` 0 · sw **v127 → v132**. 🔴 Nothing committed.
>
> **The asks:** *"google drive access kar paa rahe ho?"* → tester sheet ke 3 issues → *"pura screen responsiveness check karo"* → *"wo gutthi suljhao"*.
>
> ## ⓪ ⚠️⚠️ THE GUTTHI, SOLVED: STRICTMODE + A `useRef` GUARD = "RUN ONCE" BECOMES "RUN NEVER"
> This file has carried *"why headless cannot drive a storybook chapter's opening is unexplained"*
> since 2026-08-20. It is now named, and it was a REAL BUG rather than a harness limit:
> StrictMode invokes an effect twice (mount → cleanup → mount) and **a `useRef` is not reset in
> between**, so `if (ran.current) return; ran.current = true` starts the narration, CANCELS it on the
> cleanup, and then refuses to start it again. `speakSteps` drives the VISUALS too, so the whole
> chapter freezes on its first beat. **Eleven guards across ten chapters.** Every developer running
> `npm run dev` has been looking at dead demos.
> **Measured, not guessed:** patch `speechSynthesis.speak` in an `addInitScript` and log every
> utterance. Dev produced **ZERO speak calls in 42s**; the identical build on production produced
> **seven** and walked on into the guided round.
> ⚠️⚠️ **AND THE EXPENSIVE HALF IS THE INFERENCE, NOT THE BUG.** The 2026-08-20 block says *"I guessed
> StrictMode's double-mount and the guess was WRONG — the prod run killed it, since StrictMode is
> dev-only."* That is backwards: StrictMode being dev-only is exactly why prod working proves
> nothing about dev. The prod run could only ever have told you whether PROD had the same fault.
> **Before ruling a cause out, ask whether your experiment could have detected it at all.** The wrong
> inference then sat here as a settled finding and kept the question open for weeks.
> Fix: `src/shared/hooks/useOnceGuard.ts` — the flag resets in its OWN cleanup, which runs after the
> guarded effect's and before the re-run; a dep-change re-run still sees the guard set, so
> `StoryWorld`'s `[onDone]` guard behaves exactly as before. Rule written into `chapter-craft.md` §4.
>
> ## ① 🎯 AND THE PAYOFF WAS IMMEDIATE — TWO SHIPPED DEFECTS NOTHING COULD REACH
> Storybook chapters driven into a scored round went **3 of 20 → 11 of 20** (the harness also needed
> one fix: `storybook-pills`' blind driver always pressed `candidates[0]`, i.e. the same wrong answer
> for the whole budget — it rotates now).
> - **Seesaw Park draws its question TWICE** — *"Which sign is right?"*, SkillBeat's pill plus its
>   own 80px below. The exact fault chapter-craft §3 describes, shipped, and unseen because nothing
>   could reach the screen it appears on. Fixed the Shape Studio way: one exported `ASK`, chapter
>   pill only when `mode !== 'practice'`.
> - **Bead Shop 404s on every load** — `milo_beads.png` was never drawn but headed the sprite list,
>   so the picture was always right (fallback) and the console always had an error in it. Removed.
> ⚠️ **§⑦ of the 2026-08-20 block called Seesaw Park CLEAN, from a grep. Corrected in place.** The
> other three (BigOrSmall · HomeTime · PlayTime) really are clean — **and that is now a measurement**:
> `kitchen` passes `storybook-pills`, and HomeTime/PlayTime were driven directly (temporarily started
> in `practice`) and render their prompt exactly once. ⚠️ An intermediate draft of that correction
> claimed they had no beat `prompt`, which was false — the same grep-shaped mistake one layer along,
> recorded because I made it while writing the rule against it.
> **The general lesson: a source heuristic gives a false ALL-CLEAR as readily as a false alarm.**
>
> ## ② 📱 THE RESPONSIVENESS SWEEP — 70 CHAPTERS × 7 SIZES, PLUS THE SCREENS NOBODY GATED
> 320×568 · 390×844 · **640×320** · 768×1024 · 1024×600 · 1280×720 · 1920×1080.
> **Structurally clean: 0 horizontal overflow, 0 unreachable controls, 0 console errors, 0 load
> failures** across every chapter and screen. 63 rotate gates are by design.
> Everything found was TAP-TARGET SIZE, and at the 44px aim it went **683 → 2**:
>
> | | before | after |
> |---|---|---|
> | `‹ Menu` (teen) | 145 | 0 |
> | `← Menu` (story) | 112 | 2 (deliberate) |
> | range sliders 16px | 305 | 0 |
> | `Use taps instead` | 49 | 0 |
> | landing footer 19px | 35 | 0 |
>
> ⚠️ **The 16px sliders are the one `all-chapters` could never have seen** — its selector is
> `button, a[href]`, no `input` — and they are the FIRST control a child meets in all 37 teen
> chapters. One CSS line (`input[type="range"] { height: 44px }`); track and thumb look identical.
> ⚠️ **The two remaining 30px chips are a deliberate refusal.** SliceShop and TickTock derive
> `chromeTop` — the band the whole world stands under — FROM their menu button, so forcing 44 on a
> short frame takes 14px out of the play area, against chapter-craft's rule that height comes out of
> the chrome first. The floor went into `chrome.ts` (`menuBtn.minH`), 44 on a roomy frame where the
> banner already makes the band that tall, unset on a short one. **`chromeTop` before/after is
> byte-identical: short 46, roomy 60.**
>
> ## ③ 🔬 TWO GATES DISAGREEING ABOUT ONE RULE, AND MY OWN SWEEP THAT CHECKED NOTHING
> - **My first tap check failed at 44px and went red on 30 chapters** — while `short-landscape.spec.ts`
>   had already, deliberately, made 24 the hard floor and 44 a NOTE. Both thresholds now come from
>   `personas.ts`. ⚠️ **`all-chapters`' check 4 claimed the 44px floor in a COMMENT and never
>   implemented it** — the most expensive kind of lie, because it stops the next reader checking.
> - ⚠️⚠️ **My first full sweep ran over ZERO chapters and finished green in 20 seconds.** I had
>   rewritten the shipped chapter-derivation with my own regex, which matched nothing. Had I reported
>   then, *"all chapters are clean"* would have been a lie. Fixed to call the same derivation.
> - ⚠️ A `ROTATEGATE` count that moved 63 → 62 was chased rather than shrugged at: driving
>   `bigNumbers` at 768×1024 showed the gate present. It was my sweep's fixed 350ms wait racing
>   `useNeedsRotate`'s effect — which is why the shipped gate uses `.or()` instead.
>
> ## ④ THE TESTER'S SHEET (Chapter_Testing_tester2, 2026-08-20)
> **#1 answer options** — *"How did it go?"* could not be answered *"Yes, on their own"*. Now the
> tester's own wording, one source for both diagnostic surfaces.
> **#3 turtle spacing** — the real one. `FollowTheLeader` called `fitBands` and nothing else;
> `fitBands` says nothing about rows being distinguishable, so at 640×320 with four little ones
> **three rows sat SEVEN pixels apart under a 91px sprite**. Driven before/after: before, only 3 of 5
> numbers were visible; after, all five, two rows 41px apart. `maxSizeForRows` + `spreadBand` (both
> already in `critters.tsx`, both unused here) + rows capped at two. New gate
> `followTheLeaderHuddle.test.ts`, 4/4 planted mutations caught.
> ⚠️ **The DOM lied**: all five tag boxes existed and did not overlap. The numbers were buried by the
> NEAR ROW'S SPRITE, which is what `ROW_SEP` measures — so the invariant was right and a box-overlap
> check would have passed.
> **#4 star popup** — heading and body both said *"Amazing!"*. Founder chose the tester's wording and
> then dropped the 3-star heading entirely. ⚠️ Verifying it found a shipped bug nobody reported:
> **the celebration modal is 697px tall and `align-items: center` CLIPS an overflowing child**, so at
> 640×320 its top **189px — Milo and the whole message — were off screen with no way to scroll back**.
> `margin: auto` + `overflowY: auto` + vh-capped decoration: 0px clipped, all three buttons reachable.
> **#2 (Milo's robotic voice) is still open** — that is 3–11 recorded clips, a real piece of work.
>
> ## ▶ OPEN
> 1. 🔴 **NOTHING FROM THIS SESSION IS COMMITTED**, and there is still no backup of the children's data.
> 2. **9 storybook chapters still do not reach a scored round** — but that is now a HARNESS limit (the
>    blind driver does not know the answers), not an unexplained hang. Tractable.
> 3. **Google Cloud: `admin@radlor.com` is still only EDITOR, not OWNER** (carried forward from the
>    archived 🏗️ block so it is not lost). Never delete the OAuth client — 5 users.
> 4. **The tester sheet's status column is NOT updated** — the Drive connector can rename/move/share
>    but cannot write cells, and no Sheets connector is in the registry. Needs a browser pass.
> 5. Everything from the blocks below still stands.

> ❓ **2026-08-20 — THE QUESTIONS, SWEPT ACROSS EVERY CHAPTER WITH A PURE MODULE. THREE CHAPTERS WERE PRINTING THEIR OWN ANSWER — AND ALL THREE WERE THE SAME FAULT: A DEGENERATE DRAW, NOT A BADLY WRITTEN SENTENCE. ⚠️ THE INSTRUMENT WAS WRONG FIVE TIMES BEFORE THE APP WAS WRONG THREE.** `tsc` 0 · **1356/1356** (+163) · `next build` 0 · 20 planted mutations caught, 5 proven inert · sw **v125 → v127**.
>
> **The ask:** *"check that the questions in all the chapters are correct and make sense… crystal clear… just do the proper deep test"*.
>
> ## ⓪ ⚠️⚠️ THE ANSWER EQUALS A GIVEN — 25% OF THE EMPTY PLOT'S EASIEST ROUNDS
> The new gate is `src/__tests__/questionQualitySweep.test.ts`: ONE file applying `chapter-craft.md`
> §0a/§0b **horizontally**, to all nine chapters that own a pure module. Every 9–11 chapter already
> has a 50-test gate and they are all VERTICAL — each knows its own chapter deeply and nothing about
> its neighbours', which is precisely the doc's own complaint (*"most of those rules were learned in
> chapter 1, forgotten, and re-learned the hard way in a later chapter"*).
>
> | chapter | the degenerate draw | rate | what the child reads |
> |---|---|---|---|
> | **The Empty Plot** | `depth === frontage` — a SQUARE plot | **25% of L1**, 16.6% L2, 14.2% L3 | *"4 metres along the road, and 16 tiles to use up"* → answer **4** |
> | **The Mission Brief** | `q === b` — a SQUARE division | **16.0% of ÷**, 9.6% of ×then−, 1.0% of − | *"25 bolts shared equally into 5 racks"* → answer **5** |
> | **Factor Lab** | `k === base` — base × base | **14.4% of ×** | *"a crate holds 8"*; the miss line is *"keep counting up in 8s"* → answer **8** |
>
> **In none of them is the answer stated AS the answer.** It is a GIVEN that happens to equal it, so
> a child copies a number off the screen and is right without doing the operation the chapter exists
> for. The Empty Plot is the sharpest — one tier-1 round in FOUR — and `plotMaths`' own comment
> already said *"NEITHER may name the depth, however helpfully: it is the whole question"*. It was
> broken by ARITHMETIC rather than by wording, which is why it survived a 74-test gate.
> ⚠️ The Mission Brief case also collapses that chapter's stated design — *"every distractor is the
> answer you would get from the wrong operation"* — because over a THREE-choice pad, "copy a number
> you can see" beats deciding which operation it is.
> **All three fixed in the GENERATOR, one redraw each, never a reworded sentence — the sentences were
> right.** Measured after: 0.00%, 0.00%, 0.00%.
>
> ## ① 🟰 TWO COINCIDENCES DELIBERATELY LEFT, BOTH MEASURED
> **The Pizza Counter collides on 34.7% of `match` rounds** (the answer is a count of slices, the
> givens are two denominators) and it STAYS. Tier 1 is match-only over three pairs, and `[2, 4]` —
> half a pizza against quarters — collides on its ONLY numerator: that is the single most canonical
> equivalence in the chapter, and deleting the best worked example to close a coincidence is a bad
> trade. ⚠️ **It is also the harmless DIRECTION:** it can only make a guess luckier, never make a
> correct method wrong — unlike The Height Bar's `4 × 12 = 48` landing on a posted limit of 48, which
> manufactures a wrong answer and is gated. **Ask which way the collision runs before removing
> anything.** Same call for Slice Shop's miss line naming the friend who went without: that is the
> chapter's whole argument (a denominator is how many people are waiting), not a proximity hint.
>
> ## ② 🔬 THE INSTRUMENT WAS WRONG FIVE TIMES BEFORE THE APP WAS WRONG THREE
> Every one looked exactly like a defect on first read:
> - *"no reachable input grades true"* on **every** Coin Tray round — I had read the pad as the answer
>   surface, and the answer is a PAIR of wells; the pad is one DIGIT of it.
> - *"Set the bike ramp to exactly 85° names the answer 85"* — naming the figure IS the ask there,
>   exactly like a coin-tray `make` round.
> - `plotMaths` has no `answer` field (the answer is `depth`; `target` is the load) and `cargo` has no
>   `spoken`. **`tsc` caught both** — the probe was typed against the real modules, which is the only
>   reason those two took seconds instead of an hour.
> - The Loading Bay's *"There are only 4 stacks — hold up 1, 2, 3 or 4"* names the answer **and every
>   other option**: it restates the pad. Singling one out is the leak; listing them all is the
>   instrument.
>
> ## ③ ⚠️⚠️ AND THE SWEEP'S OWN WORST BUG: Q1 WAS A TAUTOLOGY
> *"Every question is answerable"* read `r.accepts` straight off the round instead of driving
> `graded`, so it compared the data with itself. **A planted grader that refuses the answer 3 walked
> through a green sweep.** Every `accepted` now drives the chapter's own grader, and the re-planted
> mutation fails. Found by mutation, not by reading — the repo's own rule, met again.
> ⚠️ Two mutations survive and BOTH are proven inert rather than holes: a hot/cold miss line in
> Factor Lab (its `missFor` does not receive the guess, so it structurally cannot leak it — stronger
> than any check; the same mutation in The Empty Plot, which DOES receive it, is caught by two rules
> at once), and an off-by-one Coin Tray grader (caught by `coinTrayDecimals.test.ts`, which is where
> grader correctness belongs). **The sweep owns horizontal question quality; the per-chapter gates own
> vertical correctness, and that division is demonstrated rather than assumed.**
>
> ## ④ WHAT IS AND IS NOT COVERED — stated honestly
> - ✅ **9 chapters swept** (8 × 9–11 + Slice Shop, 6–8): answerable · nothing pre-answer names the
>   answer · no miss line or redirect names it · a miss does not narrow with the guess · no malformed
>   string · the answer surface is not a coin flip.
> - ✅ **37 teen chapters** already have `e2e/question-quality.spec.ts` (structural, browser-driven).
> - ⚠️ **I wrote here that the 24 storybook chapters were unreachable. That was WRONG — see ⑤.**
>   They needed an `export` keyword, not an extraction, and 21 of the 24 ids are now swept.
>
> ## ⑤ 📚 …AND THEN THE 24 STORYBOOK CHAPTERS WENT IN TOO — I HAD CALLED IT IMPOSSIBLE AND IT WAS A MISSING `export` KEYWORD
> §④ above concluded *"no gate can reach their question text at all"* and **that was wrong**. Founder:
> *"What we can do for this?"* — so I measured instead of planning. **A story `.tsx` imports perfectly
> well under vitest and `beat.make()` / `beat.say()` both run.** The blocker was 22 module-scope
> declarations that happened not to say `export`. Sized before touching anything: 14 factories + 2
> `const BEAT` + 3 `WORLDS` arrays + 3 interfaces = **22 one-word edits**, plus 4 pure functions each
> in BeadShop and RainbowTown (whose beats are built in a `useMemo` from component state, so their
> module-scope GENERATORS are driven instead of the beat being lifted). No behaviour changed.
> ⚠️ **THE CLAIM WAS WORTH LESS THAN THE MINUTE IT TOOK TO TEST IT**, and it had already been written
> into this file as a finding. Same family as *"a source check written BECAUSE the thing cannot be
> driven — that inability is the finding"*: the inability has to be MEASURED, not assumed.
>
> **`src/__tests__/storybookQuestions.test.ts` — 87 tests over 28 chapter × world combinations.**
> ⚠️ **`prompt` AND `say` ARE CHECKED SEPARATELY, and the first draft got that wrong.** Sweeping
> sentence case over BOTH flagged Market Day's *"two pens of four ducklings. How many in all?"* and
> Bead Shop's chant *"red, blue, red, blue… what bead comes next?"* — both SPOKEN, where case is
> inaudible and the lower-case chant is the point. A rule that fires on correct copy gets deleted, so
> it moved to the channel it is about: shape rules on the drawn line, malformed-text rules on both.
>
> **Found, and fixed: Shape Studio punctuates the same pill two ways** — `'How many sides?'` ends its
> sentence and `` `Tap the ${target}` `` did not, in one chapter, on one surface, across 12 shapes.
> Every other chapter's drawn prompt ends with punctuation.
>
> ## ⑥ ⚠️ THE REAL GAP IS **THREE** CHAPTERS, NOT TWENTY-FOUR — AND IT IS NOW NAMED
> Block Yard (both ids), Building Blocks and Coin Shop set `prompt: () => ''` — correctly, per *"TWO
> PILLS SAYING THE SAME THING IS A DUPLICATE"* — and carry no `say`. Their round data is numbers
> only (`{slot, a, b, answer, regroup}`), so **the sentence a child reads is assembled inside the
> component's JSX and nothing can reach it.** `BANNER_OWNED` names those four ids and the gate
> asserts the list EXACTLY, not as a floor: a chapter that stops stating its question is a chapter
> that stopped asking one. The fix for each is to lift its banner sentence into a module function —
> `cargo.instructionFor`'s shape — and it is now three small jobs instead of a band-wide unknown.
>
> ## ⑦ 🖼️ AND THE DEPLOY FOUND ONE MORE — TWO PILLS, VISIBLE ONLY ONCE THEY AGREED
> Verifying the Shape Studio punctuation fix on **production**, the screenshot showed the sentence
> TWICE: *"Tap the triangle!"* in SkillBeat's replay pill and *"Tap The Triangle!"* 21px under it in
> the chapter's own (`text-transform: capitalize`). Confirmed in the DOM, on the live host.
> ⚠️ **IT HAD SHIPPED FOR MONTHS AND THE PUNCTUATION FIX IS WHAT EXPOSED IT.** The two copies had
> DRIFTED — the beat said *"Tap the triangle"*, the pill said *"Tap The Triangle!"* — different
> enough to read as a heading above a question. Making them identical made the pair obvious.
> **A sentence written in two places is the fault; the duplicate pill is only the symptom.**
> Fixed properly: `promptFor(d)` exported and called by BOTH, and the chapter's own pill renders only
> when `mode !== 'practice'` — the guided round runs OUTSIDE SkillBeat, so there it is the only pill
> and stays. SkillBeat's is the one worth keeping: a tap on it replays Milo's voice, the chapter's is
> `pointerEvents: none`.
> ⚠️⚠️ **THIS PARAGRAPH USED TO SAY THE OTHER FOUR WERE CLEAN "AND CHECKING COST ONE GREP". THE
> GREP WAS WRONG ABOUT SEESAW PARK — CORRECTED 2026-08-21**, after that chapter was driven into a
> scored round for the first time (which only became possible once the StrictMode `useRef` guard was
> fixed, see the 2026-08-21 block) and drew *"Which sign is right?"* **TWICE**: SkillBeat's pill and
> its own, 80px apart. It gives its beat a real `prompt` AND rendered its own pill unconditionally.
> Fixed the same way Shape Studio was — one exported `ASK`, and the chapter's pill only when
> `mode !== 'practice'`. So Shape Studio was NOT "the only one with no guard": there were two.
> ✅ **The other three ARE clean, and this time that is a MEASUREMENT, not a grep.** BigOrSmall
> (`kitchen`) is covered by `storybook-pills` and passes; HomeTime and PlayTime cannot be reached by
> that spec's blind driver, so they were driven directly (temporarily started in `practice`) and each
> renders its prompt exactly ONCE, inside SkillBeat's pill. ⚠️ All three DO have non-empty beat
> prompts — an intermediate draft of this correction claimed they did not, which was wrong and is
> recorded here because it was the same grep-shaped mistake one layer along.
> **The general lesson this entry originally missed: a source heuristic gives a false ALL-CLEAR as
> readily as a false alarm.**
> ⚠️ **No gate can see this class** — both halves are individually correct and the duplication is a
> property of the rendered DOM. `S4` pins the one chapter that had it; the general case needs an eye,
> or a live drive that counts pills.
>
> ## ⑧ ✅ BOTH OPEN ITEMS CLOSED — ONE CLEANLY, ONE WITH A LIMIT WORTH KNOWING
> **(a) The three JSX-only chapters are reachable now.** Block Yard, Building Blocks and Coin Shop
> each got an exported `askFor(...)` that the component's own banner calls, so the sentence exists in
> ONE place and a gate can read it — without touching what renders, and without giving their beat a
> prompt (which would have put a second pill on screen, the very fault §⑦ was about). Coin Shop
> already had one. **All 25 storybook chapter ids are now swept; the gap is closed, not narrowed.**
> ⚠️ Building Blocks' banner read `note || (isMake ? 'Make the number on the order' : ASK[kind])` —
> and `ASK.make` IS `'Make the number on the order'`, so the ternary was a second copy of a string
> the map already held. Now `note || askFor(data)`.
> ⚠️ **AND THE FOUR BANNERS ARE EXEMPT FROM THE SENTENCE-SHAPE RULE, measured rather than assumed.**
> All 21 pill prompts end their sentence; all FOUR banners do not (*"Ten ones make one rod"*, *"Make
> the number on the order"*…). A rule that fires on an entire coherent group is wrong about that
> group — a pill is a question and closes it, a banner is a standing instruction strip. Coin Shop
> would have been actively wrong to "fix": its `ASK` strings are composed into a spoken sentence that
> appends its own full stop, so punctuating the map gives *"Count that out for me.."*.
>
> **(b) `e2e/storybook-pills.spec.ts` counts the pills on a live screen** — anchored on
> `button[aria-label="Hear it again"]`, which is SkillBeat's pill and exists only in a scored round.
> **Proven: with the Shape Studio regression planted it fails with the exact diagnosis** — *"Tap the
> triangle!" is drawn 2 times — SkillBeat's pill plus 1 more at y=76 (text-transform: capitalize)*.
> ⚠️⚠️ **IT IS NOT A PER-COMMIT GATE AND MUST NOT BECOME ONE.** Driving a storybook chapter into a
> scored round means sitting through a self-paced intro, showcase, demo and guided round with no
> voice to pace them, and headless Chromium cannot reliably get there: `solids` reached a round on
> one run and not the next, and **`shapes` never reached one in 120s against the dev server OR
> against production**, sitting on a showcase whose own timers are a deterministic 9.5s.
> ⚠️ **I guessed StrictMode's double-mount and the guess was WRONG** — the prod run killed it, since
> StrictMode is dev-only. Recorded because the next person will guess the same thing.
> So the spec **SKIPS rather than fails** when it cannot reach a round: it may only ever go red on a
> real duplicate. `afterAll` prints which chapters were actually covered, because a run where
> everything skips checked nothing and would otherwise pass in silence.
>
> ## ⑨ ⚠️⚠️ "NOW EVERYTHING IS FIXED?" FOUND ANOTHER ONE — FIFTH SESSION RUNNING
> Asked after ⑧ was reported done and green. The answer was no, and the thing it found was **in the
> file I had just fixed**: I changed RENDERING code (Building Blocks' banner) and verified it with
> unit tests only. Driving it on screen took two minutes.
>
> **The banner reads *"Make twenty-three. Tens on the left, ones on the right."* — built inline in the
> round's effect — while the `askFor` I had just exported returned `ASK.make`, *"Make the number on
> the order"*.** The note overrides the banner 400 ms in, so `ASK.make` is text **no child has ever
> seen**, and the gate was reading it while calling the chapter covered. ⑧'s claim that "all 25 ids
> are swept" was true of the function and false of the screen.
> ⚠️ **CoinShop had already written the rule down and I did not read it**: `openerFor` composes
> `askFor` because the line is *"both spoken and written, and those two drifting apart is how a
> chapter narrates one thing while the screen says another"*. Building Blocks is now the same shape —
> `askFor` owns the make sentence, the effect speaks `askFor(data)`, the banner writes it — and the
> gate reads the same string the screen shows (verified against a live screenshot, both
> *"Make twenty-three. Tens on the left, ones on the right."*).
> ⚠️ **The drift itself is invisible to every content rule in the file**, because both strings are
> well-formed. `S5` pins the SHAPE instead: no `say(\`Make ${…}\`)` at a call site. Mutation-tested.
> ✅ Checked the other two while there: **CoinShop is clean** (it composes), and **Block Yard has no
> per-round question by design** — but its step coaching (*"Not enough ones left. Tap a rod…"*) is
> still built inline and no gate can reach it.
>
> ## ▶ OPEN
> 1. **Block Yard's step coaching is unreachable** — the same category as a `missFor`, which IS gated
>    in all eight 9–11 modules. The last of this class.
> 2. ✅ **CLOSED 2026-08-21 — and it WAS a product bug, contrary to this line.** *"Why headless cannot
>    drive a storybook chapter's opening"* was a StrictMode `useRef` guard freezing the demo in dev.
>    See the 2026-08-21 block ⓪. The claim below that it is *"not a product bug — the chapters play
>    fine in a real browser and on production"* was true of PRODUCTION and false of dev, which is
>    exactly the inference that kept it open.
> 3. ⚠️ **The lesson, five sessions running: the part that was BUILT gets verified, the part that was
>    RENDERED gets assumed.** Every time this question has been asked it has found something, and
>    every time it was in something already reported as done.
> 2. Everything from the 🎚️ block below still stands.

> 🎚️ **2026-08-20 — THE ADAPTIVE LOOP, DEEP-TESTED. ⚠️ `GameShell` WAS SERVING EVERY QUESTION AT A TIER THE ENGINE HAD ALREADY LEFT, AND THE ENGINE'S OWN TESTS WERE GREEN THE WHOLE TIME. PLUS: THE RE-TEACH SEEN FIRING FOR THE FIRST TIME, AND EVERY BAND NOW RESUMES AT THE TIER THE CHILD LEFT OFF ON.** `tsc` 0 · **1193/1193** (+58) · `next build` 0 · **18/18 planted source mutations caught** · sw **v124 → v125**.
>
> **The asks:** *"deep testing … adaptive system proper kaam kar raha hai / re-explanation aa raha hai / difficulty ke according aa raha hai"* → *"level persistent hai naa?"* → *"sab mein waise chahiye"* + sync.
>
> ## ⓪ ⚠️⚠️ THE STALE-CLOSURE TIER — ONE QUESTION LATE, IN 52 OF 61 CHAPTERS
> `submit` schedules the next `loadTask` on a **1650 ms timer**, so the callback it captures belongs
> to the render the ANSWER was given in — i.e. `ada.difficulty` *before* `ada.record()` moved it.
> Every promotion and every demotion therefore landed **one question late**. Measured live on
> `/teen-preview?c=integers`: **engine said tier 2 while the question served was tier 1**, then 3
> while 2 was served. The price is exact, because the round budget is only six questions long: a
> child who mastered the chapter met **ONE** top-tier question instead of the two
> `chapter-craft.md` promises. After the fix the same drive serves `1,1,1,2,3,3`.
> **`SkillBeat` never had it** — it reads `adaRef.current.difficulty`, a live ref. The fix makes
> GameShell do the same (`useLatestRef`).
> ⚠️ **THE LESSON: this is "a unit test cannot see that nothing calls the unit", one layer along.**
> The unit WAS called — with a stale argument. `progression.test.ts` had six green tests on the rules
> and could not see either shell fail to ASK. **A rule engine needs a gate on the CALLER's argument,
> not only on the rule.**
>
> ## ① THE RE-TEACH FIRES — SEEN, FOR THE FIRST TIME
> This file has carried *"the re-teach has never been seen fire anywhere in the band"* for days.
> Driven to 3 consecutive misses it fired on **`integers`** (12–14, 2 work lines) and on
> **`decimals` / The Coin Tray** (9–11, 4 lines). It is reachable everywhere: gated that every live
> chapter plays ≥ `RETEACH_AFTER` rounds, derived from the `STORY_CHAPTERS` table so the list cannot
> fall behind. ⚠️ The dead `world1` World ships four beats at `rounds: 1`/`2`, where a re-teach is
> **structurally unreachable** — nothing imports it; worth deleting.
> ⚠️ **Difficulty of the re-teach is right by ORDERING, and that is worth knowing:** demote fires at
> **2** misses, re-teach at **3** — so the round being re-explained was already built one tier down.
> ⚠️ **One outlier, since FIXED — see ⑤.** The Angle Shop's scored `work` was
> `[r.ask, 'Judge it against the square corner.', 'Then set it and see.']`: measured, only **1 of 3
> lines varied**, so a child who had missed three in a row got the question read back at them.
>
> ## ② 🌟 STARS AND THE TOP TIER — YOUR RULE ALREADY HOLDS, BUT ONLY BY ACCIDENT
> `calcStars(correct, wrong)` is **pure accuracy** (≥85% → 3) with **no difficulty term in it at
> all**. Swept EXHAUSTIVELY (1024 patterns × 10 rounds, 256 × 8, at every resume tier): **zero**
> patterns earn 3 stars without at least one correct top-tier answer. The founder's own case — six
> straight from easy → mastery → 3 stars — meets the top tier **twice** (it was **once** before ⓪).
> ⚠️ It works out only because you cannot reach 85% without being promoted along the way. Move the
> promote rule, the star threshold or the round count and it breaks **silently**, so it is now gated:
> loosening the star threshold to 60% fails 4 tests, making promotion need a streak of 5 fails 7.
>
> ## ③ 🎚️ EVERY BAND NOW RESUMES — THE OLD 3–11 RULE IS REVERSED
> Founder's call: *"sab mein waise chahiye"*. Before this, **34 of 61 chapters never resumed**:
> `SkillBeat` called `useAdaptive(beat.skillId)` with one argument, and `resumesTier('9-11')` was
> hard-coded false. Both now resume; `chapter-craft.md`'s rule was rewritten rather than deleted, and
> ⚠️ **"if a chapter looks too hard on question 1, the tier IS now a suspect" — that is new.**
> Verified on screen: The Coin Tray seeded at tier 3 opens with *"You left off at Champion ⭐⭐⭐.
> Want a quick warm-up first?"* — the warm-up (two questions one tier down) is what makes resuming
> safe for a nine-year-old, and it comes free from the shell.
>
> ## ④ 🗄️ THE TIER NOW FOLLOWS THE CHILD ACROSS DEVICES — AND NEEDED NO NEW COLUMN
> It was device-local (IndexedDB `kv`), so a second device or a cleared browser put every chapter
> back to easy and nothing in the app could tell. ⚠️ **`learner_progress.current_level` (smallint NOT
> NULL DEFAULT 1) has existed since the base schema, written by nothing and read by nothing** — every
> other `current_level` in the app is `learner_stats.current_level`, the XP level, in a different
> table. Measured on prod: **29 rows, all 1**. So the migration reuses it and adds no column.
> ⚠️ **`sync_session` gets an 11-argument version and the 10-argument one stays as a FORWARDER.** A
> defaulted 11th argument would leave a 10-named-argument call ambiguous (PostgREST resolves by
> name), so a browser still holding the previous JS bundle would start failing its sync mid-deploy.
> ⚠️ **The merge is LAST WRITE WINS, never GREATEST.** Stars and XP are achievements and stay
> monotonic; a tier is a CURRENT FIT, and a child who has struggled back down to easy must not be
> handed tier 3 again by a monotonic merge. Same reason `hydrateChapterLevels` seeds a device only
> where it holds **nothing** — a local demotion made offline is the freshest answer there is.
>
> ## ⑤ 📐 THE ANGLE SHOP'S RE-TEACH IS A REAL EXPLANATION NOW, AND THE DEAD `world1` IS GONE
> **`angles.ts` gained `explainBeats`** — the module owned every other word the chapter says and not
> this one, which is exactly how the chapter ended up assembling `work` in the scene as
> `[r.ask, 'Judge it…', 'Then set it and see.']`. Four worked lines per round type: a **degrees**
> round names the gap, divides it by `STEP` and counts the taps (*"That is 75° to travel, and one
> turn moves it 5° — so 15 taps to open it. Count them in 5s: 25, 30, 35… up to 100."*); a **kind**
> round places 90° first, then says which side of it and why the start angle was not it; a **fold**
> round names the mirror rule, the count, and WHERE the lines run.
> ⚠️ **`FOLD_WHERE`'s rectangle line names the misconception out loud** — *"NOT corner to corner:
> fold a rectangle on its diagonal and the halves miss"* — because `candidateAxes` deliberately puts
> the diagonals on the bar. Its entries agree with `SHAPE_LINES` and the gate checks that, the same
> rule `PAPER` already carries.
> ⚠️ **TWO CONCATENATION FAULTS IN MY OWN FIRST DRAFT, BOTH CAUGHT BY READING THE OUTPUT, NEITHER
> BY A TYPE OR A GATE:** `${cap(piece)} has to be … , because ${because}` gave **"because or every
> shot goes wide"** (two of the five reasons are *"or …"* clauses, which read correctly only after the
> ask's em-dash), and `They run ${FOLD_WHERE[shape]}` gave **"They run just the one"** for the
> isosceles. Same family as *"hold up it"* and *"0 pennyies"*, third time recorded. **One verb cannot
> serve six shapes — write them out.** Fixed by removing the glue, not by rewording the strings.
> ⚠️ **And the count could run PAST its own target.** A fixed two-steps-then-ellipsis prints
> `85, 90, 95… up to 90` on a one-tap gap. `startFor` keeps the gap at `START_GAP`, so it cannot
> happen today — **that is the generator's choice, not this function's guarantee**, so the ellipsis
> now appears only when something is left to elide, gated across the whole reachable lattice
> (31 × 31 start/target pairs) rather than on sampled draws.
>
> **`world1` DELETED** — the five-scene "Milo's Picnic Party" World plus its `doorBeat`,
> `basketBeat`, `compareBeat` and `orderBeat`. 995 → 766 lines. **Nothing imported it**; all four
> skills have real chapters now (NestTree · HomeTime · BigOrSmall · FollowTheLeader), and all four
> beats declared `rounds: 1` or `2`, so each carried a `Reteach` that **could never be shown** and a
> difficulty that could never be promoted. ⚠️ Verified the deletion orphaned nothing: eslint's
> unused-symbol list is byte-identical before and after once the 8 imports it stranded were removed
> (the 8 that remain — `CATCH_INTRO`, `CountBadge`, `PerchedItem`, `spotsFor`, `speakSeq`,
> `Difficulty`, `useMemo`, `counted` — were **already** dead before this session and are left alone).
> ⚠️ **It did strand five art exports** — `DoorArt`, `Berry`, `Stone`, `CountStage`, `COUNT_LABEL`
> now have zero references outside `art.tsx`. **Left deliberately:** an unused export in a component
> library is tree-shaken and carries no lie, whereas `world1` carried unreachable pedagogy. Deleting
> drawn art nobody asked for is the riskier move.
>
> ## ▶ OPEN
> 1. 🔴 **NOTHING IS COMMITTED.** ✅ The migration IS applied to prod and verified (§④) — so the app
>    can deploy whenever. There is still no backup of the children's data.
> 2. Five orphaned art exports in `art.tsx` (§⑤) — delete only if you want the library tidy.
> 3. Everything from prior sessions stands unchanged.

> 🔗 **2026-08-20 — THE SOCIAL HANDLES ARE WIRED INTO `sameAs`, THE FOOTER AND `llms.txt` FROM ONE LIST — AND THE OBVIOUS WAY TO DO IT WOULD HAVE TOLD EVERY ANSWER ENGINE THAT RADLOR IS FACEBOOK. ⚠️ ALSO: THE GITHUB ORG WAS RENAMED UNDER US AND BOTH REMOTES WERE STILL POINTING AT THE OLD NAME.** `tsc` 0 · `next build` 0 · `check:social` 6/6 · IndexNow 10/10 · `learn`@`0e3c396` · `website`@`5d05d1e`. No sw bump — no app code changed.
>
> **The asks:** *"subdomains add kiye phir bhi site can't be reached"* → *"toh phir yeh sabko bhi add karo main website mein for SEO and GEO"* → *"github aur facebook ka kya hua dekho"* → *"add the profile README in RadlorInc"* → *"dono repos commit karke push kar do"*.
>
> ## ⓪ ⚠️⚠️ THE VANITY FORWARD IS THE RIGHT DESIGN AND THE WRONG `sameAs`, AND THE DIFFERENCE IS INVISIBLE IN THE PANEL
> The founder set up `facebook.radlor.com` / `instagram.radlor.com` / `x.radlor.com` /
> `linkedin.radlor.com` as GoDaddy 301s and asked for them on the site. Putting those strings
> straight into `Organization.sameAs` is one line and would have been **worse than the empty array
> it replaced**: every forward's destination was the platform's **HOMEPAGE**, so a crawler following
> `facebook.radlor.com` lands on `facebook.com/` and corroborates **Facebook** as the entity named
> Radlor. Measured, all four: `→ https://www.linkedin.com/`, `→ https://www.instagram.com/`,
> `→ https://x.com/`. ⚠️ **In the GoDaddy table a homepage forward and a profile forward look
> IDENTICAL** — same "Permanent (301)", same green row.
> **The design was kept and gated instead of abandoned**, because the founder's instinct is right:
> our own forwards mean a handle change is a DNS edit, not a deploy. **`scripts/check-social.sh`
> (`npm run check:social`) follows every URL in `SOCIAL` to its final address and fails on a bare
> host.** It caught all four on the first run, and went green only after the destinations were fixed.
> ⚠️ **It checks WHERE a link goes, never WHOSE the profile is** — `instagram.com/radlor` is an
> unrelated account with 818 followers, so a human confirms each destination once.
>
> ## ① 🕳️ THE GITHUB ORG WAS RENAMED AND NOTHING SAID SO
> Probing for a GitHub profile to add, `api.github.com/orgs/RadlorMain` returned **404** — as did
> `/users/RadlorMain`, while `github.com/RadlorMain/learn` still worked. It had been renamed
> **`RadlorMain` → `RadlorInc`**; repo ID `1248492657` is unchanged, which is how the repos kept
> resolving. **Both git remotes were still on the old name in both repos.** GitHub 301s a renamed
> org only until somebody else claims the name, and then every push breaks. Re-pointed and verified
> with `git ls-remote` (not with a settings page — see 🏗️ §①).
> ✅ **And the webhook survived**, confirmed the way this repo learned to confirm it: pushed once and
> read the deployment back off the Vercel API — `githubCommitOrg: RadlorInc`, sha `0e3c396`,
> production. Repo ID is what Vercel routes on, so a rename is safe where a *disconnect* is not.
> ⚠️ **`handoff.md` named `RadlorMain` in five places and is auto-loaded into every session** — the
> most expensive place to leave a stale fact, because the next session reads the remote out of the
> header and trusts it. Fixed; the two historical mentions are annotated rather than rewritten.
>
> ## ② WHAT SHIPPED ON THE SITE
> One list (`SOCIAL` in `site.ts`) feeds three surfaces, so they cannot disagree:
> - **`Organization.sameAs`** — six profiles. The strongest GEO signal available, and it was empty.
> - **A visible footer row** (`rel="me noopener"`). ⚠️ **A schema-only claim is the weaker half** —
>   the same reason the app links back to radlor.com visibly rather than only in JSON-LD.
> - **`llms.txt` → `## Profiles`**, generated from the same array. *"These are the only accounts
>   Radlor operates"* is a **disambiguating** claim here, not a directory listing, precisely because
>   `instagram.com/radlor` is someone else's.
>
> **`github.com/RadlorInc` now has a profile README** (`RadlorInc/.github` → `profile/README.md`).
> That page is what a model lands on when it follows that `sameAs`, and it held nothing but two
> repos. It leads with the three facts most often got wrong here — **Radlor** the company,
> **AdaptiveLearn** the product, **Milo** the character — plus the on-device camera claim.
>
> ## ③ ⚠️ FACEBOOK'S FORWARD HAS NO CERT, AND THE SYMPTOM LOOKED LIKE A BROKEN DEPLOY
> The founder's report was Chrome's *"This site can't be reached"*. DNS was fine and HTTP 301'd
> correctly; **only 443 was dead**, because GoDaddy has two forwarding pools and that row sat on the
> non-SSL one — `3.33.152.147` / `15.197.142.173`, TTL **600**, port 443 closed, against the other
> three on `3.33.251.168` / `15.197.225.128`, TTL 3600, 443 open. Chrome auto-upgrades to HTTPS, so
> it hit the dead port. **Still not issued after a full day**, so Facebook alone ships as its raw
> profile URL — a dead `sameAs` entry is worth less than none. Swap it back when `check:social`
> passes on it.
>
> ## ④ 🔬 THE INSTRUMENT WAS WRONG TWICE, AND BOTH TIMES IT LOOKED LIKE THE SITE WAS
> - Verifying the live footer, `grep -c 'rel="me"'` returned **0** on a page that was serving all
>   six links — the attribute is `rel="me noopener"`, so the quoted match could never hit. **A
>   background watcher armed on the same string never fired.** Nearly reported a working deploy as
>   broken.
> - Checking the reciprocal links (the profile's own website field, which is what confirms `sameAs`
>   from the other side), five of six returned no `radlor.com` — but **LinkedIn served 1,529 bytes
>   and Facebook 1,542**, i.e. login walls, and Instagram a 610 KB JS shell. **Only GitHub is
>   verifiable from here** (`blog=radlor.com`). Reported as unverifiable rather than as missing —
>   the 🛡️ block's *add a control before believing any probe*, met again.
>
> ## ▶ OPEN
> 1. **Crunchbase is the last missing `sameAs` entry**, and it is the direct counter to §③ of the
>    🇺🇸 block: Google answers "radlor" with a radler and **RADLOR LIMITED, dissolved June 2026**.
>    LinkedIn + GitHub + Crunchbase are three live structured records against one dead one.
> 2. **The reciprocal half is unverified on five platforms.** The founder set the website field on
>    each; nothing here can confirm it. One logged-out browser pass closes it.
> 3. `facebook.radlor.com`'s cert (§③) — cosmetic, `check:social` will announce it.
> 4. **Everything from prior sessions stands unchanged:** no backup of the children's data ·
>    `SUPABASE_SERVICE_ROLE_KEY` · Vercel Pro · custom SMTP · `DRAFT = true` · AR never driven with
>    a real hand · 146 eslint errors (was 132; re-measured 2026-08-21) · `support@radlor.com` may still have no mailbox.

> 🇺🇸 **2026-08-19 (fourth pass) — THE MVP AUDIENCE IS THE US, AND EVERY PUBLIC STRING IN BOTH REPOS WAS BRITISH. 64 "maths", ZERO "math". PLUS: radlor.com IS LIVE AND INDEXED, SEARCH CONSOLE + BING + INDEXNOW ARE WIRED, AND THE SUPABASE REGION MIGRATION HAS A RUNBOOK.** `tsc` 0 · **1135/1135** · `next build` 0 · sw **v123 → v124** · `main`@`c6d0252`.
>
> ## ⓪ ⚠️ "maths" IS THE WRONG KEYWORD FOR THE AUDIENCE WE ARE ACTUALLY LAUNCHING TO
> Founder, mid-session: the MVP is entirely US. Measured before touching anything: **64 lowercase
> `maths` and zero `math`** across both repos' copy, `locale: en_IN`, `priceCurrency: INR` in three
> places. A US parent searches *"math app for kids"* — so every title, description and `llms.txt`
> was optimising for a string Americans do not type, and the whole site read as non-US to an answer
> engine.
>
> Swept with a case-sensitive `\bmaths\b`, which **deliberately cannot match `plotMaths`** — that is
> a module name, not copy. Verified after: 0 remain, `plotMaths` intact in all 5 references. The 5
> test files asserting on the string were swept with the source so the suite stays honest.
>
> ⚠️ **TWO THINGS DELIBERATELY NOT SWEPT, AND THE SECOND IS NOT A SPELLING QUESTION AT ALL:**
> - **`colour`, 31 in `src/features`** — measured, **15 are code identifiers** (`COLOURS`, `colourOf`)
>   and 16 are prose. A blind script renames identifiers, which is the fault this repo already has a
>   rule about. Needs the halves separated by hand.
> - **`metre`, 180** — this is **CURRICULUM**. US schools teach customary units alongside metric and
>   the app already uses inches in 191 places (The Height Bar). Changing metres to feet changes the
>   arithmetic in every area/perimeter chapter, its generators and its gates. **Recommended: leave
>   it.** Metric is taught in the US; these chapters are British-leaning, not wrong.
>
> ## ① ⚠️⚠️ I TRIPPED VERCEL'S BOT PROTECTION WITH MY OWN POLLING LOOP — THE SAME FAULT THIS FILE ALREADY RECORDS
> Polling both origins with `curl` every 15 s for ten minutes to watch a deploy land put my IP behind
> **"Vercel Security Checkpoint"**, and I briefly read that as a broken deploy. It was not: the
> deployment was `READY`, and a **real browser passed the challenge in about a second** — verified,
> so no user was affected. The previous session's block records me doing exactly this and I did it
> again. **Confirm a deploy through the Vercel API (`list_deployments`), not a curl loop**; if you
> must poll, 20 s+ intervals.
>
> ## ② radlor.com IS LIVE, AND GOOGLE INDEXED IT WITHIN HOURS — WITH THE STALE COPY
> Apex `216.198.79.1`, `www` → 308 → apex, cert valid, `llms.txt`/`robots.txt`/`sitemap.xml` all 200.
> ⚠️ **Google crawled `/about` and `/data-and-safety` faster than the US-spelling fix could deploy**,
> so the live snippet read *"adaptive maths for ages"* for a while. If a copy fix is imminent, hold
> the indexing request — Google will not wait for you.
>
> ⚠️ **THE PRODUCTION DOMAIN MUST BE THE APEX, NOT `www`.** The founder had `www` set as production
> and apex 308-ing to it. Both repos hardcode the entity `@id` `https://radlor.com/#organization`,
> and `NEXT_PUBLIC_SITE_URL` is the apex — so `www`-as-production means every canonical points at a
> URL that redirects away. Flipped. **Do not flip it back without changing the `@id` in both repos.**
>
> ## ③ 📉 THE GEO BASELINE, RECORDED — GOOGLE THINKS RADLOR IS A BEER
> Captured hours after launch and written into `../radlor-site/docs/seo-geo-setup.md` §F0, because in
> three months nobody remembers what the wrong answer used to be. Google's AI Overview for `radlor`:
> *"you might mean a **radler** (a mixed beer drink) or made a typo"*, with a knowledge panel pointing
> at **RADLOR LIMITED, Companies House — DISSOLVED 23 June 2026**.
> ⚠️ **The competitor is not a business, it is a stale government record with better provenance than
> a site that is hours old.** That makes `sameAs` the top code item rather than a nicety: nothing
> currently corroborates that Radlor is a live company. One LinkedIn company page would.
> ⚠️ I earlier reported the name as "effectively unclaimed with an Instagram handle and a Madrid hair
> salon" — the Companies House record was there and my search missed it.
>
> ## ④ SEARCH CONSOLE, BING, INDEXNOW — ALL LIVE
> - **GSC**: a **Domain property** (DNS TXT), so one property covers `radlor.com` *and*
>   `adaptivelearn.radlor.com`. Both sitemaps submitted (10 URLs / 5 URLs).
>   ⚠️ **Google's Domain Connect flow was CANCELLED on purpose** — it bundles *"Gmail Setup"* with
>   domain verification and GoDaddy warned it *"will allow Google to potentially remove o365"*. One
>   click from killing the M365 mailboxes. **Always use the manual TXT record here.**
> - **Bing** — imported from GSC. ⚠️ Bing properties are URL-prefix, **not** domain: the subdomain
>   needs adding as a separate site or the app never enters Bing's index, and Bing is what ChatGPT
>   search and Copilot read.
> - **IndexNow** — key file in `public/` of BOTH repos (verification is per host) plus
>   `scripts/indexnow.sh`. ⚠️ **Deliberately NOT a workflow on push**: IndexNow's value is that the
>   crawler comes immediately, which is actively harmful if it arrives before the new build is live —
>   it re-indexes the OLD page. The script refuses any URL not already serving 200. First submissions
>   accepted (202): 10 URLs + 5 URLs.
>
> ## ⑤ 🗄️ SUPABASE REGION MIGRATION — RUNBOOK WRITTEN, DEFERRED TO THE PRO UPGRADE
> `docs/supabase-region-migration.md`. The DB is `ap-southeast-2` (Sydney), the browser talks to it
> **directly**, and the MVP audience is US — so every auth call crosses the Pacific. Region is fixed
> at project creation; the only route is a new project plus a migration. **15 MB, 8 auth users, 17
> learners** — an afternoon now, a project at 800 users.
>
> ⚠️⚠️ **WRITING IT TURNED UP THE ASSUMPTION THAT WOULD HAVE WRECKED IT: THE REPO'S MIGRATIONS ARE
> NOT A REPLAYABLE HISTORY OF PRODUCTION.** The repo holds **66** files; `schema_migrations` holds
> **65** rows; **62 of the repo's versions are absent from the database and 59 of the database's are
> absent from the repo** — only the six most recent overlap, because they were applied through the
> MCP/dashboard, which stamps its own timestamp. **`supabase db push` against a fresh project is an
> unverified REBUILD, not a migration.** The runbook dumps from production instead.
> ⚠️ Also recorded, because a dump brings none of them: the **2 pg_cron retention jobs** (losing them
> silently reopens a commitment made on `/data-and-safety`), the **default privileges** a restore
> hands back, the auth dashboard config, and the extensions.
> ⚠️ And the step that can lock out **5 of 8 users**: Supabase's OAuth callback contains the project
> ref, so a new project needs its callback **ADDED** to the Google Cloud client — while
> `admin@radlor.com` still has only **Editor** there. **Check that before starting, not halfway.**
>
> **Founder's call: this happens WITH the Pro upgrade, not before it.** Pro brings daily backups and
> PITR, which solves the runbook's own §1a blocker by changing the plan rather than wiring the
> stop-gap workflow. ⚠️ **Until then there is still no restorable copy of the children's data.**
>
> ## ⑥ 🔴 `support@radlor.com` MAY HAVE NO MAILBOX, AND IT IS PRINTED ON A LIVE SITE
> Microsoft's sign-in **could not find an account for `admin@radlor.com`**. DNS proves the DOMAIN is
> on M365 (MX, DKIM, autodiscover, tenant `NETORGFT21042623`) — it does **not** prove a mailbox
> exists. ⚠️ I earlier asserted that address "is already a Microsoft account"; that was inferred from
> DNS, not verified, and it was wrong. **Two-minute test: send mail to both addresses and see if it
> bounces.** `support@radlor.com` is on `/contact`, the footer, the legal pages, `llms.txt` and the
> schema of a live site.
>
> ## ⑦ 🎨 LOGO — IN PROGRESS, NOT FINISHED
> Two supplied logos were combined by hand from their SVG paths: logo 1's wordmark + book-in-the-"o",
> logo 2's bulb-and-pencil mark. Work in `~/Downloads/Radlor logo final/` (SVG + transparent + PNG).
> Decisions made: tagline dropped (the site has a better line), polygons reduced from 15 web paths to
> 8 and pulled inward, bulb recoloured into the logo's navy by **luminance** so its shading survives,
> bulb aligned to the letters' baseline at 1.73× the "R", and background-coloured knockouts behind the
> bulb, "R" (9), the book (9) and the final "r" (15) — **different widths on purpose: a wide knockout
> reads as a clean bite out of a dark polygon but is invisible over thin grey lines.**
> ⚠️ **Knockouts must be drawn BEFORE the bulb**, or the R's knockout erases the bulb's shine lines.
>
> **⚠️ TWO THINGS STILL OPEN, AND THE FIRST IS A REAL CONSTRAINT:**
> - **The book IS the "o"** — welded into path `#43` with the "l". Remove the book and the word
>   becomes "Radl_r". Any replacement mark either fills that slot or an "o" has to be drawn.
> - **Bulb OR chest, not both.** A treasure chest was requested and drawn (front view, open lid,
>   light rays, ~15 strokes) — but both marks emit rays and cannot share one lockup.
> ⚠️ **The chest is my drawing and it shows** — geometric arcs against an illustrator's hand. Its
> structure is right; the gems inside were attempted three ways and none worked at that stroke weight.
> **Best handed to a designer as reference.**
>
> ## ▶ WHAT CHANGED IN THE OPEN LIST
> ✅ radlor.com live · GSC + Bing + IndexNow wired · the GEO baseline recorded · a migration runbook.
> 🔴 Still open and unchanged: **no backup of the children's data** · `SUPABASE_SERVICE_ROLE_KEY` ·
> Vercel Pro (Hobby is non-commercial) · custom SMTP (Supabase's mailer 429s at launch) ·
> `DRAFT = true` on the legal text · AR never driven with a real hand · 146 eslint errors (was 132; re-measured 2026-08-21).
> **And two new ones:** ~~`sameAs` is empty (§③)~~ **CLOSED 2026-08-20, see 🔗** and `support@radlor.com` may not exist (§⑥).

_Older sessions (2026-06-15 → **2026-08-19**) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
