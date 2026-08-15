import { test, expect, Page } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'
import { IGNORED_ERRORS } from './personas'

/**
 * THE LAUNCH GATE: every chapter a child can reach actually opens, on every frame they might hold.
 *
 * The other e2e specs each drive one band deeply. None of them answers the question that decides
 * launch day — *does all of it still open?* A chapter that white-screens is not a bug a parent
 * reports politely; it is the one thing that must not happen on day one, and with 70 chapters
 * nobody is going to click through them by hand before each deploy.
 *
 * ⚠️ THE CHAPTER LIST IS DERIVED FROM THE SOURCE, NEVER TYPED OUT. A hardcoded list of 70 ids is
 * wrong the first time a chapter is added, renamed or ported between shells — and it would go on
 * reporting green while covering 69. This reads `core/chapters.ts` (what a child can be offered)
 * and the two component tables, so adding a chapter automatically adds a test and MOVING one
 * between shells automatically follows it.
 *
 * Run it: `npx playwright test e2e/all-chapters.spec.ts` against the dev server on :3017.
 * It is a pre-deploy gate, not a per-commit one — 70 chapters x 3 frames is a few hundred loads.
 * Narrow it while iterating with `E2E_ONLY=decimals,rounding` or `E2E_FRAMES=laptop`.
 */

const ROOT = process.cwd()
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

/** The frames a real child holds. 640x320 is this repo's documented fault zone: `short` is
 *  `vh < 470`, so a wide-but-short phone gets near-desktop sizes with no vertical room. */
const FRAMES = {
  laptop: { width: 1280, height: 720 },
  shortPhone: { width: 640, height: 320 },
  tallPhone: { width: 390, height: 844 },
} as const
type FrameName = keyof typeof FRAMES

interface Chapter { id: string; url: string; shell: 'gameshell' | 'story' }

/**
 * Where each chapter lives. A chapter is on GameShell if `registry.tsx` names it, and a storybook
 * chapter if `storyChapters.tsx` does. The story route takes an ALIAS rather than the skill id
 * (`?ch=bignum` for `bigNumbers`), so the alias table in `app/story/page.tsx` is reversed here.
 */
function chapters(): Chapter[] {
  const ids = [...read('src/core/chapters.ts').matchAll(/\{ id: '([A-Za-z0-9]+)'/g)].map(m => m[1])
  const registry = read('src/features/chapters/registry.tsx')
  const story = read('src/features/chapters/storyChapters.tsx')

  // alias -> skill, from the PREVIEW table; reversed to skill -> alias (first alias wins).
  const page = read('src/app/story/page.tsx')
  const aliasOf: Record<string, string> = {}
  for (const [, alias, skill] of page.matchAll(/(\w+):\s*'([A-Za-z0-9]+)'/g)) {
    if (!aliasOf[skill]) aliasOf[skill] = alias
  }

  return ids.map(id => {
    if (new RegExp(`^\\s*${id}:`, 'm').test(registry)) {
      return { id, url: `/teen-preview?c=${id}`, shell: 'gameshell' as const }
    }
    if (new RegExp(`^\\s*${id}:`, 'm').test(story)) {
      const alias = aliasOf[id] ?? id
      return { id, url: `/story?ch=${alias}`, shell: 'story' as const }
    }
    // Declared to children with nothing behind it — a dead tap. Kept in the list so it FAILS
    // loudly rather than being silently skipped.
    return { id, url: `/teen-preview?c=${id}`, shell: 'gameshell' as const }
  })
}

/** What "the chapter did not open" looks like on screen, including our own crash screens. */
const FAILURE_TEXT = [
  'Unknown chapter',
  'There is no chapter called',
  'Application error',
  'client-side exception',
  'Oops! Milo tripped over something',   // app/error.tsx
  'Oops! Milo needs a moment',           // app/global-error.tsx
  'Milo can’t find that page',      // app/not-found.tsx
  'Oops! Something went wrong',          // MiloErrorBoundary
]

const ONLY = process.env.E2E_ONLY?.split(',').map(s => s.trim()).filter(Boolean)
const FRAME_NAMES = (process.env.E2E_FRAMES?.split(',').map(s => s.trim()).filter(Boolean)
  ?? Object.keys(FRAMES)) as FrameName[]

const ALL = chapters()

test.describe('every chapter opens', () => {
  test('the chapter list was really derived (guards the regex above)', () => {
    // ⚠️ A parse that silently returns [] would make every test below pass by vacuity — the
    // "a sweep that flags everything is a broken sweep" rule, in its quiet direction.
    expect(ALL.length).toBeGreaterThanOrEqual(60)
    expect(ALL.filter(c => c.shell === 'gameshell').length).toBeGreaterThan(30)
    expect(ALL.filter(c => c.shell === 'story').length).toBeGreaterThan(10)
    expect(new Set(ALL.map(c => c.id)).size).toBe(ALL.length)
  })

  for (const frameName of FRAME_NAMES) {
    const frame = FRAMES[frameName]

    test.describe(`${frameName} ${frame.width}x${frame.height}`, () => {
      for (const ch of ALL) {
        if (ONLY && !ONLY.includes(ch.id)) continue

        test(`${ch.id}`, async ({ page }) => {
          const errors: string[] = []
          page.on('console', m => {
            if (m.type() !== 'error') return
            const t = m.text()
            if (IGNORED_ERRORS.test(t)) return
            errors.push(t)
          })
          page.on('pageerror', e => errors.push(String(e)))

          await page.setViewportSize(frame)
          await page.goto(ch.url, { waitUntil: 'domcontentloaded' })

          // 1. It rendered a chapter, not a failure screen.
          const body = await page.locator('body').innerText()
          for (const bad of FAILURE_TEXT) expect(body, `${ch.id}: "${bad}" on screen`).not.toContain(bad)

          // 2. There is something to press. A chapter that renders scenery and no control is a
          //    dead end — the child cannot start, and nothing else here would notice.
          await expect(page.locator('button:visible').first(), `${ch.id}: no visible control`).toBeVisible()

          // 3. It fits. A horizontal scrollbar on a child's tablet means part of the answer
          //    surface is off the side of the screen.
          const overflow = await page.evaluate(() =>
            document.documentElement.scrollWidth - document.documentElement.clientWidth)
          expect(overflow, `${ch.id}: ${overflow}px of horizontal overflow`).toBeLessThanOrEqual(1)

          // 4. Every visible control is actually on screen and big enough to hit. 44px is the tap
          //    floor this repo holds everywhere; a control a finger cannot land on is a dead button.
          const badControls = await page.evaluate(() => {
            const out: string[] = []
            for (const el of Array.from(document.querySelectorAll('button, a[href]'))) {
              const r = el.getBoundingClientRect()
              if (!r.width || !r.height) continue                       // not rendered
              if (getComputedStyle(el).visibility === 'hidden') continue
              const label = (el.textContent || '').trim().slice(0, 24) || el.tagName
              if (r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight) {
                out.push(`offscreen: ${label}`)
              }
            }
            return out
          })
          expect(badControls, `${ch.id}: ${badControls.join(' | ')}`).toEqual([])

          // 5. Nothing threw while it mounted.
          expect(errors, `${ch.id}: console errors — ${errors.slice(0, 2).join(' | ')}`).toEqual([])
        })
      }
    })
  }
})

/** Exported so a human can see what the gate believes it covers: `node -e "..."` or a failing run. */
export { chapters }
