/**
 * THE LOADING BAY (9–11, skill `dataGraphs`) — the pure module.
 *
 * Everything the chapter renders and grades from lives here, outside React, because the answering
 * surface is a WEBCAM and a webcam cannot be driven by a gate. The instrument is eyeball-only; this
 * file is where the maths, the ladder, the grader and every word the child reads are held to account
 * (see __tests__/loadingBayData.test.ts).
 *
 * THE VERB IS "SEND THE CART", AND THE STACKS ARE THE CHART. Every round a delivery lands and the
 * goods stand in four stacks — a pictograph whose bars are countable units of real cargo (the
 * curriculum's own words, "bar charts & pictographs"). The foreman needs an answer to act on, and
 * the correct answer sends the cart. Four readings of one chart:
 *
 *   most     "Which stack is the biggest?"                     → a stack   (1–4 from the left)
 *   howMany  "Load every melon onto the cart."                 → a count   (1–7)
 *   diff     "How many MORE pumpkins than sweets?"             → a count   (1–6)
 *   total    "The whole delivery goes out."                    → a count   (10–22)
 *
 * ⚠️ NO NUMERAL EXISTS ANYWHERE UNTIL AFTER THE COMMIT — not over a stack, not on the cart. That is
 * the fault the chapter this replaces shipped: `BarChart` drew every bar's value at half opacity,
 * i.e. visible, so "How many Cats?" had its answer printed above the bar and the chart was
 * decoration. The quantity is only ever the goods themselves.
 *
 * ⚠️ AND THE CART'S RUNNING COUNT IS HIDDEN UNTIL THE COMMIT TOO — founder's call, 2026-08-15. A
 * `total` round is four taps, so a visible counter climbing 6 → 11 → 13 → 22 does the adding for a
 * child who cannot add, and what the round then measures is "did you gather every column". The goods
 * on the cart are still countable, which is the honest floor: counting all of them IS a strategy a
 * nine-year-old has, and it is the one the chapter is teaching them to grow out of.
 *
 * ⚠️ THE GRADER TAKES WHERE THE GOODS CAME FROM, NOT JUST HOW MANY. Grading `diff` on the cart's
 * total alone accepts three items lifted off the WRONG stack, and `howMany` accepts any three items
 * at all. That is SliceShop's grader hole, which only mutation testing found.
 */
import { rint, pick, shuffle } from '@/core/rand'

/** The answer surface is two hands. A reading past this cannot be shown at all. */
export const MAX_FINGERS = 10
/** The tallest a stack may be. A bar you cannot count by eye is a bar with a number printed on it. */
export const MAX_UNITS = 7
/** How many stacks the chart has — and, on a `most` round, how many fingers may mean anything. */
export const STACKS = 4

// ─── the cargo ─────────────────────────────────────────────────────────────────────────
/**
 * `ink` is 1 / (the largest share of its own PNG the sprite's opaque pixels occupy), measured from
 * each file's alpha bounding box.
 *
 * ⚠️ WITHOUT IT THE CHART LIES. These sprites are square-padded to wildly different degrees — a
 * watermelon's ink fills 95% of its file, an apple's 57%, a basket's 40% — so drawn at one slot size
 * a melon renders nearly twice the visual weight of a basket. In a chapter whose entire question is
 * *which stack is biggest*, a column of fat melons reads taller than an equally tall column of small
 * apples, and the child is comparing the art instead of the data. Slot HEIGHT stays identical — that
 * is what keeps the bars honest; this only makes the goods fill the slots they are already given.
 */
export interface Good { src: string; name: string; plural: string; ink: number }

export const G = {
  apple: { src: '/assets/objects/apple.png', name: 'apple', plural: 'apples', ink: 1.76 },
  melon: { src: '/assets/objects/watermelon.png', name: 'melon', plural: 'melons', ink: 1.06 },
  bucket: { src: '/assets/objects/bucket.png', name: 'bucket', plural: 'buckets', ink: 1.38 },
  basket: { src: '/assets/objects/basket.png', name: 'basket', plural: 'baskets', ink: 2.31 },
  pumpkin: { src: '/assets/objects/pumpkin.png', name: 'pumpkin', plural: 'pumpkins', ink: 1.06 },
  cherry: { src: '/assets/objects/cherry.png', name: 'cherry', plural: 'cherries', ink: 1.79 },
  cookie: { src: '/assets/objects/cookie.png', name: 'cookie', plural: 'cookies', ink: 1.25 },
  candy: { src: '/assets/objects/candy.png', name: 'sweet', plural: 'sweets', ink: 1.54 },
} as const

/**
 * ⚠️ EVERY GOOD HAS A DISTINCT NAME AND A DISTINCT PICTURE, and that is a requirement rather than a
 * nicety: the question names one kind ("load every melon") and the child has to find its column.
 * Two goods a child would call by the same word make that round unanswerable.
 */
export const GOODS: readonly Good[] = Object.values(G)

// ─── rounds ────────────────────────────────────────────────────────────────────────────
export type QType = 'most' | 'howMany' | 'diff' | 'total'
export const Q_ALL: readonly QType[] = ['most', 'howMany', 'diff', 'total'] as const
export type Tier = 1 | 2 | 3

export interface LbRound {
  qType: QType
  /** the four kinds of cargo standing in the bay, left to right */
  goods: Good[]
  /** how many of each — one per good, always DISTINCT so `most` has exactly one answer */
  counts: number[]
  /** the stack the question is about (`howMany`, and the BIGGER one on `diff`) */
  focus: number
  /** the stack being compared against on `diff`; equal to `focus` otherwise */
  other: number
  /** ⚠️ ON `most` THIS IS A STACK INDEX; on every other type it is a COUNT. */
  answer: number
  tag: string
  /**
   * ⚠️ THREE ZONES, NOT ONE SENTENCE (docs/teen-12-14-math-audit.md §1 — the clarity spec).
   * `prompt` says what the goods ARE and the rule that applies, in plain language with no UI verbs;
   * the instrument is the math hero; `instructionFor` is the one verb-led action, in its own chip.
   */
  prompt: string
  /**
   * ⚠️ ZONE 3 IS THE ONLY ZONE THAT KNOWS HOW THE CHILD ANSWERS, so the round stores the stem and
   * the gesture is appended per input by `instructionFor` / `sayFor`. Baking "hold up that many
   * fingers" into the round tells a tap-path child to do something they cannot.
   */
  work: string
  /** what the foreman logs once it is right — printed only AFTER the commit */
  done: string
}

// ─── the value: what is on the cart ────────────────────────────────────────────────────
/**
 * ⚠️ THE VALUE LIVES HERE, WITH THE GRADER, so the gate drives the same pair the chapter does.
 * `load[i]` is how many of stack `i` are on the cart; `pick` is the stack chosen on a `most` round.
 */
export interface CartV { load: number[]; pick: number | null }
export const EMPTY: CartV = { load: [0, 0, 0, 0], pick: null }

/**
 * ⚠️ THE ONLY WAY GOODS GET ONTO THE CART. The camera (via `GameConfig.hand.enter`), a tap on one
 * item and a tap on a whole stack all come through here, so the three paths cannot drift and
 * `graded` never learns which one moved it.
 */
export function loadStack(r: LbRound, v: CartV, i: number, n: number): CartV {
  if (i < 0 || i >= STACKS) return v
  const load = v.load.slice()
  load[i] = Math.max(0, Math.min(r.counts[i], Math.round(n)))
  return { ...v, load }
}
/** A `most` round's answer: which stack the cart goes to. Out of range is not an answer. */
export function pickStack(v: CartV, i: number): CartV {
  return i >= 0 && i < STACKS ? { ...v, pick: i } : v
}
export const loaded = (v: CartV) => v.load.reduce((s, n) => s + n, 0)

// ─── words ─────────────────────────────────────────────────────────────────────────────
export const some = (n: number, g: Good) => `${n} ${n === 1 ? g.name : g.plural}`

/** How an answer is given, per input. The ONE place either gesture is named. */
export type Answering = 'hand' | 'tap'

/**
 * Zone 3 — the one verb-led action, in the wording of the surface actually on screen.
 *
 * ⚠️ A `total` ROUND HAS NO HAND PATH AND MUST SAY SO. Its answers run to 22 and two hands hold
 * ten, so the gesture does not ship on that round — chapter-craft-ar's *a gesture does not ship on a
 * round that gives it nothing to aim at*, and *say so on screen when it happens*, or the camera
 * simply looks broken for one round in four.
 */
export function instructionFor(r: LbRound, input: Answering): string {
  if (r.qType === 'total' && input === 'hand') {
    return `${r.work} tap each stack onto the cart — this one is more than two hands can show — and send it.`
  }
  if (input === 'hand') {
    return r.qType === 'most'
      ? `${r.work} hold up its number — 1 to 4, counting from the left.`
      : `${r.work} hold up that many fingers.`
  }
  return r.qType === 'most'
    ? `${r.work} tap that stack and send the cart.`
    : r.qType === 'total'
      ? `${r.work} tap each stack onto the cart and send it.`
      : `${r.work} tap them onto the cart one at a time, and send it.`
}
/**
 * ⚠️ WHAT MILO *SAYS* CARRIES ZONES 1 AND 2 AND STOPS THERE, which is the house pattern (The Coin
 * Tray, The Pizza Counter) rather than an oversight. The shell fixes `task.say` when the task is
 * built and the child may switch input afterwards, so a spoken line naming a gesture would address
 * the wrong surface half the time — the exact defect the re-word-every-gesture-line rule is about.
 * Zone 3 is rendered live from `instructionFor`, which knows the input.
 */

/**
 * What the board prints beside the question — the math, never the answer.
 *
 * ⚠️ IT MAY NAME THE OPERATION AND MAY NOT NAME A QUANTITY. `pumpkins − sweets = ?` states the sum
 * the round is asking for, which the prompt already says in words; `6 − 3` would be the whole
 * question answered above the chart.
 */
export function badgeFor(r: LbRound): string {
  if (r.qType === 'most') return 'biggest?'
  if (r.qType === 'howMany') return `${r.goods[r.focus].plural} = ?`
  if (r.qType === 'diff') return `${r.goods[r.focus].plural} − ${r.goods[r.other].plural} = ?`
  return 'every stack = ?'
}

// ─── the ladder ────────────────────────────────────────────────────────────────────────
/**
 * Values are capped at `MAX_UNITS` and kept DISTINCT. Distinct guarantees `most` has exactly one
 * answer; the cap keeps every stack countable by eye, which is the whole point of a pictograph.
 *
 * ⚠️ THE TIER GROWS THE POOL THE COUNTS ARE DRAWN FROM, so the bars get taller and closer together
 * — two stacks of 6 and 7 are a harder *look at it* than 2 and 7.
 */
export function fourCounts(d: Tier): number[] {
  const hi = d === 1 ? 5 : d === 2 ? 6 : 7
  return shuffle([1, 2, 3, 4, 5, 6, 7].slice(0, hi)).slice(0, STACKS)
}

/** Four different kinds of cargo, in a random order — the dressing, which `sig` deliberately ignores. */
export const fourGoods = (): Good[] => shuffle(GOODS.slice()).slice(0, STACKS)

const topOf = (counts: number[]) => counts.reduce((b, c, i) => (c > counts[b] ? i : b), 0)

export function mkMost(goods: Good[], counts: number[]): LbRound {
  const top = topOf(counts)
  return {
    qType: 'most', goods, counts, focus: top, other: top, answer: top,
    tag: 'Biggest stack',
    prompt: 'A delivery has landed and the goods are in four stacks. The biggest one is the one that reaches highest — you can see it without counting.',
    work: 'Work out which stack is biggest, then',
    done: `The ${goods[top].plural} it is.`,
  }
}

export function mkHowMany(goods: Good[], counts: number[], i: number): LbRound {
  return {
    qType: 'howMany', goods, counts, focus: i, other: i, answer: counts[i],
    tag: 'Count a stack',
    prompt: `The foreman wants every ${goods[i].name} in the yard counted and put on the cart. Nothing else goes on.`,
    work: `Work out how many ${goods[i].plural} there are, then`,
    done: `${some(counts[i], goods[i])}. Logged.`,
  }
}

export function mkDiff(goods: Good[], counts: number[], a: number, b: number): LbRound {
  return {
    qType: 'diff', goods, counts, focus: a, other: b, answer: counts[a] - counts[b],
    tag: 'How many more',
    prompt: `There are more ${goods[a].plural} than ${goods[b].plural}. Match them up one for one and some ${goods[a].plural} are left over — those spare ones are how many MORE.`,
    work: `Work out how many more ${goods[a].plural} there are, then`,
    done: `${counts[a] - counts[b]} spare. Logged.`,
  }
}

export function mkTotal(goods: Good[], counts: number[]): LbRound {
  const total = counts.reduce((s, c) => s + c, 0)
  return {
    qType: 'total', goods, counts, focus: 0, other: 0, answer: total,
    tag: 'The whole delivery',
    prompt: 'The whole delivery goes out today — every stack in the bay, added together.',
    work: 'Work out how many that is altogether, then',
    done: `${total} altogether. Logged.`,
  }
}

/**
 * ⚠️ `total` LIVES AT L3 ALONE, and that is a round-budget decision rather than a difficulty one.
 * Adding four numbers is the hardest reading here, and `coverage` is what guarantees it is met
 * before the mastery exit may fire — see GameConfig.coverage for the arithmetic.
 */
const POOL: Record<Tier, QType[]> = {
  1: ['most', 'most', 'howMany'],
  2: ['most', 'howMany', 'diff'],
  3: ['howMany', 'diff', 'total'],
}

/**
 * `asked` is the coverage bookkeeping the shell feeds back — the readings already served this run.
 *
 * ⚠️ IGNORING IT IS NOT HARMLESS. The config declares `coverage`, so the mastery exit is withheld
 * until all four readings have been asked; a generator that keeps rolling dice simply denies a
 * strong child the early finish. Deliberate while a gap exists and RANDOM once it closes —
 * hardest-first for ever would lock the chapter onto `total` and destroy the variety coverage
 * exists to protect.
 */
export function makeRound(d: Tier, asked: readonly string[] = []): LbRound {
  const goods = fourGoods()
  const counts = fourCounts(d)
  const pool = POOL[d]
  const unmet = Q_ALL.filter(q => !asked.includes(q))
  const t: QType = unmet.length ? (unmet.find(q => pool.includes(q)) ?? pick(pool)) : pick(pool)

  if (t === 'most') return mkMost(goods, counts)
  if (t === 'total') return mkTotal(goods, counts)
  if (t === 'diff') {
    const order = shuffle([0, 1, 2, 3])
    let a = order[0], b = order[1]
    if (counts[a] < counts[b]) { const s = a; a = b; b = s }
    return mkDiff(goods, counts, a, b)
  }
  return mkHowMany(goods, counts, rint(0, STACKS - 1))
}

// ─── grading ───────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ WHERE THE GOODS CAME FROM IS PART OF THE ANSWER — see the header. A `howMany` round asks for
 * every melon *and nothing else*, so three items lifted off three different stacks is not three
 * melons however the cart's total reads.
 */
export function graded(r: LbRound, v: CartV): boolean {
  if (r.qType === 'most') return v.pick === r.answer
  if (r.qType === 'total') return v.load.every((n, i) => n === r.counts[i])
  return v.load[r.focus] === r.answer && v.load.every((n, i) => i === r.focus || n === 0)
}

/**
 * Never names the answer, and never differs between a round the child got nearly right and one they
 * did not — a miss line that narrowed with the guess would be hot/cold across attempts.
 *
 * ⚠️ IT TAKES ONLY THE ROUND. Anything it can see of the child's cart would leak the direction they
 * were out by, which is the same oracle one step quieter.
 */
export function missFor(r: LbRound): string {
  if (r.qType === 'most') return 'Not that one — look for the stack that reaches highest, the one with the most in it.';
  if (r.qType === 'howMany') return `Not quite — every single ${r.goods[r.focus].name} goes on the cart, and nothing else.`
  if (r.qType === 'diff') return `Not quite — load only the ${r.goods[r.focus].plural} left over once each one has a ${r.goods[r.other].name} beside it.`
  return 'Not the whole delivery yet — every stack has to go on the cart.'
}

/**
 * A cart that is not an attempt — redirect instead of scoring it, the same call the colouring
 * chapter makes for a tap that lands on the ink.
 *
 * ⚠️ EVERY REFUSAL THE GENERATOR MAKES NEEDS A MATCHING REFUSAL AT THE ANSWER. On a `most` round a
 * hand holding up 7 names no stack at all — grading that spends one of the child's ten rounds on a
 * fact the chart is showing them. It returns null (i.e. grades normally) for everything the surface
 * CAN express, so a genuinely wrong stack still costs a mark.
 *
 * ⚠️ IT ONLY FIRES ON TOO MANY, NEVER ON TOO FEW, AND THAT IS THE WHOLE POINT OF THE BOUND. Written
 * as `n < 1 || n > STACKS` it fired at a count of ZERO — i.e. at a child with no hand in frame at
 * all — so opening the camera door printed *"There are only 4 stacks"* over a chapter nobody had
 * held anything up to. A redirect that describes something the child did not do is worse than
 * silence, and it displaced the instruction that should have been there. Caught by opening the
 * camera door, not by reading. An empty frame and a fist are the shell's business (`hand.ready`),
 * and it says *"Show Milo your hand"*.
 */
export function nudgeFor(r: LbRound, n: number): string | null {
  if (r.qType === 'most' && n > STACKS) return `There are only ${STACKS} stacks — hold up 1, 2, 3 or 4.`
  return null
}

// ─── demo / re-teach ───────────────────────────────────────────────────────────────────
/**
 * The worked example, as data, so the gate drives the same beats the screen plays.
 *
 * ⚠️ THE PICTURE MUST AGREE WITH THE SENTENCE ON EVERY BEAT. The Supply Run's demo narrated "only 2
 * left — that stays behind" while its own numbers put the 2 in a van; nothing could see it, because
 * the words were right and the counts were right and only their pairing was wrong. So the cart state
 * is part of the beat and the gate reads the two together.
 */
export interface Beat { say: string; v: CartV }
const cart = (load: number[], pick: number | null = null): CartV => ({ load, pick })

export function explainBeats(r: LbRound): Beat[] {
  const g = r.goods
  if (r.qType === 'most') {
    return [
      { say: 'A delivery just landed. Four stacks — like counting the goals four friends scored.', v: EMPTY },
      { say: 'The biggest one reaches highest. You can see it without counting a thing.', v: EMPTY },
      { say: `${g[r.answer].plural.replace(/^./, c => c.toUpperCase())} it is — that is where the cart goes.`, v: cart([0, 0, 0, 0], r.answer) },
    ]
  }
  if (r.qType === 'howMany') {
    const one = [0, 0, 0, 0]; one[r.focus] = 1
    const all = [0, 0, 0, 0]; all[r.focus] = r.answer
    return [
      { say: `The foreman wants every ${g[r.focus].name} counted, and nothing else.`, v: EMPTY },
      { say: 'They go on the cart one at a time — that is the counting, done with your hands.', v: cart(one) },
      { say: `${some(r.answer, g[r.focus])}. That is what the stack was holding.`, v: cart(all) },
    ]
  }
  if (r.qType === 'diff') {
    const paired = [0, 0, 0, 0]
    const spare = [0, 0, 0, 0]; spare[r.focus] = r.answer
    return [
      { say: `More ${g[r.focus].plural} than ${g[r.other].plural} — like one friend outscoring another.`, v: cart(paired) },
      { say: `Give every ${g[r.other].name} a ${g[r.focus].name} to stand beside. ${some(r.counts[r.other], g[r.other])}, so ${r.counts[r.other]} are spoken for.`, v: cart(paired) },
      { say: `${r.answer} left over — that is how many MORE. You cannot see that one; you take it away.`, v: cart(spare) },
    ]
  }
  const half = [r.counts[0], r.counts[1], 0, 0]
  return [
    { say: 'The whole delivery goes out today, so every stack is on the manifest.', v: EMPTY },
    { say: `${r.counts[0]} and ${r.counts[1]} makes ${r.counts[0] + r.counts[1]} so far.`, v: cart(half) },
    { say: `And ${r.counts[2]} and ${r.counts[3]} more makes ${r.answer} altogether.`, v: cart(r.counts.slice()) },
  ]
}

/**
 * The rounds Milo works through before the child tries one, and the guided round.
 *
 * ⚠️ FIXED, NOT GENERATED. A walkthrough drawn from `makeRound` is a different lesson every run, and
 * the hardest reading has to be one of them — chapter-craft's *the worked examples must include the
 * hardest case, not avoid it*. `total` is taught by the re-teach, which re-narrates the child's own
 * round; three worked examples before anything is scored is already a long sit.
 */
export const DEMO: LbRound[] = [
  mkMost([G.apple, G.melon, G.bucket, G.basket], [3, 5, 2, 4]),
  mkHowMany([G.cherry, G.melon, G.bucket, G.cookie], [4, 2, 5, 3], 0),
  mkDiff([G.pumpkin, G.candy, G.bucket, G.melon], [6, 3, 2, 5], 0, 1),
]
export const GUIDED: LbRound = mkHowMany([G.apple, G.melon, G.bucket, G.basket], [2, 5, 3, 4], 3)

// ─── layout ────────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ THERE IS NONE ANY MORE, AND THAT IS THE PAYOFF OF THE PORT. The chapter this file was cut out
 * of carried `bayLayout` — a ground line per painted backdrop, a cart parked in the foreground to
 * dodge a speech bubble, a Milo lane, a chrome band — roughly 70 lines of arithmetic swept at ten
 * viewport sizes. GameShell owns the bands now and `FitSlot` scales the instrument into whatever is
 * left, so all of it went with the painted world.
 *
 * What did NOT go is everything above: the ladder, the grader and the words. That split — maths and
 * words in the module, layout in the shell — is the whole reason ten chapters share one engine.
 */
export {}
