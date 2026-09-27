/**
 * Every line a lesson SPEAKS from a recorded clip resolves to that clip the way the player resolves it (2026-09-26):
 * through ITS MODULE's index (src/features/lessons/voice-index, loaded with the module), by key AND check, to the object
 * scripts/audio/manifest.json says is in the bucket. The voice is lessonVoice(lesson id), the function the player uses.
 * Covered lines are what scripts/lesson-voice-corpus.mts renders: each teaching beat's `say`, the big idea, and every
 * fixed line the player builds with SAY / hintsFor / wonFor.
 * ⚠️ Found on its first run (2026-09-17): the corpus deduplicated by text across BOTH voices, so 27 lines said in
 * Grades 3–5 and 6–8 were rendered in Teddy only. Watched red on a wrong grade split too (grade ≤ 6 → Teddy).
 * ⚠️ PROVES "listed", NOT "served": that the object is really in the bucket is upload.py's check (it lists the bucket and
 * audits size + ETag of every manifest object) and anon-probe's on the live URL.
 */
import { it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { MODULES } from '@/features/lessons/modules'
import { lessonVoice, JOSH } from '@/infra/storage/voicePref'
import { clipKey, clipCheck } from '@/core/voiceClips'
import { SAY, START, hintsFor, wonFor, type Lesson } from '@/features/lessons/script'
import { VOICED_LINES } from '@/features/lessons/content/voice/styles'
import { VOICE_INDEX } from '@/features/lessons/voice-index'

const MANIFEST = JSON.parse(readFileSync('scripts/audio/manifest.json', 'utf8')) as { keys: Record<string, { name: string }> }

/** What the player speaks from clips: the beats and big idea, and every fixed line it builds with SAY / hintsFor / wonFor. */
const spoken = (l: Lesson): string[] => [
  ...l.screens.slice(1).flatMap(s => (s.beats ?? []).map(b => b.say)), l.bigIdea,
  SAY.screen(l.screens[0]), SAY.turn(l), SAY.twin(l), SAY.right, SAY.worked,
  ...hintsFor(l, { ...START, mode: 'turn' }), ...hintsFor(l, { ...START, mode: 'turn', twin: true }),
  wonFor(l, { ...START, mode: 'won' }).text, wonFor(l, { ...START, mode: 'won', twin: true }).text,
  wonFor(l, { ...START, mode: 'won', twin: true, misses: 3 }).text,
]

it("every line a lesson speaks reaches its clip through its own module's index, by key AND check", async () => {
  const lost: string[] = []
  let lines = 0
  for (const m of MODULES) {
    const load = VOICE_INDEX[m.id]
    for (const l of m.lessons) {
      if (lessonVoice(l.id) !== JOSH) { lost.push(`${l.id}: not in JOSH_MODULES — every line would be device speech`); continue }
      const index = load ? await load() : {}
      for (const text of spoken(l)) {
        lines++
        const key = clipKey(text), e = index[key]
        if (!e) { lost.push(`${l.id} no index entry: ${text.slice(0, 60)}`); continue }
        if (e[1] !== clipCheck(text)) lost.push(`${l.id} check differs (the corpus hashed another string): ${text.slice(0, 60)}`)
        if (MANIFEST.keys[key]?.name !== `${e[0]}.mp3`) lost.push(`${l.id} names an object the manifest does not: ${key}`)
      }
    }
  }
  expect(lines).toBeGreaterThan(8000)   // positive control: the sweep is really reading the lessons
  expect(lost.slice(0, 10)).toEqual([])
})

it('every render row in content/voice is a line some lesson still says', () => {
  const said = new Set(MODULES.flatMap(m => m.lessons.flatMap(spoken)))
  expect(VOICED_LINES.length).toBeGreaterThan(20)   // positive control: the rows are really being read
  expect(VOICED_LINES.filter(t => !said.has(t))).toEqual([])
})
