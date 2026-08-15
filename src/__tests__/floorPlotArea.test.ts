/**
 * The gate for THE EMPTY PLOT (9–11 · `areaPerimeter`) — the band's area & perimeter chapter, now a
 * plan view on GameShell.
 *
 * It drives the SAME exported functions the chapter renders and grades from — `makeRound`,
 * `gradePeg`, `missFor`, `slotsFor`, `slotBox`, `equationFor`, `explainBeats`, `spanMetres`,
 * `snapMetres` — rather than re-implementing them, because a check carrying its own copy of a rule
 * cannot see the rule being removed. That is this repo's own recorded fault, met twice.
 *
 * ⚠️ WHAT CHANGED, AND WHAT DID NOT. The chapter was 1,380 lines of react-three-fiber over a 628-line
 * procedural site; the founder removed the 3D and it came onto the shared shell like the other six
 * 9–11 chapters. **The verb did not move**, so most of this file did not either — the arithmetic, the
 * tier ladder, the anti-oracle sweep, the miss lines and the demo beats are the checks they always
 * were. What went with the 3D: the whole procedural-world half (nothing in the site is countable, the
 * palette separations, the collinear-props trap) and every check about a camera. `plotSite.ts` is
 * deleted, so those rules have nothing left to guard.
 *
 * ⚠️ AND ONE CLASS OF CHECK GOT CHEAPER, WHICH IS WORTH RECORDING. `useFrame` is not drivable in a
 * backgrounded tab, so the old chapter's play loop could not be exercised headlessly AT ALL and this
 * file was its only mechanical evidence. A DOM instrument can be driven, so what is asserted here is
 * now the floor rather than the ceiling.
 */
import { describe, it, expect } from 'vitest'
import {
  TIERS, stepsFor, makeRound, gradePeg, missFor, slotsFor, slotBox, badgeFor, contextFor,
  equationFor, explainBeats, instructionFor, spanMetres, snapMetres, workFrames, visibleDepth, metreOf,
  roadBand, markers, planXY, ROAD_TEXT_TOP, ROAD_TEXT_H,
  M_PER_HAND, SPAN_MIN_HANDS, SPAN_MAX_HANDS, HAND_MAX_M, HOLD_M,
  DEMO, GUIDED, MAX_DEPTH, type PlotRound, type QType,
} from '@/features/chapters/story/plotMaths'
import { EMPTY_PLOT_CONFIG, readMetres, START, filmFor, PLAN_BOX, PLAN_BOX_LAND, type PlotV } from '@/features/chapters/teen/games/EmptyPlotGame'
import { NO_HAND, type HandRead } from '@/infra/ar/HandInput'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const TIER_LIST = [1, 2, 3] as const
const draws = (d: 1 | 2 | 3, n = 500, asked: readonly string[] = ['area', 'perimeter']) =>
  Array.from({ length: n }, () => makeRound(d, asked))
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
          unitWord: q === 'area' ? 'tiles' : 'metres of fence', tag: '', prompt: '', say: '',
        })
      }
    }
    return out
  }))

const SRC = readFileSync(join(process.cwd(), 'src/features/chapters/teen/games/EmptyPlotGame.tsx'), 'utf8')
/** Comments stripped: this repo has twice had a source check match the prose EXPLAINING a rule. */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const SHELL = readFileSync(join(process.cwd(), 'src/features/chapters/teen/games/parts/GameShell.tsx'), 'utf8')

/** a hand reading, built the way the detector reports one */
const hand = (span: number | null, hands = 2): HandRead => ({ ...NO_HAND, hands: span === null ? 0 : hands, span })

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
    // and the bound is past the deepest legal peg, so a child can always overshoot as well as stop
    const deepest = Math.max(...ALL.map(d => d.depth))
    expect(MAX_DEPTH).toBeGreaterThan(deepest)
  })

  it('the delivery is exactly the target — the units cannot lie about the quantity', () => {
    for (const d of ALL) expect(slotsFor(d)).toHaveLength(d.target)
  })

  it('every unit lands inside the plot the child pegged, and no two share a place', () => {
    for (const d of ALL) {
      const seen = new Set<string>()
      for (const s of slotsFor(d)) {
        const b = slotBox(d, s)
        expect(b.x).toBeGreaterThanOrEqual(0)
        expect(b.x + b.w).toBeLessThanOrEqual(d.frontage)
        expect(b.y).toBeGreaterThanOrEqual(0)
        expect(b.y + b.h).toBeLessThanOrEqual(d.depth)
        // ⚠️ two units drawn in one place is a delivery that LOOKS short of the target it is not
        const k = `${b.x}:${b.y}:${b.w}:${b.h}`
        expect(seen.has(k), `${s} drawn twice`).toBe(false)
        seen.add(k)
      }
    }
  })

  it('a fence panel lies ON an edge and a tile fills a square — never the other way round', () => {
    for (const d of ALL) {
      for (const s of slotsFor(d)) {
        const b = slotBox(d, s)
        if (d.qType === 'area') { expect(b.w).toBe(1); expect(b.h).toBe(1); continue }
        // an edge has exactly one zero dimension, and that dimension sits on a boundary of the plot
        expect(b.w * b.h).toBe(0)
        expect(b.w + b.h).toBe(1)
        if (b.w === 0) expect([0, d.frontage]).toContain(b.x)
        else expect([0, d.depth]).toContain(b.y)
      }
    }
  })

  it('the reveal lays units into the plot the CHILD pegged, never the right one', () => {
    // ⚠️ this is what makes a miss a consequence rather than a verdict: peg short and units are left
    // on the lorry, peg deep and the floor is bare past where they stopped
    const d = ALL.find(r => r.qType === 'area' && r.frontage === 4 && r.depth === 4)!
    const short = slotsFor({ ...d, depth: 2 }).slice(0, d.target)
    expect(short).toHaveLength(8)                    // 8 laid, 8 still on the lorry
    const deep = slotsFor({ ...d, depth: 6 }).slice(0, d.target)
    expect(deep).toHaveLength(d.target)              // every tile used…
    expect(slotsFor({ ...d, depth: 6 })).toHaveLength(24)  // …into a plot that needs 24: bare
    expect(CODE).toMatch(/slotsFor\(\{ \.\.\.r, depth: pegAt \}\)\.slice\(0, r\.target\)/)
  })
})

// ────────────────────────────────────────────────────────────────────────────────────────
describe('difficulty grows the SKILL, not only the magnitude', () => {
  /**
   * ⚠️ This is the one line of the pedagogy contract an earlier cut FAILED: it drew both sides from
   * one widening range, so a harder tier meant bigger numbers and nothing else. The taught thing is a
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
  /**
   * ⚠️ THE RULE MOVED HOUSE AND IS STRONGER FOR IT. The bespoke chapter owned its own feedback and
   * had to refuse the second peg itself (`settleAfterPeg`, now deleted rather than left as dead code
   * that reads like a guarantee). On the shell a commit grades and moves to the reveal, and the
   * instrument is handed `disabled` for the whole of it — so a scored round cannot be re-pegged at
   * all. Asserted where it now lives.
   */
  it('the shell leaves `active` on the commit and does not come back', () => {
    expect(SHELL).toMatch(/if \(!task \|\| sub !== 'active'\) return/)
    expect(SHELL).toMatch(/setSub\('reveal'\)/)
    expect(SHELL).toMatch(/const busy = sub !== 'active'/)
    expect(SHELL).toMatch(/disabled=\{busy\}/)
  })

  it('and the instrument refuses a second peg on its own account too', () => {
    // belt and braces, because the walk buttons are the chapter's own and a glide is running
    expect(CODE).toMatch(/if \(disabled \|\| reveal \|\| cur\.back < 1\) return/)
    expect(CODE).toMatch(/if \(disabled \|\| reveal\) return/)
  })

  it('the grader accepts exactly one place, at every round the generator can draw', () => {
    for (const r of ALL) {
      expect(gradePeg(r, r.depth)).toBe(true)
      for (let p = 1; p <= MAX_DEPTH; p++) if (p !== r.depth) expect(gradePeg(r, p)).toBe(false)
    }
  })

  it('the chapter grades the PEG, and the peg is where the child stopped', () => {
    const t = EMPTY_PLOT_CONFIG.makeTask(1, ['area', 'perimeter'])
    expect(EMPTY_PLOT_CONFIG.grade(t, { ...START, back: t.r.depth })).toBe(true)
    expect(EMPTY_PLOT_CONFIG.grade(t, { ...START, back: t.r.depth + 1 })).toBe(false)
  })

  it('⚠️ the commit control looks the same at every depth', () => {
    // a Peg button that lights up on the right answer is chapter 4's green Ready button: the child
    // wins by watching the colour instead of working it out
    const btnRow = CODE.slice(CODE.indexOf("btn('◀ nearer'"), CODE.indexOf("btn('back ▶'"))
    for (const leak of ['gradePeg', 'depth', 'correct']) expect(btnRow).not.toContain(leak)
  })
})

// ────────────────────────────────────────────────────────────────────────────────────────
describe('nothing states the answer before the commit', () => {
  /**
   * The child is asked to produce the DEPTH. Every string on screen before the peg — the prompt, the
   * spoken line, the board's badge and its context line — is swept for it, over the whole range.
   * ⚠️ The badge and the context live in the PURE MODULE for exactly this reason: a sentence built
   * inside a component is one no gate can read.
   */
  it('no pre-commit string contains the depth', () => {
    for (const d of draws(1, 300).concat(draws(2, 300), draws(3, 300))) {
      const shown = `${d.prompt} ${d.say} ${badgeFor(d)} ${contextFor(d)}`
      // the two givens may appear; the depth may not
      const nums = shown.match(/\d+/g)?.map(Number) ?? []
      for (const n of nums) expect([d.frontage, d.target]).toContain(n)
      expect(nums).not.toContain(d.depth === d.frontage || d.depth === d.target ? -1 : d.depth)
    }
  })

  it('the equation is never in a pre-commit string', () => {
    for (const d of draws(1, 200).concat(draws(2, 200), draws(3, 200))) {
      for (const s of [d.prompt, d.say, badgeFor(d), contextFor(d)]) {
        expect(s).not.toContain('×')
        expect(s).not.toContain('=')
      }
    }
  })

  it('the board draws the LOAD, and never an "= ?" under it', () => {
    const t = EMPTY_PLOT_CONFIG.makeTask(3, ['area', 'perimeter'])
    expect(t.badge).toBe(badgeFor(t.r))
    expect(t.badge).toContain(String(t.r.target))
    // the peg is the answer, so an "= ?" there reads as a broken equation
    expect(t.showEquals).toBe(false)
  })

  it('the equation is rendered only once the units are laid', () => {
    expect(CODE).toMatch(/\{shown && \(/)
    expect(CODE.match(/equationFor\(r\)/g) ?? []).toHaveLength(1)
    const eq = CODE.indexOf('equationFor(r)')
    expect(CODE.slice(0, eq)).toContain('const shown =')
  })

  it('⚠️ but a RIGHT answer lays the units too — the shell only reveals a WRONG one', () => {
    /**
     * Found by driving the camera path: `reveal` is true on a wrong answer and the re-teach and
     * never on a right one, so the delivery — *"and it comes out to the metre"*, the payoff the
     * chapter exists for — was shown only to children who got it wrong.
     * ⚠️ And it is gated on the PEG, so nothing is laid while the child is still deciding.
     */
    expect(CODE).toMatch(/const shown = reveal \|\| v\.laid \|\| \(v\.pegged && gradePeg\(r, v\.back\)\)/)
    expect(CODE).toMatch(/const pegAt = v\.pegged \? v\.back : null/)
  })

  it('the readout is the child’s own pacing and is labelled as such', () => {
    expect(CODE).toMatch(/'metre back' : 'metres back'/)
    // it is fed `v.back` — metres walked — and never the target or a product
    expect(CODE).toMatch(/\{v\.back\} <span/)
    expect(CODE).not.toMatch(/\{[^}]*r\.target[^}]*\} <span style=\{\{ fontSize: 12/)
  })

  it('⚠️ the plot floor is never subdivided — no grid on the working surface', () => {
    const YARD = CODE.slice(CODE.indexOf('function Yard('), CODE.indexOf('function Plot('))
    /**
     * The fault that got an earlier cut rejected: one line ruled the ground into exactly as many
     * countable squares as the answer, so a child could count the boxes and never measure a side.
     * A grid does not have to arrive as a texture — a loop of 1-metre cells is the same printed
     * answer — so what is asserted is that NOTHING is rendered per-metre before the peg. `slotsFor`
     * is the only producer of per-unit positions, it is pure, and it is gated on the peg.
     */
    // ⚠️ SCOPED TO WHAT IS DRAWN, not to the whole file — `glide` loops to walk the peg back on a
    // miss, which builds timers rather than ground. A ban wide enough to catch that is a ban that
    // gets loosened, and a loosened check is worse than none.
    expect(YARD).not.toMatch(/Array\.from\(\s*\{\s*length/)
    expect(YARD).not.toMatch(/\[\s*\.\.\.\s*Array\(/)
    expect(YARD).not.toMatch(/for\s*\(/)
    // a REPEATING background is a grid however it arrives, and nothing may tile, ever
    expect(CODE).not.toMatch(/repeating-linear-gradient/)
    expect(CODE).not.toMatch(/backgroundRepeat: 'repeat/)
    // ⚠️ `backgroundSize` is how the FILM indexes one cell of a horizontal strip, so the ban on it
    // belongs where the plot is DRAWN rather than file-wide — a ban that has to be loosened later is
    // worse than no ban, so it is scoped now rather than deleted.
    expect(YARD).not.toMatch(/backgroundSize/)
    expect(YARD).not.toMatch(/backgroundImage/)
    // exactly three lists are drawn: the two corner pegs, the two side lines, and the laid units.
    // Anything else iterating in here is a grid until proven otherwise.
    expect(YARD.match(/\.map\(/g) ?? [], 'a fourth list in the yard').toHaveLength(3)
    expect(YARD, 'the two corner posts').toMatch(/\[0, ACROSS\]\.map/)
    expect(YARD, 'the two side edges').toMatch(/\(\[0, 1\] as const\)\.map/)
    expect(YARD, 'the laid units').toMatch(/laid\.map/)
  })

  it('the units exist only AFTER the peg — the yard is bare while the child decides', () => {
    expect(CODE).toMatch(/const laid = pegAt === null \? \[\] : slotsFor/)
    expect(CODE).toMatch(/const pegAt = v\.pegged \? v\.back : null/)
    // and slotsFor is the only producer of per-unit positions in the whole chapter
    expect(CODE.match(/slotsFor\(/g) ?? []).toHaveLength(1)
  })

  it('⚠️ THE BOX IS THE SAME HEIGHT ON EVERY ROUND UNTIL THE PEG IS IN', () => {
    /**
     * The plan closes up on the commit so the plot fills the panel — but if it closed up any EARLIER
     * the box's own height would be the answer, drawn on screen instead of written. Swept over every
     * round the generator can draw: pre-commit, two rounds of the same frontage and different depths
     * are pixel-identical.
     */
    for (const d of ALL) expect(visibleDepth(null, d.depth), `${d.frontage}x${d.depth}`).toBe(MAX_DEPTH)
    const byFrontage = new Map<number, Set<number>>()
    for (const d of ALL) {
      const u = metreOf(d.frontage, visibleDepth(null, d.depth), PLAN_BOX.w, PLAN_BOX.h)
      byFrontage.set(d.frontage, (byFrontage.get(d.frontage) ?? new Set()).add(u))
    }
    for (const [f, us] of byFrontage) expect(us.size, `frontage ${f} draws one metre size`).toBe(1)
    // and once the peg IS in, the plan closes up on what was built — the answer is already committed
    expect(visibleDepth(3, 3)).toBe(4)
    expect(visibleDepth(9, 3), 'a peg far past the answer still frames what they built').toBe(10)
  })

  it('⚠️ and the plot is never drawn tiny — the founder’s "too small" as an invariant', () => {
    /**
     * A metre was a typed constant (22px) and a 5 × 2 plot came out at 14% of a box reserved for
     * twelve metres. Derived from the box, every round gets a readable plot — and the REVEAL, which
     * is the beat the whole chapter builds to, gets a big one. Measured on the shipped box.
     */
    /**
     * ⚠️ SWEPT IN BOTH ORIENTATIONS. The plan turns with the screen — depth down the page on a phone,
     * across it on a laptop — and a check that only knew one of them would have let the other be
     * drawn at a sixth of the room, which is the fault this test exists for.
     */
    const boxes = [
      { name: 'portrait', across: PLAN_BOX.w, deep: PLAN_BOX.h },
      { name: 'landscape', across: PLAN_BOX_LAND.h, deep: PLAN_BOX_LAND.w },
    ]
    for (const d of ALL) {
      for (const b of boxes) {
        const live = metreOf(d.frontage, visibleDepth(null, d.depth), b.across, b.deep)
        expect(live, `${b.name} ${d.frontage}x${d.depth} live`).toBeGreaterThanOrEqual(20)
        const laid = metreOf(d.frontage, visibleDepth(d.depth, d.depth), b.across, b.deep)
        expect(laid, `${b.name} ${d.frontage}x${d.depth} laid`).toBeGreaterThanOrEqual(live)
        // the laid plot uses most of the box on at least one axis, or it is floating in space again
        expect(Math.max(laid * d.frontage / b.across, laid * d.depth / b.deep), `${b.name} ${d.frontage}x${d.depth} fills`)
          .toBeGreaterThan(0.55)
      }
    }
    // ⚠️ AND THE SCENE MUST USE IT. Mutation-tested: with the gate carrying its own 340s, putting a
    // typed `const U = 22` back in the component left every size check green — the recorded
    // "a gate that re-implements a rule cannot see the rule being removed", met again.
    expect(CODE).toMatch(/const U = land\s*\? metreOf\(r\.frontage, shownDepth, box\.h, box\.w\)\s*: metreOf\(r\.frontage, shownDepth, box\.w, box\.h\)/)
    expect(CODE).toMatch(/const shownDepth = visibleDepth\(pegAt, r\.depth\)/)
    // and the landscape box really is wider than it is tall, or the plan turned for nothing
    expect(PLAN_BOX_LAND.w).toBeGreaterThan(PLAN_BOX_LAND.h)
  })

  it('⚠️ THE PLAN TURNS WITH THE SCREEN — the long axis follows the frame’s long axis', () => {
    /**
     * Founder: *"laptop screen pe yeh ek proper horizontal rectangle mein dikhe … abhi woh vertical
     * mein hai, joh phone ke liye sahi."* The walk is the long axis, so on a landscape frame it has to
     * be the horizontal one — reflow, not a smaller scale.
     * ⚠️ DRIVEN, NOT GREPPED. Mutation-testing found that a tile grid which had stopped turning with
     * the plan passed every box-and-metre check in this file, because those were all still correct.
     */
    const u = 20
    expect(planXY(false, 3, 7, u), 'portrait: depth runs DOWN').toEqual({ left: 60, top: 140 })
    expect(planXY(true, 3, 7, u), 'landscape: depth runs ACROSS').toEqual({ left: 140, top: 60 })
    // the two are transposes of each other, at every point of the plan
    for (const d of ALL) {
      for (const s of slotsFor(d)) {
        const b = slotBox(d, s)
        const p = planXY(false, b.x, b.y, u), l = planXY(true, b.x, b.y, u)
        expect({ left: l.top, top: l.left }).toEqual(p)
      }
    }
    // and the scene really turns: the box, the metre's axes and the units all read `land`
    expect(CODE).toMatch(/const box = land \? PLAN_BOX_LAND : PLAN_BOX/)
    expect(CODE).toMatch(/planXY\(land, b\.x, b\.y, U\)/)
    expect(CODE).toMatch(/planXY\(land, across, deep, U\)/)
    // the landscape box is wider than tall, or the plan turned for nothing
    expect(PLAN_BOX_LAND.w).toBeGreaterThan(PLAN_BOX_LAND.h)
    expect(PLAN_BOX.h).toBeGreaterThanOrEqual(PLAN_BOX.w)
  })

  it('⚠️ every marker GROWS with the metre — the character is not a constant', () => {
    /**
     * The founder's complaint was the character, and the fault was that the metre had become derived
     * while the walker, the peg and the posts stayed typed pixel sizes. A check that only asks "do
     * the boxes overlap" cannot see that: a marker frozen SMALL overlaps nothing at all. So assert
     * the relationship, not the absence of a collision.
     */
    const small = markers(20), big = markers(80)
    for (const k of ['walker', 'peg', 'post', 'num'] as const) {
      expect(big[k], `${k} grows with the metre`).toBeGreaterThan(small[k])
    }
    // and at a big metre the walker really is about a metre — a marker a child can see, not a dot
    expect(markers(80).walker).toBeGreaterThanOrEqual(80 * 0.8)
    expect(markers(80).peg).toBeGreaterThanOrEqual(80 * 0.5)
    // …with a floor that keeps it legible on the widest plot, where the metre is smallest
    const tightest = Math.min(...ALL.map(d => metreOf(d.frontage, visibleDepth(null, d.depth), PLAN_BOX.w, PLAN_BOX.h)))
    expect(markers(tightest).walker, 'legible at the smallest metre').toBeGreaterThanOrEqual(30)
  })

  it('⚠️ nothing in the road band is drawn over anything else, at any metre the generator makes', () => {
    /**
     * That strip has collided TWICE — the frontage numeral across the word ROAD, then the walker's
     * head across the numeral once he started scaling with the metre. Both times every element was
     * individually centred and individually correct, which is why only crossing their boxes finds it.
     * So the band is derived, and this sweeps every size the chapter can draw rather than the one
     * somebody looked at.
     */
    for (const d of ALL) {
      for (const pegged of [null, d.depth]) {
        const u = metreOf(d.frontage, visibleDepth(pegged, d.depth), PLAN_BOX.w, PLAN_BOX.h)
        const { num: numPx, walker } = markers(u)
        const b = roadBand(numPx, walker)
        const roadText = { top: ROAD_TEXT_TOP, bot: ROAD_TEXT_TOP + ROAD_TEXT_H }
        // the numeral and the walker's head are measured from the frontage line, which is at `height`
        const num = { top: b.height + b.numTop, bot: b.height + b.numTop + numPx }
        const head = { top: b.height - b.head, bot: b.height }
        /**
         * ⚠️ A REAL CLEARANCE, NOT `>= 0`. Mutation-tested: with the gap at zero these boxes merely
         * TOUCH, which a `>=` check calls a pass — and on screen they overlapped by 2px, because an
         * emoji's line box carries leading its font size does not describe and `FitSlot` then scales
         * the lot down. Measured: 8px authored arrives as a 2px gap on the DOM.
         */
        const CLEAR = 6
        expect(num.top - roadText.bot, `${d.frontage}x${d.depth}: numeral clears ROAD`).toBeGreaterThanOrEqual(CLEAR)
        expect(head.top - num.bot, `${d.frontage}x${d.depth}: walker clears the numeral`).toBeGreaterThanOrEqual(CLEAR)
        expect(num.top, 'and everything stays inside the band').toBeGreaterThanOrEqual(0)
      }
    }
    // and the scene really uses BOTH, rather than carrying its own copies again
    expect(CODE).toMatch(/const band = roadBand\(numPx, walker, ROAD\)/)
    expect(CODE).toMatch(/top: band\.numTop/)
    expect(CODE).toMatch(/const \{ walker, peg: pegPx, post, num: numPx \} = markers\(U\)/)
    // ⚠️ no marker may go back to a typed size — that is how the character shrank to 16px
    expect(CODE).not.toMatch(/fontSize: \d+ \}\}>🚶/)
    expect(CODE).not.toMatch(/fontSize: \d+, lineHeight: 1 \}\}>📍/)
  })

  it('the frontage is ONE unbroken line — it says how WIDE, never how deep', () => {
    // ticks along the given side would be a ruler, i.e. the answer drawn instead of written
    expect(CODE).toMatch(/edge\(0, P\.gold\)/)
    expect(CODE).toMatch(/\{r\.frontage\} m/)
    // ⚠️ SCOPED TO WHAT IS DRAWN. `${r.depth}` also appears in the film's lookup key, which is a
    // Record index and reaches no screen — the `{ANCHOR}` / `${ANCHOR}` trap this repo has met twice.
    const YARD2 = CODE.slice(CODE.indexOf('function Yard('), CODE.indexOf('function Plot('))
    expect(YARD2).not.toMatch(/\{r\.depth\}/)   // the depth is never drawn as a numeral, ever
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
    for (let i = 0; i < 40; i++) expect(makeRound(1, ['area']).qType).toBe('perimeter')
    for (let i = 0; i < 40; i++) expect(makeRound(1, ['perimeter']).qType).toBe('area')
  })

  it('and RANDOMLY once the gap closes — hardest-first for ever would destroy the variety', () => {
    const kinds = new Set(Array.from({ length: 200 }, () => makeRound(3, ['area', 'perimeter']).qType))
    expect(kinds.size).toBe(2)
  })

  it('the chapter DECLARES coverage over both readings, and the shell honours it', () => {
    expect(EMPTY_PLOT_CONFIG.coverage?.all).toEqual(['area', 'perimeter'])
    const t = EMPTY_PLOT_CONFIG.makeTask(1, ['area'])
    expect(EMPTY_PLOT_CONFIG.coverage?.of(t)).toBe('perimeter')
  })

  it('and `asked` really reaches the generator — a declaration that is not wired withholds the exit for ever', () => {
    // driven rather than grepped: the config is asked for a task with one reading met
    for (let i = 0; i < 20; i++) expect(EMPTY_PLOT_CONFIG.makeTask(3, ['perimeter']).r.qType).toBe('area')
  })

  it('the two readings ask genuinely different arithmetic off one gesture', () => {
    const a = ALL.find(r => r.qType === 'area' && r.frontage === 4 && r.depth === 3)!
    const p = ALL.find(r => r.qType === 'perimeter' && r.frontage === 4 && r.depth === 3)!
    expect(a.target).toBe(12)
    expect(p.target).toBe(14)
    // same frontage, same depth, different given — so neither can be eliminated into
    expect(a.target).not.toBe(p.target)
  })

  it('a re-drawn plot of the same shape is not a new question', () => {
    const a = EMPTY_PLOT_CONFIG.sig!(EMPTY_PLOT_CONFIG.makeTask(1, ['area', 'perimeter']))
    expect(a).toMatch(/^(area|perimeter)\|\d+x\d+$/)
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

  it('⚠️ and it is WRITTEN, beside the plot they actually pegged', () => {
    /**
     * The shell says "It was 3 m back" and glides; the chapter's own sentence — the one that names
     * what is wrong with the WORK — has to be rendered by the instrument or it is lost in the port.
     * Everything spoken is also written, because most Chrome installs have no voice at all.
     */
    expect(CODE).toMatch(/\{reveal && !gradePeg\(r, v\.back\) && \(/)
    expect(CODE).toMatch(/\{missFor\(r, v\.back\)\}/)
  })
})

// ────────────────────────────────────────────────────────────────────────────────────────
describe('the demo teaches the working, and its numbers agree with its own sentences', () => {
  /**
   * ⚠️ The Supply Run shipped a beat that SAID the remainder stayed behind while the picture put it in
   * a van — every line individually true, and nothing could see it because the beats were
   * component-local. These are exported, so the gate drives the list the walkthrough plays.
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

  it('⚠️ EVERY BEAT THAT NARRATES A MOVE CARRIES THE VALUE THAT MAKES IT', () => {
    /**
     * The Angle Shop's walkthrough said "So I turn it" and then "There, that is the one" over an arm
     * that had not moved a degree — the teaching describing something the screen never did. The
     * walkthrough steps are built from the beats, so the value and the sentence cannot drift.
     */
    const steps = (Array.isArray(EMPTY_PLOT_CONFIG.tutorial) ? EMPTY_PLOT_CONFIG.tutorial : [])
    expect(steps).toHaveLength(DEMO.length)
    steps.forEach((s, i) => {
      const beats = explainBeats(DEMO[i])
      expect(s.steps).toHaveLength(beats.length)
      s.steps.forEach((st, j) => {
        expect(st.say).toBe(beats[j].say)
        expect(st.value!.back).toBe(beats[j].depth)
        expect(st.value!.pegged).toBe(beats[j].pegged !== null)
        expect(st.value!.laid).toBe(beats[j].laid)
      })
      // the walk beat really walks, the peg beat really pegs, the last beat really lays
      expect(s.steps[3].value!.back).toBe(DEMO[i].depth)
      expect(s.steps[4].value!.pegged).toBe(true)
      expect(s.steps[5].value!.laid).toBe(true)
      // and the board writes the equation exactly once, on the beat that lays the units
      expect(s.steps.filter(st => st.board).length).toBe(1)
      expect(s.steps[5].board).toBe(equationFor(DEMO[i]))
    })
  })

  it('⚠️ THE ARITHMETIC BEAT PERFORMS THE ARITHMETIC — it used to be a sentence over a static yard', () => {
    /**
     * Founder, on a screenshot of that beat: *animate the explanation, and run the frames off the
     * narration.* It was the whole teaching happening in audio — and most Chrome installs have no
     * voice, so that beat taught nothing at all. The frames are data so the gate can check the
     * picture against the beat's own words, which is the Supply Run rule.
     */
    for (const d of cases) {
      const beat = explainBeats(d).find(b => b.step === 'work')!
      const f = workFrames(d)
      expect(f.length, 'a beat that is one frame long is a still').toBeGreaterThan(1)
      // it opens on the whole load, untouched, and the load is the GIVEN — never the answer
      expect(f[0].groups).toHaveLength(0)
      expect(f[0].note).toContain(String(d.target))
      // and it ENDS on what the sentence ends on
      const last = f[f.length - 1]
      expect(last.note, `${d.qType} lands on the answer`).toContain(String(d.depth))
      expect(beat.say).toContain(String(d.depth))
      // the two readings cut the load up differently — that is what stops either being guessed
      expect(f.length).toBe(d.qType === 'area' ? d.depth + 1 : 5)

      /**
       * ⚠️ AND THE PIECES ARE MEASURED, NOT JUST THE CAPTION. Caught by mutation: shrinking the
       * perimeter's two final pieces to one unit each left the note still reading "2 each" and the
       * whole check green — the picture drawing one thing while its own words said another, which is
       * the Supply Run fault this file exists to prevent. Assert the DRAWING.
       */
      const sizes = last.groups.map(g => g.to - g.from)
      if (d.qType === 'area') {
        expect(sizes, `${d.depth} rows of ${d.frontage}`).toEqual(Array(d.depth).fill(d.frontage))
      } else {
        // two sides of the frontage, then the remainder split into two equal DEPTHS
        expect(sizes.filter((_, i) => i < 2)).toEqual([d.frontage, d.frontage])
        expect(last.groups.filter(g => g.tone === 'each').map(g => g.to - g.from))
          .toEqual([d.depth, d.depth])
      }
    }
  })

  it('the working never marks more than the load, and never marks a unit twice', () => {
    for (const d of cases) {
      for (const f of workFrames(d)) {
        const seen = new Set<number>()
        for (const g of f.groups) {
          expect(g.from).toBeGreaterThanOrEqual(0)
          expect(g.to).toBeLessThanOrEqual(d.target)
          expect(g.to).toBeGreaterThan(g.from)
          for (let i = g.from; i < g.to; i++) {
            expect(seen.has(i), `unit ${i} marked twice`).toBe(false)
            seen.add(i)
          }
        }
      }
      // the last frame of an area round has accounted for the WHOLE load — that is what "it comes
      // out to the metre" means, one beat early
      const last = workFrames(d)[workFrames(d).length - 1]
      expect(last.groups.reduce((n, g) => n + (g.to - g.from), 0)).toBe(d.target)
    }
  })

  it('⚠️ and the countable bar can NEVER reach a scored round', () => {
    /**
     * The bar is `target` segments long and a child could count it. That is safe only because it
     * renders behind `step`, which the walkthrough beats set and nothing in play does — so this is
     * the assertion the whole thing rests on, driven rather than grepped.
     */
    const t = EMPTY_PLOT_CONFIG.makeTask(3, ['area', 'perimeter'])
    expect(EMPTY_PLOT_CONFIG.initialValue(t).step, 'a fresh round').toBeUndefined()
    expect(EMPTY_PLOT_CONFIG.hand!.enter!(t, START, 4).step, 'the hand').toBeUndefined()
    const glided: PlotV[] = []
    EMPTY_PLOT_CONFIG.glide(t, { ...START, back: 1, pegged: true }, v => glided.push(v), fn => fn())
    expect(glided.length, 'the glide really ran').toBeGreaterThan(0)
    for (const v of glided) expect(v.step, 'the miss glide').toBeUndefined()
    // and the bar is drawn only while nothing has been laid, so it never sits beside a verdict
    expect(CODE).toMatch(/\{work && !shown && <WorkBar/)
  })

  it('the walk beat counts its metres out one at a time', () => {
    // "counting my metres. 1, 2, 3" over a walker who slid the whole way in 180ms was the same fault
    // one beat along
    for (const d of cases) {
      const walk = explainBeats(d).find(b => b.step === 'walk')!
      expect(walk.depth).toBe(d.depth)
      expect(walk.say).toContain(Array.from({ length: d.depth }, (_, i) => i + 1).join(', '))
    }
    expect(CODE).toMatch(/v\.step === 'walk' \? v\.back \+ 1 :/)
    expect(CODE).toMatch(/back: Math\.min\(fi, v\.back\)/)
  })

  it('⚠️ THE FILM COVERS THE TWO FIXED DEMOS AND NOTHING ELSE', () => {
    /**
     * Founder's call: the code-drawn bar was *"kuch khaas naii"*, so the walkthrough examples got a
     * generated film. A film says ONE set of numbers for ever — so it may only ever play on the two
     * hard-coded demos, and every other round (including the re-teach, which re-narrates the child's
     * own round) has to fall back to the bar. Swept over the whole generator.
     */
    for (const d of DEMO) expect(filmFor(d), `${d.qType} demo`).toBeTruthy()
    expect(filmFor(GUIDED), 'the guided round is played, not watched').toBeNull()
    for (const d of ALL) {
      if (DEMO.some(x => x.qType === d.qType && x.frontage === d.frontage && x.depth === d.depth)) continue
      expect(filmFor(d), `${d.qType} ${d.frontage}x${d.depth}`).toBeNull()
    }
  })

  it('⚠️ and the strip on disk really has the cells the code indexes into', () => {
    /**
     * The film is a horizontal strip stepped by `backgroundPosition`, so the cell count is shared
     * between a PNG and a number in the source. Re-cut the strip at a different `--frames` and every
     * cell silently lands on the wrong picture — nothing errors, the animation just stops matching
     * the words. Pin the geometry: the cutter writes cells of 440×248.
     */
    for (const d of DEMO) {
      const film = filmFor(d)!
      const buf = readFileSync(join(process.cwd(), 'public', film.src.replace(/^\//, '')))
      // PNG IHDR: width and height are big-endian uint32 at bytes 16 and 20
      const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20)
      expect(h, `${film.src} cell height`).toBe(248)
      expect(w, `${film.src} is ${film.cells} cells wide`).toBe(film.cells * 440)
    }
  })

  it('the film plays only on the arithmetic beat, and the caption stays the ARITHMETIC', () => {
    // the picture may be the model's; what the child READS is derived from the numbers either way
    expect(CODE).toMatch(/const film = v\.step === 'work' \? filmFor\(r\) : null/)
    expect(CODE).toMatch(/frames\[Math\.round\(\(fi \/ Math\.max\(1, nFrames - 1\)\) \* \(frames\.length - 1\)\)\]\?\.note/)
  })

  it('⚠️ the frames run at the NARRATION’s speed, not at a constant of their own', () => {
    // a beat's real duration is not knowable in advance, but the child's speech-rate pick is the same
    // multiplier both sides — `speakSteps` uses `2600 / m`, so a frame is `620 / m`
    expect(CODE).toMatch(/620 \/ \(getSpeechRate\(\) \|\| 1\)/)
    // and on a timer, never rAF: rAF is frozen outright in a backgrounded tab
    expect(CODE).toMatch(/setInterval/)
    expect(CODE).not.toMatch(/requestAnimationFrame/)
  })

  it('the two demos teach one reading each, before anything is scored', () => {
    expect(new Set(DEMO.map(d => d.qType))).toEqual(new Set(['area', 'perimeter']))
    for (const d of DEMO.concat(GUIDED)) {
      const derived = d.qType === 'area' ? d.target / d.frontage : d.target / 2 - d.frontage
      expect(derived).toBe(d.depth)   // the fixed rounds are honest too
    }
  })

  it('the re-teach narrates the same working the walkthrough played', () => {
    const t = EMPTY_PLOT_CONFIG.makeTask(2, ['area', 'perimeter'])
    expect(t.work).toEqual(explainBeats(t.r).map(b => b.say))
  })
})

// ────────────────────────────────────────────────────────────────────────────────────────
describe('THE HAND — hands apart to show how far back it goes', () => {
  /**
   * ⚠️ THE FIRST SCORED SPAN IN THE BAND, AND THE ARITHMETIC IS THE JUSTIFICATION. The Height Bar
   * wanted this gesture and could not have it: two palms carry ~±0.028 of frame width between them,
   * which on a 0–60 INCH scale is ±2.3 in — answers one inch apart sit inside the noise and a child
   * who KNEW the answer could not enter it. Whole metres are ~12× coarser, so the same noise is
   * ±0.37 m against a 1 m step. Everything below is that claim, checked.
   */
  /** ±0.028 of frame width between two palms ÷ ~0.111 of frame per hand width = ±0.25 hand widths */
  const NOISE_M = 0.25 * M_PER_HAND

  it('a hand settled on a step cannot be flipped by its own noise', () => {
    // ⚠️ A hand settled on step C sees raw values up to STEP/2 + noise away from C, so the hold band
    // has to exceed that or the reading dithers, the dwell resets on every flip and the camera is a
    // dead button. 0.62 of a step was the Angle Shop's first guess and it flips.
    expect(HOLD_M).toBeGreaterThan(0.5 + NOISE_M)
  })

  it('⚠️ and the sweep JITTERS ACROSS A BOUNDARY, not around a centre', () => {
    // jitter about a bucket centre never crosses anything and passes with the hysteresis deleted —
    // that version was written first elsewhere in this repo and proved nothing
    for (let step = 1; step < HAND_MAX_M; step++) {
      for (let raw = step + 0.5 - NOISE_M; raw <= step + 0.5 + NOISE_M; raw += 0.01) {
        expect(snapMetres(raw, step), `settled on ${step}, raw ${raw.toFixed(2)}`).toBe(step)
      }
      // and it DOES move when the hand really reaches the next metre's own centre
      expect(snapMetres(step + 1, step)).toBe(step + 1)
      expect(snapMetres(step - 1, step)).toBe(Math.max(1, step - 1))
    }
  })

  it('every depth the generator can draw is reachable with two hands', () => {
    // ⚠️ A round whose answer the surface cannot express is unanswerable, which is worse than a wrong
    // one. Swept over the whole generator rather than the case I had in mind.
    for (const d of ALL) {
      const spanInHands = d.depth / M_PER_HAND
      expect(spanInHands, `${d.depth} m is not a span`).toBeGreaterThanOrEqual(SPAN_MIN_HANDS)
      expect(spanInHands, `${d.depth} m is off the frame`).toBeLessThanOrEqual(SPAN_MAX_HANDS)
      expect(snapMetres(spanMetres(spanInHands), null)).toBe(d.depth)
      expect(d.depth).toBeLessThanOrEqual(HAND_MAX_M)
    }
  })

  it('⚠️ the two inputs reach EXACTLY the same depths — neither can answer what the other cannot', () => {
    // the walk bound and the span's ceiling are one number: at 12 the tap path could peg 11 and 12
    // while a hand could not express them, which is the one-instrument-two-inputs rule quietly broken
    expect(MAX_DEPTH).toBe(HAND_MAX_M)
    expect(snapMetres(spanMetres(SPAN_MAX_HANDS), null), 'the widest span is the walk bound').toBe(MAX_DEPTH)
  })

  it('hands together is not a length, and one hand is not a span', () => {
    expect(spanMetres(SPAN_MIN_HANDS - 0.01)).toBeNull()
    expect(spanMetres(null)).toBeNull()
    const ready = EMPTY_PLOT_CONFIG.hand!.ready!
    expect(ready(hand(3))).toBe(true)
    expect(ready(hand(3, 1)), 'one hand in frame').toBe(false)
    expect(ready(hand(null)), 'no hands').toBe(false)
    expect(ready(hand(0.2)), 'palms together').toBe(false)
  })

  it('the reading self-clears when the hands leave, so the next round starts fresh', () => {
    expect(readMetres(hand(4 / M_PER_HAND))).toBe(4)
    expect(readMetres(hand(null))).toBeNull()
    // …and does not carry the old step back in on a NEW gesture
    expect(readMetres(hand(7 / M_PER_HAND))).toBe(7)
  })

  it('and it is idempotent, because the ring and the ghost both call it', () => {
    const r = hand(5 / M_PER_HAND)
    expect(readMetres(r)).toBe(readMetres(r))
  })

  it('the peg goes where the hands say, and one gesture is one peg', () => {
    const t = EMPTY_PLOT_CONFIG.makeTask(1, ['area', 'perimeter'])
    const v = EMPTY_PLOT_CONFIG.hand!.enter!(t, START, 5)
    expect(v).toEqual({ back: 5, pegged: true, laid: false })
    expect(EMPTY_PLOT_CONFIG.hand!.commits!(t, v)).toBe(true)
  })

  it('⚠️ the hand owns the continuous value, so the walk buttons go with the camera on', () => {
    // a step pressed beside a live reading is overwritten before the finger leaves the button
    expect(CODE).toMatch(/\{!reveal && !onCam && \(/)
    expect(CODE).toMatch(/const onCam = input === 'hand'/)
  })

  it('⚠️ the ghost says only what was READ — never whether it is right', () => {
    const ghost = CODE.slice(CODE.indexOf('{ghost !== null'), CODE.indexOf('{shown && laid.map'))
    for (const leak of ['gradePeg', 'r.depth', 'correct', 'mint']) expect(ghost).not.toContain(leak)
    // and it is gone the moment the peg is in, so it never sits beside the verdict
    expect(ghost).toContain('!v.pegged')
    expect(ghost).toContain('!shown')
  })

  it('⚠️ every line naming a gesture is worded for the input in front of the child', () => {
    // "walk back and peg it" reads perfectly and addresses somebody else's surface once the child is
    // answering with their arms. Asserted POSITIVELY in both directions, or a renderer that ignores
    // its input passes every other check.
    expect(instructionFor('tap')).not.toMatch(/hands|hold/i)
    expect(instructionFor('hand')).not.toMatch(/\bwalk\b|\bpeg\b|button/i)
    expect(instructionFor('tap')).not.toBe(instructionFor('hand'))
    expect(CODE).toMatch(/instructionFor\(onCam \? 'hand' : 'tap'\)/)
    // the hand's own states are named too — a child seeing nothing move needs to know why
    const hint = EMPTY_PLOT_CONFIG.hand!.hint!
    expect(hint(hand(null))).toMatch(/both hands/i)
    expect(hint(hand(3))).toMatch(/still/i)
    expect(EMPTY_PLOT_CONFIG.hand!.denied).toMatch(/buttons/)
  })

  it('reads the SPAN and nothing else — a chapter that wants one reading must not ask for two', () => {
    expect(EMPTY_PLOT_CONFIG.hand!.reads).toBe('span')
  })
})

// ────────────────────────────────────────────────────────────────────────────────────────
describe('the chapter is wired', () => {
  it('is a 9–11 chapter on the shell: ten rounds, no resume, its own band', () => {
    expect(EMPTY_PLOT_CONFIG.band).toBe('9-11')
    expect(EMPTY_PLOT_CONFIG.chapterId).toBe('areaPerimeter')
  })

  it('the registry points at the new chapter and the 3D one is GONE', () => {
    const reg = readFileSync(join(process.cwd(), 'src/features/chapters/registry.tsx'), 'utf8')
    expect(reg).toMatch(/areaPerimeter: teen\(/)
    expect(reg).toMatch(/games\/EmptyPlotGame/)
    const story = readFileSync(join(process.cwd(), 'src/features/chapters/storyChapters.tsx'), 'utf8')
    expect(story).not.toMatch(/areaPerimeter/)
    expect(story).not.toMatch(/FloorPlot/)
    const page = readFileSync(join(process.cwd(), 'src/app/story/page.tsx'), 'utf8')
    expect(page).not.toMatch(/area: 'areaPerimeter'/)
  })

  it('nothing anywhere still imports the deleted 3D chapter or its site generator', () => {
    for (const f of ['src/features/chapters/storyChapters.tsx', 'src/features/chapters/registry.tsx']) {
      const s = readFileSync(join(process.cwd(), f), 'utf8')
      expect(s).not.toMatch(/plotSite/)
    }
  })

  it('the chapter hint no longer describes the grid this deletes', () => {
    const ch = readFileSync(join(process.cwd(), 'src/core/chapters.ts'), 'utf8')
    const row = ch.split('\n').find(l => l.includes("id: 'areaPerimeter'"))!
    expect(row).not.toMatch(/Count squares/)
  })

  it('adds no 3D of any kind, and exactly TWO image assets — the two demo films', () => {
    for (const bad of [/\.glb/, /\.gltf/, /three/, /useFrame/, /Canvas/, /useLoader/, /TextureLoader/]) {
      expect(CODE).not.toMatch(bad)
    }
    // ⚠️ the asset list is pinned, not merely bounded: a chapter that quietly grows a third strip has
    // grown a third fixed example, and a film only ever says one set of numbers
    const assets = [...CODE.matchAll(/'(\/assets\/[^']+)'/g)].map(m => m[1]).sort()
    expect(assets).toEqual(['/assets/explain/plot_area.png', '/assets/explain/plot_perimeter.png'])
  })
})
