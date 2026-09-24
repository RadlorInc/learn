'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSession } from '@/data/auth'
import { LANDING_URL } from './site'

/**
 * The only thing `/` does: send a signed-in user home, and a signed-out visitor to the landing page on radlor.com
 * (founder's decision, 2026-09-25). Rendered by `/` ONLY — no other route may send anyone away
 * (`landingRedirect.test.ts` holds that).
 *
 * ⚠️ IN THE BROWSER, NOT A 308, AND THAT IS FORCED: the session is in localStorage under Supabase's `milo-auth` key,
 * so the server cannot tell the two visitors apart, and a server redirect would send signed-in parents away too.
 * ⚠️ ONLY A DEFINITE "NO SESSION" LEAVES. If the check throws (offline, storage blocked) the visitor stays on the
 * fallback page, which links to both — a signed-in child offline must not be bounced to a marketing page.
 */
/** Opened from the home screen (the manifest's start_url is `/`, display `fullscreen`), not in a browser tab. */
const installed = () =>
  ['fullscreen', 'standalone', 'minimal-ui'].some(m => window.matchMedia?.(`(display-mode: ${m})`).matches) ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

export default function ResumeSignedIn() {
  const router = useRouter()
  useEffect(() => {
    let cancelled = false
    getCurrentSession()
      .then(session => {
        if (cancelled) return
        if (session) router.replace('/parent')
        else if (installed()) router.replace('/auth')   // the home-screen app starts here: never out to a web page
        else window.location.replace(LANDING_URL)
      })
      .catch(() => { /* could not tell — stay on the fallback page */ })
    return () => { cancelled = true }
  }, [router])
  return null
}
