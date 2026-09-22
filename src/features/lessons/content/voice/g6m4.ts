/**
 * How g6m4's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 *
 * MONEY: speakable() says "$40" as "40 dollars" and "$4.75" as "4 dollars and 75 cents"; an amount under a dollar gets a
 * `say` in cents ("$0.25" is "25 cents"), never "0 dollars". Screen 7's "Here's the part people mix up." and
 * "Okay. Your turn." are g5m1's rows.
 */
import type { VoiceLine } from './styles'

export const G6M4_VOICE: Record<string, VoiceLine> = {
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
