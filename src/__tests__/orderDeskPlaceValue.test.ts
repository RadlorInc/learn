/**
 * THE FUNDRAISER (9–11 · `bigNumbers`) — the read-it-and-write-it chapter's gate.
 *
 * ⚠️ REWRITTEN WITH THE CHAPTER'S VERB. The previous cut loaded base-ten bundles into bays and this
 * file drove that: `MAX_DIGIT`, `columnAt`, the bay row's geometry. None of it exists now — the
 * child reads a digit out of a printed number and writes a spoken one onto a board — so a gate kept
 * limping along on the old exports would have been checking a screen nobody sees.
 *
 * It drives the SAME functions the commit button calls; a check that re-implemented the rule would
 * agree with its own copy while the screen it protects rotted.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  makeRound, grade, missFor, writeAsk, boardLayout, bubbleLeft, slotsFor, placesFor,
  stepBoardRect, trayLayout, tileHit, boxHit, handPoint, PLACES, Q_ALL, RUN, yardAt, numWords, saidAmount, type OdRound,
} from '@/features/chapters/story/OrderDesk'

/** the chapter's own source, comments stripped — comments are prose, not code */
const SRC = readFileSync(join(process.cwd(), 'src/features/chapters/story/OrderDesk.tsx'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

const TIERS = [1, 2, 3] as const
const draw = (n: number, fn: (q: OdRound, d: 1 | 2 | 3, slot: number) => void) => {
  for (let k = 0; k < n; k++) {
    const d = TIERS[k % 3]
    fn(makeRound(d, k % 13, []), d, k % 13)
  }
}
const digits = (n: number) => String(n).split('').map(Number)
/** the digits the board is made of, most significant first — the tray is these, scrambled */
const digitsOf = (n: number) => digits(n)

describe('the generator', () => {
  it('never asks about a place the number does not show', () => {
    draw(600, q => {
      if (q.focus < 0) return
      const place = PLACES[q.focus]
      expect(place, `focus ${q.focus} is outside ${q.n}`).toBeLessThanOrEqual(q.n >= 1000 ? 1000 : 100)
    })
  })

  /**
   * ⚠️ A `value` ROUND MAY NEVER LAND ON THE ONES — found by playing the previous cut, which asked
   * "the tin holds two dollars, how many dollar coins is that?" and printed the answer in the
   * question. Converting a value into a count of a bigger unit is the whole point, and a place worth
   * 1 has nothing to convert.
   */
  it('never asks how many ones are in a number of dollars', () => {
    draw(900, q => { if (q.qType === 'value') expect(PLACES[q.focus]).toBeGreaterThan(1) })
  })

  /** ⚠️ The asked-for digit is never 0 on a one-digit round: a child cannot tell "the answer is 0"
   *  from "I forgot to write in that box", so a zero answer grades their attention, not their maths. */
  it('never asks a one-digit question whose answer is zero', () => {
    draw(900, q => { if (q.focus >= 0) expect(q.answer[0]).toBeGreaterThan(0) })
  })

  it('never puts a leading zero in a number the child has to write', () => {
    draw(600, q => expect(digits(q.n)[0]).toBeGreaterThan(0))
  })

  /**
   * ⚠️ THE PLACEHOLDER IS THE L3 CASE AND IT IS FORCED, NOT HOPED FOR. A child who has only met full
   * numbers writes 3,42 for three thousand and forty-two — the words never mention the hundreds, so
   * the silence is exactly where the mistake comes from. Left to chance it would appear in well
   * under half of L3 rounds and a strong child (who gets ~2 of them) would usually never meet it.
   */
  it('always leaves an inner column empty at the top tier', () => {
    for (let k = 0; k < 200; k++) {
      const q = makeRound(3, k % 13, [])
      const d = digits(q.n)
      expect(d.slice(1).includes(0), `${q.n} has no placeholder`).toBe(true)
    }
  })

  it('grows from three digits to four with the tier', () => {
    for (let k = 0; k < 120; k++) {
      expect(makeRound(1, k % 13, []).n).toBeLessThan(1000)
      expect(makeRound(2, k % 13, []).n).toBeGreaterThanOrEqual(1000)
    }
  })

  /** ⚠️ The whole answer space must be reachable, or a digit the child can write is never asked for. */
  it('asks about every place and every question type', () => {
    const kinds = new Set<string>(), places = new Set<number>()
    draw(1200, q => { kinds.add(q.qType); if (q.focus >= 0) places.add(PLACES[q.focus]) })
    expect([...kinds].sort()).toEqual(['read', 'value', 'write'])
    expect([...places].sort((a, b) => a - b)).toEqual([1, 10, 100, 1000])
  })

  it('the boxes match the number: three digits get three, four get four', () => {
    draw(400, q => {
      if (q.focus >= 0) { expect(q.answer.length).toBe(1); return }
      expect(q.answer.length).toBe(slotsFor(q.n))
      expect(q.answer).toEqual(digits(q.n))
      expect(placesFor(q.n).length).toBe(slotsFor(q.n))
    })
  })

  /**
   * ⚠️ THE BOARD IS BLANK ON A `write` ROUND AND THAT *IS* THE QUESTION. Printing the total anywhere
   * — the docket, the ask, a label — deletes the round: the child copies it. The ask may name the
   * number in WORDS, because turning words into figures is the work.
   *
   * ⚠️ AND NO ASK OF ANY TYPE CARRIES FIGURES (founder's call). On a `read` round the numeral is
   * already on the board, so repeating it is noise; on a `value` round the tin is named in words.
   */
  /**
   * ⚠️ **THE LOOSE DIGITS ARE SCRAMBLED, AND THAT IS THE OTHER HALF OF KEEPING A `write` ROUND
   * HONEST.** Laid out in board order beside columns in board order, the child drags the first tile
   * to the first column and the whole round is sorting, not place value — the printed-total half of
   * this is asserted above, and a tray in order defeats it even with the board blank.
   */
  it('scrambles the loose digits rather than laying them out in board order', () => {
    let inOrder = 0, multi = 0
    draw(600, q => {
      // the tray is always the same multiset as the board — no digit invented, none missing
      expect([...q.tray].sort(), `tray is not ${q.n}'s digits`)
        .toEqual([...digitsOf(q.n)].sort())
      if (q.tray.length > 1) {
        multi++
        if (q.tray.every((d, i) => d === digitsOf(q.n)[i])) inOrder++
      }
    })
    expect(multi).toBeGreaterThan(100)
    // a fair shuffle of 3–4 digits lands in order about 1 draw in 6 at worst; 60% is a shuffle that
    // is not shuffling, and 0% would be a "shuffle" that merely reverses
    expect(inOrder / multi, 'the tray is laid out in board order').toBeLessThan(0.45)
    expect(inOrder, 'the tray can never come out in board order').toBeGreaterThan(0)
  })

  /**
   * ⚠️ **NO ROUND PRINTS A FIGURE ANYWHERE, AT ANY TIER — founder's call, and it retired the L1
   * scaffold that used to show the total over the columns.** With the amount now SAID in words on
   * every type, a printed total is the one thing on screen a child can copy left-to-right without
   * knowing what a thousand is — the transcription fault the `placeValue` rebuild was stopped for,
   * at the easiest tier. So the round carries no printing surface at all: `board` is deleted rather
   * than set to null, which is why this drives the SOURCE. A field that is always null is a surface
   * waiting to be used again, and a data check could not see it come back.
   *
   * ⚠️ AND THE OTHER HALF: the ask must CARRY the word form, or nothing on screen states the number
   * and the round is unanswerable. Asserted both ways round.
   */
  it('never prints the figures of a number, and always says them in words', () => {
    // ⚠️ and no docket may print a FIGURE. The one that survives shows `numWords` on a silent
    // device, which is the round's words rather than its numeral.
    expect(SRC, 'a docket prints a figure').not.toMatch(/<Docket[^>]*money\(/)
    draw(600, q => {
      expect(Object.keys(q), 'the round carries a printing surface again').not.toContain('board')
      expect(q.ask, `"${q.ask}" shows figures`).not.toMatch(/\d/)
      expect(q.ask, `"${q.ask}" never says the amount`).toContain(numWords(saidAmount(q)))
    })
  })

  /** ⚠️ And a `read` round must NOT label its box, or the child reads the caption instead of counting
   *  places — which is the whole skill. A `write` round labels them, and gives nothing away doing it. */
  it('labels the boxes only where the labels are not the answer', () => {
    draw(600, q => expect(q.labelled).toBe(q.qType === 'write'))
  })
})

describe('the grader', () => {
  const q = makeRound(2, 0, [], 'write')

  it('accepts exactly the digits that were asked for', () => {
    expect(grade(q, q.answer.slice())).toBe(true)
  })

  it('refuses a right digit in the wrong column', () => {
    if (q.answer.length < 2) return
    const swapped = q.answer.slice()
    ;[swapped[0], swapped[1]] = [swapped[1], swapped[0]]
    if (swapped.join() === q.answer.join()) return          // the two happened to be equal
    expect(grade(q, swapped)).toBe(false)
  })

  it('refuses an unwritten box', () => {
    const partial = q.answer.slice(); partial[partial.length - 1] = -1
    expect(grade(q, partial)).toBe(false)
  })

  /**
   * ⚠️ THE MISS LINE NEVER STATES THE ANSWER. The previous cut's read "that is 0, and I asked for 5"
   * — where 5 IS the answer — on the round types whose whole task is extracting that digit. Caught
   * by this chapter's first gate, which was also the first thing ever to drive `missFor`.
   */
  it('never names the digit on a one-digit round', () => {
    for (let k = 0; k < 300; k++) {
      const r = makeRound(TIERS[k % 3], k % 13, [], k % 2 ? 'read' : 'value')
      for (const wrong of [0, 1, 9]) {
        if (wrong === r.answer[0]) continue
        const line = missFor(r, [wrong])
        expect(line, `"${line}" leaks ${r.answer[0]}`).not.toMatch(new RegExp(`\\b${r.answer[0]}\\b`))
      }
    }
  })

  it('names the empty box rather than saying only "no"', () => {
    const w = makeRound(2, 0, [], 'write')
    const partial = w.answer.slice(); partial[1] = -1
    expect(missFor(w, partial)).toMatch(/still empty/)
  })
})

describe('the instruction chip', () => {
  const rd = makeRound(2, 0, [], 'read')
  const wr = makeRound(2, 1, [], 'write')
  const st = (
    q: ReturnType<typeof makeRound>, input: 'hand' | 'tap',
    o: Partial<{ full: boolean; carrying: number | null; over: number }> = {},
  ) => writeAsk(q, input, { full: false, carrying: null, over: -1, ...o })

  /**
   * ⚠️ IT CANNOT GO INPUT-BLIND. A chip that says "tap the digit" to a child whose chosen surface is
   * the camera is the 12–14 audit's headline defect ("crank the gear" with no crank on screen)
   * arriving through a new door: the wording is not wrong, it addresses the wrong child. Assert in
   * BOTH directions or a renderer that ignores its input passes every other check.
   */
  it('names the gesture the child actually has', () => {
    expect(st(rd, 'hand')).toMatch(/close your hand/i)
    expect(st(rd, 'hand')).not.toMatch(/\btap the digit\b/i)
    expect(st(rd, 'tap')).toMatch(/tap/i)
    expect(st(rd, 'tap')).not.toMatch(/close your hand|carry/i)
  })

  /**
   * ⚠️ AND THE COMMIT IS PART OF "THE GESTURE THE CHILD HAS" — this is the state where getting it
   * wrong is most expensive, because a child who has built the whole board and is pointed at a
   * control they were never using has finished the work and cannot hand it in. Both directions, or a
   * renderer that ignores its input passes.
   */
  it('names the right way to put the board up, per input', () => {
    expect(st(rd, 'hand', { full: true })).toMatch(/thumb/i)
    expect(st(rd, 'hand', { full: true })).not.toMatch(/\btap\b/i)
    expect(st(rd, 'tap', { full: true })).toMatch(/tap/i)
    expect(st(rd, 'tap', { full: true })).not.toMatch(/thumb/i)
  })

  /**
   * ⚠️ EVERY STATE A GESTURE CAN BE IN NEEDS WORDS, not just "ready" — a child holding a digit over
   * empty floor with nothing telling them where it has to go gets silence, and that is exactly the
   * state they get stuck in: the hand is doing the right thing and the screen has no reason to react.
   */
  it('says something different in every state the hand can be in', () => {
    const seen = [
      st(wr, 'hand'),
      st(wr, 'hand', { carrying: 4 }),
      st(wr, 'hand', { carrying: 4, over: 2 }),
      st(wr, 'hand', { full: true }),
    ]
    expect(new Set(seen).size).toBe(4)
    // carrying over a column says WHICH digit is in the hand, so a mis-grab is visible before the drop
    expect(st(wr, 'hand', { carrying: 4, over: 2 })).toMatch(/4/)
    expect(st(wr, 'hand', { full: true })).toMatch(/👍/)
  })

  /**
   * ⚠️ CARRYING OVER NOTHING MUST NOT READ AS "DROP IT". That is the only state in which opening
   * your fingers loses the digit, so it is the one the words have to redirect rather than confirm.
   */
  it('tells a carrying hand to get over a column first', () => {
    const nowhere = st(wr, 'hand', { carrying: 4 })
    expect(nowhere).toMatch(/carry/i)
    expect(nowhere).not.toMatch(/open your hand to drop/i)
    expect(st(wr, 'hand', { carrying: 4, over: 0 })).toMatch(/open your hand/i)
  })

  /**
   * ⚠️ IT HAS TO FINISH ITS SENTENCE ON A ONE-BOX ROUND TOO. Driving a previous cut, the chip read
   * "Tap the digit that goes" — a phrase built by appending "in the lit box" only when there was
   * more than one box, so the single-box case (the first one a child meets) trailed off mid-sentence.
   * The assertions above check which WORDS it uses and could never see that it stopped.
   */
  it('names where the digit goes, whether there is one box or four', () => {
    for (const q of [rd, wr]) {
      for (const input of ['hand', 'tap'] as const) {
        for (const o of [{}, { carrying: 4 }, { carrying: 4, over: 0 }]) {
          const line = st(q, input, o)
          // ⚠️ the words that can only be MID-phrase. A bare "in" is not one of them — "carry it to
          // the column it belongs in" is a finished sentence, and a regex that forbids it is
          // checking English rather than the fault (a clause appended only in the multi-box case).
          expect(line.trim(), `"${line}" trails off`).not.toMatch(/\b(goes|put it|into|to|the)$/)
        }
      }
      // the two lines that actually place a digit say WHERE it lands
      expect(st(q, 'tap')).toMatch(/\bbox\b/)
      expect(st(q, 'hand')).toMatch(/\b(box|column)\b/)
    }
  })

  /** ⚠️ The chip must never say which digit is RIGHT — only which one is in the child's hand.
   *  Naming the carried digit is honest; saying "4 is right" is the answer, before the commit. */
  it('never tells the child whether the digit is correct', () => {
    for (const input of ['hand', 'tap'] as const) {
      for (const c of [null, 0, 7]) {
        for (const over of [-1, 0]) {
          expect(st(rd, input, { carrying: c, over })).not.toMatch(/right|correct|well done|yes/i)
        }
      }
    }
  })
})

describe('the board fits every screen', () => {
  const SIZES: [number, number][] = [
    [1280, 720], [1440, 900], [1800, 870], [2000, 970], [2560, 1080], [1920, 800],
    [1024, 620], [900, 500], [740, 360], [667, 375], [640, 320], [667, 290], [568, 320],
  ]

  it('keeps every box a real tap target, on both box counts', () => {
    for (const [vw, vh] of SIZES) {
      for (const slots of [1, 4]) {
        const L = boardLayout(vw, vh, 0.87, slots)
        expect(L.boxW, `${vw}x${vh} slots=${slots}`).toBeGreaterThanOrEqual(44)
        expect(L.boxH).toBeGreaterThanOrEqual(44)
      }
    }
  })

  it('never runs the boxes off either edge', () => {
    for (const [vw, vh] of SIZES) {
      for (const slots of [1, 3, 4]) {
        const L = boardLayout(vw, vh, 0.87, slots)
        expect(L.boardLeft, `${vw}x${vh}`).toBeGreaterThanOrEqual(0)
        expect(L.boardLeft + L.rowW, `${vw}x${vh}`).toBeLessThanOrEqual(vw)
        /**
         * ⚠️ THE SIDE RESERVE IS WHERE THE CAST STANDS, so "inside the screen" is the wrong
         * bound — a board that merely fits the viewport can still be drawn straight through Milo
         * and the customer. The reserve is derived from the sprites' own width for exactly this.
         */
        expect(L.boardLeft, `${vw}x${vh}: board over the cast`).toBeGreaterThanOrEqual(L.side)
      }
    }
  })

  /**
   * ⚠️ **THE TRAY IS THE ANSWER SURFACE FOR BOTH INPUTS, SO ITS TILES ARE TAP TARGETS AND DROP
   * TARGETS AT ONCE.** A tile under the floor is a digit a finger cannot hit and a pinched hand
   * cannot aim at — the dead-surface fault on the only door a camera child has.
   */
  it('keeps every loose digit a real tap target, at every tray size', () => {
    for (const [vw, vh] of SIZES) {
      for (const count of [1, 3, 4]) {
        const L = boardLayout(vw, vh, 0.87, Math.min(count, 4))
        const T = trayLayout(L, vw, vh, count)
        expect(T.tile, `${vw}x${vh} count=${count}`).toBeGreaterThanOrEqual(40)
        expect(T.left, `${vw}x${vh}: tray off the left`).toBeGreaterThanOrEqual(0)
        expect(T.left + T.w, `${vw}x${vh}: tray off the right`).toBeLessThanOrEqual(vw)
        expect(T.top + T.tile, `${vw}x${vh}: tray off the bottom`).toBeLessThanOrEqual(vh)
      }
    }
  })

  /**
   * ⚠️ **AND THE TRAY MUST NEVER BE DRAWN ON THE BOXES.** They are the two halves of one gesture —
   * pick up down there, drop up here — so an overlap does not merely look wrong, it makes the drop
   * target and the source the same pixels and the hit-tests disagree about what is under the hand.
   */
  it('never lets the tray reach the boxes', () => {
    for (const [vw, vh] of SIZES) {
      for (const slots of [1, 4]) {
        const L = boardLayout(vw, vh, 0.87, slots)
        const T = trayLayout(L, vw, vh, 4)
        expect(T.top, `${vw}x${vh} slots=${slots}: tray on the boxes`)
          .toBeGreaterThan(L.boardTop + L.boxH + L.labelH)
      }
    }
  })

  /**
   * ⚠️ **EVERY BOX AND EVERY TILE HAS TO BE REACHABLE BY A HAND, AND THAT IS `REACH`'S WHOLE JOB.**
   * `SWEEP_ARM`'s failure mode is silence: a column mapped to a part of the camera frame a seated
   * child cannot get their hand into is a column they can never post a digit in — and the outer
   * columns are where the thousands live. `handPoint` stretches the middle band over the whole
   * board, so this drives that same mapping and asserts every target is hit by SOME frame position.
   */
  it('maps every box and every tile inside the band a seated child can reach', () => {
    /**
     * ⚠️ **THE SWEEP STOPS SHORT OF THE FRAME'S EDGES ON PURPOSE, AND THAT IS THE WHOLE TEST.**
     * Sweeping the full 0..1 proves nothing at all — `handPoint` CLAMPS, so frame x = 0 lands on
     * screen x = 0 for any reach whatever and every target is trivially hit. (That tautology was
     * written first and caught by mutating `REACH`, which changed nothing.) What can actually be
     * wrong is a board spread so wide that the outer columns need a hand at the very edge of the
     * picture — `SWEEP_ARM`'s silence, and the thousands are the column it would eat. So the sweep
     * is the comfortable band only, and a target reachable ONLY via the clamp fails.
     */
    const LO = 0.16, HI = 0.84
    for (const [vw, vh] of SIZES) {
      for (const slots of [1, 4]) {
        const L = boardLayout(vw, vh, 0.87, slots)
        const T = trayLayout(L, vw, vh, 4)
        const hitBoxes = new Set<number>()
        const hitTiles = new Set<number>()
        // finer than a hand can be aimed
        for (let fx = LO; fx <= HI; fx += 0.003) {
          for (let fy = LO; fy <= HI; fy += 0.003) {
            const p = handPoint({ x: fx, y: fy }, vw, vh)
            const b = boxHit(L, slots, p); if (b >= 0) hitBoxes.add(b)
            const t = tileHit(L, vw, vh, 4, p); if (t >= 0) hitTiles.add(t)
          }
        }
        expect(hitBoxes.size, `${vw}x${vh} slots=${slots}: column out of reach`).toBe(slots)
        expect(hitTiles.size, `${vw}x${vh}: tile out of reach`).toBe(4)
      }
    }
  })

  /**
   * ⚠️ AND THE HAND MUST NOT BE ABLE TO DROP A DIGIT IN A COLUMN THE CHILD WAS NOT OVER. The catch
   * area is deliberately looser than the box is drawn — a pinch wanders while the fingers open — so
   * the one thing that has to hold is that the tolerance never reaches past the halfway line to a
   * neighbour, or a decisive drop on the tens lands in the hundreds.
   */
  it('never lets one column catch a point nearer to the next', () => {
    for (const [vw, vh] of SIZES) {
      const slots = 4
      const L = boardLayout(vw, vh, 0.87, slots)
      const y = L.boardTop + L.boxH / 2
      for (let i = 0; i < slots - 1; i++) {
        const mid = (L.boxAt(i) + L.boxW + L.boxAt(i + 1)) / 2
        expect(boxHit(L, slots, { x: mid - 1, y }), `${vw}x${vh}: gap after col ${i}`).not.toBe(i + 1)
        expect(boxHit(L, slots, { x: mid + 1, y }), `${vw}x${vh}: gap before col ${i + 1}`).not.toBe(i)
      }
    }
  })

  /**
   * ⚠️ **THE WORKING MUST NEVER BE DRAWN OVER THE ANSWER — and this one had been shipping.** Pinned
   * top-left, the walkthrough's board covered the boxes at **17 of the 18** reachable size ×
   * column-count combinations: the boxes are centred under the docket and the sheet started at
   * x = 12. Translucent paper hid it; an opaque chalkboard showed it in one screenshot. It lives in
   * the band the controls own during play now — empty in a walkthrough — and grows UPWARD from the
   * bottom, so the only way it can overflow is back onto the boxes, which is exactly what this
   * asserts. `stepBoardRect` is the SAME function the board lays itself out with, so a check here
   * cannot agree with its own copy of the placement.
   */
  it('never lets the walkthrough\'s working cover the answer boxes', () => {
    for (const [vw, vh] of SIZES) {
      for (const slots of [1, 3, 4]) {
        const L = boardLayout(vw, vh, 0.87, slots)
        const R = stepBoardRect(vw, vh)
        expect(R.top, `${vw}x${vh} slots=${slots}: working over the boxes`).toBeGreaterThan(L.boardBottom + 5)
        expect(R.left, `${vw}x${vh}: working over the cast`).toBeGreaterThanOrEqual(L.side)
        expect(R.left + R.w, `${vw}x${vh}: working over the cast`).toBeLessThanOrEqual(vw - L.side)
      }
    }
  })

  /**
   * ⚠️ AND THAT THE BOARD IS ACTUALLY LAID OUT FROM IT — a placement lives in CSS, so driving the
   * function alone leaves the check green while the component pins itself somewhere else. Proven by
   * mutation: putting the board back at `left: 12, top: 58` (where it covered the boxes) passed
   * every other assertion in this file.
   */
  it('lays the working board out from that same rect', () => {
    // ⚠️ Reads `chalkboard.tsx`, not this chapter: `StepBoard` moved there when The Long Level became
    // the second consumer, and this check FAILED on the move — which is the check working. It is
    // still this chapter's to make, because `stepBoardRect` is what the assertions above drive.
    const board = readFileSync(join(process.cwd(), 'src/features/chapters/story/chalkboard.tsx'), 'utf8')
    expect(board).toMatch(/left:\s*R\.left,\s*top:\s*R\.top/)
  })

  /**
   * ⚠️ **THE HAND'S HIT-TEST AND THE RENDER MUST BE ONE GEOMETRY.** Both the tray the child sees and
   * the tray the pinch is tested against come from `trayLayout`, and both the drawn boxes and the
   * drop target come from `boardLayout`/`boxHit`. A carry that measured the row itself would drift
   * the first time the tray moved, and the symptom is the worst one this chapter has: a child
   * pinching a tile in plain sight and picking up nothing.
   */
  it('drops through the shared hit-tests rather than its own arithmetic', () => {
    expect(SRC, 'the drop does not use the shared box hit-test').toMatch(/boxHit\(L, slots, atRef\.current\)/)
    expect(SRC, 'the pick-up does not use the shared tray hit-test').toMatch(/tileHit\(L, vw, vh, trayRef\.current\.length, atRef\.current\)/)
    expect(SRC, 'the tray is laid out twice').toMatch(/const T = trayLayout\(L, vw, vh, data\.tray\.length\)/)
  })

  /**
   * ⚠️ **OPENING YOUR FINGERS OVER NOTHING PUTS THE DIGIT BACK — it must never fall into the nearest
   * column.** A digit landing somewhere the child did not aim at is a wrong answer the chapter
   * caused, which is the same asymmetry `stepPinch` confirms its release over three frames for.
   */
  it('only places a digit when the hand is actually over a column', () => {
    expect(SRC).toMatch(/if \(b >= 0\) putRef\.current\(c, b\)/)
  })

  /**
   * ⚠️ **THE QUESTION MUST NEVER BE DRAWN OVER THE ANSWER.** Centred under the customer, a four-box
   * row ran to 887 at 1280×720 while their bubble started at 808 — the ask covering the last two
   * boxes, which is the open item a previous cut left behind and which centring reproduced on the
   * first drive. Where neither placement clears it, the ask moves to a banner and this asserts THAT
   * rather than pretending the geometry fits.
   *
   * ⚠️ **IT IS A TWO-AXIS CHECK NOW, AND THE ONE-AXIS VERSION WOULD FAIL THE SHIPPED LAYOUT.** It
   * used to say "the board ends before `bubbleLeft`", which was true only while the board was always
   * placed BESIDE the bubble. The founder asked for centred boxes, so on a roomy frame the board is
   * lifted into the band ABOVE the bubble instead and crosses its x-band on purpose — perfectly
   * clear of it, and the old assertion would have called that a collision.
   */
  it('never lets the customer\'s bubble cover a box', () => {
    for (const [vw, vh] of SIZES) {
      for (const slots of [1, 3, 4]) {
        const L = boardLayout(vw, vh, 0.87, slots)
        if (L.askAtTop) continue                     // no bubble to collide with
        const overX = L.boardLeft + L.rowW > bubbleLeft(vw)
        const overY = L.boardTop + L.boxH + L.labelH > L.bubbleTop
        expect(overX && overY, `${vw}x${vh} slots=${slots}: the bubble covers a box`).toBe(false)
      }
    }
  })

  /**
   * ⚠️ THE PRINTED TOTAL MUST NOT TOUCH THE BOX. At `boardTop - 44` the docket sat exactly on the
   * box's top edge at 1280×720 — the number being READ welded onto the box being WRITTEN, which
   * reads as the box already holding it.
   */
  it('keeps the printed total clear of the box', () => {
    for (const [vw, vh] of SIZES) {
      const L = boardLayout(vw, vh, 0.87, 1)
      expect(L.docketTop, `${vw}x${vh}`).toBeGreaterThanOrEqual(0)
      expect(L.docketTop + L.docketH, `${vw}x${vh}: docket touches the box`).toBeLessThan(L.boardTop)
    }
  })

  it('never lets the board reach the ground the cast stands on', () => {
    for (const [vw, vh] of SIZES) {
      const L = boardLayout(vw, vh, 0.87, 4)
      expect(L.boardBottom, `${vw}x${vh}: board reaches ${L.boardBottom} of ${L.groundPx}`)
        .toBeLessThanOrEqual(L.groundPx)
    }
  })
})

describe('the run', () => {
  it('covers every slot the chapter plays — 2 demo + 1 guided + 10 scored', () => {
    expect(RUN.length).toBeGreaterThanOrEqual(13)
    expect(yardAt(12)).toBeDefined()
    // and clamps rather than running off the end
    expect(yardAt(99)).toBe(RUN[RUN.length - 1])
  })

  it('every scene is a fundraiser scene on disk, and consecutive slots differ', () => {
    for (let i = 0; i < 13; i++) {
      expect(yardAt(i).scene).toMatch(/fund_(hall|yard|gym)\.png$/)
      if (i > 0) expect(yardAt(i).scene === yardAt(i - 1).scene && yardAt(i).customer === yardAt(i - 1).customer).toBe(false)
    }
  })

  it('declares every question type for the coverage gate', () => {
    expect([...Q_ALL].sort()).toEqual(['read', 'value', 'write'])
  })
})
