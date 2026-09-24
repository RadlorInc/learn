/**
 * What the dashboard points out (founder, 2026-09-21): one "Up next" on the home screen, everything else under the bell.
 * Worked out ONLY from what the dashboard already reads — nothing here is stored. Pure, so every rule is tested
 * (src/__tests__/dashboardReminders.test.ts).
 *
 * Rules the founder signed off in the mockup: a reminder has one action that finishes it; it goes away by itself once
 * done; it never says anything against the child ("late", "behind"); and the adult can snooze or hide it, or switch a
 * whole kind off (./prefs.ts).
 */
import { assignmentStatus, showDay, type Day } from '@/features/lessons/progressReport'
import { makeT, type Lang } from './i18n'

export type Kind = 'setup' | 'help' | 'nudge'
export interface Reminder {
  id: string
  kind: Kind
  /** Which child or class it is about — the bell filters on it. */
  who: string
  whoName: string
  title: string
  detail: string
  action: string
  /** Dashboard query string the action opens, e.g. `?child=<id>&tab=lessons`; 'start' launches the child's lessons. */
  to: string
}

export interface ChildFacts {
  id: string
  name: string
  owner: boolean
  /** null = the login lookup failed: say nothing rather than claim there is no login. */
  login: string | null | undefined
  gameEnabled: boolean | null
  lessonIds: string[] | null
  due: Record<string, string>
  isDone: (lessonId: string) => boolean
  /** Newest practice problem in the last 30 days; null = none; undefined = not read. */
  lastProblemAt: string | null | undefined
  createdAt: string
  /** Hardest topic from the Performance report (fewer than half right first try), if any. */
  stuck?: { lessonId: string; title: string }
}

/** Days without practice before we say so. */
export const QUIET_DAYS = 5
const DAY = 86_400_000

export function childReminders(c: ChildFacts, today: Day, now: Date, titleOf: (lessonId: string) => string, lang: Lang = 'en'): Reminder[] {
  const t = makeT(lang)
  const out: Reminder[] = []
  const base = { who: c.id, whoName: c.name }
  const name = c.name
  if (c.owner && c.login === undefined) {
    out.push({ ...base, id: `login:${c.id}`, kind: 'setup', title: t('{name} has no login yet', { name }),
      detail: t('With a username and password {name} can sign in on any device and go straight to their lessons.', { name }),
      action: t('Set up login'), to: `?child=${c.id}&tab=login` })
  }
  const passed = (c.lessonIds ?? []).filter(id => assignmentStatus(c.isDone(id), c.due[id], today) === 'late')
  if (passed.length) {
    const first = passed[0]
    out.push({ ...base, id: `due:${c.id}:${first}`, kind: 'nudge',
      title: t('The due date for “{title}” was {day}', { title: titleOf(first), day: showDay(c.due[first], lang) }),
      detail: (passed.length > 1 ? t('{name} hasn’t finished it yet, and {n} more.', { name, n: passed.length - 1 }) : t('{name} hasn’t finished it yet.', { name }))
        + ' ' + t('Move the date, or leave it — it stays at the top of their list.'),
      action: t('See due dates'), to: `?child=${c.id}&tab=lessons` })
  }
  if (c.stuck) {
    out.push({ ...base, id: `stuck:${c.id}:${c.stuck.lessonId}`, kind: 'help',
      title: t('{name} is finding “{title}” hard', { name, title: c.stuck.title }),
      detail: t('Fewer than half of the practice problems on it were right on the first try.'),
      action: t('See progress'), to: `?child=${c.id}&tab=progress` })
  }
  if (c.lastProblemAt !== undefined) {
    const since = c.lastProblemAt ?? c.createdAt
    const days = Math.floor((now.getTime() - new Date(since).getTime()) / DAY)
    if (days >= QUIET_DAYS) {
      out.push({ ...base, id: `quiet:${c.id}`, kind: 'nudge',
        title: c.lastProblemAt ? t('{name} hasn’t practiced for {days} days', { name, days }) : t('{name} hasn’t started practicing yet', { name }),
        detail: t('A few minutes a day works better than a long session once a week.'),
        action: t('Start a lesson with {name}', { name }), to: `start:${c.id}` })
    }
  }
  if (c.owner && c.gameEnabled === false) {
    out.push({ ...base, id: `game:${c.id}`, kind: 'setup', title: t('Game time is off for {name}', { name }),
      detail: t('Children earn minutes of the game by practicing. You choose the daily limit.'),
      action: t('Game time settings'), to: `?child=${c.id}&tab=game` })
  }
  return out
}

export interface ClassFacts {
  id: string
  name: string
  paid: boolean
  hasModules: boolean
  students: { id: string; name: string; login: string | null | undefined }[]
  /** Open exercises with how many of the class have taken each, and the question most got wrong (if any). */
  open: { id: string; title: string; done: number; hardQuestion?: { n: number; pct: number } }[]
  exercises: number
}

export function classReminders(c: ClassFacts): Reminder[] {
  const out: Reminder[] = []
  const base = { who: c.id, whoName: c.name }
  const noLogin = c.students.filter(s => s.login === undefined)
  if (noLogin.length) {
    out.push({ ...base, id: `logins:${c.id}`, kind: 'setup',
      title: `${noLogin.length === 1 ? noLogin[0].name : `${noLogin.length} students`} in ${c.name} ${noLogin.length === 1 ? 'has' : 'have'} no login`,
      detail: 'Give them a username and a temporary password from the Students tab.',
      action: 'Open Students', to: `?class=${c.id}&tab=students` })
  }
  if (c.paid && !c.hasModules && c.students.length) {
    out.push({ ...base, id: `mods:${c.id}`, kind: 'setup', title: `${c.name} has no modules chosen`,
      detail: 'Until you choose, every student in the class sees every topic.', action: 'Choose modules', to: `?class=${c.id}&tab=lessons` })
  }
  for (const e of c.open) {
    if (e.hardQuestion) {
      out.push({ ...base, id: `hard:${c.id}:${e.id}`, kind: 'help',
        title: `Question ${e.hardQuestion.n} of “${e.title}” was hard for most of ${c.name}`,
        detail: `Only ${e.hardQuestion.pct}% got it right on the first try. It may be worth going over in class.`,
        action: 'See the results', to: `?class=${c.id}&tab=exercises` })
    }
    if (c.students.length && e.done < c.students.length) {
      out.push({ ...base, id: `open:${c.id}:${e.id}`, kind: 'nudge',
        title: `${e.done} of ${c.students.length} in ${c.name} have taken “${e.title}”`,
        detail: 'Lock it when you are ready to mark it.', action: 'See the exercise', to: `?class=${c.id}&tab=exercises` })
    }
  }
  if (!c.exercises && c.students.length) {
    out.push({ ...base, id: `noex:${c.id}`, kind: 'setup', title: `${c.name} has no exercises yet`,
      detail: 'An exercise gives the whole class the same questions, and you see how each question went.',
      action: 'Make an exercise', to: `?class=${c.id}&tab=exercises` })
  }
  return out
}

/** The question most of the class got wrong first time: under half right, at least 3 took it. */
export function hardestQuestion(perQuestion: readonly { right: number; of: number }[]): { n: number; pct: number } | undefined {
  let worst: { n: number; pct: number } | undefined
  perQuestion.forEach((q, i) => {
    if (q.of < 3) return
    const pct = Math.round(100 * q.right / q.of)
    if (pct < 50 && (!worst || pct < worst.pct)) worst = { n: i + 1, pct }
  })
  return worst
}

/** Setup first (it unblocks everything else), then where help is needed, then gentle nudges. Stable within a kind. */
const ORDER: Record<Kind, number> = { setup: 0, help: 1, nudge: 2 }
export const byPriority = (list: readonly Reminder[]) => [...list].sort((a, b) => ORDER[a.kind] - ORDER[b.kind])
