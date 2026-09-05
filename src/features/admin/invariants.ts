/**
 * Invariants over the /admin payloads — properties no input may violate.
 *
 * ⚠️⚠️ WHY THIS EXISTS, AND WHY VALUE TESTS WERE NOT ENOUGH. The funnel shipped with four
 * INDEPENDENT step predicates instead of nested ones, so a later step could exceed an earlier one.
 * It survived a hand-computed fixture — because the person computing the expected values by hand
 * used the SAME wrong definition the code did, so both sides inherited the error. It then survived
 * two more populations by coincidence (11→7→5→5 and 10→6→4→4 both happen to be monotonic) and was
 * only exposed by an unrelated change: flagging two internal accounts, which produced 9→6→3→4.
 *
 * **A value test says "this input gives that output." An invariant says "no input may give an
 * output of this shape."** Only the second catches a definitional error, because a definitional
 * error is exactly what a hand-computed expectation shares with the code.
 *
 * ⚠️ THE SAME FUNCTIONS RUN IN THE TESTS AND IN THE BROWSER. The bug was visible to a human — 4
 * larger than 3, on screen — and nobody was looking. A machine looking would have caught it
 * instantly, so the page evaluates these on every load and refuses to present an impossible number
 * silently.
 *
 * ⚠️ AND A WRONG INVARIANT IS WORSE THAN A MISSING ONE — it goes red on correct data and teaches
 * people to ignore the banner. Properties considered and DELIBERATELY NOT asserted are listed at
 * the bottom with the reason.
 */

export interface Violation { id: string; detail: string }

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v))

function push(out: Violation[], ok: boolean, id: string, detail: string) {
  if (!ok) out.push({ id, detail })
}

/* ─────────────────────────── page 1 ─────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function checkOverview(d: any): Violation[] {
  const out: Violation[] = []
  if (!d) return out
  const accounts = num(d.total_accounts) ?? 0
  const learners = num(d.total_learners) ?? 0

  const sum = (rows: { n: number | null }[]) =>
    (rows ?? []).reduce((t, r) => t + (num(r.n) ?? 0), 0)

  push(out, sum(d.daily_signups) <= accounts, 'O1',
    `daily signups over the window (${sum(d.daily_signups)}) exceed total accounts (${accounts})`)
  push(out, sum(d.weekly_signups) <= accounts, 'O2',
    `weekly signups over the window (${sum(d.weekly_signups)}) exceed total accounts (${accounts})`)

  for (const row of (d.dau ?? [])) {
    const n = num(row.n); if (n === null) continue
    push(out, n <= learners, 'O3', `DAU on ${row.d} is ${n}, more than the ${learners} learners that exist`)
    push(out, n >= 0 && Number.isInteger(n), 'O5', `DAU on ${row.d} is not a non-negative integer: ${n}`)
  }
  for (const row of (d.wau ?? [])) {
    const n = num(row.n); if (n === null) continue
    push(out, n <= learners, 'O4', `WAU for week of ${row.d} is ${n}, more than the ${learners} learners that exist`)
  }

  /**
   * A weekly DISTINCT count must be at least the largest single day in that week (that day's
   * learners are a subset), and at most the sum of its days (each learner counted at most once per
   * day). ⚠️ The upper half is only checked when ALL SEVEN days are present and unsuppressed —
   * DAU covers 30 days and WAU 84, so most weeks are partial, and asserting the sum on a partial
   * week would fire on correct data.
   */
  const dayByKey = new Map<string, number>()
  for (const r of (d.dau ?? [])) { const n = num(r.n); if (n !== null) dayByKey.set(r.d, n) }
  for (const w of (d.wau ?? [])) {
    const wn = num(w.n); if (wn === null) continue
    const monday = new Date(`${w.d}T00:00:00Z`)
    const days: number[] = []
    let complete = true
    for (let i = 0; i < 7; i++) {
      const k = new Date(monday.getTime() + i * 86400000).toISOString().slice(0, 10)
      const v = dayByKey.get(k)
      if (v === undefined) complete = false; else days.push(v)
    }
    if (days.length) {
      push(out, wn >= Math.max(...days), 'O6a',
        `week of ${w.d}: weekly distinct ${wn} is below its largest day ${Math.max(...days)}`)
    }
    if (complete) {
      const total = days.reduce((a, b) => a + b, 0)
      push(out, wn <= total, 'O6b',
        `week of ${w.d}: weekly distinct ${wn} exceeds the sum of its days ${total}`)
    }
  }
  return out
}

/* ─────────────────────────── page 2 ─────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function checkLearning(d: any): Violation[] {
  const out: Violation[] = []
  if (!d) return out
  const c = d.chapters_per_learner ?? {}
  const nAll = num(c.n_all) ?? 0
  const nEng = num(c.n_engaged) ?? 0

  push(out, nEng <= nAll, 'L1', `learners with ≥1 completion (${nEng}) exceed all learners (${nAll})`)

  const meanAll = num(c.mean_all), meanEng = num(c.mean_engaged)
  if (isNum(meanAll) && isNum(meanEng) && nEng > 0) {
    // The "all" population is the engaged one plus members whose value is 0, so its mean can only
    // be lower or equal. A higher mean_all would mean the two denominators disagree.
    push(out, meanEng >= meanAll - 1e-9, 'L2',
      `mean over completed≥1 (${meanEng}) is below mean over all learners (${meanAll}) — impossible, the extra members are zeros`)
  }

  const hist = (d.chapters_histogram ?? []).map((h: { done: number; n: number }) =>
    ({ done: Number(h.done), n: Number(h.n) }))
  if (hist.length) {
    const total = hist.reduce((t: number, h: { n: number }) => t + h.n, 0)
    push(out, total === nAll, 'L4', `histogram sums to ${total} but n_all is ${nAll}`)
    const lo = Math.min(...hist.map((h: { done: number }) => h.done))
    const hi = Math.max(...hist.map((h: { done: number }) => h.done))
    const med = num(c.median_all)
    if (isNum(med)) push(out, med >= lo && med <= hi, 'L3',
      `median ${med} lies outside the distribution [${lo}, ${hi}]`)
  }

  for (const r of (d.chapter_funnel ?? [])) {
    const st = num(r.started) ?? 0, fi = num(r.finished) ?? 0, rate = num(r.rate)
    push(out, fi <= st, 'L5', `${r.chapter}: finished ${fi} exceeds started ${st}`)
    if (rate !== null) push(out, rate >= 0 && rate <= 1, 'L6', `${r.chapter}: completion rate ${rate} is outside [0,1]`)
  }

  const bands = d.curriculum_position ?? []
  if (bands.length) {
    const sum = bands.reduce((t: number, b: { learners: number }) => t + Number(b.learners), 0)
    push(out, sum === nAll, 'L7', `band learner counts sum to ${sum} but there are ${nAll} learners`)
    for (const b of bands) {
      const pct = num(b.pct_started)
      if (pct !== null) push(out, pct >= 0 && pct <= 100, 'L9', `band ${b.band}: pct_started ${pct} outside [0,100]`)
    }
  }

  const dg = d.diagnostic
  if (dg && dg.total !== undefined) {
    const t = num(dg.total) ?? 0, co = num(dg.completed) ?? 0, ip = num(dg.in_progress) ?? 0
    push(out, co + ip === t, 'L8',
      `placement check: completed ${co} + in progress ${ip} does not equal ${t} rows — an unmodelled status exists`)
  }
  return out
}

/* ─────────────────────────── page 3 ─────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function checkFunnel(d: any): Violation[] {
  const out: Violation[] = []
  if (!d) return out

  const steps = (d.steps ?? []).map((s: { step: string; n: number }) => ({ step: s.step, n: Number(s.n) }))
  for (let i = 1; i < steps.length; i++) {
    // THE ONE THAT SHIPPED BROKEN.
    push(out, steps[i].n <= steps[i - 1].n, 'F1',
      `funnel step "${steps[i].step}" (${steps[i].n}) exceeds "${steps[i - 1].step}" (${steps[i - 1].n}) — a later step cannot have more accounts than the one it requires`)
  }

  for (const c of (d.cohorts ?? [])) {
    const size = Number(c.size)
    push(out, size >= 0, 'F2', `cohort ${c.cohort_week}: size ${size} is negative`)
    for (const w of (c.weeks ?? [])) {
      const n = num(w.n); if (n === null) continue
      push(out, n <= size, 'F3',
        `cohort ${c.cohort_week} week +${w.offset}: ${n} returning exceeds the cohort's ${size} learners`)
      push(out, Number(w.offset) >= 0 && Number(w.offset) <= 3, 'F4',
        `cohort ${c.cohort_week}: week offset ${w.offset} is outside the 0–3 the table renders`)
    }
  }
  return out
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function checkPage(page: 'overview' | 'learning' | 'funnel', d: any): Violation[] {
  return page === 'overview' ? checkOverview(d) : page === 'learning' ? checkLearning(d) : checkFunnel(d)
}

/**
 * ── CONSIDERED AND DELIBERATELY NOT ASSERTED ────────────────────────────────────────────────────
 *
 * · `total_learners >= total_accounts` — an account may have no learners, and a parent may have
 *   several. Neither direction is guaranteed. Today: 9 accounts, 13 learners.
 * · `funnel step 1 === total_accounts` — true, but they come from DIFFERENT payloads (funnel vs
 *   overview). Asserting it here would fire whenever one page is stale relative to the other, which
 *   is a rendering race and not a data defect.
 * · `returned_without_finishing <= some bound` — no honest upper bound exists in the payload.
 * · `sum(cohort sizes) === total_learners` — cohorts are limited to the last 84 days, so learners
 *   created earlier are legitimately absent. The sum is a subset, not an equality.
 * · `every chapter in the catalogue appears in chapter_funnel` — the query drops chapters nobody
 *   has touched (`where started > 0`), which is deliberate: 0/0 is not a rate.
 * · `median_engaged >= median_all` — plausible and NOT guaranteed. Medians are not means: adding
 *   zeros moves a median in steps, and constructed distributions exist where they are equal. The
 *   mean version (L2) IS guaranteed, so only that is asserted.
 */
