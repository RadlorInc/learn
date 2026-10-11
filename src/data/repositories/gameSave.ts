'use client'

/**
 * The /play game's save, on the child's account (migration 20261001170000), so the game carries on where it stopped —
 * when game time ran out, when the tab closed, or on another device. Founder's call, 2026-09-19.
 *
 * Two copies, newest wins (`savedAt`, written by the game): the account's row, and one on this device that the game
 * itself writes on every save — including the last one as the tab closes, which there is no time to upload. The next
 * visit finds the device copy newer and uploads it.
 */
import { db } from '@/data/repositories/_shared'

export type GameSave = { savedAt?: number } & Record<string, unknown>

/** The device copy's key. The game writes it too (it is handed this key), so a second child on the same device has their own. */
export const localSaveKey = (learnerId: string) => `blockcraft.save.${learnerId}`

function readLocal(learnerId: string): GameSave | null {
  try { const s = localStorage.getItem(localSaveKey(learnerId)); return s ? JSON.parse(s) : null } catch { return null }
}

export async function uploadGameSave(learnerId: string, data: GameSave): Promise<boolean> {
  try {
    const { error } = await db().from('game_saves').upsert({ learner_id: learnerId, data }, { onConflict: 'learner_id' })
    return !error
  } catch { return false }
}

/**
 * The save to start the game from: the newer of the account's and this device's. null = a new world.
 * 'unreachable' = the account could not be read and this device has no copy — do NOT start a new world then: its
 * first save would be newer than the account's real one and replace it.
 */
export async function loadGameSave(learnerId: string): Promise<GameSave | null | 'unreachable'> {
  const local = readLocal(learnerId)
  let remote: GameSave | null = null, reached = false
  try {
    const { data, error } = await db().from('game_saves').select('data').eq('learner_id', learnerId).maybeSingle()
    // PGRST205: the table is not in this database yet — nothing to lose, play from the device copy.
    reached = !error || error.code === 'PGRST205'
    remote = (data as { data: GameSave } | null)?.data ?? null
  } catch { /* offline */ }
  if (!reached && !local) return 'unreachable'
  if (local && (local.savedAt ?? 0) > (remote?.savedAt ?? 0)) {
    void uploadGameSave(learnerId, local)
    return local
  }
  return remote
}

/** The games /play can open with the same paid time. */
export type GameId = 'blockcraft' | 'beathop'

/** BeatHop's save (levels, stars, gems, hat) stays on this device: `game_saves` holds one save per child, BlockCraft's.
 *  ponytail: a child on a second device starts BeatHop at level 1; a `game` column on game_saves (a migration) fixes it.
 *  ⚠️ Both games' device keys (`blockcraft.save.<child id>`, `beathop.save.<child id>`) are NOT in doc 08's storage table
 *  and NOT swept by sign-out (`CHILD_KEY` in lessonSync.ts) — BlockCraft's since it shipped (found 11 Oct). Sweeping
 *  BeatHop's would delete its only copy, so the account save comes first, then the sweep and the doc 08 rows. */
export const beatHopSaveKey = (learnerId: string) => `beathop.save.${learnerId}`

/** The game, full page, for this child until `until` (ms). It saves under its key and comes back to /play. */
export const gameUrl = (learnerId: string, until: number, game: GameId = 'blockcraft') =>
  game === 'beathop'
    ? `/beathop/index.html?key=${encodeURIComponent(beatHopSaveKey(learnerId))}&until=${until}`
    : `/blockcraft/index.html?key=${encodeURIComponent(localSaveKey(learnerId))}&until=${until}`

/**
 * Opens the game. For BlockCraft it first puts the newest save on this device (the game reads only this device);
 * 'unreachable' = nothing opened: the account could not be read and this device has no copy, so a new world would
 * overwrite the real one. BeatHop's save is only on this device, so it opens at once.
 */
export async function openGame(learnerId: string, until: number, game: GameId = 'blockcraft'): Promise<'unreachable' | void> {
  if (game === 'beathop') return location.assign(gameUrl(learnerId, until, game))
  const save = await loadGameSave(learnerId)
  if (save === 'unreachable') return save
  try { if (save) localStorage.setItem(localSaveKey(learnerId), JSON.stringify(save)) } catch { /* full: the game starts from what is there */ }
  location.assign(gameUrl(learnerId, until))
}
