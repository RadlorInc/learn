-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- BUG-02 (docs/review/LATENT-BUGS.md): A STALE DEVICE MUST NOT ROLL A CHILD'S STANDING BACK ON THE ACCOUNT.
--
-- `record_lesson_progress` (20260917112109) stored level / streak / mastered exactly as sent — last write wins. A tablet
-- that was offline since yesterday uploads its old standing and the account drops from level 2 + mastered to level 0;
-- the next pull copies that onto the up-to-date device, and the climb back pays `level_up` again.
--
-- THE RULE: THE MOST RECENTLY ANSWERED STANDING WINS. Not "never lower": the ladder lowers a level on purpose
-- (adaptive.ts `step`: worked steps shown → one level down and mastered = false), so a demotion is a real state and a
-- "greatest()" rule would keep a level the child has since dropped from. Instead the client sends WHEN its standing
-- was produced (`p_answered_at`, the time of the answer that produced it), and the server keeps whichever is newer.
--   · level / streak / mastered move only when p_answered_at >= the stored answered_at. An older write changes none
--     of them and pays no `level_up`. Ties are accepted (the same state sent twice is a no-op: no level_up).
--   · `done` stays monotonic, problem points stay once per p_event, `mastered` / `lesson_done` stay once-only
--     (point_events_once) — all unchanged.
--   · p_answered_at is clamped to now(): a device whose clock runs ahead cannot claim the future and freeze the topic.
--     ⚠️ NOT handled: a device whose clock runs BEHIND loses to honest devices by that much. Named, not fixed.
--   · p_answered_at NULL (a bundle from before this change, which does not send it) = now(): exactly today's
--     behaviour for that caller, so an old bundle loses nothing. The fix applies to bundles that send the time.
--   · Rows written before this migration have answered_at NULL = older than any stamped write (no backfill: the
--     only candidate, updated_at, is server upload time and is also moved by save_practice_run).
--
-- ⚠️⚠️ DEPLOY ORDER: SAFE IN EITHER ORDER.
--   · Code first (the default here — `main` auto-deploys): the new client sends p_answered_at, the old 8-argument
--     function answers PGRST202, and `recordLessonProgress` retries the same call without it (points.ts). Nothing
--     queues behind it and nothing is lost; the bug stays until this is applied.
--   · Migration first: an old bundle calls with 8 named arguments; PostgREST resolves them to this 9-argument
--     function through the DEFAULT, and NULL means now() — today's behaviour.
--   The old overload is DROPPED, not kept beside the new one: two overloads that both accept 8 arguments would be
--   ambiguous to PostgREST and to SQL.
--
-- ⚠️⚠️ SECURITY — STATED AS A SECURITY CHANGE BECAUSE A FUNCTION IS DROPPED AND RE-CREATED:
--   · The body is 20260917112109's, copied, with only these lines changed: the parameter list (+ p_answered_at), the
--     declare line (+ v_at, v_fresh), two lines computing them after the row is read, the insert/upsert (the three
--     standing columns + answered_at chosen by v_fresh), and `if v_fresh and p_level > old.level` on level_up.
--   · SECURITY DEFINER: KEPT (the original has it). SET search_path to 'public': KEPT. Owner: unchanged (whoever runs
--     migrations, as for the original). The guard (learner_access on auth.uid()) and the advisory lock: unchanged.
--   · Grants: dropping a function drops its ACL, so the original's two statements are re-issued verbatim for the new
--     signature — revoke all from public, anon; grant execute to authenticated. Asserted below, both halves.
--   · `save_practice_run` (20260925100000) is NOT touched: it writes only `run` and cannot move a standing.
--
-- CHILD DATA: one new column, `answered_at` — when the child last answered on this topic. The same fact is already held
-- by `updated_at` on this row and by `created_at` on every `point_events` 'problem' row, so no new category is
-- collected. Gate / export / delete are inherited from the table (consent trigger, select('*') export, cascade).
--
-- Rollback: re-run 20260917112109's `create function record_lesson_progress` plus its two grant lines after dropping
-- this 9-argument version, then drop the answered_at column (written as prose — see 20260925100000's note).
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

alter table public.lesson_progress add column if not exists answered_at timestamptz;
comment on column public.lesson_progress.answered_at is
  'When the answer that produced level/streak/mastered was given (client time, clamped to now()). An older write does not replace them. BUG-02.';

drop function if exists public.record_lesson_progress(uuid, text, boolean, int, int, boolean, text, uuid);

-- Saves where a child stands on one topic, and awards the points that change earned:
--   an answered problem 2 (first try) or 1 (after a miss / the worked steps) — once per p_event;
--   the level going up +3; the topic mastered for the first time +15; the lesson finished for the first time +10.
-- Returns { ok, earned, balance }.
create or replace function public.record_lesson_progress(
  p_learner uuid, p_lesson text, p_done boolean, p_level int, p_streak int, p_mastered boolean,
  p_outcome text default null, p_event uuid default null, p_answered_at timestamptz default null)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare old public.lesson_progress; v_earned int := 0; v_n int; v_at timestamptz; v_fresh boolean;
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_outcome is not null and p_outcome not in ('first', 'second', 'worked') then
    raise exception 'bad_outcome' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_learner::text));

  select * into old from public.lesson_progress where learner_id = p_learner and lesson_id = p_lesson;
  if not found then old.done := false; old.level := 0; old.mastered := false; end if;
  v_at := least(coalesce(p_answered_at, now()), now());
  v_fresh := v_at >= coalesce(old.answered_at, '-infinity'::timestamptz);

  insert into public.lesson_progress (learner_id, lesson_id, done, level, streak, mastered, answered_at, updated_at)
  values (p_learner, p_lesson, coalesce(p_done, false) or old.done, greatest(0, p_level), greatest(0, p_streak), coalesce(p_mastered, false), v_at, now())
  on conflict (learner_id, lesson_id) do update
    set done = excluded.done,
        level       = case when v_fresh then excluded.level       else lesson_progress.level end,
        streak      = case when v_fresh then excluded.streak      else lesson_progress.streak end,
        mastered    = case when v_fresh then excluded.mastered    else lesson_progress.mastered end,
        answered_at = case when v_fresh then excluded.answered_at else lesson_progress.answered_at end,
        updated_at = now();

  if p_outcome is not null and p_event is not null then
    insert into public.point_events (learner_id, reason, lesson_id, points, client_id)
    values (p_learner, 'problem', p_lesson, case when p_outcome = 'first' then 2 else 1 end, p_event)
    on conflict (client_id) do nothing;
    get diagnostics v_n = row_count;
    v_earned := v_earned + case when v_n > 0 then case when p_outcome = 'first' then 2 else 1 end else 0 end;
  end if;
  if v_fresh and p_level > old.level then
    insert into public.point_events (learner_id, reason, lesson_id, points) values (p_learner, 'level_up', p_lesson, 3);
    v_earned := v_earned + 3;
  end if;
  if coalesce(p_mastered, false) then
    insert into public.point_events (learner_id, reason, lesson_id, points) values (p_learner, 'mastered', p_lesson, 15)
    on conflict (learner_id, reason, lesson_id) where reason in ('mastered', 'lesson_done') do nothing;
    get diagnostics v_n = row_count;
    v_earned := v_earned + 15 * v_n;
  end if;
  if coalesce(p_done, false) then
    insert into public.point_events (learner_id, reason, lesson_id, points) values (p_learner, 'lesson_done', p_lesson, 10)
    on conflict (learner_id, reason, lesson_id) where reason in ('mastered', 'lesson_done') do nothing;
    get diagnostics v_n = row_count;
    v_earned := v_earned + 10 * v_n;
  end if;

  return jsonb_build_object('ok', true, 'earned', v_earned,
    'balance', (select coalesce(sum(points), 0) from public.point_events where learner_id = p_learner));
end;
$$;

-- ⚠️ The V19 trap: a new function in `public` is PUBLIC-executable until revoked. (20260917112109's two lines, new signature.)
revoke all on function public.record_lesson_progress(uuid, text, boolean, int, int, boolean, text, uuid, timestamptz) from public, anon;
grant execute on function public.record_lesson_progress(uuid, text, boolean, int, int, boolean, text, uuid, timestamptz) to authenticated;

-- ── Closing assertions: any failure raises, and the migration's transaction rolls the whole file back. ──────────
do $$
declare n int;
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'lesson_progress' and column_name = 'answered_at'
                    and data_type = 'timestamp with time zone' and is_nullable = 'YES') then
    raise exception 'bug-02: lesson_progress.answered_at missing or not a nullable timestamptz — rolled back';
  end if;

  -- Exactly one overload: two that accept 8 arguments would be ambiguous to PostgREST.
  select count(*) into n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
   where s.nspname = 'public' and p.proname = 'record_lesson_progress';
  if n <> 1 then raise exception 'bug-02: % overloads of record_lesson_progress, expected 1 — rolled back', n; end if;

  if not exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                  where s.nspname = 'public' and p.proname = 'record_lesson_progress' and p.prosecdef and p.pronargs = 9
                    and exists (select 1 from unnest(p.proconfig) c where c = 'search_path=public')) then
    raise exception 'bug-02: record_lesson_progress is not a 9-arg DEFINER with search_path=public — rolled back';
  end if;

  -- Both halves: the real caller (authenticated) can execute it; anon cannot; PUBLIC holds no grant.
  if has_function_privilege('anon', 'public.record_lesson_progress(uuid,text,boolean,int,int,boolean,text,uuid,timestamptz)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.record_lesson_progress(uuid,text,boolean,int,int,boolean,text,uuid,timestamptz)', 'EXECUTE') then
    raise exception 'bug-02: EXECUTE is not exactly authenticated-only — rolled back';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace, aclexplode(p.proacl) a
              where s.nspname = 'public' and p.proname = 'record_lesson_progress' and a.grantee = 0) then
    raise exception 'bug-02: PUBLIC can execute record_lesson_progress — rolled back';
  end if;

  if has_table_privilege('authenticated', 'public.lesson_progress', 'INSERT')
     or has_table_privilege('authenticated', 'public.lesson_progress', 'UPDATE') then
    raise exception 'bug-02: lesson_progress became writable by authenticated — rolled back';
  end if;
end $$;
