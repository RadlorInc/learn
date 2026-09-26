/**
 * BUG-01 + BUG-04 (docs/review/LATENT-BUGS.md): the lesson upload queue is ONE per device, so it can hold a child's
 * answers while nobody, or another account, is signed in — and one refused item must not hold the rest.
 *
 * The stub answers the way production does (20260917112109 lines 8-9 and 98-99): the anon key gets 42501 on every
 * lesson RPC; the function refuses a learner the caller cannot reach with 42501 'forbidden'; the consent gate raises
 * P0C01. `classifySyncError` is the real one.
 *
 * Properties checked: an item is never deleted because the wrong session (or none) flushed it, and it goes up once its
 * owner flushes; a learner whose item is refused or must be retried does not stop other learners' items; for the
 * OWNER, a genuine refusal (learner gone, consent refused) removes that one item and only that one.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const world = vi.hoisted(() => ({
  session: null as null | string, offline: false,
  owns: {} as Record<string, string[]>, consentBlocked: new Set<string>(), flaky: new Set<string>(), delivered: [] as string[],
}))
vi.mock('@/data/repositories/_shared', async (orig) => {
  const actual = await orig<typeof import('@/data/repositories/_shared')>()
  const rpc = async (_fn: string, a: Record<string, unknown>) => {
    if (world.offline) throw new TypeError('Failed to fetch')
    const L = a.p_learner as string
    if (!world.session) return { error: { code: '42501', message: 'permission denied for function record_lesson_progress' } }
    if (!(world.owns[world.session] ?? []).includes(L)) return { error: { code: '42501', message: 'forbidden' } }
    if (world.consentBlocked.has(L)) return { error: { code: 'P0C01', message: 'no granted parental consent' } }
    if (world.flaky.has(L)) return { error: { code: '57014', message: 'canceling statement due to statement timeout' } }
    world.delivered.push(`${L}:${a.p_lesson}`); return { error: null }
  }
  const auth = { getSession: async () => ({ data: { session: world.session ? { user: { id: world.session } } : null } }) }
  return { ...actual, db: () => ({ rpc, auth }) }
})
const { syncLesson, flushLessonSync } = await import('@/infra/storage/lessonSync')
const { saveStanding } = await import('@/infra/storage/lessonStanding')
const { kv } = await import('@/infra/storage/kv')

/** Every item on the device, whoever it belongs to — not the banner's count, which is per account. */
const queued = (): { learnerId: string }[] => JSON.parse(kv.get('milo-lesson-sync-queue') ?? '[]')

beforeEach(() => {
  localStorage.clear(); kv.remove('milo-lesson-sync-queue')
  world.session = null; world.offline = false; world.owns = { parentA: ['kidA'], parentB: ['kidB'] }
  world.consentBlocked.clear(); world.flaky.clear(); world.delivered = []
})

/** `learner` answers a problem while the device is offline, signed in as `session`. */
async function answerOffline(session: string, learner: string, lesson: string) {
  world.session = session; world.offline = true
  saveStanding(learner, lesson, { level: 2, streak: 1, mastered: false })
  syncLesson(learner, lesson, 'first'); await flushLessonSync()
  world.offline = false
}

describe('BUG-01 a queued answer is not deleted because the wrong session flushed it', () => {
  it('POSITIVE CONTROL: flushed by the owning account, the answer goes up and the queue empties', async () => {
    await answerOffline('parentA', 'kidA', 'g3m1-t1')
    expect(queued()).toHaveLength(1)
    await flushLessonSync()
    expect(world.delivered).toEqual(['kidA:g3m1-t1'])
    expect(queued()).toHaveLength(0)
  })

  it('signed out (the /auth page flushes on mount): the answer stays queued, then goes up when its account returns', async () => {
    await answerOffline('parentA', 'kidA', 'g3m1-t1')
    world.session = null
    await flushLessonSync()
    expect(queued(), 'the offline answer was deleted by a flush with no session').toHaveLength(1)
    world.session = 'parentA'
    await flushLessonSync()
    expect(world.delivered).toEqual(['kidA:g3m1-t1'])
    expect(queued()).toHaveLength(0)
  })

  it('an item queued before this fix (no account on it) is not sent, so not deleted, by a flush with no session', async () => {
    // Written out by hand: the exact shape a device updated from the old code still holds.
    kv.set('milo-lesson-sync-queue', JSON.stringify([{ id: 'old-1', learnerId: 'kidA', lessonId: 'g3m1-t1', outcome: 'first', event: 'e-1' }]))
    world.session = null
    await flushLessonSync()
    expect(queued(), 'a pre-fix item was sent with no session and deleted').toHaveLength(1)
    world.session = 'parentA'
    await flushLessonSync()
    expect(world.delivered).toEqual(['kidA:g3m1-t1'])
  })

  it('another account on the same device: A\'s answer is kept for A, and B\'s own answer still goes up', async () => {
    await answerOffline('parentA', 'kidA', 'g3m1-t2')
    world.session = 'parentB'
    saveStanding('kidB', 'g4m1-t1', { level: 1, streak: 0, mastered: false })
    syncLesson('kidB', 'g4m1-t1', 'first'); await flushLessonSync()
    expect(world.delivered).toEqual(['kidB:g4m1-t1'])
    expect(queued().map(x => x.learnerId), 'kidA\'s answer was deleted under the other account').toEqual(['kidA'])
    world.session = 'parentA'
    await flushLessonSync()
    expect(world.delivered).toEqual(['kidB:g4m1-t1', 'kidA:g3m1-t2'])
    expect(queued()).toHaveLength(0)
  })

  it('POSITIVE CONTROL: for the owner, a refused learner (deleted, access removed) drops that one item only', async () => {
    world.owns = { family: ['kidB'] }   // kidA was deleted: the owner's own call is refused 42501 'forbidden'
    world.session = 'family'
    syncLesson('kidA', 'g3m1-t1', 'first'); syncLesson('kidB', 'g4m1-t1', 'first')
    await flushLessonSync(); await flushLessonSync()
    expect(world.delivered).toEqual(['kidB:g4m1-t1'])
    expect(queued()).toHaveLength(0)
  })
})

describe('BUG-04 one learner\'s refused or retried item does not hold the other learners on the device', () => {
  it('a consent refusal (P0C01) on kidA\'s item: kidB\'s answer goes up, and only kidA\'s refused item leaves the queue', async () => {
    world.owns = { family: ['kidA', 'kidB'] }; world.session = 'family'
    world.consentBlocked.add('kidA')
    syncLesson('kidA', 'g3m1-t1', 'first'); await flushLessonSync()
    syncLesson('kidB', 'g4m1-t1', 'first'); await flushLessonSync()
    await flushLessonSync()
    expect(world.delivered, 'kidB was never sent: the queue stops at kidA\'s refusal').toEqual(['kidB:g4m1-t1'])
    expect(queued()).toHaveLength(0)
  })

  it('a retry on kidA\'s item keeps kidA\'s items (in order) and still sends kidB\'s', async () => {
    world.owns = { family: ['kidA', 'kidB'] }; world.session = 'family'
    world.flaky.add('kidA')
    syncLesson('kidA', 'g3m1-t1', 'first'); syncLesson('kidA', 'g3m1-t2', 'first'); syncLesson('kidB', 'g4m1-t1', 'first')
    await flushLessonSync(); await flushLessonSync()
    expect(world.delivered).toEqual(['kidB:g4m1-t1'])
    expect(queued().map(x => x.learnerId)).toEqual(['kidA', 'kidA'])
    world.flaky.clear()
    await flushLessonSync()
    expect(world.delivered).toEqual(['kidB:g4m1-t1', 'kidA:g3m1-t1', 'kidA:g3m1-t2'])
    expect(queued()).toHaveLength(0)
  })
})
