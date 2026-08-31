/**
 * The typed directions line, RENDERED, at 640×320 — on the three chapters a tester's feedback was
 * about and where the first version of the feature failed.
 *
 * ⚠️⚠️ THE FIRST VERSION OF THIS CHECK COULD NOT SEE THE DEFECT IT WAS WRITTEN FOR, AND THAT IS THE
 * lesson worth keeping. Last session's floating strip held the WHOLE hint in the DOM and had the
 * chapter's question pill painted on top of it: on screen it read "Lay blocks to t…", while text
 * equality and every scrollWidth/clientWidth check were clean. **The defect was occlusion, not
 * overflow.** Watched: with last session's exact configuration restored this spec reports
 * `BUTTON(z45) 192,12,447,57` — MeasureIt's own question pill — over the line.
 *
 * So the three assertions are three different mechanisms, and none of them subsumes another:
 *   • `rendered === hint`  — the whole line is in the DOM, not a stale or partial copy
 *   • `coveredBy === []`   — nothing with an opaque background and an equal-or-higher z overlaps it
 *   • `clipped === false`  — it is not ellipsised inside its own box
 *
 * ⚠️ Needs a dev server (`preview_start` → milo-dev, or E2E_BASE_URL). It is not part of `npm test`.
 */
import { test, expect } from '@playwright/test'
import { getChapter, type ChapterType } from '../src/core/chapters'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3017'
const OUT = process.env.SHOT_DIR ?? '.'

// ⚠️ The expected words come from the catalogue, which is where the chapter reads them from — so
// this asserts the RENDERING, not the copy. A wrong or truncated string still fails; a reworded
// hint does not, which is right: the words are a product decision and this is a layout check.
const CASES: Array<{ id: ChapterType; url: string; shot: string; pick?: string }> = [
  // ⚠️ ALL NINE CHAPTERS THAT CARRY THE LINE THEMSELVES, not the three the feedback named. The six
  // added here are the ones whose implementation differs most — SliceShop and TickTock hang it in
  // Milo's BUBBLE (they set `prompt: () => ''`, so there is no pill to put it in) and BlockYard and
  // BuildingBlocks in `yard.tsx`'s shared banner — and the most different implementations are the
  // most likely to break. The other 15 story chapters draw the floating strip and are unchanged.
  { id: 'measurement',      url: '/story?ch=measure&e2e=practice&world=forest', shot: 'measuring.png' },
  { id: 'shapes2d3d',       url: '/story?ch=solids&e2e=practice',               shot: 'shape-studio.png', pick: 'Art Studio' },
  { id: 'compareNumbers',   url: '/story?ch=compare&e2e=practice',              shot: 'seesaw-park.png' },
  { id: 'fractions',        url: '/story?ch=fractions&e2e=practice',            shot: 'slice-shop.png' },
  { id: 'time',             url: '/story?ch=time&e2e=practice',                 shot: 'ticktock.png' },
  { id: 'additionTo100',    url: '/story?ch=add100&e2e=practice',               shot: 'blockyard-add.png' },
  { id: 'subtractionTo100', url: '/story?ch=sub100&e2e=practice',               shot: 'blockyard-sub.png' },
  { id: 'placeValue',       url: '/story?ch=place&e2e=practice',                shot: 'building-blocks.png' },
]

for (const c of CASES) {
  const hint = getChapter(c.id).hint
  test(`${c.id} — directions render in full at 640×320`, async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 320 })
    await page.goto(BASE + c.url)
    if (c.pick) { await page.waitForTimeout(2500); await page.getByText(c.pick, { exact: false }).first().click() }
    await page.waitForTimeout(4000)

    const m = await page.evaluate((hint) => {
      // The DEEPEST element carrying the line — the outer lane/pill also "contains" it.
      const all = [...document.querySelectorAll('span,div,button')].filter(e => e.textContent!.includes(hint))
      const el = all.filter(e => !all.some(o => o !== e && e.contains(o)))[0]
      if (!el) return null
      const r = el.getBoundingClientRect()
      const menu = [...document.querySelectorAll('button')].find(b => /Menu/.test(b.textContent!))!.getBoundingClientRect()

      // ⚠️ THE DEFECT WAS OCCLUSION, NOT OVERFLOW. Last session's strip held the WHOLE string in the
      // DOM and had the chapter's question pill painted on top of it, so it read "Lay blocks to t…"
      // on screen while every scrollWidth/clientWidth check was clean. Text equality cannot see
      // that; this can. Effective z = the z-index of the nearest positioned ancestor that has one.
      const zOf = (n: Element | null): number => {
        for (let e = n; e; e = e.parentElement) {
          const cs = getComputedStyle(e)
          if (cs.position !== 'static' && cs.zIndex !== 'auto') return Number(cs.zIndex)
        }
        return 0
      }
      const opaque = (cs: CSSStyleDeclaration) =>
        cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && !/rgba\(.*,\s*0\)$/.test(cs.backgroundColor)
      const zEl = zOf(el)
      const covering: string[] = []
      for (const o of document.querySelectorAll<HTMLElement>('div,button,span,img,canvas,svg')) {
        if (o === el || o.contains(el) || el.contains(o)) continue          // same stack, not a cover
        const cs = getComputedStyle(o)
        // ⚠️ NOT `position !== 'static'`: the pill that did the covering IS static — it takes its
        // stacking from a positioned ancestor, which is what `zOf` walks to. Filtering on the
        // element's own position skipped the exact element the check exists to find (watched).
        if (!opaque(cs) || cs.visibility === 'hidden' || cs.opacity === '0') continue
        const b = o.getBoundingClientRect()
        if (!b.width || !b.height) continue
        if (b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top && zOf(o) >= zEl)
          covering.push(`${o.tagName}(z${zOf(o)}) ${[b.x | 0, b.y | 0, b.right | 0, b.bottom | 0]}`)
      }
      // ⚠️ AND THE OTHER DIRECTION: the line moving INTO something. Giving four chapters their own
      // line inside a banner makes that banner taller, and the thing under a story chapter's banner
      // is usually a control. A one-directional overlap check would not see that at all.
      const overButtons: string[] = []
      for (const btn of document.querySelectorAll('button')) {
        if (btn.contains(el) || el.contains(btn)) continue
        const b = btn.getBoundingClientRect()
        if (!b.width || !b.height) continue
        if (b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top)
          overButtons.push(`${(btn.getAttribute('aria-label') || btn.textContent || '').trim().slice(0, 18)} ${[b.x | 0, b.y | 0, b.right | 0, b.bottom | 0]}`)
      }
      return {
        rendered: el.textContent!.replace(/^\s*·\s*/, '').trim(),
        overButtons,
        box: [r.x | 0, r.y | 0, r.right | 0, r.bottom | 0],
        coveredBy: covering,
        clipped: el.scrollWidth > el.clientWidth + 1,
        offscreen: r.left < 0 || r.right > window.innerWidth || r.top < 0 || r.bottom > window.innerHeight,
        overMenu: r.left < menu.right && r.top < menu.bottom,
        carrier: el.tagName,
      }
    }, hint)

    expect(m, `${c.id}: nothing on screen carries the directions line`).not.toBeNull()
    // ⚠️ EQUALITY, not "contains": "Lay blocks to t…" contains nothing wrong, it just is not the line.
    expect(m!.rendered).toBe(hint)
    expect(m!.coveredBy, `${c.id}: something is painted over the directions line`).toEqual([])
    expect(m!.clipped, `${c.id}: the line is ellipsised`).toBe(false)
    expect(m!.overButtons, `${c.id}: the directions line is sitting on a control`).toEqual([])
    expect(m!.offscreen).toBe(false)
    expect(m!.overMenu, `${c.id}: the line runs under the ← Menu button`).toBe(false)
    console.log(`RESULT ${c.id} ${JSON.stringify(m)}`)
    await page.screenshot({ path: `${OUT}/${c.shot}` })
  })
}
