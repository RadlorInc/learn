/**
 * Fractions, as arithmetic — everything about SliceShop that is not React.
 *
 * It lives here for the reason clock.ts and market.ts do: the scene and its gate must not each carry
 * their own copy of the rules. The gate drives THESE functions, so a check can never agree with a
 * second copy of the constants while the screen falls apart.
 *
 * ⚠️ THE PAYLOAD OF THIS CHAPTER IS THAT A FRACTION IS A UNIT REPEATED, AND THAT A **SMALLER PIECE
 * FITS MORE TIMES.** `p.fractionsIntro` is one of the three most load-bearing nodes in the 6–8 band
 * and the root of the whole fraction spine (`i.fractionEquiv → i.fractionOps → m.rationalOps →
 * c.rationalFns`), and what stands on it needs exactly one thing: that the number under the line
 * names the SIZE of the part, so 1/4 < 1/2 even though 4 > 2. That is counter-intuitive, no amount
 * of practice discovers it, and the chapter this replaced never asked for it once.
 *
 * ⚠️ WHAT THIS REPLACED, AND WHY IT LOOKED FINE: the whole arrived **already cut into equal parts**
 * with exactly one shaded, and the child tapped 1/2 · 1/3 · 1/4. Two faults, both fatal. *Equal* is
 * the entire idea and it was the thing being supplied; and with the numerator pinned at 1 the answer
 * was literally `den`, so **deleting the shading left every question still answerable** — it was
 * counting parts, not naming a fraction. (Its three choice chips were also `[2,3,4]` unshuffled, so
 * position alone gave it away.)
 *
 * So the verb is **FIT IT**: Milo holds out a piece, the child lays copies of it into the whole and
 * finds how many fit. Equality is not supplied, it is DISCOVERED — copies of one piece are equal by
 * construction, and a piece that does not fit a whole number of times is not a fraction of the whole
 * at all. The inverse relationship then comes free: a smaller piece visibly fits more times.
 *
 * ONE GESTURE, BOTH DIRECTIONS (the call TickTock makes for reading and setting a clock):
 *   · **FIT**  — the piece is given, the child finds the number.  "How many of these fit?"
 *   · **TAKE** — the number is given, the child finds the piece.  "Which piece makes thirds?"
 * and ONE grader for both: *the whole is exactly full, with the right piece.*
 */
import { SHEETS } from './canvas/sheets'

// ─── words ────────────────────────────────────────────────────────────────────────────
/** Only ever 1..12 here — everything on screen has to stay countable by eye. */
const N_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
export const numWord = (n: number) => N_WORD[n] ?? String(n)

export type Den = 2 | 3 | 4
/** Halves, thirds and quarters — the closed set the curriculum names for this band, and the set
 *  `coverage` makes the mastery exit wait for. */
export const DENS: readonly Den[] = [2, 3, 4]

const DEN_WORD: Record<Den, string> = { 2: 'half', 3: 'third', 4: 'quarter' }
export const denWord = (d: Den) => DEN_WORD[d]
export const denPlural = (d: Den) => (d === 2 ? 'halves' : `${DEN_WORD[d]}s`)

// ─── the round ────────────────────────────────────────────────────────────────────────
/** Which direction the round is answered from. */
export type Ask = 'fit' | 'take'
/** What the whole IS — a single treat, or a pile of things. The curriculum asks for both
 *  ("splitting shapes & groups") and one gesture serves them. */
export type On = 'shape' | 'group'
export type Shape = 'round' | 'bar'

export interface FrRound {
  slot: number      // which of Milo's ten orders — fixes the treat, the shape and the scene
  den: Den
  on: On
  n: number         // how many things are in the pile; 0 for a shape
  ask: Ask
  d: 1 | 2 | 3
}

/**
 * Alternating, so consecutive rounds differ in DIRECTION as well as in scene, and both are
 * practised the whole way down the run rather than in two blocks.
 */
export const askFor = (round: number): Ask => (round % 2 === 0 ? 'fit' : 'take')

/**
 * ⚠️ A GROUP ROUND IS ALWAYS A **TAKE**, and that is a pedagogy call rather than a simplification.
 * "How many handfuls fit in this pile" is division wearing a fraction's clothes; the question the
 * curriculum actually asks of a group is *"what is one third of twelve"*, which is the take
 * direction. Shapes carry both directions.
 *
 * Groups start at L2 because a fraction OF a quantity is a step past naming a fraction of one thing.
 */
// ⚠️ The `askFor` term is INERT TODAY and deliberately kept — `round % 4 === 1` is always odd and
// every odd round is already a take, so mutation-testing shows removing it changes nothing. It stays
// because it states the rule the round slot merely happens to satisfy: change the slot to `% 4 === 2`
// and without it a pile would silently become a fit round. The gate asserts the INVARIANT (a pile is
// only ever a take) rather than this expression, so it holds whichever way this is written.
export const onFor = (d: 1 | 2 | 3, round: number): On =>
  d >= 2 && askFor(round) === 'take' && round % 4 === 1 ? 'group' : 'shape'

/**
 * One new idea per tier, each a superset of the last:
 *   L1 halves and quarters, one treat  →  L2 + thirds, + a pile  →  L3 everything
 *
 * ⚠️ L1 LEAVES THIRDS OUT ON PURPOSE. Halves and quarters both come from halving, which a
 * six-year-old can already do with their hands; a third cannot be reached that way and is the one
 * that has to be taught. Handing all three at the gentlest tier is what chapter 2 once did when its
 * easiest tier controlled only HOW MANY numbers there were and not how hard they were.
 */
export const densFor = (d: 1 | 2 | 3): Den[] => (d === 1 ? [2, 4] : [2, 3, 4])

/**
 * ⚠️ WHY THIS IS NOT A UNIFORM DRAW, and it is the most important arithmetic in this file.
 *
 * `core/adaptive.ts` promotes on 3 correct in a row and ends the run at the top tier on a streak of
 * 6, so a child who answers well gets **about three rounds at L1, exactly ONE at L2 and TWO at L3**
 * and then the chapter finishes. Drawing the denominator uniformly then means thirds — the one this
 * chapter has to teach, and the only one L1 never shows — are missed outright by a large share of
 * strong runs. Measured on TickTock, the same arithmetic lost the hardest reading about a third of
 * the time.
 *
 * So when a round has to count, it is spent on a denominator the child has not been asked yet.
 *
 * ⚠️ DELIBERATE ONLY WHILE THERE IS A GAP; RANDOM ONCE THERE IS NOT. Hardest-first for ever locks
 * the generator onto thirds the moment all three have been met, which would destroy the variety the
 * coverage fix exists to protect — and starve `makeDistinct`, which needs a generator that can
 * produce more than one round.
 */
export function pickDen(d: 1 | 2 | 3, asked: readonly string[] = [], rnd: () => number = Math.random): Den {
  const pool = densFor(d)
  const fresh = pool.filter(x => !asked.includes(String(x)))
  if (!fresh.length) return pool[Math.floor(rnd() * pool.length)]
  // Hardest-first among the unmet. The order is taste, not correctness — what forces it is the round
  // budget above: the single L2 round is the first chance to ask for a third at all.
  const order: Den[] = [3, 4, 2]
  return order.find(x => fresh.includes(x)) ?? fresh[0]
}

/**
 * How many things are in the pile, for a given share size.
 *
 * ⚠️ EVERY ENTRY IS DIVISIBLE BY AT LEAST ONE **OTHER** DENOMINATOR, and that is load-bearing rather
 * than tidy: on a take round the tray offers a handful per denominator that divides the pile, so a
 * pile only one denominator divides would offer exactly one piece — a question with no decision in
 * it. (Nine cookies is why: only thirds divide it, so nine is not in the table.)
 *
 * Capped at twelve because everything here has to stay countable by eye.
 */
const GROUP_N: Record<Den, number[]> = { 2: [4, 6, 8], 3: [6, 12], 4: [8, 12] }
export const groupNFor = (den: Den, rnd: () => number = Math.random): number => {
  const opts = GROUP_N[den]
  return opts[Math.floor(rnd() * opts.length)]
}

/**
 * The pieces the tray offers.
 *
 * A FIT round hands over one piece — the question is how many of it fit. A TAKE round offers a real
 * choice, and the choices are the whole closed set for a shape, or every share size that divides the
 * pile for a group. Ordered small-denominator-first (i.e. biggest piece first), which is
 * deterministic on purpose: the old chapter's fixed `[2,3,4]` chips gave the answer away by
 * POSITION, and that cannot happen here because the answer denominator changes round to round while
 * the ordering is by size — a cue that is true rather than a cue that is a tell.
 */
export function piecesFor(r: FrRound): Den[] {
  if (r.ask === 'fit') return [r.den]
  return r.on === 'group' ? DENS.filter(x => r.n % x === 0) : [...DENS]
}

/** How many things one share holds. Only meaningful for a pile. */
export const perShare = (r: FrRound) => (r.on === 'group' ? r.n / r.den : 0)

/**
 * ⚠️ ONE GRADER FOR BOTH DIRECTIONS, and that is the whole reason the two directions share a board:
 * *the whole is exactly full, with the right piece.*
 *
 * The second half is not redundant. A child asked for thirds who reaches for the half piece can fill
 * the whole exactly with two of them — full, and wrong — so a check on the count alone would mark
 * the central misconception correct. It is also the moment the payload is worth saying out loud, and
 * `missFor` says it.
 */
export const isSolved = (r: FrRound, got: { den: Den; laid: number }) =>
  got.den === r.den && got.laid === r.den

// ─── Milo's day at the shop ───────────────────────────────────────────────────────────
export interface Order {
  what: string        // what Milo is doing — the reason to cut anything
  treat: string       // the whole
  art: string         // the REAL sprite the whole is drawn from — never a flat colour
  shape: Shape
  scene: string       // backdrop file
  item: string        // the sprite a PILE is made of
  items: string       // that sprite's plural, for the spoken ask
  colors: { base: string; shaded: string; edge: string }
  topping?: string    // real art laid on the piece Milo takes
  emoji: string
}

/**
 * Ten orders, opening the shop through to the party — so the run has an ARC and "the scene changes"
 * means something. This replaces the old three-world picker, which asked a child to choose before
 * they knew what they were choosing and then spent all ten rounds in one backdrop.
 *
 * ⚠️ ROUND AND BAR TREATS ALTERNATE. A fraction of a circle and a fraction of a strip are the same
 * idea in two representations, and a child who has only ever seen the pie chart has learned the
 * picture rather than the idea — which is exactly the gap `i.fractionEquiv` then trips over on a
 * number line.
 *
 * ⚠️ NO SCENE HERE IS ONE TICKTOCK USES. `kitchen_oven` and `kitchen_bakery` were in this chapter
 * before TickTock's day claimed them, and two 6–8 chapters sharing a backdrop is the band's own
 * no-repeat rule broken. Checked against `DAY` in clock.ts by the gate, not by memory.
 *
 * ⚠️ EVERY SCENE IS **PAINTED, AND NO BRIGHTER THAN WHAT STANDS IN IT.** Two separate checks, and
 * the chapter shipped its first cut failing both on `grocery_sweets.jpeg`: it is a flat-VECTOR
 * cartoon (uniform outlines, flat fills, polka-dot wall) under painted sprites — the mismatch that
 * got the pond backdrops pulled, and one no placement or shadow can fix — and it measures value
 * **0.892**, rising to **0.927** across the band the board and the friends occupy, against sprites
 * at 0.70–0.92 and every shipped backdrop at 0.70–0.86. A backdrop brighter than the characters
 * standing on it turns them into cut-outs on a blank page, which is exactly what the founder saw.
 *
 * ⚠️ AND THE STYLE HALF IS AN EYE CHECK, NOT A NUMBER. A dark-pixel ratio called `grocery_sweets`
 * clean at 0.0% because its outlines are light GREY rather than ink, and called `party_lanterns`
 * dirty at 16.8% because it is an evening scene full of tree trunks — wrong in both directions. A
 * flatness metric then rated painted `garden_meadow` (0.842) less painted than vector `pond`
 * (0.626). Open the file and look; the value measurement is the gate behind that, not the chooser.
 *
 * ⚠️ EVERY `item` IS A **COLOUR** SPRITE, MEASURED. Part of the library is greyscale by design and
 * it is not confined to the `pat_*` prefix — the version of this chapter being replaced put
 * `candy_cupcake` (chroma 0.0, measured) on the party table, where it drew a grey ghost. The gate
 * measures every one of them.
 */
export const ORDERS: Order[] = [
  { what: 'open the shop',    treat: 'pizza',         shape: 'round', art: 'pizza_base',    scene: 'pizzeria.png',         item: 'cookie',             items: 'cookies',      emoji: '🍕',
    colors: { base: '#f4c84e', shaded: '#f0b93e', edge: '#c98a3a' } },
  { what: 'wrap a chocolate', treat: 'chocolate bar', shape: 'bar',   art: 'slice_choc',    scene: 'candy_tray.png',       item: 'cherry',             items: 'cherries',     emoji: '🍫',
    colors: { base: '#a9713c', shaded: '#8a5a2c', edge: '#4a2b14' } },
  { what: 'peel an orange',   treat: 'orange',        shape: 'round', art: 'kitchen_orange',scene: 'grocery_produce.jpeg', item: 'apple',              items: 'apples',       emoji: '🍊',
    colors: { base: '#f0932b', shaded: '#ffc46a', edge: '#c9701a' } },
  { what: 'cut a flapjack',   treat: 'flapjack',      shape: 'bar',   art: 'slice_flapjack',scene: 'grocery_bakery.jpeg',  item: 'grocery_bun',        items: 'rolls',        emoji: '🍯',
    colors: { base: '#e0b476', shaded: '#cf9a55', edge: '#8f5c2c' } },
  { what: 'slice the cheese', treat: 'cheese wheel',  shape: 'round', art: 'slice_cheese',  scene: 'grocery_deli.jpeg',    item: 'grocery_egg',        items: 'eggs',         emoji: '🧀',
    colors: { base: '#f2d067', shaded: '#e6bb45', edge: '#b08a22' } },
  { what: 'cut a mint slice', treat: 'mint slice',    shape: 'bar',   art: 'slice_mint',    scene: 'kitchen_pantry.jpeg',  item: 'pear',               items: 'pears',        emoji: '🍬',
    colors: { base: '#a8dcc0', shaded: '#8ecfae', edge: '#4e8a6b' } },
  { what: 'break a cookie',   treat: 'big cookie',    shape: 'round', art: 'cookie',        scene: 'candy_counter.png',    item: 'kitchen_strawberry', items: 'strawberries', emoji: '🍪',
    colors: { base: '#d99a52', shaded: '#cf8c44', edge: '#a06a30' } },
  { what: 'cut the nougat',   treat: 'nougat bar',    shape: 'bar',   art: 'slice_nougat',  scene: 'party_lanterns.png',   item: 'balloon',            items: 'balloons',     emoji: '🍥',
    colors: { base: '#e8b6bc', shaded: '#dda0a8', edge: '#a86a72' } },
  { what: 'cut the party cake', treat: 'party cake',  shape: 'round', art: 'slice_cake',    scene: 'party_banner.png',     item: 'kitchen_cupcake',    items: 'cupcakes',     emoji: '🎂',
    colors: { base: '#f2a8bc', shaded: '#e890a8', edge: '#b06078' } },
  { what: 'cut the melon',    treat: 'watermelon',    shape: 'round', art: 'watermelon',    scene: 'party_balloons.png',   item: 'kitchen_orange',     items: 'oranges',      emoji: '🍉',
    colors: { base: '#e8635e', shaded: '#d9524d', edge: '#2c7a34' } },
]

/**
 * ⚠️ THE FRIENDS ARE THE REASON THE FRACTION EXISTS, and adding them is what turned this chapter
 * from an instrument into a story. Before them the board asked "how many of these fit", which is a
 * question about geometry with a shop painted behind it — the founder's word for it was that no
 * sense was being made. A fraction is what happens when a thing has to be SHARED, so the friends
 * arrive on their own legs, wait, and leave carrying a piece each. The denominator stops being a
 * number and becomes **how many people are waiting**.
 *
 * ⚠️ THE TABLE IS market.ts's `SHOPPERS`, IMPORTED RATHER THAN RETYPED. Its `facesLeft` was paid for
 * — a duck and a squirrel shipped walking backwards because a thumbnail said all six faced left, and
 * a script that scored ink mass agreed with the thumbnail. Two instruments, one wrong answer. A
 * second copy of that here would go stale the day either chapter re-cuts a strip.
 */
export { SHOPPERS as FRIENDS, shopperAt as friendAt } from './market'

/**
 * How many friends are at the counter right now.
 *
 * ⚠️ A FIT ROUND MUST OPEN WITH SOMEBODY ALREADY WAITING, and it shipped without one. The count was
 * simply `laid`, so at the start of a fit round the board asked *"how many friends can he give one
 * to?"* over an **empty counter** — a question about people who were not there, and the friends only
 * appeared after the child had already tapped. The whole reason this chapter has friends is that
 * they are what the question is ABOUT; asking before any of them exists puts it straight back to
 * being a question about geometry.
 *
 * So one friend is standing there from the first frame — she is why Milo cut a piece at all — and
 * each further piece brings the next one in on her own legs. That gives nothing away: there is
 * always exactly ONE more waiting than have been served, whatever the answer turns out to be, and
 * at the end nobody is left empty-handed because the last piece serves the last arrival.
 *
 * A take round is unchanged: there the row of friends IS the denominator and all of them are
 * already waiting, which is the thing the child reads the answer off.
 */
export const friendsShown = (ask: Ask, den: Den, laid: number) =>
  ask === 'take' ? den : Math.max(1, laid)
/** What Milo calls each of them, in the same order — so a miss line can name who went without. */
export const FRIEND_NAMES = ['Bunny', 'Duck', 'Squirrel', 'Lamb', 'Duckling', 'Chick'] as const
export const friendName = (i: number) => FRIEND_NAMES[i % FRIEND_NAMES.length]

/** The order a scored round lands on. Indexed STRAIGHT — never modulo, or the run wraps back onto
 *  the scene it opened with and the day stops being a day. */
export const orderOf = (round: number): Order => ORDERS[Math.min(round, ORDERS.length - 1)]

/** The SLOT fixes the treat and the scene; the TIER picks the denominator — so the story and the
 *  difficulty are independent, and the same pizza is halved at L1 and cut in thirds at L2. */
export function makeFrRound(d: 1 | 2 | 3, round: number, asked: readonly string[] = [], rnd: () => number = Math.random): FrRound {
  const den = pickDen(d, asked, rnd)
  const on = onFor(d, round)
  return {
    slot: Math.min(round, ORDERS.length - 1),
    den, on, ask: askFor(round), d,
    n: on === 'group' ? groupNFor(den, rnd) : 0,
  }
}

// ─── what Milo says ───────────────────────────────────────────────────────────────────
/**
 * ONE renderer for the ask, because SkillBeat speaks it and the bubble writes it, and those two
 * drifting apart is how a chapter ends up narrating one thing while the screen says another.
 *
 * ⚠️ IT NEVER NAMES THE ANSWER. A fit round must not say how many pieces fit and a take round must
 * not say how big the piece is — that is the whole question in each direction.
 */
/** A number word opens these sentences, and `numWord` is lower case for mid-sentence use. */
function sentence(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

export function askTextFor(r: FrRound): string {
  const o = orderOf(r.slot)
  const who = sentence(`${numWord(r.den)} friends`)
  if (r.on === 'group') {
    return `${who} are waiting, and there are ${numWord(r.n)} ${o.items}. Share them out so everyone gets the same!`
  }
  if (r.ask === 'fit') {
    return `Milo cut a piece of ${o.treat} this big. How many friends can he give one to? Lay them in!`
  }
  return `${who} want some ${o.treat}, and they must ALL get the same. Which piece is fair?`
}

/**
 * The words AFTER a commit, and only after — the notation is the summary of work the child has
 * already done, never a readout that confirms the answer while they are still working. That is
 * BlockYard's rule and the teen band's month-dial fault.
 */
export function revealFor(r: FrRound): string {
  const o = orderOf(r.slot)
  if (r.on === 'group') {
    return sentence(`${numWord(r.den)} friends, ${numWord(r.den)} equal piles — ${numWord(perShare(r))} ${o.items} each. One ${denWord(r.den)} of ${numWord(r.n)} is ${numWord(perShare(r))}!`)
  }
  if (r.ask === 'fit') {
    return sentence(`${numWord(r.den)} friends, ${numWord(r.den)} equal pieces. Each one gets a ${denWord(r.den)}!`)
  }
  return sentence(`${numWord(r.den)} equal pieces — a ${denWord(r.den)} each. Nobody got more than anybody else!`)
}

/**
 * Which mistake it was, so a miss teaches the specific confusion instead of saying "not quite".
 *
 * ⚠️ THE FIRST BRANCH IS THIS CHAPTER'S PAYLOAD, SAID AT THE MOMENT IT JUST COST THE CHILD — and it
 * is said in terms of the FRIENDS, because that is what makes it obvious rather than a rule to
 * memorise. A child who reaches for the half piece when three are waiting has the exact
 * misconception everything downstream trips over, that a bigger number under the line means a
 * bigger piece; "someone would miss out" is the same fact with a reason attached.
 *
 * Everything returned here is WRITTEN as well as spoken. A response that exists only as speech is
 * silence on the many devices with no usable voice, which reads as a tap that did nothing at all.
 *
 * ⚠️ IT MAY ONLY NAME SOMEBODY WHO IS ACTUALLY ON SCREEN, and it shipped naming someone who was not.
 * A take round has every friend waiting, so *"Duck has nothing!"* points at a duck the child can see
 * — that is the whole strength of it. A FIT round reveals them one per piece (`friendsShown`), so
 * the NEXT one has not walked in yet, and the line named an animal who was nowhere in the shop. The
 * founder read the result exactly right: the characters the words are about were not all there.
 *
 * Same reason the piece-size branch counts as take-only: it says how many are waiting, and a fit
 * round offers just one piece so it cannot be reached from there anyway — asserted rather than
 * assumed, because a table change could quietly make it reachable.
 */
export function missFor(r: FrRound, got: { den: Den; laid: number }): string {
  if (got.den !== r.den) {
    return got.den < r.den
      ? `Those pieces are too BIG — only ${numWord(got.den)} would fit and ${numWord(r.den)} friends are waiting. Try a smaller piece.`
      : `Those pieces are too SMALL — everyone would need more than one. Try a bigger piece.`
  }
  if (got.laid < r.den) {
    // On a take round the one who went without is standing right there, so name them.
    if (r.ask === 'take') return `Not yet — ${friendName(Math.max(0, got.laid))} has nothing! Keep sharing.`
    // On a fit round they have not arrived yet, so the line points AHEAD instead of at a stranger.
    return `Not yet — somebody else is still waiting for a piece. Keep going!`
  }
  return `That is one too many — there are only ${numWord(r.den)} friends.`
}

// ─── layout ───────────────────────────────────────────────────────────────────────────
/** Milo's walking sprite. He is the only thing in this chapter that travels. */
export const MILO = '/assets/characters/milo_side.png'
/** DERIVED from the registered sheet rather than typed here. A hand-copied aspect is a second source
 *  of truth that goes wrong silently the day the strip is re-cut — the sprite just draws stretched,
 *  which nothing checks. The gate asserts the sheet exists. */
export const MILO_ASPECT = SHEETS[MILO]?.cellAspect ?? 0.586

export { CHROME_PAD, menuBtn, chromeTop } from './chrome'
import { chromeTop } from './chrome'
/** The share of the height a shopkeeper gets — the SAME number CoinShop draws him at, imported
 *  rather than retyped, because two chapters disagreeing about how big Milo is is exactly how this
 *  one ended up with a 200px cap nobody noticed. */
import { MILO_SHARE } from './market'

/**
 * Every band on screen, in one place, derived rather than picked — because every founder-visible
 * layout fault in this repo has been a hand-tuned percentage that happened to hold at one size. The
 * gate drives THIS function, so it cannot check a second copy of the numbers.
 *
 * ⚠️ THE BAR IS MEASURED OFF MILO, NOT GUESSED. He stands bottom-left and the bar starts to the
 * right of him; two independent percentages of the width is exactly how StoryTime once put its
 * answer box 29px inside its own button row.
 *
 * ⚠️ AND THE BOARD YIELDS TO THE BAR, NOT THE OTHER WAY ROUND. The bar holds the tap targets — the
 * pieces the child lays — so it keeps its height and the world takes what is left.
 *
 * ⚠️ THE BUBBLE IS A BAND, NOT A FLOATING PANEL. Anchored freely at Milo's mouth it runs straight
 * over the board on a narrow frame, putting the two things a child must read at once on top of each
 * other. Stacked (chrome · bubble · board · bar) an overlap is not expressible, and the tail keeps
 * the words visibly HIS.
 */
export function layoutFor(vw: number, vh: number) {
  const short = vh < 470
  const top = chromeTop(short)

  const bubbleTop = top + (short ? 2 : 6)
  const bubbleH = short ? 46 : 60

  /**
   * ⚠️ HIS HEIGHT IS THE ROOM UNDER HIS OWN BUBBLE, NOT A FLAT CAP. The first cut was
   * `min(vh * 0.26, 200)`, so on any frame taller than 770 the 200 bound and he — and with him
   * every friend, at 0.62 of him — stopped growing: a 1000-tall window drew a 200px shopkeeper and
   * a 124px rabbit in a scene sized for the window. The founder read it as "characters chhote hai",
   * and he is the same character CoinShop draws at `MILO_SHARE` (0.40) of the height with no cap.
   * Buy height from the chrome, cap by the gap that actually exists.
   */
  const miloH = Math.max(74, Math.round(Math.min(
    (short ? 0.30 : MILO_SHARE) * vh,
    vh - (bubbleTop + bubbleH) - (short ? 6 : 14),
  )))
  const miloW = Math.round(miloH * MILO_ASPECT)
  const miloLeft = Math.round(vw * 0.05)
  const miloRight = miloLeft + miloW

  // The tray of pieces plus the take-back and commit buttons, all at a real tap size.
  const barH = short ? 62 : 82
  const barBottom = short ? 6 : 14
  const barLeft = miloRight + (short ? 8 : 18)
  const barW = Math.max(240, vw - barLeft - (short ? 10 : 22))

  const bubbleLeft = miloLeft
  // Capped on a roomy frame or it reads as a banner pinned to the top rather than as something Milo
  // said; a short frame needs every pixel, so it is not capped there.
  const bubbleW = Math.max(200, Math.min(vw - bubbleLeft - (short ? 12 : 26), short ? Infinity : 840))
  /** Where the tail points — Milo's mouth, as a share of the bubble's own width. */
  const tailPct = Math.min(40, Math.round(((miloW * 0.55) / bubbleW) * 100))

  const boardTop = bubbleTop + bubbleH + (short ? 4 : 10)
  const boardBand = vh - boardTop - barH - barBottom - (short ? 6 : 16)

  /**
   * ⚠️ THE FRIENDS STAND ON THE RIGHT, AND THE FOOD MOVES LEFT TO MAKE ROOM — they are not a
   * decoration squeezed in beside the board, they are the question. Landscape exists so a shopkeeper,
   * the thing being shared and the people waiting for it can all be on screen at once, which is also
   * why this band is the one that keeps its width when the frame gets narrow.
   */
  const friendH = Math.round(Math.min(miloH * 0.62, boardBand * 0.62))
  const friendsLeft = Math.round(vw * 0.54)
  const friendsW = vw - friendsLeft - (short ? 8 : 16)
  /** They stand on the floor of the board band, so they share a ground line with the counter. */
  const friendsBottom = barBottom + barH + (short ? 2 : 6)

  /** Where the food sits — centred in the room between Milo and the friends, never over either. */
  const boardCentre = Math.round((miloRight + friendsLeft) / 2)
  const boardRoom = Math.max(120, friendsLeft - miloRight - (short ? 10 : 20))
  /** A round treat is square, so height binds; a bar is drawn wider than tall from the same number.
   *  Capped by the room between Milo and the friends as well as by the band. */
  const wholePx = Math.max(88, Math.round(Math.min(boardBand, boardRoom, 260)))

  return {
    short, top, miloH, miloW, miloLeft, miloRight,
    barH, barBottom, barLeft, barW,
    bubbleTop, bubbleH, bubbleLeft, bubbleW, tailPct,
    boardTop, boardBand, wholePx, boardCentre, boardRoom,
    friendH, friendsLeft, friendsW, friendsBottom,
    /** Where the board's centre sits — in the room left of nothing and right of Milo, so the whole
     *  and the bar below it share one vertical axis instead of drifting apart. */
    boardCentrePct: Math.round(((barLeft + barW / 2) / vw) * 100),
  }
}

/** How wide a whole is drawn, for the shape it is. A bar has to read as a strip rather than a square
 *  or the "equal parts along a length" reading is lost — and it must still fit the board's width. */
export const wholeSize = (shape: Shape, px: number, room: number) =>
  shape === 'round'
    ? { w: px, h: px }
    : { w: Math.min(Math.round(px * 1.9), room), h: Math.round(px * 0.52) }
