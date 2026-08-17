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
> ⚠️ **Biggest outstanding gaps, in order:** ✅ the camera path has been driven on the shell (The
> Empty Plot, span → dwell → graded) · ✅ the scratch-pad collision is FIXED (2026-08-16) · ✅ the
> walkthrough's missing `FitSlot` is FIXED (2026-08-16 — it had NO scale-to-fit on the legacy path,
> which is the path every 9–11 chapter takes) · **the EXPLORE beats were dropped and not replaced**
> (the largest remaining loss — The Height Bar's span reading now ships in no beat at all) · **the
> re-teach has never been seen fire anywhere in the band** · ⚠️ **AR has never been driven with a
> REAL HAND on a real camera** — MediaPipe is proven to boot on prod under the enforced CSP
> (`Graph successfully started running.`, 0 violations), but the band's defining feature is
> unverified end to end and only the founder can close it. Everything is committed; prod is on
> **sw v111**.
>
> ---
>
> _(Everything below is the running session history — newest first, most recent ~5 sessions only.
> Older blocks are in [docs/handoff-archive.md](docs/handoff-archive.md), which is NOT auto-loaded —
> `grep` it. This file is inlined into every session's context, so move blocks out rather than
> letting it grow. The craft rules live in chapter-craft.md, not here.)_

> ⚡ **2026-08-17 (2nd session) — A PERFORMANCE PASS. 57 MB OF ART WAS REVALIDATED ON EVERY REQUEST, EVERY BACKDROP SHIPPED AS FULL-SIZE PNG, AND EVERY CREATURE JOURNEY RELAID OUT THE DOCUMENT ON EVERY FRAME. NONE OF THEM CHANGED A SINGLE PIXEL, WHICH IS WHY THEY ALL SHIPPED — ⚠️ AND THE FOURTH FINDING, THE ONE I WAS SUREST OF, TURNED OUT TO BE DEAD CODE THAT NEVER RAN.** ⚡ SHIPPED — `main`@`a14ec20` (+1), prod serving **sw v111**. `tsc` 0 · **1089/1089 vitest** · `next build` 0 · **211/211 chapters × 3 frames, LOCAL AND AGAINST PRODUCTION** · eslint **132, unchanged**.
>
> **The asks:** a senior-performance-engineer pass → *"the things which you have flagged are fixed?"* → *"yes, do it"* (the Critter one) → *"commit it on main"* → *"yes push it"* → *"do this if it is important for future"* → *"what to do for this?"* → *"let everything scale"* → *"ab /game wala check karke batao kya karna hai"* → *"delete it and fix the handoff"*.
>
> ⚠️ **THE SHAPE OF THIS SESSION IS THE LESSON: EVERY TIME THE FOUNDER ASKED "IS IT REALLY DONE?", SOMETHING CAME APART.** "Are the flagged things fixed?" surfaced ④. "What to do for this?" turned a shrug about an ungateable header into a 6-mutation gate. "Check the /game one" turned a fix I had reported done TWICE into a deletion. **Nothing in the 1,071-test suite ever objected.**
>
> ## ⓪ ⚠️⚠️ THE BUNDLE WAS NEVER THE PROBLEM, AND THAT IS THE FIRST THING TO KNOW
> 170 chunks, largest **71 KB gzipped**, code-splitting already correct, `next/dynamic` per chapter.
> **JS is not this app's bottleneck and tuning it would have been wasted work.** The cost is 58 MB of
> PNG art and a handful of hot render paths. Measure before optimising; the obvious lever was inert.
>
> ## ① ⚠️⚠️ THE `/game` FIT CONTROLLER — **DELETED, BECAUSE IT NEVER RAN. AND MY FIRST DIAGNOSIS OF IT WAS WRONG.**
> It ran `setInterval(measure, 150)`, and `measure` closed over `stageBg` with `[]` deps — so it
> compared against the INITIAL value for ever, and that value is the literal `'var(--bg-page)'` while
> `getComputedStyle` always resolves to `rgb(252, 234, 182)`. Those can never be equal, so the guard
> was permanently true and `setStageBg` got a fresh object literal every tick. That reading is
> correct **as source** and I shipped a fix for it, gated 4/4, and reported it twice as done.
> ⚠️⚠️ **THEN THE PAGE WAS ACTUALLY DRIVEN, AND NONE OF IT WAS REACHABLE.** `.game-zoom`'s
> `firstElementChild` is **null while a chapter is fully on screen** — every path in
> `CHAPTER_COMPONENTS` (`makeStoryChapter`, `makeTeenChapter`, `CountingStoryChapter`) ends in
> `createPortal(…, document.body)`, so nothing has ever rendered in flow inside the wrapper.
> `measure()` returned at its FIRST guard, always; `getComputedStyle` sits after it, so the
> comparison never evaluated and `setStageBg` was never called. Measured over 6 s idle on a live
> chapter: **0 `getComputedStyle`, 0 `getBoundingClientRect`, 0 style rewrites — identical on the
> pre-fix and post-fix code**, with the counter proven live first (it registered the probe's own
> calls). **There was no 7×/s re-render in production, and no 6.7 reflows/s either.**
> **So the whole thing was dead code and is gone** — the effect, `zoom`/`zoomRef`,
> `stageBg`/`stageBgRef`, `fitRef`, the `.game-zoom` wrapper div, its three CSS rules, and
> `gameFitController.test.ts` (a gate on deleted code is worse than none). **118 lines out, 11 in.**
> ⚠️ **The lesson is the expensive one and it is not about this file:** a source-level gate proves
> the code says what you meant, never that anything reaches it — the same class as *a unit test
> cannot see that nothing calls the unit*, which cost this repo three months on the plan pointer.
> **I said "/game needs a sign-in so I cannot drive it" and stopped there, twice.** Driving it took
> two facts: the session lives under **`milo-auth`** (`client.ts` overrides `storageKey`, so the
> supabase default is a silent no-op) and the JWT must be well-formed or `getSession()` returns null
> and bounces to `/auth`. **When a gate cannot be driven, that is the finding — not a footnote.**

> ## ② 57 MB OF ART WAS REVALIDATED ON EVERY SINGLE REQUEST
> Production returned `cache-control: public, max-age=0, must-revalidate` on a **583 KB** backdrop —
> Next's default for `public/`. A conditional round-trip per file per load for every client the
> service worker is not controlling: a first visit, the load after an SW update, a private window, an
> evicted cache. **The single largest scalability item in the app, and it was a header.**
> **NOT `immutable`:** this repo has rewritten art IN PLACE (the 83→58 MB pass rewrote 86 files under
> their existing names), so a year would strand those clients. 30 days + a year of
> `stale-while-revalidate` gives the same zero-round-trip serve and still propagates.
>
> ## ③ EVERY BACKDROP SHIPPED AS FULL-SIZE PNG, THROUGH 34 COPIES OF ONE `<img>` IDIOM
> `next.config.ts` had AVIF/WebP configured since the C10 pass **and its own comment said it was
> waiting for exactly this**. One shared `shared/ui/SceneBg.tsx`. Measured off the wire:
> `garden.png` **583 KB → 81 KB AVIF (7.2×)** · The Clock **1,988 → 346 KB** · Follow the Leader
> **~2.3 MB → 270 KB (8.5×)**.
> ⚠️⚠️ **AND THE MIGRATION MADE FIRST PAINT WORSE ON FIVE CHAPTERS BEFORE IT MADE IT BETTER.**
> `next/image` **lazy-loads by default** and a raw `<img>` with no `loading` attribute does not — so
> the LCP element started waiting on an IntersectionObserver. **Caught by watching a chapter open
> onto a bare gradient, not by any test.** Every backdrop now names `priority` either way, gated.
> ⚠️ **Named `SceneBg`, not `Bg`, because four chapters declare a local `interface Bg` — and that
> combination COMPILES**, TypeScript letting the interface govern the type while the import governed
> the value. `ForestWalk`'s own local `SceneBg` is now `GradientBiome`; the gate found it.
>
> ## ④ ⚠️⚠️ EVERY CREATURE JOURNEY RELAID OUT THE DOCUMENT ON EVERY FRAME
> `Critter` travelled on `left`, `top`, `width`, `height` — all four are LAYOUT properties. Measured
> on the real component with CDP `Performance.getMetrics`, 63 creatures journeying for six seconds:
> **195 layout passes / 59.1 ms → 4 / 1.7 ms.** Now a `transform`, composited.
> ⚠️⚠️ **AND `translate(Xvw, Yvh)` IS NOT `left: X%` — THE OBVIOUS REWRITE IS SILENTLY WRONG ON THE
> ONE ROUTE CHILDREN PLAY.** `/game` wraps every chapter in `.game-zoom { zoom: … }`; a fixed
> element's percentage offsets are scaled by that zoom and viewport units are not. **Measured, they
> diverge by up to 576px at zoom 1.45.** The position stays a PERCENTAGE of a stage that is itself
> the size of the containing block. Size is `scale()` about `transform-origin: 50% 100%` — **the
> FEET**, which is what keeps a creature on its ground line.
> ⚠️ **The base box is `w / scale`, never `size`**: `w` and `h` are each rounded, and re-deriving them
> through a different rounding chain moved the visible creature **2.2px** and its strip **26px**.
> **Verified by a throwaway `critterlab` route: 2,772 rendered rects (sprite · sheet cell · contact
> shadow · number sign) over 63 combinations × 4 viewports × 3 zooms, before and after — 0 moved.**
> The baseline was captured TWICE first and required to be identical, because `ci_breathe` is an
> infinite 2px loop that made the first one jitter.
> ⚠️⚠️ **AND THAT PROOF WAS NARROWER THAN IT SOUNDED — IT FROZE ANIMATIONS.** The hop, the breathe
> and the `drop-shadow` filter live INSIDE the scaled box, so their px values now follow depth (hop
> 13 → 10.4px at scale 0.8, → 16.9px at 1.3); a `filter` offset never appears in a rect at all. The
> first cut then divided the contact shadow back out to keep it fixed, which left **the shadow saying
> "depth does not affect me" while the hop said it does.** Founder's call: **everything scales** —
> nearer is lower AND bigger, which is the cue chapter-craft already asks for.
>
> ## 🧪 THE GATES, AND THE ONE THAT SURVIVED
> Four new files, **all mutation-tested**: `gameFitController` 4/4 · `sceneBgPriority` 2/2 ·
> `critterTravelIsComposited` 4/4 · `assetCacheHeaders` 5/6.
> ⚠️ **I first said the asset headers were "not gateable". That was too broad and conflated two
> risks** — Vercel's optimizer behaviour is outside CI, but the `/assets` rule existing, matching and
> not being weakened is gateable through the pattern `cspHeader.test.ts` already uses (drive the real
> `headers()`). **Asked "what to do for this?", the answer was to write the gate, not restate the
> excuse.**
> ⚠️ **The survivor is the interesting one.** Widening the asset rule to `/:path*` so it swallows
> `sw.js` passed everything. Applied to a real `next start`, `/sw.js` still returned
> `max-age=0, must-revalidate` — the dedicated rule sits later and overrides — so the mutation is
> **inert, and measuring it confirmed the resolver's one assumption (last matching rule wins) against
> a running server** rather than leaving it a guess. The version that DOES change behaviour (widened
> **and** reordered below `/sw.js`) fails.
>
> ## 📉 VERIFIED ON PRODUCTION, AFTER CLEARING THE SERVICE WORKER
> `/assets` + `/audio` **30 days + SWR** · `/sw.js` still `max-age=0, must-revalidate` (or the update
> path dies) · optimizer serving **image/avif at 81,391 B** · one chapter **11 backdrop requests, all
> optimized, 0 raw PNG, 277 KB, exactly 1 eager** · 0 console errors · **211/211 against prod (17.9m)**.
> ⚠️ **`minimumCacheTTL` IS NOT WHAT PROD SERVES.** Same commit, same source header, two optimizers:
> `next start` gives `max-age=31536000, must-revalidate` (its floor), **Vercel passes the UPSTREAM
> header through** → 30 days + SWR. Fine, arguably better, and now commented in `next.config.ts`
> because a config reading 31536000 while prod reads 2592000 eats an afternoon.
>
> ## ▶ OPEN
> 1. ✅ **CLOSED — and it closed by deleting the thing.** /game WAS driven (see ①): the fit
>    controller never ran, so it is gone. **What to keep from it: a source gate proves the code says
>    what you meant, never that anything reaches it.** Reaching /game from a test needs the session
>    under **`milo-auth`** (not the supabase default — `client.ts` overrides `storageKey`) and a
>    well-formed JWT; that is worth two minutes next time rather than another "cannot be driven".
> 2. **`React.memo` is still absent everywhere** — deliberately. Fixing ① removed the pressure; adding
>    it speculatively is guesswork. If a chapter ever feels heavy again, this is the first lever.
> 3. **`Background` mounts every scene in a run at once** (up to 9 requests) so the cross-fade has
>    something to fade to. Design, not a defect, and at ~270 KB no longer worth touching.
> 4. **The Vercel optimizer inheritance is documented, not gated** — it is Vercel-side and invisible
>    to `headers()`. Re-measure with `curl -I` after any change to the `/assets` rule.
> 5. Everything from the previous session still stands: **`MONITORING_INGEST_URL` unset** is still the
>    highest-value founder item, B1 attorney, `practice_complete` never yet observed in the DB.
> 6. Of this session's faults, **the biggest was mine and it was a METHOD fault, not a code one**:
>    ① was diagnosed from the source, gated at the source, and reported done twice, and the whole
>    thing was unreachable. The rest: **two from measuring after guessing wrong** (a fixed 5s window
>    that missed the journey and read as "this costs nothing"; comparing a local server against
>    Vercel), **one from a founder question** (the hop/breathe gap my own sweep had frozen out), **one
>    from watching a chapter open** (the lazy LCP), **one from a mutation survivor**, and **one from
>    the type-checker** (the `Bg` collision, which compiled anyway). ⚠️ **Also: two scripted edits
>    silently matched nothing and I re-ran the same spec three times before noticing** — assert the
>    edit landed. **The test suite was green through every one of them.**
> 7. **Where the rules went:** `chapter-craft.md` §1 gained *a journey is a `transform`*, *`vw` is not
>    `%` under `zoom`*, *scale about the feet*, *derive the base as `w / scale`*; §4 gained *diff the
>    rendered rects, keyed semantically, with animations frozen*, *a fixed sample window misses the
>    event*, *`waitForSelector` waits for VISIBLE*, *Next ignores a `_`-prefixed folder*, and
>    *`next/image` lazy-loads by default and a raw `<img>` does not*.

> 🕳️ **2026-08-17 — AN ARCHITECTURE REVIEW TURNED INTO A P0: THE DIAGNOSTIC PLAN NEVER ADVANCED, FOR THREE MONTHS, BECAUSE `ChapterPortal` DROPS `onComplete` AND `advancePlan`'s ONLY CALLER WAS INSIDE THE FUNCTION IT ORPHANED. EVERY PAGE ALSO SHIPPED ONE EMOJI TO CRAWLERS, AND `/` WAS A REDIRECT.** 🕳️ SHIPPED — `main`@`68587e5`, prod serving **sw v109**. `tsc` 0 · **1071/1071 vitest** (was 1051, **+20**) · `next build` 0 · **212/212 e2e** · eslint 136 → **132**.
>
> **The asks:** an investor stress-test + architecture review + SEO → *"fix all the things which you have mention"* → *"which things are better do that"* → *"act like a senior debugging engineer"* → *"commit and deploy it"* → *"can you please fix these three"*.
>
> ## ⓪ ⚠️⚠️ THE P0, AND IT IS THE WORST SHAPE A BUG CAN HAVE: THE LOUD HALF KEPT WORKING
> `advancePlan` had exactly ONE caller — `/game`'s `handleComplete`, which reaches a chapter as
> `ChapterProps.onComplete`. **Both registry factories in `ChapterPortal` DISCARD that prop**:
> `function StoryChapter(_props)` (the identifier appears ONCE in the file, its own declaration) and
> `TeenChapter` reads only `props.childName`. The portal calls `finishAndSync` itself, so stars, XP,
> coins, the celebration and a synced `sessions` row all landed correctly — **everything a parent or
> a founder would LOOK AT was right.** Dead with it: `advancePlan`, `revisePlanDeeper` and both
> completion events. **Every child on a plan was handed their plan's first chapter again, for ever**,
> and the menu's "Step 1 of 5" stayed honest about a pointer that could not move.
> **Production said so in three independent ways:** 797 `chapter_open` · 40 completed `sessions` ·
> **0 `practice_complete`** · **77 of 77 `diagnostic_plan_progress` rows still `todo`**.
> ⚠️ **`menu/page.tsx:73` asserted the behaviour in a comment** — *"advances (in /game) as chapters
> are completed"* — which is this repo's own *a comment asserting a rule is followed is the most
> expensive kind of lie*.
> ⚠️⚠️ **AND `activePlan.test.ts` WAS GREEN THROUGHOUT, WITH SIX TESTS DRIVING `advancePlan`
> DIRECTLY. The unit was always correct; nothing REACHED it.** Same class as *a gate that reads a
> chapter's DATA cannot see how it INDEXES it*. **The fix therefore lives in `finishAndSync`** — the
> one function all three completion paths already route through (the portal's two factories,
> `CountingStoryChapter`, `/game`) — and the gate is an **e2e that plays a real chapter to completion
> through the real portal**, which fails on the pre-fix code. Placed BEFORE the network branch so an
> offline child still advances. **Verified on PRODUCTION** by playing The Mission Brief to a mastery
> exit: pointer `{0, wordProblems}` → `{1, factorsMultiples}`.
>
> ## ① ⚠️⚠️ EVERY URL ON THE DOMAIN SERVED 13 VISIBLE CHARACTERS
> `StorageGate` sits in the ROOT LAYOUT and early-returned a fox splash until IndexedDB hydrated, so
> `/help` shipped *"Milo — Help 🦊"* and so did both legal pages. Three faults from one early return:
> **`/legal/[slug]`'s own comment says a policy page "must render … with JS blocked"** — it did not,
> so the COPPA policy was an artifact that did not exist; **zero indexable content** anywhere; and
> **LCP on two pages of static text blocked behind an IndexedDB open**, 4s backstop, for state
> neither page reads. Exempted the routes that read no local state. `/` is on that list and had to
> be — it reads only the Supabase session, never kv.
> **`/` was also just a redirect with a fox on it** (66 visible chars). It is now a server component
> with copy assembled from words already in the repo; the session redirect is isolated in
> `ResumeSignedIn` so it no longer owns the render. **66 → 1,328.** `/help` **13 → 2,220**.
> Plus `robots.ts` + `sitemap.ts` (both 404'd) and `metadataBase` + OG — **without metadataBase Next
> emits a RELATIVE og:image, which every scraper drops**, so a shared link previewed as a blank card.
> ⚠️ **`vercel.json`'s `/` → `/auth` rewrite is NOT live** (`"c":["",""]` vs `["","auth"]`) — Next's
> App Router serves `/` itself, so `page.tsx` was always the front door and the REWRITE was the dead
> artifact. I had that backwards in the review and the browser corrected me.
>
> ## ② THE GATE I WROTE FOR THE FIXED-LAYER BUG WAS **INERT**, AND PASSED 152/152
> `short-landscape` crossed board × art and controls × edges — every pair containing the element
> somebody had in mind — and could not see the pair that SHIPPED (ScribblePad's closed button over
> The Coin Tray's 5, 6, 7). My first fix filtered fixed elements to "outermost only"; **the outermost
> fixed element in this app is the ROOT at 0,0 640×320**, so every layer collapsed into one
> full-screen container and every control was skipped as living-inside-a-fixed-layer. **Nothing was
> ever compared.** Caught only by planting the original ScribblePad regression and watching it
> SURVIVE. The test is CONTAINMENT (a layer covers a control only if it does not CONTAIN it), which
> needs DOM identity, so it is computed in the page. Re-planted, it names the real controls.
> **A green check is not evidence until you have watched it go red.**
>
> ## ③ AND THAT SUITE WAS A COIN FLIP, WHICH IS WORSE THAN A GAP
> It measures one randomly-drawn question kind per chapter off an unseeded `Math.random`, so
> complexNumbers @ 640×320 failed **3 runs in 7** on a REAL defect and passed the other 4. **A gate
> that flips a coin gets re-run until it is green.** `Math.random` is now mulberry32, seeded per
> (chapter, size) via `addInitScript` — no production code touched, no runtime cost — and breadth is
> `E2E_SEED` for a nightly rather than re-runs.
> ⚠️ **My first determinism check was worthless**: four identical "2 failed" that I read as
> deterministic were four identical `ERR_CONNECTION_REFUSED` with the dev server down.
>
> ## ④ THE WALK HOME'S NUDGES WERE 23×23, UNDER THE 24px FLOOR — AND BOTH MY DIAGNOSES WERE WRONG
> `WalkPad` stacks map → readout → two `Leg` rows → commit: **280 × 382 natural in a 364 × 200 slot**,
> so `FitSlot` is HEIGHT-bound at 0.5236 and a correctly-authored 44px `Nudge` renders at 23.
> I first blamed the board eating the width (**the board is 243px; `CenterFill` gets 364**), then
> concluded there was no spare width — because **I took the slot's OUTPUT box (147, the scaled
> result) for its constraint.** There were 217px spare. Reflowed to a row on a short frame:
> **scale 0.5236 → 0.7745, nudges 23 → 34, commit 24 → 36px tall.** Shrinking the parts instead
> would have landed within a pixel of the floor, which is not a fix.
>
> ## ⑤ THE PLAN POINTER NOW SURVIVES A DEVICE SWITCH — **DERIVED, NOT SYNCED**
> It is localStorage, so a parent who ran the check on a phone and handed over a tablet got **no plan
> card at all**. `diagnostic_plan_progress` exists for exactly this and is **write-once/read-never**
> (77 rows, all `todo`; only `sync_diagnostic` touches it, at creation) — so the obvious fix is a
> second write path that can disagree with the first. **Not needed:** `chapter_sequence` is on the
> server and `learner_progress` says what was played, so the position is a FUNCTION of data the menu
> has already fetched. No migration, no new grant (`diag_plans_read` already allows the read).
> Two properties make it safe, mutation-tested 4/4: **monotonic** (never drags a child back), and a
> **revised** local plan keeps its own chapters (the remote copy predates the revision).
>
> ## 🧹 ALSO SHIPPED
> `reactStrictMode: true` — verified empirically, not asserted (211/211, and beat pacing measured at
> 1 step / 6.3s to rule out doubled timers) · **6 of 9 duplicate resize listeners** derived from the
> shared hook, including **`RotateGate`'s pre-effect frame — the hook behind the 21 C7 failures** ·
> **`useViewport` returned a ZERO size** in an unlaid-out frame, which flips every aspect test so a
> landscape laptop draws its PORTRAIT layout (guarded, 3/3) · a `world1` timer that **scored a round
> 950ms after the child left** · `crypto.randomUUID` in analytics · a Node build script that was
> being **served to the browser**, deleted · **art 83 MB → 58 MB** (86 files, 0 with altered
> geometry — `cellAspect`/`frames` make a resize fatal, so the script verifies and refuses).
>
> ## 📉 AND THE NUMBER THAT SHOULD DECIDE THE NEXT MONTH
> Production, all time: **7 accounts · 17 learners · 40 sessions · EIGHT children have ever played ·
> best-ever retention 14 sessions across 5 days, last played 2026-07-26 · 5 real leads · £0 of
> monetisation surface — no price, no packaging, nowhere to pay.** 15 months, 467 commits, 77.5k
> lines. **The engineering is not what is wrong with this company.**
>
> ## ▶ OPEN
> 1. ⚠️⚠️ **`MONITORING_INGEST_URL` IS STILL UNSET, AND IT IS WHY ⓪ RAN FOR THREE MONTHS UNSEEN.**
>    `/api/report-error` forwards every crash into a void. Highest-value founder item by far.
> 2. **B1 attorney** is still a paste (`DRAFT = true` is LIVE on prod) · a real domain
>    (`mi2utor.com` is owned) · the `leads_server_only` migration · **dev still points at PROD** ·
>    **7 test leads of mine** in the prod table.
> 3. **`practice_complete` has still never been observed in the DB** — my prod verification used a
>    synthetic learner and `learner_events.learner_id` is FK'd to `learners(id)`, so the insert was
>    rejected and `track()` swallowed it by design. It should appear on the first REAL completion;
>    **if it does not, ⓪ is not fully fixed.** Watch it.
> 4. **The cross-device plan (⑤) has NOT been driven across two real devices** — unit and type layers
>    only. Stated rather than rounded up.
> 5. **132 eslint errors**, all three hook rules; they need the Suspense/`use()` migration, not 132
>    disable comments.
> 6. `diagnostic_plan_progress` is dead schema — deliberately NOT wired, since ⑤ derives instead.
> 7. **`short-landscape` is 57 minutes** and belongs in CI, not a working session. I killed it at 40
>    minutes once after treating it as a blocker for a question a 4-minute sample answered.
> 8. Of this session's faults, **the P0 came from reading production's own event table, not from any
>    test; two came from measuring after guessing wrong (the slot box, the board width); one from
>    planting a regression and watching it survive; one from the dev server being down twice; and one
>    from the type-checker. The 1,051-test suite was green through every one of them.**
> 9. **Where the rules went:** `chapter-craft.md` §4 gained *a unit test cannot see that nothing
>    calls the unit*, *a green check is not evidence until you have watched it go red*, *a sweep that
>    samples is a coin flip — seed it*, and *do not mistake a shrink-to-fit element's OUTPUT box for
>    the space it was given*.

> 🔒 **2026-08-16 (2nd session) — LAUNCH HARDENING, ROUND TWO. THREE ASKS, AND EVERY ONE OF THEM TURNED UP SOMETHING WORSE THAN THE THING ASKED ABOUT: A DEAD END A CHILD COULD NOT ESCAPE, A GATE THAT HAD BEEN RED FOR A DAY, AND THE RECORDED VOICE SILENTLY DEAD ON MOBILE.** 🔒 SHIPPED — `main`@`c80e1c7`, prod serving **sw v104**. `tsc` 0 · **1051/1051 vitest** (was 1039, **+12**) · `next build` 0 · **211/211 chapters × 3 frames** · preflight green.
>
> **The asks:** *"abhi kya karna hai plan ke according?"* → *"karo"* (the scratch-pad fix) → *"woh dono
> chapter waise hi rahege… bina neon mein"* → *"1, 2, 3 …. teeno karo"* → *"the things which are
> remaining on your side do that all"*.
>
> ## 🔒 THE FOUNDER'S CALL: C13 IS CLOSED, NOT DONE — **OrderDesk and LevelRun STAY STORYBOOK**
> The 9–11 band is finished at eight on GameShell and two on `SkillBeat`, **mixed by design**. Both
> pass the C7 gate as they are. Recorded in the header table, [docs/launch-plan.md](docs/launch-plan.md)
> (C13 ❌ DROPPED) and the memory index, because a stale plan makes the next session start porting them.
>
> ## ① ⚠️⚠️ THE WALKTHROUGH HAD NO SCALE-TO-FIT AT ALL, AND ITS SKIP BUTTON WAS OFF THE SCREEN
> Reported as *"the chalkboard overlaps the tray at 800×450"*. It is not the board: **every 9–11
> chapter answers on an `Instrument` rather than a `TutorialScene`, so every one takes
> `TutorialPlayer`'s legacy path — and that path rendered the instrument bare inside `CenterFill`
> while the PLAY stage wrapped it in `FitSlot`.** The fault is the one `FitSlot`'s own doc comment
> describes, left in place on the single path that never got it. Measured: the tray painted
> **741 × 319 inside a 560 × 314 slot** — 90px over each side, 52px UP across the chalkboard — with
> the step transport pushed off the bottom and **"I've got it →" at y 474–503 of a 450px viewport
> with no scroll. Unreachable: a child on that frame could not leave the walkthrough.**
> ⚠️ **MY FIRST DIAGNOSIS WAS WRONG AND THE INSTRUMENTATION IS WHAT CAUGHT IT.** I matched it to the
> stale-ResizeObserver fault recorded that morning, rewrote `FitSlot` with a layout effect, and the
> bug did not move. A temporary `data-av` attribute showed **ZERO FitSlot boxes in that subtree** —
> the component I had spent an hour on was not on screen. Reverted whole; the real fix is one wrapper.
> ⚠️ **AND THE GATE I WROTE FOR IT FIRST FAILED FOR THE WRONG REASON.** `button:visible.first()` is
> `‹ Menu`, so it walked out to the AUTH page and reported "Sign in", "Terms" and "Continue with
> Google" as offscreen. **It failed on the planted regression, so it looked like a working gate — and
> it would have failed identically with the bug fixed.** Now it takes the largest non-Menu button and
> asserts the URL did not change. Re-planted: fails on `decimals` AND `areaPerimeter` naming the real
> controls. `all-chapters.spec.ts` now presses the primary control once and re-runs the fit checks —
> **the start card is the one screen that always fits, which is why five checks over 70 chapters had
> never seen this.**
>
> ## ② ⚠️⚠️ THE C7 GATE HAD BEEN 210/211 RED SINCE THE CSP WENT ENFORCING, AND NOBODY KNEW
> `script-src` dropped `'unsafe-eval'`, which **React's DEVELOPMENT build needs and production does
> not** — so every page logged a console error against the dev server the gate is documented to
> drive, and the gate's contract is *zero console errors*. It hid for a day because the run that
> certified 211/211 was pointed at prod with `E2E_BASE_URL`. **Confirmed pre-existing by stashing my
> change and re-running.** Now branched on `NODE_ENV`; the production header is byte-identical.
> **Gated in BOTH directions** ([cspHeader.test.ts](src/__tests__/cspHeader.test.ts), which drives the
> real `headers()` at each env rather than checking the source string): a leak to production is the
> dangerous half, losing it in dev is the half that eats a day. `next.config.ts` had no gate of any kind.
>
> ## ③ ⚠️⚠️ AND THE PROD CONSOLE GAVE UP THE BIGGEST ONE — `media-src` WAS NEVER SET, SO THE RECORDED VOICE WAS SILENTLY DEAD ON MOBILE
> `default-src 'self'` was the fallback and it blocked the `data:` WAV that `unlockVoiceClips()`
> plays inside the intro tap — **the mobile-autoplay unlock**, i.e. the one gesture that grants iOS
> playback to the single reused `<audio>` the whole app plays through. Blocked, it is never unlocked,
> so **every pre-rendered ElevenLabs clip in bands 12–18 falls back to browser speech**, which most
> Chrome installs do not have. **Nothing reports it**: the player swallows its own errors by design (a
> missing clip must fall back, not throw), so on a desktop it is one console line and on a phone it is
> a chapter that has gone quiet.
> **That is THREE things the enforced CSP broke whose failure is invisible until a specific device
> does a specific thing — the fonts, MediaPipe, and this.** The rule is now in chapter-craft: read the
> prod console on a real page after any header change; a 200 on every route says nothing.
> ⚠️ **And it took a FRESH TAB to believe the fix** — the console buffer survives navigation, so the
> old violation kept printing against the new header and read exactly like a deploy that had not landed.
> ✅ **The same drive proved MediaPipe DOES boot on prod under the enforced CSP** — console reads
> `Graph successfully started running.` with 0 violations, i.e. the jsDelivr WASM, the WebAssembly
> instantiation, the `blob:` worker and the googleapis model all load. That was reasoned before; it is
> measured now. **A real hand on a real camera is still unproven and is the founder's to close.**
>
> ## ④ THE PUBLIC WRITE PATHS ARE RATE-LIMITED (launch-plan finding #9)
> `diagnostic_leads` was written straight from the browser with the anon key — **which is public by
> design, it ships in the JS bundle** — so there was nowhere a limit could go, and the original
> migration named "Supabase Auth rate limits" as the mitigation, which does not apply to a table
> write. Capture now goes through `/api/lead` (6/min per IP + a real email shape check; the table's
> CHECK only bounds LENGTH, so every 3-character string was a valid lead).
> ⚠️ **`/api/report-error` is arguably the bigger one**: unlimited, it forwards every POST to
> `MONITORING_INGEST_URL`, so the moment C3 is wired an open endpoint becomes an open billing line on
> someone else's service and the noise buries the crash it exists to surface. 30/min, dropped
> **silently** (200, not 429) — a browser that has just crashed must not be handed an error to handle.
> `ponytail:` in-memory and per serverless instance, a named ceiling with its upgrade path (WAF).
> ⚠️ **Mutation-tested 6/6, and the survivor mattered**: clearing the key map when a NEW key arrives
> passed every other test and defeats the limit completely — rotate one IP between calls and the
> counter is wiped. That property is asserted now.
>
> ## ⑤ ESLINT: **227 → 133**, AND TEN OF THEM WERE REAL DEFECTS
> Founder reaffirmed after being told a mass hook refactor is the riskiest thing to do in launch week.
> Done in slices, gates green after each. What it actually found:
> - **a `// eslint-disable-line` written after another `//`** — inert text inside the first comment,
>   counted as an error for months (ForestWalk).
> - **`MiloMark`'s id was a MODULE COUNTER in `useMemo`** — not SSR-safe, so server and client can
>   disagree, and that suffix names both the CSS class and the `@keyframes`: the class points at an
>   animation that went out under another name and **silently does not animate.** Now `useId()`.
> - **`ToastProvider` published its setter DURING RENDER** — a discarded or StrictMode render leaves a
>   setter for a tree React threw away.
> - **`WalkHome`'s route MUTATED a ref during render** — accumulating, so a doubled render adds a
>   duplicate corner no re-render can remove. Now React's sanctioned adjust-during-render.
> - **FIVE answer surfaces were components declared INSIDE their parent**, so React remounted the
>   element the child was touching: a `<input type="range">` losing its drag mid-gesture (WalkHome),
>   three nudge rows, and `motion` elements whose springs restarted mid-flight (the balance beam, the
>   tickets, the paint pour). `static-components` is now **0**.
> - **TWO chapters painted the PREVIOUS round's answer for a frame** on every new question, and the
>   child's own wrong answer for a frame on the reveal — `useEffect(…, [task])` runs after paint. This
>   is the class chapter-craft already records; found by the lint rather than by a screenshot.
>
> ⚠️ **AND TWO I ALMOST SHIPPED MYSELF, BOTH CAUGHT BY CHECKING THE EDIT RATHER THAN THE RESULT:**
> the script threading `disabled` into six call sites **silently matched nothing** (`[^>]` cannot
> cross the `=>` in `on={(n) => …}`), and `tsc` stayed clean **because the prop is optional** — so the
> rows would have stayed LIVE during the walkthrough and the reveal. Proven fixed by reading
> `.disabled` off all four nudges in the browser. And `gameKit`'s `P` is a **prop**, not a module
> constant (the shared kit serves every band's palette) — `tsc` caught that one.
>
> ⚠️ **`useLatestRef` ([src/shared/hooks/useLatestRef.ts](src/shared/hooks/useLatestRef.ts)) holds the
> idiom that appeared verbatim in 21 files**, and the write STAYS in the render phase with ONE
> documented disable. The rule is right in general — but that assignment is **idempotent**, whereas
> WalkHome's was accumulating, and moving it to an effect changes timing across the AR path and the
> critter engine for no behavioural gain. **Know which kind of render-phase write you have.**
>
> ## ▶ OPEN — and NOTHING on my side is unblocked
> 1. ⚠️⚠️ **B1 ATTORNEY IS STILL THE ONLY ITEM THAT CANNOT BE COMPRESSED.** The plumbing is done; it
>    is a paste into `src/app/legal/content.ts` plus `DRAFT = false`.
> 2. **Accounts → I wire in minutes:** monitoring ingest URL (C3) · analytics (C4) · SMTP (B6 — **no
>    email is sent at all today**) → unblocks C12.
> 3. **Dashboard toggles:** leaked-password, Auth rate limits, Vercel WAF, PITR, staging.
> 4. **Prod DDL is the founder's — TWO migrations now.** ⚠️ `20260816170000_leads_server_only.sql`
>    must NOT be applied until `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel and a lead is seen to
>    land, or capture stops **silently**. `20260816120000_perf_advisors.sql` (C10b) is not blocking.
>    ⚠️ **7 test rows of mine are in the prod leads table** (`a@b.com` ×6, `c@d.com`, 2026-08-16) —
>    verified 7 match / 5 remain. **The dev server points at PROD**, which is how they got there.
> 5. **B9 + F5 — a real human on a real device, and 20 minutes watching a real child.** Fold the AR
>    camera into it: MediaPipe boots on prod, a real hand has never been read on GameShell.
> 6. **133 eslint errors left, and the recommendation is to LEAVE them.** They are dominated by
>    async-data-loading `set-state-in-effect`, which is correct under this architecture; clearing them
>    means a Suspense/`use()` migration (post-launch) or 133 disable comments that bury the signal
>    that just caught ten real bugs. **A count is not the goal; an unread gate is the problem.**
> 7. **The EXPLORE beats are still gone** and the **re-teach has still never been seen fire**.
> 8. Of this session's faults, **one came from a founder screenshot (①), one from stashing my change
>    and re-running (②), one from the PROD CONSOLE (③), one from a mutation survivor (④), two from
>    checking that my own edit landed (⑤), and one from `tsc`. None from the existing test suite** —
>    which stayed 100% green through every one of them.
> 9. **Where the rules went:** `chapter-craft.md` gained *a component with two states must put BOTH in
>    flow*, *a gate last run against production can be broken against the server it documents*, and
>    *a security header breaks things that do not fail until a specific device does a specific thing —
>    read the prod console on a real page*.

> 🚀 **2026-08-16 — LAUNCH HARDENING. THE MVP PLAN IS RE-GROUNDED AGAINST THE RUNNING SYSTEM, AND NINE OF ITS ITEMS ARE DONE AND ON PROD: 0 SECURITY ADVISORIES, A CRASH SCREEN FOR EVERY FAILURE, SELF-HOSTED FONTS, AN ENFORCED CSP, PARENT DATA RIGHTS, LEGAL PAGES, A FAQ, A LAUNCH RUNBOOK, AND TWO GATES THAT CATCH THE MISTAKES I MADE TODAY.** 🚀 SHIPPED — `main`@`b7f4c0e`, prod serving **sw v98**. `tsc` 0 · **1039/1039 vitest** · `next build` 0 · **211/211 chapters × 3 frames, against production**.
>
> **The asks:** *"ek proper detailed … chhoti si chhoti cheez bhi chhutna naii chahiye … puri list banao … mein naii chahata hu ki launch hone ke pehle din hi kuch chale naa"* → then *"C1, C2 aur C7 shuru karo"* → *"font migration kar do, phir CSP enforce karo"* → *"implement all which you have mentioned"*.
>
> ## 📋 THE PLAN IS THE DELIVERABLE — [docs/launch-plan.md](docs/launch-plan.md), RE-GROUNDED NOT REWRITTEN
> The 2026-07-18 draft was right about SHAPE and a month stale about STATE (it said "sw.js at v27";
> we were on v94) and it assigned every item to named specialist agents that were removed on
> 2026-07-20. It now has **two owners only — `[C]` I can do it, `[F]` only the founder can** — and
> §1 is *verified*, with the command or advisor query behind each fact named so it can be re-run.
> ⚠️ **Half the value was finding what was ALREADY TRUE**: no ERROR-level Supabase lints, all four
> `SECURITY DEFINER` RPCs correctly guarded by `learner_access` → `42501`, the SW update path sound,
> and three of the old plan's open items already fixed. **A stale plan wastes work in both
> directions** — it hides real gaps and it re-opens closed ones.
>
> ## ✅ WHAT SHIPPED (nine items)
> | | what | commit |
> |---|---|---|
> | C1 | `npm audit` **4 high → 0**, prod and dev. `next` 16.2.6 → 16.3.1 (a Turbopack middleware bypass — this build), `sharp` → 0.35.3. **Removed `three` + 3 friends: prod deps 10 → 7.** | `05446b5` |
> | C2 | `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` — a Milo screen for every crash and dead link | `611b061` |
> | C7 | `npm run test:chapters` — **all 70 chapters × 3 frames** | `e1190aa` |
> | C10 | All five fonts self-hosted via `next/font` — **0 runtime requests to Google** | `396bfe0` |
> | C11 | **CSP ENFORCED**, one policy instead of two | `a968dbb` |
> | C14 | `npm run preflight` | `d1fa8fe` |
> | C6 | Parent data export + findable deletion | `d1fa8fe` |
> | C9 | `/help` — parent-facing FAQ | `d1fa8fe` |
> | C8 | [runbooks/launch-day.md](docs/runbooks/launch-day.md) | `d1fa8fe` |
>
> ## ⚠️⚠️ THE FOUR TRAPS, EACH OF WHICH WOULD HAVE SHIPPED
> ① **ENFORCING THE CSP AS WRITTEN WOULD HAVE SILENTLY KILLED EVERY AR CHAPTER** — the band's
> defining feature. `@mediapipe/tasks-vision` fetches WASM from **jsDelivr**, its model from
> **storage.googleapis.com**, instantiates WebAssembly (`wasm-unsafe-eval`) and runs a **`blob:`
> worker**. `default-src 'self'` blocks all three and **nothing fails until a child opens the
> camera**. Now named allowances, verified with a NEGATIVE CONTROL (`example.com` blocked) rather
> than only positive ones — a policy that is absent passes every positive test.
> ② **THE FONTS WERE THE REASON CSP COULD NEVER BE ENFORCED**, and nobody had connected the two. Three
> CSS `@import`s to Google meant `font-src 'self'` would have rendered the whole product in fallback
> system fonts. Found by the C7 gate catching an intermittent `gstatic` 404 — the 404 was trivial and
> what it *pointed at* was not. ⚠️ And `preteen/kit.tsx` hardcoded the family NAMES, which
> `next/font` hashes — that band's mono numerals would have silently fallen back.
> ③ **THE PERF MIGRATION'S FIRST DRAFT GUESSED THE RLS PREDICATES AND WAS WRONG.**
> `diagnostic_plan_progress` has no `learner_id` — it reaches the parent through
> `plan_id → diagnostic_plans.learner_id`, and all five policies are `EXISTS` joins, not `IN`
> subqueries. **That is a cross-tenant access change wearing a performance-tuning commit message.**
> Every predicate is now read off `pg_policies.qual` on the live DB. ⚠️ **Never rewrite a policy from
> memory.**
> ④ **`app/error.tsx`'s PROP IS `retry`, NOT `reset`.** From memory it is `reset`, which type-checks
> as an unused prop and renders a button that does nothing. Proven live: *Try again* fires a SECOND
> `/api/report-error` POST. AGENTS.md earns its keep — `global-error` also gets **no global CSS or
> fonts**, and an unmatched URL is `global-not-found` (experimental) while the stable
> `not-found.tsx` covers this app.
>
> ## ⚠️⚠️ AND THE MISTAKE I MADE MYSELF, WHICH IS NOW A GATE
> **I shipped the fonts + CSP with NO `sw.js` BUMP.** The verification afterwards then reported 3
> Google font requests and let `example.com` through — i.e. it looked like the work had not deployed.
> It had: the browser was serving the **v96 cache**, and **a cached response keeps its HTTP headers**,
> so the old report-only CSP came with it. `sw.js` is `must-revalidate`, so the browser re-fetches
> it — but the bytes were unchanged, so **no update ever triggers and the stale shell is permanent**.
> Two rules out of it, both now enforced rather than remembered:
> - **`npm run preflight` fails if shipped files changed and `VERSION` did not** (diffed against
>   `origin/main`). It caught the very next commit — 8 files, still v97.
> - **After any deploy, clear the service worker before you believe a prod check, or you are grading
>   the previous release.** Written into the launch-day runbook.
>
> ## 🧪 THE C7 GATE, AND WHY A LOCALHOST-GREEN GATE IS NOT A GREEN GATE
> 211/211 on localhost, then **23 failures against prod** — and 21 of them were the TEST being wrong:
> the 3–11 story chapters are landscape-first, so on a 390×844 phone they correctly show *"Turn your
> phone sideways"*, which has no button. ⚠️ **It passed on dev and failed on prod because
> `useNeedsRotate` runs in an EFFECT** — dev caught the pre-effect frame, prod the settled one. My
> first fix re-introduced the same race one level up (branching on an instantaneous `isVisible()`);
> it now waits for `control.or(rotateGate)`, so there is no instant to be wrong at. The other 2 were
> the **deploy-propagation window** — both passed untouched minutes later.
> ⚠️ **And the sweep was quietly covering a QUARTER of the chapter**: `makeRound(d)` with the default
> `asked = []` is deterministic by type, because unmet-first is what `coverage` is for — so 400 draws
> per tier were 400 `howMany` rounds. Caught by the one check asserting all four types are reachable.
>
> ## 🧹 AND SIX DOCS WENT, AFTER CHECKING EACH ONE
> `area3d-brief` + `ar-phase0-brief` (subjects deleted, rules already harvested into chapter-craft),
> `scaling-roadmap` (its premise — "one age group with 11 chapters" — is false; its goal is shipped),
> and three spent one-shot PROMPTS. ⚠️ **"Unreferenced" is not "useless"**: eight docs had zero inbound
> links and only two were dead — the five unlinked storyboards all describe LIVE chapters. Two of the
> four had live inbound links, repointed rather than left dangling. **`README.md` was 100% stock
> `create-next-app`** with two stray `# Milo` lines glued on; rewritten with numbers verified against
> source.
>
> ## ▶ OPEN — and the top item is not code
> 1. ⚠️⚠️ **THE ATTORNEY IS THE LONG POLE AND NOTHING ELSE CAN CLOSE IT** (blocker B1). Privacy
>    Policy + ToS + COPPA notice. **The plumbing is DONE** — `/legal/privacy`, `/legal/terms`, the
>    consent line on signup — all wired against placeholder copy in `src/app/legal/content.ts`, so
>    it is now a PASTE plus `DRAFT = false`. Until then every page shows a red "not reviewed by a
>    lawyer" banner and preflight warns. **A placeholder that looks final is worse than none.**
> 2. **Founder accounts, then I wire them in minutes**: monitoring ingest URL (C3 — the seam exists),
>    analytics tool (C4), SMTP (C6/B6 — no email is sent at all today), leaked-password toggle, Auth
>    rate limits, Vercel WAF, PITR.
> 3. 🟡 **C10b migration written, NOT applied** — `supabase/migrations/20260816120000_perf_advisors.sql`.
>    Prod DDL is the founder's.
> 4. ✅ **THE SCRATCH-PAD COLLISION IS FIXED** (2026-08-16) — the closed button was `position: fixed`
>    while the open drawer was deliberately in flow, i.e. the state that is up 99% of the time broke
>    the promise the other state's own comment documents. Both states are one flow row now; measured
>    at 640×320 on The Coin Tray and The Empty Plot: 0 collisions, nothing offscreen, no scroll.
>    ⚠️ **And chasing it found the C7 gate 210/211 RED and broken since the CSP was enforced** —
>    `script-src` dropped `'unsafe-eval'`, which React's DEV build needs and production does not, so
>    every page logged a console error against the very server the gate is documented to drive. It
>    hid because the run that certified 211/211 was pointed at prod with `E2E_BASE_URL`. Now branched
>    on `NODE_ENV` and gated in BOTH directions (`cspHeader.test.ts`): the production leak is the
>    dangerous half, losing it in dev is the half that eats a day. Gate back to **211/211**.
>    ⚠️⚠️ **AND THEN THE PROD CONSOLE GAVE UP A THIRD CSP CASUALTY, WHICH IS THE BIGGEST OF THE
>    THREE: `media-src` WAS NEVER SET, SO THE RECORDED VOICE WAS SILENTLY DEAD ON MOBILE.**
>    `default-src 'self'` was the fallback and it blocked the `data:` WAV that `unlockVoiceClips()`
>    plays inside the intro tap — the mobile-autoplay unlock, i.e. the one gesture that grants iOS
>    playback to the single reused `<audio>` the whole app plays through. Blocked, it is never
>    unlocked, so **every pre-rendered ElevenLabs clip in bands 12–18 falls back to browser speech**,
>    which most Chrome installs do not have at all. Nothing reports it: the player swallows its own
>    errors by design (a missing clip must fall back, not throw), so on a desktop it is one console
>    line and on a phone it is a chapter that has simply gone quiet. **That is now three things the
>    enforced CSP broke whose failure is invisible until a specific device does a specific thing —
>    the fonts, MediaPipe, and this. Read the prod console on a real page after any header change;
>    a 200 on every route says nothing about it.** ⚠️ And it took a FRESH TAB to believe the fix: the
>    console buffer survives navigation, so the old violation was still printing against the new
>    header, reading exactly like a deploy that had not landed.
> 4b. ⚠️ **`npm run preflight` ONLY DIFFS COMMITTED WORK** (`origin/main...HEAD`), so an uncommitted
>    change is invisible to its sw-bump gate — it reported "no shipped files changed" over a live CSP
>    edit. Commit first, then run it. And a CSP change **does** need the bump: the policy rides a
>    response HEADER and a cached response keeps its headers, which is this repo's own recorded trap.
>    Prod is on **sw v100**, verified on the live origin along with `media-src 'self' data:` and a
>    production `script-src` carrying **no** bare `'unsafe-eval'`.
> 5. ✅ **C13 IS CLOSED — NOT DONE, DECIDED.** Founder, 2026-08-16: *"woh dono chapter waise hi
>    rahenge… bina neon mein"*. **OrderDesk and LevelRun stay storybook `SkillBeat`; do not port
>    them.** Both pass the C7 gate as they are. The 9–11 band is mixed by design — eight on
>    GameShell, two storybook — so the ~3,344 lines are not outstanding work and the port is finished
>    at eight.
> 6. **231 pre-existing eslint errors**, almost all `react-hooks/refs` and `set-state-in-effect` —
>    byte-identical before today's work and deliberately untouched. **A mass hook refactor is the last
>    thing to do in launch week**, but they are the exact classes this repo has shipped bugs from.
> 7. Of today's faults: **two were mine and are now gates** (the sw bump; the vacuous sweep), **two
>    were caught by reading the live system instead of guessing** (the RLS predicates, the MediaPipe
>    origins), **one by the docs** (`retry` vs `reset`), and **one by prod disagreeing with localhost**
>    (the rotate gate). None from the type-checker.

_Older sessions (2026-06-15 → **2026-08-15**) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, and 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) on 2026-08-17._
