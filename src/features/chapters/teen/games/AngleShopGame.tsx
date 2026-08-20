'use client'
/**
 * THE ANGLE SHOP (9–11 · `anglesSymmetry`) on GameShell.
 *
 * TWO VERBS, ONE CONTROL SHAPE: TURN IT (the job names a requirement, the child turns a real thing)
 * and MARK THE FOLDS (mark every axis you believe holds, then fold them all at once). Both are EXACT
 * TRANSFORMS — a rotation of `deg` IS `deg`, a mirror about an axis IS a fold — so the instrument can
 * be code-drawn without the picture lying about the math.
 *
 * ⚠️ EVERYTHING THAT CAN BE WRONG IS STILL IN `story/angles.ts`, UNTOUCHED — the week, the paper
 * table, the axis sets, the grader, `guideShown` (the set-square STAYS on an exact-degrees round,
 * which is the only reference that round has) and the rule that no slope is ever asked to be obtuse.
 *
 * ⚠️ THIS IS THE ONE CHAPTER WHOSE HAND READING MEANS TWO DIFFERENT THINGS, and it is why
 * `HandSpec.value` takes the task: a tilt is a DEGREE while the child is setting an angle and a FOLD
 * AXIS while they are marking symmetry. One reading, two meanings, chosen by the round.
 */
import React from 'react'
import { Game, type BaseTask, type GameConfig, type InstrumentProps } from './parts/GameShell'
import { KID_P as P, Cue, useLatest } from './parts/kidKit'
import { useHand } from '@/infra/ar/HandInput'
import {
  STEP, clampDeg, snapDeg, nearestAxis, candidateAxes, trueAxes, isTrueAxis, SHAPE_LINES,
  makeRound, grade, missFor, verdictFor, sigFor, guideShown, handDrivesAngle, pieceOf, ANCHOR,
  explainBeats,
  type Round, type FoldRound, type QType, type Tier,
} from '@/features/chapters/story/angles'

/** the arm's angle, the axes marked so far, and which axis the fold bar is aimed at */
export interface AsV { deg: number; marked: number[]; bar: number }

export interface AsTask extends BaseTask { r: Round }

function toTask(r: Round): AsTask {
  const { piece } = pieceOf(r)
  return {
    r,
    title: r.job_.where,
    /** ⚠️ THE PIECE, NEVER THE ANGLE OR THE LINE COUNT — both are the answer. */
    badge: piece,
    tone: r.type === 'fold' ? 'b' : 'a',
    prompt: r.ask,
    context: r.ask,
    say: r.ask,
    /** ⚠️ FROM THE MODULE, NEVER ASSEMBLED HERE. This used to be
     *  `[r.ask, 'Judge it against the square corner.', 'Then set it and see.']` — the question read
     *  back plus two fixed sentences, to a child who had just missed three in a row. */
    work: explainBeats(r),
    showEquals: false,
  }
}

// ─── the turning arm ────────────────────────────────────────────────────────────────────
function SetSquare({ size }: { size: number }) {
  return (
    <svg width={size} height={size} style={{ position: 'absolute', left: 0, bottom: 0, overflow: 'visible', pointerEvents: 'none' }}>
      {/* ⚠️ UP FROM THE VERTEX, THEN RIGHT ALONG THE FIXED ARM. It used to run its horizontal arm
          along the svg's TOP edge, i.e. a full `size` ABOVE the beam it is meant to lie on. */}
      <path d={`M 0 0 L 0 ${size} L ${size} ${size}`} fill="none" stroke={P.creamSoft} strokeWidth={2} strokeDasharray="6 5" opacity={0.75} />
      <path d={`M 0 ${size * 0.28} L ${size * 0.28} ${size * 0.28} L ${size * 0.28} ${size}`} fill="none" stroke={P.creamSoft} strokeWidth={2} opacity={0.75} />
    </svg>
  )
}

function AngleStage({ deg, showDeg, guide, len }: { deg: number; showDeg: boolean; guide: boolean; len: number }) {
  const thick = Math.max(9, Math.round(len * 0.05))
  const arcR = Math.round(len * 0.34)
  const rad = (deg * Math.PI) / 180, mid = (deg * Math.PI) / 360
  const H = arcR * 2 + 40, CX = 20, CY = H - 20
  return (
    <div style={{ position: 'relative', width: len * 2 + 40, height: len + 60 }}>
      <div style={{ position: 'absolute', left: len, bottom: 20 }}>
        {/* the fixed arm — the reference edge the turn is measured against */}
        <div style={{ position: 'absolute', left: 0, bottom: -thick / 2, width: len, height: thick, background: 'rgba(20,29,62,.95)', border: `1px solid ${P.glassBorder}`, borderRadius: thick / 2 }} />
        {guide && <SetSquare size={arcR + 14} />}
        <div style={{
          position: 'absolute', left: 0, bottom: -thick / 2, width: len, height: thick,
          transformOrigin: `0px ${thick / 2}px`, transform: `rotate(${-deg}deg)`, transition: 'transform .16s ease-out',
          background: `linear-gradient(180deg, ${P.gold}, ${P.goldDeep})`, borderRadius: thick / 2, boxShadow: `0 0 18px ${P.gold}99`,
        }} />
        {/* ⚠️ THE ARC IS CENTRED ON THE VERTEX. Anchored to the svg's bottom-left corner, because a
            zero-height container puts `bottom:-20` 20px below its TOP — which is how the mark that
            STATES the angle came to be drawn a whole radius up and right of the angle. */}
        <svg width={H} height={H} style={{ position: 'absolute', left: -20, bottom: -20, overflow: 'visible' }}>
          <path d={`M ${CX + arcR} ${CY} A ${arcR} ${arcR} 0 0 0 ${CX + arcR * Math.cos(rad)} ${CY - arcR * Math.sin(rad)}`}
            fill="none" stroke={P.gold} strokeWidth={2.5} opacity={0.85} />
        </svg>
        <div style={{ position: 'absolute', left: -6, bottom: -6, width: 12, height: 12, borderRadius: '50%', background: P.gold, boxShadow: `0 0 14px ${P.gold}` }} />
        {/* ⚠️ RULE 1 — the figure exists ONLY after the commit, or the child slides until the screen
            agrees and the chapter becomes hot/cold. */}
        {showDeg && (
          <div style={{
            position: 'absolute', left: (arcR + 30) * Math.cos(mid) - 18, bottom: (arcR + 30) * Math.sin(mid) - 12,
            fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: Math.max(18, thick * 1.9),
            color: P.gold, textShadow: `0 0 14px ${P.gold}88`,
          }}>{deg}°</div>
        )}
      </div>
    </div>
  )
}

// ─── the folding sheet ──────────────────────────────────────────────────────────────────
function poly(shape: FoldRound['shape'], r: number): Array<[number, number]> {
  if (shape === 'square') { const s = r * 0.78; return [[-s, -s], [s, -s], [s, s], [-s, s]] }
  if (shape === 'rectangle') { const w = r, h = r * 0.6; return [[-w, -h], [w, -h], [w, h], [-w, h]] }
  if (shape === 'isosceles') return [[0, -r], [r * 0.74, r * 0.66], [-r * 0.74, r * 0.66]]
  const n = shape === 'equilateral' ? 3 : shape === 'pentagon' ? 5 : 6
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return [r * Math.cos(a), r * Math.sin(a)] as [number, number]
  })
}

function FoldStage({ data, marked, bar, showTruth, r }: {
  data: FoldRound; marked: number[]; bar: number; showTruth: boolean; r: number
}) {
  const pts = poly(data.shape, r).map(p => p.join(',')).join(' ')
  const box = r * 2.6
  const truth = trueAxes(data.shape)
  const line = (a: number, len: number) => {
    const rad = (a * Math.PI) / 180
    return { x1: -len * Math.cos(rad), y1: len * Math.sin(rad), x2: len * Math.cos(rad), y2: -len * Math.sin(rad) }
  }
  return (
    <svg width={box} height={box} viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`}>
      {/* ⚠️ A LIT FILL, NOT A BARE OUTLINE — a wireframe is the one thing this look has none of. */}
      <polygon points={pts} fill="rgba(120,150,220,0.12)" stroke={P.gold} strokeWidth={2.5} strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 12px ${P.gold}66)` }} />
      {marked.map((a, i) => {
        const l = line(a, r * 1.18)
        const held = showTruth && isTrueAxis(data.shape, a)
        const failed = showTruth && !held
        return <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={held ? P.mint : failed ? '#FF5D7A' : P.gold} strokeWidth={held ? 3.5 : 2.5}
          opacity={failed ? 0.5 : 1} strokeDasharray={failed ? '5 5' : undefined} />
      })}
      {/* the ones they MISSED — post-commit only, and this is the teaching */}
      {showTruth && truth.filter(t => !marked.some(m => Math.abs(m - t) < 0.01)).map((t, i) => {
        const l = line(t, r * 1.18)
        return <line key={`m${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={P.creamSoft} strokeWidth={2} strokeDasharray="4 5" opacity={0.7} />
      })}
      {!showTruth && (() => {
        const l = line(bar, r * 1.34)
        return <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={P.cream} strokeWidth={2} strokeDasharray="8 6" opacity={0.8} />
      })()}
    </svg>
  )
}

// ─── the instrument ─────────────────────────────────────────────────────────────────────
function Shop({ task, value, setValue, disabled, reveal, onCommit }: InstrumentProps<AsV, AsTask>) {
  const { input } = useHand()
  const r = task.r
  const v = value ?? { deg: r.type === 'angle' ? r.start : 90, marked: [], bar: 0 }
  const onCam = input === 'hand'
  const cands = React.useMemo(() => (r.type === 'fold' ? candidateAxes(r.shape) : []), [r])
  const latest = useLatest(task, v)
  const act = (fn: (cur: AsV) => AsV) => {
    if (disabled || reveal) return
    const next = fn(latest.read()); latest.write(next); setValue(next)
  }
  const btn = (label: string, on: () => void, primary?: boolean) => (
    <button onClick={on} disabled={disabled || reveal} style={{
      minWidth: 58, height: 58, padding: '0 18px', borderRadius: 14, cursor: disabled ? 'default' : 'pointer',
      background: primary ? P.gold : P.glass, border: `1px solid ${primary ? P.gold : P.glassBorder}`,
      color: primary ? P.inkOnPaper : P.cream, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
      boxShadow: primary ? `0 0 20px ${P.gold}88` : 'none', opacity: disabled ? 0.45 : 1,
    }}>{label}</button>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ padding: '20px 26px', borderRadius: 22, background: P.glass, border: `1px solid ${P.gold}55`, boxShadow: `0 0 30px ${P.gold}26` }}>
        {r.type === 'angle'
          ? <AngleStage deg={v.deg} showDeg={!!reveal} guide={guideShown(r) && !reveal} len={190} />
          : <FoldStage data={r} marked={v.marked} bar={v.bar} showTruth={!!reveal} r={110} />}
      </div>
      {!reveal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {r.type === 'angle' ? (<>
            {/* ⚠️ WITH THE CAMERA ON, THE CONTROL THAT WRITES THE VALUE THE HAND WRITES IS HIDDEN —
                a live hand writes `deg` every frame, so a turn pressed beside it is overwritten
                before the child's finger leaves the button. */}
            {!(onCam && handDrivesAngle(r)) && btn('◀ turn', () => act(c => ({ ...c, deg: clampDeg(c.deg - STEP) })))}
            {/* ⚠️ RULE 2 — identical at every angle. A commit that lights up when the answer is right
                is chapter 4's green Ready button: the child wins by watching the colour. */}
            {!(onCam && handDrivesAngle(r)) && btn('Fix it ✓', () => onCommit(latest.read()), true)}
            {!(onCam && handDrivesAngle(r)) && btn('turn ▶', () => act(c => ({ ...c, deg: clampDeg(c.deg + STEP) })))}
          </>) : (<>
            {!onCam && btn('◀ turn', () => act(c => ({ ...c, bar: cands[(cands.indexOf(c.bar) - 1 + cands.length) % cands.length] ?? cands[0] })))}
            {btn(v.marked.includes(v.bar) ? 'Unmark' : 'Mark ✓', () => act(c => ({ ...c, marked: c.marked.includes(c.bar) ? c.marked.filter(x => x !== c.bar) : [...c.marked, c.bar] })))}
            {btn('Fold it ✓', () => onCommit(latest.read()), true)}
            {!onCam && btn('turn ▶', () => act(c => ({ ...c, bar: cands[(cands.indexOf(c.bar) + 1) % cands.length] ?? cands[0] })))}
          </>)}
        </div>
      )}
      <Cue P={P} text={r.type === 'angle'
        ? (onCam && handDrivesAngle(r) ? 'Tilt your hand, then hold it still' : 'Turn it, then Fix it')
        : (onCam ? 'Lay your hand along a fold, then Mark it' : 'Mark every fold, then Fold it')} />
    </div>
  )
}

const config: GameConfig<AsV, AsTask> = {
  chapterId: 'anglesSymmetry',
  band: '9-11',
  title: 'THE ANGLE SHOP',
  ticketLabel: 'job',
  palette: P,
  motif: '📐',

  makeTask: (d, asked) => toTask(makeRound(d as Tier, Math.floor(Math.random() * 10), (asked ?? []) as QType[])),
  initialValue: t => ({ deg: t.r.type === 'angle' ? t.r.start : 90, marked: [], bar: 0 }),
  grade: (t, v) => grade(t.r, t.r.type === 'angle' ? v.deg : v.marked),
  revealText: t => (t.r.type === 'angle' ? `${t.r.target ?? t.r.want}` : `${SHAPE_LINES[t.r.shape]} lines`),
  sig: t => sigFor(t.r),
  coverage: { of: t => t.r.type, all: ['angle', 'fold'] },

  /**
   * ⚠️ ONE READING, TWO MEANINGS, CHOSEN BY THE ROUND — which is why `value` takes the task. A tilt
   * is a DEGREE when the child is setting an angle and a FOLD AXIS when they are marking symmetry,
   * and no single mapping can be right for both.
   * ⚠️ AND THE HAND DOES NOT DRIVE AN EXACT-DEGREES ROUND (`handDrivesAngle`): those ask for exactly
   * 85° with nothing on screen to aim at, and a tilt held inside ±2.5° of an unmarked target is luck
   * rather than knowledge. Those rounds keep the steppers, which ARE the exact instrument.
   */
  hand: {
    reads: 'tilt',
    when: t => t.r.type === 'fold' || handDrivesAngle(t.r),
    ready: r => r.tilt !== null,
    value: (r, t) => (r.tilt === null ? null
      : t.r.type === 'angle' ? snapDeg(r.tilt, null)
      : nearestAxis(candidateAxes(t.r.shape), r.tilt)),
    enter: (t, v, n) => (t.r.type === 'angle' ? { ...v, deg: n } : { ...v, bar: n }),
    /** ⚠️ AN ANGLE COMMITS ON THE HOLD; A FOLD NEVER DOES — the child has a SET to mark, so the
     *  reading only aims the bar and `Mark ✓` is still the deliberate act. */
    commits: t => t.r.type === 'angle',
    hint: r => (r.tilt === null ? 'Show Milo your hand' : 'Hold it still'),
    denied: 'The beam can follow your hand, or you can use the turns — both work.',
  },

  glide: (t, from, setValue, later) => {
    if (t.r.type !== 'angle') return
    const to = t.r.target ?? (t.r.want === 'acute' ? 60 : t.r.want === 'obtuse' ? 125 : 90)
    for (let i = 1; i <= 10; i++) later(() => setValue({ ...from, deg: Math.round((from.deg + ((to - from.deg) * i) / 10) / STEP) * STEP }), 400 + i * 70)
  },

  Instrument: Shop,

  start: {
    blurb: `A Saturday of jobs: the park in the morning, the fair's paper after lunch. You already know ${ANCHOR} — too steep to push your bike up, too shallow to get any speed.`,
    ticket: { title: 'Set it square', badge: '📐', tone: 'a' },
    startLabel: 'Start the day',
  },

  /**
   * ⚠️ EVERY BEAT THAT NARRATES A TURN MUST CARRY THE VALUE THAT MAKES IT. Written without them the
   * walkthrough said "So I turn it" and then "There. That is the one." over an arm that had not
   * moved a degree — the teaching describing something the screen never did, which is the SupplyRun
   * fault (its demo dealt the remainder INTO a van while Milo said it stayed behind). Caught by
   * driving it, not by reading it.
   */
  tutorial: (() => {
    const r = makeRound(1, 0, [])
    const start = r.type === 'angle' ? r.start : 90
    const target = r.type === 'angle'
      ? (r.target ?? (r.want === 'acute' ? 60 : r.want === 'obtuse' ? 125 : 90))
      : 90
    const half = Math.round((start + target) / 2 / STEP) * STEP
    const at = (deg: number) => ({ deg, marked: [] as number[], bar: 0 })
    return {
      task: toTask(r),
      initial: at(start),
      hand: 'tap' as const,
      steps: [
        { say: `${pieceOf(r).because}. So it has to sit against the square corner.`, value: at(start) },
        { say: `You know this one already — it is ${ANCHOR}.`, value: at(start) },
        { say: 'So I turn it, and I keep the square corner beside it to judge against.', value: at(half) },
        { say: 'There. That is the one.', value: at(target) },
      ],
    }
  })(),
}

export default function AngleShopGame(p: { childName: string; onFinish: (c: number, w: number, m?: boolean) => void; onExit: () => void }) {
  return <Game config={config} {...p} />
}

export { config as ANGLE_SHOP_CONFIG, toTask }
export const MISS = missFor
export const VERDICT = verdictFor
