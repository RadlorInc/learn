-- WHY DID THE PREREQUISITE CARD NOT SHOW? (read-only; for the founder to run in the SQL editor)
-- Replace the two topic ids: :prev = the topic before, :next = the topic the child opened. Rows: every child with
-- progress on either topic in the last 12 hours. Names are not selected; the id is shortened.
--
-- How to read it (the card's rules, src/features/lessons/nudge.ts):
--   prev_progress  = level / ladder levels (5 for most topics); mastered = 1. The card needs < 0.5 → level 0, 1 or 2.
--   next_due_date  = set → the topic is ASSIGNED → no card (since 2026-09-24; a list alone no longer counts).
--   prev_on_list   = false while has_list = true → the previous topic is not on the child's map → no card.
--   next_asked > 0 = the child already started the next topic → no card (never mid-session).
--   Not visible here: "once per day" lives on the device only.
with t as (select 'g3m1-t2'::text as prev, 'g3m1-t3'::text as next)
select left(l.id::text, 8)                                              as kid,
       p.level as prev_level, p.mastered as prev_mastered, (p.run->>'asked')::int as prev_asked,
       case when p.mastered then 1 else round(coalesce(p.level, 0) / 5.0, 2) end as prev_progress_if_5_levels,
       (select (n.run->>'asked')::int from public.lesson_progress n where n.learner_id = l.id and n.lesson_id = t.next) as next_asked,
       coalesce(cardinality(l.lesson_ids), 0) > 0                        as has_list,
       t.prev = any(coalesce(l.lesson_ids, '{}'))                        as prev_on_list,
       t.next = any(coalesce(l.lesson_ids, '{}'))                        as next_on_list,
       l.lesson_due ->> t.next                                           as next_due_date,
       l.grade_id is not null                                            as in_a_class
from t
join public.lesson_progress p on p.lesson_id = t.prev
join public.learners l on l.id = p.learner_id
where p.updated_at > now() - interval '12 hours'
order by p.updated_at desc
limit 20;
