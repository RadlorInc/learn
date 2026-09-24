/**
 * REVIEW 1, Q4 IN A REAL BROWSER, ON A FAKE BACKEND (founder, 2026-09-24): the parent's Progress tab — "Topics mastered"
 * opens the list, by module, with the day each was mastered. Driven on /ui-preview (the real dashboard, demo family),
 * with the reads answered here. Keyboard: the tile is reached with Tab and opened with Enter.
 *
 *   E2E_BASE_URL=http://localhost:3091 npx playwright test e2e/review1-mastered.spec.ts
 * ⚠️ NOTHING LEAVES THE MACHINE. ⚠️ Expected words are written out here.
 */
import { test, expect, type BrowserContext, type Route } from '@playwright/test'

const FAKE = 'https://e2e-fake.supabase.co'
const SHOTS = 'docs/legal/screenshots/review1'
const ROWS = [
  { lesson_id: 'g3m1-t1', done: true, level: 3, streak: 0, mastered: true },
  { lesson_id: 'g3m1-t2', done: true, level: 3, streak: 0, mastered: true },
  { lesson_id: 'g5m1-t1', done: true, level: 4, streak: 0, mastered: true },
  { lesson_id: 'g5m1-t2', done: false, level: 1, streak: 0, mastered: false },
]
const MASTERED = [
  { lesson_id: 'g3m1-t1', created_at: '2026-09-18T15:00:00Z' },
  { lesson_id: 'g5m1-t1', created_at: '2026-09-23T15:00:00Z' },   // g3m1-t2 has none: mastered before the ledger was emptied
]

test.use({ launchOptions: { args: ['--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost'] } })

async function fake(ctx: BrowserContext) {
  await ctx.route(`${FAKE}/**`, async (route: Route) => {
    const req = route.request(), url = new URL(req.url()), path = url.pathname
    const json = (body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    if (path === '/rest/v1/lesson_progress') return json(ROWS)
    if (path === '/rest/v1/point_events') return json(url.searchParams.get('reason') === 'eq.mastered' ? MASTERED : [])
    return json(req.method() === 'GET' ? [] : {})
  })
}

for (const v of [{ name: 'desktop', w: 1280, h: 820 }, { name: 'phone-375', w: 375, h: 812 }]) {
  test(`Q4 — ${v.name}: Topics mastered opens the list, by module, with dates`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h } })
    await fake(ctx)
    const page = await ctx.newPage()
    await page.goto('/ui-preview?p=child&tab=progress')
    const tile = page.getByRole('button', { name: /Topics mastered/ })
    await expect(tile).toContainText('3')
    await expect(tile).toHaveAttribute('aria-expanded', 'false')
    await tile.focus()
    await page.keyboard.press('Enter')                                  // keyboard, not a click
    await expect(tile).toHaveAttribute('aria-expanded', 'true')
    const list = page.getByRole('region', { name: 'Mastered topics' })
    await expect(list.getByRole('heading', { level: 3 })).toHaveText([/^Grade 3 · /, /^Grade 5 · /])
    await expect(list.getByRole('listitem')).toHaveCount(3)
    await expect(list.getByRole('listitem').nth(0)).toContainText('Mastered Sep 18')
    await expect(list.getByRole('listitem').nth(1)).toContainText('Mastered, date not recorded')
    await expect(list.getByRole('listitem').nth(2)).toContainText('Mastered Sep 23')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await list.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${SHOTS}/q4-mastered-${v.name}.png`, fullPage: true })
    await ctx.close()
  })
}
