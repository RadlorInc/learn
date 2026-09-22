/**
 * How g6m1's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G6M1_VOICE: Record<string, VoiceLine> = {
  // ── g6m1-t5 ──
  "You have 15 cups of nuts. How much cereal goes with them?": { style: 'B' },
  "Going from 3 and 5 straight to 15 is a big jump. So take small steps, in a table.": { style: 'B' },
  "Every column is the same mix, so you can multiply, divide or add whole columns to make a new one.": { style: 'B' },
  "Start with 3 cups of nuts and 5 cups of cereal.": { style: 'B' },
  "Double both. 3 × 2 = 6, and 5 × 2 = 10.": { style: 'B' },
  "Same mix, just twice as much.": { style: 'B' },
  "Can you add two columns together? Yes.": { style: 'B' },
  "3 + 6 = 9 cups of nuts, and 5 + 10 = 15 cups of cereal.": { style: 'B' },
  "Still the same mix.": { style: 'B' },
  "Now look. 6 + 9 = 15 cups of nuts, just what you have.": { style: 'B' },
  "So add those two columns. Underneath, 10 + 15 = 25.": { style: 'B' },
  "You need 25 cups of cereal.": { style: 'B' },
  "Don't ADD 12 to both numbers. 5 + 12 = 17 makes a different mix.": { style: 'B+' },
  "3 × 5 = 15, so multiply the cereal by 5 too. That's 25.": { style: 'B+' },
  // ── g6m1-t6 ──
  "Are there just 3 girls in the class? No.": { style: 'B' },
  "There are 30 students in all.": { style: 'B' },
  "The 2 and the 3 only say that for every 2 boys, there are 3 girls.": { style: 'B' },
  "Add the parts to find how many equal boxes make the whole, then find what one box holds.": { style: 'B' },
  "Draw it as boxes. 2 for the boys, 3 for the girls.": { style: 'B' },
  "Every box holds the same number of students.": { style: 'B' },
  "How many boxes in all? 2 + 3 = 5.": { style: 'B' },
  "Those 5 boxes hold all 30 students.": { style: 'B' },
  "So 30 ÷ 5 = 6 in each box.": { style: 'B' },
  "The girls have 3 boxes, and each box holds 6.": { style: 'B' },
  "3 × 6 = 18. So there are 18 girls.": { style: 'B' },
  "Check it. The boys have 2 × 6 = 12, and 12 + 18 = 30.": { style: 'B' },
  "Don't divide 30 by JUST the 3. That leaves out the boys.": { style: 'B+' },
  "Use all 5 boxes. 30 ÷ 5 = 6, and 3 × 6 = 18.": { style: 'B+' },
  // ── g6m1-t7 ──
  "Is 4 feet the same as 4 inches? No.": { style: 'B' },
  "A foot is much longer than an inch.": { style: 'B' },
  "So first you need one fact. How many inches fit in 1 foot?": { style: 'B' },
  "Start from one fact, 1 foot is 12 inches, then multiply to change to the smaller unit and divide to change back.": { style: 'B' },
  "1 foot is 12 inches.": { style: 'B' },
  "So 2 feet is 24 inches, and 3 feet is 36 inches.": { style: 'B' },
  "Each extra foot adds 12 more.": { style: 'B' },
  "Do you have to step up one foot at a time? No.": { style: 'B' },
  "4 feet is 4 × 12 = 48 inches.": { style: 'B' },
  "So the shelf is 48 inches long.": { style: 'B' },
  "What about going back, from inches to feet?": { style: 'B' },
  "Feet are bigger, so you divide by 12.": { style: 'B' },
  "36 ÷ 12 = 3. So 36 inches is 3 feet.": { style: 'B' },
  "Going to the smaller unit, don't DIVIDE.": { style: 'B+' },
  "Smaller units mean more of them, so multiply. 4 × 12 = 48 inches.": { style: 'B+' },
  // ── g6m1-t8 ──
  "36 miles is how far you rode in all, over 3 hours.": { style: 'B' },
  "So how far did you ride in one hour? The total can't say.": { style: 'B' },
  "A faster rider could do the same 36 miles in 2 hours.": { style: 'B' },
  "How fast you go is how far you go in one hour, so divide the distance by the hours.": { style: 'B' },
  "Cut the ride up by the hours.": { style: 'B' },
  "3 hours means 3 equal jumps, one for each hour.": { style: 'B' },
  "So how long is one jump? 36 ÷ 3 = 12.": { style: 'B' },
  "Each jump is 12 miles. So you ride 12 miles in one hour.": { style: 'B' },
  "12 miles in each hour is 12 miles per hour.": { style: 'B' },
  "Check it. 3 × 12 = 36 miles, the whole ride.": { style: 'B' },
  "Don't divide the HOURS by the miles.": { style: 'B+' },
  "The miles go first. 36 ÷ 3, not 3 ÷ 36.": { style: 'B+' },
  // lines outside the teach
  "You divided 150 minutes by 60 and got 2.5 hours.": { style: 'A', say: "You divided 150 minutes by 60 and got two and a half hours." },
}
