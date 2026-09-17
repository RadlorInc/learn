/** Lesson id → its practice ladder (see ../adaptive.ts). A lesson with no ladder keeps its 5 written practice problems. */
// ponytail: every module's ladders are imported eagerly — a 907 KB (262 KB gzipped) client chunk on /lesson and /practice,
// measured with `next build` 2026-09-17. Split per module with dynamic import() when first-load time on slow phones matters.
import { rng, type Level } from '../adaptive'
import type { Answer } from '../script'
import { G5M1_LADDERS } from './g5m1'
import { G3M1_LADDERS } from './g3m1'
import { G3M2_LADDERS } from './g3m2'
import { G3M3_LADDERS } from './g3m3'
import { G3M4_LADDERS } from './g3m4'
import { G3M5_LADDERS } from './g3m5'
import { G3M6_LADDERS } from './g3m6'
import { G4M1_LADDERS } from './g4m1'
import { G4M2_LADDERS } from './g4m2'
import { G4M3_LADDERS } from './g4m3'
import { G4M4_LADDERS } from './g4m4'
import { G4M5_LADDERS } from './g4m5'
import { G4M6_LADDERS } from './g4m6'
import { G5M2_LADDERS } from './g5m2'
import { G5M3_LADDERS } from './g5m3'
import { G5M4_LADDERS } from './g5m4'
import { G5M5_LADDERS } from './g5m5'
import { G5M6_LADDERS } from './g5m6'
import { G6M1_LADDERS } from './g6m1'
import { G6M2_LADDERS } from './g6m2'
import { G6M3_LADDERS } from './g6m3'
import { G6M4_LADDERS } from './g6m4'
import { G6M5_LADDERS } from './g6m5'
import { G6M6_LADDERS } from './g6m6'
import { G6M7_LADDERS } from './g6m7'
import { G7M1_LADDERS } from './g7m1'
import { G7M2_LADDERS } from './g7m2'
import { G7M3_LADDERS } from './g7m3'
import { G7M4_LADDERS } from './g7m4'
import { G7M5_LADDERS } from './g7m5'
import { G8M1_LADDERS } from './g8m1'
import { G8M2_LADDERS } from './g8m2'
import { G8M3_LADDERS } from './g8m3'
import { G8M4_LADDERS } from './g8m4'
import { G8M5_LADDERS } from './g8m5'
import { G8M6_LADDERS } from './g8m6'

export const LADDERS: Record<string, Level[]> = { ...G5M1_LADDERS, ...G3M1_LADDERS, ...G3M2_LADDERS, ...G3M3_LADDERS, ...G3M4_LADDERS, ...G3M5_LADDERS, ...G3M6_LADDERS, ...G4M1_LADDERS, ...G4M2_LADDERS, ...G4M3_LADDERS, ...G4M4_LADDERS, ...G4M5_LADDERS, ...G4M6_LADDERS, ...G5M2_LADDERS, ...G5M3_LADDERS, ...G5M4_LADDERS, ...G5M5_LADDERS, ...G5M6_LADDERS, ...G6M1_LADDERS, ...G6M2_LADDERS, ...G6M3_LADDERS, ...G6M4_LADDERS, ...G6M5_LADDERS, ...G6M6_LADDERS, ...G6M7_LADDERS, ...G7M1_LADDERS, ...G7M2_LADDERS, ...G7M3_LADDERS, ...G7M4_LADDERS, ...G7M5_LADDERS, ...G8M1_LADDERS, ...G8M2_LADDERS, ...G8M3_LADDERS, ...G8M4_LADDERS, ...G8M5_LADDERS, ...G8M6_LADDERS }
export const ladderOf = (lessonId: string): Level[] | undefined => LADDERS[lessonId]

/** A few answers from every level, so the answer box can take its shape from the whole ladder (a "−" key, a whole-number box). */
export const ladderAnswers = (ladder: readonly Level[]): Answer[] =>
  ladder.flatMap((lv, i) => Array.from({ length: 20 }, (_, s) => lv.make(rng(i * 1000 + s)).answer!))
