/** Grade 5 · Module 6's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T4 } from './t4'
import { T5 } from './t5'
import { T6 } from './t6'

export const G5M6_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g5m6-t4': T4,
  'g5m6-t5': T5,
  'g5m6-t6': T6,
}
