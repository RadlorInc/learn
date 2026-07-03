import { describe, it, expect, beforeEach } from 'vitest'
import { markCheckupDone, isCheckupCached, clearCheckupCache } from '@/infra/storage/checkup'

describe('checkup cache (the play-gate signal)', () => {
  beforeEach(() => localStorage.clear())

  it('marks, reads, and clears per learner', () => {
    expect(isCheckupCached('L1')).toBe(false)
    markCheckupDone('L1')
    expect(isCheckupCached('L1')).toBe(true)
    expect(isCheckupCached('L2')).toBe(false)   // scoped per learner
    clearCheckupCache('L1')
    expect(isCheckupCached('L1')).toBe(false)
  })
})
