/**
 * Fragment corpus for the TEMPLATED question prompts (12–14).
 *
 *   npx tsx scripts/voice-fragments.mts
 *
 * A line like `${a} times ${b}. Tap your answer.` can't be one clip — every (a,b) is a
 * different sentence. So we cut it at the holes:
 *
 *   segments  " times ", ". Tap your answer."   → clips (multi-word, natural prosody)
 *   values    a, b                              → clips from a number vocabulary
 *
 * Only the seams are stitched, so most of the sentence still plays as real speech.
 *
 * SCOPE: templates whose holes are all NUMERIC. Word-valued holes (item names, labels,
 * spoken expressions) are unbounded or chapter-specific — those templates are skipped
 * and keep browser speech. Partial coverage of a sentence would be worse than none: a
 * silent gap mid-line reads as a bug, where the browser voice just reads it.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { clipKey } from '../src/core/voiceClips.ts'

const G = 'src/features/chapters/teen/games'
const BAND_12_14 = ['WeatherStation', 'SkyTower', 'KitchenCounter', 'JuiceBar', 'GearLab', 'ScoreMachine',
  'FunctionFactory', 'BalanceBench', 'NightFlight', 'CableCar', 'BuildSite', 'StoreCheckout']

/** Holes we can voice: a bare number, or signed() which renders "negative <n>". */
const NUMERIC_HOLE = /^\$\{\s*(?:signed\()?\s*[A-Za-z_$][\w.$]*\s*\)?\s*\}$/
const WORDY = /(toLowerCase|speakExpr|label|item|card|rule|money|worthWord|FRACW|lenOf|name|base)/

type Tpl = { segments: string[]; holes: number; source: string; raw: string }

const templates: Tpl[] = []
const skipped: string[] = []

for (const name of BAND_12_14) {
  const file = `${G}/${name}.tsx`
  let src: string
  try { src = readFileSync(file, 'utf8') } catch { continue }
  const re = /\b(?:say|work)\s*:\s*`([^`]{4,300})`/g
  for (let m = re.exec(src); m; m = re.exec(src)) {
    const body = m[1]
    if (!body.includes('${')) continue
    const holes = body.match(/\$\{[^}]*\}/g) ?? []
    if (holes.some((h) => WORDY.test(h) || !NUMERIC_HOLE.test(h))) { skipped.push(`${name}: ${body.slice(0, 60)}…`); continue }
    // Split on the holes — what's left are the literal runs we can pre-render.
    const segments = body.split(/\$\{[^}]*\}/)
    templates.push({ segments, holes: holes.length, source: name, raw: body })
  }
}

// Every distinct literal segment becomes one clip. Blank segments (a hole at either end,
// or two holes adjacent) carry no audio and are dropped.
const segs = new Map<string, string>()
for (const t of templates) {
  for (const s of t.segments) {
    const trimmed = s.trim()
    if (trimmed && /[a-zA-Z]/.test(trimmed)) segs.set(clipKey(trimmed), trimmed)
  }
}

// Value vocabulary. Covers the range these chapters actually use, plus "negative" as its
// own clip so signed values are one extra fragment rather than a doubled vocabulary.
const values = new Map<string, string>()
for (let n = 0; n <= 100; n++) values.set(clipKey(`#${n}`), String(n))
values.set(clipKey('#negative'), 'negative')
// Some holes render a WORD then a number — `dir` becomes "withdraw 7". Those read as two
// tokens, so the leading verbs need clips too or the whole line falls back. (Found the
// hard way: the extractor accepts any bare identifier as numeric, and `dir` isn't.)
for (const w of ['deposit', 'withdraw', 'pay', 'receive', 'owing', 'get', 'with']) {
  values.set(clipKey(`#${w}`), w)
}

const segChars = [...segs.values()].reduce((n, s) => n + s.length, 0)
const valChars = [...values.values()].reduce((n, s) => n + s.length, 0)

writeFileSync('scripts/.voice-fragments.json', JSON.stringify({
  templates: templates.map((t) => ({ segments: t.segments, source: t.source })),
  segments: [...segs].map(([key, text]) => ({ key, text })),
  values: [...values].map(([key, text]) => ({ key, text })),
}, null, 2))

console.log(`templates covered : ${templates.length}`)
console.log(`templates skipped : ${skipped.length} (word-valued holes → browser speech)`)
console.log(`distinct segments : ${segs.size}  (${segChars.toLocaleString()} chars)`)
console.log(`value vocabulary  : ${values.size}  (${valChars.toLocaleString()} chars)`)
console.log(`TOTAL TO RENDER   : ${(segChars + valChars).toLocaleString()} chars`)
if (skipped.length) { console.log('\nskipped examples:'); skipped.slice(0, 5).forEach((s) => console.log('  ' + s)) }
