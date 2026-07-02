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
  type Band, PROBE_ENTRY, NODE_BY_ID, prereqsOf, blockedBy, chapterFor,
} from './skillGraph'

const BAND_ORDER: Record<Band, number> = { '3-5': 0, '6-8': 1, '9-11': 2, '12-14': 3, '15-16': 4, '17-18': 5 }
const BAND_LABEL: Record<Band, string> = {
  '3-5': 'Pre-K–K', '6-8': 'Grade 1–2', '9-11': 'Grade 3–5', '12-14': 'Grade 6–8', '15-16': 'Grade 9–10', '17-18': 'Grade 11–12',
}

export interface ProbeConfig { maxItems: number; maxFailures: number }
export const DEFAULT_CONFIG: Record<Band, ProbeConfig> = {
  '3-5': { maxItems: 8, maxFailures: 4 },
  '6-8': { maxItems: 10, maxFailures: 5 },
  '9-11': { maxItems: 15, maxFailures: 7 },
  '12-14': { maxItems: 14, maxFailures: 7 },
  '15-16': { maxItems: 16, maxFailures: 8 },
  '17-18': { maxItems: 16, maxFailures: 8 },
}

interface Frame { node: string; queue: string[] }   // node failed; queue = untried prereqs (deepest-first)

export interface ProbeState {
  band: Band
  config: ProbeConfig
  agenda: string[]        // independent entry skills still to investigate
  frames: Frame[]         // current depth-first descent under the active entry
  passed: string[]
  failed: string[]
  asked: string[]
  roots: string[]         // confirmed root gaps (≤1 per entry branch)
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

/** Candidate prerequisites to investigate under a failed node: unseen or already-failed, deepest-first. */
function frameQueue(s: ProbeState, node: string): string[] {
  return prereqsOf(node)
    .filter(p => NODE_BY_ID[p] && !s.passed.includes(p))
    .sort((a, b) => depth(b) - depth(a))
}

/** Resolve completed frames: descend into known-failed prereqs; when a frame's queue empties, its
 *  node is a ROOT (all prereqs passed) → record it and end that entry's investigation. Mutates s. */
function normalize(s: ProbeState): void {
  let guard = 0
  while (s.frames.length && guard++ < 500) {
    const top = s.frames[s.frames.length - 1]
    // drop already-passed prereqs
    while (top.queue.length && s.passed.includes(top.queue[0])) top.queue.shift()
    // descend into an already-failed prereq without re-probing
    const failedIdx = top.queue.findIndex(p => s.failed.includes(p))
    if (failedIdx >= 0) {
      const p = top.queue.splice(failedIdx, 1)[0]
      s.frames.push({ node: p, queue: frameQueue(s, p) })
      continue
    }
    if (top.queue.length === 0) {
      // all prerequisites pass → `top.node` is the deepest broken skill on this branch = a root
      if (!s.roots.includes(top.node)) s.roots.push(top.node)
      s.frames.length = 0   // this entry is diagnosed; move on
      s.agenda.shift()
      continue
    }
    break // need to probe top.queue[0]
  }
  // Skip entry skills we've already probed (e.g. reached as a prereq of an earlier entry) — don't
  // re-investigate them or waste the failure budget.
  if (!s.frames.length) while (s.agenda.length && seen(s, s.agenda[0])) s.agenda.shift()
}

export function startProbe(band: Band, config: ProbeConfig = DEFAULT_CONFIG[band]): ProbeState {
  return { band, config, agenda: [...PROBE_ENTRY[band]], frames: [], passed: [], failed: [], asked: [], roots: [] }
}

/** The next skill to probe, or null when the probe is done (caps hit or nothing left). */
export function nextSkill(s: ProbeState): string | null {
  if (s.asked.length >= s.config.maxItems) return null
  if (s.failed.length >= s.config.maxFailures) return null   // safety backstop
  normalize(s)
  if (s.frames.length) return s.frames[s.frames.length - 1].queue[0] ?? null
  if (s.agenda.length) return s.agenda[0]
  return null
}

/** Record a probe result; returns a new state. */
export function record(s: ProbeState, id: string, passed: boolean): ProbeState {
  const ns: ProbeState = {
    ...s,
    agenda: s.agenda.slice(),
    frames: s.frames.map(f => ({ node: f.node, queue: f.queue.slice() })),
    passed: s.passed.slice(), failed: s.failed.slice(), asked: [...s.asked, id], roots: s.roots.slice(),
  }
  if (ns.frames.length === 0) {
    // entry probe
    if (id === ns.agenda[0]) ns.agenda.shift()
    if (passed) ns.passed.push(id)
    else { ns.failed.push(id); ns.frames.push({ node: id, queue: frameQueue(ns, id) }) }
  } else {
    // prerequisite probe under the active frame
    const top = ns.frames[ns.frames.length - 1]
    const i = top.queue.indexOf(id)
    if (i >= 0) top.queue.splice(i, 1)
    if (passed) ns.passed.push(id)
    else { ns.failed.push(id); ns.frames.push({ node: id, queue: frameQueue(ns, id) }) }
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

  const planSkills = [...s.failed].sort((a, b) => depth(a) - depth(b))
  const planChapters: string[] = []
  for (const sk of planSkills) { const ch = chapterFor(sk); if (ch && !planChapters.includes(ch)) planChapters.push(ch) }

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
  }
}

/** Convenience for tests / headless runs: drive the whole probe with an answer oracle. */
export function runProbe(band: Band, answer: (skillId: string) => boolean, config?: ProbeConfig): { state: ProbeState; result: Diagnosis } {
  let s = startProbe(band, config)
  let id: string | null
  while ((id = nextSkill(s)) !== null) s = record(s, id, answer(id))
  return { state: s, result: diagnose(s) }
}

/** Transitive prerequisite closure of a skill (tests use it to simulate a realistic learner). */
export function prereqClosure(id: string): Set<string> {
  const out = new Set<string>()
  const walk = (x: string) => prereqsOf(x).forEach(p => { if (!out.has(p)) { out.add(p); walk(p) } })
  walk(id)
  return out
}
