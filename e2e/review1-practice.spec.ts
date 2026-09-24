/**
 * REVIEW 1, Q1 + Q2 IN A REAL BROWSER, ON A FAKE BACKEND (founder, 2026-09-24).
 *
 *   npm run dev -- -p 3091   (w-rv1's .env.local points Supabase at https://e2e-fake.supabase.co)
 *   E2E_BASE_URL=http://localhost:3091 npx playwright test e2e/review1-practice.spec.ts
 *
 * ⚠️ NOTHING LEAVES THE MACHINE: every call to the fake host is answered here, every other hostname is NOTFOUND.
 * ⚠️ Expected words and colours are written out here, never imported from the app. The spec only reads the ANSWER out
 * of the problem the device holds, the way a child who knows it would type it.
 * Screenshots → docs/legal/screenshots/review1/.
 */
import { test, expect, type BrowserContext, type Page, type Route } from '@playwright/test'
import { solutionOf, type Problem } from '../src/features/lessons/script'

const FAKE = 'https://e2e-fake.supabase.co'
const KID = 'e2e-kid'
const TOPIC = 'g5m1-t12'
const SHOTS = 'docs/legal/screenshots/review1'
const YELLOW = 'rgb(255, 209, 102)', GREEN_BOX = 'rgb(183, 240, 198)'

test.use({ launchOptions: { args: ['--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost'] } })
test.describe.configure({ mode: 'serial' })
test.setTimeout(300_000)

async function fake(ctx: BrowserContext) {
  await ctx.route(`${FAKE}/**`, async (route: Route) => {
    const req = route.request(), path = new URL(req.url()).pathname
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (path === '/rest/v1/rpc/game_wallet') return json({ balance: 40, points_per_minute: 8, enabled: true, minutes_per_day: 20, time_zone: 'UTC', minutes_used_today: 0, playing_until: null })
    if (path === '/rest/v1/rpc/record_lesson_progress') return json({ ok: true, earned: 0, balance: 0 })
    if (path.startsWith('/auth/v1/user')) return json({ id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'e2e@x.invalid' })
    return json(req.method() === 'GET' ? [] : {})
  })
}

async function device(browser: import('@playwright/test').Browser, o: { phone?: boolean; reduce?: boolean }) {
  const ctx = await browser.newContext({
    viewport: o.phone ? { width: 375, height: 812 } : { width: 1280, height: 820 },
    reducedMotion: o.reduce ? 'reduce' : 'no-preference',
  })
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
  return ctx
}

async function toPractice(page: Page) {
  for (let i = 0; i < 400; i++) {
    if (await page.getByText(/^Practice \d+$/).first().isVisible().catch(() => false)) return
    const input = page.locator('form input').first()
    if (await page.getByText('Screen 8 of 9').isVisible().catch(() => false) && await input.isVisible().catch(() => false)) { await input.fill('987654'); await page.locator('button[type=submit]').click({ timeout: 3000 }).catch(() => {}); continue }
    const b = page.getByRole('button', { name: /^(Next|Try a new one)$|Let's see| anyway$/ }).first()
    if (await b.isVisible().catch(() => false)) { await b.click({ timeout: 2000 }).catch(() => {}); continue }
    await page.waitForTimeout(250)
  }
  throw new Error('never reached practice')
}
const onScreen = (page: Page) => page.evaluate(({ kid, topic }) => new Promise<{ asked: number; current: { problem: unknown } } | null>(res => {
  const r = indexedDB.open('milo', 1)
  r.onsuccess = () => { const g = r.result.transaction('kv').objectStore('kv').get(`milo-newflow-run-${kid}-${topic}`); g.onsuccess = () => res(g.result ? JSON.parse(g.result) : null) }
}), { kid: KID, topic: TOPIC })
const rightAnswer = async (page: Page) => String(solutionOf((await onScreen(page))!.current.problem as Problem))
const submit = async (page: Page, v: string) => { await page.locator('form input').first().fill(v); await page.locator('button[type=submit]').click() }
async function answerNotRight(page: Page) {
  await submit(page, '987654'); await submit(page, '987654')
  await page.getByRole('button', { name: 'Next problem' }).click()
}
const dots = (page: Page) => page.getByTestId('set-dots')
const filled = (page: Page) => page.getByTestId('set-dots').locator('[data-filled]').count()
const noSideScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

for (const v of [{ name: 'desktop', phone: false, reduce: false }, { name: 'phone-375', phone: true, reduce: true }]) {
  test(`Q1+Q2 — ${v.name}${v.reduce ? ', reduced motion' : ''}: dots fill, Try again is yellow with ↻, a right answer cheers with ✓`, async ({ browser }) => {
    const ctx = await device(browser, v)
    const page = await ctx.newPage()
    await page.goto(`/lesson?id=${TOPIC}`)
    await toPractice(page)
    await expect(dots(page)).toHaveAttribute('aria-label', '0 questions done in this set')
    await expect(dots(page)).toBeInViewport()

    await submit(page, '987654')
    const status = page.getByRole('status')
    await expect(status).toContainText('Try again!')
    await expect(status).toContainText('↻')
    expect(await status.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(YELLOW)
    expect(await noSideScroll(page)).toBe(true)
    await status.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${SHOTS}/q2-try-again-${v.name}.png` })

    await submit(page, await rightAnswer(page))
    await expect(status).toContainText('✓')
    await expect(status).toHaveText(/^✓(Right!|Nice!|You got it!|Great thinking!)$/)
    expect(await status.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(GREEN_BOX)
    expect(await filled(page)).toBe(1)
    // Reduced motion: the cheer does not pop in (Pictures.tsx cuts every lesson animation to ~0).
    const dur = await status.evaluate(el => parseFloat(getComputedStyle(el).animationDuration))
    if (v.reduce) expect(dur).toBeLessThan(0.01); else expect(dur).toBeGreaterThan(0.1)
    // Seen, not just present: fully opaque once the pop-in ends (and the dot's fill has had its .3s).
    await expect.poll(() => status.evaluate(el => { let o = 1; for (let n: Element | null = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return o })).toBe(1)
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${SHOTS}/q2-cheer-${v.name}.png` })   // already in view: the try-again box's place

    await expect.poll(() => onScreen(page).then(r => r?.asked)).toBe(1)   // moved on by itself
    for (let k = 2; k <= 4; k++) { await answerNotRight(page); expect(await filled(page)).toBe(k) }
    await answerNotRight(page)
    await expect(page.getByRole('dialog')).toContainText('5 questions done!')
    expect(await filled(page)).toBe(5)
    await page.screenshot({ path: `${SHOTS}/q1-checkpoint-${v.name}.png` })
    await page.getByRole('dialog').getByRole('button', { name: 'Keep going' }).click()
    await expect(dots(page)).toHaveAttribute('aria-label', '0 questions done in this set')
    await dots(page).scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${SHOTS}/q1-new-set-${v.name}.png` })
    expect(await page.locator('body').innerText()).not.toMatch(/\b\d+ of \d+\b|\d\s*%|wrong|failed/i)
    await ctx.close()
  })
}
