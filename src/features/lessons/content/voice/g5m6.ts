/**
 * How g5m6's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 * A point like (3, 5) is said "3, 5": the comma is the breath between the two numbers, and parentheses are never read out.
 */
import type { VoiceLine } from './styles'

export const G5M6_VOICE: Record<string, VoiceLine> = {
  // ── g5m6-t1 ── (its "Here's the part people mix up." and "Okay. Your turn." share g5m1's rows)
  'Could you just point and say, up near the middle?': { style: 'B' },
  'No. That could be lots of spots.': { style: 'B' },
  'You need two numbers, read in the right order.': { style: 'B' },
  'Go across first, then up, so 3 across and 5 up is the point (3, 5).': { style: 'B', say: 'Go across first, then up, so 3 across and 5 up is the point 3, 5.' },
  'Start at 0, down in the corner.': { style: 'B' },
  "Walk along the bottom until you're right under point A.": { style: 'B' },
  "One, two, three. That's 3 across.": { style: 'B' },
  'Now go straight up from there.': { style: 'B' },
  'Count with me. One, two, three, four, five.': { style: 'B' },
  "You land on point A. That's 5 up.": { style: 'B' },
  'Two moves, two numbers.': { style: 'B' },
  'The number across goes first. The number up goes second.': { style: 'B' },
  'So point A is at (3, 5).': { style: 'B', say: 'So point A is at 3, 5.' },
  "Don't write the number UP first.": { style: 'B+' },
  "That's 5 across and 3 up, a different spot. Across goes first.": { style: 'B+' },
  // ── g5m6-t2 ──
  'Look at all the spots on this grid.': { style: 'B' },
  'Which one is (4, 2)?': { style: 'B', say: 'Which one is 4, 2?' },
  'The two numbers tell you, but only if you make the moves in the right order.': { style: 'B' },
  'To find (4, 2), start at 0, go 4 across, then 2 up, and put the dot there.': { style: 'B', say: 'To find the point 4, 2, start at 0, go 4 across, then 2 up, and put the dot there.' },
  'Put your finger on 0, right in the corner.': { style: 'B' },
  'The first number is 4, so slide along the bottom.': { style: 'B' },
  'One, two, three, four. Stop.': { style: 'B' },
  'The second number is 2. So go straight up from where you stopped.': { style: 'B' },
  'One, two. Stop again.': { style: 'B' },
  'Now put your dot right where you stopped.': { style: 'B' },
  "That spot is (4, 2), and there's only one on the whole grid.": { style: 'B', say: "That spot is 4, 2, and there's only one on the whole grid." },
  'The flag goes there.': { style: 'B' },
  "Don't go UP 4 first. That lands on (2, 4), a different spot.": { style: 'B+', say: "Don't go up 4 first. That lands on 2, 4, a different spot." },
  'The first number always goes across.': { style: 'B+' },
  'Where does the flag go?. Your friend says, "Put the flag at (4, 2)." Where on the grid does it go?': { style: 'A', say: 'Where does the flag go? Your friend says, put the flag at 4, 2. Where on the grid does it go?' },
  'Now you try. Which point is at (3, 1)? Go across first, then up. Which point is there?': { style: 'A', say: 'Now you try. Which point is at 3, 1? Go across first, then up. Which point is there?' },
  'Try a new one. Which point is at (2, 5)?': { style: 'A', say: 'Try a new one. Which point is at 2, 5?' },
  // ── g5m6-t3 ──
  "Is Leo always 4 dollars ahead? It's a fair guess, but no.": { style: 'B' },
  'He pulls further ahead every week.': { style: 'B' },
  'Follow each rule one step at a time, then line the two patterns up and compare the numbers in each column.': { style: 'B' },
  'Mia first.': { style: 'B' },
  'She starts at 0 and adds 2 every week.': { style: 'B' },
  'So, 2, 4, 6, 8.': { style: 'B' },
  'Now Leo. Same start, but he adds 6 every week.': { style: 'B' },
  'So he has 6, 12, 18, then 24.': { style: 'B' },
  'Now look straight down each column.': { style: 'B' },
  '2 and 6. 4 and 12. 6 and 18.': { style: 'B' },
  "Each of Leo's numbers is 3 times Mia's.": { style: 'B' },
  "Don't say Leo always has 4 MORE.": { style: 'B+' },
  '6 − 2 is 4, but 12 − 4 is 8. What stays the same is 3 times as much.': { style: 'B+' },
}
