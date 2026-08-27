import { test, expect, Page } from '@playwright/test'

/**
 * THE READY BAR MUST NOT LAND ON ANYTHING, ON THE FRAME WITH THE LEAST ROOM.
 *
 * Thirteen storybook chapters gained a commit control on 2026-08-27 (a student: *"this feature
 * should be added to all other games or activities, so users can submit their answer when they are
 * ready"*). Adding one fixed control to thirteen chapters is exactly the move this repo's craft doc
 * catalogues collisions from, and the unit gates cannot see any of it: every layer is individually
 * correct and the overlap is a property of the RENDERED DOM.
 *
 * ⚠️ IT ALREADY CAUGHT ONE, WHICH IS THE ONLY REASON TO TRUST IT. Centred in the bottom strip, the
 * bar covered MarketDay's `3 × 3 = ?` readout completely — measured 190–237 against a readout at
 * 193–235 — because that chapter's answer chips already own the bottom strip. Those chapters pass
 * `align="right"` now, and this is what says so.
 *
 * ⚠️ 640×320 ON PURPOSE. The band's controls are sized off the SHORT axis, so the frame with the
 * least vertical room is where two fixed layers meet first.
 */
const FRAME = { width: 640, height: 320 }

/**
 * `/story?ch=` key → the query that opens its scored round.
 *
 * ⚠️ `counting` IS NOT `e2e=practice`, AND SENDING IT ONE IS A CHECK THAT CANNOT PASS. That chapter
 * runs on `ForestWalk`, which has no Phase union at all — it walks a LIST OF BEATS — so it reads
 * `?skip` and ignores `?e2e` entirely. Given the wrong parameter it starts at beat zero and spends
 * the whole budget on a self-paced walk, then reports "never reached a commit control" about a bar
 * that works. Two engines, two door handles.
 */
const CHAPTERS: Array<[key: string, query: string, answersOnCanvas?: true]> = [
  ['nest', 'e2e=practice'], ['order', 'e2e=practice'], ['kitchen', 'e2e=practice'],
  ['shapes', 'e2e=practice'], ['beads', 'e2e=practice'], ['numbers', 'e2e=practice'],
  ['compare', 'e2e=practice'], ['story', 'e2e=practice'], ['multiply', 'e2e=practice'],
  ['solids', 'e2e=practice'], ['add', 'e2e=practice'],
  ['counting', 'skip'],
  // ⚠️ THE ONE CHAPTER WHOSE ANSWER IS NOT A BUTTON — see the canvas sweep in the driver.
  ['rainbow', 'e2e=test', true],
]

/**
 * ⚠️ EMPTY, AND IT HAS TO STAY THAT WAY DELIBERATELY. Two chapters were parked here for a while
 * ("the driver cannot reach them, verified by hand") and both turned out to be driver faults, not
 * chapter facts — `counting` because the driver was clicking paraders that were still OFF-FRAME,
 * `rainbow` because its answer is a tap on a CANVAS and the driver only clicked `<button>`s. An
 * exemption list is where a check goes to stop being one, so anything added here needs the reason
 * it is impossible rather than the reason it was inconvenient.
 */
const NOT_DRIVABLE: string[] = []

const COMMIT = /^(Ready|Send|Done|Paint)\b/i

/** Every visible control and text block, so a failure names what the bar landed on. */
async function layers(page: Page) {
  return page.evaluate(() => {
    const out: Array<{ what: string; top: number; bottom: number; left: number; right: number }> = []
    document.querySelectorAll('button, [role="button"]').forEach(e => {
      const r = e.getBoundingClientRect()
      if (r.width < 8 || r.height < 8) return
      const cs = getComputedStyle(e)
      if (cs.visibility === 'hidden' || cs.opacity === '0' || cs.display === 'none') return
      out.push({
        what: (e.textContent || e.getAttribute('aria-label') || 'button').replace(/\s+/g, ' ').trim().slice(0, 28),
        top: r.top, bottom: r.bottom, left: r.left, right: r.right,
      })
    })
    return out
  })
}

const overlaps = (a: { top: number; bottom: number; left: number; right: number },
                  b: { top: number; bottom: number; left: number; right: number }) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

test.describe('the Ready bar clears every other layer at 640×320', () => {
  test.describe.configure({ timeout: 150_000 })
test.beforeEach(async ({ page }) => { await page.setViewportSize(FRAME) })

  for (const [key, query, answersOnCanvas] of CHAPTERS) {
    test(`${key}`, async ({ page }) => {
      await page.goto(`/story?ch=${key}&${query}`)
      await page.waitForTimeout(1500)

      // Click forward (world pickers, start cards) until an answer surface is live, then choose one
      // answer. Never the Menu, never SkillBeat's replay pill, and never the commit itself — the
      // whole point is to reach the state where the commit is SHOWING.
      let tick = 0
      let bar: { top: number; bottom: number; left: number; right: number; what: string } | null = null
      const deadline = Date.now() + 100_000
      while (Date.now() < deadline) {
        const found = (await layers(page)).find(l => COMMIT.test(l.what))
        if (found) { bar = found; break }

        /**
         * ⚠️ CLICK IT INSIDE THE PAGE, NOT BY COORDINATE — the targets MOVE. The counting chapter's
         * paraders walk on from off-frame over 1.8 s, so a box measured in one round trip and
         * clicked in the next lands where the creature USED to be; the sweep then spent its whole
         * budget missing and reported "never reached a commit control" about a working bar. One
         * evaluate that finds AND clicks cannot go stale.
         */
        const clicked: number = await page.evaluate(([frame, n]: [{ width: number; height: number }, number]) => {
          const ok: HTMLButtonElement[] = []
          document.querySelectorAll('button:not([disabled])').forEach(e => {
            const b = e as HTMLButtonElement
            const label = (b.textContent || '').replace(/\s+/g, ' ').trim()
            const aria = b.getAttribute('aria-label') || ''
            // Never the Menu, never SkillBeat's replay pill, and NEVER the commit itself — a driver
            // that presses the control it is measuring destroys the state it is looking for.
            if (/menu/i.test(label) || /hear it again/i.test(aria)) return
            if (/^(Ready|Send|Done|Paint)\b/i.test(label)) return
            const r = b.getBoundingClientRect()
            // ⚠️ ON-SCREEN ONLY. A parader WAITS off-frame and arrives on its own legs (measured at
            // x −130), and nothing can click that.
            if (r.width < 8 || r.height < 8) return
            if (r.left < 0 || r.top < 0 || r.right > frame.width || r.bottom > frame.height) return
            ok.push(b)
          })
          if (!ok.length) return 0
          ok[n % ok.length].click()
          return ok.length
        }, [FRAME, tick++] as [{ width: number; height: number }, number])
        if (!clicked) await page.waitForTimeout(500)

        /**
         * ⚠️ AND SOME ANSWERS ARE NOT BUTTONS. The colouring chapter is a CANVAS: the child picks up
         * a paint (a button) and then colours the glowing part (a tap on the picture). A driver that
         * only clicks buttons picks paint pots for ever and reports the chapter clean, which is a
         * check that cannot fail. The whole grid is swept in ONE pass, and the gap between taps
         * clears that chapter's own 220 ms `TAP_LOCK_MS` — at 120 ms half the sweep was swallowed by
         * the double-tap guard and never reached the page at all.
         */
        /**
         * ⚠️ DECLARED PER CHAPTER, NOT DETECTED. Sweeping "any page with a `<canvas>`" looks more
         * general and is much worse: `ScribblePad` puts a canvas in EVERY chapter, so the sweep ran
         * everywhere at 20 taps × 260 ms per iteration and ate each chapter's whole budget — the run
         * went from four minutes to not finishing at all. Only the colouring chapter answers on a
         * canvas, so only the colouring chapter says so.
         *
         * ⚠️ AND THE POINTS ARE HIT-TESTED FIRST. A real mouse click goes to whatever is ON TOP, and
         * the point that actually reaches the target — (416, 64) at 640×320 — sits underneath
         * SkillBeat's prompt pill (x 181–459, y 48–93), so every click there replayed Milo's voice
         * and the sweep concluded the chapter had no commit control. Asking `elementFromPoint`
         * which points really belong to the canvas keeps the click honest (a covered point is a
         * point a CHILD could not tap either) instead of dispatching a synthetic event that would
         * paper over exactly that kind of overlay bug.
         */
        const cv = answersOnCanvas ? await page.locator('canvas').first().boundingBox().catch(() => null) : null
        if (cv) {
          const pts: Array<{ x: number; y: number }> = await page.evaluate((box) => {
            const out: Array<{ x: number; y: number }> = []
            const cvEl = document.querySelector('canvas')
            // ⚠️ FINE ENOUGH TO FIND A SINGLE OBJECT. A 5×4 grid put exactly ONE point inside the
            // balloon this round asks for, and that point (416, 64) is underneath the prompt pill —
            // so the hit test correctly rejected it and the sweep had nothing left to try. The
            // grid samples the picture, so it has to be denser than the thing being looked for.
            for (let gy = 1; gy <= 7; gy++) for (let gx = 1; gx <= 9; gx++) {
              const x = box.x + box.width * gx / 10, y = box.y + box.height * gy / 8
              const top = document.elementFromPoint(x, y)
              if (top === cvEl || (top && cvEl && cvEl.contains(top)) || (top && top.contains(cvEl))) out.push({ x, y })
            }
            return out
          }, cv)
          for (const pt of pts) {
            await page.mouse.click(pt.x, pt.y).catch(() => {})
            // Clears the chapter's own 220 ms TAP_LOCK_MS; at 120 ms half the sweep was swallowed
            // by the double-tap guard and never reached the page at all.
            await page.waitForTimeout(260)
            if ((await layers(page)).some(l => COMMIT.test(l.what))) break
          }
        }
        await page.waitForTimeout(350)
      }

      // ⚠️ SAY WHAT WAS ON SCREEN WHEN IT GAVE UP. "Never reached a commit control" is unactionable
      // on its own — it reads as a missing bar and was three times a driver fault instead.
      const lastSeen = (await layers(page)).map(l => l.what).join(' · ')
      expect(bar, `${key}: never reached a state with a commit control showing. Visible controls were: ${lastSeen}`).not.toBeNull()

      // Inside the frame, and clear of every other control on screen.
      expect(bar!.right, `${key}: the bar runs off the right edge`).toBeLessThanOrEqual(FRAME.width + 1)
      expect(bar!.left, `${key}: the bar runs off the left edge`).toBeGreaterThanOrEqual(-1)
      expect(bar!.bottom, `${key}: the bar runs off the bottom`).toBeLessThanOrEqual(FRAME.height + 1)
      expect(bar!.top, `${key}: the bar runs off the top`).toBeGreaterThanOrEqual(-1)
      expect(bar!.bottom - bar!.top, `${key}: the bar is under the 44px tap floor`).toBeGreaterThanOrEqual(44)

      const hits = (await layers(page))
        .filter(l => !COMMIT.test(l.what) && overlaps(bar!, l))
        .map(l => `${l.what} (${Math.round(l.left)},${Math.round(l.top)}–${Math.round(l.right)},${Math.round(l.bottom)})`)
      expect(hits, `${key}: the Ready bar at (${Math.round(bar!.left)},${Math.round(bar!.top)}–${Math.round(bar!.right)},${Math.round(bar!.bottom)}) lands on: ${hits.join(' · ')}`).toEqual([])
    })
  }

  /**
   * ⚠️ THE WORLD PICKER IS PART OF THE CHAPTER, AND IT WAS OVERFLOWING BEFORE ANY OF THIS. Its card
   * was `clamp(200px,26vw,300px)` — width-derived with no `vh` term — so at 640×320 the 26vw
   * computed to 166, the 200px MINIMUM won, three cards could not fit one row, and the third ran
   * off the bottom of the frame. Measured on all three chapters that have a picker.
   */
  for (const key of ['beads', 'numbers', 'counting']) {
    test(`${key} — the world picker fits the frame`, async ({ page }) => {
      await page.goto(`/story?ch=${key}`)
      await page.waitForTimeout(2500)
      const cards = await page.evaluate(() => [...document.querySelectorAll('button')]
        .map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20), top: r.top, bottom: r.bottom, left: r.left, right: r.right } })
        .filter(c => c.right - c.left > 8 && !/menu/i.test(c.t)))
      expect(cards.length, `${key}: no picker cards found — this check would pass on an empty page`).toBeGreaterThan(1)
      for (const c of cards) {
        expect(c.bottom, `${key}: "${c.t}" runs ${Math.round(c.bottom - 320)}px off the bottom`).toBeLessThanOrEqual(321)
        expect(c.top, `${key}: "${c.t}" runs off the top`).toBeGreaterThanOrEqual(-1)
        expect(c.right, `${key}: "${c.t}" runs off the right`).toBeLessThanOrEqual(641)
      }
    })
  }

  /**
   * ⚠️ THE QUESTION MUST NOT SWALLOW TAPS ON THE PICTURE. RainbowTown's answer surface is a
   * colouring page that fills the frame, so anything drawn over it with pointer events is a dead
   * patch of picture. `SkillBeat`'s prompt pill is a real `<button>` and was exactly that:
   * measured at 640×320 it spanned x 181–459, y 48–93 while the balloon that round asks for spans
   * x 415–490, y 15–120, so a child aiming at the middle of the answer hit the pill and nothing
   * coloured. The chapter draws its own `pointerEvents: none` banner now.
   *
   * Asserted with `elementFromPoint` at the banner's own centre, because that is the question a
   * finger asks: what is actually under this pixel?
   */
  test('rainbow — the question is drawn over the picture without blocking it', async ({ page }) => {
    await page.goto('/story?ch=rainbow&e2e=test')
    await page.waitForTimeout(2500)
    const probe = await page.evaluate(() => {
      const banner = [...document.querySelectorAll('div')]
        .filter(e => !e.children.length && /^Colour the /.test((e.textContent || '').trim()))
        .map(e => e.getBoundingClientRect())[0]
      if (!banner) return { found: false as const }
      const x = banner.left + banner.width / 2, y = banner.top + banner.height / 2
      const hit = document.elementFromPoint(x, y)
      return {
        found: true as const,
        under: hit ? hit.tagName : 'nothing',
        replay: !!document.querySelector('button[aria-label="Hear it again"]'),
        banner: { x: Math.round(banner.left), y: Math.round(banner.top), w: Math.round(banner.width), h: Math.round(banner.height) },
      }
    })
    expect(probe.found, 'the question is not on screen at all — this check would pass on a blank page').toBe(true)
    if (!probe.found) return
    expect(probe.under, `a tap at the centre of the question lands on a ${probe.under}, not the picture — the question is a dead patch of colouring page`).toBe('CANVAS')
    // And the replay it used to carry has to still exist somewhere, or fixing the dead patch cost
    // the child the only way to hear the colour again.
    expect(probe.replay, 'the "Hear it again" control disappeared with the pill').toBe(true)
  })

  test('every converted chapter is driven, and the exemption list is empty', () => {
    expect(NOT_DRIVABLE, 'a chapter was exempted — see the note above before allowing it').toEqual([])
    expect(CHAPTERS.length + NOT_DRIVABLE.length, 'a converted chapter is in neither list').toBe(13)
  })
})
