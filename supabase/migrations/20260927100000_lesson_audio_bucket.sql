-- ════════════════════════════════════════════════════════════════════════════════════════════════════
-- LESSON AUDIO BUCKET — one public, read-only Storage bucket for the recorded lesson voice (Josh), so the
-- clips leave git and Vercel (founder's "Audio storage" loop, 2026-09-26; design in docs/legal/AUDIO-ROUND2.md).
-- ════════════════════════════════════════════════════════════════════════════════════════════════════
--
-- WHAT IT ADDS: ONE row in `storage.buckets` — `lesson-audio`, public, 256 KB per file (the largest clip is
-- 85 KB), `audio/mpeg` only. NO policy on `storage.objects`, NO function, NO grant, NO change to any existing
-- object. Nothing about a child is stored here: every object name is the first 16 hex of the SHA-256 of the
-- clip's bytes (`<hash>.mp3`), and the clips are lesson lines, identical for every child.
--
-- ⚠️ WHAT "PUBLIC" MEANS HERE, AND WHY THERE IS NO POLICY. A public bucket serves
-- `/storage/v1/object/public/lesson-audio/<name>` to anyone WITHOUT consulting RLS — that is the read path, by
-- exact URL only. Everything else (list, upload, overwrite, delete) goes through `storage.objects` RLS, and
-- with RLS on and NO policy for anon/authenticated, every one of those is refused (list answers an empty
-- array). The absence IS the mechanism — there is no predicate to get wrong. Uploads come only from the
-- `upload-audio` workflow with Storage S3 keys, which bypass RLS by design and exist only for that run.
--
-- ⚠️ THE CLOSING ASSERTION REFUSES TO APPLY IF ANY EXISTING storage.objects POLICY COULD REACH THIS BUCKET
-- FOR anon / authenticated / PUBLIC — i.e. a policy that names `lesson-audio`, or one that does not pin
-- `bucket_id` to a literal at all. The repo creates no storage policy, but the dashboard can; a broad one
-- ("authenticated may insert any object") would silently make this bucket writable. Better a failed
-- migration than a writable voice bucket.
--
-- DEPLOY ORDER: this first, then the upload, THEN the app change that reads from the bucket (a separate PR).
-- Applying this alone changes nothing a user can see.
--
-- ROLLBACK: `delete from storage.buckets where id = 'lesson-audio'` once the bucket is empty (empty it with
-- the same S3 keys). The app does not read it until the second PR ships.
-- ════════════════════════════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lesson-audio', 'lesson-audio', true, 262144, array['audio/mpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── closing assertions: the posture above, measured on what now exists ────────────────────────────────
do $$
declare
  b record;
  risky text;
begin
  select id, public, file_size_limit, allowed_mime_types into b from storage.buckets where id = 'lesson-audio';
  if not found then
    raise exception 'lesson-audio: bucket missing after insert — rolled back';
  end if;
  if b.public is distinct from true or b.file_size_limit is distinct from 262144
     or b.allowed_mime_types is distinct from array['audio/mpeg'] then
    raise exception 'lesson-audio: not public / 256 KB / audio/mpeg only (got %, %, %) — rolled back',
      b.public, b.file_size_limit, b.allowed_mime_types;
  end if;

  if not (select relrowsecurity from pg_class where oid = 'storage.objects'::regclass) then
    raise exception 'storage.objects has RLS OFF, so anon could write any bucket — rolled back';
  end if;

  -- A policy reaches this bucket for a client role if it applies to PUBLIC (polroles = {0}), anon or
  -- authenticated AND either names lesson-audio or pins no bucket_id literal at all.
  select string_agg(format('%I (%s)', p.polname, p.polcmd), ', ') into risky
  from pg_policy p
  where p.polrelid = 'storage.objects'::regclass
    and (p.polroles = '{0}'::oid[]
         or p.polroles && array(select oid from pg_roles where rolname in ('anon', 'authenticated')))
    and (
      coalesce(pg_get_expr(p.polqual, p.polrelid), '') || ' ' || coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '')
        ~ 'lesson-audio'
      or coalesce(pg_get_expr(p.polqual, p.polrelid), '') || ' ' || coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '')
        !~ 'bucket_id\s*=\s*''[^'']+''::text'
    );
  if risky is not null then
    raise exception 'lesson-audio: storage.objects policies could let anon/authenticated reach this bucket: % — rolled back', risky;
  end if;
end $$;

-- ── and BEHAVIOURALLY: the regex above is a proxy (a policy like `bucket_id = 'avatars' OR auth.role() =
-- 'authenticated'` pins a literal and still opens every bucket). So act as each client role, WITH its JWT claims set
-- (auth.role() reads them — without them a role-keyed policy looks shut when it is open), and try every door on a
-- control object. Everything below is undone before the migration ends; the bucket is left empty.
do $$
declare
  r text;
  n int;
begin
  perform set_config('storage.allow_delete_query', 'true', true);
  insert into storage.objects (bucket_id, name) values ('lesson-audio', 'migration-probe.mp3');
  foreach r in array array['anon', 'authenticated'] loop
    perform set_config('request.jwt.claims',
      json_build_object('role', r, 'sub', '00000000-0000-0000-0000-00000000a0d1')::text, true);
    execute format('set local role %I', r);
    select count(*) into n from storage.objects where bucket_id = 'lesson-audio';
    if n <> 0 then reset role; raise exception 'lesson-audio: % can LIST it (% rows) — rolled back', r, n; end if;
    begin
      insert into storage.objects (bucket_id, name) values ('lesson-audio', 'migration-probe-upload.mp3');
      reset role; raise exception 'lesson-audio: % can UPLOAD to it — rolled back', r;
    exception when insufficient_privilege then null;
    end;
    update storage.objects set metadata = '{}'::jsonb;          -- bare, as an attacker writes it
    get diagnostics n = row_count;
    if n <> 0 then reset role; raise exception 'lesson-audio: % can OVERWRITE % object(s) — rolled back', r, n; end if;
    delete from storage.objects;
    get diagnostics n = row_count;
    if n <> 0 then reset role; raise exception 'lesson-audio: % can DELETE % object(s) — rolled back', r, n; end if;
    reset role;
  end loop;
  perform set_config('request.jwt.claims', null, true);
  delete from storage.objects where bucket_id = 'lesson-audio' and name = 'migration-probe.mp3';
  perform set_config('storage.allow_delete_query', 'false', true);
end $$;
