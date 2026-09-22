/** g8m3's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T1 } from './t1'
import { T2 } from './t2'
import { T3 } from './t3'
import { T4 } from './t4'
import { T5 } from './t5'
import { T6 } from './t6'

export const G8M3_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g8m3-t1': T1,
  'g8m3-t2': T2,
  'g8m3-t3': T3,
  'g8m3-t4': T4,
  'g8m3-t5': T5,
  'g8m3-t6': T6,
}
