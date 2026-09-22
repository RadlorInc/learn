/**
 * How g5m6's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G5M6_VOICE: Record<string, VoiceLine> = {
  // ── g5m6-t4 ── (its "Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  "Pattern A is 0, 1, 2, 3. Pattern B is 0, 2, 4, 6.": { style: 'B' },
  "But a grid does not take lists. Where would a dot go?": { style: 'B' },
  "Every dot needs two numbers, one across and one up.": { style: 'B' },
  "Each column gives one pair: the top number goes across, and the bottom number goes up.": { style: 'B' },
  "Read straight down each column.": { style: 'B' },
  "0 and 0. 1 and 2. 2 and 4. 3 and 6.": { style: 'B' },
  "4 columns, so 4 pairs.": { style: 'B' },
  "Now take the pairs to the grid.": { style: 'B' },
  "Take (1, 2). Go 1 across, then 2 up, and put a dot.": { style: 'B', say: "Take 1 comma 2. Go 1 across, then 2 up, and put a dot." },
  "Do the same for (0, 0), (2, 4) and (3, 6).": { style: 'B', say: "Do the same for 0 comma 0, 2 comma 4, and 3 comma 6." },
  "Look at the four dots. What do you notice?": { style: 'B' },
  "They sit on one straight line, climbing to the right.": { style: 'B' },
  "Every 1 step across, they go 2 steps up.": { style: 'B' },
  "Don't write the bottom number FIRST.": { style: 'B+' },
  "1 and 2 make (1, 2), not (2, 1). Those are two different dots.": { style: 'B+', say: "1 and 2 make 1 comma 2, not 2 comma 1. Those are two different dots." },
  "You made the pair (2, 4) with pattern A going across.": { style: 'A', say: "You made the pair 2 comma 4 with pattern A going across." },
  // ── g5m6-t5 ── ("Is there a faster way? Yes." is already a row elsewhere; Screen 7's opener and closer are g5m1's)
  "You could count every step from the bench to the tree.": { style: 'B' },
  "That works, but on a big grid it takes ages, and it's easy to lose count.": { style: 'B' },
  "When two points share a number, they sit on one straight line, so subtract the other two numbers.": { style: 'B' },
  "Point A is at (2, 3), and point B is at (7, 3).": { style: 'B', say: "Point A is at 2 comma 3, and point B is at 7 comma 3." },
  "Look at the second numbers. Both are 3.": { style: 'B' },
  "So the two points sit on one straight line, going across.": { style: 'B' },
  "Which numbers are different? The first ones, 2 and 7.": { style: 'B' },
  "Take the smaller from the bigger. 7 − 2 = 5.": { style: 'B' },
  "So they are 5 units apart.": { style: 'B' },
  "Let's check by counting, just this once.": { style: 'B' },
  "One, two, three, four, five steps along the line.": { style: 'B' },
  "Yes, 5 units apart.": { style: 'B' },
  "Don't subtract the numbers that MATCH.": { style: 'B+' },
  "3 − 3 is 0, but the points are not 0 apart. Subtract the numbers that are different.": { style: 'B+' },
  "Now you try. Point A is at (1, 4). Point B is at (8, 4). How many units apart are they? Find the number they share. Subtract the other two.":
    { style: 'A', say: "Now you try. Point A is at 1 comma 4. Point B is at 8 comma 4. How many units apart are they? Find the number they share. Subtract the other two." },
  "Try a new one. Point C is at (3, 2). Point D is at (3, 8). How many units apart are they?":
    { style: 'A', say: "Try a new one. Point C is at 3 comma 2. Point D is at 3 comma 8. How many units apart are they?" },
  // ── g5m6-t6 ── (Screen 7's opener and closer are g5m1's)
  "You could trace the street with your finger and count the blocks.": { style: 'B' },
  "But on a busy map, it's easy to skip a block, or count one twice.": { style: 'B' },
  "Is there a surer way? Yes.": { style: 'B' },
  "Every place on the map has a pair, across then up, and along one straight street you subtract to count the blocks.": { style: 'B' },
  "Go across first, then up, like always.": { style: 'B' },
  "The school is at (2, 3).": { style: 'B', say: "The school is at 2 comma 3." },
  "The park is at (2, 8), straight above it.": { style: 'B', say: "The park is at 2 comma 8, straight above it." },
  "Both are 2 across, so one straight street joins them.": { style: 'B' },
  "Subtract the numbers going up. 8 − 3 = 5.": { style: 'B' },
  "So the park is 5 blocks away.": { style: 'B' },
  "Now turn it around. What is at (6, 1)?": { style: 'B', say: "Now turn it around. What is at 6 comma 1?" },
  "Go 6 across, then 1 up.": { style: 'B' },
  "It's the library.": { style: 'B' },
  "Don't count the CORNERS you pass.": { style: 'B+' },
  "From 3 up to 8 up, count the blocks between them. That's 5, not 6.": { style: 'B+' },
  "Now you try. On the map, the school is at (2, 3) and the pool is at (2, 9). How many blocks apart are they? Find the number they share. Subtract the other two.":
    { style: 'A', say: "Now you try. On the map, the school is at 2 comma 3 and the pool is at 2 comma 9. How many blocks apart are they? Find the number they share. Subtract the other two." },
  "Try a new one. Which place is at (5, 4)?": { style: 'A', say: "Try a new one. Which place is at 5 comma 4?" },
}
