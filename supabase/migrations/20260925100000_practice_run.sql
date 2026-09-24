-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- SHORT PRACTICE SESSIONS: WHERE A CHILD IS IN A TOPIC'S PRACTICE FOLLOWS THE ACCOUNT.
-- Design and the founder's decisions: docs/legal/LOOP-STATE.md → "Short sessions" (S0, S1).
--
-- A child now practises in rounds of 5 with Keep going / Take a break, and the next visit continues from exactly
-- where they stopped: how many problems were answered, the last question texts (so none is asked again), the problem
-- on screen, and which earlier topic was chosen for review. The device keeps that as `milo-newflow-run-*`; this column
-- is its copy on the account, so it also continues on another device. The level/streak/mastered standing is NOT in
-- here — it stays in its own columns, written by `record_lesson_progress`, which this file does not touch.
--
-- ⚠️ DEPLOY ORDER: EXPAND-ONLY, SAFE IN EITHER ORDER. `main` auto-deploys, so the client usually lands first:
--   · reading: `getLessonRows` asks for `run` and, on 42703 (no such column), reads again without it;
--   · writing: `recordPracticeRun` treats a missing function (PGRST202) as done — the device keeps its copy and the
--     progress/points queue is never held behind it.
--   After this file, an old bundle simply never writes `run`. Nothing existing changes shape.
--
-- ⚠️⚠️ SECURITY CHANGE, STATED AS ONE: this file ADDS ONE `SECURITY DEFINER` FUNCTION, `save_practice_run`.
--   · Why DEFINER: `lesson_progress` is read-only to browsers (every write privilege revoked, 20260917112109); rows
--     only arrive through functions. Same posture as `record_lesson_progress`.
--   · Its guard is the same one `record_lesson_progress` uses, copied not retyped in spirit: the caller must hold a
--     `learner_access` row for the child (`parent_id = auth.uid()`) — the owning parent, a viewer, or the child's own
--     login. Another family is refused with 42501.
--   · `search_path` pinned; EXECUTE revoked from public and anon, granted to authenticated only (the V19 trap).
--   · It writes ONLY `run` (and `updated_at`): it cannot move a level, a streak, mastery, done or a point.
--   · The consent gate (trg_enforce_child_consent, 20260923120000 §4) fires on its insert/update like any other write:
--     no granted, current consent → refused. Asserted at the end.
--
-- CHILD DATA: a new field about a child, so it must be gated, exported and deleted. All three are inherited from the
-- table and asserted in tests: gate (trigger on lesson_progress), export (`exportData.ts` reads `select('*')`),
-- delete + withdrawal (lesson_progress cascades from learners). No new table, so no new trigger is needed.
--
-- Rollback: drop the function save_practice_run(uuid, text, jsonb), then remove the run column from
-- public.lesson_progress. (Written as prose: baselineSchema.test.ts reads every literal column-drop statement in
-- migrations as a real one.)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

alter table public.lesson_progress
  add column if not exists run jsonb
  check (run is null or (jsonb_typeof(run) = 'object' and pg_column_size(run) < 32768));

comment on column public.lesson_progress.run is
  'Where the child is in this topic''s practice: {asked, recent[], current{problem,from}, review}. Written by save_practice_run.';

create or replace function public.save_practice_run(p_learner uuid, p_lesson text, p_run jsonb)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_run is not null and jsonb_typeof(p_run) <> 'object' then
    raise exception 'bad_run' using errcode = '22023';
  end if;
  insert into public.lesson_progress (learner_id, lesson_id, run, updated_at)
  values (p_learner, p_lesson, p_run, now())
  on conflict (learner_id, lesson_id) do update set run = excluded.run, updated_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.save_practice_run(uuid, text, jsonb) from public, anon;
grant execute on function public.save_practice_run(uuid, text, jsonb) to authenticated;

-- ── Closing assertions: any failure raises, and the migration's transaction rolls the whole file back. ──────────
do $$
declare n int;
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'lesson_progress' and column_name = 'run'
                    and data_type = 'jsonb' and is_nullable = 'YES') then
    raise exception 'practice-run: lesson_progress.run missing or not a nullable jsonb — rolled back';
  end if;

  if not exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                  where s.nspname = 'public' and p.proname = 'save_practice_run' and p.prosecdef
                    and exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%')) then
    raise exception 'practice-run: save_practice_run is not DEFINER with a pinned search_path — rolled back';
  end if;

  if has_function_privilege('anon', 'public.save_practice_run(uuid,text,jsonb)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.save_practice_run(uuid,text,jsonb)', 'EXECUTE') then
    raise exception 'practice-run: EXECUTE is not exactly authenticated-only — rolled back';
  end if;

  -- Browsers still cannot write the table directly: the only way in is the function above.
  if has_table_privilege('authenticated', 'public.lesson_progress', 'INSERT')
     or has_table_privilege('authenticated', 'public.lesson_progress', 'UPDATE') then
    raise exception 'practice-run: lesson_progress became writable by authenticated — rolled back';
  end if;

  -- The consent gate still guards the table the new column lives in.
  select count(*) into n from pg_trigger
   where tgname = 'trg_enforce_child_consent' and tgrelid = 'public.lesson_progress'::regclass and not tgisinternal;
  if n <> 1 then raise exception 'practice-run: consent gate missing on lesson_progress — rolled back'; end if;
end $$;
