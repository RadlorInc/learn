-- N18 / N19 (PR fix/n18-n19-last-played-mastered) — READ-ONLY. For Rafi to run in the Supabase SQL editor.
-- Counts only; no child rows, no names. Nothing here writes. No migration in this PR.

-- 1. N18 — what the parent's child cards will show after this PR.
--    with_progress = children whose card will show a date (their newest lesson_progress.updated_at);
--    the rest show "—" (no row on the account). Positive control: with_progress > 0 if any child has practised.
--    legacy_with_value = children whose OLD source (learner_stats.last_played_at) held a date — expected 0
--    (migration 20260917112252 nulled it; nothing writes it since).
select
  (select count(*) from public.learners)                                              as children,
  (select count(distinct learner_id) from public.lesson_progress)                     as with_progress,
  (select count(*) from public.learner_stats where last_played_at is not null)        as legacy_with_value,
  (select max(updated_at) from public.lesson_progress)                                as newest_progress;

-- 2. N19 — how many rows the RETIRED chapter rule may have marked mastered (chapter ids start 'c:').
--    Expected: chapter_rows_mastered = 0 while the chapters are hidden (LEGACY_CHAPTERS_HIDDEN = true).
--    If > 0: those rows were mastered under the old rule (tier 3 + 6 in a row) and stay mastered — this PR does
--    not rewrite stored rows; tell the agent if you want them re-evaluated.
select
  count(*) filter (where lesson_id like 'c:%')                 as chapter_rows,
  count(*) filter (where lesson_id like 'c:%' and mastered)    as chapter_rows_mastered,
  count(*) filter (where lesson_id not like 'c:%' and mastered) as topic_rows_mastered
from public.lesson_progress;
