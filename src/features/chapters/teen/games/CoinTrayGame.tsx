'use client'
/**
 * THE COIN TRAY (9–11 · `decimals`) — the band's FIRST chapter on GameShell.
 *
 * The pilot for the founder's call of 2026-08-14: treat 9–11 the way 12–18 is treated, on the same
 * engine and in the same format, with **answering by hand** as the thing that makes it its own band.
 * So this file is what a 9–11 chapter is now — a palette, a task pool, a walkthrough and a config —
 * and the ~590-line bespoke `story/CoinTray.tsx` it replaces is deleted.
 *
 * THE VERB IS "MAKE THE AMOUNT", AND THE TWO WELLS ARE THE TWO DECIMAL PLACES. The tag reads `0.55`
 * of a dollar; the child fills the dimes well, then the pennies well, left to right — the order the
 * number is written — by holding up how many to a webcam or tapping it.
 *
 * ⚠️ EVERYTHING THAT CAN BE WRONG IS STILL IN `story/cents.ts`, UNTOUCHED. The ladder, the trap
 * amounts, the grader, the miss lines, the anti-oracle headline rule and its 31-test gate all
 * survive the port unchanged — which is the whole reason the port is cheap. This file re-shapes;
 * it re-implements nothing.
 *
 * ⚠️ THE TRAY STAYS AN INSTRUMENT AND IS NOT REPLACED BY THE ANSWER PAD — founder's call, and the
 * reason is the band: 9–11 is where concrete comes before abstract, and the tray IS the two places.
 * The 15–16 "pad-first" rule was written for a band that has already made that jump.
 *
 * ⚠️ ONE VALUE, TWO INPUTS, ONE GRADER. `enterTray` is the ONLY way a number gets into the tray, and
 * both the camera (via `GameConfig.hand.enter`) and the tap pad below call it. So the two paths
 * cannot drift, and `grade` never learns which one moved it.
 */
import React from 'react'
import { Game, type BaseTask, type GameConfig, type InstrumentProps } from './parts/GameShell'
import { KID_P as P, KeyRow, Cue, PIP, useLatest } from './parts/kidKit'
import { useHand } from '@/infra/ar/HandInput'
import {
  makeRound, graded, missFor, verdictFor, explainBeats, headline, dec, spokenDec,
  padChoices, instructionFor, MAX_PER_WELL, DEMO, GUIDED,
  type CtRound, type Tier, type Well,
} from '@/features/chapters/story/cents'

const DIME = '#9FD8FF', PENNY = '#FFA96B'

// ─── the value ──────────────────────────────────────────────────────────────────────────
/**
 * The tray, plus WHICH well is being filled. The slot has to live in the value because the answer
 * arrives in two parts and the shell owns the commit — `commits()` reads it to know the amount is
 * finished rather than merely started.
 */
export interface TrayV { dimes: number; pennies: number; slot: 0 | 1 | 2 }
export const EMPTY: TrayV = { dimes: 0, pennies: 0, slot: 0 }

/** ⚠️ THE ONLY WAY A NUMBER GETS INTO THE TRAY. Camera and taps both come through here. */
export function enterTray(v: TrayV, n: number): TrayV {
  const k = Math.max(0, Math.min(MAX_PER_WELL, Math.round(n)))
  return v.slot === 0 ? { dimes: k, pennies: 0, slot: 1 } : { ...v, pennies: k, slot: 2 }
}
const wellAt = (v: TrayV): Well | null => (v.slot === 0 ? 'dimes' : v.slot === 1 ? 'pennies' : null)

// ─── the task ───────────────────────────────────────────────────────────────────────────
export interface CtTask extends BaseTask { r: CtRound }

function toTask(r: CtRound): CtTask {
  return {
    r,
    title: r.tag,
    /**
     * ⚠️ `headline` AND NOT `dec(target)`. A board that prints the round's amount is exactly right
     * on a `make` round, whose question IS *read this amount*, and fatal on the other two: an `op`
     * round asks "it read 0.55 and went UP by 0.05" and would print **0.6** above it, so the
     * arithmetic never happens; a `place` round asks in WORDS and would print **0.07**, doing the
     * words-to-digits step that is half of what it tests. The rule lives in cents.ts, driven by its
     * own gate on TOKENS rather than substrings — `0.1 + 0.6` contains `0.6` and means nothing of
     * the kind. This is the one line of the port where getting lazy would have cost the chapter.
     */
    badge: headline(r, false),
    tone: r.qType === 'op' ? 'b' : 'a',
    prompt: r.prompt,
    context: r.prompt,
    say: r.spoken,
    /** the 3-wrong re-teach, narrated — the same beats the walkthrough plays */
    work: explainBeats(r).map(b => b.say),
    /** ⚠️ THE TRAY IS THE ANSWER, so the board must not draw "= ?" under the amount. */
    showEquals: false,
  }
}

// ─── the instrument ─────────────────────────────────────────────────────────────────────
function Coin({ well, u }: { well: Well; u: number }) {
  /**
   * ⚠️ A DIME IS A TEN-FRAME OF TEN PIPS AND A PENNY IS ONE PIP THE SAME SIZE. That is the whole
   * comparison, shown rather than asked: six frames beside five frames and five pips IS 0.6 against
   * 0.55, and the child looks at it. A disc marked "10¢" would be a piece ASSERTING its value.
   * ⚠️ And it is a 2×5 FRAME rather than a column of ten, which is a countability fix: drawn as a
   * 1×10 strip the coin is ten pips TALL, and a short band scaled that to a 2.2px pip.
   */
  const n = well === 'dimes' ? 10 : 1
  const c = well === 'dimes' ? DIME : PENNY
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${well === 'dimes' ? 2 : 1}, ${u}px)`,
      gap: Math.max(1, Math.round(u * 0.2)), padding: Math.round(u * 0.32),
      borderRadius: Math.round(u * 0.45), background: `${c}1c`, border: `1px solid ${c}66`,
    }}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} style={{ width: u, height: u, borderRadius: '50%', background: c, boxShadow: `0 0 ${Math.round(u * 0.7)}px ${c}88` }} />
      ))}
    </div>
  )
}

/** One well. It shows a COUNT and never a worth — a live value readout would let a child sweep
 *  counts until the number matched, having placed nothing. */
function WellBox({ well, n, u, active, done }: { well: Well; n: number; u: number; active: boolean; done: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 15, letterSpacing: 1.6, textTransform: 'uppercase', color: active ? P.gold : P.creamSoft }}>
        {well === 'dimes' ? 'tenths · dimes' : 'hundredths · pennies'}
      </span>
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: Math.round(u * 0.34),
        minWidth: MAX_PER_WELL * u * 2.2, minHeight: u * 7,
        padding: `${Math.round(u * 0.5)}px ${Math.round(u * 0.6)}px`, borderRadius: 16,
        background: active ? `${P.gold}14` : 'rgba(120,150,220,0.10)',
        border: `1px ${active ? 'solid' : 'dashed'} ${active ? P.gold : P.glassBorder}`,
      }}>
        {Array.from({ length: n }).map((_, i) => <Coin key={i} well={well} u={u} />)}
      </div>
      <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 30, color: done || active ? P.cream : P.creamSoft }}>
        {done || active ? n : '–'}
      </span>
    </div>
  )
}

/**
 * The tray, and — on the tap path only — the 0–9 row that fills it.
 *
 * ⚠️ THE PAD IS PART OF THE INSTRUMENT RATHER THAN `GameConfig.answerPad`, and that is deliberate:
 * the shell's pad HIDES the instrument, and here the child has to watch the tray fill as they enter.
 * ⚠️ AND IT STARTS AT 0, because zero is a real answer in this chapter — `0.6` is six dimes and an
 * EMPTY pennies well, and "seven hundredths" is an empty dimes well and seven pennies. Those two
 * rounds ARE the chapter.
 */
function Tray({ task, value, setValue, disabled, reveal, onCommit }: InstrumentProps<TrayV, CtTask>) {
  const { input } = useHand()
  const v = value ?? EMPTY
  const slot = wellAt(v)
  const u = PIP
  /**
   * ⚠️ THE VALUE IS MIRRORED IN A REF, AND THIS IS NOT BELT-AND-BRACES. Two taps landing in ONE
   * React batch both read the same RENDERED `value`, so both resolve `slot === 0` and the second
   * overwrites the dimes well instead of filling the pennies — the batched-tap fault this repo has
   * met seven times, and children do tap that fast. `setValue` being functional would not save it
   * either: the STATE advances correctly and the closure the next tap runs is still the old one.
   * Caught here by writing the gate, not by driving it.
   */
  const latest = useLatest(task, v)
  const pick = (n: number) => {
    if (disabled || reveal) return
    const next = enterTray(latest.read(), n)
    latest.write(next)
    setValue(next)
    if (next.slot >= 2) onCommit(next)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 18, padding: '22px 30px',
        borderRadius: 22, background: P.glass, border: `1px solid ${P.gold}55`,
        boxShadow: `0 0 30px ${P.gold}26`,
      }}>
        <WellBox well="dimes" n={v.dimes} u={u} active={slot === 'dimes'} done={v.slot > 0} />
        {/* The point sits BETWEEN the wells, because that is what it does. */}
        <span style={{ alignSelf: 'center', fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 52, color: P.gold, transform: 'translateY(8px)' }}>.</span>
        <WellBox well="pennies" n={v.pennies} u={u} active={slot === 'pennies'} done={v.slot > 1} />
      </div>
      {input === 'tap' && !reveal && (
        <KeyRow P={P} choices={padChoices()} onPick={pick} disabled={disabled} />
      )}
      <Cue P={P} text={slot ? instructionFor(input === 'hand' ? 'hand' : 'tap', slot) : ''} />
    </div>
  )
}

// ─── the config ─────────────────────────────────────────────────────────────────────────
const demoBeats = explainBeats(DEMO[0])

const config: GameConfig<TrayV, CtTask> = {
  chapterId: 'decimals',
  band: '9-11',
  title: 'THE COIN TRAY',
  ticketLabel: 'price tag',
  palette: P,
  motif: '🪙',

  makeTask: (d, asked) => toTask(makeRound(d as Tier, (asked ?? []) as string[])),
  initialValue: () => EMPTY,
  grade: (t, v) => graded(t.r, v),
  revealText: t => dec(t.r.target),

  /** ⚠️ Dedupe on the MATH, so a re-drawn tag is not "a new question". */
  sig: t => `${t.r.qType}|${t.r.target}|${t.r.place ?? ''}|${t.r.from}|${t.r.step}|${t.r.op ?? ''}`,

  /** ⚠️ L1 is `make` only, so a child who climbs fast could otherwise finish having never been
   *  asked to name a place or move a price. See GameConfig.coverage for the round-budget arithmetic. */
  coverage: { of: t => t.r.qType, all: ['make', 'place', 'op'] },

  /** ⚠️ THE BAND'S SPECIALITY, DECLARED RATHER THAN WIRED. The shell owns the camera, both doors,
   *  the dwell and the gate; this says only what a reading MEANS here.
   *  ⚠️ `ready` is "a hand is in frame", NOT `count > 0` — a FIST is a real answer in this chapter. */
  hand: {
    reads: 'count',
    ready: r => r.hands > 0,
    enter: (_t, v, n) => enterTray(v, n),
    commits: (_t, v) => v.slot >= 2,
    hint: r => (r.hands === 0 ? 'Show Milo your hand' : 'Hold it still'),
    denied: 'Milo can count your fingers, or you can tap the numbers — both work.',
  },

  /** The tray fills itself to the answer on a miss — the reveal, in the child's own instrument. */
  glide: (t, _from, setValue, later) => {
    later(() => setValue({ dimes: Math.floor(t.r.target / 10), pennies: 0, slot: 1 }), 420)
    later(() => setValue({ dimes: Math.floor(t.r.target / 10), pennies: t.r.target % 10, slot: 2 }), 900)
  },

  Instrument: Tray,

  start: {
    blurb: 'A dime is a tenth of a dollar; a penny is a hundredth. So the two wells of the tray are the two places after the point — fill the dimes, then the pennies.',
    ticket: { title: 'Make the amount', badge: '0.55', tone: 'a' },
    startLabel: 'Open the tray',
  },

  tutorial: {
    task: toTask(DEMO[0]),
    initial: EMPTY,
    hand: 'tap',
    steps: demoBeats.map((b, i) => ({
      say: b.say,
      value: { dimes: b.tray.dimes, pennies: b.tray.pennies, slot: (i === 0 ? 0 : i === 1 ? 1 : 2) as 0 | 1 | 2 },
      board: i === 0 ? dec(DEMO[0].target) : undefined,
    })),
  },

  guided: { task: toTask(GUIDED), coach: 'Your turn — I will talk you through it.', hand: 'tap' },
}

export default function CoinTrayGame(p: { childName: string; onFinish: (c: number, w: number, m?: boolean) => void; onExit: () => void }) {
  return <Game config={config} {...p} />
}

/** exported so the gate drives the same objects the chapter renders from */
export { config as COIN_TRAY_CONFIG, toTask }
export const MISS = missFor
export const VERDICT = verdictFor
export const SPOKEN = spokenDec
