/**
 * Drawn backdrops (public/assets/lessons/<scene>.webp). A scene with no file renders a blank stage with no error
 * anywhere, so the file's existence is checked here. Grade 5's count is written out: every topic's Screen 1 has one.
 */
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MODULES } from '@/features/lessons/modules'

const scenes = MODULES.flatMap(m => m.lessons.flatMap(l => l.screens.map((s, i) => ({ lesson: l.id, screen: i + 1, scene: s.scene }))))
  .filter(x => x.scene)

describe('lesson backdrops', () => {
  it('every scene a lesson names has its image file', () => {
    expect(scenes.length, 'no scenes found — the check would be looking at nothing').toBeGreaterThan(0)
    const missing = scenes.filter(x => !existsSync(`public/assets/lessons/${x.scene}.webp`))
    expect(missing).toEqual([])
  })

  it('every Grade 5 topic has its own backdrop on Screen 1', () => {
    const g5 = MODULES.filter(m => m.grade === 5).flatMap(m => m.lessons)
    expect(g5.length).toBe(58)   // Module 1 re-split 8 → 20 topics on 2026-09-15
    expect(g5.filter(l => l.screens[0].scene !== l.id).map(l => l.id)).toEqual([])
  })
})
