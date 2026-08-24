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
import { GuardedChapter } from '@/features/chapters/GuardedChapter'

export default function TeenPreviewPage() {
  const [c, setC] = useState('integers')
  const [taste, setTaste] = useState(false)   // ?taste=1 → logged-out free sample from the diagnostic
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setC(p.get('c') || 'integers')
    setTaste(p.get('taste') === '1')
  }, [])

  // The guard moved to `GuardedChapter` when `/demo` became a second logged-out door — see the note
  // there. ⚠️ The no-op `onComplete` is deliberate: a taste has nothing to advance. `/demo` is the
  // caller that counts.
  return <>{<GuardedChapter id={c} onComplete={() => {}} />}{taste && <TasteBanner />}</>
}
