'use client'
/**
 * BuildPlot — the Factoring chapter (15–16) as a PLAYABLE GAME.
 * World: laying out a rectangular plot. Its AREA is a trinomial (x² + bx + c); the
 * two SIDE LENGTHS are the factors (x + p)(x + q).
 *
 * ⚠️ WHY THE TILES ARE SIGNED — the defect this file was rebuilt to fix.
 *
 * The old model tiled the area with plain unit tiles, which is honest for
 * (x + 2)(x + 3) and a LIE for everything above it. L2 drew x² − n² and L3 drew
 * x² + 2x − 15, and you cannot tile a negative area with tiles that only add. The
 * code's own comment conceded it ("a negative side length"), and because the tiles
 * only ever appeared in the walkthrough, the child never watched the model fail —
 * they just computed the factors in their head and dialled them. That is the world
 * chosen by its easiest case, exactly the failure docs/lessons.md names.
 *
 * The fix is the standard algebra-tile treatment, costumed for a build site:
 *   • a LAID tile is ground you put down            (positive, solid)
 *   • a CUT tile is ground you take away            (negative, red + hatched)
 *   • a laid strip and a cut strip ANNIHILATE       (a zero pair)
 *
 * A factor is a side of the plot: (x + 5) is a side EXTENDED by five, (x − 3) is a
 * side CUT BACK by three. Cutting back three metres removes three x-strips AND the
 * 3 × 5 corner — so the picture is x² + 5x − 3x − 15, the three cut strips pair off
 * against three laid ones, and x² + 2x − 15 is what survives. Nothing is computed
 * off-picture; the minus sign is an action you watch.
 *
 * This is honest at EVERY tier, which is the whole point:
 *   L1  (x+2)(x+3)   two extensions      → no cut tiles at all
 *   L2  (x+3)(x−3)   extend 3, cut 3     → EVERY strip pairs off, which is *why*
 *                                          a difference of squares has no x term
 *   L3  (x+5)(x−3)   partial cancelling  → 5 laid − 3 cut leaves 2x, corner cut
 *
 * ANSWERING, gated per question (never per chapter):
 *   • BUILD  → the two sides are a PAIR, not a single number, so they keep the
 *              PartsBuilder. The tile model renders live above it, so the sides the
 *              child dials assemble the plot in front of them (see PlotScene note).
 *   • TAP    → "one side is surveyed, what number is in the other?" has a single
 *              numeric answer, so it takes the AnswerPad. Distractors are the real
 *              sign/role misconceptions, not near-misses.
 *
 * No guided round: the walkthrough works all three examples — build, cut-and-cancel,
 * and the tapped missing number — so every graded gesture has been shown first.
 */
import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, PartsBuilder, numChoices } from './parts/gameKit'
import { rint } from '@/core/rand'
import { disp } from '@/core/fmt'

const P: Palette = {
  nightTop: '#132a1f', nightBot: '#0b1a13',
  cream: '#e9f7ee', creamSoft: 'rgba(233,247,238,0.82)',
  inkOnPaper: '#14261c', mutedOnPaper: '#5f8571',
  gold: '#8fe06a', goldDeep: '#4e9e2f',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(15,34,24,0.6)', glassBorder: 'rgba(233,247,238,0.2)',
}

/** Spoken integer — the ear's version of `disp`. */
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
/** Format a side "(x + n)" / "(x − n)". */
const fac = (n: number) => (n < 0 ? `(x − ${Math.abs(n)})` : `(x + ${n})`)
/** Format the area trinomial x² + bx + c with correct signs. */
function areaExpr(b: number, c: number): string {
  let s = 'x²'
  if (b !== 0) s += b < 0 ? ` − ${Math.abs(b)}x` : ` + ${b}x`
  if (c !== 0) s += c < 0 ? ` − ${Math.abs(c)}` : ` + ${c}`
  return s
}
const sayExpr = (b: number, c: number) =>
  `x squared${b !== 0 ? `, ${b < 0 ? 'minus' : 'plus'} ${Math.abs(b)} x` : ''}${c !== 0 ? `, ${c < 0 ? 'minus' : 'plus'} ${Math.abs(c)}` : ''}`

// The answer is either the PAIR of sides (built on the steppers) or a single
// missing NUMBER (tapped on the pad). A tagged union — so `padValue` below is not
// optional; without it every tapped answer grades wrong. See GameConfig.padValue.
type V = { k: 'sides'; a: number; b: number } | { k: 'num'; n: number }

/** Which slice of the tile model is on screen. The walkthrough steps carry a
 *  `beats` array mapping stepIndex → phase, so each worked example can pace the
 *  same scene differently without the scene knowing which example it is in. */
const PH_SLAB = 0      // solid area, not yet broken up
const PH_SPLIT = 1     // square + strips + corner, laid vs cut visible
const PH_CORNER = 2    // corner emphasised (the product)
const PH_STRIPS = 3    // strips emphasised (the sum)
const PH_PAIRS = 4     // laid/cut strips annihilate
const PH_SIDES = 5     // side brackets read off the edges
const PH_DONE = 6

interface Task extends BaseTask {
  kind: 'sides' | 'missing'
  /** The two side numbers: sides are (x + p)(x + q). Negative = a side cut back. */
  p: number
  q: number
  /** missing — the single numeric answer (always `q`; `p` is the surveyed side). */
  n?: number
  /** missing — the misconception values that become the pad distractors. */
  pad?: number[]
  /** walkthrough only: stepIndex → scene phase. */
  beats?: number[]
}

// ── tasks ─────────────────────────────────────────────────────────────────────
// |p| and |q| are capped at 6 so every strip and every corner tile still FITS in
// the plot picture. Difficulty climbs by new structure (cuts appear, then cuts
// that only partly cancel, then the reverse direction), never by bigger numbers —
// a model the numbers outgrow has quietly gone back to symbol pushing.
const CAP = 6

/** Build BOTH sides on the steppers. */
function sidesTask(p: number, q: number, d: 1 | 2 | 3): Task {
  const b = p + q, c = p * q
  const area = areaExpr(b, c)
  const cut = p < 0 || q < 0
  return {
    kind: 'sides', title: 'Plot', badge: `area = ${area}`, tone: d === 3 ? 'b' : 'a',
    context: cut ? 'One side of this plot was cut back.' : 'Both sides of this plot were extended.',
    instruction: 'Build the two sides.',
    prompt: `Build the two sides of a plot with area ${area}.`,
    say: `Build the two sides of the plot. Its area is ${sayExpr(b, c)}.`,
    work: [
      `The two side numbers must multiply to ${disp(c)} and add to ${disp(b)}. ${disp(p)} and ${disp(q)} do both, so the sides are ${fac(p)}${fac(q)}.`,
    ],
    p, q,
  }
}

/** One side is surveyed already — TAP the number in the other.
 *  The distractors are the two ways this actually goes wrong: keeping the size but
 *  losing the sign of the cut, and swapping the roles of the last number (product)
 *  and the middle number (sum). `b` and `p` back them up when a parameter value
 *  makes one of them collide with the answer. */
function missingTask(p: number, q: number, d: 1 | 2 | 3): Task {
  const b = p + q, c = p * q
  const area = areaExpr(b, c)
  return {
    kind: 'missing', title: 'Plot', badge: `${area}  =  ${fac(p)}(x + ▢)`, tone: d === 3 ? 'b' : 'a',
    context: `One side is surveyed already: ${fac(p)}. The two side numbers have to do two jobs at once — multiply to the last number of the area, and add to the middle one.`,
    padInstruction: 'Tap the number that belongs in the box — it can be negative.',
    answerLabel: '▢ =',
    prompt: `The area is ${area} and one side is ${fac(p)}. What number is in the other side?`,
    say: `The plot's area is ${sayExpr(b, c)}, and one side is x ${p < 0 ? 'minus' : 'plus'} ${Math.abs(p)}. Which number belongs in the empty box?`,
    work: [
      `The two side numbers multiply to ${disp(c)}. With ${disp(p)} on one side, the other must be ${disp(q)}, because ${disp(p)} times ${disp(q)} is ${disp(c)} — and ${disp(p)} plus ${disp(q)} is ${disp(b)}, the middle number. So the box holds ${disp(q)}.`,
    ],
    p, q, n: q,
    //  −q  : kept the size of the cut, lost its sign
    //  c−p : read the LAST number as the sum instead of the product
    //  b, p: fallbacks, so a collision never leaves the pad short of a real error
    pad: [-q, c - p, b, p],
  }
}

/** A signed pair with |p| ≠ |q| (a difference of squares is its own L2 case). */
function mixedPair(): { pos: number; neg: number } {
  const pos = rint(2, CAP)
  let neg = -rint(1, CAP)
  while (pos === -neg) neg = -rint(1, CAP)
  return { pos, neg }
}

function makeTask(d: 1 | 2 | 3): Task {
  // L1 — two EXTENSIONS. Nothing is cut, so nothing cancels. Keep the two sides
  // DISTINCT: equal sides draw a square, which reads wrong under the "rectangular
  // plot" framing (and gives away that both factors are the same).
  if (d === 1) { const p = rint(1, 5); let q = rint(1, 5); while (q === p) q = rint(1, 5); return sidesTask(p, q, d) }
  // L2 — the CUT arrives. Either it cancels the extension exactly (difference of
  // squares, every strip pairs off) or one side is handed over and the child finds
  // the cut. Both are "a cut appears", which L1 never had.
  if (d === 2) {
    if (Math.random() < 0.5) { const n = rint(2, CAP); return sidesTask(n, -n, d) }
    const { pos, neg } = mixedPair()
    return missingTask(pos, neg, d)          // surveyed side is the EXTENSION
  }
  // L3 — cuts that only PARTLY cancel: construct both numbers and both signs, or
  // work back from the cut side to the extension (the reverse direction of L2).
  const { pos, neg } = mixedPair()
  return Math.random() < 0.55
    ? sidesTask(pos, neg, d)
    : missingTask(neg, pos, d)               // surveyed side is the CUT
}

// ── the tile model ────────────────────────────────────────────────────────────
// A top-down build lot. The area is assembled from three kinds of piece, each of
// which may be LAID (put down, +) or CUT (taken away, −):
//   • one x-by-x square       → x²          (always laid)
//   • |p| strips of length x  → p·x         (laid if p > 0, cut if p < 0)
//   • |q| strips of length x  → q·x
//   • |p·q| unit tiles        → p·q         (cut when the two sides disagree)
// Everything sits on the exact unit grid, so the picture always sums back to
// x² + (p+q)x + pq — the sweep asserts exactly that. Cut pieces are drawn in coral
// with a hatch; when strips of both kinds are present, min(|p|,|q|) of each are
// struck out as ZERO PAIRS, which is the only honest way to see the middle term
// shrink (and, at p = −q, vanish).
const U = 20             // one unit tile side (svg units)
const XL = 74            // the "x" length — clearly longer than a unit, never equal
const OX = 48, OY = 44   // plot footprint top-left
const VW = 280, VH = 268
const SPR = { type: 'spring' as const, stiffness: 320, damping: 20 }

/** One unit tile: glides from a staging pile into its corner cell as `place` 0→1. */
function UnitTile({ place, px, py, fx, fy, fill, stroke, dash }: {
  place: ReturnType<typeof useMotionValue<number>>
  px: number; py: number; fx: number; fy: number; fill: string; stroke: string; dash?: string
}) {
  const x = useTransform(place, (v: number) => px + (fx - px) * v)
  const y = useTransform(place, (v: number) => py + (fy - py) * v)
  const o = useTransform(place, [0, 0.2, 1], [0, 0.55, 1])
  return (
    <motion.g style={{ x, y, opacity: o }}>
      <rect x={0} y={0} width={U} height={U} rx={3} fill={fill} stroke={stroke} strokeWidth={1} strokeDasharray={dash} />
    </motion.g>
  )
}

/** One x-long strip, sliding in from off the edge as `place` 0→1. `struck` fades it
 *  and draws the cancel bar — a strip in a zero pair. */
function Strip({ place, fx, fy, w, h, fromDX, fromDY, fill, stroke, dash, struck }: {
  place: ReturnType<typeof useMotionValue<number>>
  fx: number; fy: number; w: number; h: number; fromDX: number; fromDY: number
  fill: string; stroke: string; dash?: string; struck?: boolean
}) {
  const x = useTransform(place, (v: number) => fx + fromDX * (1 - v))
  const y = useTransform(place, (v: number) => fy + fromDY * (1 - v))
  const o = useTransform(place, [0, 0.25, 1], [0, 0.4, 1])
  return (
    <motion.g style={{ x, y, opacity: o }}>
      <motion.g initial={false} animate={{ opacity: struck ? 0.26 : 1 }} transition={{ duration: 0.35 }}>
        <rect x={0} y={0} width={w} height={h} rx={2} fill={fill} stroke={stroke} strokeWidth={1} strokeDasharray={dash} />
      </motion.g>
      {struck && (
        <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }}
          x1={w > h ? 2 : w / 2} y1={w > h ? h / 2 : 2} x2={w > h ? w - 2 : w / 2} y2={w > h ? h / 2 : h - 2}
          stroke="#e9f7ee" strokeWidth={1.6} opacity={0.85} />
      )}
    </motion.g>
  )
}

/**
 * PlotScene — used BOTH as the walkthrough illustration and, compact, above the
 * steppers during scored `sides` play.
 *
 * ⚠️ A deliberate call, flagged for the partner. Rendering it live means the sides
 * the child dials assemble a real plot in front of them, so the manipulative is not
 * walkthrough-only. It shows STRUCTURE (which strips are laid, which are cut, how
 * many pair off) — the multiplication being performed — and never a verdict: there
 * is no "matches ✓", no hot/cold, nothing that tells the child they are right
 * before they commit. That distinction is the reason BalanceBench's live-tilt was
 * rejected and this is not: tilt was a binary oracle you could wiggle towards,
 * whereas reading these tiles IS expanding the brackets. If the partner disagrees,
 * dropping `<PlotScene compact …/>` from `Instrument` is a one-line revert.
 */
function PlotScene({ palette, p: pp, q: qq, areaTxt, phase, compact }: {
  palette: Palette; p: number; q: number; areaTxt: string; phase: number; compact?: boolean
}) {
  const pal = palette
  const reduce = useReducedMotion()

  const cols = Math.min(Math.abs(pp), CAP)   // strips down the RIGHT  (the p side)
  const rows = Math.min(Math.abs(qq), CAP)   // strips along the BOTTOM (the q side)
  const pLaid = pp >= 0, qLaid = qq >= 0
  const cornerLaid = pp * qq >= 0
  const mixed = cols > 0 && rows > 0 && pLaid !== qLaid
  const pairs = mixed ? Math.min(cols, rows) : 0   // how many strips annihilate

  const Wd = XL + cols * U
  const Hh = XL + rows * U
  const cornerX = OX + XL
  const cornerY = OY + XL

  // Shared assembly progress — the pieces FLOW in together instead of snapping.
  const place = useMotionValue(0)
  useEffect(() => {
    const controls = animate(place, phase >= PH_SPLIT ? 1 : 0, { duration: reduce ? 0 : 0.75, ease: [0.33, 0.02, 0.2, 1] })
    return () => controls.stop()
  }, [phase, reduce, place])
  const slabO = useTransform(place, [0, 0.5], [1, 0])
  const sqScale = useTransform(place, [0, 1], [0.72, 1])
  const sqO = useTransform(place, [0, 0.3, 1], [0, 0.4, 1])

  const split = phase >= PH_SPLIT
  const emphCorner = phase === PH_CORNER
  const emphStrips = phase === PH_STRIPS
  const struck = phase >= PH_PAIRS
  const showSides = phase >= PH_SIDES
  const done = phase >= PH_DONE
  const solved = '#2fb37f'
  const trans = reduce ? { duration: 0 } : SPR

  // laid = solid tint; cut = coral + hatch + dashed edge. The two never look alike.
  const laidStrip = { fill: 'rgba(143,224,106,0.30)', stroke: done ? solved : pal.goldDeep, dash: undefined as string | undefined }
  const cutStrip = { fill: 'url(#bp_cut)', stroke: pal.coralDeep, dash: '4 3' }
  const laidTile = { fill: 'rgba(92,214,172,0.34)', stroke: done ? solved : '#2fb37f', dash: undefined as string | undefined }
  const cutTile = { fill: 'url(#bp_cut)', stroke: pal.coralDeep, dash: '3 2' }
  const pStyle = pLaid ? laidStrip : cutStrip
  const qStyle = qLaid ? laidStrip : cutStrip
  const tStyle = cornerLaid ? laidTile : cutTile

  // corner unit tiles: final cells + a staging pile below the plot
  const total = cols * rows
  const pileW = Math.max(1, total) * (U + 3) - 3
  const pileX0 = OX + (Wd - pileW) / 2
  const pileY = VH - 30
  const tiles: { px: number; py: number; fx: number; fy: number }[] = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c
    tiles.push({ px: pileX0 + i * (U + 3), py: pileY, fx: cornerX + c * U, fy: cornerY + r * U })
  }

  const survivors = (pLaid ? cols : -cols) + (qLaid ? rows : -rows)
  const cap = done ? 'two sides built ✓'
    : phase >= PH_SIDES ? 'reading the sides'
      : struck && pairs > 0 ? `${pairs} laid + ${pairs} cut cancel → ${disp(survivors)}x left`
        : emphStrips ? 'the strips are the middle number'
          : emphCorner ? 'the corner is the last number'
            : split ? (mixed ? 'laid strips · cut strips' : 'splitting the area')
              : 'the plot area'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(4px, 0.8vh, 10px)' }}>
      <svg viewBox={`0 0 ${VW} ${VH}`}
        
        style={{ width: (compact ? 'clamp(180px, 22vw, 250px)' : 'clamp(220px, 30vw, 330px)'), height: 'auto', borderRadius: 14, border: `1px solid ${pal.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}>
        <defs>
          <linearGradient id="bp_ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#193527" />
            <stop offset="1" stopColor="#0e2019" />
          </linearGradient>
          {/* the CUT hatch — ground taken away never reads as ground laid */}
          <pattern id="bp_cut" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="rgba(255,138,112,0.16)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#e05a3f" strokeWidth="2" opacity="0.75" />
          </pattern>
        </defs>

        <rect x={0} y={0} width={VW} height={VH} fill="url(#bp_ground)" />
        <g opacity={0.5}>
          {Array.from({ length: Math.floor(VW / U) + 1 }).map((_, i) => (
            <line key={`gv${i}`} x1={i * U} y1={0} x2={i * U} y2={VH} stroke={pal.glassBorder} strokeWidth={0.5} opacity={0.35} />
          ))}
          {Array.from({ length: Math.floor(VH / U) + 1 }).map((_, i) => (
            <line key={`gh${i}`} x1={0} y1={i * U} x2={VW} y2={i * U} stroke={pal.glassBorder} strokeWidth={0.5} opacity={0.35} />
          ))}
        </g>

        {/* footprint survey outline */}
        <motion.rect x={OX} y={OY} width={Wd} height={Hh} rx={4} fill="none" stroke={pal.creamSoft} strokeWidth={1.4} strokeDasharray="5 5"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.7 }} transition={{ duration: reduce ? 0 : 0.8, ease: 'easeInOut' }} />

        {/* the solid area slab (phase 0) — fades as it splits */}
        <motion.g style={{ opacity: slabO }}>
          <rect x={OX} y={OY} width={Wd} height={Hh} rx={6} fill="rgba(143,224,106,0.14)" stroke={pal.goldDeep} strokeWidth={2} />
          <text x={OX + Wd / 2} y={OY + Hh / 2 + 6} textAnchor="middle" fill={pal.cream} fontFamily="var(--font-numeric)" fontWeight={800} fontSize={15}>{areaTxt}</text>
        </motion.g>

        {/* x² square — always laid */}
        <motion.g style={{ opacity: sqO, scale: sqScale, transformBox: 'fill-box', transformOrigin: 'center' }}>
          <rect x={OX} y={OY} width={XL} height={XL} rx={4} fill="rgba(143,224,106,0.30)" stroke={done ? solved : pal.gold} strokeWidth={1.6} />
          <text x={OX + XL / 2} y={OY + XL / 2 + 7} textAnchor="middle" fill={done ? solved : pal.gold} fontFamily="var(--font-numeric)" fontWeight={800} fontSize={20}>x²</text>
        </motion.g>

        {/* p strips down the right */}
        {Array.from({ length: cols }).map((_, c) => (
          <Strip key={`rs${c}`} place={place} fx={cornerX + c * U} fy={OY} w={U} h={XL} fromDX={40} fromDY={0}
            fill={pStyle.fill} stroke={pStyle.stroke} dash={pStyle.dash} struck={struck && c < pairs} />
        ))}
        {/* q strips along the bottom */}
        {Array.from({ length: rows }).map((_, r) => (
          <Strip key={`bs${r}`} place={place} fx={OX} fy={cornerY + r * U} w={XL} h={U} fromDX={0} fromDY={40}
            fill={qStyle.fill} stroke={qStyle.stroke} dash={qStyle.dash} struck={struck && r < pairs} />
        ))}

        {/* strip-region labels — signed, so a cut region reads as a cut */}
        {split && cols > 0 && (
          <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={trans}
            x={cornerX + cols * U / 2} y={OY + XL / 2 + 5} textAnchor="middle" fill={pLaid ? pal.gold : pal.coral}
            fontFamily="var(--font-numeric)" fontWeight={800} fontSize={14}>{disp(pLaid ? cols : -cols)}x</motion.text>
        )}
        {split && rows > 0 && (
          <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={trans}
            x={OX + XL / 2} y={cornerY + rows * U / 2 + 5} textAnchor="middle" fill={qLaid ? pal.gold : pal.coral}
            fontFamily="var(--font-numeric)" fontWeight={800} fontSize={14}>{disp(qLaid ? rows : -rows)}x</motion.text>
        )}

        {/* corner tiles — laid or CUT, never an unsigned pile */}
        {tiles.map((t, i) => (
          <UnitTile key={`t${i}`} place={place} px={t.px} py={t.py} fx={t.fx} fy={t.fy}
            fill={tStyle.fill} stroke={tStyle.stroke} dash={tStyle.dash} />
        ))}
        {split && total > 0 && (
          <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={trans}
            x={cornerX + cols * U / 2} y={cornerY + rows * U + 14} textAnchor="middle"
            fill={cornerLaid ? pal.mint : pal.coral} fontFamily="var(--font-numeric)" fontWeight={800} fontSize={12}>
            {cornerLaid ? `${total} tiles laid` : `${total} tiles cut`}
          </motion.text>
        )}

        {/* emphasis rings: the corner (product), then the strips (sum) */}
        <motion.rect x={cornerX - 3} y={cornerY - 3} width={cols * U + 6} height={rows * U + 6} rx={5} fill="none"
          stroke={cornerLaid ? pal.mint : pal.coral} strokeWidth={2}
          initial={false} animate={{ opacity: emphCorner && total > 0 ? 0.95 : 0 }} transition={trans} />
        <motion.g initial={false} animate={{ opacity: emphStrips ? 0.9 : 0 }} transition={trans}>
          {cols > 0 && <rect x={cornerX - 2} y={OY - 2} width={cols * U + 4} height={XL + 4} rx={4} fill="none" stroke={pal.cream} strokeWidth={1.5} strokeDasharray="4 3" />}
          {rows > 0 && <rect x={OX - 2} y={cornerY - 2} width={XL + 4} height={rows * U + 4} rx={4} fill="none" stroke={pal.cream} strokeWidth={1.5} strokeDasharray="4 3" />}
        </motion.g>

        {/* side brackets — TOP is the p side, LEFT is the q side */}
        <motion.g initial={false} animate={{ opacity: showSides ? 1 : 0, y: showSides ? 0 : -8 }} transition={trans}>
          <line x1={OX} y1={OY - 13} x2={OX + Wd} y2={OY - 13} stroke={pal.gold} strokeWidth={1.5} />
          <line x1={OX} y1={OY - 13} x2={OX} y2={OY - 8} stroke={pal.gold} strokeWidth={1.5} />
          <line x1={OX + Wd} y1={OY - 13} x2={OX + Wd} y2={OY - 8} stroke={pal.gold} strokeWidth={1.5} />
          <text x={OX + Wd / 2} y={OY - 19} textAnchor="middle" fill={done ? solved : pal.gold} fontFamily="var(--font-numeric)" fontWeight={800} fontSize={13}>{fac(pp)}</text>
        </motion.g>
        <motion.g initial={false} animate={{ opacity: showSides ? 1 : 0, x: showSides ? 0 : -8 }} transition={trans}>
          <line x1={OX - 13} y1={OY} x2={OX - 13} y2={OY + Hh} stroke={pal.gold} strokeWidth={1.5} />
          <line x1={OX - 13} y1={OY} x2={OX - 8} y2={OY} stroke={pal.gold} strokeWidth={1.5} />
          <line x1={OX - 13} y1={OY + Hh} x2={OX - 8} y2={OY + Hh} stroke={pal.gold} strokeWidth={1.5} />
          <text x={OX - 20} y={OY + Hh / 2} textAnchor="middle" fill={done ? solved : pal.gold} fontFamily="var(--font-numeric)" fontWeight={800} fontSize={13}
            transform={`rotate(-90 ${OX - 20} ${OY + Hh / 2})`}>{fac(qq)}</text>
        </motion.g>
      </svg>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(9px, 0.95vw, 12px)', letterSpacing: '0.1em', textTransform: 'uppercase', color: pal.mutedOnPaper, textAlign: 'center' }}>{cap}</div>
    </div>
  )
}

// ── the walkthrough: three worked examples, one per graded idea ────────────────
// 1. two EXTENSIONS on the steppers          → the area model + the build gesture
// 2. extend 3, CUT 3 (difference of squares) → zero pairs, and why there is no x term
// 3. a surveyed side + a cut corner          → the tapped missing number
// Between them every gesture scored play grades has been performed first, which is
// why this chapter has no guided round.

const DEMO_A: Task = { ...sidesTask(2, 3, 1), beats: [PH_SLAB, PH_SLAB, PH_SPLIT, PH_CORNER, PH_STRIPS, PH_SPLIT, PH_STRIPS, PH_SIDES, PH_DONE] }
const STEPS_A: DemoStep<V>[] = [
  { say: "Here's your build plot. The whole area marked out on the ground is x squared plus five x plus six.", value: { k: 'sides', a: 0, b: 0 }, board: 'area = x² + 5x + 6' },
  { say: 'Factoring finds the two side lengths — the width and the height that multiply to give that area.', value: { k: 'sides', a: 0, b: 0 }, board: 'find: width × height' },
  { say: 'Break the area into pieces you can actually lay: one big x by x square, some x long strips, and a few single tiles.', value: { k: 'sides', a: 0, b: 0 }, board: 'x²  +  5x  +  6' },
  { say: 'The last number, six, is the corner tiles. So the two side numbers have to multiply to six.', value: { k: 'sides', a: 0, b: 0 }, board: 'need: ▢ × ▢ = 6' },
  { say: 'And those same two numbers have to add to the middle number, five — the five strips.', value: { k: 'sides', a: 0, b: 0 }, board: 'and: ▢ + ▢ = 5' },
  { say: 'Two and three do both. Two times three is six, so the tiles sit in a neat two by three corner.', value: { k: 'sides', a: 2, b: 3 }, board: '2 × 3 = 6' },
  { say: 'And two plus three is five — three strips down one edge, two along the other. It checks out.', value: { k: 'sides', a: 2, b: 3 }, board: '2 + 3 = 5 ✓' },
  { say: 'So one side is x plus three, and the other is x plus two. Each side is the x, plus its extra rows.', value: { k: 'sides', a: 2, b: 3 }, board: 'sides: x + 3, x + 2' },
  { say: 'A plot x plus three by x plus two. Build those two numbers on the steppers.', value: { k: 'sides', a: 2, b: 3 }, board: '(x + 3)(x + 2)' },
]

const DEMO_B: Task = { ...sidesTask(3, -3, 2), beats: [PH_SLAB, PH_SPLIT, PH_SPLIT, PH_SPLIT, PH_PAIRS, PH_PAIRS, PH_CORNER, PH_DONE] }
const STEPS_B: DemoStep<V>[] = [
  { say: 'A new plot. This area is x squared minus nine. Minus? You cannot lay minus nine metres of ground — so something here got cut away.', value: { k: 'sides', a: 0, b: 0 }, board: 'area = x² − 9' },
  { say: 'Here is what happened on site. One side was extended by three metres, and the other side was cut back by three.', value: { k: 'sides', a: 3, b: -3 }, board: 'extend 3 · cut back 3' },
  { say: 'Extending adds three strips of ground down the edge. Those are laid — solid green.', value: { k: 'sides', a: 3, b: -3 }, board: '+ 3x  laid' },
  { say: 'Cutting back takes three strips away. Those are cut — drawn in red, with the hatching.', value: { k: 'sides', a: 3, b: -3 }, board: '− 3x  cut' },
  { say: 'Now watch. A strip you laid and a strip you cut away cancel each other out. Three pairs, and all six strips are gone.', value: { k: 'sides', a: 3, b: -3 }, board: '3x − 3x = 0' },
  { say: 'That is exactly why there is no x term at all in x squared minus nine. Not a trick — the strips really do cancel.', value: { k: 'sides', a: 3, b: -3 }, board: 'no x term' },
  { say: 'What the cut leaves behind is the corner: three by three, nine tiles taken away. That is the minus nine.', value: { k: 'sides', a: 3, b: -3 }, board: '3 × 3 = 9 cut' },
  { say: 'So the sides are x plus three and x minus three. Build three and minus three.', value: { k: 'sides', a: 3, b: -3 }, board: '(x + 3)(x − 3)' },
]

const DEMO_C: Task = { ...missingTask(5, -3, 3), beats: [PH_SLAB, PH_SPLIT, PH_CORNER, PH_SPLIT, PH_PAIRS, PH_STRIPS, PH_DONE] }
const STEPS_C: DemoStep<V>[] = [
  { say: 'Last one. This plot has area x squared plus two x minus fifteen, and one side is already surveyed: x plus five.', value: { k: 'num', n: 0 }, board: 'area = x² + 2x − 15' },
  { say: 'So that side was extended by five. Five strips laid down the edge.', value: { k: 'num', n: 0 }, board: 'one side: x + 5' },
  { say: 'The minus fifteen says the corner was cut — fifteen tiles taken away. Fifteen is five times three, so the other side was cut back by three.', value: { k: 'num', n: 0 }, board: '15 cut = 5 × 3' },
  { say: 'Cutting back by three also takes three strips away, right alongside the five you laid.', value: { k: 'num', n: 0 }, board: '+ 5x  and  − 3x' },
  { say: 'Three of the five laid strips cancel against them. Five laid, three cut, two survive — and there is the plus two x.', value: { k: 'num', n: 0 }, board: '5x − 3x = 2x' },
  { say: 'Check both: five times minus three is minus fifteen, and five plus minus three is two. Both fit.', value: { k: 'num', n: 0 }, board: '5 × (−3) = −15 ✓' },
  { say: 'So the box holds minus three. Tap minus three.', value: { k: 'num', n: -3 }, board: '▢ = −3' },
]

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'factoringPolynomials',
  title: 'BUILD PLOT',
  ticketLabel: 'blueprint',
  palette: P,
  motif: '🟩',
  makeTask,
  // PER-QUESTION gating. "Build both sides" is a PAIR — no single number can carry
  // it — so it keeps the steppers. "One side is surveyed, what's the other number?"
  // is one number, so it takes the pad.
  answerPad: (t) => (t.pad ? numChoices(t.n ?? 0, t.pad) : []),
  // REQUIRED: V is a tagged union, so a bare tapped number would never satisfy
  // `v.k === 'num'` and EVERY padded answer would grade wrong — silently, because a
  // wrong answer still advances. (That shipped once. See __tests__/answerPadGrading.)
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) => (t.kind === 'missing' ? { k: 'num', n: 0 } : { k: 'sides', a: 0, b: 0 }),
  grade: (t, v) => t.kind === 'missing'
    ? v.k === 'num' && v.n === t.q
    : v.k === 'sides' && ((v.a === t.p && v.b === t.q) || (v.a === t.q && v.b === t.p)),
  revealText: (t) => (t.kind === 'missing' ? disp(t.q) : `${fac(t.p)}${fac(t.q)}`),
  glide: (t, _from, setValue, later) => later(() => setValue(
    t.kind === 'missing' ? { k: 'num', n: t.q } : { k: 'sides', a: t.p, b: t.q }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    // `missing` ships with `pad`, so the shell renders the AnswerPad and never gets
    // here; the branch keeps a future pad-less missing task from rendering nothing.
    // ⚠️ NO LIVE TILE SCENE HERE — deliberately, and it was tried. Rendering the
    // child's current sides as tiles also renders their EXPANDED PRODUCT
    // ("x² + 5x + 4") right beside the target area on the board, which lets them
    // dial until the two strings match and never factor anything. That is the
    // hot/cold guessing the partner rejected on BalanceBench's live tilt; the
    // absence of a "✓" does not make it less of an oracle. It is worse here than
    // there, because BalanceBeam showing `2x` does not reveal x, whereas the
    // expansion IS the answer. The tiles teach in the WALKTHROUGH, where watching
    // them is the point and nothing is being scored.
    const parts = value.k === 'sides' ? { a: value.a, b: value.b } : { a: 0, b: 0 }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 1.2vh, 16px)', width: '100%' }}>
        <PartsBuilder P={palette} value={parts} setValue={(v) => setValue({ k: 'sides', a: v.a, b: v.b })}
          min={-9} max={9} template={(a, b) => `${fac(a)}${fac(b)}`} labels={['side 1', 'side 2']}
          disabled={disabled} reveal={reveal} onCommit={(v) => onCommit({ k: 'sides', a: v.a, b: v.b })}
          commitLabel="LAY IT OUT ✓" />
      </div>
    )
  },
  // One scene, paced per example by the example's own `beats` array — so the child
  // watches the same plot each time and only the story on it changes.
  TutorialScene: ({ palette, task, stepIndex, ended }) => (
    <PlotScene palette={palette} p={task.p} q={task.q}
      areaTxt={areaExpr(task.p + task.q, task.p * task.q)}
      phase={ended ? PH_DONE : (task.beats?.[stepIndex] ?? PH_SLAB)} />
  ),
  start: {
    blurb: <><strong>You&apos;re laying out a rectangular plot.</strong> Its <strong>area</strong> is written as a trinomial — factoring finds the two <strong>side lengths</strong>. Sometimes a side is <strong>extended</strong>, sometimes it&apos;s <strong>cut back</strong>.</>,
    ticket: { title: 'Plot area', badge: 'x² + 5x + 6', tone: 'a' },
    startLabel: 'Open the blueprint →',
  },
  overview: {
    say: 'Here is the plan. A rectangular plot has an area written as x squared plus five x plus six. Factoring finds the two side lengths that multiply together to give that area. We look for two numbers that multiply to the last number and add to the middle one. And when a side is cut back instead of extended, that number is negative, and some of the ground cancels out. Let us build a few together.',
    problem: <>Build the two sides of a plot whose area is <strong>x² + 5x + 6</strong>.</>,
    points: [
      <>The two sides look like <strong>(x + ▢)</strong> and <strong>(x + ▢)</strong>.</>,
      <>The two numbers <strong>multiply</strong> to the last number…</>,
      <>…and <strong>add</strong> to the middle number.</>,
      <>A <strong>cut-back</strong> side is negative — laid ground and cut ground <strong>cancel</strong>.</>,
    ],
  },
  tutorial: [
    { task: DEMO_A, initial: { k: 'sides', a: 0, b: 0 }, hand: 'tap', steps: STEPS_A },
    { task: DEMO_B, initial: { k: 'sides', a: 0, b: 0 }, hand: 'tap', steps: STEPS_B },
    { task: DEMO_C, initial: { k: 'num', n: 0 }, hand: 'tap', steps: STEPS_C },
  ],
  // No guided round: all three worked examples end on a gesture scored play grades
  // (build, build-with-a-cut, tap the missing number).
  sig: (t) => `${t.kind}:${t.badge}`,
}

export default function BuildPlot(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
