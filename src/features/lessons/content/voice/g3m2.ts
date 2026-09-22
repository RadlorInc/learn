/**
 * How g3m2's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G3M2_VOICE: Record<string, VoiceLine> = {
  // Screen 7's "Here's the part people mix up." and "Okay. Your turn." have their rows in g5m1.ts.
  // ── g3m2-t6 ──
  "37 starts with a 3. So is it 30?": { style: 'B' },
  "Not so fast. The 3 does not tell you which ten is closer.": { style: 'B' },
  "How can we tell? Use a number line.": { style: 'B' },
  "A number rounds to the closer ten, and right in the middle, it rounds up.": { style: 'B' },
  "Look. 37 is more than 30, and less than 40.": { style: 'B' },
  "So it sits between 30 and 40.": { style: 'B' },
  "Count the hops. From 37 up to 40 is 3 hops.": { style: 'B' },
  "From 37 back to 30 is 7 hops.": { style: 'B' },
  "3 hops is fewer. So the jar has about 40 marbles.": { style: 'B' },
  "What about 35?": { style: 'B' },
  "It is 5 hops from 30, and 5 hops from 40.": { style: 'B' },
  "Right in the middle, it goes up. So 35 rounds to 40.": { style: 'B' },
  "Don't just KEEP the 3 and write 30.": { style: 'B+' },
  "Count the hops. 37 is closer to 40.": { style: 'B+' },
  // ── g3m2-t7 ──
  "200 to 300 is a long way. Hopping by 1s takes all day.": { style: 'B' },
  "Is there a faster way? Yes. Hop by 10s instead.": { style: 'B' },
  "A number rounds to the closer hundred, and right in the middle, it rounds up.": { style: 'B' },
  "Look. 270 is more than 200, and less than 300.": { style: 'B' },
  "So it sits between 200 and 300.": { style: 'B' },
  "Count hops of 10. From 270 up to 300 is 3 hops.": { style: 'B' },
  "From 270 back to 200 is 7 hops.": { style: 'B' },
  "3 hops is fewer. So about 300 people came.": { style: 'B' },
  "What about 250?": { style: 'B' },
  "It is 5 hops from 200, and 5 hops from 300.": { style: 'B' },
  "Right in the middle, it goes up. So 250 rounds to 300.": { style: 'B' },
  "329 ends in 9. Don't let that LAST digit push it to 400.": { style: 'B+' },
  "Count the hops. 329 is just past 300, so it rounds to 300.": { style: 'B+' },
  // ── g3m2-t8 ──
  "Start with the ones. 6 and 8 make 14 ones.": { style: 'B' },
  "Can 14 fit in the ones place? No. A place holds one digit, 0 to 9.": { style: 'B' },
  "Add the ones first, and if there are 10 or more, trade 10 ones for 1 ten.": { style: 'B' },
  "Look. Stack 146 on 128, ones under ones.": { style: 'B' },
  "6 + 8 = 14. That's 1 ten and 4 ones.": { style: 'B' },
  "Write the 4. The 1 ten goes up, on top of the tens.": { style: 'B' },
  "Now the tens. The 1 we traded, plus 4, plus 2.": { style: 'B' },
  "1 + 4 + 2 = 7 tens.": { style: 'B' },
  "Last, the hundreds. 1 + 1 = 2.": { style: 'B' },
  "So 146 + 128 = 274. That's 274 books.": { style: 'B' },
  "Don't FORGET the ten you traded.": { style: 'B+' },
  "Without it, the tens make 6, and you get 264. Add the little 1, and it's 274.": { style: 'B+' },
  // ── g3m2-t9 ──
  "Start with the ones. We need to take away 7.": { style: 'B' },
  "But there are only 2 ones. Can you take 7 from 2? No.": { style: 'B' },
  "Take away the ones first, and if there are not enough, break 1 ten into 10 ones.": { style: 'B' },
  "Look. Stack 352 on 127, ones under ones.": { style: 'B' },
  "Take 1 ten from the 5 tens. Now there are 4 tens.": { style: 'B' },
  "Break it into 10 ones. 10 and 2 make 12 ones.": { style: 'B' },
  "Now 12 − 7 = 5. Write 5 in the ones place.": { style: 'B' },
  "Tens next. 4 − 2 = 2.": { style: 'B' },
  "Last, the hundreds. 3 − 1 = 2.": { style: 'B' },
  "So 352 − 127 = 225. Nia has 225 stickers left.": { style: 'B' },
  "Don't FLIP it to 7 − 2. The 7 is what you take away.": { style: 'B+' },
  "Break a ten instead. Then it's 12 − 7, and you get 225.": { style: 'B+' },
}
