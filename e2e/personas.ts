import { Page } from '@playwright/test'

// A "kid persona" is a DETERMINISTIC strategy for how a child interacts — NOT an LLM
// agent. Tests must be repeatable, fast, and free; an LLM-driven kid is flaky, slow,
// and costs tokens, so it can never be a regression gate. (A separate LLM "chaos-monkey
// kid" for exploratory fuzzing could exist later — non-gating, run occasionally.)
//
// TWO TIERS:
//  - Robustness personas (below): need NO knowledge of the correct answer. They exercise
//    the double-submit / stale-timer / unmount-cleanup bug class this codebase keeps
//    hitting. Ship today.
//  - Correctness personas (aceKid / strugglerKid / comebackKid): need to answer right or
//    wrong ON PURPOSE, which the app deliberately hides. They require a dev-only test hook
//    exposing the current task's answer (e.g. data-test-answer in preview mode). See
//    e2e/README.md — that's the next slice, an app change, not implemented here.

export interface Persona {
  name: string
  /** Act once against whatever is currently on screen. */
  play(page: Page): Promise<void>
}

const TAPPABLE = 'button:not([disabled]), [role="button"]:not([aria-disabled="true"])'

/** Hammers enabled controls fast — the double-submit / stale-timer-bleed bug class. */
export const rageTapper: Persona = {
  name: 'rageTapper',
  async play(page) {
    const els = page.locator(TAPPABLE)
    const n = Math.min(await els.count(), 6)
    for (let i = 0; i < n; i++) {
      for (let t = 0; t < 3; t++) {
        await els.nth(i).click({ force: true, timeout: 1000 }).catch(() => {})
      }
    }
  },
}

/** Engages briefly, then bails mid-flow — tests unmount cleanup / no dangling timers. */
export const quitterKid: Persona = {
  name: 'quitterKid',
  async play(page) {
    await page.locator(TAPPABLE).first().click({ force: true, timeout: 2000 }).catch(() => {})
    await page.waitForTimeout(1200)
    await page.goto('about:blank')
  },
}

// ── Correctness personas ──────────────────────────────────────────────────────
// These answer right/wrong ON PURPOSE, which the app hides from real users. They
// read the dev-only test hook the frontend added (2026-07-18, see docs/agent-log.md):
//   [data-test-answer] — on the QuestionBoard root; canonical ASCII answer (e.g. "-5")
//                        while a question is live, "" once solved/revealed.
//   [data-test-phase]  — "guided" | "practice" | "solved".
// The hook is emitted only by `next dev` (dead-code-eliminated in any production
// build), so this never leaks the answer to shipped users, and the personas stay
// deterministic without an LLM solving the math.
//
// GOTCHA: AnswerPad buttons DISPLAY a Unicode minus (U+2212 "−") but the hook uses
// ASCII "-". Match by NUMBER, not text: Number(label.replace(/−/g,'-')).

/** What the persona could read/do this turn — lets fixme specs assert phase/action. */
export interface Turn {
  /** null = no live question board on screen (intro / walkthrough / solved). */
  phase: 'guided' | 'practice' | 'solved' | null
  /** ASCII canonical answer while live, else ''. */
  answer: string
  /** true if the persona tapped an AnswerPad choice this turn. */
  acted: boolean
}

async function readBoard(page: Page): Promise<{ phase: Turn['phase']; answer: string }> {
  const board = page.locator('[data-test-answer]').first()
  if ((await board.count()) === 0) return { phase: null, answer: '' }
  const phaseRaw = await board.getAttribute('data-test-phase')
  const answer = (await board.getAttribute('data-test-answer')) ?? ''
  const phase = phaseRaw === 'guided' || phaseRaw === 'practice' || phaseRaw === 'solved' ? phaseRaw : null
  return { phase, answer }
}

// The AnswerPad choices are the enabled buttons whose whole label is a number.
// ponytail: text-is-a-number heuristic (no dedicated data-testid on the pad) — if a
// non-pad numeric button ever appears alongside a live question this could misfire;
// add a data-testid to AnswerPad if that happens.
async function padChoices(page: Page): Promise<Array<{ click: () => Promise<void>; num: number }>> {
  const out: Array<{ click: () => Promise<void>; num: number }> = []
  for (const btn of await page.locator('button:not([disabled])').all()) {
    const label = (await btn.innerText()).trim()
    const num = Number(label.replace(/−/g, '-'))
    if (label !== '' && Number.isFinite(num)) out.push({ click: () => btn.click({ timeout: 1000 }), num })
  }
  return out
}

/**
 * Always taps the CORRECT AnswerPad choice (numeric value === data-test-answer).
 * Meant to prove: consecutive correct answers → mastery early-exit, and (on resume
 * at the top tier) the guided "we do" round being skipped. Acts only on a live
 * guided/practice board; no-op otherwise. Deterministic (one exact match).
 */
export const aceKid = {
  name: 'aceKid',
  async play(page: Page): Promise<Turn> {
    const { phase, answer } = await readBoard(page)
    if ((phase !== 'guided' && phase !== 'practice') || answer === '') return { phase, answer, acted: false }
    const target = Number(answer)
    const hit = (await padChoices(page)).find((c) => c.num === target)
    if (!hit) return { phase, answer, acted: false }
    await hit.click().catch(() => {})
    return { phase, answer, acted: true }
  },
}

/**
 * Always taps a WRONG AnswerPad choice (first choice whose numeric value !==
 * data-test-answer). Meant to prove: a wrong answer warmly REVEALS the correct one via
 * the QuestionBoard (no punitive UI), and difficulty demotes after 3 misses (demotion is
 * hidden from learners → prove it in the adaptive unit tests, not the DOM). If only the
 * correct choice is present it no-ops
 * (acted:false) rather than answer correctly. Deterministic (first wrong in DOM order).
 */
export const strugglerKid = {
  name: 'strugglerKid',
  async play(page: Page): Promise<Turn> {
    const { phase, answer } = await readBoard(page)
    if ((phase !== 'guided' && phase !== 'practice') || answer === '') return { phase, answer, acted: false }
    const target = Number(answer)
    const wrong = (await padChoices(page)).find((c) => c.num !== target)
    if (!wrong) return { phase, answer, acted: false } // only the correct choice on screen
    await wrong.click().catch(() => {})
    return { phase, answer, acted: true }
  },
}

/** Console/page errors that are known environment noise, not real defects. */
export const IGNORED_ERRORS =
  /React DevTools|Autoplay|speechSynthesis|AudioContext|user gesture|not allowed to (start|play)|ResizeObserver loop/i
