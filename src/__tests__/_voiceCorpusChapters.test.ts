/**
 * THE ONE JOSH CORPUS FOR THE 23 KG–2 STORY CHAPTERS → scripts/.voice-corpus-chapters-josh.json
 *
 *   VOICE_CORPUS=1 npx vitest run src/__tests__/_voiceCorpusChapters.test.ts
 *
 * Opt-in: it writes the file and is not a check — `chapterVoiceCorpus.test.ts` is the always-on check
 * that the file is current with the chapter source. Re-run this after ANY change to a spoken line.
 *
 * It runs both builders (`build35`, `build68`) into one `Corpus`, then adds every STATIC spoken
 * literal the parser finds in the chapter source (`spokenLiterals`) — the same reader the check uses,
 * so a fixed line (a lesson script, a hint) is taken from the code rather than copied into a builder.
 *
 * Each row: { key, text, style, chapter, grade, spoken, check, chapters }
 *   key      clipKey(spoken) — what voiceClipPlayer looks up at runtime
 *   text     speakable(spoken) — what the renderer READS (CAPS lowered, money/fractions/units said)
 *   style    'A' for every row
 *   chapter  the first chapter (play order) among the LOWEST-grade chapters that say it
 *   grade    0 = KG, 1, 2 (core/chapters.ts)
 *   spoken   the exact runtime string, so the key can be re-derived and audited
 *   check    clipCheck(spoken) — the player plays a clip only when key AND check match (src/core/voiceClips.ts), so a
 *            runtime line that merely collides with this key (a child's name in the end card) is never requested
 *   chapters every chapter whose clip index lists it (play order) — scripts/audio/build-manifest.mjs writes one index per
 *            chapter from this. See EVERYWHERE below for the lines every chapter gets.
 * Sorted by grade, then scored → teach → redirect → reteach within a grade (the render can be cut
 * to a budget from the top), builder order within that.
 */
import { it, vi, expect } from 'vitest'
import { writeFileSync } from 'node:fs'
import { CHAPTERS, type ChapterType } from '@/core/chapters'
import { clipKey, clipCheck } from '@/core/voiceClips'
import { PRAISE } from '@/core/praise'
import { ENCOURAGEMENT } from '@/shared/hooks/useAdaptive'
import { C } from '@/features/lessons/sessionCopy'
import { CHAPTER_TAKE } from '@/features/chapters/story/take'
import { speakable } from '@/features/lessons/content/voice/styles'
import { Corpus, ORDER } from './_voiceCorpusKit'
import { spokenLiterals, chapterSourceFiles, chapterOfFile } from './_spokenLiterals'
import { build35 } from './_voiceCorpus35.test'
import { build68 } from './_voiceCorpus68.test'

vi.mock('@/infra/useMiloSpeaker', async (orig) =>
  ({ ...(await orig<object>()), ...(await import('./_voiceCorpusKit')).SPEAKER_STUB }))

export const CORPUS_FILE = 'scripts/.voice-corpus-chapters-josh.json'

it('builds the KG–2 chapter corpus for Josh', async () => {
  if (!process.env.VOICE_CORPUS) return
  const c = new Corpus()
  await build35(c)
  await build68(c)
  const statics = spokenLiterals(chapterSourceFiles()).filter(l => !l.template)
  for (const l of statics) c.add(chapterOfFile(l.file), 'teach', l.text)
  expect([...c.holes], 'a chapter’s re-teach yielded nothing — this corpus is short by that chapter').toEqual([])

  const play = CHAPTERS.map(ch => ch.id as string)
  // ⚠️ EVERYWHERE: the lines ANY chapter can say, so every chapter's clip index lists them. A builder files a line under
  // the chapter it swept, which is right for a chapter's own rounds and wrong for shared plumbing — SkillBeat's praise and
  // encouragement and the end card (both endings) are filed under `counting`, and a static line is placed by its FILE
  // name (chapterOfFile), while PlayTime serves addition AND subtraction and BlockYard both to-100 chapters. A line
  // missing from a chapter's index is spoken there by the device voice with its clip sitting in the bucket; one listed
  // in a chapter that never says it costs a few bytes. So the shared lines and every static line go everywhere.
  const EVERYWHERE = new Set([...PRAISE, ...ENCOURAGEMENT.flat(), 'All done! Nice work.',
    `${C.breakTitle(CHAPTER_TAKE).replace(' ⭐', '')} ${C.spotSaved}`, ...statics.map(l => l.text)].map(clipKey))
  for (const k of EVERYWHERE) if (!c.lines.has(k)) throw new Error(`EVERYWHERE line ${k} is not in the corpus`)
  const gradeOf = (id: string) => CHAPTERS.find(ch => ch.id === id)?.grade
  const rows = [...c.lines.entries()].map(([key, v], i) => {
    for (const ch of v.chapters) if (gradeOf(ch) === undefined) throw new Error(`unknown chapter ${ch}`)
    const chapter = [...v.chapters].sort((a, b) => gradeOf(a)! - gradeOf(b)! || play.indexOf(a) - play.indexOf(b))[0] as ChapterType
    const chapters = EVERYWHERE.has(key) ? play : play.filter(ch => v.chapters.includes(ch))
    return { i, kind: v.kind, row: { key, text: speakable(v.text), style: 'A', chapter, grade: gradeOf(chapter)!, spoken: v.text,
      check: clipCheck(v.text), chapters } }
  })
  rows.sort((a, b) => a.row.grade - b.row.grade || ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || a.i - b.i)
  writeFileSync(process.env.VOICE_OUT ?? CORPUS_FILE, JSON.stringify(rows.map(r => r.row), null, 1) + '\n')
}, 900_000)
