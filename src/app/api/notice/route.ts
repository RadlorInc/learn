import { NextResponse } from 'next/server'
import { noticeFrom } from '@/core/outageNotice'

/**
 * The outage notice's switch, read on every request. No Supabase call, so it still answers while the database is
 * down, which is when it is needed. A server variable, not `NEXT_PUBLIC_`: the pages stay static, and a device on a
 * cached shell still asks (sw.js never caches `/api/*`). On Vercel a changed variable reaches only the NEXT
 * deployment, so turning it on or off is a redeploy (docs/runbooks/outages.md → the notice switch).
 * ponytail: a redeploy takes minutes; a Vercel Edge Config read here would make it seconds, if that ever matters.
 */
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({ notice: noticeFrom(process.env.OUTAGE_NOTICE) }, { headers: { 'Cache-Control': 'no-store' } })
}
