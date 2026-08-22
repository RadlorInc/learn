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
// maxItems bounds the probe LENGTH (the primary UX lever); maxFailures is a generous anti-fear
// backstop, NOT the length lever (the descent gets EASIER toward the bottom, ending on success).
// The teen bands probe MORE strands (6–8 entries) and can descend MANY bands to a cross-band root
// (a grade-11 kid rooting at a grade-3 multiplication gap), so their caps scale up with band —
// a too-tight failure cap gets spent on the entry probes alone and truncates before the true root.
export const DEFAULT_CONFIG: Record<Band, ProbeConfig> = {
  // 3–5 is a READINESS check (Phase 3): probe every milestone for a complete picture. The items are
  // parent-observed (the child isn't failing on-screen), so a higher failure cap isn't anti-fear-unsafe.
  '3-5': { maxItems: 14, maxFailures: 9, confirmFails: false },
  // The confirming bands carry +CONFIRM_UNTIL_FAILS maxItems headroom (the exact worst-case cost
  // of the retries, since confirmation stops after that many confirmed fails). Verified by the
  // full planted-gap matrix: every reachable gap in every band resolves to the EXACT root at
  // these caps, including the extreme cross-band floors. Passes are unchanged, so a grade-level
  // child's probe is exactly as long as before.
  '6-8': { maxItems: 18, maxFailures: 7, confirmFails: true },
  '9-11': { maxItems: 24, maxFailures: 9, confirmFails: true },
  '12-14': { maxItems: 21, maxFailures: 12, confirmFails: true },
  '15-16': { maxItems: 24, maxFailures: 16, confirmFails: true },
  '17-18': { maxItems: 28, maxFailures: 20, confirmFails: true },
}

/** Confirm fails only while confirmed fails are below this (see the comment in record()). */
const CONFIRM_UNTIL_FAILS = 4

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
  agenda: string[]        // independent entry skills still to investigate
  frames: Frame[]         // the active branch's bisecting search (0 or 1 deep)
  passed: string[]
  failed: string[]
  asked: string[]
  roots: string[]         // confirmed root gaps (≤1 per entry branch)
  /** Skills with ONE unconfirmed miss (confirmFails). Nothing else moves, so nextSkill re-offers
   *  the same skill; the item layer must serve a FRESH item for a repeat ask (see resolve() in
   *  diagnostic/page.tsx). Never reaches `failed`/diagnose. */
  strikes: string[]
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

export function startProbe(band: Band, config: ProbeConfig = DEFAULT_CONFIG[band]): ProbeState {
  return { band, config, agenda: [...PROBE_ENTRY[band]], frames: [], passed: [], failed: [], asked: [], roots: [], strikes: [] }
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
  const ns: ProbeState = {
    ...s,
    agenda: s.agenda.slice(),
    frames: s.frames.map(f => ({ lo: f.lo, cands: f.cands.slice(), deep: f.deep })),
    passed: s.passed.slice(), failed: s.failed.slice(), asked: [...s.asked, id], roots: s.roots.slice(),
    strikes: (s.strikes ?? []).slice(),
  }
  // Fail confirmation: a FIRST miss is a strike, not a verdict. Leave the agenda/queue untouched
  // so nextSkill re-offers the same skill (with a fresh item); a pass on the retry forgives the
  // slip, a second miss falls through to the real fail path below.
  //
  // Only while confirmed fails are FEW. The catastrophic slip is the near-grade-level child whose
  // single fumble sends the probe descending and reports a gap that does not exist — that child
  // has 1–3 fails, all guarded. A child already at 4 confirmed fails isn't slipping; their
  // pattern IS the signal, and confirming every level of a deep descent would mean failing
  // everything twice (measured: 62 asks for a 17-18 learner rooting at pre-K — an ordeal, not a
  // probe). Past the threshold a mid-descent slip costs at most a root one level too DEEP — a
  // plan that starts one chapter early and climbs, mild next to a false root. Bounds the retry
  // overhead to ≤ CONFIRM_UNTIL_FAILS extra asks, priced into the maxItems caps above.
  if (!passed && (ns.config.confirmFails ?? ns.band !== '3-5')
      && ns.failed.length < CONFIRM_UNTIL_FAILS && !ns.strikes.includes(id)) {
    ns.strikes.push(id)
    return ns
  }
  ns.strikes = ns.strikes.filter(x => x !== id)   // verdict reached either way — clear the strike
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
  const workingLevel = !rootGap
    ? `At or above grade level (${BAND_LABEL[s.band]}).`
    : gapBandsBelow <= 0 ? `Working at grade level with one specific gap.`
    : gapBandsBelow === 1 ? `One grade band below in this strand (gap in ${BAND_LABEL[NODE_BY_ID[rootGap].band]}).`
    : `Foundational gap ~${gapBandsBelow} bands below grade (in ${BAND_LABEL[NODE_BY_ID[rootGap].band]}).`

  return {
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
