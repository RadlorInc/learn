#!/usr/bin/env python3
"""
Put the recorded clips named in scripts/audio/manifest.json into the audio bucket — ONLY the ones it does not have yet —
and prove every manifest object is there, byte-for-byte.

Run by .github/workflows/upload-audio.yml (production, founder-approved) and against the local stack for rehearsal.
Speaks plain S3, so the same script serves Supabase Storage today and Cloudflare R2 later (endpoint + keys change).

  python3 scripts/audio/upload.py [--src <folder of <key>.mp3>] [--dry-run]

Environment (names only, never printed): S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, AUDIO_BUCKET.

In order, stopping at the first thing that is wrong:
  1. lists the bucket. An object already there must have the manifest's size AND ETag (the MD5 of its bytes for a
     single-part PUT — measured 2026-09-26 on the LOCAL Supabase stack, not production: ETag == MD5 for every genuine
     object, and the one tampered object was the only mismatch). If production's ETag were ever not the MD5, every
     object reads as a mismatch and the run stops with a DEFECT — it never overwrites. Names are content hashes,
     so a mismatch is never overwritten: the run fails and says how many. This audits the bucket with no audio at all.
  2. for the objects the bucket LACKS, and only those: the source file must exist and its SHA-256 must be the
     manifest's — a wrong source ref cannot upload the wrong audio. So a later render of 50 new clips needs only those
     50 files, not the whole set.
  3. uploads them (audio/mpeg, Cache-Control: public, max-age=31536000, immutable);
  4. reads every uploaded object back (bytes + SHA-256), then re-lists: every manifest object must be present and
     match. Prints counts only — no keys, no URLs, no object names. --dry-run stops after step 2.

Exit 0: done (dry run: nothing wrong found; it says how many are missing).
Exit 1: a defect — a present object with the wrong bytes, a missing object with no/wrong source, a failed upload or read-back.
Exit 2: could not look — no manifest, no credentials, bucket unreachable, or objects to upload and no source at all.
"""
import argparse, hashlib, json, os, sys
from concurrent.futures import ThreadPoolExecutor

CACHE_CONTROL = 'public, max-age=31536000, immutable'


def stop(code, msg):
    print(msg, file=sys.stderr)
    sys.exit(code)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--manifest', default='scripts/audio/manifest.json')
    ap.add_argument('--src', help='folder of <key>.mp3; needed only for objects the bucket lacks')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--workers', type=int, default=8)
    a = ap.parse_args()

    need = ['S3_ENDPOINT', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'AUDIO_BUCKET']
    unset = [n for n in need if not os.environ.get(n)]
    if unset:
        stop(2, f'CANNOT LOOK: not set: {", ".join(unset)}. Nothing was uploaded.')
    if not os.path.isfile(a.manifest):
        stop(2, f'CANNOT LOOK: no manifest at {a.manifest}.')

    m = json.load(open(a.manifest))
    objects = {}  # name -> {sha256, md5, bytes, key}
    for key, o in m['keys'].items():
        objects.setdefault(o['name'], {**o, 'key': key})
    print(f'manifest: {len(m["keys"])} clips, {len(objects)} objects, {sum(o["bytes"] for o in objects.values())} bytes')

    import boto3
    from botocore.config import Config
    s3 = boto3.client('s3', endpoint_url=os.environ['S3_ENDPOINT'], region_name=os.environ['S3_REGION'],
                      aws_access_key_id=os.environ['S3_ACCESS_KEY_ID'],
                      aws_secret_access_key=os.environ['S3_SECRET_ACCESS_KEY'],
                      config=Config(s3={'addressing_style': 'path'}, retries={'max_attempts': 5}))
    bucket = os.environ['AUDIO_BUCKET']

    def listing():
        have = {}
        for page in s3.get_paginator('list_objects_v2').paginate(Bucket=bucket):
            for o in page.get('Contents', []):
                have[o['Key']] = (o['Size'], o.get('ETag', '').strip('"'))
        return have

    # 1. what the bucket has, audited against the manifest
    try:
        have = listing()
    except Exception as e:  # noqa: BLE001 — any failure here means we could not look
        stop(2, f'CANNOT LOOK: listing the bucket failed ({type(e).__name__}). Nothing was uploaded.')
    wrong = [n for n, o in objects.items() if n in have and have[n] != (o['bytes'], o['md5'])]
    if wrong:
        stop(1, f'DEFECT: {len(wrong)} object(s) in the bucket do not match the manifest (size or ETag). Not overwritten.')
    todo = [n for n in objects if n not in have]
    extra = len([n for n in have if n not in objects])
    print(f'bucket: {len(have)} objects; {len(objects) - len(todo)} of the manifest present and matching; '
          f'{len(todo)} missing; {extra} not in this manifest')

    # 2. a source for every missing object, and it is the audio the manifest names
    if todo:
        if not a.src or not os.path.isdir(a.src) or not any(f.endswith('.mp3') for f in os.listdir(a.src)):
            stop(2, f'CANNOT LOOK: {len(todo)} object(s) to upload and no clips in --src {a.src!r}. Nothing was uploaded.')
        bad = 0
        for n in todo:
            p = os.path.join(a.src, f'{objects[n]["key"]}.mp3')
            data = open(p, 'rb').read() if os.path.isfile(p) else None
            if data is None or len(data) != objects[n]['bytes'] or hashlib.sha256(data).hexdigest() != objects[n]['sha256']:
                bad += 1
        if bad:
            stop(1, f'DEFECT: {bad} of {len(todo)} missing object(s) have no source file, or not the audio the manifest '
                    f'names. Wrong source ref? Nothing uploaded.')
        print(f'source: {len(todo)} missing object(s) verified against the manifest')
    if a.dry_run:
        print('dry run: nothing uploaded')
        return

    # 3. upload the missing ones
    def put(n):
        with open(os.path.join(a.src, f'{objects[n]["key"]}.mp3'), 'rb') as f:
            s3.put_object(Bucket=bucket, Key=n, Body=f.read(), ContentType='audio/mpeg', CacheControl=CACHE_CONTROL)

    failed = 0
    with ThreadPoolExecutor(a.workers) as ex:
        for fut in [ex.submit(put, n) for n in todo]:
            try:
                fut.result()
            except Exception:  # noqa: BLE001
                failed += 1
    if failed:
        stop(1, f'DEFECT: {failed} upload(s) failed. Re-run: only the missing objects are sent.')
    print(f'uploaded: {len(todo)}')

    # 4. read every new object back, then check the whole manifest is present and matching
    def readback_ok(n):
        body = s3.get_object(Bucket=bucket, Key=n)['Body'].read()
        return len(body) == objects[n]['bytes'] and hashlib.sha256(body).hexdigest() == objects[n]['sha256']

    with ThreadPoolExecutor(a.workers) as ex:
        unreadable = sum(1 for ok in ex.map(readback_ok, todo) if not ok)
    if unreadable:
        stop(1, f'DEFECT: {unreadable} uploaded object(s) did not read back byte-identical.')
    after = listing()
    absent = [n for n, o in objects.items() if after.get(n) != (o['bytes'], o['md5'])]
    if absent:
        stop(1, f'DEFECT: {len(absent)} manifest object(s) not in the bucket, or not matching, after the run.')
    print(f'verified: {len(todo)} uploaded object(s) read back byte-identical; all {len(objects)} manifest objects present and matching')


if __name__ == '__main__':
    main()
