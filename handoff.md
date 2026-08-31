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

> 🌙 **2026-08-31 — THE NIGHTLY HAD BEEN RED ON ALL 12 OF ITS RUNS SINCE THE DAY IT WAS CREATED, AND A REAL CHILD-FACING DEFECT HAD BEEN SITTING INSIDE IT FOR SEVEN NIGHTS. FOUR FAILURES, ALL FIXED; THE MECHANISM MEASURED ON THE RUNNER RATHER THAN GUESSED AT LOCALLY.** `tsc` 0 · **1684 passed, 1 skipped by design** · `next build` 0 · `start-card` **16/16** · Nightly E2E **218/218 — the first green run in that job's history**. **MERGED — PR [#71](https://github.com/RadlorInc/learn/pull/71) as `22d75fb`.**

## ① 🎥 THE ONE A CHILD WOULD HAVE MET: THE ESCAPE HATCH FROM THE CAMERA, HALF OFF THE SCREEN
The GameShell start card carries TWO doors on an AR chapter — `Turn on the camera` and
`Use taps instead`. At 640×320 the second rendered at **y 299–343 of 320**, cut in half, while the
camera button was whole. **A child who cannot or will not use a camera saw a screen whose only
complete option was the one they cannot take.** Every AR chapter had it (`anglesSymmetry` −28,
`areaPerimeter` −23, …), not just the `dataGraphs` the nightly named. ⚠️ Reachable by a 23px scroll
is not a defence: the affordance to scroll is invisible when the visible content looks finished.

## ② 📐 THE OTHER THREE — MEASURED IN CI, WHICH IS THE ONLY PLACE THEY HAPPEN
Locally the same screen passed with 10px to spare; the runner reported −13px. The measurement, from
the CI browser and from mine:

| | local (macOS) | CI (Linux) |
|---|---|---|
| start-card blurb | 116px / **5 lines** | 140px / **6 lines** |
| canvas probe, computed stack | 312.09 | **328** (+5.1%) |
| canvas probe, generic `sans-serif` | 296.81 | **296.81** |
| line-height · column · dpr · Chromium | 23.25 · 400 · 1 · 149.0.7827.55 | identical |

**One line = 23.25px = exactly the −13px the nightly reported.**
⚠️⚠️ **AND MY FIRST EXPLANATION FOR THE +5.1% WAS WRONG, WHICH IS WORTH MORE THAN THE NUMBER.** I
reported it as `next/font`'s generated fallback resolving to different physical fonts per OS. Chrome's
own `CSS.getPlatformFontsForNode` says **both platforms paint the declared face** — `IBM Plex Sans`,
`isCustomFont: true`, `document.fonts.status: loaded`, on macOS and on the runner. So the face is
**not** failing to load in CI (not a misconfigured runner) and the fallback is **not** what renders
(not a `size-adjust` failure) — the two candidates, both eliminated. Same face, ~5% wider on Linux,
which leaves platform text shaping; **two ruled out, the third not proven**, and nothing in the fix
depends on which it is. ⚠️ `document.fonts.check('15px "IBM Plex Sans"')` returns **false on both**
while the face is demonstrably painting — that API is the wrong instrument and is what produced my
earlier "not loaded" reading.

## ③ 🧱 THE FIX IS STRUCTURAL: THE CARD'S HEIGHT NO LONGER FOLLOWS THE TEXT
Buttons are `flex: 0 0 auto`; the blurb is the only thing that may give (`min-height: 0` + its own
`overflow-y: auto`). Height comes out of the words before it comes out of a tap target — this shell's
own rule, made structural instead of spent as spacing. **10px of clearance was one wrapped line from
failing, which is precisely what the runner was showing.**
Watched on the known-bad build: `Use taps instead` **−23 → +14**; `Switch it on →` **10 → −13 with
one line added** (the CI number) **→ +14 with four added**.

## ④ 🧪 THE SPEC, AND THE STRESS
`start-card.spec.ts` now covers **all 16 chapters that reach this card** (the 8 explore ones it was
written for + all 8 AR — ⚠️ its list was the eight that failed the day it was written, so it could
only ever re-catch those eight), asserts **both** AR doors exist, and asserts the property itself:
four extra lines of blurb must not push any control off. It also recognises a camera start button
(`Turn on the camera` has no arrow), which is why it had been reporting *"never reached a start
card"* for every AR chapter.
🔬 **`E2E_WIDE_TEXT=1`** widens every glyph's advance by 8% — deterministic anywhere, past the 5.1%
the two platforms differ by. **Dispatch-only (`wide_text` input), never on the timer**, where it
would become a red people re-run instead of read. ⚠️ It had to go in `start-card.spec.ts` too: with
the flag on and the pre-fix card restored, `all-chapters` at shortPhone reported **3 PASSED**,
because it enters by clicking the biggest control and never lands on the card. **On the known-bad
card it reproduces the CI failure verbatim on a Mac** — `top 288, −13px` — so it is a local proxy for
an environment I otherwise cannot reach.

## ⑤ 🚨 THE BIGGEST FINDING IS NOT A CHAPTER: A CHECK THAT HAS NEVER BEEN GREEN WAS NEVER A GATE
12 runs, 12 red, from the day the workflow was created (2026-08-19). Nobody read one, so ① sat in the
open inside it for seven nights. The founder's rule is now its own row in [CLAUDE.md](CLAUDE.md):
**a new CI job must go green on the commit that adds it, or it does not land.**
✅ And the job now tells someone — one issue on failure, updated in place, **closed by the first
green**. All three paths watched on a scratch branch rather than assumed: filed (#70, naming the
failing test and commit) → commented in place, no duplicate → **closed** on green. ⚠️ #70 was a
deliberate test of the alarm, not a regression; it is closed with a comment saying so.

## ▶ OPEN
1. 🕒 **GREEN IS NOT THE RESTING STATE YET — EVERY GREEN RUN SO FAR WAS HAND-DISPATCHED.** The cron
   (03:15 UTC) has never once produced a green, and the schedule itself is therefore untested in
   exactly the way the notifier was. **It is not wired until a run nobody dispatched appears green.**
   Check `gh run list --workflow "Nightly E2E"` for a `schedule` event after 2026-09-01.
2. 🔴 **THE HULL SILENCE IS STILL UNMEASURED** — see the 🗒️ block. `docs/voice-check-for-tester.md`
   is ready to forward and `__miloSpeech()` is verified live on production.
3. ⏭️ **The `counting` case of `ready-bar.spec.ts`** is still flaky, untouched by this work.
4. 🔴 **CARRIED FORWARD FROM THE ARCHIVED 🔒 STAGE 3 BLOCK (moved 2026-08-31), because they are
   launch blockers and would otherwise leave this file with the block:**
   - **Step 3 — the watched test-mode purchase — is DEFERRED with a hard deadline: BEFORE STAGE 4.**
     Every link is tested; **nothing has watched a real Stripe event become a seat row.**
     [docs/billing-stage-3.md](docs/billing-stage-3.md) §0.
   - **B12: Supabase Pro** before any live key and before `enforced` is ever true. Founder's.
   - **`DRAFT = true` — the privacy policy and ToS are still placeholders.** You cannot charge a
     parent under a placeholder ToS.
   - **The free chapter set is still a PROPOSAL** (`billing_schema.sql` seeds Option A and says so).
   - **Nine Dependabot PRs open and untriaged** (#28–#47); do not merge as a batch.
   - Vercel Web Analytics still off; two prose-drift notes (the `error_events` fkey comment, and the
     anon-INSERT comments that say "not applied" when it was applied 2026-08-24).
5. ⏭️ **What the wide-text stress has NOT been run against**: the full 70 × 3 sweep. It was run on
   the start card (16/16) and on three chapters at shortPhone. One dispatch with `wide_text: true`
   would cover the rest; worth doing once after any layout change, not on the timer.

> 🗒️ **2026-08-30 — A SECOND TESTER PASS ON TWO 3–5 CHAPTERS, AND THE ONE CROSS-CUTTING ASK: EVERY CHAPTER NOW CARRIES A TYPED LINE OF DIRECTIONS. ⚠️ THE FIRST VERSION OF THAT FEATURE WAS CLIPPED ON ONE OF THE TWO CHAPTERS THAT ASKED FOR IT — A FLOATING CARD LAID OVER EIGHT CHAPTERS' OWN BANNERS — AND THE FIX WAS TO STOP STACKING, NOT TO RE-RANK.** `tsc` 0 · **1684 passed, 1 skipped by design** (see ⑤) · `next build` 0 · **26 mutations planted, 26 caught** · `e2e/directions` **8/8** · sw **v151**. **PR [#69](https://github.com/RadlorInc/learn/pull/69) OPEN — not merged; #68 merges first.**

**The feedback.** Shape House: *"instead of Milo saying 'yes' when the correct answer is chosen, he should say something along the lines of 'great job'"*, and *"when I got the hull part, Milo's voice seems to not speak."* Measuring: the title should be **Measuring**; *"Take one back"* should be **Add block** / **Remove block**; and — *"this goes for all chapters"* — **a little box in a corner with typed directions.**

## ① 🏠 SHAPE HOUSE — THE PRAISE, AND THE BEAT THAT WAS ACTUALLY SILENT
- The guided round said `Yes! The triangle fits!`; it says **`Great job!`** now. The scored rounds already rotate `core/praise.ts` (`Great job / Nice work / Well done / You got it / Lovely`) — verified by driving the chapter, not by reading it.
- ⚠️ **`opening` WAS DECLARED PER BUILD AND RENDERED NOWHERE.** The move from the house to the boat was a silent 850 ms pause with no word said or written — and **the hull is the first thing asked for once it is over**, which is exactly where the tester lost the voice. It is spoken AND written now, and the interlude holds **2100 ms**: the next round's question is spoken the moment it resolves and `speak()` cancels whatever is still talking, so a shorter hold cuts the line off mid-word.
- Also fixed in passing: the demo said *"the walls is missing"*. The square's label is `wall`.

## ② ⚠️⚠️ THE HULL SILENCE IS **NOT** FIXED, AND THE INSTRUMENT TO SETTLE IT IS THE DELIVERABLE
**What was measured:** driving the chapter with `speechSynthesis.speak` wrapped, every round — including *"The hull needs a rectangle"* — reached `speak()`. **That is the wrong question**, and it is the same wrong question that was asked the last time this was reported: it says the call happened, not that audio came out.
**The founder's hypothesis, which is the right one to test:** the known Chromium behaviour where synthesis stops after roughly fifteen seconds of cumulative speech, or on a long utterance, **with no error raised**. The hull is late in the sequence, so by then the chapter has spoken a lot.
⚠️⚠️ **AND IT CANNOT BE TESTED IN EITHER BROWSER THIS SESSION CAN DRIVE.** In the in-app pane AND in real Chrome under automation, **utterance ZERO never fires `start`** — on the app and on a blank page alike — while `speechSynthesis.speaking` stays `true` for ever. No audio is produced at all, so a run there is a world in which the bug cannot occur; a green or red from it would mean nothing.
✅ **So what shipped is the measurement, not a fix:** `speechDiary()` in `useMiloSpeaker.ts`, exposed as **`window.__miloSpeech()`**, recording per utterance `{text, at, started, ended, error}` (last 60, Milo's own lines only, **deliberately not dev-gated** — the fault only ever appears on a real device on production).
📋 **HOW TO SETTLE IT, on a device with a working voice:** play Shape House to the boat, and the moment the voice goes quiet run `__miloSpeech()` in the console.
- `hung > 0` (started, never ended) → **the Chromium stall is confirmed**; the mitigation is an unconditional `pause()/resume()` ping while speaking (today's keepalive only resumes `if (paused)`, which a stall does not set) plus keeping lines short.
- `silent > 0` with `engine.speaking: true` → the synth never started at all, which is a different fault and points at the device/voice, not at length.
- everything `started`+`ended` → the words were produced and the problem is elsewhere (volume, the clip path, the child's attention). **Do not claim any of the three without the numbers.**

## ③ 📏 MEASURING — TITLE AND CONTROLS
`Measurement` → **`Measuring`** (menu name and parent-dashboard label). **`Add block`** / **`↩ Remove block`**, visible text and `aria-label` both, gated as a pair so they cannot drift.

## ④ 🗒️ THE TYPED DIRECTIONS, IN ALL 72 CHAPTERS — AND WHY THE FIRST VERSION WAS WRONG
**The words come from the catalogue's own `hint`**, which is already `Record<ChapterType, …>`-complete: every chapter has a line **by construction**, and a second per-chapter map is exactly what would let one ship with none. Two hints were rewritten from topic to action (`shapes` → *"Tap the shape that fits the empty hole!"*, `measurement` → *"Lay blocks, then tap Done!"*).
- **12–18 (`GameShell`)**: a **flex child of the header row**, beside the chapter title. Dropped there as a `fixed` card first, it covered the title at 640×320 — measured. In the row an overlap is not expressible.
- **The 3–11 storybook chapters**: a small `pointerEvents: none` strip on the Menu row, wired once in `ChapterPortal` (+ counting's own wrapper), so 24 chapters get it from one place.
- ⚠️⚠️ **AND THE PART THAT WAS WRONG AND IS THE LESSON: A FLOATING STRIP ON THAT ROW IS EITHER OVER THE QUESTION OR UNDER IT.** Eight story chapters draw their own banner there — MeasureIt lifts its question pill to `pillTop(short) = 14` to buy height for the blocks, ShapeStudio and SeesawPark sit at `top: 12`, SliceShop and TickTock at `CHROME_PAD`, and BlockYard/BuildingBlocks use `yard.tsx`'s `BANNER_TOP`, which is **25px on a 720-tall frame**. Ranking the strip underneath them (z 42) kept the question readable and **clipped the directions to "Lay blocks to t…" on one of the two chapters the tester asked for**. Founder's call, and it is the right one: **do not stack — the chapter's own banner carries the line.**
  - `ownsChromeRow()` (in `features/chapters/directions.tsx`) suppresses the strip for those eight; `SkillBeat`'s prompt pill carries the line inline for the ones that have a pill, `yard.tsx`'s shared banner for BlockYard/BuildingBlocks, and **Milo's bubble** for SliceShop and TickTock — the two that set `prompt: () => ''`, whose scored rounds would otherwise show no directions at all.
  - ⚠️ **HopAlong is deliberately NOT on the list** even though its round row sits at `top: 40`: it renders no pill there (its ask is a pill at the bottom), so the strip has the row to itself. **Measured at 640×320, not assumed.**
- ⚠️ **The prose was the lever, exactly as chapter-craft says.** With the direction inline, MeasureIt's pill ran 86 → 553 and slid 10px under the ← Menu button; shortening the hint to *"Lay blocks, then tap Done!"* put it at 123 → 553, clear. A hint budget of 50 characters is gated, because both surfaces render one line.

## 🔬 VERIFIED BY MEASURING, AT 640×320, ON ALL EIGHT CHAPTERS THAT CARRY THE LINE THEMSELVES
`e2e/directions.spec.ts` (needs a dev server; not part of `npm test`). Three mechanisms per chapter,
none of which subsumes another — plus a fourth added when giving four chapters their own line made
their banner taller: the line must not move onto a control either.

⚠️⚠️ **THE FIRST VERSION OF THAT SPEC COULD NOT SEE THE DEFECT IT WAS WRITTEN FOR, AND THE FOUNDER
SPECIFIED IT.** Text equality + `scrollWidth`/`clientWidth` **passed on last session's clipped
build**: the whole string was in the DOM and the chapter's question pill was painted OVER it. **The
defect was occlusion, not overflow.** Re-written as a paint-order check it goes red naming
`BUTTON(z45) 192,12,447,57` — MeasureIt's own pill. ⚠️ And its own first draft skipped that button by
filtering on `position !== 'static'`; the covering pill IS static and takes its stacking from an
ancestor. **Two wrong instruments in a row for one defect.** The general rule is now the founder's,
at the top of [CLAUDE.md](CLAUDE.md): *an assertion that passes on the known-bad state is not a check.*

| chapter | carrier | box | rendered === hint | covered | on a control |
|---|---|---|---|---|---|
| Measuring | pill, inline | 352,31 → 496,45 | ✅ | none | none |
| Shape Studio | pill, inline | 334,63 → 495,77 | ✅ | none | none |
| Seesaw Park | pill, inline | 351,63 → 487,77 | ✅ | none | none |
| Slice Shop | Milo's bubble, own line | 85,73 → 574,87 | ✅ | none | none |
| TickTock | Milo's bubble, own line | 192,73 → 467,87 | ✅ | none | none |
| BlockYard + | yard banner, own line | 117,107 → 369,120 | ✅ | none | none |
| BlockYard − | yard banner, own line | 117,91 → 369,104 | ✅ | none | none |
| Building Blocks | yard banner, own line | 342,91 → 595,104 | ✅ | none | none |

⚠️ **AND FIVE OF THE EIGHT NEEDED A DIFFERENT SHAPE, WHICH ONLY LOOKING AT THE SCREEN SHOWED.**
Inline after a SHORT question in a pill is right (the three the feedback named). Forced into a wide
banner or a small bubble it breaks: SliceShop wrapped to `Halves, thirds and / quarters!` against the
right edge of a 610px bubble, BlockYard orphaned `numbers!` on a line of its own, and TickTock's
bubble is 13px on a short frame — 0.58em of that is **under 8px**. Those four (five chapters) take
`block`: its own centred line under the question, with a **floor** on the size so a small container
cannot shrink it away. Screenshots of all eight in `docs/verification/2026-08-31-directions/`.

## 🧪 24 MUTATIONS, 24 CAUGHT — AND ONE SURVIVED FIRST AND IS WORTH KEEPING
`src/__tests__/chapterDirections.test.ts`. Every check here is about a STRING A CHILD READS, which nothing else in the repo can see.
⚠️ **The one that survived: deleting `chapter="fractions"` from SliceShop's PLAY bubble left the gate green**, because the same chapter's LESSON banner carries the same string — the count-the-right-thing trap from CLAUDE.md, again. The check is anchored on the play call AND counts both occurrences now, and the same was done for TickTock.
⚠️ **The exception list is a claim about eight chapters' layout held in a ninth file**, so each entry is pinned to the expression it claims (`pillTop`, `CHROME_PAD`, `BANNER_TOP`): change one of those layouts and the gate fails rather than rotting.

## ⑤ 🟡 THE ONE SKIPPED TEST — NAMED, BECAUSE "1684/1685" READS AS GREEN AND IS NOT
`npm test` reports **1684 passed, 1 skipped**. The skipped one is
`src/__tests__/skillGraphAudit.test.ts › skill graph · edge sensitivity › ranks every edge by what a
wrong one would cost`.
- **Skipped, not failing and not flaky.** `describe.runIf(process.env.GRAPH_SENSITIVITY)` — opt-in,
  off by default because it re-runs every diagnosis once per edge. Nothing in it is
  non-deterministic; the flag is about runtime, not stability.
- **It passes when you run it:** `GRAPH_SENSITIVITY=1 npx vitest run src/__tests__/skillGraphAudit.test.ts`
  → **8 passed in 25.9s**, run 2026-08-31. A skip is not evidence, so it was run rather than assumed.
- **Pre-existing, not this branch's.** Introduced `d5f02ad` (2026-08-22, the skill-graph audit day)
  and byte-identical to `main` — `git diff main` on that file is empty.
📄 It is here so the next person does not rediscover it as a mystery, and so the headline number
stops being quoted as if the suite were wholly green.

## ▶ OPEN
1. 🔴 **THE HULL SILENCE IS UNRESOLVED AND UNMEASURED.** See ②. It needs one run on a device with a working voice and a paste of `__miloSpeech()`. **Nothing in this session may be read as having fixed it.**
   📄 **The deliverable is the note, not the diary**: [docs/voice-check-for-tester.md](docs/voice-check-for-tester.md)
   is written for the tester, assumes no technical knowledge, and is the thing to forward — ⚠️ **only
   once this is deployed**, or its last step answers `__miloSpeech is not defined` and they have spent
   their time for nothing.
2. 🎙️ Recorded clips for 3–11 remain the founder's to start (a voice choice and the ElevenLabs spend) — and if ② turns out to be the Chromium stall, clips route around it entirely for the lines that have them.
3. ⏸️ **PR [#69](https://github.com/RadlorInc/learn/pull/69) is open and NOT merged.** Merge order agreed with the founder: **#68 first** — which turned out to be already done (merged 2026-08-28, see 5) — then rebase #69 onto `main`, which was a no-op for the same reason. Both handoff blocks are present and neither replaced the other.
4. ⚠️ **The intro/demo screens of BlockYard, BuildingBlocks and HopAlong** show the line only where their banner or the pill renders; no chapter is left without it in a scored round, which is where it was asked for.
5. ⚠️⚠️ **AND A CORRECTION I OWE THIS FILE: I REPORTED PR #68 AS OPEN AND FLAGGED A `handoff.md`
   MERGE COLLISION WITH IT. BOTH WERE FALSE.** #68 merged on **2026-08-28 as `e2be6d2`**, three days
   before this session and BEFORE the commit this branch is based on — so it was already in `main`,
   there was never a collision, and the rebase was a no-op (`git merge-base --is-ancestor` says the
   branch already contains all of `main`). **Where the claim came from: this file's own ▶ OPEN item,
   written by the 2026-08-28 session hours before its PR merged, and never updated.** I read stale
   prose and repeated it as current fact without asking GitHub — the reader's half of CLAUDE.md's
   own rule, *do not amplify a finding past the evidence it arrived with*.
   ⚠️⚠️ **AND THE RELAY HAD TWO NODES, NOT ONE — the founder's own half, added by him.** He
   reconfirmed *"merge #68 first"* **twice, in two separate replies**, without checking GitHub
   either, and thanked me for flagging the collision. **A claim repeated back as an INSTRUCTION is
   what makes it look confirmed**: it stopped reading as my guess and started reading as the agreed
   plan, which is why neither of us looked for three exchanges. The producer's rule is *do not
   report what you have not watched*; the consumer's is *do not repeat it back as a decision*.
   Neither half catches this alone — the second is what turns an unverified line into a schedule. ✅ Every "#68 is open" line in this file is corrected
   below. **A PR's state is one `gh pr view` away; this file is not a source of truth for it.**
6. ⏭️ The `counting` case of `ready-bar.spec.ts` is still flaky (2026-08-28), unchanged by this work.

> 📏 **2026-08-28 (second pass) — THE STUDENT RAISED "I CANNOT SEE ALL THE NUMBERS" A SECOND TIME, AND IT WAS A SECOND, SEPARATE MECHANISM: THE NUMBER IS DRAWN OUTSIDE THE SPRITE'S BOX AND EVERY BAND HELPER RESERVES FROM THE BOX. FIXED, PLUS THE SAME FAULT FOUND UNREPORTED ONE FUNCTION ALONG IN CHAPTER 4.** `tsc` 0 · **1641/1642** · `next build` 0 · **7 mutations planted, 7 caught** · sw **v150**. **PR [#68](https://github.com/RadlorInc/learn/pull/68) OPEN** — pushed, not merged. Full detail in ③ and ▶ OPEN 2 of the block below.
>
> ⚠️ **AND THE VERIFICATION SWEEP FOR IT WAS BLIND FOR ITS FIRST TWO RUNS** — it read `L.huddleRight` (the field is `huddleRightPct`), so half of it measured `NaN` and reported a confident **0 findings** while its positive control fired on the *other* half. `vitest` does not type-check. See ③.

> 🎓 **2026-08-27/28 — A STUDENT'S FOUR-POINT REVIEW, ALL FOUR FIXED AND LIVE: THE RUN NOW RESUMES (AND STOPS DESTROYING THE SCORE), THE NEST CHAPTER SAYS WHAT TO DO, EVERY STORYBOOK CHAPTER HAS A COMMIT STEP, AND MILO PRAISES 3–8. ⚠️ THREE REAL COLLISIONS FOUND BY DRIVING IT — ONE A `position: fixed` SILENTLY TURNED ABSOLUTE BY AN ANCESTOR'S `transform`, ONE SKILLBEAT'S OWN PILL LYING ACROSS A COLOURING PAGE.** `tsc` 0 · **1639/1640** (was 1590) · `next build` 0 · `ready-bar` **18/18** · `chapter-resume` **4/4** · `needs-sound` **2/2** · **49 mutations planted, 49 caught** · sw **v149**. **MERGED — PRs [#65](https://github.com/RadlorInc/learn/pull/65) · [#66](https://github.com/RadlorInc/learn/pull/66) · [#67](https://github.com/RadlorInc/learn/pull/67). LIVE on production, verified in the deployed bundle.**

**The review** (a student, on the 3–5 band): ① the line behind mother looks random for every species but the rabbit · ② sharpen the instructions, praise a right answer, add a repeat button and subtitles · ③ the Ready option should be in every game · ④ *"none of my progress saved and I had to restart"*. ⚠️ **The chapter numbering in the report is off**: ① is chapter **2** (`FollowTheLeader`), the feeding-nest game is chapter **3** (`NestTree`).

## ① 📏 FIXED AND MERGED
Same report as the 🐇 block below — [PR #65](https://github.com/RadlorInc/learn/pull/65), merged
2026-08-28. ⚠️ **Its sibling was never measured — see ▶ OPEN 2.**

## ⚠️⚠️ ③ THE TESTER RAISED "I CANNOT SEE ALL THE NUMBERS" A SECOND TIME — AND IT WAS A SECOND, SEPARATE CAUSE. THE NUMBER IS NOT INSIDE THE SPRITE'S BOX, AND EVERY BAND HELPER RESERVES FROM THE BOX.
The 2026-08-21 fix (three rows → two, `maxSizeForRows` + `spreadBand`) was correct and closed the
BURIAL cause. It could not close this one: `NumberTag` is drawn at `top: -d*0.72` — **outside** the
creature's box — while `fitBands` proves the *head* clears `BANNER_PX` and `spreadBand` clamps the
far row to the same line. So the band fitted perfectly and the NUMBERS sat behind the prompt pill.
- **Measured live at 640×320, scored round 1:** the middle tag rendered at **y 82–121** against a
  pill occupying **155–485 × 48–93** — 28% of the badge covered — and `elementFromPoint` at its top
  returned **the pill button**. After the fix the same tag sits at y 115–146, `hiddenByPillPct: 0`,
  and `elementFromPoint` returns the scene. Sprite 92 → 74px: a readable number beats a bigger bunny.
- **It binds only on the shortest frame.** 812×375, 1024×400 and 1280×720 all measured 0% hidden;
  46 of 420 modelled combinations failed, every one at 640×320.
- **The fix is a `topPx` on the three shared helpers** (`maxSizeForRows` · `fitBands` · `spreadBand`)
  — *what this chapter draws above a head* — defaulting to 0, so `BigOrSmall` and `PlayTime` are
  untouched. Chapter 2 measures it off the PROVISIONAL size, the same two-pass trick the head gap
  already uses, because the lift depends on the size that depends on the lift.
- **Gated** in `followTheLeaderHuddle.test.ts` — the top of the TAG, driven through `waitSpot` and
  `tagLift`, plus a check that the reserve's formula IS `NumberTag`'s. **4 mutations, 4 caught**
  (drop `topPx` from the band · from the size cap · make the parameter inert · understate the lift).
  `tsc` 0 · **1641/1642** · `next build` 0 · sw **v150**. ✅ **Committed and pushed —
  PR [#68](https://github.com/RadlorInc/learn/pull/68) — ✅ **MERGED 2026-08-28 as `e2be6d2`** (this
  line said "OPEN, not merged" until 2026-08-31; it was written hours before the merge and is what
  led the next session to report a collision that did not exist).**
- ⚠️⚠️ **AND MY OWN SWEEP WAS BLIND FOR ITS FIRST TWO RUNS, WHICH IS THE LESSON WORTH KEEPING.** It
  read `L.huddleRight` — the field is `huddleRightPct` — so every `waitSpot` came back `NaN` and the
  BURIAL half of the sweep reported a confident **0 findings**. `vitest` does not type-check, so it
  ran clean; `tsc` caught it only because the file was still on disk. The banner half was valid
  because it reads `.top`, so the run looked half-alive rather than dead. **A positive control on
  one mechanism says nothing about the other mechanisms in the same sweep** — the rows=3 control was
  firing the whole time, on the half that worked. Fixed, the control reports 426 findings including
  *"tag 2 38% under sprite 1"* on turtles, the tester's original words.
- ✅ **Chapter 4's `AskSign` was checked for the same overhang and is CLEAR — but on x, not on y.**
  50 combinations put the sign above `BANNER_PX`; the pill is centred (155–485 at 640 wide) and Milo
  stands far right, so the sign sits at ~509–624 and misses it. True by luck rather than by
  construction, and worth a gate line if that chapter's layout ever moves.

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

## 📋 THE TESTER'S SHEET, AUDITED AGAINST THE DEPLOYED SITE — 2026-08-28
`Chapter_Testing_tester2` (Drive, owner kuwarirafi@) had **six rows still `Open`**. Every one was
checked against **production** (sw v149 at the time), by driving it, not by reading this file. Every
bundle search carried a positive AND a negative control.

| # | issue | sheet said | measured |
|---|---|---|---|
| 1 | answer-choice grammar | Ready for Retest | ✅ live — new wording present, `"Yes, on their own"` gone |
| 2 | Milo's robotic voice | Open | ❌ **correctly open** — captured the utterances going to `speechSynthesis` on prod; the 605 clips are 12–18 only |
| 3 | turtle spacing / numbers | Open | ✅ fixed **2026-08-21** (`99e1d94`) — drove 5 turtles at 640×320, all five numbers visible. ⚠️ **then re-raised, and the second cause is real — see ③** |
| 4 | "Amazing! Amazing!" | Resolved | — not re-verified |
| 5 | smallest-first line spacing | Open | ✅ fixed — drove 4 turtles behind mother: body gaps **6 · 5 · 6 px**, head gap −11px by design |
| 6 | nest game | Open | ✅ 3 of 4 — captured on prod: *"Feed the chick in nest number 4. Tap the nest that says 4!"* and *"Yes! Nest number 2! Great job!"*, 🔊 present. ⚠️ subtitling the QUESTION's number stays refused: sound→glyph IS the skill |
| 7 | Ready everywhere | Open | ✅ drove **Ready ✓** on prod in the counting AND nest chapters. ⚠️ send/pay chapters keep their own verb |
| 8 | saving game status | Open | ✅ `milo-chres-` in the prod bundle, `chapter-resume` drives 4/4. ⚠️ **signed-in children only** — the logged-out preview stores nothing by design, so retest from a child profile |

**So five of six can move to Ready for Retest; only #2 is genuinely open.** ⚠️ The sheet was NOT
edited — that is the founder's to do.

⚠️ **AND THE GATE FOR #7 IS FLAKY.** `ready-bar.spec.ts` failed on `counting` locally (240 s timeout,
*"never reached a commit control"*) while the bar works on production — the driver has to catch
paraders in a narrow on-frame window. **A flaky gate gets re-run instead of read**, so #7's guard is
not trustworthy even though the feature is. Not fixed; next in line.

## ▶ OPEN
1. 🎙️ **RECORDED CLIPS FOR 3–11 ARE THE ONLY THING LEFT FROM THIS REVIEW, and they are the founder's
   to start** (a voice choice and the ElevenLabs spend). The pipeline already exists — `clipKey`,
   `voiceClipPlayer`, and 12–18's clips. Until then a voiceless device gets the notice above instead
   of an unwinnable round, which is honest but is not the fix.
2. ✅ **PR [#68](https://github.com/RadlorInc/learn/pull/68) MERGED 2026-08-28 as `e2be6d2`** — chapter
   2's tag overhang (③) and chapter 4's cluster scale (④). ⚠️ This item read "OPEN AND UNMERGED"
   until 2026-08-31 and was believed by a later session; corrected there, see the 🗒️ block's ▶ 5.
3. ⚠️ **THE `counting` CASE OF `ready-bar.spec.ts` IS FLAKY** — it failed locally on a 240 s timeout
   (*"never reached a commit control"*) while the bar demonstrably works on production, because its
   driver has to catch paraders inside a narrow on-frame window. **A flaky gate gets re-run instead
   of read**, so the guard on "Ready is everywhere" is not trustworthy even though the feature is.
   Fix the DRIVER, not the chapter. Not started.
4. ✅ **`clusterSpot` (chapter 4's gathered huddle) IS MEASURED NOW — 2026-08-28 — AND IT WAS THE SAME
   FAULT, WORSE.** Flat `GATHER_COL = 5.4`% per column at a flat `scale: 0.8` against aspects 0.805 →
   1.746: the share of each body still showing ran **74% (rabbit) to 26% (shark)**, and **driven live
   at 1280×720, five gathered fish read as three** — in the one place the child counts what they have
   chosen. Fixed with chapter 2's own lever, `clusterScale(src) = 0.8 × min(1, 0.805 / aspect)`,
   calibrated on the rabbit so the approved picture is untouched by construction; the pitch could not
   be the lever (the gather band leaves ~6.3% per column and a shark wants 11.7%). The row separation
   came free with it, 0.22 → 0.37 body heights, having been under this repo's own 0.55 floor.
   `src` is REQUIRED on `clusterSpot` — a default is what lets a caller restore the flat 0.8 green.
   Gated in `homeTimeGeometry.test.ts` §②b, driving `clusterSpot` at both ends rather than
   recomputing the rule; **3 mutations planted, 3 caught** (flat 0.8 · cap dropped · calibrated on
   the shark). `tsc` 0 · **1641/1642** · `next build` 0. ✅ **Committed and pushed in the same
   PR [#68](https://github.com/RadlorInc/learn/pull/68) as ③ — ✅ **MERGED 2026-08-28 as `e2be6d2`.**
   ⚠️ **Two things seen while driving it and deliberately NOT changed:** Milo's `AskSign` covers
   ~29% of the nearest gathered creature (it is anchored to him, and this predates the fix), and the
   gathered set is now 0.47 of the waiting one for a shark — a bigger depth jump than before, which
   is a founder call rather than a defect.
5. ⏭️ **What was deliberately NOT done on ②, so it is not re-litigated by accident:** the QUESTION's
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

_Older sessions (2026-06-15 → **2026-08-25**, including 🔒 **Stage 3** (the chapter gate and the screens — a lock that names what is behind it, and a paywall built inert but tested refusing), moved 2026-08-31 — ⚠️ its still-live items (the deferred watched purchase, B12, `DRAFT = true`, the free-set pick, the nine Dependabot PRs, Vercel Analytics, the prose drift) were lifted into the 🌙 block's ▶ OPEN rather than archived with it; including 💳 **Stage 2b** (the price ladder, checkout and the webhook — and the finding I published without measuring it), 🧾 **Stage 2a** (the seat materialiser) and 🚪 **the funnel day** (the check became optional, the demo route, and the `onComplete` corpse), all moved 2026-08-30 — ⚠️ their still-live items (B12, `DRAFT = true`, the nine Dependabot PRs, Vercel Analytics, the anon-INSERT prose drift) were checked against the 🔒 Stage 3 block first and are all recorded there; including 💳 **the billing-schema apply day** (applied to production and completely inert, and the rollback capture that caught a migration silently reverting a security fix), moved 2026-08-28 — ⚠️ its still-live items (B12, the nine untriaged Dependabot PRs, and RLS gating the RECORD rather than chapter CONTENT) were checked against the newer blocks first and are all still recorded there; including 🧾💳 **the Stage-1 billing schema day** (RLS, entitlement, the guard at all three write paths), moved 2026-08-27; including 🧾 **the ledger-repair day** (58 repo migrations relabelled to the versions production recorded, `perf_advisors` applied, and the dry-run computed rather than credentialled), moved 2026-08-25 — ⚠️ its one still-live item (the anon-INSERT prose drift) was lifted into the current ▶ OPEN rather than archived with it; including 🔐 **the road-to-a-paywall day** (the RLS suite that had never run once, three privacy gaps between the published copy and the system, the anon INSERT closed, and the security regression caught four minutes after shipping), moved 2026-08-25 — ⚠️ its still-live blockers (B1/B2 `DRAFT = true`) were lifted into the current ▶ OPEN rather than archived with it; including 🚦 **the production-readiness day** (three workflows green while doing nothing, the dead error sink, eight chapters unstartable on a landscape phone), moved 2026-08-25; including 🔬 the seven-learner-models day (moved 2026-08-24), 🕸️ the skill-graph sensitivity audit and 🎯 the diagnostic's 96–98% rebuild, both moved 2026-08-24; plus 🇺🇸 the US-spelling / SEO / region-migration day, 🔗 the social-handles day, ❓ the question-quality sweep and 🎚️ the adaptive-loop day, all moved 2026-08-22) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — moved 2026-08-24 — 🚚 **The Packing Shed + The Minibus Run** (the two 9–11 chapters that closed the multiplication/division content hole) and 🎯 **the diagnostic rebuild** (26–34% → 81–87%, the answer-surface fix and the first accuracy gate), and — moved 2026-08-23 — 📐 **the tester's-four-bugs / responsiveness-sweep / `useOnceGuard` day** (the StrictMode ref guard that froze ten chapters' demos in dev only, 683 → 2 sub-44px tap targets, and 20/20 storybook coverage), and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
