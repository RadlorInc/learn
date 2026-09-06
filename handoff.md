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

> ⚖️ **2026-09-06 — THE TERMS SAID THINGS THE PRODUCT DOES NOT DO, AND THE BIGGEST ONE — "delete your account at any time from your account settings" — HAD NOTHING BEHIND IT AT ALL. Both legal documents placed behind the draft banner; account deletion built, and PROVEN not to orphan before a line of it was written.** `tsc` 0 · **1817 passed, 1 skipped** · `next build` 0 · **four commits, CI green on `a9d638d`** · sw v163 → **v167** · one migration written here and applied by the founder, verified present in production.

## ① 📄 THE APP'S TERMS ARE ON `/legal/terms`, AND EVERY PLACEHOLDER STILL SHOWS
Pasted **verbatim** from `docs/app-terms-of-service.md` (in the repo, because the gate compares against it), minus only its markdown H1 and its "Last updated" line — both of which the page renders from `title`/`updated`. Linked from **signup (above the button — it was below it), the parent dashboard footer, checkout (above Continue), and the landing footer**.
**`DRAFT` is true and the banner is up.** ⚠️ **The date is 6 September 2026 — founder's call, 2026-09-06, and it is NOT a review.** `[DATE]` marked *"nobody has decided"*, not *"a lawyer must decide"*. **Four markers are still open and still render to every visitor:** nine `[LAWYER REVIEW]`, §3's and §15's `[NN]` windows, §15's `[URL]`, and §8's refund sentence — which is not waiting on counsel, it is **unwritten**, and its own text says *"Do not publish with a placeholder."*
⚠️ **`PLACEHOLDERS` vs `OPEN` is the distinction that took two passes to see.** The first is the REFUSAL list and never shrinks (a resolved `[DATE]` coming back still blocks publication); the second is what is unresolved TODAY, written by hand, so resolving one is a diff somebody reviews rather than a gate quietly finding less to complain about. Both directions are asserted.

## ② 🚨 WHAT THE DOCUMENT CLAIMED AND THE CODE DID NOT DO
Four findings, each measured. **The first is why the rest of the day happened.**
- **§11: "delete your account at any time from your account settings."** The only occurrence of that phrase in the whole repository **was the sentence itself.** No control, no route, no RPC.
- **§8: "You may cancel at any time from your account settings."** No billing portal, no cancel route. `cancel_at_period_end` is READ and never written. Still true today.
- **§6 contradicts the Privacy Policy**, and §6's own `[LAWYER REVIEW]` note says it must not: it promises *"placement results … kept while the profile exists"* while `prune-diagnostic-items` deletes `diagnostic_items` at 90 days and the Privacy Policy says so out loud.
- **The camera is not in the document at all.** Eight live 9–11 chapters ask a child to turn it on; §3 enumerates *"what a child never gives us"* including *"a photograph"* and never mentions it.
⚠️ And two §6 claims are **true in code and never once observed in production** — `sessions.started_at` and `auth_events` — i.e. the 📊 block's own open items 2 and 3.

## ③ 🗺️ THE FK MAP, READ OFF `pg_constraint` — AND THE `RESTRICT` THAT WAS PROTECTING US
Milo production is not reachable from the MCP (only `radlor-site` is), so the schema was built in **pglite from `baseline_schema.sql` + all 81 migrations** — the sequence `ci / rls-tests` stages — and the catalog queried. That fixture is now [src/__tests__/_schema.ts](src/__tests__/_schema.ts) and is reusable.
⚠️⚠️ **`learners.created_by -> profiles` is ON DELETE **RESTRICT**, and `profiles.id -> auth.users` is CASCADE. So deleting an auth row for any parent who had ever added a child RAISED**, measured by running it:
`update or delete on table "profiles" violates RESTRICT setting of foreign key constraint "learners_created_by_fkey"` — auth user, profile and learner all still present afterwards.
**Deletion was not un-surfaced, it was impossible** — and that RESTRICT is the reason no half-deleted family exists, and why the function deletes learners FIRST in the same transaction.
⚠️ **`error_events.learner_id` has NO foreign key at all** — the one orphan this schema can produce, since no cascade reaches it. Cleared explicitly.
⚠️ **`billing_events.account_id` is SET NULL** — the one deliberate survivor. **`diagnostic_leads` is not reachable by deletion at all** (keyed on the email, no user id): a parent who used the free check, signed up with the same address and then deleted still has that row for 24 months. A real gap in the promise, recorded not fixed.

## ④ 🔐 `delete_my_account` — ONE TRANSACTION, AND `amr` RATHER THAN `iat`
SECURITY DEFINER, revoked from `public`/`anon`, granted to `authenticated` only; subject from `auth.uid()`, so a caller can only delete themselves. No service-role key and no API route. **One function, therefore one transaction:** a partial failure is an untouched account and an error the parent is told about. No soft delete, no grace window.
⚠️⚠️ **THE RE-AUTH GUARD READS `amr`, NOT `iat`, AND I WROTE `iat` FIRST.** supabase-js refreshes the access token roughly hourly, minting a **new `iat` while nobody has proved anything** — so an `iat` check is satisfied by a tablet left open on a kitchen table, which is exactly the child this exists to stop. `amr` carries the moment the human authenticated and does not move on refresh; absent `amr` is a refusal. **Reverting to `iat` makes the refreshed-token and no-`amr` cases both pass**, which is the hole.
The page is `/parent/account`, reached only from a small link at the very bottom of `/parent`, with the **export offered above the confirm**; a gate asserts nothing under `/game`, `/menu` or `/shop` links to it.

## ⑤ 🧪 THE GATES, AND THE NINE REDS THAT PAID FOR THEM
`accountDeletion.test.ts` counts **every reachable table before and after**, with the table list DERIVED from the FK graph — a table with no census clause throws rather than being skipped.
⚠️ **The break that changed the design:** my per-account census counted by ownership column (`created_by = A`) and was **BLIND** to a stranded row. Whole-table counts against a second family are what binds — *"public.learners holds 3 rows; family B has 1. 2 row(s) survived, possibly with a nulled owner."* The census alone passed on that build.
Others watched red: `error_events` cleanup removed · re-auth guard removed · guard reverted to `iat` · a new `learner_id` table added (*"is reachable from an account and this census has no clause for it"*) · `DRAFT = false` (kills **`next build`**, not just vitest) · the refund sentence quietly resolved · `[DATE]` put back after resolution · the date drifting between the .md and the page header.
⚠️ **CI caught a defect in my own gate that local green could not:** it compared against `app-terms-of-service.md` while that file was **untracked** — green on one machine, ENOENT everywhere else. The document is committed now. *Local gates green is not the same claim as "this works."*

## ⑥ 🌐 THE MARKETING SITE — MEASURED, WITH POSITIVE CONTROLS
**radlor.com runs NO analytics and sets NO cookie of any kind**, not even strictly necessary. Four pages: 0 off-origin hosts, 0 `Set-Cookie` **headers** (checked at the header, since HttpOnly is invisible to `document.cookie`), 0 storage keys, no `/_vercel/insights`. ⚠️ Both instruments positive-controlled: the same `curl` grep found 3 `Set-Cookie` on google.com, and the same JS found `upload.wikimedia.org` and a 105-char cookie on Wikipedia. So the zeros are measurements.
**The waitlist `service_role` finding is FIXED.** Verified against production, not the repo: `anon` holds **column-level INSERT on `email`, `age_band`, `source` only**, one INSERT policy, no SELECT/UPDATE/DELETE; live `/api/health` says `anon_key_configured: true`. Table is `id, email(citext unique), age_band, source, created_at` — **1 row, 2026-08-31**. ⚠️ **But `supabase/migrations/20260830000000_waitlist.sql` is the repo's only waitlist migration and it says RLS on with NO policies, `revoke all from anon`, and *"Do not add one"* — production has the policy and the grants, applied with no migration file.** The file now states the opposite of production and tells the next reader to delete what the live form depends on.

## ▶ OPEN
1. 🔴 **§8's refund sentence is unwritten and LIVE on the page.** The only open marker that is not a lawyer question. One sentence from the founder closes it.
2. 🔴 **UNANSWERED, ASKED TWICE: was radlor.com's Terms of Use actually reviewed by an attorney?** Another session committed `38588b7 terms: publish as live, reviewed terms — banner off, dated 6 September 2026`, claiming founder confirmation. **It is live now with the banner off and `[DATE]` resolved.** If the review happened, nothing to do. If it did not, unreviewed terms are presented as binding on a public site. Not touched either way — reverting a published legal document is as much the founder's call as publishing it was.
3. 🔴 **Account deletion has never been executed.** The migration is applied (three-way probe: `delete_my_account` → 42501/401 *exists, anon refused*; a nonexistent name → PGRST202/404; `is_chapter_entitled` → 42501/401 as the control). ⚠️ **That is the NEGATIVE half only.** *"Nobody unauthorised can call it"* and *"nobody at all can call it"* are the same green — the M6 trap this repo already has a row for. The founder's throwaway-account test is what proves `authenticated` can execute it, and that the DEFINER owner may `delete from auth.users` at all (if not, the transaction rolls back and nothing is deleted — it fails safe).
4. 🔴 **§11 has not been rewritten around what survives.** [src/core/accountDeletion.ts](src/core/accountDeletion.ts) is the one declaration, rendered into the page and asserted against the running delete: `billing_events` stripped of its owner, Stripe's own copy, and `diagnostic_leads` named as unreachable.
5. ⏭️ **Stripe cancellation is not wired**, and must be before the first live purchase or a deleted account keeps being charged. Harmless today: zero subscriptions exist.
6. ⏭️ **`migrate-prod` is inert** — no `production-db` environment, no `STAGING_PROJECT_REF`, no Supabase secrets — so `promote` ships client code while migrations wait. The client names that state (`PGRST202` → `not_deployed`) and tells the parent to email support instead of showing a shrug.
7. ⏭️ Carried from the archived region-move block: **Sydney is still the rollback and costs ~$10/mo** (the window has long passed); **`SUPABASE_SERVICE_ROLE_KEY` has never once been exercised** on the new project; the **`/menu` 6→2 RPC client half is still uncommitted**; **`entitled_chapters` still has no caller**, so it has never run.
8. 🔴 **Launch blockers, unchanged**: the watched test-mode Stripe purchase · B12 Supabase Pro before any live key · **the app's Terms and Privacy Policy are both still DRAFT** · the free chapter set is a PROPOSAL · nine Dependabot PRs · Vercel Web Analytics off.

> 📊 **2026-09-05 — /admin SHIPPED, AND THE FOUR THINGS IT WAS ASKED TO MEASURE WERE ALL LYING. Then a privilege escalation caught one step before production, a funnel that was not a funnel, and the discovery that CI has never gated anything on this repo.** `tsc` 0 · **1794 passed, 1 skipped** · `next build` 0 · **fifteen commits, all pushed, CI green on `7772729`** · sw v162 → **v163** · four migrations applied to production and verified.

## ① 🔎 THE INVENTORY CAME FIRST, AND FOUR PANELS COULD NOT HAVE BEEN HONEST
Founder's order: inventory before UI. It paid for itself four times — [docs/data-inventory.md](docs/data-inventory.md) is the record.
- **`sessions.started_at` was never a start time.** The RPC never supplied it, so it took the column default `now()` at INSERT while `completed_at` is a CLIENT stamp. Both marked the END: **49 of 49 rows had a NEGATIVE duration** (median −1s). A dashboard subtracting one from the other would have shown a confident plausible number for a quantity never recorded.
- **`diagnostic_sessions` was written only at completion** — all 13 rows have `completed_at = started_at` exactly, so "how many start the check" had **no denominator** and could only ever return 100%.
- **`auth_events` held ONE row against ≥18 real logins** in six weeks.
- **No per-question record exists at all.** The complete prop corpus is `action, ageGroup, at, band, chapter, correct, mastered, wrong`.
⚠️ **Every timestamp in the database is `timestamptz`** — timezone is purely presentation. The real trap is `client_ts` vs `created_at`: they diverge by up to **8.9 days**, and the skew is `created_at > client_ts` in **28 of 28** cases — pure late upload from the offline queue, never a fast clock. `client_ts` is the honest event time.

## ② 🚨 A PRIVILEGE ESCALATION, CAUGHT ONE STEP BEFORE PRODUCTION — FOUNDER'S CATCH
A draft of the gate added `'admin'` to the `user_role` enum and had `admin_assert()` read `profiles.role`. Reproduced against production's verbatim policy and grants:

    policy[ALL] "profiles: own row"  USING auth.uid()=id  WITH CHECK auth.uid()=id
    ACL: authenticated = arwdDxtm
    update public.profiles set role='admin' where id=auth.uid();   -> ACCEPTED

**Every signed-in parent could have granted themselves the dashboard.** ⚠️ **The `with check` constrains WHICH ROW, never WHICH COLUMN** — and the policy is not a bug: `setMyRole()` exists on purpose for the Teacher/Parent picker. **It is a FEATURE that stops being safe the moment a privileged value joins the same column**, which is why reviewing the policy alone would never have found it.
Fixed structurally: `admin_users` is its own table, **RLS on with ZERO policies** (no policy means no row is readable or writable — the absence IS the mechanism), all privileges revoked from client roles, and the migration alters **no enum**, so there is nothing to escalate TO. Verified on prod: `policies=0`, `ACL={postgres,service_role}`, enum still `(parent,learner,teacher)`.
⚠️ **The sweep that follows it**: everything `is_chapter_entitled` trusts has **0 client write policies**. The one live example of the same shape is `profiles.is_internal` — a user can hide their own account from metrics. Recorded, not fixed; it grants nothing.

## ③ ⚠️⚠️ THE FUNNEL WAS NOT A FUNNEL, AND A HAND-COMPUTED FIXTURE COULD NOT SEE IT
Its four steps were **independent predicates**, not nested, so a later step could exceed an earlier one. It did: flagging two internal accounts took production to **9 → 6 → 3 → 4**. Arithmetically impossible, and every "lost here" figure was wrong.
⚠️ **IT SURVIVED THE HAND-COMPUTED FIXTURE — because whoever computed the expected values by hand used the SAME wrong definition the code did.** Both sides inherited the error, so the test could only confirm it. It then survived two more populations by coincidence (11→7→5→5, 10→6→4→4 are both monotonic) and was exposed by an unrelated change.
**The patch for that blind spot is invariants**: a value test says *this input gives that output*; an invariant says *no input may give an output of this shape*. [src/features/admin/invariants.ts](src/features/admin/invariants.ts) holds them once and runs in **both the tests and the browser** — the bug was on screen and nobody was looking. A violating payload now renders a banner naming the invariant and reports server-side.
⚠️ **Two proposed invariants were FALSE and the fix was the code, not the assertion:** `finished <= started` and `rate ∈ [0,1]`. `chapter_open` lives in `learner_events` (**purged at 90 days**); `sessions` are kept for ever, so a completion whose open has aged out gives a rate above 100%. None in production today **only because the oldest event is 78 days old — the first purge is 2026-09-27.** `started` is now OPENED **OR** COMPLETED, true by construction.

## ④ 🚦 CI HAS NEVER GATED ANYTHING ON THIS REPO
`ci / rls-tests` failed on **five consecutive commits** and nobody noticed. Measured: **no branch protection, no required status check, no workflow reading a CI result** — and Vercel builds on push independently, so **all five red commits reached production READY**. A red CI stopped nothing and told nobody.
Fixed with a mechanism, not a resolution: Vercel's Production Branch is **`release`**, and `deploy.yml`'s `promote` job (`needs: ci`) is the only thing that moves it. `red-main.yml` covers **three** cases and names which — CI red, **promote red** (working code silently NOT live, the mirror defect), and **drift** (main >2 commits ahead, the one that hides). All four paths driven by hand before being trusted; the first version of the notifier **could not have fired at all** (`gh` needs `-R` with no checkout), and the drift check's `$(cmd || echo SENTINEL)` was broken because **`gh api` prints its errors to stdout**.

## ⑤ 🧯 THE OTHER SESSION'S WORK WAS DESTROYED AND RECOVERED
Two sessions ran in this repo at once. The other ran `scripts/break-check.sh`, which parks the tree with `git stash --include-untracked` — my uncommitted migration, four pages, a 302-line test and a runbook were swept into a stash and dropped. Recovered from `git fsck --unreachable`, anchored as pushed tags `recovered/menu-rpc-work` and `recovered/admin-dashboard`. ⚠️ **A header note describing this hazard had been written into that file the same morning and the work was destroyed that afternoon.** Written-down care is not a mechanism. `break-check.sh` now runs the break in a **`git worktree`** — the tree you stand in is never touched, so there is no stash to lose.
⚠️ **`src/__tests__/menuRoundTrips.test.ts` is the one unrecovered loss.** Rewrite it with the `/menu` work, not before — see [docs/recovered-menu-rpc-work.patch](docs/recovered-menu-rpc-work.patch).

## ⑥ 📈 WHAT /admin ACTUALLY SAYS TODAY
Aggregate-only by construction (`group by` + aggregates, so a per-child row is not expressible), read-only, no per-user view, no export. Suppression happens **in SQL** so a suppressed number never reaches the browser. From the deployed definitions, with both founder accounts excluded:
**funnel 9 → 6 → 3 → 3** (monotonic), 1 account returned without ever finishing · mean **1.48** chapters/learner, **median 0** · 10 of 21 learners ever completed one.
⚠️ **The completions question is answered: it was onboarding, not failure.** 4 learners created in 7 days by one account, opening chapters and finishing none. Ruled out "failing to record" with a clean discriminator worth keeping — **`practice_complete` fires client-side BEFORE the network call while the `sessions` row is written BY it**, so a completion that happened but failed to sync leaves the event with no row. 4 and 4, newest of each at the identical timestamp.

## ▶ OPEN
1. 🔴 **THE `answer` EVENT AWAITS THE FOUNDER'S APPROVAL — do not wire it first.** Proposed shape: `{ chapter, item, correct, tier, ordinal }`, five keys, no free text, nothing identifying, riding the existing offline queue. ⚠️ **`item` is the hard part, not the shape**: most chapters GENERATE questions, so a stable id must come from the generator's KIND (`op.subtract`), never the drawn numbers. And it is a ~10× rise in event rows, inside the 90-day purge.
2. 🔴 **Two sign-ins (one Google, one email) then read `auth_events`.** Fix #3 shipped: one global `onAuthStateChange` listener replaces three scattered call sites, and a failed write now reaches the error sink. ⚠️ **Both causes had to go** — the swallow AND the OAuth callback's early return, which usually won because supabase-js processes the hash during client construction.
3. 🔴 **Play one chapter** — the first real session duration. `started_at` is applied; nothing has been completed since.
4. 🔴 **Founder-only:** `ADMIN_MIN_COHORT=1` in Vercel (it defaults to 5, which suppresses nearly everything — the threshold is now always shown so it cannot read as broken), Vercel Production Branch → `release` (**the gate is inert until this**), and the rest of the internal-account list.
5. ⏭️ **The rollup (option A)** — id-free, **margins not the cross-product**, suppression at WRITE time. Design in data-inventory.md §3a. The purge cliff is **2026-09-27**, when 520 events (31% of all history) go in one night.
6. ⏭️ `profiles.is_internal` is client-writable — same shape as the escalation, grants nothing.
7. ⏭️ **Storage: no exposure.** Supabase Storage is **empty** (0 buckets, 0 objects). The 4,011 voice clips / 96 MB are in **git**, present in the pushed tree and served by Vercel — three copies, better protected than the database.
8. ⏭️ Ledger repaired: the four filenames are recorded and the synthetic rows are gone. `apply_migration` stamps its own timestamps, so this recurs — one tidy-up row may remain, harmless (push applies files MISSING from the ledger; an extra row is ignored).
9. 🔴 **Launch blockers, unchanged**: the watched test-mode Stripe purchase · B12 Supabase Pro before any live key · **`DRAFT = true` — the privacy policy is still a placeholder, and it publishes a 90-day retention promise the rollup must not contradict** · the free chapter set is a PROPOSAL · **nine Dependabot PRs open** · Vercel Web Analytics off.
10. ⏭️ `backup.yml` still reports success while its dump step is skipped — filed, not fixed. Supabase Pro daily backups are real, so it is not a data-loss risk; it is a green tick that means nothing.


> 🧪 **2026-09-05 — CHATTERBOX TTS (Resemble AI, MIT) EVALUATED IN A SCRATCH VENV. Founder's reason: 6–8 and 9–11 corpora are UNBOUNDED, so whole-line rendering on a per-character API is a subscription, not a project. Nothing installed into this repo; nothing integrated; `voice-generate.mts` untouched. Turbo English rendered five lines with the BUILT-IN voice — our ElevenLabs voice was deliberately NOT cloned, so no provider-terms question sits in the middle of the evaluation. Decision is by ear and is the founder's.**
>
> ⚠️ **THE TIMINGS FROM THIS MACHINE ARE ABOUT THIS MACHINE.** M1, **8 GB**. Measured mid-render:
> **7.60 GB of 9.22 GB swap in use, 11% memory free** — and RTF climbed **16.4 → 35.7 → 41.6** across
> lines 1–3, which is thrashing, not the model. Founder's call, and it is the right one: *"every
> timing number from this machine is about the laptop and none of it informs the decision"*, so Nano
> was dropped rather than measured (it shrinks only T3; the 1,015 MB vocoder is unchanged, so it
> would not escape swap either). **Do not quote these seconds as Chatterbox's speed.**
>
> ⚠️⚠️ **`chatterbox-tts` CRASHES ON IMPORT IN A FRESH VENV WITH A MESSAGE THAT NAMES NOTHING TRUE:**
> `TypeError: 'NoneType' object is not callable` from `perth.PerthImplicitWatermarker()`. The real
> cause is `resemble-perth` importing **`pkg_resources`**, which setuptools removed in 81 — and a
> modern venv ships no setuptools at all. Fix: **`pip install "setuptools<81"`**. Another error
> message that lies about its own cause; the class was `None` because a nested import had failed
> silently. ⚠️ **The watermarker was NOT disabled to get past it** — that changes the output, and an
> evaluation of audio you have altered is not an evaluation.
>
> ⚠️ **LOADED SIZE ≠ DOWNLOAD SIZE. Size a machine from the loaded figure.** Both repos ship a
> **1,007 MB `s3gen.safetensors` the loader never touches** (it uses the meanflow variant):
>
> | | download | actually loaded |
> |---|---|---|
> | Turbo | 3,857 MB | **2,847 MB** (t3 1,826 · s3gen_meanflow 1,015 · ve 5) |
> | Nano | 2,860 MB | **1,850 MB** (t3 **829** · s3gen_meanflow 1,015 · ve 5) |
>
> 🚫 **NANO IS OFF THE TABLE FOR PRODUCTION UNTIL UPSTREAM SHIPS A LOADER.** `chatterbox-tts 0.1.7`
> (latest) has none — `chatterbox.tts_turbo` hardcodes `t3_turbo_v1.safetensors` and Turbo's
> hyper-parameters. A hand-written adapter loads it (the architecture is already in the package;
> four values come off `t3_nano_v1.yaml`), which is fine for an evaluation and is an unsupported path
> against moving upstream code. Founder: revisit if upstream ships one.
>
> 🎯 **THE MEASUREMENT THAT WOULD ACTUALLY DECIDE IT, AND IT IS NOT ON A MAC: rendering cost on a
> RENTED GPU.** Rough shape from the founder: ~20,000 lines at ~3 s each is ~17 hours of audio, which
> at better-than-realtime is single-digit dollars of compute — against the ≥6,061,663 credits (~50
> months) the whole-line remainder costs on ElevenLabs. **Not chased now.** Scratch venv, script and
> the five wavs: `scratchpad/chatterbox/` (session-local, will not survive).

> 🗣️ **2026-09-04/05 — NOTHING MILO SAYS IS CUT OFF BY THE NEXT THING, IN ANY BAND — AND THE AUDIT THAT PROVED IT WAS ONLY HALF DONE THE FIRST TIME.** `tsc` 0 · **1743 passed, 1 skipped** · `next build` 0 · five commits pushed: `0dee8a2` `95db59e` `70ec4ee` `191918e` `2e43ffd` · sw v160 → **v162**.
>
> Founder, across every band: *"voice aane lagti hai aur next chiz aa jaati hai toh woh cut ho jaati
> hai"*. Two mechanisms, each correct-looking in isolation. **`speak()` SUPERSEDES** — right for a
> tap, wrong for every round boundary, where a verdict, praise and the next question land on
> 1300–1800ms timers shorter than any of them takes to say. And **`speakAfterCurrent` could not
> work**: it waited on `_speaking`, which only turns true at the clip's `onStart` — one async
> manifest lookup later — so a round advance calling it in the SAME TICK read "nothing is playing"
> about a line already on its way. It only ever worked on a device with **no clips**, which is why
> every drive here showed it working. Its queue was also one-deep: one callback per waiter meant the
> first line's end released all of them and the last to wake cancelled the rest.
>
> Engine (`useMiloSpeaker.ts`): a real FIFO waiting on IN-FLIGHT, **bounded to two** (a queue is a
> way of running late); `afterSpeech(cb, ceilingMs)`; and `speakPaced`, whose visuals keep their OWN
> timer (a walkthrough hung off `onstart` freezes for ever — shipped once) while each step ends at the
> LATER of its dwell and Milo finishing. The price written down for the cut was never acceptable.
> Full rule in chapter-craft.md §3.
>
> ⚠️⚠️ **THE FIRST AUDIT WAS (b), NOT (a) — TRACED FROM THE SHELLS OUTWARD, NOT ENUMERATED — AND I
> REPORTED IT AS COVERAGE.** Founder caught the sentence. The real enumeration found **141 direct
> emission sites in 35 files plus 23 more reached only through local wrappers** (`say()`, `tell()`),
> of which **35 fired a cancelling verb from a deferred path**. It found two chapters still broken
> while the report said fixed: **BuildingBlocks and BlockYard speak the ROUND'S OWN QUESTION from a
> timer 400ms in**, through `say()`, invisible to any `speak(` grep. Also settled: **the 72 chapter
> ids are not 72 speech surfaces** — `teen/games/*.tsx` build `say:` STRINGS and never call the
> speech layer, so GameShell is the sole emitter for every chapter it backs. That assumption is what
> made the first audit feel complete.
>
> ✅ **Gated, not remembered: `src/__tests__/voiceBoundaryVerb.test.ts`** fails if any file under the
> chapter directories fires a cancelling verb from a deferred path (a `useEffect` body, or a
> scheduler callback) unless it is in an ALLOW list **with a written reason**. Asserted EXACTLY, so a
> new chapter cannot reintroduce it and a stale exception cannot sit there being a rule about
> nothing. It counts local wrappers and carries a **positive control**, because a finder that has
> stopped finding reports every chapter clean. Eleven deferred sites remain, each reasoned.
>
> 🔧 **`scripts/break-check.sh` ported from `video_reviewer`** after a stray `git checkout` reverted a
> fix twice in one session. ⚠️ **It exists in TWO repos with different runners now** (playwright there,
> vitest here) — a fix to one will not reach the other; both CLAUDE.mds say so. Its live-break suite
> paid for itself at once: the exit-5 case came back as 4, because **vitest reports a broken SETUP file
> byte-identically to a broken SOURCE file**, so the reader stopped claiming to tell them apart.
>
> 🎙️ **THE AUDIO ACCOUNTING THE FOUNDER ASKED FOR, measured against the live manifest — do not re-derive:**
>
> | | corpus | rendered | left | note |
> |---|---|---|---|---|
> | 3–5 | 1,411 | 927 | **484** (17k chars) | ⭐ **a REAL total** — saturated at 12k draws (1.00×) |
> | 6–8 | 4,006 | 57 | **3,949** (170k chars) | a floor; corpus grows 2.80× at 12k |
> | 9–11 | 7,904 | 2,075 | **5,829** (397k chars) | a floor; grows 2.02× |
>
> **Static is DONE** (210/210 Stevie + 55/55 Teddy + 56/56 6–8 walkthrough + 69/69 9–11 teach + 374/374
> 9–11 miss). ⚠️ But the static corpus is built from CHAPTER surfaces only, so **the app's own screens
> were never counted**: 76 lines / 2,148 chars at **0 rendered** (72 × `"Let's play {chapter}!"`, two
> celebration lines, shop, voice picker), and that is a FLOOR — shop item lines, world labels and
> MasteryState headlines are still uncounted. Needed in BOTH voices (menu obeys `BAND_VOICE`), so
> ~152 clips, ~2k–4k credits. They are not silent today: `clipOnly` is only flipped by GameShell, so
> outside a chapter a miss falls back to browser speech.
>
> **Explanation: walkthrough yes, re-teach no.** `teach` 126/126 (3–5), 69/69 (9–11), 522/535 (12–18 —
> the 13 missing are all the guided coach line, ~1k credits). `reteach` **93/577 · 26/4,289 ·
> 82/10,912** — ~15,577 lines, ~925k chars, and that is the FLOOR.
>
> 🛠️ **`_voiceCorpus68.test.ts` never counted the explanation at all** — it drove `beat.say` and
> stopped, so 6–8 read as complete when it had never been measured. Now RENDERS `beat.Reteach` with a
> stubbed speaker: no app change, no template copy to drift. ⚠️ The obvious fix (extract each
> chapter's lines into a pure function) was built for four chapters and **thrown away** — the
> component pairs `lines[i]` with `steps[i]`, so splitting them lets words and visuals drift apart
> silently in twelve chapters to make a reporting script easier. First run: three chapters yielded
> NOTHING (`ResizeObserver is not defined`; jsdom has none, FitBox/FitSlot need one) and a `catch {}`
> made that identical to "says nothing" — **a quarter of the band missing from a run reporting
> success**. A hole is now a RED.
>
> ⚠️⚠️ **TWO SESSIONS RAN IN THIS ONE WORKING TREE AND ONE `git reset --hard` DESTROYED THE OTHER'S
> UNCOMMITTED WORK.** Recovered via `git fsck --unreachable` (my own `git add` had written the blobs);
> `break-check.sh` was then MERGED rather than overwritten, since the other session had edited it too.
> **Use `git worktree` for the second session.** Watch for `src/__tests__/adminMetrics.test.ts` —
> untracked and missing its vitest imports, so it reds the suite in the working tree while a clean
> checkout of `main` is green.
>
> ▶ **OPEN from this work:** ① **nothing has been verified BY EAR** — every check is a mock or a
> network request. ② 6–8's `scored` half still reaches only 9 of 12 chapters (four return an empty
> `prompt`); the re-teach half reaches all twelve. ③ the 76+ app-chrome lines are unrendered and
> uncounted past that floor. ④ `OrderDesk`/`LevelRun` still have no clips and are in no corpus.

> 🔊 **2026-09-04 — THE VOICE WAS ON THE CDN THE WHOLE TIME AND NOBODY WAS ASKING FOR IT. THREE SILENT DEFECTS IN ONE CHAIN, ALL DEPLOYED AND VERIFIED FROM THE RUNNING SITE — THEN THE FIRST HONEST ACCOUNTING OF WHAT THE REST COSTS, AND THE STITCHER THAT WAS GOING TO PAY FOR IT FAILED ITS LISTENING TEST.** `tsc` 0 · **1710 passed, 1 skipped by design** · `next build` 0 · **NINE commits, all pushed and live**: `590232b` `9eb78bd` `33bb2cf` `aec3ee0` `31437c2` `cce03b2` `9385aa1` `dbe7508` `fada6d8` · sw v153 → **v160**. **EVERY STATIC LINE IN THE APP NOW HAS A CLIP, IN BOTH VOICES.**
## ① 🔇 THE CHAIN, AND WHY EVERY LINK REPORTED SUCCESS
The founder: *"3–5 aur 17–18 mein voice hi naii aa rahi"*, then *"12–14, 15–16 Chrome mein theek
hai, 17–18 nahi"*, then *"Safari mein Stevie aati hai, Chrome mein kuch nahi"*. Three different
faults wearing one symptom, each measured rather than reasoned about:
1. **Nothing was deployed.** Prod's Stevie manifest held **433** keys (0 of 70 sampled 17–18
   lines) and `/audio/XjGY…/manifest.json` answered **404** — the 3–5 voice folder did not exist
   there. 1,109 clips and the band routing had sat uncommitted since the previous session.
2. **`sw.js` had no `/audio/` branch**, so the manifest fell to the app-pages case —
   stale-while-revalidate — and a device that had loaded the app kept the old key list. Measured
   live: `caches.match(manifest)` in `milo-shell-v154` → **true**.
3. **The 30-day header.** `/audio/:path*` served `max-age=2592000, stale-while-revalidate=31536000`,
   right for a clip and wrong for the index. Read out of the founder's own Chrome: plain `fetch()`
   → **433 keys**, `fetch(…{cache:'no-cache'})` → **670**, with the new service worker already
   active. That is why 12–14/15–16 played (their keys were in the stale copy) and 17–18 did not.

⚠️ **THE WHOLE CLASS IS "A STALE INDEX IS NOT AN ERROR, IT IS A SHORTER LIST."** Every dropped key
is a clean miss, every miss falls back to browser speech, and Chrome ships no usable voice on most
machines — so the app, the CDN, the build and every log reported success while a child heard
silence. **Anything that GATES a lookup must revalidate even when the things it gates may not.**
Both halves shipped: the header (`max-age=0, must-revalidate` on `manifest.json`/`fragments.json`,
placed AFTER the general rule because the last match wins — above it, it is inert, which is the
version I wrote first and `assetCacheHeaders.test.ts` caught), and `cache: 'no-cache'` on the two
fetches, because a header cannot reach a browser that already holds the 30-day copy.

## ② ⚠️ CLIP-ONLY WITHOUT A STITCHER IS SILENCE, NOT FALLBACK — AND THE NOTE IS AT THE SWITCH
`setClipOnly` does not mean "prefer clips": it suppresses the browser fallback, so a line with no
clip is **silent**, and nothing logs it. 12–14 survives it ONLY because its templated lines are
stitched from `frag/`. The next person to reason *"12–14 works fine, turn it on for 3–5"* ships a
child a silent chapter. Written on `setClipOnly` itself and on the GameShell effect that flips it —
where somebody stands when they widen that band check — not in a doc.

## ③ 💸 THE MISS LINE WAS BEING RECORDED TEN TIMES OVER
GameShell spoke `It was X. <encouragement>` as ONE utterance, so the clip layer saw one line and
every reveal needed recording once per encouragement — and there are ten. **3,640 lines / 114,506
chars as one utterance against 374 / ~4,600 split**, for audio nobody can tell apart. Now two
utterances, and 9–11's whole wrong-answer bucket is **374/374** for the price of a rounding error.
⚠️ `speakSteps`, never `speak` + `speakAfterCurrent`: `_speaking` only turns true at the clip's
`onStart`, so a synchronous second call takes the else branch and `_doSpeak` **cancels** the line
still loading — the first half vanishes on exactly the machines that have clips.
⚠️ And `voice-generate.mts` could lose a whole run to one bad packet: an uncaught `fetch` rejection
(`ETIMEDOUT`, twice) threw out of the render loop and killed the process **before the manifest
write**, leaving hundreds of clips on disk and unlisted — ① in miniature. One retry, then skip.

## ④ 📊 WHAT IS RENDERED, AND WHAT THE REST COSTS
Live on prod, verified from the running deployment: Stevie **2,912 keys** (was 433 this morning),
Teddy **927**. 9–11 `teach` 69/69 · `miss` 374/374 · `scored` 1590/3172 · `reteach` 0. **All 265
number-free lines across every band are rendered, plus 6–8's 56-line walkthrough.**
Rendered cheapest-first *within* each value bucket — measured, that buys 1,361 lines against 719.
⚠️ **The API key carried its own 40,000 cap** while the plan showed 121,022, so a run 401'd at a
third of the month. Raised; check it before concluding a month is spent.
⚠️ **Characters are NOT credits at a fixed ratio.** ~1:1 on long lines, **~0.6:1** on short ones
(15,705 predicted, 7,775 billed). Size a run, then let the API stop it; do not plan to the count.

**The whole-line remainder, re-measured at 12,000 draws instead of 1,500 — and it MOVED:**

| band | corpus @1.5k | @12k | growth | rendered | remaining credits |
|---|---|---|---|---|---|
| 3–5 | 1,411 | 1,411 | **1.00×** | 927 | **26,088** — a real total |
| 12–14 | 1,666 | 1,687 | **1.01×** | — | **112,683** — a real total |
| 6–8 | 2,602 | 7,294 | 2.80× | 56 | ≥424,073 |
| 9–11 | 7,904 | 15,969 | 2.02× | 1,946 | ≥1,152,964 |
| 15–16 | 11,858 | 28,467 | 2.40× | — | ≥2,560,133 |
| 17–18 | 8,638 | 28,620 | 3.31× | — | ≥1,785,722 |
| **total** | | | | | **≥6,061,663 — 50 months** |

**≥2,343,335 at 1,500 draws became ≥6,061,663 at 12,000.** Only 3–5 and 12–14 converge; their
vocabularies are small. For the other four, whole-line voice is not a project with a price, it is a
**subscription** — and every new chapter adds to it.
⚠️ **THE EXPENSIVE PART IS NOT THE EXPLANATION — THE FOUNDER'S READ, AND IT HELD.** The walkthrough
is static and was already almost entirely recorded (15–16 and 17–18 sat at **zero** remaining,
because those lines are literals the grep corpus took months ago). What costs is the **re-teach**,
which `explainBeats(r)` rebuilds from each round's numbers: 9–11 has 554 number-free re-teach lines
against **6,265** numbered; 15–16 has 6 against **14,134**.
⚠️⚠️ **AND A CORRECTION THAT TRAVELLED TWO MESSAGES BEFORE IT WAS CHECKED.** I put the static
remainder at **113,063** credits by testing for a DIGIT. In 3–5 and 6–8 the numbers are spelled as
WORDS — *"four and seven. Which sign is right?"* — so **98%** of that band's "no digit" lines were
per-round lines the test could not see. Counting number-words as numbers took the static remainder
to **16,009** and 6–8's share from 259,510 to **1,391**. Same class as the "nearly flat" wording
below: **a proxy quietly standing in for the property it approximates.**

## ⑤ 🔬 THE MEASUREMENT THE WHOLE STITCHER DECISION RESTS ON — AND ITS HONEST WORDING
Founder's challenge: *"our questions aren't limited, they're adaptive — did generating audio for a
limited set break that?"* No: the wiring is one-way (the chapter builds its line, the player hashes
it, a miss falls back) and the corpus is built by DRIVING the real generators. But the second half
of his question was right and cost me a claim. Escalating the sweep:

| chapter | whole lines 1.5k→24k | templates | literal runs |
|---|---|---|---|
| goingViral 15–16 | 821 → **1,299** | **13** flat | **34** flat |
| coinTray 9–11 | 920 → **1,653** | 391 → **425 flat at 6k** | 434 |
| packingShed 9–11 | 1,839 → **2,501** | 706 → **848 flat** | 819 |
| walkHome 17–18 | 1,562 → **9,123** ↑ | 301 → **513** ↑ | 121 → 137 |

Pushed the worst case further, runs only — **1.5k/6k/24k/48k/96k → 125, 130, 138, 140, 144**
(+4.0%, +6.2%, +1.4%, +2.9%). Over **64× the draws: lines 17×, templates 1.9×, runs 1.15×**.
⚠️ **So the right words are "bounded in practice, still creeping" — NOT "saturated".** I first
wrote *"nearly flat"*, and the founder's correction is the rule worth keeping: **a word like
"nearly flat" does the work of "saturated" without having measured it.** Quote a run count with the
draw count it was measured at. The argument survives its own worst case — walkHome's NEW templates
are new combinations of runs it already has — but it is a working ceiling (~150 runs), not a proof.
⚠️ **And every whole-line figure in this repo is now a FLOOR and must travel as `>=`** — the
drivers sample 1,500 draws, which is not a generator's space. Written into all three corpus
drivers' headers so the next reader cannot pick the number up as a total.

## ▶ OPEN
1. 🔴 **THE STITCHER FAILED ITS LISTENING TEST, AND THAT IS THE OPEN QUESTION.** One real 12–14
   line was assembled from its six existing fragments and put beside the whole-line recording of
   the same sentence: *"Fly the drone to the halfway point between 2, 2 and 4, 6."* Founder, on
   the pair: *"B natural lagg raha hai."* Measured alongside: stitched ran **7.84s against 5.65s**;
   silence-trimming each fragment took it to 6.38s (+14%), and the residue is **delivery, not
   padding** — a lone `"2"` is 0.85s after trimming because it was recorded as its own sentence.
   Playing it through the real `<audio>` + `playbackRate` + `preservesPitch` path added a further
   **~120ms per join** that no trimming can reach (`/tmp/abtest/rate-test.html`, the harness).
   ⚠️ Note what this rules out: **the founder's own fallback — "record whole templates, stitch only
   the numbers" — IS what was tested.** The run *"Fly the drone to the halfway point between"* is a
   single recording. So that option is not a way out; it is the thing that failed.
   The one cheap experiment left is **prosody-in-context**: fragments were recorded in isolation, so
   each ends on a falling tone. Re-render the number clips with list intonation (`"2,"` `"4,"` `"6."`)
   — about 20 credits — and listen again. If that fails, whole-line is the answer and the cost above
   is the cost.
2. ⏭️ **The best remaining spend is 3–5** (539 lines, ~26k, and the band is measured saturated so it
   never asks again). 26,072 credits are left this month; billing has run ~60% of the estimate.
3. 🔴 **6–8 has no per-round clips at all** (only its 56 walkthrough lines). 4 of its 12 chapters
   still cannot be enumerated from the beat surface: `placeValue`, `additionTo100`,
   `subtractionTo100` and `money` return an empty `prompt` and speak from their own components.
4. ⏭️ 15–16 and 17–18 now play a clip for the encouragement and browser speech for `It was X.` —
   mixed within one breath. Their reveal halves need the 37 configs (exported this session) driven.
5. 🕒 **Nightly E2E has still never gone green on a SCHEDULED run against a main containing the fix.**
   `gh run list --workflow "Nightly E2E"`, look for `schedule` + `success` at or after `22d75fb`.
6. 🔴 **The hull silence is still unmeasured** — `docs/voice-check-for-tester.md` ready to forward.
7. ⏭️ The `counting` case of `ready-bar.spec.ts` is still flaky.
8. 🔴 **Launch blockers, unchanged**: the watched test-mode Stripe purchase is deferred with a hard
   deadline BEFORE STAGE 4 ([docs/billing-stage-3.md](docs/billing-stage-3.md) §0) · B12 Supabase Pro
   before any live key · **`DRAFT = true` — the privacy policy and ToS are still placeholders, and you
   cannot charge a parent under one** · the free chapter set is still a PROPOSAL · **nine Dependabot
   PRs open and untriaged (#28–#47)**, do not merge as a batch · Vercel Web Analytics still off · two
   prose-drift notes (the `error_events` fkey comment, the anon-INSERT comments).
9. ⏭️ **Nobody has HEARD any of the rendered clips on a real device** beyond the A/B pair above.
   Every other check is a network request plus a patched `play()`.
10. ⏭️ **`OrderDesk` and `LevelRun` — the two 9–11 storybook chapters — have no clips** and are in no
   corpus: they run `SkillBeat`, not GameShell.
11. ⏭️ The ElevenLabs **MCP** still holds the rotated key; measure the key with `curl`, never it.
12. ⏭️ Uncommitted and untouched all session: the `/menu` 6→2 RPC half (`menu/page.tsx`, the three
   repositories) — deliberately kept out of the voice deploys.


_Older sessions (2026-06-15 → **2026-09-03**, including ✅ **the region-move CUTOVER day** (eleven dispatches, ten red, every red a real defect in the workflow — and the auth trigger a schema dump does not carry), moved 2026-09-06 — ⚠️ its still-live items (the Sydney rollback, `SUPABASE_SERVICE_ROLE_KEY` never exercised, the missing `production-db` environment, the uncommitted /menu RPC half, `entitled_chapters` with no caller) are carried in the ⚖️ 2026-09-06 block's ▶ OPEN item 7; including 🚀 **the Pro / region-move GO day** (the one-job workflow that diffs the same query on both databases) and 🌏 **the load-measurement day** (the database was in Sydney while every user was in the US, and the nightly backup had never run), both moved 2026-09-05 — ⚠️ their still-live items are carried in the ✅ region-move block above and in the 📊 2026-09-05 block's ▶ OPEN (`backup.yml` green while skipping, the `production-db` environment, and the two Supabase secrets); including 🎙️ **the first voice-rendering session** (17–18 got its 161 clips, 3–5 got Teddy Twinkle and 872 of 1,411 lines), moved 2026-09-04 the same day it was superseded — ⚠️ everything it left uncommitted was committed and deployed in the 🔊 block above, and its still-live items (nobody has heard it on a device, OrderDesk/LevelRun have no clips, the MCP key) are carried there; including 🌙 **the nightly-E2E day** (12 runs red since the day it was created, the AR escape hatch half off a 640×320 screen, and the CI-only text-metric difference), moved 2026-09-04 — ⚠️ its still-live items (the scheduled-run green, the hull silence, the `counting` flake, and every launch blocker in its ▶ OPEN) are carried in the 🔊 2026-09-04 block above; including 🗒️ **the second tester pass** (Great job!, the hull silence diary, the typed directions line in all 72 chapters), moved 2026-09-04 — ⚠️ its still-live items (the hull silence, the `counting` flake) are carried in the 🌙 block's ▶ OPEN, and its "PR #69 is open" line was already stale when archived (merged 2026-08-31 as `9a4bcc3`); including 📏🎓 **the student-review days** (the run resumes, Ready everywhere, praise to 6–8, the number-tag overhang) and 🐇 **the line behind mother** (even spacing for one species, and the tautology guarding the approved picture), all moved 2026-09-03 — ⚠️ their still-live items (recorded clips for 3–11, the `counting` flake in `ready-bar.spec.ts`) are already carried in the 🌙 block's ▶ OPEN and the 🎙️ 2026-09-03/04 block; including 🔒 **Stage 3** (the chapter gate and the screens — a lock that names what is behind it, and a paywall built inert but tested refusing), moved 2026-08-31 — ⚠️ its still-live items (the deferred watched purchase, B12, `DRAFT = true`, the free-set pick, the nine Dependabot PRs, Vercel Analytics, the prose drift) were lifted into the 🌙 block's ▶ OPEN rather than archived with it; including 💳 **Stage 2b** (the price ladder, checkout and the webhook — and the finding I published without measuring it), 🧾 **Stage 2a** (the seat materialiser) and 🚪 **the funnel day** (the check became optional, the demo route, and the `onComplete` corpse), all moved 2026-08-30 — ⚠️ their still-live items (B12, `DRAFT = true`, the nine Dependabot PRs, Vercel Analytics, the anon-INSERT prose drift) were checked against the 🔒 Stage 3 block first and are all recorded there; including 💳 **the billing-schema apply day** (applied to production and completely inert, and the rollback capture that caught a migration silently reverting a security fix), moved 2026-08-28 — ⚠️ its still-live items (B12, the nine untriaged Dependabot PRs, and RLS gating the RECORD rather than chapter CONTENT) were checked against the newer blocks first and are all still recorded there; including 🧾💳 **the Stage-1 billing schema day** (RLS, entitlement, the guard at all three write paths), moved 2026-08-27; including 🧾 **the ledger-repair day** (58 repo migrations relabelled to the versions production recorded, `perf_advisors` applied, and the dry-run computed rather than credentialled), moved 2026-08-25 — ⚠️ its one still-live item (the anon-INSERT prose drift) was lifted into the current ▶ OPEN rather than archived with it; including 🔐 **the road-to-a-paywall day** (the RLS suite that had never run once, three privacy gaps between the published copy and the system, the anon INSERT closed, and the security regression caught four minutes after shipping), moved 2026-08-25 — ⚠️ its still-live blockers (B1/B2 `DRAFT = true`) were lifted into the current ▶ OPEN rather than archived with it; including 🚦 **the production-readiness day** (three workflows green while doing nothing, the dead error sink, eight chapters unstartable on a landscape phone), moved 2026-08-25; including 🔬 the seven-learner-models day (moved 2026-08-24), 🕸️ the skill-graph sensitivity audit and 🎯 the diagnostic's 96–98% rebuild, both moved 2026-08-24; plus 🇺🇸 the US-spelling / SEO / region-migration day, 🔗 the social-handles day, ❓ the question-quality sweep and 🎚️ the adaptive-loop day, all moved 2026-08-22) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — moved 2026-08-24 — 🚚 **The Packing Shed + The Minibus Run** (the two 9–11 chapters that closed the multiplication/division content hole) and 🎯 **the diagnostic rebuild** (26–34% → 81–87%, the answer-surface fix and the first accuracy gate), and — moved 2026-08-23 — 📐 **the tester's-four-bugs / responsiveness-sweep / `useOnceGuard` day** (the StrictMode ref guard that froze ten chapters' demos in dev only, 683 → 2 sub-44px tap targets, and 20/20 storybook coverage), and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
