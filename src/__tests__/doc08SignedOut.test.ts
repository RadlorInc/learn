/**
 * Doc 08 is PUBLISHED (/legal/cookies). Its signed-out paragraph states exactly what the device keeps when no child is
 * signed in; this holds the code to it. Every per-child store is called with no child, and the keys written must be
 * exactly the ones the paragraph names (`<topic>` = any topic id) — no more (an unlisted key makes the page false) and
 * no fewer (a named key nothing writes is a stale sentence). The real signed-out flow is re-measured end to end in
 * e2e/short-sessions.spec.ts. Keys are read out of the document, not typed here.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { saveStanding } from '@/infra/storage/lessonStanding'
import { markLessonDone } from '@/infra/storage/lessonProgress'
import { saveRun } from '@/infra/storage/lessonRun'
import { syncLesson, syncRun, syncModulePractice } from '@/infra/storage/lessonSync'
import { saveTextSize } from '@/infra/storage/textSize'

const doc = readFileSync(resolve(__dirname, '../../docs/legal/08-cookie-and-tracking-notice.md'), 'utf8')
const para = doc.split('\n').find(l => l.startsWith('**If you are not signed in'))!
const named = [...para.matchAll(/`([^`]+)`/g)].map(m => m[1])
const pattern = (k: string) => new RegExp(`^${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('<topic>', '[a-z0-9-]+')}$`)

describe('doc 08: what a signed-out device keeps', () => {
  it('the paragraph exists and names keys (control)', () => {
    expect(para).toBeTruthy()
    expect(named).toContain('milo-newflow-standing-device-<topic>')
  })

  it('the stores, with no child signed in, write exactly the keys the published page names', () => {
    localStorage.clear()
    const problem = { text: 'q', answer: 1, picture: { kind: 'eq' as const, text: '' } }
    saveStanding(null, 'g5m1-t12', { level: 1, streak: 0, mastered: false })
    markLessonDone(null, 'g5m1-t12')
    saveRun(null, 'g5m1-t12', { asked: 5, recent: ['q'], current: { problem, from: 'g5m1-t12' }, review: null })
    syncLesson(null, 'g5m1-t12', 'first'); syncRun(null, 'g5m1-t12'); syncModulePractice(null, 'g5m1')
    const written = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!)
    expect(written.length, 'control: the stores wrote something to look at').toBeGreaterThan(0)
    const perTopic = named.filter(k => k.includes('<topic>'))
    expect(written.filter(k => !named.some(n => pattern(n).test(k))), 'written but not on the page').toEqual([])
    expect(perTopic.filter(n => !written.some(k => pattern(n).test(k))), 'on the page but never written').toEqual([])
  })

  it('the text size (Review 1 Q5): the key a bigger size writes is named in the table AND the signed-out paragraph; Normal keeps nothing', () => {
    localStorage.clear()
    saveTextSize('large')
    const written = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!)
    expect(written.length, 'control: a bigger size wrote something').toBe(1)
    const table = doc.split('\n').filter(l => l.startsWith('| `')).map(l => l.match(/^\| `([^`]+)`/)![1])
    expect(table, 'a row in the table').toContain(written[0])
    expect(named, 'named in the signed-out paragraph').toContain(written[0])
    saveTextSize('normal')
    expect(localStorage.length, 'Normal keeps nothing').toBe(0)
  })
})
