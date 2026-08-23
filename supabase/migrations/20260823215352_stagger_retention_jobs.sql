-- Stagger the four retention jobs off the same minute.
--
-- All four were scheduled at 03:17 because each was added on its own and copied the last one's
-- slot. They contend today only in the sense that they queue; once learner_events and
-- diagnostic_items carry real volume, four concurrent DELETEs over the same small database is a
-- lock-and-IO pile-up at 3am with nobody watching, and the symptom (one job silently not
-- finishing) is miserable to diagnose after the fact. Free to fix now.
--
-- Order is deliberate: the two biggest tables go first and alone.
--   03:17  learner_events      (2,024 rows today, the largest)
--   03:22  diagnostic_items    (166, and grows with every placement check)
--   03:27  error_events        (0 today, spiky by nature)
--   03:32  diagnostic_leads    (14, 24-month window, the smallest and least urgent)
--
-- ⚠️ `cron.schedule` on an EXISTING jobname updates it in place rather than creating a second —
-- so this is an edit, not an unschedule-then-reschedule, and there is no window in which a job
-- does not exist. That is the same reason prune-diagnostic-items was given its own job instead
-- of being folded into purge-old-learner-events.
select cron.schedule('purge-old-learner-events', '17 3 * * *',
  $$delete from public.learner_events where created_at < now() - interval '90 days'$$);
select cron.schedule('prune-diagnostic-items',   '22 3 * * *', $$select public.prune_diagnostic_items()$$);
select cron.schedule('prune-error-events',       '27 3 * * *', $$select public.prune_error_events()$$);
select cron.schedule('prune-diagnostic-leads',   '32 3 * * *', $$select public.prune_diagnostic_leads()$$);
