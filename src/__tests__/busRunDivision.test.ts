/**
 * THE MINIBUS RUN (`division`) — the vertical gate: this chapter's own maths, words and ladder.
 */
import { describe, it, expect } from 'vitest'
import {
  makeRound, mkSharing, mkGrouping, mkRemainder, graded, missFor, verdictFor, headline, explainBeats,
  loadFor, enterLoad, EMPTY_LOAD, padChoices, instructionFor, sigOf, MAX_COUNT, MAX_KIDS, DEMO, GUIDED,
  type BrRound, type Tier,
} from '@/features/chapters/story/busRun'

const TIERS: Tier[] = [1, 2, 3]
const load = (n: number) => enterLoad(EMPTY_LOAD, n)
function everyRound(fn: (r: BrRound, d: Tier) => void, draws = 400) {
  const kinds = ['sharing', 'grouping', 'remainder']
  for (const d of TIERS) for (let i = 0; i < draws; i++) fn(makeRound(d, kinds.slice(0, i % 4)), d)
}

describe('The Minibus Run · the round', () => {
  it('every round is answerable, and its own answer grades true', () => {
    everyRound(r => expect(graded(r, load(r.answer)), sigOf(r)).toBe(true))
  })

  /** ⚠️ Only counts a child can actually GIVE. `enterLoad` clamps into 0..MAX_COUNT because that is
   *  a hand's whole range, so asking about 11 tests the clamp rather than the grader. */
  it('a wrong count never grades true', () => {
    everyRound(r => {
      for (let n = 0; n <= MAX_COUNT; n++) expect(graded(r, load(n)), `${sigOf(r)} @ ${n}`).toBe(n === r.answer)
    }, 120)
  })

  /** ⚠️⚠️ THE ONE-INSTRUMENT-TWO-INPUTS RULE. A hand reads 0–10, so an answer above ten is a question
   *  the tap path can reach and the camera path cannot — and this band's whole speciality is the
   *  camera. The bound is the generator's job, not the instrument's. */
  it('every answer is inside a hand’s reach', () => {
    everyRound(r => {
      expect(r.answer, `${sigOf(r)} · answer ${r.answer}`).toBeLessThanOrEqual(MAX_COUNT)
      expect(r.answer).toBeGreaterThanOrEqual(0)
    })
  })

  /** ⚠️ chapter-craft §0b, and The Mission Brief shipped exactly this on 16% of its division rounds:
   *  a SQUARE run makes the answer a number already printed on the ticket. */
  it('never a square run — the answer is never a given', () => {
    everyRound(r => {
      expect(r.buses, sigOf(r)).not.toBe(r.seats)
      expect(r.answer, `${sigOf(r)}: answer equals the class size`).not.toBe(r.kids)
    })
  })

  it('a remainder round always has a real remainder, and it is smaller than a busload', () => {
    everyRound(r => {
      if (r.qType !== 'remainder') { expect(r.left).toBe(0); return }
      expect(r.left, sigOf(r)).toBeGreaterThanOrEqual(1)
      expect(r.left, sigOf(r)).toBeLessThan(r.seats)
      expect(r.kids).toBe(r.buses * r.seats + r.left)
    })
  })

  it('the children always add up, and the class stays drawable', () => {
    everyRound(r => {
      expect(r.kids).toBe(r.buses * r.seats + r.left)
      expect(r.kids, `${sigOf(r)} · ${r.kids} children is a pile, not a class`).toBeLessThanOrEqual(MAX_KIDS)
    })
  })
})

describe('The Minibus Run · what the board may print', () => {
  const tokens = (s: string): string[] => s.match(/\d+/g) ?? []

  it('the board never shows the answer before the commit', () => {
    everyRound(r => expect(tokens(headline(r, false)), `${sigOf(r)} · ${headline(r, false)}`).not.toContain(String(r.answer)))
  })

  it('…and shows the whole division once it is revealed', () => {
    everyRound(r => expect(tokens(headline(r, true))).toContain(String(r.answer)), 60)
  })

  /** The bus count is a GIVEN when the question is how many ride in each, and the ANSWER when the
   *  question is how many buses — one expression, two meanings. */
  it('the bus count is printed only on the round where it is a given', () => {
    everyRound(r => {
      const shown = tokens(headline(r, false)).includes(String(r.buses))
      if (r.qType === 'grouping') expect(shown, `${sigOf(r)}: grouping printed its own answer`).toBe(false)
    })
  })

  it('no string the child reads is malformed, and nothing says "1 children"', () => {
    everyRound(r => {
      for (const s of [r.prompt, r.spoken, r.tag, headline(r, false), headline(r, true), missFor(r)]) {
        expect(s, sigOf(r)).not.toMatch(/undefined|NaN|null/)
        expect(s, sigOf(r)).not.toMatch(/\b1 (children|buses|seats)\b/)
      }
    })
  })

  it('the verdict is well-formed on every round, right or wrong', () => {
    everyRound(r => {
      for (const n of [r.answer, r.answer + 1, 0]) {
        const v = verdictFor(r, load(n))
        expect(v.text, sigOf(r)).not.toMatch(/undefined|NaN|\b1 (children|buses)\b/)
        expect(v.text.trim().length).toBeGreaterThan(0)
      }
    }, 120)
  })
})

describe('The Minibus Run · the words after a miss', () => {
  it('a miss line never names the answer', () => {
    everyRound(r => expect(missFor(r).match(/\d+/g) ?? []).not.toContain(String(r.answer)))
  })

  it('two different rounds of the same type say the same thing', () => {
    expect(missFor(mkSharing(4, 6))).toBe(missFor(mkSharing(3, 8)))
    expect(missFor(mkGrouping(5, 4))).toBe(missFor(mkGrouping(7, 3)))
    expect(missFor(mkRemainder(3, 6, 2))).toBe(missFor(mkRemainder(4, 5, 1)))
  })

  it('the verdict on a miss never names the answer', () => {
    everyRound(r => {
      const wrong = r.answer === MAX_COUNT ? r.answer - 2 : r.answer + 2
      const v = verdictFor(r, load(wrong))
      expect(v.ok).toBe(false)
      expect(v.text.match(/\d+/g) ?? [], `${sigOf(r)} · ${v.text}`).not.toContain(String(r.answer))
    }, 200)
  })

  /** ⚠️ The consequence — "we need one more bus" — belongs to the REVEAL, deliberately not to the
   *  scored question, because rounding a bus order up is a different skill from a remainder. */
  it('a correct remainder names the consequence rather than asking for it', () => {
    const r = mkRemainder(3, 6, 2)
    const v = verdictFor(r, load(2))
    expect(v.ok).toBe(true)
    expect(v.text).toMatch(/one more bus/)
    expect(r.prompt, 'the question must never ask how many buses are needed').not.toMatch(/how many buses/i)
  })
})

describe('The Minibus Run · the yard', () => {
  /** ⚠️⚠️ THE ORACLE THIS CHAPTER NEARLY SHIPPED. The first build loaded the buses live from
   *  whatever number was showing, so the pavement read "still waiting" until the number was right
   *  and then flipped to "pavement clear" — tap 1, 2, 3… and watch the label. Found by driving it
   *  on screen, because every piece was individually correct. Nothing may move before the commit. */
  it('nobody boards before the commit, whatever number is showing', () => {
    everyRound(r => {
      for (let n = 0; n <= MAX_COUNT; n++) {
        const v = loadFor(r, n, false)
        expect(v.waiting, `${sigOf(r)} @ ${n}: the pavement reacted before the commit`).toBe(r.kids)
        expect(v.perBus.every(x => x === 0), `${sigOf(r)} @ ${n}: a bus loaded before the commit`).toBe(true)
      }
    }, 120)
  })

  /** …but the child's number IS visible, so the instrument is not a blind pad. */
  it('the proposal is shown as a setting rather than as a result', () => {
    everyRound(r => {
      for (const n of [1, 3, MAX_COUNT]) {
        const v = loadFor(r, n, false)
        if (r.qType === 'grouping') expect(v.perBus.length, sigOf(r)).toBe(Math.min(n, MAX_COUNT))
        else expect(v.marked, sigOf(r)).toBe(n)
      }
    }, 90)
  })

  it('before anyone is named, everybody is still on the pavement', () => {
    everyRound(r => {
      const v = loadFor(r, null)
      expect(v.waiting).toBe(r.kids)
      expect(v.perBus.every(n => n === 0)).toBe(true)
    }, 60)
  })

  it('the correct answer clears the pavement once it is committed', () => {
    everyRound(r => {
      if (r.qType === 'remainder') return
      expect(loadFor(r, r.answer, true).waiting, sigOf(r)).toBe(0)
    })
  })

  it('a wrong committed answer leaves a visibly wrong yard — allowed, not blocked', () => {
    everyRound(r => {
      if (r.qType === 'remainder') return
      expect(loadFor(r, Math.max(0, r.answer - 1), true).waiting, sigOf(r)).toBeGreaterThan(0)
    }, 200)
  })

  it('nobody is ever duplicated or lost', () => {
    everyRound(r => {
      for (const n of [0, 1, r.answer, MAX_COUNT]) {
        const v = loadFor(r, n, true)
        if (r.qType === 'remainder') continue   // waiting is the child's CLAIM here, not a derivation
        expect(v.perBus.reduce((a, b) => a + b, 0) + v.waiting, `${sigOf(r)} @ ${n}`).toBe(r.kids)
        expect(v.perBus.every(x => x >= 0)).toBe(true)
      }
    }, 150)
  })

  it('the pad offers every count a hand can show, including zero', () => {
    expect(padChoices()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('a count is clamped into reach rather than refused', () => {
    expect(enterLoad(EMPTY_LOAD, 99).n).toBe(MAX_COUNT)
    expect(enterLoad(EMPTY_LOAD, -4).n).toBe(0)
  })

  it('the cue names the gesture and the reading it wants', () => {
    expect(instructionFor('hand', 'sharing')).toMatch(/hold up/i)
    expect(instructionFor('tap', 'grouping')).toMatch(/tap/i)
    expect(instructionFor('hand', 'sharing')).not.toBe(instructionFor('hand', 'grouping'))
  })
})

describe('The Minibus Run · the ladder grows the SKILL', () => {
  const drawn = (d: Tier, n = 300) => Array.from({ length: n }, (_, i) => makeRound(d, ['sharing', 'grouping', 'remainder'].slice(0, i % 4)))

  it('L1 is sharing only — dealing round the buses, which a child already does with cards', () => {
    for (const r of drawn(1)) expect(r.qType).toBe('sharing')
  })

  it('L2 adds GROUPING, the same operation read from the other end', () => {
    expect(new Set(drawn(2).map(r => r.qType))).toContain('grouping')
  })

  it('L3 is where it stops coming out even', () => {
    const kinds = drawn(3).map(r => r.qType)
    expect(kinds.filter(k => k === 'remainder').length / kinds.length).toBeGreaterThan(0.3)
  })

  it('every reading is reachable, so coverage can withhold the mastery exit honestly', () => {
    const seen = new Set<string>()
    for (const d of TIERS) for (let i = 0; i < 200; i++) seen.add(makeRound(d, ['sharing', 'grouping', 'remainder'].slice(0, i % 4)).qType)
    expect([...seen].sort()).toEqual(['grouping', 'remainder', 'sharing'])
  })
})

describe('The Minibus Run · the worked example', () => {
  it('the demo ends holding the answer, and every beat is well-formed', () => {
    for (const r of [...DEMO, GUIDED]) {
      const beats = explainBeats(r)
      expect(beats.length).toBeGreaterThan(2)
      expect(beats[beats.length - 1].load, sigOf(r)).toBe(r.answer)
      for (const b of beats) {
        expect(b.say).not.toMatch(/undefined|NaN/)
        expect(b.say, sigOf(r)).not.toMatch(/\b1 (children|buses)\b/)
        if (b.load !== null) expect(b.load).toBeLessThanOrEqual(MAX_COUNT)
      }
    }
  })

  /** ⚠️ The beat that does the arithmetic must not be a still — a sentence over an unchanged picture
   *  teaches nothing on a device with no voice. */
  it('the working moves the picture, not just the words', () => {
    everyRound(r => {
      const beats = explainBeats(r)
      const stills = beats.filter((b, i) => i > 0 && b.load === beats[i - 1].load)
      expect(stills.length, `${sigOf(r)}: ${stills.length} still beats`).toBeLessThanOrEqual(1)
    }, 60)
  })

  it('the worked examples cover all three readings, remainder included', () => {
    expect(DEMO.map(r => r.qType).sort()).toEqual(['grouping', 'remainder', 'sharing'])
    expect(DEMO.some(r => r.left > 0), 'no demo shows a remainder').toBe(true)
  })
})
