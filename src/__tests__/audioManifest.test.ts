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
import { readFileSync, readdirSync } from 'node:fs'

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

  it("every module's runtime index agrees with the manifest and the corpus, and index.ts loads exactly those files", () => {
    // src/features/lessons/voice-index is GENERATED (build-manifest.mjs); this catches a hand edit or a stale copy in CI,
    // where build-manifest --check cannot run (no audio there).
    const dir = 'src/features/lessons/voice-index'
    const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort()
    const lessonRows = JSON.parse(readFileSync('scripts/.voice-corpus-lessons-josh.json', 'utf8')) as { key: string; check: string }[]
    const check = new Map(lessonRows.map(r => [r.key, r.check]))
    const wrong: string[] = []
    let entries = 0
    for (const f of files) {
      for (const [k, [name, chk]] of Object.entries(JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')) as Record<string, [string, string]>)) {
        entries++
        if (M.keys[k]?.name !== `${name}.mp3`) wrong.push(`${f} ${k}: object ${name}`)
        if (check.get(k) !== chk) wrong.push(`${f} ${k}: check ${chk}`)
      }
    }
    expect(files.length, 'positive control: one index per lesson module').toBe(36)
    expect(entries).toBeGreaterThan(6000)
    expect(wrong.slice(0, 5)).toEqual([])
    const loaders = [...readFileSync(`${dir}/index.ts`, 'utf8').matchAll(/import\('\.\/([a-z0-9]+)\.json'\)/g)].map(m => `${m[1]}.json`).sort()
    expect(loaders).toEqual(files)
  })

  it("every KG–2 chapter's runtime index lists exactly its corpus lines, with the manifest's object and the line's check", () => {
    // src/features/chapters/voice-index is GENERATED (build-manifest.mjs) from each row's `chapters`. Both directions:
    // a row missing from a chapter it names is that line in the device voice there with its clip in the bucket; an
    // entry no row gives that chapter is a stale or hand-edited file.
    const dir = 'src/features/chapters/voice-index'
    const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort()
    const rows = JSON.parse(readFileSync('scripts/.voice-corpus-chapters-josh.json', 'utf8')) as { key: string; check: string; chapters: string[] }[]
    const idx = Object.fromEntries(files.map(f => [f.slice(0, -5), JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')) as Record<string, [string, string, number]>]))
    const wrong: string[] = []
    const want = new Set<string>()
    for (const r of rows) for (const ch of r.chapters) {
      want.add(`${ch} ${r.key}`)
      const e = idx[ch]?.[r.key]
      if (!e) wrong.push(`${ch}.json lacks ${r.key}`)
      else {
        if (M.keys[r.key]?.name !== `${e[0]}.mp3`) wrong.push(`${ch}.json ${r.key}: object ${e[0]}`)
        if (e[1] !== r.check) wrong.push(`${ch}.json ${r.key}: check ${e[1]}`)
        // The size a question's answer budget is judged by (openQuestion, Money): it must be the clip's real size.
        if (e[2] !== M.keys[r.key]?.bytes) wrong.push(`${ch}.json ${r.key}: ${e[2]} bytes, the manifest says ${M.keys[r.key]?.bytes}`)
      }
    }
    for (const [ch, ix] of Object.entries(idx)) for (const k of Object.keys(ix)) if (!want.has(`${ch} ${k}`)) wrong.push(`${ch}.json lists ${k}, which no row gives it`)
    expect(wrong.slice(0, 5)).toEqual([])
    // Hand-written (2026-09-27): 23 chapters; "4. The sunflower is 4 blocks tall." is measurement's alone, object
    // 1a11c30ab68a845d, 12,974 bytes, from scripts/audio/manifest.json; "Great job!" (SkillBeat's praise) is in all 23.
    expect(files.length, 'positive control: one index per KG–2 chapter').toBe(23)
    expect(idx.measurement.hsjnug).toEqual(['1a11c30ab68a845d', '1l998u0noqc', 12974])
    expect(Object.keys(idx).filter(ch => idx[ch].hsjnug)).toEqual(['measurement'])
    expect(Object.keys(idx).filter(ch => idx[ch]['163yjlw']).length).toBe(23)
    const loaders = [...readFileSync(`${dir}/index.ts`, 'utf8').matchAll(/(\w+): \(\) => import\('\.\/(\w+)\.json'\)/g)]
    expect(loaders.every(m => m[1] === m[2]), 'a loader imports another chapter\'s file').toBe(true)
    expect(loaders.map(m => `${m[2]}.json`).sort()).toEqual(files)
  })
})
