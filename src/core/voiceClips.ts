/**
 * Stable key for a spoken line → its pre-rendered audio clip.
 *
 * Content-addressed on purpose: identical text anywhere in the app resolves to the
 * SAME file, so a line reused across chapters is recorded once, and re-running the
 * generator skips anything already in scripts/audio/manifest.json. Change the text → new key → the old clip
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

/**
 * A SECOND, independent 53-bit hash of the same line (cyrb53 — a different family from clipKey's FNV-1a).
 *
 * ⚠️ WHY IT EXISTS (Audio storage loop, 2026-09-26). clipKey is 32 bits, so lines built at runtime collide with real
 * clips: measured against the Josh manifest, 'All done, Carlos Tyler! Nice work.' has the key of a real lesson clip
 * (and 17 of 1,308² two-word names hit some Josh key). "Only request a key that is in the index" is therefore NOT
 * enough to keep a child's name out of an audio request, and a colliding line would play someone else's sentence.
 * The index stores this check next to each clip, and the player plays a clip only when BOTH match — so a line must
 * collide in 85 bits at once, for every runtime-built line, with no call site that has to remember anything.
 * Computed by scripts/lesson-voice-corpus.mts on the SAME string clipKey hashes (the line as written, before
 * renderOf rewrites it for the voice). voiceIndex.test.ts fails if the two ever disagree.
 */
export function clipCheck(text: string): string {
  const s = normalizeSpoken(text)
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

/** Whitespace-collapse so a reflowed source string still hits its existing clip. */
export function normalizeSpoken(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}
