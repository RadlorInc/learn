/**
 * B1 and B3, rendered from copy.ts — the words are the documents', only the links and layout are ours.
 * Both an HTML and a plain-text part, so a mail client that shows either shows every sentence.
 */
import { B1, B3, SIGNUP, CONFIRM_EMAIL, type Lang, type L } from './copy'
import { toHtml, toText } from './marks'

export interface Rendered { subject: string; html: string; text: string }

const wrap = (inner: string) =>
  `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#083D85;max-width:560px">${inner}</div>`
const p = (s: string) => `<p style="margin:0 0 14px">${toHtml(s)}</p>`
const small = (s: string) => `<p style="margin:22px 0 0;font-size:13px;color:#3D6FB8">${toHtml(s)}</p>`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** Both halves escaped: the decline link carries `&choice=`, and an unescaped attribute is also how a
 *  label with a quote in it would break the button — caught by consentRoutes.test.ts, not by a reader. */
/** A link drawn as an empty checkbox: an email cannot carry a working one (mail clients strip form controls). */
const checkbox = (label: string, href: string) =>
  `<a href="${esc(href)}" style="display:inline-flex;align-items:center;gap:10px;padding:10px 16px 10px 12px;border:2px solid #0B4FA8;background:#E3F3FE;` +
  `border-radius:10px;font-weight:700;font-size:16px;text-decoration:none;color:#0B4FA8">` +
  `<span style="display:inline-block;width:20px;height:20px;border:2px solid #0B4FA8;border-radius:4px;background:#fff"></span>${esc(label)}</a>`

/** B1. The "☐ I've read and agreed…" link opens the page whose box IS the grant. Clicking in the email cannot grant by itself: mail
 *  scanners open every link, so a link that granted would agree for every parent before anyone read it. */
export function renderB1(lang: Lang, agreeUrl: string, firstName: string | null): Rendered {
  return renderRequest(lang, agreeUrl, firstName, B1.subject, null)
}

/** B0: the parent's sign-up email — B1 with its own subject and one line above the checkbox. Its link confirms the address
 *  (Supabase's token_hash) and then opens the same page B1's does, where the tick is the grant. */
export function renderSignup(lang: Lang, url: string, firstName: string | null): Rendered {
  return renderRequest(lang, url, firstName, SIGNUP.subject, SIGNUP.confirms)
}

/** B0t: a teacher's sign-up email — confirms the address, asks for nothing. */
export function renderConfirm(lang: Lang, url: string): Rendered {
  const t = (x: L) => x[lang]
  const html = wrap([p(t(CONFIRM_EMAIL.thanks)), p(t(CONFIRM_EMAIL.please)),
    `<p style="margin:4px 0 18px"><a href="${esc(url)}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#0B4FA8;color:#fff;font-weight:700;text-decoration:none">${esc(t(CONFIRM_EMAIL.button))}</a></p>`,
    p(t(B1.ignore)), small(B1.address)].join(''))
  const text = [t(CONFIRM_EMAIL.thanks), t(CONFIRM_EMAIL.please), `${t(CONFIRM_EMAIL.button)}\n${url}`, t(B1.ignore), B1.address].map(toText).join('\n\n')
  return { subject: t(CONFIRM_EMAIL.subject), html, text }
}

function renderRequest(lang: Lang, agreeUrl: string, firstName: string | null, subject: L, beforeTick: L | null): Rendered {
  const t = (x: L) => x[lang]
  const hi = firstName ? t(B1.hi).replace('{name}', firstName) : t(B1.hi).replace(/,? \{name\}/, '')
  const html = wrap([
    p(hi), p(t(B1.thanks)), p(t(B1.before)),
    `<p style="margin:0">${toHtml(t(B1.store))}</p>`,
    `<ul style="margin:0 0 14px;padding-left:22px">${B1.list.map(x => `<li>${toHtml(t(x))}</li>`).join('')}</ul>`,
    p(t(B1.doNot)), p(t(B1.details)), ...(beforeTick ? [p(t(beforeTick))] : []),
    `<p style="margin:4px 0 18px">${checkbox(t(B1.tick), agreeUrl)}</p>`,
    p(t(B1.ignore)), small(B1.address),
  ].join(''))
  const text = [
    hi, t(B1.thanks), t(B1.before), [t(B1.store), ...B1.list.map(x => `- ${t(x)}`)].join('\n'), t(B1.doNot), toText(t(B1.details)),
    ...(beforeTick ? [t(beforeTick)] : []),
    `☐ ${t(B1.tick)}\n${agreeUrl}`,
    t(B1.ignore), B1.address,
  ].map(s => toText(s)).join('\n\n')
  return { subject: t(subject), html, text }
}

export function renderB3(lang: Lang, withdrawUrl: string): Rendered {
  const t = (x: L) => x[lang].replace('%WITHDRAW%', withdrawUrl)
  const html = wrap([p(t(B3.hi)), p(t(B3.yesterday)), p(t(B3.ifYou)), p(t(B3.ifNot)), small(t(B3.anyTime)), small(B3.address)].join(''))
  const text = [t(B3.hi), t(B3.yesterday), t(B3.ifYou), t(B3.ifNot), t(B3.anyTime), B3.address].map(toText).join('\n\n')
  return { subject: t(B3.subject), html, text }
}
