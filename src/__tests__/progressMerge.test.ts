import { describe, it, expect } from 'vitest'
import { mergeServerProgress, nextStreak } from '@/state/progressMerge'
import type { PlayerProfile } from '@/state/store'
import type { LearnerStats, LearnerProgress, LearnerState } from '@/data/supabase/types'

function profile(over: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    childName: 'Kid', avatarIndex: 0, hasCompletedSetup: true,
    totalXP: 0, totalCoins: 0, coinsSpent: 0, currentLevel: 1, currentStreak: 0,
    lastPlayedDate: '', chapterStars: {} as PlayerProfile['chapterStars'],
    ownedItems: [], equippedItems: {},
    ...over,
  } as PlayerProfile
}
const stats = (o: Partial<LearnerStats>) => o as unknown as LearnerStats
const prog  = (chapter: string, best_stars: number) => ({ chapter, best_stars } as unknown as LearnerProgress)
const state = (o: Partial<LearnerState>) => o as unknown as LearnerState

describe('mergeServerProgress — monotonic (never regresses)', () => {
  it('keeps the higher XP whether local or server leads, and re-derives level', () => {
    expect(mergeServerProgress(profile({ totalXP: 500 }), stats({ total_xp: 300 }), [], null).totalXP).toBe(500)
    const up = mergeServerProgress(profile({ totalXP: 300 }), stats({ total_xp: 500 }), [], null)
    expect(up.totalXP).toBe(500)
    expect(up.currentLevel).toBe(2) // getLevelFromXP(500) — threshold[1] === 500
  })

  it('takes the max streak', () => {
    expect(mergeServerProgress(profile({ currentStreak: 4 }), stats({ current_streak: 2 }), [], null).currentStreak).toBe(4)
    expect(mergeServerProgress(profile({ currentStreak: 1 }), stats({ current_streak: 7 }), [], null).currentStreak).toBe(7)
  })

  it('takes the max stars per chapter, and ignores rows for chapters not tracked locally', () => {
    const p = profile({ chapterStars: { counting: 1 } as PlayerProfile['chapterStars'] })
    const merged = mergeServerProgress(p, null, [prog('counting', 3), prog('not_a_chapter', 3)], null)
    expect(merged.chapterStars.counting).toBe(3)
    expect('not_a_chapter' in merged.chapterStars).toBe(false)
  })

  it('coins with server state: spent = max(local, server), balance never drops below local', () => {
    const merged = mergeServerProgress(
      profile({ totalCoins: 50, coinsSpent: 10 }),
      stats({ total_coins: 100 }),   // earned = 100
      [],
      state({ coins_spent: 30, owned_items: [], equipped_items: {} }),
    )
    expect(merged.coinsSpent).toBe(30)   // max(10, 30)
    expect(merged.totalCoins).toBe(70)   // max(50, 100 - 30)
  })

  it('coins without server state: reconstructs spent from this device, never loses local balance', () => {
    const merged = mergeServerProgress(
      profile({ totalCoins: 50, coinsSpent: 10 }),
      stats({ total_coins: 100 }),   // earned = 100
      [], null,
    )
    expect(merged.coinsSpent).toBe(50)   // max(10, 100-50, 0)
    expect(merged.totalCoins).toBe(50)   // max(50, 100-50)
  })

  it('unions owned items and merges equipped when state is present; leaves them untouched when null', () => {
    const withState = mergeServerProgress(
      profile({ ownedItems: ['a'], equippedItems: { hat: 'x' } }),
      null, [],
      state({ owned_items: ['b', 'a'], equipped_items: { shirt: 'y' }, coins_spent: 0 }),
    )
    expect([...withState.ownedItems].sort()).toEqual(['a', 'b'])
    expect(withState.equippedItems).toEqual({ hat: 'x', shirt: 'y' })

    const noState = mergeServerProgress(profile({ ownedItems: ['a'], equippedItems: { hat: 'x' } }), null, [], null)
    expect(noState.ownedItems).toEqual(['a'])
    expect(noState.equippedItems).toEqual({ hat: 'x' })
  })

  it('null stats + null state leaves the profile intact (recomputes level only)', () => {
    const p = profile({ totalXP: 200, totalCoins: 0, coinsSpent: 0, lastPlayedDate: 'Mon Jan 01 2026' })
    const merged = mergeServerProgress(p, null, [], null)
    expect(merged.totalXP).toBe(200)
    expect(merged.currentLevel).toBe(1)
    expect(merged.lastPlayedDate).toBe('Mon Jan 01 2026')
    expect(merged.totalCoins).toBe(0)
    expect(merged.coinsSpent).toBe(0)
  })
})

describe('nextStreak', () => {
  it('is unchanged when already played today', () => {
    expect(nextStreak('today', 5, 'today', 'yesterday')).toBe(5)
  })
  it('increments on a consecutive day', () => {
    expect(nextStreak('yesterday', 5, 'today', 'yesterday')).toBe(6)
  })
  it('resets to 1 after a missed day', () => {
    expect(nextStreak('last-week', 5, 'today', 'yesterday')).toBe(1)
  })
})
