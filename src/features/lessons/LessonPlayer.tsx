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
import { setSceneVoice } from '@/infra/voiceClipPlayer'
import { lessonVoice } from '@/infra/storage/voicePref'
import {
  START, next, back, check, hintsFor, wonFor, afterWorked, toPractice, nextPractice, replayLesson, currentProblem, solutionOf, stepsOf, showAnswer, outcomeOf, SAY,
  type FlowState, type Lesson, type Screen,
} from './script'
import { rng, freshSeed, beginRun, advance, startLevel, reviewTopic, type Run } from './adaptive'
import { ladderOf, ladderAnswers } from './ladders'
import { findLesson } from './modules'
import { loadStanding, saveStanding } from '@/infra/storage/lessonStanding'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { syncLesson } from '@/infra/storage/lessonSync'
import { Pic, tapCue, pill, INK } from './Pictures'
import { Ink, wrap } from './Diagrams'
import { Chalkboard } from './Chalkboard'
import { beatMs } from './chalk'
import { Frame, stage, bubble, primary, hint, idea, cue, tick, right } from './Frame'
import { AnswerInput, ready, needsSign, needsWhole } from './AnswerInput'
import { PracticeLayout, hintBtn } from './PracticeLayout'

/**
 * `learnerId` and `earlier` (the ids of this module's topics before this one) feed adaptive practice: a laddered lesson
 * (see ./adaptive) asks generated problems that follow the child, and may bring back one earlier topic that is not mastered.
 */
export function LessonPlayer({ lesson, learnerId = null, earlier = [], moduleDone, onFinish, onExit }: {
  lesson: Lesson; learnerId?: string | null; earlier?: readonly string[]
  /** True once every topic of this lesson's module (that the child has) is finished — the badge is shown then, and only then. */
  moduleDone?: () => boolean
  onFinish: () => void; onExit: () => void
}) {
  const [s, setS] = useState<FlowState>(START)
  const [taps, setTaps] = useState(0)
  const [value, setValue] = useState('')
  const [replay, setReplay] = useState(0)
  const [audio, setAudio] = useState(false)
  const [asked, setAsked] = useState(false)   // Hint tapped on a practice problem
  // Her lines play from recorded clips in this grade's voice (lines without a clip still fall back to browser speech).
  useEffect(() => {
    setSceneVoice(lessonVoice(lesson.id))
    return () => setSceneVoice(null)
  }, [lesson.id])
  const ladder = ladderOf(lesson.id)
  const [run, setRun] = useState<Run | null>(null)
  const r = useRef(rng(freshSeed())).current
  const firstTry = useRef(false)              // Screen 8 solved with no miss: adaptive practice starts one level up

  // The beat clock. A teaching screen with `beats` reveals itself line by line — her words on the right, what she
  // puts on the board on the left — so BOTH columns read `shown`, and it has to live above the early returns below.
  const beats = s.mode === 'lesson' ? lesson.screens[s.screen].beats : undefined
  const [shown, setShown] = useState(1)
  useEffect(() => {
    if (!beats) return
    setShown(1)
    // Her voice paces it when the child has audio on; when they don't, reading time does — a flat beat is far too
    // fast for a long line. Either way the lines and the board move together.
    if (audio) return speakSteps(beats.map(b => b.say), { onStep: i => setShown(i + 1) })
    let t = 0
    const ids = beats.map((b, i) => { const at = t; t += beatMs(b.say); return setTimeout(() => setShown(i + 1), at) })
    return () => ids.forEach(clearTimeout)
  }, [beats, audio, replay])

  const say = (text: string, on = audio) => { if (on && text) speak(text) }
  const go = (n: FlowState, spoken?: string) => {
    if (n.mode !== s.mode || n.screen !== s.screen || n.twin !== s.twin || n.practice !== s.practice) { setTaps(0); setValue(''); setAsked(false) }
    setS(n)
    if (spoken) say(spoken)
    if (n.mode === 'finish' && s.mode !== 'finish') onFinish()
  }
  const screenSay = SAY.screen

  // Screen 8 solved (or the twin's worked steps seen): straight on to practice. Founder's call, 2026-09-19: a right answer
  // gets the green check at the top and moves on — no badge or sticker screen per topic; the badge waits for the module.
  const startPractice = () => {
    if (ladder) {
      const standing = startLevel(loadStanding(learnerId, lesson.id), firstTry.current, ladder.length)
      const review = reviewTopic(earlier, id => lessonDone(learnerId, id), id => loadStanding(learnerId, id), ladderOf)
      setRun(beginRun(lesson.id, ladder, standing, r, review))
    }
    go(toPractice(s))
  }
  const won = s.mode === 'won'
  useEffect(() => {
    if (!won) return
    // A child who did not solve the twin gets no check: nothing to celebrate, so no pause either.
    const id = setTimeout(startPractice, wonFor(lesson, s).helped ? 0 : 1500)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once per arrival on the won state, with that render's state
  }, [won])


  const problem = s.mode === 'practice' && run ? run.current.problem : currentProblem(lesson, s)
  // A review problem comes from an earlier topic: its own big idea and lesson, not this one's.
  const from = run && s.mode === 'practice' && run.current.from !== lesson.id ? findLesson(run.current.from)?.lesson ?? null : null
  const bigIdea = from?.bigIdea ?? lesson.bigIdea
  // The answer box's shape is the lesson's, never the problem's (see AnswerInput). A ladder's answers are sampled.
  const sampled = useMemo(() => (ladder ? ladderAnswers(ladder) : []), [ladder])
  const all = [lesson.turn, lesson.turn.twin, ...lesson.practice.map(x => x.problem)].map(solutionOf).concat(sampled)
  const box = problem && <AnswerInput answer={solutionOf(problem)} value={value} onChange={setValue} signed={needsSign(all)} mixed={needsWhole(all)} />

  const toggleAudio = () => {
    const on = !audio
    setAudio(on)
    if (!on) stopSpeech()
    else if (s.mode === 'lesson') say(screenSay(lesson.screens[s.screen]), true)
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
      setRun(moved.run)
      go(moved.done ? { ...s, mode: 'finish', misses: 0, feedback: null } : { ...s, practice: s.practice + 1, misses: 0, feedback: null })
    }
    const of = ladder ? '' : ' of 5'
    return (
      <PracticeLayout corner={lesson.title} crumb={`Practice ${s.practice + 1}${of}`} title={`Problem ${s.practice + 1}${of}`}
        onExit={() => { stopSpeech(); onExit() }} audio={{ on: audio, toggle: toggleAudio }} pad padKey={s.practice}>
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
            : <button type="button" style={{ ...pill, alignSelf: 'flex-start' }} onClick={() => go(replayLesson(s), screenSay(lesson.screens[0]))}>Watch the lesson again</button>}
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
        onExit={() => { stopSpeech(); onExit() }} audio={{ on: audio, toggle: toggleAudio }} pad padKey={s.twin ? 'twin' : 'first'}>
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
          <button type="button" style={hintBtn} onClick={() => go(back(s), screenSay(lesson.screens[6]))}>← Back</button>
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
      const n = next(s)
      go(n, n.mode === 'lesson' ? screenSay(lesson.screens[n.screen]) : n.mode === 'turn' ? SAY.turn(lesson) : undefined)
    }}>{ask ? <><span>{ask[2]}</span><span style={{ fontSize: 16, opacity: 0.95 }}>Let&apos;s see ▶</span></> : 'Next'}</button>
    if (s.screen > 0) backBtn = <button type="button" style={hintBtn} onClick={() => go(back(s), screenSay(lesson.screens[s.screen - 1]))}>← Back</button>
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
    const allDone = moduleDone?.() ?? false
    title = allDone ? 'Module complete!' : `${lesson.title}: done!`
    picture = <div style={stage}>
      {allDone && <img src="/assets/lessons/badge.webp" alt="Module badge" width={96} height={112} style={{ alignSelf: 'center', animation: 'lp-pop .4s ease-out' }} />}
      <p style={idea}>{lesson.bigIdea}</p>
    </div>
    words = <p style={bubble}>{run
      ? run.standing.mastered ? 'You really know this one now. Nice work!' : `You worked through ${run.asked} practice problems. Nice work sticking with it!`
      : 'You worked through all 5 practice problems. Nice work sticking with it!'}</p>
    action = <button type="button" style={primary} onClick={onExit}>Back to topics</button>
  }

  return (
    <Frame crumb={crumb} at={at} total={9} stack={stack} title={title} picture={picture} words={words} action={action} back={backBtn}
      exit={{ label: '← Topics', onClick: () => { stopSpeech(); onExit() } }}
      audio={{ on: audio, toggle: toggleAudio }} />
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
