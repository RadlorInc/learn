/**
 * How g8m6's lines are RENDERED (docs/new-flow/voice.md). Keyed by the line EXACTLY as the lesson says it; `say` is what
 * the voice model reads (symbols spelt out, no tags, no ellipses). A line with no row renders as style A from its own text.
 */
import type { VoiceLine } from './styles'

export const G8M6_VOICE: Record<string, VoiceLine> = {
  // ("Here's the part people mix up." and "Okay. Your turn." are g5m1's rows)
  // ── g8m6-t4 ──
  "Here is what we know so far.": { style: 'B' },
  "27 students like pizza, and 20 students are in grade 7.": { style: 'B' },
  "So how many grade 7 students like pizza? Those two counts cannot tell you.": { style: 'B' },
  "Put one question in the rows and one in the columns, so each box counts the people who fit both.": { style: 'B' },
  "Let's fill one box together.": { style: 'B' },
  "12 students are in grade 7 and they like pizza.": { style: 'B' },
  "Where does that 12 go? Right where the Grade 7 row meets the Likes pizza column.": { style: 'B' },
  "Now check each row. It has to add up to its own total.": { style: 'B' },
  "In grade 7, 12 and 8 make 20.": { style: 'B' },
  "In grade 8, 15 and 5 make 20 as well.": { style: 'B' },
  "Does it work going down, too? Yes.": { style: 'B' },
  "Down the Likes pizza column, 12 and 15 make 27.": { style: 'B' },
  "Down the Does not column, 8 and 5 make 13.": { style: 'B' },
  "And 27 and 13 make 40, the same 40 you get from 20 and 20.": { style: 'B' },
  "Don't ADD a row total to a column total.": { style: 'B+' },
  "The 12 grade 7 pizza fans are in both, so they get counted twice.": { style: 'B+' },
  "Add the two row totals instead. 20 and 20 make all 40.": { style: 'B+' },
  // ── g8m6-t5 ──
  "15 is more than 12, sure. But look at the row totals.": { style: 'B' },
  "Grade 8 has 30 students, and grade 7 has only 20.": { style: 'B' },
  "So is 15 out of 30 really more than 12 out of 20? The counts alone cannot tell us.": { style: 'B' },
  "Divide each count by the total of its own group, and then groups of different sizes compare fairly.": { style: 'B' },
  "Start with grade 7. 12 of their 20 students like pizza.": { style: 'B' },
  "Divide 12 by 20 and you get 0.6.": { style: 'B', say: "Divide 12 by 20 and you get zero point six." },
  "That is 60 out of every 100, so 60%.": { style: 'B' },
  "Now grade 8. 15 of their 30 students like pizza.": { style: 'B' },
  "Divide 15 by 30 and you get 0.5, or 50%.": { style: 'B', say: "Divide 15 by 30 and you get zero point five, or 50 percent." },
  "So which grade likes pizza more? Grade 7, even though its count was smaller.": { style: 'B' },
  "Here is a different question. Of the students who like pizza, what part are in grade 7?": { style: 'B' },
  "Now we divide by the Likes pizza column total, 27.": { style: 'B' },
  "So it is 12 out of 27, which simplifies to 4/9.": { style: 'B', say: "So it is 12 out of 27, which simplifies to four ninths." },
  "When the question asks about grade 7 students, don't divide by ALL 50 students.": { style: 'B+' },
  "Divide by the Grade 7 row total, 20, and you get 60%.": { style: 'B+' },
}
