/**
 * Grade 7 · Module 2 — Operations with rational numbers.
 * Written to docs/new-flow/AUTHORING.md. Negative numbers were not taught in Grade 6 of this curriculum, so t1 starts
 * from "left of 0" and every later topic leans on the number line from t1–t2.
 * Teaching pictures: `numline` (t1, t2, t4, t7), `chips` (t3), `table` (t5, t6), `measure` thermometer (t8).
 * ⚠️ A negative FRACTION answer is shown by the app as "-1/4" with an ASCII hyphen, so t7 keeps its fraction answers
 * positive and writes its negative answers as decimals (shown "−2.25").
 */
import type { Lesson, Picture } from '../script'
import { attachChalk } from '../chalk'
import { G7M2_CHALK } from './chalk/g7m2'

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
    bigIdea: "A number and its opposite are the same distance from 0, on different sides of it.",
    screens: [
      { title: 'Above and below the water', text: 'A bird flies 4 feet above the water. A fish swims 4 feet below it. How can numbers show where each one is?',
        pictures: [line(-10, 10, [{ at: 4, label: 'bird' }, { at: -4, label: 'fish' }])] },
      { title: "4 is not enough", text: "Both of them are 4 feet from the water. So do we just write 4 for the bird, and 4 for the fish? Then which one is up in the air, and which one is under the water? You can't tell.",
        beats: [
          { say: "Both of them are 4 feet from the water.", pic: 0 },
          { say: "So do we just write 4 for the bird, and 4 for the fish?" },
          { say: "Then which one is up in the air, and which one is under the water? You can't tell." },
        ],
        pictures: [line(-10, 10, [{ at: 4, label: '4' }, { at: -4, label: '4?' }])] },
      { title: "The big idea", text: "A number and its opposite are the same distance from 0, on different sides of it.",
        beats: [
          { say: "A number and its opposite are the same distance from 0, on different sides of it.", pic: 0 },
        ],
        pictures: [line(-10, 10, [{ at: 4, label: '4' }, { at: -4, label: '−4' }])] },
      { title: "Count from 0", text: "The water is 0 on this number line. Count with me from 0 out to the bird. 1, 2, 3, 4. That's 4 steps to the right, so the bird is at 4.",
        beats: [
          { say: "The water is 0 on this number line.", pic: 0 },
          { say: "Count with me from 0 out to the bird. 1, 2, 3, 4." },
          { say: "That's 4 steps to the right, so the bird is at 4." },
        ],
        pictures: [line(-10, 10, [{ at: 4, label: '4' }], [{ from: 0, to: 4, label: '4 steps' }], true)] },
      { title: "Same distance, other side", text: "Now the fish. Which way does it go? It's 4 steps from 0 too, but the other way, to the left. Left of 0 gets a minus sign, so the fish is at −4.",
        beats: [
          { say: "Now the fish. Which way does it go?", pic: 0 },
          { say: "It's 4 steps from 0 too, but the other way, to the left." },
          { say: "Left of 0 gets a minus sign, so the fish is at −4." },
        ],
        pictures: [line(-10, 10, [{ at: 4, label: '4' }, { at: -4, label: '−4' }], [{ from: 0, to: 4, label: '4 steps' }, { from: 0, to: -4, label: '4 steps' }], true)] },
      { title: "Opposites come in pairs", text: "So 4 and −4 are opposites. Try 7. Go 7 steps the other way, and you land on −7. And the opposite of −7? Change the sign again, and it's 7.",
        beats: [
          { say: "So 4 and −4 are opposites." },
          { say: "Try 7. Go 7 steps the other way, and you land on −7.", pic: 0 },
          { say: "And the opposite of −7? Change the sign again, and it's 7.", pic: 1 },
        ],
        pictures: [line(-10, 10, [{ at: 7, label: '7' }, { at: -7, label: '−7' }]), eq('opposite of 7 → −7', ['opposite of −7 → 7'])] },
      { title: "One thing not to do", text: "Here's the part people mix up. To find the opposite of −5, don't KEEP the minus sign. −5 is left of 0, so its opposite is right of 0, at 5. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "To find the opposite of −5, don't KEEP the minus sign.", pic: 0 },
          { say: "−5 is left of 0, so its opposite is right of 0, at 5." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: 'opposite of −5 → −5', right: 'opposite of −5 → 5' }] },
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
    bigIdea: "How far a number is from 0 is never negative, so count the steps to 0 and drop the sign.",
    screens: [
      { title: 'Two walks', text: 'Home is at 0. Ana walks 5 blocks east, to 5. Ben walks 5 blocks west, to −5. Who walked farther?',
        pictures: [line(-10, 10, [{ at: 5, label: 'Ana' }, { at: -5, label: 'Ben' }])] },
      { title: "The minus sign is not the distance", text: "Ben ended up at −5. So did he walk −5 blocks? No. Nobody walks a negative number of blocks. The minus sign tells you which way he went, not how far.",
        beats: [
          { say: "Ben ended up at −5.", pic: 0 },
          { say: "So did he walk −5 blocks? No. Nobody walks a negative number of blocks." },
          { say: "The minus sign tells you which way he went, not how far." },
        ],
        pictures: [line(-10, 10, [{ at: 5, label: 'Ana' }, { at: -5, label: 'Ben' }])] },
      { title: "The big idea", text: "How far a number is from 0 is never negative, so count the steps to 0 and drop the sign.",
        beats: [
          { say: "How far a number is from 0 is never negative, so count the steps to 0 and drop the sign.", pic: 0 },
        ],
        pictures: [line(-10, 10, [{ at: -5, label: '−5' }], [{ from: -5, to: 0, label: '5 steps' }])] },
      { title: "Count the steps", text: "Put your finger on −5 and walk it to 0. 1, 2, 3, 4, 5. So −5 is 5 steps from 0. Ben walked 5 blocks.",
        beats: [
          { say: "Put your finger on −5 and walk it to 0.", pic: 0 },
          { say: "1, 2, 3, 4, 5." },
          { say: "So −5 is 5 steps from 0. Ben walked 5 blocks." },
        ],
        pictures: [line(-10, 10, [{ at: -5, label: '−5' }], [{ from: -5, to: 0, label: '5 steps' }], true)] },
      { title: "Both are 5 away", text: "Now Ana. How far is 5 from 0? Count back to 0. That's 5 steps too. So they both walked the same distance, 5 blocks each.",
        beats: [
          { say: "Now Ana. How far is 5 from 0?", pic: 0 },
          { say: "Count back to 0. That's 5 steps too." },
          { say: "So they both walked the same distance, 5 blocks each." },
        ],
        pictures: [line(-10, 10, [{ at: 5, label: '5' }, { at: -5, label: '−5' }], [{ from: -5, to: 0, label: '5 steps' }, { from: 5, to: 0, label: '5 steps' }], true)] },
      { title: "Write it with bars", text: "Math has a short way to ask how far from 0. Two bars around a number ask that question. So the bars turn −5 into 5, and 5 stays 5.",
        beats: [
          { say: "Math has a short way to ask how far from 0." },
          { say: "Two bars around a number ask that question." },
          { say: "So the bars turn −5 into 5, and 5 stays 5.", pic: 0 },
        ],
        pictures: [eq('|−5| = 5', ['|5| = 5', '|0| = 0'])] },
      { title: "One thing not to do", text: "Here's the part people mix up. Bars around −4 do NOT give −4. A distance is never negative, so it's 4. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Bars around −4 do NOT give −4.", pic: 0 },
          { say: "A distance is never negative, so it's 4." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '|−4| = −4', right: '|−4| = 4' }] },
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
    bigIdea: "A plus and a minus cancel to 0, so pair them up, take the pairs away, and count what is left.",
    screens: [
      { title: 'Win some, lose some', text: 'In a game you win 3 points, then lose 5 points. What has happened to your score?',
        pictures: [chips(3, 5), eq('3 + (−5)')] },
      { title: "Adding does not always make more", text: "We write it as 3 + (−5). Is it 3 + 5, which is 8? No. You lost 5 points, so your score can't go up.",
        beats: [
          { say: "We write it as 3 + (−5).", pic: 0 },
          { say: "Is it 3 + 5, which is 8?" },
          { say: "No. You lost 5 points, so your score can't go up." },
        ],
        pictures: [chips(3, 5)] },
      { title: "The big idea", text: "A plus and a minus cancel to 0, so pair them up, take the pairs away, and count what is left.",
        beats: [
          { say: "A plus and a minus cancel to 0, so pair them up, take the pairs away, and count what is left.", pic: 0 },
        ],
        pictures: [chips(3, 5, 3)] },
      { title: "Pair them up", text: "Put out 3 plus counters for the win, and 5 minus counters for the loss. Win a point, lose a point, and you're back to 0. How many pairs can we make? 3.",
        beats: [
          { say: "Put out 3 plus counters for the win, and 5 minus counters for the loss.", pic: 0 },
          { say: "Win a point, lose a point, and you're back to 0." },
          { say: "How many pairs can we make? 3." },
        ],
        pictures: [chips(3, 5, 3, true)] },
      { title: "Take the pairs away", text: "Each pair is worth 0, so taking it away changes nothing. What's left behind? 2 minus counters.",
        beats: [
          { say: "Each pair is worth 0, so taking it away changes nothing." },
          { say: "What's left behind? 2 minus counters.", pic: 0 },
        ],
        pictures: [chips(0, 2, 0, true)] },
      { title: "Read what is left", text: "2 minus counters means −2. So 3 + (−5) = −2. Your score went down by 2, just like the story said.",
        beats: [
          { say: "2 minus counters means −2.", pic: 0 },
          { say: "So 3 + (−5) = −2.", pic: 1 },
          { say: "Your score went down by 2, just like the story said." },
        ],
        pictures: [chips(0, 2), eq('3 + (−5) = −2')] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't just ADD the 5 on and get 8. A minus counter cancels a plus counter. It doesn't join it. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't just ADD the 5 on and get 8.", pic: 0 },
          { say: "A minus counter cancels a plus counter. It doesn't join it." },
          { say: "Okay. Your turn." },
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
    bigIdea: "Taking away a number is the same as adding its opposite.",
    screens: [
      { title: 'Going down', text: 'An elevator is on floor −3, below the ground floor at 0. It goes down 5 more floors. Which floor is it on now?',
        pictures: [line(-10, 10, [{ at: -3, label: 'start' }]), eq('−3 − 5')] },
      { title: "Too many minus signs", text: "We write it as −3 − 5. Look at the two minus signs. Do they mean the same thing? No. The first is part of the number. The second means take away. So let's turn the taking away into adding.",
        beats: [
          { say: "We write it as −3 − 5.", pic: 0 },
          { say: "Look at the two minus signs. Do they mean the same thing?" },
          { say: "No. The first is part of the number. The second means take away." },
          { say: "So let's turn the taking away into adding." },
        ],
        pictures: [eq('−3 − 5', ['−3 − (−5)'])] },
      { title: "The big idea", text: "Taking away a number is the same as adding its opposite.",
        beats: [
          { say: "Taking away a number is the same as adding its opposite.", pic: 0 },
        ],
        pictures: [eq('−3 − 5 = −3 + (−5)')] },
      { title: "Change it to adding", text: "First, change the take-away sign to a plus. Then change 5 to its opposite, −5. Nothing else changes. The −3 stays just as it is.",
        beats: [
          { say: "First, change the take-away sign to a plus.", pic: 0 },
          { say: "Then change 5 to its opposite, −5." },
          { say: "Nothing else changes. The −3 stays just as it is.", pic: 1 },
        ],
        pictures: [line(-10, 10, [{ at: -3, label: 'start' }]), eq('−3 − 5', ['−3 + (−5)'])] },
      { title: "Add on the number line", text: "Now it's adding, and we know how to add. Start at −3 on the number line. Which way does adding −5 go? Left, 5 steps.",
        beats: [
          { say: "Now it's adding, and we know how to add." },
          { say: "Start at −3 on the number line.", pic: 0 },
          { say: "Which way does adding −5 go? Left, 5 steps." },
        ],
        pictures: [line(-10, 10, [{ at: -3, label: 'start' }], [{ from: -3, to: -8, label: '+ (−5)' }], true)] },
      { title: "Where you land", text: "Count them off, and you land on −8. So −3 − 5 = −8. The elevator is on floor −8, way below the ground floor.",
        beats: [
          { say: "Count them off, and you land on −8.", pic: 0 },
          { say: "So −3 − 5 = −8.", pic: 1 },
          { say: "The elevator is on floor −8, way below the ground floor." },
        ],
        pictures: [line(-10, 10, [{ at: -3, label: 'start' }, { at: -8, label: '−8' }], [{ from: -3, to: -8, label: '+ (−5)' }]), eq('−3 − 5 = −8')] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't just TAKE the small number from the big one. Change it to adding the opposite first, then move along the line. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't just TAKE the small number from the big one.", pic: 0 },
          { say: "Change it to adding the opposite first, then move along the line." },
          { say: "Okay. Your turn." },
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
    bigIdea: "Multiply the numbers, then check the signs: same signs make a positive answer, and different signs make a negative one.",
    screens: [
      { title: 'Losing points every round', text: 'You lose 2 points in each round, for 3 rounds. How much has your score changed?',
        pictures: [{ kind: 'table', head: ['Round 1', 'Round 2', 'Round 3', 'Total'], rows: [['−2', '−2', '−2', '?']] }] },
      { title: "What about two minus signs?", text: "Losing 2 points, 3 times, is 3 × (−2). That's 3 groups of −2. But what could −3 × (−2) mean? You can't make −3 groups of anything.",
        beats: [
          { say: "Losing 2 points, 3 times, is 3 × (−2). That's 3 groups of −2.", pic: 0 },
          { say: "But what could −3 × (−2) mean?" },
          { say: "You can't make −3 groups of anything." },
        ],
        pictures: [eq('3 × (−2) = ?', ['−3 × (−2) = ?'])] },
      { title: "The big idea", text: "Multiply the numbers, then check the signs: same signs make a positive answer, and different signs make a negative one.",
        beats: [
          { say: "Multiply the numbers, then check the signs: same signs make a positive answer, and different signs make a negative one.", pic: 0 },
        ],
        pictures: [SIGNS] },
      { title: "Watch a pattern", text: "Look at a pattern instead. 3 × 2 is 6, and 3 × 1 is 3. Keep counting down. 3 × 0 is 0, 3 × (−1) is −3, and 3 × (−2) is −6. Each answer drops by 3. So your score changed by −6.",
        beats: [
          { say: "Look at a pattern instead. 3 × 2 is 6, and 3 × 1 is 3.", pic: 0 },
          { say: "Keep counting down. 3 × 0 is 0, 3 × (−1) is −3, and 3 × (−2) is −6." },
          { say: "Each answer drops by 3. So your score changed by −6." },
        ],
        pictures: [{ kind: 'table', head: ['3 × 2', '3 × 1', '3 × 0', '3 × (−1)', '3 × (−2)'], rows: [['6', '3', '0', '−3', '−6']], motion: true }] },
      { title: "Now start with −3", text: "Now start with −3. −3 × 2 is −6, and −3 × 1 is −3. Keep going. −3 × 0 is 0. What comes next? Each answer goes up by 3. So −3 × (−1) is 3, and −3 × (−2) is 6.",
        beats: [
          { say: "Now start with −3. −3 × 2 is −6, and −3 × 1 is −3.", pic: 0 },
          { say: "Keep going. −3 × 0 is 0. What comes next?" },
          { say: "Each answer goes up by 3. So −3 × (−1) is 3, and −3 × (−2) is 6." },
        ],
        pictures: [{ kind: 'table', head: ['−3 × 2', '−3 × 1', '−3 × 0', '−3 × (−1)', '−3 × (−2)'], rows: [['−6', '−3', '0', '3', '6']], motion: true }] },
      { title: "Just check the signs", text: "Here's the quick way. Multiply 3 × 2 = 6, and forget the signs for a moment. Then look at the signs. 3 × (−2) has different signs, so it's −6. −3 × (−2) has the same signs, so it's 6.",
        beats: [
          { say: "Here's the quick way. Multiply 3 × 2 = 6, and forget the signs for a moment." },
          { say: "Then look at the signs. 3 × (−2) has different signs, so it's −6.", pic: 0 },
          { say: "−3 × (−2) has the same signs, so it's 6.", pic: 1 },
        ],
        pictures: [SIGNS, eq('3 × (−2) = −6', ['−3 × (−2) = 6'])] },
      { title: "One thing not to do", text: "Here's the part people mix up. Two negatives do NOT make a bigger negative. −3 × (−2) is not −6. Same signs give a positive answer, every time. It's 6. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Two negatives do NOT make a bigger negative. −3 × (−2) is not −6.", pic: 0 },
          { say: "Same signs give a positive answer, every time. It's 6." },
          { say: "Okay. Your turn." },
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
    bigIdea: "Dividing uses the same sign rule as multiplying: same signs make a positive answer, and different signs make a negative one.",
    screens: [
      { title: 'A losing streak', text: 'A team lost 12 points over 4 games, the same amount each game. How did its score change in each game?',
        pictures: [{ kind: 'table', head: ['Total change', 'Games', 'Each game'], rows: [['−12', '4', '?']] }] },
      { title: "Is it just 3?", text: "You already know 12 ÷ 4 = 3. But is the answer just 3? A plain 3 would mean the team gained 3 points a game. It lost points, so the answer needs a minus sign.",
        beats: [
          { say: "You already know 12 ÷ 4 = 3. But is the answer just 3?", pic: 0 },
          { say: "A plain 3 would mean the team gained 3 points a game." },
          { say: "It lost points, so the answer needs a minus sign." },
        ],
        pictures: [{ kind: 'table', head: ['Total change', 'Games', 'Each game'], rows: [['−12', '4', '3?']] }] },
      { title: "The big idea", text: "Dividing uses the same sign rule as multiplying: same signs make a positive answer, and different signs make a negative one.",
        beats: [
          { say: "Dividing uses the same sign rule as multiplying: same signs make a positive answer, and different signs make a negative one.", pic: 0 },
        ],
        pictures: [SIGNS] },
      { title: "Undo a multiplication", text: "Dividing undoes multiplying, so turn the question around. 4 times what makes −12? 4 × (−3) is −12. So −12 ÷ 4 = −3. The team lost 3 points a game.",
        beats: [
          { say: "Dividing undoes multiplying, so turn the question around." },
          { say: "4 times what makes −12?" },
          { say: "4 × (−3) is −12. So −12 ÷ 4 = −3. The team lost 3 points a game.", pic: 0 },
        ],
        pictures: [{ kind: 'table', head: ['Divide', 'Check by multiplying'], rows: [['−12 ÷ 4 = −3', '4 × (−3) = −12']], motion: true }] },
      { title: "Two negatives", text: "Now try −12 ÷ (−4). Same question. −4 times what makes −12? It's 3, because −4 × 3 is −12. So −12 ÷ (−4) = 3.",
        beats: [
          { say: "Now try −12 ÷ (−4)." },
          { say: "Same question. −4 times what makes −12?" },
          { say: "It's 3, because −4 × 3 is −12. So −12 ÷ (−4) = 3.", pic: 0 },
        ],
        pictures: [{ kind: 'table', head: ['Divide', 'Check by multiplying'], rows: [['−12 ÷ 4 = −3', '4 × (−3) = −12'], ['−12 ÷ (−4) = 3', '−4 × 3 = −12']], motion: true }] },
      { title: "Just check the signs", text: "So the quick way is the one you used for multiplying. Divide 12 ÷ 4 = 3, then look at the signs. Same signs, it stays 3. Different signs, it's −3.",
        beats: [
          { say: "So the quick way is the one you used for multiplying." },
          { say: "Divide 12 ÷ 4 = 3, then look at the signs.", pic: 0 },
          { say: "Same signs, it stays 3. Different signs, it's −3." },
        ],
        pictures: [{ kind: 'table', head: ['Divide', 'Signs', 'Answer'], rows: [['12 ÷ 4', 'same', '3'], ['−12 ÷ (−4)', 'same', '3'], ['−12 ÷ 4', 'different', '−3'], ['12 ÷ (−4)', 'different', '−3']], motion: true }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't KEEP the minus sign just because both numbers have one. Two negatives divide to a positive. −12 ÷ (−4) is 3. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't KEEP the minus sign just because both numbers have one.", pic: 0 },
          { say: "Two negatives divide to a positive. −12 ÷ (−4) is 3." },
          { say: "Okay. Your turn." },
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
    bigIdea: "Negative fractions and decimals follow the same rules as negative whole numbers, so keep the minus sign all the way through.",
    screens: [
      { title: 'A frog in the pond', text: 'A frog sits 1/2 meter under the water, at −1/2. It jumps up 3/4 meter. Where does it land?',
        pictures: [fourths([{ at: -0.5, label: 'frog' }])] },
      { title: "Where did the frog start?", text: "You might drop the minus sign and add 1/2 + 3/4. That's 5/4. But where did the frog start? Below 0, at −1/2. A jump of 3/4 can't carry it past 1.",
        beats: [
          { say: "You might drop the minus sign and add 1/2 + 3/4. That's 5/4." },
          { say: "But where did the frog start?", pic: 0 },
          { say: "Below 0, at −1/2. A jump of 3/4 can't carry it past 1." },
        ],
        pictures: [fourths([{ at: -0.5, label: 'frog' }])] },
      { title: "The big idea", text: "Negative fractions and decimals follow the same rules as negative whole numbers, so keep the minus sign all the way through.",
        beats: [
          { say: "Negative fractions and decimals follow the same rules as negative whole numbers, so keep the minus sign all the way through.", pic: 0 },
        ],
        pictures: [fourths([{ at: -0.5, label: '−1/2' }])] },
      { title: "Use the same bottom number", text: "To add, both numbers need the same bottom number. Is −1/2 a number of fourths? Yes. −1/2 is −2/4. Now they match: −2/4 + 3/4.",
        beats: [
          { say: "To add, both numbers need the same bottom number." },
          { say: "Is −1/2 a number of fourths? Yes. −1/2 is −2/4.", pic: 0 },
          { say: "Now they match: −2/4 + 3/4.", pic: 1 },
        ],
        pictures: [fourths([{ at: -0.5, label: '−2/4' }], undefined, true), eq('−1/2 + 3/4', ['−2/4 + 3/4'])] },
      { title: "Hop on the line", text: "Put your finger on −2/4. Adding 3/4 means 3 hops of one fourth, to the right. Hop with me: −1/4, 0, 1/4.",
        beats: [
          { say: "Put your finger on −2/4.", pic: 0 },
          { say: "Adding 3/4 means 3 hops of one fourth, to the right." },
          { say: "Hop with me: −1/4, 0, 1/4." },
        ],
        pictures: [fourths([{ at: -0.5, label: 'start' }], [{ from: -0.5, to: 0.25, label: '+3/4' }], true)] },
      { title: "Where it lands", text: "The frog lands on 1/4, just above the water. So −1/2 + 3/4 = 1/4. Decimals work the same way. −2.5 × 4 has different signs, so it's −10.",
        beats: [
          { say: "The frog lands on 1/4, just above the water.", pic: 0 },
          { say: "So −1/2 + 3/4 = 1/4.", pic: 1 },
          { say: "Decimals work the same way. −2.5 × 4 has different signs, so it's −10." },
        ],
        pictures: [fourths([{ at: 0.25, label: '1/4' }], [{ from: -0.5, to: 0.25, label: '+3/4' }]), eq('−1/2 + 3/4 = 1/4', ['−2.5 × 4 = −10'])] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't DROP the minus sign off a fraction or a decimal. It still means left of 0. The frog starts at −1/2, not 1/2. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't DROP the minus sign off a fraction or a decimal.", pic: 0 },
          { say: "It still means left of 0. The frog starts at −1/2, not 1/2." },
          { say: "Okay. Your turn." },
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
    bigIdea: "Up, warmer and gained are positive, down, colder and lost are negative, so give each amount its sign before you do the math.",
    screens: [
      { title: 'A cold morning', text: 'At 6 in the morning it is −5 °C. By noon it is 8 degrees warmer. What is the temperature at noon?',
        pictures: [thermo(-5, -10, 10, 5)] },
      { title: "The words pick the sign", text: "You might grab both numbers and do −5 − 8. That's −13. But −13 is colder than when we started. Does that fit the story? No. The story says warmer. The words tell you which way to go.",
        beats: [
          { say: "You might grab both numbers and do −5 − 8. That's −13.", pic: 0 },
          { say: "But −13 is colder than when we started. Does that fit the story?" },
          { say: "No. The story says warmer. The words tell you which way to go." },
        ],
        pictures: [thermo(-5, -10, 10, 5)] },
      { title: "The big idea", text: "Up, warmer and gained are positive, down, colder and lost are negative, so give each amount its sign before you do the math.",
        beats: [
          { say: "Up, warmer and gained are positive, down, colder and lost are negative, so give each amount its sign before you do the math.", pic: 0 },
        ],
        pictures: [thermo(-5, -10, 10, 5), change([['−5', '+8', '?']])] },
      { title: "Write it with signs", text: "So write it with signs. We start at −5. Warmer means up, so the change is +8. The math is −5 + 8.",
        beats: [
          { say: "So write it with signs. We start at −5.", pic: 0 },
          { say: "Warmer means up, so the change is +8." },
          { say: "The math is −5 + 8.", pic: 1 },
        ],
        pictures: [thermo(-5, -10, 10, 5), change([['−5', '+8', '?']], true)] },
      { title: "Climb the thermometer", text: "Now climb the thermometer with me. Up 5 degrees takes you to 0. That uses 5 of the 8, so 3 are left. Up 3 more, and you're at 3.",
        beats: [
          { say: "Now climb the thermometer with me. Up 5 degrees takes you to 0.", pic: 0 },
          { say: "That uses 5 of the 8, so 3 are left." },
          { say: "Up 3 more, and you're at 3.", pic: 1 },
        ],
        pictures: [thermo(3, -10, 10, 5), { kind: 'table', head: ['From', 'Up', 'To'], rows: [['−5', '5', '0'], ['0', '3', '3']], motion: true }] },
      { title: "Check it makes sense", text: "Last step, always. Does the answer make sense? Warmer should give a higher number, and 3 is higher than −5. So it's 3 °C at noon.",
        beats: [
          { say: "Last step, always. Does the answer make sense?" },
          { say: "Warmer should give a higher number, and 3 is higher than −5.", pic: 0 },
          { say: "So it's 3 °C at noon.", pic: 1 },
        ],
        pictures: [thermo(3, -10, 10, 5), eq('−5 + 8 = 3')] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't COPY the minus sign of the start onto the change. Warmer means add. Colder means take away. −5 + 8 is 3. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't COPY the minus sign of the start onto the change.", pic: 0 },
          { say: "Warmer means add. Colder means take away. −5 + 8 is 3." },
          { say: "Okay. Your turn." },
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

attachChalk(G7M2, G7M2_CHALK)
