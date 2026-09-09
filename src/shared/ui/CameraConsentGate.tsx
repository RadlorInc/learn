'use client'
/**
 * The route-level camera guard. A chapter that answers with the camera does not render at all to a
 * visitor with no account — see `src/core/arChapters.ts` for why, and for the measurement that made
 * it urgent.
 *
 * ⚠️ IT REFUSES THE RENDER, IT DOES NOT DISABLE A BUTTON. A locked tile invites a tap; a chapter
 * that is present-but-crippled invites one too, and it also shows the band's speciality with its
 * point removed. Nothing of the chapter mounts, so there is no camera control to find, no MediaPipe
 * to load, and no `getUserMedia` to reach.
 *
 * ⚠️ FAIL CLOSED WHILE THE SESSION IS UNKNOWN. `getSession()` is async, and rendering the chapter
 * "until we find out" is a race that resolves the wrong way on a slow device — which is the only
 * way this guard could ever fail. `checking` renders nothing.
 *
 * ⚠️ THE SESSION IS ONLY CONSULTED FOR AN AR CHAPTER. Every other chapter answers `allowed`
 * synchronously, so the logged-out taste path — the whole conversion funnel — pays nothing.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/data/supabase/client'
import { isArChapter } from '@/core/arChapters'

export type ChapterAccess = 'checking' | 'allowed' | 'blocked'

export function useChapterAccess(chapterId: string | null): ChapterAccess {
  // null = not asked yet. Only an AR chapter ever asks.
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const guarded = !!chapterId && isArChapter(chapterId)

  useEffect(() => {
    if (!guarded) return
    let live = true
    createClient().auth.getSession()
      .then(({ data }) => { if (live) setSignedIn(!!data.session) })
      // A failed session lookup is not a reason to open a camera.
      .catch(() => { if (live) setSignedIn(false) })
    return () => { live = false }
  }, [guarded, chapterId])

  // ⚠️ DERIVED DURING RENDER, not assigned from inside the effect. An effect runs after paint, so
  // setting the verdict there paints one frame of the previous chapter's answer — which on this
  // guard means one frame of an AR chapter for a visitor who is about to be refused. The repo's
  // own rule for a journey's phase, and it matters far more here.
  return !guarded ? 'allowed' : signedIn === null ? 'checking' : signedIn ? 'allowed' : 'blocked'
}

/**
 * What a blocked visitor sees. It is a conversion surface, not an error: this chapter is the band's
 * speciality and wanting it is the reason to sign up. It never says "locked" — the honest sentence
 * is that the camera needs a grown-up, which is also true.
 */
export function CameraConsentCard() {
  return (
    <main style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: '#FCEAB6', fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        maxWidth: 460, textAlign: 'center', background: '#fff', borderRadius: 20,
        padding: '30px 26px', boxShadow: '0 10px 30px rgba(60,42,20,.14)',
      }}>
        <div style={{ fontSize: 44, lineHeight: 1 }}>✋</div>
        <h1 style={{ fontSize: 22, margin: '14px 0 8px', color: '#3c2a14' }}>
          This one is played with your hands
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: '#6b5a42', margin: '0 0 20px' }}>
          Milo counts your child&rsquo;s fingers through the camera. We only ever turn a camera on
          after a grown-up has made an account, so we know who to ask.
        </p>
        <Link href="/auth" style={{
          display: 'inline-block', background: '#F26B2C', color: '#fff', fontWeight: 800,
          fontSize: 15, borderRadius: 50, padding: '12px 26px', textDecoration: 'none',
        }}>Create a free account →</Link>
        <p style={{ fontSize: 13, lineHeight: 1.5, color: '#8a7a63', margin: '16px 0 0' }}>
          Plenty to play without it —{' '}
          <Link href="/diagnostic" style={{ color: '#F26B2C', fontWeight: 700 }}>
            find your child&rsquo;s starting point
          </Link>.
        </p>
      </div>
    </main>
  )
}
