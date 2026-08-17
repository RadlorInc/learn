'use client'
export const dynamic = 'force-static'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, Suspense } from 'react'
import nextDynamic from 'next/dynamic'
import { useMiloStore, type ChapterType } from '@/state/store'
import { getChapter, type AgeGroup } from '@/core/chapters'

import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { setLastPlayed } from '@/infra/storage/lastPlayed'
import CelebrationModal from '@/shared/ui/CelebrationModal'
import MiloPointer from '@/shared/ui/MiloPointer'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import { useAuthGuard } from '@/data/supabase/useAuthGuard'
import { track } from '@/infra/analytics'
import { CHAPTER_COMPONENTS } from '@/features/chapters/registry'

// Teen chapters render their own full-screen portal + MasteryState completion, so
// the kids' CelebrationModal (which also auto-speaks) must NOT mount for them.
const TEEN_AGE_GROUPS: AgeGroup[] = ['12-14', '15-16', '17-18']
const isTeenChapter = (id: ChapterType | null) =>
  !!id && (getChapter(id)?.ageGroups ?? []).some(g => TEEN_AGE_GROUPS.includes(g))

export default function GamePage() {
  const router         = useRouter()
  const authed         = useAuthGuard()
  const profile        = useMiloStore(s => s.profile)
  const currentChapter = useMiloStore(s => s.currentChapter)
  const celebration    = useMiloStore(s => s.celebration)
  const { flushQueue } = useChapterSync()

  const [playingChapter,  setPlayingChapter]  = useState(currentChapter)
  const [chapterDone,    setChapterDone]    = useState(false)
  const [ready,          setReady]          = useState(false)
  const [childName,      setChildName]      = useState(profile.childName)

  // Guards against a chapter firing onComplete twice (double-tap / re-render):
  // a second call would double-count XP, coins and stars both locally and via
  // sync. Reset when a new chapter opens.
  const completedRef = useRef(false)

  useEffect(() => {
    const learner = getActiveLearner()
    if (learner) {
      setChildName(learner.display_name)
      // Save last played chapter for resume flow (timestamped; reconciled with
      // the server on the menu so "Continue" syncs across devices).
      if (currentChapter) setLastPlayed(learner.id, currentChapter)
    }
    if (navigator.onLine) flushQueue()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (currentChapter) {
      setPlayingChapter(currentChapter)
      track('chapter_open', { chapter: currentChapter })
      setChapterDone(false)
      completedRef.current = false
      setReady(true)
      return
    }

    if (!celebration) {
      router.replace('/menu')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapter])

  function handleComplete(_correct: number, _wrong: number, _mastered?: boolean) {
    if (!playingChapter) return
    if (completedRef.current) return   // ignore a double-fired completion
    completedRef.current = true
    setChapterDone(true)
    /**
     * ⚠️ THE TRACKING AND THE PLAN POINTER USED TO LIVE HERE, AND NEVER RAN. This function is
     * handed to a chapter as `ChapterProps.onComplete`, and both registry factories in
     * `ChapterPortal` discard that prop — `StoryChapter(_props)` never reads it and `TeenChapter`
     * reads only `props.childName`. The portal calls `finishAndSync` itself, so every chapter
     * scored correctly while the plan sat still. Moved into `finishAndSync`, which is the single
     * function all four completion paths route through.
     *
     * This is kept as a no-op-safe hook for the ONE path that still uses it (a chapter mounted
     * directly by this page rather than through the portal) and must NOT call `finishAndSync`
     * again: the portal has already scored the run, and a second call double-writes the session
     * and double-awards XP and coins.
     */
  }

  if (!ready && !playingChapter) return null

  const props = { onComplete: handleComplete, childName: childName || profile.childName }

  if (authed === 'checking') return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FCEAB6', fontSize: 48 }}>🦊</div>
  )

  return (
    <>
    {/* Full-screen stage: holds the background and clips so nothing scrolls. The
        chapter is centered-at-top and scaled by the fit controller. */}
    <div className="kit-screen" style={{ background: 'var(--bg-page)', position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {/* Every chapter `createPortal`s itself to document.body, so nothing renders in flow here —
          this element is only the mount point and the backdrop behind the portal. */}
      {!chapterDone && playingChapter && (() => {
        const Chapter = CHAPTER_COMPONENTS[playingChapter]
        return Chapter ? (
          <Suspense fallback={null}>
            <Chapter {...props} />
          </Suspense>
        ) : null
      })()}
    </div>
    {/* Modal + pointer live OUTSIDE the zoom wrapper so they stay full-screen and
        their fixed coords aren't double-scaled. The counting story renders its own
        celebration over the forest, so we skip the global one there. */}
    {playingChapter !== 'counting' && !isTeenChapter(playingChapter) && <CelebrationModal />}
    <MiloPointer />
    </>
  )
}