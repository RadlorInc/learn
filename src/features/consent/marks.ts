/**
 * The four marks the consent copy uses — **bold**, *italic*, [text](url) and bare https:// URLs —
 * split into segments that both the email (HTML string) and the screen (React nodes) render from.
 * Not a markdown library: this is the whole grammar of copy.ts, and the screen half must not use
 * dangerouslySetInnerHTML (security.test.ts forbids every DOM-XSS sink in src/).
 */
export interface Seg { text: string; bold: boolean; em: boolean; href?: string }

export function segments(s: string): Seg[] {
  const out: Seg[] = []
  s.split(/(\*\*[^*]+\*\*)/g).forEach(part => {
    const bold = part.startsWith('**') && part.endsWith('**') && part.length > 4
    const inner = bold ? part.slice(2, -2) : part
    // links, then bare URLs (a trailing full stop is punctuation, not part of the address), then *em*
    const re = /\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s)]+?)(?=[.,;:]?(?:\s|$))|\*([^*]+)\*/g
    let last = 0
    for (const m of inner.matchAll(re)) {
      if (m.index! > last) out.push({ text: inner.slice(last, m.index), bold, em: false })
      if (m[1]) out.push({ text: m[1], bold, em: false, href: m[2] })
      else if (m[3]) out.push({ text: m[3], bold, em: false, href: m[3] })
      else out.push({ text: m[4], bold, em: true })
      last = m.index! + m[0].length
    }
    if (last < inner.length) out.push({ text: inner.slice(last), bold, em: false })
  })
  return out.filter(x => x.text)
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const toHtml = (s: string) => segments(s).map(x => {
  let h = esc(x.text)
  if (x.href) h = `<a href="${esc(x.href)}" style="color:#0B4FA8">${h}</a>`
  if (x.em) h = `<em>${h}</em>`
  if (x.bold) h = `<strong>${h}</strong>`
  return h
}).join('')

export const toText = (s: string) => segments(s).map(x =>
  x.href && x.href !== x.text ? `${x.text} (${x.href})` : x.text).join('')
