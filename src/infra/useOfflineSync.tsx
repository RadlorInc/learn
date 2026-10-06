'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { flushLessonSync, pendingLessonUploads } from '@/infra/storage/lessonSync'

/**
 * ⚠️ THIS FILE OWNED ITS OWN QUEUE UNTIL 2026-09-20 — `milo_offline_queue`, of `sessions` rows,
 * flushed through `syncSession`. Chapters and lessons now record the same way, through the one
 * queue in `lessonSync`, so this is the banner over THAT queue and nothing else. (The `useOfflineSync`
 * hook that gave the file its name was mounted nowhere and was deleted on 2026-10-05; the periodic
 * retry it only pretended to do lives in `lessonSync`'s `retryLater`.)
 *
 * Two dead kv keys are left on devices and are deliberately not cleared: `milo_offline_queue`
 * (sessions) and `milo_offline_diagnostics` (the check, deleted the same day). Reading either is
 * the only way they could ever be recovered, and an unread key costs nothing.
 */

export async function flushQueue(): Promise<number> {
  if (!navigator.onLine) return 0
  const before = pendingLessonUploads()
  await flushLessonSync()
  return Math.max(0, before - pendingLessonUploads())
}

// ─── Offline Banner ───────────────────────────────────────────

export function OfflineBanner(): React.ReactElement | null {
  const [isOnline,     setIsOnline]     = useState<boolean | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing,      setSyncing]      = useState(false)
  const syncingRef = useRef(false)

  const updateCount = useCallback(() => {
    setPendingCount(pendingLessonUploads())
  }, [])

  const doFlush = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return
    syncingRef.current = true
    setSyncing(true)
    try { await flushQueue() }
    finally { syncingRef.current = false; setSyncing(false); updateCount() }
  }, [updateCount])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    updateCount()

    const onOnline  = () => { setIsOnline(true);  doFlush() }
    const onOffline = () => { setIsOnline(false); updateCount() }

    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)

    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'ONLINE')  { setIsOnline(true);  doFlush() }
      if (e.data?.type === 'OFFLINE') setIsOnline(false)
    }
    navigator.serviceWorker?.addEventListener('message', onMsg)

    // lessonSync retries on its own timer while online (`retryLater`) and says when a flush ends; the bar re-counts.
    window.addEventListener('lesson-sync', updateCount)

    if (navigator.onLine) doFlush()

    // Offline, ask the service worker every 30 s whether the network is back (it answers ONLINE above).
    const ping = window.setInterval(() => {
      if (!navigator.onLine) navigator.serviceWorker?.controller?.postMessage({ type: 'CHECK_ONLINE' })
    }, 30000)

    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('lesson-sync', updateCount)
      navigator.serviceWorker?.removeEventListener('message', onMsg)
      window.clearInterval(ping)
    }
  }, [doFlush, updateCount])

  // While it shows, the bar publishes its height as `--offline-bar`, and the page keeps that much clear at the bottom
  // (globals.css: body's padding and the dashboard sidebar's height). It used to sit ON the page — on an iPad Pro it
  // covered the sidebar's "Sign out" (found by the responsive sweep, 2026-09-24).
  const shown = isOnline !== null && !(isOnline && pendingCount === 0 && !syncing)
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = bar.current, root = document.documentElement
    if (!shown || !el) return
    const ro = new ResizeObserver(() => root.style.setProperty('--offline-bar', `${el.offsetHeight}px`))
    ro.observe(el)
    return () => { ro.disconnect(); root.style.removeProperty('--offline-bar') }
  }, [shown])

  // Don't render until we know the real online status; online with nothing pending — hide.
  if (!shown) return null

  return (
    <div ref={bar} data-offline-bar style={{
      // ⚠️ `pointerEvents: 'none'`: the bar is text only and sits over full-screen chapters that do not pad for
      // `--offline-bar`, so it swallowed taps on answer pads and the end card's "Back to modules" — it shows exactly
      // when a finished chapter syncs. Found by e2e/xbrowser-clicks.spec.ts.
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, pointerEvents: 'none',
      padding: '12px 20px calc(12px + env(safe-area-inset-bottom))',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      fontSize: 14, fontWeight: 600, color: '#fff',
      background: !isOnline ? '#083d85' : syncing ? '#166534' : '#92400e',
      transition: 'background 0.3s ease',
    }}>
      {!isOnline ? (
        <>
          <span>📡</span>
          <span>
            You&apos;re offline
            {pendingCount > 0
              ? ` — ${pendingCount} update${pendingCount !== 1 ? 's' : ''} will sync when reconnected`
              : ' — progress saves when reconnected'}
          </span>
        </>
      ) : (
        <>
          <span>{syncing ? '🔄' : '⏳'}</span>
          <span>
            {syncing
              ? 'Syncing your progress...'
              : `${pendingCount} update${pendingCount !== 1 ? 's' : ''} waiting to sync…`}
          </span>
        </>
      )}
    </div>
  )
}