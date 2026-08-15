'use client'
/**
 * The one crash screen, shared by `app/error.tsx` and `app/global-error.tsx`.
 *
 * ⚠️ EVERY STYLE HERE IS INLINE, AND THAT IS A REQUIREMENT RATHER THAN A HABIT. `global-error.tsx`
 * replaces the root layout when it renders, so it ships its own `<html>`/`<body>` and gets **no
 * global stylesheet and no fonts** (Next docs, `file-conventions/error.md`). A crash screen styled
 * from `globals.css` would render unstyled in exactly the case it exists for — the worst-looking
 * screen in the app appearing at the worst moment.
 *
 * The palette is `MiloErrorBoundary`'s, deliberately: a child who hits either one should not be
 * able to tell which boundary caught it.
 */
import React from 'react'

export const CRASH_UI = {
  page: {
    minHeight: '100dvh',
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(180deg, #FFF4D6 0%, #FCEAB6 100%)',
    padding: 24, gap: 18, textAlign: 'center' as const,
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
}

const BTN = {
  border: 'none', borderRadius: 50, cursor: 'pointer',
  padding: '15px 34px', fontSize: 17, fontWeight: 800,
  fontFamily: 'inherit',
  /** ⚠️ 44px is the tap floor this repo holds everywhere; a crash screen is not the place to
   *  discover a child cannot hit the way out. */
  minHeight: 52, minWidth: 160,
}

export function CrashScreen({
  title, body, primary, secondary, digest, style,
}: {
  title: string
  body: string
  primary: { label: string; onClick: () => void }
  secondary: { label: string; href: string }
  digest?: string
  style: React.CSSProperties
}) {
  return (
    <div style={style}>
      <div style={{ fontSize: 72, lineHeight: 1 }} aria-hidden>🦊</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F26B2C', margin: 0 }}>{title}</h1>
      <p style={{ fontSize: 16, color: '#7a6a55', maxWidth: 340, margin: 0, lineHeight: 1.5 }}>{body}</p>

      {/* ⚠️ TWO WAYS OUT, because the first one can fail. `retry()` re-renders the segment, which
          fixes a transient error and does nothing at all for a deterministic one — and a screen
          whose only control does nothing is a dead end. The link always works. */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
        <button onClick={primary.onClick} style={{ ...BTN, background: 'linear-gradient(135deg, #F26B2C 0%, #e05a1f 100%)', color: '#fff' }}>
          {primary.label}
        </button>
        <a href={secondary.href} style={{ ...BTN, background: '#fff', color: '#F26B2C', border: '2px solid #F26B2C', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {secondary.label}
        </a>
      </div>

      {/**
        * ⚠️ THE DIGEST IS SHOWN, AND THE MESSAGE AND STACK ARE NOT. Next deliberately replaces a
        * server error's message with this hash in production to avoid leaking internals, and it is
        * the one string that lets support match a parent's screenshot to the server log. It is
        * small, grey and unexplained to a child, and it is the difference between "it broke" and a
        * fixable report.
        */}
      {digest && (
        <code style={{ fontSize: 11, color: '#9c8d78', letterSpacing: 0.5, marginTop: 4, opacity: 0.85 }}>
          {digest}
        </code>
      )}
    </div>
  )
}
