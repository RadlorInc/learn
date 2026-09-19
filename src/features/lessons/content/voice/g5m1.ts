/**
 * How Grade 5 · Module 1's re-voiced lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson
 * says it — that is what the clip is looked up by. `say` is what the voice model reads: the same words, plus a tag,
 * pauses and symbols spelt out. A line with no row here renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G5M1_VOICE: Record<string, VoiceLine> = {
  // ── g5m1-t1 ──
  'Hmm. You could add 40, ten times over.': { style: 'A', say: 'Hmm... you could add 40, ten times over.' },
  "That works! But it takes a while, and it's so easy to lose count.": { style: 'A', say: "That works! But it takes a while... and it's so easy to lose count." },
  "Here's the good news. There's a much faster way, and it lives right here, in a chart of places.":
    { style: 'A+', say: "[happy] Here's the good news! There's a much faster way... and it lives right here, in a chart of places." },
  "Slide a digit one place to the left, and it's worth 10 times as much.": { style: 'A+', say: "[happy] Slide a digit one place to the left... and it's worth 10 times as much!" },
  "Slide it one place to the right, and it's worth 1/10 as much.": { style: 'A', say: "Slide it one place to the right... and it's worth one tenth as much." },
  '10 ones make 1 ten. 10 tens make 1 hundred. And 10 hundreds make 1 thousand!': { style: 'B' },
  "Now watch. Slide it one place to the left, and it lands in the hundreds. Now it's 4 hundreds: 400!":
    { style: 'B+', say: "Now watch. Slide it one place to the left — and it lands in the hundreds. Now it's 4 hundreds — 400!" },
  'That slide is what 10 times as much looks like. So a carton holds 400 pencils!': { style: 'A+', say: '[happy] That slide is what 10 times as much looks like. So a carton holds 400 pencils!' },
  "Now let's go back the other way. One box is 1/10 of a carton.": { style: 'A', say: "Now let's go back the other way. One box is one tenth of a carton." },
  "So slide the 4 in 400 one place to the right, back into the tens place. And it's 40 again!":
    { style: 'A', say: "So slide the 4 in 400 one place to the right... back into the tens place. And it's 40 again!" },
  'There it is! 1/10 of 400 is 40 pencils.': { style: 'A+', say: '[happy] There it is! One tenth of 400 is 40 pencils.' },
  "Now, here's a trap I want you to watch out for.": { style: 'B' },
  'Ten times as much does not mean add 10!': { style: 'B+', say: 'Ten times as much does not mean — add 10!' },
  "Slide a digit one place to the left, and it's worth 10 times as much. Slide it one place to the right, and it's worth 1/10 as much.":
    { style: 'A', say: "Slide a digit one place to the left, and it's worth 10 times as much. Slide it one place to the right, and it's worth one tenth as much." },
  "You did it! You slid the 7 one place to the left, and now it's worth 10 times as much.":
    { style: 'A+', say: "[happy] You did it! You slid the 7 one place to the left, and now it's worth 10 times as much." },
  'Yes! You slid the 3 one place to the left, from 300 all the way to 3,000.': { style: 'A+', say: '[happy] Yes! You slid the 3 one place to the left, from 300 all the way to 3,000.' },

  // ── g5m1-t2 ──
  'Add 37 one thousand times? That would take all day!': { style: 'B+', say: '[sigh] Add 37 one thousand times? That would take — all day!' },
  "But there's a much faster way. And the best part? It works for dividing too!": { style: 'A+', say: "[happy] But there's a much faster way. And the best part? It works for dividing too!" },
  "That's how many places every digit slides: left to multiply, right to divide.": { style: 'B+', say: "That's how many places every digit slides — left to multiply, right to divide." },
  'Now the ones place is empty, so a 0 fills that spot. And we get 370!': { style: 'A+', say: '[happy] Now the ones place is empty... so a zero fills that spot. And we get 370!' },
  'Now add a zero. 100 has two zeros, so the digits slide two places: 3,700.': { style: 'A', say: 'Now add a zero. 100 has two zeros, so the digits slide two places... 3,700.' },
  'And 1,000 has three zeros, so they slide three places: 37,000.': { style: 'A', say: 'And 1,000 has three zeros, so they slide three places... 37,000.' },
  "And there's our answer. The shop has 37,000 beads!": { style: 'A+', say: "[happy] And there's our answer! The shop has 37,000 beads!" },
  '1,000 still has three zeros, so every digit slides three places. But this time, to the right.':
    { style: 'B+', say: '1,000 still has three zeros, so every digit slides three places — but this time, to the right.' },
  'Now, one more thing to watch out for.': { style: 'B' },
  "When you divide, don't slide to the left!": { style: 'A', say: "When you divide... don't slide to the left!" },
  'You did it! You counted three zeros and slid every digit three places to the left.': { style: 'A+', say: '[happy] You did it! You counted three zeros and slid every digit three places to the left.' },
  'Yes! You counted two zeros and slid 29 two places to the left, all the way to 2,900.': { style: 'A+', say: '[happy] Yes! You counted two zeros and slid 29 two places to the left, all the way to 2,900.' },
}
