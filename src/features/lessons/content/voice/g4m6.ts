/**
 * How g4m6's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 *
 * DECIMALS: speakable() does not spell them, so every line with one has a `say`. Topics 1–3 teach the WRITTEN form (a
 * number with a point), so she reads it digit by digit: 0.3 "zero point three", 0.50 "zero point five zero" — the
 * trailing zero IS topic 3. Topic 4 is about the size of a jump, so there she says what it is worth: 0.6 "six tenths",
 * 1.3 "one and three tenths". Screen 7's "Here's the part people mix up." and "Okay. Your turn." are g5m1's rows.
 */
import type { VoiceLine } from './styles'

export const G4M6_VOICE: Record<string, VoiceLine> = {
  // ── g4m6-t1 ──
  'You know this one. 3 strips out of 10 is 3/10.': { style: 'B' },
  'But a scale shows a number with a point in it.': { style: 'B' },
  'So how do we write 3/10 with a point?': { style: 'B' },
  'The first digit after the point counts tenths, so 3/10 is 0.3.': { style: 'B', say: 'The first digit after the point counts tenths, so three tenths is zero point three.' },
  'Look at one strip.': { style: 'B' },
  'The bar has 10 equal strips, so one strip is one tenth.': { style: 'B' },
  'We write it 1/10, or with a point, 0.1.': { style: 'B', say: 'We write it one tenth, or with a point, zero point one.' },
  'Now count your strips with me.': { style: 'B' },
  'One, two, three.': { style: 'B' },
  "Each one is a tenth, so that's 3 tenths.": { style: 'B' },
  "As a fraction, it's 3/10.": { style: 'B' },
  "With a point, it's 0.3.": { style: 'B', say: "With a point, it's zero point three." },
  'The 0 means no whole bar, and the 3 sits right after the point.': { style: 'B', say: 'The zero means no whole bar, and the 3 sits right after the point.' },
  "Don't write 0.03. That extra 0 pushes the 3 one place too FAR.": { style: 'B+', say: "Don't write zero point zero three. That extra zero pushes the 3 one place too far." },
  "Tenths go right after the point, so it's 0.3.": { style: 'B+', say: "Tenths go right after the point, so it's zero point three." },
  'Now you try. A bar is cut into 10 equal strips. You have 0.4 of the bar. Write it as a fraction. The number after the point tells how many strips. The bar has 10 strips.':
    { style: 'A', say: 'Now you try. A bar is cut into 10 equal strips. You have zero point four of the bar. Write it as a fraction. The number after the point tells how many strips. The bar has 10 strips.' },
  'Each strip is 1/10. How many strips is 0.4?': { style: 'A', say: 'Each strip is one tenth. How many strips is zero point four?' },
  'You counted 7 tenths and wrote 0.7.': { style: 'A', say: 'You counted 7 tenths and wrote zero point seven.' },
  // ── g4m6-t2 ──
  'Remember, one full column is one tenth.': { style: 'B' },
  'But 25 squares is more than 2 columns, and less than 3.': { style: 'B' },
  'So how do we name the extra squares?': { style: 'B' },
  'The second digit after the point counts hundredths, so 25/100 is 0.25.': { style: 'B', say: 'The second digit after the point counts hundredths, so twenty-five hundredths is zero point two five.' },
  'Now go smaller, to one little square.': { style: 'B' },
  'The sheet has 100 equal squares, so one square is one hundredth.': { style: 'B' },
  'We write it 1/100, or with a point, 0.01.': { style: 'B', say: 'We write it one hundredth, or with a point, zero point zero one.' },
  'Now count the used stickers. Full columns first, by 10s.': { style: 'B', say: 'Now count the used stickers. Full columns first, by tens.' },
  'Ten, twenty. Then 5 more makes 25.': { style: 'B' },
  'That is 25 hundredths.': { style: 'B', say: 'That is twenty-five hundredths.' },
  "As a fraction, it's 25/100.": { style: 'B', say: "As a fraction, it's twenty-five hundredths." },
  "With a point, it's 0.25.": { style: 'B', say: "With a point, it's zero point two five." },
  'The 2 counts the full columns, and the 5 counts the extra squares.': { style: 'B' },
  "Don't write 2.5. That means more than 2 WHOLE sheets.": { style: 'B+', say: "Don't write two point five. That means more than 2 whole sheets." },
  "Hundredths need two places after the point, so it's 0.25.": { style: 'B+', say: "Hundredths need two places after the point, so it's zero point two five." },
  'You counted the shaded squares out of 100 and wrote 0.62.': { style: 'A', say: 'You counted the shaded squares out of 100 and wrote zero point six two.' },
  // ── g4m6-t3 ──
  'Look at the two numbers.': { style: 'B' },
  '0.50 has more digits than 0.5, and 50 is more than 5.': { style: 'B', say: 'Zero point five zero has more digits than zero point five, and 50 is more than 5.' },
  "So is 0.50 bigger? Let's check on the tray.": { style: 'B', say: "So is zero point five zero bigger? Let's check on the tray." },
  'A 0 on the end does not change the amount, so 0.5 and 0.50 cover the same space.': { style: 'B', say: 'A zero on the end does not change the amount, so zero point five and zero point five zero cover the same space.' },
  'First, count the shaded part by columns.': { style: 'B' },
  'Each column is one tenth, and 5 are shaded.': { style: 'B' },
  "That's 5 tenths. We write 0.5.": { style: 'B', say: "That's 5 tenths. We write zero point five." },
  'Now count the same part by squares.': { style: 'B' },
  '5 columns of 10 is 50 squares.': { style: 'B' },
  "That's 50 hundredths. We write 0.50.": { style: 'B', say: "That's 50 hundredths. We write zero point five zero." },
  'Did anything move? No.': { style: 'B' },
  'The same squares are shaded, so 0.5 and 0.50 are the same amount.': { style: 'B', say: 'The same squares are shaded, so zero point five and zero point five zero are the same amount.' },
  'Ana and Ben are both right.': { style: 'B' },
  "Don't call 0.50 BIGGER just because 50 is more than 5.": { style: 'B+', say: "Don't call zero point five zero bigger just because 50 is more than 5." },
  'Look at the tray. They cover the same squares.': { style: 'B+' },
  'A tray of brownies. A tray of brownies is cut into 100 small squares. Ana eats the shaded part. Ben says she ate 0.5 of the tray. Ana says 0.50. Who is right?':
    { style: 'A', say: 'A tray of brownies. A tray of brownies is cut into 100 small squares. Ana eats the shaded part. Ben says she ate zero point five of the tray. Ana says zero point five zero. Who is right?' },
  'Now you try. You shade 0.7 of a 100-square grid. How many small squares do you shade? Each tenth is one full column. Count the squares in those columns.':
    { style: 'A', say: 'Now you try. You shade zero point seven of a 100-square grid. How many small squares do you shade? Each tenth is one full column. Count the squares in those columns.' },
  'Try a new one. You shade 0.3 of a 100-square grid. How many small squares do you shade?':
    { style: 'A', say: 'Try a new one. You shade zero point three of a 100-square grid. How many small squares do you shade?' },
  'How many columns is 0.7? Each column is one tenth.': { style: 'A', say: 'How many columns is zero point seven? Each column is one tenth.' },
  'How many full columns is 0.3?': { style: 'A', say: 'How many full columns is zero point three?' },
  'You saw that 0.3 is 30 small squares.': { style: 'A', say: 'You saw that zero point three is 30 small squares.' },
  // ── g4m6-t4 ──
  'The line only shows two numbers, 0 and 1.': { style: 'B' },
  "The dot is between them, so it isn't a whole mile.": { style: 'B' },
  'So what number names that dot?': { style: 'B' },
  'Cut the space from 0 to 1 into 10 equal jumps, and each jump is 0.1.': { style: 'B', say: 'Cut the space from 0 to 1 into 10 equal jumps, and each jump is one tenth.' },
  'Count the jumps from 0 to 1 with me.': { style: 'B' },
  'There are 10, all the same size.': { style: 'B' },
  'So each jump is 0.1 of a mile.': { style: 'B', say: 'So each jump is one tenth of a mile.' },
  'Now start at 0 and hop to the dot.': { style: 'B' },
  '0.1, 0.2, 0.3, 0.4, 0.5, 0.6.': { style: 'B', say: 'One tenth, two tenths, three tenths, four tenths, five tenths, six tenths.' },
  'How many jumps was that? 6.': { style: 'B' },
  '6 jumps of 0.1 make 0.6.': { style: 'B', say: 'Six jumps of one tenth make six tenths.' },
  "So you've walked 0.6 of a mile.": { style: 'B', say: "So you've walked six tenths of a mile." },
  "Don't count the MARKS. The mark at 0 is where you start, not a jump.": { style: 'B+' },
  'Count the jumps, and you land on 0.6.': { style: 'B+', say: 'Count the jumps, and you land on six tenths.' },
  'Each jump is 0.1. Count the jumps from 0 to the dot.': { style: 'A', say: 'Each jump is one tenth. Count the jumps from 0 to the dot.' },
  'You started at 1 and counted jumps of 0.1 to 1.3.': { style: 'A', say: 'You started at 1 and counted jumps of one tenth to one and three tenths.' },
}
