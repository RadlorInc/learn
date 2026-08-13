'use client'
/**
 * Chapter (9–11) — COMPARING FRACTIONS (skill `fractionsCompare`), answered with the CAMERA or by TAP.
 *
 * THE VERB IS "MATCH IT", AND THE CHILD'S FINGERS ARE A NUMBER OF SLICES. Two pizzas the same size,
 * cut differently; some of theirs is gone; the child says how many of MINE come to the same amount,
 * holding that many fingers up to a laptop webcam or a tablet's front camera. All three readings of
 * the skill are that one act — see story/pizza.ts for the maths, the ladder and the grader, which
 * live outside React because a webcam cannot be driven by a gate.
 *
 * ⚠️ ONE INSTRUMENT, TWO INPUTS, ONE GRADER. The camera does not answer the question — it sets the
 * same number a tap sets, and both land in `commit(fingers)`, which is the only grading sink. So the
 * two paths cannot drift into grading differently, and the pure module's sweep covers both at once:
 * `padChoices()` is derived from `MAX_FINGERS`, so the pad offers exactly what two hands can hold.
 *
 * ⚠️ THE BOARD DOES NOT TAKE A SLICE UNTIL THE CHILD COMMITS, and here that is the whole honesty of
 * it rather than a nicety. Two gaps side by side can be compared BY EYE, so a board that removed
 * slices live as the fingers changed would let a child sweep 1, 2, 3 … and stop when the gaps
 * matched — having judged nothing. While the question is open MY pizza is whole, its cuts visible,
 * and the child has to reason from the size of a slice. On commit the gap appears and either lines
 * up with theirs or does not. The EXPLORE beat reflows live, where nothing is asked.
 *
 * ⚠️ NO ANSWER IS EVER ZERO, so a fist means nothing here and `hands === 0` is the only guard the
 * commit needs — unlike FactorLab, where a fist IS the prime answer and had to be told apart from a
 * lowered hand. The tap pad therefore starts at 1: a button that can never be right is a distractor
 * the camera path does not have.
 *
 * ⚠️ THE TAP PATH IS NOT A DEGRADED MODE, AND IT COMMITS DIFFERENTLY ON PURPOSE. A tap is CONSUMED;
 * a hand is still up when the next question opens. So the camera needs two guards a tap does not —
 * hold still for DWELL_MS, and ignore the reading held over from the last round — and pushing a tap
 * through them would silently swallow it, since a tap matching the held-over reading reads as
 * held-over. A tap therefore calls `commit` directly. `useDwell` is still called unconditionally,
 * merely not live: branching above a hook changes the hook count and tears the chapter into the
 * error boundary, which this repo has shipped once already.
 *
 * ⚠️ THE PIZZA IS A REAL SPRITE CLIPPED BY THE EXACT WEDGE, never flat SVG pie slices. The chapter
 * this replaces drew its fractions as flat bars, which is a diagram laid over a scene — the same
 * fault as BlockYard's brown slab. Exact and painted are not a choice: the division is arithmetic
 * (`wedgePath`) and what the child sees is food. Cost: zero new art, both files already shipped for
 * 6–8's SliceShop.
 *
 * ⚠️ AND THE WORLD IS THE DAILY ANCHOR ITSELF (docs/story-9-11-ar-plan.md §6), not a simile in the
 * briefing — the recorded exception, because cutting a pizza IS partitioning a whole, so the anchor
 * and the manipulative are the same object. The reasoning, and why the VERB still had to differ from
 * 6–8's pizza chapter, is in pizza.ts next to the strings.
 *
 * ⚠️ VERIFICATION. Everything above the pure module is EYEBALL-ONLY — no gate can feed a webcam.
 * The dev-only `window.__miloFingers(n, hands)` (stripped from production) exists so the whole
 * chapter can still be driven end to end headlessly.
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
  boardBand, frac, openingTake, ACTION_ROW, ANCHOR, DEMO, GUIDED, type PzRound, type Tier,
} from './pizza'

const ACCENT = ACCENTS.teal

/** This chapter's colours for the shared camera surface (ring, self-view, gate). */
const SKIN: HandSkin = {
  accent: ACCENT.base, accentSoft: `${ACCENT.base}66`, ink: PT.ink, muted: PT.inkMute,
  panel: PT.panel, line: PT.lineStrong, onAccent: '#06121f', font: PT.sans, mono: PT.mono,
}

const PIZZA_ART = '/assets/objects/pizza_base.png'

// ─── the pizza ─────────────────────────────────────────────────────────────────────────
const R2 = Math.PI / 180
/**
 * One wedge of a round whole, `den` to a turn — the same geometry SliceShop cuts with, so the two
 * bands' pizzas are divided by one piece of arithmetic rather than two.
 */
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
 * ⚠️ THE EMPTY PART IS A PLATE, NOT AN OUTLINE. A dashed or hairline sector is a wireframe, which is
 * the one thing a picture of food contains none of; the plate underneath is a real surface and it is
 * what a missing slice actually reveals.
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
      {/* ⚠️ THE PLATE, AND IT IS WHAT THE GAP MUST LOOK LIKE. Filling the taken sector with the
          accent — which is what this drew first — reads as a SHADED region rather than as missing
          pizza, i.e. as the pie chart the chapter is escaping, and worse it is ambiguous: a child
          cannot tell whether the coloured half or the pizza half is "the amount". Nothing is drawn
          over a taken slice at all; the dish shows through, which is what a slice being gone looks
          like. Pale, because the panel behind it is navy and an absence has to be visible to be
          compared. */}
      <circle cx={50} cy={50} r={49} fill="rgba(214,228,255,.20)" stroke={PT.lineStrong} strokeWidth={1.6} />
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
      {gone > 0 && <path d={Array.from({ length: gone }, (_, i) => wedgePath(i, den)).join(' ')} fill="none" stroke={`${ACCENT.base}aa`} strokeWidth={1.4} strokeLinejoin="round" />}
    </svg>
  )
}

function PizzaCard({ label, den, taken, size, muted, short }: { label: string; den: number; taken: number; size: number; muted?: boolean; short?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: short ? 4 : 7 }}>
      <span style={{ fontFamily: PT.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', color: muted ? PT.inkMute : ACCENT.base }}>{label}</span>
      <Pizza den={den} taken={taken} size={size} dim={muted} />
      {/* ⚠️ The caption goes on a short frame: it repeats the cut and the amount that the question
          card already states, and the 18px it costs comes straight out of the pizza — which is the
          one thing here that cannot be read anywhere else. The LABEL stays, because nothing else on
          screen says whose pizza this is. */}
      {!short && (
        <span style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 15, color: muted ? PT.inkSoft : PT.ink }}>
          {taken > 0 ? frac(taken, den) : `cut in ${den}`}
        </span>
      )}
    </div>
  )
}

/**
 * The board: their order (already served) beside mine (the one the child takes from). An `op` round
 * is one pizza, because nothing is being compared — the same board, one card fewer.
 */
function Board({ data, taken, verdict, verdictOk, solid, size, short }: {
  data: PzRound; taken: number; verdict?: string | null; verdictOk?: boolean; solid?: boolean; size: number; short?: boolean
}) {
  const two = data.qType !== 'op'
  const big = data.qType === 'op'
    ? `${frac(data.gone, data.den)} ${data.op} ${frac(data.step, data.den)}`
    : `? / ${data.den}`
  /**
   * ⚠️ ON A SHORT FRAME THE BOARD DROPS EVERYTHING THAT IS SAID SOMEWHERE ELSE, and that is a
   * countability fix rather than a tidy-up. Measured at 640×320: the question card wraps to 96px of
   * a 320px frame and the answer row reserves 112, so `boardBand` hands the board its 90px floor —
   * and FitBox then scaled two pizzas down to about 35px each, i.e. the one thing the child has to
   * COMPARE became unreadable. The header strip repeats `data.tag`, which the prompt card's own chip
   * already carries, and the big readout repeats the denominator the card already states. Dropping
   * both gives the pizzas ~70px of the panel back, which is the whole difference.
   */
  const chrome = !short
  return (
    /* ⚠️ OPAQUE OVER THE CAMERA, translucent over the backdrop. The scrim leaves ~⅔ of whatever room
       the child is sitting in, and a 0.72 panel passes ~28% of that through — so against a window
       the pizza's own edges fall toward the room behind them, on the one surface being compared. */
    <div style={{ position: 'relative', background: solid ? PT.panelSolid : PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 300, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      {chrome && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
          <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>{data.tag}</span>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: verdict ? (verdictOk ? PT.ok : PT.warn) : ACCENT.base, boxShadow: `0 0 8px ${verdict ? (verdictOk ? PT.ok : PT.warn) : ACCENT.base}` }} />
        </div>
      )}
      <div style={{ padding: short ? '12px 16px 12px' : '16px 22px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: short ? 8 : 12 }}>
        {/* An `op` round's sum is the question and is NOT on the card, so it stays at every size. */}
        {(chrome || data.qType === 'op') && (
          <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: short ? 22 : 34, lineHeight: 1, color: PT.ink, textShadow: `0 0 24px ${ACCENT.base}66`, whiteSpace: 'nowrap' }}>{big}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: short ? 16 : 22 }}>
          {two && <PizzaCard label="theirs" den={data.refDen} taken={data.refNum} size={size} muted short={short} />}
          <PizzaCard label={two ? 'mine' : 'the pizza'} den={data.den} taken={taken} size={size} short={short} />
        </div>
        <div style={{ height: short ? 22 : 32 }}>
          {verdict && <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 16, padding: '5px 16px', borderRadius: 999, animation: 'pt_pop .4s ease both', background: verdictOk ? PT.ok : PT.warn, color: '#06121f', boxShadow: `0 0 18px ${verdictOk ? PT.ok : PT.warn}`, whiteSpace: 'nowrap' }}>{verdict}</div>}
        </div>
      </div>
    </div>
  )
}

/**
 * The board sits in the band LEFT OVER by the things it must clear, rather than centred on a share
 * of the height — a percentage is a guess at a gap. The arithmetic lives in `pizza.ts` so a sweep
 * can drive the same numbers this layout does; see `boardBand`.
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

/**
 * ⚠️ Milo stands bottom-left (`PtMilo left={9}`) and the bottom band is where the answer surface
 * lives, so on a short frame he sits over the leftmost buttons. He gets a lane, and the pad centres
 * in what is left. (Measured on FactorLab, where he covered the one answer a child had to find.)
 */
const MILO_LANE = (short: boolean) => (short ? 104 : 12)
const PIZZA_PX = (short: boolean) => (short ? 96 : 118)

/**
 * The TAP path's answer surface — the same span two hands can hold.
 *
 * ⚠️ NOTHING HERE MAY CHANGE COLOUR BEFORE THE COMMIT. Marking a choice as picked, or lighting it on
 * hover, is the hot/cold rule broken — the child could sweep the pad watching for a reaction. The
 * board answers, once, after.
 */
function TapPad({ onPick, short, disabled }: { onPick: (n: number) => void; short?: boolean; disabled?: boolean }) {
  // 44px is the tap floor and does not move; the GAP is what gives, so ten buttons still make one
  // row inside the width Milo leaves. A second row would grow up into the board.
  const size = short ? 44 : 52
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: short ? 4 : 7, pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.45 : 1, maxWidth: 'min(96vw, 680px)' }}>
      {padChoices().map(n => (
        <button key={n} onClick={() => onPick(n)} aria-label={`${n} slices`}
          style={{ width: size, height: size, borderRadius: 12, cursor: 'pointer', fontFamily: PT.mono, fontWeight: 800,
            fontSize: short ? 17 : 20, color: PT.ink, background: PT.panel, border: `1px solid ${ACCENT.base}66` }}>
          {n}
        </button>
      ))}
    </div>
  )
}

/**
 * Says only how many slices were READ, and how far the commit has armed. It must never say whether
 * that number is right — the hot/cold rule, and here it would hand over the whole answer.
 */
function HandHud({ progress, note, short, action, onPick, disabled }: { progress: number; note: string | null; short?: boolean; action?: React.ReactNode; onPick?: (n: number) => void; disabled?: boolean }) {
  const { read, input } = useHand()
  const size = short ? 60 : 78
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? 8 : '3%', zIndex: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none', paddingLeft: MILO_LANE(!!short), paddingRight: 12 }}>
      {note && (
        <div style={{ fontFamily: PT.sans, fontWeight: 700, fontSize: short ? 13 : 15, color: PT.ink, background: input === 'hand' ? PT.panelSolid : PT.panel, border: `1px solid ${ACCENT.base}66`, borderRadius: 999, padding: short ? '5px 14px' : '7px 18px', textAlign: 'center', maxWidth: 'min(92vw, 640px)' }}>{note}</div>
      )}
      {/* ⚠️ The action sits on its OWN line above the pad, never beside it: sharing a flex row ate
          enough width at 640×320 on FactorLab to wrap the buttons onto a second row, which then
          landed off the bottom edge. Beside the dwell RING it is fine — that is one small circle. */}
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

// ─── play ──────────────────────────────────────────────────────────────────────────────
interface Reveal { take: number; verdict: string; ok: boolean }

const PzPlay: React.FC<{ data: PzRound; mode: 'guided' | 'practice'; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const { read, input } = useHand()
  const [reveal, setReveal] = useState<Reveal | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [promptBottom, setPromptBottom] = useState(0)
  const erred = useRef(false), done = useRef(false)

  useEffect(() => { speak(sayFor(data, input)) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  const commit = useCallback((fingers: number) => {
    if (done.current || reveal) return

    // A count that is not a real attempt redirects instead of scoring — the same call the colouring
    // chapter makes for a tap that lands on the ink.
    const nudge = nudgeFor(data, fingers, input)
    if (nudge) { setNote(nudge); speak(nudge); return }

    // ⚠️ The verdict string lives in the pure module, so the gate can drive the same words the board
    // prints. The chapter this replaces built it in the component, where nothing could see it
    // printing the answer before the question had been asked.
    const { text: verdict, ok } = verdictFor(data, fingers)
    // ⚠️ A redirect belongs to the attempt that earned it — left up, a nudge from the previous try
    // sits under a green verdict telling the child their answer was impossible.
    setNote(null)
    setReveal({ take: fingers, verdict, ok })

    if (ok) {
      done.current = true
      speak(verdict)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1900)
    } else {
      erred.current = true
      const m = missFor(data)
      setNote(m); speak(m)
      // Put the pizza back, so the next attempt is a fresh commit rather than an edit of the last.
      window.setTimeout(() => { setReveal(null) }, 1900)
    }
  }, [data, mode, onComplete, reveal, input])

  // ⚠️ Called UNCONDITIONALLY — branching above it would change the hook count between input modes
  // and tear the chapter into the error boundary. On the tap path it is simply never live.
  // No hand in frame is not an answer, and here neither is a fist: no round accepts 0.
  const progress = useDwell(
    { value: read.count, key: `${read.count}/${read.hands}`, ready: read.hands > 0 && read.count > 0 },
    commit, input === 'hand' && !reveal && !done.current,
  )

  return (
    <>
      <Stage short={short} promptBottom={promptBottom}>
        <Board data={data} taken={reveal?.take ?? openingTake(data)} size={PIZZA_PX(short)} short={short}
          solid={input === 'hand'} verdict={reveal?.verdict ?? null} verdictOk={reveal?.ok} />
      </Stage>
      <PromptCard tag={data.tag} text={data.prompt} instruction={reveal ? undefined : instructionFor(data, input)}
        accent={ACCENT} short={short} solid={input === 'hand'} onMeasure={setPromptBottom} />
      <HandHud progress={reveal ? 0 : progress} short={short} onPick={commit} disabled={!!reveal || done.current}
        note={note ?? (mode === 'guided' && !reveal
          ? (input === 'tap' ? 'Tap how many slices.' : 'Hold your hand still to lock it in.')
          : null)} />
    </>
  )
}

// ─── demo / re-teach ───────────────────────────────────────────────────────────────────
const PzExplain: React.FC<{ data: PzRound; onDone: () => void }> = ({ data, onDone }) => {
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
        <Board data={data} taken={b.take} size={PIZZA_PX(short)} short={short} solid={input === 'hand'}
          verdict={last ? verdictFor(data, data.accepts[0]).text : null} verdictOk />
      </Stage>
      <PromptCard tag="Watch" text={b.say} accent={ACCENT} short={short} solid={input === 'hand'} onMeasure={setPromptBottom} />
    </>
  )
}

// ─── explore: the board reflows LIVE, because nothing is being asked ───────────────────
/**
 * Half a pizza against sixths — the pair that shows the whole idea at once: 3 sixths lands exactly
 * on a half, 2 is less, 4 is more. Live on both inputs, because this beat teaches and scores nothing.
 */
const EXPLORE: PzRound = { ...GUIDED, refDen: 2, refNum: 1, den: 6, accepts: [3] }

function ExploreBoard({ onContinue, short }: { onContinue: () => void; short?: boolean }) {
  const { read, input } = useHand()
  const [tapTake, setTapTake] = useState(0)
  const [promptBottom, setPromptBottom] = useState(0)
  const take = Math.min(EXPLORE.den, input === 'tap' ? tapTake : (read.hands ? read.count : 0))
  const lhs = take * EXPLORE.refDen, rhs = EXPLORE.refNum * EXPLORE.den
  return (
    <>
      <Stage short={short} promptBottom={promptBottom} extraBot={input === 'tap' ? ACTION_ROW(!!short) : 0}>
        <Board data={EXPLORE} taken={take} size={PIZZA_PX(!!short)} short={short} solid={input === 'hand'}
          verdict={take > 0 ? (lhs === rhs ? 'the same' : lhs < rhs ? 'less than theirs' : 'more than theirs') : null}
          verdictOk={lhs === rhs} />
      </Stage>
      <PromptCard tag="Try it" accent={ACCENT} short={short} solid={input === 'hand'}
        text={input === 'tap'
          ? 'Their half is gone. Tap a number and that many of MY sixths go — find the count that comes to the same amount.'
          : 'Their half is gone. Hold up some fingers and that many of MY sixths go — find the count that comes to the same amount.'}
        onMeasure={setPromptBottom} />
      <HandHud progress={0} note={null} short={short} onPick={setTapTake} action={
        <button onClick={onContinue} style={{ pointerEvents: 'auto', fontFamily: PT.sans, fontWeight: 800, fontSize: short ? 14 : 16, padding: short ? '9px 20px' : '12px 28px', borderRadius: 999, border: `1px solid ${ACCENT.base}`, background: ACCENT.soft, color: ACCENT.base, cursor: 'pointer' }}>
          I&apos;ve got it →
        </button>} />
    </>
  )
}

// ─── beat ──────────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ The input arrives as a REF, not a value. `SkillBeat` rebuilds its round whenever the beat's
 * identity changes, so a beat memoised on the input would regenerate the question the moment a child
 * switched surfaces. A ref is stable, and `say` is only read at speak time, so it is always current.
 */
function makeBeat(inputRef: React.RefObject<HandInputKind>): Beat<PzRound> {
  return {
    skillId: 'fractionsCompare', rounds: 10,
    ownsFeedback: true,
    make: (d, _round, asked) => makeRound((d || 1) as Tier, asked ?? []),
    sig: d => `${d.qType}|${d.den}|${d.refDen}|${d.refNum}|${d.gone}|${d.step}|${d.op ?? ''}`,
    // L1 is `match` only, so a child who climbs fast could otherwise finish having never met the
    // comparison or the arithmetic. See Beat.coverage.
    coverage: { of: d => d.qType, all: ['match', 'more', 'op'] },
    prompt: () => '',   // the chapter draws its own richer prompt card
    say: d => sayFor(d, inputRef.current),
    Play: ({ data, onSubmit }) => <PzPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <PzExplain data={data} onDone={onDone} />,
  }
}

// ─── orchestrator ──────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'

export default function PizzaCounter({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
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
  /** The camera is the BACKDROP once the child is at the counter — see `CamView full`. */
  const fullCam = inLab && onCam

  return (
    <HandProvider value={hand}>
      {/* ⚠️ THE ROOT CARRIES A COLOUR OF ITS OWN. `fullCam` cannot consult `camReady` — the <video>
          must be mounted before `openCamera` can use it — so between entering and the picture
          arriving the backdrop is already dropped and the video is still `opacity: 0`. Without this
          the whole chapter renders on the app's cream page background. Not an edge case: every
          camera-path entry, every denial, every failure. */}
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: PT.bg0 }}>
        <style>{PT_CSS}</style>
        {/* ⚠️ Not painted under a full-screen camera: invisible behind an opaque video, and still
            animating fifteen stars plus an 86vw element under `blur(90px)` on a tablet already
            running MediaPipe. The intro still gets it. */}
        {!fullCam && <LabBackdrop accent={ACCENT} />}
        <BackChip onExit={exit} />

        {/* Both doors are offered every time, and the device's last pick decides which is the big
            button — never which is the ONLY one. A parent who says no to the camera on Monday must
            not have to say it again, and a child who wants it back must not have to hunt. */}
        {phase === 'intro' && (
          <IntroCard title="The Pizza Counter" accent={ACCENT} short={short}
            cta={onCam ? 'Turn on the camera' : 'Start tapping'}
            /* ⚠️ MEASURED ON SCREEN, NOT COUNTED — 165 / 161 characters, and the count is the proxy
               rather than the rule. `IntroCard` has no maxHeight and no scroll, so a body that wraps
               one line too far pushes the SECOND door off the bottom of a 320px frame. At 190 chars
               these wrapped to four lines and left the alt button 6px clear of the edge; at 165 they
               wrap to three. Re-measure at 640×320 when you edit either — do not trust the count. */
            body={onCam
              ? `${ANCHOR} Cut it more and each slice shrinks, so more of them make the same amount. Hold up how many.`
              : `${ANCHOR} Cut it more and each slice shrinks, so more of them make the same amount. Tap how many.`}
            onStart={() => { unlockSpeech(); setPhase('explore'); if (onCam) start() }}
            alt={onCam
              ? { label: 'Use taps instead', onPick: () => { unlockSpeech(); useTaps(); setPhase('explore') } }
              : { label: 'Use the camera instead', onPick: () => { unlockSpeech(); useCamera(); setPhase('explore') } }} />
        )}

        {/* ⚠️ FULL SCREEN, WITH THE MARKERS ON — the numbered chips over the child's own fingertips
            say not just how many fingers were counted but WHICH, i.e. why a held-up 5 read as 4.
            `drawCount` draws them at R = 18, which a 76px corner panel clips away entirely. */}
        {fullCam && (
          <CamView videoRef={videoRef} canvasRef={canvasRef} full markers w={0}
            skin={SKIN} hidden={!camReady} />
        )}
        {inLab && onCam && !camReady && (
          <CamGate status={status} error={error} skin={SKIN} onRetry={start} onTaps={useTaps} onExit={exit}
            denied="Milo can count the slices on your fingers, or you can tap them instead — both work." />
        )}

        {inLab && ready && (<>
          {phase === 'explore' && <ExploreBoard short={short} onContinue={() => setPhase('demo')} />}

          {phase === 'demo' && (<>
            {Banner(`Watch Milo · ${demoIdx + 1}/${DEMO.length}`, short, fullCam)}
            <PzExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
              onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
          </>)}

          {phase === 'guided' && (<>
            {Banner(onCam ? 'Your turn · hold up the slices' : 'Your turn · tap the slices', short, fullCam)}
            <PzPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} />
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
