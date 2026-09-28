'use client'
/**
 * The game (public/blockcraft, built from blockcraft/) in a frame on /play. This page owns the save: it hands the game
 * the child's save to start from, uploads what the game posts, and when game time runs out asks the game to save and
 * stop before taking it away — so the next game starts where this one ended (founder, 2026-09-19).
 * Messages, all same-origin: game → page `bc:ready` · `bc:save {data}` · `bc:stopped`; page → game `bc:start {save, key}` · `bc:stop`.
 */
import { useEffect, useRef, useState } from 'react'
import { loadGameSave, localSaveKey, uploadGameSave, type GameSave } from '@/data/repositories/gameSave'
import { bubble, primary } from '@/features/lessons/Frame'

const UPLOAD_EVERY = 60_000     // the game posts a save every ~15 s; the account gets one a minute, and the last one always
const STOP_WAIT = 3_000         // how long a stopping game gets to hand over its last save

export default function GameFrame({ learnerId, running, onClosed }: { learnerId: string; running: boolean; onClosed: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const onClosedNow = useRef(onClosed)
  const closeNow = useRef(() => {})
  const [unreachable, setUnreachable] = useState(false)
  useEffect(() => { onClosedNow.current = onClosed })

  useEffect(() => {
    let latest: GameSave | null = null, uploadedAt = 0, closed = false
    const post = (msg: object) => frame.current?.contentWindow?.postMessage(msg, location.origin)
    const upload = () => { if (latest) { uploadedAt = Date.now(); void uploadGameSave(learnerId, latest) } }
    closeNow.current = () => { if (closed) return; closed = true; upload(); onClosedNow.current() }
    function onMessage(e: MessageEvent) {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow) return
      const type = e.data?.type
      if (type === 'bc:ready') {
        loadGameSave(learnerId).then((save) => {
          if (save === 'unreachable') setUnreachable(true)
          else post({ type: 'bc:start', save, key: localSaveKey(learnerId) })
        })
      } else if (type === 'bc:save') {
        latest = e.data.data
        if (Date.now() - uploadedAt > UPLOAD_EVERY) upload()
      } else if (type === 'bc:stopped') closeNow.current()
    }
    addEventListener('message', onMessage)
    return () => { removeEventListener('message', onMessage); upload() }   // leaving the page mid-game
  }, [learnerId])

  // Time is up: the game saves and freezes; then it is taken away.
  useEffect(() => {
    if (running) return
    frame.current?.contentWindow?.postMessage({ type: 'bc:stop' }, location.origin)
    const t = setTimeout(() => closeNow.current(), STOP_WAIT)
    return () => clearTimeout(t)
  }, [running])

  if (unreachable) return <>
    <p style={bubble}>We couldn&apos;t load your game. Check the internet and try again.</p>
    <button type="button" style={primary} onClick={() => setUnreachable(false)}>Try again</button>
  </>
  return (
    <iframe ref={frame} src="/blockcraft/index.html?embed=1" title="Game"
      style={{ flex: 1, width: '100%', minHeight: 'min(70dvh, 640px)', border: 0, borderRadius: 20, background: '#000' }} />
  )
}
