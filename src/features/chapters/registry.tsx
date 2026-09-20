'use client'
/**
 * The chapter registry — every chapter that runs on the shared portal, as data.
 *
 * These chapters used to be 55 near-identical wrapper files whose only real
 * content was the four values below (skill id, backdrop / band, which experience
 * to mount, and the mastery copy). The plumbing lives in ChapterPortal; this file
 * is the table. Adding a chapter is one row.
 *
 * Each row keeps its own dynamic import, so chapters stay code-split exactly as
 * they were — the portal is built inside the loader, after the chunk resolves.
 *
 * The table itself lives in `storyChapters.tsx`, because `/story` renders those same
 * experiences bare and must not pull the portal's Supabase chain in with them.
 */
import nextDynamic from 'next/dynamic'
import { makeStoryChapter, type ChapterProps } from '@/features/chapters/ChapterPortal'
import { STORY_CHAPTERS, type StorySkill } from '@/features/chapters/storyChapters'
import type { ChapterType } from '@/core/chapters'

type Loaded = { default: React.ComponentType<ChapterProps> }
const lazy = (load: () => Promise<Loaded>) => nextDynamic(load, { ssr: false })

/** Each story experience, wrapped in the portal. Cast so `CHAPTER_COMPONENTS`'s
 *  `Record<ChapterType, …>` still fails to compile when a chapter is missing —
 *  `Object.fromEntries` alone would widen to an index signature and lose that. */
const STORY_PORTALS = Object.fromEntries(
  Object.entries(STORY_CHAPTERS).map(([skill, { bg, load }]) =>
    [skill, lazy(() => load().then(m => ({ default: makeStoryChapter(skill as ChapterType, bg, m.default) })))],
  ),
) as Record<StorySkill, React.ComponentType<ChapterProps>>

/** id → component for every chapter in the app. Record<> enforces completeness. */
export const CHAPTER_COMPONENTS: Record<ChapterType, React.ComponentType<ChapterProps>> = {
  ...STORY_PORTALS,
  // The one chapter that still has a bespoke wrapper: counting owns a world picker that
  // "play again" returns to, which is a different run SHAPE, not a different backdrop.
  counting: lazy(() => import('@/features/chapters/game/CountingStoryChapter')),
}
