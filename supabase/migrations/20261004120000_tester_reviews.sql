-- ════════════════════════════════════════════════════════════════════════════════════════════════════
-- PAID TESTERS — a tester reviews every screen of one module, and /admin/testers shows what they did
-- (founder, 2026-10-04: "we pay a tester, so we need to know they really tested").
-- ════════════════════════════════════════════════════════════════════════════════════════════════════
--
-- WHAT IT ADDS: two tables and six functions. Nothing about a child is read or written: a tester is an adult
-- who opens a link; their rows hold an email the founder typed, a module id, and one row per screen reviewed.
--
--   tester_assignments   one link: email, module, a 64-hex token (the link's secret), revoked/paid marks.
--   tester_reviews       one row per (assignment, topic, screen): verdict, note, the answer typed, how long
--                        the screen was open and whether her lines had finished playing when it was reviewed.
--
-- Both tables: RLS on, NO policies, no grants — reachable only through the functions below.
--
-- ⚠️⚠️ SECURITY CHANGE, CALLED OUT: SIX NEW `SECURITY DEFINER` FUNCTIONS.
--   admin_tester_create / admin_tester_list / admin_tester_reviews / admin_tester_mark
--       FIRST statement `perform public.admin_assert()`; EXECUTE revoked from public and anon, granted to
--       authenticated (the admin calls them with their own token) — the /admin siblings' posture.
--       ⚠️ These are the first /admin functions that WRITE. They write only tester rows, never a family's.
--   tester_open / tester_review
--       Callable by anon: the token IS the authorisation (244 random bits from two gen_random_uuid()).
--       A wrong, revoked or paid-out token raises 42501 and writes nothing. tester_review validates every
--       field (verdict in a closed set, an 'issue' needs a note of 5+ characters, lengths capped).
--   search_path pinned to public on all six; asserted at the end.
--
-- DEPLOY ORDER: either. Before this is applied /test and /admin/testers say they could not load; nothing
-- else in the app calls these functions.

create table if not exists public.tester_assignments (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  email       text not null check (length(email) between 3 and 200),
  module_id   text not null check (module_id ~ '^g[3-8]m[0-9]+$'),
  note        text check (length(note) <= 500),
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  paid_at     timestamptz
);
alter table public.tester_assignments enable row level security;
revoke all on public.tester_assignments from public, anon, authenticated;

create table if not exists public.tester_reviews (
  assignment_id uuid not null references public.tester_assignments(id) on delete cascade,
  lesson_id     text not null check (lesson_id ~ '^g[3-8]m[0-9]+-t[0-9]+$'),
  screen        text not null check (screen ~ '^([1-9]|8-twin|p[0-9]{1,2})$'),
  verdict       text not null check (verdict in ('ok', 'issue')),
  note          text check (length(note) <= 2000),
  answer        text check (length(answer) <= 200),
  open_ms       int  not null check (open_ms >= 0),
  played        boolean not null,
  updated_at    timestamptz not null default now(),
  primary key (assignment_id, lesson_id, screen)
);
alter table public.tester_reviews enable row level security;
revoke all on public.tester_reviews from public, anon, authenticated;

-- ── admin side ─────────────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_tester_create(p_email text, p_module text, p_note text default null)
returns json language plpgsql volatile security definer set search_path to 'public' as $$
declare v public.tester_assignments;
begin
  perform public.admin_assert();
  insert into public.tester_assignments (email, module_id, note)
  values (lower(trim(p_email)), p_module, nullif(trim(p_note), ''))
  returning * into v;
  return json_build_object('id', v.id, 'token', v.token);
end;
$$;

create or replace function public.admin_tester_list()
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare v json;
begin
  perform public.admin_assert();
  select coalesce(json_agg(json_build_object(
           'id', a.id, 'token', a.token, 'email', a.email, 'module_id', a.module_id, 'note', a.note,
           'created_at', a.created_at, 'revoked_at', a.revoked_at, 'paid_at', a.paid_at,
           'screens', coalesce(r.screens, 0), 'topics', coalesce(r.topics, 0), 'issues', coalesce(r.issues, 0),
           'not_played', coalesce(r.not_played, 0), 'median_open_ms', r.median_open_ms,
           'first_at', r.first_at, 'last_at', r.last_at) order by a.created_at desc), '[]'::json)
  into v
  from public.tester_assignments a
  left join lateral (
    select count(*) screens, count(distinct lesson_id) topics,
           count(*) filter (where verdict = 'issue') issues,
           count(*) filter (where not played) not_played,
           percentile_cont(0.5) within group (order by open_ms)::int median_open_ms,
           min(updated_at) first_at, max(updated_at) last_at
    from public.tester_reviews x where x.assignment_id = a.id) r on true;
  return v;
end;
$$;

create or replace function public.admin_tester_reviews(p_id uuid)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare v json;
begin
  perform public.admin_assert();
  select coalesce(json_agg(json_build_object(
           'lesson_id', lesson_id, 'screen', screen, 'verdict', verdict, 'note', note, 'answer', answer,
           'open_ms', open_ms, 'played', played, 'at', updated_at) order by updated_at), '[]'::json)
  into v from public.tester_reviews where assignment_id = p_id;
  return v;
end;
$$;

-- p_what: 'revoke' | 'unrevoke' | 'paid' | 'unpaid'
create or replace function public.admin_tester_mark(p_id uuid, p_what text)
returns void language plpgsql volatile security definer set search_path to 'public' as $$
begin
  perform public.admin_assert();
  update public.tester_assignments set
    revoked_at = case p_what when 'revoke' then now() when 'unrevoke' then null else revoked_at end,
    paid_at    = case p_what when 'paid'   then now() when 'unpaid'   then null else paid_at end
  where id = p_id;
  if not found or p_what not in ('revoke', 'unrevoke', 'paid', 'unpaid') then
    raise exception 'admin_tester_mark: no such assignment or action' using errcode = '22023';
  end if;
end;
$$;

-- ── tester side: the token is the authorisation ────────────────────────────────────────────────────

create or replace function public.tester_open(p_token text)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare a public.tester_assignments;
begin
  select * into a from public.tester_assignments
  where token = p_token and revoked_at is null and paid_at is null;
  if not found then raise exception 'not a live tester link' using errcode = '42501'; end if;
  return json_build_object('module_id', a.module_id, 'reviewed', (
    select coalesce(json_agg(lesson_id || '/' || screen), '[]'::json)
    from public.tester_reviews where assignment_id = a.id));
end;
$$;

create or replace function public.tester_review(
  p_token text, p_lesson text, p_screen text, p_verdict text, p_note text, p_answer text, p_open_ms int, p_played boolean)
returns void language plpgsql volatile security definer set search_path to 'public' as $$
declare a public.tester_assignments;
begin
  select * into a from public.tester_assignments
  where token = p_token and revoked_at is null and paid_at is null;
  if not found then raise exception 'not a live tester link' using errcode = '42501'; end if;
  if split_part(p_lesson, '-', 1) <> a.module_id then
    raise exception 'topic is not in this tester''s module' using errcode = '22023';
  end if;
  if p_verdict = 'issue' and length(trim(coalesce(p_note, ''))) < 5 then
    raise exception 'an issue needs a note of at least 5 characters' using errcode = '22023';
  end if;
  insert into public.tester_reviews as r (assignment_id, lesson_id, screen, verdict, note, answer, open_ms, played)
  values (a.id, p_lesson, p_screen, p_verdict, nullif(trim(p_note), ''), nullif(trim(p_answer), ''),
          greatest(coalesce(p_open_ms, 0), 0), coalesce(p_played, false))
  on conflict (assignment_id, lesson_id, screen) do update set
    verdict = excluded.verdict, note = excluded.note, answer = excluded.answer,
    open_ms = excluded.open_ms, played = excluded.played, updated_at = now();
end;
$$;

revoke all on function public.admin_tester_create(text, text, text) from public, anon;
revoke all on function public.admin_tester_list() from public, anon;
revoke all on function public.admin_tester_reviews(uuid) from public, anon;
revoke all on function public.admin_tester_mark(uuid, text) from public, anon;
grant execute on function public.admin_tester_create(text, text, text) to authenticated, service_role;
grant execute on function public.admin_tester_list() to authenticated, service_role;
grant execute on function public.admin_tester_reviews(uuid) to authenticated, service_role;
grant execute on function public.admin_tester_mark(uuid, text) to authenticated, service_role;
revoke all on function public.tester_open(text) from public;
revoke all on function public.tester_review(text, text, text, text, text, text, int, boolean) from public;
grant execute on function public.tester_open(text) to anon, authenticated, service_role;
grant execute on function public.tester_review(text, text, text, text, text, text, int, boolean) to anon, authenticated, service_role;

-- ── closing assertions: the posture above, measured on the objects just created ────────────────────
do $$
declare f text;
begin
  foreach f in array array['public.admin_tester_create(text,text,text)', 'public.admin_tester_list()',
                           'public.admin_tester_reviews(uuid)', 'public.admin_tester_mark(uuid,text)'] loop
    if not exists (select 1 from pg_proc where oid = f::regprocedure
                    and prosecdef and proconfig = array['search_path=public']
                    and prosrc ~ 'begin\s+perform public\.admin_assert\(\);') then
      raise exception '%: not DEFINER with search_path=public, or admin_assert() is not its first statement — rolled back', f;
    end if;
    if has_function_privilege('anon', f, 'execute') then raise exception '% is callable by anon — rolled back', f; end if;
    if not has_function_privilege('authenticated', f, 'execute') then raise exception '% is not callable by authenticated — rolled back', f; end if;
  end loop;
  foreach f in array array['public.tester_open(text)', 'public.tester_review(text,text,text,text,text,text,int,boolean)'] loop
    if not exists (select 1 from pg_proc where oid = f::regprocedure and prosecdef and proconfig = array['search_path=public']) then
      raise exception '%: not DEFINER with search_path=public — rolled back', f;
    end if;
    if not has_function_privilege('anon', f, 'execute') then raise exception '% is not callable by anon — rolled back', f; end if;
  end loop;
  if has_table_privilege('anon', 'public.tester_assignments', 'select') or has_table_privilege('authenticated', 'public.tester_reviews', 'select') then
    raise exception 'tester tables are readable directly — rolled back';
  end if;
end $$;
