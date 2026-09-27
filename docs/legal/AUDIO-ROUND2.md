# Audio storage — what the founder decides and does

Loop: "Audio storage" (26 Sep 2026). The recorded lesson voice (Josh) moves out of git and Vercel into ONE public
Supabase Storage bucket, `lesson-audio`. Record of the work: `docs/legal/LOOP-STATE.md` → **Audio storage**.

Three PRs, stacked, each a Draft. They merge **in this order and never out of it**:

| PR | what | changes what a child hears? |
|---|---|---|
| **A** `audio-bucket` | the bucket (migration), the manifest, the `upload-audio` workflow, the proof SQL | no — nothing reads the bucket yet |
| **B** `audio-from-bucket` | the app plays Josh from the bucket; Stevie + Teddy deleted; sw v240 | same clips, same timing; see §3 |
| **C** `audio-delete-old` | deletes Josh's old `public/audio/…` folder (kept one release for open tabs) | no |
| #233 rebuilt | KG–2 chapters, no audio in git (its 10,347 clips are already in A's manifest) | adds KG–2 |

---

## 1. What you must decide

> **DECIDED by the founder, 27 Sep 2026** (the "resume after Pro" brief) — the list below is kept as the reasoning:
> 1. Re-encode: **no.**
> 2. Upload keys: **Storage S3 access keys**, created by the founder just before the run and revoked right after it
>    (§2 steps 5 and 8).
> 3. §5 wording: **decided 27 Sep, applied in PR B** — §5.1 variant **(a) accept** (the KG–2 prefetch stays as built: it only
>    reduces what requests reveal, and the wording does not claim it); §5.2, §5.3 (the split cache row with
>    `milo-assets-audio`) and §5.4 as proposed; the Spanish drafts get the same edits and stay marked unreviewed; the
>    consent notice stays **notice-v6** (no bump).
> 4. PR C: **merges ≥ 48 h after PR B is live.**
> 5. KG–2 wrong-answer lines: **prefetch** — when a question loads, the clip of every option is fetched, with a test
>    that the requests are identical whichever option is tapped. Built in the rebuilt #233 (A, B and C do not play KG–2).
> 6. Supabase plan: not part of this brief.

1. **Re-encode? — recommendation: NO.** Every clip is already mono, 22.05 kHz, ~32 kbps MP3 (measured with `afinfo`
   on a sample of each voice; Josh averages 3.8 s and 15 KB). Opus would save ~20–25% (≈60 MB of 262 MB) and is the
   riskier format on older iPhones. Nothing was re-encoded, so there are no before/after samples; say so if you want them.
2. **Upload key type — recommendation: Storage S3 access keys, created just before the run and revoked right after.**
   The alternative, the service-role key, reaches the whole database. S3 keys reach Storage only — but ALL buckets in
   the project, bypassing RLS (Supabase's own warning). Buckets they could reach: in the repo, **only `lesson-audio`**
   (no migration creates any other, checked). Anything made by hand in the dashboard is invisible to the repo —
   **before-SQL B2 lists every bucket that exists; write them down before you create the keys.**
3. **Legal wording (§5) — needed before PR B merges.** PR B makes two published sentences false. It is blocked on this.
4. **When PR C merges** (deleting Josh's old same-origin files). Recommendation: **≥ 48 h after PR B is live.** Until
   then a tab or installed app still running the previous bundle keeps its voice; after it, such a tab hears the device
   voice until it reloads.
5. **KG–2 wrong-answer lines (privacy). Not blocking PR B, but it BLOCKS the §5.1 sentence: decide this first, then
   publish the §5.1 variant that matches.** Some KG–2 feedback lines are built from the option a child
   tapped ("That makes seventeen. I asked for twenty-one." — 1,595 such lines in Money; "That one is <what was
   tapped>…" another 464 across Numbers to 100, Colors and Patterns; counted 2026-09-27) and are recorded. The request names only a content hash, but
   anyone holding the public manifest could map a request in Supabase's logs to "this device chose 17". No identity is
   in it; today the same is true of Vercel's logs. Options: accept (recommended — bounded, no identity, same as today),
   or prefetch each question's whole feedback set so the request no longer depends on the choice (+egress), or speak
   those lines with the device voice.
   ✅ **Decided 27 Sep: prefetch — and the rebuilt #233 does it** (`openQuestion` in `src/infra/voiceClipPlayer.ts`). When
   a question loads (every scored round, and each chapter's guided round) the clip of every line it can lead to — each
   option's line, right and wrong, the praise, the encouragement, the re-teach when one can follow, the end card — is
   fetched into memory; while the question is open a line plays ONLY from that memory, and a line it was not given is
   spoken by the device voice and asks for nothing. So the requests are the same whichever option is tapped **by
   construction**, not because every chapter listed its lines: a line a chapter forgot costs Josh's voice, never a request.
   Proof: `questionLock.test.ts` (the player), `kg2IdenticalRequests.test.ts` (the founder's test: a real round, four
   nests, four identical request lists), `questionLines*.test.ts` (each chapter's lines, measured by rendering it).
   ⚠️ **What it does NOT hide, stated so §5.1 does not overclaim:** the NEXT question is chosen after the answer (the
   tier moves), so the sequence of questions a device asks for still follows how the child is doing; a re-teach's lines
   are fetched with the question only when the two answers before it were wrong; the end card comes sooner on a mastery
   finish. And ⚠️ **Grades 3–8 lessons are not covered**: Screen 8 fetches "Right!" or the worked example, and Screen 9
   its won / keep-going line, at the moment of the answer (`LessonPlayer.tsx`). The same `openQuestion` would cover them;
   not built — it was not in the decision.
6. **Supabase plan.** §4 — Pro covers even 10,000 families; the Free plan would not pass ~550.

## 2. What you do, in order

**0. Tell me the Vercel limit has cleared.** I then push, in this order: the tag `audio-src-josh-2026-09-26` (the ONLY
git ref that will hold the 10,347 KG–2 clips once #233 is rebuilt — it must be on GitHub before anything else), then
PR A, B, C as Drafts, then the rebuilt #233.

1. **Before-SQL** — `docs/legal/sql/audio-bucket-before.sql` (read-only). Expected: B1 0, B2 no rows (write down any
   bucket it lists — the S3 keys will reach it), B3 no rows, B4 true, B5 a number.
2. **Backup** — Actions → *Backup (prod database)* → Run. Green, with an artifact.
3. **Merge PR A.** Deploy runs; **approve `production-db`** for `migrate-prod`. The migration creates the bucket and, in
   the same transaction, refuses to apply if any policy could let `anon`/`authenticated` reach it (regex + a behavioural
   probe acting as each role). A red here means a dashboard policy — send me the run log; do not force it.
4. **Proof-SQL P1–P4** — `docs/legal/sql/audio-bucket-proof.sql`. Expected: `lesson-audio | true | 262144 | {audio/mpeg}`;
   0; 1; 0. (P5 reads `0 | null` before the upload.)
5. **Create the S3 keys** — Supabase → Project Settings → Storage → **S3 Connection** (turn "Enable connection via S3
   protocol" on if it is off) → *New access key*. On the same page, note the **Region**.
   GitHub → RadlorInc/learn → Settings → Environments → **production-db** → *Add environment secret*, twice:
   - `SUPABASE_S3_ACCESS_KEY_ID` = the Access Key ID
   - `SUPABASE_S3_SECRET_ACCESS_KEY` = the Secret Access Key
   (Names only here, never the values — I never need to see them.)
6. **Dry run** — Actions → *Upload audio* → Run workflow: branch **main**, mode **dry-run**, source_ref (default),
   region = the one you noted. Approve `production-db`. Expected last lines:
   `bucket: 0 objects; 0 of the manifest present and matching; 16985 missing; 0 not in this manifest; canary absent` ·
   `source: 16985 missing object(s) verified against the manifest` · `dry run: nothing uploaded`.
7. **Real run** — same, mode **upload**. Approve. Expected: `uploaded: 16985` · `verified: 16985 uploaded object(s) read
   back byte-identical; all 16985 manifest objects present and matching`, and the last step green with
   `GET: HTTP/2 200 · cache-control: public, max-age=31536000, immutable · content-type: audio/mpeg · access-control-allow-origin: *`
   and `Range: … 206 · missing name: <anything but 200>` (400 on the local stack).
8. **Revoke** — Supabase → S3 Connection → delete that access key. GitHub → production-db → delete both secrets.
9. **Proof-SQL P5–P6** — expected `16985 | 261998056` and `0`.
10. **The anon probe** (public key only — it is the key every browser already has):
    `SUPABASE_URL=https://<ref>.supabase.co SUPABASE_ANON_KEY=<the public anon key> node scripts/audio/anon-probe.mjs 31c72a780c71b280.mp3`
    → exit 0, `all refused (anon only): read-by-URL only`. It never changes a clip (it writes a clip's own bytes back and
    deletes only its canary). Add `SUPABASE_USER_JWT=<a test account's access token>` to probe signed-in users too.
11. **Approve §5's wording.** I apply it to PR B.
12. **Merge PR B** — rollback target recorded, production READY on the commit, then `npm run smoke:live`: it now also
    reads the live CSP's media-src and checks a real clip (200, audio/mpeg, immutable, 206 on Range, a made-up name ≠ 200).
13. **The live checks (§3).**
14. **≥ 48 h later: merge PR C.** Then the rebuilt #233 (its clips were uploaded in step 7).

**Future renders** (new or reworded lines): `docs/new-flow/voice.md` → *Rendering*. The short version: build the manifest
on the PR branch, push ONLY the new mp3s on an orphan branch tagged `audio-src-<date>` (that tag is also their backup),
then run `upload-audio` **from the PR branch** (not `main` — the workflow reads the manifest of the branch it runs on)
with `source_ref` = the tag: the dry run must say *N missing* where N is the number of new clips. Create and revoke the
S3 keys around it exactly as in steps 5 and 8. Merge the PR only after the upload says *all … present*.

## 3. Live checks (after PR B is live)

| # | check | expected |
|---|---|---|
| 1 | `curl -s -D - -o /dev/null https://<ref>.supabase.co/storage/v1/object/public/lesson-audio/31c72a780c71b280.mp3` | `200`, `cache-control: public, max-age=31536000, immutable`, `content-type: audio/mpeg` |
| 2 | the anon probe (step 10) | exit 0 — anon cannot list, upload, overwrite or delete |
| 3 | iPhone, Safari, signed in as a child: open a lesson, tap Screen 1's button | Josh speaks every line of Screens 2–7 |
| 4 | same lesson again | starts without a pause (clips come from the device) |
| 5 | airplane mode, open the NEXT topic (never opened before) | the device voice reads the lines — no silence, no error screen |
| 6 | desktop Chrome → DevTools → Network, filter `mp3` during a lesson | every clip from `<ref>.supabase.co/…/lesson-audio/<16 hex>.mp3`; none from `/audio/`; nothing with `IvUJ` or `XjGY` |
| 7 | DevTools → Console during a lesson | no CSP error, no 404 |
| 8 | DevTools → Application → Cache Storage | `milo-assets-audio` holds the lesson's clips (≤ 2,000) |

## 4. Egress, and when Supabase Pro matters

Measured: Josh's lesson audio is 130 MB over 282 topics, so a lesson played in full is **≈ 0.46 MB**. KG–2 story sittings
(5 questions) are estimated at ≤ 1 MB (not measured). Assumptions: 1.5 children per family, 12 sessions per child per
month, 0.5 MB per session, no caching counted (the device caches every clip, so repeats are free — this is a ceiling).

| families | audio egress / month |
|---|---|
| 50 | ≈ 0.45 GB |
| 1,000 | ≈ 9 GB |
| 10,000 | ≈ 90 GB |

Supabase quotas (docs, 26 Sep 2026): **Free 5 GB + 5 GB cached; Pro 250 GB + 250 GB**, then $0.09 / GB uncached,
$0.03 / GB cached. On Free, audio alone passes 5 GB at ≈ 550 families. On Pro, 10,000 families is ≈ 36% of the uncached
quota even before caching. The project is on Pro per earlier notes (I have not re-checked — no production queries).

**Service-worker cap** (you asked): **2,000 clips**, oldest stored first out, in a cache (`milo-assets-audio`) that app
updates no longer wipe. Why 2,000: one grade's lessons are 932–1,330 clips (19–27 MB); 2,000 holds the grade a child is
on plus the previous one's review, ≈ 40 MB at the ~20 KB a Josh clip averages — well inside what phones give a site,
and never unbounded (all 16,985 clips are 262 MB).

## 5. Wording that changes (proposed — NOT applied)

PR B makes these published sentences false. Proposed replacements (English; Spanish follows the same edit in
`docs/legal/es/07-subprocessors.md:35` and `es/08-cookie-and-tracking-notice.md:27` — I will translate them the same way):

1. **`docs/legal/07-subprocessors.md:30`** — now: *"…every audio clip a child hears is a static file served from our own
   domain, and where a clip is missing the fallback is the browser's own on-device speech."*
   → **depends on §1 item 5 — use the variant that matches what is built:**
   - **(b) prefetch (what the rebuilt #233 does, decided 27 Sep) — true only once the lessons' Screens 8–9 are covered
     too (§1 item 5):** **"…every audio clip a child hears is a pre-recorded file, the same for every child, served from
     the file storage of our database provider (Supabase, listed above). The request for a clip names only the recording
     — never the child or the account — and a question's recordings are all fetched when the question appears, so which
     answer a child picks is not in the requests; which questions come next still follows how the child is doing. Where a
     clip is missing the fallback is the browser's own on-device speech."** Until the lessons are covered, use (a).
   - **(a) accept:** **"…every audio clip a child hears is a pre-recorded file, the same for
     every child, served from the file storage of our database provider (Supabase, listed above). The request for a clip
     names only the recording — never the child or the account. Some recordings are feedback on an answer (for example
     "Not quite"), so which clips a device asks for can reflect how a question went, but not who answered. Where a clip
     is missing the fallback is the browser's own on-device speech."**
   - **(c) device voice for every feedback line (needs a code change first — not built):** the sentence as first
     proposed, *"…The request for a clip names only the recording — never the child, the account or an answer — …"*.
     ⚠️ Not with (b): (b) hides the answer to a question, not how the child is doing across questions.
2. **`07-subprocessors.md:19`** (Supabase row, "What it does") — add: *"…file storage, **including serving the
   pre-recorded lesson audio**."* No change to the data column: no child data is stored there.
3. **`docs/legal/08-cookie-and-tracking-notice.md:21`** — now one row for `milo-shell, milo-static, milo-assets` kept
   *"Until the app updates to a new version"*. Split it:
   - `milo-shell`, `milo-static`, `milo-assets-<version>` | Cache storage | The app itself and its images, so lessons
     work offline and use less data | Until the app updates to a new version | Strictly necessary
   - **`milo-assets-audio`** | Cache storage | **Recorded lesson audio — the same clips for every child, nothing about
     your child — so lessons work offline and use less data. At most 2,000 clips (about 40 MB); the oldest are removed
     first** | **Kept across app updates until removed by the browser, or when you clear this site's data** | Strictly necessary
4. **`07-subprocessors.md:6`** "Last reviewed" → the merge date; and `READINESS.md:31` "one origin" → "our own origin
   and our own Supabase project (lesson audio, since <date>)".

**Not changing:** the consent notice (`02`, notice-v6) — its sentences stay true for Supabase; an edit would force
notice-v7 for families mid-beta. **An R2 move (§6) is different:** a new company receives the child's IP address, so
07, 08, the privacy policy's recipients and the consent notice's "every outside company" all change, and the attorney
decides whether existing consents must be re-asked.

## 6. Moving to Cloudflare R2 later (the "one value")

The app: set `NEXT_PUBLIC_AUDIO_BASE_URL` in Vercel to the R2 public base — the player, the CSP (media-src +
connect-src) and the service worker (which matches the content-hash name, not the host) follow it. Before that:
1. create the R2 bucket, public read, no listing; 2. run `upload-audio` with `s3_endpoint`, `region`, `public_base` set
and R2 keys in the two secrets (revoke after); 3. `SMOKE_AUDIO_BASE=<R2 base> npm run smoke:live`; 4. the legal changes
in §5's last paragraph — **before** the value changes, because the value change IS the moment a new company is involved.

## 7. Listening sample (N29)

`/Users/mrk/milo_react/_audio-listen/index.html` — 30 random clips per grade (KG–8, fixed seed, list saved next to it),
the lesson text beside each clip, a "sounds wrong" checkbox, and a button that saves `listening-results.json` for you
to send back. Open it by double-clicking; it plays from the local copy, not the internet.
