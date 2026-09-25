/**
 * BUG-08 (docs/review/LATENT-BUGS.md) — a boot where indexedDB.open() HANGS (the Safari case kv.ts's 2.5 s timer
 * exists for) writes to localStorage; the next boot where IndexedDB works used to read IndexedDB only, so what that
 * session wrote — including queued, not-yet-uploaded answers — was stranded and never read again.
 *
 * Property checked: on a boot where IndexedDB works, what a fallback boot left in localStorage under a kv key is
 * readable through kv; a queue is the union of both sides by item identity; a plain value IndexedDB already holds is
 * NOT replaced by the fallback copy (nothing is dated, so IndexedDB's copy wins); non-kv localStorage keys are left
 * alone. A minimal in-memory IndexedDB stand-in below (open / readonly cursor / readwrite put+delete), enough for kv.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

function fakeIDB(store: Map<string, string>, hang: boolean) {
  const later = (f: () => void) => setTimeout(f, 0)
  return {
    open() {
      const req: Record<string, unknown> = {}
      if (!hang) later(() => {
        const db = { transaction: () => {
          const tx: Record<string, unknown> = {}
          tx.objectStore = () => ({
            openCursor() {
              const cur: Record<string, unknown> = {}; const entries = [...store]; let i = 0
              const step = () => later(() => {
                if (i < entries.length) { const [k, v] = entries[i++]; cur.result = { key: k, value: v, continue: step }; (cur.onsuccess as () => void)() }
                else { cur.result = null; (cur.onsuccess as () => void)() }
              })
              step(); return cur
            },
            put(v: string, k: string) { store.set(k, v); later(() => (tx.oncomplete as () => void)?.()) },
            delete(k: string) { store.delete(k); later(() => (tx.oncomplete as () => void)?.()) },
          })
          return tx
        } }
        req.result = db; (req.onsuccess as () => void)?.()
      })
      return req
    },
  }
}

beforeEach(() => { localStorage.clear(); vi.resetModules() })
const tick = () => new Promise(r => setTimeout(r, 5))

async function boot(idb: Map<string, string>, hang: boolean) {
  vi.resetModules()
  vi.stubGlobal('indexedDB', fakeIDB(idb, hang))
  const { kv } = await import('@/infra/storage/kv')
  await kv.ready()
  return kv
}

/** An ordinary day (sets the migrated flag, holds `seed` in IndexedDB), then a hung boot that writes `hung`. */
async function hungDay(idb: Map<string, string>, seed: Record<string, string>, hung: Record<string, string>) {
  const a = await boot(idb, false)
  a.set('milo-newflow-done-device-x', '1')
  for (const [k, v] of Object.entries(seed)) a.set(k, v)
  await tick()
  const s = await boot(idb, true)
  expect(s.mode(), 'the hang did not happen, so this test is not testing the fallback').toBe('local')
  for (const [k, v] of Object.entries(hung)) s.set(k, v)
}

describe('BUG-08 a hung-IndexedDB boot must not orphan what it wrote', () => {
  it('POSITIVE CONTROL: a working boot writes to IndexedDB and the next boot reads it back', async () => {
    const idb = new Map<string, string>()
    const a = await boot(idb, false); a.set('milo-lesson-sync-queue', '[{"id":"q1"}]'); await tick()
    const b = await boot(idb, false)
    expect(b.mode()).toBe('idb')
    expect(b.get('milo-lesson-sync-queue')).toBe('[{"id":"q1"}]')
  })

  it('an offline answer queued during a fallback boot is there on the next normal boot, and in IndexedDB', async () => {
    const idb = new Map<string, string>()
    await hungDay(idb, {}, { 'milo-lesson-sync-queue': '[{"id":"offline-answer","learnerId":"L","lessonId":"g3m1-t1"}]' })
    const n = await boot(idb, false)
    expect(n.get('milo-lesson-sync-queue')).toBe('[{"id":"offline-answer","learnerId":"L","lessonId":"g3m1-t1"}]')
    await tick()
    expect(idb.get('milo-lesson-sync-queue')).toBe('[{"id":"offline-answer","learnerId":"L","lessonId":"g3m1-t1"}]')
    expect(localStorage.getItem('milo-lesson-sync-queue'), 'merged once, then cleared from localStorage').toBeNull()
  }, 10_000)

  it('a queue on both sides is the union by item identity — nothing dropped, nothing doubled', async () => {
    const idb = new Map<string, string>()
    await hungDay(idb,
      { 'milo-lesson-sync-queue': '[{"id":"a"},{"id":"b"}]', milo_events_queue: '[{"client_id":"e1"}]' },
      { 'milo-lesson-sync-queue': '[{"id":"b"},{"id":"c"}]', milo_events_queue: '[{"client_id":"e1"},{"client_id":"e2"}]' })
    const n = await boot(idb, false)
    expect(JSON.parse(n.get('milo-lesson-sync-queue')!)).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
    expect(JSON.parse(n.get('milo_events_queue')!)).toEqual([{ client_id: 'e1' }, { client_id: 'e2' }])
  }, 10_000)

  it('CONTROL: a plain value IndexedDB already holds is not replaced by the fallback copy', async () => {
    const idb = new Map<string, string>()
    await hungDay(idb,
      { 'milo-newflow-standing-L-g3m1-t1': '{"level":3,"streak":0,"mastered":true}' },
      { 'milo-newflow-standing-L-g3m1-t1': '{"level":0,"streak":1,"mastered":false}' })
    const n = await boot(idb, false)
    expect(n.get('milo-newflow-standing-L-g3m1-t1')).toBe('{"level":3,"streak":0,"mastered":true}')
  }, 10_000)

  it('CONTROL: localStorage keys that are not kv keys are neither pulled in nor cleared', async () => {
    const idb = new Map<string, string>()
    await hungDay(idb, {}, {})
    localStorage.setItem('milo-auth', 'session'); localStorage.setItem('al-text-size', 'xl')
    localStorage.setItem('milo_active_plan_L', '{}'); localStorage.setItem('milo-pwa-dismissed', '1')
    const n = await boot(idb, false); await tick()
    for (const k of ['milo-auth', 'al-text-size', 'milo_active_plan_L', 'milo-pwa-dismissed']) {
      expect(n.get(k), k).toBeNull()
      expect(localStorage.getItem(k), k).not.toBeNull()
    }
  }, 10_000)

  it('every key a kv caller writes is merged back after a hung boot', async () => {
    // The keys are read from the files that call kv.set, so a NEW kv key is covered the day it is added.
    const files = [
      ...readdirSync('src/infra/storage').map(f => join('src/infra/storage', f)),
      'src/infra/analytics.ts',
    ].filter(f => f.endsWith('.ts') && /\bkv\.set\(/.test(readFileSync(f, 'utf8')))
    const keys: string[] = []
    for (const f of files) {
      const src = readFileSync(f, 'utf8')
      const found = [
        ...[...src.matchAll(/const (?:KEY|QUEUE|QUEUE_KEY) = '([^']+)'/g)].map(m => m[1]),
        ...[...src.matchAll(/const key = \([^)]*\) =>\s*`([^`$]+)\$\{/g)].map(m => `${m[1]}zz`),
      ]
      expect(found.length, `${f} calls kv.set but no key definition was recognised in it`).toBeGreaterThan(0)
      keys.push(...found)
    }
    // Positive control: the scan sees keys we know exist (written out by hand, not derived).
    expect(keys).toEqual(expect.arrayContaining(['milo-lesson-sync-queue', 'milo_events_queue', 'milo-newflow-standing-zz', 'milo-newflow-run-zz']))
    // 15 on main at 06cee602; #250 (ARC-16) deletes two dead files that wrote kv keys, leaving 11. The floor guards the
    // scan against going blind, not the exact count — the hand-written keys above are the sharper control.
    expect(keys.length).toBeGreaterThanOrEqual(10)

    const idb = new Map<string, string>()
    await hungDay(idb, {}, Object.fromEntries(keys.map(k => [k, '"v"'])))
    const n = await boot(idb, false)
    expect(keys.filter(k => n.get(k) !== '"v"'), 'kv keys still stranded in localStorage').toEqual([])
  }, 10_000)
})
