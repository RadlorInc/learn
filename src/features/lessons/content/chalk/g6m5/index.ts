/** Grade 6 · Module 5's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T6 } from './t6'
import { T7 } from './t7'
import { T8 } from './t8'
import { T9 } from './t9'

export const G6M5_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g6m5-t6': T6,
  'g6m5-t7': T7,
  'g6m5-t8': T8,
  'g6m5-t9': T9,
}
