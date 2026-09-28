-- The game (BlockCraft, on /play) is saved to the child's ACCOUNT, so when game time runs out — or the child closes
-- it — the next session starts where the last one stopped, on any device. Founder's call, 2026-09-19:
-- "jab time complete ho jaaega toh jahan se game close hua hai wahi se start ho", and "Account par (har device)".
--
-- One row per child: the whole save as JSON (the game stores only the blocks the child changed, so a real save is a
-- few KB; the cap is 2 MB). The page also keeps a copy on the device and uses whichever is newer (`data.savedAt`),
-- so a save made offline, or in the second before a tab closed, is not lost.
--
-- WHO MAY DO WHAT (enforced here):
--   SELECT / INSERT / UPDATE — anyone with a learner_access row for that child: the child's own login, the parent
--   who owns them, a co-parent. Same reach as `lesson_progress` reads. Nobody else, and never anon.
--   DELETE — nobody from a browser; the row goes with the learner (on delete cascade).
-- A game save is not an authorisation decision: nothing privileged reads it, so a child editing their own save
-- by hand gains nothing but a different world.
--
-- ⚠️ DEPLOY ORDER: SAFE EITHER WAY. The page tolerates the table being absent (the save stays on the device), but
-- apply it before merging so saves follow the account from the first game. No SECURITY DEFINER, no function.
-- Rollback: drop table public.game_saves.

create table if not exists public.game_saves (
  learner_id  uuid primary key references public.learners(id) on delete cascade,
  data        jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 2000000)
);

alter table public.game_saves enable row level security;
revoke all on public.game_saves from public, anon, authenticated;
grant select on public.game_saves to authenticated;
-- learner_id is in the UPDATE grant because PostgREST's upsert writes every column it was given.
grant insert (learner_id, data), update (learner_id, data) on public.game_saves to authenticated;

drop policy if exists "game_saves: the child's family reads" on public.game_saves;
create policy "game_saves: the child's family reads" on public.game_saves for select to authenticated
  using (learner_id in (select learner_id from public.learner_access where parent_id = (select auth.uid())));

drop policy if exists "game_saves: the child's family saves" on public.game_saves;
create policy "game_saves: the child's family saves" on public.game_saves for insert to authenticated
  with check (learner_id in (select learner_id from public.learner_access where parent_id = (select auth.uid())));

drop policy if exists "game_saves: the child's family updates" on public.game_saves;
create policy "game_saves: the child's family updates" on public.game_saves for update to authenticated
  using (learner_id in (select learner_id from public.learner_access where parent_id = (select auth.uid())));
-- No WITH CHECK: Postgres applies USING to the new row as well, so moving a save onto a child the account cannot
-- reach is refused by the same predicate (tested).
