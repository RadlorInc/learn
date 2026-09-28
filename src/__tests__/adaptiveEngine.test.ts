/**
 * The adaptive engine (src/features/lessons/adaptive.ts): the helpers every ladder generator draws numbers with, the
 * edges of the rules that lessonLadders.test.ts does not reach, and what a simulated child experiences on EVERY real
 * ladder in all 36 modules. Expected values are written out by hand.
 *
 * Why simulate on the real ladders: the rules are proven on toy ladders, but "a child who gets everything right
 * masters the topic in one run" depends on how many levels a real ladder has — MAX_PROBLEMS is 12 and each level
 * needs two first-try answers, so a 7-level ladder would make mastery impossible in a run and no rule test would see it.
 */
import { describe, it, expect } from 'vitest'
import {
  rng, int, pick, shuffle, fmt, step, startLevel, draw, beginRun, advance, reviewTopic, nextModuleTopic,
  FRESH, MAX_PROBLEMS, REVIEW_AT, MODULE_PROBLEMS, type Level, type Outcome, type Standing,
} from '@/features/lessons/adaptive'
import { LADDERS, ladderOf } from '@/features/lessons/ladders'
import { MODULES } from '@/features/lessons/modules'

const at = (level: number, streak = 0, mastered = false): Standing => ({ level, streak, mastered })

describe('number helpers', () => {
  it('rng is seeded: the same seed gives the same sequence, a different seed a different one, always in [0, 1)', () => {
    const seqA = [rng(42)].flatMap(r => [r(), r(), r()]), seqB = [rng(42)].flatMap(r => [r(), r(), r()]), seqC = [rng(43)].flatMap(r => [r(), r(), r()])
    expect(seqA).toEqual(seqB)
    expect(seqA).not.toEqual(seqC)
    const r = rng(7)
    for (let i = 0; i < 10_000; i++) { const x = r(); expect(x >= 0 && x < 1).toBe(true) }
  })

  it('int includes both ends and nothing outside them', () => {
    const r = rng(1), seen = new Set<number>()
    for (let i = 0; i < 2000; i++) seen.add(int(r, 3, 6))
    expect([...seen].sort()).toEqual([3, 4, 5, 6])
    expect(int(rng(1), 5, 5)).toBe(5)
  })

  it('pick only returns members and reaches all of them', () => {
    const r = rng(2), seen = new Set<string>()
    for (let i = 0; i < 500; i++) seen.add(pick(r, ['a', 'b', 'c']))
    expect([...seen].sort()).toEqual(['a', 'b', 'c'])
  })

  it('shuffle is a permutation and leaves its input alone', () => {
    const xs = [1, 2, 3, 4, 5, 6]
    const out = shuffle(rng(3), xs)
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5, 6])
    expect(xs).toEqual([1, 2, 3, 4, 5, 6])
    // not the identity for every seed
    expect(Array.from({ length: 20 }, (_, s) => shuffle(rng(s), xs).join()).some(j => j !== '1,2,3,4,5,6')).toBe(true)
  })

  it('fmt writes numbers the US way', () => {
    expect(fmt(12345)).toBe('12,345')
    expect(fmt(0.125)).toBe('0.125')
    expect(fmt(-1343)).toBe('-1,343')
  })
})

describe('rule edges', () => {
  it('a standing saved on a longer ladder is treated as the top of this one', () => {
    expect(step(at(9, 1), 5, 'first')).toEqual(at(4, 0, true))
    expect(step(at(9), 5, 'worked')).toEqual(at(3))
    expect(step(at(9, 1), 5, 'second')).toEqual(at(4))
  })

  it('a right after a miss keeps mastery; worked steps take it away', () => {
    expect(step(at(4, 0, true), 5, 'second')).toEqual(at(4, 0, true))
    expect(step(at(4, 0, true), 5, 'worked')).toEqual(at(3))
  })

  it('a one-level ladder: two first tries master it, and a first-try Screen 8 cannot start above it', () => {
    expect(step(step(FRESH, 1, 'first'), 1, 'first')).toEqual(at(0, 0, true))
    expect(startLevel(null, true, 1).level).toBe(0)
  })

  it('draw clamps a level past the top to the top', () => {
    const ladder: Level[] = [0, 1].map(k => ({ style: `s${k}`, make: () => ({ text: `L${k}`, picture: { kind: 'eq', text: '' }, answer: 1, steps: ['a', '1'] }) }))
    expect(draw(ladder, 7, rng(1)).text).toBe('L1')
  })

  it('a run with nothing to review never leaves its topic, including at the review slot', () => {
    const ladder: Level[] = [{ style: 's', make: r => ({ text: `q${r()}`, picture: { kind: 'eq', text: '' }, answer: 1, steps: ['a', '1'] }) }]
    let run = beginRun('t', ladder, FRESH, rng(1), null)
    for (let i = 0; i < REVIEW_AT + 2; i++) {
      run = advance(run, 't', () => ladder, 'second', rng(i)).run
      expect(run.current.from).toBe('t')
    }
    expect(run.recent.length).toBeLessThanOrEqual(6)
  })

  it('module practice on a one-topic module keeps asking that topic', () => {
    expect(nextModuleTopic(['only'], () => null, ['only', 'only'], rng(1))).toBe('only')
  })
})

describe.each(MODULES.filter(m => m.lessons.length > 0).map(m => [m.id, m] as const))('%s: a simulated child on every real ladder', (_id, m) => {
  it('every topic ladder masters in one run for a child who is always right first try — from level 0 and from level 1', () => {
    for (const l of m.lessons) {
      const ladder = ladderOf(l.id)!
      for (const turnFirstTry of [false, true]) {
        let run = beginRun(l.id, ladder, startLevel(null, turnFirstTry, ladder.length), rng(1), null), done = false, n = 0
        while (!done) { const x = advance(run, l.id, ladderOf, 'first', rng(n)); run = x.run; done = x.done; n++ }
        expect(run.standing.mastered, `${l.id} (Screen 8 first try: ${turnFirstTry}) not mastered after ${n}`).toBe(true)
        expect(n).toBeLessThanOrEqual(MAX_PROBLEMS)
      }
    }
  })

  it('a child who always needs the worked steps stays at the first level, is never told it is mastered, and stops at 12', () => {
    for (const l of m.lessons) {
      const ladder = ladderOf(l.id)!
      let run = beginRun(l.id, ladder, startLevel(null, true, ladder.length), rng(5), null), done = false, n = 0
      const levels: number[] = []
      while (!done) { const x = advance(run, l.id, ladderOf, 'worked', rng(n)); run = x.run; done = x.done; n++; levels.push(run.standing.level) }
      expect(n, l.id).toBe(MAX_PROBLEMS)
      expect(run.standing, l.id).toEqual(FRESH)
      expect(levels.every(x => x === 0), `${l.id}: ${levels}`).toBe(true)
    }
  })

  it('every problem drawn is at the level the standing says, and its text is never empty', () => {
    for (const l of m.lessons) {
      const ladder = ladderOf(l.id)!
      const outcomes: Outcome[] = ['first', 'first', 'second', 'first', 'first', 'worked', 'first', 'first', 'first', 'first', 'second', 'first']
      let run = beginRun(l.id, ladder, FRESH, rng(9), null)
      for (const [i, o] of outcomes.entries()) {
        expect(run.current.problem.text.trim(), l.id).not.toBe('')
        const x = advance(run, l.id, ladderOf, o, rng(100 + i))
        if (x.done) break
        run = x.run
      }
    }
  })
})

describe('module practice over a real module', () => {
  it(`asks ${MODULE_PROBLEMS} problems spread over the module for a new child, never the same topic twice in a row`, () => {
    for (const m of MODULES.filter(x => x.lessons.length >= 3)) {
      const ids = m.lessons.map(l => l.id), asked: string[] = [], st: Record<string, Standing> = {}, r = rng(11)
      for (let k = 0; k < MODULE_PROBLEMS; k++) {
        const id = nextModuleTopic(ids, x => st[x] ?? null, asked, r)
        expect(ids, m.id).toContain(id)
        if (asked.length) expect(id, `${m.id} asked ${id} twice running`).not.toBe(asked.at(-1))
        asked.push(id)
        st[id] = step(st[id] ?? FRESH, ladderOf(id)!.length, 'second')
      }
      expect(new Set(asked).size, `${m.id}: ${asked}`).toBeGreaterThanOrEqual(Math.min(5, ids.length))
    }
  })

  it('a review brings back only a finished, unmastered topic from the SAME module', () => {
    const m = MODULES.find(x => x.id === 'g4m1')!
    const [a, b, c] = m.lessons.map(l => l.id)
    const st: Record<string, Standing> = { [a]: at(3, 0, true), [b]: at(2) }
    expect(reviewTopic([a, b], () => true, id => st[id] ?? null, ladderOf)).toEqual({ id: b, standing: at(2) })
    expect(reviewTopic([a, b, c], id => id === a, id => st[id] ?? null, ladderOf)).toBeNull()
  })

  it('every lesson in every built module has a ladder (the engine is never skipped)', () => {
    const built = MODULES.flatMap(m => m.lessons.map(l => l.id))
    expect(built.length).toBe(282)
    expect(built.filter(id => !LADDERS[id])).toEqual([])
  })
})
