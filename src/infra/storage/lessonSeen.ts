'use client'
/**
 * Per-learner memory of "this chapter's LESSON has been sat through once".
 *
 * A chapter that teaches before it tests has to teach the first time and only the first time. The
 * six-colour lesson is right for a child meeting the words, and a wall between a returning child and
 * the part they actually want to play — but a skip offered on the very first run is a three-year-old
 * skipping the teaching, every time, and then failing the test it exists to prepare them for.
 *
 * So the skip appears only once the lesson has been finished at least once. Same store and same
 * shape as [[chapterLevel]]: per-device kv, keyed by learner + chapter.
 *
 * UNLIKE chapterLevel, no learner falls back to a DEVICE key rather than to no memory at all. The
 * difficulty a child left off on is genuinely theirs and guessing it for a stranger would be wrong;
 * "somebody on this device has already sat through the colour lesson" is not, and the alternative is
 * that every signed-out session — which is how the preview route and any shared tablet run — is
 * offered the skip never, so the feature may as well not exist there. The cost if two siblings share
 * a device is that the second one is offered a small corner button early, which is why it is worded
 * for the grown-up and not shouted at the child.
 */
import type { ChapterType } from '@/data/supabase/types'
import { kv } from '@/infra/storage/kv'

const key = (learnerId: string | undefined | null, chapter: ChapterType) =>
  `milo-lesson-${learnerId || 'device'}-${chapter}`

/** Has this learner (or this device) already been through this chapter's lesson? */
export function lessonSeen(learnerId: string | undefined | null, chapter: ChapterType): boolean {
  try {
    return kv.get(key(learnerId, chapter)) === '1'
  } catch {
    return false
  }
}

/** Record that the lesson has been completed. Call when the teaching phase ends. */
export function markLessonSeen(learnerId: string | undefined | null, chapter: ChapterType): void {
  try {
    kv.set(key(learnerId, chapter), '1')
  } catch {
    /* best-effort */
  }
}
