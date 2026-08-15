'use client'
/**
 * THE FACTOR LAB (9–11 · `factorsMultiples`) on GameShell.
 *
 * THE VERB IS "SPLIT IT INTO EQUAL ROWS". `n` units sit on the bench; the child says how many rows,
 * and anything that will not fit stays visibly apart — **the gap IS the argument** that this row
 * count is not a factor, so it is never quietly dropped. One gesture, four readings of it:
 * even/odd (pairs), multiples (crates), factors (rows) and prime (nothing fits but 1 and itself).
 *
 * ⚠️ EVERYTHING THAT CAN BE WRONG IS STILL IN `story/factors.ts`, UNTOUCHED — the ladder, the deal,
 * the grader, the nudges, the verdict strings and the anchor, with their gate still driving them.
 * This file re-shapes; it re-implements nothing.
 *
 * ⚠️ A FIST IS A REAL ANSWER HERE — it is how a child says "nothing fits", which is the whole of the
 * prime reading. So `ready` is `hands > 0` and the key row starts at 0.
 */
import React from 'react'
import { Game, type BaseTask, type GameConfig, type InstrumentProps } from './parts/GameShell'
import { KID_P as P, KeyRow, Cue } from './parts/kidKit'
import { useHand } from '@/infra/ar/HandInput'
import {
  makeRound, graded, deal, missFor, verdictFor, nudgeFor, explainBeats, instructionFor,
  padChoices, ANCHOR, DEMO, GUIDED,
  type FlRound, type Tier,
} from '@/features/chapters/story/factors'

export interface FlTask extends BaseTask { r: FlRound }

function toTask(r: FlRound): FlTask {
  return {
    r,
    title: r.tag,
    /** the units, which is the question — how they split is the answer and is never printed */
    badge: String(r.n),
    tone: r.qType === 'prime' || r.qType === 'factor' ? 'a' : 'b',
    prompt: r.prompt,
    context: r.prompt,
    say: r.spoken,
    work: explainBeats(r).map(b => b.say),
    /** ⚠️ THE BENCH IS THE ANSWER, so the board must not draw "= ?" under the count. */
    showEquals: false,
  }
}

// ─── the bench ──────────────────────────────────────────────────────────────────────────
function Unit({ size, stranded }: { size: number; stranded?: boolean }) {
  return <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.28), flexShrink: 0,
    background: stranded ? '#FF5D7A' : P.gold,
    border: `2px solid ${stranded ? '#E03A5C' : P.goldDeep}`,
    boxShadow: `0 0 10px ${stranded ? '#FF5D7A' : P.gold}66`,
    transition: 'all .3s cubic-bezier(.34,1.56,.64,1)',
  }} />
}

/**
 * `n` units dealt into `rows` equal rows, with the leftovers apart and marked.
 *
 * ⚠️ UNDEALT IT IS A LOOSE PILE AND DELIBERATELY NOT A GRID — a grid would be a ruler the child
 * could count rows off before committing anything, which is the printed-answer rule arriving
 * through the layout.
 */
function Bench({ task, value, disabled, reveal, setValue, onCommit }: InstrumentProps<number, FlTask>) {
  const { input } = useHand()
  const r = task.r
  const rows = value ?? 0
  const { perRow, stranded } = deal(r.n, rows)
  const size = r.n > 40 ? 20 : r.n > 24 ? 25 : r.n > 14 ? 31 : 38
  const gap = Math.round(size * 0.26)
  // ⚠️ NO REF MIRROR HERE, and the reason is worth stating: this chapter's answer is ONE tap that
  // commits immediately, so there is no second tap inside the same batch to be stale for. The
  // two-place chapters (the tray, the height bar) need `useLatest`; this one does not.
  const pick = (n: number) => { if (disabled || reveal) return; setValue(n); onCommit(n) }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{
        padding: '20px 26px', borderRadius: 22, background: P.glass,
        border: `1px solid ${P.gold}55`, boxShadow: `0 0 30px ${P.gold}26`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      }}>
        <div style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 60, lineHeight: 1, color: P.cream, textShadow: `0 0 24px ${P.gold}66` }}>{r.n}</div>
        {rows > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap, alignItems: 'center' }}>
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap }}>
                {Array.from({ length: perRow }).map((_, c) => <Unit key={c} size={size} />)}
              </div>
            ))}
            {stranded > 0 && (
              <div style={{ display: 'flex', gap, marginTop: gap, paddingTop: gap, borderTop: `2px dashed #FF5D7A88` }}>
                {Array.from({ length: stranded }).map((_, i) => <Unit key={i} size={size} stranded />)}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap, justifyContent: 'center', maxWidth: 13 * (size + gap) }}>
            {Array.from({ length: r.n }).map((_, i) => <Unit key={i} size={size} />)}
          </div>
        )}
      </div>
      {input === 'tap' && !reveal && <KeyRow P={P} choices={padChoices()} onPick={pick} disabled={disabled} />}
      <Cue P={P} text={instructionFor(r, input === 'hand' ? 'hand' : 'tap')} />
    </div>
  )
}

const config: GameConfig<number, FlTask> = {
  chapterId: 'factorsMultiples',
  band: '9-11',
  title: 'THE FACTOR LAB',
  ticketLabel: 'bench order',
  palette: P,
  motif: '🧩',

  makeTask: (d, asked) => toTask(makeRound(d as Tier, (asked ?? []) as string[])),
  initialValue: () => 0,
  grade: (t, v) => graded(t.r, v),
  revealText: t => `${t.r.accepts[0]}`,
  sig: t => `${t.r.qType}|${t.r.n}|${t.r.base}`,

  /** ⚠️ `multiple`'s CRATE and `factor`'s ROW are the same 35 parts asked two ways, and a run must
   *  meet BOTH — see the round-budget arithmetic on GameConfig.coverage. */
  coverage: { of: t => t.r.qType, all: ['evenOdd', 'multiple', 'factor', 'prime'] },

  /** ⚠️ A FIST IS "NOTHING FITS", which IS the prime reading — so `hands > 0`, never `count > 0`. */
  hand: {
    reads: 'count',
    ready: r => r.hands > 0,
    hint: r => (r.hands === 0 ? 'Show Milo your hands' : 'Hold them still'),
    denied: 'Milo can count your fingers, or you can tap the number — both work.',
  },

  /** The bench deals itself to a correct row count on a miss — the reveal, in the instrument. */
  glide: (t, _from, setValue, later) => { later(() => setValue(t.r.accepts[0]), 500) },

  Instrument: Bench,

  start: {
    blurb: `Some numbers split into equal rows and some do not. ${ANCHOR} — you say how many rows, and anything left over stays where everyone can see it.`,
    ticket: { title: 'Split it into equal rows', badge: '12', tone: 'a' },
    startLabel: 'Open the bench',
  },

  tutorial: {
    task: toTask(DEMO[1]),
    initial: 0,
    hand: 'tap',
    steps: explainBeats(DEMO[1]).map(b => ({ say: b.say, value: b.rows })),
  },

  guided: { task: toTask(GUIDED), coach: 'Your turn — I will talk you through it.', hand: 'tap' },
}

export default function FactorLabGame(p: { childName: string; onFinish: (c: number, w: number, m?: boolean) => void; onExit: () => void }) {
  return <Game config={config} {...p} />
}

export { config as FACTOR_LAB_CONFIG, toTask }
export const NUDGE = nudgeFor
export const MISS = missFor
export const VERDICT = verdictFor
