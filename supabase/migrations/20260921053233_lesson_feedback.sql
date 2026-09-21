-- "I didn't understand this screen" — a child's quick feedback on one lesson screen (founder's ask, 2026-09-21).
--
-- A button on every lesson screen opens a short list of reasons to TAP (no typing): too fast, hard words, a confusing
-- picture, could not hear, the maths, something broken. One row per send: which child, which lesson, which screen,
-- which reasons. Read by the founder in the Supabase dashboard (service role); no screen in the app lists them yet.
--
-- WHO MAY DO WHAT (enforced here, not only on screen):
--   INSERT — a signed-in adult or child login, only for a learner they own or have a learner_access row for.
--            Only the four data columns are insertable; id and created_at are the server's.
--   SELECT — the same people (so a parent's data export carries it); nobody else.
--   UPDATE / DELETE — nobody from a client. Rows go with the learner (on delete cascade).
-- ⚠️ No free text, on purpose: a child's typed words are a moderation and privacy problem this table does not take on.
--
-- ✅ APPLIED TO PRODUCTION 2026-09-21 (ledger 20260921053233), before the code — as measured that day: RLS on, 2 policies,
--    insert on the 4 data columns only, anon refused 42501. No SECURITY DEFINER, no function.
-- Rollback: drop table public.lesson_feedback;

create table if not exists public.lesson_feedback (
  id          uuid primary key default gen_random_uuid(),
  learner_id  uuid not null references public.learners(id) on delete cascade,
  lesson_id   text not null check (char_length(lesson_id) between 1 and 40),
  screen      text not null check (char_length(screen) between 1 and 20),
  reasons     text[] not null check (cardinality(reasons) between 1 and 6
                and reasons <@ array['fast', 'words', 'picture', 'hear', 'math', 'broken']::text[]),
  created_at  timestamptz not null default now()
);
create index if not exists lesson_feedback_lesson_idx on public.lesson_feedback (lesson_id, screen);

alter table public.lesson_feedback enable row level security;
revoke all on public.lesson_feedback from public, anon, authenticated;
grant select on public.lesson_feedback to authenticated;
grant insert (learner_id, lesson_id, screen, reasons) on public.lesson_feedback to authenticated;

drop policy if exists "lesson_feedback: the child's adults and the child read" on public.lesson_feedback;
create policy "lesson_feedback: the child's adults and the child read" on public.lesson_feedback
  for select to authenticated
  using (
    learner_id in (select id from public.learners where created_by = (select auth.uid()))
    or learner_id in (select learner_id from public.learner_access where parent_id = (select auth.uid()))
  );

drop policy if exists "lesson_feedback: sent for a learner you can reach" on public.lesson_feedback;
create policy "lesson_feedback: sent for a learner you can reach" on public.lesson_feedback
  for insert to authenticated
  with check (
    learner_id in (select id from public.learners where created_by = (select auth.uid()))
    or learner_id in (select learner_id from public.learner_access where parent_id = (select auth.uid()))
  );

notify pgrst, 'reload schema';
