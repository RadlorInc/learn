/** Grade 6 · Module 6's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T1 } from './t1'
import { T2 } from './t2'
import { T3 } from './t3'

export const G6M6_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g6m6-t1': T1,
  'g6m6-t2': T2,
  'g6m6-t3': T3,
}
