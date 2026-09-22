/**
 * How g3m3's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G3M3_VOICE: Record<string, VoiceLine> = {
  // Screen 7's "Here's the part people mix up." and "Okay. Your turn." have their rows in g5m1.ts.
  // ── g3m3-t6 ──
  "You could count by 3s, one box at a time.": { style: 'B' },
  "That works, but 9 boxes is a lot to keep track of.": { style: 'B' },
  "Is there a faster way? Yes. Use 10 boxes instead.": { style: 'B' },
  "To find 9 groups, find 10 groups, then take away one group.": { style: 'B' },
  "Look. Add one pretend box, so there are 10 boxes.": { style: 'B' },
  "10 boxes of 3 make 30.": { style: 'B' },
  "But we only have 9 boxes.": { style: 'B' },
  "So the pretend box has to go, and its 3 crayons go with it.": { style: 'B' },
  "So start at 30, and take away 3.": { style: 'B' },
  "That leaves 27.": { style: 'B' },
  "So 9 boxes of 3 make 27 crayons.": { style: 'B' },
  "Don't take away just 1. That gives 29.": { style: 'B+' },
  "The pretend box held 3 crayons, so take away the whole BOX. 30 − 3 = 27.": { style: 'B+' },
  // ── g3m3-t7 ──
  "7 rows of 8 is a big fact to just know.": { style: 'B' },
  "Counting by 8s, row by row, is slow, and it's easy to slip.": { style: 'B' },
  "Can we make it smaller? Yes. Cut the rows apart.": { style: 'B' },
  "Break a big fact into two smaller facts you know, solve each one, then add them.": { style: 'B' },
  "Look. Cut the 7 rows into 5 rows and 2 rows.": { style: 'B' },
  "5 rows of 8 is a fact you know. So is 2 rows of 8.": { style: 'B' },
  "5 rows of 8 make 40.": { style: 'B' },
  "2 rows of 8 make 16.": { style: 'B' },
  "Now put the parts back together.": { style: 'B' },
  "40 and 16 make 56.": { style: 'B' },
  "So 7 rows of 8 make 56 carrots.": { style: 'B' },
  "The 2 rows are NOT just 2 carrots.": { style: 'B+' },
  "40 and 2 make 42, and that's too few. Each of those 2 rows holds 8 carrots, so add 16.": { style: 'B+' },
  // ── g3m3-t8 ──
  "Each cup holds 4 bundles of 10. That's 40 straws in one cup.": { style: 'B' },
  "Jumping by 40s in your head is hard.": { style: 'B' },
  "Is there a faster way? Yes. Count the bundles, not the straws.": { style: 'B' },
  "To multiply by tens, count how many tens, then turn the tens into a number.": { style: 'B' },
  "Look. Each cup has 4 bundles.": { style: 'B' },
  "Count one cup at a time. 4, 8, 12.": { style: 'B' },
  "So there are 12 bundles.": { style: 'B' },
  "3 × 4 = 12. That's a fact you know.": { style: 'B' },
  "And every bundle is a ten, so that's 12 tens.": { style: 'B' },
  "Now, how much is 12 tens?": { style: 'B' },
  "10 tens make 100. 2 more tens make 20.": { style: 'B' },
  "100 and 20 make 120. So there are 120 straws.": { style: 'B' },
  "Don't STOP at 12. Those are 12 bundles, not 12 straws.": { style: 'B+' },
  "Each bundle is 10 straws, so 12 tens is 120.": { style: 'B+' },
  // ── g3m3-t9 ──
  "Can we take 5 away right now? Not yet.": { style: 'B' },
  "First we need to know how many pencils Sam has.": { style: 'B' },
  "The story doesn't tell us. It hides that question.": { style: 'B' },
  "A two-step story hides a first question, so answer it first, then use that to answer the real one.": { style: 'B' },
  "Step 1. How many pencils did Sam buy?": { style: 'B' },
  "3 packs with 4 in each. 3 × 4 = 12.": { style: 'B' },
  "So Sam has 12 pencils.": { style: 'B' },
  "Step 2. Now the real question.": { style: 'B' },
  "He gives 5 away, so take 5 from 12.": { style: 'B' },
  "12 take away 5 leaves 7.": { style: 'B' },
  "So Sam has 7 pencils left.": { style: 'B' },
  "Don't ADD 3 and 4, then take away 5. That leaves just 2.": { style: 'B+' },
  "3 packs of 4 is 12, so take 5 from 12.": { style: 'B+' },
}
