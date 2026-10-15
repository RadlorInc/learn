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

-- P5. After the upload run: every manifest object is there.     expected: 18606 | 288280107
--     (2026-10-15, tester batch C, tag audio-src-josh-2026-10-15c: 342 objects, 7143931 bytes — 14 reworded lines and
--     328 Screen 9 stickers. Before this run P5 should read 18264 | 281136176, the #437 value below; a different
--     "before" means another upload ran, and the after is before + 342.)
--     (2026-10-15, #416 + tester batch B, tag audio-src-josh-2026-10-15: 222 objects, 5942765 bytes — #416's number
--     re-renders and batch B's 39 new or re-rendered lines. Before this run P5 should read the 12 Oct value below,
--     18042 | 275193411, if no upload ran since; a different "before" means one did, and the after is before + 222.)
--     (read by the founder after #425's upload, 2026-10-12: 18042 | 275193411, so before it 18041 | 275178138; P7: 1 | 1 | no-store)
--     (2026-10-12, #425: its dry run (run 38195871791) listed 18042 objects = 16984 of the manifest + 1057 older ones +
--     the canary, so before this run P5 reads 18041 (uploads ran after #413); this run adds 1 object, 15273 bytes: the KG–2 take line "You did it! 5 questions solved. You're
--     getting stronger!" (1g6guhs → 99106db90a5e9e79.mp3). The old line's clip stays in the bucket.)
--     (2026-10-11, #423: run 38140569672 added 13 objects, 261236 bytes: the dot-plot lines of g6m7 (12) and g7m5 (1).
--     P5 went from 18028 | 274916902 to 18041 | 275178138, the "before" #425 derives from the founder's read. The dry run's
--     18029 / 18042 counts include the canary, which P5 leaves out. The 13 old clips stay in the bucket.)
--     (2026-10-09, #413: before this run the bucket should read 18027 | 274844265; this run adds 1 object, 72637
--     bytes, g6m4-t7's Screen 1 with what interest is. The old line's clip stays in the bucket.)
--     (2026-10-08, #407: the bucket read 18026 | 274803288 after #386's 142-clip upload (6 Oct); this run adds 1 object,
--     40977 bytes, g6m1-t5's new big idea. The old line's clip stays in the bucket: the upload never deletes.)
--     (2026-10-06, #386: the manifest still names 16985 objects. The run adds 142 objects, 1737876 bytes: 4 for the
--     watermelon / cat / pumpkins lines, 5 for g6m2-t7's pencils and erasers, 133 for StoryTime's rabbits. The dog,
--     puppy and hot-dog clips they replace stay in the bucket, because the upload never deletes. Before this upload
--     the same query read 17884 | 273065412.)
--     (2026-10-02, #329: the manifest names 16985 objects / 262060131 bytes; the bucket ALSO keeps the 899 objects of
--     the lines that left the corpus (Story Problems' fish, shark, duck …, and the 123 lines the new Grade 2 ones replaced),
--     11005281 bytes, because the upload never deletes. Before this upload the same query read 16985 | 261998056;
--     the run adds 899 objects, 11067356 bytes: the 776 Story Problems clips and the 123 snail/grasshopper clips.)
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
