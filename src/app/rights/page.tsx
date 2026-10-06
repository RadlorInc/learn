'use client'
/**
 * /rights — what a parent can always reach, even when the parent PIN is locked or not entered (founder, 2026-10-06):
 * help, withdrawing permission for all their children, and a copy of each child's data. These are a parent's legal
 * rights (COPPA) or the way to get help, so the PIN — a barrier for a child, not authentication — does not stand in
 * front of them. It lives OUTSIDE `app/parent/`, so `ParentPinGate` (the /parent layout) does not wrap it.
 *
 * ⚠️ CLOSING THE ACCOUNT IS NOT HERE, and nothing here links to it: it is irreversible and a child could tap it, so it
 * stays at /parent/account behind the PIN.
 *
 * ⚠️ SAME DOORS AS THE DASHBOARD, NOT COPIES: `WithdrawAllCard` (→ `withdraw_my_consent`, the same audit rows) and
 * `DataRights` (the same export). Each still needs the parent's own signed-in session — the RPCs are keyed on
 * `auth.uid()` and the reads go through RLS — and a child's own login is sent to its lessons, exactly as /parent does.
 */
import { useEffect, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentSession } from '@/data/auth'
import { getMyRole, getMyLearners, getRecentSessions, enterAsChild } from '@/data/repositories'
import { DataRights } from '@/shared/ui/DataRights'
import { WithdrawAllCard } from '@/features/consent/WithdrawAll'
import { PROPOSED } from '@/features/consent/copy'
import { LangContext, makeT, useSavedLang } from '@/features/dashboard/i18n'
import { SUPPORT_EMAIL } from '@/app/site'
import type { Learner, Session } from '@/data/supabase/types'

type State = { stage: 'loading' | 'error' } | { stage: 'open'; teacher: boolean; kids: { learner: Learner; sessions: Session[] }[] }

export default function RightsPage() {
  const router = useRouter()
  const lang = useSavedLang()
  const t = makeT(lang)
  const [st, setSt] = useState<State>({ stage: 'loading' })
  const [msg, setMsg] = useState<string | null>(null)

  async function load() {
    setSt({ stage: 'loading' })
    try {
      if (!(await getCurrentSession())) { router.replace('/auth'); return }
      const role = await getMyRole()
      // A child's own login never sees the parent's controls: straight to their lessons, as /parent does.
      if (role === 'learner') { router.replace(await enterAsChild()); return }
      const teacher = role === 'teacher'
      // Rights over a child's data are the parent's; a teacher gets the help section only (the dashboard's `!tea`).
      const kids = teacher ? [] : await Promise.all((await getMyLearners()).map(async learner => ({ learner, sessions: await getRecentSessions(learner.id) })))
      setSt({ stage: 'open', teacher, kids })
    } catch { setSt({ stage: 'error' }) }
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LangContext.Provider value={lang}>
      <main style={{ minHeight: '100dvh', background: 'var(--paper)', fontFamily: 'var(--font-body)' }} aria-busy={st.stage === 'loading'}>
        <div className="adult-doc">
          <Link href="/parent" style={{ fontSize: 13, fontWeight: 700, color: '#3d6fb8', textDecoration: 'none' }}>{t('← Back to the dashboard')}</Link>
          <h1 style={{ fontSize: 24, margin: '10px 0 10px', color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{t('Help and your rights')}</h1>
          <p style={p}>{t('These stay open without your PIN, so you can always get help, withdraw permission or take a copy of your data.')}</p>

          <section style={card} data-rights="help">
            <h2 style={h2}>{t('Help')}</h2>
            <p style={p}>{t('Answers to common questions, including a forgotten PIN, are on the help page.')}</p>
            <p style={{ ...p, margin: 0 }}>
              <Link href="/help" style={a}>{t('Open the help page')}</Link>
              {' · '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={a}>{SUPPORT_EMAIL}</a>
            </p>
          </section>

          {st.stage === 'error' && <>
            <p role="alert" style={{ ...p, color: '#B42318', fontWeight: 700 }}>{t('Could not load this page. Check your connection and try again.')}</p>
            <button type="button" onClick={load} style={btn}>{t('Try again')}</button>
          </>}

          {st.stage === 'open' && !st.teacher && <>
            {msg && <p role="status" style={{ ...p, fontWeight: 700 }}>{msg}</p>}
            <WithdrawAllCard lang={lang} style={card} onDone={() => { setMsg(PROPOSED.withdrawnAllBody[lang]); void load() }} />
            <section style={card} data-rights="export">
              <h2 style={h2}>{t('A copy of your data')}</h2>
              {st.kids.length === 0
                ? <p style={{ ...p, margin: 0 }}>{t('There are no child profiles on this account.')}</p>
                : st.kids.map(k => <DataRights key={k.learner.id} name={k.learner.display_name} learnerId={k.learner.id}
                    bundle={{ learner: k.learner, sessions: k.sessions }} />)}
            </section>
          </>}
        </div>
      </main>
    </LangContext.Provider>
  )
}

const p: CSSProperties = { fontSize: 14, lineHeight: 1.6, color: 'var(--ink-soft)', margin: '0 0 14px' }
const h2: CSSProperties = { margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: 'var(--ink)' }
const a: CSSProperties = { color: '#0B4FA8', fontWeight: 700 }
const card: CSSProperties = { background: 'var(--paper-soft)', border: '1.5px solid var(--card-border)', borderRadius: 20, padding: 20, marginTop: 16 }
const btn: CSSProperties = { minHeight: 44, padding: '0 18px', borderRadius: 999, cursor: 'pointer', fontWeight: 800, fontSize: 14, background: '#fff', color: '#083d85', border: '2px solid rgba(8,61,133,.2)' }
