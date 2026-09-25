'use client'
/**
 * /play — games are COMING SOON. Founder, 2026-09-26: a child bought minutes here, got "Time's up!" over an empty
 * placeholder, and lost the points. So this page shows the points and never spends them: it does not call
 * `start_game_time` at all. When a game is attached, the spending screen comes back from git history
 * (`git log -- src/app/play/page.tsx`) together with the game.
 */
import Link from 'next/link'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { getWallet, type Wallet } from '@/data/repositories/points'
import { PAGE_BG, pill, shell, topBar } from '@/features/lessons/Pictures'
import { bubble, idea } from '@/features/lessons/Frame'

const link = { ...pill, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' } as const
const COPY = {
  soon: 'Games are coming soon!',
  kept: 'Your points are saved. Nothing is taken away. Keep practicing to earn more!',
}

const noSubscribe = () => () => {}

export default function PlayPage() {
  // The active learner lives in sessionStorage, which only exists in the browser.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  const learnerId = mounted ? getActiveLearner()?.id ?? null : undefined
  const [wallet, setWallet] = useState<Wallet | 'unavailable' | null>(null)
  useEffect(() => { if (learnerId) getWallet(learnerId).then(setWallet) }, [learnerId])
  const points = wallet && wallet !== 'unavailable' ? wallet.balance : null

  return (
    <div style={{ minHeight: '100dvh', background: PAGE_BG, padding: '14px 14px 26px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ ...shell, maxWidth: 900, alignSelf: 'flex-start' }}>
        <div style={topBar}>
          <Link href="/modules" style={link}>← Lessons</Link>
          <span style={{ fontSize: 'clamp(16px, 3.6vw, 20px)' }}>Game time</span>
          <span />
        </div>
        <main style={{ padding: 'clamp(14px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
          <p style={{ ...idea, fontSize: 'clamp(26px, 5vw, 38px)' }}>🎮 {COPY.soon}</p>
          {points !== null && <p style={{ ...bubble, fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900 }}>{points} points</p>}
          <p style={bubble}>{COPY.kept}</p>
        </main>
      </div>
    </div>
  )
}
