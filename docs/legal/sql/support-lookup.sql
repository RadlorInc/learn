-- SUPPORT LOOKUP: ONE FAMILY (read-only; the founder runs it in the Supabase SQL editor — the agent never does)
-- Used from docs/runbooks/support.md step 5 (Agent). Billing has its own file (billing-lookup.sql); this one does not read it.
--
-- Fill ONE placeholder, '<account email>' (the verified address the parent wrote from), in the `acct` line of each
-- query, and run the queries one at a time. Nothing here writes. Names, emails and answers are not selected: an
-- account and a child are shown by the first 8 characters of their id, enough to match lines across queries.
-- Paste the output to the agent in chat only, never into a PR, issue or file (support.md step 2).
--
-- Every table and column below is read from supabase/migrations (and the baseline), checked on a local stack built
-- from them on 2026-10-05.

-- ── 1. The account ────────────────────────────────────────────────────────────────────────────────────────────────
-- Answers: is there an account at this address, and what kind?
--   no row              → no account uses this exact address. Ask whether they signed up with another one (Google?).
--   confirmed = false   → the address was never confirmed: no consent can be granted, no child can be added; the
--                         nightly prune deletes it 3 days after sign-up if nothing else exists.
--   last_sign_in        → when the adult last signed in (null: never).
--   role                → the label they picked (parent/teacher). It grants nothing; it explains which screens they see.
--   is_admin            → true only for the founder's own account.
--   child_login         → true means this address is a child's own sign-in, not an adult: stop and ask.
with acct as (select id from auth.users where lower(email) = lower(btrim('<account email>')))
select left(u.id::text, 8)                                     as account,
       u.id                                                    as account_id_for_the_next_steps,
       u.email_confirmed_at is not null                        as confirmed,
       u.created_at::date                                      as signed_up,
       u.last_sign_in_at                                       as last_sign_in,
       u.banned_until                                          as banned_until,
       p.role                                                  as role,
       exists (select 1 from public.admin_users a where a.user_id = u.id)                              as is_admin,
       exists (select 1 from public.learner_access la where la.parent_id = u.id and la.access_role = 'self') as child_login
from acct join auth.users u on u.id = acct.id
left join public.profiles p on p.id = u.id;

-- ── 2. Their children, and every adult who can see each one ───────────────────────────────────────────────────────
-- Answers: which children does this account reach, and how?
--   my_role = owner     → this account added the child (it can edit, delete, export).
--   my_role = viewer    → an invite from another adult; the child belongs to that account.
--   no rows             → no child on this account (a withdrawal or deletion? see query 7).
--   own_login           → the child has their own username sign-in.
--   viewers             → other adults with access (invites accepted).
--   age_group           → 3-5 = KG, 6-8 = Grades 1–2, 9-11 = Grades 3–5, 12-14 = Grades 6–8.
--   in_a_class          → the child is on a teacher's class roster.
with acct as (select id from auth.users where lower(email) = lower(btrim('<account email>')))
select left(l.id::text, 8)                                     as child,
       l.id                                                    as learner_id_for_the_next_steps,
       la.access_role                                          as my_role,
       l.age_group,
       l.created_at::date                                      as added,
       l.grade_id is not null                                  as in_a_class,
       coalesce(cardinality(l.lesson_ids), 0)                  as topics_picked,
       exists (select 1 from public.learner_access s where s.learner_id = l.id and s.access_role = 'self')    as own_login,
       (select count(*) from public.learner_access v where v.learner_id = l.id and v.access_role = 'viewer')  as viewers
from acct
join public.learner_access la on la.parent_id = acct.id and la.access_role in ('owner', 'viewer')
join public.learners l on l.id = la.learner_id
order by l.created_at;

-- ── 3. Progress and last activity, per child ──────────────────────────────────────────────────────────────────────
-- Answers: has the server received this child's work, and when last?
--   topics / chapters   → rows in lesson_progress for Grade 3–8 topics, and for KG–2 chapters (`c:` ids).
--   last_answer         → the newest answer the server holds. Older than the parent says they played → the work is
--                         still on the device (the diagnostic block's `unsynced` line), or it was refused (query 5).
--   points / last_point → points earned (all time) and the newest point row.
--   last_story_event    → KG–2 chapter telemetry (kept 90 days).
--   last_class_result   → class exercise results uploaded.
--   game_time_on        → game_settings.enabled (null: never set).
with acct as (select id from auth.users where lower(email) = lower(btrim('<account email>')))
select left(l.id::text, 8)                                                                                  as child,
       (select count(*) from public.lesson_progress p where p.learner_id = l.id and p.lesson_id not like 'c:%') as topics,
       (select count(*) from public.lesson_progress p where p.learner_id = l.id and p.lesson_id like 'c:%')     as chapters,
       (select count(*) from public.lesson_progress p where p.learner_id = l.id and p.mastered)                 as mastered,
       (select max(coalesce(p.answered_at, p.updated_at)) from public.lesson_progress p where p.learner_id = l.id) as last_answer,
       (select coalesce(sum(e.points), 0) from public.point_events e where e.learner_id = l.id)               as points,
       (select max(e.created_at) from public.point_events e where e.learner_id = l.id)                         as last_point,
       (select max(e.created_at) from public.learner_events e where e.learner_id = l.id)                       as last_story_event,
       (select max(x.created_at) from public.exercise_results x where x.learner_id = l.id)                     as last_class_result,
       (select g.enabled from public.game_settings g where g.learner_id = l.id)                                as game_time_on
from acct
join public.learner_access la on la.parent_id = acct.id and la.access_role in ('owner', 'viewer')
join public.learners l on l.id = la.learner_id
order by l.created_at;

-- ── 4. Crash records, last 7 days, per child ──────────────────────────────────────────────────────────────────────
-- Answers: did the app report an error for this child this week? (error_events carries a child id, never an account
-- id, so a crash before any child is chosen is not findable here — use the diagnostic block's `recent errors`.)
--   source = client     → the browser reported it (a crash on screen); server → an API route failed.
--   route_path / url    → where it happened. message is capped at 500 characters and holds no answers.
--   no rows             → nothing reported for these children in 7 days (records are kept 90 days).
with acct as (select id from auth.users where lower(email) = lower(btrim('<account email>')))
select left(e.learner_id::text, 8) as child, e.at, e.source, e.route_path, left(e.message, 200) as message, e.digest
from acct
join public.learner_access la on la.parent_id = acct.id and la.access_role in ('owner', 'viewer')
join public.error_events e on e.learner_id = la.learner_id
where e.at > now() - interval '7 days'
order by e.at desc
limit 50;

-- ── 5. Consent ────────────────────────────────────────────────────────────────────────────────────────────────────
-- Answers: may this account's children's work be stored? (architecture.md §5)
--   state = granted and notice_is_current = true → consent is in place.
--   state = pending     → the parent has not clicked the email yet; request_email_sent = when it went out
--                         (null: it never went — check Resend). It expires 7 days after it was requested.
--   state = withdrawn / declined / expired → no child can be added or saved until they consent again.
--   notice_is_current = false → they agreed to an older notice; a KG–2 child is refused until they agree to the
--                         current one (Grade 3–8 children are unaffected).
--   second_email_due    → when the second email (with the withdraw link) is scheduled.
with acct as (select id from auth.users where lower(email) = lower(btrim('<account email>')))
select left(c.id::text, 8) as consent, c.scope, c.state, c.notice_version,
       public.consent_is_current(c.notice_version)            as notice_is_current,
       c.requested_at, c.request_email_sent_at is not null    as request_email_sent,
       c.confirmed_at, c.withdrawn_at, c.declined_at, c.expires_at,
       c.second_notice_scheduled_for                          as second_email_due
from acct join public.parental_consents c on c.parent_id = acct.id
order by c.created_at desc;

-- … and per child: would a save for this child pass the consent gate right now?
--   consent_ok = false  → every upload for that child is refused (P0C01): the child sees "ask a grown-up", the work
--                         waits on the device, and it uploads once the parent consents.
with acct as (select id from auth.users where lower(email) = lower(btrim('<account email>')))
select left(l.id::text, 8) as child, l.attested_notice_version, public.consent_ok(l.id) as consent_ok
from acct
join public.learner_access la on la.parent_id = acct.id and la.access_role = 'owner'
join public.learners l on l.id = la.learner_id;

-- ── 6. Parent PIN, and teacher plan ───────────────────────────────────────────────────────────────────────────────
-- Answers: is the dashboard PIN set or locked, and is this a teacher on a paid plan? The PIN's salt and hash are
-- never selected.
--   pin_set = false     → no PIN: the dashboard asks them to choose one on the next visit.
--   locked_until future → 5 wrong tries locked it (15 min, doubling per lock, up to 24 h). Clear it with
--                         support.md "Parent PIN locked or forgotten".
--   reset_takes_effect  → they pressed "Forgot PIN": the PIN is removed then; a right PIN before then cancels it.
--   teacher_plan        → null: no teacher plan row; true/false: teacher_plans.paid (modules vs exercises only).
--   classes             → classes (grades) this account created.
with acct as (select id from auth.users where lower(email) = lower(btrim('<account email>')))
select pp.account_id is not null                                as pin_set,
       pp.failed_count                                         as wrong_tries_since_last_lock,
       pp.lockouts,
       pp.locked_until,
       pp.reset_requested_at + interval '24 hours'             as reset_takes_effect,
       (select tp.paid from public.teacher_plans tp where tp.teacher_id = acct.id) as teacher_plan,
       (select count(*) from public.grades g where g.created_by = acct.id)        as classes
from acct left join public.parent_pins pp on pp.account_id = acct.id;

-- ── 7. Deletions recorded for this account ────────────────────────────────────────────────────────────────────────
-- Answers: "my child disappeared" — was a child deleted, by which path, and when? (ids and counts only)
--   path = delete_child / withdraw_consent_* → deleted from the dashboard or by a withdrawal. Never restored from a
--                         backup (data-requests.md).
--   actor_kind = user   → a signed-in adult did it; service → an operator in the SQL editor; system → a scheduled job.
with acct as (select id from auth.users where lower(email) = lower(btrim('<account email>')))
select d.at, d.path, d.actor_kind, d.actor_id = acct.id as by_this_account, cardinality(d.learner_ids) as children,
       d.row_counts
from acct join public.deletion_log d on d.account_id = acct.id
order by d.at desc
limit 20;
