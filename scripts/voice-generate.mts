/**
 * Render the extracted corpus to audio clips.
 *
 *   ELEVENLABS_API_KEY=... npx tsx scripts/voice-generate.mts <voiceId> [--limit N] [--dry]
 *
 * IDEMPOTENT: a clip already on disk is skipped, never re-billed. Safe to re-run after
 * hitting the monthly character cap — it picks up exactly where it stopped.
 *
 * Expression comes from inline v3 audio tags chosen per line TYPE (see tagFor). The tag
 * is stripped from the key, so retagging a line does NOT orphan its clip... it re-renders
 * it, which is what you want.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs'

const [voiceId, ...rest] = process.argv.slice(2)
if (!voiceId) { console.error('usage: voice-generate.mts <voiceId> [--limit N] [--dry]'); process.exit(1) }
const DRY = rest.includes('--dry')
const LIMIT = rest.includes('--limit') ? Number(rest[rest.indexOf('--limit') + 1]) : Infinity
/** Key from the env, or .env.local (gitignored) so it never has to be pasted on a command line. */
function apiKey(): string | undefined {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY
  try {
    const m = readFileSync('.env.local', 'utf8').match(/^ELEVENLABS_API_KEY\s*=\s*(.+)$/m)
    return m?.[1].trim().replace(/^["']|["']$/g, '')
  } catch { return undefined }
}
const KEY = apiKey()
if (!KEY && !DRY) {
  console.error('No ELEVENLABS_API_KEY. Add this line to .env.local (already gitignored):')
  console.error('  ELEVENLABS_API_KEY=your-key-here')
  process.exit(1)
}

const MODEL = 'eleven_v3'                 // most expressive; honours the audio tags below
const FORMAT = 'mp3_22050_32'             // speech at 32kbps — ~4x smaller than 128, no audible loss
const OUT = `public/audio/${voiceId}`

type Line = { key: string; text: string; chars: number; kind?: string; sources: string[] }
const corpus: Line[] = JSON.parse(readFileSync('scripts/.voice-corpus.json', 'utf8'))

/** Direction per line type. Milo teaches — he does not cheer. */
function tagFor(l: Line): string {
  const t = l.text
  // THE PLAN sets up the whole chapter — warm and unhurried, not lecture-clear.
  if (l.kind === 'plan')                              return '[warm]'
  if (/^Here is the plan|^Here's the plan/i.test(t))  return '[warm]'
  if (/^Not quite|^Almost|try again/i.test(t))        return '[gently]'    // wrong answer
  if (/your turn/i.test(t))                           return '[encouraging]'
  return '[clearly]'                                                       // explanation — the default
}

mkdirSync(OUT, { recursive: true })

const todo = corpus.filter((l) => !existsSync(`${OUT}/${l.key}.mp3`)).slice(0, LIMIT)
const done = corpus.length - corpus.filter((l) => !existsSync(`${OUT}/${l.key}.mp3`)).length
const chars = todo.reduce((n, l) => n + l.text.length + tagFor(l).length + 1, 0)

console.log(`voice ${voiceId} · ${done}/${corpus.length} already on disk`)
console.log(`to render: ${todo.length} lines · ~${chars.toLocaleString()} chars`)
if (DRY) { console.log('(dry run — nothing generated)'); process.exit(0) }

let ok = 0, failed = 0
for (const [i, l] of todo.entries()) {
  const body = {
    text: `${tagFor(l)} ${l.text}`,
    model_id: MODEL,
    voice_settings: { stability: 0.5, similarity_boost: 0.75, use_speaker_boost: true },
  }
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${FORMAT}`,
    { method: 'POST', headers: { 'xi-api-key': KEY!, 'content-type': 'application/json' }, body: JSON.stringify(body) },
  )
  if (!res.ok) {
    failed++
    const msg = await res.text()
    console.error(`  ✗ ${l.key} (${res.status}) ${msg.slice(0, 160)}`)
    // Quota exhausted / rate limited → stop cleanly. Re-run later resumes here.
    if (res.status === 401 || res.status === 429) { console.error('\nstopping — re-run to resume'); break }
    continue
  }
  writeFileSync(`${OUT}/${l.key}.mp3`, Buffer.from(await res.arrayBuffer()))
  ok++
  if ((i + 1) % 25 === 0 || i === todo.length - 1) console.log(`  ${ok} rendered, ${failed} failed`)
}

// Manifest = exactly what's on disk, so a runtime lookup never promises a missing clip.
const have = corpus.filter((l) => existsSync(`${OUT}/${l.key}.mp3`))
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(have.map((l) => l.key)))

const bytes = have.reduce((n, l) => n + statSync(`${OUT}/${l.key}.mp3`).size, 0)
console.log(`\ndone: ${ok} rendered, ${failed} failed`)
console.log(`manifest: ${have.length}/${corpus.length} lines · ${(bytes / 1e6).toFixed(1)} MB`)
