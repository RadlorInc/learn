/**
 * THE COIN TRAY (9–11, `decimals`) — the gate.
 *
 * The answering surface is a webcam, so nothing above story/cents.ts can be driven here. What this
 * file holds to account is the maths, the ladder, every word the child reads, and the one piece of
 * layout arithmetic that decides whether the tray lands on the controls.
 *
 * The faults it exists to make unrepeatable, all of them shipped by the chapter this replaces:
 *   · a two-option answer surface (a 50% coin flip on the round type the chapter is FOR)
 *   · an instrument drawn empty for a whole round, meaning nothing
 *   · a demo card labelled with a hardcoded tag that did not match the round it played
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  makeRound, mkMake, mkPlace, mkOp, explainBeats, padChoices, missFor, nudgeFor, verdictFor, headline,
  instructionFor, sayFor, graded, trayCents, dec, money, spokenDec, coins, dimesOf, penniesOf,
  boardBand, TOP_BAND, BOT_BAND, MAX_PER_WELL, MILO_LANE, miloRight, TRAP_CENTS, DEMO, GUIDED,
  type CtRound, type Tier, type Tray,
} from '@/features/chapters/story/cents'

const TIERS: Tier[] = [1, 2, 3]
const SCENE = fs.readFileSync(path.join(process.cwd(), 'src/features/chapters/story/CoinTray.tsx'), 'utf8')
/** Comments are stripped before any source check: this repo has shipped a gate that matched the
 *  paragraph explaining a rule instead of the code obeying it. */
const CODE = SCENE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/** Every round any tier can draw, many times over — the sweep every invariant below runs on. */
function sweep(d: Tier, n = 600): CtRound[] {
  return Array.from({ length: n }, () => makeRound(d))
}
const trayFor = (c: number): Tray => ({ dimes: dimesOf(c), pennies: penniesOf(c) })

describe('the two forms of the amount', () => {
  it('writes the decimal trimmed and the money padded', () => {
    expect(dec(60)).toBe('0.6')
    expect(dec(55)).toBe('0.55')
    expect(dec(6)).toBe('0.06')
    expect(money(60)).toBe('$0.60')
    expect(money(6)).toBe('$0.06')
  })

  /**
   * ⚠️ THE ONE PLACE THE ANCHOR FIGHTS THE MATHS. Money notation pads to two places, so `$0.60` vs
   * `$0.55` is obviously bigger and the misconception this chapter exists for cannot occur. The money
   * form is the REVEAL's bridge, never part of an ask.
   */
  it('never puts the money form in an ask', () => {
    for (const d of TIERS) for (const r of sweep(d, 300)) {
      expect(r.prompt).not.toMatch(/\$/)
      expect(r.spoken).not.toMatch(/\$/)
    }
  })

  /** ⚠️ "sixty cents" states the answer — six dimes — without a decimal being read at all. */
  it('says the digits after the point, never the cents', () => {
    expect(spokenDec(60)).toBe('zero point six')
    expect(spokenDec(6)).toBe('zero point zero six')
    expect(spokenDec(55)).toBe('zero point five five')
    for (const d of TIERS) for (const r of sweep(d, 200)) expect(r.spoken).not.toMatch(/cents/i)
  })
})

describe('every round is answerable on the surface the child has', () => {
  it('never asks for more than a well can hold', () => {
    for (const d of TIERS) for (const r of sweep(d)) {
      expect(r.target).toBeGreaterThanOrEqual(1)
      expect(r.target).toBeLessThanOrEqual(99)
      expect(dimesOf(r.target)).toBeLessThanOrEqual(MAX_PER_WELL)
      expect(penniesOf(r.target)).toBeLessThanOrEqual(MAX_PER_WELL)
    }
  })

  /** ⚠️ ZERO IS AN ANSWER HERE — `0.6` is six dimes and a FIST — so the pad has to offer it. */
  it('offers exactly what a well can hold, including zero', () => {
    expect(padChoices()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(padChoices()[0]).toBe(0)
    expect(Math.max(...padChoices())).toBe(MAX_PER_WELL)
  })

  it('grades the tray, and only the exact tray', () => {
    const r = mkMake(55)
    expect(graded(r, trayFor(55))).toBe(true)
    expect(graded(r, { dimes: 5, pennies: 4 })).toBe(false)
    expect(graded(r, { dimes: 4, pennies: 5 })).toBe(false)   // the misconception, refused
    expect(trayCents({ dimes: 6, pennies: 0 })).toBe(60)
  })
})

describe('the ladder grows the misconception, not just the numbers', () => {
  /** L1 is tenths only, so the pennies well is always a fist: the child learns the FIRST place. */
  it('L1 asks tenths only, and only `make`', () => {
    for (const r of sweep(1)) {
      expect(r.qType).toBe('make')
      expect(penniesOf(r.target)).toBe(0)
    }
  })

  it('L2 opens both wells', () => {
    const makes = sweep(2).filter(r => r.qType === 'make')
    expect(makes.length).toBeGreaterThan(0)
    for (const r of makes) {
      expect(dimesOf(r.target)).toBeGreaterThan(0)
      expect(penniesOf(r.target)).toBeGreaterThan(0)
    }
  })

  /** ⚠️ The trap amounts are the chapter — 0.6 against 0.06 — and they exist only at the top tier. */
  it('L3 reaches the trap amounts and L1/L2 never do', () => {
    const traps = sweep(3, 1200).filter(r => r.qType === 'make' && TRAP_CENTS.includes(r.target))
    expect(traps.length).toBeGreaterThan(50)
    const single = sweep(2, 600).filter(r => r.qType === 'make' && (dimesOf(r.target) === 0 || penniesOf(r.target) === 0))
    expect(single).toHaveLength(0)
  })

  /**
   * ⚠️ DRAWN TO GUARANTEE THE CASE, NEVER CLAMPED INTO IT. An empty `rint` range silently produces
   * the case the tier was meant to exclude, and a `Math.max(1, …)` behind it hides that — which is
   * how a tier stops meaning anything while every round still looks fine.
   */
  it('L2 price moves never cross a ten and L3 ones always do', () => {
    const l2 = sweep(2, 900).filter(r => r.qType === 'op')
    expect(l2.length).toBeGreaterThan(50)
    for (const r of l2) {
      expect(r.op).toBe('+')
      expect(penniesOf(r.from) + penniesOf(r.step)).toBeLessThanOrEqual(MAX_PER_WELL)
      expect(r.step).toBeGreaterThanOrEqual(1)
    }
    const l3 = sweep(3, 900).filter(r => r.qType === 'op')
    expect(l3.length).toBeGreaterThan(50)
    expect(new Set(l3.map(r => r.op))).toEqual(new Set(['+', '−']))
    for (const r of l3) {
      expect(r.step).toBeGreaterThanOrEqual(1)
      expect(r.target).toBeGreaterThanOrEqual(1)
      if (r.op === '+') expect(penniesOf(r.from) + penniesOf(r.step)).toBeGreaterThanOrEqual(10)
      else expect(penniesOf(r.step)).toBeGreaterThan(penniesOf(r.from))
    }
  })

  it('a place round fills one well and leaves the other empty', () => {
    const places = [...sweep(2, 600), ...sweep(3, 600)].filter(r => r.qType === 'place')
    expect(places.length).toBeGreaterThan(50)
    for (const r of places) {
      expect(r.place).not.toBeNull()
      const empty = r.place === 'tenths' ? penniesOf(r.target) : dimesOf(r.target)
      const full = r.place === 'tenths' ? dimesOf(r.target) : penniesOf(r.target)
      expect(empty).toBe(0)
      expect(full).toBeGreaterThan(0)
    }
    // L2 names one new word at a time; hundredths — where the habit breaks — waits for L3.
    for (const r of sweep(2, 600).filter(r => r.qType === 'place')) expect(r.place).toBe('tenths')
    expect(new Set(sweep(3, 900).filter(r => r.qType === 'place').map(r => r.place)))
      .toEqual(new Set(['tenths', 'hundredths']))
  })
})

describe('nothing the child reads hands over the answer', () => {
  /**
   * The miss line may not name the answer, and may not differ between a tray that was nearly right
   * and one that was not — a line that narrowed with the attempt would be hot/cold across attempts.
   */
  it('a miss line never names the amount, and never varies with the attempt', () => {
    for (const d of TIERS) for (const r of sweep(d, 200)) {
      const m = missFor(r)
      expect(m).not.toContain(dec(r.target))
      expect(m).not.toContain(money(r.target))
      expect(m).not.toContain(String(dimesOf(r.target) * 10 + penniesOf(r.target)))
      // the same words for every wrong tray on this round
      for (const c of [1, 17, 42, 99]) expect(missFor(r)).toBe(m)
    }
  })

  it('a nudge fires only on an empty tray, and never names the amount', () => {
    const r = mkMake(55)
    expect(nudgeFor(r, { dimes: 0, pennies: 0 })).not.toBeNull()
    expect(nudgeFor(r, { dimes: 0, pennies: 0 })).not.toContain(dec(55))
    // ⚠️ Every other tray grades NORMALLY — a wrong placement has to cost a mark, that is the chapter.
    expect(nudgeFor(r, { dimes: 4, pennies: 5 })).toBeNull()
    expect(nudgeFor(r, trayFor(55))).toBeNull()
  })

  /** ⚠️ The verdict prints the bridge only AFTER the commit, and a miss names what was laid. */
  it('the verdict bridges on a hit and describes the tray on a miss', () => {
    const r = mkMake(60)
    const hit = verdictFor(r, trayFor(60))
    expect(hit.ok).toBe(true)
    expect(hit.text).toContain('$0.60')
    expect(hit.text).toContain('0.6')
    const miss = verdictFor(r, trayFor(6))
    expect(miss.ok).toBe(false)
    expect(miss.text).toContain('0.06')
    expect(miss.text).not.toContain(dec(60))
    expect(miss.text).not.toContain('$')
  })

  /** Zone 3 is the only zone that knows how the child answers, and which well is lit. */
  it('the instruction names the surface on screen and the well being filled', () => {
    expect(instructionFor('hand', 'dimes')).toMatch(/hold up/)
    expect(instructionFor('tap', 'dimes')).toMatch(/tap/)
    expect(instructionFor('hand', 'dimes')).not.toMatch(/tap/)
    expect(instructionFor('tap', 'pennies')).not.toMatch(/hold up|fingers/)
    expect(instructionFor('hand', 'dimes')).not.toBe(instructionFor('hand', 'pennies'))
    const r = mkMake(55)
    expect(sayFor(r, 'hand')).toMatch(/hold up/)
    expect(sayFor(r, 'tap')).not.toMatch(/hold up/)
  })

  /**
   * ⚠️ Found on screen, on the FIRST demo beat: "0 pennyies", from a plural built by appending a
   * suffix. The "Fox has a apple" family, in front of a child still learning to read.
   */
  it('says the coins in English at every count', () => {
    expect(coins(1, 'dimes')).toBe('1 dime')
    expect(coins(0, 'dimes')).toBe('0 dimes')
    expect(coins(1, 'pennies')).toBe('1 penny')
    expect(coins(0, 'pennies')).toBe('0 pennies')
    expect(coins(7, 'pennies')).toBe('7 pennies')
    const said = [...DEMO, GUIDED, ...TIERS.flatMap(d => sweep(d, 150))]
      .flatMap(r => [r.prompt, r.spoken, ...explainBeats(r).map(b => b.say)]).join(' ')
    expect(said).not.toMatch(/pennyies|pennys|dimess|\b1 (pennies|dimes)\b|\b(0|[2-9]\d*) (penny|dime)\b/)
  })

  /**
   * ⚠️⚠️ THE BOARD MUST NOT PRINT ITS OWN ANSWER, AND ONLY A `make` ROUND MAY SHOW THE AMOUNT.
   * Shipped for an hour printing `dec(target)` on every type, which looks harmless and is fatal
   * twice: on an `op` round *"it read 0.55, it went UP by 0.05"* the printed `0.6` IS the answer, so
   * the arithmetic never happens; on a `place` round the words-to-digits step is done for the child.
   * Asserted on TOKENS, not substrings — "0.1 + 0.6" contains "0.6" while meaning nothing of the kind.
   */
  it('never prints the amount before the commit except where the amount is the question', () => {
    const tokens = (s: string) => s.split(/[^\d.]+/).filter(Boolean)
    for (const d of TIERS) for (const r of sweep(d, 400)) {
      const open = headline(r, false)
      if (r.qType === 'make') expect(open).toBe(dec(r.target))
      else expect(tokens(open)).not.toContain(dec(r.target))
      // and the reveal DOES show it — by then the child has already answered
      expect(headline(r, true)).toBe(dec(r.target))
    }
    // an `op` round shows its SUM, which is the question rather than the answer
    const op = mkOp(55, 5, '+')
    expect(headline(op, false)).toBe('0.55 + 0.05')
    expect(headline(op, true)).toBe('0.6')
    // a `place` round is asked in words, so the board shows nothing at all
    expect(headline(mkPlace(7, 'hundredths'), false)).toBe('?')
  })

  /** A context line states what the numbers ARE, with no UI verbs in it. */
  it('the context carries no UI verb', () => {
    for (const d of TIERS) for (const r of sweep(d, 200)) {
      expect(r.prompt).not.toMatch(/\btap\b|\bhold up\b|\bfingers\b|\bbutton\b/i)
    }
  })
})

describe('the worked example teaches the case the chapter is for', () => {
  /**
   * ⚠️ Hand-picked examples drift toward the tidy case. `0.6` IS the chapter — six DIMES, no pennies
   * — and a demo that only ever shows `0.55` avoids the one round type a child gets wrong.
   */
  it('the first demo is a trap amount', () => {
    expect(TRAP_CENTS).toContain(DEMO[0].target)
    expect(penniesOf(DEMO[0].target)).toBe(0)
    expect(dimesOf(DEMO[0].target)).toBeGreaterThan(0)
  })

  it('the demos cover all three readings and the guided round is the gentlest', () => {
    expect(new Set(DEMO.map(r => r.qType))).toEqual(new Set(['make', 'place', 'op']))
    expect(GUIDED.qType).toBe('make')
    expect(penniesOf(GUIDED.target)).toBe(0)
  })

  it('every beat list ends on the answer and nothing before it does', () => {
    const rounds = [...DEMO, GUIDED, mkPlace(7, 'hundredths'), mkOp(55, 5, '+'), mkOp(62, 7, '−')]
    for (const r of rounds) {
      const beats = explainBeats(r)
      expect(beats.length).toBeGreaterThanOrEqual(3)
      expect(trayCents(beats[beats.length - 1].tray)).toBe(r.target)
      for (const b of beats) {
        expect(b.tray.dimes).toBeLessThanOrEqual(MAX_PER_WELL)
        expect(b.tray.pennies).toBeLessThanOrEqual(MAX_PER_WELL)
      }
    }
  })

  /** The crossing is the fact the two wells exist to show, so it is SAID when it happens. */
  it('a crossing price move says the pennies made a dime', () => {
    expect(explainBeats(mkOp(55, 5, '+')).map(b => b.say).join(' ')).toMatch(/whole dime/i)
  })
})

describe('the layout leaves the controls alone', () => {
  const SIZES = [320, 360, 400, 470, 620, 720, 800, 900, 1080]

  /**
   * ⚠️ A FLOOR ON THE BAND BREAKS THE RESERVE IT LIVES INSIDE. `Math.max(90, …)` hands back 90 once
   * the question card has wrapped far enough down, and the tray is drawn straight into the controls.
   * The clamp is on `top`, so the tray slides UP under text the child has already read.
   *
   * Asserted against CONCRETE numbers rather than against the expression, which would move with the
   * mutation and prove nothing.
   */
  it('the tray never starts low enough to reach the bottom band', () => {
    for (const vh of SIZES) {
      const short = vh < 470
      for (const pb of [0, 60, 96, 142, 200, 265]) {
        const { top, bot, band } = boardBand(vh, short, pb)
        expect(top + band + bot).toBeLessThanOrEqual(vh)
        expect(top).toBeLessThanOrEqual(vh - bot - 90)
        expect(band).toBeGreaterThanOrEqual(90)
        expect(bot).toBe(BOT_BAND(short))
      }
    }
  })

  /**
   * ⚠️⚠️ MILO'S LANE KEYS ON WIDTH, AND KEYING IT ON HEIGHT IS THE FACTORLAB FAULT VERBATIM.
   * Measured live at **466×676** — not short, so it took the 12px lane — his 135px box covered the
   * pad's `0` and `1` keys, and `0` is the answer on most rounds here. He is `pointerEvents: none`,
   * so the tap still lands and nothing but crossing the two boxes can see it.
   */
  it('gives Milo a real lane on any narrow frame, however tall', () => {
    for (const vw of [360, 466, 640, 740, 820, 899]) {
      for (const vh of [300, 320, 470, 676, 800, 1000]) {
        expect(MILO_LANE(vw, vh)).toBeGreaterThan(miloRight(vw, vh))
      }
    }
    // 466x676 is the frame it was caught on: his right edge is 109.5 and the old constant was 104.
    expect(miloRight(466, 676)).toBeCloseTo(109.5, 1)
    expect(MILO_LANE(466, 676)).toBeGreaterThan(109.5)

    /**
     * ⚠️ Above 900px the lane is only a margin, so the pad clears him by CENTRING — which is exactly
     * the kind of "true by luck" this file exists to stop being luck. Computed, not assumed: the pad
     * is centred in what the lane leaves, and its left edge has to clear him.
     */
    for (const [vw, vh] of [[900, 600], [1024, 640], [1280, 720], [1920, 1080]]) {
      const lane = MILO_LANE(vw, vh)
      const padW = Math.min(10 * 52 + 9 * 7, Math.min(vw * 0.96, 680))
      const padLeft = lane + Math.max(0, (vw - lane - 12 - padW) / 2)
      expect(padLeft).toBeGreaterThan(miloRight(vw, vh))
    }
  })

  it('a tall question card pushes the tray down rather than being sat on', () => {
    const a = boardBand(720, false, 60)
    const b = boardBand(720, false, 265)
    expect(b.top).toBeGreaterThan(a.top)
    expect(boardBand(720, false, 0).top).toBe(TOP_BAND(false))
  })
})

describe('the scene is wired to the pure module', () => {
  /** The words the child reads must come from here, where this gate can see them. */
  it('prints the module verdict and miss line rather than building its own', () => {
    expect(CODE).toMatch(/verdictFor\(/)
    expect(CODE).toMatch(/missFor\(/)
    expect(CODE).toMatch(/nudgeFor\(/)
    // ⚠️ Mentioning it is not reaching it: assert the RESULT is what the board is handed.
    expect(CODE).toMatch(/verdict=\{reveal\?\.verdict/)
    // ⚠️ and the big figure comes from the module too — that is where the printed-answer rule lives
    expect(CODE).toMatch(/headline\(data, /)
    expect(CODE).not.toMatch(/\{dec\(data\.target\)\}/)
    /**
     * ⚠️ And the pad's padding comes from the lane. Caught by mutation: every layout assertion above
     * drives `MILO_LANE` directly, so a scene that stops calling it and hardcodes a padding walks
     * straight through them — "a gate that reads the module cannot see the scene not using it",
     * which is the same reason the verdict and headline checks are here rather than only upstream.
     */
    expect(CODE).toMatch(/paddingLeft: MILO_LANE\(/)
  })

  /**
   * ⚠️ THE DWELL KEY MAY NOT CONTAIN THE WELL. Putting it in re-arms the timer the instant the slot
   * advances, so a hand still showing 5 fills both wells with 5 and `0.55` answers itself — measured
   * on FitOut, which shipped `12` as `11` for exactly this.
   */
  it('keys the dwell on the reading alone', () => {
    const key = CODE.match(/key:\s*`([^`]*)`/)?.[1]
    expect(key).toBe('${read.count}/${read.hands}')
    expect(key).not.toMatch(/slot|well/i)
  })

  /**
   * ⚠️ `ready` IS `hands > 0`, NOT `count > 0`. A fist is the answer on every round with an empty
   * well, which is most of the ones this chapter is for — the mirror of The Pizza Counter, where no
   * answer is ever zero and `count > 0` is correct.
   */
  it('accepts a fist as an answer but not a lowered hand', () => {
    expect(CODE).toMatch(/ready:\s*read\.hands\s*>\s*0\s*\}/)
    expect(CODE).not.toMatch(/ready:[^}]*read\.count\s*>\s*0/)
  })

  /**
   * ⚠️ BOTH THE TRAY AND THE SLOT ARE MIRRORED IN REFS. Two taps in one React batch would otherwise
   * both read the old slot and write the same well twice — the batched-tap fault this repo has met
   * six times, and the last time the mirror covered the digits and NOT the active box.
   */
  it('mirrors the slot as well as the tray', () => {
    expect(CODE).toMatch(/slotRef\s*=\s*useRef/)
    expect(CODE).toMatch(/trayRef\s*=\s*useRef/)
    expect(CODE).toMatch(/slotRef\.current === 'dimes'/)
  })

  /** Both doors, every time — the remembered pick decides which is big, never which is the only one. */
  it('offers the other input on the briefing card', () => {
    expect(CODE).toMatch(/useTaps\(\)/)
    expect(CODE).toMatch(/useCamera\(\)/)
    expect(CODE).toMatch(/alt=\{/)
  })

  /** The demo's card tag is not a literal question type — the fault the old chapter shipped. */
  it('does not label a demo with a round type it may not be', () => {
    expect(CODE).not.toMatch(/tag="Read"/)
    expect(CODE).not.toMatch(/tag="Compare"/)
  })
})
