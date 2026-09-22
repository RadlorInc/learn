/** Grade 3 · Module 3's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T6 } from './t6'
import { T7 } from './t7'
import { T8 } from './t8'
import { T9 } from './t9'

export const G3M3_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g3m3-t6': T6,
  'g3m3-t7': T7,
  'g3m3-t8': T8,
  'g3m3-t9': T9,
}
