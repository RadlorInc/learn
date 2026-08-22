/**
 * ⚠️⚠️ THE GATE THAT WOULD HAVE CAUGHT THE WHOLE THING. The engine had eleven passing tests and the
 * diagnostic named the exact root gap 26–34% of the time, because every one of those tests drives a
 * PERFECT ORACLE — "knows it ⇒ correct, doesn't ⇒ wrong". A real child guesses, and a real child
 * slips. Nothing in the suite modelled either, so the product's core claim was unmeasured.
 *
 * This file plants a gap in a simulated learner (broken at one skill and everything downstream of
 * it), answers with the REAL guess rate of the REAL item for each skill, and asks whether the probe
 * finds the planted root and whether the route reaches the right chapters.
 *
 * ⚠️ SEEDED. An unseeded sweep is a coin-flip gate, and a coin-flip gate gets re-run until it is
 * green rather than read. Same seed in, same numbers out; the thresholds carry ~8 points of headroom
 * so an honest refactor does not go red on noise.
 */
import { describe, it, expect } from 'vitest'
import { mulberry32 } from '@/core/rand'
import { runProbe, prereqClosure } from '@/core/diagnosticEngine'
import { PROBE_SWEEP, PROBE_ENTRY, SKILL_NODES, blockedBy, routeChapterFor, type Band } from '@/core/skillGraph'
import { makeItem } from '@/core/diagnosticItems'

const SLIP = 0.10          // a careless miss on a skill the child really has
const PAD_SLIP = 0.03      // typing/whole-number fumble on a pad answer they know the value of
const BANDS: Band[] = ['6-8', '9-11', '12-14', '15-16', '17-18']

/** The real guess rate of the real item: 1/choices for a pick, ~0 for anything typed. */
const GUESS: Record<string, number> = {}
for (const n of SKILL_NODES) {
  let worst = 0
  for (let i = 0; i < 24; i++) {
    const it = makeItem(n.id, { seed: 'calib', nonce: i })
    if (!it) { worst = 1; break }                       // no item → the engine auto-passes it
    worst = Math.max(worst, it.input === 'pick' ? 1 / it.choices.length : PAD_SLIP)
  }
  GUESS[n.id] = worst
}

const reachable = (band: Band) => {
  const r = new Set<string>()
  for (const e of PROBE_ENTRY[band]) { r.add(e); prereqClosure(e).forEach(x => r.add(x)) }
  return r
}

interface Outcome { exact: number; shallow: number; other: number; none: number; n: number; asks: number[] }
function planted(band: Band, trials: number, seed: number): Outcome {
  const rnd = mulberry32(seed)
  const o: Outcome = { exact: 0, shallow: 0, other: 0, none: 0, n: 0, asks: [] }
  for (const root of reachable(band)) {
    const broken = new Set([root, ...blockedBy(root)])
    for (let t = 0; t < trials; t++) {
      const { state, result } = runProbe(band, sk =>
        rnd() < (broken.has(sk) ? GUESS[sk] ?? 0.25 : 1 - SLIP))
      o.n++; o.asks.push(state.asked.length)
      const r = result.rootGap
      if (r === root) o.exact++
      else if (r === null) o.none++
      else if (broken.has(r)) o.shallow++
      else o.other++
    }
  }
  return o
}
const pct = (x: number, n: number) => Math.round(100 * x / n)
const p95 = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length * 0.95)]

describe('diagnostic accuracy (simulated learners)', () => {
  /** THE headline number: given a child with a real gap, does the report name the right one? */
  // ⚠️ Explicit timeouts: these drive tens of thousands of full probes, and vitest's 5s default is
  //  for unit tests. Run alone they take ~2s each; run inside the whole suite the CPU is shared and
  //  they tipped over — taking an unrelated sweep with them, which reads as a real failure.
  it('names the EXACT planted root gap for most children', { timeout: 30000 }, () => {
    // ⚠️ 24 trials per plantable root, not 8. This is the number the product is judged on, and at
    //  8 the sampling noise was ±3 points — enough to read a seed change as a regression.
    const rows: string[] = []
    for (const band of BANDS) {
      const o = planted(band, 24, 20260822)
      rows.push(`${band}: exact ${pct(o.exact, o.n)}% · one-level-shallow ${pct(o.shallow, o.n)}% · other ${pct(o.other, o.n)}% · missed ${pct(o.none, o.n)}% · p95 ${p95(o.asks)} questions`)
      // v1 measured 26–34% here. Anything back under 75 means either the answer surface has become
      // guessable again (look for a `pick` where a number could be typed) or a confirmation has
      // been traded away for length.
      expect(pct(o.exact, o.n), `${band} exact root`).toBeGreaterThanOrEqual(75)
      /**
       * ⚠️ LENGTH IS STILL GATED, JUST HIGHER — founder's call 2026-08-22, accuracy over length.
       * Accuracy is trivially buyable with more questions, so leaving this ungated would let the
       * probe grow without anybody deciding to let it. The ceilings are the measured p95 for a
       * child WITH a gap, plus headroom. ⚠️ The number that actually protects the anti-fear rule is
       * the ON-GRADE one below: a child with nothing wrong must not be put through an ordeal, and
       * they answer 10–17 either way because the extra evidence is spent on doubt, not on everybody.
       */
      expect(p95(o.asks), `${band} probe length (95th percentile)`).toBeLessThanOrEqual(
        { '6-8': 24, '9-11': 30, '12-14': 32, '15-16': 28, '17-18': 38 }[band as string] ?? 30)
    }
    console.log('ROOT GAP:\n  ' + rows.join('\n  '))
  })

  /** The worst outcome the product can produce: a child with a real gap told they have none, with
   *  an empty plan and a "get ahead" report. v1 did this to 10–38% of them. */
  it('almost never tells a child with a real gap that they are on track', { timeout: 30000 }, () => {
    for (const band of BANDS) {
      const o = planted(band, 8, 77001)
      expect(pct(o.none, o.n), `${band} missed the gap entirely`).toBeLessThanOrEqual(8)
    }
  })

  /** The mirror error: an on-grade child who slips must not be handed a remediation plan.
   *
   *  ⚠️ TWO DIFFERENT MISTAKES WEAR ONE NAME HERE, AND ONLY ONE OF THEM IS DAMAGING. A child who
   *  genuinely misses the same leaf skill twice and is told "one chapter worth a look" has been
   *  served correctly — they did miss it, twice, and the route is one chapter. The mistake that
   *  matters is being told the gap sits in a LOWER BAND: that is the "you are three years behind"
   *  report, it produces a long remediation plan, and it is the one that would make a parent
   *  distrust the whole thing. Sweeping the leaf chapters raised the first number and not the
   *  second, so they are asserted apart. */
  it('rarely invents a gap for an on-grade child, and essentially never a deep one', () => {
    const BAND_ORDER: Band[] = ['3-5', '6-8', '9-11', '12-14', '15-16', '17-18']
    for (const band of BANDS) {
      const rnd = mulberry32(4242)
      let falseGap = 0, falseDeep = 0; const asks: number[] = []
      const T = 300
      for (let t = 0; t < T; t++) {
        const { state, result } = runProbe(band, () => rnd() > SLIP)
        asks.push(state.asked.length)
        if (result.rootGap) {
          falseGap++
          const gapBand = SKILL_NODES.find(n => n.id === result.rootGap)!.band
          if (BAND_ORDER.indexOf(gapBand) < BAND_ORDER.indexOf(band)) falseDeep++
        }
      }
      expect(pct(falseGap, T), `${band} false gap (any)`).toBeLessThanOrEqual(18)
      expect(pct(falseDeep, T), `${band} false gap in a LOWER band`).toBeLessThanOrEqual(6)
      /** ⚠️ THE ANTI-FEAR NUMBER. A child with no gap must not pay for the evidence spent on
       *  children who have one — measured, they answer 10–17 whichever rule is in force. */
      expect(p95(asks), `${band} on-grade length`).toBeLessThanOrEqual(PROBE_ENTRY[band].length + 12)
    }
  })

  /** ⚠️ THE ROUTE IS WALKED ONE CHAPTER AT A TIME, BUT IT IS STILL SOMETHING A PARENT READS. A deep
   *  gap honestly needs many chapters; a typical one must not. If this climbs, the chain derivation
   *  in `diagnose()` has started including skills that are not between the gap and the child. */
  it('a typical route is a handful of chapters, not a wall', { timeout: 30000 }, () => {
    const rows: string[] = []
    for (const band of BANDS) {
      const rnd = mulberry32(31337)
      const lens: number[] = []
      for (const root of reachable(band)) {
        const broken = new Set([root, ...blockedBy(root)])
        for (let t = 0; t < 4; t++) {
          const { result } = runProbe(band, sk => rnd() < (broken.has(sk) ? GUESS[sk] ?? 0.25 : 1 - SLIP))
          if (result.rootGap) lens.push(result.planChapters.length)
        }
      }
      const median = [...lens].sort((a, b) => a - b)[Math.floor(lens.length / 2)]
      rows.push(`${band}: median ${median} chapters, p95 ${p95(lens)}`)
      // ⚠️ The ceiling is per band because the honest answer is: a 17-year-old whose gap sits in
      // grade school really does have a dozen-plus chapters between them and their grade, and the
      // simulated learner is broken in EVERYTHING downstream of the planted root. Shortening that
      // would be lying about the distance. The report shows the first five and states the count.
      expect(median, `${band} median route length`).toBeLessThanOrEqual(band === '15-16' || band === '17-18' ? 18 : 12)
      expect(lens.every(l => l > 0), `${band} every diagnosed child gets a route`).toBe(true)
    }
    console.log('ROUTE LENGTH:\n  ' + rows.join('\n  '))
  })

  /** ⚠️ COVERAGE. A leaf skill blocks nothing, so the descent can never reach it — which is why ten
   *  built chapters were undiagnosable until PROBE_SWEEP existed. A child whose only gap is
   *  rounding, money, time or story problems must still get that chapter in their route. */
  it('finds a gap that lives on a leaf and puts its chapter in the route', () => {
    const rows: string[] = []
    for (const band of BANDS) {
      const leaves = PROBE_SWEEP[band]
      if (!leaves.length) continue
      const rnd = mulberry32(9090)
      let found = 0, n = 0
      for (const leaf of leaves) {
        const broken = new Set([leaf, ...blockedBy(leaf)])
        const want = routeChapterFor(leaf)
        for (let t = 0; t < 20; t++) {
          const { result } = runProbe(band, sk => rnd() < (broken.has(sk) ? GUESS[sk] ?? 0.25 : 1 - SLIP))
          n++
          if (want && result.planChapters.includes(want)) found++
        }
      }
      rows.push(`${band}: leaf gap routed ${pct(found, n)}% (${leaves.length} leaf chapters)`)
      expect(pct(found, n), `${band} leaf gap routed`).toBeGreaterThanOrEqual(80)
    }
    console.log('LEAF COVERAGE:\n  ' + rows.join('\n  '))
  })

  /** ⚠️ THE ROUTE MUST START AT THE GAP. Three skills own no chapter, and `chapterFor` dropped them
   *  — so a child whose root gap was multiplication FACTS was sent to Factors & Primes, which sits
   *  downstream of the very thing they cannot do. */
  it('the route always starts at the root gap, including the skills with no chapter of their own', { timeout: 20000 }, () => {
    const offenders: string[] = []
    for (const band of BANDS) {
      for (const root of reachable(band)) {
        const broken = new Set([root, ...blockedBy(root)])
        const { result } = runProbe(band, sk => !broken.has(sk))   // perfect oracle: isolate the ROUTE
        const want = routeChapterFor(root)
        if (!result.rootGap) { offenders.push(`${band}/${root}: no gap found with a perfect oracle`); continue }
        if (want && result.planChapters[0] !== want) offenders.push(`${band}/${root}: route starts at ${result.planChapters[0]}, gap wants ${want}`)
        if (!result.planChapters.length) offenders.push(`${band}/${root}: empty route`)
      }
    }
    expect(offenders).toEqual([])
  })

  /**
   * ⚠️⚠️ THE CONTENT HOLE IS CLOSED, AND THIS IS WHAT KEEPS IT CLOSED.
   *
   * From 2026-08-13 to 2026-08-22 three skills carried `chapter: ''` — `i.multFacts`,
   * `i.multMultiDigit` and `i.division` — because Times Tables and Division had been deleted.
   * Measured while the hole was open: **~10% of diagnosed 9–11 children rooted on one of them**
   * (5–8% for the teen bands), and the stand-in was weaker than it sounded, because a child whose
   * root gap is multiplication FACTS has by the definition of a root already PASSED equal-groups
   * multiplication — so the plan sent them to a chapter they could already do.
   *
   * The Packing Shed (`timesTables`) and The Minibus Run (`division`) now cover all three. The
   * assertion is EXACT rather than a floor: a skill quietly losing its chapter would otherwise
   * reopen this in silence, and the rate below is printed so the next reader sees the number
   * instead of taking the sentence on trust.
   */
  it('every skill in the graph has a chapter to send a child to', { timeout: 30000 }, () => {
    const chapterless = SKILL_NODES.filter(n => !n.chapter).map(n => n.id).sort()
    expect(chapterless, 'a skill has lost its chapter — the diagnostic can find this gap and not fix it').toEqual([])
    for (const n of SKILL_NODES) expect(routeChapterFor(n.id), `${n.id} routes nowhere`).toBeTruthy()

    const rows: string[] = []
    for (const band of BANDS) {
      const rnd = mulberry32(606)
      let n = 0, noCh = 0
      for (const root of reachable(band)) {
        const broken = new Set([root, ...blockedBy(root)])
        for (let t = 0; t < 6; t++) {
          const { result } = runProbe(band, sk => rnd() < (broken.has(sk) ? GUESS[sk] ?? 0.25 : 1 - SLIP))
          if (!result.rootGap) continue
          n++
          if (!SKILL_NODES.find(x => x.id === result.rootGap)!.chapter) noCh++
        }
      }
      expect(noCh, `${band} routed a child to nothing`).toBe(0)
      rows.push(`${band}: ${pct(noCh, n)}% of diagnosed roots land on a skill with no chapter (was 5–10%)`)
    }
    console.log('CONTENT HOLE:\n  ' + rows.join('\n  '))
  })

  it('every chapter a route can emit is a real chapter', { timeout: 20000 }, () => {
    const known = new Set(SKILL_NODES.map(n => n.chapter).filter(Boolean))
    const emitted = new Set<string>()
    for (const band of BANDS) for (const root of reachable(band)) {
      const broken = new Set([root, ...blockedBy(root)])
      const { result } = runProbe(band, sk => !broken.has(sk))
      result.planChapters.forEach(c => emitted.add(c))
    }
    expect([...emitted].filter(c => !known.has(c))).toEqual([])
  })
})
