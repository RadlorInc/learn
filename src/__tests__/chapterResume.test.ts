import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  getChapterResume, setChapterResume, clearChapterResume, hasChapterResume,
} from '@/infra/storage/chapterResume'
import { PRAISE } from '@/features/chapters/story/StoryWorld'
import { praisesOnCorrect } from '@/core/praise'
import { strip } from './_window'
import type { ChapterType } from '@/data/supabase/types'

// In the node test env there is no IndexedDB, so kv falls back to localStorage (same as
// chapterLevel.test.ts).
const CH = 'numberRecognition' as ChapterType
const run = { round: 7, correct: 5, wrong: 2, seen: ['a', 'b'], asked: ['x'] }
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const STORY = 'src/features/chapters/story/StoryWorld.tsx'
const SHELL = 'src/features/chapters/teen/games/parts/GameShell.tsx'

describe('mid-chapter resume (the run, not just the tier)', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips the whole run, scoped per learner and per chapter', () => {
    setChapterResume('L1', CH, run)
    const got = getChapterResume('L1', CH)
    expect(got).toMatchObject(run)
    expect(getChapterResume('L2', CH), 'leaked across learners').toBeNull()
    expect(getChapterResume('L1', 'counting' as ChapterType), 'leaked across chapters').toBeNull()
  })

  /**
   * ⚠️ THE ONE THAT MATTERS MOST. A resume point outliving its run is worse than having none: every
   * later replay of a finished chapter would open near its end, and the child would never see the
   * teaching or the first questions again.
   */
  it('is destroyed by clear, so a finished run cannot reopen near its end', () => {
    setChapterResume('L1', CH, run)
    expect(hasChapterResume('L1', CH)).toBe(true)
    clearChapterResume('L1', CH)
    expect(hasChapterResume('L1', CH)).toBe(false)
    expect(getChapterResume('L1', CH)).toBeNull()
  })

  it('a run with nothing answered is not a resume', () => {
    setChapterResume('L1', CH, { ...run, round: 0 })
    expect(getChapterResume('L1', CH), 'round 0 offered as somewhere to come back to').toBeNull()
  })

  it('expires, so a fortnight-old run restarts instead of dropping the child mid-chapter', () => {
    const eightDays = Date.now() - 8 * 24 * 60 * 60 * 1000
    localStorage.setItem(`milo-chres-L1-${CH}`, JSON.stringify({ ...run, at: eightDays }))
    expect(getChapterResume('L1', CH)).toBeNull()
    const oneDay = Date.now() - 24 * 60 * 60 * 1000
    localStorage.setItem(`milo-chres-L1-${CH}`, JSON.stringify({ ...run, at: oneDay }))
    expect(getChapterResume('L1', CH), 'a day-old run should still resume').not.toBeNull()
  })

  it('survives garbage and a missing learner without throwing', () => {
    localStorage.setItem(`milo-chres-L1-${CH}`, 'not json')
    expect(getChapterResume('L1', CH)).toBeNull()
    localStorage.setItem(`milo-chres-L1-${CH}`, JSON.stringify({ round: 4, at: Date.now() }))
    expect(getChapterResume('L1', CH)).toMatchObject({ round: 4, correct: 0, wrong: 0, seen: [], asked: [] })
    setChapterResume(null, CH, run)
    expect(getChapterResume(null, CH), 'a logged-out preview stored a run').toBeNull()
  })
})

/**
 * ⚠️ SOURCE GATES, AND THEY ARE ANCHORED ON THE CALL LINES RATHER THAN ON A COUNT OF A TOKEN.
 * The rule is "every path that ENDS a run clears the resume point" — so the thing to enumerate is
 * the END paths (the `onComplete` / `onFinish` calls), not the occurrences of the word `clear`,
 * which a refactor moves around freely. Counting the token would have gone green on an engine that
 * cleared the same path three times and one path not at all.
 */
describe('both engines end a run cleanly', () => {
  it('every SkillBeat exit from a run clears the resume point', () => {
    const lines = read(STORY).split('\n').filter(l => l.includes('onComplete(tally.current'))
    expect(lines.length, 'SkillBeat gained or lost a way to finish a run').toBe(3)
    for (const l of lines) {
      expect(l, `a run ends here without clearing its resume point:\n${l.trim()}`).toContain('clearChapterResume')
    }
  })

  it('every GameShell exit from a run clears the resume point', () => {
    const lines = read(SHELL).split('\n').filter(l => /\bonFinish\(c, w[,)]/.test(l))
    expect(lines.length, 'GameShell gained or lost a way to finish a run').toBe(2)
    for (const l of lines) {
      expect(l, `a run ends here without clearing its resume point:\n${l.trim()}`).toContain('clearChapterResume')
    }
  })

  /**
   * ⚠️ COUNTED, NOT MERELY PRESENT. Written as a `toContain` this survived mutation: SkillBeat
   * advances a run from TWO places — a scored answer and the end of a re-teach — and deleting the
   * save from the scored answer left the re-teach's copy to satisfy the search. A rule that has to
   * hold in N places is asserted N times.
   */
  it('both engines write the run as it goes, not on the way out', () => {
    // There is no exit event for a closed tab, so a save that only happens on unmount saves nothing
    // in exactly the case the student reported.
    const story = read(STORY)
    const saves = story.split('setChapterResume(learnerId, beat.skillId, {').length - 1
    expect(saves, 'a path that advances a SkillBeat run no longer records where it got to').toBe(2)
    expect(story, 'the scored answer stopped recording').toContain('round: roundIdx + 1, correct:')
    expect(story, 'the re-teach stopped recording').toContain('round: next, correct:')
    const shell = read(SHELL)
    expect(shell.split('setChapterResume(learnerId, config.chapterId, {').length - 1,
      'GameShell stopped recording progress mid-run').toBe(1)
  })

  it('a resumed run re-enters play rather than replaying the teaching', () => {
    expect(read(STORY), 'the round no longer starts where the child left off').toContain('useState(resume?.round ?? 0)')
    expect(read(STORY), 'the score no longer carries across the gap').toContain('resume?.correct ?? 0, wrong: resume?.wrong ?? 0')
    expect(read(SHELL), 'GameShell replays the walkthrough on a resume').toContain('if (resume) { finishDemo(); return }')
  })

  /**
   * ⚠️ THE START CARD IS LOAD-BEARING ON A RESUME AND MUST NOT BE SKIPPED. It is where
   * `unlockSpeech()` happens (speech needs a real user gesture, or the whole run is silent) and,
   * on an AR chapter, where BOTH camera doors live. A resume that jumped straight into play would
   * put a child in front of a camera nobody consented to on this visit.
   */
  it('a resumed GameShell run still passes through the start card', () => {
    const s = read(SHELL)
    const doors = s.split('\n').filter(l => l.includes('enterAfterStart()'))
    expect(doors.length, 'a start-card door stopped routing through the resume-aware entry').toBe(4)
    for (const l of doors) expect(l, 'a door skips the speech unlock').toContain('unlockSpeech()')
  })
})

describe('spoken praise on a correct answer', () => {
  it('rotates, so it is praise rather than a noise the chapter makes', () => {
    expect(new Set(PRAISE).size, 'the praise lines repeat').toBe(PRAISE.length)
    expect(PRAISE.length).toBeGreaterThan(2)
    expect(read(STORY), 'praise is a constant line again').toContain('PRAISE[roundIdx % PRAISE.length]')
  })

  /**
   * ⚠️ IT HAS TO FIT THE GAP IT IS SPOKEN INTO. The next round is announced 1300 ms later and
   * `speak()` cancels whatever is still talking, so a long line is cut off mid-word. Browser TTS at
   * this band's rate runs roughly 12–14 characters a second, so ~18 characters is the safe ceiling.
   */
  it('is short enough not to be cut off by the next question', () => {
    for (const p of PRAISE) expect(p.length, `"${p}" will be cut off mid-word`).toBeLessThanOrEqual(18)
  })

  it('is still suppressed for a beat that writes its own feedback', () => {
    // ⚠️ AND IT QUEUES RATHER THAN CUTS (2026-09-04) — `speakAfterCurrent`, with a second gate so a
    // re-teach is not preceded by an encouragement its own narration would supersede a beat later.
    expect(read(STORY)).toContain('if (!beat.ownsFeedback && !reteaching) speakAfterCurrent(correct ? PRAISE[')
  })

  /**
   * ⚠️ THE CUTOFF IS BY AGE, NOT BY ENGINE, AND 9–11 IS WHY. That band is split across both engines
   * — ten chapters on `GameShell`, OrderDesk and LevelRun on the storybook one — so an engine-shaped
   * rule praises the same child in two chapters and stays silent in the other ten.
   */
  it('reaches the young bands and stops at 9', () => {
    for (const b of ['3-5', '6-8']) expect(praisesOnCorrect(b), `${b} lost its praise`).toBe(true)
    // ⚠️ 9–11 IS OFF ON PURPOSE, and this line is the whole reason the cutoff is where it is: that
    // band moved onto the Field Lab design precisely so it would not look like 3–8, and praising it
    // after every question undoes that. Founder's call, 2026-08-28.
    for (const b of ['9-11', '12-14', '15-16', '17-18']) expect(praisesOnCorrect(b), `${b} is being praised like a six-year-old`).toBe(false)
    expect(praisesOnCorrect(''), 'an unknown band opts IN, which is the wrong default').toBe(false)
  })

  it('the teen shell asks the shared rule rather than deciding for itself', () => {
    // A second copy of the cutoff in the shell is a second thing to keep in step with the first.
    expect(read(SHELL), 'GameShell stopped praising, or grew its own copy of the rule')
      .toContain('if (praisesOnCorrect(BAND)) speak(PRAISE[')
  })
})

/**
 * ⚠️ THE READY BAR MUST NOT BE AN ORACLE. This band is retry-in-place — a wrong answer does not end
 * the round — so a Ready that appeared only for a correct selection would announce the answer
 * before the commit, which is the craft doc's oldest rule. It is gated on "something is selected"
 * and on nothing else, and it must look identical either way.
 */
describe('Ready bar', () => {
  const BAR = 'src/features/chapters/story/ReadyBar.tsx'
  // ⚠️ STRIPPED OF COMMENTS FIRST. Both of the assertions below went red on their first run against
  // the file's own header, which EXPLAINS that the bar must not know which answer is correct and
  // must never be disabled — the gate's-own-prose trap, arriving from the source side. A rule about
  // what the CODE does is checked against the code.
  it('branches on whether a choice exists, never on whether it is right', () => {
    const s = strip(read(BAR))
    // Positive control first: a search that finds nothing is indistinguishable from a broken one.
    expect(s, 'the positive control is gone — this search proves nothing').toContain('show')
    expect(s, 'the bar knows which answer is correct').not.toMatch(/\bcorrect\b|\banswer\b|\bgrade\b/)
  })

  it('is absent rather than disabled, because a dead button is the worst outcome', () => {
    const s = strip(read(BAR))
    expect(s).toContain('if (!show) return null')
    expect(s, 'the bar can render in a state where tapping it does nothing').not.toContain('disabled')
  })

  it('clears the tap floor', () => {
    expect(read(BAR)).toContain('minHeight: 44')
  })

  /** A tap must be undoable before it is submitted, or "submit when ready" is a trap. */
  it('the chapter it was proven on lets the child change their mind', () => {
    const nt = read('src/features/chapters/story/NestTree.tsx')
    expect(nt, 're-tapping a chosen nest no longer unchooses it').toContain('setPickedIdx(p => (p === i ? null : i))')
    expect(nt, 'the pick is drawn in the colour that means CORRECT in this palette')
      .not.toMatch(/state === 'picked' \? 'drop-shadow\(0 0 \d+px var\(--garden-green\)/)
  })
})
