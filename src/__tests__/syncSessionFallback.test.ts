/**
 * `syncSession` must survive its own migration not being applied yet.
 *
 * ⚠️ MEASURED ON PRODUCTION 2026-09-05. `main` auto-deploys to Vercel, so the commit that started
 * sending `p_started_at` went live before anyone applied the migration creating the 12-argument
 * `sync_session`. PostgREST resolves an RPC by PARAMETER NAMES, so it answered:
 *
 *   {"code":"PGRST202", ... "Could not find the function public.sync_session(...) in the schema
 *    cache"}   HTTP 404
 *
 * `classifySyncError` sees no known SQLSTATE and no "foreign key"/"row-level security" in the
 * message, so it returns 'retry' and the session sits in the offline queue. Nothing was lost — the
 * queue is why — but the server recorded no sessions at all until the migration landed.
 *
 * The fallback makes the client work against BOTH schema versions, which removes the deploy-order
 * constraint rather than documenting it. These tests are the reason it cannot be quietly deleted.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpc = vi.fn()
vi.mock('@/data/repositories/_shared', async (orig) => {
  const actual = await orig<typeof import('@/data/repositories/_shared')>()
  return { ...actual, db: () => ({ rpc }) }
})

const { syncSession } = await import('@/data/repositories/sessions')

const PAYLOAD = {
  learnerId: 'l1', chapter: 'counting' as never, phase: 'practice' as const,
  correctCount: 8, wrongCount: 2, starsEarned: 3, xpEarned: 0, coinsEarned: 0,
  clientId: 'c1', completedAt: '2026-09-05T12:00:00.000Z',
  startedAt: '2026-09-05T11:53:00.000Z',
}
const PGRST202 = { code: 'PGRST202', message: 'Could not find the function public.sync_session(...) in the schema cache' }

beforeEach(() => { rpc.mockReset() })

describe('syncSession against a database without the migration', () => {
  it('retries WITHOUT p_started_at and succeeds', async () => {
    rpc.mockResolvedValueOnce({ error: PGRST202 })   // 12-arg: not in the schema cache
        .mockResolvedValueOnce({ error: null })      // 11-arg: the shape production still has
    expect(await syncSession(PAYLOAD)).toBe('ok')
    expect(rpc).toHaveBeenCalledTimes(2)
    expect(rpc.mock.calls[0][1]).toHaveProperty('p_started_at')
    // the whole point: the retry drops ONLY that argument and keeps the session
    expect(rpc.mock.calls[1][1]).not.toHaveProperty('p_started_at')
    expect(rpc.mock.calls[1][1]).toMatchObject({ p_learner_id: 'l1', p_client_id: 'c1', p_difficulty: 1 })
  })

  it('KNOWN-BAD CONTROL: without the fallback this is a retry, i.e. nothing reaches the server', async () => {
    // classifySyncError's verdict on the REAL error observed from production. If this ever became
    // 'drop', the queue would discard the session and a child's stars would be gone. Imported from
    // the UNMOCKED module, so this asserts the real classifier, not the test's own stub.
    const actual = await vi.importActual<typeof import('@/data/repositories/_shared')>('@/data/repositories/_shared')
    expect(actual.classifySyncError(PGRST202)).toBe('retry')
  })

  it('a genuine failure after the fallback is still reported, not masked', async () => {
    rpc.mockResolvedValueOnce({ error: PGRST202 })
        .mockResolvedValueOnce({ error: { code: '42501', message: 'insufficient_privilege' } })
    expect(await syncSession(PAYLOAD)).toBe('drop')   // RLS denial survives the retry
  })

  it('the normal path calls once and does not retry', async () => {
    rpc.mockResolvedValueOnce({ error: null })
    expect(await syncSession(PAYLOAD)).toBe('ok')
    expect(rpc).toHaveBeenCalledTimes(1)
  })
})
