/** g6m2's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T1 } from './t1'
import { T2 } from './t2'
import { T3 } from './t3'
import { T4 } from './t4'
import { T5 } from './t5'
import { T6 } from './t6'
import { T7 } from './t7'

export const G6M2_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g6m2-t1': T1,
  'g6m2-t2': T2,
  'g6m2-t3': T3,
  'g6m2-t4': T4,
  'g6m2-t5': T5,
  'g6m2-t6': T6,
  'g6m2-t7': T7,
}
