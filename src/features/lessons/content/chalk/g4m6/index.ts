/** g4m6's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T1 } from './t1'
import { T2 } from './t2'
import { T3 } from './t3'
import { T4 } from './t4'
import { T5 } from './t5'
import { T6 } from './t6'
import { T7 } from './t7'

export const G4M6_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g4m6-t1': T1,
  'g4m6-t2': T2,
  'g4m6-t3': T3,
  'g4m6-t4': T4,
  'g4m6-t5': T5,
  'g4m6-t6': T6,
  'g4m6-t7': T7,
}
