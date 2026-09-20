'use client'
/**
 * Render one chapter to a visitor who may have no account.
 *
 * ⚠️ The COPPA camera guard that used to live here went with the AR chapters (2026-09-20): no
 * chapter asks for the camera any more, so `useChapterAccess` could only ever answer "allowed"
 * and `CameraConsentCard` was unreachable. **Restore both from git history before adding a
 * chapter that turns on a camera** — the rule it enforced (never render one without a session)
 * has not changed, only the set it applied to.
 */
import { CHAPTER_COMPONENTS } from '@/features/chapters/registry'
import { isChapterVisible, type ChapterType } from '@/core/chapters'
import { NewLessonsSoon } from '@/shared/ui/NewLessonsSoon'

export function GuardedChapter({ id, onComplete, onExit, childName = 'Sam' }: {
  id: string
  /** ⚠️ Real callers must do something with this — `/demo` counts the completion. A discarded
   *  callback is how this repo lost three months on the plan pointer. */
  onComplete: (correct: number, wrong: number, mastered?: boolean) => void
  /** Where the chapter's own back button goes. Omitted → `/menu`, which bounces a logged-out
   *  visitor to `/auth`; any caller that expects one should pass its own. */
  onExit?: () => void
  childName?: string
}) {
  const Chapter = CHAPTER_COMPONENTS[id as ChapterType]
  if (!isChapterVisible(id)) return <NewLessonsSoon back="/" label="Home" />
  if (!Chapter) return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>Unknown chapter: {id}</div>
  return <Chapter onComplete={onComplete} onExit={onExit} childName={childName} />
}
