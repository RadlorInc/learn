/**
 * THE PACKING SHED (9–11 · `timesTables`) — the maths, the words and every rule that can be wrong.
 *
 * Carries TWO skill-graph nodes, which is why one chapter is enough: `i.multFacts` (fact fluency)
 * at L1–L2 and `i.multMultiDigit` (2-digit × 1-digit) at L3. That split is the curriculum's own
 * ("Fact fluency + 2-digit × 1-digit"), and it is what the difficulty ladder grows — not the size
 * of the numbers, which chapter-craft §0a warns is the lazy tier.
 *
 * ⚠️⚠️ THE CRATES ARE CLOSED, AND THAT IS THE WHOLE CHAPTER. Fact fluency means knowing 7 × 8
 * WITHOUT counting, so an array a child can count is the scene answering the question — which
 * chapter-craft calls teaching, not measuring. The order says how many crates and how many fit in
 * one; nothing on screen shows the contents until the child has committed a number. Then the crates
 * tip out and the belt counts them, and the building becomes the CHECK rather than the answer. Same
 * shape as The Empty Plot, for the same reason.
 *
 * ⚠️ THE SEPARATION FROM THE MINIBUS RUN (`division`) IS A PROPERTY OF THE SCREEN, not a different
 * sentence about the same picture — chapter-craft's SliceShop/PizzaCounter rule. Here the parts are
 * known and the WHOLE is missing, nothing is ever dealt out, and the answer is typed. There the
 * whole is known and the GROUP is missing, the children physically board the buses one at a time,
 * and whoever is left over stands on the pavement.
 *
 * ⚠️ THE ORDER IS STATED IN OBJECTS; THE EQUATION APPEARS IN THE REVEAL. `7 × 8 = ?` printed on the
 * ticket would make the crates decoration (BlockYard's fault, twice rebuilt). Concrete → abstract,
 * in that order, so `7 × 8 = 56` is the summary of work already done.
 */

/** Answers are typed, so the pad is the ten digits and nothing is eliminable. */
export const padChoices = (): number[] => [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
/** A 2-digit × 1-digit answer tops out in the hundreds; anything longer is a lean on the key. */
export const MAX_DIGITS = 3

export type PkQType = 'total' | 'missing' | 'multi'
export type Tier = 1 | 2 | 3

export interface PkRound {
  qType: PkQType
  /** how many crates on the pallet — the answer on a `missing` round, a given on the others */
  crates: number
  /** how many pieces fit in one crate — always a given */
  per: number
  /** what the child must type */
  answer: number
  /** the whole order, shown only where it is a GIVEN (a `missing` round) */
  total: number
  /** the ticket's own dressing — an order number, never a quantity */
  tag: string
  prompt: string
  spoken: string
  /** what the shed is packing this round; flavour only, never load-bearing */
  goods: string
}

const GOODS = ['apples', 'pears', 'lemons', 'plums', 'peaches', 'oranges'] as const
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] as const
/** Spoken numbers stay words up to ten and become digits above it — "twenty-three" read aloud as a
 *  word list is worse than the numeral, and the numeral is what the child is learning to see. */
const say = (n: number) => (n <= 10 ? WORDS[n] : String(n))
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const goodsFor = (seed: number) => GOODS[seed % GOODS.length]
const orderTag = (seed: number) => `order ${String(100 + (seed % 900))}`

// ─── the three readings ────────────────────────────────────────────────────────────────
/**
 * ⚠️ NO DEGENERATE DRAW. chapter-craft §0b: the commonest way a question prints its own answer is
 * not bad wording, it is two drawn numbers being allowed to be the same one. Here `crates × per`
 * can never equal `crates` or `per` because neither is ever 1, and a `missing` round additionally
 * refuses `crates === per` — a square pallet whose answer is a number already on the ticket, which
 * is exactly the fault The Mission Brief shipped on 16% of its division rounds.
 */
export function mkTotal(crates: number, per: number, seed = 0): PkRound {
  const goods = goodsFor(seed)
  return {
    qType: 'total', crates, per, total: crates * per, answer: crates * per, goods,
    tag: orderTag(seed),
    prompt: `${cap(say(crates))} crates. ${cap(say(per))} ${goods} in each. How many ${goods} altogether?`,
    spoken: `${cap(say(crates))} crates on the pallet, and ${say(per)} ${goods} fit in every one. How many ${goods} is that altogether?`,
  }
}

export function mkMissing(crates: number, per: number, seed = 0): PkRound {
  const goods = goodsFor(seed)
  return {
    qType: 'missing', crates, per, total: crates * per, answer: crates, goods,
    tag: orderTag(seed),
    prompt: `${crates * per} ${goods} to send, and ${say(per)} fit in a crate. How many crates?`,
    spoken: `The whole order is ${crates * per} ${goods}, and ${say(per)} fit in a crate. How many crates do we fill?`,
  }
}

export function mkMulti(per: number, crates: number, seed = 0): PkRound {
  const goods = goodsFor(seed)
  return {
    qType: 'multi', crates, per, total: crates * per, answer: crates * per, goods,
    tag: orderTag(seed),
    prompt: `${cap(say(crates))} crates. ${per} ${goods} in each. How many ${goods} altogether?`,
    spoken: `${cap(say(crates))} crates, and this time ${per} ${goods} fit in every one. How many is that?`,
  }
}

// ─── the ladder ────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ THE TIER GROWS THE SKILL, NOT THE MAGNITUDE. L1 is the families a child reaches by skip
 * counting (×2, ×5, ×10) — the bridge from the 6–8 chapter they have just passed. L2 is the HARD
 * MIDDLE (6–9 × 6–9), which is where fact fluency actually lives and where a child who is still
 * counting on will stall. L3 is multi-digit, the second skill this chapter carries.
 */
const EASY_PER = [2, 5, 10]
const HARD_PER = [3, 4, 6, 7, 8, 9]

const POOL: Record<Tier, PkQType[]> = {
  1: ['total', 'total', 'total'],
  2: ['total', 'missing', 'total'],
  3: ['multi', 'missing', 'multi'],
}

export const sigOf = (r: PkRound) => `${r.qType}|${r.crates}|${r.per}`

/**
 * `asked` is the readings already served this run, so a scarce round can be spent on one that has
 * not appeared. ⚠️ Be deliberate only WHILE a gap exists and random once it closes — hardest-first
 * for ever locks the generator onto one kind and destroys the variety (chapter-craft §0).
 */
export function makeRound(d: Tier, asked: readonly string[] = []): PkRound {
  const pool = POOL[d]
  const unmet = pool.filter(q => !asked.includes(q))
  const qType = (unmet.length ? unmet : pool)[Math.floor(Math.random() * (unmet.length ? unmet.length : pool.length))]
  const seed = Math.floor(Math.random() * 900)
  const pickFrom = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)]
  const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))

  if (qType === 'multi') {
    /**
     * 2-digit × 1-digit. The crate count stays ≥ 3 so the round is not a doubling in disguise.
     *
     * ⚠️ AND THE PARTIAL PRODUCTS ARE CHECKED AGAINST WHAT IS ON THE TICKET. The method this round
     * teaches is "split the crate into tens and ones, multiply each" — so `crates × ones` is a
     * number the child themselves writes down, and if it lands on a figure already printed beside
     * it the chapter has MANUFACTURED a wrong answer rather than merely failed to hide the right
     * one (chapter-craft §0b, The Height Bar). Measured: `6 crates of 12` gives 6 × 2 = 12, the
     * crate size an inch away; `4 crates of 21` gives 4 × 1 = 4, the crate count.
     */
    for (let tries = 0; tries < 40; tries++) {
      const per = rint(12, 29)
      const crates = rint(3, 6)
      const ones = per % 10
      if (crates * ones === per || crates * ones === crates) continue
      return mkMulti(per, crates, seed)
    }
    return mkMulti(23, 4, seed)   // a pair that satisfies the rule, so the loop can never return nothing
  }
  if (qType === 'missing') {
    const per = pickFrom(d === 2 ? HARD_PER : [...HARD_PER, 11, 12])
    let crates = rint(3, 9)
    if (crates === per) crates = per === 9 ? 3 : crates + 1   // never a square pallet — see mkMissing
    return mkMissing(crates, per, seed)
  }
  const per = pickFrom(d === 1 ? EASY_PER : HARD_PER)
  const crates = rint(d === 1 ? 3 : 4, 9)
  return mkTotal(crates, per, seed)
}

// ─── the board ─────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ WHAT THE BOARD MAY PRINT IS PER ROUND TYPE, NOT PER CHAPTER — the fault The Coin Tray caught
 * with one expression that was correct on one of its three types and fatal on the others. Here the
 * order's TOTAL is a given on a `missing` round and IS the answer on the other two, so it may be
 * printed on exactly one of them. `revealed` opens it for everybody afterwards.
 */
export function headline(r: PkRound, revealed: boolean): string {
  if (revealed) return `${r.crates} × ${r.per} = ${r.total}`
  // Before the commit the board carries only GIVENS, stated as goods rather than as a sum: the
  // order's total is a given when the crate count is missing, and is the answer otherwise.
  return r.qType === 'missing' ? `${r.total} ${r.goods}` : `${r.crates} crates of ${r.per}`
}

/** The label the child is filling — a count, never a running worth. */
export interface Label {
  digits: string
  /**
   * ⚠️ WALKTHROUGH ONLY: how many crates Milo has tipped out while working the example. The crates
   * are CLOSED during a scored round — that is the whole chapter — so this field is set by the
   * tutorial's beats and by NOTHING in play: not `initialValue`, not `enterDigit`, not the miss
   * glide. chapter-craft's rule for a working animation whose pieces are countable, and the gate
   * asserts it by driving the play path rather than by grepping.
   */
  open?: number
}
export const EMPTY_LABEL: Label = { digits: '' }
export const labelValue = (l: Label) => (l.digits === '' ? null : Number(l.digits))

/**
 * ⚠️ THE ONLY WAY A DIGIT GETS ONTO THE LABEL. Camera and taps both come through here, so the two
 * paths cannot drift and `graded` never learns which one moved it.
 * ⚠️ AND A LEADING ZERO IS DROPPED rather than refused: a child who taps 0 first and then 5 means
 * five, and a pad that silently keeps "05" makes a correct answer grade wrong.
 */
export function enterDigit(l: Label, n: number): Label {
  if (l.digits.length >= MAX_DIGITS) return l
  const next = (l.digits + String(n)).replace(/^0+(?=\d)/, '')
  return { digits: next }        // ⚠️ `open` is deliberately dropped: typing never opens a crate
}
/** Take the last digit back. A child who mistypes must not have to start the number again. */
export const backspace = (l: Label): Label => ({ digits: l.digits.slice(0, -1) })
export const clearLabel = (): Label => EMPTY_LABEL

export const graded = (r: PkRound, l: Label) => labelValue(l) === r.answer

// ─── the words after the commit ────────────────────────────────────────────────────────
/**
 * ⚠️ NEVER NAMES THE ANSWER, AND NEVER NARROWS WITH THE ATTEMPT. A miss line that differed between
 * a near-miss and a wild one is hot/cold across attempts, so this takes only the ROUND. The
 * property is asserted by driving two different rounds of the same type and requiring the same
 * words — the loop-variable-unused tautology chapter-craft §4 describes is the trap here.
 */
export function missFor(r: PkRound): string {
  if (r.qType === 'missing') return 'Not that many crates. Count up in crate-loads until you reach the order — how many jumps was it?'
  if (r.qType === 'multi') return 'Not quite. Split the crate into its tens and its ones, multiply each, then put them back together.'
  return 'Not that many. One crate-load at a time — how far do you get after all the crates?'
}

/**
 * ⚠️ ON A MISS IT NAMES WHAT THEY SENT, which is a true statement about the belt in front of them
 * and never the answer. On a correct round it prints the BRIDGE — the equation — because by then
 * the child has already given the answer and the equation is the summary of their own work.
 */
export function verdictFor(r: PkRound, l: Label): { text: string; ok: boolean } {
  if (graded(r, l)) {
    return r.qType === 'missing'
      ? { text: `${r.crates} crates — because ${r.crates} × ${r.per} is ${r.total}`, ok: true }
      : { text: `${r.crates} × ${r.per} = ${r.answer}`, ok: true }
  }
  const v = labelValue(l)
  return { text: v === null ? 'Nothing on the label yet' : `You sent ${v}`, ok: false }
}

// ─── demo / re-teach ───────────────────────────────────────────────────────────────────
/** The worked example as DATA, so the gate drives the same beats the screen plays — the Supply Run
 *  fault was a demo whose numbers disagreed with its own sentences, and nothing could see it. */
export interface PkBeat { say: string; label: string; open: number }

/**
 * ⚠️ `open` IS HOW MANY CRATES HAVE BEEN TIPPED OUT, and it is the only thing that animates. The
 * beat that does the ARITHMETIC is the one most likely to be a sentence over an unchanged picture
 * (chapter-craft §0a), and in this chapter that is fatal on a band whose devices often have no
 * voice — so the working IS the crates opening one at a time while the running count climbs.
 */
export function explainBeats(r: PkRound): PkBeat[] {
  if (r.qType === 'missing') {
    return [
      { say: `The whole order is ${r.total} ${r.goods}, and ${say(r.per)} fit in a crate.`, label: '', open: 0 },
      { say: `So count up in ${r.per}s and see how many crate-loads it takes.`, label: '', open: Math.min(2, r.crates) },
      { say: `${Array.from({ length: Math.min(r.crates, 6) }, (_, i) => (i + 1) * r.per).join(', ')}${r.crates > 6 ? '…' : ''} — that reaches ${r.total}.`, label: '', open: r.crates },
      { say: `That took ${say(r.crates)} crates. ${r.crates} times ${r.per} is ${r.total}.`, label: String(r.crates), open: r.crates },
    ]
  }
  if (r.qType === 'multi') {
    const tens = Math.floor(r.per / 10) * 10, ones = r.per % 10
    return [
      { say: `${cap(say(r.crates))} crates, and ${r.per} ${r.goods} in each. That is a big crate, so split it.`, label: '', open: 0 },
      { say: `${tens} and ${ones} make ${r.per}. Take the ${tens} first: ${r.crates} times ${tens} is ${r.crates * tens}.`, label: '', open: Math.ceil(r.crates / 2) },
      { say: `Now the ones: ${r.crates} times ${ones} is ${r.crates * ones}.`, label: '', open: r.crates },
      { say: `Put them back together — ${r.crates * tens} and ${r.crates * ones} make ${r.answer}.`, label: String(r.answer), open: r.crates },
    ]
  }
  const runs = Array.from({ length: Math.min(r.crates, 6) }, (_, i) => (i + 1) * r.per)
  return [
    { say: `${cap(say(r.crates))} crates, and ${say(r.per)} ${r.goods} in every one.`, label: '', open: 0 },
    { say: `One crate is ${say(r.per)}. Two crates is ${r.per * 2}.`, label: '', open: 2 },
    { say: `Keep going: ${runs.join(', ')}${r.crates > 6 ? '…' : ''}.`, label: '', open: r.crates },
    { say: `${r.crates} times ${r.per} is ${r.answer}. That is the whole pallet.`, label: String(r.answer), open: r.crates },
  ]
}

/** How an answer is given, per input. The ONE place either gesture is named. */
export type Answering = 'hand' | 'tap'
export const instructionFor = (input: Answering, filled: boolean): string =>
  filled ? 'Send it when the label is right' : input === 'hand' ? 'Type the total on the label' : 'Tap the total onto the label'

/**
 * ⚠️ THE FIRST DEMO IS THE HARDEST FACT ON PURPOSE. Hand-picked examples drift toward the tidy case
 * because they read better, and this chapter exists for 7 × 8 — the fact children reach last and
 * the one a counting-on strategy fails at. Showing 2 × 5 first and never showing this one is the
 * fault BlockYard shipped, where all four demo examples quietly avoided regrouping.
 */
export const DEMO: PkRound[] = [mkTotal(7, 8, 1), mkMissing(6, 7, 2), mkMulti(23, 4, 3)]
export const GUIDED: PkRound = mkTotal(4, 5, 4)
