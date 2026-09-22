/** Grade 4 · Module 6's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T5 } from './t5'
import { T6 } from './t6'
import { T7 } from './t7'

export const G4M6_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g4m6-t5': T5,
  'g4m6-t6': T6,
  'g4m6-t7': T7,
}
