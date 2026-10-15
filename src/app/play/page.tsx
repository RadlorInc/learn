'use client'
/**
 * /play — the child spends points on game time (rules: docs/product/points.md). Everything that decides whether the
 * game may start — the balance, the parent's daily minutes, on/off — is decided by the database (`start_game_time`);
 * this page shows the wallet and opens the game the child picked full page until the end time the database returned:
 * BlockCraft (public/blockcraft, built from blockcraft/), BeatHop (public/beathop), Peak Rider (public/peak) or Rescue
 * Rush (public/rush), the last three copied from beathop/, peak/ and rush/. The paid time is for any of them, and the child can switch while it lasts. A game saves on this device and comes back here when
 * the time is up; for BlockCraft this page then uploads that save to the child's account (`loadGameSave`), so the next
 * game starts where this one stopped. The other two keep their saves on the device (gameSave.ts).
 */
import Link from 'next/link'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { endGameTime, getWallet, startGameTime, type Wallet } from '@/data/repositories/points'
import { loadGameSave, openGame, type GameId } from '@/data/repositories/gameSave'
import { INK, PAGE_BG, pill, shell, topBar } from '@/features/lessons/Pictures'
import { bubble, idea, primary } from '@/features/lessons/Frame'

const CHOICES = [5, 10, 15]
const GAMES: { id: GameId; name: string; about: string }[] = [
  { id: 'blockcraft', name: '🧱 BlockCraft', about: 'Build your own world' },
  { id: 'beathop', name: '🏃 BeatHop', about: 'Jump, glide and flip to the flag' },
  { id: 'peak', name: '🏔️ Peak Rider', about: 'Rough roads, deep gaps: keep your car on its wheels' },
  { id: 'rush', name: '🚨 Rescue Rush', about: 'Race the clock to the hospital' },
]
const link = { ...pill, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' } as const
const NOT_STARTED: Record<string, string> = {
  off: 'Game time is switched off right now. Ask your grown-up.',
  daily_limit: "That's all the game time for today. Come back tomorrow!",
  not_enough_points: 'You need a few more points. Practice a topic to earn them!',
  failed: "The game couldn't start. Try again.",
  unreachable: "We couldn't load your game. Check the internet and try again.",
  notStopped: "We couldn't stop the game. Check the internet and try again.",
}
// Said every time, refund or not: a stop that gives nothing back looked like a stop that did nothing (2026-10-01).
const stopped = (back: number | null) => back === null ? NOT_STARTED.notStopped
  : back > 0 ? `Game stopped. ${back} points are back!`
  : 'Game stopped. You played all the time you paid for.'

const noSubscribe = () => () => {}

export default function PlayPage() {
  // The active learner lives in sessionStorage, which only exists in the browser.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  const learnerId = mounted ? getActiveLearner()?.id ?? null : undefined
  const [wallet, setWallet] = useState<Wallet | 'unavailable' | null | undefined>(undefined)
  const [note, setNote] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  // Back from a game (`/play?game=beathop`): the pick stays that game. Read once; nothing renders it before mount.
  const [game, setGame] = useState<GameId>(() => {
    const back = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('game') : null
    return GAMES.find(g => g.id === back)?.id ?? 'blockcraft'
  })

  const load = useCallback((id: string) => getWallet(id).then(setWallet), [])
  // Back from the game: its save is on this device and newer than the account's, so this uploads it. The game's
  // "Stop and keep my minutes" lands here as ?stop=1: the time is stopped first, so the wallet shows what came back.
  useEffect(() => {
    if (!learnerId) return
    void loadGameSave(learnerId)
    if (new URLSearchParams(location.search).has('stop')) {
      history.replaceState(null, '', '/play')
      endGameTime(learnerId).then((back) => { setNote(stopped(back)); return load(learnerId) })
    } else load(learnerId)
  }, [learnerId, load])
  // Back from a game with the browser's Back: the browser can show this page from its back-forward cache, frozen at the
  // moment Play was pressed — the old balance and no clock (founder's audit, 12 Oct). Read it all again.
  useEffect(() => {
    if (!learnerId) return
    const back = (e: PageTransitionEvent) => { if (e.persisted) { void loadGameSave(learnerId); load(learnerId) } }
    addEventListener('pageshow', back)
    return () => removeEventListener('pageshow', back)
  }, [learnerId, load])

  async function stop() {
    if (!learnerId) return
    setNote(stopped(await endGameTime(learnerId)))
    await load(learnerId)
  }

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
    if (!r.ok) { setNote(NOT_STARTED[r.error] ?? NOT_STARTED.failed); return void load(learnerId) }
    await play()
  }
  async function play() {
    if (learnerId && await openGame(learnerId, game) === 'unreachable') { setNote(NOT_STARTED.unreachable); await load(learnerId) }
  }

  const picker = (
    <div role="radiogroup" aria-label="Pick a game" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {GAMES.map(g => (
        <button key={g.id} type="button" role="radio" aria-checked={game === g.id} aria-label={`${g.name.slice(g.name.indexOf(' ') + 1)}: ${g.about}`} onClick={() => setGame(g.id)}
          style={{ ...primary, background: game === g.id ? primary.background : '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span>{g.name}</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{g.about}</span>
        </button>
      ))}
    </div>
  )
  const gameName = GAMES.find(g => g.id === game)!.name

  let body
  if (learnerId === undefined || wallet === undefined && learnerId) body = null
  else if (!learnerId) body = <p style={bubble}>Ask your grown-up to open your lessons first.</p>
  else if (wallet === 'unavailable') body = <p style={bubble}>Game time is coming soon!</p>
  else if (!wallet) body = <><p style={bubble}>We couldn&apos;t load your points. Check the internet and try again.</p>
    <button type="button" style={primary} onClick={() => load(learnerId)}>Try again</button></>
  else if (playing) {
    const left = Math.max(0, Math.ceil((until - now) / 1000))
    body = <>
      <p style={{ ...idea, fontVariantNumeric: 'tabular-nums' }}>⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} left</p>
      {picker}
      <button type="button" style={primary} onClick={() => play()}>Play {gameName}</button>
      <button type="button" style={{ ...primary, background: '#fff' }} onClick={stop}>Stop and keep my minutes</button>
      {note && <p style={bubble}>{note}</p>}
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
        : <>{picker}<div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {choices.map(m => <button key={m} type="button" style={primary} onClick={() => start(m)}>Play {m} minute{m === 1 ? '' : 's'} · {m * perMin} points</button>)}
          </div></>}
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
