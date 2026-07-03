'use client'
/**
 * ConicSectionsChapter (17–18, "Field Lab") — the Conic Sections module.
 *
 * Portal pattern (like FunctionToolkitChapter / IntegersChapter): renders
 * full-screen over the game stage, sets data-band="17-18" to scope the teen
 * theme, and calls finishAndSync itself. Flow:
 *   intro (CaseCard) → explore (ConicExplorer) → lesson → practice → done (MasteryState)
 * Same engine as every chapter: useAdaptive (L1/L2/L3), explanation → practice →
 * adaptive re-explanation. No visible difficulty tier (locked rule).
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
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
import ConicSectionsTeenLesson, { makeRound, ConicWatch, type Round } from '@/features/chapters/lessons/ConicSectionsTeenLesson'

const BAND: AgeBand = '17-18'
const TOTAL_ROUNDS = 8
const FEEDBACK_MS = 1600

type Props = { onComplete: (correct: number, wrong: number) => void; childName: string }

// ── Explore sim: morph a circle into an ellipse by stretching b ─────────────
// Lightweight + exploratory: a slider changes the vertical radius b while the
// horizontal radius a stays fixed. b = a → circle; b ≠ a → ellipse.
function ConicExplorer() {
  const a = 4
  const [b, setB] = useState(4)
  const span = 7
  const upper = (x: number) => {
    const t = 1 - (x / a) ** 2
    return t < 0 ? NaN : b * Math.sqrt(t)
  }
  const lower = (x: number) => {
    const t = 1 - (x / a) ** 2
    return t < 0 ? NaN : -b * Math.sqrt(t)
  }
  const isCircle = Math.abs(b - a) < 0.001
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', maxWidth: 340 }}>
      <div style={{ width: '100%' }}>
        <CoordGrid
          band={BAND}
          xRange={[-span, span]}
          yRange={[-span, span]}
          mode="read"
          curves={[{ kind: 'curve', fn: upper }, { kind: 'curve', fn: lower }]}
          points={[{ x: 0, y: 0 }]}
        />
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="conic-b" style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-numeric)', fontSize: 14, color: 'var(--ink-soft)' }}>
          <span>vertical radius b</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{b}</span>
        </label>
        <input
          id="conic-b"
          type="range"
          min={1}
          max={6}
          step={1}
          value={b}
          onChange={(e) => setB(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
      </div>
      <p style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        x²/{a * a} + y²/{b * b} = 1 — {isCircle ? 'when b equals a it is a circle.' : 'stretch b away from a and the circle becomes an ellipse.'}
      </p>
    </div>
  )
}

// ── The chapter "world": intro → explore → lesson → practice → done ─────────
function ConicSectionsWorld({
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
            title="Slices of a Cone"
            why="Orbits, satellite dishes and headlight mirrors are conic sections — one family of curves from slicing a cone."
            question="How do we identify and read circles, ellipses, parabolas and hyperbolas?"
            startLabel="Slice the cone"
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
        title="Stretch a circle"
        intro="Slide the vertical radius and watch a circle stretch into an ellipse. Get a feel for how the equation's denominators shape the curve, then continue."
        onContinue={() => setPhase('lesson')}
      >
        <ConicExplorer />
      </ExploreStep>
    )
  }

  if (phase === 'lesson') {
    return <ConicSectionsTeenLesson band={BAND} childName={childName} onLessonComplete={() => setPhase('practice')} />
  }

  if (phase === 'done') {
    return (
      <Centered>
        <MasteryState
          band={BAND}
          conceptsConfirmed={['Identifying the conic', 'Circle: center & radius', 'Parabola & ellipse features', 'Hyperbola basics']}
          nextPointer="Next: systems & matrices."
          onPlayAgain={onReplay}
          onExit={onExit}
        />
      </Centered>
    )
  }

  return (
    <ConicSectionsPractice
      childName={childName}
      onExit={onExit}
      onDone={(c, w, mastered) => { onFinish(c, w, mastered); setPhase('done') }}
    />
  )
}

function ConicSectionsPractice({
  childName, onDone, onExit,
}: {
  childName: string; onDone: (c: number, w: number, mastered?: boolean) => void; onExit: () => void
}) {
  const ada = useAdaptive('conicSections')
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
        <TeenTopbar band={BAND} title="Conic Sections" roundIdx={roundIdx} totalRounds={TOTAL_ROUNDS} onBack={() => { stopSpeech(); onExit() }} />
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
            mono={typeof round.answer === 'number'}
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
        <ConicWatch lines={[round.explain]} conic={round.conic} onDone={() => setReady(true)} />
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
export default function ConicSectionsChapter(_props: Props) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body); return () => stopSpeech() }, [])

  const finish = useCallback((c: number, w: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('conicSections', c, w, 'practice', mastered)
  }, [finishAndSync])

  const replay = useCallback(() => { doneRef.current = false; setRunKey((k) => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div data-band={BAND} style={{ position: 'fixed', inset: 0, zIndex: 900, overflowY: 'auto', background: 'var(--bg-page)', color: 'var(--ink)' }}>
      <ConicSectionsWorld
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
