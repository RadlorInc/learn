'use client'
/**
 * kv — local key/value store backed by IndexedDB.
 *
 * The app is local-first and reads its profile synchronously (e.g. loadLearner
 * swaps learners instantly), but IndexedDB is async-only. So at boot we hydrate
 * an in-memory Map from IndexedDB once, then serve reads synchronously from the
 * Map and persist writes to IndexedDB asynchronously (non-blocking, large quota).
 *
 * Callers must await `kv.ready()` before the first read — StorageGate gates the
 * UI on it, and the Zustand store rehydrates after it. SSR and browsers without
 * IndexedDB fall back to localStorage so behavior degrades gracefully.
 *
 * NOT moved here on purpose: Supabase auth (`milo-auth`, managed by supabase-js
 * in localStorage) and the active learner (`milo_active_learner`, sessionStorage
 * by design — per-tab, cleared on sign-out).
 */

const DB_NAME = 'milo'
const STORE = 'kv'
const MIGRATED_FLAG = 'milo-kv-migrated'
// Gameplay keys to lift out of localStorage on first run so existing players
// (especially anything queued offline) don't lose local state.
const MIGRATE_PREFIXES = ['milo-profile', 'milo-last-played', 'milo_offline_queue']
// Every key the app keeps in kv (src/infra/storage/*.ts, src/infra/analytics.ts). A boot where IndexedDB hangs writes
// these to localStorage instead; the next boot where IndexedDB works folds them back in (`mergeFallback`). Other
// localStorage keys (`milo-auth`, `al-text-size`, `milo-pwa-dismissed`, …) are NOT kv and must never be pulled in.
// ⚠️ A new kv key missing here goes back to being lost after a hung boot — kvFallbackMerge.test.ts checks the list.
const KV_PREFIXES = [
  'milo-newflow-done-', 'milo-newflow-standing-', 'milo-newflow-run-', 'milo-lesson-', 'milo-nudge-', 'milo-chres-',
  'milo-last-played-', 'milo-demo-run', 'milo-voice', 'milo-hand-input', 'milo-speech-rate', 'milo_recent_errors',
  'milo_lead_email', 'milo_events_queue',
]
// Queues are merged by item identity; a queued item is never dropped for being on the "wrong" side.
const QUEUE_IDS: Record<string, string> = { 'milo-lesson-sync-queue': 'id', milo_events_queue: 'client_id' }

/** Folds what a localStorage-fallback boot wrote back into IndexedDB, then clears it from localStorage so it is
 *  merged once. Nothing is dated, so for a plain value IndexedDB's copy wins and only a key IndexedDB lacks is added;
 *  a queue is the union of both, by item identity. */
function mergeFallback(): void {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && KV_PREFIXES.some(p => k.startsWith(p))) keys.push(k)
  }
  for (const k of keys) {
    const v = localStorage.getItem(k)
    if (v == null) continue
    const idField = QUEUE_IDS[k]
    let next: string | null = null
    if (!mem.has(k)) next = v
    else if (idField) {
      try {
        const a = JSON.parse(mem.get(k)!) as Record<string, unknown>[]
        const b = JSON.parse(v) as Record<string, unknown>[]
        const seen = new Set(a.map(x => x[idField]))
        const extra = b.filter(x => !seen.has(x[idField]))
        if (extra.length) next = JSON.stringify([...a, ...extra])
      } catch { /* an unreadable side: keep IndexedDB's */ }
    }
    // Cleared only once IndexedDB holds it: a failed write leaves it to be merged on the next boot.
    const clear = () => safeLS(() => localStorage.removeItem(k), undefined)
    if (next == null) clear()
    else { mem.set(k, next); idbWrite('put', k, next).then(clear, () => {}) }
  }
}

let mem = new Map<string, string>()
let useFallback = false
let resolveReady: () => void
const readyPromise = new Promise<void>((r) => { resolveReady = r })

let dbPromise: Promise<IDBDatabase> | null = null
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let req: IDBOpenDBRequest
    try { req = indexedDB.open(DB_NAME, 1) } catch (e) { reject(e); return }  // Safari private mode can throw here
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('indexedDB blocked'))
  })
}
function db(): Promise<IDBDatabase> { return (dbPromise ??= openDB()) }

function idbWrite(mode: 'put' | 'delete', key: string, value?: string): Promise<void> {
  return db().then(d => new Promise<void>((resolve, reject) => {
    const tx = d.transaction(STORE, 'readwrite')
    const os = tx.objectStore(STORE)
    if (mode === 'put') os.put(value, key); else os.delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  }))
}

function safeLS<T>(fn: () => T, fallback: T): T {
  try { return fn() } catch { return fallback }
}

async function hydrate(): Promise<void> {
  if (typeof indexedDB === 'undefined') { useFallback = true; resolveReady(); return }
  // Safari (first load in a session, private browsing, or strict storage settings)
  // can leave indexedDB.open() HANGING — it fires neither success nor error. That
  // would freeze the whole app on the splash forever, since resolveReady() waits on
  // the await below. Cap the wait: if IDB hasn't hydrated in time, fall back to
  // localStorage and boot anyway. (A synchronous throw or a rejection is already
  // handled by the try/catch; this timer is specifically for the silent hang.)
  let settled = false
  const finish = () => { if (!settled) { settled = true; resolveReady() } }
  const timer = setTimeout(() => { useFallback = true; finish() }, 2500)
  try {
    const d = await db()
    const entries = await new Promise<[string, string][]>((resolve, reject) => {
      const out: [string, string][] = []
      const cur = d.transaction(STORE, 'readonly').objectStore(STORE).openCursor()
      cur.onsuccess = () => {
        const c = cur.result
        if (c) { out.push([String(c.key), c.value as string]); c.continue() } else resolve(out)
      }
      cur.onerror = () => reject(cur.error)
    })
    if (settled) return   // timed out already → stay in localStorage-fallback mode

    mem = new Map(entries)

    // One-time migration of existing localStorage gameplay data.
    if (!safeLS(() => localStorage.getItem(MIGRATED_FLAG), '1')) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (!k || mem.has(k)) continue
        if (!MIGRATE_PREFIXES.some(p => k.startsWith(p))) continue
        const v = localStorage.getItem(k)
        if (v != null) { mem.set(k, v); idbWrite('put', k, v).catch(() => {}) }
      }
      safeLS(() => localStorage.setItem(MIGRATED_FLAG, '1'), undefined)
    }
    safeLS(mergeFallback, undefined)
  } catch {
    useFallback = true
  } finally {
    clearTimeout(timer)
    finish()
  }
}

if (typeof window !== 'undefined') hydrate()

export const kv = {
  /** Resolves once the in-memory cache has hydrated from IndexedDB. */
  ready: (): Promise<void> => readyPromise,

  /** Which backing store is actually in use. `local` means IndexedDB was unavailable, blocked,
   *  or HUNG (Safari private browsing / strict storage settings) and the 2.5s timer above fell
   *  back to localStorage. That state is invisible from the server and explains a whole class of
   *  "my child's progress vanished" reports, so diagnostics surfaces it. */
  mode: (): 'idb' | 'local' => (useFallback ? 'local' : 'idb'),

  get(key: string): string | null {
    if (useFallback) return safeLS(() => localStorage.getItem(key), null)
    return mem.has(key) ? mem.get(key)! : null
  },

  set(key: string, value: string): void {
    if (useFallback) { safeLS(() => localStorage.setItem(key, value), undefined); return }
    mem.set(key, value)
    idbWrite('put', key, value).catch(() => {})
  },

  remove(key: string): void {
    if (useFallback) { safeLS(() => localStorage.removeItem(key), undefined); return }
    mem.delete(key)
    idbWrite('delete', key).catch(() => {})
  },
}
