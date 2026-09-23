/**
 * B1 and B3, rendered from copy.ts — the words are the documents', only the links and layout are ours.
 * Both an HTML and a plain-text part, so a mail client that shows either shows every sentence.
 */
import { B1, B3, type Lang, type L } from './copy'
import { toHtml, toText } from './marks'

export interface Rendered { subject: string; html: string; text: string }

const wrap = (inner: string) =>
  `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#2b2118;max-width:560px">${inner}</div>`
const p = (s: string) => `<p style="margin:0 0 14px">${toHtml(s)}</p>`
const small = (s: string) => `<p style="margin:22px 0 0;font-size:13px;color:#7a6a58">${toHtml(s)}</p>`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** Both halves escaped: the decline link carries `&choice=`, and an unescaped attribute is also how a
 *  label with a quote in it would break the button — caught by consentRoutes.test.ts, not by a reader. */
const button = (label: string, href: string, primary: boolean) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:0 10px 10px 0;padding:12px 20px;border-radius:999px;` +
  `font-weight:700;text-decoration:none;${primary ? 'background:#E0591F;color:#fff' : 'border:2px solid #E0591F;color:#E0591F'}">${esc(label)}</a>`

export function renderB1(lang: Lang, grantUrl: string, declineUrl: string): Rendered {
  const t = (x: L) => x[lang]
  const html = wrap([
    p(t(B1.hi)), p(t(B1.someone)), p(t(B1.before)),
    `<ul style="margin:0 0 14px;padding-left:22px">${B1.list.map(x => `<li>${toHtml(t(x))}</li>`).join('')}</ul>`,
    p(t(B1.doNot)), p(t(B1.covers)),
    `<p style="margin:18px 0 8px">${button(t(B1.grant), grantUrl, true)}${button(t(B1.decline), declineUrl, false)}</p>`,
    p(t(B1.ignore)), small(t(B1.details)), small(B1.address),
  ].join(''))
  const text = [
    t(B1.hi), t(B1.someone), t(B1.before), B1.list.map(x => `- ${t(x)}`).join('\n'), t(B1.doNot), t(B1.covers),
    `${t(B1.grant)}: ${grantUrl}\n${t(B1.decline)}: ${declineUrl}`,
    t(B1.ignore), toText(t(B1.details)), B1.address,
  ].map(s => toText(s)).join('\n\n')
  return { subject: t(B1.subject), html, text }
}

export function renderB3(lang: Lang, withdrawUrl: string): Rendered {
  const t = (x: L) => x[lang].replace('%WITHDRAW%', withdrawUrl)
  const html = wrap([p(t(B3.hi)), p(t(B3.yesterday)), p(t(B3.ifYou)), p(t(B3.ifNot)), small(t(B3.anyTime)), small(B3.address)].join(''))
  const text = [t(B3.hi), t(B3.yesterday), t(B3.ifYou), t(B3.ifNot), t(B3.anyTime), B3.address].map(toText).join('\n\n')
  return { subject: t(B3.subject), html, text }
}
