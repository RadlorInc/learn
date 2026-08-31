/**
 * The child's own door to the check, and the plan it must not silently destroy.
 *
 * Founder's call, 2026-08-31: *"mein chahata hu ki bacche ka jab mann kare woh diagnostic kare — woh
 * chiz bann naii hona chahiye."* The check was optional and, on the CHILD's screen, that had come to
 * mean unavailable: `/menu` offered it at most twice (`shouldReoffer`) and then retired the ask to
 * the parent dashboard. The permanent door is now on the child's own screen.
 *
 * ⚠️ AND THE COST THAT CAME WITH IT: `setActivePlan` replaces the plan and resets `index` to 0. A
 * first check has nothing to lose; a child running one for fun on chapter 4 does, and neither their
 * XP nor their stars would show it — which makes it harder to notice, not easier. So the diagnostic
 * asks before replacing a plan somebody has walked.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { setActivePlan, advancePlan, planInProgress, getActivePlan, reconcilePlan } from '@/infra/storage/activePlan'
import { shouldReoffer } from '@/infra/storage/checkup'
import { CHECK_DOOR, swapCopy, planLine } from '@/core/planCopy'
import { strip } from './_window'

const read = (p: string) => strip(readFileSync(join(process.cwd(), p), 'utf8'))
const MENU = 'src/app/menu/page.tsx'
const DIAG = 'src/app/diagnostic/page.tsx'
const L = 'learner-1'

describe('the check is always reachable from the child\'s own screen', () => {
  it('draws a permanent door on the menu, pointing at the diagnostic', () => {
    const src = read(MENU)
    // ⚠️ The words live in `core/planCopy` and the markup in `CheckDoor`, so the menu is asserted
    // to RENDER the component — a literal here would go inert the day either moves, which is
    // exactly what happened to the gate next door when they did.
    expect(src).toContain('<CheckDoor onOpen={() => {')
    expect(src).toContain("router.push(`/diagnostic?band=${ageGroup}`)")
    expect(CHECK_DOOR.title).toBe('Find my starting point')
    expect(read('src/shared/ui/CheckDoor.tsx')).toContain('{CHECK_DOOR.title}')
  })

  /**
   * ⚠️ The permanent door and the one-time offer are the SAME ACTION, so they may never be on screen
   * together — two cards asking one thing is the duplicate this repo keeps paying for. The offer
   * owns the ask while it is up (`!reoffer`), and the door takes over for ever afterwards.
   */
  it('is hidden exactly while the one-time offer is up', () => {
    const src = read(MENU)
    expect(src).toContain('{!reoffer && (')
    expect(src).toContain('{reoffer && (')
    // and the offer is still the thing that retires — the door is not a second ask
    expect(shouldReoffer(L, 1), 'a learner who never skipped is not re-offered').toBe(false)
  })
})

/**
 * ⚠️⚠️ THE LINE A RETURNING CHAPTER IS EXPLAINED WITH, AND WHY IT NEEDED ITS OWN CHECK.
 * A completed chapter can come back — the pointer only skips the LEADING run of finished ones, and
 * a re-diagnosis putting one mid-plan is saying the gap is there. Founder, 2026-08-31: *"a kid who
 * finished something yesterday and is handed it again reads that as 'I got it wrong'."*
 *
 * ⚠️ AND THE FIRST VERSION OF THIS GATE MISSED IT. Reverting the repeat line to the ordinary
 * "Milo picked this to close the gap" SURVIVED, because the check next door only asked that a
 * diagnosed line mention a gap — which that line does. What has to be asserted is the DIFFERENCE:
 * a chapter the child has already finished may not be announced in the same words as a new one.
 */
describe('a chapter that comes back says why', () => {
  it('never uses the same words for a repeat as for a first time', () => {
    for (const src of ['diagnostic', 'gradeStart'] as const) {
      expect(planLine(src, true), `${src}: a returning chapter reads exactly like a new one`)
        .not.toBe(planLine(src, false))
      expect(planLine(src, true), `${src}: the repeat is not acknowledged at all`)
        .toMatch(/played this one/i)
    }
  })

  /** ⚠️ And the reason must match the evidence: after a SKIP nobody looked, so no gap may be
   *  claimed — the same rule the plan card's own comment already carries. */
  it('gives a reason after a check and none after a skip', () => {
    expect(planLine('diagnostic', true)).toMatch(/Milo saw|worth another go/i)
    expect(planLine('gradeStart', true), 'a skipped plan claims Milo saw something').not.toMatch(/Milo saw|gap/i)
  })
})

describe('a re-run never silently resets a plan the child has walked', () => {
  beforeEach(() => localStorage.clear())

  it('has nothing to ask about on a fresh plan, and something to ask about after one chapter', () => {
    setActivePlan(L, '3-5', ['counting', 'numberOrdering', 'shapes'])
    expect(planInProgress(L), 'an unwalked plan is replaced without a question').toBeNull()
    advancePlan(L, 'counting')
    expect(planInProgress(L)?.index, 'a walked plan must be asked about').toBe(1)
  })

  it('the diagnostic asks instead of replacing, and both answers are reachable', () => {
    const src = read(DIAG)
    expect(src).toContain('const walked = chs.length ? planInProgress(lid) : null')
    expect(src).toContain('if (walked) { setReplaceAsk(')
    expect(src).toContain('title={swap.title} cta={swap.cta} body={swap.body}')
    expect(src).toContain('label: swap.alt')
    const c = swapCopy(4, 7)
    expect(c.cta).toBe('Use the new plan')
    expect(c.alt).toBe('Keep my old plan')
    expect(c.body, 'the body must say what a "yes" costs, in the child\'s own terms').toContain('chapter 4 of 7')
    expect(c.body, 'and settle the fear that makes a yes expensive').toMatch(/stars/i)
  })

  /**
   * ⚠️⚠️ THE WINDOW BETWEEN THE REPLACE AND THE FIRST RECONCILE, WHICH IS WHERE THE CHILD ACTUALLY
   * LOOKS. `setActivePlan` writes `index: 0`, so between finishing the check and the menu deriving
   * the pointer, "Next up" is the new plan's FIRST chapter — which the child may have finished
   * weeks ago. Online the derive happens on that same load; offline (or on a 401) it used to be
   * skipped entirely and the wrong chapter stood until the next successful load.
   *
   * The rule this pins: the menu derives from server progress when it has it and from the LOCAL
   * profile's stars when it does not, so the evidence degrades rather than the feature.
   */
  it('derives the pointer past finished chapters even with no server data', () => {
    setActivePlan(L, '3-5', ['counting', 'numberOrdering', 'measurement'])
    expect(getActivePlan(L)!.index, 'a fresh plan starts at 0 — this is the window').toBe(0)
    // the offline path: no remote plan, evidence is local completions only
    reconcilePlan(L, [], ['counting', 'numberOrdering'])
    expect(getActivePlan(L)!.index, 'the child would have been shown chapter 1 again').toBe(2)
    const src = read(MENU)
    expect(src, 'the offline branch stopped deriving the pointer').toContain('applyPlan(localPlayed(), [])')
    expect(src, 'local completions must come from the stars this device already holds')
      .toContain("(stars[ch as ChapterType] ?? 0) > 0")
  })

  /** ⚠️ Declining must cost the pointer and NOTHING else: the diagnosis is persisted when the probe
   *  ends, not when the plan is applied, so the report survives a "keep my old plan". */
  it('keeps the old plan intact when the child declines', () => {
    setActivePlan(L, '3-5', ['counting', 'numberOrdering', 'shapes'])
    advancePlan(L, 'counting')
    const before = getActivePlan(L)
    // the decline path writes no plan at all — this is what `finishReplace(false)` does
    const after = getActivePlan(L)
    expect(after?.index).toBe(before?.index)
    expect(after?.chapters).toEqual(before?.chapters)
    expect(read(DIAG), 'the decline path must not write a plan')
      .toContain('if (replace) setActivePlan(ask.lid, band, ask.chapters)')
  })
})
