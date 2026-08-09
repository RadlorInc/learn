/**
 * The gate for THE EMPTY PLOT (9–11 `areaPerimeter`) — the band's first-person 3D chapter.
 *
 * It drives the SAME exported functions the scene renders and grades from — `makeRound`, `gradePeg`,
 * `missFor`, `settleAfterPeg`, `slotsFor`, `equationFor`, `explainBeats`, `makeSite`,
 * `plotSiteSeparation` — rather than re-implementing them, because a check carrying its own copy of a
 * rule cannot see the rule being removed. That is this repo's own recorded fault, met twice.
 *
 * ⚠️ THIS FILE MATTERS MORE THAN A NORMAL CHAPTER GATE, and the reason is measured, not stylistic:
 * `useFrame` is not reliably drivable in a backgrounded tab (`document.hidden` true with 0 rAF frames
 * per second was measured in this pane), so **a walking loop cannot be played headlessly**. Cut ③ of
 * this chapter reached its peg loop exactly once, opportunistically, and was never played end to end.
 * Everything below is therefore the only mechanical evidence the chapter has, and anything left inside
 * the scene component has none.
 *
 * ⚠️ THE CHECKS THIS FILE EXISTS FOR, because none is reachable by playing:
 *   • **the commit is not repeatable in a scored round.** Three mechanics were rejected before this
 *     one, and a repeatable graded commit was why two of them failed: peg, read "too near", step back,
 *     peg again, and a dozen tiles falls out of about four guesses with nothing worked out.
 *   • **nothing states the answer before the commit** — swept over the whole generator range, on every
 *     string a child can see while deciding.
 *   • **the world contains no countable set.** Procedural scatter is exactly the thing that
 *     accidentally produces a ruler, and a metre grid on the plot floor is what got an earlier cut
 *     rejected: the answer chalked onto the ground as squares to count.
 */
import { describe, it, expect } from 'vitest'
import {
  TIERS, stepsFor, makeRound, gradePeg, missFor, settleAfterPeg, slotsFor, slotPos,
  equationFor, explainBeats, miloSpot, MILO_CLEAR, DEMO, GUIDED, MAX_DEPTH, SPAWN_Z, type PlotRound, type QType,
} from '@/features/chapters/story/plotMaths'
import { makeSite, groundMesh, GROUND_MICRO, plotSiteSeparation, readsAgainst, hueGap, UNIT, UNIT_OUTLINE, REVEAL, css } from '@/features/chapters/story/plotSite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const TIER_LIST = [1, 2, 3] as const
const draws = (d: 1 | 2 | 3, n = 500, asked: readonly string[] = ['area', 'perimeter']) =>
  Array.from({ length: n }, (_, i) => makeRound(d, i, asked))
/** Every round the generator can produce, exhaustively — the honest sweep for a space this small. */
const ALL: PlotRound[] = TIER_LIST.flatMap(d =>
  (['area', 'perimeter'] as QType[]).flatMap(q => {
    const t = TIERS[d]
    const out: PlotRound[] = []
    for (let f = t.frontage[0]; f <= t.frontage[1]; f++) {
      for (let dep = t.depth[0]; dep <= t.depth[1]; dep++) {
        out.push({
          qType: q, frontage: f, depth: dep,
          target: q === 'area' ? f * dep : 2 * (f + dep),
          unitWord: q === 'area' ? 'tiles' : 'metres of fence', tag: '', prompt: '', say: '', seed: f * 31 + dep,
        })
      }
    }
    return out
  }))

const SCENE = readFileSync(join(process.cwd(), 'src/features/chapters/story/FloorPlot.tsx'), 'utf8')
/** Eye height, read from the scene rather than retyped, so the two cannot drift. */
const EYE_M = Number(SCENE.match(/^const EYE = ([\d.]+)$/m)![1])
/** Comments stripped: this repo has twice had a source check match the prose EXPLAINING a rule. */
const CODE = SCENE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

// ────────────────────────────────────────────────────────────────────────────────────────
describe('the question always comes out to a whole metre', () => {
  it('never asks for a depth that is not a whole number of metres', () => {
    for (const d of draws(1).concat(draws(2), draws(3))) {
      expect(Number.isInteger(d.depth)).toBe(true)
      expect(d.depth).toBeGreaterThanOrEqual(1)
      // The answer is derivable from the two GIVENS and nothing else, exactly.
      const derived = d.qType === 'area' ? d.target / d.frontage : d.target / 2 - d.frontage
      expect(derived).toBe(d.depth)
    }
  })

  it('a perimeter target is always even, so halving it is whole', () => {
    for (const d of ALL.filter(r => r.qType === 'perimeter')) expect(d.target % 2).toBe(0)
  })

  it('every answer is reachable — inside the walkable bound', () => {
    for (const d of ALL) expect(d.depth).toBeLessThanOrEqual(MAX_DEPTH)
    // and the bound is one metre past the deepest legal peg, so the peg is never on the fence
    const deepest = Math.max(...ALL.map(d => d.depth))
    expect(MAX_DEPTH).toBeGreaterThan(deepest)
  })

  it('the delivery is exactly the target — the units cannot lie about the quantity', () => {
    for (const d of ALL) expect(slotsFor(d)).toHaveLength(d.target)
  })

  it('every unit lands inside the plot the child pegged', () => {
    for (const d of ALL) {
      for (const s of slotsFor(d)) {
        const [x, , z] = slotPos(d, s)
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(d.frontage)
        expect(z).toBeGreaterThanOrEqual(0)
        expect(z).toBeLessThanOrEqual(d.depth)
      }
    }
  })
})

// ────────────────────────────────────────────────────────────────────────────────────────
describe('difficulty grows the SKILL, not only the magnitude', () => {
  /**
   * ⚠️ This is the one line of the pedagogy contract cut ③ FAILED: it drew both sides from one
   * widening range, so a harder tier meant bigger numbers and nothing else. The taught thing is a
   * DIVISION and what makes a division hard is the DIVISOR, so the divisor is an explicit tier term.
   */
  it('the DIVISOR climbs — the explicit taught term', () => {
    expect(TIERS[1].frontage[1]).toBeLessThan(TIERS[3].frontage[0] + 1)
    for (const [lo, hi] of [[1, 2], [2, 3]] as const) {
      expect(TIERS[lo].frontage[0]).toBeLessThanOrEqual(TIERS[hi].frontage[0])
      expect(TIERS[lo].frontage[1]).toBeLessThan(TIERS[hi].frontage[1])
    }
  })

  it('L1 never asks a division outside a nine-year-old’s tables', () => {
    for (const d of draws(1)) expect(d.frontage).toBeLessThanOrEqual(4)
  })

  it('L3 does ask the hard divisors', () => {
    expect(draws(3, 800).some(d => d.frontage >= 7)).toBe(true)
  })

  it('the magnitude climbs too', () => {
    const mean = (d: 1 | 2 | 3) => draws(d, 900).reduce((s, r) => s + r.target, 0) / 900
    expect(mean(1)).toBeLessThan(mean(2))
    expect(mean(2)).toBeLessThan(mean(3))
  })

  it('a perimeter round costs two steps of arithmetic and an area round one', () => {
    expect(stepsFor('area')).toBe(1)
    expect(stepsFor('perimeter')).toBe(2)
  })
})

// ────────────────────────────────────────────────────────────────────────────────────────
describe('ONE PEG per scored round — a repeatable commit is a yes/no oracle', () => {
  const d = ALL.find(r => r.qType === 'area' && r.depth === 4)!

  it('a scored round is over after the first peg, right', () => {
    const s = settleAfterPeg('practice', d.depth, d)
    expect(s).toEqual({ right: true, over: true })
  })

  it('a scored round is over after the first peg, WRONG — this is the whole design', () => {
    for (const wrong of [1, 2, 3, 5, 9, 12]) {
      if (wrong === d.depth) continue
      const s = settleAfterPeg('practice', wrong, d)
      expect(s.right).toBe(false)
      expect(s.over).toBe(true)
    }
  })

  it('the guided round keeps its retry — it is unscored teaching', () => {
    const s = settleAfterPeg('guided', d.depth + 2, d)
    expect(s).toEqual({ right: false, over: false })
  })

  it('a guided round still ends when it is right', () => {
    expect(settleAfterPeg('guided', d.depth, d).over).toBe(true)
  })

  it('the grader accepts exactly one place, at every round the generator can draw', () => {
    for (const r of ALL) {
      expect(gradePeg(r, r.depth)).toBe(true)
      for (let p = 1; p <= MAX_DEPTH; p++) if (p !== r.depth) expect(gradePeg(r, p)).toBe(false)
    }
  })

  it('the scene commits through settleAfterPeg, not its own copy of the rule', () => {
    expect(CODE).toMatch(/settleAfterPeg\(\s*mode\s*,/)
    // and a settled round takes the peg control off screen, so a dead live-looking button is
    // not expressible (FitOut's dead board)
    expect(CODE).toMatch(/const live = !over && pegged === null/)
    expect(CODE).toMatch(/\{live && \(/)
  })
})

// ────────────────────────────────────────────────────────────────────────────────────────
describe('nothing states the answer before the commit', () => {
  /**
   * The child is asked to produce the DEPTH. Every string on screen before the peg — the prompt, the
   * spoken line, and the two givens — is swept for it, over the whole generator range.
   */
  it('no pre-commit string contains the depth', () => {
    for (const d of draws(1, 300).concat(draws(2, 300), draws(3, 300))) {
      const shown = `${d.prompt} ${d.say}`
      // the two givens may appear; the depth may not
      const nums = shown.match(/\d+/g)?.map(Number) ?? []
      for (const n of nums) expect([d.frontage, d.target]).toContain(n)
      expect(nums).not.toContain(d.depth === d.frontage || d.depth === d.target ? -1 : d.depth)
    }
  })

  it('the equation is never in a pre-commit string', () => {
    for (const d of draws(1, 200).concat(draws(2, 200), draws(3, 200))) {
      expect(d.prompt).not.toContain('×')
      expect(d.prompt).not.toContain('=')
      expect(d.say).not.toContain('×')
      expect(d.say).not.toContain('=')
    }
  })

  it('the equation is rendered only when the peg is right', () => {
    // one place, gated on `revealed` — never beside the manipulative
    expect(CODE).toMatch(/equation=\{revealed \? equationFor\(data\) : null\}/)
    expect(CODE.match(/equationFor\(data\)/g)?.length).toBeLessThanOrEqual(3)
  })

  it('the readout is the child’s own pacing and is labelled as such', () => {
    expect(CODE).toMatch(/'metre back' : 'metres back'/)
    // it is fed `depth` — metres walked — and never the target or a product
    expect(CODE).toMatch(/<Tape n=\{depth\}/)
    expect(CODE).not.toMatch(/<Tape n=\{[^}]*target/)
  })

  it('the plot floor is never subdivided — no grid on the working surface', () => {
    // The fault that got an earlier cut rejected: `repeat.set(w, h)` chalked the answer onto the
    // ground as exactly as many countable squares as the answer.
    expect(CODE).not.toMatch(/\.repeat\.set/)
    expect(CODE).not.toMatch(/RepeatWrapping/)
    expect(CODE).not.toMatch(/gridHelper/i)
  })

  it('and no grid can be DRAWN either — nothing is rendered per-metre before the peg', () => {
    /**
     * ⚠️ Mutation testing found this hole and it is the one that matters most, because a grid does not
     * have to arrive as a texture. A nested loop of 1-metre planes is the same printed answer, and the
     * three idioms above cannot see it. Two checks that can:
     *   • the scene builds NO list sized from the plot's own dimensions. `slotsFor` is the only
     *     producer of per-unit positions, it is pure, and it is gated on the peg.
     *   • no flat surface in the scene is anywhere near a metre across. The yard is 120, the road 80;
     *     a chalked grid cell would be about 1.
     */
    expect(CODE).not.toMatch(/Array\.from\(\s*\{\s*length/)
    expect(CODE).not.toMatch(/\[\s*\.\.\.\s*Array\(/)
    expect(CODE).not.toMatch(/for\s*\(/)
    for (const m of CODE.matchAll(/<planeGeometry args=\{\[([\d.]+),\s*([\d.]+)\]\}/g)) {
      expect(Number(m[1])).toBeGreaterThan(3)
      expect(Number(m[2])).toBeGreaterThan(3)
    }
  })

  it('the units exist only AFTER the peg — the yard is bare while the child decides', () => {
    // `laid` is the scene's only unit list, and it is empty until the child commits
    expect(CODE).toMatch(/if \(pegged === null\) return new Set<string>\(\)/)
    // the demo's own copy is gated the same way, on its beat's `laid` flag
    expect(CODE).toMatch(/cur\.laid \? new Set\(slotsFor\(data\)\) : new Set<string>\(\)/)
    // and slotsFor is the only producer of per-unit positions
    expect(CODE.match(/slotsFor\(/g)?.length).toBeLessThanOrEqual(2)
  })
})

// ────────────────────────────────────────────────────────────────────────────────────────
describe('two honest readings, and coverage forces both', () => {
  it('both readings are drawn', () => {
    const kinds = new Set(draws(2, 400, []).map(d => d.qType))
    expect(kinds).toEqual(new Set(['area', 'perimeter']))
  })

  it('an unmet reading is spent DELIBERATELY while a gap exists', () => {
    // mastery fires after ~3 rounds at L1, ONE at L2 and TWO at L3, so a coin flip misses one
    // reading about a third of the time
    for (let i = 0; i < 40; i++) expect(makeRound(1, i, ['area']).qType).toBe('perimeter')
    for (let i = 0; i < 40; i++) expect(makeRound(1, i, ['perimeter']).qType).toBe('area')
  })

  it('and RANDOMLY once the gap closes — hardest-first for ever would destroy the variety', () => {
    const kinds = new Set(Array.from({ length: 200 }, (_, i) => makeRound(3, i, ['area', 'perimeter']).qType))
    expect(kinds.size).toBe(2)
  })

  it('the beat DECLARES coverage over both readings', () => {
    expect(CODE).toMatch(/coverage:\s*\{\s*of:\s*d\s*=>\s*d\.qType,\s*all:\s*\['area',\s*'perimeter'\]\s*\}/)
  })

  it('and BOTH call sites are wired — a check that re-implements the engine cannot see the wiring go', () => {
    // `asked` must reach the generator, or the declaration withholds the exit for ever and the
    // generator picks from empty (TickTock's planted regression). `round` must reach it too, or every
    // round is seeded the same and the world stops changing.
    const makeLine = CODE.split('\n').find(l => l.includes('make:'))!
    expect(makeLine).toContain('makeRound(')
    expect(makeLine).toMatch(/\bround\b/)
    expect(makeLine).toMatch(/\basked\b/)
  })

  it('the two readings ask genuinely different arithmetic off one gesture', () => {
    const a = ALL.find(r => r.qType === 'area' && r.frontage === 4 && r.depth === 3)!
    const p = ALL.find(r => r.qType === 'perimeter' && r.frontage === 4 && r.depth === 3)!
    expect(a.target).toBe(12)
    expect(p.target).toBe(14)
    // same frontage, same depth, different given — so neither can be eliminated into
    expect(a.target).not.toBe(p.target)
  })
})

// ────────────────────────────────────────────────────────────────────────────────────────
describe('the miss line names the WORK, never the number', () => {
  it('never contains the depth, the target or the frontage', () => {
    for (const d of ALL) {
      for (const pegged of [1, d.depth - 1, d.depth + 1, MAX_DEPTH].filter(p => p >= 1 && p !== d.depth)) {
        const m = missFor(d, pegged)
        expect(m).not.toMatch(/\d/)          // no numeral of any kind
        expect(m).not.toMatch(/[×÷=]/)       // and never restates the arithmetic
        expect(m.length).toBeGreaterThan(20) // it says something specific, not "not quite"
      }
    }
  })

  it('says something DIFFERENT for too near and too far — it is about their work', () => {
    for (const d of ALL.filter(r => r.depth > 2)) {
      expect(missFor(d, d.depth - 1)).not.toBe(missFor(d, d.depth + 1))
    }
  })

  it('and a different thing again for the two readings', () => {
    const a = ALL.find(r => r.qType === 'area' && r.depth === 4)!
    const p = ALL.find(r => r.qType === 'perimeter' && r.depth === 4)!
    expect(missFor(a, 2)).not.toBe(missFor(p, 2))
  })

  it('the chapter owns its feedback, so the shared pill does not land on the thing being read', () => {
    expect(CODE).toMatch(/ownsFeedback:\s*true/)
  })

  it('everything spoken on a miss is also written', () => {
    // `setLine(miss)` beside `speak(miss)` — a tap that produces only sound is silence
    expect(CODE).toMatch(/setLine\(miss\)/)
    expect(CODE).toMatch(/speak\(miss\)/)
  })
})

// ────────────────────────────────────────────────────────────────────────────────────────
describe('the demo teaches the working, and its numbers agree with its own sentences', () => {
  /**
   * ⚠️ The Supply Run shipped a beat that SAID the remainder stayed behind while the picture put it in
   * a van — every line individually true, and nothing could see it because the beats were
   * component-local. These are exported, so the gate drives the list the demo plays.
   */
  const cases = [...DEMO, GUIDED, ...ALL.slice(0, 60)]

  it('states the arithmetic out loud, and the metre count matches it', () => {
    for (const d of cases) {
      const beats = explainBeats(d)
      const work = beats[2].say
      expect(work).toContain(String(d.depth))       // the working lands on the answer
      const walk = beats[3]
      expect(walk.depth).toBe(d.depth)              // and the walk goes exactly that far
      expect(walk.say).toContain(String(d.depth))
    }
  })

  it('the peg lands where the working said, and the units are laid only after it', () => {
    for (const d of cases) {
      const beats = explainBeats(d)
      expect(beats.filter(b => b.laid)).toHaveLength(1)
      const lay = beats[beats.length - 1]
      expect(lay.laid).toBe(true)
      expect(lay.pegged).toBe(d.depth)
      // and every earlier beat has laid nothing and pegged nothing until the peg beat
      expect(beats.slice(0, 4).every(b => !b.laid && b.pegged === null)).toBe(true)
    }
  })

  it('the equation appears in the LAST beat only', () => {
    for (const d of cases) {
      const beats = explainBeats(d)
      const eq = equationFor(d).replace('×', 'times').replace('+', 'plus')
      expect(beats[beats.length - 1].say).toContain(eq)
      expect(beats.slice(0, -1).some(b => b.say.includes(eq))).toBe(false)
    }
  })

  it('the perimeter demo teaches the two-step, not a division', () => {
    const p = DEMO.find(d => d.qType === 'perimeter')!
    const work = explainBeats(p)[2].say
    expect(work).toContain(String(p.frontage * 2))              // halve-then-subtract, stated
    expect(work).toContain(String(p.target - p.frontage * 2))
    expect(work).not.toContain('divided by')
  })

  it('the side view is off the LEFT, or the foreman sits in the lens', () => {
    for (const d of cases) {
      for (const b of explainBeats(d).filter(x => x.view === 'side')) expect(b.pegged).toBe(d.depth)
    }
    // off the LEFT (negative x) and RAISED above eye height, so the laid floor can be counted;
    // asserted as properties rather than as literal coordinates, which is a test that breaks on tuning
    const side = CODE.match(/cur\.view === 'side' \? \[(-?[\d.]+),\s*([\d.]+),/)!
    expect(Number(side[1])).toBeLessThan(0)
    expect(Number(side[2])).toBeGreaterThan(EYE_M)
  })

  it('THE CAMERA SHOWS WHAT WAS BUILT ON THE COMMIT — or the consequence is invisible', () => {
    /**
     * ⚠️ Found by driving it, and it is the chapter's central claim failing silently. The child pegs
     * FACING AWAY from the road, so everything the delivery lays is behind them: a wrong peg read
     * *"Too far back … part of it would be bare"* over an empty green field. The tiles, the bare strip
     * and the leftovers were all off-screen, on every round, right and wrong.
     */
    expect(CODE).toMatch(/const reviewCam = useMemo/)
    expect(CODE).toMatch(/pegged === null \? null :/)
    // and it is wired into the scene, not merely computed
    expect(CODE).toMatch(/demoCam=\{reviewCam\}/)
    // releasing it must restore the child's stance, or a guided retry resumes outside the yard
    expect(CODE).toMatch(/demoCam === null/)
  })

  it('the demo opens on the road, looking down the empty yard', () => {
    for (const d of cases) {
      expect(explainBeats(d)[0].view).toBe('road')
      expect(explainBeats(d)[0].camZ).toBe(SPAWN_Z)
      expect(explainBeats(d)[0].depth).toBe(0)
    }
    expect(SPAWN_Z).toBeLessThan(0)   // behind the frontage line, on the road
  })

  it('the demo is self-paced, not driven off utterance events', () => {
    // a device with no voice would otherwise freeze the teaching mid-beat (TickTock's lesson hang)
    expect(CODE).toMatch(/fallbackStepMs:/)
    expect(CODE).toMatch(/speakSteps\(/)
  })

  it('the two demos teach one reading each, before anything is scored', () => {
    expect(new Set(DEMO.map(d => d.qType))).toEqual(new Set(['area', 'perimeter']))
    for (const d of DEMO.concat(GUIDED)) {
      const derived = d.qType === 'area' ? d.target / d.frontage : d.target / 2 - d.frontage
      expect(derived).toBe(d.depth)   // the fixed rounds are honest too
    }
  })
})

// ────────────────────────────────────────────────────────────────────────────────────────
describe('the world is generated in code, and NOTHING in it is countable', () => {
  const SEEDS = Array.from({ length: 400 }, (_, i) => i + 1)
  const FRONTAGES = [2, 4, 6, 9]

  it('is deterministic for a seed', () => {
    for (const s of [1, 7, 23, 400]) {
      expect(JSON.stringify(makeSite(s, 4))).toBe(JSON.stringify(makeSite(s, 4)))
    }
  })

  it('never calls Math.random at render time', () => {
    const site = readFileSync(join(process.cwd(), 'src/features/chapters/story/plotSite.ts'), 'utf8')
    expect(site.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/Math\.random/)
    expect(CODE).not.toMatch(/Math\.random/)
  })

  it('consecutive rounds are a different place — the scene changes across the run', () => {
    for (let r = 1; r < 12; r++) expect(makeSite(r, 4).name).not.toBe(makeSite(r + 1, 4).name)
  })

  it('and the whole run uses more than one setting', () => {
    expect(new Set(SEEDS.slice(0, 10).map(s => makeSite(s, 4).name)).size).toBeGreaterThan(2)
  })

  it('NO PROP SIZE IS REPEATED — a repeated unit-sized object is not expressible', () => {
    for (const s of SEEDS) for (const f of FRONTAGES) {
      const fp = makeSite(s, f).props.map(p => `${p.w}x${p.d}`)
      expect(new Set(fp).size).toBe(fp.length)
    }
  })

  /**
   * ⚠️ THE ROAD IS A QUARTER OF EVERY OPENING FRAME AND IT HAS GONE DARK TWICE. The child spawns ON it
   * at SPAWN_Z = −3.4, so it necessarily fills the bottom of the shot; at a 25.5° sun a low lightness
   * renders it near-black, and a black band across the bottom quarter reads as a hole in the world
   * rather than as tarmac. It was reasoned up to 0.62 once, the note was written, and the code then
   * came back at 0.40 in a later pass with the comment still claiming the fix. Pinned here so the
   * third time fails a test instead of shipping.
   */
  it('the road is never a dark band — it is a quarter of the opening frame', () => {
    for (const s of SEEDS) for (const f of FRONTAGES) {
      expect(makeSite(s, f).road.l).toBeGreaterThan(0.5)
    }
  })

  it('no prop is anywhere near one metre — nothing reads as a unit', () => {
    for (const s of SEEDS) for (const f of FRONTAGES) {
      const site = makeSite(s, f)
      for (const p of [...site.props, ...site.trees, ...site.skyline]) {
        expect(Math.abs(p.w - 1)).toBeGreaterThan(0.35)
      }
    }
  })

  it('nothing sits on an integer metre — a prop can never coincide with a pace mark', () => {
    for (const s of SEEDS) for (const f of FRONTAGES) {
      const site = makeSite(s, f)
      for (const p of [...site.props, ...site.trees, ...site.skyline]) {
        for (const v of [p.x, p.z]) {
          const frac = v - Math.floor(v)
          expect(frac).toBeGreaterThan(0.15)
          expect(frac).toBeLessThan(0.85)
        }
      }
    }
  })

  it('NO THREE PROPS COLLINEAR AND EQUALLY SPACED — procedural scatter’s own trap', () => {
    for (const s of SEEDS) for (const f of FRONTAGES) {
      const site = makeSite(s, f)
      const ps = [...site.props, ...site.trees]
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) for (let k = j + 1; k < ps.length; k++) {
        const [a, b, c] = [ps[i], ps[j], ps[k]]
        const cross = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)
        const collinear = Math.abs(cross) < 0.5
        if (!collinear) continue
        const g1 = Math.hypot(b.x - a.x, b.z - a.z)
        const g2 = Math.hypot(c.x - b.x, c.z - b.z)
        expect(Math.abs(g1 - g2)).toBeGreaterThan(0.35)
      }
    }
  })

  /**
   * ⚠️ THE GROUND IS REAL GEOMETRY NOW, AND THAT IS NEW PEDAGOGY SURFACE. It used to be a single flat
   * quad, which could not be a ruler however it was lit. A tessellated, displaced sheet CAN be: a
   * regular lattice at a whole-metre pitch is a grid chalked onto the working surface by another
   * route, and relief inside the plot would give the child a landmark to pace against instead of
   * dividing. Both are the exact fault that got an earlier cut rejected, arriving through a door the
   * old checks did not cover — so the guarantees are asserted on the ACTUAL vertex data.
   */
  it('the ground lattice has no metre-scale period — it cannot be paced', () => {
    const gm = groundMesh(4, 7, 4 + 5, SPAWN_Z - 4, MAX_DEPTH + 1 - 4)
    // the cell is nowhere near a pace, in either direction
    expect(gm.cell).toBeGreaterThan(3)
    expect(Math.abs(gm.cell - Math.round(gm.cell))).toBeGreaterThan(0.15)   // and not a whole number
  })

  it('no two interior ground vertices sit on a shared lattice — there is no grid to read', () => {
    const gm = groundMesh(4, 7, 4 + 5, SPAWN_Z - 4, MAX_DEPTH + 1 - 4)
    // every interior vertex is jittered, so the x values must NOT collapse to a small set of columns
    const xs = new Set<number>()
    for (let i = 0; i < gm.pos.length; i += 3) xs.add(Math.round(gm.pos[i] * 100) / 100)
    // a clean lattice would give ~33 distinct x values; a jittered one gives hundreds
    expect(xs.size).toBeGreaterThan(300)
  })

  /**
   * ⚠️ THIS USED TO DEMAND |y| < 1e-6 ACROSS THE WHOLE WALKABLE BOX, AND THAT WAS THE ASSERTION KEEPING
   * THE YARD LOOKING LIKE A SHEET OF PAPER. The walkable box is ±(frontage/2 + 5) by 17 m — essentially
   * every ground pixel on screen — so pinning it to exactly zero gave every facet in frame the same
   * normal and the same lighting value, which is the thing three separate visual passes were trying to
   * fix from the other end.
   *
   * The invariants that actually matter are narrower than "y is zero", and both are still pinned:
   *   • the PLOT is dead flat, because tiles are laid flush on it, and
   *   • nothing anywhere is a slope a child could pace against or that could clip a fixed eye height.
   * Relief in the walkable yard OUTSIDE the plot serves neither of those and is what makes ground read
   * as ground. Bounded hard at GROUND_MICRO/2 so it can never grow back into terrain.
   */
  it('the PLOT is dead flat — tiles are laid flush on it', () => {
    for (const f of [2, 4, 6, 9]) for (const seed of [1, 5, 23, 99]) {
      const gm = groundMesh(f, seed, f / 2 + 5, SPAWN_Z - 4, MAX_DEPTH + 1 - 4)
      for (let i = 0; i < gm.pos.length; i += 3) {
        const x = gm.pos[i], y = gm.pos[i + 1], z = gm.pos[i + 2]
        // the plot in this mesh's local frame: x 0..frontage centred, z 0..MAX_DEPTH offset by 4
        const inPlot = Math.abs(x) <= f / 2 && z >= -4 && z <= MAX_DEPTH - 4
        if (inPlot) expect(Math.abs(y)).toBeLessThan(1e-6)
      }
    }
  })

  it('the walkable yard is faceted but never a slope — no landmark to pace against', () => {
    for (const f of [2, 4, 6, 9]) for (const seed of [1, 5, 23, 99]) {
      const gm = groundMesh(f, seed, f / 2 + 5, SPAWN_Z - 4, MAX_DEPTH + 1 - 4)
      let varied = 0
      for (let i = 0; i < gm.pos.length; i += 3) {
        const x = gm.pos[i], y = gm.pos[i + 1], z = gm.pos[i + 2]
        const inWalkable = Math.abs(x) <= f / 2 + 5 && z >= SPAWN_Z - 4 && z <= MAX_DEPTH + 1 - 4
        if (!inWalkable) continue
        // never deep enough to clip a 1.55 m eye height, or to read as terrain rather than as texture
        expect(Math.abs(y)).toBeLessThanOrEqual(GROUND_MICRO)
        if (Math.abs(y) > 1e-6) varied++
      }
      // …and it is genuinely there: a flat sheet is what this test exists to stop coming back
      expect(varied).toBeGreaterThan(8)
    }
  })

  it('the scene binds the ground arrays rather than looping — the anti-grid source rules still bite', () => {
    // the displacement lives in the pure module precisely so this file needs no loop of its own; if it
    // ever moves back in here, the `for (`/`Array.from` bans below stop meaning anything
    expect(CODE).toMatch(/groundMesh\(/)
    expect(CODE).toMatch(/attach="attributes-position"/)
  })

  it('nothing is generated inside the plot — the working surface stays bare', () => {
    for (const s of SEEDS) for (const f of FRONTAGES) {
      for (const p of makeSite(s, f).props) {
        const insideX = p.x > -0.6 && p.x < f + 0.6
        const insideZ = p.z > -0.6 && p.z < MAX_DEPTH + 0.6
        expect(insideX && insideZ).toBe(false)
      }
      // and the skyline is well past the deepest legal peg
      for (const p of makeSite(s, f).skyline) expect(p.z).toBeGreaterThan(MAX_DEPTH + 8)
    }
  })

  it('no prop stands where the foreman does, or he is inside a van while talking', () => {
    // drives the same `miloSpot` the scene places him with, so the two cannot drift apart
    for (const s of SEEDS) for (const f of FRONTAGES) {
      const [mx, mz] = miloSpot(f)
      for (const p of makeSite(s, f).props) {
        expect(Math.hypot(p.x - mx, p.z - mz)).toBeGreaterThanOrEqual(MILO_CLEAR)
      }
    }
  })

  it('the foreman is on screen from the spawn stance — checked against the HORIZONTAL half-FOV', () => {
    /**
     * ⚠️ The craft rule is that the speaker is on screen whenever their bubble is, and `fov` in the
     * camera prop is VERTICAL — so the number to check against at 16:9 is ~47°, not ~31°. An earlier
     * placement sat ~59° off-axis, i.e. entirely off screen while talking.
     */
    const fovV = Number(CODE.match(/fov:\s*(\d+)/)![1])
    const halfH = Math.atan(Math.tan((fovV / 2) * Math.PI / 180) * (16 / 9)) * 180 / Math.PI
    for (const f of [2, 3, 4, 5, 6, 7, 8, 9]) {
      const [mx, mz] = miloSpot(f)
      // camera spawns at x = f/2, z = SPAWN_Z, facing +Z
      const off = Math.abs(Math.atan2(mx - f / 2, mz - SPAWN_Z) * 180 / Math.PI)
      expect(off).toBeLessThan(halfH - 8)   // and with margin, not hard against the frame edge
      expect(Math.hypot(mx - f / 2, mz - SPAWN_Z)).toBeGreaterThan(4)   // not looming in the lens
    }
  })
})

// ────────────────────────────────────────────────────────────────────────────────────────
describe('palette is a check, not a vibe', () => {
  const SEEDS = Array.from({ length: 400 }, (_, i) => i + 1)

  it('the unit the child commits to READS against the world — body on hue or value, contour always', () => {
    /**
     * ⚠️ THIS USED TO DEMAND 0.30 OF SATURATION FROM THE WORLD, AND THAT ONE NUMBER IS WHY THE YARD
     * WAS GREY. Both units are vivid (0.64 / 0.72), so the gap capped every ground, sky, road and prop
     * at 0.34 — a legal palette that reads as no palette, which is exactly what a founder saw twice.
     * The check was doing its job and enforcing the wrong claim.
     *
     * Separation now rests on the two axes that actually carry it, and BOTH bite:
     *   • the unit BODY clears on hue OR on value — either is enough, and
     *   • its CONTOUR clears the large fields on value, always. That second one is what makes the
     *     body's either/or safe, and it is why the world is now free in saturation rather than merely
     *     permitted to be.
     */
    for (const s of SEEDS) for (const f of [2, 5, 9]) {
      const site = makeSite(s, f)
      for (const q of ['area', 'perimeter'] as QType[]) {
        const sep = plotSiteSeparation(site, q)
        expect(sep.hue >= 45 || sep.body >= 0.18,
          `${q} body: hue ${sep.hue.toFixed(0)}° value ${sep.body.toFixed(2)}`).toBe(true)
        expect(sep.outline).toBeGreaterThanOrEqual(0.22)
        expect(sep.ok).toBe(true)     // the module's own verdict, so a loosened rule is caught here too
      }
    }
  })

  it('the two units clear each OTHER, so a tile can never read as a fence panel', () => {
    expect(hueGap(UNIT.area.h, UNIT.perimeter.h)).toBeGreaterThanOrEqual(45)
  })

  it('the world carries REAL COLOUR, and its value band is what the contour rule rests on', () => {
    /**
     * ⚠️ A SATURATION FLOOR, NOT A CEILING — the inversion is the whole change. And the lightness band
     * stops being cosmetic: the contour sits at `UNIT_OUTLINE.l`, so a ground allowed to go dark would
     * swallow it and the check above would have nothing left to stand on.
     */
    for (const s of SEEDS.slice(0, 80)) {
      const g = makeSite(s, 4).ground
      expect(g.s).toBeGreaterThan(0.22)          // it is a place, not a grey void
      expect(g.l).toBeGreaterThan(0.35)
      expect(g.l).toBeLessThan(0.65)
      expect(Math.abs(g.l - UNIT_OUTLINE.l)).toBeGreaterThanOrEqual(0.22)
    }
    for (const q of ['area', 'perimeter'] as QType[]) expect(UNIT[q].s).toBeGreaterThan(0.55)
  })

  it('every prop is the colour the THING is, and still clears both units', () => {
    // the props carry the scene's colour now, so they are swept individually rather than only via the
    // worst-case min — a single lilac skip would pass the aggregate and still look wrong
    for (const s of SEEDS.slice(0, 120)) for (const f of [2, 5, 9]) {
      for (const p of makeSite(s, f).props) {
        for (const q of ['area', 'perimeter'] as QType[]) {
          const u = UNIT[q]
          expect(hueGap(p.tone.h, u.h) >= 45 || Math.abs(p.tone.l - u.l) >= 0.18,
            `${p.role} vs ${q}: hue ${hueGap(p.tone.h, u.h).toFixed(0)}° value ${Math.abs(p.tone.l - u.l).toFixed(2)}`).toBe(true)
        }
      }
    }
  })

  it('the post-commit reveal earns its legibility by the SAME rule as the units', () => {
    // it is a colour laid over the answer, so it gets no exemption — and with the world now free to be
    // a saturated green, a green reveal no longer clears anything on hue and must earn it on value
    for (const s of SEEDS.slice(0, 120)) {
      const r = readsAgainst(makeSite(s, 4), REVEAL)
      expect(r.hue >= 45 || r.body >= 0.18,
        `reveal: hue ${r.hue.toFixed(0)}° value ${r.body.toFixed(2)}`).toBe(true)
      expect(r.outline).toBeGreaterThanOrEqual(0.22)
    }
  })

  it('the contour is RENDERED, not merely declared', () => {
    /**
     * ⚠️ The craft doc's own "a gate that reads the DATA cannot see how the scene draws it". Every
     * separation number above is a promise about pixels and is worth nothing if the unit ships as a
     * flat lambert box — which is precisely how the previous palette rework passed 70 green tests
     * while the screen was grey.
     */
    expect(CODE).toMatch(/UNIT_OUTLINE/)
    const i = CODE.indexOf('{[...laid].map(')
    expect(i).toBeGreaterThan(-1)
    expect(CODE.slice(i, i + 1400)).toMatch(/UNIT_OUTLINE/)
  })

  /**
   * ⚠️ THIS DRIVES `THREE.Color` RATHER THAN COMPARING A STRING, AND THAT IS THE WHOLE POINT.
   *
   * The first version of this check asserted `css(...) === 'hsl(100.0 50.0% 40.0%)'` — a valid CSS
   * Color 4 string every browser reads correctly — and it PASSED while the entire world rendered flat
   * white on screen. `THREE.Color.setStyle` runs its own regex, not the CSS engine, and on r180 it
   * returns rgb(255,255,255) for the space-separated form with no throw and no warning.
   *
   * `THREE.Color` is pure maths with no WebGL, so the gate can import it. **A value handed to a
   * renderer must be checked by that renderer.**
   */
  it('emits a colour three.js actually parses — not merely one that is valid CSS', async () => {
    const THREE = await import('three')
    const parse = (s: string) => { const c = new THREE.Color(); c.setStyle(s); return [c.r, c.g, c.b] }

    // the shape three cannot read, kept here so the regression is named rather than remembered
    expect(parse('hsl(100.0 50.0% 40.0%)')).toEqual([1, 1, 1])   // silent white

    const mid = parse(css({ h: 100, s: 0.5, l: 0.4 }))
    expect(mid).not.toEqual([1, 1, 1])
    expect(Math.max(...mid)).toBeLessThan(0.9)
  })

  it('every tone in every generated site parses to something that is not white', async () => {
    const THREE = await import('three')
    const parse = (s: string) => { const c = new THREE.Color(); c.setStyle(s); return [c.r, c.g, c.b] }
    for (const s of [1, 2, 3, 4, 17, 99, 400]) {
      const site = makeSite(s, 5)
      const tones = [site.sky, site.ground, site.road, site.post, ...site.props.map(p => p.tone), ...site.skyline.map(p => p.tone)]
      for (const t of tones) {
        const rgb = parse(css(t))
        expect(rgb).not.toEqual([1, 1, 1])
      }
    }
    // and the units and the reveal, which are the things that must READ against all of that
    for (const t of [UNIT.area, UNIT.perimeter, REVEAL]) expect(parse(css(t))).not.toEqual([1, 1, 1])
  })
})

// ────────────────────────────────────────────────────────────────────────────────────────
describe('the chapter is wired, comfortable and reachable', () => {
  it('mounts the rotate gate, with the early return BELOW every hook', () => {
    expect(CODE).toMatch(/useNeedsRotate\(\)/)
    const gate = CODE.indexOf('if (needsRotate) return')
    expect(gate).toBeGreaterThan(0)
    // no hook may be called after it, or turning the tablet changes the hook count
    expect(CODE.slice(gate)).not.toMatch(/\buse[A-Z]\w*\(/)
  })

  it('has no head-bob, no look acceleration and a modest FOV', () => {
    expect(CODE).not.toMatch(/bob|headBob/i)
    const fov = CODE.match(/fov:\s*(\d+)/)
    expect(Number(fov?.[1])).toBeGreaterThanOrEqual(55)
    expect(Number(fov?.[1])).toBeLessThanOrEqual(70)
    // look is a plain multiply by a constant — nothing squared, nothing eased
    expect(CODE).toMatch(/look\.dx \* LOOK/)
  })

  it('respects prefers-reduced-motion by stepping rather than gliding', () => {
    expect(CODE).toMatch(/prefers-reduced-motion/)
    expect(CODE).toMatch(/reduced \? 1 :/)
  })

  it('every interaction has a low-precision path — no gesture is required', () => {
    // ◀▶ walk a whole metre per tap, and the peg is a big fixed target
    expect(CODE).toMatch(/testId="back"/)
    expect(CODE).toMatch(/testId="fwd"/)
    expect(CODE).toMatch(/inp\.step/)
    expect(CODE).toMatch(/keydown/)      // and it plays from a keyboard
  })

  it('nudges r3f awake, or the scene never boots in a hidden tab', () => {
    // r3f measures with a ResizeObserver, whose callbacks ride the rendering steps
    expect(CODE).toMatch(/dispatchEvent\(new Event\('resize'\)\)/)
  })

  it('the walkable bound cannot trap the camera and always reaches the answer', () => {
    expect(CODE).toMatch(/Math\.min\(MAX_DEPTH \+ 1, pos\.current\.z\)/)
    expect(CODE).toMatch(/Math\.max\(SPAWN_Z, /)
  })

  it('the dev drive hook is stripped from production', () => {
    expect(CODE).toMatch(/process\.env\.NODE_ENV === 'production'\) return/)
    expect(CODE).toMatch(/__miloPace/)
  })

  it('adds no image, model or texture asset', () => {
    for (const bad of [/\.glb/, /\.gltf/, /useLoader/, /TextureLoader/, /\/assets\//]) {
      expect(CODE).not.toMatch(bad)
    }
    // numerals are drawn into a canvas at runtime
    expect(CODE).toMatch(/CanvasTexture/)
  })

  it('the registry points at this chapter and nothing imports the old one', () => {
    const reg = readFileSync(join(process.cwd(), 'src/features/chapters/storyChapters.tsx'), 'utf8')
    expect(reg).toMatch(/areaPerimeter:.*story\/FloorPlot/)
    expect(reg).not.toMatch(/GridPlotter/)
  })

  it('the chapter hint no longer describes the grid this deletes', () => {
    const ch = readFileSync(join(process.cwd(), 'src/core/chapters.ts'), 'utf8')
    const row = ch.split('\n').find(l => l.includes("id: 'areaPerimeter'"))!
    expect(row).not.toMatch(/Count squares/)
  })
})
