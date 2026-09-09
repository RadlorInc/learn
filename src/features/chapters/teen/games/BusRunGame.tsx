'use client'
/**
 * THE MINIBUS RUN (9–11 · `division`) — the chapter, as a data file on GameShell.
 *
 * ⚠️⚠️ NOTHING BOARDS UNTIL THE COMMIT, AND THAT WAS A REAL BUG CAUGHT BY DRIVING IT. The first
 * build loaded the buses live from whatever number was showing, which sounds like the right
 * teaching — a wrong action allowed and visible — and is an ORACLE: the pavement read "still
 * waiting" until the number happened to be right and then flipped to "pavement clear", so a child
 * could tap 1, 2, 3… and watch the label, having divided nothing. Every piece was individually
 * correct and no gate could see it. chapter-craft §1: *"nothing may signal that the answer is right
 * BEFORE the child commits it."*
 *
 * So the yard shows the SETTING while they choose — the class still on the pavement, their number
 * marked out as reserved seats or as buses called for — and the loading happens on the commit,
 * where it is the CHECK rather than the answer. AFTER that it is still drawn from THEIR number
 * rather than the round's, so a wrong answer leaves a visibly wrong yard.
 *
 * ⚠️ THE REMAINDER IS CHILDREN ON A PAVEMENT. That is why this world was chosen over a share-out of
 * food: what will not divide has somewhere physical to be, and "we need one more bus" is a real
 * consequence rather than a rule about the letter r.
 *
 * ⚠️ THE BAND'S SPECIALITY LIVES HERE. Every answer is a count of at most ten, on purpose, so the
 * camera and the taps can express exactly the same set of questions — the one-instrument-two-inputs
 * rule. The Packing Shed next door is tap-only for the mirror reason: its answers reach the
 * hundreds and no hand can show them.
 */
import React from 'react'
import { Game, type BaseTask, type GameConfig, type InstrumentProps } from './parts/GameShell'
import { KID_P as P, KeyRow, Cue, useLatest } from './parts/kidKit'
import { useHand } from '@/infra/ar/HandInput'
import {
  makeRound, graded, missFor, verdictFor, explainBeats, headline, loadFor, enterLoad,
  padChoices, instructionFor, EMPTY_LOAD, DEMO, GUIDED,
  type BrRound, type Tier, type Load,
} from '@/features/chapters/story/busRun'

const KID = '#7BC8FF', BUS = '#F2C14E'

export interface BrTask extends BaseTask { r: BrRound }

function toTask(r: BrRound): BrTask {
  return {
    r,
    title: r.tag,
    /** ⚠️ `headline` and never the answer — the bus count is a GIVEN when the question is how many
     *  ride in each and the ANSWER when the question is how many buses. Gated in busRun.ts. */
    badge: headline(r, false),
    tone: r.qType === 'remainder' ? 'b' : 'a',
    prompt: r.prompt,
    context: r.prompt,
    say: r.spoken,
    work: explainBeats(r).map(b => b.say),
    /** ⚠️ The pavement is the answer, so the board must not draw "= ?" under the trip. */
    showEquals: false,
  }
}

// ─── the instrument ─────────────────────────────────────────────────────────────────────
const Kid = ({ u }: { u: number }) => (
  <span style={{ width: u, height: u * 1.25, borderRadius: `${u}px ${u}px ${u * 0.3}px ${u * 0.3}px`, background: KID, display: 'inline-block' }} />
)

/**
 * One minibus.
 *
 * ⚠️⚠️ `capacity` IS NULL ON A SHARING ROUND, AND THAT IS A PRINTED-ANSWER FIX. The bus used to be
 * drawn with `r.seats` seat outlines on every round — and on a `sharing` round `r.seats` IS THE
 * ANSWER, so a child could count the empty seats in one bus and read it straight off the picture
 * without sharing anything. Caught on a screenshot, which is where this repo keeps catching them.
 * Where the seat count is a GIVEN (grouping, remainder) the seats are drawn, because then they are
 * the question's material; where it is the answer the bus is an open box that holds whatever the
 * child puts in it.
 *
 * ⚠️ `ghost` draws their SETTING — the number they are proposing — as reserved seats rather than as
 * children who have boarded. Nobody moves until the commit.
 */
function Bus({ riders, capacity, u, ghost }: { riders: number; capacity: number | null; u: number; ghost?: boolean }) {
  const slots = capacity ?? riders
  const Seat = (k: number) => (
    <span key={k} style={{ width: u, height: u * 1.25, borderRadius: u * 0.25, border: `1px dashed ${BUS}66` }} />
  )
  const Marked = (k: number) => (
    <span key={k} style={{ width: u, height: u * 1.25, borderRadius: u * 0.25, border: `2px solid ${KID}bb`, background: `${KID}22` }} />
  )
  return (
    <div style={{
      minWidth: u * (Math.min(capacity ?? 4, 6) * 1.1 + 2), minHeight: u * 2,
      padding: u * 0.35, borderRadius: u * 0.5,
      background: `${BUS}1a`, border: `2px solid ${BUS}99`,
      display: 'flex', alignItems: 'center', gap: u * 0.25, flexWrap: 'wrap', justifyContent: 'center',
      transition: 'background .3s ease',
    }}>
      {Array.from({ length: Math.max(slots, 0) }).map((_, i) =>
        i < riders ? (ghost ? Marked(i) : <Kid key={i} u={u} />) : Seat(i))}
    </div>
  )
}

function Pavement({ task, value, setValue, disabled, reveal, onCommit }: InstrumentProps<Load, BrTask>) {
  const { input } = useHand()
  const r = task.r
  const v = value ?? EMPTY_LOAD
  const u = 13
  /**
   * ⚠️ `committed` IS THE WHOLE ANTI-ORACLE RULE, AND IT IS `disabled || reveal` FOR A REASON.
   * During a live scored round `disabled` is false, so nothing boards while the child is choosing —
   * without that, the pavement flipped to "clear" the instant the number was right and the chapter
   * became tap-until-the-label-changes. During the WALKTHROUGH `disabled` is true, which is exactly
   * when the loading should be seen: that is Milo doing it.
   */
  const committed = disabled || reveal
  const { perBus, waiting, marked } = loadFor(r, v.n, committed)

  const latest = useLatest(task, v)
  const pick = (n: number) => {
    if (disabled || reveal) return
    const next = enterLoad(latest.read(), n)
    latest.write(next); setValue(next)
  }
  /**
   * ⚠️ THE TAP PATH GETS A DELIBERATE SECOND STEP AND THE CAMERA PATH DOES NOT, and that is not an
   * inconsistency. Holding a pose IS the deliberate act on the camera path — the shell's dwell ring
   * is the commit — whereas a single tap would settle the round before the child had looked at what
   * their number did to the pavement, which is the one thing this instrument exists to show. Same
   * order as The Empty Plot: adjust freely, then peg.
   */
  const ready = v.n !== null
  const send = () => { const cur = latest.read(); if (!disabled && !reveal && cur.n !== null) onCommit(cur) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        padding: '16px 24px', borderRadius: 22, background: P.glass,
        border: `1px solid ${P.gold}55`, boxShadow: `0 0 30px ${P.gold}26`,
      }}>
        {/* the buses */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: u * 0.6, maxWidth: u * 34 }}>
          {(committed || r.qType === 'grouping'
            ? perBus
            : Array.from({ length: r.buses }, () => marked)
          ).map((n, i) => (
            <Bus key={i} riders={n} u={u} ghost={!committed}
              // the seat count is a GIVEN on grouping/remainder and the ANSWER on sharing
              capacity={r.qType === 'sharing' ? null : r.seats} />
          ))}
          {/* ⚠️ On a `grouping` round the bus COUNT is the answer, so the yard shows only the buses
              the child has actually called for — plus one empty bay, which says "you may need more"
              without saying how many. */}
          {r.qType === 'grouping' && !disabled && !reveal && (
            <div style={{
              minWidth: u * 4, minHeight: u * 2, borderRadius: u * 0.5, border: `2px dashed ${P.glassBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: u * 1.2, color: P.creamSoft,
            }}>?</div>
          )}
        </div>

        {/* the pavement */}
        {/* ⚠️ THE LABEL IS A NOUN, NOT A VERDICT, UNTIL THE COMMIT. "still waiting" vs "pavement
            clear" while the child is still choosing is the oracle in one word. */}
        <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: committed && waiting > 0 ? P.gold : P.creamSoft }}>
          {!committed ? 'on the pavement' : waiting > 0 ? 'still waiting' : 'pavement clear'}
        </span>
        <div style={{
          minHeight: u * 1.7, minWidth: u * 14, padding: `${u * 0.3}px ${u * 0.5}px`, borderRadius: 14,
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: u * 0.3,
          background: 'rgba(0,0,0,0.22)', border: `1px solid ${P.glassBorder}`,
        }}>
          {Array.from({ length: Math.min(waiting, 36) }).map((_, i) => <Kid key={i} u={u} />)}
        </div>
      </div>

      {input === 'tap' && !reveal && !disabled && (
        <>
          <KeyRow P={P} choices={padChoices()} onPick={pick} disabled={disabled} />
          <button onClick={send} disabled={!ready} style={{
            minHeight: 46, padding: '0 24px', borderRadius: 14, cursor: ready ? 'pointer' : 'default',
            background: ready ? P.coral : P.glass, border: `1px solid ${ready ? P.coralDeep : P.glassBorder}`,
            color: ready ? '#fff' : P.creamSoft, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17,
            opacity: ready ? 1 : 0.5,
          }}>Set off ▶</button>
        </>
      )}
      <Cue P={P} text={disabled || reveal ? '' : instructionFor(input === 'hand' ? 'hand' : 'tap', r.qType)} />
    </div>
  )
}

// ─── the config ─────────────────────────────────────────────────────────────────────────
const config: GameConfig<Load, BrTask> = {
  chapterId: 'division',
  band: '9-11',
  title: 'THE MINIBUS RUN',
  ticketLabel: 'trip sheet',
  palette: P,
  motif: '🚌',

  makeTask: (d, asked) => toTask(makeRound(d as Tier, (asked ?? []) as string[])),
  initialValue: () => EMPTY_LOAD,
  grade: (t, v) => graded(t.r, v),
  revealText: t => String(t.r.answer),

  sig: t => `${t.r.qType}|${t.r.buses}|${t.r.seats}|${t.r.left}`,

  /** ⚠️ L1 is `sharing` only, so a child who climbs fast could otherwise finish having never met
   *  grouping or a remainder — and the remainder is what this chapter is for. */
  coverage: { of: t => t.r.qType, all: ['sharing', 'grouping', 'remainder'] },

  /** ⚠️ THE BAND'S SPECIALITY, DECLARED RATHER THAN WIRED. `ready` is "a hand is in frame", NOT
   *  `count > 0` — a FIST is a real answer here: a run that comes out exactly leaves nobody
   *  waiting, and that round is one the chapter needs. */
  hand: {
    reads: 'count',
    ready: r => r.hands > 0,
    enter: (_t, v, n) => enterLoad(v, n),
    commits: (_t, v) => v.n !== null,
    hint: r => (r.hands === 0 ? 'Show Milo your hand' : 'Hold it still'),
    denied: 'Milo can count your fingers, or you can tap the numbers — both work.',
  },

  /** The buses load themselves to the real answer on a miss — the reveal, in the child's own scene. */
  glide: (t, _from, setValue, later) => {
    later(() => setValue({ n: t.r.answer }), 480)
  },

  Instrument: Pavement,

  start: {
    blurb: 'The class is going on a trip. Every minibus has the same number of seats — load them up, and see who is still standing on the pavement.',
    ticket: { title: 'Load the buses', badge: '24 children · 4 buses', tone: 'a' },
    startLabel: 'Head to the yard',
  },

  tutorial: {
    task: toTask(DEMO[0]),
    initial: EMPTY_LOAD,
    hand: 'tap',
    steps: explainBeats(DEMO[0]).map(b => ({ say: b.say, value: { n: b.load } })),
  },

  guided: { task: toTask(GUIDED), coach: 'Your turn — I will talk you through it.', hand: 'tap' },
}

export default function BusRunGame(p: { childName: string; onFinish: (c: number, w: number, m?: boolean) => void; onExit: () => void }) {
  return <Game config={config} {...p} />
}

/** exported so the gate drives the same objects the chapter renders from */
export { config as BUS_RUN_CONFIG, toTask }
export const MISS = missFor
export const VERDICT = verdictFor
