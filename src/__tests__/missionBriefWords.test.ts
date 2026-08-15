/**
 * Gate for THE MISSION BRIEF (9–11 · wordProblems).
 *
 * ⚠️ THIS CHAPTER HAD NO GATE AT ALL UNTIL THE PORT, because its generator lived inside the React
 * component — nothing about its arithmetic, its distractors or its words could be reached by a test.
 * Extracting `story/words.ts` changed no behaviour; it made the behaviour checkable, and the first
 * thing that became checkable is the rule the chapter turns on.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  makeRound, choicesFor, sigFor, explainBeats, missFor,
  mkAdd, mkSub, mkMul, mkDiv, mkMulSub, mkMulAdd, type WpRound,
} from '@/features/chapters/story/words'
import { MISSION_BRIEF_CONFIG, toTask } from '@/features/chapters/teen/games/MissionBriefGame'

const SCENE = readFileSync('src/features/chapters/teen/games/MissionBriefGame.tsx', 'utf8')
/** ⚠️ COMMENTS STRIPPED BEFORE ANY SOURCE CHECK. A gate's own prose trips its own regex: the
 *  "shuffles nothing" check below matched the sentence explaining that it shuffles nothing. */
const CODE = SCENE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const TIERS = [1, 2, 3] as const
const draw = (n = 300) => Array.from({ length: n }, () => TIERS.map(d => makeRound(d))).flat()

describe('the arithmetic', () => {
  it('every round states a sum that is actually true', () => {
    for (const r of draw()) {
      const [lhs, rhs] = r.equation.split(' = ')
      expect(Number(rhs), r.equation).toBe(r.answer)
      // the left side must be the numbers the STORY used, in the order it used them
      for (const n of [r.a, r.b].filter(Boolean)) expect(lhs, r.equation).toContain(String(n))
    }
  })

  it('every answer is a positive whole number — a story cannot end on −3 crystals', () => {
    for (const r of draw()) {
      expect(Number.isInteger(r.answer), r.equation).toBe(true)
      expect(r.answer, r.equation).toBeGreaterThan(0)
    }
  })

  it('a division round always divides exactly', () => {
    for (let i = 0; i < 400; i++) {
      const r = mkDiv()
      expect(r.a % r.b, r.equation).toBe(0)
    }
  })

  it('the story names the same numbers the sum does', () => {
    for (const r of draw(120)) {
      for (const n of [r.a, r.b]) if (n) expect(r.story, r.story).toMatch(new RegExp(`\\b${n}\\b`))
    }
  })
})

describe('⚠️ the distractors ARE the chapter', () => {
  /**
   * A word problem is only hard because you have to decide WHICH operation it is. So every wrong
   * choice must be the answer you would get by picking the WRONG one — random near-misses would
   * turn the whole chapter into arithmetic with a story stapled on.
   */
  it('offers exactly three choices, all distinct, one of them right', () => {
    for (const r of draw()) {
      expect(r.choices, r.equation).toHaveLength(3)
      expect(new Set(r.choices).size, r.equation).toBe(3)
      expect(r.choices.map(Number), r.equation).toContain(r.answer)
    }
  })

  it('never offers a choice that is not a positive whole number', () => {
    for (const r of draw()) for (const c of r.choices) {
      expect(Number.isInteger(Number(c)), `${r.equation} → ${c}`).toBe(true)
      expect(Number(c), `${r.equation} → ${c}`).toBeGreaterThan(0)
    }
  })

  it('a MULTIPLY round offers the add-instead answer, which is the mistake it is testing for', () => {
    let seen = 0
    for (let i = 0; i < 400; i++) {
      const r = mkMul()
      if (r.choices.includes(String(r.a + r.b))) seen++
    }
    expect(seen, 'the wrong-operation answer should be the usual distractor').toBeGreaterThan(200)
  })

  it('a SUBTRACT round offers the add-instead answer', () => {
    let seen = 0
    for (let i = 0; i < 400; i++) {
      const r = mkSub()
      if (r.choices.includes(String(r.a + r.b))) seen++
    }
    expect(seen).toBeGreaterThan(200)
  })

  it('a two-step round offers the answer you get by stopping after step one', () => {
    for (const mk of [mkMulSub, mkMulAdd]) {
      let seen = 0
      for (let i = 0; i < 400; i++) {
        const r = mk()
        if (r.choices.includes(String(r.a * r.b))) seen++
      }
      expect(seen, 'stopping at the multiply is THE two-step mistake').toBeGreaterThan(200)
    }
  })

  it('the shell is handed those choices unchanged, and shuffles nothing', () => {
    const r = mkAdd()
    expect(MISSION_BRIEF_CONFIG.answerPad!(toTask(r))).toEqual(r.choices.map(Number))
    expect(CODE, 'no second shuffle').not.toMatch(/shuffle/)
  })

  it('choicesFor never pads with a value it already has', () => {
    for (let a = 2; a < 60; a++) {
      const c = choicesFor(a, [a, a, a])     // every distractor useless on purpose
      expect(new Set(c).size, `answer ${a}`).toBe(3)
      expect(c).toContain(String(a))
    }
  })
})

describe('the ladder', () => {
  it('climbs from one step to two', () => {
    const ops = (d: 1 | 2 | 3) => new Set(Array.from({ length: 200 }, () => makeRound(d).op))
    expect([...ops(1)].every(o => o === 'add' || o === 'sub')).toBe(true)
    expect([...ops(2)].every(o => o === 'mul' || o === 'div')).toBe(true)
    expect([...ops(3)].every(o => o === 'mul_sub' || o === 'mul_add')).toBe(true)
  })
})

describe('the words', () => {
  it('⚠️ a miss line names the DECISION and never the answer', () => {
    for (const r of draw(80)) {
      const line = missFor(r)
      expect(line, r.equation).not.toContain(String(r.answer))
      expect(line.length).toBeGreaterThan(15)
    }
  })

  it('the re-teach walks the decision before the arithmetic', () => {
    for (const r of draw(60)) {
      const beats = explainBeats(r)
      expect(beats.length).toBeGreaterThanOrEqual(4)
      expect(beats[0], 'it opens with the story').toBe(r.story)
      expect(beats.at(-1), 'and lands on the answer').toContain(String(r.answer))
    }
  })

  it('dedupes on the MATH, so a re-themed noun is not a new question', () => {
    const r = mkAdd()
    const same: WpRound = { ...r, story: 'different words entirely', choices: [...r.choices] }
    expect(sigFor(same)).toBe(sigFor(r))
  })
})

describe('the chapter on the shell', () => {
  it('declares the band', () => { expect(MISSION_BRIEF_CONFIG.band).toBe('9-11') })

  it('⚠️ shows a `?` until the commit — printing the sum does the one step it tests', () => {
    expect(toTask(mkAdd()).badge).toBe('?')
    expect(SCENE).toMatch(/open \? r\.equation : '\?'/)
  })

  it('is the one chapter in this band on the shell pad, and takes no hand', () => {
    // a word problem's difficulty is choosing the OPERATION; a reading would be a number the child
    // has already worked out, i.e. a slower keyboard rather than a different way of thinking
    expect(MISSION_BRIEF_CONFIG.answerPad).toBeTruthy()
    expect(MISSION_BRIEF_CONFIG.hand).toBeUndefined()
  })
})
