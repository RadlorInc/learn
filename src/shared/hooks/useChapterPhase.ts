'use client'
import { useState, type Dispatch, type SetStateAction } from 'react'
import type { ChapterType } from '@/data/supabase/types'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { hasChapterResume } from '@/infra/storage/chapterResume'

/**
 * A chapter's phase state, with a DEV-ONLY way to open straight at a later phase.
 *
 * ⚠️ WHY THIS EXISTS: a storybook chapter's scored round could not be reached by a test at all.
 * The harness has to sit through an intro, a showcase, a demo and a guided round, and the guided
 * round wants a CORRECT answer — which a blind driver cannot produce. Measured 2026-08-21: only
 * 11 of 20 chapters reached a scored round inside a 120s budget, and the nine that did not were
 * the ones whose guided round has a right answer. So every gate that lives on a scored screen —
 * the duplicate-pill check is the one we have — silently covered less than half the band.
 *
 * ⚠️ THE ALTERNATIVE WAS WORSE. Teaching the driver each chapter's answers makes it a
 * chapter-specific driver, and `storybook-pills.spec.ts` already carries the note that "a
 * chapter-specific driver is a driver that silently skips chapters". This skips the teaching
 * rather than faking it, and lands on exactly the screen the check is about.
 *
 * `?e2e=practice` is honoured ONLY outside production, exactly like the teen band's
 * `data-test-answer` and the 3D chapter's `window.__miloPace`. `process.env.NODE_ENV` is inlined
 * by the bundler, so the branch is dead code in a production build — verified by grepping
 * `.next/server` and `.next/static` for the parameter name.
 *
 * ⚠️ The value is a STRING OFF THE URL and is cast to the chapter's own Phase union: unsound by
 * construction, and acceptable only because nothing but a test can set it. A wrong value simply
 * renders nothing, which is a visible failure rather than a silent one.
 *
 * `resumeAt` is the OTHER reason a chapter opens somewhere other than its intro: the child has an
 * unfinished run of it. Passing it opens straight at the named phase, which is what "pick up exactly
 * where I left off" means — sitting through the intro, the demo and a guided round again is most of
 * what made restarting feel like losing the work. The phase is passed rather than assumed, so it is
 * checked against the chapter's own union instead of being cast into it like the e2e value above.
 *
 * ⚠️ The demo is SKIPPED on a resume, deliberately: the child has already watched it this run. A
 * chapter whose teaching a returning child genuinely needs again should point `phase` at its demo
 * instead — that is a per-chapter judgement and this hook does not make it for them.
 */
export function useChapterPhase<T extends string>(
  initial: T,
  resumeAt?: { chapter: ChapterType; phase: T },
): [T, Dispatch<SetStateAction<T>>] {
  return useState<T>(() => {
    if (typeof window === 'undefined') return initial
    if (process.env.NODE_ENV !== 'production') {
      const want = new URLSearchParams(window.location.search).get('e2e')
      if (want) return want as T
    }
    // An unfinished run wins over the intro. No learner, no saved run, or an expired one → initial.
    if (resumeAt && hasChapterResume(getActiveLearner()?.id ?? null, resumeAt.chapter)) return resumeAt.phase
    return initial
  })
}
