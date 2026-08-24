/**
 * WHO LEARNS THAT A CHAPTER FINISHED.
 *
 * ⚠️⚠️ THIS IS THE SEAM THAT COST THREE MONTHS. `ChapterProps.onComplete` sat in every chapter's
 * signature while both registry factories took it as `_props` and dropped it, so `/game`'s handler
 * never ran and no child's plan advanced. The pointer was moved into `finishAndSync` — correct, and
 * it left the PROP behind, still typed, still looking wired, for the next caller to trust.
 *
 * `/demo` is that caller and cannot use `finishAndSync` (a logged-out visitor has no learner, so it
 * returns early), so the prop is real now. These are SOURCE checks and say so: they prove the wiring
 * is written, not that a chapter calls it. The thing that proves THAT is `e2e/demo-route.spec.ts`,
 * which plays a real chapter to its end — nothing cheaper can see this.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const portal = readFileSync('src/features/chapters/ChapterPortal.tsx', 'utf8')
const game = readFileSync('src/app/game/page.tsx', 'utf8')
const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

describe('the completion callback reaches its caller', () => {
  it('BOTH registry factories pass onComplete through — one is the bug', () => {
    // ⚠️ COUNTED. Story and teen are separate factories written months apart; wiring one and not
    // the other is the original fault applied to half the app, and it looks fixed from either side.
    expect((strip(portal).match(/usePortalRun\([^)]*props\.onComplete\)/g) ?? []).length,
      'a registry factory drops onComplete — chapters in that half can never report completion').toBe(2)
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
    const body = strip(game.slice(at, game.indexOf('\n  }', at)))
    expect(body, 'handleComplete gained a state update — read the note above it first')
      .not.toMatch(/set[A-Z]\w*\(/)
    expect(body, 'handleComplete must never re-sync: the portal already scored the run')
      .not.toMatch(/finishAndSync|advanceAfterChapter/)
  })

  it('the chapter mount is not gated on a completion flag', () => {
    const at = game.indexOf('CHAPTER_COMPONENTS[playingChapter]')
    expect(at, 'the chapter mount is gone — this gate is inert').toBeGreaterThan(0)
    const mount = strip(game.slice(Math.max(0, at - 200), at))
    expect(mount, 'the chapter unmounts when it completes, taking its own end screen with it')
      .not.toMatch(/!\s*\w*[Dd]one\w*\s*&&/)
  })
})

/**
 * Where "back" goes. `/menu` is right for a signed-in child and wrong for anyone who has not signed
 * in: it bounces them to `/auth`. Abandoning is the MAIN exit from a demo chapter — most visitors
 * look, poke and leave — so a login wall there lands at the exact moment we were trying to earn the
 * right to ask for a login.
 */
describe('the exit destination is a parameter, not knowledge', () => {
  it('BOTH factories honour a caller-supplied exit, and BOTH still default to /menu', () => {
    /**
     * ⚠️ COUNT THE FACTORIES, NOT THE OCCURRENCES. The first draft asserted `props.onExit` appears
     * twice; it appears FOUR times (each exit names it in a condition and a call), so the gate went
     * red on correct code — and reverting a factory made the count 2, i.e. the mutation made the
     * broken gate PASS. A count is only a check when you have counted the right thing.
     */
    const exits = strip(portal).match(/const exit = \(\) => .*/g) ?? []
    expect(exits.length, 'the exits changed shape — re-read this gate').toBe(2)
    for (const e of exits) {
      expect(e, `a factory ignores the caller's exit, stranding a logged-out visitor: ${e}`).toMatch(/props\.onExit/)
      expect(e, `a factory lost its /menu default, which a signed-in child needs: ${e}`).toMatch(/router\.push\('\/menu'\)/)
    }
  })

  it('the portal learns nothing about sessions, demos or auth', () => {
    // The whole point of passing a destination is that this file stays ignorant. A session lookup
    // here would be the portal deciding policy for 72 chapters.
    expect(strip(portal), 'the portal is making an auth decision — pass a destination instead')
      .not.toMatch(/getSession|isLoggedIn|activeLearner|\/auth|\/demo/)
  })

  it('the teen exit still stops speech on the caller-supplied path', () => {
    // Easy to lose in a ternary: Milo would go on narrating over whatever screen comes next, which
    // is the sort of thing only a person notices.
    const at = strip(portal).indexOf('const exit = () => { stopSpeech()')
    expect(at, 'the teen exit changed shape — re-read this gate').toBeGreaterThan(0)
    const line = strip(portal).slice(at, at + 160)
    expect(line).toMatch(/stopSpeech\(\);\s*if \(props\.onExit\)/)
  })
})
