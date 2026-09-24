'use client'
/**
 * Account → Text size (Review 1 Q5, founder 2026-09-24): Normal / Large / Extra large for the WHOLE screen on this
 * device — the dashboard and the child's lessons alike (see src/infra/storage/textSize.ts).
 */
import type { CSSProperties } from 'react'
import { useT } from './i18n'
import { TEXT_SIZES, saveTextSize, useTextSize } from '@/infra/storage/textSize'

export function TextSizeCard({ style }: { style: CSSProperties }) {
  const t = useT(), size = useTextSize()
  const label = { normal: t('Normal|size'), large: t('Large|size'), xl: t('Extra large|size') }
  return (
    <section style={style}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--ink)' }}>{t('Text size')}</h2>
      <p style={{ margin: '4px 0 12px', fontSize: 13, color: 'var(--ink-muted)', fontWeight: 700 }}>{t('Makes the words and buttons bigger, on every screen of this device, the lessons too. Saved on this device.')}</p>
      <div role="group" aria-label={t('Text size')} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TEXT_SIZES.map((z, i) => (
          <button key={z} type="button" aria-pressed={size === z} onClick={() => saveTextSize(z)}
            style={{ padding: '8px 18px', minHeight: 44, borderRadius: 999, border: '2px solid', borderColor: size === z ? 'var(--milo-orange)' : 'var(--card-border)',
              background: size === z ? 'var(--milo-orange-soft)' : 'var(--paper-soft)', fontWeight: 800, fontSize: 14 + i * 2, fontFamily: 'inherit', cursor: 'pointer', color: 'var(--ink)' }}>
            {size === z ? '✓ ' : ''}{label[z]}
          </button>
        ))}
      </div>
    </section>
  )
}
