'use client'
import { useEffect, useState } from 'react'
import { DEFAULT_NOTICE, type Notice } from '@/core/outageNotice'
import { useSavedLang } from '@/features/dashboard/i18n'

/**
 * The outage notice's bar (`/api/notice`; docs/runbooks/outages.md → the notice switch). Asked once per page load; any
 * failure (offline, Vercel down) shows nothing, and the offline bar speaks for offline.
 *
 * ⚠️ IN THE PAGE'S FLOW AND NOT POSITIONED, ON PURPOSE: a full-screen chapter or the game (`position: fixed`) paints
 * over it, so it can never cover a stage or an answer button; a child sees it on /modules and between chapters. The ×
 * hides it for this page load only; a reload asks again.
 */
export default function OutageNotice() {
  const [notice, setNotice] = useState<Notice>(null)
  const [hidden, setHidden] = useState(false)
  const lang = useSavedLang()
  useEffect(() => {
    let live = true
    fetch('/api/notice', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((b: { notice?: Notice } | null) => { if (live) setNotice(b?.notice ?? null) })
      .catch(() => {})
    return () => { live = false }
  }, [])
  if (!notice || hidden) return null
  const text = 'text' in notice ? notice.text : DEFAULT_NOTICE[lang]
  return (
    <div role="status" data-outage-notice style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '4px 4px 4px 16px', background: '#DCEBFF', color: '#0B4FA8',
      fontSize: 14, fontWeight: 600, lineHeight: 1.3, textAlign: 'center',
    }}>
      <span>{text}</span>
      <button type="button" onClick={() => setHidden(true)} aria-label={lang === 'es' ? 'Ocultar este aviso' : 'Hide this notice'}
        style={{ minWidth: 44, minHeight: 44, border: 0, background: 'transparent', color: 'inherit', fontSize: 20, cursor: 'pointer' }}>
        ×
      </button>
    </div>
  )
}
