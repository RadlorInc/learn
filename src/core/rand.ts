/**
 * The one place randomness is defined.
 *
 * `rint` was written out identically in 52 files and `shuffle` in 26, across six different
 * shapes — and three of those shapes were `sort(() => Math.random() - 0.5)`, which is NOT a
 * shuffle. A comparator that ignores its arguments gives the sort no consistent ordering, so
 * the result is biased toward the input order (V8's insertion sort for short arrays barely
 * moves the leading elements at all). Answer choices built that way sit in their generated
 * order far more often than chance, and the correct answer is usually generated first — so
 * "always tap the first chip" beats guessing. Fisher-Yates is the same number of lines.
 *
 * Anything that needs REPRODUCIBLE randomness (a per-child probe item, a seeded layout
 * nudge) must not use these — see `seeded` in story/critters.tsx and the diagnostic's own
 * `mulberry32`. These are unseeded on purpose.
 */

/** A random integer in [lo, hi], both ends inclusive. */
export const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))

/** A uniformly shuffled COPY — the input is never mutated. */
export function shuffle<T>(a: readonly T[]): T[] {
  const r = a.slice()
  for (let i = r.length - 1; i > 0; i--) { const j = rint(0, i); [r[i], r[j]] = [r[j], r[i]] }
  return r
}
