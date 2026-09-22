/**
 * How g6m3's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 * Decimals: t1–t3 are about where the point goes — lining points up, counting places after it, putting it above — so a
 * decimal is read digit by digit ("8.52" → "eight point five two"). "Here's the part people mix up." and
 * "Okay. Your turn." share g5m1's rows.
 */
import type { VoiceLine } from './styles'

export const G6M3_VOICE: Record<string, VoiceLine> = {
  // ── g6m3-t1 ──
  "Can you just line up the last digits? No.": { style: 'B' },
  "The 5 tenths would sit on top of the 5 thousandths.": { style: 'B' },
  "Those are different places.": { style: 'B' },
  "Line up the points, fill each empty place with a 0, then add or take away like whole numbers.": { style: 'B', say: "Line up the points, fill each empty place with a zero, then add or take away like whole numbers." },
  "Give 12.5 three places, like 3.875. Write it 12.500.": { style: 'B', say: "Give twelve point five three places, like three point eight seven five. Write it twelve point five zero zero." },
  "The zeros don't change how much it is.": { style: 'B' },
  "Start at the right. 0 − 5 won't go.": { style: 'B', say: "Start at the right. Zero minus 5 won't go." },
  "So trade 1 tenth. It makes 9 hundredths and 10 thousandths.": { style: 'B' },
  "10 − 5 = 5. 9 − 7 = 2.": { style: 'B' },
  "Tenths. 4 − 8 won't go, so trade 1 one. 14 − 8 = 6.": { style: 'B' },
  "Ones. 1 − 3 won't go, so trade the ten. 11 − 3 = 8.": { style: 'B' },
  "The point comes straight down. So 8.625 kilometers are left.": { style: 'B', say: "The point comes straight down. So eight point six two five kilometers are left." },
  "Don't bring the 7 and 5 DOWN with nothing above them.": { style: 'B+', say: "Don't bring the 7 and 5 down with nothing above them." },
  "That gives 8.775. Fill in zeros and trade. It's 8.625.": { style: 'B+', say: "That gives eight point seven seven five. Fill in zeros and trade. It's eight point six two five." },
  "A long bike ride. A bike trail is 12.5 kilometers long. You have ridden 3.875 kilometers. How far is left?": { style: 'A', say: "A long bike ride. A bike trail is twelve point five kilometers long. You have ridden three point eight seven five kilometers. How far is left?" },
  "Now you try. Take away. 15.4 − 6.237 = ? Line up the points. Fill the empty places with 0s. Take away from the right.": { style: 'A', say: "Now you try. Take away. Fifteen point four minus six point two three seven equals what? Line up the points. Fill the empty places with zeros. Take away from the right." },
  "Try a new one. Take away. 20.3 − 7.456 = ?": { style: 'A', say: "Try a new one. Take away. Twenty point three minus seven point four five six equals what?" },
  "How many places after the point does 15.4 need so it matches 6.237?": { style: 'A', say: "How many places after the point does fifteen point four need so it matches six point two three seven?" },
  "Write 15.400. The thousandths are 0 − 7, so trade from the places to the left.": { style: 'A', say: "Write fifteen point four zero zero. The thousandths are zero minus 7, so trade from the places to the left." },
  "Write 20.3 with three places after the point first.": { style: 'A', say: "Write twenty point three with three places after the point first." },
  "You filled in zeros and found 20.3 − 7.456 = 12.844.": { style: 'A', say: "You filled in zeros and found twenty point three minus seven point four five six equals twelve point eight four four." },
  // ── g6m3-t2 ── ("So where does the point go in the answer?" is also t3's line: one row)
  "When you add, you line up the points.": { style: 'B' },
  "But when you multiply, lining them up doesn't help.": { style: 'B' },
  "So where does the point go in the answer?": { style: 'B' },
  "Multiply as if there were no points, then give the answer as many places after the point as both numbers have together.": { style: 'B' },
  "Cover the points. That leaves 24 × 13.": { style: 'B' },
  "24 × 3 = 72, and 24 × 10 = 240.": { style: 'B' },
  "Add the rows. 72 + 240 = 312.": { style: 'B' },
  "Now the point. 2.4 has 1 place after the point.": { style: 'B', say: "Now the point. Two point four has 1 place after the point." },
  "1.3 has 1 place too.": { style: 'B', say: "One point three has 1 place too." },
  "1 + 1 = 2, so the answer needs 2 places.": { style: 'B' },
  "Start at the right of 312 and count 2 places left. That's 3.12.": { style: 'B', say: "Start at the right of 312 and count 2 places left. That's three point one two." },
  "Is that about right? 2 × 1 = 2 and 3 × 2 = 6, and 3.12 is in between. Yes.": { style: 'B', say: "Is that about right? 2 times 1 equals 2 and 3 times 2 equals 6, and three point one two is in between. Yes." },
  "So the bed is 3.12 square meters.": { style: 'B', say: "So the bed is three point one two square meters." },
  "Don't COPY the point from the numbers above. That gives 31.2.": { style: 'B+', say: "Don't copy the point from the numbers above. That gives thirty-one point two." },
  "Count the places. 1 + 1 = 2, so it's 3.12.": { style: 'B+', say: "Count the places. 1 plus 1 equals 2, so it's three point one two." },
  "A garden bed. A garden bed is 2.4 meters long and 1.3 meters wide. What is its area?": { style: 'A', say: "A garden bed. A garden bed is two point four meters long and one point three meters wide. What is its area?" },
  "Now you try. Multiply. 3.2 × 1.4 = ? Multiply without the points. Count the places. Put the point back.": { style: 'A', say: "Now you try. Multiply. Three point two times one point four equals what? Multiply without the points. Count the places. Put the point back." },
  "Try a new one. Multiply. 4.3 × 2.1 = ?": { style: 'A', say: "Try a new one. Multiply. Four point three times two point one equals what?" },
  "Count the places after the point in 3.2 and in 1.4. Add them up.": { style: 'A', say: "Count the places after the point in three point two and in one point four. Add them up." },
  "How many places after the point are in 4.3 and 2.1 together?": { style: 'A', say: "How many places after the point are in four point three and two point one together?" },
  "You counted the places and found 4.3 × 2.1 = 9.03.": { style: 'A', say: "You counted the places and found four point three times two point one equals nine point zero three." },
  // ── g6m3-t3 ──
  "You know how to divide whole numbers this way.": { style: 'B' },
  "But 8.52 has a point inside it.": { style: 'B', say: "But eight point five two has a point inside it." },
  "Put the point in the answer straight above the point inside, then divide like whole numbers.": { style: 'B' },
  "Before you divide anything, write the point on top.": { style: 'B' },
  "Put it straight above the point in 8.52.": { style: 'B', say: "Put it straight above the point in eight point five two." },
  "Do it first, and it can't get lost.": { style: 'B' },
  "Start on the left. How many 4s fit into 8? 2.": { style: 'B', say: "Start on the left. How many fours fit into 8? 2." },
  "Write the 2 on top. 2 × 4 = 8, and 8 − 8 = 0.": { style: 'B' },
  "Bring down the 5.": { style: 'B' },
  "4 fits into 5 one time. 5 − 4 = 1.": { style: 'B' },
  "Bring down the 2 to make 12. 4 fits into 12 three times, with nothing left.": { style: 'B' },
  "So each piece is 2.13 meters long.": { style: 'B', say: "So each piece is two point one three meters long." },
  "Don't DROP the point and write 213.": { style: 'B+', say: "Don't drop the point and write 213." },
  "That's longer than the whole rope. The point sits straight above, so it's 2.13.": { style: 'B+', say: "That's longer than the whole rope. The point sits straight above, so it's two point one three." },
  "Cut the rope. A rope is 8.52 meters long. You cut it into 4 equal pieces. How long is each piece?": { style: 'A', say: "Cut the rope. A rope is eight point five two meters long. You cut it into 4 equal pieces. How long is each piece?" },
  "Now you try. Divide. 9.45 ÷ 3 = ? Put the point on top first. Then divide like whole numbers.": { style: 'A', say: "Now you try. Divide. Nine point four five divided by 3 equals what? Put the point on top first. Then divide like whole numbers." },
  "Try a new one. Divide. 6.72 ÷ 4 = ?": { style: 'A', say: "Try a new one. Divide. Six point seven two divided by 4 equals what?" },
  "You put the point on top and found 6.72 ÷ 4 = 1.68.": { style: 'A', say: "You put the point on top and found six point seven two divided by 4 equals one point six eight." },
}
