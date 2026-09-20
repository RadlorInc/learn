/**
 * The try-before-signup demo.
 *
 * ⚠️ THE RULE THIS FILE EXISTS FOR IS "THE DEMO ENDS". A cap that never binds is a free product, and
 * a cap that binds too early is a wall in front of the value. Both are silent, and neither shows up
 * in a type-check — the only thing that catches them is driving the run to its end and past it.
\n */
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { balanced, strip } from './_window'
import {
  demoChapters, pickDemo, readDemo, startDemo, completeDemoChapter, nextDemoChapter, demoUsedUp, clearDemo,
  doneChapters,
  DEMO_LIMIT,
} from '@/infra/storage/demoRun'
import { gradeStartPlan, CHAPTER_NAMES, LEGACY_CHAPTERS_HIDDEN, type AgeGroup, type ChapterType } from '@/core/chapters'
import { adoptDemoRun } from '@/infra/storage/demoRun'
import { CHAPTER_COMPONENTS } from '@/features/chapters/registry'

// Only the two bands that still have chapters; the other four exist as `age_group` values only.
const BANDS: AgeGroup[] = ['3-5', '6-8']
beforeEach(() => { clearDemo() })

// Legacy chapters are hidden (src/core/chapters.ts); these assert their lists. Re-enable by flipping the flag.
describe.skipIf(LEGACY_CHAPTERS_HIDDEN)('what the demo offers', () => {
  it('every band offers exactly DEMO_LIMIT chapters, and they are real and renderable', () => {
    for (const b of BANDS) {
      const cs = demoChapters(b)
      expect(cs.length, `${b} cannot fill a ${DEMO_LIMIT}-chapter demo`).toBe(DEMO_LIMIT)
      for (const c of cs as ChapterType[]) {
        expect(CHAPTER_NAMES[c], `${b}: ${c} is not a real chapter`).toBeTruthy()
        // ⚠️ A chapter with no component renders "Unknown chapter" — an offer that is a dead end.
        expect(CHAPTER_COMPONENTS[c], `${b}: ${c} has no component to render`).toBeTruthy()
      }
    }
  })

  it('is the head of the same plan a skipper gets — not a second curriculum to keep in step', () => {
    for (const b of BANDS) {
      const plan = gradeStartPlan(b)
      for (const c of demoChapters(b)) expect(plan, `${b}: ${c} is not in the band's plan`).toContain(c)
      // order preserved: the demo is a PREFIX of the plan
      expect(demoChapters(b)).toEqual(plan.slice(0, DEMO_LIMIT))
    }
  })
})

// Legacy chapters are hidden (src/core/chapters.ts); these assert their lists. Re-enable by flipping the flag.
describe.skipIf(LEGACY_CHAPTERS_HIDDEN)('the run ends, exactly once', () => {
  it('walks band → two chapters → wall', () => {
    const run = startDemo('9-11')
    expect(demoUsedUp(run), 'the demo was over before it began').toBe(false)
    const first = nextDemoChapter(run)!
    expect(first).toBe(demoChapters('9-11')[0])

    const afterOne = completeDemoChapter(first)!
    expect(demoUsedUp(afterOne), 'one chapter must not spend the whole demo').toBe(false)
    const second = nextDemoChapter(afterOne)!
    expect(second, 'the demo offered the same chapter twice').not.toBe(first)

    const afterTwo = completeDemoChapter(second)!
    expect(demoUsedUp(afterTwo), 'the demo never ends — this is a free product').toBe(true)
    expect(nextDemoChapter(afterTwo)).toBeNull()
  })

  it('replaying a finished chapter does not spend a second slot', () => {
    const run = startDemo('6-8')
    const first = nextDemoChapter(run)!
    completeDemoChapter(first)
    completeDemoChapter(first)                     // a refresh, a back button, a double fire
    expect(doneChapters(readDemo())).toEqual([first])
    expect(demoUsedUp(readDemo()), 'one chapter played twice ended the demo').toBe(false)
  })

  it('survives the tab — a parent tries it tonight and signs up tomorrow', () => {
    startDemo('12-14')
    completeDemoChapter(demoChapters('12-14')[0])
    expect(readDemo()!.results.length, 'the run did not persist').toBe(1)   // kv, not sessionStorage
    expect(readDemo()!.band).toBe('12-14')
  })

  it('a garbled record is dropped rather than crashing the door', () => {
    startDemo('3-5')
    expect(completeDemoChapter('counting')).not.toBeNull()   // control: it works when intact
    clearDemo()
    expect(readDemo()).toBeNull()
    expect(nextDemoChapter(null)).toBeNull()
    expect(demoUsedUp(null), 'no run must not read as a spent one').toBe(false)
  })
})

/** Source checks, labelled: they prove the page SAYS it, not that anything reaches it. */
describe('the route (source)', () => {
  const src = readFileSync('src/app/demo/page.tsx', 'utf8')
  // ⚠️ `strip` first: a comment that explains why NOT to write a phrase contains the phrase, and
  // this file's wall check went red on its own source's note. The shipped copy is what a parent reads.

  it('counts the completion — the callback is not discarded', () => {
    // `/teen-preview` passes a no-op on purpose. If THIS one becomes one, the demo never ends and
    // the wall never appears — the ChapterPortal fault with a different consequence.
    // ⚠️ ANCHOR ON THE HANDLER, NOT A CHARACTER BUDGET FROM THE ELEMENT. The first version sliced
    // 700 chars from `<GuardedChapter`; adding an `onExit` handler before `onComplete` pushed the
    // call out of the window and the gate went red on correct code. A window measured in characters
    // is not a window bounded by the thing you meant.
    const at = src.indexOf('onComplete={')
    expect(at, 'the completion handler is gone — this gate is inert').toBeGreaterThan(0)
    const handler = balanced(src, at)          // the `{() => { … }}` expression container
    expect(handler, 'the demo discards its completion callback').toMatch(/completeDemoChapter\(/)
  })

  it('the logged-out door goes through the one guard', () => {
    // Anchored on the IMPORT, so inlining the guard at the route fails here. `/teen-preview` was
    // the second door until the 9–18 chapters went (2026-09-20); `/demo` is the only one left.
    for (const f of ['src/app/demo/page.tsx']) {
      expect(readFileSync(f, 'utf8'), `${f} does not use the shared guard`)
        .toMatch(/import \{ GuardedChapter \}/)
    }
  })

  it('the wall sells the account rather than announcing a spent demo', () => {
    const at = src.indexOf('demoUsedUp(run)')
    expect(at, 'the wall is gone — this gate is inert').toBeGreaterThan(0)
    const wall = strip(balanced(src, at))   // the whole `if (demoUsedUp(run)) { … }` block
    expect(wall, 'the wall must offer the account').toMatch(/href="\/auth"/)
    expect(wall, 'the wall reads as "you ran out" rather than what an account buys')
      .not.toMatch(/used (up|your)|run out|no more free|limit reached/i)
  })
})

/**
 * Signing up must carry the demo onto the account. Without this a parent who played two chapters
 * finds no stars and a plan whose first step is the chapter their child just finished — worse than
 * never having played, because we showed them the product and took it away as they committed.
 */
// Legacy chapters are hidden (src/core/chapters.ts); these assert their lists. Re-enable by flipping the flag.
describe.skipIf(LEGACY_CHAPTERS_HIDDEN)('adopting a demo run onto a real learner', () => {
  // `recorded` was `sessions` until 2026-09-20: adopting a demo run wrote a `sessions` row with
  // stars/XP/coins. A played chapter is now recorded exactly as a signed-in child's is.
  const harness = () => {
    const recorded: { chapter: string; mastered: boolean }[] = []
    const advanced: string[] = []
    let planned: string[] | null = null
    return {
      recorded, advanced, get planned() { return planned },
      deps: {
        record: (chapter: string, mastered: boolean) => { recorded.push({ chapter, mastered }) },
        plan: (chapters: string[]) => { planned = chapters },
        advance: (chapter: string) => { advanced.push(chapter) },
      },
    }
  }

  it('records every played chapter and starts the plan past them', () => {
    startDemo('12-14')
    const [a, b] = demoChapters('12-14')
    completeDemoChapter(a, 8, 2, false)
    completeDemoChapter(b, 10, 0, true)

    const h = harness()
    const out = adoptDemoRun('kid', '12-14', true, h.deps)!
    expect(out.adopted, 'the play was not carried onto the account').toBe(2)
    expect(h.recorded.map(r => r.chapter)).toEqual([a, b])
    expect(h.recorded.map(r => r.mastered), 'the mastered flag was not carried onto the account').toEqual([false, true])
    expect(h.planned, 'the new learner got no plan').toEqual(gradeStartPlan('12-14'))
    expect(h.advanced, 'the plan would restart on a chapter the child just finished').toEqual([a, b])
    expect(readDemo(), 'the run was not consumed — it would adopt onto a second learner too').toBeNull()
  })

  it('LEAVES the run stashed on a band mismatch — the right child may be added next', () => {
    startDemo('9-11')
    completeDemoChapter(demoChapters('9-11')[0], 5, 5, false)
    const h = harness()
    expect(adoptDemoRun('sibling', '3-5', true, h.deps), 'a 9–11 run was adopted onto a 3–5 child').toBeNull()
    expect(h.recorded, 'progress was written for the wrong child').toEqual([])
    expect(readDemo(), 'a mismatch consumed the run — the capture is lost unrecoverably').not.toBeNull()
    // …and the right child still gets it
    expect(adoptDemoRun('kid', '9-11', true, h.deps)!.adopted).toBe(1)
  })

  it('yields the PLAN to a diagnosis but still adopts the sessions', () => {
    // A diagnosed plan is one somebody looked for; a grade-start plan is the band from the top.
    startDemo('6-8')
    completeDemoChapter(demoChapters('6-8')[0], 7, 3, false)
    const h = harness()
    const out = adoptDemoRun('kid', '6-8', false, h.deps)!
    expect(out.planSet).toBe(false)
    expect(h.planned, "the demo overwrote the diagnostic's plan").toBeNull()
    expect(h.advanced, 'the demo moved a pointer it does not own').toEqual([])
    expect(h.recorded.length, 'the child played it — the account must record it').toBe(1)
  })

  it('no run → nothing happens, and that is not an error', () => {
    const h = harness()
    expect(adoptDemoRun('kid', '9-11', true, h.deps)).toBeNull()
    expect(h.recorded).toEqual([])
  })
})

/** Source check, labelled: the caller's ARGUMENT is invisible to every test above, which drives
 *  `adoptDemoRun` directly. Found by mutation — passing an unconditional `true` for `claimPlan`
 *  passed all fifteen while letting a grade-start plan overwrite a diagnosed one. */
describe('the caller (source)', () => {
  const parent = strip(readFileSync('src/app/parent/page.tsx', 'utf8'))

  it('adopts on learner creation, and claims the plan', () => {
    // ⚠️ This also asserted the demo YIELDS the plan to a diagnosis. The check was deleted
    // 2026-09-20 and `/parent` now always passes true; what still matters is that the run is
    // adopted at all — the P0 this file exists for.
    const at = parent.indexOf('adoptDemoRun(')
    expect(at, 'nothing adopts the demo — a parent who played two chapters finds nothing').toBeGreaterThan(0)
    const call = balanced(parent, at, '(', ')')
    expect(call, 'the adopt call could not be bounded — re-read this gate').not.toBe('')
    expect(call, 'the demo no longer claims the plan, so a demo player signs up to nothing')
      .toMatch(/learner\.age_group as AgeGroup, true/)
  })
})
