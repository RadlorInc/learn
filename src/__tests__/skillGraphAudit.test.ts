/**
 * SKILL GRAPH — the structural half of the audit, pinned so the graph cannot quietly get worse.
 *
 * Companion: [docs/skill-graph-audit.md](../../docs/skill-graph-audit.md), which ranks all 130
 * prerequisite edges by what a WRONG one would cost, and cuts the teacher's checklist from 130 to
 * twelve. That ranking is expensive to compute (~25s) so it lives behind a flag at the bottom of
 * this file rather than in every run:
 *
 *     GRAPH_SENSITIVITY=1 npx vitest run src/__tests__/skillGraphAudit.test.ts
 *
 * ⚠️⚠️ NEITHER HALF CAN SEE A **MISSING** EDGE. Both test the claims that are written down, and a
 * graph is built by writing down what somebody thought of — so the omissions are by definition the
 * things nobody thought of. That is why the audit doc's §3 is opinion and §4.3 is a list of
 * questions rather than assertions. `e.subWithin10` below is the shape of it: a real skill, wired
 * to nothing.
 */
import { describe, it, expect } from 'vitest'
import { SKILL_NODES, NODE_BY_ID, PROBE_ENTRY, prereqsOf, dependentsOf, blockedBy, type Band } from '@/core/skillGraph'
import { makeItem, makeReadinessItem } from '@/core/diagnosticItems'
import { runProbe, prereqClosure } from '@/core/diagnosticEngine'

const ORDER: Band[] = ['3-5', '6-8', '9-11', '12-14', '15-16', '17-18']
const bandOf = (id: string) => ORDER.indexOf(NODE_BY_ID[id].band)
const isEntry = (id: string) => Object.values(PROBE_ENTRY).some(l => l.includes(id))
const closure = (id: string) => { const o = new Set<string>(); const w = (x: string) => prereqsOf(x).forEach(p => { if (!o.has(p)) { o.add(p); w(p) } }); w(id); return o }

describe('skill graph · shape', () => {
  it('is acyclic and every prerequisite id exists', () => {
    const dangling: string[] = []
    for (const n of SKILL_NODES) for (const p of n.prereqs) if (!NODE_BY_ID[p]) dangling.push(`${n.id} ← ${p}`)
    expect(dangling, 'a prerequisite names a skill that does not exist').toEqual([])
    // a cycle would make `closure` never terminate for the node inside it
    const cyclic = SKILL_NODES.filter(n => closure(n.id).has(n.id)).map(n => n.id)
    expect(cyclic, 'a skill is its own (transitive) prerequisite').toEqual([])
  })

  it('no prerequisite points UPWARD to a later band', () => {
    const wrongWay: string[] = []
    for (const n of SKILL_NODES) for (const p of n.prereqs) if (bandOf(p) > bandOf(n.id)) wrongWay.push(`${n.id}[${n.band}] ← ${p}[${NODE_BY_ID[p].band}]`)
    expect(wrongWay).toEqual([])
  })

  /** ⚠️ Pinned EXACTLY, not as a floor. A node nothing depends on, no probe enters and no item can
   *  ask about is invisible to the whole product — it exists only in the file. There is exactly one
   *  today and it is the single non-mathematics node in a mathematics prerequisite graph. */
  it('exactly one node is inert, and it is the colours one', () => {
    const inert = SKILL_NODES
      .filter(n => dependentsOf(n.id).length === 0 && !isEntry(n.id) && !makeItem(n.id) && !makeReadinessItem(n.id))
      .map(n => n.id)
    expect(inert).toEqual(['e.colors'])
  })

  /**
   * ⚠️⚠️ A REAL SKILL WIRED TO NOTHING — the audit's top suspected OMISSION, pinned so that fixing
   * it is a deliberate act rather than a surprise. `e.subWithin10` (take away within ten) is
   * nobody's prerequisite, while `p.subTo100` (subtract within 100) claims only `p.addTo100` —
   * i.e. the graph says subtracting two-digit numbers requires ADDING them, and does not require
   * taking away at all. That edge carries 12 of 201 diagnoses, the second-highest in the graph.
   * If a teacher agrees, the fix is `p.subTo100 ← [p.placeValue2, e.subWithin10]` and this test
   * changes with it.
   */
  it('records the suspected missing edge under subtraction', () => {
    expect(dependentsOf('e.subWithin10'), 'e.subWithin10 has been wired up — update the audit').toEqual([])
    expect(prereqsOf('p.subTo100'), 'p.subTo100 has been re-wired — update the audit').toEqual(['p.addTo100'])
  })

  /** ⚠️ A node with ONE prerequisite is a node claiming that is the ONLY thing a stuck child could
   *  be missing. That is the omission question, and it is where the graph is most likely to be
   *  incomplete — 20 nodes make it today. Pinned as a count so a new one is noticed rather than
   *  drifting in. */
  it('twenty nodes rest on a single claim', () => {
    const single = SKILL_NODES.filter(n => n.prereqs.length === 1).map(n => n.id)
    expect(single.length, `single-claim nodes changed: ${single.join(', ')}`).toBe(20)
  })

  /** Where deep diagnoses bottom out. An edge touching one of these is worth more scrutiny than its
   *  raw sensitivity score suggests, because the search ends there. */
  it('the load-bearing nodes are the ones the audit names', () => {
    const top = SKILL_NODES.map(n => [n.id, blockedBy(n.id).length] as [string, number])
      .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id)
    expect(top).toEqual(['e.counting10', 'p.numbersTo100', 'p.placeValue2'])
    expect(blockedBy('e.counting10').length, 'counting to ten blocks nearly the whole graph').toBeGreaterThanOrEqual(65)
  })

  it('every band skip is one the audit knows about', () => {
    const skips = SKILL_NODES
      .filter(n => n.prereqs.length && bandOf(n.id) - Math.max(...n.prereqs.map(bandOf)) >= 2)
      .map(n => n.id)
    expect(skips.sort()).toEqual(['c.statsInference', 'm.integers'])
  })
})

/**
 * THE RANKING ITSELF — off by default because it re-runs every diagnosis once per edge (~25s).
 *
 * For each edge: remove it, re-run all plantable gaps across the five child bands with a PERFECT
 * answerer (which isolates the graph's contribution from the items' noise), and count how many
 * diagnoses change. `roots` is the damage that matters — a different gap is a different 6-week plan.
 */
describe.runIf(process.env.GRAPH_SENSITIVITY)('skill graph · edge sensitivity', () => {
  it('ranks every edge by what a wrong one would cost', { timeout: 600_000 }, () => {
    const BANDS: Band[] = ['6-8', '9-11', '12-14', '15-16', '17-18']
    const diagnoses = () => {
      const out: Record<string, string> = {}
      for (const band of BANDS) {
        const reach = new Set<string>()
        for (const e of PROBE_ENTRY[band]) { reach.add(e); prereqClosure(e).forEach(x => reach.add(x)) }
        for (const root of reach) {
          const broken = new Set([root, ...blockedBy(root)])
          const { result } = runProbe(band, sk => !broken.has(sk))
          out[`${band}|${root}`] = `${result.rootGap}|${result.planChapters.join(',')}`
        }
      }
      return out
    }
    const base = diagnoses()
    const rows: [string, number, number][] = []
    for (const node of SKILL_NODES) for (const p of [...node.prereqs]) {
      const keep = [...node.prereqs]
      node.prereqs = node.prereqs.filter(x => x !== p)
      const alt = diagnoses()
      node.prereqs = keep
      let routes = 0, roots = 0
      for (const k of Object.keys(base)) {
        const a = alt[k]
        // missing key = removing the edge made that skill unreachable: the strongest sensitivity
        if (a === undefined) { routes++; roots++; continue }
        if (base[k] !== a) { routes++; if (base[k].split('|')[0] !== a.split('|')[0]) roots++ }
      }
      rows.push([`${node.id} ← ${p}`, roots, routes])
    }
    rows.sort((a, b) => b[1] - a[1] || b[2] - a[2])
    console.log(`EDGE SENSITIVITY — ${Object.keys(base).length} planted gaps, ${rows.length} edges\n` +
      rows.map(([e, r, c]) => `${String(r).padStart(3)} roots | ${String(c).padStart(3)} routes | ${e}`).join('\n'))
    expect(rows.length).toBeGreaterThan(100)
  })
})
