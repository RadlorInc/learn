/**
 * THE PACKING SHED (`timesTables`) — the vertical gate: this chapter's own maths, words and ladder.
 * The horizontal question-quality rules live in `questionQualitySweep.test.ts`; what is here is what
 * only this chapter can know.
 */
import { describe, it, expect } from 'vitest'
import {
  makeRound, mkTotal, mkMissing, mkMulti, graded, missFor, verdictFor, headline, explainBeats,
  enterDigit, labelValue, EMPTY_LABEL, padChoices, instructionFor, sigOf, MAX_DIGITS, DEMO, GUIDED,
  type PkRound, type Tier, type Label,
} from '@/features/chapters/story/packing'

const TIERS: Tier[] = [1, 2, 3]
const DRAWS = 400
const label = (n: number | string): Label => String(n).split('').reduce((l, c) => enterDigit(l, Number(c)), EMPTY_LABEL)
/** every reading, at every tier, with `asked` cycled so a coverage-driven generator is not
 *  deterministic-by-type — the sweep fault The Loading Bay shipped (chapter-craft §4). */
function everyRound(fn: (r: PkRound, d: Tier) => void, draws = DRAWS) {
  const kinds = ['total', 'missing', 'multi']
  for (const d of TIERS) for (let i = 0; i < draws; i++) fn(makeRound(d, kinds.slice(0, i % 4)), d)
}

describe('The Packing Shed · the round', () => {
  it('every round is answerable, and its own answer grades true', () => {
    everyRound(r => expect(graded(r, label(r.answer)), `${sigOf(r)}`).toBe(true))
  })

  it('a wrong number never grades true', () => {
    everyRound(r => {
      expect(graded(r, label(r.answer + 1))).toBe(false)
      if (r.answer > 1) expect(graded(r, label(r.answer - 1))).toBe(false)
    }, 120)
  })

  /** ⚠️ chapter-craft §0b: the commonest way a question prints its own answer is a DEGENERATE DRAW —
   *  two numbers the generator was allowed to make equal — not bad wording. Three chapters shipped
   *  this on 14–25% of their rounds. */
  it('the answer is never a number the ticket already shows', () => {
    everyRound(r => {
      expect(r.answer, `${sigOf(r)}: answer equals the crate count`).not.toBe(r.qType === 'missing' ? -1 : r.crates)
      expect(r.answer, `${sigOf(r)}: answer equals the crate size`).not.toBe(r.per)
      if (r.qType === 'missing') expect(r.crates, `${sigOf(r)}: a SQUARE pallet — the answer is the crate size`).not.toBe(r.per)
    })
  })

  /** ⚠️ The Height Bar's fault: a child's own INTERMEDIATE working landing on a number printed
   *  elsewhere manufactures a wrong answer the chapter created. On a `multi` round the first step is
   *  crates × tens, so that must not be the crate size or the crate count. */
  it('no intermediate step collides with a number on the ticket', () => {
    everyRound(r => {
      if (r.qType !== 'multi') return
      const tens = Math.floor(r.per / 10) * 10
      expect(r.crates * tens).not.toBe(r.per)
      expect(r.crates * (r.per % 10)).not.toBe(r.per)
    })
  })
})

describe('The Packing Shed · what the board may print', () => {
  /** ⚠️ Swept on TOKENS, not substrings: "56" is inside "560" and means nothing of the kind. */
  const tokens = (s: string): string[] => s.match(/\d+/g) ?? []

  it('the board never shows the answer before the commit', () => {
    everyRound(r => {
      expect(tokens(headline(r, false)), `${sigOf(r)} · ${headline(r, false)}`).not.toContain(String(r.answer))
    })
  })

  it('…and shows the whole equation once it is revealed', () => {
    everyRound(r => expect(tokens(headline(r, true))).toContain(String(r.answer)), 60)
  })

  /** The order's total is a GIVEN when the crate count is missing, and the ANSWER otherwise — one
   *  expression, two meanings, which is exactly where The Coin Tray's board went wrong. */
  it('the order total is printed only on the round where it is a given', () => {
    everyRound(r => {
      const shown = tokens(headline(r, false)).includes(String(r.total))
      expect(shown, `${sigOf(r)}`).toBe(r.qType === 'missing')
    })
  })

  it('no string the child reads is malformed', () => {
    everyRound(r => {
      for (const s of [r.prompt, r.spoken, r.tag, headline(r, false), headline(r, true), missFor(r)]) {
        expect(s, sigOf(r)).not.toMatch(/undefined|NaN|null/)
        expect(s.trim().length).toBeGreaterThan(0)
      }
      expect(r.prompt, `${sigOf(r)}: "one crates"`).not.toMatch(/\bone crates\b/)
      /** ⚠️ Caught on a screenshot, not by a check: the prompt opened `${say(crates)}` and read
       *  "nine crates. Two lemons in each." — a sentence starting in lower case, on the chalkboard,
       *  in every `total` and `multi` round. A number spelled as a word is the one place this can
       *  happen, because a numeral needs no capital. */
      expect(r.prompt[0], `${sigOf(r)}: prompt starts lower case — "${r.prompt.slice(0, 24)}…"`).toBe(r.prompt[0].toUpperCase())
      for (const s2 of [r.prompt, r.spoken]) {
        expect(s2, `${sigOf(r)}: a sentence starts lower case mid-string`).not.toMatch(/\.\s+[a-z]/)
      }
    })
  })
})

describe('The Packing Shed · the words after a miss', () => {
  it('a miss line never names the answer', () => {
    everyRound(r => expect(missFor(r).match(/\d+/g) ?? []).not.toContain(String(r.answer)))
  })

  /** ⚠️ The property is one level up from "the same round gives the same words", which is a
   *  tautology: TWO DIFFERENT rounds of the same TYPE must say the same thing, or the wording has
   *  started drifting toward this round's own figures. */
  it('two different rounds of the same type say the same thing', () => {
    expect(missFor(mkTotal(7, 8))).toBe(missFor(mkTotal(4, 9)))
    expect(missFor(mkMissing(6, 7))).toBe(missFor(mkMissing(8, 3)))
    expect(missFor(mkMulti(23, 4))).toBe(missFor(mkMulti(17, 5)))
  })

  it('the verdict on a miss names what was sent, never the answer', () => {
    everyRound(r => {
      const wrong = label(r.answer + 3)
      const v = verdictFor(r, wrong)
      expect(v.ok).toBe(false)
      expect(v.text.match(/\d+/g) ?? [], sigOf(r)).not.toContain(String(r.answer))
      expect(v.text).toContain(String(r.answer + 3))
    }, 120)
  })

  it('the verdict on a correct answer prints the equation', () => {
    everyRound(r => {
      const v = verdictFor(r, label(r.answer))
      expect(v.ok).toBe(true)
      expect(v.text).toMatch(/×/)
    }, 60)
  })

  it('an empty label is a real state and never reads as a number', () => {
    const v = verdictFor(mkTotal(7, 8), EMPTY_LABEL)
    expect(labelValue(EMPTY_LABEL)).toBeNull()
    expect(v.text).not.toMatch(/\d/)
  })
})

describe('The Packing Shed · the label', () => {
  /** ⚠️ chapter-craft §0b: a control that can be disabled while the child believes they have
   *  answered is a DEAD BUTTON, and the commonest way to build one is gating on a fixed length.
   *  Every answer this chapter can draw must be typeable. */
  it('every answer the generator can produce fits on the label', () => {
    everyRound(r => {
      expect(String(r.answer).length, `${sigOf(r)} · answer ${r.answer}`).toBeLessThanOrEqual(MAX_DIGITS)
      expect(labelValue(label(r.answer))).toBe(r.answer)
    })
  })

  it('a leading zero is dropped rather than refused', () => {
    expect(labelValue(label('05'))).toBe(5)
    expect(labelValue(label('007'))).toBe(7)
  })

  it('the label stops at its width instead of growing for ever', () => {
    const long = '1234567'.split('').reduce((l, c) => enterDigit(l, Number(c)), EMPTY_LABEL)
    expect(long.digits.length).toBe(MAX_DIGITS)
  })

  it('the pad offers all ten digits and nothing to eliminate', () => {
    expect([...padChoices()].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('the cue names the gesture and changes when the label has something on it', () => {
    expect(instructionFor('tap', false)).not.toBe(instructionFor('tap', true))
    expect(instructionFor('tap', false)).toMatch(/tap/i)
  })
})

describe('The Packing Shed · the ladder grows the SKILL', () => {
  const drawn = (d: Tier, n = 300) => Array.from({ length: n }, (_, i) => makeRound(d, ['total', 'missing', 'multi'].slice(0, i % 4)))

  it('L1 is the skip-count families — the bridge from the 6–8 chapter', () => {
    for (const r of drawn(1)) {
      expect(r.qType).toBe('total')
      expect([2, 5, 10], `L1 drew a ${r.per}× fact`).toContain(r.per)
    }
  })

  it('L2 reaches the hard middle facts, which is where fluency actually lives', () => {
    const pers = new Set(drawn(2).filter(r => r.qType === 'total').map(r => r.per))
    expect([...pers].every(p => p >= 3 && p <= 9 && p !== 5 && p !== 2 && p !== 10)).toBe(true)
    expect(pers.size, 'L2 should span the middle families').toBeGreaterThan(3)
  })

  it('L3 carries the SECOND skill — 2-digit × 1-digit', () => {
    const multi = drawn(3).filter(r => r.qType === 'multi')
    expect(multi.length).toBeGreaterThan(0)
    for (const r of multi) {
      expect(r.per).toBeGreaterThanOrEqual(10)
      expect(r.crates).toBeGreaterThanOrEqual(3)
    }
  })

  it('every reading is reachable, so coverage can withhold the mastery exit honestly', () => {
    const seen = new Set<string>()
    for (const d of TIERS) for (let i = 0; i < 200; i++) seen.add(makeRound(d, ['total', 'missing', 'multi'].slice(0, i % 4)).qType)
    expect([...seen].sort()).toEqual(['missing', 'multi', 'total'])
  })
})

describe('The Packing Shed · the worked example', () => {
  /** ⚠️ THE SUPPLY RUN FAULT: a demo whose NUMBERS disagree with its own SENTENCES, with every
   *  sentence individually correct and nothing able to see it. The beats are data so the gate drives
   *  the same list the screen plays. */
  it('the demo ends holding the answer, and never opens more crates than exist', () => {
    for (const r of [...DEMO, GUIDED]) {
      const beats = explainBeats(r)
      expect(beats.length).toBeGreaterThan(2)
      expect(beats[beats.length - 1].label, sigOf(r)).toBe(String(r.answer))
      for (const b of beats) {
        expect(b.open).toBeGreaterThanOrEqual(0)
        expect(b.open, sigOf(r)).toBeLessThanOrEqual(r.crates)
        expect(b.say).not.toMatch(/undefined|NaN/)
      }
    }
  })

  /** ⚠️ THE BEAT THAT DOES THE ARITHMETIC MUST NOT BE A STILL. chapter-craft: any beat whose value
   *  equals its predecessor's is a sentence over an unchanged picture, and on a band whose devices
   *  often have no voice that beat teaches nothing. */
  it('the working moves the picture, not just the words', () => {
    everyRound(r => {
      const beats = explainBeats(r)
      const stills = beats.filter((b, i) => i > 0 && b.open === beats[i - 1].open && b.label === beats[i - 1].label)
      expect(stills.length, `${sigOf(r)}: ${stills.length} still beats`).toBeLessThanOrEqual(1)
    }, 60)
  })

  it('no beat names the answer before the last one', () => {
    everyRound(r => {
      const beats = explainBeats(r)
      for (const b of beats.slice(0, -1)) expect(b.label).toBe('')
    }, 60)
  })

  /** ⚠️ Hand-picked demo examples drift toward the tidy case because they READ better — BlockYard's
   *  four examples all quietly avoided the regrouping the chapter existed for. This one leads with
   *  the fact children reach last. */
  it('the first worked example is a hard fact, not a friendly one', () => {
    expect(DEMO[0].per).toBeGreaterThanOrEqual(6)
    expect(DEMO[0].crates).toBeGreaterThanOrEqual(6)
    expect(DEMO.map(r => r.qType).sort()).toEqual(['missing', 'multi', 'total'])
  })
})
