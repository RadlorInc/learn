'use client'
/**
 * RationalFunctionsChapter (17–18, "Field Lab") — the Rational Functions module.
 *
 * Portal pattern (like FunctionToolkitChapter): renders full-screen over the game
 * stage, sets data-band="17-18" to scope the teen theme, and calls finishAndSync
 * itself. Flow:
 *   intro (CaseCard) → explore (RationalExplorer) → lesson → practice → done (MasteryState)
 * Same engine as every chapter: useAdaptive (L1/L2/L3), explanation → practice →
 * adaptive re-explanation. No visible difficulty tier (locked rule).
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import { useAdaptive } from '@/core/adaptive'
import { makeDistinct } from '@/core/questionVariety'
import { speak, speakAfterCurrent, unlockSpeech, stopSpeech } from '@/infra/useMiloSpeaker'
import type { AgeBand } from '@/features/chapters/teen/types'
import CaseCard from '@/features/chapters/teen/CaseCard'
import TeenTopbar from '@/features/chapters/teen/TeenTopbar'
import ChoiceGrid from '@/features/chapters/teen/ChoiceGrid'
import StreakMarker from '@/features/chapters/teen/StreakMarker'
import MiloMark from '@/features/chapters/teen/MiloMark'
import MasteryState from '@/features/chapters/teen/MasteryState'
import ExploreStep from '@/features/chapters/teen/ExploreStep'
import CoordGrid from '@/features/chapters/teen/CoordGrid'
import RationalFunctionsTeenLesson, { makeRound, RationalWatch, type Round } from '@/features/chapters/lessons/RationalFunctionsTeenLesson'

const BAND: AgeBand = '17-18'
const TOTAL_ROUNDS = 8
const FEEDBACK_MS = 1600

type Props = { onComplete: (correct: number, wrong: number) => void; childName: string }

// ── Explore sim: plot y = 1/(x−a), slide `a`, draw the vertical asymptote ────
// Lightweight + inline (standard imports only). Exploratory — no grading.
function RationalExplorer({ band }: { band: AgeBand }) {
  const [a, setA] = useState(2)
  const RANGE = 6
  const fn = useMemo(() => (x: number) => 1 / (x - a), [a])

  // CoordGrid's SVG geometry (must match CoordGrid.tsx so the overlay lines up).
  const VW = 480, PAD = 28, PLOT = VW - PAD * 2
  const span = RANGE * 2
  const ax = PAD + ((a - -RANGE) / span) * PLOT

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 380 }}>
      <div style={{ position: 'relative', width: '100%' }}>
        <CoordGrid band={band} xRange={[-RANGE, RANGE]} yRange={[-RANGE, RANGE]} mode="read" curves={[{ kind: 'curve', fn }]} />
        <svg
          viewBox={`0 0 ${VW} ${VW}`}
          width="100%"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, display: 'block', pointerEvents: 'none', overflow: 'visible' }}
        >
          <line x1={ax} y1={PAD} x2={ax} y2={VW - PAD} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4" opacity={0.85} />
        </svg>
      </div>

      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 18, fontWeight: 600, color: 'var(--accent)', textAlign: 'center', lineHeight: 1.4 }}>
        f(x) = 1 / (x {a >= 0 ? `− ${a}` : `+ ${Math.abs(a)}`}) &nbsp;·&nbsp; asymptote at x = {a < 0 ? `−${Math.abs(a)}` : a}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', fontFamily: 'var(--font-body)' }}>
        <span style={{ width: 80, fontSize: 14, color: 'var(--ink-soft)' }}>shift a</span>
        <input
          type="range" min={-5} max={5} step={1} value={a}
          onChange={(e) => setA(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
          aria-label="shift a"
        />
        <span style={{ width: 40, textAlign: 'right', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
          {a < 0 ? `−${Math.abs(a)}` : a}
        </span>
      </label>

      <p style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        Slide <strong style={{ color: 'var(--ink)' }}>a</strong> and watch the curve break at the dashed <strong style={{ color: 'var(--ink)' }}>vertical asymptote</strong> x = a — the one input the function can’t take.
      </p>
    </div>
  )
}

// ── The chapter "world": intro → explore → lesson → practice → done ─────────
function RationalFunctionsWorld({
  childName, onFinish, onExit, onReplay,
}: {
  childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void; onReplay: () => void
}) {
  const [phase, setPhase] = useState<'intro' | 'explore' | 'lesson' | 'practice' | 'done'>('intro')

  if (phase === 'intro') {
    return (
      <Centered>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <CaseCard
            band={BAND}
            title="Near the Edge"
            why="Concentrations, rates and lens equations blow up near forbidden inputs — rational functions map those edges."
            question="Where do rational functions break, flatten, or leave holes?"
            startLabel="Probe the edges"
            onStart={() => { unlockSpeech(); setPhase('explore') }}
          />
        </div>
      </Centered>
    )
  }

  if (phase === 'explore') {
    return (
      <ExploreStep
        band={BAND}
        title="Break at the edge"
        intro="Plot y = 1/(x − a) and slide a. Watch the curve tear apart at the dashed vertical asymptote — the single input the function forbids. Get a feel for it, then continue."
        onContinue={() => setPhase('lesson')}
      >
        <RationalExplorer band={BAND} />
      </ExploreStep>
    )
  }

  if (phase === 'lesson') {
    return <RationalFunctionsTeenLesson band={BAND} childName={childName} onLessonComplete={() => setPhase('practice')} />
  }

  if (phase === 'done') {
    return (
      <Centered>
        <MasteryState
          band={BAND}
          conceptsConfirmed={['Domain restrictions', 'Vertical asymptotes', 'Horizontal asymptotes', 'Holes']}
          nextPointer="Next: exponential & log functions."
          onPlayAgain={onReplay}
          onExit={onExit}
        />
      </Centered>
    )
  }

  return (
    <RationalFunctionsPractice
      childName={childName}
      onExit={onExit}
      onDone={(c, w, mastered) => { onFinish(c, w, mastered); setPhase('done') }}
    />
  )
}

function RationalFunctionsPractice({
  childName, onDone, onExit,
}: {
  childName: string; onDone: (c: number, w: number, mastered?: boolean) => void; onExit: () => void
}) {
  const ada = useAdaptive('rationalFunctions')
  const seen = useRef<Set<string>>(new Set())   // question signatures asked this session
  const [roundIdx, setRoundIdx] = useState(0)
  const [round, setRound] = useState<Round>(() => makeDistinct(() => makeRound(1), seen.current))
  const [selected, setSelected] = useState<string | number | null>(null)
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [wrongRun, setWrongRun] = useState(0)
  const [reteach, setReteach] = useState<Round | null>(null)
  const greeted = useRef(false)

  // Load a fresh, non-repeating round whenever the index (or difficulty) changes.
  useEffect(() => {
    const r = makeDistinct(() => makeRound(ada.difficulty), seen.current)
    setRound(r); setSelected(null); setStatus('idle')
    const lead = greeted.current ? '' : `Hi ${childName}. `
    greeted.current = true
    speakAfterCurrent(`${lead}${r.say}`)
  }, [roundIdx, ada.difficulty]) // eslint-disable-line react-hooks/exhaustive-deps

  function advance(ok: boolean, run: number, r: Round, mastered: boolean) {
    if (!ok && run >= 3) { setReteach(r); return }
    const c = ok ? correct + 1 : correct
    const w = ok ? wrong : wrong + 1
    // Demonstrated mastery → finish early with full stars, skip the repetitive tail.
    if (mastered) { onDone(c, w, true); return }
    const next = roundIdx + 1
    if (next >= TOTAL_ROUNDS) onDone(c, w)
    else setRoundIdx(next)
  }

  function pick(v: string | number) {
    if (selected !== null) return
    const ok = v === round.answer
    setSelected(v); setStatus(ok ? 'correct' : 'wrong')
    const res = ada.record(ok)
    const run = ok ? 0 : wrongRun + 1
    setWrongRun(run)
    if (ok) { setCorrect((c) => c + 1); speak(`Correct. ${ada.praise}`) }
    else { setWrong((w) => w + 1); speak(`The answer is ${round.sayAnswer ?? round.answer}. ${ada.encouragement}`) }
    window.setTimeout(() => advance(ok, run, round, res.mastered), FEEDBACK_MS)
  }

  function finishReteach() {
    const r = reteach!
    setReteach(null); setWrongRun(0)
    const next = roundIdx + 1
    if (next >= TOTAL_ROUNDS) onDone(correct, wrong)
    else setRoundIdx(next)
    void r
  }

  return (
    <div className="milo-lesson" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-page)', color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        <TeenTopbar band={BAND} title="Rational Functions" roundIdx={roundIdx} totalRounds={TOTAL_ROUNDS} onBack={() => { stopSpeech(); onExit() }} />
      </div>

      <main style={{ flex: 1, width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '12px 18px 28px', boxSizing: 'border-box' }}>
        <div style={{ alignSelf: 'flex-end' }}><StreakMarker band={BAND} count={ada.streak} /></div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%' }}>
          <MiloMark band={BAND} mood={status === 'idle' ? 'thinking' : 'speaking'} size={36} />
          <div style={{ flex: 1, background: 'var(--paper)', border: '1px solid var(--outline)', borderRadius: 12, padding: '10px 14px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>
            {round.promptText}
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: 420 }}>
          <ChoiceGrid
            band={BAND}
            choices={round.choices}
            selected={selected}
            status={status}
            correctValue={round.answer}
            onPick={pick}
            columns={round.choices.length === 4 ? 2 : round.choices.length}
          />
        </div>

        <button
          type="button"
          onClick={() => speak(round.say)}
          style={{ background: 'transparent', border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--ink-soft)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, padding: '6px 12px', cursor: 'pointer' }}
        >
          ◑ Say it again
        </button>
      </main>

      {reteach && <ReteachPanel round={reteach} onContinue={finishReteach} />}
    </div>
  )
}

// Adaptive re-explanation: shown after a few misses in a row. Re-works the
// missed round's concept, then continues (no penalty, no red).
function ReteachPanel({ round, onContinue }: { round: Round; onContinue: () => void }) {
  const [ready, setReady] = useState(false)
  if (typeof document === 'undefined') return null
  return createPortal(
    <div data-band={BAND} role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 950, background: 'color-mix(in srgb, var(--ink) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--outline)', borderRadius: 16, padding: '22px 22px 20px', maxWidth: 520, width: '100%', boxShadow: '0 6px 28px color-mix(in srgb, var(--ink) 18%, transparent)' }}>
        <p style={{ margin: '0 0 14px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Let’s look at this one together.</p>
        <RationalWatch lines={[round.explain]} curve={round.curve} onDone={() => setReady(true)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button type="button" disabled={!ready} onClick={onContinue} style={{ padding: '10px 20px', borderRadius: 10, background: ready ? 'var(--accent)' : 'var(--bg-2)', border: `1px solid ${ready ? 'var(--accent)' : 'var(--outline)'}`, color: ready ? 'var(--paper)' : 'var(--ink-muted)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, cursor: ready ? 'pointer' : 'default' }}>
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="milo-lesson" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 18px', background: 'var(--bg-page)', color: 'var(--ink)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}>
      {children}
    </div>
  )
}

// ── Portal wrapper (the dispatched chapter component) ───────────────────────
export default function RationalFunctionsChapter(_props: Props) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body); return () => stopSpeech() }, [])

  const finish = useCallback((c: number, w: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('rationalFunctions', c, w, 'practice', mastered)
  }, [finishAndSync])

  const replay = useCallback(() => { doneRef.current = false; setRunKey((k) => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div data-band={BAND} style={{ position: 'fixed', inset: 0, zIndex: 900, overflowY: 'auto', background: 'var(--bg-page)', color: 'var(--ink)' }}>
      <RationalFunctionsWorld
        key={runKey}
        childName={_props.childName}
        onFinish={finish}
        onExit={() => { stopSpeech(); router.push('/menu') }}
        onReplay={replay}
      />
    </div>,
    body,
  )
}
