/** g8m5's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T3 } from './t3'
import { T4 } from './t4'

export const G8M5_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g8m5-t3': T3,
  'g8m5-t4': T4,
}
