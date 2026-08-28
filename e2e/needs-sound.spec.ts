import { test, expect } from '@playwright/test'

/**
 * THE ONE CHAPTER THAT CANNOT DEGRADE GRACEFULLY SAYS SO.
 *
 * The feeding-nest chapter SPEAKS its target number and deliberately never draws it — going
 * sound → glyph is the whole skill, and `promptFor` may not contain a digit. Every other chapter in
 * the band writes its question as well as saying it, so a device with no voice costs warmth and
 * nothing else. Here it costs the answer: the number exists nowhere on screen and the child can
 * only guess. `speakSteps`' silent fallback does not help — it paces the demo, it does not deliver
 * the number.
 *
 * ⚠️ THE FIX IS NOT TO WRITE THE NUMBER, which would turn listening into matching and delete the
 * chapter. It is recorded clips for this band (12–18 already has the pipeline). This notice is what
 * stands in until then, and it is addressed to the grown-up, because the child cannot read it.
 *
 * ⚠️ BOTH DIRECTIONS ARE CHECKED, and the negative one is the one that matters most: a notice that
 * shows up on a perfectly good device is worse than no notice, because it tells a parent their
 * working chapter is broken.
 *
 * ⚠️ AND THE OVERRIDE HAS TO RUN BEFORE ANY APP CODE. `useMiloSpeaker._loadVoices` refuses to clear
 * an already-populated list (`if (v.length) _voices = v`), so stubbing `getVoices` from the console
 * after boot cannot flip it — a hand-check that way reports "no notice" on a browser that really
 * has none. `addInitScript` is the only honest way to simulate this.
 */
const ENTER = '/story?ch=nest&e2e=practice'

async function enterChapter(page: import('@playwright/test').Page) {
  await page.goto(ENTER)
  await page.waitForTimeout(2000)
  const card = page.locator('button', { hasText: /Tap to explore/ }).first()
  if (await card.count()) { await card.click(); await page.waitForTimeout(2500) }
}

test('with no voice, the chapter says it needs sound', async ({ page }) => {
  await page.addInitScript(() => {
    // Before any app code: this browser reports no voices, ever.
    Object.defineProperty(window.speechSynthesis, 'getVoices', { value: () => [], configurable: true })
  })
  await enterChapter(page)
  const body = await page.evaluate(() => document.body.innerText)
  expect(body, 'a voiceless device is left guessing, with nothing on screen that could tell it the answer')
    .toContain('needs sound')
  // The notice must not have bought itself the answer: the digit stays out of the drawn question.
  const prompt = await page.locator('button[aria-label="Hear it again"]').first().innerText().catch(() => '')
  expect(prompt, 'the notice came with the number written on screen, which deletes the skill').not.toMatch(/\d/)
})

test('with a voice, it says nothing at all', async ({ page }) => {
  await enterChapter(page)
  const voices = await page.evaluate(() => window.speechSynthesis.getVoices().length)
  expect(voices, 'this browser has no voices, so the negative case proves nothing here').toBeGreaterThan(0)
  const body = await page.evaluate(() => document.body.innerText)
  expect(body, 'the notice fires on a device that can speak perfectly well').not.toContain('needs sound')
})
