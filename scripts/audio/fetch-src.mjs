#!/usr/bin/env node
/**
 * Fill the local clip folder (audio-src/<voice>/, gitignored) from the PUBLIC audio bucket — no credentials — so any
 * machine can rebuild the manifest after a new render. Every file is checked against scripts/audio/manifest.json
 * (bytes + SHA-256) before it is written; files already present and correct are skipped.
 *
 *   AUDIO_BASE_URL=https://<ref>.supabase.co/storage/v1/object/public/lesson-audio node scripts/audio/fetch-src.mjs
 *
 * Exit 0 all present and correct · 1 an object did not match the manifest · 2 could not look (no base URL, no manifest,
 * or not one object reachable).
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const base = process.env.AUDIO_BASE_URL?.replace(/\/$/, '')
const MANIFEST = process.env.AUDIO_MANIFEST ?? 'scripts/audio/manifest.json'
if (!base || !existsSync(MANIFEST)) { console.error('CANNOT LOOK: set AUDIO_BASE_URL and run from the repo root.'); process.exit(2) }
const m = JSON.parse(readFileSync(MANIFEST, 'utf8'))
const out = process.env.AUDIO_SRC ?? join('audio-src', m.voice)
mkdirSync(out, { recursive: true })

const sha = (b) => createHash('sha256').update(b).digest('hex')
const entries = Object.entries(m.keys)
let have = 0, fetched = 0, wrong = 0, unreachable = 0
const queue = [...entries]
await Promise.all(Array.from({ length: 16 }, async () => {
  for (let e = queue.shift(); e; e = queue.shift()) {
    const [key, o] = e
    const p = join(out, `${key}.mp3`)
    if (existsSync(p) && sha(readFileSync(p)) === o.sha256) { have++; continue }
    const r = await fetch(`${base}/${o.name}`).catch(() => null)
    if (!r || !r.ok) { unreachable++; continue }
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.length !== o.bytes || sha(buf) !== o.sha256) { wrong++; continue }
    writeFileSync(p, buf); fetched++
  }
}))
console.log(`${entries.length} clips: ${have} already here, ${fetched} fetched, ${wrong} wrong, ${unreachable} unreachable → ${out}`)
if (have + fetched === 0) process.exit(2)
process.exit(wrong || unreachable ? 1 : 0)
