'use client'
/**
 * Plays one new-flow lesson (see ./script.ts for the flow). Every transition is a pure function
 * from script.ts; this file only draws the state (in ./Frame) and speaks on the child's own taps.
 *
 * Look: the founder's SampleUI template. Its red wrong-answer banners, locks, emoji and scores are deliberately NOT
 * carried over (a wrong answer is never marked wrong; difficulty and scores stay invisible).
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { speak, speakSteps, stopSpeech } from '@/infra/useMiloSpeaker'
import { setSceneVoice, prefetchClips, setClipRate } from '@/infra/voiceClipPlayer'
import { useLatestRef } from '@/shared/hooks/useLatestRef'
import { lessonVoice } from '@/infra/storage/voicePref'
import {
  START, next, back, check, hintsFor, wonFor, afterWorked, toPractice, nextPractice, replayLesson, currentProblem, solutionOf, stepsOf, showAnswer, outcomeOf, SAY,
  type FlowState, type Lesson,
} from './script'
import { rng, freshSeed, beginRun, advance, startLevel, reviewTopic, toSaved, fromSaved, runDone, FRESH, type Run, type Pause } from './adaptive'
import { ladderOf, ladderAnswers } from './ladders'
import { findLesson } from './modules'
import { loadStanding, saveStanding } from '@/infra/storage/lessonStanding'
import { loadRun, saveRun } from '@/infra/storage/lessonRun'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { syncLesson, syncRun } from '@/infra/storage/lessonSync'
import { C } from './sessionCopy'
import type { Nudge } from './nudge'
import { track } from '@/infra/analytics'
import { markNudgeShown } from '@/infra/storage/nudgeSeen'
import { Pic, tapCue, pill, INK } from './Pictures'
import { Ink, wrap } from './Diagrams'
import { Chalkboard } from './Chalkboard'
import { beatMs } from './chalk'
import { Frame, stage, bubble, primary, hint, idea, cue, tick, right } from './Frame'
import { AnswerInput, ready, needsSign, needsWhole } from './AnswerInput'
import { PracticeLayout, hintBtn } from './PracticeLayout'
import { Feedback } from './Feedback'

/** After her last line on a teaching screen, how long the finished board stays before the lesson moves on. Founder,
 * 2026-09-20: 3 s then 2.3 s both felt long — and the screen now carries a bar that says where it is, so the wait
 * does not have to be long enough to be understood on its own. */
const HOLD_MS = 1500
/** A breath between two of her sentences. The clips carry ~0.16 s of their own (trimmed), so this makes ~0.45 s: the
 * old ~0.8 s stop sounded generated, and none at all (2026-09-19) ran the sentences together. */
const GAP_MS = 300
/** Her clips play a little slower than rendered, pitch kept (founder, 2026-09-20: "Stevie khud tez bolti hai"). */
const LESSON_RATE = 0.9

/**
 * `learnerId` and `earlier` (the ids of this module's topics before this one) feed adaptive practice: a laddered lesson
 * (see ./adaptive) asks generated problems that follow the child, and may bring back one earlier topic that is not mastered.
 */
export function LessonPlayer({ lesson, learnerId = null, earlier = [], moduleDone, onFinish, onExit, nudge = null, onPractise }: {
  lesson: Lesson; learnerId?: string | null; earlier?: readonly string[]
  /** The soft prerequisite card (./nudge), decided by the page; shown before anything else, once. */
  nudge?: Nudge | null
  /** "Practise <previous topic> first". */
  onPractise?: (lessonId: string) => void
  /** True once every topic of this lesson's module (that the child has) is finished — the badge is shown then, and only then. */
  moduleDone?: () => boolean
  /** The topic is done: mastered, or DONE_AFTER problems answered (a laddered topic); the 5 problems (one without). */
  onFinish: () => void; onExit: () => void
}) {
  const [s, setS] = useState<FlowState>(START)
  const [taps, setTaps] = useState(0)
  const [value, setValue] = useState('')
  const [replay, setReplay] = useState(0)
  // Founder, 2026-09-20: she reads every lesson — no "Read it to me" to find first. The clip needs a gesture to start
  // (autoplay), and Screen 1's own button is it; a lesson opened straight from a link speaks from Screen 2 on.
  const audio = true
  const [asked, setAsked] = useState(false)   // Hint tapped on a practice problem
  // Her lines play from recorded clips in this grade's voice (lines without a clip still fall back to browser speech).
  useEffect(() => {
    setSceneVoice(lessonVoice(lesson.id))
    setClipRate(LESSON_RATE)
    // Download her lines now, so one sentence runs into the next instead of waiting on a download between them.
    prefetchClips([...lesson.screens.flatMap(sc => sc.beats?.map(b => b.say) ?? []), SAY.turn(lesson), lesson.bigIdea])
    return () => { setSceneVoice(null); setClipRate(1) }
  }, [lesson])
  const ladder = ladderOf(lesson.id)
  const [run, setRun] = useState<Run | null>(null)
  const r = useRef(rng(freshSeed())).current
  // Short sessions (founder, 2026-09-24): a choice after every 5 answers and at mastery; the run is saved after every
  // answer, so Take a break — or closing the app — continues from exactly there. A saved run greets the child with a
  // choice to go straight back to practice (never an automatic skip of the lesson).
  const [welcome, setWelcome] = useState(() => !!ladder && !!loadRun(learnerId, lesson.id))
  // Held in state from the first render: marking it shown makes the page's next answer "no card", and a re-render must
  // not snatch the card away while the child is reading it.
  const [nudging, setNudging] = useState(nudge)
  useEffect(() => { if (nudging && learnerId) markNudgeShown(learnerId, lesson.id) }, [nudging, learnerId, lesson.id])
  const [pause, setPause] = useState<Pause>(null)
  const [session, setSession] = useState({ answered: 0, points: 0, mastered: false })
  const keep = (next: Run) => { setRun(next); saveRun(learnerId, lesson.id, toSaved(next)); syncRun(learnerId, lesson.id) }
  const firstTry = useRef(false)              // Screen 8 solved with no miss: adaptive practice starts one level up

  // The beat clock. A teaching screen with `beats` reveals itself line by line — her words on the right, what she
  // puts on the board on the left — so BOTH columns read `shown`, and it has to live above the early returns below.
  const beats = s.mode === 'lesson' ? lesson.screens[s.screen].beats : undefined
  const [shown, setShown] = useState(1)
  // Founder, 2026-09-19: a teaching screen moves on by itself once her last line is done, HOLD_MS later so the board
  // can finish and the child can take it in. ← Back pauses it — a child who went back to look again is not pulled
  // forward — and Next turns it back on. From Screen 2 on: Screen 1 waits for the child to tap its question, and
  // Screen 7 runs on into "Your turn" (founder, 2026-09-20).
  const [autoOn, setAutoOn] = useState(true)

  const say = (text: string, on = audio) => { if (on && text) speak(text) }
  const go = (n: FlowState, spoken?: string) => {
    if (n.mode !== s.mode || n.screen !== s.screen || n.twin !== s.twin || n.practice !== s.practice) { setTaps(0); setValue(''); setAsked(false) }
    setS(n)
    if (spoken) say(spoken)
    // A laddered topic is done by its run (see nextProblem); its 'finish' screen is only the break.
    if (n.mode === 'finish' && s.mode !== 'finish' && !ladder) onFinish()
  }
  const screenSay = SAY.screen
  // Screen 1 has no beats, so the beat clock never speaks it — and since the audio button went (2026-09-20) nothing
  // else did either, so the lesson opened in silence. Say it on arrival: the first mount, ← Back to it, and "Watch the
  // lesson again". ⚠️ A browser only allows sound after a tap, so this is heard when the child came from the topic
  // list (their tap) and not on a lesson opened cold from a link — where Screen 1's own button is the first tap.
  const line1 = s.mode === 'lesson' && s.screen === 0 && !welcome && !nudging ? screenSay(lesson.screens[0]) : ''
  useEffect(() => { if (line1) speak(line1) }, [line1, replay])

  const autoNext = useLatestRef(() => {
    if (!autoOn || s.mode !== 'lesson' || s.screen < 1) return
    const n = next(s)
    go(n, n.mode === 'turn' ? SAY.turn(lesson) : undefined)
  })
  useEffect(() => {
    if (!beats) return
    setShown(1)
    // Her voice paces it when the child has audio on; when they don't, reading time does — a flat beat is far too
    // fast for a long line. Either way the lines and the board move together.
    let hold: ReturnType<typeof setTimeout> | undefined
    if (audio) {
      const stop = speakSteps(beats.map(b => b.say), { gapMs: GAP_MS, onStep: i => setShown(i + 1), onDone: () => { hold = setTimeout(() => autoNext.current(), HOLD_MS) } })
      return () => { stop(); clearTimeout(hold) }
    }
    let t = 0
    const ids = beats.map((b, i) => { const at = t; t += beatMs(b.say); return setTimeout(() => setShown(i + 1), at) })
    ids.push(setTimeout(() => autoNext.current(), t + HOLD_MS))
    return () => ids.forEach(clearTimeout)
  }, [beats, audio, replay, autoNext])

  // Screen 8 solved (or the twin's worked steps seen): straight on to practice. Founder's call, 2026-09-19: a right answer
  // gets the green check at the top and moves on — no badge or sticker screen per topic; the badge waits for the module.
  const startPractice = () => {
    if (ladder) {
      const saved = loadRun(learnerId, lesson.id)
      if (saved) {
        // Back where the child stopped: the same problem, the same count, the standings as they are now.
        setRun(fromSaved(saved, loadStanding(learnerId, lesson.id) ?? FRESH, saved.review ? loadStanding(learnerId, saved.review) : null))
        return go({ ...toPractice(s), practice: saved.asked })
      }
      const standing = startLevel(loadStanding(learnerId, lesson.id), firstTry.current, ladder.length)
      const review = reviewTopic(earlier, id => lessonDone(learnerId, id), id => loadStanding(learnerId, id), ladderOf)
      keep(beginRun(lesson.id, ladder, standing, r, review))
    }
    go(toPractice(s))
  }
  // Take a break: the celebration, if anything was answered this time; straight back to the topics if not.
  const takeBreak = () => { stopSpeech(); setPause(null); if (session.answered === 0) onExit(); else go({ ...s, mode: 'finish', misses: 0, feedback: null }) }
  const won = s.mode === 'won'
  useEffect(() => {
    if (!won) return
    // A child who did not solve the twin gets no check: nothing to celebrate, so no pause either.
    const id = setTimeout(startPractice, wonFor(lesson, s).helped ? 0 : 1500)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once per arrival on the won state, with that render's state
  }, [won])


  // "Didn't get it?" on every screen, for a signed-in child only (the row belongs to a learner). Opening it pauses the
  // lesson: her voice stops and the screen does not move on while the child is choosing.
  const where = s.mode === 'lesson' ? `${s.screen + 1}` : s.mode === 'turn' || s.mode === 'won' ? '8' : s.mode === 'practice' ? `p${s.practice + 1}` : '9'
  const feedback = learnerId
    ? <Feedback key={where} learnerId={learnerId} lessonId={lesson.id} screen={where} onOpen={() => { stopSpeech(); setAutoOn(false) }} />
    : undefined

  const problem = s.mode === 'practice' && run ? run.current.problem : currentProblem(lesson, s)
  // A review problem comes from an earlier topic: its own big idea and lesson, not this one's.
  const from = run && s.mode === 'practice' && run.current.from !== lesson.id ? findLesson(run.current.from)?.lesson ?? null : null
  const bigIdea = from?.bigIdea ?? lesson.bigIdea
  // The answer box's shape is the lesson's, never the problem's (see AnswerInput). A ladder's answers are sampled.
  const sampled = useMemo(() => (ladder ? ladderAnswers(ladder) : []), [ladder])
  const all = [lesson.turn, lesson.turn.twin, ...lesson.practice.map(x => x.problem)].map(solutionOf).concat(sampled)
  const box = problem && <AnswerInput answer={solutionOf(problem)} value={value} onChange={setValue} signed={needsSign(all)} mixed={needsWhole(all)} />

  if (nudging) {
    // A nudge, never a lock: both buttons are fine, "anyway" goes straight in with nothing else asked.
    const anyway = () => { track('nudge_went_anyway', { lesson: lesson.id, prereq: nudging.prev.id }); setNudging(null) }
    return (
      <Frame crumb={lesson.title} at={0} total={9} title={lesson.title}
        picture={<div style={{ ...stage, justifyContent: 'center', gap: 12 }}>
          <b style={{ fontSize: 20, color: INK }}>{nudging.prev.title}</b>
          <div role="img" aria-label={C.progressLabel(nudging.prev.title)}
            style={{ height: 26, borderRadius: 999, border: `3px solid ${INK}`, background: '#fff', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round(nudging.progress * 100)}%`, minWidth: 18, background: '#ffd166' }} />
          </div>
        </div>}
        words={<p style={bubble}>{C.nudge(nudging.prev.title, lesson.title)}</p>}
        back={<button type="button" style={hintBtn} onClick={() => onPractise?.(nudging.prev.id)}>{C.practiseFirst(nudging.prev.title)}</button>}
        action={<button type="button" style={primary} onClick={anyway}>{C.goAnyway(lesson.title)}</button>}
        exit={{ label: '← Topics', onClick: () => { stopSpeech(); onExit() } }} />
    )
  }

  if (welcome) {
    return (
      <Frame crumb={lesson.title} at={7} total={9} title={C.welcomeTitle}
        picture={<div style={{ ...stage, alignItems: 'center' }}><span style={{ fontSize: 96 }} aria-hidden>⭐</span></div>}
        words={<p style={bubble}>{C.spotSaved}</p>}
        back={<button type="button" style={hintBtn} onClick={() => setWelcome(false)}>{C.watchFirst}</button>}
        action={<button type="button" style={primary} onClick={() => { setWelcome(false); startPractice() }}>{C.keepPractising}</button>}
        exit={{ label: '← Topics', onClick: () => { stopSpeech(); onExit() } }} />
    )
  }

  // A lesson's 5 practice problems: the practice screen (problem left, scratch pad right), shared with mixed practice.
  // Hint shows the big idea without counting as a miss; a miss shows it too; a second miss shows the worked steps.
  if (s.mode === 'practice' && problem) {
    const worked = s.feedback === 'worked', answering = s.feedback !== 'right' && !worked
    const submit = () => {
      if (!ready(solutionOf(problem), value)) return
      const n = check(lesson, s, value, problem)
      go(n, n.feedback === 'idea' ? bigIdea : n.feedback === 'right' ? SAY.right : n.feedback === 'worked' ? SAY.worked : undefined)
      if (n.feedback !== 'right') setValue('')   // a wrong answer must not sit there to be re-submitted
    }
    // Laddered: no "of 5" — how many problems depends on the child, and the count must not read as a score.
    const nextProblem = () => {
      if (!run || !ladder) return go(nextPractice(s))
      const o = outcomeOf(s), outcome = asked && o === 'first' ? 'second' : o
      const moved = advance(run, lesson.id, ladderOf, outcome, r)
      for (const [id, st] of moved.saved) { saveStanding(learnerId, id, st); syncLesson(learnerId, id, outcome) }
      keep(moved.run)
      // The points this answer earns, by docs/new-flow/points.md, for the break screen. The database decides the real
      // ones. ponytail: the +15/+10 bonuses are counted only when the topic was not done before, so a re-mastery is
      // never over-counted; a first mastery after "done by 12 answers" is under-counted by 15.
      const was = lessonDone(learnerId, lesson.id)
      const before = (id: string) => (id === lesson.id ? run.standing : run.review?.standing ?? FRESH)
      const gained = (outcome === 'first' ? 2 : 1) + moved.saved.filter(([id, st]) => st.level > before(id).level).length * 3
        + (!was && runDone(moved.run) ? 10 : 0) + (!was && moved.pause === 'mastered' ? 15 : 0)
      if (runDone(moved.run) && !was) onFinish()
      setSession(x => ({ answered: x.answered + 1, points: x.points + gained, mastered: x.mastered || moved.pause === 'mastered' }))
      setPause(moved.pause)
      go({ ...s, practice: s.practice + 1, misses: 0, feedback: null })
    }
    const of = ladder ? '' : ' of 5'
    return (
      <PracticeLayout corner={lesson.title} crumb={`Practice ${s.practice + 1}${of}`} title={`Problem ${s.practice + 1}${of}`}
        exitLabel={ladder ? C.takeBreak : undefined}
        onExit={ladder ? takeBreak : () => { stopSpeech(); onExit() }} pad padKey={s.practice} feedback={feedback}>
        {pause && <Checkpoint text={pause === 'mastered' ? C.mastered : C.checkpoint(5)} onKeep={() => setPause(null)} onBreak={takeBreak} />}
        <p style={{ ...bubble, fontWeight: 700 }}>{problem.text}</p>
        <div style={stage}>
          <Pic p={problem.picture} scratch={{ taps, onTap: () => setTaps(t => t + 1) }} />
          {tapCue(problem.picture) && <p style={{ ...cue, ...(taps === 0 ? { animation: 'lp-nudge 1.6s ease-in-out 3' } : {}) }}>{tapCue(problem.picture)}</p>}
          {taps > 0 && <button type="button" style={{ ...pill, alignSelf: 'center' }} onClick={() => setTaps(0)}>Clear picture</button>}
        </div>
        {answering && (
          <form id="lp-answer" onSubmit={e => { e.preventDefault(); submit() }} style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <b style={{ fontSize: 22 }}>Your answer</b>
            {box}
          </form>
        )}
        {(s.feedback === 'idea' || (asked && answering)) && <p style={idea}>{bigIdea}</p>}
        {s.feedback === 'right' && <p style={right}><span style={tick} aria-hidden>✓</span>Right! The answer is {showAnswer(solutionOf(problem))}.</p>}
        {worked && <>
          <div style={hint}>
            <b>Here&apos;s how this one works:</b>
            <ol style={{ margin: '6px 0 0', paddingLeft: 24 }}>{stepsOf(problem).map(t => <li key={t}>{t}</li>)}</ol>
          </div>
          {from
            ? <Link href={`/lesson?id=${from.id}`} style={{ ...pill, alignSelf: 'flex-start', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Watch the lesson: {from.title}</Link>
            : <button type="button" style={{ ...pill, alignSelf: 'flex-start' }} onClick={() => go(replayLesson(s))}>Watch the lesson again</button>}
        </>}
        <div className="pr-foot">
          {answering ? <button type="button" style={hintBtn} onClick={() => setAsked(true)} disabled={asked || s.feedback === 'idea'}>Hint</button> : <span />}
          {answering
            ? <button type="submit" form="lp-answer" style={primary} disabled={!ready(solutionOf(problem), value)}>Check</button>
            : <button type="button" style={primary} onClick={nextProblem}>{!ladder && s.practice === 4 ? 'Finish' : 'Next problem'}</button>}
        </div>
      </PracticeLayout>
    )
  }

  // Screen 8 "Now you try": the practice screen too (problem left, scratch pad right), but with the approved script's own
  // help — hint 1 after a miss, hint 2 after a second, then the worked steps and a look-alike twin. No Hint button: it
  // would skip that order. The pad wipes when the twin appears.
  if (s.mode === 'turn' && problem) {
    const worked = s.feedback === 'worked'
    const submit = () => {
      if (!ready(solutionOf(problem), value)) return
      const n = check(lesson, s, value)
      if (n.mode === 'won') firstTry.current = !s.twin && s.misses === 0
      const fb = n.mode === 'won' ? wonFor(lesson, n).text
        : n.feedback === 'hint1' ? hintsFor(lesson, n)[0] : n.feedback === 'hint2' ? hintsFor(lesson, n)[1]
        : n.feedback === 'worked' ? SAY.worked : undefined
      go(n, fb)
      if (n.mode !== 'won') setValue('')   // a wrong answer must not sit there to be re-submitted
    }
    return (
      <PracticeLayout corner={lesson.title} crumb="Screen 8 of 9" title="Now you try" exitLabel="Exit lesson"
        onExit={() => { stopSpeech(); onExit() }} pad padKey={s.twin ? 'twin' : 'first'} feedback={feedback}>
        <p style={{ ...bubble, fontWeight: 700 }}>{problem.text}</p>
        <p style={{ margin: 0, fontSize: 19, fontWeight: 700, color: INK }}>{lesson.turn.prompt}</p>
        <div style={stage}>
          <Pic p={problem.picture} scratch={{ taps, onTap: () => setTaps(t => t + 1) }} />
          {tapCue(problem.picture) && <p style={{ ...cue, ...(taps === 0 ? { animation: 'lp-nudge 1.6s ease-in-out 3' } : {}) }}>{tapCue(problem.picture)}</p>}
          {taps > 0 && <button type="button" style={{ ...pill, alignSelf: 'center' }} onClick={() => setTaps(0)}>Clear picture</button>}
        </div>
        {!worked && (
          <form id="lp-turn" onSubmit={e => { e.preventDefault(); submit() }} style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <b style={{ fontSize: 22 }}>Your answer</b>
            {box}
          </form>
        )}
        {s.feedback === 'hint1' && <p style={hint}>{hintsFor(lesson, s)[0]}</p>}
        {s.feedback === 'hint2' && <p style={hint}>{hintsFor(lesson, s)[1]}</p>}
        {worked && (
          <div style={hint}>
            <b>Here&apos;s how this one works:</b>
            <ol style={{ margin: '6px 0 0', paddingLeft: 24 }}>{stepsOf(problem).map(t => <li key={t}>{t}</li>)}</ol>
          </div>
        )}
        <div className="pr-foot">
          <button type="button" style={hintBtn} onClick={() => { setAutoOn(false); go(back(s)) }}>← Back</button>
          {worked
            ? <button type="button" style={primary} onClick={() => {
                const n = afterWorked(s)
                go(n, n.mode === 'turn' ? SAY.twin(lesson) : wonFor(lesson, n).text)
              }}>{s.twin ? 'Next' : 'Try a new one'}</button>
            : <button type="submit" form="lp-turn" style={primary} disabled={!ready(solutionOf(problem), value)}>Check</button>}
        </div>
      </PracticeLayout>
    )
  }

  // The parts every screen fills in.
  let crumb: string, title: ReactNode, picture: ReactNode, words: ReactNode, action: ReactNode = null, backBtn: ReactNode = null, at: number, stack = false

  if (s.mode === 'lesson') {
    const sc = lesson.screens[s.screen]
    const moving = sc.pictures.some(p => 'motion' in p && p.motion)
    // ponytail: on Screen 1 the closing question becomes the button ("How many…? Let's see"), split out of the approved text.
    const ask = s.screen === 0 ? sc.text.match(/^([\s\S]*?[.!])\s+([^.!?]+\?)$/) : null
    // "One thing not to do": the Not this / Do this cards run full width, the explanation underneath (the template's Trap door).
    stack = !sc.chalk && sc.pictures.length > 0 && sc.pictures.every(p => p.kind === 'cards')
    crumb = `Screen ${s.screen + 1} of 9`; at = s.screen
    title = sc.title
    // The board: a picture a beat draws waits for that beat; one no beat names is up from the start. Her written
    // lines go up here too, under the drawing — the board is the left canvas, not a note beside her words.
    // Built in beat order, so nothing already on the board moves when the next thing goes up.
    const drawn = sc.beats?.flatMap(b => (b.pic === undefined ? [] : [b.pic])) ?? []
    const onBoard = [
      // On the board before she says anything: written on in turn, so the screen opens by being drawn, not by being there.
      ...sc.pictures.flatMap((p, k) => (drawn.includes(k) ? [] : [<Written key={`p${k}`} after={k}><Pic p={p} /></Written>])),
      ...(sc.beats?.slice(0, shown).flatMap((b, i) => [
        ...(b.pic === undefined ? [] : [<Written key={`p${b.pic}`}><Pic p={sc.pictures[b.pic]} /></Written>]),
        ...(b.write ? [<Written key={`w${i}`}><Ink rows={wrap(b.write, 26).map(t => ({ t, s: 28, w: 900 }))} box="#fff" /></Written>] : []),
      ]) ?? []),
    ]
    picture = sc.chalk && sc.beats
      ? <Chalkboard key={`${s.screen}-${replay}`} marks={sc.chalk} says={sc.beats.map(b => b.say)} shown={shown} label={sc.text} />
      : stack
      ? <div key={`${s.screen}-${replay}`} style={{ flex: 1 }}>{onBoard}</div>
      : <div key={`${s.screen}-${replay}`} style={sc.scene ? { ...stage, background: `center / cover url(/assets/lessons/${sc.scene}.webp)`, borderRadius: 20, padding: '24px 12px' } : stage}>
        {onBoard}
        {moving && <button type="button" style={{ ...pill, alignSelf: 'flex-start' }} onClick={() => setReplay(r => r + 1)}>↻ Watch again</button>}
      </div>
    words = sc.beats
      ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sc.beats.slice(0, shown).map((b, i) =>
            <p key={i} style={{ ...said, opacity: i < shown - 1 ? 0.5 : 1 }}>{b.say}</p>)}
        </div>
      : <p style={bubble}>{ask ? ask[1] : sc.text}</p>
    action = <button type="button" style={ask ? askBtn : primary} onClick={() => {
      setAutoOn(true)
      const n = next(s)
      go(n, n.mode === 'turn' ? SAY.turn(lesson) : undefined)
    }}>{ask ? <><span>{ask[2]}</span><span style={{ fontSize: 16, opacity: 0.95 }}>Let&apos;s see ▶</span></> : 'Next'}</button>
    if (s.screen > 0) backBtn = <button type="button" style={hintBtn} onClick={() => { setAutoOn(false); go(back(s)) }}>← Back</button>
  } else if (s.mode === 'won') {
    const w = wonFor(lesson, s)
    crumb = 'Screen 8 of 9'; at = 7
    title = w.helped ? w.title
      : <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ ...tick, width: 44, height: 44, fontSize: 26 }} aria-hidden>✓</span>{w.title}</span>
    picture = <div style={{ ...stage, alignItems: 'center' }}>
      {!w.helped && <span style={{ ...tick, width: 120, height: 120, fontSize: 72, animation: 'lp-pop .4s ease-out' }} aria-hidden>✓</span>}
    </div>
    words = <p style={bubble}>{w.text}</p>
    action = <button type="button" style={primary} onClick={startPractice}>Next</button>
  } else {
    crumb = 'Done!'; at = 8
    // A laddered topic counts only once it is really done (mastered or 12 answers), not because the child took a break.
    const allDone = (!ladder || lessonDone(learnerId, lesson.id)) && (moduleDone?.() ?? false)
    title = allDone ? 'Module complete!' : `${lesson.title}: done!`
    picture = <div style={stage}>
      {allDone && <img src="/assets/lessons/badge.webp" alt="Module badge" width={96} height={112} style={{ alignSelf: 'center', animation: 'lp-pop .4s ease-out' }} />}
      <p style={idea}>{lesson.bigIdea}</p>
    </div>
    if (run) {
      // The break (founder, 2026-09-24): a celebration, never a verdict — no count of a total, no "unfinished".
      crumb = C.takeBreak
      title = session.mastered ? C.breakMastered : C.breakTitle(session.answered)
      words = <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={bubble}>{C.spotSaved}</p>
        {session.points > 0 && <p style={{ ...right, alignSelf: 'flex-start' }}>{C.points(session.points)}</p>}
      </div>
    } else words = <p style={bubble}>You worked through all 5 practice problems. Nice work sticking with it!</p>
    action = <button type="button" style={primary} onClick={onExit}>{C.backToTopics}</button>
  }

  return (
    <Frame corner={feedback} crumb={crumb} at={at} total={9} stack={stack} title={title} picture={picture} words={words} action={action} back={backBtn}
      exit={{ label: '← Topics', onClick: () => { stopSpeech(); onExit() } }}
      progress={beats ? shown / beats.length : undefined} />
  )
}

/**
 * When does this stroke's own picture become visible? A `motion: true` picture reveals its parts on a stagger
 * (`lp-in` with delays of 0, 0.7s, 1.4s…), and a trace that runs while its part is still at opacity 0 is spent
 * on something nobody can see: the part then simply appears, fully drawn. Measured on g6m6-t1 — fades at
 * 1.4s and 1.8s against a trace window ending ~1.3s, so two of the four parts traced invisibly.
 * So a stroke waits for its own part to start fading in, and the two then run together.
 */
function fadesInAt(el: Element, stop: Element): number {
  for (let n: Element | null = el; n && n !== stop; n = n.parentElement) {
    const cs = getComputedStyle(n)
    // ⚠️ MATCH THE NAME, NOT A SUBSTRING OF IT (an animation named `lp-fill` contains `lp-in`).
    const names = cs.animationName.split(',').map(x => x.trim())
    const at = names.indexOf('lp-in')
    if (at >= 0) return parseFloat(cs.animationDelay.split(',')[at] ?? '0') * 1000 || 0
  }
  return 0
}

/**
 * The pen. Everything on the board is SVG, and this draws it the way a hand does, one thing after another in
 * document order: a line, shape or outline is traced over its own length and its colour follows; a letter (one
 * `tspan` each, see `letters` in ./Diagrams) has its outline written and then its ink filled in.
 * Web Animations, not CSS: a trace needs each path's own length, which only the DOM knows. `fill: 'backwards'` keeps a
 * thing invisible until the pen reaches it; nothing is held after, so an authored dash or fill-opacity is untouched.
 * A picture with no SVG in it (the object pictures: cookies, plates) pops up instead.
 */
function usePen(start: number) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = host.current
    if (!root || typeof root.animate !== 'function') return
    // A child who asked for less motion gets none: the global CSS rule cannot reach a script-driven animation.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const parts = [...root.querySelectorAll<SVGGeometryElement | SVGTextContentElement>('svg :is(path, line, rect, circle, ellipse, polyline, polygon, text, tspan[data-c])')]
      .filter(el => el.tagName !== 'text' || !el.querySelector('tspan[data-c]'))
    if (!parts.length) {
      root.animate([{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 350, delay: start, easing: 'ease-out', fill: 'backwards' })
      return
    }
    const isText = (el: Element) => el.tagName === 'text' || el.tagName === 'tspan'
    // Paced so a long card is written in about the time she takes to say it, never slower than a pen.
    const steps = parts.map(el => (isText(el) ? 45 : 22))
    const k = Math.min(1, 3500 / steps.reduce((a, b) => a + b, 0))
    let t = start
    parts.forEach((el, i) => {
      const cs = getComputedStyle(el), fo = cs.fillOpacity || '1'
      const delay = t + fadesInAt(el, root)
      t += steps[i] * k
      if (isText(el)) {
        const L = (parseFloat(cs.fontSize) || 20) * 4, pen = { stroke: cs.fill, strokeWidth: '1.4', strokeDasharray: `${L}` }
        el.animate([
          { ...pen, strokeDashoffset: `${L}`, fillOpacity: 0 },
          { ...pen, strokeDashoffset: '0', fillOpacity: 0, offset: 0.6 },
          { ...pen, strokeDashoffset: '0', fillOpacity: fo },
        ], { duration: 550, delay, easing: 'ease-out', fill: 'backwards' })
        return
      }
      const len = 'getTotalLength' in el ? el.getTotalLength?.() ?? 0 : 0
      if (!len) return
      el.animate([
        { strokeDasharray: `${len}`, strokeDashoffset: `${len}`, fillOpacity: 0 },
        { strokeDasharray: `${len}`, strokeDashoffset: '0', fillOpacity: fo },
      ], { duration: 700, delay, easing: 'ease-out', fill: 'backwards' })
    })
  }, [start])
  return host
}

/** Puts one thing on the board, drawn by the pen. `after` staggers the things already up when a screen opens. */
function Written({ children, after = 0 }: { children: ReactNode; after?: number }) {
  // A real box, a column so what is inside still centres itself.
  return <div ref={usePen(after * 900)} style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
}

const said: CSSProperties = { margin: 0, fontSize: 'clamp(19px, 2.4vw, 24px)', lineHeight: 1.35, color: INK, fontWeight: 600, transition: 'opacity .4s ease' }
const askBtn: CSSProperties = { ...primary, flexDirection: 'column', alignItems: 'flex-start', gap: 2, textAlign: 'left', padding: '12px 22px', maxWidth: 440 }

/** The choice after every 5 answers and at mastery. Two positive buttons; the problem behind it is already the next one. */
function Checkpoint({ text, onKeep, onBreak }: { text: string; onKeep: () => void; onBreak: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={text} style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 16, background: '#1f1a1466' }}>
      <div style={{ background: '#fffaf0', border: `4px solid ${INK}`, borderRadius: 24, boxShadow: `6px 6px 0 ${INK}`, padding: '24px 22px',
        maxWidth: 440, width: '100%', display: 'flex', flexDirection: 'column', gap: 18, textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: INK }}>{text}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" style={hintBtn} onClick={onBreak}>{C.takeBreak}</button>
          <button type="button" style={primary} onClick={onKeep} autoFocus>{C.keepGoing}</button>
        </div>
      </div>
    </div>
  )
}
