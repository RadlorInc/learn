'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSession, onAuthStateChange } from '@/data/auth'
import { getMyRole, homeForRole } from '@/data/repositories'
import { makeT, useSavedLang } from '@/features/dashboard/i18n'

export default function AuthCallbackPage() {
  const router = useRouter()
  const t      = makeT(useSavedLang())
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
            // ⚠️ NO LOGGING HERE ANY MORE. It used to log, and the early return above — which fires
            // when a session already exists, i.e. almost always, because supabase-js processes the
            // OAuth hash during client construction — meant this line was usually never reached.
            // The global listener in infra/AuthEventLogger records the sign-in wherever it happens.
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
      background: 'linear-gradient(180deg, #EAF5FE 0%, #EFF8FF 100%)',
      gap: 16,
    }}>
      <p style={{ fontSize: 16, fontWeight: 600, color: '#3D6FB8' }}>{t('Signing you in…')}</p>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }`}</style>
    </div>
  )
}