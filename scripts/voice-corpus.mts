/**
 * Extract the spoken corpus for the teen game bands (12–14 + 15–16) into a manifest.
 *
 *   npx tsx scripts/voice-corpus.mts
 *
 * STATIC lines only — a line with a `${...}` hole can't be one clip, so those stay on
 * browser TTS. Writes public/audio/manifest.json (the runtime's "do I have a clip for
 * this text?" lookup) plus a sidecar list the generator reads.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { clipKey, normalizeSpoken } from '../src/core/voiceClips.ts'

const G = 'src/features/chapters/teen/games'
const BAND_12_14 = ['WeatherStation', 'SkyTower', 'KitchenCounter', 'JuiceBar', 'GearLab', 'ScoreMachine',
  'FunctionFactory', 'BalanceBench', 'NightFlight', 'CableCar', 'BuildSite', 'StoreCheckout']
const BAND_15_16 = ['Leaderboard', 'TicketCheckout', 'SavingGoal', 'FollowerGrowth', 'GoingViral', 'BestPlan',
  'PowerUps', 'ScreenDistance', 'BuildPlot', 'TheShot', 'MapMaker', 'SkateRamp']

const FILES = [...BAND_12_14, ...BAND_15_16].map((n) => `${G}/${n}.tsx`).concat(`${G}/parts/GameShell.tsx`)

// Spoken fields. `say` = narration, `coach` = the guided line, `work` = the reteach steps,
// `blurb` = the start card. Single-quoted only: a backtick string may interpolate.
// Both quote styles — the codebase mixes them, and matching only one silently halved
// the corpus on the first pass.
const FIELD = /\b(?:say|coach|work|blurb)\s*:\s*'((?:[^'\\]|\\.){4,300})'/g
const FIELD_D = /\b(?:say|coach|work|blurb)\s*:\s*"((?:[^"\\]|\\.){4,300})"/g
const SPEAK = /\bspeak(?:AfterCurrent)?\(\s*'((?:[^'\\]|\\.){4,300})'/g
const SPEAK_D = /\bspeak(?:AfterCurrent)?\(\s*"((?:[^"\\]|\\.){4,300})"/g

const seen = new Map<string, { text: string; sources: string[] }>()

for (const file of FILES) {
  let src: string
  try { src = readFileSync(file, 'utf8') } catch { console.warn(`  skip (missing): ${file}`); continue }
  for (const re of [FIELD, FIELD_D, SPEAK, SPEAK_D]) {
    re.lastIndex = 0
    for (let m = re.exec(src); m; m = re.exec(src)) {
      const text = normalizeSpoken(m[1].replace(/\\['"]/g, (s) => s[1]).replace(/\\\\/g, '\\'))
      if (!text || !/[a-zA-Z]/.test(text)) continue      // skip pure punctuation/emoji
      const key = clipKey(text)
      const hit = seen.get(key)
      if (hit) { if (!hit.sources.includes(file)) hit.sources.push(file) }
      else seen.set(key, { text, sources: [file] })
    }
  }
}

const lines = [...seen.entries()]
  .map(([key, v]) => ({ key, text: v.text, chars: v.text.length, sources: v.sources }))
  .sort((a, b) => b.chars - a.chars)

const chars = lines.reduce((n, l) => n + l.chars, 0)
mkdirSync('public/audio', { recursive: true })
// NB the runtime manifest is written by voice-generate.mts, from what is actually on
// disk — listing a key here that has no mp3 would make every miss cost a failed fetch
// before falling back.
writeFileSync('scripts/.voice-corpus.json', JSON.stringify(lines, null, 2))

console.log(`${lines.length} distinct lines · ${chars.toLocaleString()} chars`)
console.log(`longest: ${lines[0]?.chars} chars — "${lines[0]?.text.slice(0, 70)}…"`)
console.log(`wrote public/audio/manifest.json + scripts/.voice-corpus.json`)
