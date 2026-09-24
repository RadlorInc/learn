'use client'
/**
 * Where the links in B1 and B3 land. Public, no sign-in: the token in the URL fragment is the
 * credential, and a parent may be reading the email on a phone that has never opened the app.
 *
 * ⚠️ NOTHING HAPPENS ON ARRIVAL — ONLY ON A PRESS. Mail scanners (Outlook Safe Links, Mimecast and
 * the rest) open every link in an inbound message. If arriving here granted consent, a scanner would
 * grant it for every parent before they read the email, and email-plus would verify nothing. So the
 * page looks the token up (read-only) and shows the choice; the POST is the parent's own click.
 *
 *   respond  — heading: B1's subject; the Privacy Policy line, then B1's tick box (unticked) — ticking it IS the grant, there is no
 *              separate button; after granting: B2, verbatim
 *   withdraw — the withdrawal screen from document 03, verbatim
 * Every other message on this page is from `PROPOSED` in copy.ts and awaits the founder's approval.
 */
import { useEffect, useState } from 'react'
import { B1, B2, WITHDRAW, PROPOSED, type Lang, type L } from './copy'
import { makeT } from '@/features/dashboard/i18n'
import { Md } from './Md'
import { WithdrawAll } from './WithdrawAll'

type Status = 'loading' | 'pending' | 'granted' | 'already_granted' | 'already_consented' | 'declined' | 'withdrawn' | 'expired' | 'unknown' | 'kept' | 'error'

function fragment(): { t: string } {
  const h = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.hash.slice(1))
  return { t: h.get('t') ?? '' }
}

async function call(t: string, action: string): Promise<{ status: Status; lang?: Lang; name?: string | null; scope?: 'account' | 'child' }> {
  const r = await fetch('/api/consent/respond', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t, action }),
  }).catch(() => null)
  const j = await r?.json().catch(() => null)
  return r?.ok && j?.status ? j : { status: 'error' }
}

export function ConsentLink({ mode }: { mode: 'respond' | 'withdraw' }) {
  const [status, setStatus] = useState<Status>('loading')
  const [lang, setLang] = useState<Lang>('en')
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState<string | null>(null)
  // consent-once: an ACCOUNT consent's B3 link withdraws for every child, so it gets document 03's "all" screen.
  const [scope, setScope] = useState<'account' | 'child'>('child')
  const t = (x: L) => x[lang]

  useEffect(() => {
    const f = fragment()
    void call(f.t, 'lookup').then(r => { if (r.lang) setLang(r.lang); setName(r.name ?? null); if (r.scope === 'account') setScope('account'); setStatus(r.status) })
  }, [])

  async function act(action: 'grant' | 'decline' | 'withdraw') {
    setBusy(true)
    const r = await call(fragment().t, action)
    if (r.lang) setLang(r.lang)
    setStatus(r.status)
    setBusy(false)
  }

  const say = (h: L, body?: L) => (<><h1 style={S.h1}>{t(h)}</h1>{body && <p style={S.p}><Md s={t(body)} /></p>}</>)
  let content: React.ReactNode
  if (status === 'loading') content = <p style={S.p}>…</p>
  else if (mode === 'respond' && status === 'pending') {
    content = (
      <div data-consent="respond">
        <h1 style={S.h1}>{t(B1.subject)}</h1>
        <p style={S.p}>{t(B1.covers)}</p>
        <p style={S.p}><Md s={t(B1.details)} /></p>
        <label style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 16, lineHeight: 1.4, color: 'var(--ink)', fontWeight: 800, cursor: busy ? 'wait' : 'pointer', padding: '14px 16px', margin: '8px 0 16px', border: '2px solid var(--milo-orange)', borderRadius: 14, minHeight: 48, boxSizing: 'border-box' }}>
          <input type="checkbox" checked={busy} disabled={busy} onChange={e => { if (e.target.checked) void act('grant') }}
            style={{ width: 26, height: 26, flex: '0 0 auto', margin: 0, accentColor: '#F26B2C' }} />
          <span>{t(B1.tick)}</span>
        </label>
        <button type="button" disabled={busy} onClick={() => act('decline')} style={S.ghost}>{t(B1.decline)}</button>
      </div>
    )
  } else if (mode === 'withdraw' && status === 'granted' && scope === 'account') {
    content = <WithdrawAll lang={lang} busy={busy} onConfirm={() => act('withdraw')} onKeep={() => setStatus('kept')} />
  } else if (mode === 'withdraw' && status === 'granted') {
    content = (
      <div data-consent="withdraw">
        <h1 style={S.h1}>{t(WITHDRAW.heading)}</h1>
        {/* The last paragraph points at the per-child control by the child's name; with no child
            profile yet there is nothing to delete one of, so it is not shown rather than guessed. */}
        {WITHDRAW.body.filter(x => !x.en.includes('{name}') || name)
          .map((x, i) => <p key={i} style={S.p}><Md s={t(x).replace('{name}', name ?? '')} /></p>)}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
          <button type="button" disabled={busy} onClick={() => act('withdraw')} style={S.danger}>{t(WITHDRAW.confirm)}</button>
          <button type="button" disabled={busy} onClick={() => setStatus('kept')} style={S.ghost}>{t(WITHDRAW.keep)}</button>
        </div>
      </div>
    )
  } else if (status === 'granted' || status === 'already_granted' || status === 'already_consented') {
    // already_consented: the account already held a current consent, so this request was closed and its B3
    // cancelled — the permission the parent is looking for IS recorded, which is what B2 says.
    content = (
      <div data-consent="granted">
        <h1 style={S.h1}>{t(B2.heading)}</h1>
        {B2.body.map((x, i) => <p key={i} style={S.p}><Md s={t(x)} /></p>)}
        <a href="/parent?add=1" style={{ ...S.primary, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 20 }}>{makeT(lang)('Add a child')}</a>
      </div>
    )
  }
  else if (status === 'declined') content = <div data-consent="declined">{say(PROPOSED.declinedHeading, PROPOSED.declinedBody)}</div>
  else if (status === 'withdrawn') content = <div data-consent="withdrawn">{say(PROPOSED.withdrawnHeading, scope === 'account' ? PROPOSED.withdrawnAllBody : PROPOSED.withdrawnBody)}</div>
  else if (status === 'expired') content = <div data-consent="expired">{say(PROPOSED.expiredHeading, PROPOSED.expiredBody)}</div>
  else if (status === 'kept') content = <div data-consent="kept"><p style={S.p}>{t(PROPOSED.keptBody)}</p></div>
  else if (status === 'unknown') content = <div data-consent="unknown">{say(PROPOSED.invalidHeading)}</div>
  else if (status === 'error') content = <p role="alert" data-consent="error" style={{ ...S.p, color: '#93000A', fontWeight: 700 }}>{t(PROPOSED.error)}</p>
  else content = <div data-consent="used">{say(PROPOSED.usedHeading)}</div>

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--paper)', padding: '40px 20px', boxSizing: 'border-box' }}>
      <div lang={lang} style={{ maxWidth: 520, margin: '0 auto', background: 'var(--paper-soft)', border: '1px solid var(--card-border)', borderRadius: 20, padding: '28px 24px' }}>
        {content}
      </div>
    </main>
  )
}

const S = {
  h1: { fontSize: 22, fontWeight: 800, margin: '0 0 12px', color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1.3 },
  p:  { fontSize: 15, lineHeight: 1.6, color: 'var(--ink-soft)', margin: '0 0 12px' },
  primary: { width: '100%', padding: 16, minHeight: 48, background: 'var(--milo-orange)', color: '#fff', border: 'none', borderRadius: 50, fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' },
  ghost: { width: '100%', padding: 14, minHeight: 48, background: 'transparent', color: 'var(--ink)', border: '1.5px solid var(--card-border)', borderRadius: 50, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  danger: { width: '100%', padding: 16, minHeight: 48, background: '#991B1B', color: '#fff', border: 'none', borderRadius: 50, fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' },
} as const
