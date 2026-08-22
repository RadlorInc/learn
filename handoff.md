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
> **The port is FINISHED at TEN** (founder's call, 2026-08-14: treat 9–11 like 12–18, same engine,
> same format, **AR as the thing that makes it its own band**) — eight ported plus **two BUILT NEW on
> 2026-08-22**, The Packing Shed and The Minibus Run, which is what finally closed the
> multiplication/division content hole the diagnostic had been routing children into. And
> **two more are deliberately staying storybook — founder's call, 2026-08-16: *"woh dono chapter
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
> | 🆕 | `timesTables` | `teen/games/PackingShedGame.tsx` | a TYPED total · taps only (answers reach 116) |
> | 🆕 | `division` | `teen/games/BusRunGame.tsx` | a count ≤ 10 · **hand** or taps |
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
>   `angles` · `words` · `plotMaths` · `cargo` · **`packing`** · **`busRun`**), untouched by the port
>   and still carrying every gate. **Put a rule there, not
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

> 🚚 **2026-08-22 (second pass) — THE TWO MISSING CHAPTERS ARE BUILT. `i.multFacts` — THE MOST LOAD-BEARING NODE IN THE WHOLE 3–18 GRAPH — HAD NO CHAPTER FOR NINE DAYS, AND ~10% OF DIAGNOSED 9–11 CHILDREN ROOTED ON IT. THE CONTENT HOLE IS NOW 0% IN EVERY BAND.** `tsc` 0 · **1436/1436** (+59) · `next build` 0 · lint clean on all new files · sw **v134 → v135**. NOT COMMITTED.
>
> **The ask:** *"Times Tables + Division chapter ka design bhi same waise hi rakho jaise decimal chapter aur jaise 12-18 age band ke chapters ka hai… daily real world examples"* → then *"dono worlds theek hain, (i) karo — banana shuru karo"*.
>
> | | |
> |---|---|
> | `timesTables` | **THE PACKING SHED** · `story/packing.ts` + `teen/games/PackingShedGame.tsx` |
> | `division` | **THE MINIBUS RUN** · `story/busRun.ts` + `teen/games/BusRunGame.tsx` |
>
> Both are Coin Tray's shape exactly: a data file on `GameShell`, `band: '9-11'`, all the maths and
> every word in a pure `story/<module>.ts`, ten-round loop, adaptive tiers, re-teach, mastery exit,
> `coverage` over three readings. Registered in `chapters.ts` + `registry.tsx`; previews are
> `/teen-preview?c=timesTables` and `?c=division`.
>
> ## ⓪ 📦 THE PACKING SHED — THE CRATES ARE CLOSED, AND THAT IS THE WHOLE CHAPTER
> An order arrives: *"Four crates. Five peaches in each."* The crates are **shut** — fact fluency
> means knowing 7 × 8 without counting, so an array a child can count is the scene answering the
> question. They type the total on the shipping label, and THEN the crates tip out and the pallet
> becomes the CHECK. The Empty Plot's order, for the Empty Plot's reason.
> **One chapter carries two graph nodes**, which is the curriculum's own split: L1 the skip-count
> families (×2/×5/×10), L2 the hard middle (6–9 × 6–9) where fluency actually lives, **L3 2-digit ×
> 1-digit** — so `i.multFacts` AND `i.multMultiDigit` both route here.
> ⚠️ **Answers are TYPED, not picked.** `GameConfig.answerPad` offers chips, and a times-table fact
> is precisely the question a child wins by ELIMINATING — the fault the diagnostic was rebuilt this
> same day to remove. The label carries its own ten digits, the way the tray does.
> ⚠️ **Send is live the moment there is something to send.** Answers run 6 → 116, so a fixed-width
> commit gate would be FitOut's dead button by construction.
>
> ## ① 🚌 THE MINIBUS RUN — THE REMAINDER HAS SOMEWHERE PHYSICAL TO BE
> The class is going on a trip; every bus has the same seats. Three readings: **share** them out
> (how many each), **group** them (how many buses fill), and the one the chapter exists for —
> **who is left standing on the pavement**. That is the lesson worth keeping from the deleted Supply
> Run, which chapter-craft still records: *"a remainder with somewhere physical to be"*.
> ⚠️⚠️ **AND THE WORLD'S RULE WOULD HAVE CONTRADICTED THE MATHS IF THE OBVIOUS QUESTION HAD BEEN
> ASKED.** *"25 children, buses seat 6 — how many buses?"* has two honest answers: the division says
> 4 r 1 and any real teacher orders **5**. Asking for the quotient there teaches the opposite of what
> the world shows, on every remainder round. So the scored question is the unambiguous physical one
> (how many are still waiting) and *"so we need one more bus"* is the CONSEQUENCE in the reveal —
> the same call The Height Bar makes with its gate.
> ⚠️ **This is the AR chapter and The Packing Shed is not, and the reason is arithmetic:** a hand
> reads 0–10. Every Minibus answer is a count inside that, so camera and taps express exactly the
> same set of questions; The Packing Shed's answers reach the hundreds, so wiring a hand there would
> be the one-instrument-two-inputs hole. **The generator is bounded to keep that true**, and it is
> gated.
>
> ## ② ⚠️⚠️ TWO REAL DEFECTS, BOTH FOUND BY DRIVING IT, NEITHER VISIBLE TO ANY GATE
> **(a) The instrument was a hot/cold ORACLE, and the wrong version is the one that sounds like good
> teaching.** The buses loaded LIVE from whatever number was showing — *a wrong action allowed and
> visible*, which is a rule this repo already has — so the pavement read "still waiting" until the
> count happened to be right and then flipped to **"pavement clear"**. Tap 1, 2, 3, watch the label,
> commit; the child divides nothing. Fixed by the ORDER, not by removing the feedback: while
> choosing, the yard shows their number as a SETTING (seats reserved, nobody moved) and the loading
> happens ON the commit. ⚠️ The tell was one WORD — "clear" versus "waiting" — not a picture.
> **(b) The bus was drawn with its seats on every round — and on a `sharing` round the seat count IS
> the answer.** Count the empty seats in one bus and read it off. Now the capacity is drawn only
> where the ticket already gave it; where it is the question the bus is an open box.
> Both generalised into `chapter-craft.md` §1.
>
> ## ③ 🔬 WHAT THE GATES CAUGHT BEFORE THE SCREEN DID (55 new module tests, written first)
> - **`6 crates of 12`** — the taught method is "split into tens and ones", so the child's own
>   partial product `6 × 2` is **12**, the crate size printed an inch away. The Height Bar's fault
>   exactly: not a hidden answer but a MANUFACTURED wrong one. Fixed in the generator.
> - **`10 buses of 5`, guess 8** — the verdict read *"10 children still on the pavement"*, and 10 is
>   the answer. chapter-craft: *"a number in a verdict can be the answer by coincidence — check the
>   numbers a template can produce, not just the words in it."* The verdict states the DIRECTION now.
> - Square runs and square pallets (`buses === seats`, `crates === per`) refused at the draw — The
>   Mission Brief shipped that on 16% of its division rounds.
> - Class sizes bounded so the pavement is children rather than a pile.
> - ⚠️ And a prompt that read **"nine crates. Two lemons in each."** — a sentence opening in lower
>   case, on the chalkboard, in every `total` and `multi` round. Caught on a screenshot, then pinned.
>
> ## ④ 🎯 WHAT IT DOES TO THE DIAGNOSTIC
> `i.multFacts`, `i.multMultiDigit` and `i.division` now carry real chapters, so the `remediation`
> stand-in field added this morning is **deleted again the same day** — it existed to point a
> chapter-less skill at the nearest thing we owned, and nothing is chapter-less any more. What holds
> the line instead is the gate. Measured after: **0% of diagnosed roots land on a
> skill with no chapter, in every band** (was 5–10%). And the play-data revision woke up — the
> `activePlan` gate had pinned `deeperChapter('factorsMultiples') === null` with the note *"pinned so
> the day a chapter comes back, this starts returning one and somebody notices"*. It now returns
> `timesTables`. **The pin fired exactly as written.**
>
> ## ▶ OPEN
> 1. 🔴 **NOTHING IS COMMITTED** (this and the diagnostic work of the same day). Driven end to end at
>    1280×720 and 640×320: start card → walkthrough → guided → scored round → correct answer, on both
>    chapters. 0 console errors, 0 offscreen, 0 unreachable controls, no scroll.
> 2. ⚠️ **At 640×320 every control scales to ~28px**, under the 44px floor — `FitSlot` only ever
>    shrinks. **Measured against the shipped Coin Tray at the same frame: 29×29.** So this is a
>    band-wide property, not something these two chapters introduced — but it is the whole band, and
>    it is not written down anywhere as accepted.
> 3. **No backdrops were generated, deliberately** — the 9–11 GameShell chapters use `motif` (one
>    huge faint emoji) rather than a scene PNG, exactly as The Coin Tray does. If the band ever moves
>    to painted scenes, these two need two crops each like the 12–14 chapters.
> 4. **AR is still never driven with a REAL HAND** — The Minibus Run adds a second chapter to that
>    gap rather than closing it.
> 5. Everything from the blocks below still stands.

> 🎯 **2026-08-22 — THE DIAGNOSTIC, RETHOUGHT AND THEN HARDENED. ⚠️⚠️ IT NAMED THE RIGHT ROOT GAP **26–34%** OF THE TIME AND TOLD **10–38%** OF GAPPED CHILDREN THEY WERE ON TRACK — AND ELEVEN GREEN ENGINE TESTS COULD NOT SEE IT, BECAUSE EVERY ONE DRIVES A PERFECT ORACLE. NOW **81–87% / 1–4%**, TEN UNDIAGNOSABLE CHAPTERS ARE REACHABLE, AND THE WEEK-6 GUARANTEE LOOP FIRES FOR THE FIRST TIME.** `tsc` 0 · **1377/1377** (+17) · `next build` 0 · sw **v133 → v134**. NOT COMMITTED.
>
> **The asks:** *"daignostic … dekho ki effective hai kya naii hai"* → *"pura properly rethink karo taaki zyada se zyada baccho ka gap mile aur hamare joh bhi chapters hai unki help se ek personalised route de"* → *"yeh problems ka solution find karo aur apply karo … high accuracy pe hona chahiye"*.
>
> | | before | after |
> |---|---|---|
> | names the EXACT root gap | **26–34%** | **81–87%** |
> | tells a gapped child they are on track | **10–38%** | **1–6%** |
> | says "a band below" to an ON-GRADE child | — | **≤ 4%** |
> | leaf-chapter gap reaches the route | **impossible** | **83–95%** |
> | route starts at the gap when the gap owns no chapter | **never** | always |
> | on-grade probe length (median) | — | 9–16 |
>
> ## ⓪ ⚠️⚠️ THE ANSWER SURFACE WAS THE WHOLE STORY, AND THE ENGINE WAS INNOCENT
> Measured by simulating learners with a PLANTED gap, answering with each item's REAL guess rate and
> a 10% slip. **Driven with clean items the same descent resolves the exact root 90–98%** — which is
> what stopped a rewrite of the search. Three multiplying causes, all outside it:
> - **one 4-choice MCQ per skill = 25% lucky pass** (50% on four of them — `e.compare`, `p.compare100`,
>   `i.bigNumbers`, `i.decimals` — two of which are band ENTRIES);
> - ⚠️ **the fail-confirmation STRIKE doubles it.** A first miss re-offers the skill, so a broken child
>   gets TWO shots at the guess: `p + (1−p)p` → 25% becomes **44%**, 50% becomes **75%**. The guard was
>   written for false FAILS and its cost on false PASSES was never priced;
> - **a lucky pass on an ENTRY closes that whole branch for ever** — the gap disappears entirely and
>   the report says *"At or above grade level"* with an empty plan.
>
> **Fix: where the answer is a NUMBER the child types it** (`input:'num'`, guess ≈ 0), a fraction gets
> two boxes, and `'pick'` survives only where the answer space is genuinely categorical — widened 4→6.
> ⚠️ **The pad's extra keys (`−`, `.`) are declared PER QUESTION TYPE, never derived from the answer** —
> deriving them prints the answer's sign before the child touches anything.
>
> ## ① 🕳️ COVERAGE: TEN BUILT CHAPTERS THE PROBE COULD NEVER REACH — AND THEN NINE MORE ONE BAND DOWN
> A probe that only walks DOWN from entries cannot see a LEAF. **14 skills were unreachable by ANY
> band**, so a rounding, time, money or word-problem gap was structurally undiagnosable and a 6–8
> child's whole check covered 11 of 74 skills. `PROBE_ENTRY` is now `PROBE_SPINE` (descend on fail →
> the root gap) + `PROBE_SWEEP` (leaf chapters → route entries).
> ⚠️ **Then the founder's own case: a 9–11 child who cannot tell the time.** `p.time` is a 6–8 leaf, so
> nothing in 9–11 goes near it — each band misses **9–13** lower-band chapters this way. Sweeping all
> of them would ask a seventeen-year-old *"which is more, 3 or 7"*. The split that works: a
> **standalone topic** (money, time, story problems, rounding, units, angles, charts) can be missing on
> its own and nothing else will ever reveal it — it must be asked; a **foundational** skill (compare,
> number order) sits under everything, so any failure above sends the descent through it anyway. One
> band down only; two bands down, the descent is the honest instrument.
>
> ## ② ✂️ THE DESCENT BISECTS NOW — SHORTER *AND* MORE ACCURATE FROM ONE CHANGE
> Instrumented where the questions actually go: **17–18 spent 11.3 of 20.2 on the descent**, one
> question per LEVEL down a nine-level chain, each an extra chance for a slip to plant a false deeper
> root. Halving the candidate set instead took that band 72% → **81%** and 12–14 to **84%**.
> ⚠️⚠️ **Pure bisection was WRONG and the measurement caught it: a grade-level 17–18 child went from 9
> questions to 22.** With nothing broken below, the cheap question is *"do this skill's own direct
> prerequisites hold?"* — three probes and it is over — while a bisector prunes a 40-node closure a
> sub-tree at a time. So a branch opens in direct-prerequisite mode and switches to bisecting the
> moment something under it fails, which is exactly when the long chains appear.
> ⚠️ Two more free questions saved, both from the graph rather than a cap: an entry whose prerequisite
> has already FAILED is not asked (it is arithmetic, not a question) and an entry that is a
> PREREQUISITE of something already PASSED is not asked either.
>
> ## ③ 🗺️ THE ROUTE IS DERIVED FROM THE GAP, NOT FROM WHICH QUESTIONS GOT ASKED
> `planSkills = [...s.failed]` was a fair approximation while the descent walked every level and
> became wrong the instant it bisected — a bisecting search **skips levels on purpose**, and those
> skipped chapters are exactly the ones between the child's gap and their grade. It is now the failed
> set PLUS every skill on a chain from a root up to a failed entry, bounded by that chain (not by
> `blockedBy(root)`, which for a deep root is most of the graph). Median route: 2 / 4 / 6 / 9 / 16
> chapters by band.
> ⚠️ **And the report then contradicted itself on one screen.** A learner rooting four bands down drew
> a **40-step** route printed two inches under *"Caught now, it's weeks of work, not years"* — which is
> true of a short route and a lie about a long one. The plan card now shows the first five with
> "+N more, one step at a time", and the timeline sentence is chosen by the route's actual length.
>
> ## ④ 🔍 THE WEEK-6 GUARANTEE LOOP HAD NEVER FIRED, AND IT WAS NOT THE LOGIC
> Prod: **0 rechecks, ever** — and querying the sessions, **five children are 45–50 days past their
> check-up and genuinely due one**, so it was not "nothing is ripe yet". `getCheckupStatus` is correct;
> the nudge lived only on the **parent dashboard**, for whichever learner happened to be selected. It
> now renders on `/menu`, the screen the child opens every session. Driven end to end (`Check 1 of 3`
> → typed answers → result).
> ⚠️ The loop is the promise, the retention signal AND the efficacy dataset — one mechanism doing three
> jobs, and it was reachable only by a parent visiting a screen they have no reason to open.
>
> ## ⑤ 🔬 THE BUG FOUND ALONG THE WAY: THE "PER-CHILD REPRODUCIBLE PROBE" WAS NOT
> 14 generators used `pick` from `@/core/rand` — which is `Math.random`, and **that file's own header
> says reproducible cases must not use it.** `resolve()` rebuilds the current question from the seed on
> a mid-probe resume, so those items came back DIFFERENT. A determinism test existed and passed: it
> checked ONE skill, which happens not to use `pick`. Now a seeded `pk`, swept across all 74.
>
> ## ⑥ 🚧 THE GATE IS THE REAL ARTEFACT — `src/__tests__/diagnosticAccuracy.test.ts`
> ⚠️⚠️ **Eleven engine tests were green through all of this because every one drives a PERFECT ORACLE**
> ("knows it ⇒ correct"). A real child guesses and slips; nothing in 1360 tests modelled either, so the
> product's central claim was unmeasured. The gate plants a gap, answers with the real per-item guess
> rate, and asserts exact-root rate, missed-gap rate, false-alarm rate **split into any-gap vs a-gap-in-
> a-lower-band** (only the second is damaging), leaf coverage, route-starts-at-the-gap, route LENGTH,
> probe LENGTH (accuracy is trivially buyable with more questions), and the exact list of chapterless
> skills. Seeded, so it is not a coin flip.
> ⚠️ `diagVisual`'s *"the tallest bar must be the answer"* changed with its question: that was right
> while `i.dataGraphs` asked *"which has the most"* — answerable by LOOKING — and it now asks *"how many
> more X than Y"*. The surviving invariant is that the picture supports the arithmetic.
>
> ## ▶ OPEN
> 1. 🔴 **NOTHING IS COMMITTED.** `tsc` 0 · 1377/1377 · `next build` 0 · lint baseline unchanged ·
>    driven on screen at 1280×720 and 640×320 (number pad, fraction pad, full probe → report, and the
>    re-check flow). 0 offscreen, 0 controls under 44px, 0 console errors.
> 2. ⚠️⚠️ **THE ONE THING THE ENGINE CANNOT FIX: ~10% of diagnosed 9–11 children root on a skill with
>    NO CHAPTER** (`i.multFacts`, `i.multMultiDigit`, `i.division`; 5–8% for the teen bands). And the
>    stand-in is weaker than it sounds — a child whose root gap is multiplication FACTS has, by the
>    definition of a root, already PASSED equal groups, so the plan sends them to a chapter they can
>    already do. **This needs a Times Tables (fluency) chapter and a Division chapter.** Gated
>    (`exactly three skills have no chapter`) so it cannot silently widen. **Founder decision needed:
>    that is a chapter build — verb, world, art — not an engine change.**
> 3. **Probe length is the live trade.** On-grade median 9–16 (9–11 longest: it sweeps the most leaf
>    chapters); gapped p95 16–27. Above the spec's "8–12 items", inside its "5–8 min". The sweep is
>    3–4 questions and is the only thing that can find a money/time/rounding gap.
> 4. **17–18 and 15–16 are the weakest bands at 81%** — its descents cross the most bands, so a slip has the most
>    room to land on a wrong-but-deeper root.
> 5. **The `/menu` re-check card is NOT visually verified** — it needs a signed-in learner with a
>    6-week-old gap, which the local dev server has no session for. Its destination WAS driven.
> 6. 🔴 **STILL NO BACKUP OF THE CHILDREN'S DATA**, and tester issue #2 (Milo's robotic voice) is
>    untouched. Everything from the blocks below still stands.

> 📐 **2026-08-21 — A TESTER'S FOUR BUGS, THEN EVERY CHAPTER SWEPT FOR RESPONSIVENESS, AND FINALLY THE GUTTHI THIS FILE HAS CARRIED FOR WEEKS: ⚠️⚠️ A `useRef` GUARD WAS FREEZING TEN CHAPTERS' DEMOS — IN DEV ONLY — AND THE EARLIER SESSION'S "IT WORKS ON PROD" RULED IT OUT BACKWARDS.** `tsc` 0 · **1360/1360** (+4) · **267/267 e2e** · **20/20 storybook** · `next build` 0 · sw **v127 → v133**. ✅ SHIPPED — `main`@`ea6ee6b`, 6 commits, deployment READY and prod serving v133.
>
> **The asks:** *"google drive access kar paa rahe ho?"* → tester sheet ke 3 issues → *"pura screen responsiveness check karo"* → *"wo gutthi suljhao"* → *"9 chapters — yeh karo"*.
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
> ## ⑤ 🎯 AND THEN ALL TWENTY — PLUS THE DISCOVERY THAT FIVE OF THE NINE WERE NEVER A HARNESS LIMIT
> ⓪ and ① took storybook coverage from 3 of 20 to 11. The nine that still would not go were exactly
> the ones whose guided round wants a CORRECT answer, which a blind driver cannot produce — so every
> gate living on a scored screen quietly covered half the band.
> **Teaching the driver each chapter's answers was the obvious fix and the wrong one**, and this spec
> already carried the reason: *"a chapter-specific driver is a driver that silently skips chapters"*.
> `src/shared/hooks/useChapterPhase.ts` skips the teaching rather than faking it — `?e2e=practice`
> opens a chapter AT its scored round, so the check lands on exactly the screen it is about. Same
> dev-only pattern as `data-test-answer` and `window.__miloPace`, and **verified rather than assumed
> to dead-code-eliminate: zero hits for the parameter in `.next/static` and `.next/server`, every hit
> under `.next/dev`.** 22 chapters wired.
>
> ⚠️⚠️ **FIVE OF THE NINE WERE CORRECT ALL ALONG, AND THE REPORTING IS WHAT WAS BROKEN.** Skip, Slice
> Shop, TickTock, Order Desk and Level Run set `prompt: () => ''`, so SkillBeat draws NO pill and this
> spec's anchor (`button[aria-label="Hear it again"]`) **cannot exist** there — chapter-craft §3, the
> richer surface owns the pill. Their skip was always right.
> **But the spec reported both reasons as "NOT reached", and that is the dangerous part: a chapter
> that LOST its pill would have skipped just as quietly and read as "the driver couldn't get there".**
> Three buckets now — checked · owns-its-pill · genuinely unreached — and `OWN_PILL` is asserted
> EXACTLY, the way `storybookQuestions.test.ts` asserts `BANNER_OWNED`. Those five are additionally
> asserted to draw NO SkillBeat pill, so a beat gaining a prompt is caught before it becomes a
> duplicate. **Only RainbowTown was genuinely unwired** — its phases are `start/teach/bridge/test`, so
> its scored phase is not called "practice"; named in `SCORED_PHASE` rather than guessed.
> **20/20 covered, 20 passed, 0 skipped.**
>
> ## ⑥ 🔧 AND A HARNESS FAULT OF MINE THAT BURNED THREE HOURS OF WALL CLOCK
> To wait for a long run I wrote `until ! pgrep -f "storybook-pills"; do sleep 25; done`. **Every
> waiting shell has that string in its OWN command line**, so each loop saw the other loops and
> concluded the test was still running. Nine of them kept each other alive for ~3h; the founder
> spotted the pile of "Running" chips. Nothing was burning CPU (the real run had long finished) but
> nothing would ever exit either. **A `pgrep` pattern that can match the waiting process itself is a
> deadlock.** Match on something only the target has, or poll the artefact (the log) not the process.
>
> ## ▶ OPEN
> 1. 🔴 **STILL NO BACKUP OF THE CHILDREN'S DATA.** Everything else here shipped; this has not moved.
> 2. ✅ ~~9 storybook chapters do not reach a scored round~~ — **CLOSED, see ⑤. 20/20.**
> 3. **Tester issue #2 — Milo's robotic voice — is untouched**, and it is the only one of the four
>    left. 3–11 is on browser TTS with no recorded clips; that is a real piece of work, not a fix.
> 4. **Google Cloud: `admin@radlor.com` is still only EDITOR, not OWNER** (carried forward from the
>    archived 🏗️ block so it is not lost). Never delete the OAuth client — 5 users.
> 5. **The tester sheet's status column is NOT updated** — the Drive connector can rename/move/share
>    but cannot write cells, and no Sheets connector is in the registry. Needs a browser pass.
> 6. Everything from the blocks below still stands.

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

_Older sessions (2026-06-15 → **2026-08-20**, including 🇺🇸 the US-spelling / SEO / region-migration day and 🔗 the social-handles day, both moved 2026-08-22) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
