/** Grade 5 · Module 5's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T5 } from './t5'
import { T6 } from './t6'
import { T7 } from './t7'

export const G5M5_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g5m5-t5': T5,
  'g5m5-t6': T6,
  'g5m5-t7': T7,
}
