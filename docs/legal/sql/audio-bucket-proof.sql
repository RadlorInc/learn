-- AUDIO BUCKET — PROOF, after the migration is applied (P1–P4) and after the real upload run (P5–P6).
-- Read-only: run in the Supabase SQL editor. Written 2026-09-26 for the audio bucket (docs/runbooks/audio-upload.md).
-- Expected values are written by hand from scripts/audio/manifest.json at commit time: 16,985 objects, 261,998,056 bytes.
begin transaction read only;

-- P1. The bucket, exactly as the migration made it.     expected: lesson-audio | true | 262144 | {audio/mpeg}
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'lesson-audio';

-- P2. Still no policy on storage.objects.               expected: 0
select count(*) as storage_object_policies from pg_policy where polrelid = 'storage.objects'::regclass;

-- P3. The migration is recorded.                        expected: 1
select count(*) from supabase_migrations.schema_migrations where version = '20260927100000';

-- ⚠️ THE CANARY (corrected 2026-09-27, after the first real upload read 16986 | 261998057 · 1 · 1 and was right): the
-- upload run also keeps `anon-probe-canary.mp3` (1 byte, `no-store`) in the bucket, for anon-probe.mjs to aim its delete
-- at. P4–P6 as first written counted it, so a CORRECT upload failed all three. It is excluded by name below and has its
-- own row (P7), so it cannot hide anything else: any other extra object still fails P4.
-- P4. Nothing but lesson audio can be in it: every object is `<16 hex>.mp3`.   expected: 0
select count(*) as badly_named from storage.objects
where bucket_id = 'lesson-audio' and name !~ '^[0-9a-f]{16}\.mp3$' and name <> 'anon-probe-canary.mp3';

-- P5. After the upload run: every manifest object is there.     expected: 17761 | 271459925
--     (2026-09-29, #329: the manifest names 16985 objects / 261964516 bytes; the bucket ALSO keeps the 776 objects of
--     the Story Problems lines that left the corpus, 9495409 bytes, because the upload never deletes. Before this upload
--     the same query read 16985 | 261998056.)
--     (before the upload run this is 0 | null — that is the "before" half of the same query)
select count(*) as objects, sum((metadata->>'size')::bigint) as bytes
from storage.objects where bucket_id = 'lesson-audio' and name <> 'anon-probe-canary.mp3';

-- P6. Every object was stored with the immutable cache header.   expected: 0
select count(*) as without_immutable_cache from storage.objects
where bucket_id = 'lesson-audio' and coalesce(metadata->>'cacheControl', '') not like '%immutable%'
  and name <> 'anon-probe-canary.mp3';

-- P7. The canary, after an upload run: one object, 1 byte, `no-store`.       expected: 1 | 1 | no-store
--     (before any upload run: 0 rows' worth — 0 | null | null)
select count(*) as canary, max((metadata->>'size')::bigint) as bytes, max(metadata->>'cacheControl') as cache
from storage.objects where bucket_id = 'lesson-audio' and name = 'anon-probe-canary.mp3';

-- CONTROL — the same shape of query sees objects that exist: P5 on another run must not return 0 once uploaded, and
-- this counts every object in every bucket (a number, never an error).
select count(*) as all_storage_objects from storage.objects;

rollback;
