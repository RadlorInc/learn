'use client'
/**
 * Chapter (9–11) — FACTORS & MULTIPLES (skill `factorsMultiples`), answered with the CAMERA or by TAP.
 *
 * THE VERB IS "SPLIT IT", AND THE CHILD'S FINGERS ARE THE DIVISOR. Milo puts n units on the
 * bench; the child holds up a number of rows to a laptop webcam or a tablet's front camera; the
 * bench deals them and either fills flush or leaves a gap. All four readings of the skill are
 * that one physical act — see story/factors.ts for the maths, the ladder and the grader, which
 * live outside React because a webcam cannot be driven by a gate.
 *
 * ⚠️ ONE INSTRUMENT, TWO INPUTS, ONE GRADER. The camera does not answer the question — it sets the
 * same number a tap sets, and both land in `commit(fingers)`, which is the only grading sink. So the
 * two paths cannot drift into grading differently, and the pure module's sweep covers both at once:
 * `padChoices()` is derived from `MAX_FINGERS`, so the pad offers exactly what two hands can hold.
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
 * ⚠️ THE TAP PATH IS NOT A DEGRADED MODE, AND IT COMMITS DIFFERENTLY ON PURPOSE. A tap is CONSUMED;
 * a hand is still up when the next question opens. So the camera needs two guards a tap does not —
 * hold still for DWELL_MS, and ignore the reading held over from the last round — and pushing a tap
 * through them would silently swallow it, since a tap matching the held-over reading reads as
 * held-over. A tap therefore calls `commit` directly. `useDwell` is still called unconditionally,
 * merely not live: branching above a hook changes the hook count and tears the chapter into the
 * error boundary, which this repo has shipped once already.
 *
 * ⚠️ THE CAMERA IS THE BACKDROP, NOT A THUMBNAIL, and the honest reason is diagnostic rather than
 * pedagogical — worth writing down, because the usual argument for full screen does not apply here.
 * The Fundraiser goes full screen because its hand is a CURSOR and the child would otherwise glance
 * between their hand over there and the board over here; this chapter's answer is a scalar and the
 * hand's position means nothing at all. What full screen buys is one thing only: the numbered chips
 * over the child's own fingertips become BIG ENOUGH TO READ, so "why did my 5 count as 4" has an
 * answer on screen — the chips say WHICH fingers were counted. `drawCount` draws them at R = 18
 * with a 46px offset into a short-frame panel **76px wide**, which is cramped past reading; they
 * are clamped into the canvas rather than clipped away, but nobody could use them.
 * ⚠️ AND THE OTHER HALF OF THAT ARGUMENT IS FALSE, so it is written down rather than repeated:
 * full screen shows LESS of the camera frame, not more. `openCamera` asks for 4:3 and cover-cropping
 * it into a 16:9 viewport hides 12.5% of the frame at each end (16.7% at 640×320), where the 4:3
 * corner panel showed all of it. So for "is my hand fully in frame" the corner panel was better,
 * and a finger detected in the cropped band is still COUNTED while its chip is off screen.
 *
 * ⚠️ AND THE DAILY ANCHOR IS SETTING OUT A HALL FOR AN EXAM (see `ANCHOR` in factors.ts). It rides
 * the briefing card and the explore beat and NOTHING ELSE — the world stays a bench of parts,
 * because a desk is a skin over a unit rather than the same object, and three things break if it is
 * more than a simile. The reasoning is in factors.ts next to the string.
 *
 * ⚠️ AND THE TAP PATH NEVER STARTS THE CAMERA. `start()` is not called, so there is no permission
 * prompt and MediaPipe's ~6 MB of WASM + model is never fetched — this app is local-first, and a
 * child who is not using the camera should not pay for it. The pick is remembered per DEVICE
 * (`infra/storage/handInput`), because "no camera" is a household answer, not a per-learner one.
 *
 * ⚠️ VERIFICATION. Everything above the pure module is EYEBALL-ONLY — no gate can feed a webcam.
 * The dev-only `window.__miloFingers(n, hands)` (stripped from production, like FloorPlot's
 * `__miloPace`) exists so the whole chapter can still be driven end to end headlessly.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import {
  PT, ACCENTS, PT_CSS, LabBackdrop, BackChip, Brackets, PromptCard, PtMilo, IntroCard,
} from './preteen/kit'
import { useViewport } from '@/shared/hooks/useViewport'
import FitBox from './FitBox'
import {
  useHandInput, useHand, HandProvider, useDwell, CamView, CamGate, DwellRing,
  type HandSkin, type InputKind as HandInputKind,
} from '@/infra/ar/HandInput'
import {
  makeRound, missFor, nudgeFor, explainBeats, deal, padChoices, instructionFor, sayFor,
  verdictFor, benchBand, benchLabel, ACTION_ROW, ANCHOR, DEMO, GUIDED, type FlRound, type Tier,
} from './factors'

const ACCENT = ACCENTS.indigo

/** This chapter's colours for the shared camera surface (ring, self-view, gate). */
const SKIN: HandSkin = {
  accent: ACCENT.base, accentSoft: `${ACCENT.base}66`, ink: PT.ink, muted: PT.inkMute,
  panel: PT.panel, line: PT.lineStrong, onAccent: '#06121f', font: PT.sans, mono: PT.mono,
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
function Bench({ n, rows, verdict, verdictOk, word = 'row', per = 0, solid }: { n: number; rows: number; verdict?: string | null; verdictOk?: boolean; word?: string; per?: number; solid?: boolean }) {
  const { perRow, stranded } = deal(n, rows)
  const size = n > 40 ? 18 : n > 24 ? 22 : n > 14 ? 28 : 34
  const gap = Math.round(size * 0.26)
  // ⚠️ A PAIR IS TWO AND A CRATE HOLDS `per`. The header echoes what the CHILD asked for, so on a
  // pair test it said "4 pairs" over four rows of THREE, and on a counting round it would say
  // "5 crates" over rows of seven — the readout naming an arrangement the bench is not showing.
  // The reading's own noun is used only when the deal really produced it; otherwise they are rows.
  const label = per && perRow !== per ? 'row' : word
  return (
    /* ⚠️ OPAQUE OVER THE CAMERA, translucent over the backdrop. The scrim leaves ~⅔ of whatever
       room the child is sitting in, and this panel passes ~28% of that through — so against a
       window the unit-vs-panel contrast falls from ~4.9:1 to ~2.3:1 on the one surface the child
       has to COUNT. `backdropFilter` does not help: blur preserves mean luminance. */
    <div style={{ position: 'relative', background: solid ? PT.panelSolid : PT.panel, backdropFilter: 'blur(10px)', border: `1px solid ${ACCENT.base}55`, borderRadius: 18, minWidth: 300, boxShadow: `0 0 30px ${ACCENT.base}26, 0 18px 40px rgba(0,0,0,0.5)`, overflow: 'hidden' }}>
      <Brackets color={ACCENT.base} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: PT.panelSoft, borderBottom: `1px solid ${PT.line}` }}>
        <span style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 1.5, color: PT.inkMute, textTransform: 'uppercase' }}>
          {rows > 0 ? `${rows} ${label}${rows === 1 ? '' : 's'}` : `bench · ${n}`}
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
 * share of the height — a percentage is a guess at a gap, and measured at 640×320 the percentage
 * version put its top 5px inside the prompt card. The arithmetic lives in `factors.ts` so a sweep
 * can drive the same numbers this layout does; see `benchBand`.
 */
function Stage({ children, short = false, promptBottom = 0, extraBot = 0 }: { children: React.ReactNode; short?: boolean; promptBottom?: number; extraBot?: number }) {
  const { w: vw, h: vh } = useViewport()
  const { top, band } = benchBand(vh, short, promptBottom, extraBot)
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: top + band / 2, transform: 'translateY(-50%)', zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 3vw' }}>
      <FitBox availW={vw * 0.86} availH={band} max={2.2} min={0.3}>{children}</FitBox>
    </div>
  )
}

/**
 * ⚠️ Milo stands bottom-left (`PtMilo left={9}`) and the bottom band is where the answer surface now
 * lives, so on a short frame he sat squarely over the ✊ — which is the PRIME answer, i.e. the one
 * button a child has to be able to find. The tap still landed (he is `pointerEvents: none`), so no
 * gate and no click-through check could see it; only measuring his box against the pad's did.
 * He gets a lane, and the pad centres in what is left.
 */
const MILO_LANE = (short: boolean) => (short ? 104 : 12)

// ─── the hand readout ──────────────────────────────────────────────────────────────────
/**
 * Says only how many fingers were READ, and how far the commit has armed. It must never say
 * whether that number is right — that is the hot/cold rule, and here it would also hand over
 * the whole answer, since the child could just sweep counts until the readout went green.
 */
/**
 * The TAP path's answer surface — the same span two hands can hold, `0` drawn as the fist it means.
 *
 * ⚠️ A TAP COMMITS ON THE SPOT, with no dwell and no arming guard. A tap is CONSUMED where a hand is
 * still up when the next question opens, so the two guards the camera needs (hold still; ignore the
 * reading held over from the last round) have nothing to protect against here — and routing a tap
 * through them would silently swallow it, because a tap whose value matched the held-over reading
 * would be read as held-over.
 *
 * ⚠️ AND NOTHING HERE MAY CHANGE COLOUR BEFORE THE COMMIT. Marking a choice as picked, or lighting it
 * on hover, is the hot/cold rule broken — the child could sweep the pad watching for a reaction. The
 * bench answers, once, after.
 */
function TapPad({ onPick, short, disabled }: { onPick: (n: number) => void; short?: boolean; disabled?: boolean }) {
  // 44px is the tap floor and does not move; the GAP is what gives, so that eleven buttons still
  // make one row inside the width Milo leaves (see MILO_LANE). A second row would grow up into the
  // bench, and the bottom band is a reserved constant rather than a measured one.
  const size = short ? 44 : 52
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: short ? 4 : 7, pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.45 : 1, maxWidth: 'min(96vw, 680px)' }}>
      {padChoices().map(n => (
        <button key={n} onClick={() => onPick(n)} aria-label={n === 0 ? 'Nothing fits' : `${n} rows`}
          style={{ width: size, height: size, borderRadius: 12, cursor: 'pointer', fontFamily: PT.mono, fontWeight: 800,
            fontSize: short ? 17 : 20, color: PT.ink, background: PT.panel, border: `1px solid ${ACCENT.base}66` }}>
          {n === 0 ? '✊' : n}
        </button>
      ))}
    </div>
  )
}

function HandHud({ progress, note, short, action, onPick, disabled }: { progress: number; note: string | null; short?: boolean; action?: React.ReactNode; onPick?: (n: number) => void; disabled?: boolean }) {
  const { read, input } = useHand()
  const size = short ? 60 : 78
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: short ? 8 : '3%', zIndex: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none', paddingLeft: MILO_LANE(!!short), paddingRight: 12 }}>
      {note && (
        <div style={{ fontFamily: PT.sans, fontWeight: 700, fontSize: short ? 13 : 15, color: PT.ink, background: input === 'hand' ? PT.panelSolid : PT.panel, border: `1px solid ${ACCENT.base}66`, borderRadius: 999, padding: short ? '5px 14px' : '7px 18px', textAlign: 'center', maxWidth: 'min(92vw, 640px)' }}>{note}</div>
      )}
      {/* ⚠️ The action sits on its OWN line, above the answer surface, and never beside it. Sharing a
          flex row with the pad ate enough width at 640×320 to wrap 11 buttons onto two rows, which
          landed 8px off the bottom edge and only cleared the bench by luck — the bottom band is a
          reserved constant, so the pad's height has to be predictable rather than merely lucky. */}
      {/* ⚠️ …EXCEPT beside the dwell ring, which is one 60px circle with a screen's worth of room
          next to it. Only the PAD needs the whole width, and only the pad pays for a second row. */}
      {action && input === 'tap' && <div style={{ display: 'flex', justifyContent: 'center' }}>{action}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: short ? 12 : 18 }}>
      {input === 'tap' && onPick
        ? <TapPad onPick={onPick} short={short} disabled={disabled} />
        : (<>
          <DwellRing progress={progress} size={size} skin={read.hands ? SKIN : { ...SKIN, ink: PT.inkMute }}>
            {read.hands === 0 ? '–' : read.count === 0 ? '✊' : read.count}
          </DwellRing>
          {action}
        </>)}
      </div>
    </div>
  )
}

// ─── play ──────────────────────────────────────────────────────────────────────────────
interface Reveal { rows: number; verdict: string; ok: boolean }

const FlPlay: React.FC<{ data: FlRound; mode: 'guided' | 'practice'; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
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

    // A count that is not a real attempt redirects instead of scoring — the same call the
    // colouring chapter makes for a tap that lands on the ink.
    const nudge = nudgeFor(data, fingers, input)
    if (nudge) { setNote(nudge); speak(nudge); return }

    // ⚠️ The verdict string lives in the pure module, so the gate can drive the same words the
    // bench prints. It used to be built here, where nothing could see it saying "0 left over"
    // over an arrangement with no gap in it.
    const { text: verdict, ok } = verdictFor(data, fingers)
    // ⚠️ A redirect belongs to the attempt that earned it. Left up, a nudge from the previous try
    // sat under a green verdict telling the child their answer was not a split — the words
    // contradicting the picture, on the beat they are reading.
    setNote(null)
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
  }, [data, mode, onComplete, reveal, input])

  // ⚠️ Called UNCONDITIONALLY — branching above it would change the hook count between input modes
  // and tear the chapter into the error boundary, which this repo has shipped once already. On the
  // tap path it is simply never live, so it costs a dead timer and nothing else.
  // No hand in frame is not an answer — a fist (0 fingers, 1 hand) is.
  const progress = useDwell(
    { value: read.count, key: `${read.count}/${read.hands}`, ready: read.hands > 0 },
    commit, input === 'hand' && !reveal && !done.current,
  )

  return (
    <>
      <Stage short={short} promptBottom={promptBottom}>
        <Bench n={data.n} rows={reveal?.rows ?? 0} {...benchLabel(data)}
          solid={input === 'hand'} verdict={reveal?.verdict ?? null} verdictOk={reveal?.ok} />
      </Stage>
      <PromptCard tag={data.tag} text={data.prompt} instruction={reveal ? undefined : instructionFor(data, input)} accent={ACCENT} short={short} solid={input === 'hand'} onMeasure={setPromptBottom} />
      <HandHud progress={reveal ? 0 : progress} short={short} onPick={commit} disabled={!!reveal || done.current}
        note={note ?? (mode === 'guided' && !reveal
          ? (input === 'tap' ? 'Tap how many rows fit.' : 'Hold your hand still to lock it in.')
          : null)} />
    </>
  )
}

// ─── demo / re-teach ───────────────────────────────────────────────────────────────────
const FlExplain: React.FC<{ data: FlRound; onDone: () => void }> = ({ data, onDone }) => {
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
  const { stranded } = deal(data.n, b.rows)
  return (
    <>
      <Stage short={short} promptBottom={promptBottom}>
        <Bench n={data.n} rows={b.rows} {...benchLabel(data)} solid={input === 'hand'}
          verdict={i === beats.length - 1 ? (b.leftover || stranded > 0 ? 'gap' : 'no gaps') : null}
          verdictOk={!b.leftover && stranded === 0} />
      </Stage>
      <PromptCard tag="Watch" text={b.say} accent={ACCENT} short={short} solid={input === 'hand'} onMeasure={setPromptBottom} />
    </>
  )
}

// ─── explore: the bench reflows LIVE, because nothing is being asked ───────────────────
function ExploreBench({ onContinue, short }: { onContinue: () => void; short?: boolean }) {
  const { read, input } = useHand()
  const [n] = useState(12)
  const [tapRows, setTapRows] = useState(0)
  const [promptBottom, setPromptBottom] = useState(0)
  // Nothing is being ASKED here, so the bench may follow the input live on either path — that is the
  // teaching-versus-measuring line, and it is why the pad sets a row count instead of committing.
  const rows = input === 'tap' ? tapRows : (read.hands ? read.count : 0)
  const { stranded } = deal(n, rows)
  return (
    <>
      {/* ⚠️ This beat is the only one with a button stacked above the readout — see ACTION_ROW. */}
      <Stage short={short} promptBottom={promptBottom} extraBot={input === 'tap' ? ACTION_ROW(!!short) : 0}>
        <Bench n={n} rows={rows} solid={input === 'hand'}
          verdict={rows >= 2 ? (stranded === 0 ? 'no gaps' : `${stranded} left over`) : null}
          verdictOk={stranded === 0} />
      </Stage>
      {/* ⚠️ The anchor rides here as a SIMILE and only here — this beat teaches, nothing is scored,
          and the desks stay in the "just like" clause while the bench keeps its own parts. A scored
          round naming desks over a picture of neon units is this repo's oldest copy fault. */}
      <PromptCard tag="Try it" accent={ACCENT} short={short} solid={input === 'hand'}
        /* ⚠️ ONE CLAUSE. The first draft spent a whole sentence on the hall, which pushed this card
           from two lines to three at 640×320 and drove the bench 15px into the button below it —
           the anchor is already stated in full on the briefing card, so here it is a reminder. */
        text={input === 'tap'
          ? `Rows, like desks in a hall. Tap a number and the bench splits ${n} — watch which counts fill up with no gaps.`
          : `Rows, like desks in a hall. Hold up some fingers and the bench splits ${n} — watch which counts fill up with no gaps.`}
        onMeasure={setPromptBottom} />
      <HandHud progress={0} note={null} short={short} onPick={setTapRows} action={
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
function makeBeat(inputRef: React.RefObject<HandInputKind>): Beat<FlRound> {
  return {
    skillId: 'factorsMultiples', rounds: 10,
    ownsFeedback: true,
    make: (d, _round, asked) => makeRound((d || 1) as Tier, asked ?? []),
    sig: d => `${d.qType}|${d.n}|${d.base}`,
    // A prime is the one reading the child can otherwise finish without ever meeting: it lives at
    // L2+ and mastery can end the run in ~6 rounds. See Beat.coverage.
    coverage: { of: d => d.qType, all: ['evenOdd', 'multiple', 'factor', 'prime'] },
    prompt: () => '',   // the chapter draws its own richer prompt card
    say: d => sayFor(d, inputRef.current),
    Play: ({ data, onSubmit }) => <FlPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <FlExplain data={data} onDone={onDone} />,
  }
}

// ─── orchestrator ──────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'explore' | 'demo' | 'guided' | 'practice'

export default function FactorLab({ onFinish, onExit }: { onFinish?: (correct: number, wrong: number, mastered?: boolean) => void; onExit?: () => void }) {
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
  /** The camera is the BACKDROP once the child is in the lab — see `CamView full`. */
  const fullCam = inLab && onCam

  return (
    <HandProvider value={hand}>
      {/* ⚠️ THE ROOT CARRIES A COLOUR OF ITS OWN, and that is not decoration. `fullCam` does not
          consult `camReady` — it cannot, because the <video> must be mounted before `openCamera`
          can use it — so between entering the lab and the camera running there is a window with the
          backdrop already dropped and the video still at `opacity: 0`. Without this the whole
          chapter rendered on the app's cream page background, with the neon HUD and the "Milo needs
          to see your hands" card floating on it. That window is not an edge case: it is EVERY
          camera-path entry, plus every denial and every failure. */}
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: PT.bg0 }}>
        <style>{PT_CSS}</style>
        {/* ⚠️ NOT PAINTED UNDER A FULL-SCREEN CAMERA. It would be invisible behind an opaque video
            and still animate fifteen twinkling stars plus an 86vw element under `blur(90px)`,
            forever, on a tablet already running MediaPipe. The intro still gets it. */}
        {!fullCam && <LabBackdrop accent={ACCENT} />}
        <BackChip onExit={exit} />

        {/* Both doors are offered every time, and the device's last pick decides which is the big
            button — never which is the ONLY one. A parent who says no to the camera on Monday must
            not have to say it again, and a child who wants it back must not have to hunt. */}
        {phase === 'intro' && (
          <IntroCard title="Number Lab" accent={ACCENT} short={short}
            cta={onCam ? 'Turn on the camera' : 'Start tapping'}
            /* ⚠️ MEASURED, because the first draft's comment claimed these were SHORTER than the
               bodies they replace and they were 25 characters LONGER — the comment being the one
               thing that would have stopped the next reader checking. They are 206 / 191 against
               the old 208 / 196. `IntroCard` has no maxHeight and no scroll, the column centres,
               and a 200-character body already reaches 307px inside a 320px frame — so anything
               longer goes into the Start button, which this repo has shipped once. Re-count when
               you touch either string. */
            body={onCam
              ? `${ANCHOR} Milo splits numbers the same way — YOUR HAND is the splitter. Hold up a number of rows; no gaps means a factor, a fist means none fit.`
              : `${ANCHOR} Milo splits numbers the same way, and YOU pick the rows. Tap a number; no gaps means a factor, the fist means none fit.`}
            onStart={() => { unlockSpeech(); setPhase('explore'); if (onCam) start() }}
            alt={onCam
              ? { label: 'Use taps instead', onPick: () => { unlockSpeech(); useTaps(); setPhase('explore') } }
              : { label: 'Use the camera instead', onPick: () => { unlockSpeech(); useCamera(); setPhase('explore') } }} />
        )}

        {/* ⚠️ FULL SCREEN, WITH THE MARKERS ON. The corner thumbnail was 76px on a short frame —
            smaller than the numbered chips `drawCount` draws, so they were clipped away and the
            chapter's only per-finger feedback was already dead there. This chapter has no cursor
            to compete with (its answer is a scalar, and `reads: 'count'` never populates a
            position), so the chips over the child's own fingertips are the whole of it: they say
            not just how many were counted but WHICH, i.e. why a held-up 5 read as 4. */}
        {fullCam && (
          <CamView videoRef={videoRef} canvasRef={canvasRef} full markers w={0}
            skin={SKIN} hidden={!camReady} />
        )}
        {inLab && onCam && !camReady && (
          <CamGate status={status} error={error} skin={SKIN} onRetry={start} onTaps={useTaps} onExit={exit}
            denied="Milo can split the numbers with your fingers, or you can tap them instead — both work." />
        )}

        {inLab && ready && (<>
          {phase === 'explore' && <ExploreBench short={short} onContinue={() => setPhase('demo')} />}

          {phase === 'demo' && (<>
            {Banner(`Watch Milo · ${demoIdx + 1}/${DEMO.length}`, short, fullCam)}
            <FlExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
              onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
          </>)}

          {phase === 'guided' && (<>
            {Banner(onCam ? 'Your turn · hold up the rows' : 'Your turn · tap the rows', short, fullCam)}
            <FlPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} />
          </>)}

          {phase === 'practice' && (
            <div style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
              <SkillBeat beat={beat}
                onComplete={tally} />
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
