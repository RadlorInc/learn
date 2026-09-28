/**
 * A NEW CHILD IS ATTESTED AGAINST THE NOTICE THE ADD-A-CHILD SHEET SHOWS (notice-v7, founder 2026-09-28) — once the
 * database lists it. Until its migration is applied (the app deploys first on this repo), the account consent's own
 * version, which is exactly what the app sent before and what the database then requires (equal, not newer).
 * Versions written out by hand.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const listed = vi.hoisted(() => ({ rows: [] as { version: string }[], error: null as null | { code: string }, asked: [] as string[] }))
vi.mock('@/data/supabase/client', () => ({
  createClient: () => ({ from: (t: string) => ({ select: () => ({ eq: async (_c: string, v: string) => {
    listed.asked.push(`${t}:${v}`); return { data: listed.error ? null : listed.rows.filter(r => r.version === v), error: listed.error }
  } }) }) }),
}))
const { attestationVersion } = await import('@/features/consent/consentState')

beforeEach(() => { listed.rows = []; listed.error = null; listed.asked = [] })

describe('the attestation version for a new child', () => {
  it('the database lists notice-v7: a v6 parent attests the new child against notice-v7', async () => {
    listed.rows = [{ version: 'notice-v6' }, { version: 'notice-v7' }]
    expect(await attestationVersion('notice-v6')).toBe('notice-v7')
    expect(listed.asked).toEqual(['consent_notice_versions:notice-v7'])
  })
  it('the database does not list it yet: the consent\'s own version, as before', async () => {
    listed.rows = [{ version: 'notice-v6' }]
    expect(await attestationVersion('notice-v6')).toBe('notice-v6')
  })
  it('the read fails: the consent\'s own version (never a version the database may not know)', async () => {
    listed.error = { code: '57014' }
    expect(await attestationVersion('notice-v6')).toBe('notice-v6')
  })
})
