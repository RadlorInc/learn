'use client'
/**
 * /admin/mfa — an admin turns on two-step verification: an authenticator app (TOTP) that gives a 6-digit code.
 *
 * Reachable only by a signed-in admin: the same gate as every /admin page (`useMetrics` → the metrics route →
 * `admin_assert()` in the database). A non-admin gets the 404 and nothing from this page — no QR code, no mention.
 *
 * The QR code is the SVG Supabase returns, shown as an <img> from a data: URL (CSP `img-src` allows `data:`); an SVG
 * in an <img> runs no script. The secret is shown as text too, for an app that cannot scan.
 */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { enrolTotp, verifiedTotpFactor, verifyTotp } from '@/data/auth'
import { S, useMetrics, LoadError } from '../_parts'

/** Supabase hands back `data:image/svg+xml;utf-8,<svg…>` unencoded. Its SVG had no `#` when measured (local Supabase
 *  Auth v2.196, 2026-09-28), but one colour code in a future version would end the URL early, so it is encoded. */
const qrSrc = (qr: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qr.replace(/^data:[^,]*,/, ''))

export default function AdminMfa() {
  const { data, err, rid } = useMetrics('overview')
  const [state, setState] = useState<'loading' | 'off' | 'enrolling' | 'on'>('loading')
  const [factor, setFactor] = useState<{ id: string; qr: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!data) return
    verifiedTotpFactor().then(id => setState(id ? 'on' : 'off'))
  }, [data])

  if (err) return <LoadError err={err} rid={rid} />
  if (!data || state === 'loading') return <div style={S.page}><p style={S.sub}>Loading…</p></div>

  async function start() {
    setBusy(true); setMsg(null)
    const { data: f, error } = await enrolTotp()
    setBusy(false)
    if (error || !f) { setMsg(`Could not start: ${error?.message ?? 'no answer'}`); return }
    setFactor({ id: f.id, qr: f.totp.qr_code, secret: f.totp.secret }); setState('enrolling')
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault()
    if (!factor) return
    setBusy(true); setMsg(null)
    const { error } = await verifyTotp(factor.id, code.replace(/\s/g, ''))   // apps show "123 456"; a pasted space is not an error
    setBusy(false)
    if (error) { setMsg('That code did not work. Check the phone’s clock and try the next code.'); return }
    setFactor(null); setState('on')
  }

  return (
    <div style={S.page}>
      <div style={{ ...S.card, maxWidth: 460 }}>
        <h2 style={S.h2}>Two-step verification</h2>
        {state === 'on' && (
          <p style={S.sub} data-mfa="on">
            On. Signing in to /admin asks for the 6-digit code from your authenticator app after the password.{' '}
            <Link href="/admin">Back to the dashboard</Link>
          </p>
        )}
        {state === 'off' && (
          <>
            <p style={S.sub}>Off. Turn it on with an authenticator app (Google Authenticator, 1Password, Authy…).</p>
            <button onClick={start} disabled={busy} style={btn}>{busy ? '…' : 'Set up an authenticator app'}</button>
          </>
        )}
        {state === 'enrolling' && factor && (
          <form onSubmit={confirm}>
            <p style={S.sub}>1. Scan this with the app.</p>
            <img src={qrSrc(factor.qr)} alt="QR code for your authenticator app" width={200} height={200} data-mfa="qr" />
            <p style={S.sub}>Or type this key into it: <code data-mfa="secret" style={{ wordBreak: 'break-all' }}>{factor.secret}</code></p>
            <p style={S.sub}>2. Enter the 6-digit code it shows.</p>
            <input id="mfa-code" required value={code} onChange={e => setCode(e.target.value)} placeholder="123456"
                   inputMode="numeric" autoComplete="one-time-code"
                   style={{ display: 'block', padding: '9px 10px', marginBottom: 10, border: '1px solid #d3e9f9', borderRadius: 6, fontSize: 14 }} />
            <button disabled={busy} style={btn}>{busy ? '…' : 'Turn on'}</button>
          </form>
        )}
        {msg && <p style={{ color: '#8a1c1c', fontSize: 12, marginBottom: 0 }}>{msg}</p>}
      </div>
    </div>
  )
}
const btn: React.CSSProperties = { padding: '9px 14px', background: '#0b4fa8', color: '#fff', border: 0, borderRadius: 6, fontSize: 14, cursor: 'pointer' }
