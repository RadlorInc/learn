import { test, expect } from '@playwright/test'
import { IGNORED_ERRORS, MIN_TAP, TIGHT_TAP } from './personas'

/**
 * THE SCREENS SWEEP — everything that is NOT a chapter, on every frame a person might hold.
 *
 * `all-chapters.spec.ts` covers the 71 chapters and nothing else, so the screens a parent actually
 * lands on — the landing page, the placement check, sign-in, help, the legal pages — had no
 * responsiveness gate at all. They are also the screens with the most PROSE, which is what wraps,
 * and prose that wraps is what pushes a control off the bottom.
 *
 * ⚠️ THE CHECK THAT MATTERS HERE IS "UNREACHABLE", NOT "OFFSCREEN", AND THEY ARE DIFFERENT.
 * A chapter is `100dvh; overflow: hidden`, so a control below the fold is simply gone. A normal
 * page SCROLLS, so a control below the fold is fine — it is only a defect when nothing between it
 * and the document can scroll to it. That distinction is the whole bug this sweep was written
 * after: the celebration modal centred its card with `align-items: center`, which CLIPS an
 * overflowing child, and at 640x320 its top 189px — Milo and the entire message — were off the
 * screen with no way to scroll back to them. Every piece was individually correct.
 */

/** Public — reachable with no session at all. */
const PUBLIC = [
  { path: '/',               name: 'landing' },
  { path: '/auth',           name: 'sign-in' },
  { path: '/diagnostic',     name: 'placement-check' },
  { path: '/help',           name: 'help' },
  { path: '/legal/privacy',  name: 'privacy' },
  { path: '/legal/terms',    name: 'terms' },
  { path: '/story',          name: 'story-index' },
  { path: '/teen-preview',   name: 'teen-index' },
]

/**
 * Every shape a person holds this on, not the three that were convenient. The short-landscape and
 * small-portrait ends are where things break; the 1920 end is where a fixed `max-width` starts to
 * look like a column of text on a billboard, which is a different fault and worth seeing.
 */
const SIZES = [
  { w: 320,  h: 568,  name: 'small-portrait' },   // iPhone SE
  { w: 390,  h: 844,  name: 'tall-portrait' },
  { w: 640,  h: 320,  name: 'short-landscape' },  // this repo's documented fault zone
  { w: 768,  h: 1024, name: 'tablet-portrait' },
  { w: 1024, h: 600,  name: 'small-laptop' },
  { w: 1280, h: 720,  name: 'laptop' },
  { w: 1920, h: 1080, name: 'desktop' },
]

const FAILURE_TEXT = ['Application error', 'Unhandled Runtime Error', 'This page could not be found', 'went wrong']

test.describe('screens are usable at every size', () => {
  for (const size of SIZES) {
    test.describe(`${size.name} ${size.w}x${size.h}`, () => {
      for (const route of PUBLIC) {
        test(route.name, async ({ page }) => {
          const errors: string[] = []
          page.on('console', m => { if (m.type() === 'error' && !IGNORED_ERRORS.test(m.text())) errors.push(m.text()) })
          page.on('pageerror', e => errors.push(String(e)))

          await page.setViewportSize({ width: size.w, height: size.h })
          await page.goto(route.path, { waitUntil: 'domcontentloaded' })
          await page.waitForTimeout(400)   // let a client-only screen paint its real content

          const body = await page.locator('body').innerText()
          for (const bad of FAILURE_TEXT) expect(body, `${route.name}: "${bad}" on screen`).not.toContain(bad)

          // 1. Nothing hangs off the SIDE. Vertical scrolling is normal; horizontal never is.
          const overflow = await page.evaluate(() =>
            document.documentElement.scrollWidth - document.documentElement.clientWidth)
          expect(overflow, `${route.name}: ${overflow}px of horizontal overflow`).toBeLessThanOrEqual(1)

          // 2. Every control is REACHABLE and hittable — see the header note on unreachable vs offscreen.
          const bad = await page.evaluate(({ MIN_TAP, TIGHT_TAP }) => {
            const out: string[] = []
            const tight: string[] = []
            /** Can this element be brought into view by scrolling something? */
            const reachable = (el: Element): boolean => {
              for (let n: Element | null = el; n; n = n.parentElement) {
                const cs = getComputedStyle(n)
                const scrolls = /auto|scroll/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1
                if (scrolls) return true
              }
              const d = document.documentElement
              return d.scrollHeight > d.clientHeight + 1
            }
            for (const el of Array.from(document.querySelectorAll('button, a[href], input, select, textarea'))) {
              const r = el.getBoundingClientRect()
              if (!r.width || !r.height) continue
              const cs = getComputedStyle(el)
              if (cs.visibility === 'hidden' || cs.display === 'none') continue
              const label = (el.textContent || (el as HTMLInputElement).placeholder || '').trim().slice(0, 28) || el.tagName
              const below = r.top > innerHeight || r.bottom < 0
              const aside = r.left > innerWidth || r.right < 0
              if ((below || aside) && !reachable(el)) { out.push(`unreachable: ${label}`); continue }
              // An inline text link inside a sentence is legitimately line-height tall — the tap
              // floor is for CONTROLS, not for the word "Terms" in a paragraph. ⚠️ A link that is a
              // FLEX CHILD is blockified, so `display` reads "block" and this exemption misses it —
              // which is correct here: the landing footer's links are a row of standalone controls,
              // not words in a sentence, and they measure 19px.
              const inlineLink = el.tagName === 'A' && cs.display.startsWith('inline')
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
          expect(bad, `${route.name}: ${bad.join(' | ')}`).toEqual([])

          // 3. Nothing threw on the way in.
          expect(errors, `${route.name}: ${errors.slice(0, 2).join(' | ')}`).toEqual([])
        })
      }
    })
  }
})
