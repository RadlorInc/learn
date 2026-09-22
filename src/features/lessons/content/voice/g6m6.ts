/**
 * How g6m6's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G6M6_VOICE: Record<string, VoiceLine> = {
  // Each topic's "Here's the part people mix up." and "Okay. Your turn." share g5m1's rows.
  // ── g6m6-t1 ──
  "Could you count square tiles?": { style: 'B' },
  "The ends lean, so the tiles there break into bits.": { style: 'B' },
  "Is there a better way? Yes.": { style: 'B' },
  "Cut a triangle off one end, slide it to the other end, and you get a rectangle, so the area is base × height.": { style: 'B' },
  "The base is the bottom edge, 6 cm.": { style: 'B' },
  "The height is how tall it stands, straight up. That's 4 cm.": { style: 'B' },
  "Cut along the dashed line.": { style: 'B' },
  "Slide that triangle to the other end.": { style: 'B' },
  "Nothing is lost or added.": { style: 'B' },
  "Now it's a rectangle, 6 cm by 4 cm.": { style: 'B' },
  "So 6 × 4 = 24 square centimeters.": { style: 'B' },
  "Don't use the SLANTED side, 5 cm. That gives 30, too much.": { style: 'B+' },
  "Use the straight-up height: 6 × 4 = 24.": { style: 'B+' },
  // ── g6m6-t2 ──
  "What about 6 × 4?": { style: 'B' },
  "That's cloth for a whole rectangle, and the flag fills only part of it.": { style: 'B' },
  "So how much of it is flag? Exactly half. Here's why.": { style: 'B' },
  "Two copies of a triangle make a leaning four-sided shape, so one triangle is half of it: 1/2 × base × height.": { style: 'B' },
  "The base is the bottom edge, 6 inches.": { style: 'B' },
  "The height goes straight up to the top point. That's 4 inches.": { style: 'B' },
  "Turn a copy of the flag upside down.": { style: 'B' },
  "Fit it onto the slanted side.": { style: 'B' },
  "Two flags make one leaning shape, 6 inches by 4.": { style: 'B' },
  "That shape is 6 × 4 = 24 square inches.": { style: 'B' },
  "It's two flags, so take half: 24 ÷ 2 = 12 square inches.": { style: 'B' },
  "Don't STOP at 6 × 4 = 24.": { style: 'B+' },
  "That's two flags. Take half: 1/2 × 6 × 4 = 12.": { style: 'B+' },
  // ── g6m6-t3 ── ("Now put the pieces back together." shares g3m4's row)
  "Is this wall a rectangle? No.": { style: 'B' },
  "Is it a triangle? No again.": { style: 'B' },
  "So no one rule fits the whole wall.": { style: 'B' },
  "Cut the shape into pieces you know, find each piece's area, and add them.": { style: 'B' },
  "Cut straight across, right where the roof starts.": { style: 'B' },
  "Now there's a rectangle at the bottom and a triangle on top.": { style: 'B' },
  "The rectangle is 6 × 4 = 24 square meters.": { style: 'B' },
  "The triangle is half of 6 × 3. That's 9 square meters.": { style: 'B' },
  "24 + 9 = 33. So there are 33 square meters to paint.": { style: 'B' },
  "Don't draw ONE big box around the wall. 6 × 7 = 42 counts the empty corners too.": { style: 'B+' },
  "Find each piece, then add: 24 + 9 = 33.": { style: 'B+' },
}
