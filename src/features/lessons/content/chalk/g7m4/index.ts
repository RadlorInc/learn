/** g7m4's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T1 } from './t1'
import { T2 } from './t2'
import { T3 } from './t3'
import { T4 } from './t4'
import { T5 } from './t5'
import { T6 } from './t6'
import { T7 } from './t7'
import { T8 } from './t8'

export const G7M4_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g7m4-t1': T1,
  'g7m4-t2': T2,
  'g7m4-t3': T3,
  'g7m4-t4': T4,
  'g7m4-t5': T5,
  'g7m4-t6': T6,
  'g7m4-t7': T7,
  'g7m4-t8': T8,
}
