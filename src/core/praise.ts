/**
 * What Milo says when a child gets one right, and which bands hear it.
 *
 * ⚠️ THIS REVERSES A RECORDED CALL, DELIBERATELY. The rule used to be *no spoken praise on a
 * correct answer — the tick is enough*, on the reasoning that children do not need praising every
 * question. A student asked for it by name on 2026-08-27 and the founder reversed it.
 *
 * ⚠️ AND IT STOPS AT 11, WHICH IS THE HALF THAT NEEDED DECIDING. Both engines had to agree or the
 * 9–11 band would praise in two chapters (OrderDesk and LevelRun, which run on the storybook
 * engine) and stay silent in the other ten (which run on `GameShell`) — the same band, the same
 * child, two different chapters. So the cutoff is by AGE rather than by engine: every band up to
 * 9–11 praises, and 12–18 does not, because "Great job!" after every question reads as patronising
 * to a fifteen-year-old rather than as warm.
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
  band === '3-5' || band === '6-8' || band === '9-11'
