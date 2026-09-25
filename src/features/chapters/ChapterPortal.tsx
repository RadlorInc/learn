'use client'
/**
 * The shared chapter portal — the plumbing every chapter wrapper used to repeat.
 *
 * Each chapter is mounted as a full-screen portal over the app, runs one attempt,
 * syncs the result once, and can be replayed. That was ~40–110 lines duplicated
 * across 55 near-identical wrapper files; it now lives here once and each chapter
 * is a row in the registry (see app/game/page.tsx).
 *
 * Two shapes, because the bands genuinely differ:
 *   • story (3–11) — the experience owns its own ending; a CelebrationModal sits
 *     over the portal, and the backdrop colour is per-chapter.
 *   • teen (12–18) — the band skin is scoped by `data-band`, the run ends on a
 *     MasteryState card, and speech is stopped on exit/unmount. An optional
 *     Explore sim can precede the game.
 */
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import { stopSpeech } from '@/infra/useMiloSpeaker'
import ChapterDone from '@/shared/ui/ChapterDone'
import DirectionsCard from '@/features/chapters/DirectionsCard'
import { ChapterTakeContext } from '@/features/chapters/story/take'
import type { ChapterType } from '@/core/chapters'

export type ChapterProps = {
  onComplete: (correct: number, wrong: number, mastered?: boolean) => void
  childName: string
  /**
   * ⚠️ WHERE "BACK" GOES. Defaults to `/menu`, which is right for a signed-in child and wrong for
   * every visitor who has not signed in yet: `/menu` bounces them to `/auth`, so abandoning a demo
   * chapter lands a parent on a login wall at the exact moment we were trying to earn the right to
   * ask for a login. And abandoning is the MAIN exit — most people who open a chapter look, poke
   * and leave; finishing is the rarer path.
   *
   * ⚠️ A DESTINATION, NOT A CONDITION. The portal must not learn about sessions, demos or auth —
   * the caller knows where its own back button belongs and passes it. A parameter, not knowledge.
   */
  onExit?: () => void
}
type Finish = (correct: number, wrong: number, mastered?: boolean) => void

/**
 * Portal mount + one-shot result sync + replay. `quiet` also stops speech on unmount.
 *
 * ⚠️⚠️ `onComplete` IS THE PROP THAT COST THIS REPO THREE MONTHS, AND IT IS NOW ACTUALLY CALLED.
 * `ChapterProps.onComplete` has been part of every chapter's signature since the beginning and both
 * registry factories took it as `_props` and dropped it — so `/game`'s handler never ran and no
 * child's plan advanced. That was fixed by moving the plan pointer into `finishAndSync`, which was
 * the right call (it is the one function every completion path reaches) and left the PROP behind,
 * still in the type, still looking wired. A callback that looks connected and is not is exactly the
 * shape of the original fault, sitting there for the next caller to trust.
 *
 * `/demo` is that next caller: a logged-out visitor has no learner, so `finishAndSync` returns at
 * `if (!learner) return` and the demo would never learn the chapter finished. So the prop is real
 * now — called AFTER the sync, so a throw in a caller's handler cannot cost a child their score.
 *
 * ⚠️ HELD IN A REF so `finish` keeps its identity. Callers pass an inline arrow; threading it
 * through the dep array would give every chapter a new `onFinish` on every render.
 */
function usePortalRun(skill: ChapterType, quiet: boolean, onComplete?: Finish) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync(skill)
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  // ⚠️ STATE, not just the ref: the ref stops a double-score, this opens the end card. They were
  // one thing while the card read `celebration` out of the zustand store; the store went with the
  // XP economy (2026-09-20) and the portal owns the moment now.
  const [done, setDone] = useState(false)
  const doneRef = useRef(false)
  const cbRef = useRef(onComplete)
  cbRef.current = onComplete

  useEffect(() => {
    setBody(document.body)
    if (quiet) return () => stopSpeech()
  }, [quiet])

  // Guarded: a chapter may report completion more than once (a late timer, a
  // double-tap); only the first attempt is scored.
  const finish = useCallback<Finish>((c, w, mastered) => {
    if (doneRef.current) return
    doneRef.current = true
    setDone(true)
    finishAndSync(skill, c, w, 'practice', mastered)
    // After the sync, and guarded: the score is already written and a caller's handler must never
    // be able to undo it. Same reasoning as the plan pointer's own try/catch in `finishAndSync`.
    try { cbRef.current?.(c, w, mastered) } catch { /* a caller's bookkeeping is not the child's score */ }
  }, [finishAndSync, skill])

  const replay = useCallback(() => { doneRef.current = false; setDone(false); setRunKey(k => k + 1) }, [])
  // A sitting that stopped after CHAPTER_TAKE questions, run unfinished: the card says the spot is saved.
  const [take, setTake] = useState<number | undefined>()

  return { router, body, runKey, finish, replay, done, take, setTake }
}

// ─── Story chapters (3–11) ──────────────────────────────────────────────────

/** Story experiences declare these props optional (they can run standalone in
 *  /story), so the portal's contract is the subset it actually passes. `world`
 *  is only ever passed by /story's `?world=` preview link; the portal never sets it. */
export type StoryProps = { onFinish?: Finish; onExit?: () => void; world?: string }
export type StoryInner = React.ComponentType<StoryProps>

export function makeStoryChapter(skill: ChapterType, bg: string, Inner: StoryInner) {
  return function StoryChapter(props: ChapterProps) {
    const { router, body, runKey, finish, replay, done, take, setTake } = usePortalRun(skill, false, props.onComplete)
    if (!body) return null
    const exit = () => props.onExit ? props.onExit() : router.push('/menu')
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: bg }}>
        <ChapterTakeContext.Provider value={setTake}>
          <Inner key={runKey} onFinish={finish} onExit={exit} />
        </ChapterTakeContext.Provider>
        {/* The typed "what to do" note, in one place for all 24 story chapters rather than 24 copies. */}
        <DirectionsCard chapter={skill} />
        <ChapterDone open={done || !!take} take={done ? undefined : take} childName={props.childName} onExit={exit} onPlayAgain={replay} />
      </div>,
      body,
    )
  }
}
