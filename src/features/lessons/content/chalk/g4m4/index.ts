/** g4m4's chalkboards, one file per topic (see ../../../chalk.ts). */
import type { ChalkMark } from '../../../chalk'
import { T6 } from './t6'
import { T7 } from './t7'
import { T8 } from './t8'
import { T9 } from './t9'

export const G4M4_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {
  'g4m4-t6': T6,
  'g4m4-t7': T7,
  'g4m4-t8': T8,
  'g4m4-t9': T9,
}
