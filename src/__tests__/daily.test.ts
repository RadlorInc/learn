import { describe, it, expect } from 'vitest'
import { computeStreak } from '@/features/daily/daily'

describe('computeStreak (DST-safe local day-keys)', () => {
  it('counts consecutive local calendar days', () => {
    expect(computeStreak(['2026-01-01', '2026-01-02', '2026-01-03']).longest).toBe(3)
  })
  it('a DST spring-forward (23h day) stays adjacent', () => {
    expect(computeStreak(['2026-03-07', '2026-03-08', '2026-03-09']).longest).toBe(3)
  })
  it('a DST fall-back (25h day) stays adjacent', () => {
    expect(computeStreak(['2026-10-31', '2026-11-01', '2026-11-02']).longest).toBe(3)
  })
  it('a gap breaks the run', () => {
    expect(computeStreak(['2026-01-01', '2026-01-03']).longest).toBe(1)
  })
})
