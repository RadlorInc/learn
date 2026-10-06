/**
 * EVERY KG–2 PLAY CARD HAS ITS PICTURE. ModuleHome's `CardArt` falls back to the emoji when the file fails to load, so a
 * missing or misnamed file would ship silently as an emoji card. This asks the file system, for each chapter by hand.
 */
import { it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CHAPTERS } from '@/core/chapters'

it('every chapter points at its own card picture, and the file is there', () => {
  expect(CHAPTERS.length).toBe(23)   // positive control: the list being read is the real one
  const missing = CHAPTERS.filter(c => c.asset !== `/assets/cards/${c.id}.png` || !existsSync(join('public', c.asset)))
  expect(missing.map(c => `${c.id} → ${c.asset}`)).toEqual([])
})
