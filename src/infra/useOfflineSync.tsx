'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { syncSession, saveDiagnostic } from '@/data/repositories'
import type { SessionPayload, DiagnosticPayload } from '@/data/repositories'
import { kv } from '@/infra/storage/kv'

const QUEUE_KEY = 'milo_offline_queue'
const DIAG_QUEUE_KEY = 'milo_offline_diagnostics'

// ─── Queue helpers ────────────────────────────────────────────

export function enqueueSession(payload: SessionPayload) {
  try {
    const q: SessionPayload[] = JSON.parse(kv.get(QUEUE_KEY) ?? '[]')
    if (!q.find(p => p.clientId === payload.clientId)) {
      q.push(payload)
      kv.set(QUEUE_KEY, JSON.stringify(q))
    }
  } catch {}
}

export function getQueuedSessions(): SessionPayload[] {
  try { return JSON.parse(kv.get(QUEUE_KEY) ?? '[]') } catch { return [] }
}

// ─── Diagnostic queue (durability for the completed-diagnosis save) ──
// The diagnosis row anchors the whole guarantee/re-check loop, so a save must survive a flaky
// network / immediate navigation just like a gameplay session does. Enqueue first (durable in
// IndexedDB), then flush; a failed flush leaves it queued to retry on the next online/mount trigger.
// Deduped by clientId, so the idempotent RPC + this guard never double-write.

export function enqueueDiagnostic(payload: DiagnosticPayload) {
  try {
    const q: DiagnosticPayload[] = JSON.parse(kv.get(DIAG_QUEUE_KEY) ?? '[]')
    if (!q.find(p => p.clientId === payload.clientId)) {
      q.push(payload)
      kv.set(DIAG_QUEUE_KEY, JSON.stringify(q))
    }
  } catch {}
}

export function getQueuedDiagnostics(): DiagnosticPayload[] {
  try { return JSON.parse(kv.get(DIAG_QUEUE_KEY) ?? '[]') } catch { return [] }
}

export async function flushDiagnosticQueue(): Promise<number> {
  const q = getQueuedDiagnostics()
  if (q.length === 0) return 0
  let flushed = 0
  const remaining: DiagnosticPayload[] = []
  for (const payload of q) {
    try {
      const outcome = await saveDiagnostic(payload)
      if (outcome === 'ok') flushed++
      else if (outcome === 'retry') remaining.push(payload)
      // 'drop' — permanently rejected (learner gone / not owned); discard.
    } catch { remaining.push(payload) }   // threw → transient (network); keep
  }
  if (remaining.length === 0) kv.remove(DIAG_QUEUE_KEY)
  else kv.set(DIAG_QUEUE_KEY, JSON.stringify(remaining))
  return flushed
}

// App-wide lock: the banner, the hook, and chapter-sync all call flushQueue;
// this guarantees only ONE flush runs at a time across the whole app, so the
// same queued items aren't processed concurrently (which multiplied the errors).
let _flushing = false

export async function flushQueue(): Promise<number> {
  if (_flushing || !navigator.onLine) return 0
  _flushing = true
  try {
    // Drain queued diagnoses too (same online/mount/banner triggers). Independent of sessions;
    // errors are swallowed inside flushDiagnosticQueue, so a diagnostic hiccup can't block sessions.
    await flushDiagnosticQueue().catch(() => {})
    const q = getQueuedSessions()
    if (q.length === 0) return 0
    let flushed = 0
    const remaining: SessionPayload[] = []
    for (const payload of q) {
      try {
        const outcome = await syncSession(payload)
        if (outcome === 'ok') flushed++
        else if (outcome === 'retry') remaining.push(payload)
        // 'drop' — permanent failure (learner gone / not owned); discard so it
        // doesn't re-error on every flush forever.
      } catch { remaining.push(payload) }   // threw → transient (network); keep
    }
    if (remaining.length === 0) kv.remove(QUEUE_KEY)
    else kv.set(QUEUE_KEY, JSON.stringify(remaining))
    return flushed
  } finally {
    _flushing = false
  }
}

// ─── Hook ─────────────────────────────────────────────────────

export function useOfflineSync() {
  // null = not yet determined (SSR safe)
  const [isOnline,     setIsOnline]     = useState<boolean | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing,      setSyncing]      = useState(false)
  const syncingRef = useRef(false)

  const updatePendingCount = useCallback(() => {
    setPendingCount(getQueuedSessions().length)
  }, [])

  const doFlush = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return
    syncingRef.current = true
    setSyncing(true)
    try {
      const flushed = await flushQueue()
      if (flushed > 0) console.log(`[Milo] Synced ${flushed} queued sessions`)
    } finally {
      syncingRef.current = false
      setSyncing(false)
      updatePendingCount()
    }
  }, [updatePendingCount])

  useEffect(() => {
    // Set real value on mount
    setIsOnline(navigator.onLine)
    updatePendingCount()

    function onOnline()  { setIsOnline(true);  doFlush() }
    function onOffline() { setIsOnline(false); updatePendingCount() }

    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)

    function onSwMessage(event: MessageEvent) {
      if (event.data?.type === 'ONLINE')  { setIsOnline(true);  doFlush() }
      if (event.data?.type === 'OFFLINE') { setIsOnline(false) }
    }
    navigator.serviceWorker?.addEventListener('message', onSwMessage)

    if (navigator.onLine) doFlush()

    const interval = window.setInterval(() => {
      if (!navigator.onLine) {
        navigator.serviceWorker?.controller?.postMessage({ type: 'CHECK_ONLINE' })
      }
    }, 30000)

    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
      navigator.serviceWorker?.removeEventListener('message', onSwMessage)
      window.clearInterval(interval)
    }
  }, [doFlush, updatePendingCount])

  return { isOnline: isOnline ?? true, pendingCount, syncing, flush: doFlush }
}

// ─── Offline Banner ───────────────────────────────────────────

export function OfflineBanner(): React.ReactElement | null {
  const [isOnline,     setIsOnline]     = useState<boolean | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing,      setSyncing]      = useState(false)
  const syncingRef = useRef(false)

  const updateCount = useCallback(() => {
    setPendingCount(getQueuedSessions().length)
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

    if (navigator.onLine) doFlush()

    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
      navigator.serviceWorker?.removeEventListener('message', onMsg)
    }
  }, [doFlush, updateCount])

  // Don't render until we know the real online status
  if (isOnline === null) return null
  // Online with nothing pending — hide
  if (isOnline && pendingCount === 0 && !syncing) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      padding: '12px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      fontSize: 14, fontWeight: 600, color: '#fff',
      background: !isOnline ? '#1f2937' : syncing ? '#166534' : '#92400e',
      transition: 'background 0.3s ease',
    }}>
      {!isOnline ? (
        <>
          <span>📡</span>
          <span>
            You're offline
            {pendingCount > 0
              ? ` — ${pendingCount} session${pendingCount !== 1 ? 's' : ''} will sync when reconnected`
              : ' — progress saves when reconnected'}
          </span>
        </>
      ) : (
        <>
          <span>{syncing ? '🔄' : '⏳'}</span>
          <span>
            {syncing
              ? 'Syncing your progress...'
              : `${pendingCount} session${pendingCount !== 1 ? 's' : ''} waiting to sync…`}
          </span>
        </>
      )}
    </div>
  )
}