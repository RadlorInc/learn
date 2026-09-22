/**
 * Grade 5 · Module 1 — Place value concepts for multiplication and division with whole numbers. Written to docs/new-flow/AUTHORING.md.
 * 20 topics in four parts (A 1–6 place value · B 7–11 multiplication · C 12–16 division · D 17–20 multi-step problems), named
 * after the textbook contents page the founder sent on 2026-09-15 — the names only; every story, screen and number is ours.
 * Written by four writers in parallel, so every helper name ends in its part letter.
 */
import type { Lesson, Picture } from '../script'
import { attachChalk } from '../chalk'
import { G5M1_CHALK } from './chalk/g5m1'

// ── Part A helpers ──────────────────────────────────────────────────────────────────────────────────────────
const PLACES_A = ['Millions', 'Hundred thousands', 'Ten thousands', 'Thousands', 'Hundreds', 'Tens', 'Ones']

/** A place chart of the last `n` places. Each row's digits sit right-aligned under their places. */
const chartA = (n: number, rows: string[], mark?: [number, number][], motion?: boolean): Picture => ({
  kind: 'table', head: PLACES_A.slice(-n), rows: rows.map(r => r.padStart(n, '_').split('').map(d => (d === '_' ? '' : d))), mark, motion,
})
const eqA = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const cardsA = (wrong: string, right: string): Picture => ({ kind: 'cards', wrong, right })

/** Rounding on a line of 10 gaps: the number, and a jump to the round number it is closest to. */
const roundA = (min: number, max: number, at: number, to: number, away: string): Picture => ({
  kind: 'numline', min, max, ticks: 10, labels: 'ends', points: [{ at, label: at.toLocaleString('en-US') }], jumps: [{ from: at, to, label: away }], motion: true,
})

/** The same amount counted in two units: `n` cells in each row, the second row shaded. */
const twoWaysA = (n: number, top: [string, string], bottom: [string, string], brace?: string, motion?: boolean): Picture => ({
  kind: 'tape', motion, rows: [
    { label: top[0], cells: Array.from({ length: n }, () => ({ w: 1, text: top[1] })) },
    { label: bottom[0], cells: Array.from({ length: n }, () => ({ w: 1, text: bottom[1], shade: true })), brace },
  ],
})
const RUN_A: Picture = { kind: 'tape', rows: [{ label: 'km', cells: Array.from({ length: 5 }, () => ({ w: 1, text: '1' })), brace: '5 km' }] }

/** A change-of-unit question: the unit fact on top, the given number under it, the unknown as ?. */
const unitsA = (from: string, to: string, fact: [string, string], given: string): Picture => ({
  kind: 'table', head: [from, to], rows: [fact, [given, '?']],
})

/** 2,000 mL as two 1,000s, with the 250 mL cups that fill it underneath. */
const cupsA = (brace?: string, motion?: boolean): Picture => ({
  kind: 'tape', motion, rows: [
    { label: 'mL', cells: [{ w: 4, text: '1,000 mL' }, { w: 4, text: '1,000 mL' }] },
    { label: 'cups', cells: Array.from({ length: 8 }, () => ({ w: 1, text: '250', shade: true })), brace },
  ],
})


const QUOTIENT_RULE_A = 'Round the number you divide by to the nearest ten and the other number to the nearest hundred, then divide.'
const PRODUCT_RULE_A = 'Round each number to its biggest place, then multiply.'

// ── Part B helpers ──────────────────────────────────────────────────────────────────────────────────────────
const eqB = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })

// Area model, one row. t7: the row is the one-digit number, a column per place. t8: the row is the big number, a column for the tens and the ones.
const WIDTHS_B: Record<number, number[]> = { 2: [10, 3], 3: [5, 3, 2], 4: [4, 3, 2, 2] }
const areaB = (row: string, cols: string[], cells?: string[], motion?: boolean): Picture =>
  ({ kind: 'area', rows: [row], cols, widths: WIDTHS_B[cols.length], cells: cells && [cells], motion })

// Written multiplication. `answer: null` draws an empty answer box, so a problem picture never shows the answer.
// askB is the teaching version with no answer row at all: just the two numbers and the line.
const askB = (top: string, bottom: string): Picture => ({ kind: 'columns', rows: [top, bottom], op: '×' })
const mulB = (top: string, bottom: string, answer: string | null = null, carry?: string, motion?: boolean): Picture =>
  ({ kind: 'columns', rows: [top, bottom], op: '×', answer, carry, motion })

// ── Part C helpers ──────────────────────────────────────────────────────────────────────────────────────────
// Long division strings: a character's index is its column under the dividend. A `−` is drawn just left of the
// digits after it and takes no column, so '−26' puts 26 in columns 0–1 and ' −52' puts 52 in columns 1–2.
const eqC = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const ldC = (divisor: string, dividend: string): Picture => ({ kind: 'longdiv', divisor, dividend })

// t12: a line from 0 to 240 in steps of 10, so each small step is one ten. Labels only where a screen names the number.
const labelsC = (...at: number[]) => Array.from({ length: 25 }, (_, i) => (at.includes(i * 10) ? String(i * 10) : null))
const lineC = (labels: (string | null)[] | 'ends', jumps?: { from: number; to: number; label?: string }[]): Picture =>
  ({ kind: 'numline', min: 0, max: 240, ticks: 24, labels, jumps, motion: !!jumps })

// t13: 68 kids in teams of 17.
const kidsC: Picture = { kind: 'tape', rows: [
  { label: 'Kids', cells: [{ w: 68, text: '68' }] },
  { label: 'A team', cells: [{ w: 17, text: '17', shade: true }] },
] }

// t14: 184 roses in bunches of 23, and the table of guesses.
const rosesC = (quotient?: string, work?: string[]): Picture => ({ kind: 'longdiv', divisor: '23', dividend: '184', quotient, work })
const triesC = (rows: string[][]): Picture => ({ kind: 'table', head: ['Try', '× 23', 'Fits into 184?'], rows, motion: true })

// t15: 312 eggs in cartons of 13, one place at a time.
const eggsC = (quotient?: string, work?: string[]): Picture => ({ kind: 'longdiv', divisor: '13', dividend: '312', quotient, work })
const placesC = (rows: string[][]): Picture => ({ kind: 'table', head: ['Place', 'Multiply', 'Take away'], rows, rowHead: true, motion: true })

// t16: 1,176 stickers shared by 24 kids.
const stickersC = (quotient?: string, work?: string[]): Picture => ({ kind: 'longdiv', divisor: '24', dividend: '1176', quotient, work })

const IDEA12C = "Think of both numbers in tens, and 240 ÷ 60 becomes 24 tens ÷ 6 tens, the same as 24 ÷ 6."
const IDEA13C = "Guess with the nearest ten, then multiply to check, and if a whole group still fits in what is left, add one more."
const IDEA14C = "If the number you divide by doesn't fit into the first two digits, the answer has one digit, so guess with round numbers and try one less if it's too big."
const IDEA15C = 'Divide the tens first and take away. Then bring down the ones and divide again.'
const IDEA16C = 'Find where to start: if the number you divide by does not fit into the first two digits, start with the first three. Then bring down one digit at a time.'

// ── Part D helpers ──────────────────────────────────────────────────────────────────────────────────────────
type RowD = Extract<Picture, { kind: 'tape' }>['rows'][number]
type CellD = RowD['cells'][number]

const eqD = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const tapeD = (rows: RowD[], motion?: boolean): Picture => ({ kind: 'tape', rows, motion })
/** n equal groups of [a][b] side by side; the b part is shaded, so each group reads as one pair. */
const groupsD = (n: number, a: number, b: number): CellD[] =>
  Array.from({ length: n }, (): CellD[] => [{ w: a, text: String(a) }, { w: b, text: String(b), shade: true }]).flat()
/** Three equal groups drawn, the rest named in one long cell ("… 24 boxes"). */
const runD = (text: string, w: number, rest: string, restW: number): CellD[] =>
  [{ w, text }, { w, text }, { w, text }, { w: restW, text: rest }]

// t19: 24 boxes of 36 markers shared by 18 classes. Both rows are the same markers, so they are the same length.
const boxesD = (brace?: string): RowD => ({ label: 'Boxes', cells: runD('36', 1, '… 24 boxes', 3), brace })
const classesD = (each: string): RowD => ({ label: 'Classes', cells: runD(each, 1.2, '… 18 classes', 2.4) })
// t20: 32 rows of 25 seats, 186 sold.
const seatRowsD = (brace?: string): RowD => ({ label: 'Rows', cells: runD('25', 1, '… 32 rows', 3), brace })
const seatsD = (empty: string): RowD => ({ label: 'Seats', cells: [{ w: 1.6, text: '186 sold', shade: true }, { w: 4.4, text: empty }] })

const EXPRESSION_D = 'A number sentence with no = sign is called an expression. The ( ) are called parentheses.'
const ORDER_D = 'Doing the part in ( ) first is part of the order of operations.'
const MUL_DIV_D = 'The answer to a multiplication is called the product. The answer to a division is called the quotient.'
const FOUR_D = 'The answers have names: adding gives a sum, taking away a difference, multiplying a product, dividing a quotient.'

export const G5M1: Lesson[] = [
  // ════ Part A · Place value understanding for whole numbers ════
  // ── Topic 1 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t1', title: 'Relate place value neighbors',
    skill: 'A digit is worth 10 times as much one place to the left, and 1/10 as much one place to the right',
    bigIdea: "Slide a digit left and it's worth 10 times as much, slide it right and it's worth 1/10 as much.",
    screens: [
      { scene: 'g5m1-t1', title: 'A carton of pencils', text: 'A box holds 40 pencils. A carton holds 10 boxes. How many pencils are in a carton?',
        pictures: [chartA(4, ['40'])] },
      { title: "Adding takes too long", text: "You could add 40, ten times. That works. But it takes a while, and it's easy to lose count. Is there a faster way? Yes. It's in this chart of places.",
        beats: [
          { say: "You could add 40, ten times." },
          { say: "That works. But it takes a while, and it's easy to lose count." },
          { say: "Is there a faster way? Yes. It's in this chart of places.", pic: 0 },
        ],
        pictures: [chartA(4, ['40'])] },
      { title: "The big idea", text: "Slide a digit left and it's worth 10 times as much, slide it right and it's worth 1/10 as much.",
        beats: [
          { say: "Slide a digit left and it's worth 10 times as much, slide it right and it's worth 1/10 as much.", pic: 0 },
        ],
        pictures: [chartA(4, ['40', '400'])] },
      { title: "Each place is 10 of the next", text: "Look at the places, from the right. 10 ones make 1 ten. 10 tens make 1 hundred. 10 hundreds make 1 thousand. See the pattern? Each step to the left is 10 times as much.",
        beats: [
          { say: "Look at the places, from the right.", pic: 0 },
          { say: "10 ones make 1 ten. 10 tens make 1 hundred. 10 hundreds make 1 thousand.", pic: 1 },
          { say: "See the pattern? Each step to the left is 10 times as much.", write: "one place left = × 10" },
        ],
        pictures: [{ kind: 'table', head: PLACES_A.slice(-4), rows: [['1,000', '100', '10', '1']], motion: true },
          eqA('10 ones = 1 ten', ['10 tens = 1 hundred', '10 hundreds = 1 thousand'])] },
      { title: "Slide the 4 to the left", text: "Look at 40. The 4 is in the tens place. Slide it one place to the left, into the hundreds. That's 400. That's 10 times as much. So a carton holds 400 pencils.",
        beats: [
          { say: "Look at 40. The 4 is in the tens place.", pic: 0 },
          { say: "Slide it one place to the left, into the hundreds. That's 400." },
          { say: "That's 10 times as much. So a carton holds 400 pencils.", pic: 1 },
        ],
        pictures: [chartA(4, ['40', '400'], [[1, 1]], true), eqA('10 × 40 = 400')] },
      { title: "Slide it back to the right", text: "Now go back the other way. One box is 1/10 of a carton. Slide the 4 in 400 one place to the right, back to the tens. That's 40. So 1/10 of 400 is 40 pencils.",
        beats: [
          { say: "Now go back the other way. One box is 1/10 of a carton.", pic: 0 },
          { say: "Slide the 4 in 400 one place to the right, back to the tens. That's 40." },
          { say: "So 1/10 of 400 is 40 pencils.", pic: 1 },
        ],
        pictures: [chartA(4, ['400', '40'], [[1, 2]], true), eqA('1/10 of 400 = 40')] },
      { title: "One thing not to do", text: "Here's the part people mix up. Ten times as much does not mean ADD 10. That gives 50. Every digit slides one place to the left. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Ten times as much does not mean ADD 10.", pic: 0 },
          { say: "That gives 50. Every digit slides one place to the left." },
          { say: "Okay. Your turn." },
        ],
        pictures: [cardsA('10 × 40 = 50', '10 × 40 = 400')] },
    ],
    turn: {
      text: 'In 70, the 7 is in the tens place. What is the 7 worth if it slides one place to the left?',
      picture: chartA(4, ['70']),
      answer: 700, steps: ['The 7 is in the tens place, so it is worth 70.', 'One place to the left is the hundreds place. It is worth 10 times as much.', 'So the 7 is worth 700.'],
      prompt: "Find the place one step to the left. It's worth 10 times as much.",
      hint1: 'Which place is one step to the left of the tens?',
      hint2: 'One place to the left is worth 10 times as much. So what is 10 times 7 tens?',
      twin: { text: 'In 300, the 3 is in the hundreds place. What is the 3 worth if it slides one place to the left?',
        picture: chartA(4, ['300']),
        answer: 3000, steps: ['The 3 is in the hundreds place, so it is worth 300.', 'One place to the left is the thousands place. It is worth 10 times as much.', 'So the 3 is worth 3,000.'],
        hint1: 'Which place is one step to the left of the hundreds?',
        hint2: 'One place to the left is worth 10 times as much. So what is 10 times 3 hundreds?' },
    },
    won: { text: "You did it! You slid the 7 one place to the left, and now it's worth 10 times as much.", sticker: 'What a digit is worth in its place is its place value. Each place is worth 10 times the place to its right.' },
    twinWon: { text: 'Yes! You slid the 3 one place to the left, from 300 all the way to 3,000.', sticker: 'What a digit is worth in its place is its place value. Each place is worth 10 times the place to its right.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'In 60, the 6 is in the tens place. What is the 6 worth if it slides one place to the left?',
        picture: chartA(4, ['60']), answer: 600,
        steps: ['The 6 is in the tens place, so it is worth 60.', 'One place to the left is the hundreds place, worth 10 times as much.', 'So the 6 is worth 600.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'What number is 1/10 of 700?',
        picture: chartA(4, ['700']), answer: 70,
        steps: ['700 is 7 hundreds.', '1/10 as much slides the 7 one place right, into the tens place.', 'So 1/10 of 700 is 70.'] } },
      { why: 'Still "10 times as much"', problem: { text: 'How many hundreds make 4,000?',
        picture: eqA('4,000 = ? hundreds'), answer: 40,
        steps: ['10 hundreds make 1 thousand.', '4,000 is 4 thousands, so it is 4 groups of 10 hundreds.', 'So 40 hundreds make 4,000.'] } },
      { why: 'A little harder', problem: { text: 'What number is 1/10 of 45,000?',
        picture: chartA(5, ['45000']), answer: 4500,
        steps: ['45,000 is 4 ten thousands and 5 thousands.', '1/10 as much slides every digit one place right: 4 thousands and 5 hundreds.', 'So 1/10 of 45,000 is 4,500.'] } },
      { why: 'Same math in a story', problem: { text: 'A carton holds 10 boxes of crayons. Every box has the same number. The carton has 800 crayons in all. How many crayons are in one box?',
        picture: chartA(4, ['800']), answer: 80,
        steps: ['One box is 1/10 of the carton.', '1/10 as much slides the 8 in 800 one place right, from the hundreds to the tens.', 'So one box has 80 crayons.'] } },
    ],
  },

  // ── Topic 2 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t2', title: 'Multiply and divide by 10, 100, 1,000',
    skill: 'Multiply and divide whole numbers by 10, 100 and 1,000 by sliding every digit, and see the pattern in the zeros',
    bigIdea: "Each zero in 10, 100 or 1,000 slides every digit one place, left to multiply and right to divide.",
    screens: [
      { scene: 'g5m1-t2', title: 'Boxes of beads', text: 'Every box on the shelf holds 37 beads. The craft shop has 1,000 boxes. How many beads is that?',
        pictures: [chartA(5, ['37']), eqA('37 × 1,000 = ?')] },
      { title: "Too many to add", text: "Add 37 one thousand times? That would take all day. There's a faster way. And it works for dividing too.",
        beats: [
          { say: "Add 37 one thousand times? That would take all day.", pic: 0 },
          { say: "There's a faster way. And it works for dividing too." },
        ],
        pictures: [chartA(5, ['37'])] },
      { title: "The big idea", text: "Each zero in 10, 100 or 1,000 slides every digit one place, left to multiply and right to divide.",
        beats: [
          { say: "Each zero in 10, 100 or 1,000 slides every digit one place, left to multiply and right to divide.", pic: 0 },
        ],
        pictures: [chartA(5, ['37', '37000'])] },
      { title: "One zero, one place", text: "Start with 10. It has one zero. So 37 × 10 slides the 3 and the 7 one place to the left. The ones place is empty now, so a 0 fills it. That's 370.",
        beats: [
          { say: "Start with 10. It has one zero.", pic: 0 },
          { say: "So 37 × 10 slides the 3 and the 7 one place to the left.", write: "one zero → one place" },
          { say: "The ones place is empty now, so a 0 fills it. That's 370.", pic: 1 },
        ],
        pictures: [chartA(5, ['37', '370'], [[1, 4]], true), eqA('37 × 10 = 370')] },
      { title: "More zeros, more places", text: "Now 100. It has two zeros, so the digits slide two places. That's 3,700. 1,000 has three zeros, so they slide three places. That's 37,000. So the shop has 37,000 beads.",
        beats: [
          { say: "Now 100. It has two zeros, so the digits slide two places. That's 3,700.", pic: 0 },
          { say: "1,000 has three zeros, so they slide three places. That's 37,000." },
          { say: "So the shop has 37,000 beads.", pic: 1 },
        ],
        pictures: [chartA(5, ['37', '370', '3700', '37000'], [[1, 4], [2, 3], [2, 4], [3, 2], [3, 3], [3, 4]], true),
          eqA('37 × 10 = 370', ['37 × 100 = 3,700', '37 × 1,000 = 37,000'])] },
      { title: "Dividing slides right", text: "Now go backwards. The shop shares 37,000 beads into 1,000 bags. 1,000 still has three zeros. So every digit slides three places — this time to the right. The zeros slide off the end. That's 37 beads in each bag.",
        beats: [
          { say: "Now go backwards. The shop shares 37,000 beads into 1,000 bags.", pic: 0 },
          { say: "1,000 still has three zeros. So every digit slides three places — this time to the right.", write: "divide → slide right" },
          { say: "The zeros slide off the end. That's 37 beads in each bag.", pic: 1 },
        ],
        pictures: [chartA(5, ['37000', '37'], [[1, 3], [1, 4]], true), eqA('37,000 ÷ 1,000 = 37')] },
      { title: "One thing not to do", text: "Here's the part people mix up. When you divide, don't slide LEFT. Dividing makes the number smaller, so every digit slides right. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "When you divide, don't slide LEFT.", pic: 0 },
          { say: "Dividing makes the number smaller, so every digit slides right." },
          { say: "Okay. Your turn." },
        ],
        pictures: [cardsA('6,300 ÷ 100 = 630,000', '6,300 ÷ 100 = 63')] },
    ],
    turn: {
      text: 'Multiply. 45 × 1,000 = ?',
      picture: chartA(5, ['45']),
      answer: 45000, steps: ['1,000 has three zeros, so every digit slides three places to the left.', 'The 4 lands in the ten thousands and the 5 in the thousands. Zeros fill the empty places.', 'So 45 × 1,000 = 45,000.'],
      prompt: 'Count the zeros. Slide every digit that many places.',
      hint1: 'How many zeros does 1,000 have? That is how many places to slide.',
      hint2: 'Multiplying slides the digits to the left. Slide the 4 and the 5 three places, then fill the empty places with zeros.',
      twin: { text: 'Multiply. 29 × 100 = ?',
        picture: chartA(5, ['29']),
        answer: 2900, steps: ['100 has two zeros, so every digit slides two places to the left.', 'The 2 lands in the thousands and the 9 in the hundreds. Zeros fill the tens and ones.', 'So 29 × 100 = 2,900.'],
        hint1: 'How many zeros does 100 have? That is how many places to slide.',
        hint2: 'Multiplying slides the digits to the left. Slide the 2 and the 9 two places, then fill the empty places with zeros.' },
    },
    won: { text: 'You did it! You counted three zeros and slid every digit three places to the left.', sticker: 'The answer to a multiplication is the product. The answer to a division is the quotient.' },
    twinWon: { text: 'Yes! You counted two zeros and slid 29 two places to the left, all the way to 2,900.', sticker: 'The answer to a multiplication is the product. The answer to a division is the quotient.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Multiply. 28 × 1,000 = ?',
        picture: chartA(5, ['28']), answer: 28000,
        steps: ['1,000 has three zeros, so every digit slides three places to the left.', 'The 2 lands in the ten thousands and the 8 in the thousands. Zeros fill the empty places.', 'So 28 × 1,000 = 28,000.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Divide. 5,600 ÷ 100 = ?',
        picture: chartA(4, ['5600']), answer: 56,
        steps: ['100 has two zeros, so every digit slides two places to the right.', 'The 5 moves from the thousands to the tens and the 6 from the hundreds to the ones. The two zeros slide off.', 'So 5,600 ÷ 100 = 56.'] } },
      { why: 'Still "count the zeros"', problem: { text: 'Multiply. 406 × 10 = ?',
        picture: chartA(4, ['406']), answer: 4060,
        steps: ['10 has one zero, so every digit slides one place to the left.', 'The 4 lands in the thousands, the 0 in the hundreds and the 6 in the tens. A 0 fills the ones.', 'So 406 × 10 = 4,060.'] } },
      { why: 'A little harder', problem: { text: 'Divide. 90,500 ÷ 100 = ?',
        picture: chartA(5, ['90500']), answer: 905,
        steps: ['100 has two zeros, so every digit slides two places to the right.', 'The 9 moves to the hundreds, the 0 to the tens and the 5 to the ones. The last two zeros slide off.', 'So 90,500 ÷ 100 = 905.'] } },
      { why: 'Same math in a story', problem: { text: 'A craft shop has 7,200 beads. It puts 100 beads in each bag. How many bags can it fill?',
        picture: chartA(4, ['7200']), answer: 72,
        steps: ['Find 7,200 ÷ 100.', '100 has two zeros, so every digit slides two places to the right. The two zeros slide off.', 'So the shop can fill 72 bags.'] } },
    ],
  },

  // ── Topic 3 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t3', title: 'Exponents and powers of 10',
    skill: 'Write 10, 100, 1,000 and more with a small raised number, and use it to multiply and divide',
    bigIdea: 'The small number up top says how many 10s you multiply, and that is how many zeros to write.',
    screens: [
      { scene: 'g5m1-t3', title: 'A city of a million', text: 'From the park you can see the whole city. A sign says 1,000,000 people live here. That is a lot of zeros. Is there a shorter way to write it?',
        pictures: [eqA('1,000,000 people')] },
      { title: 'Zeros are hard to count', text: "Count the zeros in 1,000,000. Six? It's hard to be sure at a glance. And one zero too many makes it 10 times too big. Is there a shorter way? Yes. A small number can count them.",
        beats: [
          { say: "Count the zeros in 1,000,000. Six? It's hard to be sure at a glance.", pic: 0 },
          { say: 'And one zero too many makes it 10 times too big.' },
          { say: 'Is there a shorter way? Yes. A small number can count them.' },
        ],
        pictures: [eqA('1,000,000', ['or 10,000,000?'])] },
      { title: 'The big idea', text: 'The small number up top says how many 10s you multiply, and that is how many zeros to write.',
        beats: [
          { say: 'The small number up top says how many 10s you multiply, and that is how many zeros to write.', pic: 0 },
        ],
        pictures: [eqA('10³ = 10 × 10 × 10 = 1,000')] },
      { title: 'Count the 10s', text: "Look. 10 × 10 is two 10s, so we write 10². That's 100. 10 × 10 × 10 is three 10s, so we write 10³. That's 1,000. See the pattern? Each 10 adds one more zero.",
        beats: [
          { say: "Look. 10 × 10 is two 10s, so we write 10². That's 100.", pic: 0 },
          { say: "10 × 10 × 10 is three 10s, so we write 10³. That's 1,000." },
          { say: 'See the pattern? Each 10 adds one more zero.', write: 'each 10 → one more zero' },
        ],
        pictures: [{ kind: 'table', head: ['Short way', 'Long way', 'Number'], rows: [['10¹', '10', '10'], ['10²', '10 × 10', '100'], ['10³', '10 × 10 × 10', '1,000']], motion: true }] },
      { title: 'The city the short way', text: 'Back to the city. 1,000,000 is a 1 with 6 zeros. Count them with me. One, two, three, four, five, six. Six zeros, six 10s. So the city has 10⁶ people.',
        beats: [
          { say: 'Back to the city. 1,000,000 is a 1 with 6 zeros.', pic: 0 },
          { say: 'Count them with me. One, two, three, four, five, six.' },
          { say: 'Six zeros, six 10s. So the city has 10⁶ people.' },
        ],
        pictures: [{ kind: 'table', head: ['Short way', 'Long way', 'Number'],
          rows: [['10¹', '10', '10'], ['10²', '10 × 10', '100'], ['10³', '10 × 10 × 10', '1,000'], ['10⁶', 'six 10s', '1,000,000']], mark: [[3, 0], [3, 2]] }] },
      { title: 'It says how far to slide', text: "That small number also says how far the digits slide. So what is 45 × 10³? Slide 3 places left. That's 45,000. And 62,000 ÷ 10³ slides 3 places right. That's 62.",
        beats: [
          { say: 'That small number also says how far the digits slide.' },
          { say: "So what is 45 × 10³? Slide 3 places left. That's 45,000.", pic: 0 },
          { say: "And 62,000 ÷ 10³ slides 3 places right. That's 62." },
        ],
        pictures: [eqA('45 × 10³ = 45,000', ['62,000 ÷ 10³ = 62'])] },
      { title: 'One thing not to do', text: "Here's the part people mix up. 10³ does not mean 10 TIMES 3. That gives 30. It means three 10s multiplied, 10 × 10 × 10. That's 1,000. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: '10³ does not mean 10 TIMES 3. That gives 30.', pic: 0 },
          { say: "It means three 10s multiplied, 10 × 10 × 10. That's 1,000." },
          { say: 'Okay. Your turn.' },
        ],
        pictures: [cardsA('10³ = 30', '10³ = 1,000')] },
    ],
    turn: {
      text: 'Write 10⁴ as a number.',
      picture: eqA('10⁴ = ?'),
      answer: 10000, steps: ['The small 4 means four 10s multiplied: 10 × 10 × 10 × 10.', 'Each 10 adds one zero, so it is a 1 with 4 zeros.', 'So 10⁴ = 10,000.'],
      prompt: 'Count how many 10s to multiply. Each one adds a zero.',
      hint1: 'How many 10s does the small number tell you to multiply?',
      hint2: 'Each 10 adds one zero. Write a 1, then one zero for each 10.',
      twin: { text: 'Write 10⁵ as a number.',
        picture: eqA('10⁵ = ?'),
        answer: 100000, steps: ['The small 5 means five 10s multiplied.', 'Each 10 adds one zero, so it is a 1 with 5 zeros.', 'So 10⁵ = 100,000.'],
        hint1: 'What does the small number up top tell you?',
        hint2: 'Each 10 you multiply adds one zero. Write a 1, then the zeros.' },
    },
    won: { text: 'You counted four 10s and wrote one zero for each.', sticker: 'The small number up top is called the exponent. 10 with an exponent is called a power of ten.' },
    twinWon: { text: 'You counted five 10s and wrote 100,000.', sticker: 'The small number up top is called the exponent. 10 with an exponent is called a power of ten.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Write 10² as a number.',
        picture: eqA('10² = ?'), answer: 100,
        steps: ['The small 2 means two 10s multiplied: 10 × 10.', 'That is a 1 with 2 zeros.', 'So 10² = 100.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Multiply. 38 × 10² = ?',
        picture: eqA('38 × 10² = ?'), answer: 3800,
        steps: ['The small 2 means slide every digit 2 places to the left.', 'The 3 lands in the thousands and the 8 in the hundreds. Zeros fill the tens and ones.', 'So 38 × 10² = 3,800.'] } },
      { why: 'Still "count the 10s"', problem: { text: 'Divide. 54,000 ÷ 10³ = ?',
        picture: eqA('54,000 ÷ 10³ = ?'), answer: 54,
        steps: ['The small 3 means slide every digit 3 places to the right.', 'The 5 moves to the tens and the 4 to the ones. The three zeros slide off.', 'So 54,000 ÷ 10³ = 54.'] } },
      { why: 'A little harder', problem: { text: 'Multiply. 207 × 10⁴ = ?',
        picture: eqA('207 × 10⁴ = ?'), answer: 2070000,
        steps: ['The small 4 means slide every digit 4 places to the left.', 'The 2 lands in the millions, the 0 in the hundred thousands and the 7 in the ten thousands. Zeros fill the 4 places after them.', 'So 207 × 10⁴ = 2,070,000.'] } },
      { why: 'Same math in a story', problem: { text: 'The city plants 42,000 flowers. It puts 10³ flowers in each park. How many parks get flowers?',
        picture: eqA('42,000 flowers', ['10³ in each park']), answer: 42,
        steps: ['Find 42,000 ÷ 10³.', 'The small 3 means slide every digit 3 places to the right. The three zeros slide off.', 'So 42 parks get flowers.'] } },
    ],
  },

  // ── Topic 4 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t4', title: 'Estimate products and quotients',
    skill: 'Find about how much a product or a quotient is: round the numbers, use a basic fact, then write the zeros',
    bigIdea: 'Swap each number for a close round number, use a fact you know, then write the zeros.',
    screens: [
      { scene: 'g5m1-t4', title: 'Eggs on a farm', text: 'A farm packs 412 eggs a day for 28 days. About how many eggs is that?',
        pictures: [eqA('28 × 412')] },
      { title: 'The exact way takes time', text: "You could work out 28 × 412 exactly. That takes a lot of steps. But the question asks about how many. Do you need it exact? No. Is it near 1,000, 10,000 or 100,000? That's all you need.",
        beats: [
          { say: 'You could work out 28 × 412 exactly. That takes a lot of steps.', pic: 0 },
          { say: 'But the question asks about how many. Do you need it exact? No.' },
          { say: "Is it near 1,000, 10,000 or 100,000? That's all you need." },
        ],
        pictures: [eqA('28 × 412')] },
      { title: 'The big idea', text: 'Swap each number for a close round number, use a fact you know, then write the zeros.',
        beats: [
          { say: 'Swap each number for a close round number, use a fact you know, then write the zeros.', pic: 0 },
        ],
        pictures: [eqA('28 × 412', ['30 × 400'])] },
      { title: 'Round each number', text: 'Round each number at its biggest place. 28 is only 2 away from 30. And 412 is only 12 away from 400. So 28 × 412 is close to 30 × 400.',
        beats: [
          { say: 'Round each number at its biggest place.', write: 'round at the biggest place' },
          { say: '28 is only 2 away from 30.', pic: 0 },
          { say: 'And 412 is only 12 away from 400.', pic: 1 },
          { say: 'So 28 × 412 is close to 30 × 400.' },
        ],
        pictures: [roundA(20, 30, 28, 30, '2 away'), roundA(400, 500, 412, 400, '12 away')] },
      { title: 'Use a fact, then the zeros', text: "Now use a fact you know. 3 × 4 = 12. Then count the zeros. 30 has one, and 400 has two. That's three. Write them after the 12. So the farm packs about 12,000 eggs.",
        beats: [
          { say: 'Now use a fact you know. 3 × 4 = 12.' },
          { say: "Then count the zeros. 30 has one, and 400 has two. That's three.", write: 'keep every zero' },
          { say: 'Write them after the 12. So the farm packs about 12,000 eggs.', pic: 0 },
        ],
        pictures: [eqA('3 × 4 = 12', ['30 × 400 = 12,000', 'about 12,000 eggs'])] },
      { title: 'Dividing works the same way', text: "Does dividing work the same way? Yes. 2,380 eggs go into crates of 58. Round 58 to the nearest ten, 60. Round 2,380 to the nearest hundred, 2,400. 24 ÷ 6 = 4, and 60 × 40 = 2,400. So it's about 40 crates.",
        beats: [
          { say: 'Does dividing work the same way? Yes. 2,380 eggs go into crates of 58.' },
          { say: 'Round 58 to the nearest ten, 60. Round 2,380 to the nearest hundred, 2,400.', pic: 0 },
          { say: "24 ÷ 6 = 4, and 60 × 40 = 2,400. So it's about 40 crates.", pic: 1 },
        ],
        pictures: [roundA(2300, 2400, 2380, 2400, '20 away'), eqA('2,380 ÷ 58', ['2,400 ÷ 60 = 40'])] },
      { title: 'One thing not to do', text: "Here's the part people mix up. Don't DROP the zeros. 30 × 400 is not 1,200. It needs all three zeros after the 12, so it's 12,000. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't DROP the zeros. 30 × 400 is not 1,200.", pic: 0 },
          { say: "It needs all three zeros after the 12, so it's 12,000." },
          { say: 'Okay. Your turn.' },
        ],
        pictures: [cardsA('30 × 400 = 1,200', '30 × 400 = 12,000')] },
    ],
    turn: {
      text: `${PRODUCT_RULE_A} About how much is 32 × 589?`,
      picture: eqA('32 × 589'),
      answer: 18000, steps: ['32 rounds to 30, and 589 rounds to 600.', '3 × 6 = 18. 30 and 600 have three zeros in all.', 'So 32 × 589 is about 18,000.'],
      prompt: 'Round both numbers first. Then use a fact and write the zeros.',
      hint1: 'Round 32 to the nearest ten and 589 to the nearest hundred.',
      hint2: 'Multiply 3 × 6. Then write all the zeros from both round numbers.',
      twin: { text: `${PRODUCT_RULE_A} About how much is 71 × 309?`,
        picture: eqA('71 × 309'),
        answer: 21000, steps: ['71 rounds to 70, and 309 rounds to 300.', '7 × 3 = 21. 70 and 300 have three zeros in all.', 'So 71 × 309 is about 21,000.'],
        hint1: 'Round 71 to the nearest ten and 309 to the nearest hundred.',
        hint2: 'Multiply the first digits of the round numbers. Then write all their zeros.' },
    },
    won: { text: 'You rounded both numbers, used a fact, and kept every zero.', sticker: 'An answer found with round numbers is an estimate. It tells you about how big the exact answer is.' },
    twinWon: { text: 'You rounded 71 and 309, then multiplied to get about 21,000.', sticker: 'An answer found with round numbers is an estimate. It tells you about how big the exact answer is.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: `${PRODUCT_RULE_A} About how much is 19 × 512?`,
        picture: eqA('19 × 512'), answer: 10000,
        steps: ['19 rounds to 20, and 512 rounds to 500.', '2 × 5 = 10. 20 and 500 have three more zeros.', 'So 19 × 512 is about 10,000.'] } },
      { why: 'Same idea, new numbers', problem: { text: `${QUOTIENT_RULE_A} About how much is 1,790 ÷ 29?`,
        picture: eqA('1,790 ÷ 29'), answer: 60,
        steps: ['29 rounds to 30, and 1,790 rounds to 1,800.', '18 ÷ 3 = 6, and 30 × 60 = 1,800.', 'So 1,790 ÷ 29 is about 60.'] } },
      { why: 'Still "round, then a fact"', problem: { text: `${QUOTIENT_RULE_A} About how much is 3,480 ÷ 68?`,
        picture: eqA('3,480 ÷ 68'), answer: 50,
        steps: ['68 rounds to 70, and 3,480 rounds to 3,500.', '35 ÷ 7 = 5, and 70 × 50 = 3,500.', 'So 3,480 ÷ 68 is about 50.'] } },
      { why: 'A little harder', problem: { text: `${PRODUCT_RULE_A} About how much is 47 × 3,862?`,
        picture: eqA('47 × 3,862'), answer: 200000,
        steps: ['47 rounds to 50, and 3,862 rounds to 4,000.', '5 × 4 = 20. 50 and 4,000 have four more zeros.', 'So 47 × 3,862 is about 200,000.'] } },
      { why: 'Same math in a story', problem: { text: `A library has 2,660 books to put on shelves. Each shelf holds 88 books. ${QUOTIENT_RULE_A} About how many shelves can the library fill?`,
        picture: eqA('2,660 ÷ 88'), answer: 30,
        steps: ['88 rounds to 90, and 2,660 rounds to 2,700.', '27 ÷ 9 = 3, and 90 × 30 = 2,700.', 'So the library can fill about 30 shelves.'] } },
    ],
  },

  // ── Topic 5 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t5', title: 'Convert metric units',
    skill: 'Change between kilometers, meters, centimeters, millimeters, kilograms, grams, liters and milliliters by multiplying or dividing by 10, 100 or 1,000',
    bigIdea: 'A bigger unit is 10, 100 or 1,000 smaller ones, so multiply to go to the smaller unit and divide to go to the bigger one.',
    screens: [
      { scene: 'g5m1-t5', title: 'A fun run', text: 'The fun run in the park is 5 kilometers (km) long. The signs along the path count in meters (m). How many meters long is the run?',
        pictures: [RUN_A] },
      { title: 'A meter is much shorter', text: "A kilometer is a long way. Walking one would take you a while. A meter? That's about one big step. So will 5 kilometers be a few meters, or a lot? A lot.",
        beats: [
          { say: 'A kilometer is a long way. Walking one would take you a while.', pic: 0 },
          { say: "A meter? That's about one big step.", write: '1 big step = about 1 m' },
          { say: 'So will 5 kilometers be a few meters, or a lot? A lot.', pic: 1 },
        ],
        pictures: [RUN_A, eqA('5 km = ? m')] },
      { title: 'The big idea', text: 'A bigger unit is 10, 100 or 1,000 smaller ones, so multiply to go to the smaller unit and divide to go to the bigger one.',
        beats: [
          { say: 'A bigger unit is 10, 100 or 1,000 smaller ones, so multiply to go to the smaller unit and divide to go to the bigger one.', pic: 0 },
        ],
        pictures: [{ kind: 'table', head: ['Bigger unit', 'Smaller units'],
          rows: [['1 kilometer', '1,000 meters'], ['1 meter', '100 centimeters'], ['1 centimeter', '10 millimeters'], ['1 kilogram', '1,000 grams'], ['1 liter', '1,000 milliliters']] }] },
      { title: 'One kilometer is 1,000 meters', text: 'Which unit is bigger here? The kilometer. 1 km is exactly as long as 1,000 m. So every kilometer of the run is 1,000 m.',
        beats: [
          { say: 'Which unit is bigger here? The kilometer.', pic: 0 },
          { say: '1 km is exactly as long as 1,000 m.', write: '1 km = 1,000 m' },
          { say: 'So every kilometer of the run is 1,000 m.' },
        ],
        pictures: [twoWaysA(5, ['km', '1'], ['m', '1,000'], undefined, true)] },
      { title: 'Smaller unit: multiply', text: 'Meters are smaller, so it takes more of them to cover the same distance. Smaller unit, more of them. So we multiply. 5 × 1,000 = 5,000. The run is 5,000 m long.',
        beats: [
          { say: 'Meters are smaller, so it takes more of them to cover the same distance.', pic: 0 },
          { say: 'Smaller unit, more of them. So we multiply.', write: 'smaller unit → multiply' },
          { say: '5 × 1,000 = 5,000. The run is 5,000 m long.', pic: 1 },
        ],
        pictures: [twoWaysA(5, ['km', '1'], ['m', '1,000'], '5,000 m'), eqA('5 × 1,000 = 5,000')] },
      { title: 'Bigger unit: divide', text: "Now the other way. A runner has gone 3,000 m. How many kilometers is that? Kilometers are bigger, so there are fewer of them. That means divide. 3,000 ÷ 1,000 = 3. So it's 3 km.",
        beats: [
          { say: 'Now the other way. A runner has gone 3,000 m. How many kilometers is that?', pic: 0 },
          { say: 'Kilometers are bigger, so there are fewer of them. That means divide.', write: 'bigger unit → divide' },
          { say: "3,000 ÷ 1,000 = 3. So it's 3 km.", pic: 1 },
        ],
        pictures: [twoWaysA(3, ['m', '1,000'], ['km', '1'], '3 km', true), eqA('3,000 ÷ 1,000 = 3')] },
      { title: 'One thing not to do', text: "Here's the part people mix up. Going to a bigger unit, don't MULTIPLY. A kilogram is 1,000 grams, so 6,000 grams is only 6 kilograms. A bigger unit means a smaller number. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Going to a bigger unit, don't MULTIPLY.", pic: 0 },
          { say: 'A kilogram is 1,000 grams, so 6,000 grams is only 6 kilograms. A bigger unit means a smaller number.' },
          { say: 'Okay. Your turn.' },
        ],
        pictures: [cardsA('6,000 g = 6,000,000 kg', '6,000 g = 6 kg')] },
    ],
    turn: {
      text: 'How many meters is 8 kilometers?',
      picture: unitsA('km', 'm', ['1', '1,000'], '8'),
      answer: 8000, steps: ['Meters are smaller, so there are more of them. Multiply.', '1 kilometer is 1,000 meters, so find 8 × 1,000.', 'So 8 kilometers is 8,000 meters.'],
      prompt: 'Is the new unit smaller or bigger? Smaller: multiply. Bigger: divide.',
      hint1: 'Is a meter smaller or bigger than a kilometer? So do you multiply or divide?',
      hint2: '1 kilometer is 1,000 meters. Multiply 8 by 1,000.',
      twin: { text: 'How many grams is 7 kilograms?',
        picture: unitsA('kg', 'g', ['1', '1,000'], '7'),
        answer: 7000, steps: ['Grams are smaller, so there are more of them. Multiply.', '1 kilogram is 1,000 grams, so find 7 × 1,000.', 'So 7 kilograms is 7,000 grams.'],
        hint1: 'Is a gram smaller or bigger than a kilogram? So do you multiply or divide?',
        hint2: '1 kilogram is 1,000 grams. Multiply 7 by 1,000.' },
    },
    won: { text: 'You saw that meters are smaller, so you multiplied.', sticker: 'Changing a measure from one unit to another is called converting. Kilo means 1,000.' },
    twinWon: { text: 'You saw that grams are smaller, so 7 kilograms is 7,000 grams.', sticker: 'Changing a measure from one unit to another is called converting. Kilo means 1,000.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'How many meters is 6 kilometers?',
        picture: unitsA('km', 'm', ['1', '1,000'], '6'), answer: 6000,
        steps: ['Meters are smaller, so multiply.', '1 kilometer is 1,000 meters, so find 6 × 1,000.', 'So 6 kilometers is 6,000 meters.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'How many milliliters is 4 liters?',
        picture: unitsA('L', 'mL', ['1', '1,000'], '4'), answer: 4000,
        steps: ['Milliliters are smaller, so multiply.', '1 liter is 1,000 milliliters, so find 4 × 1,000.', 'So 4 liters is 4,000 milliliters.'] } },
      { why: 'Still "bigger unit: divide"', problem: { text: 'How many kilograms is 9,000 grams?',
        picture: unitsA('g', 'kg', ['1,000', '1'], '9,000'), answer: 9,
        steps: ['Kilograms are bigger, so there are fewer of them. Divide.', '1,000 grams is 1 kilogram, so find 9,000 ÷ 1,000.', 'So 9,000 grams is 9 kilograms.'] } },
      { why: 'A little harder', problem: { text: 'How many meters is 2,400 centimeters?',
        picture: unitsA('cm', 'm', ['100', '1'], '2,400'), answer: 24,
        steps: ['Meters are bigger, so there are fewer of them. Divide.', '100 centimeters is 1 meter, so find 2,400 ÷ 100. The two zeros slide off.', 'So 2,400 centimeters is 24 meters.'] } },
      { why: 'Same math in a story', problem: { text: 'The ribbon at the finish line is 1,500 millimeters long. How many centimeters long is it?',
        picture: unitsA('mm', 'cm', ['10', '1'], '1,500'), answer: 150,
        steps: ['Centimeters are bigger, so there are fewer of them. Divide.', '10 millimeters is 1 centimeter, so find 1,500 ÷ 10. The last zero slides off.', 'So the ribbon is 150 centimeters long.'] } },
    ],
  },

  // ── Topic 6 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t6', title: 'Metric word problems',
    skill: 'Solve two-step word problems with metric units: change to the same unit, then add, subtract, multiply or divide',
    bigIdea: 'Change to the same unit first, then solve the story one step at a time.',
    screens: [
      { scene: 'g5m1-t6', title: 'Juice for everyone', text: 'A big jug holds 2 liters (L) of juice. Each small cup holds 250 milliliters (mL). How many cups can you fill?',
        pictures: [eqA('2 L of juice', ['250 mL in each cup'])] },
      { title: 'Two different units', text: 'Look at the two numbers. The jug is in liters, but the cups are in milliliters. Can we just divide 2 by 250? Not yet. They count different units.',
        beats: [
          { say: 'Look at the two numbers. The jug is in liters, but the cups are in milliliters.', pic: 0 },
          { say: 'Can we just divide 2 by 250? Not yet. They count different units.' },
        ],
        pictures: [eqA('2 L and 250 mL')] },
      { title: 'The big idea', text: 'Change to the same unit first, then solve the story one step at a time.',
        beats: [
          { say: 'Change to the same unit first, then solve the story one step at a time.', pic: 0 },
        ],
        pictures: [twoWaysA(2, ['L', '1 L'], ['mL', '1,000 mL'])] },
      { title: 'First, the same unit', text: "1 L is 1,000 mL, so let's count the jug in milliliters. 2 × 1,000 = 2,000. The jug holds 2,000 mL. Now the jug and the cups are both in milliliters.",
        beats: [
          { say: "1 L is 1,000 mL, so let's count the jug in milliliters.", pic: 0 },
          { say: '2 × 1,000 = 2,000. The jug holds 2,000 mL.' },
          { say: 'Now the jug and the cups are both in milliliters.', write: 'same unit first' },
        ],
        pictures: [twoWaysA(2, ['L', '1 L'], ['mL', '1,000 mL'], '2,000 mL', true)] },
      { title: 'Then, how many cups', text: 'Now, how many cups? 4 cups of 250 mL make 1,000 mL. The jug holds two of those thousands, so 2 × 4 = 8 cups. That is exactly what 2,000 ÷ 250 asks.',
        beats: [
          { say: 'Now, how many cups? 4 cups of 250 mL make 1,000 mL.', pic: 0 },
          { say: 'The jug holds two of those thousands, so 2 × 4 = 8 cups.' },
          { say: 'That is exactly what 2,000 ÷ 250 asks.', pic: 1 },
        ],
        pictures: [cupsA(undefined, true), eqA('2,000 ÷ 250 = 8')] },
      { title: 'Check the answer', text: "Now check. 8 cups of 250 mL is 8 × 250 = 2,000 mL. That's 2 L, the whole jug, with nothing left over. So you can fill 8 cups.",
        beats: [
          { say: 'Now check. 8 cups of 250 mL is 8 × 250 = 2,000 mL.', pic: 1 },
          { say: "That's 2 L, the whole jug, with nothing left over.", pic: 0 },
          { say: 'So you can fill 8 cups.' },
        ],
        pictures: [cupsA('2,000 mL = 2 L'), eqA('8 × 250 = 2,000')] },
      { title: 'One thing not to do', text: "Here's the part people mix up. Don't do the math with two DIFFERENT units. Change 2 L into 2,000 mL first, and then divide. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't do the math with two DIFFERENT units.", pic: 0 },
          { say: 'Change 2 L into 2,000 mL first, and then divide.' },
          { say: 'Okay. Your turn.' },
        ],
        pictures: [cardsA('2 ÷ 250', '2,000 ÷ 250 = 8')] },
    ],
    turn: {
      text: 'A jug holds 3 liters of juice. Each cup holds 250 milliliters. How many cups can you fill?',
      picture: eqA('3 L of juice', ['250 mL in each cup']),
      answer: 12, steps: ['1 liter is 1,000 milliliters, so the jug holds 3,000 milliliters.', '4 cups of 250 milliliters make 1,000 milliliters. So 3,000 milliliters fill 3 × 4 cups.', 'So you can fill 12 cups.'],
      prompt: 'Change the liters to milliliters first. Then find how many cups.',
      hint1: 'Change 3 liters to milliliters first.',
      hint2: 'The jug holds 3,000 milliliters. How many cups of 250 milliliters make 1,000? Then how many make 3,000?',
      twin: { text: 'A bottle holds 2 liters of water. Each glass holds 200 milliliters. How many glasses can you fill?',
        picture: eqA('2 L of water', ['200 mL in each glass']),
        answer: 10, steps: ['1 liter is 1,000 milliliters, so the bottle holds 2,000 milliliters.', '5 glasses of 200 milliliters make 1,000 milliliters. So 2,000 milliliters fill 2 × 5 glasses.', 'So you can fill 10 glasses.'],
        hint1: 'Change 2 liters to milliliters first.',
        hint2: 'The bottle holds 2,000 milliliters. How many glasses of 200 milliliters make 1,000? Then how many make 2,000?' },
    },
    won: { text: 'You changed the liters to milliliters first, then found how many cups.', sticker: 'A story that takes two or more steps is a multi-step problem.' },
    twinWon: { text: 'You changed the liters to milliliters first, then found 10 glasses.', sticker: 'A story that takes two or more steps is a multi-step problem.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'A jug holds 5 liters of lemonade. Each cup holds 250 milliliters. How many cups can you fill?',
        picture: eqA('5 L of lemonade', ['250 mL in each cup']), answer: 20,
        steps: ['5 liters is 5,000 milliliters.', '4 cups of 250 milliliters make 1,000 milliliters, so 5,000 milliliters fill 5 × 4 cups.', 'So you can fill 20 cups.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'A bowl has 2 kilograms of flour. You pour in 650 grams more. How many grams of flour are in the bowl now?',
        picture: { kind: 'tape', rows: [{ label: 'flour', cells: [{ w: 3, text: '2 kg' }, { w: 1, text: '650 g', shade: true }], brace: '? g' }] }, answer: 2650,
        steps: ['2 kilograms is 2,000 grams.', 'Now both amounts are in grams, so add: 2,000 + 650.', 'So there are 2,650 grams of flour in the bowl.'] } },
      { why: 'Still "same unit first"', problem: { text: 'A ribbon is 3 meters long. You cut off 85 centimeters. How many centimeters of ribbon are left?',
        picture: { kind: 'tape', rows: [{ label: 'ribbon', cells: [{ w: 5, text: '?' }, { w: 2, text: '85 cm', shade: true }], brace: '3 m' }] }, answer: 215,
        steps: ['3 meters is 300 centimeters.', 'Now both lengths are in centimeters, so take away: 300 − 85.', 'So 215 centimeters of ribbon are left.'] } },
      { why: 'A little harder', problem: { text: 'A bag of rice weighs 6 kilograms. The rice is shared into small bags of 400 grams each. How many small bags are there?',
        picture: eqA('6 kg of rice', ['400 g in each small bag']), answer: 15,
        steps: ['6 kilograms is 6,000 grams.', '5 small bags of 400 grams make 2,000 grams, so 6,000 grams fill 3 × 5 bags.', 'So there are 15 small bags.'] } },
      { why: 'Same math in a story', problem: { text: 'A kitchen makes 4 liters of soup each day. How many milliliters of soup does it make in 5 days?',
        picture: { kind: 'tape', rows: [{ label: 'soup', cells: Array.from({ length: 5 }, () => ({ w: 1, text: '4 L' })), brace: '? mL' }] }, answer: 20000,
        steps: ['4 liters is 4,000 milliliters.', 'It makes 4,000 milliliters each day for 5 days: 5 × 4,000.', 'So it makes 20,000 milliliters of soup.'] } },
    ],
  },

  // ════ Part B · Multiplication of whole numbers ════
  // ── Topic 7 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t7', title: 'Multiply with methods you know', skill: 'Multiply a three- or four-digit number by one digit by breaking it into hundreds, tens and ones',
    bigIdea: 'Break the big number into hundreds, tens and ones, multiply each part, then add the parts.',
    screens: [
      { scene: 'g5m1-t7', title: 'Rows of corn', text: 'A farmer plants 6 long rows of corn. Each row has 128 corn plants. How many corn plants are in the field?',
        pictures: [areaB('6', ['128'])] },
      { title: 'Not in the times tables', text: "6 × 128 isn't a fact you know by heart. You could add 128 six times. But that's slow, and one slip changes the answer. Is there a better way? Yes, and you already know the pieces.",
        beats: [
          { say: "6 × 128 isn't a fact you know by heart.", pic: 0 },
          { say: "You could add 128 six times. But that's slow, and one slip changes the answer." },
          { say: 'Is there a better way? Yes, and you already know the pieces.' },
        ],
        pictures: [areaB('6', ['128'])] },
      { title: 'The big idea', text: 'Break the big number into hundreds, tens and ones, multiply each part, then add the parts.',
        beats: [
          { say: 'Break the big number into hundreds, tens and ones, multiply each part, then add the parts.', pic: 0 },
        ],
        pictures: [areaB('6', ['100', '20', '8'])] },
      { title: 'Break 128 apart', text: "Look at 128. It's 1 hundred, 2 tens and 8 ones. So each row of 128 splits into three parts, 100, 20 and 8.",
        beats: [
          { say: "Look at 128. It's 1 hundred, 2 tens and 8 ones.", pic: 1 },
          { say: 'So each row of 128 splits into three parts, 100, 20 and 8.', pic: 0 },
        ],
        pictures: [areaB('6', ['100', '20', '8']), eqB('128 = 100 + 20 + 8')] },
      { title: 'Multiply each part', text: 'Now multiply one part at a time. 6 × 1 hundred is 6 hundreds, so 6 × 100 = 600. 6 × 2 tens is 12 tens, so 6 × 20 = 120. And 6 × 8 = 48.',
        beats: [
          { say: 'Now multiply one part at a time. 6 × 1 hundred is 6 hundreds, so 6 × 100 = 600.', pic: 0 },
          { say: '6 × 2 tens is 12 tens, so 6 × 20 = 120.' },
          { say: 'And 6 × 8 = 48.' },
        ],
        pictures: [areaB('6', ['100', '20', '8'], ['600', '120', '48'], true)] },
      { title: 'Add all the parts', text: 'Last, add the three parts. 600 + 120 + 48 = 768. So 6 × 128 = 768. There are 768 corn plants in the field.',
        beats: [
          { say: 'Last, add the three parts. 600 + 120 + 48 = 768.', pic: 0 },
          { say: 'So 6 × 128 = 768. There are 768 corn plants in the field.', pic: 1 },
        ],
        pictures: [areaB('6', ['100', '20', '8'], ['600', '120', '48']), eqB('6 × 128 = 600 + 120 + 48', ['= 768'])] },
      { title: 'One thing not to do', text: "Here's the part people mix up. Don't multiply the digits as if they were all ONES. The 1 in 128 means 100 and the 2 means 20, so the parts are 600 and 120, not 6 and 12. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't multiply the digits as if they were all ONES.", pic: 0 },
          { say: 'The 1 in 128 means 100 and the 2 means 20, so the parts are 600 and 120, not 6 and 12.' },
          { say: 'Okay. Your turn.' },
        ],
        pictures: [{ kind: 'cards', wrong: '6 × 128 = 6 + 12 + 48', right: '6 × 128 = 600 + 120 + 48' }] },
    ],
    turn: {
      text: 'A farmer plants 7 rows of corn. Each row has 128 corn plants. How many corn plants are in the field?',
      picture: areaB('7', ['100', '20', '8']),
      answer: 896, steps: ['Break 128 into 100, 20 and 8.', '7 × 100 = 700, 7 × 20 = 140 and 7 × 8 = 56.', '700 + 140 + 56 = 896, so there are 896 corn plants.'],
      prompt: 'Multiply each part by 7. Then add all the parts.',
      hint1: 'Multiply 100, 20 and 8 by 7. Then add the three parts.',
      hint2: '7 × 100 = 700 and 7 × 20 = 140. Now find 7 × 8 and add all three parts.',
      twin: { text: 'A farmer plants 5 rows of carrots. Each row has 243 carrots. How many carrots are in the field?',
        picture: areaB('5', ['200', '40', '3']),
        answer: 1215, steps: ['Break 243 into 200, 40 and 3.', '5 × 200 = 1,000, 5 × 40 = 200 and 5 × 3 = 15.', '1,000 + 200 + 15 = 1,215, so there are 1,215 carrots.'],
        hint1: 'Multiply 200, 40 and 3 by 5. Then add the three parts.',
        hint2: '5 × 200 = 1,000 and 5 × 40 = 200. Now find 5 × 3 and add all three parts.' },
    },
    won: { text: 'You broke the big number into hundreds, tens and ones, multiplied each part, and added.', sticker: 'Each part you multiply and then add is called a partial product.' },
    twinWon: { text: 'You broke 243 into three parts, multiplied each one by 5, and added to get 1,215.', sticker: 'Each part you multiply and then add is called a partial product.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Find 4 × 132.',
        picture: areaB('4', ['100', '30', '2']), answer: 528,
        steps: ['Break 132 into 100, 30 and 2.', '4 × 100 = 400, 4 × 30 = 120 and 4 × 2 = 8.', '400 + 120 + 8 = 528, so 4 × 132 = 528.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Find 5 × 368.',
        picture: areaB('5', ['300', '60', '8']), answer: 1840,
        steps: ['Break 368 into 300, 60 and 8.', '5 × 300 = 1,500, 5 × 60 = 300 and 5 × 8 = 40.', '1,500 + 300 + 40 = 1,840, so 5 × 368 = 1,840.'] } },
      { why: 'Still "multiply every part"', problem: { text: 'Find 8 × 257.',
        picture: areaB('8', ['200', '50', '7']), answer: 2056,
        steps: ['Break 257 into 200, 50 and 7.', '8 × 200 = 1,600, 8 × 50 = 400 and 8 × 7 = 56.', '1,600 + 400 + 56 = 2,056, so 8 × 257 = 2,056.'] } },
      { why: 'A little harder', problem: { text: 'Find 7 × 3,264.',
        picture: areaB('7', ['3,000', '200', '60', '4']), answer: 22848,
        steps: ['Break 3,264 into 3,000, 200, 60 and 4.', '7 × 3,000 = 21,000, 7 × 200 = 1,400, 7 × 60 = 420 and 7 × 4 = 28.', '21,000 + 1,400 + 420 + 28 = 22,848, so 7 × 3,264 = 22,848.'] } },
      { why: 'Same math in a story', problem: { text: 'A bakery bakes 245 rolls every day. How many rolls does it bake in 7 days?',
        picture: areaB('7', ['200', '40', '5']), answer: 1715,
        steps: ['7 days of 245 rolls is 7 × 245. Break 245 into 200, 40 and 5.', '7 × 200 = 1,400, 7 × 40 = 280 and 7 × 5 = 35.', '1,400 + 280 + 35 = 1,715, so the bakery bakes 1,715 rolls.'] } },
    ],
  },

  // ── Topic 8 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t8', title: 'Multiply by breaking a number apart', skill: 'Multiply by a two-digit number by breaking it into tens and ones, multiplying by each part, and adding the two answers',
    bigIdea: 'Break the two-digit number into tens and ones, multiply by each part, then add the two answers.',
    screens: [
      { scene: 'g5m1-t8', title: 'Boxes of books', text: 'A bookshop gets 26 boxes of books. Each box holds 115 books. How many books does the shop get?',
        pictures: [areaB('115', ['26'])] },
      { title: 'Two digits this time', text: 'You can already multiply 115 by one digit. But 26 has two digits. Add 115, 26 times? That would take far too long.',
        beats: [
          { say: 'You can already multiply 115 by one digit.', pic: 0 },
          { say: 'But 26 has two digits. Add 115, 26 times? That would take far too long.' },
        ],
        pictures: [areaB('115', ['26'])] },
      { title: 'The big idea', text: 'Break the two-digit number into tens and ones, multiply by each part, then add the two answers.',
        beats: [
          { say: 'Break the two-digit number into tens and ones, multiply by each part, then add the two answers.', pic: 0 },
        ],
        pictures: [areaB('115', ['20', '6'])] },
      { title: 'Break 26 apart', text: '26 is 2 tens and 6 ones. So 26 boxes are 20 boxes and 6 more, and each box still holds 115 books.',
        beats: [
          { say: '26 is 2 tens and 6 ones.', pic: 1 },
          { say: 'So 26 boxes are 20 boxes and 6 more, and each box still holds 115 books.', pic: 0 },
        ],
        pictures: [areaB('115', ['20', '6']), eqB('26 = 20 + 6')] },
      { title: 'Multiply by each part', text: "Start with the tens. 115 × 2 = 230. 20 is 10 times 2, so 115 × 20 is 10 times as much. That's 2,300. Then the ones. 115 × 6 = 690.",
        beats: [
          { say: 'Start with the tens. 115 × 2 = 230.', pic: 0 },
          { say: "20 is 10 times 2, so 115 × 20 is 10 times as much. That's 2,300." },
          { say: 'Then the ones. 115 × 6 = 690.' },
        ],
        pictures: [areaB('115', ['20', '6'], ['2,300', '690'], true)] },
      { title: 'Add the two answers', text: 'Now add the two answers. 2,300 + 690 = 2,990. So 115 × 26 = 2,990. The shop gets 2,990 books.',
        beats: [
          { say: 'Now add the two answers. 2,300 + 690 = 2,990.', pic: 0 },
          { say: 'So 115 × 26 = 2,990. The shop gets 2,990 books.', pic: 1 },
        ],
        pictures: [areaB('115', ['20', '6'], ['2,300', '690']), eqB('115 × 26 = 2,300 + 690', ['= 2,990'])] },
      { title: 'One thing not to do', text: "Here's the part people mix up. Don't multiply by 2 when the 2 is in the TENS place. It means 2 tens, which is 20. So multiply 115 by 20, not by 2. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't multiply by 2 when the 2 is in the TENS place.", pic: 0 },
          { say: 'It means 2 tens, which is 20. So multiply 115 by 20, not by 2.' },
          { say: 'Okay. Your turn.' },
        ],
        pictures: [{ kind: 'cards', wrong: '115 × 2 + 115 × 6', right: '115 × 20 + 115 × 6' }] },
    ],
    turn: {
      text: 'A bookshop gets 24 boxes. Each box holds 115 books. How many books does the shop get?',
      picture: areaB('115', ['20', '4']),
      answer: 2760, steps: ['Break 24 into 20 and 4.', '115 × 20 = 2,300 and 115 × 4 = 460.', '2,300 + 460 = 2,760, so the shop gets 2,760 books.'],
      prompt: 'Multiply 115 by 20 and by 4. Then add the two answers.',
      hint1: 'Break 24 into 20 and 4. Multiply 115 by each part.',
      hint2: '115 × 2 = 230, so 115 × 20 = 2,300. Now find 115 × 4 and add.',
      twin: { text: 'A bookshop gets 32 boxes. Each box holds 214 books. How many books does the shop get?',
        picture: areaB('214', ['30', '2']),
        answer: 6848, steps: ['Break 32 into 30 and 2.', '214 × 30 = 6,420 and 214 × 2 = 428.', '6,420 + 428 = 6,848, so the shop gets 6,848 books.'],
        hint1: 'Break 32 into 30 and 2. Multiply 214 by each part.',
        hint2: '214 × 3 = 642, so 214 × 30 = 6,420. Now find 214 × 2 and add.' },
    },
    won: { text: 'You broke the two-digit number into tens and ones, multiplied by each part, and added.', sticker: 'Multiplying by each part and then adding is called the distributive property.' },
    twinWon: { text: 'You multiplied 214 by the tens and the ones of 32, then added to get 6,848.', sticker: 'Multiplying by each part and then adding is called the distributive property.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Find 115 × 23.',
        picture: areaB('115', ['20', '3']), answer: 2645,
        steps: ['Break 23 into 20 and 3.', '115 × 20 = 2,300 and 115 × 3 = 345.', '2,300 + 345 = 2,645, so 115 × 23 = 2,645.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Find 43 × 57.',
        picture: areaB('43', ['50', '7']), answer: 2451,
        steps: ['Break 57 into 50 and 7.', '43 × 50 = 2,150 and 43 × 7 = 301.', '2,150 + 301 = 2,451, so 43 × 57 = 2,451.'] } },
      { why: 'Still "tens, then ones"', problem: { text: 'Find 208 × 34.',
        picture: areaB('208', ['30', '4']), answer: 7072,
        steps: ['Break 34 into 30 and 4.', '208 × 30 = 6,240 and 208 × 4 = 832.', '6,240 + 832 = 7,072, so 208 × 34 = 7,072.'] } },
      { why: 'A little harder', problem: { text: 'Find 356 × 47.',
        picture: areaB('356', ['40', '7']), answer: 16732,
        steps: ['Break 47 into 40 and 7.', '356 × 40 = 14,240 and 356 × 7 = 2,492.', '14,240 + 2,492 = 16,732, so 356 × 47 = 16,732.'] } },
      { why: 'Same math in a story', problem: { text: 'A farm fills 45 crates with apples. Each crate holds 132 apples. How many apples are in the crates?',
        picture: areaB('132', ['40', '5']), answer: 5940,
        steps: ['45 crates of 132 apples is 132 × 45. Break 45 into 40 and 5.', '132 × 40 = 5,280 and 132 × 5 = 660.', '5,280 + 660 = 5,940, so there are 5,940 apples.'] } },
    ],
  },

  // ── Topic 9 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t9', title: 'Standard way: 2 or 3 digits × 2 digits', skill: 'Multiply a two- or three-digit number by a two-digit number in columns: a row for the ones, a row for the tens, then add',
    bigIdea: "Make a row for the ones, then a row for the tens that starts with a 0, and add the two rows.",
    screens: [
      { scene: 'g5m1-t9', title: 'Chairs in a hall', text: 'A school hall has 23 rows of chairs. Each row has 124 chairs. How many chairs are in the hall?',
        pictures: [askB('124', '23')] },
      { title: "A shorter way to write it", text: "You could break 23 into 20 and 3, and work out 124 × 20 and 124 × 3. That works, but it's a lot to write. Is there a shorter way? Yes. Stack the numbers in columns.",
        beats: [
          { say: "You could break 23 into 20 and 3, and work out 124 × 20 and 124 × 3.", pic: 0 },
          { say: "That works, but it's a lot to write." },
          { say: "Is there a shorter way? Yes. Stack the numbers in columns." },
        ],
        pictures: [askB('124', '23')] },
      { title: "The big idea", text: "Make a row for the ones, then a row for the tens that starts with a 0, and add the two rows.",
        beats: [
          { say: "Make a row for the ones, then a row for the tens that starts with a 0, and add the two rows.", pic: 0 },
        ],
        pictures: [askB('124', '23')] },
      { title: "Times the 3 ones", text: "Start with the 3 ones. 4 × 3 = 12, so write the 2 and carry the 1. 2 × 3 = 6, and the carried 1 makes 7. 1 × 3 = 3. So the ones row is 372.",
        beats: [
          { say: "Start with the 3 ones. 4 × 3 = 12, so write the 2 and carry the 1.", pic: 0 },
          { say: "2 × 3 = 6, and the carried 1 makes 7." },
          { say: "1 × 3 = 3. So the ones row is 372." },
        ],
        pictures: [mulB('124', '23', '372', ' 1 ', true)] },
      { title: "Times the 2 tens", text: "Now the 2 in 23. Is it just 2? No, it's 2 tens. So write a 0 in the ones place first. Then 124 × 2 = 248, and the tens row is 2,480.",
        beats: [
          { say: "Now the 2 in 23. Is it just 2? No, it's 2 tens." },
          { say: "So write a 0 in the ones place first.", pic: 0 },
          { say: "Then 124 × 2 = 248, and the tens row is 2,480." },
        ],
        pictures: [mulB('124', '23', '2480', undefined, true)] },
      { title: "Add the two rows", text: "Now add the two rows. 372 + 2,480 = 2,852. Look. Those rows are 124 × 3 and 124 × 20, the two parts from before. So there are 2,852 chairs in the hall.",
        beats: [
          { say: "Now add the two rows. 372 + 2,480 = 2,852.", pic: 0 },
          { say: "Look. Those rows are 124 × 3 and 124 × 20, the two parts from before." },
          { say: "So there are 2,852 chairs in the hall." },
        ],
        pictures: [{ kind: 'columns', rows: ['372', '2480'], op: '+', carry: '1  ', answer: '2852', motion: true }] },
      { title: "One thing not to do", text: "Here's the part people mix up. In the tens row, don't FORGET the 0. Without it, the row is 248, not 2,480. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "In the tens row, don't FORGET the 0.", pic: 0 },
          { say: "Without it, the row is 248, not 2,480." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '372 + 248 = 620', right: '372 + 2,480 = 2,852' }] },
    ],
    turn: {
      text: 'Multiply the standard way. 142 × 23 = ?',
      picture: mulB('142', '23'),
      answer: 3266, steps: ['Ones row: 142 × 3 = 426.', 'Tens row: write a 0, then 142 × 2 = 284. The row is 2,840.', '426 + 2,840 = 3,266, so 142 × 23 = 3,266.'],
      prompt: 'Make a row for the ones and a row for the tens. Then add the two rows.',
      hint1: 'Start with the ones row: multiply 142 by 3.',
      hint2: 'For the tens row, write a 0 first, then multiply 142 by 2. Then add the two rows.',
      twin: { text: 'Multiply the standard way. 213 × 34 = ?',
        picture: mulB('213', '34'),
        answer: 7242, steps: ['Ones row: 213 × 4 = 852.', 'Tens row: write a 0, then 213 × 3 = 639. The row is 6,390.', '852 + 6,390 = 7,242, so 213 × 34 = 7,242.'],
        hint1: 'Start with the ones row: multiply 213 by 4.',
        hint2: 'For the tens row, write a 0 first, then multiply 213 by 3. Then add the two rows.' },
    },
    won: { text: 'You made a row for the ones and a row for the tens, then added them.', sticker: 'Each row is a partial product. Adding the partial products gives the product.' },
    twinWon: { text: 'You worked out 213 × 34 in two rows and added them to get 7,242.', sticker: 'Each row is a partial product. Adding the partial products gives the product.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Multiply the standard way. 121 × 32 = ?',
        picture: mulB('121', '32'), answer: 3872,
        steps: ['Ones row: 121 × 2 = 242.', 'Tens row: write a 0, then 121 × 3 = 363. The row is 3,630.', '242 + 3,630 = 3,872, so 121 × 32 = 3,872.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Multiply the standard way. 68 × 47 = ?',
        picture: mulB('68', '47'), answer: 3196,
        steps: ['Ones row: 68 × 7 = 476.', 'Tens row: write a 0, then 68 × 4 = 272. The row is 2,720.', '476 + 2,720 = 3,196, so 68 × 47 = 3,196.'] } },
      { why: 'Still "two rows, then add"', problem: { text: 'Multiply the standard way. 306 × 27 = ?',
        picture: mulB('306', '27'), answer: 8262,
        steps: ['Ones row: 306 × 7 = 2,142.', 'Tens row: write a 0, then 306 × 2 = 612. The row is 6,120.', '2,142 + 6,120 = 8,262, so 306 × 27 = 8,262.'] } },
      { why: 'A little harder', problem: { text: 'Multiply the standard way. 478 × 56 = ?',
        picture: mulB('478', '56'), answer: 26768,
        steps: ['Ones row: 478 × 6 = 2,868.', 'Tens row: write a 0, then 478 × 5 = 2,390. The row is 23,900.', '2,868 + 23,900 = 26,768, so 478 × 56 = 26,768.'] } },
      { why: 'Same math in a story', problem: { text: 'A truck carries 165 boxes. Each box holds 48 cans. How many cans does the truck carry?',
        picture: mulB('165', '48'), answer: 7920,
        steps: ['Ones row: 165 × 8 = 1,320.', 'Tens row: write a 0, then 165 × 4 = 660. The row is 6,600.', '1,320 + 6,600 = 7,920, so the truck carries 7,920 cans.'] } },
    ],
  },

  // ── Topic 10 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t10', title: 'Standard way: 3 or 4 digits × 3 digits', skill: 'Multiply a three- or four-digit number by a three-digit number in columns: one row for each digit, then add all the rows',
    bigIdea: "Make a row for each digit of the bottom number, give each new row one more 0, then add all the rows.",
    screens: [
      { scene: 'g5m1-t10', title: 'Crates of bottles', text: 'A juice factory fills 123 crates. Each crate holds 231 bottles. How many bottles are in the crates?',
        pictures: [askB('231', '123')] },
      { title: "Two rows are not enough", text: "With 23, you made two rows, one for the ones and one for the tens. But 123 has three digits. What about the 1 hundred? It gets a row of its own.",
        beats: [
          { say: "With 23, you made two rows, one for the ones and one for the tens.", pic: 0 },
          { say: "But 123 has three digits. What about the 1 hundred?" },
          { say: "It gets a row of its own." },
        ],
        pictures: [askB('231', '123')] },
      { title: "The big idea", text: "Make a row for each digit of the bottom number, give each new row one more 0, then add all the rows.",
        beats: [
          { say: "Make a row for each digit of the bottom number, give each new row one more 0, then add all the rows.", pic: 0 },
        ],
        pictures: [askB('231', '123')] },
      { title: "The ones row", text: "Start with the 3 ones. 231 × 3. 1 × 3 = 3, 3 × 3 = 9 and 2 × 3 = 6. So the ones row is 693.",
        beats: [
          { say: "Start with the 3 ones. 231 × 3.", pic: 0 },
          { say: "1 × 3 = 3, 3 × 3 = 9 and 2 × 3 = 6. So the ones row is 693." },
        ],
        pictures: [mulB('231', '123', '693', undefined, true)] },
      { title: "The tens row", text: "Next, the 2 in 123. That 2 means 2 tens, so write one 0 first. Then 231 × 2 = 462. The tens row is 4,620.",
        beats: [
          { say: "Next, the 2 in 123. That 2 means 2 tens, so write one 0 first.", pic: 0 },
          { say: "Then 231 × 2 = 462. The tens row is 4,620." },
        ],
        pictures: [mulB('231', '123', '4620', undefined, true)] },
      { title: "The hundreds row, then add", text: "Last, the 1 in 123. It means 1 hundred, so this row starts with two 0s. Then 231 × 1 = 231. The hundreds row is 23,100. Add all three rows. 693 + 4,620 + 23,100 = 28,413 bottles.",
        beats: [
          { say: "Last, the 1 in 123. It means 1 hundred, so this row starts with two 0s." },
          { say: "Then 231 × 1 = 231. The hundreds row is 23,100." },
          { say: "Add all three rows. 693 + 4,620 + 23,100 = 28,413 bottles.", pic: 0 },
        ],
        pictures: [{ kind: 'columns', rows: ['693', '4620', '23100'], op: '+', carry: '11  ', answer: '28413', motion: true }] },
      { title: "One thing not to do", text: "Here's the part people mix up. The hundreds row starts with TWO 0s. The 1 in 123 is 1 hundred, so the row is 23,100, not 231. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "The hundreds row starts with TWO 0s.", pic: 0 },
          { say: "The 1 in 123 is 1 hundred, so the row is 23,100, not 231." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '693 + 4,620 + 231', right: '693 + 4,620 + 23,100' }] },
    ],
    turn: {
      text: 'Multiply the standard way. 214 × 123 = ?',
      picture: mulB('214', '123'),
      answer: 26322, steps: ['Ones row: 214 × 3 = 642.', 'Tens row: write one 0, then 214 × 2 = 428. The row is 4,280.', 'Hundreds row: write two 0s, then 214 × 1 = 214. The row is 21,400.', '642 + 4,280 + 21,400 = 26,322, so 214 × 123 = 26,322.'],
      prompt: 'Make one row for each digit of 123. Start each new row with one more 0.',
      hint1: 'Make one row for each digit of 123: the 3 ones, the 2 tens and the 1 hundred.',
      hint2: 'Tens row: write one 0, then 214 × 2. Hundreds row: write two 0s, then 214 × 1. Then add all three rows.',
      twin: { text: 'Multiply the standard way. 321 × 213 = ?',
        picture: mulB('321', '213'),
        answer: 68373, steps: ['Ones row: 321 × 3 = 963.', 'Tens row: write one 0, then 321 × 1 = 321. The row is 3,210.', 'Hundreds row: write two 0s, then 321 × 2 = 642. The row is 64,200.', '963 + 3,210 + 64,200 = 68,373, so 321 × 213 = 68,373.'],
        hint1: 'Make one row for each digit of 213: the 3 ones, the 1 ten and the 2 hundreds.',
        hint2: 'Tens row: write one 0, then 321 × 1. Hundreds row: write two 0s, then 321 × 2. Then add all three rows.' },
    },
    won: { text: 'You made a row for the ones, the tens and the hundreds, then added all three.', sticker: 'The numbers you multiply are called factors. The answer is called the product.' },
    twinWon: { text: 'You made three rows for 321 × 213 and added them to get 68,373.', sticker: 'The numbers you multiply are called factors. The answer is called the product.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Multiply the standard way. 132 × 121 = ?',
        picture: mulB('132', '121'), answer: 15972,
        steps: ['Ones row: 132 × 1 = 132.', 'Tens row: write one 0, then 132 × 2 = 264. The row is 2,640.', 'Hundreds row: write two 0s, then 132 × 1 = 132. The row is 13,200.', '132 + 2,640 + 13,200 = 15,972, so 132 × 121 = 15,972.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Multiply the standard way. 245 × 312 = ?',
        picture: mulB('245', '312'), answer: 76440,
        steps: ['Ones row: 245 × 2 = 490.', 'Tens row: write one 0, then 245 × 1 = 245. The row is 2,450.', 'Hundreds row: write two 0s, then 245 × 3 = 735. The row is 73,500.', '490 + 2,450 + 73,500 = 76,440, so 245 × 312 = 76,440.'] } },
      { why: 'Still "one row per digit"', problem: { text: 'Multiply the standard way. 1,324 × 213 = ?',
        picture: mulB('1324', '213'), answer: 282012,
        steps: ['Ones row: 1,324 × 3 = 3,972.', 'Tens row: write one 0, then 1,324 × 1 = 1,324. The row is 13,240.', 'Hundreds row: write two 0s, then 1,324 × 2 = 2,648. The row is 264,800.', '3,972 + 13,240 + 264,800 = 282,012, so 1,324 × 213 = 282,012.'] } },
      { why: 'A little harder', problem: { text: 'Multiply the standard way. 1,256 × 324 = ?',
        picture: mulB('1256', '324'), answer: 406944,
        steps: ['Ones row: 1,256 × 4 = 5,024.', 'Tens row: write one 0, then 1,256 × 2 = 2,512. The row is 25,120.', 'Hundreds row: write two 0s, then 1,256 × 3 = 3,768. The row is 376,800.', '5,024 + 25,120 + 376,800 = 406,944, so 1,256 × 324 = 406,944.'] } },
      { why: 'Same math in a story', problem: { text: 'A stadium has 124 sections. Each section has 236 seats. How many seats are in the stadium?',
        picture: mulB('236', '124'), answer: 29264,
        steps: ['Find 236 × 124. Ones row: 236 × 4 = 944.', 'Tens row: write one 0, then 236 × 2 = 472. The row is 4,720.', 'Hundreds row: write two 0s, then 236 × 1 = 236. The row is 23,600.', '944 + 4,720 + 23,600 = 29,264, so there are 29,264 seats.'] } },
    ],
  },

  // ── Topic 11 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t11', title: 'Multiply two big numbers', skill: 'Estimate with round numbers, multiply the standard way, and check that the answer is close to the estimate',
    bigIdea: "Estimate with round numbers first, then multiply the standard way and check that your answer is close.",
    screens: [
      { scene: 'g5m1-t11', title: 'Boxes of toys', text: 'A warehouse ships 406 boxes. Each box holds 35 toys. How many toys does it ship?',
        pictures: [askB('406', '35')] },
      { title: "One slip can go far", text: "You already know how to work out 406 × 35. But with big numbers, one small slip, like a lost 0, throws the answer far off. So how do you catch it? Estimate first.",
        beats: [
          { say: "You already know how to work out 406 × 35.", pic: 0 },
          { say: "But with big numbers, one small slip, like a lost 0, throws the answer far off." },
          { say: "So how do you catch it? Estimate first." },
        ],
        pictures: [askB('406', '35')] },
      { title: "The big idea", text: "Estimate with round numbers first, then multiply the standard way and check that your answer is close.",
        beats: [
          { say: "Estimate with round numbers first, then multiply the standard way and check that your answer is close.", pic: 0 },
        ],
        pictures: [askB('406', '35')] },
      { title: "Estimate first", text: "406 is close to 400, and 35 rounds up to 40. 400 × 40 = 16,000. So the answer should be somewhere near 16,000.",
        beats: [
          { say: "406 is close to 400, and 35 rounds up to 40.", pic: 0 },
          { say: "400 × 40 = 16,000.", pic: 1 },
          { say: "So the answer should be somewhere near 16,000." },
        ],
        pictures: [askB('406', '35'), eqB('about 400 × 40', ['= 16,000'])] },
      { title: "Multiply the standard way", text: "Now multiply for real. The ones row is 406 × 5 = 2,030. The tens row starts with a 0. Then 406 × 3 = 1,218, so the row is 12,180.",
        beats: [
          { say: "Now multiply for real. The ones row is 406 × 5 = 2,030.", pic: 0 },
          { say: "The tens row starts with a 0. Then 406 × 3 = 1,218, so the row is 12,180." },
        ],
        pictures: [{ kind: 'columns', rows: ['2030', '12180'], op: '+', answer: null }] },
      { title: "Add, then check", text: "Add the rows. 2,030 + 12,180 = 14,210. Now check. Is 14,210 close to 16,000? Yes, so it makes sense. The warehouse ships 14,210 toys.",
        beats: [
          { say: "Add the rows. 2,030 + 12,180 = 14,210.", pic: 0 },
          { say: "Now check. Is 14,210 close to 16,000? Yes, so it makes sense.", pic: 1 },
          { say: "The warehouse ships 14,210 toys." },
        ],
        pictures: [{ kind: 'columns', rows: ['2030', '12180'], op: '+', carry: '1  ', answer: '14210', motion: true }, eqB('14,210', ['is close to 16,000'])] },
      { title: "One thing not to do", text: "Here's the part people mix up. If your answer is far from the estimate, don't KEEP it. 3,248 is nowhere near 16,000, so a row lost its 0. Go back and fix that row. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "If your answer is far from the estimate, don't KEEP it.", pic: 0 },
          { say: "3,248 is nowhere near 16,000, so a row lost its 0. Go back and fix that row." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '406 × 35 = 3,248', right: '406 × 35 = 14,210' }] },
    ],
    turn: {
      text: 'Estimate 406 × 27 first. Then multiply the standard way to find the exact answer.',
      picture: mulB('406', '27'),
      answer: 10962, steps: ['Estimate: 406 rounds to 400 and 27 rounds to 30, so the answer is about 400 × 30 = 12,000.', 'Ones row: 406 × 7 = 2,842. Tens row: write a 0, then 406 × 2 = 812. The row is 8,120.', '2,842 + 8,120 = 10,962. That is close to 12,000, so 406 × 27 = 10,962.'],
      prompt: 'Estimate first. Then multiply, and check that your answer is close to the estimate.',
      hint1: 'Estimate first: 406 is about 400 and 27 is about 30. Your exact answer should be close to 400 × 30.',
      hint2: 'Ones row: 406 × 7. Tens row: write a 0, then 406 × 2. Add the two rows.',
      twin: { text: 'Estimate 507 × 38 first. Then multiply the standard way to find the exact answer.',
        picture: mulB('507', '38'),
        answer: 19266, steps: ['Estimate: 507 rounds to 500 and 38 rounds to 40, so the answer is about 500 × 40 = 20,000.', 'Ones row: 507 × 8 = 4,056. Tens row: write a 0, then 507 × 3 = 1,521. The row is 15,210.', '4,056 + 15,210 = 19,266. That is close to 20,000, so 507 × 38 = 19,266.'],
        hint1: 'Estimate first: 507 is about 500 and 38 is about 40. Your exact answer should be close to 500 × 40.',
        hint2: 'Ones row: 507 × 8. Tens row: write a 0, then 507 × 3. Add the two rows.' },
    },
    won: { text: 'You estimated first, multiplied the standard way, and checked that your answer was close.', sticker: 'When a product is close to its estimate, we say the answer is reasonable.' },
    twinWon: { text: 'You estimated first, then found 507 × 38 = 19,266 and checked that it was close.', sticker: 'When a product is close to its estimate, we say the answer is reasonable.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Estimate 305 × 29 first. Then multiply the standard way to find the exact answer.',
        picture: mulB('305', '29'), answer: 8845,
        steps: ['Estimate: 305 rounds to 300 and 29 rounds to 30, so the answer is about 300 × 30 = 9,000.', 'Ones row: 305 × 9 = 2,745. Tens row: write a 0, then 305 × 2 = 610. The row is 6,100.', '2,745 + 6,100 = 8,845. That is close to 9,000, so 305 × 29 = 8,845.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Estimate 709 × 62 first. Then multiply the standard way to find the exact answer.',
        picture: mulB('709', '62'), answer: 43958,
        steps: ['Estimate: 709 rounds to 700 and 62 rounds to 60, so the answer is about 700 × 60 = 42,000.', 'Ones row: 709 × 2 = 1,418. Tens row: write a 0, then 709 × 6 = 4,254. The row is 42,540.', '1,418 + 42,540 = 43,958. That is close to 42,000, so 709 × 62 = 43,958.'] } },
      { why: 'Still "estimate, then check"', problem: { text: 'Estimate 1,208 × 26 first. Then multiply the standard way to find the exact answer.',
        picture: mulB('1208', '26'), answer: 31408,
        steps: ['Estimate: 1,208 rounds to 1,000 and 26 rounds to 30, so the answer is about 1,000 × 30 = 30,000.', 'Ones row: 1,208 × 6 = 7,248. Tens row: write a 0, then 1,208 × 2 = 2,416. The row is 24,160.', '7,248 + 24,160 = 31,408. That is close to 30,000, so 1,208 × 26 = 31,408.'] } },
      { why: 'A little harder', problem: { text: 'Estimate 608 × 213 first. Then multiply the standard way to find the exact answer.',
        picture: mulB('608', '213'), answer: 129504,
        steps: ['Estimate: 608 rounds to 600 and 213 rounds to 200, so the answer is about 600 × 200 = 120,000.', 'Ones row: 608 × 3 = 1,824. Tens row: write one 0, then 608 × 1 = 608. The row is 6,080.', 'Hundreds row: write two 0s, then 608 × 2 = 1,216. The row is 121,600.', '1,824 + 6,080 + 121,600 = 129,504. That is close to 120,000, so 608 × 213 = 129,504.'] } },
      { why: 'Same math in a story', problem: { text: 'A warehouse sends out 2,305 packages every day. Estimate first, then find exactly how many packages it sends out in 48 days.',
        picture: mulB('2305', '48'), answer: 110640,
        steps: ['Estimate: 2,305 rounds to 2,000 and 48 rounds to 50, so the answer is about 2,000 × 50 = 100,000.', 'Ones row: 2,305 × 8 = 18,440. Tens row: write a 0, then 2,305 × 4 = 9,220. The row is 92,200.', '18,440 + 92,200 = 110,640. That is close to 100,000, so the warehouse sends out 110,640 packages.'] } },
    ],
  },

  // ════ Part C · Division of whole numbers ════
  // ── Topic 12 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t12', title: 'Divide by multiples of 10', skill: 'Divide by 20, 30 … 90 by thinking of both numbers in tens',
    bigIdea: IDEA12C,
    screens: [
      { scene: 'g5m1-t12', title: 'Buses for a school trip', text: '240 students are going on a school trip. Each bus has seats for 60 students. How many buses do they fill?',
        pictures: [lineC('ends')] },
      { title: "Not a fact you know", text: "240 ÷ 60 isn't a fact you know by heart. You could count up by 60s, but that's slow, and one slip changes the answer. Is there a fact hiding inside it? Yes.",
        beats: [
          { say: "240 ÷ 60 isn't a fact you know by heart.", pic: 0 },
          { say: "You could count up by 60s, but that's slow, and one slip changes the answer." },
          { say: "Is there a fact hiding inside it? Yes." },
        ],
        pictures: [lineC('ends')] },
      { title: "The big idea", text: IDEA12C,
        beats: [
          { say: "Think of both numbers in tens, and 240 ÷ 60 becomes 24 tens ÷ 6 tens, the same as 24 ÷ 6.", pic: 1 },
        ],
        pictures: [lineC('ends'), eqC('240 ÷ 60', ['24 tens ÷ 6 tens', '24 ÷ 6'])] },
      { title: "240 is 24 tens", text: "Look at this line. Each small step is 10. Jump 10 tens to 100, 10 more to 200, then 4 more to 240. That's 24 tens in all.",
        beats: [
          { say: "Look at this line. Each small step is 10.", pic: 0 },
          { say: "Jump 10 tens to 100, 10 more to 200, then 4 more to 240." },
          { say: "That's 24 tens in all.", pic: 1 },
        ],
        pictures: [lineC(labelsC(0, 100, 200, 240), [{ from: 0, to: 100, label: '10 tens' }, { from: 100, to: 200, label: '10 tens' }, { from: 200, to: 240, label: '4 tens' }]),
          eqC('240 = 24 tens')] },
      { title: "60 is 6 tens", text: "Now one bus. It seats 60 students. How many small steps is 60? 6, so 60 is 6 tens. One busload is one jump of 6 tens.",
        beats: [
          { say: "Now one bus. It seats 60 students.", pic: 0 },
          { say: "How many small steps is 60? 6, so 60 is 6 tens.", pic: 1 },
          { say: "One busload is one jump of 6 tens." },
        ],
        pictures: [lineC(labelsC(0, 60, 240), [{ from: 0, to: 60, label: '6 tens' }]), eqC('60 = 6 tens')] },
      { title: "Count the jumps", text: "So jump 6 tens at a time, from 0 all the way to 240. That's 4 jumps, because 24 ÷ 6 = 4. So 240 ÷ 60 = 4. The students fill 4 buses.",
        beats: [
          { say: "So jump 6 tens at a time, from 0 all the way to 240.", pic: 0 },
          { say: "That's 4 jumps, because 24 ÷ 6 = 4.", pic: 1 },
          { say: "So 240 ÷ 60 = 4. The students fill 4 buses." },
        ],
        pictures: [lineC(labelsC(0, 60, 120, 180, 240), [{ from: 0, to: 60, label: '6 tens' }, { from: 60, to: 120, label: '6 tens' }, { from: 120, to: 180, label: '6 tens' }, { from: 180, to: 240, label: '6 tens' }]),
          eqC('24 ÷ 6 = 4', ['so 240 ÷ 60 = 4'])] },
      { title: "One thing not to do", text: "Here's the part people mix up. Take the 0 off BOTH numbers, never just one. Take it off only the 60 and you get 240 ÷ 6, a different problem. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Take the 0 off BOTH numbers, never just one.", pic: 0 },
          { say: "Take it off only the 60 and you get 240 ÷ 6, a different problem." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '240 ÷ 60 = 40', right: '240 ÷ 60 = 4' }] },
    ],
    turn: {
      text: '420 students ride buses that each seat 60 students. How many buses do they fill?',
      picture: eqC('420 ÷ 60 = ?'),
      answer: 7, steps: ['420 is 42 tens, and 60 is 6 tens.', 'So 420 ÷ 60 is the same as 42 ÷ 6.', '42 ÷ 6 = 7, so they fill 7 buses.'],
      prompt: 'Think of both numbers in tens. Then use a fact you know.',
      hint1: 'How many tens is 420? How many tens is 60?',
      hint2: '420 ÷ 60 is the same as 42 ÷ 6. What number times 6 makes 42?',
      twin: { text: 'Find 360 ÷ 40.',
        picture: eqC('360 ÷ 40 = ?'),
        answer: 9, steps: ['360 is 36 tens, and 40 is 4 tens.', 'So 360 ÷ 40 is the same as 36 ÷ 4.', '36 ÷ 4 = 9, so 360 ÷ 40 = 9.'],
        hint1: 'How many tens is 360? How many tens is 40?',
        hint2: 'Write both numbers as tens. Which fact do they make?' },
    },
    won: { text: 'You thought of both numbers in tens and used a fact you know.', sticker: 'The numbers you say when you count by tens are called multiples of ten.' },
    twinWon: { text: 'You thought of 360 and 40 in tens and found 9.', sticker: 'The numbers you say when you count by tens are called multiples of ten.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Find 180 ÷ 60.',
        picture: eqC('180 ÷ 60 = ?'), answer: 3,
        steps: ['180 is 18 tens, and 60 is 6 tens.', 'So 180 ÷ 60 is the same as 18 ÷ 6.', '18 ÷ 6 = 3, so 180 ÷ 60 = 3.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Find 450 ÷ 90.',
        picture: eqC('450 ÷ 90 = ?'), answer: 5,
        steps: ['450 is 45 tens, and 90 is 9 tens.', 'So 450 ÷ 90 is the same as 45 ÷ 9.', '45 ÷ 9 = 5, so 450 ÷ 90 = 5.'] } },
      { why: 'Still "think in tens"', problem: { text: 'Find 80 ÷ 20.',
        picture: eqC('80 ÷ 20 = ?'), answer: 4,
        steps: ['80 is 8 tens, and 20 is 2 tens.', 'So 80 ÷ 20 is the same as 8 ÷ 2.', '8 ÷ 2 = 4, so 80 ÷ 20 = 4.'] } },
      { why: 'A little harder', problem: { text: 'Find 720 ÷ 40.',
        picture: eqC('720 ÷ 40 = ?'), answer: 18,
        steps: ['720 is 72 tens, and 40 is 4 tens. So find 72 ÷ 4.', '72 is 40 + 32. 40 ÷ 4 = 10 and 32 ÷ 4 = 8.', '10 + 8 = 18, so 720 ÷ 40 = 18.'] } },
      { why: 'Same math in a story', problem: { text: 'A store has 320 pencils. It packs 40 pencils in each box. How many boxes does it fill?',
        picture: eqC('320 ÷ 40 = ?'), answer: 8,
        steps: ['320 is 32 tens, and 40 is 4 tens.', 'So 320 ÷ 40 is the same as 32 ÷ 4.', '32 ÷ 4 = 8, so the store fills 8 boxes.'] } },
    ],
  },

  // ── Topic 13 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t13', title: '2-digit ÷ 2-digit, one-digit answer', skill: 'Divide a 2-digit number by a 2-digit number: guess with the nearest ten, then multiply to check',
    bigIdea: IDEA13C,
    screens: [
      { scene: 'g5m1-t13', title: 'Teams on the field', text: '68 kids come to play on the sports field. The coach puts 17 kids on each team. How many teams can she make?',
        pictures: [kidsC] },
      { title: "No facts for 17s", text: "You know your facts up to 10 × 10. But nobody learns the 17s. You could count 17, 34, 51 and on, but it's slow and hard to keep track. Is there a quicker way? Yes, a smart guess.",
        beats: [
          { say: "You know your facts up to 10 × 10. But nobody learns the 17s.", pic: 0 },
          { say: "You could count 17, 34, 51 and on, but it's slow and hard to keep track." },
          { say: "Is there a quicker way? Yes, a smart guess." },
        ],
        pictures: [kidsC] },
      { title: "The big idea", text: IDEA13C,
        beats: [
          { say: "Guess with the nearest ten, then multiply to check, and if a whole group still fits in what is left, add one more.", pic: 0 },
        ],
        pictures: [kidsC] },
      { title: "Make a guess", text: "17 is close to 20, so guess with 20s. How many 20s fit into 68? 3 × 20 = 60, and 4 × 20 = 80 is too many. So the guess is 3 teams.",
        beats: [
          { say: "17 is close to 20, so guess with 20s.", pic: 0 },
          { say: "How many 20s fit into 68? 3 × 20 = 60, and 4 × 20 = 80 is too many." },
          { say: "So the guess is 3 teams." },
        ],
        pictures: [{ kind: 'tape', motion: true, rows: [
          { label: 'Kids', cells: [{ w: 68, text: '68' }] },
          { label: 'Guess', cells: [{ w: 20, text: '20', shade: true }, { w: 20, text: '20', shade: true }, { w: 20, text: '20', shade: true }] },
        ] }] },
      { title: "Check the guess", text: "Now check with the real team size. 3 × 17 = 51. Take that away. 68 − 51 = 17, so 17 kids are left.",
        beats: [
          { say: "Now check with the real team size. 3 × 17 = 51.", pic: 0 },
          { say: "Take that away. 68 − 51 = 17, so 17 kids are left." },
        ],
        pictures: [{ kind: 'tape', motion: true, rows: [
          { label: 'Kids', cells: [{ w: 17, text: '17', shade: true }, { w: 17, text: '17', shade: true }, { w: 17, text: '17', shade: true }, { w: 17, text: '17 left' }] },
        ] }] },
      { title: "One more team", text: "Wait. 17 kids left is a whole team, so the guess was too small. Add one more team. 4 × 17 = 68, and no one is left out. So 68 ÷ 17 = 4. The coach makes 4 teams.",
        beats: [
          { say: "Wait. 17 kids left is a whole team, so the guess was too small.", pic: 0 },
          { say: "Add one more team. 4 × 17 = 68, and no one is left out.", pic: 1 },
          { say: "So 68 ÷ 17 = 4. The coach makes 4 teams." },
        ],
        pictures: [{ kind: 'tape', motion: true, rows: [
          { label: 'Kids', cells: [{ w: 17, text: '17', shade: true }, { w: 17, text: '17', shade: true }, { w: 17, text: '17', shade: true }, { w: 17, text: '17', shade: true }], brace: '4 teams' },
        ] }, eqC('68 ÷ 17 = 4', ['4 × 17 = 68'])] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't STOP while a whole group still fits in what's left. 17 left makes one more team, so the answer is 4, not 3. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't STOP while a whole group still fits in what's left.", pic: 0 },
          { say: "17 left makes one more team, so the answer is 4, not 3." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '68 ÷ 17 = 3 and 17 left', right: '68 ÷ 17 = 4' }] },
    ],
    turn: {
      text: '85 kids come to the field. The coach puts 17 kids on each team. How many teams can she make?',
      picture: eqC('85 ÷ 17 = ?'),
      answer: 5, steps: ['17 is close to 20. 20s fit into 85 four times, so guess 4.', 'Check: 4 × 17 = 68, and 85 − 68 = 17. A whole team still fits, so the guess was too small.', 'Add one: 5 × 17 = 85. The coach makes 5 teams.'],
      prompt: 'Round 17 to the nearest ten and guess. Then multiply to check.',
      hint1: 'How many 20s fit into 85?',
      hint2: 'Multiply your guess by 17 and take it away from 85. Is a whole team of 17 still left?',
      twin: { text: 'The coach has 78 vests. She puts 26 vests in each bag. How many bags does she fill?',
        picture: eqC('78 ÷ 26 = ?'),
        answer: 3, steps: ['26 is close to 30. 30s fit into 78 two times, so guess 2.', 'Check: 2 × 26 = 52, and 78 − 52 = 26. A whole bag of 26 still fits.', 'Add one: 3 × 26 = 78. She fills 3 bags.'],
        hint1: 'Round 26 to the nearest ten. How many of those fit into 78?',
        hint2: 'Multiply your guess by 26 and take it away from 78. If 26 more still fit, add one.' },
    },
    won: { text: 'You guessed with a round number, multiplied to check, and added one when a whole team still fit.', sticker: 'The number you divide by is called the divisor.' },
    twinWon: { text: 'You rounded 26, checked your guess, and found 3 bags.', sticker: 'The number you divide by is called the divisor.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Find 72 ÷ 18.',
        picture: eqC('72 ÷ 18 = ?'), answer: 4,
        steps: ['18 is close to 20. 20s fit into 72 three times, so guess 3.', 'Check: 3 × 18 = 54, and 72 − 54 = 18. A whole 18 still fits.', 'Add one: 4 × 18 = 72. So 72 ÷ 18 = 4.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Find 58 ÷ 29.',
        picture: eqC('58 ÷ 29 = ?'), answer: 2,
        steps: ['29 is close to 30. 30s fit into 58 one time, so guess 1.', 'Check: 1 × 29 = 29, and 58 − 29 = 29. A whole 29 still fits.', 'Add one: 2 × 29 = 58. So 58 ÷ 29 = 2.'] } },
      { why: 'Still "guess, then check"', problem: { text: 'Find 92 ÷ 23.',
        picture: eqC('92 ÷ 23 = ?'), answer: 4,
        steps: ['23 is close to 20. 20s fit into 92 four times, so guess 4.', 'Check: 4 × 23 = 92, and 92 − 92 = 0. No whole group is left.', 'The guess was right, so 92 ÷ 23 = 4.'] } },
      { why: 'A little harder', problem: { text: 'Find 96 ÷ 16.',
        picture: eqC('96 ÷ 16 = ?'), answer: 6,
        steps: ['16 is close to 20. 20s fit into 96 four times, so guess 4.', 'Check: 4 × 16 = 64, and 96 − 64 = 32. Two more 16s fit into 32, so the guess was 2 too small.', '4 + 2 = 6, and 6 × 16 = 96. So 96 ÷ 16 = 6.'] } },
      { why: 'Same math in a story', problem: { text: 'A school buys 90 new team vests. They come in packs of 18. How many packs does the school buy?',
        picture: eqC('90 ÷ 18 = ?'), answer: 5,
        steps: ['18 is close to 20. 20s fit into 90 four times, so guess 4.', 'Check: 4 × 18 = 72, and 90 − 72 = 18. A whole pack still fits.', 'Add one: 5 × 18 = 90. The school buys 5 packs.'] } },
    ],
  },

  // ── Topic 14 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t14', title: '3-digit ÷ 2-digit, one-digit answer', skill: 'Divide a 3-digit number by a 2-digit number when the answer has one digit, trying one less when a guess is too big',
    bigIdea: IDEA14C,
    screens: [
      { scene: 'g5m1-t14', title: 'Bunches of roses', text: 'A flower shop has 184 roses. It puts 23 roses in each bunch. How many bunches can it make?',
        pictures: [rosesC()] },
      { title: "The first digits are too small", text: "You usually start with the first digit, or the first two. But 23 doesn't fit into 1, and it doesn't fit into 18 either.",
        beats: [
          { say: "You usually start with the first digit, or the first two.", pic: 0 },
          { say: "But 23 doesn't fit into 1, and it doesn't fit into 18 either." },
        ],
        pictures: [rosesC()] },
      { title: "The big idea", text: IDEA14C,
        beats: [
          { say: "If the number you divide by doesn't fit into the first two digits, the answer has one digit, so guess with round numbers and try one less if it's too big.", pic: 0 },
        ],
        pictures: [rosesC()] },
      { title: "Only one digit", text: "23 doesn't fit into 18 tens, so the answer has no tens. Where does its one digit go? Up over the 4.",
        beats: [
          { say: "23 doesn't fit into 18 tens, so the answer has no tens.", pic: 0 },
          { say: "Where does its one digit go? Up over the 4." },
        ],
        pictures: [rosesC('  ?')] },
      { title: "Guess with round numbers", text: "23 is close to 20. How many 20s fit into 184? 9 × 20 = 180, so guess 9. Now check with the real number. 9 × 23 = 207. That's more than 184, so 9 is too big.",
        beats: [
          { say: "23 is close to 20. How many 20s fit into 184? 9 × 20 = 180, so guess 9.", pic: 0 },
          { say: "Now check with the real number. 9 × 23 = 207." },
          { say: "That's more than 184, so 9 is too big.", pic: 1 },
        ],
        pictures: [rosesC('  ?'), triesC([['9', '207', 'no']])] },
      { title: "Try one less", text: "So try one less. 8 × 23 = 184. It fits exactly, with 0 left, so write the 8 over the 4. 184 ÷ 23 = 8. The shop makes 8 bunches.",
        beats: [
          { say: "So try one less. 8 × 23 = 184.", pic: 1 },
          { say: "It fits exactly, with 0 left, so write the 8 over the 4.", pic: 0 },
          { say: "184 ÷ 23 = 8. The shop makes 8 bunches." },
        ],
        pictures: [rosesC('  8', ['−184', '  0']), triesC([['9', '207', 'no'], ['8', '184', 'yes']])] },
      { title: "One thing not to do", text: "Here's the part people mix up. Never KEEP a guess that is too big. 9 × 23 = 207, and that's more than the 184 roses, so try one less. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Never KEEP a guess that is too big.", pic: 0 },
          { say: "9 × 23 = 207, and that's more than the 184 roses, so try one less." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '184 ÷ 23 = 9', right: '184 ÷ 23 = 8' }] },
    ],
    turn: {
      text: 'The shop has 161 roses. It puts 23 roses in each bunch. How many bunches can it make?',
      picture: ldC('23', '161'),
      answer: 7, steps: ['23 does not fit into 16, so the answer has one digit.', '23 is close to 20, and 20s fit into 161 eight times. But 8 × 23 = 184, which is too big.', 'Try one less: 7 × 23 = 161. So the shop makes 7 bunches.'],
      prompt: 'Guess with round numbers. If the guess is too big, try one less.',
      hint1: 'Does 23 fit into 16? Then how many 20s fit into 161?',
      hint2: 'Multiply your guess by 23. If that is more than 161, try one less.',
      twin: { text: 'The shop has 144 daisies. It puts 24 daisies in each bucket. How many buckets can it fill?',
        picture: ldC('24', '144'),
        answer: 6, steps: ['24 does not fit into 14, so the answer has one digit.', '24 is close to 20, and 20s fit into 144 seven times. But 7 × 24 = 168, which is too big.', 'Try one less: 6 × 24 = 144. So the shop fills 6 buckets.'],
        hint1: 'Does 24 fit into 14? Then how many 20s fit into 144?',
        hint2: 'Multiply your guess by 24. If that is more than 144, try one less.' },
    },
    won: { text: 'You saw the answer had one digit, guessed with round numbers, and tried one less when the guess was too big.', sticker: 'The answer to a division is called the quotient. What is left over is called the remainder.' },
    twinWon: { text: 'You checked your guess for 144 ÷ 24 and filled 6 buckets.', sticker: 'The answer to a division is called the quotient. What is left over is called the remainder.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Find 120 ÷ 24.',
        picture: ldC('24', '120'), answer: 5,
        steps: ['24 does not fit into 12, so the answer has one digit.', '20s fit into 120 six times. But 6 × 24 = 144, which is too big.', 'Try one less: 5 × 24 = 120. So 120 ÷ 24 = 5.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Find 272 ÷ 34.',
        picture: ldC('34', '272'), answer: 8,
        steps: ['34 does not fit into 27, so the answer has one digit.', '34 is close to 30, and 30s fit into 272 nine times. But 9 × 34 = 306, which is too big.', 'Try one less: 8 × 34 = 272. So 272 ÷ 34 = 8.'] } },
      { why: 'Still "one-digit answer"', problem: { text: 'Find 369 ÷ 41.',
        picture: ldC('41', '369'), answer: 9,
        steps: ['41 does not fit into 36, so the answer has one digit.', '41 is close to 40, and 40s fit into 369 nine times. Check: 9 × 41 = 369.', 'It fits with 0 left, so 369 ÷ 41 = 9.'] } },
      { why: 'A little harder', problem: { text: 'Divide 287 by 34. What is the remainder?',
        picture: ldC('34', '287'), answer: 15,
        steps: ['34 does not fit into 28, so the answer has one digit.', '30s fit into 287 nine times, but 9 × 34 = 306 is too big. Try 8: 8 × 34 = 272.', '287 − 272 = 15, so the remainder is 15.'] } },
      { why: 'Same math in a story', problem: { text: 'A florist has 192 roses. She puts 24 roses in each vase. How many vases does she fill?',
        picture: ldC('24', '192'), answer: 8,
        steps: ['24 does not fit into 19, so the answer has one digit.', '20s fit into 192 nine times. But 9 × 24 = 216, which is too big.', 'Try one less: 8 × 24 = 192. So she fills 8 vases.'] } },
    ],
  },

  // ── Topic 15 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t15', title: '3-digit ÷ 2-digit, two-digit answer', skill: 'Divide a 3-digit number by a 2-digit number place by place: the tens, then the ones',
    bigIdea: IDEA15C,
    screens: [
      { scene: 'g5m1-t15', title: 'Cartons of eggs', text: 'A farm store has 312 eggs. Each carton holds 13 eggs. How many cartons can the store fill?',
        pictures: [eggsC()] },
      { title: 'Too much for one guess', text: 'This time 13 does fit into 31, the first two digits of 312. So the answer has a tens digit and a ones digit. That is too much to find with one guess.',
        beats: [
          { say: 'This time 13 does fit into 31, the first two digits of 312.', pic: 0 },
          { say: 'So the answer has a tens digit and a ones digit. That is too much to find with one guess.' },
        ],
        pictures: [eggsC(' ??')] },
      { title: 'The big idea', text: IDEA15C,
        beats: [
          { say: 'Divide the tens first and take away.', pic: 0 },
          { say: 'Then bring down the ones and divide again.' },
        ],
        pictures: [eggsC(' ??')] },
      { title: 'Divide the tens', text: 'Start with the 31 tens. 2 × 13 = 26 fits, and 3 × 13 = 39 is too many. So write the 2 over the 1. Take away: 31 − 26 = 5.',
        beats: [
          { say: 'Start with the 31 tens. 2 × 13 = 26 fits, and 3 × 13 = 39 is too many.', pic: 1 },
          { say: 'So write the 2 over the 1. Take away: 31 − 26 = 5.', pic: 0 },
        ],
        pictures: [eggsC(' 2', ['−26', ' 5']), placesC([['Tens', '2 × 13 = 26', '31 − 26 = 5']])] },
      { title: 'Bring down the ones', text: '5 tens are left over. Now bring down the 2 ones and write it beside the 5. Now there are 52 to divide.',
        beats: [
          { say: '5 tens are left over. Now bring down the 2 ones and write it beside the 5.', pic: 0 },
          { say: 'Now there are 52 to divide.', write: 'bring down the next digit' },
        ],
        pictures: [eggsC(' 2', ['−26', ' 52'])] },
      { title: 'Divide the ones', text: 'Round two. 4 × 13 = 52, so write the 4 over the 2. Take away: 52 − 52 = 0. So 312 ÷ 13 = 24. The store fills 24 cartons.',
        beats: [
          { say: 'Round two. 4 × 13 = 52, so write the 4 over the 2.', pic: 0 },
          { say: 'Take away: 52 − 52 = 0.', pic: 1 },
          { say: 'So 312 ÷ 13 = 24. The store fills 24 cartons.' },
        ],
        pictures: [eggsC(' 24', ['−26', ' 52', ' −52', '  0']), placesC([['Tens', '2 × 13 = 26', '31 − 26 = 5'], ['Ones', '4 × 13 = 52', '52 − 52 = 0']])] },
      { title: 'One thing not to do', text: 'Here is the one to watch. Do not stop after the tens. The 2 ones still have to come down. You are done only when every digit has come down.',
        beats: [
          { say: 'Here is the one to watch.' },
          { say: 'Do not stop after the tens.', pic: 0 },
          { say: 'The 2 ones still have to come down. You are done only when every digit has come down.' },
        ],
        pictures: [{ kind: 'cards', wrong: '312 ÷ 13 = 2, 5 left', right: '312 ÷ 13 = 24' }] },
    ],
    turn: {
      text: 'The store gets 325 eggs. Each carton holds 13 eggs. How many cartons can it fill?',
      picture: ldC('13', '325'),
      answer: 25, steps: ['Tens: 2 × 13 = 26 fits into 32. Write 2, and 32 − 26 = 6.', 'Bring down the 5 to make 65. Ones: 5 × 13 = 65, and 65 − 65 = 0.', 'So the store fills 25 cartons.'],
      prompt: 'Divide the tens first. Then bring down the ones and divide again.',
      hint1: 'Start with the tens. How many 13s fit into 32?',
      hint2: 'Take 26 away from 32. Bring down the 5 beside what is left, then divide by 13 again.',
      twin: { text: 'Find 598 ÷ 23.',
        picture: ldC('23', '598'),
        answer: 26, steps: ['Tens: 2 × 23 = 46 fits into 59. Write 2, and 59 − 46 = 13.', 'Bring down the 8 to make 138. Ones: 6 × 23 = 138, and 138 − 138 = 0.', 'So 598 ÷ 23 = 26.'],
        hint1: 'Start with the tens. How many 23s fit into 59?',
        hint2: 'Take the 23s away from 59. Bring down the 8, then divide by 23 again.' },
    },
    won: { text: 'You divided the tens, brought down the ones, and divided again.', sticker: 'The number you divide is called the dividend.' },
    twinWon: { text: 'You divided 598 by 23 one place at a time and got 26.', sticker: 'The number you divide is called the dividend.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Find 299 ÷ 13.',
        picture: ldC('13', '299'), answer: 23,
        steps: ['Tens: 2 × 13 = 26 fits into 29. Write 2, and 29 − 26 = 3.', 'Bring down the 9 to make 39. Ones: 3 × 13 = 39, with 0 left.', 'So 299 ÷ 13 = 23.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Find 682 ÷ 31.',
        picture: ldC('31', '682'), answer: 22,
        steps: ['Tens: 2 × 31 = 62 fits into 68. Write 2, and 68 − 62 = 6.', 'Bring down the 2 to make 62. Ones: 2 × 31 = 62, with 0 left.', 'So 682 ÷ 31 = 22.'] } },
      { why: 'Still "tens first, then ones"', problem: { text: 'Find 855 ÷ 45.',
        picture: ldC('45', '855'), answer: 19,
        steps: ['Tens: 45 fits into 85 one time. Write 1, and 85 − 45 = 40.', 'Bring down the 5 to make 405. Ones: 9 × 45 = 405, with 0 left.', 'So 855 ÷ 45 = 19.'] } },
      { why: 'A little harder', problem: { text: 'Find 896 ÷ 32.',
        picture: ldC('32', '896'), answer: 28,
        steps: ['Tens: 2 × 32 = 64 fits into 89, and 3 × 32 = 96 does not. Write 2, and 89 − 64 = 25.', 'Bring down the 6 to make 256. Ones: 8 × 32 = 256, with 0 left.', 'So 896 ÷ 32 = 28.'] } },
      { why: 'Same math in a story', problem: { text: 'A farm store packs 624 eggs into cartons of 12. How many cartons does it fill?',
        picture: ldC('12', '624'), answer: 52,
        steps: ['Tens: 5 × 12 = 60 fits into 62. Write 5, and 62 − 60 = 2.', 'Bring down the 4 to make 24. Ones: 2 × 12 = 24, with 0 left.', 'So the store fills 52 cartons.'] } },
    ],
  },

  // ── Topic 16 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t16', title: '4-digit ÷ 2-digit', skill: 'Divide a 4-digit number by a 2-digit number: find where to start, then bring down one digit at a time',
    bigIdea: IDEA16C,
    screens: [
      { scene: 'g5m1-t16', title: 'Sharing stickers', text: '24 kids at the craft table share 1,176 stickers equally. How many stickers does each kid get?',
        pictures: [stickersC()] },
      { title: 'Where do you start?', text: 'The first two digits of 1,176 make 11, and 24 does not fit into 11. And if the answer starts one place too far left, every digit of it lands one place off.',
        beats: [
          { say: 'The first two digits of 1,176 make 11, and 24 does not fit into 11.', pic: 0 },
          { say: 'And if the answer starts one place too far left, every digit of it lands one place off.' },
        ],
        pictures: [stickersC()] },
      { title: 'The big idea', text: IDEA16C,
        beats: [
          { say: 'Find where to start: if the number you divide by does not fit into the first two digits, start with the first three.', pic: 0 },
          { say: 'Then bring down one digit at a time.' },
        ],
        pictures: [stickersC()] },
      { title: 'Find where to start', text: 'Walk it with me. 24 does not fit into 1 or into 11. It does fit into 117, the first three digits. So the first digit of the answer goes over the 7.',
        beats: [
          { say: 'Walk it with me. 24 does not fit into 1 or into 11.', pic: 1 },
          { say: 'It does fit into 117, the first three digits.' },
          { say: 'So the first digit of the answer goes over the 7.', pic: 0 },
        ],
        pictures: [stickersC('  ?'), { kind: 'table', head: ['Start with', 'Does 24 fit?'], rows: [['1', 'no'], ['11', 'no'], ['117', 'yes']], mark: [[2, 0], [2, 1]], motion: true }] },
      { title: 'Divide, take away, bring down', text: '4 × 24 = 96 fits into 117, and 5 × 24 = 120 is too many. Write the 4 over the 7, and take away: 117 − 96 = 21. Then bring down the 6 to make 216.',
        beats: [
          { say: '4 × 24 = 96 fits into 117, and 5 × 24 = 120 is too many.', pic: 0 },
          { say: 'Write the 4 over the 7, and take away: 117 − 96 = 21.' },
          { say: 'Then bring down the 6 to make 216.' },
        ],
        pictures: [stickersC('  4', [' −96', ' 216'])] },
      { title: 'The last digit', text: 'One more round. 9 × 24 = 216, so write the 9 over the 6. 216 − 216 = 0, and no digits are left to bring down. So 1,176 ÷ 24 = 49. Each kid gets 49 stickers.',
        beats: [
          { say: 'One more round. 9 × 24 = 216, so write the 9 over the 6.', pic: 0 },
          { say: '216 − 216 = 0, and no digits are left to bring down.' },
          { say: 'So 1,176 ÷ 24 = 49. Each kid gets 49 stickers.' },
        ],
        pictures: [stickersC('  49', [' −96', ' 216', ' −216', '   0'])] },
      { title: 'One thing not to do', text: 'Here is what goes wrong. Do not write the first digit over the second 1. It goes over the 7, the last digit of 117. Multiply to check: 490 × 24 = 11,760, which is 10 times too many.',
        beats: [
          { say: 'Here is what goes wrong.' },
          { say: 'Do not write the first digit over the second 1.', pic: 0 },
          { say: 'It goes over the 7, the last digit of 117. Multiply to check: 490 × 24 = 11,760, which is 10 times too many.' },
        ],
        pictures: [{ kind: 'cards', wrong: '1,176 ÷ 24 = 490', right: '1,176 ÷ 24 = 49' }] },
    ],
    turn: {
      text: '24 kids share 1,128 stickers equally. How many stickers does each kid get?',
      picture: ldC('24', '1128'),
      answer: 47, steps: ['24 does not fit into 11, so start with 112. 4 × 24 = 96, and 112 − 96 = 16.', 'Bring down the 8 to make 168. 7 × 24 = 168, with 0 left.', 'So each kid gets 47 stickers.'],
      prompt: 'Find where to start. Then bring down one digit at a time.',
      hint1: 'Does 24 fit into 11? If not, start with the first three digits.',
      hint2: 'How many 24s fit into 112? Take them away, then bring down the 8.',
      twin: { text: 'A craft club has 1,344 stickers. Each sheet holds 32 stickers. How many sheets can it fill?',
        picture: ldC('32', '1344'),
        answer: 42, steps: ['32 does not fit into 13, so start with 134. 4 × 32 = 128, and 134 − 128 = 6.', 'Bring down the 4 to make 64. 2 × 32 = 64, with 0 left.', 'So the club fills 42 sheets.'],
        hint1: 'Does 32 fit into 13? If not, start with the first three digits.',
        hint2: 'How many 32s fit into 134? Take them away, then bring down the last 4.' },
    },
    won: { text: 'You found where to start, then brought down one digit at a time.', sticker: 'Dividing one digit at a time, bringing the next digit down each time, is called long division.' },
    twinWon: { text: 'You found where to start in 1,344 and filled 42 sheets.', sticker: 'Dividing one digit at a time, bringing the next digit down each time, is called long division.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Find 1,272 ÷ 24.',
        picture: ldC('24', '1272'), answer: 53,
        steps: ['24 does not fit into 12, so start with 127. 5 × 24 = 120, and 127 − 120 = 7.', 'Bring down the 2 to make 72. 3 × 24 = 72, with 0 left.', 'So 1,272 ÷ 24 = 53.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Find 2,048 ÷ 32.',
        picture: ldC('32', '2048'), answer: 64,
        steps: ['32 does not fit into 20, so start with 204. 6 × 32 = 192, and 204 − 192 = 12.', 'Bring down the 8 to make 128. 4 × 32 = 128, with 0 left.', 'So 2,048 ÷ 32 = 64.'] } },
      { why: 'Still "find where to start"', problem: { text: 'Find 2,808 ÷ 24.',
        picture: ldC('24', '2808'), answer: 117,
        steps: ['24 fits into 28, so start with the first two digits. 1 × 24 = 24, and 28 − 24 = 4.', 'Bring down the 0 to make 40. 1 × 24 = 24, and 40 − 24 = 16.', 'Bring down the 8 to make 168. 7 × 24 = 168, so 2,808 ÷ 24 = 117.'] } },
      { why: 'A little harder', problem: { text: 'Find 3,317 ÷ 31.',
        picture: ldC('31', '3317'), answer: 107,
        steps: ['31 fits into 33, so start there. 1 × 31 = 31, and 33 − 31 = 2.', 'Bring down the 1 to make 21. 31 does not fit into 21, so write 0 and bring down the 7 to make 217.', '7 × 31 = 217, so 3,317 ÷ 31 = 107.'] } },
      { why: 'Same math in a story', problem: { text: 'A teacher shares 1,938 stickers equally among 34 kids. How many stickers does each kid get?',
        picture: ldC('34', '1938'), answer: 57,
        steps: ['34 does not fit into 19, so start with 193. 5 × 34 = 170, and 193 − 170 = 23.', 'Bring down the 8 to make 238. 7 × 34 = 238, with 0 left.', 'So each kid gets 57 stickers.'] } },
    ],
  },

  // ════ Part D · Multi-step problems with whole numbers ════
  // ── Topic 17 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t17', title: 'Write, read and compare expressions',
    skill: 'Write a number sentence with ( ), read it as "times as much", and compare two number sentences without working them out',
    bigIdea: 'The ( ) keep together what goes together. 3 × (4 + 2) means 3 times as much as 4 + 2.',
    screens: [
      { scene: 'g5m1-t17', title: 'Bags of fruit', text: 'A fruit stand packs 3 paper bags. Each bag has 4 apples and 2 pears. How can you write all the fruit as one number sentence?',
        pictures: [tapeD([{ label: '3 bags', cells: groupsD(3, 4, 2) }])] },
      { title: 'A long way to write it', text: 'You could add up every single piece: 4 + 2 + 4 + 2 + 4 + 2. That is long to write, and it hides the best part, which is that the 3 bags are all the same.',
        beats: [
          { say: 'You could add up every single piece: 4 + 2 + 4 + 2 + 4 + 2.', pic: 1 },
          { say: 'That is long to write, and it hides the best part, which is that the 3 bags are all the same.', pic: 0 },
        ],
        pictures: [tapeD([{ label: '3 bags', cells: groupsD(3, 4, 2) }]), eqD('4 + 2 + 4 + 2 + 4 + 2')] },
      { title: 'The big idea', text: 'The ( ) keep together what goes together. 3 × (4 + 2) means 3 times as much as 4 + 2.',
        beats: [
          { say: 'The ( ) keep together what goes together.', pic: 0 },
          { say: '3 × (4 + 2) means 3 times as much as 4 + 2.' },
        ],
        pictures: [tapeD([{ label: '1 bag', cells: groupsD(1, 4, 2), brace: '4 + 2' }, { label: '3 bags', cells: groupsD(3, 4, 2), brace: '3 × (4 + 2)' }])] },
      { title: 'Keep one bag together', text: 'Start with one bag. It has 4 apples and 2 pears, so that is 4 + 2. Now put ( ) around it, so the whole bag stays together.',
        beats: [
          { say: 'Start with one bag. It has 4 apples and 2 pears, so that is 4 + 2.', pic: 0 },
          { say: 'Now put ( ) around it, so the whole bag stays together.', write: '( ) keep one bag together' },
        ],
        pictures: [tapeD([{ label: '1 bag', cells: groupsD(1, 4, 2), brace: '(4 + 2)' }], true)] },
      { title: 'Three of the whole bag', text: 'There are 3 bags, all the same, so we write 3 × (4 + 2). It means 3 times as much as 4 + 2. One bag is 6, so 3 bags are 18.',
        beats: [
          { say: 'There are 3 bags, all the same, so we write 3 × (4 + 2).', pic: 0 },
          { say: 'It means 3 times as much as 4 + 2.' },
          { say: 'One bag is 6, so 3 bags are 18.', pic: 1 },
        ],
        pictures: [tapeD([{ label: '1 bag', cells: groupsD(1, 4, 2), brace: '(4 + 2)' }, { label: '3 bags', cells: groupsD(3, 4, 2), brace: '3 × (4 + 2)' }], true),
          eqD('3 × (4 + 2)', ['= 3 × 6', '= 18'])] },
      { title: 'Compare without working it out', text: 'Now look at these two: 3 × (4 + 2) and 3 × 4 + 2. Both have 3 bags of 4 apples. But the first one has 2 pears in every bag. The second has just 2 pears in all. So the first one is more.',
        beats: [
          { say: 'Now look at these two: 3 × (4 + 2) and 3 × 4 + 2.', pic: 0 },
          { say: 'Both have 3 bags of 4 apples. But the first one has 2 pears in every bag.' },
          { say: 'The second has just 2 pears in all. So the first one is more.', pic: 1 },
        ],
        pictures: [tapeD([{ label: 'With ( )', cells: groupsD(3, 4, 2) },
          { label: 'No ( )', cells: [{ w: 4, text: '4' }, { w: 4, text: '4' }, { w: 4, text: '4' }, { w: 2, text: '2', shade: true }] }], true),
          eqD('3 × (4 + 2)', ['>', '3 × 4 + 2'])] },
      { title: 'One thing not to do', text: 'Here is the one to be careful with. Do not leave out the ( ). 3 × 4 + 2 is 3 bags of apples and just 2 pears. The ( ) put 2 pears in every bag.',
        beats: [
          { say: 'Here is the one to be careful with.' },
          { say: 'Do not leave out the ( ).', pic: 0 },
          { say: '3 × 4 + 2 is 3 bags of apples and just 2 pears. The ( ) put 2 pears in every bag.' },
        ],
        pictures: [{ kind: 'cards', wrong: '3 × 4 + 2', right: '3 × (4 + 2)' }] },
    ],
    turn: {
      text: 'A fruit stand packs 3 bags. Each bag has 4 apples and 5 pears. Which number sentence shows all the fruit?',
      picture: tapeD([{ label: '3 bags', cells: groupsD(3, 4, 5) }]),
      answer: { choices: ['3 × 4 + 5', '3 × (4 + 5)', '(3 + 4) × 5'], correct: 1 },
      steps: ['One bag is 4 apples and 5 pears, so keep it together: (4 + 5).', 'There are 3 of those bags: 3 times as much as 4 + 5.', 'So the answer is 3 × (4 + 5).'],
      prompt: 'Keep one bag together inside the ( ). Then show how many bags.',
      hint1: 'What is in one bag? That part goes inside the ( ).',
      hint2: 'One bag is 4 + 5. How many of those bags are there?',
      twin: { text: 'A fruit stand packs 4 bags. Each bag has 5 apples and 3 pears. Which number sentence shows all the fruit?',
        picture: tapeD([{ label: '4 bags', cells: groupsD(4, 5, 3) }]),
        answer: { choices: ['(4 + 5) × 3', '4 × 5 + 3', '4 × (5 + 3)'], correct: 2 },
        steps: ['One bag is 5 apples and 3 pears, so keep it together: (5 + 3).', 'There are 4 of those bags: 4 times as much as 5 + 3.', 'So the answer is 4 × (5 + 3).'],
        hint1: 'What is in one bag? Keep it together inside the ( ).',
        hint2: 'One bag is 5 + 3. How many of those bags are there?' },
    },
    won: { text: 'You kept each bag together with ( ), then showed how many bags.', sticker: EXPRESSION_D },
    twinWon: { text: 'You kept 5 apples and 3 pears together in the ( ), then showed 4 bags of them.', sticker: EXPRESSION_D },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'A fruit stand packs 3 bags. Each bag has 5 apples and 2 pears, so the fruit is 3 × (5 + 2). How many pieces of fruit is that?',
        picture: tapeD([{ label: '3 bags', cells: groupsD(3, 5, 2), brace: '?' }]), answer: 21,
        steps: ['The ( ) keep one bag together: 5 + 2 = 7 pieces.', '3 × (5 + 2) is 3 times as much as one bag: 3 × 7.', 'So there are 21 pieces of fruit.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Find 7 × (5 + 4).',
        picture: eqD('7 × (5 + 4) = ?'), answer: 63,
        steps: ['Keep 5 + 4 together first: 5 + 4 = 9.', '7 × (5 + 4) is 7 times as much as 9.', 'So 7 × (5 + 4) = 63.'] } },
      { why: 'Still "( ) keep it together"', problem: { text: 'Which number sentence means "add 8 and 5, then multiply by 7"?',
        picture: eqD('add 8 and 5, then multiply by 7'), answer: { choices: ['7 × 8 + 5', '7 × (8 + 5)', '(7 + 8) × 5'], correct: 1 },
        steps: ['"Add 8 and 5" is one part, so keep it together: (8 + 5).', 'Then multiply that whole part by 7.', 'So the answer is 7 × (8 + 5).'] } },
      { why: 'A little harder', problem: { text: 'Compare 25 × (38 + 12) and 25 × 38 + 12 without working them out. Which sign goes between them?',
        picture: eqD('25 × (38 + 12) ? 25 × 38 + 12'), answer: { choices: ['<', '>', '='], correct: 1 },
        steps: ['Both start with 25 groups of 38.', '25 × (38 + 12) also has 25 groups of 12. 25 × 38 + 12 adds just one 12.', 'So 25 × (38 + 12) is more. The answer is >.'] } },
      { why: 'Same math in a story', problem: { text: 'Mia packs 12 bags, each with 9 apples and 3 pears: 12 × (9 + 3). Leo packs 12 bags of 9 apples, then puts 3 pears in one more bag: 12 × 9 + 3. Without working them out, who packs more fruit?',
        picture: eqD('Mia: 12 × (9 + 3)', ['Leo: 12 × 9 + 3']), answer: { choices: ['Mia', 'Leo', 'They pack the same'], correct: 0 },
        steps: ['Both pack 12 bags of 9 apples.', 'Mia also has 3 pears in every bag. Leo has just 3 pears in all.', 'So Mia packs more fruit. The answer is Mia.'] } },
    ],
  },

  // ── Topic 18 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t18', title: 'Make a story for an expression',
    skill: 'Tell a story for a number sentence: every number and sign is a part of the story, and the part in ( ) happens first',
    bigIdea: 'Every number and sign is a part of the story. The part in the ( ) happens first.',
    screens: [
      { scene: 'g5m1-t18', title: 'A number sentence on the board', text: 'The board in class shows 4 × (6 + 3). What story could these numbers and signs tell?',
        pictures: [eqD('4 × (6 + 3)')] },
      { title: 'Numbers alone are not a story', text: 'The board does not tell us what the 4, the 6 or the 3 count. It does not say what the × and the + do either. A story has to give every part a job.',
        beats: [
          { say: 'The board does not tell us what the 4, the 6 or the 3 count.', pic: 0 },
          { say: 'It does not say what the × and the + do either.' },
          { say: 'A story has to give every part a job.' },
        ],
        pictures: [eqD('4 × (6 + 3)', ['4 what? 6 what? 3 what?'])] },
      { title: 'The big idea', text: 'Every number and sign is a part of the story. The part in the ( ) happens first.',
        beats: [
          { say: 'Every number and sign is a part of the story.', pic: 0 },
          { say: 'The part in the ( ) happens first.' },
        ],
        pictures: [eqD('4 × (6 + 3)')] },
      { title: 'Start with the ( )', text: 'The ( ) happen first, so they make one thing in the story. Make 6 + 3 one bag: 6 red marbles and 3 green marbles.',
        beats: [
          { say: 'The ( ) happen first, so they make one thing in the story.', write: '( ) first → one thing' },
          { say: 'Make 6 + 3 one bag: 6 red marbles and 3 green marbles.', pic: 0 },
        ],
        pictures: [tapeD([{ label: '1 bag', cells: groupsD(1, 6, 3), brace: '6 + 3' }], true)] },
      { title: 'Then the 4 ×', text: 'Now the 4 ×. That means 4 of that whole bag. So the story is 4 bags, each with 6 red marbles and 3 green marbles.',
        beats: [
          { say: 'Now the 4 ×. That means 4 of that whole bag.', pic: 0 },
          { say: 'So the story is 4 bags, each with 6 red marbles and 3 green marbles.' },
        ],
        pictures: [tapeD([{ label: '1 bag', cells: groupsD(1, 6, 3), brace: '6 + 3' }, { label: '4 bags', cells: groupsD(4, 6, 3), brace: '4 × (6 + 3)' }], true)] },
      { title: 'Solve the story', text: 'Let us solve it. One bag has 6 + 3 = 9 marbles. And 4 bags have 4 × 9 = 36 marbles. The story and the board give the same answer.',
        beats: [
          { say: 'Let us solve it. One bag has 6 + 3 = 9 marbles.', pic: 0 },
          { say: 'And 4 bags have 4 × 9 = 36 marbles.', pic: 1 },
          { say: 'The story and the board give the same answer.' },
        ],
        pictures: [tapeD([{ label: '4 bags', cells: groupsD(4, 6, 3), brace: '36 marbles' }]), eqD('4 × (6 + 3)', ['= 4 × 9', '= 36'])] },
      { title: 'One thing not to do', text: 'Here is the story that does not match. Do not let the story do the × first. 4 bags of 6 red marbles, plus 3 green ones, is 4 × 6 + 3. The ( ) put 3 green marbles in every bag.',
        beats: [
          { say: 'Here is the story that does not match.' },
          { say: 'Do not let the story do the × first.', pic: 0 },
          { say: '4 bags of 6 red marbles, plus 3 green ones, is 4 × 6 + 3. The ( ) put 3 green marbles in every bag.' },
        ],
        pictures: [{ kind: 'cards', wrong: '4 bags of 6 red, plus 3 green', right: '4 bags, each 6 red and 3 green' }] },
    ],
    turn: {
      text: 'The board shows 4 × (6 + 5). A class makes this story: 4 bags, each with 6 red marbles and 5 green marbles. How many marbles are in the story?',
      picture: tapeD([{ label: '4 bags', cells: groupsD(4, 6, 5), brace: '? marbles' }]),
      answer: 44, steps: ['The ( ) happen first: one bag has 6 + 5 = 11 marbles.', 'Then 4 × means 4 of those bags: 4 × 11.', 'So there are 44 marbles.'],
      prompt: 'Do the part in the ( ) first. Then do the rest of the story.',
      hint1: 'Start with the ( ). How many marbles are in one bag?',
      hint2: 'One bag has 6 + 5 marbles. Now find 4 bags of that.',
      twin: { text: 'The board shows 5 × (4 + 3). A class makes this story: 5 boxes, each with 4 red crayons and 3 green crayons. How many crayons are in the story?',
        picture: tapeD([{ label: '5 boxes', cells: groupsD(5, 4, 3), brace: '? crayons' }]),
        answer: 35, steps: ['The ( ) happen first: one box has 4 + 3 = 7 crayons.', 'Then 5 × means 5 of those boxes: 5 × 7.', 'So there are 35 crayons.'],
        hint1: 'Start with the ( ). How many crayons are in one box?',
        hint2: 'One box has 4 + 3 crayons. Now find 5 boxes of that.' },
    },
    won: { text: 'You did the part in the ( ) first, then the rest of the story.', sticker: ORDER_D },
    twinWon: { text: 'You found one box of 4 + 3 crayons first, then 5 boxes: 35 crayons.', sticker: ORDER_D },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'The board shows 3 × (9 + 4). A class makes this story: 3 bags, each with 9 red marbles and 4 green marbles. How many marbles are in the story?',
        picture: tapeD([{ label: '3 bags', cells: groupsD(3, 9, 4), brace: '? marbles' }]), answer: 39,
        steps: ['The ( ) happen first: one bag has 9 + 4 = 13 marbles.', 'Then 3 × means 3 of those bags: 3 × 13.', 'So there are 39 marbles.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'The board shows 6 × (8 − 3). A class makes this story: 6 kids each get 8 stickers, and each kid gives 3 of them away. How many stickers do the kids have left in all?',
        picture: eqD('6 × (8 − 3)'), answer: 30,
        steps: ['The ( ) happen first: each kid keeps 8 − 3 = 5 stickers.', 'Then 6 × means 6 kids with that many each: 6 × 5.', 'So the kids have 30 stickers left.'] } },
      { why: 'Still "the ( ) part first"', problem: { text: 'Sam has 50 stickers. He gives 8 away. Then he shares the rest equally among 6 friends. Which number sentence tells this story?',
        picture: tapeD([{ cells: [{ w: 8, text: '8', shade: true }, ...Array.from({ length: 6 }, (): CellD => ({ w: 7 }))], brace: '50 stickers' }]),
        answer: { choices: ['50 − (8 ÷ 6)', '(50 − 8) ÷ 6', '(50 + 8) ÷ 6'], correct: 1 },
        steps: ['Giving 8 away happens first, so it goes in the ( ): (50 − 8).', 'Then the rest is shared among 6 friends: ÷ 6.', 'So the answer is (50 − 8) ÷ 6.'] } },
      { why: 'A little harder', problem: { text: 'The board shows (125 + 115) ÷ 16. A class makes this story: a shop has 125 red pens and 115 green pens. It packs all the pens into boxes of 16. How many boxes does it fill?',
        picture: eqD('(125 + 115) ÷ 16 = ?'),
        answer: 15, steps: ['The ( ) happen first: 125 + 115 = 240 pens.', 'Then pack them in boxes of 16: 240 ÷ 16.', 'So the shop fills 15 boxes.'] } },
      { why: 'Same math in a story', problem: { text: 'In class, 24 children sit in 4 equal rows. Then 2 more children join each row. Which number sentence shows how many children are in each row now?',
        picture: tapeD([{ label: '4 rows', cells: Array.from({ length: 4 }, (): CellD => ({ w: 6 })), brace: '24 children' },
          { label: 'One row', cells: [{ w: 6 }, { w: 2, text: '2', shade: true }] }]),
        answer: { choices: ['24 ÷ (4 + 2)', '(24 ÷ 4) + 2', '(24 + 2) ÷ 4'], correct: 1 },
        steps: ['Sitting in 4 equal rows happens first, so it goes in the ( ): (24 ÷ 4).', 'Then 2 more children join each row: + 2.', 'So the answer is (24 ÷ 4) + 2.'] } },
    ],
  },

  // ── Topic 19 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t19', title: 'Multi-step stories with × and ÷',
    skill: 'Solve a two-step story with a × step and a ÷ step: find the hidden number first, then use it',
    bigIdea: 'Find the hidden number first. Then use it to answer the question.',
    screens: [
      { scene: 'g5m1-t19', title: 'Markers for every class', text: 'A school buys 24 boxes of markers. Each box has 36 markers. The markers are shared equally among 18 classes. How many markers does each class get?',
        pictures: [tapeD([boxesD(), classesD('?')])] },
      { title: 'The story hides a number', text: 'We want to share the markers among 18 classes. But how many markers are there in all? The story never says. That number is hidden, and we have to find it first.',
        beats: [
          { say: 'We want to share the markers among 18 classes.', pic: 0 },
          { say: 'But how many markers are there in all? The story never says.' },
          { say: 'That number is hidden, and we have to find it first.' },
        ],
        pictures: [tapeD([boxesD('? markers in all'), classesD('?')])] },
      { title: 'The big idea', text: 'Find the hidden number first. Then use it to answer the question.',
        beats: [
          { say: 'Find the hidden number first.', pic: 0 },
          { say: 'Then use it to answer the question.' },
        ],
        pictures: [tapeD([boxesD('? markers in all'), classesD('?')])] },
      { title: 'Step 1: find the hidden number', text: '24 boxes, with 36 markers in each one. 24 × 36 = 864, so there are 864 markers in all.',
        beats: [
          { say: '24 boxes, with 36 markers in each one.', pic: 0 },
          { say: '24 × 36 = 864, so there are 864 markers in all.', pic: 1 },
        ],
        pictures: [tapeD([boxesD('864 markers in all'), classesD('?')], true), eqD('24 × 36 = 864')] },
      { title: 'Step 2: use it', text: 'Now we can answer the real question. Share the 864 markers equally among 18 classes: 864 ÷ 18 = 48. Each class gets 48 markers.',
        beats: [
          { say: 'Now we can answer the real question.', pic: 0 },
          { say: 'Share the 864 markers equally among 18 classes: 864 ÷ 18 = 48.', pic: 1 },
          { say: 'Each class gets 48 markers.' },
        ],
        pictures: [tapeD([boxesD('864 markers in all'), classesD('48')], true), eqD('864 ÷ 18 = 48')] },
      { title: 'Check it makes sense', text: 'Let us check it. 18 classes with 48 markers each is 18 × 48 = 864. That is every marker in the 24 boxes. So each class gets 48 markers.',
        beats: [
          { say: 'Let us check it. 18 classes with 48 markers each is 18 × 48 = 864.', pic: 1 },
          { say: 'That is every marker in the 24 boxes.', pic: 0 },
          { say: 'So each class gets 48 markers.' },
        ],
        pictures: [tapeD([boxesD('864 markers in all'), classesD('48')]), eqD('18 × 48 = 864')] },
      { title: 'One thing not to do', text: 'Here is the trap in a two-step story. Do not stop at the hidden number. 864 is all the markers, not the markers for one class. Always finish with the question.',
        beats: [
          { say: 'Here is the trap in a two-step story.' },
          { say: 'Do not stop at the hidden number.', pic: 0 },
          { say: '864 is all the markers, not the markers for one class. Always finish with the question.' },
        ],
        pictures: [{ kind: 'cards', wrong: 'Each class gets 864 markers', right: 'Each class gets 48 markers' }] },
    ],
    turn: {
      text: 'A school buys 24 boxes of markers. Each box has 36 markers. The markers are shared equally among 27 classes. How many markers does each class get?',
      picture: tapeD([boxesD(), { label: 'Classes', cells: runD('?', 1, '… 27 classes', 3) }]),
      answer: 32, steps: ['First find the hidden number, all the markers: 24 × 36 = 864.', 'Then share them equally among 27 classes: 864 ÷ 27.', 'So each class gets 32 markers.'],
      prompt: 'Find the hidden number first. Then use it to answer the question.',
      hint1: 'How many markers are there in all? The story does not say, so find it first.',
      hint2: 'All the markers are 24 × 36. Share that number among 27 classes.',
      twin: { text: 'An art room gets 16 packs of paintbrushes. Each pack has 45 brushes. The brushes are shared equally among 24 tables. How many brushes does each table get?',
        picture: tapeD([{ label: 'Packs', cells: runD('45', 1, '… 16 packs', 3) }, { label: 'Tables', cells: runD('?', 1, '… 24 tables', 3) }]),
        answer: 30, steps: ['First find the hidden number, all the brushes: 16 × 45 = 720.', 'Then share them equally among 24 tables: 720 ÷ 24.', 'So each table gets 30 brushes.'],
        hint1: 'How many brushes are there in all? Find that hidden number first.',
        hint2: 'All the brushes are 16 × 45. Share that number among 24 tables.' },
    },
    won: { text: 'You found the hidden number first, then used it to answer the question.', sticker: MUL_DIV_D },
    twinWon: { text: 'You found all the brushes with 16 × 45 first, then shared them among 24 tables: 30 each.', sticker: MUL_DIV_D },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'A school buys 12 boxes of markers. Each box has 36 markers. The markers are shared equally among 16 classes. How many markers does each class get?',
        picture: tapeD([{ label: 'Boxes', cells: runD('36', 1, '… 12 boxes', 3) }, { label: 'Classes', cells: runD('?', 1, '… 16 classes', 3) }]), answer: 27,
        steps: ['First find all the markers: 12 × 36 = 432.', 'Then share them equally among 16 classes: 432 ÷ 16.', 'So each class gets 27 markers.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'A teacher has 14 packs of stickers. Each pack has 54 stickers. She shares them equally among 21 students. How many stickers does each student get?',
        picture: tapeD([{ label: 'Packs', cells: runD('54', 1, '… 14 packs', 3) }, { label: 'Students', cells: runD('?', 1, '… 21 students', 3) }]), answer: 36,
        steps: ['First find all the stickers: 14 × 54 = 756.', 'Then share them equally among 21 students: 756 ÷ 21.', 'So each student gets 36 stickers.'] } },
      { why: 'Still "hidden number first"', problem: { text: '12 packs of markers cost $96. Every pack costs the same. How many dollars do 35 packs cost?',
        picture: tapeD([{ label: '12 packs', cells: [{ w: 2.06, text: '$96', shade: true }] }, { label: '35 packs', cells: [{ w: 6, text: '? dollars' }] }]), answer: 280,
        steps: ['First find the hidden number, the cost of one pack: 96 ÷ 12 = 8 dollars.', 'Then find the cost of 35 packs: 35 × 8.', 'So 35 packs cost $280.'] } },
      { why: 'A little harder', problem: { text: 'An art store has 175 boxes of markers. Each box holds 24 markers. The store packs all the markers into bags of 56. How many bags does it fill?',
        picture: tapeD([{ label: 'Boxes', cells: runD('24', 1, '… 175 boxes', 4) },
          { label: 'Bags', cells: [{ w: 2.33, text: '56' }, { w: 2.33, text: '56' }, { w: 2.34, text: '… ? bags' }] }]), answer: 75,
        steps: ['First find the hidden number, all the markers: 175 × 24 = 4,200.', 'Then put them in bags of 56: 4,200 ÷ 56.', 'So the store fills 75 bags.'] } },
      { why: 'Same math in a story', problem: { text: 'A school has 23 classes. Each class has 28 students. All the students go on a trip in buses with 46 seats, and every bus is full. How many buses do they need?',
        picture: tapeD([{ label: 'Classes', cells: runD('28', 1, '… 23 classes', 3) },
          { label: 'Buses', cells: [{ w: 1.64, text: '46' }, { w: 1.64, text: '46' }, { w: 2.72, text: '… ? buses' }] }]), answer: 14,
        steps: ['First find the hidden number, all the students: 23 × 28 = 644.', 'Then fill buses of 46 seats: 644 ÷ 46.', 'So they need 14 buses.'] } },
    ],
  },

  // ── Topic 20 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g5m1-t20', title: 'Multi-step stories with all four operations',
    skill: 'Draw a story as a tape, solve it one part at a time with + − × ÷, and check what the question asks',
    bigIdea: 'Draw the story as a tape. Solve one part at a time, then check what the question asks.',
    screens: [
      { scene: 'g5m1-t20', title: 'Empty seats at the movies', text: "A movie theater has 32 rows of seats. Each row has 25 seats. For tonight's show, 186 tickets are sold. How many seats are still empty?",
        pictures: [tapeD([seatRowsD(), seatsD('? empty')])] },
      { title: 'Three numbers, no sign yet', text: 'The story gives us 32, 25 and 186. None of them is the number of empty seats. Pick a sign too soon, and you may answer a different question.',
        beats: [
          { say: 'The story gives us 32, 25 and 186.', pic: 0 },
          { say: 'None of them is the number of empty seats.' },
          { say: 'Pick a sign too soon, and you may answer a different question.' },
        ],
        pictures: [tapeD([seatRowsD(), seatsD('? empty')])] },
      { title: 'The big idea', text: 'Draw the story as a tape. Solve one part at a time, then check what the question asks.',
        beats: [
          { say: 'Draw the story as a tape.', pic: 0 },
          { say: 'Solve one part at a time, then check what the question asks.' },
        ],
        pictures: [tapeD([seatRowsD(), seatsD('? empty')])] },
      { title: 'Part 1: all the seats', text: '32 rows of 25 seats make one long tape. 32 × 25 = 800, so the theater has 800 seats.',
        beats: [
          { say: '32 rows of 25 seats make one long tape.', pic: 0 },
          { say: '32 × 25 = 800, so the theater has 800 seats.', pic: 1 },
        ],
        pictures: [tapeD([seatRowsD('800 seats')], true), eqD('32 × 25 = 800')] },
      { title: 'Part 2: take away the sold seats', text: 'The 186 sold seats are one part of the 800, and the empty seats are the other part. So we take away: 800 − 186 = 614.',
        beats: [
          { say: 'The 186 sold seats are one part of the 800, and the empty seats are the other part.', pic: 0 },
          { say: 'So we take away: 800 − 186 = 614.', pic: 1 },
        ],
        pictures: [tapeD([seatRowsD('800 seats'), seatsD('614 empty')], true), eqD('800 − 186 = 614')] },
      { title: 'Check what the question asks', text: 'Now read the question again. It asks for empty seats, not sold seats. Check it: 614 empty and 186 sold make 800. So 614 seats are still empty.',
        beats: [
          { say: 'Now read the question again. It asks for empty seats, not sold seats.', pic: 0 },
          { say: 'Check it: 614 empty and 186 sold make 800.', pic: 1 },
          { say: 'So 614 seats are still empty.' },
        ],
        pictures: [tapeD([seatRowsD('800 seats'), seatsD('614 empty')]), eqD('614 + 186 = 800')] },
      { title: 'One thing not to do', text: 'One last warning. Do not add the sold seats. They are part of the 800 seats, so take them away.',
        beats: [
          { say: 'One last warning.' },
          { say: 'Do not add the sold seats.', pic: 0 },
          { say: 'They are part of the 800 seats, so take them away.' },
        ],
        pictures: [{ kind: 'cards', wrong: '800 + 186 = 986 empty seats', right: '800 − 186 = 614 empty seats' }] },
    ],
    turn: {
      text: 'A movie theater has 32 rows of seats. Each row has 25 seats. For the late show, 247 tickets are sold. How many seats are still empty?',
      picture: tapeD([seatRowsD(), { label: 'Seats', cells: [{ w: 1.9, text: '247 sold', shade: true }, { w: 4.1, text: '? empty' }] }]),
      answer: 553, steps: ['Part 1, all the seats: 32 × 25 = 800.', 'Part 2: the sold seats are part of the 800, so take them away: 800 − 247.', 'The question asks for empty seats. So 553 seats are still empty.'],
      prompt: 'Use the tape. Solve one part at a time, then check what the question asks.',
      hint1: 'Start with part 1. How many seats does the theater have in all?',
      hint2: 'All the seats are 32 × 25. The 247 sold seats are part of them, so take them away.',
      twin: { text: 'A movie theater has 18 rows of seats. Each row has 35 seats. For one show, 274 tickets are sold. How many seats are still empty?',
        picture: tapeD([{ label: 'Rows', cells: runD('35', 1, '… 18 rows', 3) }, { label: 'Seats', cells: [{ w: 2.6, text: '274 sold', shade: true }, { w: 3.4, text: '? empty' }] }]),
        answer: 356, steps: ['Part 1, all the seats: 18 × 35 = 630.', 'Part 2: the sold seats are part of the 630, so take them away: 630 − 274.', 'The question asks for empty seats. So 356 seats are still empty.'],
        hint1: 'Start with part 1. How many seats does the theater have in all?',
        hint2: 'All the seats are 18 × 35. The 274 sold seats are part of them, so take them away.' },
    },
    won: { text: 'You used the tape, solved one part at a time, and checked what the question asks.', sticker: FOUR_D },
    twinWon: { text: 'You found all the seats with 18 × 35, then took away the 274 sold: 356 empty.', sticker: FOUR_D },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'A movie theater has 24 rows of seats. Each row has 30 seats. For one show, 395 tickets are sold. How many seats are still empty?',
        picture: tapeD([{ label: 'Rows', cells: runD('30', 1, '… 24 rows', 3) }, { label: 'Seats', cells: [{ w: 3.3, text: '395 sold', shade: true }, { w: 2.7, text: '? empty' }] }]), answer: 325,
        steps: ['Part 1, all the seats: 24 × 30 = 720.', 'Part 2: take away the sold seats: 720 − 395.', 'So 325 seats are still empty.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'The theater sells 145 tickets for the first show and 238 tickets for the second show. Each ticket costs $9. How many dollars do all the tickets cost?',
        picture: tapeD([{ label: 'Tickets', cells: [{ w: 2.3, text: '145', shade: true }, { w: 3.7, text: '238' }] },
          { label: 'Dollars', cells: runD('$9', 1, '… each ticket', 3), brace: '? dollars' }]), answer: 3447,
        steps: ['Part 1, all the tickets: 145 + 238 = 383.', 'Part 2, each ticket is $9: 383 × 9.', 'So all the tickets cost $3,447.'] } },
      { why: 'Still "part by part"', problem: { text: 'A theater has 504 seats in 18 equal rows. In one row, 9 seats are taken. How many seats in that row are empty?',
        picture: tapeD([{ label: 'All seats', cells: runD('', 1, '… 18 rows', 3), brace: '504 seats' },
          { label: 'One row', cells: [{ w: 0.4, text: '9', shade: true }, { w: 0.6, text: '?' }] }]), answer: 19,
        steps: ['Part 1, the seats in each row: 504 ÷ 18 = 28.', 'Part 2, take away the 9 taken seats: 28 − 9.', 'So 19 seats in that row are empty.'] } },
      { why: 'A little harder', problem: { text: 'A theater has 26 rows of seats with 32 seats in each row. A school brings 12 classes of 28 students, and each student takes one seat. How many seats are still empty?',
        picture: tapeD([{ label: 'Rows', cells: runD('32', 1, '… 26 rows', 3) }, { label: 'Seats', cells: [{ w: 2.4, text: '12 classes', shade: true }, { w: 3.6, text: '? empty' }] }]), answer: 496,
        steps: ['Part 1, all the seats: 26 × 32 = 832.', 'Part 2, all the students: 12 × 28 = 336.', 'Part 3, take the students away from the seats: 832 − 336.', 'So 496 seats are still empty.'] } },
      { why: 'Same math in a story', problem: { text: 'A class of 27 students and 9 adults go to the movies. Each ticket costs $8. They pay with $300. How many dollars of change do they get?',
        picture: eqD('27 students + 9 adults', ['$8 a ticket', 'pay with $300']), answer: 12,
        steps: ['Part 1, all the people: 27 + 9 = 36.', 'Part 2, all the tickets: 36 × 8 = 288 dollars.', 'Part 3, the change: 300 − 288.', 'So they get $12 in change.'] } },
    ],
  },
]

attachChalk(G5M1, G5M1_CHALK)
