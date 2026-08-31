/**
 * The two signed-in surfaces this session added, measured at 640×320 — WITHOUT a session.
 *
 * ⚠️⚠️ THE REASON THIS IS NOT `/menu`: the e2e token 401s on `getLearnerBootstrap`, so `/menu`
 * bounces to `/parent` and any spec pointed at it grades the wrong screen — the exact failure
 * `start-card.spec.ts` exists to prevent, one layer up. Until that is fixed, every signed-in
 * surface is unverifiable on screen, so these render in isolation at `/ui-preview` from the same
 * components and the same copy module the real screens use.
 *
 * ⚠️ WHAT THIS CANNOT SEE, said out loud so a green is not read as more than it is: it proves the
 * LAYOUT of a component at a size. It cannot prove the component is reachable, that the menu
 * renders it in the right place, or that the screen around it agrees. Those need the 401 fixed.
 *
 * Three mechanisms, the same ones the directions spec settled on — text equal to its SOURCE (not
 * "contains"), nothing painted over it, nothing clipped or off-frame — plus every control whole,
 * which is the start card's lesson. Run under E2E_WIDE_TEXT=1 too: text is ~5% wider on the CI
 * runner than on a Mac, so a screen that fits here by a few pixels is not a screen that fits.
 */
import { test, expect } from '@playwright/test'
import { CHECK_DOOR, planLine, swapCopy } from '../src/core/planCopy'
import { seedSession, seedLearner } from './session'

const WIDE = process.env.E2E_WIDE_TEXT === '1'

const probe = (want: string) => {
  const all = [...document.querySelectorAll('span,div,button')].filter(e => (e.textContent || '').includes(want))
  const el = all.filter(e => !all.some(o => o !== e && e.contains(o)))[0]
  if (!el) return null
  const r = el.getBoundingClientRect()
  const zOf = (n: Element | null): number => {
    for (let e = n; e; e = e.parentElement) {
      const cs = getComputedStyle(e)
      if (cs.position !== 'static' && cs.zIndex !== 'auto') return Number(cs.zIndex)
    }
    return 0
  }
  const opaque = (cs: CSSStyleDeclaration) => cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && !/rgba\(.*,\s*0\)$/.test(cs.backgroundColor)
  const covering: string[] = []
  for (const o of document.querySelectorAll<HTMLElement>('div,button,span,img')) {
    if (o === el || o.contains(el) || el.contains(o)) continue
    const cs = getComputedStyle(o)
    if (!opaque(cs) || cs.visibility === 'hidden' || cs.opacity === '0') continue
    const b = o.getBoundingClientRect()
    if (!b.width || !b.height) continue
    if (b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top && zOf(o) >= zOf(el))
      covering.push(`${o.tagName}(z${zOf(o)})`)
  }
  const controls = [...document.querySelectorAll('button, a[href]')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.height })
    .map(e => { const q = e.getBoundingClientRect(); return { l: (e.textContent || '').trim().slice(0, 22), gap: Math.round(innerHeight - q.bottom), top: Math.round(q.top) } })
  return {
    rendered: (el.textContent || '').trim(),
    box: [r.x | 0, r.y | 0, r.right | 0, r.bottom | 0],
    coveredBy: covering,
    clipped: el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1,
    offscreen: r.left < 0 || r.right > window.innerWidth || r.top < 0 || r.bottom > window.innerHeight,
    worstControl: controls.reduce((w, c) => (!w || c.gap < w.gap ? c : w), null as null | { l: string; gap: number; top: number }),
  }
}

/**
 * ⚠️⚠️ AND THE REAL SCREEN, WHICH IS REACHABLE AFTER ALL — I HAD THAT WRONG.
 *
 * I reported that `/menu` bounces to `/parent` on the e2e token, and repeated it in a PR body. It
 * does not: that drive seeded the SESSION and not the LEARNER, and `/menu` needs both. With
 * `seedLearner` as well it renders, and the door is on screen. Measured 2026-08-31.
 *
 * What genuinely fails is the RPC behind the plan card: `get_learner_bootstrap` answers **401 — "No
 * suitable key or wrong key type"**, because `session.ts` hand-writes an UNSIGNED token (its own
 * comment says so: supabase-js never verifies a signature client-side, the server does). So this
 * spec can assert the door's layout on the real screen, and nothing that needs server data.
 */
test('the door renders whole on the REAL /menu at 640×320', async ({ page }) => {
  await seedSession(page)
  await seedLearner(page)
  await page.setViewportSize({ width: 640, height: 320 })
  await page.goto('/menu')
  await page.waitForTimeout(4000)
  const m = await page.evaluate(probe, CHECK_DOOR.blurb)
  expect(m, 'the door is not on the real menu — did /menu bounce?').not.toBeNull()
  expect(m!.rendered).toBe(CHECK_DOOR.blurb)
  expect(m!.coveredBy, 'something is painted over the door').toEqual([])
  expect(m!.clipped).toBe(false)
  expect(m!.offscreen).toBe(false)
  console.log(`REALMENU ${JSON.stringify(m)}`)
})

const CASES = [
  { p: 'door', want: CHECK_DOOR.blurb },
  { p: 'swap', want: swapCopy(4, 7).body },
  { p: 'plan', want: planLine('diagnostic', true) },   // the line a returning chapter is explained with
]

for (const c of CASES) {
  test(`${c.p} — renders whole at 640×320${WIDE ? ' (wide text)' : ''}`, async ({ page }) => {
    if (WIDE) await page.addInitScript(() => {
      const css = '*, *::before, *::after { letter-spacing: 0.08em !important }'
      const put = () => document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }))
      if (document.head) put(); else document.addEventListener('DOMContentLoaded', put)
    })
    await page.setViewportSize({ width: 640, height: 320 })
    await page.goto(`/ui-preview?p=${c.p}`)
    await page.waitForTimeout(1200)
    const m = await page.evaluate(probe, c.want)
    expect(m, `${c.p}: nothing on screen carries the words`).not.toBeNull()
    expect(m!.rendered, 'the rendered words are not the source words').toBe(c.want)
    expect(m!.coveredBy, `${c.p}: something is painted over it`).toEqual([])
    expect(m!.clipped, `${c.p}: clipped inside its own box`).toBe(false)
    expect(m!.offscreen, `${c.p}: off frame`).toBe(false)
    // ⚠️ Only where there ARE controls — the plan lines are text, and asserting on a null here
    // would fail about the harness rather than the screen (a red that describes the driver).
    if (m!.worstControl) {
      expect(m!.worstControl.gap, `${c.p}: "${m!.worstControl.l}" is off the bottom`).toBeGreaterThanOrEqual(0)
      expect(m!.worstControl.top, `${c.p}: "${m!.worstControl.l}" is off the top`).toBeGreaterThanOrEqual(0)
    }
    console.log(`SURFACE ${c.p}${WIDE ? '+wide' : ''} ${JSON.stringify(m)}`)
  })
}
