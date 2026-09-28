/**
 * The 9-screen flow (src/features/lessons/script.ts), driven on EVERY lesson in all 36 modules with that lesson's own
 * problems. lessonsGrade3Module1.test.ts drives it on Grade 3 · Module 1 only, and every later module's problems are
 * `answer`-based rather than `op`-based — a different path through `solutionOf`, `isCorrect` and the twin's hints.
 *
 * Each case asserts the STATE the child ends up in, never only that the screen moved: a wrong answer moves the flow
 * on too (Screen 8 → hint → hint → worked), so "it advanced" proves nothing about whether the answer was right.
 */
import { describe, it, expect } from 'vitest'
import {
  START, next, back, check, afterWorked, toPractice, nextPractice, replayLesson, outcomeOf, hintsFor, wonFor, currentProblem, solutionOf,
  isCorrect, KEEP_GOING, type Answer, type FlowState, type Lesson,
} from '@/features/lessons/script'
import { MODULES } from '@/features/lessons/modules'

/** What a child types for the right answer: the index for a choice, the written answer otherwise. */
const right = (a: Answer) => (typeof a === 'object' && 'choices' in a ? String(a.correct) : typeof a === 'object' && 'frac' in a
  ? `${a.whole ? `${a.whole} ` : ''}${a.frac[0]}/${a.frac[1]}` : typeof a === 'object' && 'time' in a
  ? `${a.time[0]}:${String(a.time[1]).padStart(2, '0')}` : String(a))
/** A wrong answer of the right KIND, so the refusal is about the value and not about a typo. */
const wrong = (a: Answer) => (typeof a === 'object' && 'choices' in a ? String((a.correct + 1) % a.choices.length) : typeof a === 'object' && 'frac' in a
  ? `${a.frac[1] + 7}/${a.frac[0] === 0 ? 1 : Math.abs(a.frac[0])}` : typeof a === 'object' && 'time' in a
  ? `${a.time[0] % 12 + 1}:${String((a.time[1] + 7) % 60).padStart(2, '0')}` : String(a + 1))

const toTurn = () => { let s = START; for (let i = 0; i < 7; i++) s = next(s); return s }

describe.each(MODULES.filter(m => m.lessons.length > 0).map(m => [m.id, m] as const))('%s', (_id, m) => {
  describe.each(m.lessons.map(l => [l.id, l] as const))('%s', (_lid, l: Lesson) => {
    it('its own answers are accepted and a wrong one of the same kind is refused (all 7 problems)', () => {
      for (const p of [l.turn, l.turn.twin, ...l.practice.map(x => x.problem)]) {
        const a = solutionOf(p)
        expect(isCorrect(a, right(a)), `${l.id} "${p.text}" refuses its own answer ${right(a)}`).toBe(true)
        expect(isCorrect(a, wrong(a)), `${l.id} "${p.text}" accepts ${wrong(a)}`).toBe(false)
      }
    })

    it('Screens 1–7 ask nothing; Next seven times reaches Screen 8 on the first problem; Back returns to Screen 7', () => {
      let s = START
      for (let i = 0; i < 7; i++) { expect(currentProblem(l, s)).toBeNull(); expect(check(l, s, right(solutionOf(l.turn)))).toEqual(s); s = next(s) }
      expect(s).toMatchObject({ mode: 'turn', twin: false, misses: 0 })
      expect(currentProblem(l, s)).toBe(l.turn)
      expect(back(s)).toMatchObject({ mode: 'lesson', screen: 6 })
    })

    it('Screen 8 right first time → Screen 9 "You got it" with the first problem\'s words', () => {
      const s = check(l, toTurn(), right(solutionOf(l.turn)))
      expect(s).toMatchObject({ mode: 'won', twin: false, misses: 0 })
      expect(wonFor(l, s)).toEqual({ title: 'You got it', ...l.won, helped: false })
    })

    it('Screen 8 wrong: hint 1, hint 2, the worked steps, then the twin — whose right answer wins with the twin\'s words', () => {
      let s = toTurn()
      const bad = wrong(solutionOf(l.turn))
      s = check(l, s, bad); expect(s).toMatchObject({ mode: 'turn', feedback: 'hint1', misses: 1 })
      expect(hintsFor(l, s)).toEqual([l.turn.hint1, l.turn.hint2])
      s = check(l, s, bad); expect(s).toMatchObject({ mode: 'turn', feedback: 'hint2', misses: 2 })
      s = check(l, s, bad); expect(s).toMatchObject({ mode: 'turn', feedback: 'worked', misses: 3 })
      s = afterWorked(s)
      expect(s).toMatchObject({ mode: 'turn', twin: true, misses: 0, feedback: null })
      expect(currentProblem(l, s)).toBe(l.turn.twin)
      const [h1, h2] = hintsFor(l, s)
      expect(h1.trim() && h2.trim(), `${l.id}: the twin has no hints`).toBeTruthy()
      const won = check(l, s, right(solutionOf(l.turn.twin)))
      expect(won).toMatchObject({ mode: 'won', twin: true })
      expect(wonFor(l, won)).toEqual({ title: 'You got it', ...l.twinWon, helped: false })
    })

    it('the twin missed three times still reaches Screen 9 — as "keep practicing", never "you got it"', () => {
      let s = afterWorked({ ...toTurn(), misses: 3, feedback: 'worked' })
      const bad = wrong(solutionOf(l.turn.twin))
      for (let i = 0; i < 3; i++) s = check(l, s, bad)
      s = afterWorked(s)
      expect(s).toMatchObject({ mode: 'won', twin: true, misses: 3 })
      expect(wonFor(l, s)).toMatchObject({ title: KEEP_GOING.title, text: KEEP_GOING.text, helped: true })
    })

    it('practice: right first try is solo and "first"; a miss is "second"; two misses are "worked" and not solo; 5 problems then finish', () => {
      let s: FlowState = toPractice({ ...START, mode: 'won' })
      const ps = l.practice.map(x => x.problem)
      s = check(l, s, right(solutionOf(ps[0])))
      expect([s.feedback, outcomeOf(s), s.solo]).toEqual(['right', 'first', [0]])
      s = nextPractice(s)
      s = check(l, s, wrong(solutionOf(ps[1]))); expect(s.feedback).toBe('idea')
      s = check(l, s, right(solutionOf(ps[1])))
      expect([s.feedback, outcomeOf(s), s.solo]).toEqual(['right', 'second', [0, 1]])
      s = nextPractice(s)
      s = check(l, s, wrong(solutionOf(ps[2]))); s = check(l, s, wrong(solutionOf(ps[2])))
      expect([s.feedback, outcomeOf(s), s.solo]).toEqual(['worked', 'worked', [0, 1]])
      // Watching the lesson again comes back to the same problem, not counted as on their own.
      s = replayLesson(s)
      for (let i = 0; i < 7; i++) s = next(s)
      expect(s).toMatchObject({ mode: 'practice', practice: 2, misses: 2 })
      s = check(l, s, right(solutionOf(ps[2])))
      expect(s.solo).toEqual([0, 1])
      s = nextPractice(nextPractice(s))
      expect(s.practice).toBe(4)
      expect(nextPractice(s).mode).toBe('finish')
    })
  })
})
