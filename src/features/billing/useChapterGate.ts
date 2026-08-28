'use client'
/**
 * The chapter gate's wiring. Asks the database once, per chapter, before the chapter mounts.
 *
 * ⚠️⚠️ RESOLVED ONCE AND NEVER REVISITED — THAT IS WHAT MAKES "NEVER MID-CHAPTER" STRUCTURAL. The
 * rule is that a child who has started finishes, and the way to keep it is not to remember to keep
 * it: the effect keys on the chapter id, the answer is written once, and `/game` does not mount the
 * chapter component at all until the verdict is `allowed`. There is no later evaluation for a
 * re-render to flip, so there is no state in which a question can be interrupted by money.
 */
import { useEffect, useState } from 'react'
import { isChapterEntitled } from '@/data/repositories'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { gateVerdict, type GateVerdict } from '@/features/billing/chapterGate'

export function useChapterGate(chapterId: string | null): GateVerdict {
  // `undefined` = not answered yet · `null` = asked and could not find out (→ allowed).
  const [entitled, setEntitled] = useState<boolean | null | undefined>(undefined)
  // Read once, at mount, for the same reason: a learner switching under a live chapter must not
  // re-gate the child who is already playing.
  const [learnerId] = useState<string | null>(() => {
    try { return getActiveLearner()?.id ?? null } catch { return null }
  })

  useEffect(() => {
    if (!chapterId || !learnerId) return
    let live = true
    isChapterEntitled(learnerId, chapterId)
      .then(v => { if (live) setEntitled(v) })
      // ⚠️ null, not false. A failed lookup is not a refusal — see chapterGate.gateVerdict.
      .catch(() => { if (live) setEntitled(null) })
    return () => { live = false }
  }, [chapterId, learnerId])

  // ⚠️ DERIVED DURING RENDER, not assigned inside the effect. An effect runs after paint, so
  // setting the verdict there paints one frame of the previous chapter's answer — the same rule
  // this repo carries for a journey's phase and for the camera guard, and here it would mean one
  // frame of a chapter a child is about to be refused.
  return gateVerdict(learnerId, chapterId ? entitled : undefined)
}
