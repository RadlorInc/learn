'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getCurrentSession, onAuthStateChange, logAuthEvent } from '@/data/auth'
import { getMyRole, homeForRole } from '@/data/repositories'

export default function AuthCallbackPage() {
  const router = useRouter()
  const ran    = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    // Land on the role's home (teacher → grades, parent → dashboard). A brand-new signup has no role
    // yet → homeForRole(null) sends them to /parent, where the one-time Teacher/Parent picker shows.
    async function goHome() {
      router.replace(homeForRole(await getMyRole()))
    }

    async function handleCallback() {
      // Try existing session first
      const session = await getCurrentSession()
      if (session?.user) {
        await goHome()
        return
      }

      // Wait for OAuth exchange
      const { subscription } = onAuthStateChange(
        (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
            subscription.unsubscribe()
            // A session materialising HERE is a fresh sign-in (OAuth exchange or the
            // email-confirmation landing) — password logins log inside signInWithEmail
            // and never route through this exchange wait, so no double-log.
            void logAuthEvent('login', session.user.id)
            goHome()
          }
        }
      )

      // 5s fallback
      window.setTimeout(async () => {
        const session = await getCurrentSession()
        if (session?.user) {
          await goHome()
        } else {
          router.replace('/auth')
        }
      }, 5000)
    }

    handleCallback()
  }, [router])

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #FFF4D6 0%, #FCEAB6 100%)',
      gap: 16,
    }}>
      <Image
        src="/assets/characters/milo-happy.png"
        alt="Milo"
        width={80}
        height={80}
        priority
        style={{ objectFit: 'contain', animation: 'bounce 1s ease-in-out infinite' }}
      />
      <p style={{ fontSize: 16, fontWeight: 600, color: '#888' }}>Signing you in...</p>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }`}</style>
    </div>
  )
}