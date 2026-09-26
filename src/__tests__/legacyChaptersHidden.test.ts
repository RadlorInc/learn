/**
 * Founder's call, 2026-09-13: the old chapter SURFACES are hidden (the age-band menu, the demo, the
 * /story preview, the age-band plan). Founder's call, 2026-09-25: the 23 chapters PLAY again, as the
 * KG / Grade 1 / Grade 2 tabs of the child's home — so a known chapter is playable, an unknown one is not.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  LEGACY_CHAPTERS_HIDDEN, isChapterVisible, chaptersForAge, gradeStartPlan, chaptersForGrade,
  CHAPTER_ORDER, CHAPTER_IDS, CHAPTER_NAMES, type AgeGroup,
} from '@/core/chapters'

const BANDS: AgeGroup[] = ['3-5', '6-8', '9-11', '12-14', '15-16', '17-18']

describe('the old chapter surfaces are hidden', () => {
  it('the switch is on', () => { expect(LEGACY_CHAPTERS_HIDDEN).toBe(true) })

  it('no band lists or plans a chapter', () => {
    for (const b of BANDS) {
      expect(chaptersForAge(b), b).toEqual([])
      expect(gradeStartPlan(b), b).toEqual([])
    }
    expect(CHAPTER_ORDER).toEqual([])
  })

  it('every one of the 23 chapters plays; a deleted or unknown id does not', () => {
    for (const id of CHAPTER_IDS) expect(isChapterVisible(id), id).toBe(true)
    expect(isChapterVisible('decimals')).toBe(false)   // a 9–11 chapter, deleted 2026-09-20
    expect(isChapterVisible('')).toBe(false)
  })

  // Founder's split, 2026-09-25, written out by hand on purpose: moving a chapter to another grade is a
  // decision, so it takes an edit here too.
  it('KG, Grade 1 and Grade 2 list exactly the agreed chapters, in play order', () => {
    expect(chaptersForGrade(0).map(c => c.name)).toEqual(['Counting', 'Number Order', 'Nest Tree', 'Home Time',
      'Bigger or Smaller', 'Shape House', 'Rainbow Town', 'Bead Shop', 'Measuring'])
    expect(chaptersForGrade(1).map(c => c.name)).toEqual(['Play Time', 'Time to Go', 'Numbers to 100', 'Tens & Ones',
      'Story Problems', 'Time', 'Compare Numbers'])
    expect(chaptersForGrade(2).map(c => c.name)).toEqual(['Skip Counting', 'Multiplication', 'Fractions', 'Money',
      'Add to 100', 'Subtract to 100', 'Shapes 2D & 3D'])
    expect(chaptersForGrade(3)).toEqual([])
  })

  it('names still resolve, so saved progress and past sessions still read', () => {
    expect(CHAPTER_IDS.length).toBe(23)
    expect(CHAPTER_NAMES.counting).toBe('Counting')
  })

  // Every old surface keeps its gate, and the two play routes still refuse an id that is not a chapter.
  it.each([
    ['src/app/game/page.tsx', /!isChapterVisible\(playingChapter\)\) return <NewLessonsSoon/],
    ['src/features/chapters/GuardedChapter.tsx', /!isChapterVisible\(id\)\) return <NewLessonsSoon/],
    ['src/app/story/page.tsx', /LEGACY_CHAPTERS_HIDDEN\) return <NewLessonsSoon/],
    ['src/app/demo/page.tsx', /LEGACY_CHAPTERS_HIDDEN\) return <NewLessonsSoon/],
    ['src/app/menu/page.tsx', /LEGACY_CHAPTERS_HIDDEN\) return <ModuleHome/],
    // "Start learning" used to fork on the check; the check was deleted 2026-09-20, so the only
    // thing to pin is that it goes to the lesson list and nowhere else.
    ['src/app/parent/page.tsx', /function launchGame\(d: LearnerData\) \{[\s\S]*?router\.push\('\/menu'\)/],
  ])('%s keeps its gate', (file, gate) => {
    expect(readFileSync(file, 'utf8')).toMatch(gate)
  })
})
