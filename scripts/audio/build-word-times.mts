/**
 * Real chalk timing: when, in her recorded clip, each chalk mark's `at` word is said.
 *
 *   npx tsx scripts/audio/build-word-times.mts [whisperDir]
 *
 * Reads the word times of every lesson clip (faster-whisper small.en, run locally on audio-src/ — one
 * `<module>.json` per module, `{ clipKey: { dur, words: [[word, startS, endS], …] } }`; default folder
 * `../_chalk-motion-timings`, outside the repo like the audio) and writes src/features/lessons/word-times/<module>.json:
 * `{ clipKey: { word: ms } }` — only the words a chalk mark waits for, in ms of the CLIP (1x). chalk.ts's wordMs
 * divides by the playback rate. A word whisper heard differently (digits, spelt-out signs) is matched to the line by
 * its place in a word-by-word alignment; a word with no match is left out, and wordMs falls back to the estimate.
 *
 * Exit 2: could not look (no whisper folder). Prints how many `at` words got a real time.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { MODULES } from '../../src/features/lessons/modules.ts'
import { clipKey } from '../../src/core/voiceClips.ts'
import { normWord } from '../../src/features/lessons/chalk.ts'

const SRC = process.argv[2] ?? '../_chalk-motion-timings'
const OUT = 'src/features/lessons/word-times'
if (!existsSync(SRC)) { console.error(`CANNOT LOOK: no whisper folder at ${SRC}. Nothing was written.`); process.exit(2) }

type Heard = Record<string, { words: [string, number, number][] }>

// Whisper writes small numbers as words ("Four groups of three"); the lines write digits.
const NUM = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(' ')
const TENS: Record<string, number> = { thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100 }
export const heardWord = (w: string) => { const n = normWord(w), i = NUM.indexOf(n); return i >= 0 ? String(i) : n in TENS ? String(TENS[n]) : n }

/** Index in `heard` for each word of `said` (-1 = no match): longest common subsequence on the normalised words, then
 *  each run of unmatched said words between two matches is spread over the heard words between them, by position
 *  ("take away" → "takeaway", "×" → "times"). */
export function align(said: string[], heard: string[]): number[] {
  const n = said.length, m = heard.length
  const L = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    L[i][j] = said[i] === heard[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const out = new Array<number>(n).fill(-1)
  for (let i = 0, j = 0; i < n && j < m;) {
    if (said[i] === heard[j]) { out[i++] = j++ } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++
  }
  for (let i = 0; i < n;) {
    if (out[i] >= 0) { i++; continue }
    let e = i; while (e < n && out[e] < 0) e++
    const a = i > 0 ? out[i - 1] + 1 : 0, b = e < n ? out[e] : m   // heard words [a, b) sit between the anchors
    for (let p = i; p < e && b > a; p++) out[p] = a + Math.floor(((p - i) * (b - a)) / (e - i))
    i = e
  }
  return out
}

mkdirSync(OUT, { recursive: true })
let asked = 0, found = 0
const missed: string[] = []
for (const mod of MODULES) {
  if (mod.story) continue
  const file = join(SRC, `${mod.id}.json`)
  if (!existsSync(file)) continue
  const heard: Heard = JSON.parse(readFileSync(file, 'utf8'))
  const out: Record<string, Record<string, number>> = {}
  for (const l of mod.lessons) for (const sc of l.screens) {
    if (!sc.chalk || !sc.beats) continue
    for (const mk of sc.chalk) {
      const say = sc.beats[mk.beat]?.say
      if (!mk.at || !say) continue
      asked++
      const key = clipKey(say), h = heard[key], w = normWord(mk.at)
      const said = say.split(/\s+/).map(normWord), i = said.indexOf(w)   // the first one, as wordMs picks it
      const j = h && i >= 0 ? align(said, h.words.map(x => heardWord(x[0])))[i] : -1
      if (j < 0) { missed.push(`${l.id}: "${mk.at}" in "${say}"`); continue }
      ;(out[key] ??= {})[w] = Math.round(h.words[j][1] * 1000)
      found++
    }
  }
  writeFileSync(join(OUT, `${mod.id}.json`), JSON.stringify(out) + '\n')
}
console.log(`at words: ${asked}, real time: ${found}, estimate kept: ${asked - found}`)
if (missed.length) console.log(missed.slice(0, 20).join('\n') + (missed.length > 20 ? `\n… ${missed.length - 20} more` : ''))
