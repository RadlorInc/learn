/**
 * How Grade 5 · Module 1's re-voiced lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson
 * says it — that is what the clip is looked up by. `say` is what the voice model reads: the same words with
 * symbols spelt out (no tags, no ellipses — docs/new-flow/voice.md). A line with no row here renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G5M1_VOICE: Record<string, VoiceLine> = {
  // ── g5m1-t1 ──
  "You could add 40, ten times.": { style: 'B' },
  "That works. But it takes a while, and it's easy to lose count.": { style: 'B' },
  "Is there a faster way? Yes. It's in this chart of places.": { style: 'B' },
  "Slide a digit left and it's worth 10 times as much, slide it right and it's worth 1/10 as much.": { style: 'B' },
  "Look at the places, from the right.": { style: 'B' },
  "10 ones make 1 ten. 10 tens make 1 hundred. 10 hundreds make 1 thousand.": { style: 'B' },
  "See the pattern? Each step to the left is 10 times as much.": { style: 'B' },
  "Look at 40. The 4 is in the tens place.": { style: 'B' },
  "Slide it one place to the left, into the hundreds. That's 400.": { style: 'B' },
  "That's 10 times as much. So a carton holds 400 pencils.": { style: 'B' },
  "Now go back the other way. One box is 1/10 of a carton.": { style: 'B' },
  "Slide the 4 in 400 one place to the right, back to the tens. That's 40.": { style: 'B' },
  "So 1/10 of 400 is 40 pencils.": { style: 'B' },
  "Here's the part people mix up.": { style: 'B+' },
  "Ten times as much does not mean ADD 10.": { style: 'B+' },
  "That gives 50. Every digit slides one place to the left.": { style: 'B+' },
  "Okay. Your turn.": { style: 'B' },
  "You did it! You slid the 7 one place to the left, and now it's worth 10 times as much.": { style: 'B' },
  "Yes! You slid the 3 one place to the left, from 300 all the way to 3,000.": { style: 'B' },
  // ── g5m1-t2 ── (its "Here's the part people mix up." and "Okay. Your turn." share t1's rows)
  "Add 37 one thousand times? That would take all day.": { style: 'B' },
  "There's a faster way. And it works for dividing too.": { style: 'B' },
  "Each zero in 10, 100 or 1,000 slides every digit one place, left to multiply and right to divide.": { style: 'B' },
  "Start with 10. It has one zero.": { style: 'B' },
  "So 37 × 10 slides the 3 and the 7 one place to the left.": { style: 'B' },
  "The ones place is empty now, so a 0 fills it. That's 370.": { style: 'B', say: "The ones place is empty now, so a zero fills it. That's 370." },
  "Now 100. It has two zeros, so the digits slide two places. That's 3,700.": { style: 'B' },
  "1,000 has three zeros, so they slide three places. That's 37,000.": { style: 'B' },
  "So the shop has 37,000 beads.": { style: 'B' },
  "Now go backwards. The shop shares 37,000 beads into 1,000 bags.": { style: 'B' },
  "1,000 still has three zeros. So every digit slides three places — this time to the right.": { style: 'B' },
  "The zeros slide off the end. That's 37 beads in each bag.": { style: 'B' },
  "When you divide, don't slide LEFT.": { style: 'B+' },
  "Dividing makes the number smaller, so every digit slides right.": { style: 'B+' },
  "You did it! You counted three zeros and slid every digit three places to the left.": { style: 'B' },
  "Yes! You counted two zeros and slid 29 two places to the left, all the way to 2,900.": { style: 'B' },
}
