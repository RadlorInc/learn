'use client'
/**
 * Choose the voice Milo speaks in.
 *
 * "Device voice" is the browser's own speech synthesis — the behaviour before recorded
 * clips existed. It stays a real option because the recorded voice only covers the teen
 * game chapters; everywhere else falls back to it anyway, and a family may simply prefer
 * their own system voice.
 */
import { useEffect, useState } from 'react'
import { VOICES, getVoicePref, setVoicePref, type VoiceId } from '@/infra/storage/voicePref'
import { speak, stopSpeech } from '@/infra/useMiloSpeaker'

const SAMPLE = 'Set the dial, then read the answer off the board.'

export default function VoicePicker() {
  const [v, setV] = useState<VoiceId>('device')
  // Read on mount, not during render — the kv store is browser-only.
  useEffect(() => { setV(getVoicePref()) }, [])

  const choose = (id: VoiceId) => {
    setV(id); setVoicePref(id)
    stopSpeech()
    // Let the pref land before the sample plays, so it demos the voice just picked.
    setTimeout(() => speak(SAMPLE), 60)
  }

  const opts: Array<{ id: VoiceId; label: string; hint: string }> = [
    ...VOICES.map((x) => ({ id: x.id as VoiceId, label: x.label, hint: x.hint })),
    { id: 'device', label: 'Device voice', hint: 'Your browser’s built-in voice' },
  ]

  return (
    <section style={{ margin: '18px 0' }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, opacity: 0.75, margin: '0 0 10px' }}>🔊 Milo’s voice</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {opts.map((o) => {
          const on = v === o.id
          return (
            <button
              key={o.id}
              onClick={() => choose(o.id)}
              aria-pressed={on}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '12px 14px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                border: on ? '2px solid #4aae6b' : '2px solid rgba(0,0,0,.12)',
                background: on ? 'rgba(74,174,107,.10)' : 'rgba(255,255,255,.55)',
              }}
            >
              <span style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: on ? '6px solid #4aae6b' : '2px solid rgba(0,0,0,.25)',
              }} />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>{o.label}</span>
                <span style={{ display: 'block', fontSize: 12.5, opacity: 0.65 }}>{o.hint}</span>
              </span>
              {on && <span style={{ fontSize: 12, opacity: 0.6 }}>plays a sample</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
