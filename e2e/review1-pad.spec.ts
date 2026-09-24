/**
 * REVIEW 1, Q6 IN A REAL BROWSER, ON A FAKE BACKEND (founder, 2026-09-24): the scratch pad's colours, Arrow and Undo,
 * drawn with a real mouse and read back from the canvas's own pixels.
 *
 *   E2E_BASE_URL=http://localhost:3092 npx playwright test e2e/review1-pad.spec.ts
 * ⚠️ NOTHING LEAVES THE MACHINE. ⚠️ Colours are written out here.
 */
import { test, expect, type BrowserContext, type Page, type Route } from '@playwright/test'
import { ladderOf } from '../src/features/lessons/ladders'
import { draw, rng } from '../src/features/lessons/adaptive'

const FAKE = 'https://e2e-fake.supabase.co'
const KID = 'e2e-kid', TOPIC = 'g5m1-t12'
const SHOTS = 'docs/legal/screenshots/review1'
const BLUE = [0x1d, 0x63, 0xc9], ORANGE = [0xd9, 0x48, 0x0f]

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

/** How many pixels on the pad are (close to) this colour — read from the canvas itself. */
const count = (page: Page, rgb: number[]) => page.locator('canvas').evaluate((c: HTMLCanvasElement, want) => {
  const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
  let n = 0
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && Math.abs(d[i] - want[0]) < 30 && Math.abs(d[i + 1] - want[1]) < 30 && Math.abs(d[i + 2] - want[2]) < 30) n++
  return n
}, rgb)
async function stroke(page: Page, from: [number, number], to: [number, number]) {
  const box = (await page.locator('canvas').boundingBox())!
  await page.mouse.move(box.x + from[0] * box.width, box.y + from[1] * box.height)
  await page.mouse.down()
  for (let k = 1; k <= 8; k++) await page.mouse.move(box.x + (from[0] + (to[0] - from[0]) * k / 8) * box.width, box.y + (from[1] + (to[1] - from[1]) * k / 8 + (k % 2 ? 0.03 : 0)) * box.height)
  await page.mouse.up()
}

for (const v of [{ name: 'desktop', w: 1280, h: 820 }, { name: 'phone-375', w: 375, h: 812, reduce: true }]) {
  test(`Q6 — ${v.name}: a blue line, an orange arrow, Undo, Clear and Undo again`, async ({ browser }) => {
    const ctx = await device(browser, v)
    const page = await ctx.newPage()
    await page.goto(`/lesson?id=${TOPIC}`)
    await page.getByRole('button', { name: 'Keep practicing' }).click()
    await page.locator('canvas').scrollIntoViewIfNeeded()
    expect(await count(page, BLUE)).toBe(0)

    await page.getByRole('button', { name: 'Blue' }).click()
    await expect(page.getByRole('button', { name: 'Blue' })).toHaveAttribute('aria-pressed', 'true')
    await stroke(page, [0.1, 0.2], [0.8, 0.25])
    const blue = await count(page, BLUE)
    expect(blue).toBeGreaterThan(50)

    await page.getByRole('button', { name: /Arrow/ }).click()
    await page.getByRole('button', { name: 'Orange' }).click()
    await stroke(page, [0.2, 0.7], [0.7, 0.5])
    expect(await count(page, ORANGE)).toBeGreaterThan(50)
    await page.getByRole('button', { name: /Undo/ }).scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${SHOTS}/q6-pad-${v.name}.png` })

    await page.getByRole('button', { name: /Undo/ }).click()
    expect(await count(page, ORANGE)).toBe(0)
    expect(await count(page, BLUE)).toBe(blue)
    await page.getByRole('button', { name: 'Clear pad' }).click()
    expect(await count(page, BLUE)).toBe(0)
    await page.getByRole('button', { name: /Undo/ }).click()
    expect(await count(page, BLUE)).toBe(blue)
    await ctx.close()
  })
}
