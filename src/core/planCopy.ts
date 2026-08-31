/**
 * What the plan card says under "Next: <chapter>", and why it is a pure module rather than a
 * ternary in the menu.
 *
 * ⚠️ A CHAPTER THE CHILD HAS ALREADY FINISHED CAN COME BACK, AND WITHOUT A REASON IT READS AS A
 * PUNISHMENT. A re-check's plan is built from the gap, so a chapter completed last week can be the
 * right next step — the pointer only skips the LEADING run of finished chapters, deliberately,
 * because "completed once" is not "learned". But a child who finished something yesterday and is
 * handed it again reads exactly one thing into it: *I got that wrong.* Founder's note, 2026-08-31.
 * One line turns it from a verdict into a reason.
 *
 * ⚠️ AND THE REASON HAS TO MATCH THE EVIDENCE, which is why `source` is here too. After a check we
 * may say Milo saw something; after a SKIP nobody looked, and claiming a gap would be the same
 * falsehood the plan card's own comment already forbids ("Milo picked this to close the gap" is
 * true of a diagnosed plan and a lie about a grade-start one).
 *
 * Pure and exported so a gate can read the words a child reads — the component cannot be driven
 * without a signed-in learner (`getLearnerBootstrap` 401s in e2e), so a string built inline here
 * would be invisible to every check in the repo.
 */
export type PlanSource = 'diagnostic' | 'gradeStart'

export function planLine(source: PlanSource, alreadyPlayed: boolean): string {
  if (source === 'gradeStart') {
    return alreadyPlayed
      ? "You've played this one — a quick second go, then something new."
      : 'Starting from the beginning — Milo adjusts as they play.'
  }
  return alreadyPlayed
    ? "You've played this one — Milo saw something here worth another go."
    : 'Milo picked this to close the gap — a few minutes today.'
}

/**
 * The child's own door to the check, on their own screen. The words live here, with the plan's,
 * because the same rule applies: nothing in the repo can see a string built inside `/menu` — that
 * page needs a signed-in learner to render at all.
 */
export const CHECK_DOOR = {
  title: 'Find my starting point',
  blurb: 'Milo asks some questions and works out what to play next. Stop any time — nothing is lost.',
} as const

/**
 * What the diagnostic asks when a finished check would replace a plan the child is part-way
 * through. ⚠️ The body states the COST in the child's own terms (which chapter they were on) and
 * the thing they are most likely to fear (losing their stars), because that fear is what makes a
 * "yes" feel expensive — and it is unfounded: `setActivePlan` writes one pointer and touches no
 * progress at all.
 */
export function swapCopy(at: number, was: number, now: number) {
  return {
    title: 'Swap to the new plan?',
    cta: 'Use the new plan',
    alt: 'Keep my old plan',
    /**
     * ⚠️ "STARTS FROM THE BEGINNING" IS GONE, AND THE REASON IS WORTH KEEPING. Founder, 2026-08-31:
     * it is the one phrase across these three surfaces that a child can read as LOSS — *I go back
     * to zero* — and the clause after it was then busy un-scaring a fear the sentence had just
     * created. A new plan has its OWN chapter 1; saying that plainly means nothing needs undoing.
     */
    body: `You were on chapter ${at} of ${was} of your last plan. The new plan has its own ${now} chapters, starting at 1 — your stars and everything you've played stay exactly as they are.`,
  }
}
