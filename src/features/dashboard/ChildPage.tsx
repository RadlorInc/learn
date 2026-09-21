'use client'
/**
 * Everything about one child in one place (founder, 2026-09-21): Progress · Lessons · Game time · Login & data.
 * These used to be spread over the Learners, Performance, Lesson library and Assign lessons screens, each of which made
 * the parent pick the child again. Each tab is its own URL (`?child=<id>&tab=…`), so the browser's Back works.
 */
import Link from 'next/link'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { Performance } from '@/features/lessons/Performance'
import type { Wallet } from '@/data/repositories'
import { LessonsTab, type SaveResult } from './LessonsTab'
import { dbtn, dghost, dcard } from './Helpers'

export const CHILD_TABS = [['progress', 'Progress'], ['lessons', 'Lessons'], ['game', 'Game time'], ['login', 'Login & data']] as const
export type ChildTab = typeof CHILD_TABS[number][0]

export function Tabs({ base, tabs, on }: { base: string; tabs: readonly (readonly [string, string])[]; on: string }) {
  return (
    <nav className="dash-tabs" aria-label="Sections" style={{ '--cols': tabs.length === 4 ? 2 : 3 } as CSSProperties}>
      {tabs.map(([k, t]) => <Link key={k} href={`${base}&tab=${k}`} data-tour={`tab-${k}`} aria-current={k === on ? 'page' : undefined}>{t}</Link>)}
    </nav>
  )
}

export function ChildPage({ id, name, avatar, tab, crumb, owner, lessonIds, due, isDone, login, wallet, onLaunch, onSaveLessons, onSaveGame, onLogin, dataRights }: {
  id: string; name: string; avatar: string; tab: ChildTab; crumb: { href: string; label: string }; owner: boolean
  lessonIds: string[] | null; due: Record<string, string>; isDone: (lessonId: string) => boolean
  login: string | null | undefined; wallet: Wallet | 'unavailable' | null | undefined
  onLaunch: () => void; onSaveLessons: (ids: string[] | null, due: Record<string, string>) => Promise<SaveResult>
  onSaveGame: (enabled: boolean, minutes: number) => Promise<void>; onLogin: () => void
  /** Download + delete, rendered by the page (it owns the delete flow and the export bundle). */
  dataRights: ReactNode
}) {
  const base = `/parent?child=${id}`
  return <>
    <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 800 }}>
      <Link href={crumb.href} style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>{crumb.label}</Link>
      <span style={{ color: 'var(--ink-muted)' }}> › {name}</span></p>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <img src={avatar} alt="" width={48} height={48} style={{ borderRadius: 14, objectFit: 'cover', background: 'var(--milo-orange-soft)' }} />
        <h1 style={{ margin: 0, fontSize: 30, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{name}</h1>
      </div>
      <button type="button" style={dbtn} data-tour="start-learning" onClick={onLaunch}>▶ Start learning</button>
    </div>
    <Tabs base={base} tabs={CHILD_TABS} on={tab} />

    {tab === 'progress' && <Performance learners={[{ id, name, lessonIds, due }]} lessonsHref={`${base}&tab=lessons`} />}
    {tab === 'lessons' && <LessonsTab name={name} ids={lessonIds} due={due} canEdit={owner} isDone={isDone} onSave={onSaveLessons} />}
    {tab === 'game' && <GameTimeCard name={name} wallet={wallet} canEdit={owner} onSave={onSaveGame} />}
    {tab === 'login' && (
      <div className="card-grid">
        <section style={dcard} data-tour="login-card">
          <h2 style={h2}>{name}&apos;s login</h2>
          <p style={{ margin: '6px 0 12px', color: 'var(--ink-soft)' }}>
            {login ? <>Username <b style={{ color: 'var(--ink)' }}>{login}</b>. {name} signs in with it on any device and goes straight to their lessons.</>
              : login === undefined ? `${name} has no login yet. With one, they can sign in on any device and go straight to their lessons.`
              : 'Set a username and password so they can sign in on any device.'}
          </p>
          {owner ? <button type="button" style={login === undefined ? dbtn : dghost} onClick={onLogin}>{login === undefined ? 'Set a login' : 'Change login or password'}</button>
            : <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)', fontWeight: 700 }}>Only the adult who added {name} can change it.</p>}
        </section>
        <section style={dcard} data-tour="share-card">
          <h2 style={h2}>Share with another adult</h2>
          <p style={{ margin: '6px 0 12px', color: 'var(--ink-soft)' }}>Let a partner or grandparent see {name}&apos;s progress with their own sign-in.</p>
          <Link href="/parent/invites" style={dghost}>Invite someone</Link>
        </section>
        <section style={dcard} data-tour="data-card">{dataRights}</section>
      </div>
    )}
  </>
}

const h2: CSSProperties = { margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--ink)' }

/** Points and the parent's game-time rules for one child. Only the owning adult can change the rules (the database checks). */
function GameTimeCard({ name, wallet, canEdit, onSave }: {
  name: string; wallet: Wallet | 'unavailable' | null | undefined; canEdit: boolean; onSave: (enabled: boolean, minutes: number) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const save = async (enabled: boolean, minutes: number) => { setSaving(true); await onSave(enabled, minutes); setSaving(false) }
  const P = { ink: 'var(--ink)', ink2: 'var(--ink-soft)', ink3: 'var(--ink-muted)', edge: 'var(--card-border)', page: 'var(--paper)' }
  return (
    <div style={{ ...dcard, maxWidth: 640 }} data-tour="game-card">
      <h2 style={{ ...h2, marginBottom: 10 }}>🎮 Game time</h2>
      {wallet === undefined ? <p style={{ margin: 0, fontSize: 13, color: P.ink3 }}>Loading…</p>
        : wallet === 'unavailable' ? <p style={{ margin: 0, fontSize: 13, color: P.ink3 }}>Points and game time are coming soon.</p>
        : wallet === null ? <p style={{ margin: 0, fontSize: 13, color: P.ink3 }}>Could not load {name}&apos;s points. Refresh to try again.</p>
        : <>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
            <div><div style={{ fontSize: 26, fontWeight: 900, color: P.ink }}>{wallet.balance}</div><div style={{ fontSize: 12, color: P.ink3, fontWeight: 600 }}>points</div></div>
            <div><div style={{ fontSize: 26, fontWeight: 900, color: P.ink }}>{wallet.minutes_used_today} / {wallet.minutes_per_day}</div><div style={{ fontSize: 12, color: P.ink3, fontWeight: 600 }}>minutes played today</div></div>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: P.ink2, lineHeight: 1.45 }}>
            {name} earns points by practising and spends {wallet.points_per_minute} points for each minute of game.
          </p>
          {canEdit ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button disabled={saving} onClick={() => save(!wallet.enabled, wallet.minutes_per_day)}
                style={{ padding: '10px 14px', minHeight: 44, borderRadius: 10, border: `1.5px solid ${P.edge}`, background: wallet.enabled ? '#d9f7e6' : P.page, color: P.ink, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                Game time: {wallet.enabled ? 'On' : 'Off'}
              </button>
              <label style={{ fontSize: 14, fontWeight: 700, color: P.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                Most per day
                <select disabled={saving} value={wallet.minutes_per_day} onChange={e => save(wallet.enabled, Number(e.target.value))}
                  style={{ minHeight: 44, borderRadius: 10, border: `1.5px solid ${P.edge}`, padding: '0 10px', fontSize: 14, fontWeight: 700 }}>
                  {[...new Set([10, 15, 20, 30, 45, 60, wallet.minutes_per_day])].sort((a, b) => a - b).map(m => <option key={m} value={m}>{m} minutes</option>)}
                </select>
              </label>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: P.ink3 }}>Game time is {wallet.enabled ? 'on' : 'off'}. The adult who added {name} can change it.</p>
          )}
        </>}
    </div>
  )
}

/** A child's card on the parent's home: their next lesson, how far along, Start learning and Open. */
export function ChildCard({ id, name, avatar, lastPlayed, next, done, total, onStart }: {
  id: string; name: string; avatar: string; lastPlayed: string; next: string | null; done: number; total: number; onStart: () => void
}) {
  const dt: CSSProperties = { color: 'var(--ink-muted)', fontWeight: 800 }, dd: CSSProperties = { margin: 0, fontWeight: 700, color: 'var(--ink)' }
  return (
    <article style={dcard} data-tour={`child-${id}`}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <img src={avatar} alt="" width={48} height={48} style={{ borderRadius: 14, objectFit: 'cover', background: 'var(--milo-orange-soft)' }} />
        <div><h2 style={{ ...h2, fontSize: 20 }}>{name}</h2><span style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 700 }}>last played {lastPlayed}</span></div>
      </div>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', margin: '12px 0', fontSize: 14 }}>
        <dt style={dt}>Next lesson</dt><dd style={dd}>{next ?? 'All finished 🎉'}</dd>
        <dt style={dt}>Done</dt><dd style={dd}>{done} of {total} lessons</dd>
      </dl>
      <div role="img" aria-label={`${done} of ${total} lessons done`} style={{ height: 10, background: '#f1e6d3', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${total ? Math.round(100 * done / total) : 0}%`, background: 'var(--milo-orange)', borderRadius: 99 }} />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        <button type="button" style={dbtn} onClick={onStart}>▶ Start learning</button>
        <Link href={`/parent?child=${id}`} style={dghost}>Open {name}</Link>
      </div>
    </article>
  )
}
