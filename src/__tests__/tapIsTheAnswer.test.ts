import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import SubmitOnPick from '@/features/chapters/story/SubmitOnPick'
import { join } from 'path'
import { strip } from './_window'

const src = (f: string) => strip(readFileSync(join(process.cwd(), 'src/features/chapters/story', f), 'utf8'))

/**
 * ⚠️ IN A STORYBOOK CHAPTER A TAP IS THE ANSWER — founder, 2026-10-01: the green Ready button goes; the child
 * taps, at once hears and sees right or wrong, and a wrong answer is still retried in place. (Until then a
 * student's request of 2026-08-27 held every tap behind a shared Ready bar.)
 *
 * The chapters answer in two ways, which is why this is a table rather than a grep:
 *   • `tap`  — a tap CHOOSES and the shared `SubmitOnPick` submits that choice at once, through the chapter's own
 *              commit (so its grading, voice and retry are untouched). The token is the chosen-state it is gated on.
 *   • `own`  — the child BUILDS the answer (a set, a sum of coins, a length) and sends it with the chapter's own
 *              control, in its own words ("Pay ✓"). Not a Ready button over a tap, so it stays. The token is that
 *              control's handler or exact label.
 *
 * ⚠️ AN `own` TOKEN IS A LABEL OR A HANDLER, NEVER A BARE WORD (`Done` also matches `onDone`).
 * ⚠️ THE COUNT IS ASSERTED, so a chapter cannot join or leave the band without joining this table.
 */
const CHAPTERS: Array<[file: string, kind: 'tap' | 'own', tokens: string[]]> = [
  ['BeadShop.tsx', 'tap', ['pending']],
  ['BigOrSmall.tsx', 'tap', ['pending']],
  ['FollowTheLeader.tsx', 'tap', ['pending']],
  ['MarketDay.tsx', 'tap', ['pending']],
  ['NestTree.tsx', 'tap', ['pickedIdx']],
  ['NumberTown.tsx', 'tap', ['pending']],
  ['PlayTime.tsx', 'tap', ['pending']],
  ['RainbowTown.tsx', 'tap', ['pendingPaint']],
  ['SeesawPark.tsx', 'tap', ['pending']],
  // two answer surfaces, one per round type: number chips on `sides`, shape tiles on `name`
  ['ShapeStudio.tsx', 'tap', ['pendingNum', 'pendingName']],
  ['ShapeTown.tsx', 'tap', ['pending']],
  ['StoryTime.tsx', 'tap', ['pending']],
  ['world1.tsx', 'tap', ['pending']],
  ['BlockYard.tsx', 'own', ['onDone={commit}']],
  ['BuildingBlocks.tsx', 'own', ['Done ✓']],
  ['CoinShop.tsx', 'own', ['onClick={onPay}']],
  ['HomeTime.tsx', 'own', ['Ready! 🔔']],
  ['HopAlong.tsx', 'own', ['Ready ✓']],
  ['MeasureIt.tsx', 'own', ['Done ✓']],
  ['SliceShop.tsx', 'own', ['onClick={commit}']],
  ['TickTock.tsx', 'own', ['onClick={commit}']],
]

describe('a tap is the answer: no Ready button anywhere in the band', () => {
  it('covers the whole band — a chapter cannot ship outside this rule by omission', () => {
    expect(CHAPTERS.length, 'a chapter joined or left the band without joining this table').toBe(21)
    expect(new Set(CHAPTERS.map(c => c[0])).size).toBe(CHAPTERS.length)
  })

  it('the shared Ready bar is gone, and no chapter renders it', () => {
    expect(existsSync(join(process.cwd(), 'src/features/chapters/story/ReadyBar.tsx')), 'ReadyBar.tsx is back').toBe(false)
    for (const [file] of CHAPTERS) expect(src(file), `${file} renders the Ready bar again`).not.toMatch(/<ReadyBar\b|from '\.\/ReadyBar'/)
  })

  for (const [file, kind, tokens] of CHAPTERS) {
    it(`${file} — ${kind === 'tap' ? 'a tap submits at once' : 'its own send control for a built answer'}`, () => {
      const s = src(file)
      if (kind === 'own') {
        expect(s, `${file} lost the control its commit was wired to`).toContain(tokens[0])
        return
      }
      expect(s, `${file} stopped importing SubmitOnPick`).toContain("from './SubmitOnPick'")
      expect(s, `${file} stopped rendering SubmitOnPick`).toMatch(/<SubmitOnPick\s/)
      for (const t of tokens) expect(s, `${file} lost the chosen state the submit is gated on`).toContain(t)
    })
  }

  /**
   * ⚠️ THE SUBMIT MAY NEVER BE GATED ON WHETHER THE CHOICE IS RIGHT. Auto-submitting only a correct choice would
   * leave a wrong tap ungraded and silent — the child would see nothing happen — and would announce the answer.
   * It is gated on "something is chosen" and on nothing else, asserted as a shape (a list of forbidden names is
   * always one name short: world1 calls its answer `data.n`).
   */
  it('submits any choice, never only a correct one', () => {
    for (const [file, kind, tokens] of CHAPTERS) {
      if (kind !== 'tap') continue
      const s = src(file)
      let tags = 0
      const used: string[] = []
      // ⚠️ `\s` AFTER THE TAG NAME: without it `<SubmitOnPick` is a prefix match and a renamed tag still passes.
      for (const m of s.matchAll(/<SubmitOnPick\s[\s\S]*?\/>/g)) {
        tags++
        const showAttr = m[0].match(/show=\{([^}]*)\}/)
        expect(showAttr, `${file}: submits with no show condition at all`).not.toBeNull()
        const expr = showAttr![1].replace(/\s+/g, '')
        const token = tokens.find(t => new RegExp(`(^|&&)${t}!==?null$`).test(expr))
        expect(token, `${file}: gated on something other than "have they chosen", i.e. on the answer: "${expr}"`).toBeDefined()
        used.push(token!)
        expect(expr.split(token!).length - 1, `${file}: the chosen value is used more than once in "${expr}"`).toBe(1)
      }
      // one per answer surface: ShapeStudio answers with number chips AND shape tiles
      expect(tags, `${file}: expected one SubmitOnPick per answer surface`).toBe(tokens.length)
      expect(new Set(used).size, `${file}: two surfaces share one chosen value`).toBe(tokens.length)
    }
  })
})

/** Driven, not read: a choice is committed once, the moment it exists, and nothing is committed without one. */
describe('SubmitOnPick', () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  it('commits once when a choice appears, and never without one', async () => {
    const host = document.createElement('div')
    const root = createRoot(host)
    let chosen = false, commits = 0
    const render = () => act(async () => { root.render(createElement(SubmitOnPick, { show: chosen, onCommit: () => { commits++; chosen = false } })) })
    await render()
    expect(commits, 'committed with nothing chosen').toBe(0)
    chosen = true
    await render()                    // the tap: a choice exists, so it is submitted
    expect(commits).toBe(1)
    await render()                    // the commit cleared it: no second submit for the same tap
    expect(commits).toBe(1)
    expect(host.innerHTML, 'it draws a button again').toBe('')
    await act(async () => root.unmount())
  })
})
