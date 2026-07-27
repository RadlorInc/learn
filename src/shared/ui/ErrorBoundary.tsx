'use client'

import React from 'react'
import { installErrorCapture, recordError } from '@/infra/storage/lastError'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'

interface State {
  hasError:  boolean
  error:     Error | null
  errorInfo: React.ErrorInfo | null
}

export class MiloErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  // App-wide capture of the errors this boundary never sees — plain throws outside render and
  // unhandled promise rejections. Idempotent, so a remount is harmless.
  componentDidMount() {
    installErrorCapture()
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    console.error('[Milo Error]', error, errorInfo)
    // Keep a local breadcrumb even if the network report below never lands — this is what
    // travels to support in the diagnostic block when the parent reports the problem.
    recordError(error, 'react')
    // Report to the monitoring sink (forwards to Sentry/Logtail when configured; else Vercel logs).
    // Best-effort + guarded — a failed report must never mask the original error.
    try {
      void fetch('/api/report-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          message: error?.message,
          stack: error?.stack,
          componentStack: errorInfo?.componentStack,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          // WHO it happened to. Without this a log is a pile of stack traces that cannot be
          // matched to the parent who wrote in. Read synchronously from sessionStorage — an
          // async session lookup would race the navigation a crash usually triggers, and
          // learner → owning account is one join away in the DB anyway.
          learnerId: getActiveLearner()?.id,
        }),
      }).catch(() => {})
    } catch { /* ignore */ }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(180deg, #FFF4D6 0%, #FCEAB6 100%)',
          padding: 24, gap: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 72 }}>🦊</div>
          <h1 style={{
            fontSize: 24, fontWeight: 800,
            color: '#F26B2C', margin: 0,
          }}>
            Oops! Something went wrong
          </h1>
          <p style={{
            fontSize: 16, color: '#888',
            maxWidth: 320, margin: 0, lineHeight: 1.5,
          }}>
            Milo bumped into a problem. Don't worry — your progress is saved!
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null })
              window.location.href = '/parent'
            }}
            style={{
              background: 'linear-gradient(135deg, #F26B2C 0%, #e05a1f 100%)',
              color: '#fff', border: 'none', borderRadius: 50,
              padding: '14px 32px', fontSize: 16, fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Go back home
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: 16, textAlign: 'left', maxWidth: 480,
              background: '#FEE2E2', borderRadius: 12, padding: 16,
              fontSize: 12, color: '#991B1B', whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700, marginBottom: 8 }}>
                Error details (dev only)
              </summary>
              {this.state.error.toString()}
              {this.state.errorInfo?.componentStack}
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}