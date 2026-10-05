'use client'

import React from 'react'
import { installErrorCapture } from '@/infra/storage/lastError'
import { reportCrash } from '@/infra/reportCrash'
import { CRASH_UI, CrashScreen } from '@/shared/ui/CrashScreen'

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
    console.error('[Radlic Error]', error, errorInfo)
    // ⚠️ ONE report path, shared with `app/error.tsx` and `app/global-error.tsx` — see
    // `infra/reportCrash.ts`. It keeps the local breadcrumb (what travels to support in the
    // parent's diagnostic block) AND posts to the monitoring sink, and it can never throw.
    reportCrash(error, 'react', { componentStack: errorInfo?.componentStack ?? undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      // ⚠️ NOT /parent: that is behind the parent PIN, so a child sent there after a crash could not get back
      // (2026-10-05). The same two ways out as app/error.tsx: try this screen again, or the child's lessons.
      return (
        <>
          <CrashScreen
            title="Oops! Something went wrong"
            body="Don't worry — your progress is saved!"
            primary={{ label: 'Try again', onClick: () => window.location.reload() }}
            secondary={{ label: 'Go back home', href: '/modules' }}
            style={CRASH_UI.page}
          />
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
        </>
      )
    }

    return this.props.children
  }
}