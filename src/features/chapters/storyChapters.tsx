/**
 * Every 3–11 story experience: its backdrop, and where the experience lives.
 *
 * TWO consumers, which is why this is a table rather than 33 imports in each of them:
 *   • registry.tsx wraps each one in the chapter portal (progress sync + celebration);
 *   • /story renders the SAME experience bare, which is how the whole band is verified.
 * That second list used to be a hand-maintained copy of all 33 dynamic imports, so moving
 * a chapter meant repointing two files and nothing caught you for only doing one.
 *
 * ⚠️ Its own module, not part of registry.tsx, deliberately: registry pulls in ChapterPortal
 * for the teen wrapper, which statically imports the Supabase client — and /story is a public
 * preview route that has no business shipping that. A type-only import erases at compile time,
 * so nothing here reaches the bundle but the loaders themselves.
 */
import type { StoryInner, StoryProps } from '@/features/chapters/ChapterPortal'

export type StoryLoad = () => Promise<{ default: StoryInner }>

/** Bind fixed props onto a story experience. BlockYard is ONE component run as two
 *  chapters (add / subtract to 100), which is the only thing this is for. */
const withProps = <P,>(load: () => Promise<{ default: React.ComponentType<StoryProps & P> }>, extra: P): StoryLoad =>
  () => load().then(m => { const Inner = m.default; return { default: (p: StoryProps) => <Inner {...p} {...extra} /> } })

export const STORY_CHAPTERS = {
  addition: { bg: "#dff0c8", load: () => import("@/features/chapters/story/PlayTime") },
  additionTo100: { bg: "#dbe8ef", load: withProps(() => import("@/features/chapters/story/BlockYard"), { op: "+" as const }) },
  bigNumbers: { bg: "#a99a86", load: () => import("@/features/chapters/story/OrderDesk") },
  colors: { bg: "#e6f0f7", load: () => import("@/features/chapters/story/RainbowTown") },
  compareNumbers: { bg: "#cfe6f7", load: () => import("@/features/chapters/story/SeesawPark") },
  fractions: { bg: "#f3ead8", load: () => import("@/features/chapters/story/SliceShop") },
  matchingQuantities: { bg: "#241c39", load: () => import("@/features/chapters/story/HomeTime") },
  measurement: { bg: "#cfe9f7", load: () => import("@/features/chapters/story/MeasureIt") },
  money: { bg: "#f3ead8", load: () => import("@/features/chapters/story/CoinShop") },
  multiplication: { bg: "#f3ead8", load: () => import("@/features/chapters/story/MarketDay") },
  numberComparison: { bg: "#dff0c8", load: () => import("@/features/chapters/story/BigOrSmall") },
  numberRecognition: { bg: "#241c39", load: () => import("@/features/chapters/story/NestTree") },
  numberOrdering: { bg: "#bfe6f7", load: () => import("@/features/chapters/story/FollowTheLeader") },
  numbersTo100: { bg: "#cfe6f7", load: () => import("@/features/chapters/story/NumberTown") },
  patterns: { bg: "#fff3e2", load: () => import("@/features/chapters/story/BeadShop") },
  placeValue: { bg: "#cfe6f7", load: () => import("@/features/chapters/story/BuildingBlocks") },
  rounding: { bg: "#9fae9a", load: () => import("@/features/chapters/story/LevelRun") },
  shapes: { bg: "#dff0e4", load: () => import("@/features/chapters/story/ShapeTown") },
  shapes2d3d: { bg: "#efe6d8", load: () => import("@/features/chapters/story/ShapeStudio") },
  skipCounting: { bg: "#dcecdb", load: () => import("@/features/chapters/story/HopAlong") },
  storyProblems: { bg: "#f3ead8", load: () => import("@/features/chapters/story/StoryTime") },
  subtraction: { bg: "#bfe7ff", load: () => import("@/features/chapters/story/PlayTimeSub") },
  subtractionTo100: { bg: "#dbe8ef", load: withProps(() => import("@/features/chapters/story/BlockYard"), { op: "-" as const }) },
  time: { bg: "#f3ead8", load: () => import("@/features/chapters/story/TickTock") },
} satisfies Record<string, { bg: string; load: StoryLoad }>

export type StorySkill = keyof typeof STORY_CHAPTERS
