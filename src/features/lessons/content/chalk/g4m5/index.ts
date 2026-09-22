/** g4m5's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T5 } from './t5'
import { T6 } from './t6'
import { T7 } from './t7'
import { T8 } from './t8'

export const G4M5_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g4m5-t5': T5,
  'g4m5-t6': T6,
  'g4m5-t7': T7,
  'g4m5-t8': T8,
}
