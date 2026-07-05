'use client'
/**
 * PriceCard — the Percentages scenario "prop": a friendly price/receipt card used
 * in the explanation slides and in practice so a percent question is SHOWN, not
 * just described. In practice it displays only what's known (item, price, a
 * "25% OFF" / "20% TIP" badge) — never the answer. In the lesson it can also
 * reveal the worked result (save/pay) so the child sees the markdown happen.
 */
import type { AgeBand } from '@/features/chapters/teen/types'

const tidy = (n: number) => Math.round(n * 100) / 100
const money = (n: number) => `$${tidy(n).toFixed(tidy(n) % 1 === 0 ? 0 : 2)}`

export interface PriceCardProps {
  band?: AgeBand
  /** item / meal name, e.g. "Hoodie" */
  title?: string
  price: number
  /** the sticker, e.g. "25% OFF" or "20% TIP" */
  badge: string
  tone?: 'sale' | 'tip'
  /** small callout under the price, e.g. "you saved $15" */
  note?: string
  /** when set, reveal the worked result (lesson only) */
  solved?: { save: number; pay: number }
}

export default function PriceCard({ title, price, badge, tone = 'sale', note, solved }: PriceCardProps) {
  const badgeBg = tone === 'tip' ? 'var(--ink-soft)' : 'var(--accent)'
  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: 260,
      background: 'var(--paper)', border: '1px solid var(--outline)', borderRadius: 14,
      padding: '16px 16px 14px', boxSizing: 'border-box',
      boxShadow: '0 4px 16px color-mix(in srgb, var(--ink) 8%, transparent)',
    }}>
      {/* sticker */}
      <span style={{
        position: 'absolute', top: -10, right: 12,
        fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 800, letterSpacing: '0.02em',
        color: 'var(--fg-on-color)', background: badgeBg, borderRadius: 20, padding: '4px 11px',
        boxShadow: '0 2px 8px color-mix(in srgb, var(--ink) 14%, transparent)',
      }}>{badge}</span>

      {title && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 4 }}>
          {title}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums',
          fontSize: 34, fontWeight: 700, color: solved ? 'var(--ink-muted)' : 'var(--ink)',
          textDecoration: solved ? 'line-through' : 'none',
        }}>{money(price)}</span>
        {solved && (
          <span style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 34, fontWeight: 700, color: 'var(--accent)' }}>
            {money(solved.pay)}
          </span>
        )}
      </div>

      {note && !solved && (
        <div style={{ marginTop: 6, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{note}</div>
      )}

      {solved && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          <span style={{ flex: 1, textAlign: 'center', background: 'var(--accent)', color: 'var(--fg-on-color)', borderRadius: 8, padding: '5px 0', fontWeight: 700 }}>
            save {money(solved.save)}
          </span>
          <span style={{ flex: 1, textAlign: 'center', background: 'var(--bg-2)', color: 'var(--ink-soft)', borderRadius: 8, padding: '5px 0', fontWeight: 600 }}>
            pay {money(solved.pay)}
          </span>
        </div>
      )}
    </div>
  )
}
