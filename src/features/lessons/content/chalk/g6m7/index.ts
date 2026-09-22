/** g6m7's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T1 } from './t1'
import { T2 } from './t2'
import { T3 } from './t3'
import { T4 } from './t4'

export const G6M7_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g6m7-t1': T1,
  'g6m7-t2': T2,
  'g6m7-t3': T3,
  'g6m7-t4': T4,
}
