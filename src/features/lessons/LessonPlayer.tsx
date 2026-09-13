'use client'
/**
 * Plays one new-flow lesson (see ./script.ts for the flow). Every transition is a pure function
 * from script.ts; this file only draws the state and speaks on the child's own taps.
 */
import { useState, type CSSProperties } from 'react'
import { speak, stopSpeech } from '@/infra/useMiloSpeaker'
import {
  START, next, check, afterWorked, toPractice, nextPractice, replayLesson, currentProblem, answerOf, workedSteps,
  type FlowState, type Lesson, type Screen,
} from './script'
import { Pic, pill, INK, SOFT, ACCENT, GOOD, CARD, LINE, LESSON_KEYFRAMES } from './Pictures'

export function LessonPlayer({ lesson, onFinish, onExit }: { lesson: Lesson; onFinish: () => void; onExit: () => void }) {
  const [s, setS] = useState<FlowState>(START)
  const [taps, setTaps] = useState(0)
  const [value, setValue] = useState('')
  const [replay, setReplay] = useState(0)
  const [audio, setAudio] = useState(false)

  const say = (text: string, on = audio) => { if (on) speak(text) }
  const go = (n: FlowState, spoken?: string) => {
    if (n.mode !== s.mode || n.screen !== s.screen || n.twin !== s.twin || n.practice !== s.practice) { setTaps(0); setValue('') }
    setS(n)
    if (spoken) say(spoken)
    if (n.mode === 'finish' && s.mode !== 'finish') onFinish()
  }
  const screenSay = (sc: Screen) => `${sc.title}. ${sc.text}`

  const problem = currentProblem(lesson, s)
  const dots = (active: number) => (
    <div style={{ display: 'flex', gap: 6 }} aria-label={`Screen ${active + 1} of 9`}>
      {Array.from({ length: 9 }, (_, k) => <i key={k} style={{ width: 9, height: 9, borderRadius: '50%', background: k <= active ? ACCENT : LINE }} />)}
    </div>
  )

  let body: React.ReactNode
  if (s.mode === 'lesson') {
    const sc = lesson.screens[s.screen]
    const moving = sc.pictures.some(p => 'motion' in p && p.motion)
    body = <>
      <p style={eyebrow}>Screen {s.screen + 1} of 9</p>
      <h1 style={h1}>{sc.title}</h1>
      <div key={`${s.screen}-${replay}`} style={pic}>
        {sc.pictures.map((p, k) => <Pic key={k} p={p} />)}
        {moving && <button type="button" style={{ ...pill, alignSelf: 'flex-start', fontSize: 14 }} onClick={() => setReplay(r => r + 1)}>↻ Watch again</button>}
      </div>
      <p style={text}>{sc.text}</p>
      <div style={foot}>{dots(s.screen)}
        <button type="button" style={go_} onClick={() => {
          const n = next(s)
          go(n, n.mode === 'lesson' ? screenSay(lesson.screens[n.screen]) : n.mode === 'turn' ? `Now you try. ${lesson.turn.text} ${lesson.turn.prompt}` : undefined)
        }}>Next</button>
      </div>
    </>
  } else if ((s.mode === 'turn' || s.mode === 'practice') && problem) {
    const worked = s.feedback === 'worked'
    const submit = () => {
      if (value.trim() === '') return
      const n = check(lesson, s, Number(value))
      const fb = n.mode === 'won' ? lesson.won.text
        : n.feedback === 'hint1' ? lesson.turn.hint1 : n.feedback === 'hint2' ? lesson.turn.hint2
        : n.feedback === 'idea' ? lesson.bigIdea : n.feedback === 'right' ? 'Right!' : n.feedback === 'worked' ? 'Here is how this one works.' : undefined
      go(n, fb)
    }
    body = <>
      {s.mode === 'turn'
        ? <><p style={eyebrow}>Screen 8 of 9</p><h1 style={h1}>Now you try</h1></>
        : <>
          <p style={eyebrow}>Practice {s.practice + 1} of 5 · {lesson.practice[s.practice].why}</p>
          <h1 style={h1}>Keep practicing</h1>
        </>}
      <div style={pic}>
        <Pic p={problem.picture} scratch={{ taps, onTap: () => setTaps(t => t + 1) }} />
        {taps > 0 && <button type="button" style={{ ...pill, alignSelf: 'center', fontSize: 13 }} onClick={() => setTaps(0)}>Clear picture</button>}
      </div>
      <p style={{ ...text, fontWeight: 700 }}>{problem.text}</p>
      {s.mode === 'turn' && <p style={{ ...text, color: SOFT, fontSize: 17 }}>{lesson.turn.prompt}</p>}

      {s.feedback !== 'right' && !worked && (
        <form onSubmit={e => { e.preventDefault(); submit() }} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input aria-label="Your answer" inputMode="numeric" pattern="[0-9]*" maxLength={3} value={value}
            onChange={e => setValue(e.target.value.replace(/\D/g, ''))}
            style={{ width: 100, height: 56, fontSize: 28, fontWeight: 800, textAlign: 'center', borderRadius: 12, border: `2px solid ${LINE}`, color: INK, background: CARD }} />
          <button type="submit" style={go_} disabled={value === ''}>Check</button>
        </form>
      )}

      {s.feedback === 'hint1' && <p style={note}>{lesson.turn.hint1}</p>}
      {s.feedback === 'hint2' && <p style={note}>{lesson.turn.hint2}</p>}
      {s.feedback === 'idea' && <p style={{ ...note, fontWeight: 800 }}>{lesson.bigIdea}</p>}
      {s.feedback === 'right' && <p style={{ ...note, borderColor: GOOD, background: '#E2F4EB' }}>Right! The answer is {answerOf(problem.op)}.</p>}
      {worked && (
        <div style={note}>
          <b>Here&apos;s how this one works:</b>
          <ol style={{ margin: '6px 0 0', paddingLeft: 20 }}>{workedSteps(problem.op).map(t => <li key={t}>{t}</li>)}</ol>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {s.mode === 'turn' && worked && (
          <button type="button" style={go_} onClick={() => {
            const n = afterWorked(s)
            go(n, n.mode === 'turn' ? `Try a new one. ${lesson.turn.twin.text}` : undefined)
          }}>{s.twin ? 'Keep practicing' : 'Try a new one'}</button>
        )}
        {s.mode === 'practice' && worked && (
          <button type="button" style={pill} onClick={() => go(replayLesson(s), screenSay(lesson.screens[0]))}>Watch the lesson again</button>
        )}
        {s.mode === 'practice' && (s.feedback === 'right' || worked) && (
          <button type="button" style={go_} onClick={() => go(nextPractice(s))}>{s.practice === 4 ? 'Finish' : 'Next problem'}</button>
        )}
      </div>
      <div style={foot}>{dots(7)}<span /></div>
    </>
  } else if (s.mode === 'won') {
    body = <>
      <p style={eyebrow}>Screen 9 of 9</p>
      <h1 style={h1}>You got it</h1>
      <div style={pic}>
        <span style={{ alignSelf: 'center', border: `2px dashed ${ACCENT}`, borderRadius: 12, padding: '10px 16px', fontWeight: 800, color: INK }}>
          <small style={{ display: 'block', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: SOFT }}>Math word</small>
          {lesson.won.sticker}
        </span>
      </div>
      <p style={text}>{lesson.won.text}</p>
      <div style={foot}>{dots(8)}<button type="button" style={go_} onClick={() => go(toPractice(s))}>Keep practicing</button></div>
    </>
  } else {
    body = <>
      <p style={eyebrow}>Finished</p>
      <h1 style={h1}>{lesson.title}: done!</h1>
      <div style={pic}><p style={{ ...note, fontWeight: 800 }}>{lesson.bigIdea}</p></div>
      <p style={text}>You got {s.solo.length} of 5 practice problems on your own.</p>
      <div style={foot}>{dots(8)}<button type="button" style={go_} onClick={onExit}>Back to topics</button></div>
    </>
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FCEAB6', padding: '16px 14px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{LESSON_KEYFRAMES}</style>
      <div style={{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" style={pill} onClick={() => { stopSpeech(); onExit() }}>← Topics</button>
          <button type="button" style={{ ...pill, background: audio ? '#FFE3D1' : CARD }} aria-pressed={audio} onClick={() => {
            const on = !audio
            setAudio(on)
            if (!on) stopSpeech()
            else if (s.mode === 'lesson') say(screenSay(lesson.screens[s.screen]), true)
          }}>{audio ? '🔊 Reading aloud' : '🔈 Read it to me'}</button>
        </div>
        <main style={{ background: CARD, borderRadius: 22, border: `1px solid ${LINE}`, padding: 'clamp(18px, 4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 480 }}>
          {body}
        </main>
      </div>
    </div>
  )
}

const eyebrow: CSSProperties = { margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: SOFT }
const h1: CSSProperties = { margin: 0, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(26px, 4.5vw, 36px)', color: INK, lineHeight: 1.15 }
const pic: CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, minHeight: 160 }
const text: CSSProperties = { margin: 0, fontSize: 'clamp(18px, 2.4vw, 21px)', lineHeight: 1.5, color: INK, maxWidth: '60ch' }
const foot: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 'auto' }
const note: CSSProperties = { margin: 0, borderLeft: `4px solid ${ACCENT}`, background: '#FFF4E8', borderRadius: 12, padding: '12px 16px', fontSize: 17, color: INK }
const go_: CSSProperties = { minHeight: 52, padding: '12px 28px', borderRadius: 14, border: 'none', background: ACCENT, color: '#fff', fontWeight: 900, fontSize: 19, cursor: 'pointer' }
