# Runbook: lesson audio upload

**Use this when:** recorded clips must reach the `lesson-audio` bucket. That means a new or reworded lesson line, a re-render, or a move to another host.

## How the audio is stored

- **One public Supabase Storage bucket, `lesson-audio`.** It was created by `supabase/migrations/20260927100000_lesson_audio_bucket.sql` with these settings:
  - public read by exact URL;
  - 256 KB file limit;
  - `audio/mpeg` only;
  - **no `storage.objects` policy**, so listing, uploading, overwriting and deleting are refused for `anon` and `authenticated`.
- **Object name = first 16 hex of the clip's SHA-256** + `.mp3`, cached `immutable` for a year. A URL says nothing about a child; a re-render gets a new name.
- **Clips are not in git.**
  - `scripts/audio/manifest.json` records which line is which object: name, SHA-256, MD5, bytes.
  - Each module and KG–2 chapter carries a small index (`src/features/lessons/voice-index/`, `src/features/chapters/voice-index/`).
  - The player plays a clip only when the line's key **and** check match.
- **CI refuses a spoken line with no clip.** `src/__tests__/lessonVoiceClips.test.ts` goes red, so a new or reworded line cannot merge without its clip.
- **The one config value.** `src/core/audioBase.ts` reads `NEXT_PUBLIC_AUDIO_BASE_URL`. If it is unset, it uses `<NEXT_PUBLIC_SUPABASE_URL>/storage/v1/object/public/lesson-audio`. The player and the CSP (`media-src`, `connect-src`) follow it. Moving host = re-upload, then this value.

## A new or reworded line gets its clip

1. **Agent — rebuild the corpus** with `npx tsx scripts/lesson-voice-corpus.mts`. A row is "rendered" when its key is already in the manifest.
2. **Agent — render the missing rows** with `python3 scripts/kaggle-josh-notebook.py <grade|module> <branch>` (KG–2 chapters: `scripts/kaggle-josh-chapters-notebook.py`). It writes a notebook for rows not in the manifest only. To re-render clips that already exist (a bad render), `python3 scripts/kaggle-josh-notebook.py redo <branch> <keys.txt>` renders exactly those keys; park their old mp3s outside the repo first, never delete them.
3. **Agent — merge the clips and rebuild the manifest.**
   - Run `unzip -n <zip> -d audio-src/`. `audio-src/` is gitignored; on a fresh machine, fill it first with `AUDIO_BASE_URL=<bucket base> node scripts/audio/fetch-src.mjs`.
   - **Hear the new clips back before anything else:** `<venv>/bin/python scripts/audio/check-numbers.py <dir of the new mp3s>`. It must exit 0. Exit 1 lists clips whose spoken numbers differ from their line (re-render them; a line the model misreads three times running gets commas in its `say` row); exit 2 means it could not look. Why: given digits, the voice model dropped words inside numbers (184 → "one hundred four") in about 180 clips (9 Oct 2026); lines now reach it as words, and this is the check that they came out right.
   - Then run `node scripts/audio/build-manifest.mjs`. It fails on a missing clip, an orphan, a duplicate key or a name collision.
   - Commit the manifest and both `voice-index/` folders on the PR branch.
   - For a lesson line with chalk, give its marks real timing: `<venv>/bin/python scripts/audio/whisper-word-times.py` (faster-whisper, local; only new clips are transcribed), then `npx tsx scripts/audio/build-word-times.mts`, and commit `src/features/lessons/word-times/`. Skipped, the new line's marks keep the length estimate.
4. **Agent — put only the new mp3s on a side ref.** That is an orphan-branch commit holding them under the voice folder `upload-audio.yml` reads (see its *Fetch* step), tagged `audio-src-<date>` and pushed. A tag does not deploy, and it is also the clips' backup.
5. **Upload** (next section) **from the PR branch**, with `source_ref` = that tag. Not from `main`: the workflow uploads what **its own branch's** manifest names, so a run from `main` finds nothing missing and goes green having uploaded nothing.
6. **Founder — merge the PR** only after the upload run ends "all N manifest objects present", where N is that branch's manifest count.

## The upload run

1. **Founder — create short-lived S3 keys** just before the run:
   - Supabase → Project Settings → Storage → **S3 Connection** → *New access key*, and note the Region shown there.
   - Add them to GitHub → Settings → Environments → `production-db` as `SUPABASE_S3_ACCESS_KEY_ID` and `SUPABASE_S3_SECRET_ACCESS_KEY`.

   These keys reach every bucket and bypass RLS. That is why they exist only for the run. The agent never sees the values.
2. **Agent or founder — dry run.**
   ```bash
   gh workflow run upload-audio.yml --ref <branch> -f mode=dry-run -f source_ref=<tag> -f region=<region>
   ```
   **Founder** checks it is *Upload audio* on the expected branch, then approves `production-db`. The dry run must report exactly as many *missing* objects as there are new clips.
3. **Upload.** Same command with `-f mode=upload`, and the **founder** approves again. The job:
   - checks the ref against `scripts/assert-prod-ref.sh`;
   - checks every source file's SHA-256 against the manifest;
   - uploads only what the bucket lacks, and never overwrites;
   - reads each new object back byte-for-byte;
   - checks that one clip answers 200 with the immutable header, `audio/mpeg`, CORS, and 206 on a Range request, and that a made-up name does **not** answer 200.

   `upload.py` exits 0 done, 1 defect, 2 could not look, and prints counts only.
4. **Founder — revoke the keys** right after: delete the access key in Supabase, then delete both secrets in `production-db`.
5. **Founder — run the proof-SQL**, `docs/legal/sql/audio-bucket-proof.sql`, in the SQL editor:
   P1–P4: bucket shape, no policy, ledger, no badly named object. P5–P6: count and bytes equal the manifest, all immutable. P7: the probe's canary. Update P5's expected numbers in the PR when the manifest grows.
6. **Agent or founder — anon probe**, using only the public anon key every browser already has:
   ```bash
   SUPABASE_URL=https://<project>.supabase.co SUPABASE_ANON_KEY=<public anon key> \
     node scripts/audio/anon-probe.mjs <an object name from the manifest>
   ```
   Expect exit 0, "read-by-URL only" (1 = a door is open, 2 = could not look). It never changes a clip: overwrites write the clip's own bytes; deletes aim at `anon-probe-canary.mp3`.
7. **Agent — after the app deploy:** run `npm run smoke:live`. Its `audio` check reads the live CSP and fetches a real clip.

## Moving the audio to another host (for example Cloudflare R2)

1. **Founder.** Create the bucket there: public read, no listing.
2. **Agent or founder.** Run `upload-audio.yml` with `s3_endpoint`, `region` and `public_base` set, and that host's keys in the same two secrets. Revoke them afterwards.
3. **Agent.** Run `SMOKE_AUDIO_BASE=<new base> npm run smoke:live`.
4. **Founder.** Update the subprocessor and cookie notices **before** the switch, because a new company then receives children's IP addresses. See [../legal/07-subprocessors.md](../legal/07-subprocessors.md) and [../decisions.md](../decisions.md).
5. **Founder.** Set `NEXT_PUBLIC_AUDIO_BASE_URL` in Vercel, then redeploy. The value binds at deploy time.
