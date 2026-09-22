/**
 * How g8m3's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G8M3_VOICE: Record<string, VoiceLine> = {
  // ("Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  // ── g8m3-t1 ──
  "Look at this table.": { style: 'B' },
  "You might hunt for a pattern, like outputs that go up.": { style: 'B' },
  "There isn't one. 5, 2, 9, 2.": { style: 'B' },
  "So is this table broken? No. The real question is much simpler than a pattern.": { style: 'B' },
  "A function gives each input exactly one output, so one input with two different outputs breaks it.": { style: 'B' },
  "Walk the inputs one at a time.": { style: 'B' },
  "Input 1 gives 3. Input 2 gives 5.": { style: 'B' },
  "Input 3 gives 7, and input 4 gives 9.": { style: 'B' },
  "Every input shows up once, with one output. So this table is a function.": { style: 'B' },
  "Now watch this one.": { style: 'B' },
  "Input 2 shows up twice.": { style: 'B' },
  "Once it gives 6, and once it gives 8.": { style: 'B' },
  "That is button A giving chips today and a cookie tomorrow. Not a function.": { style: 'B' },
  "Here is one that looks strange. Every input gives 5.": { style: 'B' },
  "Is that allowed? Yes. Two buttons can give you the same snack.": { style: 'B' },
  "Each input still has just one output, so this is a function.": { style: 'B' },
  "Don't call it \"not a function\" just because an OUTPUT repeats.": { style: 'B+' },
  "Only one INPUT with two different outputs breaks the rule.": { style: 'B+' },
  // ── g8m3-t2 ──
  "You drop in 4. Can you just look and know what comes out?": { style: 'B' },
  "No. The machine does not guess, and neither can you.": { style: 'B' },
  "You have to follow its rule, step by step, in the right order.": { style: 'B' },
  "Put the input into the rule, then multiply before you add or subtract, and that gives the output.": { style: 'B' },
  "Our input is 4.": { style: 'B' },
  "So wherever the rule says input, we write a 4 instead.": { style: 'B' },
  "That gives us 3 × 4 − 2.": { style: 'B' },
  "Which comes first, the times or the minus?": { style: 'B' },
  "Multiply first. 3 × 4 = 12.": { style: 'B' },
  "Then take away the 2. 12 − 2 = 10.": { style: 'B' },
  "So when 4 goes in, 10 comes out.": { style: 'B' },
  "People write this same rule a shorter way.": { style: 'B' },
  "It looks like f(x) = 3x − 2.": { style: 'B', say: "It looks like f of x equals 3 x minus 2." },
  "The x is the input, and 3x means 3 × x.": { style: 'B', say: "The x is the input, and 3 x means 3 times x." },
  "So f(4) asks for the output when 4 goes in, and we already found it: 10.": { style: 'B', say: "So f of 4 asks for the output when 4 goes in, and we already found it, 10." },
  "Don't SUBTRACT before you multiply.": { style: 'B+' },
  "3 × 4 − 2 is not 3 × 2. Multiply 3 × 4 first, then take away the 2.": { style: 'B+' },
  // outside the teach (Screen 8, hints, Screen 9): only the lines speakable() cannot say
  "Try a new one. f(x) = 2x + 5. What is f(7)?": { style: 'A', say: "Try a new one. f of x equals 2 x plus 5. What is f of 7?" },
  "f(7) means the input is 7. Where does the 7 go?": { style: 'A', say: "f of 7 means the input is 7. Where does the 7 go?" },
  "You put 7 in place of x in 2x + 5 and found f(7) = 19.": { style: 'A', say: "You put 7 in place of x in 2 x plus 5 and found f of 7 equals 19." },
  // ── g8m3-t3 ──
  "Look at both tables.": { style: 'B' },
  "Plant A gets taller every week. So does Plant B.": { style: 'B' },
  "So does going up tell them apart? No.": { style: 'B' },
  "What matters is how much each one grows every week.": { style: 'B' },
  "When x goes up in equal steps and y changes by the same amount every step, the points make a straight line.": { style: 'B' },
  "Start with Plant A. Each week, x goes up 1.": { style: 'B' },
  "The height goes 1, 3, 5, 7.": { style: 'B' },
  "That is up 2, up 2, up 2, the same step every time.": { style: 'B' },
  "Plot those points, and they sit on one straight line.": { style: 'B' },
  "Now Plant B. It goes 0, 1, 4, 9.": { style: 'B' },
  "Is that the same step each week? No.": { style: 'B' },
  "It goes up 1, then up 3, then up 5, so the points bend upward.": { style: 'B' },
  "Plant A grew by the same amount every week, so its points make a straight line.": { style: 'B' },
  "A table like that has a name.": { style: 'B' },
  "We call it linear. Plant B is not linear.": { style: 'B' },
  "Don't compare the y changes before you CHECK the x steps.": { style: 'B+' },
  "If x goes up 1 and then up 2, y should go up twice as far the second time. That is still a straight line.": { style: 'B+' },
}
