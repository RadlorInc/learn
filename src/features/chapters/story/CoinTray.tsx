'use client'
/**
 * Chapter (9–11) — DECIMALS (skill `decimals`), answered with the CAMERA or by TAP.
 *
 * THE VERB IS "MAKE THE AMOUNT", AND THE TWO WELLS OF THE TRAY ARE THE TWO DECIMAL PLACES. The tag
 * reads `0.55` of a dollar; the child fills the dimes well, then the pennies well, left to right —
 * the order the number is written — holding up how many to a webcam or tapping it. See story/cents.ts
 * for the maths, the ladder and the grader, which live outside React because a webcam cannot be
 * driven by a gate, and for why the anchor is money and what that costs.
 *
 * ⚠️ ONE INSTRUMENT, TWO INPUTS, ONE GRADER. The camera does not answer the question — it sets the
 * same count a tap sets, and both land in `enter(n)`, which is the only path into the tray. So the
 * two paths cannot drift, and `padChoices()` is derived from `MAX_PER_WELL` so the pad offers exactly
 * what a well can hold.
 *
 * ⚠️ A DIME IS DRAWN AS A TEN-FRAME OF TEN PIPS, AND A PENNY AS ONE PIP AT THE SAME SIZE. That is the
 * whole comparison, shown rather than asked: six frames beside five frames and five pips is 0.6
 * against 0.55, and the child looks at it. A coin with "10¢" printed on it would be a piece ASSERTING
 * its value — the 0.55-of-a-rod fault BlockYard paid for — and it would leave the misconception
 * invisible.
 *
 * ⚠️ NOTHING SAYS WHAT THE TRAY IS WORTH UNTIL THE CHILD COMMITS. The wells show COUNTS, which is
 * only what is countably in front of them; a live `$0.55` readout would let a child sweep counts and
 * stop when it matched, having placed nothing. The explore beat reflows live, where nothing is asked.
 *
 * ⚠️ ZERO IS A REAL ANSWER, so a fist has to be told from a lowered hand — FactorLab's guard
 * (`hands > 0`, count may be 0), NOT The Pizza Counter's (`count > 0`). `0.6` is six dimes and a
 * fist, and "seven hundredths" is a fist and seven pennies; those two rounds ARE the chapter.
 *
 * ⚠️ THE ROUND TAKES TWO ENTRIES AND THE DWELL IS KEYED ON THE READING ALONE. Putting the well in the
 * key re-arms the timer the instant the slot advances, so a hand still showing 5 enters 5 twice and
 * `0.55` answers itself — measured on FitOut, which shipped `12` as `11` for exactly this. Keyed on
 * the reading, a repeat needs the hand to leave and come back, which the guard already allows and
 * nothing on screen said: `handHint` says it at the moment it applies.
 *
 * ⚠️ THE TAP PATH IS NOT A DEGRADED MODE AND IT COMMITS DIFFERENTLY ON PURPOSE. A tap is CONSUMED; a
 * hand is still up when the next well opens. `useDwell` is still called unconditionally, merely not
 * live — branching above a hook changes the hook count and tears the chapter into the error boundary.
 *
 * ⚠️ VERIFICATION. Everything above the pure module is EYEBALL-ONLY — no gate can feed a webcam. The
 * dev-only `window.__miloFingers(n, hands)` (stripped from production) exists so the whole chapter
 * can still be driven end to end headlessly.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import { PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, PtMilo, IntroCard } from './preteen/kit'
import { useViewport } from '@/shared/hooks/useViewport'
import FitBox from './FitBox'
import {
  useHandInput, useHand, HandProvider, useDwell, CamView, CamGate, DwellRing,
  type HandSkin, type InputKind as HandInputKind,
} from '@/infra/ar/HandInput'
import {
  makeRound, missFor, nudgeFor, explainBeats, padChoices, instructionFor, sayFor, verdictFor,
  boardBand, dec, headline, dimesOf, penniesOf, ACTION_ROW, MAX_PER_WELL, MILO_LANE, DEMO, GUIDED,
  type CtRound, type Tier, type Tray, type Well,
} from './cents'

const ACCENT = ACCENTS.cyan

/** This chapter's colours for the shared camera surface (ring, self-view, gate). */
const SKIN: HandSkin = {
  accent: ACCENT.base, accentSoft: `${ACCENT.base}66`, ink: PT.ink, muted: PT.inkMute,
  panel: PT.panel, line: PT.lineStrong, onAccent: '#06121f', font: PT.sans, mono: PT.mono,
}

/** A dime reads silver, a penny copper — the two coins a child is being asked to tell apart. */
const DIME = '#cfe0ff'
const PENNY = '#e8a05c'

// ─── the tray ──────────────────────────────────────────────────────────────────────────
/**
 * A dime: ten pips in a 2×5 TEN-FRAME. A penny: one pip, the SAME size.
 *
 * ⚠️ THE TEN IS DRAWN, NOT LABELLED. A disc marked "10¢" asserts its value; ten pips show it, so
 * "ten pennies make a dime" is a thing on screen rather than a rule to recall — and it is what makes
 * six dimes visibly beat five dimes and five pennies without anyone asking a comparison.
 *
 * ⚠️ AND IT IS A TEN-FRAME RATHER THAN A COLUMN OF TEN, WHICH IS A COUNTABILITY FIX. Drawn as a
 * 1×10 strip the coin is ten pips TALL, and measured at 640×320 the board's 98px band scaled that to
 * a 2.2px pip — the one thing the child has to count, made uncountable, which is the fault The Pizza
 * Counter shipped as two 35px pizzas. A 2×5 frame is half the height for the same ten, and it is the
 * arrangement this band already met in 6–8.
 */
function Coin({ well, u }: { well: Well; u: number }) {
  const n = well === 'dimes' ? 10 : 1
  const c = well === 'dimes' ? DIME : PENNY
  const gap = Math.max(1, Math.round(u * 0.2))
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${well === 'dimes' ? 2 : 1}, ${u}px)`, gap,
      padding: Math.round(u * 0.32), borderRadius: Math.round(u * 0.45),
      background: `${c}1c`, border: `1px solid ${c}66`, animation: 'pt_pop .28s ease both',
    }}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} style={{ width: u, height: u, borderRadius: '50%', background: c, boxShadow: `0 0 ${Math.round(u * 0.7)}px ${c}88` }} />
      ))}
    </div>
  )
}

/**
 * One well. It shows a COUNT and never a value — see the header; a live worth readout would let a
 * child sweep counts until it matched.
 */
function WellBox({ well, n, u, active, done, short }: { well: Well; n: number; u: number; active: boolean; done: boolean; short?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: short ? 4 : 6 }}>
      <span style={{ fontFamily: PT.mono, fontSize: 10.5, letterSpacing: 1.3, textTransform: 'uppercase', color: active ? ACCENT.base : PT.inkMute }}>
        {well === 'dimes' ? 'tenths · dimes' : 'hundredths · pennies'}
      </span>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: Math.round(u * 0.34),
        minWidth: MAX_PER_WELL * u * 2.2, minHeight: u * 7, padding: `${Math.round(u * 0.5)}px ${Math.round(u * 0.6)}px`,
        borderRadius: 12, background: active ? `${ACCENT.base}14` : PT.panelSoft,
        border: `1px ${active ? 'solid' : 'dashed'} ${active ? ACCENT.base : PT.line}`,
        justifyContent: 'center',
      }}>
        {Array.from({ length: n }).map((_, i) => <Coin key={i} well={well} u={u} />)}
      </div>
      {/* ⚠️ THE COUNT GOES ON A SHORT FRAME. It is a readout of a thing already countable in front of
          the child, and the ~30px it costs comes straight out of the coins — which at 640×320 is the
          difference between a pip you can count and one you cannot. */}
      {!short && (
        <span style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 20, color: done || active ? PT.ink : PT.inkMute }}>{done || active ? n : '–'}</span>
      )}
    </div>
  )
}

function Board({ data, tray, slot, filled, verdict, verdictOk, solid, u, short }: {
  data: CtRound; tray: Tray; slot: Well | null; filled: Well[]
  verdict?: string | null; verdictOk?: boolean; solid?: boolean; u: number; short?: boolean
}) {
  /**
   * ⚠️ ON A SHORT FRAME THE BOARD DROPS EVERYTHING THAT IS SAID SOMEWHERE ELSE. The header strip
   * repeats `data.tag`, which the prompt card's own chip already carries; the pixels it costs come
   * straight out of the coins, which are the one thing here that cannot be read anywhere else.
   */
  const chrome = !short
  return (
    <div style={{ position: 'relative', background: solid ? PT.panelSolid : PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 300, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      {chrome && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
          <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>{data.tag}</span>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: verdict ? (verdictOk ? PT.ok : PT.warn) : ACCENT.base, boxShadow: `0 0 8px ${verdict ? (verdictOk ? PT.ok : PT.warn) : ACCENT.base}` }} />
        </div>
      )}
      {/* ⚠️ TWO COLUMNS ON A SHORT FRAME, AND THIS IS REFLOW RATHER THAN SCALE — the distinction the
          teen band already paid for. Stacked, the board is a TALL thing in a short WIDE band: at
          640×320 it measured 201×90 inside 550×98, i.e. height binding hard with ~330px of width
          going spare, and FitBox obediently shrank the coins to 4px. Putting the tag beside the wells
          spends the width that was there and takes the pip back up. */}
      <div style={{ padding: short ? '10px 14px' : '16px 22px 18px', display: 'flex', flexDirection: short ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: short ? 14 : 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {/* The price tag itself — the decimal, never the money form. See cents.ts on why. */}
          <div style={{ display: 'flex', flexDirection: short ? 'column' : 'row', alignItems: short ? 'center' : 'baseline', gap: short ? 1 : 8, fontFamily: PT.mono, fontWeight: 800, lineHeight: 1.05, color: PT.ink, textShadow: `0 0 24px ${ACCENT.base}66` }}>
            <span style={{ fontSize: short ? 30 : 38, whiteSpace: 'nowrap' }}>{headline(data, !!verdict)}</span>
            <span style={{ fontSize: short ? 10 : 13, fontWeight: 600, color: PT.inkSoft, whiteSpace: 'nowrap' }}>of a dollar</span>
          </div>
          {/* ⚠️ ON A SHORT FRAME THE ROW IS SIZED BY ITS CONTENT, NOT RESERVED. 22px of blank band on
              a 98px board is a fifth of the coins' size spent on a pill that is not there — and a
              FIXED reserve is worse than either: the pill wraps to two lines at this width, so a 24px
              box let it spill straight over the price tag above it. Measured on screen. The board
              rescaling slightly when the verdict lands is the cheaper of the two. */}
          <div style={{ minHeight: short ? 0 : 32, display: 'flex', alignItems: 'center' }}>
            {verdict && <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: short ? 12 : 16, padding: short ? '4px 10px' : '5px 16px', borderRadius: short ? 12 : 999, animation: 'pt_pop .4s ease both', background: verdictOk ? PT.ok : PT.warn, color: '#06121f', boxShadow: `0 0 18px ${verdictOk ? PT.ok : PT.warn}`, textAlign: 'center', maxWidth: short ? 150 : undefined, lineHeight: 1.25 }}>{verdict}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: short ? 6 : 10 }}>
          <WellBox well="dimes" n={tray.dimes} u={u} active={slot === 'dimes'} done={filled.includes('dimes')} short={short} />
          {/* The point sits BETWEEN the wells, because that is what it does. */}
          <span style={{ alignSelf: 'center', fontFamily: PT.mono, fontWeight: 800, fontSize: short ? 26 : 34, color: ACCENT.base, transform: 'translateY(6px)' }}>.</span>
          <WellBox well="pennies" n={tray.pennies} u={u} active={slot === 'pennies'} done={filled.includes('pennies')} short={short} />
        </div>
      </div>
    </div>
  )
}

/**
 * The board sits in the band LEFT OVER by the things it must clear, rather than centred on a share of
 * the height — a percentage is a guess at a gap. The arithmetic lives in cents.ts so a sweep can
 * drive the same numbers this layout does.
 */
function Stage({ children, short = false, promptBottom = 0, extraBot = 0 }: { children: React.ReactNode; short?: boolean; promptBottom?: number; extraBot?: number }) {
  const { w: vw, h: vh } = useViewport()
  const { top, band } = boardBand(vh, short, promptBottom, extraBot)
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: top + band / 2, transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={vw * 0.86} availH={band} max={2.2} min={0.3}>{children}</FitBox>
    </div>
  )
}

/** ⚠️ The lane lives in cents.ts, and it keys on WIDTH — see `MILO_LANE` there for why. */
const PIP = (short: boolean) => (short ? 7 : 8)

/**
 * The TAP path's answer surface — the same span a well can hold.
 *
 * ⚠️ NOTHING HERE MAY CHANGE COLOUR BEFORE THE COMMIT. Marking a choice as picked, or lighting it on
 * hover, is the hot/cold rule broken. The tray answers, once, after.
 * ⚠️ AND IT STARTS AT 0, because zero is an answer here.
 */
function TapPad({ onPick, short, disabled }: { onPick: (n: number) => void; short?: boolean; disabled?: boolean }) {
  const size = short ? 44 : 52
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: short ? 4 : 7, pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.45 : 1, maxWidth: 'min(96vw, 680px)' }}>
      {padChoices().map(n => (
        <button key={n} onClick={() => onPick(n)} aria-label={`${n} coins`}
          style={{ width: size, height: size, borderRadius: 12, cursor: 'pointer', fontFamily: PT.mono, fontWeight: 800, fontSize: short ? 17 : 20, color: PT.ink, background: PT.panel, border: `1px solid ${ACCENT.base}66` }}>
          {n}
        </button>
      ))}
    </div>
  )
}

/**
 * Says only how many coins were READ, and how far the commit has armed. It must never say whether
 * that count is right — the hot/cold rule, and here it would hand over half the answer.
 */
function HandHud({ progress, note, short, action, onPick, disabled }: { progress: number; note: string | null; short?: boolean; action?: React.ReactNode; onPick?: (n: number) => void; disabled?: boolean }) {
  const { read, input } = useHand()
  const { w: vw, h: vh } = useViewport()
  const size = short ? 60 : 78
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? 8 : '3%', zIndex: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none', paddingLeft: MILO_LANE(vw, vh), paddingRight: 12 }}>
      {note && (
        <div style={{ fontFamily: PT.sans, fontWeight: 700, fontSize: short ? 13 : 15, color: PT.ink, background: input === 'hand' ? PT.panelSolid : PT.panel, border: `1px solid ${ACCENT.base}66`, borderRadius: 999, padding: short ? '5px 14px' : '7px 18px', textAlign: 'center', maxWidth: 'min(92vw, 640px)' }}>{note}</div>
      )}
      {/* ⚠️ The action sits on its OWN line above the pad, never beside it: sharing a flex row ate
          enough width at 640×320 on FactorLab to wrap the buttons onto a second row. */}
      {action && input === 'tap' && <div style={{ display: 'flex', justifyContent: 'center' }}>{action}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: short ? 12 : 18 }}>
        {input === 'tap' && onPick
          ? <TapPad onPick={onPick} short={short} disabled={disabled} />
          : (<>
            <DwellRing progress={progress} size={size} skin={read.hands ? SKIN : { ...SKIN, ink: PT.inkMute }}>
              {read.hands === 0 ? '–' : read.count}
            </DwellRing>
            {action}
          </>)}
      </div>
    </div>
  )
}

/**
 * The teen band's quiet way out, top-right — the smallest thing on the screen and never the forward
 * path. Used on a short frame only, where a full-width action row would cost the board its band.
 */
function TopChip({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ position: 'fixed', top: 10, right: 12, zIndex: 46, fontFamily: PT.sans, fontWeight: 700, fontSize: 13, padding: '6px 13px', borderRadius: 999, border: `1px solid ${ACCENT.base}88`, background: PT.panel, color: ACCENT.base, cursor: 'pointer' }}>
      I&apos;ve got it →
    </button>
  )
}

function StartOver({ onClick, short }: { onClick: () => void; short?: boolean }) {
  return (
    <button onClick={onClick} style={{ pointerEvents: 'auto', fontFamily: PT.sans, fontWeight: 700, fontSize: short ? 12 : 14, padding: short ? '7px 14px' : '9px 18px', borderRadius: 999, border: `1px solid ${PT.line}`, background: PT.panel, color: PT.inkSoft, cursor: 'pointer' }}>
      ↩ start over
    </button>
  )
}

// ─── play ──────────────────────────────────────────────────────────────────────────────
const EMPTY: Tray = { dimes: 0, pennies: 0 }
interface Reveal { verdict: string; ok: boolean }

const CtPlay: React.FC<{ data: CtRound; mode: 'guided' | 'practice'; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const { read, input } = useHand()
  const [tray, setTray] = useState<Tray>(EMPTY)
  const [slot, setSlot] = useState<Well | null>('dimes')
  const [reveal, setReveal] = useState<Reveal | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [promptBottom, setPromptBottom] = useState(0)
  const erred = useRef(false), done = useRef(false)
  /**
   * ⚠️ THE TRAY AND THE SLOT ARE MIRRORED IN REFS, and both of them have to be. Two taps landing in
   * one React batch would otherwise both read the OLD slot and write the same well twice — the
   * batched-tap fault this repo has now met six times, and the last time it was caught the mirror
   * covered the digits and NOT the active box, which is exactly this shape.
   */
  const trayRef = useRef<Tray>(EMPTY)
  const slotRef = useRef<Well | null>('dimes')

  useEffect(() => { speak(sayFor(data, input)) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  const commit = useCallback((t: Tray) => {
    const nudge = nudgeFor(data, t, input)
    if (nudge) {
      // Not a real attempt — redirect and re-open the tray rather than spending a round on it.
      setNote(nudge); speak(nudge)
      trayRef.current = EMPTY; slotRef.current = 'dimes'
      setTray(EMPTY); setSlot('dimes')
      return
    }
    const { text: verdict, ok } = verdictFor(data, t)
    // ⚠️ A redirect belongs to the attempt that earned it — left up, a nudge from the previous try
    // sits under a green verdict telling the child their answer was no answer at all.
    setNote(null)
    setSlot(null)
    setReveal({ verdict, ok })

    if (ok) {
      done.current = true
      speak(verdict)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1900)
    } else {
      erred.current = true
      const m = missFor(data)
      setNote(m); speak(m)
      // Empty the tray, so the next attempt is a fresh lay-out rather than an edit of the last.
      window.setTimeout(() => {
        trayRef.current = EMPTY; slotRef.current = 'dimes'
        setTray(EMPTY); setSlot('dimes'); setReveal(null)
      }, 2000)
    }
  }, [data, mode, onComplete, input])

  /** The ONE path into the tray — the camera and a tap both arrive here. */
  const enter = useCallback((n: number) => {
    if (done.current || reveal || !slotRef.current) return
    const count = Math.max(0, Math.min(MAX_PER_WELL, n))
    const next: Tray = slotRef.current === 'dimes'
      ? { dimes: count, pennies: 0 }
      : { ...trayRef.current, pennies: count }
    trayRef.current = next
    setTray(next)
    if (slotRef.current === 'dimes') { slotRef.current = 'pennies'; setSlot('pennies') }
    else { slotRef.current = null; commit(next) }
  }, [commit, reveal])

  const startOver = useCallback(() => {
    if (done.current || reveal) return
    trayRef.current = EMPTY; slotRef.current = 'dimes'
    setTray(EMPTY); setSlot('dimes'); setNote(null)
  }, [reveal])

  /**
   * ⚠️ Called UNCONDITIONALLY — branching above it would change the hook count between input modes.
   * ⚠️ AND KEYED ON THE READING ALONE. Adding the slot re-arms the timer the instant it advances, so
   * a hand still showing 5 fills both wells with 5 and `0.55` answers itself.
   * ⚠️ `ready` is `hands > 0` and NOT `count > 0`: a fist is the answer on every round whose target
   * has an empty well, which is most of the ones this chapter is for.
   */
  const progress = useDwell(
    { value: read.count, key: `${read.count}/${read.hands}`, ready: read.hands > 0 },
    enter, input === 'hand' && !reveal && !done.current && slot !== null,
  )

  /**
   * ⚠️ SAID AT THE MOMENT IT APPLIES. The held-over guard refuses a hand that has not changed, which
   * is correct and completely invisible — a child answering 0.55 holds five fingers up at a dead
   * surface. This is the one line that turns that into an instruction.
   */
  const stuck = input === 'hand' && slot === 'pennies' && read.hands > 0 && read.count === tray.dimes
  const hint = note ?? (reveal ? null
    : stuck ? 'Lower your hand, then show the pennies.'
    : mode === 'guided' ? (input === 'tap' ? 'Tap how many go in the lit well.' : 'Hold your hand still to drop them in.')
    : null)

  return (
    <>
      <Stage short={short} promptBottom={promptBottom}>
        <Board data={data} tray={tray} slot={slot} filled={slot === 'pennies' ? ['dimes'] : slot === null ? ['dimes', 'pennies'] : []}
          u={PIP(short)} short={short} solid={input === 'hand'}
          verdict={reveal?.verdict ?? null} verdictOk={reveal?.ok} />
      </Stage>
      <PromptCard tag={data.tag} text={data.prompt} instruction={slot ? instructionFor(input, slot) : undefined}
        accent={ACCENT} short={short} solid={input === 'hand'} onMeasure={setPromptBottom} />
      <HandHud progress={reveal ? 0 : progress} short={short} onPick={enter} disabled={!!reveal || done.current || !slot}
        note={hint}
        action={slot === 'pennies' ? <StartOver onClick={startOver} short={short} /> : undefined} />
    </>
  )
}

// ─── demo / re-teach ───────────────────────────────────────────────────────────────────
const CtExplain: React.FC<{ data: CtRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const { input } = useHand()
  const beats = useMemo(() => explainBeats(data), [data])
  const [i, setI] = useState(0)
  const [promptBottom, setPromptBottom] = useState(0)
  const doneRef = useRef(onDone); doneRef.current = onDone

  useEffect(() => {
    const cancel = speakSteps(beats.map(b => b.say), {
      onStep: setI,
      onDone: () => window.setTimeout(() => doneRef.current(), 1400),
      fallbackStepMs: 2400,
    })
    return cancel
  }, [beats])

  const b = beats[i] ?? beats[0]
  const last = i === beats.length - 1
  return (
    <>
      <Stage short={short} promptBottom={promptBottom}>
        <Board data={data} tray={b.tray} slot={null} filled={['dimes', 'pennies']} u={PIP(short)} short={short}
          solid={input === 'hand'}
          verdict={last ? verdictFor(data, b.tray).text : null} verdictOk />
      </Stage>
      {/* ⚠️ The tag is the round's own, not a hardcoded one — the chapter this replaces labelled its
          COMPARE demo "Read", because the card's tag was a literal. */}
      <PromptCard tag="Watch" text={b.say} accent={ACCENT} short={short} solid={input === 'hand'} onMeasure={setPromptBottom} />
    </>
  )
}

// ─── explore: the tray reflows LIVE, because nothing is being asked ────────────────────
/**
 * ⚠️ THIS IS WHERE TEN PENNIES BECOME A DIME, and it is the only place in the chapter where they can.
 * In play a well is set by a COUNT (0..9), so ten pennies is not expressible; here the child adds
 * them one at a time and the tenth one fuses. That relation is the bridge the whole chapter stands on
 * and it belongs in the beat where nothing is scored.
 */
function ExploreBoard({ onContinue, short }: { onContinue: () => void; short?: boolean }) {
  const { read, input } = useHand()
  const [tapPennies, setTapPennies] = useState(0)
  const [promptBottom, setPromptBottom] = useState(0)
  const raw = Math.min(99, input === 'tap' ? tapPennies : (read.hands ? read.count * 10 + read.count : 0))
  const tray: Tray = { dimes: dimesOf(raw), pennies: penniesOf(raw) }
  /**
   * ⚠️ NOT A PRICE TAG. Reusing the round's "READ THE TAG" chrome here printed a tag reading `0.01`
   * over an empty tray — a question card on the one beat that asks nothing, and a number that was
   * simply untrue. The big figure is what the TRAY is worth, live, which is the whole point of the
   * beat; the chrome says so.
   */
  const round: CtRound = { ...GUIDED, target: raw, tag: 'On the tray' }
  return (
    <>
      {/* ⚠️ ON A SHORT FRAME THE WAY OUT IS THE QUIET TOP-RIGHT CHIP, NOT A ROW ABOVE THE PAD.
          Measured at 640×320: its own line costs `ACTION_ROW` 47px of bottom band, which pushes
          `boardBand`'s top clamp from 105 down to 65 — and the board is then drawn 32px INTO the
          question card, over the price tag, which is the question rather than text already read.
          Top-right is free here: SkillBeat's round counter owns that corner in a played round and
          the explore beat renders outside it, so the two can never want it at once. */}
      {short && <TopChip onClick={onContinue} />}
      <Stage short={short} promptBottom={promptBottom} extraBot={input === 'tap' && !short ? ACTION_ROW(false) : 0}>
        <Board data={round} tray={tray} slot={null} filled={['dimes', 'pennies']} u={PIP(!!short)} short={short}
          solid={input === 'hand'}
          verdict={raw > 0 ? `${raw} pennies is ${dec(raw)} of a dollar` : null} verdictOk />
      </Stage>
      <PromptCard tag="Try it" accent={ACCENT} short={short} solid={input === 'hand'}
        text={input === 'tap'
          ? 'Tap to pile that many pennies on the tray — 0 clears it. Every tenth penny becomes one dime, so watch which well it lands in.'
          : 'Hold up some fingers and that many pennies pile on. Every ten of them become one dime — watch which well it lands in.'}
        onMeasure={setPromptBottom} />
      {/* ⚠️ 0 CLEARS THE TRAY rather than adding nothing. "Add zero pennies" is a tap that does
          nothing at all, which is the worst outcome there is — and a pile with no way back is a
          dead end the moment a child overshoots. */}
      <HandHud progress={0} note={null} short={short} onPick={n => setTapPennies(p => (n === 0 ? 0 : Math.min(99, p + n)))} action={short ? undefined : (
        <button onClick={onContinue} style={{ pointerEvents: 'auto', fontFamily: PT.sans, fontWeight: 800, fontSize: 16, padding: '12px 28px', borderRadius: 999, border: `1px solid ${ACCENT.base}`, background: ACCENT.soft, color: ACCENT.base, cursor: 'pointer' }}>
          I&apos;ve got it →
        </button>)} />
    </>
  )
}

// ─── beat ──────────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ The input arrives as a REF, not a value. `SkillBeat` rebuilds its round whenever the beat's
 * identity changes, so a beat memoised on the input would regenerate the question the moment a child
 * switched surfaces. A ref is stable, and `say` is only read at speak time, so it is always current.
 */
function makeBeat(inputRef: React.RefObject<HandInputKind>): Beat<CtRound> {
  return {
    skillId: 'decimals', rounds: 10,
    ownsFeedback: true,
    make: (d, _round, asked) => makeRound((d || 1) as Tier, asked ?? []),
    sig: d => `${d.qType}|${d.target}|${d.place ?? ''}|${d.from}|${d.step}|${d.op ?? ''}`,
    // L1 is `make` only, so a child who climbs fast could otherwise finish having never been asked to
    // name a place or move a price. See Beat.coverage.
    coverage: { of: d => d.qType, all: ['make', 'place', 'op'] },
    prompt: () => '',   // the chapter draws its own richer prompt card
    say: d => sayFor(d, inputRef.current),
    Play: ({ data, onSubmit }) => <CtPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <CtExplain data={data} onDone={onDone} />,
  }
}

// ─── orchestrator ──────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'

export default function CoinTray({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [demoIdx, setDemoIdx] = useState(0)
  const { h: vh } = useViewport()
  const short = vh < 470

  const marker = useMemo(() => ({ fill: ACCENT.base, ink: '#06121f' }), [])
  const {
    input, hand, onCam, ready, camReady, status, error, start, stop, useTaps, useCamera,
    videoRef, canvasRef,
  } = useHandInput({ reads: 'count', marker })
  const { exit, tally } = useChapterShell(onFinish, onExit, stop)

  const inputRef = useRef<HandInputKind>(input); inputRef.current = input
  const beat = useMemo(() => makeBeat(inputRef), [])

  const inLab = phase !== 'intro'
  const fullCam = inLab && onCam

  return (
    <HandProvider value={hand}>
      {/* ⚠️ THE ROOT CARRIES A COLOUR OF ITS OWN. `fullCam` cannot consult `camReady` — the <video>
          must be mounted before `openCamera` can use it — so between entering and the picture
          arriving the backdrop is already dropped and the video is still `opacity: 0`. Without this
          the whole chapter renders on the app's cream page background. */}
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: PT.bg0 }}>
        <style>{PT_CSS}</style>
        {!fullCam && <LabBackdrop accent={ACCENT} />}
        <BackChip onExit={exit} />

        {/* Both doors are offered every time, and the device's last pick decides which is the big
            button — never which is the ONLY one. */}
        {phase === 'intro' && (
          <IntroCard title="The Coin Tray" accent={ACCENT} short={short}
            cta={onCam ? 'Turn on the camera' : 'Start tapping'}
            /* ⚠️ MEASURED ON SCREEN, NOT COUNTED — `IntroCard` has no maxHeight and no scroll, so a
               body that wraps one line too far pushes the SECOND door off the bottom of a 320px
               frame. Re-measure at 640×320 when you edit either. */
            body={onCam
              ? 'A dime is a tenth of a dollar; a penny is a hundredth. So the two wells of the tray are the two places after the point. Hold up how many of each.'
              : 'A dime is a tenth of a dollar; a penny is a hundredth. So the two wells of the tray are the two places after the point. Tap how many of each.'}
            onStart={() => { unlockSpeech(); setPhase('explore'); if (onCam) start() }}
            alt={onCam
              ? { label: 'Use taps instead', onPick: () => { unlockSpeech(); useTaps(); setPhase('explore') } }
              : { label: 'Use the camera instead', onPick: () => { unlockSpeech(); useCamera(); setPhase('explore') } }} />
        )}

        {/* ⚠️ FULL SCREEN, WITH THE MARKERS ON — the numbered chips over the child's own fingertips
            say not just how many fingers were counted but WHICH, i.e. why a held-up 5 read as 4. */}
        {fullCam && (
          <CamView videoRef={videoRef} canvasRef={canvasRef} full markers w={0}
            skin={SKIN} hidden={!camReady} />
        )}
        {inLab && onCam && !camReady && (
          <CamGate status={status} error={error} skin={SKIN} onRetry={start} onTaps={useTaps} onExit={exit}
            denied="Milo can count the coins on your fingers, or you can tap them instead — both work." />
        )}

        {inLab && ready && (<>
          {phase === 'explore' && <ExploreBoard short={short} onContinue={() => setPhase('demo')} />}

          {phase === 'demo' && (<>
            {Banner(`Watch Milo · ${demoIdx + 1}/${DEMO.length}`, short, fullCam)}
            <CtExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
              onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
          </>)}

          {phase === 'guided' && (<>
            {Banner(onCam ? 'Your turn · hold up the coins' : 'Your turn · tap the coins', short, fullCam)}
            <CtPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} />
          </>)}

          {phase === 'practice' && (
            <div style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
              <SkillBeat beat={beat} onComplete={tally} />
            </div>
          )}
        </>)}

        <PtMilo left={9} />
      </div>
    </HandProvider>
  )
}

function Banner(text: string, short: boolean, solid = false) {
  return (
    <div style={{ position: 'absolute', top: 12, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
      <div style={{ background: solid ? PT.panelSolid : PT.panel, backdropFilter: 'blur(6px)', border: `1px solid ${ACCENT.base}66`, borderRadius: 999, padding: short ? '5px 16px' : '8px 20px', fontFamily: PT.sans, fontWeight: 700, fontSize: short ? 13 : 16, color: ACCENT.base, boxShadow: `0 0 16px ${ACCENT.base}33` }}>{text}</div>
    </div>
  )
}
