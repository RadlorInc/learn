'use client'
/**
 * "Didn't get it?" — on every lesson screen, top right. A child who did not understand a screen taps it and picks one
 * or more reasons; nothing to type (founder, 2026-09-21). One row in `lesson_feedback` per send.
 * A native <dialog>: showModal gives focus, Esc and the backdrop for free.
 */
import { useRef, useState, type CSSProperties } from 'react'
import { sendLessonFeedback, type FeedbackReason } from '@/data/repositories/lessonFeedback'
import { pill, INK, TEAL, ON_TEAL } from './Pictures'

const LABELS: Record<FeedbackReason, string> = {
  fast: '🐇 It went too fast',
  words: '📖 The words were hard',
  picture: '🖼️ The picture was confusing',
  hear: '🔇 I couldn’t hear it',
  math: '🤔 I don’t get the math',
  broken: '🛠️ Something looks broken',
}

export function Feedback({ learnerId, lessonId, screen, onOpen }: {
  learnerId: string; lessonId: string; screen: string
  /** Called as the form opens — the lesson pauses, so the screen does not move on while the child is choosing. */
  onOpen?: () => void
}) {
  const box = useRef<HTMLDialogElement>(null)
  const [picked, setPicked] = useState<FeedbackReason[]>([])
  const [state, setState] = useState<'choose' | 'sending' | 'sent' | 'failed'>('choose')

  const open = () => { onOpen?.(); setPicked([]); setState('choose'); box.current?.showModal() }
  const close = () => box.current?.close()
  const toggle = (r: FeedbackReason) => setPicked(p => (p.includes(r) ? p.filter(x => x !== r) : [...p, r]))
  const send = async () => {
    setState('sending')
    const ok = await sendLessonFeedback(learnerId, lessonId, screen, picked)
    setState(ok ? 'sent' : 'failed')
    if (ok) setTimeout(close, 1500)
  }

  return <>
    <button type="button" style={{ ...pill, fontSize: 'clamp(13px, 3.5vw, 16px)', padding: '6px 10px' }} onClick={open}>Didn&apos;t get it?</button>
    <dialog ref={box} aria-labelledby="fb-title" style={dialog} onClick={e => { if (e.target === e.currentTarget) close() }}>
      {state === 'sent'
        ? <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: INK, textAlign: 'center' }}>Thank you! We&apos;ll make this screen better.</p>
        : <>
          <h2 id="fb-title" style={{ margin: '0 0 4px', fontSize: 24, color: INK }}>What was hard here?</h2>
          <p style={{ margin: '0 0 12px', fontSize: 17, color: INK }}>Tap one or more.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(Object.keys(LABELS) as FeedbackReason[]).map(r => {
              const on = picked.includes(r)
              return <button key={r} type="button" aria-pressed={on} onClick={() => toggle(r)}
                style={{ ...pill, whiteSpace: 'normal', textAlign: 'left', fontSize: 18, padding: '10px 14px', background: on ? TEAL : '#fff', color: on ? ON_TEAL : INK }}>{LABELS[r]}</button>
            })}
          </div>
          {state === 'failed' && <p role="alert" style={{ margin: '10px 0 0', fontSize: 17, fontWeight: 700, color: INK }}>That didn&apos;t send. Please try again.</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 14 }}>
            <button type="button" style={{ ...pill, fontSize: 18, padding: '10px 16px' }} onClick={close}>Cancel</button>
            <button type="button" disabled={picked.length === 0 || state === 'sending'} onClick={send}
              style={{ ...pill, fontSize: 18, padding: '10px 20px', background: TEAL, color: ON_TEAL, opacity: picked.length === 0 ? 0.5 : 1 }}>
              {state === 'sending' ? 'Sending…' : 'Send'}</button>
          </div>
        </>}
    </dialog>
  </>
}

const dialog: CSSProperties = { width: 'min(420px, calc(100vw - 32px))', padding: 20, borderRadius: 22, border: `4px solid ${INK}`, background: '#f7fbff' }
