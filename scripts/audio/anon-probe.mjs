#!/usr/bin/env node
/**
 * What an anonymous visitor can do to the audio bucket, over HTTP, with the PUBLIC anon key — the key every browser
 * already has. Expected: read one object by its exact URL, and NOTHING else (list, upload, overwrite, delete).
 *
 *   SUPABASE_URL=… SUPABASE_ANON_KEY=… node scripts/audio/anon-probe.mjs <an object name from scripts/audio/manifest.json>
 *
 * Positive control first: the named object must answer 200 with the immutable cache header, or the refusals below
 * would prove nothing (a wrong URL refuses everything too). Exit 0 all refused · 1 a door is open · 2 could not look.
 * The upload probe writes a 1-byte object under a random `anon-probe-*.mp3` name; if it is ever ACCEPTED, the run
 * says so by name so it can be removed.
 */
const base = process.env.SUPABASE_URL?.replace(/\/$/, '')
const key = process.env.SUPABASE_ANON_KEY
const name = process.argv[2]
const bucket = process.env.AUDIO_BUCKET ?? 'lesson-audio'
if (!base || !key || !name) { console.error('CANNOT LOOK: set SUPABASE_URL, SUPABASE_ANON_KEY and pass an object name.'); process.exit(2) }

const auth = { apikey: key, Authorization: `Bearer ${key}` }
const S = `${base}/storage/v1`
const open = []
const say = (ok, what, detail) => { console.log(`${ok ? 'ok  ' : 'OPEN'}  ${what} — ${detail}`); if (!ok) open.push(what) }

// Positive control: the public read path works for this exact object.
const pub = await fetch(`${S}/object/public/${bucket}/${name}`).catch(() => null)
if (!pub || pub.status !== 200) { console.error(`CANNOT LOOK: ${name} did not answer 200 (${pub?.status ?? 'no response'}). Nothing was probed.`); process.exit(2) }
const bytes = (await pub.arrayBuffer()).byteLength
console.log(`ctrl  public GET ${name} — 200, ${bytes} bytes, cache-control: ${pub.headers.get('cache-control')}`)
say(pub.headers.get('cache-control') === 'public, max-age=31536000, immutable', 'immutable cache header', pub.headers.get('cache-control'))

// 1. list
const list = await fetch(`${S}/object/list/${bucket}`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ prefix: '', limit: 10 }) })
const listed = list.ok ? await list.json() : []
say(!(Array.isArray(listed) && listed.length > 0), 'list', `${list.status}, ${Array.isArray(listed) ? listed.length : '?'} entries`)

// 2. upload a new object
const probe = `anon-probe-${Math.random().toString(16).slice(2, 10)}.mp3`
const up = await fetch(`${S}/object/${bucket}/${probe}`, { method: 'POST', headers: { ...auth, 'content-type': 'audio/mpeg' }, body: new Uint8Array([0]) })
say(!up.ok, 'upload', `${up.status}${up.ok ? ` — ACCEPTED, remove ${probe}` : ''}`)

// 3. overwrite the real object (upsert)
const over = await fetch(`${S}/object/${bucket}/${name}`, { method: 'PUT', headers: { ...auth, 'content-type': 'audio/mpeg', 'x-upsert': 'true' }, body: new Uint8Array([0]) })
say(!over.ok, 'overwrite', `${over.status}`)

// 4. delete the real object
const del = await fetch(`${S}/object/${bucket}`, { method: 'DELETE', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ prefixes: [name] }) })
const gone = del.ok ? await del.json() : []
say(!(Array.isArray(gone) && gone.length > 0), 'delete', `${del.status}, ${Array.isArray(gone) ? gone.length : '?'} removed`)

// and the object is still exactly what it was
const after = await fetch(`${S}/object/public/${bucket}/${name}`)
const same = after.status === 200 && (await after.arrayBuffer()).byteLength === bytes
say(same, 'object unchanged afterwards', `${after.status}`)

console.log(open.length ? `\n${open.length} door(s) OPEN: ${open.join(', ')}` : '\nall refused: read-by-URL only')
process.exit(open.length ? 1 : 0)
