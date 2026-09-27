#!/usr/bin/env node
/**
 * What a visitor can do to the audio bucket over HTTP, with the PUBLIC anon key every browser already has — and,
 * optionally, as a signed-in account. Expected: read an object by its exact URL, and NOTHING else (list, upload,
 * overwrite, delete).
 *
 *   SUPABASE_URL=… SUPABASE_ANON_KEY=… [SUPABASE_USER_JWT=<a test account's access token>] \
 *     node scripts/audio/anon-probe.mjs <an object name from scripts/audio/manifest.json>
 *
 * ⚠️ IT MUST NOT DAMAGE WHAT IT MEASURES (review, 2026-09-26). A probe that overwrote or deleted a real clip whenever it
 * found the door open would break a live lesson line — cached "immutable" on every device that fetched it — in exactly
 * the state it exists to detect. So:
 *   · overwrite PUTs the object's OWN bytes back with its own headers: an open door is still detected (2xx), nothing changes;
 *   · delete targets `anon-probe-canary.mp3`, a canary upload-audio keeps in the bucket, never a manifest object;
 *   · upload writes a new random `anon-probe-*.mp3` name, never a manifest name (reported by name if accepted).
 * Positive controls: the named object answers 200 with the immutable header, and the canary exists — else that half is
 * "could not look", not "refused". Afterwards the object's SHA-256 and cache header are compared, not just its size.
 *
 * Exit 0: every door refused for every role probed (it says which roles). 1: a door is open. 2: could not look.
 * Without SUPABASE_USER_JWT only `anon` is probed, and it says so; `authenticated` is then covered by the proof SQL
 * (P2: no storage.objects policy), the migration's own probe, and CI's rls_regression S0–S5.
 */
import { createHash } from 'node:crypto'

const base = process.env.SUPABASE_URL?.replace(/\/$/, '')
const anon = process.env.SUPABASE_ANON_KEY
const userJwt = process.env.SUPABASE_USER_JWT
const name = process.argv[2]
const bucket = process.env.AUDIO_BUCKET ?? 'lesson-audio'
const CANARY = 'anon-probe-canary.mp3'
if (!base || !anon || !name) { console.error('CANNOT LOOK: set SUPABASE_URL, SUPABASE_ANON_KEY and pass an object name.'); process.exit(2) }

const S = `${base}/storage/v1`
const sha = (b) => createHash('sha256').update(new Uint8Array(b)).digest('hex')
const open = [], blind = []
const say = (ok, what, detail) => { console.log(`${ok ? 'ok  ' : 'OPEN'}  ${what} — ${detail}`); if (!ok) open.push(what) }

// Positive control: the public read path works for this exact object.
const pub = await fetch(`${S}/object/public/${bucket}/${name}`).catch(() => null)
if (!pub || pub.status !== 200) { console.error(`CANNOT LOOK: ${name} did not answer 200 (${pub?.status ?? 'no response'}). Nothing was probed.`); process.exit(2) }
const body = await pub.arrayBuffer()
const before = { sha: sha(body), cc: pub.headers.get('cache-control'), ct: pub.headers.get('content-type') ?? 'audio/mpeg' }
console.log(`ctrl  public GET ${name} — 200, ${body.byteLength} bytes, cache-control: ${before.cc}`)
say(before.cc === 'public, max-age=31536000, immutable', 'immutable cache header', before.cc)
const canary = await fetch(`${S}/object/public/${bucket}/${CANARY}`).catch(() => null)
const canaryHere = canary?.status === 200
console.log(`ctrl  canary ${CANARY} — ${canary?.status ?? 'no response'}${canaryHere ? '' : ' (delete cannot be probed without it)'}`)

async function probe(role, token) {
  const auth = { apikey: anon, Authorization: `Bearer ${token}` }
  // 1. list
  const list = await fetch(`${S}/object/list/${bucket}`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ prefix: '', limit: 10 }) })
  const listed = list.ok ? await list.json() : []
  say(!(Array.isArray(listed) && listed.length > 0), `${role} list`, `${list.status}, ${Array.isArray(listed) ? listed.length : '?'} entries`)
  // 2. upload a NEW random name (never a manifest name)
  const junk = `anon-probe-${Math.random().toString(16).slice(2, 10)}.mp3`
  const up = await fetch(`${S}/object/${bucket}/${junk}`, { method: 'POST', headers: { ...auth, 'content-type': 'audio/mpeg' }, body: new Uint8Array([0]) })
  say(!up.ok, `${role} upload`, `${up.status}${up.ok ? ` — ACCEPTED, remove ${junk}` : ''}`)
  // 3. overwrite the real object with ITS OWN bytes and headers — detected if accepted, harmless either way
  const over = await fetch(`${S}/object/${bucket}/${name}`, { method: 'PUT', headers: { ...auth, 'content-type': before.ct, 'cache-control': before.cc ?? '', 'x-upsert': 'true' }, body })
  say(!over.ok, `${role} overwrite`, `${over.status}`)
  // 4. delete the CANARY, never a manifest object
  if (!canaryHere) { blind.push(`${role} delete`); console.log(`VOID  ${role} delete — no canary to aim at`); return }
  const del = await fetch(`${S}/object/${bucket}`, { method: 'DELETE', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ prefixes: [CANARY] }) })
  const gone = del.ok ? await del.json() : []
  say(!(Array.isArray(gone) && gone.length > 0), `${role} delete`, `${del.status}, ${Array.isArray(gone) ? gone.length : '?'} removed${Array.isArray(gone) && gone.length ? ' (the canary; upload-audio puts it back)' : ''}`)
}

await probe('anon', anon)
if (userJwt) await probe('authenticated', userJwt)
else console.log('----  authenticated — NOT probed here (no SUPABASE_USER_JWT). Covered by proof SQL P2, the migration probe and CI S0–S5.')

// the object is still exactly what it was — bytes AND cache header
const after = await fetch(`${S}/object/public/${bucket}/${name}`)
const afterBody = after.status === 200 ? await after.arrayBuffer() : new ArrayBuffer(0)
say(after.status === 200 && sha(afterBody) === before.sha && after.headers.get('cache-control') === before.cc,
  'object unchanged afterwards (sha256 + cache header)', `${after.status}`)

const roles = userJwt ? 'anon + authenticated' : 'anon only'
if (open.length) { console.log(`\n${open.length} door(s) OPEN (${roles}): ${open.join(', ')}`); process.exit(1) }
if (blind.length) { console.log(`\nCOULD NOT LOOK at: ${blind.join(', ')} (${roles})`); process.exit(2) }
console.log(`\nall refused (${roles}): read-by-URL only`)
