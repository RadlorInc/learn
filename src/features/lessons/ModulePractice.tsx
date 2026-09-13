'use client'
/**
 * A module's mixed practice (see mixedPractice in ./modules), laid out like the founder's SampleUI practice screen:
 *   "Problem 1 of 8" + Exit practice · left: question, picture, your answer, feedback, Hint (left) / Check (right) ·
 *   right: a scratch pad to draw on.
 * Same rules as a lesson's practice: a first miss shows that topic's big idea, a second miss shows the worked steps and
 * offers that topic's lesson. Hint shows the big idea without counting as a miss. Feedback is warm yellow, never a red
 * "Not yet"; no score is shown.
 */
import Link from 'next/link'
import { useState } from 'react'
import { answerOf, workedSteps } from './script'
import { Pic, tapCue, pill } from './Pictures'
import { stage, bubble, primary, hint, idea, cue, tick, right, answerInput } from './Frame'
import { PracticeLayout, hintBtn } from './PracticeLayout'
import { mixedPractice, type Module } from './modules'

type Feedback = null | 'idea' | 'worked' | 'right'

export function ModulePractice({ module, onExit }: { module: Module; onExit: () => void }) {
  const items = mixedPractice(module)
  const [i, setI] = useState(0)
  const [misses, setMisses] = useState(0)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [asked, setAsked] = useState(false)   // Hint tapped
  const [value, setValue] = useState('')
  const [taps, setTaps] = useState(0)

  const done = i >= items.length
  const page = (crumb: string, title: string, left: React.ReactNode, pad: boolean) => (
    <PracticeLayout corner={`Module ${module.n}`} crumb={crumb} title={title} onExit={onExit} pad={pad} padKey={i}>{left}</PracticeLayout>
  )

  if (done) {
    return page('Done!', 'Practice done!', <>
      <p style={idea}>You practiced every topic in Module {module.n}.</p>
      <p style={bubble}>You worked through all {items.length} problems. Nice work sticking with it!</p>
      <div className="pr-foot"><span /><button type="button" style={primary} onClick={onExit}>Back to modules</button></div>
    </>, false)
  }

  const { problem, lesson } = items[i]
  const submit = () => {
    if (value === '') return
    if (Number(value) === answerOf(problem.op)) { setFeedback('right'); return }
    const m = misses + 1
    setMisses(m); setFeedback(m === 1 ? 'idea' : 'worked'); setValue('')   // a wrong answer must not sit there to be re-submitted
  }
  const nextProblem = () => { setI(i + 1); setMisses(0); setFeedback(null); setAsked(false); setValue(''); setTaps(0) }
  const answering = feedback !== 'right' && feedback !== 'worked'

  return page(`Practice ${i + 1} of ${items.length}`, `Problem ${i + 1} of ${items.length}`, <>
    <p style={{ ...bubble, fontWeight: 700 }}>{problem.text}</p>
    <div style={stage}>
      <Pic p={problem.picture} scratch={{ taps, onTap: () => setTaps(t => t + 1) }} />
      {tapCue(problem.picture) && <p style={{ ...cue, ...(taps === 0 ? { animation: 'lp-nudge 1.6s ease-in-out 3' } : {}) }}>{tapCue(problem.picture)}</p>}
      {taps > 0 && <button type="button" style={{ ...pill, alignSelf: 'center' }} onClick={() => setTaps(0)}>Clear picture</button>}
    </div>

    {answering && (
      <form id="pr-answer" onSubmit={e => { e.preventDefault(); submit() }} style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <b style={{ fontSize: 22 }}>Your answer</b>
        <input aria-label="Your answer" inputMode="numeric" pattern="[0-9]*" maxLength={3} value={value}
          onChange={e => setValue(e.target.value.replace(/\D/g, ''))} style={answerInput} />
      </form>
    )}

    {(feedback === 'idea' || (asked && answering)) && <p style={idea}>{lesson.bigIdea}</p>}
    {feedback === 'right' && <p style={right}><span style={tick} aria-hidden>✓</span>Right! The answer is {answerOf(problem.op)}.</p>}
    {feedback === 'worked' && <>
      <div style={hint}>
        <b>Here&apos;s how this one works:</b>
        <ol style={{ margin: '6px 0 0', paddingLeft: 24 }}>{workedSteps(problem.op).map(t => <li key={t}>{t}</li>)}</ol>
      </div>
      <Link href={`/lesson?id=${lesson.id}`} style={{ ...pill, alignSelf: 'flex-start', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
        Watch the lesson: {lesson.title}
      </Link>
    </>}

    <div className="pr-foot">
      {answering
        ? <button type="button" style={hintBtn} onClick={() => setAsked(true)} disabled={asked || feedback === 'idea'}>Hint</button>
        : <span />}
      {answering
        ? <button type="submit" form="pr-answer" style={primary} disabled={value === ''}>Check</button>
        : <button type="button" style={primary} onClick={nextProblem}>{i === items.length - 1 ? 'Finish' : 'Next problem'}</button>}
    </div>
  </>, true)
}
