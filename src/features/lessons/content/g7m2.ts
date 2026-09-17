/**
 * Grade 7 · Module 2 — Operations with rational numbers.
 * Written to docs/new-flow/AUTHORING.md. Negative numbers were not taught in Grade 6 of this curriculum, so t1 starts
 * from "left of 0" and every later topic leans on the number line from t1–t2.
 * Teaching pictures: `numline` (t1, t2, t4, t7), `chips` (t3), `table` (t5, t6), `measure` thermometer (t8).
 * ⚠️ A negative FRACTION answer is shown by the app as "-1/4" with an ASCII hyphen, so t7 keeps its fraction answers
 * positive and writes its negative answers as decimals (shown "−2.25").
 */
import type { Lesson, Picture } from '../script'

const m = (v: number) => String(v).replace('-', '−')
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
type Pt = { at: number; label?: string }
type Jump = { from: number; to: number; label?: string }

/** A whole-number line from min to max, every tick labelled (teaching screens). */
const line = (min: number, max: number, points?: Pt[], jumps?: Jump[], motion = false): Picture =>
  ({ kind: 'numline', min, max, ticks: max - min, points, jumps, motion })
/** A question line: only the two ends and 0 are labelled, so no tick can read the answer. */
const qline = (min: number, max: number, points?: Pt[]): Picture =>
  ({ kind: 'numline', min, max, ticks: max - min, points,
    labels: Array.from({ length: max - min + 1 }, (_, i) => { const v = min + i; return v === min || v === max || v === 0 ? m(v) : null }) })

/** t7: the line from −1 to 1 in fourths. */
const FOURTHS = ['−1', '−3/4', '−1/2', '−1/4', '0', '1/4', '1/2', '3/4', '1']
const fourths = (points?: Pt[], jumps?: Jump[], motion = false): Picture => ({ kind: 'numline', min: -1, max: 1, ticks: 8, labels: FOURTHS, points, jumps, motion })
const qfourths = (points: Pt[]): Picture =>
  ({ kind: 'numline', min: -1, max: 1, ticks: 8, labels: ['−1', null, null, null, '0', null, null, null, '1'], points })

const chips = (pos: number, neg: number, pairs?: number, motion = false): Picture => ({ kind: 'chips', pos, neg, pairs, motion })

const SIGNS: Picture = { kind: 'table', head: ['Signs', 'Answer'], rows: [['+ and +', '+'], ['− and −', '+'], ['+ and −', '−'], ['− and +', '−']] }

const thermo = (value: number | null, min = -10, max = 10, labelEvery = 10): Picture =>
  ({ kind: 'measure', tool: 'thermometer', min, max, step: 1, labelEvery, value, unit: '°C' })
const change = (rows: string[][], motion = false): Picture => ({ kind: 'table', head: ['Start', 'Change', 'Now'], rows, motion })

export const G7M2: Lesson[] = [
  // ── Topic 1 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m2-t1', title: 'Opposites', skill: 'Find the opposite of a number: the same distance from 0 on the other side',
    bigIdea: 'Opposites are the same distance from 0, on different sides. Change the sign and you get the opposite.',
    screens: [
      { title: 'Above and below the water', text: 'A bird flies 4 feet above the water. A fish swims 4 feet below it. How can numbers show where each one is?',
        pictures: [line(-10, 10, [{ at: 4, label: 'bird' }, { at: -4, label: 'fish' }])] },
      { title: '4 is not enough', text: 'Both of them are 4 feet from the water. So if you write 4 for the bird and 4 for the fish, look what happens. You cannot tell which one is up in the air and which one is down in the water.',
        beats: [
          { say: 'Both of them are 4 feet from the water.', pic: 0, effect: 'draw' },
          { say: 'So if you write 4 for the bird and 4 for the fish, look what happens.' },
          { say: 'You cannot tell which one is up in the air and which one is down in the water.', write: 'we need a way to show below 0' },
        ],
        pictures: [line(-10, 10, [{ at: 4, label: '4' }, { at: -4, label: '4?' }])] },
      { title: 'The big idea', text: 'Opposites are the same distance from 0, on different sides. Change the sign and you get the opposite.',
        beats: [
          { say: 'Opposites are the same distance from 0, on different sides.', pic: 0, effect: 'draw' },
          { say: 'Change the sign and you get the opposite.' },
        ],
        pictures: [line(-10, 10, [{ at: 4, label: '4' }, { at: -4, label: '−4' }])] },
      { title: 'Count from 0', text: 'The water level is 0 on this line. Now count with me from 0 out to the bird. That is 4 steps to the right, so the bird is at 4.',
        beats: [
          { say: 'The water level is 0 on this line.', pic: 0, effect: 'draw' },
          { say: 'Now count with me from 0 out to the bird.' },
          { say: 'That is 4 steps to the right, so the bird is at 4.', write: 'bird: 4' },
        ],
        pictures: [line(-10, 10, [{ at: 4, label: '4' }], [{ from: 0, to: 4, label: '4 steps' }], true)] },
      { title: 'Same distance, other side', text: 'Now the fish. It is 4 steps from 0 as well, but the other way, to the LEFT. And left of 0 is where we put a minus sign. So the fish is at −4.',
        beats: [
          { say: 'Now the fish. It is 4 steps from 0 as well, but the other way, to the LEFT.', pic: 0, effect: 'draw' },
          { say: 'And left of 0 is where we put a minus sign.', write: 'left of 0 → minus sign' },
          { say: 'So the fish is at −4.' },
        ],
        pictures: [line(-10, 10, [{ at: 4, label: '4' }, { at: -4, label: '−4' }], [{ from: 0, to: 4, label: '4 steps' }, { from: 0, to: -4, label: '4 steps' }], true)] },
      { title: 'Opposites come in pairs', text: 'So 4 and −4 are a pair of opposites. It works for every number. Here are 7 and −7. The opposite of 7 is −7, and the opposite of −7 is 7. You just flip the sign.',
        beats: [
          { say: 'So 4 and −4 are a pair of opposites.' },
          { say: 'It works for every number. Here are 7 and −7.', pic: 0, effect: 'draw' },
          { say: 'The opposite of 7 is −7, and the opposite of −7 is 7. You just flip the sign.', pic: 1 },
        ],
        pictures: [line(-10, 10, [{ at: 7, label: '7' }, { at: -7, label: '−7' }]), eq('opposite of 7 → −7', ['opposite of −7 → 7'])] },
      { title: 'One thing not to do', text: "Here is the slip to watch for. Don't leave the minus sign where it is. The opposite of a number that sits left of 0 has to end up right of 0.",
        beats: [
          { say: 'Here is the slip to watch for.' },
          { say: "Don't leave the minus sign where it is.", pic: 0 },
          { say: 'The opposite of a number that sits left of 0 has to end up right of 0.' },
        ],
        pictures: [{ kind: 'cards', wrong: 'opposite of −6 → −6', right: 'opposite of −6 → 6' }] },
    ],
    turn: {
      text: 'What is the opposite of −6?', picture: qline(-10, 10, [{ at: -6, label: '−6' }]),
      answer: 6, steps: ['−6 is 6 steps to the left of 0.', 'The opposite is the same number of steps to the right of 0.', 'So the opposite of −6 is 6.'],
      prompt: 'Count the steps from 0. Go the same distance on the other side.',
      hint1: 'Which side of 0 is −6 on? Its opposite is on the other side.',
      hint2: 'Count the steps from −6 to 0. Go that many steps right of 0.',
      twin: { text: 'What is the opposite of 9?', picture: qline(-10, 10, [{ at: 9, label: '9' }]),
        answer: -9, steps: ['9 is 9 steps to the right of 0.', 'The opposite is the same number of steps to the left of 0.', 'So the opposite of 9 is −9.'],
        hint1: 'Opposites sit on different sides of 0. Which side will this one be on?',
        hint2: 'Left of 0 gets a minus sign. How far from 0 is the point?' },
    },
    won: { text: 'You went the same distance from 0, on the other side.', sticker: 'Whole numbers and their opposites are called integers.' },
    twinWon: { text: 'You found that the opposite of 9 is −9.', sticker: 'Whole numbers and their opposites are called integers.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'What is the opposite of −3?', picture: qline(-10, 10, [{ at: -3, label: '−3' }]),
        answer: 3, steps: ['−3 is 3 steps left of 0.', 'Go 3 steps right of 0 instead.', 'So the opposite of −3 is 3.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'What is the opposite of 8?', picture: qline(-10, 10, [{ at: 8, label: '8' }]),
        answer: -8, steps: ['8 is 8 steps right of 0.', 'Go 8 steps left of 0 instead.', 'So the opposite of 8 is −8.'] } },
      { why: 'Still "same distance, other side"', problem: { text: 'The opposite of a number is −2. What is the number?', picture: qline(-10, 10, [{ at: -2, label: '−2' }]),
        answer: 2, steps: ['Opposites are the same distance from 0, on different sides.', '−2 is 2 steps left of 0, so the number is 2 steps right of 0.', 'So the number is 2.'] } },
      { why: 'A little harder', problem: { text: 'What is the opposite of the opposite of −5?', picture: qline(-10, 10),
        answer: -5, steps: ['The opposite of −5 is 5.', 'The opposite of 5 is −5. Two flips bring you back.', 'So the answer is −5.'] } },
      { why: 'Same math in a story', problem: { text: 'A submarine is 8 meters below the sea, at −8. A bird is the same distance above the sea. What number shows where the bird is?',
        picture: qline(-10, 10, [{ at: -8, label: 'submarine' }]),
        answer: 8, steps: ['The sea is 0. The submarine is 8 steps below it.', 'The bird is the same distance on the other side of 0.', 'So the bird is at 8.'] } },
    ],
  },

  // ── Topic 2 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m2-t2', title: 'Absolute value', skill: 'Find how far a number is from 0, which is never negative',
    bigIdea: 'How far a number is from 0 is never negative. Count the steps to 0 and drop the sign.',
    screens: [
      { title: 'Two walks', text: 'Home is at 0. Ana walks 5 blocks east, to 5. Ben walks 5 blocks west, to −5. Who walked farther?',
        pictures: [line(-10, 10, [{ at: 5, label: 'Ana' }, { at: -5, label: 'Ben' }])] },
      { title: 'The minus sign is not the distance', text: 'Ben ended up at −5. But hold on. He did not walk −5 blocks. Nobody can walk a negative number of blocks. The minus sign tells you which way he went, not how far.',
        beats: [
          { say: 'Ben ended up at −5. But hold on.', pic: 0, effect: 'draw' },
          { say: 'He did not walk −5 blocks. Nobody can walk a negative number of blocks.' },
          { say: 'The minus sign tells you which way he went, not how far.', write: 'minus = which way, not how far' },
        ],
        pictures: [line(-10, 10, [{ at: 5, label: 'Ana' }, { at: -5, label: 'Ben' }])] },
      { title: 'The big idea', text: 'How far a number is from 0 is never negative. Count the steps to 0 and drop the sign.',
        beats: [
          { say: 'How far a number is from 0 is never negative.', pic: 0, effect: 'draw' },
          { say: 'Count the steps to 0 and drop the sign.' },
        ],
        pictures: [line(-10, 10, [{ at: -5, label: '−5' }], [{ from: -5, to: 0, label: '5 steps' }])] },
      { title: 'Count the steps', text: "Let's count. Put your finger on −5 and walk it up to 0. 1, 2, 3, 4, 5. So −5 sits 5 steps away from 0.",
        beats: [
          { say: "Let's count. Put your finger on −5 and walk it up to 0.", pic: 0, effect: 'draw' },
          { say: '1, 2, 3, 4, 5.' },
          { say: 'So −5 sits 5 steps away from 0.', write: 'Ben: 5 blocks' },
        ],
        pictures: [line(-10, 10, [{ at: -5, label: '−5' }], [{ from: -5, to: 0, label: '5 steps' }], true)] },
      { title: 'Both are 5 away', text: "Now Ana's side. From 5 back down to 0 is 5 steps as well. So they both walked exactly the same distance: 5 blocks each.",
        beats: [
          { say: "Now Ana's side. From 5 back down to 0 is 5 steps as well.", pic: 0, effect: 'draw' },
          { say: 'So they both walked exactly the same distance: 5 blocks each.', write: 'Ana: 5 blocks' },
        ],
        pictures: [line(-10, 10, [{ at: 5, label: '5' }, { at: -5, label: '−5' }], [{ from: -5, to: 0, label: '5 steps' }, { from: 5, to: 0, label: '5 steps' }], true)] },
      { title: 'Write it with bars', text: 'Math has a short way to ask this. Two bars around a number mean "how far is this from 0". So the bars turn −5 into 5, and 5 stays 5. Only 0 is 0 steps away from itself.',
        beats: [
          { say: 'Math has a short way to ask this.' },
          { say: 'Two bars around a number mean "how far is this from 0".', write: '| | = how far from 0' },
          { say: 'So the bars turn −5 into 5, and 5 stays 5. Only 0 is 0 steps away from itself.', pic: 0 },
        ],
        pictures: [eq('|−5| = 5', ['|5| = 5', '|0| = 0'])] },
      { title: 'One thing not to do', text: "Here is the trap. Don't let the minus sign survive the bars. A distance is never negative, no matter what went in.",
        beats: [
          { say: 'Here is the trap.' },
          { say: "Don't let the minus sign survive the bars.", pic: 0 },
          { say: 'A distance is never negative, no matter what went in.' },
        ],
        pictures: [{ kind: 'cards', wrong: '|−5| = −5', right: '|−5| = 5' }] },
    ],
    turn: {
      text: 'What is |−8|?', picture: qline(-10, 10, [{ at: -8, label: '−8' }]),
      answer: 8, steps: ['The bars ask how far −8 is from 0.', 'Count the steps from −8 to 0: there are 8.', 'So |−8| = 8.'],
      prompt: 'Count the steps from the number to 0. Drop the sign.',
      hint1: 'The bars ask: how far is −8 from 0?',
      hint2: 'Count the steps from the point to 0. Can a distance be negative?',
      twin: { text: 'What is |−3|?', picture: qline(-10, 10, [{ at: -3, label: '−3' }]),
        answer: 3, steps: ['The bars ask how far −3 is from 0.', 'Count the steps from −3 to 0: there are 3.', 'So |−3| = 3.'],
        hint1: 'How far is −3 from 0?',
        hint2: 'Count the steps from the point back to 0, and drop the minus sign.' },
    },
    won: { text: 'You counted the steps to 0 and dropped the sign.', sticker: 'How far a number is from zero is called its absolute value. It is written with two bars.' },
    twinWon: { text: 'You counted 3 steps from −3 to zero.', sticker: 'How far a number is from zero is called its absolute value. It is written with two bars.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'What is |−6|?', picture: qline(-10, 10, [{ at: -6, label: '−6' }]),
        answer: 6, steps: ['Count the steps from −6 to 0.', 'There are 6 steps, and a distance has no minus sign.', 'So |−6| = 6.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'What is |9|?', picture: qline(-10, 10, [{ at: 9, label: '9' }]),
        answer: 9, steps: ['Count the steps from 9 to 0.', 'There are 9 steps.', 'So |9| = 9.'] } },
      { why: 'Still "count the steps to 0"', problem: { text: 'Which number is farther from 0: −7 or 4?',
        picture: qline(-10, 10, [{ at: -7, label: '−7' }, { at: 4, label: '4' }]),
        answer: { choices: ['−7', '4'], correct: 0 }, steps: ['−7 is 7 steps from 0.', '4 is 4 steps from 0, and 7 steps is farther.', 'So −7 is farther from 0.'] } },
      { why: 'A little harder', problem: { text: 'Work it out. |−12| − |5| = ?', picture: eq('|−12| − |5| = ?'),
        answer: 7, steps: ['|−12| = 12, because −12 is 12 steps from 0.', '|5| = 5.', 'So 12 − 5 = 7.'] } },
      { why: 'Same math in a story', problem: { text: 'The surface of a lake is 0. A diver is at −9 meters. How many meters is she from the surface?',
        picture: qline(-10, 10, [{ at: -9, label: 'diver' }]),
        answer: 9, steps: ['Her distance from the surface is |−9|.', 'From −9 up to 0 is 9 steps.', 'So she is 9 meters from the surface.'] } },
    ],
  },

  // ── Topic 3 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m2-t3', title: 'Add positive and negative numbers', skill: 'Add integers with plus and minus counters by cancelling pairs',
    bigIdea: 'A plus and a minus cancel out to 0. Pair them up, take the pairs away, and count what is left.',
    screens: [
      { title: 'Win some, lose some', text: 'In a game you win 3 points, then lose 5 points. What has happened to your score?',
        pictures: [chips(3, 5), eq('3 + (−5)')] },
      { title: 'Adding does not always make more', text: 'Now, 3 + 5 would be 8. But read the story again. You LOST 5 points, so your score cannot have gone up. Adding a negative number makes less, not more.',
        beats: [
          { say: 'Now, 3 + 5 would be 8. But read the story again.', pic: 0, effect: 'draw' },
          { say: 'You LOST 5 points, so your score cannot have gone up.' },
          { say: 'Adding a negative number makes less, not more.', write: 'add a negative → less' },
        ],
        pictures: [chips(3, 5)] },
      { title: 'The big idea', text: 'A plus and a minus cancel out to 0. Pair them up, take the pairs away, and count what is left.',
        beats: [
          { say: 'A plus and a minus cancel out to 0.', pic: 0, effect: 'draw' },
          { say: 'Pair them up, take the pairs away, and count what is left.' },
        ],
        pictures: [chips(3, 5, 3)] },
      { title: 'Pair them up', text: "So let's pair them off. One plus counter with one minus counter. Win a point, lose a point, and you are right back to 0. We can make 3 pairs here.",
        beats: [
          { say: "So let's pair them off. One plus counter with one minus counter.", pic: 0, effect: 'draw' },
          { say: 'Win a point, lose a point, and you are right back to 0.', write: '+1 and −1 → 0' },
          { say: 'We can make 3 pairs here.' },
        ],
        pictures: [chips(3, 5, 3, true)] },
      { title: 'Take the pairs away', text: 'Every pair is worth 0, so I can lift the pairs straight off and nothing changes. Watch what is left behind. 2 minus counters.',
        beats: [
          { say: 'Every pair is worth 0, so I can lift the pairs straight off and nothing changes.', write: 'a pair is 0 → lift it off' },
          { say: 'Watch what is left behind. 2 minus counters.', pic: 0, effect: 'draw' },
        ],
        pictures: [chips(0, 2, 0, true)] },
      { title: 'Read what is left', text: '2 minus counters means −2. So 3 + (−5) = −2. Your score went down by 2, and that is exactly what the story said.',
        beats: [
          { say: '2 minus counters means −2.', pic: 0, effect: 'draw' },
          { say: 'So 3 + (−5) = −2.', pic: 1 },
          { say: 'Your score went down by 2, and that is exactly what the story said.' },
        ],
        pictures: [chips(0, 2), eq('3 + (−5) = −2')] },
      { title: 'One thing not to do', text: "Here is the one to watch. Don't just add the 5 on top. A minus counter cancels a plus counter, it does not join it.",
        beats: [
          { say: 'Here is the one to watch.' },
          { say: "Don't just add the 5 on top.", pic: 0 },
          { say: 'A minus counter cancels a plus counter, it does not join it.' },
        ],
        pictures: [{ kind: 'cards', wrong: '3 + (−5) = 8', right: '3 + (−5) = −2' }] },
    ],
    turn: {
      text: 'Add. 4 + (−7) = ?', picture: chips(4, 7),
      answer: -3, steps: ['The 4 plus counters make 4 pairs with 4 of the minus counters.', 'Take the 4 pairs away. 3 minus counters are left.', 'So 4 + (−7) = −3.'],
      prompt: 'Pair each plus with a minus. Take the pairs away. Count what is left.',
      hint1: 'How many plus-and-minus pairs can you make?',
      hint2: 'Make 4 pairs and take them away. Are plus or minus counters left over?',
      twin: { text: 'Add. −6 + 2 = ?', picture: chips(2, 6),
        answer: -4, steps: ['The 2 plus counters make 2 pairs with 2 of the 6 minus counters.', 'Take the 2 pairs away. 4 minus counters are left.', 'So −6 + 2 = −4.'],
        hint1: 'Pair each plus counter with a minus counter.',
        hint2: 'After the pairs are gone, which kind of counter is left, and how many?' },
    },
    won: { text: 'You made pairs, took them away, and counted what was left.', sticker: 'A plus and a minus that cancel out are called a zero pair.' },
    twinWon: { text: 'You took away 2 pairs and found −6 + 2 = −4.', sticker: 'A plus and a minus that cancel out are called a zero pair.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Add. 5 + (−8) = ?', picture: chips(5, 8),
        answer: -3, steps: ['Make 5 zero pairs.', 'Take them away. 3 minus counters are left.', 'So 5 + (−8) = −3.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Add. −7 + 9 = ?', picture: chips(9, 7),
        answer: 2, steps: ['Make 7 zero pairs.', 'Take them away. 2 plus counters are left.', 'So −7 + 9 = 2.'] } },
      { why: 'Still "take the pairs away"', problem: { text: 'Add. −3 + (−4) = ?', picture: eq('−3 + (−4) = ?'),
        answer: -7, steps: ['There are no plus counters, so there are no pairs to take away.', '3 minus counters and 4 more minus counters make 7 minus counters.', 'So −3 + (−4) = −7.'] } },
      { why: 'A little harder', problem: { text: 'Add. −15 + 9 = ?', picture: eq('−15 + 9 = ?'),
        answer: -6, steps: ['The 9 plus counters make 9 zero pairs with 9 of the 15 minus counters.', 'Take the pairs away. 15 − 9 = 6 minus counters are left.', 'So −15 + 9 = −6.'] } },
      { why: 'Same math in a story', problem: { text: 'In a game, Maya has −6 points. Then she wins 11 points. What is her score now?', picture: chips(11, 6),
        answer: 5, steps: ['Her score is −6 + 11.', 'Make 6 zero pairs and take them away. 5 plus counters are left.', 'So her score is 5.'] } },
    ],
  },

  // ── Topic 4 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m2-t4', title: 'Subtract by adding the opposite', skill: 'Subtract integers by rewriting the subtraction as adding the opposite',
    bigIdea: 'Taking away a number is the same as adding its opposite. Change − to +, and change the second number to its opposite.',
    screens: [
      { title: 'Going down', text: 'An elevator is on floor −3, below the ground floor at 0. It goes down 5 more floors. Which floor is it on now?',
        pictures: [line(-10, 10, [{ at: -3, label: 'start' }]), eq('−3 − 5')] },
      { title: 'Too many minus signs', text: 'Look at −3 − 5. One of those minus signs is part of the number, and the other one means take away. And what on earth would −3 − (−5) mean? This gets confusing fast, so we are going to get rid of the taking away altogether.',
        beats: [
          { say: 'Look at −3 − 5.', pic: 0 },
          { say: 'One of those minus signs is part of the number, and the other one means take away.', write: 'two jobs for one sign' },
          { say: 'And what on earth would −3 − (−5) mean? This gets confusing fast, so we are going to get rid of the taking away altogether.' },
        ],
        pictures: [eq('−3 − 5', ['−3 − (−5)'])] },
      { title: 'The big idea', text: 'Taking away a number is the same as adding its opposite. Change − to +, and change the second number to its opposite.',
        beats: [
          { say: 'Taking away a number is the same as adding its opposite.', pic: 0 },
          { say: 'Change − to +, and change the second number to its opposite.' },
        ],
        pictures: [eq('−3 − 5 = −3 + (−5)')] },
      { title: 'Change it to adding', text: 'So here we go. Change the take-away sign to a plus. Then flip the 5 to its opposite, −5. And −3 − 5 becomes −3 + (−5).',
        beats: [
          { say: 'So here we go. Change the take-away sign to a plus.', pic: 0, effect: 'draw' },
          { say: 'Then flip the 5 to its opposite, −5.', write: 'take away → add the opposite' },
          { say: 'And −3 − 5 becomes −3 + (−5).', pic: 1 },
        ],
        pictures: [line(-10, 10, [{ at: -3, label: 'start' }]), eq('−3 − 5', ['−3 + (−5)'])] },
      { title: 'Add on the number line', text: 'Now it is an adding question, and we know how to do those. Start at −3. Adding −5 means take 5 steps to the left.',
        beats: [
          { say: 'Now it is an adding question, and we know how to do those.' },
          { say: 'Start at −3.', pic: 0, effect: 'draw' },
          { say: 'Adding −5 means take 5 steps to the left.', write: 'add a negative → go left' },
        ],
        pictures: [line(-10, 10, [{ at: -3, label: 'start' }], [{ from: -3, to: -8, label: '+ (−5)' }], true)] },
      { title: 'Where you land', text: 'Count them off, and you land on −8. So −3 − 5 = −8. The elevator is on floor −8, way down below the ground floor.',
        beats: [
          { say: 'Count them off, and you land on −8.', pic: 0, effect: 'draw' },
          { say: 'So −3 − 5 = −8.', pic: 1 },
          { say: 'The elevator is on floor −8, way down below the ground floor.' },
        ],
        pictures: [line(-10, 10, [{ at: -3, label: 'start' }, { at: -8, label: '−8' }], [{ from: -3, to: -8, label: '+ (−5)' }]), eq('−3 − 5 = −8')] },
      { title: 'One thing not to do', text: "Here is the habit to break. Don't just take the small number away from the big one. Change it to adding the opposite first, then move along the line.",
        beats: [
          { say: 'Here is the habit to break.' },
          { say: "Don't just take the small number away from the big one.", pic: 0 },
          { say: 'Change it to adding the opposite first, then move along the line.' },
        ],
        pictures: [{ kind: 'cards', wrong: '−3 − 5 = 2', right: '−3 − 5 = −3 + (−5) = −8' }] },
    ],
    turn: {
      text: 'Take away. −1 − 6 = ?', picture: qline(-10, 10, [{ at: -1, label: 'start' }]),
      answer: -7, steps: ['Change it to adding the opposite: −1 + (−6).', 'Start at −1 and move 6 steps to the left.', 'So −1 − 6 = −7.'],
      prompt: 'Change − to + and use the opposite. Then move on the line.',
      hint1: 'What is the opposite of 6? Change − to + and add it.',
      hint2: 'Write −1 + (−6). Start at −1. Which way does adding a negative move you?',
      twin: { text: 'Take away. 4 − (−3) = ?', picture: qline(-10, 10, [{ at: 4, label: 'start' }]),
        answer: 7, steps: ['Change it to adding the opposite. The opposite of −3 is 3, so 4 + 3.', 'Start at 4 and move 3 steps to the right.', 'So 4 − (−3) = 7.'],
        hint1: 'What is the opposite of −3?',
        hint2: 'Write 4 + 3. Start at 4. Which way does adding a positive move you?' },
    },
    won: { text: 'You changed taking away into adding the opposite.', sticker: 'The opposite of a number is also called its additive inverse, because together they add to zero.' },
    twinWon: { text: 'You added the opposite and found 4 − (−3) = 7.', sticker: 'The opposite of a number is also called its additive inverse, because together they add to zero.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Take away. −2 − 4 = ?', picture: qline(-10, 10, [{ at: -2, label: 'start' }]),
        answer: -6, steps: ['Change it to −2 + (−4).', 'Start at −2 and move 4 steps left.', 'So −2 − 4 = −6.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Take away. 3 − 8 = ?', picture: qline(-10, 10, [{ at: 3, label: 'start' }]),
        answer: -5, steps: ['Change it to 3 + (−8).', 'Start at 3 and move 8 steps left: 3 steps to 0, then 5 more.', 'So 3 − 8 = −5.'] } },
      { why: 'Still "add the opposite"', problem: { text: 'Take away. −5 − (−2) = ?', picture: qline(-10, 10, [{ at: -5, label: 'start' }]),
        answer: -3, steps: ['The opposite of −2 is 2, so change it to −5 + 2.', 'Start at −5 and move 2 steps right.', 'So −5 − (−2) = −3.'] } },
      { why: 'A little harder', problem: { text: 'Take away. −7 − (−12) = ?', picture: qline(-10, 10, [{ at: -7, label: 'start' }]),
        answer: 5, steps: ['The opposite of −12 is 12, so change it to −7 + 12.', 'Start at −7 and move 12 steps right: 7 steps to 0, then 5 more.', 'So −7 − (−12) = 5.'] } },
      { why: 'Same math in a story', problem: { text: 'A submarine is at −20 meters. A whale is at −45 meters. How many meters deeper is the whale? Work out −20 − (−45).',
        picture: { kind: 'numline', min: -50, max: 0, ticks: 10, labels: 'ends', points: [{ at: -20, label: 'submarine' }, { at: -45, label: 'whale' }] },
        answer: 25, steps: ['The opposite of −45 is 45, so change it to −20 + 45.', 'Start at −20 and move 45 steps right: 20 steps to 0, then 25 more.', 'So the whale is 25 meters deeper.'] } },
    ],
  },

  // ── Topic 5 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m2-t5', title: 'Multiply signed numbers', skill: 'Multiply integers using the sign rules, seen as a pattern of repeated groups',
    bigIdea: 'Multiply the numbers as usual. Same signs make a positive answer, and different signs make a negative answer.',
    screens: [
      { title: 'Losing points every round', text: 'You lose 2 points in each round, for 3 rounds. How much has your score changed?',
        pictures: [{ kind: 'table', head: ['Round 1', 'Round 2', 'Round 3', 'Total'], rows: [['−2', '−2', '−2', '?']] }] },
      { title: 'What about two minus signs?', text: '3 × (−2) is fine. That is 3 groups of −2. But now look at this one. What could −3 × (−2) possibly mean? You cannot make −3 groups of anything.',
        beats: [
          { say: '3 × (−2) is fine. That is 3 groups of −2.', pic: 0 },
          { say: 'But now look at this one. What could −3 × (−2) possibly mean?' },
          { say: 'You cannot make −3 groups of anything.', write: 'there is no such thing as −3 groups' },
        ],
        pictures: [eq('3 × (−2) = ?', ['−3 × (−2) = ?'])] },
      { title: 'The big idea', text: 'Multiply the numbers as usual. Same signs make a positive answer, and different signs make a negative answer.',
        beats: [
          { say: 'Multiply the numbers as usual.', pic: 0 },
          { say: 'Same signs make a positive answer, and different signs make a negative answer.' },
        ],
        pictures: [SIGNS] },
      { title: 'Groups of −2', text: 'So instead of groups, watch a pattern. Here is 3 times a number, with the number counting down. Read the answers with me: 6, 3, 0, −3, −6. They drop by 3 every single time, and that is how we land on 3 × (−2) = −6.',
        beats: [
          { say: 'So instead of groups, watch a pattern.' },
          { say: 'Here is 3 times a number, with the number counting down.', pic: 0 },
          { say: 'Read the answers with me: 6, 3, 0, −3, −6.' },
          { say: 'They drop by 3 every single time, and that is how we land on 3 × (−2) = −6.', write: '+ × − → −' },
        ],
        pictures: [{ kind: 'table', head: ['3 × 2', '3 × 1', '3 × 0', '3 × (−1)', '3 × (−2)'], rows: [['6', '3', '0', '−3', '−6']], motion: true }] },
      { title: 'Now start with −3', text: 'Now the same trick, but starting with −3. As the second number counts down, the answers go the other way. Up by 3 each time: −6, −3, 0, 3, 6. So −3 × (−2) = 6. A positive answer.',
        beats: [
          { say: 'Now the same trick, but starting with −3.', pic: 0 },
          { say: 'As the second number counts down, the answers go the other way. Up by 3 each time: −6, −3, 0, 3, 6.' },
          { say: 'So −3 × (−2) = 6. A positive answer.', write: '− × − → +' },
        ],
        pictures: [{ kind: 'table', head: ['−3 × 2', '−3 × 1', '−3 × 0', '−3 × (−1)', '−3 × (−2)'], rows: [['−6', '−3', '0', '3', '6']], motion: true }] },
      { title: 'Just check the signs', text: 'Here is the quick way. Multiply 3 × 2 = 6 and forget the signs for a second. Now look at the signs. 3 × (−2) has different signs, so the answer is −6. And −3 × (−2) has the same signs, so it is 6.',
        beats: [
          { say: 'Here is the quick way. Multiply 3 × 2 = 6 and forget the signs for a second.' },
          { say: 'Now look at the signs.', pic: 0 },
          { say: '3 × (−2) has different signs, so the answer is −6. And −3 × (−2) has the same signs, so it is 6.', pic: 1 },
        ],
        pictures: [SIGNS, eq('3 × (−2) = −6', ['−3 × (−2) = 6'])] },
      { title: 'One thing not to do', text: "Here is the one almost everybody trips on. Don't think two negatives make an even bigger negative. Same signs give a positive answer, every time.",
        beats: [
          { say: 'Here is the one almost everybody trips on.' },
          { say: "Don't think two negatives make an even bigger negative.", pic: 0 },
          { say: 'Same signs give a positive answer, every time.' },
        ],
        pictures: [{ kind: 'cards', wrong: '−3 × (−2) = −6', right: '−3 × (−2) = 6' }] },
    ],
    turn: {
      text: 'Multiply. −4 × (−3) = ?', picture: eq('−4 × (−3) = ?'),
      answer: 12, steps: ['Multiply the numbers: 4 × 3 = 12.', 'Both numbers are negative. Same signs give a positive answer.', 'So −4 × (−3) = 12.'],
      prompt: 'Multiply without the signs. Then check: same signs or different?',
      hint1: 'Multiply 4 × 3 first, without the signs.',
      hint2: 'Are the two signs the same or different? What does that make the answer?',
      twin: { text: 'Multiply. 5 × (−6) = ?', picture: eq('5 × (−6) = ?'),
        answer: -30, steps: ['Multiply the numbers: 5 × 6 = 30.', 'One number is positive and one is negative. Different signs give a negative answer.', 'So 5 × (−6) = −30.'],
        hint1: 'Multiply 5 × 6 first, without the signs.',
        hint2: 'Are the two signs the same or different? What does that make the answer?' },
    },
    won: { text: 'You multiplied, then used the signs.', sticker: 'The answer to a multiplication is the product. Same signs: a positive product. Different signs: a negative product.' },
    twinWon: { text: 'You checked the signs and found 5 × (−6) = −30.', sticker: 'The answer to a multiplication is the product. Same signs: a positive product. Different signs: a negative product.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Multiply. −5 × (−2) = ?', picture: eq('−5 × (−2) = ?'),
        answer: 10, steps: ['5 × 2 = 10.', 'Same signs give a positive answer.', 'So −5 × (−2) = 10.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Multiply. 7 × (−3) = ?', picture: eq('7 × (−3) = ?'),
        answer: -21, steps: ['7 × 3 = 21.', 'Different signs give a negative answer.', 'So 7 × (−3) = −21.'] } },
      { why: 'Still "check the signs"', problem: { text: 'Multiply. −8 × 4 = ?', picture: eq('−8 × 4 = ?'),
        answer: -32, steps: ['8 × 4 = 32.', 'Different signs give a negative answer.', 'So −8 × 4 = −32.'] } },
      { why: 'A little harder', problem: { text: 'Multiply. −2 × (−3) × (−4) = ?', picture: eq('−2 × (−3) × (−4) = ?'),
        answer: -24, steps: ['−2 × (−3) = 6, because the signs are the same.', '6 × (−4): the signs are different, and 6 × 4 = 24, so it is negative.', 'So −2 × (−3) × (−4) = −24.'] } },
      { why: 'Same math in a story', problem: { text: 'A diver goes down 3 meters every minute, so her change each minute is −3 meters. What is her total change after 6 minutes?',
        picture: eq('6 × (−3) = ?'),
        answer: -18, steps: ['Her total change is 6 × (−3).', '6 × 3 = 18, and different signs give a negative answer.', 'So her total change is −18 meters.'] } },
    ],
  },

  // ── Topic 6 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m2-t6', title: 'Divide signed numbers', skill: 'Divide integers using the same sign rules as multiplication',
    bigIdea: 'Dividing uses the same sign rule as multiplying. Same signs make a positive answer, and different signs make a negative answer.',
    screens: [
      { title: 'A losing streak', text: 'A team lost 12 points over 4 games, the same amount each game. How did its score change in each game?',
        pictures: [{ kind: 'table', head: ['Total change', 'Games', 'Each game'], rows: [['−12', '4', '?']] }] },
      { title: 'The sign matters', text: 'You already know 12 ÷ 4 = 3. But be careful with that answer. A plain 3 would say the team GAINED 3 points a game. It lost points, so the sign has to say so.',
        beats: [
          { say: 'You already know 12 ÷ 4 = 3. But be careful with that answer.', pic: 0 },
          { say: 'A plain 3 would say the team GAINED 3 points a game.' },
          { say: 'It lost points, so the sign has to say so.', write: 'lost → negative' },
        ],
        pictures: [{ kind: 'table', head: ['Total change', 'Games', 'Each game'], rows: [['−12', '4', '3?']] }] },
      { title: 'The big idea', text: 'Dividing uses the same sign rule as multiplying. Same signs make a positive answer, and different signs make a negative answer.',
        beats: [
          { say: 'Dividing uses the same sign rule as multiplying.', pic: 0 },
          { say: 'Same signs make a positive answer, and different signs make a negative answer.' },
        ],
        pictures: [SIGNS] },
      { title: 'Undo a multiplication', text: 'Dividing undoes multiplying, so turn the question around. What do I multiply by 4 to get −12? Well, 4 × (−3) = −12. So −12 ÷ 4 = −3.',
        beats: [
          { say: 'Dividing undoes multiplying, so turn the question around.', write: 'divide = undo a multiply' },
          { say: 'What do I multiply by 4 to get −12?' },
          { say: 'Well, 4 × (−3) = −12. So −12 ÷ 4 = −3.', pic: 0 },
        ],
        pictures: [{ kind: 'table', head: ['Divide', 'Check by multiplying'], rows: [['−12 ÷ 4 = −3', '4 × (−3) = −12']], motion: true }] },
      { title: 'Two negatives', text: 'Now try −12 ÷ (−4). Same question again: what do I multiply by −4 to get −12? This time it is 3, because −4 × 3 = −12. So −12 ÷ (−4) = 3.',
        beats: [
          { say: 'Now try −12 ÷ (−4).' },
          { say: 'Same question again: what do I multiply by −4 to get −12?' },
          { say: 'This time it is 3, because −4 × 3 = −12. So −12 ÷ (−4) = 3.', pic: 0 },
        ],
        pictures: [{ kind: 'table', head: ['Divide', 'Check by multiplying'], rows: [['−12 ÷ 4 = −3', '4 × (−3) = −12'], ['−12 ÷ (−4) = 3', '−4 × 3 = −12']], motion: true }] },
      { title: 'Just check the signs', text: 'So the quick way is exactly the one you used for multiplying. Divide 12 ÷ 4 = 3, then look at the signs. Same signs leave it at 3. Different signs make it −3.',
        beats: [
          { say: 'So the quick way is exactly the one you used for multiplying.' },
          { say: 'Divide 12 ÷ 4 = 3, then look at the signs.', pic: 0 },
          { say: 'Same signs leave it at 3. Different signs make it −3.' },
        ],
        pictures: [{ kind: 'table', head: ['Divide', 'Signs', 'Answer'], rows: [['12 ÷ 4', 'same', '3'], ['−12 ÷ (−4)', 'same', '3'], ['−12 ÷ 4', 'different', '−3'], ['12 ÷ (−4)', 'different', '−3']], motion: true }] },
      { title: 'One thing not to do', text: "Here is the slip. Don't hang on to a minus sign just because both numbers have one. Two negatives divide to a positive.",
        beats: [
          { say: 'Here is the slip.' },
          { say: "Don't hang on to a minus sign just because both numbers have one.", pic: 0 },
          { say: 'Two negatives divide to a positive.' },
        ],
        pictures: [{ kind: 'cards', wrong: '−12 ÷ (−4) = −3', right: '−12 ÷ (−4) = 3' }] },
    ],
    turn: {
      text: 'Divide. −20 ÷ (−5) = ?', picture: eq('−20 ÷ (−5) = ?'),
      answer: 4, steps: ['Divide the numbers: 20 ÷ 5 = 4.', 'Both numbers are negative. Same signs give a positive answer.', 'So −20 ÷ (−5) = 4.'],
      prompt: 'Divide without the signs. Then check: same signs or different?',
      hint1: 'Divide 20 ÷ 5 first, without the signs.',
      hint2: 'Are the two signs the same or different? What does that make the answer?',
      twin: { text: 'Divide. 18 ÷ (−3) = ?', picture: eq('18 ÷ (−3) = ?'),
        answer: -6, steps: ['Divide the numbers: 18 ÷ 3 = 6.', 'One number is positive and one is negative. Different signs give a negative answer.', 'So 18 ÷ (−3) = −6.'],
        hint1: 'Divide 18 ÷ 3 first, without the signs.',
        hint2: 'Check it: what number times −3 makes 18?' },
    },
    won: { text: 'You divided, then used the signs.', sticker: 'The answer to a division is the quotient. Its sign follows the same rule as a product.' },
    twinWon: { text: 'You checked the signs and found 18 ÷ (−3) = −6.', sticker: 'The answer to a division is the quotient. Its sign follows the same rule as a product.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Divide. −15 ÷ (−3) = ?', picture: eq('−15 ÷ (−3) = ?'),
        answer: 5, steps: ['15 ÷ 3 = 5.', 'Same signs give a positive answer.', 'So −15 ÷ (−3) = 5.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Divide. −24 ÷ 6 = ?', picture: eq('−24 ÷ 6 = ?'),
        answer: -4, steps: ['24 ÷ 6 = 4.', 'Different signs give a negative answer.', 'So −24 ÷ 6 = −4.'] } },
      { why: 'Still "same signs, positive"', problem: { text: 'Divide. 42 ÷ (−7) = ?', picture: eq('42 ÷ (−7) = ?'),
        answer: -6, steps: ['42 ÷ 7 = 6.', 'The signs are different, so the answer is negative.', 'So 42 ÷ (−7) = −6.'] } },
      { why: 'A little harder', problem: { text: 'Divide. −96 ÷ (−8) = ?', picture: eq('−96 ÷ (−8) = ?'),
        answer: 12, steps: ['96 ÷ 8 = 12, because 8 × 12 = 96.', 'Same signs give a positive answer.', 'So −96 ÷ (−8) = 12.'] } },
      { why: 'Same math in a story', problem: { text: 'A hot air balloon comes down 45 meters in 9 minutes, the same amount each minute. Its change is −45 meters. What is its change each minute?',
        picture: { kind: 'table', head: ['Total change', 'Minutes', 'Each minute'], rows: [['−45 m', '9', '?']] },
        answer: -5, steps: ['The change each minute is −45 ÷ 9.', '45 ÷ 9 = 5, and different signs give a negative answer.', 'So its change is −5 meters each minute.'] } },
    ],
  },

  // ── Topic 7 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m2-t7', title: 'Negative fractions and decimals', skill: 'Add and multiply negative fractions and decimals with the same rules as integers',
    bigIdea: 'Negative fractions and decimals follow the same rules as negative whole numbers. Keep the minus sign all the way through.',
    screens: [
      { title: 'A frog in the pond', text: 'A frog sits 1/2 meter under the water, at −1/2. It jumps up 3/4 meter. Where does it land?',
        pictures: [fourths([{ at: -0.5, label: 'frog' }])] },
      { title: 'Easy to drop the sign', text: 'It is so easy to let that minus sign slide off and just work out 1/2 + 3/4 = 5/4. But look where the frog started. It was BELOW 0, so it cannot possibly get that high.',
        beats: [
          { say: 'It is so easy to let that minus sign slide off and just work out 1/2 + 3/4 = 5/4.' },
          { say: 'But look where the frog started.', pic: 0, effect: 'draw' },
          { say: 'It was BELOW 0, so it cannot possibly get that high.', write: 'it starts below 0' },
        ],
        pictures: [fourths([{ at: -0.5, label: 'frog' }])] },
      { title: 'The big idea', text: 'Negative fractions and decimals follow the same rules as negative whole numbers. Keep the minus sign all the way through.',
        beats: [
          { say: 'Negative fractions and decimals follow the same rules as negative whole numbers.', pic: 0, effect: 'draw' },
          { say: 'Keep the minus sign all the way through.' },
        ],
        pictures: [fourths([{ at: -0.5, label: '−1/2' }])] },
      { title: 'Use the same bottom number', text: 'Before we can add, both numbers need the same bottom number. And −1/2 is the same as −2/4. Now they match: −2/4 + 3/4.',
        beats: [
          { say: 'Before we can add, both numbers need the same bottom number.', write: 'same bottom number first' },
          { say: 'And −1/2 is the same as −2/4.', pic: 0, effect: 'draw' },
          { say: 'Now they match: −2/4 + 3/4.', pic: 1 },
        ],
        pictures: [fourths([{ at: -0.5, label: '−2/4' }], undefined, true), eq('−1/2 + 3/4', ['−2/4 + 3/4'])] },
      { title: 'Jump on the line', text: 'Start your finger at −2/4. Adding 3/4 means 3 fourths to the right. Hop them with me: −1/4, 0, 1/4.',
        beats: [
          { say: 'Start your finger at −2/4.', pic: 0, effect: 'draw' },
          { say: 'Adding 3/4 means 3 fourths to the right.', write: 'adding → jump right' },
          { say: 'Hop them with me: −1/4, 0, 1/4.' },
        ],
        pictures: [fourths([{ at: -0.5, label: 'start' }], [{ from: -0.5, to: 0.25, label: '+3/4' }], true)] },
      { title: 'Where it lands', text: 'The frog lands on 1/4, just above the water. So −1/2 + 3/4 = 1/4. And decimals are no different: −2.5 × 4 has different signs, so it is −10.',
        beats: [
          { say: 'The frog lands on 1/4, just above the water.', pic: 0, effect: 'draw' },
          { say: 'So −1/2 + 3/4 = 1/4.', pic: 1 },
          { say: 'And decimals are no different: −2.5 × 4 has different signs, so it is −10.' },
        ],
        pictures: [fourths([{ at: 0.25, label: '1/4' }], [{ from: -0.5, to: 0.25, label: '+3/4' }]), eq('−1/2 + 3/4 = 1/4', ['−2.5 × 4 = −10'])] },
      { title: 'One thing not to do', text: "Here is the one to watch. Don't drop the minus sign off a fraction or a decimal. On a fraction it means what it always means: left of 0.",
        beats: [
          { say: 'Here is the one to watch.' },
          { say: "Don't drop the minus sign off a fraction or a decimal.", pic: 0 },
          { say: 'On a fraction it means what it always means: left of 0.' },
        ],
        pictures: [{ kind: 'cards', wrong: '−1/2 + 3/4 = 5/4', right: '−1/2 + 3/4 = 1/4' }] },
    ],
    turn: {
      text: 'Add. −1/4 + 3/4 = ?', picture: qfourths([{ at: -0.25, label: '−1/4' }]),
      answer: { frac: [1, 2] }, steps: ['Both numbers are already in fourths.', 'Start at −1/4 and jump 3 fourths to the right: 0, 1/4, 2/4.', 'So −1/4 + 3/4 = 2/4, which is 1/2.'],
      prompt: 'Keep the minus sign. Start at the first number and jump on the line.',
      hint1: 'Are both fractions in fourths already? Where do you start?',
      hint2: 'Start at −1/4. Jump 3 fourths to the right. Where do you land?',
      twin: { text: 'Add. −3/4 + 1 = ?', picture: qfourths([{ at: -0.75, label: '−3/4' }]),
        answer: { frac: [1, 4] }, steps: ['Write 1 as 4/4, so both numbers are in fourths.', 'Start at −3/4 and jump 4 fourths to the right: −2/4, −1/4, 0, 1/4.', 'So −3/4 + 1 = 1/4.'],
        hint1: 'Write 1 as a number of fourths first.',
        hint2: 'Start at −3/4 and jump right, one fourth at a time. Count your jumps.' },
    },
    won: { text: 'You kept the minus sign and jumped on the line.', sticker: 'Whole numbers, fractions and decimals, positive or negative, are all rational numbers.' },
    twinWon: { text: 'You wrote 1 as fourths and found −3/4 + 1 = 1/4.', sticker: 'Whole numbers, fractions and decimals, positive or negative, are all rational numbers.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Add. −1/4 + 1/2 = ?', picture: qfourths([{ at: -0.25, label: '−1/4' }]),
        answer: { frac: [1, 4] }, steps: ['Write 1/2 as 2/4.', 'Start at −1/4 and jump 2 fourths right: 0, 1/4.', 'So −1/4 + 1/2 = 1/4.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Multiply. −1.5 × 6 = ?', picture: eq('−1.5 × 6 = ?'),
        answer: -9, steps: ['1.5 × 6 = 9.', 'Different signs give a negative answer.', 'So −1.5 × 6 = −9.'] } },
      { why: 'Still "keep the minus sign"', problem: { text: 'Add. −1.5 + (−2.25) = ?',
        picture: { kind: 'numline', min: -4, max: 0, ticks: 16, labels: 'ends', points: [{ at: -1.5, label: '−1.5' }] },
        answer: -3.75, steps: ['Both numbers are negative, so you move left both times.', '1.5 + 2.25 = 3.75, and the answer stays left of 0.', 'So −1.5 + (−2.25) = −3.75.'] } },
      { why: 'A little harder', problem: { text: 'Multiply. −3/4 × (−2/3) = ?', picture: eq('−3/4 × (−2/3) = ?'),
        answer: { frac: [1, 2] }, steps: ['Multiply the tops and the bottoms: 3 × 2 = 6 and 4 × 3 = 12, so 6/12.', 'Both numbers are negative. Same signs give a positive answer.', 'So −3/4 × (−2/3) = 6/12, which is 1/2.'] } },
      { why: 'Same math in a story', problem: { text: 'The water in a tank drops 0.75 meters each week, so each week the change is −0.75 meters. What is the total change after 3 weeks?',
        picture: { kind: 'numline', min: -3, max: 0, ticks: 12, labels: 'ends' },
        answer: -2.25, steps: ['The total change is 3 × (−0.75).', '3 × 0.75 = 2.25, and different signs give a negative answer.', 'So the total change is −2.25 meters.'] } },
    ],
  },

  // ── Topic 8 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m2-t8', title: 'Signed number stories', skill: 'Write a real situation with signed numbers and solve it',
    bigIdea: 'Up, above and gained are positive. Down, below and lost are negative. Write each amount with its sign, then do the math.',
    screens: [
      { title: 'A cold morning', text: 'At 6 in the morning it is −5 °C. By noon it is 8 degrees warmer. What is the temperature at noon?',
        pictures: [thermo(-5, -10, 10, 5)] },
      { title: 'The words pick the sign', text: 'You might reach for −5 − 8, which gives you −13. But −13 is colder than we started, and the story says it got warmer. So it is the words that tell you which way to go.',
        beats: [
          { say: 'You might reach for −5 − 8, which gives you −13.', pic: 0, effect: 'draw' },
          { say: 'But −13 is colder than we started, and the story says it got warmer.' },
          { say: 'So it is the words that tell you which way to go.', write: 'read the words, then pick the sign' },
        ],
        pictures: [thermo(-5, -10, 10, 5)] },
      { title: 'The big idea', text: 'Up, above and gained are positive. Down, below and lost are negative. Write each amount with its sign, then do the math.',
        beats: [
          { say: 'Up, above and gained are positive.', pic: 0, effect: 'draw' },
          { say: 'Down, below and lost are negative.' },
          { say: 'Write each amount with its sign, then do the math.', pic: 1 },
        ],
        pictures: [thermo(-5, -10, 10, 5), change([['−5', '+8', '?']])] },
      { title: 'Write it with signs', text: "So let's write it down. We start at −5. Warmer means going up, so the change is +8. And the math we need is −5 + 8.",
        beats: [
          { say: "So let's write it down. We start at −5.", pic: 0, effect: 'draw' },
          { say: 'Warmer means going up, so the change is +8.', write: 'warmer → +' },
          { say: 'And the math we need is −5 + 8.', pic: 1 },
        ],
        pictures: [thermo(-5, -10, 10, 5), change([['−5', '+8', '?']], true)] },
      { title: 'Climb the thermometer', text: 'Now climb with me. Go up 5 degrees and you reach 0. That has used 5 of your 8, so you have 3 left. Go up those 3 more, and you are at 3.',
        beats: [
          { say: 'Now climb with me. Go up 5 degrees and you reach 0.', pic: 0, effect: 'draw' },
          { say: 'That has used 5 of your 8, so you have 3 left.', write: '8 = 5 + 3' },
          { say: 'Go up those 3 more, and you are at 3.', pic: 1 },
        ],
        pictures: [thermo(3, -10, 10, 5), { kind: 'table', head: ['From', 'Up', 'To'], rows: [['−5', '5', '0'], ['0', '3', '3']], motion: true }] },
      { title: 'Check it makes sense', text: 'Last thing, always: does that answer make sense? Warmer should give a higher number, and 3 is higher than −5. So it is 3 °C at noon.',
        beats: [
          { say: 'Last thing, always: does that answer make sense?' },
          { say: 'Warmer should give a higher number, and 3 is higher than −5.', pic: 0, effect: 'draw' },
          { say: 'So it is 3 °C at noon.', pic: 1 },
        ],
        pictures: [thermo(3, -10, 10, 5), eq('−5 + 8 = 3')] },
      { title: 'One thing not to do', text: "Here is the mistake to dodge. Don't copy the sign of the first number onto the change. Warmer means add. Colder means take away.",
        beats: [
          { say: 'Here is the mistake to dodge.' },
          { say: "Don't copy the sign of the first number onto the change.", pic: 0 },
          { say: 'Warmer means add. Colder means take away.' },
        ],
        pictures: [{ kind: 'cards', wrong: '−5 − 8 = −13', right: '−5 + 8 = 3' }] },
    ],
    turn: {
      text: 'It is −4 °C in the morning. By the afternoon it is 9 degrees warmer. What is the temperature in the afternoon, in °C?',
      picture: thermo(-4),
      answer: 5, steps: ['Warmer means up, so write −4 + 9.', 'Go up 4 degrees to reach 0. That leaves 5 more to go up.', 'So it is 5 °C.'],
      prompt: 'Let the words pick the sign. Then climb the thermometer.',
      hint1: 'Does warmer make the number go up or down?',
      hint2: 'Write −4 + 9. How many degrees is it from −4 up to 0?',
      twin: { text: 'It is 3 °C in the evening. By morning it is 7 degrees colder. What is the temperature in the morning, in °C?',
        picture: thermo(3),
        answer: -4, steps: ['Colder means down, so write 3 − 7.', 'Go down 3 degrees to reach 0. That leaves 4 more to go down.', 'So it is −4 °C.'],
        hint1: 'Does colder make the number go up or down?',
        hint2: 'Write 3 − 7. How many degrees is it from 3 down to 0?' },
    },
    won: { text: 'You let the words pick the sign, then did the math.', sticker: 'Numbers with a + or − sign are called signed numbers.' },
    twinWon: { text: 'You went 7 degrees colder from 3 °C and found −4 °C.', sticker: 'Numbers with a + or − sign are called signed numbers.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'It is −6 °C. It gets 10 degrees warmer. What is the temperature now, in °C?', picture: thermo(-6),
        answer: 4, steps: ['Warmer means up, so write −6 + 10.', 'Go up 6 degrees to reach 0. That leaves 4 more.', 'So it is 4 °C.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'A hiker starts 12 meters below sea level, at −12 meters. She climbs up 30 meters. What is her elevation now, in meters?',
        picture: change([['−12 m', '+30 m', '?']]),
        answer: 18, steps: ['Climbing up is positive, so write −12 + 30.', 'Go up 12 meters to reach 0. That leaves 18 more.', 'So her elevation is 18 meters.'] } },
      { why: 'Still "words pick the sign"', problem: { text: 'Sam has $15 in the bank. He spends $22. What is his balance now, in dollars?',
        picture: change([['$15', '−$22', '?']]),
        answer: -7, steps: ['Spending is money lost, so write 15 − 22, which is 15 + (−22).', 'Go down 15 to reach 0. That leaves 7 more to go down.', 'So his balance is −7 dollars.'] } },
      { why: 'A little harder', problem: { text: 'In golf, a score below 0 is good. Mia scores −2 on day 1, +1 on day 2 and −4 on day 3. What is her total score?',
        picture: { kind: 'table', head: ['Day 1', 'Day 2', 'Day 3', 'Total'], rows: [['−2', '+1', '−4', '?']] },
        answer: -5, steps: ['Add the days in order: −2 + 1 = −1.', 'Then −1 + (−4): move 4 more below 0.', 'So her total score is −5.'] } },
      { why: 'Same math in a story', problem: { text: 'A freezer is at −18 °C. The power goes out, and it warms up 2 degrees every hour for 5 hours. What is the temperature then, in °C?',
        picture: thermo(-18, -20, 0, 10),
        answer: -8, steps: ['2 degrees every hour for 5 hours is 5 × 2 = 10 degrees warmer.', 'Warmer means up, so write −18 + 10.', 'So it is −8 °C.'] } },
    ],
  },
]
