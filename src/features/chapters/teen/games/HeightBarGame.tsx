'use client'
/**
 * THE HEIGHT BAR (9–11 · `measurementUnits`) on GameShell.
 *
 * THE VERB IS "DOES IT FIT?" — conversion exists because two measurements in DIFFERENT UNITS have to
 * be compared, and the comparison has a consequence: the gate opens or it does not.
 *
 * ⚠️ THE CONVERTED NUMBER IS WHAT IS SCORED, AND THE GATE OPENING IS DELIBERATELY NOT THE QUESTION.
 * Yes/no is the 50% coin flip this band was rebuilt to remove; the child builds the figure and then
 * watches what it means. Same call `pizza.ts` and `cents.ts` already made.
 *
 * ⚠️ EVERYTHING THAT CAN BE WRONG IS STILL IN `story/inches.ts`, UNTOUCHED — the US-customary
 * factors, `OFFSET_LIMITS` (no posted limit may be a multiple of twelve, or the child's own first
 * step lands on the number printed on the sign), the grader, the nudges and the headline rule that
 * no type may show inches before the commit.
 *
 * ⚠️ THE ANSWER ARRIVES IN TWO PLACES, tens then ones — the same shape as The Coin Tray's two wells,
 * and it uses the same `enter`/`commits` contract on the shell's `hand`.
 */
import React from 'react'
import { Game, type BaseTask, type GameConfig, type InstrumentProps } from './parts/GameShell'
import { KID_P as P, KeyRow, Cue, useLatest } from './parts/kidKit'
import { useHand } from '@/infra/ar/HandInput'
import {
  makeRound, graded, missFor, verdictFor, nudgeFor, explainBeats, instructionFor, headline, signOf,
  padChoices, entryValue, entryFull, EMPTY_ENTRY, DEMO, GUIDED,
  type HbRound, type Tier, type Entry, type Place,
} from '@/features/chapters/story/inches'

/** the entry, plus WHICH place is being filled — the shell's `commits` reads it */
export interface HbV { tens: number | null; ones: number | null; slot: 0 | 1 | 2 }
export const EMPTY: HbV = { ...EMPTY_ENTRY, slot: 0 }
export const toEntry = (v: HbV): Entry => ({ tens: v.tens, ones: v.ones })

/** ⚠️ THE ONLY WAY A DIGIT ENTERS. Camera and taps both come through here. */
export function enterDigit(v: HbV, n: number): HbV {
  const k = Math.max(0, Math.min(9, Math.round(n)))
  return v.slot === 0 ? { tens: k, ones: null, slot: 1 } : { ...v, ones: k, slot: 2 }
}
const placeAt = (v: HbV): Place | null => (v.slot === 0 ? 'tens' : v.slot === 1 ? 'ones' : null)

export interface HbTask extends BaseTask { r: HbRound }

function toTask(r: HbRound): HbTask {
  return {
    r,
    title: r.tag,
    /** ⚠️ `headline` — and it never shows INCHES before the commit, because inches is what is asked. */
    badge: headline(r, false),
    tone: r.qType === 'swap' ? 'b' : 'a',
    prompt: r.prompt,
    context: r.prompt,
    say: r.spoken,
    work: explainBeats(r).map(b => b.say),
    showEquals: false,
  }
}

// ─── the bar ────────────────────────────────────────────────────────────────────────────
/** The posted limit and, after the commit, the child's own mark — on ONE scale, never numbered. */
function Bar({ limit, mark, u }: { limit: number; mark: number | null; u: number }) {
  const h = u * 12
  const TOP_IN = 78
  const y = (inches: number) => h - (Math.max(0, Math.min(TOP_IN, inches)) / TOP_IN) * h
  return (
    <div style={{ position: 'relative', width: u * 3, height: h, flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: Math.max(6, u * 0.5), transform: 'translateX(-50%)', borderRadius: 6, background: `linear-gradient(180deg, rgba(120,150,220,.16), ${P.glass})`, border: `1px solid ${P.glassBorder}` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: y(limit), transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ height: 3, flex: 1, background: P.gold, boxShadow: `0 0 10px ${P.gold}` }} />
      </div>
      {mark !== null && (
        <div style={{ position: 'absolute', left: -u * 0.6, right: -u * 0.6, top: y(mark), transform: 'translateY(-50%)' }}>
          <div style={{ height: 3, background: P.cream, opacity: 0.9 }} />
        </div>
      )}
    </div>
  )
}

/** One place of the answer being built. Shows a digit or a waiting dash — never a worth. */
function Window({ place, digit, active, unit }: { place: Place; digit: number | null; active: boolean; unit: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 14, letterSpacing: 1.4, textTransform: 'uppercase', color: active ? P.gold : P.creamSoft }}>{place}</span>
      <div style={{
        minWidth: 62, padding: '8px 16px', borderRadius: 12, textAlign: 'center',
        background: active ? `${P.gold}14` : 'rgba(120,150,220,0.10)',
        border: `1px ${active ? 'solid' : 'dashed'} ${active ? P.gold : P.glassBorder}`,
        fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 42, lineHeight: 1.1,
        color: digit === null ? P.creamSoft : P.cream,
      }}>{digit === null ? '–' : digit}</div>
      <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 13, color: P.creamSoft, minHeight: 14 }}>{place === 'ones' ? unit : ''}</span>
    </div>
  )
}

function BarBoard({ task, value, disabled, reveal, setValue, onCommit }: InstrumentProps<HbV, HbTask>) {
  const { input } = useHand()
  const r = task.r
  const v = value ?? EMPTY
  const slot = placeAt(v)
  const sign = signOf(r)
  /**
   * ⚠️ MIRRORED IN A REF. Two taps in ONE React batch both read the same rendered value, so both
   * resolve `slot === 0` and the second overwrites the tens instead of filling the ones — the
   * batched-tap fault, which is why The Coin Tray carries the same three lines.
   */
  const latest = useLatest(task, v)
  const pick = (n: number) => {
    if (disabled || reveal) return
    const next = enterDigit(latest.read(), n)
    latest.write(next)
    setValue(next)
    if (next.slot >= 2) onCommit(next)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{
        padding: '20px 28px', borderRadius: 22, background: P.glass,
        border: `1px solid ${P.gold}55`, boxShadow: `0 0 30px ${P.gold}26`,
        display: 'flex', alignItems: 'center', gap: 26,
      }}>
        {sign && <Bar limit={r.limit} mark={reveal && entryFull(toEntry(v)) ? entryValue(toEntry(v)) : null} u={15} />}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {sign && (
            <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 700, fontSize: 17, color: P.gold, letterSpacing: 1 }}>
              SIGN · {sign}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Window place="tens" digit={v.tens} active={slot === 'tens'} unit={r.unit} />
            <Window place="ones" digit={v.ones} active={slot === 'ones'} unit={r.unit} />
          </div>
        </div>
      </div>
      {input === 'tap' && !reveal && <KeyRow P={P} choices={padChoices()} onPick={pick} disabled={disabled} />}
      <Cue P={P} text={slot ? instructionFor(input === 'hand' ? 'hand' : 'tap', slot) : ''} />
    </div>
  )
}

const config: GameConfig<HbV, HbTask> = {
  chapterId: 'measurementUnits',
  band: '9-11',
  title: 'THE HEIGHT BAR',
  ticketLabel: 'ride check',
  palette: P,
  motif: '📏',

  makeTask: (d, asked) => toTask(makeRound(d as Tier, (asked ?? []) as string[])),
  initialValue: () => EMPTY,
  grade: (t, v) => graded(t.r, toEntry(v)),
  revealText: t => `${t.r.answer} ${t.r.unit}`,
  sig: t => `${t.r.qType}|${t.r.ft}|${t.r.inch}|${t.r.limit}|${t.r.from}|${t.r.fromUnit}`,
  coverage: { of: t => t.r.qType, all: ['fit', 'need', 'swap'] },

  /**
   * ⚠️ THE COUNT, NOT THE SPAN. The plan asked for "hold your hands apart to SHOW a length", and it
   * was measured before building: two palms carry ~±0.028 of frame width between them, which on the
   * answer scale is **±2.3 INCHES** — so 51 and 50 sit inside the noise and a child who KNEW the
   * answer could not enter it. The span ships where it is honest (the explore beat, nothing scored)
   * and the scored rounds keep the two-place count.
   */
  hand: {
    reads: 'count',
    ready: r => r.hands > 0,
    enter: (_t, v, n) => enterDigit(v, n),
    commits: (_t, v) => v.slot >= 2,
    hint: r => (r.hands === 0 ? 'Show Milo your hand' : 'Hold it still'),
    denied: 'Milo can count your fingers, or you can tap the digits — both work.',
  },

  glide: (t, _from, setValue, later) => {
    const tens = Math.floor(t.r.answer / 10), ones = t.r.answer % 10
    later(() => setValue({ tens, ones: null, slot: 1 }), 420)
    later(() => setValue({ tens, ones, slot: 2 }), 900)
  },

  Instrument: BarBoard,

  start: {
    blurb: 'You already know the height bar at a ride — you have stood against one. The sign is in inches and your door frame at home is in feet and inches, so they have to be turned into the same unit before anyone can tell.',
    ticket: { title: 'Tall enough?', badge: '4 ft 3', tone: 'a' },
    startLabel: 'Go to the ride',
  },

  tutorial: {
    task: toTask(DEMO[0]),
    initial: EMPTY,
    hand: 'tap',
    steps: explainBeats(DEMO[0]).map((b, i) => ({
      say: b.say,
      value: { tens: b.entry.tens, ones: b.entry.ones, slot: (b.entry.ones !== null ? 2 : b.entry.tens !== null ? 1 : 0) as 0 | 1 | 2 },
      board: i === 0 ? headline(DEMO[0], false) : undefined,
    })),
  },

  guided: { task: toTask(GUIDED), coach: 'Your turn — I will talk you through it.', hand: 'tap' },
}

export default function HeightBarGame(p: { childName: string; onFinish: (c: number, w: number, m?: boolean) => void; onExit: () => void }) {
  return <Game config={config} {...p} />
}

export { config as HEIGHT_BAR_CONFIG, toTask }
export const MISS = missFor
export const VERDICT = verdictFor
export const NUDGE = nudgeFor
