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
 * (Every chapter supplies a `tutorial`; `guided` is optional.)
 *
 * Foundation is the shared adaptive engine, UNCHANGED:
 *   • invisible tiers L1→L2→L3 via useAdaptive
 *   • promote on a streak, DEMOTE on wrong (makeTask(ada.difficulty))
 *   • RE-EXPLANATION after 3 wrong in a row (Milo narrates task.work in-scene)
 *   • mastery early-exit (top tier + clean streak → finish early, full stars)
 * Math-without-fear: no timer, no red X, no score, no coins.
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useAdaptive } from '@/core/adaptive'
import { speak, speakAfterCurrent, speakSeq, speakSteps, speakWithHighlight, splitWords, unlockSpeech, stopSpeech } from '@/infra/useMiloSpeaker'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { getChapterLevel, setChapterLevel } from '@/infra/storage/chapterLevel'
import type { ChapterType } from '@/state/store'
import type { AgeBand } from '@/features/chapters/teen/types'
import MiloMark from '@/features/chapters/teen/MiloMark'
import FitBox from '@/features/chapters/story/FitBox'
import { Palette, Ticket, TicketHead, Row, HandCue, Blackboard, QuestionBoard, AnswerPad, headerChip, bigBtn, type HandKind } from './gameKit'
import ScribblePad from './ScribblePad'
import { setClipOnly } from '@/infra/voiceClipPlayer'

const BAND: AgeBand = '12-14'
const RETEACH_AFTER = 3
// How many of the most-recent walkthrough board lines to keep on the chalkboard.
// The longest examples write ~14 lines; capping the visible window keeps working
// memory (and the pinned board slot) from overflowing. (ux-design.md §6.3)
// MEASURED, not guessed: on a 390×844 phone the teaching stack is a single column
// (explanation → step board → illustration), and the step board's 4 lines are ~110px
// of it. `short` is the LANDSCAPE-phone gate and never fires on a tall phone, so the
// gate here is the same predicate that picks the single-column layout in TeachFrame:
// !roomy && !short. A short-landscape frame keeps 4 because its board sits in the
// right column, not on top of the illustration.
const BOARD_WINDOW = 4
const BOARD_WINDOW_STACKED = 2
// When a child RESUMES a chapter above easy, they can opt into a short warm-up:
// this many gentler questions (one tier below where they left off) get prepended
// to the set before it climbs back to their level. Opt-in so it doesn't lengthen
// the set for kids who'd rather jump straight in.
const WARMUP_COUNT = 2

export interface BaseTask {
  title: string
  badge: string
  tone: 'a' | 'b'
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
  /** The action chip to show INSTEAD of `instruction` when this question is answered
   *  on the AnswerPad — because the pad hides the instrument, so an instruction naming
   *  a gesture ("crank the gear", "shade the grid") tells the child to do something
   *  the screen no longer offers. Omit and a padded question falls back to a generic
   *  tap line, which is always true even if it is less specific. */
  padInstruction?: string
  /** What sits left of the answer on the board (default '='). Set when `badge` is
   *  already a complete equation, so the board doesn't read "x + 1 = 4" then "= ?". */
  answerLabel?: string
  /** Whether the board shows an "= ?" (then "= answer") line under the math. Default
   *  true. Set false for "place a stated value" tasks (set X on the meter, pick the
   *  lower of two) where the math is a target to place, not an expression to evaluate
   *  — an "= ?" there reads as a broken equation. */
  showEquals?: boolean
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

/** The "we do" guided order — live instrument, coached, NOT scored. A chapter may
 *  supply an ARRAY when it has more than one interaction to rehearse (BalanceBench:
 *  one equation on the pad, one inequality on the RayLine — the symbol chip is a
 *  separately-graded step a child must meet unscored before it can cost them). */
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
  makeTask: (d: 1 | 2 | 3) => T
  initialValue: (t: T) => V
  grade: (t: T, v: V) => boolean
  revealText: (t: T) => string
  /** Animate the instrument to the correct answer on a wrong answer. */
  glide: (t: T, from: V, setValue: (v: V) => void, later: (fn: () => void, ms: number) => void) => void
  Instrument: (p: InstrumentProps<V, T>) => React.ReactElement
  /** One emoji shown huge + very faint as the "sweet & simple" themed backdrop.
   *  Keeps the background uncluttered so it never competes with the interactive. */
  motif?: string
  start: { blurb: React.ReactNode; ticket: { title: string; badge: string; tone: 'a' | 'b' }; startLabel: string }
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
  /** "we do" guided order(s), shown after the walkthrough. An array runs in sequence. */
  guided?: GuidedConfig<T> | GuidedConfig<T>[]
  /** Optional ANIMATED SCENE that replaces the static instrument during the "I do"
   *  walkthrough — an in-engine explainer (code-drawn, CSS-glide) that acts the math
   *  out like a cartoon video. Driven by the same narration timeline: it receives the
   *  current step's value + step index, and CSS transitions animate the change. */
  TutorialScene?: (p: { palette: Palette; task: T; value: V; stepIndex: number; frameCount: number; ended: boolean }) => React.ReactElement
  /** math-only signature so a re-drawn ticket / shuffled dressing isn't "new". */
  sig?: (t: T) => string
  /** PER-TASK tap-answering. Return the tap-choices for THIS question (correct +
   *  distractors, pre-shuffled — the pad shuffles nothing) and the child answers by
   *  tapping a number instead of working the instrument; the instrument is hidden
   *  while the pad is up. Return `[]` for a question whose illustration IS how you
   *  solve it, and that question keeps its instrument. Numeric answers only. */
  answerPad?: (t: T) => number[]
  /** How a TAPPED pad number becomes this chapter's value type.
   *
   *  ⚠️ REQUIRED for any chapter whose V is not `number` — e.g. a tagged union like
   *  `{k:'num',n} | {k:'pick',id}`. Without it the shell hands `grade` the raw number,
   *  `v.k` is `undefined`, EVERY answer grades wrong, the correct chip never lights,
   *  and `data-test-answer` resolves to '' (so the E2E gate cannot see it either).
   *  That shipped once — a padded chapter marked correct answers wrong in production
   *  and it took three independent readers to spot, because a wrong answer still
   *  advances and so the flow looks fine. Defaults to the identity cast, which is
   *  correct for the `V = number` chapters and only those. */
  padValue?: (n: number) => V
}

type Sub = 'active' | 'reveal' | 'reteach' | 'sold'
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
  const TOTAL = 8
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
  // Pad answer-choices: built once per question (task ref is stable until the next
  // one loads), so the distractors don't reshuffle on every keystroke re-render.
  const padChoices = useMemo(() => (config.answerPad && task ? config.answerPad(task) : []), [config, task])
  // A tapped pad number → this chapter's value type. See GameConfig.padValue for why
  // the identity cast is only safe when V really is `number`.
  const toV = useCallback(
    (n: number): V => (config.padValue ? config.padValue(n) : (n as unknown as V)),
    [config],
  )
  // The choice the child actually tapped, so the reveal can mark it (an instrument
  // chapter shows the mistake by gliding; a pad chapter has to show it on the pad).
  const [picked, setPicked] = useState<number | null>(null)
  const [wrongRun, setWrongRun] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)

  // Legible "I do → your turn → you did it" hand-off cue (feedback-your-turn-cue):
  // a brief popup the moment control passes to the child ('turn') and when they
  // succeed ('solved'), on top of a persistent "your turn" label by the instrument.
  const [cue, setCue] = useState<null | 'turn' | 'solved'>(null)

  const seen = useRef<Set<string>>(new Set())
  const timers = useRef<number[]>([])
  const later = useCallback((fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)) }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); stopSpeech() }, [])
  // 12–14 ONLY: a chosen custom voice is the ONLY voice — no browser-TTS fallback, so the
  // recorded and free voices never mix. Other bands (incl. 15–16 on this same shell) keep
  // the fallback. Off again when we leave the shell.
  useEffect(() => {
    if (getActiveLearner()?.age_group !== '12-14') return
    setClipOnly(true); return () => setClipOnly(false)
  }, [])
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
    setTask(t); setValue(config.initialValue(t)); setSub('active'); setIdx(nextIdx); setPicked(null)
    flashCue('turn')
    // Tier-linked scaffolding (ux-design.md §2/§6.4): Milo reads the task aloud at
    // the lower tiers as a support, but at the TOP tier the child works from the
    // board unaided — that independent success is the competence reward. The board
    // still carries the question (info is never audio-only), and the spoken hint
    // returns automatically on a demotion, since it tracks the live tier.
    if (d < 3) speakAfterCurrent(t.say)
  }, [ada.difficulty, onFinish, nextTask, config, effTotal, warmup, warmupDiff, flashCue])

  const demoDone = useRef(false)
  const finishDemo = useCallback(() => {
    if (demoDone.current) return
    demoDone.current = true
    setStage('play')
    speak(`Your turn, ${childName}.`)
    loadTask(0, 0, 0, false)
  }, [childName, loadTask])

  // "we do" — live, coached, NON-scored order(s) before real play. `guidedIdx`
  // walks the array form; the single-object form is a one-element walk.
  const guidedList = useMemo(() => (config.guided ? (Array.isArray(config.guided) ? config.guided : [config.guided]) : []), [config.guided])
  const guidedIdx = useRef(0)
  const enterGuided = useCallback((i: number) => {
    const g = guidedList[i]
    guidedIdx.current = i
    setStage('guided'); setTask(g.task); setValue(config.initialValue(g.task)); setSub('active')
    flashCue('turn')
    speakAfterCurrent(`${g.coach} ${g.task.say}`)
  }, [guidedList, config, flashCue])

  const afterDemo = useCallback(() => {
    // Fade the guided round only for a returning expert (resumes at the top tier);
    // everyone else still gets it (ux-design.md §2/§5). The walkthrough is shown
    // regardless, with the "I've got it →" skip for the fast learner.
    if (guidedList.length && startDiff < 3) enterGuided(0); else finishDemo()
  }, [guidedList, enterGuided, finishDemo, startDiff])

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

  // guided submit — encouraging either way, NOT scored; walks to the next guided
  // order if the chapter supplied several, then into real play.
  function submitGuided(v: V) {
    if (!task || sub !== 'active') return
    const ok = config.grade(task, v)
    const next = guidedIdx.current + 1
    const after = next < guidedList.length ? () => enterGuided(next) : finishDemo
    const lastWords = next < guidedList.length ? `One more with me.` : `Now let's play.`
    if (ok) {
      setSub('sold')
      flashCue('solved')
      speak(`You did it, ${childName}! ${lastWords}`)
      later(after, 1700)
    } else {
      setSub('reveal')
      speak(`Almost — here's where it goes. ${lastWords}`)
      if (value != null) config.glide(task, value, setValue, later)
      later(after, 2800)
    }
  }

  const busy = sub !== 'active'
  const inOrder = stage === 'play' || stage === 'guided'
  const { roomy, short, tall, portrait } = useFrame()
  // Scratch paper — kids work on iPads and laptops and had nowhere to do the sums.
  const [scratch, setScratch] = useState(false)

  // Overview: show the summary ON the chalkboard while the illustration sits in the
  // middle (same universal layout as the walkthrough/practice), instead of a big
  // centre card followed later by the illustration. Needs the illustrated scene +
  // its first worked example to pose the middle; otherwise falls back to the card.
  const Scene = config.TutorialScene
  const introScript = config.tutorial
    ? (Array.isArray(config.tutorial) ? config.tutorial[0] : config.tutorial)
    : undefined

  // Dev-only E2E hook: expose the current task's correct answer + phase on the
  // question board so deterministic test personas (aceKid/strugglerKid) can drive
  // the real adaptive engine without an LLM solving the math. The whole block is
  // compile-time dead-code-eliminated when NODE_ENV==='production' (Vercel preview
  // AND prod both run `next build` with NODE_ENV=production), so the answer is only
  // ever emitted by the local `next dev` server — never in any deployed DOM.
  // `data-test-answer` is the exact value the correct AnswerPad choice holds (pad
  // chapters) or the revealed answer string (instrument chapters), and is present
  // only while a question is live (sub==='active'). See e2e/README.md.
  const testHooks: Record<string, string> | undefined =
    process.env.NODE_ENV !== 'production' && task
      ? {
          'data-test-answer':
            sub === 'active'
              ? padChoices.length
                ? String(padChoices.find((c) => config.grade(task, toV(c))) ?? '')
                : config.revealText(task)
              : '',
          'data-test-phase': sub === 'sold' ? 'solved' : sub === 'reveal' || sub === 'reteach' ? 'reveal' : stage === 'guided' ? 'guided' : 'practice',
        }
      : undefined

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

      {/* On a short frame the chrome is the cheapest height to buy back — every px
          here is a px the interactive doesn't have to be scaled out of. */}
      <header style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 'clamp(660px, 66vw, 820px)', display: 'flex', alignItems: 'center', gap: 10, padding: short ? '4px 14px 0' : '12px 16px 4px', boxSizing: 'border-box' }}>
        <button type="button" onClick={() => { stopSpeech(); onExit() }} style={headerChip(P)}>‹ Menu</button>
        <span style={{ fontWeight: 900, fontSize: 'clamp(15px, 1.7vw, 26px)', letterSpacing: '0.05em', color: P.gold, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{config.title}</span>
        <span style={{ flex: 1 }} />
        {stage === 'play' && <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(12px, 1.2vw, 17px)', color: P.creamSoft }}>{Math.min(idx + 1, effTotal)} / {effTotal}</span>}
      </header>

      {stage === 'play' && (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 5, marginTop: short ? 2 : 6 }}>
          {Array.from({ length: effTotal }, (_, i) => (
            <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i < idx ? P.gold : i === idx ? P.cream : 'rgba(255,244,221,0.28)', transition: 'background 300ms' }} />
          ))}
        </div>
      )}

      <main style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: short ? '4px 12px 8px' : '8px 16px 20px', boxSizing: 'border-box',
        // The scratch drawer takes real height out of this column. On a short
        // landscape phone (measured 740×360) the board + answers no longer fit the
        // 230px that leaves, so let the play area scroll rather than push a tile
        // under the paper. Nothing changes while the drawer is closed.
        ...(scratch ? { overflowY: 'auto' as const } : null) }}>

        {stage === 'start' && (
          <CenterFill>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
              <Ticket P={P}>
                <TicketHead P={P} n={1} label={config.ticketLabel} />
                <Row P={P} title={config.start.ticket.title} badge={config.start.ticket.badge} tone={config.start.ticket.tone} />
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
              roomy={roomy || short}
              portrait={portrait}
              explanation={<ExplanationPanel P={P} overview={config.overview} read onDone={() => setStage('demo')} />}
              illustration={<Scene palette={P} task={introScript.task} value={introScript.initial} stepIndex={0} frameCount={1} ended={false} />}
            />
          ) : (
            <CenterFill>
              <OverviewCard P={P} overview={config.overview} onDone={() => setStage('demo')} />
            </CenterFill>
          )
        )}

        {stage === 'demo' && config.tutorial && (
          <TutorialPlayer config={config} script={config.tutorial} roomy={roomy} short={short} portrait={portrait} onDone={afterDemo} />
        )}

        {/* padCentered is for the PAD path ONLY. It makes CenterFill `flex: 0 0 auto`,
            which is exactly what an instrument must never be: FitSlot bounds the
            instrument by measuring a parent with a DEFINITE height, and a content-sized
            parent has none — so FitBox stays at scale 1 and the column overflows a
            centred fixed-height frame in BOTH directions. Measured at 1280×800 on THE
            SHOT: board top −69px (the question cut off above the viewport) and the
            commit button entirely off screen. The board is in FLOW for BOTH types
            complaint; an instrument then centres inside its own bounded band. */}
        {inOrder && task && value != null && (
          <PlayFrame short={short} padCentered={!short && padChoices.length > 0}>
            {/* the QUESTION lives on the chalkboard — top-left on a roomy screen,
                across the top on mobile — and is the same everywhere (universal). */}
            {/* The pinned top-left board is an ABSOLUTE overlay — it shares its
                horizontal band with the centred column and only clears it because a
                tall INSTRUMENT leaves vertical room beside it. Two cases where that
                assumption fails, so the board goes back in flow (stacked) instead:
                  • short frame (e.g. 1024×400) — the centred controls ride through it;
                  • a pad question — a row of tap-choices isn't a tall instrument, it
                    sits mid-screen right under the board (measured 9px clearance at
                    1280×800, i.e. one wrapped line from colliding).
                  • a TALL frame (vh ≥ 1100) — an in-flow board costs the instrument
                    nothing there (measured scale 1.000 for every chapter at
                    1900×1200), and it reads centred rather than stranded in the
                    corner, which is what the founder asked for.
                An instrument on a roomy LAPTOP-height screen keeps the pinned board:
                in flow it costs that instrument 17–37% of its size (see useFrame). */}
            {/* PAUSED WORK — restored to the verified behaviour: the board stays
                PINNED top-left for instrument questions on a roomy screen.
                Centring it (founder request) means taking it out of this absolute
                overlay and into flow, which costs the instrument real height and was
                MEASURED pushing the commit button off-screen at laptop size.
                The unfinished fix was a `tall` gate (useFrame, innerHeight >= 1100 —
                derivation in the comment there): centre only where there is height to
                spare. That gate is written but NEVER VERIFIED — re-measure at
                1280×800 and 1440×900 before trusting it. */}
            <BoardSlot roomy={roomy && !short && !padChoices.length} short={short}>
              <QuestionBoard
                P={P}
                compact={short}
                testHooks={testHooks}
                cue="Solve it"
                prompt={task.prompt || task.title}
                context={task.context}
                instruction={padChoices.length ? (task.padInstruction ?? 'Work it out, then tap your answer.') : task.instruction}
                expr={task.badge}
                answer={task.showEquals === false ? undefined : (sub === 'active' ? '?' : config.revealText(task))}
                answerLabel={task.answerLabel}
                tone={sub === 'active' ? 'ask' : sub === 'sold' ? 'ok' : 'reveal'}
              />
            </BoardSlot>
            <CenterFill short={short} grow={short || padChoices.length === 0}>
              {/* Decorative on a short frame — the board's instruction must survive,
                  this label is what gets dropped when the height runs out. */}
              {stage === 'guided' && sub === 'active' && !short && (
                <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(12px, 1.2vw, 17px)', fontWeight: 800, letterSpacing: '0.14em', color: P.gold, textTransform: 'uppercase' }}>Try this one with me</div>
              )}
              {/* The INSTRUMENT column takes the whole leftover band (flex:1) so FitSlot
                  can scale it to fit; the PAD is auto-height and stays centred as-is. */}
              <div key={stage === 'guided' ? 'g' : idx} style={{ width: '100%', flex: padChoices.length ? undefined : 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px, 1vw, 16px)' }}>
                {padChoices.length ? (
                  // PER-TASK: a question that supplies pad choices is answered by
                  // tapping a number (and hides the instrument); one that doesn't
                  // falls through to its instrument, so a chapter can keep the
                  // illustration for the questions where it does the teaching.
                  sub !== 'sold' && (
                    <AnswerPad
                      P={P} choices={padChoices} compact={short} big={portrait} disabled={sub !== 'active' || busy}
                      reveal={sub === 'reveal' || sub === 'reteach'}
                      correct={padChoices.find((c) => config.grade(task, toV(c)))}
                      picked={picked ?? undefined}
                      onSubmit={(n) => { setPicked(n); (stage === 'guided' ? submitGuided : submit)(toV(n)) }}
                    />
                  )
                ) : (
                  <FitSlot max={portrait ? PORTRAIT_MAX : 1}>
                    <config.Instrument task={task} value={value} setValue={setValue} disabled={busy} reveal={sub === 'reveal' || sub === 'reteach'} palette={P} onCommit={stage === 'guided' ? submitGuided : submit} />
                    {/* Inside the FitSlot so the cue counts toward the measured column
                        height — otherwise it would push the scaled instrument back out.
                        Dropped on a short frame (same call as the "TRY THIS ONE WITH ME"
                        label above): it is a decorative gesture hint worth ~47px, and on
                        a 320px-tall frame that height is the difference between a
                        finger-sized commit button and a scaled-down one. The board's
                        instruction still tells the child what to do. */}
                    {stage === 'guided' && sub === 'active' && guidedList.length > 0 && !short && <HandCue P={P} kind={guidedList[guidedIdx.current].hand} />}
                  </FitSlot>
                )}
                {/* The chapter's hand cue describes its INSTRUMENT gesture ('drag',
                    'crank'…). On a padded question there is no instrument to drag, so
                    the cue must show the gesture the child can actually make. */}
                {padChoices.length > 0 && stage === 'guided' && sub === 'active' && guidedList.length > 0 && <HandCue P={P} kind="tap" />}
              </div>
            </CenterFill>
          </PlayFrame>
        )}
      </main>

      {/* Scratch paper — only where there is a question to work out. Sits AFTER main
          in the same flex column, so opening it shrinks the play area instead of
          covering it. `idx`/stage keys the page: a new question is a clean sheet. */}
      {inOrder && <ScribblePad P={P} resetKey={stage === 'guided' ? 'g' : idx} open={scratch} onToggle={setScratch} />}

      {/* Hand-off popup: a brief, legible "your turn" / "you solved it" flash at the
          moment control passes to the child and when they succeed. */}
      {cue && (
        // On a short frame the two-column play area leaves one genuinely free strip:
        // under the board, on the left. Centre-top sits on the question and
        // centre-bottom sits on the commit button, so the flash goes bottom-left.
        <div aria-live="polite" style={{ position: 'fixed', zIndex: 6, pointerEvents: 'none', ...(short ? { bottom: 4, left: 8 } : { top: 'clamp(60px, 12vh, 122px)', left: '50%', transform: 'translateX(-50%)' }) }}>
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
        /* An instrument that stacks a CONTEXT SCENE above its controls opts in with
           this class. FitBox scales the whole column uniformly, so on a short frame a
           200px scene above a 230px builder drags the ▲▼ steppers and the commit
           button down with it (measured 23×23 / 114×24 at 640×320). Capping only the
           scene — the part that is read, not touched — leaves the controls a bigger
           share of the same band. Tall frames are untouched. */
        @media (max-height: 470px) { .gk-scene-cap svg { max-height: 30vh; } }
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
  config, script, roomy, short, portrait, onDone,
}: {
  config: GameConfig<V, T>
  script: TutorialScript<V, T> | TutorialScript<V, T>[]
  roomy: boolean
  short: boolean
  portrait: boolean
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
    const out: { task: T; value: V; hand: HandKind; board: string[]; writingIndex: number; say: string }[] = []
    for (const sc of scripts) {
      let val = sc.initial
      let hnd = sc.hand
      const board: string[] = []
      for (const st of sc.steps) {
        if (st.value !== undefined) val = st.value as V
        if (st.hand) hnd = st.hand
        let writingIndex = -1
        if (st.board) { board.push(st.board); writingIndex = board.length - 1 }
        out.push({ task: sc.task, value: val, hand: hnd, board: [...board], writingIndex, say: st.say })
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
  const boardWindow = roomy || short ? BOARD_WINDOW : BOARD_WINDOW_STACKED
  const boardStart = Math.max(0, cur.board.length - boardWindow)
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
      <Blackboard P={P} lines={windowBoard} writingIndex={windowWriting} slideKey={boardStart} />
    </div>
  )

  // Illustrated chapters (all 12–18 games): keep the explanation on the LEFT for the
  // whole walkthrough, the baby-step board ABOVE the illustration on the right. On
  // mobile it stacks explanation → baby-step board → illustration, top to bottom.
  if (config.TutorialScene) {
    return (
      <TeachFrame
        roomy={roomy || short}
        portrait={portrait}
        P={P}
        collapsible
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

/** The pre-walkthrough SUMMARY card — the big picture before the baby steps. Milo
 *  speaks the plan while it is shown as a WORD-BY-WORD READ-ALONG: each word
 *  highlights as he says it, so the child can track where the sentence is going
 *  (feedback: highlight the word Milo is speaking). It rolls into the step-by-step
 *  walkthrough on its own once Milo finishes reading. */
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

/** Visit every word in a ReactNode tree, in reading order. */
function walkWords(node: React.ReactNode, visit: (w: string) => void): void {
  if (node == null || typeof node === 'boolean') return
  if (typeof node === 'string' || typeof node === 'number') {
    for (const w of splitWords(String(node))) visit(w.word)
    return
  }
  if (Array.isArray(node)) { for (const c of node) walkWords(c, visit); return }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) walkWords(node.props.children, visit)
}

/** Re-render a ReactNode with each word wrapped so it writes on letter-by-letter,
 *  hidden until `next()`'s index has been spoken. Element wrappers are preserved. */
function mapWords(node: React.ReactNode, next: () => number, hi: number): React.ReactNode {
  if (node == null || typeof node === 'boolean') return node
  if (typeof node === 'string' || typeof node === 'number') {
    // Keep the ORIGINAL spacing between words (re-adding a space after every word puts
    // a gap before punctuation that follows a <strong>: "below zero ." ).
    const text = String(node)
    let at = 0
    const out = splitWords(text).map((w, i) => {
      const gap = text.slice(at, w.start)
      at = w.end
      const shown = next() <= hi
      return (
        <React.Fragment key={i}>
          {gap}
          <span className={shown ? 'mb-word-write' : undefined}
            style={shown ? ({ ['--n' as string]: w.word.length }) : { visibility: 'hidden' }}>{w.word}</span>
        </React.Fragment>
      )
    })
    return <>{out}{text.slice(at)}</>   // keep any trailing whitespace before the next leaf
  }
  if (Array.isArray(node)) return node.map((c, i) => <React.Fragment key={i}>{mapWords(c, next, hi)}</React.Fragment>)
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return React.cloneElement(node, undefined, mapWords(node.props.children, next, hi))
  }
  return node
}

/** The overview SUMMARY (explanation) rendered on its OWN chalkboard — a slate panel
 *  matching the baby-step board. It is PERSISTENT through the whole teaching phase:
 *  it sits on the left (or on top, on mobile) and stays put while the walkthrough
 *  runs on the separate baby-step board. When `read` is true (the intro), Milo speaks
 *  the summary and calls `onDone` when finished (which rolls into the walkthrough);
 *  when `read` is false (during the walkthrough) it just shows the plan, silent, so
 *  the two chalkboards don't talk over each other. */
function ExplanationPanel({ P, overview, read, onDone }: {
  P: Palette
  overview: NonNullable<GameConfig<unknown, BaseTask>['overview']>
  read: boolean
  onDone: () => void
}) {
  // Ref so a new onDone identity never restarts the narration; it fires once when the
  // summary finishes (real speech OR the blocked-audio fallback), then the walkthrough
  // starts automatically.
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const points = useMemo(() => overview.points ?? [], [overview.points])

  // Milo speaks EXACTLY what the board says (not the separate `say` summary), and each
  // word writes itself on letter-by-letter as he says it. The board lines are ReactNodes
  // (they carry <strong> on the math), so words are counted per text leaf and the spoken
  // passage is those same tokens joined — the two can never drift apart.
  const { spoken, starts } = useMemo(() => {
    const starts: number[] = []
    const words: string[] = []
    for (const part of [overview.problem, ...points]) {
      starts.push(words.length)
      walkWords(part, (w) => { words.push(w) })
    }
    return { spoken: words.join(' '), starts }
  }, [overview.problem, points])

  const [hi, setHi] = useState(-1)
  useEffect(() => {
    if (!read) { setHi(Infinity); return }
    setHi(-1)
    const cancel = speakWithHighlight(spoken, {
      onWord: (i) => setHi((h) => (i < 0 ? Infinity : Math.max(h, i))),
      onDone: () => { setHi(Infinity); doneRef.current() },
    })
    return () => cancel()
  }, [spoken, read])

  /** One board line, revealed word-by-word — markup (<strong> …) preserved. */
  const line = (node: React.ReactNode, idx: number) => {
    let n = starts[idx]
    return mapWords(node, () => n++, hi)
  }

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

  return shell(
    <>
      <p style={{ margin: 0, fontFamily: 'var(--font-chalk)', fontSize: 'clamp(22px, 2.5vw, 34px)', fontWeight: 700, lineHeight: 1.28, color: '#f6faf0', textShadow: '0 0 1px rgba(255,255,255,0.5), 0 0 8px rgba(214,240,206,0.35)' }}>{line(overview.problem, 0)}</p>
      {points.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1vh, 12px)' }}>
          {points.map((pt, i) => (
            <li key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'clamp(7px,0.9vw,11px)', alignItems: 'baseline', fontFamily: 'var(--font-chalk)', fontSize: 'clamp(18px, 1.9vw, 25px)', lineHeight: 1.35, color: '#dbe9d6' }}>
              <span aria-hidden style={{ color: P.gold, fontWeight: 900, fontSize: '0.9em' }}>▸</span>
              <span>{line(pt, i + 1)}</span>
            </li>
          ))}
        </ul>
      )}
    </>,
  )
}

// ── universal layout helpers ──────────────────────────────────────────────────
/** roomy = horizontal room (laptop/desktop) → pin the chalkboard top-left; below
 *  that it stacks across the top (phones/tablets).
 *  short = a SHORT frame (landscape phone). Every size in this shell is a
 *  clamp(px, vw, px), so a wide-but-short frame gets near-desktop sizes with no
 *  vertical room for them — the board and the answer pad then collide. `short`
 *  is the repo's standard gate (see the 3–11 story chapters) for dropping those
 *  px floors and tightening the stack. */
/*  tall = enough height that taking the board OUT of the overlay and putting it in
 *  FLOW above the instrument costs the instrument nothing. Measured: with the board
 *  pinned, the instrument band is 681–799px at 1280×800 / 1440×900 and every chapter
 *  renders at scale 1.0; in flow the same band is 392–548px and the four tallest
 *  instruments drop to 0.63–0.83 (THE SHOT 727px natural → 0.699 at 1280×800). The
 *  band in flow is about `vh − 312`, so 1100 is where the tallest instrument still
 *  fits at 1.0. At ≥1900×1200 every chapter measured 1.000 in flow. */
function useFrame(): { roomy: boolean; short: boolean; tall: boolean; portrait: boolean } {
  const [f, setF] = useState({ roomy: false, short: false, tall: false, portrait: false })
  useEffect(() => {
    const calc = () => setF((p) => {
      // PORTRAIT is a shape, not a size: taller than it is wide by a clear margin.
      // Two things follow, and both are about the fact that every size in this shell
      // is `clamp(px, vw, px)` — WIDTH-derived, with no vh term anywhere:
      //   • a portrait frame lands on the clamp MINIMUM everywhere while its height
      //     goes unused (measured 390×844: tap buttons 76×60 at 24px type, with
      //     204px of dead space below them), so FitSlot is allowed to scale UP and
      //     the tap pad gets a vh term. See `portraitMax` and AnswerPad's `big`.
      //   • `roomy` PINS the chalkboard into the top-left corner, which is right on a
      //     laptop and wrong on a portrait tablet — measured 834×1194, the board sat
      //     in a corner with the bottom third of the screen empty. A portrait frame
      //     is never roomy, so it stacks the board above the interactive instead.
      const portrait = window.innerHeight >= window.innerWidth * 1.2
      const n = {
        roomy: window.innerWidth >= 820 && !portrait,
        short: window.innerHeight < 470,
        tall: window.innerHeight >= 1100,
        portrait,
      }
      return p.roomy === n.roomy && p.short === n.short && p.tall === n.tall && p.portrait === n.portrait ? p : n
    })
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])
  return f
}

/** The chalkboard slot — pinned top-left on a roomy screen (absolute, out of flow
 *  so the interactive stays centred), or stacked full-width across the top on
 *  mobile. Universal: present in every chapter, in both explanation and practice. */
function BoardSlot({ roomy, short, children }: { roomy: boolean; short?: boolean; children: React.ReactNode }) {
  if (roomy) {
    return <div style={{ position: 'absolute', top: 'clamp(4px, 1vh, 18px)', left: 'clamp(10px, 1.6vw, 28px)', width: 'clamp(280px, 30vw, 420px)', zIndex: 3 }}>{children}</div>
  }
  // On a SHORT frame the board is the LEFT column of PlayFrame's two-column row —
  // a fixed, scrollable strip so the long context/instruction lines can never eat
  // the interactive's height (they wrap downward inside their own column instead).
  if (short) {
    return <div style={{ width: 'clamp(210px, 38vw, 400px)', flexShrink: 0, alignSelf: 'stretch', overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>{children}</div>
  }
  // Tall frame. A PAD question routes here even on a desktop (see the BoardSlot
  // call site: `roomy && !padChoices.length`) — there is no instrument to pin the
  // board beside, so it centres instead.
  // NB widening this wrapper does NOT widen the board: QuestionBoard caps itself
  // at clamp(280px, 40vw, 460px) (gameKit.tsx:605). That clamp is the real knob,
  // and it is shared by every chapter and every stage — change it deliberately.
  return <div style={{ width: '100%', maxWidth: 480, display: 'flex', justifyContent: 'center', margin: '0 auto 10px' }}>{children}</div>
}

/** The scored/guided play area. On a tall frame it stays a COLUMN (board above or
 *  pinned top-left, interactive centred below) — unchanged.
 *
 *  On a SHORT frame (landscape phone) it becomes a two-column ROW: board left,
 *  interactive right. Stacking there gave the board ~50% of a 320px screen and left
 *  the instrument column ~130px, which FitBox honestly scaled to fit — down to 12px
 *  ▲ steppers and a 61×13 commit button, i.e. unusable by a finger. The row spends
 *  the horizontal space that was empty on both sides instead, and being in FLOW it
 *  cannot overlap the way the pinned absolute board could. */
function PlayFrame({ short, padCentered, children }: { short: boolean; padCentered?: boolean; children: React.ReactNode }) {
  // A PAD question on a tall frame has no instrument, so the board sat at the top
  // of the flow and the pad centred in everything left over — measured a 379px
  // dead band between them at 1900×1200. Centre the two as ONE group instead.
  if (!short && padCentered) {
    return (
      <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(14px, 2.2vh, 40px)' }}>{children}</div>
    )
  }
  if (!short) return <>{children}</>
  return (
    <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 'clamp(8px, 1.4vw, 20px)' }}>{children}</div>
  )
}

/** The centred interactive column — instrument in the middle, its action button
 *  directly below. Fills the space left of / beneath the board. */
function CenterFill({ children, short, grow = true }: { children: React.ReactNode; short?: boolean; grow?: boolean }) {
  // `short` = the right column of PlayFrame's row: take the leftover width, no auto
  // margins (the row already places it) and no max-width cap to fight the flex basis.
  // grow=false: PlayFrame is centring board+pad as one group, so this column must
  // size to its content — a flex:1 child would absorb the free space and defeat it.
  return <div style={{ flex: grow ? 1 : '0 0 auto', width: short ? undefined : '100%', minWidth: 0, maxWidth: short ? undefined : 'clamp(560px, 66vw, 820px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(10px, 1vw, 16px)', margin: short ? undefined : '0 auto', minHeight: 0, padding: '2px 0 6px', boxSizing: 'border-box' }}>{children}</div>
}

/** Scale-to-fit slot for the INSTRUMENT column (the instrument + its own commit
 *  button, which every instrument renders itself).
 *
 *  Instrument sizes are vw/vmin-based with px floors, so on a SHORT frame they stay
 *  near their desktop height while the band between the board and the bottom of the
 *  screen collapses. CenterFill centres with `justify-content: center`, and a flex
 *  item that can't shrink below its content overflows BOTH ways — up under the
 *  question board and down past the commit button. (`safe center` / `flex-start`
 *  only move the overflow to one end; the button then leaves the screen.)
 *
 *  Rather than give ~10 shared instruments + ~9 in-file ones their own vh terms, this
 *  reuses the 3–11 chapters' `FitBox`: measure the natural column, scale it to the
 *  band. `max: 1` — never enlarge, so every frame that already fits is untouched.
 *  Instrument pointer math normalises by getBoundingClientRect(), which reflects the
 *  CSS transform, so dragging/tapping stays accurate under scale. */
const Col = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>{children}</div>
)

/** How far FitSlot may ENLARGE on a portrait frame. 1.5 is not a taste number: at
 *  390×844 the instrument column measures ~62% of the band it is given, and 1.5×
 *  fills it without pushing the commit button off the bottom. Landscape keeps
 *  max 1 — a frame that already fits must stay untouched. */
const PORTRAIT_MAX = 1.5

function FitSlot({ children, max = 1 }: { children: React.ReactNode; max?: number }) {
  const box = useRef<HTMLDivElement>(null)
  const [av, setAv] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setAv({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {av.h > 0
        ? <FitBox availW={av.w} availH={av.h} max={max}><Col>{children}</Col></FitBox>
        : <Col>{children}</Col>}
    </div>
  )
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
function TeachFrame({ roomy, portrait, explanation, board, illustration, controls, P, collapsible }: {
  roomy: boolean
  /** Let the scene ENLARGE into a portrait frame's spare height — same call as the
   *  practice instrument (see useFrame). Landscape keeps max 1. */
  portrait?: boolean
  explanation?: React.ReactNode
  board?: React.ReactNode
  illustration: React.ReactNode
  controls?: React.ReactNode
  P?: Palette
  // Collapse the explanation into a tap-to-review dropdown (mobile walkthrough only):
  // Milo has already read THE PLAN, so keeping it fully expanded above the baby-step
  // board just squeezes the illustration to nothing on a phone.
  collapsible?: boolean
}) {
  const illo = (
    <div className="teach-illo" style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {/* Same FitSlot as the practice instrument. `.teach-illo svg{max-height:100%}`
          only caps a scene whose ROOT is the svg; the 15–16 scenes wrap the svg in a
          column of readouts, so on a short frame the box was 6–115px tall around
          120–200px of content and the picture was simply cut off. FitBox measures the
          whole column and scales it (max 1 — a frame that already fits is untouched). */}
      <FitSlot max={portrait ? PORTRAIT_MAX : 1}>{illustration}</FitSlot>
    </div>
  )
  const rightCol = (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 'clamp(8px, 1.4vh, 18px)', overflow: 'hidden' }}>
      {board && <div style={{ width: '100%', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{board}</div>}
      {illo}
      {controls && <div style={{ flexShrink: 0 }}>{controls}</div>}
    </div>
  )

  // `roomy` here means "lay it out in two columns": true on a wide screen, and also
  // on a SHORT one, where the vertical stack has no height left for the illustration.
  if (roomy && explanation) {
    return (
      <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 'min(94vw, 1260px)', margin: '0 auto', display: 'flex', gap: 'clamp(16px, 2.2vw, 36px)', alignItems: 'stretch', overflow: 'hidden' }}>
        <div style={{ width: 'clamp(200px, 30vw, 400px)', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', minHeight: 0, overflow: 'hidden' }}>{explanation}</div>
        {rightCol}
      </div>
    )
  }

  // mobile / no-explanation → single column, explanation + board BEFORE the illustration
  return (
    <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 540, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 1.4vh, 16px)', overflow: 'hidden' }}>
      {explanation && (collapsible ? (
        <details className="plan-toggle" style={{ width: '100%', flexShrink: 0 }}>
          <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-numeric)', fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: P?.gold ?? '#e0b64a', background: P?.glass ?? 'rgba(255,255,255,0.06)', border: `1px solid ${P?.glassBorder ?? 'rgba(255,255,255,0.14)'}`, borderRadius: 10, padding: '8px 14px' }}>
            <span>The plan</span>
            <span aria-hidden style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 5 }}>
              tap to review <span className="plan-arrow" style={{ display: 'inline-block', transition: 'transform 160ms ease' }}>▾</span>
            </span>
          </summary>
          <div style={{ marginTop: 8 }}>{explanation}</div>
        </details>
      ) : (
        <div style={{ width: '100%', flexShrink: 0 }}>{explanation}</div>
      ))}
      {board && <div style={{ width: '100%', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{board}</div>}
      {illo}
      {controls && <div style={{ flexShrink: 0 }}>{controls}</div>}
    </div>
  )
}
