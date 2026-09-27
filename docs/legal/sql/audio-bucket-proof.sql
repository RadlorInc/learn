-- AUDIO BUCKET — PROOF, after the migration is applied (P1–P4) and after the real upload run (P5–P6).
-- Read-only: run in the Supabase SQL editor. Written 2026-09-26 for docs/legal/AUDIO-ROUND2.md.
-- Expected values are written by hand from scripts/audio/manifest.json at commit time: 16,985 objects, 261,998,056 bytes.
begin transaction read only;

-- P1. The bucket, exactly as the migration made it.     expected: lesson-audio | true | 262144 | {audio/mpeg}
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'lesson-audio';

-- P2. Still no policy on storage.objects.               expected: 0
select count(*) as storage_object_policies from pg_policy where polrelid = 'storage.objects'::regclass;

-- P3. The migration is recorded.                        expected: 1
select count(*) from supabase_migrations.schema_migrations where version = '20260927100000';

-- P4. Nothing but lesson audio can be in it: every object is `<16 hex>.mp3`.   expected: 0
select count(*) as badly_named from storage.objects
where bucket_id = 'lesson-audio' and name !~ '^[0-9a-f]{16}\.mp3$';

-- P5. After the upload run: every manifest object is there.     expected: 16985 | 261998056
--     (before the upload run this is 0 | null — that is the "before" half of the same query)
select count(*) as objects, sum((metadata->>'size')::bigint) as bytes
from storage.objects where bucket_id = 'lesson-audio';

-- P6. Every object was stored with the immutable cache header.   expected: 0
select count(*) as without_immutable_cache from storage.objects
where bucket_id = 'lesson-audio' and coalesce(metadata->>'cacheControl', '') not like '%immutable%';

-- CONTROL — the same shape of query sees objects that exist: P5 on another run must not return 0 once uploaded, and
-- this counts every object in every bucket (a number, never an error).
select count(*) as all_storage_objects from storage.objects;

rollback;
