/**
 * Gate for THE LONG LEVEL (9–11 `rounding`).
 *
 * It drives the SAME exported functions the scene renders and grades from — `makeRound`,
 * `checksFor`, `gradePicks`, `missFor`, `levelLayout` — rather than re-implementing any of them.
 * A check that keeps its own copy of a rule agrees with itself while the screen it is meant to
 * protect falls apart; this repo has shipped that twice.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  makeRound, checksFor, gradePicks, missFor, levelLayout, roundTo,
  CHECKPOINTS, Q_ALL, RUN, levelAt, RUNNER_ASPECT, CHROME_PX, IMG_H, IMG_W, ASTRO,
  markerHeight, controlBand,
  dropIndex, onAstro, CATCH_SHARE, levelAsk, levelPoint, CAM_PATH_Y,
  PILL_TOP, pillFont, pillH, pillCeiling, PLAN_PROBLEM, PLAN_POINTS, PLAN_BUDGET, boardsTop,
  type LvRound, type QType,
} from '@/features/chapters/story/LevelRun'
import { stepBoardRect } from '@/features/chapters/story/chalkboard'

/** the chapter's own source, comments stripped — comments are prose, not code, and this repo has
 *  shipped a source check that matched the paragraph explaining a rule instead of the code obeying it */
const SRC = readFileSync(join(process.cwd(), 'src/features/chapters/story/LevelRun.tsx'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

const TIERS = [1, 2, 3] as const
/** Every round the generator can produce, at every tier, over enough draws to hit the tails. */
function everyRound(n = 400): LvRound[] {
  const out: LvRound[] = []
  for (const d of TIERS) for (let r = 0; r < 10; r++) for (let i = 0; i < n / 10; i++) out.push(makeRound(d, r, [...Q_ALL]))
  return out
}

describe('rounding — the arithmetic', () => {
  it('rounds half UP, which is the rule the chapter states out loud', () => {
    expect(roundTo(15, 10)).toBe(20)
    expect(roundTo(75, 10)).toBe(80)
    expect(roundTo(250, 100)).toBe(300)
    expect(roundTo(14, 10)).toBe(10)
    expect(roundTo(249, 100)).toBe(200)
  })
})

describe('the question', () => {
  const rounds = everyRound()

  it('never asks a number that is already ON a checkpoint — that would be answerable by matching the board', () => {
    for (const r of rounds) for (const leg of r.legs) expect(leg % r.m).not.toBe(0)
  })

  it('always puts the answer among the checks shown', () => {
    for (const r of rounds) {
      for (let i = 0; i < r.legs.length; i++) {
        expect(checksFor(r.legs[i], r.m)).toContain(r.rounded[i])
      }
    }
  })

  it('shows BOTH bracketing checks, so the question is always answerable', () => {
    for (const r of rounds) for (const leg of r.legs) {
      const low = Math.floor(leg / r.m) * r.m
      const s = checksFor(leg, r.m)
      expect(s).toContain(low)
      expect(s).toContain(low + r.m)
    }
  })

  it('draws exactly CHECKPOINTS posts, ascending, none negative', () => {
    for (const r of rounds) for (const leg of r.legs) {
      const s = checksFor(leg, r.m)
      expect(s).toHaveLength(CHECKPOINTS)
      expect(s.every(v => v >= 0)).toBe(true)
      expect([...s].sort((a, b) => a - b)).toEqual(s)
    }
  })

  /**
   * ⚠️ THE COIN-FLIP CHECK, and it is the reason this chapter was rebuilt. Pin the answer to one
   * index and a child taps that post every time without rounding anything.
   */
  it('moves the answer around the line rather than parking it at one post', () => {
    const idx = new Set<number>()
    for (const r of rounds) for (let i = 0; i < r.legs.length; i++) {
      idx.add(checksFor(r.legs[i], r.m).indexOf(r.rounded[i]))
    }
    expect(idx.size).toBeGreaterThanOrEqual(3)
  })

  it('answers an estimate with the sum of the ROUNDED legs, and keeps the exact total apart', () => {
    const est = rounds.filter(r => r.qType === 'estimate')
    expect(est.length).toBeGreaterThan(0)
    for (const r of est) {
      expect(r.legs).toHaveLength(2)
      expect(r.answer).toBe(r.rounded[0] + r.rounded[1])
      expect(r.exact).toBe(r.legs[0] + r.legs[1])
    }
  })

  it('keeps the hard types off the gentlest tier and reaches all three by L3', () => {
    // `asked` full, so the generator is past its deliberate unmet-first branch and drawing from the
    // tier's own pool — which is what "what can this tier ask" actually means.
    const at = (d: 1 | 2 | 3) => new Set(Array.from({ length: 300 }, (_, i) => makeRound(d, i % 10, [...Q_ALL]).qType))
    expect([...at(1)]).toEqual(['round10'])
    expect(at(3).size).toBeGreaterThan(1)
  })

  it('covers every declared question type across a run, or mastery could exit before one is asked', () => {
    const asked: QType[] = []
    for (let r = 0; r < 10; r++) asked.push(makeRound(3, r, asked).qType)
    for (const q of Q_ALL) expect(asked).toContain(q)
  })
})

describe('the grader', () => {
  const est: LvRound = makeRound(3, 0, ['round10', 'round100'])

  it('accepts only the exact roundings', () => {
    const r = makeRound(1, 0, [])
    expect(gradePicks(r, r.rounded).ok).toBe(true)
    expect(gradePicks(r, [r.rounded[0] + r.m]).ok).toBe(false)
  })

  it('reports WHICH leg was wrong, so the miss line can be specific', () => {
    if (est.qType !== 'estimate') return
    expect(gradePicks(est, [est.rounded[0], est.rounded[1] + 10]).badLeg).toBe(1)
    expect(gradePicks(est, [est.rounded[0] - 10, est.rounded[1]]).badLeg).toBe(0)
  })

  /**
   * ⚠️ THE HOLE THAT ONLY MUTATION TESTING FOUND IN SliceShop, planted here on purpose: two legs
   * rounded the WRONG way can still add up to the right total. Grade the sum and this passes.
   */
  it('refuses two wrong roundings that happen to sum to the right answer', () => {
    const fake: LvRound = { ...est, qType: 'estimate', legs: [47, 62], m: 10, rounded: [50, 60], answer: 110, exact: 109 }
    expect(gradePicks(fake, [40, 70]).ok).toBe(false)   // also 110, and completely wrong
    expect(gradePicks(fake, [50, 60]).ok).toBe(true)
  })

  it('treats a leg that has not been picked yet as not-yet-right', () => {
    const r = makeRound(1, 0, [])
    expect(gradePicks(r, [null]).ok).toBe(false)
  })
})

describe('the miss line', () => {
  it('never hands over the checkpoint the child is being asked for', () => {
    for (const r of everyRound(200)) {
      for (let i = 0; i < r.legs.length; i++) {
        const wrong = checksFor(r.legs[i], r.m).filter(v => v !== r.rounded[i])
        for (const w of wrong) {
          const line = missFor(r, i, w)
          // The answer may appear only as part of the halfway RULE, never as a named site.
          expect(line.includes(`the ${r.rounded[i]} `)).toBe(false)
        }
      }
    }
  })

  it('has its own wording for a number sitting exactly halfway', () => {
    const r: LvRound = { ...makeRound(1, 0, []), legs: [75], m: 10, rounded: [80], answer: 80, exact: 75 }
    expect(missFor(r, 0, 70)).toMatch(/exactly halfway/)
    // and it must not claim a dead heat is "past" anything, which is simply false
    expect(missFor(r, 0, 70)).not.toMatch(/is PAST/)
  })

  /**
   * ⚠️ A PLAYED ROUND DRAWS NO HALFWAY POST AND NO MARKER (founder's call — see the chapter header),
   * so a miss line that says "look at the halfway mark" points the child at nothing. The rule has to
   * be carried in words: STATE the halfway value, never direct them to a mark. Mutation-proven: the
   * old "Look at the halfway mark at 650" wording fails this.
   */
  it('states the halfway value rather than pointing at a mark on the line', () => {
    for (const r of everyRound(120)) {
      for (let i = 0; i < r.legs.length; i++) {
        const n = r.legs[i], mid = Math.floor(n / r.m) * r.m + r.m / 2
        for (const w of checksFor(n, r.m).filter(v => v !== r.rounded[i])) {
          const line = missFor(r, i, w)
          expect(line).not.toMatch(/look at the/i)
          // a near-miss line still owes the child the halfway number itself
          if (w === mid - r.m / 2 || w === mid + r.m / 2) expect(line).toContain(String(mid))
        }
      }
    }
  })

  it('points at the bracket when the pick is not even one of the two neighbours', () => {
    const r: LvRound = { ...makeRound(1, 0, []), legs: [47], m: 10, rounded: [50], answer: 50, exact: 47 }
    expect(missFor(r, 0, 10)).toMatch(/between 40 and 50/)
  })
})

describe('the layout', () => {
  /**
   * ⚠️ THE WIDE ONES ARE THE POINT. The backdrop is cover-fitted, so a frame whose aspect differs
   * from the art's 1.79 crops the picture and MOVES the painted path. 1280×720 is 1.78 and hid the
   * bug completely; 2000×970 is 2.06 and floated the runner 44px above the track.
   */
  const SIZES: Array<[number, number]> = [
    [1280, 720], [1440, 900], [1024, 620], [1600, 950], [820, 420], [740, 360], [640, 320],
    [2000, 970], [2560, 1080], [1920, 800],
  ]

  it('puts the path where the PAINTING puts it, through the same cover-fit the backdrop uses', () => {
    for (const [vw, vh] of SIZES) for (const s of RUN) {
      const L = levelLayout(vw, vh, s.pathY)
      const fit = Math.max(vw / IMG_W, vh / IMG_H)
      const drawnH = IMG_H * fit
      const painted = (vh - drawnH) / 2 + s.pathY * drawnH
      // EXACT: the painted path, or the marker clamp — and nothing else. A "<= painted" assertion
      // reads as reasonable and lets the original bug straight through, which is what mutation
      // testing this check showed: reverting to `vh * pathY` (776 against a painted 820) passed it.
      // ⚠️ EXACT, WITH NO CLAMP TERM AT ALL — which is the strongest form this can take, and the
      // whole point. Any clamp expressed in terms of the marker's own height MOVES WITH the marker,
      // so a check written that way cannot see the marker grow (proven: raising `markerHeight` back
      // to its old value passed the earlier version of this test). Stated as a bare equality, the
      // painted path is pinned to the painting and nothing downstream can pull the cast off it.
      expect(L.pathPx).toBe(Math.round(painted))
    }
  })

  /**
   * ⚠️ AGAINST THE COMMIT BUTTON, NOT THE VIEWPORT EDGE. The old version of this asserted the marker
   * stayed on SCREEN, which it always did — while sitting ON the control: measured 8px deep and
   * 101px wide at 1280×720, and 30px at 640×320. The bottom of the frame was never the thing it
   * collides with. Driven through the same two helpers the layout and the button use, so a reserve
   * that drifts from the control it reserves for fails here instead of shipping.
   */
  /**
   * ⚠️ A SOURCE CHECK, BECAUSE THE DIRECTION LIVES IN A CSS TRANSFORM AND NO GEOMETRY ASSERTION CAN
   * SEE IT. Proven by mutation: flipping `DistMarker` back to hanging BELOW the path — the exact
   * regression, the one that put the pill on the commit button — passed every other test in this
   * file. Same shape as the working-board placement FitOut had to source-check: a rule expressed in
   * CSS is invisible to a function that only knows the numbers. Scoped to this component, because
   * `HalfwayPost` legitimately uses the same transform.
   */
  it('grows the distance marker UPWARD from the path', () => {
    const body = SRC.match(/function DistMarker[\s\S]*?\n}/)?.[0] ?? ''
    expect(body).toBeTruthy()
    expect(body).toContain('translate(-50%,-100%)')
  })

  /**
   * ⚠️ A PLAYED ROUND DRAWS NEITHER MARK — founder's call, on a screenshot where the line read
   * "halfway 650" beside a bubble asking about 669. Both are teaching aids, and the marker is the
   * worse of the two: pegging the number's true position on the line IS the answer, so it could be
   * read off without rounding anything. A SOURCE check, because "does this component render that
   * one" is not visible to any layout function — and scoped to `Play`, since `LevelExplain` must
   * keep both (it is the demo, i.e. the teaching surface).
   */
  it('draws no marker and no halfway post in a played round', () => {
    const play = SRC.match(/const LevelPlay[\s\S]*?\n}\n/)?.[0] ?? ''
    expect(play).toBeTruthy()
    expect(play).not.toMatch(/<DistMarker/)
    expect(play).not.toMatch(/<HalfwayPost/)
    // and the demo still has them, or the chapter has stopped teaching the rule at all
    const explain = SRC.match(/const LevelExplain[\s\S]*?\n}\n/)?.[0] ?? ''
    expect(explain).toMatch(/<DistMarker/)
    expect(explain).toMatch(/<HalfwayPost/)
  })

  /**
   * ⚠️ SO THE NUMBER NEEDS A HOME THAT A HAND HINT CANNOT TAKE. On the camera path Milo's bubble
   * shows the hand's state ahead of the ask by design, so from the moment a hand enters frame the
   * bubble stops naming the metre and — with the marker gone — the round is unanswerable. The pill
   * carries it, and it has to sit INSIDE the chrome strip: the name boards are clamped to
   * `CHROME_PX + 6`, so anything hanging below the chrome lands on a board on a short frame.
   * Mutation-proven: moving it to `CHROME_PX + 8` (where the estimate confirmation legitimately
   * sits, because that one only shows once the boards are dimmed) fails this.
   */
  it('keeps the target number clear of whatever is under it, at every size', () => {
    for (const [vw, vh] of SIZES) for (const s of RUN) for (const legs of [1, 2]) {
      const L = levelLayout(vw, vh, s.pathY)
      const maxH = pillCeiling(L, legs)
      const bottom = PILL_TOP + pillH(pillFont(vw, maxH))
      // the thing below it is the leg board on a two-leg round and the name boards otherwise —
      // crossed against BOTH, because on a short frame those two are only ~50px apart
      expect(bottom).toBeLessThan(L.pathPx - L.postH)
      if (legs > 1) expect(bottom).toBeLessThan(L.pathPx - L.postH - L.boardFont * 2.6)
      // and it stays out of the chrome's own corners by being centred, so the only axis that can
      // fail is this one — which is why the height is derived rather than clamped in CSS
      expect(bottom).toBeGreaterThan(PILL_TOP)
    }
  })

  /**
   * ⚠️ BIGGER ON A BIGGER FRAME, AND THE FOUNDER ASKED FOR BIGGER — so pin a floor as well as the
   * clearance above. A ceiling-only check is satisfied by a pill of one pixel, which is how "make it
   * bigger" quietly gets reverted by the next person chasing a collision.
   */
  it('draws the target number at a readable size, and larger where there is room', () => {
    const small = pillFont(640, pillCeiling(levelLayout(640, 320, RUN[0].pathY), 1))
    const large = pillFont(1280, pillCeiling(levelLayout(1280, 720, RUN[0].pathY), 1))
    expect(small).toBeGreaterThanOrEqual(20)
    expect(large).toBeGreaterThan(small)
    expect(large).toBeGreaterThanOrEqual(34)
  })

  it('renders the target pill in a played round, or the number has nowhere to live', () => {
    const play = SRC.match(/const LevelPlay[\s\S]*?\n}\n/)?.[0] ?? ''
    expect(play).toMatch(/<TargetPill/)
  })

  /**
   * ⚠️ THE STEP BOARD HANGS FROM THE CHROME HERE, NOT THE FLOOR, and the arithmetic is the reason
   * rather than taste: the band below this chapter's painted path is 66/148/119px at 640×320 /
   * 1024×620 / 1920×800 against a board 68/152/152px tall, so The Fundraiser's bottom anchor does not
   * fit at three of five sizes — and forcing it would cover the path, which in a rounding chapter IS
   * the number line. Driven through `stepBoardRect`, the same function the board lays itself out with.
   */
  /**
   * ⚠️ `boardsTop` IS PINNED TO A NUMBER MEASURED ON THE SCREEN, because every check that uses it is
   * written in terms of it and therefore MOVES WITH IT — loosening the definition back to the stalk
   * top (the bug) makes `bottom <= boardsTop` easier to satisfy, so the clearance check alone cannot
   * see the regression. Proven by mutation. 102 was read off production at 640×320 with a
   * `getBoundingClientRect` on a name board; the worst site computes 97.
   */
  it('knows where the name boards really start, to the pixel', () => {
    const tops = RUN.map(s => boardsTop(levelLayout(640, 320, s.pathY)))
    expect(Math.min(...tops)).toBeGreaterThan(90)
    expect(Math.max(...tops)).toBeLessThan(112)
    // and it is strictly ABOVE the stalk top, which is what the wrong version returned
    const L = levelLayout(640, 320, RUN[0].pathY)
    expect(boardsTop(L)).toBeLessThan(L.pathPx - L.postH)
  })

  it('keeps the working board clear of the name boards and off the path', () => {
    for (const [vw, vh] of SIZES) for (const s of RUN) for (const cam of [false, true]) {
      const L = levelLayout(vw, vh, s.pathY, cam)
      const R = stepBoardRect(vw, vh, PILL_TOP)
      /**
       * ⚠️ AGAINST `boardsTop`, NOT `pathPx - postH`. The first version of this asserted the latter —
       * the top of the STALK — and the label sits another `boardH` (28px at 640×320) above it, so the
       * board shipped to PRODUCTION drawn across three name boards with this check green. The founder
       * asked for a 640×320 pass on prod and that is what found it. `boardsTop` is now the one
       * definition, used by the scene and by this.
       */
      expect(R.top + R.h, `${vw}x${vh} cam=${cam}: working over the name boards`)
        .toBeLessThanOrEqual(boardsTop(L))
      // …and therefore nowhere near the path itself, which is the thing being read
      expect(R.top + R.h).toBeLessThan(L.pathPx)
      // and inside the frame
      expect(R.left).toBeGreaterThanOrEqual(0)
      expect(R.left + R.w).toBeLessThanOrEqual(vw)
    }
    // ⚠️ AND THE COMPONENT MUST PASS THAT ANCHOR. Driving `stepBoardRect` alone is this repo's own
    // recorded fault — the check keeps its own copy of the rule and stays green while the board hangs
    // somewhere else. Mutation-proven: `anchorTop={undefined}` (The Fundraiser's floor anchor, which
    // does not fit this chapter at three of five sizes) passed every assertion above.
    expect(SRC).toMatch(/<StepBoard[\s\S]{0,160}anchorTop=\{PILL_TOP\}/)
  })

  /**
   * ⚠️ ONE KIT, NOT A COPY. The founder asked for the 12–18 band's boards "totally same", so the
   * components are IMPORTED from the shared module rather than reimplemented — a second copy means the
   * slab fix, the `--font-chalk` fix and the windowing have to be corrected twice or not at all, which
   * is the fault `critters.tsx` and `yard.tsx` were extracted to stop.
   */
  it('teaches on the shared chalkboard rather than a local copy of it', () => {
    expect(SRC).toMatch(/from '\.\/chalkboard'/)
    expect(SRC).toMatch(/<StepBoard\b/)
    // and no reimplementation snuck back in
    expect(SRC).not.toMatch(/function (Chalkboard|GotIt|StepBoard|ThePlan)\b/)
  })

  /**
   * ⚠️ THE PLAN IS REACHABLE, not merely present. `expect(SRC).toMatch(/<ThePlan/)` is satisfied by a
   * render behind `false &&` — mutation-proven, it walked straight through the first version of this.
   * So: both intro doors have to OPEN it, and the phase has to render it unguarded by anything else.
   */
  /**
   * ⚠️ THE PLAN IS ON A CHARACTER BUDGET, AND THE FIRST THING PAST THE EDGE IS THE SKIP BUTTON.
   * The board caps at 92dvh with `overflow: hidden`, so at 640×320 a 422-character draft overflowed by
   * 15px and clipped "I've got it →" clean off — measured live, a dead control, which is the same
   * fault this repo paid for once by capping an intro card onto its own Start button. A scroll is not
   * the fix (it hides the button behind an undiscoverable scrollbar); shorter words are. Nothing can
   * SEE a clip, so the length is what gets pinned. Measured: 299 renders 221px and 362 (The
   * Fundraiser's, which ships clean) renders 243px, against a 294px cap.
   */
  it('keeps THE PLAN inside its own board, skip button and all', () => {
    const total = PLAN_PROBLEM.length + PLAN_POINTS.reduce((s, p) => s + p.length, 0)
    expect(total).toBeLessThanOrEqual(PLAN_BUDGET)
    // three points, because a fourth is what pushes a short frame over on its own
    expect(PLAN_POINTS).toHaveLength(3)
    // and the dead heat is TAUGHT here — it is the one reading a child cannot get from the picture
    expect([PLAN_PROBLEM, ...PLAN_POINTS].join(' ')).toMatch(/exactly on it/i)
  })

  it('opens THE PLAN from the intro before the walkthrough, on both input doors', () => {
    expect(SRC.match(/setPhase\('plan'\)/g) ?? []).toHaveLength(2)
    expect(SRC).toMatch(/\{phase === 'plan' && \(\s*<ThePlan/)
    expect(SRC).toMatch(/onDone=\{\(\) => setPhase\('demo'\)\}/)
  })

  /**
   * ⚠️ THE RE-TEACH GETS NO SKIP. `onSkip` is optional on `LevelExplain`, so the difference is
   * something the two call sites STATE rather than a flag someone has to remember — a child who has
   * just missed three in a row is exactly the one who must not be handed a way past the explanation.
   */
  it('offers the skip on the walkthrough and never on the re-teach', () => {
    expect(SRC).toMatch(/Reteach:\s*\(\{\s*data,\s*onDone\s*\}\)\s*=>\s*<LevelExplain data=\{data\} onDone=\{onDone\}\s*\/>/)
    expect(SRC).toMatch(/onSkip=\{\(\)\s*=>\s*setPhase\('guided'\)\}/)
  })

  it('keeps the distance marker clear of the commit row, by standing ABOVE the path', () => {
    for (const [vw, vh] of SIZES) for (const s of RUN) {
      const L = levelLayout(vw, vh, s.pathY)
      // it grows upward from the path, so its lowest pixel IS the path — the control row starts
      // below that at every size, which is what hanging it below could not achieve on a wide frame.
      expect(L.pathPx).toBeLessThanOrEqual(vh - controlBand(vw, vh))
      // and it must not reach up into the name boards, which are the answer surface
      expect(markerHeight(L.boardFont)).toBeLessThan(L.postH)
    }
  })

  /**
   * ⚠️ AND THE CAMERA PATH IS PINNED TO THE RULE THAT WINS THERE, NOT TO THE ONE ABOVE — stated so
   * the residual is in the gate rather than only in a comment. The drawn path must clear Milo's
   * bubble, and on 6 of these 10 sizes that leaves too little room for the marker AND the controls,
   * so the marker still crowds the button on the camera path. Asserting the bubble rule is what
   * stops somebody "fixing" that by pulling the path up through the question region.
   */
  it('keeps the DRAWN path below the bubble even where that crowds the controls', () => {
    for (const [vw, vh] of SIZES) for (const s of RUN) {
      const a = levelLayout(vw, vh, s.pathY, true)
      expect(a.pathPx).toBeGreaterThanOrEqual(a.bubbleBottom)
    }
  })

  /** ⚠️ Founder's catch on the rail version: the parked engine covered the halfway mark, which is
   *  the ONLY help a wrong answer gives. Boards and the hint both have to out-reach Astro's head,
   *  and that is still true of a person standing among the posts. */
  it('never lets the runner hide a name board or the halfway mark', () => {
    for (const [vw, vh] of SIZES) for (const s of RUN) {
      const L = levelLayout(vw, vh, s.pathY)
      const runnerTop = L.pathPx - L.runnerH
      expect(L.pathPx - L.halfStalkH).toBeLessThanOrEqual(runnerTop)      // hint above the roof
      expect(L.pathPx - L.postH).toBeLessThan(L.pathPx - L.halfStalkH)  // boards above the hint
    }
  })

  /**
   * ⚠️ THIS REPLACED A `runner > Milo` ASSERTION, AND THE SWAP IS DELIBERATE RATHER THAN A WEAKENING.
   * That check existed because the traveller was a LOCOMOTIVE, which really is taller than a pony,
   * and the chapter had shipped it the other way round. Astro is a person, so there is no physical
   * rank to enforce against a pony and keeping the comparison would assert something untrue of the
   * objects. What was actually load-bearing — that she never hides the boards or the halfway mark —
   * is the test directly above, which is unchanged. This one keeps her readable.
   */
  it('draws Astro big enough to read at every size', () => {
    for (const [vw, vh] of SIZES) for (const s of RUN) {
      const L = levelLayout(vw, vh, s.pathY)
      expect(L.runnerH).toBeGreaterThanOrEqual(44)
      expect(L.runnerH).toBeLessThan(vh * 0.4)     // and never so big she owns the level
    }
  })

  it('keeps the waiting runner fully on screen at every size and scene', () => {
    for (const [vw, vh] of SIZES) for (const s of RUN) {
      const L = levelLayout(vw, vh, s.pathY)
      const halfW = L.runnerH * RUNNER_ASPECT / 2
      expect(L.homeX - halfW).toBeGreaterThanOrEqual(-1)
    }
  })

  it('never lets a checkpoint post reach up into the chrome', () => {
    for (const [vw, vh] of SIZES) for (const s of RUN) {
      const L = levelLayout(vw, vh, s.pathY)
      // the post assembly hangs from the track upward: board + post
      expect(L.pathPx - L.postH - L.boardH).toBeGreaterThan(CHROME_PX)
    }
  })

  it('keeps six boards from touching each other', () => {
    for (const [vw, vh] of SIZES) for (const s of RUN) {
      const L = levelLayout(vw, vh, s.pathY)
      // the widest label the chapter can draw is five characters — a round100 line reaches "1,400"
      const boardW = L.boardFont * (5 * 0.62 + 1.1)
      expect(L.postGap).toBeGreaterThan(boardW)
    }
  })

  /**
   * ⚠️ THE ONE THE SCREEN CAUGHT. At 640×320 Milo's bubble ran straight across two of the six name
   * boards — measured, bubble 355–624 over boards at 463–510 — so two answer targets were covered.
   */
  it('lifts the name boards clear of the band Milo\'s bubble can occupy', () => {
    for (const [vw, vh] of SIZES) for (const s of RUN) {
      const L = levelLayout(vw, vh, s.pathY)
      const boardBottom = L.pathPx - L.postH
      expect(boardBottom).toBeLessThanOrEqual(L.bubbleTop)
    }
  })

  it('keeps every board inside the frame, not flush against either edge', () => {
    for (const [vw, vh] of SIZES) for (const s of RUN) {
      const L = levelLayout(vw, vh, s.pathY)
      const half = L.boardFont * (5 * 0.62 + 1.1) / 2
      expect(L.checkX(0) - half).toBeGreaterThan(0)
      expect(L.checkX(CHECKPOINTS - 1) + half).toBeLessThan(vw)
    }
  })

  it('leaves every checkpoint a finger-sized tap target', () => {
    for (const [vw, vh] of SIZES) for (const s of RUN) {
      const L = levelLayout(vw, vh, s.pathY)
      expect(Math.min(L.postGap, 44)).toBeGreaterThanOrEqual(44 - 1e-9)
    }
  })

  it('keeps the checks clear of Milo and his bubble on the right', () => {
    for (const [vw, vh] of SIZES) for (const s of RUN) {
      const L = levelLayout(vw, vh, s.pathY)
      expect(L.checkX(CHECKPOINTS - 1)).toBeLessThan(vw * 0.80)
    }
  })

  it('places a value on the line consistently with the post drawn for it', () => {
    const L = levelLayout(1280, 720, 0.785)
    const s = checksFor(47, 10)
    for (let i = 0; i < CHECKPOINTS; i++) expect(L.xOf(s[i], s[0], 10)).toBeCloseTo(L.checkX(i), 6)
  })
})

describe('the run', () => {
  it('changes scene between consecutive rounds, so the place moves as well as the numbers', () => {
    for (let i = 1; i < RUN.length; i++) expect(levelAt(i).scene).not.toBe(levelAt(i - 1).scene)
  })

  it('reads its slots straight and never wraps back onto the scene it opened with', () => {
    expect(levelAt(9)).toBe(RUN[9])
    expect(levelAt(20)).toBe(RUN[RUN.length - 1])
  })

  /**
   * ⚠️ A MISSING BACKDROP FALLS BACK TO NOTHING, WHICH IS WHY THIS EXISTS. A missing SPRITE degrades
   * to a visible gap you would notice; a scene whose path is typo'd renders as an empty coloured
   * void with the posts floating in it, and nothing errors. FitOut shipped exactly that hole and
   * closed it the same way. Every asset this chapter names is checked to be on disk.
   */
  it('has every scene and Astro actually on disk', () => {
    for (const src of [...new Set(RUN.map(s => s.scene)), ASTRO]) {
      expect(existsSync(join(process.cwd(), 'public', src))).toBe(true)
    }
  })

  it('gives every scene its own measured track line rather than a shared constant', () => {
    const byScene = new Map(RUN.map(s => [s.scene, s.pathY]))
    expect(byScene.size).toBe(3)
    for (const s of RUN) expect(byScene.get(s.scene)).toBe(s.pathY)
  })
})

// ─── The camera path ──────────────────────────────────────────────────────────────────────
describe('answering by hand', () => {
  const SIZES: Array<[number, number]> = [
    [1280, 720], [1440, 900], [1024, 620], [1600, 950], [820, 420], [740, 360], [640, 320],
    [2000, 970], [2560, 1080], [1920, 800],
  ]
  const mid = (x: number) => ({ x, y: 0.5 })

  /**
   * ⚠️⚠️ THE CHECK THE WHOLE CHAPTER RESTS ON: A RELEASE BETWEEN TWO CHECKPOINTS LANDS ON NOTHING.
   *
   * The Fundraiser's drop partitions at the halfway line so there is nowhere to miss, and copying
   * that here would be catastrophic rather than convenient — the child would carry Astro to where 47
   * really falls, let go, and the APP would snap her to 50. That is the rounding performed by the
   * machine, i.e. the answer handed over, which is the exact defect this chapter was rebuilt to
   * remove. Widen `CATCH_SHARE` to 0.5 and this fails.
   */
  it('refuses a release that is not ON a checkpoint, so the app never rounds for the child', () => {
    const L = levelLayout(1280, 720, RUN[0].pathY)
    const gap = L.postGap
    for (let i = 0; i < CHECKPOINTS - 1; i++) {
      const a = L.checkX(i), b = L.checkX(i + 1)
      expect(dropIndex((a + b) / 2, L.checkX, gap)).toBeNull()          // dead centre: nothing
      expect(dropIndex(a + gap * 0.45, L.checkX, gap)).toBeNull()       // and either side of it
      expect(dropIndex(b - gap * 0.45, L.checkX, gap)).toBeNull()
    }
  })

  /**
   * ⚠️ DRIVEN LIVE AND IT SCORED AN ANSWER NOBODY CHOSE. Astro waited at x 54 with the first
   * checkpoint at 77 and a 64px catch, so a grab-and-instant-release placed her on the 20 board and
   * graded it — a wrong answer the chapter caused, off a gesture the child never completed. Her
   * waiting place has to sit OUTSIDE every catch zone, which is the property rather than the fix.
   */
  it('never lets Astro wait inside a checkpoint catch zone', () => {
    for (const [vw, vh] of SIZES) for (const site of RUN) {
      const L = levelLayout(vw, vh, site.pathY)
      expect(dropIndex(L.homeX, L.checkX, L.postGap)).toBeNull()
    }
  })

  it('catches a release aimed at a checkpoint, generously enough for a wobbling hand', () => {
    const L = levelLayout(1280, 720, RUN[0].pathY)
    for (let i = 0; i < CHECKPOINTS; i++) {
      expect(dropIndex(L.checkX(i), L.checkX, L.postGap)).toBe(i)
      expect(dropIndex(L.checkX(i) + L.postGap * 0.3, L.checkX, L.postGap)).toBe(i)
      expect(dropIndex(L.checkX(i) - L.postGap * 0.3, L.checkX, L.postGap)).toBe(i)
    }
    // and the catch is wide enough to be hittable at all: at least 44px either side on a small frame
    const S = levelLayout(640, 320, RUN[0].pathY)
    expect(S.postGap * CATCH_SHARE).toBeGreaterThanOrEqual(22)
  })

  it('reaches every checkpoint, none unreachable', () => {
    const L = levelLayout(1280, 720, RUN[0].pathY)
    const hit = new Set<number>()
    for (let x = 0; x <= 1280; x += 2) {
      const i = dropIndex(x, L.checkX, L.postGap)
      if (i !== null) hit.add(i)
    }
    expect([...hit].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5])
  })

  /** A hand resting on the desk is not a grab. `slide.ts` names this reuse of the sweep's gate. */
  it('will not let a hand low in the frame pick her up', () => {
    const L = levelLayout(1280, 720, RUN[0].pathY)
    expect(onAstro({ x: 0.5, y: 0.95 }, levelPoint({ x: 0.5, y: 0.4 }, 1280, 720).x, L.runnerH, 1280, 720)).toBe(false)
    expect(onAstro(null, 100, L.runnerH, 1280, 720)).toBe(false)
  })

  it('only picks her up when the fist closes ON her', () => {
    const L = levelLayout(1280, 720, RUN[0].pathY)
    const her = 400
    // ⚠️ SOLVED THROUGH `levelPoint` RATHER THAN BY INVERTING `reachSpan` BY HAND — a test that
    // re-implements the mapping agrees with its own copy of it, and my hand-written inverse was
    // simply wrong. Search for the palm x the chapter itself maps to a given screen x.
    const palmFor = (px: number) => {
      let best = 0.5, bestD = Infinity
      for (let x = 0; x <= 1; x += 0.001) {
        const d = Math.abs(levelPoint({ x, y: 0.4 }, 1280, 720).x - px)
        if (d < bestD) { bestD = d; best = x }
      }
      return { x: best, y: 0.4 }
    }
    expect(onAstro(palmFor(her), her, L.runnerH, 1280, 720)).toBe(true)
    expect(onAstro(palmFor(her + 600), her, L.runnerH, 1280, 720)).toBe(false)
  })

  /**
   * ⚠️ THE COVER-FIT IS MEANINGLESS WITHOUT THE PAINTING. On the camera path the backdrop is the
   * child's own room, so mapping through a transform for an image that is not drawn puts the path
   * wherever that arithmetic lands. Keep `pathY` in the camera branch and this fails.
   */
  it('places the drawn path without the backdrop transform', () => {
    for (const [vw, vh] of SIZES) {
      const a = levelLayout(vw, vh, RUN[0].pathY, true)
      const b = levelLayout(vw, vh, RUN[1].pathY, true)
      // the whole claim: two scenes whose painted path differ land on the SAME drawn path
      expect(a.pathPx).toBe(b.pathPx)
      expect(a.pathPx).not.toBe(levelLayout(vw, vh, RUN[0].pathY, false).pathPx)
      /**
       * ⚠️ THE PROPERTY, NOT THE FORMULA. This assertion first re-implemented `Math.min(vh * CAM_PATH_Y,
       * …)` and went red the moment a real rule was added to the source — a check written in terms of
       * the arithmetic it guards has to be edited every time that arithmetic is right, which trains
       * you to edit it when it is wrong. What the layout owes is that the m marker, which hangs
       * BELOW the path, starts below Milo's bubble: measured at 640×320 the two crossed by 8px.
       */
      expect(a.pathPx).toBeGreaterThanOrEqual(a.bubbleBottom)
      expect(a.pathPx).toBeGreaterThanOrEqual(Math.round(vh * CAM_PATH_Y))
    }
  })

  /** Every layer the painted path already guards has to hold on the drawn one too. */
  it('keeps the marker on screen and the boards clear of the chrome on the camera path', () => {
    for (const [vw, vh] of SIZES) {
      const L = levelLayout(vw, vh, RUN[0].pathY, true)
      expect(L.pathPx + L.boardFont * 2.65).toBeLessThanOrEqual(vh)
      expect(L.pathPx - L.postH - L.boardH).toBeGreaterThanOrEqual(CHROME_PX - 1)
      expect(L.checkX(0)).toBeGreaterThan(0)
      expect(L.checkX(CHECKPOINTS - 1)).toBeLessThan(vw)
    }
  })

  /** The cursor is the reading stretched through the reach — NOT where the camera sees the hand. */
  it('maps the cursor through the same reach the checkpoints are mapped through', () => {
    const p = levelPoint({ x: 0.20, y: 0.5 }, 1000, 600)
    expect(p.x).toBeLessThan(1000 * 0.20)
    expect(levelPoint({ x: 0.02, y: 0.5 }, 1000, 600).x).toBe(0)
    expect(levelPoint({ x: 0.98, y: 0.5 }, 1000, 600).x).toBe(1000)
  })

  /**
   * ⚠️ THE INSTRUCTION MAY NOT GO INPUT-BLIND OR STATE-BLIND. A line that names a gesture the child
   * does not have is the 12–14 band's headline defect arriving through a new door, and a state with
   * no words is a child doing something reasonable and seeing nothing happen.
   */
  it('speaks only for the states where nothing can happen, and never on the tap path', () => {
    const st = { hands: 1, low: false, legsLeft: 1, ofLegs: 1, carrying: false, missed: false }
    /**
     * The tap surface explains itself, and shipped without a word of this — in EVERY state, which is
     * the assertion rather than a detail. Checked only with a hand present, this passed with the tap
     * branch deleted (mutation M6): a child who has chosen taps and happens to have no hand in frame
     * would be told to hold one up. That is the input-blind fault the check exists for.
     */
    for (const hands of [0, 1]) for (const low of [false, true]) for (const ofLegs of [1, 2]) {
      for (const carrying of [false, true]) for (const missed of [false, true]) {
        expect(levelAsk('tap', { hands, low, legsLeft: 1, ofLegs, carrying, missed })).toBeNull()
      }
    }
    /**
     * ⚠️ EVERY STATE THE GRAB CAN BE IN IS SPOKEN FOR, which is the rule The Supply Run paid for: a
     * gesture path shows nothing at all unless the words carry it. The states are: no hand · hand too
     * low · holding nothing yet · carrying her · a release that landed on nothing · one leg still to
     * go. The last two are the ones a slide never had.
     */
    const blocking = [
      levelAsk('hand', { ...st, hands: 0 }),
      levelAsk('hand', { ...st, low: true }),
      levelAsk('hand', st),                                   // idle: tells them how to pick her up
      levelAsk('hand', { ...st, carrying: true }),            // carrying: tells them how to put her down
      levelAsk('hand', { ...st, missed: true }),              // refused: names the RULE, not the answer
      levelAsk('hand', { ...st, ofLegs: 2, legsLeft: 1 }),
    ]
    for (const b of blocking) expect(typeof b).toBe('string')
    expect(new Set(blocking).size).toBe(blocking.length)
    for (const b of blocking) expect(b!.length).toBeGreaterThan(12)
    // it names the gesture the child actually has — never a tap
    for (const b of blocking) expect(b!).not.toMatch(/tap/i)
  })

  /** It never repeats the checkpoint under the hand — the post already lights up, and a second copy of
   *  that cue reads as the app agreeing with the child. */
  it('never names a number', () => {
    for (const input of ['hand', 'tap'] as const) {
      for (const hands of [0, 1]) for (const low of [false, true]) {
        for (const ofLegs of [1, 2]) {
          for (const carrying of [false, true]) for (const missed of [false, true]) {
            expect(levelAsk(input, { hands, low, legsLeft: 1, ofLegs, carrying, missed }) ?? '').not.toMatch(/\d/)
          }
        }
      }
    }
  })
})

// ─── The walkthrough's way out ────────────────────────────────────────────────────────────
describe('the skip', () => {
  /**
   * ⚠️ ONE COMPONENT IS BOTH THE DEMO AND THE 3-WRONG RE-TEACH, AND ONLY ONE OF THEM MAY BE SKIPPED.
   * A child who has just missed three in a row is exactly the one who must not be handed a way past
   * the explanation. `onSkip` is therefore OPTIONAL on `LevelExplain`, so the difference is something
   * the two call sites STATE rather than a flag somebody has to remember — and this pins it, because
   * adding `onSkip` to the `Reteach` line is a one-word regression that nothing else can see.
   */
  it('offers the walkthrough skip in the demo and NEVER in the re-teach', () => {
    const reteach = SRC.match(/Reteach:[\s\S]{0,200}?\/>/)?.[0] ?? ''
    expect(reteach).toContain('LevelExplain')
    expect(reteach).not.toContain('onSkip')

    const demo = SRC.match(/phase === 'demo'[\s\S]{0,400}?\/>/)?.[0] ?? ''
    expect(demo).toContain('LevelExplain')
    expect(demo).toContain('onSkip')

    // optional at the definition — that is what makes the two call sites a stated difference
    expect(SRC).toMatch(/onSkip\?:/)
  })

  /**
   * ⚠️ THE TEACHING STILL AUTO-ROLLS. The skip is the smallest thing on the screen and never the
   * forward path — a "next" on every beat is a skip button wearing a different label, and a
   * nine-year-old presses whatever big control is offered and then meets a test nothing prepared them
   * for. So the walkthrough must still drive itself off its own timer.
   */
  it('does not make the skip the way forward', () => {
    // the beat timer that advances the walkthrough is still there and still calls onDone
    expect(SRC).toMatch(/dwellFor\(lines\[i\]\)/)
    expect(SRC).toMatch(/doneRef\.current\(\)/)
    // and it skips the WHOLE walkthrough rather than one beat
    expect(SRC).toMatch(/onSkip=\{\(\) => setPhase\('guided'\)\}/)
  })
})
