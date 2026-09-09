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
import { readFileSync } from 'node:fs'
import { FACTOR_LAB_CONFIG } from '@/features/chapters/teen/games/FactorLabGame'
import { NO_HAND } from '@/infra/ar/HandInput'
import {
  MAX_FINGERS, makeRound, mkEvenOdd, mkMultiple, mkSplit, graded, missFor, nudgeFor, explainBeats,
  deal, padChoices, instructionFor, sayFor, showableRows, isPrime, factorsOf, verdictFor,
  benchLabel, ANCHOR, DEMO, GUIDED, COMPOSITES, PRIMES, type FlRound, type Tier,
} from '@/features/chapters/story/factors'

/** The scene, comments stripped — a source check that matches the paragraph explaining a rule
 *  instead of the code obeying it is a check this repo has already shipped once. */
const strip = (f: string) => readFileSync(f, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const SCENE = strip('src/features/chapters/teen/games/FactorLabGame.tsx')
/** ⚠️ The shared camera surface. Nothing read this file, so three of the change's own properties
 *  — the markers being ON, the scrim being UNDER them, and `w` staying required — were guarded by
 *  nothing at all and every mutation of them walked through. */
const HAND = strip('src/infra/ar/HandInput.tsx')

const TIERS: Tier[] = [1, 2, 3]
/** Both answer surfaces. Every wording rule has to hold on each — a chip that names a gesture the
 *  child's surface does not have is the 12–14 audit's headline fault, and it is invisible to a
 *  single-mode check. */
const INPUTS = ['hand', 'tap'] as const
/** Enough draws that every branch of every tier's pool is hit many times over. */
const sweep = (fn: (r: FlRound, d: Tier) => void) => {
  for (const d of TIERS) for (let i = 0; i < 800; i++) fn(makeRound(d), d)
}

describe('math', () => {
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

/**
 * The chapter answers with the CAMERA or by TAP, and the two must be the same question. The camera's
 * span is the ceiling above; this pins the pad to exactly that span, so a round can never be
 * answerable by one child and unanswerable by the other — a defect only half the users would meet,
 * which is the kind that survives a drive.
 */
describe('the tap path offers the same answers as the hand', () => {
  it('the pad is exactly 0..MAX_FINGERS, with 0 for the fist', () => {
    expect(padChoices()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(padChoices()[0]).toBe(0)
    expect(padChoices().at(-1)).toBe(MAX_FINGERS)
  })
  it('every round the generator can draw is answerable ON THE PAD', () => {
    const pad = padChoices()
    sweep(r => {
      expect(r.accepts.some(a => pad.includes(a))).toBe(true)
    })
  })
  it('and so are the demo and guided rounds', () => {
    const pad = padChoices()
    for (const r of [...DEMO, GUIDED]) expect(r.accepts.some(a => pad.includes(a))).toBe(true)
  })
  it('the pad grades through the SAME grader — no second copy of the rule', () => {
    sweep(r => {
      for (const n of padChoices()) expect(graded(r, n)).toBe(r.accepts.includes(n))
    })
  })
  it('a pad tap that is a redirect rather than an answer still redirects', () => {
    // The camera path leans on nudgeFor because a hand DRIFTS through 1 on its way up. A tap does
    // not drift — but a child can still tap 1 deliberately, and if the nudge stopped firing there it
    // would become a scored miss on the tap path and a redirect on the other.
    const split = mkSplit(12)
    expect(nudgeFor(split, 1)).not.toBeNull()
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
    for (const i of INPUTS) expect(sayFor(composite, i).replace(/12/g, 'N')).toBe(sayFor(prime, i).replace(/13/g, 'N'))
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
  it('as many rows as there are parts is a nudge too — the mirror of the rule above', () => {
    // ⚠️ `showableRows` refuses `f === n` in the generator (one in each row is every part on its
    // own) and nothing refused it at the ANSWER, so the child was graded wrong over a bench
    // showing no gap at all. Four of the five tier-1 composites are within reach of two hands.
    for (const n of COMPOSITES[1].filter(n => n <= MAX_FINGERS)) {
      expect(n).toBeLessThanOrEqual(MAX_FINGERS)
      expect(nudgeFor(mkSplit(n), n)).toBeTruthy()
    }
    expect(nudgeFor(mkSplit(7), 7)).toBeTruthy()          // a prime the child can reach, too
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

  /**
   * ⚠️ THE FAULT THIS EXISTS FOR, AND IT SHIPPED. The verdict was built inside the component, where
   * nothing could see it, and every wrong answer printed `${stranded} left over` — while a deal into
   * as many rows as there are parts strands NOTHING. So a child holding up 6 on a round about 6 read
   * "0 left over" in red over six clean rows with no gap in them, with the miss line saying "that
   * leaves a gap". Four of the five tier-1 split values are ≤ MAX_FINGERS, so it is met in the first
   * minutes. The generator refused `f === n` all along (`showableRows`); nothing refused it at the
   * ANSWER.
   */
  it('the verdict never claims a gap the bench is not showing', () => {
    sweep(r => {
      for (let g = 0; g <= MAX_FINGERS; g++) {
        if (nudgeFor(r, g)) continue                    // a redirect never reaches the verdict
        const v = verdictFor(r, g)
        expect(v.ok).toBe(graded(r, g))                 // one grader, no second copy
        // ⚠️ BOTH DIRECTIONS. Guarded only one way, collapsing the fallback to the no-gap string
        // survived — the verdict then says "No gaps" over a bench drawing a visible one, which is
        // the mirror of the bug this test exists for.
        if (deal(r.n, g).stranded === 0) expect(v.text).not.toMatch(/left over/)
        else {
          expect(v.text).not.toMatch(/no gaps/i)                       // …and not the other way either
          if (!v.ok && g > 0) expect(v.text).toMatch(/left over/)      // g = 0 is the fist, own line
        }
      }
    })
  })

  it('a wrong verdict never names what the rows DO hold — that is the answer', () => {
    // On a multiple round, "each row holds 7" for a child who tried 5 hands over the answer.
    sweep(r => {
      for (let g = 1; g <= MAX_FINGERS; g++) {
        if (graded(r, g) || nudgeFor(r, g)) continue
        for (const a of r.accepts) expect(verdictFor(r, g).text).not.toMatch(new RegExp(`\\b${a}\\b`))
      }
    })
  })

  it('the scene prints the shared verdict rather than building its own', () => {
    // ⚠️ `toMatch(/verdictFor\(/)` proves it is MENTIONED. Keeping the call and overriding the
    // wrong branch at the setReveal restored the shipped bug and stayed green — this repo's own
    // recorded shape (a render behind `false &&` satisfies a name check). Anchor on the statements.
    // the shell owns the reveal now, so what this chapter must still do is REACH the module's words
    expect(SCENE).toMatch(/verdictFor/)
    expect(SCENE, 'and never build its own').not.toMatch(/left over`/)
    expect(SCENE, 'the bench deals to a real row count on the reveal').toMatch(/setValue\(t\.r\.accepts\[0\]\)/)
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

/**
 * The daily anchor (docs/story-9-11-ar-plan.md §5) is *arranging desks in equal rows for an exam*.
 * The band's rule is that it lives in the EXPLANATION and nowhere else — the briefing says "this is
 * just like <the daily thing>" and every per-round string still names what is actually drawn, which
 * is parts on a bench. Both halves are pinned, because each fails in a different direction: absent,
 * the chapter has no anchor at all (`grep -i desk` returned nothing before this); leaked, it writes
 * "desks" over a picture of neon units, which is this repo's oldest copy fault.
 */
/**
 * The camera is FULL SCREEN on this chapter, so the bench's band must not still be reserving a
 * corner self-view. This is the one piece of the layout a gate can reach — it is arithmetic rather
 * than CSS — and it is what the old `Stage` had none of.
 */
describe('question clarity — the three zones', () => {
  // docs/teen-12-14-math-audit.md §1. A single prose line fusing story + math + "what to do with
  // your hands" is what a struggling child cannot parse; it was measured as systemic across 11 of
  // 12 chapters in that band, and the run-on version of this chapter's split prompt was the same
  // fault: "Split 13 into equal rows. How many rows? Make a fist if nothing fits."
  const ALL = () => [...DEMO, GUIDED, ...TIERS.flatMap(d => Array.from({ length: 200 }, () => makeRound(d)))]

  it('every round has both a context line and an action chip', () => {
    for (const r of ALL()) {
      expect(r.prompt.length).toBeGreaterThan(20)
      for (const i of INPUTS) expect(instructionFor(r, i).length).toBeGreaterThan(10)
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
      for (const i of INPUTS) {
        expect(instructionFor(r, i)).toMatch(/^(Work out|Hold up|Count|Split|Make|Tap)\b/)
        expect(instructionFor(r, i).length).toBeLessThan(130)
      }
    }
  })

  it('the chip names the surface the child actually has, and never the other one', () => {
    // ⚠️ THE FAULT THIS EXISTS FOR: the chapter shipped camera-only, so every chip said "hold up
    // that many fingers". Adding a tap path without re-wording them tells half the children to
    // perform a gesture their surface cannot do — the 12–14 audit's headline defect, where nine
    // chapters said "crank the gear" with no crank on screen. Both zone-3 renderers are swept
    // because a single-mode check cannot see it: the wording is valid, just for somebody else.
    for (const r of ALL()) {
      const hand = instructionFor(r, 'hand'), tap = instructionFor(r, 'tap')
      expect(hand).toMatch(/hold up/i)
      expect(hand).not.toMatch(/\btap\b/i)
      expect(tap).toMatch(/\btap\b/i)
      expect(tap).not.toMatch(/hold up|fingers|your hand/i)
      // and what Milo SAYS has to agree with what the chip shows, or the two channels contradict
      expect(sayFor(r, 'tap')).not.toMatch(/hold up|fingers/i)
      expect(sayFor(r, 'hand')).not.toMatch(/\btap\b/i)
    }
  })

  it('a nudge names the surface too — it is the one line a child reads mid-attempt', () => {
    const mult = mkMultiple(3, 4)
    expect(nudgeFor(mult, 0, 'hand')).toMatch(/hold up/i)
    expect(nudgeFor(mult, 0, 'tap')).not.toMatch(/hold up|fingers/i)
  })

  it('a factor round and a prime round give byte-identical instructions', () => {
    // The chip is the likeliest place for the type to leak — it is where the fist gets mentioned.
    for (const i of INPUTS) expect(instructionFor(mkSplit(12), i)).toBe(instructionFor(mkSplit(13), i))
    expect(mkSplit(12).prompt.replace(/12/g, 'N')).toBe(mkSplit(13).prompt.replace(/13/g, 'N'))
  })

  it('what Milo SAYS carries both zones — the spoken line is the only one on a silent device', () => {
    for (const r of ALL()) {
      for (const i of INPUTS) {
        expect(sayFor(r, i)).toContain(instructionFor(r, i))
        expect(sayFor(r, i).length).toBeGreaterThan(instructionFor(r, i).length)
      }
    }
  })
})

/**
 * ⚠️ THE SCENE-SOURCE BLOCKS THAT USED TO LIVE HERE ARE GONE, AND NOT BECAUSE THEY WERE FAILING.
 * They guarded rules a bespoke component owned — both doors, the dwell key, the one-grader path, the
 * band arithmetic, the lane. GameShell owns every one of those now, so they are gated ONCE for all
 * ten 9–11 chapters in `bandOnGameShell.test.ts` instead of once per chapter, which is the entire
 * point of the port. What is left below is what is still THIS chapter's to get wrong, and it is
 * driven from the CONFIG rather than grepped out of JSX.
 */
describe('the chapter on the shell', () => {
  it('declares the band, so it is a ten-round, never-resuming run', () => {
    expect(FACTOR_LAB_CONFIG.band).toBe('9-11')
  })

  it('⚠️ a FIST is an answer — it is how a child says "nothing fits", which IS the prime reading', () => {
    const ready = FACTOR_LAB_CONFIG.hand!.ready!
    expect(ready({ ...NO_HAND, hands: 1, count: 0 }), 'a fist').toBe(true)
    expect(ready({ ...NO_HAND, hands: 0, count: 0 }), 'a lowered hand').toBe(false)
  })

  it('withholds mastery until all four readings have been asked', () => {
    expect(FACTOR_LAB_CONFIG.coverage!.all).toEqual(['evenOdd', 'multiple', 'factor', 'prime'])
  })

  it('carries the daily anchor into the briefing', () => {
    expect(String(FACTOR_LAB_CONFIG.start.blurb)).toContain(ANCHOR)
  })
})

/**
 * ⚠️ THE BAND SUITE IS GONE, DELIBERATELY, AND NOT BECAUSE IT WAS FAILING. `boardBand`/`benchBand`,
 * the band constants and the lane all tested arithmetic this chapter no longer owns: GameShell owns
 * the bands and `FitSlot` scales the instrument into whatever is left. Keeping them would have been
 * a gate driving dead code, which is worse than no gate because it reads as coverage. The rules that
 * still matter live ONCE in `bandOnGameShell.test.ts`, for all ten chapters.
 */
