/**
 * Grade 3 · Module 1 lessons (docs/new-flow/grade3-module1-scripts.md).
 * ⚠️ The expected answers are WRITTEN OUT here from the approved document, never derived from the
 * lesson data — a check that computes its expectation from the thing under test cannot fail.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { GRADE3_MODULE1 } from '@/features/lessons/grade3Module1'
import {
  answerOf, START, next, back, check, afterWorked, nextPractice, replayLesson, hintsFor, wonFor, scratchLineMax, type Op, type FlowState, type Picture,
} from '@/features/lessons/script'

// [your turn, twin, practice 1–5] — copied from the "Answers:" lines of the approved scripts.
const ANSWERS: Record<string, number[]> = {
  'g3m1-t1': [15, 10, 6, 10, 20, 20, 12],
  'g3m1-t2': [12, 10, 12, 10, 20, 25, 16],
  'g3m1-t3': [40, 15, 8, 30, 20, 2, 12],
  'g3m1-t4': [35, 60, 8, 50, 40, 18, 30],
  'g3m1-t5': [20, 18, 9, 16, 24, 21, 20],
  'g3m1-t6': [5, 3, 4, 5, 3, 6, 4],
  'g3m1-t7': [3, 5, 5, 2, 3, 6, 5],
  'g3m1-t8': [10, 3, 5, 3, 4, 7, 6],
}
const MODULE_UNITS = [2, 3, 4, 5, 10]

const opsOf = (id: string) => {
  const l = GRADE3_MODULE1.find(x => x.id === id)!
  return [l.turn.op, l.turn.twin.op, ...l.practice.map(p => p.problem.op)]
}

describe('Grade 3 · Module 1 scripts', () => {
  it('has the 8 approved topics, in order', () => {
    expect(GRADE3_MODULE1.map(l => l.title)).toEqual([
      'Plates of cookies', 'Rows of chairs', 'Turn the tray', 'Counting by 2s, 5s and 10s',
      'Counting by 3s and 4s', 'Share the apples fairly', 'How many bags can we fill?', 'The missing number',
    ])
  })

  it.each(Object.keys(ANSWERS))('%s: every answer matches the approved document', id => {
    expect(opsOf(id).map(answerOf)).toEqual(ANSWERS[id])
  })

  it.each(GRADE3_MODULE1.map(l => [l.id, l] as const))('%s: follows the 9-screen structure', (_id, l) => {
    expect(l.screens).toHaveLength(7)
    expect(l.practice).toHaveLength(5)
    expect(l.screens[2].title).toBe('The big idea')
    expect(l.screens[2].text).toBe(l.bigIdea)
    expect(l.screens[6].title).toBe('One thing not to do')
    for (const s of [l.turn.hint1, l.turn.hint2, l.turn.prompt, l.won.text, l.won.sticker]) expect(s.length).toBeGreaterThan(0)
  })

  it('only uses the Module 1 units (2, 3, 4, 5, 10), and every division comes out exact', () => {
    const uses = (op: Op) => op.t === 'div' ? [op.by] : op.t === 'missing' ? [op.a] : [op.a, op.b]
    for (const l of GRADE3_MODULE1) for (const op of opsOf(l.id)) {
      expect(uses(op).some(u => MODULE_UNITS.includes(u)), `${l.id} ${JSON.stringify(op)}`).toBe(true)
      expect(Number.isInteger(answerOf(op)), `${l.id} ${JSON.stringify(op)}`).toBe(true)
    }
  })

  it('a scratch picture never gives the answer away', () => {
    // Found in review: every scratch number line ended one jump past the answer (or on it).
    for (const l of GRADE3_MODULE1) {
      const problems = [l.turn, l.turn.twin, ...l.practice.map(p => p.problem)]
      for (const p of problems) {
        const pic: Picture = p.picture, ans = answerOf(p.op)
        if (pic.kind === 'line') {
          expect(pic.max, `${l.id}: a scratch line must not carry its own length`).toBeUndefined()
          const max = scratchLineMax(pic.step)
          expect(max, `${l.id}: ${p.text}`).toBeGreaterThanOrEqual(ans)
          expect([max, max - pic.step], `${l.id}: ${p.text}`).not.toContain(ans)
        }
        if (pic.kind === 'triangle') expect(pic.b, l.id).toBeNull()
      }
    }
  })

  it("the twin's hints are about the twin, and never state its answer", () => {
    const tokens = (t: string) => t.match(/\d+/g)?.map(Number) ?? []
    for (const l of GRADE3_MODULE1) {
      const s = { ...START, mode: 'turn' as const, twin: true }
      const hints = hintsFor(l, s).join(' ')
      expect(hints, l.id).not.toBe(`${l.turn.hint1} ${l.turn.hint2}`)
      expect(tokens(hints), `${l.id}: ${hints}`).not.toContain(answerOf(l.turn.twin.op))
      expect(hintsFor(l, { ...s, twin: false })).toEqual([l.turn.hint1, l.turn.hint2])
    }
  })

  it('Screen 9 after the twin only uses numbers from the twin (never the first problem\'s)', () => {
    const nums = (t: string) => new Set(t.match(/\d+/g) ?? [])
    for (const l of GRADE3_MODULE1) {
      const allowed = new Set([...nums(l.turn.twin.text), String(answerOf(l.turn.twin.op))])
      const solved = wonFor(l, { ...START, mode: 'won', twin: true, misses: 0 })
      const helped = wonFor(l, { ...START, mode: 'won', twin: true, misses: 3 })
      for (const w of [solved, helped]) for (const n of nums(`${w.title} ${w.text} ${w.sticker}`)) {
        expect(allowed.has(n), `${l.id}: "${n}" in "${w.text} / ${w.sticker}" is not from the twin`).toBe(true)
      }
      expect(solved).toMatchObject({ title: 'You got it', helped: false })
      expect(helped.title).not.toBe('You got it')
      expect(helped.helped).toBe(true)
      expect(wonFor(l, { ...START, mode: 'won' })).toMatchObject({ title: 'You got it', ...l.won })
    }
  })

  it('every Title, Text, Prompt, Hint and Sticker in the approved document is in the app word for word', () => {
    const doc = readFileSync('docs/new-flow/grade3-module1-scripts.md', 'utf8')
    const topics = doc.split(/\n## Topic /).slice(1)
    expect(topics).toHaveLength(GRADE3_MODULE1.length)
    const missing: string[] = []
    let checked = 0
    topics.forEach((t, i) => {
      const data = JSON.stringify(GRADE3_MODULE1[i])
      for (const [, field, raw] of t.matchAll(/- \*\*(Title|Text|Prompt|Hint after 1 miss|Hint after 2 misses|Math word sticker|Text after the twin|Math word sticker after the twin):\*\* (.+)/g)) {
        const want = raw.trim().replace(/^"(.*)"$/, '$1')
        if (want === 'Now you try' || want === 'You got it') continue   // Screen 8/9 titles live in LessonPlayer
        checked++
        if (!data.includes(JSON.stringify(want).slice(1, -1))) missing.push(`${GRADE3_MODULE1[i].id} ${field}: ${want}`)
      }
    })
    expect(checked).toBeGreaterThan(140)   // positive control: the parser really read the document
    expect(missing).toEqual([])
  })

  it('no math word appears on Screens 1–7 (they belong on the Screen 9 sticker)', () => {
    for (const l of GRADE3_MODULE1) for (const s of l.screens) {
      expect(`${s.title} ${s.text}`, l.id).not.toMatch(/\barray|commutative|fact family/i)
    }
  })
})

describe('the flow', () => {
  const l = GRADE3_MODULE1[0]   // your turn 15, twin 10, practice 6 10 20 20 12
  const seven = (s: FlowState) => { for (let k = 0; k < 7; k++) s = next(s); return s }

  it('7 taps of Next reach Screen 8, and nothing is asked before it', () => {
    let s = START
    for (let k = 0; k < 6; k++) { s = next(s); expect(s.mode).toBe('lesson') }
    expect(next(s).mode).toBe('turn')
  })

  it('Screen 8: hint, hint, worked steps, then the twin', () => {
    let s = seven(START)
    s = check(l, s, 8);  expect(s.feedback).toBe('hint1')
    s = check(l, s, 8);  expect(s.feedback).toBe('hint2')
    s = check(l, s, 8);  expect(s.feedback).toBe('worked')
    s = afterWorked(s);  expect(s).toMatchObject({ mode: 'turn', twin: true, misses: 0, feedback: null })
    s = check(l, s, 10); expect(s.mode).toBe('won')
  })

  it('a twin missed 3 times still reaches Screen 9 — as "keep practicing", never "you got it" — then practice', () => {
    let s = afterWorked({ ...seven(START), feedback: 'worked', misses: 3 })
    for (let k = 0; k < 3; k++) s = check(l, s, 1)
    expect(s.feedback).toBe('worked')
    s = afterWorked(s)
    expect(s.mode).toBe('won')
    expect(wonFor(l, s).helped).toBe(true)
  })

  it('practice: a miss shows the big idea, a second shows the worked steps, and the lesson replay comes back to the same problem', () => {
    let s: FlowState = { ...seven(START), mode: 'practice', practice: 2 }
    s = check(l, s, 1);  expect(s.feedback).toBe('idea')
    s = check(l, s, 1);  expect(s.feedback).toBe('worked')
    s = replayLesson(s); expect(s).toMatchObject({ mode: 'lesson', screen: 0 })
    s = seven(s);        expect(s).toMatchObject({ mode: 'practice', practice: 2, feedback: null })
  })

  it('a problem answered right after watching the lesson again does not count as on your own', () => {
    let s: FlowState = { ...seven(START), mode: 'practice', practice: 1 }
    s = check(l, s, 1); s = check(l, s, 1)
    s = seven(replayLesson(s))
    s = check(l, s, 10)
    expect(s.feedback).toBe('right')
    expect(s.solo).not.toContain(1)
  })

  it('practice counts a problem as solo only when the worked steps were not needed', () => {
    let s: FlowState = { ...START, mode: 'practice', practice: 0 }
    s = check(l, s, 6); expect(s.solo).toEqual([0])
    s = nextPractice(s)
    s = check(l, s, 1); s = check(l, s, 1); s = check(l, s, 10)
    expect(s.solo).toEqual([0])
    for (let k = 0; k < 4; k++) s = nextPractice(s)
    expect(s.mode).toBe('finish')
  })
  it('Back on Screen 8 goes to Screen 7, and Next returns to the same problem (the twin stays the twin)', () => {
    const l = GRADE3_MODULE1[0]
    let s: FlowState = { ...START, mode: 'turn' }
    for (let k = 0; k < 3; k++) s = check(l, s, 999)
    s = afterWorked(s)                          // now on the twin
    s = check(l, s, 999)                        // one miss on the twin
    const b = back(s)
    expect([b.mode, b.screen, b.twin, b.misses, b.feedback]).toEqual(['lesson', 6, true, 1, null])
    const n = next(b)
    expect([n.mode, n.twin, n.misses]).toEqual(['turn', true, 1])
    expect(back({ ...START, screen: 3 })).toEqual({ ...START, screen: 2 })   // Screens 2–7 go one back
    expect(back(START)).toEqual(START)                                     // Screen 1 has nowhere to go
  })
})
