/**
 * How g8m5's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G8M5_VOICE: Record<string, VoiceLine> = {
  // ("Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  // ── g8m5-t1 ──
  "In a box, you could stack little cubes and just count them.": { style: 'B' },
  "A can is round, though.": { style: 'B' },
  "Push cubes against the curved side, and you get gaps.": { style: 'B' },
  "So how do you measure a space that is round?": { style: 'B' },
  "A cylinder is a stack of circles, so find the area of one circle and multiply by the height.": { style: 'B' },
  "Start with the circle on the bottom.": { style: 'B' },
  "From the center to the edge is 2 inches, so the radius is 2.": { style: 'B' },
  "The area of a circle is 3.14 times the radius times the radius.": { style: 'B', say: "The area of a circle is three point one four times the radius times the radius." },
  "3.14 × 2 × 2 = 12.56 square inches, one flat layer.": { style: 'B', say: "Three point one four times 2 times 2 is twelve point five six square inches, one flat layer." },
  "Now stack that circle up the can.": { style: 'B' },
  "Each inch of height adds a layer of 12.56.": { style: 'B', say: "Each inch of height adds a layer of twelve point five six." },
  "How many layers fit? The can is 5 inches tall, so 5 layers.": { style: 'B' },
  "One layer is 12.56. We want 5.": { style: 'B', say: "One layer is twelve point five six. We want 5." },
  "12.56 × 5 = 62.8.": { style: 'B', say: "Twelve point five six times 5 is sixty-two point eight." },
  "In one go, that is 3.14 × 2 × 2 × 5, the circle, then the height.": { style: 'B', say: "In one go, that is three point one four times 2 times 2 times 5, the circle, then the height." },
  "So your can holds 62.8 cubic inches of soup.": { style: 'B', say: "So your can holds sixty-two point eight cubic inches of soup." },
  "Don't use the distance ALL the way across.": { style: 'B+' },
  "This can is 4 inches across, but the rule wants the radius, half of that, 2 inches.": { style: 'B+' },
  // ── g8m5-t2 ──
  "Look down this cup from the top.": { style: 'B' },
  "Its circles get smaller and smaller, until they shrink to a point.": { style: 'B' },
  "So can you stack one circle, like in a can? No.": { style: 'B' },
  "Every layer is a different size.": { style: 'B' },
  "A cone holds 1/3 of the cylinder with the same bottom and height, so find the cylinder and divide by 3.": { style: 'B' },
  "Try this for real.": { style: 'B' },
  "Fill the cone with water, and pour it into a cylinder with the same bottom and height.": { style: 'B' },
  "How full is the cylinder after one pour? Only a third.": { style: 'B' },
  "It takes 3 whole cones to fill it.": { style: 'B' },
  "So forget the cone for a moment.": { style: 'B' },
  "Build the cylinder with the same bottom and height.": { style: 'B' },
  "The circle is 3.14 × 3 × 3, and the height is 4.": { style: 'B', say: "The circle is three point one four times 3 times 3, and the height is 4." },
  "3.14 × 3 × 3 × 4 = 113.04 cubic centimeters.": { style: 'B', say: "Three point one four times 3 times 3 times 4 is one hundred thirteen point zero four cubic centimeters." },
  "Now bring the cone back.": { style: 'B' },
  "It holds one third of what that cylinder holds.": { style: 'B' },
  "So we divide by 3. 113.04 ÷ 3 = 37.68.": { style: 'B', say: "So we divide by 3. One hundred thirteen point zero four divided by 3 is thirty-seven point six eight." },
  "Your paper cup holds 37.68 cubic centimeters of water.": { style: 'B', say: "Your paper cup holds thirty-seven point six eight cubic centimeters of water." },
  "Don't STOP once you have the cylinder.": { style: 'B+' },
  "A cone holds only one third of it, so divide by 3 at the end.": { style: 'B+' },
  // ── g8m5-t1, t2 outside the teach (Screen 1, Screen 8, hints, won lines): inches and 3.14 said in words ──
  "A can of soup. A soup can is 2 in from its center to its edge and 5 in tall. How much soup fits inside?": { style: 'A', say: "A can of soup. A soup can is 2 inches from its center to its edge and 5 inches tall. How much soup fits inside?" },
  "Now you try. A can has a radius of 2 in and a height of 7 in. What is its volume in cubic inches? Use π ≈ 3.14. Find the area of the circle. Then multiply by the height.": { style: 'A', say: "Now you try. A can has a radius of 2 inches and a height of 7 inches. What is its volume in cubic inches? Use pi as three point one four. Find the area of the circle. Then multiply by the height." },
  "Try a new one. A glass is 6 cm across and 10 cm tall. What is its volume in cubic centimeters? Use π ≈ 3.14.": { style: 'A', say: "Try a new one. A glass is 6 centimeters across and 10 centimeters tall. What is its volume in cubic centimeters? Use pi as three point one four." },
  "Find 3.14 × 2 × 2. Then multiply by the height, 7.": { style: 'A', say: "Find three point one four times 2 times 2. Then multiply by the height, 7." },
  "Now you try. A cone has a radius of 3 cm and a height of 5 cm. What is its volume in cubic centimeters? Use π ≈ 3.14. Find the cylinder with the same bottom and height. Then divide by 3.": { style: 'A', say: "Now you try. A cone has a radius of 3 centimeters and a height of 5 centimeters. What is its volume in cubic centimeters? Use pi as three point one four. Find the cylinder with the same bottom and height. Then divide by 3." },
  "Try a new one. A cone has a radius of 6 in and a height of 2 in. What is its volume in cubic inches? Use π ≈ 3.14.": { style: 'A', say: "Try a new one. A cone has a radius of 6 inches and a height of 2 inches. What is its volume in cubic inches? Use pi as three point one four." },
  "Find 3.14 × 3 × 3 × 5. Then divide by 3.": { style: 'A', say: "Find three point one four times 3 times 3 times 5. Then divide by 3." },
  "Find 3.14 × 6 × 6 × 2. Then take one third of it.": { style: 'A', say: "Find three point one four times 6 times 6 times 2. Then take one third of it." },
  "You found the cylinder for the 6 in radius and 2 in height, then took one third.": { style: 'A', say: "You found the cylinder for the 6-inch radius and 2-inch height, then took one third." },
}
