import { NextResponse } from 'next/server'

// Liveness/uptime probe. Deliberately SHALLOW — returns 200 whenever the app process is
// serving, with NO database call. A liveness check must not depend on Supabase, or a brief
// DB hiccup would make every instance look "unhealthy" and trigger needless restarts/alerts.
// Used by: the nightly e2e (waits for the server), the old-domain redirect spec and the runbooks' uptime checks
// (docs/runbooks/deploy.md → uptime checker).
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    { status: 'ok', service: 'milo-web', ts: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
