/**
 * The dashboard's reminders (src/features/dashboard/reminders.ts) — the rules the founder signed off in the mockup,
 * driven with the facts the page feeds them. Each expectation is written out here, not derived from the module.
 */
import { describe, it, expect } from 'vitest'
import { childReminders, classReminders, hardestQuestion, byPriority, type ChildFacts } from '@/features/dashboard/reminders'
import { isShown, weekOf, type Prefs } from '@/features/dashboard/prefs'

const NOW = new Date('2026-09-21T12:00:00Z')
const title = (id: string) => ({ 'g5m1-t2': 'Estimate products', 'g5m1-t3': 'Round to ten' } as Record<string, string>)[id] ?? id
const kid = (over: Partial<ChildFacts> = {}): ChildFacts => ({
  id: 'a', name: 'Aarav', owner: true, login: 'aarav7', gameEnabled: true, lessonIds: null, due: {}, isDone: () => false,
  lastProblemAt: '2026-09-20T10:00:00Z', createdAt: '2026-08-01T00:00:00Z', ...over,
})
const ids = (xs: { id: string }[]) => xs.map(x => x.id)

describe('a child’s reminders', () => {
  it('a child with everything set up and practising yesterday has none', () => {
    expect(childReminders(kid(), '2026-09-21', NOW, title)).toEqual([])
  })

  it('no login → a setup reminder; an unknown login (lookup failed) → nothing, never a false claim', () => {
    expect(ids(childReminders(kid({ login: undefined }), '2026-09-21', NOW, title))).toEqual(['login:a'])
    expect(childReminders(kid({ login: null }), '2026-09-21', NOW, title)).toEqual([])
    // Only the adult who can set it is told to.
    expect(childReminders(kid({ login: undefined, owner: false }), '2026-09-21', NOW, title)).toEqual([])
  })

  it('a due date that passed and is not done → one nudge naming the first, counting the rest; done ones never', () => {
    const r = childReminders(kid({ lessonIds: ['g5m1-t2', 'g5m1-t3'], due: { 'g5m1-t2': '2026-09-19', 'g5m1-t3': '2026-09-20' } }), '2026-09-21', NOW, title)
    expect(r.map(x => x.title)).toEqual(['The due date for “Estimate products” was Sep 19'])
    expect(r[0].detail).toContain('and 1 more')
    expect(r[0].title + r[0].detail).not.toMatch(/late|behind|fail/i)
    expect(childReminders(kid({ lessonIds: ['g5m1-t2'], due: { 'g5m1-t2': '2026-09-19' }, isDone: () => true }), '2026-09-21', NOW, title)).toEqual([])
    expect(childReminders(kid({ lessonIds: ['g5m1-t2'], due: { 'g5m1-t2': '2026-09-21' } }), '2026-09-21', NOW, title)).toEqual([])
  })

  it('quiet for 5+ days → a nudge with the count; never practised → says so; unread points → nothing', () => {
    expect(childReminders(kid({ lastProblemAt: '2026-09-15T12:00:00Z' }), '2026-09-21', NOW, title).map(x => x.title))
      .toEqual(['Aarav hasn’t practised for 6 days'])
    expect(childReminders(kid({ lastProblemAt: '2026-09-17T12:00:00Z' }), '2026-09-21', NOW, title)).toEqual([])
    expect(childReminders(kid({ lastProblemAt: null, createdAt: '2026-09-01T00:00:00Z' }), '2026-09-21', NOW, title).map(x => x.title))
      .toEqual(['Aarav hasn’t started practising yet'])
    // A brand-new child is not nagged on day two.
    expect(childReminders(kid({ lastProblemAt: null, createdAt: '2026-09-20T00:00:00Z' }), '2026-09-21', NOW, title)).toEqual([])
    expect(childReminders(kid({ lastProblemAt: undefined, createdAt: '2026-01-01T00:00:00Z' }), '2026-09-21', NOW, title)).toEqual([])
  })

  it('stuck topic → help; game time off → setup (owner only)', () => {
    expect(ids(childReminders(kid({ stuck: { lessonId: 'g5m1-t3', title: 'Round to ten' } }), '2026-09-21', NOW, title))).toEqual(['stuck:a:g5m1-t3'])
    expect(ids(childReminders(kid({ gameEnabled: false }), '2026-09-21', NOW, title))).toEqual(['game:a'])
    expect(childReminders(kid({ gameEnabled: false, owner: false }), '2026-09-21', NOW, title)).toEqual([])
  })

  it('setup first, then help, then nudges', () => {
    const r = byPriority(childReminders(kid({ login: undefined, stuck: { lessonId: 'g5m1-t3', title: 'x' }, lastProblemAt: '2026-09-01T00:00:00Z' }), '2026-09-21', NOW, title))
    expect(r.map(x => x.kind)).toEqual(['setup', 'help', 'nudge'])
  })
})

describe('a class’s reminders', () => {
  const base = { id: 'c', name: '5-A', paid: true, hasModules: true, exercises: 1, open: [],
    students: [{ id: 's1', name: 'Kabir', login: 'kabir' }, { id: 's2', name: 'Zoya', login: 'zoya' }] }

  it('a set-up class with nothing open has none', () => {
    expect(classReminders(base)).toEqual([])
  })

  it('students without a login; no modules (paid only); no exercises', () => {
    expect(classReminders({ ...base, students: [{ id: 's1', name: 'Kabir', login: undefined }, { id: 's2', name: 'Zoya', login: 'zoya' }] }).map(x => x.title))
      .toEqual(['Kabir in 5-A has no login'])
    expect(ids(classReminders({ ...base, hasModules: false }))).toEqual(['mods:c'])
    expect(classReminders({ ...base, hasModules: false, paid: false })).toEqual([])
    expect(ids(classReminders({ ...base, exercises: 0 }))).toEqual(['noex:c'])
  })

  it('an open exercise not everyone has taken, and the question most got wrong', () => {
    const r = classReminders({ ...base, open: [{ id: 'x', title: 'Exercise 1', done: 1, hardQuestion: { n: 3, pct: 33 } }] })
    expect(r.map(x => x.id)).toEqual(['hard:c:x', 'open:c:x'])
    expect(r[1].title).toBe('1 of 2 in 5-A have taken “Exercise 1”')
    expect(classReminders({ ...base, open: [{ id: 'x', title: 'Exercise 1', done: 2 }] })).toEqual([])
  })

  it('hardestQuestion: under half right first time, at least 3 took it, worst wins', () => {
    expect(hardestQuestion([{ right: 3, of: 4 }, { right: 1, of: 4 }, { right: 0, of: 2 }, { right: 1, of: 3 }])).toEqual({ n: 2, pct: 25 })
    expect(hardestQuestion([{ right: 2, of: 4 }, { right: 0, of: 2 }])).toBeUndefined()
  })
})

describe('the adult’s choices', () => {
  const p: Prefs = { snoozed: { a: NOW.getTime() + 1000 }, hidden: ['b'], off: ['nudge'], lastVisit: null, recapWeek: null, seen: [] }
  it('snoozed, hidden and switched-off kinds are not shown; the rest are', () => {
    expect(isShown(p, { id: 'a', kind: 'setup' }, NOW.getTime())).toBe(false)
    expect(isShown(p, { id: 'a', kind: 'setup' }, NOW.getTime() + 2000)).toBe(true)
    expect(isShown(p, { id: 'b', kind: 'setup' }, NOW.getTime())).toBe(false)
    expect(isShown(p, { id: 'c', kind: 'nudge' }, NOW.getTime())).toBe(false)
    expect(isShown(p, { id: 'c', kind: 'help' }, NOW.getTime())).toBe(true)
  })
  it('weekOf: Monday starts a week (the recap shows once per week)', () => {
    expect(weekOf(new Date(2026, 8, 20))).toBe('2026-W38')   // Sunday
    expect(weekOf(new Date(2026, 8, 21))).toBe('2026-W39')   // Monday
    expect(weekOf(new Date(2026, 8, 27))).toBe('2026-W39')
  })
})
