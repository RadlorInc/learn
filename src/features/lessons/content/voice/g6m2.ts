/**
 * How g6m2's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G6M2_VOICE: Record<string, VoiceLine> = {
  // Their "Here's the part people mix up.", "Okay. Your turn." and "Is there a faster way? Yes." share rows in other modules.
  // ── g6m2-t1 ──
  "Dividing usually means sharing. But you can't share lasagna with 1/8 of a person.": { style: 'B' },
  "So what does 3/4 ÷ 1/8 ask? How many 1/8 servings fit in 3/4.": { style: 'B' },
  "Dividing by a fraction asks how many of that fraction fit, so cut both into same-size pieces and count.": { style: 'B' },
  "Fourths and eighths are different sizes.": { style: 'B' },
  "So cut each fourth in half. Now every piece is 1/8, one serving.": { style: 'B' },
  "Look, the 3/4 is now 6/8.": { style: 'B' },
  "How many eighths are shaded?": { style: 'B' },
  "Count with me. One, two, three, four, five, six.": { style: 'B' },
  "So 3/4 ÷ 1/8 = 6. You can cut 6 servings.": { style: 'B' },
  "Check it. 6 eighths is 6/8, and that's 3/4.": { style: 'B' },
  "Dividing does not always make a number SMALLER.": { style: 'B+' },
  "Small pieces fit many times, so the answer is bigger than 3/4.": { style: 'B+' },
  // ── g6m2-t2 ──
  "You could cut both liters into thirds and count.": { style: 'B' },
  "But what about 5/6 ÷ 4/9? Drawing that would take forever.": { style: 'B' },
  "Dividing by a fraction is the same as multiplying by that fraction flipped upside down.": { style: 'B' },
  "First, the slow way. Cut each liter into thirds. That's 6 thirds.": { style: 'B' },
  "Each bottle takes 2 thirds. How many groups of 2 fit in 6? 3 bottles.": { style: 'B' },
  "Look at what we did.": { style: 'B' },
  "Cutting into thirds was × 3.": { style: 'B' },
  "Grouping by 2 was ÷ 2.": { style: 'B' },
  "Times 3, then divided by 2, is the same as × 3/2.": { style: 'B' },
  "Here's the shortcut.": { style: 'B' },
  "Keep the 2. Change ÷ to ×. Flip 2/3 to 3/2.": { style: 'B', say: "Keep the 2. Change divide to times. Flip two thirds to three halves." },
  "2 × 3/2 = 6/2, which is 3. Same answer.": { style: 'B' },
  "Don't flip the FIRST number.": { style: 'B+' },
  "The 2 stays. Only the 2/3 turns upside down.": { style: 'B+' },
  // ── g6m2-t3 ──
  "It's tempting to do 2 × 1 = 2 and 1/2 × 1/2 = 1/4.": { style: 'B' },
  "But is 2 1/4 the whole bed? Look. Two parts are missing.": { style: 'B' },
  "Change each mixed number into a fraction first, then multiply the tops and multiply the bottoms.": { style: 'B' },
  "Let's find all four parts.": { style: 'B' },
  "2 × 1 = 2, and 1/2 × 1 = 1/2.": { style: 'B' },
  "2 × 1/2 = 1, and the corner is 1/4.": { style: 'B' },
  "Add them up. 3 3/4 square yards.": { style: 'B' },
  "2 1/2 is 5 halves, so it's 5/2.": { style: 'B' },
  "And 1 1/2 is 3 halves, so it's 3/2.": { style: 'B' },
  "Multiply straight across. 5/2 × 3/2 = 15/4.": { style: 'B', say: "Multiply straight across. Five halves times three halves equals fifteen fourths." },
  "12/4 makes 3 wholes, with 3/4 left.": { style: 'B', say: "Twelve fourths makes 3 wholes, with three fourths left." },
  "So the bed covers 3 3/4 square yards.": { style: 'B' },
  "Don't multiply the wholes and the fractions SEPARATELY.": { style: 'B+' },
  "That leaves out two parts. Change to fractions first.": { style: 'B+' },
  // ── g6m2-t4 ──
  "Our rule is flip and multiply.": { style: 'B' },
  "But 2 1/4 is a whole number and a fraction stuck together.": { style: 'B' },
  "What would we flip? We can't use the rule yet.": { style: 'B' },
  "Change mixed numbers into fractions first, then flip the one you divide by and multiply.": { style: 'B' },
  "So let's turn 2 1/4 into one fraction. Each pound is 4 fourths.": { style: 'B' },
  "2 pounds make 8 fourths, and the extra fourth makes 9.": { style: 'B' },
  "So 2 1/4 is 9/4.": { style: 'B' },
  "Now the rule works.": { style: 'B' },
  "Flip 3/4 to 4/3 and multiply. 9/4 × 4/3 = 36/12.": { style: 'B', say: "Flip three fourths to four thirds and multiply. Nine fourths times four thirds equals 36 twelfths." },
  "And 36/12 is 3, because 12 twelfths make 1.": { style: 'B' },
  "Does 3 make sense? Look at the 9 fourths.": { style: 'B' },
  "Each patty takes 3 of them. That's 3 patties.": { style: 'B' },
  "Don't divide the 2 and the 1/4 SEPARATELY.": { style: 'B+' },
  "2 1/4 is one amount. Change it to 9/4 first.": { style: 'B+' },
  // Spoken outside the teach (Screen 8 with its prompt); the words are unchanged, the voice is given the signs as words.
  "Now you try. You have 3 liters of juice. Each bottle holds 3/4 liter. How many bottles can you fill? Find 3 \u00f7 3/4. Keep the first number, change \u00f7 to \u00d7, and flip the fraction you divide by.": { style: 'A', say: "Now you try. You have 3 liters of juice. Each bottle holds three fourths liter. How many bottles can you fill? Find 3 divided by three fourths. Keep the first number, change divide to times, and flip the fraction you divide by." },
}
