/**
 * Gate for THE LOADING BAY (9–11 · `dataGraphs`) on GameShell.
 *
 * The instrument is eyeball-only and the second input is a WEBCAM, so everything that can be wrong
 * lives in `story/cargo.ts` and is driven here; what only the component can express is source-checked
 * against real code rather than against a comment.
 *
 * ⚠️ EVERY CHECK BELOW WAS MUTATION-TESTED AGAINST THE SOURCE — see the block at the end of the
 * session notes. A gate that goes green first time is not evidence of anything.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  makeRound, graded, missFor, nudgeFor, explainBeats, instructionFor, badgeFor,
  loadStack, pickStack, loaded, mkMost, mkHowMany, mkDiff, mkTotal, fourCounts, fourGoods,
  EMPTY, GOODS, G, STACKS, MAX_UNITS, MAX_FINGERS, Q_ALL, DEMO, GUIDED,
  type CartV, type LbRound, type QType, type Tier,
} from '@/features/chapters/story/cargo'
import { LOADING_BAY_CONFIG as CFG, toTask, walkthrough } from '@/features/chapters/teen/games/LoadingBayGame'

const TIERS: Tier[] = [1, 2, 3]
const SRC = readFileSync(join(process.cwd(), 'src/features/chapters/teen/games/LoadingBayGame.tsx'), 'utf8')
const MOD = readFileSync(join(process.cwd(), 'src/features/chapters/story/cargo.ts'), 'utf8')
const REG = readFileSync(join(process.cwd(), 'src/features/chapters/registry.tsx'), 'utf8')
/** ⚠️ COMMENTS STRIPPED BEFORE ANY SOURCE CHECK — a gate's own prose has tripped its own regex here
 *  before, and this file's comments quote the very patterns it forbids. */
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const CODE = code(SRC)

/**
 * Every round the generator can draw, several times over.
 *
 * ⚠️ IT VARIES `asked`, AND THAT IS NOT DECORATION. The generator spends a scarce round on an UNMET
 * reading while a gap exists, so a sweep that always passes `[]` draws exactly ONE question type per
 * tier and every check below would be swept over a third of the chapter. Written that way first; it
 * failed the coverage check honestly and that is how it was found.
 */
function sweep(fn: (r: LbRound, d: Tier) => void, n = 400) {
  const asked: QType[][] = [[], ...Q_ALL.map((_, i) => Q_ALL.slice(0, i + 1) as QType[])]
  for (const d of TIERS) for (let i = 0; i < n; i++) fn(makeRound(d, asked[i % asked.length]), d)
}
const cartOf = (load: number[], pick: number | null = null): CartV => ({ load, pick })

// ─────────────────────────────────────────────────────────────────────────────────────────
describe('the chart the generator draws', () => {
  it('gives four stacks of DISTINCT heights, so `most` has exactly one answer', () => {
    sweep(r => {
      expect(r.counts).toHaveLength(STACKS)
      expect(new Set(r.counts).size).toBe(STACKS)
      const top = Math.max(...r.counts)
      expect(r.counts.filter(c => c === top)).toHaveLength(1)
    })
  })

  it('keeps every stack countable by eye — 1..MAX_UNITS, never 0', () => {
    sweep(r => r.counts.forEach(c => {
      expect(c).toBeGreaterThanOrEqual(1)
      expect(c).toBeLessThanOrEqual(MAX_UNITS)
    }))
  })

  it('grows the pool with the tier — L1 tops out below L3', () => {
    const hi = (d: Tier) => Math.max(...Array.from({ length: 300 }, () => Math.max(...fourCounts(d))))
    expect(hi(1)).toBe(5)
    expect(hi(2)).toBe(6)
    expect(hi(3)).toBe(7)
  })

  it('casts four DIFFERENT goods, each with its own name and picture', () => {
    sweep(r => {
      expect(new Set(r.goods.map(g => g.src)).size).toBe(STACKS)
      expect(new Set(r.goods.map(g => g.plural)).size).toBe(STACKS)
    })
    // and the pool itself is what it claims — a duplicate name in GOODS makes a round unanswerable
    // and every round-level check above would still pass. (Pools need their own assertion.)
    expect(new Set(GOODS.map(g => g.plural)).size).toBe(GOODS.length)
    expect(new Set(GOODS.map(g => g.src)).size).toBe(GOODS.length)
    expect(GOODS.length).toBeGreaterThanOrEqual(STACKS)
    expect(fourGoods()).toHaveLength(STACKS)
  })

  it('`ink` is a real scale-up for every good — without it a fat sprite reads as a taller bar', () => {
    GOODS.forEach(g => {
      expect(g.ink).toBeGreaterThanOrEqual(1)
      expect(g.ink).toBeLessThan(3)
    })
  })

  it('`diff` always names the BIGGER stack as `focus`, so the answer is never negative', () => {
    sweep(r => {
      if (r.qType !== 'diff') return
      expect(r.counts[r.focus]).toBeGreaterThan(r.counts[r.other])
      expect(r.focus).not.toBe(r.other)
      expect(r.answer).toBe(r.counts[r.focus] - r.counts[r.other])
      expect(r.answer).toBeGreaterThanOrEqual(1)
    })
  })

  it('`most` answers with a stack INDEX and everything else with a COUNT', () => {
    sweep(r => {
      if (r.qType === 'most') {
        expect(r.answer).toBeGreaterThanOrEqual(0)
        expect(r.answer).toBeLessThan(STACKS)
        expect(r.counts[r.answer]).toBe(Math.max(...r.counts))
      } else if (r.qType === 'total') {
        expect(r.answer).toBe(r.counts.reduce((s, c) => s + c, 0))
      } else {
        expect(r.answer).toBeGreaterThanOrEqual(1)
      }
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────────────────
describe('the answer surface can express every round it is offered on', () => {
  /**
   * ⚠️ THE INVARIANT THAT DECIDES WHICH ROUNDS THE HAND MAY SHIP ON. A round whose answer two hands
   * cannot show is unanswerable by camera, which is worse than a wrong one — so `total` (up to 22)
   * is excluded by `hand.when` and every other type has to fit inside ten fingers.
   */
  it('every hand-answerable round fits in ten fingers', () => {
    sweep(r => {
      const t = toTask(r)
      if (!CFG.hand!.when!(t)) return
      const n = r.qType === 'most' ? r.answer + 1 : r.answer
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(MAX_FINGERS)
    })
  })

  it('`total` is the ONLY type the hand is withheld from, and it really can exceed ten', () => {
    const off = new Set<QType>()
    sweep(r => { if (!CFG.hand!.when!(toTask(r))) off.add(r.qType) })
    expect([...off]).toEqual(['total'])
    const big = Array.from({ length: 300 }, () => makeRound(3, ['most', 'howMany', 'diff']))
    expect(big.every(r => r.qType === 'total')).toBe(true)
    expect(Math.max(...big.map(r => r.answer))).toBeGreaterThan(MAX_FINGERS)
  })

  /** ⚠️ NO ANSWER HERE IS EVER ZERO, so a fist must not commit — and the two halves must agree. */
  it('a fist is not an answer, and no round accepts one', () => {
    expect(CFG.hand!.ready!({ count: 0, hands: 1 } as never)).toBe(false)
    expect(CFG.hand!.ready!({ count: 3, hands: 0 } as never)).toBe(false)
    expect(CFG.hand!.ready!({ count: 3, hands: 1 } as never)).toBe(true)
    sweep(r => expect(r.answer === 0 && r.qType !== 'most').toBe(false))
  })

  it('a stack number out of range enters nothing and commits nothing', () => {
    const r = mkMost([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4])
    const t = toTask(r)
    for (const n of [5, 6, 7, 9, 10]) {
      const v = CFG.hand!.enter!(t, EMPTY, n)
      expect(v.pick).toBeNull()
      expect(CFG.hand!.commits!(t, v)).toBe(false)
      expect(nudgeFor(r, n)).toMatch(/1, 2, 3 or 4/)
    }
    /**
     * ⚠️ AND IT MUST STAY SILENT AT ZERO. An empty frame reads as a count of 0, so a nudge bounded
     * below printed "There are only 4 stacks" at a child who had held up nothing — and displaced
     * the instruction chip that should have been there. Found by opening the camera door.
     */
    expect(nudgeFor(r, 0)).toBeNull()
    expect(CFG.hand!.commits!(t, CFG.hand!.enter!(t, EMPTY, 0))).toBe(false)
    for (let n = 1; n <= STACKS; n++) {
      const v = CFG.hand!.enter!(t, EMPTY, n)
      expect(v.pick).toBe(n - 1)
      expect(CFG.hand!.commits!(t, v)).toBe(true)
      expect(nudgeFor(r, n)).toBeNull()
    }
  })

  /** ⚠️ THE FOCUS MUST NOT BE STACK 0 HERE. Written with `focus: 0` first, this passed with the
   *  hand hard-wired to load stack 0 — the fixture was doing the work the assertion claimed to. */
  it('the hand loads the FOCUS stack on a count round — never some other one', () => {
    const r = mkDiff([G.pumpkin, G.candy, G.bucket, G.melon], [3, 6, 2, 5], 1, 0)
    expect(r.focus).toBe(1)
    const v = CFG.hand!.enter!(toTask(r), EMPTY, 3)
    expect(v.load).toEqual([0, 3, 0, 0])
    expect(graded(r, v)).toBe(true)
    const h = mkHowMany([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4], 3)
    expect(CFG.hand!.enter!(toTask(h), EMPTY, 4).load).toEqual([0, 0, 0, 4])
  })
})

// ─────────────────────────────────────────────────────────────────────────────────────────
describe('one value, three ways in, one grader', () => {
  it('`loadStack` clamps to the stack it is loading and never past it', () => {
    const r = mkHowMany([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4], 1)
    expect(loadStack(r, EMPTY, 1, 9).load).toEqual([0, 5, 0, 0])
    expect(loadStack(r, EMPTY, 1, -4).load).toEqual([0, 0, 0, 0])
    expect(loadStack(r, EMPTY, 2, 2).load).toEqual([0, 0, 2, 0])
    // out of range is a no-op rather than a crash or a fifth column
    expect(loadStack(r, EMPTY, 4, 1)).toBe(EMPTY)
    expect(loadStack(r, EMPTY, -1, 1)).toBe(EMPTY)
    expect(pickStack(EMPTY, 4).pick).toBeNull()
    expect(pickStack(EMPTY, 0).pick).toBe(0)
  })

  /**
   * ⚠️ WHERE THE GOODS CAME FROM IS PART OF THE ANSWER. This is SliceShop's grader hole: a cart whose
   * TOTAL is right but whose goods came off the wrong stacks is not the answer, and only mutation
   * testing found it there.
   */
  it('`howMany` rejects the right total taken off the wrong stacks', () => {
    const r = mkHowMany([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4], 1)   // 5 melons
    expect(graded(r, cartOf([0, 5, 0, 0]))).toBe(true)
    expect(graded(r, cartOf([3, 0, 2, 0]))).toBe(false)   // five items, none of them a melon
    expect(graded(r, cartOf([1, 4, 0, 0]))).toBe(false)   // five items, one off the wrong stack
    expect(graded(r, cartOf([0, 4, 0, 0]))).toBe(false)
    /**
     * ⚠️ THE CASE THAT ACTUALLY GUARDS THE "AND NOTHING ELSE" CLAUSE, and the first draft of this
     * test did not have it: every cart above already fails on the FOCUS count alone, so deleting the
     * clause left the whole check green. Found by mutation, not by reading. Five melons plus three
     * apples is the right answer with something else on top of it.
     */
    expect(graded(r, cartOf([3, 5, 0, 0]))).toBe(false)
    expect(graded(r, cartOf([0, 5, 0, 4]))).toBe(false)
  })

  it('`diff` rejects the right count taken off the smaller stack', () => {
    const r = mkDiff([G.pumpkin, G.candy, G.bucket, G.melon], [6, 3, 2, 5], 0, 1)  // 6 − 3 = 3
    expect(graded(r, cartOf([3, 0, 0, 0]))).toBe(true)
    expect(graded(r, cartOf([0, 3, 0, 0]))).toBe(false)
    expect(graded(r, cartOf([0, 0, 0, 3]))).toBe(false)
    expect(graded(r, cartOf([2, 1, 0, 0]))).toBe(false)
    expect(graded(r, cartOf([6, 0, 0, 0]))).toBe(false)
    expect(graded(r, cartOf([3, 3, 0, 0]))).toBe(false)   // the spares, plus the stack they beat
  })

  it('`total` needs every stack, not a matching sum', () => {
    const r = mkTotal([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4])        // 14
    expect(graded(r, cartOf([3, 5, 2, 4]))).toBe(true)
    expect(graded(r, cartOf([3, 5, 6, 0]))).toBe(false)   // sums to 14, one stack untouched
    expect(graded(r, cartOf([3, 5, 2, 0]))).toBe(false)
  })

  it('`most` grades the stack and ignores the cart entirely', () => {
    const r = mkMost([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4])
    expect(graded(r, cartOf([0, 0, 0, 0], 1))).toBe(true)
    expect(graded(r, cartOf([0, 5, 0, 0], 3))).toBe(false)
    expect(graded(r, EMPTY)).toBe(false)
  })

  it('the correct cart always grades correct, on every round the generator draws', () => {
    sweep(r => {
      const right: CartV = r.qType === 'most' ? cartOf([0, 0, 0, 0], r.answer)
        : r.qType === 'total' ? cartOf(r.counts.slice())
          : cartOf(r.counts.map((_, i) => (i === r.focus ? r.answer : 0)))
      expect(graded(r, right)).toBe(true)
      expect(loaded(right)).toBe(r.qType === 'most' ? 0 : r.answer)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────────────────
describe('coverage — every reading gets asked', () => {
  it('declares all four readings, and the generator can produce each of them', () => {
    expect(CFG.coverage!.all).toEqual(Q_ALL)
    const seen = new Set<QType>()
    sweep(r => seen.add(r.qType))
    expect([...seen].sort()).toEqual([...Q_ALL].sort())
  })

  it('spends a round on an UNMET reading while a gap exists', () => {
    for (let i = 0; i < 60; i++) {
      expect(makeRound(3, ['howMany', 'diff']).qType).toBe('total')
      expect(makeRound(2, ['most', 'howMany']).qType).toBe('diff')
      expect(makeRound(1, ['most']).qType).toBe('howMany')
    }
  })

  it('goes RANDOM once the gap closes — hardest-first for ever would kill the variety', () => {
    const seen = new Set<QType>()
    for (let i = 0; i < 200; i++) seen.add(makeRound(3, [...Q_ALL]).qType)
    expect(seen.size).toBeGreaterThan(1)
  })

  it('reads the reading off the task the same way the shell will', () => {
    sweep(r => expect(CFG.coverage!.of(toTask(r))).toBe(r.qType))
  })
})

// ─────────────────────────────────────────────────────────────────────────────────────────
describe('nothing prints the answer before the child gives it', () => {
  /**
   * ⚠️ THE FAULT THIS CHAPTER EXISTS TO FIX. The chapter it replaces drew every bar's value while the
   * question was open. Here the badge may name the OPERATION and may not carry a quantity.
   */
  it('the board badge never contains a number', () => {
    sweep(r => expect(badgeFor(r)).not.toMatch(/\d/))
    sweep(r => expect(toTask(r).badge).not.toMatch(/\d/))
    expect(CFG.start.ticket.badge).not.toMatch(/\d/)
  })

  it('the prompt never states a count or the winning stack', () => {
    sweep(r => {
      expect(r.prompt).not.toMatch(/\d/)
      const words = r.prompt.toLowerCase().split(/[^a-z]+/)
      if (r.qType === 'most') expect(words).not.toContain(r.goods[r.answer].plural)
    })
  })

  /** ⚠️ THE NUMERALS AND THE CART'S COUNT ARE KEYED ON AN ANSWER BEING IN, NOT ON `disabled` ALONE —
   *  the shell renders the whole walkthrough disabled, so `disabled` alone printed every count over
   *  beat 2 of a demo whose own line is "you can see it without counting a thing". */
  it('the reveal flag is derived from the value, not from `disabled`', () => {
    expect(CODE).toMatch(/const told = reveal \|\| \(disabled && ready\(r, v\)\)/)
    expect(CODE.match(/told/g)!.length).toBeGreaterThanOrEqual(3)
  })

  it('and the walkthrough only reaches it on the beat that announces the answer', () => {
    for (const d of DEMO) {
      const beats = explainBeats(d)
      // ⚠️ the LAST beat must be an answer and every earlier one must not, or the demo prints its
      // own answer over the sentence that says you do not need it
      beats.forEach((b, i) => {
        const isAnswer = d.qType === 'most' ? b.v.pick !== null : loaded(b.v) > 0
        if (i === 0) expect(isAnswer).toBe(false)
        if (i === beats.length - 1) expect(isAnswer).toBe(true)
      })
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────────────────
describe('the words', () => {
  /** ⚠️ A MISS LINE MAY NOT NAME AN ACCEPTED ANSWER — including by arithmetic coincidence. */
  it('no miss line contains a number at all', () => {
    sweep(r => expect(missFor(r)).not.toMatch(/\d/))
  })

  it('a miss line does not narrow with the guess — it takes only the round', () => {
    expect(missFor.length).toBe(1)
    const a = mkHowMany([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4], 1)
    const b = mkHowMany([G.apple, G.melon, G.bucket, G.basket], [1, 5, 6, 2], 1)
    expect(missFor(a)).toBe(missFor(b))
  })

  it('every round type has its OWN miss line', () => {
    const lines = [
      missFor(mkMost([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4])),
      missFor(mkHowMany([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4], 1)),
      missFor(mkDiff([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4], 1, 0)),
      missFor(mkTotal([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4])),
    ]
    expect(new Set(lines).size).toBe(4)
  })

  /**
   * ⚠️ ZONE 3 IS THE ONLY ZONE THAT KNOWS HOW THE CHILD ANSWERS, and a single-mode check cannot see
   * the miss: wording written for the other surface reads perfectly, it just addresses the wrong
   * child. Assert POSITIVELY in each direction.
   */
  it('the tap chip never names fingers and the hand chip never names a tap', () => {
    sweep(r => {
      const tap = instructionFor(r, 'tap')
      const hand = instructionFor(r, 'hand')
      expect(tap).not.toMatch(/hold up|finger/i)
      expect(tap).toMatch(/tap/i)
      expect(hand).not.toBe(tap)
      // ⚠️ the ONE exception, and it must be exactly one: `total` has no hand path, so its hand chip
      // says to tap instead — a gesture that silently does nothing reads as a broken camera.
      if (r.qType === 'total') expect(hand).toMatch(/tap/i)
      else expect(hand).not.toMatch(/tap/i)
    })
  })

  /** ⚠️ ONE verb-led action. Built by appending a gesture to a stem ending in "then", the tap chips
   *  came out "…, then tap them onto the cart one at a time, then send it." */
  it('a chip states one action, not a chain of "then"s', () => {
    sweep(r => {
      for (const input of ['tap', 'hand'] as const) {
        const chip = instructionFor(r, input)
        expect(chip.match(/\bthen\b/g) ?? []).toHaveLength(1)
      }
    })
  })

  it('the `most` chip names the range of stack numbers a hand may hold up', () => {
    const r = mkMost([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4])
    expect(instructionFor(r, 'hand')).toMatch(/1 to 4/)
  })

  it('zones 1 and 2 never change with the input — only zone 3 does', () => {
    sweep(r => {
      expect(r.prompt).toBe(toTask(r).context)
      expect(toTask(r).say).toBe(r.prompt)
    })
  })

  it('the anchor states a tally the chapter can actually draw', () => {
    const nums = String(CFG.start.blurb).match(/\d+/g)!.map(Number)
    expect(nums.length).toBeGreaterThan(0)
    nums.forEach(n => expect(n).toBeLessThanOrEqual(MAX_UNITS))
    // it opens at L1, where a stack tops out lower still
    nums.forEach(n => expect(n).toBeLessThanOrEqual(5))
  })
})

// ─────────────────────────────────────────────────────────────────────────────────────────
describe('the walkthrough', () => {
  /**
   * ⚠️ THE PICTURE MUST AGREE WITH THE SENTENCE. The Supply Run's demo said "that stays behind" while
   * its own counts put the remainder in a van; the words were right, the numbers were right, and only
   * their pairing was wrong — which nothing component-local can see.
   */
  it('every worked example ENDS on a cart that grades correct', () => {
    for (const d of [...DEMO, GUIDED]) {
      const last = explainBeats(d).at(-1)!
      expect(graded(d, last.v), `${d.qType} demo ends wrong`).toBe(true)
    }
    sweep(r => expect(graded(r, explainBeats(r).at(-1)!.v)).toBe(true))
  })

  it('a `total` beat never claims a sum its own cart is not showing', () => {
    const r = mkTotal([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4])
    explainBeats(r).forEach(b => {
      const said = b.say.match(/makes (\d+)/)
      if (said) expect(Number(said[1])).toBe(loaded(b.v))
    })
  })

  it('a `howMany` beat never loads a stack the question is not about', () => {
    sweep(r => {
      if (r.qType !== 'howMany' && r.qType !== 'diff') return
      explainBeats(r).forEach(b => b.v.load.forEach((n, i) => {
        if (i !== r.focus) expect(n).toBe(0)
      }))
    })
  })

  it('teaches three DIFFERENT readings before anything is scored', () => {
    expect(new Set(DEMO.map(d => d.qType)).size).toBe(DEMO.length)
    expect(DEMO.length).toBeGreaterThanOrEqual(3)
    expect(Array.isArray(CFG.tutorial)).toBe(true)
    expect((CFG.tutorial as unknown[]).length).toBe(DEMO.length)
  })

  it('the walkthrough steps drive the beats rather than a second copy of them', () => {
    for (const d of DEMO) {
      const w = walkthrough(d)
      const beats = explainBeats(d)
      expect(w.steps.map(s => s.say)).toEqual(beats.map(b => b.say))
      expect(w.steps.map(s => s.value)).toEqual(beats.map(b => b.v))
      expect(w.initial).toBe(EMPTY)
    }
  })

  it('the guided round is not one of the worked examples', () => {
    const sig = (r: LbRound) => CFG.sig!(toTask(r))
    expect(DEMO.map(sig)).not.toContain(sig(GUIDED))
    expect(new Set(DEMO.map(sig)).size).toBe(DEMO.length)
  })

  it('the re-teach narrates the same beats', () => {
    sweep(r => expect(toTask(r).work).toEqual(explainBeats(r).map(b => b.say)))
  })
})

// ─────────────────────────────────────────────────────────────────────────────────────────
describe('the reveal', () => {
  it('glides the cart to the answer, and it grades correct when it lands', () => {
    for (const d of [...DEMO, GUIDED, ...Array.from({ length: 60 }, () => makeRound(3))]) {
      let v: CartV = EMPTY
      const jobs: Array<[number, () => void]> = []
      CFG.glide(toTask(d), EMPTY, x => { v = x }, (fn, ms) => { jobs.push([ms, fn]) })
      jobs.sort((a, b) => a[0] - b[0]).forEach(([, fn]) => fn())
      expect(graded(d, v), `${d.qType} glide lands wrong`).toBe(true)
    }
  })

  /** ⚠️ IT WAITS FIRST — the cart the CHILD loaded is the teaching, and taking it away instantly
   *  leaves a verdict with no consequence attached. */
  it('holds the child’s own cart before it starts', () => {
    const jobs: number[] = []
    CFG.glide(toTask(DEMO[1]), EMPTY, () => {}, (_fn, ms) => { jobs.push(ms) })
    expect(Math.min(...jobs)).toBeGreaterThanOrEqual(700)
  })

  it('names the answer in words the child can act on', () => {
    const most = mkMost([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4])
    expect(CFG.revealText(toTask(most))).toContain('melons')
    const hm = mkHowMany([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4], 1)
    expect(CFG.revealText(toTask(hm))).toBe('5')
  })
})

// ─────────────────────────────────────────────────────────────────────────────────────────
describe('the chapter is wired as a 9–11 chapter on the shell', () => {
  it('declares the band, the chapter id and the hand', () => {
    expect(CFG.band).toBe('9-11')
    expect(CFG.chapterId).toBe('dataGraphs')
    expect(CFG.hand!.reads).toBe('count')
    expect(CFG.hand!.denied).toBeTruthy()
  })

  it('dedupes on the MATHS, so re-drawn cargo is not a new question', () => {
    const a = mkHowMany([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4], 1)
    const b = mkHowMany([G.cherry, G.cookie, G.candy, G.pumpkin], [3, 5, 2, 4], 1)
    expect(CFG.sig!(toTask(a))).toBe(CFG.sig!(toTask(b)))
    const c = mkHowMany([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4], 2)
    expect(CFG.sig!(toTask(a))).not.toBe(CFG.sig!(toTask(c)))
  })

  it('the registry loads the GameShell chapter and the story route no longer does', () => {
    expect(REG).toMatch(/dataGraphs: teen\(/)
    expect(REG).toMatch(/games\/LoadingBayGame/)
    const STORY = readFileSync(join(process.cwd(), 'src/features/chapters/storyChapters.tsx'), 'utf8')
    expect(STORY).not.toMatch(/dataGraphs/)
    const PAGE = code(readFileSync(join(process.cwd(), 'src/app/story/page.tsx'), 'utf8'))
    expect(PAGE).not.toMatch(/dataGraphs/)
  })

  it('the instrument keeps a REAL commit button on both paths', () => {
    // ⚠️ Replacing the control with the dwell ring leaves a child whose gesture the camera cannot
    // read with nothing to press — and it is the ONLY way to answer a `total` round.
    expect(CODE).toMatch(/Send the cart/)
    expect(CODE).not.toMatch(/onCam &&[^\n]*Send the cart/)
  })

  it('the instrument mirrors its value in a ref — two taps in one batch must not collide', () => {
    expect(CODE).toMatch(/useLatest\(task, v\)/)
    expect(CODE).toMatch(/latest\.read\(\)/)
    // ⚠️ and nothing reads the RENDERED value inside a handler, which is what the ref is for
    expect(CODE).not.toMatch(/const tapUnit = \(i: number\) => put\(i, v\.load/)
  })

  it('nothing on the instrument changes appearance with whether the answer is RIGHT', () => {
    // the commit is styled from `ready`, never from `graded` — a button that lights on the right
    // answer is chapter 4's green Ready button, which the founder caught
    const call = CODE.split('\n').find(l => l.includes('Send the cart'))!
    expect(call).toMatch(/!ready\(r, v\)/)
    expect(call).not.toMatch(/graded\(|answer/)
  })

  it('the instrument draws the goods, so deleting the art deletes the question', () => {
    expect(CODE).toMatch(/g\.src/)
    expect(CODE).toMatch(/scale\(\$\{g\.ink\}\)/)
    // the chart is authored BIG — FitSlot only ever shrinks a 9–11 instrument
    expect(MOD).not.toMatch(/const UNIT/)
    expect(CODE).toMatch(/const UNIT = (\d+)/)
    expect(Number(CODE.match(/const UNIT = (\d+)/)![1])).toBeGreaterThanOrEqual(24)
  })
})
