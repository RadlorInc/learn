'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useMiloStore } from '@/state/store'
import { kv } from '@/infra/storage/kv'

/**
 * Holds the app behind a splash until the IndexedDB-backed kv store has hydrated
 * its in-memory cache, then rehydrates the Zustand profile store. This is what
 * lets the rest of the app keep reading local state synchronously (kv is async).
 * Mounted once in the root layout, so it runs per full page load, not per route.
 *
 * ⚠️⚠️ IT IS IN THE ROOT LAYOUT, SO WITHOUT THE EXEMPTION BELOW IT REPLACED **EVERY PAGE IN THE
 * APP** WITH A FOX EMOJI IN THE SERVER-RENDERED HTML — measured on production, `/help` shipped
 * exactly 13 visible characters ("Milo — Help 🦊") and so did both legal pages. Three faults from
 * one early return, none of which fail anywhere a type-check or a gate can see:
 *   1. `/legal/[slug]`'s own comment states a policy page "must render … **with JS blocked**". It
 *      did not. A COPPA privacy policy that needs JavaScript to be read is a compliance artifact
 *      that does not exist — which is this repo's own "a comment asserting a rule is followed is
 *      the most expensive kind of lie".
 *   2. Every URL on the domain was empty to a crawler: one emoji, no h1, no text.
 *   3. LCP on two pages of static text was blocked behind an IndexedDB open + a store rehydrate,
 *      with a 4s backstop, for state neither page reads.
 * The fix is the exemption, NOT a rewrite of the gate: the app routes genuinely do need kv to be
 * hydrated before they mount, and that contract is unchanged.
 */

/** Routes that read no local state, so they must not wait for it. Kept as a pattern rather than a
 *  route group because the gate belongs in the root layout for every OTHER route.
 *
 *  ⚠️ `/` IS ON THIS LIST AND HAS TO BE. It is the marketing page — the one URL a stranger, a
 *  crawler and a link preview all land on — so its words must be in the HTML. It reads no local
 *  state: the only client work it does is `ResumeSignedIn`, which reads the SUPABASE session
 *  (localStorage key `milo-auth`), never kv and never the profile store. Matched exactly, so
 *  `/menu` and `/game` are untouched.
 *
 *  ponytail: three static branches; move the app routes into an `(app)/` group if this list grows
 *  past a handful. */
const NO_STORAGE = /^\/(help|legal)(\/|$)/

export function needsStorage(path: string): boolean {
  return path !== '/' && !NO_STORAGE.test(path)
}

export default function StorageGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const pathname = usePathname()

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

  // The effect above still runs on a public route (kv hydrating is harmless and keeps a
  // client-side nav INTO the app instant) — only the splash is skipped.
  if (!ready && needsStorage(pathname)) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FCEAB6', fontSize: 48 }}>
        🦊
      </div>
    )
  }
  return <>{children}</>
}
