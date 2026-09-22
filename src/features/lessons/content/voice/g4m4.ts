/**
 * How g4m4's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G4M4_VOICE: Record<string, VoiceLine> = {
  // ── g4m4-t6 ── (its "Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  "Do you take away the top and the bottom?": { style: 'B' },
  "Then the bottom is 8 take away 8, which is 0. But there is still pizza here.": { style: 'B' },
  "So the 8 is not a count. It tells you how big each slice is.": { style: 'B' },
  "When the pieces are the same size, take away the pieces and keep the bottom number.": { style: 'B' },
  "7/8 means 7 slices are on the tray.": { style: 'B' },
  "Each slice is one eighth of the pizza.": { style: 'B' },
  "Now you eat 3 slices. Take them off the tray.": { style: 'B' },
  "How many are still there? 4 slices.": { style: 'B' },
  "7 slices take away 3 slices leaves 4 slices.": { style: 'B' },
  "Are they smaller now? No. They are still eighths.": { style: 'B' },
  "So 7/8 − 3/8 = 4/8.": { style: 'B' },
  "Don't take away the BOTTOM numbers.": { style: 'B+' },
  "The slices are still eighths, so the bottom stays 8.": { style: 'B+' },
  // ── g4m4-t7 ── (its "Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  "2 pizzas and 3/4 of another. That's one way to say it.": { style: 'B' },
  "But how many slices is that? The 2 counts pizzas, not slices.": { style: 'B' },
  "So find the slices inside each pizza first.": { style: 'B' },
  "Count the pieces in every whole, then add the extra pieces.": { style: 'B' },
  "Each pizza is cut into 4 slices, so one whole pizza is 4/4.": { style: 'B' },
  "Two pizzas is 4 and 4. That's 8 slices.": { style: 'B' },
  "Now the part pizza. It has 3 more slices.": { style: 'B' },
  "8 and 3 more makes 11 slices.": { style: 'B' },
  "Every slice is one fourth, so 11 slices is 11/4.": { style: 'B' },
  "Is that more pizza? No. Same pizza, counted a new way.": { style: 'B' },
  "So 2 3/4 = 11/4.": { style: 'B' },
  "Don't ADD the 2 to the 3.": { style: 'B+' },
  "Each whole pizza is 4 slices, so it's 4 and 4 and 3. That's 11/4.": { style: 'B+' },
  // Spoken outside the teach (the Screen 8 question and its twin): "?/4" needs words
  "Now you try. Write 2 1/4 as fourths. 2 1/4 = ?/4. What is the missing top number? Count the fourths in the wholes. Then add the extra fourth.": { style: 'A', say: "Now you try. Write 2 and one fourth as fourths. 2 and one fourth equals how many fourths? What is the missing top number? Count the fourths in the wholes. Then add the extra fourth." },
  "Try a new one. Write 1 2/3 as thirds. 1 2/3 = ?/3. What is the missing top number?": { style: 'A', say: "Try a new one. Write 1 and two thirds as thirds. 1 and two thirds equals how many thirds? What is the missing top number?" },
  // ── g4m4-t8 ── (its "Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  "Look at all these numbers. Each amount has wholes and pieces.": { style: 'B' },
  "Where do you start? Sort them first.": { style: 'B' },
  "Wholes go with wholes. Pieces go with pieces.": { style: 'B' },
  "Add the wholes, add the pieces, then put them together.": { style: 'B' },
  "Wholes first. 1 whole cup for bread, and 1 whole cup for pancakes.": { style: 'B' },
  "1 and 1 makes 2 whole cups.": { style: 'B' },
  "Now the pieces, 1/4 and 2/4. Both are fourths, the same size.": { style: 'B' },
  "1 fourth and 2 fourths make 3 fourths. That's 3/4 of a cup.": { style: 'B' },
  "Now put the two answers together. 2 whole cups, and 3/4 of a cup more.": { style: 'B' },
  "So 1 1/4 + 1 2/4 = 2 3/4 cups.": { style: 'B' },
  "Don't add the BOTTOM numbers.": { style: 'B+' },
  "Fourths and fourths are still fourths, so the bottom stays 4.": { style: 'B+' },
  // ── g4m4-t9 ── (its "Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  "Look at 3 and 1/4. Do they mean the same thing?": { style: 'B' },
  "No. The 3 counts friends. The 1/4 is the size of each piece.": { style: 'B' },
  "So you can't just multiply 3 by 4.": { style: 'B' },
  "A whole number times a fraction is that many copies of one piece, so count the pieces and keep their size.": { style: 'B' },
  "Each friend gets one piece, 1/4 of a sandwich.": { style: 'B' },
  "3 friends, so 3 copies of 1/4.": { style: 'B' },
  "Now put the 3 pieces together in one sandwich.": { style: 'B' },
  "They fill 3 of the 4 parts. One part is still empty.": { style: 'B' },
  "So 3 copies of 1/4 is 3/4.": { style: 'B' },
  "The pieces grew from 1 to 3. Their size stayed the same.": { style: 'B' },
  "So 3 × 1/4 = 3/4.": { style: 'B' },
  "Don't multiply the BOTTOM number too.": { style: 'B+' },
  "That gives 3/12, much smaller pieces. The pieces are still fourths.": { style: 'B+' },
}
