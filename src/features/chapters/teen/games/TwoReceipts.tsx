'use client'
/**
 * TwoReceipts — the Systems & Matrices chapter (17–18) as a PLAYABLE GAME.
 *
 * World: TWO RECEIPTS. Three of A and two of B came to £X; one of A and four of B
 * came to £Y. Nobody wrote down what ONE of each costs — and that is a 2×2 system,
 * asked exactly the way it turns up in life:
 *   • a MATRIX is just the table of quantities off the two receipts
 *   • the SOLUTION is the price of one of each
 *   • the DETERMINANT is whether the two receipts tell you anything new at all —
 *     two receipts for the same basket at a different scale cannot be untangled
 *
 *   • BUILD → MatrixPad: the answer IS a matrix, built entry by entry. This is the
 *             primitive the chapter could not exist without (plan §4).
 *   • BUILD → PartsBuilder: the pair of prices, which is the whole point.
 *   • TAP   → AnswerPad: the determinant, and one entry of a product.
 *   • PICK  → SpecPicker, ONCE — see the deviation note below.
 *
 * The math is the old SystemsMatricesTeenLesson.makeRound, same L1/L2/L3 ramp.
 *
 * ⚠️ TWO DEVIATIONS FROM THE PLAN, both deliberate:
 *   • Plan §5.2 says ZERO pickers here. "One / none / infinitely many solutions" is
 *     in this chapter's own `conceptsConfirmed`, and "infinitely many" is not a
 *     number — a pad offering 0, 1, 2, 3 would be a badly-posed board for a child
 *     who correctly thinks "infinite" and finds no option. So it is a 3-card pick,
 *     the honest rung-3 case. That takes the band to 10 pickers, exactly the §3
 *     budget and not past it.
 *   • Plan §5.2 wants matrix MULTIPLICATION built on the MatrixPad. Building all
 *     four entries of a product means four dot products per question, which is a
 *     slog rather than a lesson; the old lesson asked for one entry and so does
 *     this. Addition and scalar multiply DO build the whole result, which is where
 *     the pad earns its place.
 */
import { type ReactElement } from 'react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SpecPicker, PartsBuilder, MatrixPad, numChoices } from './parts/gameKit'
import { rint, pick } from '@/core/rand'
import { disp } from '@/core/fmt'

const P: Palette = {
  nightTop: '#22261c', nightBot: '#0b0d08',
  cream: '#f6f4e6', creamSoft: 'rgba(246,244,230,0.82)',
  inkOnPaper: '#22261c', mutedOnPaper: '#98a084',
  gold: '#d8e06b', goldDeep: '#8f9a2a',
  coral: '#ffa07e', coralDeep: '#dd6636', mint: '#84dba6',
  glass: 'rgba(34,38,28,0.62)', glassBorder: 'rgba(246,244,230,0.2)',
}

const nz = (lo: number, hi: number) => { let v = 0; while (v === 0) v = rint(lo, hi); return v }
const M = (m: number[][]) => `[[${m[0].join(', ')}], [${m[1].join(', ')}]]`

type V =
  | { k: 'mat'; m: number[][] }
  | { k: 'num'; n: number }
  | { k: 'parts'; a: number; b: number }
  | { k: 'pick'; id: string }

interface Task extends BaseTask {
  kind: 'solve' | 'count' | 'add' | 'scalar' | 'det' | 'product'
  n?: number; pad?: number[]
  pa?: number; pb?: number; labels?: [string, string]
  /** the matrix to build, and the one the pad STARTS from — see `addTask` */
  mat?: number[][]; from?: number[][]
  correctId?: string; choices?: { id: string; label: string }[]
}

const ZERO2 = () => [[0, 0], [0, 0]]

// ── L1 · what does ONE of each cost ───────────────────────────────────────────
/** The prices are chosen FIRST and the receipts built from them, so both totals are
 *  always whole pounds and the answer is always a real price. */
function solveTask(hard = false): Task {
  const x = rint(1, hard ? 9 : 6)
  const y = rint(1, hard ? 9 : 6)
  const a1 = rint(1, 4), b1 = rint(1, 4)
  let a2 = rint(1, 4), b2 = rint(1, 4), guard = 0
  while (a1 * b2 - a2 * b1 === 0 && guard++ < 40) { a2 = rint(1, 4); b2 = rint(1, 4) }
  const c1 = a1 * x + b1 * y
  const c2 = a2 * x + b2 * y
  return {
    kind: 'solve', title: hard ? 'The awkward pair' : 'Two receipts', tone: 'a',
    badge: `${a1}A + ${b1}B = £${c1}\n${a2}A + ${b2}B = £${c2}`, showEquals: false,
    prompt: 'What does one of each cost?',
    context: `Two receipts from the same shop. The first is ${a1} of item A and ${b1} of item B for £${c1}; the second is ${a2} of A and ${b2} of B for £${c2}. Neither one alone can tell you a single price — but together they pin both down, because the same two prices have to work for both.`,
    instruction: 'Build the two prices, then total it.',
    say: `${a1} of A and ${b1} of B cost ${c1} pounds. ${a2} of A and ${b2} of B cost ${c2} pounds. What does one of each cost?`,
    work: [
      `Scale the receipts so one item cancels, then subtract to leave a single price.`,
      `That gives A = £${x}.`,
      `Put £${x} back into the first receipt: ${a1}×${x} + ${b1}B = ${c1}, so B = £${y}.`,
    ],
    pa: x, pb: y, labels: ['price of A', 'price of B'],
  }
}

/** ⚠️ The chapter's ONE picker — see the header. */
function countTask(): Task {
  const k = rint(2, 3)
  const a = rint(1, 4), b = rint(1, 4), c = rint(6, 20)
  return {
    kind: 'count', title: 'No new news', tone: 'b',
    badge: `${a}A + ${b}B = £${c}\n${a * k}A + ${b * k}B = £${c * k}`, showEquals: false,
    prompt: 'How many price pairs fit?',
    context: `Look at the second receipt against the first: every quantity, and the total, is exactly ${k} times bigger. It is the same basket bought ${k} times over, so it cannot tell you anything the first one did not — and plenty of different price pairs would explain both.`,
    instruction: 'Choose how many, then lock it in.',
    say: 'The second receipt is just the first one scaled up. How many price pairs satisfy both?',
    work: [
      `The second receipt is ${k} times the first, top to bottom.`,
      'So it is not a second piece of information — it is the same one, restated.',
      'Any pair of prices that fits the first receipt fits the second too, and there are infinitely many of those.',
    ],
    correctId: 'inf',
    choices: [
      { id: 'one', label: 'Exactly one' },
      { id: 'none', label: 'None at all' },
      { id: 'inf', label: 'Infinitely many' },
    ],
  }
}

// ── L2 · the receipts as a table, and what you can do to it ───────────────────
function addTask(): Task {
  const A = [[rint(1, 6), rint(1, 6)], [rint(1, 6), rint(1, 6)]]
  const B = [[rint(1, 6), rint(1, 6)], [rint(1, 6), rint(1, 6)]]
  const R = A.map((row, i) => row.map((v, j) => v + B[i][j]))
  return {
    kind: 'add', title: 'Both weeks', tone: 'a',
    badge: `${M(A)}\n+ ${M(B)}`, showEquals: false,
    prompt: 'What did the two weeks come to?',
    context: 'Each table holds one week of shopping: the top row is what the first person bought, the bottom row the second, and the two columns are items A and B. Adding two weeks together means adding the matching cells — the A-count to the A-count, never across.',
    instruction: 'Build the combined table, then total it.',
    say: 'Add these two tables together, entry by matching entry.',
    work: [
      'Matrix addition is done cell by matching cell.',
      `Top row: ${A[0][0]}+${B[0][0]} and ${A[0][1]}+${B[0][1]}.`,
      `Bottom row: ${A[1][0]}+${B[1][0]} and ${A[1][1]}+${B[1][1]}.`,
    ],
    // ⚠️ The pad STARTS at A rather than at zero. Building [[12,16],[20,8]] up from
    // nothing is 56 taps — a slog, not a lesson — and starting from the first table
    // also models what addition actually is: take A, then add B onto it. A is
    // already on the board, so nothing is given away.
    mat: R, from: A,
  }
}

/** ⚠️ k is 2..3, not 2..4. At k = 4 the pad needs ~36 taps even starting from A. */
function scalarTask(): Task {
  const k = rint(2, 3)
  const A = [[rint(1, 5), rint(1, 5)], [rint(1, 5), rint(1, 5)]]
  const R = A.map((row) => row.map((v) => v * k))
  return {
    kind: 'scalar', title: `${k} times over`, tone: 'b',
    badge: `${k} × ${M(A)}`, showEquals: false,
    prompt: 'What does the whole order become?',
    context: `This is one week's shopping, and the same order is being placed ${k} times over. Everything in the table scales together — every single cell is multiplied by ${k}, none of them is left behind.`,
    instruction: 'Build the scaled table, then total it.',
    say: `Multiply this whole table by ${k}.`,
    work: [
      `A number outside the table multiplies EVERY cell inside it.`,
      `So each entry becomes ${k} times what it was.`,
    ],
    mat: R, from: A,
  }
}

function detTask(): Task {
  const a = nz(-5, 5), b = nz(-5, 5), c = nz(-5, 5), d = nz(-5, 5)
  const n = a * d - b * c
  return {
    kind: 'det', title: 'Any new news?', tone: 'a',
    badge: `det [[${a}, ${b}], [${c}, ${d}]]`, answerLabel: '=',
    prompt: 'What is the determinant?',
    context: 'The determinant is one number that says whether two receipts are really two pieces of information. Multiply the two cells on the leading diagonal, multiply the other two, and subtract. Land on zero and the second receipt was telling you nothing new.',
    padInstruction: 'Tap the determinant.',
    say: 'Find the determinant of this two by two table.',
    work: [
      `ad − bc, so (${disp(a)})(${disp(d)}) − (${disp(b)})(${disp(c)}).`,
      `That is ${disp(a * d)} − ${disp(b * c)} = ${disp(n)}.`,
    ],
    // ad + bc is the "forgot the minus" slip; bc − ad is the reversed order.
    n, pad: [a * d + b * c, b * c - a * d, a * d],
  }
}

// ── L3 · quantities times prices ──────────────────────────────────────────────
function productTask(): Task {
  const A = [[rint(1, 5), rint(1, 5)], [rint(1, 5), rint(1, 5)]]
  const B = [[rint(1, 5), rint(1, 5)], [rint(1, 5), rint(1, 5)]]
  const r = rint(0, 1), c = rint(0, 1)
  const n = A[r][0] * B[0][c] + A[r][1] * B[1][c]
  const where = `${r === 0 ? 'top' : 'bottom'}-${c === 0 ? 'left' : 'right'}`
  return {
    kind: 'product', title: 'Quantities × prices', tone: 'b',
    badge: `${M(A)} × ${M(B)}`, answerLabel: `${where} =`,
    prompt: `What is the ${where} entry?`,
    context: `Multiplying two tables is not cell against matching cell — each entry comes from a whole ROW meeting a whole COLUMN. For the ${where} one, run along row ${r + 1} of the first table and down column ${c + 1} of the second, multiplying as you go, then add the results.`,
    padInstruction: `Tap the ${where} entry.`,
    say: `Multiply these two tables. What is the ${where} entry?`,
    work: [
      `Row ${r + 1} of the first is ${A[r][0]} and ${A[r][1]}; column ${c + 1} of the second is ${B[0][c]} and ${B[1][c]}.`,
      `Pair them up: ${A[r][0]}×${B[0][c]} + ${A[r][1]}×${B[1][c]}.`,
      `That is ${A[r][0] * B[0][c]} + ${A[r][1] * B[1][c]} = ${n}.`,
    ],
    // Adding the cells instead of the products is the classic slip here.
    n, pad: [A[r][0] + B[0][c] + A[r][1] + B[1][c], A[r][0] * B[0][c], n + 1],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return Math.random() < 0.7 ? solveTask() : countTask()
  if (d === 2) {
    const roll = Math.random()
    return roll < 0.4 ? addTask() : roll < 0.7 ? scalarTask() : detTask()
  }
  return Math.random() < 0.5 ? solveTask(true) : productTask()
}

// ── walkthrough: two receipts, then adding two weeks together ─────────────────
const DEMO_SOLVE: Task = {
  kind: 'solve', title: 'Two receipts', badge: '3A + 2B = £16\n1A + 4B = £22', tone: 'a',
  prompt: '', say: '', work: [], pa: 2, pb: 5, labels: ['price of A', 'price of B'],
}
const DEMO_SOLVE_STEPS: DemoStep<V>[] = [
  { say: 'Two receipts from the same shop, and nobody wrote down what one of anything costs.', value: { k: 'parts', a: 0, b: 0 }, board: '3A + 2B = £16' },
  { say: 'The first says three of A and two of B came to sixteen pounds. On its own that is hopeless — loads of price pairs would do it.', value: { k: 'parts', a: 0, b: 0 }, board: 'one receipt is not enough' },
  { say: 'The second says one of A and four of B came to twenty two. Also hopeless on its own. But the same two prices have to explain both.', value: { k: 'parts', a: 0, b: 0 }, board: '1A + 4B = £22' },
  { say: 'So make one of the items cancel. Multiply the whole second receipt by three: three of A and twelve of B, sixty six pounds.', value: { k: 'parts', a: 0, b: 0 }, board: '3A + 12B = £66' },
  { say: 'Both now have three of A. Take the first away from it and the A vanishes completely: ten of B is fifty pounds.', value: { k: 'parts', a: 0, b: 0 }, board: '10B = £50' },
  { say: 'So B is five pounds.', value: { k: 'parts', a: 0, b: 5 }, board: 'B = £5' },
  { say: 'Now put that back into either receipt. Three of A plus two fives is sixteen, so three of A is six, and A is two pounds.', value: { k: 'parts', a: 2, b: 5 }, board: 'A = £2' },
  { say: 'Two pounds and five pounds. Check it against the second receipt: two, plus four fives, is twenty two. Both agree.', value: { k: 'parts', a: 2, b: 5 }, board: 'A = £2 · B = £5' },
]

const DEMO_ADD: Task = {
  kind: 'add', title: 'Both weeks', badge: '[[2, 1], [3, 4]]\n+ [[1, 5], [2, 2]]', tone: 'a',
  prompt: '', say: '', work: [], mat: [[3, 6], [5, 6]],
}
const DEMO_ADD_STEPS: DemoStep<V>[] = [
  { say: 'Now the shopping as a table. Top row is what one person bought, bottom row the other; the columns are items A and B.', value: { k: 'mat', m: [[0, 0], [0, 0]] }, board: '[[2, 1], [3, 4]]' },
  { say: 'Here is a second week in the same shape. To combine them you add the cells that match — never across.', value: { k: 'mat', m: [[0, 0], [0, 0]] }, board: '+ [[1, 5], [2, 2]]' },
  { say: 'Top left: two A last week, one A this week. Three.', value: { k: 'mat', m: [[3, 0], [0, 0]] }, board: '2 + 1 = 3' },
  { say: 'Top right: one B and five B. Six.', value: { k: 'mat', m: [[3, 6], [0, 0]] }, board: '1 + 5 = 6' },
  { say: 'Bottom left: three and two. Five.', value: { k: 'mat', m: [[3, 6], [5, 0]] }, board: '3 + 2 = 5' },
  { say: 'Bottom right: four and two. Six.', value: { k: 'mat', m: [[3, 6], [5, 6]] }, board: '4 + 2 = 6' },
  { say: 'And that is the whole thing. A table keeps each item in its own column, so adding two weeks never mixes the A count up with the B count.', value: { k: 'mat', m: [[3, 6], [5, 6]] }, board: '[[3, 6], [5, 6]]' },
]

// ══════════════════════════════════════════════════════════════════════════════
export const CONFIG: GameConfig<V, Task> = {
  chapterId: 'systemsMatrices',
  title: 'TWO RECEIPTS',
  ticketLabel: 'receipts',
  palette: P,
  motif: '🧾',
  makeTask,
  answerPad: (t) => (t.kind === 'det' || t.kind === 'product' ? numChoices(t.n ?? 0, t.pad ?? []) : []),
  // REQUIRED: V is a tagged union (docs/lessons.md — the 15–16 prod bug).
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) =>
    t.kind === 'add' || t.kind === 'scalar' ? { k: 'mat', m: (t.from ?? ZERO2()).map((r) => [...r]) }
      : t.kind === 'solve' ? { k: 'parts', a: 0, b: 0 }
        : t.kind === 'count' ? { k: 'pick', id: '' }
          : { k: 'num', n: 0 },
  grade: (t, v) =>
    t.kind === 'add' || t.kind === 'scalar'
      ? v.k === 'mat' && (t.mat ?? []).every((row, i) => row.every((n, j) => v.m[i]?.[j] === n))
      : t.kind === 'solve' ? v.k === 'parts' && v.a === t.pa && v.b === t.pb
        : t.kind === 'count' ? v.k === 'pick' && v.id === t.correctId
          : v.k === 'num' && v.n === t.n,
  revealText: (t) =>
    t.kind === 'add' || t.kind === 'scalar' ? M(t.mat ?? ZERO2())
      : t.kind === 'solve' ? `A = £${t.pa}, B = £${t.pb}`
        : t.kind === 'count' ? (t.choices?.find((c) => c.id === t.correctId)?.label ?? '')
          : disp(t.n ?? 0),
  glide: (t, _f, setValue, later) => later(() => setValue(
    t.kind === 'add' || t.kind === 'scalar' ? { k: 'mat', m: t.mat ?? ZERO2() }
      : t.kind === 'solve' ? { k: 'parts', a: t.pa ?? 0, b: t.pb ?? 0 }
        : t.kind === 'count' ? { k: 'pick', id: t.correctId ?? '' }
          : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }): ReactElement => {
    if (task.kind === 'count') {
      return <SpecPicker P={palette} choices={task.choices ?? []} value={value.k === 'pick' ? value.id : ''}
        setValue={(id) => setValue({ k: 'pick', id })} correct={task.correctId} disabled={disabled} reveal={reveal}
        onCommit={(id) => onCommit({ k: 'pick', id })} commitLabel="LOCK IN ✓" prompt="how many?" />
    }
    if (task.kind === 'add' || task.kind === 'scalar') {
      return <MatrixPad P={palette} value={value.k === 'mat' ? value.m : ZERO2()}
        setValue={(m) => setValue({ k: 'mat', m })} min={0} max={40} caption="the combined table"
        disabled={disabled} reveal={reveal} onCommit={(m) => onCommit({ k: 'mat', m })} />
    }
    return <PartsBuilder P={palette} value={{ a: value.k === 'parts' ? value.a : 0, b: value.k === 'parts' ? value.b : 0 }}
      setValue={(p) => setValue({ k: 'parts', a: p.a, b: p.b })} min={0} max={12}
      labels={task.labels ?? ['price of A', 'price of B']}
      template={(a, b) => `A £${a} · B £${b}`}
      disabled={disabled} reveal={reveal} onCommit={(p) => onCommit({ k: 'parts', a: p.a, b: p.b })} commitLabel="TOTAL IT ✓" />
  },
  TutorialScene: ({ task, value, palette }) =>
    task.kind === 'add'
      ? <MatrixPad P={palette} value={value.k === 'mat' ? value.m : ZERO2()} setValue={() => {}}
        caption="the combined table" disabled onCommit={() => {}} />
      // Same commitLabel as the practice instrument — the walkthrough must rehearse
      // the button the child will actually be looking for.
      : <PartsBuilder P={palette} value={{ a: value.k === 'parts' ? value.a : 0, b: value.k === 'parts' ? value.b : 0 }}
        setValue={() => {}} min={0} max={12} labels={['price of A', 'price of B']}
        template={(a, b) => `A £${a} · B £${b}`} disabled onCommit={() => {}} commitLabel="TOTAL IT ✓" />,
  start: {
    blurb: <><strong>Two receipts, and nobody wrote down the prices.</strong> Three of A and two of B came to one total; one of A and four of B came to another. Neither is enough on its own — together they pin both prices down. That is a system, and a matrix is just the table of what was bought.</>,
    ticket: { title: 'Receipts', badge: '3A + 2B = £16', tone: 'a' },
    startLabel: 'Read the receipts →',
  },
  overview: {
    say: 'Here is the plan. You have two receipts from the same shop, and neither of them lists a single price. One receipt on its own is hopeless — plenty of price pairs would explain it. But two receipts have to be explained by the SAME two prices, and that is usually enough to pin both down. Scale one receipt until an item cancels, subtract, and a single price falls out. A matrix is nothing more than that shopping written as a table, and the determinant tells you whether the second receipt was ever really new information. Let us untangle one together, nice and slow.',
    problem: <>What do A and B cost, from <strong>3A + 2B = £16</strong> and <strong>1A + 4B = £22</strong>?</>,
    points: [
      <>One receipt is <strong>never</strong> enough on its own.</>,
      <>Scale one until an item <strong>cancels</strong>, then subtract.</>,
      <>A <strong>matrix</strong> is the table of what was bought.</>,
      <>A <strong>zero</strong> determinant means no new news.</>,
    ],
  },
  tutorial: [
    { task: DEMO_SOLVE, initial: { k: 'parts', a: 0, b: 0 }, hand: 'tap', steps: DEMO_SOLVE_STEPS },
    { task: DEMO_ADD, initial: { k: 'mat', m: ZERO2() }, hand: 'tap', steps: DEMO_ADD_STEPS },
  ],
  sig: (t) => `${t.kind}:${t.badge}:${t.prompt}`,
}

export default function TwoReceipts(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
