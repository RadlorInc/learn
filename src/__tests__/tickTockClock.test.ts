/**
 * The gate for TIME (TickTock).
 *
 * It drives the SAME functions the scene renders from — everything in clock.ts — because a check that
 * re-implements a rule cannot see the rule being removed, and a check that reads a chapter's DATA
 * cannot see how the chapter INDEXES it. Both of those have bitten this repo.
 *
 * The two claims that matter most here, because neither is visible on a screenshot:
 *   · after half past, the hour in the WORDS is one ahead of the hour on the FACE, and
 *   · a READ round's question never contains its own answer.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  RING, DAY, TINT, MILO, MILO_ASPECT,
  wordsFor, phraseFor, minutePhrase, spokenHourFor, minsFor,
  ringMinuteFor, numeralForMinute, hourAngle, minuteAngle,
  askKindFor, askTextFor, hintFor, daySlot, skyFor, layoutFor, chromeTop, menuBtn, CHROME_PAD,
  pickMinute, kindOf, READINGS,
} from '@/features/chapters/story/clock'
import { makeTimeRound, makeTimeBeat } from '@/features/chapters/story/TickTock'
import { SHEETS } from '@/features/chapters/story/canvas/sheets'

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const hasDigit = (s: string) => /\d/.test(s)

// ─── words ────────────────────────────────────────────────────────────────────────────
describe('the time in words', () => {
  it('names every position on the ring, at every hour', () => {
    for (const h of HOURS) for (const m of RING) {
      const w = wordsFor(h, m)
      expect(w, `${h}:${m}`).toBeTruthy()
      // "7:25" leaking through as digits is the old fallback this chapter replaced.
      expect(w, `${h}:${m} fell through to digits`).not.toMatch(/\d:\d/)
    }
  })

  it('is rendered by ONE function — wordsFor is phraseFor with the spoken hour', () => {
    for (const h of HOURS) for (const m of RING) {
      expect(wordsFor(h, m)).toBe(phraseFor(m, spokenHourFor(h, m)))
    }
  })

  it('⚠️ counts BACKWARDS from the next hour past the half hour', () => {
    for (const h of HOURS) for (const m of RING) {
      if (m <= 30) expect(spokenHourFor(h, m), `${h}:${m}`).toBe(h)
      else expect(spokenHourFor(h, m), `${h}:${m}`).toBe((h % 12) + 1)
    }
    // The case that trips every child, pinned by name.
    expect(wordsFor(7, 45)).toBe('quarter to 8')
    expect(wordsFor(12, 35)).toBe('twenty-five to 1')
    expect(wordsFor(7, 15)).toBe('quarter past 7')
    expect(wordsFor(7, 30)).toBe('half past 7')
    expect(wordsFor(7, 0)).toBe("7 o'clock")
  })

  it('says "past" up to the half hour and "to" after it', () => {
    for (const m of RING) {
      if (m === 0) expect(minutePhrase(m)).toBe("o'clock")
      else if (m <= 30) expect(minutePhrase(m), String(m)).toMatch(/past$/)
      else expect(minutePhrase(m), String(m)).toMatch(/ to$/)
    }
  })

  it('⚠️ keeps the minute half free of digits, so a dial label cannot be carved out of a phrase', () => {
    // The first version of the read dial rendered the whole phrase and string-replaced the hour out
    // of it. That corrupts silently the moment a minute word shares a digit with the hour.
    for (const m of RING) expect(hasDigit(minutePhrase(m)), minutePhrase(m)).toBe(false)
  })
})

// ─── the two scales ───────────────────────────────────────────────────────────────────
describe('the second scale — the payload', () => {
  it('maps each numeral to the minutes it also means', () => {
    expect(ringMinuteFor(12)).toBe(0)
    expect(ringMinuteFor(3)).toBe(15)
    expect(ringMinuteFor(6)).toBe(30)
    expect(ringMinuteFor(9)).toBe(45)
  })

  it('is invertible, so the lesson and a read round cannot disagree', () => {
    for (const m of RING) expect(ringMinuteFor(numeralForMinute(m))).toBe(m)
    for (const n of HOURS) expect(numeralForMinute(ringMinuteFor(n))).toBe(n)
  })

  it('has twelve positions, five minutes apart, starting at zero', () => {
    expect(RING.length).toBe(12)
    expect(RING[0]).toBe(0)
    RING.forEach((m, i) => expect(m).toBe(i * 5))
  })
})

describe('the hands', () => {
  it('creeps the hour hand between numerals, which is what has to be read', () => {
    expect(hourAngle(3, 0)).toBe(90)
    expect(hourAngle(3, 30)).toBe(105)          // half way to the 4, not snapped to the 3
    expect(hourAngle(12, 0)).toBe(0)
    expect(hourAngle(3, 30)).toBeGreaterThan(hourAngle(3, 0))
  })
  it('puts the minute hand exactly on its numeral', () => {
    for (const m of RING) expect(minuteAngle(m)).toBe(m * 6)
    expect(minuteAngle(30)).toBe(180)
    expect(minuteAngle(15)).toBe(90)
  })
})

// ─── the ladder ───────────────────────────────────────────────────────────────────────
describe('the difficulty ladder', () => {
  it('is a superset at every step', () => {
    expect(minsFor(1).every(m => minsFor(2).includes(m))).toBe(true)
    expect(minsFor(2).every(m => minsFor(3).includes(m))).toBe(true)
  })

  it('starts on ONE position, so the gentlest tier is actually gentle', () => {
    expect(minsFor(1)).toEqual([0])
  })

  it('⚠️ holds "to" times back to L3 — past before to', () => {
    // Everything at or below :30 has the spoken hour agreeing with the face hour. The moment "to"
    // appears the child must say one hour and place another, and stacking that on top of meeting
    // quarter past in the same tier hands them two unrelated difficulties in one step.
    expect(minsFor(2).every(m => m <= 30)).toBe(true)
    expect(minsFor(3).some(m => m > 30)).toBe(true)
  })

  it('reaches every five-minute position at the top, which is what the curriculum asks for', () => {
    expect(minsFor(3)).toEqual([...RING])
  })

  it('grows strictly — a flat ladder is not a ladder', () => {
    expect(minsFor(1).length).toBeLessThan(minsFor(2).length)
    expect(minsFor(2).length).toBeLessThan(minsFor(3).length)
  })
})

// ─── both directions ──────────────────────────────────────────────────────────────────
describe('reading and setting', () => {
  it('alternates, so consecutive rounds differ in gesture as well as in scene', () => {
    for (let r = 0; r < 10; r++) expect(askKindFor(r)).not.toBe(askKindFor(r + 1))
  })

  it('practises both all the way down the run rather than in two blocks', () => {
    const kinds = Array.from({ length: 10 }, (_, r) => askKindFor(r))
    expect(new Set(kinds).size).toBe(2)
    expect(kinds.slice(0, 4)).toContain('set')
    expect(kinds.slice(6)).toContain('read')
  })

  it('⚠️ never puts the answer inside a READ question', () => {
    // "Milo is waiting to catch the bus at quarter past nine. What time is it?" would be answerable
    // without ever looking at the clock — the whole chapter, given away by its own wording.
    for (let r = 0; r < DAY.length; r++) {
      const round = makeTimeRound(3, r)
      const text = askTextFor(round)
      if (round.ask === 'read') {
        expect(text, text).not.toContain(wordsFor(round.h, round.m))
        expect(text, text).not.toContain(minutePhrase(round.m))
      } else {
        // A set round MUST state the time — that is the question.
        expect(text, text).toContain(wordsFor(round.h, round.m))
      }
    }
  })

  it('tells the two failure modes apart, so a miss teaches the thing that went wrong', () => {
    const set = { ask: 'set' as const, m: 30 }
    expect(hintFor(set, { h: 3, m: 15 })).toMatch(/long hand/)
    expect(hintFor(set, { h: 4, m: 30 })).toMatch(/short hand/)
    const read = { ask: 'read' as const, m: 45 }
    expect(hintFor(read, { h: 8, m: 30 })).toMatch(/long hand/)
    expect(hintFor(read, { h: 7, m: 45 })).toMatch(/NEXT hour/)
  })

  it('⚠️ only gives the "to" advice on a "to" time', () => {
    // Given for any wrong read hour it fired on "7 o'clock" too — telling a child to count to the next
    // hour when there is no next hour in the answer. Worse than silence: it teaches a rule that does
    // not apply and says nothing about what they got wrong. Found by playing a full ten-round run.
    for (const m of RING) {
      const h = hintFor({ ask: 'read', m }, { h: 4, m })   // right minutes, wrong hour
      if (m > 30) expect(h, `m=${m}`).toMatch(/NEXT hour/)
      else expect(h, `m=${m}`).not.toMatch(/NEXT hour/)
      expect(h.length).toBeGreaterThan(12)
    }
    expect(hintFor({ ask: 'read', m: 0 }, { h: 4, m: 0 })).toMatch(/short hand/)
  })

  it('writes every hint — a response that exists only as speech is silence', () => {
    for (const ask of ['set', 'read'] as const)
      for (const got of [{ h: 1, m: 0 }, { h: 9, m: 30 }])
        expect(hintFor({ ask, m: 30 }, got).length).toBeGreaterThan(12)
  })
})

// ─── the round generator ──────────────────────────────────────────────────────────────
describe('the round', () => {
  it('walks the day STRAIGHT — never modulo, or the run wraps back to breakfast', () => {
    for (let r = 0; r < DAY.length; r++) expect(makeTimeRound(2, r).slot).toBe(r)
    // Past the end it holds on the last slot rather than starting the day again.
    expect(makeTimeRound(2, DAY.length + 3).slot).toBe(DAY.length - 1)
    expect(daySlot(DAY.length + 3)).toBe(DAY[DAY.length - 1])
  })

  it('takes its hour from the SCENARIO and its minutes from the TIER', () => {
    for (const d of [1, 2, 3] as const) {
      for (let r = 0; r < DAY.length; r++) {
        for (let i = 0; i < 40; i++) {
          const round = makeTimeRound(d, r)
          expect(round.h, `slot ${r}`).toBe(DAY[r].hour)
          expect(minsFor(d), `d${d}`).toContain(round.m)
        }
      }
    }
  })

  it('⚠️ is DELIBERATE while a reading is unmet and RANDOM once none is', () => {
    // Two regimes on purpose. While something has not been asked, the round is spent on it — that is
    // the whole coverage fix. Once everything has been met the generator must go back to sampling the
    // whole pool, or hardest-first locks it onto "to" for the rest of a long run and the variety the
    // chapter needs is destroyed by the fix for coverage.
    for (const d of [1, 2, 3] as const) {
      // nothing met yet → the hardest reading the tier offers, every time
      const deliberate = new Set<string>()
      for (let i = 0; i < 300; i++) deliberate.add(kindOf(makeTimeRound(d, 0).m))
      expect(deliberate.size, `d${d} should be deliberate`).toBe(1)

      // everything met → the full pool is reachable again
      const seen = new Set<number>()
      for (let i = 0; i < 3000; i++) seen.add(makeTimeRound(d, 0, READINGS).m)
      expect([...seen].sort((a, b) => a - b), `d${d} pool`).toEqual(minsFor(d))
    }
  })
})

// ─── the closed set, and covering it ──────────────────────────────────────────────────
/**
 * The shared engine's real rules, replicated here ONLY to simulate a run
 * (`core/adaptive.ts`: promote on 3 correct in a row at ≥80%, master at the top tier on a streak of 6).
 * Everything the chapter itself decides — which minute, which reading — comes from the real functions.
 */
function simulate(answers: (round: number) => boolean, coverageOn = true) {
  let d: 1 | 2 | 3 = 1, streak = 0, wrongStreak = 0, correct = 0, total = 0
  const asked: string[] = []
  const log: { round: number; d: number; m: number; kind: string }[] = []
  for (let r = 0; r < 10; r++) {
    const m = pickMinute(d, (coverageOn ? asked : []) as never)
    const kind = kindOf(m)
    if (!asked.includes(kind)) asked.push(kind)
    log.push({ round: r + 1, d, m, kind })
    const ok = answers(r); total++
    if (ok) { correct++; streak++; wrongStreak = 0 } else { streak = 0; wrongStreak++ }
    const acc = correct / total
    if (streak >= 3 && acc >= 0.8 && d < 3) d = (d + 1) as 1 | 2 | 3
    else if ((wrongStreak >= 2 || (total >= 4 && acc < 0.4)) && d > 1) d = (d - 1) as 1 | 2 | 3
    const covered = !coverageOn || READINGS.every(k => asked.includes(k))
    if (d === 3 && streak >= 6 && covered) return { log, endedAt: r + 1, by: 'mastery', asked }
  }
  return { log, endedAt: 10, by: 'rounds', asked }
}

describe('the four readings, and covering them', () => {
  it('names every minute on the ring as one of the four', () => {
    for (const m of RING) expect(READINGS, `m=${m}`).toContain(kindOf(m))
    expect(kindOf(0)).toBe('oclock')
    expect(kindOf(15)).toBe('past')
    expect(kindOf(30)).toBe('half')
    expect(kindOf(45)).toBe('to')
  })

  it('declares exactly the set the top tier can produce — no member that never appears', () => {
    expect(new Set(minsFor(3).map(kindOf))).toEqual(new Set(READINGS))
  })

  it('only ever picks a minute the tier allows', () => {
    for (const d of [1, 2, 3] as const)
      for (let i = 0; i < 400; i++) expect(minsFor(d)).toContain(pickMinute(d, []))
  })

  it('prefers a reading the child has NOT been asked yet', () => {
    // at L3 with o'clock, past and half already met, the only unmet reading is "to"
    for (let i = 0; i < 200; i++) {
      expect(kindOf(pickMinute(3, ['oclock', 'past', 'half']))).toBe('to')
      expect(kindOf(pickMinute(3, ['oclock', 'to', 'half']))).toBe('past')
    }
  })

  it('still varies the VALUE inside a reading, so makeDistinct cannot starve', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 600; i++) seen.add(pickMinute(3, ['oclock', 'past', 'half']))
    expect(seen.size).toBeGreaterThan(1)          // several "to" values, not one
    expect([...seen].every(m => kindOf(m) === 'to')).toBe(true)
  })

  it('⚠️ a strong run is asked ALL FOUR readings before mastery ends it', () => {
    // The whole point. Measured before this: a perfect run ended on round 6 having met three of the
    // four, and with a uniform draw it missed the "to" side about a third of the time.
    const run = simulate(() => true, true)
    expect(run.by).toBe('mastery')
    for (const k of READINGS) expect(run.asked, `never asked ${k} — ended round ${run.endedAt}`).toContain(k)
  })

  it('⚠️ and the coverage gate is what does it — without it a reading is missed', () => {
    // Guards against someone concluding the generator alone is enough and dropping `coverage`.
    const bare = simulate(() => true, false)
    expect(READINGS.every(k => bare.asked.includes(k))).toBe(false)
  })

  it('costs a strong child no extra rounds', () => {
    // The gate withholds the exit, but the generator uses the same bookkeeping to fill the gap first,
    // so the set is covered by the time mastery fires rather than after it.
    expect(simulate(() => true, true).endedAt).toBe(simulate(() => true, false).endedAt)
  })

  it('⚠️ is actually DECLARED by the chapter, not just simulated here', () => {
    // `simulate` above re-implements the engine, so on its own it cannot see the real wiring go away —
    // the craft doc's "a gate that re-implements a rule cannot see the rule being removed". These two
    // checks close that: the chapter must declare the set, and SkillBeat must guard the exit with it.
    const beat = makeTimeBeat()
    expect(beat.coverage, 'the chapter no longer declares a closed set').toBeTruthy()
    expect([...beat.coverage!.all].sort()).toEqual([...READINGS].sort())
    for (const m of RING) {
      expect(beat.coverage!.of({ slot: 0, h: 3, m, ask: 'read', d: 3 })).toBe(kindOf(m))
    }
  })

  it('⚠️ and SkillBeat still guards the exit AND feeds the asked list back', () => {
    // Anchored on EXPRESSIONS only real code has, never on the prose explaining them — a source check
    // that matches its own comment is a gate reporting the file it was written for.
    const src = readFileSync(join(process.cwd(), 'src/features/chapters/story/StoryWorld.tsx'), 'utf8')
    expect(src, 'the mastery exit is no longer coverage-guarded').toContain('if (res.mastered && covered)')
    expect(src).toContain('beat.coverage.all.every')
    // ⚠️ AND THIS ONE IS THE SUBTLE HALF. Drop the third argument and `asked` defaults to empty on
    // every round, so the generator picks the hardest-from-nothing every time: at L3 that is "to"
    // twice, `past` is never asked, the coverage gate then withholds the exit for ever and the child
    // plays all ten rounds STILL never meeting it. The original bug, relocated and made worse.
    expect(src, 'the asked list is no longer fed into make()')
      .toContain('beat.make(adaRef.current.difficulty, roundIdx, asked.current)')
  })

  /**
   * ⚠️ THIS CHAPTER OWNS ITS OWN MISS FEEDBACK, AND SAYING SO IS LOAD-BEARING. SkillBeat's shared cue
   * is a solid pill pinned dead centre of the viewport — which in every other 3–11 chapter lands on a
   * play surface that is being replaced anyway, and here lands **on the clock face** while reading
   * *"Let's look together"*: it covers the one thing it is telling the child to look at. Worse, this
   * chapter retries in place and only reports a round once it has been SOLVED, so the pill and the
   * spoken encouragement arrive over its own *"That's right — half past six!"* and contradict it.
   *
   * `hintFor` is what replaces them, and it is strictly better: it names WHICH hand is wrong.
   */
  it('⚠️ opts out of the shared centred cue, and still writes its own miss line', () => {
    expect(makeTimeBeat().ownsFeedback, 'the generic pill is back over the clock face').toBe(true)
    const src = readFileSync(join(process.cwd(), 'src/features/chapters/story/StoryWorld.tsx'), 'utf8')
    // Both halves have to be gated, or the words are suppressed and the pill still covers the clock
    // (or the reverse — a silent pill). Anchored on expressions, never on the prose above them.
    expect(src, 'the centred wrong pill is no longer opt-out-able')
      .toContain("feedback === 'wrong' && !beat.ownsFeedback")
    expect(src, 'the generic spoken encouragement is no longer opt-out-able')
      .toContain('if (!correct && !beat.ownsFeedback)')
    // And the chapter still SAYS something on a miss — silence is a tap that appears to do nothing,
    // and speech alone is silence on the many devices with no usable voice, so it is written too.
    const tt = readFileSync(join(process.cwd(), 'src/features/chapters/story/TickTock.tsx'), 'utf8')
    expect(tt, 'nothing writes the hint any more').toMatch(/setHint\(t\);\s*speak\(t\)/)
  })

  it('leaves a struggling child completely alone', () => {
    // They never reach the top tier, so they could never have finished early anyway.
    const weak = simulate(r => r % 3 === 0, true)
    expect(weak.by).toBe('rounds')
    expect(weak.endedAt).toBe(10)
    expect(weak.log.every(x => x.d === 1)).toBe(true)
  })
})

// ─── Milo's day ───────────────────────────────────────────────────────────────────────
describe("Milo's day", () => {
  it('covers the ten scored rounds', () => {
    expect(DAY.length).toBe(10)
  })

  it('never shows the same scene twice, let alone twice in a row', () => {
    expect(new Set(DAY.map(s => s.scene)).size).toBe(DAY.length)
    for (let i = 1; i < DAY.length; i++) expect(DAY[i].scene).not.toBe(DAY[i - 1].scene)
  })

  it('ships every backdrop it names', () => {
    for (const s of DAY) {
      const p = join(process.cwd(), 'public', 'assets', 'backgrounds', s.scene)
      expect(existsSync(p), `missing backdrop ${s.scene}`).toBe(true)
    }
  })

  it('⚠️ never asks the same question twice, even at L1 where every minute is zero', () => {
    // The hour is fixed by the SLOT, so `sig` cannot rescue a collision — a regenerate returns the
    // identical round. This caught a real one: breakfast and bedtime were both on 8 and both on a set
    // round, so round 10 was round 2 again.
    for (const d of [1, 2, 3] as const) {
      const sigs = Array.from({ length: DAY.length }, (_, r) => {
        const x = makeTimeRound(d, r)
        return `${x.ask}:${x.h}:${x.m}`
      })
      // At L1 there is only one minute value, so this is the tightest case.
      if (d === 1) expect(new Set(sigs).size, sigs.join(' ')).toBe(sigs.length)
      // Whatever the tier, two slots sharing an hour must at least differ in gesture.
      for (let i = 0; i < DAY.length; i++) for (let j = i + 1; j < DAY.length; j++) {
        if (DAY[i].hour === DAY[j].hour) expect(askKindFor(i), `slots ${i},${j}`).not.toBe(askKindFor(j))
      }
    }
  })

  it('stays on a twelve-hour clock', () => {
    for (const s of DAY) {
      expect(s.hour).toBeGreaterThanOrEqual(1)
      expect(s.hour).toBeLessThanOrEqual(12)
    }
  })

  it('gives every slot something to do, in words a six-year-old uses', () => {
    for (const s of DAY) {
      expect(s.what.length).toBeGreaterThan(3)
      expect(hasDigit(s.what), s.what).toBe(false)
    }
  })

  it('runs light from dawn to night, and only tints when it should', () => {
    expect(DAY[0].light).toBe('dawn')
    expect(DAY[DAY.length - 1].light).toBe('night')
    expect(TINT.day.wash).toBe('none')
    for (const k of ['dawn', 'evening', 'night'] as const) expect(TINT[k].wash).toContain('gradient')
  })

  it('⚠️ never washes the picture out so far it stops being legible', () => {
    // A night tint is a light change, not a grey film over the chapter. The strongest alpha in the
    // night wash is what decides whether the backdrop is still a place.
    const alphas = [...TINT.night.wash.matchAll(/,\s*([\d.]+)\)/g)].map(m => Number(m[1]))
    expect(alphas.length).toBeGreaterThan(0)
    expect(Math.max(...alphas)).toBeLessThan(0.75)
  })

  it('moves the sun across the sky and hangs a moon at the end', () => {
    const first = skyFor(0), noon = skyFor(5), last = skyFor(DAY.length - 1)
    expect(first.body).toBe('sun')
    expect(last.body).toBe('moon')
    expect(noon.leftPct).toBeGreaterThan(first.leftPct)
    expect(last.leftPct).toBeGreaterThan(noon.leftPct)
    // an arc — highest (smallest top) in the middle of the day
    expect(noon.topPct).toBeLessThan(first.topPct)
    expect(noon.topPct).toBeLessThan(last.topPct)
  })

  it('keeps the sun on screen at every slot', () => {
    for (let i = 0; i < DAY.length; i++) {
      const s = skyFor(i)
      expect(s.leftPct).toBeGreaterThan(4)
      expect(s.leftPct).toBeLessThan(96)
      expect(s.topPct).toBeGreaterThan(2)
    }
  })
})

// ─── Milo himself ─────────────────────────────────────────────────────────────────────
describe('Milo', () => {
  it('⚠️ has a REGISTERED drawn cycle — he is the only thing here that moves', () => {
    // Without one, SheetCell silently falls back to a still, and a still that travels is a sticker
    // being dragged across the picture. Invisible in a screenshot.
    expect(SHEETS[MILO], `no sheet registered for ${MILO}`).toBeTruthy()
    expect(SHEETS[MILO].frames).toBeGreaterThan(1)
    expect(SHEETS[MILO].fps).toBeGreaterThan(0)
  })

  it('takes his width from that sheet rather than a hand-copied number', () => {
    expect(MILO_ASPECT).toBe(SHEETS[MILO].cellAspect)
  })
})

// ─── layout ───────────────────────────────────────────────────────────────────────────
const SIZES: [number, number][] = [
  [640, 320], [667, 375], [740, 360], [812, 375], [1024, 400],
  [1024, 620], [1280, 720], [1512, 860], [820, 1180], [1920, 1080],
]

describe('the layout', () => {
  it('never lets two things a child must read sit on top of each other', () => {
    for (const [vw, vh] of SIZES) {
      const l = layoutFor(vw, vh)
      const clockL = Math.round(vw * l.clockCentrePct / 100 - l.clockPx / 2)
      const clockR = clockL + l.clockPx
      const clockBottom = l.clockTop + l.clockPx
      const barTop = vh - l.barBottom - l.barH
      const bubbleBottom = l.bubbleTop + l.bubbleH
      const at = `${vw}x${vh}`

      expect(clockL, `${at}: clock over Milo`).toBeGreaterThanOrEqual(l.miloRight)
      expect(clockBottom, `${at}: clock over the bar`).toBeLessThanOrEqual(barTop)
      expect(l.clockTop, `${at}: clock over the bubble`).toBeGreaterThanOrEqual(bubbleBottom)
      expect(l.bubbleTop, `${at}: bubble in the chrome`).toBeGreaterThanOrEqual(l.top)
      expect(clockR, `${at}: clock off the right`).toBeLessThanOrEqual(vw)
      expect(l.barLeft + l.barW, `${at}: bar off the right`).toBeLessThanOrEqual(vw)
      expect(l.bubbleLeft + l.bubbleW, `${at}: bubble off the right`).toBeLessThanOrEqual(vw)
    }
  })

  it('⚠️ measures the control bar off MILO rather than picking a second percentage', () => {
    for (const [vw, vh] of SIZES) {
      const l = layoutFor(vw, vh)
      expect(l.barLeft, `${vw}x${vh}`).toBeGreaterThan(l.miloRight)
    }
  })

  it('keeps the clock big enough to read a hand position at every size', () => {
    for (const [vw, vh] of SIZES) {
      expect(layoutFor(vw, vh).clockPx, `${vw}x${vh}`).toBeGreaterThanOrEqual(120)
    }
  })

  it('⚠️ yields the WORLD to the tap targets, never the other way round', () => {
    // The bar holds the things a finger has to hit, so it keeps its height and the clock takes what
    // is left. A 28px stepper on a short frame is the fault this ordering exists to prevent.
    for (const [vw, vh] of SIZES) {
      const l = layoutFor(vw, vh)
      expect(l.barH, `${vw}x${vh}`).toBeGreaterThanOrEqual(l.short ? 60 : 78)
      // room inside the bar for a 40px arrow plus its border and shadow
      expect(l.barH).toBeGreaterThanOrEqual(l.short ? 46 + 8 : 46 + 8)
    }
  })

  it('fits two dials and a commit across the bar at the narrowest frame', () => {
    // Set round: two bare dials (arrow + label + arrow) and the button.
    for (const [vw, vh] of SIZES) {
      const l = layoutFor(vw, vh)
      const arrow = l.short ? 40 : 46
      const gap = l.short ? 3 : 5
      const dial = (labelW: number) => arrow * 2 + labelW + gap * 2
      const setW = dial(l.short ? 46 : 58) + dial(l.short ? 62 : 76) + 120 + (l.short ? 8 : 14) * 2
      const readW = dial(l.short ? 96 : 124) + dial(l.short ? 28 : 34) + 120 + (l.short ? 8 : 14) * 2
      expect(setW, `${vw}x${vh} set bar overflows`).toBeLessThanOrEqual(l.barW)
      expect(readW, `${vw}x${vh} read bar overflows`).toBeLessThanOrEqual(l.barW)
    }
  })

  it('gives the bubble room for a real sentence', () => {
    for (const [vw, vh] of SIZES) {
      expect(layoutFor(vw, vh).bubbleW, `${vw}x${vh}`).toBeGreaterThanOrEqual(200)
    }
  })

  it('points the tail at Milo, which is what makes the words his', () => {
    for (const [vw, vh] of SIZES) {
      const l = layoutFor(vw, vh)
      expect(l.tailPct).toBeGreaterThan(0)
      expect(l.tailPct).toBeLessThanOrEqual(40)
    }
  })

  it('shrinks its chrome on a short frame instead of the world', () => {
    expect(chromeTop(true)).toBeLessThan(chromeTop(false))
    expect(layoutFor(640, 320).short).toBe(true)
    expect(layoutFor(1280, 720).short).toBe(false)
  })

  it('⚠️ budgets the top strip for the button that actually sits in it', () => {
    // Measured on screen at 640×320: the Menu button ran 12→53 while the band below it started at 38,
    // so Milo's bubble opened 13px inside the button. The band is derived from the button's own
    // metrics now, and this is the check that keeps the two from drifting apart again.
    for (const short of [true, false]) {
      const b = menuBtn(short)
      const btnBottom = CHROME_PAD + Math.ceil(b.font * 1.25) + b.padY * 2 + 6
      expect(chromeTop(short), `short=${short}`).toBeGreaterThan(btnBottom)
    }
    // and the bubble really does start below it
    for (const [vw, vh] of SIZES) {
      const l = layoutFor(vw, vh)
      const b = menuBtn(l.short)
      const btnBottom = CHROME_PAD + Math.ceil(b.font * 1.25) + b.padY * 2 + 6
      expect(l.bubbleTop, `${vw}x${vh} bubble under the Menu button`).toBeGreaterThan(btnBottom)
    }
  })
})
