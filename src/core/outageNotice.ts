/**
 * The outage notice (founder, 6 Oct 2026): one value in Vercel, `OUTAGE_NOTICE`, and every page shows a calm one-line
 * notice at the top. Unset or blank → nothing. `on` → the default sentence, in the device's saved language. Anything
 * else → the founder's own words, whitespace collapsed and capped at NOTICE_MAX characters. React renders it as text,
 * never as HTML. Runbook: docs/runbooks/outages.md → the notice switch.
 */
export const NOTICE_MAX = 160

export const DEFAULT_NOTICE = {
  en: 'We’re fixing a problem. Your child’s progress is safe.',
  es: 'Estamos solucionando un problema. El progreso de su hijo está a salvo.',
} as const

/** `null` = show nothing; `{ preset: true }` = the default sentence; `{ text }` = the founder's words. */
export type Notice = null | { preset: true } | { text: string }

export function noticeFrom(raw: string | undefined): Notice {
  const s = (raw ?? '').replace(/\s+/g, ' ').trim()
  if (!s) return null
  if (s.toLowerCase() === 'on') return { preset: true }
  return { text: s.length > NOTICE_MAX ? `${s.slice(0, NOTICE_MAX - 1).trimEnd()}…` : s }
}
