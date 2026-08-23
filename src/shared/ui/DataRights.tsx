'use client'
/**
 * The parent's two data rights, in one place they can find.
 *
 * COPPA gives a parent the right to SEE what has been collected about their child and to have it
 * DELETED. Deletion already existed but was a small button beside the profile; export did not exist
 * at all. Both now sit under one "Your child's data" heading, because the first thing an attorney
 * (and a suspicious parent) asks is "where is it?".
 *
 * ⚠️ THE EXPORT USES DATA THE DASHBOARD HAS ALREADY LOADED — no new queries, no new RLS surface,
 * and nothing here can read a learner the parent could not already see. It is a serialize of what
 * is on screen.
 *
 * ⚠️ AND IT IS A `blob:` DOWNLOAD RATHER THAN A SERVER ROUTE, deliberately: a route would need to
 * re-authorise the caller and re-query, which is a second copy of the access rule (the thing this
 * repo keeps getting bitten by). The data is already in the browser, legitimately.
 */
import React from 'react'
import { getLearnerExportExtras, type ExportExtras } from '@/data/repositories'

export interface ExportBundle {
  learner: unknown
  stats: unknown
  progress: unknown[]
  sessions: unknown[]
}

/**
 * Exported so the gate can drive the same shape the button writes.
 *
 * ⚠️ EVERY CHILD-DATA TABLE MUST APPEAR HERE. The copy promises "everything we hold", and under
 * COPPA that button IS the parent's right to review what was collected. It shipped returning
 * four of eleven. `src/__tests__/exportCompleteness.test.ts` derives the table list from the SQL
 * and fails if a new one is added without being exported or explicitly excluded with a reason.
 *
 * ⚠️ `diagnosticAnswers` is bounded by retention, not by this function: raw placement-check
 * answers are pruned at 90 days (prune_diagnostic_items). An older diagnosis therefore exports
 * its CONCLUSION — the session, the plan, the re-checks — with an empty answers list. That is
 * correct and honest: the export can only contain what still exists.
 */
export function buildExport(name: string, b: ExportBundle, extra?: ExportExtras) {
  return {
    exportedAt: new Date().toISOString(),
    about: `Everything Milo has stored about ${name}.`,
    note: 'This is a copy. It does not delete anything — use "Delete profile" for that.',
    learner: b.learner,
    stats: b.stats,
    chapterProgress: b.progress,
    sessions: b.sessions,
    shopState:              extra?.learnerState           ?? null,
    activityEvents:         extra?.events                 ?? [],
    placementChecks:        extra?.diagnosticSessions      ?? [],
    placementCheckAnswers:  extra?.diagnosticAnswers       ?? [],
    learningPlans:          extra?.diagnosticPlans         ?? [],
    learningPlanProgress:   extra?.diagnosticPlanProgress  ?? [],
    gapRechecks:            extra?.diagnosticRechecks      ?? [],
  }
}

/** A filename a parent can find again in their Downloads folder. */
export const exportFilename = (name: string, at: Date) =>
  `milo-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'learner'}-${at.toISOString().slice(0, 10)}.json`

/**
 * ⚠️ IT WRAPS THE EXISTING DELETE CONTROL RATHER THAN ADDING A SECOND ONE. The dashboard already
 * has a delete button with a two-step confirm; re-implementing it here would be two paths to an
 * irreversible action, which is how one of them ends up missing the confirm. This supplies the
 * heading, the plain-language explanation and the EXPORT — deletion is passed in as `children`.
 */
export function DataRights({ name, learnerId, bundle, children }: {
  name: string
  learnerId: string
  bundle: ExportBundle
  children?: React.ReactNode
}) {
  const [done, setDone] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  async function download() {
    const at = new Date()
    setBusy(true)
    // The diagnostic and the event log are not on the dashboard, so they are fetched at click
    // time — through policies the parent already holds. See exportData.ts.
    const extra = await getLearnerExportExtras(learnerId)
    setBusy(false)
    const blob = new Blob([JSON.stringify(buildExport(name, bundle, extra), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFilename(name, at)
    a.click()
    // Revoke on the next tick — revoking synchronously can cancel the download in Safari.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setDone(true)
  }

  return (
    <section style={{
      marginTop: 20, padding: '16px 18px', borderRadius: 16,
      background: 'rgba(255,255,255,.6)', border: '2px solid rgba(61,37,22,.12)',
    }}>
      <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>
        {name}&apos;s data
      </h3>
      <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        You can take a copy of everything Milo has stored, or delete it for good. Deleting cannot be undone.
      </p>
      <button onClick={download} disabled={busy} style={btn}>
        {busy ? '… Gathering' : done ? '✓ Downloaded' : '⬇ Download a copy'}
      </button>
      {children}
    </section>
  )
}

const btn: React.CSSProperties = {
  /** 44px is the tap floor this repo holds everywhere. */
  minHeight: 44, padding: '0 18px', borderRadius: 999, cursor: 'pointer',
  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14,
  background: '#fff', color: 'var(--ink)', border: '2px solid rgba(61,37,22,.2)',
  marginBottom: 12,
}
