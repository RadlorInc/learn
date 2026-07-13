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
import { useEffect, useRef, useState, useCallback, useMemo, isValidElement } from 'react'
import { useAdaptive } from '@/core/adaptive'
import { speak, speakAfterCurrent, speakSeq, speakSteps, speakWithHighlight, splitWords, unlockSpeech, stopSpeech } from '@/infra/useMiloSpeaker'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { getChapterLevel, setChapterLevel } from '@/infra/storage/chapterLevel'
import type { ChapterType } from '@/state/store'
import type { AgeBand } from '@/features/chapters/teen/types'
import MiloMark from '@/features/chapters/teen/MiloMark'
import { Palette, Ticket, TicketHead, Row, HandCue, Blackboard, QuestionBoard, headerChip, bigBtn, type HandKind, type CoachCue } from './gameKit'

const BAND: AgeBand = '12-14'
const RETEACH_AFTER = 3
// How many of the most-recent walkthrough board lines to keep on the chalkboard.
// The longest examples write ~14 lines; capping the visible window keeps working
// memory (and the pinned board slot) from overflowing. (ux-design.md §6.3)
const BOARD_WINDOW = 4
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
  // ── Structured question fields (question-clarity spec). When set, the chalkboard
  //    renders three clear zones instead of one prose `prompt`: a short story line
  //    (`context`), the math (the `badge`/`question`), and a single action chip
  //    (`instruction`). Both optional & backward-compatible — a chapter that sets
  //    neither keeps rendering `prompt` exactly as before. ──
  /** One short plain-language line of story/setup. No math symbols, no UI verbs.
   *  Omit entirely when the chapter has no real story (the math stands alone). */
  context?: string
  /** The single "what to do with the tool" action. Starts with a verb; shown as a
   *  distinct chip under the math so it never blends into the story or the equation. */
  instruction?: string
}

export interface InstrumentProps<V, T extends BaseTask> {
  task: T
  value: V
  setValue: (v: V) => void
  disabled: boolean
  reveal: boolean
  palette: Palette
  onCommit: (v: V) => void
  /** Set during "show me how" so the instrument can SPOTLIGHT the exact control the
   *  child would use next: 'move' (the value control) then 'commit' (the confirm
   *  button). Optional — an instrument that doesn't implement it just ignores it. */
  coach?: CoachCue
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
  /** Optional object sprite (path under /assets) shown beside the chalkboard for
   *  this step — a real picture of what the board line is describing (e.g. a coin
   *  stack for "start: 4", an overdrawn sign for "below 0"). Persists until the
   *  next step sets a different one, so you only mark it where the picture changes. */
  art?: string
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
  /** Optional custom render of the QUESTION on the chalkboard (e.g. to highlight
   *  the portion evaluated first). Defaults to the task's badge/expression. */
  question?: (t: T) => React.ReactNode
  /** One emoji shown huge + very faint as the "sweet & simple" themed backdrop.
   *  Keeps the background uncluttered so it never competes with the interactive. */
  motif?: string
  start: { blurb: React.ReactNode; ticket: { title: string; price?: string; badge: string; tone: 'a' | 'b' }; startLabel: string }
  /** A plain-language SUMMARY of the problem, shown + spoken BEFORE the step-by-step
   *  walkthrough begins — so the child grasps WHAT they're solving and WHICH
   *  calculation they're about to do before diving into the baby steps. Milo reads
   *  `say`; the card shows the `problem` (the goal in one line) + a few short
   *  `points` (what we know / what we'll do). Universal ask (feedback: give the
   *  big picture before the baby steps). */
  overview?: {
    /** Spoken + shown as a word-by-word read-along (each word highlights as Milo
     *  says it, so the child can track along). This is the summary text. */
    say: string
    /** A one-line goal shown as the headline above the read-along. */
    problem: React.ReactNode
    /** Optional supporting bullets. Shown under the read-along on roomy screens. */
    points?: React.ReactNode[]
  }
  /** "I do" walkthrough. If present, replaces the one-shot Demo. Can be a single
   *  worked example, or an ARRAY of examples played back-to-back (each may use a
   *  different instrument/task — good for chapters that teach several operations). */
  tutorial?: TutorialScript<V, T> | TutorialScript<V, T>[]
  /** "we do" guided order, shown after the walkthrough. */
  guided?: GuidedConfig<T>
  /** Optional ANIMATED SCENE that replaces the static instrument during the "I do"
   *  walkthrough — an in-engine explainer (code-drawn, CSS-glide) that acts the math
   *  out like a cartoon video. Driven by the same narration timeline: it receives the
   *  current step's value + step index, and CSS transitions animate the change. */
  TutorialScene?: (p: { palette: Palette; task: T; value: V; stepIndex: number; frameCount: number; ended: boolean }) => React.ReactElement
  /** Legacy one-shot demo (used when `tutorial` is absent). */
  Demo?: (p: DemoProps) => React.ReactElement
  /** math-only signature so a re-drawn ticket / shuffled dressing isn't "new". */
  sig?: (t: T) => string
  /** Opt in to the in-practice "show me how" helper: the FIRST practice question is
   *  worked out for the child automatically (steps written on a board + the
   *  instrument solved on the illustration), and every question after carries a quiet
   *  "Show me how ▸" button. A question that's been shown is NOT scored (it doesn't
   *  touch the adaptive tier or the correct/wrong tally). Uses the task's `work` lines
   *  as the steps. Off by default — piloted per chapter. */
  showSolve?: boolean
  /** Label for the commit button, echoed in the final "then press …" cue during
   *  "show me how" (e.g. "RECORD ✓"). Defaults to a generic "✓". */
  solveCommitLabel?: string
}

type Sub = 'active' | 'reveal' | 'reteach' | 'sold' | 'showing'
type Stage = 'start' | 'intro' | 'demo' | 'guided' | 'play'

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
  // "Show me how" state (config.showSolve): which solve-step line is being written.
  const [showStep, setShowStep] = useState(-1)
  const showCancel = useRef<() => void>(() => {})
  const firstShown = useRef(false)
  // Latest task/value in refs so startShow (called from an effect right after a task
  // loads, before state settles) reads the current question, not a stale one.
  const taskRef = useRef<T | null>(null); taskRef.current = task
  const valueRef = useRef<V | null>(null); valueRef.current = value

  // Legible "I do → your turn → you did it" hand-off cue (feedback-your-turn-cue):
  // a brief popup the moment control passes to the child ('turn') and when they
  // succeed ('solved'), on top of a persistent "your turn" label by the instrument.
  const [cue, setCue] = useState<null | 'turn' | 'solved'>(null)

  const seen = useRef<Set<string>>(new Set())
  const timers = useRef<number[]>([])
  const later = useCallback((fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)) }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); showCancel.current(); stopSpeech() }, [])
  const flashCue = useCallback((k: 'turn' | 'solved') => {
    setCue(k)
    later(() => setCue((c) => (c === k ? null : c)), k === 'turn' ? 1600 : 1500)
  }, [later])

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
    // Cancel any still-pending animation timers from the PREVIOUS question (a wrong-
    // answer glide/reveal can schedule setValue frames that would otherwise land on —
    // and clobber — the new question's fresh instrument value).
    timers.current.forEach(clearTimeout); timers.current = []
    // Warm-up: the first WARMUP_COUNT questions run one tier below the resumed
    // level to ease back in; after that, the normal adaptive tier takes over.
    const d = warmup && nextIdx < WARMUP_COUNT ? warmupDiff : ada.difficulty
    const t = nextTask(d)
    setTask(t); setValue(config.initialValue(t)); setSub('active'); setIdx(nextIdx)
    flashCue('turn')
    // Tier-linked scaffolding (ux-design.md §2/§6.4): Milo reads the task aloud at
    // the lower tiers as a support, but at the TOP tier the child works from the
    // board unaided — that independent success is the competence reward. The board
    // still carries the question (info is never audio-only), and the spoken hint
    // returns automatically on a demotion, since it tracks the live tier.
    if (d < 3) speakAfterCurrent(t.say)
  }, [ada.difficulty, onFinish, nextTask, config, effTotal, warmup, warmupDiff, flashCue])

  // ── "Show me how" (config.showSolve) ──────────────────────────────────────────
  // A shown question is un-scored: advance to the next one WITHOUT recording it to
  // the adaptive engine or the correct/wrong tally, so using the helper never counts
  // for or against the child.
  const advanceUnscored = useCallback(() => {
    loadTask(idx + 1, correct, wrong, false)
  }, [idx, correct, wrong, loadTask])

  // Work out the CURRENT question for the child: write its `work` steps on a board
  // (chalk-synced to Milo's voice) while the instrument glides to the answer on the
  // illustration — solved, not just told. Then advance, un-scored.
  const startShow = useCallback(() => {
    const t = taskRef.current
    if (!t) return
    const steps = t.work && t.work.length ? t.work : [config.revealText(t)]
    showCancel.current()          // cancel any prior show
    stopSpeech()                  // drop a queued `say` so it doesn't fight the steps
    setCue(null)                  // clear the "your turn" popup — we're demonstrating
    setSub('showing'); setShowStep(-1)
    const from = valueRef.current
    if (from != null) config.glide(t, from, setValue, later)   // solve on the illustration
    unlockSpeech()
    showCancel.current = speakSteps(steps, {
      rate: 0.85, gapMs: 900, fallbackStepMs: 2600,
      onStep: (s) => setShowStep(s),
      onDone: () => { later(advanceUnscored, 1400) },
    })
  }, [config, later, advanceUnscored])

  // Mandatory FIRST practice question: work it out automatically the first time the
  // child reaches the scored loop (then it's a button from there on). Fires once.
  useEffect(() => {
    if (config.showSolve && stage === 'play' && idx === 0 && sub === 'active'
        && !firstShown.current && task && value != null) {
      firstShown.current = true
      startShow()
    }
  }, [config.showSolve, stage, idx, sub, task, value, startShow])

  const demoDone = useRef(false)
  const finishDemo = useCallback(() => {
    if (demoDone.current) return
    demoDone.current = true
    setStage('play')
    // With "show me how" on, the first question is demonstrated (not the child's turn
    // yet), so hold the "Your turn" line — startShow will narrate the solve instead.
    if (!config.showSolve) speak(`Your turn, ${childName}.`)
    loadTask(0, 0, 0, false)
  }, [childName, loadTask, config.showSolve])

  // "we do" — one live, coached, NON-scored order before real play.
  const enterGuided = useCallback(() => {
    const g = config.guided!
    setStage('guided'); setTask(g.task); setValue(config.initialValue(g.task)); setSub('active')
    flashCue('turn')
    speakAfterCurrent(`${g.coach} ${g.task.say}`)
  }, [config, flashCue])

  const afterDemo = useCallback(() => {
    // With "show me how" on, the FIRST practice question is worked out for the child
    // automatically — that IS the bridge from watching to doing, so the separate
    // "we do" guided round would just ask them to solve one before they've been shown
    // how (confusing). Skip straight to practice in that case.
    // Otherwise: fade the guided round only for a returning expert (resumes at the top
    // tier); everyone else still gets it (ux-design.md §2/§5). The walkthrough is shown
    // regardless, with the "I've got it →" skip for the fast learner.
    if (config.guided && startDiff < 3 && !config.showSolve) enterGuided(); else finishDemo()
  }, [config.guided, enterGuided, finishDemo, startDiff, config.showSolve])

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
      // Correct = the quiet "You solved it! ✓" visual cue only. No spoken praise
      // ("Good job / Nice / unstoppable") on every right answer — mirrors the
      // 3–11 story chapters (StoryWorld: a tick is enough).
      flashCue('solved')
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
      flashCue('solved')
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
  const roomy = useRoomy()

  // Overview: show the summary ON the chalkboard while the illustration sits in the
  // middle (same universal layout as the walkthrough/practice), instead of a big
  // centre card followed later by the illustration. Needs the illustrated scene +
  // its first worked example to pose the middle; otherwise falls back to the card.
  const Scene = config.TutorialScene
  const introScript = config.tutorial
    ? (Array.isArray(config.tutorial) ? config.tutorial[0] : config.tutorial)
    : undefined

  const solveCommitLabel = config.solveCommitLabel ?? '✓'
  // Last narrated step of the current solve → switch the cue to "then press <commit>".
  const onFinalSolveStep = !!task && task.work.length > 0 && showStep >= task.work.length - 1

  return (
    <div className="milo-lesson milo-game" style={{ position: 'relative', height: '100dvh', maxHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: `linear-gradient(${P.nightTop}, ${P.nightBot})`, color: P.cream, fontFamily: 'var(--font-body)', overflow: 'hidden' }}>
      {/* Sweet & simple backdrop: the palette gradient (on the root) + ONE big, very
          faint themed motif — so nothing in the background competes with the
          interactive objects. (Bespoke painted art can replace this later.) */}
      {config.motif && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none' }}>
          <span style={{ fontSize: 'min(54vh, 66vw)', lineHeight: 1, opacity: 0.07, filter: 'saturate(0.7)' }}>{config.motif}</span>
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(130% 100% at 50% -10%, ${P.nightBot}00 0%, ${P.nightBot}55 100%)` }} />

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

      <main style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '8px 16px 20px', boxSizing: 'border-box' }}>

        {stage === 'start' && (
          <CenterFill>
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
                    <button type="button" onClick={() => { unlockSpeech(); setWarmup(true); setStage(config.overview ? 'intro' : 'demo') }} style={headerChip(P)}>☀️ Warm up first</button>
                    <button type="button" onClick={() => { unlockSpeech(); setWarmup(false); setStage(config.overview ? 'intro' : 'demo') }} style={bigBtn(P)}>Continue →</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => { unlockSpeech(); setStage(config.overview ? 'intro' : 'demo') }} style={bigBtn(P)}>{config.start.startLabel}</button>
              )}
            </div>
          </CenterFill>
        )}

        {stage === 'intro' && config.overview && (
          Scene && introScript ? (
            // The explanation (summary) sits on its own chalkboard on the LEFT and
            // reads word-by-word; the illustration poses on the right. No baby-step
            // board yet — the walkthrough hasn't started. When Milo finishes reading,
            // it rolls into the walkthrough on its own (the explanation STAYS put).
            <TeachFrame
              roomy={roomy}
              explanation={<ExplanationPanel P={P} overview={config.overview} read wordReveal={!!config.showSolve} onDone={() => setStage('demo')} />}
              illustration={<Scene palette={P} task={introScript.task} value={introScript.initial} stepIndex={0} frameCount={1} ended={false} />}
            />
          ) : (
            <CenterFill>
              <OverviewCard P={P} overview={config.overview} onDone={() => setStage('demo')} />
            </CenterFill>
          )
        )}

        {stage === 'demo' && (
          config.tutorial
            ? <TutorialPlayer config={config} script={config.tutorial} roomy={roomy} onDone={afterDemo} />
            : config.Demo
              ? <CenterFill><config.Demo palette={P} childName={childName} onDone={afterDemo} /></CenterFill>
              : null
        )}

        {inOrder && task && value != null && (
          <>
            {/* the QUESTION lives on the chalkboard — top-left on a roomy screen,
                across the top on mobile — and is the same everywhere (universal). */}
            <BoardSlot roomy={roomy}>
              <QuestionBoard
                P={P}
                cue="Solve it"
                prompt={task.prompt || task.title}
                context={task.context}
                instruction={task.instruction}
                expr={config.question ? config.question(task) : task.badge}
                answer={sub === 'active' ? '?' : config.revealText(task)}
                tone={sub === 'active' ? 'ask' : sub === 'sold' ? 'ok' : 'reveal'}
              />
              {/* "Show me how" — the worked solve steps, written line-by-line in sync
                  with Milo's voice while the instrument glides to the answer. */}
              {sub === 'showing' && task.work.length > 0 && (
                <div style={{ marginTop: 'clamp(8px, 1.2vh, 14px)', display: 'flex', justifyContent: 'center' }}>
                  <Blackboard P={P} lines={task.work} writingIndex={showStep} />
                </div>
              )}
            </BoardSlot>
            <CenterFill>
              {stage === 'guided' && sub === 'active' && (
                <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(12px, 1.2vw, 17px)', fontWeight: 800, letterSpacing: '0.14em', color: P.gold, textTransform: 'uppercase' }}>Try this one with me</div>
              )}
              <div key={stage === 'guided' ? 'g' : idx} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px, 1vw, 16px)' }}>
                <config.Instrument task={task} value={value} setValue={setValue} disabled={busy} reveal={sub === 'reveal' || sub === 'reteach' || sub === 'showing'} palette={P} onCommit={stage === 'guided' ? submitGuided : submit} coach={sub === 'showing' ? (onFinalSolveStep ? 'commit' : 'move') : undefined} />
                {stage === 'guided' && sub === 'active' && config.guided && <HandCue P={P} kind={config.guided.hand} />}
                {/* During "show me how" the finger pointer (on the control itself) acts
                    out the interaction; this is just the words alongside it. */}
                {sub === 'showing' && (
                  <div style={{ color: P.creamSoft, fontSize: 'clamp(12px, 1.2vw, 15px)', fontWeight: 700, letterSpacing: '0.04em', textAlign: 'center' }}>
                    {onFinalSolveStep ? `then press ${solveCommitLabel}` : 'move it to the answer'}
                  </div>
                )}
                {/* Quiet on-demand helper — always there in practice for a stuck child.
                    Using it doesn't score the question (see startShow/advanceUnscored). */}
                {stage === 'play' && sub === 'active' && config.showSolve && (
                  <button type="button" onClick={startShow} style={{ ...headerChip(P), opacity: 0.82, fontSize: 'clamp(11px, 1.05vw, 15px)' }}>Show me how ▸</button>
                )}
              </div>
            </CenterFill>
          </>
        )}
      </main>

      {/* Hand-off popup: a brief, legible "your turn" / "you solved it" flash at the
          moment control passes to the child and when they succeed. */}
      {cue && (
        <div aria-live="polite" style={{ position: 'fixed', top: 'clamp(60px, 12vh, 122px)', left: '50%', transform: 'translateX(-50%)', zIndex: 6, pointerEvents: 'none' }}>
          <div key={cue} className="gk-cue" style={{ background: cue === 'solved' ? P.mint : P.gold, color: '#12241b', fontWeight: 900, fontSize: 'clamp(16px, 1.9vw, 25px)', padding: '12px 28px', borderRadius: 999, boxShadow: '0 12px 34px rgba(0,0,0,0.45)', whiteSpace: 'nowrap' }}>
            {cue === 'solved' ? 'You solved it! ✓' : "Now it's your turn!"}
          </div>
        </div>
      )}

      {/* Milo, always in the scene */}
      <div style={{ position: 'fixed', left: 14, bottom: 12, zIndex: 2, background: P.cream, borderRadius: '50%', padding: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.45)' }}>
        <MiloMark band={BAND} mood={sub === 'sold' || sub === 'reteach' || stage === 'demo' ? 'speaking' : 'thinking'} size={40} />
      </div>

      <style>{`
        .gk-ticket { animation: gkSlide 460ms cubic-bezier(.2,1.1,.3,1); }
        @keyframes gkSlide { from { transform: translateX(60vw) rotate(3deg); opacity: 0 } to { transform: rotate(-0.6deg); opacity: 1 } }
        .gk-stamp { animation: gkStamp 420ms cubic-bezier(.2,1.4,.3,1) both; }
        @keyframes gkStamp { from { transform: rotate(-14deg) scale(2.4); opacity: 0 } to { transform: rotate(-8deg) scale(1); opacity: 1 } }
        .gk-cue { animation: gkCue 320ms cubic-bezier(.2,1.5,.3,1) both; }
        @keyframes gkCue { from { transform: translateY(-10px) scale(.8); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
        /* Let any chapter's illustrated scene shrink to fit its height-bounded box so
           the teaching view never scrolls (SVG keeps its aspect ratio). */
        .teach-illo svg { max-width: 100%; max-height: 100%; }
        @media (prefers-reduced-motion: reduce) { .gk-ticket,.gk-stamp,.gk-cue { animation: none } }
      `}</style>
    </div>
  )
}

// ── "I do" walkthrough player — narrated, step-by-step, hand cue + replay ──────
// Same universal layout as practice: the explanation is WRITTEN on the chalkboard
// (top-left on a roomy screen / across the top on mobile) while Milo speaks it; the
// instrument is centred with the action buttons below. No Milo dialog is printed on
// screen — the spoken narration carries the words, the board carries the math.
function TutorialPlayer<V, T extends BaseTask>({
  config, script, roomy, onDone,
}: {
  config: GameConfig<V, T>
  script: TutorialScript<V, T> | TutorialScript<V, T>[]
  roomy: boolean
  onDone: () => void
}) {
  const P = config.palette
  const [i, setI] = useState(0)
  const [ended, setEnded] = useState(false)
  const cancelRef = useRef<() => void>(() => {})

  // Flatten one-or-many worked examples into a single timeline of frames. Each
  // frame carries its example's task (so the instrument switches per example),
  // the instrument value at that moment, the hand cue, and the chalkboard lines
  // written so far WITHIN that example (the board resets between examples). A
  // multi-example tutorial thus teaches several operations, one baby step at a time.
  const frames = useMemo(() => {
    const scripts = Array.isArray(script) ? script : [script]
    const out: { task: T; value: V; hand: HandKind; board: string[]; writingIndex: number; say: string; art: string }[] = []
    for (const sc of scripts) {
      let val = sc.initial
      let hnd = sc.hand
      let art = ''
      const board: string[] = []
      for (const st of sc.steps) {
        if (st.value !== undefined) val = st.value as V
        if (st.hand) hnd = st.hand
        if (st.art !== undefined) art = st.art
        let writingIndex = -1
        if (st.board) { board.push(st.board); writingIndex = board.length - 1 }
        out.push({ task: sc.task, value: val, hand: hnd, board: [...board], writingIndex, say: st.say, art })
      }
    }
    return out
  }, [script])

  const run = useCallback(() => {
    cancelRef.current()
    setEnded(false); setI(0)
    unlockSpeech()
    // Deliberately SLOW: a walkthrough is teaching, not narration. Slower voice
    // (rate), a ~1.1s breathing pause after each spoken step (gapMs) so the kid can
    // watch the instrument move before the next sentence, and a slow silent-mode
    // fallback (fallbackStepMs) so a blocked-audio run is just as watchable.
    cancelRef.current = speakSteps(frames.map((f) => f.say), {
      rate: 0.8,
      gapMs: 1100,
      fallbackStepMs: 3200,
      onStep: (idx) => setI(idx),
      onDone: () => setEnded(true),
    })
  }, [frames])

  useEffect(() => { run(); return () => cancelRef.current() }, [run])

  // A child who's got it can jump straight to practice — cancel the narration
  // timeline + any in-flight speech, then advance. (Autonomy + respects the fast
  // learner; see ux-design.md §2/§6.3.)
  const skip = useCallback(() => { cancelRef.current(); stopSpeech(); onDone() }, [onDone])

  const cur = frames[Math.min(i, frames.length - 1)] ?? frames[0]

  // WINDOW the chalkboard to the last few lines. The longest walkthroughs
  // accumulate ~14 board lines; showing them all is itself a working-memory load
  // (cognitive-load theory) and overflows the pinned slot. Keep only the most
  // recent lines and re-base the "currently writing" index into the window so the
  // chalk animation still lands on the newest line. (ux-design.md §6.3)
  const boardStart = Math.max(0, cur.board.length - BOARD_WINDOW)
  const windowBoard = cur.board.slice(boardStart)
  const windowWriting = cur.writingIndex < 0 ? -1 : cur.writingIndex - boardStart

  const controls = ended ? (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
      <button type="button" onClick={run} style={headerChip(P)}>↺ Watch again</button>
      <button type="button" onClick={onDone} style={bigBtn(P)}>Let&apos;s try →</button>
    </div>
  ) : (
    // Mid-walkthrough opt-out — quiet, so it never pulls focus from the lesson,
    // but always there for the kid who doesn't need the rest.
    <button type="button" onClick={skip} style={{ ...headerChip(P), opacity: 0.72, fontSize: 'clamp(11px, 1.05vw, 15px)' }}>I&apos;ve got it →</button>
  )

  // The baby-step chalkboard — its own board, distinct from the explanation.
  const babyBoard = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <Blackboard P={P} lines={windowBoard} writingIndex={windowWriting} />
      {cur.art && <ArtProp src={cur.art} />}
    </div>
  )

  // Illustrated chapters (all 12–18 games): keep the explanation on the LEFT for the
  // whole walkthrough, the baby-step board ABOVE the illustration on the right. On
  // mobile it stacks explanation → baby-step board → illustration, top to bottom.
  if (config.TutorialScene) {
    return (
      <TeachFrame
        roomy={roomy}
        explanation={config.overview ? <ExplanationPanel P={P} overview={config.overview} read={false} onDone={() => {}} /> : undefined}
        board={babyBoard}
        illustration={<config.TutorialScene palette={P} task={cur.task} value={cur.value} stepIndex={Math.min(i, frames.length - 1)} frameCount={frames.length} ended={ended} />}
        controls={controls}
      />
    )
  }

  // Legacy fallback (chapters with no illustrated scene): board on top, instrument
  // below — the original one-column walkthrough.
  return (
    <>
      <BoardSlot roomy={roomy}>{babyBoard}</BoardSlot>
      <CenterFill>
        <config.Instrument task={cur.task} value={cur.value} setValue={() => {}} disabled reveal={false} palette={P} onCommit={() => {}} />
        {!ended && <HandCue P={P} kind={cur.hand} />}
        {controls}
      </CenterFill>
    </>
  )
}

/** The real-world object picture that appears beside the chalkboard during the
 *  walkthrough — a visual of what the board line is describing. Pops in fresh each
 *  time the sprite changes (keyed on src) so a new picture reads as a new beat. */
function ArtProp({ src }: { src: string }) {
  return (
    <div key={src} style={{ marginTop: 'clamp(8px, 1.4vh, 16px)', display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'gsArtPop 420ms ease' }}>
      <style>{'@keyframes gsArtPop{0%{opacity:0;transform:translateY(8px) scale(.9)}60%{transform:translateY(0) scale(1.04)}100%{opacity:1;transform:translateY(0) scale(1)}}'}</style>
      <img src={src} alt="" style={{ height: 'clamp(80px, 14vh, 156px)', width: 'auto', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.35))' }} />
    </div>
  )
}

/** The pre-walkthrough SUMMARY card — the big picture before the baby steps. Milo
 *  speaks the plan while it is shown as a WORD-BY-WORD READ-ALONG: each word
 *  highlights as he says it, so the child can track where the sentence is going
 *  (feedback: highlight the word Milo is speaking). Then "Show me how →" starts the
 *  step-by-step walkthrough. */
function OverviewCard({ P, overview, onDone }: {
  P: Palette
  overview: NonNullable<GameConfig<unknown, BaseTask>['overview']>
  onDone: () => void
}) {
  const words = useMemo(() => splitWords(overview.say), [overview.say])
  const [hi, setHi] = useState(-1)
  // Auto-advance to the baby-step walkthrough once Milo finishes reading (fires
  // once, incl. the blocked-audio fallback). Ref keeps a new onDone identity from
  // restarting the read-along.
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    setHi(-1)
    const cancel = speakWithHighlight(overview.say, { onWord: setHi, onDone: () => doneRef.current() })
    return () => { cancel(); setHi(-1) }
  }, [overview.say])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(14px, 1.8vh, 22px)', textAlign: 'center', maxWidth: 'clamp(400px, 56vw, 680px)' }}>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(12px, 1.2vw, 16px)', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: P.gold }}>Here&apos;s the plan</div>
      <p style={{ margin: 0, fontSize: 'clamp(18px, 2vw, 28px)', fontWeight: 800, lineHeight: 1.4, color: P.cream, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>{overview.problem}</p>
      {/* Read-along: one span per word; the spoken word lights up so the kid can follow. */}
      <p aria-label={overview.say} style={{ margin: 0, fontSize: 'clamp(16px, 1.7vw, 23px)', lineHeight: 1.7, color: P.creamSoft, background: P.glass, border: `1px solid ${P.glassBorder}`, borderRadius: 16, padding: 'clamp(12px, 1.8vh, 18px) clamp(16px, 2vw, 24px)', maxWidth: 'clamp(360px, 52vw, 620px)' }}>
        {words.map((w, i) => {
          // Don't paint a highlight pill around a lone punctuation token (e.g. "—").
          const lit = i === hi && /[A-Za-z0-9]/.test(w.word)
          return (
          <span
            key={i}
            aria-hidden
            style={{
              background: lit ? P.gold : 'transparent',
              color: lit ? '#12241b' : 'inherit',
              fontWeight: lit ? 800 : 400,
              borderRadius: 6,
              padding: '1px 3px',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
              transition: 'background 120ms ease, color 120ms ease',
            }}
          >{w.word}{i < words.length - 1 ? ' ' : ''}</span>
          )
        })}
      </p>
    </div>
  )
}

/** The overview SUMMARY (explanation) rendered on its OWN chalkboard — a slate panel
 *  matching the baby-step board. It is PERSISTENT through the whole teaching phase:
 *  it sits on the left (or on top, on mobile) and stays put while the walkthrough
 *  runs on the separate baby-step board. When `read` is true (the intro), Milo speaks
 *  it as a word-by-word read-along and calls `onDone` when finished (which rolls into
 *  the walkthrough); when `read` is false (during the walkthrough) it just shows the
 *  plan, silent and unhighlighted, so the two chalkboards don't talk over each other. */
/** Flatten a ReactNode (strings, numbers, fragments, <strong>, arrays) to plain text,
 *  so the plan can be BOTH spoken and revealed word-by-word from the same content. */
function nodeText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join('')
  if (isValidElement(node)) return nodeText((node.props as { children?: React.ReactNode }).children)
  return ''
}

function ExplanationPanel({ P, overview, read, onDone, wordReveal = false }: {
  P: Palette
  overview: NonNullable<GameConfig<unknown, BaseTask>['overview']>
  read: boolean
  onDone: () => void
  /** When set, Milo narrates EXACTLY the board text (problem + points) and each word
   *  appears as he says it — instead of speaking a separate `say` summary. */
  wordReveal?: boolean
}) {
  // Ref so a new onDone identity never restarts the narration; it fires once when the
  // summary finishes (real speech OR the blocked-audio fallback), then the walkthrough
  // starts automatically.
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const points = overview.points ?? []

  // Plain-text blocks (problem + each point), tokenised the SAME way the speaker maps
  // boundaries (splitWords), so the word reveal stays in lock-step with the voice.
  const blocks = useMemo(
    () => (wordReveal ? [overview.problem, ...points].map((n) => nodeText(n).trim()) : []),
    [wordReveal, overview.problem, points],
  )
  const blockTokens = useMemo(() => blocks.map((b) => splitWords(b).map((w) => w.word)), [blocks])
  const offsets = useMemo(() => {
    const o: number[] = []; let acc = 0
    for (const t of blockTokens) { o.push(acc); acc += t.length }
    return o
  }, [blockTokens])
  const totalWords = blockTokens.reduce((a, t) => a + t.length, 0)
  const spoken = blocks.join(' ')

  // `said` = how many words Milo has spoken so far → reveal words with index < said.
  const [said, setSaid] = useState(read && wordReveal ? 0 : totalWords)
  useEffect(() => {
    if (!read || !wordReveal) { setSaid(totalWords); return }
    setSaid(0)
    const bump = (n: number) => setSaid((s) => Math.max(s, Math.min(totalWords, n)))
    // Timed fallback so words still appear even where no word-boundary events fire
    // (blocked audio); real speech events only pull the reveal forward.
    const tids = Array.from({ length: totalWords }, (_, i) => window.setTimeout(() => bump(i + 1), 350 + i * 300))
    const cancel = speakWithHighlight(spoken, {
      onWord: (i) => { if (i >= 0) bump(i + 1) },
      onDone: () => { setSaid(totalWords); doneRef.current() },
    })
    return () => { tids.forEach(clearTimeout); cancel() }
  }, [spoken, read, wordReveal, totalWords])

  // Non-word chapters: speak the `say` summary; the board shows in full (unchanged).
  useEffect(() => {
    if (!read || wordReveal) return
    const cancel = speakWithHighlight(overview.say, { onWord: () => {}, onDone: () => doneRef.current() })
    return () => cancel()
  }, [overview.say, read, wordReveal])

  const wordStyle = (idx: number): React.CSSProperties => ({ opacity: idx < said ? 1 : 0, transition: 'opacity 200ms ease' })
  const shell = (children: React.ReactNode) => (
    <div style={{
      width: '100%', maxHeight: '100%', boxSizing: 'border-box', overflow: 'hidden',
      background: 'linear-gradient(160deg, #21473c, #16302a)',
      border: '4px solid #7a5230', borderRadius: 12,
      boxShadow: 'inset 0 0 26px rgba(0,0,0,0.55), 0 8px 20px rgba(0,0,0,0.4)',
      padding: 'clamp(12px, 1.6vw, 20px) clamp(14px, 1.8vw, 24px)',
      display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.3vh, 16px)',
    }}>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(11px, 1.05vw, 14px)', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: P.gold }}>The plan</div>
      {children}
    </div>
  )

  // Word-by-word mode (pilot): render the SAME text Milo speaks, each word fading in.
  if (wordReveal) {
    const probTokens = blockTokens[0] ?? []
    return shell(
      <>
        <p style={{ margin: 0, fontFamily: 'var(--font-chalk)', fontSize: 'clamp(18px, 1.9vw, 26px)', fontWeight: 700, lineHeight: 1.3, color: '#f6faf0', textShadow: '0 0 1px rgba(255,255,255,0.5), 0 0 8px rgba(214,240,206,0.35)' }}>
          {probTokens.map((w, wi) => <span key={wi} style={wordStyle(offsets[0] + wi)}>{w}{wi < probTokens.length - 1 ? ' ' : ''}</span>)}
        </p>
        {points.length > 0 && (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1vh, 12px)' }}>
            {points.map((_, i) => {
              const toks = blockTokens[1 + i] ?? []
              const base = offsets[1 + i] ?? 0
              return (
                <li key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'clamp(7px,0.9vw,11px)', alignItems: 'baseline', fontFamily: 'var(--font-chalk)', fontSize: 'clamp(15px, 1.5vw, 20px)', lineHeight: 1.35, color: '#dbe9d6' }}>
                  <span aria-hidden style={{ color: P.gold, fontWeight: 900, fontSize: '0.9em', opacity: base < said ? 1 : 0, transition: 'opacity 200ms ease' }}>▸</span>
                  <span>{toks.map((w, wi) => <span key={wi} style={wordStyle(base + wi)}>{w}{wi < toks.length - 1 ? ' ' : ''}</span>)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </>,
    )
  }

  // Static render (full text) — other chapters.
  return shell(
    <>
      <p style={{ margin: 0, fontFamily: 'var(--font-chalk)', fontSize: 'clamp(18px, 1.9vw, 26px)', fontWeight: 700, lineHeight: 1.3, color: '#f6faf0', textShadow: '0 0 1px rgba(255,255,255,0.5), 0 0 8px rgba(214,240,206,0.35)' }}>{overview.problem}</p>
      {points.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1vh, 12px)' }}>
          {points.map((pt, i) => (
            <li key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'clamp(7px,0.9vw,11px)', alignItems: 'baseline', fontFamily: 'var(--font-chalk)', fontSize: 'clamp(15px, 1.5vw, 20px)', lineHeight: 1.35, color: '#dbe9d6' }}>
              <span aria-hidden style={{ color: P.gold, fontWeight: 900, fontSize: '0.9em' }}>▸</span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      )}
    </>,
  )
}

// ── universal layout helpers ──────────────────────────────────────────────────
/** true when there's horizontal room (laptop/desktop) → pin the chalkboard
 *  top-left. Below this the board stacks across the top (phones/tablets). */
function useRoomy(): boolean {
  const [roomy, setRoomy] = useState(false)
  useEffect(() => {
    const calc = () => setRoomy(window.innerWidth >= 820)
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])
  return roomy
}

/** The chalkboard slot — pinned top-left on a roomy screen (absolute, out of flow
 *  so the interactive stays centred), or stacked full-width across the top on
 *  mobile. Universal: present in every chapter, in both explanation and practice. */
function BoardSlot({ roomy, children }: { roomy: boolean; children: React.ReactNode }) {
  if (roomy) {
    return <div style={{ position: 'absolute', top: 'clamp(4px, 1vh, 18px)', left: 'clamp(10px, 1.6vw, 28px)', width: 'clamp(280px, 30vw, 420px)', zIndex: 3 }}>{children}</div>
  }
  return <div style={{ width: '100%', maxWidth: 480, display: 'flex', justifyContent: 'center', margin: '0 auto 10px' }}>{children}</div>
}

/** The centred interactive column — instrument in the middle, its action button
 *  directly below. Fills the space left of / beneath the board. */
function CenterFill({ children }: { children: React.ReactNode }) {
  return <div style={{ flex: 1, width: '100%', maxWidth: 'clamp(560px, 66vw, 820px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(10px, 1vw, 16px)', margin: '0 auto', minHeight: 0, padding: '2px 0 6px', boxSizing: 'border-box' }}>{children}</div>
}

/** The three-panel TEACHING layout (intro + walkthrough) — keeps the explanation
 *  visible the whole time and gives the baby steps their own board:
 *   • roomy (laptop/desktop): explanation on the LEFT, and on the right the
 *     baby-step chalkboard ABOVE the illustration (controls under it).
 *   • mobile: a single column — explanation → baby-step board → illustration →
 *     controls, top to bottom (both boards come BEFORE the illustration).
 *  The whole frame is height-bounded (`minHeight:0` + `overflow:hidden` down the
 *  flex chain) so the illustration shrinks to fit and the view never scrolls; the
 *  `.teach-illo svg` cap lets any chapter's scene scale down inside its box. */
function TeachFrame({ roomy, explanation, board, illustration, controls }: {
  roomy: boolean
  explanation?: React.ReactNode
  board?: React.ReactNode
  illustration: React.ReactNode
  controls?: React.ReactNode
}) {
  const illo = (
    <div className="teach-illo" style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {illustration}
    </div>
  )
  const rightCol = (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 'clamp(8px, 1.4vh, 18px)', overflow: 'hidden' }}>
      {board && <div style={{ width: '100%', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{board}</div>}
      {illo}
      {controls && <div style={{ flexShrink: 0 }}>{controls}</div>}
    </div>
  )

  if (roomy && explanation) {
    return (
      <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 'clamp(880px, 94vw, 1260px)', margin: '0 auto', display: 'flex', gap: 'clamp(16px, 2.2vw, 36px)', alignItems: 'stretch', overflow: 'hidden' }}>
        <div style={{ width: 'clamp(270px, 30vw, 400px)', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', minHeight: 0, overflow: 'hidden' }}>{explanation}</div>
        {rightCol}
      </div>
    )
  }

  // mobile / no-explanation → single column, explanation + board BEFORE the illustration
  return (
    <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 540, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 1.4vh, 16px)', overflow: 'hidden' }}>
      {explanation && <div style={{ width: '100%', flexShrink: 0 }}>{explanation}</div>}
      {board && <div style={{ width: '100%', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{board}</div>}
      {illo}
      {controls && <div style={{ flexShrink: 0 }}>{controls}</div>}
    </div>
  )
}
