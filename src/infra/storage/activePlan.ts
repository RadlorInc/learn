/**
 * Active plan — the diagnostic's arranged chapter sequence, made walkable in the real app.
 *
 * The diagnostic produces an ordered `planChapters` (foundational-first). We stash it per learner
 * here so the app can (step 6) drop the child into the real, progress-saving game on that plan and
 * (step 7) walk them through it chapter by chapter: the menu shows "Next up …", and each time a plan
 * chapter is completed in /game we advance the pointer. Client-side + per-learner (localStorage); the
 * authoritative copy also lives in the DB via saveDiagnostic (diagnostic_plans), but this is the light
 * pointer the UI reads without a round-trip.
 */
export interface ActivePlan {
  learnerId: string
  band: string
  chapters: string[]   // chapters.ts ids, foundational-first
  index: number        // pointer to the current (next-to-play) chapter
  startedAt: string
  revised?: boolean    // play-data revision already applied (fires at most once)
}

const key = (learnerId: string) => `milo_active_plan_${learnerId}`

export function setActivePlan(learnerId: string, band: string, chapters: string[]): ActivePlan | null {
  if (!learnerId || chapters.length === 0) return null
  const plan: ActivePlan = { learnerId, band, chapters: [...chapters], index: 0, startedAt: new Date().toISOString() }
  try { localStorage.setItem(key(learnerId), JSON.stringify(plan)) } catch { /* storage unavailable */ }
  return plan
}

export function getActivePlan(learnerId: string): ActivePlan | null {
  try {
    const raw = localStorage.getItem(key(learnerId))
    if (!raw) return null
    const p = JSON.parse(raw) as ActivePlan
    return p && Array.isArray(p.chapters) ? p : null
  } catch { return null }
}

/** The chapter the child should play next, or null when the plan is complete. */
export function currentPlanChapter(learnerId: string): string | null {
  const p = getActivePlan(learnerId)
  if (!p || p.index >= p.chapters.length) return null
  return p.chapters[p.index]
}

/** Step 7: when a chapter is finished, advance the pointer IF it was the current plan chapter.
 *  Returns the next chapter to play (or null if the plan is now complete / not the plan chapter). */
export function advancePlan(learnerId: string, completedChapterId: string): string | null {
  const p = getActivePlan(learnerId)
  if (!p || p.index >= p.chapters.length) return null
  if (p.chapters[p.index] !== completedChapterId) return currentPlanChapter(learnerId)   // off-plan play — leave pointer
  p.index += 1
  try { localStorage.setItem(key(learnerId), JSON.stringify(p)) } catch { /* ignore */ }
  return p.index < p.chapters.length ? p.chapters[p.index] : null
}

/** Play-data revision: the child STRUGGLED in the plan's FIRST chapter (the diagnosed root), so
 *  the true gap sits deeper — prepend the deeper prerequisite chapter so it becomes the new
 *  current step. Fires at most ONCE per plan (one level of revision is evidence-driven; repeated
 *  automatic descent without a fresh diagnostic would be guessing) and only while the pointer is
 *  still on step 0 — struggle later in the plan is normal learning, not a wrong diagnosis.
 *  Returns the new current chapter, or null if no revision applied. */
export function revisePlanDeeper(learnerId: string, struggledChapterId: string, deeperChapterId: string): string | null {
  const p = getActivePlan(learnerId)
  if (!p || p.revised || p.index !== 0) return null
  if (p.chapters[0] !== struggledChapterId || p.chapters.includes(deeperChapterId)) return null
  p.chapters.unshift(deeperChapterId)
  p.revised = true
  try { localStorage.setItem(key(learnerId), JSON.stringify(p)) } catch { /* ignore */ }
  return deeperChapterId
}

/**
 * THE WHOLE END-OF-CHAPTER PLAN DECISION, in one place.
 *
 * ⚠️ THIS EXISTS BECAUSE THE DECISION USED TO LIVE IN `app/game/page.tsx`'s `handleComplete`, WHICH
 * NEVER RAN. `handleComplete` reached a chapter as `ChapterProps.onComplete` — and both registry
 * factories in `ChapterPortal` drop it (`function StoryChapter(_props)`, and `TeenChapter` reads
 * only `props.childName`). The portal calls `finishAndSync` itself, so the SESSION was written and
 * everything else in `handleComplete` was dead: the pointer never advanced, the revision never
 * fired, and no completion event was ever recorded.
 *
 * Production, three months: **797 `chapter_open` events, 40 completed sessions, ZERO
 * `practice_complete`** — and 77 of 77 `diagnostic_plan_progress` rows still `status = 'todo'`.
 * Every child who finished the first chapter of their plan was handed that same chapter again,
 * for ever. Nothing threw; the chapter scored normally and the menu just never moved on.
 *
 * It lives HERE, called from `finishAndSync`, because that is the single function every completion
 * path already routes through — the portal (all 46 chapters), `CountingStoryChapter`, and `/game`.
 * Putting it back in a caller would leave the next caller broken in exactly the same silent way.
 */
export function advanceAfterChapter(
  learnerId: string,
  completedChapterId: string,
  correct: number,
  wrong: number,
  mastered: boolean,
  deeperFor: (chapterId: string) => string | null,
): { kind: 'revised' | 'advanced'; to: string | null } | null {
  const plan = getActivePlan(learnerId)
  if (!plan) return null

  // Play-data revision: the probe's root can sit one level SHALLOW when a prerequisite was
  // lucky-guessed (~25% on a 4-choice item), and the plan's FIRST chapter is a dozen adaptive
  // questions on that very skill — far stronger evidence than one probe item. "Struggled" is
  // deliberately conservative: a false trigger silently rewrites a child's plan, a miss just means
  // chapter one is slow. `mastered` can never coincide — it requires a correct streak.
  const total = correct + wrong
  const struggled = !mastered && total >= 4 && correct / total < 0.5
  const atRoot = plan.index === 0 && plan.chapters[0] === completedChapterId
  if (atRoot && struggled) {
    const deeper = deeperFor(completedChapterId)
    const applied = deeper ? revisePlanDeeper(learnerId, completedChapterId, deeper) : null
    // Revised: the pointer now rests on the deeper chapter, so it must NOT also advance past the
    // root. Only a successful revision short-circuits — if it did not apply, fall through.
    if (applied) return { kind: 'revised', to: applied }
  }
  return { kind: 'advanced', to: advancePlan(learnerId, completedChapterId) }
}

/** { done, total } for a progress readout ("Step 2 of 5"). */
export function planProgress(learnerId: string): { done: number; total: number } | null {
  const p = getActivePlan(learnerId)
  return p ? { done: Math.min(p.index, p.chapters.length), total: p.chapters.length } : null
}
