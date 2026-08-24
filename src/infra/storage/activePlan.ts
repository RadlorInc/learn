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
  /**
   * ⚠️ WHERE THE PLAN CAME FROM, AND IT IS NOT BOOKKEEPING — IT DECIDES WHAT WE MAY SAY ABOUT IT.
   * The plan card's own words are "Milo picked this to close the gap", which is true of a diagnosed
   * plan and FALSE of a grade-start one: nobody looked, so there is no gap to have closed. Same
   * family as the diagnostic's never-say-"on-track" rule — the claim has to match the evidence, and
   * without this field the UI cannot tell the two apart. Absent = 'diagnostic' (every plan written
   * before 2026-08-24 came from a completed check).
   */
  source?: 'diagnostic' | 'gradeStart'
}

const key = (learnerId: string) => `milo_active_plan_${learnerId}`

export function setActivePlan(learnerId: string, band: string, chapters: string[], source: 'diagnostic' | 'gradeStart' = 'diagnostic'): ActivePlan | null {
  if (!learnerId || chapters.length === 0) return null
  const plan: ActivePlan = { learnerId, band, chapters: [...chapters], index: 0, startedAt: new Date().toISOString(), source }
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

/**
 * CROSS-DEVICE RECONCILIATION — the plan pointer survives a device switch.
 *
 * ⚠️ THE POINTER IS localStorage, SO IT USED TO DIE WITH THE BROWSER. A parent who ran the check
 * on their phone and handed the child a tablet got no plan at all: the "Continue your plan" card
 * simply did not render, and the diagnostic's whole output — the thing the product is for —
 * existed only on the device that produced it.
 *
 * ⚠️ DERIVED, NOT SYNCED, AND THAT IS THE POINT. `diagnostic_plan_progress` exists for this and is
 * write-once/read-never (77 rows, all `todo`), so the obvious fix is a second write path that can
 * disagree with the first. It is not needed: the plan's `chapter_sequence` is already on the server
 * and `learner_progress` already records which chapters have been played, so the pointer is a
 * FUNCTION of data that is already synced. Nothing new to write, nothing to keep in step, and it
 * self-heals if a device misses a write.
 *
 * ⚠️ MONOTONIC, like `mergeServerProgress`: the pointer only ever moves FORWARD. A device that is
 * behind must never drag a child back to a chapter they finished, and a local plan that has been
 * REVISED deeper keeps its own chapter list — the remote copy predates the revision and would undo
 * it.
 *
 * Returns the reconciled plan, or null when there is nothing to reconcile.
 */
export function reconcilePlan(
  learnerId: string,
  remoteChapters: string[],
  completedChapterIds: readonly string[],
): ActivePlan | null {
  const local = getActivePlan(learnerId)
  // A revised local plan is AHEAD of the remote one; seeding from remote would drop the deeper
  // chapter the revision just added.
  const chapters = local ? local.chapters : remoteChapters
  if (chapters.length === 0) return null

  const done = new Set(completedChapterIds)
  // The leading run of finished plan chapters. A chapter played OUT of order does not move the
  // pointer, which is the same rule `advancePlan` enforces locally.
  let derived = 0
  while (derived < chapters.length && done.has(chapters[derived])) derived++

  const plan: ActivePlan = {
    learnerId,
    band: local?.band ?? '',
    chapters,
    index: Math.max(local?.index ?? 0, derived),
    startedAt: local?.startedAt ?? new Date().toISOString(),
    ...(local?.revised ? { revised: true } : null),
  }
  try { localStorage.setItem(key(learnerId), JSON.stringify(plan)) } catch { /* storage unavailable */ }
  return plan
}

/** { done, total } for a progress readout ("Step 2 of 5"). */
export function planProgress(learnerId: string): { done: number; total: number } | null {
  const p = getActivePlan(learnerId)
  return p ? { done: Math.min(p.index, p.chapters.length), total: p.chapters.length } : null
}
