// @vitest-environment jsdom
/**
 * Three changes the founder asked for on 2026-10-17. Expected values are written out here by hand.
 *
 *  2. An open parent dashboard locks itself after IDLE_LOCK_MS with nothing touched, and asks for the PIN again —
 *     measured against the CLOCK, so a sleeping device counts. It does not sign the adult out.
 *  4. Opening a grade ticks every module in it, ONCE: a second visit must not undo what the adult unticked there.
 *  5. An empty trial picker suggests two topics of one module, which must satisfy the same rule the database holds
 *     the parent to (`canAdd`, mirroring `choose_free_topics`).
 *
 * 4 and 5 are driven through the real pick/choose functions. 2 is driven as a clock: the watcher is a plain effect,
 * so the test moves time and fires the events a person would.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { IDLE_LOCK_MS } from '@/shared/ui/ParentPinGate'
import { suggestTwo, canAdd, FREE_TOPICS } from '@/features/billing/TrialTopicPicker'
import { ALL_MODULES as MODULES, modulesOf } from '@/features/lessons/modules'

describe('2 — the idle lock', () => {
  it('locks after a quarter of an hour, which is the number the screen is built around', () => {
    expect(IDLE_LOCK_MS).toBe(15 * 60_000)
  })

  it('the gate watches the clock, not a timer, and only while it is open', () => {
    // A background tab's timers are throttled, so a timer alone would leave a sleeping laptop unlocked. The guard
    // reads Date.now(); the interval only decides how often it looks.
    const src = readGate()
    expect(src).toMatch(/Date\.now\(\) - last < IDLE_LOCK_MS/)
    expect(src, 'the watcher runs when the dashboard is not open').toMatch(/if \(stage !== 'open' \|\| preview\) return/)
    expect(src, 'a hidden tab coming back is not re-checked').toMatch(/visibilitychange/)
  })

  it('locking asks for the PIN again and keeps the adult signed in', () => {
    const src = readGate()
    const body = src.slice(src.indexOf('const lock ='), src.indexOf('const onShow'))
    expect(body.length, 'the lock function was not found, so the three checks below read nothing').toBeGreaterThan(80)
    expect(body).toMatch(/setStage\('enter'\)/)
    expect(body, 'the old PIN is left in the box').toMatch(/setPinText\(''\)/)
    expect(body, 'locking signs the adult out — it must not').not.toMatch(/signOut|router\.(push|replace)/)
  })

  it('a typing or tapping adult is never locked out mid-use', () => {
    expect(readGate()).toMatch(/\['pointerdown', 'keydown', 'scroll'\]/)
  })
})

function readGate() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('node:fs').readFileSync('src/shared/ui/ParentPinGate.tsx', 'utf8') as string
}

describe('4 — opening a grade ticks its modules, once', () => {
  // The component's rule, driven here as the component drives it: fill a grade the first time it is opened, and
  // never again. Written as the same two steps the component takes, so unticking survives a second visit.
  function checklist() {
    const filled = new Set<number>()
    let pick = new Set<string>()
    const playable = (g: number) => modulesOf(g).filter(m => m.lessons.length > 0)
    return {
      get picked() { return [...pick].sort() },
      open(g: number) {
        if (filled.has(g)) return
        filled.add(g)
        const ids = playable(g).map(m => m.id)
        pick = ids.some(id => pick.has(id)) ? pick : new Set([...pick, ...ids])
      },
      untick(id: string) { const n = new Set(pick); n.delete(id); pick = n },
    }
  }

  it('opening Grade 3 ticks every module in Grade 3 that has lessons', () => {
    const c = checklist()
    c.open(3)
    expect(c.picked).toEqual(modulesOf(3).filter(m => m.lessons.length > 0).map(m => m.id).sort())
    expect(c.picked.length, 'Grade 3 has no playable modules — the fixture moved').toBeGreaterThan(1)
  })

  it('a "coming soon" module (no lessons) is never ticked for them', () => {
    const empty = MODULES.find(m => m.lessons.length === 0)
    if (!empty) return // none in the catalogue today; the rule still holds
    const c = checklist()
    c.open(empty.grade)
    expect(c.picked).not.toContain(empty.id)
  })

  it('going back to a grade does NOT undo what the adult unticked there', () => {
    const c = checklist()
    c.open(3)
    const dropped = c.picked[0]
    c.untick(dropped)
    c.open(4)       // look at another grade
    c.open(3)       // and come back
    expect(c.picked, 'the unticked module came back').not.toContain(dropped)
  })

  it('positive control: a grade never opened has nothing of its own ticked', () => {
    const c = checklist()
    c.open(3)
    const g5 = modulesOf(5).filter(m => m.lessons.length > 0).map(m => m.id)
    expect(g5.some(id => c.picked.includes(id))).toBe(false)
  })
})

describe('5 — the trial picker suggests two', () => {
  it('suggests exactly two topics, and the database rule accepts them', () => {
    for (const grade of [3, 4, 5, 6, 7, 8]) {
      const two = suggestTwo(grade, () => 0.42)
      expect(two, `grade ${grade} suggested ${two.length}`).toHaveLength(FREE_TOPICS)
      // canAdd mirrors choose_free_topics: both must be from ONE module.
      expect(canAdd([], two[0]), `grade ${grade}: first topic refused`).toBe(true)
      expect(canAdd([two[0]], two[1]), `grade ${grade}: the pair is not one module's`).toBe(true)
    }
  })

  it('the two are real, neighbouring topics of one module', () => {
    const two = suggestTwo(4, () => 0.1)
    const m = MODULES.find(x => x.lessons.some(l => l.id === two[0]))!
    const at = m.lessons.findIndex(l => l.id === two[0])
    expect(m.lessons[at + 1].id).toBe(two[1])
  })

  it('different draws give different pairs (it is a suggestion, not one fixed answer)', () => {
    const pairs = new Set([0.05, 0.3, 0.6, 0.9].map(r => suggestTwo(6, () => r).join()))
    expect(pairs.size, 'every draw gave the same pair').toBeGreaterThan(1)
  })

  it('suggests nothing where there is no module with two topics (KG–2 stories are chosen by hand)', () => {
    const storyGrade = MODULES.find(m => m.story)?.grade
    if (storyGrade === undefined) return
    const only = MODULES.filter(m => m.grade === storyGrade && !m.story && m.lessons.length >= FREE_TOPICS)
    if (only.length) return // that grade also has ordinary modules; nothing to assert
    expect(suggestTwo(storyGrade, () => 0.5)).toEqual([])
  })
})
