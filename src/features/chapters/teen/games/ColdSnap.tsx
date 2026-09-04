'use client'
/**
 * ColdSnap — the Polynomial Functions chapter (17–18) as a PLAYABLE GAME.
 *
 * World: COLD SNAP. A week of temperature, with freezing drawn across the middle.
 * Everything a polynomial does is something the week does:
 *   • the ZEROS are the moments it crosses freezing
 *   • MULTIPLICITY is the difference between touching 0° and lifting away, and
 *     plunging straight through it
 *   • the SIGN CHART is which stretches of the week are actually icy
 *   • END BEHAVIOUR is what the fitted curve claims before the week began and
 *     after it ended — and it is exactly why a polynomial is a poor long forecast
 *
 * ⚠️ THIS IS THE WEAKEST WORLD OF THE THIRTEEN AND IS ON NOTICE
 * (docs/teen-17-18-gameshell-plan.md §5.1). Real weather is closer to sinusoidal
 * than polynomial. It earns its place because zeros, multiplicity, sign chart and
 * end behaviour all read clearly in it, and nothing else in daily life crosses
 * zero repeatedly. The end-behaviour context says out loud that the curve is only
 * trusted inside the week, so the world is not asked to claim something false.
 *
 *   • TAP  → AnswerPad: the degree, the most crossings it could have, the most
 *            turns it can take, and the hour where it only touches freezing.
 *   • SET  → THE ENDS: two switches, one per end of the week — climbing or
 *            plunging. Four cards would be recall; two switches is the rule
 *            (even/odd decides SAME or SPLIT, the sign decides which way) applied.
 *   • TAP  → THE TRACE: tap the days it crosses freezing, straight on the chart.
 *   • SET  → THE ICE ROW: one above/below toggle per stretch between crossings.
 *
 * ZERO pickers.
 *
 * ⚠️ TWO DELIBERATE NARROWINGS, both marked where they live:
 *   • roots are POSITIVE, so every factor reads (x − r) and every crossing lands
 *     inside the week that is drawn. That loses the (x + r) sign case the old
 *     lesson had; a crossing on day −3 is not a thing this chart can show.
 *   • the SIGN CHART is not in the old lesson. It is kept anyway because it uses
 *     no math the zeros task has not already generated (the sign of a product) and
 *     it is the one question this world makes vivid — which hours are icy. Nothing
 *     else was added: no synthetic division, no build-from-zeros.
 *
 * The rest of the math is the old PolynomialFunctionsTeenLesson.makeRound, same
 * L1/L2/L3 ramp.
 */
import { type ReactElement } from 'react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, CommitBtn, numChoices } from './parts/gameKit'
import { rint, pick } from '@/core/rand'
import { disp } from '@/core/fmt'

const P: Palette = {
  nightTop: '#101d2e', nightBot: '#060b14',
  cream: '#eaf3fb', creamSoft: 'rgba(234,243,251,0.82)',
  inkOnPaper: '#101d2e', mutedOnPaper: '#7c93ad',
  gold: '#8fd8ff', goldDeep: '#2f7fb8',
  coral: '#ff9a8a', coralDeep: '#dd5f4c', mint: '#74e0b4',
  glass: 'rgba(16,29,46,0.62)', glassBorder: 'rgba(234,243,251,0.2)',
}


/** The week, in days. Every crossing this chapter draws lands inside it. */
const DAY_MIN = 0
const DAY_MAX = 7

type Dir = 'up' | 'down'

// A tapped number, the two ends, a set of crossings, or a sign per stretch.
type V =
  | { k: 'num'; n: number }
  | { k: 'ends'; l: Dir; r: Dir }
  | { k: 'zeros'; xs: number[] }
  | { k: 'signs'; s: number[] }

/** A factored polynomial, which is how every trace in this chapter is built. */
interface Poly { s: number; rs: { r: number; m: number }[] }
const evalPoly = (p: Poly, x: number) =>
  p.s * p.rs.reduce((v, f) => v * (x - f.r) ** f.m, 1)
/** ⚠️ Reads as (x − r) always, which is only honest because roots are positive. */
const polyLabel = (p: Poly) =>
  `${p.s < 0 ? '−' : ''}${p.rs.map((f) => `(x − ${f.r})${f.m === 2 ? '²' : ''}`).join('')}`

interface Task extends BaseTask {
  kind: 'degree' | 'ends' | 'maxzeros' | 'zeros' | 'mult' | 'turns' | 'signs'
  n?: number; pad?: number[]
  el?: Dir; er?: Dir            // ends
  poly?: Poly                   // whatever the trace draws
  roots?: number[]              // zeros: the days it crosses
  cuts?: number[]; sgn?: number[]  // signs: the boundaries, and the answer per stretch
}

// ── end behaviour, from degree parity + leading sign ──────────────────────────
const endsOf = (even: boolean, positive: boolean): { l: Dir; r: Dir } =>
  even
    ? { l: positive ? 'up' : 'down', r: positive ? 'up' : 'down' }
    : { l: positive ? 'down' : 'up', r: positive ? 'up' : 'down' }

/** ⚠️ This wording holds for all four cases — it names the two RULES, never a
 *  particular outcome, so no seed can make it false. */
const ENDS_CONTEXT =
  'The forecaster fits a curve to the week and then lets it run on, back before the week began and forward past its end. Only two things decide what it does out there: whether the highest power is even or odd, and whether the number in front of it is positive or negative. It is also why nobody trusts a fitted curve far outside the days it was drawn from.'

const arrow = (d: Dir) => (d === 'up' ? '↗' : '↘')

/** ⚠️ MODULE LEVEL. Declared inside its parent this is a new component TYPE on every render,
 *  so React unmounts and remounts the subtree each time — restarting its transitions and
 *  discarding the elements the child is interacting with. Closed-over values are props. */
function Col({ side, dir, label, col, disabled, l, r, setValue }: { side: 'l' | 'r'; dir: Dir; label: string; col: string; disabled?: boolean; l: Dir; r: Dir; setValue: (v: V) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px,0.8vw,10px)' }}>
      <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(9px,0.95vw,12px)', letterSpacing: '0.09em', textTransform: 'uppercase', color: P.mutedOnPaper }}>{label}</span>
      <div style={{ fontSize: 'clamp(28px,3.4vw,46px)', lineHeight: 1, color: col }}>{arrow(dir)}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Toggle on={dir === 'up'} label="climbs" col={col} disabled={disabled}
          onClick={() => setValue({ k: 'ends', l: side === 'l' ? 'up' : l, r: side === 'r' ? 'up' : r })} />
        <Toggle on={dir === 'down'} label="plunges" col={col} disabled={disabled}
          onClick={() => setValue({ k: 'ends', l: side === 'l' ? 'down' : l, r: side === 'r' ? 'down' : r })} />
      </div>
    </div>
  )
}

function endsTask(d: 1 | 2): Task {
  // L1 is even-degree only (both ends agree, the easier read); L2 draws all four.
  const even = d === 1 ? true : Math.random() < 0.5
  const positive = Math.random() < 0.5
  const { l, r } = endsOf(even, positive)
  const lead = `${positive ? '' : '−'}${d === 1 ? '3' : '2'}${even ? 'x⁴' : 'x³'}`
  return {
    kind: 'ends', title: 'Past the week', tone: 'b',
    badge: `f(x) = ${lead} + …`, showEquals: false,
    prompt: 'What does it do at each end?',
    context: ENDS_CONTEXT,
    instruction: 'Set each end climbing or plunging, then lock it in.',
    say: `A polynomial with leading term ${positive ? '' : 'negative '}${d === 1 ? 'three' : 'two'} x to the ${even ? 'fourth' : 'third'}. What does it do at the ends?`,
    work: [
      even
        ? 'The highest power is even, so both ends of the week do the SAME thing.'
        : 'The highest power is odd, so the two ends SPLIT — one climbs, the other plunges.',
      `The number in front is ${positive ? 'positive' : 'negative'}, so the right-hand end ${r === 'up' ? 'climbs' : 'plunges'}.`,
      `That leaves the left-hand end ${l === 'up' ? 'climbing' : 'plunging'}.`,
    ],
    el: l, er: r,
  }
}

// ── L1 · the degree of the fitted curve ───────────────────────────────────────
function degreeTask(): Task {
  const deg = rint(2, 5)
  const lead = ['', '', 'x²', 'x³', 'x⁴', 'x⁵'][deg]
  return {
    kind: 'degree', title: 'The fit', tone: 'a',
    badge: `f(x) = 2${lead} − 5x + 1`, answerLabel: 'degree =',
    prompt: 'What is the degree?',
    context: 'This is the curve the forecaster fitted to the week. Its degree is simply the highest power anywhere in it — not the number in front, and not how many terms there are. The degree is what caps how much the temperature is allowed to wander.',
    padInstruction: 'Tap the degree.',
    say: `What is the degree of the polynomial whose highest power is ${deg}?`,
    work: [
      'The degree is the highest exponent in the whole expression.',
      `The leading term here is ${lead}, so the degree is ${deg}.`,
    ],
    n: deg, pad: [2, deg + 1, deg - 1],
  }
}

// ── L2 · how far the week could swing ─────────────────────────────────────────
function maxZerosTask(): Task {
  const deg = rint(3, 6)
  return {
    kind: 'maxzeros', title: 'At most', tone: 'a',
    badge: `degree ${deg}`, answerLabel: 'crossings ≤', showEquals: true,
    prompt: 'How many crossings at most?',
    context: 'Each time the temperature passes through freezing, the fitted curve has used up one of its roots. A curve of a given degree only has so many to spend, so the degree puts a hard ceiling on how many times a week can flip between icy and mild.',
    padInstruction: 'Tap the most crossings it could have.',
    say: `A polynomial has degree ${deg}. What is the greatest number of times it can cross freezing?`,
    work: [
      'A polynomial can have at most as many real zeros as its degree.',
      `Degree ${deg}, so at most ${deg} crossings.`,
    ],
    n: deg, pad: [deg - 1, deg + 1, deg - 2],
  }
}

// ── L2 · which stretches are actually icy ─────────────────────────────────────
/** ⚠️ Deliberately NOT in the old lesson — see the header. The leading sign AND the
 *  multiplicities both vary, so the answer is not one fixed pattern across seeds. */
function signsTask(): Task {
  const s = Math.random() < 0.5 ? 1 : -1
  const a = rint(1, 3)
  const b = rint(a + 2, 6)
  // one root may be doubled, which is what stops the signs simply alternating
  const dbl = Math.random() < 0.4 ? pick([a, b]) : null
  const poly: Poly = { s, rs: [{ r: a, m: dbl === a ? 2 : 1 }, { r: b, m: dbl === b ? 2 : 1 }] }
  const cuts = [a, b]
  const mids = [(DAY_MIN + a) / 2, (a + b) / 2, (b + DAY_MAX) / 2]
  const sgn = mids.map((x) => (evalPoly(poly, x) > 0 ? 1 : -1))
  return {
    kind: 'signs', title: 'The icy hours', tone: 'b',
    badge: `f(x) = ${polyLabel(poly)}`, showEquals: false,
    prompt: 'Which stretches are below freezing?',
    context: `The curve only changes side at a crossing, so between two crossings the whole stretch is on one side. Work out the sign of each bracket somewhere in the middle of a stretch and multiply them together${s < 0 ? ', then flip it, because there is a minus out front' : ''}.`,
    instruction: 'Set each stretch above or below freezing, then lock it in.',
    say: 'Between the crossings, which stretches of the week sit below freezing?',
    work: [
      `It only flips side where it crosses, so the week splits at day ${a} and day ${b}.`,
      `Test one day inside each stretch in ${polyLabel(poly)} and read the sign.`,
      `That gives ${sgn.map((v) => (v > 0 ? 'above' : 'below')).join(', then ')}.`,
    ],
    cuts, sgn, poly,
  }
}

// ── L3 · the crossings themselves ─────────────────────────────────────────────
function zerosTask(): Task {
  const a = rint(1, 3)
  const b = rint(a + 2, 6)
  const poly: Poly = { s: 1, rs: [{ r: a, m: 1 }, { r: b, m: 1 }] }
  return {
    kind: 'zeros', title: 'The crossings', tone: 'a',
    badge: `f(x) = ${polyLabel(poly)}`, showEquals: false,
    prompt: 'Which days does it cross freezing?',
    context: 'A product is zero the moment any one of its brackets is zero, so every crossing is hiding in a bracket. Read each bracket on its own and ask which day would make it come out as nothing.',
    instruction: 'Tap every day it crosses freezing, then lock it in.',
    say: 'On which days does this curve cross freezing?',
    work: [
      'Set each bracket to zero on its own.',
      `(x − ${a}) is zero on day ${a}, and (x − ${b}) is zero on day ${b}.`,
      `So it crosses freezing twice: day ${a} and day ${b}.`,
    ],
    roots: [a, b], poly,
  }
}

/** Multiplicity, asked as the thing you would actually notice: a doubled root only
 *  TOUCHES freezing and lifts away, a single root plunges straight through. Both
 *  directions of the question are drawn, so it is never just "find the square". */
function multTask(): Task {
  const a = rint(1, 3)
  const b = rint(a + 2, 6)
  const dblFirst = Math.random() < 0.5
  const dbl = dblFirst ? a : b
  const single = dblFirst ? b : a
  const poly: Poly = { s: 1, rs: [{ r: a, m: dblFirst ? 2 : 1 }, { r: b, m: dblFirst ? 1 : 2 }] }
  const askTouch = Math.random() < 0.5
  return {
    kind: 'mult', title: 'Touch or through', tone: 'b',
    badge: `f(x) = ${polyLabel(poly)}`,
    answerLabel: 'day =',
    prompt: askTouch ? 'Which day only touches freezing?' : 'Which day plunges through?',
    context: 'A bracket that appears twice is a day where the curve reaches freezing and then turns back the way it came — it touches and lifts off. A bracket that appears once is a day it goes straight through and comes out the other side.',
    padInstruction: askTouch ? 'Tap the day it only touches.' : 'Tap the day it goes through.',
    say: askTouch
      ? 'On which day does the temperature only touch freezing and lift away again?'
      : 'On which day does the temperature plunge straight through freezing?',
    work: [
      `The squared bracket is (x − ${dbl}), so day ${dbl} is a double root — it touches and turns back.`,
      `(x − ${single}) appears once, so day ${single} is where it passes straight through.`,
      askTouch ? `The question asked which one only touches: day ${dbl}.` : `The question asked which one goes through: day ${single}.`,
    ],
    n: askTouch ? dbl : single,
    pad: [askTouch ? single : dbl, a + b, Math.max(1, a - 1)],
    poly,
  }
}

function turnsTask(): Task {
  const deg = rint(3, 6)
  const ans = deg - 1
  return {
    kind: 'turns', title: 'At most', tone: 'a',
    badge: `degree ${deg}`, answerLabel: 'turns ≤', showEquals: true,
    prompt: 'How many turns at most?',
    context: 'A turn is a day the temperature stops falling and starts rising, or the other way round. A curve of a given degree can only manage so many of those — one fewer than its degree, however wild the week looks.',
    padInstruction: 'Tap the most turns it could have.',
    say: `A degree ${deg} polynomial has at most how many turning points?`,
    work: [
      'A polynomial turns at most one time fewer than its degree.',
      `Degree ${deg}, so at most ${deg} − 1 = ${ans} turns.`,
    ],
    n: ans, pad: [deg, ans - 1, deg + 1],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return Math.random() < 0.5 ? degreeTask() : endsTask(1)
  if (d === 2) {
    const roll = Math.random()
    return roll < 0.4 ? endsTask(2) : roll < 0.7 ? signsTask() : maxZerosTask()
  }
  const roll = Math.random()
  return roll < 0.4 ? zerosTask() : roll < 0.75 ? multTask() : turnsTask()
}

// ══════════════════════════════════════════════════════════════════════════════
// THE TRACE — one drawing, shared by every instrument in the chapter. Freezing is
// the line across the middle; the curve is the fitted week, normalised so its
// shape reads at any amplitude.
// ══════════════════════════════════════════════════════════════════════════════
const BOX = { w: 300, h: 150, x0: 26, x1: 288, y0: 16, y1: 128 }
const yMid = (BOX.y0 + BOX.y1) / 2
const xAt = (day: number) => BOX.x0 + ((day - DAY_MIN) / (DAY_MAX - DAY_MIN)) * (BOX.x1 - BOX.x0)

/** ⚠️ Scaled off the 70th percentile of |f|, NOT the peak. A polynomial's ends run
 *  away from everything in the middle, so scaling by the peak squashes the dip
 *  below freezing — the one part of the curve this chapter is about — down to a few
 *  pixels. This lets the ends run off the top and bottom (they are clipped) and
 *  gives the crossings the room. Nothing about the crossings themselves moves. */
function tracePath(poly: Poly): string {
  const pts: [number, number][] = []
  for (let i = 0; i <= 120; i++) {
    const x = DAY_MIN + (i / 120) * (DAY_MAX - DAY_MIN)
    pts.push([x, evalPoly(poly, x)])
  }
  const sorted = pts.map(([, v]) => Math.abs(v)).sort((a, b) => a - b)
  const ref = sorted[Math.floor(sorted.length * 0.7)] || 1
  const scale = ((yMid - BOX.y0 - 6) * 0.62) / ref
  return pts
    .map(([x, v], i) => `${i === 0 ? 'M' : 'L'} ${xAt(x).toFixed(1)} ${(yMid - v * scale).toFixed(1)}`)
    .join(' ')
}

function Trace({ poly, marks, bands, col }: {
  poly?: Poly
  /** days to flag on the freezing line */
  marks?: number[]
  /** [from, to, sign] shaded stretches */
  bands?: [number, number, number][]
  col: string
}) {
  return (
    <svg viewBox={`0 0 ${BOX.w} ${BOX.h}`} width="100%" style={{ maxWidth: 'clamp(210px, 28vw, 340px)', display: 'block' }} aria-hidden>
      <defs>
        <clipPath id="cs-box"><rect x={BOX.x0 - 2} y={BOX.y0} width={BOX.x1 - BOX.x0 + 4} height={BOX.y1 - BOX.y0} /></clipPath>
      </defs>
      <rect x={0} y={0} width={BOX.w} height={BOX.h} rx={10} fill="rgba(0,0,0,0.26)" stroke={P.glassBorder} strokeWidth={1} />
      {bands?.map(([from, to, s], i) => (
        <rect key={i} x={xAt(from)} y={s > 0 ? BOX.y0 : yMid} width={xAt(to) - xAt(from)} height={yMid - BOX.y0}
          fill={s > 0 ? 'rgba(143,216,255,0.14)' : 'rgba(116,224,180,0.16)'} />
      ))}
      <line x1={BOX.x0} y1={yMid} x2={BOX.x1} y2={yMid} stroke={P.creamSoft} strokeWidth={1.2} strokeDasharray="5 4" />
      <text x={BOX.x0 - 4} y={yMid - 4} textAnchor="end" fill={P.mutedOnPaper} fontSize={8} fontFamily="var(--font-numeric)">0°</text>
      {poly && <path d={tracePath(poly)} fill="none" stroke={col} strokeWidth={2.4} strokeLinejoin="round" clipPath="url(#cs-box)" />}
      {marks?.map((m) => (
        <circle key={m} cx={xAt(m)} cy={yMid} r={5} fill={col} stroke={P.nightBot} strokeWidth={1.5} />
      ))}
      <text x={BOX.x1} y={BOX.h - 5} textAnchor="end" fill={P.mutedOnPaper} fontSize={8} fontFamily="var(--font-numeric)">DAYS →</text>
    </svg>
  )
}

/** A small square toggle used by both the ends and the ice row. */
function Toggle({ on, label, disabled, col, onClick }: {
  on: boolean; label: string; disabled?: boolean; col: string; onClick: () => void
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} style={{
      padding: 'clamp(8px,1vw,12px) clamp(9px,1.1vw,15px)', borderRadius: 10, minHeight: 44, minWidth: 44,
      border: `2px solid ${on ? col : P.glassBorder}`, background: on ? `${col}22` : P.glass,
      color: on ? col : P.creamSoft, fontFamily: 'var(--font-numeric)', fontWeight: 800,
      fontSize: 'clamp(11px,1.1vw,14px)', lineHeight: 1.2, cursor: disabled ? 'default' : 'pointer',
    }}>{label}</button>
  )
}

// ── THE ENDS — one switch per end of the week ─────────────────────────────────
function EndSwitches({ value, setValue, disabled, reveal, onCommit }: {
  value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const l = value.k === 'ends' ? value.l : 'up'
  const r = value.k === 'ends' ? value.r : 'up'
  const col = reveal ? P.mint : P.gold
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.3vw,18px)', width: '100%' }}>
      <div style={{ display: 'flex', gap: 'clamp(16px,2.6vw,44px)', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Col side="l" dir={l} label="before the week" col={col} disabled={disabled} l={l} r={r} setValue={setValue} />
        <Col side="r" dir={r} label="after the week" col={col} disabled={disabled} l={l} r={r} setValue={setValue} />
      </div>
      <CommitBtn P={P} label="LOCK IN ✓" disabled={disabled} onClick={() => onCommit({ k: 'ends', l, r })} />
    </div>
  )
}

// ── THE TRACE TAP — tap the days it crosses freezing ──────────────────────────
function FreezeTrace({ task, value, setValue, disabled, reveal, onCommit }: {
  task: Task; value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const xs = value.k === 'zeros' ? value.xs : []
  const col = reveal ? P.mint : P.gold
  const toggle = (d: number) =>
    setValue({ k: 'zeros', xs: xs.includes(d) ? xs.filter((v) => v !== d) : [...xs, d].sort((a, b) => a - b) })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(9px,1.2vw,16px)', width: '100%' }}>
      {/* The curve is drawn WITHOUT the answer flagged — the markers are the child's. */}
      <Trace poly={task.poly} marks={xs} col={col} />
      <div style={{ display: 'flex', gap: 'clamp(4px,0.6vw,8px)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {Array.from({ length: DAY_MAX - DAY_MIN + 1 }, (_, i) => DAY_MIN + i).map((d) => (
          <Toggle key={d} on={xs.includes(d)} label={String(d)} col={col} disabled={disabled} onClick={() => toggle(d)} />
        ))}
      </div>
      <CommitBtn P={P} label="MARK THEM ✓" disabled={disabled} onClick={() => onCommit({ k: 'zeros', xs })} />
    </div>
  )
}

// ── THE ICE ROW — above or below freezing, one stretch at a time ──────────────
function IceRow({ task, value, setValue, disabled, reveal, onCommit }: {
  task: Task; value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const cuts = task.cuts ?? []
  const edges = [DAY_MIN, ...cuts, DAY_MAX]
  const s = value.k === 'signs' ? value.s : edges.slice(1).map(() => 1)
  const col = reveal ? P.mint : P.gold
  const set = (i: number, v: number) => setValue({ k: 'signs', s: s.map((old, j) => (j === i ? v : old)) })
  const bands = s.map((v, i) => [edges[i], edges[i + 1], v] as [number, number, number])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(9px,1.2vw,16px)', width: '100%' }}>
      {/* Shaded from the child's own answer, so a wrong reading looks wrong. */}
      <Trace bands={bands} marks={cuts} col={col} />
      <div style={{ display: 'flex', gap: 'clamp(6px,0.9vw,12px)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {s.map((v, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(9px,0.95vw,12px)', color: P.mutedOnPaper }}>
              day {edges[i]}–{edges[i + 1]}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <Toggle on={v > 0} label="above" col={col} disabled={disabled} onClick={() => set(i, 1)} />
              <Toggle on={v < 0} label="below" col={col} disabled={disabled} onClick={() => set(i, -1)} />
            </div>
          </div>
        ))}
      </div>
      <CommitBtn P={P} label="LOCK IN ✓" disabled={disabled} onClick={() => onCommit({ k: 'signs', s })} />
    </div>
  )
}

const sameSet = (a: number[] = [], b: number[] = []) =>
  a.length === b.length && [...a].sort((x, y) => x - y).every((v, i) => v === [...b].sort((x, y) => x - y)[i])

// ── walkthrough: the two gestures that are not a tap ──────────────────────────
const DEMO_ENDS: Task = {
  kind: 'ends', title: 'Past the week', badge: 'f(x) = −2x³ + …', tone: 'b',
  prompt: '', say: '', work: [], el: 'up', er: 'down',
}
const DEMO_ENDS_STEPS: DemoStep<V>[] = [
  { say: 'The forecaster has fitted a curve to a week of temperature. Ask it what happens outside that week and it will happily answer.', value: { k: 'ends', l: 'up', r: 'up' }, board: 'f(x) = −2x³ + …' },
  { say: 'Only the biggest term matters out there. Far from the week, everything else is a rounding error next to x cubed.', value: { k: 'ends', l: 'up', r: 'up' }, board: 'far out → only −2x³ counts' },
  { say: 'Three is odd, and an odd power keeps the sign of whatever you put in. So the two ends do opposite things — they split.', value: { k: 'ends', l: 'up', r: 'up' }, board: 'odd power → ends split' },
  { say: 'Now the minus in front. Put in a big positive day and x cubed is big and positive, and the minus turns it upside down.', value: { k: 'ends', l: 'up', r: 'down' }, board: 'big day → −2x³ plunges' },
  { say: 'So after the week it plunges. And because the ends split, the other end has to be the opposite: before the week it climbs.', value: { k: 'ends', l: 'up', r: 'down' }, board: 'left climbs, right plunges' },
  { say: 'Which is also the honest reason nobody forecasts with one of these. Run it far enough and it promises temperatures no week has ever had.', value: { k: 'ends', l: 'up', r: 'down' }, board: 'trust it inside the week only' },
]

const DEMO_POLY: Poly = { s: 1, rs: [{ r: 2, m: 1 }, { r: 5, m: 1 }] }
const DEMO_ZEROS: Task = {
  kind: 'zeros', title: 'The crossings', badge: 'f(x) = (x − 2)(x − 5)', tone: 'a',
  prompt: '', say: '', work: [], roots: [2, 5], poly: DEMO_POLY,
}
const DEMO_ZEROS_STEPS: DemoStep<V>[] = [
  { say: 'Here is a colder week, written as two brackets multiplied together.', value: { k: 'zeros', xs: [] }, board: '(x − 2)(x − 5)' },
  { say: 'Freezing is the dashed line. We want the days the temperature is exactly on it.', value: { k: 'zeros', xs: [] }, board: 'find f(x) = 0' },
  { say: 'A multiplication only comes out as zero when one of the things being multiplied is itself zero. So take the brackets one at a time.', value: { k: 'zeros', xs: [] }, board: 'a product is 0 → a bracket is 0' },
  { say: 'x minus two is zero on day two. So day two is a crossing.', value: { k: 'zeros', xs: [2] }, board: '(x − 2) = 0 → day 2' },
  { say: 'And x minus five is zero on day five. That is the second one.', value: { k: 'zeros', xs: [2, 5] }, board: '(x − 5) = 0 → day 5' },
  { say: 'Two brackets, two crossings — and between them is the stretch of the week that actually stayed below freezing.', value: { k: 'zeros', xs: [2, 5] }, board: 'crossings: day 2, day 5' },
]

// ══════════════════════════════════════════════════════════════════════════════
export const CONFIG: GameConfig<V, Task> = {
  chapterId: 'polynomialFunctions',
  title: 'COLD SNAP',
  ticketLabel: 'week log',
  palette: P,
  motif: '🌡️',
  makeTask,
  answerPad: (t) =>
    t.kind === 'degree' || t.kind === 'maxzeros' || t.kind === 'turns' || t.kind === 'mult'
      ? numChoices(t.n ?? 0, t.pad ?? [], { min: 0 })
      : [],
  // REQUIRED: V is a tagged union (docs/lessons.md — the 15–16 prod bug).
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) =>
    t.kind === 'ends' ? { k: 'ends', l: 'up', r: 'up' }
      : t.kind === 'zeros' ? { k: 'zeros', xs: [] }
        : t.kind === 'signs' ? { k: 'signs', s: (t.sgn ?? []).map(() => 1) }
          : { k: 'num', n: 0 },
  grade: (t, v) =>
    t.kind === 'ends' ? v.k === 'ends' && v.l === t.el && v.r === t.er
      : t.kind === 'zeros' ? v.k === 'zeros' && sameSet(v.xs, t.roots)
        : t.kind === 'signs' ? v.k === 'signs' && (t.sgn ?? []).every((s, i) => v.s[i] === s)
          : v.k === 'num' && v.n === t.n,
  revealText: (t) =>
    t.kind === 'ends' ? `${t.el === 'up' ? 'climbs' : 'plunges'} / ${t.er === 'up' ? 'climbs' : 'plunges'}`
      : t.kind === 'zeros' ? `day ${(t.roots ?? []).join(' and day ')}`
        : t.kind === 'signs' ? (t.sgn ?? []).map((s) => (s > 0 ? 'above' : 'below')).join(', ')
          : disp(t.n ?? 0),
  glide: (t, _f, setValue, later) => later(() => setValue(
    t.kind === 'ends' ? { k: 'ends', l: t.el ?? 'up', r: t.er ?? 'up' }
      : t.kind === 'zeros' ? { k: 'zeros', xs: t.roots ?? [] }
        : t.kind === 'signs' ? { k: 'signs', s: t.sgn ?? [] }
          : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, onCommit }): ReactElement =>
    task.kind === 'ends'
      ? <EndSwitches value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
      : task.kind === 'signs'
        ? <IceRow task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
        : <FreezeTrace task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />,
  TutorialScene: ({ task, value }) =>
    task.kind === 'ends'
      ? <EndSwitches value={value} setValue={() => {}} disabled onCommit={() => {}} />
      : <FreezeTrace task={task} value={value} setValue={() => {}} disabled onCommit={() => {}} />,
  start: {
    blurb: <><strong>A week of temperature, with freezing drawn across the middle.</strong> Find the days it crosses, tell a day it only touches from a day it plunges through, mark the icy stretches — and see what the fitted curve claims about the days either side of the week.</>,
    ticket: { title: 'Week log', badge: '(x − 2)(x − 5)', tone: 'a' },
    startLabel: 'Read the week →',
  },
  overview: {
    say: 'Here is the plan. A curve is fitted across a week of temperature, and freezing is the line through the middle. Where the curve crosses that line are the moments it froze, and each one is hiding in a bracket. A bracket that turns up twice is a day it only touches freezing and lifts away again. Between the crossings, the whole stretch sits on one side, which is how you find the icy hours. Let us read one together, nice and slow.',
    problem: <>Which days does <strong>(x − 2)(x − 5)</strong> cross freezing?</>,
    points: [
      <>A product is zero when <strong>one bracket</strong> is zero.</>,
      <>A <strong>doubled</strong> bracket touches and lifts; a single one goes through.</>,
      <>Between crossings the stretch stays on <strong>one side</strong>.</>,
      <>Even power → both ends <strong>agree</strong>; odd → they <strong>split</strong>.</>,
    ],
  },
  tutorial: [
    { task: DEMO_ZEROS, initial: { k: 'zeros', xs: [] }, hand: 'tap', steps: DEMO_ZEROS_STEPS },
    { task: DEMO_ENDS, initial: { k: 'ends', l: 'up', r: 'up' }, hand: 'tap', steps: DEMO_ENDS_STEPS },
  ],
  sig: (t) => `${t.kind}:${t.badge}:${t.prompt}`,
}

export default function ColdSnap(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
