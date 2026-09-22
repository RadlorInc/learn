/**
 * How g3m6's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G3M6_VOICE: Record<string, VoiceLine> = {
  // Screen 7's "Here's the part people mix up." and "Okay. Your turn." have their rows in g5m1.ts.
  // ── g3m6-t5 ──
  "Every tile has 4 sides.": { style: 'B' },
  "But they don't look the same at all.": { style: 'B' },
  "So is 4 sides enough to tell them apart? No. We have to look closer.": { style: 'B' },
  "Check two things: are all 4 sides the same length, and are all 4 corners square corners?": { style: 'B' },
  "Start with the corners.": { style: 'B' },
  "A square corner is like the corner of a book. We mark it with a small square.": { style: 'B' },
  "The first two tiles have that mark in all 4 corners.": { style: 'B' },
  "Now the sides.": { style: 'B' },
  "A tick on a side means it matches the other sides with a tick.": { style: 'B' },
  "Which tiles have 4 ticks? The first one, and the leaning one.": { style: 'B' },
  "So what is each tile?": { style: 'B' },
  "A square has both, 4 equal sides and 4 square corners.": { style: 'B' },
  "The rectangle has the square corners, but not the equal sides.": { style: 'B' },
  "The leaning tile has the equal sides, but not the square corners.": { style: 'B' },
  "Don't say a square is NOT a rectangle.": { style: 'B+' },
  "It has 4 square corners, so it is a rectangle too.": { style: 'B+' },
  // ── g3m6-t6 ──
  "Where does the fence go? Not across the middle.": { style: 'B' },
  "It goes all the way around the edge.": { style: 'B' },
  "So we need to know how long the whole edge is.": { style: 'B' },
  "The distance around a shape is all of its sides added together.": { style: 'B' },
  "Let's walk it. Start at this corner.": { style: 'B' },
  "5 feet across the top, then 3 feet down.": { style: 'B' },
  "5 feet back, then 3 feet up.": { style: 'B' },
  "We're back where we started.": { style: 'B' },
  "Now add every side you walked.": { style: 'B' },
  "How many is that, 2 or 4? It's 4.": { style: 'B' },
  "5 + 3 + 5 + 3 = 16.": { style: 'B' },
  "So Sam needs 16 feet of fence.": { style: 'B' },
  "Sometimes a side has no number. What is it?": { style: 'B' },
  "In a rectangle, the sides across from each other are the same length.": { style: 'B' },
  "The top is 5 feet, so the bottom is 5 feet too.": { style: 'B' },
  "Don't add just TWO sides.": { style: 'B+' },
  "5 + 3 = 8 only takes you halfway around. Add all 4, and you get 16.": { style: 'B+' },
  // ── g3m6-t7 ──
  "Same fence, so the same room inside? It sounds right.": { style: 'B' },
  "But let's not guess. Let's count and check.": { style: 'B' },
  "Two gardens can have the same fence around them but hold a different number of squares inside.": { style: 'B' },
  "First, are the fences really the same?": { style: 'B' },
  "Walk the long thin garden. 5 + 1 + 5 + 1 = 12.": { style: 'B' },
  "Now the wider one. 4 + 2 + 4 + 2 = 12.": { style: 'B' },
  "Yes. Both fences are 12 feet.": { style: 'B' },
  "Now count the squares inside.": { style: 'B' },
  "The long thin garden is one row of 5. That's 5 squares.": { style: 'B' },
  "The wider garden is 2 rows of 4. That's 8 squares.": { style: 'B' },
  "Same fence, but not the same room inside.": { style: 'B' },
  "One more. A garden 3 feet by 3 feet uses 12 feet of fence too.": { style: 'B' },
  "Inside, it's 3 rows of 3. That's 9 squares.": { style: 'B' },
  "That's the most room of all three.": { style: 'B' },
  "The same fence does NOT mean the same room inside.": { style: 'B+' },
  "12 feet of fence held 5, 8 and 9 squares. So count the squares to check.": { style: 'B+' },
}
