/**
 * The MATHS behind the area & perimeter chapter (`teen/games/EmptyPlotGame.tsx`) — **PEG IT OUT**.
 *
 * ⚠️ THE 3D IS GONE (founder's call, 2026-08-15: *"totally remove that 3d concept"*, as part of
 * putting the whole 9–11 band on GameShell). The chapter was a first-person react-three-fiber yard
 * you walked with a stick; it is now a PLAN VIEW of the same yard on the shared shell, and
 * `FloorPlot.tsx` (1,380 lines) + `plotSite.ts` (628 lines of procedural site) are deleted.
 * **The verb did not change**, which is why this module survives almost whole: the foreman still
 * gives a number and the frontage, the yard is still empty, and the child still has to work out how
 * far back the far edge goes and put a peg there.
 *
 * ⚠️ AND THE PORT PAYS FOR ITSELF IN THE ONE PLACE THIS CHAPTER KEPT FAILING — *the camera must go
 * back and look at what was built*. In first person the child pegs facing AWAY from the road, so
 * every tile the delivery then laid was behind them and a miss read *"part of it would be bare"* over
 * an empty green field. A plan view has the whole plot on screen at every instant, right and wrong,
 * with nothing to swing round to.
 *
 * Split out for the same reason `clock.ts`, `market.ts` and `slice.ts` are: the gate has to drive the
 * SAME functions the chapter renders and grades from.
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
 *    This is the one shape that passes delete-the-art, and the answer stays a PLACE — which is what
 *    a chip cannot be. Any mechanic whose answer is a NUMBER is a number pad with a world painted
 *    behind it, and that is still true on a flat board: the peg is somewhere on the ground, the
 *    reveal is what the delivery lays into the plot the child pegged, and the only figure on screen
 *    before the commit is how far they have paced.
 *
 * ⚠️ The generator picks `frontage` and `depth` FIRST and derives the target from them, so the answer
 * is always a whole number of metres — never a division that does not come out. A perimeter target is
 * `2 × (f + d)`, always even, so `target ÷ 2 − f` is whole too.
 */
import { rint, pick } from '@/core/rand'

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


/**
 * ⚠️ `asked` is spent DELIBERATELY while a reading is unmet and RANDOMLY once both have been served.
 * Mastery fires after ~3 rounds at L1, ONE at L2 and TWO at L3, so a coin-flip generator misses one
 * of the two readings about a third of the time (TickTock measured exactly this). Hardest-first for
 * ever would be worse: it locks the generator onto one reading and destroys the variety `coverage`
 * exists to protect.
 */
export function makeRound(d: 1 | 2 | 3, asked: readonly string[] = []): PlotRound {
  const tier = TIERS[d] ?? TIERS[1]
  const frontage = rint(tier.frontage[0], tier.frontage[1])
  const depth = rint(tier.depth[0], tier.depth[1])

  const unmet = (['area', 'perimeter'] as QType[]).filter(k => !asked.includes(k))
  const qType = unmet.length === 1 ? unmet[0] : pick<QType>(['area', 'perimeter'])

  return qType === 'area'
    ? {
        qType, frontage, depth, target: frontage * depth, unitWord: 'tiles',
        tag: 'Floor it',
        prompt: `${frontage} metres along the road, and ${frontage * depth} tiles to use up. Peg the far edge.`,
        say: `We have ${frontage * depth} tiles for this floor, and it runs ${frontage} metres along the road. Walk back and peg the far edge.`,
      }
    : {
        qType, frontage, depth, target: 2 * (frontage + depth), unitWord: 'metres of fence',
        tag: 'Fence it',
        prompt: `${frontage} metres along the road, and ${2 * (frontage + depth)} metres of fence. Peg the far edge.`,
        say: `We have ${2 * (frontage + depth)} metres of fence, and it runs ${frontage} metres along the road. Walk back and peg the far edge.`,
      }
}

/**
 * The two halves of the question, as the board draws them — zone 1 (what the numbers ARE) and the
 * figures themselves.
 *
 * ⚠️ THEY LIVE HERE RATHER THAN IN THE CHAPTER SO THE ANTI-ORACLE SWEEP CAN REACH THEM. The rule is
 * that nothing states the answer before the commit, and it has to hold over *every string a child
 * can see while deciding* — a sentence built inside a component is one no gate can read.
 * ⚠️ AND NEITHER MAY NAME THE DEPTH, however helpfully: it is the whole question.
 */
export const badgeFor = (d: PlotRound): string =>
  d.qType === 'area' ? `${d.target} tiles` : `${d.target} m of fence`
export const contextFor = (d: PlotRound): string =>
  `The lorry has ${d.target} ${d.unitWord}. The plot runs ${d.frontage} metres along the road.`

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
 * nothing worked out. Walking back and forth BEFORE the commit is free, which is where the deciding
 * belongs.
 *
 * ⚠️ THIS USED TO BE A FUNCTION HERE (`settleAfterPeg`) AND IS NOW A PROPERTY OF THE SHELL — the
 * bespoke chapter owned its own feedback and had to refuse the second peg itself; `GameShell` grades
 * on the commit and moves to the reveal, so a scored round cannot be re-pegged at all. Deleted
 * rather than left as dead code that reads like a guarantee. The gate asserts the shell's shape
 * instead, which is where the rule now lives.
 */

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

/**
 * Where a slot sits on the plan, in UNIT coordinates: x runs along the road, y runs back into the
 * yard, and the road itself is y = 0. A tile is a 1×1 box; a fence panel is a 1×0 or 0×1 edge.
 *
 * ⚠️ IT TAKES THE ROUND SO THE FAR AND RIGHT EDGES COME FROM THAT ROUND'S OWN DEPTH — the reveal
 * lays units into the plot the CHILD pegged (`{ ...d, depth: pegged }`), never the one they should
 * have, which is what makes a miss a consequence rather than a verdict.
 */
export interface SlotBox { x: number; y: number; w: number; h: number }
export function slotBox(d: PlotRound, slot: string): SlotBox {
  const p = slot.split(':')
  if (p[0] === 'a') return { x: Number(p[1]), y: Number(p[2]), w: 1, h: 1 }
  const i = Number(p[2])
  if (p[1] === 't') return { x: i, y: 0, w: 1, h: 0 }
  if (p[1] === 'b') return { x: i, y: d.depth, w: 1, h: 0 }
  if (p[1] === 'l') return { x: 0, y: i, w: 0, h: 1 }
  return { x: d.frontage, y: i, w: 0, h: 1 }
}

/** The reveal, and the ONLY place the equation is ever written. Shown after the peg, never before. */
export function equationFor(d: PlotRound): string {
  return d.qType === 'area'
    ? `${d.frontage} × ${d.depth} = ${d.target}`
    : `2 × (${d.frontage} + ${d.depth}) = ${d.target}`
}

/**
 * How far back a child may walk.
 *
 * ⚠️ TEN, NOT TWELVE, AND THE NUMBER IS DECIDED BY TWO THINGS AT ONCE. The deepest answer the
 * generator draws is 9, so ten still allows the overshoot that makes a "too far back" peg possible —
 * and it is exactly `HAND_MAX_M`, the deepest a two-hand span can express. At twelve the tap path
 * could reach two depths the camera path could not, which is the one-instrument-two-inputs rule
 * quietly broken. It also buys the live yard ~20% more metre: the plan reserves the whole walk from
 * empty, so this bound IS the scale everything before the peg is drawn at.
 */
export const MAX_DEPTH = 10

// ── The plan's scale ────────────────────────────────────────────────────────────────────────────
/**
 * How much of the yard is on screen, and how big a metre is.
 *
 * ⚠️ OUT HERE RATHER THAN IN THE COMPONENT BECAUSE IT IS AN ANTI-ORACLE RULE, NOT A STYLE CHOICE.
 * While the round is live the visible depth is the walk bound on EVERY round alike — if it were the
 * round's own depth the box's height would BE the answer, drawn instead of written. Only once the peg
 * is in (`pegged !== null`) does the plan close up on what was actually built, which is the craft
 * rule's *go back and look at what was made*, done with the scale instead of a camera.
 *
 * ⚠️ AND THE METRE IS DERIVED FROM THE BOX, NOT TYPED. At a fixed 22px a metre, a 5 × 2 plot filled
 * 14% of a box drawn for twelve metres and `FitSlot` shrank the lot — founder: *"the size is too small
 * bro."* Deriving it means a narrow plot gets a big metre, the instrument is always the same size in
 * the layout, and nothing jumps.
 */
export const visibleDepth = (pegged: number | null, depth: number): number =>
  pegged === null ? MAX_DEPTH : Math.max(pegged, depth) + 1
export const metreOf = (frontage: number, visible: number, boxW: number, boxH: number): number =>
  Math.floor(Math.min(boxW / frontage, boxH / visible))

/**
 * The road band's layout — its height, and where the frontage numeral sits in it.
 *
 * ⚠️ THIS BAND HAS NOW COLLIDED TWICE, WHICH IS WHY IT IS ARITHMETIC RATHER THAN THREE TYPED OFFSETS.
 * It holds three things that all want the same strip: the word ROAD, the frontage numeral, and the
 * top of the walker standing on the line. First the numeral was drawn straight across ROAD; then,
 * once the walker grew with the metre, his head was drawn across the numeral. Each element was
 * individually centred and individually correct both times.
 *
 * So the band is DERIVED from what has to fit in it, and the gate sweeps every metre the generator
 * can produce rather than the one size somebody looked at.
 */
/**
 * ⚠️ THE GAP IS 8, NOT 3, AND THE REASON IS THAT AN EMOJI'S BOX IS NOT ITS INK. Modelled at 3 the
 * arithmetic said the walker cleared the numeral and the DOM said he overlapped it by 2px: a glyph's
 * line box carries leading the font size does not describe, and `FitSlot` then scales the whole lot
 * down (~0.64 on a portrait frame), so a 3px clearance arrives as under 2. Measure the rendered box,
 * not the size you asked for — this file's own *draw from the ink box, not the file box*.
 */
export const ROAD_TEXT_TOP = 4, ROAD_TEXT_H = 16, ROAD_GAP = 12

/**
 * Every marker on the plan, sized from the metre.
 *
 * ⚠️ THEY WERE TYPED PIXEL SIZES AND THE METRE STOPPED BEING ONE. Once the box began deriving the
 * metre, a 56px metre still drew the child's own character at 16px — a third of a metre tall, and
 * invisible. Founder: *"kitna chota dekh raha hai .. yeh character."* The floors keep them legible on
 * the widest plot, where the metre is smallest.
 * ⚠️ AND IT IS EXPORTED SO THE GATE DRIVES THE SHIPPED NUMBERS. A sweep that recomputes these cannot
 * see the component going back to a constant — the fault this file has now paid for twice.
 */
export const markers = (u: number) => ({
  /** the walker is about a metre tall on the plan — a marker, not a scale claim */
  walker: Math.max(30, Math.round(u * 1.05)),
  peg: Math.max(24, Math.round(u * 0.8)),
  /** the two posts already in the ground at the ends of the frontage */
  post: Math.max(10, Math.round(u * 0.26)),
  num: Math.max(17, Math.round(u * 0.36)),
})
/**
 * The same band when the plan runs the OTHER way — road down the left, depth across.
 *
 * ⚠️ THE PLAN TURNS WITH THE SCREEN, because a shape that is right for a phone is wrong for a laptop.
 * Founder: *"laptop screen pe yeh ek proper horizontal rectangle mein dikhe … abhi woh vertical mein
 * hai, joh phone ke liye sahi."* The walkable depth is the long axis, so on a landscape frame it has
 * to be the HORIZONTAL one or the plan is a tall sliver in a wide slot and every metre pays for it.
 * This is *reflow, not a smaller scale* — the rule this repo already has for a tall board in a short
 * band.
 *
 * The strip's thickness has to hold the numeral AND clear the walker, who straddles the frontage line
 * — the same two clearances as the horizontal band, on the other axis.
 */
/**
 * Unit-space → pixels, for whichever way the plan is facing. `across` runs along the road, `deep`
 * runs into the yard, and turning the plan swaps which of them is horizontal.
 *
 * ⚠️ ONE MAPPER, AND IT IS OUT HERE SO THE GATE CAN DRIVE IT. Written inline in the component, the
 * only thing a check could do was grep for the ternary — and mutation-testing showed a tile grid that
 * had stopped turning with the plan sailed straight through, because the box sizes and the metre were
 * still correct. The drawing has to be the thing under test.
 */
export const planXY = (land: boolean, across: number, deep: number, u: number) =>
  land ? { left: deep * u, top: across * u } : { left: across * u, top: deep * u }

export function roadStrip(numPx: number, walkerPx: number, floor = 50) {
  const overhang = Math.round(walkerPx / 2)
  /** the numeral is right-aligned in this box, so it cannot reach the walker whatever the text is */
  const numBox = Math.max(floor - overhang - ROAD_GAP, numPx * 3)
  return { width: numBox + ROAD_GAP + overhang, numBox, overhang }
}

export function roadBand(numPx: number, walkerPx: number, floor = 50) {
  /** how far the walker's head reaches ABOVE the frontage line he stands on */
  const head = Math.round(walkerPx * 0.62)
  const height = Math.max(floor, ROAD_TEXT_TOP + ROAD_TEXT_H + ROAD_GAP + numPx + ROAD_GAP + head)
  /** the numeral's top, measured DOWN from the frontage line (negative = above it) */
  const numTop = -(head + ROAD_GAP + numPx)
  return { height, numTop, head }
}

// ── The hand: HOLD YOUR HANDS APART TO SHOW HOW FAR BACK IT GOES ────────────────────────────────
/**
 * ⚠️ THE BAND'S SPECIALITY ARRIVES IN THIS CHAPTER AS A LENGTH SHOWN AS A LENGTH, and it is the
 * first time that gesture has been allowed to carry a SCORED answer here. That is arithmetic rather
 * than nerve, and the arithmetic is the whole justification:
 *
 *   • The Height Bar wanted the same gesture and could not have it. Two palms carry ~±0.028 of frame
 *     width between them, which stretched onto a 0–60 INCH answer scale is **±2.3 in** — so answers
 *     one inch apart sit inside the noise and a child who KNEW the answer could not enter it, which
 *     is a dead button. It shipped there in the explore beat, where nothing is scored.
 *   • Here the answer scale is WHOLE METRES, which is roughly twelve times coarser. A hand width is
 *     ~0.111 of the frame (a webcam sees about nine across), so ±0.028 of frame is **±0.25 hand
 *     widths**, and at `M_PER_HAND` that is **±0.37 m against a 1 m step** — a step-to-noise ratio of
 *     2.7, better than the Angle Shop's tilt (5° steps on ~2.5° of landmark noise) which is live.
 *   • And it is CALIBRATION-FREE: `spanRatio` divides the gap by the child's own hand width, measured
 *     across the knuckles, so leaning back shrinks both together and the reading does not move.
 *
 * ⚠️ AND IT PASSES THE FIRST TEST — the body carries the IDEA, not the notation. Holding up N
 * fingers would STATE the depth, which turns the answer back into a number and gives up the one
 * thing three rejected cuts of this chapter were rejected to protect. Hands apart IS the far edge:
 * the plot is drawn between them and grows as they open.
 */
export const M_PER_HAND = 1.5
/** Below this the hands are together, not held apart — it is not a length yet. */
export const SPAN_MIN_HANDS = 0.6
/** Past this a palm is leaving the frame. It is the ceiling on what the gesture can express. */
export const SPAN_MAX_HANDS = 7
/** The deepest peg a hand can reach. Every depth the GENERATOR draws is inside it — swept in the gate. */
export const HAND_MAX_M = Math.floor(SPAN_MAX_HANDS * M_PER_HAND)

/** A span, in the child's own hand widths, as metres of yard. `null` while it is not a length. */
export function spanMetres(spanInHands: number | null): number | null {
  if (spanInHands === null || spanInHands < SPAN_MIN_HANDS) return null
  return spanInHands * M_PER_HAND
}

/**
 * ⚠️ A CONTINUOUS READING BEHIND A HOLD-STILL COMMIT NEEDS HYSTERESIS, AND ITS SIZE IS DERIVED FROM
 * THE NOISE RATHER THAN CHOSEN. Rounding raw metres puts a boundary every half metre, which is
 * inside the ±0.37 m the landmarks wander — so a hand held near one would dither between two
 * answers for ever, the dwell would reset on every flip, and the camera would be a dead button.
 * A hold band of a FULL step means the reading changes exactly when the hand reaches the next
 * metre's own centre. (0.62 of a step was the Angle Shop's first guess and it flips.)
 */
export const HOLD_M = 1
export function snapMetres(raw: number | null, current: number | null): number | null {
  if (raw === null) return null
  const clamp = (n: number) => Math.max(1, Math.min(HAND_MAX_M, n))
  if (current !== null && Math.abs(raw - current) < HOLD_M) return current
  return clamp(Math.round(raw))
}

/**
 * The ONE action, worded for the input in front of the child.
 *
 * ⚠️ ADDING AN INPUT MEANS RE-WORDING EVERY LINE THAT NAMES A GESTURE, and a single-mode gate cannot
 * see the miss: "walk back and peg it" reads perfectly and addresses somebody else's surface once
 * the child is answering with their arms. Gated positively in BOTH directions — the tap line must
 * not mention hands and the hand line must not mention walking.
 */
export function instructionFor(input: 'tap' | 'hand'): string {
  return input === 'hand'
    ? 'Hold your hands apart to show how far back it goes.'
    : 'Walk back to where the far edge belongs, then peg it.'
}

// ── The working, as frames ──────────────────────────────────────────────────────────────────────
/**
 * ⚠️ THE BEAT THAT DOES THE ARITHMETIC WAS THE ONE BEAT WITH A STATIC SCREEN, WHICH IS THE WHOLE
 * TEACHING HAPPENING IN AUDIO. *"12 tiles, in rows of 4. 12 divided by 4 is 3. So it goes 3 metres
 * back"* played over an empty yard and a walker who had not moved — and on most Chrome installs
 * there is no voice at all, so that beat taught nothing whatever. Founder's call: **animate the
 * explanation, and run the frames off the narration.**
 *
 * So the load is a BAR, and the working cuts it up. One widget serves both readings because both are
 * partitions of the same given number, which is also why the two sums cannot be confused:
 *   • area — `target` cut into rows of `frontage`, one row per frame, until the rows run out. The
 *     count of rows IS the answer, and the child watches it being counted.
 *   • perimeter — two lots of `frontage` taken off the top, then what is LEFT split in two.
 *
 * ⚠️ IT LIVES HERE, NOT IN THE COMPONENT, FOR THE SUPPLY RUN'S REASON: a demo whose picture
 * contradicts its own sentence is invisible to every check when the beats are component-local. The
 * gate drives these frames against the same beat's words.
 * ⚠️ AND THE BAR IS COUNTABLE, WHICH IS ONLY SAFE BECAUSE IT CANNOT REACH A SCORED ROUND. It renders
 * behind `ExplainBeat.step`, and nothing in play — not `initialValue`, not the hand's `enter`, not
 * the glide — ever sets one. That is one assertion, and it is in the gate.
 */
export interface WorkGroup { from: number; to: number; tone: 'used' | 'left' | 'each' }
export interface WorkFrame { groups: WorkGroup[]; note: string }

export function workFrames(d: PlotRound): WorkFrame[] {
  const f = d.frontage, t = d.target
  const head: WorkFrame = { groups: [], note: `${t} ${d.unitWord}` }
  if (d.qType === 'area') {
    const rows: WorkFrame[] = []
    for (let k = 1; k <= d.depth; k++) {
      const groups: WorkGroup[] = []
      for (let g = 0; g < k; g++) groups.push({ from: g * f, to: (g + 1) * f, tone: 'used' })
      rows.push({ groups, note: k === 1 ? `one row of ${f}` : `${k} rows of ${f}` })
    }
    return [head, ...rows]
  }
  const side = (n: number): WorkGroup[] =>
    Array.from({ length: n }, (_, i) => ({ from: i * f, to: (i + 1) * f, tone: 'used' as const }))
  return [
    head,
    { groups: side(1), note: `one side: ${f}` },
    { groups: side(2), note: `two sides: ${2 * f}` },
    { groups: [...side(2), { from: 2 * f, to: t, tone: 'left' }], note: `${t - 2 * f} left for the other two` },
    {
      groups: [...side(2), { from: 2 * f, to: 2 * f + d.depth, tone: 'each' }, { from: 2 * f + d.depth, to: t, tone: 'each' }],
      note: `${d.depth} each`,
    },
  ]
}

// ── The demo, as data ───────────────────────────────────────────────────────────────────────────
export interface ExplainBeat {
  say: string
  /** how far back the walk has got, live */
  depth: number
  /** is the peg in? (null until it goes in) */
  pegged: number | null
  /** has the delivery laid the units? */
  laid: boolean
  /**
   * What this beat ANIMATES, if anything — `work` cuts the load up, `walk` paces the metres out one
   * at a time. ⚠️ A beat that narrates a move must carry the thing that makes it: without this the
   * walk beat said *"counting my metres. 1, 2, 3"* while the walker slid the whole way in 180 ms,
   * and the arithmetic beat said everything and showed nothing.
   */
  step?: 'work' | 'walk'
}

/**
 * The demo and re-teach beats, out here rather than in the chapter for two reasons: the shell's
 * walkthrough takes its steps as DATA, and —
 *
 * ⚠️ THE DEMO'S NUMBERS MUST AGREE WITH ITS OWN SENTENCES. The Supply Run shipped a beat that SAID
 * the remainder stayed behind while the picture put it in a van, and nothing could see it because
 * every line was individually true and the beat list was component-local. This list is exported so a
 * test drives the same beats the demo plays.
 *
 * ⚠️ EVERY BEAT THAT NARRATES A MOVE CARRIES THE VALUE THAT MAKES IT — the walk beat really walks,
 * the peg beat really pegs, and the last beat really lays the units. Written without them the Angle
 * Shop's walkthrough said "So I turn it" over an arm that had not moved a degree.
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
    { say: `The foreman wants ${q}`, depth: 0, pegged: null, laid: false },
    { say: 'The yard is empty. There is nothing out there to count — I have to work it out.', depth: 0, pegged: null, laid: false },
    { say: work, depth: 0, pegged: null, laid: false, step: 'work' },
    { say: `So I walk back, counting my metres. ${Array.from({ length: dep }, (_, i) => i + 1).join(', ')}.`, depth: dep, pegged: null, laid: false, step: 'walk' },
    { say: 'And that is where the peg goes.', depth: dep, pegged: dep, laid: false },
    { say: `And it comes out to the metre. ${equationFor(d).replace('×', 'times').replace('+', 'plus')}.`, depth: dep, pegged: dep, laid: true },
  ]
}

/** One of each reading, small, so the demo teaches both sums before anything is scored. */
export const DEMO: PlotRound[] = [
  { qType: 'area', frontage: 4, depth: 3, target: 12, unitWord: 'tiles', tag: 'Floor it',
    prompt: '4 metres along the road, and 12 tiles to use up.', say: 'Watch this one first.' },
  { qType: 'perimeter', frontage: 5, depth: 2, target: 14, unitWord: 'metres of fence', tag: 'Fence it',
    prompt: '5 metres along the road, and 14 metres of fence.', say: 'Now a fence — same walk, different sum.' },
]

export const GUIDED: PlotRound = {
  qType: 'area', frontage: 3, depth: 3, target: 9, unitWord: 'tiles', tag: 'Floor it',
  prompt: 'Your turn — 3 metres along the road, and 9 tiles. Peg the far edge.',
  say: 'Your turn. Nine tiles, three metres along the road. Work out how far back it goes, then walk it and peg it.',
}
