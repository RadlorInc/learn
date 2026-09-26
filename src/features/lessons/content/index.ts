/** Module id → its lessons. Add a module's file here once it is written (see docs/new-flow/AUTHORING.md). */
// Every module, eagerly: for the dashboard and the tests (through ../modules). The child's screens load ONE module
// through ../catalogue's loadModule (PERF-01) — never import this file from /lesson, /practice or /modules. A new
// module also needs its line in catalogue.ts's LOADERS and a re-run of scripts/lesson-catalogue.mts.
import type { Lesson } from '../script'
import { G8M4 } from './g8m4'
import { G8M2 } from './g8m2'
import { G8M6 } from './g8m6'
import { G8M1 } from './g8m1'
import { G8M5 } from './g8m5'
import { G8M3 } from './g8m3'
import { G7M4 } from './g7m4'
import { G7M2 } from './g7m2'
import { G7M5 } from './g7m5'
import { G7M3 } from './g7m3'
import { G7M1 } from './g7m1'
import { G6M7 } from './g6m7'
import { G6M5 } from './g6m5'
import { G6M3 } from './g6m3'
import { G6M6 } from './g6m6'
import { G6M2 } from './g6m2'
import { G6M1 } from './g6m1'
import { G6M4 } from './g6m4'
import { G5M4 } from './g5m4'
import { G5M2 } from './g5m2'
import { G5M5 } from './g5m5'
import { G5M1 } from './g5m1'
import { G5M3 } from './g5m3'
import { G5M6 } from './g5m6'
import { G4M5 } from './g4m5'
import { G4M3 } from './g4m3'
import { G4M4 } from './g4m4'
import { G4M2 } from './g4m2'
import { G4M1 } from './g4m1'
import { G4M6 } from './g4m6'
import { G3M6 } from './g3m6'
import { G3M5 } from './g3m5'
import { G3M2 } from './g3m2'
import { G3M3 } from './g3m3'
import { G3M4 } from './g3m4'

export const CONTENT: Record<string, Lesson[]> = {
  g8m4: G8M4,
  g8m2: G8M2,
  g8m6: G8M6,
  g8m1: G8M1,
  g8m5: G8M5,
  g8m3: G8M3,
  g7m4: G7M4,
  g7m2: G7M2,
  g7m5: G7M5,
  g7m3: G7M3,
  g7m1: G7M1,
  g6m7: G6M7,
  g6m5: G6M5,
  g6m3: G6M3,
  g6m6: G6M6,
  g6m2: G6M2,
  g6m1: G6M1,
  g6m4: G6M4,
  g5m4: G5M4,
  g5m2: G5M2,
  g5m5: G5M5,
  g5m1: G5M1,
  g5m3: G5M3,
  g5m6: G5M6,
  g4m5: G4M5,
  g4m3: G4M3,
  g4m4: G4M4,
  g4m2: G4M2,
  g4m1: G4M1,
  g4m6: G4M6,
  g3m6: G3M6,
  g3m5: G3M5,
  g3m2: G3M2,
  g3m3: G3M3,
  g3m4: G3M4,
}
