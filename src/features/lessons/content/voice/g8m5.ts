/**
 * How g8m5's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G8M5_VOICE: Record<string, VoiceLine> = {
  // ("Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  // ── g8m5-t3 ──
  "A round ball. A ball is 3 in from its center to its outside. How much air is inside it?": { style: 'A', say: "A round ball. A ball is 3 inches from its center to its outside. How much air is inside it?" },
  "A ball has no flat bottom and no straight height.": { style: 'B' },
  "So the can rule has nothing to hold on to.": { style: 'B' },
  "How do we find what fits inside, then? We get help from a can.": { style: 'B' },
  "A ball holds 2/3 of the can that fits snugly around it, so its volume is 4/3 × 3.14 × radius × radius × radius.": { style: 'B', say: "A ball holds two thirds of the can that fits snugly around it, so its volume is four thirds times three point one four times radius times radius times radius." },
  "Look. Picture the smallest can this ball fits inside.": { style: 'B' },
  "Its radius is the same as the ball's, 3 in.": { style: 'B', say: "Its radius is the same as the ball's, 3 inches." },
  "And how tall is it? The whole way across the ball, so 3 × 2 = 6 in.": { style: 'B', say: "And how tall is it? The whole way across the ball, so 3 times 2 equals 6 inches." },
  "Fill the can with water, then push the ball in.": { style: 'B' },
  "The water that spills out is as big as the ball.": { style: 'B' },
  "How much spills? Two thirds of the can. One third stays in.": { style: 'B' },
  "The can first. 3.14 × 3 × 3 × 6 = 169.56.": { style: 'B', say: "The can first. Three point one four times 3 times 3 times 6 equals one hundred sixty-nine point five six." },
  "The ball is two thirds of that. 169.56 ÷ 3 × 2 = 113.04.": { style: 'B', say: "The ball is two thirds of that. One hundred sixty-nine point five six, divided by 3, times 2, equals one hundred thirteen point zero four." },
  "Is there a faster way? Yes. 4/3 × 3.14 × 3 × 3 × 3 gives the same 113.04.": { style: 'B', say: "Is there a faster way? Yes. Four thirds times three point one four times 3 times 3 times 3 gives the same one hundred thirteen point zero four." },
  "So the ball holds 113.04 cubic inches.": { style: 'B', say: "So the ball holds one hundred thirteen point zero four cubic inches." },
  "Don't use the radius only TWICE, the way you would for a flat circle.": { style: 'B+' },
  "A ball is round every way, so the radius goes in three times.": { style: 'B+' },
  "Now you try. A ball has a radius of 6 cm. What is its volume in cubic centimeters? Use π ≈ 3.14. Multiply the radius by itself three times. Take 4/3 of that, then multiply by 3.14.": { style: 'A', say: "Now you try. A ball has a radius of 6 centimeters. What is its volume in cubic centimeters? Use pi as three point one four. Multiply the radius by itself three times. Take four thirds of that, then multiply by three point one four." },
  "Try a new one. A ball is 9 in across. What is its volume in cubic inches? Use π ≈ 3.14.": { style: 'A', say: "Try a new one. A ball is 9 inches across. What is its volume in cubic inches? Use pi as three point one four." },
  "Find 6 × 6 × 6. Then take 4/3 of it and multiply by 3.14.": { style: 'A', say: "Find 6 times 6 times 6. Then take four thirds of it and multiply by three point one four." },
  "Is 9 in the radius, or the whole way across?": { style: 'A', say: "Is 9 inches the radius, or the whole way across?" },
  "Take half of 9 first. Use that radius three times, then take 4/3 and multiply by 3.14.": { style: 'A', say: "Take half of 9 first. Use that radius three times, then take four thirds and multiply by three point one four." },
  "You used the radius three times, took 4/3, and multiplied by 3.14.": { style: 'A', say: "You used the radius three times, took four thirds, and multiplied by three point one four." },
  "You halved the 9 in across, then used the radius three times.": { style: 'A', say: "You halved the 9 inches across, then used the radius three times." },
  // ── g8m5-t4 ──
  "Is there one rule for this whole thing? No.": { style: 'B' },
  "So split it into two parts.": { style: 'B' },
  "The bottom is a cone.": { style: 'B' },
  "The scoop on top is half of a ball.": { style: 'B' },
  "Name each shape, use its own rule, and add the pieces.": { style: 'B' },
  "Take the cone first.": { style: 'B' },
  "It is one third of a can with the same bottom and the same height.": { style: 'B' },
  "1/3 × 3.14 × 3 × 3 × 4 = 37.68.": { style: 'B', say: "One third times three point one four times 3 times 3 times 4 equals thirty-seven point six eight." },
  "Now the scoop. Find a whole ball first.": { style: 'B' },
  "4/3 × 3.14 × 3 × 3 × 3 = 113.04.": { style: 'B', say: "Four thirds times three point one four times 3 times 3 times 3 equals one hundred thirteen point zero four." },
  "But only half a ball sits on top, so halve it.": { style: 'B' },
  "113.04 ÷ 2 = 56.52.": { style: 'B', say: "One hundred thirteen point zero four, divided by 2, equals fifty-six point five two." },
  "Two pieces, two numbers.": { style: 'B' },
  "37.68 from the cone, and 56.52 from the scoop.": { style: 'B', say: "Thirty-seven point six eight from the cone, and fifty-six point five two from the scoop." },
  "Add them. 37.68 + 56.52 = 94.2.": { style: 'B', say: "Add them. Thirty-seven point six eight plus fifty-six point five two equals ninety-four point two." },
  "So there are 94.2 cubic centimeters of ice cream in all.": { style: 'B', say: "So there are ninety-four point two cubic centimeters of ice cream in all." },
  "Don't add a WHOLE ball when only half of one sits on top.": { style: 'B+' },
  "Halve it first, then add. 37.68 + 56.52 = 94.2.": { style: 'B+', say: "Halve it first, then add. Thirty-seven point six eight plus fifty-six point five two equals ninety-four point two." },
  "Now you try. An ice-cream cone has a radius of 3 cm and a height of 8 cm. Half a ball of ice cream with a radius of 3 cm sits on top. How many cubic centimeters is that in all? Use π ≈ 3.14. Name the two shapes. Find each one, then add.": { style: 'A', say: "Now you try. An ice-cream cone has a radius of 3 centimeters and a height of 8 centimeters. Half a ball of ice cream with a radius of 3 centimeters sits on top. How many cubic centimeters is that in all? Use pi as three point one four. Name the two shapes. Find each one, then add." },
  "Try a new one. A can has a radius of 2 in and a height of 6 in. A ball has a radius of 3 in. Which holds more? Use π ≈ 3.14.": { style: 'A', say: "Try a new one. A can has a radius of 2 inches and a height of 6 inches. A ball has a radius of 3 inches. Which holds more? Use pi as three point one four." },
}
