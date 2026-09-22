/**
 * How g4m2's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G4M2_VOICE: Record<string, VoiceLine> = {
  // ── g4m2-t5 ── ("Here's the part people mix up." and "Okay. Your turn." share g5m1's rows)
  "You could count by 10s, 34 times over.": { style: 'B' },
  "That's a lot of counting.": { style: 'B' },
  "Is there a faster way? Yes. Watch the digits.": { style: 'B' },
  "Each zero in 10, 100 or 1,000 slides every digit one place to the left.": { style: 'B' },
  "Start with 10. One zero, so every digit slides one place left.": { style: 'B' },
  "The 3 tens become 3 hundreds. The 4 ones become 4 tens.": { style: 'B' },
  "The ones place is empty, so a 0 fills it. That's 340 pencils.": { style: 'B', say: "The ones place is empty, so a zero fills it. That's 340 pencils." },
  "Now 100. Two zeros, so every digit slides two places.": { style: 'B' },
  "The 3 lands in the thousands, the 4 in the hundreds, and two 0s fill the rest. That's 3,400.": { style: 'B', say: "The 3 lands in the thousands, the 4 in the hundreds, and two zeros fill the rest. That's 3,400." },
  "And 1,000? Three zeros, so three places.": { style: 'B' },
  "That's 34,000. See the pattern? One more zero, one more place.": { style: 'B' },
  "34 × 100 is not 340. Don't slide just ONE place.": { style: 'B+' },
  "Two zeros means two places. That's 3,400.": { style: 'B+' },
  // ── g4m2-t6 ── ("Here's the part people mix up." and "Okay. Your turn." share g5m1's rows)
  "You know 4 × 3 = 12.": { style: 'B' },
  "But each pack has 30 cards, not 3.": { style: 'B' },
  "So is the answer 12? No, it has to be much bigger.": { style: 'B' },
  "Think of 30 as 3 tens, multiply 4 × 3 tens, then turn the tens into a number.": { style: 'B' },
  "Look at one pack. 30 cards is 3 tens.": { style: 'B' },
  "4 packs is 4 groups of 3 tens.": { style: 'B' },
  "Now multiply the tens. 4 × 3 = 12, so that's 12 tens.": { style: 'B' },
  "It's the fact you already know. We're just counting tens, not ones.": { style: 'B' },
  "How much is 12 tens? 10 tens make 1 hundred.": { style: 'B' },
  "The 2 tens left make 20. 100 and 20 make 120. So there are 120 cards.": { style: 'B' },
  "Don't DROP the tens. 4 × 30 is not 12.": { style: 'B+' },
  "12 tens is 120, so 4 × 30 = 120.": { style: 'B+' },
  // ── g4m2-t7 ── ("Here's the part people mix up." and "Okay. Your turn." share g5m1's rows)
  "You could hand them out one sticker at a time. That would take a long while.": { style: 'B' },
  "Is there a faster way? Yes. The stickers already come in tens.": { style: 'B' },
  "Share the tens, then turn the tens back into a number.": { style: 'B' },
  "Look. 80 stickers is 8 sheets of 10.": { style: 'B' },
  "That's 8 tens. So we share sheets, not single stickers.": { style: 'B' },
  "Give each of the 4 friends one sheet. Then go around again.": { style: 'B' },
  "8 sheets shared by 4 is 2 sheets each. So 8 tens ÷ 4 = 2 tens.": { style: 'B' },
  "Now turn the tens back into a number. 2 tens is 20.": { style: 'B' },
  "So 80 ÷ 4 = 20. Each friend gets 20 stickers.": { style: 'B' },
  "Don't DROP the tens at the end. 80 ÷ 4 is not 2.": { style: 'B+' },
  "Each friend gets 2 tens, and 2 tens is 20.": { style: 'B+' },
  // ── g4m2-t8 ── ("Here's the part people mix up." and "Okay. Your turn." share g5m1's rows)
  "Let's count by 4s. 4, 8, 12, 16.": { style: 'B' },
  "Did you catch that? 16 is past 14.": { style: 'B' },
  "So the pages won't come out even. What do we do?": { style: 'B' },
  "Make as many full groups as you can, and what is left is too few for another group.": { style: 'B' },
  "Look. Put 4 stickers on the first page. That page is full.": { style: 'B' },
  "Keep going. 4, then 8, then 12. That's 3 full pages.": { style: 'B' },
  "3 pages used 12 stickers, so 2 are still in your hand.": { style: 'B' },
  "Can 2 fill another page? No, a page needs 4. So they're left over.": { style: 'B' },
  "So 14 ÷ 4 gives 3 full pages, with 2 left over.": { style: 'B' },
  "You can fill 3 pages all the way.": { style: 'B' },
  "Don't STOP with 6 left. 6 can fill another page.": { style: 'B+' },
  "That's 3 pages, with 2 left.": { style: 'B+' },
}
