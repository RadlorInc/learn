-- Supporting indexes for the now-windowed retention/streak reads.
--
-- insights (per-account): sessions + learner_events filtered by learner_id + a created_at window.
-- streak reconcile (every menu mount): learner_events by learner_id + event='daily_complete' + window.
-- Additive + reversible; `if not exists` so it's safe to re-run. Low-volume tables → a plain
-- CREATE INDEX is fine (no CONCURRENTLY, which can't run inside a migration transaction).

-- sessions has no created_at — its activity timestamp is started_at (always set).
create index if not exists idx_sessions_learner_started
  on public.sessions (learner_id, started_at);

create index if not exists idx_events_learner_event_created
  on public.learner_events (learner_id, event, created_at);
