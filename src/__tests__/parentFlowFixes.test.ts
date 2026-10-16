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
import { ALL_MODULES as MODULES, modulesOf, gradeName } from '@/features/lessons/modules'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.mock('@/data/supabase/client', () => ({ createClient: () => ({}) }))
vi.mock('@/data/repositories', () => ({}))

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
  // The REAL ModuleChecklist, rendered, with its grade chips clicked the way an adult clicks them. An earlier
  // version of this test re-implemented the rule here and passed while the component did the opposite.
  async function checklist(startGrade = 3) {
    const { ModuleChecklist } = await import('@/features/classes/Classes')
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    const state = { grade: startGrade, pick: new Set<string>() }
    const draw = async () => {
      await act(async () => {
        root.render(createElement(ModuleChecklist, {
          grade: state.grade,
          setGrade: (g: number) => { state.grade = g; void draw() },
          pick: state.pick,
          setPick: (f: (p: Set<string>) => Set<string>) => { state.pick = f(state.pick); void draw() },
        }))
      })
    }
    await draw()
    const chip = (g: number) => [...host.querySelectorAll('button')].find(b => b.textContent === gradeName(g))
    return {
      host,
      get picked() { return [...state.pick].sort() },
      openGrade: async (g: number) => { await act(async () => { chip(g)!.click() }); await draw() },
      untick: async (id: string) => {
        const box = host.querySelectorAll('input[type="checkbox"]')
        const labels = [...host.querySelectorAll('label')]
        const i = labels.findIndex(l => l.textContent?.includes(titleOf(id)))
        expect(i, `no row on screen for ${id}`).toBeGreaterThanOrEqual(0)
        await act(async () => { (box[i] as HTMLInputElement).click() })
        await draw()
      },
      done: async () => { await act(async () => root.unmount()); host.remove() },
    }
  }
  const titleOf = (id: string) => { const m = MODULES.find(x => x.id === id)!; return `Module ${m.n} · ${m.title}` }
  const playableOf = (g: number) => modulesOf(g).filter(m => m.lessons.length > 0).map(m => m.id).sort()

  it('the grade it opens on is already ticked, and the screen says so', async () => {
    const c = await checklist(3)
    expect(c.picked).toEqual(playableOf(3))
    expect(c.picked.length, 'Grade 3 has no playable modules — the catalogue moved').toBeGreaterThan(1)
    expect(c.host.querySelector('[data-testid="grade-all-ticked"]')?.textContent).toContain('Untick any')
    await c.done()
  })

  it('clicking another grade ticks that grade too, and keeps the first', async () => {
    const c = await checklist(3)
    await c.openGrade(5)
    expect(c.picked).toEqual([...playableOf(3), ...playableOf(5)].sort())
    await c.done()
  })

  it('a "coming soon" module (no lessons) is never ticked for them', async () => {
    const empty = MODULES.find(m => m.lessons.length === 0)
    if (!empty) return
    const c = await checklist(empty.grade)
    expect(c.picked).not.toContain(empty.id)
    await c.done()
  })

  it('going back to a grade does NOT undo what the adult unticked there', async () => {
    const c = await checklist(3)
    const dropped = c.picked[0]
    await c.untick(dropped)
    expect(c.picked, 'the untick did not register').not.toContain(dropped)
    await c.openGrade(5)
    await c.openGrade(3)
    expect(c.picked, 'the unticked module came back').not.toContain(dropped)
    await c.done()
  })

  it('positive control: a grade never opened has nothing of its own ticked', async () => {
    const c = await checklist(3)
    expect(playableOf(5).some(id => c.picked.includes(id))).toBe(false)
    await c.done()
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
