'use client'
/**
 * The dashboard's helpers (founder, 2026-09-21), kept calm on purpose — the version with everything visible at once was
 * called cluttered:
 *   · Home shows ONE thing, "Up next". Every other reminder waits under the bell; nothing is shown in two places.
 *   · A reminder has one button that finishes it; "Remind me in 3 days" and "Not needed" sit behind ⋯.
 *   · At most one pop-up per visit (a celebration, else the weekly recap, else the first-visit tour) — decided by the page.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { Reminder } from './reminders'
import { useT } from './i18n'

const ink: CSSProperties = { color: 'var(--ink)' }
export const dbtn: CSSProperties = { background: 'var(--accent-fill)', color: 'var(--on-accent-fill)', border: 'none', borderRadius: 12, padding: '10px 16px', minHeight: 44, fontSize: 14, fontWeight: 900, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }
export const dghost: CSSProperties = { ...dbtn, background: 'var(--paper-soft)', color: 'var(--ink)', border: '1.5px solid var(--card-border)' }
export const dcard: CSSProperties = { background: 'var(--paper-soft)', border: '1.5px solid var(--card-border)', borderRadius: 16, padding: 18 }
export const dlink: CSSProperties = { background: 'none', border: 0, padding: '6px 0', minHeight: 36, fontWeight: 800, color: 'var(--ink-soft)', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', fontSize: 14 }

export function MoreMenu({ onSnooze, onHide }: { onSnooze: () => void; onHide: () => void }) {
  const ref = useRef<HTMLDetailsElement>(null)
  const t = useT()
  const pick = (f: () => void) => () => { if (ref.current) ref.current.open = false; f() }
  return (
    <details className="dash-more" ref={ref}>
      <summary aria-label={t('More options')}>⋯</summary>
      <div><button type="button" onClick={pick(onSnooze)}>{t('Remind me in 3 days')}</button><button type="button" onClick={pick(onHide)}>{t('Not needed')}</button></div>
    </details>
  )
}

/** The one thing to do now. `rest` = how many more wait under the bell. */
export function UpNext({ top, rest, allClear, onAct, onSnooze, onHide, onOpenAll }: {
  top: Reminder | undefined; rest: number; allClear: string
  onAct: (r: Reminder) => void; onSnooze: (r: Reminder) => void; onHide: (r: Reminder) => void; onOpenAll: () => void
}) {
  const t = useT()
  const box: CSSProperties = { ...dcard, background: '#fff', border: '2px solid var(--milo-orange-soft)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }
  const k: CSSProperties = { fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 900, color: 'var(--milo-orange-hover)' }
  if (!top) return (
    <section style={box} aria-label={t('Up next')} data-tour="upnext">
      <div><div style={k}>{t('All caught up')}</div><h2 style={{ margin: '2px 0 0', fontSize: 20, ...ink }}>{t('Nothing needs you right now')}</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)' }}>{allClear}</p></div>
    </section>
  )
  return (
    <section style={box} aria-label={t('Up next')} data-tour="upnext">
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={k}>{top.kind === 'setup' ? t('Getting started') : t('Up next')}</div>
        <h2 style={{ margin: '2px 0 0', fontSize: 20, ...ink }}>{top.title}</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)' }}>{top.detail}</p>
        {rest > 0 && <button type="button" style={dlink} onClick={onOpenAll}>{t('{n} more in Reminders', { n: rest })}</button>}
      </div>
      <div className="dash-act" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" style={dbtn} onClick={() => onAct(top)}>{top.action}</button>
        <MoreMenu onSnooze={() => onSnooze(top)} onHide={() => onHide(top)} />
      </div>
    </section>
  )
}

/** A native dialog: focus, Esc and the backdrop come with it. `side` slides it in from the right (the reminders list). */
export function Sheet({ open, onClose, side, label, children }: { open: boolean; onClose: () => void; side?: boolean; label: string; children: ReactNode }) {
  const t = useT()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} className={side ? 'dash-sheet side' : 'dash-sheet'} aria-label={label} onClose={onClose}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div>
        <button type="button" aria-label={t('Close')} onClick={onClose} style={{ float: 'right', border: 0, background: 'none', fontSize: 24, minWidth: 44, minHeight: 44, margin: '-10px -10px 0 0', color: 'var(--ink-muted)', cursor: 'pointer' }}>×</button>
        {children}
      </div>
    </dialog>
  )
}

/** Every reminder, filterable by child or class — shown only when the list covers more than one. */
export function RemindersSheet({ open, onClose, list, snoozedCount, settingsHref, onAct, onSnooze, onHide, onUnsnooze }: {
  open: boolean; onClose: () => void; list: Reminder[]; snoozedCount: number; settingsHref: string
  onAct: (r: Reminder) => void; onSnooze: (r: Reminder) => void; onHide: (r: Reminder) => void; onUnsnooze: () => void
}) {
  const t = useT()
  const [who, setWho] = useState('all')
  const whos = [...new Map(list.map(r => [r.who, r.whoName])).entries()]
  const shown = who === 'all' || !whos.some(([w]) => w === who) ? list : list.filter(r => r.who === who)
  const chip = (on: boolean): CSSProperties => ({ padding: '6px 14px', minHeight: 40, borderRadius: 999, border: '2px solid', borderColor: on ? 'var(--milo-orange)' : 'var(--card-border)', background: on ? 'var(--milo-orange-soft)' : 'var(--paper-soft)', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: 'var(--ink)' })
  return (
    <Sheet open={open} onClose={() => { setWho('all'); onClose() }} side label={t('Reminders')}>
      <h2 style={{ margin: '0 0 4px', fontSize: 22, ...ink }}>{t('Reminders')}</h2>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--ink-muted)', fontWeight: 700 }}>{t('Snooze or hide any of them with ⋯.')}</p>
      {whos.length > 1 && (
        <div role="group" aria-label={t('Show reminders for')} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <button type="button" aria-pressed={who === 'all'} style={chip(who === 'all')} onClick={() => setWho('all')}>{t('All')} · {list.length}</button>
          {whos.map(([w, name]) => <button key={w} type="button" aria-pressed={who === w} style={chip(who === w)} onClick={() => setWho(w)}>{name} · {list.filter(r => r.who === w).length}</button>)}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.length === 0 && <p style={{ margin: 0, color: 'var(--ink-soft)' }}>{t('All caught up.')}</p>}
        {shown.map(r => (
          <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 14, background: '#fff', border: '1.5px solid var(--card-border)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, ...ink }}>{r.title}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 2 }}>{r.detail}</div>
              <button type="button" style={{ ...dghost, marginTop: 8 }} onClick={() => onAct(r)}>{r.action}</button>
            </div>
            <MoreMenu onSnooze={() => onSnooze(r)} onHide={() => onHide(r)} />
          </div>
        ))}
      </div>
      {snoozedCount > 0 && <p style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--ink-muted)', fontWeight: 700 }}>
        {t('{n} snoozed.', { n: snoozedCount })} <button type="button" style={dlink} onClick={onUnsnooze}>{t('Show them now')}</button></p>}
      <p style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--ink-muted)', fontWeight: 700 }}>
        {t('Choose which kinds you get in')} <a href={settingsHref} onClick={onClose} style={{ color: 'var(--ink-soft)' }}>{t('Account → Reminders')}</a>.</p>
    </Sheet>
  )
}

/* ── Walkthroughs: a spotlight on the real element and a card saying what to do there ─────────────────── */

export interface TourStep { url?: string; target: string; title: string; text: string }
export interface Tour { title: string; steps: TourStep[] }

/** The first element for a `data-tour` key that is actually on screen; a menu item hidden in the phone drawer falls back to ☰. */
function visible(key: string): Element | null {
  const all = [...document.querySelectorAll(`[data-tour="${key}"]`)].filter(e => e.getClientRects().length > 0 && !e.closest('dialog:not([open])'))
  return all[0] ?? (key.startsWith('nav-') ? visible('menu') : null)
}

export function TourRunner({ tour, onEnd }: { tour: Tour | null; onEnd: (finished: boolean) => void }) {
  const t = useT()
  const router = useRouter()
  const [i, setI] = useState(0)
  const [box, setBox] = useState<{ l: number; t: number; w: number; h: number } | null>(null)
  const coach = useRef<HTMLDivElement>(null)
  // A new walkthrough starts at step 1 (reset during render, keyed on its title — the object is rebuilt each render).
  const [was, setWas] = useState(tour?.title)
  if (was !== tour?.title) { setWas(tour?.title); setI(0); setBox(null) }
  const step = tour?.steps[i]
  const stepKey = tour && step ? `${tour.title}#${i}` : null
  useEffect(() => {
    if (!step) return
    if (step.url) router.push(step.url)
    let tries = 0, stop = false
    const place = () => {
      if (stop) return
      // A step may point at several things ("tab-game,tab-login"): the spotlight goes round all of them.
      const els = step.target.split(',').map(visible)
      if (els.some(e => !e)) { if (++tries < 40) setTimeout(place, 75); else onEnd(false); return }
      els[0]!.scrollIntoView({ block: 'center' })
      const rs = els.map(e => e!.getBoundingClientRect())
      const l = Math.min(...rs.map(r => r.left)), t = Math.min(...rs.map(r => r.top))
      setBox({ l: l - 6, t: t - 6, w: Math.max(...rs.map(r => r.right)) - l + 12, h: Math.max(...rs.map(r => r.bottom)) - t + 12 })
    }
    place()
    const again = () => place()
    // Also once a sheet finishes sliding in: measured mid-animation, the spotlight lands where the target WAS
    // (on a phone the add-a-child sheet rises from below the screen, so step 1 pointed off the bottom).
    window.addEventListener('resize', again)
    document.addEventListener('animationend', again)
    return () => { stop = true; window.removeEventListener('resize', again); document.removeEventListener('animationend', again) }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on WHICH step, not the object: a derived tour is rebuilt every render
  }, [stepKey])
  useEffect(() => { coach.current?.querySelector<HTMLButtonElement>('[data-next]')?.focus() }, [box])
  useEffect(() => {
    if (!tour) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onEnd(false) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [tour, onEnd])

  if (!tour || !step || !box) return null
  const n = tour.steps.length, last = i === n - 1
  // The phone's safe areas, as the body pads for them (globals.css): the card must not slide under the notch or the bar.
  const pad = getComputedStyle(document.body), inset = (k: string) => parseFloat(pad.getPropertyValue(`padding-${k}`)) || 0
  const cardW = Math.min(340, window.innerWidth - 32), minL = 12 + inset('left'), maxL = window.innerWidth - cardW - 12 - inset('right')
  const below = box.t + box.h + 14, fitsBelow = below + 220 < window.innerHeight - inset('bottom')
  return <>
    <div className="dash-spot" style={{ left: box.l, top: box.t, width: box.w, height: box.h }} />
    <div ref={coach} className="dash-coach" role="dialog" aria-live="polite" aria-label={tour.title}
      style={{ top: fitsBelow ? below : Math.max(12 + inset('top'), box.t - 234), left: Math.max(minL, Math.min(box.l, maxL)) }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>{tour.steps.map((_, k) => <i key={k} style={{ height: 5, flex: 1, borderRadius: 9, background: k <= i ? 'var(--sky-blue)' : 'var(--card-border)' }} />)}</div>
      <div style={{ color: 'var(--milo-orange)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>{tour.title} · {t('{i} of {n}', { i: i + 1, n })}</div>
      <h3 style={{ margin: '4px 0', fontSize: 19, fontFamily: 'var(--font-display)', ...ink }}>{step.title}</h3>
      <p style={{ margin: '0 0 12px', color: 'var(--ink-soft)' }}>{step.text}</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {i > 0 && <button type="button" style={dghost} onClick={() => { setBox(null); setI(i - 1) }}>{t('Back')}</button>}
        <button type="button" data-next style={dbtn} onClick={() => { if (last) onEnd(true); else { setBox(null); setI(i + 1) } }}>{last ? t('Done') : t('Next')}</button>
        <button type="button" style={dlink} onClick={() => onEnd(false)}>{t('Stop')}</button>
      </div>
    </div>
  </>
}
