'use client'
/**
 * TasteBanner — the conversion prompt shown while a LOGGED-OUT visitor plays the free sample chapter
 * they got from the diagnostic ("Just start playing"). Without it, the play-first path dead-ends: the
 * child finishes the taste and nothing invites the parent to sign up. Their diagnostic result is
 * already stashed (see pendingDiagnostic), so this just links to /auth to create the account and keep
 * going with the full plan. Rendered when the preview route carries ?taste=1.
 */
export default function TasteBanner() {
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', pointerEvents: 'none', padding: '0 10px 10px' }}>
      <a href="/auth" style={{
        pointerEvents: 'auto', maxWidth: 560, width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(10,16,38,0.96)', backdropFilter: 'blur(6px)', border: '2px solid #25c2ff', borderRadius: 14,
        padding: '10px 14px', textDecoration: 'none', boxShadow: '0 8px 26px rgba(0,0,0,0.55)',
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🎁</span>
        <span style={{ flex: 1, color: '#eaf1ff', fontFamily: 'system-ui,-apple-system,sans-serif', fontWeight: 600, fontSize: 13.5, lineHeight: 1.35 }}>
          Free sample. Create a free account to <strong>save this plan &amp; keep going</strong>.
        </span>
        <span style={{ flexShrink: 0, background: '#25c2ff', color: '#06121f', borderRadius: 50, padding: '9px 16px', fontFamily: 'system-ui,sans-serif', fontWeight: 800, fontSize: 13.5, whiteSpace: 'nowrap' }}>Create account →</span>
      </a>
    </div>
  )
}
