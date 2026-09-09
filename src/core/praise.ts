/**
 * What Milo says when a child gets one right, and which bands hear it.
 *
 * ⚠️ THIS REVERSES A RECORDED CALL, DELIBERATELY. The rule used to be *no spoken praise on a
 * correct answer — the tick is enough*, on the reasoning that children do not need praising every
 * question. A student asked for it by name on 2026-08-27 and the founder reversed it.
 *
 * ⚠️ AND IT STOPS AT 8, WHICH IS THE HALF THAT NEEDED DECIDING. Both engines have to agree or a
 * band praises in some of its chapters and not others — 9–11 alone is split across the two, with
 * OrderDesk and LevelRun on the storybook engine and the other ten on `GameShell`. So the cutoff is
 * by AGE, never by engine.
 *
 * It stops at 8 rather than 11 because of this product's own rule that **9–11 must not look like
 * 3–8** — that is why that band moved onto the Field Lab design in the first place. "Great job!"
 * after every question cuts directly against it, and the student who asked for praise was reviewing
 * the 3–5 band. 12–18 was never in question: it reads as patronising to a fifteen-year-old.
 *
 * ⚠️ ROTATED, not one line repeated: the same three words ten times in a row stops being praise and
 * becomes a noise the chapter makes.
 * ⚠️ AND SHORT. The next question is announced ~1.3–1.65 s later and `speak()` cancels whatever is
 * still talking, so a long line is cut off mid-word — these are ~0.6–0.9 s.
 * ⚠️ Speech is the ADDITION and never the carrier: most Chrome installs have no voice, so the
 * written tick stays and a child on a silent device sees exactly what they saw before.
 */
export const PRAISE = ['Great job!', 'Nice work!', 'Well done!', 'You got it!', 'Lovely!'] as const

/**
 * Whether this band hears a spoken line on a right answer.
 *
 * Takes the band as a plain string so `core` keeps its back to `features` (see the 2026-08-18
 * layering pass); the storybook engine has no band at all and simply does not ask.
 */
export const praisesOnCorrect = (band: string): boolean =>
  band === '3-5' || band === '6-8'
