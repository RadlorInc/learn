'use client'
/**
 * Render one chapter to a visitor who may have no account, behind the camera guard.
 *
 * ⚠️⚠️ THIS EXISTS SO THE GUARD HAS ONE HOME. Two routes now show a chapter to a logged-out
 * visitor — `/teen-preview` (the diagnostic's taste link) and `/demo` — and the guard they need is
 * the COPPA one: an AR chapter must never render without a session, because its start card offers
 * "Turn on the camera" to a child nobody has consented for. A second copy of that check is a second
 * thing to keep in step, and the day the two disagree is the day a camera chapter is demo-eligible.
 * Same argument `arChapters.ts` makes for deriving `demoEligible` from `isArChapter` rather than
 * keeping an allow-list: one fact, two readings.
 *
 * ⚠️ FAILS CLOSED. Nothing of the chapter mounts until the session is known — `access === 'checking'`
 * renders nothing rather than the chapter, so a slow session lookup cannot flash one frame of a
 * camera chapter at a child.
 */
import { CHAPTER_COMPONENTS } from '@/features/chapters/registry'
import { useChapterAccess, CameraConsentCard } from '@/shared/ui/CameraConsentGate'
import type { ChapterType } from '@/core/chapters'

export function GuardedChapter({ id, onComplete, childName = 'Sam' }: {
  id: string
  /** ⚠️ Real callers must do something with this. `/teen-preview` passes a no-op on purpose (it is
   *  a taste, with nothing to advance); `/demo` counts the completion. A discarded callback is how
   *  this repo lost three months on the plan pointer, so it is worth saying which one you are. */
  onComplete: () => void
  childName?: string
}) {
  // ⚠️ ABOVE THE EARLY RETURNS. A hook after a conditional return changes the hook count between
  // renders and React tears the page into the error boundary — the rule `RotateGate` carries too.
  const access = useChapterAccess(id)
  const Chapter = CHAPTER_COMPONENTS[id as ChapterType]
  if (!Chapter) return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>Unknown chapter: {id}</div>
  if (access === 'checking') return null
  if (access === 'blocked') return <CameraConsentCard />
  return <Chapter onComplete={onComplete} childName={childName} />
}
