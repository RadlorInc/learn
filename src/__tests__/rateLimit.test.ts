/**
 * The public POST endpoints' rate limit. Small, but it guards two open, unauthenticated writes —
 * one to the database, one to a (soon) paid monitoring sink — so the branches are worth pinning.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { callerKey, overLimit, __resetRateLimit } from '@/app/api/_rateLimit'

const req = (ip?: string) =>
  new Request('https://x.test/api/lead', { headers: ip ? { 'x-forwarded-for': ip } : {} })

beforeEach(() => { __resetRateLimit(); vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('rate limit', () => {
  it('allows up to the limit and blocks the one after', () => {
    const k = 'lead:1.2.3.4'
    for (let i = 0; i < 6; i++) expect(overLimit(k, 6, 60_000), `call ${i + 1}`).toBe(false)
    expect(overLimit(k, 6, 60_000), 'the 7th').toBe(true)
  })

  it('the window really expires', () => {
    const k = 'lead:1.2.3.4'
    for (let i = 0; i < 7; i++) overLimit(k, 6, 60_000)
    vi.advanceTimersByTime(60_001)
    expect(overLimit(k, 6, 60_000), 'a fresh window').toBe(false)
  })

  it('⚠️ one abuser cannot lock anybody else out', () => {
    // The bug this exists to prevent: bucketing by a constant (or by a shared fallback key) means
    // the first flood blocks every visitor. Keys must be independent.
    for (let i = 0; i < 20; i++) overLimit('lead:9.9.9.9', 6, 60_000)
    expect(overLimit('lead:1.1.1.1', 6, 60_000)).toBe(false)
  })

  it('⚠️ the two endpoints do not share a bucket', () => {
    // Same visitor, different salt: a crash-reporting burst must not eat their one lead submission.
    const ip = '5.5.5.5'
    for (let i = 0; i < 40; i++) overLimit(callerKey(req(ip), 'err'), 30, 60_000)
    expect(overLimit(callerKey(req(ip), 'lead'), 6, 60_000)).toBe(false)
  })

  it('takes the FIRST x-forwarded-for entry — the client, not the last proxy', () => {
    expect(callerKey(req('203.0.113.7, 70.41.3.18, 150.172.238.178'), 'lead')).toBe('lead:203.0.113.7')
  })

  it('⚠️ an unidentifiable caller gets a unique key, never a shared one', () => {
    // A constant fallback would put every IP-less caller in one bucket, which is the lockout above
    // arriving by the back door.
    const a = callerKey(req(), 'lead'), b = callerKey(req(), 'lead')
    expect(a).not.toBe(b)
    for (let i = 0; i < 20; i++) overLimit(a, 6, 60_000)
    expect(overLimit(b, 6, 60_000)).toBe(false)
  })

  it('⚠️ traffic from OTHER callers must not reset a caller mid-window', () => {
    // Found by mutation: making the eviction `hits.clear()` whenever a new key arrives left every
    // other test green, and defeats the limit completely — interleave one fresh IP between calls
    // and the counter is wiped, so an attacker rotating addresses is never limited at all. Counting
    // per key is only meaningful if a key's count survives its neighbours.
    const k = 'lead:7.7.7.7'
    for (let i = 0; i < 6; i++) {
      expect(overLimit(k, 6, 60_000), `call ${i + 1}`).toBe(false)
      overLimit(`lead:11.0.0.${i}`, 6, 60_000)          // a different caller between each one
    }
    expect(overLimit(k, 6, 60_000), 'still counted after the interleaving').toBe(true)
  })

  it('the key map cannot grow without bound', () => {
    for (let i = 0; i < 6_000; i++) overLimit(`lead:10.0.${i >> 8}.${i & 255}`, 6, 60_000)
    // Still enforcing after the eviction, which is the part a naive `clear()` on every call breaks.
    const k = 'lead:8.8.8.8'
    for (let i = 0; i < 6; i++) expect(overLimit(k, 6, 60_000)).toBe(false)
    expect(overLimit(k, 6, 60_000)).toBe(true)
  })
})
