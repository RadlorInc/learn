import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { strip } from './_window'

const src = (f: string) => strip(readFileSync(join(process.cwd(), 'src/features/chapters/story', f), 'utf8'))

/**
 * ⚠️ EVERY STORYBOOK CHAPTER LETS THE CHILD SUBMIT WHEN THEY ARE READY — asked for by a student,
 * 2026-08-27: *"this feature should be added to all other games or activities, so users can submit
 * their answer when they are ready."*
 *
 * The chapters answer in two different ways and both count, which is why this is a table rather
 * than a grep:
 *   • `bar`  — a tap CHOOSES and the shared `ReadyBar` submits. Added here for chapters that used
 *              to grade on contact, so an accidental tap was the answer.
 *   • `own`  — the chapter already had a commit step in its own idiom, because the child BUILDS the
 *              answer before sending it. Renaming "Pay ✓" to "Ready" would make those worse: the
 *              craft doc's rule is that the words belong to whoever is speaking, and you pay a
 *              shopkeeper. The named token is the handler its own control is wired to, or that
 *              control's exact label.
 *
 * ⚠️ AN `own` TOKEN IS A LABEL OR A HANDLER, NEVER A BARE WORD. Four started as `Done` / `Ready`,
 * which also match `onDone`, `setDone` and prose in a comment — tokens so common that deleting the
 * control left the check green. A token that cannot fail is not a check.
 *
 * ⚠️ THE COUNT IS ASSERTED. A new chapter that answers by tapping must join this table deliberately
 * rather than quietly shipping without a commit step — which is exactly how the band ended up with
 * four chapters that had one and eighteen that did not.
 */
const CHAPTERS: Array<[file: string, kind: 'bar' | 'own', tokens: string[]]> = [
  ['BeadShop.tsx', 'bar', ['pending']],
  ['BigOrSmall.tsx', 'bar', ['pending']],
  ['FollowTheLeader.tsx', 'bar', ['pending']],
  ['MarketDay.tsx', 'bar', ['pending']],
  ['NestTree.tsx', 'bar', ['pickedIdx']],
  ['NumberTown.tsx', 'bar', ['pending']],
  ['PlayTime.tsx', 'bar', ['pending']],
  ['RainbowTown.tsx', 'bar', ['pendingPaint']],
  ['SeesawPark.tsx', 'bar', ['pending']],
  // two answer surfaces, one per round type: number chips on `sides`, shape tiles on `name`
  ['ShapeStudio.tsx', 'bar', ['pendingNum', 'pendingName']],
  ['ShapeTown.tsx', 'bar', ['pending']],
  ['StoryTime.tsx', 'bar', ['pending']],
  ['world1.tsx', 'bar', ['pending']],
  ['BlockYard.tsx', 'own', ['onDone={commit}']],
  ['BuildingBlocks.tsx', 'own', ['Done ✓']],
  ['CoinShop.tsx', 'own', ['onClick={onPay}']],
  ['HomeTime.tsx', 'own', ['Ready! 🔔']],
  ['HopAlong.tsx', 'own', ['Ready ✓']],
  ['LevelRun.tsx', 'own', ['onClick={commit}']],
  ['MeasureIt.tsx', 'own', ['Done ✓']],
  ['OrderDesk.tsx', 'own', ['onClick={commit}']],
  ['SliceShop.tsx', 'own', ['onClick={commit}']],
  ['TickTock.tsx', 'own', ['onClick={commit}']],
]

describe('every storybook chapter has a commit step', () => {
  it('covers the whole band — a chapter cannot ship without one by omission', () => {
    expect(CHAPTERS.length, 'a chapter joined or left the band without joining this table').toBe(23)
    expect(new Set(CHAPTERS.map(c => c[0])).size).toBe(CHAPTERS.length)
  })

  for (const [file, kind, tokens] of CHAPTERS) {
    it(`${file} — ${kind === 'bar' ? 'shared Ready bar' : 'its own commit control'}`, () => {
      const s = src(file)
      if (kind === 'own') {
        expect(s, `${file} lost the control its commit was wired to`).toContain(tokens[0])
        return
      }
      expect(s, `${file} stopped importing the shared bar`).toContain("from './ReadyBar'")
      expect(s, `${file} stopped rendering the bar`).toContain('<ReadyBar')
      for (const t of tokens) {
        expect(s, `${file} lost the chosen-but-not-submitted state the bar is gated on`).toContain(t)
      }
    })
  }

  /**
   * ⚠️ THE BAR MAY NEVER BE GATED ON WHETHER THE CHOICE IS RIGHT. This band retries in place, so a
   * bar that appeared only for a correct choice would announce the answer before the commit — the
   * craft doc's oldest rule. It is gated on "something is chosen" and on nothing else.
   */
  it('never appears because the choice happens to be correct', () => {
    // ⚠️ ASSERTED AS A SHAPE, NOT AS A BLACKLIST OF NAMES. The first version of this listed the
    // identifiers a chapter might compare against (`answer`, `correct`, `target`…) and mutation
    // walked straight through it: world1 calls its answer `data.n`, so `show={pending === data.n}`
    // — a bar that appears only when the child is right — passed cleanly. A list of forbidden names
    // is a proxy for the rule and is always one name short. The real rule is that the condition is
    // a presence check on the chosen value and nothing else, which is expressible exactly.
    for (const [file, kind, tokens] of CHAPTERS) {
      if (kind !== 'bar') continue
      const s = src(file)
      let bars = 0
      const used: string[] = []
      // ⚠️ `\s` AFTER THE TAG NAME IS LOAD-BEARING. Without it `<ReadyBar` is a PREFIX match, so
      // renaming the component to `<ReadyBarX` — i.e. unwiring the bar entirely — still matched and
      // the mutation survived. A tag name is only matched when its boundary is matched too.
      for (const m of s.matchAll(/<ReadyBar\s[\s\S]*?\/>/g)) {
        bars++
        const showAttr = m[0].match(/show=\{([^}]*)\}/)
        expect(showAttr, `${file}: the bar renders with no show condition at all`).not.toBeNull()
        const expr = showAttr![1].replace(/\s+/g, '')
        // `!= null` and `!== null` are the same presence check; both spellings are in the band.
        const token = tokens.find(t => new RegExp(`(^|&&)${t}!==?null$`).test(expr))
        expect(token, `${file}: this bar is gated on something other than "have they chosen", i.e. on the answer: "${expr}"`).toBeDefined()
        used.push(token!)
        expect(expr.split(token!).length - 1,
          `${file}: the chosen value is used more than once in "${expr}" — the extra use can only be a comparison against the right answer`).toBe(1)
      }
      // ⚠️ COUNTED AGAINST THE TABLE, because "at least one bar" is satisfied by the OTHER one.
      // ShapeStudio answers two ways — number chips on a `sides` round, shape tiles on a `name` one
      // — and mutation showed that deleting the chips' bar left the tiles' bar to satisfy the check
      // while half the chapter shipped with no commit step at all.
      expect(bars, `${file}: expected one bar per answer surface`).toBe(tokens.length)
      expect(new Set(used).size, `${file}: two bars share one chosen value, so a surface has none of its own`).toBe(tokens.length)
    }
  })

  /** A choice must be undoable before it is submitted, or "submit when ready" is a trap. */
  it('lets the child change their mind before submitting', () => {
    const TOGGLERS = CHAPTERS.filter(([, k]) => k === 'bar').map(([f]) => f)
    // RainbowTown changes its mind by painting over the choice rather than by re-tapping it, which
    // is what a colouring page affords; it is the one exception and is named rather than exempted.
    const byRetap = TOGGLERS.filter(f => f !== 'RainbowTown.tsx')
    expect(byRetap.length).toBe(12)
    for (const f of byRetap) {
      expect(src(f), `${f}: a chosen answer can no longer be unchosen`)
        .toMatch(/set[A-Za-z]*\(\s*p\s*=>\s*\(?\s*p === /)
    }
    expect(src('RainbowTown.tsx'), 'RainbowTown stopped letting the child paint over their choice')
      .toContain('setPendingPaint(brush)')
  })
})
