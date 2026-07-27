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
> _(Everything below is the running session history — newest first. The craft rules live in that
> file, not here.)_

> 🛟 **2026-07-27 (LATEST) — THE SUPPORT + PER-USER ERROR LAYER, BUILT BECAUSE THE FOUNDER ASKED HOW A COMPANY RUNS AN APP AFTER LAUNCH. 🚀 SHIPPED — `main`@`3492abe`, prod serving sw v68, deploy landed in 30s, post-deploy smoke green.** `tsc` 0 · 142/142 vitest · `next build` 0 · driven live, both error classes captured end-to-end. Smoke: all 8 routes 200 · **prod `sw.js` confirmed carrying the new VERSION handler** (so the code shipped, not merely the version bump) · `/api/report-error` accepts a `learnerId` payload · all five security headers byte-intact.
>
> ⚠️ **THE A2 STORY BATCH IS STILL UNCOMMITTED AND WAS DELIBERATELY LEFT THAT WAY.** This shipped as
> its own branch → fast-forward → push, touching **9 files with zero overlap** with the story work
> (verified by staging file-by-file, never a directory pathspec — the 2026-07-26 git trap — and
> confirming with `git show --stat`). So a rollback of either does not disturb the other. That
> separation is the point: it is the "ship one thing at a time" habit this file keeps recommending
> and this repo keeps not doing.
>
> **The question behind it:** *"how will we give support to users, and how do we manage an error for a
> SPECIFIC user"* — from a founder who does not read code. So everything here is built to be operated
> by reading, not by debugging.
>
> ## ① THE DIAGNOSIS: THIS APP'S REAL FAILURES ARE INVISIBLE FROM THE SERVER
> Milo is local-first — progress lives in IndexedDB and syncs afterwards — so the failures a parent
> actually writes in about produce **no Supabase row and no Vercel log line**: a wedged offline queue,
> a stale service-worker shell, IndexedDB blocked in private browsing, speech never unlocking. The only
> time this repo ever diagnosed one (the Safari `upgrade-insecure-requests` boot failure) it was by
> hand-adding beacons to the service worker, which is not repeatable on a stranger's iPad. **So the
> user now carries the evidence to us, on purpose.**
>
> ## ② WHAT WAS BUILT — 40 added lines across 5 files, plus 4 new ones
> | file | what |
> |---|---|
> | `infra/storage/lastError.ts` (new) | 3-deep local ring of recent errors + `installErrorCapture()` for `window.error` and `unhandledrejection` — **the classes the React ErrorBoundary never sees**, and the class the Safari bug actually was |
> | `infra/diagnostics.ts` (new) | the snapshot: sw version · kv mode · queue depths · storage · recent errors · learner id. Shape-only by design — **no token, no child name, no DOB** |
> | `shared/ui/SupportPanel.tsx` (new) | "Need help?" on the parent dashboard → describe it + the block. **Two send paths** (`mailto:` AND Copy) because mailto silently does nothing on a desktop with no mail client |
> | `docs/support.md` (new) | the runbook: **a field-by-field table mapping each diagnostic line to its bug class**, written for a non-coder |
> | `kv.ts` | exposes `kv.mode()` — `local` means IndexedDB hung/was blocked and the 2.5s fallback fired. **This was previously module-private, i.e. the single most likely cause of "her progress vanished" was unobservable** |
> | `public/sw.js` | replies to a `VERSION` postMessage. A device pinned on an old shell while prod serves newer IS the stale-shell bug ⚠️ **only works once a SW carrying this handler is installed — until then the block reads `no reply`, which is itself the signal** |
> | `ErrorBoundary.tsx` · `api/report-error` | **identity on the error.** `learnerId` read synchronously from sessionStorage — an async session lookup would race the navigation a crash triggers, and learner → account is one DB join |
>
> ## ③ A DAILY CLOUD CHECK NOW WATCHES PROD — `trig_01GKnmbsiyHjvsC58jMTeiG6`, 02:30 UTC (08:00 IST)
> Read-only agent: curls health + 7 routes + sw VERSION + the 4 security headers, pulls Vercel runtime
> errors, counts Supabase signups/sessions. **Instructed to answer in ONE line when healthy** — a daily
> wall of green trains you to stop reading it. ⚠️ The `schedule` skill reported "no MCP connectors
> found" and that was **STALE** — Vercel and Supabase both attached fine. Verified created/enabled/
> fired/next-run; **the run's OUTPUT is not returned by the API**, so the report's readability is the
> one thing unverified — look once at `https://claude.ai/code/routines/trig_01GKnmbsiyHjvsC58jMTeiG6`.
>
> ## ④ SENTRY DELIBERATELY NOT ADDED
> Vercel already captures both seams and is queryable over MCP. A vendor for search-and-retention at
> ~0 users is cost with no consumer; the identity work above makes adopting it a config change later.
>
> ## ▶ OPEN
> 1. **The support promise is now ON SCREEN: "we reply within 2 working days."** That is a commitment
>    to an inbox nobody is checking daily yet. Either keep it or change the copy.
> 2. **COPPA parental review/deletion still has no defined path** and learner deletion is still not
>    audit-logged. It is a support request with legal teeth. Belongs in the open lawyer conversation.
> 3. `docs/support-log.md` does not exist yet — one line per contact; after ~20 lines the top 3
>    problems ARE the next engineering work.
> 4. Nothing here has been exercised by a real parent, because there are no real parents.
>
> _(the 🚚 block below is the same day's story work — untouched by this, and still uncommitted.)_

> 🚚 **2026-07-27 — A2 DONE, THEN THE PICKER CAME OUT AND THE STATIC OBJECTS WENT: STORYTIME AND MARKETDAY ARE NOW ONE CONTINUOUS RUN OF LIVING CREATURES, AND THREE COLLISIONS THAT WERE ALREADY IN PRODUCTION WENT WITH THEM. ⚠️ STILL NOTHING COMMITTED — prod is `main`@`5966de3` / sw v67.** `tsc` 0 · 142/142 vitest · `next build` · 0 console errors in a fresh tab · driven at 1024×620 and 640×320 in every setting of both chapters.
>
> **The asks, in order:** *"start A2"* (item 2 of the build order in
> [docs/story-6-8-rethink.md](docs/story-6-8-rethink.md)) → *"remove the picker… add all in the one
> for each chapter"* → *"in the story problem use the generated animation objects not the fruits… in
> the multiplication also use the generated animated objects not the static images"*.
>
> **The three asks turned out to be one idea arriving in stages, and it is worth reading them
> together:** make the arithmetic move → stop making the child choose a world before they know what
> they are choosing → and then the thing that moves has to be something that *can* move. A fruit
> cannot arrive; it can only be slid across the picture like a cut-out being dragged, which is exactly
> what the first ask had just asked it to do.
>
> ## ① THE FAULT, AND THE ONE THING THAT FIXES IT
> StoryTime's joiners `_pop`ped into existence and its leavers **faded a stationary sprite** — the
> exact fault PlayTime was built to fix in the 3–5 band. So the arithmetic happened in a jump cut.
> Now they **travel**: joiners come in from off-frame, leavers walk out, staggered so a group files
> in rather than swarming.
> • **Direction is the whole trick, and it is PlayTime's slot order mirrored.** There the movers own
>   the LEFTMOST slots and travel left→right; here they own the RIGHT-hand end of the row (group B in
>   an addition, the trailing few in a take-away), so **arrivals come from off-frame right and
>   departures leave the same way** — the only direction that never walks something through the group
>   being counted. A leaver turns round first, or the cycle contradicts the travel.
> • **The reef world is now ALIVE.** Its items are the `_side` sprites, every one of which has a
>   drawn cycle, so fish/crabs/turtles swim in and out instead of being dragged sideways as cut-outs.
>   **Octopus dropped** — no cycle, and a still creature beside a living one reads as broken art, the
>   same call SeesawPark's cast re-pick made. Picnic and Fun Fair stay objects and simply travel: an
>   apple carried on has no feet to skate.
> • **MarketDay took the cheap option** the plan named: each tray is **lowered onto its place** one
>   at a time with an **empty socket waiting for it**, instead of scale-popping in. Load-the-trays
>   remains the real verb whenever it is wanted.
> • **The choreography is derived, not picked** — the question opens when the last mover has actually
>   landed, where a fixed 700ms used to offer the answer buttons mid-take-away.
>
> ## ② ⚠️ `SheetSprite`'S WALK-IN WAS SKATING FROM THE DAY IT WAS WRITTEN — in yesterday's own code
> `arrived` gated BOTH the transform target and the leg cycle, and flipped once at `delayMs + ms`.
> So a creature **walked on the spot for the whole delay, then slid the entire distance with its legs
> parked.** That is the engine's cardinal rule — *a walk cycle and the travel it belongs to must be
> given the same number* — broken inside the helper written to enforce it, and it shipped into
> SeesawPark yesterday unnoticed because the end state looks perfectly fine.
> Travel now lives in a new shared **`Arrive`**, which hands its child a `moving` flag; **`SheetCell`**
> (split out of `SheetSprite`) runs the cycle on exactly that flag. The split also exists so a caller
> drawing something UNDER the sprite — a contact shadow — wraps `Arrive` around the PAIR and travels
> them as one element; a shadow left outside the travel is the sibling-shadow bug this repo already
> shipped once.
>
> ## ③ THREE COLLISIONS THAT WERE ALREADY IN PRODUCTION, all the same class
> Every one is a percentage of the height *guessing* at a gap it should have measured:
> | where | what | was |
> |---|---|---|
> | StoryTime | answer box vs the answer buttons | **−29px**, sitting on the middle answer |
> | MarketDay | equation box vs the answer buttons | **−33px** |
> | both | their own prompt pill vs **`SkillBeat`'s** | unreadable at 640×320 |
> The first two are now anchored off the same numbers the buttons are laid out with. The third was
> fixed by **deletion**: `beat.prompt` returns `''` (SkillBeat then renders nothing) and the chapter's
> own, richer pill takes SkillBeat's tap-to-replay with it. MissionBrief had already made that call
> and the reason was never written down — it is in the craft doc now.
>
> ## ④ AND A TRAP IN THE INSTRUMENT, WHICH COST MOST OF THE VERIFICATION TIME
> **The browser pane's tab is `visibilityState: hidden` except during a screenshot, and a hidden tab
> freezes CSS transitions AND `requestAnimationFrame` outright.** So the sprites read as "started
> off-frame, never moved" for four seconds and then teleported; the fair world's objects read as
> *missing entirely* because their entrance keyframe was frozen at `opacity: 0`. Both were the
> instrument. `computer wait` does NOT front the tab, and a screenshot fronts it for ~40ms — far too
> short to catch a 3.6s journey. **What works instead: a `MutationObserver` on `style` (it fires
> regardless of throttling) plus a `setInterval` reading the transform TARGET and the
> `animationPlayState`.** That proves the invariant that actually matters — legs run exactly while
> the body is covering ground — without needing to watch the pixels move. Measured: `paused` off-frame
> → `running` in flight → `paused` on arrival, **and again on a late scored round, not just round 1.**
>
> ## ⑤ THEN THE PICKER CAME OUT — ALL THREE REBUILT CHAPTERS ARE NOW ONE RUN
> Founder: *"remove the picker… add all in the one for each chapter."* A world picker asks a child to
> choose before they know what they are choosing, and then spends all ten rounds in one backdrop.
> **SeesawPark, StoryTime and MarketDay now open straight on the intro**, and the SETTING CHANGES
> EVERY ROUND — consecutive questions differ in place as well as in number. Same call chapter 2 took
> when its three biomes were merged.
> • The shape, in all three: a flat **`PLAN`** of item+setting pairs, **interleaved** so consecutive
>   rounds change setting (10 pairs against 10 rounds in StoryTime/MarketDay, 9 in SeesawPark), and
>   the setting is **carried on the round** (`data.w`) rather than held in component state. Everything
>   that used to be per-world then follows the round: the backdrop, **Milo's own sprite** (scuba in the
>   reef, chef in the bakery, fishing at the pond), the group noun, the friend's name.
> • Each pair fixes its **own backdrop**, which is load-bearing for the Craft Table — its scenes are
>   item-specific, so a scene must never be chosen independently of what it is showing.
> • The demo now walks a DIFFERENT setting per beat, so the first thing a child learns is that the
>   place changes but the rule does not — which is exactly what the scored rounds then do.
> • `WorldSelect` itself stays: nine other chapters still use it until they are rebuilt.
> Verified live: no picker on any of the three; StoryTime ran picnic → reef (Milo swaps to scuba) →
> guided picnic → **Fun Fair by round 6**; MarketDay opened on the bakery with the chef; SeesawPark's
> guided round is the forest, with the beam still **level** while the question is open.
>
> ## ⑥ AND THE STATIC OBJECTS WENT — BOTH CHAPTERS ARE NOW ENTIRELY DRAWN CYCLES
> Founder: *"in the story problem use the generated animation objects not the fruits… in the
> multiplication also."* Right, and the reason is sharper than it first looks: **a fruit cannot
> ARRIVE.** It can only be slid across the picture like a cut-out being dragged — which is exactly
> what §① had just asked it to do. A creature walks in on its own legs, so the verb and the art
> finally agree. Same generalised rule as SeesawPark's cast re-pick: a still object beside a living
> one reads as broken art, so the cast is all-or-nothing.
> • **StoryTime** — apples/balloons/flags → 🐠 **Coral Reef** (fish · crab · shark) · 🏖️ **Sandy
>   Shore** (duck · turtle · eagle) · 🌙 **Moon Base** (astronaut · alien). That last one **finally
>   spends the two space cycles** the handoff flagged as having no named consumer.
> • **MarketDay** — cupcakes/flowers/beads → 🐔 **The Farm** (PENS of chicks · ducklings · lambs) ·
>   🌸 **The Garden** (PATCHES of bees · ladybugs · ants) · 🌲 **The Woods** (NESTS of birds ·
>   squirrels · eagles). "3 pens of 2 chicks" is the same math with a living manipulative.
> • The verbs moved with the cast, because the sentences have to stay TRUE: the picnic's *"2 get
>   eaten"* would have been grim with creatures — it is *"swim away"* / *"wander off"* / *"float
>   away"* now.
> • ⚠️ **SIZE A CREATURE BY AREA, NOT BY HEIGHT.** Their aspects run from **0.457** (the alien: tall
>   and thin) to **1.746** (the shark), and a chain that sets only HEIGHT drew ten aliens as **18px
>   slivers** — fatal in a chapter about counting them — while making a shark hog its row. Dividing
>   by `√aspect` holds the drawn AREA constant. Caught on screen, not by a gate.
> • Because every item is sheeted, the static-image and colour-tint paths in both chapters are gone —
>   `SheetCell` is the only renderer, and it still falls back to a plain still if a sheet is ever
>   missing. `TintedSprite` stays for the three chapters that still need it.
>
> ## ▶ OPEN
> 1. **STILL NOTHING COMMITTED — and the tree is now large.** `SeesawPark.tsx` · `StoryTime.tsx` ·
>    `MarketDay.tsx` · `critters.tsx` · `canvas/sheets.ts` · `chapter-craft.md` · `handoff.md`, plus
>    the untracked `docs/story-6-8-rethink.md` and **10 new PNGs** in `public/assets/`. Deploying
>    needs the usual `public/sw.js` bump (v67 → v68). Leave `scripts/.voice-*.json` out — regenerable.
> 2. **Next in the order: A3 — HopAlong** (`milo_hop` + the discrete `hop(from, to)`; `Critter`
>    cannot carry a hop). Then **B** — one bundling engine serving placeValue + additionTo100 +
>    subtractionTo100.
> 3. **Three band-wide items are now DONE in all three rebuilt chapters and must be repeated in every
>    later one:** `RotateGate` + landscape-only · **no world picker** · **an all-drawn-cycle cast**.
>    Three are still NOT done: teaching is a modal white card, there is no cumulative arc outside
>    `SkillBeat`, and emoji still render in the painted world (StoryTime's compare rows label Milo and
>    his friend 🦊/🧒).
> 4. ⚠️ **The 6–8 world registry in this file is now stale for three chapters.** Story problems are
>    Coral Reef · Sandy Shore · Moon Base (was Picnic Meadow · Coral Reef · Fun Fair); multiplication
>    is The Farm · The Garden · The Woods (was Bakery · Flower Garden · Craft Table). **One known
>    backdrop overlap**: MarketDay's Woods and SeesawPark's forest share `forest_1`/`forest_2` — there
>    are only four forest images and two chapters wanted three each. Left deliberately: a balance
>    scale and a grid of nests cannot be mistaken for one another. **HopAlong's planned "Farmyard"
>    world now clashes with MarketDay's Farm** and should be re-picked when A3 lands.
> 5. **The `fps` cadences are still unverified by eye** — and there are now MORE of them on screen,
>    since chick · duckling · lamb · bee · dragonfly · alien · astronaut all went live this session
>    with the numbers that were tuned by ear. That is the cheapest remaining win: watch one run and
>    adjust one number each in `sheets.ts`.
> 6. **524.7 Higgsfield credits expire ~2026-07-30**, and the two orphan sheets (astronaut, alien)
>    now have a home, so the honest uses left are a retry if a cycle reads wrong on screen, or
>    cat/fox/bear (~27) if those are ever wanted back.
> 7. **Nobody has watched a child play any of it**, and every fault this session that mattered was
>    found by looking at the screen — the 18px aliens, the two answer boxes sitting on their own
>    button rows, the doubled prompt pill. None of them would have failed a gate.
>
> _(the 🎞️ block below is the same day's earlier work — the audit, the art and SeesawPark.)_

> 🎞️ **2026-07-27 — THE 6–8 BAND RE-THOUGHT AGAINST THE 3–5 ANIMATION CRITERIA, 10 NEW DRAWN CYCLES GENERATED BEFORE THE QUOTA EXPIRED, AND THE FIRST CHAPTER REBUILT. ⚠️ NOTHING COMMITTED — prod is still `main`@`5966de3` / sw v67.** `tsc` 0 · 142/142 vitest · `next build` · 0 console errors in a fresh tab · driven live at 1024×620 and 390×844.
>
> **The asks, in order:** *"rethink the chapters of the age group 6-8 with the criteria of animations which we have used in the age group 3-5"* → *"save it as doc first"* → *"you can use the higgsfield to generate new video… in 3 days our month gets complete and we have almost 600 credits"* → *"lets start animating the chapters"* → *"can we use animated objects in the balances?"* → *"use the already generated one suitable for forest"*.
>
> ## ① THE AUDIT — [docs/story-6-8-rethink.md](docs/story-6-8-rethink.md) is the standing spec for the band
> The 6–8 set was converted to story mode on 2026-07-01; the 3–5 band was **rebuilt** on 07-24→26.
> So 6–8 runs the OLDER pattern, and it is the pattern §0a exists to name. Two greps carry the whole
> diagnosis: **the band's entire animation vocabulary is two keyframes per file — `_float` (Milo bobs
> in place) and `_pop` (an object scales in).** Nothing travels, nothing has a cycle.
>
> | | 3–5 (rebuilt) | 6–8 (as shipped) |
> |---|---|---|
> | drawn cycles (`critters.tsx`) | 5 chapters + 4 test suites | **0** |
> | journeys (`journeyOf`) | every chapter | **0** |
> | answering gesture | a different verb per skill | **tap 1 of 3 chips, all 12** |
> | teaching | in-world | a **modal white card** over the scene |
> | cumulative arc outside `SkillBeat` | strip · tray · build | `onRound` swaps the **backdrop only** |
> | `RotateGate` | all | **none** |
>
> The doc carries a verb per chapter (DELIVER IT · BUNDLE IT · HOP IT · LOAD THE TRAYS · CUT IT ·
> PAY IT · SET IT · REGROUP IT · BUILD IT), the A/B/C build order, and the band-wide items. **Founder
> decision taken: 6–8 goes LANDSCAPE-ONLY** — journeys need horizontal room. ⚠️ That is a behaviour
> change: 6–8 works in portrait today via a `short = vh<470` path, which becomes dead weight in every
> chapter that gets rebuilt.
> **The band is TAP-ONLY** (no `onPointerDown` anywhere in 3–11), so every proposal is taps — I nearly
> specified drag for the clock and the bundling.
>
> ## ② THE ONE DEFECT THAT WAS NOT A STYLE MATTER — and it was live
> **SeesawPark was hot/cold in production.** `setTimeout(() => setTilt(true), 400)` tipped the beam
> toward the bigger side **before the child answered**, and the heavier pan glowed with it. The whole
> chapter was winnable by reading the tilt and tapping the matching sign, never comparing two numbers
> — the only thing it exists to teach. Same fault as chapter 4's green Ready button and the teen
> band's rejected live-tilt beam, and the rule was already in the craft doc when it shipped.
>
> ## ③ THE ART — 10 DRAWN CYCLES FOR 75 CREDITS, ZERO RETRIES (524.7 left, expires ~2026-07-30)
> This **closes the parade's long-parked "Farm + Space — 9 creatures, ~70 credits"** item: lamb ·
> chick · duckling · bee · frog · duck · dragonfly · astronaut · alien, plus **Milo's HOP**.
> All 9 already had `_side` stills, so this was **image-to-video** — no `generate_image` step, and the
> still itself locks the style. Findings, all now in [chapter-craft.md](docs/chapter-craft.md):
> • **Derive the chroma field, don't recall it.** `scratchpad/chroma.py` measures green-vs-magenta
>   clearance to the nearest subject pixel. Run blind it reproduced every case earlier sessions paid
>   for — frog (green 156), alien (173), **Milo, whose green backpack gives green 172 vs magenta 209**
>   — and flagged the dragonfly as marginal both ways.
> • ⚠️ **The SUBJECT settles, not just the background.** The magenta field was solid from frame 0, but
>   the model spent **20 of 121 frames re-rendering the subject** (610→360px wide, drifting 89px).
>   Adding *"at a CONSTANT size, must not drift, grow or shrink"* fixed it: 8 of 9 then settled at
>   frame 0. Measure per-frame bbox to find the lock-in; don't guess `--start`.
> • **`creature-frames.py`'s cycle detector gives misleading verdicts.** It called lamb and Milo's hop
>   "no clean cycle"; a plain autocorrelation found them at lag 21 with corr **+0.84 / +0.87**.
>   Re-cutting to one measured period fixed both — **no credits wasted on a retry that wasn't needed.**
>   Worth patching the script.
> • Reported output geometry ≠ delivered (params said 1280×720, file was 960×960 square). Preset
>   interceptions are pre-submission notices, not charges ("wings **beating**" matched a music preset);
>   balance confirmed exactly 10 × 7.5.
> • ⚠️ **A HOP IS NOT A WALK AND `Critter` CANNOT CARRY ONE.** The frog is coiled 9 of 12 frames and
>   airborne 3; linear travel makes it slide while crouched. A hop needs a discrete `hop(from, to)`.
>   **This corrected my own plan**, which had said HopAlong was "`critters.tsx` unchanged".
> • All 10 registered in [sheets.ts](src/features/chapters/story/canvas/sheets.ts) with **measured**
>   `cellAspect`; the `fps` values are **proposals tuned by ear**, flagged as such in the file, because
>   cadence is the number the founder has twice called too fast and it also sets ground speed.
>
> ## ④ A1 SEESAWPARK REBUILT — the template every later 6–8 chapter repeats
> • **The beam now confirms an answer instead of previewing one.** `tilt = picked !== null`. Verified
>   by measurement, not by the screen moving: pan bottoms **Δ0px** and `rotate(0deg)` while the
>   question is open (2 vs 3, answer nowhere on screen), then `rotate(7deg)` on commit.
> • **A level beam needed a BEAM ARREST to read as deliberate** — a scale showing 6 against 3 dead
>   level just looks faulty, which is the exact "reads as broken" risk that **deferred the measurement
>   chapter's weight world**. Two props hold it and drop away on commit (2 → 0). **This is the pattern
>   to reuse if weight ever becomes a MeasureIt world.**
> • **`RotateGate` + landscape-only**, early return below every hook. Gate at 390×844, clean recovery
>   to 1024×620, no error boundary.
> • **The animals are ALIVE.** New shared **`SheetSprite`** in `critters.tsx` — an in-flow living
>   sprite for the many 6–8 chapters that lay creatures out in a GRID (`Critter` is `position:fixed`
>   and cannot serve them). They **walk onto the pan with the cycle playing, then pause and breathe**:
>   they are being weighed, so a looping walk cycle would be skating on the spot. Walk-in duration
>   comes from each creature's own gait via `groundSpeed` (turtle 533ms), so one cycle still carries
>   one stride.
> • **The cast was re-picked so EVERY animal has a sheet** — a pan of stills beside a pan of living
>   creatures reads as broken art, not a choice. cat/fox/bear dropped; replacements chosen to BELONG
>   in each world rather than merely to be available (lamb and chick were available and rejected — a
>   lamb is not a forest animal): playground **rabbit · duck · ladybug**, forest **squirrel ·
>   butterfly · ant**, pond **frog · fish · turtle**. Verified live (5 forest rounds, `everAStill: []`)
>   and statically (all 9 items resolve to a registered sheet). **Zero credits spent on this.**
>
> ## ⑤ ⚠️ THE BUG WORTH CARRYING: THE WALK-IN PLAYED ONCE AND DIED
> It ran on round 1 and was **dead for rounds 2–10**. React reconciles those sprite elements across
> rounds — same component, same position, same key — so the element is REUSED and `arrived` survived
> from the previous round. **This is invisible to a single check**: you look once, it works, you move
> on. Caught only by arming a `MutationObserver` and finding it logged **zero** mounts on a new round.
> Fixed with an explicit `resetKey`. **The general rule is now in the craft doc: verify an animation on
> the SECOND round, never the first.**
> *(Also: my own probes were wrong three times before the code was — pan TOPS legitimately differ
> because a 7-pan is two rows tall; a breath read as `none` because I sampled the wrong nesting level;
> and resizing while the pane was hidden never reached the page. Suspect the instrument first.)*
>
> ## ⑥ A STALE ITEM IN THIS FILE, CORRECTED
> The `milo-happy.png` / `milo-thinking.png` 404 (listed as an open art decision with ~18 call sites)
> **is closed — both files now exist.** No spend needed.
>
> ## ▶ OPEN
> 1. **NOTHING IS COMMITTED.** Working tree: `docs/story-6-8-rethink.md` (new) · `chapter-craft.md` ·
>    `SeesawPark.tsx` · `critters.tsx` · `canvas/sheets.ts` · **10 new PNGs** in `public/assets/`.
>    Deploying needs the usual `public/sw.js` bump (v67 → v68).
> 2. **Next in the order: A2 — StoryTime + MarketDay onto `critters`**, so joiners walk in from
>    off-frame and leavers walk out instead of a stationary sprite fading (the exact fault PlayTime was
>    built to fix). No new art, PlayTime is a direct template, `SheetSprite` is ready for their item
>    grids. Then **A3 HopAlong** (`milo_hop` + the discrete `hop(from, to)`), then **B** — one bundling
>    engine serving placeValue + additionTo100 + subtractionTo100.
> 3. **The `fps` cadences are UNVERIFIED BY EYE** on all 10 new sheets. One number each in `sheets.ts`.
> 4. **524.7 Higgsfield credits expire ~2026-07-30** and nothing in the app has a named consumer for
>    them — 9–11 is code-drawn neon HUD, teen has no sprites. Honest uses: a retry if a cycle reads
>    wrong on screen, or cat/fox/bear (~27) only if those three are ever wanted back.
> 5. **Nobody has watched a child play any of this**, and the 6–8 wording is unread aloud.
> 6. Still the headline: **~zero real users.**
>
> _(the ✂️ block below is the previous session — the over-engineering audit, SHIPPED.)_

> ✂️ **2026-07-27 — A REPO-WIDE OVER-ENGINEERING AUDIT, THEN THE TWO BIGGEST CUTS TAKEN: `src` IS 62,489 → 57,255 LINES (−5,234, 8.4%), 34 ROUTES → 22, 9 DEPS → 8. 🚀 SHIPPED — fast-forwarded into `main` and pushed, prod serving sw v67.** `tsc` · 142/142 vitest · `next build` · the changed security header verified on a running server.
>
> **The ask:** a `/ponytail-audit` over the whole tree, then *"delete /play and the kit-preview components"*, then the one follow-up the deletion exposed.
>
> ## ① WHAT WAS DELETED
> | | lines |
> |---|---|
> | `src/app/play/` — 10 webcam AR mini-games + their hub | 2,244 |
> | `src/infra/ar/` — the three un-consolidated hand hooks + landmarker | 521 |
> | `CameraError` · `HowToPlay` · `DifficultyBadge` — found `/play`-only during the cut | 158 |
> | `src/app/kit-preview/` | 256 |
> | 9 teen kit components only that gallery imported | 2,055 |
>
> `src/infra/ar` was the sole consumer of **`@mediapipe/tasks-vision`**, so the dep went too. The 9
> components — StreakMarker · CaseCard · FindingsLog · NumericEntry · FractionEntry · FigureDiagram ·
> StepSelect · StudioSkyline · TeenTopbar — are pre-GameShell "Field Lab" leftovers; every teen
> chapter has run on GameShell since the 17–18 migration. **Kept:** CoordGrid (12 importers), MiloMark,
> ChoiceGrid, NumberLine, CalmAdvance, MasteryState, TeenLessonShell, ExploreStep, and BandScope +
> `/sim-preview` (which previews a LIVE sim, not dead kit).
>
> ## ② THE TWO CUTS WERE NOT THE SAME RISK, AND IT IS WORTH KNOWING WHY
> • **kit-preview: provably zero.** The page called `notFound()` in production, so those 9 components
>   were never in a production bundle and no user has ever rendered one.
> • **`/play`: genuinely live** — 200 on prod. Nothing in the current app linked it, but `git log -S`
>   showed a **"Hand Games" menu entry existed and was removed in `a8296b4`**, so a user from that
>   window could hold a bookmark. Against 0 DAU/WAU/MAU and 2 real learners the exposure is nobody,
>   but *"unlinked now"* is not *"was never reachable"* — **check the history, not just HEAD.**
> A `/play → /menu` redirect was offered and **deliberately declined**: ~10 lines of permanent config
> to serve a hypothetical bookmark is the same speculative flexibility the audit was cutting.
>
> ## ③ DELETING A FEATURE LEAVES ITS PERMISSIONS BEHIND — the one real finding the cut produced
> `Permissions-Policy` carried **`camera=(self)`**, granted for the AR hand-tracking. With `/play`
> gone nothing calls `getUserMedia`, touches a MediaStream or renders a `<video>` — so the app was
> advertising a capability with no consumer. Now `camera=()`. Its comment also justified the grant by
> *"speech synthesis"*, which was **never true**: `speechSynthesis` is output-only and is not gated by
> Permissions-Policy at all. **Generalise: when a feature dies, grep the headers, the manifest and the
> CSP for the capabilities it asked for.** Verified on a running server, not in the config file — the
> served header is now `camera=(), microphone=(), geolocation=(), interest-cohort=()` and the other
> five hardening headers come back byte-identical.
>
> ## ④ A MEASUREMENT TRAP THAT NEARLY PUT A FALSE CLAIM IN THIS FILE
> To answer *"is `/play` actually live on prod?"* I curled it and grepped the body for
> `"could not be found"`. It matched — so I reported the route was already dead. **It was not.** That
> string is part of the Next.js not-found boundary **shipped in the HTML shell of every route**:
> `/menu`, `/story` and `/diagnostic` all match it too. Only the **HTTP status** distinguishes them
> (a truly absent route gives 404; `/play` gave 200). Caught by running the same probe against routes
> known to be live — *the control is what makes the measurement mean anything.* Same family as the
> repo's standing rule that a measurement disagreeing with the pixels is guilty until proven innocent.
> **Also burned, twice:** an inline `grep` pattern quoted for zsh silently matched nothing and reported
> every file in `src` as an orphan. A throwaway `.mjs` script did the job correctly. **A sweep that
> flags everything is a broken sweep, not a discovery.**
>
> ## ⑤ ⚠️ tsc "FAILED" ON DELETED ROUTES AND THE CODE WAS FINE
> After the deletions `npx tsc --noEmit` reported 24 errors — all `Cannot find module
> '../../src/app/play/*/page.js'` inside **`.next/types/` and `.next/dev/types/`**, which `tsconfig.json`
> includes. Those are generated route validators. `next build` regenerates `.next/types` but **not**
> `.next/dev/types`, which is written by `next dev` and goes stale on a route delete. Clearing it
> (safe — no dev server was running; see the standing warning about doing this mid-`next dev`) gave a
> clean exit 0. **Delete a route and expect one stale-validator failure that is not yours.**
>
> ## ⑥ THE AUDIT FOUND MORE THAN WAS TAKEN — this is the actionable residue
> Ranked, biggest first. The two taken above, then:
> 1. **Two walk-cycle sprite engines.** `ParadeStage` (Pixi, 601 + 97 lines) serves **exactly one
>    caller** — `world1.tsx:596` — while `critters.tsx` (DOM, 388 lines) serves five chapters and four
>    test suites. Porting the parade onto `critters` cuts **~839 lines and frees `pixi.js`**. It is a
>    rewrite of chapter 1's parade, not a deletion, so it carries real risk.
> 2. **The cut-out puppet rig is dead by construction** and this is now *proven*, not suspected:
>    `rigged = !!o.rig && !o.frames?.length`, and **all 6 `RIGS` keys (ant, crab, ladybug, rabbit,
>    squirrel, turtle) have a `SHEETS` entry**, so drawn frames always win. `rigs.ts` (141) + the rig
>    branches in `ParadeStage` (~130) + `scripts/creature-legs.py` + `creature-preview.py` = **~485
>    lines**. This closes the long-standing "DELETE THE DEAD RIG" item with evidence. *(Subset of #1 —
>    do not count both.)*
> 3. **`/daily` is unlinked** — no reference from any page, and the streak it existed for was dropped
>    from the DB in July. **256 lines.**
> 4. **`shuffle`/`pick`/`rint`/`rnd` are redefined 99 times.** One `src/core/rand.ts` saves **~90
>    lines**; **15 of the copies are the biased `sort(() => Math.random() - 0.5)`**, which is a
>    correctness matter for a normal review pass rather than this one.
> 5. `src/data/repositories/index.ts` is bypassed by 9 of 26 callers — pick one or the other.
>
> **Checked and found clean** (worth recording so it is not re-audited): no hand-rolled stdlib
> anywhere, no orphan modules beyond the above, no dead `GameConfig` fields, and all 8 remaining
> runtime deps earn their place. The July dead-code sweep did its job — what was left is the handful
> of things it deliberately parked as "decisions, not oversights".
>
> ## ▶ OPEN
> 1. **`docs/ar-phase0-brief.md` now describes deleted code.** The AR track is a decision TAKEN, not
>    one pending. Either annotate it or drop it.
> 2. **The residue in ⑥ is un-taken**, in that order. #2 (the dead rig) is the safest real cut left.
> 3. **No signed-in tap-through since this landed.** Nothing here touches an authed path, but the
>    routes changed, so the service worker's cached shell is worth one look on a real device.
> 4. **The voice corpus is still the top job overall** — the whole 3–11 band has zero clips.
> 5. Still the headline: **~zero real users.**
>
> _(the 📐 block below is the previous session — the short-landscape sweep, since SHIPPED: it is on
> `main` and prod reached sw v66, so that block's "NOT pushed, NOT deployed" status line is stale.)_

> 📐 **2026-07-27 — SHORT-LANDSCAPE SWEPT ACROSS THE 17–18 BAND (the last open item from the 🎡 block), AND IT FOUND ONE REAL DEFECT — IN A COMPONENT SHARED BY ALL 37 TEEN CHAPTERS. ⚠️ NOT COMMITTED WHEN THIS WAS WRITTEN → now on `feat/teen-explore-short-landscape`, NOT pushed, NOT deployed. Prod is still `main`@`413414a` / sw v65.** `tsc` · 142/142 vitest · `next build` · **two new e2e sweeps: 100 passed / 48 skipped / 0 failed (explore, 37 chapters × 4 sizes) and 52/52 (walkthrough + practice, 13 × 4 × 2 stages)**.
>
> **The ask:** *"short-landscape unchecked across the whole 17–18 band."* `640×320 · 667×375 · 740×360 · 1024×400`.
>
> ## ① THE ANSWER TO THE QUESTION ASKED: THE BAND IS CLEAN
> **156 measured screens, 0 failures.** No clipping, no board-on-instrument overlap, no horizontal
> overflow, nothing under the 24px operable floor, no console errors. `GameShell`'s short-frame
> layout — the two-column row plus `FitSlot` — holds at every size in all 13 chapters. The tightest
> answering controls are complexNumbers' PartsBuilder `±` at **31×31** with its commit at 127×34,
> which is the same class as the 15–16 band's stated 29×29 ceiling.
>
> **New gate: [e2e/short-landscape.spec.ts](e2e/short-landscape.spec.ts).** Measures three stages
> (explore · walkthrough · practice) against four invariants: nothing clipped, nothing overlapping,
> no h-overflow, no control under 24px. It distinguishes **clipped** from **merely scrollable** by
> walking ancestors for a scrollable one — that distinction is the whole point, because the defect
> below was reachable-by-scrolling and therefore invisible to every check that had passed.
>
> ## ② THE DEFECT — AND IT IS NOT A 17–18 REGRESSION
> All 128 below-fold elements were in **explore**, none in walkthrough or practice. The culprit is
> the shared [ExploreStep](src/features/chapters/teen/ExploreStep.tsx), which every teen chapter
> opens on. Measured at 640×320 **before**: header 125px (39% of the screen), 187 of the graph's
> 380px visible, the sim's own sliders at y≈690 and **"Skip to the game →" at y=824 — 504px below
> the fold**, ≈870px of content in a 320px port. Three things compound:
> `minHeight: 100dvh` is a FLOOR not a cap · `main` is `flex:1` with no `minHeight:0`, so it cannot
> shrink below its content · the sim's size is width-derived with no vh term. The portal's
> `overflowY:auto` then turns the overflow into a scroll, which is exactly why it never looked broken.
>
> ## ③ ⚠️ SCALE-TO-FIT IS NOT REFLOW — I PROPOSED THE WRONG FIX FIRST, AND THE ARITHMETIC KILLED IT
> The first plan was "cap at 100dvh and wrap the sim in `FitBox`, exactly the pattern `FitSlot`
> proves." **Wrong.** `FitSlot` works inside `GameShell` only because `PlayFrame` **reflows to two
> columns first** and scaling handles the modest remainder. Here the fit scale is `320/870 ≈ 0.37`,
> i.e. **13px sliders** — the identical wall the 15–16 pass hit (12×12 steppers, a 61×13 commit
> button). The height had to come out of the LAYOUT. *(This rule was already in the handoff; I
> re-derived it the hard way.)*
>
> ## ④ THE FOUNDER CAUGHT ME HIDING TEXT — TWICE
> To buy height I hid the intro paragraph; founder, from a 915×412 device: *"the paragraph got
> disappear."* Fixed by condensing rather than hiding — then the next pass hid the sim's own closing
> paragraph and he caught that too. **The rule is now a comment in both files: buy height from the
> VISUAL, which has room to give, and from the page chrome — never from the prose that says what the
> sim is for and what to notice in it.** A sim that fits and explains nothing is not a fix.
>
> ## ⑤ THE GENERIC CSS OVERRIDE WAS WRONG IN KIND, NOT DEGREE
> I first reflowed the sim from ExploreStep with a descendant selector treating **the first child as
> the visual**. Reading all 21 sims to convert them proved that is simply false for **SequenceExplorer**
> (first child is a mode-toggle row, the chart is second) and **WaveExplorer** (first child is an
> equation readout). Those two reflowed the *buttons* into the visual slot at every size. Founder:
> *"first make the things proper in one chapter then we can do the correction in rest"* — right call.
> **[SimLayout.tsx](src/features/chapters/teen/sims/SimLayout.tsx) now takes an explicit `visual` prop**;
> a sim declares its own parts and the shell cannot guess wrong, including for a sim written later.
> All 21 converted. **Generalise: do not infer structure across a set of hand-written components — the
> two that break the pattern are exactly the ones you will not think to check.**
>
> ## ⑥ TWO CSS TRAPS WORTH KEEPING
> • **CSS grid is the wrong primitive for "group children 2..n".** It needs the visual to span every
>   row, and **a spanning item's surplus height is DISTRIBUTED ACROSS EVERY TRACK IT SPANS** —
>   measured on statsInference, 97 supposedly-empty implicit rows came out at **1.33px each**,
>   inflating a 140px sim to 209px. An earlier attempt was worse: with a row-gap, `99 × 8px = 792px`
>   of pure gap put column 2 at **y = −340**, which rendered as an empty right-hand column.
> • **A backtick in a CSS comment silently ends a JS template literal.** Broke the build three times
>   in one session. There is now a note in the file saying so.
> • And a testing trap: **`npx tsc --noEmit | tail -5 && echo OK` always echoes OK**, because `tail`
>   exits 0 — one run printed real errors *and* "TSC OK". Check the exit code, not the pipeline's.
>
> ## ⑦ TALL FRAMES ARE UNCHANGED, AND THAT WAS MEASURED RATHER THAN ASSUMED
> `SimLayout` takes each sim's original `maxWidth` (340/380/400/420), `gap` (14/16/18) and
> `alignItems` as props precisely so it is invisible above the 469px breakpoint. Verified across all
> 25 explore chapters at 1280×800: `flex-direction: column`, original maxWidth, controls width ==
> sim width. **That check caught a real regression before it shipped** — `.mb-sim-controls` had no
> width, so under `align: center` it shrank to its content and every `width: '100%'` slider would
> have measured against the shrunk box.
> **Also verified NOT a regression:** 7 chapters scroll at 1280×800, and they are 595–779px tall
> against a ~610px band — they never fit. The committed original had no cap, so the same overflow
> pushed the footer down and scrolled the page; now the page does not scroll, the footer is pinned
> and **Continue is visible in all 7**. Strictly better.
>
> ## ▶ OPEN
> 1. **Commit is on a branch, NOT pushed and NOT deployed.** Deploying needs the usual `public/sw.js`
>    VERSION bump (v65 → v66) as its own commit.
> 2. **The gate measures only the FIRST scored question** per chapter/size, and its kind is a
>    generator draw — so each chapter gets one of its 4–6 instruments sampled per run. Visible in the
>    data: complexNumbers showed its compass at 640×320 and its (tighter) PartsBuilder at 1024×400.
>    Repeat runs widen the sample; forcing every kind needs a per-chapter hook.
> 3. **No real device.** Everything is a resized Chromium viewport — no browser chrome bar, no
>    safe-area inset, no soft keyboard.
> 4. **The 12–14 band has no explore sim at all** (48 of the 148 explore cases skip), so this change
>    cannot affect it. 15–16 and 17–18 have 25 between them and are all covered.
> 5. **The voice corpus is still the top job overall** — the whole 3–11 band has zero clips.
> 6. Still the headline: **~zero real users.**
>
> _(the 🎡 block below is the previous session — the 17–18 band completed.)_

> 🎡 **2026-07-26  — THE BAND IS COMPLETE: 13 OF 13. 🚀 SHIPPED TO PROD — `main`@`a7ad21d`, prod serving sw v65, smoke green + DRIVEN LIVE ON PROD. `tsc` · 142/142 vitest · `next build` · e2e question-quality **38/38 in 23.9m, 0 failures and 0 flakes** · every one of the 16 new question kinds driven by hand to `solved`.**
>
> **The ask:** *"complete that 3 remaining chapters also."* Those were the three blocked on primitives
> that did not exist: **#7 The Big Wheel** 🎡 (unitCircleTrig) · **#8 Daylight Hours** 🌅
> (trigGraphsIdentities) · **#10 Two Receipts** 🧾 (systemsMatrices). `BESPOKE_CHAPTERS` now holds
> only 3–11 story chapters — **every teen chapter in the app runs on GameShell.**
>
> ## ① THE ENGINE WAVE — three primitives in [gameKit](src/features/chapters/teen/games/parts/gameKit.tsx)
> | primitive | what it is | who needs it |
> |---|---|---|
> | **`MatrixPad`** | a bracketed grid of ± steppers; the answer IS a matrix | Two Receipts, which cannot exist without it |
> | **`CurveMatch`** | labelled dials reshaping a wave against a faint target trace — LineSetter generalised from a line to `a·sin(b(x−h))+k` | Daylight Hours |
> | **`CircleTap`** | step a pod round a circle and stop it; promotes the read-only `UnitCircleExplorer` sim into an answering instrument | The Big Wheel |
>
> **The plan's fourth item — lifting `RayLine` out of BalanceBench — was deliberately NOT done**, and
> the reason is in the code: it is wanted by functionToolkit and rationalFunctions, both of which have
> already SHIPPED with working answer surfaces. Lifting it now means reopening two live chapters for
> no gain to the three being built. None of these three needs it.
>
> ## ② A THIRD CHART SCALED TO THE WRONG RANGE — the band's most repeated bug
> `CurveMatch` first drew its vertical as **±7 about the centre**. A daylight year lives at 12 ± 5,
> entirely positive, so the whole target curve was drawn ABOVE the top edge and the clamp flattened it
> into a line along the ceiling — **the child had nothing to match.** Now 0..18, with the 12 h equinox
> line drawn in. That is the THIRD time this band has been bitten by the same thing (Cold Snap's
> polynomial ends, the exponential's sixth month), and all three were invisible to every gate because
> the answer still graded correctly. **The rule is now a comment in gameKit: scale a chart off the
> FEATURE BEING READ, not off the data's range.**
>
> ## ③ 56 TAPS IS A SLOG, NOT A LESSON
> Building `[[12,16],[20,8]]` up from zeros on the MatrixPad is 56 taps. Caught by watching it, not by
> a gate. The pad now **starts at the first operand** — which also models what addition actually is
> (take A, add B onto it), and gives nothing away because A is already on the board — and the scalar
> multiplier is capped at 3 rather than 4.
>
> ## ④ THE PICKER BUDGET LANDED EXACTLY ON ITS NUMBER: 10
> Big Wheel **1** (the exact coordinate pair — (√3/2, 1/2) is neither tappable nor buildable),
> Daylight Hours **2** (the two identity questions, the seam plan §5.1 already named), Two Receipts
> **1**. Band total **10** against the ~10 budgeted in plan §3 — the thing risk #4 warned would creep,
> counted at the end as it asked.
>
> ## ⑤ THREE DELIBERATE DEVIATIONS, each argued in the file that makes it
> • **No law of cosines in The Big Wheel**, even though it is the reason the world was chosen and the
>   gap between two pods really is it with the radius as both sides. The old lesson never generated it
>   and `conceptsConfirmed` does not claim it — adding it is growing the syllabus during a port. Same
>   call as TrainingBlock's Pascal and Cold Snap's synthetic division, and it is flagged as the first
>   thing to add if the chapter is extended.
> • **Two Receipts keeps ONE picker** where the plan said zero. "Infinitely many" is not a number, and
>   a pad offering 0/1/2/3 is a badly-posed board for a child who correctly thinks *infinite* and
>   finds no option.
> • **Matrix multiplication stays one entry on the pad**, not four dot products built on the MatrixPad.
>   Addition and scalar multiply build the whole result, which is where the pad earns its place.
>
> ## ⑥ WHAT WAS ACTUALLY VERIFIED
> Every question kind was forced to the surface with a temp cycle, driven by hand and asserted on
> `data-test-phase` — **16 kinds → `solved`**: Big Wheel's radian builder · quarter-turn pad ·
> CircleTap · reference-angle pad · sign switches · coordinate picker; Daylight Hours' CurveMatch at
> both tiers · extreme pad · both identity pickers; Two Receipts' price builder · MatrixPad · the
> solutions picker · determinant and product pads. All temp patches reverted and grepped for.
>
> ## ⑦ SHIPPED — and a STANDING CLAIM IN THIS FILE TURNS OUT TO BE TOO PESSIMISTIC
> Fast-forwarded to `main` (no merge commit), pushed, prod reached **sw v65** on the fourth poll.
> Smoke: `/` `/menu` `/api/health` `/diagnostic` and **all 13 of the 17–18 chapters → 200**. Then drove
> The Big Wheel on prod: explore sim → THE PLAN → walkthrough → scored round 1, built **(1/4)π** for
> 45° on the PartsBuilder. 0 console errors.
>
> ⚠️ **The 15–16 and 📱 blocks both say prod "cannot show that a correct tap grades correct", because
> `data-test-*` is stripped from production builds. That is true of the ATTRIBUTES and wrong about the
> screen.** The question board's tone is grade-derived and renders a visible **`SOLVED ✓`** label: the
> correct build above produced it on prod, and a deliberately wrong tap (`2` for `cos 270°`, which is
> 0) did NOT — it went to a reveal and advanced. So a correct grade IS observable in production, by
> reading the board rather than an attribute. The old caveat should be narrowed wherever it is
> repeated, not deleted: what prod still cannot give you is the machine-readable hook the e2e suite
> uses, so a 38-chapter sweep still has to run against a dev build.
>
> ## ▶ OPEN
> 1. ~~**The full 37-chapter e2e run.**~~ ✅ 38/38 in 23.9m, zero failures and zero flakes.
> 2. **Short-landscape is STILL unchecked across the whole band**, now with three more instruments.
> 3. **Nobody has read any of this aloud to a 17-year-old**, and it is now thirteen chapters of it.
> 4. **The voice corpus is still the top job overall** — the whole 3–11 band has zero clips.
> 5. Still the headline: **~zero real users.**
>
> _(the 📱 block below is the previous session — portrait for 12–18.)_

> 📱 **2026-07-26 — PORTRAIT IS NOW A REAL LAYOUT FOR 12–18, NOT JUST AN ALLOWED ONE. 🚀 SHIPPED TO PROD — `main`@`a81bc43`, prod serving sw v64, smoke green + DRIVEN LIVE ON PROD IN PORTRAIT. `tsc` · 136/136 vitest · `next build` · **the full e2e question-quality gate 35/35 in 21.0m, 0 failures and 0 flakes** · measured at 390×844 · 834×1194 · 640×320 · 1280×800.**
>
> **The ask:** *"for the age group 12-18 I want portrait mode also."*
>
> **What was actually wrong.** There is no rotate gate in the teen path, so portrait already
> rendered and nothing overflowed — the 2026-07-20 responsive audit was right that "portrait passed".
> It passed the wrong test. **Every size in the teen shell is `clamp(px, vw, px)` — width-derived,
> with no vh term anywhere** — so a tall narrow frame lands on the clamp MINIMUM everywhere while its
> height goes unused. Measured before the fix:
> • **390×844 phone** — tap buttons **76×60 at 24px type**, with **204px of dead space below them**.
> • **834×1194 tablet** — worse, because 834 ≥ 820 made it `roomy`, which **PINS the chalkboard into
>   the top-left corner**. Right on a laptop; on a portrait tablet the board sat in a corner with the
>   **bottom third of the screen empty**.
>
> ## ① THE FIX — one gate, three consequences, ~40 lines
> `useFrame` gains **`portrait` = `innerHeight >= innerWidth * 1.2`** (a SHAPE, not a size):
> 1. **`roomy` now excludes portrait**, so a portrait tablet stops pinning the board into a corner and
>    stacks it above the interactive — the layout that frame actually wants.
> 2. **`FitSlot` may ENLARGE on portrait** (`max` 1 → 1.5). It already existed to shrink an instrument
>    onto a short frame; the `max: 1` cap was the thing stopping a portrait frame using its height.
>    Covers the practice instrument AND the walkthrough scene, so ~19 instruments and 24 scenes are
>    fixed without touching one of them.
> 3. **`AnswerPad` gains `big`**, which swaps `Xvw` for `max(Xvw, X·1.45vh)`.
>
> **After, same frames:** phone pad **98×84 at 34px** (a 61% bigger tap target), the vault scene
> filling the width instead of floating in a dead band; tablet board full-width across the top with
> the scene scaled up and centred.
>
> ## ② TWO THINGS THE MEASUREMENT CAUGHT THAT THE FORMULA DID NOT
> • **The first vh coefficient (0.42) changed nothing at all** — the vh term came out UNDER the clamp
>   floor, so it clamped to exactly the old value and the screenshot looked identical. **1.45 is
>   derived, not chosen**: a portrait phone should land in the MIDDLE of each clamp, and 34px of the
>   24–52 font range at 844 high is 4.0vh against the 2.8vw it is written with. *Measure the rendered
>   px; a formula that "should" be bigger may be under the floor.*
> • **Bigger buttons then wrapped 3 + 1**, leaving a lone tap target on its own row — worse than the
>   small buttons it replaced. `big` now GRIDS at 2 columns for the 4-choice case (a clean 2×2) and
>   keeps one row for 3. **A size change is not done until you have looked at how it wraps.**
>
> ## ③ LANDSCAPE IS UNTOUCHED, AND THAT WAS CHECKED RATHER THAN ASSUMED
> For any landscape frame `portrait` is false, so `roomy` is the original expression, `FitSlot max` is
> 1, and `size()` returns the original literal `clamp(px, vw, px)` string — unchanged **by
> construction**. This repo has been burned by "provably" before, so it was measured anyway:
> **640×320 → 66×48 at 22px, flex** (the `compact` path, identical) and **1280×800 → 102×87 at
> 35.84px, flex** (exactly 8vw and 2.8vw of 1280). No overflow, nothing offscreen, at any of the four
> sizes. Grading re-verified on a portrait phone (`data-test-phase` → `solved`).
>
> ## ④ THE DEPLOY — three sessions, fast-forwarded to `main` and pushed
> Built on **`feat/teen-17-18-gameshell`**, split so each commit is one idea rather than one
> afternoon, then **fast-forwarded into `main` (no merge commit) and pushed → Vercel prod**:
> | commit | what |
> |---|---|
> | `4539b2d` | the 17–18 band onto GameShell — 10 chapters, 9 extracted sims, the plan doc, the curriculum amendment, the gate fix, 20 deletions |
> | `496c2dd` | portrait for 12–18 (`GameShell` + `gameKit` only) |
> | `b7529b8` · `69b158d` · `626421f` | this handoff, in three passes |
> | `a81bc43` | sw v63 → v64 for the deploy |
>
> **⚠️ AND A GIT TRAP THAT NEARLY MIS-SPLIT IT, which AMENDS the advice already in this file.** The
> 2026-07-23 block says *"`git commit` with no pathspec commits the WHOLE index — use
> `git commit -- <paths>`"*, which is true and incomplete. **A pathspec that is a DIRECTORY commits
> the working tree under it, ignoring the index entirely** — so `git commit -- src/…/teen/games`
> swallowed `games/parts/GameShell.tsx` and `gameKit.tsx` into the chapters commit, even though both
> had been explicitly `git reset`. The portrait work would have shipped inside a commit whose message
> never mentions it. **Caught by `git show --stat HEAD | grep parts` before moving on**, undone with
> `git reset --soft`, redone by staging precisely and committing from the INDEX with no pathspec.
> *Verify a commit's file list against what you intended; do not trust that unstaging held.*
>
> ## ⑤ THE FULL GATE RAN, AND IT IS THE ONE THAT MATTERED FOR THE PORTRAIT CHANGE
> **`question-quality` — 35/35 in 21.0m** (34 chapters + the standalone "a wrong answer never leaves a
> blank stage"). Zero failures, zero flakes, zero retries in the whole log. This is the run the merge
> was waiting on, because the portrait commit touches `GameShell` and `gameKit` — **shared by all 24
> existing teen chapters**, not only the 10 new ones — so the 11 chapters driven by hand were never
> enough evidence on their own. The suite's viewport is **1280×820, i.e. landscape**, which is exactly
> the surface the portrait change had to leave alone, and it does.
>
> ## ⑥ POST-DEPLOY SMOKE — and what prod CANNOT prove
> Prod `sw.js` reached **v64** on the fourth poll. `/` `/menu` `/api/health` `/diagnostic` `/auth`
> `/parent` and **all 10 migrated 17–18 chapters → 200**. Then DROVE it rather than trusting status
> codes: Cold Snap on a **390×844 portrait phone**, explore sim → start → THE PLAN → walkthrough →
> scored round 1, board full-width at the top with finger-sized switches and a full-width commit —
> the portrait layout, live. Committed a deliberately WRONG answer (`↘↗` on `f(x) = 3x⁴`, which
> climbs at both ends) and **the glide corrected it to `↗↗` on screen**. 0 console errors.
> ⚠️ **What prod cannot show, stated plainly:** `data-test-answer`/`data-test-phase` are compile-time
> stripped from production builds, so the live drive proves the boards render, the instrument works
> and a wrong answer reveals — **not that a correct answer grades correct.** That assertion comes from
> the 35/35 e2e run on a dev build of the identical code.
>
> ## ▶ OPEN
> 1. **This is 12–18 ONLY.** The 3–11 story band still has its `RotateGate` and is landscape-only by
>    design — those chapters are built around a horizontal journey. Portrait is not app-wide.
> 2. **Not checked on a real device.** Everything here is a resized Chromium viewport; a real phone
>    adds a browser chrome bar, a safe-area inset and a soft keyboard the ScribblePad may fight.
> 3. **The portrait TABLET still has generous empty space** on a pad question (the board+pad group is
>    centred in a 1194px column). It reads as deliberate symmetry rather than broken, and it is the
>    honest state of things: that frame has more height than the content needs. Raising
>    `PORTRAIT_MAX` past 1.5 pushes the commit button off the bottom on a phone, so it is one number
>    that cannot serve both — a per-frame max would be the follow-up if the tablet matters.
>
> _(the 🌡️ block below is the same session's earlier work — the four 17–18 chapters.)_

> 🌡️ **2026-07-26 — THE FOUR NO-PRIMITIVE 17–18 CHAPTERS BUILT: THE BAND IS NOW 10 OF 13. 🚀 SHIPPED — landed in `4539b2d`, on prod as part of `main`@`a81bc43` / sw v64. `tsc` · 136/136 vitest · `next build` · e2e question-quality 4/4 on the new ids · all four driven live, 0 console errors.**
>
> **The ask:** *"do the remaining four chapters."* Those are the four the plan lists as needing no new
> engine work: **#3 Cold Snap 🌡️** (polynomialFunctions) · **#6 The Balance That Grows 💳**
> (expLogFunctions) · **#9 Torch on the Wall 🔦** (conicSections) · **#12 The Reviews ⭐**
> (statsInference). All four sims were already extracted, so nothing was lost to a deleted wrapper
> this time.
>
> **⚠️ NOTHING IS COMMITTED OR DEPLOYED.** Prod is still `main`@`9800be3` / sw v63. Net for this
> session: **+1,711 lines of game against −2,441 deleted** (8 files: 4 wrappers + 4 lessons), 4
> registry rows moved `BESPOKE_CHAPTERS` → `PORTAL_CHAPTERS`, 4 ids added to the e2e gate (now 34 of
> the eventual 37).
>
> ## ① THE PICKER BUDGET IS HOLDING — 6 of ~10 across ten chapters
> The design rests on reaching for a card LAST ([plan §3](docs/teen-17-18-gameshell-plan.md)). Cold
> Snap has **zero** pickers, Torch **one**, ExpLog **two**, Reviews **one** — band total **6** with
> ten of thirteen built. Two of those were bought back by re-asking the question rather than
> re-wording it:
> • **Torch's classify needs no card at all, which beats the plan.** §5.2 had the child tilt the torch
>   and then commit on a 4-card SpecPicker. The tilt already IS the classification — 0° is a circle,
>   part-way is an ellipse, 60° (where a beam edge runs parallel to the wall) is a parabola, past that
>   a hyperbola — so the picker was dropped and the band's most-recalled question became a hand
>   gesture. Any tilt inside a band grades correct, because any tilt inside it really does make that
>   shape.
> • **Torch's ellipse orientation was "horizontal or vertical", a two-card choice.** Re-asked as HOW
>   FAR the beam reaches the long way, which needs the identical reading (find the bigger denominator)
>   and comes out as a number.
> • **Reviews lost TWO conceptual MCQs to one gesture** — "which summary resists an outlier" and "what
>   does adding one do to the mean" are both now the incoming-review slider: set the fifth review's
>   rating so the listing's average lands on a stated figure.
>
> ## ② TWO REAL BUGS, BOTH FOUND BY LOOKING, BOTH THE SAME ROOT CAUSE
> Neither was visible to any gate — both graded correct while being unreadable.
> • **Cold Snap's temperature trace was normalised by its PEAK.** A polynomial's ends run away from
>   everything in the middle, so the dip below freezing — the only part of the curve the chapter is
>   about — was squashed to a few pixels. Now scaled off the **70th percentile of |f|**, with the ends
>   running off the top and clipped.
> • **The Balance That Grows drew its curve scaled to its SIX-MONTH value.** 25 × 3⁶ is 18,225 against
>   a £225 target, so the target line sat on the floor and the crossing the child has to read was
>   unreadable. Now scaled off the **target**, curve clipped. A first fix clamped the y instead, which
>   made the curve flatten along the top edge — **a saturated exponential reads as a balance levelling
>   off, the exact opposite of the point** — so the clamp was replaced by a clip.
> **The general rule, now true twice: scale a chart off the FEATURE BEING READ, not off the data's
> range.** Exponentials and polynomials both dwarf their own interesting part.
>
> ## ③ TWO PLACES THE INSTRUMENT DELIBERATELY WITHHOLDS A NUMBER
> Both are the hot/cold rule ([chapter-craft §1](docs/chapter-craft.md)) applied to a dial that could
> otherwise verify the answer for the child:
> • **The month dial does not print the balance at the marker.** Printing it would let them slide
>   until the screen agreed. They read the crossing, or they do the log.
> • **The review slider does not print the running average** until the reveal, for the same reason.
> The plan's §5.2 wording for #6 ("read off the curve") was followed; what it does NOT do is confirm.
>
> ## ④ DELIBERATE NARROWINGS AND ONE ADDITION, each commented where it lives
> • **Cold Snap's roots are positive**, so every factor reads `(x − r)` and every crossing lands inside
>   the drawn week. That drops the `(x + r)` case the old lesson had — a crossing on day −3 is not
>   something this chart can show. Same call as ShareTheWifi's positive-only break point.
> • **Cold Snap GAINS a sign chart**, which the old lesson did not have. Kept because it needs no math
>   the zeros task has not already generated (the sign of a product) and it is the one question this
>   world makes vivid — which hours are icy. **Nothing else was added**: no synthetic division, no
>   build-from-zeros, per the TrainingBlock precedent that porting is not the moment to grow a
>   syllabus. Verified live that the answer does not simply alternate — a doubled root gives
>   `below, below, above`.
> • **Reviews' poll-inference MCQ became the margin of error as a number** (100 ÷ √n, the standard
>   conservative rule, with review counts chosen so it always lands on a whole percent).
>
> ## ⑤ WHAT THE VERIFICATION ACTUALLY COVERED
> Every question kind in all four chapters was driven by hand and asserted on `data-test-phase`, not
> on the screen advancing — the 15–16 lesson. **21 distinct question kinds → `solved`**: Cold Snap's
> end switches · sign chart · crossings trace · four pads; ExpLog's rate dial · month dial · two
> pickers · two pads; Torch's tilt · aim pad ×2 · direction picker · two pads; Reviews' star slider ·
> bias picker · four pads including **a decimal mean (3.8) on the tap pad**, which was the one float-
> equality risk worth checking. A wrong answer on Cold Snap's trace → `reveal`, and the glide moved
> the markers to the right days on screen. All four then passed `question-quality` (1.8m, 4/4).
>
> ## ▶ OPEN — pick up here
> 1. ~~**COMMIT IT.**~~ ✅ Done — `4539b2d` on `feat/teen-17-18-gameshell`. **Not pushed, not deployed.**
> 2. **The engine wave is the only thing left blocking the band** — `MatrixPad`, `CurveMatch`,
>    `CircleTap`, plus lifting `RayLine` out of BalanceBench. #7 The Big Wheel, #8 Daylight Hours and
>    #10 Two Receipts cannot start without it. That is the whole remainder: 3 chapters.
> 3. **Short-landscape is still unchecked across the entire band** — now twelve new instruments over
>    ten chapters. `640×320 · 667×375 · 740×360 · 1024×400`.
> 4. **Nobody has read any of this wording aloud to a 17-year-old**, and it is now ten chapters of it.
> 5. **#3 Cold Snap remains on notice** as the weakest world of the thirteen, for the reason the plan
>    already gives: a real week of temperature is closer to sinusoidal than polynomial. Building it
>    did not change that judgement — it reads well because zeros, multiplicity, sign chart and end
>    behaviour are all vivid in it, and the end-behaviour `context` says out loud that a fitted curve
>    is not to be trusted outside the week, so the world is not made to claim something false.
> 6. **The voice corpus is still the top job overall and is still untouched** — the whole 3–11 band has
>    zero clips and the ElevenLabs quota resets 2026-07-27 (tomorrow).
> 7. Still the headline, still unchanged: **~zero real users.**
>
> _(the 🎛️ block below is the first half of this work — the design, and the first 6 chapters.)_

> 🎛️ **2026-07-26 — THE 17–18 BAND STARTED ON GAMESHELL: DESIGNED, THEN 6 OF 13 CHAPTERS BUILT. 🚀 SHIPPED in `4539b2d` with the four chapters in the 🌡️ block above; prod `main`@`a81bc43` / sw v64. `tsc` · 128/128 vitest · `next build` · e2e question-quality 6/6 · every chapter driven live.**
>
> **The ask:** *"design the chapters of age group 17-18 the way we designed 12–14 and 15–16."* Then,
> after the first world list: *"can be more daily life examples."* Then build the pilot, then the
> five cheap chapters.
>
> **🚀 NOW LIVE.** Prod serves these chapters at `main`@`a81bc43` / sw v64. Gates are green and one
> chapter was driven on prod; **a human still has not played any of them.**
>
> ## ① WHERE THE BAND WAS, AND WHY IT WAS WORTH DOING
> All 13 of the 17–18 chapters were still on the **pre-GameShell "Field Lab"** shape — the one 15–16
> was migrated off on 2026-07-07 — as bespoke wrappers in `BESPOKE_CHAPTERS`. That is ~3,829 lines of
> wrapper + ~4,214 of lesson re-implementing, thirteen times, the loop `GameShell` already owns, with
> every question answered on a `ChoiceGrid` MCQ. No chalkboard, no overview read-along, no
> walkthrough, no instrument, no `padValue`, and not in the e2e gate.
>
> ## ② THE DESIGN — [docs/teen-17-18-gameshell-plan.md](docs/teen-17-18-gameshell-plan.md)
> Same shape as the 15–16 plan, and it follows 15–16's settings deliberately: **no guided round**
> (every graded gesture worked in the walkthrough), **explore sim on all 13**, tutorial always an
> array, `context` written FIRST on every padded task.
>
> **The one decision that mattered.** Counting the answer types across all 13 lesson files:
> **40 numeric vs 57 string**, with four chapters at *zero* numeric. Ported straight, over half the
> band becomes "tap the right card" — the [§0a](docs/chapter-craft.md) failure. But reading the
> generators, **most of those strings are structured numbers wearing a string costume**, because
> `ChoiceGrid` takes strings: `"(3, −4)"` is two integers, `"x = 2"` is one, `"5 + 2i"` is two in a
> template, `"Shift right 2"` is a knob setting. So the rule for the band is a three-rung ladder —
> **tap a number → BUILD the value → pick a card, last** — which leaves ~10 pickers across all 13.
> *The band looks ~60% symbolic and is ~15% symbolic.* Six chapters in, the running total is **2**.
>
> ## ③ THE FOUNDER CORRECTION THAT RESHAPED IT: DAILY LIFE, NOT CAREERS
> The first world list was professional — patch bay, server rack, radar, ops board, orbits — because
> [curriculum-12-18.md](docs/curriculum-12-18.md) frames the band as *"math studio / analyst"* with
> hooks like signal processing and polling. Founder: **"can be more daily life examples."** Right:
> those are workplaces a 17-year-old reads about, not ones they live in. Re-cast around what they
> touch in a normal week. **[curriculum-12-18.md carries a dated amendment](docs/curriculum-12-18.md)**
> so the spec and the code do not disagree silently — the `mapMaker` lesson from 15–16.
>
> | # | chapter | world | built? |
> |---|---|---|---|
> | 1 | `functionToolkit` | **Photo Filters** 🎚️ — the curves panel is literally a function | ✅ |
> | 2 | `quadraticAnalysis` | **The Resale Flip** 👟 — price vs profit | ✅ |
> | 3 | `polynomialFunctions` | **Cold Snap** 🌡️ — a week of temperature | — |
> | 4 | `complexNumbers` | **The Walk Home** 🗺️ — grid streets; ×*i* is a left turn | ✅ pilot |
> | 5 | `rationalFunctions` | **Share the Wifi** 📶 | ✅ |
> | 6 | `expLogFunctions` | **The Balance That Grows** 💳 | — |
> | 7 | `unitCircleTrig` | **The Big Wheel** 🎡 | — |
> | 8 | `trigGraphsIdentities` | **Daylight Hours** 🌅 | — |
> | 9 | `conicSections` | **Torch on the Wall** 🔦 | — |
> | 10 | `systemsMatrices` | **Two Receipts** 🧾 | — |
> | 11 | `sequencesSeries` | **The Training Block** 🏋️ | ✅ |
> | 12 | `statsInference` | **The Reviews** ⭐ | — |
> | 13 | `introCalculus` | **Pace** 🏃 — average pace vs the pace right now | ✅ |
>
> Two stopped being decoration: **#9** tilting a torch IS cutting a cone with a plane, and **#7** the
> gap between two pods on a Ferris wheel IS the law of cosines with the radius as both sides.
> **Five seams are named in §5.1 of the plan rather than papered over** — synthetic division,
> conjugate roots, a removable hole, trig identities, nonlinear systems. Those are algebra with no
> daily anchor in ANY world; they are framed as algebra on the ScribblePad.
>
> ## ④ THE PILOT (complexNumbers → The Walk Home) AND THE THREE BUGS DRIVING IT FOUND
> Chosen because it was the sharpest test of §②: 8 string-answer sites, **0 pickers** proposed.
> • **The compass arrow never turned.** `style={{ rotate }}` got a MotionValue *string* → computed
>   `transform: none`. Invisible on a screenshot, because the last step lands back on east — where a
>   stuck arrow already points.
> • **Fixed that, and it then lagged a full heading behind** the narration for the whole example.
>   Replaced with the plain CSS transition the interactive compass already used. **One way of turning
>   an arrow, not two.**
> • **`WalkScene` derived its route from `stepIndex`, which is GLOBAL across worked examples**
>   (GameShell flattens them into one timeline) — correct only while that example happens to be
>   first. Now derived from the value.
>
> ## ⑤ A FLAW IN A GATE, FOUND BY MUTATION-TESTING IT
> Both static gates cover new files automatically. Mutation-tested against the pilot: removing
> `padValue` → `answerPadGrading` fails; removing a `context` → `paddedQuestionContext` fails. **But
> the second one named the WRONG TASK.** A chunk starts at the `badge:` line, so a task written
> across two lines keeps its title outside its own chunk and a forward `title:` search finds the NEXT
> task's. Detection was always right; the message sent you to the wrong place. Fixed — the title is
> now resolved by looking BACK from the chunk's first line. Re-mutated: names "As the crow flies".
>
> ## ⑥ WHAT THE e2e PROVES HERE, AND WHAT IT DOES NOT — READ THIS BEFORE TRUSTING IT
> All 6 chapters pass `question-quality` with 0 console errors. **But the spec `break`s at the first
> instrument question** (`if (!turn.acted) break`), and these chapters open on one. So it proves the
> boards are well-posed and the console is clean — **NOT grading, and not that the set completes.**
> Grading was hand-driven, asserting `data-test-phase`, never that the screen advanced:
> • pad → `solved` on all six · plan dial `+ 4` → `solved` · compass → `solved` · walk pad → `solved`
>   · filter rack *invert* → `solved` · price board `(−2, −3)` → `solved` · SpecPicker → `solved`
> • level dial set deliberately WRONG → `reveal`, instrument still mounted with the child's value,
>   then the **glide corrected it on screen** before advancing. Same for the walk pad (`−2, 5`).
> ⚠️ **Not reached by hand:** Pace's window trace + rule builder, PhotoFilters' range limit,
> ShareTheWifi's fault marker, TrainingBlock's nth/sum pads — all L2/L3, behind several right answers.
>
> ## ⑦ THE NEAR-MISS, AND TWO CORRECTIONS TO MY OWN PLAN
> • **I deleted `IntroCalculusChapter.tsx` before extracting its inline `SecantExplorer`** — the exact
>   mistake §6 of the plan warns about, one step after writing the warning. Recovered via
>   `git show HEAD:`; it also depended on two helpers in the lesson file I had deleted, now inlined
>   into the sim. **8 of the 13 sims are inline in wrappers that are about to die — extract first.**
> • §7 proposed a new "union-`V` needs `padValue`" static check. **It already exists**
>   ([answerPadGrading.test.ts](src/__tests__/answerPadGrading.test.ts)).
> • §6's "−8,000 lines" was optimistic. The pilot came out **break-even** (−633/+652); the five-chapter
>   batch is a real net cut (−3,711 deleted vs ~2,900 added). The saving is shared machinery, not lines.
>
> ## ⑧ DELIBERATE NARROWINGS, each commented where it lives
> ShareTheWifi's break point is positive only (a negative device count is not a thing — this drops the
> `x + 3 → −3` sign case) and its equal-degree ratio is forced whole so a dial can express it.
> WalkHome dropped the degenerate modulus pairs `(3,0)`/`(0,4)` and narrowed L3 mult factors to ±(1..3)
> so a built answer stays inside a reachable slider. Pace replaces the one conceptual MCQ with the
> window gesture. TrainingBlock does NOT add Pascal or convergent series — the old lesson generated
> neither, and porting is not the moment to grow the syllabus.
>
> ## ▶ OPEN — pick up here
> 1. ~~**COMMIT THIS.**~~ ✅ Done — `4539b2d`, and **shipped**: prod now serves GameShell for 10 of
>    the 13; the last three still run the old Field Lab.
> 2. **The engine wave** — `MatrixPad`, `CurveMatch`, `CircleTap`, plus lifting `RayLine` out of
>    BalanceBench. **#7 The Big Wheel, #8 Daylight Hours and #10 Two Receipts are blocked on it.**
> 3. **The four no-primitive chapters left:** #3 Cold Snap, #6 The Balance That Grows, #9 Torch on the
>    Wall, #12 The Reviews.
> 4. **Nothing has been checked at short-landscape** — eight new instruments across six chapters, and
>    this repo has shipped short-landscape collisions before. `640×320 · 667×375 · 740×360 · 1024×400`.
> 5. **Nobody has read any of the new wording aloud to a 17-year-old**, and there is a lot of it —
>    six chapters of `context` lines written this session, all unread by a human.
> 6. **#3 Cold Snap is on notice** as the weakest world of the thirteen: a week of real temperature is
>    closer to sinusoidal than polynomial. It earns its place only because zeros, sign chart,
>    multiplicity and end behaviour all read clearly and nothing else in daily life crosses zero
>    repeatedly.
> 7. **The voice corpus is still the top job overall and is untouched here** — the whole 3–11 band has
>    zero clips, and the ElevenLabs quota resets 2026-07-27 (tomorrow).
> 8. Still the headline, still unchanged: **~zero real users.**
>
> _(the 🎓 block below is the previous session — the 15–16 clarity pass.)_

> 🎓 **2026-07-26 — THE 15–16 BAND BROUGHT UP TO THE 12–14 STRUCTURE. SHIPPED TO PROD. `main`@`eb96a72`, prod serving sw v63, smoke green + DRIVEN LIVE ON PROD.**
>
> **Deploy:** `feat/teen-15-16-question-clarity` → `main` (fast-forward) → pushed → prod **v63**.
> Gates: `tsc` · **116/116 vitest** (was 91) · `next build` · **e2e question-quality 25/25 across BOTH
> bands, 13.7m, 0 console errors per chapter** · driven live at 1024×620 and 640×320.
> Smoke: `/` `/menu` `/api/health` `/diagnostic` and **all twelve 15–16 chapters 200**. Then DROVE
> PROD, not just status codes: Skate Ramp rendered the new 3-zone board live (*"The ramp edge leans
> off the ground at 114°… A straight line is worth 180° in total"*), its pad carried its own answer
> (**66** for 180−114), tapping it advanced to a **different generator** whose triangle-sum context
> also rendered; Leaderboard's corrected line came up on a **both-positive seed (4 and 5)** and read
> true — *"the two moves may build on each other or partly cancel"* — which is exactly the sentence
> the first draft got wrong. 0 console errors on prod.
> ⚠️ **What prod CANNOT show, stated plainly:** `data-test-answer`/`data-test-phase` are compile-time
> stripped from production builds, and both a right and a wrong answer advance the question — so the
> live drive proves the boards render, the pads hold the right numbers and the set advances, but NOT
> that a correct tap grades correct. That assertion comes from the e2e suite on a dev build of the
> identical code (it asserts phase `solved` + pad-contains-its-own-answer for all 24 chapters); prod
> differs from it only by that stripped attribute.
>
> **The question asked was "do the 15–16 chapters have the same structure as 12–14".** Answer, after
> reading all 24 game files field by field: **the engine is identical and two differences are
> deliberate — but one whole pass had never reached the band.**
>
> ## ① WHAT IS THE SAME, AND WHAT DIFFERS ON PURPOSE
> Both bands are 12 chapters on the same `GameShell`: `overview` (THE PLAN) → `tutorial` +
> Framer-Motion `TutorialScene` → scored loop, plus `answerPad` · `motif` · `glide` · `work` · `say` ·
> ScribblePad. Deliberate, from the 2026-07-19 rebuild — **leave these alone**:
> | | 12–14 | 15–16 |
> |---|---|---|
> | `guided:` round | 12/12 | **0/12** — every graded gesture is worked in the WALKTHROUGH instead |
> | `explore:` sim | 0/12 | **12/12** |
> | `tutorial` shape | mixed object/array | always an array (multi-example) |
> | `padValue` | 0 needed (V is `number`) | 8/12 (V is a tagged union) |
>
> ## ② THE REAL GAP — THE EXPLAINING PASS NEVER REACHED 15–16, AND THE BOARD SILENTLY ATE THE PROMPT
> The "explaining-type" wording pass (`03361ec`, sw v47, 2026-07-24) covered all twelve 12–14
> chapters. **The 15–16 band was rebuilt five days EARLIER and never got it** — five chapters
> (Leaderboard · TicketCheckout · GoingViral · ScreenDistance · SkateRamp) had **zero `context:`**.
> That is not cosmetic, because of a chain worth remembering:
> `QuestionBoard` goes **structured** the moment `context` OR `instruction` is set
> ([gameKit.tsx](src/features/chapters/teen/games/parts/gameKit.tsx):599), structured mode **never
> renders `prompt`**, and [GameShell.tsx](src/features/chapters/teen/games/parts/GameShell.tsx):534
> sets `instruction` from `padInstruction` on **every padded question**. So in those five chapters the
> sentence each task had carefully written — *"Two holds sit 3 across and 4 up. How far apart are
> they?"* — **was dead code**, and the child saw badge + tap-chip over an empty story zone.
> **19 `context` lines added/rewritten across 8 files** (all four padded generators in Leaderboard,
> seven in SkateRamp, two in ScreenDistance, three in GoingViral, one in TicketCheckout, plus the
> label-only one-liners in TheShot/BuildPlot/FollowerGrowth expanded into real explanations).
> Only PADDED tasks were touched: an instrument task has no `padInstruction`, so it is unstructured
> and still renders its `prompt` — adding `context` there without `instruction` would have *created*
> this bug rather than fixed it.
> ⚠️ **They were written 68% too long at first** (median 198 chars vs 12–14's 118) and trimmed back
> inside the band's own envelope after measuring both. Boards verified at 1024×620 and **640×320**,
> where the layout goes two-column — the board sits left of the pad, so a naive vertical-gap check
> reported an 81px "overlap" that the screenshot showed was nothing. *Trust the pixels.*
>
> ## ③ THE BUG I SHIPPED INTO THE FIX, CAUGHT BY DRIVING IT
> Leaderboard's new line read *"…so two moves in opposite directions partly cancel out"* — and the
> live seed drew **2 and 6, both positive**. `a` and `b` are independently signed, so the sentence was
> simply FALSE for most seeds. Same class as the "Deeper debt" line for two positive balances that the
> 12–14 audit fixed, and the craft doc's *an attribute question must be true of its object*. Audited
> every line I had written for sign-dependence and found **three more**: a bonus landing "`c` times
> over" when `c` can be negative, a "bonus" that is a debuff when `k < 0`, and a "gain" that is a loss
> when the slope is negative. **A generated sentence must hold for EVERY seed the generator can draw**
> — the reason is now a comment on each of the four.
>
> ## ④ TWO GATES, AND THE SECOND ONE WAS WRONG TWICE BEFORE IT WAS RIGHT
> • **[question-quality.spec.ts](e2e/question-quality.spec.ts) now drives all 24 teen chapters**, not
>   just 12–14. This was open item #1 from 2026-07-19 and it matters MORE here than in 12–14: the
>   pad-contains-its-own-answer check is exactly the `padValue` defect that **shipped to prod in this
>   band** and survived a hand-drive. No harness change was needed — `reachPractice` already stops on
>   phase `guided` **or** `practice`, so a guided-less band lands straight in the scored loop.
> • **NEW [paddedQuestionContext.test.ts](src/__tests__/paddedQuestionContext.test.ts)** (25 tests) —
>   a source check that every task setting `padInstruction` also sets `context`, so §② cannot recur.
>   **It passed on the first run, so it was mutation-tested, and two planted regressions walked
>   through it:**
>   – it anchored the task delimiter on `badge:` at line start, missing every task written
>     `title: …, badge: …` — WeatherStation's four collapsed into ONE chunk and a neighbour's
>     `context` covered a deleted one;
>   – it matched `context:` only, so GearLab's computed-local **shorthand `context,`** read as
>     missing and it reported a false defect in a 12–14 chapter.
>   Both fixed; **7/7 planted regressions now caught**, each naming the offending task by title.
>   *A gate that has never been seen to fail is not evidence — and a "finding" it produces is guilty
>   until the mutation proves the gate, not the code, is right.*
>
> ## ⑤ ONE REAL COVERAGE GAP CLOSED, AND A CORRECTION TO MY OWN FIRST ANSWER
> I first reported the old 15–16 coverage gaps as "already closed" from a grep. **That was wrong for
> one of them:** PowerUps' power-of-a-power was pinned `const b = 2`, so *every answer it ever
> produced was a power of two* — pattern-matchable without touching the law it teaches. Now
> `pick([2, 3])` with the same readable-stat ceiling its two neighbours already use (2⁷=128, 3⁴=81).
> The others really are closed (SkateRamp has 6 triples, MapMaker has arc/sector), and
> ScreenDistance's missing √12/√27/√48/√75 is a **documented design limit** — only sums of two squares
> are climbable — not a bug.
>
> ## ▶ OPEN — pick up here
> 1. **Instrument tasks in 15–16 are still 2-zone by construction** — they have no `padInstruction`,
>    so they render their `prompt` and nothing is lost. Bringing them to the 12–14 3-zone shape
>    (NightFlight's `context` + `instruction`) is a real but purely-cosmetic follow-up; doing it
>    requires adding BOTH fields or the prompt vanishes.
> 2. **Nobody has read the new wording aloud to a teenager.** The gate is structural — it cannot tell
>    you whether *"Angles facing each other across a crossing are a different relationship from angles
>    sitting side by side"* parses for a struggling 15-year-old. **19 new sentences went to production
>    unread by a human**; that is the one thing here a script cannot cover.
> 3. **A signed-in tap-through on prod is still not done for this band** — the preview route needs no
>    auth, so nothing above exercises the progress-saving path.
> 4. **The voice corpus is still the top job and is untouched here** (explicitly out of scope this
>    session). ElevenLabs quota reset 2026-07-27; the whole 3–11 band still has zero clips.
> 5. Still the headline, still unchanged: **~zero real users.**
>
> _(the 📏 block below is the previous session — the measurement chapter.)_

> 📏 **2026-07-26 — THE MEASUREMENT CHAPTER RE-THOUGHT AND REBUILT: THE VERB IS *MEASURE IT*. SHIPPED TO PROD. `main`@`1e129ab`, prod serving sw v62, smoke green + DRIVEN LIVE ON PROD.**
>
> **Deploy:** `feat/story-3-5-measure-it` → `main` (fast-forward) → pushed → prod **v62**.
> Gates: `tsc` · **91/91 vitest** (was 79) · `next build` · 0 console errors in a fresh tab. Smoke:
> `/` `/menu` `/api/health` `/diagnostic` and all ten 3–5 story chapters **200**; every sprite and
> backdrop the chapter needs **200**. Then DROVE PROD, not just status codes: the demo laid blocks at
> **3867 / 4868 / 5867ms — exactly 1000ms apart**, so the pacing fix is genuinely live; the guided
> daisy and its run measured **201.8 vs 201.8, Δ0 on height AND baseline**; the thing held **left
> 381.3 at one block and at three**, so the reserved lane holds; a scored tulip graded **correct**,
> advanced, and wrote **🌷 3** into the notebook. 0 console errors on prod.
>
> **Files.** `TallForest.tsx` → **[MeasureIt.tsx](src/features/chapters/story/MeasureIt.tsx)** (rewritten, not renamed — nothing of the old chapter survives). New
> [measureItGeometry.test.ts](src/__tests__/measureItGeometry.test.ts) (12 tests). Rewired:
> [registry.tsx](src/features/chapters/registry.tsx):48 · [story/page.tsx](src/app/story/page.tsx):41.
> `?ch=measure` unchanged; `?world=` is now `forest|trail` (**`market` is gone — see ③**). **0 new art.**
>
> ## ① WHY IT WAS RE-THOUGHT, AND WHAT THE VERB IS NOW
> The old chapter was *tap the taller / longer / heavier one* — which is **chapter 5 (Bigger or
> Smaller) with a different adjective on it**, the §0a fault that got Group B rebuilt twice. Reading
> the file made it worse than that:
> • **Height was faked.** It uniform-scaled ONE sprite by value, so "taller" was really "bigger" and
>   a child could win on area without ever reading height.
> • **Length was a distortion** — `objectFit:'fill'` stretched the sprite non-uniformly.
> • **Weight was hot/cold.** The plank tipped toward the heavier side BEFORE the child committed, so
>   the answer was "tap the low end". Same fault as chapter 4's green Ready button.
> Founder chose the verb: **MEASURE IT.** The child lays one repeating unit — a block — end to end
> against the thing and decides when the run has reached the end of it. *A ruler is nothing but a
> repeated unit, counted*, and that is the one idea measurement has that counting and comparison do
> not. Three things follow, and they are why this verb was the right pick:
> • **The eyeball shortcut is gone by construction.** You cannot guess "6 blocks".
> • **It is playable with the sound OFF** — the question is a picture. That matters a lot right now:
>   the band still has zero recorded clips, and the colouring chapter is already the one that is
>   unanswerable in silence. We did not want a second.
> • **The answer is one the child MADE**, and deciding when to stop is the whole skill — the same
>   shape as chapter 4, so the pile always holds more blocks than the thing needs and nothing on
>   screen says "that's enough" until they commit.
>
> ## ② THE CONSTRUCTION — the thing and the run agree, they are not tuned to agree
> A thing's unit count is its IDENTITY (a tulip IS 3 blocks, a pine IS 6), so the sprite is drawn at
> exactly `units × unitPx` on the measured axis and the completed run is the same product. Same trick
> as Shape House's socket being the same path as its piece. Difficulty picks WHICH thing to measure,
> never a hidden scale — so the unit never changes size, which it must not: a ruler whose marks
> resize is not a ruler.
> • ⚠️ **The PNGs are square-padded and that would have made the measure LIE** — a tulip's ink fills
>   only 87% of its file, so drawing it by its file box puts the flower's tip well below the top of
>   the frame while the blocks reach the frame. Every sprite is drawn from its own **alpha box**,
>   measured with PIL and stored per thing. (Kitchen's `SPRITE_BBOX` had the same need.)
> • Verified live, which is the only claim that matters: at 1024×620 thing and run measured
>   **identically — top 277.4, bottom 538, height 260.6** for a 4-unit sunflower; at 640×320 the
>   train engine and its 3 blocks came out **Δ0 on both width and left**.
>
> ## ③ WEIGHT IS DELIBERATELY NOT A WORLD, AND THE REASON IS THE RULE
> The obvious build — pile counters into the empty pan until the beam levels — **levels exactly when
> the count is right**, so it hands the answer over before the child commits. That is the same fault
> as the tipping seesaw it would replace. An honest version needs the beam LOCKED until Done, which
> needs a latch that reads as intentional rather than broken. **Deferred with the reason written into
> the file header**, not forgotten. The chapter hint in `chapters.ts` still says "heavy, light" —
> worth updating if this stays two worlds.
>
> ## ④ FOUR REAL BUGS, ALL FOUND BY DRIVING IT — the general rules are now in the craft doc
> • **The demo raced past in 4 seconds.** `speakSteps` advances on each utterance's `end`, and a
>   device with no usable voice ends a ONE-WORD utterance in milliseconds — so the counting steps
>   never reached the timer fallback that exists for exactly this. Measured: both demos AND the
>   guided round arrived inside four seconds. Now self-paced on a deterministic timer with `speak()`
>   alongside, the way the colour and shape showcases already run. Re-measured: blocks land at
>   **exactly 1000ms intervals**, 20s of demo. **Sentences are fine on `speakSteps`; single words
>   are not.**
> • **The thing being measured JUMPED a whole unit when the first block landed** — the run's lane is
>   zero-sized until then. The lane is now reserved at full size from empty. Verified by sampling:
>   **one distinct position across 0, 1, 2 and 3 blocks.**
> • **The contact shadow was in flow**, so the run bottom-aligned against the shadow rather than the
>   ground and the two ends of the measure stood **28px apart**. A measure whose ends do not share a
>   ground line measures nothing. Shadow is now out of flow.
> • **22px blocks on a landscape phone.** `PROMPT_BAND` at the roomy 112 eats 35% of a 320px screen,
>   and the unit is `band ÷ 6.6`, so that was 35% off the size of the blocks a three-year-old has to
>   count. The band and the pill now shrink together on short screens → **39px** at 640×320.
>
> ## ⑤ THE GATE, AND THE MUTATION THAT SURVIVED IT
> [measureItGeometry.test.ts](src/__tests__/measureItGeometry.test.ts) imports **`measureLayout` —
> the same function the scene draws from** (chapter 4's sweep re-implements its chain, which lets a
> check agree with its own copy of the constants). 12 tests × 13 sizes × 12 things. It passed first
> run, so it was **mutation-tested**: over-sizing the unit, removing the cap and giving a thing more
> than `MAX_UNITS` blocks all fail it. **One survived — widening the layout's width term** — and it
> was CHECKED rather than assumed: at every size where that term binds, the 76px cap holds the run to
> 456px, which fits a 640px frame. **Inert, not a missed regression**, and the classification is
> written into the test. Chasing it also showed the sweep had no narrow-but-tall sizes at all
> (640×620, 700×800 — a half screen, a portrait tablet), which are the ONLY sizes where that term
> binds; they are in the list now.
> **And the gate then caught a real consequence**: raising the short band grew the phone unit
> 21.8→39px and broke an assertion calibrated to the old squeeze. It was restated, not relaxed —
> it now says what it means (the unit reaches its cap on a laptop, and is never under 26px on a phone).
>
> ## ⑥ THE MEASURING LESSON, AGAIN, IN A NEW COSTUME
> Three separate alarms this session were the instrument, not the app: a block measuring **half its
> real size**, blocks **hidden behind the controls**, and a **backdrop showing the wrong scene**. All
> three were entrance animations caught mid-flight — `getBoundingClientRect` includes transforms, and
> **a backgrounded tab freezes a CSS animation there indefinitely**, so waiting is not enough; the tab
> has to be fronted first. Also re-learned: in-page `setTimeout` chains collapse when the tab is
> backgrounded, so three taps 300ms apart landed in one tick and the tap lock correctly ate two of
> them — drive one step per call.
>
> ## ▶ OPEN — pick up here
> 1. **THE SIX COLOUR CLIPS ARE NOW THE TOP JOB, AND THE QUOTA HAS RESET — ElevenLabs reset
>    2026-07-27.** Unchanged from the last session: the whole 3–11 band has zero recorded audio (the
>    435 clips are teen-only, because [voice-corpus.mts](scripts/voice-corpus.mts) has a hardcoded
>    teen-only file list), so the colouring chapter's toy-room test is **unanswerable on a silent
>    device**. Do: red · yellow · blue · green · orange · purple, ~30 characters, stitched the way the
>    teen prompts already are. The fuller job is the whole 3–11 static corpus, ~2.9k characters.
>    ⚠️ This chapter was deliberately built to be playable in silence, so it does NOT add to that
>    debt — the colouring chapter is still the one that needs the clips.
> 2. **Weight, if it should exist** — needs the locked-beam design in ③, or the founder's call that
>    two worlds is enough. Either way update the `measurement` hint in
>    [chapters.ts](src/core/chapters.ts):65, which still promises *"Tall, short, heavy, light!"*.
> 3. **Nobody has watched a child play it.** Specifically unknown: whether a three-year-old works out
>    "stop when you reach the top" without being told, and whether 39px blocks are countable by eye
>    on a real phone. Every check here drove a button through JS.
> 4. **3–5 IS NOW COMPLETE** — all eleven chapters rebuilt and shipped. There is no next chapter in
>    the band, so the next 3–11 work is either the voice corpus, the 6–8/9–11 bands, or watching a
>    child.
> 5. **Still the headline, still unchanged: ~zero real users.** Every fault in this session was found
>    by driving the chapter; every fault in the last two was found by the founder's finger.
>
> _(the 🎨 block below is the previous session — Group B and the colouring chapter.)_

> 🎨 **2026-07-25 — GROUP B REBUILT (EACH SKILL GETS ITS OWN VERB), THEN THE COLOURING CHAPTER RE-CUT AS *TEACH ONE PAGE → TEST ON ANOTHER* AND FIVE FOUNDER CATCHES FIXED. SHIPPED TO PROD. `main`@`f44ce11`, prod serving sw v61, smoke green + DRIVEN LIVE ON PROD.**
>
> **Deploy:** `feat/story-3-5-group-b-teach-then-test` → `main` (fast-forward) → pushed → prod **v61**.
> Gates: `tsc` · **79/79 vitest** · `next build` · 0 console errors in a fresh tab. Smoke: `/` `/menu`
> `/api/health` `/diagnostic` and all six rebuilt story chapters (`shapes` `rainbow` `beads` `home`
> `order` `nest`) **200**; both new `colour_*.png` and the two backdrops **200**. Then DROVE PROD, not
> just status codes: the colouring lesson filled **red `230,69,69` → yellow `255,201,60` → blue
> `63,163,238`** and moved on to "4 of 6 · This is GREEN" with the green pot cued; the shapes chapter
> reported **no build during the showcase**, the house clearing the fence by **46px** and the prompt by
> **94px**. 0 console errors on prod.
>
> **Files.** Modified [ShapeTown](src/features/chapters/story/ShapeTown.tsx) ·
> [RainbowTown](src/features/chapters/story/RainbowTown.tsx) ·
> [BeadShop](src/features/chapters/story/BeadShop.tsx) ·
> [ShapesLesson](src/features/chapters/lessons/ShapesLesson.tsx) ·
> [story/page.tsx](src/app/story/page.tsx). New:
> [floodFill.ts](src/features/chapters/story/floodFill.ts) ·
> [lessonSeen.ts](src/infra/storage/lessonSeen.ts) · 2 art files (31KB).
> **DELETED: `keeper.tsx`** — the previous session's whole approach, see ⓪.
>
> | chapter | verb now | verified |
> |---|---|---|
> | 🏠 Shape House (`shapes`) | **FIT** — a shape sorter | 1024×620 + 640×320, full run, flight + depth swept 8 sizes |
> | 📿 Bead Shop (`beads`) | **CONTINUE** — one growing necklace/bunting/train | 1024×620 + 1280×720 + 640×320, full run, strand read back |
> | 🎨 Colouring Book (`rainbow`) | **COLOUR IT IN** — teach in the garden, test in the toy room | 1024×620 + 640×320, both pages driven, pixels sampled |
> | 📏 Measurement (MeasureIt) | **MEASURE IT** — lay a unit end to end and count | done in the 2026-07-26 session above |
>
> ## ⑥ THE COLOURING CHAPTER IS NOW *TEACH THEN TEST*, AND THE PAGE SPLIT IS WHAT MAKES THE SCORE MEAN ANYTHING
> Founder: *"use one image to teach all color names and use second image to test them."* Right, and
> the reason it works is worth keeping. **A garden is made of things with ONE colour in the world** —
> sun yellow, sky blue, grass green — so *"colour the sun yellow"* is answerable by a child who knows
> suns and has never learned the word *yellow*. That is exactly what you want while TEACHING (the
> object anchors the word) and exactly what you must not have while testing. **A toy has no default
> colour**, so in the toy room nothing on screen can help and the spoken word is the only thing that
> can. Generalised in the craft doc: *if the scene can answer the question, you are teaching, not
> measuring.*
> • **Lesson** = 6 beats, one per colour, in a fixed order. Each says the word three times (naming the
>   paint, on the tray, and again on the finished colour). The right pot BOUNCES; the tray keeps a
>   stable order so the child builds a "red lives here" map. Nothing scored — a wrong pot is the thing
>   being taught, so Milo just names what they picked and points again.
> • **Test** = the toy room, cue gone, pots shuffled, 10 rounds. Verified `cue: null` throughout.
> • **A handover screen sits between them**, because the picture, the tray order and the hint all stop
>   at once and a child not told that has had the game taken away.
> • **The demo and guided rounds are GONE** — the lesson is the scaffold; six taught beats plus a demo
>   plus a guided round is three kinds of hand-holding in a row.
> • **Skip** ([lessonSeen.ts](src/infra/storage/lessonSeen.ts)) appears in the lesson only from the
>   SECOND run. Offered on the first it is just a big button a three-year-old presses to leave the
>   teaching, then meets a test nothing prepared them for. ⚠️ Falls back to a **device** key when
>   nobody is signed in — otherwise `/story?ch=rainbow` (how the founder tests) never writes the flag
>   and the skip never appears at all.
> • ⚠️ **THE ONE TAP THAT CANNOT BE REMOVED.** Founder asked to start straight in the lesson; the
>   screen is stripped to a single button over the picture and no more. `unlockSpeech()` MUST run in a
>   real gesture or mobile autoplay silences Milo for the whole chapter, and **nothing upstream
>   unlocks it** — every chapter does its own. This is the one chapter that is unanswerable without
>   voice. To truly remove it, unlock on the menu tap that launches the chapter (shared launch path).
>
> ## ⑦ FIVE FOUNDER CATCHES, AND EVERY ONE WAS INVISIBLE TO THE CHECKS THAT PASSED
> • **"I'm clicking the tulip and it isn't colouring."** The ink is a WALL to the flood fill and for a
>   small shape the outline is most of the shape — measured, **40% of taps aimed at a tulip landed on
>   ink and were silently discarded**, and there is ink 7px from its centre. A near-miss rescue
>   already existed and ran *after* `if (!region) return`, so the exact case it was written for never
>   reached it. **A bail-out must not sit in front of the rescue that handles it.** Now 91%/83%.
>   → Then `floodNearest` (founder-approved): a tap on ANY line takes the nearest area, so silent taps
>   are **0% on every target** (was 40% tulip, 38% wall, 30% rabbit, 26% roof/sun). It picks the
>   SMALLER neighbour — a line is the outline *of* the small shape, and an accidental petal beats an
>   accidental lawn (it filled the whole lawn before that).
> • **"Except the tulip, wherever I click gets purple."** Three faults at once: the glow was tuned at
>   10–44% grey — fine on the sky, invisible on a 76px tulip beside an identical one; tapping the
>   other tulip said *"That's the tulip!"* while the prompt said *colour the tulip*; and every unnamed
>   area filled silently, so you could paint the whole page while the task sat undone. Now 42–86%,
>   *"That's the **other** tulip"*, and Milo re-asks after three off-question fills.
> • **"Colour the cloud purple" is not a correct thing.** Clouds are white and the trunk is brown;
>   neither exists in a six-paint box, so both stopped being questions (still free to colour). The
>   honest replacements were already in the drawing — **tulips**, which can be any colour. Daisies
>   cannot: every petal floods separately at ~1,400px, so "the flower" is not one area.
> • **The shapes chapter's ghost house was a WIREFRAME.** Empty sockets were a hairline stroke at 20%
>   opacity; painted scenes contain no hairlines, so it read as a blueprint on the lawn and fading it
>   further just makes an invisible wireframe. Now shadowed sockets (translucent warm dark + near-white
>   rim) at 50%. Also removed from the "meet the shapes" beat entirely — it meant nothing there.
> • **"Move the house behind the fence."** The fence is painted INTO the backdrop, so no z-index can
>   do it: in a painted scene depth is vertical position. Feet 8%→26%, scaled to 0.78 (further back
>   must also be smaller), and the ground line is now **per build** — the beach behind the boat is open
>   water with nothing in front. ⚠️ **Raising its feet raised its roof**: the apex landed 5px under the
>   prompt pill at 640×320, overlapping horizontally. Capped against the prompt band; swept 8 sizes ×
>   2 builds → 0 failures, fence clearance 32–111px, prompt clearance 13–208px.
>
> ## ⑧ THE TESTING LESSON, WHICH IS THE REAL ONE
> Every check I ran tapped a target's stored **probe point — its dead centre, the single easiest tap
> on the page** — so the mechanic was only ever verified where it could not fail. The founder found
> the dead tulip in one try with a finger. **Exercise an interaction at the EDGES of its target and on
> the boundary itself.** Same family as reading a band instead of the spots a layout really returns.
> Also re-learned: a stale HMR console (`PAGE is not defined`, `short is not defined`) and a stale
> preview screenshot both cost real time again — a fresh tab and a re-shoot are the answers, both
> already in the craft doc.
>
> ## ⓪ THE FOUNDER'S CORRECTION, AND WHY THE LAST SESSION'S WORK WAS DELETED
> These three had been one surface with different nouns on it — *Milo names a thing, tap it among
> three* — and the previous session's fix was to bolt a shared travelling creature (the "keeper") onto
> all three. **That was the same mistake one layer up: one decoration for three different skills.**
> The keeper changed nothing the child DID; it commuted to the answer and back while they waited.
> Founder, on the colouring chapter: *"did you know how coloring games work?? I want that concept."*
> **A skill's verb has to be the answering gesture.** The table is now in
> [docs/chapter-craft.md §0a](docs/chapter-craft.md) along with the two traps it implies — that the
> verb decides whether a chapter is playable with the sound off, and that you must implement the real
> ACTIVITY rather than a gesture that mimes it.
>
> ## ① 🏠 SHAPE HOUSE — the question is a HOLE, not a name
> Milo is building; one socket in the build pulses empty; the child taps the piece that fits and it
> **flies into place**. Ten parts across two builds — a house in the garden, then a walk to the beach
> and a boat — so round 10 looks nothing like round 1 and the arc needs no widget.
> • **It is answerable with the sound off**, the only one of the three that is, because the question
>   is a picture. Milo still names the shape, so the vocabulary is still taught.
> • Exactness holds by construction: the socket is the SAME `ShapeSVG` path as the piece, drawn
>   `outline`. Nothing is ever non-uniformly scaled.
> • `SEQUENCE` is the whole chapter's question list (demo=0, guided=1, scored=2–9), so the build can
>   never drift out of step with the round.
> • Measured: flight target `left 824.5 / top 459.8` against a socket centre of `(825, 460)` — exact —
>   `scale(0.477)` = the socket/piece ratio, duration derived from distance.
> • ⚠️ **A perfect run ends with the boat part-built** (mastery early-exit ~round 7, full stars). Correct
>   per the band's rule, but this is the one chapter whose reward is the finished thing. Founder's call.
>
> ## ② 📿 BEAD SHOP — one string, and it gets longer
> The old chapter strung a fresh pattern each round, threw it away, and drew a SECOND necklace in a
> corner card — two necklaces, one to read and one to admire, and on a short frame the card sat on the
> tray. **Fixed by deletion: there is one string.** The round's run is its front; the tapped item
> threads on and stays; items that scroll off shrink and dim into a tail so the thing is visibly long.
> A gold joint marks where a new pattern starts when the tier changes the unit.
> • The picker became a real choice of WHAT to make — necklace (beads/string) · bunting (flags/cord) ·
>   train (cars/track) — one material per run, because you do not thread a bead then a button.
> • The pattern is also a **chant**: "red, blue, red, blue… what comes next?"
>
> ## ③ 🎨 THE COLOURING BOOK — this one took three attempts, and the last two are the lesson
> **v1** was the line-up (colour as a quiz answer). **v2** put five whole objects on a greyed painted
> backdrop and recoloured one per round — founder: *"not a proper blend"*, and he was right twice
> over: four drawing styles on a photo, AND a picture is not five things floating on emptiness.
> **v3 is the actual thing.** One generated line-art scene, cut by its own ink into **113 enclosed
> areas**; pick a colour, tap an area, it floods. [floodFill.ts](src/features/chapters/story/floodFill.ts)
> is a scanline flood fill — the regions are not layers or masks cut by hand, they are whatever the
> drawing encloses, which is why a tree's trunk and crown are separate without anyone deciding so, and
> why **one 32KB PNG carries the whole chapter**.
> • **The same flood answers both questions**: which pixels to paint, and WHICH area was tapped — by
>   testing a stored probe point against the flooded mask. One pass, no labelling.
> • **The lesson rides on top.** Milo asks for a colour AND a thing ("colour the roof red"), so both
>   words are learned and a wrong tap names what was touched. **Everything he has not asked for is
>   still fillable, any colour, ungraded** — verified: a flower petal went green while the round was
>   still "colour the tree green". Locking those to protect the scoring would make it a quiz again.
> • Art: 2 pages generated, **BOTH now wired** — see ⑥, the garden teaches and the toy room tests.
>   ~18 credits total, **602.7 left**. The chroma key was done in Python rather than paying for
>   `remove_background`, which would have eaten the white interiors.
>
> ## ④ FIVE REAL BUGS, ALL FOUND BY DRIVING IT — the general rules are in the craft doc
> • **A wrong answer wiped the whole picture.** I bumped a React `key` to restart the nudge animation;
>   that remounts the subtree, and the canvas is in it. Every colour the child had put down was
>   destroyed by getting one thing wrong. → `el.animate(...)`, no remount.
> • **The prompt banner swallowed taps on the sky** — a transparent full-width bar carving a dead
>   stripe through the picture. → passthrough class, buttons keep their events.
> • **Bead Shop threaded a DUPLICATE bead.** A re-teach only runs after the round was submitted, and a
>   round is submitted when the child finally gets it right — so the item was already on the string.
>   Caught by reading the strand back as `RBRBBB|RBBBRBR`; clean `RBRBRBRBRBRBR` after.
> • **Bead Shop's tray was unpositioned in the scored rounds** — correct in the demo, on top of the
>   strand in practice, because `SkillBeat` renders the play surface in its own flow. The band has to
>   be owned by the tray, not applied at the call site.
> • **A blue cloud on a blue sky is invisible** — a correct tap gave no feedback at all.
> • Plus the one I re-introduced and had to strip again: **`useIsSpeaking()` in the tap gate**, which
>   swallows the child's retry for 3+ seconds. It is in the craft doc; I still copied it in.
>
> ## ⑤ TWO MEASUREMENT TRAPS THAT COST REAL TIME (both now in the craft doc)
> • **Two taps in the same tick are a TEST artefact, not a user.** React commits state between events,
>   so a script that picks a colour and taps the page in one statement reads a stale ref — half an
>   hour chasing a fill that was never broken.
> • **A backgrounded preview collapses nested `setTimeout`s**, so a driver with 150ms/400ms taps
>   silently fires only the first. Drive one step per call instead of trusting in-page timers. And the
>   pane still intermittently reports `innerWidth 0`, which makes every rect read lie.
>
> ## ▶ OPEN — pick up here, in order
> 1. **THE SIX COLOUR CLIPS — the top job, and the shipping of this chapter is what made it urgent.**
>    ⚠️ **CONFIRMED IN THE CODE, NOT ASSUMED: THE WHOLE 3–11 BAND HAS ZERO RECORDED CLIPS.** The 435
>    clips on disk are teen-only — [voice-corpus.mts](scripts/voice-corpus.mts) has a hardcoded file
>    list of the 24 teen game components plus `GameShell`, and nothing under `features/chapters/story/`
>    is in it. So 3–11 runs on browser `speechSynthesis` alone, which **Safari has and many Chrome
>    installs do not** (why `_pickVoice` prefers LOCAL voices — Chrome's "Google …" ones fail silently).
>    What that means for this chapter, precisely:
>    | | on a silent device |
>    |---|---|
>    | **lesson** (garden) | still playable — the right pot bounces — but it teaches NOTHING, and hearing the word attached to the thing is the entire point |
>    | **test** (toy room) | **unanswerable.** No cue, and a toy has no default colour, so nothing on screen can tell them which paint |
>    That second row is a direct consequence of making the toy room an honest test: a picture that
>    cannot answer for the child also cannot rescue them when the voice is missing. The design is
>    right; it now depends on audio the band does not have.
>    **Do:** red · yellow · blue · green · orange · purple, ~30 characters, stitched the way the teen
>    prompts already are. ElevenLabs quota was ~38.5k/40k used and **resets 2026-07-27** (checking it
>    this session failed — the MCP tool was erroring). The fuller job is the whole 3–11 static corpus,
>    ~2.9k characters, which fixes the band rather than one chapter.
> 3. ~~**Measurement (TallForest)** — the last 3–5 chapter. Ask its verb first, per §0a: it compares an
>    ATTRIBUTE, so neither the creature engine nor any of these templates obviously fits.~~ ✅ **DONE
>    2026-07-26 — see the 📏 block at the top.** The verb turned out to be MEASURE IT, and the answer
>    to "neither template fits" was that measurement needs neither: the child builds the answer.
> 4. **Small, known, not done:** the shapes chapter's `Explain`/re-teach copy still reads as a first
>    demonstration in places; and `lessonSeen` is per-device when signed out, so two siblings on one
>    tablet share the "skip" flag.
> 5. **Still the headline, still unchanged: ~zero real users, and nobody has watched a child play any
>    of the 3–5 band.** Nearly every fault this session was found by the FOUNDER using a finger, after
>    scripted checks had passed — because those checks all tapped the easiest pixel on the page.
>
> _(the 🐾 block below is the previous session — Group A and the motion fix. The 🏠 keeper block that
> sat here has been removed: `keeper.tsx` is deleted and every chapter it touched was rebuilt.)_

<details><summary>Superseded — the keeper pass (2026-07-25, deleted the same day)</summary>

> 🏠 **GROUP B, FIRST ATTEMPT — a shared travelling creature ("keeper") bolted onto shapes, colours and
> patterns, plus a bottom-right card for each chapter's arc. Rebuilt from scratch the same day when the
> founder pointed out that one decoration for three different skills is the same fault one layer up.
> `keeper.tsx` and all three cards are deleted. Two findings survive it:**
>
> • **A swallowed crash looks exactly like a dead button.** `keeperFor` did `KEEPERS[i % len]`, and JS
>   `%` KEEPS THE SIGN — so the `-1` that `Array.indexOf` returns for "not found" became `KEEPERS[-1]`
>   → `undefined` → the chapter died on `kind.src` inside `MiloErrorBoundary`, where a crash is
>   indistinguishable from taps doing nothing. Callers passed `WORLDS.indexOf(world)`, which really
>   does return -1 after a hot reload leaves a held object with a stale identity. **Check the console
>   before debugging the handler.**
> • **A backgrounded preview throttles `setInterval` to ~1Hz.** A 100ms sampler returned 6 rows in 8.5
>   seconds, which reads exactly like "nothing moved". Sample STATE (transition duration, play state,
>   computed style), not interpolated positions. (Now generalised in the craft doc.)
</details>

> _(the 🐾 block below is the session before Group B — Group A and the motion fix.)_

> 🐾 **2026-07-25 — THREE MORE 3–5 CHAPTERS ON THE CREATURE ENGINE (addition · subtraction · comparison), AND THE MOTION ACROSS THE WHOLE BAND MADE NATURAL. SHIPPED. `main`@`3c391b6`, prod serving sw v60, smoke green + DRIVEN LIVE ON PROD.**
>
> **Deploy:** `feat/story-3-5-play-time-compare-and-natural-motion` → `main` (fast-forward) → pushed → prod **v60**.
> Gates: `tsc` · **79/79 vitest** (was 66) · `next build`. Smoke: `/` `/menu` `/diagnostic` `/api/health`
> and all six story chapters (`add` `sub` `kitchen` `home` `order` `nest`) **200**; walk sheets, Milo's
> underwater pose and the reef backdrops **200**. Then DROVE PROD: the arrivals measure **1986ms and
> 3411ms with a 0.75s leg cycle**, both inside the ceiling and running at the creature's true gait,
> stationary ones `paused` — the same numbers as local, so the motion fix is genuinely live. 0 console errors.
> Net **+1841 / −1626 lines**: Kitchen, Orchard and LilyPond (~1575 lines) deleted, three new sweeps added.
>
> ## ⓪ THE REMAINING 3–5 CHAPTERS WERE RE-THOUGHT FIRST, AND THE ANSWER IS TWO TEMPLATES, NOT ONE
> Surveying all seven leftovers against the craft doc, they fail the same four rules — nothing alive
> before a tap, no journey, no cumulative arc, no rotate gate — but they split into two groups needing
> **opposite** treatments, and each already has a shipped template here. No new engine was needed.
> • **Group A — countable quantity** (comparison · addition · subtraction): the HomeTime/FollowTheLeader
>   template, `critters.tsx`, **0 new art**. ✅ ALL THREE DONE THIS SESSION.
> • **Group B — exact form** (shapes · colors · patterns): each file's own header says the answer must
>   stay geometrically or chromatically exact, and the handoff already recorded *"do NOT animate Shape
>   House the same way."* These want the **NestTree** template — answer stays exact and STILL, one live
>   creature makes the journey — and are **augmentations, not rebuilds**. Their names already promise the
>   missing arc: a house that gets built, a town that gets painted, a necklace that grows. ▶ NOT STARTED.
> • **Measurement** is the odd one out (an attribute, not a count) — lowest confidence, do it last.
> Founder calls taken: **landscape-only across all 7**, and Group A first.
>
> ## ① PLAY TIME — addition + subtraction, ONE component ([PlayTime.tsx](src/features/chapters/story/PlayTime.tsx))
> They are the same journey run in opposite directions, so they share a component with an `op` prop —
> the 6–8 band already does this for add/subtract (BlockYard). `a` are playing with Milo and `b` MORE
> **walk in from off-frame**, or `b` of them **walk out and leave**. The operation itself is the thing
> that moves. Before, both groups POPPED in with a CSS scale and subtraction's leavers "left" by fading
> a stationary sprite's opacity — the arithmetic happened in a jump-cut.
> • **Slot order is the trick:** movers always own the LEFTMOST slots, so an arrival stops at the near
>   edge of the group and a leaver walks straight out — neither passes through anyone.
> • **Sums capped at ten on screen.** Forced by object-driven counting, not chosen — and it happens to
>   put the chapter ON grade level (K.OA, within 10) instead of the old ceiling of 14. Be honest about
>   the ordering: the cap came first, the standard was a post-hoc check, and the strongest child in the
>   band does lose sums 11–14.
>
> ## ② BIGGER OR SMALLER — comparison ([BigOrSmall.tsx](src/features/chapters/story/BigOrSmall.tsx))
> Two bunches wait; the one you tap really walks off with Milo and the other stays behind. Replaces
> Milo's Kitchen (bowls and jars — dead props, CSS-gradient bowl beside painted art).
> **The area shortcut is deliberately NOT defeated at the lower tiers.** Rigging the spacing so only
> counting wins is the Piagetian conservation task, it belongs a year or two later, and K.CC.C.6
> explicitly allows matching/perceptual strategies — comparing by eye IS the expected entry strategy at
> Pre-K/K. The honest progression to *"you cannot just look"* is the **tier-3 NUMERAL round**: two
> creatures each wearing a painted number, nothing to count, un-shortcuttable by construction rather
> than by trickery (K.CC.C.7). *(This reverses the adversarial-spacing plan floated earlier in the session.)*
>
> ## ③ THE MOTION FIX — THE CLAMP WAS BREAKING THE GAIT, BAND-WIDE
> Founder: *the animations move too fast.* Measuring first found something much bigger than cadence.
> **A journey across 60% of the screen wants FIVE TO TEN SECONDS at a walking pace, and `travelMs`
> clamped every duration to 2400ms.** So every long journey in the band had the body covering ground
> **2–4× faster than its legs were running** — the engine's cardinal rule thrown away by a `Math.min`,
> with nothing telling the sprite. Each chapter computed a `cycleScale` for the showy march and passed
> a bare `1` for ordinary journeys, **so the ORDINARY journeys were the ones that skated.** That
> mismatch, not raw speed, is what reads as unnatural.
> • `journeyOf` now returns **`{ms, cycleScale}` together** so a clamp reports its own correction;
>   wired through chapters 2, 4, 9, 10. **`travelMs` was DELETED, not documented** — a duration without
>   its correction *is* the bug, so the ability to ask for one is gone.
> • Cadence calmed **~28%** across the cast, finishing the job flagged on the eagle and ladybug back in
>   chapter 1 (ant 0.46→0.63s, butterfly/firefly 0.50→0.71s, bunny 0.55→0.75s).
> • Ceiling 2400→**3600ms**, sprite cap 140→**230px**. **The cap is a PACING number:** on a clamped
>   journey the leg cycle is `ms·STRIDE·h/dist` — the cadence CANCELS OUT — so sprite height is the only
>   lever that reaches it. A creature pinned small on a wide screen must cover more of its own
>   body-lengths to cross it.
> • **Chapter 1's parade is untouched** — it keeps its own `STRIDE` in `ParadeStage.ts` and travels at a
>   constant derived speed with no clamp, so it never skated. It does inherit the calmer cadence.
>
> ## ④ THREE NEW GATES, AND WHAT THEY CAUGHT THAT NO EYE DID
> [playTimeGeometry](src/__tests__/playTimeGeometry.test.ts) · [bigOrSmallGeometry](src/__tests__/bigOrSmallGeometry.test.ts) · [critterJourney](src/__tests__/critterJourney.test.ts).
> They import the **same `playLayout`/`compareLayout` the scenes render from** — chapter 4's sweep
> re-implements its chain, which lets a check agree with itself while the screen falls apart.
> Caught, none of it visible by eye: Milo overlapping the set on the three widest reef creatures · a
> tie where **`[2,1,1]` asked for the fewest had TWO right answers** (breaking a tie with `max(1,best−1)`
> is a no-op at 1 — a child marked wrong for being right) · a tie-fixer that breached the on-screen cap ·
> a between-bunch gap defined against the raw step when same-row neighbours already sit `2×step` apart,
> so the bunches merged into one line.
> **Mutation-tested throughout** — every planted regression trips a gate; the survivors were verified
> INERT (a shadowed constant, a cap covered by a second mechanism), which is the distinction that matters.
>
> ## ⑤ THE ONE THE SCREEN CAUGHT AND THE SWEEP DID NOT
> `huddleRows` chose **THREE rows inside a band ~58px tall**, so rows sat 29px apart against an 83px
> sprite and the fish **buried each other** — fatal in a counting chapter. The sweep missed it because
> it only checked SAME-ROW pairs, treating cross-row overlap as the intended huddle. **Rows are only
> room if the rows are visually SEPARATE.** Fixed shared: `maxSizeForRows` + `spreadBand` in
> `critters.tsx` (`fitBands` proves heads clear the prompt and feet clear the strip and is perfectly
> happy to return a 6%-tall band with both rows on one line), plus `BAND_JITTER` — `spreadBand` raised
> the far row to exactly the head-clearance limit and the jitter then lifted it 2% further, behind the
> prompt. **A clamp must budget for anything applied after it.**
>
> ## ⑥ MEASUREMENT TRAPS THAT COST REAL TIME (all now in the craft doc)
> • **`requestAnimationFrame` is FROZEN while the preview is backgrounded**, so rAF-throttled hooks —
>   `useViewport` among them — never see a resize. Resizing the pane and re-measuring reports a layout
>   computed for the OLD size and looks exactly like a responsive bug. **Reload at the target size.**
> • **A sweep must be derived from the chapter's own generator.** Twice I hand-wrote a grid and it
>   failed on screens no child can reach (three bunches of one; a 45px sprite crossing a 1920px display
>   — height and width are CORRELATED). Both times the test was wrong and the code was fine.
> • The preview screenshot lags the DOM by up to a whole phase, and can paint CSS elements while
>   omitting images. Three separate alarms this session were the instrument, not the app.
>
> ## ▶ OPEN — pick up here
> 1. **WATCH A CHILD PLAY.** Three chapters are live and unvalidated. The burial in ⑤ was invisible to
>    every passing check and only showed up when I actually looked at the screen.
> 2. **Group B is the remaining work: shapes · colors · patterns** — augmentations, not rebuilds (keep
>    the exact SVG/hex core, add a travelling creature + the arc their names already promise). Then
>    **measurement**, the least certain.
> 3. **Counts came down and it is worth confirming:** two bunches hold nine, three hold five, addition
>    tops out at ten. All measured (at 640×320 a shark needs 70px of slot and six leave 69.6px), and the
>    gate was kept strict rather than given a 1px tolerance — the craft doc records a real 1px bug.
> 4. Chapter 3 (Nest Tree) still has **no cumulative arc**, and chapters 2/3/4 still have no gates of
>    their own beyond chapter 4's.
> 5. **Still the headline, still unchanged: ~zero real users. Watch one real child play; start the
>    attorney conversation.**
>
> _(the ✏️ block below is the previous session — the 12–14 scratch pad.)_

> ✏️ **2026-07-24 — THE 12–14 PRACTICE LOOP NOW HAS SCRATCH PAPER. SHIPPED TO PROD. `main`@`68a4aeb`, prod serving sw v58, post-deploy smoke green + driven live on prod.**
>
> **The ask (founder):** *"the kids use touch screen ipads and laptop so we need to add a scribble
> pad so kids can solve the practice questions in age group 12-14."* Fair and overdue — these
> chapters ask a child to work out `−1 − 4` or a Pythagorean leg **in their head**, because the only
> writing surface on screen was the answer itself.
>
> **Deploy:** branch `feat/teen-scribble-pad` → `main` (fast-forward) → pushed → prod serving **v58**.
> Gates: `tsc` · **66/66 vitest** · `next build`. Smoke: `/` `/menu` `/diagnostic` `/api/health`
> `/teen-preview?c=integers` `/story?ch=home` all **200**. Then DROVE PROD: opened the pad in Bank
> Account's guided round, stamped a shape (3634 ink px), stamped a second (7275), **Undo returned to
> exactly 3634 and Clear to exactly 0**, freehand still drew over a stamped shape, backing store
> 1088×408 on a 544×204 pad (dpr-correct), board + all four answer tiles clear of the drawer.
> 0 console errors.
>
> ## ① What it is — [ScribblePad.tsx](src/features/chapters/teen/games/parts/ScribblePad.tsx) (new, ~260 lines) + 3 lines of [GameShell.tsx](src/features/chapters/teen/games/parts/GameShell.tsx)
> A "✏️ Scratch pad" button in the guided and scored rounds opens squared paper along the bottom:
> **Write · Erase · ◇ Shape… · Undo · Clear · Close**. Pointer events throughout, so finger, Apple
> Pencil and mouse all work, and `touch-action: none` stops an iPad scrolling the page instead of
> drawing. Marks are kept as POINTS, not pixels — so undo, and the resize/rotate redraw, are free.
> A new question is a clean sheet (`resetKey` = the question index).
>
> ## ② The two decisions that matter, and the measurements behind them
> • **It is NOT modal.** No backdrop, nothing disabled behind it — the child scribbles and then taps
>   the answer without closing anything. Verified: answering with the pad open advances the round.
> • **It is NOT a floating panel — it is IN FLOW, the last child of the shell's flex column**, so
>   opening it SHRINKS the play area. Two earlier versions were measured and thrown away:
>   a bottom-right floating panel sat on the question board and **two of the four answer tiles**;
>   the fix after that (fixed panel + a matching height reserved in `main`) kept **two `vh` values in
>   sync by hand, and they disagreed** — tiles still covered. In flow, the geometry cannot drift.
>   **Generalise: when two elements must not overlap, make one take the other's space in layout —
>   do not compute a matching reserve.** Same family as the shadow-outran-the-feet fix in chapter 2.
> • `main` also gains `overflowY:auto` while the drawer is open, because at **740×360** the board and
>   answers genuinely do not fit what is left. Content scrolls rather than hiding under the paper.
>
> ## ③ Shapes — a native `<select>`, because the platform already has this control
> Founder follow-ups: *"add shapes options so that kids can click on a shape and that shape will
> automatically get drawn"* → then *"put the shapes in dropdown"* → then *"in dropdown show the shape
> also with the names."* Five stamps — **Rectangle · Circle · Triangle · Right triangle · Axes** —
> chosen for what this band is actually asked (area/perimeter, circles, Pythagoras, plotting), all of
> them slow and wobbly to draw freehand. A native `<select>` gives a touch device a proper picker and
> a laptop a keyboard-navigable menu with **no outside-click, focus-trap or portal code to get wrong**;
> bound to `''` so the same shape can be picked twice in a row.
> • Shapes **TILE** left-to-right and wrap down a row. A small cascade offset was tried first and five
>   shapes piled into one unreadable knot; the tile size is 0.15 of the pad width so one of each fits
>   a row (0.18 fitted only four and the fifth wrapped back onto the first).
> • A stamp is a NORMAL mark — Undo, Clear, Erase and the resize redraw all treat it like a stroke.
> • **A glyph preview sits beside each name, and one of them was invisible.** `┼` (U+253C) for axes
>   measured at *exactly* the missing-glyph width, i.e. it was rendering as tofu. Swapped to plain
>   ASCII `+`; the other four were confirmed present the same way (each is narrower than the tofu box).
>   **Reusable trick: to test whether a font has a glyph, compare its rendered width to U+10FFFD.**
>
> ## ④ Two lessons about MEASURING that cost real time this session
> • **A canvas snapshot taken before the first sized redraw is worthless.** Undo/Clear call `redraw`,
>   which re-sets `canvas.width/height` — so a baseline captured at the default 300×150 was compared
>   against a 1088×408 buffer and reported nonsense (an "undo" that *added* 35k pixels). Both on dev
>   AND again on prod. **Clear once to settle the size, THEN take the baseline.**
> • **The preview pane's JS context intermittently reports `innerWidth/innerHeight` as 0**, which
>   makes every `vw`/`vh` read and some `getBoundingClientRect` calls lie. Trust the screenshot, and
>   re-measure before believing an alarming number. (This is also how the first bug got in: a bare
>   `min(94vw, 620px)` collapsed to 0 → a 0-wide canvas keeps its default backing store → strokes land
>   nowhere near the pen. **Every width in this shell is `clamp(px, vw, px)` for exactly that reason.**)
> • Stale-console warning applies as usual: HMR left `redrawRef`/`SCRIBBLE_H`/`ShapeIcon` errors in the
>   buffer from intermediate edits, all long since deleted. A fresh tab showed **zero**.
>
> ## ⑤ Scope note — 15–16 GETS THE PAD TOO
> `GameShell` is shared by both teen bands, and `BAND` is hardcoded `'12-14'` inside it, so there is
> no in-shell way to tell them apart. The pad is therefore live on all **24** teen chapters. Left on
> deliberately — algebra needs paper as much as ratios do — but it is scope beyond what was asked, so
> say if it should be gated (cheapest gate: a `scribble?: boolean` on `GameConfig`).
>
> ## ▶ OPEN — pick up here
> 1. **NOBODY HAS WRITTEN ON IT WITH A REAL FINGER OR PENCIL.** Every check above was synthetic
>    `PointerEvent`s in a desktop browser. Palm rejection, Pencil pressure, and whether a 204px-tall
>    strip is enough paper for a 13-year-old's working are all unknown. **Try it on the actual iPad.**
> 2. **No test covers it.** The pad has no unit test and no E2E — the 66 vitest specs are untouched by
>    it. If it regresses, nothing catches it. The invariant worth gating is the one that already broke
>    twice: *the drawer never overlaps the question board or an answer tile.*
> 3. Deliberately skipped, add when asked: saving work across questions, colours, pinch-zoom,
>    dragging/resizing a stamped shape.
> 4. Everything in the 🏡 block below is unchanged and still open — above all **watch a child play**.
>
> _(the 🏡 block below is the previous session — chapter 4.)_

> 🏡 **2026-07-24 — CHAPTER 4 (MATCHING QUANTITIES) REBUILT AS "HOME TIME" AND SHIPPED TO PROD, TOGETHER WITH THE SHARED CREATURE ENGINE EXTRACTED OUT OF CHAPTER 2. `main`@`c129e5c`, prod serving sw v57, post-deploy smoke green.**
>
> **Deploy:** branch `feat/story-chapter-4-home-time` → `main` (fast-forward) → pushed → Vercel READY.
> Gates before push: `tsc` · **66/66 vitest** · `next build`. Post-deploy smoke on
> `milo-story-mode.vercel.app`: `/` `/menu` `/diagnostic` `/api/health` `/story?ch=home`
> `/story?ch=grocery` `/story?ch=order` `/story?ch=nest` all **200**; Milo's walk sheet + underwater
> pose, the creature sheets and all three habitats' backdrops all **200**; prod `sw.js` serving **v57**.
> Then DROVE PROD, not just status codes: chapter 4 intro → demo → guided with five tappable fish,
> two taps 300ms apart both registering, the Ready button **byte-identical at 0 sent and at the exact
> target**, commit → march (cycles running, out of frame) → round 1; and chapter 2's three in-order
> taps 300ms apart all registering. 0 console errors.
>
> **⚠️ Still true after shipping: nobody has watched a child play this.** Every fault below was caught
> by a measurement or a screenshot — and four of them ONLY by looking, one of those by the founder.
>
> ## What was wrong with Little Grocery, and why polish could not fix it
> Chapter 4 was the last 3–5 chapter still built the old way, and it broke most of the craft rules at
> once: fruit sat as **dead props on a wooden shelf**, a tap made one vanish and `gr_pop` into a
> **CSS-gradient paper bag**, and the customer was an **emoji** (🐰🐻🐱🐺) bobbing in a painted scene.
> Nothing was alive before a tap, no tap caused a journey, and there was no rotate gate. Same class of
> fault as the rejected stepping stones and the code-drawn nest bowl — **a numbered/countable PROP
> cannot blend and cannot be alive**, so the fix is creatures, not better props.
>
> ## ① HOME TIME — what it is
> Milo asks for **exactly N** on a painted marker above him. A huddle of little ones waits (breathing,
> the odd idle hop). **Tap one and it really walks to him**, its drawn cycle running the whole way,
> counting aloud as it goes. **Tap one that is already with him and it walks back** — the miscount
> repair is a journey too, facing the other way, not a "put one back" button. Tap **Ready** to commit.
> **There are ALWAYS spares left over** — nothing on screen tells the child when to stop, and deciding
> that is the entire skill. A shelf that empties at exactly the target does the stopping for you, which
> is what the old chapter did. Correct → Milo leads that group off and **the spares stay behind**,
> making the point one last time: only the number he asked for went.
> **Cost: 0 new art.** Chapter 1's eleven drawn cycles carry it, plus Milo's own walk sheet — the first
> chapter to use the cycle that was generated for him and kept.
> Difficulty grows the count AND the temptation: 1–3 with 2 spares → 3–6 → 6–7 with 3 spares.
>
> ## ② THE SHARED ENGINE IS NOW A MODULE — [critters.tsx](src/features/chapters/story/critters.tsx)
> Chapter 2's hardest-won code (the `Critter` component, `travelMs`/`groundSpeed`, the huddle
> invariants, `fitBands`, the cast and habitats) was module-private inside a 708-line file. Copying it
> into chapter 4 would have meant two divergent copies of the shadow-as-child fix, the longhand
> `animation` fix and the linear-easing fix. It is extracted verbatim; **FollowTheLeader went 708 → 464
> lines** importing it, behaviour unchanged. A fix now lands in every creature chapter at once.
>
> ## ③ FIVE REAL BUGS FOUND BY VERIFYING, NOT BY BUILDING — and three were only visible to the eye
> • **Milo stood in the treetops.** The sky habitat's bands sit at 40% because *butterflies fly*; a pony
>   dropped on that band hovered over the hedge at the frame edge — **exactly the "he read as clutter"
>   note that got Milo cut from chapter 2.** Fixed with chapter-4-specific `BANDS`: the leader gets its
>   own GROUND line per habitat. Chapter 2's HABITATS were deliberately left untouched (shipped, and
>   verified across 330 combinations — not worth perturbing for a new chapter's needs).
> • **He had his back to them.** They walk in from his left; he faced right. Now he faces the incoming
>   little ones and only turns to lead once everyone is gathered.
> • **The group gathered nowhere near him** — the cluster filled from a fixed left edge and grew toward
>   Milo, so the first two arrivals stood a quarter-screen from the character they had walked to. It
>   now anchors ON him and grows away.
> • **THE ONE THAT WOULD HAVE BROKEN THE CHAPTER: taps were gated on `useIsSpeaking()`.** Measured live
>   — `speechSynthesis.speaking` stays true **over 3.2 SECONDS** after a single spoken digit, and the
>   watchdog ceiling is 6s. In a chapter wanting up to seven taps a round that is half a minute of dead
>   screen, and it is the same complaint the founder already raised on chapter 2 (*"let them click the
>   next"*). The gate was never needed: `speak()` already cancels the utterance in flight, so fast taps
>   simply speak the newest count. Replaced with a 260ms double-tap lock.
>   **FIXED IN CHAPTER 2 TOO** (founder call, same session): `SPEAK_LOCK_MS` 600 → `TAP_LOCK_MS` 260 and
>   `speaking` dropped from the guard in [FollowTheLeader.tsx](src/features/chapters/story/FollowTheLeader.tsx).
>   Re-verified live there: three in-order taps 300ms apart ALL register (they used to be swallowed), a
>   wrong-order tap is still refused, and a triple-tap in one tick still counts exactly once — so the
>   ordering rule and the no-double-count rule both survive. A full round completes and marches. 0 console errors.
> • **THE READY BUTTON TURNED GREEN AT THE RIGHT COUNT — founder caught it.** It lit up the moment
>   `chosen === target`, and the number sign did the same. That quietly replaces the whole chapter with
>   a hot/cold game: tap, check the colour, tap, check — **a child can win it without counting once.**
>   Both are now identical at every count (verified byte-identical at 0, 1 and 2 sent, including at the
>   exact target); the sign turns green only as they SET OFF, confirming an answer already given. The
>   general rule is now in the craft doc, alongside the teen band's rejected live-tilt balance beam.
> • **Feet 1px behind the Ready button** at 640×320: the bottom reserve was 56px against a 57px button,
>   AND the huddle's organic jitter was ADDED to its band, pushing feet below the floor `fitBands` had
>   just proved. Jitter now nudges upward only (so `waitY1` is a true floor) and the reserve is 64px.
>
> ## ④ THE FOUNDER'S CATCH — THE GREEN "READY" BUTTON, AND WHY IT WOULD HAVE HOLLOWED THE CHAPTER OUT
> The commit button turned green the moment `chosen === target`, and the number sign above Milo did the
> same. Founder: *"don't do that ready button green automatically because by this the kid will wait to
> the button get green."* Exactly right, and the damage is total rather than cosmetic: **a child can
> win the whole chapter without counting once** — tap, glance at the colour, tap, glance. The one skill
> the chapter exists to teach is deciding when to stop, and a colour decides it for them.
> Both are now identical at every count (verified byte-identical at 0, 1 and 2 sent, INCLUDING at the
> exact target, on prod); the sign turns green only as they SET OFF, confirming an answer already
> given. The only cue left is the guided round's one-time nudge, on a round that is not scored.
> **The general rule is now in the craft doc**, next to the teen band's rejected live-tilt balance
> beam: *a verdict is not required for something to be hot/cold.* Any signal that the set is right
> BEFORE the child commits is the answer, handed over.
>
> ## ⑤ THE INVARIANT SWEEP, AND WHY ITS FIRST GREEN RUN WAS WORTHLESS
> [homeTimeGeometry.test.ts](src/__tests__/homeTimeGeometry.test.ts) sweeps **12 screen sizes × 8 pool
> sizes × all 10 creatures** and asserts travel runs left→right, nothing crosses an edge, same-row
> creatures never overlap, sprites/tap targets stay above their floors, and heads/feet clear the prompt
> and the button. **It passed on the first run, so I mutation-tested it — and 2 of 5 planted regressions
> walked straight through.** One was the test being correct; the other was real (it checked "head off
> the top of the SCREEN" instead of "head clears the PROMPT"). It also read the band instead of the real
> spots, which is precisely how the 1px button overlap survived a clean sweep. All 5 mutations now fail
> it. **A gate that has never been seen to fail is not evidence.**
>
> ## ⑥ Verified by measurement, not by "the screen moved"
> Travel is **constant 48px per 180ms, dead linear**, legs running end to end; the return journey runs
> 795→606 leftward with `scaleX(-1)`, so it faces the way it walks. Three clicks in one tick count as
> **one**; four taps 300ms apart all count. An early Ready is rejected and the round does not advance.
> On commit, Milo + the chosen ones leave the frame and the spares remain. Rotate gate shows in
> portrait and recovers cleanly (the early return sits below every hook). 0 console errors throughout.
>
> ## ▶ OPEN — pick up here
> 1. **WATCH A CHILD PLAY IT.** Chapter 4 is live and unvalidated. Four of this session's faults were
>    invisible to every script that passed — Milo in the treetops, his back turned, the group gathering
>    a quarter-screen from him, and the green button the founder caught. A three-year-old will find the
>    next one faster than any check.
> 2. **CHAPTER 2 IS ALSO CHANGED IN PRODUCTION** — its tap gate no longer waits on `useIsSpeaking()`.
>    Re-driven live before and after the deploy, but chapter 2 has **no invariant test of its own**, so
>    that evidence is a live drive rather than a gate. If anything reads wrong in Follow the Leader,
>    `c129e5c` is the first commit to look at.
> 3. **`?ch=grocery` now resolves to Home Time** and `Grocery.tsx` is deleted; `?ch=home` is the new key.
>    Left untracked on purpose: `scripts/.voice-*.json` (regenerable, from the older voice session).
> 4. Nest Tree's cumulative arc is still missing (see the 🦆 block). Home Time ships the pattern: the
>    strip lives OUTSIDE `SkillBeat`, driven by `onRound`.
> 5. The gathered butterflies land near the backdrop's tree on some sky scenes — not an overlap, but
>    worth an eye if it reads busy.
>
> _(the 🦆 block below is the previous session — chapter 2.)_

> 🦆 **2026-07-24 — CHAPTER 2 (NUMBER ORDER) REBUILT AS "FOLLOW THE LEADER" AND SHIPPED TO PROD, TOGETHER WITH THE PREVIOUSLY-UNCOMMITTED NEST TREE. `main`@`02f5437`, prod serving sw v56, post-deploy smoke green.**
>
> **Deploy:** merged `feat/story-chapter-2-follow-the-leader` → `main` (fast-forward) → pushed → Vercel `dpl_2bJB7ex…` READY and aliased to `milo-story-mode.vercel.app`. Gates before push: `tsc` · **64/64 vitest** · `next build`. Post-deploy smoke: `/` `/story?ch=order` `/story?ch=nest` `/menu` `/diagnostic` `/api/health` all **200**; the new assets (`milo_side`/`milo_walk`, `bird_walk`, `nest_walk`, `farm_barnyard`) all **200**; prod `sw.js` serving **v56**. Drove `/story?ch=order` on PROD through intro → demo → guided with `fish_walk.png` loading and three tappable fish — the chapter runs live.
> **Committed as ONE commit deliberately:** Nest Tree needed the same rotate gate and the same `animation` longhand fix, so splitting the two chapters would have left a broken intermediate commit. Left untracked on purpose: `scripts/.voice-*.json` (regenerable, from the older voice session). The `.gitignore` change WAS included — it ignores `.mcp.json`, which holds API keys.
>
> **⚠️ Still true after shipping: nobody has watched a child play this, and the founder has not seen the finished chapter end-to-end.** It is live, not validated.
>
> ## ① One direction was built and thrown away first — the rejection is the useful part
> **Stepping Stones (rejected).** Numbered stones laid across a still pond; Milo hops to the smallest, a real drawn journey, perspective depth, banks at each end. Mechanically it all worked (measured: 60→498→279→717→936px of genuine travel, shrinking 123→86px with distance). Founder: **"not satisfying — the background and object should blend with each other."** Correct, and the diagnosis is structural, not a shading problem:
> **A NUMBERED PROP CANNOT BLEND.** A stone is dead — it has no cycle, so the scene is frozen until you tap; it is drawn in the generic library style, so it sits ON a painted backdrop rather than in it; and it needs bespoke art PER SCENE to match (a stone painted for `pond.jpeg` is the wrong stone for `lake.jpeg`). I generated a painted stone to fix exactly this and it came back with a whole water disc baked in — unusable across three different ponds. That is the moment the approach was wrong, not the asset.
> **The fix is not better props, it is no props: make the numbered things CREATURES.** They are already painted in the app's style, they already have drawn cycles, and they are alive before anything is tapped. *(Related lesson banked while chasing the stones: an emoji dropped into a painted scene — my 🏕️ on the far bank — is the single most pasted-on thing you can put on screen. Emoji belong in the UI layer, never in the world.)*
>
> ## ② FOLLOW THE LEADER — what shipped into the working tree
> Mother is waiting to set off and her little ones are scattered. Tap the smallest → **that one really travels, walk cycle running the whole way, and falls in behind her**. Tap a bigger one → it just wriggles where it stands; it is not its turn. Last one in place → **the whole family marches off together**.
> **The finished line IS the answer.** Every other shape considered (a slide queue, a boat that fills up) *consumes* the answers as they are given. This one ends with 1·2·3·4·5 standing in a row — for a chapter whose whole skill is ORDER, that is the picture the child should be left looking at. The hold before they march was 320ms and is now **1200ms**, because marching straight off snatches the answer away before a 3-year-old can look at it.
> **Cost: ~0 new art.** Chapter 1's eleven drawn cycles carry it, and **a mother is just her own sprite drawn 1.25× bigger**.
>
> ### ONE chapter, not three worlds behind a picker (founder call)
> *"Put all three biomes in one biome so every question will be different."* Right, and it made the world-picker redundant — **`WorldSelect` is gone from this chapter and it opens straight on the intro.** There is now a flat **`CAST` of 10 creatures, each naming its `home` habitat**, and the round number picks the creature; the creature's habitat decides which backdrops are even eligible, because a fish cannot line up on a lawn. The cast is **interleaved meadow → reef → sky rather than grouped**, so consecutive questions change habitat as well as creature — 10 entries against 10 rounds means a full run never repeats one. Verified live: fish/`reef_sand` → butterfly/`town_park` → squirrel/`farm_barnyard`.
> | habitat | cast | band |
> |---|---|---|
> | 🌾 meadow (`farm_barnyard`·`garden`·`garden_meadow`) | rabbit · squirrel · ant | walks the ground |
> | 🐠 reef (`reef_open`·`reef_sand`·`reef_deep`) | fish · turtle · crab · shark | swims |
> | 🦋 sky (`garden_park`·`garden_fence`·`town_park`) | butterfly · ladybug · firefly | flies |
>
> ### THE SHADOW OUTRAN THE FEET — a bug I introduced and the fix that makes it impossible
> Founder: *"the shadow is moving faster than the object."* Mine: the contact shadow was a SIBLING of the creature carrying its own `transition`, so when the march stretched the creature's travel to 2800ms the shadow still ran at 950ms and slid out ahead. **Fix is structural, not a tuned number — the shadow is now a CHILD of the creature**, sharing its transform by construction, so there is only one thing moving and it cannot drift again. Verified: shadow centre offset 0px from its creature both at rest and mid-march, 0 stray fixed-position shadows left.
> **Generalise: two elements that must move as one should be one element.** Any time a shadow, a label or a highlight is positioned alongside its subject rather than inside it, it is one duration change away from desyncing.
>
> ### THE SLIDE — same root cause as the shadow, one layer down
> Founder: *"when we click the object, movement happens for a few seconds then it just slides without the movement."* Exactly right, and my fault again: stretching the march had me write `transition: left ${moving ? MARCH_MS : TRAVEL_MS}ms`. So a TAPPED creature was handed the 2800ms march duration while `travelling` still cleared after 950ms — the legs stopped on schedule and it kept sliding another 1.9s frozen.
> **Fix: `durMs` is now an explicit prop the caller states per phase (TRAVEL_MS to join the line, MARCH_MS to leave), never inferred from a flag.** Measured after: legs run 0–950ms while x travels 578→921 and both stop together; on the march all four run legs the whole 2800ms out to x 1463–1832 on a 1280px screen.
> **The pattern behind all three of these bugs is one thing: a walk cycle and the travel it belongs to must be given the SAME number.** Anything that lets them be set independently — a sibling element, a derived duration, a flag doing double duty — will drift, and it always reads as the character skating or moonwalking.
>
> ### TOO FAST TO SEE — and the fix is chapter 1's rule, which I should have applied from the start
> Founder: *"when I select the object it moves very fast to get in line, the animation is not visible."* The journey was a flat **950ms on an ease-out curve** — and ease-out is the worse half of that, because it puts most of the distance in the first third, so the creature shoots and settles. A drawn walk cycle you cannot see is a walk cycle you may as well not have generated.
> **Fix is the rule chapter 1 already wrote down: ONE CYCLE CARRIES ONE STRIDE.** Travel time is now derived, per journey, from the distance and the creature's own cadence — a sheet playing `fps/frames` cycles a second, each carrying `STRIDE`(0.67) body-heights, gives a real ground speed and the duration falls out of it (clamped 1100–2400ms). A creature crossing twice the distance now takes twice as long, which is what makes it read as walking rather than being placed. Easing is **`linear`**, because a walking creature travels at a constant speed.
> **The march gets the same treatment from the other end:** it must cover ~65% of the screen in one go, so instead of slowing it down, the leg cycle is **sped up by exactly the ratio of march speed to walking speed** (`cycleScale`) — again chapter 1's answer, and the only way the feet stay locked to the ground on the way out.
> Measured after: the fish travels a constant 26px per 200ms, dead linear, legs running end to end.
>
> ### "WHY IS THE FIRST QUESTION 7·8·9?" — not the resume-difficulty feature, a hole in my generator
> Founder asked whether the persistent chapter level was starting them at a high tier. **It was not, and it cannot:** resume-at-difficulty is wired into `GameShell` + `ShopRush` only (the TEEN bands); every 3–11 story chapter calls `useAdaptive(beat.skillId)` in [StoryWorld.tsx](src/features/chapters/story/StoryWorld.tsx):71 with no start tier, so a story chapter always opens at difficulty 1. *(Worth remembering next time a 3–5 chapter looks too hard on question 1 — the tier is not the suspect.)*
> The real cause: I made difficulty control only HOW MANY numbers there are, never how big. Tier 1 drew its consecutive run start from `rint(1, 8)`, so the gentlest tier could legitimately open on 7·8·9 — bigger, less familiar numbers than 1·2·3, for a three-year-old's first ever question in the chapter. **The ceiling is now part of the tier: tier 1 tops out at 5.** Verified over 4,000 draws per tier — tier 1 yields only 1·2·3 / 2·3·4 / 3·4·5 (3 items, always consecutive), tier 2 spans 1–10 at 4 items, tier 3 spans 1–10 at 5 mostly-scattered.
>
> ### THE CHILD SHOULD NOT HAVE TO WAIT FOR THE WALK — gate on the VOICE, not the journey
> Founder: *"once the kid clicks the first one, let them click the next — but pause for Milo to speak the number, we have to avoid overlapping voice."* The tap handler was blocking on `travelling !== null`, so slowing the walk down (previous fix) had quietly made the chapter feel *sluggish*: a child who had already spotted 2 was forced to watch 1 finish walking. **Several little ones now walk to the line at once; the only thing a tap waits for is Milo finishing the last number.** `travelling` became a `Record<value, ms>` map rather than one slot, and the line place is claimed from `joinedRef` (synchronous) — off the `joined` state, two quick taps would read the same stale length and both walk to the same spot. The march is counted on ARRIVAL, not on the tap, so it can never start over a still-walking straggler.
> Verified: taps 700ms apart put 1 → 2 → 3 creatures walking simultaneously; all three hammered inside 150ms and only **one** is accepted, so two numbers are never spoken over each other; line places stay distinct.
>
> ### "The ladybug feels like it is flying"
> It was in the `sky` habitat. **Chapter 1 files the ladybug under `CRAWLERS`, not fliers** — and its sprite is drawn walking on its legs, so hovering it in a sky band read as wrong immediately. Moved to `meadow`; the sky habitat is now butterfly + firefly, which actually fly. *Check a creature's locomotion in [world1.tsx](src/features/chapters/story/world1.tsx) `LOCO`/`CRAWLERS` before assigning it a band — the classification already exists and disagreeing with it is always visible.*
>
> ### THE HUDDLE PILED UP — the cost of the moonwalk fix, paid back
> Founder: *"the objects are clustered on the left, the kid will get confused which one to click for a number."* Fair, and it was the direct cost of forcing every journey to travel forwards: pushing all the waiting ones left of the line's leftmost place left them 13–41% of the width to share, and a ladybug sprite is **1.47× wider than it is tall** (turtle 1.53, shark 1.75), so sizing on HEIGHT alone drew them far wider than their slot and they buried each other's numbers.
> Three changes, and the constraint is now checked rather than hoped for:
> • **The line gives room back to the huddle** — `MOTHER_X` 90→94 and `LINE_GAP` 11→9. A tighter line is also truer; animals queueing nose-to-tail do overlap.
> • **`huddleGeom(n)`** states the extent in one place, and because neighbours alternate rows, two creatures in the SAME row are `2 × span` apart — that is the figure a sprite must fit inside.
> • **`useSizes` caps the sprite against that slot using its OWN `cellAspect`**, so a wide creature is drawn smaller rather than overlapping.
> Verified by arithmetic across 1024/1280/1512 × n=3,4,5: the huddle always ends clear of the last line place (forward travel preserved) AND the widest sprite always fits its row. Live at n=5: same-row neighbours have a 64px gap and all five numbers read; the remaining overlap is cross-row, which is the intended huddle.
> **⚠️ And a trap that caught me twice more here: the preview screenshot lags the DOM.** One frame showed ladybugs on a REEF backdrop with the creatures missing entirely — pure staleness; a DOM query at the same moment reported `garden_meadow` with all five sprites loaded at 197×134. **Trust `getBoundingClientRect`/`naturalWidth` over the screenshot, and re-shoot before believing anything alarming.**
>
> ### THE LEADER WAS CUT OFF — and chasing it found the real cause of the crowding
> Founder: *"the leader objects are getting cut from the front."* Mother is drawn **1.25×** and anchored on her CENTRE at a flat 94%, so a wide sprite (a ladybug at that scale is 246px) simply ran off the right edge. **`motherX()` now measures her half-width from the sprite's own aspect and pulls her back only as far as she needs** — every % she keeps is a % the huddle loses, so it is a measurement, not a margin.
> Writing a check for it caught two more of the same class:
> • the widest sprite (**shark, 1.75:1**) hung off the LEFT edge of the huddle at a flat 13% → the huddle's left edge is now derived the same way;
> • **and the actual reason the huddle crowded in the first place** — `slotPx = Math.max(span*2, 15)` had a floor on it, so sprites were sized for 15% of the width while being spaced by *less* than that. It guaranteed overlap exactly when the huddle was tightest. Floor removed; where that leaves a genuinely tight huddle (five sharks at 1024px), **`huddleRows()` adds a THIRD row** — since neighbours alternate rows, `rows × span` is the same-row spacing, so a row buys horizontal room without shrinking anyone.
> **Verified across 360 combinations** (4 widths × 3 heights × n=3,4,5 × all 10 creatures): 0 failures — mother's right edge never past 97%, no sprite past either screen edge, same-row gap never negative, smallest sprite still 60px, and the huddle always clear of the line so travel stays forwards. Live at 1280: mother 954→1242, nothing off-screen.
> **The lesson worth keeping: this chapter's layout is a set of INVARIANTS, not a set of nice numbers.** Every founder-visible fault here (moonwalk, pile-up, cut-off leader) was a hand-tuned constant that happened to hold at 1024×600 with three rabbits and broke on a wider sprite or a fifth creature. The four invariants — *huddle ends left of the line · nothing crosses a screen edge · same-row gap ≥ 0 · sprite ≥ 52px* — are now derived from the sprite's own aspect and checked by a script, which is the only reason the last pass came back clean.
>
> ### SHORT LANDSCAPE + PORTRAIT — checked at last, and it found four real bugs
> **Portrait is now a rotate gate, not a layout.** Founder: *"we already put the sideways guide, so we only have to check small landscape — and if this age group doesn't have the sideways instruction, put it."* Only chapter 1 had one; it was never carried to the chapters written after it. Extracted to **[RotateGate.tsx](src/features/chapters/story/RotateGate.tsx)** (same wording and look as chapter 1) and wired into **Follow the Leader AND Nest Tree**. The width test matters as much as the orientation one — a tablet in portrait is 768–1024 wide and has room, so it is not sent away.
> **⚠️ The gate crashed the chapter on the first try, and the reason is worth carrying:** I put `if (needsRotate) return …` above a `useMemo`, so turning the phone CHANGED THE HOOK COUNT and React tore the chapter into the error boundary. An early return must sit below every hook. (Nest Tree's was audited and is safe.)
> **Short landscape then needed the bands to be FITTED, not nudged.** 95 of 180 combos failed: the reef (line at 46%) and sky (40%) bands are tuned for a tall screen, and at 640×320 the prompt alone owns the top 29% of the height, so heads sat behind it. The old flat `short` nudge moved things UP — the right direction for the one low habitat and the wrong one for both high ones. **`fitBands()` now states the constraint instead**: feet low enough that the head clears the prompt, high enough that they clear the journey strip, line always behind the huddle. On a roomy screen the habitat's own numbers are used untouched, so the art direction survives where there is room for it.
> Two constants in that were guessed and both were wrong — **measured live and corrected: the prompt block is 106px, not 94; the journey strip owns 56px, not 34** (the lowest creature's feet were landing 15px inside it at 1024×400).
> **Also fixed, found by the dev overlay while measuring:** the sheet `<img>` set the `animation` SHORTHAND next to `animationPlayState`, which React warns about because rewriting the shorthand can reset the play state — and it is rewritten on every march when `cycleScale` changes. Now longhand (`animationName`/`Duration`/`TimingFunction`/`IterationCount`). **Nest Tree had the identical pattern and is fixed too.**
> **Verified: 330 geometry combos (11 sizes × n=3,4,5 × all 10 creatures) → 0 failures**, worst case sprite 40px / tag 24px / tap target 46px. Driven live at **640×320, 812×375, 1024×400, 740×360** — nothing off-screen, no head under the prompt, no feet in the strip — plus portrait 390×844 showing the gate and rotating BACK to landscape recovering cleanly.
>
> ### Draw order has to be stated, not derived
> With the huddle two rows deep, a front creature was burying the NUMBER of the one behind it — and the number is the whole question. My first fix derived z-index from `at.top % 10`, which quietly collapsed both rows to the same value. Replaced with an explicit `z` prop: line 24, mother 26, waiting back row 30, waiting front row 32. *Also worth knowing: `elementFromPoint` cannot verify any of this, because the creatures are `pointerEvents:none` — it looks straight through them. That check has to be visual.*
>
> ### THE MOONWALK — the correction most worth carrying to every future chapter
> Founder, from a screenshot: *"the object is on the right when it gets selected, it goes backward but the foot is working forward, so it is not looking good."* Exactly right. The waiting little ones were spread across the WHOLE width, so any one standing to the right of its place in the line travelled **backwards** into it while its legs ran **forwards**. Moonwalking — and it reads as wrong long before you can name it.
> **The fix is layout, not animation: the waiting huddle now sits entirely on the LEFT and the line forms to the RIGHT of it, so every journey is left→right — the way they face, the way their feet go.** The huddle's right edge is computed from how long the line will be (`min(52, MOTHER_X − LINE_GAP·n − 5)`), so it can never overlap the line's leftmost place at any n; a fixed width piled three creatures on top of each other whenever n was small. **Generalise: whenever a travelling sprite has a walk cycle, the layout must guarantee its travel direction, or the cycle will contradict it.**
>
> ### Three more founder corrections from the same screenshot
> • **"Let them pass by fully."** The march used a fixed +34% offset, which walked MOTHER off screen while the last two were still standing in frame, so the round ended with half the family stranded mid-exit. Distance is now measured from the TAIL of the line (`marchDistance`), and `MARCH_MS` 2100→2800 so it plays as a walk rather than a lurch. Verified: on a 1024px screen everyone finishes at x 1118–1496, fully out of frame.
> • **"Remove Milo."** Gone from this chapter. He had no job here — the mother is the leader — and standing in a flowerpot at the edge he read as clutter. (His walk sheet is still worth keeping for later chapters.)
> • **"Use the water objects also."** The reef habitat now casts fish · turtle · crab · **shark**.
>
> ### Two founder corrections after the first build — both worth generalising
> **① "The object should change in every question."** It was one species for all ten rounds, which made the chapter feel like one long question. Cast now rotates per round, on a DIFFERENT cycle length from the scene rotation so the pairing keeps changing instead of repeating every third question. *(Chapter 1 already had this rule — "items shuffle per round" — it just hadn't been carried over.)*
> **② "The rabbits look like they are flying in the sky."** Dead right, and it is the same rule this repo already wrote down in 2026-06-30: **a grounded scene needs a background whose painted ground is most of the frame.** The forest backdrops (`forest_1/2/4`) paint ground only in the bottom ~25% — everything above ~76% is canopy — so a line drawn at 62% put rabbits in the treetops. Two fixes: the band is now tuned to where each backdrop's ground ACTUALLY starts, and the forest scenes were swapped for **`farm_barnyard.png` (open grass from 52%) + `garden.png` (55%) + `garden_meadow.png`**. *Rule of thumb for the next chapter: check the horizon line before choosing a backdrop for anything that stands on the ground — and note that fliers are exempt, which is why the butterfly world can sit high and still look right.*
>
> **Verified by measurement, not by "the screen moved":** each tap moves one creature 200–450px into the line AND shrinks it 126→98px (it is further away now); the finished line sits in true ascending order behind mother; the march translates all four together (+342px) keeping their spacing. A wrong tap leaves the waiting set unchanged. Demo → guided → practice all run; map strip advances per round.
>
> ## ③ MILO NOW HAS A DRAWN WALK CYCLE — `milo_side.png` + `milo_walk.png` (12 cells, 14fps)
> Generated for the rejected stepping-stones build and **kept, because it is the first drawn cycle for the CHARACTER rather than a creature** — any later chapter where Milo has to actually go somewhere can key off it. Registered in [sheets.ts](src/features/chapters/story/canvas/sheets.ts). ~10 credits (**621 left**).
> **Two gotchas worth keeping:** (a) **key him on MAGENTA, never green** — his backpack is green and a green key eats it; (b) the safety filter **false-positived** on the first prompt (returned `status: "nsfw"`) — rephrasing in the same register as the working bird/nest prompts cleared it. In Follow the Leader he stands at the head of the path with his cycle PAUSED (a cycle looping on a stationary character is skating on the spot), and swaps to `milo_underwater.png` in the reef world, because a walking pony on a seabed is the same "doesn't belong" fault as the emoji.
>
> ## ▶ OPEN — pick up here
> 1. **WATCH A CHILD PLAY IT.** The chapter is live and unvalidated. Every fault this session was caught by the founder's eye on a screenshot, not by a check — the moonwalk, the pile-up, the cut-off leader, the frozen slide. A three-year-old will find the next one faster than any script.
> 2. **NEST TREE'S CUMULATIVE ARC IS STILL MISSING** and it is now shipped without it: a fed chick stops chirping within its round, but `SkillBeat` regenerates the nests each round, so the tree never visibly fills. Follow the Leader ships the pattern to copy — the journey strip lives OUTSIDE `SkillBeat`, driven by `onRound`, because anything drawn inside a round resets every round.
> 3. **The "question N of 10" counter is now just "N" in the SHARED `SkillBeat`** — that lands on every 3–5 and 6–8 story chapter, not only this one. The progress bar above it still shows how far along they are. Worth an eye on one 6–8 chapter to confirm it reads right there too.
> 4. **The reef habitat is the weakest of the three** — fish "lining up behind mother" is less physically motivated than bunnies heading home.
> 5. **Renames:** `RiverCrossing.tsx` → `FollowTheLeader.tsx` and `NumberDoors.tsx` → `NestTree.tsx`. `?ch=order` and `?ch=nest` unchanged; `?world=` is now ignored by chapter 2 (it is one world). ⚠️ After a rename the console shows a wall of `Module not found` from the **STALE buffer** — gone in a fresh tab. This repo has burned three sessions on that; always re-check in a new tab before believing an alarming console.
>
> _(the 🐣 block below is the earlier same-day session — the Nest Tree rebuild.)_

> 🐣 **2026-07-24 — 4 FIXES SHIPPED TO PROD (sw v51→v55) + THE 3–5 NUMBER-RECOGNITION CHAPTER REBUILT AS "NEST TREE" WITH 2 BESPOKE ANIMATED CHARACTERS. The 4 prod fixes are on `main`; THE NEST TREE CHAPTER IS UNCOMMITTED. `tsc` + `next build` green throughout.**
>
> ## ① The four shipped commits (all on `main`, all live, each verified on prod)
> | commit | sw | what |
> |---|---|---|
> | `779f6e0` | v52 | **fix(voice): the recorded clips never played on MOBILE.** |
> | `ea404ea` | v53 | THE PLAN collapses to a dropdown on the mobile walkthrough |
> | `8fb1ff2` | v54 | that dropdown's arrow flips to reflect open/closed |
> | `beca1fa` | v55 | **fix(15–16): Factoring L1 could draw a SQUARE while saying "rectangular plot"** |
>
> ### The mobile-voice bug — worth remembering, it was invisible on desktop
> Founder: *"in 12–14 the 'solving step by step' chalkboard plays the normal voice on mobile Chrome + Safari, but the generated voice on Mac Safari."* The clips existed and the keys hit (verified: 4 walkthrough `say` lines all HIT the 433-key manifest). **Root cause: `speakLine` did `new Audio(url).play()` and the teen walkthrough AUTO-STARTS — no user gesture in the call stack — so mobile autoplay policy rejected it and it fell through to browser TTS. `unlockSpeech()` only ever unlocked `speechSynthesis`, never the clip `<audio>`.** Desktop Safari has a laxer policy, which is exactly why it looked fine there.
> **Fix:** iOS grants autoplay to *the specific element played inside a gesture*, so a fresh `Audio()` created later is never unlocked. All clip playback now routes through **ONE reused module-level `<audio>`**, unlocked with a silent 0-sample WAV inside the intro tap — folded into `unlockSpeech()` so every existing caller covers both channels for free. Files: [voiceClipPlayer.ts](src/infra/voiceClipPlayer.ts), [useMiloSpeaker.ts](src/infra/useMiloSpeaker.ts).
> **⚠️ Generalise this:** any future pre-rendered audio (the 3–11 bands, see the open list) inherits the fix automatically, but *any new `new Audio()` anywhere* will reintroduce it.
>
> ### The rectangle/square bug — and the audit that found it
> Founder: *"some questions say rectangle but the illustration is a square."* Reported as 12–14; it is **15–16**. Audited BuildSite (the only 12–14 geometry chapter) exhaustively and it is CLEAN — the "rectangle" wording (roof/triangle) always uses unequal sides, and its scored questions are **pad-only with no illustration at all**, so the wording can never sit beside a shape there. The real culprit was **BuildPlot (Factoring, 15–16)**, whose L1 picked both plot sides as independent `rint(1,5)` → ~20% equal → `(x+3)(x+3)` drew a literal square under "rectangular plot" framing (and quietly gave away that both factors match). Sides are now forced distinct. *Lesson: the band the founder names is a hint, not a fact — verify which chapter actually renders a shape next to the wording.*
>
> ## ② NEST TREE — the 3–5 number-recognition chapter, rebuilt (UNCOMMITTED)
> Founder asked for Chapter-1-quality animation here. **Two directions were built and rejected before the third landed — the rejections are the useful part:**
> 1. **Number Race (rejected).** Racers with numbered bibs. Verdict: *"not looking a wholesome animation, they don't actually move, art/scene quality too flat."* They cycled their legs **in place** — stickers with a looping animation.
> 2. **Race with real travel (rejected mid-build).** I reached for a scrolling/parallax background; founder stopped it with **the rule that now governs this chapter: "the background should be stable and objects can move."**
> 3. **Feeding Time at the Nest Tree (accepted).** Numbered nests on a branch in a *motionless* scene. Milo names a number → tap that nest → **the mother bird really flies across the still scene to it**, feeds the chick, flies home. Measured mid-flight: 210px of genuine travel. The tap *causes a journey*, and the journey is the reward.
>
> **The design principle that came out of it:** *don't animate the thing the child has to read.* Moving the answer objects makes them harder to read AND leaves the scene unchanged. Keep the answers still and legible; give one character all the movement.
>
> **2 bespoke characters generated (15 credits — 634 left), both via the existing pipeline** (`generate_image` on flat green → `kling3_0_turbo` → [creature-frames.py](scripts/creature-frames.py) → strip), both registered in [sheets.ts](src/features/chapters/story/canvas/sheets.ts):
> | asset | cells | fps | notes |
> |---|---|---|---|
> | `bird_walk.png` | 12 | 14 | mother's flap; berry held in beak throughout. 14fps = songbird; the eagle's 9 read as gliding |
> | `nest_walk.png` | **22** | 16 | chick chirping in a painted twig nest. **PING-PONGED** — a beak opening/shutting oscillates with no clean cycle, so forward-then-back loops seamlessly by construction |
>
> **The nest went through two rounds itself:** first pass drew it as a CSS gradient bowl, and founder was right that it looked like exactly what it was next to painted art — *and it is the object the child looks at and taps, so it should be the most alive thing on screen, not the least.* Now it is generated art with a real chirp cycle; a FED chick simply **pauses** its cycle (stops chirping), which keeps the painted art instead of swapping in a shape.
> Also fixed while verifying: nest bowls were brown-on-brown against the branch and vanished (now pale straw), and the numerals hung *below* the branch reading as signs belonging to nothing (now sit **on** the nest front, so number and nest are one object).
>
> **Files:** `NumberDoors.tsx` → **`NestTree.tsx`** (git-tracked rename; registry + `/story` route + `chapters.ts` metadata all repointed — the chapter is now **🐣 Nest Tree**, `?ch=nest`, 3 worlds Forest/Meadow/Evening). New assets: `bird_{side,walk}.png`, `nest_{side,walk}.png`.
>
> ## ▶ OPEN — pick up here
> 1. **NEST TREE IS NOT FINISHED, AND NOT COMMITTED.** The **cumulative arc is missing**: a fed chick stops chirping *within* its round, but `SkillBeat` regenerates the nests each round, so the tree never visibly fills with fed chicks. That was one of the three stated requirements (*the scene should change as the child plays*) and it is the piece that stops the chapter feeling static across 10 questions. Needs a persistent tally rendered OUTSIDE the round (mirror the counting chapter's `CollectTray`).
> 2. **Then commit + bump sw v55→v56.** Working tree also carries the pre-existing untracked `.gitignore` / `scripts/.voice-*.json` from the older voice session — NOT mine, leave them out.
> 3. **Next chapter, recommended: #2 Number Order (`RiverCrossing`).** Not because it is next in the list, but because of the child's PATH: chapters 1 (Counting parade) and 3 (Nest Tree) now both have real drawn animation and Number Order sits directly between them, so the one flat chapter is exactly where the drop is most visible. It is already a *journey* (Milo crossing a river / train yard / sky), so a **Milo walk cycle** would do most of the work — and that asset then serves several later chapters.
> 4. **Do NOT animate Shape House (#6) the same way** — its shapes are exact SVG on purpose (a triangle must be a real triangle). That one wants animated *scenery*, not animated shapes.
> 5. **3–11 bands still have NO voice clips** — they remain on browser TTS, which Chrome often does not provide. Nest Tree is the sharpest case in the app: its target is spoken and *never written*, so on a silent device the question is literally unanswerable. The mobile-unlock fix above means clips would now work on phones if rendered. ElevenLabs quota resets **2026-07-27**.
>
> _(the ✍️ block below is the earlier same-day session — question wording + the no-sense audit.)_

> ✍️ **2026-07-24 — QUESTION WORDING MADE CRYSTAL-CLEAR / "EXPLAINING-TYPE" ACROSS 12–14 + DIAGNOSTIC, THEN A FULL NO-SENSE AUDIT OF EVERY BAND. ALL SHIPPED. prod serving sw v51, `main`@`fb7b5fe`. `tsc` · 64/64 vitest throughout.**
>
> ## What the founder wanted, in order (each shipped before the next)
> 1. **Questions a low-IQ kid can follow** — plain wording, name the numbers, and *tell the child to look at the illustration when there is one* (their words). Then: **"more explaining type — every question should have sense"** (explain the idea in the question, but see #3).
> 2. **Roll it to all 12 of the 12–14 chapters and the diagnostic.**
> 3. **Then the correction that shaped everything after:** *"we should NOT give hint/explanation in the diagnostic — but questions should have sense."* → **A diagnostic is a TEST: make the wording clear/unambiguous, but never teach the method (that contaminates the measurement). A chapter is a LESSON: explaining is the point.** This split is now the rule.
> 4. **"How many Climb?"** (a real screenshot) → questions must **name their subject**; a label must fit the sentence. → led to a **full no-sense audit of every chapter**.
>
> ## The commits (all on `main`, all live)
> | commit | sw | what |
> |---|---|---|
> | `217d80a` | v44 | **fix**: the 3–5 counting intro could HANG. The `say` beat advanced only via `speakSeq().onDone`; walk beats have a hard timer, say beats didn't — so with no voice + a wedged voice-clip fetch the intro froze on slide 1 (the founder's screenshot). Added a one-shot hard cap ([ForestWalk.tsx](src/features/chapters/story/ForestWalk.tsx):217). |
> | `86f796f`·`5203ebd` | v45·v46 | Bank Account (integers) as the **sample**: crystal-clear → then "explaining-type" (each Q teaches the idea in plain words, never the answer). |
> | `03361ec` | v47 | **The other 11 of the 12–14 chapters** — one focused agent per file (copy-only), verified. |
> | `40fe258` | v48 | **Diagnostic**: clear prompts (`Solve:`→`What is x?`, bare seq→`…what comes next?`, `= ? cm`→`is how many cm?`) + "look at the chart/line/…" ONLY where a picture exists. **Bundled the founder's in-progress picture WIP** — a `DiagVisual` type + `visual:` fields + [features/diagnostic/DiagVisual.tsx](src/features/diagnostic/DiagVisual.tsx) renderer wired into the checkup + recheck pages — now verified end-to-end. |
> | `1df3c56` | v49 | **DataDeck** "How many Climb?" fixed: labels were verbs/colours/days; now every dataset is a real subject ("Pets at the shelter") with countable-noun bars, drawn as the chart title. |
> | `2759985` | v50 | **The full no-sense audit** (7 read-only agents, ~70 files) + all 12 fixes — table below. |
> | `fb7b5fe` | v51 | The 2 borderline items tightened (AngleScope names the shape, NumberVault names the number). |
>
> ## ⚠️ THE ONE OPEN ITEM — AUDIO DOESN'T MATCH THE NEW TEXT YET
> All the above changed the **text a kid READS** (`context` / `padInstruction` / `instruction` / diagnostic `prompt`). Milo's **spoken voice** (`say` / `work`) was deliberately **left untouched** — those are the 605 pre-rendered ElevenLabs clips (see the 🔊 block below); changing `say` would silence them or force a full-corpus re-render. So in 12–14 a kid **reads** the new explaining question but **hears** the older phrasing. Both work (separate channels), but they're not word-for-word.
> **▶ WHEN THE QUOTA RESETS (2026-07-27):** decide whether to re-render `say`/`work` to match the new question wording. It's the full corpus again (~40k chars, and a wording change is not free). The generator is idempotent per line, so you *could* re-render only the lines whose `say` you rewrite — but this session did NOT rewrite any `say`, so today the clips are still valid; this is only needed if you want the audio to speak the new explaining phrasing.
>
> ## The no-sense audit — every finding, all fixed (`2759985` + `fb7b5fe`)
> A question is "no-sense" if a child reading it can't tell WHAT it asks: missing subject, a label that doesn't fit the sentence, a dangling "it", an off-screen reference, or wording that fights the picture. **NOT hints/teaching — that's out of scope (esp. the diagnostic).**
> | band | fix |
> |---|---|
> | 3–5 | NumberDoors + counting door beat: *"Which door did Milo **say**?"* (you don't say a door) → *"Tap the door with the number you heard!"* |
> | 6–8 | MarketDay: *"3 rows of 4 — how many in all?"* → *"…4 **cookies** …"* · SliceShop: *"…**shaded**?"* in the bar-shape Chocolate Shop → shape-aware *"covered"/"shaded"* |
> | 9–11 | DivisionShare: *"Share 20 among 4"* → *"Share 20 **nodes** among 4 **bays**"* · MissionBrief: *"packs 5 crates into each of 6 **crates**"* → dropped the colliding item noun · **DataDeck** (v49) · **borderline (v51):** AngleScope *"…does this **square** have?"*, NumberVault *"How many hundreds **in 3,482**?"* |
> | 12–14 | **CLEAN** — the explaining pass (v47) already covered it; the auditor found nothing. |
> | 15–16 | TheShot peak: *"top of the **arc**"* with no arc drawn → added a context line |
> | 17–18 | SystemsMatrices rendered *"3x − −y = 5"* (double minus) → fixed the sign join; cosmetic *"(x − 0)²"* / *"+ 0"* collapsed in Quadratic/Conic/Rational |
> | diagnostic | `e.compare` *"Which is more?"* (numbers only in the tap choices) → *"Which is more, 8 or 5?"* |
>
> ## How it was verified + what's the rule now
> **Verified live in the dev preview** (not just tsc): Bank Account guided+scored, Delivery Drone (illustration + "Look at the map"), DataDeck ("Pets at the shelter" / "How many Dogs?"), DivisionShare ("Share 14 nodes among 3 bays"), NumberVault ("How many tens in 253?"), AngleScope ("…this rectangle…"). All copy/display-only — **no `answer` / `badge` / `choices` / math touched anywhere** (a false-positive grep check confirmed the DEMO one-line constants kept their non-text fields byte-identical).
> **The locked rule:** every question **names its subject**; template labels are always countable nouns that fit the sentence; the diagnostic (and any screener) stays clear-but-non-teaching; a lesson chapter may explain the idea but never the answer.
>
> ## Housekeeping / not mine
> The working tree still carries **uncommitted `.gitignore` + `scripts/.voice-corpus.json` / `.voice-fragments.json`** changes from the prior voice session — NOT touched this session, left as-is. Only diagnostic-related files + the audited chapters were staged per-commit (never `git add .`).
>
> _(the 🔊 block below is the prior session — the recorded-voice work, still the source of truth for how audio playback + the clip corpus work.)_

> 🔊 **2026-07-23 (THIRD SESSION SAME DAY) — MILO HAS A REAL RECORDED VOICE IN THE TEEN GAME BANDS: SHIPPED TO PROD. 605 pre-rendered ElevenLabs clips (16 MB) — every static spoken line in 12–14 + 15–16, THE PLAN in all 24 chapters, and 25 of 41 scored-question prompts stitched from fragments. Also cut 39 spoken correct-answer cheers. `main`@`227ece5`, prod serving sw v43, post-deploy smoke green. `tsc` · 64/64 vitest · `next build` (34 routes) · 0 console errors.**
>
> ## ⚠️ READ THIS FIRST — NOBODY HAS LISTENED TO ANY OF IT
> 605 clips are LIVE and not one has been heard by a human. Everything below was verified **structurally** — clips resolve, chain in narration order, stitch to the right pieces, zero console errors — which is not the same as sounding right. The **stitched** prompts are the real risk: they either sound natural or audibly broken at the seams, and that judgement needs ears. **Play one 12–14 chapter through to the scored questions.** The generator is idempotent, so fixing specific lines costs only those lines.
>
> ## The three commits
> | commit | what |
> |---|---|
> | `0d21106` | the pipeline + 409 static line clips + cheer removal + voice picker (sw v42→v43) |
> | `2f5efc0` | THE PLAN panel, 24 clips, reconstructed from JSX |
> | `227ece5` | fragment stitching for the templated question prompts, 172 fragments |
>
> ## Why: Chrome ships no usable local voice on many machines, so Milo was SILENT there — and the teen walkthroughs are where the actual teaching lives.
>
> ## The pipeline (all new)
> | file | role |
> |---|---|
> | [src/core/voiceClips.ts](src/core/voiceClips.ts) | `clipKey(text)` — FNV-1a, **shared by build script and runtime**. If these ever drift, every lookup misses silently. |
> | [scripts/voice-corpus.mts](scripts/voice-corpus.mts) | extracts whole lines → **433 lines / 45,208 chars** (incl. the 24 reconstructed PLAN lines) → `scripts/.voice-corpus.json` (untracked, regenerable) |
> | [scripts/voice-fragments.mts](scripts/voice-fragments.mts) | cuts the TEMPLATED prompts into segments + a value vocabulary → `scripts/.voice-fragments.json` + `public/audio/fragment-templates.json` (the latter IS committed — the runtime matcher needs it) |
> | [scripts/voice-generate.mts](scripts/voice-generate.mts) | renders clips. **Idempotent** — skips what's on disk, stops clean on 401/429, resumes exactly where it stopped. Writes the manifest from what ACTUALLY exists. |
> | [src/infra/voiceClipPlayer.ts](src/infra/voiceClipPlayer.ts) | playback order: whole-line clip → **fragment stitch** → browser speech. **Any** miss at any stage falls back cleanly; a line is never left with a gap |
> | [src/infra/storage/voicePref.ts](src/infra/storage/voicePref.ts) | per-DEVICE voice pref (not per-learner — it's an output setting like volume) |
> | [src/shared/ui/VoicePicker.tsx](src/shared/ui/VoicePicker.tsx) | the setting, on `/profile`; plays a sample on select |
>
> **Voice = Stevie (`IvUJKFyjVb5hItY9dJAT`)**, model `eleven_v3`, format `mp3_22050_32` (32kbps keeps 605 files at 16 MB instead of ~60 MB). Expression comes from inline v3 audio tags chosen per line TYPE in `tagFor()` — `[warm]` for THE PLAN, `[gently]` for wrong answers, `[clearly]` for explanation (the default). Fragments carry **no tag** — they are stitched, so a direction on the word "17" is wasted and would fight the run around it.
>
> **Four hook points in [useMiloSpeaker.ts](src/infra/useMiloSpeaker.ts):** `_doSpeak` (covers speak/speakAt/speakAfterCurrent), `speakSeq` (which `speakSteps` delegates to → the whole walkthrough), `speakWithHighlight`, and `stopSpeech`→`stopClip`. **The word highlight is now paced by the clip's REAL duration** — strictly better sync than the old length-weighted guess.
>
> ## ✅ THE PLAN — solved by reconstructing it from JSX, not by duplicating it
> In chapters WITH a `TutorialScene`, `ExplanationPanel` builds its narration at RUNTIME by flattening `overview.problem` + `points` **JSX nodes** into words (`spoken`, GameShell ~line 855). That string exists nowhere in source, so static extraction couldn't reach it. `planLine()` in [voice-corpus.mts](scripts/voice-corpus.mts) now rebuilds it from the JSX — **no per-chapter `spokenText` field, so nothing can drift**: edit the JSX, re-run the extractor, the key changes with it.
> **The subtlety that makes it work:** `walkWords` tokenizes each TEXT LEAF separately and the panel joins every token with ONE space — so `below zero</strong>.` speaks as `"zero ."`, two tokens. A naive tag-strip yields `"zero."` and every key misses. Split on tags to recover the leaves, tokenize each.
> Tagged `[warm]` (it sets the chapter up; it isn't a lecture). Verified on TWO chapters, because one match could be coincidence — Bank Account → `2spm7z.mp3`, Baggage Scale → `lz8qyg.mp3`.
> Related: `overview.say` IS still rendered as clips but is only spoken by chapters WITHOUT a TutorialScene, so a handful of those clips may never play. Harmless, already paid for.
>
> ## ✅ Fragment stitching — the scored-question prompts
> A prompt carries its numbers (`The balance was 12 dollars, then you withdraw 7…`), so no clip can cover it. [voice-fragments.mts](scripts/voice-fragments.mts) cuts each template at its holes: the **literal runs become multi-word clips** (natural prosody) and only the values are stitched. Joins land on the numbers, so most of the sentence is real speech — not word-by-word robot. 63 segments + a 0–100 value vocabulary = **172 fragments, 1.2 MB**, in their own `frag/` folder and manifest so a bare segment can never be mistaken for a whole-line clip.
> **Degradation is strict on purpose:** if ANY piece is missing the WHOLE line falls back. A silent gap mid-sentence reads as a bug; the browser voice just reads it.
> **16 of 41 templates are NOT covered** — open-ended holes (item names, `speakExpr`, fraction words). Several are blocked only by a two-way ternary (`${low ? 'lower' : 'higher'}`) and would be cheap to add.
>
> ## Three bugs found by verification, all worth remembering
> • **The extractor only matched SINGLE-quoted strings** — the codebase mixes quote styles, so 80 `say:`/`coach:` lines were silently missing. Caught only because a live check showed no mp3 request where one was expected. Corpus went 329 → 409.
> • **The manifest must be written by the GENERATOR, not the extractor.** Listing a key with no mp3 makes every miss cost a failed fetch before falling back.
> • **A bare identifier in a hole is NOT necessarily a number.** `${dir}` renders `"withdraw 7"` — a word plus a number — so those templates matched and then always fell back. Caught by reading the real source instead of trusting a synthetic test string. Fixed by adding the seven verbs (deposit/withdraw/pay/receive/owing/get/with) to the value vocabulary. *Same lesson as the padValue bug: a synthetic check that passes proves less than one real value.*
>
> ## Budget / quota — ESSENTIALLY SPENT
> **~38.5k of the 40,000-char Starter month used; resets 2026-07-27.** Almost nothing left this cycle. Two quota facts worth keeping: the API key carried its OWN **20,000 cap** separate from the account's 40k (it stopped a run mid-way while the account had plenty left — raised in the dashboard, resumed with zero loss); and **re-rendering after a voice or tag change costs the FULL corpus again**, so a voice change is not a cheap experiment.
>
> ## ▶ OPEN
> 1. **LISTEN TO IT.** See the block at the top. This is the only item that matters and it cannot be done by an agent.
> 2. **`public/audio/` is 16 MB committed to git.** Assets were previously squeezed 244 MB → 22.8 MB, so this roughly undoes a chunk of that. Decide CI-built or LFS. Cheap to restructure now, permanent once it's deep in history.
> 3. **3–11 bands have NO clips.** ~2.9k chars, mostly numeric templates — the fragment machinery built this session is exactly what that band needs, and it's where Chrome silence hurts most (counting). Probably the highest-value next voice work.
> 4. **16 uncovered templates**, several blocked only by a two-way ternary — cheap coverage win after the quota resets.
> 5. Rollback if the voice turns out wrong in front of a child: **Vercel promote-previous** (v42 predates all voice work), per [docs/runbooks/rollback.md](docs/runbooks/rollback.md).
>
> _(the block below is the same day's dead-code sweep.)_

> 🧹 **2026-07-23 (SECOND SESSION SAME DAY) — DEAD-CODE SWEEP: SHIPPED TO PROD. `src` IS 73,815 → 62,158 LINES (−11,657, ~16%), 337 → 255 FILES, −1 DEPENDENCY, −9MB ASSETS. `main`@`7e29cc6`, prod serving sw v42, post-deploy smoke green. `tsc` · 62/62 vitest · `next build` (34 routes).**
>
> **The parade work from earlier today shipped with it** (`6f6e5de`, the first of the 11 commits) — the "nothing is committed" open item is closed, and the drawn walk cycles are live.
>
> ## Post-deploy smoke on `milo-story-mode.vercel.app` — all green
> `/` `/auth` `/diagnostic` `/story` `/menu` `/parent` `/teen-preview` `/api/health` → **200**. The three dev preview routes → correctly not-found. Deleted assets (`scene_integers.png`, `tower_lift_car.png`) → **404**; new + still-live assets (`rabbit_walk.png`, `rabbit_side.png`) → **200**. A teen chapter and a story chapter both mount through the new registry (Times Grid's backdrop `#0a1026` matches its row). The counting chapter runs and fetches `firefly_walk.png`. **Zero console errors** across the whole prod drive.
>
> ## ⚠️ What is NOT verified on prod — check these when you next play
> 1. **Signed-in progress saving.** Needs a real account; runs through the relocated `finishAndSync`. **Play one chapter to the end signed-in and confirm the session lands.**
> 2. **The Pixi parade CANVAS on prod.** Sheet loading is confirmed; I did not sit through to the scored parade where the canvas mounts.
> 3. **Story-chapter completion** (the CelebrationModal-on-finish path). Story chapters have no dev test hook, so reaching the end means solving 10 rounds of real math. The portal structure is verified; that one branch is not.
>
> Rollback if anything surfaces: **Vercel promote-previous** (v41 is one deploy behind), per [docs/runbooks/rollback.md](docs/runbooks/rollback.md).
>
> ## The 11 commits in the deploy, oldest first *(this handoff update is a 12th, docs-only — no sw bump needed, the app output is unchanged)*
> | commit | what |
> |---|---|
> | `6f6e5de` | **feat**: the 2D walk-cycle parade (the earlier session's work) |
> | `6852c30` | chore: gitignore `labs-demo/` — 505MB was one `git add .` away |
> | `5dbb907` | **refactor**: delete 29 unreachable files, −7,869 lines |
> | `b1118a9` | chore: drop the unused `@supabase/ssr` dep |
> | `24d193d` | refactor: 12 inline `FitBox` copies → the shared component |
> | `1db62b3` | refactor: 30 dead exports + 5 dead `GameConfig` fields |
> | `72d7357` | chore: delete 26 unreferenced teen assets (8.9MB) |
> | `262317f` | **refactor**: 55 chapter wrappers → `ChapterPortal` + `registry`, −3,719 lines |
> | `86d334f` | chore: drop a tracked `.next` trace dir inside `src` |
> | `0303a88` | docs: this handoff block |
> | `7e29cc6` | chore(sw): bump cache version v41 → v42 for the deploy |
>
> ## How the collapse was verified — two checks worth reusing
> **① The registry was proved against the wrappers it replaced.** All 55 rows were re-extracted from the pre-collapse files in git (`262317f^`) and diffed against the committed `registry.tsx`: **0 mismatches** across skill id, backdrop, band, game import, sim import, Explore copy, concepts list and nextPointer. Because the rows were generated mechanically, this — not spot-checking — was the check that mattered. *(A first run reported 2 false mismatches on `nextPointer`: `json.dumps` without `ensure_ascii=False` escapes the em dash. Checker bug, not a data bug.)*
> **② A chapter was played to completion through the new portal**, using the dev-only `data-test-answer`/`data-test-phase` hook on the teen QuestionBoard: intro → walkthrough → guided → 8 scored → mastery early-exit → `onFinish` → MasteryState → Done → exit. Every answer registered **`phase=solved`, 0 reveals** — i.e. graded CORRECT, not merely "the screen advanced" (the distinction the `padValue` bug taught us). **Note: MasteryState's 12–14 variant IS the quiet "SOLVED" stamp** — `conceptsConfirmed` only surfaces in the 17–18 variant. It looks like a different component; it isn't.
>
> ## What the collapse changed, structurally
> **[ChapterPortal.tsx](src/features/chapters/ChapterPortal.tsx)** owns the plumbing all 55 wrappers repeated (portal mount, one-shot result sync, replay), in two shapes — story (CelebrationModal over a per-chapter backdrop) and teen (`data-band` skin, MasteryState, stopSpeech, optional Explore sim). **[registry.tsx](src/features/chapters/registry.tsx)** is the table and now owns the complete id→component map, so `app/game/page.tsx` imports it rather than defining it and `/teen-preview` drops its own 40-line duplicate. **Adding a chapter is one row.** Code-splitting is preserved — each row keeps its own dynamic import and the portal is built inside the loader.
> **16 bespoke wrappers remain** (17–18 mostly) — their phases/copy didn't fit the table. They live in `BESPOKE_CHAPTERS` in the same file.
>
> ## Deliberately NOT done — these are decisions, not oversights
> 1. **`/play` (10 AR routes, 2,244 lines) and `/daily` (261 lines) still exist and are still unlinked from anywhere.** They are *parked features*, not dead code, and the handoff marks AR as "user's call". Deleting `/play` also frees `@mediapipe/tasks-vision` and `infra/ar` (525 lines) — its only consumer. **~2,770 lines + 1 dep whenever you say so.**
> 2. **~130 symbols exported but used only inside their own file.** Dropping the `export` keyword saves no lines and risks breaking a call site — churn, not a cut.
> 3. **6 teen kit components (1,706 lines) reachable only from `/kit-preview`**, a gallery that 404s in production. Deleting them means deleting the gallery. Real cut, needs your call. (`BandScope` is NOT one of them — it is live via TeenLessonShell.)
> 4. **`shuffle` is still redefined 46× and `pick`/`rnd` ~95×.** One `core/rand.ts` would save ~300 lines AND fix four copies that use the biased `sort(() => Math.random() - 0.5)`.
> 5. **The `repositories` barrel is bypassed by half its callers** (18 barrel / 17 direct).
>
> ## Mistakes made this session, so the next one doesn't repeat them
> • **Brace-matching to delete a declaration breaks on destructured params** — the first `{` closes the param list, not the body, so three functions lost their signature and kept their body. `tsc` caught all three. Prefer explicit edits over clever extent-finding.
> • **`rm -rf .next` while the dev server is running corrupts Turbopack** and produces a wall of alarming-but-stale parse errors in the log. Stop the server first. The browser console buffer also persists across navigations — **open a fresh tab before trusting "0 errors"** (I twice read stale errors as live ones).
> • **`git commit` with no pathspec commits the WHOLE index**, not what you just `git add`ed — the first slicing attempt swallowed 133 files into one commit. Use `git commit -- <paths>`. (And zsh does **not** word-split unquoted `$VARS` — use arrays.) **⚠️ AMENDED 2026-07-26 — that second half is a trap of its own: a pathspec that is a DIRECTORY commits the working tree under it and ignores the index, so `-- src/…/teen/games` swallows `games/parts/*` even after an explicit `git reset`. Stage precisely and commit from the INDEX; then check `git show --stat HEAD`. See the 📱 block §④.**
> • **A checker that disagrees with the code is guilty until proven innocent.** Two "mismatches" and one "orphaned file" this session were bugs in my own scripts (em-dash escaping; a grep needing a `lessons/` prefix). Same lesson as the E2E flakes in the 07-19 block: *a measurement that disagrees with the pixels is guilty.*
>
> ## Impurity worth knowing about
> `package-lock.json` landed entirely in the parade commit `6f6e5de`, so that commit's lock reflects the `@supabase/ssr` removal while its `package.json` still lists the dep. Harmless now that it's all merged; it would only bite a bisect that runs `npm ci` between `6f6e5de` and `b1118a9`.
>
> **⚠️ Unchanged and still more important than any of this: excluding dev accounts the product has 3 accounts, 2 learners, 0 DAU/WAU/MAU, 0 signups in 30 days. Watch one real child play; start the attorney conversation.**
>
> _(the block below is the same day's earlier session — the parade build itself.)_

> 🎞️ **2026-07-23 — THE 3–5 COUNTING PARADE IS NOW REAL 2D ANIMATION. Storytelling 1 (Nature Walk) complete: 11 creatures with drawn walk cycles. NOW COMMITTED as `6f6e5de` (see the block above). `tsc` · 62/62 vitest · `next build` green; 0 console errors.**
>
> **⚠️ The 2026-07-20/21 block below is NOT superseded — the product still has ~zero real users, and "watch one real child play" + "start the attorney conversation" are still the two highest-value actions. This session was engineering on the 3–5 chapter; it did not change that.**
>
> ## The road taken — two approaches were built and thrown away, on evidence
> 1. **Rive vector rabbit — ABANDONED.** Drew a full cut-out rabbit in Rive via MCP (16 shapes, 4-beat walk, state machine). Founder: *"not looking good"* — correct; hand-authoring beziers blind through MCP calls cannot match painted AI art. The `.riv` still exists locally as a comparison. Gotchas saved to the `reference-rive-mcp-gotchas` memory (**rotation is RADIANS not degrees**; draw order is reverse-creation; **no render tool and no export tool**, so you cannot see what you drew and a human must export).
> 2. **Cut-out puppet rig — SUPERSEDED, now dead code.** Cut the legs out of each PNG and swung them from their joints ([rigs.ts](src/features/chapters/story/canvas/rigs.ts) + `buildRig` in ParadeStage, plus `scripts/creature-legs.py` and `scripts/creature-preview.py`). Founder: *"not proper animation"* — also correct, and the honest diagnosis is structural: **one rigid piece per limb on a rigid body cannot change SHAPE, and shape change is most of what reads as animation.** I tuned timing for two rounds before naming that; should have named it first.
>
> ## ✅ What shipped — the founder's idea, and it worked
> **Generate a walk-cycle VIDEO per creature → split to frames → key the background → sprite sheet.** A video model gives temporally coherent frames *by construction*, which is exactly what independently-generated stills cannot do (style drift). Legs bend, bodies deform, silhouettes change frame to frame.
>
> • **[scripts/creature-frames.py](scripts/creature-frames.py)** — the whole pipeline, one command per creature: decode (imageio ships its own ffmpeg, no brew) → soft chroma key + despill → **ONE shared bbox across all frames** (per-frame bboxes make the sheet wobble) → cycle-period detection → palette-quantised strip + preview GIF.
> • **[sheets.ts](src/features/chapters/story/canvas/sheets.ts)** — 11 entries, keyed by sprite URL. `fps` is per-creature cadence AND, for grounded creatures, sets ground speed.
> • **Runtime** — `AnimatedSprite` in ParadeStage (it *extends* Sprite, so anchor/scale/facing/hit-area applied unchanged), plus the DOM path in `CountItem` so the **explanation and guided rounds** animate too — they were still static after the first pass, because only the Pixi canvas had sheets.
> • **11 sheets, 4.2MB** (11MB before quantising), each loaded only when its creature appears.
>
> ## ✅ Travel rewritten — creatures WALK in, they are not pushed in
> Travel was a spring easing to a target at a speed unrelated to the legs → feet skated, read as a sticker being dragged. Now **one cycle carries one stride** (`STRIDE = 0.67` of body height), so ground speed and leg speed agree by construction. Measured: constant 8–9px/step with no decay (a spring shrinks every step), easing only over the last stride. **Standing creatures PAUSE the cycle** and breathe instead — leaving it running is skating on the spot. Flyers/swimmers cruise at a set speed (no ground contact to betray a mismatch).
>
> **On tap:** the next creature is now requested **0.1ms** after the tap (was: after the whole ~2s exit walk — the child answered then watched dead time), and the counted one exits at **2.4× with its leg cycle sped up to match**. Safe because within a slot both travel the same direction, so outgoing and incoming never cross.
>
> ## 🐛 Two bugs the founder caught from a screenshot
> • **Taps hit the wrong creature.** The hit area was measured from `o.texture` — the **1024×1024 source sprite** — but a sheeted creature draws a CELL (fish: 351×256). Hit spans were `[-80,814]` and `[210,1104]`: ~600px of overlap. Now measured off the drawn texture → `[241,493]` and `[531,783]`, a 38px gap, and a real tap verified to land on the correct creature.
> • **The collect tray covered the creatures.** It was `position:fixed; top:112` centred — exactly where creatures rest (36%/64% of width). Now in one bottom-anchored column with the answer buttons stacked above it, so neither can collide with the other or with the parade.
>
> ## 🔬 Video-generation gotchas — READ BEFORE GENERATING THE REMAINING 9
> • **Never key green on a green creature.** The turtle's own flippers were keyed away (`alphacov 0.31`). Regenerated on **magenta** (`--key magenta`). **The farm frog will hit this.**
> • **Kling fades the background white→green across the clip** rather than starting green. Always use the settled tail (`--start 0.5`, shark needed `0.78`), or generate 10s so the settled part is long enough to hold real motion.
> • **Motion-blurred edges are half-key-coloured** — a hard threshold ringed the eagle in green smudges. The key is now a soft alpha ramp.
> • **Cycle detection must be capped at half the clip** — otherwise it "finds" a 49-of-61-frame period it cannot verify and the loop hitches. Falls back to spanning the whole clip when no real repeat exists; `--pingpong` for oscillating limbs with no clean cycle (the turtle: 14 cells).
> • **A "server isn't responding" error may still have submitted** — cost 7.5 credits on a duplicate firefly. Check before retrying.
> • Judge sheets on `motion` vs `loopgap` numbers, not on a strip — and at real display size, not 1024px.
>
> ## 📊 Credits: **120 spent, 649.2 left** (Higgsfield Plus). 7.5/video at 5s, 15 at 10s. ~30 went on retries.
>
> ## ▶ OPEN — this chapter
> 1. ~~**Nothing is committed.**~~ ✅ **SHIPPED** — `6f6e5de`, merged to `main` and live on prod (sw v42). See the 🧹 block above.
> 2. **DELETE THE DEAD RIG — STILL OPEN.** `rigs.ts`, `buildRig` + `SWING_RATE`/`STANCE`/leg code in ParadeStage, `scripts/creature-legs.py`, `scripts/creature-preview.py`. Unused on every Nature creature; keeping two systems is pure debt. *(The dead-code sweep did NOT do this — `rigs.ts` is still imported by ParadeStage, so it isn't dead by the import graph; removing it means editing live animation code, which belongs with parade work, not a mechanical sweep.)*
> 3. **Farm + Space storytellings — 9 creatures, ~70 credits** (lamb, chick, duckling, bee, frog, duck, dragonfly, astronaut, alien). Frog needs the magenta key.
> 4. **Cadence tuning is one number each in sheets.ts.** Founder already flagged eagle (0.67→1.33s) and ladybug (0.55→1.00s) as too fast. **`ant` is now the fastest at 0.46s** and may be next. Also unjudged: whether 2.4× exit and the instant refill feel right (briefly 3 creatures on screen).
> 5. **Not checked: Safari, real device, short-landscape.** All of this was headless Chromium at 1024×600.
> 6. Minor: the collect tray renders butterflies as the 🦋 emoji while the parade shows the painted one (`COUNT_SRC.butterfly = []` is a deliberate older founder call, now inconsistent).
>
> **Verify recipe:** `/story?obj=<creature>` — a **dev-only** override (stripped from production) that pins every scored round to one creature, because the round plan is shuffled. Landscape only; the demo/guided rounds use their own fixed creatures.
>
> _(everything below is prior sessions — the 🔭 block was the previous LATEST and its headline still stands.)_

> 🔭 **2026-07-20/21 — RESPONSIVE 15–16 SHIPPED · THE AGENT ROSTER DELETED · DIAGNOSTIC MADE EVIDENCE-GRADE · AUTH LOGGING · AND THE REAL HEADLINE: THE PRODUCT HAS ~ZERO REAL USERS. `main`@`886895e`, prod sw v41, smoke green.** Six commits: `9be523e` (responsive) · `9e68ba2` (remove agents) · `037dd0d` (metrics query) · `f60c33f` (sw v39) · `94abc32` (diagnostic) · `886895e` (auth_events, sw v41). Gates at each push: `tsc` · **62/62 vitest** · `next build`.
>
> ## ⚠️ READ THIS FIRST — the numbers, because they should reorder everything
> A founder-metrics query run against prod, **excluding the two dev accounts** (which own 13 of 15 learners):
>
> | | with dev data | real |
> |---|---|---|
> | DAU / WAU / MAU | 0 / 3 / 7 | **0 / 0 / 0** |
> | accounts · learners · sessions | 5 · 15 · 38 | **3 · 2 · 6** |
> | diagnostics completed | 10 | **0** |
> | `diagnostic_rechecks` (gap closed) | 0 | **0** |
>
> Signups in the last 30 days: **0**. First signup was 2026-05-23. The 701 `session_start` events against 38 `sessions` rows are preview/agent drives, not children.
>
> **This is not a build problem and no amount of code fixes it.** The whole session's engineering was polish on a product nobody uses. The two highest-value next actions are both human: **(a) watch one real child play** (open in handoff since multiple sessions, keeps losing to work that feels more tractable), and **(b) start the attorney conversation** — no privacy policy / ToS / COPPA content exists anywhere in the repo, it blocks public launch AND charging, and it is weeks of lead time while everything else is days.
>
> Query lives at **[supabase/metrics/founder_metrics.sql](supabase/metrics/founder_metrics.sql)** — no new tracking code, no migration; the whole funnel was already derivable from existing tables (engagement off `sessions.started_at`, so it works RETROACTIVELY). ⚠️ Its `INTERNAL_ACCOUNTS` list is load-bearing and needs confirming — every number is wrong if that list is wrong.
>
> ## ① 15–16 RESPONSIVE — shipped (`9be523e`)
> Short-landscape had never been checked in this band. Three shared root causes, fixed once in GameShell so both bands inherit:
> • **FitBox was working and the result was still unusable** — the new scenes DO route through FitSlot (no overlap), but **scale-to-fit is not reflow**: on a 320px-tall frame the stacked board took ~50% of the height, leaving ▲ steppers at **12×12** and a commit button at **61×13**. Shrinking the instrument cannot fix that; the buttons keep the same share. Scored loop is now a two-column ROW on `short`, in flow, so overlap is impossible by construction.
> • **Walkthrough scenes were CLIPPED, not scaled**, at every short size — `.teach-illo svg{max-height:100%}` only caps a scene whose ROOT is the svg, and these wrap theirs in a column of readouts (boxes of 6–115px around 120–200px of content).
> • `width="clamp(…)"` used as an **SVG GEOMETRY ATTRIBUTE in 8 files** — invalid, browsers drop it, so the sizing never applied and every chapter logged a console error. **This repo has shipped this exact class before as a Safari-only defect.** Also fixed: TheShot's invalid `d` path and two `motion.line`s writing `undefined`.
> Verified 24 chapters × 6 sizes × 2 stages = **144 screens** on `getBoundingClientRect()`. Known ceiling, not fixed: TheShot at 640×320 has ▲▼ at 29×29 and a court ~150×72.
>
> **Answer pad** (founder: practice looks empty on a large screen): caps raised 38→52px font, 108→150px minWidth; and on a PAD question board+pad now centre as ONE group — there was a measured **379px dead band** because the board sat at the top of the flow while CenterFill centred the pad in the leftover.
>
> **⚠️ NOT shipped, deliberately — centring the board on INSTRUMENT questions.** Taking it out of the absolute overlay into flow costs the instrument real height and was MEASURED pushing the **commit button off-screen** at laptop size. An unfinished `tall` gate (`useFrame`, `innerHeight >= 1100`, derivation in the comment) is left in place — it measured clean at 1280×800 but was **never checked at 1440×900**, so the call site keeps the verified pinned-board behaviour. One line to re-enable once verified.
>
> ## ② THE AGENT ROSTER IS GONE (`9e68ba2`) — founder decision
> All 12 `.claude/agents/*.md` + `docs/agent-log.md` **deleted** ("making the agents is not a good idea for us"). Recoverable from git. **Do not spawn the named specialists or write to agent-log.** `handoff.md` blocks below referencing them are historical; their links are dead.
> **Kept deliberately:** `AGENTS.md` (NOT an agent file — it's the Next.js instruction file `CLAUDE.md` loads every session) and `docs/lessons.md` (reverted to committed state; the defect-class list predates the roster).
> **The honest scorecard, if the question returns:** agents earned their keep on **wide mechanical verification** — the 144-screen sweep, and catching two defects hand-verification missed (an edit of mine that was silently INERT, and the off-screen commit button). They were bad at reliability: one hung 50 minutes producing nothing, another ignored an explicit instruction to write results incrementally, ~300k tokens per run. **Liveness signature worth reusing: a hung agent shows no NEW child processes and no new file writes — parent-process CPU at 0% proves nothing.**
>
> ## ③ THE DIAGNOSTIC IS NOW EVIDENCE-GRADE (`94abc32`) — the session's real engineering
> Two structural accuracy holes closed after auditing what the verdict actually rested on (**one 4-choice MCQ per skill**, deciding a six-week plan):
> • **FAIL CONFIRMATION ("strikes").** A first miss is no longer a verdict — the skill is re-offered with a **FRESH item** (the ask count folds into the item nonce; an unchanged ctx reproduces the identical question and the child could just pick differently). Pass → slip forgiven; miss again → confirmed. Kills the worst failure: a near-grade-level child's single fumble reporting **a gap that does not exist**. Confirmation **stops after 4 confirmed fails** — the catastrophic slip lives at 1–3 fails; confirming a whole deep descent measured **62 asks** for a 17-18 learner rooting at pre-K (an ordeal, not a probe). 3–5 never confirms (parent-observed items; "not yet" is an observation, not a miss).
> • **PLAY-DATA PLAN REVISION.** The probe structurally **cannot** catch a lucky GUESS (~25%/item — a guess looks like a pass), which stops the descent one level shallow. The plan's first chapter is a dozen adaptive questions on that skill. Struggle there (<50% over ≥4, not mastered) ⇒ prepend the root skill's most load-bearing prerequisite chapter. Fires **once**, **step-0 only**, **asymmetric by design** (breezing proves nothing — the chapter may simply have taught them). Tracked as `plan_revised_deeper`.
> • **Report language now matches evidence strength:** "the real block IS X" → "every sign POINTS TO X … the first days double-check it as your child plays". A 6–8 question screener points; play confirms.
> Verified by a full planted-gap matrix — every reachable skill in every band as the planted gap → **175/175 EXACT roots**, grade-level probes unchanged at 4–8q, worst case 28q.
> **NOT built, deliberately:** confirming passes symmetrically (doubles every child's probe — bad trade vs anti-fear), decisive-pass confirmation, fluency timing, richer item pools. All should be **shaped by watching real children, not precede them**.
>
> ## ④ AUTH EVENT LOGGING (`886895e`) — production logging audit
> Audit finding: **no durable login/logout history existed.** `auth.audit_log_entries` is **EMPTY** on this project (Supabase keeps auth activity in short-retention platform logs) and `last_sign_in_at` is latest-only. New **`auth_events`** table (migration APPLIED to prod): user_id, event, client_id dedupe, created_at. RLS: authenticated may INSERT only their own rows, **no API reads** (dashboard/service-role only). **No IP, no user-agent** — the audit trail must not itself become a data-minimization finding. Wired at all three seams: password login, OAuth/email-confirmation callback, and sign-out (logged BEFORE token revocation — after would 401 — raced against an 800ms timeout so a dead network can't trap the user signed-in). Guard: **A7a/b/c** added to [rls_regression.sql](supabase/tests/rls_regression.sql), proven green against prod in a rolled-back txn.
> **Not applicable, decided:** request-ID correlation — this is a local-first SPA talking DIRECTLY to Supabase; there is almost no app server for a request ID to flow through. Revisit only if a real backend tier appears (payments, webhooks).
> **⚠️ STILL THE BIGGEST OBSERVABILITY GAP, and it is YOURS:** `MONITORING_INGEST_URL` and a log drain. Verified this session: the Supabase org is on the **FREE plan** (log drains are Pro, ~$25/mo) and an ingest URL needs a Sentry/Logtail **account** to exist first. A no-new-vendor alternative was designed but NOT built pending your call — log errors into Supabase itself (durable + queryable), service-role key preferred so no public write surface is created; the anon-insert variant is cheaper but adds a publicly-writable table to a 500MB free-tier DB.
>
> ## ▶ OPEN — in priority order, and the first two are not code
> 1. **WATCH ONE REAL CHILD PLAY.** Highest-information action available, costs nothing, open across multiple sessions.
> 2. **START THE ATTORNEY CONVERSATION.** Privacy policy / ToS / COPPA — blocks public launch and charging; weeks of lead time; not blocked on engineering.
> 3. **Pricing, if it comes up:** anchor against a tutor (~$150–350/mo), not practice apps. **$20–25/mo per learner, or a $99 six-week gap-closing program.** ONE price, ALL bands — never band-gate a cross-band plan; charging extra to reach the grade-4 gap monetises the differentiator away and charges the most to the most-behind families. Plans are the **broken chain**, not the band (a 12–14 kid gets ~5 chapters up one spine, not all of 9–11).
> 4. **`labs-demo/` is still untracked at 505MB** (480MB node_modules, no own .git) with NO `.gitignore` entry — the only thing preventing a half-gigabyte accident is remembering a note. One line fixes it.
> 5. **No Safari, no real device** — everything this session was headless Chromium, and the SVG-attribute fix specifically targets a Safari-class defect.
> 6. **Not audit-logged: learner-profile DELETION.** Cascades erase everything with no record the deletion occurred. COPPA treats deletion as a parental right; a record *that* it was exercised is likely wanted. Deliberately deferred — the design should come out of the attorney conversation, not precede it.
> 7. Carried: signed-in prod tap-through · the `tall` gate verification at 1440×900 · mobile walkthrough 2-step windowing (never started).
>
> _(everything below is prior sessions — the 🎓 block was the previous LATEST.)_

> 🎓 **2026-07-19 — THE WHOLE 15–16 BAND REBUILT (12/12 chapters), + A PRODUCTION GRADING BUG I SHIPPED AND ALMOST MISSED. `main`@`aea76a5`, prod serving sw v38, all 12 chapters 200.** Nine commits: `10816a3` (plan-board voice) · `a6b2910` (clamps) · `3b0e694`·`c76d1ef`·`c27c73e`·`293030a` (Leaderboard pilot) · `5afaa6e` (wave 1 + THE BUG) · `e685fbe` (wave 2) · `aea76a5` (two open calls). Gates at each push: `tsc` · **53/53 vitest** · `next build` · 0 console errors, every chapter driven live.
>
> ## ⚠️ READ THIS FIRST — the bug, and why my verification did not catch it
> **`GameShell` hands a tapped `AnswerPad` choice to `config.grade` as a RAW NUMBER.** That is honest only where a chapter's value type IS `number`. Leaderboard's is a tagged union, so `v.k === 'num'` evaluated `undefined` and **every padded question marked every answer WRONG — including the correct one.** It shipped in `293030a` and sat in production. I had driven that chapter by hand and passed it.
>
> **Why it was invisible: a wrong answer still advances.** The loop reveals, then moves to the next question — so a wrong grade and a right grade look identical from outside. What I confirmed was "the question advanced", not "the answer was graded correct". Three independent agents reading the file spotted it; two more chapters reproduced it the same day.
>
> **From now on, assert on `data-test-phase` (`solved` vs `reveal`) or on `data-test-answer` being non-empty — never on the screen having moved on.** Fix is `GameConfig.padValue?: (n) => V`; gate is [src/__tests__/answerPadGrading.test.ts](src/__tests__/answerPadGrading.test.ts), which I proved FAILS on the real bug before accepting it. Both defect classes are now in [docs/lessons.md](docs/lessons.md).
>
> ## ① The plan board now speaks what it writes (`10816a3`)
> `ExplanationPanel` spoke `overview.say` while rendering `overview.problem` + `points` — two strings that had drifted, so Milo narrated one thing and the chalkboard showed another. It now speaks exactly the text it renders, assembled from the same nodes. The letter-by-letter chalk write-on (`onWord` was a no-op; the `.mb-word-write` keyframe had been stripped with `showSolve`) is restored, `<strong>` preserved. Shared shell → all 12–14 **and** 15–16 chapters inherit it.
>
> ## ② Four range clamps (`a6b2910`) — stories that stated impossible numbers
> FollowerGrowth (46% of tasks named a **negative follower count**) · TicketCheckout (**−4 tickets**, negative fees) · TheShot readTask (2/3 of L1 and ALL of L2/L3 parabolas opened **upward** while asking for "the peak") · PowerUps (`work` said "3⁴ means 3 multiplied 4 times" — the misconception itself, **spoken after three wrong**). **Deliberately NOT clamped, with the reason in the code:** TheShot's L2 factoring roots — forcing them positive leaves only one of four sign cases, a worse loss than the story strain.
>
> ## ③ The pattern every chapter now follows (piloted on Leaderboard, then fanned out)
> • **Single-number answer → AnswerPad**, distractors are REAL MISCONCEPTIONS so a wrong tap is a wrong METHOD.
> • **Instrument kept only where the answer is a PAIR or a construction** (coordinate, factor pair, boundary+direction, a ruling of how-many-and-which-way). Gate on the SHAPE of the answer, not chapter identity.
> • **No `guided` round** — every graded gesture is worked in the WALKTHROUGH instead (`tutorial` takes an array; `TutorialScene` branches on task kind).
> • **`padValue` is REQUIRED** for any tagged-union value type (see the bug above).
>
> ## ④ The six worlds that BROKE, rebuilt (`e685fbe`) — mechanic changed, never the math
> | chapter | what gave out | what replaced it |
> |---|---|---|
> | **Leaderboard** | the elevator, renamed — no meter gesture for (−8)×(−6), so `work` recited "same signs give a positive" | **ruling bench**: penalty/bonus cards APPLIED or REVOKED. Revoke three −4s → score climbs 12 |
> | **BuildPlot** | you cannot tile a negative area (the code's own comment admitted it) | **signed tiles** — `(x−3)` is a side CUT BACK; laid and cut strips annihilate |
> | **BestPlan** | "x − y" has no referent in two phone plans; 66% of break-evens negative | **one account, two lines** — a printed total and a known difference; positive crossings by construction |
> | **ScreenDistance → CLIMB ROUTE** | two worlds, and a screen diagonal is the same length simplified or not | **hold grid** — √72 = 6√2 is the same climb counted two ways |
> | **PowerUps** | laws ran on a LETTER base no crank can turn | **numeric base + LEVEL COUNTER**; negatives crank below zero (a debuff) |
> | **SkateRamp** | L3 asked for arctan(3/4) — computable by nothing on or off the platform | **measured on a protractor**; proof options no longer label themselves invalid |
> | **MapMaker** | named for transformations, taught them only at L3 — and the engine DEMOTES, so a struggling child never met one | **both strands at every tier**; π-answers, no decimal dial |
>
> ## ⑤ The two open calls, resolved (`aea76a5`)
> **BuildPlot live tiles → REVERTED**, on evidence not taste: driving it showed the scene rendering `x² + 5x + 4` — the expansion of the child's CURRENT guess — beside the target. Dial, compare strings, adjust, never factor. **A verdict is not required for something to be hot/cold**, and it is worse than the BalanceBench tilt the partner already rejected, because `2x` does not reveal x whereas the expansion IS the answer. Tiles still teach in the walkthrough. **MapMaker → rebalance KEPT, [docs/curriculum-12-18.md](docs/curriculum-12-18.md) AMENDED** so spec and code stop disagreeing silently (the agent's "it's only difficulty guidance" read was wrong — all 12 lines use `→` as the tier contract — but its argument beat the doc anyway). **The sphere is BACK:** the removal note claimed ⁴⁄₃πr³ is whole "only at r = 3"; **r = 6 gives 288π too**, and in-terms-of-π retires the decimal objection entirely.
>
> ## ▶ OPEN — what to pick up next
> 1. **Extend [e2e/question-quality.spec.ts](e2e/question-quality.spec.ts) to the 15–16 ids** (its `CHAPTERS` list is 12–14 only). It already asserts "the pad contains its own answer" — it would have caught the grading bug automatically. ~1 line + a 12-min run. **Highest value.**
> 2. **NOTHING has been checked at short-landscape.** Eleven chapters gained new in-file scenes (protractor, climb wall, move grid, tile board, ruling bench, cross reader). This repo has shipped short-landscape collisions before; `640×320 · 667×375 · 740×360 · 1024×400` is the matrix.
> 3. **Signed-in prod tap-through** — progress saving is still not headlessly verifiable, and that path now carries a lot of new code.
> 4. **Known coverage gaps, named rather than hidden:** MapMaker has no arc/sector and no "identify the rule"; CLIMB ROUTE dropped √12/√27/√48/√75 (only sums of two squares are climbable) and has no "cannot be simplified" case; SkateRamp's ratios are 3-4-5 only (9 distinct items); PowerUps' power-of-a-power is base-2 only.
> 5. **Carried, unchanged:** partner call on walkthrough-only manipulatives in the 12–14 band · watch a real kid play · launch-plan founder decisions (attorney = longest pole).
>
> _(the block below is the same day's earlier work — personas, LineSetter labels, guided arrays, agent audit.)_

> ✅ **2026-07-19 (EARLIER SAME SESSION — FOLLOW-UPS SHIPPED: correctness personas LIVE, LineSetter labels, guided arrays + BalanceBench inequality rehearsal, agent-roster audit. `main`@`bd957a1`, sw v28→v29 — v29 was still BUILDING on Vercel when this was written; confirm `curl -s milo-story-mode.vercel.app/sw.js | grep VERSION` says v29 before assuming the deploy landed.)** Four more commits on top of the 🎯 block below: `3054b87` (agent-structure fixes) · `7154bec` (the three follow-ups) · `bd957a1` (sw bump, missed in 7154bec — noted so the convention slip is visible). Gates at push: `tsc` · **26/26 vitest** · **E2E 18/18**.
>
> **① aceKid/strugglerKid ACTIVATED** ([e2e/adaptive.spec.ts](e2e/adaptive.spec.ts) — were `test.fixme` since 07-18; `reachPractice()` was the missing piece). aceKid drives integers to the mastery end-state (Done button, zero further boards); strugglerKid proves a wrong answer warmly REVEALS (pad stays mounted, no punitive UI). The dev-only phase hook now reports **`reveal`** distinctly (was lumped into `practice`). The E2E harness's original two-tier vision (robustness + correctness personas) is now complete and gating — **18 E2E tests total**.
> **② LineSetter `labels` prop** ([gameKit.tsx](src/features/chapters/teen/games/parts/gameKit.tsx)) — defaults `slope`/`start` unchanged (15–16 users untouched); Water Tank passes `{m:'rate'}` so the dial finally speaks the chapter's own vocabulary, and the "the dial for the fill rate is labelled slope" bridge copy is DELETED, not explained.
> **③ `guided` accepts an ARRAY** ([GameShell.tsx](src/features/chapters/teen/games/parts/GameShell.tsx) — single-object chapters are a one-element walk, nothing else changes). **BalanceBench** now rehearses TWO guided orders: the pad equation, then `x + 2 ≤ 6` on the RayLine ("One more — a weight rule this time"). Why: the inequality **symbol chip is a separately-graded step** that was rehearsed NOWHERE — a child could solve the math right and lose the mark on a gesture nobody had shown them. Driven live end-to-end. **Caveat kept honest:** the rehearsal task is `≤`, which is also the grader's default op, so it walks the mechanic rather than traps the child; a stricter non-default (`>`) rehearsal is a 5-line swap if the partner wants it.
> **④ AGENT-ROSTER STRUCTURAL AUDIT** (commit `3054b87`) — all 12 well-formed (front-matter, persona, How-you-think, Ground, agent-log protocol, lessons.md pointer, routing boundaries; no stale paths; overlaps are deliberate complements). **Two real defects found + fixed, both from my own batch script:** qa-reviewer was skipped by the dedupe guard (already mentioned lessons.md) so it lacked the read-before-review bullet; and the boilerplate told two READ-ONLY roles (product-lead, security-redteam) to "add to" a file their tool grants cannot write — wording now matches their tools (name the lesson, hand the write-up to the owning role). *An instruction an agent cannot execute is the unverified-work trap in miniature.*
> **⑤ ONE FLAKE, ON THE RECORD:** an intermediate full E2E run failed `linearRelationships` once; the failure detail was **lost to my own tail-only log capture** (lesson: `tee` the full log), and it did NOT reproduce in two subsequent full runs (18/18 both). Called a flake with that caveat, noted in `7154bec`'s commit message so it has a paper trail if it recurs.
>
> **▶ OPEN (all human-shaped, unchanged):** (1) partner conversation — manipulatives are walkthrough-only in 7 chapters (fold-in-half, debt cards, crank, chips, meter, grid, tape); per-task gating supports a middle path (first N questions on the instrument) as config-only. (2) Safari / real-phone short-landscape check. (3) Signed-in prod tap-through. (4) Watch a real kid on Room Reno + Water Tank. (5) Launch-plan founder decisions (attorney = longest pole). — _(the 🎯 block below is this session's first half: the full audit story.)_

> 🎯 **2026-07-19 EARLIER (ANSWER-PAD FAN-OUT → QUESTION-CLARITY AUDIT → RESPONSIVE FIX → A LEARNING LOOP. SHIPPED, sw v27→v28.)** Branch `feat/teen-question-clarity-and-answer-pad` → 3 commits (`9eaf235` · `a66bf55` · `a766ab5`) → fast-forwarded to `main` → Vercel prod. `tsc` · **26/26 vitest** · `next build` · **E2E 16 passing** (13 new question-quality + 3 chapter specs) all green.
>
> **⚠️ READ THIS FIRST — the session's real lesson.** The founder asked to fan `answerPad` (tap-a-number answering, previously integers-only) out to the other 11 chapters. I flagged that it would undo the solve-on-illustration work and asked; founder chose **per-task gating**, then on seeing the scope chose **"keep pad everywhere, fix the copy"**. Both were reasonable calls. **The mistake was mine:** the fan-out hid each chapter's instrument but left the copy that described it, so 9 chapters told the child to "crank the gear" / "shade the grid" / "slide your worth" with none of those on screen, and `say` narrated vanished gestures to exactly the tiers that still get audio. I had written that constraint into all 11 agent prompts. **Prose in a prompt did not prevent it.** It took 6 adversarial audit agents to find, and the founder pushing back three times to get there. Everything in ④ below exists so that class of failure is caught by a test next time, not by luck.
>
> **① ANSWER-PAD IS NOW PER-TASK, ACROSS THE BAND.** `GameConfig.answerPad(t)` returns choices → that question shows the pad and hides the instrument; returns `[]` → keeps its instrument. Gating by QUESTION, not chapter. **Fully padded (6):** integers · signedRationalOps · exponentsRoots · orderOfOperations · algebraicExpressions · geometryMeasurement. **Mixed (5):** rationalOps (`bar` keeps BarShade) · ratioProportion (`scaleTotal` keeps TwoTaps) · equationsInequalities (inequalities keep RayLine) · linearRelationships (full/drain keep LineSetter; isFn/readGraph keep their string picker) · percentages (`paintTask` keeps PaintGrid). **No pad at all (1):** coordinatePlane — every answer is a coordinate pair. Rule of thumb: a question keeps its instrument when the answer **isn't a single number**. New shared `numChoices(ans, near, opts)` in gameKit builds answer+distractors, decimal-aware; distractors are real misconceptions (order-of-ops left-to-right value computed by replaying the chapter's OWN collapse engine; `3²→6`; `√36→18`; area↔perimeter; sale↔saving; the un-folded `2×` triangle).
>
> **② THE QUESTION-CLARITY AUDIT (6 agents, 2 chapters each) — what it found.** Two root causes. **(a) MINE, from the fan-out:** `numChoices` never returns `[]`, so in 7 chapters the pad was unconditional → every hand-written `instruction` became dead code, the walkthrough taught a manipulative practice never showed again, and a wrong answer left a **blank stage** (pad unmounted, no instrument to glide) for 2.3s / 6.4s on reteach. **(b) PRE-EXISTING and worse:** `QuestionBoard` switches to structured mode when a task sets `context` **or** `instruction`, and in that mode the prose `prompt` is **never rendered**; separately `loadTask` only speaks `say` at tiers 1–2. So **at tier 3 a question is neither shown nor spoken — the badge IS the question.** That shipped literally unanswerable items: ratioProportion's poured amount and batch size existed only in `prompt` (a child who poured 2 and 3 from "2 : 3" reasoned correctly and was graded **wrong**); coordinatePlane's tiers 2–3 rendered the **answer** as the badge, making a tier-3 reflection *easier* than tier 1; percentages' sale-price and money-saved rendered **identical boards with different answers**, both on the pad. Also found + fixed: a reteach that **voiced the misconception it tests** ("3² means 3 multiplied 2 times" → 6, its own distractor, played after 3 wrong when the child is most suggestible); `markPortion` pre-bracketing `3 + 2 × 5` → `3 + (2 × 5)`, giving away the entire order-of-operations skill and neutering the LTR distractor; `isFn` options labelled `Steady tank ✓` / `Sensor glitch ✗` (always tap the first → 2 of 3 tier-1 items free); a **−3 kg suitcase** (`5x = −15`); superscripts + U+2212 inside SPOKEN strings ("three two", or dropped). **The fix everywhere: a question must be answerable FROM THE BOARD ALONE** — new `padInstruction` (names the wanted number, never a hidden gesture) + `answerLabel` (kills `x + 1 = 4` over `= ?`) + `showEquals:false` on non-expressions, and the pad now **stays on screen through a reveal** (correct mint, wrong pick coral).
>
> **③ RESPONSIVE — two collisions, both short-landscape only.** Portrait passed everything; **640×320, 667×375, 740×360, 1024×400 all overlapped.** (a) Pad path: the pinned top-left board is an ABSOLUTE overlay that only clears the centred column when a tall instrument sits beside it — true for neither a short frame nor a pad question. 640×320 went **−21 → +18**; 1024×400 **−133 → +58**. (b) Instrument path (pre-existing): instruments size on `vw`/`vmin` with **no `vh` term**, so they stay large on a short frame and grow up under the board (**−51** at 640×320). Fixed once at the **slot** with the existing **`FitBox`** (measure natural size → `transform:scale()`), capped so it never enlarges — ~19 instruments covered by one change; large frames measure byte-identical. Pointer math normalises via `getBoundingClientRect()` so drag/tap stay accurate under scale. Long `context`/`padInstruction` shrink and reflow — **never truncated**; only the decorative "TRY THIS ONE WITH ME" label and the guided HandCue drop on `short`. **Known ceiling:** at 640×320 the instrument column scales to 0.61 (grid ~72px). Reclaiming it needs a shorter **board**, not a smaller instrument — pinning the board side-by-side reintroduces the 1024×400 case.
>
> **④ THE LEARNING LOOP (new — [docs/lessons.md](docs/lessons.md)).** Because prose in a prompt demonstrably fails. **Ordering principle, now written down: an executable gate > a type/API shape > an agent definition > prose.** • **[e2e/question-quality.spec.ts](e2e/question-quality.spec.ts)** — drives all 12 chapters and asserts: no phantom gesture in a padded chip · the pad contains its own answer · no double-equals chain · no blank stage on a wrong answer · zero console errors · the set completes. 13 tests, ~12 min. `reachPractice()` in [e2e/personas.ts](e2e/personas.ts) polls (headless has no speech → timer fallback) and **unblocks the parked aceKid/strugglerKid personas**. • **`docs/lessons.md`** — standing defect-class list, each paired with the gate that catches it or an honest "no gate"; **all 12 agents point at it** from their grounding section. • **`LESSON:` protocol in [docs/agent-log.md](docs/agent-log.md)**, seeded with this session's four. • **qa-reviewer** now owns closing the loop + "suspect your own instrument first". • **curriculum-designer GRANTED Bash** — it was the only agent editing TypeScript with no way to typecheck it, which is why 5 of 6 content agents returned unverified work; it also gained the **criteria for choosing a chapter's real-world model** (test the world against the chapter's HARDEST operation — the lift explains signed + and − but cannot explain −5 × −2; one world per chapter; change the mechanic rather than fake the math; answers must be sensible inside the story). • **frontend-ux-engineer** gained short-landscape/`vh`/FitBox + "trust the pixels over your own measurement".
>
> **⚠️ A TESTING LESSON WORTH KEEPING:** the E2E suite failed 3 times before passing, and **every failure was in my test, not the product** — a `:not([disabled])` locator on a deliberately-disabled reveal pad; a rect read off an inner node reporting a 2681px² overlap that didn't exist; a regex matching `weigh` inside "case **weigh**t" and `tile` inside "**tile**s". Both times a screenshot was right and the measurement was wrong. **A measurement that disagrees with the pixels is guilty until proven innocent.** The gate now ships with an offline self-check so tightening the regex can't silently gut it.
>
> **▶ OPEN / NEXT (the honest list):**
> 1. **THREE PEDAGOGY DECISIONS FOR THE PARTNER** — the real cost of "keep pad everywhere". Room Reno's **fold-in-half** is now bypassed (it existed so the ½ is *performed, not recalled* — partner-approved on exactly that basis); **MONEY LAB's debt-card mechanic** (take away debt → worth goes up) is walkthrough-only; same for the crank, collapsing chips, taxi meter, decimal grid and piece tape in 5 other chapters. The copy pass made every question **fair**; it cannot make the chapters **teach** the way they did. Put this in front of him explicitly.
> 2. **NO SAFARI, NO REAL DEVICE.** Every responsive measurement was headless Chromium. This repo has shipped Safari-only defects before (CSS `min()` in SVG geometry *attributes*; `upgrade-insecure-requests` breaking plain-HTTP localhost). Short-landscape on a real phone is the check.
> 3. **Signed-in tap-through on prod** — progress saving still can't be verified headlessly. (Carried from previous sessions.)
> 4. **Wording lands?** The suite verifies *structure*, not *sense*. It can't tell you "Tap how many π — the number that goes in front of π" parses for a struggling 12-year-old. Watch one kid play Room Reno (its Pythagoras items were the worst-rated) and Water Tank (tier-3 badge is now the whole question).
> 5. Smaller, flagged not fixed: `LineSetter` hardcodes its dial labels "slope"/"start" in gameKit while Water Tank teaches "fill rate" (wants a `labels` prop, affects other chapters); BalanceBench's inequality **symbol chip is rehearsed nowhere**, so a child who solves `x > 3` but never taps a chip is marked wrong (wants `guided` widened to an array in GameShell).
>
> _(prior session below — still valid)_

> 🏛️ **2026-07-19 (AGENT DEPARTMENTS + V12 SECURITY FIX + E2E HARNESS, all SHIPPED to prod; sw v25→v27).** Session was about building an **agent organization** to run this project, then proving it on real work. Three commits shipped: `7367bfd` (V12 security, sw v26) · `b31de74` (E2E harness + test hook + show-me-how removal, sw v27) · `74722b2`/`0bd7338` (agent-log records). `tsc` · **26/26 vitest** · `next build` · **3 Playwright specs** all green; prod smoke 200s, serving v27.
>
> **① THE AGENT ORG — 12 agents across 4 departments** (in `.claude/agents/*.md`; **NOTE `.claude/` is gitignored, so these live only on this machine** — see the `project-milo-agent-roster` memory). Each is written as an *experienced practitioner persona* ("How you think" — reasoning habits + judgment), NOT a task checklist, each with a repo-grounding section. **Engineering:** frontend-ux-engineer · backend-data-engineer · devops-release · e2e-test-engineer · security-redteam · qa-reviewer. **Product/content:** curriculum-designer · product-lead (coordinator). **Go-to-market & trust:** growth-marketing · data-analyst · compliance-privacy · support-docs. **Shared memory = [docs/agent-log.md](docs/agent-log.md)** (in-repo, append-only cross-agent handoff log; each agent reads its tail at task start and appends what another role must know). `handoff.md` stays the human narrative.
>
> **② V12 — a REAL cross-tenant vulnerability found, fixed, shipped.** security-redteam audited the tenant-isolation surface and found the `learner_invites` recipient-accept UPDATE policy ([20260615180003](supabase/migrations/20260615180003_rls_initplan_perf.sql):41-43) pins only `invited_email` in USING/WITH CHECK → a recipient could rewrite `learner_id`/`invited_by`/`expires_at` and chain into `can_self_grant_access` = **same class as the CRITICAL V1** (gated only by two non-enumerable UUIDs → MEDIUM). **Fix (applied to prod):** migration `harden_invite_accept_columns` — `revoke update … from authenticated` + `grant update(status) …` (column-level GRANT, because RLS WITH CHECK can't see OLD values). Verified in prod via `has_column_privilege`: status=true, learner_id/invited_by/expires_at/invited_email=**false**; INSERT/DELETE/SELECT intact; **zero new advisors**. Reversible by re-grant. Regression assertions **A6/A6b** added to [rls_regression.sql](supabase/tests/rls_regression.sql). **qa-reviewer then caught a second latent bug:** `acceptInvite` ([invites.ts:132](src/data/repositories/invites.ts)) discarded the UPDATE result and returned `{ok:true}` unconditionally → a 403 would show "Access granted!" while the invite stayed pending. Fixed (reports failure + `accessGranted` flag; grant-before-flip ordering deliberately KEPT — `can_self_grant_access` needs `status='pending'`), and `types.ts` `learner_invites.Update` narrowed `Partial<Insert>` → `{status}` so a future wider update can't compile.
>
> **③ E2E HARNESS + "KID PERSONAS" (new capability).** **Playwright** installed (dev-dep + chromium), [playwright.config.ts](playwright.config.ts), tests in [e2e/](e2e/), `npm run test:e2e` against the dev server (`milo-dev`, port 3017). **Kid personas are DETERMINISTIC strategies, NOT LLM agents** (a gate must be repeatable/fast/free) — [e2e/personas.ts](e2e/personas.ts). **Live:** `rageTapper` (rapid/double-tap → the stale-timer & double-submit bug class) + `quitterKid` (unmount cleanup), driving the **public** `/teen-preview?c=integers` (real adaptive engine, **no auth needed**). **Built but parked as `test.fixme`:** `aceKid` (correct → mastery early-exit) + `strugglerKid` (wrong → warm reveal). To enable them frontend added a **dev-only `data-test-answer` + `data-test-phase`** hook on the shared QuestionBoard, gated `NODE_ENV !== 'production'` → **dead-code-eliminated in every prod build (proven: 0 hits in `.next/server`+`.next/static`)**, so the answer never reaches a real learner. **GOTCHA:** AnswerPad labels render Unicode minus U+2212 `−` but the hook uses ASCII `-` → match by NUMBER not text.
>
> **④ "SHOW ME HOW" (showSolve) REMOVED.** It was enabled by **zero** chapters (dead code). Stripped from [GameShell.tsx](src/features/chapters/teen/games/parts/GameShell.tsx) / [gameKit.tsx](src/features/chapters/teen/games/parts/gameKit.tsx) / [WeatherStation.tsx](src/features/chapters/teen/games/WeatherStation.tsx): `GameConfig.showSolve`/`solveCommitLabel`, `InstrumentProps.coach`, the `'showing'` Sub state, the solve board, `CoachPointer`/`CoachCSS`/`highlight`, and the orphaned word-reveal. **KEPT (look-alikes, verified NOT show-me-how):** the guided-round `coach: 'Your turn — I will help.'` STRING on ~24 chapters, `--font-chalk` (Gaegu, used by "THE PLAN" + Blackboard), OverviewCard's word-highlight, AnswerPad. Live-drove one 12–14 (integers) + one 15–16 chapter after removal — flow intact, 0 errors.
>
> **⑤ PUBLIC-LAUNCH PLAN drafted → [docs/launch-plan.md](docs/launch-plan.md)** (product-lead). Phases 0 Harden → 1 Compliance/Trust → 2 GTM prep → 3 Soft launch → 4 Public → 5 Post-launch, every item with an owner + per-phase GO/NO-GO gates. **THE TWO HARD GATES:** (a) **no privacy policy / ToS / COPPA content exists anywhere in the repo** — for a public US kids' product that's the #1 blocker and an attorney's sign-off is the longest lead, so Phase 1 must run **in parallel with Phase 0, starting now**; (b) the **"6-week guarantee" must ship as a PROCESS PROMISE, not a proven-outcome stat**, until a real week-6 cohort number exists (FTC deceptive-claims risk). Founder-only items are called out per phase (external accounts/spend, dashboard toggles, legal sign-off, pricing/brand/taste). **7 open founder decisions** at the end of the plan — recommendations given: launch **free** (defer Stripe), **US-only** (defer GDPR-K/EU), launch the **most-polished band** (3–11 story, not the churny teen games), **no schools/FERPA** at launch, pick the brand (`mi2utor.com` vs "Milo"), and authorize spend early (attorney is the long pole).
>
> **▶ OPEN / NEXT:** (1) **Founder decisions in the launch plan** (the 7 above) — they gate Phases 1–2. (2) **Human signed-in invite tap-through on prod** (V12) — auth-gated, never headlessly verifiable; confirm the accepted invite **leaves the received list after a reload**, not just that the toast fired. (3) **Activate aceKid/strugglerKid**: needs a `reachPractice()` helper (past the auto-rolling intro + "I've got it →"/"Let's try →") + the mastery/reveal selectors; note **demotion is NOT DOM-observable** (tier hidden from learners) → prove it in the adaptive unit tests instead. (4) Phase 0 harden items I can do without founder accounts: the `milo-happy.png`/`milo-thinking.png` 404s, an independent security pass, the E2E coverage gap.
>
> **⚠️ LEARNED (carry forward):** **subagents cannot reliably load MCP tools via ToolSearch** — devops-release hit this trying to reach the Supabase MCP (no CLI/token either) and correctly reported the blocker instead of faking it. **Supabase-MCP work (migrations, SQL, advisors) must run from the MAIN session.** Also: a Supabase **dev branch bills ~$0.01344/hr** — this project is free-tier, so migrations go direct-to-prod with founder authorization (branch-first isn't available).

> 🔢 **2026-07-18 (LATEST — SHIPPED TO PROD: integers practice = tap-a-number-choice + clearer questions, sw v24→v25).** Partner feedback on the 12–14 **integers (WeatherStation, "BANK ACCOUNT")** chapter: practice questions were confusing (even for an adult) and dragging the meter to answer felt un-normal. Changes, all live (commit `7a52bf1`): **(1)** New shared **`AnswerPad`** ([gameKit.tsx](src/features/chapters/teen/games/parts/gameKit.tsx)) — the child answers by **tapping one of a few number choices** (correct + distractors, per-task `choices`, memoized in GameShell so they don't reshuffle per render). Gated by a new **`config.answerPad?: (t) => number[]`** ([GameShell.tsx](src/features/chapters/teen/games/parts/GameShell.tsx)); when set, the instrument is **never rendered in the practice loop** (no meter, no glide, no flash on solve). **(2)** Clearer questions — literal math badges (`6 + 7`, not the cryptic `6 ↓`), a `disp()` proper-minus formatter (was rendering `signed()`'s spoken "negative 5"), and a `BaseTask.showEquals` flag to drop the nonsensical `= ?` on compare/place tasks. Dropped the trivial "set the balance to −5" task (pointless when you can tap the answer). **(3)** Turned **`showSolve` OFF** for integers (nothing to "solve on the illustration" once the meter is gone) — flow is now walkthrough (I do) → guided tap-a-choice (we do) → scored tap-a-choice (you do). **Bank theme + the animated bank-vault walkthrough scene are KEPT** (partner: "keep bank theme everywhere"). The keypad was built then removed at partner request (tap-choices only). Verified live: tap grades correct, wrong answers reveal via the QuestionBoard, no meter anywhere in practice/guided, 0 console errors. `tsc` · **26/26 tests** · `next build` green. Prod smoke: home + `/auth` + `/teen-preview?c=integers` all 200. **NEXT:** `answerPad` is generic (any numeric-answer chapter can add it) — fan out to the other 12–14 chapters if the integers pilot lands well; also `showSolve` is now integers-off but still on for none (was integers-only) — decide per chapter.
>
> ⏱️ **2026-07-16 (SHIPPED TO PROD: "show me how" reveal-speed fix, sw v23→v24).** The show-me-how solve board was revealing words too fast in practice. Root cause: with **no voice on Chrome**, `speakWithHighlight` falls to a timed word sweep tuned to match *real speech duration* — with nothing to pace against, words flick by. Fix ([useMiloSpeaker.ts:453](src/infra/useMiloSpeaker.ts)): slow the sweep **2.1× only in the fully-silent case** (`autoFinish: true`); the Safari voice-plays-no-boundaries path keeps real-speech pacing (`slow = 1`) so the highlight stays synced. Verified live in practice — reveal now ~850ms/word (was ~406ms), first word at the ~1708ms grace-timer silent-sweep, 0 console errors. `tsc` clean · **26/26 tests** · `next build` green. **Commit `3064d9a` → `main` (FF) → Vercel prod serving v24; smoke home + `/auth` + `/teen-preview?c=integers` all 200.**
>
> 🚀 **2026-07-14 (SHIPPED TO PROD: the show-me-how pilot MERGED to `main` + three teen changes, sw v22→v23).** The `pilot/show-me-how-integers` branch was **merged into `main` and pushed → Vercel production** (`milo-story-mode.vercel.app`) at the founder's request — so **the whole "SHOW ME HOW" pilot (the 🎓 block below) is now LIVE on prod**, together with this session's three changes. `tsc` clean · **26/26 tests** · `next build` green · verified live in the local preview throughout. **DEPLOY CONFIRMED:** all four refs (local `main`, local `pilot`, `origin/main`, `origin/pilot`) sit on the same commit `347a1a3` (FF-merge, zero divergence); post-deploy prod smoke — `milo-story-mode.vercel.app` **serving `sw.js` v23**, home + `/auth` + `/teen-preview?c=equationsInequalities`/`exponentsRoots`/`rationalOps` all **200**. Files this session: [BalanceBench.tsx](src/features/chapters/teen/games/BalanceBench.tsx), [GearLab.tsx](src/features/chapters/teen/games/GearLab.tsx), [KitchenCounter.tsx](src/features/chapters/teen/games/KitchenCounter.tsx), [GameShell.tsx](src/features/chapters/teen/games/parts/GameShell.tsx), [gameKit.tsx](src/features/chapters/teen/games/parts/gameKit.tsx).
> **THREE CHANGES THIS SESSION:**
> • **① Deleted 34 orphaned lesson files** (`src/features/chapters/lessons/*Lesson.tsx` / `*TeenLesson.tsx`) — zero importers (the 3–11 story rebuild + 12–14 game rebuild left them behind), ~9.4k lines of dead code. `tsc` confirmed nothing referenced them. (The 34 REMAINING lessons in that dir are still live-imported by the 15–16/17–18 wrappers + a few 6–8 chapters — left in place.)
> • **② Letter-by-letter chalkboard reveal (voice-paced)** — both voice-paced boards (the intro **"THE PLAN"** panel + the **show-me-how solve board**) now write each just-spoken word on **letter-by-letter** with a chalk clip-sweep (`.mb-word-write`, `steps(wordLength)`), instead of fading the whole word in — SAME voice-driven index, so it stays in step with Milo. Shared per-word write-on in `ExplanationPanel.renderWords` (GameShell) + `Blackboard` word-mode (gameKit); reduced-motion snaps.
> • **③ Filled the 12–14 curriculum gaps** so every chapter covers what its name promises, all solve-on-illustration:
>   – **equations chapter (BalanceBench) — INEQUALITIES added** (was zero). New **`RayLine`** number-line instrument: solve the inequality, then shade the solution **ray** with an **open ○ (`< >`) / closed ● (`≤ ≥`) endpoint**; a **4-chip relation picker** (`< under · ≤ at most · ≥ at least · > over`). All four relations taught. Added a **dedicated inequality WALKTHROUGH** (second tutorial example + a `RayScene` number-line walkthrough scene + `TeachScene` wrapper that branches balance-scale vs number-line) so inequalities are TAUGHT before practice, incl. why the endpoint is filled vs hollow. Chapter value type is now `number | RaySol`. Shared `RayViz` renders the ray for both the instrument and the walkthrough. Mixed into tiers 2–3 with the equations.
>   – **exponents chapter (GearLab) — SCIENTIFIC NOTATION added.** `a × 10ᵏ` solved on the crank: start at the coefficient `a` (new `coef` field → CrankGear `floor`/initial), crank ×10 k times (5→50→500). Tiers 2–3.
>   – **fraction/decimal chapter (KitchenCounter) — DECIMAL DIVISION added.** `1.5 ÷ 0.3` reuses the existing "how many pieces fit" `PieceTape` (decimal labels). Tier 3.
> **VERIFIED LIVE** (`/teen-preview?c=…`, driven via `javascript_tool`): letter reveal on both boards (`steps(3)`/`steps(4)` per word); inequalities render + grade (inclusive AND strict — `x < 4` shows a hollow open circle at 4, shaded 0–3, graded correct; wrong→reveal glides to the correct ray); the inequality walkthrough scene plays (shaded ray, filled dot, `● filled — the edge is allowed`, contrasts `○ x < 4`); scientific notation crank starts at the coefficient; decimal division grades correct. 0 real console errors (a persistent parse error seen during verification was proven STALE — its line numbers pointed at the pre-edit file; a fresh browser tab read zero logs; the dev server was restarted).
> **OPEN / NEXT:** (1) **human signed-in tap-through on live prod** of the merged pilot + the three changes (the signed-in progress-saving path can't be verified headlessly). (2) The show-me-how `showSolve`+`coach` is still integers-only — **fan out to the other 12–14 chapters** when wanted (the letter-reveal + new question types are all in the shared shell, so they inherit automatically). (3) Optional: strict `< >` currently use the same integer boundary with an open dot (no separate walkthrough for `>`); inequalities appear in tiers 2–3 only.
>
> 🎓 **2026-07-14 ("SHOW ME HOW" IN PRACTICE, integers pilot — NOW MERGED TO PROD, see the 🚀 block above).** New capability: in the 12–14 practice loop, the child can be **shown how to solve the actual question**. Built once in the shared `GameShell` behind a `showSolve` config flag and enabled ONLY on **integers (WeatherStation / "BANK ACCOUNT")** as the pilot. `tsc` clean · **26/26 tests** · 0 console errors · verified live in the local preview throughout. **Branch `pilot/show-me-how-integers`** (HEAD `91dd4e7`), pushed to GitHub; a Vercel **preview** deploy exists (branch-alias `milo-story-mode-git-pilot-show-m-b7a358-kuwari84-2322s-projects.vercel.app`, needs a `_vercel_share` bypass token or Vercel login — preview protection is on). **Production is UNTOUCHED.** Files: [GameShell.tsx](src/features/chapters/teen/games/parts/GameShell.tsx), [gameKit.tsx](src/features/chapters/teen/games/parts/gameKit.tsx), [WeatherStation.tsx](src/features/chapters/teen/games/WeatherStation.tsx), [globals.css](src/app/globals.css).
> **WHAT IT DOES (all partner-directed, iterated live this session):**
> • **Mandatory first + on-demand after** — the FIRST practice question is worked out automatically; every question after carries a quiet **"Show me how ▸"** button. A shown question is **un-scored** (no `ada.record`, no correct/wrong; it just advances) — partner: "don't count it in the adaptive system."
> • **Guided round REMOVED for showSolve chapters** — the old "we do / Try this one with me" round asked the kid to solve before being shown how (confusing); now it goes walkthrough → practice, and the mandatory first-show is the bridge. (`afterDemo` skips guided when `showSolve`; `finishDemo` holds the "Your turn" line.)
> • **Solve on the illustration** — the instrument GLIDES to the answer while the steps narrate (`config.glide` reused).
> • **Physical control pointer (proper how-to-use tutorial)** — an animated 👆 sits ON the control and acts out the gesture: it drags the meter ('move'), then TAPS the RECORD/commit button ('commit'), which lights gold. New `InstrumentProps.coach` ('move'|'commit'), `CoachPointer` + `highlight` on `CommitBtn`/`Nudge` in gameKit; VThermo implements it. Optional `config.solveHand`(dropped later)/`solveCommitLabel` (WeatherStation: "RECORD ✓"). Animation speeds were slowed on partner feedback (tap ~1.9s, drag ~3.2s, pulse ~1.9s).
> • **Chalkboard look** — new **chalk handwriting font (Gaegu)** via `--font-chalk` (globals.css `@import` + teen `[data-band]` var). Applied to the "SOLVING IT, STEP BY STEP" solve board + the intro "THE PLAN" panel; **crisp font kept** for the live question board + instrument readouts (partner: "crisp where required, otherwise chalk"). Solve board uses a segmented `steps()` chalk write-on.
> • **Word-by-word narration synced to voice (BOTH boards)** — Milo now speaks **exactly the board text** (not a separate `say` summary), and **each word appears as he says it**, driven by `speakWithHighlight` `onWord` (real word boundaries, or its own word-duration sweep when audio is blocked). ExplanationPanel got a `wordReveal` prop + a `nodeText` ReactNode→string flattener; Blackboard got a `saidWords` word-reveal mode (tokenised via whitespace to line up with `splitWords`).
> **TWO REAL BUGS FIXED:** (1) a fixed 300ms/word fallback timer **raced ahead of the slower voice** → removed it; the reveal is now driven solely by `onWord` (voice-paced). (2) The auto-shown first question stayed blank: `loadTask`'s `speakAfterCurrent(t.say)` scheduled an **untracked** late utterance that cancelled the show narration → now skipped for the auto-shown first question (`showSolve && nextIdx === 0`).
> **HOW IT'S BUILT (matters for fan-out):** the control-spotlight lives IN the instrument via the optional `coach` prop, so it generalizes — VThermo implements it now; other instruments (SlideValue, PaintGrid, BalanceBeam, ElevatorShaft, …) each need the same `coach` handling when fanned out. The show/word-reveal/chalk plumbing is all in shared GameShell/gameKit, gated by `config.showSolve` — other chapters are unaffected until enabled.
> **▶ NEXT / open:** (1) **FAN OUT** `showSolve: true` + per-instrument `coach` to the other 12–14 chapters (partner sign-off on the integers pilot first). (2) **Voice/symbol polish (flagged, not done):** since Milo now reads the board verbatim, TTS pronounces symbols as written — "$4" reads fine, but "4 − 7" may read oddly; could feed speech a spoken-out string while keeping the display, but that desyncs the 1:1 word highlight — decide per-taste. (3) The pilot's auto-shown first question **consumes one of the 8 question slots** (un-scored); partner could opt to have show-how NOT eat a slot (re-ask fresh) — quick tweak. (4) **MERGE**: when approved, merge `pilot/show-me-how-integers` → `main` (bump `public/sw.js` version + deploy) — right now it is branch-only. **Verify recipe:** `/teen-preview?c=integers`; drive via `javascript_tool` (ref clicks miss on narrow preview) — Open the ledger → wait ~10s (intro auto-rolls) → "I've got it →" to skip walkthrough → "Let's try →" → practice (mandatory show fires on Q1; "Show me how ▸" on later Qs).
>
> 🚀 **2026-07-14 (SHIPPED TO PROD) — AUDIT FINISHED + THE WHOLE UNCOMMITTED STACK LANDED: `68825cb` → GitHub `main` → Vercel prod LIVE (sw v21→v22).** `tsc` clean · **26/26 tests** · `next build` green · 0 console errors, all verified live. Post-deploy smoke: prod `sw.js` serving **v22**, home + `/teen-preview?c=geometryMeasurement`/`percentages` all **200**. **One commit `68825cb` bundled EVERY previously-uncommitted batch** (this session's audit finish + the 07-13 solve-on-illustration rebuilds + the 07-13 money/debt "MONEY LAB" + the 07-12 mentor-audit) — the files overlap across batches (BuildSite/gameKit in several), so a clean per-batch split wasn't possible; shipped as one well-described commit. **⇒ every "UNCOMMITTED" note in the blocks below is now SUPERSEDED — it's all live.** Excluded from the commit (repo convention, left untracked local): `labs-demo/`, `docs/{teen-12-14-math-audit,teen-explainer-video-plan,ui-visual-design-brief}.md`.
> **This session closed out the two open TO-DOs from the 🧩 block below:**
> **① geometryMeasurement — triangle-area RESTORED (partner approved "build fold-in-half") — [BuildSite.tsx](src/features/chapters/teen/games/BuildSite.tsx).** The ½·b·h task was dropped because a right triangle can't be tiled into whole squares. New honest mechanic (`kind:'tri'`, `RoofFold`): the child tiles the full **b×h rectangle** (honest count, e.g. 24), then taps **"Fold in half ▽"** → the roof triangle (12 mint cells, a clean staircase below the diagonal) lights up and the count collapses 24→12. The ½ is **PERFORMED (fold), not computed** — and it teaches WHY area = ½·b·h. Dims vetted (`[4,3][6,4][8,3][4,5][3,4][5,4]`) so the diagonal splits cells exactly 50/50. Slotted into d2+d3. Verified live (8×3→12, folds, grades, advances).
> **② FINISH THE AUDIT — the 3 PARTIAL fails rebuilt (each a NEW in-file instrument, no shared-code touched):**
> • **exponentsRoots — [GearLab.tsx](src/features/chapters/teen/games/GearLab.tsx):** `rootSlide` (dialed √n on a 0–12 slider) → **`RootPatch`** (`mech:'root'`): the child BUILDS a square out of the n tiles — set the side, the patch shows side² vs n as **too few / too many / fits ✓**, so the side that uses every tile IS the root. Verified live (√9→side 3, √36 next).
> • **rationalOps — [KitchenCounter.tsx](src/features/chapters/teen/games/KitchenCounter.tsx):** BOTH dialing tasks fixed. `decMul` (dialed 0.2 on a slider) → **`DecimalArea`** (`mech:'area'`): a 10×10 metre grid — shade `a` across & `b` down, the **overlap** squares are a×b (÷100). `fracDiv` (dialed the count) → **`PieceTape`** (`mech:'pieces'`): lay ¼-type pieces along the board and count how many fit (overshoot flagged). Both verified live (0.4×0.5→0.2; ¾÷¼→3 pieces).
> • **percentages — [StoreCheckout.tsx](src/features/chapters/teen/games/StoreCheckout.tsx):** all money-slide tasks (dialed the $ answer) → **`PriceGrid`** (`mech:'price'`): the 100-grid IS the price; the child shades the given percent and the grid computes the dollars — sale = price−shaded, saving/tip = shaded, tax = price+shaded. `slideReverse` (÷, can't shade) was DROPPED from the rotation. All 3 modes verified live (25% tax $40→$50, 15% tip $40→$6, 25% off $40→$30). **Tutorial note:** the walkthrough still teaches "25% = ¼ of the grid" (ex1) + the price-tag drop (ex2) — same method, mild representation diff from the scored grid; acceptable, flag if partner wants ex2 rebuilt on the grid.
> **THE 2 "BORDERLINE" — assessed, decisions surfaced (NOT rebuilt):**
> • **integers (WeatherStation) — LEAVE (genuinely fine).** It's a signed number line; placing/moving values on the meter IS the integer concept, and `afterChange` performs the op by moving the meter down. Not a compute-then-dial.
> • **equationsInequalities (BalanceBench) — PARTNER DECIDED: KEEP AS-IS (2026-07-14).** The shared `BalanceBeam` ([gameKit.tsx](src/features/chapters/teen/games/parts/gameKit.tsx):464) **deliberately stays LEVEL while the child sets x** (shows the expression `2x`, not its value) — "so they must actually solve for x, not just wiggle." Two alternatives were weighed with the partner: **(a) live tilt feedback** (beam reacts as you dial) — REJECTED because it turns solving into a hot/cold guessing game (the kid nudges until level without reasoning, and is told they're wrong before committing); **(b) a bespoke "do the same to both sides" manipulative** (remove weights from both pans / split into equal groups → x falls out) — the genuinely-correct solve-on-illustration for equations, but more work. **Partner chose to LEAVE IT AS-IS** — the current compute-x-then-Weigh honestly makes the child solve it themselves first (no answer revealed before commit). Option (b) remains available if revisited later. (Also curriculum: still zero inequalities — a separate audit item.)
> **STATUS: SHIPPED** (`68825cb` on `main`, Vercel prod live, sw v22). Files this session: `BuildSite.tsx`, `GearLab.tsx`, `KitchenCounter.tsx`, `StoreCheckout.tsx`. Verify method: temp-surface the new task at tier-1, drive via `javascript_tool` (ref clicks miss on the narrow preview), revert. **The solve-on-illustration audit is now COMPLETE across all twelve 12–14 chapters** (equations kept as-is by partner decision; integers is a fine number line). **NEXT / open (optional):** (1) a human **signed-in tap-through on live prod** of the 4 rebuilt chapters — I drove them end-to-end in the local preview but the signed-in progress-saving path can't be verified headlessly; (2) if wanted later, rebuild StoreCheckout's tutorial ex2 on the price grid (currently a price-tag drop — same method, mild representation diff); (3) equations option (b) "do the same to both sides" manipulative + inequalities coverage remain available if revisited.
>
> 🧩 **2026-07-13 (UNCOMMITTED) — "SOLVE ON THE ILLUSTRATION" REBUILD: 3 clear-fail 12–14 chapters rebuilt so the illustration itself SOLVES the problem (no dialing an answer worked out in the head).** `tsc` clean · **26/26 tests** · `next build` green · 0 console errors. Stacks on the money/debt + 07-12 batches (all still uncommitted — keep distinct when committing).
> **WHY:** partner restated the core rule as a UNIVERSAL bar — *"whatever illustrations we use, they should be able to use to explain the problem AND solve it; the user shouldn't have to solve outside the platform."* I audited all twelve 12–14 chapters against it. **Clear fails (child computes in head, dials a slider):** orderOfOperations, algebraicExpressions, geometryMeasurement. **Partial (some task types dial):** rationalOps (decimals), exponentsRoots (roots), percentages (price). **Borderline:** integers, equationsInequalities. **Already pass:** signedRationalOps (money), ratioProportion, coordinatePlane, linearRelationships. Partner chose **"rebuild all 3 clear fails now"** — done this session.
> **SHARED ENGINE (additive, in [gameKit.tsx](src/features/chapters/teen/games/parts/gameKit.tsx)):** an expression engine — `ETok`, `parseExpr`, `evaluable`, `collapseAt`, `correctNextIndex`, `ExprChips` — the child TAPS an operation to work it out and the chips COLLAPSE (3 × 4 → 12) until one number is left = the answer. Pure, touches no existing export.
> **① orderOfOperations — [ScoreMachine.tsx](src/features/chapters/teen/games/ScoreMachine.tsx) (Event Budget):** rebuilt as tap-to-collapse (`BudgetSlip`/`BudgetScene`, V=`ETok[]`). Precedence is TAUGHT by the mechanic — a `×` inside brackets can't fire until the bracket collapses (forces brackets-first); tapping `+` before `×` faithfully computes the WRONG total (mistake is visible) → reveal auto-collapses in the correct order. Verified: guided `1+2×3→7`, scored `12÷2+3→9`, wrong-order `3+2×5→25` then reveal→13.
> **② algebraicExpressions — [FunctionFactory.tsx](src/features/chapters/teen/games/FunctionFactory.tsx) (Taxi Meter):** branches by `task.mode` (V=`{toks,x,count}`). **eval** = drop x in (substitute) → tap-collapse `3×4+2`→14. **solve/find-x** = dial the ride distance; the meter computes the fare live (`3×4−2=10`) with too-low/too-high feedback; find the x that hits the target. **combine** = gather the x-tiles (`6x − 2x`: 6 gold + 2 struck) into one rate → count. All 3 driven live + graded (temp-surfaced solve/combine at tier-1 to test, then reverted).
> **③ geometryMeasurement — [BuildSite.tsx](src/features/chapters/teen/games/BuildSite.tsx) (Room Reno):** branches by `task.kind` (V=`{fill,side}`). **area** = drag-tile the floor, count. **perimeter** = tap the border segments (skirting), count. **circle (in π)** = tile the r×r square on the radius / lay the 2r diameter strip. **volume** = fill h layers of cubes. **Pythagoras (hyp + missingLeg)** = BUILD THE SQUARE on the sloped side (set side n; n² must match a²+b² or hyp²−leg²) → n is the answer. All driven live + graded. **⚠️ DROPPED the ½·b·h TRIANGLE-area task** — a right triangle can't be tiled into a whole-number count of unit squares, so it can't be honestly solved-on-the-illustration; its slot is now more tile-countable area/perimeter. **FLAG to partner:** confirm OK to drop triangle-area, or it needs a bespoke illustration.
> **🐛 SHARED BUG FIXED (affects every chapter) — [GameShell.tsx](src/features/chapters/teen/games/parts/GameShell.tsx) `loadTask`:** a wrong-answer reveal/glide schedules `setValue` frames via `later`; those weren't cancelled when the next question loaded, so a stale glide value (e.g. `13`) bled onto the NEXT question's fresh instrument. Fix: `loadTask` now clears `timers.current` before loading. Caught + fixed live in ScoreMachine.
> **NOT DONE (per the audit):** the 3 PARTIAL fails (rationalOps decimals, exponentsRoots roots, percentages price) + the 2 borderline (integers thermometer, equationsInequalities balance) still let some task types dial — not in this pass's scope ("3 clear fails").
> **STATUS: UNCOMMITTED**, `tsc` + 26/26 + `next build` green. Files: `gameKit.tsx` (+engine), `GameShell.tsx` (timer fix), `ScoreMachine.tsx`, `FunctionFactory.tsx`, `BuildSite.tsx`. Verify method reused: temp-surface a chapter's harder task-kinds at tier-1, drive each, revert. **Preview quirk:** on the narrow preview viewport ref-based `computer` clicks miss — drive via `javascript_tool` (`.click()` for buttons; `dispatchEvent(new PointerEvent('pointerdown'))` for the tile/segment cells).
> **▶ OPEN — decisions needed / next up (this session's TO-DOs):**
> 1. **CONFIRM: OK to drop the ½·b·h triangle-area task?** It was removed from geometryMeasurement because a right triangle can't be tiled into a whole-number count of unit squares (can't be honestly solved-on-the-illustration); its slot is now more area/perimeter. If the partner wants triangle-area kept, it needs a **bespoke illustration** (e.g. tile the b×h rectangle, then fold/halve along the diagonal).
> 2. **FINISH THE AUDIT — rebuild the remaining "dial-the-answer" chapters.** Only the 3 clear fails were done this pass. Still letting some task types dial: **PARTIAL** — rationalOps (decimals), exponentsRoots (roots), percentages (price side); **BORDERLINE** — integers (thermometer), equationsInequalities (balance beam). Decide whether to take these on next; the shared `ExprChips`/tile-and-count patterns from this session are reusable.
> 3. **(carried) Name the money chapter** — signedRationalOps currently titled **"MONEY LAB"** (my pick); confirm or rename (partner suggested a wallet/cashier/till angle).
>
> ✅ **2026-07-13 (UPDATED — SUPERSEDES THE IN-PROGRESS BLOCK BELOW) — signedRationalOps IS NOW FULLY MONEY / DEBT ("MONEY LAB"); THE SKY-TOWER ELEVATOR IS DROPPED. UNCOMMITTED.** `tsc` clean · **26/26 tests** · 0 console errors. File: [`src/features/chapters/teen/games/SkyTower.tsx`](src/features/chapters/teen/games/SkyTower.tsx) (file/export still `SkyTower`; display title is now **MONEY LAB** — rename the file later).
> **Completed the partner directive — the whole chapter runs on ONE money/debt illustration:** (1) **+/− & chain converted off the elevator onto a net-worth METER** (new in-file `WorthBoard` + interactive `WorthLoader` + walkthrough `WorthScene`): worth on a vertical meter, **green above $0 = money, red below = debt**; money **in (+)** slides worth up, **out (−)** slides it down, PAST ZERO into the red. `addSub`/`chain` are now `op:'add'`; value `SV {worth, groups, dir}` (`floor`→`worth`); grade `v.worth === answer`; solve = drag/nudge the meter from the start to where the cash lands. (2) **×/÷ unchanged** (`MoneyBoard`/`MoneyLoader`/`MoneyScene` kept — coin/IOU cards, action = add/take-away, worth = answer). (3) **Re-themed off "Sky Tower"** → title **MONEY LAB**, motif 💰, ticketLabel "money log", all copy/overview/start-card money-framed; the walkthrough is now 3 money examples [add `2−5→−$3` on the meter · mul `−5×−2→+$10` · div `−18÷−6→3`]; guided = `−3 + 5` on the meter. (4) **Elevator dead code removed** from SkyTower.tsx (`SkyTowerScene`, `ElevatorShaft` usage, `F`/`MIN`/`MAX`/`TOP_FLOOR`/`SCENE_FLOORS`, `tower_*` asset refs, the whole `motion/react` import).
> **VERIFIED LIVE** (`/teen-preview?c=signedRationalOps`, dev `milo-dev` :3017, desktop): MONEY LAB start card + intro (worth meter poses at $2) + the add walkthrough (`2−5`: meter drops past $0 into the red, "In the red — you owe $1") + the mul walkthrough (`−5×−2`: five $2 IOUs struck through, worth climbs to **+$10**, "Take away debt → worth goes UP") + the div walkthrough (`−18÷−6`: three $6 IOUs added, target −$18 hit, answer **3**). Drove **guided `−3+5→$2`** (correct) + **5 scored questions** incl. into-debt (`5−8→−3`, `2−9→−7`) and start-in-debt (`−2−3→−5`, `−3+5→2`) — all graded correct, advanced, **0 console errors**. `tsc` clean, `npm test` **26/26**.
> **KEEP:** shared `ElevatorShaft` stays in gameKit (still used by the 15–16 `Leaderboard.tsx` / signedNumberFluency — do NOT remove it). The unreferenced `public/assets/teen/objects/tower_{shaft_bg,lift_car}.png` files remain on disk (harmless; delete for tidiness later). File/export rename `SkyTower`→`MoneyLab` deferred (wrapper imports the default export, so title-only was enough). **NEXT:** commit this money/debt change (bump `public/sw.js` v20→v21 + deploy) — the **07-12 mentor-audit batch below is a SEPARATE uncommitted change set, keep them distinct when committing.**
>
> 💰 **2026-07-13 (ORIGINAL IN-PROGRESS NOTES — now completed by the ✅ block above) — "SIGNED NUMBERS & OPERATIONS" CHAPTER: SWITCH THE WHOLE CHAPTER TO A MONEY / DEBT MODEL AND DROP THE SKY-TOWER ELEVATOR THEME.**
> **DECISION (partner-approved — this is the direction to continue in the new session):** the chapter's illustration model is now **money / debt**, replacing "Sky Tower". `tsc` clean · **26/26 tests**. File: [`src/features/chapters/teen/games/SkyTower.tsx`](src/features/chapters/teen/games/SkyTower.tsx) (still named SkyTower — rename/retheme later).
> **WHY:** partner said the elevator works for +/− but **cannot explain signed × and ÷** — you can't "ride" your way to why −6 × −3 = 18, so the child ends up computing the answer in their head and just dialling the car there ("solving outside the platform"). His rule: **the illustration itself must both EXPLAIN the problem AND be how you SOLVE it — everything explainable via the illustration, nothing worked out off-platform.** He explicitly wanted **different illustrations for × and ÷**, and (this session) said **go all-in on money/debt instead of Sky Tower.**
> **THE MONEY / DEBT MODEL (makes the SIGN something you DO and SEE, never a rule):** a gold **coin** = money (+), a red **IOU** = debt (−). Two ideas do all the work — the **second number** says what each card IS (`+3` → a $3 coin, `−3` → a $3 IOU); the **first number** is the **ACTION** (`+` → ADD the cards, `−` → TAKE them away). Your **net worth** (on a meter that turns green/red) is the answer. **`−5 × −2`: take away five $2 IOUs → worth climbs to +$10** — *take away debt and you get richer* = why two negatives make a positive, SEEN not recalled. **÷ = reach a target worth:** add / take away $b cards until worth = a; the **signed count** (add + / take −) is the quotient (`−18 ÷ −6`: add three $6 IOUs to reach −$18 → +3).
> **DONE THIS SESSION (uncommitted, all in SkyTower.tsx):** ×/÷ rebuilt as an in-file **`MoneyBoard`** (shared illustration: worth meter + coin/IOU cards + the plain-word sign sentence e.g. *"Take away money → worth goes DOWN"*) + **`MoneyLoader`** (interactive: set # of cards, choose **＋ Add / － Take away**, GO) + **`MoneyScene`** (walkthrough). Branched by `task.op` (like CableCar branches `kind`). Value type `SV {floor, groups, dir}` where **`dir` = the action** (+1 add / −1 take / 0 unset); grade — mul `dir·groups·b === answer`, div `dir·groups === answer`. Tutorial is a 3-example array **[ride 2−5 (elevator), mul −5×−2 (money), div −18÷−6 (money)]**; guided = mul −2×3. **Elevator (ElevatorShaft + SkyTowerScene) is STILL used for +/− and chain** — see the directive below. **Live-verified:** guided `−2 × 3` → add 2 coins → **take away** → **−$6** in red, meter drops, sentence *"Take away money → worth goes DOWN"*, grades correct, advances; rides still work + branch correctly; MoneyBoard renders clean (was the fix for the earlier cluttered "up/down floors" version the partner disliked).
> **⚠️ THE DIRECTIVE FOR THE NEW SESSION — go fully money/debt, drop Sky Tower:** right now the chapter is a HYBRID (elevator for +/−, money for ×/÷). The partner wants the **whole chapter on one coherent money/debt model.** Next steps: **(1)** convert **+/− and chain** (`addSub`/`chain`, currently the `ElevatorShaft`/`SkyTowerScene` ride path) to the same money model — addition = deposit / receive a card, subtraction = a withdrawal / take-away — so the worth meter carries every operation; **(2) re-theme** the chapter off "Sky Tower"/"tower lift" (title, `start.blurb`, `overview`, `ticketLabel`, motif 🏢, all ride narration) to a money theme; **pick a name distinct from the 12–14 `integers` chapter, which is already "Bank Account" (WeatherStation)** — e.g. a wallet / cashier / shop-till angle; **(3)** then delete the now-dead elevator code (`ElevatorShaft` usage here, `SkyTowerScene`, `F()` floor helper, `MIN/MAX`, `tower_*` assets refs) once +/− is money.
> **NOT YET VERIFIED (do first in the new session):** the **two-negatives case live in practice** (`−5×−2` / `−6×−3` → *take away debt → +*) — I was mid-promotion (answering rides to reach a ×/÷ at tier 2) when stopped, so only the *different-signs* guided `−2×3` was driven end-to-end; **division live after the money rewrite** (grade logic unchanged from a prior verified version, but not re-driven); the **mul/div walkthrough scenes** mid-playback (same `MoneyBoard` component as the verified interactive one → low risk). Preview: `/teen-preview?c=signedRationalOps` (dev `milo-dev` port 3017); skip the walkthrough with "I've got it →" to reach the guided multiply fast.
> **STATUS: uncommitted, `tsc` + 26/26 green.** Do NOT commit until +/− is also money and the chapter is re-themed. (The 07-12 mentor-audit batch below is a SEPARATE uncommitted change set — keep them distinct when committing.)
>
> 🔬 **2026-07-12 — 12–14 BAND: FULL MENTOR AUDIT → LIVE-GAME CORRECTNESS + STRUCTURE + COVERAGE FIXES + QUESTION-CLARITY ROLLOUT TO ALL 12 CHAPTERS (ALL UNCOMMITTED, stacks on the 07-10 SkyTower pilot below).** `tsc` clean · **26/26 tests** throughout. Ran the **`milo-math-mentor`** skill to audit every 12–14 chapter, then fixed what it found.
> **⚠️ THE LOAD-BEARING DISCOVERY:** the twelve `src/features/chapters/lessons/*TeenLesson.tsx` `makeRound` generators are **ORPHANED for the live 12–14 path** — every `game/*Chapter.tsx` wrapper renders ONLY its GameShell game (WeatherStation·SkyTower·KitchenCounter·JuiceBar·StoreCheckout·GearLab·ScoreMachine·FunctionFactory·BalanceBench·NightFlight·CableCar·BuildSite), and each game **defines its own tasks** (no game imports a lesson; `grep` confirms **zero live references** to any 12–14 `*TeenLesson`). So the first audit-fix pass (ratio reteach dividing by wrong gcd, circle-π tolerance ±0.05, exponent MCQ collisions, order-of-ops dup options, rationalOps improper "2/2", linearRel b=0) all landed on the **orphaned lessons** — those edits are harmless/valid but **do not reach the child**. The live games were then re-audited fresh.
> **CORRECTNESS PASS ON THE LIVE GAMES — 2 real defects fixed:** (1) **[FunctionFactory.tsx](src/features/chapters/teen/games/FunctionFactory.tsx) (algebraicExpressions) false arithmetic in the reteach** — `rule.replace(/x/g, x)` made `"2x"` at x=3 render **"23 + 1 = 7"**; fixed to substitute `(x)` → `"2(3) + 1 = 7"` (true for every rule). (2) **[JuiceBar.tsx](src/features/chapters/teen/games/JuiceBar.tsx) (ratioProportion) tiers 2 & 3 were byte-identical** → gave each generator a `hard` seed pool (bigger totals to the 12-scoop cap, non-unit per-part) and routed tier 3 to them (all part counts stay integer ≤ 12). The lesson bug-classes mostly **do NOT recur live** (BuildSite had no circle task at all; JuiceBar has no simplify-ratio reteach; GearLab/ScoreMachine have no MCQ; KitchenCounter no improper fractions; BalanceBench all-integer solutions).
> **STRUCTURE / TIER FIXES (live games):** • **[WeatherStation.tsx](src/features/chapters/teen/games/WeatherStation.tsx)** `colder` — debt/overdraft framing now conditional on the answer actually being `< 0` (was "Deeper debt" even for two positive balances). • **[NightFlight.tsx](src/features/chapters/teen/games/NightFlight.tsx) (coordinatePlane)** L1≈L2 fixed — L1 now **strictly first-quadrant**, L2 introduces negatives **+ a new `translate()` task** (apply a move → new demand on the same tap-the-map tool), L3 unchanged (reflect/midpoint). • **[BuildSite.tsx](src/features/chapters/teen/games/BuildSite.tsx) (geometryMeasurement)** L3⊂L2 fixed — restructured to **L1 area/perimeter · L2 circles + volume · L3 Pythagoras (hypotenuse + new `missingLeg`) + triangle** (no generator shared L2↔L3).
> **COVERAGE GAP CLOSED — circles in BuildSite:** the chapter had NO circle task. Added **`circleArea`/`circleCircumference` answered IN TERMS OF π** (area = r²·π → dial `r²`; circumference = d·π → dial `d`). The coefficient is an exact integer, so it fits the step-1 slider and grades exactly — **structurally cannot reproduce the lesson's π-tolerance wrong-mark** (no π decimal to round). Added optional `suffix?` to the Task + revealText shows "25π".
> **KEYSTONE `linearRelationships` (CableCar) REBUILT** (its `makeRound` was the orphaned one; the live game was one task at 3 number-sizes): tiers are now **distinct linear ideas** — **L1 pure rate `y = mx`** (empty tank) · **L2 `y = mx + b`** · **L3 read-a-graph + drain (negative rate) + find-the-start**. Founder-approved a **non-dial TAP surface** for the two missing ramp demands: **`isFn`** (is-this-a-function via a sensor-log table + Steady/Glitch tap) and **`readGraph`** (a drawn line → tap the matching equation), both rendered by a new in-file `TapChoices`/`MiniLineGraph`/`ReadingsTable` + branched `Instrument`/`grade`. Verified live end-to-end (both isFn paths + dial tasks grade, 0 errors).
> **QUESTION-CLARITY 3-ZONE ROLLOUT — now on ALL 12 chapters** (SkyTower was the 07-10 pilot; this did the other 11). Added optional `context` (plain story line, no math/no tool verbs) + `instruction` (verb-led action chip) to every scored task; math stays the hero in `badge`. Clarity rule #2 (omit `context` on bare math) applied: GearLab exponent-laws/ScoreMachine/FunctionFactory-combine/KitchenCounter-decimal-×/StoreCheckout-conversion get instruction-only. Built by **10 parallel per-chapter subagents** (WeatherStation·KitchenCounter·JuiceBar·StoreCheckout·GearLab·ScoreMachine·FunctionFactory·BalanceBench·NightFlight·BuildSite) + **CableCar dial tasks by hand**. Plumbing already existed (GameShell passes `task.context`/`instruction` → `QuestionBoard` 3-zone render, proven live earlier via CableCar's isFn). Additive-only (no answer/work/say/badge/number touched — tsc + tests corroborate); grep-reviewed every `context:` line (clean plain-language, no operators/verbs).
> **GRAPH EDGE FIX (this DOES affect the diagnostic):** `m.exponentsRoots ← ⇑i.decimals` added in **both** [docs/skill-graph.md](docs/skill-graph.md) AND [src/core/skillGraph.ts](src/core/skillGraph.ts) — spine 6 claimed the edge but the node table dropped it, so a scientific-notation gap could never trace down to place value.
> **VERIFICATION:** every changed generator got a **headless invariant test** (temp files, all removed after passing — reteach equations evaluate to the answer; circle answers integer ≤60 w/ π suffix; missingLeg genuine triples; L2/L3 disjoint; translate in-grid; isFn matches the vertical-line test; readGraph 4 distinct choices) + live browser drives (CableCar isFn/readGraph, BuildSite driven L1→L3 incl. the new missingLeg grading, several load-checks) — **0 console errors** throughout.
> **NOT committed / NOT deployed.** **NEXT:** commit the whole uncommitted batch (this session + the 07-10 SkyTower teaching-screen changes) — bump `public/sw.js` v20→v21 + deploy. The orphaned `*TeenLesson.tsx` files can be deleted for tidiness (dead code). Optional: human tap-through of the 10 agent-edited clarity chapters on prod. **Still-open flags from 07-10:** the removed word-by-word karaoke read-along was a founder-built feature (confirm OK dropped).
>
> 🧑‍🏫 **2026-07-10 (EARLIER) — QUESTION-CLARITY SPEC + SKY TOWER PILOT WIRED (NOT committed/deployed).** Partner feedback: the chalkboard questions read as confusing — the question, the instruction, and the "solve" are jumbled, and illustrations don't visibly track the problem. **Root cause:** every task is a single prose `prompt` that crams three jobs together (math + story + UI action, e.g. *"The lift is on floor 1. It goes down 3 floors. Move the car to where it stops, then press GO ✓."*), and each chapter phrased it differently. **Deliverable 1 — a before/after design spec** (Artifact, private): the fix = the board renders **three fixed zones** everywhere — a short **context** line (story, no math/UI), the **math** as the hero, and one **instruction** chip (the action) — plus copy-writing rules and the "solve = one idea per step, matched to the illustration" rule. Artifact URL: `https://claude.ai/code/artifact/a8e88c85-0908-42f1-b37b-4ae0c8f56ee1` (source at `scratchpad/question-clarity-spec.html`). **Deliverable 2 — Sky Tower pilot wired for real:** added optional `context?`/`instruction?` to `BaseTask` ([GameShell.tsx](src/features/chapters/teen/games/parts/GameShell.tsx)); `QuestionBoard` ([gameKit.tsx](src/features/chapters/teen/games/parts/gameKit.tsx)) now renders the 3 zones when either is set (**fully backward-compatible** — the other 11 chapters set neither → identical old `prompt` render); instruction chip shows only while asking (hidden on reveal/solved). Rewrote all [SkyTower.tsx](src/features/chapters/teen/games/SkyTower.tsx) tasks: `addSub`/`chain` get a context story + action chip; `mul`/`div` omit context (no real story — clarity rule #2) → math + chip only; removed UI verbs from the math line. Also tightened the walkthrough **solve** to exactly **4 clean board lines** ending on the answer (Start on floor 2 → Going down 5 means subtract → Count past the ground: 1,0,−1,−2,−3 → 2 − 5 = −3; intermediate floors leave `board` undefined so nothing clutters — only last `BOARD_WINDOW=4` show). **Verified live** (`/teen-preview?c=signedRationalOps`, desktop): guided + practice boards render the 3 zones cleanly (screenshot-confirmed), generated `addSub` task shows its own context, instruction chip hides on reveal (answer shows in coral), solve board reads clean. `tsc` clean · **26/26 tests** · 0 console errors.
> **Deliverable 3 — the TEACHING screen too (partner's actual pain).** Partner's screenshot showed the confusion was on the **walkthrough/teaching screen** (not the practice board): three chalkboards at once — (a) the LEFT "HERE'S THE PLAN" explanation was a **wall of text** (bold problem + the whole spoken paragraph dumped as a word-by-word read-along), (b) the solve board above the illustration was a **centred pile of lines**, (c) the illustration felt disconnected. Fixed the two SHARED teaching components (all 24 teen chapters inherit — all have `overview.points`; `Blackboard` has a single call site): **(1) `ExplanationPanel`** ([GameShell.tsx](src/features/chapters/teen/games/parts/GameShell.tsx)) → concise: eyebrow "THE PLAN" + the `problem` as a one-line question + `overview.points` as short scannable **bullets**; DROPPED the long `say` read-along text (Milo still SPEAKS `say` — audio unchanged, `onDone` still auto-rolls intro→walkthrough; **the word-by-word karaoke highlight is gone** — clarity-over-karaoke tradeoff, flag to founder). **(2) `Blackboard`** ([gameKit.tsx](src/features/chapters/teen/games/parts/gameKit.tsx)) → a labeled **"SOLVING IT, STEP BY STEP"** board with **numbered** left-aligned steps (chip 1,2,3,4), chalk-write on the current line, ending on the answer. Tightened SkyTower's `overview` (problem = *"Ride from floor 2, then down 5 — where does the lift stop?"* + 3 short bullets). **Verified live** desktop (1280×820, DOM-confirmed) + mobile (375×812, clean screenshot): concise panel + 4 numbered solve steps (Start on floor 2 → Going down 5 means subtract → Count past the ground: 1,0,−1,−2,−3 → 2 − 5 = −3) sitting right above the matching illustration (lift at B3, "3 below", −3). Spot-checked **integers/Bank Account** teaching screen — concise panel renders from its own overview, 0 errors. `tsc` clean · **26/26 tests** · 0 console errors.
> **NOT committed / NOT deployed** (no auto-push). **NEXT:** get partner sign-off on the pilot → roll to the other 11 chapters (mechanical: per chapter add `context`/`instruction` + trim `prompt`; tighten `overview.problem`/`points` to ~1 line + 3 short bullets; tighten solve to ~4 board lines). Deeper follow-up if partner wants: per-chapter "illustration matches the step" art pass. Then commit (bump `public/sw.js` v20→v21) + deploy. **Watch:** the removed read-along karaoke was a founder-built feature — confirm they're OK dropping it for concision.
>
> ✨ **2026-07-09 (EARLIER) — 12–14 FRAMER-MOTION SMOOTH ANIMATIONS (all 12 scenes) + PERMANENT "SOLVE IT" + READABLE QUESTION — SHIPPED.** Two changes, one commit `51d910e` → `main` → Vercel (sw v19→v20). **(1) Framer Motion across ALL twelve 12–14 `TutorialScene`s** (bringing them to parity with the 15–16 band). Each scene's per-step CSS-`transition` jumps → **spring-driven `useMotionValue` + `animate` + `useTransform`**, `useReducedMotion`-gated (snaps to final state on reduced motion). Where a scene shows a changing number it now **ticks smoothly** instead of snapping. Recipe locked in the **pilot `SkyTowerScene`** (spring `{stiffness:120,damping:24,mass:0.9}`, overdamped so a counting readout never overshoots into a wrong value; split pattern = outer `motion.div` for Framer position + inner `<div>` for any decorative CSS keyframe so the two `transform` sources don't collide), then **fanned out via 11 parallel per-chapter subagents** (one file each, no cross-file edits). Scenes: SkyTower (car+floor#), BankAccount (balance marker/coin+debt fills/overdraft bracket), CuttingBench (saw+tape needle), PaintStudio (cup fills+counts), TileFactory (tiles cascade+counter), EventBudget ($ total ticks), TaxiMeter (taxi+fare/km), BaggageScale (spring beam tilt + provably-level pans via translation), DeliveryDrone (independent x/y springs = fly-across-then-down), WaterTank (fill+litre#), RoomReno (tiles cascade+area#), StoreCheckout (grid shading + price slide, per-example remount). **(2) Question chalkboard** (`gameKit.tsx` `QuestionBoard` + `GameShell.tsx`): a **permanent "Solve it"** cue (was a 1.5s flash) → swaps to "Solved ✓", plus the question **WRITTEN OUT** (`task.prompt`) so a kid who misses Milo's audio can read it; removed the redundant by-instrument "Your turn — solve it". **Verified:** project `tsc` clean · **26/26 tests** · `next build` green; live spot-checks — SkyTower glides through **17 intermediate positions** with the floor number ticking, EventBudget $ total ticks continuously, scenes reach the correct final answer, **0 page scroll** on desktop (1280×820) + mobile (375×812), "Solve it" + readable prompt render in both guided + practice. Each subagent preserved its scene's exact final state + container sizing. **SHIPPED: `51d910e` → GitHub `main` → Vercel prod READY** (post-deploy smoke: home + `/teen-preview?c=signedRationalOps`/`orderOfOperations`/`equationsInequalities` all 200, prod `sw.js` `VERSION v20`). Excluded (convention): `labs-demo/`, `docs/ui-visual-design-brief.md`, `docs/teen-explainer-video-plan.md` (untracked).
>
> 🧑‍🏫 **2026-07-09 (EARLIER) — 12–14 WALKTHROUGH: PERSISTENT EXPLANATION + SEPARATE BABY-STEP BOARD (no-scroll) + BANK-ACCOUNT SPRITE CLEANUP — SHIPPED.** Founder ask: in the 12–14 teaching phase the **explanation (summary) must stay on screen the whole time**, with the **baby steps on their own chalkboard** and the illustration — all three fitting **without the view scrolling**. Reworked the shared **`GameShell` teaching phase** (affects 12–14 AND 15–16, same shell): new **`TeachFrame`** used for intro + walkthrough — **roomy**: explanation pinned LEFT, baby-step board ABOVE the illustration on the right; **mobile**: single column explanation → baby-step board → illustration → controls (both boards BEFORE the illustration). Hard **no-scroll**: root capped `height:100dvh`+`maxHeight:100dvh` and a `min-height:0` flex chain (main→frame→right col→illo) so the illustration shrinks to fit; added `.teach-illo svg{max-width/height:100%}` so any scene scales down. Explanation reads word-by-word in the intro (`ExplanationPanel read`), then stays **static+silent** through the walkthrough (renamed from `OverviewBoard`); baby steps animate on the separate `Blackboard`. **Bank Account (WeatherStation):** founder flagged the per-step **ArtProp picture sprites** (coins / **OVERDRAWN** sign / vault / withdraw) — removed all `art:` fields from its tutorial steps so only the **`BankAccountScene`** (the illustration synced to narration) shows. Bank Account was the ONLY chapter using `art:`; `ArtProp`/`DemoStep.art` plumbing left inert (harmless). **Verified live** desktop (1280×820) + mobile (375×812), intro + walkthrough, on signedRationalOps + integers: correct panel order, **0 page scroll**, controls in view, no ArtProp sprites (only scene imgs). `tsc` + **26/26 tests** + `next build` green. **sw.js v18→v19. SHIPPED: commit `081e6c6` → GitHub `main` → Vercel prod READY** (post-deploy smoke: home + `/teen-preview?c=signedRationalOps` + `?c=integers` all 200, prod `sw.js` serving `VERSION v19`). Excluded (unchanged convention): `labs-demo/`, `docs/ui-visual-design-brief.md`, and `docs/teen-explainer-video-plan.md` (left untracked).
>
> ### Explainer-VIDEO experiment — TRIED then REVERTED (same session)
> Founder floated replacing the illustration with a **Higgsfield-generated explanation animation** that goes **hand-in-hand** with the narration. Planned it ([`docs/teen-explainer-video-plan.md`](docs/teen-explainer-video-plan.md), untracked), locked decisions (themed-motion-only / silent loop under Milo / 12–14 only / pilot first), and **piloted signedRationalOps (Sky Tower)**: Nano-Banana still → Kling 3.0 Turbo image-to-video (silent, ~9 cr) → a `VideoScene` that **scrubs the playhead by walkthrough step** (seek-based, not `play()` — muted autoplay is blocked in preview/flaky on iOS). **Founder verdict: the code-drawn illustration looked better** → reverted the chapter and **fully stripped the video infra** (`tutorialVideo` field, `VideoScene`, hook, branches) — nothing remains in code; pilot asset deleted. Spend ≈ **10.5 cr** (balance ~769). Takeaways in the plan doc §8a: only worth video where real motion/texture beats SVG (fluids/crowds/texture), not clean geometric motion; scrub must be seek-driven; match the ~4:3 slot.
>
> 🎬 **2026-07-07 (EARLIER) — 15–16 ANIMATION UPGRADE (storyboards + Framer-Motion SVG + baby steps) SHIPPED TO PROD.** All twelve 15–16 `TutorialScene`s rebuilt from thin code-drawn scenes into **hand-authored SVG + Framer Motion** stages (illustrated themed set over the exact code math skeleton; continuous `useMotionValue`/`useTransform`/`animate`, springs, `pathLength` draw-ins, `useReducedMotion`), and every walkthrough expanded to **9–14 granular baby steps** (one idea + one board line + one scene beat — fixing the under-stepped "steps appear directly" issue). **No generated image assets — pure SVG** (founder call for this pass). Founder-approved medium: illustrated + precise motion; sequenced as pilot-one (The Shot) → sign-off → fan out the other 11 (one agent per chapter, each editing only its own game file). Per-chapter **storyboards in [`docs/storyboards/`](docs/storyboards/)** (12). Scene highlights: The Shot = basketball court + arcing spinning ball + hoop/net; Leaderboard = arcade scoreboard + WIN/LOSS score meter; SavingGoal = money-jar $-number-line; ScreenDistance = phone 3-4-5 triangle + a²/b² tiles; PowerUps = ×2-leaping power meter + ladder; BestPlan = cost chart + sweeping scanner + break-even; etc. Also fixed a latent SkateRamp angle-placement bug + moved a `fontVariantNumeric` into `style` (PowerUps). `tsc` clean · **26/26 tests** · `next build` green. **Live-verified through the walkthrough:** The Shot, PowerUps, Leaderboard, SavingGoal (by me) + TicketCheckout, ScreenDistance, GoingViral, BestPlan (self-verified) — all render as real scenes, animate through the baby steps, reach the correct answer, zero live console errors (a repeated Framer opacity warning was proven STALE buffer from the parallel agents driving the shared preview mid-edit — 0 warns on a fresh replay). This commit bundles the WHOLE prior-uncommitted 15–16 rebuild too (12 game files + 3 gameKit instruments + `motion` dep + plan doc). **sw.js v17→v18.** **SHIPPED: commit `ce74580` → GitHub `main` → Vercel prod `dpl_ETXGCo…` READY (aliased `milo-story-mode.vercel.app`, built ~50s).** Post-deploy prod smoke: home + `/teen-preview?c=quadraticsParabolas` both 200, `sw.js` serving `VERSION v18`. Deliberately excluded (explicit staging, no `git add .`): `labs-demo/`, `docs/ui-visual-design-brief.md`. **NEXT:** optional signed-in live tap-through on prod of the 4 I didn't personally drive (FollowerGrowth, MapMaker, SkateRamp, BuildPlot — build-clean + pattern-identical); optional richer/illustrated (Nano-Banana) asset pass later.
>
> 🧮 **2026-07-07 (LATER) — 15–16 BAND REBUILT AS PLAYABLE GAMES + TWO PROD FIXES SHIPPED + FRAMER MOTION PILOT.** Big session. `tsc` + **26/26 tests** + `next build` green throughout. **Two small changes committed + pushed to prod; the entire 15–16 rebuild is UNCOMMITTED (working tree).**
>
> ### A. SHIPPED TO PROD (committed + pushed)
> - **`a587e47` — drop spoken praise on correct + greet once (sw v15→v16).** Removed Milo speaking "Good job/Nice/You're unstoppable" after a correct answer in PRACTICE (teen `GameShell.tsx:265` + 25 `game/*Chapter.tsx` `speak(\`Correct. ${ada.praise}\`)`); the quiet "You solved it! ✓" visual cue stays; Milo still speaks on wrong answers. The praise pool lives in [`core/adaptive.ts`](src/core/adaptive.ts). Menu welcome greeting now speaks **once per app load** via a module-scoped `_greeted` set in [`menu/page.tsx`](src/app/menu/page.tsx) (was re-greeting on every menu→game→menu return). On-screen "Hi, {name}!" unchanged.
> - **`25952a3` — overview reads ON the chalkboard + auto-rolls into the walkthrough (sw v16→v17).** In [`GameShell.tsx`](src/features/chapters/teen/games/parts/GameShell.tsx): the pre-walkthrough summary is no longer a centre card read on its own — when a chapter has an illustrated `TutorialScene`, the overview reads **on the chalkboard** (top-left / top slot, new `OverviewBoard`) with the **illustration posed in the middle**; and when Milo finishes reading, the baby-step walkthrough **starts automatically** (wired `speakWithHighlight`'s `onDone` — fires once incl. the blocked-audio fallback — to `setStage('demo')`; removed the "Show me how →" button). Chapters without a TutorialScene keep the centered card, which also auto-advances. Applies to all 12–14 chapters + inherited by 15–16. Verified live.
>
> ### B. 15–16 BAND (Algebra I + Geometry) — ALL 12 CHAPTERS REBUILT AS GAMESHELL "PLAYABLE GAMES" — **UNCOMMITTED**
> Migrated the whole 15–16 band off the old "Field Lab" (CaseCard→ExploreStep→TeenLesson→MCQ practice) onto the shared 12–14 **GameShell**, so it's the exact same experience: optional Explore sim (kept, "Skip to the game") → start card → **overview read-along on the chalkboard** → auto **baby-step walkthrough** with a code-drawn animated scene → guided → scored play → MasteryState. **Plan doc: [`docs/teen-15-16-gameshell-plan.md`](docs/teen-15-16-gameshell-plan.md)** (themed use-cases, interaction map, progress log §7a).
> - **Founder decisions locked this session:** (1) themes must be **teen-relatable** (money/phones/social/gaming/sports), NOT engineering-class; (2) **NO MCQ** — each chapter has its own *produce/manipulate* interaction in practice AND explanation; SpecPicker/StepPicker only for genuinely categorical sub-types (rational/irrational, proofs), reframed as sort/assemble; (3) **build-the-answer** production input where it matters (factoring/quadratics/slope/ch1). Chapters ARE grade-appropriate (US Grade 9–10 Algebra I + Geometry); ch1 signed-numbers is a deliberate easy on-ramp.
> - **New shared instruments in [`gameKit.tsx`](src/features/chapters/teen/games/parts/gameKit.tsx):** `SpecPicker` (themed choice cards), `StepPicker` (assemble-the-next-step), `PartsBuilder` (two steppers build a live template — factors, roots, radicals, coordinate pairs). Reuses existing SlideValue/VThermo/ElevatorShaft/BalanceBeam/CrankGear/LineSetter.
> - **The 12 (chapterId · game file · themed non-MCQ interaction):** signedNumberFluency·Leaderboard·signed score meter+bin-sort · expressionsVariables·TicketCheckout·ring-up dial+expr builder · linearEquationsInequalities·SavingGoal·balance beam+week-dial · slopeLinearGraphs·FollowerGrowth·line builder+slope dial · functionsFamilies·GoingViral·value dial+steady/viral sort · systemsOfEquations·BestPlan·build the crossing point · exponentsPolynomials·PowerUps·crank a power+result dial · radicalsPythagorean·ScreenDistance·side dial+radical builder · factoringPolynomials·BuildPlot·build the two plot sides · quadraticsParabolas·TheShot·roots/vertex builder+radical picker · geometryTransformations·MapMaker·measurement dial+coord builder · geometryProofTrig·SkateRamp·angle/side dial+proof assembler.
> - **How built:** the 2 pilots (TicketCheckout, BuildPlot) by me; the other 10 by parallel per-chapter subagents (each created a `teen/games/<Name>.tsx` + rewrote its `game/*Chapter.tsx` wrapper, reusing that chapter's existing `*TeenLesson.tsx` `makeRound` MATH via structured generators — no gameKit edits → no conflicts). Wiring (game/page.tsx dispatch, chapters.ts, teen-preview map) was ALREADY registered — only the internals changed. **5 spot-verified live** (Ticket, BuildPlot, FollowerGrowth, SkateRamp, Leaderboard); the other 7 are tsc/build-clean + pattern-identical.
> - **ANIMATION QUALITY PASS:** founder saw the first scenes were too STATIC. Rewrote all 10 subagent `TutorialScene`s (another parallel fan-out, each editing only its own game file) to ACT OUT the worked example step-by-step against the gold-standard **`SkyTowerScene`** in [`SkyTower.tsx`](src/features/chapters/teen/games/SkyTower.tsx) (glide on `value`, phase overlays keyed to `stepIndex`, moving cues, tuned DEMO_STEPS values so the scene BUILDS UP). Verified live (TheShot ball arcs to peak→landing; FollowerGrowth rise/run staircase).
>
> ### C. FRAMER MOTION — installed + The Shot PILOT (UNCOMMITTED, rollout pending)
> Founder: the code-drawn animations still aren't SMOOTH. Root cause: they transition layout/SVG-geometry props (top/height/x/y/`all`) which reflow, AND motion is discrete (only moves per narration step). **Chose Framer Motion as the best fix; installed `motion` 12.42.2** (React 19 compatible). **Rebuilt `ArcScene` in [`TheShot.tsx`](src/features/chapters/teen/games/TheShot.tsx)** with it as the pilot: the 🏀 now travels **continuously** along the arc (a `useMotionValue` progress driven by `animate()` at 60fps + `useTransform` for x/y so it follows the CURVE, not a snap), the parabola **draws in** via `pathLength`, the trail grows, markers **spring** in; `useReducedMotion`-gated. `tsc` + `next build` green, no console errors, renders live. **Lazy-loaded in teen chapters only** (game files are `next/dynamic`) so `motion` never touches the 3–11 app / initial bundle. **NEXT: roll the same Framer-Motion approach across the other 9 teen scenes** (use `ArcScene` as the new motion reference).
>
> ### Open / next
> - **Roll Framer Motion smoothness to the other 9 15–16 scenes** (Leaderboard, SavingGoal, FollowerGrowth, GoingViral, BestPlan, PowerUps, ScreenDistance, MapMaker, SkateRamp) + optionally the 2 pilots' scenes. Reference: `ArcScene`.
> - Minor: TheShot's ball final resting x read as center (0) not the right root (2) at walkthrough end — eyeball/fix.
> - Live tap-through of the 7 unverified 15–16 chapters (esp. MapMaker decimal-tolerance dial, TheShot irrational-root picker).
> - **COMMIT the whole 15–16 batch** when ready (12 chapters + 3 instruments + `motion` dep + plan doc) — bump `public/sw.js` v17→v18. Deliberately excluded so far: `labs-demo/`, `docs/ui-visual-design-brief.md`.
> - Deferred (founder): illustrated `TutorialScene` assets (scenes are code-drawn now); cleanup of now-unused CaseCard/TeenLesson-render paths (the `*TeenLesson.tsx` `makeRound` is still used for math; the `*Explorer.tsx` sims are KEPT as the optional Explore beat).
>
> _(everything below is prior sessions — still valid)_

> 🎨 **2026-07-07 — 12–14 ILLUSTRATED EXPLAINERS + "YOUR-TURN" CUES + READ-ALONG SUMMARIES — SHIPPED TO PROD.** One commit `5eab543` → GitHub `main` → **Vercel prod READY** (aliased `milo-story-mode.vercel.app`, built ~54s). `tsc` + **26/26 tests** + `next build` all green before push. **sw.js VERSION v14 → v15.** Live smoke-checked: site/teen-preview 200, new assets 200, sw v15. Deliberately excluded from the commit (explicit paths, no `git add .`): `labs-demo/` + the stray untracked `docs/ui-visual-design-brief.md`.
>
> Three founder-requested changes, all across the twelve 12–14 game chapters (centralized where possible in [`GameShell.tsx`](src/features/chapters/teen/games/parts/GameShell.tsx)):
>
> ### 1. "Your turn / You solved it" interaction cues (feedback-your-turn-cue)
> Every point control passes to the child now shows a legible **"Now it's your turn!"** popup (flashes on guided-round entry + each scored question load) + a persistent **"Your turn — solve it"** label by the instrument; a **"You solved it! ✓"** popup fires on a correct answer (both guided + scored). All in GameShell (`flashCue`, the `gk-cue` popup, reduced-motion-safe). Verified live.
>
> ### 2. Pre-walkthrough SUMMARY card + word-by-word READ-ALONG
> Before the baby-step walkthrough, a new **"Here's the plan"** stage (`stage:'intro'` + `OverviewCard`) states the problem in one line and shows a **read-along of Milo's spoken summary that highlights each word as it's spoken** (karaoke) so kids can track along. New optional `GameConfig.overview {say, problem, points?}` on all 12 configs. Highlighting engine = **`speakWithHighlight` + `splitWords` in [`useMiloSpeaker.ts`](src/infra/useMiloSpeaker.ts)**: uses the utterance's `onboundary` word events where the browser fires them (Chrome), with a **length-weighted timed-sweep fallback + a watchdog** (Safari / blocked audio / mid-sentence boundary stalls) so the highlight never freezes and finishes with the audio. Lone-punctuation tokens aren't pilled. Verified live (word lights up gold in sync). NOTE: the preview's speech engine is flaky (events inconsistent, long evals hang) — trust point-in-time probes/screenshots over polling.
>
> ### 3. Illustrated "explainer" scenes for ALL 12 chapters (Nano Banana 2)
> The animated `TutorialScene` in each chapter now uses **generated illustrations** instead of code-drawn shapes — a **SOFT backdrop + themed objects** — while the **precise animated skeleton stays code-drawn** (number lines, grids, coordinate axes, meters, readouts, brackets, equations, counters). Objects keep their existing CSS position/transition so they still glide/pop/fill; fills use an animated `clip-path`. Founder rule: **backgrounds SOFT** (faint/muted/desaturated/mostly-empty) — Bank Account's original vault-door backdrop was flagged too prominent, so **chapter 1's backdrop was left as-is but every other chapter got a softer one**.
> - **Pilot (chapter 1, Bank Account / integers / [WeatherStation.tsx](src/features/chapters/teen/games/WeatherStation.tsx)):** first built an animated `BankAccountScene` (chapter 1 previously had NO TutorialScene — the only one without) — a balance meter with a gold coin-stack credit fill + red-IOU overdraft fill + coin-token marker + withdraw hand, gliding past zero to −$3. Then illustrated it: **5 assets** (`bank_scene_bg`, `bank_coin_column`, `bank_debt_column`, `bank_coin_token`, `bank_withdraw_hand`). Verified live end-to-end.
> - **The other 11** built by **per-chapter background subagents** (2 waves) — each ran the full pipeline (generate → `remove_background` → autocrop/optimize via PIL → save → wire the scene) with **503-retry/backoff** (the Higgsfield endpoint rate-limits hard — ~1 submit succeeds per burst; parallel agents with backoff serialize over wall-clock). Each was tsc-clean; most self-verified live: SkyTower(elevator), GearLab(tile), FunctionFactory(taxi), BalanceBench(SVG scale + suitcase/weights — objects as SVG `<image href>` inside the counter-rotating pan groups), NightFlight(drone+pin over faint aerial map), CableCar(glass tank vessel + faucet, code water shows through), BuildSite(floor tile), StoreCheckout(hoodie), JuiceBar(blue+yellow paint buckets), KitchenCounter(plank/tape, gated by `task.mech`), ScoreMachine(blank receipt + desk).
> - **26 new PNG assets** under `public/assets/teen/objects/` (`tower_/tile_/taxi_/bag_/drone_/tank_/room_/shop_/paint_/cut_/budget_*` + the 5 `bank_*` pilot ones). Style: bold cartoon vector, thick outlines, flat fills, referencing the existing `coin_gold`/`bank_*` art. **~60 Higgsfield credits** spent total (balance was ~847 → ~785; well within budget).
> - **Reusable recipe** for future illustration batches: analysis subagents produce a per-chapter asset spec (backdrop + objects + WIRES notes, keeping the math skeleton code-drawn), then per-chapter agents run generate→cutout→PIL-optimize→save→wire with 503 backoff. WeatherStation's `BankAccountScene` is the gold-standard wiring reference.
>
> ### Follow-ups / open
> - **Live eyeball of the other 10 walkthroughs on prod.** I verified SkyTower live + Bank Account end-to-end; the other 10 were each self-verified by their agent (assets load, tsc clean, correct z-layering, mirror the production-verified BankAccountScene) but not personally driven end-to-end by me. Worth a signed-in/live tap-through.
> - Minor: SkyTower shows a faint elevator-shaped silhouette in the shaft (likely the skyline backdrop through the semi-transparent shaft) — looks fine, but eyeball. `next build` was green.
>
> _(everything below is prior sessions — still valid)_

> 🚀 **2026-07-06 (later still) — PUSHED TO PROD + first UX-design change shipped.** The prior "committed but NOT pushed" note below is now **SUPERSEDED**: `main` was already in sync with `origin/main` at session start (the whole 12–14 animated-walkthrough batch was in fact pushed + auto-deployed). This session pushed two more commits → Vercel:
> - `8e1b0f3` **docs(ux):** added `docs/ux-design-brief.md` (founder's psychology-driven UX prompt) + `docs/ux-design.md` (the resulting behavioral-science design doc — all 3 learner bands + parent/teacher surfaces, with an anti-dark-pattern critique). **Read `docs/ux-design.md` §9 for the prioritized implementation list.**
> - `0cd17cd` **feat(teen):** first UX-doc change applied (priority #1, ux-design.md §6.3) — the teen `GameShell` walkthrough now (a) **windows the chalkboard to the last 4 lines** (Bank Account was accumulating ~14 → working-memory overload + slot overflow) and (b) adds a quiet **"I've got it →" skip** so a fast learner isn't trapped watching the rest. Verified live (integers/Bank Account: board caps at 4, skip → guided stage, 0 console errors). `tsc` + 21/21 + build green. **sw.js VERSION bumped v10 → v11.**
> - `labs-demo/` is untracked and deliberately **left out** (separate standalone project — do NOT `git add .`, it's not gitignored). **NB a new untracked `docs/ui-visual-design-brief.md` appeared mid-session (not authored by me) — left untouched; check what it is.**
>
> ### UX-doc implementation — founder decisions taken + 4 more changes SHIPPED this session
> Asked the founder (AskUserQuestion) on the two locked-decision conflicts: **(1) email gate → KEEP as-is** (no change); **(2) coins → cosmetic-only** (decouple from math, keep teen coins); **(3) proceed with all four larger builds.** Then shipped (all pushed → Vercel, `tsc` + **26/26 tests** + build green throughout):
> - `9de8628` **reduced-motion (#7)** — global `prefers-reduced-motion` fallback in `globals.css` that SNAPS animations to their end state (NOT `animation:none` — that'd leave opacity:0 entrance elements invisible) + stills decorative loops. JS-timer staged reveals (parade/count-ups/narration) unaffected. Covers the 3–11 story chapters (teen band already had component-level handling). · **coins cosmetic-only (§6.1)** — `CelebrationModal` demotes coins from a co-equal reward trophy to a quiet "🪙 +N in your wallet — for the Shop" sub-line; XP stays the headline. **NOT fully flattened:** the amount is still `stars*5`, derived server-side in `sync_session` (harden_rpc_inputs `v_run_coins`) — a flat completion award needs a **DB migration** (deferred, needs migration sign-off). · **`docs/ux-invariants.md` (#6)** — the non-negotiable product rules as a checklist.
> - `08c27d3` **teacher class triage (#4)** — NEW `/parent/grades/triage?g=<id>` (search param, not a dynamic segment — matches this app's convention; auth-guarded): groups a grade's students by shared diagnostic **root gap** for small-group teaching (three buckets: gap biggest-first / on-track / no-check-last). `features/triage/{groupByRootGap(pure),useGradeTriage}` + `getGradeTriage()` in `grades.ts` (client-side aggregation, **no migration**) + a "Triage" button on each grade card + **5 unit tests**. Page verified to load + auth-redirect cleanly. (Page itself is auth-gated → logic is unit-tested, not driven live.)
> - `9e6522d` **tier-linked scaffolding (#2)**, teen GameShell slice — Milo's per-question voice hint **fades at the top tier** (child works from the board unaided; returns on demotion) + the guided "we do" round is **skipped when resuming at the top tier**. Default (tier-1) flow re-verified (guided shows). Top-tier live path NOT drivable headlessly (kv boot-timing on seeding startDiff=3; speech doesn't fire onstart headless) — both are trivial guards over already-verified `startDiff` plumbing.
> - **sw.js VERSION now v14.**
>
> ### UX-doc — still open (deferred, needs a decision/bigger effort)
> - **Coin amount flattening** — decouple the *amount* from performance (flat completion award vs `stars*5`); needs a `sync_session` **DB migration** (server derives coins) + client `scoring.ts`. Founder chose cosmetic-only; this is the deeper half. Get migration sign-off.
> - **⭐-tier label** (`ada.difficultyLabel` "Champion ⭐⭐⭐" on the GameShell warm-up prompt) — the doc §6.1 + `ux-invariants.md` #9/#15 say don't show a tier label to a learner, but the founder built the warm-up copy that way. Left as-is (founder's call); flagged as an invariant tension.
> - **#2 beyond the teen shell** — tier-linked scaffolding for the 6–11 SkillBeat system + tiered walkthrough length/parade cadence is a larger cross-file follow-up.
>
> 🎬 **2026-07-06 (later) — ANIMATED "EXPLAINER-VIDEO" WALKTHROUGHS FOR ALL 12–14 CHAPTERS + WHOLE BATCH COMMITTED.** `tsc` clean · `npm test` **21/21** · `next build` **green**. **Committed to `main` this session (NOT pushed — no deploy yet).** This commit bundles the entire prior-session 12–14 overhaul (the block just below — universal layout + real-world re-theme + baby-step explanations) TOGETHER with this session's animated explanations. Dev server port 3017.
>
> **The idea (founder-directed):** each chapter's "I do" walkthrough should ACT THE MATH OUT like a cartoon explainer video — a moving scene synced to Milo's narration — not a static diagram.
>
> ### New generic hook — `TutorialScene` ([GameShell.tsx](src/features/chapters/teen/games/parts/GameShell.tsx))
> - Optional `GameConfig.TutorialScene?: (p: { palette, task, value, stepIndex, frameCount, ended }) => ReactElement`. When present it **REPLACES the static instrument during the walkthrough** (practice/guided keep the real interactive instrument). Driven by the SAME `TutorialPlayer` narration timeline (`speakSteps`) — the scene reads the current step's `value`/`stepIndex` and CSS transitions animate the change, so motion stays in sync with the voice (and the silent-audio fallback). Reference impl: **`SkyTowerScene` in [SkyTower.tsx](src/features/chapters/teen/games/SkyTower.tsx)** — mirror it for any new chapter.
> - Also added `DemoStep.art?: string` + an `ArtProp` (a sprite shown beside the chalkboard per step). Used ONLY by Ch1 (Bank Account) — the "swap a picture per beat" style the founder asked to keep as-is.
>
> ### Ch1 — Bank Account 🏦 (integers / [WeatherStation.tsx](src/features/chapters/teen/games/WeatherStation.tsx)) — SPRITE-SWAP style
> - **6 generated object sprites** (Nano Banana 2, ~15 Higgsfield credits incl. bg-removal) → `public/assets/teen/objects/bank_{coins,cash,deposit,withdraw,vault,overdrawn}.png` (referenced the existing `coin_gold` art for style). Each walkthrough step sets `art:` → the matching object pops in beside the board (coins for the balance, red withdraw token while counting down, empty vault at zero, OVERDRAWN sign below zero). `bank_cash` is generated but unused in the withdrawal example (reserved for deposit-heavy tasks).
>
> ### Ch2–12 — 11 bespoke CODE-DRAWN animated scenes (ZERO credits)
> Each acts out its worked example, gliding via CSS transitions only (no JS anim loops, no deps, Safari-safe). All **verified live** reaching the correct final answer state:
> - **Sky Tower** 🏢 signedRationalOps — elevator car glides floor-by-floor, crosses the gold ground line into the shaded basement, lands mint at −3 with a "3 below" bracket (`2 − 5 = −3`). *(the template)*
> - **Cutting Bench** 🪚 rationalOps — 3 examples: plank split into 12ths (saw glides) + tape-measure needle (decimal) + `¾ ÷ ¼ = 3` pieces.
> - **Paint Studio** 🎨 ratioProportion — buckets pour Blue 2 : Yellow 3 into a tray → "5 parts ✓".
> - **Tile Factory** 🧱 exponentsRoots — unit tiles fill a 3×3 grid → `3² = 9` ("9 tiles").
> - **Event Budget** 🧾 orderOfOperations — receipt; `3×4` highlights gold + collapses to **12**, `2` struck → TOTAL **$14**.
> - **Taxi Meter** 🚕 algebraicExpressions — taxi drives to 4 km, meter ticks base $2 + $3/km×4 → **$14**.
> - **Baggage Scale** 🧳 equationsInequalities — beam tips then balances level, suitcase reveals **x = 5**.
> - **Delivery Drone** 📍 coordinatePlane — flies across x:3 then down y:−2 → **(3, −2)**.
> - **Water Tank** 💧 linearRelationships — fills to base 1, stacks +2/min → **5 L** (`y = 2x+1`).
> - **Room Reno** 🏠 geometryMeasurement — floor tiles row-by-row → **24** (`6×4 m²`).
> - **Store Checkout** 🛒 percentages — 2 examples: hundred-grid shades 25% + price tag slides $80 → **$60** SALE.
>
> ### Build method + polish
> - Ch3–12 built by **10 parallel subagents** (one per file — independent, no conflicts), each given `SkyTowerScene` as the gold standard. All returned tsc-clean; one fixed a `??`/`||` paren issue it introduced in GearLab.
> - **Polish pass** fixed 5 cosmetic overlaps (all verified): Store Checkout SALE stamp → corner; Cutting Bench tape value-bubble clearance; Baggage Scale verdict pill centered (missing `translateX(-50%)`) + arithmetic line lifted; Room Reno "4 m" label off the tiles. (The "RECEIPT watermark" was a false alarm — it's the faint 🧾 motif backdrop.)
>
> ### Not in this commit / still open
> - **NOT pushed** — commit only. Push when ready (main auto-deploys to Vercel; then the usual prod checks). Pre-push: bump `public/sw.js` VERSION per deploy.
> - `docs/ux-design-brief.md` (untracked, a standalone UX-design prompt — unrelated, left out) and `labs-demo/` (separate project) deliberately excluded.
> - Prior **NEEDS-YOUR-APPROVAL** items still open (bespoke painted backdrops needing credit allowance; deeper custom themed instrument objects). The founder's cut-off "point 3" was never received — still worth asking.
>
> _(the block below is the prior session — its "UNCOMMITTED / HEAD=a8296b4" status is now SUPERSEDED: it's all in this commit.)_

> 🎮 **2026-07-06 — 12–14 GAMES: UNIVERSAL LAYOUT + REAL-WORLD RE-THEME OF **ALL 12** CHAPTERS + BABY-STEP EXPLANATIONS (UNCOMMITTED).** `tsc` clean · `npm test` **21/21** · `next build` **green**. Dev server port 3017. HEAD still `main`@`a8296b4` (nothing committed/pushed this session). Big founder-directed overhaul of the whole 12–14 band; **all 12 chapters now run on the shared GameShell** with one consistent layout + real-world themes. Items needing founder allowance are in **NEEDS-YOUR-APPROVAL** below (nothing spent).
>
> ### A. Universal layout — shared shell ([GameShell.tsx](src/features/chapters/teen/games/parts/GameShell.tsx) + [gameKit.tsx](src/features/chapters/teen/games/parts/gameKit.tsx))
> - **Permanent chalkboard**, pinned **top-left on laptop** (`useRoomy` ≥820px → `BoardSlot` absolute) / **full-width across the top on mobile** (`BoardSlot` in-flow). Shows the **explanation** during the walkthrough and the **question** during practice (new shared `QuestionBoard`).
> - **No Milo dialog printed on screen** — removed the `Says` bubble + the receipt `Ticket` from play; Milo still SPEAKS, the board carries the math.
> - **Interactive centred, action button directly below** (`CenterFill`). Old two-column `useWideLandscape` walkthrough replaced; `TutorialPlayer` uses the same BoardSlot+CenterFill. Responsive verified laptop (1440×900) + mobile (375×812).
> - **Sweet & simple backdrops (ZERO cost):** removed the busy `scene_*.png` photos; backdrop is now the palette gradient + **one big, very faint themed motif emoji** (`config.motif`), so nothing competes with the interactive. `public/assets/teen/scene_*.png` are now **UNUSED** (left in place; bespoke art can replace them later).
> - **New optional `GameConfig` fields:** `question?(t)` (custom board render, e.g. portion highlight), `motif?: string`, and `tutorial` now accepts a **single `TutorialScript` OR an array** (multi-example walkthroughs).
>
> ### B. All 12 chapters re-themed to real-world use-cases
> (copy + palette + motif + labels only; **math, answers, instrument mechanics, chapterId all UNCHANGED**. Filenames/exports keep old names — wrappers import by those, so untouched.)
>
> | chapterId | theme | motif | file |
> |---|---|---|---|
> | integers | **Bank Account** (deposits/withdrawals, overdraft) | 🏦 | WeatherStation.tsx |
> | signedRationalOps | **Sky Tower** (lift; floors above/below ground; new `ElevatorShaft` instrument) | 🏢 | SkyTower.tsx |
> | rationalOps | **Cutting Bench** (carpentry: board fractions + tape decimals) | 🪚 | KitchenCounter.tsx |
> | ratioProportion | **Paint Studio** (mix colours in ratio) | 🎨 | JuiceBar.tsx |
> | exponentsRoots | **Tile Factory** (n² tiles, n³ blocks, roots=side) | 🧱 | GearLab.tsx |
> | orderOfOperations | **Event Budget** (total costs: ×/÷ = each item's cost first; portion-marked) | 🧾 | ScoreMachine.tsx |
> | algebraicExpressions | **Taxi Meter** (fare = base + rate×km) | 🚕 | FunctionFactory.tsx |
> | equationsInequalities | **Baggage Scale** (find unknown case weight) | 🧳 | BalanceBench.tsx |
> | coordinatePlane | **Delivery Drone** (GPS to (x,y)) | 📍 | NightFlight.tsx |
> | linearRelationships | **Water Tank** (start level + fill rate) | 💧 | CableCar.tsx |
> | geometryMeasurement | **Room Reno** (floor area for tiles, perimeter for skirting) | 🏠 | BuildSite.tsx |
> | percentages | **Store Checkout** (discount/sale/saving/tax/tip/reverse) | 🛒 | StoreCheckout.tsx |
>
> - **Percentages MIGRATED off the old self-contained ShopRush onto GameShell** → new `StoreCheckout.tsx`; `ShopRush.tsx` **deleted**; wrapper `PercentagesChapter.tsx` rewired. New shared **`PaintGrid`** instrument in gameKit (ported from ShopRush's 10×10 PaintPad); prices use `SlideValue`; dual-instrument via `mech:'paint'|'slide'` (like KitchenCounter). **⇒ all 12 chapters are on GameShell now.**
>
> ### C. Pedagogy / UX fixes this session
> - **BABY STEPS in EVERY chapter's explanation** — expanded each walkthrough from ~6 steps to **~9–14 baby steps**, each conceptual jump its own slow narrated step + an intermediate chalkboard line. Counts: Bank Account 14 (count each $ down through zero) · Sky Tower 9 · Cutting Bench 3-example (bar→tape) · Paint Studio 10 · Tile Factory 11 · Event Budget 11 · Taxi Meter 10 · Baggage Scale 11 · Delivery Drone 13 (across then down) · Water Tank 10 · Room Reno 12 · Store Checkout 2-example. Verified live (Delivery Drone grid animates each micro-step; Bank Account's 14-line board fits the pinned slot). *NB: longest boards (~14 lines) sit tall but fit; windowing to the last N lines is an easy follow-up if any feel cramped.*
> - **Multi-example walkthroughs** — `TutorialPlayer` flattens an array of examples into one timeline, switching the instrument + resetting the board per example (single-script still works). Cutting Bench (fractions/decimals) walks 3 examples across its two instruments; Store Checkout walks 2.
> - **Journey tasks START at the stated value** (`start` field on the Task → `initialValue`): Sky Tower rides begin on the first floor `a` (×/÷ stay at 0); Bank Account transactions begin at the current balance `s` ("set balance to X" stay at 0); Store Checkout "slide down to sale price" begins at full price. (Fixes "lift is on floor 1 but car starts at 0".)
> - **Baggage Scale — no more watch-the-tilt cheat:** in `BalanceBeam`, while actively setting x the beam stays **level** and the left pan shows the EXPRESSION (`2x`), with a neutral "Set x, then weigh". It only tilts AFTER Weigh (or in the teaching walkthrough — both `disabled`), showing **"Balanced ✓ / Overweight — too heavy / Underweight — too light"** (wrong weigh tips, then glides to balanced to reveal the answer). Copy updated to "work out x, set the dial, then Weigh".
> - **Order of Operations:** "dial"→**"drag"**; the do-first **portion highlighted in gold parentheses** via `markPortion()` (brackets → exponent → first ×/÷), e.g. **(12 ÷ 2)** + 3 = ?.
> - **Taxi Meter:** `@` → **`where`** in the fare badge (`3x + 2 where x=4`).
>
> ### D. ⚠️ NEEDS-YOUR-APPROVAL / next (deferred — didn't spend allowance or over-build)
> - **Bespoke simple painted backgrounds** (12, ~1.5 Higgsfield credits each) to replace the faint-emoji motifs with real sweet-simple themed art. Needs your credit allowance. (Sky Tower's earlier detailed cutaway PNG is unused — was too cluttered per your feedback.)
> - **Deep custom themed interactive OBJECTS** — instruments are re-labelled/re-tinted but still the generic mechanics (thermometer→balance meter, dial, beam…). Building true object-widgets (a receipt, a suitcase on the scale, tiles laid, a taxi-meter face) is significant per-chapter work — do chapter-by-chapter when back.
> - **COMMIT + push** this whole batch when you're ready (it's all uncommitted; `tsc`+tests+build green). Then the usual prod checks.
> - **Open thread:** the founder's message had a "point 3" that got cut off (twice) — never received; ask what it was.
>
> _(everything below is prior sessions — still valid)_

> 🚢 **2026-07-05 — WHOLE BATCH SHIPPED: `main`@`a8296b4` → Vercel production deploy READY (live on `milo-story-mode.vercel.app`).** Everything below (this session's Safari fix / tutorial + blackboard / laptop sizing / resume-difficulty / warm-up, PLUS the earlier uncommitted multi-session batch: full 12–14 game fan-out, tutorial engine, US-English sweep, counting overhaul, diagnostic, grades, day-streak removal, security/devops) is now committed and pushed. `tsc` + `npm test` 21/21 + `next build` all green before push.
> - **Deliberately NOT committed:** `labs-demo/` (separate standalone Vite/Three/MindAR project, 506MB incl. its own node_modules — deploys to its own Vercel `labs-demo-jade.vercel.app`; keep it out of the app repo / give it its own repo) and `public/_voicetest/` (7.7MB voice A/B WAVs — **deleted**).
> - **Migrations status:** ✅ **streak pair APPLIED to prod (2026-07-05)** — `sync_session_drop_streak` (ledger `20260705161254`: `sync_session` no longer reads/writes streak) then `drop_streak_columns` (ledger `20260705161328`: `current_streak`/`longest_streak` dropped from `learner_stats`). Verified: 0 streak cols remain, `sync_session` intact, no new security-advisor warnings. ✅ **`profile_role_teacher` also APPLIED (2026-07-05)** — `user_role` now `{parent,learner,teacher}`, `profiles.role` nullable + no default (new signups get NULL → one-time Teacher/Parent picker; existing users grandfathered as parent). ✅ **`diagnostic_leads` APPLIED (2026-07-05, after explicit founder sign-off)** — the cold-funnel lead table. Verified: RLS on, **INSERT-only** policy, `anon`+`authenticated` granted **INSERT only** (no SELECT/UPDATE/DELETE → leads can't be read/enumerated via the API, service-role/dashboard only). Security advisor: no new warning. Residual risk = spam inserts only (mitigate later with a captcha; Supabase Auth rate limits help). **→ ALL FOUR pending migrations are now applied. Nothing left in the migration backlog.** NB: MCP-applied migrations get their own ledger timestamps, so the DB ledger versions differ from the repo file names (established pattern here; the deploy pipeline is inert, so no `db push` conflict).
> - **Still needs a human on prod:** signed-in tap-through (auth-gated flows can't be verified headlessly); confirm `public/sw.js` `VERSION` bumps each deploy.

_Last updated: 2026-07-27 (LATEST — see the top 🛟 block. **The support + per-user error layer, SHIPPED — `main`@`3492abe`, prod sw v68, smoke green.** It answers a founder question rather than a bug: *how does a company give support, and how do you manage an error for a SPECIFIC user*, asked by someone who does not read code. The diagnosis is the useful part: **this app is local-first, so the failures a parent actually writes in about leave no server-side trace at all** — a wedged offline queue, a stale service-worker shell, IndexedDB blocked in private browsing. The only time this repo ever diagnosed one (the Safari `upgrade-insecure-requests` boot failure) it was by hand-adding beacons to the service worker, which does not repeat on a stranger's iPad. So the user now carries the evidence to us on purpose: a "Need help?" panel attaches a device snapshot — sw version, kv mode, queue depths, recent errors — to a support email. Three things that were previously unobservable are now visible: **`kv.mode()`** (the IndexedDB fallback was module-private, i.e. the most likely cause of "her progress vanished" could not be seen), the **sw VERSION reply** (stale-shell detection), and **`learnerId` on every client error** (a log stops being an anonymous pile of stack traces). Plus capture of `window.error` and `unhandledrejection` — the classes the React ErrorBoundary never sees, and the class that Safari failure actually was. A **daily cloud health check** now curls prod and reads Vercel + Supabase, instructed to answer in ONE line when healthy because a daily wall of green trains you to stop reading it. **Sentry deliberately not added** — Vercel already captures both seams and is queryable; a vendor at ~0 users is cost with no consumer, and the identity work makes adopting it later a config change. ⚠️ **The A2 story batch is still uncommitted and was deliberately left that way** — this shipped as 9 files with zero overlap. ▶ Open: the support promise *"we reply within 2 working days"* is now ON SCREEN against an inbox nobody checks daily yet; **COPPA parental review/deletion still has no defined path**; and the daily check's own report has never been read by a human. _(prior footer follows.)_)_

_Prior update: 2026-07-27 (**A2 done, then the picker came out and the static objects went: StoryTime and MarketDay are now one continuous run of living creatures.** Three asks that turned out to be one idea in stages — make the arithmetic MOVE, stop making the child choose a world before they know what they are choosing, and then make the thing that moves something that *can* move. **A fruit cannot arrive**; it can only be slid across the picture like a cut-out being dragged, which is exactly what the first ask had just asked it to do. So joiners now travel in from off-frame and leavers travel out (movers own the RIGHT-hand end of the row, the only direction that never walks something through the group being counted); the world picker is gone from all three rebuilt chapters, with the SETTING carried on the round so it changes every question; and both casts are entirely drawn cycles — Coral Reef · Sandy Shore · **Moon Base** for story problems (finally spending the orphan astronaut and alien sheets), PENS of chicks · PATCHES of bees · NESTS of birds for multiplication. ⚠️ **Three faults it turned up were already in production**, all the same class — a percentage of the height guessing at a gap it should have measured: two answer boxes sitting 29px and 33px inside their own button rows, and both chapters drawing a second prompt pill on top of SkillBeat's. ⚠️ **And `SheetSprite`'s walk-in had been skating since the day it was written** — one flag gated both the transform target and the leg cycle, so a creature walked on the spot through its delay then slid the whole distance with its legs parked; travel now lives in a shared `Arrive` that hands its child a `moving` flag. Two rules banked in [chapter-craft.md](docs/chapter-craft.md): **size a creature by AREA, not height** (aspects run 0.457 to 1.746; ten aliens came out as 18px slivers) and **a travel distance inside a scaled container must be relative, not px**. ⚠️ Most of the verification time went to an instrument trap: **the browser pane's tab is hidden except during a screenshot, and a hidden tab freezes CSS transitions and rAF outright** — a `MutationObserver` plus a transform-TARGET read is what actually proves the invariant. `tsc` 0 · 142/142 vitest · `next build` · 0 console errors. ▶ Still nothing committed; next is A3 HopAlong, whose planned "Farmyard" world now clashes with MarketDay's Farm. _(prior footer follows.)_)_

_Prior update: 2026-07-27 (the 🎞️ block — the audit, the art and SeesawPark. **The 6–8 band re-thought against the 3–5 animation criteria, 10 new drawn cycles generated before the Higgsfield month expired, and the first chapter (SeesawPark) rebuilt. ⚠️ NOTHING COMMITTED — prod is still `main`@`5966de3` / sw v67.** `tsc` 0 · 142/142 vitest · `next build` · 0 console errors. **The audit's finding in one line: the whole 6–8 band's animation vocabulary is TWO keyframes — `_float` (Milo bobs) and `_pop` (an object scales in). Nothing travels, nothing has a cycle, all 12 chapters answer by tapping 1 of 3 chips.** [docs/story-6-8-rethink.md](docs/story-6-8-rethink.md) is now the standing spec: a verb per chapter, the A/B/C build order, and the founder decision that **6–8 goes landscape-only**. **One live defect found: SeesawPark was hot/cold** — the beam tipped toward the bigger side 400ms BEFORE the child answered and the heavier pan glowed, so the chapter was winnable without ever comparing two numbers. Fixed and verified by measurement (Δ0px level → `rotate(7deg)` on commit), and a **beam arrest** was added because a scale sitting dead level just looks faulty — the same latch problem that deferred MeasureIt's weight world. **Art: 10 sheets for 75 credits, zero retries**, closing the parade's long-parked 9-creature item plus Milo's HOP; `scratchpad/chroma.py` now DERIVES green-vs-magenta per subject and reproduced every case earlier sessions paid for. ⚠️ **A hop is not a walk and `Critter` cannot carry one** (coiled 9 of 12 frames), which corrected my own plan for HopAlong. ⚠️ **And the bug worth carrying: the new walk-on played on round 1 and was DEAD for rounds 2–10**, because React reuses those sprite elements so `arrived` survived — invisible to a single check, caught only by a `MutationObserver` logging zero mounts. **Verify an animation on the SECOND round, never the first.** ▶ Next: A2 StoryTime + MarketDay onto `critters`, then A3 HopAlong. The 10 new `fps` cadences are unverified by eye; 524.7 credits expire ~2026-07-30 with no named consumer left. _(prior footer follows.)_)_

_Prior update: 2026-07-27 (the ✂️ block — the over-engineering audit, SHIPPED. **A repo-wide over-engineering audit, then the two biggest cuts taken and SHIPPED: `src` is 62,489 → 57,255 lines (−5,234, 8.4%), 34 routes → 22, 9 deps → 8.** Deleted the parked **`/play` AR track** (10 webcam mini-games + `src/infra/ar` + 3 `/play`-only UI components, −2,923 lines and `@mediapipe/tasks-vision`) and **`/kit-preview`** with the 9 pre-GameShell teen components only it imported (−2,311). **The two cuts were not the same risk:** kit-preview called `notFound()` in production so those components were never in a prod bundle — provably zero; `/play` was genuinely LIVE (200), and `git log -S` showed a "Hand Games" menu link existed until `a8296b4`, so *"unlinked now"* is not *"was never reachable"* — **check the history, not just HEAD.** A `/play → /menu` redirect was offered and deliberately declined as the same speculative flexibility the audit was cutting. **The one real finding the deletion produced: `Permissions-Policy` still granted `camera=(self)`** for AR that no longer exists — now `camera=()`, verified on a running server, with the other five hardening headers byte-identical. ⚠️ **Two instrument failures worth carrying:** a curl probe grepping the body for "could not be found" reported `/play` already dead — but that string ships in EVERY Next route's HTML shell (`/menu` and `/story` match it too), so only the HTTP status means anything; and an inline zsh-quoted grep silently matched nothing and flagged every file in `src` as an orphan — **a sweep that flags everything is a broken sweep.** Also: deleting a route leaves stale `.next/dev/types` validators that fail `tsc` while the code is fine. ▶ **The audit found more than was taken** — two walk-cycle sprite engines where Pixi's `ParadeStage` has exactly ONE caller (~839 lines + the `pixi.js` dep), the cut-out puppet rig now *proven* dead (~485 lines, all 6 `RIGS` keys have a `SHEETS` entry so frames always win), unlinked `/daily` (256), and 99 redefinitions of `shuffle`/`pick`/`rint` (~90, of which 15 are the biased sort-random). `docs/ar-phase0-brief.md` now describes deleted code. _(prior footer follows.)_)_

_Prior update: 2026-07-27 (**Short-landscape swept across the 17–18 band — the last open item from the 🎡 block — and the band itself is CLEAN: 156 measured screens, 0 failures.** No clipping, no overlap, no h-overflow, nothing under the 24px operable floor; tightest control is a 31×31 stepper, in line with 15–16's stated ceiling. **The one real defect was in `ExploreStep`, shared by ALL 37 teen chapters, so it is not a 17–18 regression** — at 640×320 it was 2.7 screens of content with "Skip to the game →" **504px below the fold**, invisible to every prior check because it scrolled rather than clipped. ⚠️ **My first fix was wrong and the arithmetic killed it**: wrapping the sim in `FitBox` gives a 0.37 scale, i.e. 13px sliders — *scale-to-fit is not reflow*, the rule this repo already learned in 15–16. ⚠️ **And the founder caught me hiding text twice** (the intro, then the sim's closing paragraph) — height comes out of the visual and the chrome, never the prose. **The generic CSS override was wrong in kind**: it guessed "first child is the visual", which is false for SequenceExplorer and WaveExplorer, so each of the 21 sims now DECLARES its visual via the new `SimLayout`. Two CSS traps banked: a grid spanner's surplus height distributes across every track it spans (97 "empty" rows at 1.33px each inflated a 140px sim to 209px), and a backtick in a CSS comment silently ends a JS template literal (three build breaks). Tall frames verified unchanged across all 25 explore chapters — that check caught a real width regression before it shipped. `tsc` · 142/142 vitest · `next build` · 100/48-skipped/0-failed + 52/52. ▶ **On a branch, NOT pushed, NOT deployed** (prod still `main`@`413414a` / sw v65); the gate samples only the first scored question per run; nothing checked on a real device. _(prior footer follows.)_)_

_Prior update: 2026-07-26 (see the top 🎡 block. **🚀 SHIPPED — `main`@`a7ad21d`, prod serving sw v65, fast-forwarded and pushed; smoke green on all 13 chapters and driven live on prod.** **The 17–18 band is COMPLETE — 13 of 13**, and `BESPOKE_CHAPTERS` now holds only 3–11 story chapters, so every teen chapter in the app runs on GameShell. The engine wave landed three primitives in gameKit — **`MatrixPad`** (the answer IS a matrix), **`CurveMatch`** (LineSetter generalised from a line to a wave), **`CircleTap`** (the read-only unit-circle sim promoted into an answering instrument) — then the last three chapters: **The Big Wheel**, **Daylight Hours**, **Two Receipts**. The plan's fourth item, lifting `RayLine`, was deliberately skipped: the two chapters that want it have already shipped with working answer surfaces, and none of these three needs it. `tsc` · 142/142 vitest · **16 question kinds each forced to the surface and driven by hand to `solved`**. **A third chart scaled to the wrong range**: CurveMatch drew ±7 about the centre when a daylight year lives at 12±5, so the whole target sat above the top edge and the child had nothing to match — the same bug as Cold Snap's ends and the exponential's sixth month, and all three graded correctly while being unreadable, so no gate could see any of them. **And 56 taps to build one matrix** — caught by watching, fixed by starting the pad at the first operand, which also models what addition is. **The picker budget landed exactly on 10**, the number plan §3 set and risk #4 warned would creep. **The full gate ran: 38/38 in 23.9m, zero failures and zero flakes.** ⚠️ And a standing claim in this file is too pessimistic: prod strips `data-test-*`, but the board's **`SOLVED ✓`** label is grade-derived and visible — a correct build showed it on prod and a deliberately wrong tap did not, so a correct grade IS observable in production. What prod still cannot give is the machine-readable hook, so the sweep still needs a dev build. ▶ Short-landscape still unchecked band-wide; thirteen chapters of wording still unread by a teenager; the voice corpus still the top job overall. _(prior footer follows.)_)_

_Prior update: 2026-07-26 (the 📱 block. **🚀 SHIPPED TO PROD — `main`@`a81bc43`, prod serving sw v64, fast-forwarded (no merge commit) and pushed. Smoke green on `/` `/menu` `/api/health` `/diagnostic` `/auth` `/parent` and all 10 migrated 17–18 chapters, then DRIVEN LIVE ON PROD in portrait.** Portrait is now a real layout for **12–18**, not merely an allowed one. It always rendered — there is no rotate gate in the teen path — but **every size in the teen shell is `clamp(px, vw, px)`, width-derived with no vh term**, so a tall frame landed on the clamp MINIMUM everywhere while its height went unused: a 390×844 phone drew **76×60 tap buttons at 24px with 204px of dead space below them**, and a 834×1194 tablet was worse, because 834 ≥ 820 made it `roomy` and **pinned the chalkboard into a corner with the bottom third of the screen empty**. One gate — `portrait = innerHeight >= innerWidth × 1.2` — with three consequences: `roomy` excludes portrait (the board stacks instead of pinning), `FitSlot` may now ENLARGE (its `max: 1` cap was the thing blocking it, and lifting it fixes ~19 instruments and 24 scenes without touching one of them), and `AnswerPad` gains a vh term. Phone pad is now **98×84 at 34px**, a 61% bigger target. **Two things measurement caught that the formula did not:** the first vh coefficient came out UNDER the clamp floor and changed literally nothing while looking plausible, and the bigger buttons then wrapped **3 + 1**, leaving a lone tap target — now a 2×2 grid. Landscape is unchanged by construction and was measured anyway (640×320 and 1280×800 both byte-identical). ▶ **This is 12–18 only** — the 3–11 story band keeps its `RotateGate` and is landscape-only by design. Not checked on a real device. **The full gate has now run: `question-quality` 35/35 in 21.0m, zero failures and zero flakes** — the run the merge was waiting on, because the portrait commit touches `GameShell`/`gameKit`, shared by all 24 existing teen chapters, and its 1280×820 viewport is exactly the landscape surface the change had to leave alone. **A git trap nearly mis-split the commit and is written up in §④:** a pathspec that is a DIRECTORY commits the working tree under it and ignores the index, so `git commit -- src/…/teen/games` swallowed the portrait changes to `games/parts/*` despite an explicit `git reset` — caught by grepping `git show --stat` before moving on, and the 2026-07-23 git note has been amended in place. **Driven on prod at 390×844**: Cold Snap through explore → walkthrough → scored round 1 with the portrait layout live, and a deliberately wrong answer (`↘↗` on `3x⁴`) **corrected to `↗↗` on screen** by the glide; 0 console errors. ⚠️ Prod cannot prove GRADING — `data-test-*` is compile-time stripped from production builds — so that assertion rests on the 35/35 e2e run against a dev build of identical code. **Nobody has played any of the ten chapters, and none of the wording has been read aloud to a 17-year-old.**)_

_Prior update: 2026-07-26 (the 🌡️ block. **✅ COMMITTED in `4539b2d`, folded in with the 🎛️ session below — one workstream, and the two share registry.tsx and the e2e spec. Not pushed.** The four no-primitive 17–18 chapters were built — **Cold Snap** (polynomials), **The Balance That Grows** (exp/log), **Torch on the Wall** (conics), **The Reviews** (stats) — taking the band to **10 of 13**. `tsc` · 136/136 vitest (was 128) · `next build` · e2e question-quality 4/4 on the new ids · every question kind driven by hand and asserted on `data-test-phase`, 0 console errors. **The picker budget is holding at 6 of ~10** across ten chapters, and two of those were bought back by re-asking rather than re-wording: Torch's classify needs **no card at all** — the tilt IS the classification, which beats the plan's own design — and its ellipse-orientation two-carder became "how far does the beam reach". Reviews lost two conceptual MCQs to one gesture. **Two real bugs, both found by looking, both the same root cause:** a chart scaled to its data's RANGE rather than to the feature being read — Cold Snap's polynomial ends squashed the dip below freezing, and the exponential's sixth month pinned the target line to the floor. A first fix clamped instead of clipping, which made the curve flatten along the top edge, and a saturated exponential reads as a balance levelling off — the opposite of the point. **Two instruments deliberately withhold a number** (the month dial does not print the balance at the marker; the review slider does not print the running average until reveal) because a dial that confirms the answer is hot/cold. ▶ Next: the engine wave — `MatrixPad`, `CurveMatch`, `CircleTap`, and lifting `RayLine` — which is the only thing blocking the last three chapters. Short-landscape still unchecked across the whole band; ten chapters of wording still unread by a teenager; the voice corpus still the top job overall, quota resets tomorrow.)_

_Prior update: 2026-07-26 (the 🎛️ block. **✅ COMMITTED in `4539b2d`; still not shipped.** Prod is still `main`@`9800be3` / sw v63. The 17–18 band was designed onto GameShell and **6 of its 13 chapters built**: complexNumbers (The Walk Home, the pilot), sequencesSeries (The Training Block), introCalculus (Pace), rationalFunctions (Share the Wifi), functionToolkit (Photo Filters), quadraticAnalysis (The Resale Flip). `tsc` · 128/128 vitest · `next build` · e2e question-quality 6/6 with 0 console errors · every chapter driven live. **The design rests on one measured finding:** the band reads 40 numeric vs 57 string answers, which looks like a quiz waiting to happen — but most of those strings are structured numbers wearing a string costume, so the rule is tap a number → BUILD the value → pick a card LAST. Six chapters in, **2 pickers**. The founder's correction reshaped the worlds: the first list was professional (patch bay, radar, ops board) and became daily life (photo filters, a Ferris wheel, two receipts, a torch on a wall); [curriculum-12-18.md](docs/curriculum-12-18.md) carries a dated amendment so spec and code do not disagree silently. **Three bugs found by driving the pilot** — a compass arrow that never turned (a MotionValue string fed to `rotate`), then the same arrow lagging a whole heading behind, then a scene deriving its route from a step index that is global across worked examples. **A gate was wrong too:** mutation-testing showed `paddedQuestionContext` detecting correctly but naming the WRONG task, because a two-line task keeps its title outside its own chunk; fixed. ⚠️ **The e2e proves less than it looks here** — it breaks at the first instrument question, so grading was hand-driven on every surface, asserting `data-test-phase`. And I deleted a wrapper before extracting its inline sim, exactly as the plan warns; recovered from git. ▶ Next: the engine wave (`MatrixPad`, `CurveMatch`, `CircleTap`) that unblocks the last three. Nothing checked at short-landscape; no new wording read aloud to a teenager. Still the headline: ~zero real users.)_

_Prior update: 2026-07-26 (the 🎓 block — the 15–16 clarity pass. **SHIPPED — `main`@`eb96a72`, prod serving sw v63, smoke green and driven live on prod.** `tsc` · 116/116 vitest (was 91) · `next build` · **e2e question-quality 25/25 across BOTH teen bands, 0 console errors per chapter.** The question was whether the 15–16 chapters have the same structure as 12–14. They run the same `GameShell`, and their two real differences — no guided round, an explore sim per chapter — are deliberate. **But the "explaining-type" wording pass of 2026-07-24 never reached the band**, because 15–16 had been rebuilt five days earlier: five of its twelve chapters carried no `context` at all. That is not cosmetic — `QuestionBoard` goes structured the moment `context` OR `instruction` is set, structured mode never renders `prompt`, and `GameShell` sets `instruction` from `padInstruction` on every padded question, so each of those tasks' carefully written story sentence **was dead code** and the child saw a badge and a tap chip over an empty zone. 19 context lines added across 8 files, padded tasks only. **Two things I got wrong and had to fix:** my own first draft carried the very defect it was repairing — Leaderboard told a child two changes "partly cancel out" when the live seed drew 4 and 5, both positive, because `a` and `b` are independently signed (three more sign-dependent claims found in the same audit; **a generated sentence must be true for every seed its generator can draw**). And the new gate passed on its first run, so it was mutation-tested — **two planted regressions walked straight through it**, one because the task delimiter missed every task written `title: …, badge: …`, one because it matched `context:` only and so reported GearLab's shorthand `context,` as a false defect I nearly reported as real. Both fixed; 7/7 mutations now caught. Also widened PowerUps' power-of-a-power off base 2, where every answer it ever produced was a power of two. ▶ Next: **the voice corpus — quota reset 2026-07-27** and the whole 3–11 band still has zero clips; and **19 new sentences went to production unread by a human**, which is the one thing no gate here covers. Still the headline, still unchanged: ~zero real users.)_

_Prior update: 2026-07-26 (the 📏 block — the measurement chapter. **SHIPPED — `main`@`1e129ab`, prod serving sw v62, smoke green and driven live on prod.** `tsc` · 91/91 vitest · `next build` green, 0 console errors in a fresh tab, driven live at 1024×620 and 640×320 in both worlds. **The measurement chapter was re-thought and rebuilt: the verb is MEASURE IT.** The old one was *tap the taller one* — chapter 5 with a different adjective on it — and reading the file made it worse: height was faked by uniform-scaling one sprite (so "taller" was really "bigger"), length was a non-uniform stretch, and the balance tipped toward the heavier side BEFORE the child committed. Now the child lays one repeating block end to end against the thing and decides when to stop; a ruler is nothing but a repeated unit, counted, and that is the one idea measurement has that counting and comparison do not. The thing and the run agree by CONSTRUCTION — a thing's unit count is its identity, so it is drawn at exactly `units × unitPx` — verified on screen at Δ0. **Weight is deliberately not a world**: any beam that responds while you add counters levels exactly when the count is right, which hands the answer over before the commit. Four real bugs found by driving it, and the general rule for each is now in the craft doc — a demo that raced past in 4s because `speakSteps` advances on utterance `end` and a one-word utterance ends instantly on a voiceless device; the thing being measured jumping a whole unit when the first block landed, because a lane that will fill must be reserved from empty; a contact shadow left in flow putting the two ends of the measure 28px apart; and 22px blocks on a landscape phone, now 39px. The gate passed first run so it was mutation-tested — three planted regressions caught, one survivor CHECKED and found genuinely inert, and the gate then caught a real consequence of the band change and was restated rather than relaxed. ▶ Next: **the six colour clips — the ElevenLabs quota resets 2026-07-27** (this line originally read "has now reset", which was wrong: it was written on the 26th), and the colouring chapter's toy-room test is still unanswerable on a silent device. **3–5 is now complete: all eleven chapters rebuilt.** Still unchanged and still the headline: ~zero real users, and nobody has watched a child play any of it.)_

_Prior update: 2026-07-25 (session — see the top 🎨 block. **SHIPPED — `main`@`f44ce11`, prod serving sw v61, smoke green and driven live on prod.** `tsc` · 79/79 · `next build` green · 0 console errors in a fresh tab. Group B rebuilt so each "exact form" chapter has its OWN VERB — **Shape House is a shape sorter**, **Bead Shop is one string that gets longer**, **the Colouring Book is a real colouring game** on a genuine flood fill. Then the founder re-cut the colouring chapter: **one page TEACHES the six colour words, a second page TESTS them** — and the split is what makes the score mean anything, because a garden is full of things with one true colour (so it can answer for the child) while a toy is whatever colour it was made (so only the spoken word can). Five founder catches followed, and every one was invisible to checks that had passed: a tulip that silently ate 40% of taps aimed at it (the ink is a wall, and the rescue sat *behind* the bail-out written for it); a glow too faint to see on a small shape; *"That's the tulip!"* said to a child who tapped a tulip; "colour the cloud purple" asked of a white cloud; and a ghost house drawn as a wireframe, then standing in front of a fence painted into the backdrop. **The real lesson is about testing** — every script I wrote tapped each target's stored probe point, its dead centre, the single easiest tap on the page, so the mechanic was only ever verified where it could not fail. ▶ Next: **the six colour clips.** Confirmed in the code this session that the ENTIRE 3–11 band has zero recorded audio — the 435 clips are teen-only, because the extractor's file list is teen-only — so this chapter runs on browser TTS that many Chrome installs simply do not have. On a silent device the lesson still plays but teaches nothing, and the toy-room test is *unanswerable*, which is the price of making it an honest test: a picture that cannot answer for the child cannot rescue them either. ElevenLabs quota resets 2026-07-27. Then measurement — the last 3–5 chapter — asking its verb first.)_

_Prior update: 2026-07-25 (the 🐾 block. **Shipped to prod, `main`@`3c391b6`, sw v60, driven live on prod:** three more 3–5 chapters moved onto the creature engine — **addition + subtraction as one shared Play Time** (creatures walk IN to join or OUT to leave, so the operation itself is the thing that moves) and **comparison as Bigger or Smaller** (tap the bigger bunch, it walks off with Milo, the other stays). **But the bigger find was the motion:** the founder said the animation looked too fast, and measuring showed `travelMs` clamped every duration to 2400ms while a 60%-of-screen journey wants **5–10 SECONDS** at a walking pace — so every long journey had the body covering ground **2–4× faster than its legs**, band-wide, for months. Each chapter computed a `cycleScale` for the showy march and passed a bare `1` for ordinary journeys, so **the ordinary ones were the ones that skated**. `journeyOf` now returns `{ms, cycleScale}` together and **`travelMs` was deleted rather than documented** — a duration without its correction IS the bug. Cadence calmed ~28%, ceiling 2400→3600ms, sprite cap 140→230px (a PACING number: on a clamped journey the cycle is `ms·STRIDE·h/dist`, so cadence cancels and only height reaches it). **Two lessons about checks:** a sweep must import the SAME layout function the scene renders from, and must be DERIVED FROM THE CHAPTER'S OWN GENERATOR — twice a hand-written grid failed on screens no child can reach, and both times the test was wrong, not the code. **And the one the sweep could not see:** three rows in a 58px band buried the creatures, because the check only compared same-row pairs — *rows are only room if the rows are visually separate*. ▶ **Remaining in 3–5: shapes · colors · patterns** (augmentations, not rebuilds — keep the exact SVG/hex core, add a travelling creature and the arc each name already promises), then measurement. **Nobody has watched a child play any of it** — the burial was invisible to every passing check and only showed up on screen. **And still the headline, still unchanged: ~zero real users. Watch one real child play; start the attorney conversation.**)_

_Prior update: 2026-07-24 (chapter 2 (number order) rebuilt as **🦆 Follow the Leader** and shipped with the previously-uncommitted **🐣 Nest Tree**, `main`@`02f5437`, sw v56. A stepping-stone version was built and thrown away first, producing the rule the whole 3–5 band now runs on: **a numbered PROP cannot blend into painted art and cannot be alive before it is tapped — make the numbered things CREATURES.** Six founder corrections drove that session — the moonwalk, the pile-up, the cut-off leader, the shadow outrunning the feet, the frozen slide, and travel too fast to see — and every one traced to the same root: **a walk cycle and the travel it belongs to must be given the SAME number**, and **layout must be invariants, not constants that happen to hold at 1024×600**. Milo also gained his first drawn walk cycle there, kept from the rejected build — chapter 4 is what finally uses it.)_

_Prior update: 2026-07-23 (THIRD session same day — see the top 🔊 block. **Milo now has a real recorded voice in the teen game bands, live on prod**: 605 ElevenLabs clips (16 MB) covering every static spoken line in 12–14 + 15–16, THE PLAN in all 24 chapters (reconstructed from JSX, so no chapter carries a duplicate string that can drift), and 25 of 41 scored-question prompts stitched from 172 fragments. Browser speech remains the fallback everywhere and any miss degrades to it cleanly. Also cut 39 spoken correct-answer cheers — wrong-answer lines deliberately kept. `main`@`227ece5`, prod serving **sw v43**, post-deploy smoke green. **⚠️ NOT ONE OF THE 605 CLIPS HAS BEEN HEARD BY A HUMAN** — everything was verified structurally, which is not the same as sounding right, and the stitched prompts either sound natural or audibly broken at the seams. Play one 12–14 chapter to the scored questions. Budget is spent (~38.5k of 40k, resets 2026-07-27) and a voice change costs the full corpus again. **Still the headline, still unchanged by any of this: ~zero real users. Watch one real child play; start the attorney conversation.**)_

_Prior update: 2026-07-21 (Shipped: 15–16 responsive across 144 measured screens + a recurring Safari-class SVG-attribute bug; the diagnostic made evidence-grade (fail confirmation + play-data plan revision, 175/175 planted gaps exact); durable auth-event logging. Removed at founder request: the 12-agent roster and docs/agent-log.md — do not spawn named specialists. **⚠️ THE HEADLINE IS NOT ENGINEERING: excluding dev accounts the product has 3 accounts, 2 learners, 6 sessions, 0 DAU/WAU/MAU, 0 signups in 30 days, 0 recorded gap closures.** The next two actions are human — watch one real child play, and start the attorney conversation (no privacy policy/ToS/COPPA exists; it blocks launch AND charging and has the longest lead time). Deliberately unfinished and documented in place: centring the board on instrument questions (measured pushing the commit button off-screen; a `tall` gate is written but unverified at 1440×900).)_

_Prior update: 2026-07-19 (third update — the ENTIRE 15–16 band (12/12 chapters) rebuilt and LIVE on `main`@`aea76a5`, prod sw v38. Single-number answers are tapped with misconception distractors; an instrument is kept only where the answer is a PAIR or a construction; the guided round is gone and every graded gesture is worked in the walkthrough. Six chapters whose WORLD gave out at their hardest operation were rebuilt mechanically, not clamped (ruling bench, signed tiles, shared bill, climb route, level counter, protractor). ⚠️ MOST IMPORTANT: I shipped a bug that marked every correct answer WRONG in a padded chapter and my own live check passed it, because a wrong answer still ADVANCES — verify on `data-test-phase`, never on the screen moving on. Fixed via `GameConfig.padValue` + a gate proven to fail on the real bug. NEXT: extend the question-quality E2E spec to the 15–16 ids (would have caught it automatically), then short-landscape — nothing in this band has been checked there.)_
<!-- prior: 2026-07-12 — full `milo-math-mentor` audit of the 12–14 band, then live-game correctness + structure + coverage fixes + the question-clarity 3-zone rollout to all 12 chapters — ALL UNCOMMITTED.** Key discovery: the twelve `*TeenLesson.tsx` `makeRound` generators are ORPHANED (the child plays the GameShell games), so fixes were redone against the LIVE games. Fixed: FunctionFactory false-arithmetic reteach, JuiceBar identical tiers 2/3, WeatherStation debt-framing, NightFlight L1≈L2 (+ new translate task), BuildSite L3⊂L2 (+ CLOSED the circle coverage gap via answers in terms of π), CableCar/linearRelationships keystone rebuilt (distinct tiers + non-dial tap tasks: is-it-a-function + read-a-graph), and the `m.exponentsRoots ← i.decimals` graph edge (doc + code). Question-clarity `context`/`instruction` added to all 11 remaining chapters (10 parallel agents + CableCar). `tsc` + **26/26 tests** clean; headless invariant tests + live browser drives, 0 console errors. NEXT: commit the whole batch (this + the 07-10 SkyTower pilot) + bump `public/sw.js` v20→v21 + deploy.)_ -->

_Prior update: 2026-07-09 (NEW: **12–14 band — 3 things SHIPPED across two commits.** (1) Teaching layout reworked so the **explanation stays on screen the whole walkthrough** with the **baby steps on their own chalkboard** above the illustration, no-scroll (`081e6c6`, sw v19). (2) An **explainer-VIDEO experiment** (Higgsfield, scrub-by-step) was tried on Sky Tower then **REVERTED** — the code illustration looked better; video infra fully stripped. (3) **Framer Motion smoothness across ALL twelve 12–14 `TutorialScene`s** (spring-driven, `useReducedMotion`-gated, numbers tick) + a permanent **"Solve it"** cue and the **question written out** on the practice/guided board (`51d910e`, sw v20). `tsc` + **26/26 tests** + `next build` green throughout; verified live desktop + mobile, 0 scroll. **All on `main` → Vercel prod READY (prod `sw.js` v20, smoke 200s).** See the top 2026-07-09 blocks for full detail. NEXT: optional signed-in tap-through on prod of the 10 Framer scenes not personally driven end-to-end (SkyTower + EventBudget were; all are tsc/build-clean + pattern-identical).)_

> 🎯 **RESUME HERE (next session) — two threads:**
> **(A) SAFARI "GAME NOT LOADING" — TRUE ROOT CAUSE FOUND + FIXED IN CODE (2026-07-05 pm). One manual step left: clear localhost website data in Safari, then confirm.**
> - **Symptom:** in Safari (localhost:3017), the app sat forever on the 🦊 splash. Chrome fine.
> - **TRUE root cause (proven, supersedes the earlier stale-SW theory):** the enforced CSP in `next.config.ts` included **`upgrade-insecure-requests`**. On plain-`http://localhost`, **Safari (unlike Chrome, which exempts loopback) rewrites EVERY subresource to `https://`** → the plain-HTTP dev server can't answer TLS → **zero JS/CSS ever loads** → no hydration, SSR fox forever. Proven by proxying the dev server on a fresh port and watching Safari hammer the plain-HTTP port with TLS handshakes for every chunk. Shipped with the 07-03 security pass — which is exactly when Safari "stopped loading." Also would have broken **LAN-IP testing (http://192.168.1.35:3017) on iPhone/iPad Safari**.
> - **The stale-SW theory was WRONG:** a boot beacon from the user's real Safari showed `navigator.serviceWorker.controller` was **null** — no SW ever controlled the page. (Kept all the SW hardening anyway — it's good robustness.)
> - **FIX (shipped, in `next.config.ts`):** `upgrade-insecure-requests` is now **production-only** (`process.env.NODE_ENV === 'production'` spread). Prod is https so it stays. Dev CSP verified clean via curl.
> - **⚠️ STICKY LEFTOVER → the one manual step:** Safari **caches the upgrade decision per host:port**, so `localhost:3017` keeps auto-upgrading even after the header is gone. **Do once: Safari → Settings → Privacy → Manage Website Data → search "localhost" → Remove All → quit + reopen Safari → reload localhost:3017.** This also flushes Safari's HTTP cache of **mixed-build dev chunks** (a captured beacon showed a Turbopack "module factory not available" rejection from a stale cached react-dom chunk — the secondary hydration blocker after the CSP fix).
> - **VERIFIED:** (1) Playwright **WebKit** (same engine, clean profile) fully boots the app on 3017 — hydrates, redirects to /diagnostic, renders (repro script: session scratchpad `wk-test.js`). (2) The **user's real Safari**, on a fresh-origin port proxy after the fix, executed app JS and booted `/diagnostic` (beacons: `boot ctrl=0`, `window-load`). (3) Chrome preview regression-checked clean (boots → age picker, zero console errors). `tsc` green.
> - **TEMP DIAGNOSTICS still in the tree — REMOVE before commit:** `public/sw-register.js` has a clearly-marked "TEMP DIAGNOSTIC" block (beacons `fetch('/api/health?swdiag=…')` + window error/unhandledrejection reporters + readyState/load beacons; localhost-only). Delete that block once Safari is confirmed working after the manual clear. The rest of the file — the **localhost SW self-heal** (unregister all SWs + delete all `caches` keys + one sessionStorage-guarded reload if a SW was controlling, every step timeout-raced at 2.5s so wedged Safari storage APIs can't hang it) — is REAL and stays.
> - **Also keep:** `src/app/layout.tsx` — sw-register `<script>` no longer `defer` (must run mid-parse so the self-heal works even if the doc never finishes); kv.ts 2.5s IndexedDB timeout + StorageGate 4s boot timeout from earlier (robustness).
> - **CSP note for the strict-policy roadmap (docs/security.md):** WebKit Report-Only run showed the app pulls **Google Fonts** (`fonts.googleapis.com` @imports in `globals.css` + `fonts.gstatic.com` woff2) — the future enforced `style-src`/`font-src` must allow them (or self-host the fonts). Report-Only violations confirmed live.
> - **Prod follow-through (unchanged from before):** verify each deploy bumps `VERSION` in `public/sw.js` (its `cacheFirst` for `/_next/static/` can serve stale chunks across prod deploys otherwise).
>
> **(B) TUTORIAL FAN-OUT — ✅ COMPLETE. ALL 12 of 12 chapters now have the "I do → we do → you do" tutorial (2026-07-05 pm).** Verified live (ShopRush + BalanceBench + JuiceBar drove start→walkthrough→guided→scored, zero console errors); `tsc` green; `npm test` 17/17. All uncommitted.**
> - **Done this pass (10 new + the 2 pilots = 12):** signedRationalOps (FrogPond — frog hops 2−5 past zero to −3) · rationalOps (KitchenCounter — ⅔ then half → 4/12, `bar` mech) · ratioProportion (JuiceBar — build 2:3 mango:lime tap-by-tap) · orderOfOperations (ScoreMachine — 2+3×4, times-before-plus, dial 0→12→14) · algebraicExpressions (FunctionFactory — 3n+2 at n=4, 0→12→14) · equationsInequalities (BalanceBench — x+3=8, take 3 off both sides, beam levels at 5) · coordinatePlane (NightFlight — (3,−2), across-then-down) · linearRelationships (CableCar — y=2x+1, intercept-then-slope) · geometryMeasurement (BuildSite — 6×4 area, dial 0→12→24) · **percentages (ShopRush — MIGRATED via a bespoke in-file walkthrough, NOT onto GameShell: it keeps its distinct night-market look + custom PaintPad/PriceDial; tutorial = 25% off $80, dial 80→70→60; guided = 50% off $10 → $5; reuses shared `speakSteps`+`HandCue`).**
> - **⚠️ Fan-out was run by 10 parallel subagents; 7 hit the session limit mid-edit** (only pruned imports → left the old `Demo` orphaned + broke tsc). I finished BalanceBench / BuildSite / CableCar / NightFlight by hand and did the ShopRush migration myself; FrogPond / ScoreMachine / FunctionFactory / JuiceBar / KitchenCounter completed cleanly by their agents. Final `tsc` clean.
> - **SLOW STEP PACING (founder ask "make the speech + explanation slow"):** added an optional `gapMs` to `speakSeq`/`speakSteps` in `src/infra/useMiloSpeaker.ts` (a breathing pause between spoken lines, only after a line that actually spoke). `GameShell`'s `TutorialPlayer` now calls `speakSteps` with **`rate: 0.8, gapMs: 1100, fallbackStepMs: 3200`** (ShopRush's walkthrough uses the same). So every walkthrough speaks slowly with a ~1.1s pause per step, and the silent-audio fallback is slow too. Backward-compatible (default `gapMs: 0`; 17/17 tests still pass).
> - **✅ BLACKBOARD — "teacher talks while writing" (founder ask, 2026-07-05 pm):** during the walkthrough, as Milo SPEAKS each step the matching math is WRITTEN onto a green chalkboard, one line at a time (chalk wipes in left-to-right in sync with the voice; earlier lines stay up — like a teacher's board work). New shared **`Blackboard`** component in `gameKit.tsx` (slate + wooden frame, `.mb-writing` clip-path reveal). `DemoStep` gained an optional **`board?: string`**; `GameShell.TutorialPlayer` accumulates steps' `board` lines 0..i and animates the current one. Every chapter's tutorial steps got concise `board` lines (e.g. ShopRush: `$80, 25% off` → `25% of $80 = $20` → `$80 − $20` → `= $60`; GearLab: `3² = ?` → `start: 1` → `1 × 3 = 3` → `3 × 3 = 9` → `3² = 9`). ShopRush renders the same `Blackboard` in its bespoke `TutorialWalk`. **Verified live** (ShopRush screenshot + GearLab board build, zero console errors).
> - **✅ Pre-commit gates all green + done:** removed the TEMP DIAGNOSTIC block from `public/sw-register.js` (self-heal logic kept). `tsc` clean · `npm test` **21/21** · **`next build` ✓ compiled successfully** (all 34 pages). Still uncommitted (no auto-push).
> - **✅ RESUME-AT-DIFFICULTY (founder ask "hard questions get skipped by the mastery early-exit; on replay a kid should resume at the tier they left off on, not re-grind easy", 2026-07-05 pm):** the adaptive engine ramps easy→med→hard and can end early on mastery, but every replay used to restart at EASY. Now the difficulty a child is on is **remembered per learner + per chapter** and the next attempt **resumes there** and climbs from it. Files: NEW `src/infra/storage/chapterLevel.ts` (`get/setChapterLevel` over the kv store, keyed `milo-chlvl-<learnerId>-<chapter>`); `useAdaptive(chapter, initialDifficulty=1)` gained an optional start tier (core stays PURE — caller loads/saves); `GameShell` + `ShopRush` load the start tier at mount (`getActiveLearner()?.id` → `getChapterLevel`) and **save `res.difficulty` on every scored answer** (so it's always the level they left at — self-correcting: a bad run demotes and is remembered lower). No learner (logged-out preview) → no memory → always easy (unchanged, safe). Mastery early-exit UNCHANGED (founder likes it). Scope = the **12 teen games** (all via GameShell + ShopRush); the 3–11 story chapters call `useAdaptive` directly and could get the same 2-line wiring later. **Verified:** unit test `src/__tests__/chapterLevel.test.ts` (4 cases: default 1, resume per learner/chapter, no-op without learner, clamp) → 21/21; **live end-to-end** — injected a learner + seeded integers to level 3, drove through to scored play, the real submit path persisted `"3"` (a single answer can't change the tier, so that proves it STARTED at 3 = resume works AND the save fires). Zero console errors; test data cleaned up.
>   - **Possible follow-ups if founder wants:** (a) ~~gentle warm-up~~ **DONE (see below)**; (b) extend the same resume to the 3–11 story chapters; (c) cross-device (currently per-device via kv; could persist the tier in `learner_progress`).
> - **✅ OPTIONAL WARM-UP (founder ask, 2026-07-05 pm):** so resuming at a higher tier isn't a cold jump — but WITHOUT force-lengthening the set for kids who'd rather dive in — the warm-up is a **choice at the start screen, shown only when resuming above easy** (`canWarmUp = startDiff > 1`). Copy: "You left off at **[Champion ⭐⭐⭐]**. Want a quick warm-up first?" → **☀️ Warm up first** | **Continue →**. Picking warm-up prepends **`WARMUP_COUNT` (=2)** gentler questions one tier below the resumed level (`warmupDiff = max(1, startDiff-1)`), then the set climbs back to their tier; the set grows to `effTotal = TOTAL + WARMUP_COUNT` (progress dots + counter updated). "Continue" is the unchanged N-question flow at their tier. Implemented in both `GameShell` (11 chapters) and `ShopRush`. Loop stays adaptive/mastery as-is. **Verified live** (integers seeded to level 3): the choice popup renders with the right label; **Warm up first → "1 / 10"** with 10 dots (8+2); Continue → the normal 8. Zero console errors. `tsc` + `npm test` 21/21 + `next build` all green.
> - **✅ LAPTOP SIZING — bigger + less empty (founder ask "laptop view looks very empty, make things big", 2026-07-05 pm):** the 12–14 games were mobile-first fixed-px → a tiny ~460px column stranded in a 1440px laptop. Two changes, both **mobile-safe** (phones keep the small floor; only the `vw`/`vh` term grows on a laptop): (1) **every shared kit element is now `clamp(mobilePx, vw, maxPx)`** — `Says`/`Ticket`/`Blackboard` widths + fonts, `Row`, `bigBtn`/`headerChip`/`Nudge`, all instrument sizes (`VThermo`/`SlideValue`/`BarShade`/`CrankGear`/`PlotGrid`/`LineSetter`/`BalanceBeam`/`TwoTaps`) + their readouts, `GameShell` header title + start blurb + `main` maxWidth; ShopRush's local copies mirror it. Elements now render ~1.4× bigger on a laptop. (2) **the WALKTHROUGH goes TWO-COLUMN on a roomy landscape screen** (`useWideLandscape()` = `vw≥900 && vw>vh*1.15`) — Milo's talk + chalkboard on the LEFT, ticket + instrument on the RIGHT — which fills the width AND stops the taller content (blackboard + a tall instrument like the coordinate map) from overflowing a 900px-tall laptop. Play/guided stay single-column (they already fit). ShopRush's bespoke walkthrough stays single-column (its price-dial is short). **Verified live at 1440×900** (two-column integers + single-column ShopRush both fit, rootH=900, commit button visible, ~784px width used vs old ~460) **and 375×812** (single-column, fits, floors intact). Tall square instruments (coordinate map) capped to `min(80vw, 34vh)` so every tutorial fits. `tsc` + 17/17 + `next build` green.
>   - **NOTE:** the browser-preview SCREENSHOT tool renders some chapters tiny/top-left at emulated desktop sizes (a preview-panel quirk, not the app) — trust the DOM measurements / `preview_inspect`; ShopRush did screenshot correctly and looked great.
>
> **(B-old) original fan-out brief (now done) — 2 of 12 chapters converted; the remaining 10:**
> - **New engine (in the shared shell, backward-compatible):** `GameConfig` gained optional **`tutorial`** (an "I do" step-by-step WALKTHROUGH) + **`guided`** (a "we do" live coached NON-scored round). `GameShell` renders a new **`TutorialPlayer`** (drives the instrument through narrated steps via **`speakSteps`** so voice + movement stay in sync; shows an animated **`HandCue`**; ends with "↺ Watch again" / "Let's try →"), then a **guided stage** (live instrument + `HandCue`, `submitGuided` = encouraging, not scored, then into real play). Chapters WITHOUT `tutorial`/`guided` fall back to the old one-shot `config.Demo` (so the other 10 still work). `HandCue` (in gameKit) supports kinds **`drag` (horizontal) · `dragV` (vertical) · `tap` · `crank` (rotating)** — pick the one matching the instrument.
> - **Done + verified live:** **exponentsRoots (Gear Lab)** and **integers (Weather Station)**. Each: full walkthrough → guided → scored play, zero console errors, instrument-matched cue.
> - **How to add the tutorial to a chapter:** in its game file's `CONFIG`, add `tutorial: { task, initial, hand, steps:[{say, value?, hand?}] }` and `guided: { task, coach, hand }`, and DELETE the old `Demo` component + its `config.Demo`. Mirror **`WeatherStation.tsx`** (vertical-drag) or **`GearLab.tsx`** (rotary) — they're the reference. Pick a worked example that teaches the METHOD (Weather = a reading dropping *past zero*; Gear = building 3² turn-by-turn). Keep the guided task simple.
> - **Remaining 10 to convert:** signedRationalOps (FrogPond·`drag`) · rationalOps (KitchenCounter·`tap`/`drag`) · ratioProportion (JuiceBar·`tap`) · orderOfOperations (ScoreMachine·`drag`) · algebraicExpressions (FunctionFactory·`drag`) · equationsInequalities (BalanceBench·`drag`) · coordinatePlane (NightFlight·`tap`) · linearRelationships (CableCar·`tap`) · geometryMeasurement (BuildSite·`drag`) · **percentages (ShopRush)** — ⚠️ ShopRush is self-contained (predates the shell), so it needs either a migration onto GameShell first or a bespoke walkthrough.
> - **Founder-approved shape (locked this session via AskUserQuestion):** ONE deeper step-by-step example (not two) · YES a guided "we do" round · pilot-one-then-all · add the animated hand cue + "Watch again" (no skip button).
>
> **Other changes this session (all uncommitted):**
> - **exponentsRoots pools widened** (founder: "only 2 and 5" before) → GearLab now covers **squares 2²–12², cubes 2³–7³ + 10³, higher powers 2⁴/2⁵/2⁶/3⁴, roots √4–√144**, tiered by difficulty (all integer answers, roots ≤12 for the slider). Verified.
> - **`CrankGear` is now a GRAB-AND-TURN rotary** (founder: the crank should rotate to match the hand cue, not be a button). Hold the handle & turn: one full turn = ×base, turn back = ÷base (undo, floored at 1); the gear also spins when value is set programmatically (so the tutorial demo visibly rotates it). Removed the old ×/÷ text buttons. Visible grab-handle + hint + `crank` HandCue all consistent. Verified 1→2→4→8 forward and 8→4 back.
> - **Safari SVG fix (real bug, keep):** 4 SVG instruments used `width="min(…)"`/`height="min(…)"` as SVG **geometry attributes** — Safari does NOT support CSS math funcs there. Moved the sizing into `style` (CSS min() works in Safari): `CrankGear`, `PlotGrid`, `LineSetter`, `BalanceBeam`. Also added `WebkitBackdropFilter` on the `Says` bubble. (This was a genuine Safari rendering bug but was NOT the "not loading" cause — that's the SW.)
> - **Preview note:** dev server on port 3017. `tsc` + `npm test` (17/17) re-run + green this session. `next build` NOT re-run — do before commit. **Before commit also delete the TEMP DIAGNOSTIC block in `public/sw-register.js`** (the `swdiag` beacons — see thread (A)).

<details><summary>Completed 12–14 fan-out (earlier same day) — the base all the above sits on</summary>

> ✅ **12–14 FAN-OUT COMPLETE (2026-07-05 late) — all 11 remaining chapters built + verified; UNCOMMITTED.**
> **What shipped:** a shared generic game engine + instrument library — [`teen/games/parts/GameShell.tsx`](src/features/chapters/teen/games/parts/GameShell.tsx) (the whole adaptive loop: start→demo→play, demote-on-wrong, reteach-after-3-in-a-row narrating `task.work`, mastery early-exit, Milo, backdrop+scrim; data-driven via a `GameConfig`) and [`teen/games/parts/gameKit.tsx`](src/features/chapters/teen/games/parts/gameKit.tsx) (palette-parameterized presentation kit + pointer instruments `SlideValue`·`VThermo`·`BarShade`·`CrankGear`·`PlotGrid`·`LineSetter`·`BalanceBeam`·`TwoTaps` + `glideNumber`). Then **11 thin data-only game files** + all 11 wrappers rewired (Integers built by me, the other 10 by parallel subagents). `useAdaptive` **UNTOUCHED**; NO MCQ / coins / timer / score anywhere.
> **The 12 games (id · file · lead mechanic):** percentages·ShopRush·paint+slide ✅(pre-existing) · integers·WeatherStation·thermometer-pull · signedRationalOps·FrogPond·number-line slide · rationalOps·KitchenCounter·shade-12ths + decimal slide · ratioProportion·JuiceBar·TwoTaps mix · exponentsRoots·GearLab·crank + root slide · orderOfOperations·ScoreMachine·score dial · algebraicExpressions·FunctionFactory·machine dial · equationsInequalities·BalanceBench·balance beam · coordinatePlane·NightFlight·tap-the-map · linearRelationships·CableCar·set slope/intercept · geometryMeasurement·BuildSite·compute-and-dial.
> **Verified live** at `/teen-preview?c=<id>`: every chapter reaches play with **zero console errors**; fully drove correct→stamp→advance on integers/coordinatePlane/equations/gear/cable; confirmed wrong→reveal→advance; all custom instruments work with touch+mouse. **Responsive:** tall instruments now `min(vw,vh)`-sized → **scale UP on desktop** (grid 300→464px on 1280×800) and **down on short-landscape** (nothing overlaps; commit reachable by scroll — matches shipped teen precedent).
> **Backdrops:** 10 new painted `nano_banana_2` scenes (portrait 3:4, recompressed ~450KB palette-PNG) → `public/assets/teen/scene_<chapterId>.png` (+ existing integers/percentages) = **12 total**; look great in-scene (juice bar + night-village map verified).
>
> **⚠️ Deliberate deviations / remaining polish (flag to founder):**
> 1. Some chapters use a **dial/slide-to-the-computed-value** instrument instead of the doc §C exact gesture (orderOfOperations = score dial not BracketGrab; equationsInequalities = balance+slide, **equations only, no inequality-ray yet**; exponents roots via slide not crank-back; signedRationalOps = number-line slide not JumpCharge/ConveyorSort). All playable, on-theme, math-correct — chosen for a robust one-go build. Revisit if a specific gesture is wanted.
> 2. **One backdrop crop per world** (`objectFit:cover` + scrim), not the §E 2-crop portrait+wide swap. Adapts acceptably (verified); a dedicated 16:9 crop per world is the ideal follow-up.
> 3. ShopRush (percentages) still self-contained (predates the shell) + portrait backdrop only — optionally migrate onto GameShell + add its wide crop.
> 4. ± nudge steppers use a value-based (not functional) setter → synthetic same-tick rapid taps under-count; real human taps are fine. Low priority.
>
> **Files (all UNCOMMITTED, on top of the earlier uncommitted batch):** NEW `teen/games/parts/{GameShell,gameKit}.tsx`; NEW `teen/games/{WeatherStation,FrogPond,KitchenCounter,JuiceBar,GearLab,ScoreMachine,FunctionFactory,BalanceBench,NightFlight,CableCar,BuildSite}.tsx`; REWIRED 11 `game/*Chapter.tsx` wrappers; 10 new `public/assets/teen/scene_*.png`. The old teen lessons/sims those wrappers used are now unused (not deleted). **Next:** optionally address the deviations; then `next build` + commit the whole tree when asked.

<details><summary>Earlier plan (now executed) — original fan-out brief</summary>

> 🎯 **(ORIGINAL) RESUME HERE: 12–14 GAME FAN-OUT — build the remaining 11 chapters in one go.**
> **The founder-approved recipe is [`docs/teen-game-pattern.md`](docs/teen-game-pattern.md) — read it FIRST; it is the single source of truth** (fixed skeleton, gesture-class interaction library, per-chapter world+mechanics table §D, responsive rules §E, build checklist §F, non-negotiables §G). Reference implementation: **`src/features/chapters/teen/games/ShopRush.tsx`** (Percentages = "Milo's Sale Day", DONE + verified live at `/teen-preview?c=percentages`).
>
> **Founder direction (LOCKED this session):** the 12–14 band must NOT feel like a learning platform — **no slides, no MCQ, no quiz feel**. Each chapter = ONE continuous real-world game scene; the kid answers by **physical manipulation** (paint / slide / pour / crank / launch / balance / draw / stack…); **Milo demos order #1 in-scene** (this replaces the lesson deck); hint + reteach happen inside the game.
> **Locked rules:** • one real-world scenario per chapter • NO multiple-choice anywhere • NO coin/reward economy (was built, founder removed it) • the shared adaptive engine `useAdaptive` is **UNTOUCHED** and used canonically — invisible easy/med/hard tiers, demote on wrong, **re-explanation after 3 wrong IN A ROW** (Milo glides the instrument to the answer + narrates `task.work`), mastery early-exit • math-without-fear (no timer / red X / visible score) • each chapter **leads with a DIFFERENT gesture class** (variety table in doc §D) • **responsive at ALL sizes** (doc §E: 6-size matrix incl. 812×375 short-landscape, iPad both, 1280×800 laptop, wide desktop; TWO backdrop crops per world — 9:16 portrait + 16:9 wide, swapped by orientation).
> **Fan-out plan:** (1) build shared mechanic parts once in `teen/games/parts/` (SlideDial, NumberLineDrag, PaintGrid, StackBuild, ConveyorSort, PanBalance…), (2) build the 11 games per doc §D (worlds: Weather Station · Frog Pond · Kitchen · Juice Bar · Gear Lab · Score Machine · Function Factory · Balance Bench · Night-Flight Postal · Cable Car · Build Site), (3) 2 backdrops each via **nano_banana_2** (~1.5cr/img, balance ~880cr), (4) verify each at `/teen-preview?c=<id>`: demo plays → mechanic works → correct stamps → 3-wrong reteach fires → difficulty drops → **responsive matrix**. (5) **Retrofit ShopRush to §E** — it currently has only the portrait backdrop + fixed maxWidth (verified: on 1280×800 the backdrop crops to the awning and the UI sits phone-sized) — needs the 16:9 crop + scale-up-on-desktop.
> **Also this session (all uncommitted):** assets `public/assets/teen/{shop_night.png, scene_percentages.png, scene_integers.png}`; `PercentagesChapter.tsx` = thin portal → ShopRush → MasteryState (old slide flow deleted); teen sims got real-world skins (`PercentBarExplorer` = sale tag, `NumberLineExplorer` = thermometer + number line — still used by the other chapters' OLD flow); Integers+Percentages lessons gained real-world context rounds (IntegersChapter still runs the old slide flow — it gets rebuilt as **Weather Station** in the fan-out); new shared bits `teen/scenes/{SceneImage,PriceCard}.tsx` (PriceCard now unused by ShopRush — reuse or prune in fan-out); a Dora-style loop was brainstormed + approved in spirit (ask→wait→react, live drag commentary, your-own-move recap, tools-not-hints, Milo-needs-you framing) — fold in where cheap, the full pass is its own later task; founder has **Google Stitch UI prompts** (Weather Watch/integers) and may bring Stitch output to merge.
> **Voice note:** game demos/reteach lean on Milo speaking — the Chatterbox/child-voice decision (older block below) is still open; browser US voice is the interim. **`tsc` green; zero console errors in preview.**

</details>

</details>

> ⚠️ **EARLIER 2026-07-05 BLOCK (chunk 6 etc., still-standing items).** Still the founder product-changes batch, **all uncommitted** — do NOT lose the working tree. `tsc` + `next build` + `npm test` (17/17) green throughout. HEAD `b93182c`, nothing pushed. **This session (07-05) piled a lot on top of chunks 1–5 — full list in the LATEST SESSION (2026-07-05) block just below.** Short version:
> - **Chunk 6 part A — US English: DONE.** British→American spelling/tone swept across ~92 `src/` files (spelling only; no math/units changed). `practise→practice`, `colour→color`, `metre→meter`, etc.
> - **Chunk 6 part B — US VOICE: NOT finalized (the main open item).** Explored LOCAL TTS on the M1 (Kokoro + Chatterbox, venvs in `scratchpad/milo-voice/`). Founder wants a **childish + expressive** unique voice: Kokoro = natural but flat; Chatterbox = expressive but adult; pitch-shifted "child register" + Kokoro-timbre→Chatterbox "game-narrator" clones generated as samples (served at `/_voicetest/player.html`; files in `public/_voicetest/` — **DELETE before commit**). **No neural voice is wired into the app.** Only shipped voice change: `_pickVoice` in `src/infra/useMiloSpeaker.ts` now prefers **US** local voices (dropped Daniel/Karen/Moira). Pending decision: engine/voice + pre-render-a-corpus vs runtime.
> - **Counting (3–5) UX overhaul** + a **shared SkillBeat feedback change that affects ALL story chapters** + **menu wallet/level swap** + **diagnostic question restyle** — all detailed below.
> - **NEW: Milo Labs AR/VR track.** `docs/labs-vision.md` + `docs/labs-demo-brief.md` — self-contained brief for a **separate Opus session** to build a colocated shared-AR classroom demo (a heart floating on a printed marker mat, synced across iPad/iPhone via Supabase Realtime; pure web, no Unity). Lives in a new standalone `labs-demo/` (NOT the app). Kickoff prompt is in this session's chat.
>
> **Before deploy (07-04 items unchanged):** apply the 4 staged migrations (2 destructive/anon-write); signed-in tap-through of auth/role/streak/checkup. **New 07-05 items:** delete `public/_voicetest/`; signed-in eyeball of the menu wallet/level swap; note the SkillBeat feedback change is app-wide (confirm the founder wants it on ALL chapters, not just Counting).

> 🔐 **SECURITY AUDIT + HARDENING — COMPLETE + SHIPPED (2026-07-03, `main`@`c59bb1f`, prod deploy BUILDING→READY).** Ran a full senior-level security audit (3 parallel agents + live DB inspection + Supabase advisors). Backend was already strong (RLS on all 17 tables, guarded RPCs). Found + fixed **one CRITICAL cross-tenant hole (V1)** — a forged-invite privilege escalation that let any signed-in user read another family's child PII/DOB (empirically confirmed against prod, rolled back; **0 rows were ever forged**). Fixed V1–V11 (2 migrations applied to prod + code) and built 3 tiers of durable guardrails (RLS regression suite proven green vs prod, committed schema baseline, enforced CSP subset + monitoring hook, CI audit gate + Dependabot). Full detail in the LATEST SESSION block below and the runbook [`docs/security.md`](docs/security.md). **⚠️ 4 MANUAL steps remain (dashboard-only, no code path) — see the "MANUAL TO-DO" list immediately below.**

## ⚠️ MANUAL TO-DO — things that CANNOT be done from code (someone must do these by hand)

These are the only outstanding items that have no MCP/code path. Everything else this session is shipped + live.

**Security (Supabase dashboard — do these first):**
1. **Enable leaked-password protection** (V6) — Auth → Providers/Password → turn on the HaveIBeenPwned check. One toggle. (Supabase advisor WARN until done.)
2. **Shorten the refresh-token lifetime** — Auth settings. Mitigates the session JWT living in `localStorage` (standard Supabase-SPA tradeoff; CSP + this are the mitigations).
3. **Set the `SUPABASE_DB_URL` repo secret** (GitHub → repo → Settings → Secrets → Actions) → activates the CI RLS regression job. Point it at a **Supabase preview branch or a throwaway TEST project — never prod**.
4. **Set `MONITORING_INGEST_URL`** (Vercel env) or add `@sentry/nextjs` → activates error forwarding from `src/instrumentation.ts`. Without it, server errors still land in Vercel logs.

**DevOps / production-readiness (dashboards — the pipeline code is shipped; these activate it — full detail + checklist in [`docs/devops.md`](docs/devops.md)):**
- **Supabase:** create a **staging project**; enable **PITR** on prod (+ run the quarterly restore drill in [`docs/runbooks/rollback.md`](docs/runbooks/rollback.md)); set **Auth rate limits** (the real API-abuse perimeter — the app talks to Supabase directly, so Vercel can't rate-limit auth/RPC); add a **log drain** (alert on `42501` RLS-denial spikes).
- **Vercel:** create a **staging env**; enable **Speed Insights + Analytics**; add **Firewall/WAF** rate-limit rules; set **`MONITORING_INGEST_URL`** (activates error forwarding from `instrumentation.ts` + `/api/report-error`).
- **GitHub:** create `staging` + `production` **Environments** with a **required reviewer** on `production` (the prod-migration approval gate for `deploy.yml`); add secrets `SUPABASE_ACCESS_TOKEN`, `STAGING_DB_PASSWORD`, `PROD_DB_PASSWORD`, `STAGING_DB_URL` + vars `STAGING_PROJECT_REF`, `PROD_PROJECT_REF`(=`qaymxunzlarwusogwyak`). This is what flips migrations from hand-applied (MCP) to gated CI (`supabase db push`).
- **Uptime monitor** (BetterStack/Pingdom) on `/api/health` (now live) + a signed-in journey.

**Previously-known launch blockers (still standing, need external accounts/decisions — not code):**
5. **Custom SMTP** (Resend/SES/Postmark) — the real launch blocker for email deliverability; the built-in mailer already tripped a bounce warning. Unblocks the week-6 auto-nudge cron.
6. **Sentry DSN** — get a DSN + wire it (pairs with #4). Currently blind to prod errors beyond Vercel logs.
7. **Stripe** — no monetization wired; needs a Stripe account + pricing/business decision. Best placed at the report or the week-6 "gap closed" moment.
8. **Full CSP enforcement** — the safe subset is enforced now; flipping the strict policy from Report-Only → enforced needs a `report-uri` + experimental `experimental.sri` (keeps static rendering). Watch the Report-Only violations first. Steps in [`docs/security.md`](docs/security.md).
9. **Baseline schema `supabase db dump`** — the true base schema still lives only in the dashboard. A committed **security-surface** snapshot now exists (`supabase/schema/security_baseline.sql`), but a full `supabase db dump` (needs the CLI + DB password) into `supabase/migrations/` would make the whole schema reproducible.
10. **Human signed-in tap-through on prod** — login → parent dashboard → play a chapter (confirm coins/stars/streak still save after the V2 server-derive change) → /insights. The one path not verifiable headlessly.
11. **Real week-6 cohort + teacher sign-off** on the skill-graph spine edges — efficacy discipline before scaling the guarantee (not code).
12. ~~**`milo-happy.png` / `milo-thinking.png` 404s**~~ ✅ **CLOSED (verified 2026-07-27) — both files now exist** in `public/assets/characters/`. Nothing to decide, nothing to spend.

---

## LATEST SESSION (2026-07-05) — chunk 6 US-English + big Counting/UX polish + voice R&D + Milo Labs docs (ALL UNCOMMITTED)

All `tsc` + `next build` + `npm test` (17/17) green. Nothing committed. Dev server: `preview_start milo-dev` (port 3017; also LAN `192.168.1.35:3017`).

**1. Chunk 6 part A — US English sweep: DONE.** 4 parallel agents converted British→American across ~92 `src/` files (lessons, story, teen/game, app/core/shared/infra). **SPELLING/TONE ONLY — no numbers, math, or unit *systems* changed** (metric kept: `metre→meter` is spelling; `cm/ml/kg` symbols untouched). Key: `practise→practice` (in ~26 spoken `finalSpeech`/`say` lines), `colour→color`, `metre/litre→meter/liter`, `centre→center`, `biscuit→cookie`, `sweets→candy`, `favourite/neighbour/behaviour/recognise/analyse/jewellery/maths→…`. Local code identifiers renamed all-or-nothing per file (`colours→colors`, `COLOURS→COLORS`, `function colour()→color()`); `'sweets'` scene-KEYS + asset paths deliberately left. Residual-britishism grep = 0.

**2. Chunk 6 part B — US VOICE: explored, NOT wired (the main open decision).** Founder wants a **childish + expressive, playful, unique** Milo voice. Set up LOCAL TTS on the M1 in `scratchpad/milo-voice/` (two `uv` venvs): **Kokoro-onnx** (`.venv`, Apache, model files downloaded) = natural but FLAT; **Chatterbox** (`.venv-cb`, MIT, needs the `perth` watermarker no-op'd) = EXPRESSIVE but its stock voice is an adult. Produced candidate WAVs: 5 Kokoro voices/blends, Option-B (`am_puck`) set, 3 Chatterbox expressiveness levels, **pitch-shifted "child register"** (rubberband +3/+4/+5, `brew install rubberband`), and **Kokoro-timbre→Chatterbox "game-narrator" clones** (michael/puck/bella/heart). All served for A/B at **`http://localhost:3017/_voicetest/player.html`** (files in `public/_voicetest/` — **DELETE before any commit**). Founder liked Chatterbox expressiveness; childish-via-pitch is close but not perfect → the higher-fidelity local path is **cloning a real child-ish reference clip** (needs a clip we have rights to). **Also generated 2 cloud Seed-Audio samples via the Higgsfield MCP (~1.8 credits; balance was 894) then dropped the cloud path per founder ("local only").** SHIPPED voice change: `_pickVoice` in `src/infra/useMiloSpeaker.ts` now prefers warm **US** locals (Samantha/Ava/…); removed the British/AU/IE voices (Daniel/Karen/Moira). **Next: pick the engine+voice (likely Chatterbox + a licensed child reference clone) → pre-render the fixed corpus (numbers, praise, prompts) → wire a clip-first playback layer in `useMiloSpeaker` (browser US voice stays the fallback).**

**3. Counting chapter 1 (age 3–5) — big UX overhaul** (`src/features/chapters/story/world1.tsx`, `StoryWorld.tsx`, `ForestWalk.tsx`). Verified live in the landscape `/story` (+ `/story?skip` jumps to practice).
   - **Explanation demo (`FlyingCountDemo`) → auto-playing PARADE** (was: objects accumulated). Reuses the practice `Parader`; creatures come ~2 at a time, Milo auto-counts each, it walks off, next enters. Then per founder: the **count number floats BIG above each creature** (new `num` prop on `Parader`, 34px bubble) and the parade is **slowed** (`travelSecs 2.6`, `CADENCE 2700`, initial delay 2000).
   - **Guided (`FlyingCountPlay`) → same parade, child taps each** (was: scattered objects). Slowed (`travelSecs 1.8`).
   - **Practice (`ParadeCountPlay`)**: slowed (`travelSecs 1.8`); the running-count number pill REPLACED by a **`CollectTray`** — each tapped creature's icon gathers into a **single enlarged row just below the prompt** (`flex-wrap:nowrap`, auto-shrinks the cell so up-to-10 fit one row; `maxCell = size*0.6`). Objects no longer just vanish — the child sees the collection grow. (Tray used by both guided + practice.)
   - **Shared `SkillBeat` feedback simplified — ⚠️ AFFECTS ALL STORY CHAPTERS (3–5 + 6–8), not just Counting:** removed the **🔊 speaker emoji** from the prompt pill (pill still replays on tap); a correct answer now shows only a **green ✓ tick** (no "🎉 Yes!" banner); and **no spoken compliment on correct** (Milo only gently speaks on a WRONG answer now). Matches founder's "only a tick, don't praise every question" — but confirm they want it app-wide.

**4. Diagnostic/checkup question restyle** (`src/app/diagnostic/page.tsx` + `src/app/diagnostic/recheck/page.tsx`): removed the progress **dots**; the question is now **centered + large + responsive** (clamp by vh; reserves space above the answer tiles so it never overlaps at any size). Dropped the now-unused `PromptCard` import in both. Verified at mobile/short-landscape/desktop.

**5. Menu topbar swap** (`src/app/menu/page.tsx`): **Level badge → top-LEFT** (next to 📚 Chapters); **👛 Wallet → top-RIGHT** (before Profile/Shop/Switch). Auth-gated — not headlessly verifiable; needs a signed-in eyeball.

**6. NEW — Milo Labs AR/VR planning track (docs only, no code).** Founder vision: **colocated shared mixed-reality classroom** — students around a table, each tablet/headset sees the SAME 3D object (e.g. a heart) floating in the same spot; teacher conducts (slice/label/explode/quiz). Researched the market (zSpace/ClassVR/Prisms/Merge — the unowned position is "colocated shared hologram, on hardware schools own, teacher-as-conductor"). Locked founder decisions: **US market · science-led sales · Lab-as-a-Service · parallel track · demo→one pilot→raise.** Wrote **`docs/labs-vision.md`** (strategy, 5 moats, phased roadmap) + **`docs/labs-demo-brief.md`** (a self-contained, one-take build brief for a SEPARATE Opus 4.8 session). Demo stack decided: **pure web (Vite+Three.js+MindAR marker tracking), NO Unity, iPad-Safari-friendly, Supabase Realtime sync, isolated `labs-demo/` dir**. The demo = **Option A only** (shared+synchronized marker experience: heart on a printed/`/mat`-screen marker, live-synced across devices, teacher conductor). Kickoff prompt for the next session is in this session's chat history. (Separate from the older `docs/ar-phase0-brief.md`, which is the app's webcam-hand-tracking plan — still parked.)

**07-05 deploy/cleanup notes:** before committing — **delete `public/_voicetest/`** (voice A/B test files) and the `scratchpad/milo-voice/` venvs are outside the repo (fine). Confirm the founder wants the app-wide SkillBeat feedback change. Everything else joins the existing uncommitted batch.

---

## LATEST SESSION (2026-07-04) — PRODUCT CHANGES BATCH — **chunks 1–5 DONE, chunk 6 remaining (ALL UNCOMMITTED)**

Founder handed a 6-workstream batch. **Chunks 1–5 are complete + verified**; chunk 6 not started. **Nothing committed/pushed** — `tsc` + `next build` + `npm test` (17/17) all green. **4 migration files are STAGED, not applied** (apply via pipeline before deploy).

**LOCKED DECISIONS (founder):** 1. "Points"→"Wallet"=coins. 2. Counting: keep tap-the-NUMBER answer. 3. Checkup email REQUIRED before the diagnostic (lead capture, then continue with it). 4. Day-streak removed COMPLETELY (UI + DB); stage the destructive column-drop as a migration file, don't hand-apply.

**THE 6 WORKSTREAMS:**
- [x] **1. Home/menu restructure** — DONE (`src/app/menu/page.tsx`). Top-left 📚 Chapters + 👛 Wallet (coins); top-right Level · 👤 Profile · 🛍 Shop · ← Switch. Removed Milo's Daily card / Next-Chapter ribbon / Hand Games / day-streak chip / old button row. (`/daily`+`/play` still exist, unlinked.) Needs a signed-in eyeball.
- [x] **2. Day-streak FULL removal** — DONE. Founder confirmed **"remove everything, incl. insights."** Stripped all 3 streak surfaces: profile/menu day-streak, the `/daily` review streak, AND the teacher `/insights` streak analytics. Files: `state/store.ts` (dropped `currentStreak`+`lastPlayedDate`), `state/progressMerge.ts` (removed `nextStreak`), `features/daily/daily.ts` (`DailyState`→`{lastDay}`; deleted `computeStreak`/`reconcileStreakFromDB`), `app/daily/page.tsx`, `features/insights/metrics.ts`+`app/insights/page.tsx`, `app/profile/page.tsx`, `app/parent/page.tsx`, `data/supabase/types.ts` (dropped `current_streak`/`longest_streak`). Tests: pruned `progressMerge.test.ts`, **deleted `daily.test.ts`** → 17/17 pass. **STAGED migrations:** `20260704120000_sync_session_drop_streak.sql` (redefines `sync_session` to stop computing streak; defensive `DEFAULT 0` first) + **`20260704120100_drop_streak_columns.sql` (DESTRUCTIVE `DROP COLUMN` — must run AFTER the first, through the prod-approval gate).**
- [x] **3. Teacher/Parent post-login role** — DONE. Added `'teacher'` to the `user_role` enum; made `profiles.role` **nullable + no default** (NULL = "hasn't picked yet"). Existing 5 accounts grandfathered as `parent`. New `getMyRole`/`setMyRole`/`homeForRole` in `data/repositories/profile.ts`; `RolePicker` shown on `/parent` when role is null; role-aware post-login routing in `app/auth/callback/page.tsx` + `app/auth/page.tsx` (teacher→`/parent/grades`, else→`/parent`). Confirmed `profiles` RLS already allows self-update. **STAGED migration:** `20260704130000_profile_role_teacher.sql`. Dormant-safe before it applies (new signups just default to `parent`, skip the picker).
- [x] **4. Checkup email gate + bigger questions** — DONE + **verified live** (public `/diagnostic`). (a) Required email step before the probe for COLD traffic only (signed-in skip); new `'email'` phase + `EmailGate` in `app/diagnostic/page.tsx`; `infra/storage/leadEmail.ts` (kv) prefills the `/auth` signup. Durable lead capture via `captureDiagnosticLead()` → **`diagnostic_leads` table (STAGED migration `20260704140000` — ⚠️ this is an ANON-INSERT surface, insert-only/no-read; FOUNDER SIGN-OFF FLAGGED before it ships).** (b) Bigger questions: opt-in `big` prop on the shared `PromptCard` (`preteen/kit.tsx`) used ONLY by the checkup (~20px→~28px); enlarged the 3–5 readiness card + answer-chip caps. Verified: gate → validation → capture → probe with the bigger prompt, no mobile overflow, prefill carried to `/auth`.
- [x] **5. Counting → ANIMATED PARADE + 20 generated sprites** — DONE + **verified live** (`/story`, landscape). Evolved well beyond the original "fly-in" via founder refinements into a full **PARADE**: creatures move in their natural gait (walk-bob / fly-hover / swim-undulate / insect-scuttle), **face their travel direction**, come **~2 at a time**; tapping one plays a "counted" pop then it walks/flies/swims off and the next enters; running-count pill → number choices (tap-the-number kept). New `ParadeCountPlay`+`Parader` replaced `HowManyPlay`; gait keyframes in `ForestWalk.tsx`; lanes derived from each creature's tuned `bandFor` band (`laneFor`: sky/ground/water). **Generated 20 side-facing sprites** (Nano Banana `nano_banana_2`, ~1.5cr each, each referencing its deployed original) → cut out → saved as **`public/assets/objects/<name>_side.png` (parade-only; originals untouched)** → wired via `COUNT_SIDE` in `art.tsx` + a `side` prop on `CountItem` (graceful fallback to the normal sprite). **Sprites:** rabbit·eagle·fish·turtle·shark·crab·squirrel·ant·ladybug (Nature) · lamb·chick·duckling·bee·frog·duck·dragonfly (Farm) · astronaut·alien · firefly·butterfly. **FACING:** verified each sprite's true facing AT FULL SIZE (the model doesn't reliably obey "face right") → `BASE_FACES_LEFT = {shark, rabbit}` (only those two came out left-facing; the direction-flip handles the rest). **Founder refinements (all applied + verified):** (i) removed inanimate **fruits** (apple/pear) from the orchard → `bee/butterfly/ladybug` (a fruit can't parade); (ii) regenerated the **duck** (old one had water baked into the sprite) + **frog** (clean hop), and moved duck to a **ground walker**; (iii) removed **moonRock + comet** from Space (don't animate well); (iv) **blending fix** — parade sprites now use `blend` (soft natural shadow, **no white halo**) + a soft ground **contact shadow**, so creatures tuck INTO the scene instead of looking pasted-on. ~140 of 949 Nano Banana credits used. Space's other inanimate objects (star/cloud/planet/satellite/rocket) were left per founder ("Farm Day only"). Files: `world1.tsx`, `art.tsx`, `biomes.ts`, `ForestWalk.tsx`.
- [~] **6. US English + US voice sweep** — **part A (US English) DONE 07-05; part B (US voice) still open.** See the LATEST SESSION (2026-07-05) block for details. US-English spelling/tone swept across ~92 files; `_pickVoice` biased to US voices. The NEURAL/character voice is NOT decided or wired.

**⚠️ DEPLOY CHECKLIST for this batch (nothing is live yet):**
1. **Commit + push** the whole working tree (22 `src/` files + 20 `*_side.png` + `leadEmail.ts` + 4 migrations + `docs/ar-phase0-brief.md`).
2. **Apply the 4 STAGED migrations via the pipeline** (`supabase/migrations/2026070412*/13*/14*`). Order matters for streak (redefine `sync_session` BEFORE the destructive `DROP COLUMN`). **`diagnostic_leads` opens an anon-insert surface — get founder sign-off first** (or swap to localStorage-only capture).
3. **Human signed-in tap-through** (auth-gated, not headless-verifiable): new signup → **role picker** → teacher lands on Grades / parent on dashboard; play a chapter → confirm coins/stars still save (post day-streak removal); `/insights` renders without streak; `/daily` reward shows "All done!" not a streak.

**PARKED — AR/Fable planning:** unchanged. `docs/ar-phase0-brief.md` saved (uncommitted). Re-run the Fable AR-design pass when the platform is stable, or have Opus produce it. Refined scope: AR is additive only for the YOUNGER bands (3–11); teens already have "Explore" sims. Lower priority than chunk 6.

## LATEST SESSION (2026-07-03) — SECURITY AUDIT + HARDENING — **SHIPPED + LIVE** (`main`@`c59bb1f`)

Full security review of the production app; fixed everything findable in code + built guardrails so it can't silently regress. **2 migrations applied to prod** (backward-compatible, before their code deploy); **2 commits pushed to `main`** (`eb5eed3` fixes, `c59bb1f` guardrails) → Vercel prod BUILDING→READY. `tsc` + `npm test` 25/25 + `next build` + `npm audit --audit-level=high` all green. No new Supabase advisor warnings.

**The vulnerabilities (all fixed + verified live):**
- **V1 · CRITICAL · cross-tenant escalation** — `learner_invites` INSERT only checked `invited_by = auth.uid()`, NOT learner ownership; `can_self_grant_access` trusted any pending invite to the caller's email. So any signed-in user could forge a self-invite for a stranger's `learner_id` → self-grant `viewer` → read/tamper another family's child (name, DOB, sessions, diagnostic profile). Proven exploitable against prod inside rolled-back txns; **0 rows ever forged**. Fix: invite INSERT now requires `learners.created_by = auth.uid()` + `can_self_grant_access` requires the inviter to own the learner (migration `20260703200000`).
- **V2 · Med · client-authored scores** — `sync_session` trusted client `xp`/`coins`/`stars`. Now clamps stars/correct/wrong + **derives xp/coins server-side** from the real formula (`core/scoring.ts`); legit sessions byte-identical (migration `20260703210000`).
- **V5 · Med** — `sync_diagnostic` now bounds band/skill strings + array/items lengths.
- **V3 · Med** — added HSTS + Permissions-Policy + CSP (enforced zero-risk subset + full strict policy in Report-Only). Inline SW script externalized to `public/sw-register.js` (app ships no inline scripts). `next.config.ts`.
- **V7 · Low** — bumped `vitest` 2→4 (cleared the critical + high **dev** CVEs; targeted, NOT the `--force` that would've downgraded Next to 9.x).
- **V8** acceptInvite enforces `expires_at`; **V9** child-PII stash TTL 14d→7d + cleared on sign-out; **V10** signup no longer reveals whether an email is registered; **V11** owner-scoped DELETE policy on `learner_access` (access is now revocable — it wasn't).
- **False-positive noted:** the 4 "SECURITY DEFINER executable" advisor WARNs are expected (all guarded); leaked-password WARN is V6 (manual).

**The 3 durable guardrails (so V1-class holes can't recur):**
- **Tier 1 (prevent):** `supabase/tests/rls_regression.sql` — impersonates attacker+owner, asserts attacker DENIED (read/forge-invite/self-grant/sessions/stats) + owner allowed; **proven green vs prod** (rolled back). `supabase/schema/security_baseline.sql` — committed, diffable snapshot of the base schema's security surface (which lived only in the dashboard — where V1 hid). CSP as above.
- **Tier 2 (detect):** `src/instrumentation.ts` (`onRequestError`) structured error logging → Vercel logs now, forwards to `MONITORING_INGEST_URL`/Sentry when set.
- **Tier 3 (don't rot):** CI `npm audit --audit-level=high` gate + guarded `rls-tests` job (runs when `SUPABASE_DB_URL` secret set); `.github/dependabot.yml` weekly npm + actions updates.
- Runbook: [`docs/security.md`](docs/security.md) (layers, RLS tests, drift check, CSP roadmap, monitoring, manual steps).

**Files:** migrations `20260703200000_harden_invite_access.sql` + `20260703210000_harden_rpc_inputs.sql`; `next.config.ts`, `src/app/layout.tsx`, `public/sw-register.js`, `src/instrumentation.ts`, `src/app/auth/page.tsx`, `src/data/repositories/{invites,profile}.ts`, `src/infra/storage/pendingDiagnostic.ts`; `supabase/tests/rls_regression.sql`, `supabase/schema/security_baseline.sql`, `docs/security.md`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `package.json`.

---

## LATEST SESSION (2026-07-03) — DEVOPS / PRODUCTION-READINESS — **code SHIPPED; dashboard steps pending**

Designed the production deployment architecture and implemented every codeable part of a 6-item roadmap. **Recommendation (locked): stay serverless (Vercel + Supabase) — do NOT move to K8s** (it'd be a downgrade for a mostly-static app); the real risks were elsewhere (hand-applied migrations, one environment, no monitoring/DR). Full design in [`docs/devops.md`](docs/devops.md); rollback/incident runbook in [`docs/runbooks/rollback.md`](docs/runbooks/rollback.md).

**Shipped (code, all green — tsc + 25 tests + build + endpoints verified):**
- **CI/CD pipeline** — `ci.yml` made reusable (`workflow_call`); new **`deploy.yml`**: CI → apply migrations to **staging** + RLS suite → apply to **prod behind a required-reviewer gate**, via `supabase db push` (CLI-managed, replacing the hand-applied-via-MCP flow — the #1 reliability fix). `supabase/config.toml` added so migrations are CLI-linkable.
- **Monitoring** — `/api/health` (shallow liveness, 200, no DB — for uptime + K8s probe) and `/api/report-error` (client-crash sink → `MONITORING_INGEST_URL`/Vercel logs); `MiloErrorBoundary` now reports client crashes there (complements `instrumentation.ts` `onRequestError`, which is server-only). Both endpoints curl-verified 200.
- **Docs** — `docs/devops.md` (architecture, 3-env topology, CI/CD, scaling notes, monitoring layers + SLOs, and the full dashboard setup checklist) and `docs/runbooks/rollback.md` (code rollback = Vercel promote-previous; data = PITR/forward-fix; PITR restore drill; security-incident steps).

**Deliberately NOT done in code (correct calls):** no Docker/K8s (documented as the portability escape-hatch with a real Dockerfile + manifests in the chat design, to adopt only if an on-prem/multi-cloud requirement appears); rate-limiting is primarily **Supabase Auth limits** (dashboard) since the app calls Supabase directly (Vercel can't see that traffic) — the RPC surface is already bounded by ownership guards + learner cap + server-derived scores.

**The remaining items are all dashboard/account actions** — see the DevOps block in the MANUAL TO-DO list at the top (staging project, PITR, GitHub Environments + secrets, Vercel staging/Firewall/Speed Insights, log drain, uptime monitor). The pipeline is inert until the GitHub Environments + secrets exist.

**Files:** `.github/workflows/{ci,deploy}.yml`, `supabase/config.toml`, `src/app/api/health/route.ts`, `src/app/api/report-error/route.ts`, `src/shared/ui/ErrorBoundary.tsx`, `docs/devops.md`, `docs/runbooks/rollback.md`.

---

> ✅ **ARCHITECTURE REFACTOR — COMPLETE (2026-07-03, SHIPPED — `main`@`2f27f07`, Vercel prod READY, live 200).** Clean-architecture principle is officially DONE. Final follow-ups: (1) store merge/streak math extracted into a tested pure module `state/progressMerge.ts` (`mergeServerProgress` + `nextStreak`, +10 unit tests → 25/25; `/insights` signed-in verified live via user screenshot); (2) the `toast`-in-repository coupling was deliberately KEPT (revert) to preserve exact failure-path behavior. No open architecture items. Clean-architecture layering applied; **all file paths below this banner referencing `src/lib/…`, `@/lib/…`, `@/data/supabase/queries`, and `src/components/…` are now STALE.** New layout (see [`docs/architecture.md`](docs/architecture.md)): `src/core` (pure domain), `src/data` (supabase — `data/auth.ts` + `data/repositories/*` replaced the 797-line `queries.ts`), `src/infra` (kv/analytics/speech/offline/ar/storage), `src/state` (store), `src/shared` (ui kit + hooks), `src/features` (`chapters/{game,story,lessons,teen}`, `daily`, `insights`). No `createClient()` in any page (use `@/data/auth`). Behavior UNCHANGED; `tsc` + `npm test` 15/15 + `next build` all green; preview + prod builds both green on Vercel; 3 diff-agents + runtime smoke PASS. **Still worth a signed-in tap-through on prod** (login → parent dashboard → play → /insights) — the one path not verifiable headlessly. Translate old paths → new when reading the notes below.

Concise, current state. Per-chapter detail + conventions live in the auto-memory (`project-milo-6-8-story-conversion.md`, `feedback-story-demo-audio-pattern.md`, `project-milo-*-chapter.md`, `project-milo-demo-voice.md`, `feedback-viewport-scaling.md`, …) — read those for the deep notes.

## LATEST SESSION (2026-07-03) — CLEAN-ARCHITECTURE REFACTOR — **SHIPPED + LIVE** (`main`@`cdfad07`)

Rebuilt the `src/` structure on clean-architecture principles. **Behavior-preserving** (product unchanged); verified by 3 diff-agents (vs HEAD), a runtime smoke, a live signed-in `/insights` check, and green Vercel prod builds.

**New layout** (full map in [`docs/architecture.md`](docs/architecture.md)) — dependency rule `app → features → data → core`, inward-only:
- `src/core/` — pure domain (chapters, skillGraph, diagnosticEngine, diagnosticItems, adaptive, scoring, questionVariety, ageGroups, grammar, **leveling**). No React/Supabase/browser.
- `src/data/` — the ONLY Supabase layer: `supabase/*` (client/server/types + session/sync/guard hooks), `auth.ts` (auth adapter — the sole `supabase.auth.*` caller), `repositories/*` (profile·learners·grades·progress·sessions·diagnostics·invites + `_shared` + barrel — replaced the 797-line `queries.ts`).
- `src/infra/` — cross-cutting: `analytics`, `useMiloSpeaker`, `miloPointer`, `useOfflineSync`, `ar/*`, `storage/*` (kv, activePlan, lastPlayed, pendingDiagnostic, checkup).
- `src/state/` — the Zustand store + `progressMerge.ts` (pure merge/streak math).
- `src/shared/` — `ui/*` (the kit) + `hooks/*` (useViewport, useChapterPhase, useLearnerChapters).
- `src/features/` — `chapters/{game,story,lessons,teen}`, `daily`, `insights` (pure `metrics.ts` + `useInsights.ts` hook + thin page).

**Phases (all shipped):** P1 dissolve flat `src/lib` → layered dirs (281 git renames). P2 split `queries.ts` → repositories + barrel. P3 seal UI→Supabase boundary (new `data/auth.ts`; **no `createClient()` in any page**) + extract `/insights` feature slice. P4 extract `core/leveling.ts`; move `components/` → `shared/ui` + `features/chapters/*`. Follow-up: extract store merge/streak → `state/progressMerge.ts` **+10 tests**. (The `toast`-in-repository coupling was deliberately KEPT — reverted my decouple — to preserve exact failure-path behavior.)

**Commits (on `main`, all deployed READY):** `0d86380` (refactor P1–P4, via PR #27 `520aee2`) · `2f27f07` (store hardening + tests) · `21434d6`/`cdfad07` (handoff). **`tsc` + `npm test` 25/25 + `next build` green.** No DB/migration changes.

**Open items = none for architecture.** The only remaining human check is a fuller signed-in tap-through on prod (parent dashboard + playing a chapter to confirm coins/stars/streak); `/insights` already verified live. Pre-existing non-refactor item still standing: the `milo-happy.png`/`milo-thinking.png` 404s (silent, has fallbacks — needs an art/pose decision).

## CURRENT STATE (2026-07-03) — **ALL SHIPPED + DEPLOYED (Vercel READY)**

`main` at **`171a306`** → Vercel production READY. Everything below is committed, pushed, and live. `tsc` + `npm test` (15/15) + `next build` clean; Supabase advisors show ZERO new warnings. **2 additive SECURITY INVOKER RPC migrations APPLIED to prod** (`qaymxunzlarwusogwyak`): `get_parent_dashboard`, `get_insights_rollup`.

**Session commits (all pushed + deployed READY):** `b1c078a` assets · `ad582dc` data RPCs · `116bfe0` client · `42df3f4` next/image+lazy · `20992e8`→`171a306` checkup-gate fix (grandfather). Plus handoff docs commits.

**Genuinely open (needs YOU — none solo-codeable):** (1) human signed-in tap-through on live of the checkup flow + parent-dashboard/insights RPCs; (2) launch blockers — custom SMTP (deliverability), Sentry DSN (monitoring), Stripe, full CSP, leaked-password toggle, baseline schema dump, real week-6 cohort. (3) Minor: an existing kid that never played AND never did a checkup still gets the one-time checkup — grandfather is by play-history; offer "mark all current kids done" if unwanted.

### Shipped this pass (all verified)
- **Assets recompressed 244 MB → 22.8 MB (−90.7%)** via a one-time `sharp` pass (`public/assets`, 226 files, SAME filenames/formats → zero code refs changed; backgrounds cap 1536px, characters/shapes 768, objects 512; jpeg q78 / palette-png). **Originals backed up** in the session scratchpad (`.../scratchpad/assets-backup`). Sample decode-verified (alpha intact); Counting chapter live-verified in preview (crisp, no errors).
- **`next.config.ts`:** added `images` (AVIF/WebP, deviceSizes, 1yr cache — `sharp` present) + `experimental.optimizePackageImports` for the Supabase clients.
- **Parent dashboard N+1 killed:** new **`get_parent_dashboard()` RPC** (migration `20260703180000`, APPLIED) = whole dashboard in ONE round trip; client wired with a **fallback** to the per-learner path (`getParentDashboard` in `queries.ts`). Also: `access_role` now rides along on `getMyLearners` (`LearnerWithRole`), and the remaining per-learner reads run in parallel.
- **`/insights` server-side aggregation:** new **`get_insights_rollup(p_since)` RPC** (migration `20260703190000`, APPLIED) pre-aggregates the heavy `sessions` table + returns only compact rollups + raw `daily_complete` rows (client keeps the tested LOCAL-day streak math). Page prefers the RPC, **falls back** to the legacy raw-row path. `active_days` is UTC-day (documented); first/last/retention/accuracy/streak exact.
- **`getUser()` → `getSession()`** (no auth-server round trip) on the hot read paths: `getMyLearners`, `getMyAccessRole`, `getLearnerBootstrap`, parent load, insights load. RLS still the real boundary. ⚠️ worth one human signed-in tap-through of parent+menu to sanity-check auth.
- **Shared `useViewport` hook** (`src/lib/useViewport.ts`, rAF-throttled + unchanged-dim guard + lazy window init) → migrated **34 duplicate story hooks + ForestWalk** onto it (kills resize re-render storms; `useScale`/scale-number variants left alone).
- **ForestWalk `BiomeBackground`:** now mounts the heavy scrolling bg only for the active + fading-from biome (was ALL biomes at once → 3×8=24 bg imgs; steady state now 1). Cross-fade preserved. `ImageScroll` 8-copy left as-is (fw_bg −25% scroll math is tuned; not worth the seam risk).
- **`/story` preview route code-split** (was static-importing ~40 chapter components) → `next/dynamic`, mirroring `/game`. (`/game` was already lazy; `/teen-preview` already lazy.)
- **Menu bootstrap 30s TTL** (module-scoped) + **streak reconcile once-per-day guard** (`daily.ts` `milo_streak_recon_<id>`) → stop re-fetching on every menu mount / menu↔game bounce.
- **FitBox:** dropped permanent `will-change:transform` (fewer persistent GPU layers). Removed dead `easy-speech` dep.

### Pre-existing bug FOUND (not caused here, NOT fixed — needs an art/product call)
`/assets/characters/milo-happy.png` + `milo-thinking.png` are referenced in **~18 places** (root `/`, auth, shop, daily, CountingChapter, MiloBubble, ~7 lessons…) but **exist in neither the tree nor the original backup** → 404 (most sites have an `onError`/emoji fallback, so it's silent). The real poses are `milo_idle.png`/`milo_a.png`/etc. Fix = copy an existing pose to those two filenames (zero code change) OR add the real art. Deferred: picking the pose is an art decision.

### SHIPPED (committed + deployed) — `main` now at `42df3f4`
The whole perf pass IS committed + deployed to Vercel production (READY). Commits: `b1c078a` (assets) · `ad582dc` (data RPCs) · `116bfe0` (client) · `d5f924f` (handoff) · **`42df3f4` (next/image + lazy/async)**.

**next/image + lazy/async migration (2026-07-02, DONE + deployed):**
- **7 fixed-size hero/UI images → `next/image`** (landing, auth, auth/callback, shop, daily×2, CelebrationModal) → inherit the AVIF/WebP optimizer + srcset + 1yr cache; `priority` on the above-the-fold heroes. **Live-verified**: served via `/_next/image?...&w=256&q=75`.
- **`decoding="async"` on every remaining raw `<img>` (108 total) + `loading="lazy"` on all foreground sprites/avatars (86)**. Full-bleed scene backgrounds (per-screen LCP) are decoding-only, never lazy. MiloBubble kept as `<img>` (shared emoji-DOM fallback) + lazy/async. Story chapter + optimized auth hero verified in preview, no console errors.
- Note: a few dynamic-src avatars (menu/parent/profile fill-type) stayed `<img>` + lazy/async (next/image `fill` on those was low-value/higher-risk).

### CHECKUP GATE → NEW-KIDS-ONCE + GRANDFATHER EXISTING (2026-07-03, FINAL user decision — DONE)
Refined after the user saw "fully optional" also skipped it for NEW kids. **Final rule (user-picked): a brand-new learner does the checkup ONCE on first "Start learning"; established kids skip it and are never asked again.** `launchGame(d: LearnerData)` now: `isEstablished(d) || await hasCheckup(id)` → `/menu`, else → `/diagnostic?band=…`. `isEstablished` = any play history (`stats.last_played_at` / `total_xp>0` / `progress.length` / `sessions.length`). Both "Start learning" call sites pass the full `LearnerData`. Menu backstop stays REMOVED (the parent button is the real entry; avoids the earlier re-gate fighting). Completion sets `markCheckupDone` (localStorage) synchronously → "once" holds same-device even if the DB save lags. `tsc`+tests+build clean. **Committed + deployed.** (Superseded the "fully optional" commit `20992e8`.)

### CHECKUP GATE → NOW OPTIONAL (2026-07-03, user decision — SUPERSEDED by the block above)
User report: existing kid profiles were forced into the checkup on every "Start learning" (the mandatory gate from `065c443` — existing kids predate the feature so they had no checkup record → re-gated every time; nothing had saved since deploy). **Verified this was NOT the perf pass** (checkup/persist/save/active-learner code untouched by all perf commits). **User chose: make the checkup FULLY OPTIONAL.** Removed both play gates:
- `parent/page.tsx` `launchGame` — no longer async, no `hasCheckup` gate; "Start learning" → `/menu` directly.
- `menu/page.tsx` — deleted the `checkupState` redirect effect + splash-hold + `hasCheckup`/`isCheckupCached` import.
- Kept: the diagnostic itself + the parent "Find starting point" / "Re-check the gap" buttons (now opt-in). `markCheckupDone` still recorded on completion (harmless). `tsc` + tests + build clean.
- **NOT changed (separate marketing funnel, flag if unwanted):** the cold logged-out front door `/` → `/diagnostic` and the cold diagnostic report's signup CTA. Those are acquisition, not a play gate on existing kids.

### STILL OPEN
1. **Human signed-in verification** of: (a) "Start learning" now goes straight to the menu (no checkup) — auth-gated, couldn't drive in preview; (b) the parent-dashboard RPC + insights rollup + `getSession` swap on live.
2. The pre-existing launch items still stand (custom SMTP, Sentry DSN, Stripe, full CSP, leaked-password toggle, real week-6 cohort).

## LATEST SESSION (2026-07-02 — PRODUCTION-READINESS HARDENING + MANDATORY CHECKUP GATE) — **ALL SHIPPED**

`main` at **`d3b77b8`** → Vercel production (3 deploys this session, all READY). Ran a broad production-readiness audit (6 parallel agents), fixed the findings, built the mandatory checkup gate, cleared the safe backlog, and added tests + CI.
- **Commits:** `065c443` (audit fixes + checkup gate) · `80128cf` (M2 + anon-revoke + week-6 nudge) · `d3b77b8` (tests + CI). All pushed; all deployed READY.
- **3 migrations APPLIED to prod** (all backward-compatible, applied before their deploy): `diagnostic_idempotency` (H3), `insights_streak_indexes`, `revoke_anon_sync_rpcs`.
- **GitHub Actions CI is GREEN** (tsc + vitest + next build on push/PR to main).
- `tsc` + `next build` clean throughout.

### What each still-open item needs (none are code I can finish solo):
**custom SMTP** (email deliverability — the real launch blocker) · **Sentry DSN** (error monitoring) · **a real week-6 cohort** (efficacy) · dashboard toggle (leaked-password). Detail in "GENUINELY REMAINING" below.

### MANDATORY CHECKUP GATE (new feature this session)
The checkup (diagnostic) is now a **mandatory, once-per-child gate before play**. Decisions (locked w/ user): **per-child** (each learner takes it once; adding a 2nd kid → that kid must take it), **hard gate** (no play until done; parent dashboard stays open), **cold visitor must sign up** to proceed (no play-first taste).
- **`src/lib/checkup.ts`** (NEW) — `hasCheckup(learnerId)` = cache-first (`milo_checkup_done_<id>`) then DB (`getLatestGap`, which re-caches) → works cross-device; `markCheckupDone` / `isCheckupCached`. On-track kids (session, no gap) count as done.
- **Set on persist:** `markCheckupDone` in `diagnostic/page.tsx` persistDiagnosis + parent `handleAdd` cold replay.
- **Gate points:** `parent/page.tsx` `launchGame` (now async — "Start learning" → `/diagnostic?band=…` if no checkup) + `menu/page.tsx` (a `checkupState` gate effect redirects direct-nav to the checkup; splash holds until resolved). Backstops each other.
- **Cold front door:** root `/` logged-out → `/diagnostic` (not `/auth`); AgePicker has a **"Log in →"** button (returning users pull their checkup from their account). Cold report: removed the "just start playing" taste → **signup is the only way forward**.
- **VERIFIED LIVE** (direct-insert user, no email — see lesson above): checkup-less kid → "Start learning" **redirects to checkup**; direct `/menu` **also bounces**; complete checkup → cache flag set → **`/menu` allows** ("Hi, GateKid!"). Cold: root→`/diagnostic`+Log-in button; cold report shows only signup+Retake. All fixtures deleted; prod clean. `tsc`+`build` clean.
- **Note:** existing checkup-less learners WILL now be gated into the checkup on next play (intended — "mandatory for everyone"). **Files:** `src/lib/checkup.ts` (new), `src/app/{page,diagnostic/page,parent/page,menu/page}.tsx`.

### Capture-loss bug (pre-audit) — FIXED
Cold-traffic diagnostic capture was silently lost on signup: `takePendingDiagnostic` one-shot-cleared before an exact `band === age_group` match, and the add-learner modal defaulted `ageGroup` to `'3-5'`. Fix: `peekPendingDiagnostic` (no clear) + consume-only-on-match + 14-day TTL (`src/lib/pendingDiagnostic.ts`); modal prefills `ageGroup` from the captured band (`src/app/parent/page.tsx`).

### 6 High-severity fixes (all verified)
- **H1** login stranded on `/auth` → `router.replace('/parent')` on success + try/catch/finally (network wedge). `src/app/auth/page.tsx`. **Live-verified.**
- **H2** diagnosis save lost on any non-"Start the plan" exit → now **durable**: `enqueueDiagnostic` → IndexedDB queue → flush on online/mount (mirrors sessions), in `src/lib/useOfflineSync.tsx`; wired in `diagnostic/page.tsx` (persistDiagnosis) + parent replay. **Live-verified (DB row w/ client_id).**
- **H3** `sync_diagnostic`/`sync_recheck` non-idempotent → added `client_id` dedupe + `ON CONFLICT DO NOTHING`. **Migration `diagnostic_idempotency` APPLIED to prod** (`supabase/migrations/20260703150000_*`). Backward-compatible (old 10-arg call still resolves via `DEFAULT NULL` — verified). **Live dedup smoke-tested.**
- **H4** streak used UTC day-keys → local calendar keys + UTC-anchored adjacency (DST-safe). `src/lib/daily.ts`. Headless 6/6.
- **H5** 3–5 readiness re-check always false-"not closed" (used `makeItem` only) → `makeReadinessItem ?? makeItem` + parent-item render + `isPass`. `src/app/diagnostic/recheck/page.tsx`. **Live-verified (gap_closed=true saved).**
- **H6** no route guard on `/menu` `/game` → new `src/lib/supabase/useAuthGuard.ts` (getSession, offline-safe, fail-open); wired into both. **Live-verified (`/menu` → `/auth` bounce).**
- Plus **M1** (durable replay), **M3** (on-track signed-in → `/menu` not `/story`), **M4** (`m.exponentsRoots` seeded determinism), **M5** (`signOut` clears active learner).

### Low-priority batch
- Security headers (`X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`) all routes — `next.config.ts` (verified served). No CSP yet (needs its own allowlist pass).
- Removed dead `next-pwa` dep.
- Bounded the unbounded reads: 90-day window on `/insights`, 400-day on the streak reconcile. **This surfaced a latent schema bug: `sessions` has NO `created_at` (uses `started_at`/`completed_at`)** — the old insights query silently errored → session-retention was always empty. Fixed to `started_at` (`src/app/insights/page.tsx`). **Index migration `insights_streak_indexes` APPLIED to prod** (`20260703160000_*`, `sessions(learner_id, started_at)` + `learner_events(learner_id, event, created_at)`).
- Gated the 3 dev-only preview routes (`/kit-preview`, `/sim-preview`, `/integers-preview`) to non-prod via `notFound()` (404 in prod, live in dev). **`/teen-preview` kept public — it's in the cold funnel** (`startPlan` teen taste).

### Signed-in E2E — verified live, then cleaned up
Local build → prod Supabase, throwaway account: signup → SQL email-confirm → **H1 redirect** → add 3–5 learner → diagnostic **saved (root `e.patterns`, client_id populated)** → **H5 recheck** (parent card renders, gap_closed=true saved). All test data deleted; prod clean.
⚠️ **LESSON: this triggered a Supabase email-bounce warning** (signed up `milo.e2e.check@gmail.com`, a non-existent address → bounced). **Future signed-in E2E must create the user via direct `insert into auth.users` with `email_confirmed_at` preset (NO email sent), not via app signup.** Consider custom SMTP for prod.

### BACKLOG-CLEARING PASS (2026-07-02, later) — DONE this session
- **M2 DONE** — `getMyLearners` now THROWS on a real DB error (was returning `[]` → looked like "kids deleted"); the parent dashboard's existing `loadError` + "Try again" catches it. `/insights` got an `error` state + "↻ Retry" (checks `s.error`/`e.error`). `queries.ts`, `insights/page.tsx`.
- **anon-revoke DONE** — `revoke execute … from anon, public` on `sync_diagnostic`/`sync_recheck` (migration `20260703170000`, **APPLIED to prod**). Advisor re-run: the anon-executable WARNs are GONE; only the intended authenticated-executable WARNs remain (same as `sync_session`).
- **Week-6 re-check nudge (in-app) DONE** — `getCheckupStatus(learnerId)` (latest diagnosis age + whether a later re-check closed it) → a **"🔔 It's been N weeks — re-check <name>'s gap"** button on the parent card when a real gap is ≥6 weeks old and not yet closed. `queries.ts`, `parent/page.tsx`.
- **Tests + CI DONE** — vitest + jsdom; **15 tests / 6 files** (`src/lib/__tests__/`): engine root-gap exactness + cross-band, item seeded-determinism + answer∈choices, DST-safe `computeStreak`, pending-diagnostic peek/TTL, checkup cache, active-plan advance. `vitest.config.ts` + `vitest.setup.ts` (storage polyfill — node env has no localStorage). `.github/workflows/ci.yml` runs **tsc + `npm test` + `next build`** on push/PR to main. `npm test` green.
- **Live prod smoke DONE** — `curl` on `milo-story-mode.vercel.app`: root **200** + security headers live (X-Frame-Options: DENY / nosniff / Referrer-Policy); `/diagnostic` **200**; `/teen-preview` **200** (funnel); the 3 dev-preview routes **serve not-found content in prod (blocked)** — NOTE it's a *soft* 404 (HTTP 200, not 404; cosmetic only, content is not accessible). The signed-in click-through on the live URL by a human is the only smoke bit left (equivalent was verified locally against prod Supabase).

### GENUINELY REMAINING (needs a decision / dependency / is a separate track — NOT auto-doable)
1. **Human signed-in click-through** on the live `www.mi2utor.com` (cold link → checkup + Log-in; login redirect; checkup gate; the week-6 nudge on an old diagnosis). The edge/observable smoke is DONE (curl: headers + routes + dev-preview blocked); the equivalent signed-in flow was verified locally against prod Supabase — only a human tap-through on the live URL is left.
2. **Week-6 auto-nudge email/cron** — the IN-APP nudge is done; automating the reminder needs a cron/edge-function + **email, which is blocked on custom SMTP** (the built-in mailer already tripped a bounce warning). Set up SMTP (Resend/SES/Postmark) first, then a scheduled job.
3. **Monetization (Stripe)** — deliberately deferred; needs pricing/business decisions + a Stripe account + keys. Best placed at the report or the week-6 "gap closed" moment. Not auto-buildable.
4. **Full CSP** — needs a nonce-based Next 16 pass (script-src) or it breaks the app; `X-Frame-Options: DENY` already covers clickjacking. Separate careful task.
5. **Leaked-password protection** — one-click enable in the Supabase dashboard (Auth → Password); no code/MCP path.
6. **Baseline schema migration** — the base tables/policies live only in the prod dashboard (not in `supabase/migrations/`); a `supabase db dump` (CLI) into a baseline file makes migrations reproducible. Needs the CLI, not the MCP.
7. **Marginal Lows (left on purpose):** progress-dots dead state (cosmetic), `advancePlan` localStorage-write stall (private-mode only; DB has the authoritative plan), cap-truncated plan under-listing later gaps (root is still correct — changing caps risks the anti-fear UX). Documented, not worth the churn/risk.
8. **Efficacy discipline** (real cohort week-6 number + teacher sign-off on graph spine edges) — not code. Plus the older architectural backlog (RPC consolidation, AR-hook cleanup) is a separate, larger track. (vitest+CI is now DONE.)

---

## LATEST SESSION (2026-07-02 pm) — **the ROOT-GAP DIAGNOSTIC is now a COMPLETE, LIVE product** — SHIPPED + VERIFIED END-TO-END

`main` at **`256dc41`** → Vercel production. Took the diagnostic from "9–11 prototype" to the full funnel, live-verified on a real account. Full detail + file lists in the **DIAGNOSTIC PHASES** section below; the short version:

- **All 6 bands work** (`/diagnostic?band=…`): 6–8 · 9–11 · 12–14 (`m.*`) · 15–16 (`a.*`) · 17–18 (`c.*`) remediation, and **3–5 as a parent-guided READINESS variant**. Every band's items + entries built and headless-verified (planted single-gap → exact root, incl. cross-band down to counting). **Phase 4 per-child items** (name + theme + stable seed). Fixed a real engine bug (`normalize` double-shift) that broke multi-gap detection across all bands.
- **The funnel is wired (no longer an orphan):** `/auth` "take the free check" entry + a cold-traffic age picker; report **capture CTA** stashes the result through sign-up; **play-first dead-end closed** (a `TasteBanner` sign-up prompt on the free sample). Parent dashboard has **"Find starting point"** + **"Re-check the gap"** buttons.
- **The real-app loop is closed (steps 6/7/8):** signed-in "Start the plan" saves the arranged plan + enters the REAL progress-saving app; the menu **"Continue your plan" card** walks the chapters (advances in `/game` on completion); the **week-N re-check** (`/diagnostic/recheck`) proves the gap closed.
- **VERIFIED LIVE on a real (throwaway, since-deleted) account:** sign-in → add learner → Find starting point → diagnostic **saved to DB** → Start the plan → real menu **plan card renders** → Re-check → **recheck saved to DB**. Caught + fixed 2 real bugs: `sync_recheck` bad `ORDER BY` column, and a fast-click aborting the diagnosis save. `sync_recheck` migration **APPLIED to prod** (+ fix). Test data deleted — prod clean.
- **Still open (deferred, not blocking):** week-6 **auto-nudge** (cron/email — flow is manual-runnable now); **no monetization** yet ("you don't pay" has no payment to waive — deliberately later). Minor: unused `?plan=1` param; consider an offline/queued retry for the diagnosis save (like sessions have).

---

## EARLIER (2026-07-02 am) — **shipped the big batch + built the ROOT-GAP DIAGNOSTIC (Phase 0 + Phase 1)** — COMMITTED + DEPLOYED

Two workstreams; both **committed + pushed to `main` → Vercel production READY**, and both prod migrations **applied**.

### 1. Shipped the accumulated batch — commit `4806b95` (deploy READY)
- **Responsiveness audit — ALL 72 chapters across all 6 bands** (static audit + live spot-checks). 70/72 clean; fixed the 2 exceptions: **ShapeStudio** (6–8 `shapes2d3d` — short-landscape shape/button overlap → wrapped in `FitBox` + proper bottom-reserve) and **SliceShop `GroupView`** (6–8 `fractions` — the `fill:both` transform-override trap; split animation onto an outer wrapper). Both live-verified at 360×/740×360.
- **Interactive "Explore" simulators added to ALL 12 of the 9–11 chapters** — a play-with-it-first phase inserted `intro → explore → demo → guided → practice`, via NEW shared kit primitives **`PtSlider` / `PtReadout` / `ExploreScaffold`** in `story/preteen/kit.tsx`. Each chapter has a bespoke slider-driven sim (FactorScope, PlaceBuilder, RoundScope, ArrayScope, ShareScope, FractionScope, DecimalScope, ConverterScope, PlotScope, AngleScopeSim, ChartScope, BriefScope). All 12 verified live at 375px; 2 overflow bugs fixed (NumberVault block chart → FitBox; DivisionShare equation → responsive clamp).
- Plus the previously-uncommitted 6–8 story set + all 9–11 HUD chapters + 17–18 teen band (detail below).
- **17–18 seed migration APPLIED to prod** (`20260702140000_…`; chapters 59 → 72, verified).

### 2. NEW workstream: ROOT-GAP DIAGNOSTIC — commit `bf31982` (deploy READY) — live at `/diagnostic?band=9-11`
The "reason-to-buy" product: a play-along diagnostic that finds a child's **root gap** (the deepest broken prerequisite), then shows the parent *strengths → the one snag → downstream cost → a plan → a 6-week guarantee* and launches the actual remediation chapter. **Cross-band by design** — a 15–16 student can root at a grade-4 gap (the moat: we own content at every depth). Design/spec docs: `docs/skill-graph.md`, `docs/diagnostic-engine.md`, `docs/skill-graph-validation.md`.
- **`src/lib/skillGraph.ts`** — unified 3→18 graph (74 nodes → all 72 chapters, prereq edges + 7 cross-band spines). Source of truth in code (like `chapters.ts`). Integrity-checked (no dangling ids, no upward prereqs). `multFacts`/`fractionEquiv`/`fractionOps`/`signedOps`/`placeValue2` are the load-bearing nodes.
- **`src/lib/diagnosticEngine.ts`** — pure, framework-free. `startProbe → nextSkill → record → diagnose`; DFS "descend into the failing prerequisite" → root gap + foundational-first plan + compelling downstream highlights. Anti-fear caps. **12/12 headless checks.**
- **`src/lib/diagnosticItems.ts`** — one MCQ per 9–11-reachable skill.
- **`src/app/diagnostic/page.tsx`** — intro → probe (kid-facing: no score, no red X) → parent report → **"Start the plan"** navigates to the real `/story?ch=` chapter. 9–11 entries cover all six strands (mult / fraction / division / decimal / geometry / data).
- **Persistence** — `supabase/migrations/20260703090000_diagnostic_engine_schema.sql` **APPLIED to prod**: 5 result tables + read-only RLS (via `learner_access`) + **`sync_diagnostic` SECURITY DEFINER RPC** (mirrors `sync_session`). Client **`saveDiagnostic()`** in `supabase/queries.ts`, best-effort (skips cleanly in the unauthenticated preview). RPC happy-path smoke-tested on prod, then test rows deleted (prod clean).

### DIAGNOSTIC PHASES — done vs remaining
- **Phase 0 — unified skill graph:** ✅ **DONE** (committed + deployed).
- **Phase 1 — engine + prove on 9–11 core band + persistence:** ✅ **BUILT** (committed + deployed). Remaining gates are **NOT code**: (a) **real teacher sign-off** on the graph's spine edges (`docs/skill-graph-validation.md`); (b) **a real 9–11 cohort → week-6 efficacy/retention number** — the actual *point* of Phase 1. Until those clear, don't scale the guarantee.
- **Phase 2 — roll the diagnostic to the other 4 remediation bands:** ✅ **DONE for all remediation bands — 6–8 + 12–14 + 15–16 + 17–18 built + verified (2026-07-02, NOT committed).** 9–11 was the template; all four now covered. (Only the 3–5 *readiness* variant remains, but that's Phase 3 — a different shape.) Each band = a 3-part job with **no engine changes** (engine/report/route are band-agnostic via `?band=`): (1) `PROBE_ENTRY[band]` covering that band's strands, (2) item generators in `diagnosticItems.ts`, (3) band-specific report framing.
  - **6–8:** Added the **number/place-value strand entry** → `PROBE_ENTRY['6-8']` is now `['p.compare100','p.addTo100','p.multConcept','p.fractionsIntro']` (was missing a direct number-sense probe; place value was only reached by descending from add). **No new item generators needed** — the whole 6–8 reachable set (compare100 / addTo100 / multConcept / fractionsIntro + 3–5 prereqs) is a subset of the 9–11 prereqs, so every generator already exists (`diagnosticItems.ts` doc comment updated to note this). **Report/route unchanged** — band-agnostic framing reads correctly for a 6–8 parent (strengths + snag + downstream naming + plan all land on 6–8/adjacent skills). **Verified:** 29/29 headless checks (every reachable skill has an item; grade-level learner → no gap; 8 planted single-gap learners each resolve to the exact root; cross-band 6–8→3–5 root; foundational-first plans; chapters map) + **live at `/diagnostic?band=6-8`** (probe cycles → report renders → "Start the plan" launches the correct remediation chapter e.g. `/story?ch=numbers`; zero console errors). `tsc` clean. **Only edited files:** `src/lib/skillGraph.ts` (1 line) + `src/lib/diagnosticItems.ts` (comment).
  - **12–14 (2026-07-02):** Expanded `PROBE_ENTRY['12-14']` to full six-strand coverage (matching the 9–11 template) → `['m.signedOps','m.rationalOps','m.ratioProportion','m.equationsIneq','m.linearRel','m.geomMeasure']` (added linear-relationships + geometry as direct strand probes; was 4 entries). **Wrote 11 NEW `m.*` item generators** in `diagnosticItems.ts` (a `── 12–14 (middle) ──` section): m.integers, m.signedOps, m.rationalOps, m.ratioProportion, m.exponentsRoots, m.orderOps, m.algExpressions, m.equationsIneq, m.coordinatePlane, m.linearRel, m.geomMeasure — all MCQ, math-without-fear (no free-typed answers). The 9–11/6–8/3–5 prereqs they descend into reuse existing generators. **Fixed `startPlan` in `diagnostic/page.tsx`:** a cross-band plan can start at a TEEN chapter (12–18) that isn't in `STORY_KEY` — it now routes those to `/teen-preview?c=<chapterId>` instead of falling back to the default story route (3–5/6–8/9–11 still go to `/story?ch=<key>`). **Verified:** 68/68 headless checks (every reachable skill has an item; all 11 new gens: answer∈choices over 200 draws each; grade-level → no gap; 15 planted single-gap learners → exact root incl. cross-band down to `e.counting10` 3 bands below; plans foundational-first + distinct) + **live at `/diagnostic?band=12-14`** (probe cycles through signed-ops/rational-ops/equations/order-of-ops etc.; report reads correctly — snag + downstream naming + plan; `/story?ch=times` launch works AND `/teen-preview?c=equationsInequalities` renders the teen chapter; zero console errors). `tsc` clean. **Edited files:** `src/lib/skillGraph.ts`, `src/lib/diagnosticItems.ts`, `src/app/diagnostic/page.tsx`.
  - **15–16 (2026-07-02):** Expanded `PROBE_ENTRY['15-16']` from 3 → 7 entries for full Algebra-I + Geometry strand coverage → `['a.signedFluency','a.linearEqIneq','a.functions','a.quadratics','a.systems','a.geomTransform','a.proofTrig']` (added quadratics, systems, and both geometry entries — a.geomTransform is otherwise a leaf reached by nothing). **Wrote all 12 `a.*` item generators** (`── 15–16 (Algebra I / Geometry) ──` section): signedFluency, expressions, linearEqIneq, slopeGraphs, functions, systems, expPolynomials, radicals (Pythagorean triples), factoring, quadratics (roots), geomTransform (reflection), proofTrig (complementary angles) — all MCQ. Report/route unchanged (band-agnostic; teen launch already fixed under 12–14). **Verified:** 84/84 headless checks (every reachable skill has an item; all 12 gens answer∈choices + distinct choices over 300 draws; grade-level → no gap; 17 planted single-gap → exact root incl. cross-band to `e.counting10` 4 bands below; plans foundational-first) + **live at `/diagnostic?band=15-16`** (probe cycled a.signedFluency → descended through 12-14/6-8; report reads correctly; a deep run produced the full cross-band plan Counting → … → Integers → Signed Number Ops → Signed & Real Numbers spanning 4 bands; zero console errors). `tsc` clean. **Edited files:** `src/lib/skillGraph.ts`, `src/lib/diagnosticItems.ts`.
  - **17–18 (2026-07-02):** Expanded `PROBE_ENTRY['17-18']` from 3 → 8 entries for broad Algebra II / Pre-Calc / Stats / Calc coverage → `['c.introCalculus','c.trigGraphsId','c.expLog','c.complex','c.conics','c.systemsMatrices','c.sequencesSeries','c.statsInference']`. **Wrote all 13 `c.*` generators** (`── 17–18 ──` section): functionToolkit (f(x)), quadraticAnalysis (vertex), polynomialFns (degree), complex (a+bi addition), rationalFns (vertical asymptote), expLog (log_b), unitCircleTrig (common-angle table), trigGraphsId (amplitude), conics (circle radius), systemsMatrices (2×2 determinant), sequencesSeries (next term), statsInference (mean), introCalculus (power-rule derivative). **Also added `m.percentages`** — newly reachable via `c.statsInference → m.percentages` (had no generator before; placed in the 12–14 section). **CONFIG CHANGE (in `diagnosticEngine.ts`, config not logic):** raised the teen failure/length caps → `12-14 {16,12}`, `15-16 {20,16}`, `17-18 {24,20}`. Why: expanding to 6–8 entries means a deeply-behind kid fails all entries immediately, and the old `maxFailures:8` (tuned for the shallow 9–11 band) was spent on entry probes alone → the DFS truncated before reaching the true cross-band root (surfaced a mid-level `m.linearRel` instead of the planted `m.signedOps`). The cap is an anti-fear backstop, NOT the length lever (maxItems is); the descent gets EASIER toward the bottom, ending on success. Typical probe is 8–12 questions; only a severely-behind kid reaches ~20. **Verified:** 62/62 combined teen checks (all same-band single-gap roots EXACT; realistic cross-band deep roots down to `i.multFacts` EXACT; extreme floors `p.placeValue2`/`e.counting10` in a teen now resolve EXACTLY too; 6–8 + 9–11 regression clean) + earlier 101/107 → now 0 failures after the cap fix + **live at `/diagnostic?band=17-18`** (probe cycles calc/trig/etc.; report reads correctly — a deep run produced the 14-chapter cross-band plan Multiplication → … → Intro to Calculus spanning 5 bands; `/story?ch=multiply` launch works; zero console errors). `tsc` clean. **Edited files:** `src/lib/skillGraph.ts`, `src/lib/diagnosticItems.ts`, `src/lib/diagnosticEngine.ts`.
  - **All remediation bands done.** `startPlan` teen-launch fix covers all teen chapter launches.
- **Phase 3 — 3–5 readiness variant:** ✅ **DONE (2026-07-02, NOT committed).** The 3–5 band is now a READINESS check, not a remediation root-gap hunt. **Parent-guided/observational items** (`makeReadinessItem` + `READINESS_GENERATORS` in `diagnosticItems.ts`, `kind:'parent'` + `passSet`): the parent does a short hands-on activity with the child ("Lay out 8 apples, ask Ada to count them") and taps how it went — `['Yes, on their own','With a little help','Not yet']`, first two = "can do". `PROBE_ENTRY['3-5']` set to the 8 readiness milestones (counting, numeralRecog, matchQty, compare, numberOrder, addWithin10, shapes2d, patterns); `DEFAULT_CONFIG['3-5'] = {12,8}` so every milestone is probed. **New warm readiness REPORT** (`ReadinessReport` in `diagnostic/page.tsx`): verdict (Kindergarten-ready / Almost there / Building foundations by #not-yet) → "what they can already do" (celebrate passed) → "let's grow together" (not-yet milestones) → "play these together" (plan chapters) → soft "no pressure, no scores" promise. Parent-facing intro copy + lime accent + a dedicated stacked-outcome-button probe layout for parent items. **Engine:** added `probedPassed`/`probedFailed` to `Diagnosis` for the readiness report. **Verified:** headless (all 8 milestones have readiness items; all-ready → no failed + covers entry set; isolated shape gap → only shapes not-yet; plan starts at the not-yet chapter) + **live at `/diagnostic?band=3-5`** (personalized "Ada"+🍎 activities; mixed run → "6 of 7 ready, Almost there, grow: 2D shapes → Shape House"; all-pass → "Kindergarten-ready", all 8 listed; "Start playing" → chapter launch; zero console errors).
- **Phase 4 — per-child generated items:** ✅ **DONE (2026-07-02, NOT committed).** A `DiagContext {name, theme, seed, nonce}` makes each child's probe **deterministic + reproducible + personalized** (in `diagnosticItems.ts`): a seeded RNG (`mulberry32(hashStr(seed|skill|nonce))`) so the same child re-hydrates the same items and re-takes vary by `nonce` (attempt counter); prompts flavored by `name` (readiness: "Ask Ada…") and `theme` emoji (count items: ★/🚀/🐢/🍎/⚽ via `pickThemeFor(seed)` when the learner has none). `makeItem`/`makeReadinessItem` take an optional ctx; **no-context = legacy Math.random** (unchanged). The page builds ctx from the active learner (`buildContext`). **Verified:** headless (same seed+nonce → identical item; different nonce → varies; different child → 6/6 skills differ; theme flavors matchQty; name in readiness prompts; deterministic `pickThemeFor`) + live (Ada+fruit personalization visible).
- **⚠️ ENGINE BUG FIXED (2026-07-02) — affects ALL bands, incl. the already-shipped 9–11:** `normalize()` did an extra `s.agenda.shift()` when a failed entry rooted, but `record()` had already shifted that entry off → it **silently skipped the NEXT entry**. Masked by single-gap tests (the planted gap was always found on the first failing branch). Surfaced by 3–5 readiness (leaf entries → immediate root → `patterns` milestone dropped). Fix: removed the stray shift (the skip-seen loop advances the agenda). **Payoff:** multi-gap detection now works — a learner with two independent gaps on separate spines surfaces BOTH `rootGap` + `secondGap` (the docs call for this; the bug prevented it). Re-verified with an 80-check full matrix: all bands grade-level → no gap AND all entries probed; every same-band single-gap → exact root; cross-band deep roots exact; multi-gap surfaces both; readiness probes all 8. Zero regressions. `next build` + `tsc` clean.
- **Phase 3/4 edited files:** `src/lib/diagnosticItems.ts` (Phase-4 ctx/seed/theme infra + `READINESS_GENERATORS` + `makeReadinessItem`), `src/lib/skillGraph.ts` (`PROBE_ENTRY['3-5']`), `src/lib/diagnosticEngine.ts` (3–5 config, `probedPassed`/`probedFailed`, the `normalize` agenda-shift fix), `src/app/diagnostic/page.tsx` (ctx wiring, parent-item probe layout, `ReadinessReport`/`RemediationReport`/`ReportShell` split, per-band accent).

### FUNNEL WIRING — the diagnostic is no longer an orphan (2026-07-02, NOT committed)
Founder-mode review found the diagnostic worked internally but was **unreachable by real users** (no link anywhere — only by typing `/diagnostic`), and captured nothing at the peak-intent moment. Wired the two highest-leverage pipes:
- **#1 Front door / entry points:** (a) `/auth` now shows a cold-traffic entry — *"🔍 Not sure where they are? Take the free 2-minute check →"* (no account needed). (b) `/diagnostic` with **no `?band=` and no active learner** now shows an **age picker** (`AgePicker`, band === age_group) so cold traffic self-selects; band precedence = `?band=` → active learner `age_group` → picker. (c) Parent dashboard active-learner card has **"🔍 Find <name>'s starting point"** → `setActiveLearner` + `/diagnostic?band=<age_group>` (so it saves + personalizes to their name).
- **#2 Capture at peak intent:** on the report, a **cold (logged-out) parent** sees a primary **"Save this plan — free account →"** CTA (signed-in users skip it — their result already auto-saves). It **stashes** the result (`src/lib/pendingDiagnostic.ts`, localStorage, one-shot) → routes to `/auth`; when the parent then creates a learner, `handleAdd` in `parent/page.tsx` **replays it** via `saveDiagnostic` (matched by band === age_group). Also fixed: diagnostic reads the learner's `display_name` for Phase-4 name personalization (was `name`, which learners don't have).
- **Verified live:** cold `/diagnostic` → age picker → 9–11 probe → report leads with "Save this plan — free account" + "Free to start · week 6" → click stashes `{band, rootGap, planChapters, 9 items}` + lands on `/auth` (front-door link present); signed-in (`?band=9-11` + active learner) → picker skipped, no capture, "Start the plan". `tsc` + `next build` clean; zero console errors. Parent-page button + replay are code/build-verified (auth-gated, not live-drivable in the unauthenticated preview).
- **NEW files:** `src/lib/pendingDiagnostic.ts`. **Edited:** `src/app/diagnostic/page.tsx`, `src/app/parent/page.tsx`, `src/app/auth/page.tsx`.
### FULL LOOP CLOSED — steps 6, 7, 8 built (2026-07-02, NOT committed)
The last three pipes — get them into the REAL app, walk the plan, prove it closed:
- **Step 6 — real door:** signed-in "Start the plan" now **saves the arranged plan** (`src/lib/activePlan.ts`, per-learner localStorage pointer) and routes to `/menu?plan=1` (the real, progress-saving app) instead of the preview. Cold/preview still uses the free preview door. Verified live: signed-in report → "Start the plan" stashes `{band, 7 chapters, index 0}` and lands on `/menu`.
- **Step 7 — walk the plan:** (a) a **"🎯 Your plan · step N of M · Next: <chapter> [Continue]"** card on `/menu` (prominent, above Daily) launches the current plan chapter via the normal play path; (b) `/game` `handleComplete` calls `advancePlan(learner.id, chapter)` so finishing a plan chapter moves the pointer → the menu card shows the next one. Plan-store logic 12/12 headless (advance only on the current chapter, off-plan plays don't advance, progress readout, completion → null). Menu card + game hook are code/build-verified (auth-gated, not live-drivable in preview).
- **Step 8 — the week-N re-check (the guarantee loop):** new **`/diagnostic/recheck?skill=<rootGap>&band=<band>&week=6`** — re-probes the root gap (+1–2 nearest dependents via `recheckSkills` in the engine); "gap closed" = the root now passes. Warm result: **"🎉 It's clicking now — promise kept"** or **"🌱 Getting there."** Verified live BOTH ways (root correct → closed; root wrong → not-closed; zero console errors). Persistence: **`saveRecheck` + `getLatestGap`** in `queries.ts` + a **`sync_recheck` RPC migration** (`supabase/migrations/20260703120000_sync_recheck.sql`) — **✅ APPLIED to prod** (`qaymxunzlarwusogwyak`, migration `20260702113253_sync_recheck`, 2026-07-02). Security advisor: only the same benign "SECURITY DEFINER executable" WARN the shipped `sync_diagnostic`/`sync_session` already carry — safe (internal `learner_access`/`auth.uid()` ownership check; anon → NULL uid → denied). Real end-to-end save **VERIFIED LIVE** (see the SHIPPED note below) — the ORDER-BY bug this uncovered is fixed. Trigger: a **"🔁 Re-check the gap"** button on the parent learner card (loads the learner's latest root gap → opens the re-check). The **week-6 auto-scheduling** (cron/email nudge) is the only remaining piece — the flow itself is done and live.
- **NEW files:** `src/lib/activePlan.ts`, `src/app/diagnostic/recheck/page.tsx`, `supabase/migrations/20260703120000_sync_recheck.sql`. **Edited:** `src/app/diagnostic/page.tsx` (startPlan real-door), `src/app/parent/page.tsx` (setActivePlan on replay + re-check button + `recheckGap`), `src/app/game/page.tsx` (advancePlan on complete), `src/app/menu/page.tsx` (plan card), `src/lib/diagnosticEngine.ts` (`recheckSkills`), `src/lib/supabase/queries.ts` (`saveRecheck`/`getLatestGap`). `tsc` + `next build` clean.
- **✅ SHIPPED + VERIFIED LIVE (2026-07-02):** the whole diagnostic batch (all phases + funnel + steps 6/7/8 + the play-first dead-end fix) is **committed + pushed to `main` → Vercel** (main now at `760a2f5`; commits `232a005`/`35e88c2`/`83303ed`/`760a2f5`). **Ran a REAL signed-in end-to-end test** on a throwaway account (created + email-confirmed via admin, then deleted — prod clean): sign in → add learner → "Find starting point" → diagnostic → **sync_diagnostic SAVED** (verified DB row: root `e.counting10`, 9 items, full plan) → "Start the plan" → real `/menu` with the **"YOUR PLAN · STEP 1 OF 6 · Next: Counting" card rendering** → "Re-check the gap" → getLatestGap → recheck → **sync_recheck SAVED** (verified row: week 6, gap_closed=true).
- **Two real bugs the live test caught + fixed (deployed):** (1) `sync_recheck` ordered `diagnostic_sessions` by `created_at`, which doesn't exist (cols are `started_at`/`completed_at`) → the RPC errored and re-checks never saved. Fixed in prod (`fix_sync_recheck_order_by`) + migration file. (2) "Start the plan" could abort the in-flight `sync_diagnostic` save on a very fast click (`window.location` kills pending fetches) → now **awaits the save (4s cap) before navigating**. Both live-re-verified (recheck row persisted after the fix).
- **Play-first dead-end CLOSED:** cold "Just start playing" now stashes the result too + the free sample shows a `TasteBanner` "create a free account" prompt (`?taste=1`). Live-verified logged-out.
- **Still open (deferred, not blocking):** the **week-6 auto-nudge** (a cron/email to prompt the re-check — the flow is manual-runnable now); and **no monetization** yet ("you don't pay" has no payment to waive — deliberately later: capture leads + prove gap-closure first). Minor: the `?plan=1` menu param is unused (cosmetic); a fast-click during a flaky network is now save-guarded but consider a queued/offline retry for the diagnostic save like sessions have.
### NEXT SESSION — the diagnostic product is DONE + live; pick up the deferred loops or new work
The full diagnostic (all 6 bands + readiness + per-child + funnel + real-app loop + re-check) is **shipped to prod (`main`@`256dc41`) and verified live.** No diagnostic build work is outstanding. What remains is deferred/optional:
1. **Week-6 auto-nudge** — the re-check runs manually today (parent taps "Re-check the gap"). Automate the prompt at week 6: a scheduled job / email that surfaces the re-check for learners whose diagnosis is ~6 weeks old. This is what makes the guarantee *operational* (and the retention + efficacy loop). Needs a cron/edge-function + a "diagnosed_at + not-yet-rechecked" query.
2. **Monetization** — none wired; "you don't pay" has no payment to waive. Deliberately later: capture leads + prove gap-closure first, then add a trial/paywall (Stripe). Best placed at/after the report or the week-6 "gap closed" moment.
3. **Robustness polish:** give the diagnosis save the same offline/queued-retry treatment `syncSession` has (currently best-effort + a 4s await-before-nav guard); remove/wire the unused `/menu?plan=1` param; per-band report copy for 15–16/17–18 ("and in time, algebra" reads oddly for kids already past algebra — only appends when `reachesAlgebra`).
4. **Efficacy discipline (from Phase 1, still standing):** the guarantee shouldn't scale until a real cohort produces a week-6 retention/efficacy number, and a real teacher signs off on the skill-graph spine edges (`docs/skill-graph-validation.md`).

**Headless verify recipe (reusable):** write `._diagNNNN.mts` at repo root importing from `./src/lib/{diagnosticEngine,skillGraph,diagnosticItems}`, use `runProbe(band, oracleGap(skill))` where `oracleGap = gap => id => id!==gap && !prereqClosure(id).has(gap)`; assert `result.rootGap === gap`. Run `npx tsx ._diagNNNN.mts && rm ._diagNNNN.mts`. For readiness/parent items, drive with `makeReadinessItem` + `record(s, skill, passed)`. **Live signed-in test:** the app requires email-confirmed auth — create a user then `update auth.users set email_confirmed_at=now()` via the Supabase MCP to sign in; clean up test learner + user after (cascades handle the diagnostic rows).

Keep the "prove Phase 1 on a real cohort before scaling the guarantee" discipline.

**Headless verify recipe (reusable):** write `._diagNNNN.mts` at repo root importing from `./src/lib/{diagnosticEngine,skillGraph,diagnosticItems}`, use `runProbe(band, oracleGap(skill))` where `oracleGap = gap => id => id!==gap && !prereqClosure(id).has(gap)`; assert `result.rootGap === gap`. Run `npx tsx ._diagNNNN.mts && rm ._diagNNNN.mts`.

---

## EARLIER THIS SESSION — 17–18 band build (NOW SHIPPED in `4806b95` + 17-18 migration APPLIED)

Built the final teen band **17–18 (Algebra II / Pre-Calc / Statistics / intro Calculus)** — all 13 chapters, in the existing teen "Field Lab" design (NOT the 9–11 HUD). Each = a chapter component (portal → intro `CaseCard` → explore `ExploreStep`+sim → lesson `TeenLessonShell` → adaptive practice → `MasteryState`, mirroring `game/IntegersChapter.tsx`) + a lesson (`lessons/*TeenLesson.tsx`). `BAND='17-18'`, `TOTAL_ROUNDS=8`, `useAdaptive(skillId)` L1/L2/L3, reteach-after-3, mastery early-exit, ALL answers MCQ via `ChoiceGrid` (math-without-fear: no free-typed irrationals/complex). Built by 13 parallel subagents in 3 waves; `tsc --noEmit` clean project-wide.

**The 13 (skillId · component · sim):** functionToolkit·FunctionToolkitChapter·TransformExplorer · quadraticAnalysis·QuadraticAnalysisChapter·ParabolaExplorer · expLogFunctions·ExpLogFunctionsChapter·GrowthExplorer · systemsMatrices·SystemsMatricesChapter·SystemExplorer · polynomialFunctions · rationalFunctions · complexNumbers · sequencesSeries · statsInference (Wave 2, inline CoordGrid sims) · unitCircleTrig · trigGraphsIdentities · conicSections · introCalculus (Wave 3, **bespoke inline sims** — unit circle, sine wave, conic morph, secant→tangent). Lessons: `lessons/<Name>TeenLesson.tsx` (each exports `makeRound(d)`, a `<X>Watch` reteach component, default lesson).

**Wiring done:** 13 ids added to `ChapterType` + 13 `CHAPTER_META` (ageGroups `['17-18']`) in `chapters.ts`; 13 dispatch lines in `game/page.tsx` `CHAPTER_COMPONENTS`; 13 ids added to the `/teen-preview?c=` map. `AgeGroup` already had `'17-18'`; `[data-band="17-18"]` theme + `CaseCard`/`MasteryState`/`BAND_FRAMING` 17-18 variants pre-existed.

**Migration WRITTEN, NOT applied:** `supabase/migrations/20260702140000_seed_chapters_17_18.sql` — widens `learners.age_group` CHECK to include `'17-18'` + seeds the 13 chapter rows (sort 60–72). **Must be applied to prod Supabase before real 17-18 sessions can save** (FK → chapters.id). Chapters render/play in preview without it.

**Live-verified sample (via `/teen-preview?c=<id>`, no auth):** functionToolkit (full flow: intro→sim→lesson→practice, grading, progression, `f(3)=8` correct) · introCalculus (bespoke secant→tangent sim CORRECT: P@x=2, h=1.6→secant 5.60, derivative 4; practice `lim x→2 x²+1=5` correct) · unitCircleTrig (bespoke unit-circle sim CORRECT: 45°=0.25π, (0.71,0.71)) · complexNumbers (string-answer MCQ works: `i²=−1`, `(3−4i)−(−4−4i)=7`). Zero console errors. The other 9 are tsc-clean + pattern-identical (not each eyeballed).

**RESPONSIVE — VERIFIED across the 17-18 band** (narrow portrait 360, short landscape 740×360, tablet/desktop). All 13 share the shipped teen layout (TeenTopbar + centered flex `main` + ChoiceGrid + ExploreStep + TeenLessonShell). Findings: (a) **labels never horizontally overflow** — even a worst-case spaceless matrix string "[[−12,−7],[13,−8]]" and coordinate/sentence answers wrap inside the 156px tile at 360px (injected-label measurement); (b) **practice screens fit cleanly** at 360 and 740×360 (4 choices in a 2×2 grid on-screen, no offscreen/overlap); (c) **every sim type scales to viewport** with no h-overflow at 360 — reused shipped sims (Transform/Parabola/Growth/System), CoordGrid inline (trig sine wave, conic circle), bespoke SVG (unit circle, secant→tangent), custom bars (stats mean-shift). Sample verified: functionToolkit, unitCircleTrig, introCalculus, complexNumbers, trigGraphsIdentities, statsInference, conicSections. **One shared behavior:** on SHORT LANDSCAPE the sim-heavy Explore step needs a vertical scroll (inside the portal's `overflowY:auto`) to reach Continue — this is the shared `ExploreStep` component, identical across the 24 already-shipped teen chapters; content stays reachable.

### ✅ DONE (this session): `next build` passed · 17-18 migration applied to prod · whole batch committed (`4806b95`) + deployed. (Superseded — see LATEST SESSION at top.)

## EARLIER (2026-07-02 pm) — **ALL 12 of the 9–11 set now pre-teen Mission-HUD** (built the remaining 7 + retrofitted the 4 storybook ones) — NOT committed

Built the last 7 kit-drill 9–11 chapters as pre-teen "Number Lab" HUD experiences (each mirrors `FactorLab.tsx` verbatim: inlined `useViewport`/`FitBox`, `Fl*Play`/`Fl*Explain`/`Stage`/`makeBeat`, `short = vh<470` gating, intro→demo(2)→guided→adaptive `SkillBeat`(10, reteach 3)→mastery; `LabBackdrop`/`BackChip`/`PtMilo`/`PT_CSS`/`Banner`; code-drawn instrument in `FitBox`; NO world-picker = single lab; no photographic backgrounds). Each got a distinct neon accent, a thin `game/*Chapter.tsx` wrapper (mirrors `FactorsChapter`), and a fresh `/story?ch=` route. **Added 2 accents to `preteen/kit.tsx`: `violet` + `rose`.** `tsc` clean project-wide; **all 7 verified live** in the preview (intro→demo→guided→practice, no console errors, holds up in tall-portrait). NOT committed.

| skill | story component | wrapper | `?ch=` | accent | instrument |
|---|---|---|---|---|---|
| fractionsCompare | `story/FractionForge.tsx` | `FractionsCompareChapter` | `fcompare` | teal | horizontal fraction BARS — name / compare (same-den) / add-sub |
| decimals | `story/DecimalGrid.tsx` | `DecimalsChapter` | `decimals` | cyan | 10×10 hundredths grid — read / compare (0.6>0.55) / place-value digit |
| measurementUnits | `story/UnitConverter.tsx` | `MeasureUnitsChapter` | `units` | amber | converter panel (input → ×/÷ gear → output) + sensible-unit choice |
| areaPerimeter | `story/GridPlotter.tsx` | `AreaPerimeterChapter` | `area` | lime | w×h unit-square grid — area (fill) / perimeter (glow border) / missing side |
| anglesSymmetry | `story/AngleScope.tsx` | `AnglesSymmetryChapter` | `angles` | violet | SVG protractor angle (acute/right/obtuse) + shape w/ dashed symmetry lines |
| dataGraphs | `story/DataDeck.tsx` | `DataGraphsChapter` | `data` | magenta | 4-bar chart — most / how-many / difference / total |
| wordProblems | `story/MissionBrief.tsx` | `WordProblemsChapter` | `word` | rose | dark-glass "mission brief" story panel + `?`→equation readout |

**THEN retrofitted the 4 earlier storybook 9–11 chapters into the SAME HUD look → the ENTIRE 9–11 set (12/12) is now uniform pre-teen Mission-HUD.** Each rewritten IN PLACE (same filenames, same `?ch=` keys, skill math preserved verbatim), signature changed to `{ onFinish, onExit }` (dropped the `world` prop + WorldSelect + photographic backgrounds + object sprites → single lab, code-drawn neon only). **Added 4 more accents to `preteen/kit.tsx`: `gold` · `sky` · `coral` · `orchid`.** The 4 wrapper portal bgs darkened to `#0a1026`; `page.tsx` 9–11 dispatch drops `world=`. `tsc` clean; all 4 verified live (portrait render + short-landscape metrics: no overlap/overflow).

| skill | story component | wrapper | `?ch=` | accent | NEW code-drawn instrument |
|---|---|---|---|---|---|
| bigNumbers | `story/NumberVault.tsx` | `BigNumbersChapter` | `bignum` | gold | base-ten place-value chart (neon thousand-cube/hundred-flat/ten-rod/one-node, target column glows) |
| rounding | `story/RoundingTrail.tsx` | `RoundingChapter` | `round` | sky | number line — two stops + halfway flag + marker snaps to nearer |
| timesTables | `story/TimesGrid.tsx` | `TimesTablesChapter` | `times` | coral | neon node ARRAY + skip-count chips + AREA model (sprites dropped) |
| division | `story/DivisionShare.tsx` | `DivisionChapter` | `divide` | orchid | neon nodes dealt into HUD "bays" + `N ÷ g = q r rem` (sprites dropped) |

- **9–11 is now 12/12 pre-teen Mission-HUD** — FactorLab + the 7 (fcompare/decimals/units/area/angles/data/word) + these 4 retrofits. Uniform look, 12 distinct neon accents, all code-drawn (no photographic scenes, no object sprites, no world-pickers).
- **Responsiveness VERIFIED across the whole 9–11 set:** the 8 non-retrofit HUD chapters checked at wide desktop (1512×860, FitBox scales instruments UP — e.g. FractionForge panel 606×446 = 52% vh), narrow portrait (360×740), and short landscape (780×360) — no overlap/overflow/offscreen, buttons fixed & bounded, instruments FitBox-bounded. The 4 retrofits share the identical layout skeleton; spot-checked RoundingTrail + NumberVault (widest instruments) at short landscape — clean. All pass.
- **MissionBrief polish (live-caught + fixed):** generic `beat.prompt` "Solve the brief." duplicated with `SkillBeat`'s own prompt pill → set `beat.prompt: () => ''` (SkillBeat renders no pill; brief lives in Stage + FlPlay's PromptCard; `say` still speaks the story). Only needed for text-forward chapters whose `beat.prompt` ≠ the actual question.
- **Minor cosmetic left (not blocking):** a couple of DEMO screens show a fixed HUD `tag` label that doesn't match the round type (e.g. DecimalGrid "READ" on a compare demo; UnitConverter "CONVERT" on a unit-check demo). Practice/guided tags are correct.

### NEXT (where work resumes)
1. Optional: tidy the demo `tag` mismatches noted above.
2. Then `next build` + (only when asked) **commit the whole uncommitted batch** (6–8 set + all 9–11 incl. the 12 HUD chapters + FitBox + pre-teen kit).

## EARLIER (2026-07-02 am) — **FitBox canvas fix (9 chapters)** + **9–11 up to 4/12** + **NEW pre-teen "Mission HUD" design decision** — NOT committed

Everything below is on top of the (still-uncommitted) 6–8 + early-9–11 work from 2026-07-01 (now under "EARLIER (2026-07-01)"). Nothing committed this session either. `tsc` clean throughout; each item verified live via `/story?ch=…` at desktop 1440–1680 + short-landscape 812×375.

**1. BIG-CANVAS FIX — framed math canvases were tiny in real Chrome (fine in the small preview).** User report: the place-value/base-ten "canvas" (and similar) looked correct in Claude's preview tab but tiny on a large Chrome window. Cause: blocks sized with FIXED px or `clamp(min,vmin,MAX)` hard caps → don't grow on big viewports (NumberVault panel was **20% of width** at 1680px). Fix: new shared **`src/components/story/FitBox.tsx`** — measures the card's natural `offsetWidth/offsetHeight` (unaffected by CSS transform) and `transform:scale()`s it to fill the band between the top banner and the bottom answer buttons. **Flow-safe** (outer wrapper takes the *scaled* size as its real layout box, so stacked siblings like SeesawPark's sign buttons get pushed, no overlap — this was a real bug caught + fixed mid-way). Applied + verified to **all 9 framed-canvas chapters**: NumberVault, BuildingBlocks, BlockYard (base-ten) + MarketDay, SliceShop, CoinShop, TickTock, SeesawPark, BeadShop. SKIPPED the object-scatter scenes (they already fill the screen via scale hooks; FitBox would break their grounded placement). Memory: `feedback-fit-canvas-to-viewport`.

**2. 9–11 STORY CONVERSION — now 4/12** (each: story component + thin `game/*Chapter.tsx` wrapper + `/story?ch=` route; mirrors NumberVault's shell — WorldSelect→intro→demo→guided→adaptive `SkillBeat`+reteach+mastery):
- **rounding → `story/RoundingTrail.tsx`** (`game/RoundingChapter.tsx`, `?ch=round`). Number line = a TRAVELLER'S ROUTE between two landmark "stops" (the bracketing multiples) + a halfway flag; tap the nearer stop's value. Code-drawn line (like the clock/fractions) in FitBox. L1 nearest-10 · L2 +nearest-100 (same line, m=100) · L3 +estimate-a-sum (round each addend → add). 3 worlds: 🏔️ Mountain Trail (dashed path) · 🚂 Railway Line (rail track) · ⛵ Island Hopper (wavy sea). Reused Milo sprite; no new assets.
- **timesTables → `story/TimesGrid.tsx`** (`game/TimesTablesChapter.tsx`, `?ch=times`). The array/area model (distinct from 6–8 MarketDay equal-groups): FACTS (a×b ≤9) = a rows×b cols ARRAY, skip-count; 2-DIGIT×1 = an AREA MODEL (tens block `10×k` + ones block `ones×k` → sum). 3 grid worlds: 🚗 Car Park · 🏙️ City Windows · 🌱 Garden Beds. **Generated 3 NEW sprites** (Nano Banana 2, ~7.5cr, ref original art): `objects/park_car.png` · `city_window.png` · `garden_plant.png` — real objects fill the array cells (code-drawn tile is a 404 fallback). Removed a redundant prompt banner (SkillBeat already renders the prompt + the canvas shows the equation).
- **division → `story/DivisionShare.tsx`** (`game/DivisionChapter.tsx`, `?ch=divide`). SHARING: deal the world's items one-by-one into equal groups (containers), read how-many-each + how-many LEFT OVER (remainder answer "q r rem"). 3 matched worlds, **ZERO generation** (used existing committed sprites + un-taken matched bgs): 🍎 Apple Orchard (apples→baskets · farm_orchard/farm_barnyard/town_park) · 🎣 Fishing Pond (fish→buckets · pond/farm_pond/underwater) · 🍪 Cookie Kitchen (cookies→jars · kitchen_bakery/oven/pantry). Picker uses real item sprites (no emoji, via WorldSelect `itemImage`).

**USER RULES locked this session for 9–11 (enforce on every new chapter):** (a) **background must MATCH its objects** (orchard↔apples, pond↔fish, kitchen↔cookies — not a mismatched scene); (b) **no background reused across chapters in the 9–11 age group** — diff against the registry in memory `project-milo-9-11-backgrounds` before picking (NumberVault/RoundingTrail/TimesGrid have 2 pre-rule dups: town_street, garden_park — leave); (c) **NO emoji for content or the picker** — real sprites; generate new ones (Nano Banana) when the library lacks/fits poorly, else reuse.

**3. NEW DECISION — 9–11 gets a DISTINCT "pre-teen" look for the REMAINING chapters** (the cozy 3–8 storybook style reads too young for 10–11yos). User picks: **distinct pre-teen design**, then **"go bolder/darker"**, then **"retrofit the 4 built too."** So the plan is a **dark, vivid "Mission HUD"**: deep-navy space backdrop + faint grid + starfield + a per-chapter **neon accent glow**, **dark-glass panels** with neon borders + corner **brackets**, **monospace** numerals, HUD "TASK" prompt bar, neon answer chips, **Milo the explorer** bottom-left. Code-drawn backdrops (no photographic scenes → background-reuse rule is moot). Shared kit **`src/components/story/preteen/kit.tsx`** exports `PT`/`ACCENTS`/`LabBackdrop`/`BackChip`/`Brackets`/`PromptCard`/`ChoiceButton`/`PtMilo`/`MissionSelect`/`IntroCard`/`PT_CSS`. Memory: `project-milo-preteen-design`.
- **Reference chapter built + verified in the dark HUD look: `story/FactorLab.tsx`** (factorsMultiples, `game/FactorsChapter.tsx`, `?ch=factors`, indigo accent, **no world-picker** — single lab). A number "analyzer": even/odd = neon node PAIRS (1 leftover ⇒ odd) · multiple = skip-count pattern chips · factor = node RECTANGLE reflow (`12 = 4 × 3`) · prime = only 1×n. `tsc` clean; verified live (intro, all 4 q-types, mastery early-exit, short-landscape no overlap).

**NEXT (this is where work resumes):**
1. **Retrofit the 4 already-built 9–11 chapters** (NumberVault, RoundingTrail, TimesGrid, DivisionShare) into the pre-teen Mission-HUD look — user just approved this ("retrofit the 4 built too") for a uniform 9–11 set. NOTE the tension: DivisionShare/TimesGrid/RoundingTrail lean on *photographic* backgrounds + real object sprites (apples/fish/cars) which don't fit a code-drawn neon HUD — decide per chapter whether to keep the objects on a HUD frame or rethink the visual. NumberVault (base-ten blocks, code-drawn) ports most cleanly.
2. **Build the remaining 7 in the HUD look:** fractionsCompare · decimals · measurementUnits · areaPerimeter · anglesSymmetry · dataGraphs · wordProblems — each its own neon accent + a precise code-drawn "instrument" (number line, bar, ruler, protractor, chart).
3. Then `next build` + (only when asked) **commit the whole uncommitted batch** (6–8 set + all 9–11 + FitBox + pre-teen kit).

## EARLIER (2026-07-01) — **6–8 set COMPLETE (12/12 story mode)** + **9–11 STARTED (1/12)** + parent-modal bug fix — NOT committed

**Goal (user):** convert every kit-drill chapter into the 3-world story pattern (WorldSelect → intro → demo → guided → adaptive `SkillBeat` + reteach + mastery), **one chapter at a time, finalized + verified live**. Keep the `game/*Chapter.tsx` wrapper filenames (only internals change → thin story wrapper); add a `/story?ch=` preview route each.

**6–8: ALL 12 DONE** (`tsc` clean, verified live via `/story?ch=…`; NOT committed). First 6 (earlier this session) detailed below; the **last 6 + polish (continuation) are summarised right after the first-6 block.** First 6:
- **Ch1 numbersTo100 → `story/NumberTown.tsx`** (wrapper `game/Numbers100Chapter.tsx`, `?ch=numbers`). Hear a number → tap the thing wearing it; demo builds it from tens+ones. 3 worlds: 🏘️ Number Street (postman, house/shop/mailbox door sprites) · 🏫 Locker Room · 🚀 Space Station. Objects BIG with the **numeral floating ABOVE** on a chip, **no ground band**, per-world `groundY`. **NEW AI art** for Locker Room (old assets were too weak): `public/assets/backgrounds/locker_room.png` + `objects/locker_{blue,green,red}.png` (Nano Banana 2, ~7 cr).
- **Ch2 placeValue → `story/BuildingBlocks.tsx`** (wrapper `game/PlaceValueChapter.tsx`, `?ch=place`). **Object-driven place value**: a "ten" = a **2×5 ten-frame of the world's item**, a "one" = a loose single; items **shuffle per round**. 3 worlds: 🍎 Fruit Orchard (apple/pear/cherry) · 🧸 Toy Workshop (duck/car/block/button) · 🍭 Candy Factory (candy/cupcake/lollipop). Questions in-world ("how many stacks of ten? how many loose apples? how many altogether?"). Reused sprites only. Objects sized BIG + adaptive (shrink only when the number needs many frames).
- **Ch3 skipCounting → `story/HopAlong.tsx`** (wrapper `game/SkipCountingChapter.tsx`, `?ch=skip`). **REBUILT from the Wave-A draft to the locked standard.** Object-driven skip counting: each "hop" lands on a **framed GROUP of `step` of the world's item** (2/5/10), the **running total rides on a chip above** each group (5 · 10 · 15…), one total blank ("?") → tap the number that fits. Items **shuffle per round**. 3 worlds: 🐸 Lily Pond (frog/fish/duckling/turtle) · 🐝 Bug Garden (bee/butterfly/ant/snail/dragonfly) · 🚀 Space Station (star/planet/comet/satellite/rocket, **dark scene** → dark chip variant). Demo/reteach = **ONE `speakSteps`** building group-by-group as the running total climbs (BigCount + "N groups of S = total" chip), timer-paced when audio blocked; `unlockSpeech()` on intro. Item size adaptive to `step×terms`. Reused sprites only. `itemPxFor`/`Group`/`GroupRow`/`HopPlay`/`HopExplain`.
- **storyProblems → `story/StoryTime.tsx`** (wrapper `game/StoryProblemsChapter.tsx`, `?ch=story`; `?world=picnic|reef|space`). **NEW BUILD** (replaced the kit lesson+practice drill). HEAR a story → watch the world's OWN objects act it out → tap the answer. THREE problem types carried by the same shuffling objects: **ADD** (a, then b MORE join → count all), **TAKE-AWAY** (a, then b LEAVE → fade+lift away, count what's left), **COMPARE** (Milo vs a friend, a>b → the surplus dash-highlighted, "how many MORE"). 3 worlds: 🧺 Picnic Meadow (apple/cookie/cherry/pear, friend Pat) · 🐠 Coral Reef (fish/crab/turtle/octopus, Finn) · 🚀 Space Station (star/rocket/planet/comet, Nova; dark). Numbers stay SMALL enough to show objects (object-driven) — difficulty grows by mixing in sub then compare + nudging totals (≤~16), NOT two-digit. Staged reveal + count-up on correct (reuses Orchard idioms: `GroundedItem`/`Row`/`AnswerBox`/`Stage`). Demo+reteach = **ONE `speakSteps`** narrating add/sub/compare (3 demo screens, one of each). Reused sprites only.
  - **Bug fixed during build:** the take-away "leavers" wouldn't fade — the `st_pop` entrance keyframe (fill:both, `100%{opacity:1}`) pinned computed opacity to 1 and overrode the inline `opacity:0.16`. Fix: `animation: leaving ? 'none' : 'st_pop …'` so the fade wins once an item is leaving. (Watch for this pattern in any GroundedItem-style sprite that both pop-animates AND fades.)
- **multiplication → `story/MarketDay.tsx`** (wrapper `game/MultiplicationChapter.tsx`, `?ch=multiply`; `?world=bakery|garden|space`). **NEW BUILD** (replaced the kit lesson+practice drill). Multiplication = **EQUAL GROUPS** carried by the world's own objects: `g` groups of `per` items → skip-count → tap the total; the **`g × per =` equation** shows above the answer box. TWO object-driven views: **GROUPS** (`g` framed clusters of `per`) and **ARRAY** (one `g`-row × `per`-col grid). 3 worlds: 🧁 Bakery (cupcake/cookie/candy/lollipop, "trays") · 🌻 Flower Garden (tulip/daisy/sunflower, "beds") · 🚀 Space Station (star/planet/rocket/comet, "pods"; dark). Numbers ≤6×6 so every object shows (object-driven); difficulty widens factors + adds the array view. Demo+reteach = **ONE `speakSteps`** skip-counting the groups (a group lights as the total climbs `4·8·12`, then `3 × 4 = 12`); count-up glow on correct. Item shuffles per round, adaptive sizing via `itemPxFor`. Reused sprites only. `Cluster`/`GroupsView`/`ArrayView`/`EquationBox`/`MultPlay`/`MultExplain`.
- **fractions → `story/SliceShop.tsx`** (wrapper `game/FractionsChapter.tsx`, `?ch=fractions`; `?world=pizza|party|choc`). **NEW BUILD** (replaced the kit lesson+practice drill). Fractions = **equal parts of a whole** carried by the world's treats. TWO question types: **NAME** (a whole cut into `den` equal parts, one shaded → tap the fraction 1/2·1/3·1/4) and **GROUP** (a fraction OF a group → a number: "one half of 8 cupcakes" splits into 2 equal groups, one lit → tap 4). 3 worlds mixing **round + bar** fraction models, **each with a LIST of 3 shuffling treats + 3 rotating backgrounds** (per the "≥3 objects + different bg per narrative" rule): 🍕 **Pizzeria** (pizza·cookie·pie; round wedges; kitchen_oven/kitchen_bakery/grocery_bakery scenes) · 🎂 **Party** (cake·watermelon·orange; round wedges; party_* scenes) · 🍫 **Chocolate Shop** (chocolate bar·wafer·biscuit; rectangular bars; grocery_sweets/kitchen_pantry/grocery_deli scenes). Wholes are **code-drawn SVG** (`Whole(shape,colors,den,shaded)`: `wedgePath` for round, segment rects for bar), tinted to the CHOSEN treat's colours so any denominator divides cleanly; group items are real sprites. `Treat = {name,colors,group}`; world carries `treats[]` + `shape`; round picks `treat = treats[round % len]`. `Frac` = code-drawn fraction pill. Demo+reteach = **ONE `speakSteps`**. Built **responsive** (`useViewport` + `short`). Difficulty: L1 name(½,¼) → L2 +thirds +group(half) → L3 all dens + bigger groups.
  - **PIZZA-REUSE FIX (user-reported):** pizza is ALSO in the 3–5 Grocery "Pizza Parlor" (`pizzeria.png` bg + `pizza_base.png`); my first Fractions Pizzeria used the SAME bg + only 1 object → the two narratives looked identical. Fixed: the Fractions Pizzeria now uses **different backgrounds** (bakery/kitchen scenes, not `pizzeria.png`) + **3 shuffling treats** — two separate narratives. General rule reinforced: **every narrative needs a distinct background + ≥3 objects; if an object is reused across chapters, the narratives must differ (bg + object list).**
  - Verified live (pizza→cookie→pie wedges + kitchen/bakery bg rotation; orange wedges in Party; group-of-8; 667×375 landscape + tablet portrait clean; clean rebuild → no console errors). `Treat`/`Whole`/`Frac`/`GroupView`/`Stage`/`FrPlay`/`FrExplain`.
  - **Craft Table bg/item mismatch fixed (user-reported):** its backgrounds are item-SPECIFIC (gems display / buttons display / bead shop), but bg rotated independently of the item → e.g. diamonds on the buttons scene. Fix: the **background now FOLLOWS the item** (`bg = idx % bgs.length`, `item = items[idx]` in `makeMultRound`; DEMO/GUIDED bg derived from item index) and craft `items` reordered to line up with `bgs` (buttons↔craft_buttons, gem↔craft_gems, bead↔bead_shop). Generic-bg worlds (Bakery/Flower Garden) unaffected. **General rule: when a world's backgrounds are object-specific, pair bg to item so a scene never shows the wrong object.** Verified live — each scene shows its own object.

**LAST 6 of the 6–8 set (continuation) — each: story component + thin wrapper + `?ch=` route; `tsc` clean; verified live; NOT committed:**
- **fractions toppings (SliceShop):** user wanted real images instead of the code-drawn dot "toppings" on the SVG fraction wholes. Kept the **SVG base** (precise divisions) and generated **9 NEW real topping sprites** laid on the SHADED part (marks "covered"): pizza=pepperoni/cheese/basil · cookie=choc-chips · pie=cherry-filling · cake=frosting+sprinkles · watermelon=seeds · orange=segments · choc=nuts · wafer=cream · biscuit=drizzle → `objects/topping_*.png`. `Whole` overlays `<image>` on shaded wedges/segments (dots kept as fallback). Nano Banana, ~25 cr.
- **money → `story/CoinShop.tsx`** (`game/MoneyChapter.tsx`, `?ch=money`): count coins → total value. Coins are the hero — **3 NEW generic coin sprites** (copper/silver/gold, blank face, cut locally via border flood-fill) with the value NUMERAL **code-drawn on top** (1=copper·5=silver·10=gold·25=big-gold). Framed as shopping: 🛒 Grocery Market · 🚂 Train Station · 🏖️ Beach Kiosk; count-up demo on the item's price box.
- **time → `story/TickTock.tsx`** (`game/TimeChapter.tsx`, `?ch=time`): read an analog clock — **CODE-DRAWN SVG** (precise hands sweep into place; AI clocks are unreliable, same "SVG for exact math" call as fractions). ☀️ Morning · 🌳 Afternoon · 🌙 Nighttime(dark). o'clock→half→quarter past/to. Reused `timeLabel`/`makeTimeChoices` from TimeLesson; per-round activity chip.
- **compareNumbers → `story/SeesawPark.tsx`** (`game/CompareChapter.tsx`, `?ch=compare`): REBUILT the Wave-A draft. Balance scale tips toward the bigger side; pans **counter-rotate to stay upright**. L1 (≤10) shows GROUPS of the world's animals (object-driven); L2/L3 numeral cards. 🛝 Playground · 🌲 Forest · 🐸 Pond. Demo teaches all 3 signs (>,<,=). **Bug fixed: tilt was inverted (smaller side dipped) → flipped the rotation sign so the BIGGER side tips DOWN.**
- **add/subtract to 100 → `story/BlockYard.tsx`** (SHARED, `op` prop; wrappers `game/ArithmeticChapter.tsx` still export `AdditionTo100Chapter`/`SubtractionTo100Chapter`; `?ch=add100`/`?ch=sub100`): base-ten with the **WORLD'S OWN OBJECT** — a TEN = a box-of-ten of it, a ONE = a loose one (user directives: "use objects related to the bg, not bars/circles"; then "double the object size" — inner item ≈65px). "tens then ones" count-up answer box. ➕ Apple Barn·Egg Ranch·Cookie Jar · ➖ Star Lab(dark)·Flower Patch·Fish Dock.
- **shapes2d3d → `story/ShapeStudio.tsx`** (`game/Shapes2D3DChapter.tsx`, `?ch=solids`): 2D shapes = **exact SVG** (reused `ShapeView`); 3D solids = **4 NEW real generated sprites** (`objects/solid_{cube,sphere,cone,cylinder}.png`). NAME ("tap the triangle" among shapes) + SIDES ("how many sides?"). 🎨 Art Studio · 🏗️ Build Site · 🧸 Playroom. User confirmed: keep 3D real + 2D SVG.
- **Small polish:** dropped the "Wish on a comet" caption in TickTock (→ "Comet watch"); Compare demo now teaches all 3 signs (added a `<` round).

**PARENT BUG FIX (user-reported):** the "Add learner" bottom-sheet modal (`src/app/parent/page.tsx`) had **no `maxHeight`/scroll** → once an account had a grade, the content grew taller than the screen and, being bottom-aligned (`flex-end`), its TOP (🦊 emoji avatar picker + "Child's name" input) clipped off-screen and was unreachable. Fix: `maxHeight:'92dvh', overflowY:'auto'` on the card. Auth-gated → couldn't drive live in the preview; verify on device.

**RESPONSIVE / LANDSCAPE OVERLAP FIX (user-reported, partner saw it on prod):** in the **Counting** chapter (`story/world1.tsx` `HowManyPlay`, wrapped by `ForestWalk` — this chapter is LANDSCAPE-ONLY, portrait shows a "turn sideways" prompt), the count objects were **overlapping the answer buttons** in short landscape viewports, and the buttons sat off-centre. Fixes:
  - `useScale` is now **height-aware** (multiplies by `min(1, innerHeight/560)`) so creatures shrink on SHORT viewports; tall frames (tablet/desktop) unchanged. Added `useViewport()`.
  - `HowManyPlay` **reserves a bottom strip for the answer buttons** and clamps the object band's `y1` above it (plus a sprite-height allowance); **spreads objects across more columns** when wide+short (`vw/vh>1.55`) so rows stay shallow; and **caps sprite size** to the zone cell. `scatter`/`spotsFor` gained an optional `colsOverride`; `PerchedItem` gained an optional `cap`.
  - **Answer buttons are now responsive** (`btn = clamp(52, min(vw/8.8, vh/5.2), 94)`, radius/font/gap/border all derived).
  - **Centering bug fixed:** `@keyframes fw_pop` ends on `transform:translateY(0) scale(1)` with `fill:both`, which was **clobbering the inline `translateX(-50%)`** → the button row (and the ForestWalk `say` bubble) sat right-of-centre. Fix = center on an OUTER wrapper, animate an INNER child. (Same fill:both-overrides-transform trap as the StoryTime leaving-fade.)
  - Verified live at 812×375 / 667×375 / 1024×768 landscape (objects spread + centered buttons, no overlap), `tsc` clean, no errors.

**RESPONSIVE SWEEP — ALL 15 REMAINING STORY CHAPTERS (both orientations, all sizes) — `tsc` clean, NOT committed:** applied the counting-chapter recipe to every story chapter via 5 parallel subagents + my live verification. Each got the `useViewport()` hook + a `const short = vh < 470` gate that, on short/landscape frames, shrinks objects (drops the clamp MIN-floors that were forcing sprites too big), tightens gaps, repositions the stage so the top banner + objects + bottom controls never collide, and makes the answer buttons responsive (`min(vw/8.8, vh/5.2)`-derived). Tall/portrait (≥470h, incl. 360×640) is UNCHANGED. Chapters: NumberTown, BuildingBlocks, HopAlong, StoryTime, MarketDay (6–8) + Orchard, LilyPond, TallForest, Kitchen, Grocery, NumberDoors, RiverCrossing, ShapeTown, RainbowTown, BeadShop (3–5).
  - **Many `fill:both`-overrides-`transform` centering bugs found + fixed** (same trap as fw_pop/st_pop): the `*_pop .. both` enter-animation on choice buttons / `GroundedItem` / `Cluster` / Kitchen's `MiloChef` / Grocery's `gr_pop` toppings+flowers was clobbering the element's inline state transform (selected-lift / depth-jitter / centering). Fix everywhere = center/state-transform on an OUTER wrapper, animation on an INNER child.
  - **Verified live (667×375 landscape):** HopAlong, StoryTime (add), BeadShop, TallForest weight-seesaw, Grocery — all clean, no overlap. **Portrait 390×844:** MarketDay clean (no regression). `tsc` clean across the whole project.
  - **StoryTime compare demo** was the one tight spot found in verification (its orchestrator "Watch Milo's story" banner + story pill + the two Milo/Pat rows collided) → fixed: hide the redundant story pill in the DEMO on short (`!short`), lower compare rows (stageTop 38%→48%), lower the compare answer box (`topPct` 70%).
  - **Residual live-tuning candidates** (agents flagged, look OK but worth an eyeball on a real device): HopAlong hard step-10×5, StoryTime compare in PRACTICE (rare, difficulty-3-only; box+buttons are tight), BeadShop widest tray vs Milo at the very shortest heights. The `short` breakpoint (470) + per-chapter top-% nudges are the tuning knobs.
  - **NOTE:** teen (12–18) chapters were NOT part of this sweep (different Field-Lab design language); audit separately if launching there on mobile.

**REAL IMAGES, NOT EMOJIS (user directive, this session):** The math objects were ALREADY real sprites (`<img>` first, emoji only as a 404 fallback). Per the user, the decorative **WorldSelect card-corner emoji is now a REAL item sprite** (`PickWorld.itemImage` → `<ItemBadge>`; emoji only if the PNG 404s). Wired into all 5 built 6–8 chapters (`itemImage: w.items[0].src|img`, NumberTown uses `SCENE[scenes[0]].itemImg`). Verified live (Bakery=cupcake, Flower Garden=tulip, Craft Table=gem). The 3–5 chapters' pickers still emoji-fallback (they don't pass `itemImage` yet — sweep later if wanted). **Standing rule going forward: use generated/library images for content, and GENERATE new AI sprites (Nano Banana, ref the ORIGINAL art) whenever a world needs an object the library lacks or a reused one fits poorly — don't settle for emoji.** See auto-memory `feedback-real-images-not-emojis`.

**GREYSCALE OBJECTS → COLOURED (user-reported):** several `pat_*` sprites are GREYSCALE by design (made for the pattern/colour chapters to code-tint). I was rendering them raw → grey. Fixed by **code-tinting** (new shared `story/TintedSprite.tsx`: a colour layer masked to the sprite + the greyscale PNG `mixBlendMode:'multiply'` on top — same technique as BeadShop/RainbowTown). Added optional `tint?: string` (hex) to the `Item` of each affected chapter; `ItemImg` renders `<TintedSprite>` when `item.tint` is set. Also wired `PickWorld.itemTint` so the picker card corner tints too (Craft Table/Toy Workshop reps are greyscale). Tinted: **Toy Workshop** duck=`#f2c230` car=`#e0483f` block=`#4a86d8` button=`#4aae6b` (BuildingBlocks); **Fun Fair** flag=`#e0483f` lantern=`#e8912a` (StoryTime — also DROPPED `star.png` prize: it has an opaque grey background, not a cutout → fair items now balloon/flag/lantern); **Craft Table** bead=`#1a9ea0` button=`#d8524f` gem=`#9b59b6` (MarketDay). Verified live: purple gems / red cars / red flags, all colour, `tsc` clean, no errors. NOTE for future worlds: any `pat_*` sprite is greyscale — tint it (or generate a colour version). Non-`pat_` sprites (apple, chick, cookie, tulip, reef_fish, balloon…) are already colour.

**REPETITION FIX (this session, applies to ALL story chapters) — `tsc` clean, NOT committed:**
- Symptom: practice "sometimes asks the same question repeatedly." Cause: `SkillBeat`'s `makeDistinct` deduped on the **whole round object**, so the rotating scene / shuffled sprite / random choice order all read as "new variety" and let the same MATH question through.
- Fix: `Beat` now takes an optional **`sig(data)`** (math-only dedupe key) wired into `makeDistinct` in `StoryWorld.tsx`. Added a `sig` to **every finalized beat**: HopAlong `step|seq|blankIndex`, LilyPond `total-take`, Orchard `a+b`, NumberTown/Grocery `target`, TallForest `ask|left.val|right.val`, Kitchen `mode|sorted(vals)`, RiverCrossing `sorted(nums)`, RainbowTown/ShapeTown `target option`, NumberDoors `target door`, BeadShop `unit|seqLen`. (Skipped `world1` counting — deterministic plan, dedupe is a no-op — and the unfinalized `SeesawPark`.)
- Also **widened HopAlong's question space** (sequences now start past `1×step` at every difficulty, gap position varies) so there are genuinely more distinct questions, not just better dedupe. Verified live: 6 consecutive rounds all distinct.

**KEY USER DIRECTIONS locked this session (apply to ALL remaining chapters):**
1. **The world's OWN objects must carry the math — not just a background swap.** Each world has a LIST of related existing sprites that **shuffle** across rounds; the concept is done WITH them. (This was the big correction on Ch2.)
2. **Objects must be BIG and the surface full** — no tiny sprites in a half-empty card. Size adaptively.
3. **Demo/reteach audio+visual via ONE `speakSteps`** — voice-synced when audio plays, timer-paced when blocked. NEVER rapid `speak()` calls (they wedge Chrome silent) and NEVER a fixed-timer visual decoupled from voice (Safari drifts). See `feedback-story-demo-audio-pattern`.
4. **NO storytelling (world/setting) may repeat across chapters in the SAME age group.** Each world is used exactly ONCE across all 6–8 chapters. Strictness = **exact repeats only** (a bug garden AND a flower garden are fine; two "Space Station"s are not). Space Station lives ONLY in numbersTo100. Pick from the registry below for every new chapter.

**6–8 STORYTELLING REGISTRY — COMPLETE, all 36 worlds used ONCE (no-repeat rule is PER age group):** Number Street·Locker Room·Space Station *(numbersTo100)* · Fruit Orchard·Toy Workshop·Candy Factory *(placeValue)* · Lily Pond·Bug Garden·Farmyard *(skipCounting)* · Picnic Meadow·Coral Reef·Fun Fair *(storyProblems)* · Bakery·Flower Garden·Craft Table *(multiplication)* · Pizzeria·Party·Chocolate Shop *(fractions)* · Grocery Market·Train Station·Beach Kiosk *(money)* · Morning·Afternoon·Nighttime *(time)* · Playground·Forest·Pond *(compareNumbers)* · Apple Barn·Egg Ranch·Cookie Jar *(additionTo100)* · Star Lab·Flower Patch·Fish Dock *(subtractionTo100)* · Art Studio·Build Site·Playroom *(shapes2d3d)*. (**9–11 is a NEW age group → these names are all reusable there.**)

**VOICE / audio:** `_pickVoice` in `src/lib/useMiloSpeaker.ts` now **prefers LOCAL voices** (Chrome's "Google …" network voices fail silently). **Safari = voice works perfectly. Chrome = still NO voice** even after the local-voice fix — user DEFERRED this: the app will move to **ElevenLabs** audio, so revisit then.

**9–11 (Grade 3–5) — STARTED (1 of 12).** Same one-at-a-time story conversion; 12 kit chapters, registry/dispatch/DB rows already exist. Skill ids + current wrappers: bigNumbers→`BigNumbersChapter` · rounding→`RoundingChapter` · timesTables→`TimesTablesChapter` · division→`DivisionChapter` · factorsMultiples→`FactorsChapter` · fractionsCompare→`FractionsCompareChapter` · decimals→`DecimalsChapter` · measurementUnits→`MeasureUnitsChapter` · areaPerimeter→`AreaPerimeterChapter` · anglesSymmetry→`AnglesSymmetryChapter` · dataGraphs→`DataGraphsChapter` · wordProblems→`WordProblemsChapter`. Story `?ch=` keys must be FRESH (add/sub/shapes/measure/compare etc. are taken by 3–5/6–8).
- **DONE: Ch1 bigNumbers → `story/NumberVault.tsx`** (`game/BigNumbersChapter.tsx`, `?ch=bignum`). Place value to 10,000 with **base-ten blocks** (thousand-cube·hundred-flat·ten-rod·one-cube) in a place-value chart (`per`=2 for the big blocks so all 4 columns fit one row). 3 qtypes (how-many-of-a-place with the column highlighted · value-of-a-digit · read-blocks→number, no numeral). 💎 Gem Vault · 🏦 Coin Bank · 🚀 Star Base(dark); block colour per world. Demo builds the number place-by-place via ONE `speakSteps`. Local `numWords`/`placeColumns`/`nearDigits`/`valueOptions`/`nearNumbers` (mirrors the kit). `tsc` clean, verified live.

**NEXT:** continue 9–11 chapter-by-chapter — **rounding** next. Then `next build` + (only when asked) commit the whole batch. NB 9–11 content is more abstract than 3–5/6–8 (rounding, decimals, angles, data/graphs, word problems) — pick a precise visual per skill (base-ten/number-line/chart), object-driven where feasible.

---

## EARLIER (2026-06-30 pm) — LAST 3 of the 3–5 chapters converted to story mode (Addition · Subtraction · Measurement) — COMMITTED + PUSHED to `main` → Vercel

**Goal (user):** finish the 3–5 set — convert the remaining 3 drills (addition · subtraction · measurement) to the same 3-world WorldSelect story pattern as the other 8. Same locked structure (3 storytellings × 3 bg × 3 objects), everything must BLEND. **→ The whole 3–5 set (11 chapters) is now story-mode. Committed + pushed to `main` (auto-deploys to Vercel production).**

**DONE — all 3 built, `tsc` + `next build` clean, verified live via `/story?ch=…`:**
- **Ch.9 Addition** — `src/components/story/Orchard.tsx` (+ thin wrapper `game/AdditionChapter.tsx`, preview `?ch=add`). Count both groups → pick the total; "altogether" basket fills as reward. Worlds: 🍎 Orchard · 🐠 Coral Reef · 🚀 Space. REUSED art only.
- **Ch.10 Subtraction** — `LilyPond.tsx` (`game/SubtractionChapter.tsx`, `?ch=sub`). N objects, some LEAVE (staggered drift), count what's left. Worlds: 🐸 Lily Pond (hop in) · 🎉 Party (float up) · 🌙 Night Sky (blink out). REUSED art only.
- **Ch.11 Measurement** — `TallForest.tsx` (`game/MeasurementChapter.tsx`, `?ch=measure`). Tap the bigger one; each world = ONE attribute. 🌳 Tall Forest (height, uniform scale) · 🐍 Long Trail (length, `object-fit:fill` stretch) · ⚖️ Balance Market (weight, code-drawn SEESAW tilts toward heavier).
  - **5 NEW AI sprites** generated (Nano Banana 2, ~7.5 cr) — snake, giraffe, watermelon, pumpkin, flour_sack — referenced original library art (caterpillar/bear/apple/grocery_bun), cutout via remove_background, snake autocropped tight (for fill-stretch), rest square-padded. In `public/assets/objects/`. Backgrounds REUSED from existing photoreal library.
  - **Then EXPANDED each measurement world 3→6 objects** (user wanted more variety; was repetitive cycling only 3 over 10 rounds). All from existing assets: height +tulip/daisy/pine; length +train_engine/bus/fish; weight +crate·egg/bucket·cookie/fruitbowl·candy. Verified live (giraffe/tulip scale, snake/train/bus stretch, watermelon/sack seesaw).

All 3 mirror the Grocery pattern (WorldSelect → intro → demo → guided → one adaptive `SkillBeat` 10-round, reteach after 3, mastery early-exit). Detail in auto-memory `project-milo-{addition,subtraction,measurement}-chapter`.

**REFINEMENTS (same session, after the build):**
- **Measurement expanded 3→6 objects per world** (was repetitive cycling only 3 over 10 rounds) — all existing assets: height +tulip/daisy/pine; length +train_engine/bus/fish; weight +crate·egg/bucket·cookie/fruitbowl·candy. Verified live.
- **Addition + Subtraction now have a STAGED REVEAL** (user: don't dump everything on screen at once). The question builds up — group A pops in one-by-one → `+` → group B → THEN the choices/answer box fade in (subtraction: pop in → the `take` leave → then choices). Object sizes bumped for prominence. `AddPlay`/`SubPlay` drive it with timers; `Stage`/`Group` gained `aShown/bShown/showPlus/showQ` (add) and `shown?/showQ?` (sub). Verified live, `tsc`+`next build` clean.

- **Addition: basket REMOVED** (user said the "ALTOGETHER" basket/box looked bad). No vessel now — on a correct answer (and in the demo) the objects are COUNTED one-by-one (each glows via `lit`) while the answer box climbs 1→total then turns green. `Orchard` `Stage`/`AddPlay`/`AddExplain` use `lit`/`boxValue`/`boxDone`; old `Basket`+`filled` deleted. (Subtraction never had a basket.) Verified live across all 3 worlds, `tsc`+`next build` clean.

- **Demo now pops one-by-one too** (user: the first explanation showed everything in one take). `AddExplain`/`SubExplain` rewritten from `speakSteps` to timer-driven staged pop-in matching the play (each object pops in one at a time counting up, then `+`, then group B; subtraction pops all in → `take` leave → count left). Verified via DOM object-count sampling. Object sizes also bumped big (`clamp(74px,13.5vmin,150px)`) since the old vmin floor read tiny on mobile.

**NEXT:** (committed + pushed to `main` → Vercel). The whole 3–5 set (11 chapters) is now story-mode. Optional follow-ups: smoke-test on prod; apply the same count-up reveal / bigger-object polish to other 3–5 chapters if desired.

---

## EARLIER (2026-06-30 am) — STORYTELLING EXPANSION COMPLETE: ALL 8 of the 3–5 chapters now have 3 picked worlds — COMMITTED + PUSHED

**Goal (user):** give each 3–5 chapter **3 storytellings (worlds), each with its own backgrounds + objects** (the locked structure: **3 storytellings × 3 backgrounds × 3 objects**), chosen by the child from a picker — so it never feels repetitive. The hard requirement throughout: **everything must BLEND** (objects look like they belong in the scene — grounded, sized right, no floating).

**Now COMPLETE — all 8 of the 3–5 chapters refactored to the WorldSelect 3-world pattern (`tsc` + `next build` clean, verified live, committed + pushed to `main` → Vercel production):**
- The 4 below (Counting · Number Order · Recognition · Matching Qty) were done earlier; the remaining 4 were finished this session:
  - **Ch.7 Colours** (`RainbowTown.tsx`): 🌈 Rainbow Town · 🐠 Coral Reef · 🍭 Candy Shop. Objects are code-drawn + **code-tinted greyscale sprites** (colour must stay exact). New AI: reef/candy backgrounds + greyscale sprites (fish/starfish/jelly/lollipop/cupcake/candy).
  - **Ch.6 Shapes** (`ShapeTown.tsx`): 🏙️ Shape Town · 🎪 Fun Fair · 🏖️ Beach Day. Shapes stay exact SVG; per-scene code-drawn "mounts" (kite/lollipop/ribbon/flag/boat/plate). New AI: fair_* + beach_* backgrounds. **Fixed a latent bug:** the shape's `translateX(-50%)` centring was clobbered by the sway/pop `animation` transform → shapes drifted ~½-box right of their mount; split centring (outer) from animation (inner).
  - **Ch.8 Patterns** (`BeadShop.tsx`): 📿 Bead Shop (beads/buttons/gems) · 🎉 Party (flags/balloons/lanterns) · 🧸 Toy Box (cars/blocks/ducks). Items code-drawn + **code-tinted greyscale sprites** (colour is the pattern variable). 9 backgrounds + 9 greyscale sprites.
  - **Ch.3 Comparison** (`Kitchen.tsx`): 🍳 Kitchen (apple/cookie/candy) · 🛒 Grocery (orange/egg/strawberry) · 🧁 Bakery (cupcake/cake/cherry). Quantity not colour → uses **COLOURED** sprites directly: REUSED the existing consistent library + generated only 3 fresh (strawberry/orange/cupcake). Vessel renderers (bowl/tray/jar/cake) parameterised by item sprite. Per-world Milo (chef/grocer).

**REFERENCE-IMAGE RULE — USE ONLY THE ORIGINAL/OLDER IMAGES AS REFERENCES (hard-won, carry forward — do NOT skip):**
- **Always reference the ORIGINAL / earliest art set** — the hand-made / first-batch committed assets like `apple.png`, `cookie.png`, `pear.png`, `duck.png`, `pond.jpeg`, `forest_*.jpeg`. **These are PERFECT for the use case** — correct style, correct object type. **Do NOT use the later-generated images as references** — the newer AI batches drift slightly (style + type are a little off), so referencing them compounds the drift. Older images in, perfect images out.
- **Why later refs failed silently:** Higgsfield `media_import_url` only works on **committed/deployed** URLs. Many later assets were *uncommitted* → the URL 404s → the reference **silently fails to attach** → the model generates from text alone → drift. So the rule is doubly true: the older images are both *on-style* AND *actually deployed* (so the ref attaches). Always verify `media_import_url` returns a `media_id` before generating; if it 404s, that asset is not a usable reference.
- **Pipeline:** for colour-recognition + patterns, objects must be **greyscale** sprites tinted in code (never bake colour into the PNG); comparison keeps colour. Scratch helpers `proc.py`/`proc_color.py`/`measure.py`: cutout via `remove_background` → desaturate (greyscale only) → autocrop to alpha bbox → square-pad (top-align for hanging items) → for Kitchen, measure alpha bbox into `SPRITE_BBOX`.

**Earlier-done 4 chapters (also part of this commit):**

**Done this session — 4 chapters refactored (all `tsc` + `next build` clean, verified live, NOT committed):**

| Ch | File | 3 worlds | `?…` to test |
|----|------|----------|-------------|
| 1 Counting | `ForestWalk`/`biomes.ts`/`world1.tsx`/`chapters.tsx` | 🌳 Nature Walk *(kept)* · 🐔 Farm Day · 🚀 Space Adventure | `/story?story=farm\|space\|nature` |
| 2 Number Order | `RiverCrossing.tsx` | 🪨 River Crossing · 🚂 Train Yard · ☁️ Sky Hop | `/story?ch=order&world=river\|train\|sky` |
| 4 Recognition | `NumberDoors.tsx` | 🚪 Number Doors *(kept)* · 🎈 Balloon Pop · 🚌 Bus Stop | `/story?ch=doors&world=doors\|balloons\|buses` |
| 5 Matching Qty | `Grocery.tsx` | 🛒 Little Grocery *(kept)* · 🍕 Pizza Parlor · 🌻 Flower Garden | `/story?ch=grocery&world=grocery\|pizza\|garden` |

- **Shared picker:** `src/components/story/WorldSelect.tsx` — generic (`{title, worlds:[{id,label,emoji,bgImage}], onPick(id)}`). Each chapter renders it FIRST (world `null` → picker); "play again" / replay re-shows it. Counting also keeps `pickStorytelling()` round-robin for back-compat but the live path uses the picker.
- **Each chapter is config-driven** (`SCENE`/`WORLDS`/`makeXBeat(world)`, beat **memoized** — never build inline or SkillBeat resets). The 10-round adaptive practice + re-teach is unchanged; only the world/scene dressing rotates.
- **Counting** expanded `biomes.ts` 3→9 biomes; **Number Order** generalized its 4 mini-games into 3 mechanics (`path`/`line`/`collect`); **Recognition** uses one `RecogItem` (door-sprite/balloon/bus + numeral chip, `hue-rotate` colour variety); **Matching Qty** uses one `Container` by `cType` (`bag`/`pizza`/`ground`).
- **ART via Nano Banana 2 (~115 credits this session):** new backgrounds (`farm_*`, `space_*`, `order_yard/depot/balloonsky`, `balloon_fair`, `bus_stop/bus_depot`, `pizzeria`, `garden_meadow/fence/park`) + new sprites (chick/lamb/duckling/pear, rocket/star/cloud/planet/comet/satellite/astronaut/moon_rock/alien, lilypad/cart/crate/balloon, bus, pizza_base/topping_olive/mushroom/pepper, flower_tulip/daisy/sunflower). All in `public/assets/`. Per-chapter detail in the auto-memory `project-milo-{counting-journey,order,recognition,grocery}-chapter`; pipeline how-to in `reference-nano-banana-pipeline`.

**BLEND CONVENTIONS (hard-won from user feedback — carry to every new chapter):**
1. **Give EVERY new sprite a `SIZE_BOOST`/size** (~1.8–2.3). Missing = tiny.
2. **Subject-dominant sprites:** a tall stem / big padding renders a tiny subject at any box size → regenerate so the subject fills the frame (e.g. flowers = big bloom, short stem).
3. **Grounded objects** sit low + cast a contact shadow; **flyers** stay airborne with NO ground shadow; **elevated** items (fruit) go on their support (tree canopy via anchor points).
4. **A grounded scene needs a LOW-HORIZON background (>50% ground)** + a tall ground band — else objects "on the ground" end up in the sky. Regenerated barnyard + garden bgs for this.
5. **Prefer flat-surface / open-ground "containers" (pizza disk, grass) over 3D boxes** — items sit ON them, no occlusion, nothing floats. (Toy Shop's 3D box was dropped for this reason → Flower Garden.)
6. **Fisher-Yates shuffle** (not `sort(()=>Math.random()-.5)`) for real round variety.
7. **Numeral chips:** small ON the object (balloon bulb / bus sign), or floating ABOVE a tall object (door) — a big on-object chip hides the object.

**NEXT:** (a) **commit** the batch (user must ask — no auto-push); (b) expand the remaining 3–5 chapters with the same pattern + WorldSelect: **Ch.3 Comparison (`Kitchen`), Ch.6 Shapes (`ShapeTown`), Ch.7 Colours (`RainbowTown`), Ch.8 Patterns (`BeadShop`)**. To preview locally `.claude/launch.json` is on port 3017 + `autoPort` (Linkcage holds 3000).

## EARLIER (2026-06-29 → 30) — three features SHIPPED to production

All `tsc --noEmit` + `next build` clean. **Committed + pushed to `main` → Vercel production READY (live on www.mi2utor.com).** Three logical commits on top of `c4dd322`: `ff47d57` (grades) · `21565b1` (practice early-exit/dedupe) · `5971aa5` (scene grounding). Detail in auto-memory `project-milo-grades-feature`, `project-milo-engagement-improvements`.

1. **Grades feature** (teacher use). Teacher creates a named **grade** = (name + one age band + a hand-picked chapter subset); children are added into a grade and see exactly that grade's chapters. Optional/coexist: a learner with no grade falls back to all band chapters (today's behavior). New tables `grades` + `grade_chapters` + nullable `learners.grade_id`. **Migration APPLIED to prod Supabase** (`qaymxunzlarwusogwyak`, file `supabase/migrations/20260629120000_grades.sql`) — verified (RLS, triggers, search_path pinned). UI: `/parent/grades` (list + create/edit modal), grade selector in AddLearnerModal, menu/picker scope to grade chapters. `createLearner` only sends `grade_id` when a grade is chosen, so existing learners (no grade) are unaffected. **Grades UI now LIVE.** Not yet exercised end-to-end by a real teacher login — worth a smoke test (create grade → add child → child sees only those chapters).

2. **Practice: mastery early-exit + non-repeating questions** (all ages). `useAdaptive.record()` returns `{…, mastered}` (top tier + 6 correct in a row → finish early with full ⭐⭐⭐). New `src/lib/questionVariety.ts` `makeDistinct` dedupes questions per session. `SkillBeat` change covers all 3–5 scenes; ~50 `game/*Chapter.tsx` inline-loop chapters wired via a 57-chapter workflow (refs: `IntegersChapter` A1 / `AdditionChapter` A2). Math-without-fear preserved.

3. **Object placement re-grounded** (all 8 story scenes). Replaced the flat even-row `layoutFor` with depth-aware placement: per-object depth (near=bigger+lower, far=smaller+higher), a soft contact-shadow ellipse on a per-scene ground line, organic x jitter. Ref impl `RainbowTown.tsx` (`placeFor`/`SCENE_GROUND`/contact shadow in `ColorThing`); rolled to the other 7 (free-standing scenes fully grounded; Grocery shelf + BeadShop necklace kept their composition + shadow cues; ForestWalk butterflies scatter at depth, no ground shadow). All verified live at `/story?ch=<key>`.

**Asset pipeline (Higgsfield MCP / Nano Banana 2):** connected for AI image gen. Model `nano_banana_2`, **metered ~1.5 credits/1k image** (NOT unlimited — verified), Plus account ~1,208 credits. **1k for everything** (1k @16:9 = 1376×768 = exact match to existing backgrounds; 1k @1:1 ≈ 1024² for sprites). STANDING RULE (see `feedback-higgsfield-reference-images`): always pass the **pond/forest/objects** assets as reference images for style consistency; **never regenerate existing art** unless asked. Import refs via deployed URLs (`https://milo-story-mode.vercel.app/assets/...`) → `media_import_url` → `media_id`; sprites need `remove_background` (+ greyscale for recolorable objects). Nothing generated/committed yet — awaiting a specific target.

**Next:** (a) teacher-login smoke test of grades on prod; (b) when asked, generate new app art via Nano Banana 2 against the pond/forest/objects references. To preview `/story` locally, set `.claude/launch.json` port to a free one (Linkcage holds 3000); the OAuth callback wants 3000.

## TEEN EXPANSION 12–18 ("Field Lab") — earlier focus

Extending Milo to 12th grade. Curriculum + framing LOCKED; see `docs/curriculum-12-18.md`,
`docs/framing-12-18.md`, `docs/teen-kit-build-contract.md`, `docs/teen-kit-interfaces.md` and the
auto-memory `project-milo-{12-14,15-16,17-18}-curriculum`, `project-milo-teen-framing`,
`project-milo-teen-engagement`.

- **Bands:** 12–14 (middle), 15–16 (Algebra I + Geometry), 17–18 (Algebra II/Pre-Calc/Stats/**intro Calc**, 13 ch).
- **Design = "Milo Field Lab":** ONE mature dark-first design language that ages up (Milo: character→collaborator). NOT a cartoon story (teens reject that). Theme = scoped `[data-band]` token blocks in `globals.css` (IBM Plex + mono math); kit in `src/components/teen/` (16 components + `sims/`).
- **Every chapter = the SAME fundamentals:** portal wrapper → **intro (CaseCard) → Explore (interactive sim) → lesson (TeenLessonShell worked examples) → adaptive practice (`useAdaptive` L1/L2/L3) → re-explanation (ReteachPanel after 3 misses) → MasteryState.** Math-without-fear kept (no timer/red-X/visible tier). Mirror `IntegersChapter`/`IntegersTeenLesson`/`LineExplorer`.
- **Sims (engagement lever):** a play-with-it-first interactive per chapter (slider-driven, reuse `CoordGrid`/`FigureDiagram`). e.g. slope, balance-scale, parabola (live vertex/discriminant/roots), systems-intersection, Pythagoras, percent-bar.
- **SHIPPED to production (2026-06-29):** **12–14 (12 ch)** and **15–16 (12 ch)** — all with sims, lessons, adaptive practice, re-teach. = **24 of 37** teen chapters. Committed `c4dd322` on `main` → Vercel production **READY** (live on www.mi2utor.com). The live 3–11 app is unaffected (teen theme + content are additive + age-gated).
- **DB applied to prod Supabase** (`qaymxunzlarwusogwyak`): `age_group` CHECK widened to all 6 bands; chapter rows seeded for 12–14 (sort 36–47) + 15–16 (48–59). To see teen content on prod, create a learner in the 12–14 or 15–16 age group.
- **Dev preview routes shipped too** (harmless, no data, but public): `/teen-preview?c=<id>`, `/kit-preview`, `/sim-preview`, `/integers-preview`. Remove/gate before a wider launch if desired.
- **NEXT: build the 17–18 band** (13 ch + sims, incl. unit-circle drag + secant→tangent limit), then fan-in (sort 60–72) + seed migration + deploy.
- **Add a teen chapter:** add id to `ChapterType` + `CHAPTERS` (ageGroups) in `chapters.ts`, dispatch line in `game/page.tsx`, seed migration row; `npx tsc --noEmit` then `next build`. Preview any teen chapter: `/teen-preview?c=<id>`; kit gallery `/kit-preview`; a sim `/sim-preview`.
- **Known z-index rule:** kit body-portals (CalmAdvance, leave-dialog) MUST be z>900 or they hide behind the chapter portal (fixed 2026-06-28).

---


## Where things are

**EIGHT of the 3–5 skills are now story chapters** (each: a story component + a thin `createPortal` wrapper in `game/*Chapter.tsx` that calls `finishAndSync(skill,…)` + `CelebrationModal`; preview standalone via `/story?ch=…`):

| Ch | Skill | Component | `?ch=` |
|----|-------|-----------|--------|
| 1 | Counting | `ForestWalk` | (default) |
| 2 | Number Order | `RiverCrossing` | `order` |
| 3 | Comparison | `Kitchen` | `kitchen` |
| 4 | Recognition | `NumberDoors` | `doors` |
| 5 | Matching Qty | `Grocery` | `grocery` |
| 6 | Shapes | `ShapeTown` | `shapes` |
| 7 | Colours | `RainbowTown` | `rainbow` |
| 8 | Patterns | `BeadShop` | `beads` |

- **Ch.1–8 committed + deployed to production** (www.mi2utor.com / milo-story-mode.vercel.app). As of 2026-06-29, `main` + Vercel production are at **`c4dd322`** (Ch.8 Bead Shop, the blocked-audio voice fix, `CLAUDE.md`, AND the teen 12–18 expansion are all shipped — see the TEEN EXPANSION section above).
- **3 drills remain to convert (3–5):** addition · subtraction · measurement.

## SESSION 2026-06-28 (historical — Ch.7 colours + explanation-pacing fixes)

- **2 non-AR Tier-0 fixes:** `useAdaptive` stale-closure → ref snapshot (rapid taps no longer corrupt promote/demote); removed the dead middleware auth guard (it bounced signed-in users to `/auth` on PWA cold launch; session is in localStorage, not cookies).
- **Ch.7 Rainbow Town (colours):** built + painted art + **greyscale-tint objects** (one greyscale sprite → tinted to the exact hex via mask-fill + multiply, so colours stay consistent with labels) + **cars sit on the road** (per-scene lower band, grouped right of Milo).
- **"Meet every colour/shape" showcases** added to Ch.6 + Ch.7 (all six shown, named one-by-one).
- **Explanation-pacing fixes** (the recurring "fast / without voice" reports):
  1. Showcases are **self-paced** (deterministic ~1.5s/item) — short single words race when tied to speech events.
  2. `speakSteps` silent-fallback hardened (2.8s grace, started-guards, 1.4s step) + `unlockSpeech()` on intro taps.
  3. **Blocked-audio fix:** gate speakSeq's `onDone` on `started` so a demo whose utterances `onerror` (no audio) falls through to the deliberate timer-fallback instead of flashing past. Verified by simulating blocked audio (demo: ~130ms flash → ~6.8s paced).
- **Committed + deployed** everything through Ch.7 to GitHub + Vercel (3 logical commits; `.claude/` gitignored).
- **Ch.8 Bead Shop (patterns):** Milo threads beads onto a necklace, child taps the bead that comes next; "what comes next" only, unit ramps AB→ABC→ABCD; code-drawn glossy beads; full autoplay verified.
- Added `CLAUDE.md` (reads `@AGENTS.md` + `@handoff.md` at session start; `/handoff` convention).

## Decisions / standing rules

- **No commit/push/deploy unless explicitly asked.**
- **This is Next.js 16 with breaking changes** — read `node_modules/next/dist/docs/` before Next code (e.g. `middleware`→`proxy` rename). `next build` does NOT gate on eslint; the wrapper `setBody(document.body)` `set-state-in-effect` "error" is accepted (it's in every shipped wrapper).
- **New story chapter = mirror ShapeTown/RainbowTown:** intro→demo→guided→practice, ONE adaptive `SkillBeat`; the Play renders **fixed-position bands** (SkillBeat stacks its own prompt button, so an `absolute inset:0` stage collapses); keep it code-drawn with optional `<img>`/sprite auto-upgrade hooks; clear Milo (bottom-left).
- **Demo voice:** short-word LISTS (showcase/counting) → self-paced fixed timer + `speak()` per word; SENTENCE demos → `speakSteps` (now blocked-audio-safe). Never fixed-timer multi-line `speak()` (cuts).
- **Viewport scaling:** no hard-coded sprite px on a 100vw stage — use a scale hook; verify ~1900px.
- **Recolorable objects:** greyscale sprite + code-tint (don't bake colour into PNGs for colour-recognition).

## Next steps

1. **Build the 17–18 band** (13 chapters + sims, incl. intro Calculus) — same pattern as 12–14/15–16, then fan-in (registry + dispatch + seed migration sort 60–72) and deploy. Completes the 37-chapter teen set.
2. **(3–5 backlog)** Convert the remaining drills: addition · subtraction · measurement.
3. **Optional art:** drop `backgrounds/bead_shop.jpeg` + `characters/milo_beads.png` to auto-upgrade Ch.8.
4. **Deferred (user's call):** AR work (consolidate `useHandGesture`/`useHandPincher`; AR chapters always score 3 stars); the architecture-audit medium/low backlog (offline-sync de-dupe, legacy lessons→`_kit`, `ResizeObserver` vs the 150ms poll, 2 DB indexes, parent-dashboard RPC, vitest+CI, remaining Tier-0: `acceptInvite` expiry, unbounded `/insights` fetch, `daily.ts` DST).

## Open questions / blockers

- **Does Milo's voice play *anywhere* on the user's test device** (e.g. on a practice-answer tap or the 🔊 button)? Determines whether the remaining "without voice" is a device/audio issue (no TTS/muted/autoplay) vs an unlock-timing issue with the auto-played demo. The pacing is now deliberate regardless; voice is the open item.

## How to test

`npm run dev` → `/story?ch=<key>` (table above; default = Counting). In-game, each runs via its menu chapter. Headless preview never fires speech `onstart` (so demos use the timer-fallback) — fine for verifying pacing/visuals, not real audio.

## Resources

- **Live app (Vercel production):** https://milo-story-mode.vercel.app/ · also https://www.mi2utor.com
  - Latest production deploy: commit **`1e129ab`** (measurement rebuilt — lay a unit end to end and
    count), sw **v62** — READY, smoke green, driven live on prod.
  - Preview a 3–5 chapter directly: `https://milo-story-mode.vercel.app/story?ch=<key>`. Keys are in
    [story/page.tsx](src/app/story/page.tsx) and are the source of truth; the 3–5 band is:

    | key | chapter | state |
    |---|---|---|
    | *(none)* | ch1 · counting parade | rebuilt |
    | `order` | ch2 · Follow the Leader | rebuilt |
    | `nest` | ch3 · Nest Tree (`race`/`doors` also resolve) | rebuilt |
    | `home` | ch4 · Home Time (`grocery` also resolves) | rebuilt |
    | `kitchen` | ch5 · Bigger or Smaller — **the old Milo's Kitchen is gone; the key stayed** | rebuilt |
    | `add` `sub` | ch9/10 · Play Time, one component run both ways | rebuilt |
    | `shapes` | ch6 · Shape House — a shape sorter | rebuilt |
    | `rainbow` | ch7 · Colouring Book — garden teaches, toy room tests | rebuilt |
    | `beads` | ch8 · Bead Shop — one growing string | rebuilt |
    | `measure` | ch11 · Measure It — lay a unit and count | rebuilt |

    Every rebuilt chapter is **landscape-only** — a portrait window shows the rotate gate, not the
    chapter, so a portrait screenshot is not evidence of anything.
- **Repo:** github.com/Rafiquekuwari/milo — `main` auto-deploys to Vercel production (project `milo-story-mode`, team `team_HQsF3tfxAuGgZi7CcdhSdN7Y`).
- **Detail:** the auto-memory `project-milo-*` files (one per chapter + sync/scaling/voice/launch-readiness).
