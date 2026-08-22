/**
 * THE MINIBUS RUN (9–11 · `division`) — the maths, the words and every rule that can be wrong.
 *
 * The class is going on a trip. The children are on the pavement, the minibuses are waiting, and
 * every bus has the same number of seats. The child loads them.
 *
 * ⚠️⚠️ THE REMAINDER HAS SOMEWHERE PHYSICAL TO BE, AND THAT IS THE REASON FOR THIS WORLD. What will
 * not divide stays on the pavement, in front of you, as children — not as a number written after an
 * "r". That was the one lesson worth keeping from the deleted Supply Run, and chapter-craft records
 * it: *"a wrong action that is ALLOWED and visible rather than blocked, a remainder with somewhere
 * physical to be"*.
 *
 * ⚠️⚠️ AND THE WORLD'S OWN RULE MUST NOT CONTRADICT THE MATHS. chapter-craft's sharpest re-theme
 * warning: say the world's rule out loud and ask whether a child who has done that thing would
 * agree. "25 children, buses seat 6 — how many buses?" has TWO honest answers: the division says
 * 4 remainder 1, and any real teacher orders **5**. Asking for the quotient there would have the
 * world telling the child the opposite of the scored answer on every remainder round. So a
 * remainder round asks the thing that is unambiguous and physical — **how many are left waiting** —
 * and "so we need one more bus" is the CONSEQUENCE in the reveal, deliberately not the question
 * (the same call The Height Bar makes with its gate).
 *
 * ⚠️ THE SEPARATION FROM THE PACKING SHED (`timesTables`) IS A PROPERTY OF THE SCREEN. There the
 * parts are known, the crates are closed, nothing is ever dealt out and the answer is typed. Here
 * the whole is known, it is on the pavement in front of you, and the answer is a COUNT you hold up.
 *
 * ⚠️ EVERY ANSWER IS AT MOST TEN, ON PURPOSE. The band's speciality is answering with your hand and
 * a hand reads 0–10, so a chapter whose answers can exceed that has a tap path reaching questions
 * the camera path cannot — the one-instrument-two-inputs hole chapter-craft-ar names. The generator
 * is bounded so the two inputs can express exactly the same set.
 */

export type BrQType = 'sharing' | 'grouping' | 'remainder'
export type Tier = 1 | 2 | 3

/** A hand reads 0–10, and so the pad offers 0–10. Zero is a real answer: a perfectly full run
 *  leaves nobody waiting, and that round is one the chapter needs. */
export const MAX_COUNT = 10
export const padChoices = (): number[] => Array.from({ length: MAX_COUNT + 1 }, (_, i) => i)
/** ⚠️ The class must be drawable as individual children standing on a pavement. Past this it is a
 *  pile, and a pile a child cannot read is a wrong answer the chapter caused (chapter-craft §1). */
export const MAX_KIDS = 36

export interface BrRound {
  qType: BrQType
  /** how many children are going — always a given, always on the pavement */
  kids: number
  /** seats in one bus. A given on `grouping`/`remainder`; the ANSWER on `sharing`. */
  seats: number
  /** how many buses are used. A given on `sharing`; the ANSWER on `grouping`. */
  buses: number
  /** how many are left standing. The ANSWER on `remainder`; always 0 on the other two. */
  left: number
  answer: number
  tag: string
  prompt: string
  spoken: string
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] as const
const say = (n: number) => (n <= 10 ? WORDS[n] : String(n))
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const tripTag = (seed: number) => `trip ${String(10 + (seed % 90))}`
/** ⚠️ Written out rather than glued from a stem — "1 children" and "1 buses" are the `0 pennyies`
 *  fault, which this repo has now shipped three times (chapter-craft §1). */
const kidsWord = (n: number) => `${n} ${n === 1 ? 'child' : 'children'}`
const busWord = (n: number) => `${n} ${n === 1 ? 'bus' : 'buses'}`
const seatWord = (n: number) => `${n} ${n === 1 ? 'seat' : 'seats'}`

// ─── the three readings ────────────────────────────────────────────────────────────────
export function mkSharing(buses: number, seats: number, seed = 0): BrRound {
  const kids = buses * seats
  return {
    qType: 'sharing', kids, seats, buses, left: 0, answer: seats, tag: tripTag(seed),
    prompt: `${kidsWord(kids)} and ${busWord(buses)}. Share them out evenly — how many in each bus?`,
    spoken: `${cap(kidsWord(kids))} are going, and there are ${busWord(buses)}. Share them out so every bus has the same. How many ride in each one?`,
  }
}

export function mkGrouping(buses: number, seats: number, seed = 0): BrRound {
  const kids = buses * seats
  return {
    qType: 'grouping', kids, seats, buses, left: 0, answer: buses, tag: tripTag(seed),
    prompt: `${kidsWord(kids)}, and every bus has ${seatWord(seats)}. How many buses fill up?`,
    spoken: `${cap(kidsWord(kids))} are going, and every bus holds ${say(seats)}. How many buses do they fill?`,
  }
}

export function mkRemainder(buses: number, seats: number, left: number, seed = 0): BrRound {
  const kids = buses * seats + left
  return {
    qType: 'remainder', kids, seats, buses, left, answer: left, tag: tripTag(seed),
    prompt: `${kidsWord(kids)}, and every bus has ${seatWord(seats)}. Fill the buses — how many are still waiting?`,
    spoken: `${cap(kidsWord(kids))} today, and every bus holds ${say(seats)}. Fill them right up. How many children are still standing on the pavement?`,
  }
}

// ─── the ladder ────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ THE TIER GROWS THE SKILL. L1 is sharing into a small number of buses with the easy families —
 * dealing one round at a time is a thing a nine-year-old already does with cards. L2 adds GROUPING,
 * which is the same operation read from the other end (how many groups, not how many each) and is
 * the half children usually cannot do. L3 is where it stops coming out even.
 */
const POOL: Record<Tier, BrQType[]> = {
  1: ['sharing', 'sharing', 'sharing'],
  2: ['grouping', 'sharing', 'remainder'],
  3: ['remainder', 'grouping', 'remainder'],
}

export const sigOf = (r: BrRound) => `${r.qType}|${r.buses}|${r.seats}|${r.left}`

export function makeRound(d: Tier, asked: readonly string[] = []): BrRound {
  const pool = POOL[d]
  const unmet = pool.filter(q => !asked.includes(q))
  const from = unmet.length ? unmet : pool
  const qType = from[Math.floor(Math.random() * from.length)]
  const seed = Math.floor(Math.random() * 900)
  const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))

  /**
   * ⚠️ NO SQUARE RUN. chapter-craft §0b: when the generator lets two drawn numbers be equal, the
   * answer becomes a number already printed on the ticket and a child can copy it off the screen
   * without dividing at all — The Mission Brief shipped exactly this on 16% of its division rounds.
   * Here `buses === seats` makes "share 25 between 5" answer 5, which is on the ticket.
   */
  const pair = (loB: number, hiB: number, loS: number, hiS: number): [number, number] => {
    for (let t = 0; t < 40; t++) {
      const b = rint(loB, hiB), s = rint(loS, hiS)
      if (b !== s) return [b, s]
    }
    return [3, 4]
  }

  if (qType === 'remainder') {
    // The leftover must be a real one (never 0 — that is a `grouping` round wearing the wrong
    // prompt) and, being smaller than a busload, is always inside a hand's reach.
    for (let t = 0; t < 40; t++) {
      const [b, s2] = pair(2, 4, d === 3 ? 4 : 3, d === 3 ? 8 : 6)
      const left = rint(1, s2 - 1)
      if (b * s2 + left <= MAX_KIDS) return mkRemainder(b, s2, left, seed)
    }
    return mkRemainder(3, 5, 2, seed)
  }
  if (qType === 'grouping') {
    // ⚠️ The class has to be DRAWABLE as children on a pavement, not a pile — so the product is
    // bounded as well as each factor. 10 buses of 6 is 60 little figures and nothing to read.
    for (let t = 0; t < 40; t++) {
      const [buses, seats] = pair(3, MAX_COUNT, 3, d === 3 ? 8 : 6)
      if (buses * seats <= MAX_KIDS) return mkGrouping(buses, seats, seed)
    }
    return mkGrouping(4, 5, seed)
  }
  // Same drawability bound as `grouping`: 6 buses of 10 is 60 figures on a pavement.
  for (let t = 0; t < 40; t++) {
    const [b, s] = d === 1 ? pair(2, 5, 2, 5) : pair(3, 6, 3, MAX_COUNT)
    if (b * s <= MAX_KIDS) return mkSharing(b, s, seed)
  }
  return mkSharing(4, 5, seed)
}

// ─── the board ─────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ WHAT THE BOARD MAY PRINT IS PER ROUND TYPE. The bus count is a GIVEN when the question is how
 * many ride in each, and the ANSWER when the question is how many buses — one expression, two
 * meanings, which is where The Coin Tray's board went wrong on two of its three types.
 */
export function headline(r: BrRound, revealed: boolean): string {
  if (revealed) {
    return r.qType === 'remainder'
      ? `${r.kids} ÷ ${r.seats} = ${r.buses} r ${r.left}`
      : `${r.kids} ÷ ${r.qType === 'sharing' ? r.buses : r.seats} = ${r.answer}`
  }
  if (r.qType === 'sharing') return `${r.kids} children · ${busWord(r.buses)}`
  return `${r.kids} children · ${seatWord(r.seats)} a bus`
}

/** The value: how many the child is holding up. `null` is "nothing said yet", which is a different
 *  state from zero — and zero is a real answer on a remainder round that comes out even. */
export interface Load { n: number | null }
export const EMPTY_LOAD: Load = { n: null }
/** ⚠️ THE ONLY WAY A NUMBER GETS IN. Camera and taps both come through here, so the two paths cannot
 *  drift and `graded` never learns which one moved it. */
export const enterLoad = (_l: Load, n: number): Load => ({ n: Math.max(0, Math.min(MAX_COUNT, Math.round(n))) })
export const graded = (r: BrRound, l: Load) => l.n === r.answer

// ─── what the buses show while the child is deciding ───────────────────────────────────
/**
 * How the yard looks. `committed` is the whole rule.
 *
 * ⚠️⚠️ NOTHING BOARDS UNTIL THE CHILD COMMITS, AND THAT IS NOT A DETAIL — IT IS THE DIFFERENCE
 * BETWEEN AN INSTRUMENT AND A HOT/COLD GAME. The first build loaded the buses live from whatever
 * number was showing, so the pavement read "still waiting" until the number was right and then
 * flipped to "pavement clear" — a child could tap 1, 2, 3… and watch for the label to change,
 * having divided nothing. Caught by driving it, not by a check: every piece was individually
 * correct. chapter-craft §1: *"nothing may signal that the answer is right BEFORE the child commits
 * it"*, and The Coin Tray's wells make the same call (a count, never a live worth).
 *
 * So before the commit the yard shows the SETTING — the class still on the pavement, and the
 * child's number marked out as seats-per-bus or as buses-called-for — and the loading happens on
 * the commit, where it becomes the CHECK rather than the answer. Same order as The Empty Plot:
 * commit to a number first, then build it and see.
 *
 * ⚠️ AFTER the commit it is still derived from THEIR number, not the round's, so a wrong answer
 * leaves a visibly wrong yard — the wrong action is allowed and visible rather than blocked.
 */
export function loadFor(r: BrRound, n: number | null, committed = false): { perBus: number[]; waiting: number; marked: number } {
  const empty = Array.from({ length: r.qType === 'grouping' ? 0 : r.buses }, () => 0)
  if (n === null) return { perBus: empty, waiting: r.kids, marked: 0 }

  if (!committed) {
    // The proposal, drawn as a setting. Nobody has moved, so the pavement is untouched.
    if (r.qType === 'grouping') return { perBus: Array.from({ length: Math.min(n, MAX_COUNT) }, () => 0), waiting: r.kids, marked: 0 }
    if (r.qType === 'remainder') return { perBus: empty, waiting: r.kids, marked: n }
    return { perBus: Array.from({ length: r.buses }, () => 0), waiting: r.kids, marked: n }
  }

  if (r.qType === 'sharing') {
    const per = Math.min(n, r.kids)
    const perBus = Array.from({ length: r.buses }, (_, i) => Math.max(0, Math.min(per, r.kids - i * per)))
    return { perBus, waiting: Math.max(0, r.kids - perBus.reduce((a, b) => a + b, 0)), marked: n }
  }
  if (r.qType === 'grouping') {
    const used = Math.max(0, Math.min(n, MAX_COUNT))
    const perBus = Array.from({ length: used }, (_, i) => Math.max(0, Math.min(r.seats, r.kids - i * r.seats)))
    return { perBus, waiting: Math.max(0, r.kids - perBus.reduce((a, b) => a + b, 0)), marked: n }
  }
  // remainder: the buses fill themselves once the child has said who is left over
  const perBus = Array.from({ length: r.buses }, (_, i) => Math.min(r.seats, Math.max(0, r.kids - i * r.seats)))
  return { perBus, waiting: n, marked: n }
}

// ─── the words after the commit ────────────────────────────────────────────────────────
/** ⚠️ Never names the answer, and never differs between a near miss and a wild one — a line that
 *  narrowed with the attempt would be hot/cold across attempts. */
export function missFor(r: BrRound): string {
  if (r.qType === 'sharing') return 'Not that many each. Deal them out one to every bus, round and round, until the pavement is empty.'
  if (r.qType === 'grouping') return 'Not that many buses. Fill one right up, then start the next — keep going until nobody is left.'
  return 'Not that many waiting. Fill every bus completely first, and only then count who is still standing.'
}

/**
 * ⚠️ ON A MISS IT NAMES WHAT THEIR NUMBER WOULD DO, which is a true statement about the pavement in
 * front of them and never the answer. On a correct round it prints the division, because by then
 * the child has already given the answer and the sentence is the summary of their own work.
 */
export function verdictFor(r: BrRound, l: Load): { text: string; ok: boolean } {
  if (graded(r, l)) {
    if (r.qType === 'remainder') {
      return { text: r.left === 0 ? `Every bus full and nobody left — ${r.kids} ÷ ${r.seats} is exactly ${r.buses}` : `${busWord(r.buses)} full and ${kidsWord(r.left)} waiting — so we need one more bus`, ok: true }
    }
    return { text: `${r.kids} ÷ ${r.qType === 'sharing' ? r.buses : r.seats} = ${r.answer}`, ok: true }
  }
  if (l.n === null) return { text: 'Nobody has boarded yet', ok: false }
  const { waiting } = loadFor(r, l.n, true)
  // The child's OWN number, echoed — it can only equal the answer when they were right.
  if (r.qType === 'remainder') return { text: `That would leave ${kidsWord(l.n)} standing`, ok: false }
  /**
   * ⚠️⚠️ THE DIRECTION, NEVER THE FIGURE. This used to print the leftover count, and the gate caught
   * it handing the answer over by ARITHMETIC rather than by wording: on `10 buses of 5`, a guess of
   * 8 leaves 50 − 40 = **10** on the pavement, and 10 is the answer. chapter-craft §0b: *"a number in
   * a verdict can be the answer by coincidence — check the numbers a template can produce, not just
   * the words in it."* The pavement is drawn right there, so the count was never the words' job.
   */
  return waiting > 0
    ? { text: 'Some are still on the pavement', ok: false }
    : { text: 'That fills up before everyone has a seat', ok: false }
}

// ─── demo / re-teach ───────────────────────────────────────────────────────────────────
/** The worked example as DATA, so the gate drives the same beats the screen plays. */
export interface BrBeat { say: string; load: number | null }

/**
 * ⚠️ THE ARITHMETIC BEAT MOVES THE PICTURE. The working here is the DEALING — children stepping
 * onto buses one round at a time — because a beat that only says the sum is a sentence over an
 * unchanged scene, and this band's devices often have no voice to carry it.
 */
export function explainBeats(r: BrRound): BrBeat[] {
  if (r.qType === 'grouping') {
    return [
      { say: `${cap(kidsWord(r.kids))} are going, and every bus holds ${say(r.seats)}.`, load: null },
      { say: `Fill the first bus right up — that is ${say(r.seats)} gone.`, load: 1 },
      { say: `Keep filling: ${Array.from({ length: Math.min(r.buses, 6) }, (_, i) => (i + 1) * r.seats).join(', ')}${r.buses > 6 ? '…' : ''}.`, load: Math.max(2, Math.min(r.buses - 1, 3)) },
      { say: `That empties the pavement after ${busWord(r.buses)}. ${r.kids} divided by ${r.seats} is ${r.buses}.`, load: r.buses },
    ]
  }
  if (r.qType === 'remainder') {
    return [
      { say: `${cap(kidsWord(r.kids))} today, and every bus holds ${say(r.seats)}.`, load: null },
      { say: `Fill them one by one — ${Array.from({ length: r.buses }, (_, i) => (i + 1) * r.seats).join(', ')}.`, load: 0 },
      { say: `${busWord(r.buses)} are full, and that is ${r.buses * r.seats} children aboard.`, load: 0 },
      { say: `${cap(kidsWord(r.left))} could not fit, so ${r.left === 1 ? 'that one is' : 'those are'} still waiting — and we need one more bus.`, load: r.left },
    ]
  }
  return [
    { say: `${cap(kidsWord(r.kids))} are going, and there are ${busWord(r.buses)}.`, load: null },
    { say: `Give one child to every bus, round and round — that is one each so far.`, load: 1 },
    { say: `Keep dealing until the pavement is empty.`, load: Math.max(2, r.seats - 1) },
    { say: `Every bus ended up with ${say(r.seats)}. ${r.kids} shared between ${r.buses} is ${r.seats}.`, load: r.seats },
  ]
}

/** How an answer is given, per input. The ONE place either gesture is named. */
export type Answering = 'hand' | 'tap'
const ASK: Record<BrQType, string> = {
  sharing: 'how many ride in each bus',
  grouping: 'how many buses fill up',
  remainder: 'how many are still waiting',
}
/** ⚠️ Written out per input rather than glued to a shared stem — `${verb} it` gave "hold up it" on
 *  a shipped instruction chip, and one verb cannot serve two sentences (chapter-craft §1). */
export const instructionFor = (input: Answering, q: BrQType): string =>
  input === 'hand' ? `Hold up ${ASK[q]}` : `Tap ${ASK[q]}`

/**
 * ⚠️ THE WORKED EXAMPLES INCLUDE THE CASE THAT DOES NOT COME OUT EVEN, and that is the point of the
 * list rather than an afterthought. Every division demo drifts toward the tidy share because it
 * reads better — BlockYard shipped four examples that all quietly avoided the regrouping its own
 * chapter existed for. The remainder is LAST rather than first because it is built out of the other
 * two (fill them the grouping way, then look at who is left), not because it is the awkward one.
 */
export const DEMO: BrRound[] = [mkSharing(4, 6, 1), mkGrouping(5, 4, 2), mkRemainder(3, 6, 2, 3)]
export const GUIDED: BrRound = mkSharing(3, 4, 4)
