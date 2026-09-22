/** g7m4's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T5 } from './t5'
import { T6 } from './t6'
import { T7 } from './t7'
import { T8 } from './t8'

export const G7M4_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g7m4-t5': T5,
  'g7m4-t6': T6,
  'g7m4-t7': T7,
  'g7m4-t8': T8,
}
