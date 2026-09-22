/** g7m5's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T1 } from './t1'
import { T2 } from './t2'
import { T3 } from './t3'
import { T4 } from './t4'
import { T5 } from './t5'
import { T6 } from './t6'

export const G7M5_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g7m5-t1': T1,
  'g7m5-t2': T2,
  'g7m5-t3': T3,
  'g7m5-t4': T4,
  'g7m5-t5': T5,
  'g7m5-t6': T6,
}
