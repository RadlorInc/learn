'use client'
/**
 * The diagnostic's typed answer surfaces — a number pad and a fraction pad.
 *
 * ⚠️ WHY THIS EXISTS: every probe question used to be a 4-choice MCQ, and measured against
 * simulated learners that put the exact-root-gap rate at 26–34% — a quarter of every wrong answer
 * came back right, and a lucky guess on a band ENTRY closes that whole branch, so 10–38% of
 * children with a real gap were told they were on track. Typing the number removes the guess
 * (see the header of core/diagnosticItems.ts for the measurements). It is also the answer surface
 * the chapters themselves use, so it is nothing new for the child to learn.
 *
 * ⚠️ DONE IS LIVE AS SOON AS THERE IS SOMETHING TO SUBMIT — never gated on a fixed digit count.
 * chapter-craft §0b: "derive the expected input length from the answer, never from the widest
 * case." FitOut shipped `disabled={digits.length < windows}` with a two-window pad and a
 * single-digit answer, so a child who worked out 8, typed 8 and pressed Done got nothing at all —
 * a dead button, which is worse than a wrong answer because it tells them the game is not
 * listening. Here the answer's length is unknown to the pad by design (it would leak it).
 *
 * ⚠️ AND THE EXTRA KEYS COME FROM THE QUESTION TYPE, NOT THE ANSWER. `keys.neg` / `keys.dot` are
 * declared by the generator for every draw of that type; deriving them from "this answer is
 * negative" would print the sign of the answer before the child touched anything.
 */
import { useState } from 'react'
import { PT, type Accent } from '@/features/chapters/story/preteen/kit'

const key = (size: number, wide = false): React.CSSProperties => ({
  minWidth: wide ? size * 1.6 : size, height: size, borderRadius: Math.round(size * 0.26),
  border: `1.5px solid ${PT.lineStrong}`, background: PT.panel, color: PT.ink,
  fontFamily: PT.mono, fontWeight: 800, fontSize: Math.round(size * 0.44),
  cursor: 'pointer', padding: wide ? `0 ${Math.round(size * 0.4)}px` : 0,
  boxShadow: '0 3px 10px rgba(0,0,0,0.3)', transition: 'transform .1s ease',
})

function Window({ value, size, accent, active, onClick }: { value: string; size: number; accent: Accent; active?: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      minWidth: size * 1.9, height: size * 1.15, padding: `0 ${Math.round(size * 0.3)}px`,
      borderRadius: Math.round(size * 0.22), display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.28)', border: `2px solid ${active ? accent.base : PT.lineStrong}`,
      color: PT.ink, fontFamily: PT.mono, fontWeight: 800, fontSize: Math.round(size * 0.62),
      cursor: onClick ? 'pointer' : 'default', letterSpacing: 1,
    }}>{value || ' '}</div>
  )
}

/** A typed answer. `onSubmit` receives the string to grade ("42", "-7", "0.6" or "3/8"). */
export function DiagPad({ kind, keys, accent, size, disabled, onSubmit }: {
  kind: 'num' | 'frac'
  keys?: { neg?: boolean; dot?: boolean }
  accent: Accent
  size: number
  disabled?: boolean
  onSubmit: (value: string) => void
}) {
  const [a, setA] = useState('')      // the number, or the numerator
  const [b, setB] = useState('')      // the denominator
  const [neg, setNeg] = useState(false)
  const [slot, setSlot] = useState<0 | 1>(0)

  const frac = kind === 'frac'
  const cur = frac ? (slot === 0 ? a : b) : a
  const setCur = (v: string) => (frac ? (slot === 0 ? setA(v) : setB(v)) : setA(v))
  // Bounded so a child leaning on a key cannot build a number the question could never want.
  const push = (ch: string) => { if (cur.length < 7) setCur(cur + ch) }
  const back = () => {
    if (frac && !cur && slot === 1) { setSlot(0); return }   // step back into the numerator
    if (!cur && neg) { setNeg(false); return }
    setCur(cur.slice(0, -1))
  }
  const ready = frac ? a.length > 0 && b.length > 0 : a.length > 0
  const value = frac ? `${a}/${b}` : `${neg ? '-' : ''}${a}`

  const press = (fn: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    e.currentTarget.animate([{ transform: 'scale(.92)' }, { transform: 'scale(1)' }], { duration: 130 })
    fn()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: Math.round(size * 0.28), opacity: disabled ? 0.45 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      {frac ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <Window value={a} size={size} accent={accent} active={slot === 0} onClick={() => setSlot(0)} />
          <div style={{ width: size * 2.1, height: 3, background: PT.ink, borderRadius: 2 }} />
          <Window value={b} size={size} accent={accent} active={slot === 1} onClick={() => setSlot(1)} />
        </div>
      ) : (
        <Window value={`${neg ? '−' : ''}${a}`} size={size} accent={accent} active />
      )}

      {/* One row wherever the frame allows it: a keypad split 8-and-4 reads as broken rather than
          as a keypad. The cap is 12 keys × (size + gap) at the largest size the caller passes. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: Math.round(size * 0.16), maxWidth: 'min(97vw, 940px)' }}>
        {Array.from({ length: 10 }).map((_, n) => (
          <button key={n} onClick={press(() => push(String(n)))} style={key(size)}>{n}</button>
        ))}
        {keys?.dot && <button onClick={press(() => { if (!cur.includes('.') && cur) push('.') })} style={key(size)}>.</button>}
        {keys?.neg && <button onClick={press(() => setNeg(v => !v))} style={{ ...key(size), color: neg ? '#06121f' : PT.ink, background: neg ? accent.base : PT.panel }}>−</button>}
        {/* ⚠️ The boxes are STACKED, so the key that moves between them says which way it goes. It
            was labelled "/" and a child who had typed the numerator had nothing telling them how to
            reach the bottom number — driven, and the same question sat on screen while digits piled
            up in the top box. Tapping either box still selects it; this is the discoverable route.
            Deliberately NOT an auto-advance after one digit: every numerator in today's item set
            happens to be single-digit, and building that assumption into the pad makes the first
            two-digit numerator an unanswerable question. */}
        {frac && <button onClick={press(() => setSlot(s => (s === 0 ? 1 : 0)))} style={key(size, true)}>{slot === 0 ? '↓' : '↑'}</button>}
        <button onClick={press(back)} style={key(size)}>⌫</button>
      </div>

      {/* Identical at every state — nothing may say the answer is right before the commit. */}
      <button onClick={press(() => ready && onSubmit(value))} disabled={!ready} style={{
        minHeight: 46, padding: '0 26px', borderRadius: 14, border: 'none',
        background: ready ? accent.base : PT.panel, color: ready ? '#06121f' : PT.inkMute,
        fontFamily: PT.sans, fontWeight: 800, fontSize: 17,
        cursor: ready ? 'pointer' : 'default', opacity: ready ? 1 : 0.5,
        boxShadow: ready ? `0 0 20px ${accent.base}66` : 'none',
      }}>Done ✓</button>
    </div>
  )
}
