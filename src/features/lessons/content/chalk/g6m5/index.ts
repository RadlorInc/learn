/** Grade 6 · Module 5's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T1 } from './t1'
import { T2 } from './t2'
import { T3 } from './t3'
import { T4 } from './t4'
import { T5 } from './t5'

export const G6M5_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g6m5-t1': T1,
  'g6m5-t2': T2,
  'g6m5-t3': T3,
  'g6m5-t4': T4,
  'g6m5-t5': T5,
}
