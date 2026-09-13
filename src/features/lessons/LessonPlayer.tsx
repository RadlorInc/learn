'use client'
/**
 * Plays one new-flow lesson (see ./script.ts for the flow). Every transition is a pure function
 * from script.ts; this file only draws the state (in ./Frame) and speaks on the child's own taps.
 *
 * Look: the founder's SampleUI template. Its red wrong-answer banners, locks, emoji and scores are deliberately NOT
 * carried over (a wrong answer is never marked wrong; difficulty and scores stay invisible).
 */
import { useState, type CSSProperties, type ReactNode } from 'react'
import { speak, stopSpeech } from '@/infra/useMiloSpeaker'
import {
  START, next, back, check, hintsFor, wonFor, afterWorked, toPractice, nextPractice, replayLesson, currentProblem, answerOf, workedSteps,
  type FlowState, type Lesson, type Screen,
} from './script'
import { Pic, tapCue, pill, INK } from './Pictures'
import { Frame, stage, bubble, primary, hint, idea, cue, tick, right, answerInput } from './Frame'
import { PracticeLayout, hintBtn } from './PracticeLayout'

export function LessonPlayer({ lesson, onFinish, onExit }: { lesson: Lesson; onFinish: () => void; onExit: () => void }) {
  const [s, setS] = useState<FlowState>(START)
  const [taps, setTaps] = useState(0)
  const [value, setValue] = useState('')
  const [replay, setReplay] = useState(0)
  const [audio, setAudio] = useState(false)
  const [asked, setAsked] = useState(false)   // Hint tapped on a practice problem

  const say = (text: string, on = audio) => { if (on) speak(text) }
  const go = (n: FlowState, spoken?: string) => {
    if (n.mode !== s.mode || n.screen !== s.screen || n.twin !== s.twin || n.practice !== s.practice) { setTaps(0); setValue(''); setAsked(false) }
    setS(n)
    if (spoken) say(spoken)
    if (n.mode === 'finish' && s.mode !== 'finish') onFinish()
  }
  const screenSay = (sc: Screen) => `${sc.title}. ${sc.text}`

  const problem = currentProblem(lesson, s)

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
      if (value.trim() === '') return
      const n = check(lesson, s, Number(value))
      go(n, n.feedback === 'idea' ? lesson.bigIdea : n.feedback === 'right' ? 'Right!' : n.feedback === 'worked' ? 'Here is how this one works.' : undefined)
      if (n.feedback !== 'right') setValue('')   // a wrong answer must not sit there to be re-submitted
    }
    return (
      <PracticeLayout corner={lesson.title} crumb={`Practice ${s.practice + 1} of 5`} title={`Problem ${s.practice + 1} of 5`}
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
            <input aria-label="Your answer" inputMode="numeric" pattern="[0-9]*" maxLength={3} value={value}
              onChange={e => setValue(e.target.value.replace(/\D/g, ''))} style={answerInput} />
          </form>
        )}
        {(s.feedback === 'idea' || (asked && answering)) && <p style={idea}>{lesson.bigIdea}</p>}
        {s.feedback === 'right' && <p style={right}><span style={tick} aria-hidden>✓</span>Right! The answer is {answerOf(problem.op)}.</p>}
        {worked && <>
          <div style={hint}>
            <b>Here&apos;s how this one works:</b>
            <ol style={{ margin: '6px 0 0', paddingLeft: 24 }}>{workedSteps(problem.op).map(t => <li key={t}>{t}</li>)}</ol>
          </div>
          <button type="button" style={{ ...pill, alignSelf: 'flex-start' }} onClick={() => go(replayLesson(s), screenSay(lesson.screens[0]))}>Watch the lesson again</button>
        </>}
        <div className="pr-foot">
          {answering ? <button type="button" style={hintBtn} onClick={() => setAsked(true)} disabled={asked || s.feedback === 'idea'}>Hint</button> : <span />}
          {answering
            ? <button type="submit" form="lp-answer" style={primary} disabled={value === ''}>Check</button>
            : <button type="button" style={primary} onClick={() => go(nextPractice(s))}>{s.practice === 4 ? 'Finish' : 'Next problem'}</button>}
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
      if (value.trim() === '') return
      const n = check(lesson, s, Number(value))
      const fb = n.mode === 'won' ? wonFor(lesson, n).text
        : n.feedback === 'hint1' ? hintsFor(lesson, n)[0] : n.feedback === 'hint2' ? hintsFor(lesson, n)[1]
        : n.feedback === 'worked' ? 'Here is how this one works.' : undefined
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
            <input aria-label="Your answer" inputMode="numeric" pattern="[0-9]*" maxLength={3} value={value}
              onChange={e => setValue(e.target.value.replace(/\D/g, ''))} style={answerInput} />
          </form>
        )}
        {s.feedback === 'hint1' && <p style={hint}>{hintsFor(lesson, s)[0]}</p>}
        {s.feedback === 'hint2' && <p style={hint}>{hintsFor(lesson, s)[1]}</p>}
        {worked && (
          <div style={hint}>
            <b>Here&apos;s how this one works:</b>
            <ol style={{ margin: '6px 0 0', paddingLeft: 24 }}>{workedSteps(problem.op).map(t => <li key={t}>{t}</li>)}</ol>
          </div>
        )}
        <div className="pr-foot">
          <button type="button" style={hintBtn} onClick={() => go(back(s), screenSay(lesson.screens[6]))}>← Back</button>
          {worked
            ? <button type="button" style={primary} onClick={() => {
                const n = afterWorked(s)
                go(n, n.mode === 'turn' ? `Try a new one. ${lesson.turn.twin.text}` : wonFor(lesson, n).text)
              }}>{s.twin ? 'Next' : 'Try a new one'}</button>
            : <button type="submit" form="lp-turn" style={primary} disabled={value === ''}>Check</button>}
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
    stack = sc.pictures.length > 0 && sc.pictures.every(p => p.kind === 'cards')
    crumb = `Screen ${s.screen + 1} of 9`; at = s.screen
    title = sc.title
    picture = stack
      ? <div key={`${s.screen}-${replay}`} style={{ flex: 1 }}>{sc.pictures.map((p, k) => <Pic key={k} p={p} />)}</div>
      : <div key={`${s.screen}-${replay}`} style={sc.scene ? { ...stage, background: `center / cover url(/assets/lessons/${sc.scene}.webp)`, borderRadius: 20, padding: '24px 12px' } : stage}>
        {sc.pictures.map((p, k) => <Pic key={k} p={p} />)}
        {moving && <button type="button" style={{ ...pill, alignSelf: 'flex-start' }} onClick={() => setReplay(r => r + 1)}>↻ Watch again</button>}
      </div>
    words = <p style={bubble}>{ask ? ask[1] : sc.text}</p>
    action = <button type="button" style={ask ? askBtn : primary} onClick={() => {
      const n = next(s)
      go(n, n.mode === 'lesson' ? screenSay(lesson.screens[n.screen]) : n.mode === 'turn' ? `Now you try. ${lesson.turn.text} ${lesson.turn.prompt}` : undefined)
    }}>{ask ? <><span>{ask[2]}</span><span style={{ fontSize: 16, opacity: 0.95 }}>Let&apos;s see ▶</span></> : 'Next'}</button>
    if (s.screen > 0) backBtn = <button type="button" style={hintBtn} onClick={() => go(back(s), screenSay(lesson.screens[s.screen - 1]))}>← Back</button>
  } else if (s.mode === 'won') {
    const w = wonFor(lesson, s)
    crumb = 'Screen 9 of 9'; at = 8
    title = <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ ...tick, width: 44, height: 44, fontSize: 26 }} aria-hidden>✓</span>{w.title}</span>
    picture = <div style={stage}>
      {w.helped && <p style={idea}>{lesson.bigIdea}</p>}
      <div style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <img src="/assets/lessons/badge.webp" alt="" width={96} height={112} style={{ flexShrink: 0, animation: 'lp-pop .4s ease-out' }} />
        <span style={sticker}>
          <small style={{ display: 'block', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: '#6d4c3d' }}>Math word sticker</small>
          {w.sticker}
        </span>
      </div>
    </div>
    words = <p style={bubble}>{w.text}</p>
    action = <button type="button" style={primary} onClick={() => go(toPractice(s))}>Keep practicing</button>
  } else {
    crumb = 'Done!'; at = 8
    title = `${lesson.title}: done!`
    picture = <div style={stage}><p style={idea}>{lesson.bigIdea}</p></div>
    words = <p style={bubble}>You worked through all 5 practice problems. Nice work sticking with it!</p>
    action = <button type="button" style={primary} onClick={onExit}>Back to topics</button>
  }

  return (
    <Frame crumb={crumb} at={at} total={9} stack={stack} title={title} picture={picture} words={words} action={action} back={backBtn}
      exit={{ label: '← Topics', onClick: () => { stopSpeech(); onExit() } }}
      audio={{ on: audio, toggle: toggleAudio }} />
  )
}

const sticker = { alignSelf: 'center', maxWidth: 460, textAlign: 'center', padding: '14px 22px', borderRadius: 20, background: '#ffd166', border: `4px solid ${INK}`,
  boxShadow: `5px 5px 0 ${INK}`, fontWeight: 800, fontSize: 20, color: INK, '--lp-tilt': '-2deg', transform: 'rotate(-2deg)', animation: 'lp-pop .4s ease-out' } as CSSProperties
const askBtn: CSSProperties = { ...primary, flexDirection: 'column', alignItems: 'flex-start', gap: 2, textAlign: 'left', padding: '12px 22px', maxWidth: 440 }
