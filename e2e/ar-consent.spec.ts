import { test, expect, type Page } from '@playwright/test'
import { AR_CHAPTERS } from '../src/core/arChapters'
import { seedSession } from './session'

/**
 * ⚠️⚠️ THE EXACT LIVE PATH, DRIVEN. Not a unit test of a helper.
 *
 * `/diagnostic`'s report links a LOGGED-OUT visitor at their plan's first chapter —
 * `/teen-preview?c=<id>&taste=1` — and for 12–30% of visitors in bands 9–11 through 17–18 that
 * chapter's start card offered "Turn on the camera" to a child with no account, no identified
 * parent and no consent captured. This spec walks that URL for every one of the eight camera
 * chapters and asserts the camera is unreachable.
 *
 * ⚠️ IT ASSERTS `getUserMedia` WAS NEVER CALLED, and it proves the instrument works before
 * believing the zero — a silent probe and a broken probe are indistinguishable from outside, and
 * the broken one reads as good news (CLAUDE.md). `control: the probe can see a real call` is that
 * proof, and `control: a NON-camera chapter still renders` is the other half: without it, a route
 * that had simply stopped rendering everything would pass this whole file.
 */

/** Record every camera request the page makes, before any app code runs. */
async function watchCamera(page: Page) {
  await page.addInitScript(() => {
    // @ts-expect-error test-only channel
    window.__gum = []
    const md = navigator.mediaDevices
    if (!md) return
    const real = md.getUserMedia?.bind(md)
    md.getUserMedia = (c?: MediaStreamConstraints) => {
      // @ts-expect-error test-only channel
      window.__gum.push(JSON.stringify(c ?? {}))
      return real ? real(c as MediaStreamConstraints) : Promise.reject(new Error('no camera'))
    }
  })
}
const cameraCalls = (page: Page) => page.evaluate(() => (window as unknown as { __gum: string[] }).__gum)

/** ChapterPortal renders the whole chapter inside `<div data-band=…>`. Nothing else does. */
const chapterMounted = (page: Page) => page.locator('[data-band]')

test.describe('a camera chapter is unreachable without an account', () => {
  for (const id of AR_CHAPTERS) {
    test(`${id} — the logged-out taste link refuses to render it`, async ({ page }) => {
      await watchCamera(page)
      await page.goto(`/teen-preview?c=${id}&taste=1`)

      // The consent card, not the chapter.
      await expect(page.locator('body')).toContainText('played with your hands')
      await expect(chapterMounted(page)).toHaveCount(0)
      // No control anywhere offers the camera. The card's prose mentions one; a BUTTON must not.
      await expect(page.getByRole('button', { name: /camera/i })).toHaveCount(0)

      // Give any late mount a chance to misbehave before believing the zero.
      await page.waitForTimeout(1500)
      expect(await cameraCalls(page), 'the page asked for a camera').toEqual([])
    })

    test(`${id} — the bare URL is refused too, not just the taste link`, async ({ page }) => {
      // The founder's instruction named the demo picker. The live leak has no picker — the URL IS
      // the picker — so `taste=1` must not be what the guard keys on.
      await watchCamera(page)
      await page.goto(`/teen-preview?c=${id}`)
      await expect(page.locator('body')).toContainText('played with your hands')
      await expect(chapterMounted(page)).toHaveCount(0)
      expect(await cameraCalls(page)).toEqual([])
    })
  }

  test('control: a NON-camera chapter still renders on the same route', async ({ page }) => {
    // Without this, a route that had stopped rendering anything at all would pass every test above.
    await watchCamera(page)
    await page.goto('/teen-preview?c=wordProblems&taste=1')
    await expect(chapterMounted(page)).toHaveCount(1)
    await expect(page.locator('body')).not.toContainText('played with your hands')
  })

  test('control: WITH an account the same chapter renders — the guard is scoped, not deny-all', async ({ page }) => {
    // A guard that refused everything would pass every assertion above. This is the other direction:
    // once there is an account, the band's speciality is reachable exactly as before.
    await watchCamera(page)
    await seedSession(page)
    await page.goto(`/teen-preview?c=${AR_CHAPTERS[0]}&taste=1`)
    await expect(chapterMounted(page)).toHaveCount(1)
    await expect(page.locator('body')).not.toContainText('played with your hands')
  })

  test('control: the probe can see a real getUserMedia call', async ({ page }) => {
    // A scan that finds nothing proves nothing until it has been shown it can find something.
    await watchCamera(page)
    await page.goto('/teen-preview?c=wordProblems')
    await page.evaluate(() => navigator.mediaDevices?.getUserMedia({ video: true }).catch(() => {}))
    expect(await cameraCalls(page), 'the instrument cannot see a camera request').toHaveLength(1)
  })
})
