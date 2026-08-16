'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSession } from '@/data/auth'

/**
 * The only client-side thing `/` does: if a parent is already signed in, send them to their
 * dashboard instead of making them read the pitch again.
 *
 * ⚠️ IT RENDERS NOTHING, AND THAT IS THE POINT. This used to be the whole page — a splash plus a
 * `router.replace` — which meant the marketing content could not exist, because the redirect owned
 * the render. Isolated here, the page is static HTML that a crawler and a link preview can read,
 * and the redirect is a side effect on top of it.
 *
 * The session lives in localStorage under Supabase's own `milo-auth` key, so the server cannot know
 * about it and a signed-in parent sees this page for one beat before moving. That flash is
 * unavoidable without a cookie-based session, and it is a better one than the fox: it is the real
 * page, and if the redirect ever fails they can still use it.
 */
export default function ResumeSignedIn() {
  const router = useRouter()
  useEffect(() => {
    let cancelled = false
    getCurrentSession()
      .then(session => { if (session && !cancelled) router.replace('/parent') })
      .catch(() => { /* signed out, or offline — the page below is the right thing to show */ })
    return () => { cancelled = true }
  }, [router])
  return null
}
