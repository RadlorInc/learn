import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { kv } from '@/infra/storage/kv'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import type { LearnerStats, LearnerProgress, LearnerState } from '@/data/supabase/types'
import { CHAPTER_IDS, type ChapterType } from '@/core/chapters'
import { scoreChapter, type ChapterScore } from '@/core/scoring'
import { mergeServerProgress } from '@/state/progressMerge'

// Chapter metadata and level maths are pure domain and live in `@/core`.
// This module deliberately does NOT re-export them: a module that needs a
// chapter id must not have to import zustand, IndexedDB and Supabase to get
// one. Enforced by `src/__tests__/layering.test.ts`.

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────

export type AvatarIndex = 0 | 1 | 2 | 3

// One star count per chapter, keyed off the registry so new chapters are
// covered automatically.
export type ChapterStars = Record<ChapterType, number>

export interface PlayerProfile {
  childName:         string
  avatarIndex:       AvatarIndex
  hasCompletedSetup: boolean
  totalXP:           number
  totalCoins:        number      // spendable balance (earned − spent)
  coinsSpent:        number      // monotonic; lets balance merge across devices
  currentLevel:      number
  chapterStars:      ChapterStars
  ownedItems:        string[]
  equippedItems:     Record<string, string>
}

export interface CelebrationData {
  stars:            number
  xpGained:         number
  coinsGained:      number
  childName:        string
  completedChapter: ChapterType
}

import { getLevelFromXP } from '@/core/leveling'

// ─────────────────────────────────────────────────────────────
//  Default profile
// ─────────────────────────────────────────────────────────────

const defaultChapterStars: ChapterStars =
  Object.fromEntries(CHAPTER_IDS.map(id => [id, 0])) as ChapterStars

const defaultProfile: PlayerProfile = {
  childName: '', avatarIndex: 0, hasCompletedSetup: false,
  totalXP: 0, totalCoins: 0, coinsSpent: 0, currentLevel: 1,
  chapterStars: { ...defaultChapterStars },
  ownedItems: [], equippedItems: {},
}

// ─────────────────────────────────────────────────────────────
//  Per-learner local store key (IndexedDB via kv)
//  Each child gets their own isolated storage bucket.
// ─────────────────────────────────────────────────────────────

function getLearnerStorageKey(): string {
  if (typeof window === 'undefined') return 'milo-profile-v2'
  try {
    const raw = sessionStorage.getItem('milo_active_learner')
    if (!raw) return 'milo-profile-v2'
    const learner = JSON.parse(raw)
    if (learner?.id) return `milo-profile-${learner.id}`
  } catch {}
  return 'milo-profile-v2'
}

// ─────────────────────────────────────────────────────────────
//  Store
// ─────────────────────────────────────────────────────────────

interface MiloStore {
  profile:        PlayerProfile
  currentChapter: ChapterType | null
  isSpeaking:     boolean
  celebration:    CelebrationData | null

  completeSetup:      (name: string, avatarIndex: AvatarIndex) => void
  finishChapter:      (chapter: ChapterType, correct: number, wrong: number, mastered?: boolean) => ChapterScore
  dismissCelebration: () => void
  purchaseItem:       (itemId: string, cost: number) => boolean
  equipItem:          (slot: string, itemId: string) => void
  startChapter:       (chapter: ChapterType) => void
  setIsSpeaking:      (v: boolean) => void
  getNextChapter:     (chapter: ChapterType) => ChapterType | null

  // Load a learner's profile from the local store (kv) into the store
  loadLearner: (learnerId: string, displayName: string, avatarIndex: number) => void

  // Merge a learner's server-side state (cross-device) into the profile:
  // progress (stars/XP/level/streak), coins balance, owned + equipped items.
  applyServerProgress: (
    stats: LearnerStats | null,
    progress: LearnerProgress[],
    state: LearnerState | null,
  ) => void
}

export const useMiloStore = create<MiloStore>()(
  persist(
    (set, get) => ({
      profile:        { ...defaultProfile },
      currentChapter: null,
      isSpeaking:     false,
      celebration:    null,

      loadLearner: (learnerId, displayName, avatarIndex) => {
        // Read this learner's saved profile from their own local store key.
        // Synchronous: kv is hydrated by StorageGate before any page mounts.
        const key = `milo-profile-${learnerId}`
        try {
          const raw = kv.get(key)
          if (raw) {
            const saved = JSON.parse(raw)
            const savedProfile = saved?.state?.profile
            if (savedProfile) {
              set({
                profile: {
                  ...defaultProfile,
                  ...savedProfile,
                  // Always use latest name/avatar from Supabase (source of truth)
                  childName:         displayName,
                  avatarIndex:       avatarIndex as AvatarIndex,
                  hasCompletedSetup: true,
                  chapterStars: {
                    ...defaultChapterStars,
                    ...(savedProfile.chapterStars ?? {}),
                  },
                },
                currentChapter: null,
                celebration:    null,
              })
              return
            }
          }
        } catch {}

        // No saved data — fresh profile for this learner
        set({
          profile: {
            ...defaultProfile,
            childName:         displayName,
            avatarIndex:       avatarIndex as AvatarIndex,
            hasCompletedSetup: true,
          },
          currentChapter: null,
          celebration:    null,
        })
      },

      // Pull the learner's full state from Supabase so it appears on EVERY device
      // they sign in on. Everything merges monotonically (never regresses):
      //   stars/XP/streak → max(local, server)
      //   coins balance   → earned (server learner_stats) − spent (max local/server)
      //   owned items     → union; equipped → server when present
      applyServerProgress: (stats, progress, state) =>
        set(s => ({ profile: mergeServerProgress(s.profile, stats, progress, state) })),

      completeSetup: (name, avatarIndex) =>
        set(s => ({
          profile: { ...s.profile, childName: name, avatarIndex, hasCompletedSetup: true },
        })),

      finishChapter: (chapter, correct, wrong, mastered = false) => {
        const { stars, xp: xpGained, coins: coinsGained } = scoreChapter(correct, wrong, mastered)
        set(s => {
          const newXP     = s.profile.totalXP + xpGained
          const newCoins  = s.profile.totalCoins + coinsGained
          const newLevel  = getLevelFromXP(newXP)
          const prevStars = s.profile.chapterStars[chapter]

          return {
            profile: {
              ...s.profile,
              totalXP:        newXP,
              totalCoins:     newCoins,
              currentLevel:   newLevel,
              chapterStars: {
                ...s.profile.chapterStars,
                [chapter]: Math.max(prevStars, stars),
              },
            },
            currentChapter: null,
            celebration: {
              stars, xpGained, coinsGained,
              childName:        s.profile.childName,
              completedChapter: chapter,
            },
          }
        })
        // Return what we scored so callers (e.g. finishAndSync) can build the
        // sync payload without recomputing the same formula.
        return { stars, xp: xpGained, coins: coinsGained }
      },

      dismissCelebration: () => set({ celebration: null }),

      purchaseItem: (itemId, cost) => {
        const { profile } = get()
        if (profile.totalCoins < cost) return false
        if (profile.ownedItems.includes(itemId)) return false
        set(s => ({
          profile: {
            ...s.profile,
            totalCoins: s.profile.totalCoins - cost,
            coinsSpent: (s.profile.coinsSpent ?? 0) + cost,   // monotonic — for cross-device merge
            ownedItems: [...s.profile.ownedItems, itemId],
          },
        }))
        return true
      },

      equipItem: (slot, itemId) =>
        set(s => ({
          profile: {
            ...s.profile,
            equippedItems: { ...s.profile.equippedItems, [slot]: itemId },
          },
        })),

      startChapter:  (chapter) => set({ currentChapter: chapter }),
      setIsSpeaking: (v) => set({ isSpeaking: v }),

      getNextChapter: (chapter) => {
        const idx = CHAPTER_IDS.indexOf(chapter)
        if (idx === -1 || idx === CHAPTER_IDS.length - 1) return null
        return CHAPTER_IDS[idx + 1]
      },
    }),
    {
      // Key is dynamic — resolved at runtime based on active learner
      name:    'milo-profile-v2', // fallback, overridden by loadLearner
      // kv is async (IndexedDB-backed) and only safe to read after it hydrates,
      // so we skip auto-hydration here and trigger it from StorageGate once
      // kv.ready() resolves. See src/lib/kv.ts and StorageGate.
      skipHydration: true,
      storage: createJSONStorage(() => {
        // Custom storage that reads/writes the learner-specific key via kv.
        return {
          getItem: (name) => {
            const key = getLearnerStorageKey()
            return kv.get(key) ?? kv.get(name)
          },
          setItem: (name, value) => {
            const key = getLearnerStorageKey()
            kv.set(key, value)
          },
          removeItem: (name) => {
            const key = getLearnerStorageKey()
            kv.remove(key)
            kv.remove(name)
          },
        }
      }),
      partialize: (s) => ({ profile: s.profile }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<typeof current>
        if (!p?.profile) return current
        return {
          ...current,
          profile: {
            ...current.profile,
            ...p.profile,
            chapterStars: {
              ...defaultChapterStars,
              ...(p.profile.chapterStars ?? {}),
            },
          },
        }
      },
    }
  )
)