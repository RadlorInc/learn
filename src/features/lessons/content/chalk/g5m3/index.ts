/** g5m3's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T5 } from './t5'
import { T6 } from './t6'
import { T7 } from './t7'
import { T8 } from './t8'

export const G5M3_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g5m3-t5': T5,
  'g5m3-t6': T6,
  'g5m3-t7': T7,
  'g5m3-t8': T8,
}
