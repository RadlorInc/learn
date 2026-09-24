/**
 * REVIEW 1, Q5 IN A REAL BROWSER, ON A FAKE BACKEND (founder, 2026-09-24): Normal / Large / Extra large, the whole
 * screen, per device. Every screen a child or parent reads must still fit a 375 px phone — no sideways scroll — at
 * every size, and the size is on <html> before React runs. The child's "Aa" menu works from the keyboard.
 *
 *   E2E_BASE_URL=http://localhost:3091 npx playwright test e2e/review1-text-size.spec.ts
 * ⚠️ NOTHING LEAVES THE MACHINE. ⚠️ Expected values are written out here.
 */
import { test, expect, type BrowserContext, type Page, type Route } from '@playwright/test'
import { ladderOf } from '../src/features/lessons/ladders'
import { draw, rng } from '../src/features/lessons/adaptive'

const FAKE = 'https://e2e-fake.supabase.co'
const KID = 'e2e-kid'
const SHOTS = 'docs/legal/screenshots/review1'
const TOPIC = 'g5m1-t12'

test.use({ launchOptions: { args: ['--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost'] } })
test.setTimeout(180_000)

async function fake(ctx: BrowserContext) {
  await ctx.route(`${FAKE}/**`, async (route: Route) => {
    const req = route.request(), path = new URL(req.url()).pathname
    const json = (body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    if (path === '/rest/v1/rpc/game_wallet') return json({ balance: 1240, points_per_minute: 8, enabled: true, minutes_per_day: 20, time_zone: 'UTC', minutes_used_today: 0, playing_until: null })
    if (path.startsWith('/auth/v1/user')) return json({ id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'e2e@x.invalid' })
    return json(req.method() === 'GET' ? [] : {})
  })
}

async function device(browser: import('@playwright/test').Browser, o: { w: number; h: number; size?: string }) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h } })
  await fake(ctx)
  const problem = draw(ladderOf(TOPIC)!, 0, rng(9))
  await ctx.addInitScript(({ kid, size }) => {
    if (size) localStorage.setItem('al-text-size', size)
    // What <html> carries when the document is parsed — before React has run at all.
    document.addEventListener('DOMContentLoaded', () => { (window as unknown as { __atParse: string | null }).__atParse = document.documentElement.getAttribute('data-text') })
    const b64 = (x: unknown) => btoa(JSON.stringify(x)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const exp = Math.floor(Date.now() / 1000) + 3600, sub = '00000000-0000-4000-8000-000000000001'
    const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub, role: 'authenticated', exp, aud: 'authenticated' })}.e2e`
    if (!localStorage.getItem('milo-auth')) {
      localStorage.setItem('milo-auth', JSON.stringify({ access_token: jwt, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: exp,
        user: { id: sub, aud: 'authenticated', role: 'authenticated', email: 'e2e@x.invalid', app_metadata: {}, user_metadata: {}, created_at: new Date(0).toISOString() } }))
    }
    sessionStorage.setItem('milo_active_learner', JSON.stringify({ id: kid, display_name: 'Ava', name: 'Ava', age_group: '9-11', lesson_ids: null, lesson_due: null }))
  }, { kid: KID, size: o.size ?? null })
  // A saved run, so practice is one tap away ("Keep practicing").
  const p = await ctx.newPage()
  await p.goto('/llms.txt')
  await p.evaluate(({ kid, topic, run }) => new Promise<void>(res => {
    const r = indexedDB.open('milo', 1)
    r.onupgradeneeded = () => r.result.createObjectStore('kv')
    r.onsuccess = () => { const tx = r.result.transaction('kv', 'readwrite'); tx.objectStore('kv').put(JSON.stringify(run), `milo-newflow-run-${kid}-${topic}`); tx.oncomplete = () => { r.result.close(); res() } }
  }), { kid: KID, topic: TOPIC, run: { asked: 2, recent: [problem.text], current: { problem, from: TOPIC }, review: null } })
  await p.close()
  return ctx
}
/**
 * What does not fit: the page scrolls sideways, OR a button/link/field is outside the page's width. ⚠️ The second
 * half is the one that matters — the lesson shell CLIPS its overflow, so a control pushed off the right edge never makes
 * the page scroll; a scroll-only check passed while "Aa" was invisible at 375 px (found by looking at the screenshot).
 * Compared against <html>'s own box and every ancestor that hides overflow, in the same (zoomed) coordinates.
 */
const misfits = (page: Page) => page.evaluate(() => {
  const out: string[] = []
  window.scrollTo(99999, window.scrollY); if (window.scrollX !== 0) out.push('page scrolls sideways'); window.scrollTo(0, window.scrollY)
  const box = document.documentElement.getBoundingClientRect()
  for (const el of document.querySelectorAll<HTMLElement>('a, button, summary, input, select, textarea')) {
    const r = el.getBoundingClientRect()
    if (!el.checkVisibility() || r.width === 0 || r.height === 0 || el.closest('nextjs-portal')) continue
    const name = `${el.tagName} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}"`
    if (r.left < box.left - 1 || r.right > box.right + 1) { out.push(`${name} ${Math.round(r.left)}–${Math.round(r.right)} of ${Math.round(box.right)}`); continue }
    // …and not cut by a box that hides its overflow (a scrolling box is fine: its content is reachable).
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const o = getComputedStyle(a).overflowX
      if (o !== 'hidden' && o !== 'clip') continue
      const c = a.getBoundingClientRect()
      if (r.left < c.left - 1 || r.right > c.right + 1) { out.push(`${name} ${Math.round(r.left)}–${Math.round(r.right)}, cut by a ${a.tagName} ending at ${Math.round(c.right)}`); break }
    }
  }
  return out
})

const SCREENS: [string, string, (p: Page) => Promise<void>][] = [
  ['home', '/modules?grade=5', async p => { await expect(p.getByRole('heading', { level: 1 })).toBeVisible() }],
  ['topic-map', '/lesson?module=g5m1', async p => { await expect(p.getByText(/of \d+ done/)).toBeVisible() }],
  ['teaching-screen', '/lesson?id=g5m1-t1', async p => { await expect(p.getByText('Screen 1 of 9')).toBeVisible() }],
  ['module-practice', '/practice?module=g5m1', async p => { await expect(p.getByRole('button', { name: 'Check' })).toBeVisible() }],
  ['practice', `/lesson?id=${TOPIC}`, async p => { await p.getByRole('button', { name: 'Keep practicing' }).click(); await expect(p.getByRole('button', { name: 'Check' })).toBeVisible() }],
  ['parent-progress', '/ui-preview?p=child&tab=progress', async p => { await expect(p.getByText('Topics mastered')).toBeVisible() }],
  ['cookies-page', '/legal/cookies', async p => { await expect(p.getByRole('heading', { level: 1 })).toBeVisible() }],
]

for (const size of ['normal', 'large', 'xl']) {
  test(`Q5 — 375 px at ${size}: every screen fits the width; the size is on <html> before React`, async ({ browser }) => {
    const ctx = await device(browser, { w: 375, h: 812, size: size === 'normal' ? undefined : size })
    const page = await ctx.newPage()
    const bad: string[] = []
    for (const [name, url, ready] of SCREENS) {
      await page.goto(url)
      await ready(page)
      expect(await page.evaluate(() => (window as unknown as { __atParse: string | null }).__atParse)).toBe(size === 'normal' ? null : size)
      bad.push(...(await misfits(page)).map(m => `${name}: ${m}`))
      if (size !== 'large') await page.screenshot({ path: `${SHOTS}/q5-${size}-${name}-375.png` })
    }
    expect(bad, 'what does not fit the width').toEqual([])
    await ctx.close()
  })
}

test('Q5 — the child\'s "Aa" menu from the keyboard: open, choose Extra large, the page grows; back to Normal', async ({ browser }) => {
  const ctx = await device(browser, { w: 1280, h: 820 })
  const page = await ctx.newPage()
  await page.goto('/modules?grade=5')
  const aa = page.getByRole('group', { name: 'Text size' })
  const summary = page.locator('summary[aria-label="Text size"]')
  await summary.focus()
  await page.keyboard.press('Enter')
  await expect(aa).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/q5-aa-menu-desktop.png` })
  await aa.getByRole('button', { name: 'Extra large' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-text', 'xl')
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).zoom)).toBe('1.3')
  await expect(aa.getByRole('button', { name: /Extra large/ })).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-text', 'xl')        // kept on this device
  await page.locator('summary[aria-label="Text size"]').click()
  await page.getByRole('group', { name: 'Text size' }).getByRole('button', { name: 'Normal' }).click()
  await expect(page.locator('html')).not.toHaveAttribute('data-text', /.+/)
  expect(await page.evaluate(() => localStorage.getItem('al-text-size'))).toBeNull()
  await ctx.close()
})
