'use client'
/**
 * Chapter (9–11) — FACTORS & MULTIPLES (skill `factorsMultiples`), answered with the CAMERA.
 *
 * THE VERB IS "SPLIT IT", AND THE CHILD'S FINGERS ARE THE DIVISOR. Milo puts n units on the
 * bench; the child holds up a number of rows to a laptop webcam or a tablet's front camera; the
 * bench deals them and either fills flush or leaves a gap. All four readings of the skill are
 * that one physical act — see story/factors.ts for the maths, the ladder and the grader, which
 * live outside React because a webcam cannot be driven by a gate.
 *
 * ⚠️ WHY THIS CHAPTER AND NOT ANOTHER. It is the one the band had left with no material —
 * FitOut took the array-on-a-frame gesture — and its old form was the band's worst offender on
 * guessing: even/odd and prime were two chips each, i.e. 50%. A number of raised fingers is
 * 1-in-11 and cannot be eliminated into.
 *
 * ⚠️ THE BENCH DOES NOT DEAL UNTIL THE CHILD COMMITS, and that is the whole honesty of it. A
 * bench that reflowed live as the fingers changed would let a child sweep 2, 3, 4, 5 … and stop
 * when it went flush — the repeatable-commit oracle that got an earlier area chapter deleted.
 * Holding a hand STILL for DWELL_MS is the commit, it happens once per scored round, and the
 * repair (changing your mind) is free right up until it fires. In the EXPLORE beat, where
 * nothing is asked, the bench does reflow live — that is teaching, not measuring.
 *
 * ⚠️ A FIST IS AN ANSWER ("nothing fits, so it is prime"), so it must be distinguishable from a
 * child lowering their hand. `useFingerCounter` reports hand PRESENCE alongside the count and
 * nothing commits while `hands === 0`.
 *
 * ⚠️ CAMERA-ONLY, BY FOUNDER DECISION. There is no tap fallback. A device with no camera, or a
 * declined permission, gets an honest dead end (`CamGate`) rather than a blank screen.
 *
 * ⚠️ VERIFICATION. Everything above the pure module is EYEBALL-ONLY — no gate can feed a webcam.
 * The dev-only `window.__miloFingers(n, hands)` (stripped from production, like FloorPlot's
 * `__miloPace`) exists so the whole chapter can still be driven end to end headlessly.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import {
  PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, PtMilo, IntroCard,
} from './preteen/kit'
import { useViewport } from '@/shared/hooks/useViewport'
import FitBox from './FitBox'
import { useFingerCounter } from '@/infra/ar/useFingerCounter'
import {
  makeRound, graded, missFor, nudgeFor, explainBeats, deal, DEMO, GUIDED,
  type FlRound, type Tier,
} from './factors'

const ACCENT = ACCENTS.indigo
/** How long a hand must hold still before it counts as an answer. */
const DWELL_MS = 1200

// ─── the hand, shared down the tree ────────────────────────────────────────────────────
// The camera is opened ONCE for the whole chapter — re-opening it per round would re-prompt and
// re-initialise MediaPipe — so the reading is lifted to the top and read through context. That
// also lets SkillBeat construct `Play` itself without any of this being drilled through it.
interface Hand { fingers: number; hands: number }
const HandCtx = createContext<Hand>({ fingers: 0, hands: 0 })
const useHand = () => useContext(HandCtx)

/**
 * Watch the hand and fire once it has held still on a real answer.
 * Returns how far through the dwell we are, 0..1, so the child can see it arming.
 */
function useDwell(onCommit: (fingers: number) => void, live: boolean) {
  const { fingers, hands } = useHand()
  const [progress, setProgress] = useState(0)
  const cb = useRef(onCommit); cb.current = onCommit
  const key = `${fingers}/${hands}`
  const keyRef = useRef(key); keyRef.current = key

  /**
   * ⚠️ THE READING THE CHILD WAS ALREADY HOLDING WHEN THE QUESTION APPEARED IS NOT AN ANSWER.
   * Hands do not reset between rounds the way a tap surface does, so without this a hand left up
   * from the last round commits itself DWELL_MS after the next question opens — and if that stale
   * count happens to be right, the chapter scores a round the child never played. Caught on the
   * first drive: the guided round opened already reading 5, which was its answer.
   */
  const stale = useRef<string | null>(null)
  useEffect(() => { stale.current = live ? keyRef.current : null }, [live])

  useEffect(() => {
    setProgress(0)
    // Any reading that differs from the held-over one is a fresh gesture, and clears the guard for
    // good — including a hand that simply left the frame, so lowering and re-raising also works.
    const held = stale.current !== null && key === stale.current
    if (!held) stale.current = null
    // No hand in frame is not an answer — a fist (0 fingers, 1 hand) is.
    if (!live || hands === 0 || held) return

    // ⚠️ The COMMIT is a timer and only the RING is rAF. requestAnimationFrame is frozen outright
    // in a backgrounded tab, so a commit driven by it silently never fires — untestable, and on a
    // real device it would stall the moment the child switched away and back.
    const done = window.setTimeout(() => cb.current(fingers), DWELL_MS)
    const t0 = performance.now()
    let raf = requestAnimationFrame(function tick() {
      setProgress(Math.min(1, (performance.now() - t0) / DWELL_MS))
      raf = requestAnimationFrame(tick)
    })
    return () => { window.clearTimeout(done); cancelAnimationFrame(raf) }
  }, [key, fingers, hands, live])

  return progress
}

// ─── the bench ─────────────────────────────────────────────────────────────────────────
function Unit({ size, stranded }: { size: number; stranded?: boolean }) {
  return <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.28), flexShrink: 0,
    background: stranded ? PT.warn : ACCENT.base,
    border: `2px solid ${stranded ? PT.warnDeep : ACCENT.deep}`,
    boxShadow: `0 0 10px ${stranded ? PT.warn : ACCENT.base}66`,
    transition: 'all .3s cubic-bezier(.34,1.56,.64,1)',
  }} />
}

/**
 * n units, dealt into `rows` equal rows. Anything that will not fit sits apart, marked — the gap
 * IS the argument that this row count is not a factor, so it is never quietly dropped.
 */
function Bench({ n, rows, verdict, verdictOk, word = 'row' }: { n: number; rows: number; verdict?: string | null; verdictOk?: boolean; word?: string }) {
  const { perRow, stranded } = deal(n, rows)
  const size = n > 40 ? 18 : n > 24 ? 22 : n > 14 ? 28 : 34
  const gap = Math.round(size * 0.26)
  return (
    <div style={{ position: 'relative', background: PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 300, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
        <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>
          {rows > 0 ? `${rows} ${word}${rows === 1 ? '' : 's'}` : `bench · ${n}`}
        </span>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: verdict ? (verdictOk ? PT.ok : PT.warn) : ACCENT.base, boxShadow: `0 0 8px ${verdict ? (verdictOk ? PT.ok : PT.warn) : ACCENT.base}` }} />
      </div>
      <div style={{ padding: '18px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ fontFamily: PT.mono, fontWeight: 800, fontSize: 56, lineHeight: 1, color: PT.ink, textShadow: `0 0 24px ${ACCENT.base}66` }}>{n}</div>

        {rows > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap, alignItems: 'center' }}>
            {Array.from({ length: rows }).map((_, r) => (
              <div key={r} style={{ display: 'flex', gap }}>
                {Array.from({ length: perRow }).map((_, c) => <Unit key={c} size={size} />)}
              </div>
            ))}
            {stranded > 0 && (
              <div style={{ display: 'flex', gap, marginTop: gap, paddingTop: gap, borderTop: `2px dashed ${PT.warn}88` }}>
                {Array.from({ length: stranded }).map((_, i) => <Unit key={i} size={size} stranded />)}
              </div>
            )}
          </div>
        ) : (
          // Undealt: a loose pile. Deliberately NOT a grid — a grid would be a ruler the child
          // could count rows off before committing.
          <div style={{ display: 'flex', flexWrap: 'wrap', gap, justifyContent: 'center', maxWidth: 13 * (size + gap) }}>
            {Array.from({ length: n }).map((_, i) => <Unit key={i} size={size} />)}
          </div>
        )}

        <div style={{ height: 32 }}>
          {verdict && <div style={{ fontFamily: PT.mono, fontWeight: 700, fontSize: 16, padding: '5px 16px', borderRadius: 999, animation: 'pt_pop .4s ease both', background: verdictOk ? PT.ok : PT.warn, color: '#06121f', boxShadow: `0 0 18px ${verdictOk ? PT.ok : PT.warn}` }}>{verdict}</div>}
        </div>
      </div>
    </div>
  )
}

/**
 * The bench sits in the band LEFT OVER by the things it must clear, rather than centred on a
 * share of the height. Measured at 640×320 the percentage version put its top 5px inside the
 * prompt card — a percentage is a guess at a gap, and this is the gap measured.
 *
 * TOP    chrome (the Menu chip) + the prompt card
 * BOTTOM the hand readout: the dwell ring, plus the note lane, which is RESERVED whether or not
 *        a note is showing — otherwise the bench jumps the moment a child gets one wrong.
 */
// ⚠️ These reserve the WORST case, not the case in front of you. The prompt card is text and it
// WRAPS — measured, the same card is 36px tall on a one-line pair test and 66px on the two-line
// split prompt — so a band tuned to whichever question happened to be on screen puts the bench
// inside the card on the other one. A reserved lane, per the rule that a lane which will fill
// must be reserved from empty.
const TOP_BAND = (short: boolean) => (short ? 104 : 146)
/** The self-view's own box, so the bench's reserve can clear it. 4:3, pinned bottom-right. */
// ⚠️ Small on a short frame, and that is a considered trade. At 320 tall the chrome, a wrapped
// three-line question and the hand readout already claim ~260px, so a 104px self-view pushed the
// bench underneath it. The RING carries the actual reading ("3", "✊"); the self-view only has to
// answer "can the camera see me", which a thumbnail does.
const CAM_W = (short: boolean) => (short ? 76 : 214)
const CAM_BOTTOM = (short: boolean) => (short ? 8 : 14)
/**
 * ⚠️ The bottom is TWO stacks, not one — the hand readout in the centre AND the self-view in the
 * corner. Reserving only for the readout let a wide bench run under the camera panel, which is
 * opaque and drawn above it. Take whichever is taller.
 */
const BOT_BAND = (short: boolean) => Math.max(
  short ? 112 : 152,                                          // note lane + dwell ring
  CAM_W(short) * 0.75 + CAM_BOTTOM(short) + (short ? 6 : 10),  // the self-view
)

function Stage({ children, short = false, bottomExtra = 0, promptBottom = 0 }: { children: React.ReactNode; short?: boolean; bottomExtra?: number; promptBottom?: number }) {
  const { w: vw, h: vh } = useViewport()
  // The constant is only a floor for the first paint; once the card has reported its real bottom
  // edge that wins, because the card's height depends on how the question wrapped.
  const top = Math.max(TOP_BAND(short), promptBottom + (short ? 8 : 12))
  const bot = BOT_BAND(short) + bottomExtra
  const band = Math.max(90, vh - top - bot)
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: top + band / 2, transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={vw * 0.86} availH={band} max={2.2} min={0.3}>{children}</FitBox>
    </div>
  )
}

// ─── the hand readout ──────────────────────────────────────────────────────────────────
/**
 * Says only how many fingers were READ, and how far the commit has armed. It must never say
 * whether that number is right — that is the hot/cold rule, and here it would also hand over
 * the whole answer, since the child could just sweep counts until the readout went green.
 */
function HandHud({ progress, note, short, action }: { progress: number; note: string | null; short?: boolean; action?: React.ReactNode }) {
  const { fingers, hands } = useHand()
  const size = short ? 60 : 78
  const r = size / 2 - 5
  const c = 2 * Math.PI * r
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? 8 : '3%', zIndex: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none', padding: '0 12px' }}>
      {note && (
        <div style={{ fontFamily: PT.sans, fontWeight: 700, fontSize: short ? 13 : 15, color: PT.ink, background: PT.panel, border: `1px solid ${ACCENT.base}66`, borderRadius: 999, padding: short ? '5px 14px' : '7px 18px', textAlign: 'center', maxWidth: 'min(92vw, 640px)' }}>{note}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: short ? 12 : 18 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={PT.lineStrong} strokeWidth={4} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ACCENT.base} strokeWidth={4}
            strokeDasharray={c} strokeDashoffset={c * (1 - progress)} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: PT.mono, fontWeight: 800, fontSize: short ? 24 : 30, color: hands ? PT.ink : PT.inkMute }}>
          {hands === 0 ? '–' : fingers === 0 ? '✊' : fingers}
        </div>
      </div>
      {action}
      </div>
    </div>
  )
}

/** The self-view. Small on purpose — the bench is the thing being read, not the child. */
function CamPanel({ videoRef, canvasRef, short, hidden }: { videoRef: React.RefObject<HTMLVideoElement | null>; canvasRef: React.RefObject<HTMLCanvasElement | null>; short?: boolean; hidden?: boolean }) {
  const w = CAM_W(!!short)
  return (
    <div style={{ position: 'fixed', right: 10, bottom: CAM_BOTTOM(!!short), width: w, aspectRatio: '4 / 3', zIndex: 36,
      opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto', borderRadius: 14, overflow: 'hidden', border: `1px solid ${ACCENT.base}66`, boxShadow: `0 0 20px ${ACCENT.base}33, 0 10px 26px rgba(0,0,0,.5)`, background: '#050a14' }}>
      {/* Mirrored, so raising your right hand raises the one on the right of the screen. */}
      <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  )
}

// ─── play ──────────────────────────────────────────────────────────────────────────────
interface Reveal { rows: number; verdict: string; ok: boolean }

const FlPlay: React.FC<{ data: FlRound; mode: 'guided' | 'practice'; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
  const [reveal, setReveal] = useState<Reveal | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [promptBottom, setPromptBottom] = useState(0)
  const erred = useRef(false), done = useRef(false)

  useEffect(() => { speak(data.say) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  const commit = useCallback((fingers: number) => {
    if (done.current || reveal) return

    // A count that is not a real attempt redirects instead of scoring — the same call the
    // colouring chapter makes for a tap that lands on the ink.
    const nudge = nudgeFor(data, fingers)
    if (nudge) { setNote(nudge); speak(nudge); return }

    const ok = graded(data, fingers)
    const { stranded } = deal(data.n, fingers)
    const verdict = fingers === 0
      ? (ok ? `${data.n} is PRIME` : 'Something does fit')
      : ok
        ? (data.qType === 'evenOdd'
          ? `${fingers} pairs — ${data.n} is ${data.n % 2 ? 'ODD' : 'EVEN'}`
          : `${data.n} = ${fingers} × ${data.n / fingers}`)
        : `${stranded} left over`
    setReveal({ rows: fingers, verdict, ok })

    if (ok) {
      done.current = true
      speak(verdict)
      window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1900)
    } else {
      erred.current = true
      const m = missFor(data)
      setNote(m); speak(m)
      // Clear the bench so the next attempt is a fresh commit, not an edit of the last one.
      window.setTimeout(() => { setReveal(null) }, 1900)
    }
  }, [data, mode, onComplete, reveal])

  const progress = useDwell(commit, !reveal && !done.current)

  return (
    <>
      <Stage short={short} promptBottom={promptBottom}>
        <Bench n={data.n} rows={reveal?.rows ?? 0} word={data.qType === 'evenOdd' ? 'pair' : 'row'}
          verdict={reveal?.verdict ?? null} verdictOk={reveal?.ok} />
      </Stage>
      <PromptCard tag={data.tag} text={data.prompt} instruction={reveal ? undefined : data.instruction} accent={ACCENT} short={short} onMeasure={setPromptBottom} />
      <HandHud progress={reveal ? 0 : progress} short={short}
        note={note ?? (mode === 'guided' && !reveal ? 'Hold your hand still to lock it in.' : null)} />
    </>
  )
}

// ─── demo / re-teach ───────────────────────────────────────────────────────────────────
const FlExplain: React.FC<{ data: FlRound; onDone: () => void }> = ({ data, onDone }) => {
  const { h: vh } = useViewport()
  const short = vh < 470
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
  const { stranded } = deal(data.n, b.rows)
  return (
    <>
      <Stage short={short} promptBottom={promptBottom}>
        <Bench n={data.n} rows={b.rows} word={data.qType === 'evenOdd' ? 'pair' : 'row'}
          verdict={i === beats.length - 1 ? (b.leftover || stranded > 0 ? 'gap' : 'no gaps') : null}
          verdictOk={!b.leftover && stranded === 0} />
      </Stage>
      <PromptCard tag="Watch" text={b.say} accent={ACCENT} short={short} onMeasure={setPromptBottom} />
    </>
  )
}

// ─── explore: the bench reflows LIVE, because nothing is being asked ───────────────────
function ExploreBench({ onContinue, short }: { onContinue: () => void; short?: boolean }) {
  const { fingers, hands } = useHand()
  const [n] = useState(12)
  const [promptBottom, setPromptBottom] = useState(0)
  const { stranded } = deal(n, fingers)
  return (
    <>
      <Stage short={short} promptBottom={promptBottom}>
        <Bench n={n} rows={hands ? fingers : 0}
          verdict={hands && fingers >= 2 ? (stranded === 0 ? 'no gaps' : `${stranded} left over`) : null}
          verdictOk={stranded === 0} />
      </Stage>
      <PromptCard tag="Try it" accent={ACCENT} short={short}
        text={`Hold up some fingers. The bench splits ${n} into that many rows — watch which counts fill up with no gaps.`}
        onMeasure={setPromptBottom} />
      <HandHud progress={0} note={null} short={short} action={
        <button onClick={onContinue} style={{ pointerEvents: 'auto', fontFamily: PT.sans, fontWeight: 800, fontSize: short ? 14 : 16, padding: short ? '9px 20px' : '12px 28px', borderRadius: 999, border: `1px solid ${ACCENT.base}`, background: ACCENT.soft, color: ACCENT.base, cursor: 'pointer' }}>
          I&apos;ve got it →
        </button>} />
    </>
  )
}

// ─── the camera gate ───────────────────────────────────────────────────────────────────
/** Camera-only chapter: a refusal or a missing camera is an honest dead end, not a blank screen. */
function CamGate({ status, error, onRetry, onExit }: { status: string; error: string; onRetry: () => void; onExit: () => void }) {
  const denied = /NotAllowed|Permission/i.test(error)
  const missing = /NotFound|Overconstrained|NotReadable/i.test(error)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 460, textAlign: 'center', background: PT.panel, border: `1px solid ${ACCENT.base}66`, borderRadius: 20, padding: '26px 28px', boxShadow: `0 0 30px ${ACCENT.base}26` }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{status === 'loading' ? '📷' : denied ? '🙈' : '📷'}</div>
        <div style={{ fontFamily: PT.sans, fontWeight: 800, fontSize: 20, color: PT.ink, marginBottom: 8 }}>
          {status === 'loading' ? 'Waking the camera…' : denied ? 'Milo needs to see your hands' : missing ? 'No camera found' : 'The camera did not start'}
        </div>
        <div style={{ fontFamily: PT.sans, fontSize: 15, color: PT.inkMute, lineHeight: 1.5 }}>
          {status === 'loading' ? 'One moment.'
            : denied ? 'This lab is answered with your fingers, so it needs the camera. Allow it in your browser and try again.'
              : missing ? 'This lab is answered by holding up your fingers, so it needs a camera. Try it on a device that has one.'
                : 'Something got in the way. Have another go.'}
        </div>
        {status !== 'loading' && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
            <button onClick={onRetry} style={{ fontFamily: PT.sans, fontWeight: 800, fontSize: 15, padding: '10px 22px', borderRadius: 999, border: `1px solid ${ACCENT.base}`, background: ACCENT.base, color: '#06121f', cursor: 'pointer' }}>Try again</button>
            <button onClick={onExit} style={{ fontFamily: PT.sans, fontWeight: 700, fontSize: 15, padding: '10px 20px', borderRadius: 999, border: `1px solid ${PT.lineStrong}`, background: 'transparent', color: PT.inkMute, cursor: 'pointer' }}>Back</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── beat ──────────────────────────────────────────────────────────────────────────────
function makeBeat(): Beat<FlRound> {
  return {
    skillId: 'factorsMultiples', rounds: 10, reteachAfter: 3, walkEvery: 99,
    ownsFeedback: true,
    make: (d, _round, asked) => makeRound((d || 1) as Tier, asked ?? []),
    sig: d => `${d.qType}|${d.n}|${d.base}`,
    // A prime is the one reading the child can otherwise finish without ever meeting: it lives at
    // L2+ and mastery can end the run in ~6 rounds. See Beat.coverage.
    coverage: { of: d => d.qType, all: ['evenOdd', 'multiple', 'factor', 'prime'] },
    prompt: () => '',   // the chapter draws its own richer prompt card
    say: d => d.say,
    Play: ({ data, onSubmit }) => <FlPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <FlExplain data={data} onDone={onDone} />,
  }
}

// ─── orchestrator ──────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'

export default function FactorLab({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('intro')
  const [demoIdx, setDemoIdx] = useState(0)
  const [hand, setHand] = useState<Hand>({ fingers: 0, hands: 0 })
  const { h: vh } = useViewport()
  const short = vh < 470
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)

  const onCount = useCallback((fingers: number, hands: number) => setHand({ fingers, hands }), [])
  const marker = useMemo(() => ({ fill: ACCENT.base, ink: '#06121f' }), [])
  const { status, error, start, stop } = useFingerCounter(videoRef, canvasRef, { onCount, marker })

  const exit = useCallback(() => { stopSpeech(); stop(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit, stop])
  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return; finished.current = true; stopSpeech(); stop()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit, stop])
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 700)), [])
  const beat = useMemo(() => makeBeat(), [])

  // Dev-only drive hook — a webcam cannot be fed headlessly, so without this nothing past the
  // intro is verifiable at all. Stripped from production exactly like FloorPlot's __miloPace.
  // It stands in for the camera as well as the hand, or the gate below would block every drive.
  const [fakeCam, setFakeCam] = useState(false)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    ;(window as unknown as Record<string, unknown>).__miloFingers =
      (fingers: number, hands = 1) => { setFakeCam(true); setHand({ fingers, hands }) }
    return () => { delete (window as unknown as Record<string, unknown>).__miloFingers }
  }, [])

  const camReady = status === 'running' || (process.env.NODE_ENV !== 'production' && fakeCam)
  const inLab = phase !== 'intro'

  return (
    <HandCtx.Provider value={hand}>
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <style>{PT_CSS}</style>
        <LabBackdrop accent={ACCENT} />
        <BackChip onExit={exit} />

        {phase === 'intro' && (
          <IntroCard title="Number Lab" accent={ACCENT} cta="Turn on the camera" short={short}
            body="Milo splits numbers on the bench — and YOUR HAND is the splitter. Hold up a number of rows and the bench deals them out. If they fill up with no gaps, you found a factor. Make a fist if nothing fits at all."
            onStart={() => { unlockSpeech(); setPhase('explore'); start() }} />
        )}

        {/* ⚠️ MOUNTED AS SOON AS WE ENTER THE LAB, NOT WHEN THE CAMERA SUCCEEDS. `openCamera` needs
            this <video> to already exist; gating it on success granted the camera and then threw on
            a null element, so the child saw "the camera did not start" while Chrome said "Using
            now". It is merely INVISIBLE until running — it must keep its layout box, because the
            detect loop reads video.clientWidth/clientHeight. */}
        {inLab && <CamPanel videoRef={videoRef} canvasRef={canvasRef} short={short} hidden={!camReady} />}
        {inLab && !camReady && (
          <CamGate status={status} error={error} onRetry={start} onExit={exit} />
        )}

        {inLab && camReady && (<>
          {phase === 'explore' && <ExploreBench short={short} onContinue={() => setPhase('demo')} />}

          {phase === 'demo' && (<>
            {Banner(`Watch Milo · ${demoIdx + 1}/${DEMO.length}`, short)}
            <FlExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
              onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
          </>)}

          {phase === 'guided' && (<>
            {Banner('Your turn · hold up the rows', short)}
            <FlPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} />
          </>)}

          {phase === 'practice' && (
            <div style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
              <SkillBeat beat={beat} onInterlude={interlude}
                onComplete={(c, w, mastered) => { result.current.correct += c; result.current.wrong += w; finishChapter(result.current.correct, result.current.wrong, mastered) }} />
            </div>
          )}
        </>)}

        <PtMilo left={9} />
      </div>
    </HandCtx.Provider>
  )
}

function Banner(text: string, short: boolean) {
  return (
    <div style={{ position: 'absolute', top: 12, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
      <div style={{ background: PT.panel, backdropFilter: 'blur(6px)', border: `1px solid ${ACCENT.base}66`, borderRadius: 999, padding: short ? '5px 16px' : '8px 20px', fontFamily: PT.sans, fontWeight: 700, fontSize: short ? 13 : 16, color: ACCENT.base, boxShadow: `0 0 16px ${ACCENT.base}33` }}>{text}</div>
    </div>
  )
}
