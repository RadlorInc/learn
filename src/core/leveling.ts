/**
 * Leveling domain — pure XP → level math. No React, no state, no persistence.
 * The store re-exports these so `@/state/store` import sites keep working.
 */
const LEVEL_THRESHOLDS = [0, 500, 1200, 2500, 4500, 7000, 10000, 14000]
const LEVEL_NAMES = [
  'Beginner', 'Counter', 'Explorer', 'Number Star',
  'Math Wizard', 'Champion', "Milo's Champion", 'Legend',
]

export function getLevelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}
export function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)]
}
export function getNextLevelXP(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)]
}
export function getLevelProgress(xp: number, level: number): number {
  const start = LEVEL_THRESHOLDS[level - 1] ?? 0
  const end   = getNextLevelXP(level)
  if (end <= start) return 1
  return Math.min(1, (xp - start) / (end - start))
}
