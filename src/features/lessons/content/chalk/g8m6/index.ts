/** g8m6's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T4 } from './t4'
import { T5 } from './t5'

export const G8M6_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g8m6-t4': T4,
  'g8m6-t5': T5,
}
