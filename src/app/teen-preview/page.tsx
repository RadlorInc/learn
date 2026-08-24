'use client'
/**
 * Preview any chapter by id, e.g. /teen-preview?c=coordinatePlane.
 *
 * ⚠️⚠️ THIS IS NOT A DEV-ONLY ROUTE, WHATEVER ITS OLD COMMENT SAID. `/diagnostic`'s report links a
 * LOGGED-OUT visitor here — `?c=<plan[0]>&taste=1` — so it is a production conversion surface, and
 * it rendered any of 72 chapters from a query parameter with no check of any kind. Measured, 12–30%
 * of those links (bands 9–11 through 17–18) pointed at a chapter whose start card offers **"Turn on
 * the camera"** to a child with no account and no consent captured. See `src/core/arChapters.ts`.
 *
 * The guard is here, at the ROUTE, and not on the list the founder's instruction named: the live
 * leak has no list — it is a deep link, and the URL is the picker. `useChapterAccess` refuses an AR
 * chapter whenever there is no session, whether or not `taste=1` is present, so a shared or guessed
 * URL is refused exactly like the linked one.
 */
import { useEffect, useState } from 'react'
import TasteBanner from '@/features/chapters/story/TasteBanner'
import { CHAPTER_COMPONENTS } from '@/features/chapters/registry'
import { useChapterAccess, CameraConsentCard } from '@/shared/ui/CameraConsentGate'
import type { ChapterType } from '@/core/chapters'

export default function TeenPreviewPage() {
  const [c, setC] = useState('integers')
  const [taste, setTaste] = useState(false)   // ?taste=1 → logged-out free sample from the diagnostic
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setC(p.get('c') || 'integers')
    setTaste(p.get('taste') === '1')
  }, [])

  // ⚠️ ABOVE THE EARLY RETURNS. A hook after a conditional return changes the hook count between
  // renders and React tears the page into the error boundary — the same rule `RotateGate` carries.
  const access = useChapterAccess(c)

  const Chapter = CHAPTER_COMPONENTS[c as ChapterType]
  if (!Chapter) return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>Unknown chapter: {c}</div>
  // Fail closed: nothing of the chapter mounts until the session is known.
  if (access === 'checking') return null
  if (access === 'blocked') return <CameraConsentCard />
  return <>{<Chapter onComplete={() => {}} childName="Sam" />}{taste && <TasteBanner />}</>
}
