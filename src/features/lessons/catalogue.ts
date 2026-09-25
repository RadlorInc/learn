/**
 * The CHILD'S screens' view of the lessons (PERF-01, docs/review/PERFORMANCE.md). Two halves:
 *   - `CATALOGUE`: every module's id, grade, number, title and each topic's id, title and first picture object — small
 *     enough to ship eagerly, and all /modules needs. Generated from the real lessons into ./catalogue.json by
 *     `npx tsx scripts/lesson-catalogue.mts > src/features/lessons/catalogue.json`; lessonCatalogueSplit.test.ts fails
 *     when it no longer matches them.
 *   - `loadModule(id)`: ONE module's lessons (with their chalk) and practice ladders, fetched as its own chunk with
 *     import(). /lesson and /practice wait for it instead of downloading all 36 modules before the first paint.
 * ⚠️ Nothing here may import ./modules, ./content or ./ladders statically: one such import puts the whole catalogue back
 * into every child screen's first load (the test walks the import graph and fails on it).
 * Adults' screens (the dashboard, classes) and the tests keep the full, synchronous ./modules — which also fills the
 * registry below, so a component that reads `ladderOf` here sees every module there.
 */
import { useEffect, useState } from 'react'
import type { Lesson, Obj, Problem } from './script'
import type { Level } from './adaptive'
import type { Module } from './modules'
import CATALOGUE_JSON from './catalogue.json'

export interface LessonMeta { id: string; title: string; obj?: Obj }
export interface ModuleMeta { id: string; grade: number; n: number; title: string; lessons: LessonMeta[] }

export const CATALOGUE = CATALOGUE_JSON as ModuleMeta[]

/**
 * What a child sees when their parent chose topics: each module keeps only the chosen lessons, and a module with none
 * disappears. `null`/`undefined`/empty = no choice made = every topic.
 */
export function chooseFrom<M extends { lessons: readonly { id: string }[] }>(mods: M[], lessonIds: readonly string[] | null | undefined): M[] {
  if (!lessonIds || lessonIds.length === 0) return mods
  const pick = new Set(lessonIds)
  return mods.map(m => ({ ...m, lessons: m.lessons.filter(l => pick.has(l.id)) })).filter(m => m.lessons.length > 0)
}

/** The module a topic belongs to, from the catalogue (undefined for an id no module has). */
export const moduleIdOf = (lessonId: string | null) => CATALOGUE.find(m => m.lessons.some(l => l.id === lessonId))?.id

// ── Loaded modules ────────────────────────────────────────────────────────────────────────────────────────────
const LOADED = new Map<string, Module>()
const LADDERS: Record<string, Level[]> = {}

/** Puts a module and its ladders where the synchronous lookups below can see them. */
export function remember(module: Module, ladders: Record<string, Level[]>) {
  LOADED.set(module.id, module)
  for (const l of module.lessons) if (ladders[l.id]) LADDERS[l.id] = ladders[l.id]
}
/** A loaded topic's practice ladder (see ./adaptive). A topic with no ladder keeps its 5 written practice problems. */
export const ladderOf = (lessonId: string): Level[] | undefined => LADDERS[lessonId]
/** A topic of a module that is already loaded. */
export const loadedLesson = (id: string | null): Lesson | undefined => {
  for (const m of LOADED.values()) { const l = m.lessons.find(x => x.id === id); if (l) return l }
}

type Part = { lessons: Lesson[]; ladders: Record<string, Level[]> }
const both = (c: Promise<Lesson[]>, l: Promise<Record<string, Level[]>>): Promise<Part> => Promise.all([c, l]).then(([lessons, ladders]) => ({ lessons, ladders }))
// One entry per module, each import() written out so the bundler makes one chunk per module file.
const LOADERS: Record<string, () => Promise<Part>> = {
  g3m1: () => both(import('./grade3Module1').then(x => x.GRADE3_MODULE1), import('./ladders/g3m1').then(x => x.G3M1_LADDERS)),
  g3m2: () => both(import('./content/g3m2').then(x => x.G3M2), import('./ladders/g3m2').then(x => x.G3M2_LADDERS)),
  g3m3: () => both(import('./content/g3m3').then(x => x.G3M3), import('./ladders/g3m3').then(x => x.G3M3_LADDERS)),
  g3m4: () => both(import('./content/g3m4').then(x => x.G3M4), import('./ladders/g3m4').then(x => x.G3M4_LADDERS)),
  g3m5: () => both(import('./content/g3m5').then(x => x.G3M5), import('./ladders/g3m5').then(x => x.G3M5_LADDERS)),
  g3m6: () => both(import('./content/g3m6').then(x => x.G3M6), import('./ladders/g3m6').then(x => x.G3M6_LADDERS)),
  g4m1: () => both(import('./content/g4m1').then(x => x.G4M1), import('./ladders/g4m1').then(x => x.G4M1_LADDERS)),
  g4m2: () => both(import('./content/g4m2').then(x => x.G4M2), import('./ladders/g4m2').then(x => x.G4M2_LADDERS)),
  g4m3: () => both(import('./content/g4m3').then(x => x.G4M3), import('./ladders/g4m3').then(x => x.G4M3_LADDERS)),
  g4m4: () => both(import('./content/g4m4').then(x => x.G4M4), import('./ladders/g4m4').then(x => x.G4M4_LADDERS)),
  g4m5: () => both(import('./content/g4m5').then(x => x.G4M5), import('./ladders/g4m5').then(x => x.G4M5_LADDERS)),
  g4m6: () => both(import('./content/g4m6').then(x => x.G4M6), import('./ladders/g4m6').then(x => x.G4M6_LADDERS)),
  g5m1: () => both(import('./content/g5m1').then(x => x.G5M1), import('./ladders/g5m1').then(x => x.G5M1_LADDERS)),
  g5m2: () => both(import('./content/g5m2').then(x => x.G5M2), import('./ladders/g5m2').then(x => x.G5M2_LADDERS)),
  g5m3: () => both(import('./content/g5m3').then(x => x.G5M3), import('./ladders/g5m3').then(x => x.G5M3_LADDERS)),
  g5m4: () => both(import('./content/g5m4').then(x => x.G5M4), import('./ladders/g5m4').then(x => x.G5M4_LADDERS)),
  g5m5: () => both(import('./content/g5m5').then(x => x.G5M5), import('./ladders/g5m5').then(x => x.G5M5_LADDERS)),
  g5m6: () => both(import('./content/g5m6').then(x => x.G5M6), import('./ladders/g5m6').then(x => x.G5M6_LADDERS)),
  g6m1: () => both(import('./content/g6m1').then(x => x.G6M1), import('./ladders/g6m1').then(x => x.G6M1_LADDERS)),
  g6m2: () => both(import('./content/g6m2').then(x => x.G6M2), import('./ladders/g6m2').then(x => x.G6M2_LADDERS)),
  g6m3: () => both(import('./content/g6m3').then(x => x.G6M3), import('./ladders/g6m3').then(x => x.G6M3_LADDERS)),
  g6m4: () => both(import('./content/g6m4').then(x => x.G6M4), import('./ladders/g6m4').then(x => x.G6M4_LADDERS)),
  g6m5: () => both(import('./content/g6m5').then(x => x.G6M5), import('./ladders/g6m5').then(x => x.G6M5_LADDERS)),
  g6m6: () => both(import('./content/g6m6').then(x => x.G6M6), import('./ladders/g6m6').then(x => x.G6M6_LADDERS)),
  g6m7: () => both(import('./content/g6m7').then(x => x.G6M7), import('./ladders/g6m7').then(x => x.G6M7_LADDERS)),
  g7m1: () => both(import('./content/g7m1').then(x => x.G7M1), import('./ladders/g7m1').then(x => x.G7M1_LADDERS)),
  g7m2: () => both(import('./content/g7m2').then(x => x.G7M2), import('./ladders/g7m2').then(x => x.G7M2_LADDERS)),
  g7m3: () => both(import('./content/g7m3').then(x => x.G7M3), import('./ladders/g7m3').then(x => x.G7M3_LADDERS)),
  g7m4: () => both(import('./content/g7m4').then(x => x.G7M4), import('./ladders/g7m4').then(x => x.G7M4_LADDERS)),
  g7m5: () => both(import('./content/g7m5').then(x => x.G7M5), import('./ladders/g7m5').then(x => x.G7M5_LADDERS)),
  g8m1: () => both(import('./content/g8m1').then(x => x.G8M1), import('./ladders/g8m1').then(x => x.G8M1_LADDERS)),
  g8m2: () => both(import('./content/g8m2').then(x => x.G8M2), import('./ladders/g8m2').then(x => x.G8M2_LADDERS)),
  g8m3: () => both(import('./content/g8m3').then(x => x.G8M3), import('./ladders/g8m3').then(x => x.G8M3_LADDERS)),
  g8m4: () => both(import('./content/g8m4').then(x => x.G8M4), import('./ladders/g8m4').then(x => x.G8M4_LADDERS)),
  g8m5: () => both(import('./content/g8m5').then(x => x.G8M5), import('./ladders/g8m5').then(x => x.G8M5_LADDERS)),
  g8m6: () => both(import('./content/g8m6').then(x => x.G8M6), import('./ladders/g8m6').then(x => x.G8M6_LADDERS)),
}

/** One module, whole (every topic), with its ladders registered. Undefined for an id the catalogue does not have. */
export async function loadModule(id: string): Promise<Module | undefined> {
  const have = LOADED.get(id)
  if (have) return have
  const meta = CATALOGUE.find(m => m.id === id), load = LOADERS[id]
  if (!meta || !load) return undefined
  const { lessons, ladders } = await load()
  const whole: Module = { id, grade: meta.grade, n: meta.n, title: meta.title, lessons }
  remember(whole, ladders)
  return whole
}

/**
 * The module `id`, whole, once it has loaded (undefined until then, and for an unknown id). A module loaded before —
 * the one the child just left — is there on the first render.
 */
export function useModule(id: string | undefined): Module | undefined {
  const [got, setGot] = useState(() => (id ? LOADED.get(id) : undefined))
  useEffect(() => {
    let live = true
    if (id) void loadModule(id).then(m => { if (live) setGot(m) })
    return () => { live = false }
  }, [id])
  return got?.id === id ? got : id ? LOADED.get(id) : undefined
}

/**
 * A module's mixed practice: one problem from every topic — its last practice problem, the story one — interleaved
 * (first half and second half alternate) so the child has to work out which idea each problem needs, instead of
 * repeating the one before it.
 * ponytail: one problem per topic, fixed order. Add more per topic, or pick the child's weakest topics, when there is data.
 */
export function mixedPractice(m: Module): { problem: Problem; lesson: Lesson }[] {
  const items = m.lessons.map(lesson => ({ problem: lesson.practice[lesson.practice.length - 1].problem, lesson }))
  const half = Math.ceil(items.length / 2)
  return items.flatMap((_, i) => i < half ? [items[i], items[i + half]].filter(Boolean) : [])
}
