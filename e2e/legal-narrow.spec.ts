/**
 * THE LEGAL PAGES FIT A 320 px PHONE (founder, 2026-09-24): `/legal/privacy` — PUBLISHED — scrolled sideways at 320 px,
 * because one long URL (`https://radlic.com/legal/subprocessors`) could not wrap. Every legal page, published or dark:
 * the page never scrolls sideways, and nothing reaches past the screen's edge unless it sits in a box that scrolls on
 * its own (a wide table does, on purpose).
 *
 *   E2E_BASE_URL=http://localhost:3091 npx playwright test e2e/legal-narrow.spec.ts
 * ⚠️ The slugs are written out here, not read from the registry.
 */
import { test, expect } from '@playwright/test'

const SLUGS = ['privacy', 'terms', 'refunds', 'parent-rights', 'subprocessors', 'cookies', 'retention']
test.use({ viewport: { width: 320, height: 568 } })

for (const slug of SLUGS) {
  test(`/legal/${slug} fits 320 px`, async ({ page }) => {
    await page.goto(`/legal/${slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const out = await page.evaluate(() => {
      const W = document.documentElement.clientWidth, bad: string[] = []
      if (document.documentElement.scrollWidth > W + 1) bad.push(`page is ${document.documentElement.scrollWidth}px wide`)
      for (const el of document.querySelectorAll<HTMLElement>('body *')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.right <= W + 1) continue
        let scrolls = false
        for (let n = el.parentElement; n; n = n.parentElement) if (/(auto|scroll)/.test(getComputedStyle(n).overflowX)) { scrolls = true; break }
        if (!scrolls && ![...el.children].some(c => c.getBoundingClientRect().right > W + 1)) bad.push(`${el.tagName} "${(el.textContent ?? '').trim().slice(0, 40)}" reaches ${Math.round(r.right)}`)
      }
      return bad
    })
    expect(out).toEqual([])
  })
}
