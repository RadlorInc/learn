/**
 * REVIEW 1, Q3 IN A REAL BROWSER, ON A FAKE BACKEND (founder, 2026-09-24): the module summary and Practice again.
 *
 *   npm run dev -- -p 3091   (w-rv1's .env.local points Supabase at https://e2e-fake.supabase.co)
 *   E2E_BASE_URL=http://localhost:3091 npx playwright test e2e/review1-summary.spec.ts
 *
 * ⚠️ NOTHING LEAVES THE MACHINE. ⚠️ Expected words are written out here; the app's own code is used only to seed the
 * device (a real problem from the topic's ladder) and to know the answer a child would type.
 */
import { test, expect, type BrowserContext, type Page, type Route } from '@playwright/test'
import { solutionOf } from '../src/features/lessons/script'
import { ladderOf, ladderAnswers } from '../src/features/lessons/ladders'
import { draw, rng } from '../src/features/lessons/adaptive'
import { MODULES } from '../src/features/lessons/modules'

const FAKE = 'https://e2e-fake.supabase.co'
const KID = 'e2e-kid'
const SHOTS = 'docs/legal/screenshots/review1'
// The topic left to finish: the first that answers with plain numbers, so the spec can type what a child would. Every
// other topic of its module is seeded done, so finishing it completes the module.
const LAST = MODULES.flatMap(m => m.lessons).find(l => ladderOf(l.id) && ladderAnswers(ladderOf(l.id)!).every(a => typeof a === 'number'))!
const MOD = MODULES.find(m => m.lessons.includes(LAST))!

test.use({ launchOptions: { args: ['--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost'] } })
test.describe.configure({ mode: 'serial' })
test.setTimeout(180_000)

async function fake(ctx: BrowserContext) {
  await ctx.route(`${FAKE}/**`, async (route: Route) => {
    const req = route.request(), path = new URL(req.url()).pathname
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (path === '/rest/v1/point_events') return json(MOD.lessons.map(l => ({ lesson_id: l.id, reason: 'lesson_done', points: 10, created_at: new Date().toISOString() })))
    if (path === '/rest/v1/rpc/game_wallet') return json({ balance: 80, points_per_minute: 8, enabled: true, minutes_per_day: 20, time_zone: 'UTC', minutes_used_today: 0, playing_until: null })
    if (path === '/rest/v1/rpc/record_lesson_progress') return json({ ok: true, earned: 0, balance: 0 })
    if (path.startsWith('/auth/v1/user')) return json({ id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'e2e@x.invalid' })
    return json(req.method() === 'GET' ? [] : {})
  })
}

/** A signed-in child whose device already holds `kv` (moved into IndexedDB `milo`/`kv` before the app loads). */
async function device(browser: import('@playwright/test').Browser, o: { phone?: boolean; reduce?: boolean; kv: Record<string, unknown> }) {
  const ctx = await browser.newContext({ viewport: o.phone ? { width: 375, height: 812 } : { width: 1280, height: 820 }, reducedMotion: o.reduce ? 'reduce' : 'no-preference' })
  await fake(ctx)
  await ctx.addInitScript(({ kid }) => {
    const b64 = (x: unknown) => btoa(JSON.stringify(x)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const exp = Math.floor(Date.now() / 1000) + 3600, sub = '00000000-0000-4000-8000-000000000001'
    const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub, role: 'authenticated', exp, aud: 'authenticated' })}.e2e`
    if (!localStorage.getItem('milo-auth')) {
      localStorage.setItem('milo-auth', JSON.stringify({ access_token: jwt, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: exp,
        user: { id: sub, aud: 'authenticated', role: 'authenticated', email: 'e2e@x.invalid', app_metadata: {}, user_metadata: {}, created_at: new Date(0).toISOString() } }))
    }
    sessionStorage.setItem('milo_active_learner', JSON.stringify({ id: kid, display_name: 'Ava', name: 'Ava', age_group: '9-11', lesson_ids: null, lesson_due: null }))
  }, { kid: KID })
  const p = await ctx.newPage()
  await p.goto('/llms.txt')
  await p.evaluate(kv => new Promise<void>((res, rej) => {
    const r = indexedDB.open('milo', 1)
    r.onupgradeneeded = () => r.result.createObjectStore('kv')
    r.onsuccess = () => {
      const tx = r.result.transaction('kv', 'readwrite')
      for (const [k, v] of Object.entries(kv)) tx.objectStore('kv').put(JSON.stringify(v), k)
      tx.oncomplete = () => { r.result.close(); res() }; tx.onerror = () => rej(tx.error)
    }
  }), o.kv)
  await p.close()
  return ctx
}
/** Every topic of MOD done (the first two mastered) — except `except`, if given. */
const doneKv = (except?: string) => Object.fromEntries(MOD.lessons.filter(l => l.id !== except).flatMap((l, i) => [
  [`milo-newflow-done-${KID}-${l.id}`, 1],
  [`milo-newflow-standing-${KID}-${l.id}`, { level: 2, streak: 0, mastered: i < 2 }],
]))
const noSideScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

test('control: a topic to finish exists, in a module with others seeded done', () => {
  expect(LAST).toBeTruthy(); expect(MOD.lessons.length).toBeGreaterThan(2)
})

test('Q3 — desktop: the module\'s last topic left done → "See what you learned ⭐" → the summary', async ({ browser }) => {
  const problem = draw(ladderOf(LAST.id)!, 0, rng(5))
  const ctx = await device(browser, { kv: {
    ...doneKv(LAST.id),
    [`milo-newflow-standing-${KID}-${LAST.id}`]: { level: 0, streak: 0, mastered: false },
    [`milo-newflow-run-${KID}-${LAST.id}`]: { asked: 11, recent: [problem.text], current: { problem, from: LAST.id }, review: null },
  } })
  const page = await ctx.newPage()
  await page.goto(`/lesson?id=${LAST.id}`)
  await page.getByRole('button', { name: 'Keep practicing' }).click()
  await page.locator('form input').first().fill(String(solutionOf(problem)))
  await page.locator('button[type=submit]').click()
  await expect(page.getByText(/^Practice 13$/)).toBeVisible()          // the 12th answer moved on by itself: the topic is done
  await page.getByRole('button', { name: 'Take a break' }).first().click()
  await expect(page.getByText('Module complete!')).toBeVisible()
  const see = page.getByRole('button', { name: 'See what you learned ⭐' })
  await expect(see).toBeVisible()
  await see.click()
  await expect(page).toHaveURL(new RegExp(`/lesson\\?module=${MOD.id}&summary=1$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Module complete! ⭐')
  await expect(page.getByText(`${MOD.lessons.length} topics done · +${10 * MOD.lessons.length} points`)).toBeVisible()
  await expect(page.getByRole('region', { name: 'You got really good at:' }).getByRole('listitem')).toHaveCount(2)
  await expect(page.getByRole('region', { name: "Let's keep practicing:" }).getByRole('listitem')).toHaveCount(MOD.lessons.length - 2)
  expect(await page.locator('body').innerText()).not.toMatch(/\b\d+ of \d+\b|\d\s*%|wrong|fail|incomplete/i)
  await expect.poll(() => page.getByAltText('Module badge').evaluate(el => getComputedStyle(el).opacity)).toBe('1')   // past its pop-in
  await page.waitForTimeout(450)
  await page.screenshot({ path: `${SHOTS}/q3-summary-desktop.png`, fullPage: true })
  await ctx.close()
})

test('Q3 — 375 px, reduced motion: the topic map\'s chip → the summary → Practice again opens practice directly', async ({ browser }) => {
  const ctx = await device(browser, { phone: true, reduce: true, kv: doneKv() })
  const page = await ctx.newPage()
  await page.goto(`/lesson?module=${MOD.id}`)
  await page.getByRole('link', { name: 'See what you learned ⭐' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Module complete! ⭐')
  expect(await noSideScroll(page)).toBe(true)
  // Reduced motion: the badge does not pop.
  expect(await page.getByAltText('Module badge').evaluate(el => parseFloat(getComputedStyle(el).animationDuration))).toBeLessThan(0.01)
  await page.screenshot({ path: `${SHOTS}/q3-summary-phone-375.png`, fullPage: true })
  const first = MOD.lessons[0]
  await page.getByRole('link', { name: `Practice again: ${first.title}` }).click()
  await expect(page.getByRole('heading', { level: 1, name: /^Problem \d+$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Check' })).toBeVisible()
  expect(await page.locator('body').innerText()).not.toMatch(/Screen \d of 9|Welcome back/)
  await page.screenshot({ path: `${SHOTS}/q3-practice-again-phone-375.png` })
  await ctx.close()
})
