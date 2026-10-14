/**
 * Which save the game starts from (src/data/repositories/gameSave.ts): the newer of the account's and this device's,
 * and — the case that loses a child's world if it is wrong — never a NEW world when the account could not be read.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

let reply: { data: unknown; error: { code?: string } | null } | 'throw'
const upserts: unknown[] = []
vi.mock('@/data/repositories/_shared', () => ({
  db: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => { if (reply === 'throw') throw new Error('offline'); return reply } }) }),
      upsert: async (row: unknown) => { upserts.push(row); return { error: null } },
    }),
  }),
}))
import { loadGameSave, localSaveKey } from '@/data/repositories/gameSave'

const onDevice = (save: object | null) => save ? localStorage.setItem(localSaveKey('kid'), JSON.stringify(save)) : localStorage.removeItem(localSaveKey('kid'))
beforeEach(() => { upserts.length = 0; onDevice(null) })

describe('the save the game starts from', () => {
  it('the account\'s save, when it is the newer one', async () => {
    reply = { data: { data: { savedAt: 20, w: 'account' } }, error: null }
    onDevice({ savedAt: 10, w: 'device' })
    expect(await loadGameSave('kid')).toEqual({ savedAt: 20, w: 'account' })
    expect(upserts).toEqual([])
  })

  it('this device\'s save when it is newer (the tab closed before it uploaded) — and it is uploaded now', async () => {
    reply = { data: { data: { savedAt: 10, w: 'account' } }, error: null }
    onDevice({ savedAt: 20, w: 'device' })
    expect(await loadGameSave('kid')).toEqual({ savedAt: 20, w: 'device' })
    expect(upserts).toEqual([{ learner_id: 'kid', data: { savedAt: 20, w: 'device' } }])
  })

  it('a new world (null) only when the account really has none', async () => {
    reply = { data: null, error: null }
    expect(await loadGameSave('kid')).toBeNull()
    reply = { data: null, error: { code: 'PGRST205' } }          // the table is not in this database yet
    expect(await loadGameSave('kid')).toBeNull()
  })

  it('offline or refused, with nothing on this device: unreachable — NOT a new world', async () => {
    reply = 'throw'
    expect(await loadGameSave('kid')).toBe('unreachable')
    reply = { data: null, error: { code: '42501' } }
    expect(await loadGameSave('kid')).toBe('unreachable')
  })

  it('offline with a copy on this device: plays that copy', async () => {
    reply = 'throw'
    onDevice({ savedAt: 7, w: 'device' })
    expect(await loadGameSave('kid')).toEqual({ savedAt: 7, w: 'device' })
  })
})
