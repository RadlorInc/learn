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
 * and one per KG–2 story chapter, src/features/chapters/voice-index/<chapter>.json, each `{ key: [objectName16, check] }`
 * — a chapter's entries also carry the clip's size, `[objectName16, check, bytes]`, because a KG–2 question decides from
 * it whether its answer lines are small enough to fetch before the child answers (openQuestion's budget, money)
 * — for the corpora the app SPEAKS (APP). Loaded with its module / chapter, never as one big file: the whole lesson index
 * was 109–167 KB gzip against 34 KB before, a slower first lesson (measured 2026-09-26), and all 10,347 chapter lines
 * are ~262 KB gzip against ≤ 70 KB for the biggest chapter (money, measured 2026-09-27).
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
// … and what the app speaks, each with its own index: a lesson line belongs to the modules its `sources` name, a
// chapter line to the chapters its `chapters` list names (written by _voiceCorpusChapters.test.ts).
const APP = [
  { corpus: 'scripts/.voice-corpus-lessons-josh.json', dir: process.env.AUDIO_INDEX_DIR ?? 'src/features/lessons/voice-index',
    unit: 'module', rebuild: 'npx tsx scripts/lesson-voice-corpus.mts',
    groups: row => new Set((row.sources ?? []).join(' ').match(/\bg\d+m\d+(?=-t)/g) ?? []) },
  { corpus: 'scripts/.voice-corpus-chapters-josh.json', dir: process.env.AUDIO_CHAPTER_INDEX_DIR ?? 'src/features/chapters/voice-index',
    unit: 'chapter', rebuild: 'VOICE_CORPUS=1 npx vitest run src/__tests__/_voiceCorpusChapters.test.ts',
    groups: row => new Set(row.chapters ?? []), bytes: true },
]

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

// The runtime indexes, one file per module / chapter. A line said in several of them is in each of their files.
const indexes = APP.map(({ corpus, dir, unit, rebuild, groups, bytes }) => {
  const index = {}
  if (!existsSync(corpus)) errors.push(`NO CORPUS ${corpus} — the app speaks it, so its index cannot be built`)
  else for (const row of JSON.parse(readFileSync(corpus, 'utf8'))) {
    if (!row.check) errors.push(`NO CHECK for ${row.key} in ${corpus} — regenerate it (${rebuild})`)
    const units = groups(row)
    if (units.size === 0) errors.push(`NO ${unit.toUpperCase()} for ${row.key} in ${corpus}`)
    for (const u of units) (index[u] ??= {})[row.key] = [keys[row.key].name.slice(0, 16), row.check, ...(bytes ? [keys[row.key].bytes] : [])]
  }
  const files = Object.fromEntries(Object.keys(index).sort().map(u => [`${u}.json`,
    JSON.stringify(Object.fromEntries(Object.keys(index[u]).sort().map(k => [k, index[u][k]]))) + '\n']))
  // …and the map the player is handed them through: one import() per file, so each is its own small chunk.
  files['index.ts'] = [
    '// GENERATED by scripts/audio/build-manifest.mjs — do not edit (its --check fails if this drifts).',
    `// One ${unit}'s clips: clip key → [object name (16 hex), clipCheck${bytes ? ', bytes' : ''}]. One import() each, so each is its own chunk.`,
    `export type ClipIndex = Record<string, [string, string${bytes ? ', number' : ''}]>`,
    'export const VOICE_INDEX: Record<string, () => Promise<ClipIndex>> = {',
    ...Object.keys(index).sort().map(u => `  ${u}: () => import('./${u}.json').then(x => x.default as unknown as ClipIndex),`),
    '}',
    '',
  ].join('\n')
  return { dir, files, summary: `${Object.keys(files).length - 1} ${unit} index files + index.ts in ${dir}` }
})
if (errors.length) stop(1, `${errors.length} problem(s):\n  ${errors.slice(0, 20).join('\n  ')}`)
const summary = `${manifest.clips} clips, ${manifest.objects} objects, ${(manifest.bytes / 1e6).toFixed(1)} MB`
const idxSummary = indexes.map(i => i.summary).join('; ')

if (process.argv.includes('--check')) {
  if ((existsSync(OUT) ? readFileSync(OUT, 'utf8') : '') !== json) stop(1, `${OUT} is stale for ${SRC}. Run node scripts/audio/build-manifest.mjs.`)
  for (const { dir, files } of indexes) {
    const onDisk = existsSync(dir) ? readdirSync(dir).sort() : []
    const stale = [...new Set([...onDisk, ...Object.keys(files)])].filter(f =>
      !files[f] || !existsSync(join(dir, f)) || readFileSync(join(dir, f), 'utf8') !== files[f])
    if (stale.length) stop(1, `${dir} is stale (${stale.slice(0, 5).join(', ')}). Run node scripts/audio/build-manifest.mjs.`)
  }
  console.log(`${OUT} matches ${SRC}: ${summary}; ${idxSummary} match`)
} else {
  writeFileSync(OUT, json)
  for (const { dir, files } of indexes) {
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    for (const [f, body] of Object.entries(files)) writeFileSync(join(dir, f), body)
  }
  console.log(`wrote ${OUT}: ${summary}; ${idxSummary}`)
}
