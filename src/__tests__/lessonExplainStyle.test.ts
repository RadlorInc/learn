/**
 * The founder's two documents (2026-09-22, "Topic_Explanation" and "Chatterbox_Audio_Fix"; rules in docs/new-flow/voice.md)
 * as a gate, one describe per module: `npx vitest run src/__tests__/lessonExplainStyle.test.ts -t g4m2`.
 *
 * WHAT IT HOLDS EVERY TOPIC TO
 * - Every line the voice will read (renderOf(...).say) is words, digits and plain punctuation: no symbol Chatterbox
 *   might read aloud as "slash" or "colon", no `...`, no [tag], no stacked `!`, no run of CAPS words.
 * - Screens 2–7 (the teach): no ellipsis, at most one `!` per screen, no banned lecture phrases, at least one real
 *   question somewhere in Screens 2–6, a one-sentence big idea, and Screen 7 opening "Here's the part people mix up."
 *   and ending "Okay. Your turn." with exactly one or two CAPS warning words.
 * - Every teaching screen (2–7) has a chalkboard, since chalk is what the child sees while she talks.
 * Written out by hand here, never imported from the lessons — a gate that reads its expectation from the thing under test
 * passes because the code equals itself.
 */
import { describe, it, expect } from 'vitest'
import { MODULES } from '@/features/lessons/modules'
import { SAY, START, hintsFor, wonFor, type Lesson } from '@/features/lessons/script'
import { renderOf, SPEAKABLE } from '@/features/lessons/content/voice/styles'

const OPEN = "Here's the part people mix up."
const CLOSE = 'Okay. Your turn.'
const BANNED = [/welcome, student/i, /let's dive in/i, /great job engaging/i, /in this module/i, /as previously discussed/i]
const sentences = (t: string) => t.split(/(?<=[.?!])\s+/).filter(Boolean)
const capsWords = (t: string) => t.split(/\s+/).map(w => w.replace(/[^A-Za-z]/g, '')).filter(w => w.length >= 2 && w === w.toUpperCase())

const spoken = (l: Lesson): string[] => [
  ...l.screens.slice(1).flatMap(s => (s.beats ?? []).map(b => b.say)), l.bigIdea,
  SAY.screen(l.screens[0]), SAY.turn(l), SAY.twin(l), SAY.right, SAY.worked,
  ...hintsFor(l, { ...START, mode: 'turn' }), ...hintsFor(l, { ...START, mode: 'turn', twin: true }),
  wonFor(l, { ...START, mode: 'won' }).text, wonFor(l, { ...START, mode: 'won', twin: true }).text,
  wonFor(l, { ...START, mode: 'won', twin: true, misses: 3 }).text,
].filter(Boolean)

/** Everything wrong with one topic, as sentences a writer can act on. Empty = the topic follows the documents. */
export function explainProblems(l: Lesson): string[] {
  const bad: string[] = []
  for (const line of spoken(l)) {
    const say = renderOf(line).say
    if (!SPEAKABLE.test(say)) bad.push(`voice reads a symbol — row key ${JSON.stringify(line)} is read as ${JSON.stringify(say)} (give it a \`say\` in content/voice/<module>.ts)`)
    if (/\.\.\.|…|\[|!!/.test(say)) bad.push(`voice line has ... / [tag] / !!: "${say}"`)
    if (capsWords(say).length > 2) bad.push(`more than two CAPS words: "${say}"`)
  }
  const teach = l.screens.slice(1, 7)
  if (teach.length !== 6) bad.push(`expected 6 teaching screens, found ${teach.length}`)
  teach.forEach((s, i) => {
    const n = i + 2
    if (!s.beats?.length) bad.push(`screen ${n} has no beats`)
    if (!s.chalk?.length) bad.push(`screen ${n} has no chalkboard`)
    if (/\.\.\.|…/.test(s.text)) bad.push(`screen ${n} has an ellipsis`)
    if ((s.text.match(/!/g) ?? []).length > 1) bad.push(`screen ${n} has more than one "!"`)
    for (const b of BANNED) if (b.test(s.text)) bad.push(`screen ${n} uses a banned phrase (${b.source})`)
    if (n !== 7 && capsWords(s.text).length) bad.push(`screen ${n} has CAPS (${capsWords(s.text).join(', ')}) — CAPS is only for Screen 7's warning word`)
  })
  if (!teach.slice(0, 5).some(s => s.text.includes('?'))) bad.push('no real question in Screens 2–6')
  if (sentences(l.bigIdea).length !== 1) bad.push(`big idea is ${sentences(l.bigIdea).length} sentences, must be one: "${l.bigIdea}"`)
  const seven = teach[5]
  if (seven) {
    const beats = seven.beats?.map(b => b.say) ?? []
    if (beats[0] !== OPEN) bad.push(`screen 7 must open with "${OPEN}"`)
    if (beats.at(-1) !== CLOSE) bad.push(`screen 7 must end with "${CLOSE}"`)
    const caps = capsWords(seven.text)
    if (caps.length < 1 || caps.length > 2) bad.push(`screen 7 needs one or two CAPS warning words, has ${caps.length}`)
  }
  return bad
}

for (const m of MODULES) {
  describe(m.id, () => {
    for (const l of m.lessons) it(`${l.id} follows the explanation documents`, () => expect(explainProblems(l)).toEqual([]))
  })
}
