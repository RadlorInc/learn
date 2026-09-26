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
 * ALSO writes the app's runtime index — one small JSON per lesson module, src/features/lessons/voice-index/<module>.json,
 * `{ key: [objectName16, check] }` — for the corpora the app SPEAKS (APP_CORPORA). Loaded with its module, never as one
 * big file: the whole index was 109–167 KB gzip against 34 KB before, a slower first lesson (measured 2026-09-26).
 * `check` is clipCheck of the line (the player plays a clip only when key AND check match — src/core/voiceClips.ts).
 *
 * Exit 1 (writes nothing): a corpus key with no clip (MISSING), a clip no corpus names (ORPHAN), one key with two
 * different lines (DUPLICATE), two DIFFERENT clips with the same 16-hex name (COLLISION), an app line with no check.
 * Exit 2: could not look (no clip folder, no corpus) — never reported as clean.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const VOICE = 'nzFihrBIvB34imQBuxub' // Josh — the only voice in the bucket (founder, 2026-09-26)
const SRC = process.env.AUDIO_SRC ?? join('audio-src', VOICE)
const OUT = process.env.AUDIO_MANIFEST ?? 'scripts/audio/manifest.json'
// Everything the bucket holds (the upload source of truth) …
const CORPORA = ['scripts/.voice-corpus-lessons-josh.json', 'scripts/.voice-corpus-chapters-josh.json']
// … and what the app on this branch speaks. The KG–2 chapters join when #233 lands, with their own index.
const APP_CORPORA = ['scripts/.voice-corpus-lessons-josh.json']
const INDEX_DIR = process.env.AUDIO_INDEX_DIR ?? 'src/features/lessons/voice-index'

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

// The runtime index, per module. A line said in several modules is in each of their files.
const index = {}
for (const f of APP_CORPORA.filter(f => existsSync(f))) {
  for (const row of JSON.parse(readFileSync(f, 'utf8'))) {
    if (!row.check) errors.push(`NO CHECK for ${row.key} in ${f} — regenerate the corpus (scripts/lesson-voice-corpus.mts)`)
    const mods = new Set((row.sources ?? []).join(' ').match(/\bg\d+m\d+(?=-t)/g) ?? [])
    if (mods.size === 0) errors.push(`NO MODULE in the sources of ${row.key}`)
    for (const mod of mods) (index[mod] ??= {})[row.key] = [keys[row.key].name.slice(0, 16), row.check]
  }
}
if (errors.length) stop(1, `${errors.length} problem(s):\n  ${errors.slice(0, 20).join('\n  ')}`)
const indexFiles = Object.fromEntries(Object.keys(index).sort().map(m => [`${m}.json`,
  JSON.stringify(Object.fromEntries(Object.keys(index[m]).sort().map(k => [k, index[m][k]]))) + '\n']))
// …and the map the lesson player loads them through: one import() per module, so each is its own small chunk.
indexFiles['index.ts'] = [
  '// GENERATED by scripts/audio/build-manifest.mjs — do not edit (its --check fails if this drifts).',
  '// One module\'s clips: clip key → [object name (16 hex), clipCheck]. One import() each, so each is its own chunk.',
  'export type ClipIndex = Record<string, [string, string]>',
  'export const VOICE_INDEX: Record<string, () => Promise<ClipIndex>> = {',
  ...Object.keys(index).sort().map(m => `  ${m}: () => import('./${m}.json').then(x => x.default as unknown as ClipIndex),`),
  '}',
  '',
].join('\n')
const summary = `${manifest.clips} clips, ${manifest.objects} objects, ${(manifest.bytes / 1e6).toFixed(1)} MB`

const idxSummary = `${Object.keys(indexFiles).length - 1} module index files + index.ts in ${INDEX_DIR}`
if (process.argv.includes('--check')) {
  if ((existsSync(OUT) ? readFileSync(OUT, 'utf8') : '') !== json) stop(1, `${OUT} is stale for ${SRC}. Run node scripts/audio/build-manifest.mjs.`)
  const onDisk = existsSync(INDEX_DIR) ? readdirSync(INDEX_DIR).sort() : []
  const stale = [...new Set([...onDisk, ...Object.keys(indexFiles)])].filter(f =>
    !indexFiles[f] || !existsSync(join(INDEX_DIR, f)) || readFileSync(join(INDEX_DIR, f), 'utf8') !== indexFiles[f])
  if (stale.length) stop(1, `${INDEX_DIR} is stale (${stale.slice(0, 5).join(', ')}). Run node scripts/audio/build-manifest.mjs.`)
  console.log(`${OUT} matches ${SRC}: ${summary}; ${idxSummary} match`)
} else {
  writeFileSync(OUT, json)
  rmSync(INDEX_DIR, { recursive: true, force: true })
  mkdirSync(INDEX_DIR, { recursive: true })
  for (const [f, body] of Object.entries(indexFiles)) writeFileSync(join(INDEX_DIR, f), body)
  console.log(`wrote ${OUT}: ${summary}; ${idxSummary}`)
}
