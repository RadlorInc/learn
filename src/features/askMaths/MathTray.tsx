'use client'
/**
 * Ask maths: the maths buttons under the question box, and the preview that shows fractions stacked the way a child
 * writes them in a copy. The question stays plain text (3/8, x², √(16)) — that is what goes to askRadlor — so a word
 * problem and its maths share one ordinary box. No maths-editor library: those type maths only, and eat the spaces of
 * a sentence.
 */
import { useState, type CSSProperties, type RefObject } from 'react'
import { INK, TEAL, pill } from '@/features/lessons/Pictures'
import { bubble } from '@/features/lessons/Frame'
import { MAX_QUESTION } from './stream'

const ATOM = String.raw`(\d+(?:\.\d+)?|[a-zA-Z]|\([^()]+\))`
const MATH = new RegExp(`(?<![a-zA-Z])${ATOM}\\/${ATOM}(?![a-zA-Z])|\\^${ATOM}`, 'g')   // a letter is x or n, never part of a word
const bare = (s: string) => s.replace(/^\((.*)\)$/, '$1')
const wrap = (s: string) => (/^(\d+(\.\d+)?|[a-zA-Z])$/.test(s) ? s : `(${s})`)
const SUP: Record<string, string> = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }

export type Piece = string | { top: string; bottom: string } | { sup: string }

/** The question cut into text, fractions (a/b, (x+1)/3) and powers (x^(n+1)); x² is already plain text. */
export function pieces(text: string): Piece[] {
  const out: Piece[] = []
  let at = 0
  for (const m of text.matchAll(MATH)) {
    if (m.index > at) out.push(text.slice(at, m.index))
    out.push(m[3] !== undefined ? { sup: bare(m[3]) } : { top: bare(m[1]), bottom: bare(m[2]) })
    at = m.index + m[0].length
  }
  if (at < text.length) out.push(text.slice(at))
  return out
}

export const fraction = (top: string, bottom: string) => `${wrap(top.trim())}/${wrap(bottom.trim())}`
export const mixed = (whole: string, top: string, bottom: string) => `${whole.trim()} ${fraction(top, bottom)}`
export const power = (base: string, p: string) =>
  wrap(base.trim()) + (/^\d{1,2}$/.test(p.trim()) ? [...p.trim()].map((d) => SUP[d]).join('') : `^${wrap(p.trim())}`)

const key: CSSProperties = { ...pill, minHeight: 52, fontSize: 22, padding: '6px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
const box: CSSProperties = { width: 72, minHeight: 44, fontSize: 22, textAlign: 'center', border: `3px solid ${INK}`, borderRadius: 10, color: INK, fontFamily: 'inherit' }
const line: CSSProperties = { height: 3, background: INK, alignSelf: 'stretch', borderRadius: 2 }

function Frac({ top, bottom }: { top: string; bottom: string }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', margin: '0 4px', lineHeight: 1.1, fontSize: '0.9em' }}>
      <span style={{ borderBottom: `2px solid ${INK}`, padding: '0 3px' }}>{top}</span>
      <span style={{ padding: '0 3px' }}>{bottom}</span>
    </span>
  )
}

/** Shown under the box only once the question has a fraction or a power, so the child sees what will be asked. */
export function MathPreview({ text }: { text: string }) {
  const ps = pieces(text)
  if (!ps.some((p) => typeof p !== 'string')) return null
  return (
    <div aria-label="Your question" style={{ ...bubble, boxShadow: 'none', borderWidth: 3, lineHeight: 2 }}>
      {ps.map((p, i) => typeof p === 'string' ? <span key={i}>{p}</span>
        : 'sup' in p ? <sup key={i}>{p.sup}</sup> : <Frac key={i} top={p.top} bottom={p.bottom} />)}
    </div>
  )
}

type Maker = 'fraction' | 'mixed' | 'power'

export function MathTray({ area, value, onChange, disabled }: {
  area: RefObject<HTMLTextAreaElement | null>; value: string; onChange: (v: string) => void; disabled: boolean
}) {
  const [maker, setMaker] = useState<Maker | null>(null)
  const [f, setF] = useState({ a: '', b: '', c: '' })

  function put(s: string, back = 0) {
    const el = area.current
    const a = el?.selectionStart ?? value.length, b = el?.selectionEnd ?? a
    onChange((value.slice(0, a) + s + value.slice(b)).slice(0, MAX_QUESTION))
    const at = Math.min(a + s.length - back, MAX_QUESTION)
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(at, at) })
  }
  function open(m: Maker) { setF({ a: '', b: '', c: '' }); setMaker(maker === m ? null : m) }
  function done() {
    const { a, b, c } = f
    const s = maker === 'fraction' ? (a.trim() && b.trim() && fraction(a, b))
      : maker === 'mixed' ? (a.trim() && b.trim() && c.trim() && mixed(a, b, c))
      : (a.trim() && b.trim() && power(a, b))
    if (!s) return
    put(` ${s} `); setMaker(null)
  }
  const field = (k: 'a' | 'b' | 'c', label: string, style?: CSSProperties) => (
    <input aria-label={label} value={f[k]} maxLength={12} autoComplete="off" style={{ ...box, ...style }}
      onChange={(e) => setF({ ...f, [k]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); done() } }} />
  )
  const stack = (top: 'a' | 'b', bottom: 'b' | 'c') => (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {field(top, 'Top number')}<span style={line} />{field(bottom, 'Bottom number')}
    </span>
  )

  const keys: [string, string, () => void, Maker?][] = [
    ['½', 'Fraction', () => open('fraction'), 'fraction'], ['1½', 'Mixed fraction', () => open('mixed'), 'mixed'], ['x²', 'Power', () => open('power'), 'power'],
    ['√', 'Square root', () => put('√()', 1)], ['×', 'Times', () => put(' × ')], ['÷', 'Divide', () => put(' ÷ ')],
    ['−', 'Minus', () => put(' − ')], ['=', 'Equals', () => put(' = ')], ['( )', 'Brackets', () => put('()', 1)],
    ['x', 'x', () => put('x')], ['%', 'Percent', () => put('%')], ['°', 'Degrees', () => put('°')],
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div role="group" aria-label="Maths buttons" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 8 }}>
        {keys.map(([shown, label, go, m]) => (
          <button key={label} type="button" aria-label={label} title={label} disabled={disabled} onClick={go}
            aria-expanded={m ? maker === m : undefined} style={{ ...key, ...(m && maker === m ? { background: TEAL } : {}) }}>{shown}</button>
        ))}
      </div>
      {maker && (
        <div style={{ ...bubble, boxShadow: 'none', borderWidth: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
          {maker === 'fraction' && stack('a', 'b')}
          {maker === 'mixed' && <>{field('a', 'Whole number')}{stack('b', 'c')}</>}
          {maker === 'power' && <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 4 }}>
            {field('a', 'Number', { marginTop: 22 })}{field('b', 'Power', { width: 56, fontSize: 18 })}</span>}
          <span style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={{ ...pill, minHeight: 48 }} onClick={done}>Put in</button>
            <button type="button" style={{ ...pill, minHeight: 48 }} onClick={() => setMaker(null)}>Cancel</button>
          </span>
        </div>
      )}
    </div>
  )
}
