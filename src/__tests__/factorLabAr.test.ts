/**
 * FACTOR LAB (9–11, AR) — the chapter's gate.
 *
 * The answering surface is a WEBCAM, so almost nothing about this chapter can be driven
 * headlessly. That makes the pure module carry more weight than usual: everything below drives
 * the SAME exported functions the scene renders and grades from (`makeRound`, `graded`,
 * `missFor`, `deal`, `explainBeats`) rather than a second copy of the rules.
 *
 * The load-bearing invariant is the TEN-FINGER CEILING — a round with no accepted answer in
 * 0..10 is unanswerable, and unlike a wrong answer it strands the child with nothing to do.
 */
import { describe, it, expect } from 'vitest'
import {
  MAX_FINGERS, makeRound, mkEvenOdd, mkMultiple, mkSplit, graded, missFor, nudgeFor,
  explainBeats, deal, showableRows, isPrime, factorsOf, DEMO, GUIDED, COMPOSITES, PRIMES,
  type FlRound, type Tier,
} from '@/features/chapters/story/factors'

const TIERS: Tier[] = [1, 2, 3]
/** Enough draws that every branch of every tier's pool is hit many times over. */
const sweep = (fn: (r: FlRound, d: Tier) => void) => {
  for (const d of TIERS) for (let i = 0; i < 800; i++) fn(makeRound(d), d)
}

describe('maths', () => {
  it('isPrime / factorsOf agree with each other', () => {
    for (let n = 2; n <= 100; n++) expect(isPrime(n)).toBe(factorsOf(n).length === 2)
  })
  it('every composite up to 100 has a showable split — this is what makes the ceiling hold', () => {
    for (let n = 4; n <= 100; n++) if (!isPrime(n)) expect(showableRows(n).length).toBeGreaterThan(0)
  })
  it('a prime has no showable split, so the fist is its only honest answer', () => {
    for (let n = 2; n <= 100; n++) if (isPrime(n)) expect(showableRows(n)).toEqual([])
  })
})

describe('the ten-finger ceiling', () => {
  it('every round has at least one accepted answer, and none is out of reach', () => {
    sweep(r => {
      expect(r.accepts.length).toBeGreaterThan(0)
      for (const a of r.accepts) {
        expect(a).toBeGreaterThanOrEqual(0)
        expect(a).toBeLessThanOrEqual(MAX_FINGERS)
      }
    })
  })
  it('holds for the demo and guided rounds too', () => {
    for (const r of [...DEMO, GUIDED]) {
      expect(r.accepts.length).toBeGreaterThan(0)
      for (const a of r.accepts) expect(a).toBeLessThanOrEqual(MAX_FINGERS)
    }
  })
})

describe('the grader', () => {
  it('accepts exactly the finger counts that are really correct', () => {
    sweep(r => {
      for (let g = 0; g <= MAX_FINGERS; g++) {
        const truth =
          r.qType === 'evenOdd' ? g === Math.floor(r.n / 2)
            : r.qType === 'multiple' ? g === r.n / r.base
              : r.qType === 'prime' ? g === 0
                : g >= 2 && g < r.n && r.n % g === 0
        expect(graded(r, g)).toBe(truth)
      }
    })
  })
  it('a split round never accepts 1 — one row is the whole thing, so it would be free', () => {
    sweep(r => { if (r.qType === 'factor' || r.qType === 'prime') expect(graded(r, 1)).toBe(false) })
  })
  it('a fist is right only when nothing fits', () => {
    sweep(r => expect(graded(r, 0)).toBe(r.qType === 'prime'))
  })
  it('every accepted split really divides n with no remainder', () => {
    sweep(r => {
      if (r.qType !== 'factor') return
      for (const a of r.accepts) expect(deal(r.n, a).stranded).toBe(0)
    })
  })
  it('a multiple round is exact by construction', () => {
    sweep(r => { if (r.qType === 'multiple') expect(r.base * r.accepts[0]).toBe(r.n) })
  })
})

describe('nothing is a coin flip any more', () => {
  it('no round has fewer than 11 candidate answers on the surface', () => {
    // The child chooses from 0..10 on every single round — the OLD chapter offered two chips on
    // even/odd and on prime, i.e. 50%. Worst case here is 1-in-11.
    sweep(r => expect(r.accepts.length).toBeLessThanOrEqual(MAX_FINGERS + 1))
  })
  it('the pair test asks for the PAIRS, not for a 0-or-1 leftover', () => {
    for (let n = 4; n <= 21; n++) {
      const r = mkEvenOdd(n)
      expect(r.accepts).toEqual([Math.floor(n / 2)])
      expect(r.accepts[0]).toBeGreaterThan(1) // never a two-way guess
    }
  })
})

describe('the round type must not leak the answer', () => {
  it('a factor round and a prime round are worded identically', () => {
    const composite = mkSplit(12), prime = mkSplit(13)
    expect(composite.qType).toBe('factor')
    expect(prime.qType).toBe('prime')
    // Same shape, differing only in the number being split.
    expect(composite.prompt.replace('12', 'N')).toBe(prime.prompt.replace('13', 'N'))
    expect(composite.say.replace(/12/g, 'N')).toBe(prime.say.replace(/13/g, 'N'))
  })
  it('and their miss lines are identical, so a retry cannot reveal the type either', () => {
    expect(missFor(mkSplit(12))).toBe(missFor(mkSplit(13)))
  })
  it('no miss line ever names an accepted answer', () => {
    sweep(r => {
      const m = missFor(r)
      for (const a of r.accepts) expect(m).not.toMatch(new RegExp(`\\b${a}\\b`))
    })
  })
})

describe('nudges redirect rather than score', () => {
  it('one row on a split round is a nudge, not a miss', () => {
    expect(nudgeFor(mkSplit(12), 1)).toBeTruthy()
    expect(nudgeFor(mkSplit(13), 1)).toBeTruthy()
  })
  it('a correct answer is never nudged', () => {
    sweep(r => { for (const a of r.accepts) expect(nudgeFor(r, a)).toBeNull() })
  })
  it('a genuine wrong answer IS graded, never swallowed by a nudge', () => {
    sweep(r => {
      const wrong = [2, 3, 4, 5, 6, 7].find(g => !graded(r, g) && g !== 1)
      if (wrong !== undefined) expect(nudgeFor(r, wrong)).toBeNull()
    })
  })
})

describe('the bench agrees with the grader', () => {
  it('a deal leaves no gap exactly when the answer is accepted', () => {
    sweep(r => {
      if (r.qType !== 'factor' && r.qType !== 'prime') return
      for (let g = 2; g <= MAX_FINGERS; g++) {
        expect(deal(r.n, g).stranded === 0 && g < r.n).toBe(graded(r, g))
      }
    })
  })
  it('the pair test strands exactly one unit on an odd number and none on an even one', () => {
    for (let n = 4; n <= 21; n++) {
      const r = mkEvenOdd(n)
      expect(deal(n, r.accepts[0]).stranded).toBe(n % 2)
    }
  })
  it('nothing is dealt before the child commits', () => {
    expect(deal(12, 0)).toEqual({ perRow: 0, placed: 0, stranded: 12 })
  })
})

describe('the worked example says what it shows', () => {
  // SupplyRun shipped a demo whose words were right and whose numbers disagreed with them.
  it('every beat deals into a group count the bench can actually draw', () => {
    sweep(r => {
      for (const b of explainBeats(r)) {
        expect(b.rows).toBeGreaterThanOrEqual(0)
        expect(b.rows).toBeLessThanOrEqual(MAX_FINGERS)
        expect(b.say.length).toBeGreaterThan(0)
      }
    })
  })
  it('the last beat lands on the answer the round grades', () => {
    sweep(r => {
      const last = explainBeats(r).at(-1)!
      if (r.qType === 'prime') expect(last.rows).toBe(0)          // the fist
      else expect(graded(r, last.rows)).toBe(true)
    })
  })
  it('only an odd pair test ever marks a stranded unit', () => {
    sweep(r => {
      const stranded = explainBeats(r).some(b => b.leftover)
      expect(stranded).toBe(r.qType === 'evenOdd' && r.n % 2 === 1)
    })
  })
  it('a prime example tries splits and fails before making the fist', () => {
    const beats = explainBeats(mkSplit(13))
    expect(beats.filter(b => b.rows >= 2).length).toBeGreaterThanOrEqual(2)
    for (const b of beats) if (b.rows >= 2) expect(deal(13, b.rows).stranded).toBeGreaterThan(0)
  })
})

describe('the ladder', () => {
  it('tier 1 DOES ask for a split — it is the chapter, not a reward for climbing', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 800; i++) seen.add(makeRound(1).qType)
    expect([...seen].sort()).toEqual(['evenOdd', 'factor', 'multiple'])
  })
  it('tier 1 never asks for a prime — proving nothing fits is the hardest reading', () => {
    for (let i = 0; i < 800; i++) expect(makeRound(1).qType).not.toBe('prime')
  })
  const share = (d: Tier) => {
    const n: Record<string, number> = {}
    for (let i = 0; i < 3000; i++) { const q = makeRound(d).qType; n[q] = (n[q] ?? 0) + 1 }
    return (k: string) => (n[k] ?? 0) / 3000
  }

  it('the pair test never dominates a tier — it is the warm-up, not the chapter', () => {
    // It was two-thirds of tier 1, which read as a one-trick chapter. (A high `factor` share is
    // fine and intended: splitting IS the chapter, every such round has 2–4 different right
    // answers, and factor and prime share a prompt so the child cannot tell them apart anyway.)
    for (const d of TIERS) expect(share(d)('evenOdd')).toBeLessThan(0.4)
  })

  it('the fist is never right often enough for "always fist" to be a strategy', () => {
    // ⚠️ THE REAL CEILING, and it is about the ANSWER not the reading. A prime round's only
    // correct answer is the fist, so a tier that is half primes hands back a coin flip through
    // the back door — the exact defect this rebuild exists to remove. Tier 3 was 50%.
    for (const d of TIERS) expect(share(d)('prime')).toBeLessThan(0.3)
  })

  it('nothing in a tier is vestigial', () => {
    for (const d of TIERS) for (const q of ['evenOdd', 'multiple', 'factor', 'prime']) {
      const s = share(d)(q)
      if (s > 0) expect(s).toBeGreaterThan(0.1)
    }
  })
  it('every type is reachable, so coverage can require them all', () => {
    const seen = new Set<string>()
    for (const d of TIERS) for (let i = 0; i < 800; i++) seen.add(makeRound(d).qType)
    expect([...seen].sort()).toEqual(['evenOdd', 'factor', 'multiple', 'prime'])
  })
  it('the pair test never exceeds what two hands can show', () => {
    sweep(r => { if (r.qType === 'evenOdd') expect(r.n).toBeLessThanOrEqual(2 * MAX_FINGERS + 1) })
  })
  it('a prime round is always genuinely prime and a factor round genuinely composite', () => {
    sweep(r => {
      if (r.qType === 'prime') expect(isPrime(r.n)).toBe(true)
      if (r.qType === 'factor') expect(isPrime(r.n)).toBe(false)
    })
  })
})

describe('the split pools are what they claim', () => {
  // A composite sitting in PRIMES produces a perfectly valid `factor` round, so nothing at the
  // round level notices — but that tier's prime slot then never fires and `coverage` can never
  // see a prime. Check the pools themselves.
  it('every PRIMES entry really is prime and yields a fist round', () => {
    for (const d of TIERS) for (const n of PRIMES[d]) {
      expect(isPrime(n)).toBe(true)
      expect(mkSplit(n).qType).toBe('prime')
    }
  })
  it('every COMPOSITES entry really is composite and yields a splittable round', () => {
    for (const d of TIERS) for (const n of COMPOSITES[d]) {
      expect(isPrime(n)).toBe(false)
      expect(mkSplit(n).qType).toBe('factor')
    }
  })
})

describe('a worked example concludes about the arrangement on screen', () => {
  // SupplyRun's demo narrated one number while the bench dealt another. The structural form of
  // that fault: an example sets up ONE arrangement, so every beat that deals must deal the same
  // one — only a prime example ends on a different figure (the fist), by design.
  it('all dealing beats in one example share a row count', () => {
    sweep(r => {
      if (r.qType === 'prime') return
      const dealt = [...new Set(explainBeats(r).filter(b => b.rows >= 1).map(b => b.rows))]
      expect(dealt).toHaveLength(1)
    })
  })
})

describe('coverage steering', () => {
  // The beat declares `coverage`, so the generator MUST spend a scarce round on a reading the
  // child has not met — otherwise the mastery exit is withheld and a strong child is marched
  // through all ten rounds for nothing.
  it('a reading already asked is skipped while an unmet one exists', () => {
    for (let i = 0; i < 400; i++) expect(makeRound(2, ['multiple', 'factor']).qType).toBe('prime')
  })
  it('once the tier has nothing unmet it goes back to drawing at random', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 800; i++) seen.add(makeRound(2, ['multiple', 'factor', 'prime']).qType)
    expect(seen.size).toBeGreaterThan(1)
  })
  it('the four readings are covered inside a run that could exit early', () => {
    // Mastery can end a run in ~6 rounds; every reading must be reachable inside that.
    const asked: string[] = []
    for (let r = 0; r < 6; r++) {
      const d = (r < 3 ? 1 : r < 4 ? 2 : 3) as Tier
      asked.push(makeRound(d, asked).qType)
    }
    expect(new Set(asked).size).toBe(4)
  })
})

describe('the worked examples teach every affordance the child is asked for', () => {
  it('the fist is DEMONSTRATED, not merely mentioned in the prompt', () => {
    expect(DEMO.some(d => d.qType === 'prime')).toBe(true)
  })
  it('and the guided round rehearses the core split gesture', () => {
    expect(['factor', 'prime']).toContain(GUIDED.qType)
  })
})

describe('question clarity — the three zones', () => {
  // docs/teen-12-14-math-audit.md §1. A single prose line fusing story + math + "what to do with
  // your hands" is what a struggling child cannot parse; it was measured as systemic across 11 of
  // 12 chapters in that band, and the run-on version of this chapter's split prompt was the same
  // fault: "Split 13 into equal rows. How many rows? Make a fist if nothing fits."
  const ALL = () => [...DEMO, GUIDED, ...TIERS.flatMap(d => Array.from({ length: 200 }, () => makeRound(d)))]

  it('every round has both a context line and an action chip', () => {
    for (const r of ALL()) {
      expect(r.prompt.length).toBeGreaterThan(20)
      expect(r.instruction.length).toBeGreaterThan(10)
    }
  })

  it('the context names what the numbers ARE and never tells the hands what to do', () => {
    // UI verbs belong in the chip. If they leak into the story line the two zones collapse back
    // into the one sentence this spec exists to break up.
    for (const r of ALL()) {
      expect(r.prompt.toLowerCase()).not.toMatch(/hold up|make a fist|fingers|tap |your hand/)
    }
  })

  it('the action chip is one verb-led sentence, not a paragraph', () => {
    for (const r of ALL()) {
      expect(r.instruction).toMatch(/^(Work out|Hold up|Count|Split|Make)\b/)
      expect(r.instruction.length).toBeLessThan(110)
    }
  })

  it('a factor round and a prime round give byte-identical instructions', () => {
    // The chip is the likeliest place for the type to leak — it is where the fist gets mentioned.
    expect(mkSplit(12).instruction).toBe(mkSplit(13).instruction)
    expect(mkSplit(12).prompt.replace(/12/g, 'N')).toBe(mkSplit(13).prompt.replace(/13/g, 'N'))
  })

  it('what Milo SAYS carries both zones — the spoken line is the only one on a silent device', () => {
    for (const r of ALL()) {
      expect(r.say).toContain(r.instruction)
      expect(r.say.length).toBeGreaterThan(r.instruction.length)
    }
  })
})
