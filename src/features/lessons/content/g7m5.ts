/**
 * Grade 7 · Module 5 — Statistics and probability.
 * Written to docs/new-flow/AUTHORING.md. Not yet reviewed by the founder.
 * Question pictures show the DATA (that is the question); a computed mean, prediction, count or chance is never printed.
 */
import type { Lesson, Picture } from '../script'
import { attachChalk } from '../chalk'
import { G7M5_CHALK } from './chalk/g7m5'

// ── Topic 1 pictures ──
const SPORTS = ['Soccer', 'Basketball', 'Swimming', 'Other']
const SCHOOL: Picture = { kind: 'chart', type: 'bar', labels: SPORTS, values: [140, 80, 100, 80], scale: 20, yLabel: 'Students' }
const TEAM: Picture = { kind: 'chart', type: 'bar', labels: SPORTS, values: [2, 16, 1, 1], scale: 2, yLabel: 'Team players' }
const HAT: Picture = { kind: 'chart', type: 'bar', labels: SPORTS, values: [7, 4, 5, 4], yLabel: 'Names from the hat' }
const who = (want: string, asked: string): Picture => ({ kind: 'table', head: ['You want to know', 'Who is asked'], rows: [[want, asked]] })
const FAIR = ['fair', 'not fair']

// ── Topic 2 pictures ──
const sampleTape = (yes: number, all: number, yesText: string, otherText: string, whole: string): Picture => ({
  kind: 'tape', rows: [
    { label: 'Sample', cells: [{ w: yes, text: yesText, shade: true }, { w: all - yes, text: otherText }], brace: `${all} asked` },
    { label: 'Everyone', cells: [{ w: all, text: '?' }], brace: whole },
  ],
})
const PIZZA_TAPE: Picture = { kind: 'tape', rows: [{ label: 'Sample', cells: [{ w: 12, text: '12 pizza', shade: true }, { w: 28, text: '28 other' }], brace: '40 kids' }] }
const tens = (text?: string) =>
  Array.from({ length: 10 }, (_, i) => ({ w: 1, text, shade: i < 3 }))
const predict = (what: string, sample: string, all: string): Picture =>
  ({ kind: 'table', head: ['', what, 'In all'], rows: [['Sample', sample.split('/')[0], sample.split('/')[1]], ['Whole group', '?', all]], rowHead: true })

// ── Topic 3 pictures ──
const HEIGHTS = ['3', '4', '5', '6', '7', '8', '9']
const CLASS_A: Picture = { kind: 'chart', type: 'dot', labels: HEIGHTS, values: [0, 0, 1, 2, 3, 2, 1], xLabel: 'Class A plants (inches)' }
const CLASS_B: Picture = { kind: 'chart', type: 'dot', labels: HEIGHTS, values: [1, 2, 3, 2, 1, 0, 0], xLabel: 'Class B plants (inches)' }
const two = (col: string, a: [string, number[]], b: [string, number[]]): Picture => ({
  kind: 'table', head: [col, ...a[1].map((_, i) => String(i + 1))],
  rows: [[a[0], ...a[1].map(String)], [b[0], ...b[1].map(String)]], rowHead: true,
})

// ── Topic 4 pictures ──
const COLOR_TONE: Record<string, 1 | 2 | 3 | 4> = { green: 1, yellow: 2, red: 3, blue: 4 }
const spin = (parts: string[]): Picture => ({ kind: 'spinner', parts, tones: parts.map(p => COLOR_TONE[p] ?? 2) })
const WIN = spin(['blue', 'red', 'blue', 'green', 'red', 'blue', 'yellow', 'red', 'blue', 'green'])
const WIN_COUNTS = (motion = false): Picture => ({ kind: 'table', head: ['blue', 'red', 'green', 'yellow'], rows: [['4', '3', '2', '1']], mark: [[0, 0]], motion })

// ── Topic 5 pictures ──
const flips = (h: number, t: number, scale: number, motion = false): Picture =>
  ({ kind: 'chart', type: 'bar', labels: ['Heads', 'Tails'], values: [h, t], scale, yLabel: 'Flips', motion })
const tries = (n: string, chance: string, what: string): Picture => ({ kind: 'table', head: [what, 'Chance each time'], rows: [[n, chance]] })

// ── Topic 6 pictures ──
const blank = (cols: string[], rows: string[]): Picture =>
  ({ kind: 'table', head: ['', ...cols], rows: rows.map(r => [r, ...cols.map(() => '')]), rowHead: true })
const DIE = ['1', '2', '3', '4', '5', '6']
const COIN_DIE = blank(DIE, ['Heads', 'Tails'])
const COIN_DIE_FULL = (mark?: [number, number][], motion = false): Picture => ({
  kind: 'table', head: ['', ...DIE], rows: [['Heads', ...DIE.map(d => `H${d}`)], ['Tails', ...DIE.map(d => `T${d}`)]], rowHead: true, mark, motion,
})

export const G7M5: Lesson[] = [
  // ── Topic 1 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m5-t1', title: 'A fair sample', skill: 'Tell whether a sample gives everyone in the group the same chance to be picked',
    bigIdea: 'A fair sample gives everyone in the group the same chance to be picked. Asking only one kind of person is not fair.',
    screens: [
      { title: 'The favorite sport at school', text: 'A school has 400 students. You want to know their favorite sport, but you can only ask 20 of them. Which 20 should you ask?',
        pictures: [SCHOOL] },
      { title: 'Asking the basketball team', text: "The 20 kids on the basketball team are easy to find. So let's ask them. But look at what they said. Almost all of them say basketball. That does not look like the whole school at all.",
        beats: [
          { say: "The 20 kids on the basketball team are easy to find. So let's ask them.", pic: 0 },
          { say: 'But look at what they said. Almost all of them say basketball.' },
          { say: 'That does not look like the whole school at all.', write: 'one kind of kid → one kind of answer' },
        ],
        pictures: [TEAM] },
      { title: 'The big idea', text: 'A fair sample gives everyone in the group the same chance to be picked. Asking only one kind of person is not fair.',
        beats: [
          { say: 'A fair sample gives everyone in the group the same chance to be picked.', pic: 0 },
          { say: 'Asking only one kind of person is not fair.' },
        ],
        pictures: [SCHOOL] },
      { title: 'Pick names from a hat', text: 'Here is a better way. Put all 400 names in a hat and pull out 20 without looking. Now every single student has the same chance to be picked. Nobody is left out.',
        beats: [
          { say: 'Here is a better way. Put all 400 names in a hat and pull out 20 without looking.', pic: 0 },
          { say: 'Now every single student has the same chance to be picked. Nobody is left out.', write: 'everyone gets the same chance' },
        ],
        pictures: [{ ...HAT, motion: true }] },
      { title: 'It looks like the school', text: 'So how did the hat do? 7 of the 20 names picked soccer. That is 35 out of every 100. In the whole school, 140 of the 400 picked soccer, and that is 35 out of every 100 too. The small group came out looking like a little copy of the big one.',
        beats: [
          { say: 'So how did the hat do? 7 of the 20 names picked soccer.', pic: 0 },
          { say: 'That is 35 out of every 100. In the whole school, 140 of the 400 picked soccer, and that is 35 out of every 100 too.', pic: 1 },
          { say: 'The small group came out looking like a little copy of the big one.', write: 'fair sample = small copy' },
        ],
        pictures: [HAT, { kind: 'eq', text: '7/20 = 35/100', lines: ['140/400 = 35/100'] }] },
      { title: 'Ask who is left out', text: 'Here is the question to ask yourself every time. Could anyone in the school never be picked? Ask the team, and every kid who is not on the team is left out. Draw from the hat, and nobody is left out.',
        beats: [
          { say: 'Here is the question to ask yourself every time. Could anyone in the school never be picked?', write: 'who could never be picked?' },
          { say: 'Ask the team, and every kid who is not on the team is left out.', pic: 0 },
          { say: 'Draw from the hat, and nobody is left out.', pic: 1 },
        ],
        pictures: [{ ...TEAM, motion: true }, HAT] },
      { title: 'One thing not to do', text: "Here is the one that catches people. Don't call a sample fair just because it is big. 100 fans at a basketball game is a lot of people, and they still mostly pick basketball.",
        beats: [
          { say: 'Here is the one that catches people.' },
          { say: "Don't call a sample fair just because it is big.", pic: 0 },
          { say: '100 fans at a basketball game is a lot of people, and they still mostly pick basketball.' },
        ],
        pictures: [{ kind: 'cards', wrong: '100 fans at a game → fair', right: '20 names from a hat → fair' }] },
    ],
    turn: {
      text: 'You want to know how students at your school get to school. You ask the first 20 kids who get off one bus. Is that a fair sample?',
      picture: who('How students get to school', 'The first 20 kids off one bus'),
      answer: { choices: FAIR, correct: 1 },
      steps: ['Kids who walk or ride in a car never get off the bus.', 'They have no chance to be picked, so every kid asked rides the bus.', 'So the sample is not fair.'],
      prompt: 'Ask: does everyone in the school have the same chance to be picked?',
      hint1: 'Could a kid who walks to school be asked?',
      hint2: 'Every kid asked rides the bus. Does that look like the whole school?',
      twin: {
        text: 'A town has 2,000 voters. A computer picks 100 of their names by chance to ask about a new park. Is that a fair sample?',
        picture: who('What voters think of a new park', '100 names picked by chance from every voter'),
        answer: { choices: FAIR, correct: 0 },
        steps: ['The computer picks from every voter in town.', 'Every voter has the same chance to be picked. Nobody is left out.', 'So the sample is fair.'],
        hint1: 'Which voters could the computer pick?',
        hint2: 'Is any voter left with no chance to be picked?',
      },
    },
    won: { text: 'You checked whether anyone was left with no chance to be picked.', sticker: 'The whole group is the population. A sample picked by chance is a random sample. A sample that leaves people out is biased.' },
    twinWon: { text: 'You saw that every one of the 2,000 voters had the same chance.', sticker: 'The whole group is the population. A sample picked by chance is a random sample. A sample that leaves people out is biased.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'To find the favorite lunch at school, you ask 25 kids in the pizza club. Is that a fair sample?',
        picture: who('The favorite lunch at school', '25 kids in the pizza club'),
        answer: { choices: FAIR, correct: 1 },
        steps: ['Kids in the pizza club like pizza more than most kids.', 'Kids who are not in the club have no chance to be picked.', 'So the sample is not fair.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'A school has 600 students, and each one has a number. You draw 30 numbers from a hat and ask those students about bedtime. Is that a fair sample?',
        picture: who('Bedtimes at school', '30 numbers drawn from a hat of all 600'),
        answer: { choices: FAIR, correct: 0 },
        steps: ['Every student has a number in the hat.', 'So every student has the same chance to be drawn.', 'So the sample is fair.'] } },
      { why: 'Still "everyone has the same chance"', problem: {
        text: 'You want to know the favorite kind of book of kids who visit a library. Which sample is fair?',
        picture: { kind: 'table', head: ['Sample', 'Who is asked'], rows: [['1', 'The first 10 kids in the comic aisle'], ['2', 'Every 10th kid who walks in, all day'], ['3', 'Kids in the mystery book club']] },
        answer: { choices: ['the first 10 kids in the comic aisle', 'every 10th kid who walks in all day', 'kids in the mystery book club'], correct: 1 },
        steps: ['Kids in the comic aisle like comics. Kids in the mystery club like mysteries.', 'Any visitor can be a 10th kid through the door, whatever they like to read.', 'So the fair sample is every 10th kid who walks in all day.'] } },
      { why: 'A little harder', problem: {
        text: 'To find how many hours students sleep, a school puts a survey on its website. 200 students choose to answer it. Is that a fair sample?',
        picture: who('How many hours students sleep', '200 students who chose to answer online'),
        answer: { choices: FAIR, correct: 1 },
        steps: ['Only students who choose to answer are in the sample.', 'Kids who never visit the website, or do not want to answer, are left out.', 'Even with 200 answers, the sample is not fair.'] } },
      { why: 'Same math in a story', problem: {
        text: 'Mr. Diaz wants to know if his 120 students want a class trip to the zoo. He writes every name on a card, shuffles the cards and picks 15 without looking. Is his sample fair?',
        picture: who('Do students want a zoo trip?', '15 cards picked from all 120 names'),
        answer: { choices: FAIR, correct: 0 },
        steps: ['Every one of his students has a card in the pile.', 'Shuffling and picking without looking gives every card the same chance.', 'So his sample is fair.'] } },
    ],
  },

  // ── Topic 2 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m5-t2', title: 'Predict from a sample', skill: 'Use the fraction in a fair sample to predict a count in the whole group',
    bigIdea: 'A fair sample is a small copy of the whole group. Find its fraction, then take that fraction of the whole group.',
    screens: [
      { title: 'Pizza for the whole school', text: 'A school has 600 students. You ask 40 of them, picked by chance. 12 say pizza is their favorite lunch. How many of all 600 like pizza best?',
        pictures: [PIZZA_TAPE] },
      { title: 'It is not just 12', text: 'Careful here. 12 is only the kids you asked. The school has 600 students, and you talked to 40 of them. So there are a lot more pizza fans out there that you never asked.',
        beats: [
          { say: 'Careful here. 12 is only the kids you asked.', pic: 0 },
          { say: 'The school has 600 students, and you talked to 40 of them.', write: '12 is out of 40, not out of 600' },
          { say: 'So there are a lot more pizza fans out there that you never asked.' },
        ],
        pictures: [PIZZA_TAPE] },
      { title: 'The big idea', text: 'A fair sample is a small copy of the whole group. Find its fraction, then take that fraction of the whole group.',
        beats: [
          { say: 'A fair sample is a small copy of the whole group.', pic: 0 },
          { say: 'Find its fraction, then take that fraction of the whole group.' },
        ],
        pictures: [PIZZA_TAPE] },
      { title: 'Find the fraction', text: 'Start with the kids you asked. 12 out of 40 like pizza. 12/40 is the same as 3/10. So about 3 out of every 10 kids pick pizza.',
        beats: [
          { say: 'Start with the kids you asked. 12 out of 40 like pizza.' },
          { say: '12/40 is the same as 3/10.', pic: 1 },
          { say: 'So about 3 out of every 10 kids pick pizza.', pic: 0 },
        ],
        pictures: [{ kind: 'tape', rows: [{ label: 'Every 10 kids', cells: tens() }], motion: true }, { kind: 'eq', text: '12/40 = 3/10' }] },
      { title: 'Stretch it to 600', text: 'Now the whole school. It is the same tape, just bigger. Split the 600 students into those same 10 equal parts. 600 ÷ 10 = 60, so each part is 60 kids.',
        beats: [
          { say: 'Now the whole school. It is the same tape, just bigger.', pic: 0 },
          { say: 'Split the 600 students into those same 10 equal parts.' },
          { say: '600 ÷ 10 = 60, so each part is 60 kids.', pic: 1 },
        ],
        pictures: [{ kind: 'tape', rows: [{ label: 'School', cells: tens('60'), brace: '600 kids' }], motion: true }, { kind: 'eq', text: '600 ÷ 10 = 60' }] },
      { title: 'Count the pizza parts', text: '3 of those 10 parts are the pizza parts. So count them up: 3 × 60 = 180. Predict that about 180 of the 600 students pick pizza.',
        beats: [
          { say: '3 of those 10 parts are the pizza parts.', pic: 0 },
          { say: 'So count them up: 3 × 60 = 180.', pic: 1 },
          { say: 'Predict that about 180 of the 600 students pick pizza.', write: 'same fraction, bigger group' },
        ],
        pictures: [{ kind: 'tape', rows: [{ label: 'School', cells: tens('60'), brace: '600 kids' }] }, { kind: 'eq', text: '3/10 of 600', lines: ['3 × 60 = 180'] }] },
      { title: 'One thing not to do', text: "Here is the mix-up almost everybody makes. Don't stop at the count in the sample. 12 was the answer for the 40 kids you asked, so you still have to scale it up to all 600.",
        beats: [
          { say: 'Here is the mix-up almost everybody makes.' },
          { say: "Don't stop at the count in the sample.", pic: 0 },
          { say: '12 was the answer for the 40 kids you asked, so you still have to scale it up to all 600.' },
        ],
        pictures: [{ kind: 'cards', wrong: '600 kids: 12 like pizza', right: '600 kids: 180 like pizza' }] },
    ],
    turn: {
      text: 'You ask 40 students, picked by chance. 10 of them walk to school. Predict how many of all 600 students walk to school.',
      picture: sampleTape(10, 40, '10 walk', '30 other', '600 students'),
      answer: 150,
      steps: ['10 out of 40 walk. 10/40 = 1/4.', 'The school has 600 students, so find 1/4 of 600.', '600 ÷ 4 = 150. So predict 150 students walk.'],
      prompt: 'Find the fraction in the sample. Then take that fraction of the whole school.',
      hint1: 'What fraction of the 40 students walk?',
      hint2: 'Now take that same fraction of 600.',
      twin: {
        text: 'At a stadium, 50 fans are picked by chance. 20 of them bought a hat. Predict how many of all 2,000 fans bought a hat.',
        picture: sampleTape(20, 50, '20 hat', '30 no hat', '2,000 fans'),
        answer: 800,
        steps: ['20 out of 50 bought a hat. 20/50 = 2/5.', 'Find 2/5 of 2,000. First 2,000 ÷ 5 = 400.', '2 × 400 = 800. So predict 800 fans bought a hat.'],
        hint1: 'What fraction of the 50 fans bought a hat?',
        hint2: 'Take that fraction of 2,000. Divide by the bottom number, then multiply by the top.',
      },
    },
    won: { text: 'You found the fraction in the sample and scaled it up to the whole school.', sticker: 'The whole group is the population. Using a sample to predict it is called making an inference.' },
    twinWon: { text: 'You found 20 out of 50, then scaled it up to all 2,000 fans.', sticker: 'The whole group is the population. Using a sample to predict it is called making an inference.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'You ask 40 students, picked by chance. 8 play an instrument. Predict how many of all 600 students play an instrument.',
        picture: sampleTape(8, 40, '8 play', '32 other', '600 students'),
        answer: 120, steps: ['8 out of 40 play. 8/40 = 1/5.', 'Find 1/5 of 600: 600 ÷ 5.', 'So predict 120 students play an instrument.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'In a sample of 30 people picked by chance, 9 have a pet cat. The town has 900 people. Predict how many have a pet cat.',
        picture: predict('Have a cat', '9/30', '900'),
        answer: 270, steps: ['9 out of 30 is 9/30 = 3/10.', '900 ÷ 10 = 90, so each 1/10 of the town is 90 people.', '3 × 90 = 270. So predict 270 people have a cat.'] } },
      { why: 'Still "scale the sample up"', problem: {
        text: 'A factory checks 50 light bulbs picked by chance. 2 do not work. Predict how many of 1,000 bulbs do not work.',
        picture: predict('Do not work', '2/50', '1,000'),
        answer: 40, steps: ['2 out of 50 is 2/50 = 1/25.', 'Find 1/25 of 1,000: 1,000 ÷ 25.', 'So predict 40 bulbs do not work.'] } },
      { why: 'A little harder', problem: {
        text: 'In a sample of 80 students picked by chance, 36 want a longer lunch. The school has 1,200 students. Predict how many want a longer lunch.',
        picture: predict('Want longer lunch', '36/80', '1,200'),
        answer: 540, steps: ['36 out of 80 is 36/80 = 9/20.', '1,200 ÷ 20 = 60, so each 1/20 of the school is 60 students.', '9 × 60 = 540. So predict 540 students.'] } },
      { why: 'Same math in a story', problem: {
        text: 'A farmer checks 25 apples picked by chance from a crate of 500. 3 of them have a bruise. Predict how many apples in the crate have a bruise.',
        picture: predict('Bruised', '3/25', '500'),
        answer: 60, steps: ['3 out of 25 have a bruise: 3/25.', '500 ÷ 25 = 20, so each 1/25 of the crate is 20 apples.', '3 × 20 = 60. So predict 60 apples have a bruise.'] } },
    ],
  },

  // ── Topic 3 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m5-t3', title: 'Compare two groups', skill: 'Compare two data sets by the gap between their means and how spread out each one is',
    bigIdea: 'To compare two groups, find the gap between their means. Then look at the spread to see if that gap is big or small.',
    screens: [
      { title: 'Which class grew taller plants?', text: 'Two classes each grew 9 bean plants. Each ✕ is one plant. Did one class grow taller plants?',
        pictures: [CLASS_A, CLASS_B] },
      { title: 'One plant does not tell you', text: 'Careful here. Class A has a plant that is only 5 inches. And Class B has one that is 7. Pick single plants and you can make either class look like the winner. We need one number that stands for a whole class.',
        beats: [
          { say: 'Careful here. Class A has a plant that is only 5 inches.', pic: 0 },
          { say: 'And Class B has one that is 7.', pic: 1 },
          { say: 'Pick single plants and you can make either class look like the winner. We need one number that stands for a whole class.', write: 'one plant is not the whole class' },
        ],
        pictures: [CLASS_A, CLASS_B] },
      { title: 'The big idea', text: 'To compare two groups, find the gap between their means. Then look at the spread to see if that gap is big or small.',
        beats: [
          { say: 'To compare two groups, find the gap between their means.', pic: 0 },
          { say: 'Then look at the spread to see if that gap is big or small.', pic: 1 },
        ],
        pictures: [CLASS_A, CLASS_B] },
      { title: 'Find each mean', text: "Let's find one number for each class. Add up Class A: 5 + 6 + 6 + 7 + 7 + 7 + 8 + 8 + 9 = 63. Class B adds up to 45. Now divide each one by its 9 plants. 63 ÷ 9 = 7 and 45 ÷ 9 = 5.",
        beats: [
          { say: "Let's find one number for each class. Add up Class A: 5 + 6 + 6 + 7 + 7 + 7 + 8 + 8 + 9 = 63.", pic: 0 },
          { say: 'Class B adds up to 45.', pic: 1 },
          { say: 'Now divide each one by its 9 plants. 63 ÷ 9 = 7 and 45 ÷ 9 = 5.', pic: 2 },
        ],
        pictures: [{ ...CLASS_A, motion: true }, { ...CLASS_B, motion: true }, { kind: 'eq', text: '63 ÷ 9 = 7', lines: ['45 ÷ 9 = 5'] }] },
      { title: 'Find the gap', text: 'So Class A sits at 7. Class B sits at 5. Take one from the other: 7 − 5 = 2. On average, Class A grew plants 2 inches taller.',
        beats: [
          { say: 'So Class A sits at 7.', pic: 0 },
          { say: 'Class B sits at 5.', pic: 1 },
          { say: 'Take one from the other: 7 − 5 = 2. On average, Class A grew plants 2 inches taller.', pic: 2 },
        ],
        pictures: [CLASS_A, CLASS_B, { kind: 'eq', text: '7 − 5 = 2' }] },
      { title: 'Is the gap big?', text: 'A gap of 2. Is that a lot? It depends on how spread out each class is. Class A runs from 5 up to 9, and Class B runs from 3 up to 7. That is a spread of 4 inches each. The gap of 2 is only half of that, so the two plots overlap a lot. Class A is a bit taller, not a lot.',
        beats: [
          { say: 'A gap of 2. Is that a lot? It depends on how spread out each class is.', pic: 0 },
          { say: 'Class A runs from 5 up to 9, and Class B runs from 3 up to 7.', pic: 1 },
          { say: 'That is a spread of 4 inches each.', pic: 2 },
          { say: 'The gap of 2 is only half of that, so the two plots overlap a lot. Class A is a bit taller, not a lot.', write: 'gap smaller than the spread → a small difference' },
        ],
        pictures: [CLASS_A, CLASS_B, { kind: 'eq', text: '9 − 5 = 4', lines: ['7 − 3 = 4'] }] },
      { title: 'One thing not to do', text: "Here is the one that catches people. Don't compare only the tallest plants. Compare the means first, then check the spread.",
        beats: [
          { say: 'Here is the one that catches people.' },
          { say: "Don't compare only the tallest plants.", pic: 0 },
          { say: 'Compare the means first, then check the spread.' },
        ],
        pictures: [{ kind: 'cards', wrong: 'Tallest: 9 beats 7', right: 'Means: 7 − 5 = 2' }] },
    ],
    turn: {
      text: 'Two classes each grew 5 plants. What is the difference between their mean heights, in inches?',
      picture: two('Plant', ['Class A', [6, 8, 7, 9, 10]], ['Class B', [4, 5, 7, 6, 3]]),
      answer: 3,
      steps: ['Class A: 6 + 8 + 7 + 9 + 10 = 40, and 40 ÷ 5 = 8.', 'Class B: 4 + 5 + 7 + 6 + 3 = 25, and 25 ÷ 5 = 5.', '8 − 5 = 3. So the difference is 3 inches.'],
      prompt: 'Find the mean of each class. Then subtract.',
      hint1: 'Find the mean of each class first.',
      hint2: 'Subtract the smaller mean from the bigger mean.',
      twin: {
        text: 'Two teams of 4 runners ran a lap. Their times are in seconds. What is the difference between the two mean times?',
        picture: two('Runner', ['Team X', [62, 58, 65, 55]], ['Team Y', [70, 66, 72, 68]]),
        answer: 9,
        steps: ['Team X: 62 + 58 + 65 + 55 = 240, and 240 ÷ 4 = 60.', 'Team Y: 70 + 66 + 72 + 68 = 276, and 276 ÷ 4 = 69.', '69 − 60 = 9. So the difference is 9 seconds.'],
        hint1: 'Add up each team, then share by the number of runners.',
        hint2: 'Subtract the smaller mean time from the bigger one.',
      },
    },
    won: { text: 'You found both means and the gap between them.', sticker: 'How far values sit from the mean, on average, is the mean absolute deviation. It measures spread.' },
    twinWon: { text: 'You found both mean lap times and the gap between them.', sticker: 'How far values sit from the mean, on average, is the mean absolute deviation. It measures spread.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'Two classes each grew 5 plants. What is the difference between their mean heights, in inches?',
        picture: two('Plant', ['Class A', [9, 11, 10, 12, 8]], ['Class B', [6, 5, 7, 4, 8]]),
        answer: 4, steps: ['Class A: 9 + 11 + 10 + 12 + 8 = 50, and 50 ÷ 5 = 10.', 'Class B: 6 + 5 + 7 + 4 + 8 = 30, and 30 ÷ 5 = 6.', '10 − 6 = 4. So the difference is 4 inches.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'Two groups of kids did push-ups. What is the difference between the mean numbers of push-ups?',
        picture: two('Kid', ['Group 1', [12, 15, 18, 15]], ['Group 2', [20, 22, 25, 25]]),
        answer: 8, steps: ['Group 1: 12 + 15 + 18 + 15 = 60, and 60 ÷ 4 = 15.', 'Group 2: 20 + 22 + 25 + 25 = 92, and 92 ÷ 4 = 23.', '23 − 15 = 8. So the difference is 8 push-ups.'] } },
      { why: 'Still "compare the middles, then the spread"', problem: {
        text: 'Both groups took a mean of 20 minutes to finish a puzzle. Which group is more spread out?',
        picture: two('Kid', ['Group A', [18, 20, 22, 20, 20]], ['Group B', [5, 35, 10, 30, 20]]),
        answer: { choices: ['Group A', 'Group B'], correct: 1 },
        steps: ['Both means are 20, so the middles are the same.', 'Group A goes from 18 to 22, a range of 4. Group B goes from 5 to 35, a range of 30.', 'So Group B is more spread out.'] } },
      { why: 'A little harder', problem: {
        text: 'Two groups of kids wrote down how many hours they read in a month. What is the difference between the two medians?',
        picture: two('Kid', ['Group A', [14, 9, 21, 12, 17, 10]], ['Group B', [22, 16, 25, 19, 30, 18]]),
        answer: 7.5, steps: ['Group A sorted: 9, 10, 12, 14, 17, 21. The median is (12 + 14) ÷ 2 = 13.', 'Group B sorted: 16, 18, 19, 22, 25, 30. The median is (19 + 22) ÷ 2 = 20.5.', '20.5 − 13 = 7.5. So the difference is 7.5 hours.'] } },
      { why: 'Same math in a story', problem: {
        text: 'Maya grew 5 pepper plants with plant food and 5 without. Their heights are in inches. How much taller are the plants with plant food, comparing the means?',
        picture: two('Plant', ['With food', [14, 16, 17, 13, 15]], ['Without', [9, 10, 8, 11, 7]]),
        answer: 6, steps: ['With food: 14 + 16 + 17 + 13 + 15 = 75, and 75 ÷ 5 = 15.', 'Without: 9 + 10 + 8 + 11 + 7 = 45, and 45 ÷ 5 = 9.', '15 − 9 = 6. So they are 6 inches taller on average.'] } },
    ],
  },

  // ── Topic 4 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m5-t4', title: 'Probability of an event', skill: 'Write the probability of an event as a fraction or a decimal from 0 to 1',
    bigIdea: "The chance of something is the ways it can happen over all the equal ways, a number from 0 to 1.",
    screens: [
      { title: 'Spin to win', text: 'This spinner has 10 equal parts. You win if it lands on blue. What is your chance, as a fraction and as a decimal?',
        pictures: [WIN] },
      { title: "Four colors does not mean 1/4", text: "There are four colors here. So is the chance of blue 1 out of 4? Blue covers 4 parts. Yellow covers only 1. The colors are not the same size, so count the parts, not the colors.",
        beats: [
          { say: "There are four colors here. So is the chance of blue 1 out of 4?", pic: 0 },
          { say: "Blue covers 4 parts. Yellow covers only 1." },
          { say: "The colors are not the same size, so count the parts, not the colors." },
        ],
        pictures: [WIN] },
      { title: "The big idea", text: "The chance of something is the ways it can happen over all the equal ways, a number from 0 to 1.",
        beats: [
          { say: "The chance of something is the ways it can happen over all the equal ways, a number from 0 to 1.", pic: 0 },
        ],
        pictures: [WIN] },
      { title: "Count the ways", text: "Count the blue parts with me. 1, 2, 3, 4. Now count every part. There are 10, all the same size. So blue is 4 ways out of 10 equal ways. That's 4/10.",
        beats: [
          { say: "Count the blue parts with me. 1, 2, 3, 4.", pic: 0 },
          { say: "Now count every part. There are 10, all the same size.", pic: 1 },
          { say: "So blue is 4 ways out of 10 equal ways. That's 4/10.", pic: 2 },
        ],
        pictures: [WIN, WIN_COUNTS(true), { kind: 'eq', text: '4/10' }] },
      { title: "Write it as a decimal", text: "4/10 is four tenths. How do we write four tenths as a decimal? A 4 in the tenths place, 0.4. 4/10 and 0.4 are the same chance, just written two ways.",
        beats: [
          { say: "4/10 is four tenths.", pic: 0 },
          { say: "How do we write four tenths as a decimal? A 4 in the tenths place, 0.4.", pic: 1 },
          { say: "4/10 and 0.4 are the same chance, just written two ways." },
        ],
        pictures: [WIN, { kind: 'eq', text: '4/10 = 0.4' }] },
      { title: "And not blue?", text: "What about not blue? That's the other 6 parts. 6 out of 10 is 6/10, or 0.6. Add them, and 0.4 + 0.6 = 1, because the spinner always lands somewhere. And purple? There is no purple, so its chance is 0.",
        beats: [
          { say: "What about not blue? That's the other 6 parts.", pic: 0 },
          { say: "6 out of 10 is 6/10, or 0.6.", pic: 1 },
          { say: "Add them, and 0.4 + 0.6 = 1, because the spinner always lands somewhere.", pic: 2 },
          { say: "And purple? There is no purple, so its chance is 0." },
        ],
        pictures: [WIN, { kind: 'table', head: ['blue', 'not blue'], rows: [['0.4', '0.6']], motion: true }, { kind: 'eq', text: '0.4 + 0.6 = 1' }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't put the blue parts over the parts that are NOT blue. That gives 4/6. Blue goes over all 10 parts, so it's 4/10, or 0.4. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't put the blue parts over the parts that are NOT blue. That gives 4/6.", pic: 0 },
          { say: "Blue goes over all 10 parts, so it's 4/10, or 0.4." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '4/6', right: '4/10 = 0.4' }] },
    ],
    turn: {
      text: 'This spinner has 10 equal parts. What is the probability of landing on green? Write a fraction or a decimal.',
      picture: spin(['green', 'red', 'blue', 'green', 'yellow', 'blue', 'red', 'green', 'blue', 'red']),
      answer: { frac: [3, 10] },
      steps: ['Count the green parts: there are 3.', 'Count all the parts: there are 10.', 'So the probability is 3/10, or 0.3.'],
      prompt: 'Ways it can happen on top. All the equal ways on the bottom.',
      hint1: 'How many parts are green?',
      hint2: 'Put the green parts over every part of the spinner.',
      twin: {
        text: 'This spinner has 5 equal parts. What is the probability of landing on red? Write a fraction or a decimal.',
        picture: spin(['red', 'blue', 'red', 'yellow', 'green']),
        answer: { frac: [2, 5] },
        steps: ['Count the red parts: there are 2.', 'Count all the parts: there are 5.', 'So the probability is 2/5, or 0.4.'],
        hint1: 'How many parts are red?',
        hint2: 'Put the red parts over every part of the spinner.',
      },
    },
    won: { text: 'You put the ways it can happen over all the equal ways.', sticker: 'Something that can happen, like landing on green, is an event. Its probability is always from 0 to 1.' },
    twinWon: { text: 'You put the red parts over all 5 parts.', sticker: 'Something that can happen, like landing on red, is an event. Its probability is always from 0 to 1.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'This spinner has 4 equal parts. What is the probability of landing on blue?',
        picture: spin(['blue', 'red', 'blue', 'blue']),
        answer: { frac: [3, 4] }, steps: ['There are 3 blue parts.', 'There are 4 parts in all.', 'So the probability is 3/4, or 0.75.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'A bag has 5 red, 7 blue and 8 green marbles. You pick one without looking. What is the probability it is green?',
        picture: { kind: 'table', head: ['red', 'blue', 'green'], rows: [['5', '7', '8']] },
        answer: { frac: [2, 5] }, steps: ['There are 8 green marbles.', 'There are 5 + 7 + 8 = 20 marbles in all.', 'So the probability is 8/20 = 2/5, or 0.4.'] } },
      { why: 'Still "ways over all the ways"', problem: {
        text: 'This spinner has 8 equal parts numbered 1 to 8. What is the probability of NOT landing on 8?',
        picture: { kind: 'spinner', parts: ['1', '2', '3', '4', '5', '6', '7', '8'] },
        answer: { frac: [7, 8] }, steps: ['Landing on 8 is 1 part out of 8.', 'Every other part is not 8: 8 − 1 = 7 parts.', 'So the probability is 7/8, or 0.875.'] } },
      { why: 'A little harder', problem: {
        text: 'A bag has 12 tiles, and 3 of them have a star. You pick one without looking. What is the probability of NOT getting a star? Write it as a decimal.',
        picture: { kind: 'table', head: ['Tiles with a star', 'All tiles'], rows: [['3', '12']] },
        answer: 0.75, steps: ['3 of the 12 tiles have a star, so 9 do not.', 'The probability of no star is 9/12 = 3/4.', 'As a decimal, 3/4 = 0.75.'] } },
      { why: 'Same math in a story', problem: {
        text: 'A class raffle has 25 tickets. Leo bought 4 of them. One ticket is drawn. What is the probability Leo wins? Write it as a decimal.',
        picture: { kind: 'table', head: ["Leo's tickets", 'All tickets'], rows: [['4', '25']] },
        answer: 0.16, steps: ['Leo has 4 of the tickets.', 'There are 25 tickets in all, so the probability is 4/25.', '4/25 = 16/100 = 0.16.'] } },
    ],
  },

  // ── Topic 5 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m5-t5', title: 'Expected and actual results', skill: 'Find an expected count as probability × number of tries, and compare it with real results',
    bigIdea: "The number you expect is the chance times the number of tries, and real results land near it, not always on it.",
    screens: [
      { title: 'Flip a coin 50 times', text: 'A class flipped a coin 50 times and got 27 heads. How many heads should they expect? Did something go wrong?',
        pictures: [flips(27, 23, 5)] },
      { title: "Guessing is not enough", text: "One kid guessed 40 heads. Another guessed 10. Which guess is right? A guess could be anything at all. What we want is a number that comes from the coin itself.",
        beats: [
          { say: "One kid guessed 40 heads. Another guessed 10.", pic: 0 },
          { say: "Which guess is right? A guess could be anything at all." },
          { say: "What we want is a number that comes from the coin itself." },
        ],
        pictures: [flips(27, 23, 5)] },
      { title: "The big idea", text: "The number you expect is the chance times the number of tries, and real results land near it, not always on it.",
        beats: [
          { say: "The number you expect is the chance times the number of tries, and real results land near it, not always on it.", pic: 0 },
        ],
        pictures: [flips(27, 23, 5)] },
      { title: "Find the expected count", text: "On each flip, heads has a chance of 1/2. Multiply that chance by the 50 tries. 1/2 × 50 = 25. So we expect 25 heads, and 25 tails.",
        beats: [
          { say: "On each flip, heads has a chance of 1/2." },
          { say: "Multiply that chance by the 50 tries. 1/2 × 50 = 25.", pic: 1 },
          { say: "So we expect 25 heads, and 25 tails.", pic: 0 },
        ],
        pictures: [flips(25, 25, 5, true), { kind: 'eq', text: '1/2 × 50 = 25' }] },
      { title: "The real results", text: "Here is what the class really got. 27 heads, and 23 tails. Is 27 close to 25? Yes, just 2 more. Every flip starts fresh, so real results wander a little.",
        beats: [
          { say: "Here is what the class really got. 27 heads, and 23 tails.", pic: 0 },
          { say: "Is 27 close to 25? Yes, just 2 more.", pic: 1 },
          { say: "Every flip starts fresh, so real results wander a little." },
        ],
        pictures: [flips(27, 23, 5, true), { kind: 'eq', text: 'expected 25', lines: ['real 27'] }] },
      { title: "More flips, closer", text: "Another class flipped 500 times and got 246 heads. 27 out of 50 is 0.54. 246 out of 500 is 0.492. Which one is closer to one half, 0.5? The 500 flips. The more tries you take, the closer you get to the chance.",
        beats: [
          { say: "Another class flipped 500 times and got 246 heads.", pic: 0 },
          { say: "27 out of 50 is 0.54. 246 out of 500 is 0.492.", pic: 1 },
          { say: "Which one is closer to one half, 0.5? The 500 flips." },
          { say: "The more tries you take, the closer you get to the chance." },
        ],
        pictures: [flips(246, 254, 50), { kind: 'eq', text: '27/50 = 0.54', lines: ['246/500 = 0.492'] }] },
      { title: "One thing not to do", text: "Here's the part people mix up. The real count does NOT have to equal the expected count. 27 heads is not a mistake, and the coin is not broken. Close to 25 is just what real results do. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "The real count does NOT have to equal the expected count.", pic: 0 },
          { say: "27 heads is not a mistake, and the coin is not broken. Close to 25 is just what real results do." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '27 heads → the coin is broken', right: '27 heads → close to 25' }] },
    ],
    turn: {
      text: 'You roll a number cube 60 times. How many times do you expect to roll a 4?',
      picture: tries('60', '1/6', 'Rolls'),
      answer: 10,
      steps: ['A cube has 6 sides, so the chance of a 4 is 1/6.', 'Expected count = 1/6 × 60.', '60 ÷ 6 = 10. So expect 10 fours.'],
      prompt: 'Find the chance on one roll. Multiply it by the number of rolls.',
      hint1: 'What is the chance of rolling a 4 on one roll?',
      hint2: 'Multiply that chance by the 60 rolls.',
      twin: {
        text: 'A spinner has 4 equal parts, and 1 part is red. You spin it 80 times. How many times do you expect red?',
        picture: tries('80', '1/4', 'Spins'),
        answer: 20,
        steps: ['1 of the 4 parts is red, so the chance is 1/4.', 'Expected count = 1/4 × 80.', '80 ÷ 4 = 20. So expect red 20 times.'],
        hint1: 'What fraction of the spinner is red?',
        hint2: 'Multiply that fraction by the number of spins.',
      },
    },
    won: { text: 'You multiplied the chance by the number of tries.', sticker: 'A chance found from real tries is an experimental probability. A chance found by counting equal ways is a theoretical probability.' },
    twinWon: { text: 'You multiplied 1/4 by 80 spins to find what to expect.', sticker: 'A chance found from real tries is an experimental probability. A chance found by counting equal ways is a theoretical probability.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'You flip a coin 40 times. How many heads do you expect?',
        picture: tries('40', '1/2', 'Flips'),
        answer: 20, steps: ['The chance of heads is 1/2.', 'Expected count = 1/2 × 40 = 40 ÷ 2.', 'So expect 20 heads.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'You roll a number cube 90 times. How many times do you expect to roll a 6?',
        picture: tries('90', '1/6', 'Rolls'),
        answer: 15, steps: ['The chance of a 6 is 1/6.', 'Expected count = 1/6 × 90 = 90 ÷ 6.', 'So expect 15 sixes.'] } },
      { why: 'Still "real results land near"', problem: {
        text: 'A coin was flipped 50 times and landed heads 28 times. What part of the flips were heads? Write it as a decimal.',
        picture: { kind: 'table', head: ['Heads', 'Tails'], rows: [['28', '22']] },
        answer: 0.56, steps: ['28 of the 50 flips were heads: 28/50.', '28/50 = 56/100.', 'So 0.56 of the flips were heads, close to the expected 0.5.'] } },
      { why: 'A little harder', problem: {
        text: 'A spinner has 5 equal parts, and 2 are blue. You spin 120 times and get blue 53 times. How many more blue spins did you get than expected?',
        picture: { kind: 'table', head: ['Spins', 'Blue parts', 'All parts', 'Blue spins you got'], rows: [['120', '2', '5', '53']] },
        answer: 5, steps: ['The chance of blue is 2/5.', 'Expected: 2/5 × 120 = 48 blue spins.', 'You got 53, and 53 − 48 = 5. So 5 more than expected.'] } },
      { why: 'Same math in a story', problem: {
        text: 'At a fair game, the chance of winning is 1/5. 250 people play today. How many winners should the fair expect?',
        picture: tries('250', '1/5', 'Players'),
        answer: 50, steps: ['The chance of winning is 1/5.', 'Expected count = 1/5 × 250 = 250 ÷ 5.', 'So the fair should expect 50 winners.'] } },
    ],
  },

  // ── Topic 6 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m5-t6', title: 'Two things happening', skill: 'List every outcome of two events in a table and find the probability of both happening',
    bigIdea: "To find the chance of two things together, list every pair in a table and count the pairs you want over all the pairs.",
    screens: [
      { title: 'Flip and roll', text: 'You flip a coin and roll a number cube. What is the chance of getting heads AND a 5?',
        pictures: [COIN_DIE] },
      { title: "Adding the chances does not work", text: "Heads is 1/2. A 5 is 1/6. So do we just add them? 1/2 + 1/6 = 4/6. That's bigger than either chance on its own. But getting both at once should be harder than getting one, not easier.",
        beats: [
          { say: "Heads is 1/2. A 5 is 1/6. So do we just add them?" },
          { say: "1/2 + 1/6 = 4/6. That's bigger than either chance on its own.", pic: 1 },
          { say: "But getting both at once should be harder than getting one, not easier." },
        ],
        pictures: [COIN_DIE, { kind: 'eq', text: '1/2 + 1/6 = 4/6' }] },
      { title: "The big idea", text: "To find the chance of two things together, list every pair in a table and count the pairs you want over all the pairs.",
        beats: [
          { say: "To find the chance of two things together, list every pair in a table and count the pairs you want over all the pairs.", pic: 0 },
        ],
        pictures: [COIN_DIE] },
      { title: "Fill in every pair", text: "Let's build the table. The rows are the coin, heads or tails. The columns are the cube, 1 through 6. Every box is one way the two can land together. H1, H2, all the way to T6.",
        beats: [
          { say: "Let's build the table. The rows are the coin, heads or tails.", pic: 0 },
          { say: "The columns are the cube, 1 through 6." },
          { say: "Every box is one way the two can land together. H1, H2, all the way to T6." },
        ],
        pictures: [COIN_DIE_FULL(undefined, true)] },
      { title: "Count all the pairs", text: "How many boxes are there? 2 rows × 6 columns = 12. So there are 12 pairs, each one just as likely.",
        beats: [
          { say: "How many boxes are there?", pic: 0 },
          { say: "2 rows × 6 columns = 12.", pic: 1 },
          { say: "So there are 12 pairs, each one just as likely." },
        ],
        pictures: [COIN_DIE_FULL(), { kind: 'eq', text: '2 × 6 = 12' }] },
      { title: "Find the pair you want", text: "Now find the one we wanted, heads and a 5. It's a single box, H5, in the heads row. One box out of 12, so the chance is 1/12. That's smaller than 1/2, and smaller than 1/6, just as it should be.",
        beats: [
          { say: "Now find the one we wanted, heads and a 5.", pic: 0 },
          { say: "It's a single box, H5, in the heads row." },
          { say: "One box out of 12, so the chance is 1/12.", pic: 1 },
          { say: "That's smaller than 1/2, and smaller than 1/6, just as it should be." },
        ],
        pictures: [COIN_DIE_FULL([[0, 5]], true), { kind: 'eq', text: '1/12' }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't ADD the two chances together. Make the table, then count the pairs you want over all the pairs. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't ADD the two chances together.", pic: 0 },
          { say: "Make the table, then count the pairs you want over all the pairs." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '1/2 + 1/6 = 4/6', right: '1 pair out of 12 = 1/12' }] },
    ],
    turn: {
      text: 'You flip a coin and roll a number cube. What is the probability of tails and an even number?',
      picture: COIN_DIE,
      answer: { frac: [1, 4] },
      steps: ['The table has 2 × 6 = 12 pairs.', 'Tails and an even number: T2, T4 and T6. That is 3 pairs.', 'So the probability is 3/12 = 1/4.'],
      prompt: 'Fill in the table. Count the pairs you want over all the pairs.',
      hint1: 'How many boxes does the whole table have?',
      hint2: 'Look in the tails row. Which boxes have an even number?',
      twin: {
        text: 'You spin a spinner with 3 equal parts (red, blue and green) and flip a coin. What is the probability of blue and heads?',
        picture: blank(['Red', 'Blue', 'Green'], ['Heads', 'Tails']),
        answer: { frac: [1, 6] },
        steps: ['The table has 2 × 3 = 6 pairs.', 'Blue and heads is just one box.', 'So the probability is 1/6.'],
        hint1: 'How many boxes does the table have?',
        hint2: 'How many of those boxes are blue with heads?',
      },
    },
    won: { text: 'You listed every pair, then counted the ones you wanted.', sticker: 'The list of all outcomes is the sample space. Two things happening together is a compound event.' },
    twinWon: { text: 'You found the one blue-and-heads box among all the pairs.', sticker: 'The list of all outcomes is the sample space. Two things happening together is a compound event.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'You flip a coin and roll a number cube. What is the probability of heads and a 2?',
        picture: COIN_DIE,
        answer: { frac: [1, 12] }, steps: ['The table has 2 × 6 = 12 pairs.', 'Heads and a 2 is one box: H2.', 'So the probability is 1/12.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'You flip two coins. What is the probability both land heads?',
        picture: blank(['Heads', 'Tails'], ['Heads', 'Tails']),
        answer: { frac: [1, 4] }, steps: ['The table has 2 × 2 = 4 pairs.', 'Both heads is one box.', 'So the probability is 1/4.'] } },
      { why: 'Still "count the pairs"', problem: {
        text: 'A lunch has one sandwich (turkey or cheese) and one fruit (apple, banana, grapes or orange). How many different lunches are there?',
        picture: blank(['Apple', 'Banana', 'Grapes', 'Orange'], ['Turkey', 'Cheese']),
        answer: 8, steps: ['Each row is a sandwich and each column is a fruit.', 'There are 2 rows and 4 columns.', '2 × 4 = 8. So there are 8 different lunches.'] } },
      { why: 'A little harder', problem: {
        text: 'You roll two number cubes. What is the probability that the two numbers add up to 7?',
        picture: blank(DIE, DIE),
        answer: { frac: [1, 6] }, steps: ['The table has 6 × 6 = 36 pairs.', 'Pairs that add to 7: 1 and 6, 2 and 5, 3 and 4, 4 and 3, 5 and 2, 6 and 1. That is 6 pairs.', 'So the probability is 6/36 = 1/6.'] } },
      { why: 'Same math in a story', problem: {
        text: 'Mia grabs a shirt (red, blue, white or green) and a cap (black or gray) without looking. What is the probability she gets a blue or green shirt with a black cap?',
        picture: blank(['Black', 'Gray'], ['Red', 'Blue', 'White', 'Green']),
        answer: { frac: [1, 4] }, steps: ['The table has 4 × 2 = 8 pairs.', 'Blue with black and green with black: 2 pairs.', 'So the probability is 2/8 = 1/4.'] } },
    ],
  },
]

attachChalk(G7M5, G7M5_CHALK)
