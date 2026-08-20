/**
 * Gate for the 9–11 band living on GameShell (founder's call, 2026-08-14: "treat the 9-11 band like
 * the 12-18 ones and put it in the same format — its speciality is AR").
 *
 * Drives the shell's OWN exported band predicates rather than re-implementing them, and source-checks
 * the parts that are JSX — a gate that carries its own copy of a rule cannot see the rule going away.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { roundsFor, resumesTier, DEFAULT_BAND } from '@/features/chapters/teen/games/parts/GameShell'
import { BAND_FRAMING, type AgeBand } from '@/features/chapters/teen/types'
import { PIP, PAD, PAD_GAP, KID_P } from '@/features/chapters/teen/games/parts/kidKit'

const SHELL = readFileSync('src/features/chapters/teen/games/parts/GameShell.tsx', 'utf8')
const CSS = readFileSync('src/app/globals.css', 'utf8')
const BANDS: AgeBand[] = ['9-11', '12-14', '15-16', '17-18']

describe('the band on the shell', () => {
  it('leaves the teen bands exactly as they were', () => {
    // 36 live chapters run on this shell; the whole point of a band PROP is that adding one is
    // additive. If either of these moves, a shipped band's loop changed under it.
    expect(DEFAULT_BAND).toBe('12-14')
    for (const b of ['12-14', '15-16', '17-18'] as AgeBand[]) {
      expect(roundsFor(b), `${b} round count`).toBe(8)
      expect(resumesTier(b), `${b} resume`).toBe(true)
    }
  })

  it('9–11 plays TEN rounds, the length its own chapters have always been', () => {
    expect(roundsFor('9-11')).toBe(10)
  })

  it('⚠️ EVERY band resumes at the tier the child left off on', () => {
    // Reversed 2026-08-20 (founder's call). This used to read "9–11 NEVER resumes", on the argument
    // that a nine-year-old returning a week later must not meet their old top tier on question 1.
    // That is now answered from the other side: the warm-up offer below, plus the engine demoting on
    // two misses in a row, plus the chapter's own demo and unscored guided round.
    for (const b of BANDS) expect(resumesTier(b), b).toBe(true)
    expect(SHELL).toMatch(/resumesTier\(BAND\) \? getChapterLevel/)
  })

  it('a resumed tier above easy offers the warm-up, which is what makes resuming safe', () => {
    expect(SHELL).toMatch(/const canWarmUp = startDiff > 1/)
    expect(SHELL).toMatch(/warmup && nextIdx < WARMUP_COUNT \? warmupDiff/)
  })

  it('every per-band copy bank covers the new band', () => {
    // adding a band to AgeBand makes every Record<AgeBand,…> a compile error until it is filled;
    // this asserts the ones that are DATA rather than switches actually say something.
    for (const b of BANDS) {
      expect(BAND_FRAMING[b], b).toBeTruthy()
      expect(BAND_FRAMING[b].unit.length, b).toBeGreaterThan(2)
    }
    expect(BAND_FRAMING['9-11'].unit).not.toBe(BAND_FRAMING['12-14'].unit)
  })

  it('the band has its own scoped palette, and shares the kit tokens', () => {
    expect(CSS, 'a 9-11 token block').toMatch(/\[data-band="9-11"\]\s*\{/)
    // it must ALSO be in the shared selector, or it gets a palette and no fonts
    expect(CSS).toMatch(/\[data-band="9-11"\],\s*\[data-band="12-14"\]/)
  })
})

describe("the hand — the band's speciality", () => {
  it('is inert without a config, so no teen chapter grows a camera', () => {
    // ⚠️ Called UNCONDITIONALLY and merely inert — branching above a hook changes the hook count
    // and tears the chapter into the error boundary, which this repo has shipped once.
    expect(SHELL).toMatch(/const cam = useHandInput\(/)
    expect(SHELL, 'every use is gated on the config').toMatch(/const onCam = !!HAND && cam\.onCam/)
    for (const guard of ['HAND && onCam', 'handLive && (']) expect(SHELL).toContain(guard)
  })

  it('⚠️ offers BOTH doors, and the remembered pick chooses only which is BIG', () => {
    const start = SHELL.slice(SHELL.indexOf("{stage === 'start' &&"), SHELL.indexOf("{stage === 'intro' &&"))
    expect(start, 'the camera door').toMatch(/cam\.start\(\)/)
    expect(start, 'the taps door').toMatch(/cam\.useTaps\(\)/)
    expect(start, 'and the way back to the camera').toMatch(/cam\.useCamera\(\)/)
  })

  it("⚠️ readiness is a hand IN FRAME, never count > 0 — a fist is an answer", () => {
    // CoinTray's `0.6` is six dimes and a FIST; "seven hundredths" is a fist and seven pennies.
    // `count > 0` would make those two rounds unanswerable, and they ARE the chapter.
    expect(SHELL).toMatch(/HAND\.ready \? HAND\.ready\(cam\.read\) : cam\.read\.hands > 0/)
    expect(SHELL).not.toMatch(/ready:.*cam\.read\.count > 0/)
  })

  it('⚠️ the dwell key is the READING ALONE, never the slot', () => {
    // Putting the slot in the key re-arms the timer the instant the slot advances, so a hand still
    // showing 5 enters 5 twice and a two-place answer fills itself in. FitOut shipped `12` as `11`.
    const dwell = SHELL.slice(SHELL.indexOf('const dwell = useDwell('), SHELL.indexOf('const inOrder'))
    expect(dwell).toMatch(/key: `\$\{handNum\}`/)
    expect(dwell, 'no slot, no task and no index in the key').not.toMatch(/key: `[^`]*\$\{(slot|idx|task)/)
  })

  it('the ring reports the reading and never the verdict', () => {
    const ring = SHELL.slice(SHELL.indexOf('{handLive && ('), SHELL.indexOf("{/* The chapter's hand cue"))
    expect(ring, 'it shows what was read').toMatch(/handNum/)
    for (const leak of ['grade(', 'correct', 'right', 'ok ?'])
      expect(ring, `the ring must not hint the answer (${leak})`).not.toContain(leak)
  })
})

describe('coverage on the shell', () => {
  it('⚠️ withholds the mastery exit until every declared reading has been asked', () => {
    // A strong child is asked ~3 questions at L1, ONE at L2 and TWO at L3 and then the chapter ends,
    // so anything late in the pool is skipped as a REWARD for doing well. SkillBeat has carried this
    // for 3–11 for months; porting a chapter onto a shell without it would lose it silently.
    expect(SHELL).toMatch(/res\.mastered && covered\(\)/)
    expect(SHELL).toMatch(/all\.every\(k => asked\.current\.includes\(k\)\)/)
  })

  it('feeds the asked-list back to the generator, which is the other half', () => {
    // the bookkeeping the exit needs IS the input makeTask needs to spend a scarce round on
    // something unmet — that is why they are one field and not two
    // ⚠️ COUNTED, NOT MATCHED. There are TWO call sites — the first draw and the sig-dedupe retry —
    // so a `toMatch` passes with one of them reverted, and the retry silently re-rolls blind.
    // Wherever a rule has to hold in N places, assert N.
    expect(SHELL.match(/config\.makeTask\(d, asked\.current\)/g) ?? []).toHaveLength(2)
    expect(SHELL).toMatch(/makeTask: \(d: 1 \| 2 \| 3, asked\?: readonly string\[\]\) => T/)
  })

  it('a chapter that declares none behaves exactly as before', () => {
    expect(SHELL).toMatch(/!config\.coverage \|\|/)
    expect(SHELL).toMatch(/if \(config\.coverage\) asked\.current/)
  })
})

describe('the shared band kit', () => {
  it('⚠️ authors the manipulative BIG, because the shell only ever shrinks it', () => {
    // `FitSlot` runs at `max={1}` on a landscape frame; the old bespoke chapters scaled their boards
    // UP to 2.2x. A manipulative drawn at the old sizes therefore renders at them for ever and
    // floats in a third of the frame — caught by the founder on a screenshot of The Coin Tray.
    // The countable thing is the last thing that should pay for the layout.
    expect(PIP, 'a pip a child can count').toBeGreaterThanOrEqual(12)
    expect(PAD, 'a finger-sized key').toBeGreaterThanOrEqual(44)
  })

  it('⚠️ a ten-key row fits one line on the smallest frame the band supports', () => {
    // A hand-typed cap was 14px short of the enlarged keys and wrapped the last key onto a second
    // row at 1280 — measured, not eyeballed. The row derives its width from its own keys now.
    expect(10 * PAD + 9 * PAD_GAP, 'one row at 1280').toBeLessThanOrEqual(1280 * 0.96)
    expect(readFileSync('src/features/chapters/teen/games/parts/kidKit.tsx', 'utf8'))
      .toMatch(/maxWidth: `min\(96vw, \$\{choices\.length \* PAD/)
  })

  it('⚠️ the scratch-pad button is IN FLOW, so it cannot be drawn over an instrument', () => {
    // Pinned `position:fixed` bottom-right it covered The Coin Tray's keys 5, 6 and 7 at 640×320 —
    // shipped, and driven twice without anyone seeing it, because every tap still landed somewhere.
    // A 9–11 instrument is scaled by FitSlot and centred in the right-hand column, so the two meet.
    const PAD_SRC = readFileSync('src/features/chapters/teen/games/parts/ScribblePad.tsx', 'utf8')
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')   // its own prose explains the rule it forbids
    expect(PAD_SRC, 'nothing in the pad may be position:fixed').not.toMatch(/position: 'fixed'/)
    expect(PAD_SRC.match(/flex: '0 0 auto', width: '100%'/g) ?? [], 'both states in flow: closed button + open drawer').toHaveLength(2)
  })

  it('one palette for the whole band, so ten chapters cannot drift into ten violets', () => {
    expect(KID_P.gold).toBe('#A06BFF')
    expect(KID_P.nightBot).toBe('#0A1026')
  })
})
