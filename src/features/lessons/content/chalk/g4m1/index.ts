/** Grade 4 · Module 1's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T5 } from './t5'
import { T6 } from './t6'
import { T7 } from './t7'
import { T8 } from './t8'

export const G4M1_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g4m1-t5': T5,
  'g4m1-t6': T6,
  'g4m1-t7': T7,
  'g4m1-t8': T8,
}
