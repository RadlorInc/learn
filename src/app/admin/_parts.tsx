'use client'
/**
 * Shared pieces for /admin. Aggregate-only by construction: nothing here can render an identifier
 * because nothing upstream returns one.
 *
 * ⚠️ NO CHARTING LIBRARY. Eight bar charts do not justify a dependency; these are inline SVG.
 */
import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/data/supabase/client'

export const S = {
  page:  { padding: 24, maxWidth: 1100, margin: '0 auto', fontFamily: 'ui-sans-serif, system-ui', color: '#1d2430' } as const,
  card:  { background: '#fff', border: '1px solid #e3e8ef', borderRadius: 10, padding: 16, marginBottom: 16 } as const,
  h2:    { fontSize: 15, fontWeight: 700, margin: '0 0 2px' } as const,
  sub:   { fontSize: 12, color: '#6b7683', margin: '0 0 12px', lineHeight: 1.5 } as const,
  num:   { fontSize: 30, fontWeight: 700, letterSpacing: -0.5 } as const,
  dash:  { fontSize: 30, fontWeight: 700, color: '#c2c9d3' } as const,
}

/** Small-cell suppression renders as an em dash — never a zero, which would read as "nobody". */
export const N = ({ v }: { v: number | null | undefined }) =>
  v === null || v === undefined ? <span style={S.dash} title="Suppressed: fewer users in this bucket than the small-cell threshold">—</span>
                                : <span style={S.num}>{v}</span>

/** Every number carries its definition. Numerator, denominator, window, timezone. */
export function Def({ children }: { children: React.ReactNode }) {
  return <p style={S.sub}>{children}</p>
}

export function useMetrics(page: 'overview' | 'learning' | 'funnel') {
  // ⚠️ `err` MUST BE RENDERABLE, and the page must never sit on "Loading…" for ever. Before this,
  // any failure that was not a 404 left `data` undefined and the page showed "Loading…" with no end
  // — indistinguishable from a slow network, which is how a real failure gets mistaken for latency.
  const [state, setState] = useState<{ data?: any; minCohort?: number; err?: string; rid?: string }>({})
  useEffect(() => {
    let dead = false
    ;(async () => {
      const { data: { session } } = await createClient().auth.getSession()
      if (!session) { window.location.href = '/admin/login'; return }
      const r = await fetch(`/api/admin/metrics?page=${page}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (dead) return
      // ⚠️ 404 for a signed-in NON-ADMIN, deliberately. /admin must not confirm it exists to
      // somebody who may not see it. The real boundary is admin_assert() in the database; this is
      // the part that declines to tell them there is a door.
      if (r.status === 404) { notFound(); return }
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setState({ err: `Could not load metrics (HTTP ${r.status}).`, rid: j?.rid })
        return
      }
      setState({ data: j.data, minCohort: j.minCohort, rid: j.rid })
    })().catch(e => {
      // A thrown fetch (offline, DNS, CORS) previously left the page on "Loading…" for ever.
      if (!dead) setState({ err: `Could not load metrics: ${e instanceof Error ? e.message : String(e)}` })
    })
    return () => { dead = true }
  }, [page])
  return state
}

/** The one place a load failure is rendered. Always shows the request id when the server sent one,
 *  because the client's 404/502 is deliberately uninformative and the id is what ties it to a log
 *  line saying which of route-missing / not-an-admin / query-failed it actually was. */
export function LoadError({ err, rid }: { err: string; rid?: string }) {
  return (
    <div style={S.page}>
      <div style={{ ...S.card, borderColor: '#e0b4b4', background: '#fdf6f6' }}>
        <h2 style={S.h2}>Couldn&rsquo;t load this page</h2>
        <p style={S.sub}>{err}</p>
        {rid
          ? <p style={{ ...S.sub, marginBottom: 0 }}>
              Request id <code style={{ background: '#f0f3f7', padding: '1px 6px', borderRadius: 4 }}>{rid}</code>
              {' '}— the server log for this id says which of the three it was.
            </p>
          : <p style={{ ...S.sub, marginBottom: 0 }}>No request id — the request did not reach the server.</p>}
      </div>
    </div>
  )
}

/** A bar chart. `incompleteKey` marks today, which is a partial day and must not read as a fall. */
export function Bars({ rows, incompleteKey, height = 120 }: {
  rows: { d: string; n: number | null }[]
  incompleteKey?: string
  height?: number
}) {
  if (!rows.length) return <p style={S.sub}>No data in this window.</p>
  const max = Math.max(1, ...rows.map(r => r.n ?? 0))
  const w = Math.max(3, Math.floor(640 / rows.length) - 2)
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={Math.max(320, rows.length * (w + 2))} height={height + 26} role="img">
        {rows.map((r, i) => {
          const partial = r.d === incompleteKey
          const h = r.n === null ? 0 : Math.round((r.n / max) * height)
          return (
            <g key={r.d}>
              <rect x={i * (w + 2)} y={height - h} width={w} height={h}
                    fill={partial ? '#c9d3e0' : '#3d6fd1'}>
                <title>{r.d}: {r.n === null ? 'suppressed' : r.n}{partial ? ' (today — incomplete)' : ''}</title>
              </rect>
              {r.n === null && <text x={i * (w + 2) + w / 2} y={height - 4} textAnchor="middle" fontSize="11" fill="#c2c9d3">—</text>}
              {(i === 0 || i === rows.length - 1) &&
                <text x={i * (w + 2)} y={height + 16} fontSize="10" fill="#8b95a3">{r.d.slice(5)}</text>}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/**
 * A panel for something we cannot yet measure.
 *
 * ⚠️ A MISSING PANEL IS A QUESTION SOMEBODY ASKS AGAIN IN THREE WEEKS. A labelled one answers
 * itself, so each states what it will show, why it is empty, when recording began, and roughly
 * when it becomes meaningful.
 */
export function NotYet({ title, shows, why, since, meaningful }: {
  title: string; shows: string; why: string; since: string; meaningful: string
}) {
  return (
    <div style={{ ...S.card, background: '#fbfcfd', borderStyle: 'dashed' }}>
      <h2 style={S.h2}>{title} <span style={{ fontSize: 11, fontWeight: 600, color: '#a06a00', background: '#fff4e0', padding: '2px 7px', borderRadius: 20, marginLeft: 6 }}>not recordable yet</span></h2>
      <table style={{ fontSize: 12, color: '#4a5462', borderSpacing: 0, marginTop: 8, lineHeight: 1.6 }}>
        <tbody>
          <tr><td style={{ color: '#8b95a3', paddingRight: 12, verticalAlign: 'top' }}>Will show</td><td>{shows}</td></tr>
          <tr><td style={{ color: '#8b95a3', paddingRight: 12, verticalAlign: 'top' }}>Empty because</td><td>{why}</td></tr>
          <tr><td style={{ color: '#8b95a3', paddingRight: 12, verticalAlign: 'top' }}>Recording began</td><td>{since}</td></tr>
          <tr><td style={{ color: '#8b95a3', paddingRight: 12, verticalAlign: 'top' }}>Meaningful when</td><td>{meaningful}</td></tr>
        </tbody>
      </table>
    </div>
  )
}

export function Computed({ at }: { at?: string }) {
  if (!at) return null
  return <p style={{ ...S.sub, marginTop: 10, marginBottom: 0 }}>
    Computed {new Date(at).toLocaleString('en-US', { timeZone: 'America/New_York' })} US Eastern —
    read live from the database on each load, not cached.
  </p>
}
