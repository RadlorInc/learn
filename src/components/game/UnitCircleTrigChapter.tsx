'use client'
/**
 * UnitCircleTrigChapter (17–18, "Field Lab") — the Unit Circle & Trig module.
 *
 * Portal pattern (like FunctionToolkitChapter): renders full-screen over the game
 * stage, sets data-band="17-18" to scope the teen theme, and calls finishAndSync
 * itself. Flow:
 *   intro (CaseCard) → explore (UnitCircleExplorer) → lesson → practice → done (MasteryState)
 * Same engine as every chapter: useAdaptive (L1/L2/L3), explanation → practice →
 * adaptive re-explanation. No visible difficulty tier (locked rule).
 */
import { createPortal } from 'react-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChapterSync } from '@/lib/supabase/useChapterSync'
import { useAdaptive } from '@/lib/adaptive'
import { makeDistinct } from '@/lib/questionVariety'
import { speak, speakAfterCurrent, unlockSpeech, stopSpeech } from '@/lib/useMiloSpeaker'
import type { AgeBand } from '@/components/teen/types'
import CaseCard from '@/components/teen/CaseCard'
import TeenTopbar from '@/components/teen/TeenTopbar'
import ChoiceGrid from '@/components/teen/ChoiceGrid'
import StreakMarker from '@/components/teen/StreakMarker'
import MiloMark from '@/components/teen/MiloMark'
import MasteryState from '@/components/teen/MasteryState'
import ExploreStep from '@/components/teen/ExploreStep'
import UnitCircleTrigTeenLesson, { makeRound, UnitCircleWatch, type Round } from '@/components/lessons/UnitCircleTrigTeenLesson'

const BAND: AgeBand = '17-18'
const TOTAL_ROUNDS = 8
const FEEDBACK_MS = 1600

type Props = { onComplete: (correct: number, wrong: number) => void; childName: string }

// ── Bespoke inline unit-circle Explore sim ─────────────────────────────────
// Slider-driven angle; shows the point (cos θ, sin θ), θ in degrees and radians.
function UnitCircleExplorer() {
  const [deg, setDeg] = useState(45)
  const R = 100
  const cx = 130
  const cy = 130
  const rad = (deg * Math.PI) / 180
  const px = cx + R * Math.cos(rad)
  const py = cy - R * Math.sin(rad)
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const f2 = (n: number) => (Math.abs(n) < 0.005 ? '0.00' : n.toFixed(2))
  const piMul = deg / 180
  const radLabel = piMul === 0 ? '0' : `${piMul.toFixed(2)}π`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 380 }}>
      <svg viewBox="0 0 260 260" role="img" aria-label={`Unit circle, angle ${deg} degrees`}
        style={{ display: 'block', width: '100%', height: 'auto', border: '1px solid var(--outline)', borderRadius: 8, background: 'var(--paper)' }}>
        {/* axes */}
        <line x1={cx - R - 16} y1={cy} x2={cx + R + 16} y2={cy} stroke="var(--outline)" strokeWidth={1} />
        <line x1={cx} y1={cy - R - 16} x2={cx} y2={cy + R + 16} stroke="var(--outline)" strokeWidth={1} />
        {/* unit circle */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--ink-soft)" strokeWidth={1.5} />
        {/* cos / sin projections */}
        <line x1={px} y1={py} x2={px} y2={cy} stroke="var(--ink-muted)" strokeWidth={1} strokeDasharray="3 3" />
        <line x1={px} y1={py} x2={cx} y2={py} stroke="var(--ink-muted)" strokeWidth={1} strokeDasharray="3 3" />
        {/* radius */}
        <line x1={cx} y1={cy} x2={px} y2={py} stroke="var(--accent)" strokeWidth={2.5} />
        <circle cx={px} cy={py} r={5} fill="var(--accent)" />
        <text x={cx + R + 6} y={cy - 6} style={{ fontFamily: 'var(--font-numeric)', fontSize: 11, fill: 'var(--ink-muted)' }}>x</text>
        <text x={cx + 6} y={cy - R - 6} style={{ fontFamily: 'var(--font-numeric)', fontSize: 11, fill: 'var(--ink-muted)' }}>y</text>
      </svg>

      {/* live readout */}
      <div style={{ display: 'flex', width: '100%', gap: 8, padding: '4px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-muted)' }}>angle</span>
          <span style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>{deg}° · {radLabel}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-muted)' }}>(cos θ, sin θ)</span>
          <span style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>({f2(cos)}, {f2(sin)})</span>
        </div>
      </div>

      {/* slider */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', fontFamily: 'var(--font-body)' }}>
        <span style={{ width: 56, fontSize: 14, color: 'var(--ink-soft)' }}>angle θ</span>
        <input type="range" min={0} max={360} step={5} value={deg} onChange={(e) => setDeg(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }} aria-label="angle θ" />
        <span style={{ width: 48, textAlign: 'right', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>{deg}°</span>
      </label>

      <p style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        Spin θ around and watch the point trace the circle: its
        {' '}<strong style={{ color: 'var(--ink)' }}>x-coordinate is cos θ</strong> and its
        {' '}<strong style={{ color: 'var(--ink)' }}>y-coordinate is sin θ</strong>. Both live between −1 and 1.
      </p>
    </div>
  )
}

// ── The chapter "world": intro → explore → lesson → practice → done ─────────
function UnitCircleTrigWorld({
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
            title="Round and Round"
            why="Anything that cycles — tides, sound, rotation, orbits — is read off the unit circle, where angle becomes coordinate."
            question="How do angles map to sine and cosine on the unit circle?"
            startLabel="Spin the circle"
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
        title="Spin the circle"
        intro="Drag the angle around the unit circle and watch the point's coordinates — cosine across, sine up — change with it. Get a feel for it, then continue."
        onContinue={() => setPhase('lesson')}
      >
        <UnitCircleExplorer />
      </ExploreStep>
    )
  }

  if (phase === 'lesson') {
    return <UnitCircleTrigTeenLesson band={BAND} childName={childName} onLessonComplete={() => setPhase('practice')} />
  }

  if (phase === 'done') {
    return (
      <Centered>
        <MasteryState
          band={BAND}
          conceptsConfirmed={['Degrees ↔ radians', 'Sine & cosine as coordinates', 'Special angles', 'Signs by quadrant']}
          nextPointer="Next: trig graphs & identities."
          onPlayAgain={onReplay}
          onExit={onExit}
        />
      </Centered>
    )
  }

  return (
    <UnitCircleTrigPractice
      childName={childName}
      onExit={onExit}
      onDone={(c, w, mastered) => { onFinish(c, w, mastered); setPhase('done') }}
    />
  )
}

function UnitCircleTrigPractice({
  childName, onDone, onExit,
}: {
  childName: string; onDone: (c: number, w: number, mastered?: boolean) => void; onExit: () => void
}) {
  const ada = useAdaptive('unitCircleTrig')
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
        <TeenTopbar band={BAND} title="Unit Circle & Trig" roundIdx={roundIdx} totalRounds={TOTAL_ROUNDS} onBack={() => { stopSpeech(); onExit() }} />
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
// missed round's concept on a unit circle, then continues (no penalty, no red).
function ReteachPanel({ round, onContinue }: { round: Round; onContinue: () => void }) {
  const [ready, setReady] = useState(false)
  if (typeof document === 'undefined') return null
  return createPortal(
    <div data-band={BAND} role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 950, background: 'color-mix(in srgb, var(--ink) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--outline)', borderRadius: 16, padding: '22px 22px 20px', maxWidth: 520, width: '100%', boxShadow: '0 6px 28px color-mix(in srgb, var(--ink) 18%, transparent)' }}>
        <p style={{ margin: '0 0 14px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Let’s look at this one together.</p>
        <UnitCircleWatch lines={[round.explain]} angleDeg={round.angleDeg} onDone={() => setReady(true)} />
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
export default function UnitCircleTrigChapter(_props: Props) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => { setBody(document.body); return () => stopSpeech() }, [])

  const finish = useCallback((c: number, w: number, mastered?: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync('unitCircleTrig', c, w, 'practice', mastered)
  }, [finishAndSync])

  const replay = useCallback(() => { doneRef.current = false; setRunKey((k) => k + 1) }, [])

  if (!body) return null
  return createPortal(
    <div data-band={BAND} style={{ position: 'fixed', inset: 0, zIndex: 900, overflowY: 'auto', background: 'var(--bg-page)', color: 'var(--ink)' }}>
      <UnitCircleTrigWorld
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
