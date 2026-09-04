'use client'
/**
 * /admin — read-only, aggregate-only usage analytics.
 *
 * ⚠️ THIS DASHBOARD PERFORMS NO WRITES. There is no admin action, no per-user page, no search and
 * no export of individual records. That is most of the safety here: an app used by children should
 * not have a screen that can reach one of them.
 *
 * ⚠️ THE AUTHORISATION BOUNDARY IS `admin_assert()` IN THE DATABASE, NOT THIS FILE. Auth in this
 * app is client-side (the session lives under `milo-auth` in localStorage), so a server component
 * cannot read it and middleware cannot see it. What that means honestly: the /admin BUNDLE is
 * fetchable by anyone, and the 404 a non-admin sees is rendered on the client. Nothing they can
 * reach returns data — every RPC refuses first. Do not "strengthen" this by moving the check into
 * the UI; the check that matters is already in Postgres.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/data/supabase/client'

const TABS = [
  { href: '/admin',          label: 'Signups & activity' },
  { href: '/admin/learning', label: 'Learning' },
  { href: '/admin/funnel',   label: 'Funnel & retention' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [minCohort, setMinCohort] = useState<number | null>(null)

  useEffect(() => {
    let dead = false
    ;(async () => {
      const { data: { session } } = await createClient().auth.getSession()
      if (!session) { window.location.href = '/admin/login'; return }
      const r = await fetch('/api/admin/metrics?page=overview', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!dead && r.ok) setMinCohort((await r.json()).minCohort)
    })()
    return () => { dead = true }
  }, [])

  if (path === '/admin/login') return <>{children}</>

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      {/* ⚠️ PERSISTENT, ON EVERY PAGE, whenever the threshold is below 5. The point is to be
          reminded rather than to quietly forget that a bucket of one or two names a person. */}
      {minCohort !== null && minCohort < 5 && (
        <div style={{ background: '#8a1c1c', color: '#fff', padding: '9px 16px', fontSize: 13, fontWeight: 600 }}>
          Small-N mode (threshold {minCohort}): with this few users, a number can identify an
          individual. Treat every figure on this page as potentially about one child.
        </div>
      )}
      <header style={{ background: '#fff', borderBottom: '1px solid #e3e8ef', padding: '12px 24px', display: 'flex', gap: 18, alignItems: 'center' }}>
        <strong style={{ fontSize: 14 }}>Milo · usage</strong>
        <nav style={{ display: 'flex', gap: 14 }}>
          {TABS.map(t => (
            <Link key={t.href} href={t.href} style={{
              fontSize: 13, textDecoration: 'none', paddingBottom: 2,
              color: path === t.href ? '#1d2430' : '#6b7683',
              borderBottom: path === t.href ? '2px solid #3d6fd1' : '2px solid transparent',
            }}>{t.label}</Link>
          ))}
        </nav>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8b95a3' }}>
          aggregate only · read-only · US Eastern
        </span>
      </header>
      {children}
    </div>
  )
}
