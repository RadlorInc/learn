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
> unverified end to end and only the founder can close it. Everything is committed and LIVE; prod is
> on **sw v138** (2026-08-23).
>
> 🔎 **THE DIAGNOSTIC — WHERE IT STANDS (2026-08-22), read before touching it**
>
> It was rebuilt from the answer surface up on 2026-08-22 and now names the exact planted root gap
> **96–98%** of the time (was **26–34%**), telling a child with a real gap they are on track **0%**
> of the time (was 10–38%). The contract is `src/__tests__/diagnosticAccuracy.test.ts` — it plants a
> gap, answers with each item's REAL guess rate, and gates exact-root, missed-gap, false-alarm,
> route and LENGTH. Spec: [docs/diagnostic-engine.md](docs/diagnostic-engine.md).
>
> ⚠️ **THE PRICE IS LENGTH, AND IT IS NOT SMALL.** Every answer is confirmed (a lead of two to pass,
> **three** to fail), so a child with a gap answers **29–50** questions and a child with NO gap still
> answers **20–36**. The intro copy says "about ten minutes" now — it said "2 minutes" while the
> thing was a coin flip. Founder's call, accuracy over length, stated twice.
>
> ⚠️⚠️ **AND THE HONEST CAVEAT: EVERY ONE OF THOSE NUMBERS COMES FROM A SIMULATION.** No real child
> has taken the new probe. It has been driven against seven learner models, five of which it was NOT
> designed for, and it degrades gracefully — see the 🔬 block. **The one thing that would settle it
> is a real child with a known weakness**, and only the founder can do that.
>
> ⚠️ **THE BOTTLENECK IS NOW THE SKILL GRAPH, NOT THE ENGINE.** `skillGraph.ts` is still v0.9 DRAFT:
> 130 prerequisite edges, none teacher-validated, and its own header says *"a wrong edge = a wrong
> root gap; do not ship the guarantee on a band until that band's spine edges are validated."* All
> 130 were measured on 2026-08-22 — **twelve decide a gap, twenty-one decide nothing** →
> [docs/skill-graph-audit.md](docs/skill-graph-audit.md) §1 is the teacher's one-hour list.
> **Until that hour happens, 96–98% means "the engine finds what the graph says", NOT "the engine
> finds the child's real gap."**
>
> 🚪 **AND SINCE 2026-08-25 IT IS OPTIONAL.** Nobody is forced through it: the offer carries a
> one-tap "Skip for now" that issues a `gradeStartPlan`, and it is re-offered exactly once (on the
> menu, after the child finishes a plan chapter) before retiring to the parent dashboard. **The
> probe itself is completely unchanged** — not shortened, no new modes, both 17–18 doors, the
> never-say-"on-track" rule intact. The short pass was measured and REJECTED as a length lever: it
> misses a third to a half of gaps in the bands where it saves any time, and 17–18 has none at all.
> ⚠️ So *"the diagnostic routes a child to their root gap"* is now true only of the children whose
> parents chose it; everybody else walks a grade-start plan that `advanceAfterChapter` refines from
> real play. Both are plans — nobody is handed 72 chapters.
>
> ✅ **AND IT IS LIVE NOW** — pushed 2026-08-23 as part of `9cc7787..6dd9224`. Production serves the
> 96–98% probe; verified on the live site (the door reads *"about 10 minutes"*, 0 console errors).
> The caveats above are unchanged by shipping: the numbers are still simulated and the graph is still
> v0.9 DRAFT.

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

> 🎓 **2026-08-27/28 — A STUDENT'S FOUR-POINT REVIEW, ALL FOUR FIXED AND LIVE: THE RUN NOW RESUMES (AND STOPS DESTROYING THE SCORE), THE NEST CHAPTER SAYS WHAT TO DO, EVERY STORYBOOK CHAPTER HAS A COMMIT STEP, AND MILO PRAISES 3–8. ⚠️ THREE REAL COLLISIONS FOUND BY DRIVING IT — ONE A `position: fixed` SILENTLY TURNED ABSOLUTE BY AN ANCESTOR'S `transform`, ONE SKILLBEAT'S OWN PILL LYING ACROSS A COLOURING PAGE.** `tsc` 0 · **1639/1640** (was 1590) · `next build` 0 · `ready-bar` **18/18** · `chapter-resume` **4/4** · `needs-sound` **2/2** · **49 mutations planted, 49 caught** · sw **v149**. **MERGED — PRs [#65](https://github.com/RadlorInc/learn/pull/65) · [#66](https://github.com/RadlorInc/learn/pull/66) · [#67](https://github.com/RadlorInc/learn/pull/67). LIVE on production, verified in the deployed bundle.**

**The review** (a student, on the 3–5 band): ① the line behind mother looks random for every species but the rabbit · ② sharpen the instructions, praise a right answer, add a repeat button and subtitles · ③ the Ready option should be in every game · ④ *"none of my progress saved and I had to restart"*. ⚠️ **The chapter numbering in the report is off**: ① is chapter **2** (`FollowTheLeader`), the feeding-nest game is chapter **3** (`NestTree`).

## ① 📏 FIXED AND MERGED
Same report as the 🐇 block below — [PR #65](https://github.com/RadlorInc/learn/pull/65), merged
2026-08-28. ⚠️ **Its sibling was never measured — see ▶ OPEN 2.**

## ④ 💾 THE PROGRESS LOSS WAS WORSE THAN REPORTED — IT DESTROYED THE SCORE, NOT THE PLACE
`SkillBeat` and `GameShell` both report **once, at the end**: that single `onComplete` is what writes
the session row, the stars and the XP. So leaving after seven of ten questions lost the seven
answers too, and every screen showed the chapter as never played. New `infra/storage/chapterResume.ts`
(round · score · question history · coverage), wired into **both** engines, so it covers all 72
chapters. Written after every scored answer — there is no exit event for a closed tab — cleared on
every path that ends a run, 7-day TTL.
⚠️ **What a resume deliberately does NOT skip in GameShell: the start card.** It carries
`unlockSpeech()` (a real gesture, or the whole run is silent) and, on an AR chapter, **both camera
doors** — jumping into play would put a child in front of a camera nobody re-consented to. Gated.

## ② 🔊 ONE REAL DEFECT, ONE INVISIBLE AFFORDANCE, ONE FOUNDER REVERSAL
- ⚠️ **THE SPOKEN INSTRUCTION ITSELF WAS NOT SHARPENED UNTIL A SECOND PASS — I JUDGED IT CLOSE
  ENOUGH AND IT WAS NOT.** It said *"Feed the duckling in nest number 7! Number 7."*, which names
  WHAT is wanted and never WHAT TO DO; the only place the action appeared was the WRITTEN prompt, on
  a band whose children cannot read. Now *"Feed the duckling in nest number 7. Tap the nest that
  says 7!"* — the student's own sentence. Gated in `nestTreeCopy.test.ts`, which also pins the
  opposite constraint sitting right beside it: the drawn prompt may never contain a digit, because
  the skill is sound → glyph.
- **The demo's teaching was speech-only.** `NestExplain` spoke three lines and wrote none, and this
  band has no recorded clips — so on the many Chrome installs with no voice the chapter's entire
  explanation was delivered into a channel that is not there. Written now.
- **The repeat button already existed and could not be seen**: SkillBeat's prompt pill has always
  been a `button` with `aria-label="Hear it again"` and nothing visible saying so. It has a 🔊 now.
  ⚠️ And the **guided round had no replay at all** — the one screen where the child answers first.
- **Spoken praise on a correct answer** reverses the recorded *"a tick is enough"* call. Founder's
  decision. Rotating, and short enough to fit the 1300 ms gap before the next question cancels it.
- ⚠️ **Subtitling the QUESTION would delete the chapter** — the number is spoken and never written
  because the skill IS sound → glyph. Subtitles are in the demo, where teaching is the point.

## ③ ✅ READY IS EVERYWHERE — 13 CHAPTERS CONVERTED, 10 ALREADY HAD ONE
⚠️ **The band is RETRY-IN-PLACE, which changes what Ready can honestly be.** A wrong tap sets `erred`
and the child goes again; the round only ends when they are right. So a Ready gating the GRADE could
only ever be pressed on a correct answer — an oracle, and one that cannot change an outcome. Built as
**tap CHOOSES, Ready SUBMITS**: it appears for any choice, so it says nothing, and a wrong commit is
still marked wrong and still retried. Shared `story/ReadyBar.tsx` + a neutral `PICKED_RING`.
⚠️ The ten that already commit keep their own words — you *Pay ✓* a shopkeeper, *Warp her ✓*, *Put it
up ✓*. Renaming them to "Ready" would be worse.
⚠️ **RainbowTown is the one that works differently and is named as such**: a colouring page, so the
child's paint goes ON the picture and can be painted over until Ready. The LESSON is untouched.

## ⚠️⚠️ WHAT DRIVING IT FOUND THAT NO GATE COULD
1. **`position: fixed` is NOT fixed inside a transformed ancestor.** Nested in NumberTown's answer
   row (`transform: translateY(-50%)`), the bar was drawn from the ROW's box — **y 189–236, across
   the middle door, which that round was the right answer**. Same nesting in the counting chapter.
2. **MarketDay / StoryTime**: centred, the bar covered the `3 × 3 = ?` readout completely (190–237
   against 193–235). Those pass `align="right"` now; the free space is sideways, not upward.
3. **BeadShop**: the centred bar sat across the middle bead. Right-aligned.
4. ⚠️ **My own sweep was pressing the button it was measuring**, submitting the answer and reporting
   *"never reached a commit"* on two working chapters — a red that describes the driver.
📄 General rules written into [docs/chapter-craft.md](docs/chapter-craft.md) §1, §0b and §4.

## ✅ THE FIVE LOOSE ENDS, CLOSED
- **Praise has an AGE cutoff, not an engine one** — `core/praise.ts` · `praisesOnCorrect(band)`.
  ⚠️ **It STOPS AT 6–8** (founder's call, 2026-08-28). It shipped reaching through 9–11 for a few
  hours, which cuts against this product's own rule that **9–11 must not look like 3–8** — the whole
  reason that band moved onto the Field Lab design — and the student who asked was reviewing 3–5.
  Gated on the band and never on the engine, because 9–11 is split across both: an engine-shaped
  rule praises the same child in two chapters and not in the other ten.
- **The resume is DRIVEN now** — `e2e/chapter-resume.spec.ts` plays two rounds, leaves for `/menu`,
  comes back and asserts the round AND the score, reading the record straight out of IndexedDB.
  ⚠️ **With a positive control**: the same drive with no active learner must store nothing and
  restart, or the test cannot tell "it resumed" from "there was nothing to resume".
- **The sweep's exemption list is EMPTY** — all 13 driven, and the two "unreachable" chapters were
  both DRIVER faults: stale coordinates for creatures that were still walking on (click inside the
  page, not by coordinate), and a canvas grid too coarse to land on a balloon.
- **The world picker fits** — its card was `clamp(200px,26vw,300px)`, width-derived with no `vh`
  term, so the 200px minimum won at 640×320 and forced a second row off the bottom.
  `min(26vw,40vh)` keeps desktop at 288 and lets a short frame shrink instead of wrapping.
- **The prompt pill no longer eats the colouring page.** `SkillBeat`'s pill is a real `<button>`,
  fine everywhere the answers sit in a band it does not use and a DEAD PATCH over a picture that
  fills the frame: measured at 640×320 it spanned x 181–459, y 48–93 against a balloon at
  x 415–490, y 15–120, so a tap at the centre of the answer hit the pill. RainbowTown sets
  `prompt: () => ''`, draws its own `pointerEvents: none` banner and puts the 🔊 beside Menu.
  `elementFromPoint` at the question's centre now returns the CANVAS, and that is the gate.
  ⚠️ It also broke a shared anchor: `storybook-pills` identified SkillBeat's pill by
  `aria-label="Hear it again"` alone, and the chapter's own bare 🔊 carries the same label — so the
  spec read it as a duplicate. It matches on the pill CARRYING THE QUESTION now.
- **Merged and live**, sw **v149**.

## 🔁 THE SECOND DAY: THE OTHER ENGINE, A CHAPTER THAT NEEDS SOUND, AND A FLAKE THAT WAS MINE
- **The resume is driven on `GameShell` too**, not just the storybook engine — `wordProblems` (non-AR,
  answers on the shared AnswerPad, whose dev-only `data-test-answer` lets a driver answer without
  solving the sum). Two right, one WRONG, leave, come back: re-enters at 4/10 having stored
  `{round: 3, correct: 2, wrong: 1}`.
  ⚠️ **The first version of that check was mostly decorative.** Two of four mutations SURVIVED —
  seeding `correct` from 0 (the "3 / 10" a child sees is driven by `idx` and says nothing about what
  they got right) and seeding `wrong` from 0 (a run of only right answers leaves it 0 either way, so
  the check agreed with the bug by never disagreeing). Both observable now: the drive reads the
  ledger back AFTER resuming and deliberately gets one wrong on the way out.
  ⚠️ It also measured that `idx`'s `useState` seed is belt-and-braces (`finishDemo`'s `loadTask`
  overwrites it) while `correct`/`wrong` have no second writer — noted in the shell so the asymmetry
  is not mistaken for redundancy and tidied away.
- ⚠️⚠️ **THE FEEDING-NEST CHAPTER IS UNANSWERABLE WITHOUT A VOICE, AND NOW SAYS SO.** It SPEAKS the
  target number and deliberately never draws it — sound → glyph is the skill. Every other chapter
  writes its question too and so a silent device costs them warmth; this one it costs the ANSWER, and
  `speakSteps`' silent fallback does not help (it paces the demo, it does not deliver the number).
  **The fix is NOT to write the number** — that turns listening into matching. `useNoVoice()` + a
  notice addressed to the grown-up stands in until the band has recorded clips.
  ⚠️ Voices arrive LATE (`voiceschanged`), so a first read of "none" is the question asked too early —
  hence a hook, not a constant. ⚠️ And simulating it needs `addInitScript`: `_loadVoices` refuses to
  clear an already-populated list, so stubbing from the console after boot cannot flip it and reports
  "no notice" on a browser that really has none. Gated BOTH ways; the negative matters more, since a
  notice on a working device tells a parent their chapter is broken.
- ⚠️⚠️ **AND THE `counting` FLAKE WAS MY OWN FILTER, AFTER THREE CONFIDENT WRONG DIAGNOSES.** I blamed
  a cold dev server, then the parade being slow, then reached for seeding `Math.random` — which made
  it WORSE, because that chapter randomises spawn SLOTS as well as counts, so a fixed stream stacked
  the creatures and it began failing deterministically (a check failing about a world the app is
  never in). One instrumented run settled it: the driver reported **`eligible=0` for 148 of its 150
  seconds**. Its reachability filter demanded the ENTIRE box inside the frame, and those creatures are
  tall and stand low, so every one was excluded. It tests the CLICK POINT now — **~150 s and marginal
  → 9–11 s**. ⚠️ I had also called it "stable, 20/20 twice"; two warm-server runs is not evidence.
  📄 Both general rules are in [docs/chapter-craft.md](docs/chapter-craft.md) §4.

## ▶ OPEN
1. 🎙️ **RECORDED CLIPS FOR 3–11 ARE THE ONLY THING LEFT FROM THIS REVIEW, and they are the founder's
   to start** (a voice choice and the ElevenLabs spend). The pipeline already exists — `clipKey`,
   `voiceClipPlayer`, and 12–18's clips. Until then a voiceless device gets the notice above instead
   of an unwinnable round, which is honest but is not the fix.
2. ⚠️ **`clusterSpot` in `critters.tsx` (chapter 4's gathered huddle) HAS NEVER BEEN MEASURED.** It is
   the same bare-constant shape as chapter 2's line, which the student DID report and which is fixed.
   Nobody has said the huddle looks wrong and nobody has checked — it is recorded as unknown rather
   than folded into ①'s tick.
3. ⏭️ **What was deliberately NOT done on ②, so it is not re-litigated by accident:** the QUESTION's
   number is still never written. Subtitling it would turn a listening task into a matching one and
   delete the chapter. The action is spoken and written, the demo's teaching lines are written, and
   the target stays spoken-only.

> 🐇 **2026-08-27 — THE LINE BEHIND MOTHER WAS EVENLY SPACED FOR EXACTLY ONE SPECIES, AND THREE ROUNDS OF MUTATION EACH FOUND A HOLE IN MY OWN CHECKING — INCLUDING A TAUTOLOGY GUARDING THE ONE PICTURE THE FOUNDER HAD APPROVED.** `tsc` 0 · **1590/1591** (was 1584) · `next build` 0 · **10 mutations planted, 10 caught** · **PR [#65](https://github.com/RadlorInc/learn/pull/65) OPEN**, not merged.

**The ask:** *"For the bunny animals, all the children bunnies are evenly spaced behind the mother,
however for the fish, butterflies, turtles, ladybugs, and squirrels, they are randomly placed."*
Chapter is `numberOrdering` (`story/FollowTheLeader.tsx`) — the SECOND in the 3–5 band, not the
counting one.

## ① 📏 NOTHING WAS RANDOM — THE SPACING WAS IDENTICAL, THE BODIES WERE NOT
`LINE_GAP` steps a flat 9% of the width per place and reads as perfectly even in the source.
**Spacing is what is LEFT AFTER THE BODIES**, and the cast's aspects run **0.81 → 1.75**, so at
1280×720 the clearance between neighbours ran **+1.65% (butterfly, clean) to −1.07% (ant,
overlapping)**: bunny +0.76 a queue · fish −0.11 · ladybug −0.67 · squirrel −0.71 a heap. The rabbit
is one of the few with real clearance, which is *why* it is the one that looks right.

## ② 🎚️ THE FIX MOVES THE SCALE, NOT THE SPACING — BECAUSE THE SPACING IS IN A LOOP
Widening the gap per species makes the line LONGER, and the line's length decides the huddle's room
(`lineRight`) → the span → `babySize` → the gap. Circular, in a file whose header promises it is
not. Capping the **in-line scale** leaves every upstream number untouched, so the step stays a
constant and the line is evenly spaced **by construction**; a wide creature is simply drawn further
away, which is what the line already means. Every species now sits at the rabbit's own **0.74%**.

## ③ 👩 AND THE HEAD OF THE LINE IS A DIFFERENT GAP — SAME NUMBER, DIFFERENT NEIGHBOUR
Founder's follow-up: *"fish 1 still tucks under mother's body."* The first place sits next to
MOTHER at 1.25× against the line's own scale — the two bodies either side of that gap differ by
~1.7×. ⚠️ **Calibrated on the rabbit, not on zero:** animals queue nose-to-tail, the rabbit's first
little one sits ~21% of its own body inside her, and that is the approved picture — so the rule is
*nobody deeper in than the rabbit*, which leaves the good case untouched BY CONSTRUCTION. A
no-overlap rule would have moved it. **17–22% now, against 8–35%.** The circularity is broken by
running the size chain **twice**: the provisional pass always yields a size ≥ the final one, so the
reserve is never short, and one value feeds both the reserve and the drawing.

## ④ 🔬 THE INK HUNCH WAS WRONG AND MEASURING KILLED IT IN ONE PASS
It looked like ink-vs-box (a rabbit is narrow with transparent margins, a fish is a fat oval), which
would have meant a per-sprite ink table. Alpha bboxes across all ten walk sheets: **ink fills
0.95–1.00 of the cell for every one.** No margin to exploit; plain geometry. Thirty seconds against
an afternoon of building the wrong thing.

## ⑤ ⚠️⚠️ FOUR ROUNDS, EACH FINDING A HOLE IN MY OWN CHECKING — THE LAST ONE FOUND BY READING
1. `lineSpot(k, w, mx, scale, headGap)`: a `scale =` DEFAULT let a caller restore the overlapping
   line; with the default gone, passing `LINE_GAP` where `headGap` belonged restored the buried one.
   **Both type-checked, both green.** It takes the whole layout now — `lineSpot(k, L)` — so there is
   nothing left to hand over wrongly.
2. The checks recomputed geometry from the layout's REPORTED values, so *"draws at the flat gap"*
   and *"draws at a flat scale"* both survived: a gate re-implementing the rule it guards.
3. The reserve-vs-tail check compared a value with itself.
4. ⚠️⚠️ **AND THE CHECK PROTECTING THE RABBIT WAS A TAUTOLOGY:**
   `expect(L.lineScale).toBeCloseTo(Math.min(0.78, L.lineScale))` — and `lineScale` IS a
   `Math.min(0.78, …)`, so it compared a value with itself and would have passed on an
   implementation drawing the rabbit at a tenth of its size. **Found by re-reading the file to
   verify a claim, not by any run** — a tautology's green is indistinguishable from a real one.
   **No assertion in the file now reads `L.lineScale` or `L.headGap`**; every number comes out of
   `lineSpot(k, L)`. Three of the ten mutations (rabbit shrunk · line drawn tiny · line drawn on top
   of mother) would have SURVIVED the file as it stood two commits earlier.

## ▶ OPEN
1. ⏸️ **PR [#65](https://github.com/RadlorInc/learn/pull/65) IS OPEN** — three commits, CI not yet
   read at the time of writing. ⚠️ **It touches `handoff.md`, and so does PR
   [#64](https://github.com/RadlorInc/learn/pull/64) (Stage 3), which also ARCHIVES the Stage-1
   block. Whichever merges second will conflict on this file — both are insertions, so the
   resolution is to keep both blocks.**
2. ⚠️ **What was NOT changed, deliberately:** the waiting huddle's scatter. That jitter is a
   documented craft decision (*"a group is a huddle, not a queue"*) and evenly spacing it would
   reverse it. If the scatter is what reads as random rather than the line, say so.
3. ⏭️ **The same bare-constant shape is next door and untouched:** `clusterSpot` in `critters.tsx`
   (chapter 4's gathered group) spaces by a fixed `colPct` at a fixed `scale: 0.8`, with the same
   cast. Not measured, not fixed — flagged because it is the same fault waiting in the same file.

> 💳 **2026-08-25 (third pass) — STAGE 2b: THE PRICE LADDER, THE PRODUCTS, CHECKOUT AND THE WEBHOOK. TEST MODE ONLY, ENFORCED BY A THROW RATHER THAN BY A RULE SOMEBODY REMEMBERS. ⚠️⚠️ AND I REPORTED A DEFECT I HAD NOT MEASURED: THE SUITE WAS HALF A CHECK, THE SYSTEM WAS FINE.** `tsc` 0 · **1579/1580** (was 1535) · `next build` 0 · **17 mutations planted, 17 caught** · **`ci / rls-tests` reported `RLS_ASSERTIONS=74`** (73 → 74). **NOT applied, NOT merged.**

**The ask:** the confirmed amounts, *"record them in a constants module first"*, then **Stage 2b — products, checkout, webhook. Test mode only, as specced.**

## ① ✅ THE LADDER IS WRITTEN DOWN, WHICH IS THE THING STAGE 1 FAILED TWICE
`src/core/billing.ts` and nowhere else: **monthly $7.99 then $4.99 · annual $63.99 then $39.99**,
graduated, `up_to: 1` then `up_to: 'inf'` — **the 4-seat cap lives in the app, not in Stripe**, so it
stays changeable without a new product. Development values; the SHAPE does not move.
⚠️ **The totals test types the four numbers out** (`$12.98 / $17.97 / $22.96`, `$103.98 / $143.97 /
$183.96`). Computing `first + extra × (n−1)` would let the ladder *define* what is correct instead of
being *checked against* it — a restatement, not a check. Proven by mutation: `extra: 599` fails three.

## ② ⚠️⚠️ I REPORTED A DEFECT I HAD NOT MEASURED — AND THAT IS #15, NOT #14
**What I said:** `materialize_seats` carried `revoke all … from public, anon, authenticated` with no
grant back, the webhook arrives as `service_role`, therefore the first real purchase would have
seated **nobody** with the suite green.
**What is true:** measured against production, Supabase's default privileges grant
`service_role=X/postgres` explicitly on functions in `public` owned by `postgres`, and a REVOKE from
`public, anon, authenticated` cannot remove it. Four live functions of **identical shape**
(`enforce_learner_cap`, `enforce_grade_cap`, `enforce_grade_ownership`, `prune_error_events`) all read
`{postgres=X,service_role=X}` with `service_role_can_execute = true`. **The webhook could always have
called it. The impact I published was invented**, and M7 passed on its first run for that reason.
- ⚠️ **The real fault was mine, and it is the engagement's own rule turned on the person applying
  it:** I read the repo (*what did we intend*) and shipped a conclusion that only production could
  answer (*what is true*). One query, thirty seconds. **A check-shaped FINDING needs the same
  positive control as a check.**
- ✅ **What still stands, and is why #14 keeps its row:** *a negative assertion is satisfied by total
  absence.* M6 asserts `authenticated` is refused and is equally satisfied by a function nobody at
  all can call — **the SUITE was half a check** even though the system was fine, and no run of it
  could have told you which. Founder's rule, kept: **every REVOKE assertion needs a paired GRANT
  assertion, driven as the REAL caller.**
- The grant and **M7 stay**, relabelled as what they are: redundant today, and worth writing so the
  property stops depending on a platform default nobody in this repo controls. M7 has caught nothing
  and the comment says so.

## ③ 🔁 THE WEBHOOK'S THREE PROPERTIES ARE STRUCTURAL, BECAUSE NONE OF THEM SHOWS IN A GREEN RUN
**Idempotent** — `billing_events.stripe_event_id` is `unique`, so the DATABASE is the authority, not
a Set in a serverless instance's memory. ⚠️ **Keyed on `processed_at`, not on the row existing**: a
delivery that logs the event and then dies would otherwise be skipped for ever having done nothing,
with no error anywhere. **Order-independent** — nothing reads state from the payload; it takes the
subscription id and **re-fetches from Stripe**, so a late-delivered old event writes today's truth.
**Convergent** — upsert + a reconciler given a TARGET.
⚠️ **The grace window is DERIVED (`period_start + 7 days`), never stamped.** `now() + 7 days` moves
the deadline forward on every redelivery — an at-least-once channel quietly turning a 7-day grace
into an unbounded one, invisible on every screen.
⚠️ **`invoice.payment_failed` is deliberately not handled**: a failed renewal already emits
`customer.subscription.updated`, and a second source of truth buys nothing.

## ④ 🪤 `current_period_start` MOVED OFF THE SUBSCRIPTION
From API `2025-03-31.basil` (the SDK pins `2026-07-29.dahlia`) the period fields are on the
**item**. Reading the old place is `undefined` — no error, both periods null — and a null
`current_period_start` silently deletes **both** the grace window and `reassign_learner_seat`'s
one-per-period limit. The fixture puts a *different* value in the old place so the item's has to win.

## ⑤ 🧪 DRIVEN, NOT READ — 40 NEW ASSERTIONS, 12 MUTATIONS, 12 CAUGHT
`src/__tests__/billingStripe.test.ts` drives both routes end to end against a stubbed Stripe and a
stubbed PostgREST, with a **real signature** from the SDK's own `generateTestHeaderString` (so no test
depends on my reading of the scheme). C3 is the one only a drive can see: a stale payload saying
4 seats / `active` against a Stripe currently saying 1 / `past_due` — we write **1**. C8 asserts the
outbound call list is **empty** on a bad signature, because the status alone passes on a handler that
writes first and checks after. Mutations caught include *trust the payload*, *key idempotency on the
row*, *verify after logging*, *take the account from the request body*, and *drop the clamp* — that
last one matters because `seats_paid` has a CHECK, so an unclamped quantity of 7 fails the INSERT and
**loses the whole event**.

## ⑥ 🔒 TEST MODE IS A THROW
`stripeClient()` refuses anything that is not `sk_test_`, and the setup script uses the same
function, so there is one definition rather than a copy that drifts. Watched it fail for the right
reason on the real script. No price id is hard-coded (gated, with a positive control). Unset keys →
**503** everywhere and nothing else in the app notices. ✅ The SDK is **server-only — 0 hits for
`api.stripe.com` in `.next/static`**, with a positive control proving the search works.
📄 [docs/billing-stage-2.md](docs/billing-stage-2.md) §5 is the founder's step-3 runbook: create the
products, `stripe listen`, buy with 4242…, then **check `subscription_seats` has N rows** — the one
thing that would be empty if ②'s grant were missing while everything else looked perfect.

## ⑦ 👤 ONE STRIPE CUSTOMER PER ACCOUNT — THE `ponytail:` THAT WAS NOT HARMLESS
Founder's call, and he was right: the duplicate-customer case is harmless to **us** (everything keys
on `account_id`) and **not to Stripe** — a parent who cancels and resubscribes has their payment
history split across two customer objects, and Stage 4's portal has to pick one to send them to.
*"Which of your two customers is this parent"* has no good answer and gets worse monthly. Checkout
now reuses `subscriptions.stripe_customer_id` (⚠️ there is no `billing_customers` table — the id
lives on the subscription row). ⚠️ Read with **the parent's own token, never the service role** —
RLS already scopes it to their own row, and the key that bypasses every policy stays out of a route
a logged-in stranger can reach; gated by a sentinel that must appear in NO outbound call. ⚠️ A stale
id (deleted, or from the other mode) is retried once as a new customer, because a duplicate beats a
family that cannot buy. **5 more mutations, 5 caught.**

## ▶ OPEN
1. ✅ **MERGED AND APPLIED.** #60 (Stage 2a + 2b) merged; #59 closed as superseded; #61 captured the
   rollback and made CI run it; #62 recorded the apply. **`materialize_seats` is LIVE in production**
   as ledger version `20260825030558`, verified from the catalog and **fingerprint-matched to the
   artefact CI tested** — body `5ee877cc8970db10a0d6b8daac5082f3` and
   `service_role=true authenticated=false anon=false` on **both** sides. Advisors: **no new
   findings**, and `materialize_seats` is absent from the SECURITY-DEFINER-executable WARN list — a
   third instrument agreeing that `authenticated` cannot call it.
   ⚠️ **B12 did not block it and the rule was APPLIED, not skipped:** one function created, zero rows
   mutated, none of `sessions` / `learner_progress` / `learner_stats` touched.
2. 🔴 **B12 IS STILL THE FOUNDER'S AND STILL BLOCKS EVERYTHING FROM STEP 1.** Supabase Pro before any
   live key and before `enforced` is ever true.
3. ✅ **THE SQL HALF RAN, THREE TIMES.** `RLS_ASSERTIONS=74` on every run since. ⚠️ Read ② for what
   that green is and is not worth.
4. ⏭️ **STEP 3 IS NOW BLOCKED ON THE FOUNDER ONLY — the Stripe side.** ✅ Step 0 returns **1**.
   ✅ Both routes driven on a real dev server (`/api/checkout` 401 with no token,
   `/api/stripe/webhook` 503 unconfigured). Still needs: a `sk_test_` key (I must not create
   accounts or handle credentials) · `stripe listen`'s `whsec_…` · and
   `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, without which the webhook 503s before doing anything.
5. ⚠️⚠️ **THE PURCHASE RUNS AGAINST PRODUCTION, DELIBERATELY — founder's call, and the reason is this
   session's own principle.** *The point of the test is the PRODUCTION schema, function and grants; a
   throwaway project is a database nobody will ever pay against* — i.e. verifying where the failure
   cannot occur. **Three conditions, none optional:** ① record the Stripe customer and subscription
   ids BEFORE buying, so cleanup targets known rows rather than "everything that looks like a test"
   · ② clean up immediately after and **verify the cleanup by query** — not "ran the delete" but
   "queried and the rows are gone" · ③ **once**; needing to repeat it is the signal to reconsider.
   All three billing tables are **empty today** (measured), so the after-state is the same number
   rather than a judgement call. **Watch, in order: `stripe listen` → 200 · `subscriptions` one row
   `active` with `seats_paid = N` · `subscription_seats` N rows.** The third is the one that would be
   empty while the first two looked perfect. I read all three back from production myself afterwards.
6. ⏭️ **Then Stage 3 = UI**: the lock screen `sync_session`'s 42501 has been owed since Stage 1, a
   pricing page, the seat manager, and the customer portal.
7. 🔴 **`DRAFT = true` — the privacy policy and ToS are still placeholders (B1/B2).** You cannot
   charge a parent under a placeholder ToS, so this blocks going live as hard as B12 does.
8. 🟡 Vercel Web Analytics still off; the funnel this all hangs off is unmeasured.
9. ⚠️ **NINE DEPENDABOT PRs OPEN AND UNTRIAGED** (#28–#47). Do not merge as a batch.
10. ⚠️ **Prose drift, rescued from the block archived today rather than lost with it:**
   `20260817174352_privacy_and_leads_hardening.sql` and `src/app/api/lead/route.ts` still say the
   anon INSERT revoke has not been applied. It was, on 2026-08-24. Comments only, no behaviour.

> 🧾 **2026-08-25 (second pass) — STAGE 2a: THE SEAT MATERIALISER, THE ONE THING STAGE 1 LEFT DEAD. AND THE WHOLE OF STAGE 2 IS TEST-MODE-ONLY BY FOUNDER'S ORDER — NOTHING IN IT CAN TAKE A REAL CARD.** `tsc` 0 · **1535/1536** · **`ci / rls-tests` 64 → 73 assertions, green on a real Postgres** · **PR [#59](https://github.com/RadlorInc/learn/pull/59) OPEN, NOT MERGED, NOT APPLIED.** 🔴 **BLOCKED on the price ladder — see ▶2.**

## ① 🪑 `materialize_seats` — A RECONCILER, NOT AN INSERTER, AND THAT IS THE WHOLE DESIGN
Stage 1 created `subscription_seats` and never wrote a row to it: the tests insert seats by hand, so
entitlement was structurally correct and **practically dead**. This is the function the webhook will
call. ⚠️ **The Stripe webhook is at-least-once AND out-of-order**, so "add N seats" is wrong under
both — a replay costs a seat every single time. Given a TARGET it makes the world match, so replaying
changes nothing and any delivery order converges on whatever the last event said.
- ⚠️ **A downgrade takes EMPTY seats first, then the highest occupied ones.** 4 → 2 must not evict a
  seated child while an unoccupied seat sits beside them. Deterministic: the same downgrade always
  frees the same seat.
- ⚠️ **It CLAMPS an over-quantity rather than raising.** Stripe owns the quantity and losing a
  webhook is worse than clamping one — the same reasoning `subscriptions.status` carries no CHECK
  for. The column's own `check (seat_index between 1 and 4)` still makes a fifth row unwritable.
- **Nine assertions, DRIVEN against a real Postgres** (`ci / rls-tests`, `RLS_ASSERTIONS=73`): lowest
  indexes filled, a replay changes nothing, a seated child survives a downgrade, 7 clamps to 4,
  cancelling frees every seat without touching the child's record, and **`authenticated` cannot call
  it — asserted by ATTEMPTING it**, because a grant handed back by a later migration is invisible to
  the REVOKE in the source.
⚠️ **I cannot run that suite locally** (no psql, no Docker, no CLI on this machine). The PR exists so
CI runs it; nothing here was believed before the job reported 73.

## ② 🔒 TEST MODE FOR THE WHOLE STAGE — [docs/billing-stage-2.md](docs/billing-stage-2.md)
Founder's hard constraint: **no live keys, no live products, no live webhook, nothing that can charge
a real person, for all of Stage 2.** Two reasons, both outranking convenience: **B12 is still open**
(the first real payment is when losing that database stops being recoverable by apology), and
**checkout is the one piece that can charge someone before `enforced` has any say** — the flag gates
ACCESS, not PAYMENT, so `enforced = false` is *not* a safety net here and must not be sold as one.
**The go-live sequence, ordered, no step skipped:** ① B12 → ② the applied-schema fingerprint check
re-run against production → ③ **a test-mode purchase the founder watches end to end** → ④ live keys
→ ⑤ `enforced = true`. ⚠️ **④ and ⑤ are separate on purpose**: prove the payment path on real cards
BEFORE removing anyone's access. Enforced in code, not discipline — a gate asserts the configured key
is `sk_test_`, because a rule somebody has to remember is not a constraint.

## ▶ OPEN
1. ⏸️ **PR #59 is green and waiting** (`rls-tests` 73, `verify` green). Not merged, not applied.
2. ✅ ~~**THE PRICE LADDER IS RECORDED NOWHERE**~~ — **CONFIRMED AND WRITTEN DOWN 2026-08-25**, in
   `src/core/billing.ts`; see the 💳 block above. What follows is why it mattered. The SHAPE is settled and written down (graduated never volume · 4 seats · USD · tax off);
   the AMOUNTS exist only in the founder's head. Needed to finish products, checkout and the totals:
   the monthly ladder per tier, the annual equivalent, and how the annual discount is expressed (its
   own price object, or a % off monthly). **Write them into `billing-stage-2.md` the moment they are
   said.** ⚠️ The totals test hand-computes its expectations rather than deriving them from the
   ladder — otherwise a typo redefines "correct" instead of failing.
3. ⏭️ **Next, and unblocked:** the webhook + `billing_events` idempotency (`stripe_event_id` is
   already `unique`, so the DB is the idempotency authority, not application memory). Will add the
   `stripe` SDK — signature verification is a security path, not a place to save a dependency; it is
   server-only, so no client-bundle cost.
4. 🔴 **B12 remains the founder's and now blocks two things**: the pipeline, and every step of §② from
   ④ onward.
5. 🔴 **`DRAFT = true` — THE PRIVACY POLICY AND ToS ARE STILL PLACEHOLDERS (B1/B2).** A hard blocker
   for marketing maths to under-13s, and it now also blocks taking money: you cannot charge a parent
   under a placeholder ToS. ⚠️ **Carried up here on 2026-08-25 because it was about to be archived
   with the 🔐 block and existed nowhere else** — the same way "Vercel Web Analytics is still off"
   (⑥ below) was quietly lost when the 🚦 block was archived earlier the same day.
6. 🟡 **Production is still half-blind: Vercel Web Analytics is NOT enabled** (404 when checked
   2026-08-23). `error_events` receives rows since the service-role key landed, so crashes are
   captured; nothing measures traffic or the funnel this session just built. ⚠️ Which means **the two
   numbers in [docs/checkup-optional-metrics.md](docs/checkup-optional-metrics.md) are answerable
   from `learner_events` and nothing else is.**
7. ⚠️ **NINE DEPENDABOT PRs OPEN AND UNTRIAGED** (#28–#47). Do not merge as a batch — the standing
   warning about TypeScript 7 / eslint 10 / jsdom 30 still applies.

> 🚪 **2026-08-25 — THE FUNNEL: THE CHECK BECAME OPTIONAL, THE DEMO ROUTE SHIPPED, AND SIGNING UP NOW CARRIES THE PLAY ONTO THE ACCOUNT. ⚠️⚠️ AND THE THREE-MONTH `onComplete` P0 TURNED OUT TO HAVE LEFT ITS CORPSE IN PLACE — I WAS THE NEXT CALLER TO TRUST IT.** `tsc` 0 · **1535/1536** · `next build` 0 · e2e demo **3/3** + adaptive **2/2** · **9 commits, pushed** · prod **sw v145**.

**The asks, in order:** the pipeline decision · door 2 · durable resume · *"the check stays exactly as it is, unchanged, and becomes optional"* · the demo route · the local→server adopt.

## ⓪ 🧯 THE CHECK-SHAPED DEFECT CLASS IS NOW THE TOP OF CLAUDE.md, AND IT GREW TO THIRTEEN
Founder's call: the through-line is the organising principle, not a list. **A check is not a check
until you have watched it fail for the right reason. Green is not evidence. Present is not
enforcing. Found-nothing is not clean.** The instances are keyed on MECHANISM — a skip, a shape, a
moment, an order, a flag, a dead clause, a wrong target, a one-valued metric, an artefact without
the feature, a world without the bug, a proxy boundary, a drifted fixture — because *the point is
that pattern-matching will not find the next one.* **The table is meant to grow.**
⚠️ **#11 IS A DIFFERENT ANIMAL AND HAS ITS OWN SECTION**: not a check that cannot fail but **a wire
that is not connected while both ends read as connected** — see ②.

## ① 🎚️ THE CHECK IS OPTIONAL, AND THE SHORT PASS WAS MEASURED AND REJECTED
The founder had argued FOR forcing it, and reversed himself on the numbers: forcing was defensible
only while a MIDDLE option existed. Measured, the spine-only short pass is a bad trade in every band
— 6–8 halves the length and misses **45%** of gaps (exact 95% → 53%), 9–11 misses 32%, and **17–18
has no short pass at all** (`PROBE_SWEEP['17-18']` is empty, so spine IS the full agenda; a "quick
check" button there is a control that changes nothing).
So: **the check is untouched — not shortened, no new modes** — and skipping is one tap with no
confirmation. ⚠️ **OPTIONAL MUST NOT MEAN PLANLESS**: a skip issues `gradeStartPlan(band)`, and
`ActivePlan.source` now records where a plan came from, because *"Milo picked this to close the gap"*
is a straight falsehood after a skip. Re-offered ONCE, on the menu, after the child finishes a plan
chapter; a second decline retires it to the parent dashboard for good.
📊 Metrics + **pre-registered interpretations** in [docs/checkup-optional-metrics.md](docs/checkup-optional-metrics.md).

## ② ⚠️⚠️ THE `onComplete` P0 LEFT A CORPSE, AND IT WAS STILL WARM
`ChapterProps.onComplete` has been in every chapter's signature since the beginning; both registry
factories took it as `_props` and dropped it. **That is the P0 that stalled every child's plan for
three months.** It was fixed by moving the pointer into `finishAndSync` — correct — **and left the
prop in place, still typed, still passed, still discarded.** `/demo` is the next caller, and cannot
use `finishAndSync` at all (a logged-out visitor has no learner: `if (!learner) return`).
**What makes it its own class is that it is invisible from BOTH ends.** The caller believes it passed
a handler; the chapter shows its end screen either way. Only an e2e that plays a chapter to its end
and asserts *the demo advanced* can see it.
⚠️⚠️ **AND WAKING IT WOULD HAVE BROKEN ALL 72 CHAPTERS.** `/game`'s dormant `handleComplete` set
`chapterDone`, and the mount read `{!chapterDone && playingChapter && …}` — so the moment the wire
was connected, every chapter would have **unmounted the instant a child finished it**, taking its
own end screen with it. **Dead code is a trap with a timer somebody else starts.** Flag deleted.

## ③ 🚪 THE DEMO ROUTE, AND THE ADOPT THAT MAKES IT WORTH ANYTHING
`/demo`: band picker → the first two chapters of that band's `gradeStartPlan` (**the same plan a
skipper gets — no second curriculum to drift**), minus anything AR → then the account. No email, no
name, no account up front. The wall says what an account BUYS, never that the demo is spent.
`adoptDemoRun` runs at learner creation beside the pending-diagnostic replay it is modelled on: a
session per played chapter with stars/XP recomputed via the pure `scoreChapter`, and the plan's
pointer walked past what they played. ⚠️ **Peek-then-consume-on-match** — a band mismatch LEAVES the
run stashed. ⚠️ **A diagnosis outranks the demo for the PLAN**; the sessions are adopted either way.
⚠️ `GuardedChapter` gives `/demo` and `/teen-preview` **one** camera guard — two copies is the day
they disagree, and the disagreement shows a logged-out child a camera button.

## ④ 💾 DURABLE RESUME + 17–18's DOOR 2
The probe's resume moved from per-tab sessionStorage to **kv, per learner, 7-day TTL** — the old
comment argued for sessionStorage and was right when the probe was short; at 20–50 questions
"abandoned" means "ran out of evening". ⚠️ Across sittings it is **OFFERED, never applied** (silently
reopening question 26 leaves no route to a fresh check). Door 2 seeds the probe at a strand the
student names — `strandChoices` derives them from the spine, 17–18 only.

## ⑤ 🚦 THE PIPELINE: DECIDED, NOT BUILT
✅ **`migrate-prod` gets its own `production-db` environment**, created WITH its reviewer rule at
enable time and not before. ⚠️ **The casing trap in the last handoff was NOT REAL** — GitHub matches
environment names case-insensitively (measured). What IS real: `Production` is **Vercel's** (68
deployments), so a reviewer there would gate the whole site's deploy path to protect a schema apply,
and the first wedged hotfix removes it — taking the database protection with it.

## ⑥ 🧹 EVERY CHARACTER WINDOW IS GONE FROM THE GATES
Three in one session reported on text they never saw. Swept all 12 sites onto
`src/__tests__/_window.ts` (`balanced` / `element` / `strip`). ⚠️ **A negated class is also a proxy**
— `[^>]*` is a real bound in SQL and a lie in JSX, because `=>` contains a `>`.

## ▶ OPEN
1. 🔴 **B12 IS THE ONLY THING BLOCKING, AND IT IS THE FOUNDER'S.** Supabase Pro before `enforced` is
   ever flipped true and before any live Stripe key exists. It also gates the pipeline (⑤).
2. ✅ **The smoke test passed** (2026-08-25): a chapter played to completion on an established
   account, stars saved — progress writes survive the billing guard with the flag off. First time
   anybody had watched it.
3. ⏭️ **STAGE 2 — STRIPE, TEST MODE ONLY.** Founder's hard constraint: no live keys, no live
   products, no live webhook, nothing that can take a real card, for the WHOLE stage. Live keys are
   a deliberate later step — after B12, after the fingerprint check, and after the founder has
   watched a test-mode purchase end to end.
4. ⚠️ **NINE DEPENDABOT PRs STILL OPEN AND UNTRIAGED** (#28–#47). Do not merge as a batch.
5. ⚠️ Accepted limitation, unchanged: RLS gates the RECORD, not chapter CONTENT.

_Older sessions (2026-06-15 → **2026-08-24**, including 💳 **the billing-schema apply day** (applied to production and completely inert, and the rollback capture that caught a migration silently reverting a security fix), moved 2026-08-28 — ⚠️ its still-live items (B12, the nine untriaged Dependabot PRs, and RLS gating the RECORD rather than chapter CONTENT) were checked against the newer blocks first and are all still recorded there; including 🧾💳 **the Stage-1 billing schema day** (RLS, entitlement, the guard at all three write paths), moved 2026-08-27; including 🧾 **the ledger-repair day** (58 repo migrations relabelled to the versions production recorded, `perf_advisors` applied, and the dry-run computed rather than credentialled), moved 2026-08-25 — ⚠️ its one still-live item (the anon-INSERT prose drift) was lifted into the current ▶ OPEN rather than archived with it; including 🔐 **the road-to-a-paywall day** (the RLS suite that had never run once, three privacy gaps between the published copy and the system, the anon INSERT closed, and the security regression caught four minutes after shipping), moved 2026-08-25 — ⚠️ its still-live blockers (B1/B2 `DRAFT = true`) were lifted into the current ▶ OPEN rather than archived with it; including 🚦 **the production-readiness day** (three workflows green while doing nothing, the dead error sink, eight chapters unstartable on a landscape phone), moved 2026-08-25; including 🔬 the seven-learner-models day (moved 2026-08-24), 🕸️ the skill-graph sensitivity audit and 🎯 the diagnostic's 96–98% rebuild, both moved 2026-08-24; plus 🇺🇸 the US-spelling / SEO / region-migration day, 🔗 the social-handles day, ❓ the question-quality sweep and 🎚️ the adaptive-loop day, all moved 2026-08-22) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — moved 2026-08-24 — 🚚 **The Packing Shed + The Minibus Run** (the two 9–11 chapters that closed the multiplication/division content hole) and 🎯 **the diagnostic rebuild** (26–34% → 81–87%, the answer-surface fix and the first accuracy gate), and — moved 2026-08-23 — 📐 **the tester's-four-bugs / responsiveness-sweep / `useOnceGuard` day** (the StrictMode ref guard that froze ten chapters' demos in dev only, 683 → 2 sub-44px tap targets, and 20/20 storybook coverage), and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
