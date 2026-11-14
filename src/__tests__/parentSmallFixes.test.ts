// @vitest-environment jsdom
/**
 * Changes the founder asked for on 2026-10-17, each pinned to what a person sees.
 * Every expected value is written out here by hand.
 *
 *  1. The add-a-child window opens with no tour running (its own labels say what each field is).
 *  3. The child's name is marked as the one field that must be filled, for sighted readers and for a screen reader.
 *  (6 and 7, the free-trial card and Stripe's return, went with billing on 13 Nov 2026: Radlor is free.)
 *
 * 1 and 3 are read off the source because what they assert is the absence of a tour and an attribute on one input,
 * which a render of this page cannot reach without the whole dashboard's world. They assert the SHAPE, not a copy.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const read = (p: string) => readFileSync(p, 'utf8')
const PARENT = read('src/app/parent/page.tsx')

// ── 1, 3 — read off the source ────────────────────────────────────────────────────────────────
describe('the add-a-child window', () => {
  it('runs no tour of its own', () => {
    // The window used to open a 5-step TourRunner on a first visit. Nothing may start a tour inside it.
    const inside = PARENT.slice(PARENT.indexOf('<AddChildFlow'))
    expect(inside, 'a tour still runs inside the add-a-child window').not.toMatch(/TourRunner/)
    expect(PARENT, "the add-child tour's steps are still defined, so something could start it again").not.toMatch(/'add-child'\s*\)\s*return\s*\{\s*title/)
  })

  it('positive control: the dashboard still has its own tour (only the add-a-child one went)', () => {
    expect(PARENT).toMatch(/<TourRunner tour=\{tour\}/)
  })

  it("marks the child's name as the field that must be filled", () => {
    const field = PARENT.slice(PARENT.indexOf('htmlFor="learner-name"'), PARENT.indexOf('id="learner-name"') + 400)
    expect(field, 'no visible mark on the label').toContain('*')
    expect(field, 'nothing a screen reader can hear').toContain('aria-required="true"')
    expect(field).toContain('required')
  })
})

