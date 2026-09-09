/**
 * 17–18'S DOOR 2 — the student names a strand and the probe is seeded there.
 *
 * ⚠️ WHAT THIS FILE IS GUARDING IS NOT "IS IT ACCURATE" — `diagnosticAccuracy` owns that, and
 * `diagnosticCoverage` owns the rule that a narrowed result may never say "on track". This one
 * guards the three ways door 2 turns into the CUT it was chosen over:
 *   · the strand list drifting away from the graph, so a named strand seeds an unanswerable probe;
 *   · the door reaching a band whose students cannot honestly answer it;
 *   · the wrong-strand escape hatch failing to be cheap, which is what makes the guess survivable.
 *
 * ⚠️ SEEDED, like its neighbours. An unseeded accuracy sweep is a coin flip, and a coin-flip gate
 * gets re-run until it is green rather than read.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { mulberry32 } from '@/core/rand'
import { runProbe, strandChoices, prereqClosure } from '@/core/diagnosticEngine'
import { PROBE_SPINE, NODE_BY_ID, blockedBy, type Band } from '@/core/skillGraph'
import { makeItem } from '@/core/diagnosticItems'

const BANDS: Band[] = ['3-5', '6-8', '9-11', '12-14', '15-16', '17-18']
const SLIP = 0.10

describe('door 2 — the strand list', () => {
  it('is the 17–18 SPINE, derived rather than typed', () => {
    // A hand-typed copy drifts silently the day a node is added: the door keeps offering the old
    // strands and the graph has moved. Assert identity with the source of truth, in order.
    expect(strandChoices('17-18').map(t => t.id)).toEqual(PROBE_SPINE['17-18'])
    for (const t of strandChoices('17-18')) expect(t.label).toBe(NODE_BY_ID[t.id].label)
    expect(strandChoices('17-18').length, 'an empty door is not a door').toBeGreaterThan(3)
  })

  it('offers only strands the probe can actually ASK about', () => {
    // The failure this catches is silent and total: a strand with no item seeds an agenda the
    // engine auto-passes, so the student names their weakest topic and is told nothing is wrong.
    // ⚠️ Measured before being written: all 8 currently have one, so a "…or something under it
    // does" fallback would be an inert clause — it can never bind, and an inert clause reads as
    // protection. The claim is the strict one, which is also the one that can fail.
    for (const t of strandChoices('17-18')) {
      expect(makeItem(t.id, { seed: 'door', nonce: 1 }),
        `${t.id} ("${t.label}") is offered as a strand but has no item to ask`).toBeTruthy()
    }
  })

  it('is 17–18 ONLY — a self-report below that age is noise, not information', () => {
    for (const b of BANDS) {
      if (b === '17-18') continue
      expect(strandChoices(b), `${b} must not offer a strand door`).toEqual([])
    }
  })
})

/** A learner broken at `root` and everything downstream, answering with a slip/guess rate. */
const learner = (root: string, rnd: () => number) => {
  const broken = new Set([root, ...blockedBy(root)])
  return (sk: string) => rnd() < (broken.has(sk) ? 0.25 : 1 - SLIP)
}

describe('door 2 — driven', () => {
  it('seeded at the RIGHT strand, it finds the gap under it and never claims full coverage', () => {
    const rnd = mulberry32(7)
    let found = 0, n = 0
    for (const strand of PROBE_SPINE['17-18']) {
      for (const root of [...prereqClosure(strand)].slice(0, 6)) {
        for (let t = 0; t < 3; t++) {
          const { state, result } = runProbe('17-18', learner(root, rnd), undefined, [strand])
          n++
          if (result.rootGap !== null) found++
          expect(state.agenda.length + state.asked.length, 'the seed was ignored').toBeGreaterThan(0)
          expect(result.coverage, 'a seeded probe is a narrower claim, never a full one').toBe('partial')
        }
      }
    }
    // Not an accuracy threshold (that lives in diagnosticAccuracy) — this is the far weaker claim
    // that seeding does not BREAK the search. A regression here reads as "the seed goes nowhere".
    expect(found / n, `a real gap under the named strand went unfound ${n - found}/${n} times`).toBeGreaterThan(0.8)
  })

  it('seeded at the WRONG strand it costs ~2 questions — which is what makes a guess survivable', () => {
    const rnd = mulberry32(11)
    const lens: number[] = []
    for (const strand of PROBE_SPINE['17-18']) {
      // the gap is in a DIFFERENT strand's subtree, and nothing under this one is broken
      const other = PROBE_SPINE['17-18'].find(s => s !== strand)!
      const root = [...prereqClosure(other)].find(x => !prereqClosure(strand).has(x) && x !== strand)
      if (!root) continue
      for (let t = 0; t < 5; t++) {
        const { state, result } = runProbe('17-18', learner(root, rnd), undefined, [strand])
        lens.push(state.asked.length)
        expect(result.coverage).toBe('partial')
      }
    }
    const med = lens.slice().sort((a, b) => a - b)[Math.floor(lens.length / 2)]
    // The measured claim is "two questions". Left loose enough for a slip to force a retry, tight
    // enough that a regression turning the wrong strand into a full-length probe fails here.
    expect(med, `a wrong strand cost ${med} questions (median) — the escape is no longer cheap`).toBeLessThanOrEqual(6)
  })
})

/**
 * ⚠️ THIS LAST ONE IS A SOURCE CHECK AND IS LABELLED AS ONE. It proves the page SAYS the right
 * thing, never that anything reaches it — the page is a client component with no harness here.
 * The behaviour it stands in for is: a student who named the wrong strand taps "Take the full
 * check" and must land in a FULL probe, not back on the strand door where they will name another
 * wrong strand. The real defence is that `fullCheck` calls `startProbeNow()` directly, which makes
 * the loop unwritable; this only stops someone re-routing it through the intro for tidiness.
 */
describe('door 2 — the page wiring (source)', () => {
  const src = readFileSync('src/app/diagnostic/page.tsx', 'utf8')

  it('the full-check button is the full-check handler, not a plain retake', () => {
    const at = src.indexOf("Take the full check")
    expect(at, 'the full-check offer is gone — this gate is inert').toBeGreaterThan(0)
    const card = src.slice(Math.max(0, at - 1200), at)
    expect(card, 'the full-check offer is wired to onRetake, which returns to the strand door')
      .toMatch(/onClick=\{onFullCheck\}/)
  })

  it('the full-check handler starts a probe directly and never returns to the intro', () => {
    const at = src.indexOf('const fullCheck = () => {')
    expect(at, 'fullCheck is gone — this gate is inert').toBeGreaterThan(0)
    const body = src.slice(at, src.indexOf('\n  }', at))
    expect(body, 'fullCheck must start the probe itself').toMatch(/startProbeNow\(\)/)
    expect(body, "fullCheck routes through the intro, which re-shows the door").not.toMatch(/setPhase\(/)
  })
})
