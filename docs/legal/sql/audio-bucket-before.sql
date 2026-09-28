-- AUDIO BUCKET — BEFORE merging part 1 (migration 20260927100000). Read-only: run in the Supabase SQL editor.
-- Written 2026-09-26 for the audio bucket (docs/runbooks/audio-upload.md). Every query reads catalog/storage metadata only; nothing about a
-- child. Expected results are written next to each query, and the last query is the control.
begin transaction read only;

-- B1. The bucket does not exist yet.                                  expected: 0
select count(*) as lesson_audio_buckets from storage.buckets where id = 'lesson-audio';

-- B2. Every bucket that exists today (the S3 keys you create later reach ALL of these).
--     The repo creates none, so anything listed here was made in the dashboard.  expected: 0 rows (write down any)
select id, public, file_size_limit, created_at from storage.buckets order by created_at;

-- B3. Any policy on storage.objects. The migration refuses to apply if one could reach the new bucket for anon or
--     authenticated.                                                    expected: 0 rows
select p.polname, p.polcmd,
       array(select rolname from pg_roles where oid = any(p.polroles)) as roles,
       pg_get_expr(p.polqual, p.polrelid) as using_expr, pg_get_expr(p.polwithcheck, p.polrelid) as check_expr
from pg_policy p where p.polrelid = 'storage.objects'::regclass order by 1;

-- B4. RLS is on for storage.objects.                                   expected: true
select relrowsecurity from pg_class where oid = 'storage.objects'::regclass;

-- B5. CONTROL — this connection can see storage at all (a count of every object, any bucket). expected: a number,
--     not an error. If B1–B4 came back empty AND this errors, the queries above saw nothing and prove nothing.
select count(*) as all_storage_objects from storage.objects;

rollback;
