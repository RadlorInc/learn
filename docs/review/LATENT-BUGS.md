# Latent bugs — R3 production-debugging sweep

Reviewer task R3, 2026-09-26, tree `deep-review` @ `06cee602`. Read-only: no tracked file edited, no production
touched. Reproductions live in `review-scratch/bugs/` (git-excluded) and run with:

```bash
cd /Users/mrk/milo_react/w-review
npx vitest run --config review-scratch/bugs/vitest.config.mts review-scratch/bugs/          # all of them
npx vitest run --config review-scratch/bugs/vitest.config.mts review-scratch/bugs/<file>    # one
```

The last full run is saved in `review-scratch/bugs/RED-OUTPUT.txt`: **18 tests, 11 red, 7 green.** All 11 reds are
`AssertionError`s from the test's own assertion (`grep -c ^AssertionError` = 11, and there are no other error lines). The
7 greens are the **positive controls**, one or two per file. Each one shows the harness can see the good outcome
(delivery, a stored level, a granted consent, a manifest hit), so a red means the defect is real and not a blind
harness. The database reproductions run on the repo's real schema: `src/__tests__/_schema.ts` loads the baseline plus
every migration into pglite, the same fixture the suite's own RLS tests use.

The evidence labels follow RULES.md: **Reproduced** = a failing test is in `review-scratch/bugs/`; **Suspected** = read
from code and not demonstrated.

---

## BUG-01 — a child's queued answers and points are DROPPED when the queue is flushed by anyone but the child's own account (High, Reproduced)

**What the code does.**
- The upload queue is one device-wide key: `milo-lesson-sync-queue` (`src/infra/storage/lessonSync.ts:22`). Each item
  carries a `learnerId`, but the queue is not scoped to the signed-in account.
- `send()` stops only on `'retry'` and deletes the item on `'ok'` **or `'drop'`** (`lessonSync.ts:78-80`).
- `points.ts:send` maps errors through `classifySyncError`. That function lists **`42501` as non-retryable → `'drop'`**
  (`src/data/repositories/_shared.ts:36-42`). `recordPracticeRun` does the same (`points.ts:60`).
- `signOut()` does not flush or clear the queue (`src/data/repositories/profile.ts:38-54`). It navigates to `/auth`.
  `<OfflineBanner/>` is mounted in the root layout inside `StorageGate` (`src/app/layout.tsx:143-148`), so on `/auth`
  kv is already hydrated. Its mount effect then calls `doFlush()` (`src/infra/useOfflineSync.tsx:122`).

**Root cause.** "This account may not write this row" is treated as "this row can never be written". The first is true
for *this session*. The second is false: the row belongs to a different account, or to a session that has ended.

**Why it fails.** With no session, the RPC goes out with the anon key. Anon has no EXECUTE on `record_lesson_progress`, so
the call returns 42501. The migration author measured this on production (`20260917112109_lesson_progress_and_points.sql:8-9`).
With another account signed in, the function body raises `forbidden` / 42501 (`:98-99`). Either way the item is deleted:
the child's answers, the progress in it, and the points (`p_event`) it would have earned.

**Edge cases.**
- (a) A family tablet: the child practises offline, the parent signs out before the Wi-Fi returns.
- (b) Shared classroom devices with child username logins (🏫 classes): child A's unsent items are flushed under child B.
- (c) A session whose refresh token has expired while offline: supabase-js falls back to the anon key. This path is
  **Suspected**, not driven.
- (d) The same drop applies to `save_practice_run` resume points.

**Reproduced:** `review-scratch/bugs/lessonSyncQueue.test.ts`. The control is green: under the owning account the answer
is delivered and the queue empties. Red, signed out: `expected +0 to be 1`, the offline answer is dropped. Red, other
account signed in: the answer is dropped.

**Proposed fix.** Only send items whose `learnerId` the current session can write, and leave the others queued. Where
the session is known, key the queue by auth user id. Treat `42501` on this path as `'retry'` when there is no session. On
`signOut`, flush first with a short timeout, and keep what did not send. Do not clear it: it belongs to that account and
uploads the next time that account signs in on this device.
Calibration: rare at tens of families. With child logins on shared school devices at ~10k families, it becomes routine.
**Fix now.**

## BUG-02 — two devices on one child: the stale one rolls the account back, and the climb back is paid again (High, Reproduced)

**What the code does.** `record_lesson_progress` (`supabase/migrations/20260917112109_lesson_progress_and_points.sql`):
- It upserts `level`, `streak` and `mastered` **as sent** (`:109-112`). Only `done` is monotonic (`coalesce(p_done,false) or old.done`).
- It inserts a `level_up` +3 whenever `p_level > old.level` (`:121-124`), with no once-only key.

The client sends the device's **current** standing (`lessonSync.ts:75-77`). `pullLessonProgress` skips any topic that
has an upload still queued (`lessonSync.ts:94-97`), so a device with pending items never refreshes that topic before it
sends.

**Root cause.** Last-write-wins on a value two devices change independently. There is no version or sequence on the
write, and "level went up" is judged against whatever the last writer left.

**Why it fails.**
1. Device A (home tablet) takes the child to level 2 and mastered.
2. Device B (a school Chromebook opened earlier, or offline) answers from its stale level 0. The account now says level 0,
   not mastered, and the parent's "Topics mastered" drops.
3. On the next open, `pullLessonProgress` writes that regression back onto device A (`:102`).
4. When A answers again at level 2, the database pays a third `level_up`.

**Edge cases.** An offline device that reconnects days later is the worst case. The `mastered` bonus is protected by
`point_events_once`, so only `level_up` is re-minted. A level drop on one device after `worked` is **by design**
(`adaptive.ts:71`) and is not this bug.

**Reproduced:** `review-scratch/bugs/crossDeviceProgress.test.ts`, on the real schema as the parent's `authenticated`
role. The control is green: one device climbing 0→2 is paid 2 level-ups and stored at level 2. Red:
`afterB_level 0 (expected 2), afterB_mastered false (expected true), levelUpsPaid 3 (expected 2)`.

**Proposed fix.** New migration, no client change needed.
- Make `mastered` sticky (`old.mastered or p_mastered`), as `done` already is.
- Accept a lower `level` only from a write that carries the device's last-seen server `updated_at` (or a per-topic
  sequence) equal to the stored one. Otherwise keep `greatest`.
- Give `level_up` a once-per-(learner, lesson, level) key, so re-reaching a level after a stale overwrite pays nothing.

Whether a demotion from `worked` should ever un-master on the account is a product decision (**rafi**). The sticky
`mastered` part matches what the parent screens already imply. `/play` spends no points today (#232), so the extra points
are harmless now. The regression of the child's record is not. **Fix now** (migration, Rafi applies).

## BUG-03 — a consent grant that fails after B3 was scheduled leaves a live "Yesterday you gave permission" email, and blocks the parent's retry for 24 hours (High, Reproduced against a Resend stand-in)

**What the code does.** `/api/consent/respond` `grant` (`src/app/api/consent/respond/route.ts:74-83`):
1. It computes `when = Date.now() + delay` and schedules B3 with idempotency key `consent-<id>-b3` and
   `scheduled_at = when`.
2. It then calls `consent_grant`.
3. If `consent_grant` **throws** (Supabase blip, 5xx, timeout), control jumps to the outer `catch` → 502 (`:88-94`), and
   the B3 just scheduled is **not cancelled**. The route cancels only when the RPC *returns* a non-granted status (`:82`).
   The consent row is still `pending`, so `trg_consent_queue_b3_cancel` (which fires only on a move out of `granted`)
   never sees it.

**Root cause.** Two things.
- The only compensating action is on the success path.
- The idempotency payload is not stable: `scheduled_at` is recomputed on every click. Resend documents that the same key
  with a *different payload* returns **409 `invalid_idempotent_request`**, and keys are kept **24 hours**. Read on
  2026-09-26 at resend.com/docs/dashboard/emails/idempotency-keys.

**Why it fails.**
- The parent sees "Something went wrong" (`ConsentLink.tsx:34`, status `error`), reloads, and ticks again.
- `sendEmail` now gets 409 → throws → 502, and it will keep doing so for 24 hours. For a day the parent cannot give
  consent at all.
- Meanwhile the first B3 is still scheduled and arrives saying "Yesterday you gave permission" for a consent that was
  never granted.
- After 24 hours a retry succeeds and schedules a second B3, so the parent eventually gets two.

**Edge cases.** A concurrent double-click gets `409 concurrent_idempotent_requests` on the second request. That shows an
error screen although the first request grants, which is a cosmetic version of the same bug.

**Reproduced:** `review-scratch/bugs/consentGrantRetry.test.ts`. It runs the real route, `sendEmail` and `rpc`. The
network is a stand-in that implements Resend's documented idempotency semantics, and `consent_grant` fails once with 503.
- Red: `liveB3AfterFailedGrant: 1 (expected 0)`, and `secondClick: {error:'failed'}` (expected `granted`).
- Control, green: with the clock frozen (same `scheduled_at` both times) Resend returns the first B3 and the retry
  grants. This isolates the recomputed `scheduled_at` as the cause of the 409.

**Proposed fix.**
- Make the B3 payload deterministic per consent: derive `scheduled_at` from something stored, not `Date.now()`, or
  persist the first `when`.
- Wrap `consent_grant` so that on a throw the route cancels the B3 it scheduled (best-effort), then returns 502.
- Add a test with a 409-returning stand-in.

Consent path. **Fix now, before more beta families.** Bucket **own**: no wording or flow change.

## BUG-04 — a consent refusal (P0C01) on a progress upload is retried forever and blocks every later upload on the device, silently (Medium, Reproduced; latent until a `reconsent_required` notice ships)

**What the code does.**
- `P0C01` is not in `NON_RETRYABLE_CODES` (`_shared.ts:36-42`), and `points.ts:38-39` falls through to
  `classifySyncError` → `'retry'`.
- The queue stops at the first `'retry'` (`lessonSync.ts:78`), whoever that item belongs to.
- The banner says "N updates waiting to sync…" (`useOfflineSync.tsx:172`) and gives no reason.

**Root cause.** The consent gate's error contract (`src/infra/consentError.ts`) is honoured in `analytics.ts` and not
in the progress queue.

**Why it fails.** When would `lesson_progress` raise P0C01?
- The day a notice version is marked `reconsent_required`. `consent_is_current` then fails the UPDATE branch, as
  `20260924100000_consent_once.sql:175-186` shows for learners, and the same gate guards `lesson_progress` (asserted in
  `20260925100000_practice_run.sql:91-93`). notice-v7 is already being prepared on `learner-grade`.
- Any consent-state edge case.

From that point, every answer by every child on the device queues behind the first refused item. Nothing reaches the
account, nothing tells the parent why, and after 2,000 items the oldest are dropped (`lessonSync.ts:25`).

**Reproduced:** `lessonSyncQueue.test.ts`. Red: kidB's answer is never sent while kidA's refused item sits at the head.

**Proposed fix.**
- Recognise `isConsentRefusal`. Keep the item: it becomes acceptable once the parent re-consents, so do not drop it.
- Skip past it to other learners' items instead of stopping the whole queue. Per-learner head-of-line is enough.
- Raise a visible "a parent needs to re-confirm permission" state. The wording is **rafi**.

**Before notice-v7 ships.**

## BUG-05 — one failed voice-manifest fetch silences the recorded voice for the rest of the session (Medium, Reproduced)

**What the code does.** `loadManifest` memoises the promise per voice (`src/infra/voiceClipPlayer.ts:90-101`), including
the `.catch(() => new Set())` result (`:97`) and a non-OK response (`r.ok ? … : []`). Only a `milo-voice-change` event
clears it (`:104-106`).

**Why it fails.**
- A manifest request fails on first use: a blip, offline with no cached copy (the service worker's `networkFirst` returns
  503 when it has nothing, `public/sw.js:183`), or the first lesson opened offline.
- From then on every line in that voice is "not in the manifest", so the lesson speaks in browser TTS. Handoff 🔊 notes
  that TTS on a Chrome with no installed voice is silence.
- This lasts until a full reload. It is the same class as the 2026-09-04 stale-manifest bug, from the other side.

**Reproduced:** `clientRaces.test.ts`. Red: after the network recovers, the manifest is never fetched again and the clip is
never requested.

**Proposed fix.** Do not memoise a failure. Delete the map entry on catch or non-OK, so the next line retries, with a
small back-off. Clearing `_manifests` on `online` also helps.

## BUG-06 — analytics: events tracked during an in-flight flush are deleted unsent, and one refused event blocks every later event (Low, Reproduced)

**What the code does.**
- `flushEvents` reads the queue, awaits the upsert, then calls `kv.remove(QUEUE_KEY)` (`src/infra/analytics.ts:74,80`).
  That wipes anything `track()` appended while the upsert was in flight.
- A non-consent error keeps the **whole batch** and retries it every 60 s (`:79`). One event the database refuses — for
  example 42501, queued for a child of the previous account on this device — fails the entire upsert on every attempt,
  until 500 newer events push it out.

**Reproduced:** `clientRaces.test.ts`. The control is green. Red 1: `answer_2` is never sent. Red 2: `new_account_event`
is never sent.

**Proposed fix.** Remove only the sent `client_id`s: re-read and filter, as `lessonSync.ts:80` already does. Drop, or set
aside, rows refused with 42501/23xxx instead of retrying the batch.
Calibration: funnel analytics only, no child harm. **After beta.**

## BUG-07 — "could not read your role" is returned as "you have no role yet" (High, auth path; Reproduced for the conflation, the UI chain Suspected)

**What the code does.** `getMyRole()` returns `data?.role ?? null` and ignores `error` (`src/data/repositories/profile.ts:13-22`).
A network or RLS failure therefore reads exactly like a brand-new account.

Downstream:
- `/auth` sends a `null` role to `homeForRole(null)` → `/parent` (`src/app/auth/page.tsx:139-140`,
  `profile.ts:35-36`). A child whose profile read blipped lands on the adult dashboard.
- `/parent` shows the one-time **RolePicker** for `role === null` (`src/app/parent/page.tsx:412`). Picking a role
  writes it immediately (`:280-283`) over the real one: a parent can become `teacher`, and a child's login can become
  `parent`, because `profiles: own row` allows it (CLAUDE.md records that this policy is deliberate).
- `ParentPinGate` treats a null role as "adult" and offers **Create a PIN** (`src/shared/ui/ParentPinGate.tsx:37-43`).

**Reproduced:** `clientRaces.test.ts`. The control is green (a readable profile → `learner`). Red: a failed read returns
`null`. The UI chain is **Suspected**: not driven in a browser.

**Proposed fix.** Return a distinct `'unknown'`, or throw, on `error`. Callers then show "couldn't check, try again"
rather than the picker or redirect. `setMyRole` should refuse to overwrite a non-null role; the database can enforce
this with a guard on `role` changes away from `learner`/`parent`/`teacher` once set (a migration, **own**). This is the
"I cannot see ≠ nothing to see" rule in CLAUDE.md. **Fix now.**

## BUG-08 — a boot where IndexedDB hangs writes to localStorage, and the next normal boot never sees it (Medium, Reproduced)

**What the code does.**
- A 2.5 s timer flips `kv` into localStorage mode for that boot (`src/infra/storage/kv.ts:68`), then returns before the
  migration step (`:80`).
- On the next boot IndexedDB opens and `mem` is read from IndexedDB only.
- The one-time localStorage migration runs only once per device (`MIGRATED_FLAG`), and only for
  `MIGRATE_PREFIXES = ['milo-profile','milo-last-played','milo_offline_queue']` (`:24`). The live queue key
  `milo-lesson-sync-queue` is not in that list.

**Why it fails.** Everything the fallback session wrote is stranded in localStorage: queued uploads, standings,
resume runs, lesson-done flags. Signed-in progress that did upload comes back from the account. Offline items and
signed-out/demo state are lost. The reverse is also true: during the fallback session all IndexedDB data, including an
existing queue, is invisible and is not flushed.

**Reproduced:** `kvFallbackOrphan.test.ts`, with a minimal in-memory IndexedDB stand-in that hangs for one boot. The
control is green (a normal boot round-trips the queue). Red: the queued answer is `null` on the next boot.

**Proposed fix.** When a boot in `idb` mode finds localStorage keys written in fallback mode, merge them. Mark fallback
writes with a flag so merges are cheap. For the queue, union by item `id`. **After beta.**

## BUG-09 — consent can be granted on an address that was never confirmed, and the nightly prune then deletes the granted consent record (High, DB half Reproduced; the entry path Suspected)

**What the code does.**
- `/auth/confirm` sends a parent with a consent token straight to `/consent/respond` when `verifyOtp` fails with any
  status, **including an expired confirmation link** (`src/app/auth/confirm/page.tsx:44-49`). The header comment says so
  deliberately (`:13-15`).
- `consent_grant` does not check that the parent's address is confirmed (`20260924100000_consent_once.sql:329-…`).
- `prune_unconfirmed_users()` deletes auth users that are unconfirmed and older than 3 days, and have no learners
  (`20260923180100_prune_unconfirmed_users.sql:40-43`). `parental_consents` cascades from `auth.users` (`:11-12`).

**Why it fails.**
1. A parent opens the one-email B0 after Supabase's Email OTP expiry, and ticks the box. The consent is **granted** and B3
   is scheduled.
2. The address is still unconfirmed, so sign-in fails ("Email not confirmed").
3. If they give up, on night 3 the account is deleted, and with it the granted consent: a COPPA record, destroyed by an
   unattended job. The `trg_consent_queue_b3_cancel` trigger does queue the B3 on that DELETE, so the B3 itself is
   handled.

**Edge cases.** The "already used" case in the comment (a second click after a successful confirm) is fine. Only
*expired* matters. Its likelihood depends on the project's **Email OTP Expiration** setting, a dashboard value this
review cannot read. Hosted Supabase commonly ships 1 hour, and the prune migration itself notes that "people do check
email the next day".

**Reproduced (database half):** `unconfirmedGrant.test.ts`. Control, green: a confirmed parent's granted consent
survives the prune. Red: an unconfirmed parent is `granted`, and after the prune the record list is `[]`.
**Needs Rafi to run:** `docs/review/sql/bugs-unconfirmed-granted.sql`. It tells us whether this has already happened
and includes a positive-control column. **BLOCKED:** the OTP expiry value, which Rafi needs to read in the dashboard.

**Proposed fix.**
- **own:** `prune_unconfirmed_users` must never delete an account that holds a granted (or withdrawn) consent. Add
  `and not exists (select 1 from parental_consents …)`.
- **rafi (flow):** on the expired branch, re-issue the confirmation (the sign-up route already re-sends for an
  unconfirmed address) and do not grant until the address is confirmed, or make `consent_grant` require
  `email_confirmed_at`.

**Fix now.**

## BUG-10 — "Check your connection" shown when the cause is consent, permissions or an expired session (Medium, Suspected)

**What the code does.**
- `correctLearner` returns `'error'` for any error and for 0 rows (`src/data/repositories/learners.ts:142-146`). The
  child page then says "Could not save. Check your connection and try again." (`src/features/dashboard/ChildPage.tsx:104`).
  The actual causes are the consent gate (P0C01, e.g. after a `reconsent_required` notice), a `viewer` parent (RLS, 0
  rows), or an expired session. This is the parent's legal **right to correct**, and the message sends them to debug
  their Wi-Fi.
- `getPinStatus` maps every non-PGRST202 error to `'error'` → "Check your connection" (`src/data/repositories/parentPin.ts:23`,
  `ParentPinGate.tsx:42`), including an expired token.
- `/auth`: after a **successful** sign-in, an exception in `getMyRole()`/`enterAsChild()` falls into the catch that says
  "Couldn't connect" (`src/app/auth/page.tsx:139-147`). The user is signed in and stuck on `/auth` with a network error.

**Proposed fix.** Classify once: network, auth expired (sign in again), consent (P0C01, re-confirm permission), not
allowed (42501 / 0 rows), not ready (PGRST202). Map each to its own message. The classifier is **own**; the new wording
is **rafi**. **After beta**, except P0C01, which should land before notice-v7.

## BUG-11 — the service worker deletes the content-addressed voice-clip cache on every version bump (Low, Suspected)

`activate` deletes every `milo-*` cache whose name does not end in the new VERSION, and that includes `milo-assets-*`
(`public/sw.js:22-29`). Clip mp3s are content-addressed and meant to be kept forever (`sw.js:100-117`). Every sw bump,
several a week (v199 → v235 in 10 days), re-downloads every clip and image a child had. A child who goes offline after an
update has no audio for lessons already played. **Fix:** keep `ASSETS_CACHE` unversioned, or copy it forward, and version
only shell/static. **After beta.**

## BUG-12 — related SW offline gaps (Low, Suspected)

- The offline fallback matches the cache by exact URL including the query (`sw.js:147`), so `/lesson?id=…` and the RSC
  `?_rsc=` payloads work offline only for URLs visited verbatim before.
- `/modules` and `/lesson` are not in `APP_PAGES` (`sw.js:10`), while deleted routes (`/shop`, `/profile`) are.
- `sw-register.js` posts `CACHE_URLS`, which nothing handles (already in handoff 🔁 5).

The banner nonetheless promises "progress saves when reconnected". Worth a decision rather than a fix: is offline a
promised feature? (**rafi**)

## BUG-13 — the game-time "day" is UTC for every family that never saved settings (Low, Suspected; latent — `/play` spends no points since #232)

`game_wallet` defaults `time_zone := 'UTC'` when there is no `game_settings` row (`20260917112109…sql:169`). The daily
limit then resets at 5 pm PT / 8 pm ET. `set_game_settings` stores the browser zone of whoever saved last. **Fix
before game time returns:** store the zone when the child is created, or send it with `start_game_time`.

## BUG-14 — Performance's week and "mastered on" dates use upload time, not answer time (Low, Suspected)

`point_events.created_at` defaults to `now()` at insert (`20260917112109…sql:56`), and uploads can be days late (offline
queue, BUG-01/08). `buildReport` buckets by `created_at` (`src/features/lessons/progressReport.ts:67-70`), and
`getMasteredDates` uses it (`src/data/repositories/points.ts:86-95`). An offline weekend shows as a Monday spike.
**Fix:** send the answer's client time with the event, clamped server-side to [now − 30 d, now], and bucket by it.
**Later.**

## BUG-15 — class exercise results have no idempotency, and the roster's compensating delete ignores failure (Low, Suspected)

- `saveExerciseResult` inserts with no client id (`src/data/repositories/grades.ts:133-141`). A retry after a lost
  response (the insert committed, the reply never arrived) records the attempt twice in the teacher's results. The
  mount flush and the finish flush can also both send one pending item (`src/features/classes/ExerciseHome.tsx:28-33,43,45-49`).
- `AddStudents` promises "no half-made student" by calling `deleteLearner`, which returns nothing and swallows its error
  (`src/data/repositories/learners.ts:148-155`, `src/features/classes/Classes.tsx:164-167`).

Adding students is paused behind the consent gate today. **Fix:** add a `client_id uuid unique` on `exercise_results`
and upsert on it. Have `deleteLearner` return its outcome. **Later.**

## BUG-16 — two tabs on one device overwrite each other's queue (Low, Suspected)

`kv` holds a per-tab in-memory Map hydrated once (`kv.ts:26,82`), and the queue is written as a whole array
(`lessonSync.ts:28`). Two tabs each write their own copy, and the last writer wins, so the other tab's unsent items are
lost. This is rare (one child, one tab), which is why it is Low. **Fix** if it ever matters: a BroadcastChannel re-read,
or store queue items as individual IndexedDB keys.

---

## Silent catch-and-ignore — classification of all 210 `catch` / `.catch(` sites in `src/` (tests excluded)

Counted with `grep -rnE "\bcatch\s*(\(|\{)|\.catch\(" src --include='*.ts' --include='*.tsx' | grep -v __tests__`: 210.
A narrower search for empty or constant-returning bodies found 110 across 44 files. As a positive control, that search
does match the known `kv.ts:123` `.catch(() => {})`.

| class | where | verdict |
|---|---|---|
| storage best-effort (localStorage/kv wrappers, private mode) | `infra/storage/*`, `ExerciseHome` markDone, prefs, i18n | **fine**: the fallback value is correct |
| speech/audio fallbacks | `useMiloSpeaker.ts` (17), `voiceClipPlayer.ts` (6) | fine, **except** the memoised manifest failure → BUG-05 |
| response-body parsing `r.json().catch(() => null/[])` | API routes, repositories | fine: the status is checked separately |
| Stripe webhook | `api/stripe/webhook/route.ts` (9) | **fine**: every write failure goes to `fail()` → 500 → redelivery; converges |
| queue classification | `_shared.ts` classifySyncError, `points.ts:40,61` (`catch → 'retry'`) | **defect**: 42501 → drop (BUG-01), P0C01 → retry-forever (BUG-04) |
| analytics flush | `analytics.ts:79-83` | **defect**: whole-batch retry, unconditional remove (BUG-06) |
| role/profile reads | `profile.ts:17-22` (error ignored), `modules/page.tsx:33` | **defect** → BUG-07 |
| compensating actions | `learners.ts:148-155` deleteLearner, `respond/route.ts:54` `drainB3Cancellations().catch(() => 0)` | deleteLearner → BUG-15. The drain's `0` suppresses the direct-cancel fallback on a throw, but the daily Vercel cron (`vercel.json`, 06:23 UTC) is the backstop, so a queued B3 can still go out before 06:23. Acceptable as designed ("only decides how soon"). |
| consent grant | `respond/route.ts:88` outer catch | **defect** → BUG-03 (no compensation on throw) |

## Areas checked and found sound (so the next reader does not redo them)

- **Retried syncs do not double-count problem points.** The queued item keeps its `event` uuid across retries
  (`lessonSync.ts:34`), and the database dedupes on `point_events.client_id unique` (`…112109…sql:55,115-117`).
  `module_done` works the same way. The existing suite already covers the reuse (`lessonSync.test.ts` "SAME event id").
  The idempotency hole is `level_up`, and only across devices → BUG-02.
- **`flushLessonSync` single-flight** (`lessonSync.ts:57-62`) is correct, and has a regression test.
- **`start_game_time`** takes an advisory lock and returns an already-running game rather than charging twice (`:191-195`).
- **Stripe webhook**: idempotent on `stripe_event_id`, retrieves current truth, reconciles seats to a target.
- **B3 cancel on withdrawal, child deletion and account close** is captured in the same transaction by a trigger
  (`20260923200000`), including on cascade DELETE. It is sound, but it does not cover a consent that never became
  granted → BUG-03.
- **Prerequisite nudge "once per day"** uses the device's local date (`src/infra/storage/nudgeSeen.ts:10`), which is the
  right day. The per-device limitation is documented there.
- **Retention cron jobs** are UTC and staggered, with no date arithmetic that depends on local time.
- **Streaks** no longer exist (`20260705161328_drop_streak_columns.sql`).
- **Sign-up re-send** expires the previous pending request (`20260926090000…sql:47-49`), so only the newest link grants.

## What I could not verify

- Supabase's **Email OTP Expiration** on production (BUG-09's likelihood). This is a dashboard setting. **BLOCKED**, for
  Rafi to read.
- supabase-js's behaviour with an expired refresh token while offline (BUG-01 edge c). Read from knowledge, not driven.
- The BUG-07 UI chain, the BUG-10/11/12 paths and BUG-16 were read, not driven in a browser.
- Resend's 409 behaviour (BUG-03) is taken from its public documentation. It was not measured against the live API,
  which would have meant sending real email.

## Findings table

| ID | title | area | severity | evidence | effort | when | bucket | files |
|---|---|---|---|---|---|---|---|---|
| BUG-01 | Queued answers/points dropped when flushed by another account or no session (42501 → drop) | progress sync / offline | High | Reproduced | M | fix now: child progress silently lost; routine on shared devices | own | src/infra/storage/lessonSync.ts, src/data/repositories/_shared.ts, src/data/repositories/points.ts, src/data/repositories/profile.ts, src/infra/useOfflineSync.tsx |
| BUG-02 | Stale device rolls back level/mastered on the account; level_up re-minted | progress sync / DB | High | Reproduced | M | fix now (migration, Rafi applies); points harmless while /play spends none | own (demotion policy: rafi) | supabase/migrations/20260917112109_lesson_progress_and_points.sql, src/infra/storage/lessonSync.ts |
| BUG-03 | Consent grant failing after B3 scheduled: orphan "you gave permission" email + 24 h Resend-409 lockout | consent | High | Reproduced (Resend stand-in per docs) | S | fix now, before more beta families | own | src/app/api/consent/respond/route.ts, src/features/consent/server.ts |
| BUG-07 | getMyRole returns null on a read error → wrong redirect / RolePicker can overwrite a real role | auth | High | Reproduced (conflation); UI chain Suspected | S | fix now | own | src/data/repositories/profile.ts, src/app/parent/page.tsx, src/app/auth/page.tsx, src/shared/ui/ParentPinGate.tsx |
| BUG-09 | Consent granted on an unconfirmed address; nightly prune cascade-deletes the granted consent record | consent / retention | High | Reproduced (DB half); entry path Suspected | S (prune guard) / M (flow) | fix now: prune guard; flow change after Rafi decides | own (prune) + rafi (flow) | src/app/auth/confirm/page.tsx, supabase/migrations/20260923180100_prune_unconfirmed_users.sql, supabase/migrations/20260924100000_consent_once.sql |
| BUG-04 | P0C01 on a progress upload retried forever, blocking every child's uploads on the device, silently | progress sync / consent | Medium | Reproduced | S | before any reconsent_required notice (notice-v7) ships | own (+ rafi for message) | src/data/repositories/_shared.ts, src/data/repositories/points.ts, src/infra/storage/lessonSync.ts |
| BUG-05 | One failed manifest fetch → browser TTS/silence for the whole session | voice | Medium | Reproduced | S | fix now: one line | own | src/infra/voiceClipPlayer.ts |
| BUG-08 | IndexedDB-hang boot writes to localStorage; next boot orphans it (incl. the upload queue) | storage | Medium | Reproduced | M | after beta | own | src/infra/storage/kv.ts |
| BUG-10 | "Check your connection" shown for consent/RLS/expired-session failures (incl. right-to-correct) | error paths | Medium | Suspected | M | after beta (P0C01 part before notice-v7) | own (classifier) + rafi (wording) | src/data/repositories/learners.ts, src/features/dashboard/ChildPage.tsx, src/data/repositories/parentPin.ts, src/app/auth/page.tsx |
| BUG-06 | Analytics: in-flight events deleted unsent; one refused event blocks all later events | analytics | Low | Reproduced | S | after beta: funnel data only | own | src/infra/analytics.ts |
| BUG-11 | SW activate wipes the content-addressed clip/image cache on every version bump | service worker | Low | Suspected | S | after beta | own | public/sw.js |
| BUG-12 | SW offline: query-exact cache match, stale APP_PAGES, unhandled CACHE_URLS | service worker | Low | Suspected | M | later: decide whether offline is promised | rafi | public/sw.js, public/sw-register.js |
| BUG-13 | Game-time day counted in UTC for families with no settings row | game time | Low | Suspected | S | before game time returns | own | supabase/migrations/20260917112109_lesson_progress_and_points.sql |
| BUG-14 | Performance week / mastered dates use upload time, not answer time | parent reports | Low | Suspected | M | later | own | src/features/lessons/progressReport.ts, src/data/repositories/points.ts |
| BUG-15 | exercise_results has no idempotency; roster compensating delete swallows failure | classes | Low | Suspected | S | later (student adding paused) | own | src/data/repositories/grades.ts, src/features/classes/ExerciseHome.tsx, src/data/repositories/learners.ts, src/features/classes/Classes.tsx |
| BUG-16 | Two tabs overwrite each other's in-memory queue (last writer wins) | storage | Low | Suspected | M | won't fix unless seen: one child, one tab | own | src/infra/storage/kv.ts, src/infra/storage/lessonSync.ts |
