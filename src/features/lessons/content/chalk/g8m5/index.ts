/** g8m5's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T1 } from './t1'
import { T2 } from './t2'

export const G8M5_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g8m5-t1': T1,
  'g8m5-t2': T2,
}
