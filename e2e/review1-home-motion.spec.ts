/**
 * REVIEW 1, Q8 IN A REAL BROWSER, ON A FAKE BACKEND (founder, 2026-09-24): the child's home drifts, slowly — measured by
 * sampling the background twice — and is perfectly still under reduced motion; practice never moves.
 *
 *   E2E_BASE_URL=http://localhost:3092 npx playwright test e2e/review1-home-motion.spec.ts
 * ⚠️ NOTHING LEAVES THE MACHINE. ⚠️ Expected values are written out here.
 */
import { test, expect, type BrowserContext, type Page, type Route } from '@playwright/test'
import { ladderOf } from '../src/features/lessons/ladders'
import { draw, rng } from '../src/features/lessons/adaptive'

const FAKE = 'https://e2e-fake.supabase.co'
const KID = 'e2e-kid', TOPIC = 'g5m1-t12'
const SHOTS = 'docs/legal/screenshots/review1'

test.use({ launchOptions: { args: ['--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost'] } })
test.setTimeout(120_000)

async function device(browser: import('@playwright/test').Browser, o: { w: number; h: number; reduce?: boolean }) {
  const ctx: BrowserContext = await browser.newContext({ viewport: { width: o.w, height: o.h }, reducedMotion: o.reduce ? 'reduce' : 'no-preference' })
  await ctx.route(`${FAKE}/**`, (route: Route) => {
    const path = new URL(route.request().url()).pathname
    const body = path.startsWith('/auth/v1/user') ? { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'e2e@x.invalid' }
      : route.request().method() === 'GET' ? [] : {}
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  await ctx.addInitScript(({ kid }) => {
    const b64 = (x: unknown) => btoa(JSON.stringify(x)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const exp = Math.floor(Date.now() / 1000) + 3600, sub = '00000000-0000-4000-8000-000000000001'
    const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub, role: 'authenticated', exp, aud: 'authenticated' })}.e2e`
    if (!localStorage.getItem('milo-auth')) localStorage.setItem('milo-auth', JSON.stringify({ access_token: jwt, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: exp,
      user: { id: sub, aud: 'authenticated', role: 'authenticated', email: 'e2e@x.invalid', app_metadata: {}, user_metadata: {}, created_at: new Date(0).toISOString() } }))
    sessionStorage.setItem('milo_active_learner', JSON.stringify({ id: kid, display_name: 'Ava', name: 'Ava', age_group: '9-11', lesson_ids: null, lesson_due: null }))
  }, { kid: KID })
  const problem = draw(ladderOf(TOPIC)!, 0, rng(9))
  const p = await ctx.newPage()
  await p.goto('/llms.txt')
  await p.evaluate(({ key, run }) => new Promise<void>(res => {
    const r = indexedDB.open('milo', 1)
    r.onupgradeneeded = () => r.result.createObjectStore('kv')
    r.onsuccess = () => { const tx = r.result.transaction('kv', 'readwrite'); tx.objectStore('kv').put(JSON.stringify(run), key); tx.oncomplete = () => { r.result.close(); res() } }
  }), { key: `milo-newflow-run-${KID}-${TOPIC}`, run: { asked: 0, recent: [problem.text], current: { problem, from: TOPIC }, review: null } })
  await p.close()
  return ctx
}


/** The home's background layers' positions, now. */
const bgPos = (page: Page) => page.locator('.mh-page').evaluate(el => getComputedStyle(el).backgroundPosition)

test('Q8 — desktop, motion on: the home\'s circles drift; the first paint does not wait; practice is still', async ({ browser }) => {
  const ctx = await device(browser, { w: 1280, h: 820 })
  const page = await ctx.newPage()
  await page.goto('/modules?grade=5')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.locator('.mh-page').evaluate(el => getComputedStyle(el).animationName)).toBe('mh-drift')
  // Moving, and slowly: the largest step any layer takes in 100 ms, over 1.5 s. ⚠️ Not two samples far apart — on a
  // short loop they can land on the same phase and read as "slow" (a 3 s loop passed that version).
  const steps = await page.locator('.mh-page').evaluate(async el => {
    const read = () => (getComputedStyle(el).backgroundPosition.match(/-?\d+(\.\d+)?px/g) ?? []).map(parseFloat)
    const out: number[] = []
    let prev = read()
    for (let k = 0; k < 15; k++) {
      await new Promise(r => setTimeout(r, 100))
      const now = read(); out.push(Math.max(...now.map((v, i) => Math.abs(v - prev[i])))); prev = now
    }
    return out
  })
  expect(steps.reduce((a, b) => a + b, 0), 'it moved').toBeGreaterThan(0.1)
  expect(Math.max(...steps), 'slowly: under 1.5 px per 100 ms').toBeLessThan(1.5)
  await page.screenshot({ path: `${SHOTS}/q8-home-desktop.png` })

  await page.goto(`/lesson?id=${TOPIC}`)
  await page.getByRole('button', { name: 'Keep practicing' }).click()
  await expect(page.getByRole('button', { name: 'Check' })).toBeVisible()
  expect(await page.locator('.mh-page').count()).toBe(0)
  const still = await page.locator('.pr-page').evaluate(el => getComputedStyle(el).animationName)
  expect(still).toBe('none')
  await ctx.close()
})

test('Q8 — 375 px, reduced motion: the home does not move at all', async ({ browser }) => {
  const ctx = await device(browser, { w: 375, h: 812, reduce: true })
  const page = await ctx.newPage()
  await page.goto('/modules?grade=5')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.locator('.mh-page').evaluate(el => getComputedStyle(el).animationName)).toBe('none')
  const a = await bgPos(page)
  await page.waitForTimeout(2500)
  expect(await bgPos(page)).toBe(a)
  await page.screenshot({ path: `${SHOTS}/q8-home-phone-375-reduced.png` })
  await ctx.close()
})
