'use client'
/**
 * The dashboard's menu (founder, 2026-09-21): a sidebar on a laptop; on a phone or tablet a slim light top bar with ☰,
 * which opens the same links in a drawer from the left. The bell (reminders) stays in the bar — it is what adults check
 * most. A native <dialog>: focus, Esc and the backdrop come with it.
 */
import Link from 'next/link'
import { useRef } from 'react'
import { useT } from './i18n'

export interface NavItem { label: string; href: string; on: boolean; tour?: string }

export function DashNav({ items, reminders, onBell, onSignOut }: {
  items: NavItem[]; reminders: number; onBell: () => void; onSignOut: () => void
}) {
  const t = useT()
  const drawer = useRef<HTMLDialogElement>(null)
  const close = () => drawer.current?.close()
  const links = (inDrawer: boolean) => <>
    {items.map(i => (
      <Link key={i.label} href={i.href} className={i.on ? 'on' : ''} aria-current={i.on ? 'page' : undefined}
        data-tour={inDrawer ? undefined : i.tour} onClick={inDrawer ? close : undefined}>{i.label}</Link>
    ))}
    <button type="button" data-tour={inDrawer ? undefined : 'bell'} onClick={() => { close(); onBell() }}>
      <Bell /> {t('Reminders')} {reminders > 0 && <span className="dash-count">{reminders}</span>}
    </button>
    <button type="button" onClick={onSignOut} className="home-nav-end">{t('Sign out')}</button>
  </>
  return <>
    <nav className="home-nav" aria-label={t('Dashboard')}>
      <span className="home-logo">🦊 AdaptiveLearn</span>
      {links(false)}
    </nav>
    <header className="dash-top">
      <button type="button" aria-label={t('Open menu')} aria-haspopup="dialog" data-tour="menu" onClick={() => drawer.current?.showModal()}><Burger /></button>
      <span className="dash-top-logo">🦊 AdaptiveLearn</span>
      <button type="button" aria-label={t('Reminders, {n} waiting', { n: reminders })} data-tour="bell" onClick={onBell}>
        <Bell />{reminders > 0 && <span className="dash-count">{reminders}</span>}
      </button>
    </header>
    <dialog ref={drawer} className="dash-drawer" aria-label={t('Menu')} onClick={e => { if (e.target === e.currentTarget) close() }}>
      <nav className="dash-drawer-panel" aria-label={t('Dashboard')}>
        <span className="home-logo">🦊 AdaptiveLearn
          <button type="button" aria-label={t('Close menu')} onClick={close} className="dash-x">×</button></span>
        {links(true)}
      </nav>
    </dialog>
  </>
}

const Burger = () => <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
const Bell = () => <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>
