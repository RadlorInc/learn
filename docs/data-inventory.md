# What we actually record — and what the column names lie about

**Every figure here was measured against production (`wrnjqjhrbnqxornmfisf`) on 2026-09-05, not read
off the repo.** Reading the repo answers *what we intended*; only querying production answers *what
is true*. Re-measure before trusting any number below — they are a snapshot of a 3-tester database.

This file exists because of one column. `sessions.started_at` is not a start time, has never been a
start time, and its **name** is why nobody looked for three months. If you take one thing from this
document: *a plausible column name is not evidence, and neither is a non-null value.*

---

## 0. The three traps that cost the most

| trap | what it looks like | what it is |
|---|---|---|
| `sessions.started_at` | a start timestamp, never null | the row's INSERT time. Both it and `completed_at` mark the END. **All 49 rows had a NEGATIVE duration** (median −1s, min −22s) |
| `diagnostic_sessions.completed_at` | a completion time | `NOT NULL DEFAULT now()`, and the row is only inserted **on completion** — all 13 rows have `completed_at = started_at` exactly. **A started-and-abandoned probe writes nothing**, so "how many start it" has no denominator |
| `auth_events` | a login history | **1 row**, against ≥18 real logins since it was created. Logins happen and are not recorded |

None of these throws. None shows up in a type-check. Each would have produced a confident,
plausible-looking number on a dashboard.

---

## 1. Timezone — the good news

**Every timestamp in the database is `timestamptz`.** There is not one naive `timestamp` column
anywhere. So timezone is purely a *presentation* choice; Sydney and India never enter it, and a
dashboard may declare US Eastern freely.

The real timezone trap is a different one:

- `learner_events.created_at` — when the row was **uploaded**
- `learner_events.client_ts` — when the event **happened**, from the device's own clock

Measured: these diverge by up to **766,062 s (8.9 days)**, and the skew is `created_at > client_ts`
on **28 of 28** cases — never once the reverse. That is entirely the offline queue flushing late,
not a device clock running fast. **So `client_ts` is the honest event time.** Anything bucketing by
day should use it; anything reasoning about *when we learned something* uses `created_at`.

---

## 2. The tables

### Accounts (the "signups" unit)

| table | rows | a row is | written |
|---|---|---|---|
| `auth.users` | 11 | one parent account | always |
| `profiles` | 11 | parent profile, 1:1 via the `on_auth_user_created` trigger | always |
| `learners` | 21 | one child | always |
| `learner_access` | 21 | a parent→learner grant | always |

⚠️ **There are two different "user" entities and they are not interchangeable.** Signups are
**11 accounts**; activity is **21 learners** (16 ever active, 10 ever completed a chapter). "Average
chapters per user" means a different thing for each. The convention chosen 2026-09-05:
**learner for learning and retention, account for signups**, labelled on screen.

⚠️ **Internal accounts cannot be identified from data.** 10 of the 11 accounts are `gmail.com`.
Domain heuristics are useless here; the list has to come from a human.

### Activity

| table | rows | a row is | written |
|---|---|---|---|
| `sessions` | 49 | a **completed** practice run | on completion only. All `phase='practice'` |
| `learner_events` | 1710 | a product event | queued client-side, best-effort, **90-day purge** |
| `learner_progress` | 31 | per learner×chapter cumulative | on completion |
| `learner_stats` | 21 | per-learner totals | on completion |
| `learner_state` | 6 | shop purchases / equipped items | ⚠️ see §4 — the only direct client write, and its failure is swallowed |

**Events, which are the only real activity signal:**

| event | rows | learners | first seen | trust |
|---|---|---|---|---|
| `session_start` | 1048 | 16 | 2026-06-18 | ✅ the best "active" signal |
| `chapter_open` | 645 | 14 | 2026-06-18 | ✅ 0 orphan chapter ids |
| `practice_complete` | 9 | 3 | **2026-08-18** | ⚠️ see below |
| `checkup_offer` | 6 | 3 | 2026-08-24 | ✅ both actions present (5 skipped / 1 taken) |
| `daily_open` | 2 | 1 | 2026-07-03 | effectively dead |

⚠️ **`practice_complete` did not exist before 2026-08-18.** It was wired by the `onComplete` P0 fix.
Since that date it agrees with `sessions` **exactly — 9 and 9** — so it is a clean cutover, not a
flaky event: trustworthy after 2026-08-18, structurally absent before. The 40 earlier completions
have no event. **Use `sessions` for completions.**

⚠️ **There is no per-question record of any kind.** The complete set of event prop keys in
production is `action, ageGroup, at, band, chapter, correct, mastered, wrong`. No question id, no
item id, no answer row. Chapter-level accuracy (`sessions.correct_count` / `wrong_count`) is the
finest grain that exists.

### Retention

`learner_events` is hard-deleted at 90 days by the nightly `purge-old-learner-events` cron (03:17,
filtering on `created_at`). Measured 2026-09-05: oldest event is 78 days old, so **nothing had ever
actually been purged**. Erosion schedule:

| night | destroyed | cumulative |
|---|---|---|
| 2026-09-13 | 3 | 0.2% |
| **2026-09-27** | **520** | **31%** |
| 2026-10-04 | 238 | 45% |

⚠️ **90 days is a published number**, not merely an internal setting. It appears in
`src/app/legal/content.ts` (the privacy policy, currently `DRAFT = true`) *and* in
`src/data/repositories/exportData.ts:96`, which is **not** marked draft and goes into a parent's
real data-rights export. Changing retention means changing both, in the same commit.

---

## 3. What cannot be computed, and why

| metric | why not | to fix, record |
|---|---|---|
| session length | §0 — both timestamps mark the end | a real `started_at` (done 2026-09-05) |
| question-level accuracy | no per-question row exists | an `answer` event: chapter + question id + correct |
| diagnostic **starts** | row inserted on completion only | insert on start; set `completed_at` on finish |
| logins over time | `auth_events` not firing | see §4 |
| retention beyond ~13 weeks | the 90-day purge | a rollup that survives it |

**The event-span proxy for session length.** Sessionizing `learner_events` on a 30-minute gap gives
196 sessions / 16 learners, **median 462 s (7.7 min) against mean 1330 s (22 min)** — a 2.9× skew,
with a 2.9-hour abandoned session already in the data. Usable, but it is a proxy with a known bias:
it ends at the last *recorded* event, so it systematically **under-measures the tail**. Label it
event-span wherever it is shown; do not call it session length.

---

## 4. Writes whose failure is invisible

The defect behind the missing login history is not "logins aren't logged". It is that a **failing
write was invisible for six weeks**. `logAuthEvent` ends in
`.then(() => undefined, () => undefined)`; there is no counter, no log, nothing.

Swept 2026-09-05 across `src/`. ⚠️ **The first sweep was blind** — it used `.then([^)]*, …)`, and a
negated character class cannot cross the `)` inside `() => undefined`, so it could not match the one
site already known to have the bug. It reported clean. **Any absence-sweep needs a positive control
against a case you know is present.** Corrected results:

| site | judgement |
|---|---|
| `data/auth.ts:56` — `logAuthEvent` | ⚠️ **the bug.** Six weeks of silent failure |
| `app/shop/page.tsx:22` — `saveLearnerState(...).catch(() => {})` | ⚠️ **same bug.** The function returns `Promise<boolean>` precisely to report failure, and the caller discards the boolean *and* the rejection. A child's purchases silently fail to sync |
| `infra/reportCrash.ts:53`, `api/checkout:118`, `api/lead:80`, `api/stripe/webhook:56,147` — all `sinkError(...).catch()` | deliberate: this is the error sink, and if reporting an error throws there is nowhere left to report it. ⚠️ Known blind spot — a misconfigured `SUPABASE_SERVICE_ROLE_KEY` makes every report vanish silently |
| `infra/storage/kv.ts:91,123,129` — `idbWrite(...)` | deliberate: IndexedDB is a mirror behind a synchronous primary |
| `useOfflineSync.tsx:76`, `diagnostic/page.tsx:101` — `flushDiagnosticQueue()` | deliberate: the queue *is* the retry, so a failed flush is recoverable by construction |
| `voiceClipPlayer.ts:74` — `a.play()` | deliberate: a rejected `play()` before a user gesture is the normal case |

Of 13 swallowed-rejection sites, **11 are deliberate and 2 are the same bug**.

---

## 5. Instruments that lied while measuring this

Kept because each cost real time and will cost it again:

- **`information_schema.role_table_grants` returned NULL** for `auth_events`, which reads exactly
  like "no role can insert". The authoritative source is `pg_class.relacl` —
  `authenticated=a/postgres`, i.e. INSERT is granted. It is a *filtered* view. Nearly published as
  a permission defect.
- **`pg_class.reltuples` returned −1** for most tables — that means "never ANALYZEd", not "no rows".
  Count with `count(*)`.
- **`list_projects` does not enumerate production.** The MCP token sees only `radlor-site`;
  production is reachable by ref but invisible to the listing. An empty list is not an absence.
- **A frozen fixture timestamp destroys the `started_at` defect.** The bug depends on
  `completed_at ≈ now()`, because that is what makes the server's `now()` land microseconds later.
  Pinned to a fixed past date, the buggy RPC returns **+49691 s** and the known-bad control fails
  for the wrong reason. Reproducing a timing defect requires reproducing its timing.
- **`break-check.sh` cannot verify a check for uncommitted code.** It parks work with
  `git stash --include-untracked`, so a new migration and its new test are stashed away and the
  break edits nothing (exit 3). Its own header records the origin repo hitting this once. Commit
  first, or mutate with a file copy and a trap and no git at all.
