import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { strip } from './_window'
import { WORLDS, makeNestBeat, guidedSay } from '@/features/chapters/story/NestTree'

/**
 * WHAT THE FEEDING-NEST CHAPTER SAYS, AND WHAT IT MUST NEVER WRITE.
 *
 * A student, 2026-08-27: *"The robot voice instructions need to be more sharpened. 'Feed the
 * duckling in nest number 7, click on the duckling thats nest say's number 7', will sharpen up the
 * instructions."* The line used to be *"Feed the duckling in nest number 7! Number 7."* — it says
 * WHAT is wanted and never WHAT TO DO, and the only place the action appeared was the written
 * prompt, on a band whose children cannot read.
 *
 * ⚠️ AND THE OPPOSITE CONSTRAINT SITS RIGHT NEXT TO IT, WHICH IS WHY THIS IS A TEST AND NOT A
 * PREFERENCE. The skill is sound → glyph: the child HEARS a number and finds that numeral. So the
 * spoken line may repeat the target as often as it likes and the DRAWN prompt may never contain it.
 * Sharpening the words and subtitling the question pull in opposite directions here, and the
 * student asked for both.
 */
const TIERS = [1, 2, 3] as const

describe('the feeding-nest chapter: heard, not read', () => {
  it('the spoken instruction names the ACTION as well as the number', () => {
    for (const w of WORLDS) {
      const beat = makeNestBeat(w)
      for (const d of TIERS) for (let r = 0; r < 10; r++) {
        const data = beat.make(d, r)
        const said = beat.say!(data)
        const target = data.nums[data.answerIdx]
        expect(said, `${w.id} L${d}r${r}: the line never says what to DO with the nest`).toMatch(/\btap\b/i)
        expect(said, `${w.id} L${d}r${r}: the line does not name the number to find`).toContain(String(target))
        expect(said.toLowerCase(), `${w.id}: the line stopped naming what is being fed`).toContain(w.noun)
      }
    }
  })

  it('the guided round asks in the same words, from one place', () => {
    for (const w of WORLDS) {
      const line = guidedSay(w, 7)
      expect(line).toContain('7')
      expect(line.toLowerCase()).toContain(w.noun)
      expect(line, 'the guided round stopped naming the action').toMatch(/\btap\b/i)
    }
  })

  /**
   * ⚠️ THE ONE THAT WOULD DELETE THE CHAPTER. Writing the target on screen turns a listening task
   * into a matching task: the child reads 7, finds 7, and never has to know what "seven" sounds
   * like. So this sweeps EVERY tier and round of every world.
   */
  it('the DRAWN prompt never contains a digit, in any world or tier', () => {
    for (const w of WORLDS) {
      const beat = makeNestBeat(w)
      for (const d of TIERS) for (let r = 0; r < 10; r++) {
        const data = beat.make(d, r)
        const drawn = beat.prompt(data)
        expect(drawn, `${w.id} L${d}r${r}: the answer is written on screen — "${drawn}"`).not.toMatch(/\d/)
        // …and it must still SAY something, or "no digit" is satisfied by an empty pill.
        expect(drawn.trim().length, `${w.id}: the prompt went empty, so the no-digit rule proves nothing`).toBeGreaterThan(8)
      }
    }
  })

  /**
   * ⚠️ RAINBOW TOWN LEAVES `beat.prompt` EMPTY AND `storybookQuestions` CANNOT SEE IT. That sweep
   * asserts its silent-prompt list EXACTLY, but Rainbow Town's entry there is hand-built from the
   * exported `promptFor`/`sayFor` rather than from the beat — so it reads the chapter's own question
   * and never the beat's, and did not notice the beat going silent on 2026-08-28. The fact is
   * deliberate (SkillBeat's pill is a real button and lay across the colouring page), and it is
   * pinned here so the unit suite records it too, not only `storybook-pills`' OWN_PILL list.
   */
  it('Rainbow Town owns its question on purpose, and says so in the source', () => {
    const s = strip(readFileSync(join(process.cwd(), 'src/features/chapters/story/RainbowTown.tsx'), 'utf8'))
    expect(s, 'the beat states its question again — SkillBeat will draw a pill over the picture')
      .toContain("prompt: () => ''")
    expect(s, 'the chapter stopped drawing the question it took responsibility for')
      .toContain('Banner(promptFor(page, { seq: stepIdx, pots }))')
  })
})
