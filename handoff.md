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
> check:social` after any GoDaddy edit and before any deploy that touches it** — it follows each
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
>    a real hand · 132 eslint errors · `support@radlor.com` may still have no mailbox.

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
> `DRAFT = true` on the legal text · AR never driven with a real hand · 132 eslint errors.
> **And two new ones:** ~~`sameAs` is empty (§③)~~ **CLOSED 2026-08-20, see 🔗** and `support@radlor.com` may not exist (§⑥).

> ⚡ **2026-08-19 (third pass) — A DECORATIVE FONT WAS 82% OF THE APP'S FONT BYTES AND ~40% OF THE ENTIRE FIRST VISIT, PRELOADED ON EVERY PAGE, RENDERING NOTHING. ONE OPTION FIXED IT: 816 KB → 146 KB.** `tsc` 0 · **1135/1135** · `next build` 0 · sw **v122 → v123**.
>
> ## ⓪ ⚠️⚠️ `next/font/google` PRELOADS **EVERY UNICODE SUBSET**, AND `preload` DEFAULTS TO TRUE
> Measured on production, not inferred: the landing page emitted **97 `<link rel="preload" as="font">`
> tags and fetched 97 woff2 files, 816 KB — 49% of a 1.68 MB first visit.** Broken down per family
> by matching each fetched file back to the `@font-face` rule that names it:
>
> | family | files | KB | share |
> |---|---|---|---|
> | **Gaegu** | **90** | **671** | **82%** |
> | IBM Plex Sans | 1 | 39 | 5% |
> | IBM Plex Mono | 4 | 39 | 5% |
> | Nunito | 1 | 38 | 5% |
> | Fredoka | 1 | 29 | 4% |
>
> **Gaegu is a KOREAN face** used only for `--font-chalk` (the teen band's chalkboard). Google splits
> it into ~45 unicode ranges × 2 weights, and `preload: true` — the DEFAULT — emits a preload link for
> **every one of them, on every page**. ⚠️ **The landing page rendered ZERO elements in it.** Counted
> live: `elementsUsingGaeguOnThisPage: 0`, against 29 for Fredoka and 0 for the other three.
>
> **Fix: `preload: false` on Gaegu alone.** After: **7 preload links, 7 files, 146 KB.** The other
> four stay preloaded on purpose — Fredoka is the landing page's LCP text and none of them is big
> enough to risk a late swap.
>
> ⚠️ **VERIFIED THAT THE CHALKBOARD STILL WORKS, because that is the risk of the change:** Gaegu's
> **179 `@font-face` rules are still declared**, `--font-chalk` still resolves to `Gaegu, "Gaegu
> Fallback", "Comic Sans MS", cursive`, and `document.fonts.load('400 16px Gaegu', …)` returns
> **true** while fetching **4 files** — the ranges that text actually needs, not 90.
> ⚠️ **Do not turn preload back on to remove a flash of fallback on the board.** That trade costs
> every child on every page 671 KB, and `display: 'swap'` is already handling it.
>
> ## ① THREE SMALLER SURFACES, ALL PREVIOUSLY MISSING
> - **`FAQPage` on `/help`.** ⚠️ The answers are JSX with `<Link>` inside, and the obvious way to get
>   plain text for the schema is a second `plain:` string per item — the duplicate-fact trap this repo
>   keeps paying for, where the copy that drifts is the machine one nobody reads. Instead `plainText()`
>   walks the element tree: **no renderer** (so `<Link>` needs no router context) and the schema
>   cannot disagree with what is on screen. 8 questions emitted.
> - **A 1200×630 `opengraph-image`.** ⚠️ `og:image` had been `/icons/icon-512.png` — **the PWA icon, a
>   SQUARE.** Every social card slot is 1.91:1, so a square is letterboxed or cropped to a strip, on a
>   product parents forward by link. The hand-declared `images` arrays are gone from `layout.tsx`;
>   naming one back would override the file-based route and reinstate the square.
> - **`/llms.txt`**, generated from `PUBLIC_ROUTES`. It leads with the two facts a model most often
>   gets wrong here: Milo is the CHARACTER, and the camera never uploads anything.

> 🔎 **2026-08-19 (same day, second pass) — THE APP'S PUBLIC SEO WAS BROKEN AND NOTHING IN 1,122 TESTS COULD SEE IT. ⚠️ AND FIXING IT TRIPPED `security.test.ts`, WHICH WAS RIGHT — THE FIX THAT SATISFIED IT IS STRICTLY BETTER THAN WHAT I FIRST WROTE.** `tsc` 0 · **1135/1135 vitest** (+13) · `next build` 0 · sw **v121 → v122**.
>
> ## ⓪ WHAT WAS ACTUALLY WRONG, MEASURED ON THE RUNNING APP
> - **Four of the five `PUBLIC_ROUTES` declared NO canonical.** Only `/` had one.
> - **All five shared ONE description** — the root's — so `/legal/privacy` advertised a placement
>   check. Five pages, one meta description, which search engines read as duplicates.
> - ⚠️ **`/diagnostic` had no title and no `<h1>` of its own**, i.e. **the highest-intent public page
>   in the product was not a distinct page to a crawler.** The cause is worth remembering:
>   **`page.tsx` is `'use client'`, and a client component CANNOT export `metadata`.** The only fix
>   without converting it to a server component is a `layout.tsx` beside it. There is now one.
> - **Zero structured data anywhere in the app.**
>
> ## ① ⚠️⚠️ `security.test.ts` FIRED ON MY JSON-LD, AND THE CORRECT RESPONSE WAS NOT TO WHITELIST IT
> JSON-LD is normally written with `dangerouslySetInnerHTML` — Next's own docs show that — and this
> repo's gate fails the build on the first such sink, **by design**: the handoff's V15 entry accepts
> CSP `'unsafe-inline'` *only* because the app has zero injection sinks, so the PREMISE is gated
> rather than the header. Adding an exemption would have quietly retired that argument.
> **Measured instead of assumed** (throwaway vitest, `renderToStaticMarkup`):
> `<script type="application/ld+json">{jsonString}</script>` renders `</script>` inside the string as
> **`</\u0073cript>`** — so a breakout is impossible — while leaving quotes and `&` alone, and the
> JSON **round-trips byte-identical**. So the safe form is also the correct form and the dangerous
> one was never needed. Rewritten in the app AND in all 8 blocks on `../radlor-site`.
> **THE RULE: when a gate fires on a standard idiom, measure the safe alternative before weakening
> the gate.** The gate was right; the idiom was lazy.
> ⚠️ Note for the next throwaway test: `vitest.config.ts` includes **`src/**/*.test.ts` only** — a
> `.tsx` test file runs zero tests and reports success.
>
> ## ② THE TWO PROPERTIES NOW DESCRIBE ONE ENTITY, AND THAT IS THE POINT
> ⚠️ **"AdaptiveLearn" is a GENERIC phrase in a crowded category** — searched 2026-08-19, it returns
> "adaptive learning" the concept plus AdaptedMind / bettermarks / DreamBox / Prodigy. **"Radlor" is
> distinctive and effectively unclaimed** (one Instagram handle, one hair salon in Madrid). So the
> brand has to carry the entity:
> - both sites emit `SoftwareApplication` with the **identical `@id`** `https://adaptivelearn.radlor.com/#app`
> - both point `publisher` at `https://radlor.com/#organization`, **declared once on radlor.com and
>   only REFERENCED here** — two declarations would be two companies sharing one name
> - the app links to radlor.com **visibly**, in the footer, because a schema-only claim is weaker
>
> ⚠️ **Retyping either `@id` silently splits the product in half.** `APP_ID`/`COMPANY_ID` live in
> `src/app/site.ts`; the gate asserts the exact strings.
>
> ## ③ THE GATE: `src/__tests__/publicSeo.test.ts` (13 assertions)
> Reads the real `metadata` exports rather than re-stating the rules, counts its own coverage against
> `PUBLIC_ROUTES` so it cannot fall behind, and asserts no two public pages share a description.
> **Five regressions planted in the SOURCE, all five caught** — dropped canonical, dropped
> description, duplicated legal descriptions, a mismatched `@id`, and the visible Radlor link removed
> while the schema stayed.
> ⚠️ **It deliberately does NOT import the root layout**: `layout.tsx` calls `next/font/google` at
> module scope, which throws under vitest. "Declares its own, and no two match" is both runnable and
> the stronger claim — the bug was that these pages declared nothing at all.

> 🏷️ **2026-08-19 — THE PRODUCT IS NAMED `AdaptiveLearn`. MILO IS THE CHARACTER, AND THE SPLIT IS DELIBERATE.** Founder's call while building the Radlor company site, which had been calling the product AdaptiveLearn while the app called itself Milo — the same product under two names across two properties, which is the one thing that stops either name accumulating any search or answer-engine authority. `tsc` 0 · **1122/1122 vitest** · `next build` 0 · prod sw bumped **v120 → v121**.
>
> ⚠️⚠️ **THE RENAME IS SURGICAL AND A FIND-AND-REPLACE WOULD DESTROY THE CHARACTER.** There are
> ~1,300 occurrences of "Milo" in this repo and **the overwhelming majority are the pony** — every
> chapter's speech, every `alt`, `PtMilo`, `useMiloStore`, `useMiloSpeaker`, `MiloErrorBoundary`.
> **The rule, and it is the Duo/Duolingo split:**
> - **A NAMING POSITION carries the product name** — `<title>`, `applicationName`, `og:site_name`,
>   the manifest, the landing wordmark, the sign-in headline, the help/legal titles and back links,
>   and the legal documents' own definition of the service (*"AdaptiveLearn is a maths practice app
>   for children aged 3 to 18"*). Those 17 strings changed.
> - **THE PONY DOING SOMETHING STAYS MILO** — *"Milo can't find that page"*, *"Oops! Milo tripped
>   over something"*, *"Milo will ask a few quick questions"*, *"Milo's wardrobe"*, and all 626
>   occurrences in `src/features`. **Do not "fix" these for consistency.** A mascot with a name is
>   the point; the product having two names was the bug.
>
> ⚠️ **THE MANIFEST `name`/`short_name` CHANGED, WHICH IS NOT A FREE EDIT.** Every device with the
> app on a home screen re-reads the manifest and may re-prompt or relabel the installed icon. That
> is the correct trade here and it is worth knowing before the next support message about it.
>
> ⚠️ **The app icon is still the pony and that is right** — Duolingo's icon is Duo. Do not regenerate
> the icon set to say "AdaptiveLearn".
>
> **Also fixed:** the sign-in page's subtitle read *"Learning adventures for little ones"* on a
> product that goes to eighteen. Now *"Adaptive maths for ages 3 to 18"*.
>
> 🌐 **AND THERE IS A SECOND REPO NOW: `../radlor-site`** — the Radlor company website
> (`radlor.com`), deliberately a separate repo and a separate Vercel project so a marketing edit
> cannot touch this deploy pipeline. Ten pages, structured data throughout, `llms.txt`. Its
> `docs/seo-geo-setup.md` is the standing list of what is left. **Nothing there is pushed yet.**

> 🏗️ **2026-08-18/19 — EVERYTHING MOVED OFF THE PERSONAL GMAIL AND ONTO THE COMPANY (RADLOR). THE APP IS LIVE ON `adaptivelearn.radlor.com`. ⚠️ AND ALONG THE WAY THE FOUNDER LOCKED HIMSELF OUT OF THE PRODUCTION DATABASE, THE DEPLOY PIPELINE BROKE SILENTLY THREE TIMES, AND I "PROVED" A PLAN LIMIT THAT WAS THE OPPOSITE OF TRUE.** 🏗️ SHIPPED — `main`@`e450cd6`, prod serving **sw v120**. `tsc` 0 · **1122/1122 vitest** · `next build` 0.
>
> **The asks:** *"vercel sahi option hai?"* → *"sab domain ke email pe transfer karna hai"* →
> *"kaunse subdomain?"* → *"social media handles"* → *"google oAuth custom domain se"* →
> *"github ka batao"* → *"supabase mein problem ho gayi"* → *"learn.radlor.com kaise banau"*.
>
> ## ⓪ ⚠️⚠️ THE ONE THAT NEARLY COST THE CHILDREN'S DATA
> Transferring the Supabase org, the founder made `admin@radlor.com` an Owner and then hit
> **"Leave team" on the personal account before confirming the new owner worked.** Result: the
> personal account saw **zero organizations**, `admin@` saw the project but got *"You do not have
> access to this project"*, and **my MCP lost all access too** (`execute_sql` → "no permission") —
> so I could not have helped extract anything. Recovered by the founder; 17 learners / 8 accounts /
> 44 sessions all intact.
> ⚠️ **THE DATABASE NEVER WENT DOWN** — REST, auth and the app stayed 200 throughout, because those
> run on the anon key and the URL, not on dashboard membership. **Check that first and say it first;
> "I am locked out" is not "the app is down".**
> **THE RULE: on any ownership transfer, verify the NEW owner can actually use the thing, THEN
> remove the old one. Never the other way round.** The same rule was then applied to Google Cloud
> and Vercel and both went cleanly.
>
> ## ① ⚠️⚠️ THE DEPLOY PIPELINE BROKE SILENTLY **THREE** TIMES IN ONE DAY
> Repo transfer → private → and once more. Every time: **GitHub accepted the push, Vercel created no
> deployment, production sat on the old build, and there was no error in any UI.** Worse, Vercel's
> Settings → Git page showed the correct repo *while the webhook was dead*, so the thing you would
> naturally check to confirm the fix was itself green and wrong.
> **THE RULE, now also in the header: after ANY repo or host change, push once and confirm a
> deployment appears. A green settings page is not evidence.** To force one meanwhile:
> `POST /v13/deployments` with `{gitSource:{type:'github',repoId,ref:'main'}}`.
>
> ## ② ⚠️⚠️ I PROVED THE WRONG THING ABOUT THE VERCEL PLAN, AND THE FOUNDER WAS RIGHT
> He said Hobby will not host a private repo. I said it would, flipped it private, POSTed a
> `gitSource` deployment, watched it go **READY**, and reported that as proof. Vercel's own message
> when he tried to reconnect Git: *"The repository 'learn' is private and owned by an organization,
> which is not supported on the Hobby plan."*
> **The API deploy runs on a USER TOKEN and never crosses the plan gate — the gate is on the Git
> *integration*.** So I had proven Vercel could CLONE the repo and reported it as proof the plan
> allowed the integration. It also explains two of the three "mysterious" dead webhooks: no mystery,
> the plan was blocking. **The unsupported thing is the COMBINATION — private AND org-owned.**
> Repo is back PUBLIC and must stay so until Pro.
>
> ## ③ 🔍 THE VERIFICATION TOOL THIS SESSION FOUND: `auth_logs`
> Whether `adaptivelearn.radlor.com` was on Supabase's redirect allowlist is the one thing that
> could silently kill sign-in for **5 of 8 accounts**, and I could not test it: driving
> `/auth/v1/authorize` with the new origin redirected to Google — **but so did a CONTROL with an
> obviously-forbidden domain.** Supabase validates at the CALLBACK, not at authorize, so the probe
> could not tell allowed from forbidden. Reported as UNVERIFIED rather than as working.
> ⚠️ **Then the founder signed in, and `query_logs` on `source='auth_logs'` showed it end to end:**
> `path=/callback status=302 referer=https://adaptivelearn.radlor.com`, `action=login
> provider=google`, then `/user` 200s. Plus `"reloading api with new configuration"` at the moment
> he saved the allowlist. **Supabase auth logs are how you verify an auth change actually worked —
> use them instead of inferring from a redirect.**
>
> ## ④ WHAT ACTUALLY MOVED
> - **GitHub** → `RadlorMain/learn` (Org) — **since renamed `RadlorInc/learn`, 2026-08-20.** Repo ID `1248492657` is unchanged by transfer/rename,
>   which is why Vercel's link survived while its cached `org/repo` label read the old path.
> - **Supabase** → org owned by `admin@radlor.com`. ⚠️ My MCP connection is **OAuth, not a PAT** —
>   neither account's Access Tokens page lists it. To move it: disconnect/reconnect the connector
>   while signed in as the company account.
> - **Google Cloud** → the OAuth client lives in project **"AI Detector"** (`ai-detector-493801`),
>   found from the client ID's numeric prefix = the project number **12513320995**, and the URL
>   `console.cloud.google.com/apis/credentials?project=<number>` resolves straight to it.
>   ⚠️ **`admin@radlor.com` is only EDITOR — still open.** Editor cannot manage IAM, so the personal
>   Gmail is still the real owner.
> - **Vercel** → still `plan: hobby`, still the personal scope. Email change is the cheap move; the
>   Team + project transfer waits for Pro.
> - **Google OAuth cleanup shipped:** `access_type: 'offline'` and `prompt: 'consent'` removed —
>   nothing ever read `provider_token`, and forcing consent made every returning parent re-approve.
>   Verified on the PROD URL: both params `<<ABSENT>>`, scope/client/redirect unchanged.
>
> ## ⑤ INFRA VERDICTS GIVEN (measured, not guessed)
> - **Stay on Vercel; upgrade to Pro before launch.** Hobby is non-commercial-only, its ~1 h log
>   retention is how the plan-pointer P0 hid for three months, and now it also blocks the private
>   repo. Every alternative is a compatibility layer for Next 16 App Router.
> - **No Google Workspace needed** (₹325/user/mo). Email is on Microsoft 365; a plain Google account
>   on a custom address owns a Cloud project for free. ⚠️ Completing a Workspace signup for
>   radlor.com would have demanded MX pointing at Google and **broken the M365 mailboxes**.
> - ⚠️ **Supabase's built-in mailer will block signups at launch** — hit live: `{"code":429,"msg":
>   "email rate limit exceeded"}`. 3 of 8 accounts sign up by email. Needs custom SMTP on a
>   dedicated sending subdomain (`mail.radlor.com`).
> - **Social handles:** `github.com/radlor` is TAKEN; `radlorhq`/`radlor-labs`/`getradlor` free.
>   ⚠️ HTTP status alone cannot tell a taken handle from a free one — **a control handle is what made
>   that check mean anything**, and the same control trick then invalidated my allowlist probe in ③.
>
> ## ▶ OPEN
> 1. 🔴 **STILL NO BACKUP OF THE CHILDREN'S DATA — AND TODAY SHOWED WHY.** `backup.yml` is committed
>    and inert. Add to `RadlorInc/learn` → Settings → Secrets → Actions: `SUPABASE_ACCESS_TOKEN`,
>    `BACKUP_PASSPHRASE`, `PROD_DB_PASSWORD`, `PROD_PROJECT_REF=qaymxunzlarwusogwyak`, then run
>    **Backup (prod database)**. Ten minutes. This is the highest-value thing left in the repo.
> 2. **Google Cloud: `admin@radlor.com` Editor → OWNER**, accept the emailed invite, then remove the
>    personal Gmail LAST. ⚠️ Never delete the OAuth client or regenerate its secret — 5 users.
> 3. **Vercel:** set `adaptivelearn.radlor.com` as the **Production Domain** and add
>    `NEXT_PUBLIC_SITE_URL=https://adaptivelearn.radlor.com`, or sitemap/robots/og-image keep
>    advertising the vercel.app host. Keep the vercel.app entry in Supabase's allowlist for now.
> 4. **Vercel Pro** — gates the private repo, commercial use, and real log retention, all at once.
> 5. **`SUPABASE_SERVICE_ROLE_KEY`** — the domain blocker is long gone. Order: set key → apply
>    `20260816170000_leads_server_only.sql` → submit one real lead → then `…_leads_retention.sql`.
> 6. **`DRAFT = true` is still live**, and everything from prior sessions stands (AR never driven
>    with a real hand · `practice_complete` unobserved · dropped EXPLORE beats · 132 eslint errors).
> 7. Of this session's faults, **the biggest was mine and the founder was right**: I contradicted him
>    on the plan limit and backed it with a test that measured a different thing. The runner-up is
>    that I gave a CNAME target Vercel later stopped recommending. **Both are the same fault — trust
>    the system's own answer at the moment you need it, not the one you captured earlier.**

_Older sessions (2026-06-15 → **2026-08-15**) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20._
