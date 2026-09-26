/**
 * scripts/audio/manifest.json — the record of which recorded clip is which object in the `lesson-audio` bucket
 * (Audio storage loop, 2026-09-26). The audio itself is not in git, so this checks what CAN be checked in CI:
 *
 *   · every line the corpora name has an entry, and no entry is a line nobody names (MISSING / ORPHAN);
 *   · every object name IS its content: `<sha256[0:16]>.mp3` — what makes a year-long immutable cache safe;
 *   · every object fits the bucket's 256 KB limit (20260927100000) and has an MD5 the uploader audits the ETag with.
 *
 * ⚠️ WHAT IT DOES NOT PROVE: that the bytes are in the bucket. That half is upload.py's (it lists the bucket and checks
 * size + ETag of every manifest object, then reads each upload back) and `build-manifest.mjs --check` locally (the
 * file matches the clips). "Listed here" is not "served"; say so rather than read this green as more than it is.
 *
 * Expected values are written out by hand (CLAUDE.md: a check must not derive its expectation from the thing it tests).
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

type Entry = { name: string; sha256: string; md5: string; bytes: number }
const M = JSON.parse(readFileSync('scripts/audio/manifest.json', 'utf8')) as { voice: string; clips: number; objects: number; bytes: number; keys: Record<string, Entry> }
const corpus = (f: string) => (JSON.parse(readFileSync(f, 'utf8')) as { key: string }[]).map(r => r.key)
const LESSONS = corpus('scripts/.voice-corpus-lessons-josh.json')
const CHAPTERS = corpus('scripts/.voice-corpus-chapters-josh.json')

describe('audio manifest', () => {
  it('positive control: a clip measured by hand (26 Sep 2026) is exactly where the manifest says', () => {
    // 'You could count every cookie.' — g3m1-t1 s2 b1. sha256 measured with shasum on the rendered file.
    expect(M.voice).toBe('nzFihrBIvB34imQBuxub')
    expect(M.keys.fkn1sl).toEqual({
      name: '31c72a780c71b280.mp3',
      sha256: '31c72a780c71b280230d66f34cfdf981ac166f48f57f11e190e8c4675df71b23',
      md5: '73d963636665bbdeff2a508f731bc6ab',
      bytes: 8272,
    })
    expect(LESSONS.length).toBeGreaterThan(6000)
    expect(CHAPTERS.length).toBeGreaterThan(10000)
  })

  it('every corpus line has a clip entry, and every entry is a corpus line', () => {
    const named = new Set([...LESSONS, ...CHAPTERS])
    const listed = new Set(Object.keys(M.keys))
    expect([...named].filter(k => !listed.has(k)), 'MISSING — a spoken line with no clip in the bucket').toEqual([])
    expect([...listed].filter(k => !named.has(k)), 'ORPHAN — a clip no line names').toEqual([])
  })

  it('every object name is the first 16 hex of its own SHA-256 (content-addressed, so immutable)', () => {
    const bad = Object.entries(M.keys).filter(([, e]) =>
      !/^[0-9a-f]{64}$/.test(e.sha256) || e.name !== `${e.sha256.slice(0, 16)}.mp3`)
    expect(bad.map(([k]) => k)).toEqual([])
  })

  it('one name never stands for two different clips', () => {
    const seen = new Map<string, string>()
    const clash: string[] = []
    for (const e of Object.values(M.keys)) {
      if (seen.has(e.name) && seen.get(e.name) !== e.sha256) clash.push(e.name)
      seen.set(e.name, e.sha256)
    }
    expect(clash).toEqual([])
    expect(M.objects).toBe(seen.size)
    expect(M.clips).toBe(Object.keys(M.keys).length)
  })

  it('every object fits the bucket (256 KB, 20260927100000) and carries the MD5 the uploader audits', () => {
    const bad = Object.entries(M.keys).filter(([, e]) =>
      !(Number.isInteger(e.bytes) && e.bytes > 0 && e.bytes <= 262144) || !/^[0-9a-f]{32}$/.test(e.md5))
    expect(bad.map(([k]) => k)).toEqual([])
  })
})
