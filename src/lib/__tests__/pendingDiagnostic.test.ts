import { describe, it, expect, beforeEach } from 'vitest'
import { stashPendingDiagnostic, peekPendingDiagnostic, takePendingDiagnostic } from '../pendingDiagnostic'
import type { PendingDiagnostic } from '../pendingDiagnostic'

const base: PendingDiagnostic = {
  band: '9-11', rootGap: 'x', secondGap: null, blocked: [], strengths: [], workingLevel: '',
  planSkills: [], planChapters: ['bignum'], items: [], clientId: '11111111-1111-4111-8111-111111111111',
}

describe('pendingDiagnostic', () => {
  beforeEach(() => localStorage.clear())

  it('peek does not clear; take clears (one-shot)', () => {
    stashPendingDiagnostic(base)
    expect(peekPendingDiagnostic()?.band).toBe('9-11')
    expect(peekPendingDiagnostic()?.band).toBe('9-11')   // still present after peek
    expect(takePendingDiagnostic()?.band).toBe('9-11')
    expect(peekPendingDiagnostic()).toBeNull()           // consumed by take
  })

  it('an expired stash is dropped (TTL)', () => {
    stashPendingDiagnostic(base)
    const raw = JSON.parse(localStorage.getItem('milo_pending_diagnostic')!)
    raw.savedAt = Date.now() - 15 * 24 * 3600 * 1000       // 15 days old (> 14d TTL)
    localStorage.setItem('milo_pending_diagnostic', JSON.stringify(raw))
    expect(peekPendingDiagnostic()).toBeNull()
  })
})
