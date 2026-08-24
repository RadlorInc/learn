/**
 * THE CHECK IS OPTIONAL, AND OPTIONAL MUST NOT MEAN PLANLESS (2026-08-24).
 *
 * ⚠️ THE RULE MOST WORTH GUARDING HERE IS NOT "CAN THEY SKIP" — IT IS WHAT SKIPPING LEAVES BEHIND.
 * A skip that produces no plan drops a child into a 72-chapter menu, which is the shape of every
 * other maths app and the thing this product exists not to be. And a grade-start plan that CLAIMS
 * to close a diagnosed gap is a lie of exactly the kind the report's never-say-"on-track" rule
 * exists to prevent — nobody looked.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { gradeStartPlan, chaptersForAge, CHAPTER_NAMES, type AgeGroup } from '@/core/chapters'
import { checkupSkips, recordCheckupSkip, shouldReoffer, checkupSettled, markCheckupDone, clearCheckupCache } from '@/infra/storage/checkup'
import { setActivePlan, getActivePlan, currentPlanChapter } from '@/infra/storage/activePlan'

const BANDS: AgeGroup[] = ['3-5', '6-8', '9-11', '12-14', '15-16', '17-18']
beforeEach(() => { localStorage.clear() })

describe('skipping leaves a plan', () => {
  it('every band has a non-empty grade-start plan, in curriculum order, of real chapters', () => {
    for (const b of BANDS) {
      const plan = gradeStartPlan(b)
      expect(plan.length, `${b} has no grade-start plan — a skip would leave the child planless`).toBeGreaterThan(0)
      expect(plan).toEqual(chaptersForAge(b).map(c => c.id))          // order is the curriculum's
      for (const id of plan) expect(CHAPTER_NAMES[id], `${b}: ${id} is not a real chapter`).toBeTruthy()
    }
  })

  it('a skipped child gets a walkable plan tagged gradeStart', () => {
    setActivePlan('kid', '9-11', gradeStartPlan('9-11'), 'gradeStart')
    expect(currentPlanChapter('kid')).toBe(gradeStartPlan('9-11')[0])
    expect(getActivePlan('kid')!.source).toBe('gradeStart')
  })

  it('a plan written without a source reads as diagnostic — every pre-2026-08-24 plan was one', () => {
    setActivePlan('kid', '9-11', ['rounding'])
    expect(getActivePlan('kid')!.source).toBe('diagnostic')
  })

  it("SOURCE C: the free tier's first two steps are entitled for a skipper too", () => {
    // The free set is "the plan's first unmet steps". That is a claim about the PLAN, so it only
    // holds if a skipper has one — which is this whole feature. Asserted as the property the
    // entitlement rule depends on: at least two steps exist to be entitled, in every band.
    for (const b of BANDS) expect(gradeStartPlan(b).length, `${b}`).toBeGreaterThanOrEqual(2)
  })
})

describe('the offer is made at most twice', () => {
  it('counts skips per learner and settles the launch gate on the first one', () => {
    expect(checkupSkips('kid')).toBe(0)
    expect(checkupSettled('kid'), 'never asked → the offer should still be shown').toBe(false)
    expect(recordCheckupSkip('kid')).toBe(1)
    expect(checkupSettled('kid'), 'a skipped child must not be re-routed into the check').toBe(true)
    expect(checkupSkips('other'), 'skips leaked across siblings').toBe(0)
  })

  it('taking the check settles it without any skip', () => {
    markCheckupDone('kid')
    expect(checkupSettled('kid')).toBe(true)
    expect(checkupSkips('kid')).toBe(0)
    clearCheckupCache('kid')
  })

  it('re-offers ONCE, and only after a plan chapter is actually finished', () => {
    expect(shouldReoffer('kid', 1), 'never skipped → nothing to re-offer').toBe(false)
    recordCheckupSkip('kid')
    expect(shouldReoffer('kid', 0), 'no evidence yet — the ask has nothing behind it').toBe(false)
    expect(shouldReoffer('kid', 1), 'the whole point: ask again once they have seen it work').toBe(true)
    recordCheckupSkip('kid')                                    // "Not now" the second time
    expect(shouldReoffer('kid', 1), 'declined twice and asked a third time').toBe(false)
    expect(shouldReoffer('kid', 99), 'a third ask cannot be bought with more chapters').toBe(false)
  })
})

/** Source checks, labelled as such: these prove the screens SAY it, not that anything reaches them. */
describe('the surfaces (source)', () => {
  it('the skip is one tap — no confirm step between it and leaving', () => {
    const src = readFileSync('src/app/diagnostic/page.tsx', 'utf8')
    const at = src.indexOf('const skipCheck = ()')
    expect(at, 'skipCheck is gone — this gate is inert').toBeGreaterThan(0)
    const body = src.slice(at, src.indexOf('\n  }', at))
    expect(body, 'the skip must issue a plan').toMatch(/setActivePlan\(/)
    expect(body, 'a skip that asks "are you sure" is not optional').not.toMatch(/confirm|window\.confirm|setPhase\(/)
  })

  it('the plan card does not claim a closed gap on a grade-start plan', () => {
    const src = readFileSync('src/app/menu/page.tsx', 'utf8')
    // ⚠️ ANCHOR ON THE STRING LITERAL, NOT THE PHRASE. The first draft searched for "close the
    // gap" and matched the COMMENT above the code explaining the rule — the gate tripping on its
    // own prose, and it reported the real, correct code as broken.
    const at = src.indexOf("'Milo picked this to close the gap")
    expect(at, 'the plan subtitle is gone — this gate is inert').toBeGreaterThan(0)
    expect(src.slice(Math.max(0, at - 400), at), 'the gap claim is printed without checking the plan source')
      .toMatch(/source === 'gradeStart'/)
  })

  it('the offer names the outcome and the resume, and leads with neither a question count nor a test', () => {
    const src = readFileSync('src/app/diagnostic/page.tsx', 'utf8')
    const at = src.indexOf('Milo will find exactly where your child should start')
    expect(at, 'the offer copy changed — re-read it against the rule before moving this gate').toBeGreaterThan(0)
    const copy = src.slice(at, src.indexOf('"}', at))
    expect(copy, 'a parent deciding whether to begin is exactly who needs to know they can stop').toMatch(/pick up where you left off/)
    expect(copy, 'the offer must not price itself as a question count').not.toMatch(/\d+\s*(–|-)\s*\d+ question/)
  })
})
