/**
 * Pure profile-merge logic — extracted from the store's actions so the
 * load-bearing "never regress a learner's progress" math is unit-testable in
 * isolation (the store container itself stays a thin set()/persist wrapper).
 *
 * No React, no zustand, no side effects. Given the same inputs it always
 * returns the same profile.
 */
import type { PlayerProfile } from '@/state/store'
import type { LearnerStats, LearnerProgress, LearnerState } from '@/data/supabase/types'
import type { ChapterType } from '@/core/chapters'
import { getLevelFromXP } from '@/core/leveling'

/**
 * Merge a learner's server-side state (cross-device) into their local profile.
 * Everything is MONOTONIC — it never regresses:
 *   - stars/XP        → max(local, server)
 *   - coins balance   → earned (server) − spent, spent itself monotonic
 *   - owned items     → union; equipped → server when present
 */
export function mergeServerProgress(
  profile: PlayerProfile,
  stats: LearnerStats | null,
  progress: LearnerProgress[],
  state: LearnerState | null,
): PlayerProfile {
  const cs = { ...profile.chapterStars }
  for (const row of progress) {
    const ch = row.chapter as ChapterType
    if (ch in cs) cs[ch] = Math.max(cs[ch] ?? 0, row.best_stars ?? 0)
  }

  const totalXP        = Math.max(profile.totalXP, stats?.total_xp ?? 0)

  // ── Coins: balance = earned − spent, both monotonic so it never loses ──
  const earned = stats?.total_coins ?? 0
  // spent: from server when present; otherwise reconstruct from THIS device's
  // known balance (handles existing users who spent before spent-tracking).
  const spent = state
    ? Math.max(profile.coinsSpent ?? 0, state.coins_spent ?? 0)
    : Math.max(profile.coinsSpent ?? 0, earned - profile.totalCoins, 0)
  // Keep at least the local balance so unsynced local earnings aren't lost.
  const totalCoins = Math.max(profile.totalCoins, earned - spent)

  // ── Shop items ──
  const ownedItems = state
    ? Array.from(new Set([...profile.ownedItems, ...(state.owned_items ?? [])]))
    : profile.ownedItems
  const equippedItems = state && state.equipped_items && Object.keys(state.equipped_items).length
    ? { ...profile.equippedItems, ...state.equipped_items }
    : profile.equippedItems

  return {
    ...profile,
    chapterStars: cs,
    totalXP,
    currentLevel: getLevelFromXP(totalXP),
    totalCoins,
    coinsSpent: spent,
    ownedItems,
    equippedItems,
  }
}
