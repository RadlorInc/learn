/**
 * How g6m4's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 *
 * DECIMALS: speakable() does not spell them. Topic 2 teaches the WRITTEN form, so 0.75 is read digit by digit, "zero point
 * seven five". Money (.75 in topic 4) is how much, so it is said as dollars and cents. Screen 7's "Here's the part
 * people mix up." and "Okay. Your turn." are g5m1's rows.
 * MONEY: speakable() says "$40" as "40 dollars" and "$4.75" as "4 dollars and 75 cents"; an amount under a dollar gets a
 * `say` in cents ("$0.25" is "25 cents"), never "0 dollars". Screen 7's "Here's the part people mix up." and
 * "Okay. Your turn." are g5m1's rows.
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
  // ── g6m4-t5 ──
  'The sign gives a percent, not dollars.': { style: 'B' },
  'So how many dollars come off the $40?': { style: 'B' },
  'We have to find that before we can pay.': { style: 'B' },
  'First find the money you save, then take it away from the price.': { style: 'B' },
  'Look at the $40 as 4 equal pieces.': { style: 'B' },
  'Why 4? Because 25% four times makes 100%.': { style: 'B' },
  '40 ÷ 4 = 10, so each piece is $10.': { style: 'B' },
  '25% off takes one piece away. You save $10.': { style: 'B' },
  'Now take the saving off the price. $40 − $10 = $30.': { style: 'B' },
  'So you pay $30 for the jacket.': { style: 'B' },
  '25% off does NOT mean $25 off.': { style: 'B+' },
  "It means 25 out of every 100 dollars. On $40, that's only $10.": { style: 'B+' },
  // ── g6m4-t6 ──
  'The tag says $25. But is that what you pay?': { style: 'B' },
  'No. The store adds 8% on top.': { style: 'B' },
  "And how many dollars is 8%? We don't know yet.": { style: 'B' },
  'Find the tax first, then add it to the price, so you pay more than the tag.': { style: 'B' },
  "The $25 is the whole price. That's 100%.": { style: 'B' },
  "So what is 1%? 25 ÷ 100 = $0.25. That's one quarter.": { style: 'B', say: "So what is 1%? 25 divided by 100 is 25 cents. That's one quarter." },
  '8% is 8 of those quarters.': { style: 'B' },
  '8 × $0.25 = $2. So the tax is $2.': { style: 'B', say: '8 times 25 cents is $2. So the tax is $2.' },
  'Now add the tax to the price.': { style: 'B' },
  "$25 + $2 = $27. That's what you pay at the register.": { style: 'B' },
  '8% does NOT mean $8 of tax.': { style: 'B+' },
  '8% of $25 is only $2. So you pay $27, not $33.': { style: 'B+' },
  // ── g6m4-t7 ──
  'The bank pays 4% of your $500, every year.': { style: 'B' },
  'So how many dollars is that? And there are 3 years, not one.': { style: 'B' },
  'Find what the bank pays for one year, then multiply by the number of years.': { style: 'B' },
  "Start with one year. What's 1% of $500?": { style: 'B' },
  '500 ÷ 100 = 5, so 1% is $5.': { style: 'B' },
  '4% is 4 of those. 4 × $5 = $20 a year.': { style: 'B' },
  "Year 2 pays 4% of the same $500. So it's $20 again.": { style: 'B' },
  'Year 3 pays $20 too.': { style: 'B' },
  '3 years of $20 is 3 × $20 = $60.': { style: 'B' },
  'So the bank pays you $60.': { style: 'B' },
  "With your $500, that's $560 in all.": { style: 'B' },
  "Don't STOP at one year. $20 is only year 1.": { style: 'B+' },
  '3 years pays 3 times as much, $60.': { style: 'B+' },
  'Now you try. You put $600 in a bank that pays 3% a year. How many dollars does the bank pay you in 2 years? (Just what the bank pays, not the $600.) Find one year first. Then multiply by the years.':
    { style: 'A', say: 'Now you try. You put $600 in a bank that pays 3% a year. How many dollars does the bank pay you in 2 years? Just what the bank pays, not the $600. Find one year first. Then multiply by the years.' },
  'Try a new one. You put $200 in a bank that pays 6% a year. How many dollars does the bank pay you in 4 years? (Just what the bank pays.)':
    { style: 'A', say: 'Try a new one. You put $200 in a bank that pays 6% a year. How many dollars does the bank pay you in 4 years? Just what the bank pays.' },
}
