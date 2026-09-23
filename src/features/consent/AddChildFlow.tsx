'use client'
/**
 * What "+ Add a child" opens, now that a child cannot exist without a parent's verifiable consent.
 *
 *   granted, unused consent on the account → the add-a-child sheet, carrying that consent's id
 *   a pending request inside its window    → "we have already sent you a message"
 *   anything else                          → document 02, the direct notice, BEFORE anything is typed
 *
 * ⚠️ AND IF THE CONSENT TABLE DOES NOT EXIST, THE OLD SHEET — ON PURPOSE. The client ships before the
 * migration (a gate that lands first would stop every new child), so this has to tolerate both shapes:
 * no table means no gate, and the old path is the only one that works. Once the migration is applied
 * the table exists and this branch is dead — delete it then (expand → migrate → contract), because
 * dead code here is a way round the gate waiting for somebody to revive it.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/data/supabase/client'
import { NOTICE, NOTICE_VERSION, PROPOSED, type Lang, type L } from './copy'
import { Md } from './Md'

type Stage =
  | { k: 'loading' } | { k: 'legacy' } | { k: 'notice' } | { k: 'sending' }
  | { k: 'check'; email?: string; days?: number; until?: string } | { k: 'add'; consentId: string } | { k: 'error'; msg: string }

const P = { card: 'var(--paper-soft)', ink: 'var(--ink)', ink2: 'var(--ink-soft)', ink3: 'var(--ink-muted)', edge: 'var(--card-border)', accent: 'var(--milo-orange)' }

/** "The table does not exist" as PostgREST and Postgres each say it. Anything else is a real error. */
const tableMissing = (e: { code?: string; message?: string }) =>
  e.code === 'PGRST205' || e.code === '42P01' || /parental_consents/.test(e.message ?? '') && /does not exist|schema cache/.test(e.message ?? '')

export function AddChildFlow({ lang, onClose, renderAdd }: {
  lang: Lang; onClose: () => void; renderAdd: (consentId?: string) => ReactNode
}) {
  const [stage, setStage] = useState<Stage>({ k: 'loading' })
  const t = (x: L) => x[lang]

  useEffect(() => {
    let live = true
    void (async () => {
      const { data, error } = await createClient().from('parental_consents')
        .select('id, state, expires_at, learner_id').order('requested_at', { ascending: false })
      if (!live) return
      if (error) return setStage(tableMissing(error) ? { k: 'legacy' } : { k: 'error', msg: t(PROPOSED.error) })
      const rows = (data ?? []) as { id: string; state: string; expires_at: string; learner_id: string | null }[]
      const unused = rows.find(r => r.state === 'granted' && !r.learner_id)
      if (unused) return setStage({ k: 'add', consentId: unused.id })
      const waiting = rows.find(r => r.state === 'pending' && new Date(r.expires_at) > new Date())
      setStage(waiting ? { k: 'check', until: waiting.expires_at } : { k: 'notice' })
    })()
    return () => { live = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function ask() {
    setStage({ k: 'sending' })
    const { data } = await createClient().auth.getSession()
    const r = await fetch('/api/consent/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
      body: JSON.stringify({ noticeVersion: NOTICE_VERSION, lang }),
    }).catch(() => null)
    const j = await r?.json().catch(() => null)
    if (r?.ok && j?.ok) return setStage({ k: 'check', email: j.email, days: j.days })
    setStage({ k: 'error', msg: t(r?.status === 409 ? PROPOSED.stale : PROPOSED.error) })
  }

  if (stage.k === 'legacy') return <>{renderAdd()}</>
  if (stage.k === 'add') return <>{renderAdd(stage.consentId)}</>

  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label={t(NOTICE.title)}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(61,37,22,0.45)' }} onClick={onClose}>
      <div className="sheet-card" style={{ background: P.card, padding: '28px 24px 40px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', boxSizing: 'border-box' }}
        onClick={e => e.stopPropagation()}>
        {stage.k === 'loading' && <p style={S.p}>…</p>}
        {(stage.k === 'notice' || stage.k === 'sending') && <Notice lang={lang} busy={stage.k === 'sending'} onContinue={ask} onClose={onClose} />}
        {stage.k === 'check' && (
          <div data-consent="check">
            <h3 style={S.h3}>{t(PROPOSED.checkHeading)}</h3>
            <p style={S.p}>{stage.email
              ? t(PROPOSED.checkBody).replace('{email}', stage.email).replace('{days}', String(stage.days))
              : t(PROPOSED.checkPending).replace('{date}', new Date(stage.until!).toLocaleDateString(lang === 'es' ? 'es' : 'en-US', { dateStyle: 'long' }))}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              <button type="button" onClick={ask} style={S.ghost}>{t(PROPOSED.sendAgain)}</button>
              <button type="button" onClick={onClose} style={S.ghost}>{t(NOTICE.tertiary)}</button>
            </div>
          </div>
        )}
        {stage.k === 'error' && (
          <div>
            <p role="alert" style={{ ...S.p, color: '#93000A', fontWeight: 700 }}>{stage.msg}</p>
            <button type="button" onClick={onClose} style={S.ghost}>{t(NOTICE.tertiary)}</button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Document 02, every line of it, in the order the document gives it. */
function Notice({ lang, busy, onContinue, onClose }: { lang: Lang; busy: boolean; onContinue: () => void; onClose: () => void }) {
  const t = (x: L) => x[lang]
  const N = NOTICE
  return (
    <div data-consent="notice">
      <h3 style={S.h3}>{t(N.title)}</h3>
      <p style={S.p}><Md s={t(N.intro)} /></p>

      <h4 style={S.h4}>{t(N.collectHeading)}</h4>
      {/* The table as stacked cards: three columns do not fit a 375px phone, and a sideways-scrolling
          notice is one a parent does not finish reading. Same cells, same order, all three shown. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {N.rows.map((row, i) => (
          <div key={i} style={{ border: `1px solid ${P.edge}`, borderRadius: 12, padding: '10px 12px' }}>
            {row.map((cell, j) => (
              <p key={j} style={{ ...S.p, margin: j ? '6px 0 0' : 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: P.ink3, display: 'block' }}>{t(N.columns[j])}</span>
                <Md s={t(cell)} />
              </p>
            ))}
          </div>
        ))}
      </div>
      <p style={{ ...S.p, marginTop: 12 }}><Md s={t(N.doNotAsk)} /></p>

      <h4 style={S.h4}>{t(N.useHeading)}</h4>
      <p style={S.p}><Md s={t(N.use)} /></p>
      <p style={S.p}><Md s={t(N.thirdParty)} /></p>
      <p style={S.p}><Md s={t(N.weDoNot)} /></p>
      <ul style={S.ul}>{N.weDoNotList.map((x, i) => <li key={i}><Md s={t(x)} /></li>)}</ul>

      <h4 style={S.h4}>{t(N.permissionHeading)}</h4>
      <p style={S.p}><Md s={t(N.permission)} /></p>
      <ul style={S.ul}>{N.permissionList.map((x, i) => <li key={i}><Md s={t(x)} /></li>)}</ul>

      <h4 style={S.h4}>{t(N.rightsHeading)}</h4>
      <p style={S.p}><Md s={t(N.rightsIntro)} /></p>
      <ul style={S.ul}>{N.rightsList.map((x, i) => <li key={i}><Md s={t(x)} /></li>)}</ul>
      <p style={S.p}><Md s={t(N.rightsHow)} /></p>

      <h4 style={S.h4}>{t(N.keepHeading)}</h4>
      <p style={S.p}><Md s={t(N.keep)} /></p>
      <h4 style={S.h4}>{t(N.protectHeading)}</h4>
      <p style={S.p}><Md s={t(N.protect)} /></p>
      <h4 style={S.h4}>{t(N.detailsHeading)}</h4>
      <p style={S.p}><Md s={t(N.details)} /></p>
      <h4 style={S.h4}>{t(N.contactHeading)}</h4>
      <p style={S.p}>{N.contact.map((l, i) => <span key={i} style={{ display: 'block' }}>{l}</span>)}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        <button type="button" onClick={onContinue} disabled={busy} style={S.primary}>{t(N.primary)}</button>
        <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ ...S.ghost, textAlign: 'center', textDecoration: 'none' }}>{t(N.secondary)}</a>
        <button type="button" onClick={onClose} style={S.ghost}>{t(N.tertiary)}</button>
      </div>
    </div>
  )
}

const S = {
  h3: { fontSize: 20, fontWeight: 800, margin: '0 0 12px', color: P.ink, fontFamily: 'var(--font-display)' },
  h4: { fontSize: 15, fontWeight: 800, margin: '20px 0 8px', color: P.ink },
  p:  { fontSize: 14, lineHeight: 1.55, color: P.ink2, margin: '0 0 10px' },
  ul: { fontSize: 14, lineHeight: 1.55, color: P.ink2, margin: '0 0 10px', paddingLeft: 20 },
  primary: { width: '100%', padding: 16, minHeight: 44, background: P.accent, color: '#fff', border: 'none', borderRadius: 50, fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' },
  ghost: { padding: '12px 18px', minHeight: 44, background: 'transparent', color: P.ink, border: `1.5px solid ${P.edge}`, borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
} as const
