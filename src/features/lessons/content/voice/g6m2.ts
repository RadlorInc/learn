/**
 * How g6m2's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G6M2_VOICE: Record<string, VoiceLine> = {
  // ── g6m2-t5 ── (its "Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  "Which number goes first, 3 or 3/4?": { style: 'B' },
  "Get it backwards, and 3 whole cups make less than one serving.": { style: 'B' },
  "That can't be right.": { style: 'B' },
  "When a story asks how many of one size fit in an amount, divide, and the amount you start with goes first.": { style: 'B' },
  "Start with what you have. Draw 3 cups as one long tape.": { style: 'B' },
  "A serving is measured in fourths, so cut each cup into 4 fourths.": { style: 'B' },
  "That's 12 fourths.": { style: 'B' },
  "One serving is 3 fourths.": { style: 'B' },
  "Mark them off, 3 at a time: 3, 6, 9, 12.": { style: 'B' },
  "That's 4 servings, nothing left over.": { style: 'B' },
  "Now write it down.": { style: 'B' },
  "How many 3/4 cups fit in 3 cups? That's 3 ÷ 3/4.": { style: 'B', say: "How many three fourths of a cup fit in 3 cups? That's 3 divided by three fourths." },
  "Flip and multiply: 3 × 4/3 = 12/3 = 4 servings.": { style: 'B' },
  "Don't put the fraction FIRST because it's smaller.": { style: 'B+' },
  "That gives 1/4 of a serving from 3 whole cups. Start with the amount: 3 ÷ 3/4 = 4.": { style: 'B+' },
  "Find how many 2/3s fit in 4: that is 4 ÷ 2/3. Flip 2/3 and multiply.": { style: 'A', say: "Find how many two thirds fit in 4. That is 4 divided by two thirds. Flip two thirds and multiply." },
  // ── g6m2-t6 ── (its "Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  "You could guess. 2 bags works, and so does 3.": { style: 'B' },
  "But is there a bigger number? Guessing, it's easy to stop too soon.": { style: 'B' },
  "List the factors of both numbers, and the biggest one on both lists is the biggest factor they share.": { style: 'B' },
  "Start with 12. What divides it with nothing left over?": { style: 'B' },
  "Find them in pairs: 1 × 12, 2 × 6, 3 × 4.": { style: 'B' },
  "So the list is 1, 2, 3, 4, 6, 12.": { style: 'B' },
  "Now 18, in pairs.": { style: 'B' },
  "1 × 18, 2 × 9, 3 × 6.": { style: 'B' },
  "The list is 1, 2, 3, 6, 9, 18.": { style: 'B' },
  "Look for numbers on both lists: 1, 2, 3 and 6.": { style: 'B' },
  "The biggest is 6.": { style: 'B' },
  "So 6 bags, each with 2 pencils and 3 erasers.": { style: 'B' },
  "Don't STOP at 3 just because it works.": { style: 'B+' },
  "Finish both lists and take the biggest, 6.": { style: 'B+' },
  // ── g6m2-t7 ── (its "Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  "Why not buy 6 of each?": { style: 'B' },
  "Buns come in packs of 4, so you can't get exactly 6 buns.": { style: 'B' },
  "You need a number that both pack sizes can make.": { style: 'B' },
  "Count by each number, and the first number both counts land on is the smallest multiple they share.": { style: 'B' },
  "Start with the hot dogs.": { style: 'B' },
  "Count by 6s with me. 6, 12, 18, 24.": { style: 'B' },
  "Now the buns, on a line underneath.": { style: 'B' },
  "Count by 4s. 4, 8, 12, 16, 20, 24.": { style: 'B' },
  "Which number do both lines hit first? 12.": { style: 'B' },
  "So buy 12 of each. That's 2 packs of hot dogs and 3 packs of buns.": { style: 'B' },
  "Don't just MULTIPLY 6 × 4.": { style: 'B+' },
  "24 works, but 12 comes first. Stop at the first number both counts share.": { style: 'B+' },
}
