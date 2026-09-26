/**
 * N16 / ARC-02: signing out removes the children's lesson-progress copies (done, standing, practice run) from the device
 * — a parent's or a school's shared computer used to keep every child the dashboard ever showed, for ever.
 *
 * Driven through the REAL `signOut` (data/repositories/profile.ts) over the real kv, lesson stores and upload queue; only
 * the network is stubbed. Properties checked:
 *  - a learner with nothing waiting to upload has no done/standing/run key left after sign-out;
 *  - a learner with an unsent answer keeps its copies AND the queued item, and when its account signs in again the
 *    upload carries the device's real standing (not an empty topic) — the positive twin: clearing must not lose work;
 *  - the signed-out `…-device-…` keys (doc 08) are untouched;
 *  - no file but profile.ts calls `auth.signOut`, so no sign-out path can skip the clear.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const world = vi.hoisted(() => ({ session: null as null | string, offline: false, sent: [] as Record<string, unknown>[] }))
vi.mock('@/data/repositories/_shared', async (orig) => {
  const actual = await orig<typeof import('@/data/repositories/_shared')>()
  const rpc = async (_fn: string, a: Record<string, unknown>) => {
    if (world.offline) throw new TypeError('Failed to fetch')
    if (!world.session) return { error: { code: '42501', message: 'permission denied' } }
    world.sent.push(a); return { error: null }
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
const { kv } = await import('@/infra/storage/kv')

const A = '11111111-1111-4111-8111-111111111111'   // synced: nothing waiting
const B = '22222222-2222-4222-8222-222222222222'   // answered offline: one upload waiting
const run = { asked: 3, recent: ['q'], current: { problem: { text: 'q', answer: 1, picture: { kind: 'eq' as const, text: '' } }, from: 'g3m1-t1' }, review: null }
const mirrors = (id: string) => kv.keys().filter(k => /^milo-newflow-(done|standing|run)-/.test(k) && k.includes(id))
const queued = (): { learnerId: string }[] => JSON.parse(kv.get('milo-lesson-sync-queue') ?? '[]')

// jsdom cannot navigate; signOut ends on `window.location.href = '/auth'`.
Object.defineProperty(window, 'location', { value: { href: '' }, writable: true, configurable: true })
beforeEach(() => { localStorage.clear(); world.session = 'parent'; world.offline = false; world.sent = [] })

function seed() {
  for (const L of [A, B]) {
    markLessonDone(L, 'g3m1-t1'); saveStanding(L, 'g3m1-t1', { level: 2, streak: 1, mastered: false }); saveRun(L, 'g3m1-t1', run)
  }
  saveStanding(null, 'g3m1-t2', { level: 1, streak: 0, mastered: false }); markLessonDone(null, 'g3m1-t2')
}

describe('N16: sign-out clears the children\'s progress copies, never unsent work', () => {
  it('a synced learner\'s copies are gone; the one with an unsent answer keeps them and its queued item', async () => {
    seed()
    world.offline = true
    saveStanding(B, 'g3m1-t2', { level: 3, streak: 2, mastered: false }); syncLesson(B, 'g3m1-t2', 'first'); await flushLessonSync()
    world.offline = false
    expect(mirrors(A), 'control: A was seeded').toHaveLength(3)
    expect(queued().map(x => x.learnerId), 'control: B has an upload waiting').toEqual([B])

    await signOut()

    expect(mirrors(A), 'a synced child\'s progress stayed on the device after sign-out').toEqual([])
    expect(mirrors(B).length, 'the child with unsent work lost its device copy').toBe(4)
    expect(queued().map(x => x.learnerId), 'the unsent answer was removed from the queue').toEqual([B])
    expect(kv.get('milo-newflow-standing-device-g3m1-t2'), 'a signed-out (device) key was touched').not.toBeNull()
    expect(kv.get('milo-newflow-done-device-g3m1-t2')).toBe('1')
  })

  it('POSITIVE TWIN: when that account signs in again, the kept answer goes up with the device\'s real standing', async () => {
    seed()
    world.offline = true
    saveStanding(B, 'g3m1-t2', { level: 3, streak: 2, mastered: false }); syncLesson(B, 'g3m1-t2', 'first'); await flushLessonSync()
    world.offline = false
    await signOut()
    world.session = 'parent'
    await flushLessonSync()
    expect(world.sent).toEqual([expect.objectContaining({ p_learner: B, p_lesson: 'g3m1-t2', p_level: 3, p_streak: 2, p_outcome: 'first' })])
    expect(queued()).toEqual([])
    await signOut()
    expect(mirrors(B), 'once sent, the next sign-out clears it too').toEqual([])
  })
})

describe('N16: every sign-out goes through data/repositories/profile.ts', () => {
  const src = resolve(__dirname, '..')
  const files = (d: string): string[] => readdirSync(d).flatMap(f => {
    const p = join(d, f)
    return statSync(p).isDirectory() ? (f === '__tests__' ? [] : files(p)) : /\.tsx?$/.test(f) ? [p] : []
  })
  const callers = files(src).filter(p => /\.auth\s*\.\s*signOut\s*\(/.test(readFileSync(p, 'utf8'))).map(p => p.slice(src.length + 1))

  it('only profile.ts calls auth.signOut (control: it is found)', () => {
    expect(callers).toEqual(['data/repositories/profile.ts'])
  })
})
