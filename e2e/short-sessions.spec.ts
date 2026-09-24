/**
 * SHORT SESSIONS + THE PREREQUISITE NUDGE, END TO END ON A FAKE BACKEND (S5, 2026-09-24).
 *
 *   npm run dev -- -p 3071   (with .env.local pointing Supabase at https://e2e-fake.supabase.co)
 *   E2E_BASE_URL=http://localhost:3071 npx playwright test e2e/short-sessions.spec.ts
 *
 * ⚠️ NOTHING LEAVES THE MACHINE. Every call to the fake Supabase host is answered here, and Chromium maps every other
 * hostname to NOTFOUND, so a request this file forgot to fake fails instead of reaching a real server (the lesson of
 * the rename round: `page.route` alone did not stop a followed redirect).
 * ⚠️ Expected lines are written out, never imported from the app.
 * Screenshots → docs/legal/screenshots/short-sessions/.
 */
import { test, expect, type BrowserContext, type Page, type Route } from '@playwright/test'
import { readFileSync } from 'node:fs'

const FAKE = 'https://e2e-fake.supabase.co'
const KID = 'e2e-kid'
const TOPIC = 'g5m1-t12', NEXT_TITLE = 'Divide by multiples of 10'
const PREV = 'g5m1-t11', PREV_TITLE = 'Multiply two big numbers'   // a 5-level ladder: level 2 = 0.4, level 3 = 0.6
const SHOTS = 'docs/legal/screenshots/short-sessions'

test.use({ launchOptions: { args: ['--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost'] } })
test.describe.configure({ mode: 'serial' })
// Walking the 9 teaching screens and 15 answers takes minutes; Playwright's default is one.
test.setTimeout(300_000)

/** The fake: what the app wrote, and what it reads back. */
const server = {
  offline: false,
  runs: [] as { lesson: string; run: { asked: number; current: { problem: { text: string } } } }[],
  progress: new Map<string, Record<string, unknown>>(),
  events: [] as { event: string; props: Record<string, unknown> }[],
}

async function fake(ctx: BrowserContext) {
  await ctx.route(`${FAKE}/**`, async (route: Route) => {
    if (server.offline) return route.abort('internetdisconnected')
    const req = route.request(), url = new URL(req.url()), path = url.pathname
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    const body = () => (req.postData() ? JSON.parse(req.postData()!) : {})
    if (path === '/rest/v1/rpc/save_practice_run') { const b = body(); server.runs.push({ lesson: b.p_lesson, run: b.p_run }); return json({ ok: true }) }
    if (path === '/rest/v1/rpc/record_lesson_progress') {
      const b = body(), row = server.progress.get(b.p_lesson) ?? {}
      server.progress.set(b.p_lesson, { ...row, lesson_id: b.p_lesson, done: !!(b.p_done || row.done), level: b.p_level, streak: b.p_streak, mastered: b.p_mastered })
      return json({ ok: true, earned: 0, balance: 0 })
    }
    if (path === '/rest/v1/lesson_progress') {
      const last = new Map(server.runs.map(r => [r.lesson, r.run]))
      const ids = new Set([...server.progress.keys(), ...last.keys()])
      return json([...ids].map(id => ({ lesson_id: id, done: false, level: 0, streak: 0, mastered: false, ...server.progress.get(id), run: last.get(id) ?? null })))
    }
    if (path === '/rest/v1/learner_events' && req.method() === 'POST') { for (const e of [body()].flat()) server.events.push(e); return json([], 201) }
    if (path === '/rest/v1/learner_events') return json(server.events.map((e, i) => ({ props: e.props, created_at: new Date(Date.now() - i * 60_000).toISOString() })))
    if (path === '/rest/v1/point_events') return json([{ lesson_id: TOPIC, reason: 'problem', points: 1, created_at: new Date().toISOString() }])
    if (path === '/rest/v1/rpc/game_wallet') return json({ balance: 40, points_per_minute: 8, enabled: true, minutes_per_day: 20, time_zone: 'UTC', minutes_used_today: 0, playing_until: null })
    if (path.startsWith('/auth/v1/user')) return json({ id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'e2e@x.invalid' })
    return json(req.method() === 'GET' ? [] : {})
  })
}

/** A signed-in child on a fresh device; `kv` seeds the device store (moved into IndexedDB on first load). */
async function device(browser: import('@playwright/test').Browser, o: { kv?: Record<string, unknown>; lessonIds?: string[] | null; due?: Record<string, string> | null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 820 } })
  await fake(ctx)
  await ctx.addInitScript(({ kid, lessonIds, due }) => {
    const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const exp = Math.floor(Date.now() / 1000) + 3600, sub = '00000000-0000-4000-8000-000000000001'
    const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub, role: 'authenticated', exp, aud: 'authenticated' })}.e2e`
    if (!localStorage.getItem('milo-auth')) {
      localStorage.setItem('milo-auth', JSON.stringify({ access_token: jwt, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: exp,
        user: { id: sub, aud: 'authenticated', role: 'authenticated', email: 'e2e@x.invalid', app_metadata: {}, user_metadata: {}, created_at: new Date(0).toISOString() } }))
    }
    sessionStorage.setItem('milo_active_learner', JSON.stringify({ id: kid, display_name: 'Ava', name: 'Ava', age_group: '9-11', lesson_ids: lessonIds, lesson_due: due }))
  }, { kid: KID, lessonIds: o.lessonIds ?? null, due: o.due ?? null })
  // The device store is IndexedDB (`milo` / `kv`); lesson keys are not among the localStorage keys it migrates, so it is
  // seeded directly, from a same-origin page, before the app first loads.
  if (o.kv && Object.keys(o.kv).length) {
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
  }
  return ctx
}
const standing = (level: number) => ({ level, streak: 0, mastered: false })

/** From wherever the lesson starts to practice question 1, never answering right (Screen 8 → worked → twin → worked). */
async function toPractice(page: Page) {
  for (let i = 0; i < 400; i++) {
    if (await page.getByText(/^Practice \d+$/).first().isVisible().catch(() => false)) return
    const input = page.locator('form input').first()
    // Only on Screen 8: typing on practice question 1 here would spend it before the test starts counting.
    if (await page.getByText('Screen 8 of 9').isVisible().catch(() => false) && await input.isVisible().catch(() => false)) { await input.fill('987654'); await page.locator('button[type=submit]').click({ timeout: 3000 }).catch(() => {}); continue }
    const b = page.getByRole('button', { name: /^(Next|Try a new one)$|Let's see/ }).first()
    // A teaching screen animates and moves on by itself, so its button can move or go: try, never wait on it.
    if (await b.isVisible().catch(() => false)) { await b.click({ timeout: 2000 }).catch(() => {}); continue }
    await page.waitForTimeout(250)
  }
  throw new Error('never reached practice')
}
/** Two misses, the worked steps, next — never right, so the ladder never climbs. */
async function answerNotRight(page: Page) {
  for (let k = 0; k < 2; k++) { await page.locator('form input').first().fill('987654'); await page.locator('button[type=submit]').click() }
  await page.getByRole('button', { name: 'Next problem' }).click()
}
/** The run the device holds, straight out of IndexedDB. */
const deviceRun = (page: Page) => page.evaluate(({ kid, topic }) => new Promise<{ asked: number; current: { problem: { text: string } } } | null>(res => {
  const r = indexedDB.open('milo', 1)
  r.onsuccess = () => { const g = r.result.transaction('kv').objectStore('kv').get(`milo-newflow-run-${kid}-${topic}`); g.onsuccess = () => res(g.result ? JSON.parse(g.result) : null) }
}), { kid: KID, topic: TOPIC })

test('Part A — 5 → checkpoint, Keep going → 10 → checkpoint, Take a break → celebrate; home says Keep practicing', async ({ browser }) => {
  const ctx = await device(browser, { kv: { [`milo-newflow-standing-${KID}-${PREV}`]: standing(4) } })
  const page = await ctx.newPage()
  await page.goto(`/lesson?id=${TOPIC}`)
  await toPractice(page)
  for (let k = 1; k <= 4; k++) { await answerNotRight(page); await expect(page.getByRole('dialog')).toHaveCount(0) }
  await answerNotRight(page)
  await expect(page.getByRole('dialog')).toContainText('5 questions done! ⭐ Nice work.')
  await page.screenshot({ path: `${SHOTS}/01-checkpoint.png` })
  await page.getByRole('dialog').getByRole('button', { name: 'Keep going' }).click()
  for (let k = 6; k <= 9; k++) { await answerNotRight(page); await expect(page.getByRole('dialog')).toHaveCount(0) }
  await answerNotRight(page)
  await expect(page.getByRole('dialog')).toContainText('5 questions done! ⭐ Nice work.')
  await page.getByRole('dialog').getByRole('button', { name: 'Take a break' }).click()
  await expect(page.getByText('Great work, 10 questions done! ⭐')).toBeVisible()
  await expect(page.getByText('Your spot is saved.')).toBeVisible()
  await expect(page.getByText('+10 points')).toBeVisible()
  // Visible to a child, not just present: once its pop-in ends, the points line is fully opaque.
  await expect.poll(() => page.getByText('+10 points').evaluate(el => {
    let o = 1; for (let n: Element | null = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity)
    return o
  })).toBe(1)
  expect(await page.locator('body').innerText()).not.toMatch(/\b\d+ of 10\b|%|incomplete|not completed/i)
  await page.screenshot({ path: `${SHOTS}/02-break.png` })
  expect((await deviceRun(page))?.asked).toBe(10)
  await expect.poll(() => server.runs.filter(r => r.lesson === TOPIC).at(-1)?.run.asked).toBe(10)   // and on the account

  await page.getByRole('button', { name: 'Back to topics' }).click()
  await expect(page.getByText('⭐ Keep practicing')).toBeVisible()
  await page.getByText('⭐ Keep practicing').scrollIntoViewIfNeeded()   // the map scrolls sideways: show the topic itself
  await expect(page.getByText('⭐ Keep practicing')).toBeInViewport()
  await page.screenshot({ path: `${SHOTS}/03-home-after-break.png` })
  await ctx.close()
})

test('Part A — reopen: Welcome back, the same problem, nothing asked again; close mid-round, offline, resume counts on', async ({ browser }) => {
  // A second device: nothing on it but the account. The home's pull brings the run down.
  const ctx = await device(browser, { kv: { [`milo-newflow-standing-${KID}-${PREV}`]: standing(4) } })
  let page = await ctx.newPage()
  await page.goto('/modules?grade=5')
  await expect.poll(() => deviceRun(page).then(r => r?.asked ?? 0), { timeout: 20_000 }).toBe(10)
  const onAccount = server.runs.filter(r => r.lesson === TOPIC).at(-1)!.run
  const askedBefore = new Set(server.runs.filter(r => r.lesson === TOPIC).slice(0, -1).map(r => r.run.current.problem.text))

  await page.goto(`/lesson?id=${TOPIC}`)
  await expect(page.getByRole('heading', { name: 'Welcome back! ⭐' })).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/04-welcome-back.png` })
  await page.getByRole('button', { name: 'Keep practicing' }).click()
  await expect(page.getByText(onAccount.current.problem.text, { exact: false }).first()).toBeVisible()   // exactly where they stopped
  expect(askedBefore.has(onAccount.current.problem.text)).toBe(false)                                     // …and not a repeat

  // Offline for two answers, then the tab is closed mid-round.
  server.offline = true
  await answerNotRight(page); await answerNotRight(page)
  const onScreen = (await deviceRun(page))!
  expect(onScreen.asked).toBe(12)
  await page.close()
  server.offline = false

  page = await ctx.newPage()
  await page.goto(`/lesson?id=${TOPIC}`)
  await page.getByRole('button', { name: 'Keep practicing' }).click()
  await expect(page.getByText(onScreen.current.problem.text, { exact: false }).first()).toBeVisible()
  await answerNotRight(page); await answerNotRight(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)                                                   // 13, 14
  await answerNotRight(page)
  await expect(page.getByRole('dialog')).toContainText('5 questions done! ⭐ Nice work.')                // 15: the count carried over
  // The offline answers' uploads went up once the connection came back.
  await expect.poll(() => server.runs.filter(r => r.lesson === TOPIC).at(-1)?.run.asked).toBe(15)
  await ctx.close()
})

test('Part B — under halfway: the card, a bar and no number; "anyway" in one tap; not again today', async ({ browser }) => {
  const ctx = await device(browser, { kv: { [`milo-newflow-standing-${KID}-${PREV}`]: standing(2) } })
  const page = await ctx.newPage()
  await page.goto(`/lesson?id=${TOPIC}`)
  await expect(page.getByText(`You're on your way with ${PREV_TITLE}! ⭐ Getting a bit further there (past halfway) will make ${NEXT_TITLE} easier.`)).toBeVisible()
  await expect(page.getByRole('img', { name: `How far you are with ${PREV_TITLE}` })).toBeVisible()
  expect(await page.locator('body').innerText()).not.toMatch(/\d\s*%|locked|failed/i)
  await page.screenshot({ path: `${SHOTS}/05-nudge.png` })
  await page.getByRole('button', { name: `Go to ${NEXT_TITLE} anyway` }).click()
  await expect(page.getByText('Screen 1 of 9')).toBeVisible()
  expect(server.events, 'option (a): no event is written for the nudge').toEqual([])
  await page.reload()
  await expect(page.getByText('Screen 1 of 9')).toBeVisible()
  await expect(page.getByText("You're on your way with")).toHaveCount(0)
  await ctx.close()
})

test('Part B — no card at halfway or past it, and none for an assigned (due-dated) topic', async ({ browser }) => {
  for (const o of [{ kv: { [`milo-newflow-standing-${KID}-${PREV}`]: standing(3) } }, { lessonIds: [PREV, TOPIC], due: { [TOPIC]: '2026-10-01' } }]) {
    const ctx = await device(browser, o)
    const page = await ctx.newPage()
    await page.goto(`/lesson?id=${TOPIC}`)
    await expect(page.getByText('Screen 1 of 9')).toBeVisible()          // control: the page rendered the lesson itself
    await expect(page.getByText("You're on your way with")).toHaveCount(0)
    await ctx.close()
  }
})

test('the parent sees real progress, calmly — and the going-ahead line, read from progress alone', async ({ browser }) => {
  // /ui-preview's demo child has a chosen list: g5m1-t1, g5m1-t2, g5m1-t3, g4m2-t1. On it, g5m1-t2 is started while
  // g5m1-t1 is at level 1 of 5 — under halfway → a line. Off it, g5m1-t12/-t11 (started, under halfway) → NO line: a
  // previous topic outside the list is not on the child's map. No event exists for either.
  server.events.length = 0
  server.progress.set(PREV, { lesson_id: PREV, done: false, level: 1, streak: 0, mastered: false })
  server.progress.set('g5m1-t1', { lesson_id: 'g5m1-t1', done: false, level: 1, streak: 0, mastered: false })
  server.progress.set('g5m1-t2', { lesson_id: 'g5m1-t2', done: false, level: 0, streak: 0, mastered: false })
  server.progress.set('g5m1-t13', { lesson_id: 'g5m1-t13', done: false, level: 1, streak: 0, mastered: false })
  const ctx = await device(browser)
  const page = await ctx.newPage()
  await page.goto('/ui-preview?p=child&tab=progress')
  await expect(page.getByText('Topics in progress')).toBeVisible()
  // g5m1-t1, -t2, -t11, -t13 started and not done → 4 in progress; g5m1-t12 is done (12 answers).
  await expect(page.getByText('Topics in progress').locator('xpath=..')).toContainText('4')
  await expect(page.getByText('Aarav started “Multiply and divide by 10, 100, 1,000” before getting far with “Relate place value neighbors”.')).toBeVisible()
  await expect(page.getByText(`Aarav started “${NEXT_TITLE}”`)).toHaveCount(0)
  await page.screenshot({ path: `${SHOTS}/06-parent-progress.png`, fullPage: true })
  await ctx.close()
})

test('signed out: the device keeps exactly what the published doc 08 says', async ({ browser }) => {
  const doc = readFileSync('docs/legal/08-cookie-and-tracking-notice.md', 'utf8').split('\n').find(l => l.startsWith('**If you are not signed in'))!
  const named = [...doc.matchAll(/`([^`]+)`/g)].map(m => m[1])
  const matches = (k: string) => named.some(n => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('<topic>', '[a-z0-9-]+')}$`).test(k))
  const ctx = await browser.newContext()
  await fake(ctx)
  const page = await ctx.newPage()
  await page.goto(`/lesson?id=${TOPIC}`)
  await toPractice(page)
  for (let n = 1; n <= 12; n++) { await answerNotRight(page); const d = page.getByRole('dialog'); if (await d.isVisible().catch(() => false)) await d.getByRole('button', { name: 'Keep going' }).click() }
  const idb = await page.evaluate(() => new Promise<string[]>(res => { const r = indexedDB.open('milo', 1); r.onsuccess = () => { const g = r.result.transaction('kv').objectStore('kv').getAllKeys(); g.onsuccess = () => res(g.result.map(String)) } }))
  const ls = await page.evaluate(() => Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!))
  const ss = await page.evaluate(() => sessionStorage.length)
  expect(idb.length, 'control: the device store holds something to compare').toBeGreaterThan(0)
  expect([...idb, ...ls].filter(k => !matches(k)), 'kept on the device but not on the published page').toEqual([])
  expect(named.filter(n => n.includes('<topic>')).filter(n => !idb.some(k => matches(k) && new RegExp(n.replace('<topic>', '')).test(k))), 'on the page but not kept').toEqual([])
  expect(ss).toBe(0)
  expect(await ctx.cookies()).toEqual([])
  await ctx.close()
})

test('Part B — a chosen list with no due dates is not an assignment: the card shows', async ({ browser }) => {
  const ctx = await device(browser, { lessonIds: [PREV, TOPIC], kv: { [`milo-newflow-standing-${KID}-${PREV}`]: standing(0) } })
  const page = await ctx.newPage()
  await page.goto(`/lesson?id=${TOPIC}`)
  await expect(page.getByText(`You're on your way with ${PREV_TITLE}!`, { exact: false })).toBeVisible()
  await ctx.close()
})
