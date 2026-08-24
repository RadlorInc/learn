/**
 * Diagnostic engine — the pure logic that finds a child's ROOT GAP by walking the skill graph
 * (src/lib/skillGraph.ts) down from grade-expected skills, then generates a remediation plan.
 *
 * Pure + deterministic + framework-free (no React, no DB, no items). The interactive item layer
 * calls `startProbe → nextSkill → record` in a loop; `diagnose` turns the finished state into a
 * result + plan. Spec: docs/diagnostic-engine.md.
 *
 * Strategy: investigate each grade-expected entry skill independently. When one fails, descend
 * DEPTH-FIRST into a FAILING prerequisite (deepest-first), until we reach a node whose prerequisites
 * all pass — that node is the ROOT GAP on this branch. This reaches deep cross-band roots (a 16yo's
 * gap may live in grade 4) in ≈ chain-depth probes, and the items get EASIER as we descend (so the
 * child ends on success, not failure). Anti-fear is enforced at the presentation layer (no visible
 * score / red X); the failure cap is a generous safety backstop, not the primary UX lever.
 */
import {
  type Band, PROBE_ENTRY, NODE_BY_ID, SKILL_NODES, prereqsOf, dependentsOf, blockedBy, routeChapterFor,
} from '@/core/skillGraph'

const BAND_ORDER: Record<Band, number> = { '3-5': 0, '6-8': 1, '9-11': 2, '12-14': 3, '15-16': 4, '17-18': 5 }
const BAND_LABEL: Record<Band, string> = {
  '3-5': 'Pre-K–K', '6-8': 'Grade 1–2', '9-11': 'Grade 3–5', '12-14': 'Grade 6–8', '15-16': 'Grade 9–10', '17-18': 'Grade 11–12',
}

export interface ProbeConfig {
  maxItems: number
  maxFailures: number
  /** Require TWO misses on a skill before treating it as failed (a fresh item is offered in
   *  between). One careless slip on a known skill used to send the probe descending and could
   *  report a FALSE root — the worst diagnostic outcome, since it produces a wrong 6-week plan.
   *  A single miss is now a "strike": the skill is re-offered, a pass forgives the slip, a second
   *  miss confirms the fail. Also anti-fear-positive: the child gets a second chance instead of
   *  being silently branded. Defaults ON except the 3–5 band, whose items are PARENT-OBSERVED
   *  readiness reports ("not yet" is an observation, not a miss — re-asking the parent the same
   *  question is nonsense). NOTE this guards false FAILS (slips); a lucky GUESS on an MCQ
   *  (~25% with 4 choices) can still end a descent one level early — confirming passes too would
   *  double the length of every probe, a bad trade against anti-fear. */
  confirmFails?: boolean
}
/**
 * maxItems bounds the probe LENGTH; maxFailures is an anti-fear backstop and NOT the length lever
 * (the descent gets easier toward the bottom, so it ends on success).
 *
 * ⚠️ RAISED 2026-08-22 WHEN CONFIRMATION BECAME UNCONDITIONAL — founder's call, accuracy over
 * length. Set from a measured distribution rather than picked: each is the band's p95 for a child
 * with a real gap, rounded up, and it also clears the worst case there is (a child who fails
 * absolutely everything). A cap set below the p95 does not shorten the probe, it TRUNCATES the
 * search — and a truncated search reports whatever it had reached, which is a wrong gap rather
 * than a shorter check.
 *
 * | band | gapped med / p95 / p99 | on-grade med | cap |
 * |---|---|---|---|
 * | 6–8   | 29 / 39 / 42 | 26 | 46 |
 * | 9–11  | 39 / 50 / 56 | 36 | 60 |
 * | 12–14 | 40 / 51 / 56 | 30 | 60 |
 * | 15–16 | 31 / 46 / 51 | 20 | 56 |
 * | 17–18 | 50 / 63 / 70 | 20 | 76 |
 *
 * ⚠️ The cap is the p99 rounded up, not the p95: a cap between the two does not shorten anything,
 * it TRUNCATES the one child in a hundred whose search needed the room — and a truncated search
 * reports whatever it had reached, which is a wrong gap rather than a shorter check.
 * ⚠️ And 17–18's numbers are what a nine-band-deep search costs. A teenager whose gap sits in grade
 * school answers around 39 questions. That is a real placement test rather than a quick check, and
 * it is the trade the founder chose (2026-08-22, accuracy over length) — see MAX_TRIES.
 */
export const DEFAULT_CONFIG: Record<Band, ProbeConfig> = {
  // 3–5 is a READINESS check (Phase 3): probe every milestone for a complete picture. The items are
  // parent-observed (the child isn't failing on-screen), so a higher failure cap isn't anti-fear-unsafe.
  '3-5': { maxItems: 14, maxFailures: 9, confirmFails: false },
  '6-8': { maxItems: 46, maxFailures: 24, confirmFails: true },
  '9-11': { maxItems: 60, maxFailures: 30, confirmFails: true },
  '12-14': { maxItems: 60, maxFailures: 30, confirmFails: true },
  '15-16': { maxItems: 56, maxFailures: 28, confirmFails: true },
  '17-18': { maxItems: 76, maxFailures: 40, confirmFails: true },
}

/** Confirm fails only while confirmed fails are below this (see the comment in record()). */
/**
 * ⚠️⚠️ EVIDENCE PER SKILL — AND THE THING THAT WAS WRONG WAS *WHERE* IT STOPPED, NOT HOW MUCH.
 *
 * Founder's call, 2026-08-22: *"exact aur proper gap find kare… chalega bacche ko zyada questions
 * solve karna padhege toh"* — accuracy first, length second. So the obvious moves were measured
 * rather than assumed, and the obvious ones lost:
 *
 * | rule | exact | on-grade FALSE gap | gapped p95 | on-grade questions |
 * |---|---|---|---|---|
 * | before: confirm a fail, but stop after 4 confirmed fails | 76–87% | 9–16% | 17–28 | 9–17 |
 * | **now: confirm a fail at EVERY depth, a pass forgives** | **82–87%** | **7–14%** | 18–32 | 9–16 |
 * | three items each, majority decides | 82–88% | **7–25%** | 20–34 | 9–17 |
 * | five items each, majority | 82–88% | 7–25% | 20–34 | 9–17 |
 * | three items on EVERY skill, majority | 94–99% | 0% | 63–90 | **25–46** |
 *
 * ⚠️ Two of those are traps. **A third item buys nothing** — exact is flat against two, because the
 * ambiguous "miss then pass" is overwhelmingly a real child slipping on a skill they HAVE, and
 * majority-of-three converts about one slip in ten into a false fail: 9–11's false-gap rate went
 * 14% → 25% for no gain at all. **And five is identical to three**, because a majority of three can
 * never tie, so the fourth item is never reached — a measured floor on how much more evidence per
 * skill is worth buying at all. The last row is the accurate one and is not shippable: 25–46
 * questions for a child with no gap is a different product, and anti-fear is non-negotiable here.
 *
 * What DID pay was removing the ceiling. Confirmation used to stop after four confirmed fails, on
 * the argument that a child failing that much is not slipping — true, and it meant the bands that
 * descend furthest spent most of their descent unguarded. Measured, the too-deep error tracked the
 * descent distance almost exactly (1% at one band below the child, 9% at 3.6 bands), and 17–18
 * went 76% → 84% once the guard ran all the way down.
 *
 * So: a first PASS settles it (a typed answer flukes ~3% of the time — see diagnosticItems.ts), a
 * first MISS is never a verdict at any depth, and a pass on the retry forgives the slip. The cost
 * lands on children who have a real gap, which is who it is for.
 */
export const MAX_TRIES = 7

/**
 * ⚠️⚠️ THE DESCENT BISECTS; IT DOES NOT WALK. `lo` is the deepest skill we have watched the child
 * FAIL on this branch, `cands` is every skill under it that could still be the root.
 *
 * It used to step one prerequisite at a time, which costs a question per LEVEL — and the chains are
 * long: a 17–18 learner rooting in grade school is nine levels down. Measured, that band spent
 * **11.3 of its 20.2 questions on the descent alone**, and every one of those is another chance for
 * a careless slip to plant a false, deeper root — which is exactly what its 72% exact-root rate was
 * made of. Halving the candidate set instead turns nine questions into about four, so the probe gets
 * shorter AND more accurate from one change.
 */
interface Frame {
  lo: string        // deepest skill known to FAIL on this branch
  cands: string[]   // everything under it that could still be the root
  /** ⚠️ HAS ANYTHING UNDER `lo` ACTUALLY FAILED YET? Bisection is only worth its price once we know
   *  the root is somewhere DEEP. Measured: bisecting from the start took a grade-level 17–18 child
   *  from 9 questions to 22, because a slip fails one entry and the search then prunes a 40-node
   *  closure a subtree at a time — when the cheap question was "do this skill's DIRECT prerequisites
   *  hold?", which is three probes and ends it. So the branch opens in direct-prerequisite mode and
   *  switches to bisecting the moment a probe under it fails, which is exactly when the long chains
   *  appear. */
  deep: boolean
}

export interface ProbeState {
  band: Band
  config: ProbeConfig
  /**
   * ⚠️ DID THIS PROBE START FROM THE WHOLE BAND, or from a narrowed agenda? It is the ONLY thing
   * that separates "we looked everywhere and found nothing" from "we looked where you pointed and
   * found nothing", and those two must never reach a parent as the same sentence. See `coverage`.
   */
  fullAgenda: boolean
  agenda: string[]        // independent entry skills still to investigate
  frames: Frame[]         // the active branch's bisecting search (0 or 1 deep)
  passed: string[]
  failed: string[]
  asked: string[]
  roots: string[]         // confirmed root gaps (≤1 per entry branch)
  /** What each skill has actually answered so far, while it is still undecided. Nothing else moves
   *  until a verdict is reached, so nextSkill re-offers the same skill; the item layer must serve a
   *  FRESH item for a repeat ask (see resolve() in diagnostic/page.tsx). Never reaches
   *  `failed`/`passed`/diagnose — only the majority verdict does. */
  tries: Record<string, boolean[]>
}

// Prerequisite depth (foundational = low). Graph is acyclic (verified), guard anyway.
const _depth = new Map<string, number>()
function depth(id: string, guard = new Set<string>()): number {
  if (_depth.has(id)) return _depth.get(id)!
  if (guard.has(id)) return 0
  guard.add(id)
  const pr = prereqsOf(id)
  const d = pr.length ? 1 + Math.max(...pr.map(p => depth(p, guard))) : 0
  _depth.set(id, d)
  return d
}

const seen = (s: ProbeState, id: string) => s.passed.includes(id) || s.failed.includes(id)

/**
 * Every skill under `id` that could still BE the root: its transitive prerequisites, minus anything
 * the child has PASSED — a pass bounds the search below it, because you cannot do a skill without
 * its prerequisites. Already-FAILED nodes stay in, so the search can drop into them for free.
 */
function candidatesUnder(s: ProbeState, id: string): string[] {
  const out: string[] = []
  const walk = (x: string) => {
    for (const p of prereqsOf(x)) {
      if (!NODE_BY_ID[p] || out.includes(p) || s.passed.includes(p)) continue
      out.push(p); walk(p)
    }
  }
  walk(id)
  return out
}

/**
 * The candidate that best HALVES the remaining search: if it fails the root is at or below it, if
 * it passes the root is above it, so the informative choice is the one whose own sub-tree is
 * closest to half of what is left. Ties break DEEPER, which is the cheaper mistake — a root found
 * one level too deep starts the plan one chapter early and climbs.
 */
function bisect(s: ProbeState, f: Frame): string | null {
  const cands = f.deep ? f.cands : f.cands.filter(c => prereqsOf(f.lo).includes(c))
  if (!cands.length) return f.cands[0] ?? null
  let best = cands[0], bestScore = Infinity
  for (const c of cands) {
    const below = candidatesUnder(s, c).filter(x => f.cands.includes(x)).length
    const score = f.deep ? Math.max(below, f.cands.length - below - 1) : -below
    if (score < bestScore || (score === bestScore && depth(c) > depth(best))) { best = c; bestScore = score }
  }
  return best
}

/** Resolve the active branch: recompute what is still in play, drop for free into anything already
 *  known to fail, and declare a root when nothing is left under it. Mutates s. */
function normalize(s: ProbeState): void {
  let guard = 0
  while (s.frames.length && guard++ < 500) {
    const f = s.frames[0]
    f.cands = candidatesUnder(s, f.lo)
    // A candidate we have ALREADY watched fail (reached under an earlier entry) is a free level of
    // descent — the root is at or below it and we know that without spending a question.
    const known = f.cands.find(c => s.failed.includes(c))
    if (known) { f.lo = known; f.deep = true; continue }
    if (f.cands.length === 0) {
      // nothing broken under it → `lo` is the deepest broken skill on this branch = a root
      if (!s.roots.includes(f.lo)) s.roots.push(f.lo)
      s.frames.length = 0   // this entry is diagnosed; move on to the next agenda entry
      // NOTE: do NOT shift the agenda here — the failed entry was already shifted off in record()
      // when it was first probed. The skip loop below advances past anything already visited.
      continue
    }
    break // need to probe a candidate
  }
  // Skip entry skills we've already probed (e.g. reached as a prereq of an earlier entry) — don't
  // re-investigate them or waste the failure budget.
  //
  // ⚠️ AND SKIP THE ONES THE GRAPH HAS ALREADY ANSWERED. A sweep entry sitting on top of a skill we
  // have just watched the child fail is not a question, it is arithmetic. Asking "the largest number
  // that divides into both 24 and 36" of a child who could not do 6 × 6 costs a question, costs a
  // failure out of the anti-fear budget, and hands them another thing they cannot do — to learn what
  // the prerequisite edge already states. It is recorded as failed (which is what the edge CLAIMS)
  // so the chapter still reaches the child's route. It can never invent a root gap: `rootCandidates`
  // keeps only failures with no failed prerequisite, and an inferred failure has one by construction.
  if (!s.frames.length) {
    // …and the mirror of it: an entry that is a PREREQUISITE of something the child has already
    // passed is answered too — you cannot do the harder skill without it. Recorded as passed, so it
    // never reaches the route. (Together these two are worth several questions on a clean run.)
    while (s.agenda.length && (seen(s, s.agenda[0])
        || prereqsOf(s.agenda[0]).some(p => s.failed.includes(p))
        || s.passed.some(done => prereqsOf(done).includes(s.agenda[0])))) {
      const id = s.agenda.shift()!
      if (seen(s, id)) continue
      if (s.passed.some(done => prereqsOf(done).includes(id))) s.passed.push(id)
      else s.failed.push(id)
    }
  }
}

/**
 * Start a probe.
 *
 * `agenda` narrows which entry skills are investigated. Two callers want that:
 *   · the SHORT PASS — `PROBE_SPINE[band]`, the load-bearing chain, leaving the sweep for later;
 *   · 17–18's DOOR 2 — a single strand the student named ("I'm fine until quadratics"), which is
 *     real information at that age and noise at six.
 *
 * ⚠️ A NARROWED PROBE IS NOT A SHORTER PROBE, IT IS A NARROWER CLAIM, and `coverage` is how the
 * report is stopped from confusing the two. Measured for 17–18: seeded at the right strand it names
 * the exact root 94% of the time in 28 questions against the full probe's 97% in 50 — but seeded at
 * the WRONG strand it reports no gap 100% of the time, in two questions. That is not a bad probe;
 * it is a probe answering the question it was asked. What would make it a lie is saying "on track".
 */
export function startProbe(band: Band, config: ProbeConfig = DEFAULT_CONFIG[band], agenda?: string[]): ProbeState {
  return {
    band, config,
    fullAgenda: agenda === undefined,
    agenda: [...(agenda ?? PROBE_ENTRY[band])],
    frames: [], passed: [], failed: [], asked: [], roots: [], tries: {},
  }
}

/** The next skill to probe, or null when the probe is done (caps hit or nothing left). */
export function nextSkill(s: ProbeState): string | null {
  if (s.asked.length >= s.config.maxItems) return null
  if (s.failed.length >= s.config.maxFailures) return null   // safety backstop
  normalize(s)
  if (s.frames.length) return bisect(s, s.frames[0])
  if (s.agenda.length) return s.agenda[0]
  return null
}

/** Record a probe result; returns a new state. */
export function record(s: ProbeState, id: string, passed: boolean): ProbeState {
  // `passed` is re-decided below once enough evidence is in; see MAX_TRIES.
  const ns: ProbeState = {
    ...s,
    agenda: s.agenda.slice(),
    frames: s.frames.map(f => ({ lo: f.lo, cands: f.cands.slice(), deep: f.deep })),
    passed: s.passed.slice(), failed: s.failed.slice(), asked: [...s.asked, id], roots: s.roots.slice(),
    tries: { ...(s.tries ?? {}) },
  }
  // See MAX_TRIES above for the measurements behind this.
  const confirming = ns.config.confirmFails ?? ns.band !== '3-5'
  if (confirming) {
    const so_far = [...(ns.tries[id] ?? []), passed]
    ns.tries = { ...ns.tries, [id]: so_far }
    const passes = so_far.filter(Boolean).length
    /**
     * ⚠️⚠️ INSIDE A DESCENT, A **PASS** NEEDS CONFIRMING TOO — and that asymmetry is the whole fix
     * for the error that was left.
     *
     * A pass is only dangerous where it ENDS the search. On an entry probe it does not: the child
     * has shown no sign of trouble, and a pass there simply moves on. Inside a descent we already
     * know something above is broken, so a pass is the pivotal claim — it says "the gap is not
     * below here", and if it was a lucky one the probe stops ABOVE the real gap and hands the child
     * a plan starting on something they cannot do. That is the damaging direction, and measured
     * with each item's REAL guess rate it was 12–19% of every diagnosis.
     *
     * The arithmetic says why it has to be here rather than everywhere: with a forgiving retry, a
     * broken skill whose item has a seven-value answer space passes by luck `g + (1−g)g` ≈ **26%**
     * of the time. Requiring two agreeing answers takes that to ~5%. Doing it on EVERY skill would
     * also double the length for a child with no gap at all, who has no descent — so it is spent
     * exactly where the doubt is.
     */
    /**
     * ⚠️ INSIDE A DESCENT THE RULE IS A **LEAD OF TWO**, NOT A COUNT OF TWO. Requiring two passes
     * (a fixed count) fixed the lucky-pass error and created its mirror: a child who slips twice on
     * a skill they HAVE is now failed, so the root lands too DEEP — 17–18's too-deep errors went
     * 6% → 15% for that reason alone. Asking until one answer is two AHEAD decides both directions
     * on the same evidence: `miss, pass` is level and buys another item, `pass, pass` stops at two.
     * Expected cost about 2.3 items per descent step, and it self-limits — an obvious skill settles
     * in two, only a genuinely borderline one goes to five.
     */
    /**
     * ⚠️⚠️ A PASS IS CONFIRMED EVERYWHERE TOO, AND THE STEP BEFORE THIS ONE IS WORTH RECORDING.
     * Confirming a pass only on SPINE entries was tried first, on the reasoning that a spine pass
     * closes a whole branch (so a lucky one hides the gap completely) while a sweep leaf blocks
     * nothing. That is true and it left a residue: a child whose ONLY gap is a leaf still had it
     * lucky-passed away, and the report told them they were at grade level with an empty plan —
     * 7% of 6–8 diagnoses. Measured both ways:
     *
     * |  | exact | told "on track" with a real gap | on-grade questions |
     * |---|---|---|---|
     * | spine passes confirmed | 86–91% | 0–7% | 17–25 |
     * | **every pass confirmed** | **89–93%** | **0–2%** | 19–36 |
     *
     * The second is what ships. Telling a child with a gap that they have none is the worst thing
     * this product can produce, and the cost is questions, which is the trade the founder chose.
     */
    /**
     * ⚠️ AND FAILING IS DELIBERATELY HARDER THAN PASSING — a lead of THREE to fail, TWO to pass.
     * The two verdicts do not cost the same thing. A pass moves on; a fail sends the search
     * downward and, at an entry, tells a family their child is behind. With a 10% slip and thirty
     * questions a symmetric rule made a double-slip almost routine: 8% of ON-GRADE 12–14 children
     * were told their gap sat a whole band below them. Asking for one more agreeing miss takes that
     * to about a tenth of a percent per skill, and costs one extra item on a skill that really is
     * broken — which a broken skill supplies immediately anyway.
     */
    const misses = so_far.length - passes
    const decided = passes - misses >= 2 || misses - passes >= 3
    if (!decided && so_far.length < MAX_TRIES) return ns   // re-offer it; the item layer serves a FRESH item
    passed = passes * 2 >= so_far.length                        // a tie goes to the child
  }
  if (ns.frames.length === 0) {
    // entry probe
    if (id === ns.agenda[0]) ns.agenda.shift()
    if (passed) ns.passed.push(id)
    else { ns.failed.push(id); ns.frames.push({ lo: id, cands: candidatesUnder(ns, id), deep: false }) }
  } else {
    // a candidate under the active branch: a fail moves the floor DOWN to it, a pass prunes it and
    // everything beneath it (normalize recomputes the candidate set from `lo` either way).
    if (passed) ns.passed.push(id)
    else { ns.failed.push(id); ns.frames[0].lo = id; ns.frames[0].deep = true }
  }
  normalize(ns)
  return ns
}

export interface Diagnosis {
  /**
   * ⚠️⚠️ WHETHER THIS RESULT MAY MAKE A CLAIM ABOUT THE CHILD AT ALL.
   *
   * `full` — the whole band's agenda was investigated and neither cap was reached. Only a `full`
   * result with no root gap is allowed to say anything a parent reads as a clean bill of health.
   * `partial` — a narrowed agenda (the short pass, or 17–18's door 2) or a cap-truncated search.
   * It may say where to START. It may NEVER say "on track", "no gaps", or anything that reads as
   * one, because it did not look. Founder's rule, 2026-08-24: *only the deep pass is allowed to
   * make a claim about whether a child is at grade level.*
   *
   * Without this the arithmetic is brutal: measured, the spine alone misses a third to a half of
   * gaps in 6–8 and 9–11, and a wrongly-seeded 17–18 probe misses 100% of them. Framed as "here is
   * where we're starting" that is a less-targeted plan; framed as "no gaps found" it is a lie told
   * to the parent of a child who has one.
   */
  coverage: 'full' | 'partial'
  rootGap: string | null
  secondGap: string | null
  blockedSkills: string[]     // full downstream cost of the root gap
  downstreamHighlights: string[]  // the compelling near-future skills to NAME in the report
  reachesAlgebra: boolean     // does the gap ultimately block algebra-and-beyond?
  strengths: string[]         // what's working (lead the report with these)
  workingLevel: string        // coarse, human — never a decimal grade
  gapBandsBelow: number
  planSkills: string[]        // ordered, foundational-first
  planChapters: string[]      // remediation sequence (chapters.ts ids)
  probedPassed: string[]      // all skills that passed (readiness report leads with these)
  probedFailed: string[]      // all skills that failed (readiness "growing edges")
}

/** Fallback root finder if the probe stopped (caps) before confirming a clean root. */
export function rootCandidates(s: ProbeState): string[] {
  const failed = new Set(s.failed)
  return s.failed.filter(id => !prereqsOf(id).some(p => failed.has(p)))
}

const related = (a: string, b: string) => blockedBy(a).includes(b) || blockedBy(b).includes(a)

export function diagnose(s: ProbeState): Diagnosis {
  // A failed skill with no failed prerequisite IS a root (true even for a cap-truncated branch).
  // With the depth-first "descend into a failing prereq" search, this equals the confirmed roots
  // plus any not-yet-confirmed deepest failures — so it surfaces gaps on every investigated spine.
  const cands = rootCandidates(s).slice()
  cands.sort((a, b) =>
    blockedBy(b).length - blockedBy(a).length ||                     // most-unlocking first
    BAND_ORDER[NODE_BY_ID[a].band] - BAND_ORDER[NODE_BY_ID[b].band])  // then deepest (lowest band)
  const rootGap = cands[0] ?? null
  const secondGap = rootGap ? (cands.find(c => c !== rootGap && !related(c, rootGap)) ?? null) : null

  // ⚠️⚠️ THE ROUTE IS DERIVED FROM THE GAP, NOT FROM WHICH QUESTIONS HAPPENED TO GET ASKED.
  // It used to be `[...s.failed]`, which was a fair approximation while the descent walked every
  // level — and became wrong the moment it started BISECTING, because a bisecting search skips
  // levels on purpose and those skipped chapters are exactly the ones between the child's gap and
  // their grade. Spec's own words: "walk UP the dependency chain toward the child's grade node".
  //
  // So: everything we watched fail, PLUS every skill that lies on a chain from a root gap up to an
  // entry the child failed — bounded by that chain, not by `blockedBy(root)`, which for a deep root
  // is most of the graph and would hand a nine-year-old a twenty-chapter plan. Anything the child
  // PASSED is excluded even when the graph says it is downstream: evidence beats the edge.
  const onChain = new Set<string>(s.failed)
  for (const r of cands) {
    const below = blockedBy(r)
    for (const entry of s.failed) {
      if (entry === r) continue
      for (const x of [entry, ...prereqClosure(entry)]) {
        if (!s.passed.includes(x) && below.includes(x)) onChain.add(x)
      }
    }
  }
  const planSkills = [...onChain].sort((a, b) => depth(a) - depth(b))
  const planChapters: string[] = []
  // ⚠️ Every skill must yield a chapter here. Three of them did not between 2026-08-13 and
  // 2026-08-22 — multiplication facts, multi-digit multiplication, division — and one was a 9–11
  // probe entry, so this loop silently dropped the child's own gap out of their route and started
  // them downstream of it. `diagnosticAccuracy.test.ts` fails if that ever becomes possible again.
  for (const sk of planSkills) { const ch = routeChapterFor(sk); if (ch && !planChapters.includes(ch)) planChapters.push(ch) }

  const strengths = [...s.passed]
    .sort((a, b) => BAND_ORDER[NODE_BY_ID[b].band] - BAND_ORDER[NODE_BY_ID[a].band])
    .slice(0, 3)

  // Downstream cost worth NAMING: skip trivia at/below the gap; surface near-future recognizable
  // skills first, most-unlocking as tie-break. "algebra and beyond" is called out separately.
  const blocked = rootGap ? blockedBy(rootGap) : []
  const minHighlightBand = rootGap ? Math.min(BAND_ORDER[s.band], BAND_ORDER[NODE_BY_ID[rootGap].band] + 1) : 0
  const downstreamHighlights = blocked
    .filter(id => BAND_ORDER[NODE_BY_ID[id].band] >= minHighlightBand)
    .sort((a, b) => BAND_ORDER[NODE_BY_ID[a].band] - BAND_ORDER[NODE_BY_ID[b].band] || blockedBy(b).length - blockedBy(a).length)
    .slice(0, 3)
  const reachesAlgebra = blocked.some(id => BAND_ORDER[NODE_BY_ID[id].band] >= 4)

  const gapBandsBelow = rootGap ? BAND_ORDER[s.band] - BAND_ORDER[NODE_BY_ID[rootGap].band] : 0
  /**
   * Started from the whole band, and finished: nothing left on the agenda and no branch still open.
   *
   * ⚠️ THE CAPS ARE DELIBERATELY NOT TESTED HERE, AND THAT IS A MEASUREMENT RATHER THAN AN
   * OVERSIGHT. The obvious version also required `asked < maxItems && failed < maxFailures`.
   * Mutation-testing showed removing those two clauses changed nothing — because a cap that stops
   * the search mid-flight ALWAYS leaves the agenda or a frame non-empty, which the first two
   * conditions already catch. And in the one case they are not redundant they are wrong: a cap
   * reached at the exact moment the last entry resolves would report a FINISHED search as partial.
   * An inert clause in a rule this load-bearing is worse than none — it reads as protection.
   */
  const coverage: 'full' | 'partial' =
    s.fullAgenda !== false && s.agenda.length === 0 && s.frames.length === 0 ? 'full' : 'partial'
  const workingLevel = !rootGap
    // ⚠️ THE ONE SENTENCE THAT MAY NOT BE SHARED BETWEEN THE TWO. A partial pass that found nothing
    // says where to start; it does not say the child is fine, because it did not look.
    ? (coverage === 'full'
        ? `At or above grade level (${BAND_LABEL[s.band]}).`
        : `Nothing broken in what we checked — here is where to start.`)
    : gapBandsBelow <= 0 ? `Working at grade level with one specific gap.`
    : gapBandsBelow === 1 ? `One grade band below in this strand (gap in ${BAND_LABEL[NODE_BY_ID[rootGap].band]}).`
    : `Foundational gap ~${gapBandsBelow} bands below grade (in ${BAND_LABEL[NODE_BY_ID[rootGap].band]}).`

  return {
    coverage,
    rootGap, secondGap,
    blockedSkills: blocked, downstreamHighlights, reachesAlgebra,
    strengths, workingLevel, gapBandsBelow, planSkills, planChapters,
    probedPassed: [...s.passed], probedFailed: [...s.failed],
  }
}

/** Convenience for tests / headless runs: drive the whole probe with an answer oracle. */
export function runProbe(band: Band, answer: (skillId: string) => boolean, config?: ProbeConfig): { state: ProbeState; result: Diagnosis } {
  let s = startProbe(band, config)
  let id: string | null
  while ((id = nextSkill(s)) !== null) s = record(s, id, answer(id))
  return { state: s, result: diagnose(s) }
}

/** Step 8 — the week-N re-check. Re-probe the remediated root gap plus its 1–2 nearest dependents
 *  (the skills it was blocking). "Gap closed" = the root skill now passes; the dependents are bonus
 *  signal that the child can build on it again. Small on purpose (anti-fear; it's a check, not a test). */
export function recheckSkills(rootSkill: string): string[] {
  return [rootSkill, ...dependentsOf(rootSkill).slice(0, 2)]
}

/** Play-data feedback: when the child STRUGGLES in the plan's first (root) chapter, the true gap
 *  sits deeper than the probe found — a prerequisite the descent stopped at (the ~25% lucky-guess
 *  case the probe structurally cannot catch, since a guess looks like a pass). This returns the
 *  chapter to prepend to the plan: the most load-bearing direct prerequisite of the root skill
 *  that has its own chapter (same most-unlocking-then-deepest ranking diagnose() uses for roots).
 *  Returns null at the graph floor — nothing deeper exists to revise to.
 *  NOTE the signal is asymmetric by design: struggle ⇒ revise deeper, but BREEZE ⇒ nothing —
 *  a child cruising the root chapter may simply have been taught by it, so it is no evidence
 *  the diagnosis was wrong. */
export function deeperChapter(rootChapterId: string): string | null {
  const rootSkill = SKILL_NODES.find(n => n.chapter === rootChapterId)?.id
  if (!rootSkill) return null
  const cands = prereqsOf(rootSkill)
    .filter(p => NODE_BY_ID[p]?.chapter && NODE_BY_ID[p].chapter !== rootChapterId)
    .sort((a, b) =>
      blockedBy(b).length - blockedBy(a).length ||
      BAND_ORDER[NODE_BY_ID[a].band] - BAND_ORDER[NODE_BY_ID[b].band])
  return cands.length ? NODE_BY_ID[cands[0]].chapter : null
}

/** Transitive prerequisite closure of a skill (tests use it to simulate a realistic learner). */
export function prereqClosure(id: string): Set<string> {
  const out = new Set<string>()
  const walk = (x: string) => prereqsOf(x).forEach(p => { if (!out.has(p)) { out.add(p); walk(p) } })
  walk(id)
  return out
}
