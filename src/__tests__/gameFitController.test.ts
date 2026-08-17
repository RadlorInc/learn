import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * /game's fit controller, gated at the SOURCE — and this file says out loud why it is a source
 * check rather than a driven one: `/game` sits behind `useAuthGuard`, which bounces to `/auth`
 * without a real Supabase session, so the page cannot be reached from a test without signing in.
 * The two rules below are the ones that were BROKEN in production and are invisible to everything
 * else in this repo — `tsc`, eslint, the 1071 unit tests and the 212 e2e cases were all green
 * while both were live.
 *
 * ⓵ THE COMPARAND MUST BE A REF, NOT THE STATE VARIABLE.
 *   `measure` is created once (deps `[]`) and closes over `stageBg`'s INITIAL value for ever. That
 *   initial value is the literal `'var(--bg-page)'`; `getComputedStyle` always resolves to
 *   `rgb(252, 234, 182)`. Measured in a real browser: those two can never be equal. So the guard
 *   was permanently true and `setStageBg` was handed a FRESH OBJECT every tick — React only bails
 *   out on `Object.is`, so every tick committed a render of the game page, and with no `React.memo`
 *   anywhere and `props` rebuilt as an object literal each render, the whole chapter subtree
 *   re-rendered with it. Nothing looked wrong, because the paint was identical.
 *
 * ⓶ IT MUST NOT POLL.
 *   It ran on `setInterval(measure, 150)`, and each tick forced a synchronous layout
 *   (`getBoundingClientRect`) plus a style recalc (`getComputedStyle`) — ~6.7 forced reflows a
 *   second, for as long as a child was in a chapter, on the one page whose frame budget is spent on
 *   walk cycles. The interval's own comment named its only job ("re-reads firstElementChild →
 *   handles round/phase swaps"), which is what a MutationObserver on `childList` reports.
 */
const SRC = readFileSync(join(process.cwd(), 'src/app/game/page.tsx'), 'utf8')

/**
 * Just the fit-controller effect, so an unrelated timer elsewhere on the page cannot fail this
 * and — more importantly — cannot make it pass.
 *
 * ⚠️ WITH COMMENTS STRIPPED. Written against the raw slice, the "does not poll" check failed on
 * CORRECT code, because the effect's own comment quotes the `setInterval(measure, 150)` it is
 * explaining. That is this repo's recorded *a gate's own prose can trip its own regex*, arriving
 * from the source side instead of the test side — and it is the worse direction, because a check
 * that is red on good code gets deleted rather than read.
 */
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
const CONTROLLER = strip(
  SRC.slice(SRC.indexOf('const stageBgRef'), SRC.indexOf('const learner = getActiveLearner()')),
)

describe('/game fit controller', () => {
  it('the slice under test is real', () => {
    expect(CONTROLLER.length).toBeGreaterThan(400)
    expect(CONTROLLER).toContain('function measure()')
  })

  it('does not poll — it observes', () => {
    expect(CONTROLLER).not.toMatch(/setInterval/)
    expect(CONTROLLER).toMatch(/new ResizeObserver/)
    expect(CONTROLLER).toMatch(/new MutationObserver/)
  })

  it('compares the background against a ref, never against captured state', () => {
    // The write and the read both go through the ref, so the comparison sees what was last APPLIED.
    expect(CONTROLLER).toMatch(/stageBgRef\.current\s*=/)
    expect(CONTROLLER).toMatch(/=\s*stageBgRef\.current/)
    // The captured state variable must not be read inside the effect at all — that is the bug.
    expect(CONTROLLER).not.toMatch(/stageBg\.background(Color|Image)/)
  })

  it('every observer it creates is disconnected on unmount', () => {
    const made = (CONTROLLER.match(/new (Resize|Mutation)Observer/g) ?? []).length
    const killed = (CONTROLLER.match(/\.disconnect\(\)/g) ?? []).length
    expect(made).toBeGreaterThan(0)
    // One disconnect per observer, plus the re-watch path may disconnect the attribute observer.
    expect(killed).toBeGreaterThanOrEqual(made)
    expect(CONTROLLER).toMatch(/removeEventListener\('resize'/)
  })
})
