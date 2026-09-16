/**
 * Extract the EXPLANATION lines of every new-flow lesson for external TTS rendering (Chatterbox on Kaggle).
 *
 *   npx tsx scripts/lesson-voice-corpus.mts [outDir]
 *
 * WHAT IS IN: the `say` line of every teaching-screen beat — what she says while teaching, Screens 2–7 —
 * plus each lesson's whole `bigIdea` line, which the player speaks on its own when a practice answer misses.
 *
 * ⚠️ WHAT IS DELIBERATELY OUT, and why: every QUESTION and everything wrapped around one. Screen 1's text
 * (it ends in the question that becomes the button), `turn`/`twin`/`practice` problem text, `prompt`,
 * `hint1`/`hint2`, worked `steps`, and the `won`/`twinWon` screens. Founder's call 2026-09-16: render the
 * explanations first, questions later. Adding them later is a re-run of this script with QUESTIONS = true,
 * and because keys are content-addressed nothing already rendered is re-billed or re-rendered.
 *
 * Keys come from clipKey() in src/core/voiceClips.ts — the same function the browser uses to ask "do I have a
 * clip for this line?". It MUST stay byte-identical between here and there or every lookup misses, which is
 * why this imports it rather than re-implementing it.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { MODULES } from '../src/features/lessons/modules.ts'
import { clipKey, normalizeSpoken } from '../src/core/voiceClips.ts'

const outDir = process.argv[2] ?? 'scripts/.voice-lessons'

/** Which recorded voice reads which grades. The founder picks; this is only the split the files are cut on. */
const VOICE = (grade: number) => (grade <= 5 ? 'teddy' : 'stevie')

type Row = { key: string; text: string; voice: string; grade: number; kind: 'beat' | 'bigIdea'; where: string }

const rows = new Map<string, Row>()   // by key — identical text anywhere is ONE clip
let occurrences = 0

for (const m of MODULES) {
  const grade = Number(m.id.match(/^g(\d)/)?.[1] ?? 0)
  for (const l of m.lessons) {
    for (const [i, s] of l.screens.entries()) {
      if (i === 0 || !s.beats) continue          // screen 1 holds the question that becomes the button
      for (const [b, beat] of s.beats.entries()) {
        occurrences++
        add({ text: beat.say, voice: VOICE(grade), grade, kind: 'beat', where: `${l.id} s${i + 1} b${b + 1}` })
      }
    }
    occurrences++
    add({ text: l.bigIdea, voice: VOICE(grade), grade, kind: 'bigIdea', where: `${l.id} bigIdea` })
  }
}

function add(r: Omit<Row, 'key'>) {
  const text = normalizeSpoken(r.text)
  if (!text) return
  const key = clipKey(text)
  const had = rows.get(key)
  if (had) { if (!had.where.includes(r.where)) had.where += ` + ${r.where}` ; return }
  rows.set(key, { ...r, text, key })
}

const all = [...rows.values()]
const csv = (list: Row[]) =>
  'filename,text\n' + list.map(r => `${r.key}.wav,"${r.text.replace(/"/g, '""')}"`).join('\n') + '\n'

mkdirSync(outDir, { recursive: true })
for (const voice of ['teddy', 'stevie']) {
  const mine = all.filter(r => r.voice === voice)
  writeFileSync(`${outDir}/lines-${voice}.csv`, csv(mine.filter(r => r.kind === 'beat')))
  writeFileSync(`${outDir}/bigideas-${voice}.csv`, csv(mine.filter(r => r.kind === 'bigIdea')))
}
writeFileSync(`${outDir}/lines-all.jsonl`, all.map(r => JSON.stringify(r)).join('\n') + '\n')

// The corpora the Kaggle notebook renders (scripts/chatterbox-kaggle.ipynb → scripts/chatterbox-render.py), in the
// renderer's own shape. Written to scripts/, NOT outDir: the notebook git-clones the repo and reads them from there,
// so they must be committed and pushed before a run can see them. Beats first, then the big ideas, so an
// interrupted run has rendered the teaching screens before the practice-miss line.
for (const voice of ['teddy', 'stevie']) {
  const mine = all.filter(r => r.voice === voice).sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'beat' ? -1 : 1))
  writeFileSync(`scripts/.voice-corpus-lessons-${voice}.json`,
    JSON.stringify(mine.map(r => ({ key: r.key, text: r.text, chars: r.text.length, kind: r.kind, sources: [r.where] })), null, 2) + '\n')
}

const chars = all.reduce((n, r) => n + r.text.length, 0)
const per = (v: string, k: string) => all.filter(r => r.voice === v && r.kind === k).length
console.log(JSON.stringify({
  occurrencesInLessons: occurrences, uniqueClips: all.length, savedByDeduping: occurrences - all.length,
  characters: chars,
  teddy: { beats: per('teddy', 'beat'), bigIdeas: per('teddy', 'bigIdea') },
  stevie: { beats: per('stevie', 'beat'), bigIdeas: per('stevie', 'bigIdea') },
  outDir,
}, null, 1))
