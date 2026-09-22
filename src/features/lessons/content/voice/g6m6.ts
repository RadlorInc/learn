/**
 * How g6m6's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G6M6_VOICE: Record<string, VoiceLine> = {
  // ── g6m6-t4 ──
  "Length × width × height counts the cubes inside.": { style: 'B' },
  "But paper doesn't go inside. It wraps the outside.": { style: 'B' },
  "So what do we add up? Every flat side.": { style: 'B' },
  "Unfold the box flat, then add up the areas of all 6 of its flat sides.": { style: 'B' },
  "Cut some edges and fold the box open, flat.": { style: 'B' },
  "A bottom, a front, a top, a back, and an end on each side.": { style: 'B' },
  "That's 6 flat sides.": { style: 'B' },
  "The top and the bottom are both 4 × 3 = 12.": { style: 'B' },
  "The front and the back are both 4 × 2 = 8.": { style: 'B' },
  "The two ends are both 3 × 2 = 6.": { style: 'B' },
  "Now add all six. 12 + 12 + 8 + 8 + 6 + 6 = 52.": { style: 'B' },
  "So the paper is 52 square centimeters.": { style: 'B' },
  "Don't add only the 3 sides you SEE.": { style: 'B+' },
  "12 + 8 + 6 is just 26, half the paper.": { style: 'B+' },
  "Each has a partner at the back or underneath. Count each one twice, and you get 52.": { style: 'B+' },
  // ── g6m6-t5 ──
  "Let's try filling it with 1-foot cubes.": { style: 'B' },
  "Along the length, 2 fit, and then half a foot is left.": { style: 'B' },
  "Does a whole cube fit in that gap? No.": { style: 'B' },
  "So counting whole cubes would miss space.": { style: 'B' },
  "Multiply length × width × height, even when the edges are fractions.": { style: 'B' },
  "Mixed numbers are hard to multiply, so first I rewrite them.": { style: 'B' },
  "2 1/2 feet is 5 half feet. We write 5/2.": { style: 'B' },
  "1 1/2 feet is 3 half feet, so 3/2.": { style: 'B' },
  "Same chest, same edges, just easier to multiply.": { style: 'B' },
  "Now multiply, two edges at a time.": { style: 'B' },
  "Length times width first. 5/2 × 2 = 10/2, and that's 5.": { style: 'B' },
  "Then times the height. 5 × 3/2 = 15/2.": { style: 'B' },
  "15/2 means 15 halves. How many wholes is that?": { style: 'B' },
  "2 halves make 1 whole, so 14 halves make 7, and 1 half is left.": { style: 'B' },
  "So the chest holds 7 1/2 cubic feet.": { style: 'B' },
  "Don't DROP the halves.": { style: 'B+' },
  "2 × 2 × 1 is only 4. That leaves out a big chunk of the chest.": { style: 'B+' },
  "Keep them: 5/2 × 2 × 3/2 = 7 1/2.": { style: 'B+' },
  // ── g6m6-t6 ──
  "You could get a protractor and measure the other angle.": { style: 'B' },
  "But do you need one? No.": { style: 'B' },
  "The floor is a straight line, and that line already tells you.": { style: 'B' },
  "Angles that sit side by side on a straight line add up to 180°.": { style: 'B' },
  "Here's why. Face one way, then turn until you face the other way.": { style: 'B' },
  "That's a half turn, and a half turn is 180°.": { style: 'B' },
  "A straight line opens exactly that much.": { style: 'B' },
  "Now the board splits the line into two angles, 55° and the one we want.": { style: 'B' },
  "They fill the whole line, with no gap and no overlap.": { style: 'B' },
  "So together, the two make 180°.": { style: 'B' },
  "One part is 55°, so the other is what's left of 180.": { style: 'B' },
  "Take it away. 180 − 55 = 125.": { style: 'B' },
  "The angle on the other side of the board is 125°.": { style: 'B' },
  "Don't take it away from 90. That gives 35.": { style: 'B+' },
  "A straight line is NOT a square corner. It's two of them, 180°.": { style: 'B+' },
  // Screen 7's "Here's the part people mix up." and "Okay. Your turn." are g5m1's rows.
}
