'use client'
import { useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getCurrentSession } from '@/data/auth'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    async function check() {
      const session = await getCurrentSession()
      // Signed-in → the /parent hub (loads their learners / empty state on its own).
      // Cold visitor → the CHECKUP is the mandatory front door (it carries a "Log in" button up top
      // for returning users). This makes the diagnostic the entry point, not an optional funnel.
      router.replace(session ? '/parent' : '/diagnostic')
    }
    check()
  }, [router])

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#FCEAB6',
    }}>
      <Image src="/assets/characters/milo-happy.png" alt="Milo" width={80} height={80} priority
        style={{ objectFit: 'contain', animation: 'bounce 1s ease-in-out infinite' }} />
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}`}</style>
    </div>
  )
}