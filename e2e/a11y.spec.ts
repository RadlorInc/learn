/**
 * THE ADA SWEEP THAT NEEDS A BROWSER (2026-09-28, the "$100,000 vibe-coded app" reel: "can't be used with a
 * keyboard, and no alt text"). The two properties that don't need one are `src/__tests__/accessibility.test.ts`.
 *
 *   E2E_BASE_URL=http://localhost:<port> npx playwright test e2e/a11y.spec.ts
 *
 * ⚠️ WHAT THIS DOES NOT COVER: signed-in adult screens (the dashboard needs a backend), and a screen reader
 * driven by a person. axe finds roughly a third of WCAG failures; a clean run is not a compliance claim.
 * ⚠️ No CI job runs Playwright, so this is a re-measure you run, not a gate.
 */
import { test, expect, type Page } from '@playwright/test'
import { createRequire } from 'node:module'
import { seedLearner, seedSession } from './session'

const AXE = createRequire(__filename).resolve('axe-core/axe.min.js')
const PAGES = ['/auth', '/auth?mode=signup', '/help', '/legal/privacy', '/legal/terms', '/modules', '/lesson?id=g3m1-t1', '/consent/respond', '/email/unsubscribe', '/play', '/admin/login']

async function violations(page: Page): Promise<string[]> {
  await page.addScriptTag({ path: AXE })
  return page.evaluate(async () => {
    const r = await (window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string; nodes: { target: string[] }[] }[] }> } })
      .axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, exclude: [['nextjs-portal']] })
    return r.violations.map(v => `${v.id} ×${v.nodes.length} (${v.nodes[0].target.join(' ')})`)
  })
}

test('control: axe in this harness can see a violation', async ({ page }) => {
  await page.goto('/help', { waitUntil: 'networkidle' })
  await page.evaluate(() => { const i = document.createElement('img'); i.src = '/icons/icon-192.png'; document.querySelector('main, body')!.append(i) })
  expect((await violations(page)).some(v => v.startsWith('image-alt'))).toBe(true)
})

for (const path of PAGES) {
  test(`WCAG 2.1 AA (axe) + text fields ≥ 16px: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(path, { waitUntil: 'networkidle' })
    expect(await page.locator('h1, h2, button').count(), 'nothing rendered — axe would pass an empty page').toBeGreaterThan(0)
    expect(await violations(page)).toEqual([])
    // Under 16px, iOS zooms into a field on focus now that zoom is allowed (layout.tsx viewport).
    const small = await page.$$eval('input:not([type=checkbox]):not([type=radio]):not([type=hidden]), select, textarea:not([readonly])',
      els => els.map(e => `${e.outerHTML.slice(0, 60)} ${getComputedStyle(e).fontSize}`).filter(s => parseFloat(s.split(' ').pop()!) < 16))
    expect(small).toEqual([])
  })
}

test('keyboard focus is visible: a ring of at least 2px on a field and on a button', async ({ page }) => {
  await page.goto('/auth', { waitUntil: 'networkidle' })
  const seen = new Set<string>()
  for (let i = 0; i < 12 && seen.size < 2; i++) {
    await page.keyboard.press('Tab')
    const f = await page.evaluate(() => { const e = document.activeElement as HTMLElement; const s = getComputedStyle(e)
      return { tag: e.tagName, ring: s.outlineStyle === 'none' ? 0 : parseFloat(s.outlineWidth) } })
    if (f.tag !== 'INPUT' && f.tag !== 'BUTTON') continue
    expect(f.ring, `${f.tag} has no visible focus ring`).toBeGreaterThanOrEqual(2)
    seen.add(f.tag)
  }
  expect([...seen].sort()).toEqual(['BUTTON', 'INPUT'])
})

test('Rainbow Town (KG colours) can be painted from the keyboard', async ({ page }) => {
  test.setTimeout(120_000)
  await seedSession(page); await seedLearner(page)
  await page.goto('/game?c=colors', { waitUntil: 'networkidle' })
  const name = () => page.evaluate(() => (document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent || '').trim())
  const tabTo = async (re: RegExp) => { for (let i = 0; i < 30; i++) { await page.keyboard.press('Tab'); if (re.test(await name())) return true } return false }
  const cue = () => page.evaluate(() => [...document.querySelectorAll('button')].map(b => b.getAttribute('aria-label') ?? '').find(n => /this one/.test(n)) ?? null)

  expect(await tabTo(/let.s colour/i)).toBe(true); await page.keyboard.press('Enter')
  await expect.poll(cue, { timeout: 30_000 }).not.toBeNull()
  const pot = (await cue())!
  expect(await tabTo(new RegExp(pot.replace(/[()]/g, '.')))).toBe(true); await page.keyboard.press('Enter')
  expect(await tabTo(/paint the glowing part/i), 'the picture is not in the Tab order').toBe(true)
  await page.keyboard.press('Enter')
  // Accepted = the lesson moves its "this one" cue to the NEXT colour (a cue that merely vanished is not that).
  await expect.poll(async () => { const c = await cue(); return c !== null && c !== pot }, { timeout: 10_000 }).toBe(true)
})
