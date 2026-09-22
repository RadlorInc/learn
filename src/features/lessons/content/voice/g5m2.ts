/**
 * How g5m2's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G5M2_VOICE: Record<string, VoiceLine> = {
  // ── g5m2-t1 ── ("Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  "A half is a big piece. A fourth is a small one.": { style: 'B' },
  "Can we add 1 piece and 1 piece? Not yet.": { style: 'B' },
  "The pieces are different sizes.": { style: 'B' },
  "Make the pieces the same size first, then add how many pieces you have.": { style: 'B' },
  "Cut each half down the middle.": { style: 'B' },
  "Now the bar has 4 pieces, each a fourth.": { style: 'B' },
  "Same amount, new name. So 1/2 is 2/4.": { style: 'B' },
  "Now both bars are in fourths. Every piece is the same size.": { style: 'B' },
  "2 fourths and 1 more fourth make 3 fourths.": { style: 'B' },
  "Look at the bottom number. It stays 4, because the pieces are still fourths.": { style: 'B' },
  "So 1/2 + 1/4 = 3/4. You ran 3/4 mile.": { style: 'B', say: "So one half plus one fourth equals three fourths. You ran three fourths of a mile." },
  "Don't ADD the bottom numbers. 1/2 + 1/4 is not 2/6.": { style: 'B+', say: "Don't add the bottom numbers. One half plus one fourth is not two sixths." },
  "Adding doesn't make the pieces smaller, so the bottom stays 4.": { style: 'B+' },
  // ── g5m2-t2 ── ("Count by 3s. 3, 6, 9, 12." is g4m2's row)
  "Thirds and fourths are different sizes.": { style: 'B' },
  "Can we cut thirds into fourths? No.": { style: 'B' },
  "We need a size both can make.": { style: 'B' },
  "Count by each bottom number, and the first number in both lists is a piece size that fits both.": { style: 'B' },
  "Now count by 4s. 4, 8, 12.": { style: 'B' },
  "12 is the first number in both. So we use twelfths.": { style: 'B' },
  "Cut each third into 4 pieces. So 2 thirds become 8 twelfths.": { style: 'B' },
  "Cut each fourth into 3 pieces. So 1 fourth becomes 3 twelfths.": { style: 'B' },
  "Look at both bars now.": { style: 'B' },
  "Did anything get bigger or smaller? No.": { style: 'B' },
  "Same amounts, new names, and the pieces match.": { style: 'B' },
  "Don't change ONLY the bottom number. 2/3 is not 2/12.": { style: 'B+', say: "Don't change only the bottom number. Two thirds is not two twelfths." },
  "Cut each piece into 4, so 2 shaded pieces become 8.": { style: 'B+' },
  // ── g5m2-t3 ──
  "You have fourths, and you eat a half.": { style: 'B' },
  "Can you take 1 piece from 3 pieces? Not yet.": { style: 'B' },
  "A half is bigger than a fourth.": { style: 'B' },
  "Make the pieces the same size first, then take away pieces.": { style: 'B' },
  "Cut the half down the middle.": { style: 'B' },
  "Now it is 2 fourths.": { style: 'B' },
  "So the half you eat is 2 fourths.": { style: 'B' },
  "Now take away. 3 fourths take away 2 fourths.": { style: 'B' },
  "How many are left? 1 fourth.": { style: 'B' },
  "The bottom number stays 4, because the pieces are still fourths.": { style: 'B' },
  "So 3/4 − 1/2 = 1/4. There is 1/4 of the pizza left.": { style: 'B' },
  "Don't TAKE AWAY one bottom number from the other. 3/4 − 1/2 is not 2/2.": { style: 'B+', say: "Don't take away one bottom number from the other. Three fourths minus one half is not two halves." },
  "2/2 is a whole pizza, but you ate half of one. It's 1/4.": { style: 'B+', say: "Two halves is a whole pizza, but you ate half of one. It's one fourth." },
  // ── g5m2-t4 ──
  "Look. There are 2 wholes and 2 pieces, and the pieces are different sizes.": { style: 'B' },
  "Where do you start? With the wholes. The pieces come after.": { style: 'B' },
  "Add the wholes, then add the pieces, and if the pieces make a whole, trade them for 1 more whole.": { style: 'B' },
  "1 whole and 1 whole make 2 wholes.": { style: 'B' },
  "Keep that 2 for later.": { style: 'B' },
  "Now the pieces. Cut the half into 2, and it's 2/4.": { style: 'B' },
  "2 fourths and 3 fourths make 5 fourths.": { style: 'B' },
  "Is that more than a whole? Yes. A whole is 4 fourths.": { style: 'B' },
  "So trade 4 fourths for 1 whole, and 1 fourth is left.": { style: 'B' },
  "Add the 2 wholes. That's 3 1/4 miles.": { style: 'B' },
  "Don't ADD the bottom numbers of the pieces. 1/2 + 3/4 is not 4/6.": { style: 'B+', say: "Don't add the bottom numbers of the pieces. One half plus three fourths is not four sixths." },
  "Make the pieces match first, then add them.": { style: 'B+' },
}
