/**
 * Stable key for a spoken line → its pre-rendered audio clip.
 *
 * Content-addressed on purpose: identical text anywhere in the app resolves to the
 * SAME file, so a line reused across chapters is recorded once, and re-running the
 * generator skips anything already on disk. Change the text → new key → the old clip
 * is simply never requested again.
 *
 * FNV-1a (same function as the diagnostic item seeder) — must stay byte-identical
 * between the build script and the browser or every lookup misses.
 */
export function clipKey(text: string): string {
  const s = normalizeSpoken(text)
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0).toString(36)
}

/** Whitespace-collapse so a reflowed source string still hits its existing clip. */
export function normalizeSpoken(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}
