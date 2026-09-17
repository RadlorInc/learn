'use client'
/**
 * A module's mixed practice (see mixedPractice in ./modules), laid out like the founder's SampleUI practice screen:
 *   "Problem 1 of 8" + Exit practice · left: question, picture, your answer, feedback, Hint (left) / Check (right) ·
 *   right: a scratch pad to draw on.
 * Same rules as a lesson's practice: a first miss shows that topic's big idea, a second miss shows the worked steps and
 * offers that topic's lesson. Hint shows the big idea without counting as a miss. Feedback is warm yellow, never a red
 * "Not yet"; no score is shown.
 *
 * A module whose every topic has a ladder (see ./adaptive) is ADAPTIVE instead: MODULE_PROBLEMS generated problems, each
 * from the child's weakest topic at that topic's own level, and each result moves that topic's standing.
 * ponytail: two paths while only some modules have ladders; delete mixedPractice once every module does.
 */
import Link from 'next/link'
import { useRef, useState } from 'react'
import { solutionOf, stepsOf, showAnswer, isCorrect, type Problem, type Lesson } from './script'
import { rng, freshSeed, draw, step, nextModuleTopic, FRESH, MODULE_PROBLEMS, type Outcome } from './adaptive'
import { ladderOf, ladderAnswers } from './ladders'
import { loadStanding, saveStanding } from '@/infra/storage/lessonStanding'
import { AnswerInput, ready, needsSign, needsWhole } from './AnswerInput'
import { Pic, tapCue, pill } from './Pictures'
import { stage, bubble, primary, hint, idea, cue, tick, right } from './Frame'
import { PracticeLayout, hintBtn } from './PracticeLayout'
import { mixedPractice, type Module } from './modules'

type Feedback = null | 'idea' | 'worked' | 'right'

export function ModulePractice({ module, learnerId = null, onExit }: { module: Module; learnerId?: string | null; onExit: () => void }) {
  const adaptive = module.lessons.every(l => ladderOf(l.id))
  const r = useRef(rng(freshSeed())).current
  const drawFor = (asked: { problem: Problem; lesson: Lesson }[]) => {
    const id = nextModuleTopic(module.lessons.map(l => l.id), x => loadStanding(learnerId, x), asked.map(x => x.lesson.id), r)
    const problem = draw(ladderOf(id)!, loadStanding(learnerId, id)?.level ?? 0, r, asked.slice(-6).map(x => x.problem.text))
    return [...asked, { problem, lesson: module.lessons.find(l => l.id === id)! }]
  }
  const [items, setItems] = useState(() => (adaptive ? drawFor([]) : mixedPractice(module)))
  const total = adaptive ? MODULE_PROBLEMS : items.length
  const [answers] = useState(() => (adaptive ? module.lessons.flatMap(l => ladderAnswers(ladderOf(l.id)!)) : items.map(x => solutionOf(x.problem))))
  const [i, setI] = useState(0)
  const [misses, setMisses] = useState(0)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [asked, setAsked] = useState(false)   // Hint tapped
  const [value, setValue] = useState('')
  const [taps, setTaps] = useState(0)

  const done = i >= total
  const page = (crumb: string, title: string, left: React.ReactNode, pad: boolean) => (
    <PracticeLayout corner={`Module ${module.n}`} crumb={crumb} title={title} onExit={onExit} pad={pad} padKey={i}>{left}</PracticeLayout>
  )

  if (done) {
    return page('Done!', 'Practice done!', <>
      <p style={idea}>You practiced every topic in Module {module.n}.</p>
      <p style={bubble}>You worked through all {total} problems. Nice work sticking with it!</p>
      <div className="pr-foot"><span /><button type="button" style={primary} onClick={onExit}>Back to modules</button></div>
    </>, false)
  }

  const { problem, lesson } = items[i]
  const submit = () => {
    if (!ready(solutionOf(problem), value)) return
    if (isCorrect(solutionOf(problem), value)) { setFeedback('right'); return }
    const m = misses + 1
    setMisses(m); setFeedback(m === 1 ? 'idea' : 'worked'); setValue('')   // a wrong answer must not sit there to be re-submitted
  }
  const nextProblem = () => {
    if (adaptive) {
      const o: Outcome = feedback === 'worked' ? 'worked' : misses === 0 && !asked ? 'first' : 'second'
      const ladder = ladderOf(lesson.id)!
      saveStanding(learnerId, lesson.id, step(loadStanding(learnerId, lesson.id) ?? FRESH, ladder.length, o))
      if (i + 1 < total) setItems(drawFor(items))
    }
    setI(i + 1); setMisses(0); setFeedback(null); setAsked(false); setValue(''); setTaps(0)
  }
  const answering = feedback !== 'right' && feedback !== 'worked'

  return page(`Practice ${i + 1} of ${total}`, `Problem ${i + 1} of ${total}`, <>
    <p style={{ ...bubble, fontWeight: 700 }}>{problem.text}</p>
    <div style={stage}>
      <Pic p={problem.picture} scratch={{ taps, onTap: () => setTaps(t => t + 1) }} />
      {tapCue(problem.picture) && <p style={{ ...cue, ...(taps === 0 ? { animation: 'lp-nudge 1.6s ease-in-out 3' } : {}) }}>{tapCue(problem.picture)}</p>}
      {taps > 0 && <button type="button" style={{ ...pill, alignSelf: 'center' }} onClick={() => setTaps(0)}>Clear picture</button>}
    </div>

    {answering && (
      <form id="pr-answer" onSubmit={e => { e.preventDefault(); submit() }} style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <b style={{ fontSize: 22 }}>Your answer</b>
        <AnswerInput answer={solutionOf(problem)} value={value} onChange={setValue}
          signed={needsSign(answers)} mixed={needsWhole(answers)} />
      </form>
    )}

    {(feedback === 'idea' || (asked && answering)) && <p style={idea}>{lesson.bigIdea}</p>}
    {feedback === 'right' && <p style={right}><span style={tick} aria-hidden>✓</span>Right! The answer is {showAnswer(solutionOf(problem))}.</p>}
    {feedback === 'worked' && <>
      <div style={hint}>
        <b>Here&apos;s how this one works:</b>
        <ol style={{ margin: '6px 0 0', paddingLeft: 24 }}>{stepsOf(problem).map(t => <li key={t}>{t}</li>)}</ol>
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
        ? <button type="submit" form="pr-answer" style={primary} disabled={!ready(solutionOf(problem), value)}>Check</button>
        : <button type="button" style={primary} onClick={nextProblem}>{i === total - 1 ? 'Finish' : 'Next problem'}</button>}
    </div>
  </>, true)
}
