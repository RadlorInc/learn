/**
 * REVIEW 1, Q7 IN A REAL BROWSER, ON A FAKE BACKEND (founder, 2026-09-24): the vertical number line beside the pad on a
 * signed-number topic — opened, marked from the keyboard, fits a 375 px phone — and absent on any other topic.
 *
 *   E2E_BASE_URL=http://localhost:3092 npx playwright test e2e/review1-vline.spec.ts
 * ⚠️ NOTHING LEAVES THE MACHINE. ⚠️ Labels are written out here.
 */
import { test, expect, type BrowserContext, type Route } from '@playwright/test'
import { ladderOf } from '../src/features/lessons/ladders'
import { draw, rng } from '../src/features/lessons/adaptive'

const FAKE = 'https://e2e-fake.supabase.co'
const KID = 'e2e-kid'
const SHOTS = 'docs/legal/screenshots/review1'

test.use({ launchOptions: { args: ['--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost'] } })
test.setTimeout(120_000)

async function device(browser: import('@playwright/test').Browser, o: { w: number; h: number; reduce?: boolean; topic: string }) {
  const TOPIC = o.topic
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


for (const v of [{ name: 'desktop', w: 1280, h: 820 }, { name: 'phone-375', w: 375, h: 812, reduce: true }]) {
  test(`Q7 — ${v.name}: g7m2 practice offers the line; marked from the keyboard; it fits`, async ({ browser }) => {
    const ctx = await device(browser, { ...v, topic: 'g7m2-t3' })
    const page = await ctx.newPage()
    await page.goto('/lesson?id=g7m2-t3')
    await page.getByRole('button', { name: 'Keep practicing' }).click()
    const toggle = page.getByRole('button', { name: /Number line/ })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()
    const line = page.getByRole('group', { name: 'Number line' })
    await expect(line.getByRole('button', { name: /^Mark / })).toHaveCount(21)
    await line.getByRole('button', { name: 'Mark −3' }).focus()
    await page.keyboard.press('Enter')
    await expect(line.getByRole('button', { name: 'Take the mark off −3' })).toHaveAttribute('aria-pressed', 'true')
    await line.getByRole('button', { name: 'Mark 5' }).click()
    // Top to bottom on screen, not just in the DOM: 10 above 0 above −10.
    const y = async (n: string) => (await line.getByText(n, { exact: true }).boundingBox())!.y
    expect(await y('10')).toBeLessThan(await y('0'))
    expect(await y('0')).toBeLessThan(await y('−10'))
    // Nothing of it, nor of the pad beside it, is pushed off the page.
    const cut = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#pr-vline button, canvas, .pr-pad button')].filter(el => {
      const r = el.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > document.documentElement.getBoundingClientRect().right + 1)
    }).map(el => el.getAttribute('aria-label') ?? el.textContent))
    expect(cut).toEqual([])
    await line.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${SHOTS}/q7-vline-${v.name}.png` })
    await ctx.close()
  })
}

test('Q7 — a topic outside Grade 7 Module 2 has no number line', async ({ browser }) => {
  const ctx = await device(browser, { w: 1280, h: 820, topic: 'g5m1-t12' })
  const page = await ctx.newPage()
  await page.goto('/lesson?id=g5m1-t12')
  await page.getByRole('button', { name: 'Keep practicing' }).click()
  await expect(page.getByRole('button', { name: 'Check' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Number line/ })).toHaveCount(0)
  await ctx.close()
})
