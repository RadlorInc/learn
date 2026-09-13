/**
 * Founder's call, 2026-09-13: the existing chapters are hidden while the new teaching flow is built.
 * Hidden = no list offers one and no route plays one; names still resolve for history and /admin.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  LEGACY_CHAPTERS_HIDDEN, isChapterVisible, chaptersForAge, gradeStartPlan,
  CHAPTER_ORDER, CHAPTER_IDS, CHAPTER_NAMES, type AgeGroup,
} from '@/core/chapters'

const BANDS: AgeGroup[] = ['3-5', '6-8', '9-11', '12-14', '15-16', '17-18']

describe('legacy chapters are hidden', () => {
  it('the switch is on', () => { expect(LEGACY_CHAPTERS_HIDDEN).toBe(true) })

  it('no band lists or plans a chapter', () => {
    for (const b of BANDS) {
      expect(chaptersForAge(b), b).toEqual([])
      expect(gradeStartPlan(b), b).toEqual([])
    }
    expect(CHAPTER_ORDER).toEqual([])
    expect(isChapterVisible('counting')).toBe(false)
    expect(isChapterVisible('decimals')).toBe(false)
  })

  it('names still resolve, so saved progress and past sessions still read', () => {
    expect(CHAPTER_IDS.length).toBe(72)
    expect(CHAPTER_NAMES.counting).toBe('Counting')
  })

  // Every route that can open a legacy chapter carries the gate. Driven end to end in the browser;
  // this only stops the gate being deleted from one route silently.
  it.each([
    ['src/app/game/page.tsx', /!isChapterVisible\(playingChapter\)\) return <NewLessonsSoon/],
    ['src/features/chapters/GuardedChapter.tsx', /!isChapterVisible\(id\)\) return <NewLessonsSoon/],
    ['src/app/story/page.tsx', /LEGACY_CHAPTERS_HIDDEN\) return <NewLessonsSoon/],
    ['src/app/demo/page.tsx', /LEGACY_CHAPTERS_HIDDEN\) return <NewLessonsSoon/],
    ['src/app/menu/page.tsx', /LEGACY_CHAPTERS_HIDDEN\) return <NewLessonsSoon/],
    ['src/app/diagnostic/layout.tsx', /LEGACY_CHAPTERS_HIDDEN \? <NewLessonsSoon/],
  ])('%s refuses a hidden chapter', (file, gate) => {
    expect(readFileSync(file, 'utf8')).toMatch(gate)
  })
})
