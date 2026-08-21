import { test, expect, Page } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'
import { IGNORED_ERRORS, MIN_TAP, TIGHT_TAP } from './personas'

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
 * Run it: `npm run test:chapters` against the dev server on :3017, or against production with
 * `E2E_BASE_URL=https://milo-story-mode.vercel.app`. It is a pre-deploy gate, not a per-commit one
 * — 70 chapters x 3 frames is a few hundred loads. Narrow it while iterating with
 * `E2E_ONLY=decimals,rounding` or `E2E_FRAMES=laptop`.
 *
 * ⚠️ DO NOT RUN IT AGAINST PROD WHILE A DEPLOY IS STILL PROPAGATING. The first prod run reported
 * two chapters failing on a resource 404; both passed minutes later, untouched. A deploy briefly
 * serves pages whose chunk URLs are still rolling out, so a run started too early reports a
 * transient as a defect — and, worse, would teach you to ignore a real one. Wait for the new
 * `sw.js` VERSION to be live, then run.
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

/**
 * ⚠️ AN EMPTY `E2E_ONLY` MUST MEAN "ALL", NOT "NONE" — and the naive parse means "none".
 * `''?.split(',')` is `['']` (optional chaining only short-circuits on null/undefined, not on an
 * empty string), which filters to `[]`, and `[]` is TRUTHY — so `ONLY && !ONLY.includes(id)` was
 * true for every chapter and the whole sweep was skipped. It still reports green, because the only
 * surviving test is the list-derivation guard. Exactly the vacuity fault that guard was written to
 * catch, arriving one layer above it.
 * This is not hypothetical: GitHub Actions passes `''` for an unset `workflow_dispatch` input on a
 * `schedule` run, so the nightly would have tested NOTHING, every night, in green.
 */
const ONLY_RAW = process.env.E2E_ONLY?.split(',').map(s => s.trim()).filter(Boolean)
const ONLY = ONLY_RAW?.length ? ONLY_RAW : undefined
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

    // ⚠️ And that the SELECTION is non-empty. The check above proves the chapter list parsed; it
    // cannot see a filter that then matches nothing — a typo'd `E2E_ONLY=decimls` sweeps zero
    // chapters and reports green, which is the same vacuity one step later.
    const selected = ONLY ? ALL.filter(c => ONLY.includes(c.id)) : ALL
    expect(selected.length, `E2E_ONLY matched no chapters: ${process.env.E2E_ONLY}`).toBeGreaterThan(0)
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

          /**
           * 2. It is OPERABLE, or it explicitly asks to be turned — never a dead screen.
           *
           * ⚠️ THE ROTATE GATE IS A LEGITIMATE ANSWER AND THE FIRST VERSION OF THIS CHECK DID NOT
           * KNOW THAT. The 3–11 story chapters are landscape-first (`useNeedsRotate` is
           * `innerHeight > innerWidth && innerWidth < 820`), so on a 390×844 phone they correctly
           * render "Turn your phone sideways", which has no button. Demanding a control there
           * failed 21 chapters that were behaving exactly as designed.
           *
           * ⚠️ AND IT PASSED ON LOCALHOST WHILE FAILING ON PROD, which is the part worth keeping:
           * `useNeedsRotate` runs in an EFFECT and starts `false`, so the chapter paints first and
           * the gate replaces it a frame later. The dev run caught the pre-effect frame and the
           * prod run caught the settled one. A check that races a `useEffect` will pass or fail on
           * timing, not on truth — assert the END STATE that is acceptable, which is either.
           */
          /**
           * ⚠️ WAIT FOR *EITHER*, RATHER THAN ASKING WHICH ONE FIRST. Branching on an instantaneous
           * `isVisible()` re-introduced the same race one level up: read before the effect runs and
           * the gate is not there yet, so the check falls into the button branch and then waits 20s
           * for a control that is never coming. It failed `shapes` while `shapes` was behaving
           * perfectly. `.or()` resolves as soon as either appears, so there is no instant to be
           * wrong at.
           */
          const control = page.locator('button:visible').first()
          const rotateGate = page.getByText('Turn your phone sideways')
          await expect(
            control.or(rotateGate).first(),
            `${ch.id}: neither a usable control nor a rotate gate`,
          ).toBeVisible()

          // If it asked to be turned, it must also say WHY — an empty gate is not a polite refusal.
          if (await rotateGate.isVisible().catch(() => false)) {
            const gateText = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim()
            expect(gateText.length, `${ch.id}: rotate gate with no explanation`)
              .toBeGreaterThan('🔄 Turn your phone sideways'.length + 8)
          }

          // 3. It fits. A horizontal scrollbar on a child's tablet means part of the answer
          //    surface is off the side of the screen.
          const overflow = await page.evaluate(() =>
            document.documentElement.scrollWidth - document.documentElement.clientWidth)
          expect(overflow, `${ch.id}: ${overflow}px of horizontal overflow`).toBeLessThanOrEqual(1)

          /**
           * 4. Every visible control is actually on screen AND big enough to hit.
           *
           * ⚠️ THIS COMMENT USED TO CLAIM THE 44px FLOOR AND THE CODE ONLY CHECKED `offscreen` —
           * the tap-size half was never written. "A comment asserting a rule is followed is the
           * most expensive kind of lie", because it is exactly what stops the next reader checking.
           * Found while sweeping responsiveness on 2026-08-21.
           *
           * The floor is on the SMALLER side of the box, because a 200x20 button is as unhittable
           * as a 20x200 one. Text links are exempt: `a[href]` inside a sentence is inline and is
           * legitimately line-height tall — the floor is for CONTROLS, so it is applied to buttons
           * and to links that are styled as one (a border, a background, or a block display).
           *
           * ⚠️ IT FAILS AT `MIN_TAP` (24, WCAG AA) AND ONLY NOTES AT `TIGHT_TAP` (44). The first
           * draft failed at 44 and went red on 30 chapters over their "Menu" chip — while
           * `short-landscape.spec.ts` had already, deliberately, made 44 a note. Two gates
           * disagreeing about one rule is worse than either rule.
           */
          const badControls = await page.evaluate(({ MIN_TAP, TIGHT_TAP }) => {
            const out: string[] = []
            const tight: string[] = []
            for (const el of Array.from(document.querySelectorAll('button, a[href]'))) {
              const r = el.getBoundingClientRect()
              if (!r.width || !r.height) continue                       // not rendered
              const cs = getComputedStyle(el)
              if (cs.visibility === 'hidden') continue
              const label = (el.textContent || '').trim().slice(0, 24) || el.tagName
              if (r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight) {
                out.push(`offscreen: ${label}`)
                continue
              }
              const inlineLink = el.tagName === 'A'
                && cs.display.startsWith('inline')
                && cs.borderBottomWidth === '0px'
                && (cs.backgroundColor === 'rgba(0, 0, 0, 0)' || cs.backgroundColor === 'transparent')
              if (inlineLink) continue
              const min = Math.min(r.width, r.height)
              if (min < MIN_TAP) out.push(`${Math.round(r.width)}x${Math.round(r.height)}: ${label}`)
              else if (min < TIGHT_TAP) tight.push(`${Math.round(r.width)}x${Math.round(r.height)}: ${label}`)
            }
            if (tight.length) console.info(`[tight tap] ${tight.join(' | ')}`)
            return out
          }, { MIN_TAP, TIGHT_TAP })
          expect(badControls, `${ch.id}: ${badControls.join(' | ')}`).toEqual([])

          // 5. Nothing threw while it mounted.
          expect(errors, `${ch.id}: console errors — ${errors.slice(0, 2).join(' | ')}`).toEqual([])

          /**
           * 6. ⚠️ AND ONE SCREEN IN, BECAUSE THE START CARD IS THE ONE SCREEN THAT ALWAYS FITS.
           *
           * Checks 1–5 opened each chapter and stopped, so the whole walkthrough — where the board,
           * the instrument, the step transport and the skip chip are all on screen at once — was
           * never swept. It shipped a real dead end: on an 800×450 frame The Coin Tray's
           * walkthrough drew the tray 741×319 inside a 560×314 slot (the legacy no-TutorialScene
           * path had no FitSlot, unlike play), pushing "I've got it →" to y 474–503 of a 450px
           * viewport with no scroll — unreachable, i.e. a child could not leave the walkthrough.
           * Every 9–11 chapter takes that path.
           *
           * Deliberately shallow: press the primary control ONCE and re-run the fit checks. It is
           * ~10s across the sweep and it doubles the reach. Anything that needs a real answer
           * belongs in a per-chapter drive, not here.
           */
          if (await rotateGate.isVisible().catch(() => false)) return
          /**
           * ⚠️ NOT `button:visible.first()` — THAT IS "‹ Menu", WHICH LEAVES THE CHAPTER.
           * The first draft did exactly that and reported five offscreen controls named "Sign in",
           * "Terms" and "Continue with Google": it had walked out to the auth page and was
           * measuring THAT. It failed on the planted regression, so it looked like a working gate,
           * and it would have failed identically with the bug fixed. A failure is only evidence
           * when it is the failure you planted.
           *
           * The entry control is the biggest one on the card — every start card styles its primary
           * CTA large — so take it by area, and refuse anything that navigates.
           */
          const before = page.url()
          const picked = await page.evaluate(() => {
            let best: Element | null = null, bestA = 0
            for (const el of Array.from(document.querySelectorAll('button'))) {
              const r = el.getBoundingClientRect()
              if (!r.width || !r.height) continue
              if (getComputedStyle(el).visibility === 'hidden') continue
              if (/^\s*‹?\s*(menu|back)/i.test(el.textContent || '')) continue
              if (r.width * r.height > bestA) { bestA = r.width * r.height; best = el }
            }
            if (!best) return null
            ;(best as HTMLElement).click()
            return (best.textContent || '').trim().slice(0, 24)
          })
          if (!picked) return
          await page.waitForTimeout(400)
          expect(page.url(), `${ch.id}: "${picked}" navigated away from the chapter`).toBe(before)
          // Let the stage swap and its measure-then-scale settle; the instrument is scaled from a
          // ResizeObserver, which delivers on the rendering steps rather than synchronously.
          await page.waitForTimeout(900)

          const deep = await page.evaluate(() => {
            const out: string[] = []
            for (const el of Array.from(document.querySelectorAll('button, a[href]'))) {
              const r = el.getBoundingClientRect()
              if (!r.width || !r.height) continue
              if (getComputedStyle(el).visibility === 'hidden') continue
              const label = (el.textContent || '').trim().slice(0, 24) || el.tagName
              // `top > innerHeight` alone misses the commonest case — a control that STRADDLES the
              // bottom edge is still unhittable. Require the whole box to be inside the frame.
              if (r.bottom > innerHeight + 1 || r.top < -1 || r.right > innerWidth + 1 || r.left < -1) {
                out.push(`offscreen after entering: ${label} (${Math.round(r.top)}–${Math.round(r.bottom)} of ${innerHeight})`)
              }
            }
            if (document.documentElement.scrollWidth - document.documentElement.clientWidth > 1) {
              out.push('horizontal overflow after entering')
            }
            return out
          })
          expect(deep, `${ch.id}: ${deep.join(' | ')}`).toEqual([])
          expect(errors, `${ch.id}: console errors after entering — ${errors.slice(0, 2).join(' | ')}`).toEqual([])
        })
      }
    })
  }
})

/** Exported so a human can see what the gate believes it covers: `node -e "..."` or a failing run. */
export { chapters }
