'use client'
/**
 * CLIMB ROUTE — the Radicals & the Pythagorean Theorem chapter (15–16) as a
 * PLAYABLE GAME.  (File/export keep the old `ScreenDistance` name; the wrapper
 * imports the default export, so only the display title changed. Same precedent
 * as SkyTower → "MONEY LAB".)
 *
 * ── ONE WORLD: an indoor climbing wall on a hold grid ─────────────────────────
 * The previous version ran TWO worlds — "Screen diagonal"/"Square panel" against
 * "Map hop"/"Combine distances" — and neither could motivate the chapter's
 * headline skill. A screen's diagonal is the same length whether you call it √72
 * or 6√2, so simplifying a radical changed NOTHING on screen: the child rewrote
 * the surd by rule and the picture sat still. That is the failure docs/lessons.md
 * names — a world chosen for its easiest case (Pythagoras) that cannot perform
 * its hardest one (simplification).
 *
 * A climbing wall performs BOTH, because a√b is something you COUNT:
 *   • Holds sit on a grid. The straight-line GAP between two holds comes from
 *     across² + up² — Pythagoras, exactly as before.                     (L1)
 *   • A MOVE is a gap you repeat. Link the same 1-across-1-up move six times and
 *     you have climbed 6 × √2 — and you have also climbed √72, because the top
 *     hold sits 6 across and 6 up. √72 = 6√2 is not a rewrite, it is the same
 *     route counted two ways: as one long line, or as six equal moves.    (L2)
 *   • Two sections of a route using the SAME move just add their counts:
 *     2√5 + 3√5 = 5√5 is five moves. And the wall explains the restriction that
 *     nothing else here did — you cannot count a √5 move together with a √2 move,
 *     because they are different shapes.                                  (L3)
 *   • Reverse it: a gap is 13 long and 5 across — how far up?             (L3)
 *
 * ── THE HONEST COST ──────────────────────────────────────────────────────────
 * A move of shape (p, q) has length √(p² + q²), so the only radicands this world
 * can walk are sums of two squares: 2, 5, 10, 13. √3, √6, √7, √11 and friends are
 * NOT climbable, so √12, √27, √48 and √75 are GONE from the chapter rather than
 * dressed up as a rule the picture cannot show. Dropping the case is the rule;
 * faking it is not. (See "the mechanic, not the truth" in docs/lessons.md.)
 *
 * ── HOW A QUESTION IS ANSWERED (gated PER QUESTION, never per chapter) ───────
 *   • TAP  → AnswerPad, for every question whose answer is a single number: the
 *            gap between two holds, and the missing leg. Distractors are the real
 *            misconceptions — adding the legs instead of squaring them (3 + 4 = 7),
 *            forgetting the square root (25), and subtracting (c − a).
 *   • BUILD → the ROUTE BUILDER keeps its instrument, because a√b is a PAIR — a
 *            move shape AND a count — and no number pad can express one. The child
 *            picks the move and lays it down until the route reaches the top hold.
 *
 * No guided round: the walkthrough works BOTH graded gestures (the gap on the pad,
 * then the route on the builder), so nothing is scored that was never shown.
 * Scene is code-drawn (no assets).
 */
import { useEffect, useState, type ReactElement } from 'react'
import { motion, useMotionValue, animate, useReducedMotion, useMotionValueEvent } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SlideValue, CommitBtn, Nudge, numChoices } from './parts/gameKit'

const P: Palette = {
  nightTop: '#101c33', nightBot: '#0a1322',
  cream: '#eaf1fb', creamSoft: 'rgba(234,241,251,0.82)',
  inkOnPaper: '#16233d', mutedOnPaper: '#6b7a95',
  gold: '#6ad0ff', goldDeep: '#2b8fd6',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(18,34,58,0.6)', glassBorder: 'rgba(234,241,251,0.2)',
}

const RAD = '√'
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
/** Pretty radical: "6√2", "√5", "6". */
const radStr = (a: number, b: number): string => (b === 1 ? String(a) : a === 1 ? `${RAD}${b}` : `${a}${RAD}${b}`)
/** Spoken radical: "six root two" — superscripts and √ speak as nothing. */
const radSay = (a: number, b: number): string => (b === 1 ? String(a) : a === 1 ? `root ${b}` : `${a} root ${b}`)

/** The MOVE palette. Every vector is PRIMITIVE (gcd 1), which is what makes the
 *  route builder fairly gradeable: the top hold is count·(dx,dy), so a target hold
 *  can be reached by AT MOST ONE (move, count) pair — the child cannot stumble onto
 *  the right endpoint with the wrong reasoning. Asserted in the parameter sweep. */
const MOVES: Array<{ dx: number; dy: number; b: number }> = [
  { dx: 1, dy: 1, b: 2 },
  { dx: 1, dy: 2, b: 5 },
  { dx: 1, dy: 3, b: 10 },
  { dx: 2, dy: 3, b: 13 },
]
const moveIdxFor = (b: number) => MOVES.findIndex((m) => m.b === b)
const moveLabel = (m: { dx: number; dy: number }) => `${m.dx} across · ${m.dy} up`

/** Routes that FIT the wall (top hold within 12 × 12 holds) — every one of these
 *  is a genuine simplification: √(count²·b) → count√b. */
const ROUTES: Array<[number, number]> = [   // [move index, move count]
  [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],   // √8 √18 √32 √50 √72
  [1, 2], [1, 3], [1, 4],                   // √20 √45 √80
  [2, 2], [2, 3],                           // √40 √90
  [3, 2], [3, 3],                           // √52 √117
]
/** Largest count per move that still fits the wall (used by the combine task). */
const MAX_COUNT = [6, 4, 3, 3]

/** Pythagorean triples whose gap fits on the wall. */
const TRIPLES: Array<[number, number, number]> = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]]

// The answer is a whole number of holds (tapped) or a ROUTE — a move shape plus a
// count, i.e. the pair a√b that no single number can express.
type V = { k: 'num'; n: number } | { k: 'route'; count: number; mv: number }

interface Task extends BaseTask {
  kind: 'gap' | 'leg' | 'route' | 'combine'
  n?: number; lo?: number; hi?: number       // gap / leg — the single-number answer
  /** Set → answered by TAPPING. Carries the misconception values that become the
   *  distractors, so a wrong tap is a wrong METHOD, not a slip. */
  pad?: number[]
  dx?: number; dy?: number                   // gap / leg — the two holds' offset
  a?: number; b?: number                     // route / combine — count and radicand
}

// ── L1 — the GAP between two holds: across² + up² = gap² ───────────────────────
// Distractors: adding the legs (the classic — 3 + 4 = 7 for a gap of 5), forgetting
// the square root (25), and subtracting the legs. The triangle inequality is strict
// for a real triple, so none of the three can ever collide with the answer.
function gapTask(): Task {
  const [p, q, c] = pick(TRIPLES)
  const [dx, dy] = Math.random() < 0.5 ? [p, q] : [q, p]
  return {
    kind: 'gap', title: 'Measure the gap', badge: `${RAD}(${dx}² + ${dy}²)`, tone: 'a',
    prompt: `Two holds sit ${dx} across and ${dy} up. How far apart are they?`,
    context: `Two holds sit ${dx} across and ${dy} up from each other. The straight reach between them is the slanted side of that right-angled corner — longer than either side alone, shorter than walking the two.`,
    padInstruction: 'Tap how far apart the two holds are.',
    say: `Two holds sit ${dx} across and ${dy} up from each other. How far apart are they?`,
    work: [`Square each side and add: ${dx}² + ${dy}² = ${dx * dx} + ${dy * dy} = ${c * c}. The gap is ${RAD}${c * c}, which is ${c}.`],
    n: c, dx, dy, lo: 0, hi: c + 8,
    pad: [dx + dy, c * c, Math.abs(dx - dy)],
  }
}

// ── L3 — the REVERSAL: the gap is known, one side is known, find the other ─────
// The headline distractor is c − a, which is exactly how a child who subtracts
// instead of un-squaring arrives at a wrong hold.
function legTask(): Task {
  const [p, q, c] = pick(TRIPLES)
  const [known, missing] = Math.random() < 0.5 ? [p, q] : [q, p]
  return {
    kind: 'leg', title: 'Find the other side', badge: `${RAD}(${c}² − ${known}²)`, tone: 'b',
    prompt: `The gap between two holds is ${c}, and ${known} of that is across. How far up?`,
    context: `This time the slanted reach is known, and so is the ${known} across. The two shorter sides together account for the slanted one, so the rise is what is left once the across is taken out.`,
    padInstruction: 'Tap how far up the second hold sits.',
    say: `The gap between two holds is ${c}. ${known} of it is across. How far up is the second hold?`,
    work: [`Un-square it the other way: ${c}² − ${known}² = ${c * c} − ${known * known} = ${missing * missing}. So the rise is ${RAD}${missing * missing}, which is ${missing}.`],
    n: missing, dx: known, dy: missing, lo: 0, hi: c + 4,
    pad: [c - known, c * c - known * known, c + known],
  }
}

// ── L2 — the ROUTE: climb √(count²·b) as `count` moves of √b ───────────────────
// This is the chapter's hardest idea and the reason the old world failed. Here the
// coefficient is a COUNT of moves the child lays down, so 6√2 is watched, not
// recited. Keeps its instrument: the answer is a move shape AND a count.
function routeTask(): Task {
  const [mv, count] = pick(ROUTES)
  const m = MOVES[mv]
  const total = count * count * m.b
  return {
    kind: 'route', title: 'Build the route', badge: `${RAD}${total}`, tone: 'a',
    prompt: `The top hold is ${count * m.dx} across and ${count * m.dy} up. Build the route out of equal moves.`,
    say: `The route climbs root ${total}. Find one move you can repeat all the way to the top hold, then lay it down.`,
    work: [`The top hold is ${count * m.dx} across and ${count * m.dy} up, so it takes ${count} moves of ${m.dx} across and ${m.dy} up. One of those moves is ${RAD}${m.b} long, so the route is ${radStr(count, m.b)} — and ${count}² × ${m.b} = ${total}, so ${RAD}${total} = ${radStr(count, m.b)}.`],
    a: count, b: m.b,
  }
}

// ── L3 — LIKE moves add: p√r + q√r = (p+q)√r ──────────────────────────────────
// Two sections of one route built from the SAME move, so the counts simply add.
// The move chip is the point: the child has to see both terms are the same shape.
function combineTask(): Task {
  const mv = rint(0, MOVES.length - 1)
  const m = MOVES[mv]
  const total = rint(3, MAX_COUNT[mv])
  const p = rint(1, total - 1), q = total - p
  return {
    kind: 'combine', title: 'Join the sections', badge: `${radStr(p, m.b)} + ${radStr(q, m.b)}`, tone: 'b',
    prompt: `A climber links ${p} ${p === 1 ? 'move' : 'moves'}, then ${q} more of the same move. Build the whole route.`,
    say: `${radSay(p, m.b)} plus ${radSay(q, m.b)}. Both sections use the same move, so build the whole route.`,
    work: [`Both sections use the same ${m.dx}-across-${m.dy}-up move, so the counts just add: ${p} + ${q} = ${total} moves, giving ${radStr(total, m.b)}.`],
    a: total, b: m.b,
  }
}

// Tiers differ by IDEA, never by number size, and share no generator:
//   L1 measure one gap · L2 count a route into equal moves · L3 reverse the gap,
//   or join two sections of like moves.
function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return gapTask()
  if (d === 2) return routeTask()
  return Math.random() < 0.5 ? legTask() : combineTask()
}

// ── THE WALL ──────────────────────────────────────────────────────────────────
// One renderer for both boards: holds on a lattice, y counted UP from the floor.

function wallDots(cols: number, rows: number, cell: number, ox: number, oy: number, col: string) {
  const out: ReactElement[] = []
  for (let c = 0; c <= cols; c++) {
    for (let r = 0; r <= rows; r++) {
      out.push(<circle key={`${c}_${r}`} cx={ox + c * cell} cy={oy - r * cell} r={2.4} fill={col} opacity={0.3} />)
    }
  }
  return out
}

// ── THE ROUTE BUILDER — the instrument for `route` and `combine` ───────────────
// KEPT AS AN INSTRUMENT (not padded) because the answer a√b is a PAIR: which move,
// and how many. A number pad can carry one of those, never both — and the whole
// point of the chapter is that the coefficient is a COUNT of a shape.
function RouteBoard({ P: p, task, count, mv, reveal }: {
  P: Palette; task: Task; count: number; mv: number; reveal?: boolean
}): ReactElement {
  const b = task.b ?? 2
  const target = task.a ?? 0
  const tm = MOVES[Math.max(0, moveIdxFor(b))]
  const cols = Math.max(4, target * tm.dx), rows = Math.max(4, target * tm.dy)
  const m = mv >= 0 ? MOVES[mv] : null

  const VW = 320, VH = 300, PAD = 26
  const cell = Math.min((VW - 2 * PAD) / cols, (VH - 2 * PAD) / rows)
  const ox = PAD, oy = VH - PAD
  const X = (n: number) => ox + n * cell
  const Y = (n: number) => oy - n * cell

  const hit = !!m && count === target && m.b === b
  const col = hit ? p.mint : reveal ? p.mint : p.gold
  const segs = m ? Array.from({ length: count }, (_, i) => i) : []
  const endX = m ? count * m.dx : 0, endY = m ? count * m.dy : 0
  const overshoot = !!m && (endX > cols || endY > rows)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px,1vh,12px)' }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: 'clamp(224px,32vw,340px)', height: 'auto', display: 'block', borderRadius: 14, border: `1px solid ${p.glassBorder}`, background: `linear-gradient(165deg, ${p.nightTop}, ${p.nightBot})` }}
        role="img" aria-label="a climbing wall with holds on a grid">
        {wallDots(cols, rows, cell, ox, oy, p.cream)}

        {/* the top hold — where the route has to finish */}
        <circle cx={X(target * tm.dx)} cy={Y(target * tm.dy)} r={9} fill="none" stroke={p.gold} strokeWidth={2.4} opacity={0.9} />
        <circle cx={X(target * tm.dx)} cy={Y(target * tm.dy)} r={3.4} fill={p.gold} />

        {/* start hold */}
        <circle cx={X(0)} cy={Y(0)} r={5} fill={p.creamSoft} />

        {/* the chain of identical moves the child has laid down */}
        {m && segs.map((i) => (
          <g key={i}>
            <line x1={X(i * m.dx)} y1={Y(i * m.dy)} x2={X((i + 1) * m.dx)} y2={Y((i + 1) * m.dy)}
              stroke={col} strokeWidth={3.4} strokeLinecap="round" opacity={0.95} />
            <circle cx={X((i + 1) * m.dx)} cy={Y((i + 1) * m.dy)} r={4.2} fill={col} />
          </g>
        ))}
      </svg>

      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(20px,2.6vw,32px)', fontWeight: 800, color: col }}>
        {m && count > 0 ? `${count} × ${RAD}${m.b} = ${radStr(count, m.b)}` : '? moves'}
      </div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px,1.1vw,13px)', letterSpacing: '0.1em', textTransform: 'uppercase', color: hit ? p.mint : p.mutedOnPaper, minHeight: '1.3em' }}>
        {!m ? 'pick one move' : overshoot ? 'past the top hold' : hit ? 'on the top hold ✓' : count === 0 ? 'lay the first move' : 'not there yet'}
      </div>
    </div>
  )
}

function RouteBuilder({ P: p, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}): ReactElement {
  const count = value.k === 'route' ? value.count : 0
  const mv = value.k === 'route' ? value.mv : -1
  const set = (c: number, m: number) => setValue({ k: 'route', count: c, mv: m })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.4vw,16px)', width: '100%' }}>
      <RouteBoard P={p} task={task} count={count} mv={mv} reveal={reveal} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', maxWidth: 'clamp(280px,44vw,460px)' }}>
        <div style={{ fontSize: 'clamp(11px,1.1vw,14px)', color: p.creamSoft, fontWeight: 700 }}>Which move do you repeat?</div>
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          {MOVES.map((m, i) => {
            const lit = mv === i || (reveal && m.b === task.b)
            return (
              <button key={m.b} type="button" disabled={disabled} onClick={() => set(count, i)}
                style={{
                  flex: 1, padding: 'clamp(7px,0.9vw,11px) 2px', borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
                  fontFamily: 'var(--font-numeric)', fontWeight: 800, lineHeight: 1.25,
                  fontSize: 'clamp(12px,1.35vw,16px)', background: lit ? p.gold : p.glass,
                  color: lit ? '#0a1322' : p.cream, border: `2px solid ${lit ? p.gold : p.glassBorder}`,
                  transition: 'background 140ms, border-color 140ms',
                }}>
                {RAD}{m.b}
                <div style={{ fontSize: 'clamp(8px,0.85vw,10px)', fontWeight: 700, opacity: 0.85 }}>{moveLabel(m)}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Nudge P={p} label="−" disabled={disabled} onClick={() => set(Math.max(0, count - 1), mv)} />
        <div style={{ minWidth: 130, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(24px,2.6vw,34px)', fontWeight: 800, color: reveal ? p.mint : p.gold }}>{count}</div>
          <div style={{ fontSize: 'clamp(11px,1.1vw,14px)', color: p.creamSoft }}>moves</div>
        </div>
        <Nudge P={p} label="+" disabled={disabled} onClick={() => set(Math.min(12, count + 1), mv)} />
      </div>

      <CommitBtn P={p} label="TOP OUT ✓" disabled={disabled || mv < 0 || count === 0} onClick={() => onCommit({ k: 'route', count, mv })} />
    </div>
  )
}

// ── walkthrough example 1 — the GAP: two holds, 3 across and 4 up ─────────────
const DEMO_GAP: Task = {
  kind: 'gap', title: 'Measure the gap', badge: '√(3² + 4²)', tone: 'a',
  prompt: '', say: '', work: ['3² + 4² = 9 + 16 = 25, so the gap is √25 = 5.'],
  n: 5, dx: 3, dy: 4, lo: 0, hi: 14,
}
// Twelve BABY steps — one idea + one chalkboard line + one wall beat each. `value.n`
// stays 0 while we square and add, then climbs to 5 as the gap line sweeps in.
const GAP_STEPS: DemoStep<V>[] = [
  { say: "Here's a section of the wall. Two holds: the second one sits three across and four up from the first.", value: { k: 'num', n: 0 }, board: 'holds: 3 across, 4 up' },
  { say: 'Across and up meet at a square corner, so the straight gap between the holds is the long side of a right triangle.', value: { k: 'num', n: 0 }, board: 'gap = long side' },
  { say: 'The Pythagorean theorem ties them together: the two sides squared add up to the gap squared.', value: { k: 'num', n: 0 }, board: 'a² + b² = c²' },
  { say: 'Start with the three across. Square it — build a three-by-three square out from that side.', value: { k: 'num', n: 0 }, board: '3² = ?' },
  { say: 'A three-by-three square holds nine little squares. So three squared is nine.', value: { k: 'num', n: 0 }, board: '3² = 9' },
  { say: 'Now the four up. Square that one too — a four-by-four square out from that side.', value: { k: 'num', n: 0 }, board: '4² = ?' },
  { say: 'A four-by-four square holds sixteen. So four squared is sixteen.', value: { k: 'num', n: 0 }, board: '4² = 16' },
  { say: 'Now add the two squares together: nine plus sixteen.', value: { k: 'num', n: 0 }, board: '9 + 16 = c²' },
  { say: 'Nine plus sixteen is twenty-five. So the gap squared is twenty-five.', value: { k: 'num', n: 0 }, board: 'c² = 25' },
  { say: 'To undo the square and get the gap itself, take the square root of both sides.', value: { k: 'num', n: 0 }, board: 'c = √25' },
  { say: 'The square root of twenty-five is five. Watch the gap draw in as its length counts up.', value: { k: 'num', n: 5 }, board: 'c = √25 = 5' },
  { say: 'So those two holds are five apart. Five is the number you would tap.', value: { k: 'num', n: 5 }, board: 'gap = 5' },
]

// ── walkthrough example 2 — the ROUTE: √72 climbed as six moves of √2 ─────────
// This is the gesture scored play grades on the harder half of the chapter, so it
// is worked here rather than assumed. The last step folds in the like-radical idea,
// which is the same counting on the same wall.
const DEMO_ROUTE: Task = {
  kind: 'route', title: 'Build the route', badge: '√72', tone: 'a',
  prompt: '', say: '', work: [], a: 6, b: 2,
}
const ROUTE_STEPS: DemoStep<V>[] = [
  { say: 'Same wall, a whole route this time. The top hold is six across and six up, and the straight climb to it is root seventy-two.', value: { k: 'route', count: 0, mv: -1 }, board: '√72 to the top' },
  { say: 'Root seventy-two is an awkward number. But the climb is made of moves — so find one move you can repeat the whole way.', value: { k: 'route', count: 0, mv: -1 }, board: 'climb it in equal moves' },
  { say: 'Try the smallest one: one across, one up. Its own gap is one squared plus one squared, which is two — so that move is root two long.', value: { k: 'route', count: 0, mv: 0 }, board: '1 across, 1 up = √2' },
  { say: 'Lay the first one down. One move of root two.', value: { k: 'route', count: 1, mv: 0 }, board: '1 × √2' },
  { say: 'And another, the exact same shape. Two moves.', value: { k: 'route', count: 2, mv: 0 }, board: '2 × √2 = 2√2' },
  { say: 'Three. Notice the number in front is just how many moves you have made.', value: { k: 'route', count: 3, mv: 0 }, board: '3 × √2 = 3√2' },
  { say: 'Four. Five.', value: { k: 'route', count: 5, mv: 0 }, board: '5 × √2 = 5√2' },
  { say: 'Six — and that lands right on the top hold. Six moves of root two.', value: { k: 'route', count: 6, mv: 0 }, board: '6 × √2 = 6√2' },
  { say: 'So root seventy-two IS six root two. Same climb, counted two ways: one long line, or six equal moves. Check it — six squared is thirty-six, times two is seventy-two.', value: { k: 'route', count: 6, mv: 0 }, board: '√72 = 6√2' },
  { say: 'And that is why like moves add. Two root two plus three root two is just two moves plus three moves — five moves, five root two. Different shapes could never be counted together.', value: { k: 'route', count: 6, mv: 0 }, board: '2√2 + 3√2 = 5√2' },
]

/** The walkthrough's GAP scene: a code-drawn wall section where the two legs draw
 *  in over the hold grid, unit squares grow out from each side and fill with tiles,
 *  they add, and the gap line finally sweeps corner to corner while a motion value
 *  counts its length up to 5. The math skeleton sits on the exact 3×4 lattice
 *  mapping; only the wall texture is decoration. Reduced motion → end state. */
function GapScene({ palette, value, stepIndex, ended }: { palette: Palette; value: V; stepIndex: number; ended: boolean }) {
  const p = palette
  const reduce = useReducedMotion()
  const LAST = 11
  const phase = ended ? LAST : Math.max(0, Math.min(LAST, stepIndex))

  const legsIn = phase >= 0
  const rightAngle = phase >= 1
  const aGrow = phase >= 3, aTiles = phase >= 4
  const bGrow = phase >= 5, bTiles = phase >= 6
  const adding = phase >= 7
  const sweep = phase >= 10
  const solved = phase >= LAST

  const col = solved ? '#2fb37f' : sweep ? p.gold : p.goldDeep
  const spring = { type: 'spring' as const, stiffness: 300, damping: 20 }

  const targetLen = value.k === 'num' ? value.n : 0
  const lenMV = useMotionValue(0)
  const [lenNum, setLenNum] = useState(0)
  useMotionValueEvent(lenMV, 'change', (v) => setLenNum(v))
  useEffect(() => {
    const controls = animate(lenMV, targetLen, { duration: reduce ? 0 : 0.9, ease: [0.33, 0.02, 0.2, 1] })
    return () => controls.stop()
  }, [targetLen, reduce, lenMV])
  const diagText = sweep && lenNum > 0.4 ? lenNum.toFixed(lenNum >= 4.9 ? 0 : 1) : 'c'

  // The wall lattice: 3 across × 4 up, cell 50. Bottom-left hold is the start; the
  // right-angle corner is bottom-right; the second hold is top-right.
  const W = 460, H = 452
  const cell = 50
  const ax = 92, ay = 282                 // start hold (bottom-left)
  const bx = ax + 3 * cell                // 3 across
  const cy = ay - 4 * cell                // 4 up
  const aOX = ax, aOY = ay + 26           // 3×3 square below the across-leg
  const bOX = bx + 30, bOY = cy           // 4×4 square right of the up-leg

  const readout = phase <= 6 ? '3² + 4² = c²' : phase === 7 ? '9 + 16 = c²' : phase <= 9 ? 'c² = 25' : solved ? 'c = 5' : 'c = √25'
  const caption = solved ? 'gap = 5 holds' : sweep || phase === 9 ? 'take the square root…' : adding ? 'add the squares' : aGrow ? 'square each side' : 'two holds on the wall'

  const tileGrid = (n: number, ox: number, oy: number, size: number, fill: string, show: boolean) =>
    Array.from({ length: n * n }, (_, i) => {
      const r = Math.floor(i / n), c = i % n
      return (
        <motion.rect key={i} x={ox + c * size + 1.4} y={oy + r * size + 1.4} width={size - 2.8} height={size - 2.8} rx={2}
          fill={fill} stroke="rgba(255,255,255,0.22)" strokeWidth={0.6} initial={false}
          animate={{ opacity: show ? 0.9 : 0, scale: show ? 1 : 0.3 }}
          transition={reduce ? { duration: 0 } : { delay: show ? i * 0.028 : 0, type: 'spring', stiffness: 420, damping: 24 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
      )
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 1.2vh, 14px)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 'clamp(224px, 31vw, 348px)', height: 'auto', display: 'block' }} role="img" aria-label="two climbing holds with the gap between them found by the Pythagorean theorem">
        <defs>
          <linearGradient id="cw_wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#173151" />
            <stop offset="1" stopColor="#0c1a2e" />
          </linearGradient>
        </defs>

        {/* wall panel + the hold lattice */}
        <rect x={ax - 34} y={cy - 34} width={3 * cell + 98} height={4 * cell + 68} rx={14} fill="url(#cw_wall)" stroke={p.glassBorder} strokeWidth={2} />
        {wallDots(3, 4, cell, ax, ay, p.cream)}

        {/* triangle fill between the two holds */}
        <motion.polygon points={`${bx},${ay} ${ax},${ay} ${bx},${cy}`}
          fill={solved ? 'rgba(47,179,127,0.16)' : 'rgba(106,208,255,0.10)'} initial={false}
          animate={{ opacity: legsIn ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.5 }} />

        {/* b² square (4×4 = 16) out from the up-leg */}
        <motion.g initial={false} animate={{ opacity: bGrow ? 1 : 0, scale: bGrow ? 1 : 0.4 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 20 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'left' }}>
          <rect x={bOX} y={bOY} width={4 * cell} height={4 * cell} fill="rgba(255,138,112,0.08)" stroke={p.coral} strokeWidth={1.4} rx={3} />
          {tileGrid(4, bOX, bOY, cell, p.coral, bTiles)}
          <text x={bOX + 2 * cell} y={bOY + 2 * cell + 6} textAnchor="middle" fontFamily="var(--font-numeric)" fontSize={17} fontWeight={800}
            fill="#fff" style={{ opacity: bTiles ? 1 : 0, transition: 'opacity 260ms 240ms' }}>{bTiles ? '16' : '4²'}</text>
        </motion.g>

        {/* a² square (3×3 = 9) out from the across-leg */}
        <motion.g initial={false} animate={{ opacity: aGrow ? 1 : 0, scale: aGrow ? 1 : 0.4 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 20 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'top' }}>
          <rect x={aOX} y={aOY} width={3 * cell} height={3 * cell} fill="rgba(106,208,255,0.08)" stroke={p.goldDeep} strokeWidth={1.4} rx={3} />
          {tileGrid(3, aOX, aOY, cell, p.goldDeep, aTiles)}
          <text x={aOX + 1.5 * cell} y={aOY + 1.5 * cell + 6} textAnchor="middle" fontFamily="var(--font-numeric)" fontSize={17} fontWeight={800}
            fill="#fff" style={{ opacity: aTiles ? 1 : 0, transition: 'opacity 260ms 240ms' }}>{aTiles ? '9' : '3²'}</text>
        </motion.g>

        {/* the two legs — draw in via pathLength */}
        <motion.line x1={bx} y1={ay} x2={ax} y2={ay} stroke={p.creamSoft} strokeWidth={3.6} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: legsIn ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeInOut' }} />
        <motion.line x1={bx} y1={ay} x2={bx} y2={cy} stroke={p.creamSoft} strokeWidth={3.6} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: legsIn ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeInOut', delay: 0.24 }} />

        {/* right-angle bracket */}
        <motion.path d={`M${bx - 17},${ay} L${bx - 17},${ay - 17} L${bx},${ay - 17}`} fill="none" stroke={p.mint} strokeWidth={2} initial={false}
          animate={{ opacity: rightAngle ? 1 : 0, scale: rightAngle ? 1 : 0.4 }} transition={reduce ? { duration: 0 } : spring}
          style={{ transformBox: 'fill-box', transformOrigin: 'bottom right' }} />

        {/* the two holds themselves */}
        <circle cx={ax} cy={ay} r={7} fill={p.creamSoft} />
        <circle cx={bx} cy={cy} r={7} fill={solved ? '#2fb37f' : p.gold} />

        {/* the gap line — sweeps in on the final beats */}
        <motion.line x1={ax} y1={ay} x2={bx} y2={cy} stroke={col} strokeWidth={4.6} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: sweep ? 1 : 0, opacity: sweep ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.7, ease: 'easeInOut' }} />

        {/* side labels */}
        <motion.text x={(ax + bx) / 2} y={ay + 20} textAnchor="middle" fontFamily="var(--font-numeric)" fontSize={18} fontWeight={800} fill={p.creamSoft}
          initial={false} animate={{ opacity: legsIn ? 1 : 0 }} transition={reduce ? { duration: 0 } : { ...spring, delay: 0.1 }}>3</motion.text>
        <motion.text x={bx + 14} y={(ay + cy) / 2 + 5} textAnchor="middle" fontFamily="var(--font-numeric)" fontSize={18} fontWeight={800} fill={p.creamSoft}
          initial={false} animate={{ opacity: legsIn ? 1 : 0 }} transition={reduce ? { duration: 0 } : { ...spring, delay: 0.28 }}>4</motion.text>

        {/* gap length readout — counts up as the line draws */}
        <motion.text x={(ax + bx) / 2 - 16} y={(ay + cy) / 2 - 8} textAnchor="middle" fontFamily="var(--font-numeric)" fontSize={20} fontWeight={800} fill={col}
          initial={false} animate={{ opacity: sweep ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.3 }}>{diagText}</motion.text>
      </svg>

      <div key={readout} style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(18px, 2.2vw, 30px)', fontWeight: 800, color: col, transition: 'color 300ms', animation: 'cwPop 320ms ease' }}>
        {readout}
      </div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: solved ? '#2fb37f' : p.mutedOnPaper }}>
        {caption}
      </div>
      <style>{'@keyframes cwPop{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:translateY(0)}}'}</style>
    </div>
  )
}

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'radicalsPythagorean',
  title: 'CLIMB ROUTE',
  ticketLabel: 'route card',
  palette: P,
  motif: '🧗',
  makeTask,
  // PER-TASK gating: a question shows the pad only when its answer is a single
  // number the instrument was never producing. The route questions keep the builder
  // because a√b is a move AND a count — a pair no pad can express.
  answerPad: (t) => (t.pad ? numChoices(t.n ?? 0, t.pad, { min: 0 }) : []),
  // REQUIRED: V is a tagged union, so a bare tapped number would never satisfy
  // `v.k === 'num'` and every padded question would mark every answer wrong —
  // silently, because a wrong answer still advances. (This shipped once already.)
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) => (t.kind === 'route' || t.kind === 'combine' ? { k: 'route', count: 0, mv: -1 } : { k: 'num', n: 0 }),
  // Routes grade on the move the child chose AND how many they laid down. Every
  // move vector is primitive, so exactly one (move, count) pair reaches the top
  // hold — the child cannot arrive at the right endpoint by the wrong route.
  grade: (t, v) =>
    t.kind === 'route' || t.kind === 'combine'
      ? v.k === 'route' && v.mv >= 0 && MOVES[v.mv].b === t.b && v.count === t.a
      : v.k === 'num' && v.n === t.n,
  revealText: (t) => (t.kind === 'route' || t.kind === 'combine' ? radStr(t.a ?? 0, t.b ?? 1) : `${t.n}`),
  glide: (t, _from, setValue, later) =>
    later(() => setValue(
      t.kind === 'route' || t.kind === 'combine'
        ? { k: 'route', count: t.a ?? 0, mv: Math.max(0, moveIdxFor(t.b ?? 2)) }
        : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'route' || task.kind === 'combine') {
      return <RouteBuilder P={palette} task={task} value={value} setValue={setValue}
        disabled={disabled} reveal={reveal} onCommit={onCommit} />
    }
    // Fallback only: every gap/leg task ships with `pad`, so GameShell renders the
    // AnswerPad and never reaches this. Kept so a future numeric task without `pad`
    // degrades to a dial rather than to nothing.
    const n = value.k === 'num' ? value.n : 0
    return <SlideValue P={palette} value={n} setValue={(x) => setValue({ k: 'num', n: x })} min={task.lo ?? 0} max={task.hi ?? 20}
      disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'num', n: x })} commitLabel="MEASURE IT ✓" />
  },
  // Branches by example, so the child watches the gesture they will be graded on:
  // the gap example poses on the wall section, the route example on the builder's
  // own board.
  TutorialScene: ({ palette, task, value, stepIndex, ended }) =>
    task.kind === 'route'
      ? <RouteBoard P={palette} task={task} count={value.k === 'route' ? value.count : 0} mv={value.k === 'route' ? value.mv : -1} />
      : <GapScene palette={palette} value={value} stepIndex={stepIndex} ended={ended} />,
  start: {
    blurb: <><strong>You&apos;re reading a climbing wall.</strong> Holds sit on a grid, so the straight gap between any two comes from <strong>across² + up²</strong>. Repeat one move all the way up and the whole route is just <strong>that move, counted</strong>.</>,
    ticket: { title: 'Route card', badge: '√(3² + 4²)', tone: 'a' },
    startLabel: 'Read the wall →',
  },
  overview: {
    say: 'Here is the plan. Holds on a climbing wall sit on a grid, so the straight gap between two of them is the long side of a right triangle: square the across, square the up, add them, then take the square root. And a whole route is one move repeated — six moves of root two is six root two, which is the same thing as root seventy-two. Let us work through both, nice and slow.',
    problem: <>How far apart are two holds <strong>3 across</strong> and <strong>4 up</strong>?</>,
    points: [
      <>Across and up meet at a square corner — so <strong>a² + b² = c²</strong>.</>,
      <>Take the <strong>square root</strong> to undo the square and get the gap.</>,
      <>A route is <strong>one move, counted</strong>: 6 moves of √2 is <strong>6√2</strong> — and that is √72.</>,
      <>Same move on both sections? Just <strong>add the counts</strong>.</>,
    ],
  },
  tutorial: [
    { task: DEMO_GAP, initial: { k: 'num', n: 0 }, hand: 'drag', steps: GAP_STEPS },
    { task: DEMO_ROUTE, initial: { k: 'route', count: 0, mv: -1 }, hand: 'tap', steps: ROUTE_STEPS },
  ],
  // No guided round: the walkthrough works BOTH graded gestures (the gap, then the
  // route builder), so nothing scored was left unshown.
  sig: (t) => `${t.kind}:${t.badge}`,
}

export default function ScreenDistance(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
