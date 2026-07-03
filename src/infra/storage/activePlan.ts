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

/** { done, total } for a progress readout ("Step 2 of 5"). */
export function planProgress(learnerId: string): { done: number; total: number } | null {
  const p = getActivePlan(learnerId)
  return p ? { done: Math.min(p.index, p.chapters.length), total: p.chapters.length } : null
}

export function clearActivePlan(learnerId: string): void {
  try { localStorage.removeItem(key(learnerId)) } catch { /* ignore */ }
}
