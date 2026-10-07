import { test, expect, Page } from '@playwright/test'
import { appendFileSync, mkdirSync } from 'fs'
import { seedSession } from './session'

/**
 * Cross-browser "can a child actually tap it" sweep for the KG–2 chapters. Run across every engine
 * and device with the matrix in playwright.config.ts:
 *   E2E_MATRIX=1 E2E_BASE_URL=http://localhost:3000 npx playwright test e2e/xbrowser-clicks.spec.ts
 * Narrow with E2E_ONLY=counting,shapes and --project=mac-safari.
 *
 * Why: a child on Safari could not press "Back to modules" at the end of Counting while Chrome was
 * fine. The other sweeps only ask "does the chapter open", on Chromium only.
 *
 * It plays each chapter with a dumb monkey (tap anything tappable until the end card shows) and, on
 * EVERY screen it passes through, hit-tests every visible control: is the element at the control's
 * centre the control itself? If not, something is covering it and a real tap lands on the cover —
 * the "button does nothing" bug. On the end card it presses the real buttons and checks they work.
 *
 * ⚠️ The monkey answers at random, so a chapter that needs correct answers to reach its end card can
 * time out here without being broken — that is reported as "no end card", not as a click failure.
 */

// The KG–2 chapters, written out by hand (bound to intent, not derived from the code under test).
const CHAPTERS = [
  'counting', 'numberOrdering', 'numberRecognition', 'matchingQuantities', 'numberComparison', 'shapes', 'colors',
  'patterns', 'measurement', 'addition', 'subtraction',
  'numbersTo100', 'placeValue', 'skipCounting', 'storyProblems', 'multiplication', 'fractions', 'money', 'time',
  'compareNumbers', 'additionTo100', 'subtractionTo100', 'shapes2d3d',
]
/**
 * Each chapter's practice beat skillId (the resume key) and the round to seed. A 10-round chapter (hand-checked against
 * each beat's `rounds`, 2026-10-02) is seeded at round 9, a real mid-run state: ONE answer ends the run on the "All done!"
 * card (Play again + Back to modules). counting / colors / shapes have a data-driven round count, so they are seeded
 * past the end (99) — their round makers clamp the index (world1.tsx plan fallback, makeColorRound, makeShapeRound) and
 * the next answer takes the same `next >= rounds` exit.
 * `E2E_CARD=take` seeds nothing: the monkey plays 5 answers to the take card ("5 questions done", Back to modules
 * only) — the card every KG–2 sitting ends on.
 */
const SEED: Record<string, [skill: string, round: number]> = {
  counting: ['counting', 99], colors: ['colors', 99], shapes: ['shapes', 99],
  numberOrdering: ['numberOrdering', 9], numberRecognition: ['numberRecognition', 9],
  matchingQuantities: ['matchingQuantities', 9], numberComparison: ['numberComparison', 9], patterns: ['patterns', 9],
  measurement: ['measurement', 9], addition: ['addition', 9], subtraction: ['subtraction', 9],
  numbersTo100: ['numbersTo100', 9], placeValue: ['placeValue', 9], skipCounting: ['skipCounting', 9],
  storyProblems: ['storyProblems', 9], multiplication: ['multiplication', 9], fractions: ['fractions', 9],
  money: ['money', 9], time: ['time', 9], compareNumbers: ['compareNumbers', 9], additionTo100: ['additionTo100', 9],
  subtractionTo100: ['subtractionTo100', 9], shapes2d3d: ['shapes2d3d', 9],
}
const TAKE = process.env.E2E_CARD === 'take'
const LEARNER = 'e2e-learner-1'
const ONLY = process.env.E2E_ONLY?.split(',').map(s => s.trim()).filter(Boolean)
const PLAY_MS = Number(process.env.E2E_PLAY_MS || 150_000)

type Covered = { label: string; coveredBy: string }

/** Every visible control whose centre point does not belong to it. Runs in the page. */
const findCovered = (page: Page, modalOnly: boolean) => page.evaluate((modalOnly) => {
  const out: { label: string; coveredBy: string }[] = []
  const desc = (el: Element) => {
    const h = el as HTMLElement
    const t = (h.innerText || h.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40)
    return `<${el.tagName.toLowerCase()}${h.className && typeof h.className === 'string' ? '.' + h.className.split(' ')[0] : ''}> ${t}`
  }
  for (const el of document.querySelectorAll('button, a[href], [role=button], input, select')) {
    // With the end card up, everything behind it is meant to be covered: only its own buttons count.
    if (modalOnly && !/Play again|Back to modules/.test((el as HTMLElement).innerText || '')) continue
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    if (!r.width || !r.height || cs.visibility === 'hidden' || cs.pointerEvents === 'none' || Number(cs.opacity) === 0) continue
    if ((el as HTMLButtonElement).disabled) continue
    const x = r.left + r.width / 2, y = r.top + r.height / 2
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue   // off-screen: scroll's job, not a cover
    const hit = document.elementFromPoint(x, y)
    if (!hit || el === hit || el.contains(hit)) continue
    if (hit.closest('nextjs-portal')) continue   // the dev server's own overlay, not the app
    // An ancestor that is itself the clickable thing (label wrapping input) is fine.
    if (hit.contains(el) && hit.closest('label')) continue
    // The end card fading in over the chapter is meant to cover it.
    let o: Element | null = hit
    while (o && !(getComputedStyle(o).position === 'fixed' && /All done!|questions done/.test((o as HTMLElement).innerText || ''))) o = o.parentElement
    if (o && !o.contains(el)) continue
    out.push({ label: desc(el), coveredBy: hit ? desc(hit) : 'nothing (outside document)' })
  }
  return out
}, modalOnly)

/**
 * Two more ways a tap is "blocked" for a small child, reported per screen:
 *  - small: an enabled control whose shorter side is under 44px (the app's own minimum) — a finger misses it.
 *  - dead: controls are on screen but every one of them is disabled (the voice is talking, a round is settling) —
 *    a child taps and nothing happens. Measured in the loop as a stretch of time.
 * Chrome controls (Menu, Hear it again) are left out of both: they are always live by design.
 */
const tapHealth = (page: Page) => page.evaluate(() => {
  const small: string[] = []
  let enabled = 0, disabled = 0
  for (const el of document.querySelectorAll('button, [role=button], a[href]')) {
    if (el.closest('nextjs-portal')) continue
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
    if (!r.width || !r.height || cs.visibility === 'hidden' || Number(cs.opacity) < 0.2) continue
    if (r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue
    const t = ((el as HTMLElement).innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 30)
    if (/menu|hear it again|back to modules|play again/i.test(t)) continue
    const off = (el as HTMLButtonElement).disabled || cs.pointerEvents === 'none'
    if (off) { disabled++; continue }
    enabled++
    if (Math.min(r.width, r.height) < 44) small.push(`"${t || '?'}" ${Math.round(r.width)}x${Math.round(r.height)}`)
  }
  const screen = (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 80)
  // Input held while the voice speaks is by design (a count must not be skipped), and a headless browser's device voice
  // is far slower than a real one — so only a SILENT dead stretch is a finding.
  const speaking = typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking
  return { small, enabled, disabled, screen, speaking }
})

/** Playwright's refusal for an element that never stops moving (a nudge animates for ever). */
const UNSTABLE = /not stable|visible, enabled and stable/
/**
 * Tap an element's centre with the real pointer, but only if the element is what is at that point (else a cover would
 * take the tap); returns whether it tapped. For controls that never pass the "stable" wait.
 */
const tapCentre = async (page: Page, el: ReturnType<Page['locator']>, touch: boolean) => {
  const pt = await el.evaluate(n => { const r = n.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2
    const h = document.elementFromPoint(x, y); return h && (n === h || n.contains(h)) ? { x, y } : null }, undefined, { timeout: 1000 }).catch(() => null)
  if (!pt) return false
  if (touch) await page.touchscreen.tap(pt.x, pt.y); else await page.mouse.click(pt.x, pt.y)
  return true
}

/** Tag what a child would tap (enabled controls + anything styled clickable) with data-xb; returns the count. */
const tagTappables = (page: Page) => page.evaluate(() => {
  document.querySelectorAll('[data-xb]').forEach(e => e.removeAttribute('data-xb'))
  let n = 0
  const picked: Element[] = []
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el)
    const isCtl = el.matches('button, [role=button], a[href]') || cs.cursor === 'pointer'
    if (!isCtl || cs.visibility === 'hidden' || cs.pointerEvents === 'none' || (el as HTMLButtonElement).disabled) continue
    if (picked.some(p => p.contains(el))) continue
    const r = el.getBoundingClientRect()
    if (r.width < 8 || r.height < 8 || r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue
    const text = ((el as HTMLElement).innerText || el.getAttribute('aria-label') || '').trim()
    // Never walk out of the chapter, and don't burn turns replaying audio.
    if (/menu|back|exit|home|log ?out|sign|hear it again|go back/i.test(text)) continue
    picked.push(el)
    el.setAttribute('data-xb', String(n++))
  }
  return n
})

/**
 * Two chapters only move on for the RIGHT answer, which a random monkey practically never builds; both name the answer
 * on screen and label their controls, so answer them. (placeValue / additionTo100 do not, and stay with the monkey.)
 * Returns true when it acted.
 */
async function solve(page: Page, touch: boolean): Promise<boolean> {
  const press = (l: ReturnType<Page['locator']>) => (touch ? l.tap({ timeout: 2500 }) : l.click({ timeout: 2500 })).then(() => true, () => false)
  const body = await page.locator('body').innerText().catch(() => '')
  const send = /Send exactly (\d+) /.exec(body)                                   // Home Time
  if (send) {
    const ready = page.getByRole('button', { name: /Ready/ })
    if (!(await ready.isVisible().catch(() => false))) return false
    for (let k = 0; k < Number(send[1]); k++) await press(page.locator('button[aria-label^="send "]:not([disabled])').first())
    return press(ready)
  }
  const paint = /(?:Color|Paint) the .* (\w+)!/.exec(body)                        // Rainbow Town
  if (paint) {
    const pot = page.locator(`[aria-label^="${paint[1].toLowerCase()} paint"]`).first()
    if (await pot.isVisible().catch(() => false)) await press(pot)
    return false   // the monkey then taps random points of the picture until it hits the glowing part
  }
  return false
}

const END_CARD = /All done!|questions done|Back to modules/
const CRASH = /Oops! Something went wrong|Application error|client-side exception/

for (const id of CHAPTERS) {
  if (ONLY && !ONLY.includes(id)) continue

  test(`${id}: every control tappable, end card buttons work`, async ({ page }, info) => {
    test.setTimeout(PLAY_MS + 60_000)
    const touch = !!info.project.use.hasTouch
    const covered = new Map<string, Covered>()
    const suspects = new Set<string>()
    const small = new Set<string>()
    let deadSince: number | null = null
    let worstDead = { ms: 0, screen: '' }
    const errors: string[] = []
    page.on('pageerror', e => errors.push(String(e)))
    page.on('console', m => { if (m.type() === 'error' && !/ERR_UNSAFE_PORT|Failed to load resource|127\.0\.0\.1:9/.test(m.text())) errors.push(m.text().slice(0, 400)) })
    await seedSession(page)
    const [skill, round] = TAKE ? [undefined, 0] : SEED[id]
    await page.addInitScript(({ learner, skill, round }) => {
      sessionStorage.setItem('milo_active_learner', JSON.stringify({ id: learner, display_name: 'E2E', age_group: '3-5' }))
      // kv folds `milo-chres-*` from localStorage into IndexedDB at boot (src/infra/storage/kv.ts KV_PREFIXES).
      if (skill) localStorage.setItem(`milo-chres-${learner}-${skill}`, JSON.stringify({ round, correct: 5, wrong: 4, seen: [], asked: [], at: Date.now() }))
    }, { learner: LEARNER, skill, round })

    await page.goto(`/game?c=${id}`)   // the route a child plays on (the /story preview is off)
    await page.waitForLoadState('networkidle').catch(() => {})

    let reachedEnd = false
    let crashed = false
    const play = async () => {
    reachedEnd = false
    const deadline = Date.now() + PLAY_MS
    let rolled = Date.now()
    let turn = 0
    while (Date.now() < deadline) {
      // Seeded runs need ONE answer; a question type the monkey cannot solve (build a number from blocks) would eat the
      // whole budget. A reload keeps the seeded round and rolls a new random question. Not in take mode: a reload
      // restarts the 5-answer take count.
      if (skill && Date.now() - rolled > 60_000) { rolled = Date.now(); await page.reload().catch(() => {}) }
      const atEnd = await page.getByText(END_CARD).first().isVisible().catch(() => false)
      for (const c of await findCovered(page, atEnd)) covered.set(c.label, c)
      if (!atEnd) {
        const h = await tapHealth(page).catch(() => null)
        if (h) {
          for (const x of h.small) small.add(x)
          if (h.enabled === 0 && h.disabled > 0 && !h.speaking) {
            deadSince ??= Date.now()
            const ms = Date.now() - deadSince
            if (ms > worstDead.ms) worstDead = { ms, screen: h.screen }
          } else deadSince = null
        }
      }
      if (atEnd) { reachedEnd = true; break }
      if (await page.getByText(CRASH).first().isVisible().catch(() => false)) { crashed = true; break }
      if (await page.getByText('Turn your phone sideways').first().isVisible().catch(() => false)) { rotate = true; break }
      if (await solve(page, touch)) { await page.waitForTimeout(400); continue }
      const n = await tagTappables(page)
      if (n) {
        // Build-then-commit chapters (send N home → Ready, blocks → Done, coins → Pay) ignore a commit with nothing
        // built, so every 4th turn goes to a commit control after three random taps.
        const submit = page.locator('[data-xb]').filter({ hasText: /Ready|Done|Pay|Check|✓/ })
        const el = ++turn % 4 === 0 && await submit.count()
          ? submit.nth(Math.floor(Math.random() * await submit.count()))
          : page.locator(`[data-xb="${Math.floor(Math.random() * n)}"]`)
        const label = ((await el.textContent({ timeout: 500 }).catch(() => '')) || (await el.getAttribute('aria-label', { timeout: 500 }).catch(() => '')) || '?').trim().slice(0, 30)
        try {
          // A big target (a whole picture whose handler checks WHERE it was hit — paint the glowing part) gets a random
          // point inside it rather than its centre. Playwright still hit-tests that point.
          const box = await el.boundingBox({ timeout: 1000 }).catch(() => null)
          const position = box && box.width > 200 && box.height > 200
            ? { x: Math.random() * box.width, y: Math.random() * box.height } : undefined
          if (touch) await el.tap({ timeout: 2500, position }); else await el.click({ timeout: 2500, position })
        } catch (e) {
          // A control that animates for ever (a nudging hint) never passes Playwright's "stable" wait, though a child
          // taps it fine: hit-test its centre ourselves and tap that point with the real pointer.
          if (UNSTABLE.test(String(e))) await tapCentre(page, el, touch)
          // Playwright names the element that would receive the tap instead — the Safari "it does nothing" bug.
          const m = /<(.+?)> (?:from <.+?> subtree )?intercepts pointer events/.exec(String(e))
          // Not a verdict on its own (a creature mid-walk, a card fading in): kept as a suspect to look at.
          if (m && !m[1].startsWith('nextjs-portal') && !(await page.getByText(END_CARD).first().isVisible().catch(() => false))) suspects.add(`"${label}" ⟵ <${m[1].slice(0, 80)}>`)
        }
      }
      await page.waitForTimeout(250)
    }
    }
    let rotate = false
    await play()
    if (rotate) {
      info.annotations.push({ type: 'rotate', description: 'asks to rotate in this orientation' })
      mkdirSync('test-results/xbrowser', { recursive: true })
      appendFileSync('test-results/xbrowser/results.jsonl', JSON.stringify({ project: info.project.name, chapter: id, rotate: true }) + '\n')
      return
    }

    await page.screenshot({ path: `test-results/xbrowser/${info.project.name}-${id}.png` }).catch(() => {})
    const coverList = [...covered.values()].map(c => `${c.label}  ⟵ covered by ${c.coveredBy}`)
    if (coverList.length) info.annotations.push({ type: 'covered', description: coverList.join('\n') })
    if (!reachedEnd) info.annotations.push({ type: 'no-end-card', description: `monkey did not reach the end card in ${PLAY_MS / 1000}s` })

    let backWorks: boolean | null = null
    let playAgainWorks: boolean | null = null
    let card: 'all-done' | 'take' | null = null
    // The end-card buttons are nudged (they bounce for ever), so Playwright's "stable" wait never passes though a child
    // taps them fine (5 Oct: 10 of 25 failed on that alone). Then hit-test the centre ourselves and tap it; a cover over
    // the centre still fails, by name.
    const press = async (name: RegExp) => {
      const b = page.getByRole('button', { name })
      try { await (touch ? b.tap({ timeout: 10_000 }) : b.click({ timeout: 10_000 })) } catch (e) {
        if (!UNSTABLE.test(String(e)) || !(await tapCentre(page, b, touch))) throw e
      }
    }
    const record = () => {
      mkdirSync('test-results/xbrowser', { recursive: true })
      appendFileSync('test-results/xbrowser/results.jsonl', JSON.stringify({ project: info.project.name, chapter: id, seeded: !!skill, card, crashed, reachedEnd, playAgainWorks, backWorks, covered: coverList, suspects: [...suspects], small: [...small], deadMs: worstDead.ms, deadScreen: worstDead.screen, errors }) + '\n')
    }
    try {
      if (reachedEnd) {
        // The real thing: Playwright's click/tap refuses (and names the culprit) if anything intercepts.
        // Which card came up decides which buttons exist: "All done!" has Play again; the 5-answer take card does not.
        card = await page.getByRole('button', { name: /Play again/ }).isVisible() ? 'all-done' : 'take'
        if (card === 'all-done') {
          playAgainWorks = false
          await press(/Play again/)
          await expect(page.getByRole('button', { name: /Back to modules/ })).toHaveCount(0, { timeout: 10_000 })
          playAgainWorks = true
          // Fresh device store, then reload: the init script re-seeds round 9.
          await page.evaluate(() => new Promise(r => { const q = indexedDB.deleteDatabase('milo'); q.onsuccess = q.onerror = q.onblocked = r }))
          await page.reload()
          await play()
          if (!reachedEnd) throw new Error('could not get back to the end card after Play again')
        }
        backWorks = false
        await press(/Back to modules/)
        await expect(page).toHaveURL(/\/modules/, { timeout: 15_000 })
        backWorks = true
      }
    } finally { record() }

    expect(crashed, `chapter crashed to the error screen: ${errors.join(' | ')}`).toBe(false)
    expect(reachedEnd, `could not look: the monkey never reached the end card in ${PLAY_MS / 1000}s`).toBe(true)
    expect(coverList, 'controls covered by another element').toEqual([])
    expect(errors, 'uncaught page errors').toEqual([])
  })
}

/**
 * The nudge (src/features/chapters/useNudge.ts): the next thing to tap moves. Written against two chapters whose
 * screens say exactly what is next: Bead Shop asks for one of three beads (choices → all wiggle when idle, never the
 * chrome; a tap stops it), Home Time asks to send N home then Ready (work done → Ready bounces).
 */
test.describe('nudge', () => {
  const open = async (page: Page, id: string) => {
    await seedSession(page)
    await page.addInitScript(({ learner, id }) => {
      sessionStorage.setItem('milo_active_learner', JSON.stringify({ id: learner, display_name: 'E2E', age_group: '3-5' }))
      localStorage.setItem(`milo-chres-${learner}-${id}`, JSON.stringify({ round: 3, correct: 2, wrong: 1, seen: [], asked: [], at: Date.now() }))
    }, { learner: 'e2e-nudge', id })
    await page.goto(`/game?c=${id}`)
  }
  const nudged = (page: Page, cls: string) => page.evaluate(c => [...document.querySelectorAll(`.${c}`)].map(e => e.getAttribute('aria-label') || (e as HTMLElement).innerText.trim()), cls)

  test('choices wiggle when the child is idle, all alike, and stop on a tap', async ({ page }, info) => {
    test.skip(info.project.use.isMobile === true && (info.project.use.viewport?.height ?? 0) > (info.project.use.viewport?.width ?? 0), 'portrait phone asks to rotate')
    await open(page, 'patterns')
    // The make picker comes first (isVisible does not wait — waitFor does).
    const pick = page.getByRole('button', { name: /A necklace/ })
    await pick.waitFor({ timeout: 20_000 })
    if (info.project.use.hasTouch) await pick.tap(); else await pick.click()
    await expect(page.getByText('What comes next?')).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(6000)   // idle: longer than the hook's 4 s
    const picks = await nudged(page, 'kg2-nudge-pick')
    expect(picks.filter(p => / bead$/.test(p)).length, `wiggling: ${picks.join(', ')}`).toBe(3)
    expect(picks.filter(p => /menu|hear it again/i.test(p)), 'chrome must never be nudged').toEqual([])
    await page.locator('.kg2-nudge-pick').first().dispatchEvent('pointerdown')
    expect(await nudged(page, 'kg2-nudge-pick')).toEqual([])
  })

  test('the commit bounces once the screen\'s work is done', async ({ page }, info) => {
    test.skip(info.project.use.isMobile === true && (info.project.use.viewport?.height ?? 0) > (info.project.use.viewport?.width ?? 0), 'portrait phone asks to rotate')
    await open(page, 'matchingQuantities')
    await expect(page.getByRole('button', { name: /Ready/ })).toBeVisible({ timeout: 20_000 })
    expect(await nudged(page, 'kg2-nudge-go'), 'no bounce before any work').toEqual([])
    const send = page.locator('button[aria-label^="send "][aria-label$=" home"]:not([disabled])').first()
    const box = await send.boundingBox()
    if (info.project.use.hasTouch) await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2)
    else await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.waitForTimeout(3000)   // a pause after working: longer than the hook's 2 s
    expect((await nudged(page, 'kg2-nudge-go')).some(t => /Ready/.test(t)), 'Ready should bounce').toBe(true)
  })
})
