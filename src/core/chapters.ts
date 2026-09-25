/**
 * Single source of truth for chapters.
 *
 * Every surface (menu, chapter picker, parent dashboard, game) derives its
 * chapter list and metadata from the CHAPTERS array below — there are no more
 * copies scattered across files.
 *
 *   • Adding a chapter      → add one entry here (+ wire its component in
 *                             src/app/game/page.tsx and its lesson in
 *                             src/lib/lessons.tsx).
 *   • Adding an age group   → tag the relevant entries with its key in
 *                             `ageGroups`, then add the key to AgeGroup.
 *
 * This file holds DATA only (no React imports) so it stays cheap to import
 * from any page.
 */

/**
 * ⚠️ SIX BANDS, TWO OF WHICH HAVE CHAPTERS. This is the domain of `learners.age_group` /
 * `grades.age_group` — a live database column with a CHECK constraint and real rows in every
 * band (a Grade 3–8 class child is written '9-11' or '12-14' by `Classes.tsx`). Chapters for
 * 9–11 upward were deleted 2026-09-20; the COLUMN was not, so narrowing this type would break
 * writes that the database still accepts. `chaptersForAge` simply returns [] for those bands.
 */
export type AgeGroup = '3-5' | '6-8' | '9-11' | '12-14' | '15-16' | '17-18'

export type ChapterType =
  // 3–5
  | 'counting' | 'numberOrdering' | 'numberRecognition'
  | 'matchingQuantities' | 'numberComparison' | 'shapes'
  | 'colors' | 'patterns' | 'addition' | 'subtraction' | 'measurement'
  // 6–8
  | 'numbersTo100' | 'placeValue' | 'skipCounting' | 'storyProblems' | 'multiplication' | 'fractions' | 'money' | 'time'
  | 'compareNumbers' | 'additionTo100' | 'subtractionTo100' | 'shapes2d3d'

export interface ChapterMeta {
  id:          ChapterType
  name:        string        // full display name (menu + picker)
  parentLabel: string        // shorter label for the parent dashboard
  emoji:       string        // chapter icon
  asset:       string        // image on the menu "next up" card
  hint:        string        // one-line hint in the chapter picker
  ageGroups:   AgeGroup[]    // which age groups this chapter belongs to
}

/**
 * Ordered list. Array order IS the play order (was CHAPTER_ORDER).
 * All current chapters belong to the 3–5 group.
 */
export const CHAPTERS: ChapterMeta[] = [
  { id: 'counting',           name: 'Counting',           parentLabel: 'Counting',          emoji: '🌟', asset: '/assets/objects/firefly.png',        hint: 'Tap each one to count!',     ageGroups: ['3-5'] },
  { id: 'numberOrdering',     name: 'Number Order',       parentLabel: 'Number Order',      emoji: '🔢', asset: '/assets/objects/star.png',           hint: 'Put numbers in order!',      ageGroups: ['3-5'] },
  { id: 'numberRecognition',  name: 'Nest Tree',          parentLabel: 'Nest Tree',         emoji: '🐣', asset: '/assets/objects/nest_side.png',      hint: 'Feed the nest you hear!',  ageGroups: ['3-5'] },
  { id: 'matchingQuantities', name: 'Home Time',          parentLabel: 'Home Time',         emoji: '🏡', asset: '/assets/objects/rabbit_side.png',    hint: 'Send exactly how many are asked for!', ageGroups: ['3-5'] },
  { id: 'numberComparison',   name: 'Bigger or Smaller',  parentLabel: 'Bigger or Smaller', emoji: '⚖️', asset: '/assets/objects/squirrel_side.png',  hint: 'Which bunch has more?',      ageGroups: ['3-5'] },
  { id: 'shapes',             name: 'Shape House',        parentLabel: 'Shape House',       emoji: '🏠', asset: '/assets/shapes/house-complete.png',  hint: "Tap the shape that fits the empty hole!",        ageGroups: ['3-5'] },
  { id: 'colors',             name: 'Rainbow Town',       parentLabel: 'Rainbow Town',      emoji: '🌈', asset: '/assets/objects/flower-red.png',     hint: 'Tap the color you hear!', ageGroups: ['3-5'] },
  { id: 'patterns',           name: 'Bead Shop',          parentLabel: 'Bead Shop',         emoji: '📿', asset: '/assets/objects/star.png',           hint: 'Tap the bead that comes next!', ageGroups: ['3-5'] },
  { id: 'addition',           name: 'Play Time',          parentLabel: 'Addition',          emoji: '🎈', asset: '/assets/objects/rabbit_side.png',    hint: 'More friends come to play!', ageGroups: ['3-5'] },
  { id: 'subtraction',        name: 'Time to Go',         parentLabel: 'Subtraction',       emoji: '👋', asset: '/assets/objects/fish_side.png',      hint: 'How many are left?',         ageGroups: ['3-5'] },
  { id: 'measurement',        name: 'Measuring',          parentLabel: 'Measuring',       emoji: '📏', asset: '/assets/objects/star.png',           hint: 'Lay blocks, then tap Done!', ageGroups: ['3-5'] },

  // ── 6–8 ──
  { id: 'numbersTo100',       name: 'Numbers to 100',     parentLabel: 'Numbers to 100',    emoji: '💯', asset: '/assets/objects/star.png',           hint: 'Read big numbers up to 100!', ageGroups: ['6-8'] },
  { id: 'placeValue',         name: 'Tens & Ones',        parentLabel: 'Tens & Ones',       emoji: '🧱', asset: '/assets/objects/star.png',           hint: 'Tens and ones make a number!', ageGroups: ['6-8'] },
  { id: 'skipCounting',       name: 'Skip Counting',      parentLabel: 'Skip Counting',     emoji: '🐰', asset: '/assets/objects/star.png',           hint: 'Count by 2s, 5s and 10s!', ageGroups: ['6-8'] },
  { id: 'storyProblems',      name: 'Story Problems',     parentLabel: 'Story Problems',    emoji: '📖', asset: '/assets/objects/apple.png',          hint: 'Listen, then add or take away!', ageGroups: ['6-8'] },
  { id: 'multiplication',     name: 'Multiplication',     parentLabel: 'Multiplication',    emoji: '✖️', asset: '/assets/objects/star.png',           hint: 'Equal groups make multiplying!', ageGroups: ['6-8'] },
  { id: 'fractions',          name: 'Fractions',          parentLabel: 'Fractions',         emoji: '🍕', asset: '/assets/objects/apple.png',          hint: 'Halves, thirds and quarters!', ageGroups: ['6-8'] },
  { id: 'money',              name: 'Money',              parentLabel: 'Money',             emoji: '🪙', asset: '/assets/objects/star.png',           hint: 'Count the coins!', ageGroups: ['6-8'] },
  { id: 'time',               name: 'Time',               parentLabel: 'Time',              emoji: '🕐', asset: '/assets/objects/star.png',           hint: 'Read the clock!', ageGroups: ['6-8'] },
  { id: 'compareNumbers',     name: 'Compare Numbers',    parentLabel: 'Compare Numbers',   emoji: '⚖️', asset: '/assets/objects/star-alt.png',       hint: 'Bigger, smaller or equal?', ageGroups: ['6-8'] },
  { id: 'additionTo100',      name: 'Add to 100',         parentLabel: 'Add to 100',        emoji: '➕', asset: '/assets/objects/apple.png',          hint: 'Add two-digit numbers!', ageGroups: ['6-8'] },
  { id: 'subtractionTo100',   name: 'Subtract to 100',    parentLabel: 'Subtract to 100',   emoji: '➖', asset: '/assets/objects/firefly.png',        hint: 'Subtract two-digit numbers!', ageGroups: ['6-8'] },
  { id: 'shapes2d3d',         name: 'Shapes 2D & 3D',     parentLabel: 'Shapes 2D & 3D',    emoji: '🔷', asset: '/assets/shapes/house-complete.png',  hint: 'Name shapes and count sides!', ageGroups: ['6-8'] },

]

/**
 * ⚠️ NEW TEACHING FLOW — founder's call, 2026-09-13: every chapter above is hidden while the
 * new-flow lessons are built, and will be deleted later. Hidden = absent from every LIST
 * (`chaptersForAge`, `CHAPTER_ORDER`) and refused at play (`GuardedChapter`, `/game`, `/story`).
 * `CHAPTER_IDS` / `CHAPTER_NAMES` stay complete so saved stars, past sessions and /admin still
 * resolve. Flip to `false` to bring every chapter back.
 */
export const LEGACY_CHAPTERS_HIDDEN = true
export const isChapterVisible = (_id: string): boolean => !LEGACY_CHAPTERS_HIDDEN
const VISIBLE = CHAPTERS.filter(c => isChapterVisible(c.id))

// ── Lookups ──────────────────────────────────────────────────────────────
const BY_ID: Record<ChapterType, ChapterMeta> =
  Object.fromEntries(CHAPTERS.map(c => [c.id, c])) as Record<ChapterType, ChapterMeta>

export const CHAPTER_IDS: ChapterType[] = CHAPTERS.map(c => c.id)

export function getChapter(id: ChapterType): ChapterMeta {
  return BY_ID[id]
}

/** Chapters belonging to an age group, in play order. */
export function chaptersForAge(age: AgeGroup): ChapterMeta[] {
  return VISIBLE.filter(c => c.ageGroups.includes(age))
}

/**
 * THE PLAN FOR A CHILD WE HAVE NOT DIAGNOSED — the band's chapters, in curriculum order, from the
 * beginning.
 *
 * ⚠️ A PLAN ALWAYS EXISTS. It is the product's shape: every other maths app hands a parent 72
 * chapters and calls it choice. Skipping the check (or finishing it with no gap found) buys a LESS
 * INFORMED plan, never no plan — and `advanceAfterChapter`'s play-data revision then refines it
 * from real gameplay, so a skipped check self-corrects slowly rather than not at all.
 *
 * ⚠️ It must also stay compatible with the free tier: the first two unmet steps are entitled, so a
 * family that skipped does not hit a wall the diagnosed family avoids.
 */
export const gradeStartPlan = (age: AgeGroup): ChapterType[] => chaptersForAge(age).map(c => c.id)

// ── Back-compat derived maps (so existing imports keep working) ────────────
export const CHAPTER_ORDER: ChapterType[] = VISIBLE.map(c => c.id)

export const CHAPTER_NAMES = Object.fromEntries(
  CHAPTERS.map(c => [c.id, c.name]),
) as Record<ChapterType, string>

export const CHAPTER_EMOJIS = Object.fromEntries(
  CHAPTERS.map(c => [c.id, c.emoji]),
) as Record<ChapterType, string>

/**
 * A chapter's id in `lesson_progress` / `point_events`.
 *
 * ⚠️ THE `c:` PREFIX IS THE WHOLE POINT. Since 2026-09-20 a chapter records progress through the
 * SAME table and the SAME RPC as a new-flow topic, so the two id namespaces share one column — and
 * `c:` is what keeps a chapter out of every "how is this child doing on Grade 5 Module 1" read.
 * The database enforces both shapes (migration 20260920151900); a second column would be one more
 * thing every query has to remember to filter on.
 */
export const chapterKey = (id: ChapterType | string): string => `c:${id}`
