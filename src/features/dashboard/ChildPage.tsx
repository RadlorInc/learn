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
import { useT } from './i18n'

export const CHILD_TABS = [['progress', 'Progress'], ['lessons', 'Lessons'], ['game', 'Game time'], ['login', 'Login & data']] as const
export type ChildTab = typeof CHILD_TABS[number][0]

export function Tabs({ base, tabs, on }: { base: string; tabs: readonly (readonly [string, string])[]; on: string }) {
  const t = useT()
  return (
    <nav className="dash-tabs" aria-label={t('Sections')} style={{ '--cols': tabs.length === 4 ? 2 : 3 } as CSSProperties}>
      {tabs.map(([k, label]) => <Link key={k} href={`${base}&tab=${k}`} data-tour={`tab-${k}`} aria-current={k === on ? 'page' : undefined}>{t(label)}</Link>)}
    </nav>
  )
}

export function ChildPage({ id, name, avatar, tab, crumb, owner, lessonIds, due, isDone, login, wallet, onLaunch, onSaveLessons, onSaveGame, onLogin, onCorrect, dataRights }: {
  id: string; name: string; avatar: string; tab: ChildTab; crumb: { href: string; label: string }; owner: boolean
  lessonIds: string[] | null; due: Record<string, string>; isDone: (lessonId: string) => boolean
  login: string | null | undefined; wallet: Wallet | 'unavailable' | null | undefined
  onLaunch: () => void; onSaveLessons: (ids: string[] | null, due: Record<string, string>) => Promise<SaveResult>
  onSaveGame: (enabled: boolean, minutes: number) => Promise<void>; onLogin: () => void
  /** The parent's right to correct: a new name, and/or a grade (null = leave it). */
  onCorrect: (name: string, grade: number | null) => Promise<'ok' | 'error'>
  /** Download + delete, rendered by the page (it owns the delete flow and the export bundle). */
  dataRights: ReactNode
}) {
  const t = useT()
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
      <button type="button" style={dbtn} data-tour="start-learning" onClick={onLaunch}>▶ {t('Start learning')}</button>
    </div>
    <Tabs base={base} tabs={CHILD_TABS} on={tab} />

    {tab === 'progress' && <Performance learners={[{ id, name, lessonIds, due }]} lessonsHref={`${base}&tab=lessons`} />}
    {tab === 'lessons' && <LessonsTab name={name} ids={lessonIds} due={due} canEdit={owner} isDone={isDone} onSave={onSaveLessons} />}
    {tab === 'game' && <GameTimeCard name={name} wallet={wallet} canEdit={owner} onSave={onSaveGame} />}
    {tab === 'login' && (
      <div className="card-grid">
        <section style={dcard} data-tour="login-card">
          <h2 style={h2}>{t('{name}’s login', { name })}</h2>
          <p style={{ margin: '6px 0 12px', color: 'var(--ink-soft)' }}>
            {login ? <>{t('Username')} <b style={{ color: 'var(--ink)' }}>{login}</b>. {t('{name} signs in with it on any device and goes straight to their lessons.', { name })}</>
              : login === undefined ? t('{name} has no login yet. With one, they can sign in on any device and go straight to their lessons.', { name })
              : t('Set a username and password so they can sign in on any device.')}
          </p>
          {owner ? <button type="button" style={login === undefined ? dbtn : dghost} onClick={onLogin}>{login === undefined ? t('Set a login') : t('Change login or password')}</button>
            : <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)', fontWeight: 700 }}>{t('Only the adult who added {name} can change it.', { name })}</p>}
        </section>
        <section style={dcard} data-tour="share-card">
          <h2 style={h2}>{t('Share with another adult')}</h2>
          <p style={{ margin: '6px 0 12px', color: 'var(--ink-soft)' }}>{t('Let a partner or grandparent see {name}’s progress with their own sign-in.', { name })}</p>
          <Link href="/parent/invites" style={dghost}>{t('Invite someone')}</Link>
        </section>
        {owner && <section style={dcard} data-tour="correct-card"><CorrectCard key={name} name={name} onCorrect={onCorrect} /></section>}
        <section style={dcard} data-tour="data-card">{dataRights}</section>
      </div>
    )}
  </>
}

const h2: CSSProperties = { margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--ink)' }

/** Correct a child's name or grade — the parent right the documents promise and the app did not have. */
function CorrectCard({ name, onCorrect }: { name: string; onCorrect: (name: string, grade: number | null) => Promise<'ok' | 'error'> }) {
  const t = useT()
  const [value, setValue] = useState(name)
  const [grade, setGrade] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const field: CSSProperties = { minHeight: 44, borderRadius: 10, border: '1.5px solid var(--card-border)', padding: '0 10px', fontSize: 15, width: '100%', boxSizing: 'border-box' }
  async function save() {
    const trimmed = value.trim()
    if (!trimmed) return
    setBusy(true)
    const r = await onCorrect(trimmed, grade ? Number(grade) : null)
    setBusy(false)
    setMsg(r === 'ok' ? t('Saved.') : t('Could not save. Check your connection and try again.'))
  }
  return <>
    <h2 style={h2}>{t('Correct {name}’s details', { name })}</h2>
    <label style={{ display: 'block', margin: '10px 0', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{t('Name or nickname')}
      <input value={value} maxLength={30} onChange={e => setValue(e.target.value)} style={{ ...field, marginTop: 4 }} /></label>
    <label style={{ display: 'block', margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{t('Grade')}
      <select value={grade} onChange={e => setGrade(e.target.value)} style={{ ...field, marginTop: 4 }}>
        <option value="">{t('Keep the grade as it is')}</option>
        {[3, 4, 5, 6, 7, 8].map(g => <option key={g} value={g}>{t('Grade {n}', { n: g })}</option>)}
      </select></label>
    <button type="button" disabled={busy || !value.trim()} onClick={save} style={dbtn}>{t('Save')}</button>
    {msg && <p role="status" style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-soft)', fontWeight: 700 }}>{msg}</p>}
  </>
}

/** Points and the parent's game-time rules for one child. Only the owning adult can change the rules (the database checks). */
function GameTimeCard({ name, wallet, canEdit, onSave }: {
  name: string; wallet: Wallet | 'unavailable' | null | undefined; canEdit: boolean; onSave: (enabled: boolean, minutes: number) => Promise<void>
}) {
  const t = useT()
  const [saving, setSaving] = useState(false)
  const save = async (enabled: boolean, minutes: number) => { setSaving(true); await onSave(enabled, minutes); setSaving(false) }
  const P = { ink: 'var(--ink)', ink2: 'var(--ink-soft)', ink3: 'var(--ink-muted)', edge: 'var(--card-border)', page: 'var(--paper)' }
  return (
    <div style={{ ...dcard, maxWidth: 640 }} data-tour="game-card">
      <h2 style={{ ...h2, marginBottom: 10 }}>🎮 {t('Game time')}</h2>
      {wallet === undefined ? <p style={{ margin: 0, fontSize: 13, color: P.ink3 }}>{t('Loading…')}</p>
        : wallet === 'unavailable' ? <p style={{ margin: 0, fontSize: 13, color: P.ink3 }}>{t('Points and game time are coming soon.')}</p>
        : wallet === null ? <p style={{ margin: 0, fontSize: 13, color: P.ink3 }}>{t('Could not load {name}’s points. Refresh to try again.', { name })}</p>
        : <>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
            <div><div style={{ fontSize: 26, fontWeight: 900, color: P.ink }}>{wallet.balance}</div><div style={{ fontSize: 12, color: P.ink3, fontWeight: 600 }}>{t('points')}</div></div>
            <div><div style={{ fontSize: 26, fontWeight: 900, color: P.ink }}>{wallet.minutes_used_today} / {wallet.minutes_per_day}</div><div style={{ fontSize: 12, color: P.ink3, fontWeight: 600 }}>{t('minutes played today')}</div></div>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: P.ink2, lineHeight: 1.45 }}>
            {t('{name} earns points by practising and spends {n} points for each minute of game.', { name, n: wallet.points_per_minute })}
          </p>
          {canEdit ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button disabled={saving} onClick={() => save(!wallet.enabled, wallet.minutes_per_day)}
                style={{ padding: '10px 14px', minHeight: 44, borderRadius: 10, border: `1.5px solid ${P.edge}`, background: wallet.enabled ? '#d9f7e6' : P.page, color: P.ink, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                {t('Game time')}: {wallet.enabled ? t('On') : t('Off')}
              </button>
              <label style={{ fontSize: 14, fontWeight: 700, color: P.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                {t('Most per day')}
                <select disabled={saving} value={wallet.minutes_per_day} onChange={e => save(wallet.enabled, Number(e.target.value))}
                  style={{ minHeight: 44, borderRadius: 10, border: `1.5px solid ${P.edge}`, padding: '0 10px', fontSize: 14, fontWeight: 700 }}>
                  {[...new Set([10, 15, 20, 30, 45, 60, wallet.minutes_per_day])].sort((a, b) => a - b).map(m => <option key={m} value={m}>{t('{n} minutes', { n: m })}</option>)}
                </select>
              </label>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: P.ink3 }}>{wallet.enabled ? t('Game time is on.') : t('Game time is off.')} {t('The adult who added {name} can change it.', { name })}</p>
          )}
        </>}
    </div>
  )
}

/** A child's card on the parent's home: their next lesson, how far along, Start learning and Open. */
export function ChildCard({ id, name, avatar, lastPlayed, next, done, total, onStart }: {
  id: string; name: string; avatar: string; lastPlayed: string; next: string | null; done: number; total: number; onStart: () => void
}) {
  const t = useT()
  const dt: CSSProperties = { color: 'var(--ink-muted)', fontWeight: 800 }, dd: CSSProperties = { margin: 0, fontWeight: 700, color: 'var(--ink)' }
  return (
    <article style={dcard} data-tour={`child-${id}`}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <img src={avatar} alt="" width={48} height={48} style={{ borderRadius: 14, objectFit: 'cover', background: 'var(--milo-orange-soft)' }} />
        <div><h2 style={{ ...h2, fontSize: 20 }}>{name}</h2><span style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 700 }}>{t('last played {day}', { day: lastPlayed })}</span></div>
      </div>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', margin: '12px 0', fontSize: 14 }}>
        <dt style={dt}>{t('Next lesson')}</dt><dd style={dd}>{next ?? t('All finished 🎉')}</dd>
        <dt style={dt}>{t('Done|lessons')}</dt><dd style={dd}>{t('{done} of {total} lessons', { done, total })}</dd>
      </dl>
      <div role="img" aria-label={t('{done} of {total} lessons done', { done, total })} style={{ height: 10, background: '#f1e6d3', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${total ? Math.round(100 * done / total) : 0}%`, background: 'var(--milo-orange)', borderRadius: 99 }} />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        <button type="button" style={dbtn} onClick={onStart}>▶ {t('Start learning')}</button>
        <Link href={`/parent?child=${id}`} style={dghost}>{t('Open {name}', { name })}</Link>
      </div>
    </article>
  )
}
