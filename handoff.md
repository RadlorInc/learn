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
> **The band is mid-port onto GameShell** (founder's call, 2026-08-14: treat 9–11 like 12–18, same
> engine, same format, **AR as the thing that makes it its own band**). EIGHT chapters are across,
> two are not, and the two halves work completely differently — so check which kind you are in
> first. The two that are left are both storybook `SkillBeat` — there is no 3D excuse any more.
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
> | ⬜ | `bigNumbers` | `story/OrderDesk.tsx` | storybook · SkillBeat |
> | ⬜ | `rounding` | `story/LevelRun.tsx` | storybook · SkillBeat |
>
> **⚠️ THE 3D IS GONE.** `story/FloorPlot.tsx` (1,380 lines of react-three-fiber) and `story/plotSite.ts`
> (628 lines of procedural site) are DELETED — founder's call, 2026-08-15: *"totally remove that 3d
> concept"*. **Nothing in `src/` imports three.js any more**, so `three` / `@react-three/fiber` /
> `@react-three/drei` / `@types/three` are dead dependencies awaiting one `npm uninstall`.
>
> **To add or change a ported chapter:** it is a data file — palette, `makeTask` L1/L2/L3, a
> self-running tutorial, a `GameConfig`. Mirror `CoinTrayGame.tsx`. Shared parts are
> `teen/games/parts/kidKit.tsx` (palette · `KeyRow` · `Cue` · `PIP`/`PAD` · `useLatest`) and the
> engine is `teen/games/parts/GameShell.tsx`.
> - `band: '9-11'` is what buys the ten-round loop and **no resume-at-difficulty**.
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
> ⚠️ **Biggest outstanding gaps, in order:** ✅ the camera path HAS now been driven on the shell (The
> Empty Plot, span → dwell → graded) · **the shell's own scratch-pad button covers the answer surface
> at 640×320 in at least two chapters, one of them shipped** (see 🏗️ below) · the EXPLORE beats were
> dropped and not replaced · no short-frame pass on the other six · nothing is committed and
> `public/sw.js` is still v93.
>
> ---
>
> _(Everything below is the running session history — newest first, most recent ~5 sessions only.
> Older blocks are in [docs/handoff-archive.md](docs/handoff-archive.md), which is NOT auto-loaded —
> `grep` it. This file is inlined into every session's context, so move blocks out rather than
> letting it grow. The craft rules live in chapter-craft.md, not here.)_

> 📊 **2026-08-15 — THE LOADING BAY COMES ACROSS: THE FIRST OF THE THREE STORYBOOK CHAPTERS ON GameShell, AND THE FIRST TIME ONE FINGER COUNT MEANS TWO DIFFERENT THINGS IN ONE CHAPTER. 815 BESPOKE LINES → ~250 OF DATA + ~330 OF PURE MODULE. ⚠️ NOT COMMITTED.** `tsc` 0 · **1039/1039 vitest** (was 987, **+52**) · `next build` 0 · **eslint 0 errors** (1 pre-existing `<img>` warning, same as The Pizza Counter) · **32/32 planted regressions caught, re-run against the final code** · driven at 1280×720 and 640×320, on BOTH inputs, including a full ten-round run and the camera path.
>
> **The ask:** *"in band 9-11, convert the 'Data and Graphs' chapter same as the 12-18 band."* On the two questions put to him, both recommendations taken: **fingers meaning two things** · **hide the cart's counter until the commit**.
>
> ## ⓪ WHAT WENT, AND WHAT REPLACED IT
> `story/LoadingBay.tsx` (815) is DELETED. The maths, the words and the grader are `story/cargo.ts`
> (~330); the chapter is `teen/games/LoadingBayGame.tsx` (~250). **The verb did not move** — a
> delivery lands, four stacks ARE the chart, and the correct answer sends the cart. What went with
> the painted world: three depot backdrops and their per-scene ground lines, the foreman sprite, his
> speech bubble, the cart parked in the foreground to dodge that bubble, and `bayLayout` — ~70 lines
> of arithmetic that had to be swept at ten viewport sizes. **The pictograph sprites STAYED**, with
> their `ink` bbox scaling: a chapter whose question is *which bar is tallest* cannot let a
> fat-padded melon read as taller than an equally tall column of apples.
>
> ## ① ⚠️ ONE READING, TWO MEANINGS — AND IT IS THE ONLY SCHEME THAT COVERS THE CHAPTER
> On a `most` round 1–4 fingers picks a STACK; on a count round the fingers ARE the number and that
> many goods ride onto the cart. The Angle Shop's precedent verbatim, which is what `HandSpec.value`
> taking the TASK exists for. The two alternatives were measured and rejected on arithmetic:
> **`reads: 'slide'`** (point at a bar — honest, and `catch ÷ jitter` ≈ 4.4 across four full-width
> columns) fires `onRead` on POSITION ONLY, so the finger count is a dead button and half the chapter
> goes tap-only; **`reads: 'span'`** (hands apart = the bar's height) is the prettiest idea here and
> is a **live oracle** — the bars are on screen, so a child slides their hands until the ghost lines
> up with the bar top and reads nothing. That last one is worth keeping: *quantity-as-length is only
> an honest gesture when the thing being measured is not already drawn.*
> ⚠️ **`total` HAS NO HAND PATH AT ALL** — its answers run to 22 and two hands hold ten — and
> `instructionFor` says so on screen, because a gesture that silently does nothing for one round in
> four reads as a broken camera.
>
> ## ② ⚠️ `disabled` IS NOT "THE ROUND IS OVER", AND THE DEMO TAUGHT THE OPPOSITE OF ITS OWN LINE
> The cart's counter and the chart's numerals open together on the commit (founder's call — a counter
> climbing 6 → 11 → 13 → 22 does the adding on a `total` round). Written as `reveal || disabled` —
> which correctly covers the miss, the re-teach and a solved round — it also covers **every beat of
> the walkthrough**, because the shell renders a tutorial instrument permanently disabled. So beat 2
> of the first demo printed all four values above the bars under the words *"the biggest one reaches
> highest — you can see it without counting a thing."* Keyed on the VALUE instead
> (`reveal || (disabled && ready(r, v))`) it opens exactly when Milo announces the answer, and in play
> on the commit. ⚠️ And `reveal` alone is not enough either — the shell reveals only a WRONG answer,
> so the axis would be written for nobody who got it right (the 🏗️ block's own lesson, one chapter on).
>
> ## ③ ⚠️ THE CAMERA DOOR PRINTED A REDIRECT AT A CHILD WHO HAD DONE NOTHING
> `nudgeFor` refuses a stack number out of range, written `n < 1 || n > STACKS` — arithmetically
> right, and **an empty frame is a count of 0**, so opening the camera door showed *"There are only 4
> stacks — hold up 1, 2, 3 or 4"* before any hand existed, **displacing the instruction chip that
> should have been there**. Bounded above only now. The gate had swept 5, 6, 7, 9 and 10 and never
> once swept 0.
>
> ## ④ ✅ WHAT WAS DRIVEN — both inputs, both frames
> **1280×720, taps:** both doors · all three walkthroughs, with the diff demo's picture checked
> against its own numbers off the DOM (6 pumpkins, **3 loaded, 3 still standing**, axis written) ·
> the guided round answered by **four taps inside ONE React batch → 4 on the cart** (the batched-tap
> guard, this repo's ninth encounter) · a wrong answer captured frame by frame: numerals at opacity
> **0 while live → miss line on the commit → 1 after**, then the glide · a CORRECT answer revealing
> the axis too · **a full ten-round run that ended itself**, and a second clean run proving the tier
> climb: **1 most · 2 howMany · 5 diff (L2) · 6 total (L3, 6+5+3+7 = 21 SOLVED ✓)** — all four
> readings on screen, `coverage` steering.
> **CAMERA:** the denial gate on the chapter's own copy · the remembered pick flipping the doors ·
> ring **4** → dwell → 4 baskets on the cart → graded → `1 / 10` · ⚠️ **the hand then PARKED at 4
> across the round boundary committed nothing** for 2.5 s+ (the held-over guard, proven the decisive
> way) · then **ring 2 → dwell → SOLVED ✓ on a `most` round**, i.e. both meanings of the one reading
> driven live.
> **640×320:** every fixed layer crossed → nothing off-screen, no scroll, commit **18px clear** of
> the scratch-pad button.
>
> ## ⑤ ⚠️ THE SHORT-FRAME READING WAS A LIE UNTIL THE TAB WAS FRONTED — AND IT LOOKED CATASTROPHIC
> Measured at 640×320 before any screenshot: the chart's top **112px off the frame**, the commit at
> y 325–379 of a 320px viewport, the cue below that — a cut-off chart and an unreachable commit.
> **`FitSlot` sizes itself from a ResizeObserver**, whose callbacks ride the rendering steps and are
> frozen in a backgrounded tab. One screenshot later the same DOM read scale-applied and clean.
> Recorded in chapter-craft, because every short-frame pass in this repo is taken that way.
>
> ## ⑥ THE GATE — 52 tests, **32/32 planted regressions caught**, re-run against the final code
> [loadingBayData.test.ts](src/__tests__/loadingBayData.test.ts). ⚠️ **It passed 50/50 first time,
> which by this file is not evidence — the first mutation pass left THREE survivors and all three
> were my own gate being weaker than its rule:** ① every "wrong stacks" cart I had written already
> failed on the FOCUS count alone, so **deleting the `and nothing else` clause left the whole check
> green** (five melons *plus three apples* is the case that guards it); ② the "the hand loads the
> FOCUS stack" test used a round whose focus WAS stack 0, so hard-wiring the hand to stack 0 passed
> it — **the fixture doing the work the assertion claimed to**; ③ a mutation that silently matched
> nothing, reported as NO MATCH rather than believed.
> ⚠️⚠️ **AND THE SWEEP ITSELF WAS SWEEPING A QUARTER OF THE CHAPTER.** `makeRound(d)` with the
> default `asked = []` is *deterministic by type*, because unmet-first is the whole point of
> `coverage` — so 400 draws per tier were 400 `howMany` rounds and every check behind them meant a
> quarter of what it claimed. It looks exactly like a thorough sweep. What caught it was the one
> check asserting the generator can produce all four types, which failed honestly.
>
> ## ▶ OPEN
> 1. ⚠️ **NOT COMMITTED, and `public/sw.js` is still v94.** The founder has not been asked.
> 2. ⚠️ **THE SCRATCH-PAD COLLISION IS STILL THE MOST VALUABLE THING OUTSTANDING** (🏗️ ⑤) — it is
>    live in a shipped chapter and it is one line. This chapter meets it mildly: at 640×320
>    `ScribblePad`'s closed button clips **11px of the instruction chip's last line**, and the commit
>    clears it by 18px. Still a founder's call on hiding that button below `vh < 470`.
> 3. **No re-teach seen fire and no mastery exit** on this chapter — the band's standing gap. Both
>    need their own run (an erring one and a perfect one are different evidence).
> 4. **No EXPLORE beat.** The shell supports one and this chapter has an obvious candidate
>    (*"build me a stack as tall as that one"*, unscored).
> 5. ⚠️ **A struggling child never meets `diff` or `total`** — they live at L2/L3 and `coverage`
>    withholds the mastery exit rather than forcing a type the tier does not stock. Proven live: a
>    run with two deliberate misses played all ten rounds as `most`/`howMany` only. That is the same
>    shape `pizza.ts` records and is arguably correct (mastery needs the top tier anyway), but it is
>    the first time it has been watched happen and it is worth a founder's eye.
> 6. **Two chapters left**: OrderDesk (`bigNumbers`, 1,620) and LevelRun (`rounding`, 1,724) — both
>    storybook, ~3,344 lines between them.
> 7. **Four dead dependencies still awaiting one `npm uninstall`** (three.js and friends) — unchanged
>    from the 🏗️ block.
> 8. Of this session's faults, **one came from opening the camera door (③), one from reading a demo
>    beat's words against its own picture (②), one from the founder's own question about the counter,
>    one from measuring the short frame twice (⑤), and THREE from mutation-testing my own gate — plus
>    the sweep that was quietly a quarter of the chapter. None from the type-checker, and none from
>    the gate, which went green first time and had to be mutation-tested to be worth anything.**
> 9. **Where the rules went:** `chapter-craft.md` gained *`disabled` is not "the round is over"*, *a
>    sweep over a coverage-driven generator must vary `asked`*, *a fixture can do the work the
>    assertion claims to*, and *`FitSlot` does not shrink until the tab is fronted*;
>    `chapter-craft-ar.md` gained *a redirect keyed on a reading must not fire on that reading's
>    ABSENT state*.

> 🏗️ **2026-08-15 — THE BAND'S LAST NEON CHAPTER COMES ACROSS, AND THE 3D GOES WITH IT ON THE FOUNDER'S CALL. THE EMPTY PLOT IS ~2,000 LINES OF react-three-fiber REPLACED BY ~330 OF INSTRUMENT — AND IT IS THE FIRST TIME A HAND HAS BEEN DRIVEN ON THIS SHELL, AND THE FIRST SCORED SPAN ANYWHERE IN THE BAND. ⚠️ NOT COMMITTED.** `tsc` 0 · **987/987 vitest** · `next build` 0 · **eslint 0 problems on all three files** (the other ported chapters' gates carry 7) · **28/28 planted regressions caught across four live mutation suites, ALL re-run against the final code** · driven at 1280×720 on BOTH inputs, at 640×320 and at 390×844.
>
> **The asks:** *"in band 9-11… area and perimeter chapter ko bhi 12-18 waale jaise structure mein laalo"* → on the two questions put to him: **"totally remove that 3d concept"** and **"something more interesting AR interaction"**.
>
> ## ⓪ THE ONE CHAPTER THE HANDOFF SAID COULD NOT BE PORTED — AND THE ARGUMENT WAS HALF RIGHT
> It had been raised three times as *"react-three-fiber — cannot become a data file over a 2D shell"*.
> The reason was real (*the answer is a PLACE, and a place cannot be offered as a chip*) and it does
> not imply 3D: **drawn from ABOVE, the place is still a place.** The verb did not move — the foreman
> gives a load and the road frontage, the yard is empty, the child works out how far back the far edge
> goes and pegs it — so `plotMaths.ts` survives almost whole (ladder, grader, miss lines, demo beats),
> which is the whole reason the port is cheap. **DELETED: `story/FloorPlot.tsx` (1,380) and
> `story/plotSite.ts` (628).**
>
> ## ① ⚠️ AND REMOVING THE DIMENSION DELETED A WHOLE CLASS OF FAULT, WHICH IS THE POINT WORTH KEEPING
> First person put the child at the far edge **facing away from the road**, so everything the delivery
> laid was behind them — a wrong peg read *"part of it would be bare"* over an empty green field, on
> every round. That cost this chapter a camera swing, a hold time, a raised side view, the
> `fov`-is-vertical trap, and a play loop `useFrame` will not run in a backgrounded tab. **A plan view
> has the whole plot on screen at every instant and there is nothing to swing round to.** Driven: a
> fence pegged at 6 m when the answer was 3 drew the fence running out **partway down the sides with
> the far end open**, under its own sentence *"the fence runs out before it gets all the way round"*.
>
> ## ② ⚠️⚠️ AND THE SHELL REVEALS ONLY A *WRONG* ANSWER — SO THE CHAPTER'S PAYOFF SHIPPED TO NOBODY WHO GOT IT RIGHT
> `GameShell` hands the instrument `reveal` on a miss and on the re-teach; a correct answer goes
> straight to "You solved it ✓". Entirely reasonable, and it meant the delivery — the tiles coming out
> **exactly**, *"and it comes out to the metre"*, the beat the chapter exists for — was shown only to
> children who got it wrong. Nothing failed, every piece was individually correct, the gate was green.
> **Caught by driving the camera path and reading `units: 0` on a correct commit.** Now
> `reveal || v.laid || (v.pegged && gradePeg(...))`, re-driven: `units: 9` with `3 × 3 = 9`.
>
> ## ③ ⚠️ THE AR IS A SPAN, AND THE HEIGHT BAR'S REFUSAL DID NOT TRANSFER — THE ARITHMETIC SAYS SO
> *"Hold your hands apart to show how far back it goes."* The Height Bar measured this gesture at
> **±2.3 in on a 0–60 in scale** and shipped it unscored, which reads as a verdict on the gesture and
> is a verdict on the SCALE. Same noise (±0.25 hand widths), different question: at 1.5 m per hand
> width that is **±0.37 m against a 1 m step — 2.7:1, better than the Angle Shop's tilt, which is
> live.** Holding up fingers was the alternative and was rejected on the chapter's own terms: N
> fingers STATES the depth, i.e. the answer becomes a number, which is what three rejected mechanics
> were rejected to protect.
> ⚠️ **AND A SPAN NEEDS A REFERENT OR IT IS A NUMBER TYPED WITH THE ARMS** — five fingers already look
> like five; hands 40 cm apart mean nothing until the thing measured sits between them. A dashed
> GHOST of the far edge follows the live reading, says only what was read, and is gone the instant the
> peg is in.
>
> ## ④ ✅ WHAT WAS DRIVEN — AND THE BAND'S OLDEST OPEN ITEM IS CLOSED
> **1280×720, taps:** both doors · both walkthroughs beat by beat (the walk beat walks, the peg beat
> pegs, the last beat lays the units and writes `2 × (5 + 2) = 14`) · the guided round answered by
> **three `back ▶` taps inside ONE React batch → `3 metres back`**, i.e. the batched-tap guard working
> (this repo's eighth encounter) · **`1 / 10`** · two scored rounds missed on purpose, each showing
> the plot the CHILD pegged plus its own miss line, then the glide walking the peg home.
> **CAMERA — ⚠️ THE FIRST HAND EVER DRIVEN ON GameShell, closing the 🧱 block's #1 open item:** the
> camera door · the walk buttons correctly GONE · `–` / *"Show Milo both hands"* · **`__miloSpan(2.0)`
> → the ring reads `3` → held 1.85 s → the dwell fired, the peg went in at 3 m and graded correct.**
> The denial gate reads *"Milo can watch your hands, or you can walk it with the buttons"*.
>
> ## ⑤ ⚠️ AND THE SHORT FRAME FOUND SOMETHING THAT IS NOT THIS CHAPTER'S — IT IS THE BAND'S, AND IT SHIPPED
> At **640×320** `ScribblePad`'s closed button (`fixed; right 12; bottom 12`, ~121 × 44, unscaled) is
> drawn over this chapter's `back ▶` (526–583 against the pad's 507–628) — **and over THE COIN TRAY's
> keys 5, 6 and 7**, which is live in production and has been driven twice. A 9–11 instrument is
> *scaled down* by `FitSlot` and centred near x 446 rather than 320, so the two meet. Every tap still
> lands somewhere, which is why only crossing the boxes finds it. **One line in the shared component
> fixes six chapters; not touched tonight because it is 36 chapters' worth of blast radius and nobody
> asked.**
>
> ## ⑥ THE GATE — **16/16 planted regressions caught**, re-run against the final code
> [floorPlotArea.test.ts](src/__tests__/floorPlotArea.test.ts), 80 → 60 tests: the whole procedural-world
> half (nothing countable in the site, the palette separations, the collinear-props trap) went with
> `plotSite.ts`, and **a gate guarding deleted code is worse than none, because it reads as coverage.**
> What is new: the span's reachability swept over every depth the generator draws, the hysteresis
> **jittered ACROSS a boundary rather than around a centre**, the right-answer reveal, the reveal
> laying the CHILD's plot, and the no-grid check **scoped to what is DRAWN** — a file-wide ban on
> `for (` would have caught the miss-glide loop, and a ban that gets loosened is worse than no ban.
> ⚠️ Tree checked clean after the mutation run, per the recorded fault of a killed run leaving it
> dirty — and the whole set re-run AFTER the last edit, because a mutation score only means anything
> about the code actually shipped.
> ⚠️ **The last edit came from the LINTER, and it is where the port's one piece of dead data
> surfaced:** `makeRound(d, round, asked)` took a `round` only to seed the procedural site, so with
> `plotSite.ts` deleted the parameter was unused — a signature still asking for something nothing uses
> is the next reader's wrong turn. Removed, with its three call sites in the gate.
>
> ## 🎬 THE EXPLANATION NOW MOVES — founder, on a screenshot of the arithmetic beat
> *"joh explanation daale ho … uske according animation generate karo … narration ke according frame
> per second … aur narration ke according run karo."* He was looking at **the one beat with a static
> screen**, and it was the worst possible one: *"12 tiles, in rows of 4. 12 divided by 4 is 3. So it
> goes 3 metres back"* played over an empty yard and a walker who had not moved — i.e. **the entire
> teaching in audio, on a band whose devices mostly have no voice.** Three of the six beats shared one
> value, and the one in the middle was the division.
>
> **On the question put to him he took in-engine over generated video**, and the reason is the same
> arithmetic that decides everything else here: the narration is BUILT from each round's numbers, so a
> pre-rendered film can only ever say one set of them — the two fixed demos would animate and the
> re-teach, which re-narrates the child's own round, would stay still. Drawn from the data, every
> round animates. It also cost no credits and stayed neon, which the painted route would not have.
>
> **THE LOAD IS A BAR AND THE WORKING CUTS IT UP** (`workFrames`, in the pure module so the gate can
> read the picture against the beat's own words). An area round cuts it into rows of the frontage, one
> row per frame — *12 tiles → one row of 4 → 2 rows of 4 → **3 rows of 4*** — so the row count IS the
> answer, being counted, and it lands on the same number the sentence lands on. A perimeter round takes
> two lots of the frontage off the top and splits what is left in two: *14 m → one side: 5 → two sides:
> 10 → 4 left for the other two → **2 each***. One widget, because both readings are partitions of the
> same given number, and the two cuts are visibly different sums.
> **And the walk beat now WALKS** — 0 → 1 → 2 → 3, one metre a frame, under *"counting my metres. 1, 2,
> 3."* It used to slide the whole way in 180 ms.
>
> ⚠️ **THE CADENCE COMES FROM THE NARRATION'S OWN SPEED, because a beat's duration cannot be known** —
> it ends when an utterance ends, or on `speakSteps`' fallback timer on a silent device. What IS shared
> is the child's speech-rate pick: narration is `2600 / m` a step, a frame is `620 / m`, so 🐢 Slower
> slows the picture exactly as much as the words. `setInterval`, never rAF (frozen in a backgrounded
> tab, i.e. in every drive).
> ⚠️ **THE BAR IS COUNTABLE, AND THAT IS ONLY SAFE BECAUSE IT CANNOT REACH A SCORED ROUND** — it hangs
> off `PlotV.step`, which the walkthrough beats set and nothing in play does. One test, driven through
> `initialValue`, `hand.enter` and the glide rather than grepped.
> ⚠️ **AND THE RESET IS DERIVED DURING RENDER, NOT IN AN EFFECT** — an effect runs after paint, so the
> walk beat opened with the walker already at 3. The React lint named it; the rule was already in
> chapter-craft for a journey's phase.
>
> **Driven, frame by frame off the live DOM:** work `– → one row of 4 → 2 rows of 4 → 3 rows of 4 →
> holds`; walk `0 → 1 → 2 → 3 → holds`.
> **Gate +5 tests (60 → 65) and a second mutation run, 13/13** — and ⚠️ **the first pass left ONE
> survivor, which is the Supply Run fault wearing the animation's clothes:** shrinking a perimeter
> round's two final pieces to a single unit each left the note still reading *"2 each"* and the whole
> check green. **The caption was asserted and the drawing was not.** Now the piece SIZES are.
>
> ## 🎥 AND THEN THE ANIMATION WAS GENERATED FOR REAL — founder: *"kuch khaas naii hai .. higgsfield se generate karo .. accha proper"*
> The code-drawn bar taught the sum and looked like a progress bar. So the two WALKTHROUGH examples now
> play a **generated film** (Kling, 2 × 7.5 credits of 1024), cut to a 12-cell strip and stepped by the
> same beat clock: `12 tiles along the kerb → they fly down → 3 rows of 4`, and
> `14 panels → the fence runs round → the loop closes`.
>
> ## ⚠️⚠️ A VIDEO MODEL CANNOT COUNT, AND THAT IS THE WHOLE PROBLEM WITH FILM IN A MATHS CHAPTER
> Ask Kling for twelve tiles in rows of four and it returns eleven, beautifully lit. A picture that
> disagrees with the number is the worst defect this app can ship, so a better prompt is not the answer.
> **`kling3_0` takes a `start_image` AND an `end_image`** — so both ends are COMPOSED here
> (`scripts/plot-keyframes.py`, in the chapter's own hex values: exactly 12 along the kerb, exactly
> 3 × 4 in the plot) and the model supplies only the motion between them. Arithmetic at both ends,
> atmosphere in the middle. ⚠️ **And the caption stays code-drawn from `workFrames`** — the picture may
> be the model's, the words may not be.
>
> ## ⚠️ THE FILM COVERS TWO EXAMPLES AND CAN NEVER COVER MORE, WHICH IS WHY THE BAR SURVIVES
> A film says one set of numbers for ever; the re-teach re-narrates the CHILD's round. So `filmFor`
> returns a strip for the two fixed demos and `null` for everything else, which falls back to the
> data-drawn bar — swept over the whole generator, and the film is gated to `step === 'work'` so it
> cannot reach a scored round. **The fallback was built first; the film is the polish on top.**
>
> ## ⚠️ AND THE CUT'S END IS FOUND BY CONVERGENCE, NOT BY MOTION — a re-cut paid for this
> The front of a clip is a held start frame (this repo's recorded 9-of-12-static fault, met again: 3 of
> the first 12 cells were identical). The BACK is subtler: an interpolated clip *converges* on its end
> frame, so per-frame difference decays to noise while the picture is still assembling. Measured on the
> fence clip, motion was down to **7% of peak 60 frames before the loop actually closed**, and the
> first strip ended with the fence half-built. **Distance to the FINAL frame is the honest signal**,
> because with a composed `end_image` that frame is the answer. `scripts/explain-frames.py` does both.
>
> **Driven:** the area film stepped all 12 cells `0% → 100%` with the caption tracking
> `one row of 4 → 2 rows of 4 → 3 rows of 4`, landing on 3 exactly as the sentence does; the perimeter
> film plays in demo 2 under *"Two sides of 5 is 10…"*. **Gate 65 → 68 and a third mutation run, 6/6**,
> including one that **re-cuts the shipped PNG a cell shorter** — the strip's cell count lives in a file
> AND in the source, so a re-cut silently lands every cell on the wrong picture with nothing erroring.
> ⚠️ Three existing checks went red on the film and all three were RIGHT (a `backgroundSize`, a
> `${r.depth}` inside the film's lookup key, and `/assets/` in a chapter that had none). **Each was
> tightened rather than loosened** — scoped to what the Yard DRAWS, and the asset list pinned to
> exactly the two strips, so a third smuggled-in example fails.
>
> ## 📏 AND THE PLOT WAS DRAWN AT A SIXTH OF THE ROOM — founder: *"the size is too small bro"*
> The culprit was a rule this file already carries: **a lane that will fill must be reserved from
> empty.** The plan reserved all twelve metres of walkable depth so it could not jump under a child
> pacing it — and at a typed 22px a metre, a 5 × 2 plot then filled **14% of that box**, which
> `FitSlot` shrank again to fit the slot. The reserve was right and its price had never been costed.
> Three moves, and the order matters:
> ① **the BOX is fixed and the METRE is derived** (`metreOf = min(W/frontage, H/visible)`), so a narrow
> plot gets a big metre, the instrument is always the same size in the layout, and nothing jumps;
> ② ⚠️ **the plan closes up ONLY after the peg** — closing it on the round's own depth while the
> question is live would make the box's HEIGHT the answer, drawn instead of written, so before the
> commit it is identical on every round and after it the plan zooms to what was built (*go back and
> look at what was made*, done with scale instead of a camera);
> ③ **the walk bound went 12 → 10**, which buys ~20% more metre AND closes a hole: at 12 the tap path
> could peg depths a two-hand span **cannot express**, i.e. one-instrument-two-inputs quietly broken.
> `MAX_DEPTH === HAND_MAX_M` is now asserted.
> **Measured, 1280×720:** the pegged plot went from **44 × 110 → 110 × 278** with 10 countable tiles;
> the demo's fence plot 345 × 141.
>
> ⚠️ **AND A BIGGER INSTRUMENT REACHES FURTHER, SO THE LAYERS HAD TO BE RE-CROSSED.** Widening it ran
> the plot's top-left **65 × 62 px under the shell's pinned chalkboard** (board 20–404, plot 339–764) —
> the question drawn over the answer. The cause was the readout column sitting BESIDE the plan and
> shoving it ~110px left of centre; stacked underneath, the plan sits on the column's centre line and
> it now clears the board by **64px**.
>
> ⚠️ **AND THE FIRST MUTATION PASS ON THIS LEFT TWO SURVIVORS, BOTH THE SAME RECORDED FAULT:** the new
> size checks carried **their own copy of the box constants**, so putting a typed `const U = 22` back
> in the component — or shrinking the box to 120 — left every one of them green. *A gate that
> re-implements a rule cannot see the rule being removed.* `PLAN_BOX` is exported and the gate drives
> the shipped value; 4/4 after.
>
> ## 🚶 AND THEN THE CHARACTER — founder: *"tum dekh sakhte ho... kitna chota dekh raha hai .. yeh character"*
> The same fault as 📏, one layer in, and it was CREATED by fixing that one. **The metre stopped being
> a constant and every marker around it stayed typed:** walker 16px, peg 15px, posts 10px, numeral
> 17px — so at a 56px metre the child's own character rendered a third of a metre tall and disappeared.
> All four are derived from the metre now (`markers(u)`, with floors that bind on the widest plot where
> the metre is smallest). **Measured at 1280×720: the walker went 16 → 34px** and scales from here.
>
> ⚠️ **AND GROWING HIM COLLIDED WITH THE THING ABOVE HIM — the road band, for the SECOND time.** First
> the frontage numeral was drawn across the word ROAD; now the walker's head was drawn across the
> numeral. Both times all three elements were individually centred and individually correct. So the
> band is `roadBand()` in the pure module — its height derived from everything that has to fit in it —
> and the gate sweeps **every metre the generator can produce** rather than the one size somebody looked at.
> ⚠️ **AND AN EMOJI'S BOX IS NOT ITS INK:** modelled with a 3px gap the arithmetic said it cleared and
> the DOM said it overlapped by 2px, because a glyph's line box carries leading the font size does not
> describe — and `FitSlot` then scales the gap down again. 8px authored, measured clear on the DOM.
>
> ⚠️ **THE MUTATION RUN ON THIS LEFT THREE SURVIVORS AND ALL THREE WERE THE SAME BLIND SPOT:** a check
> that only asks *do these boxes overlap* **cannot see a marker frozen SMALL**, because a tiny thing
> collides with nothing — freezing the walker at 30px, freezing the peg at 15px and setting the
> clearance to zero all passed. The gate now asserts the RELATIONSHIP (a bigger metre gives a bigger
> marker) and a real clearance rather than `>= 0`; 6/6 after.
>
> ## 🔄 AND THE PLAN NOW TURNS WITH THE SCREEN — founder: *"laptop screen pe yeh ek proper horizontal rectangle mein dikhe … abhi woh vertical mein hai, joh phone ke liye sahi"*
> The last size fix made the plot fill its box; it did not ask whether the BOX was the right shape. The
> long axis here is the WALK, so with the depth running down the page the plan is a tall sliver in a
> laptop's wide slot — correct on a phone, wrong on a desk. **The plan's orientation now follows the
> frame's**: road along the top with the depth running down on a portrait frame, road down the LEFT
> with the depth running across on a landscape one.
> **Measured at 1280×720: the plan went 110 × 340 → 658 × 168, and the walker 34 → 59px.** Nothing was
> resized — the same derived metre simply had room. Re-measured at 390×844 the plan flips back and the
> road band restacks (ROAD 286–298, numeral 308–324, walker 329 — 10px and 5px of clearance).
> ⚠️ **ONE MAPPER, NOT TWO RENDERERS.** Everything is placed in the world's own units (`across` along
> the road, `deep` into the yard) and `planXY(land, …)` turns that into pixels. Two copies of the
> drawing would drift the first time a marker moved.
> ⚠️ **AND THE MUTATION RUN IS WHY IT IS AN EXPORTED FUNCTION AT ALL:** with the mapping inline, a tile
> grid that had **stopped turning with the plan** passed every box-size and metre check in the file —
> all of which were still perfectly correct. The gate drives `planXY` and asserts the two orientations
> are transposes of each other at every slot the generator can produce; 5/5 after.
> ⚠️ Two of the four mutation suites went stale as the code moved under them (`SKIP (0x)` reads exactly
> like a mutation that does not apply, not one whose target has been edited). Repaired and re-run: **13/13,
> 4/4, 6/6, 5/5, with the tree checked clean afterwards.**
>
> ## 🚀 SHIPPED — `main`@`12cdfa6`, prod serving **sw v94**
> Three commits, clean fast-forward (`origin/main` was an ancestor), 0 ahead / 0 behind:
> `d2e4e10` (the whole band port — 54 files, **+4,410 / −6,860**, i.e. net −2,450 lines) ·
> `3da540d` (the craft rules it paid for) · `12cdfa6` (sw v93 → v94).
> **ONE code commit rather than three**, deliberately: `registry.tsx`, `storyChapters.tsx` and
> `story/page.tsx` are each touched by every chapter, so splitting per chapter means hand-cutting
> hunks and risking a broken intermediate — the recorded *"a registry importing a component that does
> not exist yet"* fault. Gates re-run before staging rather than trusted from this file: `tsc` 0 ·
> **987/987** · `next build` 0.
> ⚠️ **THE BRANCH WAS BUILT CLEAN IN A SCRATCH WORKTREE FIRST** (`tsc` 0 · 987/987 · both strips
> present), because a green working tree says nothing about the branch — a file left unstaged compiles
> locally and breaks on the remote. Worktree removed, tree checked clean after.
> ⚠️ **`docs/recovered/`, `python script/` and the voice caches are now `.gitignore`d** rather than
> committed; `scratch/` already was.
>
> **Post-deploy, on the live origin:** prod `sw.js` **v94 on the fourth poll** · 9 routes 200 ·
> **both film strips 200 and byte-exact (166,438 and 92,059)** — the asset the previous block warned
> would 404 if it missed the commit · the SW unregistered and `milo-shell-v94` cleared before driving,
> per the recorded fault of a controlled worker serving the old shell.
> **Driven at 1280×720:** the briefing with both doors · the walkthrough · the guided round *"9 tiles,
> 3 metres along the road"* answered **3** → **SOLVED ✓ with `units: 9` and `3 × 3 = 9`** — i.e. ②'s
> right-answer reveal live in production · **0 console errors**.
> ⚠️ **What the prod drive does NOT cover:** the camera path (a webcam cannot be driven headlessly and
> the dev hooks are stripped from production by design), the ten-round loop, the re-teach and the
> mastery exit. All are proven on localhost; none on prod.
>
> ## ▶ OPEN
> 1. ✅ **SHIPPED — see above.** `public/sw.js` is v94. ⚠️ **`public/assets/explain/` (256 KB, two
>    strips) is new and untracked** — it must go in the same commit as the chapter or the walkthrough
>    404s in production. `scratch/` (the mp4s and composed keyframes, 3.8 MB) is now git-ignored.
> 2. ⚠️ **THE SCRATCH-PAD COLLISION (⑤) IS THE MOST VALUABLE THING HERE** — it is live, it is in a
>    shipped chapter, and it is one line. Founder's call on hiding that button below `vh < 470`.
> 3. **Four dead dependencies**: nothing in `src/` imports three.js now.
>    `npm uninstall three @react-three/fiber @react-three/drei @types/three` — left undone because a
>    lockfile churn at the end of a big change is not a thing to do unasked.
> 4. **No ten-round run, no re-teach seen fire, no mastery exit** on this chapter (the band's standing gap).
> 4b. ⚠️ **THE RE-TEACH DOES NOT ANIMATE, AND IT IS THE SAME EXPLANATION** (and it is the bar, not the
>    film, since its numbers vary).** `GameShell` narrates
>    `task.work` after 3 wrong but never drives the instrument through those lines — it holds the
>    reveal. The walkthrough animates; the re-teach still says the words over a still picture. Fixing
>    it means passing the shell's `reteachAt` to the instrument, which is a change to 36 chapters, so
>    it is a founder's call rather than something to do unasked.
> 5. **No EXPLORE beat** — the shell supports one and this chapter would take a good one (*"show me
>    about how long three metres is"*, unscored, which is the span's other honest home).
> 6. **Three chapters left**: OrderDesk, LevelRun, LoadingBay — all storybook, ~4,159 lines, and none
>    of them has the 3D excuse any more.
> 7. Of this session's faults, **one came from driving the camera path (②, the biggest), one from the
>    FOUNDER reading a screenshot (the static arithmetic beat — see 🎬, and no check of any kind can
>    see "this beat shows nothing"), one from measuring two centred labels against each other (the
>    frontage numeral drawn across the word ROAD), one from a disabled commit saying nothing (now
>    "Walk back into the yard"), one from crossing a SHELL layer with the answer surface at 640×320,
>    and two from the linter (a parameter the deleted 3D was the only user of, and a setState in an
>    effect that would have opened the walk beat at its end). None from the type-checker, and none
>    from the gate — which went green first time both times and had to be mutation-tested to be worth
>    anything.**
> 8. **Where the rules went**, so the next session does not re-learn them from this block:
>    `chapter-craft.md` gained *removing a dimension can delete a whole class of fault*, *a shell that
>    reveals only a WRONG answer leaves the chapter owing its payoff*, *a fixed corner affordance the
>    SHELL owns is a layer too*, and — from 🎬 — *the beat that does the arithmetic is the one most
>    likely to be a still, find them by comparing consecutive beat values, animate at the narration's
>    own rate, and assert the piece SIZES rather than the caption*; **`chapter-craft-art.md` gained the
>    whole EXPLAINER-FILM pipeline from 🎥** — compose both keyframes because the model cannot count,
>    keep the caption code-drawn, a film may only play on hard-coded examples, cut the end by
>    convergence rather than by motion, and pin the strip's cell count in the gate; `chapter-craft-ar.md` gained *a continuous reading's verdict
>    belongs to the answer SCALE, not to the gesture* (with the two chapters' noise table) and *a span
>    needs a referent or it is a number typed with the arms*.

> 🧱 **2026-08-14 — ALL SIX NEON 9–11 CHAPTERS ARE ON GameShell. ~3,270 BESPOKE LINES BECAME ~1,270 OF DATA, FOUR COPIES OF `boardBand` AND SEVEN COPIES OF THE CAMERA WIRING ARE GONE, AND THE ONE CHAPTER THAT HAD NEVER HAD A GATE HAS ONE. ⚠️ NOT COMMITTED.** `tsc` 0 · **990/990 vitest** · `next build` 0 · **13/13 planted regressions caught** · eslint clean on all seven new files · every chapter driven.
>
> **The ask:** *"ab baaki 5 neon chapters bhi convert kardo"* — after the pilot.
>
> ## ⓪ WHAT WENT, AND WHAT REPLACED IT
> | chapter | was | now | answer |
> |---|---|---|---|
> | decimals · The Coin Tray | 588 | **252** | two wells, `enter`/`commits` |
> | factorsMultiples · The Factor Lab | 526 | **156** | one count, commits on the tap |
> | fractionsCompare · The Pizza Counter | 537 | **182** | one count, 1–10 (never 0) |
> | measurementUnits · The Height Bar | 611 | **208** | two places, tens then ones |
> | anglesSymmetry · The Angle Shop | 687 | **284** | a degree OR a set of axes |
> | wordProblems · The Mission Brief | 320 | **119** | the shell's AnswerPad |
> **Six components DELETED**, plus `preteen/band.ts` and every chapter's layout half.
>
> ## ① ⚠️ THE PAYOFF IS THE DELETIONS, NOT THE NEW FILES
> `boardBand`/`benchBand`, `TOP_BAND`/`BOT_BAND`, `ACTION_ROW` and `MILO_LANE` existed **byte-identical
> in four modules** — extracted to `preteen/band.ts` on the fourth copy only weeks ago, and swept at
> ten viewport sizes in four separate gates. **All of it is gone**: GameShell owns the bands and
> `FitSlot` scales the instrument into what is left. The same for the AR wiring, which was ~80 lines
> in each of seven chapters and is now `hand: {…}` on a config.
> ⚠️ **AND THE GATES HAD TO GO WITH IT.** Four suites were driving that dead arithmetic — a gate
> testing code nothing calls is worse than no gate, because it reads as coverage. What replaced them
> is `bandOnGameShell.test.ts`, holding the same rules ONCE for all ten chapters.
>
> ## ② ⚠️ AND THE SHARED PART WAS EXTRACTED ON THE SECOND USE, NOT THE FIFTH
> `parts/kidKit.tsx` — the palette, the key row, the action cue, `PIP`/`PAD`, and `useLatest`. Written
> once for The Coin Tray, it was about to be pasted into five more chapters, which is exactly how this
> repo got four `boardBand`s. **The key row's width is derived from its own keys** (`n*PAD +
> (n-1)*GAP`), which is why Factor Lab's ELEVEN-key row fits one line on a 1280 frame with nobody
> having thought about it.
>
> ## ③ ⚠️ THE SAME BUG, TWICE, AND THE LINTER NAMED IT BOTH TIMES
> The two-place chapters mirror their value in a ref, or **two taps inside one React batch both
> resolve to "the first place" and the second overwrites the first** — seven times now for this
> repo. My first fix wrote the ref DURING RENDER, which `react-hooks/refs` correctly forbids. The
> honest version is `useLatest(task, value)` in the kit: the ref is keyed on the TASK, so a new round
> makes the stored value stale and `read()` falls back to the rendered one without anything having to
> reset it — and nothing is ever written while rendering.
> ⚠️ **Factor Lab does NOT get one and the comment says why**: its answer is one tap that commits
> immediately, so there is no second tap in the batch to be stale for.
>
> ## ④ ⚠️ TWO CHAPTERS NARRATED SOMETHING THE SCREEN NEVER DID — BOTH CAUGHT BY DRIVING THEM
> The Mission Brief's walkthrough said *"which comes to 69"* while its readout still showed `?`: the
> shell renders a tutorial instrument with `reveal={false}` (correctly — nothing is being answered),
> so the equation never opened. **Info that exists only in audio is info most Chrome installs do not
> have.** The Angle Shop was worse: it said *"So I turn it"* and then *"There. That is the one."* over
> an arm that had **not moved a degree**, because I wrote its tutorial steps without values. That is
> the SupplyRun fault — a demo teaching the opposite of its own words — and no gate could see either,
> because every piece was individually correct.
>
> ## ⑤ THE GATE — **13/13 planted regressions caught**, and FOUR of them were holes I had just written
> ① Pizza's anti-oracle: grepping for `openingTake` passes on `value ?? openingTake(r)`, which still
> follows the child live — **assert the GUARD, not the call**. ② A fold round committing on the first
> axis the hand aimed at (a round answered by waving). ③ The tilt driving an exact-degrees round,
> where ±2.5° of an unmarked target is luck. ④ The Mission Brief's distractors, ungated because that
> chapter had no test file at all.
> ⚠️ **AND ITS OWN PROSE TRIPPED ITS OWN REGEX** — a "shuffles nothing" check matched the sentence
> explaining that it shuffles nothing. Comments are stripped before any source check now, which is a
> rule already written in chapter-craft.
> ⚠️ **A KILLED MUTATION RUN LEAVES THE SOURCE DIRTY.** The first pass hit the 2-minute tool timeout
> mid-mutation and left `AngleShopGame.tsx` mutated; the next run then reported that mutation as "NO
> MATCH" — which reads exactly like a mutation that does not apply, rather than one already applied.
> `tsc` caught it. **Check the tree before believing a mutation report.**
>
> ## ⑥ WHAT WAS DRIVEN — all six, at 1280×720
> **The Factor Lab**: briefing with both doors · walkthrough dealing 12 into rows with the anchor on
> the card · **eleven keys on ONE row** · guided round answered `3` (15 = 3 × 5) → graded → **`1 / 10`**
> and round 1 came up a *pair* test where the walkthrough was a *factor* one, i.e. **coverage steering
> live**. **The Pizza Counter**: THEIRS and MINE drawn, key row **starting at 1** (no answer is ever
> zero) against the tray's starting at 0. **The Height Bar**: `4 ft 3 in` on the board, `SIGN · 44 in`
> — **44 is not a multiple of twelve, so `OFFSET_LIMITS` survived the port** — TENS `5` ONES `1`
> filling to 51, and the line *"51 inches against 44 inches on the sign — that is tall enough."*
> **The Angle Shop**: the arm live at −150°, turn/Fix controls, the guide. **The Mission Brief**: the
> brief panel, the story, READOUT. **The Coin Tray**: driven end to end earlier, `2 / 10` reached.
> ⚠️ **THE PREVIEW PANE RENDERED INTO A CORNER FOR ALL OF IT** — through resizes, reloads and fresh
> tabs — so every claim above is measured off the DOM, not read off a screenshot.
>
> ## ▶ OPEN
> 1. ⚠️ **NO CAMERA PATH HAS BEEN DRIVEN ON THE SHELL, on any chapter.** Everything went through taps.
>    The `hand` field is proven by the gate and by arithmetic; the ring, the dwell commit and the
>    denial gate have never been on screen in GameShell. **Still the most useful next drive**, and
>    `__miloFingers` exists to do it headlessly.
> 2. ⚠️ **THE EXPLORE BEATS ARE GONE AND NOTHING REPLACED THEM.** Four of these chapters had one (the
>    Coin Tray's 7+5 pennies fusing into a dime, the Height Bar's hands-apart span, Factor Lab's
>    bench, the Pizza Counter's reflow). The shell supports it — `TeenChapterCfg.explore` plus a Sim —
>    but I did not port them, so **the Height Bar's span reading now ships in no beat at all**. That is
>    a real loss and it is the largest single thing outstanding.
> 3. ⚠️ **No short-frame pass on any of the six.** 640×320 is where this repo's layout faults live and
>    the pane would not render for it.
> 4. **No ten-round run, no re-teach seen fire, no mastery exit** on any of them.
> 5. **`/story?ch=` now rejects six keys by design** — factors, fcompare, decimals, units, angles,
>    word. Previews are `/teen-preview?c=<id>`. `area` and `data` still work.
> 6. **Four chapters left**: OrderDesk, LevelRun, LoadingBay (storybook, 4,159 lines) and **FloorPlot,
>    which is react-three-fiber and cannot become a data file over a 2D shell** — raised three times
>    now and still unanswered.
> 7. Of this session's faults, **two came from driving the chapters, four from mutation-testing my own
>    gates, two from the linter, one from a gate's prose matching itself, and one from a killed
>    mutation run leaving the tree dirty. None from the type-checker — though it named every site the
>    new band had to exist in, which is what made the port safe.**

> 🎛️ **2026-08-14 — THE 9–11 BAND MOVES ONTO THE 12–18 ENGINE, ON THE FOUNDER'S CALL — AND AR BECOMES A FIELD ON THE CONFIG INSTEAD OF SEVEN COPIES. THE SHELL IS DONE AND GATED; THE PILOT CHAPTER IS NOT. ⚠️ NOT COMMITTED.** `tsc` 0 · **1007/1007 vitest** (was 994, **+13**) · `next build` 0 · **13/13 planted regressions caught** · the 12–14 band re-driven in the browser and unchanged.
>
> **The ask:** *"yeh band joh hai … 9-11 wala … isko bhi 12-18 waale jaise treat karo … aur isko bhi
> wohi format mein lao. bas yeh band ki speciality hai AR"* → on the four questions put to him, all
> four recommendations taken: **extend GameShell with a band prop** · **AR as a first-class `hand`
> field** · **shell first, then ONE pilot, then fan out** · **instruments stay the default for 9–11**.
>
> ## ⓪ WHY THIS IS WORTH DOING, MEASURED RATHER THAN ASSERTED
> The 12–18 format is ONE engine — `GameShell` (1,341 lines) + `gameKit` (1,171) — over which a
> chapter is a **thin data file** (~300 lines: palette, `makeTask` L1/L2/L3, a self-running demo, a
> `GameConfig`). The 9–11 band today is ten bespoke chapters, **~9,800 lines**, each carrying its own
> layout, phases, words and gate — six in the neon Mission HUD, four still storybook.
> **So the prize is not the look (six are already neon): it is ~9,800 lines of duplicated shell
> becoming ~3,000 lines of data, and a fix landing once instead of ten times.**
>
> | chapter | file | lines | look | AR |
> |---|---|---|---|---|
> | bigNumbers | OrderDesk | 1620 | storybook | ✋ |
> | rounding | LevelRun | 1724 | storybook | ✋ |
> | areaPerimeter | FloorPlot | 1380 | storybook · **3D** | — |
> | dataGraphs | LoadingBay | 815 | storybook | — |
> | anglesSymmetry | AngleShop | 687 | neon | ✋ |
> | measurementUnits | HeightBar | 611 | neon | ✋ |
> | decimals | CoinTray | 588 | neon | ✋ |
> | fractionsCompare | PizzaCounter | 537 | neon | ✋ |
> | factorsMultiples | FactorLab | 526 | neon | ✋ |
> | wordProblems | MissionBrief | 320 | neon | — |
>
> ## ① THE BAND NOW EXISTS IN THE FIELD LAB SYSTEM — AND THE TYPE-CHECKER NAMED EVERY SITE
> `AgeBand` gains `'9-11'`, which turned every `Record<AgeBand, …>` into a compile error until it was
> filled: `BAND_FRAMING` (9–11 is a **Job**, not an Investigation — the band's worlds are a coin tray
> and a height bar), `CalmAdvance`'s microcopy bank (warmer and plainer, and still never a cheer), and
> three `switch (band)` label functions in `MasteryState`. **That is the honest cost of a new band and
> it is small.** `MiloMark` takes 9–11 down the 12–14 branch: **Milo ages DOWN into a face, never up
> into a monogram.** `globals.css` gains a scoped `[data-band="9-11"]` block carrying the pre-teen
> kit's own values (navy `#0A1026`, ink `#EAF1FF`, and the kit's **violet**, which no teen band uses,
> so the band is visibly its own) — and 9–11 is added to the SHARED selector too, or it would get a
> palette and no fonts. ⚠️ The kids' `:root` theme is untouched, exactly as for the teen bands: the
> scope only applies inside a portal that sets `data-band`.
>
> ## ② ⚠️ ONLY THREE THINGS ACTUALLY DIFFER, AND THEY ARE NAMED IN ONE PLACE
> `roundsFor` · `resumesTier` · `hand`. **Ten rounds, not eight** (the length the band's own chapters
> have always been), and ⚠️ **9–11 NEVER RESUMES AT A DIFFICULTY** — chapter-craft: *"3–11 story
> chapters call useAdaptive with no start tier … if a chapter looks too hard on question 1, the tier
> is not the suspect; the generator is."* A nine-year-old coming back a week later and meeting their
> old top tier on question 1 is the fault that rule exists for, and pinning `startDiff` to 1 switches
> the warm-up offer off with it. Everything else — the loop, the board, the pad, the re-teach, the
> mastery exit — is shared, which is the entire point.
>
> ## ③ ⚠️ THE HAND IS NOW ONE FIELD, AND IT HANDS ITS NUMBER TO WHOEVER OWNS THE ANSWER
> Seven chapters each wired their own camera lifecycle, dwell commit, denial gate and remembered
> device pick — **the same ~80 lines, seven times, drifting.** A chapter now declares `hand: { reads,
> value?, ready?, when?, enter?, commits?, hint?, denied? }` and the shell owns both doors, the
> self-view, the gate, the arming ring and the held-over-pose guard.
> **The contract that makes ONE field serve two very different chapters:** the hand produces a NUMBER;
> if the AnswerPad is up for this question the number IS the answer, otherwise `enter()` folds it into
> the instrument's value and `commits()` decides whether that completed the answer or merely advanced
> it. That is what lets a tap-a-number round and a build-it-in-two-places tray share one field.
> Three rules came across with it, each already paid for elsewhere: ⚠️ **readiness is a hand IN FRAME,
> never `count > 0`** (a FIST is a real answer wherever zero is — CoinTray's `0.6` is six dimes and a
> fist); ⚠️ **the dwell key is the READING ALONE, never the slot** (slot in the key re-arms the timer
> the instant the slot advances, and a hand still showing 5 enters 5 twice — FitOut shipped `12` as
> `11` for exactly that); ⚠️ **the ring says only what was READ**, never whether it is right.
>
> ## ④ ⚠️ AND THE PORT WOULD HAVE SILENTLY DROPPED A BAND RULE — `coverage` WAS MISSING FROM THE SHELL
> `SkillBeat` has carried `coverage` for the 3–11 band for months and `GameShell` had no equivalent,
> so moving a chapter across would have lost it **without a single test going red.** The arithmetic is
> why it matters: `core/adaptive` promotes on 3-in-a-row and masters on a streak of 6 at the top tier,
> so a strong child is asked roughly **three questions at L1, ONE at L2 and TWO at L3** — anything
> late in the pool is asked only of a child who is struggling, i.e. **skipped as a reward for doing
> well** (measured on TickTock: a third of good runs missed a whole reading). Added as ONE field,
> because the bookkeeping the exit needs is exactly the input `makeTask` needs to spend a scarce round
> on something unmet. A chapter that declares none behaves byte-identically.
>
> ## ⑤ THE GATE — +13 tests, **13/13 planted regressions caught**
> [bandOnGameShell.test.ts](src/__tests__/bandOnGameShell.test.ts) drives the shell's own exported
> band predicates rather than re-implementing them, and source-checks the JSX half. Caught: the band
> losing its ten-round loop · 9–11 resuming a tier · the teen DEFAULT changing band · **a teen chapter
> growing a camera door** · a fist ceasing to be an answer · the dwell key taking the round index ·
> the mastery exit ceasing to wait for coverage · the second door ceasing to switch input · the band
> getting a palette but no kit tokens.
> ⚠️ **The one survivor was my own check being weaker than its rule:** `toMatch` on
> `config.makeTask(d, asked.current)` passes with ONE of its **two** call sites reverted — the
> sig-dedupe retry would then re-roll blind. Counted now, not matched. *Wherever a rule has to hold in
> N places, assert N.*
>
> ## ⑥ WHAT WAS DRIVEN
> **The 12–14 band, re-driven at 1280×720 after the change** — this shell runs 36 live chapters, so
> not regressing them is the whole risk. The Bank Account (integers) start card renders with **no
> second door** (`config.hand` is undefined there, which is the intended default), and the walkthrough
> runs: THE PLAN chalkboard, the account meter, narration, step controls. `next build` green.
>
> ## ⑦ ✅ THE PILOT IS BUILT AND DRIVEN — THE COIN TRAY (`decimals`) IS THE FIRST 9–11 CHAPTER ON GameShell
> **588 bespoke lines → a data file** (274 at the time, **252** once `kidKit` took the shared
> parts), and `story/CoinTray.tsx` is DELETED. `tsc` 0 ·
> **1010/1010** · `next build` 0 · **8/8 planted regressions caught** · 0 console errors.
> Everything that can be WRONG stayed in `story/cents.ts`, untouched — the ladder, the trap amounts,
> the grader, the miss lines and the anti-oracle `headline` rule, with its 31-test gate still driving
> them. **That is the whole argument for the port being cheap: this file re-shapes, it re-implements
> nothing.** What is genuinely new is the tray Instrument (~110 lines lifted from the old scene).
>
> **The contract that made one `hand` field serve this chapter:** `enterTray(v, n)` is the ONLY way a
> number gets into the tray, and BOTH the camera (`hand.enter`) and the tap pad call it, so the two
> paths cannot drift and `grade` never learns which moved it. `commits: v => v.slot >= 2` is what
> tells the shell an amount is finished rather than merely started.
> ⚠️ **The pad is part of the INSTRUMENT rather than `GameConfig.answerPad`**, deliberately: the
> shell's pad HIDES the instrument, and here the child has to watch the tray fill as they enter.
>
> ## ⑧ ⚠️ AND WRITING THE GATE CAUGHT A REGRESSION I HAD JUST INTRODUCED
> The new Tray read the RENDERED `value` in its tap handler, so **two taps inside one React batch
> both resolve `slot === 0` and the second overwrites the dimes instead of filling the pennies** —
> the batched-tap fault this repo has now met seven times, and the old chapter carried refs for
> exactly it. `setValue` being functional would not have saved it: the state advances correctly and
> the closure the next tap runs is still the old one. Mirrored in a ref, and gated.
>
> ## ⑨ WHAT WAS DRIVEN — the whole chapter, at 1280×720
> The briefing with **both doors** (`✋ Use the camera instead` is the quiet one) · the walkthrough
> with the chalkboard writing `0.6` while the tray fills to six dime ten-frames and an EMPTY pennies
> well — the fist case, on screen · the guided round answered **3 dimes then 0 pennies** through the
> tap pad, graded and advanced · **`1 / 10` in the corner, which is the band's ten-round loop proven
> rather than asserted** · scored round 1 (`0.6`) answered correctly and advanced to **2 / 10**.
> 0 console errors. The 12–14 band re-driven separately and unchanged.
>
> ## ⑩ ⚠️ AND THE FOUNDER CAUGHT THE PILOT'S ONE REAL LAYOUT FAULT ON A SCREENSHOT — THE TRAY WAS TINY
> **`FitSlot` runs at `max={1}` on a landscape frame: it only ever SHRINKS an instrument, never grows
> one.** The old bespoke chapter scaled its board UP to **2.2×** into the band it was given, and the
> port dropped that — so a tray authored at the old 8px pip rendered at 8px for ever and floated in a
> third of the frame with dark space all round it. **The rule for this shell: author an instrument at
> the size it should be READ at and let the shell take it down**, because the coins are the one thing
> here that has to be countable and so the last thing that should pay for the layout. `PIP` 8 → 15,
> and the wells, the point, the counts and the keys with it.
> ⚠️ **Which then wrapped the key row onto two lines** — ten keys at 58px plus nine gaps is 634px
> against a hand-typed `maxWidth: 620`. Measured on the DOM, not eyeballed. The cap is derived from
> the keys now (`10 * PAD + 9 * PAD_GAP`), so it cannot be 14px short again.
> ⚠️ **The preview pane rendered the app into a corner for the whole of this check** — the documented
> instrument fault — **through a resize, a reload AND a fresh tab.** Everything above is measured off
> `getBoundingClientRect` at a true 1280×720: **pad on ONE row, 10 keys, no h-scroll, and the only
> "overlaps" a layer sweep reports are the full-bleed motif and MiloMark, both by design.**
>
> ## ▶ OPEN
> ⚠️ **THIS LIST IS SUPERSEDED BY THE 🧱 BLOCK ABOVE — read that one.** Written when only the pilot
> existed, it said "nine chapters left" and "no chapter declares `band: '9-11'` yet"; six now do.
> The items that survived it verbatim are still open there: **the camera path has never been driven
> on the shell**, no ten-round run / re-teach / mastery exit, and **`FloorPlot` is react-three-fiber
> and cannot become a data file over a 2D shell**.
>
> The one thing recorded ONLY here, and still true: **`chapterLevel` is written for 9–11 on every
> submit and never read back** (the read is gated by `resumesTier`, the write is not). Harmless, one
> branch fewer, but the stored level for a 9–11 chapter is dead data.

> ⚠️ **THE THREE BLOCKS BELOW ARE THE SAME DAY AND THE LAST ONE IS PARTLY SUPERSEDED BY THE TWO
> ABOVE IT.** `story/AngleShop.tsx` no longer exists — the chapter is
> `teen/games/AngleShopGame.tsx` on GameShell — and `angles.ts` has lost its whole layout half. What
> the 📐 block records that IS still true and still enforced: the daily anchor, the week, the paper
> table, the no-obtuse-slope rule, the reason-argues-for-the-KIND rule, and the set-square staying on
> an exact-degrees round. Read it for WHY those exist, not for where the code is.
>
> 📐 **2026-08-14 — THE ANGLE SHOP GETS ITS DAILY ANCHOR AND THEN LOSES ITS PAINTED WORLD, ON TWO FOUNDER CALLS — AND READING THE SHIPPED CHAPTER FIRST FOUND THAT ITS TOP TIER COULD NOT BE ANSWERED BY KNOWING ANYTHING, AND THAT THE TWO MARKS THAT STATE THE ANGLE WERE BOTH DRAWN OFF IT. ⚠️ NOT COMMITTED — the founder has not been asked.** `tsc` 0 · **994/994 vitest** (was 972, **+22**) · `next build` 0 · **eslint 5 problems against 12 at HEAD, i.e. seven FEWER and zero new** · 0 console errors in a fresh tab · driven at 1280×720 and 640×320 · **19/20 planted regressions caught, the 20th proven INERT by measurement.**
>
> **The asks, in order:** *"in band 9-11 … joh angles and symmetry chapter hai usko bhi daily real
> world example se connect karna hai"* → on the two questions put to him: **split the world by verb —
> ramp for angles, paper for folds** · **keep the square-corner guide on exact rounds** → then, on a
> third question I had to raise mid-build: **one park, several things, each job naming its own** →
> and finally **"remove the background and that characters.. make it just like the neon one which we
> have in decimal, fraction chapters."**
>
> ## ⓪ ⚠️⚠️ THE TOP TIER WAS A LOTTERY, AND IT WAS ALREADY SHIPPING
> `useDegrees = d === 3` and `guideShown = d < 3`, so **every** exact-degrees round was asked with the
> set-square retired. The child got an arm at a start angle they cannot read (`showDeg={settled}` —
> correct, rule 1), ◀ ▶ at 5° a tap, **no readout, no scale, and nothing at 90° to judge against**,
> then `grade` demanding `deg === 85`. Half the rounds are angle rounds and a strong child gets ~2
> rounds at L3, so the chapter **ended** on a question that cannot be answered by knowing anything.
> FitOut's dead-button shape: the scaffold that retired was the only reference the exact question had.
> ⇒ The guide now stays whenever the job is `degrees`, whatever the tier. **On a KIND round it gives
> the ANSWER away and must go; on a DEGREES round it gives a REFERENCE away, which is what a set
> square is for.**
>
> ## ① ⚠️ AND THE ANCHOR THE PLAN RECORDED HAD NEVER REACHED THE CODE
> `grep -i anchor` over `angles.ts` + `AngleShop.tsx` returned nothing but a local variable; the
> briefing read *"It is Slate's first week on the crew"* — a job, not a thing a nine-year-old has
> done. [story-9-11-ar-plan.md §10](docs/story-9-11-ar-plan.md) has carried *"how steep the ramp or
> the slide is"* since it was written. **Factor Lab's desks, verbatim, one chapter along.**
>
> ## ② ⚠️⚠️ THE FOUNDER'S OWN ANCHOR CANNOT EXPRESS A THIRD OF THE CHAPTER, AND THE ARITHMETIC SAYS SO BEFORE ANY CODE
> **Obtuse is the beam swung PAST vertical, and real ramps live between about 5° and 40° — every
> slope is acute.** So *"make the ramp obtuse"* asks a child to build a thing that does not exist, and
> the shipped week did exactly that: `wants: 'obtuse'` on *"the approach ramp — a barrow has to get up
> it loaded"*, drawing a plank leaning backwards over the bank at 75° above the horizontal while the
> words said *"shallower"*. **I raised it before building rather than shipping it**; the founder took
> *one park, several things* — the ramp and the slide carry acute, the two things that genuinely OPEN
> past square (the park gate, the barrier arm) carry obtuse, and one upright (the hoop post) carries
> right. Each job names its own object, which is the structure the chapter already had.
>
> ## ③ ⚠️ AND THE SAME FAULT ONE LEVEL DOWN — DRIVEN ON SCREEN, IN ONE SENTENCE
> *"Make the slide SHARPER than a square corner — any steeper and it is a drop, not a slide."* The
> requirement says sharper and the reason says do not be steeper. Its sibling, *"push your bike up it,
> loaded"*, is true of the 30° L1 draws and plainly false of the 85° L3 draws — **and both are acute,
> so the round is correct and the world is lying.** ⇒ **A reason must argue for the KIND, never for a
> magnitude the tier is free to change.** Both acute reasons rewritten; gated by sweeping the reason's
> own words against the kind it belongs to.
>
> ## ④ ⚠️⚠️ THEN THE FOUNDER SAW IT AND KILLED THE PAINTED WORLD — AND HE WAS RIGHT
> I had generated three backdrops (a BMX spot with the ramp plank missing, a playground with the slide
> chute missing, a kitchen table), value-graded them against the cast, and wired a storybook scene
> with Slate and Milo in it. *"Remove the background and that characters.. make it just like the neon
> one which we have in decimal, fraction chapters."* The chapter now runs on **`preteen/kit.tsx`,
> accent `violet`**, exactly as The Coin Tray and The Pizza Counter do.
> ⚠️ **THE ANCHOR DID NOT GO WITH IT, AND THAT IS THE POINT WORTH KEEPING: it lives in the WORDS and
> in what the instrument IS.** The arm you turn is the ramp at the park; the sheet you fold is the
> fair's paper. That is exactly how money works in The Coin Tray, which is a neon lab and still the
> most daily-anchored chapter in the band.
> ⚠️ **And a whole class of fault went with the painting, which is worth more than the pixels:** no
> painted ground line means no `coverFit`, no site geometry, and **no share-of-an-IMAGE used as a
> share-of-the-VIEWPORT** — which had already cost this chapter one **3.6× blow-up** (see ⑥).
> **DELETED: 3 old backdrops · 3 backdrops generated and never shipped · Slate's 3 sheets** (she was
> cast by this chapter alone; the foreman bear survives in The Order Desk, so nothing went idle).
>
> ## ⑤ ⚠️⚠️ TWO MARKS WERE DRAWN OFF THE THING THEY MEASURE, AND BOTH HAD SHIPPED
> Caught by eye on a screenshot, as this repo's layout faults always are. The arc hangs off the
> vertex on a **zero-height** container, so `bottom: -20` resolves 20px below its TOP — and the path
> put the centre at svg-local `(20+arcR, 20+arcR)`, landing at **`(vx + arcR, vy − arcR)`**: the mark
> that STATES the angle, drawn a whole radius up and right of the angle. The set-square had the
> matching fault — its upright was right and its horizontal arm ran along the svg's top edge, **a full
> `size` above the fixed arm it is meant to lie on.** Invisible to every band, layer and type check:
> both elements are present, correctly sized, and in roughly the right region of the screen.
>
> ## ⑥ ⚠️ AND A GROUND LINE BELOW WHERE THE CONTROLS ALLOW ONE DOES NOT FLOAT THE CAST — IT EJECTS THE PICTURE
> The scale-to-close-the-gap term is `(vh − groundPx) / ((1 − share) · SCENE_H)`, so as `share` → 1
> the denominator → 0. Measured at 0.95 against a usable ground of 0.807: the backdrop rendered
> **4981px wide at x = −1850, with the working surface 1142px ABOVE the frame.** The gate that caught
> it then found the real ceiling is **`groundY/vh`, tightest on the SHORTEST frame** — 0.807 at
> 1280×720 but **0.756 at 640×270**. Recorded in chapter-craft even though the painting is now gone,
> because the next chapter to lay a scene over a ground line will meet it.
>
> ## ⑦ WHAT WAS ACTUALLY DRIVEN
> **1280×720:** the neon briefing with both doors · both demos beat by beat, including **the puck
> running the full length and off on the correct-answer shot** · the guided round answered with the
> steppers and **committed WRONG on purpose** → `125°` printed post-commit in mono, the miss line
> *"That's past the square corner — bring it in."*, and **the puck stopped dead at the vertex with the
> bump mark** — the `through=false` branch · 0 console errors in a fresh tab.
> **640×320:** the fold demo with all four axes on the square · **every fixed layer crossed with every
> other → 1 reported overlap, MEASURED and dismissed**: it is the full-width control CONTAINER, not
> its buttons — Milo's box is **26–90** and the nearest button starts at **233**, i.e. **143px clear**.
> ⚠️ That is centring doing the work rather than the reserve, so the reserve is now gated instead of
> assumed. No h- or v-scroll.
> ⚠️ A temp `?jump=` phase override was used to reach the guided round without sitting through 45s of
> demo each time, and **reverted and grepped (0 hits)**.
>
> ## ⑧ THE GATE — +22 tests, **19/20 planted regressions caught, RE-RUN AGAINST THE FINAL CODE**
> [angleShopGeometry.test.ts](src/__tests__/angleShopGeometry.test.ts). ⚠️ **The first mutation pass
> left FOUR survivors and every one was my own gate being weaker than its rule**, three of them this
> file's recorded shapes: ① `expect(ask.length).toBeLessThanOrEqual(ASK_BUDGET)` **moves with the
> constant** — loosening it to 400 stayed green while the question grew back onto the arm (pinned to
> the measured literal now); ② `toContain('{ANCHOR}')` **also matches `${ANCHOR}`** in the demo's
> template string, so deleting it from the briefing walked through (the `alt={` / `x_alt={` shape);
> ③ nothing source-checked that the SCENE calls `guideShown`, so `const guide = false` restored the
> dead L3 round with every module test green; ④ nothing asserted the chrome cleared the Menu button.
> **The second pass left four more**, and the same rule caught them: `toContain('LabBackdrop')`
> **passes on a local `const LabBackdrop = () => null`** — a name check cannot tell the kit's
> component from a shadow of it — and one check had been **deleted with the block around it** when the
> painted world went, which is its own lesson about moving tests.
> ⚠️ **The one survivor is INERT and is recorded as such rather than "fixed":** the arm's
> clear-Milo bound never binds, because `vw × 0.30` binds first at every swept size (192 against 233
> at 640×320, 540 against 806 at 1800×870). Left in deliberately, with the measurement in the comment.
>
> ## ▶ OPEN
> 1. ⚠️ **NOT COMMITTED, and `public/sw.js` is still v93.** The founder has not been asked.
> 2. ⚠️ **NO SCORED ROUND HAS BEEN PLAYED PAST ROUND 1, AND NO L3 ROUND AT ALL** — so the exact-degrees
>    round this session exists to fix has been driven only through the gate and the demo, never as a
>    scored round with the guide on screen. **That is the single most useful next drive**, and it needs
>    a run that is right just often enough to reach L3.
> 3. ⚠️ **No ten-round run, no re-teach seen fire, no mastery exit.** Same shape as The Pizza Counter's
>    open item; two runs are needed (a perfect one exits early, only an erring one walks all ten).
> 4. ⚠️ **STILL NOBODY HAS HELD A REAL HAND UP TO ANY OF THE AR — eighteen readings deep.** The tilt
>    path is unchanged by this session and everything above came through the steppers.
> 5. **Six backdrops and three character sheets were deleted**; the three park scenes were generated
>    (~7 credits) and never shipped. If the founder ever wants a painted 9–11 chapter again, that art
>    is recoverable from this session's history, and the value-grading numbers are in ⑥ and the
>    storyboard.
> 6. **Everything in the 📏, 🪙, 🍕 and ✋ blocks below still stands**, and the 🗑️ block (the two
>    deleted chapters, and the unanswered founder call on their rebuild shape) has moved to
>    [docs/handoff-archive.md](docs/handoff-archive.md).
> 7. Of this session's faults, **two came from reading the shipped code before touching it, one from
>    reading the founder's own anchor against arithmetic, three from driving it (one of them a
>    sentence contradicting itself on screen), two from measuring a backdrop against the cast, and
>    EIGHT from mutation-testing my own gate. None from the type-checker.**

_Older sessions (2026-06-15 → 2026-08-12) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision._
