# The checkup is optional — the two numbers that decide whether we revisit it

Founder's call, 2026-08-24. The check became optional because measuring the short pass removed the
middle option: it misses a third to a half of gaps in the bands where it saves any time, and 17–18
has no short pass at all (`PROBE_SWEEP['17-18']` is empty, so spine *is* the full agenda). With only
"the full check or nothing" on the table, 20–50 questions between a parent and their first look at
the product is the worse trade.

**Optional does not mean planless.** Skipping issues a `gradeStartPlan` — the band's chapters in
curriculum order from the beginning. Less informed than a diagnosed plan, refined afterwards from
real gameplay by `advanceAfterChapter`, and still the product's shape rather than a 72-chapter menu.

## What is emitted

One event, `checkup_offer`, from two surfaces:

| prop | values |
|---|---|
| `action` | `taken` · `skipped` |
| `at` | `signup` (the diagnostic's intro) · `reoffer` (the menu card, after a plan chapter) |
| `band` | the learner's age group |

⚠️ **`taken` is NOT emitted at `signup`** — the diagnostic's own completed session is that record.
Number 1's query below is written around this rather than needing a new event.

## Number 1 — what share of new accounts skip

⚠️ **THE OBVIOUS QUERY IS WRONG AND WOULD REPORT 100%.** The `signup` surface emits only on SKIP —
a parent who takes the check emits no event, because the diagnostic's own completion is the record.
Counting `checkup_offer` rows and dividing gives a denominator made entirely of skippers.

The takers are already recorded, so no new event is needed: a `diagnostic_sessions` row IS a taker.

```sql
-- Per band: skippers from the event stream, takers from their completed sessions.
with skipped as (
  select distinct on (learner_id) learner_id, props->>'band' as band
  from public.learner_events
  where event = 'checkup_offer' and props->>'at' = 'signup' and props->>'action' = 'skipped'
  order by learner_id, created_at          -- the FIRST offer per child, never a later re-offer
),
taken as (
  select distinct on (learner_id) learner_id, band
  from public.diagnostic_sessions
  order by learner_id, completed_at
)
select coalesce(s.band, t.band) as band,
       count(s.learner_id)                       as skipped,
       count(t.learner_id)                       as taken,
       round(100.0 * count(s.learner_id)
             / nullif(count(s.learner_id) + count(t.learner_id), 0), 1) as skip_pct
from skipped s
full outer join taken t on t.learner_id = s.learner_id
group by 1 order by 1;
```

⚠️ **A child can appear in BOTH** — they skipped at signup and took it later from the re-offer or the
parent dashboard. That is a real and interesting state, not a bug: `full outer join` keeps them in
both counts, so `skipped + taken` exceeds the child count by exactly the number who came back. If
you want the funnel rather than the stance, subtract that overlap:

```sql
select count(*) from skipped s join taken t on t.learner_id = s.learner_id;   -- skipped, then took
```

## Number 2 — do skippers convert to paid worse than takers

```sql
-- Entitlement follows learners.created_by, so conversion is per ACCOUNT, not per learner.
with stance as (
  select distinct on (l.created_by) l.created_by as account_id,
         (e.props->>'action') as first_choice
  from public.learner_events e
  join public.learners l on l.id = e.learner_id
  where e.event = 'checkup_offer'
  order by l.created_by, e.created_at
)
select stance.first_choice,
       count(*) as accounts,
       count(s.account_id) filter (where s.status in ('active', 'trialing')) as paid,
       round(100.0 * count(s.account_id) filter (where s.status in ('active', 'trialing'))
             / nullif(count(*), 0), 1) as paid_pct
from stance
left join public.subscriptions s on s.account_id = stance.account_id
group by 1;
```

⚠️ **IF SKIPPERS CONVERT FAR WORSE, THE ANSWER IS NOT TO FORCE THE CHECK.** Founder's rule, written
down before the data arrives so it cannot be re-argued afterwards: that result means *the grade-start
plan is not good enough*, which is a different fix — a better naive plan, or an earlier revision from
gameplay. Re-forcing a 20–50 question gate would be reading the symptom as the cause.

⚠️ **`learner_events` prunes at 90 days** (retention cron), so both queries are windowed by that
whether or not they say so. A cohort older than 90 days cannot be recovered from this table.
