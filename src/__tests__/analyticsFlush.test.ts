/**
 * MAP-07 / BUG-06 — the learner_events flush must remove only what it settled.
 *
 * ⚠️ THE DEFECTS. `flushEvents` awaited the upsert and then `kv.remove`d the WHOLE queue key, so an
 * event `track()` appended while the upsert was in flight was erased without ever being sent. And any
 * non-consent error kept the WHOLE batch, so one row the database can never accept (42501 — e.g.
 * queued for a child of the previous account on this device) failed every later flush too.
 *
 * Properties checked: (1) an event queued during an in-flight flush is sent by a later flush;
 * (2) a batch with one permanently refused row still sends the other rows, and the refused row
 * leaves the queue; plus positive controls (no overlap → all sent; a success empties the queue;
 * a network failure keeps everything).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

type Row = { learner_id: string; event: string; client_id: string }
const db = vi.hoisted(() => ({
  sent: [] as string[],
  calls: 0,
  /** Holds the next upsert open until released. */
  hold: null as null | Promise<void>,
  /** How the database answers a batch; default: accept. */
  answer: (rows: Row[]): { error: null | { code?: string; message: string } } => (void rows, { error: null }),
}))
const learner = vi.hoisted(() => ({ id: 'kidA' }))

vi.mock('@/data/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      upsert: async (rows: Row[]) => {
        db.calls++
        if (db.hold) { const h = db.hold; db.hold = null; await h }
        const r = db.answer(rows)
        if (!r.error) rows.forEach(x => db.sent.push(x.event))
        return r
      },
    }),
  }),
}))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => ({ id: learner.id }) }))

import { track, flushEvents } from '@/infra/analytics'
import { kv } from '@/infra/storage/kv'

const queued = (): string[] => JSON.parse(kv.get('milo_events_queue') ?? '[]').map((e: Row) => e.event)
const tick = () => new Promise(r => setTimeout(r, 0))

beforeEach(async () => {
  await tick()
  db.sent = []; db.calls = 0; db.hold = null; db.answer = () => ({ error: null })
  learner.id = 'kidA'
  kv.remove('milo_events_queue')
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('MAP-07: an event tracked during an in-flight flush', () => {
  it('positive control: two events with no overlap are both sent and the queue is empty', async () => {
    track('a'); await tick()
    track('b'); await tick()
    expect(db.sent).toEqual(['a', 'b'])
    expect(queued()).toEqual([])
  })

  it('is kept and sent by the next flush, not erased unsent', async () => {
    let release!: () => void
    db.hold = new Promise<void>(r => { release = r })
    track('answer_1')                 // starts a flush that waits on the network
    track('answer_2')                 // flush already in flight → only queued
    expect(queued()).toEqual(['answer_1', 'answer_2'])
    release(); await tick(); await tick()
    expect(queued(), 'answer_2 was removed from the queue without being sent').toEqual(['answer_2'])
    await flushEvents()
    expect(db.sent).toEqual(['answer_1', 'answer_2'])
    expect(queued()).toEqual([])
  })
})

describe('BUG-06: one permanently refused event', () => {
  it('positive control: a network failure keeps every event queued', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    track('x'); track('y')
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    db.answer = () => ({ error: { message: 'TypeError: Failed to fetch' } })
    await flushEvents(); await flushEvents()
    expect(db.sent).toEqual([])
    expect(queued()).toEqual(['x', 'y'])
  })

  it('is dropped on its own and does not block later events', async () => {
    // Refuse any batch containing kidA's row with an RLS denial, as the database would.
    db.answer = rows => rows.some(r => r.learner_id === 'kidA')
      ? { error: { code: '42501', message: 'new row violates row-level security policy' } }
      : { error: null }
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    track('old_account_event')
    learner.id = 'kidB'
    track('new_account_event')
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    await flushEvents()
    expect(db.sent, 'the whole batch was refused and held behind the one bad row').toEqual(['new_account_event'])
    expect(queued(), 'the refused row stayed queued and will be retried for ever').toEqual([])
  })
})
