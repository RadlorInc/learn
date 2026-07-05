import { describe, it, expect, beforeEach } from 'vitest'
import { getChapterLevel, setChapterLevel } from '@/infra/storage/chapterLevel'
import type { ChapterType } from '@/data/supabase/types'

// In the node test env there's no IndexedDB, so kv falls back to localStorage.
const CH = 'integers' as ChapterType

describe('chapter difficulty memory (resume where you left off)', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to easy (1) when nothing is stored', () => {
    expect(getChapterLevel('L1', CH)).toBe(1)
  })

  it('remembers and resumes the level per learner + per chapter', () => {
    setChapterLevel('L1', CH, 2)
    expect(getChapterLevel('L1', CH)).toBe(2)          // resumes at medium
    setChapterLevel('L1', CH, 3)
    expect(getChapterLevel('L1', CH)).toBe(3)          // then hard
    expect(getChapterLevel('L2', CH)).toBe(1)          // scoped per learner
    expect(getChapterLevel('L1', 'percentages' as ChapterType)).toBe(1) // scoped per chapter
  })

  it('is a no-op without a learner (e.g. logged-out preview → always easy)', () => {
    setChapterLevel(null, CH, 3)
    setChapterLevel(undefined, CH, 3)
    expect(getChapterLevel(null, CH)).toBe(1)
    expect(getChapterLevel(undefined, CH)).toBe(1)
  })

  it('clamps any out-of-range stored value back to a valid tier', () => {
    localStorage.setItem('milo-chlvl-L1-integers', '9')
    expect(getChapterLevel('L1', CH)).toBe(1)
    localStorage.setItem('milo-chlvl-L1-integers', 'garbage')
    expect(getChapterLevel('L1', CH)).toBe(1)
  })
})
