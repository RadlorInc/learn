'use client'
/**
 * THE MISSION BRIEF (9–11 · `wordProblems`) on GameShell.
 *
 * THE VERB IS "DECIDE WHICH SUM IT IS". Everything else in this band answers with a manipulative,
 * and this one deliberately does not: a word problem's whole difficulty is choosing the OPERATION,
 * and there is nothing to build until that choice is made. So this is the one 9–11 chapter that
 * belongs on the shell's AnswerPad — which is exactly the founder's rule, "pad only where the answer
 * is plainly just a number", meeting the one chapter where it is.
 *
 * ⚠️ THE DISTRACTORS ARE THE CHAPTER, and they live in `story/words.ts`: every wrong choice is the
 * answer you would get by picking the WRONG operation (`a + b` on a multiply round, `a − b` on an
 * add). Random near-misses would turn it into arithmetic with a story stapled on.
 *
 * ⚠️ AND ITS GENERATOR WAS EXTRACTED FROM THE COMPONENT TO GET HERE. It was the only chapter in the
 * band whose maths lived inside React, so nothing about it could be reached by a gate — and it was
 * the only 9–11 chapter with no test file at all.
 */
import React from 'react'
import { Game, type BaseTask, type GameConfig, type InstrumentProps } from './parts/GameShell'
import { KID_P as P } from './parts/kidKit'
import { makeRound, sigFor, explainBeats, missFor, type WpRound } from '@/features/chapters/story/words'

export interface WpTask extends BaseTask { r: WpRound }

function toTask(r: WpRound): WpTask {
  return {
    r,
    title: 'Mission',
    /** ⚠️ THE STORY IS THE QUESTION AND THE SUM IS THE ANSWER, so the board shows a `?` until the
     *  commit. Printing `48 + 27` would do the one step this chapter exists to test. */
    badge: '?',
    tone: 'a',
    prompt: r.story,
    context: r.story,
    instruction: 'Work it out, then tap your answer',
    say: r.say,
    work: explainBeats(r),
    showEquals: false,
  }
}

/** The brief itself — shown while the pad is up, because the child has to keep re-reading it. */
function Brief({ task, value, reveal }: InstrumentProps<number, WpTask>) {
  const r = task.r
  /**
   * ⚠️ THE WALKTHROUGH HAS TO BE ABLE TO SHOW THE WORKING, and `reveal` cannot do it: the shell
   * renders a tutorial instrument with `reveal={false}` (correctly — nothing is being answered), so
   * the readout sat on `?` while Milo said "which comes to 69" out loud. Info that exists only in
   * audio is info most Chrome installs do not have. A step that sets the VALUE to the answer opens
   * the readout, which is exactly what the last beat of the walkthrough does.
   */
  const open = reveal || value === r.answer
  return (
    <div style={{
      position: 'relative', width: 'min(84vw, 620px)', background: P.glass,
      border: `1px solid ${P.gold}55`, borderRadius: 20, padding: '22px 26px',
      boxShadow: `0 0 30px ${P.gold}26`, display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: P.creamSoft }}>Mission brief</span>
      <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'clamp(17px,2.6vh,23px)', lineHeight: 1.5, color: P.cream }}>{r.story}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(120,150,220,0.10)', border: `1px solid ${P.glassBorder}`, borderRadius: 14, padding: '12px 18px' }}>
        <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 12, letterSpacing: 1.3, color: P.creamSoft, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Readout</span>
        <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(22px,3.4vh,32px)', letterSpacing: open ? 0.5 : 2, color: open ? P.cream : P.gold, textShadow: `0 0 18px ${P.gold}66` }}>
          {open ? r.equation : '?'}
        </span>
      </div>
    </div>
  )
}

const config: GameConfig<number, WpTask> = {
  chapterId: 'wordProblems',
  band: '9-11',
  title: 'THE MISSION BRIEF',
  ticketLabel: 'brief',
  palette: P,
  motif: '🛰️',

  makeTask: d => toTask(makeRound(d)),
  initialValue: () => -1,
  grade: (t, v) => v === t.r.answer,
  revealText: t => `${t.r.answer}`,
  sig: t => sigFor(t.r),

  /** ⚠️ THE ONE CHAPTER IN THIS BAND ON THE SHELL'S PAD — its choices are the wrong-operation
   *  answers, pre-shuffled by the module, and the pad shuffles nothing. */
  answerPad: t => t.r.choices.map(Number),

  /** No hand: there is nothing to hold up. The reading would be a number the child has already
   *  worked out, which is a slower keyboard rather than a different way of thinking. */

  glide: () => {},
  Instrument: Brief,

  start: {
    blurb: 'Every brief is a story with a sum hiding in it. The hard part is not the adding — it is working out WHICH sum the words are asking for.',
    ticket: { title: 'Solve the brief', badge: '?', tone: 'a' },
    startLabel: 'Open the brief',
  },

  tutorial: (() => {
    const r = makeRound(1)
    return {
      task: toTask(r),
      initial: -1,
      hand: 'tap' as const,
      // ⚠️ the LAST beat opens the readout by setting the value to the answer — see `Brief`
      steps: explainBeats(r).map((say, i, all) => ({ say, ...(i === all.length - 1 ? { value: r.answer } : null) })),
    }
  })(),
}

export default function MissionBriefGame(p: { childName: string; onFinish: (c: number, w: number, m?: boolean) => void; onExit: () => void }) {
  return <Game config={config} {...p} />
}

export { config as MISSION_BRIEF_CONFIG, toTask }
export const MISS = missFor
