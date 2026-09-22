/**
 * Grade 3 · Module 6 — Shapes, measuring and graphs.
 * Written to docs/new-flow/AUTHORING.md. Not yet reviewed by the founder.
 */
import type { Lesson, Picture } from '../script'
import { attachChalk } from '../chalk'
import { G3M6_CHALK } from './chalk/g3m6'

// ── shared pictures ─────────────────────────────────────────────────────────────────────────────
const BOOKS: Picture = { kind: 'chart', type: 'picture', labels: ['Mia', 'Leo', 'Ava'], values: [6, 4, 5], scale: 2, unit: 'books' }
const FRUIT: Picture = { kind: 'chart', type: 'bar', labels: ['Apples', 'Grapes', 'Pears'], values: [20, 35, 15], scale: 5, yLabel: 'Kids' }
const PENCILS = [1, 3, 2, 0, 1]
const PENCIL_LABELS = ['4', '4 1/2', '5', '5 1/2', '6']
const LENGTHS: Picture = { kind: 'table', rows: [['4 1/2', '5', '4', '4 1/2', '6', '5', '4 1/2']] }

const sq: [number, number][] = [[0, 4], [3, 4], [3, 7], [0, 7]]
const rect: [number, number][] = [[5, 4], [10, 4], [10, 7], [5, 7]]
const rhom: [number, number][] = [[0, 0], [3, 0], [4.5, 2.6], [1.5, 2.6]]
const other: [number, number][] = [[6, 0], [10, 0], [9.5, 2.5], [6.5, 1.8]]
const ALL4 = [0, 1, 2, 3]
const SHAPE_CHOICES = ['a square', 'a rectangle but not a square', 'neither']
const TRUE_CHOICES = ['4 equal sides and 4 square corners', '4 equal sides, but the corners are not square', '4 square corners, but the sides are not all equal']

const GARDEN: [number, number][] = [[0, 0], [5, 0], [5, 3], [0, 3]]

export const G3M6: Lesson[] = [
  // ── Topic 1 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g3m6-t1', title: 'Picture graph, each picture = 2', skill: 'Read a picture graph where each picture stands for 2',
    bigIdea: "Each star stands for 2 books, so count the stars by 2s, and a half star is 1.",
    screens: [
      { title: 'Books we read', text: 'This picture graph shows how many books three friends read. How many books did Mia read?',
        pictures: [BOOKS] },
      { title: "Counting stars is not enough", text: "Count Mia's stars. There are 3. So did she read 3 books? No. Look under the graph. It says each star is 2 books.",
        beats: [
          { say: "Count Mia's stars. There are 3.", pic: 0 },
          { say: "So did she read 3 books? No." },
          { say: "Look under the graph. It says each star is 2 books." },
        ],
        pictures: [BOOKS] },
      { title: "The big idea", text: "Each star stands for 2 books, so count the stars by 2s, and a half star is 1.",
        beats: [
          { say: "Each star stands for 2 books, so count the stars by 2s, and a half star is 1.", pic: 0 },
        ],
        pictures: [BOOKS] },
      { title: "Count by 2s", text: "Look at Mia's row. Count her stars by 2s, one star at a time. 2, 4, 6. So Mia read 6 books.",
        beats: [
          { say: "Look at Mia's row.", pic: 0 },
          { say: "Count her stars by 2s, one star at a time." },
          { say: "2, 4, 6. So Mia read 6 books.", pic: 1 },
        ],
        pictures: [{ ...BOOKS, motion: true }, { kind: 'eq', text: '2, 4, 6' }] },
      { title: "Half a star", text: "Now Ava. She has 2 stars and a half star. Count the whole stars. 2, 4. Half a star is half of 2, so it is 1 more. Ava read 5 books.",
        beats: [
          { say: "Now Ava. She has 2 stars and a half star.", pic: 0 },
          { say: "Count the whole stars. 2, 4." },
          { say: "Half a star is half of 2, so it is 1 more. Ava read 5 books.", pic: 1 },
        ],
        pictures: [BOOKS, { kind: 'eq', text: '2 + 2 + 1 = 5' }] },
      { title: "How many more?", text: "How many more books did Mia read than Leo? Mia read 6. Leo has 2 stars. 2, 4. So Leo read 4. How many more means we subtract. 6 − 4 = 2. Mia read 2 more books.",
        beats: [
          { say: "How many more books did Mia read than Leo?", pic: 0 },
          { say: "Mia read 6. Leo has 2 stars. 2, 4. So Leo read 4." },
          { say: "How many more means we subtract. 6 − 4 = 2. Mia read 2 more books.", pic: 1 },
        ],
        pictures: [BOOKS, { kind: 'eq', text: '6 − 4 = 2' }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't count each star as ONE book. Mia's 3 stars are 6 books, not 3. Every star is 2. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't count each star as ONE book.", pic: 0 },
          { say: "Mia's 3 stars are 6 books, not 3. Every star is 2." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '3 stars = 3 books', right: '3 stars = 6 books' }] },
    ],
    turn: {
      text: 'This graph shows the apples three friends picked. How many more apples did Sam pick than Kim?',
      picture: { kind: 'chart', type: 'picture', labels: ['Sam', 'Kim', 'Raj'], values: [8, 3, 6], scale: 2, unit: 'apples' },
      answer: 5,
      steps: ['Each star is 2 apples. Sam has 4 stars: 2, 4, 6, 8. Sam picked 8.', 'Kim has 1 star and a half star: 2, and 1 more is 3.', '8 − 3 = 5. So Sam picked 5 more apples.'],
      prompt: 'Count each row by 2s. Then find how many more.',
      hint1: 'How many apples does one star stand for? Look under the graph.',
      hint2: 'Sam picked 8 apples. How many did Kim pick? A half star is 1.',
      twin: {
        text: 'This graph shows votes for a class color. Each star stands for 2 votes. How many votes are there in all?',
        picture: { kind: 'chart', type: 'picture', labels: ['Red', 'Blue', 'Green'], values: [10, 7, 4], scale: 2, unit: 'votes' },
        answer: 21,
        steps: ['Red has 5 stars: 2, 4, 6, 8, 10. Blue has 3 stars and a half star: 6 and 1 more is 7. Green has 2 stars: 4.', 'Add all three rows: 10 + 7 + 4.', 'So there are 21 votes in all.'],
        hint1: 'Count each row by 2s. A half star is 1.',
        hint2: 'Red has 10 votes. Find Blue and Green, then add all three.',
      },
    },
    won: { text: 'You counted each row by 2s, then found how many more.', sticker: 'Each picture stands for 2. That number is the scale of the graph.' },
    twinWon: { text: 'You counted each row by 2s and added them all.', sticker: 'Each picture stands for 2. That number is the scale of the graph.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'How many more fish are in Tank A than in Tank B?',
        picture: { kind: 'chart', type: 'picture', labels: ['Tank A', 'Tank B'], values: [10, 6], scale: 2, unit: 'fish' },
        answer: 4, steps: ['Tank A has 5 stars: 2, 4, 6, 8, 10.', 'Tank B has 3 stars: 2, 4, 6.', '10 − 6 = 4. So there are 4 more fish in Tank A.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'This graph shows cups of lemonade sold. How many cups were sold on Monday and Tuesday together?',
        picture: { kind: 'chart', type: 'picture', labels: ['Monday', 'Tuesday', 'Wednesday'], values: [12, 7, 9], scale: 2, unit: 'cups' },
        answer: 19, steps: ['Monday has 6 stars. Count by 2s: 2, 4, 6, 8, 10, 12.', 'Tuesday has 3 stars and a half star: 6 and 1 more is 7.', '12 + 7 = 19. So 19 cups were sold.'] } },
      { why: 'Still "each star is 2"', problem: {
        text: 'This graph shows our pets. How many fewer birds are there than cats?',
        picture: { kind: 'chart', type: 'picture', labels: ['Dogs', 'Cats', 'Birds'], values: [9, 14, 5], scale: 2, unit: 'pets' },
        answer: 9, steps: ['Cats has 7 stars. Count by 2s to 14.', 'Birds has 2 stars and a half star: 4 and 1 more is 5.', '14 − 5 = 9. So there are 9 fewer birds.'] } },
      { why: 'A little harder', problem: {
        text: 'This graph shows the club each child chose. How many children chose a club in all?',
        picture: { kind: 'chart', type: 'picture', labels: ['Soccer', 'Tennis', 'Swim', 'Chess'], values: [16, 11, 13, 8], scale: 2, unit: 'children' },
        answer: 48, steps: ['Count each row by 2s. Soccer is 16, Tennis is 11, Swim is 13 and Chess is 8.', '16 + 11 = 27. 27 + 13 = 40.', '40 + 8 = 48. So 48 children chose a club.'] } },
      { why: 'Same math in a story', problem: {
        text: 'Jon made a picture graph of the shells he found. How many more shells did he find on Saturday than on Sunday?',
        picture: { kind: 'chart', type: 'picture', labels: ['Friday', 'Saturday', 'Sunday'], values: [7, 15, 4], scale: 2, unit: 'shells' },
        answer: 11, steps: ['Saturday has 7 stars and a half star: 14 and 1 more is 15.', 'Sunday has 2 stars: 2, 4.', '15 − 4 = 11. So Jon found 11 more shells on Saturday.'] } },
    ],
  },

  // ── Topic 2 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g3m6-t2', title: 'Bar graph', skill: 'Read a bar graph whose numbers count by 2, 5 or 10',
    bigIdea: "Go from the top of the bar straight across to the numbers on the side, and check what they count by.",
    screens: [
      { title: 'Favorite fruit', text: 'A class voted for their favorite fruit. The bars show the votes. How many more kids chose grapes than pears?',
        pictures: [FRUIT] },
      { title: "The lines do not count by 1", text: "Count the lines up the grapes bar. It is 7 lines tall. So did 7 kids choose grapes? No. Look at the numbers up the side. They go 0, 5, 10, 15. Every line is 5 kids.",
        beats: [
          { say: "Count the lines up the grapes bar. It is 7 lines tall.", pic: 0 },
          { say: "So did 7 kids choose grapes? No." },
          { say: "Look at the numbers up the side. They go 0, 5, 10, 15. Every line is 5 kids." },
        ],
        pictures: [FRUIT] },
      { title: "The big idea", text: "Go from the top of the bar straight across to the numbers on the side, and check what they count by.",
        beats: [
          { say: "Go from the top of the bar straight across to the numbers on the side, and check what they count by.", pic: 0 },
        ],
        pictures: [FRUIT] },
      { title: "Across to the side", text: "Put your finger on the top of the grapes bar. Slide it straight across to the side. It lands on 35. So 35 kids chose grapes.",
        beats: [
          { say: "Put your finger on the top of the grapes bar.", pic: 0 },
          { say: "Slide it straight across to the side. It lands on 35." },
          { say: "So 35 kids chose grapes." },
        ],
        pictures: [{ ...FRUIT, motion: true }] },
      { title: "Now the pears", text: "Now the pears. Top of the bar, straight across. It lands on 15. So 15 kids chose pears.",
        beats: [
          { say: "Now the pears.", pic: 0 },
          { say: "Top of the bar, straight across." },
          { say: "It lands on 15. So 15 kids chose pears." },
        ],
        pictures: [FRUIT] },
      { title: "How many more?", text: "So, how many more kids chose grapes than pears? Grapes is 35. Pears is 15. How many more means we subtract. 35 − 15 = 20. So 20 more kids chose grapes.",
        beats: [
          { say: "So, how many more kids chose grapes than pears?", pic: 0 },
          { say: "Grapes is 35. Pears is 15." },
          { say: "How many more means we subtract. 35 − 15 = 20. So 20 more kids chose grapes.", pic: 1 },
        ],
        pictures: [FRUIT, { kind: 'eq', text: '35 − 15 = 20' }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't count the lines by ONES. Each line here is 5 kids, so grapes is 35, not 7. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't count the lines by ONES.", pic: 0 },
          { say: "Each line here is 5 kids, so grapes is 35, not 7." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: 'Grapes: 7', right: 'Grapes: 35' }] },
    ],
    turn: {
      text: 'Three rooms collected cans. How many more cans did Room 1 collect than Room 2?',
      picture: { kind: 'chart', type: 'bar', labels: ['Room 1', 'Room 2', 'Room 3'], values: [35, 15, 25], scale: 5, yLabel: 'Cans' },
      answer: 20,
      steps: ['The numbers on the side count by 5s.', 'Room 1 goes across to 35. Room 2 goes across to 15.', '35 − 15 = 20. So Room 1 collected 20 more cans.'],
      prompt: 'Read each bar across to the side. Then find how many more.',
      hint1: 'What do the numbers on the side count by?',
      hint2: 'Room 1 goes across to 35. Where does Room 2 go across to?',
      twin: {
        text: 'This graph shows birds at a feeder. How many birds came on Monday and Tuesday together?',
        picture: { kind: 'chart', type: 'bar', labels: ['Mon', 'Tue', 'Wed'], values: [12, 6, 10], scale: 2, yLabel: 'Birds' },
        answer: 18,
        steps: ['The numbers on the side count by 2s.', 'Monday goes across to 12. Tuesday goes across to 6.', '12 + 6 = 18. So 18 birds came.'],
        hint1: 'Go from the top of each bar straight across to the numbers on the side.',
        hint2: 'Monday goes across to 12. Where does Tuesday go across to? Then add.',
      },
    },
    won: { text: 'You read each bar across to the side, then found how many more.', sticker: 'The numbers up the side are the scale of a bar graph.' },
    twinWon: { text: 'You read both bars across to the side and added them.', sticker: 'The numbers up the side are the scale of a bar graph.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'How many more kids chose apples than pears?',
        picture: { kind: 'chart', type: 'bar', labels: ['Apples', 'Grapes', 'Pears'], values: [40, 20, 25], scale: 5, yLabel: 'Kids' },
        answer: 15, steps: ['The numbers on the side count by 5s.', 'Apples goes across to 40. Pears goes across to 25.', '40 − 25 = 15. So 15 more kids chose apples.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'This graph shows tickets sold. How many tickets were sold on Saturday and Sunday together?',
        picture: { kind: 'chart', type: 'bar', labels: ['Fri', 'Sat', 'Sun'], values: [40, 70, 50], scale: 10, yLabel: 'Tickets' },
        answer: 120, steps: ['The numbers on the side count by 10s.', 'Saturday goes across to 70. Sunday goes across to 50.', '70 + 50 = 120. So 120 tickets were sold.'] } },
      { why: 'Still "read across to the side"', problem: {
        text: 'This graph shows goals scored. How many fewer goals did the Bears score than the Lions?',
        picture: { kind: 'chart', type: 'bar', labels: ['Lions', 'Bears', 'Hawks'], values: [14, 8, 10], scale: 2, yLabel: 'Goals' },
        answer: 6, steps: ['The numbers on the side count by 2s.', 'Lions goes across to 14. Bears goes across to 8.', '14 − 8 = 6. So the Bears scored 6 fewer goals.'] } },
      { why: 'A little harder', problem: {
        text: 'This graph shows pages read. How many pages did Ann, Ben and Cal read in all?',
        picture: { kind: 'chart', type: 'bar', labels: ['Ann', 'Ben', 'Cal', 'Dee'], values: [40, 30, 60, 50], scale: 10, yLabel: 'Pages' },
        answer: 130, steps: ['The numbers on the side count by 10s.', 'Ann goes across to 40, Ben to 30 and Cal to 60.', '40 + 30 + 60 = 130. So they read 130 pages.'] } },
      { why: 'Same math in a story', problem: {
        text: 'A class counted the cars that drove past the school. How many more red cars than blue cars drove past?',
        picture: { kind: 'chart', type: 'bar', labels: ['Red', 'Blue', 'White'], values: [18, 10, 12], scale: 2, yLabel: 'Cars' },
        answer: 8, steps: ['The numbers on the side count by 2s.', 'Red goes across to 18. Blue goes across to 10.', '18 − 10 = 8. So 8 more red cars drove past.'] } },
    ],
  },

  // ── Topic 3 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g3m6-t3', title: 'Measure to the half inch', skill: 'Measure lengths to the nearest half and quarter inch',
    bigIdea: "Count the whole inches from 0, then add the part of an inch past the last one.",
    screens: [
      { title: 'How long is the crayon?', text: 'The crayon starts at 0 on the ruler. How long is it?',
        pictures: [{ kind: 'measure', tool: 'ruler', max: 4, step: 0.5, labelEvery: 1, value: 2.5, unit: 'inches' }] },
      { title: "It stops between two numbers", text: "Look at the end of the crayon. Does it stop on a number? No. It stops between 2 and 3. So we need a way to say exactly where it stops.",
        beats: [
          { say: "Look at the end of the crayon. Does it stop on a number? No.", pic: 0 },
          { say: "It stops between 2 and 3." },
          { say: "So we need a way to say exactly where it stops." },
        ],
        pictures: [{ kind: 'measure', tool: 'ruler', max: 4, step: 0.5, labelEvery: 1, value: 2.5, unit: 'inches' }] },
      { title: "The big idea", text: "Count the whole inches from 0, then add the part of an inch past the last one.",
        beats: [
          { say: "Count the whole inches from 0, then add the part of an inch past the last one.", pic: 0 },
        ],
        pictures: [{ kind: 'measure', tool: 'ruler', max: 4, step: 0.5, labelEvery: 1, value: 2.5, unit: 'inches' }] },
      { title: "Whole inches first", text: "Start at 0, at the end of the crayon. Go along. Past 1, past 2, but not to 3. That's 2 whole inches, and a bit more.",
        beats: [
          { say: "Start at 0, at the end of the crayon.", pic: 0 },
          { say: "Go along. Past 1, past 2, but not to 3." },
          { say: "That's 2 whole inches, and a bit more." },
        ],
        pictures: [{ kind: 'measure', tool: 'ruler', max: 4, step: 0.5, labelEvery: 1, value: 2.5, unit: 'inches' }] },
      { title: "Then the part past the inch", text: "Now look at the inch from 2 to 3. A middle mark cuts it into 2 equal parts. The crayon stops right on that mark. That's half an inch more. So the crayon is 2 1/2 inches long.",
        beats: [
          { say: "Now look at the inch from 2 to 3.", pic: 0 },
          { say: "A middle mark cuts it into 2 equal parts." },
          { say: "The crayon stops right on that mark. That's half an inch more." },
          { say: "So the crayon is 2 1/2 inches long.", pic: 1 },
        ],
        pictures: [{ kind: 'measure', tool: 'ruler', max: 4, step: 0.5, labelEvery: 1, value: 2.5, unit: 'inches' },
          { kind: 'table', rowHead: true, rows: [['Whole inches', '2'], ['Part past 2', '1/2'], ['Length', '2 1/2 inches']], motion: true }] },
      { title: "Quarter inches", text: "Some rulers cut each inch into 4 equal parts. Each part is 1/4 of an inch. This pencil goes past 1, then 3 parts more. So it is 1 3/4 inches long.",
        beats: [
          { say: "Some rulers cut each inch into 4 equal parts. Each part is 1/4 of an inch.", pic: 0 },
          { say: "This pencil goes past 1, then 3 parts more." },
          { say: "So it is 1 3/4 inches long.", pic: 1 },
        ],
        pictures: [{ kind: 'measure', tool: 'ruler', max: 4, step: 0.25, labelEvery: 1, value: 1.75, unit: 'inches' },
          { kind: 'eq', text: '1 inch and 3/4 more = 1 3/4 inches' }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't count every mark as a WHOLE inch. From 0 to the end are 5 half inches. That's 2 1/2 inches, not 5. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't count every mark as a WHOLE inch.", pic: 0 },
          { say: "From 0 to the end are 5 half inches. That's 2 1/2 inches, not 5." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '5 marks = 5 inches', right: '5 half inches = 2 1/2 inches' }] },
    ],
    turn: {
      text: 'The ribbon starts at 0. How long is the ribbon, to the half inch?',
      picture: { kind: 'measure', tool: 'ruler', max: 5, step: 0.5, labelEvery: 1, value: 3.5, unit: 'inches' },
      answer: { frac: [1, 2], whole: 3 },
      steps: ['The ribbon goes past 3 but not to 4. That is 3 whole inches.', 'It stops at the middle mark between 3 and 4. That is 1/2 inch more.', 'So the ribbon is 3 1/2 inches long.'],
      prompt: 'Count the whole inches. Then add the part past the last one.',
      hint1: 'How many whole inches does the ribbon go past?',
      hint2: 'It goes past 3. Where does it stop in the next inch?',
      twin: {
        text: 'The key starts at 0. How long is the key, to the quarter inch?',
        picture: { kind: 'measure', tool: 'ruler', max: 4, step: 0.25, labelEvery: 1, value: 2.25, unit: 'inches' },
        answer: { frac: [1, 4], whole: 2 },
        steps: ['The key goes past 2 but not to 3. That is 2 whole inches.', 'Then it goes 1 small part more. Each small part is 1/4 inch.', 'So the key is 2 1/4 inches long.'],
        hint1: 'Count the whole inches the key goes past first.',
        hint2: 'Each inch is cut into 4 small parts. How many small parts past the last whole inch does it go?',
      },
    },
    won: { text: 'You counted the whole inches, then added the half inch past them.', sticker: 'Half inch and quarter inch marks let us measure between whole inches.' },
    twinWon: { text: 'You counted the whole inches, then added the quarter inch past them.', sticker: 'A quarter inch is 1/4 of an inch.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'The eraser starts at 0. How long is it, to the half inch?',
        picture: { kind: 'measure', tool: 'ruler', max: 4, step: 0.5, labelEvery: 1, value: 1.5, unit: 'inches' },
        answer: { frac: [1, 2], whole: 1 }, steps: ['The eraser goes past 1 but not to 2. That is 1 whole inch.', 'It stops at the middle mark. That is 1/2 inch more.', 'So the eraser is 1 1/2 inches long.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'The spoon starts at 0. How long is it, to the half inch?',
        picture: { kind: 'measure', tool: 'ruler', max: 6, step: 0.5, labelEvery: 1, value: 4.5, unit: 'inches' },
        answer: { frac: [1, 2], whole: 4 }, steps: ['The spoon goes past 4 but not to 5. That is 4 whole inches.', 'It stops at the middle mark. That is 1/2 inch more.', 'So the spoon is 4 1/2 inches long.'] } },
      { why: 'Still "whole inches, then parts"', problem: {
        text: 'The stick starts at 0. How long is it, to the quarter inch?',
        picture: { kind: 'measure', tool: 'ruler', max: 4, step: 0.25, labelEvery: 1, value: 3.75, unit: 'inches' },
        answer: { frac: [3, 4], whole: 3 }, steps: ['The stick goes past 3 but not to 4. That is 3 whole inches.', 'Then it goes 3 small parts more. 3 quarters is 3/4.', 'So the stick is 3 3/4 inches long.'] } },
      { why: 'A little harder', problem: {
        text: 'The straw starts at 0. How long is it? Use the quarter inch marks.',
        picture: { kind: 'measure', tool: 'ruler', max: 6, step: 0.25, labelEvery: 1, value: 4.5, unit: 'inches' },
        answer: { frac: [1, 2], whole: 4 }, steps: ['The straw goes past 4 but not to 5. That is 4 whole inches.', 'Then it goes 2 small parts more. 2 quarters make a half.', 'So the straw is 4 1/2 inches long.'] } },
      { why: 'Same math in a story', problem: {
        text: 'Lily found a leaf. She lined it up with 0 on her ruler. How long is the leaf, to the quarter inch?',
        picture: { kind: 'measure', tool: 'ruler', max: 5, step: 0.25, labelEvery: 1, value: 3.25, unit: 'inches' },
        answer: { frac: [1, 4], whole: 3 }, steps: ['The leaf goes past 3 but not to 4. That is 3 whole inches.', 'Then it goes 1 small part more. That is 1/4 inch.', 'So the leaf is 3 1/4 inches long.'] } },
    ],
  },

  // ── Topic 4 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g3m6-t4', title: 'Line plot of our measurements', skill: 'Show measurements on a line plot and answer questions',
    bigIdea: "Each ✕ is one thing we measured, sitting above its length, so count the ✕s to answer.",
    screens: [
      { title: 'Our pencils', text: 'We measured 7 pencils. Here are their lengths in inches. How many pencils are longer than 5 inches?',
        pictures: [LENGTHS] },
      { title: "A list is hard to read", text: "Look at the list. The lengths are all jumbled up. Which ones are the same? Which are longer? It's hard to see. So let's build a better picture.",
        beats: [
          { say: "Look at the list. The lengths are all jumbled up.", pic: 0 },
          { say: "Which ones are the same? Which are longer? It's hard to see." },
          { say: "So let's build a better picture." },
        ],
        pictures: [LENGTHS] },
      { title: "The big idea", text: "Each ✕ is one thing we measured, sitting above its length, so count the ✕s to answer.",
        beats: [
          { say: "Each ✕ is one thing we measured, sitting above its length, so count the ✕s to answer.", pic: 0 },
        ],
        pictures: [{ kind: 'chart', type: 'dot', labels: PENCIL_LABELS, values: PENCILS, xLabel: 'Length in inches' }] },
      { title: "Put the lengths in order", text: "First draw a line. Write the lengths along it in order, a half inch apart. 4, 4 1/2, 5, 5 1/2, 6.",
        beats: [
          { say: "First draw a line.", pic: 0 },
          { say: "Write the lengths along it in order, a half inch apart." },
          { say: "4, 4 1/2, 5, 5 1/2, 6." },
        ],
        pictures: [{ kind: 'chart', type: 'dot', labels: PENCIL_LABELS, values: [0, 0, 0, 0, 0], xLabel: 'Length in inches' }] },
      { title: "One ✕ for each pencil", text: "Now take the pencils one at a time. Each pencil gets one ✕, above its own length. 7 pencils, so 7 ✕s in all.",
        beats: [
          { say: "Now take the pencils one at a time.", pic: 0 },
          { say: "Each pencil gets one ✕, above its own length." },
          { say: "7 pencils, so 7 ✕s in all." },
        ],
        pictures: [{ kind: 'chart', type: 'dot', labels: PENCIL_LABELS, values: PENCILS, xLabel: 'Length in inches', motion: true }] },
      { title: "Now count", text: "Which pencils are longer than 5 inches? Look to the right of 5. There's no ✕ above 5 1/2, and 1 ✕ above 6. So 1 pencil is longer than 5 inches.",
        beats: [
          { say: "Which pencils are longer than 5 inches? Look to the right of 5.", pic: 0 },
          { say: "There's no ✕ above 5 1/2, and 1 ✕ above 6." },
          { say: "So 1 pencil is longer than 5 inches." },
        ],
        pictures: [{ kind: 'chart', type: 'dot', labels: PENCIL_LABELS, values: PENCILS, xLabel: 'Length in inches' }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't count the NUMBERS under the line. They are lengths, not pencils. Count the ✕s to find how many. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't count the NUMBERS under the line.", pic: 0 },
          { say: "They are lengths, not pencils. Count the ✕s to find how many." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: '4 1/2 means 4 pencils', right: '3 ✕s means 3 pencils' }] },
    ],
    turn: {
      text: 'We measured some ribbons. How many ribbons are shorter than 2 inches?',
      picture: { kind: 'chart', type: 'dot', labels: ['1', '1 1/2', '2', '2 1/2', '3'], values: [2, 4, 3, 1, 1], xLabel: 'Length in inches' },
      answer: 6,
      steps: ['Shorter than 2 inches means the ✕s to the left of 2.', 'There are 2 ✕s above 1 and 4 ✕s above 1 1/2.', '2 + 4 = 6. So 6 ribbons are shorter than 2 inches.'],
      prompt: 'Find the lengths the question asks about. Then count their ✕s.',
      hint1: 'Which lengths on the line are shorter than 2 inches?',
      hint2: 'Look above 1 and above 1 1/2. Count all those ✕s.',
      twin: {
        text: 'We measured some leaves. How many leaves are longer than 5 1/4 inches?',
        picture: { kind: 'chart', type: 'dot', labels: ['5', '5 1/4', '5 1/2', '5 3/4', '6'], values: [1, 3, 4, 2, 2], xLabel: 'Length in inches' },
        answer: 8,
        steps: ['Longer than 5 1/4 inches means the ✕s to the right of 5 1/4.', 'There are 4 ✕s above 5 1/2, 2 above 5 3/4 and 2 above 6.', '4 + 2 + 2 = 8. So 8 leaves are longer.'],
        hint1: 'Which lengths on the line are longer than 5 1/4 inches?',
        hint2: 'Count every ✕ to the right of 5 1/4.',
      },
    },
    won: { text: 'You found the lengths shorter than 2 inches, then counted their ✕s.', sticker: 'A number line with an ✕ for each measurement is called a line plot.' },
    twinWon: { text: 'You found the lengths longer than 5 1/4 inches, then counted their ✕s.', sticker: 'A number line with an ✕ for each measurement is called a line plot.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'We measured some pencils. How many pencils are longer than 5 inches?',
        picture: { kind: 'chart', type: 'dot', labels: PENCIL_LABELS, values: [2, 1, 3, 2, 1], xLabel: 'Length in inches' },
        answer: 3, steps: ['Longer than 5 inches means the ✕s to the right of 5.', 'There are 2 ✕s above 5 1/2 and 1 above 6.', '2 + 1 = 3. So 3 pencils are longer.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'We measured some crayons. How many crayons did we measure in all?',
        picture: { kind: 'chart', type: 'dot', labels: ['2', '2 1/4', '2 1/2', '2 3/4', '3'], values: [1, 4, 2, 5, 1], xLabel: 'Length in inches' },
        answer: 13, steps: ['Each ✕ is one crayon, so count every ✕.', 'Above the lengths there are 1, 4, 2, 5 and 1.', '1 + 4 + 2 + 5 + 1 = 13. So we measured 13 crayons.'] } },
      { why: 'Still "count the ✕s"', problem: {
        text: 'We measured some shoes. How many shoes are 7 inches long or longer?',
        picture: { kind: 'chart', type: 'dot', labels: ['6', '6 1/2', '7', '7 1/2', '8'], values: [2, 5, 3, 1, 1], xLabel: 'Length in inches' },
        answer: 5, steps: ['7 inches or longer means the ✕s above 7 and to the right of it.', 'There are 3 ✕s above 7, 1 above 7 1/2 and 1 above 8.', '3 + 1 + 1 = 5. So 5 shoes.'] } },
      { why: 'A little harder', problem: {
        text: 'We measured some beetles. How many are longer than 1 1/4 inches but shorter than 2 inches?',
        picture: { kind: 'chart', type: 'dot', labels: ['1', '1 1/4', '1 1/2', '1 3/4', '2'], values: [3, 2, 6, 4, 1], xLabel: 'Length in inches' },
        answer: 10, steps: ['The lengths between 1 1/4 and 2 are 1 1/2 and 1 3/4.', 'There are 6 ✕s above 1 1/2 and 4 above 1 3/4.', '6 + 4 = 10. So 10 beetles.'] } },
      { why: 'Same math in a story', problem: {
        text: 'Nora measured the shells she found at the beach and made this line plot. How many shells are shorter than 3 inches?',
        picture: { kind: 'chart', type: 'dot', labels: ['2', '2 1/2', '3', '3 1/2', '4'], values: [4, 5, 2, 3, 1], xLabel: 'Length in inches' },
        answer: 9, steps: ['Shorter than 3 inches means the ✕s to the left of 3.', 'There are 4 ✕s above 2 and 5 above 2 1/2.', '4 + 5 = 9. So 9 shells are shorter than 3 inches.'] } },
    ],
  },

  // ── Topic 5 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g3m6-t5', title: 'Four-sided shapes', skill: 'Tell squares, rectangles and rhombuses apart by their sides and corners',
    bigIdea: 'Check the sides and the corners. Are all 4 sides the same length? Are all 4 corners square corners?',
    screens: [
      { title: 'Tiles on a wall', text: 'Here are four tiles. Every tile has 4 sides. Are they all the same kind of shape?',
        pictures: [{ kind: 'poly', shapes: [{ pts: sq, tone: 1 }, { pts: rect, tone: 2 }, { pts: rhom, tone: 3 }, { pts: other, tone: 4 }] }] },
      { title: '4 sides is not enough', text: 'Every one of these tiles has 4 sides, and yet they do not look the same at all. So 4 sides on its own does not tell us much. To tell them apart, we have to look closer.',
        beats: [
          { say: 'Every one of these tiles has 4 sides, and yet they do not look the same at all.', pic: 0 },
          { say: 'So 4 sides on its own does not tell us much.', write: '4 sides is not enough' },
          { say: 'To tell them apart, we have to look closer.' },
        ],
        pictures: [{ kind: 'poly', shapes: [{ pts: sq, tone: 1 }, { pts: rect, tone: 2 }, { pts: rhom, tone: 3 }, { pts: other, tone: 4 }] }] },
      { title: 'The big idea', text: 'Check the sides and the corners. Are all 4 sides the same length? Are all 4 corners square corners?',
        beats: [
          { say: 'Check the sides and the corners.', pic: 0 },
          { say: 'Are all 4 sides the same length? Are all 4 corners square corners?' },
        ],
        pictures: [{ kind: 'poly', shapes: [{ pts: sq, tone: 1 }, { pts: rect, tone: 2 }, { pts: rhom, tone: 3 }, { pts: other, tone: 4 }] }] },
      { title: 'Look at the corners', text: 'Start with the corners. A small square drawn in a corner means it is a square corner, like the corner of a book. Look at the top two tiles. All 4 of their corners have that mark.',
        beats: [
          { say: 'Start with the corners.', pic: 0 },
          { say: 'A small square drawn in a corner means it is a square corner, like the corner of a book.', write: 'little square = square corner' },
          { say: 'Look at the top two tiles. All 4 of their corners have that mark.' },
        ],
        pictures: [{ kind: 'poly', motion: true, shapes: [{ pts: sq, tone: 1, right: ALL4 }, { pts: rect, tone: 2, right: ALL4 }, { pts: rhom, tone: 3 }, { pts: other, tone: 4 }] }] },
      { title: 'Look at the sides', text: 'Now the sides. A little tick mark on a side means that side is the same length as the other ticked sides. The top left tile has 4 ticks, and so does the leaning tile. Both of them have 4 equal sides.',
        beats: [
          { say: 'Now the sides.', pic: 0 },
          { say: 'A little tick mark on a side means that side is the same length as the other ticked sides.', write: 'tick mark = equal side' },
          { say: 'The top left tile has 4 ticks, and so does the leaning tile. Both of them have 4 equal sides.' },
        ],
        pictures: [{ kind: 'poly', shapes: [{ pts: sq, tone: 1, right: ALL4, ticks: ALL4 }, { pts: rect, tone: 2, right: ALL4 }, { pts: rhom, tone: 3, ticks: ALL4 }, { pts: other, tone: 4 }] }] },
      { title: 'Put it together', text: "Let's put all of that in one place. A square has 4 equal sides and 4 square corners, both boxes ticked. A rectangle has the 4 square corners, but its sides are not all equal. The leaning tile is the other way around: 4 equal sides, but no square corners.",
        beats: [
          { say: "Let's put all of that in one place.", pic: 0 },
          { say: 'A square has 4 equal sides and 4 square corners, both boxes ticked.' },
          { say: 'A rectangle has the 4 square corners, but its sides are not all equal.' },
          { say: 'The leaning tile is the other way around: 4 equal sides, but no square corners.' },
        ],
        pictures: [{ kind: 'table', head: ['Tile', '4 equal sides?', '4 square corners?'], rows: [['square', 'yes', 'yes'], ['rectangle', 'no', 'yes'], ['leaning tile', 'yes', 'no']], motion: true }] },
      { title: 'One thing not to do', text: "Here is the one that surprises people. Don't say a square is not a rectangle. A square has 4 square corners, so it counts as a rectangle too. It is a rectangle with 4 equal sides.",
        beats: [
          { say: 'Here is the one that surprises people.' },
          { say: "Don't say a square is not a rectangle.", pic: 0 },
          { say: 'A square has 4 square corners, so it counts as a rectangle too. It is a rectangle with 4 equal sides.' },
        ],
        pictures: [{ kind: 'cards', wrong: 'A square is not a rectangle', right: 'A square is a rectangle with 4 equal sides' }] },
    ],
    turn: {
      text: 'What shape is this tile?',
      picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [6, 0], [6, 3], [0, 3]], right: ALL4, sides: ['6 in', '3 in', '6 in', '3 in'], tone: 2 }] },
      answer: { choices: SHAPE_CHOICES, correct: 1 },
      steps: ['All 4 corners are square corners.', 'The sides are 6, 3, 6 and 3 inches. They are not all the same length, so it is not a square.', 'So it is a rectangle but not a square.'],
      prompt: 'Check the corners. Then check the sides.',
      hint1: 'Look at the corners first. Are they all square corners?',
      hint2: 'Now look at the sides. Are all 4 sides the same length?',
      twin: {
        text: 'What is true about this shape?',
        picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [3, 0], [4.5, 2.6], [1.5, 2.6]], ticks: ALL4, tone: 3 }] },
        answer: { choices: TRUE_CHOICES, correct: 1 },
        steps: ['The marks show that all 4 sides are the same length.', 'There are no square corners. The shape leans over.', 'So: 4 equal sides, but the corners are not square.'],
        hint1: 'Look at the little marks on the sides. What do they tell you?',
        hint2: 'Now look at the corners. Do you see a small square in any corner?',
      },
    },
    won: { text: 'You checked the corners, then the sides, before you named it.', sticker: 'Any shape with 4 sides is a quadrilateral. A shape with 4 equal sides is a rhombus.' },
    twinWon: { text: 'You checked the sides and the corners before you chose.', sticker: 'A shape with 4 equal sides is a rhombus. Squares, rectangles and rhombuses are all quadrilaterals.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'What shape is this tile?',
        picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [3, 0], [3, 3], [0, 3]], right: ALL4, ticks: ALL4, tone: 1 }] },
        answer: { choices: SHAPE_CHOICES, correct: 0 },
        steps: ['All 4 corners are square corners.', 'The marks show all 4 sides are the same length.', 'So it is a square.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'What is true about this shape?',
        picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [2.6, 1.5], [2.6, 4.5], [0, 3]], ticks: ALL4, tone: 3 }] },
        answer: { choices: TRUE_CHOICES, correct: 1 },
        steps: ['The marks show all 4 sides are the same length.', 'None of the corners is a square corner.', 'So: 4 equal sides, but the corners are not square.'] } },
      { why: 'Still "check sides and corners"', problem: {
        text: 'What shape is this tile?',
        picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [5, 0], [4, 3], [0.5, 2]], tone: 4 }] },
        answer: { choices: SHAPE_CHOICES, correct: 2 },
        steps: ['None of the corners is a square corner, so it is not a rectangle or a square.', 'The sides are not all the same length either.', 'It has 4 sides, but it is neither.'] } },
      { why: 'A little harder', problem: {
        text: 'This shape has 4 square corners and 4 equal sides. Which name fits it?',
        picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [4, 0], [4, 4], [0, 4]], right: ALL4, ticks: ALL4, tone: 1 }] },
        answer: { choices: ['square only', 'rectangle only', 'square and rectangle'], correct: 2 },
        steps: ['4 square corners make it a rectangle.', '4 equal sides as well make it a square.', 'Both names fit, so the answer is square and rectangle.'] } },
      { why: 'Same math in a story', problem: {
        text: 'A door is 7 feet tall and 3 feet wide. It has 4 square corners. What shape is the door?',
        picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [3, 0], [3, 7], [0, 7]], right: ALL4, sides: ['3 ft', '7 ft', '3 ft', '7 ft'], tone: 2 }] },
        answer: { choices: SHAPE_CHOICES, correct: 1 },
        steps: ['The door has 4 square corners.', 'Its sides are 7 feet and 3 feet, so they are not all the same length.', 'So the door is a rectangle but not a square.'] } },
    ],
  },

  // ── Topic 6 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g3m6-t6', title: 'Walk around the fence', skill: 'Find the distance around a shape by adding its sides',
    bigIdea: 'The distance around a shape is all of its sides added together.',
    screens: [
      { title: 'A fence for the garden', text: 'Sam wants a fence all the way around his garden. How many feet of fence does he need?',
        pictures: [{ kind: 'poly', shapes: [{ pts: GARDEN, sides: ['5 ft', '3 ft', '5 ft', '3 ft'], right: ALL4, tone: 1 }] }] },
      { title: 'Around the edge', text: 'Think about where the fence actually goes. It runs all the way around the edge of the garden, not across the middle. So what we need is how long that whole edge is.',
        beats: [
          { say: 'Think about where the fence actually goes.', pic: 0 },
          { say: 'It runs all the way around the edge of the garden, not across the middle.', write: 'fence → around the edge' },
          { say: 'So what we need is how long that whole edge is.' },
        ],
        pictures: [{ kind: 'poly', shapes: [{ pts: GARDEN, sides: ['5 ft', '3 ft', '5 ft', '3 ft'], right: ALL4, tone: 1 }] }] },
      { title: 'The big idea', text: 'The distance around a shape is all of its sides added together.',
        beats: [
          { say: 'The distance around a shape is all of its sides added together.', pic: 0 },
        ],
        pictures: [{ kind: 'poly', shapes: [{ pts: GARDEN, sides: ['5 ft', '3 ft', '5 ft', '3 ft'], right: ALL4, tone: 1 }] }] },
      { title: 'Walk around', text: "Let's walk it together. Start at one corner and follow every side all the way back to where you started. 5 feet, 3 feet, 5 feet, 3 feet, and we are home.",
        beats: [
          { say: "Let's walk it together.", pic: 0 },
          { say: 'Start at one corner and follow every side all the way back to where you started.', write: 'finish where you started' },
          { say: '5 feet, 3 feet, 5 feet, 3 feet, and we are home.' },
        ],
        pictures: [{ kind: 'poly', motion: true, shapes: [{ pts: GARDEN, sides: ['5 ft', '3 ft', '5 ft', '3 ft'], right: ALL4, tone: 1 }],
          segs: [{ a: [0, 0], b: [5, 0], arrow: 'end', tone: 2 }, { a: [5, 0], b: [5, 3], arrow: 'end', tone: 2 }, { a: [5, 3], b: [0, 3], arrow: 'end', tone: 2 }, { a: [0, 3], b: [0, 0], arrow: 'end', tone: 2 }] }] },
      { title: 'Add the sides', text: 'Now add up every side you walked. All 4 of them, not just the two different numbers. 5 + 3 + 5 + 3 = 16. So Sam needs 16 feet of fence.',
        beats: [
          { say: 'Now add up every side you walked.', pic: 0 },
          { say: 'All 4 of them, not just the two different numbers.', write: 'add all 4 sides' },
          { say: '5 + 3 + 5 + 3 = 16. So Sam needs 16 feet of fence.', pic: 1 },
        ],
        pictures: [{ kind: 'poly', shapes: [{ pts: GARDEN, sides: ['5 ft', '3 ft', '5 ft', '3 ft'], right: ALL4, tone: 1 }] }, { kind: 'eq', text: '5 + 3 + 5 + 3 = 16' }] },
      { title: 'A side with no number', text: 'Sometimes a side is left blank, like this one with a question mark on it. In a rectangle, the sides across from each other are always the same length. The side across from the ? is 5 feet, so the ? is 5 feet too.',
        beats: [
          { say: 'Sometimes a side is left blank, like this one with a question mark on it.', pic: 0 },
          { say: 'In a rectangle, the sides across from each other are always the same length.', write: 'opposite sides match' },
          { say: 'The side across from the ? is 5 feet, so the ? is 5 feet too.' },
        ],
        pictures: [{ kind: 'poly', shapes: [{ pts: GARDEN, sides: ['5 ft', '3 ft', '?', '3 ft'], right: ALL4, tone: 1 }] }] },
      { title: 'One thing not to do', text: "Here is the slip to avoid. Don't add just two sides. 5 + 3 only takes you halfway around the garden. Walk all 4 sides, every time.",
        beats: [
          { say: 'Here is the slip to avoid.' },
          { say: "Don't add just two sides.", pic: 0 },
          { say: '5 + 3 only takes you halfway around the garden. Walk all 4 sides, every time.' },
        ],
        pictures: [{ kind: 'cards', wrong: '5 + 3 = 8 feet', right: '5 + 3 + 5 + 3 = 16 feet' }] },
    ],
    turn: {
      text: 'How many feet of fence go all the way around this garden?',
      picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [6, 0], [6, 4], [0, 4]], sides: ['6 ft', '4 ft', '6 ft', '4 ft'], right: ALL4, tone: 1 }] },
      answer: 20,
      steps: ['Walk around the garden and add every side.', '6 + 4 + 6 + 4.', 'So the fence is 20 feet long.'],
      prompt: 'Walk around the shape. Add every side.',
      hint1: 'How many sides does the garden have? Add all of them.',
      hint2: 'Start with 6 + 4. Then add the other two sides.',
      twin: {
        text: 'This garden has 3 sides. How many feet is it all the way around?',
        picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [4, 0], [0, 3]], sides: ['4 ft', '5 ft', '3 ft'], right: [0], tone: 1 }] },
        answer: 12,
        steps: ['Walk around and add all 3 sides.', '4 + 5 + 3.', 'So it is 12 feet all the way around.'],
        hint1: 'Walk around the shape. Add every side you walk along.',
        hint2: 'Start with 4 + 5. Then add the last side.',
      },
    },
    won: { text: 'You walked all the way around and added every side.', sticker: 'The distance around a shape is called its perimeter.' },
    twinWon: { text: 'You walked all 3 sides and added them.', sticker: 'The distance around a shape is called its perimeter.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'How many feet of fence go all the way around this garden?',
        picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [8, 0], [8, 3], [0, 3]], sides: ['8 ft', '3 ft', '8 ft', '3 ft'], right: ALL4, tone: 1 }] },
        answer: 22, steps: ['Add every side.', '8 + 3 + 8 + 3.', 'So the fence is 22 feet long.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'How many inches is it all the way around this square?',
        picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [6, 0], [6, 6], [0, 6]], sides: ['6 in', '6 in', '6 in', '6 in'], right: ALL4, tone: 2 }] },
        answer: 24, steps: ['A square has 4 sides, and each is 6 inches.', '6 + 6 + 6 + 6.', 'So it is 24 inches around.'] } },
      { why: 'Still "add every side"', problem: {
        text: 'This shape has 5 sides. How many inches is it all the way around?',
        picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [4, 0], [5, 3], [2, 5], [-1, 3]], sides: ['4 in', '3 in', '4 in', '4 in', '3 in'], tone: 3 }] },
        answer: 18, steps: ['Walk around and add all 5 sides.', '4 + 3 + 4 + 4 + 3.', 'So it is 18 inches around.'] } },
      { why: 'A little harder', problem: {
        text: 'The fence all the way around this garden is 22 feet. How long is the side marked ?',
        picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [7, 0], [6, 4], [1.5, 5.8]], sides: ['7 ft', '4 ft', '5 ft', '?'], tone: 1 }] },
        answer: 6, steps: ['Add the sides you know: 7 + 4 + 5 = 16.', 'All 4 sides together make 22 feet. 22 − 16 is the side that is left.', 'So the side marked ? is 6 feet.'] } },
      { why: 'Same math in a story', problem: {
        text: 'Ms. Lee puts ribbon around the edge of a square picture frame. Each side is 9 inches. How many inches of ribbon does she need?',
        picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [9, 0], [9, 9], [0, 9]], sides: ['9 in', null, null, null], right: ALL4, ticks: ALL4, tone: 2 }] },
        answer: 36, steps: ['A square has 4 sides, and each is 9 inches.', '9 + 9 + 9 + 9.', 'So she needs 36 inches of ribbon.'] } },
    ],
  },

  // ── Topic 7 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g3m6-t7', title: 'Same fence, different garden', skill: 'Rectangles with the same perimeter can have different areas',
    bigIdea: 'Two gardens can have the same fence around them but hold a different number of squares inside.',
    screens: [
      { title: 'Two gardens, same fence', text: 'Both gardens use 12 feet of fence. Do they have the same room inside for plants?',
        pictures: [{ kind: 'grid', rows: 1, cols: 5, top: '5 ft', left: '1 ft' }, { kind: 'grid', rows: 2, cols: 4, top: '4 ft', left: '2 ft' }] },
      { title: 'Same fence, same inside?', text: 'It feels obvious, does it not? Same fence, so the same room inside. But feeling sure is not the same as knowing, so let us count and check.',
        beats: [
          { say: 'It feels obvious, does it not? Same fence, so the same room inside.', pic: 0 },
          { say: 'But feeling sure is not the same as knowing, so let us count and check.', pic: 1 },
        ],
        pictures: [{ kind: 'grid', rows: 1, cols: 5, top: '5 ft', left: '1 ft' }, { kind: 'grid', rows: 2, cols: 4, top: '4 ft', left: '2 ft' }] },
      { title: 'The big idea', text: 'Two gardens can have the same fence around them but hold a different number of squares inside.',
        beats: [
          { say: 'Two gardens can have the same fence around them but hold a different number of squares inside.' },
        ],
        pictures: [{ kind: 'grid', rows: 1, cols: 5, top: '5 ft', left: '1 ft' }, { kind: 'grid', rows: 2, cols: 4, top: '4 ft', left: '2 ft' }] },
      { title: 'Walk the fence', text: 'First we check that the fences really are the same. Walk around the long thin garden: 5 + 1 + 5 + 1 = 12. Now the wider one: 4 + 2 + 4 + 2 = 12. Both fences are 12 feet.',
        beats: [
          { say: 'First we check that the fences really are the same.' },
          { say: 'Walk around the long thin garden: 5 + 1 + 5 + 1 = 12.', pic: 0 },
          { say: 'Now the wider one: 4 + 2 + 4 + 2 = 12.', pic: 1 },
          { say: 'Both fences are 12 feet.', pic: 2 },
        ],
        pictures: [{ kind: 'grid', rows: 1, cols: 5, top: '5 ft', left: '1 ft' }, { kind: 'grid', rows: 2, cols: 4, top: '4 ft', left: '2 ft' },
          { kind: 'eq', text: '5 + 1 + 5 + 1 = 12', lines: ['4 + 2 + 4 + 2 = 12'] }] },
      { title: 'Count the squares inside', text: 'Now count what is inside each one. The long thin garden is one row of 5, so it holds 5 squares. The wider garden has 2 rows of 4, and that is 8 squares. Same fence, and not the same room inside at all.',
        beats: [
          { say: 'Now count what is inside each one.' },
          { say: 'The long thin garden is one row of 5, so it holds 5 squares.', pic: 0 },
          { say: 'The wider garden has 2 rows of 4, and that is 8 squares.', pic: 1 },
          { say: 'Same fence, and not the same room inside at all.', write: 'same fence, different inside' },
        ],
        pictures: [{ kind: 'grid', rows: 1, cols: 5, top: '5 ft', left: '1 ft', shade: [{ r: 0, c: 0, h: 1, w: 5, tone: 1 }], motion: true },
          { kind: 'grid', rows: 2, cols: 4, top: '4 ft', left: '2 ft', shade: [{ r: 0, c: 0, h: 2, w: 4, tone: 2 }], motion: true }] },
      { title: 'One more garden', text: "Let's try one more. A garden 3 feet by 3 feet uses 12 feet of fence too. Count inside: 3 rows of 3, which is 9 squares. That is the most room of all three, and it is the square one.",
        beats: [
          { say: "Let's try one more." },
          { say: 'A garden 3 feet by 3 feet uses 12 feet of fence too.', pic: 0 },
          { say: 'Count inside: 3 rows of 3, which is 9 squares.' },
          { say: 'That is the most room of all three, and it is the square one.', write: 'the squarest shape holds the most' },
        ],
        pictures: [{ kind: 'grid', rows: 3, cols: 3, top: '3 ft', left: '3 ft', shade: [{ r: 0, c: 0, h: 3, w: 3, tone: 3 }], motion: true }] },
      { title: 'One thing not to do', text: "So here is the thing to remember. Don't think the same fence means the same room inside. Count the squares every time to check.",
        beats: [
          { say: 'So here is the thing to remember.' },
          { say: "Don't think the same fence means the same room inside.", pic: 0 },
          { say: 'Count the squares every time to check.' },
        ],
        pictures: [{ kind: 'cards', wrong: '12 feet of fence → always the same inside', right: '12 feet of fence → 5, 8 or 9 squares inside' }] },
    ],
    turn: {
      text: 'Both gardens have 16 feet of fence. Garden A is 7 feet by 1 foot. Garden B is 5 feet by 3 feet. How many more squares does Garden B hold than Garden A?',
      picture: { kind: 'grid', rows: 3, cols: 13, shade: [{ r: 0, c: 0, h: 1, w: 7, tone: 1 }, { r: 0, c: 8, h: 3, w: 5, tone: 2 }],
        hide: [{ r: 1, c: 0, h: 2, w: 7 }, { r: 0, c: 7, h: 3, w: 1 }] },
      answer: 8,
      steps: ['Both fences are 16 feet: 7 + 1 + 7 + 1 and 5 + 3 + 5 + 3.', 'Garden A holds 7 squares. Garden B has 3 rows of 5, so it holds 15 squares.', '15 − 7 = 8. So Garden B holds 8 more squares.'],
      prompt: 'Count the squares inside each garden. Then compare.',
      hint1: 'Count the squares inside each garden.',
      hint2: 'Garden A holds 7 squares. Garden B has 3 rows of 5. How many is that?',
      twin: {
        text: 'Both gardens have 20 feet of fence. Garden A is 9 feet by 1 foot. Garden B is 5 feet by 5 feet. How many more squares does Garden B hold than Garden A?',
        picture: { kind: 'grid', rows: 5, cols: 15, shade: [{ r: 0, c: 0, h: 1, w: 9, tone: 1 }, { r: 0, c: 10, h: 5, w: 5, tone: 2 }],
          hide: [{ r: 1, c: 0, h: 4, w: 9 }, { r: 0, c: 9, h: 5, w: 1 }] },
        answer: 16,
        steps: ['Both fences are 20 feet: 9 + 1 + 9 + 1 and 5 + 5 + 5 + 5.', 'Garden A holds 9 squares. Garden B has 5 rows of 5, so it holds 25 squares.', '25 − 9 = 16. So Garden B holds 16 more squares.'],
        hint1: 'Count or multiply to find the squares inside each garden.',
        hint2: 'Garden A holds 9 squares. Garden B has 5 rows of 5. How many is that?',
      },
    },
    won: { text: 'Same fence, but the two gardens hold a different number of squares.', sticker: 'The fence around is the perimeter. The squares inside are the area.' },
    twinWon: { text: 'Same 20 feet of fence, but Garden B holds many more squares.', sticker: 'The fence around is the perimeter. The squares inside are the area.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'Both gardens have 12 feet of fence. Garden A is 5 feet by 1 foot. Garden B is 4 feet by 2 feet. How many more squares does Garden B hold?',
        picture: { kind: 'grid', rows: 2, cols: 10, shade: [{ r: 0, c: 0, h: 1, w: 5, tone: 1 }, { r: 0, c: 6, h: 2, w: 4, tone: 2 }],
          hide: [{ r: 1, c: 0, h: 1, w: 5 }, { r: 0, c: 5, h: 2, w: 1 }] },
        answer: 3, steps: ['Garden A holds 5 squares.', 'Garden B has 2 rows of 4, so it holds 8 squares.', '8 − 5 = 3. So Garden B holds 3 more squares.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'This garden is 5 feet long and 3 feet wide. How many feet of fence go around it?',
        picture: { kind: 'grid', rows: 3, cols: 5, top: '5 ft', left: '3 ft' },
        answer: 16, steps: ['The fence goes around the edge, so add all 4 sides. Do not count the squares inside.', '5 + 3 + 5 + 3.', 'So 16 feet of fence go around it.'] } },
      { why: 'Still "fence around, squares inside"', problem: {
        text: 'Both gardens have 16 feet of fence. Garden A is 6 feet by 2 feet. Garden B is 4 feet by 4 feet. Which garden holds more squares?',
        picture: { kind: 'grid', rows: 4, cols: 11, shade: [{ r: 0, c: 0, h: 2, w: 6, tone: 1 }, { r: 0, c: 7, h: 4, w: 4, tone: 2 }],
          hide: [{ r: 2, c: 0, h: 2, w: 6 }, { r: 0, c: 6, h: 4, w: 1 }] },
        answer: { choices: ['Garden A', 'Garden B', 'They hold the same'], correct: 1 },
        steps: ['Garden A has 2 rows of 6, so it holds 12 squares.', 'Garden B has 4 rows of 4, so it holds 16 squares.', '16 is more than 12, so the answer is Garden B.'] } },
      { why: 'A little harder', problem: {
        text: 'This garden has 18 feet of fence. Another garden has the same 18 feet of fence and is 5 feet long. How many squares does the other garden hold?',
        picture: { kind: 'grid', rows: 1, cols: 8, top: '8 ft', left: '1 ft' },
        answer: 20, steps: ['The other garden has two long sides of 5 feet: 5 + 5 = 10 feet of fence.', '18 − 10 = 8 feet are left for the two short sides, so each short side is 4 feet.', 'It is 5 feet by 4 feet, and 5 × 4 = 20. So it holds 20 squares.'] } },
      { why: 'Same math in a story', problem: {
        text: 'Kai has 10 feet of fence for a rabbit pen. He can make it 4 feet by 1 foot, or 3 feet by 2 feet. Which pen gives the rabbit more squares of room?',
        picture: { kind: 'grid', rows: 2, cols: 8, shade: [{ r: 0, c: 0, h: 1, w: 4, tone: 1 }, { r: 0, c: 5, h: 2, w: 3, tone: 2 }],
          hide: [{ r: 1, c: 0, h: 1, w: 4 }, { r: 0, c: 4, h: 2, w: 1 }] },
        answer: { choices: ['4 feet by 1 foot', '3 feet by 2 feet', 'They are the same'], correct: 1 },
        steps: ['Both pens use 10 feet of fence.', 'The 4 by 1 pen holds 4 squares. The 3 by 2 pen holds 6 squares.', '6 is more, so the answer is 3 feet by 2 feet.'] } },
    ],
  },
]

attachChalk(G3M6, G3M6_CHALK)
