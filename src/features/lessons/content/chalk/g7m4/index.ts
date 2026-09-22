/** g7m4's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T1 } from './t1'
import { T2 } from './t2'
import { T3 } from './t3'
import { T4 } from './t4'

export const G7M4_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g7m4-t1': T1,
  'g7m4-t2': T2,
  'g7m4-t3': T3,
  'g7m4-t4': T4,
}
