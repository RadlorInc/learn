import { describe, it, expect } from 'vitest'
import { rint, shuffle } from '@/core/rand'
import { disp } from '@/core/fmt'

describe('rint', () => {
  it('is inclusive at both ends and never leaves the range', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 5000; i++) { const v = rint(3, 6); expect(v).toBeGreaterThanOrEqual(3); expect(v).toBeLessThanOrEqual(6); seen.add(v) }
    expect([...seen].sort()).toEqual([3, 4, 5, 6])
  })
  it('handles a single-value range', () => { expect(rint(7, 7)).toBe(7) })
})

describe('shuffle', () => {
  it('returns a permutation and does not mutate the input', () => {
    const a = [1, 2, 3, 4, 5]
    const r = shuffle(a)
    expect(a).toEqual([1, 2, 3, 4, 5])
    expect([...r].sort((x, y) => x - y)).toEqual(a)
  })

  /**
   * THE REASON THIS MODULE EXISTS. Answer-choice builders insert the correct answer FIRST and
   * then shuffle, so a biased shuffle is directly exploitable: measured over 200k draws, the
   * `sort(() => Math.random() - 0.5)` these replaced put the answer in the last of three chips
   * only 25% of the time instead of 33% — "never tap the last one" beat guessing.
   *
   * 3pp is ~9σ at this sample size, so noise cannot reach it, while the biased sort misses by 8pp.
   */
  it('is uniform — the first element is equally likely to land anywhere', () => {
    const N = 20_000, len = 3
    const base = [0, 1, 2]
    const counts = Array(len).fill(0)
    for (let i = 0; i < N; i++) counts[shuffle(base).indexOf(0)]++
    for (const c of counts) expect(Math.abs(c / N - 1 / len)).toBeLessThan(0.03)
  })
})

describe('disp', () => {
  it('uses a real minus sign, not a hyphen', () => {
    expect(disp(-5)).toBe('−5')
    expect(disp(-5)).not.toContain('-')
    expect(disp(5)).toBe('5')
    expect(disp(0)).toBe('0')
  })
})
