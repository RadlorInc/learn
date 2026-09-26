/**
 * WHO LEARNS THAT A CHAPTER FINISHED.
 *
 * ⚠️⚠️ THIS IS THE SEAM THAT COST THREE MONTHS. `ChapterProps.onComplete` sat in every chapter's
 * signature while the registry factories took it as `_props` and dropped it, so `/game`'s handler
 * never ran and no child's plan advanced. (There were TWO factories until 2026-09-20; the teen one
 * went with the 9–18 chapters. The counts below are 1 for that reason, not because a check was
 * loosened — if a second factory is ever added they must go back to 2.) The pointer was moved into `finishAndSync` — correct, and
 * it left the PROP behind, still typed, still looking wired, for the next caller to trust.
 *
 * `/demo` was that caller, so the prop is real now; `/game` is the one left. These are SOURCE checks
 * and say so: they prove the wiring is written, not that a chapter calls it. ⚠️ The e2e that proved
 * THAT (`e2e/demo-route.spec.ts`, a real chapter played to its end) went with `/demo` on 2026-09-26
 * (N17) — nothing drives `/game`'s handler end to end now.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { balanced, strip } from './_window'

const portal = readFileSync('src/features/chapters/ChapterPortal.tsx', 'utf8')
const game = readFileSync('src/app/game/page.tsx', 'utf8')


describe('the completion callback reaches its caller', () => {
  it('EVERY registry factory passes onComplete through — one that does not is the bug', () => {
    // ⚠️ COUNTED against the number of factories in the file, so adding a factory that drops the
    // prop goes red rather than being averaged away.
    expect((strip(portal).match(/usePortalRun\([^)]*props\.onComplete\)/g) ?? []).length,
      'a registry factory drops onComplete — chapters in that half can never report completion')
      .toBe((strip(portal).match(/^export function make\w+Chapter/gm) ?? []).length)
    expect(strip(portal), 'the factories must read props, not discard them').not.toMatch(/_props: ChapterProps/)
  })

  it('the portal actually invokes it, after the sync', () => {
    const body = strip(portal)
    expect(body, 'onComplete is threaded in but never called').toMatch(/cbRef\.current\?\.\(/)
    const at = body.indexOf('cbRef.current?.(')
    const sync = body.indexOf('finishAndSync(skill')
    expect(sync, 'finishAndSync is gone — re-read this gate').toBeGreaterThan(0)
    expect(at, "the caller's handler runs before the child's score is written").toBeGreaterThan(sync)
  })
})

describe('waking the handler must not change /game', () => {
  it("/game's handleComplete stays side-effect free", () => {
    // It was dormant for three months, so the SHIPPED behaviour is whatever it does not do. It
    // previously set a flag that unmounted the chapter; the mount below was gated on that flag, so
    // making the handler real would have destroyed every chapter's own end screen at the moment a
    // child finished it — the stars, "Play again", the way back.
    const at = game.indexOf('function handleComplete')
    expect(at, 'handleComplete is gone — this gate is inert').toBeGreaterThan(0)
    const body = strip(balanced(game, at))     // the whole function body, brace to brace
    expect(body, 'handleComplete gained a state update — read the note above it first')
      .not.toMatch(/set[A-Z]\w*\(/)
    expect(body, 'handleComplete must never re-sync: the portal already scored the run')
      .not.toMatch(/finishAndSync|advanceAfterChapter/)
  })

  it('the chapter mount is not gated on a completion flag', () => {
    const at = game.indexOf('CHAPTER_COMPONENTS[playingChapter]')
    expect(at, 'the chapter mount is gone — this gate is inert').toBeGreaterThan(0)
    // ⚠️ Backwards to the JSX expression that OPENS this branch, not a byte count behind it.
    const mount = strip(game.slice(game.lastIndexOf('{', at), at))
    expect(mount, 'the chapter unmounts when it completes, taking its own end screen with it')
      .not.toMatch(/!\s*\w*[Dd]one\w*\s*&&/)
  })
})

/**
 * Where "back" goes: a caller-supplied exit, else the child's home, `/modules` (`/menu` was retired
 * 2026-09-26, N17).
 */
describe('the exit destination is a parameter, not knowledge', () => {
  it('EVERY factory honours a caller-supplied exit, and every one still defaults to /modules', () => {
    /**
     * ⚠️ COUNT THE FACTORIES, NOT THE OCCURRENCES. The first draft asserted `props.onExit` appears
     * twice; it appears FOUR times (each exit names it in a condition and a call), so the gate went
     * red on correct code — and reverting a factory made the count 2, i.e. the mutation made the
     * broken gate PASS. A count is only a check when you have counted the right thing.
     */
    const exits = strip(portal).match(/const exit = \(\) => .*/g) ?? []
    expect(exits.length, 'the exits changed shape — re-read this gate')
      .toBe((strip(portal).match(/^export function make\w+Chapter/gm) ?? []).length)
    for (const e of exits) {
      expect(e, `a factory ignores the caller's exit, stranding a logged-out visitor: ${e}`).toMatch(/props\.onExit/)
      expect(e, `a factory lost its /modules default, which a signed-in child needs: ${e}`).toMatch(/router\.push\('\/modules'\)/)
    }
  })

  it('the portal learns nothing about sessions, demos or auth', () => {
    // The whole point of passing a destination is that this file stays ignorant. A session lookup
    // here would be the portal deciding policy for 72 chapters.
    expect(strip(portal), 'the portal is making an auth decision — pass a destination instead')
      .not.toMatch(/getSession|isLoggedIn|activeLearner|\/auth|\/demo/)
  })

  it('leaving a chapter stops Milo talking', () => {
    // Milo would otherwise go on narrating over whatever screen comes next, which is the sort of
    // thing only a person notices. The story factory does this in usePortalRun's cleanup rather
    // than in `exit`, so the assertion is that SOME path stops speech on unmount.
    expect(strip(portal), 'nothing stops speech when a chapter goes away').toMatch(/stopSpeech\(\)/)
  })
})
