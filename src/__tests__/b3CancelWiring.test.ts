// @vitest-environment node
/**
 * THE DASHBOARD'S TWO DELETIONS ASK THE SERVER TO CANCEL B3 — AFTER THE DELETION, AND ONLY IF IT HAPPENED.
 *
 * The database captures the id in the deletion's own transaction (b3Cancel.test.ts); this is the
 * other half: without the call, a queued cancel waits for the daily cron, i.e. up to a day, and B3
 * is due a day after the grant. After, not before: cancelling first and then failing to delete (a
 * stale sign-in on account close is the common case) would strip a consent that still stands of the
 * second email that makes it valid.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const log: string[] = []
let rpcError: { code?: string; message: string } | null = null

vi.mock('@/data/repositories/_shared', async orig => ({
  ...await orig<typeof import('@/data/repositories/_shared')>(),
  db: () => ({ rpc: async (fn: string) => { log.push(`rpc:${fn}`); return { data: {}, error: rpcError } } }),
}))

beforeEach(() => {
  log.length = 0; rpcError = null
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => { log.push(`${init?.method ?? 'GET'} ${url}`); return new Response('{}') }))
})

const CANCEL = 'POST /api/consent/cancel-second-notice'

describe('"Delete <name>\'s profile"', () => {
  it('deletes, then asks for the cancel', async () => {
    const { deleteLearnerPermanently } = await import('@/data/repositories/learners')
    expect((await deleteLearnerPermanently('l1')).ok).toBe(true)
    expect(log).toEqual(['rpc:delete_learner', CANCEL])
  })
  it('a refused deletion cancels nothing', async () => {
    rpcError = { message: 'not_owner' }
    const { deleteLearnerPermanently } = await import('@/data/repositories/learners')
    await deleteLearnerPermanently('l1')
    expect(log).toEqual(['rpc:delete_learner'])
  })
})

describe('"Close your account"', () => {
  it('closes, then asks for the cancel', async () => {
    const { deleteMyAccount } = await import('@/data/repositories/account')
    expect((await deleteMyAccount('p@x.test')).ok).toBe(true)
    expect(log).toEqual(['rpc:delete_my_account', CANCEL])
  })
  it('a refused close (stale sign-in) cancels nothing — the consent still stands and needs its B3', async () => {
    rpcError = { message: 'reauth_required' }
    const { deleteMyAccount } = await import('@/data/repositories/account')
    expect(await deleteMyAccount('p@x.test')).toEqual({ ok: false, reason: 'reauth_required' })
    expect(log).toEqual(['rpc:delete_my_account'])
  })
  it('a cancel request that fails does not turn a completed close into an error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network down') }))
    const { deleteMyAccount } = await import('@/data/repositories/account')
    expect((await deleteMyAccount('p@x.test')).ok).toBe(true)
  })
})
