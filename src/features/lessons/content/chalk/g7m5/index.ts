/** g7m5's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T4 } from './t4'
import { T5 } from './t5'
import { T6 } from './t6'

export const G7M5_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g7m5-t4': T4,
  'g7m5-t5': T5,
  'g7m5-t6': T6,
}
