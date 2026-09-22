/** Grade 5 · Module 3's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T1 } from './t1'
import { T2 } from './t2'
import { T3 } from './t3'
import { T4 } from './t4'

export const G5M3_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g5m3-t1': T1,
  'g5m3-t2': T2,
  'g5m3-t3': T3,
  'g5m3-t4': T4,
}
