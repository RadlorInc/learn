'use client'
/**
 * Vercel Speed Insights (2026-10-16): Web Vitals from real devices, so first paint is measured where the families are
 * rather than guessed. Same origin — the script and its reports are `/_vercel/speed-insights/*` on this domain, so the
 * CSP's `'self'` covers them and no new host is contacted. The address goes as its PATH only: consent links carry a
 * token in `#t=` and some pages read `?` parameters, and neither is Vercel's business.
 */
import { SpeedInsights as Vercel } from '@vercel/speed-insights/next'

export const pathOnly = (url: string) => url.split(/[?#]/)[0]

export default function SpeedInsights() {
  return <Vercel beforeSend={e => ({ ...e, url: pathOnly(e.url) })} />
}
