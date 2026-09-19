/**
 * Extract the EXPLANATION lines of every new-flow lesson for external TTS rendering (Chatterbox on Kaggle).
 *
 *   npx tsx scripts/lesson-voice-corpus.mts [outDir]
 *
 * WHAT IS IN: the `say` line of every teaching-screen beat — what she says while teaching, Screens 2–7 —
 * plus each lesson's whole `bigIdea` line, which the player speaks on its own when a practice answer misses.
 *
 * AND (founder's call 2026-09-17) every other FIXED line the player speaks, built by the player's own `SAY` /
 * `hintsFor` / `wonFor`: Screen 1, Screen 8's question with its prompt, both hints for the first problem and the
 * twin, the twin's "Try a new one", Screen 9 (both versions and "keep practicing"), "Right!" and "Here is how this
 * one works.". Explanations sort first, so a run finishes those before starting on these.
 *
 * ⚠️ STILL OUT: practice problems (generated with random numbers by the ladders — no finite set to render; founder:
 * not now) and worked `steps` (they are shown, never spoken). Keys are content-addressed, so re-running this script
 * never re-renders a line that already has a clip.
 *
 * Keys come from clipKey() in src/core/voiceClips.ts — the same function the browser uses to ask "do I have a
 * clip for this line?". It MUST stay byte-identical between here and there or every lookup misses, which is
 * why this imports it rather than re-implementing it.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { MODULES } from '../src/features/lessons/modules.ts'
import { clipKey, normalizeSpoken } from '../src/core/voiceClips.ts'
import { SAY, START, hintsFor, wonFor } from '../src/features/lessons/script.ts'
import { lessonVoice } from '../src/infra/storage/voicePref.ts'
import { renderOf, type VoiceStyle } from '../src/features/lessons/content/voice/styles.ts'

const outDir = process.argv[2] ?? 'scripts/.voice-lessons'

/** Which recorded voice reads a lesson: lessonVoice, the function the player uses, so the two cannot disagree. */
const VOICE = (id: string) => (lessonVoice(id) === 'IvUJKFyjVb5hItY9dJAT' ? 'stevie' : 'teddy')

type Kind = 'beat' | 'bigIdea' | 'screen1' | 'turn' | 'hint' | 'twin' | 'won' | 'feedback'
// `text` is what the voice model reads (renderOf: tags, pauses, symbols spelt out); `key` is the line as the lesson says it.
type Row = { key: string; text: string; style: VoiceStyle; voice: string; grade: number; kind: Kind; where: string }
const ORDER: Kind[] = ['beat', 'bigIdea', 'screen1', 'turn', 'hint', 'twin', 'won', 'feedback']

// By voice + key: identical text is ONE clip PER VOICE. ⚠️ Keyed by text alone (until 2026-09-17), a line said in both a
// Grade 3–5 and a Grade 6–8 lesson went only to whichever voice met it first — 67 Stevie lines were rendered in Teddy
// only, and those Grade 6–8 screens could never find their clip (src/__tests__/lessonVoiceClips.test.ts found it).
const rows = new Map<string, Row>()
let occurrences = 0

for (const m of MODULES) {
  const grade = Number(m.id.match(/^g(\d)/)?.[1] ?? 0)
  for (const l of m.lessons) {
    for (const [i, s] of l.screens.entries()) {
      if (i === 0 || !s.beats) continue          // screen 1 holds the question that becomes the button
      for (const [b, beat] of s.beats.entries()) {
        occurrences++
        add({ text: beat.say, voice: VOICE(l.id), grade, kind: 'beat', where: `${l.id} s${i + 1} b${b + 1}` })
      }
    }
    occurrences++
    add({ text: l.bigIdea, voice: VOICE(l.id), grade, kind: 'bigIdea', where: `${l.id} bigIdea` })

    const voice = VOICE(l.id), line = (kind: Kind, text: string, where: string) => { occurrences++; add({ text, voice, grade, kind, where: `${l.id} ${where}` }) }
    line('screen1', SAY.screen(l.screens[0]), 's1')
    line('turn', SAY.turn(l), 'turn')
    const first = hintsFor(l, { ...START, mode: 'turn' }), twin = hintsFor(l, { ...START, mode: 'turn', twin: true })
    line('hint', first[0], 'hint1'); line('hint', first[1], 'hint2')
    line('hint', twin[0], 'twin hint1'); line('hint', twin[1], 'twin hint2')
    line('twin', SAY.twin(l), 'twin')
    line('won', wonFor(l, { ...START, mode: 'won' }).text, 'won')
    line('won', wonFor(l, { ...START, mode: 'won', twin: true }).text, 'twinWon')
    line('won', wonFor(l, { ...START, mode: 'won', twin: true, misses: 3 }).text, 'keep practicing')
    line('feedback', SAY.right, 'right'); line('feedback', SAY.worked, 'worked')
  }
}

function add(r: Omit<Row, 'key' | 'style'>) {
  const text = normalizeSpoken(r.text)
  if (!text) return
  const key = clipKey(text), { style, say } = renderOf(text)
  const had = rows.get(`${r.voice}:${key}`)
  if (had) { if (!had.where.includes(r.where)) had.where += ` + ${r.where}` ; return }
  rows.set(`${r.voice}:${key}`, { ...r, text: say, style, key })
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
  const mine = all.filter(r => r.voice === voice).sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
  writeFileSync(`scripts/.voice-corpus-lessons-${voice}.json`,
    JSON.stringify(mine.map(r => ({ key: r.key, text: r.text, style: r.style, chars: r.text.length, kind: r.kind, sources: [r.where] })), null, 2) + '\n')
}

const chars = all.reduce((n, r) => n + r.text.length, 0)
const per = (v: string, k: string) => all.filter(r => r.voice === v && r.kind === k).length
console.log(JSON.stringify({
  occurrencesInLessons: occurrences, uniqueClips: all.length, savedByDeduping: occurrences - all.length,
  characters: chars,
  teddy: Object.fromEntries(ORDER.map(k => [k, per('teddy', k)])),
  stevie: Object.fromEntries(ORDER.map(k => [k, per('stevie', k)])),
  outDir,
}, null, 1))
