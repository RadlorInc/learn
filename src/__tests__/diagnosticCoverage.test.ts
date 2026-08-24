import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { startProbe, nextSkill, record, diagnose, prereqClosure, DEFAULT_CONFIG } from '@/core/diagnosticEngine'
import { PROBE_ENTRY, PROBE_SPINE, blockedBy, type Band } from '@/core/skillGraph'

/**
 * ⚠️⚠️ A NARROWED PROBE MAY NEVER SAY "ON TRACK".
 *
 * The short pass (the spine, leaving the sweep for later) and 17–18's "I know what I'm stuck on"
 * door are both narrower CLAIMS, not merely shorter probes. Measured: the spine alone misses a
 * third to a half of gaps in 6–8 and 9–11, and a student who names the wrong strand gets "no gap"
 * 100% of the time — in two questions. Framed as *here is where we're starting*, that is a
 * less-targeted plan and the deep pass fixes it. Framed as *no gaps found*, it is a lie told to the
 * parent of a child who has one, which is the worst thing this product can produce.
 *
 * So the constraint lives in the ENGINE (`Diagnosis.coverage`) rather than in the copy, and this
 * file gates both halves: that the engine reports `partial` whenever it did not look everywhere,
 * and that the report actually branches on it instead of printing the on-track card regardless.
 */
const BANDS: Band[] = ['6-8', '9-11', '12-14', '15-16', '17-18']
/** Anything a parent reads as a clean bill of health. */
const ON_TRACK = [/at or above/i, /on track/i, /no gaps?\b/i, /didn'?t find/i, /nothing (is )?wrong/i]

function drive(band: Band, agenda: string[] | undefined, answer: (s: string) => boolean) {
  let s = startProbe(band, DEFAULT_CONFIG[band], agenda)
  let id: string | null
  while ((id = nextSkill(s)) !== null) s = record(s, id, answer(id))
  return diagnose(s)
}

describe('coverage — what a result is allowed to claim', () => {
  it('a FULL pass on a child with no gap is allowed to say they are on track', () => {
    for (const band of BANDS) {
      const r = drive(band, undefined, () => true)
      expect(r.coverage, `${band}: a complete probe should report full coverage`).toBe('full')
      expect(r.rootGap).toBeNull()
      expect(r.workingLevel, `${band}`).toMatch(/at or above/i)
    }
  })

  it('a SEEDED pass that finds nothing never claims it — 17–18 door 2, the wrong strand', () => {
    // The student names a strand they are fine at. Two questions, no gap found, and the temptation
    // is to print the same card as a full pass. This is the case that must not.
    for (const band of BANDS) {
      const one = [PROBE_ENTRY[band][0]]
      const r = drive(band, one, () => true)
      expect(r.coverage, `${band}: a seeded probe is never full coverage`).toBe('partial')
      for (const bad of ON_TRACK) {
        expect(r.workingLevel, `${band}: "${r.workingLevel}" reads as a clean bill of health`).not.toMatch(bad)
      }
    }
  })

  it('the SHORT PASS (spine only) is partial even when it finds a real gap', () => {
    // ⚠️ Not only the empty result. A spine pass that DOES name a root still has not looked at the
    // sweep, so it must not be upgraded to a full claim by having found something.
    for (const band of BANDS) {
      const root = [...prereqClosure(PROBE_SPINE[band][0])][0] ?? PROBE_SPINE[band][0]
      const broken = new Set([root, ...blockedBy(root)])
      const r = drive(band, PROBE_SPINE[band], sk => !broken.has(sk))
      expect(r.coverage, `${band}`).toBe('partial')
    }
  })

  it('a CAP-TRUNCATED full probe is partial too — it stopped, it did not finish', () => {
    // ⚠️ AND IT IS CAUGHT BY THE UNFINISHED AGENDA, NOT BY A CAP CHECK. The first version of
    // `coverage` also tested `asked < maxItems`; mutation-testing showed that clause was INERT —
    // a cap that stops the search always leaves the agenda or a frame open — and in the one case
    // it was not redundant it was wrong. It is gone. This case still has to hold, hence the test.
    for (const band of BANDS) {
      // (a) failing everything — the cap lands with a branch open.
      let s = startProbe(band, { ...DEFAULT_CONFIG[band], maxItems: 6 })
      let id: string | null
      while ((id = nextSkill(s)) !== null) s = record(s, id, false)
      expect(diagnose(s).coverage, `${band}: cut off mid-descent`).toBe('partial')

      // ⚠️ (b) PASSING everything — the cap lands with entries still on the agenda and NO branch
      // open. Found by mutation: with only case (a), deleting the `agenda.length === 0` term left
      // this file green, because a failing answerer always opens a frame and the frames term
      // caught it instead. Each term needs a state where it is the only one that says no.
      let t = startProbe(band, { ...DEFAULT_CONFIG[band], maxItems: 4 })
      while ((id = nextSkill(t)) !== null) t = record(t, id, true)
      expect(t.frames.length, `${band}: a passing run should leave no open branch`).toBe(0)
      expect(t.agenda.length, `${band}: the cap should leave entries unasked`).toBeGreaterThan(0)
      expect(diagnose(t).coverage, `${band}: capped before the agenda was finished`).toBe('partial')
    }
  })

  it('a probe cut off MID-DESCENT is partial, even with an empty agenda', () => {
    /**
     * ⚠️⚠️ THE STATE THE OTHER TESTS CANNOT REACH, AND THE ONE THE `frames` CHECK EXISTS FOR.
     * The last entry fails, which opens a descent and empties the agenda — and then the cap stops
     * the search partway down. Agenda empty, branch still open: the probe knows there is a gap and
     * has not found it, which is the least complete result there is.
     *
     * Found by mutation, not by reading: deleting `frames.length === 0` left every other test in
     * this file green, because they all stop with entries still on the agenda. Driving the engine
     * cannot easily produce this state (it needs a cap landing at one exact point), so it is
     * constructed — the alternative is a clause nothing can fail.
     */
    const s = {
      ...startProbe('9-11'),
      agenda: [],                                        // everything asked
      frames: [{ lo: 'i.multFacts', cands: ['p.multConcept'], deep: true }],  // …but still descending
      failed: ['i.multFacts'],
      asked: ['i.multFacts', 'i.multFacts'],
    }
    expect(diagnose(s).coverage, 'an open branch means the search did not finish').toBe('partial')
    // Positive control: the SAME state with the branch closed is full, so the assertion above is
    // about the frame and not about something else in the fixture.
    expect(diagnose({ ...s, frames: [] }).coverage).toBe('full')
  })

  it('the report BRANCHES on coverage, and the partial branch offers the full check', () => {
    // ⚠️ The engine half is worthless if the screen prints the on-track card regardless. Anchored
    // on real JSX, not prose — and it asserts the OFFER as well, because a student who named the
    // wrong strand reaches that screen after two questions and the full check has to be one tap
    // away, worded as the better option rather than as a consolation.
    const src = readFileSync(join(__dirname, '../app/diagnostic/page.tsx'), 'utf8')
    // ⚠️ ANCHORED ON MARKERS, NOT ON A BOUNDED WINDOW. The first version matched
    // `{!root ? ([\s\S]{0,2600}?) : (` and stopped at the first `) : (` — which is inside the
    // nested coverage ternary this test exists to check, so it never saw the partial card at all.
    // A window that ends at the wrong delimiter is the same fault as one measured in characters.
    const start = src.indexOf('{!root ? (')
    expect(start, 'the no-gap branch was not found — this gate is inert').toBeGreaterThan(0)
    const partialAt = src.indexOf('🔍 Nothing broken', start)
    expect(partialAt, 'the partial card was not found — this gate is inert').toBeGreaterThan(start)
    const region = src.slice(start, partialAt)

    expect(region, 'the on-track card is printed without checking coverage').toMatch(/r\.coverage === 'full'/)
    // The offer of the full check is part of the fix, not a consolation: a student who named the
    // wrong strand reaches this screen after TWO questions.
    expect(src.slice(partialAt, partialAt + 1200), 'the partial branch must offer the full check')
      .toMatch(/Take the full check/)
    // …and the on-track wording lives ONLY in the full branch.
    for (const bad of ON_TRACK) {
      expect(src.slice(partialAt, partialAt + 1200), `the partial card reads as "${bad}"`).not.toMatch(bad)
    }
  })
})
