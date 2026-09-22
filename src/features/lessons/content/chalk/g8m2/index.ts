/** g8m2's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T6 } from './t6'
import { T7 } from './t7'
import { T8 } from './t8'
import { T9 } from './t9'

export const G8M2_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g8m2-t6': T6,
  'g8m2-t7': T7,
  'g8m2-t8': T8,
  'g8m2-t9': T9,
}
