'use client'
/**
 * GameShell — the generic 12–14 playable-game loop, lifted from ShopRush and
 * made data-driven so each chapter is just a config (palette + task pools +
 * demo + instrument). One continuous scene, NO slides, NO MCQ.
 *
 * Teaching follows "I do → we do → you do":
 *   • I DO  — a step-by-step WALKTHROUGH (config.tutorial): Milo works one
 *     example, the instrument moves in narrated steps (speakSteps-synced), an
 *     animated hand shows the gesture, and the kid can "↺ Watch again".
 *   • WE DO — one GUIDED order (config.guided): the instrument is live, Milo
 *     coaches, it is NOT scored — a soft bridge from watching to doing.
 *   • YOU DO — the scored practice loop below.
 * (Chapters without tutorial/guided fall back to the old one-shot config.Demo.)
 *
 * Foundation is the shared adaptive engine, UNCHANGED:
 *   • invisible tiers L1→L2→L3 via useAdaptive
 *   • promote on a streak, DEMOTE on wrong (makeTask(ada.difficulty))
 *   • RE-EXPLANATION after 3 wrong in a row (Milo narrates task.work in-scene)
 *   • mastery early-exit (top tier + clean streak → finish early, full stars)
 * Math-without-fear: no timer, no red X, no score, no coins.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAdaptive } from '@/core/adaptive'
import { speak, speakAfterCurrent, speakSeq, speakSteps, unlockSpeech, stopSpeech } from '@/infra/useMiloSpeaker'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { getChapterLevel, setChapterLevel } from '@/infra/storage/chapterLevel'
import type { ChapterType } from '@/state/store'
import type { AgeBand } from '@/features/chapters/teen/types'
import MiloMark from '@/features/chapters/teen/MiloMark'
import { Palette, Ticket, TicketHead, Row, Stamp, Says, HandCue, Blackboard, headerChip, bigBtn, type HandKind } from './gameKit'

const BAND: AgeBand = '12-14'
const RETEACH_AFTER = 3
// When a child RESUMES a chapter above easy, they can opt into a short warm-up:
// this many gentler questions (one tier below where they left off) get prepended
// to the set before it climbs back to their level. Opt-in so it doesn't lengthen
// the set for kids who'd rather jump straight in.
const WARMUP_COUNT = 2

export interface BaseTask {
  title: string
  badge: string
  tone: 'a' | 'b'
  price?: string
  prompt: string
  say: string
  work: string[]        // narrated 3-in-a-row reteach
}

export interface InstrumentProps<V, T extends BaseTask> {
  task: T
  value: V
  setValue: (v: V) => void
  disabled: boolean
  reveal: boolean
  palette: Palette
  onCommit: (v: V) => void
}

export interface DemoProps {
  palette: Palette
  childName: string
  onDone: () => void
}

/** One narrated step of a walkthrough: speak `say`, move the instrument to
 *  `value` (if given), show the `hand` gesture cue, and — like a teacher writing
 *  on the board while talking — WRITE `board` (a short line of math) onto the
 *  chalkboard in sync with the voice. Board lines accumulate across steps. */
export interface DemoStep<V> {
  say: string
  value?: V
  hand?: HandKind
  board?: string
}

/** The "I do" walkthrough script for a chapter. */
export interface TutorialScript<V, T extends BaseTask> {
  task: T           // the worked example (renders the ticket + instrument)
  initial: V        // instrument value the walkthrough starts from
  hand: HandKind    // default gesture for this instrument
  steps: DemoStep<V>[]
}

/** The "we do" guided order — live instrument, coached, NOT scored. */
export interface GuidedConfig<T extends BaseTask> {
  task: T
  coach: string     // spoken when the guided order appears
  hand: HandKind
}

export interface GameConfig<V, T extends BaseTask> {
  chapterId: ChapterType
  title: string             // header title, e.g. MILO'S WEATHER STATION
  ticketLabel: string       // ticket footer label, e.g. "station log"
  palette: Palette
  total?: number
  makeTask: (d: 1 | 2 | 3) => T
  initialValue: (t: T) => V
  grade: (t: T, v: V) => boolean
  revealText: (t: T) => string
  /** Animate the instrument to the correct answer on a wrong answer. */
  glide: (t: T, from: V, setValue: (v: V) => void, later: (fn: () => void, ms: number) => void) => void
  Instrument: (p: InstrumentProps<V, T>) => React.ReactElement
  start: { blurb: React.ReactNode; ticket: { title: string; price?: string; badge: string; tone: 'a' | 'b' }; startLabel: string }
  /** "I do" walkthrough. If present, replaces the one-shot Demo. */
  tutorial?: TutorialScript<V, T>
  /** "we do" guided order, shown after the walkthrough. */
  guided?: GuidedConfig<T>
  /** Legacy one-shot demo (used when `tutorial` is absent). */
  Demo?: (p: DemoProps) => React.ReactElement
  /** math-only signature so a re-drawn ticket / shuffled dressing isn't "new". */
  sig?: (t: T) => string
}

type Sub = 'active' | 'reveal' | 'reteach' | 'sold'
type Stage = 'start' | 'demo' | 'guided' | 'play'

export function Game<V, T extends BaseTask>({
  config, childName, onFinish, onExit,
}: {
  config: GameConfig<V, T>
  childName: string
  onFinish: (correct: number, wrong: number, mastered?: boolean) => void
  onExit: () => void
}) {
  const P = config.palette
  const TOTAL = config.total ?? 8
  // Resume at the difficulty this child last left off on (see chapterLevel). No
  // learner (logged-out preview) → starts at easy, unchanged. Computed once.
  const [learnerId] = useState<string | null>(() => getActiveLearner()?.id ?? null)
  const [startDiff] = useState<1 | 2 | 3>(() => getChapterLevel(learnerId, config.chapterId))
  const ada = useAdaptive(config.chapterId, startDiff)
  // Opt-in warm-up (only offered when resuming above easy). Prepends WARMUP_COUNT
  // gentler questions (one tier down) before the set climbs back to their level.
  const [warmup, setWarmup] = useState(false)
  const warmupDiff = (Math.max(1, startDiff - 1)) as 1 | 2 | 3
  const effTotal = warmup ? TOTAL + WARMUP_COUNT : TOTAL
  const canWarmUp = startDiff > 1

  const [stage, setStage] = useState<Stage>('start')
  const [idx, setIdx] = useState(0)
  const [task, setTask] = useState<T | null>(null)
  const [value, setValue] = useState<V | null>(null)
  const [sub, setSub] = useState<Sub>('active')
  const [wrongRun, setWrongRun] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)

  const seen = useRef<Set<string>>(new Set())
  const timers = useRef<number[]>([])
  const later = useCallback((fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)) }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); stopSpeech() }, [])

  const nextTask = useCallback((d: 1 | 2 | 3): T => {
    let t = config.makeTask(d)
    if (config.sig) {
      for (let i = 0; i < 10 && seen.current.has(config.sig(t)); i++) t = config.makeTask(d)
      seen.current.add(config.sig(t))
    }
    return t
  }, [config])

  const loadTask = useCallback((nextIdx: number, c: number, w: number, mastered: boolean) => {
    if (mastered) { onFinish(c, w, true); return }
    if (nextIdx >= effTotal) { onFinish(c, w); return }
    // Warm-up: the first WARMUP_COUNT questions run one tier below the resumed
    // level to ease back in; after that, the normal adaptive tier takes over.
    const d = warmup && nextIdx < WARMUP_COUNT ? warmupDiff : ada.difficulty
    const t = nextTask(d)
    setTask(t); setValue(config.initialValue(t)); setSub('active'); setIdx(nextIdx)
    speakAfterCurrent(t.say)
  }, [ada.difficulty, onFinish, nextTask, config, effTotal, warmup, warmupDiff])

  const demoDone = useRef(false)
  const finishDemo = useCallback(() => {
    if (demoDone.current) return
    demoDone.current = true
    setStage('play')
    speak(`Your turn, ${childName}.`)
    loadTask(0, 0, 0, false)
  }, [childName, loadTask])

  // "we do" — one live, coached, NON-scored order before real play.
  const enterGuided = useCallback(() => {
    const g = config.guided!
    setStage('guided'); setTask(g.task); setValue(config.initialValue(g.task)); setSub('active')
    speakAfterCurrent(`${g.coach} ${g.task.say}`)
  }, [config])

  const afterDemo = useCallback(() => {
    if (config.guided) enterGuided(); else finishDemo()
  }, [config.guided, enterGuided, finishDemo])

  // scored submit (the "you do" loop)
  function submit(v: V) {
    if (!task || sub !== 'active') return
    const ok = config.grade(task, v)
    const res = ada.record(ok)
    // Remember the tier the child is on, so the next replay resumes here.
    setChapterLevel(learnerId, config.chapterId, res.difficulty)

    if (ok) {
      const c = correct + 1
      setCorrect(c); setSub('sold'); setWrongRun(0)
      speak(`Nice! ${ada.praise}`)
      later(() => loadTask(idx + 1, c, wrong, res.mastered), 1650)
      return
    }
    const w = wrong + 1
    const run = wrongRun + 1
    setWrong(w); setWrongRun(run); setSub('reveal')
    speak(`It was ${config.revealText(task)}. ${ada.encouragement}`)
    if (value != null) config.glide(task, value, setValue, later)

    if (run >= RETEACH_AFTER) {
      later(() => { setSub('reteach'); speakSeq(task.work, {}) }, 1800)
      later(() => { setWrongRun(0); loadTask(idx + 1, correct, w, false) }, 6400)
    } else {
      later(() => loadTask(idx + 1, correct, w, false), 2300)
    }
  }

  // guided submit — encouraging either way, NOT scored, then into real play.
  function submitGuided(v: V) {
    if (!task || sub !== 'active') return
    const ok = config.grade(task, v)
    if (ok) {
      setSub('sold')
      speak(`You did it, ${childName}! Now let's play.`)
      later(finishDemo, 1700)
    } else {
      setSub('reveal')
      speak(`Almost — here's where it goes. Now let's play it for real.`)
      if (value != null) config.glide(task, value, setValue, later)
      later(finishDemo, 2800)
    }
  }

  const busy = sub !== 'active'
  const inOrder = stage === 'play' || stage === 'guided'
  const saysText = !task ? '' :
    sub === 'reveal' ? (stage === 'guided' ? "Here's where it goes." : `It was ${config.revealText(task)}.`) :
    sub === 'reteach' ? task.work[0] :
    sub === 'sold' ? 'Nice ✓' : task.prompt

  return (
    <div className="milo-lesson milo-game" style={{ position: 'relative', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: `linear-gradient(${P.nightTop}, ${P.nightBot})`, color: P.cream, fontFamily: 'var(--font-body)', overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/assets/teen/scene_${config.chapterId}.png`} alt="" aria-hidden loading="lazy" decoding="async"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.88 }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${P.nightTop}44 0%, ${P.nightTop}66 40%, ${P.nightTop}dd 78%, ${P.nightTop} 100%)` }} />

      <header style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 'clamp(660px, 66vw, 820px)', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 4px', boxSizing: 'border-box' }}>
        <button type="button" onClick={() => { stopSpeech(); onExit() }} style={headerChip(P)}>‹ Menu</button>
        <span style={{ fontWeight: 900, fontSize: 'clamp(15px, 1.7vw, 26px)', letterSpacing: '0.05em', color: P.gold, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{config.title}</span>
        <span style={{ flex: 1 }} />
        {stage === 'play' && <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(12px, 1.2vw, 17px)', color: P.creamSoft }}>{Math.min(idx + 1, effTotal)} / {effTotal}</span>}
      </header>

      {stage === 'play' && (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 5, marginTop: 6 }}>
          {Array.from({ length: effTotal }, (_, i) => (
            <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i < idx ? P.gold : i === idx ? P.cream : 'rgba(255,244,221,0.28)', transition: 'background 300ms' }} />
          ))}
        </div>
      )}

      <main style={{ position: 'relative', zIndex: 1, flex: 1, width: '100%', maxWidth: 'clamp(560px, 66vw, 820px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(10px, 1vw, 16px)', padding: '8px 18px 24px', boxSizing: 'border-box' }}>

        {stage === 'start' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
            <Ticket P={P}>
              <TicketHead P={P} n={1} label={config.ticketLabel} />
              <Row P={P} title={config.start.ticket.title} price={config.start.ticket.price} badge={config.start.ticket.badge} tone={config.start.ticket.tone} />
            </Ticket>
            <p style={{ margin: 0, maxWidth: 'clamp(400px, 48vw, 600px)', fontSize: 'clamp(15px, 1.5vw, 22px)', lineHeight: 1.55, color: P.creamSoft, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>{config.start.blurb}</p>
            {canWarmUp ? (
              // Returning above easy → offer an optional warm-up (a few gentler
              // questions first) or jump straight back in at their level.
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
                <p style={{ margin: 0, maxWidth: 'clamp(360px, 46vw, 560px)', fontSize: 'clamp(14px, 1.4vw, 20px)', fontWeight: 700, color: P.cream, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
                  You left off at <span style={{ color: P.gold }}>{ada.difficultyLabel}</span>. Want a quick warm-up first?
                </p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button type="button" onClick={() => { unlockSpeech(); setWarmup(true); setStage('demo') }} style={headerChip(P)}>☀️ Warm up first</button>
                  <button type="button" onClick={() => { unlockSpeech(); setWarmup(false); setStage('demo') }} style={bigBtn(P)}>Continue →</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => { unlockSpeech(); setStage('demo') }} style={bigBtn(P)}>{config.start.startLabel}</button>
            )}
          </div>
        )}

        {stage === 'demo' && (
          config.tutorial
            ? <TutorialPlayer config={config} script={config.tutorial} onDone={afterDemo} />
            : config.Demo
              ? <config.Demo palette={P} childName={childName} onDone={afterDemo} />
              : null
        )}

        {inOrder && task && value != null && (
          <>
            {stage === 'guided' && (
              <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(12px, 1.2vw, 17px)', fontWeight: 800, letterSpacing: '0.14em', color: P.gold, textTransform: 'uppercase' }}>Try this one with me</div>
            )}
            <Says P={P} text={saysText} />
            <div key={stage === 'guided' ? 'g' : idx} style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Ticket P={P}>
                <TicketHead P={P} n={stage === 'guided' ? 1 : idx + 2} label={config.ticketLabel} />
                <Row P={P} title={task.title} price={task.price} badge={task.badge} tone={task.tone} struck={sub === 'sold'} />
                {sub === 'sold' && <Stamp P={P} />}
              </Ticket>
            </div>
            <config.Instrument task={task} value={value} setValue={setValue} disabled={busy} reveal={sub === 'reveal' || sub === 'reteach'} palette={P} onCommit={stage === 'guided' ? submitGuided : submit} />
            {stage === 'guided' && sub === 'active' && config.guided && <HandCue P={P} kind={config.guided.hand} />}
          </>
        )}
      </main>

      {/* Milo, always in the scene */}
      <div style={{ position: 'fixed', left: 14, bottom: 12, zIndex: 2, background: P.cream, borderRadius: '50%', padding: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.45)' }}>
        <MiloMark band={BAND} mood={sub === 'sold' || sub === 'reteach' || stage === 'demo' ? 'speaking' : 'thinking'} size={40} />
      </div>

      <style>{`
        .gk-ticket { animation: gkSlide 460ms cubic-bezier(.2,1.1,.3,1); }
        @keyframes gkSlide { from { transform: translateX(60vw) rotate(3deg); opacity: 0 } to { transform: rotate(-0.6deg); opacity: 1 } }
        .gk-stamp { animation: gkStamp 420ms cubic-bezier(.2,1.4,.3,1) both; }
        @keyframes gkStamp { from { transform: rotate(-14deg) scale(2.4); opacity: 0 } to { transform: rotate(-8deg) scale(1); opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { .gk-ticket,.gk-stamp { animation: none } }
      `}</style>
    </div>
  )
}

// ── "I do" walkthrough player — narrated, step-by-step, hand cue + replay ──────
function TutorialPlayer<V, T extends BaseTask>({
  config, script, onDone,
}: {
  config: GameConfig<V, T>
  script: TutorialScript<V, T>
  onDone: () => void
}) {
  const P = config.palette
  const [i, setI] = useState(0)
  const [value, setValue] = useState<V>(script.initial)
  const [hand, setHand] = useState<HandKind>(script.hand)
  const [ended, setEnded] = useState(false)
  const cancelRef = useRef<() => void>(() => {})

  const run = useCallback(() => {
    cancelRef.current()
    setEnded(false); setI(0); setValue(script.initial); setHand(script.hand)
    unlockSpeech()
    // Deliberately SLOW: a walkthrough is teaching, not narration. Slower voice
    // (rate), a ~1.1s breathing pause after each spoken step (gapMs) so the kid can
    // watch the instrument move before the next sentence, and a slow silent-mode
    // fallback (fallbackStepMs) so a blocked-audio run is just as watchable.
    cancelRef.current = speakSteps(script.steps.map((s) => s.say), {
      rate: 0.8,
      gapMs: 1100,
      fallbackStepMs: 3200,
      onStep: (idx) => {
        setI(idx)
        const s = script.steps[idx]
        if (s && s.value !== undefined) setValue(s.value as V)
        if (s && s.hand) setHand(s.hand)
      },
      onDone: () => setEnded(true),
    })
  }, [script])

  useEffect(() => { run(); return () => cancelRef.current() }, [run])

  const t = script.task

  // Build the chalkboard: every step's `board` line written so far (0..i). The
  // line added AT the current step is the one being written (gets the animation).
  const board: string[] = []
  let writingIndex = -1
  for (let k = 0; k <= i && k < script.steps.length; k++) {
    const b = script.steps[k]?.board
    if (b) { board.push(b); if (k === i) writingIndex = board.length - 1 }
  }

  // On a roomy landscape screen (laptop), stand the walkthrough in TWO columns —
  // Milo's talk + chalkboard on the left, the ticket + instrument on the right — so
  // it fills the width and the taller elements don't overflow the height. Phones and
  // portrait keep the single stacked column.
  const wide = useWideLandscape()

  const talk = (
    <>
      <Says P={P} text={script.steps[i]?.say ?? ''} />
      <Blackboard P={P} lines={board} writingIndex={writingIndex} />
    </>
  )
  const work = (
    <>
      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Ticket P={P}>
          <TicketHead P={P} n={1} label={config.ticketLabel} />
          <Row P={P} title={t.title} price={t.price} badge={t.badge} tone={t.tone} />
        </Ticket>
      </div>
      <config.Instrument task={t} value={value} setValue={() => {}} disabled reveal={false} palette={P} onCommit={() => {}} />
      {!ended && <HandCue P={P} kind={hand} />}
      {ended && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" onClick={run} style={headerChip(P)}>↺ Watch again</button>
          <button type="button" onClick={onDone} style={bigBtn(P)}>Let&apos;s try →</button>
        </div>
      )}
    </>
  )

  if (wide) {
    const colStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(14px, 1.6vw, 22px)', flex: '1 1 0', minWidth: 0, maxWidth: 560 }
    return (
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 'clamp(28px, 4vw, 64px)', width: '100%' }}>
        <div style={colStyle}>{talk}</div>
        <div style={colStyle}>{work}</div>
      </div>
    )
  }
  return <>{talk}{work}</>
}

/** true on a roomy landscape viewport (laptop/desktop) — used to switch the
 *  walkthrough to a two-column layout. Portrait / phones stay single-column. */
function useWideLandscape(): boolean {
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const calc = () => setWide(window.innerWidth >= 900 && window.innerWidth > window.innerHeight * 1.15)
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])
  return wide
}
