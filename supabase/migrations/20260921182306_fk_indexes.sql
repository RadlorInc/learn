-- Index the three foreign keys Supabase's performance advisor flagged (unindexed_foreign_keys).
-- Without them, deleting a learner/account (cascade) and per-learner reads scan the whole table.
-- Additive only: no reader or RLS predicate changes, so it has no deploy-order constraint.
create index if not exists billing_events_account_id_idx   on public.billing_events   (account_id);
create index if not exists exercise_results_learner_id_idx on public.exercise_results (learner_id);
create index if not exists lesson_feedback_learner_id_idx  on public.lesson_feedback  (learner_id);
