import type { ReactNode } from 'react'
import { segments } from './marks'

/** One line of consent copy as React nodes — bold, italic and links, no HTML injection. */
export function Md({ s }: { s: string }): ReactNode {
  return segments(s).map((x, i) => {
    let n: ReactNode = x.href
      ? <a key={i} href={x.href} target={x.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{ color: '#E0591F', fontWeight: 700 }}>{x.text}</a>
      : x.text
    if (x.em) n = <em key={i}>{n}</em>
    if (x.bold) n = <strong key={i}>{n}</strong>
    return <span key={i}>{n}</span>
  })
}
