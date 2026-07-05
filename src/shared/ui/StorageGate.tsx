'use client'
import { useEffect, useState } from 'react'
import { useMiloStore } from '@/state/store'
import { kv } from '@/infra/storage/kv'

/**
 * Holds the app behind a splash until the IndexedDB-backed kv store has hydrated
 * its in-memory cache, then rehydrates the Zustand profile store. This is what
 * lets the rest of the app keep reading local state synchronously (kv is async).
 * Mounted once in the root layout, so it runs per full page load, not per route.
 */
export default function StorageGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const boot = () => { if (!cancelled) setReady(true) }
    // Hard safety net: never let the splash outlast this, whatever storage does.
    // (kv.ready() self-resolves within ~2.5s even if IndexedDB hangs; this backstops
    // a hung rehydrate too, so Safari can never freeze the app on the fox splash.)
    const t = setTimeout(boot, 4000)
    kv.ready()
      .then(async () => { try { await useMiloStore.persist.rehydrate() } catch { /* boot anyway */ } })
      .catch(() => { /* boot anyway */ })
      .finally(() => { clearTimeout(t); boot() })
    return () => { cancelled = true; clearTimeout(t) }
  }, [])

  if (!ready) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FCEAB6', fontSize: 48 }}>
        🦊
      </div>
    )
  }
  return <>{children}</>
}
