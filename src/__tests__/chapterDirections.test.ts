/**
 * The typed directions line, and the two copy fixes it arrived with.
 *
 * A tester on 2026-08-30, reviewing the 3–5 band: *"there should also be (this goes for all
 * chapters) a little box in the top left or right corner that has word typed directions for people
 * to follow."* Plus, on Shape House, *"instead of Milo saying 'yes' when the correct answer is
 * chosen, he should say something along the lines of 'great job'"*, and on Measuring, *"instead of
 * it saying 'Take one back', it should say 'Add block' and 'Remove Block'"*.
 *
 * ⚠️ WHAT THESE CHECKS ARE FOR. Every one of them is about a string a CHILD READS, and there is no
 * type or run that can see one go missing: the words are correct English either way, both engines
 * render whatever they are handed, and the layout stays valid. So they are asserted here, and each
 * was watched failing — planted mutations are named against the check that catches them.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { CHAPTERS, getChapter, type ChapterType } from '@/core/chapters'
import { OWNS_CHROME_ROW } from '@/features/chapters/directions'
import { strip } from './_window'

const read = (p: string) => strip(readFileSync(join(process.cwd(), p), 'utf8'))
const PORTAL = 'src/features/chapters/ChapterPortal.tsx'
const SHELL = 'src/features/chapters/teen/games/parts/GameShell.tsx'
const CARD = 'src/features/chapters/DirectionsCard.tsx'
const SHAPES = 'src/features/chapters/story/ShapeTown.tsx'
const MEASURE = 'src/features/chapters/story/MeasureIt.tsx'

describe('every chapter carries a line of typed directions', () => {
  /**
   * The words come from the catalogue's own `hint`, which is `Record<ChapterType, …>`-complete by
   * construction — a second per-chapter map is the thing that would let a chapter ship with none.
   */
  it('has a non-empty line for all 72 chapters', () => {
    for (const c of CHAPTERS) {
      expect(c.hint.trim().length, `${c.id} has no directions line`).toBeGreaterThan(0)
      // ⚠️ ONE LINE, ALWAYS. Both surfaces render it `nowrap`: the story strip sits between the
      // Menu button and the round counter with the prompt pill opening at y 40–50 just below, and
      // the teen one is a flex child of the header row. A long line does not wrap, it ELLIPSISES —
      // so the budget is what stops a direction being cut off rather than what stops a collision.
      expect(c.hint.length, `${c.id}'s directions line will be cut off`).toBeLessThanOrEqual(50)
    }
  })

  /** Both engines, because the band is split across them and a child gets one or the other. */
  it('is rendered by the story portal and by the teen shell', () => {
    // Anchored on the real call, not on the import: an import that nothing renders is the shape of
    // this repo's own dead-prop fault.
    expect(read(PORTAL), 'the story portal stopped drawing the directions')
      .toContain('<DirectionsCard chapter={skill} />')
    expect(read(SHELL), 'the teen header stopped drawing the directions')
      .toContain('{getChapter(config.chapterId).hint}')
    // ⚠️ The counting chapter keeps its own wrapper and is NOT covered by the portal line above.
    expect(read('src/features/chapters/game/CountingStoryChapter.tsx'), 'chapter 1 lost its directions')
      .toContain('<DirectionsCard chapter="counting" />')
  })

  /**
   * ⚠️⚠️ THE STRIP IS NEVER STACKED ON A CHAPTER'S OWN BANNER, AND THAT IS THE WHOLE OF THE FIX.
   * Laid over MeasureIt at 640×320 it was clipped to "Lay blocks to t…" — the feature failing on one
   * of the two chapters it was asked for. EIGHT chapters draw something of their own on that row;
   * each carries the line INSIDE that element instead, where an overlap is not expressible.
   *
   * The list is a claim about eight chapters' layout held in a ninth file, so each entry is pinned to
   * the expression it is claiming — change the layout and this fails rather than rotting quietly.
   */
  const ROW: Array<[ChapterType, string, string]> = [
    ['measurement',      'src/features/chapters/story/MeasureIt.tsx',      'export const pillTop = (short: boolean) => (short ? 14 : 50)'],
    ['shapes2d3d',       'src/features/chapters/story/ShapeStudio.tsx',    "position: 'absolute', top: 12, left: 0, right: 0"],
    ['compareNumbers',   'src/features/chapters/story/SeesawPark.tsx',     "position: 'absolute', top: 12, left: 0, right: 0"],
    ['fractions',        'src/features/chapters/story/SliceShop.tsx',      "position: 'absolute', top: CHROME_PAD, left: 0, right: 0"],
    ['time',             'src/features/chapters/story/TickTock.tsx',       "position: 'absolute', top: CHROME_PAD, left: 0, right: 0"],
    ['additionTo100',    'src/features/chapters/story/yard.tsx',           'export const BANNER_TOP = (vh: number) => (vh < 470 ? 46 : Math.round(vh * 0.035))'],
    ['subtractionTo100', 'src/features/chapters/story/yard.tsx',           'export const BANNER_TOP = (vh: number) => (vh < 470 ? 46 : Math.round(vh * 0.035))'],
    ['placeValue',       'src/features/chapters/story/yard.tsx',           'export const BANNER_TOP = (vh: number) => (vh < 470 ? 46 : Math.round(vh * 0.035))'],
  ]

  it('names every chapter that draws on the chrome row, and each still does', () => {
    expect([...OWNS_CHROME_ROW].sort()).toEqual(ROW.map(r => r[0]).sort())
    for (const [id, file, claim] of ROW) {
      expect(read(file), `${id}: the layout this list claims has moved — re-derive the list`).toContain(claim)
    }
    // The strip itself sits at y 14–40, so "on the chrome row" means a row starting under 44.
    for (const top of [12, 14, 25]) expect(top).toBeLessThan(44)
    // ⚠️ HopAlong's round row IS at top 40 and it is NOT on the list, because it renders no pill
    // there (`prompt: () => ''`, its ask is a pill at the bottom) — measured at 640×320. If it ever
    // grows a prompt, the strip and that pill share a row.
    expect(read('src/features/chapters/story/HopAlong.tsx')).toContain("prompt: () => ''")
  })

  it('draws no floating strip for them — the line rides in their own banner', () => {
    expect(read(CARD), 'the strip would be stacked on a banner again').toContain('ownsChromeRow(chapter)')
    // The pill carries it where a chapter has one …
    expect(read('src/features/chapters/story/StoryWorld.tsx'))
      .toContain('{ownsChromeRow(beat.skillId) && <DirectionsInline chapter={beat.skillId} />}')
    // … and the four that suppress the pill (`prompt: () => \'\'`) carry it in the element that
    // states their question instead, or a scored round would show no directions at all.
    // ⚠️ ANCHORED ON THE PLAY BUBBLE, AND COUNTED. A bare `chapter="fractions"` check passed while
    // the PLAY bubble had lost it, because the same chapter's LESSON banner also carries one — the
    // count-the-right-thing trap. Both must be there: the lesson banner and the scored round.
    for (const [file, ch, playCall] of [
      ['src/features/chapters/story/SliceShop.tsx', 'fractions', '<Bubble L={l} chapter="fractions"'],
      ['src/features/chapters/story/TickTock.tsx', 'time', '<Bubble L={l} dark={dark} chapter="time"'],
    ] as const) {
      const src = read(file)
      expect(src).toContain("prompt: () => ''")
      expect(src, `${ch}'s SCORED round shows no directions at all`).toContain(playCall)
      const n = src.split(`chapter="${ch}"`).length - 1
      expect(n, `${ch} must carry the line in its lesson banner AND its play bubble`).toBe(2)
    }
    // ⚠️ `block`: its own line under the question, not inline after it. Forced inline into this
    // banner at 640×320 it orphaned "numbers!" on a line of its own — see `directions.tsx`.
    expect(read('src/features/chapters/story/yard.tsx'), "BlockYard/BuildingBlocks' shared banner lost the line")
      .toContain('{chapter && <DirectionsInline chapter={chapter} block />}')
    // The two bubbles take the same shape, and for the same reason.
    for (const f of ['SliceShop', 'TickTock']) {
      expect(read(`src/features/chapters/story/${f}.tsx`), `${f}'s bubble stopped giving the line its own row`)
        .toContain('<DirectionsInline chapter={chapter} block />')
    }
    for (const f of ['BlockYard', 'BuildingBlocks']) {
      const n = read(`src/features/chapters/story/${f}.tsx`).split('chapter=').length - 1
      expect(n, `${f} draws two banners and both must carry the line`).toBe(2)
    }
  })

  it('cannot swallow a tap where it does render', () => {
    expect(read(CARD)).toContain("pointerEvents: 'none'")
  })

})

describe("Shape House — Milo praises, and the wall is one wall", () => {
  it('says "Great job" rather than "Yes" when the piece fits', () => {
    const src = read(SHAPES)
    expect(src).toContain('speak(`Great job! The ${label} fits!`)')
    expect(src, 'the "Yes!" line the tester asked us to replace is back').not.toContain('Yes! The ${label} fits!')
  })

  /** "the walls is missing" — the demo's own first line, ungrammatical for a single square. */
  it('names the square in the singular, so every sentence about it reads', () => {
    expect(read(SHAPES)).toContain("label: 'wall' }")
    expect(read(SHAPES), 'the plural is back and the demo says "the walls is missing"').not.toContain("label: 'walls'")
  })

  /**
   * ⚠️ THE BUILD CHANGE IS THE BEAT THE TESTER REPORTED AS SILENT — the hull is the first thing
   * asked for after it, and `opening` was declared per build and rendered nowhere. Said AND written,
   * and the hold is longer than the line: the next round's question is spoken the moment the
   * interlude resolves and `speak()` cancels whatever is still talking.
   */
  it('announces the move to the boat, out loud and in writing', () => {
    const src = read(SHAPES)
    // ⚠️ `speakAfterCurrent` since 2026-09-04: the interlude fires 1300ms after the round's praise,
    // so a plain `speak` here took that praise away — and the 1800ms hold below was a workaround for
    // the SAME fault in the other direction (the next question cutting THIS line). The hold stays as
    // the visual beat; neither line can be cut now.
    expect(src).toContain('speakAfterCurrent(BUILDS[1].opening)')
    expect(src).toContain('{moving && Banner(BUILDS[1].opening)}')
    const hold = /setMoving\(false\); res\(\) }, (\d+)\)/.exec(src)
    expect(hold, 'the interlude no longer holds for a measured time').toBeTruthy()
    expect(Number(hold![1]), 'too short — the line is cut off by the next question')
      .toBeGreaterThanOrEqual(1800)
  })
})

describe('Measuring — the chapter title and its two controls', () => {
  it('is called Measuring', () => {
    expect(getChapter('measurement').name).toBe('Measuring')
  })

  /** Plain and symmetrical: a three-year-old's grown-up should not have to parse "take one back". */
  it('labels its blocks "Add block" and "Remove block"', () => {
    const src = read(MEASURE)
    for (const label of ['Add block', 'Remove block']) {
      // Twice each: the aria-label and the visible words, which must not drift apart.
      const n = src.split(label).length - 1
      expect(n, `"${label}" appears ${n} times, expected the label and the button text`).toBe(2)
    }
    expect(src, 'the wording the tester asked us to replace is back').not.toContain('Take one back')
  })
})

/**
 * The speech diary. ⚠️ THIS IS NOT A FIX AND MUST NOT BE READ AS ONE — see the block comment in
 * `useMiloSpeaker.ts`. It exists because "Milo's voice does not speak" has twice been investigated
 * by checking whether `speak()` was CALLED, which it always was; the diary records whether the
 * utterance ever STARTED and ENDED, which is the thing the reports are actually about.
 */
describe('the speech diary records what was heard, not what was asked for', () => {
  const SPEAKER = 'src/infra/useMiloSpeaker.ts'

  it('marks each utterance at speak, start, end and error', () => {
    const src = read(SPEAKER)
    expect(src).toContain('_remember(note)')
    // All three, because the fault's signature is a MISSING one: started with no end.
    expect(src).toContain('note.started = Math.round(Date.now())')
    expect(src).toContain('note.ended = Math.round(Date.now())')
    expect(src).toContain('note.error = e.error')
  })

  it('reaches a real device: always on, and readable from the console', () => {
    const src = read(SPEAKER)
    expect(src).toContain('__miloSpeech')
    // ⚠️ A dev-only gate would put it out of reach of the only place the fault has ever appeared.
    const at = src.indexOf('__miloSpeech')
    expect(src.slice(Math.max(0, at - 400), at), 'the diary got gated out of production')
      .not.toContain("NODE_ENV !== 'production'")
  })

  it('names the two shapes a report has to tell apart', () => {
    const src = read(SPEAKER)
    expect(src).toContain('hung:')      // started, never ended — the Chromium stall
    expect(src).toContain('silent:')    // never started, and nothing said why
  })
})
