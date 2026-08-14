'use client'
/**
 * Chapter (9–11) — MEASUREMENT UNITS (skill `measurementUnits`), answered with the CAMERA or by TAP.
 *
 * THE VERB IS "DOES IT FIT?", AND THE WORLD IS THE HEIGHT BAR AT A RIDE. The sign is in inches, the
 * pencil mark on your door frame is in feet and inches, and you cannot tell whether you are tall
 * enough until both are on the same ruler. See story/inches.ts for the maths, the ladder, the words
 * and the grader — they live outside React because a webcam cannot be driven by a gate — and for why
 * the units are US customary and what that costs.
 *
 * ⚠️ ONE INSTRUMENT, TWO INPUTS, ONE GRADER. The camera does not answer the question — it sets the
 * same digit a tap sets, and both land in `enter(n)`, which is the only path into the entry. So the
 * two paths cannot drift, and `padChoices()` is derived from `MAX_PER_PLACE` so the pad offers
 * exactly what a place can hold.
 *
 * ⚠️ THE BAR IS NOT SCALED, TICKED OR MARKED BEFORE THE COMMIT. A bar with inch marks on it is the
 * printed answer drawn instead of written — the child would count it and convert nothing, which is
 * exactly the fault an area chapter was deleted for. Only the SIGN's limit is drawn, and the child's
 * own mark appears when they have committed.
 *
 * ⚠️ AND FITTING IS THE CONSEQUENCE, NEVER THE QUESTION. "Does it fit, yes or no" is a 50% coin flip
 * and this band is being rebuilt to remove those; the converted NUMBER is what is scored, and the
 * gate opening is what the child then watches happen.
 *
 * ⚠️ THE ANSWER IS TWO PLACES AND THE DWELL IS KEYED ON THE READING ALONE. Putting the place in the
 * key re-arms the timer the instant it advances, so a hand still showing 5 enters 5 twice and 55
 * answers itself — measured on FitOut, which shipped `12` as `11` for exactly this. A repeat then
 * needs the hand to leave and come back, which nothing on screen says, so `hint` says it.
 *
 * ⚠️ ZERO IS A REAL ANSWER (a `need` round's "exactly tall enough", and the tens digit of every
 * answer under ten), so a fist must be told from a lowered hand — FactorLab's guard (`hands > 0`,
 * count may be 0) — and the tap pad starts at 0.
 *
 * ⚠️ THE HANDS-APART SPAN IS THE EXPLORE BEAT AND NOT THE ANSWER, and the arithmetic that decided
 * that is written out in inches.ts. In short: two palms carry ~±0.028 of frame width between them,
 * which lands as ±2.3 in on this chapter's answer scale — so a child who KNEW the answer could not
 * enter it. It is The Angle Shop's precedent, verbatim: the hand answers the question it can answer.
 *
 * ⚠️ VERIFICATION. Everything above the pure module is EYEBALL-ONLY — no gate can feed a webcam. The
 * dev-only `window.__miloFingers(n, hands)` and `window.__miloSpan(span, count)` (both stripped from
 * production) exist so the whole chapter can still be driven end to end headlessly.
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
  boardBand, headline, signOf, spanInches, spanNote, ftIn, exploreText,
  ACTION_ROW, MAX_PER_PLACE, MILO_LANE, EMPTY_ENTRY, DEMO, GUIDED,
  type HbRound, type Tier, type Entry, type Place,
} from './inches'

const ACCENT = ACCENTS.amber

/** This chapter's colours for the shared camera surface (ring, self-view, gate). */
const SKIN: HandSkin = {
  accent: ACCENT.base, accentSoft: `${ACCENT.base}66`, ink: PT.ink, muted: PT.inkMute,
  panel: PT.panel, line: PT.lineStrong, onAccent: '#06121f', font: PT.sans, mono: PT.mono,
}

// ─── the bar ───────────────────────────────────────────────────────────────────────────
/**
 * The ride's height bar. ⚠️ THE ONLY THING MARKED ON IT IS THE SIGN'S LIMIT — no scale, no ticks, no
 * intermediate numbers. A ruled bar is a ruler, i.e. the answer drawn rather than written, and a
 * child would read their height straight off it.
 *
 * The child's own mark is drawn only once they have committed, and its HEIGHT on the bar is derived
 * from what they built — so a wrong answer puts the mark visibly in the wrong place, which is the
 * consequence rather than a verdict.
 */
function Bar({ limit, mark, u, short }: { limit: number; mark: number | null; u: number; short?: boolean }) {
  const h = u * (short ? 9 : 12)
  // The bar spans a fixed range of inches so the limit and the mark share one scale; the range
  // itself is never drawn or numbered.
  const TOP_IN = 78
  const y = (inches: number) => h - (Math.max(0, Math.min(TOP_IN, inches)) / TOP_IN) * h
  return (
    <div style={{ position: 'relative', width: u * 3, height: h, flexShrink: 0 }}>
      {/* the post */}
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: Math.max(6, u * 0.5), transform: 'translateX(-50%)', borderRadius: 6, background: `linear-gradient(180deg, ${PT.panelSoft}, ${PT.panel})`, border: `1px solid ${PT.line}` }} />
      {/* the posted limit — the one number on the bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: y(limit), transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ height: 3, flex: 1, background: ACCENT.base, boxShadow: `0 0 10px ${ACCENT.base}` }} />
      </div>
      {/* the child's own mark, after the commit */}
      {mark !== null && (
        <div style={{ position: 'absolute', left: -u * 0.6, right: -u * 0.6, top: y(mark), transform: 'translateY(-50%)', animation: 'pt_pop .4s ease both' }}>
          <div style={{ height: 3, background: PT.ink, opacity: 0.9 }} />
        </div>
      )}
    </div>
  )
}

/** One entry window — a place of the answer being built. Shows a digit or a waiting dash. */
function Window({ place, digit, active, unit, short }: { place: Place; digit: number | null; active: boolean; unit: string; short?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: short ? 2 : 4 }}>
      <span style={{ fontFamily: PT.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: active ? ACCENT.base : PT.inkMute }}>
        {place}
      </span>
      <div style={{
        minWidth: short ? 34 : 46, padding: short ? '4px 8px' : '6px 12px', borderRadius: 10, textAlign: 'center',
        background: active ? `${ACCENT.base}14` : PT.panelSoft,
        border: `1px ${active ? 'solid' : 'dashed'} ${active ? ACCENT.base : PT.line}`,
        fontFamily: PT.mono, fontWeight: 800, fontSize: short ? 24 : 32, lineHeight: 1.1,
        color: digit === null ? PT.inkMute : PT.ink,
      }}>{digit === null ? '–' : digit}</div>
      {/* the unit rides the ones window, so the number being built is always labelled */}
      <span style={{ fontFamily: PT.mono, fontSize: short ? 9 : 11, color: PT.inkSoft, minHeight: 12 }}>
        {place === 'ones' ? unit : ''}
      </span>
    </div>
  )
}

function Board({ data, entry, slot, verdict, verdictOk, revealed, solid, u, short }: {
  data: HbRound; entry: Entry; slot: Place | null
  verdict?: string | null; verdictOk?: boolean; revealed?: boolean; solid?: boolean; u: number; short?: boolean
}) {
  /**
   * ⚠️ ON A SHORT FRAME THE BOARD DROPS EVERYTHING THAT IS SAID SOMEWHERE ELSE. The header strip
   * repeats `data.tag`, which the prompt card's own chip already carries; the pixels it costs come
   * straight out of the bar and the windows, which are the things that cannot be read anywhere else.
   */
  const chrome = !short
  const sign = signOf(data)
  return (
    <div style={{ position: 'relative', background: solid ? PT.panelSolid : PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 280, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      {/* ⚠️ THE STRIP CARRIES NO TAG, AND THAT IS A CORRECTION MADE ON SCREEN. Copied from The Coin
          Tray it printed `data.tag` — and the prompt card's own chip prints the same words, so
          "TALL ENOUGH?" appeared twice on one screen, an inch apart. The tag belongs to the QUESTION
          (zone 3's chip); the strip is the instrument's status light and says nothing the card
          already says. */}
      {chrome && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: verdict ? (verdictOk ? PT.ok : PT.warn) : ACCENT.base, boxShadow: `0 0 8px ${verdict ? (verdictOk ? PT.ok : PT.warn) : ACCENT.base}` }} />
        </div>
      )}
      {/* ⚠️ A ROW ON A SHORT FRAME — REFLOW RATHER THAN SCALE. Stacked, this board is a TALL thing in
          a short WIDE band, and FitBox then shrinks the two entry windows (the things being read) to
          spend height it did not have. The bar is the tallest piece, so it goes BESIDE the rest. */}
      <div style={{ padding: short ? '10px 14px' : '16px 22px 18px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: short ? 14 : 20 }}>
        {data.qType !== 'swap' && <Bar limit={data.limit} mark={revealed ? data.ft * 12 + data.inch : null} u={u} short={short} />}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: short ? 6 : 10 }}>
          {/* what the round GIVES — the door-frame mark, or the amount to swap. Never the answer. */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: short ? 26 : 34, lineHeight: 1.05, color: PT.ink, textShadow: `0 0 24px ${ACCENT.base}66`, whiteSpace: 'nowrap' }}>
              {headline(data, !!revealed)}
            </span>
            {sign && (
              <span style={{ fontFamily: PT.mono, fontSize: short ? 10 : 12, color: ACCENT.base, letterSpacing: 1, whiteSpace: 'nowrap' }}>
                sign: {sign}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: short ? 6 : 10 }}>
            <Window place="tens" digit={entry.tens} active={slot === 'tens'} unit={data.unit} short={short} />
            <Window place="ones" digit={entry.ones} active={slot === 'ones'} unit={data.unit} short={short} />
          </div>
          {/* ⚠️ SIZED BY ITS CONTENT, NOT RESERVED. A fixed reserve for something that WRAPS is worse
              than none: The Coin Tray's 24px box let a two-line verdict spill over the tag above it. */}
          <div style={{ minHeight: short ? 0 : 30, display: 'flex', alignItems: 'center' }}>
            {verdict && <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: short ? 11 : 15, padding: short ? '4px 10px' : '5px 14px', borderRadius: short ? 12 : 999, animation: 'pt_pop .4s ease both', background: verdictOk ? PT.ok : PT.warn, color: '#06121f', boxShadow: `0 0 18px ${verdictOk ? PT.ok : PT.warn}`, textAlign: 'center', maxWidth: short ? 190 : 340, lineHeight: 1.25 }}>{verdict}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * The board sits in the band LEFT OVER by the things it must clear, rather than centred on a share of
 * the height — a percentage is a guess at a gap. The arithmetic lives in inches.ts so a sweep can
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

const UNIT = (short: boolean) => (short ? 11 : 14)

/**
 * The TAP path's answer surface — one digit per place.
 *
 * ⚠️ NOTHING HERE MAY CHANGE COLOUR BEFORE THE COMMIT. Marking a choice as picked, or lighting it on
 * hover, is the hot/cold rule broken.
 * ⚠️ AND IT STARTS AT 0, because zero is an answer here — a `need` round's exact boundary, and the
 * tens digit of every answer under ten.
 */
function TapPad({ onPick, short, disabled }: { onPick: (n: number) => void; short?: boolean; disabled?: boolean }) {
  const size = short ? 44 : 52
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: short ? 4 : 7, pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.45 : 1, maxWidth: 'min(96vw, 680px)' }}>
      {padChoices().map(n => (
        <button key={n} onClick={() => onPick(n)} aria-label={`digit ${n}`}
          style={{ width: size, height: size, borderRadius: 12, cursor: 'pointer', fontFamily: PT.mono, fontWeight: 800, fontSize: short ? 17 : 20, color: PT.ink, background: PT.panel, border: `1px solid ${ACCENT.base}66` }}>
          {n}
        </button>
      ))}
    </div>
  )
}

/**
 * Says only what was READ, and how far the commit has armed. It must never say whether that reading
 * is right — the hot/cold rule.
 */
function HandHud({ progress, note, short, action, onPick, disabled, centre }: {
  progress: number; note: string | null; short?: boolean; action?: React.ReactNode
  onPick?: (n: number) => void; disabled?: boolean; centre?: React.ReactNode
}) {
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
            {centre ?? (
              <DwellRing progress={progress} size={size} skin={read.hands ? SKIN : { ...SKIN, ink: PT.inkMute }}>
                {read.hands === 0 ? '–' : read.count}
              </DwellRing>
            )}
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
interface Reveal { verdict: string; ok: boolean }

const HbPlay: React.FC<{ data: HbRound; mode: 'guided' | 'practice'; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const { read, input } = useHand()
  const [entry, setEntry] = useState<Entry>(EMPTY_ENTRY)
  const [slot, setSlot] = useState<Place | null>('tens')
  const [reveal, setReveal] = useState<Reveal | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [promptBottom, setPromptBottom] = useState(0)
  const erred = useRef(false), done = useRef(false)
  /**
   * ⚠️ THE ENTRY AND THE SLOT ARE MIRRORED IN REFS, and both of them have to be. Two taps landing in
   * one React batch would otherwise both read the OLD slot and write the same place twice — the
   * batched-tap fault this repo has met seven times, and the last time it was caught the mirror
   * covered the digits and NOT the active box, which is exactly this shape.
   */
  const entryRef = useRef<Entry>(EMPTY_ENTRY)
  const slotRef = useRef<Place | null>('tens')

  useEffect(() => { speak(sayFor(data, input)) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  const commit = useCallback((e: Entry) => {
    const nudge = nudgeFor(data, e, input)
    if (nudge) {
      // Not a real attempt — redirect and re-open the entry rather than spending a round on it.
      setNote(nudge); speak(nudge)
      entryRef.current = EMPTY_ENTRY; slotRef.current = 'tens'
      setEntry(EMPTY_ENTRY); setSlot('tens')
      return
    }
    const { text: verdict, ok } = verdictFor(data, e)
    // ⚠️ A redirect belongs to the attempt that earned it — left up, a nudge from the previous try
    // sits under a green verdict telling the child their answer was no answer at all.
    setNote(null)
    setSlot(null)
    setReveal({ verdict, ok })

    if (ok) {
      done.current = true
      speak(verdict)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 2100)
    } else {
      erred.current = true
      const m = missFor(data)
      setNote(m); speak(m)
      // Clear it, so the next attempt is a fresh conversion rather than an edit of the last.
      window.setTimeout(() => {
        entryRef.current = EMPTY_ENTRY; slotRef.current = 'tens'
        setEntry(EMPTY_ENTRY); setSlot('tens'); setReveal(null)
      }, 2200)
    }
  }, [data, mode, onComplete, input])

  /** The ONE path into the entry — the camera and a tap both arrive here. */
  const enter = useCallback((n: number) => {
    if (done.current || reveal || !slotRef.current) return
    const digit = Math.max(0, Math.min(MAX_PER_PLACE, n))
    const next: Entry = slotRef.current === 'tens'
      ? { tens: digit, ones: null }
      : { ...entryRef.current, ones: digit }
    entryRef.current = next
    setEntry(next)
    if (slotRef.current === 'tens') { slotRef.current = 'ones'; setSlot('ones') }
    else { slotRef.current = null; commit(next) }
  }, [commit, reveal])

  const startOver = useCallback(() => {
    if (done.current || reveal) return
    entryRef.current = EMPTY_ENTRY; slotRef.current = 'tens'
    setEntry(EMPTY_ENTRY); setSlot('tens'); setNote(null)
  }, [reveal])

  /**
   * ⚠️ Called UNCONDITIONALLY — branching above it would change the hook count between input modes.
   * ⚠️ AND KEYED ON THE READING ALONE. Adding the slot re-arms the timer the instant it advances, so
   * a hand still showing 5 fills both places with 5 and 55 answers itself.
   * ⚠️ `ready` is `hands > 0` and NOT `count > 0`: zero is the tens digit of every answer under ten,
   * and the whole answer on a `need` round where the child is exactly tall enough.
   */
  const progress = useDwell(
    { value: read.count, key: `${read.count}/${read.hands}`, ready: read.hands > 0 },
    enter, input === 'hand' && !reveal && !done.current && slot !== null,
  )

  /**
   * ⚠️ SAID AT THE MOMENT IT APPLIES. The held-over guard refuses a hand that has not changed, which
   * is correct and completely invisible — a child answering 44 holds four fingers up at a dead
   * surface. This is the one line that turns that into an instruction.
   */
  const stuck = input === 'hand' && slot === 'ones' && read.hands > 0 && read.count === entry.tens
  const hint = note ?? (reveal ? null
    : stuck ? 'Lower your hand, then show the ones digit.'
      : mode === 'guided' ? (input === 'tap' ? 'Tap the digit for the lit window.' : 'Hold your hand still to enter it.')
        : null)

  return (
    <>
      <Stage short={short} promptBottom={promptBottom}>
        <Board data={data} entry={entry} slot={slot} u={UNIT(short)} short={short} solid={input === 'hand'}
          revealed={!!reveal && reveal.ok}
          verdict={reveal?.verdict ?? null} verdictOk={reveal?.ok} />
      </Stage>
      {/* ⚠️ THE SHORT FRAME GETS THE FACTS WITHOUT THE RULE — see `context` in inches.ts. Measured:
          the full prompt wraps this card to 97px at 640×320 and the instruction chip is then drawn
          29 × 16 px across the headline, which is the question. */}
      <PromptCard tag={data.tag} text={short ? data.context : data.prompt} instruction={slot ? instructionFor(input, slot) : undefined}
        accent={ACCENT} short={short} solid={input === 'hand'} onMeasure={setPromptBottom} />
      <HandHud progress={reveal ? 0 : progress} short={short} onPick={enter} disabled={!!reveal || done.current || !slot}
        note={hint}
        action={slot === 'ones' ? <StartOver onClick={startOver} short={short} /> : undefined} />
    </>
  )
}

// ─── demo / re-teach ───────────────────────────────────────────────────────────────────
const HbExplain: React.FC<{ data: HbRound; onDone: () => void }> = ({ data, onDone }) => {
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
      fallbackStepMs: 2600,
    })
    return cancel
  }, [beats])

  const b = beats[i] ?? beats[0]
  const last = i === beats.length - 1
  return (
    <>
      <Stage short={short} promptBottom={promptBottom}>
        <Board data={data} entry={b.entry} slot={null} u={UNIT(short)} short={short} solid={input === 'hand'}
          revealed={b.revealed}
          verdict={last ? verdictFor(data, b.entry).text : null} verdictOk />
      </Stage>
      {/* ⚠️ The tag is the round's OWN, not a hardcoded one — the chapter this replaces labelled its
          UNIT demo "Convert", because the card's tag was a literal. */}
      <PromptCard tag={data.tag} text={b.say} accent={ACCENT} short={short} solid={input === 'hand'} onMeasure={setPromptBottom} />
    </>
  )
}

// ─── explore: how big IS an inch? ──────────────────────────────────────────────────────
/**
 * ⚠️ THIS IS THE BEAT THE HANDS-APART SPAN IS FOR, AND THE ONLY ONE. Nothing here is scored, so the
 * ±2.3 in that makes the reading useless as an answer costs nothing at all — "about how long is a
 * foot" wants no precision, and it is the benchmark sense that decides which unit is sensible in the
 * first place. See inches.ts for the arithmetic that put it here rather than on a scored round.
 *
 * ⚠️ THE TAP PATH GETS THE SAME IDEA THROUGH THE ONE THING A SCREEN CAN HONESTLY SHOW: a count of
 * inches stacking up into feet. A drawn ruler with numbers on it would be the estimate handed over —
 * and a screen has no true inches anyway, so a child dragging to "a foot" would be matching pixels.
 */
function ExploreBoard({ onContinue, short }: { onContinue: () => void; short?: boolean }) {
  const { read, input } = useHand()
  const [tapInches, setTapInches] = useState(0)
  const [promptBottom, setPromptBottom] = useState(0)
  const shown = input === 'tap' ? tapInches : spanInches(read.span)
  const ft = Math.floor((shown ?? 0) / 12), inch = (shown ?? 0) % 12
  return (
    <>
      {/* ⚠️ ON A SHORT FRAME THE WAY OUT IS THE QUIET TOP-RIGHT CHIP, NOT A ROW ABOVE THE PAD.
          Its own line costs `ACTION_ROW` 47px of bottom band, which pushes `boardBand`'s top clamp
          down and draws the board INTO the question card. Top-right is free here: SkillBeat's round
          counter owns that corner in a played round and this beat renders outside it. */}
      {short && <TopChip onClick={onContinue} />}
      <Stage short={short} promptBottom={promptBottom} extraBot={input === 'tap' && !short ? ACTION_ROW(false) : 0}>
        <div style={{ position: 'relative', background: input === 'hand' ? PT.panelSolid : PT.panel, border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 300, padding: short ? '14px 18px' : '22px 28px', boxShadow: `0 0 30px ${ACCENT.base}26`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: short ? 8 : 12 }}>
          <Brackets color={ACCENT.base} />
          <span style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: short ? 34 : 46, lineHeight: 1, color: shown === null ? PT.inkMute : PT.ink, textShadow: `0 0 24px ${ACCENT.base}66` }}>
            {shown === null ? '– in' : `${shown} in`}
          </span>
          {/* the same length on the other ruler, side by side — the whole point of the beat */}
          <span style={{ fontFamily: PT.mono, fontSize: short ? 13 : 17, color: ACCENT.base }}>
            {/* ⚠️ `ftIn`, NOT A SECOND COPY OF THE WRITTEN FORM. Spelt out here it read `= 1 ft 0 in`
                while every round writes that height `1 ft` — two places deciding one thing, and the
                one the child meets first is the one that disagrees. */}
            {shown === null ? 'nothing measured yet' : ft ? `= ${ftIn(ft, inch)}` : 'less than a foot'}
          </span>
        </div>
      </Stage>
      {/* ⚠️ THE SHORT-FRAME COPY IS SHORTER, AND THE NUMBER CAME OFF THE SCREEN RATHER THAN OUT OF
          taste. At 640×320 the full body wraps this card to 79px, which puts `boardBand`'s wanted top
          at 133 — past the 112 the clamp allows — so the board was drawn over the bottom 5px of the
          INSTRUCTION CHIP. The clamp's premise is that it slides under text already read, and zone
          3's chip is the one action rather than something read and finished with. The demo card here
          is 51px and clears by 8, so it is this card's prose that has to give: the honest lever, and
          the one this band reaches for before touching the bands. */}
      <PromptCard tag="Try it" accent={ACCENT} short={short} solid={input === 'hand'}
        text={exploreText(input, !!short)}
        instruction={input === 'tap' ? 'Stack up about a foot.' : 'Show me about how long a foot is.'}
        onMeasure={setPromptBottom} />
      <HandHud progress={0} short={short}
        note={input === 'tap' ? null : spanNote(spanInches(read.span))}
        onPick={n => setTapInches(p => (n === 0 ? 0 : Math.min(99, p + n)))}
        centre={input === 'hand' ? <span /> : undefined}
        action={short ? undefined : (
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
function makeBeat(inputRef: React.RefObject<HandInputKind>): Beat<HbRound> {
  return {
    skillId: 'measurementUnits', rounds: 10,
    ownsFeedback: true,
    make: (d, _round, asked) => makeRound((d || 1) as Tier, asked ?? []),
    sig: d => `${d.qType}|${d.answer}|${d.limit}|${d.ft}|${d.inch}|${d.from}|${d.fromUnit}`,
    // L1 is `fit` only, so a child who climbs fast could otherwise finish having never been asked how
    // far short they are or to swap a ruler at all. See Beat.coverage.
    coverage: { of: d => d.qType, all: ['fit', 'need', 'swap'] },
    prompt: () => '',   // the chapter draws its own richer prompt card
    say: d => sayFor(d, inputRef.current),
    Play: ({ data, onSubmit }) => <HbPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <HbExplain data={data} onDone={onDone} />,
  }
}

// ─── orchestrator ──────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'

export default function HeightBar({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [demoIdx, setDemoIdx] = useState(0)
  const { h: vh } = useViewport()
  const short = vh < 470

  const marker = useMemo(() => ({ fill: ACCENT.base, ink: '#06121f' }), [])
  /**
   * ⚠️ ONE MODE FOR BOTH READINGS — see `span` on HandRead. The scored rounds want a finger COUNT and
   * the explore beat wants the two-hand span, and `reads` is fixed when the camera opens; two modes
   * would mean stopping and restarting the detector between phases, i.e. re-initialising MediaPipe
   * mid-chapter. `'span'` reports both.
   */
  const {
    input, hand, onCam, ready, camReady, status, error, start, stop, useTaps, useCamera,
    videoRef, canvasRef,
  } = useHandInput({ reads: 'span', marker })
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
          <IntroCard title="The Height Bar" accent={ACCENT} short={short}
            cta={onCam ? 'Turn on the camera' : 'Start tapping'}
            /* ⚠️ MEASURED ON SCREEN, NOT COUNTED — `IntroCard` has no maxHeight and no scroll, so a
               body that wraps one line too far pushes the SECOND door off the bottom of a 320px
               frame. Re-measure at 640×320 when you edit either. */
            body={onCam
              ? 'The sign at the ride is in inches. The pencil mark on your door frame is in feet. Same height, two rulers — so put yours in inches and see if you get on. Hold up the digits.'
              : 'The sign at the ride is in inches. The pencil mark on your door frame is in feet. Same height, two rulers — so put yours in inches and see if you get on. Tap the digits.'}
            onStart={() => { unlockSpeech(); setPhase('explore'); if (onCam) start() }}
            alt={onCam
              ? { label: 'Use taps instead', onPick: () => { unlockSpeech(); useTaps(); setPhase('explore') } }
              : { label: 'Use the camera instead', onPick: () => { unlockSpeech(); useCamera(); setPhase('explore') } }} />
        )}

        {/* ⚠️ FULL SCREEN, WITH THE MARKERS ON — the numbered chips over the child's own fingertips
            say not just how many fingers were counted but WHICH, and the span bar is drawn on the
            same canvas, so the explore beat's gesture is visible where the hands are. */}
        {fullCam && (
          <CamView videoRef={videoRef} canvasRef={canvasRef} full markers w={0}
            skin={SKIN} hidden={!camReady} />
        )}
        {inLab && onCam && !camReady && (
          <CamGate status={status} error={error} skin={SKIN} onRetry={start} onTaps={useTaps} onExit={exit}
            denied="Milo can read the digits off your fingers, or you can tap them instead — both work." />
        )}

        {inLab && ready && (<>
          {phase === 'explore' && <ExploreBoard short={short} onContinue={() => setPhase('demo')} />}

          {phase === 'demo' && (<>
            {Banner(`Watch Milo · ${demoIdx + 1}/${DEMO.length}`, short, fullCam)}
            <HbExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
              onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
          </>)}

          {phase === 'guided' && (<>
            {Banner(onCam ? 'Your turn · hold up the digits' : 'Your turn · tap the digits', short, fullCam)}
            <HbPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} />
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
