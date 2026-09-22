/**
 * How g7m5's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G7M5_VOICE: Record<string, VoiceLine> = {
  // ── g7m5-t4 ── ("Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  "There are four colors here. So is the chance of blue 1 out of 4?": { style: 'B' },
  "Blue covers 4 parts. Yellow covers only 1.": { style: 'B' },
  "The colors are not the same size, so count the parts, not the colors.": { style: 'B' },
  "The chance of something is the ways it can happen over all the equal ways, a number from 0 to 1.": { style: 'B' },
  "Count the blue parts with me. 1, 2, 3, 4.": { style: 'B' },
  "Now count every part. There are 10, all the same size.": { style: 'B' },
  "So blue is 4 ways out of 10 equal ways. That's 4/10.": { style: 'B' },
  "4/10 is four tenths.": { style: 'B' },
  "How do we write four tenths as a decimal? A 4 in the tenths place, 0.4.": { style: 'B', say: "How do we write four tenths as a decimal? A 4 in the tenths place, zero point four." },
  "4/10 and 0.4 are the same chance, just written two ways.": { style: 'B', say: "Four tenths and zero point four are the same chance, just written two ways." },
  "What about not blue? That's the other 6 parts.": { style: 'B' },
  "6 out of 10 is 6/10, or 0.6.": { style: 'B', say: "6 out of 10 is six tenths, or zero point six." },
  "Add them, and 0.4 + 0.6 = 1, because the spinner always lands somewhere.": { style: 'B', say: "Add them, and zero point four plus zero point six equals 1, because the spinner always lands somewhere." },
  "And purple? There is no purple, so its chance is 0.": { style: 'B' },
  "Don't put the blue parts over the parts that are NOT blue. That gives 4/6.": { style: 'B+' },
  "Blue goes over all 10 parts, so it's 4/10, or 0.4.": { style: 'B+', say: "Blue goes over all 10 parts, so it's four tenths, or zero point four." },
  // ── g7m5-t5 ── ("Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  "One kid guessed 40 heads. Another guessed 10.": { style: 'B' },
  "Which guess is right? A guess could be anything at all.": { style: 'B' },
  "What we want is a number that comes from the coin itself.": { style: 'B' },
  "The number you expect is the chance times the number of tries, and real results land near it, not always on it.": { style: 'B' },
  "On each flip, heads has a chance of 1/2.": { style: 'B' },
  "Multiply that chance by the 50 tries. 1/2 × 50 = 25.": { style: 'B' },
  "So we expect 25 heads, and 25 tails.": { style: 'B' },
  "Here is what the class really got. 27 heads, and 23 tails.": { style: 'B' },
  "Is 27 close to 25? Yes, just 2 more.": { style: 'B' },
  "Every flip starts fresh, so real results wander a little.": { style: 'B' },
  "Another class flipped 500 times and got 246 heads.": { style: 'B' },
  "27 out of 50 is 0.54. 246 out of 500 is 0.492.": { style: 'B', say: "27 out of 50 is zero point five four. 246 out of 500 is zero point four nine two." },
  "Which one is closer to one half, 0.5? The 500 flips.": { style: 'B', say: "Which one is closer to one half, zero point five? The 500 flips." },
  "The more tries you take, the closer you get to the chance.": { style: 'B' },
  "The real count does NOT have to equal the expected count.": { style: 'B+' },
  "27 heads is not a mistake, and the coin is not broken. Close to 25 is just what real results do.": { style: 'B+' },
  // ── g7m5-t6 ── ("Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  "Heads is 1/2. A 5 is 1/6. So do we just add them?": { style: 'B' },
  "1/2 + 1/6 = 4/6. That's bigger than either chance on its own.": { style: 'B' },
  "But getting both at once should be harder than getting one, not easier.": { style: 'B' },
  "To find the chance of two things together, list every pair in a table and count the pairs you want over all the pairs.": { style: 'B' },
  "Let's build the table. The rows are the coin, heads or tails.": { style: 'B' },
  "The columns are the cube, 1 through 6.": { style: 'B' },
  "Every box is one way the two can land together. H1, H2, all the way to T6.": { style: 'B', say: "Every box is one way the two can land together. Heads 1, heads 2, all the way to tails 6." },
  "How many boxes are there?": { style: 'B' },
  "2 rows × 6 columns = 12.": { style: 'B' },
  "So there are 12 pairs, each one just as likely.": { style: 'B' },
  "Now find the one we wanted, heads and a 5.": { style: 'B' },
  "It's a single box, H5, in the heads row.": { style: 'B', say: "It's a single box, heads 5, in the heads row." },
  "One box out of 12, so the chance is 1/12.": { style: 'B' },
  "That's smaller than 1/2, and smaller than 1/6, just as it should be.": { style: 'B' },
  "Don't ADD the two chances together.": { style: 'B+' },
  "Make the table, then count the pairs you want over all the pairs.": { style: 'B+' },
  // ── g7m5-t6, outside the teach (the twin): the parentheses said as words ──
  "Try a new one. You spin a spinner with 3 equal parts (red, blue and green) and flip a coin. What is the probability of blue and heads?": { style: 'A', say: "Try a new one. You spin a spinner with 3 equal parts, red, blue and green, and flip a coin. What is the probability of blue and heads?" },
}
