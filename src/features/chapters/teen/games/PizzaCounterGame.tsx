'use client'
/**
 * THE PIZZA COUNTER (9–11 · `fractionsCompare`) on GameShell.
 *
 * THE VERB IS "MATCH IT" — how many of MY slices make the same amount as one of THEIRS. Two wholes
 * cut differently is the thing 6–8's SliceShop structurally cannot show (it has ONE whole and owns
 * FIT IT), and it is what equivalence needs, so the separation between the two chapters is a
 * property of the SCREEN rather than a different sentence about the same picture.
 *
 * ⚠️ EVERYTHING THAT CAN BE WRONG IS STILL IN `story/pizza.ts`, UNTOUCHED — the ladder, the grader,
 * the miss lines, the no-exact-answer check on `more` pairs, and `openingTake`, which is the rule
 * that MY pizza stays whole until the commit. That last one is the chapter's anti-oracle: two gaps
 * side by side can be compared BY EYE, so a board that took slices live would let a child sweep
 * 1,2,3… and stop when the gaps matched, having judged nothing.
 *
 * ⚠️ NO ANSWER IS EVER 0, so a fist means nothing here and the key row starts at 1 — the mirror of
 * The Coin Tray, where zero is an answer and a fist is how you give it.
 */
import React from 'react'
import { Game, type BaseTask, type GameConfig, type InstrumentProps } from './parts/GameShell'
import { KID_P as P, KeyRow, Cue } from './parts/kidKit'
import { useHand } from '@/infra/ar/HandInput'
import {
  makeRound, graded, missFor, verdictFor, explainBeats, instructionFor, padChoices,
  frac, openingTake, ANCHOR, DEMO, GUIDED,
  type PzRound, type Tier,
} from '@/features/chapters/story/pizza'

const PIZZA_ART = '/assets/objects/pizza_base.png'
const R2 = Math.PI / 180

export interface PzTask extends BaseTask { r: PzRound }

function toTask(r: PzRound): PzTask {
  return {
    r,
    title: r.tag,
    /** ⚠️ An `op` round's SUM is the question and must be on the board; the other two ask for a
     *  count of MY slices, so the board shows the denominator and never the numerator. */
    badge: r.qType === 'op' ? `${frac(r.gone, r.den)} ${r.op} ${frac(r.step, r.den)}` : `? / ${r.den}`,
    tone: r.qType === 'op' ? 'b' : 'a',
    prompt: r.prompt,
    context: r.prompt,
    say: r.spoken,
    work: explainBeats(r).map(b => b.say),
    showEquals: false,
  }
}

// ─── the pizzas ─────────────────────────────────────────────────────────────────────────
function wedgePath(i: number, den: number, r = 46, cx = 50, cy = 50): string {
  const a0 = (i / den) * 360 - 90, a1 = ((i + 1) / den) * 360 - 90
  const x0 = cx + r * Math.cos(a0 * R2), y0 = cy + r * Math.sin(a0 * R2)
  const x1 = cx + r * Math.cos(a1 * R2), y1 = cy + r * Math.sin(a1 * R2)
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`
}

/**
 * A pizza cut into `den`, with the first `taken` slices GONE — the gap is the amount, and comparing
 * two gaps is the whole question.
 *
 * ⚠️ THE EMPTY PART IS A PLATE, NOT A FILL. Painting the taken sector reads as a SHADED region —
 * i.e. the pie chart this clipping exists to escape — and worse it is ambiguous: a child cannot
 * tell whether the coloured part or the food part is "the amount". Nothing is drawn over a gone
 * slice; the dish shows through, which is what a missing slice actually looks like.
 */
function Pizza({ den, taken, size, dim }: { den: number; taken: number; size: number; dim?: boolean }) {
  const uid = React.useId()
  const gone = Math.max(0, Math.min(den, taken))
  return (
    <svg viewBox="-6 -6 112 112" width={size} height={size} style={{ display: 'block', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.45))', opacity: dim ? 0.9 : 1 }}>
      <defs>
        {Array.from({ length: den }).map((_, i) => (
          <clipPath key={i} id={`${uid}-w${i}`}><path d={wedgePath(i, den)} /></clipPath>
        ))}
      </defs>
      <circle cx={50} cy={50} r={49} fill="rgba(214,228,255,.20)" stroke={P.glassBorder} strokeWidth={1.6} />
      <circle cx={50} cy={50} r={42} fill="rgba(214,228,255,.10)" stroke="rgba(150,180,240,.35)" strokeWidth={1} />
      {Array.from({ length: den }).map((_, i) => (
        i < gone ? null : (
          <g key={i}>
            <g clipPath={`url(#${uid}-w${i})`}>
              <image href={PIZZA_ART} x={2} y={2} width={96} height={96} preserveAspectRatio="xMidYMid slice" />
            </g>
            {/* the cut lines are the whole point of the picture, so they are drawn, not implied */}
            <path d={wedgePath(i, den)} fill="none" stroke="rgba(61,37,22,.55)" strokeWidth={1.1} strokeLinejoin="round" />
          </g>
        )
      ))}
      {/* The gap's own edge, as a LINE and never a fill — it says how much went without colouring
          in an amount that is not there. */}
      {gone > 0 && <path d={Array.from({ length: gone }, (_, i) => wedgePath(i, den)).join(' ')} fill="none" stroke={`${P.gold}aa`} strokeWidth={1.4} strokeLinejoin="round" />}
    </svg>
  )
}

function Card({ label, den, taken, size, muted }: { label: string; den: number; taken: number; size: number; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: muted ? 0.92 : 1 }}>
      <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 13, letterSpacing: 1.4, textTransform: 'uppercase', color: muted ? P.creamSoft : P.gold }}>{label}</span>
      <Pizza den={den} taken={taken} size={size} dim={muted} />
    </div>
  )
}

/** ⚠️ MY PIZZA STAYS WHOLE UNTIL THE COMMIT — `openingTake` is that rule, and it lives in the pure
 *  module precisely so the gate can DRIVE it rather than grep for it. */
function Counter({ task, value, disabled, reveal, setValue, onCommit }: InstrumentProps<number, PzTask>) {
  const { input } = useHand()
  const r = task.r
  const two = r.qType !== 'op'
  const taken = reveal && value != null ? value : openingTake(r)
  const size = 150
  const pick = (n: number) => { if (disabled || reveal) return; setValue(n); onCommit(n) }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{
        padding: '20px 26px', borderRadius: 22, background: P.glass,
        border: `1px solid ${P.gold}55`, boxShadow: `0 0 30px ${P.gold}26`,
        display: 'flex', alignItems: 'flex-start', gap: 24,
      }}>
        {two && <Card label="theirs" den={r.refDen} taken={r.refNum} size={size} muted />}
        <Card label={two ? 'mine' : 'the pizza'} den={r.den} taken={taken} size={size} />
      </div>
      {input === 'tap' && !reveal && <KeyRow P={P} choices={padChoices()} onPick={pick} disabled={disabled} />}
      <Cue P={P} text={instructionFor(r, input === 'hand' ? 'hand' : 'tap')} />
    </div>
  )
}

const config: GameConfig<number, PzTask> = {
  chapterId: 'fractionsCompare',
  band: '9-11',
  title: 'THE PIZZA COUNTER',
  ticketLabel: 'order',
  palette: P,
  motif: '🍕',

  makeTask: (d, asked) => toTask(makeRound(d as Tier, (asked ?? []) as string[])),
  initialValue: () => 0,
  grade: (t, v) => graded(t.r, v),
  revealText: t => `${t.r.accepts[0]}`,
  sig: t => `${t.r.qType}|${t.r.den}|${t.r.refDen}|${t.r.refNum}|${t.r.gone}|${t.r.step}|${t.r.op ?? ''}`,
  coverage: { of: t => t.r.qType, all: ['match', 'more', 'op'] },

  /** ⚠️ NO ANSWER IS EVER 0 HERE, so a fist means nothing and `count > 0` is the right guard —
   *  the exact mirror of The Coin Tray. One trap fewer than Factor Lab, which must tell a fist
   *  from a lowered hand. */
  hand: {
    reads: 'count',
    ready: r => r.hands > 0 && r.count > 0,
    hint: r => (r.count === 0 ? 'Show Milo your fingers' : 'Hold them still'),
    denied: 'Milo can count your fingers, or you can tap the number — both work.',
  },

  glide: (t, _from, setValue, later) => { later(() => setValue(t.r.accepts[0]), 500) },

  Instrument: Counter,

  start: {
    blurb: `${ANCHOR} Take slices off your pizza until you have the same amount as the order beside it.`,
    ticket: { title: 'Match the order', badge: '? / 8', tone: 'a' },
    startLabel: 'Open the counter',
  },

  tutorial: {
    task: toTask(DEMO[0]),
    initial: 0,
    hand: 'tap',
    steps: explainBeats(DEMO[0]).map(b => ({ say: b.say, value: b.take })),
  },

  guided: { task: toTask(GUIDED), coach: 'Your turn — I will talk you through it.', hand: 'tap' },
}

export default function PizzaCounterGame(p: { childName: string; onFinish: (c: number, w: number, m?: boolean) => void; onExit: () => void }) {
  return <Game config={config} {...p} />
}

export { config as PIZZA_COUNTER_CONFIG, toTask }
export const MISS = missFor
export const VERDICT = verdictFor
