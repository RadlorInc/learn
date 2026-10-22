// @vitest-environment jsdom
/**
 * Four changes the founder asked for on 2026-10-17, each pinned to what a person sees or where Stripe sends them.
 * Every expected value is written out here by hand.
 *
 *  1. The add-a-child window opens with no tour running (its own labels say what each field is).
 *  3. The child's name is marked as the one field that must be filled, for sighted readers and for a screen reader.
 *  6. The free-trial card says "Your child" to a family with one child, "Your children" to a family with more.
 *  7. Stripe's Checkout returns to the DASHBOARD, and the dashboard carries the "payment received" note that used to
 *     live only on /parent/plan — the note is what stops a parent paying twice while the webhook is in flight.
 *
 * 6 is rendered. 1, 3 and 7 are read off the source because what they assert is the absence of a tour, an attribute
 * on one input, and a URL string handed to Stripe — none of which a render of this page can reach without the whole
 * dashboard's world. Where a source check is used it asserts the SHAPE, not a copy of the line.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const read = (p: string) => readFileSync(p, 'utf8')
const PARENT = read('src/app/parent/page.tsx')
const CHECKOUT = read('src/app/api/checkout/route.ts')

// ── 6 — the free-trial card, rendered ────────────────────────────────────────────────────────────
const trial = vi.hoisted(() => ({ value: undefined as unknown }))
vi.mock('@/features/billing/TrialTopicPicker', () => ({ useFamilyTrial: () => trial.value }))
vi.mock('@/features/lessons/modules', () => ({ findLesson: (id: string) => ({ lesson: { title: `Title of ${id}` } }) }))
vi.mock('next/link', () => ({ default: ({ children }: { children: unknown }) => children }))

async function card(childCount?: number) {
  const { FreeTrialCard } = await import('@/features/billing/FreeTrialCard')
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => { root.render(createElement(FreeTrialCard, { childCount })) })
  const text = host.textContent ?? ''
  await act(async () => root.unmount()); host.remove()
  return text
}

describe('the free-trial card speaks to the family it is shown to', () => {
  beforeEach(() => { trial.value = { state: 'chosen', topics: ['g4m1-t1', 'g4m1-t2'] } })

  it('one child: "Your child", and the two topics are named', async () => {
    const text = await card(1)
    expect(text).toContain('Your child can learn these two topics:')
    expect(text, 'said "children" to a family with one child').not.toContain('Your children')
    expect(text).toContain('Title of g4m1-t1')
  })

  it('more than one child: "Your children"', async () => {
    expect(await card(3)).toContain('Your children can learn these two topics:')
  })

  it('positive control: no trial chosen yet, the card is not there at all', async () => {
    trial.value = { state: 'choose', topics: [] }
    expect(await card(1)).toBe('')
  })
})

// ── 1, 3, 7 — read off the source ────────────────────────────────────────────────────────────────
describe('the add-a-child window', () => {
  it('runs no tour of its own', () => {
    // The window used to open a 5-step TourRunner on a first visit. Nothing may start a tour inside it.
    const inside = PARENT.slice(PARENT.indexOf('<AddChildFlow'))
    expect(inside, 'a tour still runs inside the add-a-child window').not.toMatch(/TourRunner/)
    expect(PARENT, "the add-child tour's steps are still defined, so something could start it again").not.toMatch(/'add-child'\s*\)\s*return\s*\{\s*title/)
  })

  it('positive control: the dashboard still has its own tour (only the add-a-child one went)', () => {
    expect(PARENT).toMatch(/<TourRunner tour=\{activeTour\}/)
  })

  it("marks the child's name as the field that must be filled", () => {
    const field = PARENT.slice(PARENT.indexOf('htmlFor="learner-name"'), PARENT.indexOf('id="learner-name"') + 400)
    expect(field, 'no visible mark on the label').toContain('*')
    expect(field, 'nothing a screen reader can hear').toContain('aria-required="true"')
    expect(field).toContain('required')
  })
})

describe('Stripe Checkout comes back to the dashboard', () => {
  it('success_url is the dashboard, not the plan screen', () => {
    expect(CHECKOUT).toContain('success_url: `${SITE_URL}/parent?billing=success`')
    expect(CHECKOUT, 'still returning to /parent/plan').not.toContain('/parent/plan?billing=success')
  })

  it('positive control: a cancelled checkout still comes back to the dashboard', () => {
    expect(CHECKOUT).toContain('cancel_url: `${SITE_URL}/parent?billing=cancelled`')
  })

  it('the dashboard says the payment arrived, so nobody pays twice while the webhook is in flight', () => {
    expect(PARENT).toMatch(/billing'\) === 'success'/)
    expect(PARENT).toContain('Payment received — we are switching your plan on.')
    expect(PARENT).toContain('data-testid="dash-activating"')
  })
})
