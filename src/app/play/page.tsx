'use client'
/**
 * /play — the child spends points on game time (rules: docs/new-flow/points.md). Everything that decides whether the
 * game may start — the balance, the parent's daily minutes, on/off — is decided by the database (`start_game_time`);
 * this page only shows the wallet and runs the clock to the end time the database returned.
 */
import Link from 'next/link'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { getWallet, startGameTime, type Wallet } from '@/data/repositories/points'
import { INK, PAGE_BG, pill, shell, topBar } from '@/features/lessons/Pictures'
import { bubble, idea, primary } from '@/features/lessons/Frame'

const CHOICES = [5, 10, 15]
const link = { ...pill, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' } as const
const NOT_STARTED: Record<string, string> = {
  off: 'Game time is switched off right now. Ask your grown-up.',
  daily_limit: "That's all the game time for today. Come back tomorrow!",
  not_enough_points: 'You need a few more points. Practice a topic to earn them!',
  failed: "The game couldn't start. Try again.",
}

const noSubscribe = () => () => {}

export default function PlayPage() {
  // The active learner lives in sessionStorage, which only exists in the browser.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  const learnerId = mounted ? getActiveLearner()?.id ?? null : undefined
  const [wallet, setWallet] = useState<Wallet | 'unavailable' | null | undefined>(undefined)
  const [note, setNote] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const load = useCallback((id: string) => getWallet(id).then(setWallet), [])
  useEffect(() => { if (learnerId) load(learnerId) }, [learnerId, load])

  const until = wallet && wallet !== 'unavailable' && wallet.playing_until ? new Date(wallet.playing_until).getTime() : 0
  const playing = until > now
  // ponytail: the clock is the device's; a device clock minutes off the server's shortens or stretches one game by that much.
  useEffect(() => {
    if (!until) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [until])

  async function start(minutes: number) {
    if (!learnerId) return
    setNote(null)
    const r = await startGameTime(learnerId, minutes)
    if (!r.ok) setNote(NOT_STARTED[r.error] ?? NOT_STARTED.failed)
    await load(learnerId)
  }

  let body
  if (learnerId === undefined || wallet === undefined && learnerId) body = null
  else if (!learnerId) body = <p style={bubble}>Ask your grown-up to open your lessons first.</p>
  else if (wallet === 'unavailable') body = <p style={bubble}>Game time is coming soon!</p>
  else if (!wallet) body = <><p style={bubble}>We couldn&apos;t load your points. Check the internet and try again.</p>
    <button type="button" style={primary} onClick={() => load(learnerId)}>Try again</button></>
  else if (playing) {
    const left = Math.ceil((until - now) / 1000)
    body = <>
      <p style={{ ...idea, fontVariantNumeric: 'tabular-nums' }}>⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} left</p>
      {/* The game mounts here once its files are added (founder is sending them, 2026-09-17). */}
      <div style={{ flex: 1, minHeight: 320, border: `4px dashed ${INK}`, borderRadius: 20, display: 'grid', placeItems: 'center', background: '#fff', fontSize: 22, fontWeight: 800, color: INK }}>
        🎮 Your game goes here
      </div>
    </>
  } else {
    const perMin = wallet.points_per_minute
    const todayLeft = Math.max(0, wallet.minutes_per_day - wallet.minutes_used_today)
    const canAfford = Math.floor(wallet.balance / perMin)
    const most = Math.min(todayLeft, canAfford, 60)
    const choices = [...new Set([...CHOICES.filter(m => m <= most), ...(most > 0 && !CHOICES.includes(most) && most < 5 ? [most] : [])])].sort((a, b) => a - b)
    body = <>
      {until > 0 && <p style={idea}>Time&apos;s up! Great playing.</p>}
      <p style={{ ...bubble, fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 900, textAlign: 'center' }}>🎮 {wallet.balance} points</p>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: INK, textAlign: 'center' }}>
        {perMin} points = 1 minute of game · Today: {wallet.minutes_used_today} of {wallet.minutes_per_day} minutes played
      </p>
      {!wallet.enabled ? <p style={bubble}>{NOT_STARTED.off}</p>
        : todayLeft === 0 ? <p style={bubble}>{NOT_STARTED.daily_limit}</p>
        : canAfford === 0 ? <p style={bubble}>You need {perMin} points for a minute of game. Practice a topic to earn them!</p>
        : <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {choices.map(m => <button key={m} type="button" style={primary} onClick={() => start(m)}>Play {m} minute{m === 1 ? '' : 's'} · {m * perMin} points</button>)}
          </div>}
      {note && <p style={bubble}>{note}</p>}
      <p style={{ margin: 0, fontSize: 16, color: INK, textAlign: 'center' }}>Earn points: every practice problem, every level up, and every topic you finish or master.</p>
    </>
  }

  return (
    <div style={{ minHeight: '100dvh', background: PAGE_BG, padding: '14px 14px 26px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ ...shell, maxWidth: 900, alignSelf: 'flex-start' }}>
        <div style={topBar}>
          <Link href="/modules" style={link}>← Lessons</Link>
          <span style={{ fontSize: 'clamp(16px, 3.6vw, 20px)' }}>Game time</span>
          <span />
        </div>
        <main style={{ padding: 'clamp(14px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: 16 }}>{body}</main>
      </div>
    </div>
  )
}
