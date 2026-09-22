/** Grade 5 · Module 4's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T6 } from './t6'
import { T7 } from './t7'
import { T8 } from './t8'
import { T9 } from './t9'

export const G5M4_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g5m4-t6': T6,
  'g5m4-t7': T7,
  'g5m4-t8': T8,
  'g5m4-t9': T9,
}
