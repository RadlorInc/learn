// Dummy public env so modules that construct the Supabase client at import don't throw in tests.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'test-anon-key'

// Guaranteed localStorage/sessionStorage for the storage-backed helpers (works whether or not the
// jsdom environment attaches them). A minimal in-memory Web Storage shim.
function memStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() { return m.size },
    clear: () => m.clear(),
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => { m.set(k, String(v)) },
    removeItem: (k: string) => { m.delete(k) },
    key: (i: number) => Array.from(m.keys())[i] ?? null,
  } as Storage
}
const g = globalThis as unknown as { localStorage?: Storage; sessionStorage?: Storage }
if (!g.localStorage) g.localStorage = memStorage()
if (!g.sessionStorage) g.sessionStorage = memStorage()
