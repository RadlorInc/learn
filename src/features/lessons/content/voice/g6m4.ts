/**
 * How g6m4's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 *
 * DECIMALS: speakable() does not spell them. Topic 2 teaches the WRITTEN form, so 0.75 is read digit by digit, "zero point
 * seven five". Money (.75 in topic 4) is how much, so it is said as dollars and cents. Screen 7's "Here's the part
 * people mix up." and "Okay. Your turn." are g5m1's rows.
 */
import type { VoiceLine } from './styles'

export const G6M4_VOICE: Record<string, VoiceLine> = {
  // ── g6m4-t1 ──
  "So we painted 35 tiles.": { style: 'B' },
  "On a wall of 50, that's most of it. On 1,000, it's hardly a start.": { style: 'B' },
  "So we have to say out of how many.": { style: 'B' },
  "Percent means out of 100, so 35 tiles out of 100 is 35%.": { style: 'B' },
  "Look at the whole wall. It has 100 equal tiles.": { style: 'B' },
  "One tile is 1 out of 100, and we write 1%.": { style: 'B' },
  "The whole wall? 100 out of 100, or 100%.": { style: 'B' },
  "Now count the painted ones, full columns first.": { style: 'B' },
  "10, 20, 30, then 5 more makes 35.": { style: 'B' },
  "So we painted 35 out of 100. That's 35%.": { style: 'B' },
  "And the tiles still bare?": { style: 'B' },
  "100 take away 35 leaves 65. That's 65%.": { style: 'B' },
  "35% and 65% make 100%, the whole wall.": { style: 'B' },
  "Don't count the EMPTY tiles.": { style: 'B+' },
  "Those 65 are still to paint. The painted ones say 35% done.": { style: 'B+' },
  // ── g6m4-t2 ──
  "3/4, 0.75 and 75%. Even the digits don't match.": { style: 'B', say: "Three fourths, zero point seven five and 75 percent. Even the digits don't match." },
  "So can they really be the same amount?": { style: 'B' },
  "Let's put all three on one grid of 100 and see.": { style: 'B' },
  "Make an amount out of 100, and you can write it three ways that all mean the same.": { style: 'B' },
  "Cut the 100 squares into 4 equal parts.": { style: 'B' },
  "How big is each part? 100 ÷ 4 = 25, so 25 squares.": { style: 'B' },
  "Take 3 parts. That's 75 squares, so 3/4 is 75/100.": { style: 'B' },
  "Now slide the same 75 squares into columns.": { style: 'B' },
  "7 full columns and 5 more.": { style: 'B' },
  "75 hundredths, with a point, is 0.75.": { style: 'B', say: "75 hundredths, with a point, is zero point seven five." },
  "And the percent? 75 out of 100 is 75%.": { style: 'B' },
  "So 3/4, 0.75 and 75% are one amount.": { style: 'B', say: "So three fourths, zero point seven five and 75 percent are one amount." },
  "All three screens were right.": { style: 'B' },
  "Don't just JOIN the 3 and the 4. 3/4 is not 34%.": { style: 'B+' },
  "Make it out of 100 first. That's 75/100, or 75%.": { style: 'B+' },
  "Three screens, one download. A game is downloading. One screen says 3/4 done. Another says 0.75. A third says 75%. Do they agree?":
    { style: 'A', say: "Three screens, one download. A game is downloading. One screen says three fourths done. Another says zero point seven five. A third says 75 percent. Do they agree?" },
  // ── g6m4-t3 ──
  "30% means 30 out of every 100.": { style: 'B' },
  "With $100, that's easy. It's just $30.": { style: 'B' },
  "But you have $80. So how do you take 30% of that?": { style: 'B' },
  "Cut the whole into 10 equal parts, each worth 10%, then take as many parts as the percent needs.": { style: 'B' },
  "Cut the $80 into 10 equal parts.": { style: 'B' },
  "What is each part? 80 ÷ 10 = 8, so each part is $8.": { style: 'B' },
  "One part is 10%, so 10% of $80 is $8.": { style: 'B' },
  "30% is 3 of those parts.": { style: 'B' },
  "Count the money in them. 8, 16, 24.": { style: 'B' },
  "So 30% of $80 is $24, for the shelter.": { style: 'B' },
  "Is $24 less than $30? Yes, just like it should be.": { style: 'B' },
  "Don't read the 30 as DOLLARS.": { style: 'B+' },
  "$30 would be 30% of $100. You have less, so you give less: $24.": { style: 'B+' },
  // ── g6m4-t4 ──
  "The $15 is not the price. It's only part of it.": { style: 'B' },
  "So is the helmet more than $15, or less?": { style: 'B' },
  "More. $15 is just 25%, and the price is the whole 100%.": { style: 'B' },
  "Find what one equal piece is worth, then count pieces all the way up to 100%.": { style: 'B' },
  "How many 25% pieces make 100%?": { style: 'B' },
  "Count by 25. 25, 50, 75, 100. That's 4 pieces.": { style: 'B' },
  "So the price is 4 equal pieces, and your $15 is one of them.": { style: 'B' },
  "The pieces are all equal.": { style: 'B' },
  "Yours is $15, so every piece is $15.": { style: 'B' },
  "Now count all 4 pieces. 15, 30, 45, 60.": { style: 'B' },
  "So the helmet costs $60.": { style: 'B' },
  "Don't take 25% OF the $15.": { style: 'B+' },
  "That gives $3.75, less than you saved. The $15 is one piece, so count 4 of them.": { style: 'B+', say: "That gives 3 dollars and 75 cents, less than you saved. The 15 dollars is one piece, so count 4 of them." },
}
