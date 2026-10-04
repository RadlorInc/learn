'use client'
/**
 * /admin/testers — paid testers (docs/runbooks/testers.md). Make a link for one email and one module, watch what the
 * tester did screen by screen, revoke a link, mark one paid (which also closes it).
 *
 * ⚠️ Unlike the other /admin pages this one WRITES — tester rows only, never a family's. The boundary is the same:
 * every call is an RPC whose first statement is `admin_assert()`, made with the admin's own token.
 */
import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/data/supabase/client'
import { db } from '@/data/repositories/_shared'
import { CATALOGUE, STORY_CATALOGUE } from '@/features/lessons/catalogue'
import { S } from '../_parts'

type Row = {
  id: string; token: string; email: string; module_id: string; note: string | null; created_at: string
  revoked_at: string | null; paid_at: string | null; screens: number; topics: number; issues: number
  not_played: number; median_open_ms: number | null; first_at: string | null; last_at: string | null
}
type Review = { lesson_id: string; screen: string; verdict: 'ok' | 'issue'; note: string | null; answer: string | null; open_ms: number; played: boolean; at: string }

// What a link can be for: a Grade 3–8 module (`g3m1`), or a KG–2 story chapter by its lesson id (`c:addition`).
const MODULES = [
  ...STORY_CATALOGUE.map(m => ({ id: m.lessons[0].id, label: `${m.grade === 0 ? 'KG' : `G${m.grade}`} chapter · ${m.title}`, topics: 1 })),
  ...CATALOGUE.filter(m => m.lessons.length > 0 && !m.story).map(m => ({ id: m.id, label: `G${m.grade} M${m.n} · ${m.title}`, topics: m.lessons.length })),
]
const titleOf = (id: string) => MODULES.find(x => x.id === id)?.label ?? id
const linkOf = (token: string) => `${window.location.origin}/test#t=${token}`
const secs = (ms: number | null) => (ms == null ? '—' : `${Math.round(ms / 1000)}s`)
const when = (t: string | null) => (t ? new Date(t).toLocaleString() : '—')

export default function TestersPage() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [err, setErr] = useState('')
  const [email, setEmail] = useState(''), [mod, setMod] = useState(MODULES[0]?.id ?? ''), [note, setNote] = useState('')
  const [made, setMade] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [gone, setGone] = useState(false)

  const call = useCallback(async (fn: string, args: object = {}) => {
    const { data: { session } } = await createClient().auth.getSession()
    if (!session) { window.location.href = '/admin/login'; return null }
    const { data, error } = await db().rpc(fn, args)
    if (error?.code === '42501') { setGone(true); return null }
    if (error) { setErr(`${fn}: ${error.message}`); return null }
    setErr('')
    return data
  }, [])
  const load = useCallback(async () => { const d = await call('admin_tester_list'); if (d) setRows(d as Row[]) }, [call])
  useEffect(() => {
    let live = true
    ;(async () => { const d = await call('admin_tester_list'); if (live && d) setRows(d as Row[]) })()
    return () => { live = false }
  }, [call])
  if (gone) notFound()

  const create = async () => {
    const d = await call('admin_tester_create', { p_email: email, p_module: mod, p_note: note }) as { token: string } | null
    if (!d) return
    setMade(linkOf(d.token)); setEmail(''); setNote(''); void load()
  }
  const mark = async (id: string, what: string) => { await call('admin_tester_mark', { p_id: id, p_what: what }); void load() }
  const show = async (id: string) => {
    if (openId === id) { setOpenId(null); return }
    const d = await call('admin_tester_reviews', { p_id: id })
    setReviews((d ?? []) as Review[]); setOpenId(id)
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <h2 style={S.h2}>New tester link</h2>
        <p style={S.sub}>One link = one email + one module. Send the link to the tester; they need no account.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input type="email" placeholder="tester@email.com" value={email} onChange={e => setEmail(e.target.value)} style={input} />
          <select value={mod} onChange={e => setMod(e.target.value)} style={input}>
            {MODULES.map(m => <option key={m.id} value={m.id}>{titleOf(m.id)}</option>)}
          </select>
          <input placeholder="note (rate, deadline…)" value={note} onChange={e => setNote(e.target.value)} style={input} />
          <button type="button" style={btn} disabled={!email.includes('@')} onClick={create}>Create link</button>
        </div>
        {made && <p style={{ fontSize: 13, marginTop: 10 }}>Link: <code>{made}</code>{' '}
          <button type="button" style={btn} onClick={() => void navigator.clipboard.writeText(made)}>Copy</button></p>}
      </div>

      {err && <p role="alert" style={{ color: '#8a1c1c' }}>{err}</p>}

      <div style={S.card}>
        <h2 style={S.h2}>Testers</h2>
        <p style={S.sub}>
          Screens = screens reviewed. <b>Not played</b> = reviewed before her lines finished (should stay 0 — the app
          blocks it; a non-zero means something is off). <b>Median time</b> = how long a screen was open before its review.
          A genuine test has every topic done, issues with real notes, and answers that look worked out. Paid closes the link.
        </p>
        {!rows ? <p>Loading…</p> : rows.length === 0 ? <p>No testers yet.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Email', 'Module', 'Topics', 'Screens', 'Issues', 'Not played', 'Median time', 'Last active', 'Status', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{rows.flatMap(r => {
              const total = MODULES.find(m => m.id === r.module_id)?.topics ?? 0
              const status = r.paid_at ? `paid ${new Date(r.paid_at).toLocaleDateString()}` : r.revoked_at ? 'revoked' : 'active'
              const out = [
                <tr key={r.id}>
                  <td style={td}>{r.email}{r.note && <div style={{ color: '#3d6fb8' }}>{r.note}</div>}</td>
                  <td style={td}>{titleOf(r.module_id)}</td>
                  <td style={td}>{r.topics} / {total}</td>
                  <td style={td}>{r.screens}</td>
                  <td style={td}>{r.issues}</td>
                  <td style={{ ...td, color: r.not_played ? '#8a1c1c' : undefined }}>{r.not_played}</td>
                  <td style={td}>{secs(r.median_open_ms)}</td>
                  <td style={td}>{when(r.last_at)}</td>
                  <td style={td}>{status}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <button type="button" style={btn} onClick={() => show(r.id)}>{openId === r.id ? 'Hide' : 'Reviews'}</button>{' '}
                    <button type="button" style={btn} onClick={() => void navigator.clipboard.writeText(linkOf(r.token))}>Copy link</button>{' '}
                    <button type="button" style={btn} onClick={() => mark(r.id, r.revoked_at ? 'unrevoke' : 'revoke')}>{r.revoked_at ? 'Un-revoke' : 'Revoke'}</button>{' '}
                    <button type="button" style={btn} onClick={() => mark(r.id, r.paid_at ? 'unpaid' : 'paid')}>{r.paid_at ? 'Unmark paid' : 'Mark paid'}</button>
                  </td>
                </tr>,
              ]
              if (openId === r.id) out.push(
                <tr key={`${r.id}-x`}><td colSpan={10} style={{ ...td, background: '#f3f9ff' }}>
                  {reviews.length === 0 ? 'Nothing reviewed yet.' : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>{['Topic', 'Screen', 'Verdict', 'Note', 'Their answer', 'Open for', 'Played', 'When'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                      <tbody>{reviews.map(v => (
                        <tr key={`${v.lesson_id}/${v.screen}`} style={{ background: v.verdict === 'issue' ? '#fff4e5' : undefined }}>
                          <td style={td}>{v.lesson_id}</td><td style={td}>{v.screen}</td>
                          <td style={td}>{v.verdict === 'issue' ? '⚠️ issue' : '👍 ok'}</td>
                          <td style={{ ...td, maxWidth: 360 }}>{v.note}</td><td style={td}>{v.answer}</td>
                          <td style={td}>{secs(v.open_ms)}</td><td style={td}>{v.played ? 'yes' : 'NO'}</td><td style={td}>{when(v.at)}</td>
                        </tr>))}</tbody>
                    </table>)}
                </td></tr>)
              return out
            })}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const input: CSSProperties = { fontSize: 13, padding: '6px 8px', border: '1px solid #d3e9f9', borderRadius: 6, minWidth: 180 }
const btn: CSSProperties = { fontSize: 12, padding: '5px 9px', border: '1px solid #3d6fb8', borderRadius: 6, background: '#fff', color: '#0b4fa8', cursor: 'pointer' }
const th: CSSProperties = { textAlign: 'left', borderBottom: '1px solid #d3e9f9', padding: '6px 4px', color: '#3d6fb8', fontWeight: 600 }
const td: CSSProperties = { borderBottom: '1px solid #eef5fc', padding: '6px 4px', verticalAlign: 'top' }
