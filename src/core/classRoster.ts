/**
 * A teacher's class list (founder's call, 2026-09-18): a list of USERNAMES, optionally with names, pasted or
 * uploaded as CSV. Every child gets a TEMPORARY password here, and chooses their own at first sign-in.
 *
 * Accepted shapes, one child per line, cells split by comma, tab or semicolon:
 *   aarav7                       → username (the name defaults to it)
 *   Aarav Shah, aarav7           → name, username
 *   username,name  (a header)    → columns by header, in any order
 */
import { normalizeUsername } from './childLogin'

export interface RosterRow { name: string; username: string }
export interface RosterError { line: number; text: string; reason: string }

const NAME_MAX = 30
const cells = (line: string) => line.split(/[,\t;]/).map(c => c.trim().replace(/^"(.*)"$/, '$1').trim())

export function parseRoster(text: string): { rows: RosterRow[]; errors: RosterError[] } {
  const lines = text.split(/\r?\n/).map((t, i) => ({ t: t.trim(), line: i + 1 })).filter(l => l.t)
  const rows: RosterRow[] = [], errors: RosterError[] = []
  if (!lines.length) return { rows, errors }

  // A header row names its columns; without one, the column that holds a valid username is the username.
  const head = cells(lines[0].t).map(c => c.toLowerCase())
  const userCol = head.findIndex(c => c === 'username' || c === 'user name' || c === 'user')
  const nameCol = userCol >= 0 ? head.findIndex((c, i) => i !== userCol && /name/.test(c)) : -1
  const body = userCol >= 0 ? lines.slice(1) : lines

  const seen = new Set<string>()
  for (const { t, line } of body) {
    const c = cells(t).filter((x, i, all) => x || i < all.length - 1)
    let rawUser: string, rawName: string
    if (userCol >= 0) { rawUser = c[userCol] ?? ''; rawName = nameCol >= 0 ? c[nameCol] ?? '' : '' }
    else if (c.length === 1) { rawUser = c[0]; rawName = '' }
    // Two columns are name, username — turned round only when it is unmistakable: the first is a username and the
    // second is not one but reads as a name (a space or a capital). Guessing wrong would make a login out of a name.
    else if (normalizeUsername(c[0]) && !normalizeUsername(c[1]) && /[\sA-Z]/.test(c[1] ?? '')) { rawUser = c[0]; rawName = c[1] }
    else { rawName = c[0]; rawUser = c[1] }

    const username = normalizeUsername(rawUser ?? '')
    if (!username) { errors.push({ line, text: t, reason: 'username must be 3–20 letters, digits, dot or underscore' }); continue }
    if (seen.has(username)) { errors.push({ line, text: t, reason: `${username} is in the list twice` }); continue }
    seen.add(username)
    rows.push({ username, name: (rawName || username).slice(0, NAME_MAX) })
  }
  return { rows, errors }
}

/** Easy to read out to a child and type: an animal and three digits, e.g. "otter482". Temporary by design. */
const WORDS = ['tiger', 'otter', 'panda', 'koala', 'eagle', 'zebra', 'camel', 'lemur', 'moose', 'robin', 'shark', 'whale',
  'bison', 'gecko', 'hippo', 'llama', 'mango', 'maple', 'cedar', 'comet', 'pluto', 'orbit', 'lotus', 'coral', 'pearl',
  'river', 'cloud', 'storm', 'amber', 'ruby', 'jade', 'onyx', 'falcon', 'badger', 'beaver', 'parrot', 'turtle', 'rabbit']

export function tempPassword(random: () => number = secureRandom): string {
  const word = WORDS[Math.floor(random() * WORDS.length)]
  const digits = String(Math.floor(random() * 1000)).padStart(3, '0')
  return word + digits
}

function secureRandom(): number {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  return a[0] / 2 ** 32
}

/** The printout a teacher keeps: name, username, temporary password. Cells are quoted so a comma in a name survives. */
export function rosterCsv(rows: { name: string; username: string; password: string }[]): string {
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`
  return ['name,username,temporary password', ...rows.map(r => [r.name, r.username, r.password].map(q).join(','))].join('\n')
}
