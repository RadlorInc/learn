#!/usr/bin/env node
/**
 * Build scripts/audio/manifest.json — the ONE record of which recorded clip is which object in the audio bucket
 * (founder's "Audio storage" loop, 2026-09-26).
 *
 *   node scripts/audio/build-manifest.mjs            write it
 *   node scripts/audio/build-manifest.mjs --check    exit 1 if the committed file differs from what the clips say
 *
 * Reads the clips from AUDIO_SRC (default `audio-src/<voice>/`, gitignored — the audio is no longer in git) and
 * every corpus that names a line the app speaks in this voice. Writes, per clip key: the object name
 * `<sha256[0:16]>.mp3`, the full SHA-256, the MD5 (what S3 reports as the ETag, so the bucket can be audited against
 * this file without the audio) and the byte count. The name IS the content, so an object never changes
 * once uploaded (cacheable for a year) and a re-render gets a new name. It holds NAMES, never URLs: where the bucket
 * lives is one config value (src/core/audioBase.ts), so moving host is a re-upload plus that value.
 *
 * Exit 1 (writes nothing): a corpus key with no clip (MISSING), a clip no corpus names (ORPHAN), one key with two
 * different lines (DUPLICATE), two DIFFERENT clips with the same 16-hex name (COLLISION).
 * Exit 2: could not look (no clip folder, no corpus) — never reported as clean.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const VOICE = 'nzFihrBIvB34imQBuxub' // Josh — the only voice in the bucket (founder, 2026-09-26)
const SRC = process.env.AUDIO_SRC ?? join('audio-src', VOICE)
const OUT = process.env.AUDIO_MANIFEST ?? 'scripts/audio/manifest.json'
const CORPORA = ['scripts/.voice-corpus-lessons-josh.json', 'scripts/.voice-corpus-chapters-josh.json']

const stop = (code, msg) => { console.error(msg); process.exit(code) }

if (!existsSync(SRC)) stop(2, `CANNOT LOOK: no clip folder at ${SRC} (set AUDIO_SRC). Nothing was checked.`)
const corpora = CORPORA.filter(f => existsSync(f))
if (corpora.length === 0) stop(2, `CANNOT LOOK: none of ${CORPORA.join(', ')} exists. Nothing was checked.`)

const lines = new Map()
const errors = []
for (const f of corpora) {
  for (const row of JSON.parse(readFileSync(f, 'utf8'))) {
    const t = row.spoken ?? row.text
    if (lines.has(row.key) && lines.get(row.key) !== t) errors.push(`DUPLICATE key ${row.key}: two different lines`)
    lines.set(row.key, t)
  }
}

const files = new Set(readdirSync(SRC).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)))
if (files.size === 0) stop(2, `CANNOT LOOK: ${SRC} holds no .mp3 files (an empty or unfilled folder — fill it with fetch-src.mjs). Nothing was checked.`)
for (const k of lines.keys()) if (!files.has(k)) errors.push(`MISSING clip for ${k}`)
for (const k of files) if (!lines.has(k)) errors.push(`ORPHAN clip ${k}.mp3 — no corpus names it`)

const keys = {}
const byName = new Map()
for (const k of [...lines.keys()].filter(k => files.has(k)).sort()) {
  const buf = readFileSync(join(SRC, `${k}.mp3`))
  const sha256 = createHash('sha256').update(buf).digest('hex')
  const md5 = createHash('md5').update(buf).digest('hex')
  const name = `${sha256.slice(0, 16)}.mp3`
  if (byName.has(name) && byName.get(name).sha256 !== sha256) errors.push(`COLLISION: ${name} names two different clips`)
  byName.set(name, { sha256, bytes: buf.length })
  keys[k] = { name, sha256, md5, bytes: buf.length }
}

if (errors.length) stop(1, `${errors.length} problem(s):\n  ${errors.slice(0, 20).join('\n  ')}${errors.length > 20 ? '\n  …' : ''}`)

const manifest = {
  voice: VOICE,
  clips: Object.keys(keys).length,
  objects: byName.size,
  bytes: [...byName.values()].reduce((a, o) => a + o.bytes, 0),
  keys,
}
const json = JSON.stringify(manifest, null, 1) + '\n'
const summary = `${manifest.clips} clips, ${manifest.objects} objects, ${(manifest.bytes / 1e6).toFixed(1)} MB`

if (process.argv.includes('--check')) {
  if ((existsSync(OUT) ? readFileSync(OUT, 'utf8') : '') !== json) stop(1, `${OUT} is stale for ${SRC}. Run node scripts/audio/build-manifest.mjs.`)
  console.log(`${OUT} matches ${SRC}: ${summary}`)
} else {
  writeFileSync(OUT, json)
  console.log(`wrote ${OUT}: ${summary}`)
}
