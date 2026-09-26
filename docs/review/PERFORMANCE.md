# R4 — Performance review (PERF-)

Reviewer: performance. Tree: `w-review` at `06cee602` (clean apart from `docs/legal/LOOP-STATE.md`, which another
reviewer modified; I did not touch it). Everything below was measured on a **production build** (`npm run build`,
Next 16.3.5 / Turbopack, log in `review-scratch/perf/build.log`) served by `npx next start -p 3207`. The server was
stopped at the end and port 3207 was checked free.

## How to read this

- **The lab profile** is a mid-range phone: CPU 4× slowdown, DevTools "Slow 4G" (562.5 ms RTT, 1.44 Mbit/s down,
  675 kbit/s up), 390×844 at DPR 2, a cold cache, a fresh browser context per run, and the service worker blocked.
  Every number is the **median of 5 runs**. The server was on localhost, so server time is ~0 and the network numbers
  are pure transfer plus round trips. Absolute seconds are lab values. Compare them with each other, not with field data.
- **Signed-in screens:** `.env.local` points Supabase at a fake `http://127.0.0.1:9`, so no real data loads. I measured
  what works signed out: `/auth`, `/demo`, `/help`, `/modules` (it renders signed out), the topic path
  `/lesson?module=…` and a lesson `/lesson?id=…`. For signed-in screens I **counted requests** against an in-test fake
  backend. That fake is copied from `e2e/short-sessions.spec.ts`: every Supabase call is answered locally and every
  other host resolves to NOTFOUND. It needed `bypassCSP`, because production's CSP only allows `https://*.supabase.co`.
  Loading, paint and response times of signed-in screens with real data were **not** measured (see *Could not verify*).
- `/` redirects signed-out visitors to `https://radlor.com/radlic`, which is a public GET and allowed by the rules.
  It is a different site, so it is out of scope here.
- Evidence labels follow RULES.md: **Measured**, **Reproduced** or **Suspected**.

## Measured baseline

### First-load JS per route (gzip, from `.next/diagnostics/route-bundle-stats.json`)

| route | chunks | raw KB | **gzip KB** |
|---|---|---|---|
| /ui-preview (404 in prod) | 20 | 4,192 | 1,108 |
| **/parent** | 18 | 4,104 | **1,080** |
| **/lesson** | 17 | 3,984 | **1,046** |
| **/practice** | 16 | 3,943 | **1,032** |
| /menu | 16 | 3,064 | 793 |
| **/modules** | 16 | 3,040 | **785** |
| /lesson-preview (404 in prod) | 14 | 2,999 | 772 |
| /story, /consent/*, /auth, /game, /play, /demo, /admin/*, … | 11–14 | 710–800 | 205–234 |

The two largest chunks, `17ow74mztl0s6.js` (2,228 KB raw / **548 KB gz**) and `2-jyocnh7thue.js` (919 KB / **252 KB
gz**), each contain all **282** topic ids. Together they are the lesson catalogue: every module's screens, chalk
drawings, practice ladders and voice rows, imported eagerly by `src/features/lessons/content/index.ts`. By source
share (gzip of the source dirs): lesson text ≈ 34 %, ladders ≈ 30 %, chalk ≈ 27 %, voice rows ≈ 9 %.

⚠️ The `ponytail:` comment in `content/index.ts:2-3` says the chunk is "~1.2 MB (≈275 KB gzipped), measured
2026-09-14". The same content now measures **~800 KB gzipped**, about 3× that figure. The comment is a present-tense
measurement written into prose, the class CLAUDE.md warns about. Its own trigger ("if first-load time on slow phones
shows up") has now fired: see PERF-01.

### Lab vitals, mid-range phone, median of 5 (`review-scratch/perf/vitals.out`)

| route | FCP ms | **LCP ms** | TBT* ms | blocking from nav ms | longest task ms | tap (INP sample) ms | transfer KB | of which JS KB | LCP element |
|---|---|---|---|---|---|---|---|---|---|
| /help (SSR text) | 2,660 | **2,660** | 391 | 391 | 425 | — | 1,321 | 1,111 | `<p>` |
| /demo | 4,820 | **4,820** | 0 | 17 | 67 | — | 448 | 247 | `<p>` |
| /auth | 4,792 | **5,944** | 0 | 15 | 65 | 40 | 566 | 249 | logo PNG |
| /modules | 8,404 | **8,404** | 0 | 320 | 351 | 104 | 1,410 | 1,190 | `<h1>` |
| /lesson?module=g5m1 | 9,928 | **9,928** | 0 | 392 | 423 | 64 | 1,375 | 1,093 | `<h1>` |
| /lesson?id=g3m1-t1 | 9,980 | **10,796** | 0 | 382 | 419 | 32 | 1,738 | 1,071 | backdrop webp |
| /lesson?id=g5m1-t1 | 10,000 | **10,808** | 0 | 394 | 419 | 40 | 1,798 | 1,071 | backdrop webp |

\*TBT is counted from FCP, the Lighthouse definition. On the child screens it reads **0**, which is misleading: those
pages paint nothing until hydration, so the ~400 ms hydration task runs *before* FCP. "Blocking from nav" is the same
sum counted from navigation start. The five runs were tight: LCP spread ≤ 60 ms on every route (`lcpAll` in the
output file).

**What it says:** on a mid-range phone on Slow 4G, a child opening a lesson sees a blank screen for **~10 s**, and the
topic list takes **~8.4 s**. The sign-in page takes 5.9 s. The difference is almost entirely the ~800 KB gzip
lesson catalogue (1,071 KB of JS vs 249 KB). Taps are fast once the page is up: 32–104 ms, well under the 200 ms
"good" INP line.

### Bytes by type on a cold load (`review-scratch/perf/breakdown.out`, unthrottled, Resource Timing)

- `/demo`: 427 KB = JS 234 + **fonts 148 (7 woff2)** + CSS 37 + document 4.
- `/help`: 1,295 KB, of which JS is **1,095**. The route itself is 205 KB gz, so the other ~890 KB is the lesson
  catalogue arriving through **`<Link>` prefetch** of `/parent` (the two "dashboard" links at `src/app/help/page.tsx:67,106`).
- `/lesson?id=g5m1-t1`: 1,675 KB = JS 1,088 + **20 voice clips 363 KB** (prefetched on mount) + fonts 148 + CSS 37 + backdrop 35.

### Lesson screen render cost (`review-scratch/perf/lesson-render*.out`)

I counted React commits through the DevTools global hook, which production React still calls. The positive control:
the hook saw 9 commits during mount, the largest with 45 components. Main-thread time comes from CDP
`Performance.getMetrics`. Over 40 s of lesson g5m1-t1 (Screens 2→4 with beats, clips playing):

| CPU | commits | commits/s | main-thread task ms | script ms | layout ms | style ms | heap MB |
|---|---|---|---|---|---|---|---|
| 1× | 9 | 0.2 | 1,874 (4.7 %) | 32 | 99 | 241 | 16.8 |
| 4× | 9 | 0.2 | 1,376 (3.4 %) | 47 | 89 | 111 | 16.7 |

**No timer drives whole-tree re-renders.** There is about one commit per beat (`setShown` in
`LessonPlayer.tsx:148-150`). The clip word-sweep `setInterval` (`voiceClipPlayer.ts:220`) only runs when a caller
passes `onWord`, and the beat path does not pass it. The per-commit "components rendered" figure (4) comes from the
PerformedWork fiber flag. Treat it as a lower bound of uncertain accuracy; the commit count and CPU time are the
reliable numbers. **Nothing to fix here.**

### Memory (`review-scratch/perf/leak.out`)

I ran 12 cycles of: open topic → "Let's see" → 6 s of beats and clips → "← Topics", all through in-app navigation.
After each cycle I forced a GC and took readings:

- heap 16.86 → 17.69 MB, about +0.08 MB per cycle and flattening (caches, not growth);
- live `setInterval`s 1 → 1, live `setTimeout`s 1 → 1;
- net window listeners 15 → 15, DOM nodes 496 → 496, `<audio>` elements 0.

The positive control is that the counters see the lesson's own timer inside the lesson (2 timeouts vs 1 at rest).
**No leak found.** The code review agrees: every `addEventListener`/`ResizeObserver`/interval in `src/` outside the
hidden chapters has a matching cleanup (list in PERF-11's note), and `DataRights.tsx:113` revokes its object URL.
PERF-11 is the one exception I found.

### Audio

- **Fetch path** (`src/infra/voiceClipPlayer.ts`): one `manifest.json` per voice per page load, `cache: 'no-cache'`
  (a revalidation, so an unchanged file comes back 304). Josh's manifest is **69.6 KB raw / 31.9 KB gzip**; Stevie is
  33.4/17.2 KB and Teddy 40.3/18.8 KB. On lesson mount, `prefetchClips` (`LessonPlayer.tsx:82`) starts every clip of
  the lesson at once. That was **20 parallel requests / 363 KB** for g5m1-t1 (27–28 in 40 s including playback), and
  the service worker keeps them cache-first.
- Josh has 6,638 clips, **123.8 MB**, median 16.8 KB each.
- **Does the prefetch hurt first paint?** I measured it: with every `.mp3` aborted, lesson LCP was 10,992 ms vs
  10,808 ms with them, i.e. no improvement (`vitals-blockaudio.out`). The prefetch is not an LCP problem. Whether it
  delays the *first spoken line* on a slow link is **Suspected**, not measured (see *Could not verify*).

### Service worker (`public/sw.js`)

- **Precache on install:** 8 URLs, `/menu /game /parent /auth /profile /shop /offline.html /manifest.json`, about 18 KB
  HTML each. **`/profile` and `/shop` answer 404** (Measured with curl on the prod build). Those pages were deleted,
  so each install makes two wasted requests (PERF-12).
- **Runtime:** `/_next/static/*` is cache-first and never evicted until the VERSION changes. `/audio/*.mp3`, `/assets/*`,
  images and fonts are cache-first. Pages are network-first.
- **Worst case on one device** (a child who plays every topic between two SW bumps): Josh clips **≈124 MB** + lesson
  art ≈2 MB + one build's JS ≈4–5 MB raw, so **≈130 MB of Cache Storage**. The same clips can also sit in the browser
  HTTP cache for 30 days (`next.config.ts:184-185`, `max-age=2592000`). That is read from code and file sizes, not
  measured on a device. Realistic usage is much lower: one lesson ≈ 0.4 MB of clips.

### Supabase requests per screen (fake backend, `review-scratch/perf/count-requests.out`)

| screen | requests | breakdown |
|---|---|---|
| /parent, 1 child | **13** | auth/user ×3, profiles ×2, parent_pin_status, get_parent_dashboard, learner_invites, parental_consents, **per child: lesson_progress ×2, point_events, game_wallet** |
| /parent, 3 children | **21** | same, per-child part ×3 |
| /parent, 10 children | **49** | = 9 + 4 × 10 |
| /parent as **teacher, 30 students** | **72** | auth/user ×5, … , **lesson_progress ×30, game_wallet ×30** |
| /modules (child session) | 6 | auth/user, learner_access ×2, profiles, lesson_progress, game_wallet |
| /lesson (child session, before any answer) | 0 | — |
| /parent/account | 4 | — |

The per-child loop is at `src/app/parent/page.tsx:196-207`. `lesson_progress` is read **twice per child**: once inside
`pullLessonProgress` (`src/infra/storage/lessonSync.ts:91`) and again by `getLessonRows` at `parent/page.tsx:204`.

### Indexes (read from `supabase/migrations/`)

Every hot read has an index: `lesson_progress` PK `(learner_id, lesson_id)`; `point_events_learner_created`;
`point_events_once` (partial, for `reason='mastered'`); `learner_access (parent_id)` + unique
`(learner_id, parent_id)`; `grades_created_by_idx`; `exercise_results_class_idx`;
`learner_events_learner_created_idx`; `parental_consents_*`. The one unindexed filter is `learner_invites.invited_email`
(`invites.ts:89`). That table is tiny, so a seq scan is correct at our size, and even at 10k families it is not worth
an index. Production plans need Rafi: **`docs/review/sql/perf-explain.sql`** (Q1–Q8 with how to read each result).
Nothing was run remotely.

## Findings, ranked by user-visible impact at our size

### PERF-01 — every child screen downloads all 36 modules before it can paint (High, Measured)
`src/features/lessons/content/index.ts:1-80` imports every grade's lessons eagerly. `modules.ts:7` re-exports them as
`MODULES`, and that is imported by `/lesson`, `/practice`, `/modules`, `/parent`, `LessonsTab`, `ClassPage` and the
class screens. Result: ~800 KB gzip of content (548 + 252 KB chunks) is in first-load JS on 7 routes.

- **Before (measured):** /lesson 1,046 KB gz first-load JS → LCP **10.8 s**; /modules 785 KB gz (1,190 KB transferred) →
  LCP **8.4 s**; /parent 1,080 KB gz.
- **Proposal:** keep a small catalogue (module id, title, topic ids and titles) in the eager bundle, and load each
  module's lessons, chalk, ladder and voice rows with `import()` per module. Next/Turbopack splits dynamic imports per
  file. Readers that need every module's *bodies* (the parent's lesson chooser search runs on titles only) keep using
  the catalogue. This does not change what anyone sees.
- **Expected after:** /lesson first-load ≈ 250 KB gz + one module (800/36 ≈ 20–40 KB), so ~270–290 KB.
  /auth ships 249 KB JS and has LCP 5.9 s on the same profile, so the lesson LCP should be **≈6–6.5 s** (from 10.8)
  and /modules **≈5 s** (from 8.4).
- **Re-measure:** `node review-scratch/perf/route-sizes.mjs` after `npm run build`, then
  `node review-scratch/perf/vitals.mjs 5 '/lesson?id=g5m1-t1' /modules`.
- Update or delete the stale `ponytail:` comment in the same PR.

### PERF-02 — child screens server-render nothing, so first paint waits for all JS (Medium, Measured)
`/lesson` (`src/app/lesson/page.tsx:29-30`, `if (!mounted) return null`) and `/modules` return `null` until mounted,
because progress lives in client storage. The prerendered HTML is ~4 KB with no visible content.
- **Before:** FCP 9.9–10.0 s on /lesson and 8.4 s on /modules, vs **2.66 s** on /help, which server-renders its text.
  ~400 ms of hydration blocking happens before FCP, which is why Lighthouse-style TBT reads 0.
- **Proposal:** render the static frame (top bar, title, an empty card) on the server and fill it after mount. After
  PERF-01 this is the remaining gap.
- **Expected after:** FCP ≈ 2.7–3.5 s (like /help). LCP stays tied to the backdrop and JS (≈ PERF-01's number).
- **Re-measure:** `vitals.mjs`, FCP column.

### PERF-03 — the parent dashboard fans out 4 queries per child, and reads `lesson_progress` twice (Medium, Measured)
`src/app/parent/page.tsx:196-207`.
- **Before:** 9 + 4·N requests (13 / 21 / 49 for 1 / 3 / 10 children). A teacher with 30 students makes **72** (the
  loop runs `pullLessonProgress` + `getWallet` per student). `get_parent_dashboard` is one call but only returns the
  learner list plus three legacy tables emptied on 2026-09-17 (`learner_stats`, `learner_progress`, `sessions`,
  migration `20260905130000`:106-133). It saves nothing today.
- **User-visible now:** small. The dashboard does not await these, it redraws when they land, and Supabase is HTTP/2.
  **At ~10k families** it is 4 DB round trips per child per dashboard open, plus a full-ledger `sum()` per child
  (PERF-06).
- **Proposal (S, do first):** `pullLessonProgress` already fetched the rows. Return them and pass them to
  `buildReport` instead of calling `getLessonRows` again. Parent: 4 → 3 per child (3 children: 21 → 18).
- **Proposal (M, later):** have one invoker RPC return, per child, the lesson rows, balance and 30-day points. That
  replaces the legacy fields of `get_parent_dashboard`, and /parent drops to ~7 requests whatever N is. It needs a
  migration and a client that tolerates both shapes (CLAUDE.md expand/contract). ⚠️ The function must stay
  **SECURITY INVOKER** like the current one; any `SECURITY DEFINER` is a security change.
- **Re-measure:** `node review-scratch/perf/count-requests.mjs`.

### PERF-04 — /help (and anything linking `/parent`) prefetches the whole lesson catalogue (Low, Measured)
`src/app/help/page.tsx:67,106` use `<Link href="/parent">`, and production viewport-prefetch pulls /parent's 1,080 KB
gz bundle.
- **Before:** /help transfers **1,295 KB** (its own route is 205 KB gz) and shows **391 ms** blocking at 4× CPU.
- **After PERF-01** this mostly disappears. Alone, `prefetch={false}` on those two links gives /help ≈ 430 KB
  transferred and blocking ≈ 20 ms (the /demo profile).
- **Re-measure:** `breakdown.mjs /help`, then `vitals.mjs 5 /help`.

### PERF-05 — the sign-in LCP is a 103 KB logo drawn 56 px tall (Low, Measured)
`src/app/auth/page.tsx:232` and `src/features/dashboard/DashNav.tsx:13` use `/brand/radlic-logo-640.png`: 640×167 RGBA,
105,620 B.
- **Before:** /auth LCP **5.94 s**, and the LCP element is this image.
- **Proposal:** re-encode it. The file name and pixels stay the same, it is a palette PNG. With sharp at quality 90 it
  measured **26.7 KB** (webp q80 30 KB). Check it by eye before shipping.
- **Expected:** ~77 KB less on the critical path, ≈ **0.4 s** earlier at 180 KB/s, so LCP ≈ 5.5 s.
- **Re-measure:** `vitals.mjs 5 /auth`.

### PERF-06 — `game_wallet()` sums a child's whole lifetime ledger on every call (Low, Suspected)
Migration `20260917112109`: `'balance', (select coalesce(sum(points), 0) from public.point_events where learner_id = p_learner)`.
It is indexed (`point_events_learner_created`), and a ledger of a few thousand rows is sub-millisecond. **Not worth
changing at our size.** Watch it with `perf-explain.sql` Q4/Q8. Revisit only if p95 rows per child passes ~50k or
Q4 takes more than ~20 ms.

### PERF-07 — the service worker throws away immutable voice clips at every SW bump (Low, Suspected)
`public/sw.js:4` names `ASSETS_CACHE` with `VERSION`, and `activate` (`:22-29`) deletes every `milo-*` cache that does
not end with the current VERSION. `sw.js` changed in **217 commits** (git log), about **5 a day** over 19–26 Sep.
The clips are content-addressed (the filename is a hash of the line), so they never go stale, yet each bump deletes
the device's offline copy.
- The browser HTTP cache (30 days) will usually re-serve them without the network, so the real cost is lost offline
  copies and duplicate disk use, not bandwidth.
- **Proposal:** give `/audio/*.mp3` a version-independent cache name, and let `activate` skip it.
- **Re-measure:** on a device, `caches.keys()` before and after a bump.

### PERF-08 — 160 MB of Stevie and Teddy clips ship with every deploy; new-flow lessons do not play them (Low, Suspected)
`public/audio/IvUJKFyjVb5hItY9dJAT` (Stevie, 75 MB, 3,527 files) and `XjGYkUkzth8BPs29fmcV` (Teddy, 85 MB, 3,847 files).
`lessonVoice()` (`src/infra/storage/voicePref.ts:41-44`) returns Josh for all 36 modules. Stevie and Teddy remain
reachable only through the hidden legacy chapters and non-lesson speech (`voiceNow()` → `BAND_VOICE` / the default
`VOICES[0]`), for example mixed practice. There, a hit on an old clip plays a *different voice* from the lesson.
- **Not user-visible as speed.** It is deployment weight (public/ = 342 MB per deploy); handoff 🔐 records Vercel
  storage having reached 60 GB against a 10 GB plan.
- Deleting content is **Rafi's call**. The kg2 branch also uses Josh.

### PERF-09 — `/parent` makes 3 (teacher: 5) auth-server round trips per load (Low, Measured)
`getReceivedInvites`, `getMyRole` and `getMyClasses` each call `supabase.auth.getUser()`, which is a network call.
`loadAll` already holds the session (`parent/page.tsx:143`). They run in parallel, so it is about one extra RTT on the
critical path. Leave the choice of `getUser` vs `getSession` to the security reviewer: `getUser` re-validates the
token, and RLS validates it anyway.

### PERF-10 — lesson clip prefetch fires ~20 parallel downloads at mount (Low, Measured/Suspected)
Measured: 20 requests / 363 KB for g5m1-t1, and **no effect on LCP** (10.81 s with them vs 10.99 s with every mp3
aborted). Suspected: on a slow link the first spoken line competes with the other 19. **Won't fix without a
measurement** of time-to-first-audio, which I did not take.

### PERF-11 — speech keep-alive interval reassigned without clearing (Low, Suspected)
`src/infra/useMiloSpeaker.ts:303` does `_keepalive = setInterval(…)` in `u.onstart` without clearing a previous one.
The sibling at `:787` clears first. It only leaks if a second utterance starts while the first is still flagged as
speaking, because `_setSpeaking(false)` clears it at `:119`. The leak check did not catch it: clip playback, not
browser TTS, was the path under test. The fix is one line, copied from `:787`.
*(Cleanup verified for: `useOfflineSync.tsx:58-80,113-139`, `Helpers.tsx:164-175`, `LessonList.tsx:19,40`,
`ScratchPad.tsx:84-90`, `Diagrams.tsx:59`, `modules/page.tsx:53-57`, `useViewport.ts:39-42`, `DataRights.tsx:113`.
Module-level singletons that are never removed by design: `voiceClipPlayer.ts:105`, `lastError.ts:56-59`,
`analytics.ts:107-108`.)*

### PERF-12 — the SW precaches two deleted pages (Low, Measured)
`public/sw.js:10` lists `/profile` and `/shop`, and both answer **404** on the prod build. `cache.add` rejects and the
rejection is swallowed, so the only cost is 2 wasted requests per install. Remove them the next time sw.js is bumped
anyway.

## Measured non-findings (so nobody re-does them)

- Lesson render cost: ~1 commit per beat, 3.4–4.7 % main thread at 1×/4× CPU. No timer re-renders the tree.
- Tap latency (INP samples): 32–104 ms medians across auth, modules, topic path and lesson.
- Leaks over 12 lesson open/leave cycles: none (heap flat, timers/listeners/DOM nodes constant; positive control
  included).
- Clip prefetch vs LCP: no effect.
- Indexes: present for every hot client read. `learner_invites.invited_email` has none, which is correct at this size.
- Fonts: 148 KB (7 woff2) on every page, preloaded on purpose (`layout.tsx:36-52`). Not proposed for change.

## Could not verify

- Signed-in screens with **real** data (the /parent paint time, the Performance tab), because the backend is fake.
  Request *counts* were measured, response times were not.
- Real devices and real networks: all numbers are Chromium lab emulation. No iPhone/Safari run.
- Time from tap to the first spoken line on a slow link (PERF-10).
- Production query plans and table sizes: `docs/review/sql/perf-explain.sql` needs Rafi to run it.
- Actual Cache Storage use on a child's device (PERF-07's 130 MB is a worst case computed from file sizes).
- The PERF-01 "after" numbers are estimates anchored on /auth's measured profile. No prototype split was built.

## Scratch artefacts (`review-scratch/perf/`)

Start the server first: `npm run build && npx next start -p 3207` from the repo root, and stop it afterwards.

| file | what | run |
|---|---|---|
| `route-sizes.mjs` | first-load JS per route, raw + gzip, largest chunks | `node review-scratch/perf/route-sizes.mjs` (no server) |
| `vitals.mjs` | FCP/LCP/TBT/blocking/tap on the mid-phone profile, median of N | `node review-scratch/perf/vitals.mjs 5 [routes…]`; `BLOCK_AUDIO=1` aborts clips |
| `breakdown.mjs` | cold-load bytes by type + top 10 | `node review-scratch/perf/breakdown.mjs /help '/lesson?id=g5m1-t1'` |
| `count-requests.mjs` | Supabase requests per signed-in screen, fake backend, parent 1/3/10 children, teacher 30 | `node review-scratch/perf/count-requests.mjs` |
| `lesson-render.mjs` | React commits + main-thread ms while a lesson plays | `node review-scratch/perf/lesson-render.mjs g5m1-t1 40 4` |
| `leak.mjs` | open/leave a lesson N times, heap/timers/listeners/DOM after GC | `node review-scratch/perf/leak.mjs 12` |
| `discover.mjs` | what each route shows signed out + screenshots | `node review-scratch/perf/discover.mjs` |
| `*.out`, `build.log`, `shot-*.png` | the outputs quoted above | — |
| `../sql/perf-explain.sql` | EXPLAIN (ANALYZE, BUFFERS) for the hot reads, for Rafi | Supabase SQL editor, rolled back |

## Findings table

| ID | title | area | severity | evidence | effort | when | bucket | files |
|---|---|---|---|---|---|---|---|---|
| PERF-01 | All 36 modules (≈800 KB gz) in first-load JS of every child screen; lesson LCP 10.8 s, topic list 8.4 s on a mid phone | performance / bundle | High | Measured | M | fix now: the most visible slowness in the product; no behaviour change | own | src/features/lessons/content/index.ts, src/features/lessons/modules.ts, src/app/lesson/page.tsx, src/app/modules/page.tsx, src/app/practice/page.tsx, src/app/parent/page.tsx, src/features/dashboard/LessonsTab.tsx, src/features/dashboard/ClassPage.tsx, src/features/classes/* |
| PERF-02 | Child screens render nothing on the server, so first paint = hydration (FCP 10 s vs 2.7 s on an SSR page) | performance / rendering | Medium | Measured | M | after beta: after PERF-01 | own | src/app/lesson/page.tsx, src/app/modules/page.tsx |
| PERF-03 | /parent does 9 + 4 queries per child (teacher with 30 students: 72); lesson_progress read twice per child; dashboard RPC returns only emptied legacy tables | performance / data | Medium | Measured | S (dedupe) / M (one RPC) | dedupe fix now; RPC after beta: needs a migration and a SECURITY INVOKER check | own | src/app/parent/page.tsx, src/infra/storage/lessonSync.ts, src/data/repositories/points.ts, src/data/repositories/progress.ts, supabase/migrations/20260905130000_activity_time_is_completed_at.sql |
| PERF-04 | /help prefetches /parent's 1 MB bundle via `<Link>` (1,295 KB transferred, 391 ms blocking) | performance / bundle | Low | Measured | S | later: solved by PERF-01 | own | src/app/help/page.tsx |
| PERF-05 | /auth LCP is a 103 KB PNG shown 56 px tall; a 27 KB re-encode saves ≈0.4 s | performance / images | Low | Measured | S | after beta | own | public/brand/radlic-logo-640.png |
| PERF-06 | game_wallet() sums the whole lifetime ledger per call | performance / database | Low | Suspected | S | won't fix now: indexed and sub-ms at our size; watch with perf-explain.sql Q4/Q8 | own | supabase/migrations/20260917112109_lesson_progress_and_points.sql |
| PERF-07 | SW deletes content-addressed voice clips at every VERSION bump (~5 bumps a day) | performance / offline | Low | Suspected | S | after beta | own | public/sw.js |
| PERF-08 | 160 MB of Stevie/Teddy clips in every deploy; new-flow lessons play Josh only | deploy weight | Low | Suspected | S | later: deleting content is Rafi's call | rafi | public/audio/IvUJKFyjVb5hItY9dJAT, public/audio/XjGYkUkzth8BPs29fmcV, src/infra/storage/voicePref.ts |
| PERF-09 | /parent makes 3 (teacher 5) auth getUser round trips per load | performance / data | Low | Measured | S | later: security reviewer should decide getUser vs getSession | own | src/data/repositories/invites.ts, src/data/repositories/profile.ts, src/data/repositories/grades.ts |
| PERF-10 | Lesson mount prefetches ~20 clips at once (363 KB); no LCP effect; first-line delay unmeasured | performance / audio | Low | Measured (LCP) / Suspected (first line) | S | won't fix without a time-to-first-audio measurement | own | src/features/lessons/LessonPlayer.tsx, src/infra/voiceClipPlayer.ts |
| PERF-11 | Speech keep-alive setInterval reassigned without clearing | memory | Low | Suspected | S | after beta: one line | own | src/infra/useMiloSpeaker.ts |
| PERF-12 | SW precaches deleted /profile and /shop (404) | performance / offline | Low | Measured | S | later: with the next sw bump | own | public/sw.js |
