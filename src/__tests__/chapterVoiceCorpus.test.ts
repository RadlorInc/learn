/**
 * THE JOSH CLIP CORPUS IS CURRENT WITH WHAT THE KG–2 CHAPTERS SAY.
 *
 * A clip is used only when its key is `clipKey` of EXACTLY the string a chapter passes at runtime, so
 * a line reworded in a chapter and not re-queued falls back to browser speech with nothing going red.
 * This reads the chapter source with the TypeScript parser (`_spokenLiterals.ts`) and requires, of
 * `scripts/.voice-corpus-chapters-josh.json`:
 *   1. every STATIC spoken literal has its key in the corpus;
 *   2. every spoken TEMPLATE (a `${}` line) matches at least one row — a reworded template, or one
 *      the builders stopped enumerating, has none;
 *   3. no row says "Milo";
 *   4. each row is internally honest: key = clipKey(spoken), text = speakable(spoken), style 'A',
 *      grade = the chapter's grade.
 * When it fails, rebuild:  VOICE_CORPUS=1 npx vitest run src/__tests__/_voiceCorpusChapters.test.ts
 *
 * ⚠️ POSITIVE CONTROL: the parser must find ≥ 80 static literals and ≥ 100 templates, and must find
 * named lines that are known to be spoken — a reader that finds nothing cannot pass.
 * Watched red 2026-09-25: a planted reword of one TickTock lesson line failed assertion 1 naming it.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { clipKey } from '@/core/voiceClips'
import { CHAPTERS } from '@/core/chapters'
import { PRAISE } from '@/core/praise'
import { ENCOURAGEMENT } from '@/shared/hooks/useAdaptive'
import { speakable } from '@/features/lessons/content/voice/styles'
import { spokenLiterals, chapterSourceFiles } from './_spokenLiterals'

interface Row { key: string; text: string; style: string; chapter: string; grade: number; spoken: string }
const rows: Row[] = JSON.parse(readFileSync('scripts/.voice-corpus-chapters-josh.json', 'utf8'))
const keys = new Set(rows.map(r => r.key))
const found = spokenLiterals(chapterSourceFiles())
const statics = found.filter(l => !l.template)
const templates = found.filter(l => l.template)
const where = (l: { file: string; line: number }) => `${l.file.replace(/^.*\/src\//, 'src/')}:${l.line}`

/**
 * Templates no enumeration can reach, each with its reason. An entry whose template has left the
 * source fails below, so this list cannot outlive what it excuses.
 */
const UNREACHABLE: Record<string, string> = {
  'ChapterDone.tsx ^All done, (.*?)! Nice work\\.$': "the child's own name — runtime data; 'All done! Nice work.' is the recorded fallback",
  'SeesawPark.tsx ^Yes! (.*?) equals (.*?)!$': 'said only on the guided round, which is three and seven',
  'ShapeStudio.tsx ^Yes! (.*?) sides!$': 'said only on the guided round, which is a name round (the square)',
}
const idOf = (l: { file: string; text: string }) => `${l.file.replace(/^.*\//, '')} ${l.text}`

describe('the KG–2 Josh corpus is current with the chapter source', () => {
  it('positive control: the reader finds the chapters’ spoken lines', () => {
    expect(statics.length).toBeGreaterThanOrEqual(80)
    expect(templates.length).toBeGreaterThanOrEqual(100)
    // a lesson line (speakPaced of a script table), a wrapper-spoken line (BuildingBlocks' `say`),
    // an imported helper (clock.ts' hintFor) and a template (FollowTheLeader's wrong tap)
    const texts = found.map(l => l.text)
    expect(texts).toContain('Every clock has two hands, and they are not the same.')
    expect(texts).toContain('Ten again — trade them up.')
    expect(texts).toContain('Careful — after half past we count to the NEXT hour.')
    expect(texts).toContain('^Not yet! Find the smallest (.*?)\\.$')
    expect(rows.length).toBeGreaterThan(1000)
  })

  it('every static spoken line has a clip key in the corpus', () => {
    const missing = statics.filter(l => !keys.has(clipKey(l.text))).map(l => `${where(l)}  ${l.text}`)
    expect(missing, 'spoken but not in the corpus — rebuild it (command at the top of this file)').toEqual([])
  })

  it('every spoken template matches at least one row', () => {
    const spoken = rows.map(r => r.spoken)
    const missing = templates.filter(l => !UNREACHABLE[idOf(l)] && !spoken.some(s => new RegExp(l.text).test(s)))
      .map(l => `${where(l)}  ${l.text}`)
    expect(missing, 'no row matches this template — reworded in the chapter, or no longer enumerated by a builder').toEqual([])
    const stale = Object.keys(UNREACHABLE).filter(id => !templates.some(l => idOf(l) === id))
    expect(stale, 'an UNREACHABLE entry names a template that is no longer in the source').toEqual([])
  })

  it('the shared SkillBeat lines are in it', () => {
    const missing = [...PRAISE, ...ENCOURAGEMENT.flat()].filter(t => !keys.has(clipKey(t)))
    expect(missing).toEqual([])
  })

  it('no row says Milo', () => {
    expect(rows.filter(r => /milo/i.test(r.text) || /milo/i.test(r.spoken)).map(r => r.spoken)).toEqual([])
  })

  it('every row is honest about itself', () => {
    const grade = new Map(CHAPTERS.map(c => [c.id as string, c.grade]))
    const bad = rows.filter(r => r.key !== clipKey(r.spoken) || r.text !== speakable(r.spoken) || r.style !== 'A'
      || grade.get(r.chapter) !== r.grade).map(r => r.spoken)
    expect(bad).toEqual([])
    expect(new Set(rows.map(r => r.key)).size, 'a key appears twice').toBe(rows.length)
    expect(rows.map(r => r.grade), 'rows are sorted by grade').toEqual([...rows.map(r => r.grade)].sort((a, b) => a - b))
  })
})
