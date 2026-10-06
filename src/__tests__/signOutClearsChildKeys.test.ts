/**
 * Sign-out clears EVERY per-child key from the device, except a child with an upload still waiting (founder,
 * 2026-09-28). signOutClearsProgress.test.ts covers the three topic keys over the real kv in its localStorage mode;
 * this one covers every key shape, with kv held apart from localStorage as it is on a device where IndexedDB works —
 * the usual case, and the one where a kv-only sweep would leave the localStorage keys behind.
 *
 * Driven through the REAL `signOut` and the real stores that write each key; only the network and kv's backing store
 * are stubbed. Three children:
 *   A — nothing waiting                        → none of A's keys may remain;
 *   B — an answer waiting in the lesson queue   → all of B's keys remain, and the queue;
 *   C — a class-exercise result waiting         → all of C's keys remain, and the pending list.
 * The keys that must remain are WRITTEN OUT below, by hand, as the stores' key shapes are meant to be — a store that
 * changes its shape fails here rather than silently escaping the sweep.
 * Last, the published doc 08's per-child local-storage rows say "Until you sign out": each is driven through sign-out.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const world = vi.hoisted(() => ({ session: null as null | string, offline: false, kv: new Map<string, string>() }))
vi.mock('@/infra/storage/kv', () => ({
  kv: {
    ready: async () => {}, mode: () => 'idb' as const,
    get: (k: string) => world.kv.get(k) ?? null, set: (k: string, v: string) => { world.kv.set(k, v) },
    keys: () => [...world.kv.keys()], remove: (k: string) => { world.kv.delete(k) },
  },
}))
vi.mock('@/data/repositories/_shared', async (orig) => {
  const actual = await orig<typeof import('@/data/repositories/_shared')>()
  const rpc = async () => {
    if (world.offline) throw new TypeError('Failed to fetch')
    return { error: null }
  }
  const auth = {
    getSession: async () => ({ data: { session: world.session ? { user: { id: world.session } } : null } }),
    signOut: async () => { world.session = null; return { error: null } },
  }
  return { ...actual, db: () => ({ rpc, auth }) }
})
vi.mock('@/data/auth', () => ({ logAuthEvent: async () => {} }))

const { signOut } = await import('@/data/repositories/profile')
const { syncLesson, flushLessonSync } = await import('@/infra/storage/lessonSync')
const { saveStanding } = await import('@/infra/storage/lessonStanding')
const { markLessonDone } = await import('@/infra/storage/lessonProgress')
const { saveRun } = await import('@/infra/storage/lessonRun')
const { markLessonSeen } = await import('@/infra/storage/lessonSeen')
const { markNudgeShown } = await import('@/infra/storage/nudgeSeen')
const { setChapterResume } = await import('@/infra/storage/chapterResume')
const { setLastPlayed } = await import('@/infra/storage/lastPlayed')
const { setActivePlan } = await import('@/infra/storage/activePlan')
const { saveTextSize } = await import('@/infra/storage/textSize')
const { savePrefs, loadPrefs } = await import('@/features/dashboard/prefs')

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const C = '33333333-3333-4333-8333-333333333333'
const ADULT = '99999999-9999-4999-8999-999999999999'   // an account id is a UUID too: its prefs must not be swept
const run = { asked: 3, recent: ['q'], current: { problem: { text: 'q', answer: 1, picture: { kind: 'eq' as const, text: '' } }, from: 'g3m1-t1' }, review: null }
const PENDING = [{ learnerId: C, classId: 'class-1', exerciseId: 'ex-1', outcomes: [] }]

Object.defineProperty(window, 'location', { value: { href: '' }, writable: true, configurable: true })
// The person confirms "sign out anyway" when work is still waiting (profile.ts signOut; supportSync.test.ts).
beforeEach(() => { world.kv.clear(); localStorage.clear(); sessionStorage.clear(); world.session = 'parent'; world.offline = false; vi.spyOn(window, 'confirm').mockReturnValue(true) })

const kvKeys = () => [...world.kv.keys()].sort()
const lsKeys = () => Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!).sort()

// Every per-child key, for one child — by hand. The last three kv keys and the two checkup keys are no longer written
// by anything, but devices used before 20 September 2026 still hold them (the old profile store carried the child's name).
const kvOf = (L: string) => [
  `milo-chlvl-${L}-counting`,
  `milo-chres-${L}-counting`,
  `milo-diag-resume-${L}`,
  `milo-last-played-${L}`,
  `milo-lesson-${L}-counting`,
  `milo-newflow-done-${L}-g3m1-t1`,
  `milo-newflow-run-${L}-g3m1-t1`,
  `milo-newflow-standing-${L}-g3m1-t1`,
  `milo-nudge-${L}-g3m1-t2`,
  `milo-profile-${L}`,
]
const lsOf = (L: string) => [`exercise-done:${L}:ex-1`, `milo_active_plan_${L}`, `milo_checkup_done_${L}`, `milo_checkup_skips_${L}`]

async function seed() {
  for (const L of [A, B, C]) {
    markLessonDone(L, 'g3m1-t1'); saveStanding(L, 'g3m1-t1', { level: 2, streak: 1, mastered: false }); saveRun(L, 'g3m1-t1', run)
    markLessonSeen(L, 'counting'); markNudgeShown(L, 'g3m1-t2')
    setChapterResume(L, 'counting', { round: 3, correct: 2, wrong: 1, seen: [], asked: [] }); setLastPlayed(L, 'counting')
    setActivePlan(L, '3-5', ['counting'])
    localStorage.setItem(`exercise-done:${L}:ex-1`, '1')   // ExerciseHome's markDone is not exported; its key, by hand
    // Left by the code deleted on 20 September 2026 (nothing writes these now), as it wrote them:
    world.kv.set(`milo-profile-${L}`, JSON.stringify({ state: { profile: { name: 'Sam' } } }))
    world.kv.set(`milo-chlvl-${L}-counting`, '2'); world.kv.set(`milo-diag-resume-${L}`, '{}')
    localStorage.setItem(`milo_checkup_done_${L}`, '1'); localStorage.setItem(`milo_checkup_skips_${L}`, '1')
  }
  // Signed out (doc 08), the old profile store's no-child fallback, and the adult's own: never a child's.
  world.kv.set('milo-profile-v2', '{}')
  markLessonDone(null, 'g3m1-t1'); saveStanding(null, 'g3m1-t1', { level: 1, streak: 0, mastered: false }); markLessonSeen(null, 'counting')
  localStorage.setItem('exercise-done:none:ex-1', '1')
  savePrefs(ADULT, { ...loadPrefs(ADULT), seen: ['first'] }); saveTextSize('large')
  sessionStorage.setItem('milo_active_learner', JSON.stringify({ id: A }))
  // B: an answer waiting in the lesson queue. C: a class-exercise result waiting.
  world.offline = true; syncLesson(B, 'g3m1-t2', 'first'); await flushLessonSync(); world.offline = false
  localStorage.setItem('exercise-results-pending', JSON.stringify(PENDING))
}

describe('sign-out clears every per-child key on the device, except a child with an upload waiting', () => {
  it('control: the seed wrote every key shape for the child with nothing waiting', async () => {
    await seed()
    expect(kvKeys().filter(k => k.includes(A)), 'a store did not write the key shape this test expects').toEqual(kvOf(A))
    expect(lsKeys().filter(k => k.includes(A))).toEqual(lsOf(A))
    expect(JSON.parse(world.kv.get('milo-lesson-sync-queue')!).map((x: { learnerId: string }) => x.learnerId), 'B has an answer waiting').toEqual([B])
  })

  it('after sign-out, exactly these keys remain', async () => {
    await seed()
    await signOut()

    expect(kvKeys(), 'kv (IndexedDB) after sign-out').toEqual([
      ...kvOf(B), ...kvOf(C),
      'milo-lesson-device-counting',
      'milo-lesson-sync-queue',
      'milo-newflow-done-device-g3m1-t1',
      'milo-newflow-standing-device-g3m1-t1',
      'milo-profile-v2',
      'milo-sync-status',   // the device's last upload time and error code, for support: no child in it (syncStatus.ts)
    ].sort())
    expect(lsKeys(), 'localStorage after sign-out').toEqual([
      ...lsOf(B), ...lsOf(C),
      `al-dash-prefs:${ADULT}`,
      'al-text-size',
      'exercise-done:none:ex-1',
      'exercise-results-pending',
    ].sort())
    expect(sessionStorage.getItem('milo_active_learner'), 'the tab still names a child').toBeNull()
  })

  it('POSITIVE TWIN: what is waiting is left exactly as it was', async () => {
    await seed()
    const queue = world.kv.get('milo-lesson-sync-queue')
    await signOut()
    expect(world.kv.get('milo-lesson-sync-queue'), 'the lesson queue changed').toBe(queue)
    expect(JSON.parse(localStorage.getItem('exercise-results-pending')!), 'the pending class-exercise answers changed').toEqual(PENDING)
    expect(world.kv.get(`milo-newflow-run-${B}-g3m1-t1`), 'B\'s practice run changed').toBe(JSON.stringify(run))
  })
})

describe('doc 08 (published): the per-child local-storage rows it says go at sign-out do go', () => {
  const doc = readFileSync(resolve(__dirname, '../../docs/legal/08-cookie-and-tracking-notice.md'), 'utf8')
  const rows = doc.split('\n').filter(l => /^\| `[^`]*<child id>/.test(l)).map(l => l.split('|').map(c => c.trim()))

  it('every row naming a <child id> key says it lasts until sign-out, and sign-out removes that key', async () => {
    expect(rows.map(r => r[1]), 'control: the rows this reads').toEqual(['`exercise-done:<child id>:<exercise id>`', '`milo_active_plan_<child id>`'])
    for (const r of rows) {
      expect(r[4], `${r[1]}: the page no longer says it goes at sign-out`).toMatch(/^Until you sign out/)
      localStorage.setItem(r[1].replace(/`/g, '').replace('<child id>', A).replace('<exercise id>', 'ex-9'), '1')
    }
    expect(lsKeys(), 'control: the keys were written').toHaveLength(2)
    await signOut()
    expect(lsKeys(), 'the page says these go at sign-out; they stayed').toEqual([])
  })
})
