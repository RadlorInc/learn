/**
 * Grade 8 · Module 6 — Bivariate data and scatter plots.
 * Written to docs/new-flow/AUTHORING.md. Not yet reviewed by the founder.
 * Question pictures show the DATA (that is the question); a computed slope, prediction, count or share is never printed.
 */
import type { Lesson, Picture } from '../script'
import { attachChalk } from '../chalk'
import { G8M6_CHALK } from './chalk/g8m6'

type Pt = [number, number]
const plot = (points: Pt[], xMax: number, yMax: number, xLabel: string, yLabel: string, extra: Partial<Extract<Picture, { kind: 'plot' }>> = {}): Picture =>
  ({ kind: 'plot', points, xMax, yMax, xLabel, yLabel, ...extra })
/** Dots that sit alternately `d` below and `d` above the line y = m·x + b — half above, half below. */
const around = (m: number, b: number, xs: number[], d: number): Pt[] => xs.map((x, i) => [x, b + m * x + (i % 2 ? d : -d)])
const table = (head: string[], rows: string[][], mark?: [number, number][], motion = false): Picture =>
  ({ kind: 'table', head, rows, rowHead: true, mark, motion })

// ── Topic 1 pictures ──
const PATTERN = ['positive', 'negative', 'no pattern']
const STUDY_PTS: Pt[] = [[1, 55], [1, 60], [2, 62], [2, 70], [3, 68], [3, 75], [4, 78], [4, 82], [5, 85], [5, 90], [6, 92]]
const study = (extra: Partial<Extract<Picture, { kind: 'plot' }>> = {}, pts = STUDY_PTS): Picture =>
  plot(pts, 6, 100, 'Hours studied', 'Test score', { xStep: 1, yStep: 10, ...extra })
const SLEEP = (motion = false) => plot([[1, 10], [2, 9.5], [2, 9], [3, 9], [4, 8], [4, 8.5], [5, 7.5], [6, 7], [6, 6.5], [7, 6]], 8, 12, 'Hours of screen time', 'Hours of sleep', { xStep: 1, yStep: 2, motion })
const SHOES = plot([[5, 80], [6, 60], [6, 90], [7, 70], [7, 85], [8, 65], [8, 95], [9, 75], [10, 62], [10, 88]], 12, 100, 'Shoe size', 'Test score', { xStep: 1, yStep: 10 })

// ── Topic 2 pictures ──
const FIT_PTS: Pt[] = [[1, 55], [1, 62], [2, 60], [2, 68], [3, 68], [3, 72], [4, 75], [4, 82], [5, 82], [5, 88]]
const fitStudy = (fit?: [Pt, Pt], motion = false): Picture => study({ fit, motion }, FIT_PTS)
const PAIRS = (n: number) => Array.from({ length: n * 2 }, (_, i) => Math.floor(i / 2) + 1)

// ── Topic 3 pictures ──
const LINE_STUDY = (motion = false): Picture =>
  plot(around(5, 50, PAIRS(5), 4), 8, 100, 'Hours studied', 'Test score', { xStep: 1, yStep: 10, fit: [[0, 50], [8, 90]], motion })
const rule = (line: string, x: string): Picture => ({ kind: 'eq', text: line, lines: [x] })

// ── Topic 4 + 5 pictures ──
const PIZZA_HEAD = ['', 'Likes pizza', 'Does not', 'Total']
const PIZZA = [['Grade 7', '12', '8', '20'], ['Grade 8', '15', '5', '20'], ['Total', '27', '13', '40']]
const SHARE = [['Grade 7', '12', '8', '20'], ['Grade 8', '15', '15', '30'], ['Total', '27', '23', '50']]

export const G8M6: Lesson[] = [
  // ── Topic 1 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g8m6-t1', title: 'Scatter plot patterns', skill: 'Tell whether a scatter plot shows a positive pattern, a negative pattern or no pattern',
    bigIdea: "Read the whole cloud from left to right, and if it rises the pattern is positive, but if it falls it is negative.",
    screens: [
      { title: 'Does studying pay off?', text: 'Each dot is one student: how many hours they studied, and the score they got. Do students who study more get higher scores?',
        pictures: [study()] },
      { title: "Can two dots decide?", text: "Can two students settle it? Look at these two. This one studied 2 hours and got 70. This one studied an hour more and got 68. So two dots can show almost anything.",
        beats: [
          { say: "Can two students settle it? Look at these two.", pic: 0 },
          { say: "This one studied 2 hours and got 70. This one studied an hour more and got 68." },
          { say: "So two dots can show almost anything." },
        ],
        pictures: [study()] },
      { title: "The big idea", text: "Read the whole cloud from left to right, and if it rises the pattern is positive, but if it falls it is negative.",
        beats: [
          { say: "Read the whole cloud from left to right, and if it rises the pattern is positive, but if it falls it is negative.", pic: 0 },
        ],
        pictures: [study()] },
      { title: "Watch the cloud rise", text: "Now read this cloud left to right. At 1 hour the scores are 55 and 60. At 6 hours, 92. Do the scores climb as the hours go up? Yes, so this pattern is positive.",
        beats: [
          { say: "Now read this cloud left to right.", pic: 0 },
          { say: "At 1 hour the scores are 55 and 60. At 6 hours, 92." },
          { say: "Do the scores climb as the hours go up? Yes, so this pattern is positive." },
        ],
        pictures: [study({ motion: true })] },
      { title: "Falling, or no shape at all", text: "Not every cloud rises. More screen time goes with less sleep. These dots fall, so the pattern is negative. And shoe size against test score? The dots are scattered everywhere. No rise and no fall means no pattern at all.",
        beats: [
          { say: "Not every cloud rises. More screen time goes with less sleep.", pic: 0 },
          { say: "These dots fall, so the pattern is negative." },
          { say: "And shoe size against test score? The dots are scattered everywhere.", pic: 1 },
          { say: "No rise and no fall means no pattern at all." },
        ],
        pictures: [SLEEP(true), SHOES] },
      { title: "A dot far from the rest", text: "Look at this one, way up here. 1 hour of study, and a score of 95. It sits far from the others. Does it change the pattern? No. Notice it, but read the whole cloud, and this cloud still rises.",
        beats: [
          { say: "Look at this one, way up here. 1 hour of study, and a score of 95.", pic: 0 },
          { say: "It sits far from the others. Does it change the pattern?" },
          { say: "No. Notice it, but read the whole cloud, and this cloud still rises." },
        ],
        pictures: [study({}, [...STUDY_PTS, [1, 95]])] },
      { title: "One thing not to do", text: "Here's the part people mix up. When the dots fall, don't call it NO pattern. Falling dots are a pattern, a negative one. No pattern means no rise and no fall. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "When the dots fall, don't call it NO pattern.", pic: 0 },
          { say: "Falling dots are a pattern, a negative one. No pattern means no rise and no fall." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: 'Dots fall → no pattern', right: 'Dots fall → negative pattern' }] },
    ],
    turn: {
      text: 'Each dot is one day at a cafe: the temperature and the cups of hot chocolate sold. What pattern does the plot show?',
      picture: plot([[30, 55], [35, 50], [40, 48], [45, 42], [50, 40], [55, 33], [60, 30], [65, 25], [70, 20], [75, 18], [80, 12]], 90, 60, 'Temperature (°F)', 'Cups sold', { xStep: 10, yStep: 10 }),
      answer: { choices: PATTERN, correct: 1 },
      steps: ['Read the dots from left to right.', 'As the temperature goes up, the cups sold go down. The dots fall.', 'So the pattern is negative.'],
      prompt: 'Look at the whole cloud. Does it rise, fall, or neither?',
      hint1: 'Start at the left dots and move right. Are the dots getting higher or lower?',
      hint2: 'When one goes up and the other goes down, which pattern is that?',
      twin: {
        text: 'Each dot is one of 12 students: the month they were born and their math score. What pattern does the plot show?',
        picture: plot([[1, 70], [2, 95], [3, 60], [4, 85], [5, 75], [6, 65], [7, 90], [8, 70], [9, 80], [10, 60], [11, 95], [12, 75]], 12, 100, 'Birth month', 'Math score', { xStep: 1, yStep: 10 }),
        answer: { choices: PATTERN, correct: 2 },
        steps: ['Read the dots from left to right.', 'High and low scores are spread across every month. The cloud does not rise or fall.', 'So there is no pattern.'],
        hint1: 'Move from the left dots to the right dots. Do they climb, drop, or jump around?',
        hint2: 'If the cloud neither rises nor falls, what do you call it?',
      },
    },
    won: { text: 'You read the whole cloud, not just one dot.', sticker: 'A pattern between two sets of data is a correlation, or association: positive or negative. A dot far from the rest is an outlier. A tight bunch of dots is a cluster.' },
    twinWon: { text: 'You saw the dots jump around with no rise and no fall.', sticker: 'A pattern between two sets of data is a correlation, or association: positive or negative. A dot far from the rest is an outlier. A tight bunch of dots is a cluster.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'Each dot is one player: hours of practice and free throws made out of 20. What pattern does the plot show?',
        picture: plot([[1, 5], [2, 6], [3, 8], [4, 9], [5, 11], [6, 12], [7, 14], [8, 15], [9, 17]], 10, 20, 'Hours of practice', 'Free throws made', { xStep: 1, yStep: 2 }),
        answer: { choices: PATTERN, correct: 0 },
        steps: ['More practice goes with more free throws made.', 'The dots rise to the right.', 'So the pattern is positive.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'Each dot is one used car: its age in years and its value in thousands of dollars. What pattern does the plot show?',
        picture: plot([[1, 28], [2, 25], [3, 22], [4, 20], [5, 17], [6, 15], [7, 12], [8, 10]], 10, 30, 'Age (years)', 'Value ($1,000s)', { xStep: 1, yStep: 5 }),
        answer: { choices: PATTERN, correct: 1 },
        steps: ['Older cars are worth less.', 'The dots fall to the right.', 'So the pattern is negative.'] } },
      { why: 'Still "read the whole cloud"', problem: {
        text: 'Each dot is one student: the letters in their first name and their height in inches. What pattern does the plot show?',
        picture: plot([[3, 60], [4, 66], [4, 58], [5, 63], [5, 70], [6, 59], [6, 67], [7, 62], [8, 69], [8, 57]], 10, 80, 'Letters in first name', 'Height (inches)', { xStep: 1, yStep: 10 }),
        answer: { choices: PATTERN, correct: 2 },
        steps: ['Tall and short students show up for short and long names alike.', 'The cloud does not rise or fall.', 'So there is no pattern.'] } },
      { why: 'A little harder', problem: {
        text: 'Each dot is one student: hours studied and test score. One point is an outlier, far from the rest. Which point is it?',
        picture: study({}, [[1, 50], [2, 58], [2, 62], [3, 68], [4, 74], [4, 78], [5, 30], [5, 84], [6, 90]]),
        answer: { choices: ['(1, 50)', '(5, 30)', '(6, 90)'], correct: 1 },
        steps: ['The cloud rises from about 50 at 1 hour to 90 at 6 hours.', 'At 5 hours the other dot is 84, but one dot sits way down at 30.', 'So the outlier is (5, 30).'] } },
      { why: 'Same math in a story', problem: {
        text: 'An ice cream truck wrote down the temperature and the ice creams it sold on 8 days. What pattern does the plot show?',
        picture: plot([[60, 20], [65, 25], [70, 32], [75, 35], [80, 44], [85, 48], [90, 55], [95, 60]], 100, 70, 'Temperature (°F)', 'Ice creams sold', { xStep: 10, yStep: 10 }),
        answer: { choices: PATTERN, correct: 0 },
        steps: ['Hotter days go with more ice creams sold.', 'The dots rise to the right.', 'So the pattern is positive.'] } },
    ],
  },

  // ── Topic 2 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g8m6-t2', title: 'A line of best fit', skill: 'Choose a straight line that goes through the middle of a scatter plot and find its slope',
    bigIdea: "A line that fits runs through the middle of the cloud, with about as many dots above it as below it.",
    screens: [
      { title: 'One line for the whole class', text: 'The dots rise to the right. Can one straight line show where the whole cloud is heading?',
        pictures: [fitStudy()] },
      { title: "Not just any rising line", text: "Here is a line that rises, just like the dots. Is it a good fit? Look underneath it. All 10 dots sit below it. It rises the right way, but it misses where the students really are.",
        beats: [
          { say: "Here is a line that rises, just like the dots. Is it a good fit?", pic: 0 },
          { say: "Look underneath it. All 10 dots sit below it." },
          { say: "It rises the right way, but it misses where the students really are." },
        ],
        pictures: [fitStudy([[0, 70], [6, 100]])] },
      { title: "The big idea", text: "A line that fits runs through the middle of the cloud, with about as many dots above it as below it.",
        beats: [
          { say: "A line that fits runs through the middle of the cloud, with about as many dots above it as below it.", pic: 0 },
        ],
        pictures: [fitStudy()] },
      { title: "Lay the line along the cloud", text: "Let's build a better one. First, tilt the line the way the dots go. Then slide it down until it runs right through the middle of the cloud.",
        beats: [
          { say: "Let's build a better one. First, tilt the line the way the dots go.", pic: 0 },
          { say: "Then slide it down until it runs right through the middle of the cloud." },
        ],
        pictures: [fitStudy([[0, 50], [6, 92]], true)] },
      { title: "Count above and below", text: "Now count with me. How many dots sit above the line? 5. And below it? 5 again. 5 and 5 is balanced, so this line sits right in the middle.",
        beats: [
          { say: "Now count with me. How many dots sit above the line? 5.", pic: 0 },
          { say: "And below it? 5 again.", pic: 1 },
          { say: "5 and 5 is balanced, so this line sits right in the middle." },
        ],
        pictures: [fitStudy([[0, 50], [6, 92]]), { kind: 'eq', text: '5 above', lines: ['5 below'] }] },
      { title: "How steep is it?", text: "Our line goes through (0, 50) and (6, 92). How steep is it? The rise is 92 − 50, which is 42. The run is 6 − 0, which is 6. 42 ÷ 6 is 7. So the slope is 7, about 7 more points for every extra hour.",
        beats: [
          { say: "Our line goes through (0, 50) and (6, 92). How steep is it?", pic: 0 },
          { say: "The rise is 92 − 50, which is 42. The run is 6 − 0, which is 6." },
          { say: "42 ÷ 6 is 7. So the slope is 7, about 7 more points for every extra hour.", pic: 1 },
        ],
        pictures: [fitStudy([[0, 50], [6, 92]]), { kind: 'eq', text: '(92 − 50) ÷ (6 − 0)', lines: ['= 42 ÷ 6 = 7'] }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't pick a line JUST because it rises like the dots. Count the dots above it and below it, and move it until they balance. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't pick a line JUST because it rises like the dots.", pic: 0 },
          { say: "Count the dots above it and below it, and move it until they balance." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: 'All 10 dots below the line', right: '5 dots above, 5 below' }] },
    ],
    turn: {
      text: 'A line fits these dots well. It passes through (0, 40) and (5, 70). What is its slope?',
      picture: plot(around(6, 40, PAIRS(5), 4), 6, 100, 'Hours studied', 'Test score', { xStep: 1, yStep: 10, fit: [[0, 40], [6, 76]] }),
      answer: 6,
      steps: ['The rise is 70 − 40 = 30.', 'The run is 5 − 0 = 5.', 'Slope = 30 ÷ 5 = 6.'],
      prompt: 'Find the rise and the run between the two points. Then divide.',
      hint1: 'How much does the line go up from (0, 40) to (5, 70)?',
      hint2: 'Divide the rise, 30, by the run from 0 to 5.',
      twin: {
        text: 'A line fits the dots for weeks and plant height in cm. It passes through (2, 10) and (6, 30). What is its slope?',
        picture: plot(around(5, 0, PAIRS(6), 2), 7, 40, 'Weeks', 'Height (cm)', { xStep: 1, yStep: 5, fit: [[0, 0], [7, 35]] }),
        answer: 5,
        steps: ['The rise is 30 − 10 = 20.', 'The run is 6 − 2 = 4.', 'Slope = 20 ÷ 4 = 5.'],
        hint1: 'How much does the height go up from (2, 10) to (6, 30)?',
        hint2: 'Divide that rise by the run: how many weeks from 2 to 6?',
      },
    },
    won: { text: 'You found the rise and the run on the line, then divided.', sticker: 'A straight line through the middle of a scatter plot is a line of best fit, or trend line.' },
    twinWon: { text: 'You found the rise from 10 to 30 over the run from 2 to 6.', sticker: 'A straight line through the middle of a scatter plot is a line of best fit, or trend line.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'A line fits these dots well. It passes through (0, 30) and (4, 50). What is its slope?',
        picture: plot(around(5, 30, PAIRS(5), 3), 6, 70, 'Hours studied', 'Quiz score', { xStep: 1, yStep: 10, fit: [[0, 30], [6, 60]] }),
        answer: 5, steps: ['The rise is 50 − 30 = 20.', 'The run is 4 − 0 = 4.', 'Slope = 20 ÷ 4 = 5.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'Three students each drew a line for these 8 dots. Which line fits best?',
        picture: plot(around(4, 20, [1, 2, 3, 4, 5, 6, 7, 8], 3), 9, 60, 'Minutes of practice', 'Points', { xStep: 1, yStep: 10 }),
        answer: { choices: ['A line with 7 dots above it and 1 below', 'A line with 4 dots above it and 4 below', 'A line through the two lowest dots'], correct: 1 },
        steps: ['A line that fits sits in the middle of the dots.', 'The middle means about as many dots above as below.', 'So the best line is: A line with 4 dots above it and 4 below.'] } },
      { why: 'Still "as many above as below"', problem: {
        text: 'A plot has 12 dots, and none of them sit on the line. For a good fit, how many dots should be below the line?',
        picture: plot(around(3, 10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 2), 13, 50, 'Days', 'Pages read', { xStep: 1, yStep: 10 }),
        answer: 6, steps: ['A good line has about as many dots above as below.', 'Split the 12 dots into two equal halves: 12 ÷ 2.', 'So 6 dots should be below the line.'] } },
      { why: 'A little harder', problem: {
        text: 'A line fits these dots for hours of TV and test score. It passes through (2, 80) and (6, 60). What is its slope?',
        picture: plot(around(-5, 90, PAIRS(7), 4), 8, 100, 'Hours of TV', 'Test score', { xStep: 1, yStep: 10, fit: [[0, 90], [8, 50]] }),
        answer: -5, steps: ['The line goes down, so the rise is 60 − 80 = −20.', 'The run is 6 − 2 = 4.', 'Slope = −20 ÷ 4 = −5.'] } },
      { why: 'Same math in a story', problem: {
        text: 'Jada runs a lemonade stand. A line fits her dots for temperature and cups sold. It passes through (60, 10) and (90, 40). What is its slope?',
        picture: plot(around(1, -50, [60, 65, 70, 75, 80, 85, 90, 95], 3), 100, 50, 'Temperature (°F)', 'Cups sold', { xStep: 10, yStep: 10, fit: [[50, 0], [100, 50]] }),
        answer: 1, steps: ['The rise is 40 − 10 = 30 cups.', 'The run is 90 − 60 = 30 degrees.', 'Slope = 30 ÷ 30 = 1, about 1 more cup for each degree.'] } },
    ],
  },

  // ── Topic 3 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g8m6-t3', title: 'Predict with the line', skill: 'Use the equation of a line of best fit to predict a value and explain what its slope means',
    bigIdea: "The line is a rule, so put the x value into its equation and the y value you get is your prediction.",
    screens: [
      { title: 'How will Maya do?', text: 'This line of best fit shows hours studied and test scores for a class. Maya plans to study 6 hours. What score might she get?',
        pictures: [LINE_STUDY()] },
      { title: "No dot at 6 hours", text: "Find 6 hours along the bottom. Is there a dot to read? No. Nobody in this class studied that long. And a guess is not a plan, so we need the line itself.",
        beats: [
          { say: "Find 6 hours along the bottom. Is there a dot to read?", pic: 0 },
          { say: "No. Nobody in this class studied that long." },
          { say: "And a guess is not a plan, so we need the line itself." },
        ],
        pictures: [LINE_STUDY()] },
      { title: "The big idea", text: "The line is a rule, so put the x value into its equation and the y value you get is your prediction.",
        beats: [
          { say: "The line is a rule, so put the x value into its equation and the y value you get is your prediction.", pic: 0 },
        ],
        pictures: [LINE_STUDY()] },
      { title: "The line as an equation", text: "Where does the line start, at 0 hours? At 50. From there it climbs 5 points for every hour. So its equation is y = 5x + 50.",
        beats: [
          { say: "Where does the line start, at 0 hours? At 50.", pic: 0 },
          { say: "From there it climbs 5 points for every hour." },
          { say: "So its equation is y = 5x + 50.", pic: 1 },
        ],
        pictures: [LINE_STUDY(true), { kind: 'eq', text: 'y = 5x + 50' }] },
      { title: "Put in 6 hours", text: "Maya studies 6 hours, so 6 goes in for x. 5 × 6 is 30. Then 30 + 50 is 80. So we predict a score of 80 for her.",
        beats: [
          { say: "Maya studies 6 hours, so 6 goes in for x.", pic: 0 },
          { say: "5 × 6 is 30. Then 30 + 50 is 80.", pic: 1 },
          { say: "So we predict a score of 80 for her." },
        ],
        pictures: [LINE_STUDY(), { kind: 'eq', text: 'y = 5 × 6 + 50', lines: ['y = 30 + 50', 'y = 80'] }] },
      { title: "What the numbers mean", text: "What do the two numbers mean? The 5 means about 5 more points for every extra hour. The 50 is where the line starts, the score at 0 hours.",
        beats: [
          { say: "What do the two numbers mean?", pic: 0 },
          { say: "The 5 means about 5 more points for every extra hour." },
          { say: "The 50 is where the line starts, the score at 0 hours.", pic: 1 },
        ],
        pictures: [LINE_STUDY(), { kind: 'eq', text: '5 → points per hour', lines: ['50 → score at 0 hours'] }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't STOP at 5 × 6. That 30 is only the extra points from studying. Add the 50 the line starts at, and you get 80. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't STOP at 5 × 6. That 30 is only the extra points from studying.", pic: 0 },
          { say: "Add the 50 the line starts at, and you get 80." },
          { say: "Okay. Your turn." },
        ],
        pictures: [{ kind: 'cards', wrong: 'y = 5 × 6 = 30', right: 'y = 5 × 6 + 50 = 80' }] },
    ],
    turn: {
      text: 'The line of best fit for hours studied and test score is y = 5x + 50. Predict the score for 8 hours of studying.',
      picture: rule('y = 5x + 50', 'x = 8 hours'),
      answer: 90,
      steps: ['Put 8 in place of x: y = 5 × 8 + 50.', '5 × 8 = 40.', '40 + 50 = 90. So predict a score of 90.'],
      prompt: 'Put the hours in place of x. Multiply, then add.',
      hint1: 'Put 8 in place of x.',
      hint2: 'Find 5 × 8, then add the 50.',
      twin: {
        text: 'The line of best fit for weeks and plant height in cm is y = 2x + 4. Predict the height at 9 weeks.',
        picture: rule('y = 2x + 4', 'x = 9 weeks'),
        answer: 22,
        steps: ['Put 9 in place of x: y = 2 × 9 + 4.', '2 × 9 = 18.', '18 + 4 = 22. So predict 22 cm.'],
        hint1: 'Put 9 in place of x.',
        hint2: 'Find 2 × 9, then add the 4.',
      },
    },
    won: { text: 'You put the hours into the equation and got a prediction.', sticker: 'In y = mx + b, m is the slope and b is the y-intercept. Predicting inside the data is interpolation; beyond it is extrapolation.' },
    twinWon: { text: 'You put 9 weeks into y = 2x + 4 to predict the height.', sticker: 'In y = mx + b, m is the slope and b is the y-intercept. Predicting inside the data is interpolation; beyond it is extrapolation.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'The line of best fit is y = 5x + 50. Predict the test score for 3 hours of studying.',
        picture: rule('y = 5x + 50', 'x = 3 hours'),
        answer: 65, steps: ['Put 3 in place of x: y = 5 × 3 + 50.', '5 × 3 = 15.', '15 + 50 = 65. So predict a score of 65.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'The line of best fit for days and pages read is y = 4x + 10. Predict the pages read after 7 days.',
        picture: rule('y = 4x + 10', 'x = 7 days'),
        answer: 38, steps: ['Put 7 in place of x: y = 4 × 7 + 10.', '4 × 7 = 28.', '28 + 10 = 38. So predict 38 pages.'] } },
      { why: 'Still "the slope is the change for each 1"', problem: {
        text: 'The line of best fit for hours worked and dollars earned is y = 12x + 20. What does the 12 mean?',
        picture: rule('y = 12x + 20', 'x = hours, y = dollars'),
        answer: { choices: ['You start with $12', 'You earn about $12 more for each extra hour', 'You work 12 hours'], correct: 1 },
        steps: ['The 12 is the slope, the number that multiplies x.', 'The slope is how much y goes up when x goes up by 1.', 'So it means: You earn about $12 more for each extra hour.'] } },
      { why: 'A little harder', problem: {
        text: 'The line of best fit for hours of TV and test score is y = −4x + 95. Predict the score for 5 hours of TV.',
        picture: rule('y = −4x + 95', 'x = 5 hours'),
        answer: 75, steps: ['Put 5 in place of x: y = −4 × 5 + 95.', '−4 × 5 = −20.', '−20 + 95 = 75. So predict a score of 75.'] } },
      { why: 'Same math in a story', problem: {
        text: 'A lemonade stand finds the line y = 2x − 100, where x is the temperature in °F and y is cups sold. Predict the cups sold on an 80°F day.',
        picture: rule('y = 2x − 100', 'x = 80°F'),
        answer: 60, steps: ['Put 80 in place of x: y = 2 × 80 − 100.', '2 × 80 = 160.', '160 − 100 = 60. So predict 60 cups.'] } },
    ],
  },

  // ── Topic 4 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g8m6-t4', title: 'Two-way tables', skill: 'Read and complete a table that counts people by two questions at once',
    bigIdea: 'Put one question in the rows and one in the columns. Each box counts people who fit both, and the totals add across and down.',
    screens: [
      { title: 'Two questions, 40 students', text: '40 students answered two questions: Are you in grade 7 or grade 8? Do you like pizza? How can one picture show both answers?',
        pictures: [table(PIZZA_HEAD, PIZZA.map(r => [r[0], '?', '?', '?']))] },
      { title: 'Two counts are not enough', text: 'Here is what we know so far. 27 students like pizza, and 20 students are in grade 7. But those two counts still cannot tell you how many grade 7 students like pizza.',
        beats: [
          { say: 'Here is what we know so far.', pic: 0 },
          { say: '27 students like pizza, and 20 students are in grade 7.' },
          { say: 'But those two counts still cannot tell you how many grade 7 students like pizza.', write: 'a count each way is not enough' },
        ],
        pictures: [table(PIZZA_HEAD, PIZZA.map(r => [r[0], '?', '?', '?']))] },
      { title: 'The big idea', text: 'Put one question in the rows and one in the columns. Each box counts people who fit both, and the totals add across and down.',
        beats: [
          { say: 'Put one question in the rows and one in the columns.', pic: 0 },
          { say: 'Each box counts people who fit both, and the totals add across and down.' },
        ],
        pictures: [table(PIZZA_HEAD, PIZZA)] },
      { title: 'Fill one box', text: "Let's fill one box together. 12 students are in grade 7 and they like pizza. That count goes right where the Grade 7 row meets the Likes pizza column.",
        beats: [
          { say: "Let's fill one box together.", pic: 0 },
          { say: '12 students are in grade 7 and they like pizza.' },
          { say: 'That count goes right where the Grade 7 row meets the Likes pizza column.', write: 'row meets column = fits both' },
        ],
        pictures: [table(PIZZA_HEAD, PIZZA, [[0, 1]], true)] },
      { title: 'Add across', text: 'Now check the rows. Each one has to add up to its own total. Grade 7: 12 and 8 make 20. Grade 8: 15 and 5 make 20 as well.',
        beats: [
          { say: 'Now check the rows. Each one has to add up to its own total.', pic: 0 },
          { say: 'Grade 7: 12 and 8 make 20.', pic: 1 },
          { say: 'Grade 8: 15 and 5 make 20 as well.' },
        ],
        pictures: [table(PIZZA_HEAD, PIZZA, [[0, 3], [1, 3]]), { kind: 'eq', text: '12 + 8 = 20', lines: ['15 + 5 = 20'] }] },
      { title: 'Add down', text: 'The columns do the same thing going down. Likes pizza: 12 and 15 make 27. Does not: 8 and 5 make 13. And 27 and 13 make 40, the same 40 you get from 20 and 20.',
        beats: [
          { say: 'The columns do the same thing going down.', pic: 0 },
          { say: 'Likes pizza: 12 and 15 make 27. Does not: 8 and 5 make 13.', pic: 1 },
          { say: 'And 27 and 13 make 40, the same 40 you get from 20 and 20.', write: 'across and down reach the same total' },
        ],
        pictures: [table(PIZZA_HEAD, PIZZA, [[2, 1], [2, 2], [2, 3]]), { kind: 'eq', text: '12 + 15 = 27', lines: ['8 + 5 = 13', '27 + 13 = 40'] }] },
      { title: 'One thing not to do', text: "One last trap before your turn. Don't add a row total to a column total. Those two totals count some of the same students twice.",
        beats: [
          { say: 'One last trap before your turn.' },
          { say: "Don't add a row total to a column total.", pic: 0 },
          { say: 'Those two totals count some of the same students twice.' },
        ],
        pictures: [{ kind: 'cards', wrong: '20 + 27 = 47 students', right: '20 + 20 = 40 students' }] },
    ],
    turn: {
      text: 'How many grade 7 students do not like pizza?',
      picture: table(PIZZA_HEAD, [['Grade 7', '14', '?', '20'], ['Grade 8', '11', '9', '20'], ['Total', '25', '15', '40']]),
      answer: 6,
      steps: ['The Grade 7 row adds up to 20.', '14 like pizza, so 20 − 14 do not.', 'So 6 grade 7 students do not like pizza.'],
      prompt: 'Find the row the box is in. Its boxes add up to its total.',
      hint1: 'Look across the Grade 7 row. What must its boxes add up to?',
      hint2: '14 + what = 20?',
      twin: {
        text: 'How many girls have no pet?',
        picture: table(['', 'Has a pet', 'No pet', 'Total'], [['Boys', '9', '7', '16'], ['Girls', '13', '?', '18'], ['Total', '22', '12', '34']]),
        answer: 5,
        steps: ['The Girls row adds up to 18.', '13 girls have a pet, so 18 − 13 have no pet.', 'So 5 girls have no pet.'],
        hint1: 'Look across the Girls row. What is its total?',
        hint2: 'Take away the girls who have a pet from the Girls total.',
      },
    },
    won: { text: 'You used the row total to find the missing box.', sticker: 'A table that sorts people by two questions at once is a two-way table. Its row and column totals are marginal totals.' },
    twinWon: { text: 'You used the Girls row total to find the missing box.', sticker: 'A table that sorts people by two questions at once is a two-way table. Its row and column totals are marginal totals.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'How many grade 8 students do not like pizza?',
        picture: table(PIZZA_HEAD, [['Grade 7', '10', '10', '20'], ['Grade 8', '16', '?', '20'], ['Total', '26', '14', '40']]),
        answer: 4, steps: ['The Grade 8 row adds up to 20.', '16 like pizza, so 20 − 16 do not.', 'So 4 grade 8 students do not like pizza.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'How many grade 7 students do not play a sport?',
        picture: table(['', 'Plays a sport', 'Does not', 'Total'], [['Grade 6', '18', '12', '30'], ['Grade 7', '21', '?', '35'], ['Total', '39', '26', '65']]),
        answer: 14, steps: ['The Grade 7 row adds up to 35.', '21 play a sport, so 35 − 21 do not.', 'So 14 grade 7 students do not play a sport.'] } },
      { why: 'Still "rows and columns add up"', problem: {
        text: 'How many grade 8 students were asked in all?',
        picture: table(['', 'Grade 7', 'Grade 8', 'Total'], [['Walks', '8', '12', '20'], ['Bus', '15', '10', '25'], ['Total', '23', '?', '45']]),
        answer: 22, steps: ['The Grade 8 column adds down to its total.', '12 walk and 10 take the bus: 12 + 10.', 'So 22 grade 8 students were asked.'] } },
      { why: 'A little harder', problem: {
        text: 'How many girls do not like the song?',
        picture: table(['', 'Likes the song', 'Does not', 'Total'], [['Boys', '?', '8', '20'], ['Girls', '?', '?', '25'], ['Total', '27', '18', '45']]),
        answer: 10, steps: ['The Girls row has two blanks, so use the Does not column instead.', '18 in all do not like the song, and 8 of them are boys: 18 − 8.', 'So 10 girls do not like the song.'] } },
      { why: 'Same math in a story', problem: {
        text: 'A camp asked 50 kids to pick swimming or hiking. How many 11-year-olds picked swimming?',
        picture: table(['', 'Swim', 'Hike', 'Total'], [['Age 11', '?', '9', '24'], ['Age 12', '14', '12', '26'], ['Total', '29', '21', '50']]),
        answer: 15, steps: ['The Age 11 row adds up to 24.', '9 of them picked hiking, so 24 − 9 picked swimming.', 'So 15 of the 11-year-olds picked swimming.'] } },
    ],
  },

  // ── Topic 5 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g8m6-t5', title: 'Relative frequency', skill: 'Divide a count by its row or column total and compare the result as a fraction, decimal or percent',
    bigIdea: 'Divide a count by the total of its row or column. Then groups of different sizes can be compared as fractions, decimals or percents.',
    screens: [
      { title: 'Which grade likes pizza more?', text: '12 grade 7 students like pizza, and 15 grade 8 students do. Does that mean grade 8 likes pizza more?',
        pictures: [table(PIZZA_HEAD, SHARE)] },
      { title: 'The bigger count can fool you', text: '15 is more than 12, sure. But look at the row totals with me. Grade 8 has 30 students, and grade 7 has only 20. Counts from groups of different sizes do not compare fairly.',
        beats: [
          { say: '15 is more than 12, sure. But look at the row totals with me.', pic: 0 },
          { say: 'Grade 8 has 30 students, and grade 7 has only 20.' },
          { say: 'Counts from groups of different sizes do not compare fairly.' },
        ],
        pictures: [table(PIZZA_HEAD, SHARE, [[0, 3], [1, 3]])] },
      { title: 'The big idea', text: 'Divide a count by the total of its row or column. Then groups of different sizes can be compared as fractions, decimals or percents.',
        beats: [
          { say: 'Divide a count by the total of its row or column.', pic: 0 },
          { say: 'Then groups of different sizes can be compared as fractions, decimals or percents.' },
        ],
        pictures: [table(PIZZA_HEAD, SHARE)] },
      { title: "Grade 7's share", text: 'Start with grade 7. 12 of their 20 students like pizza. Divide 12 by 20 and you get 0.6, which is 60%.',
        beats: [
          { say: 'Start with grade 7. 12 of their 20 students like pizza.', pic: 0 },
          { say: 'Divide 12 by 20 and you get 0.6, which is 60%.', pic: 1 },
        ],
        pictures: [table(PIZZA_HEAD, SHARE, [[0, 1], [0, 3]], true), { kind: 'eq', text: '12/20 = 0.6', lines: ['= 60%'] }] },
      { title: "Grade 8's share", text: 'Now grade 8. 15 of their 30 students like pizza. That is 0.5, or 50%. So grade 7 likes pizza more after all, even though its count was smaller.',
        beats: [
          { say: 'Now grade 8. 15 of their 30 students like pizza.', pic: 0 },
          { say: 'That is 0.5, or 50%.', pic: 1 },
          { say: 'So grade 7 likes pizza more after all, even though its count was smaller.', write: 'compare shares, not counts' },
        ],
        pictures: [table(PIZZA_HEAD, SHARE, [[1, 1], [1, 3]], true), { kind: 'eq', text: '15/30 = 0.5', lines: ['= 50%'] }] },
      { title: 'Ask: out of whom?', text: 'Here is a different question. Out of the students who like pizza, what part are in grade 7? Now the total we divide by is the Likes pizza column, 27. So it is 12 out of 27, which simplifies to 4/9.',
        beats: [
          { say: 'Here is a different question. Out of the students who like pizza, what part are in grade 7?', pic: 0 },
          { say: 'Now the total we divide by is the Likes pizza column, 27.', write: 'ask first: out of whom?' },
          { say: 'So it is 12 out of 27, which simplifies to 4/9.', pic: 1 },
        ],
        pictures: [table(PIZZA_HEAD, SHARE, [[0, 1], [2, 1]]), { kind: 'eq', text: '12/27 = 4/9' }] },
      { title: 'One thing not to do', text: "And here is the slip to watch for. When the question says of grade 7 students, don't divide by the grand total. Use the Grade 7 row total instead.",
        beats: [
          { say: 'And here is the slip to watch for.' },
          { say: "When the question says of grade 7 students, don't divide by the grand total.", pic: 0 },
          { say: 'Use the Grade 7 row total instead.' },
        ],
        pictures: [{ kind: 'cards', wrong: '12/50 = 24%', right: '12/20 = 60%' }] },
    ],
    turn: {
      text: 'What percent of grade 7 students like pizza?',
      picture: table(PIZZA_HEAD, [['Grade 7', '14', '6', '20'], ['Grade 8', '15', '15', '30'], ['Total', '29', '21', '50']]),
      answer: 70,
      steps: ['The question is about grade 7 students, so use the Grade 7 row total, 20.', '14 of them like pizza: 14/20 = 0.7.', 'As a percent, that is 70%.'],
      prompt: 'Ask "out of whom?" Divide the count by that total, then write it as a percent.',
      hint1: 'Out of whom? Find the total of the Grade 7 row.',
      hint2: 'Divide 14 by 20. Then change the decimal to a percent.',
      twin: {
        text: 'Of the students who have a pet, what fraction are girls? Write it as a fraction.',
        picture: table(['', 'Has a pet', 'No pet', 'Total'], [['Boys', '9', '7', '16'], ['Girls', '15', '9', '24'], ['Total', '24', '16', '40']]),
        answer: { frac: [5, 8] },
        steps: ['The question is about students who have a pet, so use the Has a pet column total, 24.', '15 of them are girls: 15/24.', '15/24 = 5/8.'],
        hint1: 'Out of whom? The question is only about students who have a pet.',
        hint2: 'Put the girls with a pet over the total of the Has a pet column.',
      },
    },
    won: { text: 'You divided by the right row total and wrote a percent.', sticker: 'A count divided by a total is a relative frequency. Dividing by one row or column total gives a conditional relative frequency.' },
    twinWon: { text: 'You divided by the pet column total, not the whole class.', sticker: 'A count divided by a total is a relative frequency. Dividing by one row or column total gives a conditional relative frequency.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: {
        text: 'What percent of grade 8 students like pizza?',
        picture: table(PIZZA_HEAD, [['Grade 7', '12', '8', '20'], ['Grade 8', '21', '9', '30'], ['Total', '33', '17', '50']]),
        answer: 70, steps: ['Use the Grade 8 row total, 30.', '21 of them like pizza: 21/30 = 0.7.', 'As a percent, that is 70%.'] } },
      { why: 'Same idea, new numbers', problem: {
        text: 'What part of grade 6 students walk to school? Write it as a decimal.',
        picture: table(['', 'Walks', 'Rides', 'Total'], [['Grade 6', '8', '17', '25'], ['Grade 7', '12', '13', '25'], ['Total', '20', '30', '50']]),
        answer: 0.32, steps: ['Use the Grade 6 row total, 25.', '8 of them walk: 8/25 = 32/100.', 'As a decimal, that is 0.32.'] } },
      { why: 'Still "out of whom?"', problem: {
        text: 'Of the students who ride to school, what fraction are in grade 7? Write it as a fraction.',
        picture: table(['', 'Walks', 'Rides', 'Total'], [['Grade 6', '8', '17', '25'], ['Grade 7', '12', '13', '25'], ['Total', '20', '30', '50']]),
        answer: { frac: [13, 30] }, steps: ['The question is about students who ride, so use the Rides column total, 30.', '13 of the riders are in grade 7.', 'So the fraction is 13/30.'] } },
      { why: 'A little harder', problem: {
        text: 'Of all the students asked, what percent are girls who play an instrument?',
        picture: table(['', 'Plays', 'Does not', 'Total'], [['Boys', '14', '26', '40'], ['Girls', '18', '22', '40'], ['Total', '32', '48', '80']]),
        answer: 22.5, steps: ['The question says "of all the students", so use the grand total, 80.', '18 girls play: 18/80 = 0.225.', 'As a percent, that is 22.5%.'] } },
      { why: 'Same math in a story', problem: {
        text: 'A cafe asked 60 customers what they ordered. Of the customers who ordered tea, what percent were adults?',
        picture: table(['', 'Tea', 'Coffee', 'Total'], [['Adults', '9', '36', '45'], ['Teens', '6', '9', '15'], ['Total', '15', '45', '60']]),
        answer: 60, steps: ['The question is about tea drinkers, so use the Tea column total, 15.', '9 of them were adults: 9/15 = 0.6.', 'As a percent, that is 60%.'] } },
    ],
  },
]

attachChalk(G8M6, G8M6_CHALK)
