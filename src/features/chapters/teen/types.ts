// Shared types for the "Field Lab" kit — the teen bands (12–18) AND, since 2026-08-14, the 9–11
// band, which the founder asked to be treated the same way. See `GameConfig.band`.
// Every teen kit component + chapter imports from here so the fan-out stays compatible.

/**
 * ⚠️ `'9-11'` IS ON THIS LIST AND IT IS NOT A TEEN BAND. The founder's call: 9–11 runs the same
 * engine, the same universal layout and the same chapter-as-a-data-file shape as 12–18, so that a
 * fix lands once across every band instead of ten more times. What stays ITS OWN is the loop's
 * shape (ten rounds, no resume-at-difficulty — see `chapter-craft.md`) and the thing that makes it
 * the band it is: **answering with your hand**, which is a first-class field on the config.
 */
export type AgeBand = '9-11' | '12-14' | '15-16' | '17-18'

/** Answer feedback state — math-without-fear: 'wrong' renders neutral + amber, NEVER red. */
export type AnswerStatus = 'idle' | 'correct' | 'wrong'

/** A point on the coordinate grid (lattice or value space). */
export interface Pt { x: number; y: number }

/** Milo's embodiment per band: 'M' monogram (12-14) → 'M.' avatar (15-16) → 'M·' mark (17-18). */
export type MiloMood = 'idle' | 'thinking' | 'speaking'

/** A multiple-choice option used by ChoiceGrid / StepSelect. */
export interface Choice {
  value: string | number
  label: string
}

/** Framing label per band — drives copy ("Investigation" / "Commission" / "Module"). */
export const BAND_FRAMING: Record<AgeBand, { unit: string; persona: string }> = {
  // 9–11 is a JOB, not an investigation — the band's own worlds are a coin tray, a pizza counter,
  // a height bar. Warmer and more concrete than the bands above it, by a whole step.
  '9-11':  { unit: 'Job', persona: 'workmate' },
  '12-14': { unit: 'Investigation', persona: 'lab partner' },
  '15-16': { unit: 'Commission', persona: 'studio analyst' },
  '17-18': { unit: 'Module', persona: 'research coach' },
}
