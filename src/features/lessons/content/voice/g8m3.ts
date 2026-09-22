/**
 * How g8m3's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 * Algebra: a number next to a letter ("8x") is said "8 x".
 */
import type { VoiceLine } from './styles'

export const G8M3_VOICE: Record<string, VoiceLine> = {
  // ── g8m3-t4 ── ("Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  'Look. One is a table, and one is a rule.': { style: 'B' },
  'Ava starts with $10, and Ben starts with only $2.': { style: 'B' },
  'Does that mean Ava grows faster? Not yet. Where you start is not how fast you grow.': { style: 'B' },
  'For each one, find how much it goes up for every 1 step in x, and the bigger number grows faster.': { style: 'B' },
  'Take Ava first. Her savings go 10, 16, 22, 28, one week at a time.': { style: 'B' },
  'How much is each step? 16 − 10 = 6, and every step is 6.': { style: 'B' },
  'So Ava goes up $6 a week.': { style: 'B' },
  'Now Ben. His rule is y = 8x + 2.': { style: 'B', say: 'Now Ben. His rule is y equals 8 x plus 2.' },
  'Try weeks 0, 1 and 2. He has $2, then $10, then $18.': { style: 'B' },
  'Each week adds 8 more, the same 8 that sits in front of x.': { style: 'B' },
  'So Ben goes up $8 a week.': { style: 'B' },
  'Now put the two side by side. Ava goes up 6 a week, and Ben goes up 8.': { style: 'B' },
  'Which is bigger? 8 is more than 6.': { style: 'B' },
  'So Ben grows faster, even though Ava started with more.': { style: 'B' },
  "Don't pick the one that STARTS higher.": { style: 'B+' },
  "The + 2 in Ben's rule is where he starts. The 8 in front of x is how fast he grows.": { style: 'B+' },
  'Two savings jars. Ava shows her savings in a table. Ben tells you his rule: y = 8x + 2, where x is the number of weeks. Whose savings grow faster?': { style: 'A', say: 'Two savings jars. Ava shows her savings in a table. Ben tells you his rule, y equals 8 x plus 2, where x is the number of weeks. Whose savings grow faster?' },
  'Now you try. Function A is the table. Function B is y = 3x + 10. Which grows faster? Find how much each one goes up for each 1 in x. Compare the two numbers.': { style: 'A', say: 'Now you try. Function A is the table. Function B is y equals 3 x plus 10. Which grows faster? Find how much each one goes up for each 1 in x. Compare the two numbers.' },
  'Try a new one. Function A is y = 2x + 9. Function B is the table. Which grows faster?': { style: 'A', say: 'Try a new one. Function A is y equals 2 x plus 9. Function B is the table. Which grows faster?' },
  'The table went up by more than the 2 in 2x + 9, so function B grows faster.': { style: 'A', say: 'The table went up by more than the 2 in 2 x plus 9, so function B grows faster.' },
  // ── g8m3-t5 ──
  'You could add $10 again and again. 35, 45, 55, and on it goes.': { style: 'B' },
  'But what about 24 months? That is a very long list.': { style: 'B' },
  'Is there a faster way? Yes. One rule can do it in one line.': { style: 'B' },
  'The amount that repeats goes in front of x, and the amount paid once is added on.': { style: 'B' },
  'Start with the $25. You pay it one time, when you join.': { style: 'B' },
  'So at 0 months, before any month has gone by, you have already paid $25.': { style: 'B' },
  'Now the part that repeats. Every month adds another $10.': { style: 'B' },
  'So x months add 10 times x, and we write that as 10x.': { style: 'B', say: 'So x months add 10 times x, and we write that as 10 x.' },
  'Does it work? Try 3 months. 10 × 3 = 30, and 30 + 25 = 55.': { style: 'B' },
  'Now put the two pieces together. The cost is 10 times the months, plus 25.': { style: 'B' },
  'With y for the cost and x for the months, that is y = 10x + 25.': { style: 'B', say: 'With y for the cost and x for the months, that is y equals 10 x plus 25.' },
  'And 24 months? 10 × 24 + 25 = 265. One line, and it is done.': { style: 'B' },
  "Don't MULTIPLY the $25 by the months.": { style: 'B+' },
  'You pay the $25 once, so it is added on. The $10 is what repeats, so 10 goes in front of x.': { style: 'B+' },
  'You put the $8 that repeats in front of x and added the $15 paid once.': { style: 'A', say: 'You put the 8 dollars that repeat in front of x and added the 15 dollars paid once.' },
  'The 2 feet repeat each year and the 4 feet are the start, so y = 2x + 4.': { style: 'A', say: 'The 2 feet repeat each year and the 4 feet are the start, so y equals 2 x plus 4.' },
  // ── g8m3-t6 ──
  'There is no rule here to put numbers into.': { style: 'B' },
  'So how can a graph tell a story?': { style: 'B' },
  'You read its shape, one piece at a time.': { style: 'B' },
  'Read the graph from left to right, where up means growing, down means shrinking, and flat means staying the same.': { style: 'B' },
  'Start at the left. From hour 0 to hour 2, the graph climbs to 6 miles.': { style: 'B' },
  'What does that mean for Sam?': { style: 'B' },
  'His distance from home is growing, so he is riding away.': { style: 'B' },
  'Next piece. From hour 2 to hour 4, the graph stays flat at 6 miles.': { style: 'B' },
  'Is Sam getting any farther from home? No.': { style: 'B' },
  'His distance is not changing, so he has stopped for a rest.': { style: 'B' },
  'From hour 4 to hour 6 it climbs again, but only 2 miles.': { style: 'B' },
  'From hour 0 to hour 2 it climbed 6. Steeper means faster.': { style: 'B' },
  'Then from hour 6 to hour 10 it goes down to 0, because Sam is riding home.': { style: 'B' },
  'The graph is NOT a picture of a hill.': { style: 'B+' },
  'Going down does not mean Sam rides downhill. It means he is getting closer to home.': { style: 'B+' },
}
