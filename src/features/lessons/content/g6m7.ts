/**
 * Grade 6 · Module 7 — Data analysis and probability.
 * Written to docs/new-flow/AUTHORING.md. Not yet reviewed by the founder.
 * Question pictures show the DATA (that is the question); a computed mean, median, range or count is never printed.
 */
import type { Lesson, Picture } from '../script'
import { attachChalk } from '../chalk'
import { G6M7_CHALK } from './chalk/g6m7'

/** One row of values, with an optional header row. */
const row = (values: (string | number)[], head?: string[]): Picture =>
  head ? { kind: 'table', head, rows: [['', ...values.map(String)]], rowHead: true } : { kind: 'table', rows: [values.map(String)] }

const TOWERS: Picture = { kind: 'chart', type: 'bar', labels: ['A', 'B', 'C', 'D'], values: [2, 6, 3, 5], max: 6, yLabel: 'Cubes' }
const EVEN: Picture = { kind: 'chart', type: 'bar', labels: ['A', 'B', 'C', 'D'], values: [4, 4, 4, 4], max: 6, yLabel: 'Cubes' }

const PETS: Picture = { kind: 'chart', type: 'dot', labels: ['0', '1', '2', '3', '4'], values: [3, 5, 2, 1, 1], xLabel: 'Pets' }

const line20 = (pts: number[], extra: { points?: { at: number; label?: string }[]; jumps?: { from: number; to: number; label?: string }[]; motion?: boolean } = {}): Picture =>
  ({ kind: 'numline', min: 0, max: 20, ticks: 20, points: [...pts.map(at => ({ at })), ...(extra.points ?? [])], jumps: extra.jumps, motion: extra.motion })

const PARTY = [9, 10, 10, 11, 40]
const line40 = (extra: { at: number; label?: string }[] = [], jumps?: { from: number; to: number; label?: string }[], motion = false): Picture =>
  ({ kind: 'numline', min: 0, max: 40, ticks: 8, points: [...PARTY.map(at => ({ at })), ...extra], jumps, motion })
const dots = (min: number, max: number, ticks: number, pts: number[]): Picture =>
  ({ kind: 'numline', min, max, ticks, points: pts.map(at => ({ at })) })

const PRACTICE_DOTS: Picture = { kind: 'chart', type: 'dot', labels: ['10', '20', '30', '40', '50'], values: [2, 4, 5, 3, 1], xLabel: 'Minutes' }
const PRACTICE_BARS: Picture = { kind: 'chart', type: 'hist', labels: ['0–9', '10–19', '20–29', '30–39', '40–49'], values: [3, 6, 8, 4, 2], xLabel: 'Minutes', yLabel: 'Kids' }

const COLOR_TONE: Record<string, 1 | 2 | 3 | 4> = { green: 1, yellow: 2, red: 3, blue: 4 }
const spin = (parts: string[]): Picture => ({ kind: 'spinner', parts, tones: parts.map(p => COLOR_TONE[p] ?? 2) })
const PRIZE = spin(['red', 'blue', 'red', 'green', 'blue', 'red', 'yellow', 'blue'])

const CHANCE_WORDS = ['impossible', 'unlikely', 'equally likely', 'likely', 'certain']
const chance = (points?: { at: number; label?: string }[], motion = false): Picture =>
  ({ kind: 'numline', min: 0, max: 1, ticks: 4, labels: CHANCE_WORDS, points, motion })
const LIKELY3 = ['unlikely', 'equally likely', 'likely']

export const G6M7: Lesson[] = [
  // ── Topic 1 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g6m7-t1', title: 'Mean: share it out fairly', skill: 'Find the mean: add the values, then share the total equally',
    bigIdea: 'Put everything together, then share it out equally. Total ÷ how many = the fair share.',
    screens: [
      { title: 'Four towers of cubes', text: 'Four friends built towers of cubes. The towers are all different heights. If they shared the cubes fairly, how tall would each tower be?',
        pictures: [TOWERS] },
      { title: 'Picking one tower is not fair', text: 'Look at these four towers. You could pick the tallest one, 6. Or the shortest one, 2. But neither of those is fair to everybody. We want one number that treats all four towers the same.',
        beats: [
          { say: 'Look at these four towers.', pic: 0 },
          { say: 'You could pick the tallest one, 6. Or the shortest one, 2.' },
          { say: 'But neither of those is fair to everybody.' },
          { say: 'We want one number that treats all four towers the same.', write: 'fair = every tower the same' },
        ],
        pictures: [TOWERS] },
      { title: 'The big idea', text: 'Put everything together, then share it out equally. Total ÷ how many = the fair share.',
        beats: [
          { say: 'Put everything together, then share it out equally.', pic: 0 },
          { say: 'Total ÷ how many = the fair share.' },
        ],
        pictures: [TOWERS] },
      { title: 'Put all the cubes together', text: 'So watch. Push every tower into one single pile. Add up what is in the pile: 2 + 6 + 3 + 5. That gives us 16 cubes in all.',
        beats: [
          { say: 'So watch. Push every tower into one single pile.', pic: 0 },
          { say: 'Add up what is in the pile: 2 + 6 + 3 + 5.', pic: 1 },
          { say: 'That gives us 16 cubes in all.' },
        ],
        pictures: [{ ...TOWERS, motion: true }, { kind: 'eq', text: '2 + 6 + 3 + 5 = 16' }] },
      { title: 'Share them out', text: 'Now we share. There are 4 towers, so the 16 cubes split into 4 equal towers. 16 ÷ 4 = 4. Every tower comes out 4 tall. Total, shared by how many.',
        beats: [
          { say: 'Now we share. There are 4 towers, so the 16 cubes split into 4 equal towers.', pic: 0 },
          { say: '16 ÷ 4 = 4.', pic: 1 },
          { say: 'Every tower comes out 4 tall. Total, shared by how many.', write: 'total ÷ how many' },
        ],
        pictures: [{ ...EVEN, motion: true }, { kind: 'eq', text: '16 ÷ 4 = 4' }] },
      { title: 'Check by moving cubes', text: "Let's check it a different way. Take 2 cubes off the 6 and hand them to the 2. Take 1 cube off the 5 and hand it to the 3. Look at that: every tower is 4 now, and we never added a single cube.",
        beats: [
          { say: "Let's check it a different way.", pic: 0 },
          { say: 'Take 2 cubes off the 6 and hand them to the 2. Take 1 cube off the 5 and hand it to the 3.', pic: 1 },
          { say: 'Look at that: every tower is 4 now, and we never added a single cube.' },
        ],
        pictures: [EVEN, { kind: 'eq', text: '6 − 2 = 4 and 2 + 2 = 4', lines: ['5 − 1 = 4 and 3 + 1 = 4'] }] },
      { title: 'One thing not to do', text: "Here is the slip to watch for. Don't divide by 2, and don't divide by the tallest tower. You divide the total by how many towers there are. Here that is 4.",
        beats: [
          { say: 'Here is the slip to watch for.' },
          { say: "Don't divide by 2, and don't divide by the tallest tower.", pic: 0 },
          { say: 'You divide the total by how many towers there are. Here that is 4.' },
        ],
        pictures: [{ kind: 'cards', wrong: '16 ÷ 2 = 8', right: '16 ÷ 4 = 4' }] },
    ],
    turn: {
      text: 'Four towers have 3, 7, 4 and 6 cubes. If the cubes are shared fairly, how many cubes are in each tower?',
      picture: row([3, 7, 4, 6], ['Tower', 'A', 'B', 'C', 'D']),
      answer: 5,
      steps: ['Put all the cubes together: 3 + 7 + 4 + 6 = 20.', 'There are 4 towers, so share 20 into 4 equal towers.', '20 ÷ 4 = 5. So each tower has 5 cubes.'],
      prompt: 'Add all the cubes. Then share the total into equal towers.',
      hint1: 'First add up the cubes in all four towers.',
      hint2: 'The total is 20. Now share it into 4 equal towers.',
      twin: {
        text: 'Five towers have 2, 8, 4, 9 and 7 cubes. If the cubes are shared fairly, how many cubes are in each tower?',
        picture: row([2, 8, 4, 9, 7], ['Tower', 'A', 'B', 'C', 'D', 'E']),
        answer: 6,
        steps: ['Put all the cubes together: 2 + 8 + 4 + 9 + 7 = 30.', 'There are 5 towers, so share 30 into 5 equal towers.', '30 ÷ 5 = 6. So each tower has 6 cubes.'],
        hint1: 'First add up the cubes in all five towers.',
        hint2: 'Now share that total into equal towers, one for each tower.',
      },
    },
    won: { text: 'You put all the cubes together, then shared them out fairly.', sticker: 'The fair share is called the mean. Mean = total ÷ how many.' },
    twinWon: { text: 'You added 2, 8, 4, 9 and 7, then shared the total fairly.', sticker: 'The fair share is called the mean. Mean = total ÷ how many.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'Four towers have 1, 5, 2 and 8 cubes. Shared fairly, how many cubes are in each tower?',
        picture: row([1, 5, 2, 8], ['Tower', 'A', 'B', 'C', 'D']),
        answer: 4, steps: ['1 + 5 + 2 + 8 = 16.', 'There are 4 towers.', '16 ÷ 4 = 4. So each tower has 4 cubes.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'Three jars hold 7, 12 and 11 marbles. Shared fairly, how many marbles are in each jar?',
        picture: row([7, 12, 11], ['Jar', 'A', 'B', 'C']),
        answer: 10, steps: ['7 + 12 + 11 = 30.', 'There are 3 jars, so share 30 into 3.', '30 ÷ 3 = 10. So each jar has 10 marbles.'] } },
      { why: 'Still "total ÷ how many"', problem: {
        text: 'Six friends scored 4, 9, 6, 3, 8 and 9 points. What is the mean score?',
        picture: row([4, 9, 6, 3, 8, 9]),
        answer: 6.5, steps: ['4 + 9 + 6 + 3 + 8 + 9 = 39.', 'There are 6 scores, so divide by 6.', '39 ÷ 6 = 6.5. So the mean is 6.5 points.'] } },
      { why: 'A little harder', problem: {
        text: 'Kai got 82, 90, 76, 88 and 94 on five tests. What is his mean score?',
        picture: row([82, 90, 76, 88, 94], ['Test', '1', '2', '3', '4', '5']),
        answer: 86, steps: ['82 + 90 + 76 + 88 + 94 = 430.', 'There are 5 tests, so divide by 5.', '430 ÷ 5 = 86. So the mean is 86.'] } },
      { why: 'Same math in a story', problem: {
        text: 'Mia ran 2.5, 4, 1.5 and 3 miles on four days. What is the mean distance she ran each day?',
        picture: row([2.5, 4, 1.5, 3], ['Day', 'Mon', 'Tue', 'Wed', 'Thu']),
        answer: 2.75, steps: ['2.5 + 4 + 1.5 + 3 = 11 miles in all.', 'She ran on 4 days, so divide by 4.', '11 ÷ 4 = 2.75. So she ran a mean of 2.75 miles a day.'] } },
    ],
  },

  // ── Topic 2 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g6m7-t2', title: 'Median: the middle', skill: 'Find the median of a data set with an odd or even count',
    bigIdea: 'Put the numbers in order from smallest to biggest. The number in the very middle splits them in half.',
    screens: [
      { title: 'Five seedlings', text: 'Five seedlings are 7, 3, 9, 4 and 6 inches tall. Which height is right in the middle?',
        pictures: [row([7, 3, 9, 4, 6], ['Seedling', 'A', 'B', 'C', 'D', 'E'])] },
      { title: 'The middle spot is not the middle', text: 'Now, the number sitting in the middle spot of this list is 9. But hang on. 9 is the tallest seedling of the five. The list is all jumbled up, so its middle spot tells us nothing yet.',
        beats: [
          { say: 'Now, the number sitting in the middle spot of this list is 9.', pic: 0 },
          { say: 'But hang on. 9 is the tallest seedling of the five.' },
          { say: 'The list is all jumbled up, so its middle spot tells us nothing yet.', write: 'jumbled list → no middle yet' },
        ],
        pictures: [row([7, 3, 9, 4, 6], ['Seedling', 'A', 'B', 'C', 'D', 'E'])] },
      { title: 'The big idea', text: 'Put the numbers in order from smallest to biggest. The number in the very middle splits them in half.',
        beats: [
          { say: 'Put the numbers in order from smallest to biggest.', pic: 0 },
          { say: 'The number in the very middle splits them in half.' },
        ],
        pictures: [row([7, 3, 9, 4, 6], ['Seedling', 'A', 'B', 'C', 'D', 'E'])] },
      { title: 'Line them up', text: 'So the first job, every time, is to sort them. Smallest to biggest. That gives us 3, 4, 6, 7, 9.',
        beats: [
          { say: 'So the first job, every time, is to sort them.', write: 'sort first, always' },
          { say: 'Smallest to biggest.' },
          { say: 'That gives us 3, 4, 6, 7, 9.', pic: 0 },
        ],
        pictures: [{ kind: 'table', rows: [['3', '4', '6', '7', '9']], motion: true }] },
      { title: 'Find the middle', text: 'Now cross off one from each end. 3 and 9 go. Then 4 and 7 go. The one still standing is 6, so the middle height is 6 inches.',
        beats: [
          { say: 'Now cross off one from each end.', pic: 0 },
          { say: '3 and 9 go. Then 4 and 7 go.' },
          { say: 'The one still standing is 6, so the middle height is 6 inches.', pic: 1 },
        ],
        pictures: [{ kind: 'table', rows: [['3', '4', '6', '7', '9']], mark: [[0, 2]] }, { kind: 'eq', text: '3, 4, 6, 7, 9', lines: ['middle: 6'] }] },
      { title: 'Two in the middle', text: 'What if there is no single middle? Add a seedling that is 10 inches, and now we have six numbers. Two of them share the middle, 6 and 7. When that happens, take the number halfway between the two.',
        beats: [
          { say: 'What if there is no single middle?' },
          { say: 'Add a seedling that is 10 inches, and now we have six numbers.', pic: 0 },
          { say: 'Two of them share the middle, 6 and 7.' },
          { say: 'When that happens, take the number halfway between the two.', pic: 1, write: 'two in the middle → halfway between' },
        ],
        pictures: [{ kind: 'table', rows: [['3', '4', '6', '7', '9', '10']], mark: [[0, 2], [0, 3]] }, { kind: 'eq', text: '(6 + 7) ÷ 2 = 6.5' }] },
      { title: 'One thing not to do', text: "Here is the trap. Don't grab the middle spot before you sort. Put the numbers in order first, every single time.",
        beats: [
          { say: 'Here is the trap.' },
          { say: "Don't grab the middle spot before you sort.", pic: 0 },
          { say: 'Put the numbers in order first, every single time.' },
        ],
        pictures: [{ kind: 'cards', wrong: '7, 3, 9, 4, 6 → 9', right: '3, 4, 6, 7, 9 → 6' }] },
    ],
    turn: {
      text: 'Five seedlings are 8, 2, 5, 9 and 4 inches tall. What is the middle height?',
      picture: row([8, 2, 5, 9, 4], ['Seedling', 'A', 'B', 'C', 'D', 'E']),
      answer: 5,
      steps: ['Sort the heights: 2, 4, 5, 8, 9.', 'Cross off 2 and 9, then 4 and 8.', 'The one left is 5. So the middle height is 5 inches.'],
      prompt: 'Sort the heights first. Then find the one in the middle.',
      hint1: 'Put the heights in order, smallest to biggest.',
      hint2: 'Cross off one number from each end until only one is left.',
      twin: {
        text: 'These 7 dogs weigh 12, 30, 18, 25, 9, 21 and 14 pounds. What is the middle weight?',
        picture: row([12, 30, 18, 25, 9, 21, 14]),
        answer: 18,
        steps: ['Sort the weights: 9, 12, 14, 18, 21, 25, 30.', 'Cross off 9 and 30, then 12 and 25, then 14 and 21.', 'The one left is 18. So the middle weight is 18 pounds.'],
        hint1: 'Put the weights in order, smallest to biggest.',
        hint2: 'Cross off one weight from each end, again and again, until one is left.',
      },
    },
    won: { text: 'You sorted the heights, then found the one in the middle.', sticker: 'The middle number of a sorted list is called the median.' },
    twinWon: { text: 'You sorted all 7 weights and found the one in the middle.', sticker: 'The middle number of a sorted list is called the median.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'What is the median of these numbers?', picture: row([6, 1, 8, 3, 7]),
        answer: 6, steps: ['Sort them: 1, 3, 6, 7, 8.', 'Cross off 1 and 8, then 3 and 7.', 'The one left is 6. So the median is 6.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'What is the median of these numbers?', picture: row([11, 4, 15, 9, 13, 7, 10]),
        answer: 10, steps: ['Sort them: 4, 7, 9, 10, 11, 13, 15.', 'Cross off three from each end: 4, 7, 9 and 11, 13, 15.', 'The one left is 10. So the median is 10.'] } },
      { why: 'Still "sort, then find the middle"', problem: {
        text: 'What is the median of these four numbers?', picture: row([5, 9, 2, 8]),
        answer: 6.5, steps: ['Sort them: 2, 5, 8, 9.', 'Two numbers share the middle: 5 and 8.', '(5 + 8) ÷ 2 = 6.5. So the median is 6.5.'] } },
      { why: 'A little harder', problem: {
        text: 'What is the median of these six numbers?', picture: row([14, 22, 17, 30, 25, 19]),
        answer: 20.5, steps: ['Sort them: 14, 17, 19, 22, 25, 30.', 'Two numbers share the middle: 19 and 22.', '(19 + 22) ÷ 2 = 20.5. So the median is 20.5.'] } },
      { why: 'Same math in a story', problem: {
        text: 'Six friends read 12, 7, 15, 9, 20 and 10 books this summer. What is the median number of books?',
        picture: row([12, 7, 15, 9, 20, 10]),
        answer: 11, steps: ['Sort them: 7, 9, 10, 12, 15, 20.', 'Two numbers share the middle: 10 and 12.', '(10 + 12) ÷ 2 = 11. So the median is 11 books.'] } },
    ],
  },

  // ── Topic 3 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g6m7-t3', title: 'Mode: the most common', skill: 'Find the mode: the value that appears most often',
    bigIdea: 'The most common value is the one that shows up most often. Find the tallest stack and read the number under it.',
    screens: [
      { title: 'How many pets?', text: '12 kids said how many pets they have. Each ✕ is one kid. Which number of pets is the most common?',
        pictures: [PETS] },
      { title: 'Adding them up does not help', text: 'Your first thought might be to add up all the pets. But that would tell us how many pets there are in all. It would not tell us which answer the kids gave most often.',
        beats: [
          { say: 'Your first thought might be to add up all the pets.', pic: 0 },
          { say: 'But that would tell us how many pets there are in all.' },
          { say: 'It would not tell us which answer the kids gave most often.', write: 'most often, not how many' },
        ],
        pictures: [PETS] },
      { title: 'The big idea', text: 'The most common value is the one that shows up most often. Find the tallest stack and read the number under it.',
        beats: [
          { say: 'The most common value is the one that shows up most often.', pic: 0 },
          { say: 'Find the tallest stack and read the number under it.' },
        ],
        pictures: [PETS] },
      { title: 'Build the stacks', text: 'Here is how this picture got made. Every kid puts one ✕ above their own number of pets. Watch the stacks grow as the answers come in.',
        beats: [
          { say: 'Here is how this picture got made.' },
          { say: 'Every kid puts one ✕ above their own number of pets.', pic: 0 },
          { say: 'Watch the stacks grow as the answers come in.' },
        ],
        pictures: [{ ...PETS, motion: true }] },
      { title: 'Find the tallest stack', text: 'Now run your eye along the stacks and find the tallest one. The stack above 1 has 5 ✕s in it. Nothing else comes close.',
        beats: [
          { say: 'Now run your eye along the stacks and find the tallest one.', pic: 0 },
          { say: 'The stack above 1 has 5 ✕s in it.', pic: 1 },
          { say: 'Nothing else comes close.' },
        ],
        pictures: [PETS, { kind: 'eq', text: '1 pet: 5 kids' }] },
      { title: 'Read the number under it', text: 'Last step, and it is the one people rush. Look underneath the tallest stack. It sits above 1, so the most common number of pets is 1.',
        beats: [
          { say: 'Last step, and it is the one people rush.', pic: 0 },
          { say: 'Look underneath the tallest stack.', write: 'read under the stack' },
          { say: 'It sits above 1, so the most common number of pets is 1.', pic: 1 },
        ],
        pictures: [PETS, { kind: 'eq', text: 'most common: 1 pet' }] },
      { title: 'One thing not to do', text: "So here is the mix-up. Don't tell me how tall the stack is. The stack holds 5 kids, but the most common answer is 1 pet.",
        beats: [
          { say: 'So here is the mix-up.' },
          { say: "Don't tell me how tall the stack is.", pic: 0 },
          { say: 'The stack holds 5 kids, but the most common answer is 1 pet.' },
        ],
        pictures: [{ kind: 'cards', wrong: 'Most common: 5', right: 'Most common: 1 pet' }] },
    ],
    turn: {
      text: '12 kids said how many brothers and sisters they have. Which number is the most common?',
      picture: { kind: 'chart', type: 'dot', labels: ['0', '1', '2', '3', '4'], values: [2, 3, 6, 1, 0], xLabel: 'Brothers and sisters' },
      answer: 2,
      steps: ['Each ✕ is one kid. Find the tallest stack.', 'The stack above 2 has 6 ✕s, more than any other.', 'So the most common number is 2.'],
      prompt: 'Find the tallest stack. Read the number under it.',
      hint1: 'Which stack of ✕s is the tallest?',
      hint2: 'Read the number under the tallest stack, not how tall it is.',
      twin: {
        text: 'These 13 kids marked their shoe size. Which shoe size is the most common?',
        picture: { kind: 'chart', type: 'dot', labels: ['5', '6', '7', '8', '9'], values: [1, 2, 3, 5, 2], xLabel: 'Shoe size' },
        answer: 8,
        steps: ['Each ✕ is one kid. Find the tallest stack.', 'The stack above 8 has more ✕s than any other.', 'So the most common shoe size is 8.'],
        hint1: 'Which stack of ✕s is the tallest?',
        hint2: 'Say the shoe size under that stack, not how many ✕s it has.',
      },
    },
    won: { text: 'You found the tallest stack and read the number under it.', sticker: 'The value that shows up most often is called the mode.' },
    twinWon: { text: 'You found the tallest stack and read the shoe size under it.', sticker: 'The value that shows up most often is called the mode.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'Kids said how many goals they scored this week. What is the mode?',
        picture: { kind: 'chart', type: 'dot', labels: ['0', '1', '2', '3', '4'], values: [1, 2, 4, 3, 1], xLabel: 'Goals' },
        answer: 2, steps: ['Find the tallest stack of ✕s.', 'The stack above 2 has 4 ✕s, the most.', 'So the mode is 2.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'Kids at a camp marked their age. What is the mode?',
        picture: { kind: 'chart', type: 'dot', labels: ['10', '11', '12', '13', '14'], values: [2, 4, 1, 6, 3], xLabel: 'Age' },
        answer: 13, steps: ['Find the tallest stack of ✕s.', 'The stack above 13 has 6 ✕s, the most.', 'So the mode is 13.'] } },
      { why: 'Still "the one that shows up most"', problem: {
        text: 'What is the mode of these numbers?', picture: row([4, 7, 5, 7, 9, 4, 7]),
        answer: 7, steps: ['4 shows up 2 times. 5 and 9 show up once.', '7 shows up 3 times, more than any other number.', 'So the mode is 7.'] } },
      { why: 'A little harder', problem: {
        text: 'Kids marked how many hours of homework they did this week. Some stacks are close. What is the mode?',
        picture: { kind: 'chart', type: 'dot', labels: ['1', '2', '3', '4', '5', '6'], values: [3, 4, 2, 5, 4, 3], xLabel: 'Hours' },
        answer: 4, steps: ['The stacks above 2 and 5 each have 4 ✕s.', 'The stack above 4 has 5 ✕s, one more than those.', 'So the mode is 4.'] } },
      { why: 'Same math in a story', problem: {
        text: 'A class rolled a number cube 20 times and marked each roll. Which number came up most often?',
        picture: { kind: 'chart', type: 'dot', labels: ['1', '2', '3', '4', '5', '6'], values: [3, 2, 4, 6, 3, 2], xLabel: 'Number rolled' },
        answer: 4, steps: ['Each ✕ is one roll. Find the tallest stack.', 'The stack above 4 has 6 ✕s, the most.', 'So 4 came up most often. The mode is 4.'] } },
    ],
  },

  // ── Topic 4 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g6m7-t4', title: 'Range: the spread', skill: 'Find the range: the biggest value minus the smallest',
    bigIdea: 'To see how spread out numbers are, take the biggest number minus the smallest number.',
    screens: [
      { title: "Sam's basketball games", text: 'Sam scored 4, 11, 7, 15 and 9 points in five games. How spread out are his scores?',
        pictures: [line20([4, 11, 7, 15, 9])] },
      { title: 'His best game is not enough', text: "Sam's best game was 15 points. Nice, but that one number does not tell us how far apart his games are. A player who scores 15 in every single game is a completely different player.",
        beats: [
          { say: "Sam's best game was 15 points.", pic: 0 },
          { say: 'Nice, but that one number does not tell us how far apart his games are.' },
          { say: 'A player who scores 15 in every single game is a completely different player.', write: 'spread = how far apart' },
        ],
        pictures: [line20([4, 11, 7, 15, 9])] },
      { title: 'The big idea', text: 'To see how spread out numbers are, take the biggest number minus the smallest number.',
        beats: [
          { say: 'To see how spread out numbers are, take the biggest number minus the smallest number.', pic: 0 },
        ],
        pictures: [line20([4, 11, 7, 15, 9])] },
      { title: 'Find the two ends', text: 'Start at the two ends. His smallest score is 4. His biggest is 15. Every other game he played sits somewhere in between those two.',
        beats: [
          { say: 'Start at the two ends.', pic: 0 },
          { say: 'His smallest score is 4. His biggest is 15.' },
          { say: 'Every other game he played sits somewhere in between those two.' },
        ],
        pictures: [line20([11, 7, 9], { points: [{ at: 4, label: 'smallest' }, { at: 15, label: 'biggest' }], motion: true })] },
      { title: 'Measure the gap', text: 'Now measure the gap between them. Jump all the way from 4 up to 15. 15 − 4 = 11, so his scores are spread over 11 points.',
        beats: [
          { say: 'Now measure the gap between them.', write: 'biggest − smallest' },
          { say: 'Jump all the way from 4 up to 15.', pic: 0 },
          { say: '15 − 4 = 11, so his scores are spread over 11 points.', pic: 1 },
        ],
        pictures: [line20([4, 11, 7, 15, 9], { jumps: [{ from: 4, to: 15, label: '11' }], motion: true }), { kind: 'eq', text: '15 − 4 = 11' }] },
      { title: 'A small gap', text: 'Now compare that with Kim. She scored 9, 10, 8, 11 and 10. Her gap is 11 − 8 = 3. See how her scores huddle together?',
        beats: [
          { say: 'Now compare that with Kim. She scored 9, 10, 8, 11 and 10.', pic: 0 },
          { say: 'Her gap is 11 − 8 = 3.', pic: 1 },
          { say: 'See how her scores huddle together?' },
        ],
        pictures: [line20([9, 10, 8, 11, 10], { jumps: [{ from: 8, to: 11, label: '3' }] }), { kind: 'eq', text: '11 − 8 = 3' }] },
      { title: 'One thing not to do', text: "One warning. Don't just subtract the first number in the list from the last one. Hunt down the smallest and the biggest first.",
        beats: [
          { say: 'One warning.' },
          { say: "Don't just subtract the first number in the list from the last one.", pic: 0 },
          { say: 'Hunt down the smallest and the biggest first.' },
        ],
        pictures: [{ kind: 'cards', wrong: '9 − 4 = 5', right: '15 − 4 = 11' }] },
    ],
    turn: {
      text: 'Leo scored 6, 13, 8, 17 and 10 points in five games. What is the biggest score minus the smallest score?',
      picture: row([6, 13, 8, 17, 10], ['Game', '1', '2', '3', '4', '5']),
      answer: 11,
      steps: ['The smallest score is 6.', 'The biggest score is 17.', '17 − 6 = 11. So the spread is 11 points.'],
      prompt: 'Find the smallest and the biggest. Then subtract.',
      hint1: 'Find the smallest score and the biggest score first.',
      hint2: 'Take the biggest score minus the smallest score.',
      twin: {
        text: 'The low temperatures one week were 41, 36, 45, 50, 38, 43 and 47 °F. What is the biggest minus the smallest?',
        picture: row([41, 36, 45, 50, 38, 43, 47]),
        answer: 14,
        steps: ['The smallest temperature is 36 °F.', 'The biggest temperature is 50 °F.', '50 − 36 = 14. So the spread is 14 °F.'],
        hint1: 'Look through all seven for the smallest and the biggest.',
        hint2: 'Take the biggest temperature minus the smallest one.',
      },
    },
    won: { text: 'You found the two ends and took the biggest minus the smallest.', sticker: 'The biggest minus the smallest is called the range.' },
    twinWon: { text: 'You took 50 minus 36 to find how spread out the week was.', sticker: 'The biggest minus the smallest is called the range.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'What is the range of these scores?', picture: row([5, 12, 8, 3, 10]),
        answer: 9, steps: ['The smallest is 3.', 'The biggest is 12.', '12 − 3 = 9. So the range is 9.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'What is the range of these numbers?', picture: row([24, 31, 19, 28, 35, 22]),
        answer: 16, steps: ['The smallest is 19.', 'The biggest is 35.', '35 − 19 = 16. So the range is 16.'] } },
      { why: 'Still "biggest minus smallest"', problem: {
        text: 'A plant was 7 inches tall every day for five days. What is the range of its heights?', picture: row([7, 7, 7, 7, 7]),
        answer: 0, steps: ['The smallest height is 7 and the biggest is 7.', 'Nothing is spread out at all.', '7 − 7 = 0. So the range is 0.'] } },
      { why: 'A little harder', problem: {
        text: 'What is the range of these lengths, in meters?', picture: row([2.5, 4.1, 3.8, 1.9, 3.2]),
        answer: 2.2, steps: ['The smallest is 1.9.', 'The biggest is 4.1.', '4.1 − 1.9 = 2.2. So the range is 2.2 meters.'] } },
      { why: 'Same math in a story', problem: {
        text: 'Five plane tickets cost $148, $162, $139, $175 and $151. What is the range of the prices?',
        picture: row(['$148', '$162', '$139', '$175', '$151']),
        answer: 36, steps: ['The cheapest ticket is $139.', 'The most expensive ticket is $175.', '175 − 139 = 36. So the range is $36.'] } },
    ],
  },

  // ── Topic 5 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g6m7-t5', title: 'Which middle fits best?', skill: 'Choose mean or median when one value is far from the rest',
    bigIdea: "One number far from the rest pulls the mean toward it, so the median fits the group better.",
    screens: [
      { title: 'Ages at a party', text: 'Five people are at a party. Four kids are 9, 10, 10 and 11. One grown-up is 40. Which one number describes their ages best?',
        pictures: [line40()] },
      { title: "The mean says 16", text: "Try the mean first. Add all five ages, and you get 80. Share it by 5. 80 ÷ 5 = 16. But who at this party is 16? Nobody.",
        beats: [
          { say: "Try the mean first. Add all five ages, and you get 80.", pic: 0 },
          { say: "Share it by 5. 80 ÷ 5 = 16.", pic: 1 },
          { say: "But who at this party is 16? Nobody." },
        ],
        pictures: [line40(), { kind: 'eq', text: '80 ÷ 5 = 16' }] },
      { title: "The big idea", text: "One number far from the rest pulls the mean toward it, so the median fits the group better.",
        beats: [
          { say: "One number far from the rest pulls the mean toward it, so the median fits the group better.", pic: 0 },
        ],
        pictures: [line40()] },
      { title: "Watch the mean get pulled", text: "Look at the four kids on their own. 9, 10, 10 and 11 make 40. 40 ÷ 4 = 10. So their mean is 10. Now put the grown-up back in. The mean jumps to 16, pulled up by one person.",
        beats: [
          { say: "Look at the four kids on their own. 9, 10, 10 and 11 make 40.", pic: 0 },
          { say: "40 ÷ 4 = 10. So their mean is 10.", pic: 1 },
          { say: "Now put the grown-up back in. The mean jumps to 16, pulled up by one person." },
        ],
        pictures: [line40([{ at: 16, label: 'mean' }], [{ from: 10, to: 16, label: 'pulled' }], true), { kind: 'eq', text: '40 ÷ 4 = 10', lines: ['80 ÷ 5 = 16'] }] },
      { title: "The median stays put", text: "Now try the median. Put the ages in order: 9, 10, 10, 11, 40. The one in the middle is 10. The 40 is still in the list, and the median is still 10.",
        beats: [
          { say: "Now try the median. Put the ages in order: 9, 10, 10, 11, 40.", pic: 0 },
          { say: "The one in the middle is 10.", pic: 1 },
          { say: "The 40 is still in the list, and the median is still 10." },
        ],
        pictures: [line40([{ at: 10, label: 'median' }], undefined, true), { kind: 'eq', text: '9, 10, 10, 11, 40', lines: ['median: 10'] }] },
      { title: "Pick the one that fits", text: "So which number fits this party? Almost everyone is about 10. The median says 10. The mean says 16, and that fits nobody. When one number sits far from the rest, pick the median.",
        beats: [
          { say: "So which number fits this party? Almost everyone is about 10.", pic: 0 },
          { say: "The median says 10. The mean says 16, and that fits nobody." },
          { say: "When one number sits far from the rest, pick the median." },
        ],
        pictures: [line40([{ at: 10, label: 'median' }, { at: 16, label: 'mean' }])] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't reach for the mean EVERY time. One far number pulls it away from the group. Then the median fits better. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't reach for the mean EVERY time.", pic: 0 },
          { say: "One far number pulls it away from the group. Then the median fits better." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: 'Typical age: 16', right: 'Typical age: 10' }] },
    ],
    turn: {
      text: 'Five kids get $6, $5, $7, $6 and $36 a week. Which middle describes these amounts best?',
      picture: dots(0, 40, 8, [6, 5, 7, 6, 36]),
      answer: { choices: ['mean', 'median'], correct: 1 },
      steps: ['The $36 sits far from the other amounts.', 'It pulls the mean up to 60 ÷ 5 = 12, but most kids get about $6.', 'The median stays at 6, so the median fits best.'],
      prompt: 'Look for a number far from the rest.',
      hint1: 'Is any amount far away from the others?',
      hint2: 'A far-away number pulls the mean toward it. Which middle does not move much?',
      twin: {
        text: 'Six test scores are 88, 91, 85, 90, 87 and 30. Which middle describes these scores best?',
        picture: dots(0, 100, 10, [88, 91, 85, 90, 87, 30]),
        answer: { choices: ['mean', 'median'], correct: 1 },
        steps: ['The 30 sits far below the other scores.', 'It pulls the mean down, but most scores are in the high 80s.', 'The middle scores barely move, so the median fits best.'],
        hint1: 'Is one score far from the rest?',
        hint2: 'Which middle gets pulled by that score, and which one stays put?',
      },
    },
    won: { text: 'You spotted the far-away number and chose the middle it does not pull.', sticker: 'A number far from the rest is called an outlier. It pulls the mean, not the median.' },
    twinWon: { text: 'You spotted the 30 far below the rest and chose the median.', sticker: 'A number far from the rest is called an outlier. It pulls the mean, not the median.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'Five plants are 4, 5, 5, 6 and 25 inches tall. Which middle describes their heights best?',
        picture: dots(0, 25, 5, [4, 5, 5, 6, 25]),
        answer: { choices: ['mean', 'median'], correct: 1 },
        steps: ['The 25 sits far from the other heights.', 'It pulls the mean up, but most plants are about 5 inches.', 'The median barely moves, so the median fits best.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'It takes five kids 10, 12, 11, 13 and 45 minutes to get to school. Which middle describes these times best?',
        picture: dots(0, 50, 10, [10, 12, 11, 13, 45]),
        answer: { choices: ['mean', 'median'], correct: 1 },
        steps: ['The 45 sits far from the other times.', 'It pulls the mean up, but most kids take about 11 or 12 minutes.', 'The median barely moves, so the median fits best.'] } },
      { why: 'Still "a far-away number pulls the mean"', problem: {
        text: 'Bus rides take 20, 22, 21, 23 and 2 minutes. Which way does the 2 pull the mean?',
        picture: dots(0, 25, 5, [20, 22, 21, 23, 2]),
        answer: { choices: ['up', 'down'], correct: 1 },
        steps: ['Most rides are between 20 and 23 minutes.', 'The 2 is far below them, so it drags the total down.', 'So the 2 pulls the mean down.'] } },
      { why: 'A little harder', problem: {
        text: 'Six kids have 12, 15, 14, 60, 13 and 16 stickers. The 60 pulls the mean, so find the median instead. What is it?',
        picture: row([12, 15, 14, 60, 13, 16]),
        answer: 14.5, steps: ['Sort them: 12, 13, 14, 15, 16, 60.', 'Two numbers share the middle: 14 and 15.', '(14 + 15) ÷ 2 = 14.5. So the median is 14.5 stickers.'] } },
      { why: 'Same math in a story', problem: {
        text: 'Four kids live 2, 3, 3 and 4 blocks from school. One kid lives 28 blocks away. What is the mean distance?',
        picture: dots(0, 30, 6, [2, 3, 3, 4, 28]),
        answer: 8, steps: ['2 + 3 + 3 + 4 + 28 = 40 blocks.', 'There are 5 kids, so 40 ÷ 5.', 'The mean is 8 blocks, pulled far above where most kids live.'] } },
    ],
  },

  // ── Topic 6 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g6m7-t6', title: 'Dot plots and histograms', skill: 'Read counts from a dot plot and a histogram',
    bigIdea: "Each ✕ stands for one thing, and each bar counts everything in its group.",
    screens: [
      { title: 'How long did you practice?', text: 'Kids in a band wrote down how many minutes they practiced. How many kids practiced 30 minutes or more?',
        pictures: [PRACTICE_DOTS] },
      { title: "A long list is slow", text: "You could read a long list of names and times, one kid at a time. That works. But it's slow, and it's easy to lose count. Is there a faster way? Yes. A picture sorts the kids for us.",
        beats: [
          { say: "You could read a long list of names and times, one kid at a time." },
          { say: "That works. But it's slow, and it's easy to lose count." },
          { say: "Is there a faster way? Yes. A picture sorts the kids for us.", pic: 0 },
        ],
        pictures: [PRACTICE_DOTS] },
      { title: "The big idea", text: "Each ✕ stands for one thing, and each bar counts everything in its group.",
        beats: [
          { say: "Each ✕ stands for one thing, and each bar counts everything in its group.", pic: 0 },
        ],
        pictures: [PRACTICE_DOTS] },
      { title: "Count the ✕s", text: "Look. Every ✕ here is one kid. Above 30 I count 5. Above 40, 3. Above 50, just 1.",
        beats: [
          { say: "Look. Every ✕ here is one kid.", pic: 0 },
          { say: "Above 30 I count 5. Above 40, 3. Above 50, just 1." },
        ],
        pictures: [{ ...PRACTICE_DOTS, motion: true }] },
      { title: "Add the stacks you need", text: "The question says 30 minutes or more. Does 30 itself count? Yes. So add the stacks over 30, 40 and 50. 5 + 3 + 1 = 9. So 9 kids practiced that long.",
        beats: [
          { say: "The question says 30 minutes or more. Does 30 itself count? Yes.", pic: 0 },
          { say: "So add the stacks over 30, 40 and 50." },
          { say: "5 + 3 + 1 = 9. So 9 kids practiced that long.", pic: 1 },
        ],
        pictures: [PRACTICE_DOTS, { kind: 'eq', text: '5 + 3 + 1 = 9' }] },
      { title: "Bars for groups", text: "Sometimes every time is different, so every stack is just 1 tall. So we put the times in groups, and draw one bar for each group. This bar is over 20–29. It reaches 8, so 8 kids practiced 20 to 29 minutes.",
        beats: [
          { say: "Sometimes every time is different, so every stack is just 1 tall." },
          { say: "So we put the times in groups, and draw one bar for each group.", pic: 0 },
          { say: "This bar is over 20–29. It reaches 8, so 8 kids practiced 20 to 29 minutes." },
        ],
        pictures: [{ ...PRACTICE_BARS, motion: true }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't count the NUMBERS along the bottom. 30, 40 and 50 give you 3. Count the ✕s instead, and you get 9. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't count the NUMBERS along the bottom.", pic: 0 },
          { say: "30, 40 and 50 give you 3. Count the ✕s instead, and you get 9." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '30 or more: 3 kids', right: '30 or more: 5 + 3 + 1 = 9 kids' }] },
    ],
    turn: {
      text: 'Kids marked how many books they read this month. How many kids read 3 or more books?',
      picture: { kind: 'chart', type: 'dot', labels: ['1', '2', '3', '4', '5'], values: [3, 5, 4, 2, 1], xLabel: 'Books' },
      answer: 7,
      steps: ['3 or more means the stacks above 3, 4 and 5.', 'Count the ✕s in those stacks: 4, 2 and 1.', '4 + 2 + 1 = 7. So 7 kids read 3 or more books.'],
      prompt: 'Find the stacks you need. Count their ✕s and add.',
      hint1: 'Which numbers count as 3 or more?',
      hint2: 'Count the ✕s above 3, 4 and 5, then add them.',
      twin: {
        text: 'A team marked how many goals it scored in each game. In how many games did it score 2 or more goals?',
        picture: { kind: 'chart', type: 'dot', labels: ['0', '1', '2', '3', '4'], values: [2, 6, 3, 4, 1], xLabel: 'Goals' },
        answer: 8,
        steps: ['2 or more means the stacks above 2, 3 and 4.', 'Count the ✕s in those stacks: 3, 4 and 1.', '3 + 4 + 1 = 8. So there were 8 games.'],
        hint1: 'Which numbers of goals count as 2 or more?',
        hint2: 'Each ✕ is one game. Count the ✕s in those stacks and add.',
      },
    },
    won: { text: 'You found the stacks you needed and added their ✕s.', sticker: 'A plot of ✕s is a dot plot. A bar graph of groups with no gaps is a histogram.' },
    twinWon: { text: 'You found every game with 2 or more goals and added them up.', sticker: 'A plot of ✕s is a dot plot. A bar graph of groups with no gaps is a histogram.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'Kids rated a movie from 1 to 5 stars. How many kids gave it 4 stars or more?',
        picture: { kind: 'chart', type: 'dot', labels: ['1', '2', '3', '4', '5'], values: [2, 3, 5, 4, 3], xLabel: 'Stars' },
        answer: 7, steps: ['4 or more means the stacks above 4 and 5.', 'Count the ✕s: 4 and 3.', '4 + 3 = 7. So 7 kids gave 4 stars or more.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'This histogram shows how many minutes kids read. How many kids read for less than 20 minutes?',
        picture: { kind: 'chart', type: 'hist', labels: ['0–9', '10–19', '20–29', '30–39'], values: [4, 7, 5, 2], xLabel: 'Minutes', yLabel: 'Kids' },
        answer: 11, steps: ['Less than 20 means the bars for 0–9 and 10–19.', 'Those bars are 4 and 7 tall.', '4 + 7 = 11. So 11 kids read for less than 20 minutes.'] } },
      { why: 'Still "count what is in each group"', problem: {
        text: 'This histogram shows test scores. How many students took the test?',
        picture: { kind: 'chart', type: 'hist', labels: ['50–59', '60–69', '70–79', '80–89', '90–99'], values: [1, 3, 6, 5, 2], xLabel: 'Score', yLabel: 'Students' },
        answer: 17, steps: ['Every student is in one of the bars.', 'The bars are 1, 3, 6, 5 and 2 tall.', '1 + 3 + 6 + 5 + 2 = 17. So 17 students took the test.'] } },
      { why: 'A little harder', problem: {
        text: 'Kids marked how many hours of TV they watched on Saturday. How many kids watched more than 1 hour but fewer than 4 hours?',
        picture: { kind: 'chart', type: 'dot', labels: ['0', '1', '2', '3', '4', '5'], values: [1, 3, 6, 4, 2, 1], xLabel: 'Hours' },
        answer: 10, steps: ['More than 1 and fewer than 4 means 2 or 3 hours. Not 1, and not 4.', 'There are 6 ✕s above 2 and 4 ✕s above 3.', '6 + 4 = 10. So 10 kids.'] } },
      { why: 'Same math in a story', problem: {
        text: 'A coach timed how many seconds kids took to run a lap. Kids who took less than 60 seconds get a ribbon. How many kids get a ribbon?',
        picture: { kind: 'chart', type: 'hist', labels: ['40–49', '50–59', '60–69', '70–79'], values: [3, 8, 6, 2], xLabel: 'Seconds', yLabel: 'Kids' },
        answer: 11, steps: ['Less than 60 seconds means the bars for 40–49 and 50–59.', 'Those bars are 3 and 8 tall.', '3 + 8 = 11. So 11 kids get a ribbon.'] } },
    ],
  },

  // ── Topic 7 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g6m7-t7', title: 'Probability as a fraction', skill: 'Write a probability as favorable outcomes over all equally likely outcomes',
    bigIdea: "The chance of something is the number of ways it can happen over the number of all the ways.",
    screens: [
      { title: 'Spin for a prize', text: 'This spinner has 8 equal parts. You win a prize if it lands on red. What is your chance of winning?',
        pictures: [PRIZE] },
      { title: "Win or lose is not half and half", text: "Only two things can happen. You win, or you lose. So is your chance 1/2? No. Look at the spinner. Red covers only some of the parts.",
        beats: [
          { say: "Only two things can happen. You win, or you lose." },
          { say: "So is your chance 1/2? No." },
          { say: "Look at the spinner. Red covers only some of the parts.", pic: 0 },
        ],
        pictures: [PRIZE] },
      { title: "The big idea", text: "The chance of something is the number of ways it can happen over the number of all the ways.",
        beats: [
          { say: "The chance of something is the number of ways it can happen over the number of all the ways.", pic: 0 },
        ],
        pictures: [PRIZE] },
      { title: "Count the ways to win", text: "First, count the ways to win. Count the red parts with me. 1, 2, 3. So there are 3 ways to win.",
        beats: [
          { say: "First, count the ways to win. Count the red parts with me.", pic: 0 },
          { say: "1, 2, 3. So there are 3 ways to win.", pic: 1 },
        ],
        pictures: [PRIZE, { kind: 'table', head: ['red', 'blue', 'green', 'yellow'], rows: [['3', '3', '1', '1']], mark: [[0, 0]], motion: true }] },
      { title: "Count all the ways", text: "Next, count every part. The arrow could stop on any one of them. 3 red, 3 blue, 1 green and 1 yellow. That's 8 parts in all.",
        beats: [
          { say: "Next, count every part. The arrow could stop on any one of them.", pic: 0 },
          { say: "3 red, 3 blue, 1 green and 1 yellow. That's 8 parts in all.", pic: 1 },
        ],
        pictures: [PRIZE, { kind: 'eq', text: '3 + 3 + 1 + 1 = 8' }] },
      { title: "Write it as a fraction", text: "Now make a fraction. The ways to win go on top. All the ways go on the bottom. So the chance of red is 3/8.",
        beats: [
          { say: "Now make a fraction. The ways to win go on top.", pic: 0 },
          { say: "All the ways go on the bottom." },
          { say: "So the chance of red is 3/8.", pic: 1 },
        ],
        pictures: [PRIZE, { kind: 'eq', text: 'red parts / all parts', lines: ['3/8'] }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't put red over the parts that are NOT red. That gives 3/5. Red goes over every part, all 8, so it's 3/8. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't put red over the parts that are NOT red.", pic: 0 },
          { say: "That gives 3/5. Red goes over every part, all 8, so it's 3/8." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '3/5', right: '3/8' }] },
    ],
    turn: {
      text: 'This spinner has 8 equal parts. What is the chance of landing on blue?',
      picture: spin(['blue', 'red', 'blue', 'green', 'blue', 'red', 'blue', 'blue']),
      answer: { frac: [5, 8] },
      steps: ['Count the blue parts: there are 5.', 'Count all the parts: there are 8.', 'Blue parts over all parts: 5/8.'],
      prompt: 'Ways it can happen on top. All the ways on the bottom.',
      hint1: 'How many parts are blue?',
      hint2: 'Now count every part. Put blue on top and all the parts on the bottom.',
      twin: {
        text: 'This spinner has 6 equal parts. What is the chance of landing on yellow?',
        picture: spin(['green', 'yellow', 'green', 'red', 'yellow', 'green']),
        answer: { frac: [1, 3] },
        steps: ['Count the yellow parts: there are 2.', 'Count all the parts: there are 6.', 'Yellow over all parts is 2/6, which is the same as 1/3.'],
        hint1: 'How many parts are yellow?',
        hint2: 'Put the yellow parts on top and all the parts on the bottom.',
      },
    },
    won: { text: 'You put the ways to win over all the ways.', sticker: 'Each way it can land is an outcome. The chance written as a number is the probability.' },
    twinWon: { text: 'You put the yellow parts over all the parts.', sticker: 'Each way it can land is an outcome. The chance written as a number is the probability.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'This spinner has 4 equal parts. What is the probability of landing on red?',
        picture: spin(['red', 'blue', 'red', 'red']),
        answer: { frac: [3, 4] }, steps: ['There are 3 red parts.', 'There are 4 parts in all.', 'So the probability is 3/4.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'This spinner has 10 equal parts. What is the probability of landing on green?',
        picture: spin(['green', 'blue', 'green', 'yellow', 'blue', 'green', 'red', 'blue', 'green', 'yellow']),
        answer: { frac: [2, 5] }, steps: ['There are 4 green parts.', 'There are 10 parts in all.', 'So the probability is 4/10, which is the same as 2/5.'] } },
      { why: 'Still "ways over all the ways"', problem: {
        text: 'A bag has 3 red, 4 blue and 5 green marbles. You pick one without looking. What is the probability it is blue?',
        picture: { kind: 'table', head: ['red', 'blue', 'green'], rows: [['3', '4', '5']] },
        answer: { frac: [1, 3] }, steps: ['There are 4 blue marbles.', 'There are 3 + 4 + 5 = 12 marbles in all.', 'So the probability is 4/12, which is the same as 1/3.'] } },
      { why: 'A little harder', problem: {
        text: 'This spinner has 10 equal parts numbered 1 to 10. What is the probability of landing on a number greater than 7?',
        picture: { kind: 'spinner', parts: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
        answer: { frac: [3, 10] }, steps: ['Greater than 7 means 8, 9 or 10. That is 3 parts. The 7 itself does not count.', 'There are 10 parts in all.', 'So the probability is 3/10.'] } },
      { why: 'Same math in a story', problem: {
        text: 'A class raffle has 30 tickets. Ava bought 6 of them. One ticket is drawn. What is the probability it is one of Ava\'s?',
        picture: { kind: 'table', head: ["Ava's tickets", 'Other tickets'], rows: [['6', '24']] },
        answer: { frac: [1, 5] }, steps: ['Ava has 6 tickets.', 'There are 30 tickets in all.', 'So the probability is 6/30, which is the same as 1/5.'] } },
    ],
  },

  // ── Topic 8 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g6m7-t8', title: 'Likely or unlikely', skill: 'Place a probability between 0 and 1 and describe it as impossible, unlikely, equally likely, likely or certain',
    bigIdea: "Every chance is a number from 0 to 1, where 0 is impossible, 1 is certain and 1/2 is right in the middle.",
    screens: [
      { title: 'Reach into the bag', text: 'A bag has 4 marbles: 3 red and 1 blue. You reach in without looking. Are you likely to pull out red?',
        pictures: [chance()] },
      { title: "Words alone are fuzzy", text: "You might say maybe. A friend might say probably. Which one is right? Words mean different things to different people. So we put every chance on one line, from 0 to 1.",
        beats: [
          { say: "You might say maybe. A friend might say probably." },
          { say: "Which one is right? Words mean different things to different people." },
          { say: "So we put every chance on one line, from 0 to 1.", pic: 0 },
        ],
        pictures: [chance()] },
      { title: "The big idea", text: "Every chance is a number from 0 to 1, where 0 is impossible, 1 is certain and 1/2 is right in the middle.",
        beats: [
          { say: "Every chance is a number from 0 to 1, where 0 is impossible, 1 is certain and 1/2 is right in the middle.", pic: 0 },
        ],
        pictures: [chance()] },
      { title: "The two ends", text: "Start with the two ends. Can you pull out a green marble? No. That's 0 ways out of 4. Its chance is 0. Any marble at all is 4 ways out of 4. Its chance is 1.",
        beats: [
          { say: "Start with the two ends. Can you pull out a green marble? No.", pic: 0 },
          { say: "That's 0 ways out of 4. Its chance is 0." },
          { say: "Any marble at all is 4 ways out of 4. Its chance is 1." },
        ],
        pictures: [chance([{ at: 0, label: 'green' }, { at: 1, label: 'any color' }], true)] },
      { title: "Right in the middle", text: "Now the middle. Flip a coin. Heads is 1 way out of 2, so 1/2. Heads and tails have the same chance, so 1/2 sits exactly halfway.",
        beats: [
          { say: "Now the middle. Flip a coin. Heads is 1 way out of 2, so 1/2.", pic: 0 },
          { say: "Heads and tails have the same chance, so 1/2 sits exactly halfway." },
        ],
        pictures: [chance([{ at: 0.5, label: 'heads' }])] },
      { title: "Place red and blue", text: "Back to the bag. Red is 3 ways out of 4, so 3/4. Is 3/4 past the middle? Yes, so red is likely. Blue is 1 way out of 4, so 1/4. That's below the middle, so blue is unlikely.",
        beats: [
          { say: "Back to the bag. Red is 3 ways out of 4, so 3/4.", pic: 0 },
          { say: "Is 3/4 past the middle? Yes, so red is likely." },
          { say: "Blue is 1 way out of 4, so 1/4. That's below the middle, so blue is unlikely." },
        ],
        pictures: [chance([{ at: 0.25, label: 'blue' }, { at: 0.75, label: 'red' }], true)] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't call blue likely just because it CAN happen. 1/4 is below 1/2, so blue is unlikely. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't call blue likely just because it CAN happen.", pic: 0 },
          { say: "1/4 is below 1/2, so blue is unlikely." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '1/4 → likely', right: '1/4 → unlikely' }] },
    ],
    turn: {
      text: 'A bag has 5 marbles: 1 yellow and 4 purple. You pick one without looking. How likely is yellow?',
      picture: chance(),
      answer: { choices: LIKELY3, correct: 0 },
      steps: ['Yellow is 1 way out of 5, so its chance is 1/5.', '1/5 is more than 0 but less than 1/2.', 'So yellow is unlikely.'],
      prompt: 'Find the chance as a fraction. Then see where it sits on the line.',
      hint1: 'How many ways out of all the ways give yellow?',
      hint2: 'Is that chance less than 1/2 or more than 1/2?',
      twin: {
        text: 'A bag has 6 marbles: 5 green and 1 white. You pick one without looking. How likely is green?',
        picture: chance(),
        answer: { choices: LIKELY3, correct: 2 },
        steps: ['Green is 5 ways out of 6, so its chance is 5/6.', '5/6 is more than 1/2 but less than 1.', 'So green is likely.'],
        hint1: 'How many of the marbles are green?',
        hint2: 'Is 5 out of 6 more than half or less than half?',
      },
    },
    won: { text: 'You found the chance and saw which side of the middle it sits on.', sticker: 'Probability goes from 0, impossible, to 1, certain.' },
    twinWon: { text: 'You saw that 5 out of 6 is more than half, so green is likely.', sticker: 'Probability goes from 0, impossible, to 1, certain.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'A bag has 4 marbles: 1 red and 3 blue. How likely is red?',
        picture: chance(), answer: { choices: LIKELY3, correct: 0 },
        steps: ['Red is 1 way out of 4: 1/4.', '1/4 is less than 1/2.', 'So red is unlikely.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'A spinner has 10 equal parts, and 5 of them are orange. How likely is orange?',
        picture: chance(), answer: { choices: LIKELY3, correct: 1 },
        steps: ['Orange is 5 ways out of 10: 5/10.', '5/10 is the same as 1/2, right in the middle.', 'So orange is equally likely.'] } },
      { why: 'Still "a number from 0 to 1"', problem: {
        text: 'A number cube has the numbers 1 to 6. How likely is rolling a 7?',
        picture: chance(), answer: { choices: ['impossible', 'unlikely', 'certain'], correct: 0 },
        steps: ['No side of the cube shows 7.', 'That is 0 ways out of 6, a chance of 0.', 'So rolling a 7 is impossible.'] } },
      { why: 'A little harder', problem: {
        text: 'A bag has 2 red, 3 blue and 7 yellow marbles. What is the probability of picking a yellow marble?',
        picture: chance(), answer: { frac: [7, 12] },
        steps: ['There are 2 + 3 + 7 = 12 marbles in all.', '7 of them are yellow.', 'So the probability is 7/12, a little more than 1/2.'] } },
      { why: 'Same math in a story', problem: {
        text: 'At a fair, 9 of the 10 rubber ducks have a prize under them. You pick one duck. How likely are you to win a prize?',
        picture: chance(), answer: { choices: ['unlikely', 'likely', 'certain'], correct: 1 },
        steps: ['You win with 9 ducks out of 10: 9/10.', '9/10 is close to 1, but not 1, because one duck has no prize.', 'So winning is likely.'] } },
    ],
  },
]

attachChalk(G6M7, G6M7_CHALK)
