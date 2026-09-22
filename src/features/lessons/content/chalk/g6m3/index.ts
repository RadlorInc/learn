/** Grade 6 · Module 3's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T4 } from './t4'
import { T5 } from './t5'
import { T6 } from './t6'

export const G6M3_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g6m3-t4': T4,
  'g6m3-t5': T5,
  'g6m3-t6': T6,
}
