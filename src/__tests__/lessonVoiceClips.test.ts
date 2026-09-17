/**
 * Every line a lesson SPEAKS from a recorded clip must have that clip in the voice the lesson plays in — or be queued
 * in that voice's render corpus, so the next Kaggle run makes it. Covered lines are what
 * scripts/lesson-voice-corpus.mts renders: each teaching beat's `say` and the lesson's `bigIdea`. The voice is
 * lessonVoice(grade), the function the player uses; the expectation is the files on disk.
 * ⚠️ Found on its first run (2026-09-17): the corpus deduplicated by text across BOTH voices, so 27 lines said in
 * Grades 3–5 and 6–8 were rendered in Teddy only. Watched red on a wrong grade split too (grade ≤ 6 → Teddy).
 */
import { it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { MODULES } from '@/features/lessons/modules'
import { lessonVoice } from '@/infra/storage/voicePref'
import { clipKey } from '@/core/voiceClips'

const onDisk = (voice: string): Set<string> => new Set(JSON.parse(readFileSync(`public/audio/${voice}/manifest.json`, 'utf8')))
const CORPUS: Record<string, string> = { XjGYkUkzth8BPs29fmcV: 'teddy', IvUJKFyjVb5hItY9dJAT: 'stevie' }
const queued = (voice: string): Set<string> =>
  new Set((JSON.parse(readFileSync(`scripts/.voice-corpus-lessons-${CORPUS[voice]}.json`, 'utf8')) as { key: string }[]).map(l => l.key))

it("every beat and big idea has a clip in its lesson's voice, or is queued to be rendered in it", () => {
  const lost: string[] = [], waiting = new Set<string>()
  let lines = 0
  for (const m of MODULES) for (const l of m.lessons) {
    const voice = lessonVoice(m.grade), have = onDisk(voice), todo = queued(voice)
    for (const text of [...l.screens.slice(1).flatMap(s => (s.beats ?? []).map(b => b.say)), l.bigIdea]) {
      lines++
      const key = clipKey(text)
      if (have.has(key)) continue
      if (todo.has(key)) waiting.add(`${voice}:${key}`)
      else lost.push(`${l.id} (${CORPUS[voice]}): ${text.slice(0, 60)}`)
    }
  }
  expect(lines).toBeGreaterThan(4000)   // positive control: the sweep is really reading the lessons
  expect(lost.slice(0, 10)).toEqual([])
  // Rendered but not yet merged. Lower this as zips are merged; it must never grow without a corpus change.
  expect(waiting.size).toBeLessThanOrEqual(27)
})
