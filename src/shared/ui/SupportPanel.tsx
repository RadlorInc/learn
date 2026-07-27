'use client'
/**
 * SupportPanel — the "something's wrong" surface on the parent dashboard.
 *
 * A parent describes the problem in their own words; we attach the device snapshot
 * (see infra/diagnostics.ts) that the server cannot see. The result is a support email
 * that is actionable on first read instead of starting a round of "what browser? did it
 * say anything? is it still happening?".
 *
 * Two send paths on purpose. `mailto:` is one click but silently does nothing on a desktop
 * with no mail client configured — so the block also sits in a selectable textarea with a
 * Copy button. If either path works, the report gets through.
 */
import { useState } from 'react'
import {
  collectDiagnostics, formatDiagnostics, supportMailto, SUPPORT_EMAIL,
} from '@/infra/diagnostics'

export function SupportPanel({ learnerId }: { learnerId?: string }) {
  const [open, setOpen] = useState(false)
  const [block, setBlock] = useState('')
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)

  async function openPanel() {
    setOpen(true)
    setBlock('collecting…')
    try {
      setBlock(formatDiagnostics(await collectDiagnostics(learnerId)))
    } catch {
      setBlock('(diagnostics unavailable — please describe the problem above)')
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${note}\n\n${block}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API is blocked on insecure origins and some older Safari builds.
      // The textarea below is selectable, so the parent can still copy by hand.
      setCopied(false)
    }
  }

  return (
    <>
      <button
        onClick={openPanel}
        style={{
          background: 'none', border: 'none', padding: '8px 4px',
          fontSize: 13, fontWeight: 600, color: '#888',
          cursor: 'pointer', textDecoration: 'underline',
        }}
      >
        Need help?
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(17,24,39,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              // maxHeight + scroll is load-bearing: this repo has already shipped a parent
              // modal whose top clipped off-screen once its content grew.
              width: '100%', maxWidth: 520, maxHeight: '92dvh', overflowY: 'auto',
              background: '#fff', borderRadius: 20, padding: 24,
              display: 'flex', flexDirection: 'column', gap: 14,
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1f2937' }}>
              Report a problem
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
              Tell us what happened. We&apos;ll attach some technical details about this device
              automatically — it helps us find the cause much faster.
            </p>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What happened? For example: my daughter finished a chapter but her stars didn't save."
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'vertical',
                border: '1.5px solid #e5e7eb', borderRadius: 12, padding: 12,
                fontSize: 14, fontFamily: 'inherit', lineHeight: 1.5,
              }}
            />

            <details>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>
                What gets sent
              </summary>
              <textarea
                readOnly
                value={block}
                rows={12}
                style={{
                  width: '100%', boxSizing: 'border-box', marginTop: 8,
                  border: '1.5px solid #e5e7eb', borderRadius: 12, padding: 12,
                  fontSize: 11, fontFamily: 'ui-monospace, monospace',
                  background: '#f9fafb', color: '#374151', lineHeight: 1.5,
                }}
              />
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af' }}>
                No passwords and no personal details about your child are included.
              </p>
            </details>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a
                href={supportMailto(block, note)}
                style={{
                  flex: '1 1 180px', textAlign: 'center', textDecoration: 'none',
                  background: 'linear-gradient(135deg, #F26B2C 0%, #e05a1f 100%)',
                  color: '#fff', borderRadius: 50, padding: '12px 20px',
                  fontSize: 15, fontWeight: 800,
                }}
              >
                Email support
              </a>
              <button
                onClick={copy}
                style={{
                  flex: '0 1 auto', background: 'none', border: '1.5px solid #e5e7eb',
                  borderRadius: 50, padding: '12px 20px', fontSize: 14, fontWeight: 700,
                  color: '#6b7280', cursor: 'pointer',
                }}
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  flex: '0 1 auto', background: 'none', border: 'none',
                  padding: '12px 14px', fontSize: 14, fontWeight: 600,
                  color: '#9ca3af', cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
              Or write to {SUPPORT_EMAIL} — we reply within 2 working days.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
