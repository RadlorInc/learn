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

/** The game, full page, for this child until `until` (ms). It saves under `localSaveKey` and comes back to /play. */
export const gameUrl = (learnerId: string, until: number) =>
  `/blockcraft/index.html?key=${encodeURIComponent(localSaveKey(learnerId))}&until=${until}`

/**
 * Puts the newest save on this device (the game reads only this device) and opens the game. 'unreachable' = nothing
 * opened: the account could not be read and this device has no copy, so a new world would overwrite the real one.
 */
export async function openGame(learnerId: string, until: number): Promise<'unreachable' | void> {
  const save = await loadGameSave(learnerId)
  if (save === 'unreachable') return save
  try { if (save) localStorage.setItem(localSaveKey(learnerId), JSON.stringify(save)) } catch { /* full: the game starts from what is there */ }
  location.assign(gameUrl(learnerId, until))
}
