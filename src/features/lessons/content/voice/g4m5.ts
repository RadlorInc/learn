/**
 * How g4m5's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G4M5_VOICE: Record<string, VoiceLine> = {
  // ── g4m5-t1 ──
  "Both paths are straight.": { style: 'B' },
  "Cover the ends, and the middles look the same.": { style: 'B' },
  "How do we tell them apart?": { style: 'B' },
  "Look at the ends: a dot means the path stops there, and an arrow means it goes on forever.": { style: 'B' },
  "The string stops at both ends, so each end gets a dot.": { style: 'B' },
  "Two dots make a line segment.": { style: 'B' },
  "The beam starts at the flashlight, so that end gets a dot.": { style: 'B' },
  "It never stops, so the other end gets an arrow.": { style: 'B' },
  "One dot, one arrow. That's a ray.": { style: 'B' },
  "What if both ends get an arrow?": { style: 'B' },
  "Then it goes on forever both ways. That's a line.": { style: 'B' },
  // "Here's the part people mix up." and "Okay. Your turn." share g5m1's rows
  "Don't name a path by how LONG it looks.": { style: 'B+' },
  "A short path with two arrows is still a line. Look at the ends.": { style: 'B+' },
  // ── g4m5-t2 ──
  "Do long rays make a big angle? No.": { style: 'B' },
  "Two long rays can barely open.": { style: 'B' },
  "What counts is how wide they open.": { style: 'B' },
  "Hold the angle up to a square corner: narrower is acute, the same is right, and wider is obtuse.": { style: 'B' },
  "Start with the corner of a book.": { style: 'B' },
  "That square corner is a right angle, and a little square marks it.": { style: 'B' },
  "Now hold a square corner up to this one.": { style: 'B' },
  "It opens less, so it's narrower. That's acute.": { style: 'B' },
  "This one opens more.": { style: 'B' },
  "Look. A whole square corner fits inside, with some extra.": { style: 'B' },
  "Wider than a square corner is obtuse.": { style: 'B' },
  "Long rays do NOT make an angle obtuse.": { style: 'B+' },
  "Only the opening counts. Hold it up to a square corner.": { style: 'B+' },
  // ── g4m5-t3 ──
  "Narrow isn't exact.": { style: 'B' },
  "These two are both narrow, and they're not the same.": { style: 'B' },
  "So how do we say it? With a number.": { style: 'B' },
  "Put the middle of the protractor on the corner and 0 on one ray, then count up to the other ray.": { style: 'B' },
  "This is a protractor. Its edge is marked in degrees.": { style: 'B' },
  "Put its middle on the corner.": { style: 'B' },
  "Turn it so one ray sits on 0.": { style: 'B' },
  "Each small mark is 10 more.": { style: 'B' },
  "Ten, twenty, thirty, forty.": { style: 'B' },
  "The other ray is right on 40.": { style: 'B' },
  "So how far does the ramp open? 40 degrees.": { style: 'B' },
  "The small circle up high means degrees.": { style: 'B' },
  "Don't count from the FAR end.": { style: 'B+' },
  "It has two rows of numbers. Start at the 0 on your ray. That gives 40, not 140.": { style: 'B+' },
  // ── g4m5-t4 ──
  "You could measure each part.": { style: 'B' },
  "But if you know the whole and one part, do you need to? No. You can work it out.": { style: 'B' },
  "When an angle is split into parts, the parts add up to the whole angle.": { style: 'B' },
  "Here's a 40 degree part, and next to it, a 50 degree part.": { style: 'B' },
  "Together they fill the square corner.": { style: 'B' },
  "So how big is the whole? Add the parts.": { style: 'B' },
  "40 + 50 = 90.": { style: 'B' },
  "That's 90 degrees, a right angle.": { style: 'B' },
  "Now turn it around. The whole is 90 degrees, and one part is 40.": { style: 'B' },
  "Take the part away.": { style: 'B' },
  "90 − 40 = 50. The missing part is 50 degrees.": { style: 'B' },
  "When a part is missing, don't ADD it on.": { style: 'B+' },
  "That makes it bigger than the whole. Take the part away.": { style: 'B+' },
}
