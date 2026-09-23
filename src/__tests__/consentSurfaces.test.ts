/**
 * A CONSENT REFUSAL MUST BE TOLD APART FROM A DROPPED NETWORK, AT THE CLIENT.
 *
 * ⚠️ THE DEFECT THIS GUARDS. `flushEvents` used to end `if (error) return 0 // keep queued`, for
 * every error alike. A consent refusal can never be accepted, so that spun the queue for ever while
 * nothing was saved and nothing appeared on any screen or in any log — a parent watching their
 * child use an app that was storing nothing. The two paths are asserted TOGETHER below, because
 * either one alone is satisfied by a build that treats everything the same way.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CONSENT_SQLSTATE } from '@/infra/consentError'

const QUEUE_KEY = 'milo_events_queue'
let upsertResult: { error: { code?: string; message: string } | null } = { error: null }

vi.mock('@/data/supabase/client', () => ({
  createClient: () => ({ from: () => ({ upsert: async () => upsertResult }) }),
}))
vi.mock('@/data/supabase/useLearnerSession', () => ({
  getActiveLearner: () => ({ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', display_name: 'Kid' }),
}))

const store = new Map<string, string>()
vi.mock('@/infra/storage/kv', () => ({
  kv: {
    get: (k: string) => store.get(k) ?? null,
    set: (k: string, v: string) => { store.set(k, v) },
    remove: (k: string) => { store.delete(k) },
  },
}))

beforeEach(() => {
  store.clear()
  vi.stubGlobal('navigator', { onLine: true })
  vi.stubGlobal('crypto', { randomUUID: () => `id-${Math.random()}` })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

/** Queue one event and flush, with the database answering however the caller says. */
async function flushWith(error: { code?: string; message: string } | null) {
  const { track, flushEvents, isConsentBlocked } = await import('@/infra/analytics')
  // Queue it OFFLINE. `track` kicks off a flush of its own, so queueing while the stub still
  // answers "written" empties the queue before the interesting flush ever runs — which is how the
  // first draft of this test measured nothing and reported it as a failure of the code.
  vi.stubGlobal('navigator', { onLine: false })
  track('session_start', {})
  vi.stubGlobal('navigator', { onLine: true })
  upsertResult = { error }
  await flushEvents()
  return { queued: JSON.parse(store.get(QUEUE_KEY) ?? '[]').length, blocked: isConsentBlocked() }
}

describe('a consent refusal surfaces; a network failure retries', () => {
  it('both ends of the contract name the same SQLSTATE', () => {
    /**
     * ⚠️ NOT IMPORTED FROM THE MIGRATION AND NOT GREPPED FROM THE MODULE — the expected value is
     * written out here by hand, so this cannot pass by the code equalling itself. If the migration's
     * errcode is edited, this goes red rather than following it.
     */
    expect(CONSENT_SQLSTATE).toBe('P0C01')
    const sql = readFileSync(resolve(__dirname, '../../supabase/migrations/20260923120000_parental_consent.sql'), 'utf8')
    const raised = [...sql.matchAll(/errcode\s*=\s*'([A-Z0-9]{5})'/g)].map(m => m[1])
    expect(raised.length, 'positive control: no errcode found in the migration at all')
      .toBeGreaterThan(0)
    expect([...new Set(raised)], 'the gate raises a code the client does not recognise').toEqual(['P0C01'])
  })

  it('a network failure keeps the events queued and does not mark the child blocked', async () => {
    const r = await flushWith({ message: 'TypeError: Failed to fetch' })
    expect(r.queued, 'a transient failure must keep the event for a later flush').toBe(1)
    expect(r.blocked).toBe(false)
  })

  it('a consent refusal drops the queue, stops retrying, and is recorded where support can read it', async () => {
    vi.resetModules()
    const { getRecentErrors } = await import('@/infra/storage/lastError')
    const r = await flushWith({ code: CONSENT_SQLSTATE, message: 'no granted parental consent for learner …' })

    expect(r.queued, 'a refused event was kept and will be retried for ever').toBe(0)
    expect(r.blocked, 'nothing can tell a screen that saving is blocked').toBe(true)
    expect(getRecentErrors().some(e => e.src === 'analytics.consent'),
      'the refusal left no local breadcrumb — the support diagnostic block reads these').toBe(true)
    expect(console.error).toHaveBeenCalled()
  })
})
