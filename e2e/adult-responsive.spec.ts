import { test, expect } from '@playwright/test'

/**
 * THE ADULT SURFACE AT EVERY WIDTH — /auth, /auth/set-password AND THE FOUR PARENT SCREENS.
 *
 * ⚠️ WHY THIS EXISTS. Until 2026-09-10 these three files contained **zero media queries** and were
 * capped at `maxWidth: 380/480`, so a 1280px laptop rendered a phone column with ~800px of empty
 * paper either side, and the add-learner form was a bottom sheet flush against the bottom edge of
 * a mostly-empty screen. Nothing could see it: `tsc`, the build and 1837 unit tests all pass on a
 * layout nobody has looked at, and the four parent screens are not reachable from a harness at all
 * (see below). The whole claim of that change is a claim about GEOMETRY at a WIDTH, which is
 * exactly the thing only a driven browser can settle.
 *
 * ⚠️ WHAT IT CANNOT SEE, STATED BECAUSE A GREEN HERE MUST NOT BE READ AS MORE THAN IT IS.
 * The role picker, the empty dashboard and the add-learner sheet are driven through `/ui-preview`,
 * which mounts the REAL components (imported, never a second copy of the markup) but says nothing
 * about whether the screens are REACHABLE, or whether the dashboard around them agrees. A planted
 * JWT does not get you the real thing — the RLS reads 401 and `/parent` renders its loadError
 * branch, which is this repo's own "a check pointed at a world where the bug cannot occur".
 * ⚠️ And `?p=cols` is the `.dash-cols` CLASS with placeholder children, NOT the dashboard: it
 * catches the breakpoint regressing and cannot catch the dashboard stopping using the class.
 *
 * ⚠️ The breakpoints are written out HERE, by hand, and deliberately not imported from globals.css.
 * A check that reads its expectation out of the thing under test passes because the code equals
 * itself (CLAUDE.md's tautological-check row). Changing a breakpoint is meant to take two edits,
 * and the failing test in between is the reminder that a layout boundary is a decision.
 */

/** 390×844 iPhone-ish · 768×1024 tablet · 1280×860 laptop. */
const SIZES = [
  { w: 390,  h: 844,  name: 'phone'  },
  { w: 768,  h: 1024, name: 'tablet' },
  { w: 1280, h: 860,  name: 'laptop' },
] as const

const PAGES = [
  { url: '/auth',                 name: 'sign-in' },
  { url: '/auth/set-password',    name: 'set-password (dead link)' },
  { url: '/ui-preview?p=role',    name: 'role picker' },
  { url: '/ui-preview?p=empty',   name: 'empty dashboard' },
  { url: '/ui-preview?p=sheet',   name: 'add learner' },
  { url: '/ui-preview?p=cols',    name: 'dashboard grid' },
  { url: '/ui-preview?p=cards',   name: 'card grid' },
  // ⚠️ ONLY THE THREE OF THE SIX REMAINING ADULT PAGES THAT A HARNESS CAN ACTUALLY REACH.
  // /parent/grades and /parent/grades/triage bounce to /auth on `!user`, and /parent/invites sits
  // on its loading splash for ever when the reads fail (it has no loadError branch, unlike
  // /parent) — a planted JWT is refused by `getCurrentSession`, so none of the three renders.
  // Their restyle is source-verified, NOT driven, and this list is where that shows.
  { url: '/help',                 name: 'help' },
  { url: '/parent/plan',          name: 'pricing' },
  { url: '/parent/account',       name: 'close account' },
] as const

/** How many CSS px the document overflows its own viewport horizontally. */
async function hOverflow(page: import('@playwright/test').Page) {
  return page.evaluate(() =>
    Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth)
}

for (const size of SIZES) {
  for (const p of PAGES) {
    test(`${p.name} @ ${size.w} — no horizontal overflow, nothing off the right edge`, async ({ page }) => {
      await page.setViewportSize({ width: size.w, height: size.h })
      await page.goto(p.url)
      await page.waitForLoadState('networkidle').catch(() => {})
      await page.waitForTimeout(900)          // fonts + the set-password token round trip

      expect(await hOverflow(page), `${p.name} @${size.w} scrolls sideways`).toBeLessThanOrEqual(0)

      /**
       * ⚠️ `position: fixed` IS EXEMPT AND THAT IS NOT A LOOPHOLE — the sheet overlay is
       * deliberately full-bleed (`inset: 0`), so it is exactly as wide as the viewport and a
       * `right > w` test on it reports the design working as a defect. Every element that decides
       * this page's WIDTH is in flow.
       */
      const escaped = await page.evaluate(w => [...document.querySelectorAll('*')]
        .filter(el => {
          const r = el.getBoundingClientRect()
          if (!r.width || !r.height) return false
          if (getComputedStyle(el).position === 'fixed') return false
          return r.right > w + 1 || r.left < -1
        })
        .slice(0, 4)
        .map(el => `${el.tagName}#${el.id || '-'} right=${Math.round(el.getBoundingClientRect().right)}`), size.w)

      expect(escaped, `${p.name} @${size.w}: elements past the frame`).toEqual([])
    })
  }
}

test('the sign-in split is one column on a phone and two on a laptop', async ({ page }) => {
  // 900px is this layout's own boundary: below it the marketing panel carries nothing the form
  // needs, so it is the half that goes rather than the half that squeezes.
  await page.setViewportSize({ width: 899, height: 860 })
  await page.goto('/auth')
  await expect(page.locator('.adult-split')).toBeVisible()
  const narrow = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector('.adult-split')!)
    const a = getComputedStyle(document.querySelector('.adult-aside')!)
    return { cols: s.gridTemplateColumns.split(' ').length, asideShown: a.display !== 'none' }
  })
  expect(narrow.cols).toBe(1)
  expect(narrow.asideShown).toBe(false)

  await page.setViewportSize({ width: 900, height: 860 })
  await page.waitForTimeout(300)
  const wide = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector('.adult-split')!)
    const a = getComputedStyle(document.querySelector('.adult-aside')!)
    return { cols: s.gridTemplateColumns.split(' ').length, asideShown: a.display !== 'none' }
  })
  expect(wide.cols).toBe(2)
  expect(wide.asideShown).toBe(true)
})

test('the dashboard grid is one column below 1024 and two at 1024', async ({ page }) => {
  await page.goto('/ui-preview?p=cols')

  await page.setViewportSize({ width: 1023, height: 860 })
  await page.waitForTimeout(300)
  expect(await page.evaluate(() =>
    getComputedStyle(document.querySelector('.dash-cols')!).gridTemplateColumns.split(' ').length)).toBe(1)

  await page.setViewportSize({ width: 1024, height: 860 })
  await page.waitForTimeout(300)
  expect(await page.evaluate(() =>
    getComputedStyle(document.querySelector('.dash-cols')!).gridTemplateColumns.split(' ').length)).toBe(2)
})

test('the shell stops being a phone column on a laptop', async ({ page }) => {
  // The regression this names: a `maxWidth: 480` that survives a redesign. 480 is the old cap, so
  // the assertion is written against IT rather than against whatever the CSS currently says.
  await page.setViewportSize({ width: 1280, height: 860 })
  await page.goto('/ui-preview?p=cols')
  const width = await page.evaluate(() =>
    Math.round(document.querySelector('.adult-shell')!.getBoundingClientRect().width))
  expect(width, 'the adult shell is still capped at a phone width on a 1280px frame').toBeGreaterThan(700)
})

test('the add-learner form is a bottom sheet on a phone and a centred dialog on a laptop', async ({ page }) => {
  await page.goto('/ui-preview?p=sheet')

  // A bottom sheet has square bottom corners (it is flush with the bottom edge) and sits at the
  // bottom of its overlay. That pair is what makes it a SHEET rather than a small dialog.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(300)
  const phone = await page.evaluate(() => {
    const c = getComputedStyle(document.querySelector('.sheet-card')!)
    return { bottomRadius: parseFloat(c.borderBottomLeftRadius), align: getComputedStyle(document.querySelector('.sheet-wrap')!).alignItems }
  })
  expect(phone.bottomRadius).toBe(0)
  expect(phone.align).toBe('flex-end')

  await page.setViewportSize({ width: 1280, height: 860 })
  await page.waitForTimeout(300)
  const laptop = await page.evaluate(() => {
    const c = getComputedStyle(document.querySelector('.sheet-card')!)
    return { bottomRadius: parseFloat(c.borderBottomLeftRadius), align: getComputedStyle(document.querySelector('.sheet-wrap')!).alignItems }
  })
  expect(laptop.bottomRadius).toBeGreaterThan(0)
  expect(laptop.align).toBe('center')
})

test('the role picker commits on Continue, not on the first tap', async ({ page }) => {
  /**
   * ⚠️ NOT A LAYOUT CHECK, AND IT IS HERE BECAUSE NOTHING ELSE CAN SEE IT. The picker used to
   * write `profiles.role` on the first tap, so a mis-tap was an unannounced irreversible account
   * change on the first screen of the product — while the line underneath said "you can change
   * this later", which was true of nothing on screen. The property is that Continue is INERT
   * until something is chosen.
   */
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ui-preview?p=role')

  const cont = page.getByRole('button', { name: /Continue/ })
  await expect(cont).toBeDisabled()

  await page.getByRole('button', { name: /I'm a Parent/ }).click()
  await expect(cont).toBeEnabled()
  // and the choice is visible as a choice, which is what makes the second step readable
  expect(await page.evaluate(() => [...document.querySelectorAll('button')]
    .find(b => b.textContent!.includes("I'm a Parent"))!.getAttribute('aria-pressed'))).toBe('true')

  // re-tappable: the other card takes the selection, so the first tap was not a commit
  await page.getByRole('button', { name: /I'm a Teacher/ }).click()
  expect(await page.evaluate(() => [...document.querySelectorAll('button')]
    .find(b => b.textContent!.includes("I'm a Parent"))!.getAttribute('aria-pressed'))).toBe('false')
})

test('every standalone control on /auth clears the 44px tap floor', async ({ page }) => {
  /**
   * ⚠️ INLINE TEXT LINKS ARE EXEMPT, AND NAMED RATHER THAN FILTERED BY SIZE. `Terms` and
   * `Privacy Policy` sit INSIDE the consent sentence; giving them 44px of height would break the
   * sentence they are part of, and WCAG 2.5.8 exempts a link in a block of text for exactly that
   * reason. Filtering "anything under 44px that is a link" would exempt the whole world — the trap
   * CLAUDE.md records as a sweep that exempts everything and reports green. So the exemption is a
   * LIST, and a new short control fails until somebody adds it deliberately.
   */
  const EXEMPT_INLINE = ['Terms', 'Privacy Policy']
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/auth')
  await page.waitForTimeout(900)

  const small = await page.evaluate(exempt => [...document.querySelectorAll('button, input, a')]
    .map(el => ({ tag: el.tagName, h: Math.round(el.getBoundingClientRect().height), text: (el.textContent || '').trim() }))
    .filter(e => e.h > 0 && e.h < 44)
    .filter(e => !exempt.includes(e.text)), EXEMPT_INLINE)

  expect(small, 'standalone controls under the 44px tap floor').toEqual([])
})


test('a reading page keeps its measure instead of stretching to the frame', async ({ page }) => {
  /**
   * ⚠️ THE OPPOSITE MISTAKE TO THE DASHBOARD'S, AND EQUALLY REAL. `.adult-shell` widens to 1180px
   * because a dashboard has columns to fill; prose does not — past roughly 75 characters a line is
   * harder to read, not easier. So help, pricing and the account page use `.adult-doc`, which
   * widens its PADDING and keeps its 720px measure. 720 is written out here rather than read from
   * the CSS: it is a typographic decision, so changing it should take two edits.
   */
  await page.setViewportSize({ width: 1440, height: 900 })
  for (const url of ['/help', '/parent/plan', '/parent/account']) {
    await page.goto(url)
    await expect(page.locator('.adult-doc')).toBeVisible()
    const w = await page.evaluate(() => Math.round(document.querySelector('.adult-doc')!.getBoundingClientRect().width))
    expect(w, `${url} reading column`).toBe(720)
  }
})

test('the card grid goes one → two → three columns', async ({ page }) => {
  await page.goto('/ui-preview?p=cards')
  for (const [w, cols] of [[390, 1], [768, 2], [1280, 3]] as const) {
    await page.setViewportSize({ width: w, height: 860 })
    await page.waitForTimeout(300)
    const got = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.card-grid')!).gridTemplateColumns.split(' ').length)
    expect(got, `card grid at ${w}px`).toBe(cols)
  }
})
