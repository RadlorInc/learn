/**
 * The clock, as arithmetic — everything about TickTock that is not React.
 *
 * It lives here for the reason market.ts does: the scene and its gate must not each carry their own
 * copy of the rules. The gate drives THESE functions, so a check can never agree with a second copy
 * of the constants while the screen falls apart.
 *
 * ⚠️ THE PAYLOAD OF THIS CHAPTER IS THAT A CLOCK FACE CARRIES **TWO SCALES ON ONE SET OF NUMBERS.**
 * The 6 means six hours and also thirty minutes. That is the actual reason a six-year-old cannot read
 * a clock, and tapping "half past six" out of four pills never touches it — which is why the verb is
 * SET IT (docs/story-6-8-rethink.md §8) and why `ringMinuteFor` is a named, tested function rather
 * than an inline `n * 5`.
 *
 * ⚠️ AND THE SECOND HARD BIT IS "TO": at quarter to eight the words say EIGHT and the hour hand is
 * still sitting on SEVEN. `wordsFor` and `setFor` disagree about the hour on purpose — `setFor` is
 * what the child must put on the face, `wordsFor` is what Milo says. The lesson teaches this
 * (beat 4) and the gate pins the two together.
 */
import { SHEETS } from './canvas/sheets'

// ─── words ────────────────────────────────────────────────────────────────────────────
/** Minute counts in words. Only multiples of five exist in this chapter. */
const MIN_WORDS: Record<number, string> = {
  5: 'five', 10: 'ten', 15: 'quarter', 20: 'twenty', 25: 'twenty-five', 30: 'half',
}

/**
 * ⚠️ THE HOUR IN THE WORDS IS NOT THE HOUR ON THE FACE, past the half hour. A clock is read
 * BACKWARDS from the next hour once the long hand passes six — "quarter to eight" while the little
 * hand is still sitting on SEVEN. That single fact is most of what makes "to" times hard, and it is
 * why a read round and a set round grade against different hours for the same clock.
 */
export const spokenHourFor = (h: number, m: number) => (m <= 30 ? h : (h % 12) + 1)

/**
 * The ONE renderer for a time in words — so a read round's built answer and Milo's spoken ask can
 * never be two implementations that disagree about a word. `wordsFor` is this function with the
 * spoken hour already worked out; a read round supplies the hour the CHILD chose instead, which is
 * exactly how a wrong "quarter to 7" gets caught.
 */
export function phraseFor(m: number, spokenHour: number): string {
  if (m === 0) return `${spokenHour} o'clock`
  if (m === 30) return `half past ${spokenHour}`
  if (m <= 30) return `${MIN_WORDS[m]} past ${spokenHour}`
  return `${MIN_WORDS[60 - m]} to ${spokenHour}`
}

/**
 * What Milo SAYS, and what is written after a commit. Never shown while the child is setting the
 * hands — a readout that confirms the answer before commit is the teen month-dial fault.
 */
export const wordsFor = (h: number, m: number) => phraseFor(m, spokenHourFor(h, m))

/**
 * Just the MINUTE half of the phrase — "o'clock", "quarter past", "twenty-five to".
 *
 * It exists because a read round steps the two halves separately, and the first version of that dial
 * got its label by rendering the whole phrase and string-replacing the hour out of it. That works
 * until it doesn't: the moment a minute word contains the same digit as the hour, `replace` eats the
 * wrong one and the label silently corrupts. Derive the part, never carve it out of the whole.
 */
export function minutePhrase(m: number): string {
  if (m === 0) return "o'clock"
  if (m === 30) return 'half past'
  if (m <= 30) return `${MIN_WORDS[m]} past`
  return `${MIN_WORDS[60 - m]} to`
}

// ─── the two scales ───────────────────────────────────────────────────────────────────
/** Every position a hand can stop at: the twelve numerals, five minutes apart. */
export const RING: readonly number[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

/** The numeral 1–12 → the minutes it ALSO means. 12 → 0, 3 → 15, 6 → 30, 9 → 45. */
export const ringMinuteFor = (numeral: number) => (numeral % 12) * 5

/** The inverse: which numeral the long hand points at for a given minute count. 0 → 12. */
export const numeralForMinute = (m: number) => (m === 0 ? 12 : m / 5)

/** Degrees clockwise from twelve. The hour hand CREEPS — that is why it sits between numbers. */
export const hourAngle = (h: number, m: number) => (h % 12) * 30 + m * 0.5
export const minuteAngle = (m: number) => m * 6

// ─── the ladder ───────────────────────────────────────────────────────────────────────
/**
 * One new idea per tier, each a superset of the last:
 *   L1 o'clock  →  L2 + quarter past and half past  →  L3 + every five minutes, and the "to" side
 *
 * ⚠️ L1 IS DELIBERATELY ONE POSITION. The gentlest tier has to actually be gentle — chapter 2 once
 * opened a three-year-old on 7·8·9 because its easiest tier controlled only HOW MANY numbers there
 * were and not how hard they were.
 *
 * ⚠️ AND "PAST" COMES BEFORE "TO", WHICH IS WHY L2 STOPS AT THE HALF HOUR. Everything up to :30 has
 * the spoken hour and the face hour agreeing; the moment "quarter to eight" appears the child has to
 * say EIGHT while putting the little hand on SEVEN, and that is the single hardest thing in reading a
 * clock. Putting it at L2 next to quarter past — which is what a naive "the four quarters" tier does
 * — hands a child two unrelated difficulties in one step.
 */
export function minsFor(d: 1 | 2 | 3): number[] {
  if (d === 1) return [0]
  if (d === 2) return [0, 15, 30]
  return [...RING]
}

/** Which gesture a round asks for. Alternating, so consecutive rounds differ in gesture as well as
 *  in scene, and both directions are practised the whole way down the run rather than in two blocks. */
export type Ask = 'set' | 'read'
export const askKindFor = (round: number): Ask => (round % 2 === 0 ? 'read' : 'set')

// ─── Milo's day ───────────────────────────────────────────────────────────────────────
/**
 * Ten scenarios, morning to night. The SCENARIO fixes the hour and the TIER picks the minutes, so
 * the story and the difficulty are independent — a park at three o'clock on L1 and at twenty-five
 * past three on L3, same picture.
 *
 * This replaces the old three-world picker. A picker asks a child to choose before they know what
 * they are choosing and then spends all ten rounds in one backdrop; morning, afternoon and night are
 * now the ARC instead of a menu, which also gives the chapter the cumulative change across the run
 * it did not have.
 */
export type Light = 'dawn' | 'day' | 'evening' | 'night'
export interface Slot {
  hour: number
  what: string          // what Milo has to do — the reason to read the clock
  scene: string         // backdrop file
  light: Light
  emoji: string
}
export const DAY: Slot[] = [
  { hour: 7,  what: 'wake up',          scene: 'door_houses.jpeg',   light: 'dawn',    emoji: '🌅' },
  { hour: 8,  what: 'have breakfast',   scene: 'kitchen_fruit.jpeg', light: 'day',     emoji: '🥣' },
  { hour: 9,  what: 'catch the bus',    scene: 'bus_stop.png',       light: 'day',     emoji: '🚌' },
  { hour: 10, what: 'get to school',    scene: 'locker_room.png',    light: 'day',     emoji: '🎒' },
  { hour: 11, what: 'go out to play',   scene: 'town_park.jpeg',     light: 'day',     emoji: '⚽' },
  { hour: 12, what: 'eat lunch',        scene: 'kitchen_bakery.jpeg',light: 'day',     emoji: '🍱' },
  { hour: 1,  what: 'do some painting', scene: 'colour_toys.png',    light: 'day',     emoji: '🎨' },
  { hour: 3,  what: 'go to the park',   scene: 'garden_park.png',    light: 'day',     emoji: '🌳' },
  { hour: 5,  what: 'have dinner',      scene: 'kitchen_oven.jpeg',  light: 'evening', emoji: '🍲' },
  { hour: 6,  what: 'look at the moon', scene: 'garden_meadow.png',  light: 'night',   emoji: '🌙' },
]
// ⚠️ THE HOURS ARE ALL DIFFERENT ON PURPOSE, and the gate drives the real generator to prove it. A
// real day reuses hours — breakfast at eight and bed at eight — but the round's minutes come from the
// tier, and at L1 every minute is zero, so two slots sharing an hour and a gesture are the SAME
// QUESTION asked twice. That is what `sig` exists to prevent and it cannot: the hour is fixed by the
// slot, so a regenerate returns the identical round. Dinner at five and the moon at six is a winter
// evening, and it costs nothing.

/**
 * A wash over the backdrop, because the library has no night scenes and the honest fix for one
 * chapter is not new art. A dusk or night tint over a day scene is a real technique; what makes it
 * read as light rather than as a grey film is that it is WARM at the ends of the day and COOL in the
 * middle of the night, and that it never goes so dark the picture stops being legible.
 */
export const TINT: Record<Light, { wash: string; alpha: number }> = {
  dawn:    { wash: 'linear-gradient(180deg, rgba(255,176,92,0.42), rgba(255,138,84,0.20) 55%, rgba(120,92,150,0.16))', alpha: 1 },
  day:     { wash: 'none', alpha: 0 },
  evening: { wash: 'linear-gradient(180deg, rgba(255,150,70,0.34), rgba(196,96,96,0.26) 60%, rgba(74,62,120,0.30))',   alpha: 1 },
  night:   { wash: 'linear-gradient(180deg, rgba(20,30,86,0.66), rgba(28,34,92,0.58) 55%, rgba(14,20,58,0.66))',       alpha: 1 },
}

/** Where the sun or the moon sits, so the sky itself carries the time of day across the run. */
export function skyFor(slot: number): { body: 'sun' | 'moon'; leftPct: number; topPct: number } {
  const n = Math.max(1, DAY.length - 1)
  const p = Math.min(1, Math.max(0, slot / n))
  return {
    body: DAY[Math.min(slot, DAY.length - 1)].light === 'night' ? 'moon' : 'sun',
    leftPct: 10 + p * 78,
    // an arc: low at both ends of the day, high in the middle
    topPct: 26 - Math.sin(p * Math.PI) * 14,
  }
}

/** The day slot a scored round lands on. Indexed STRAIGHT — never modulo, or the run wraps back
 *  onto the scene it opened with and the day stops being a day. */
export const daySlot = (round: number) => DAY[Math.min(round, DAY.length - 1)]

/**
 * What Milo asks — ONE renderer, because SkillBeat speaks it and the bubble writes it, and those two
 * drifting apart is how a chapter ends up narrating one thing while the screen says another.
 *
 * A set round names the time and asks for the hands; a read round names only the errand, so the clock
 * is the only place the answer can come from.
 */
export function askTextFor(r: { slot: number; h: number; m: number; ask: Ask }): string {
  const what = DAY[Math.min(r.slot, DAY.length - 1)].what
  return r.ask === 'set'
    ? `Milo has to ${what} at ${wordsFor(r.h, r.m)}. Move the hands!`
    : `Milo is waiting to ${what}. What time is it now?`
}

/**
 * Which hand — or which word — is wrong, so a miss teaches the specific confusion instead of saying
 * "not quite". These four sentences ARE the chapter's two hard facts, split by direction, and the one
 * for a wrong read hour is the "to" rule stated out loud at the moment it just cost the child.
 *
 * Everything returned here is WRITTEN as well as spoken. A response that exists only as speech is
 * silence on the many devices with no usable voice, which reads as a tap that did nothing at all.
 */
export function hintFor(r: { ask: Ask; m: number }, got: { h: number; m: number }): string {
  if (r.ask === 'set') {
    if (got.m !== r.m) return 'The long hand is not there yet — count round the clock in fives.'
    return 'Look at the short hand — that one shows the hour.'
  }
  if (got.m !== r.m) return 'Look at the long hand again. Which number is it pointing at?'
  // ⚠️ THE "TO" ADVICE ONLY APPLIES TO A "TO" TIME. Given for any wrong read hour it fired on
  // "7 o'clock" as well — telling a child to count to the next hour when there is no next hour in the
  // answer, which is worse than saying nothing: it teaches a rule that does not apply here and says
  // nothing about what they actually got wrong. Caught by playing a full ten-round run.
  if (r.m > 30) return 'Careful — after half past we count to the NEXT hour.'
  return 'Look at the short hand — which hour has it just gone past?'
}

// ─── layout ───────────────────────────────────────────────────────────────────────────
/** Milo's walking sprite. He is the only thing in this chapter that travels. */
export const MILO = '/assets/characters/milo_side.png'
/**
 * DERIVED from the registered sheet rather than typed here. A hand-copied aspect is a second source
 * of truth that goes wrong silently the day the strip is re-cut — the sprite just draws stretched,
 * which nothing checks. The fallback only ever fires if the sheet is missing, and the gate asserts
 * it is not.
 */
export const MILO_ASPECT = SHEETS[MILO]?.cellAspect ?? 0.586
/** How far the Menu button and the round banner sit from the top edge. */
export const CHROME_PAD = 12
/**
 * The Menu button's own metrics, exported so the band below it is DERIVED from them.
 * ⚠️ It was a picked number (38 on a short frame) and the button measured 41px tall from a 12px
 * offset, so Milo's bubble started 13px INSIDE the button — measured on screen at 640×320. Two
 * independent guesses about one gap is the same fault as StoryTime's answer box landing on its own
 * button row. On a short frame the button also shrinks, because height comes out of the CHROME first.
 */
export const menuBtn = (short: boolean) => ({ font: short ? 11 : 13, padY: short ? 5 : 7, padX: short ? 11 : 14 })
/** The tallest thing in the top strip: the round banner, which is a size up from the button. */
const bannerH = (short: boolean) => Math.ceil((short ? 12 : 17) * 1.25) + (short ? 4 : 8) * 2 + 6
export const chromeTop = (short: boolean) => {
  const b = menuBtn(short)
  const btnH = Math.ceil(b.font * 1.25) + b.padY * 2 + 6   // 3px border, top and bottom
  return CHROME_PAD + Math.max(btnH, bannerH(short)) + 4    // +4 so nothing merely touches
}

/**
 * Every band on screen, in one place, derived rather than picked — because every founder-visible
 * layout fault in this repo has been a hand-tuned percentage that happened to hold at one size.
 * The gate drives THIS function, so it cannot check a second copy of the numbers.
 *
 * ⚠️ THE CONTROL BAR IS MEASURED OFF MILO, NOT GUESSED. He stands bottom-left and the bar starts to
 * the right of him; two independent percentages of the width is exactly how StoryTime once put its
 * answer box 29px inside its own button row.
 *
 * ⚠️ AND THE CLOCK YIELDS TO THE BAR, NOT THE OTHER WAY ROUND. The bar holds the tap targets, so it
 * keeps its height and the world takes what is left.
 *
 * ⚠️ THE BUBBLE IS A BAND, NOT A FLOATING PANEL. Anchored freely at Milo's mouth it ran straight over
 * the clock on a 640-wide frame — the two things a child has to read at once, on top of each other.
 * Stacked (chrome · bubble · clock · bar) an overlap is not expressible, and the tail keeps the words
 * visibly HIS, which is the whole reason the question moved to his mouth in the first place.
 */
export function layoutFor(vw: number, vh: number) {
  const short = vh < 470
  const top = chromeTop(short)

  const miloH = Math.round(Math.min(short ? vh * 0.30 : vh * 0.26, 200))
  const miloW = Math.round(miloH * MILO_ASPECT)
  const miloLeft = Math.round(vw * 0.05)
  const miloRight = miloLeft + miloW

  const barH = short ? 60 : 78            // two dials + the commit button, at a real tap size
  const barBottom = short ? 6 : 14
  const barLeft = miloRight + (short ? 8 : 18)
  const barW = Math.max(232, vw - barLeft - (short ? 10 : 22))

  const bubbleTop = top + (short ? 2 : 6)
  const bubbleH = short ? 46 : 60
  const bubbleLeft = miloLeft
  // On a roomy frame the full width reads as a BANNER pinned to the top rather than as something Milo
  // said; capped, it stays a speech bubble. A short frame needs every pixel, so it is not capped there.
  const bubbleW = Math.max(200, Math.min(vw - bubbleLeft - (short ? 12 : 26), short ? Infinity : 840))
  /** Where the tail points — Milo's mouth, as a share of the bubble's own width. */
  const tailPct = Math.min(40, Math.round((miloW * 0.55 / bubbleW) * 100))

  const clockTop = bubbleTop + bubbleH + (short ? 4 : 10)
  const clockBand = vh - clockTop - barH - barBottom - (short ? 6 : 16)
  // Square, so height is the binding side; also capped so it never fills a wide desktop edge to edge.
  const clockPx = Math.max(120, Math.round(Math.min(clockBand, vw * 0.40, 340)))

  return {
    short, top, miloH, miloW, miloLeft, miloRight,
    barH, barBottom, barLeft, barW,
    bubbleTop, bubbleH, bubbleLeft, bubbleW, tailPct,
    clockTop, clockBand, clockPx,
    /** Where the clock's centre sits — in the room left of the bar and right of Milo. */
    clockCentrePct: Math.round(((barLeft + barW / 2) / vw) * 100),
  }
}
