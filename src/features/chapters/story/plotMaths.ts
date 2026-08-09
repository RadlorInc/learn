/**
 * The MATHS behind the first-person area & perimeter chapter (`FloorPlot.tsx`) — **PEG IT OUT**.
 *
 * Split out for the same reason `clock.ts`, `market.ts` and `slice.ts` are: the gate has to drive the
 * SAME functions the scene renders and grades from, and it cannot import a module that pulls in
 * three.js and a WebGL canvas to do it. Nothing here knows about 3D — and in a 3D chapter that
 * matters more than usual, because `useFrame` is not drivable headlessly, so anything left in the
 * scene cannot be gated at all.
 *
 * ⚠️ THREE MECHANICS WERE BUILT AND REJECTED BEFORE THIS ONE, ALL FOR ONE REASON. Read this before
 * "improving" it back toward any of them.
 *   ① Lay tiles onto the plot until it is full. The PLOT decides when to stop: cover every square,
 *      hand it over, and you are right, having covered a rectangle without working anything out.
 *   ② Pace the sides, fetch a barrow of tiles from a store, tip it out. The child only ever
 *      assembles a PILE whose size is the answer, and the barrow does the adding for them (tap
 *      "a row" three times and the tally counts 4, 8, 12). And a re-tippable barrow makes the plot a
 *      yes/no oracle: a dozen tiles falls out of about four guesses.
 *   **A TILE IS THE UNIT OF AREA, so any mechanic where the child handles tiles hands them a
 *   countable pile and something other than their head does the arithmetic.**
 *
 * ③ SO: THE PLOT DOES NOT EXIST UNTIL THE CHILD MAKES IT. The foreman gives a NUMBER and the road
 *    frontage — *"24 tiles, and 4 metres along the road"* — and the child walks back into the empty
 *    yard and drops a peg where the far edge belongs. There is nothing on the ground to count, no
 *    pile to assemble, and no running product anywhere: the only readout is how far they have paced,
 *    which is their own measuring. To stop in the right place they have to work out `24 ÷ 4`.
 *    The units are laid AFTER the commit, as the consequence.
 *
 *    This is the one shape that passes delete-the-art, and it is why the chapter is 3D at all: the
 *    answer is a PLACE, and a place cannot be offered as a chip. Any mechanic whose answer is a
 *    NUMBER is a number pad with a world painted behind it.
 *
 * ⚠️ The generator picks `frontage` and `depth` FIRST and derives the target from them, so the answer
 * is always a whole number of metres — never a division that does not come out. A perimeter target is
 * `2 × (f + d)`, always even, so `target ÷ 2 − f` is whole too.
 */
import { rint } from '@/core/rand'

export type QType = 'area' | 'perimeter'

export interface PlotRound {
  qType: QType
  /** The road side. GIVEN by the foreman and already pegged on the ground — part of the question. */
  frontage: number
  /** What the child has to work out and then pace. NEVER stated anywhere before the commit. */
  depth: number
  /** Tiles to use up, or metres of fencing on the lorry. Also given. */
  target: number
  unitWord: string
  tag: string
  prompt: string
  say: string
  /**
   * Drives the procedural site. Taken from the ROUND INDEX, never a clock and never `Math.random`,
   * so the world is identical on a re-teach replay, in a gate and in a screenshot — and so
   * consecutive rounds are guaranteed to differ rather than merely likely to.
   */
  seed: number
}

/**
 * ⚠️ DIFFICULTY GROWS THE SKILL, NOT ONLY THE MAGNITUDE — and cut ③ failed this line of the
 * pedagogy contract, which is the one substantive thing wrong with the mechanic as it was cut. It
 * drew both sides from one widening range (`[2,5] → [3,7] → [3,9]`), so a harder tier meant bigger
 * numbers and nothing else.
 *
 * The taught thing here is a DIVISION, and what makes a division hard is the DIVISOR — so the
 * divisor is an explicit tier term. At L1 the frontage is 2–4, i.e. inside the tables a nine-year-old
 * actually has; L3 opens up 6, 7, 8, 9, which are the ones that need working out. Exported so the
 * gate asserts the ladder rather than re-implementing it.
 */
export const TIERS = {
  1: { frontage: [2, 4], depth: [2, 5] },
  2: { frontage: [3, 6], depth: [2, 7] },
  3: { frontage: [4, 9], depth: [3, 9] },
} as const satisfies Record<1 | 2 | 3, { frontage: readonly [number, number]; depth: readonly [number, number] }>

/**
 * How many steps of arithmetic a reading costs. The second explicit skill term: an area round is one
 * division, a perimeter round is halve-then-subtract. Same gesture, two different sums — which is
 * what stops either being eliminated into.
 */
export const stepsFor = (q: QType): 1 | 2 => (q === 'area' ? 1 : 2)

const pick = <T,>(a: readonly T[]): T => a[rint(0, a.length - 1)]

/**
 * ⚠️ `asked` is spent DELIBERATELY while a reading is unmet and RANDOMLY once both have been served.
 * Mastery fires after ~3 rounds at L1, ONE at L2 and TWO at L3, so a coin-flip generator misses one
 * of the two readings about a third of the time (TickTock measured exactly this). Hardest-first for
 * ever would be worse: it locks the generator onto one reading and destroys the variety `coverage`
 * exists to protect.
 */
export function makeRound(d: 1 | 2 | 3, round = 0, asked: readonly string[] = []): PlotRound {
  const tier = TIERS[d] ?? TIERS[1]
  const frontage = rint(tier.frontage[0], tier.frontage[1])
  const depth = rint(tier.depth[0], tier.depth[1])

  const unmet = (['area', 'perimeter'] as QType[]).filter(k => !asked.includes(k))
  const qType = unmet.length === 1 ? unmet[0] : pick<QType>(['area', 'perimeter'])

  const seed = round + 1
  return qType === 'area'
    ? {
        qType, frontage, depth, target: frontage * depth, unitWord: 'tiles', seed,
        tag: 'Floor it',
        prompt: `${frontage} metres along the road, and ${frontage * depth} tiles to use up. Peg the far edge.`,
        say: `We have ${frontage * depth} tiles for this floor, and it runs ${frontage} metres along the road. Walk back and peg the far edge.`,
      }
    : {
        qType, frontage, depth, target: 2 * (frontage + depth), unitWord: 'metres of fence', seed,
        tag: 'Fence it',
        prompt: `${frontage} metres along the road, and ${2 * (frontage + depth)} metres of fence. Peg the far edge.`,
        say: `We have ${2 * (frontage + depth)} metres of fence, and it runs ${frontage} metres along the road. Walk back and peg the far edge.`,
      }
}

/** The one thing being asked. A peg is right only where the far edge really belongs. */
export function gradePeg(d: PlotRound, pegged: number): boolean {
  return pegged === d.depth
}

/**
 * The written miss line. Names what is wrong with the WORK, never the depth they were after — and
 * never the arithmetic either, or it becomes the answer one step along.
 */
export function missFor(d: PlotRound, pegged: number): string {
  const short = pegged < d.depth
  if (d.qType === 'area') {
    return short
      ? 'Too near the road — that floor does not use all the tiles up. There are some left over.'
      : 'Too far back — there are not enough tiles to reach the peg. Part of it would be bare.'
  }
  return short
    ? 'Too near the road — a fence round that would leave some still on the lorry.'
    : 'Too far back — the fence runs out before it gets all the way round.'
}

/**
 * ⚠️ ONE PEG PER SCORED ROUND, AND IT IS WHAT MAKES THE ARITHMETIC NECESSARY.
 *
 * Any commit the child can repeat is a yes/no oracle, however warmly the miss is worded — peg,
 * read "too near", step back, peg again, and the answer falls out of a handful of tries with
 * nothing worked out. So a scored round settles on the FIRST peg, right or wrong. Walking back and
 * forth BEFORE the commit is free and costs nothing, which is where the deciding belongs.
 * The guided round keeps its retry: it is unscored teaching.
 */
export function settleAfterPeg(mode: 'guided' | 'practice', pegged: number, d: PlotRound): { right: boolean; over: boolean } {
  const right = gradePeg(d, pegged)
  return { right, over: right || mode === 'practice' }
}

/** Every slot a unit fills once the plot is pegged. Its LENGTH is the target, by construction. */
export function slotsFor(d: PlotRound): string[] {
  const out: string[] = []
  if (d.qType === 'area') {
    for (let j = 0; j < d.depth; j++) for (let i = 0; i < d.frontage; i++) out.push(`a:${i}:${j}`)
  } else {
    for (let i = 0; i < d.frontage; i++) { out.push(`p:t:${i}`); out.push(`p:b:${i}`) }
    for (let j = 0; j < d.depth; j++) { out.push(`p:l:${j}`); out.push(`p:r:${j}`) }
  }
  return out
}

/** Where a slot sits in the world. 1 unit = 1 metre = 1 tile. The road is z = 0. */
export function slotPos(d: PlotRound, slot: string): [number, number, number] {
  const p = slot.split(':')
  if (p[0] === 'a') return [Number(p[1]) + 0.5, 0.06, Number(p[2]) + 0.5]
  const i = Number(p[2])
  if (p[1] === 't') return [i + 0.5, 0.3, 0]
  if (p[1] === 'b') return [i + 0.5, 0.3, d.depth]
  if (p[1] === 'l') return [0, 0.3, i + 0.5]
  return [d.frontage, 0.3, i + 0.5]
}

/** The reveal, and the ONLY place the equation is ever written. Shown after the peg, never before. */
export function equationFor(d: PlotRound): string {
  return d.qType === 'area'
    ? `${d.frontage} × ${d.depth} = ${d.target}`
    : `2 × (${d.frontage} + ${d.depth}) = ${d.target}`
}

/** How far back a child may walk. Bounded so a peg is always reachable and the yard stays legible. */
export const MAX_DEPTH = 12

/**
 * Where the child starts: back on the ROAD, looking down the empty yard they have to peg out — far
 * enough that the whole frontage and its numeral are in view. Standing on the frontage line itself put
 * the label 45 cm from their face and filled the screen with it.
 */
export const SPAWN_Z = -3.4

/**
 * Where the foreman stands. Exported because the scene draws him here AND the site generator must keep
 * props off him — two places needing one number, which is how a prop ended up inside him once already.
 *
 * ⚠️ Checked by ANGLE from the spawn stance, against the HORIZONTAL half-FOV (~47° at 16:9, not the
 * ~31° the vertical `fov` suggests). The craft rule is that the speaker is on screen whenever their
 * bubble is, and this has now been got wrong three ways:
 *   • `[f + 1.8, −1.1]` → ~59° off-axis. Entirely off screen while his own bubble was up.
 *   • `[f + 1.3, 0.4]` → visible at ~41°, but 5 m out and hard against the frame edge: a big orange
 *     blob rather than a person.
 *   • `[f + 1.3, 2.2]` → fine on a narrow plot and **~46° at a 9-metre frontage, i.e. back at the
 *     edge.** The trap: he stands beside the plot, so his LATERAL offset from the camera is
 *     `frontage/2 + 1.3` and GROWS with the plot, while a fixed `z` keeps the forward distance
 *     constant. The angle therefore gets worse exactly where the plot is widest.
 * So the forward distance scales with the frontage too, holding the angle at 19–31° across every
 * frontage the generator can draw. The gate sweeps all of them rather than checking the one I had in
 * mind — which is how the third version was caught.
 */
export const miloSpot = (frontage: number): [number, number] => [frontage + 1.3, 2.2 + frontage * 0.45]
/** Nothing may be generated within this of him, or he stands inside a van while talking. */
export const MILO_CLEAR = 1.5

// ── The demo, as data ───────────────────────────────────────────────────────────────────────────
export interface ExplainBeat {
  say: string
  /** ROAD stands on the frontage looking down the empty yard; SIDE stands off −X so depth reads as a length. */
  view: 'road' | 'side'
  camZ: number
  depth: number
  pegged: number | null
  laid: boolean
}

/**
 * The demo and re-teach beats, out here rather than in the scene for two reasons: the gate cannot
 * import a module that pulls in three.js, and —
 *
 * ⚠️ THE DEMO'S NUMBERS MUST AGREE WITH ITS OWN SENTENCES. The Supply Run shipped a beat that SAID
 * the remainder stayed behind while the picture put it in a van, and nothing could see it because
 * every line was individually true and the beat list was component-local. This list is exported so a
 * test drives the same beats the demo plays.
 *
 * ⚠️ The SIDE view has to be off the LEFT (−X): Milo the foreman stands off +X, and from that side he
 * sat right in the lens. Viewpoints derive from forward = (−sin yaw, 0, −cos yaw), not from guessing.
 */
export function explainBeats(d: PlotRound): ExplainBeat[] {
  const { frontage: f, depth: dep, target, qType } = d
  const q = qType === 'area'
    ? `${target} tiles, and ${f} metres along the road.`
    : `${target} metres of fence, and ${f} metres along the road.`
  const work = qType === 'area'
    ? `${target} tiles, in rows of ${f}. ${target} divided by ${f} is ${dep}. So it goes ${dep} metres back.`
    : `Two sides of ${f} is ${f * 2}. That leaves ${target - f * 2} for the other two, so each one is ${dep}.`
  return [
    { say: `The foreman wants ${q}`, view: 'road', camZ: SPAWN_Z, depth: 0, pegged: null, laid: false },
    { say: 'The yard is empty. There is nothing out there to count — I have to work it out.', view: 'road', camZ: SPAWN_Z, depth: 0, pegged: null, laid: false },
    { say: work, view: 'road', camZ: SPAWN_Z, depth: 0, pegged: null, laid: false },
    { say: `So I walk back, counting my metres. ${Array.from({ length: dep }, (_, i) => i + 1).join(', ')}.`, view: 'road', camZ: dep - 0.5, depth: dep, pegged: null, laid: false },
    { say: 'And that is where the peg goes.', view: 'side', camZ: dep - 0.5, depth: dep, pegged: dep, laid: false },
    { say: `And it comes out to the metre. ${equationFor(d).replace('×', 'times').replace('+', 'plus')}.`, view: 'side', camZ: dep - 0.5, depth: dep, pegged: dep, laid: true },
  ]
}

/** One of each reading, small, so the demo teaches both sums before anything is scored. */
export const DEMO: PlotRound[] = [
  { qType: 'area', frontage: 4, depth: 3, target: 12, unitWord: 'tiles', tag: 'Floor it', seed: 1,
    prompt: '4 metres along the road, and 12 tiles to use up.', say: 'Watch this one first.' },
  { qType: 'perimeter', frontage: 5, depth: 2, target: 14, unitWord: 'metres of fence', tag: 'Fence it', seed: 2,
    prompt: '5 metres along the road, and 14 metres of fence.', say: 'Now a fence — same walk, different sum.' },
]

export const GUIDED: PlotRound = {
  qType: 'area', frontage: 3, depth: 3, target: 9, unitWord: 'tiles', tag: 'Floor it', seed: 3,
  prompt: 'Your turn — 3 metres along the road, and 9 tiles. Peg the far edge.',
  say: 'Your turn. Nine tiles, three metres along the road. Work out how far back it goes, then walk it and peg it.',
}
