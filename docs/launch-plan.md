# Milo — Public Launch Plan

> Drafted by product-lead (2026-07-18). Phased, owned, gated. The founder supervises and holds the founder-only items (external accounts, money, legal sign-off, taste/brand). Specialist agents execute. This is the plan the team works phase by phase; update it as phases complete.

**Outcome:** take Milo from "live but unmarketed" to a defensible public US launch for a children's (ages 3–18) math product — where "defensible" means COPPA/privacy is real, the efficacy claim survives scrutiny, security is clean, and ops can survive traffic. Not just "it builds."

**Current real state (grounding):** app is live on `milo-story-mode.vercel.app` / `mi2utor.com`; Supabase auth + RLS solid (V1 and V12 fixed, sw.js at v27); adaptive diagnostic funnel + week-6 re-check + lead capture exist; **no monetization wired; no legal/compliance content exists; no efficacy cohort number exists;** the standing MANUAL TO-DO list (SMTP, Sentry, Stripe, PITR, staging, Auth rate limits, WAF, leaked-password toggle, uptime, the milo-happy/thinking 404s) is unstarted.

**House rules inherited by every phase:** no deploy without founder ask; bump `public/sw.js` VERSION per deploy; `labs-demo/` + the 3 untracked `docs/*.md` stay out of commits; migrations stay expand/contract.

> **Parallelism note:** Phase 1 (compliance legal review) is the longest-lead item and must **start at Phase 0**, because an external attorney sign-off can take weeks and gates the entire public launch. Phases 0/1/2 run concurrently; Phase 3 cannot start until 0 and 1 both pass.

---

## Phase 0 — Harden (production readiness)

Make the running app safe to point real traffic at. Mostly the standing MANUAL TO-DO list plus verification.

| # | Item | Owner | Depends on |
|---|------|-------|-----------|
| 0.1 | Enable **leaked-password protection** + shorten refresh-token lifetime (Supabase Auth) | Founder (dashboard) | — |
| 0.2 | Set **Supabase Auth rate limits** (sign-in/up/OTP) — the real API-abuse perimeter (app talks to Supabase directly) | Founder (dashboard) | — |
| 0.3 | Enable **PITR** on prod + run one restore drill per `docs/runbooks/rollback.md` | Founder (dashboard) + devops-release | — |
| 0.4 | Create **staging** Supabase project + Vercel staging env + GitHub `staging`/`production` Environments with required reviewer on prod; add all secrets/vars per `docs/devops.md` | devops-release (needs Founder to create accounts/secrets) | — |
| 0.5 | Wire **error monitoring**: get Sentry DSN (or set `MONITORING_INGEST_URL`) → activate `instrumentation.ts` + `/api/report-error` | Founder (account) + devops-release | — |
| 0.6 | **Custom SMTP** (Resend/SES/Postmark) — the built-in mailer already tripped a bounce warning; blocks all transactional + week-6 nudge email | Founder (account) + backend-data-engineer | — |
| 0.7 | Set `SUPABASE_DB_URL` secret → activate CI **RLS regression** job; confirm green | devops-release | 0.4 |
| 0.8 | **Uptime monitor** (BetterStack/Pingdom) on `/api/health` + one signed-in journey | devops-release | 0.5 |
| 0.9 | Vercel **Firewall/WAF** rate-limit rules + Speed Insights/Analytics on | Founder + devops-release | — |
| 0.10 | Fix the **`milo-happy.png` / `milo-thinking.png` 404s** (copy an existing pose or add art — zero code change either way) | frontend-ux-engineer (Founder if new art) | — |
| 0.11 | **Independent security pass** on the public surface (invite flow, `diagnostic_leads` anon-insert spam vector, auth, RPC bounds) + confirm no new advisor warnings | security-redteam | 0.1–0.2 |
| 0.12 | **Human signed-in tap-through on prod**: signup → role picker → add learner → diagnostic saves → play a chapter (coins/stars persist) → invite send/receive/**accept** (V12, still unverified) → /insights | qa-reviewer + Founder (real account) | 0.6 (needs working email) |
| 0.13 | Un-`fixme` the E2E correctness personas (aceKid/strugglerKid) OR explicitly accept the coverage gap; confirm `npm run test:e2e` green in CI | e2e-test-engineer | 0.4 |
| 0.14 | Full green gate: `tsc` · vitest 26/26 · `next build` · `npm audit --audit-level=high` · RLS suite | qa-reviewer | 0.7 |

**GO / NO-GO to leave Phase 0:**
- Security-redteam signs off: no CRITICAL/HIGH open; invite + anon-insert surfaces bounded; **V12 accept flow verified live by a human** (0.12).
- Ops green: staging exists, PITR on + drill passed, error monitoring live, uptime monitor live, Auth rate limits set, SMTP sending real mail without bounces.
- qa-reviewer signs off on 0.14 + the prod tap-through (0.12) with zero blocking defects.

**Founder-only in Phase 0:** all external accounts/spend (Sentry, SMTP, Supabase paid tier if PITR needs it, monitoring vendor), every dashboard toggle, and being the real human for the signed-in prod tap-through.

---

## Phase 1 — Compliance & Trust (the hard gate for a kids product)

This is the category that actually decides whether you can legally and honestly market to children. **Start at the same time as Phase 0.** compliance-privacy **drafts and flags**; a **real attorney signs off** — that sign-off is non-negotiable and Founder-owned.

| # | Item | Owner | Depends on |
|---|------|-------|-----------|
| 1.1 | **Data-inventory / data-map**: exactly what PII is collected (parent email, child name, DOB, diagnostic results, session data, lead emails), where it lives, retention, who can read it (ground it in the RLS model + `diagnostic_leads`) | compliance-privacy + backend-data-engineer | — |
| 1.2 | **COPPA gap analysis**: verifiable parental consent (the parent-creates-learner flow is your consent vector — confirm it qualifies), direct notice to parents, no behavioral ads, data-deletion right, data-retention limits | compliance-privacy | 1.1 |
| 1.3 | Draft **Privacy Policy** + **Terms of Service** + **child-directed privacy notice** (COPPA-specific), plus a data-deletion/parent-request path | compliance-privacy (draft) → Founder + attorney (sign) | 1.2 |
| 1.4 | **Parent-facing data controls**: verify/ship a working "delete my child's data / download data" mechanism (deletion right is a COPPA requirement, not optional) | backend-data-engineer + frontend-ux-engineer | 1.1 |
| 1.5 | **Efficacy-claim defensibility review**: audit every claim the funnel makes today (the "6-week guarantee", "gap closed", "root gap") — can they be substantiated? Reframe or remove any that can't be. This is both a trust gate and an FTC deceptive-claims risk. | data-analyst (owns claim), growth-marketing (owns copy), compliance-privacy (flags) | — |
| 1.6 | **Efficacy evidence plan**: define the real week-6 cohort + the honest metric you'll report; if no cohort number exists yet, the launch claim must be worded as a *promise/process* ("we re-check in 6 weeks"), NOT a proven-outcome stat | data-analyst | 1.5 |
| 1.7 | **Curriculum/skill-graph sign-off**: a real teacher/curriculum authority signs off on the diagnostic spine edges (`docs/skill-graph-validation.md`) so the "root gap" claim is credible | curriculum-designer (Founder secures the external reviewer) | — |
| 1.8 | **UX-invariant audit of all public/marketing surfaces**: no dark patterns, no fabricated "mastery %", no streaks/urgency, no student-ranking — per `docs/ux-invariants.md` | growth-marketing + qa-reviewer | 1.5 |
| 1.9 | Consent/notice UI wired into signup + `diagnostic_leads` capture (link to policies, consent checkbox as attorney directs) | frontend-ux-engineer | 1.3 |

**GO / NO-GO to leave Phase 1:**
- **Attorney has signed off** on Privacy Policy, ToS, and COPPA compliance (Founder confirms). This is a hard stop — no public marketing to children without it.
- Data-deletion/parent-request mechanism works and is verified (qa-reviewer).
- data-analyst certifies every live efficacy/marketing claim is substantiated OR reworded to a defensible promise; no unsupported outcome stat ships.
- No UX-invariant violation on any public surface.

**Founder-only in Phase 1:** hiring/engaging the **attorney** and getting binding legal sign-off (compliance-privacy is explicitly *not* legal counsel); securing the external teacher/curriculum reviewer; the final call on claim wording and the guarantee.

---

## Phase 2 — GTM prep (can run parallel with 0 & 1)

Build the go-to-market machine. Nothing here ships to the public until Phases 0+1 pass, but it's the long pole to *prepare*.

| # | Item | Owner | Depends on |
|---|------|-------|-----------|
| 2.1 | **Positioning + messaging**: the one-sentence promise, target parent persona, the "root-gap diagnostic" as the hook | growth-marketing | 1.5 (claims must be settled first) |
| 2.2 | **Pricing/monetization decision + build** (if paid at launch): Stripe account, plan, checkout, entitlement gating — respecting the UX-invariant against payment-pressure on a child's own results | Founder (decision + Stripe account) → backend-data-engineer + frontend-ux-engineer (build) | Founder decision (see open questions) |
| 2.3 | **Landing/funnel copy + the free diagnostic as the front door**: audit the existing `/diagnostic` cold funnel end-to-end, tighten conversion, wire lead capture to SMTP | growth-marketing + frontend-ux-engineer | 0.6, 1.9 |
| 2.4 | **Support/help content**: FAQ, onboarding guide, parent "how it works", data/privacy FAQ, "how to delete data" help | support-docs | 1.3 |
| 2.5 | **Analytics/instrumentation for the funnel**: define the launch KPIs (signup, diagnostic-complete, activation = first chapter, week-6 re-check rate) and confirm they're measurable | data-analyst + frontend-ux-engineer | 0.5 |
| 2.6 | **Week-6 nudge automation** (cron/edge fn + email) — the retention loop; blocked on SMTP | backend-data-engineer | 0.6 |
| 2.7 | Launch **channel plan** (where the first parents come from — organic, community, paid) + spend plan | growth-marketing → Founder (budget) | 2.1 |

**GO / NO-GO to leave Phase 2:**
- Positioning + all public copy pass the claims review (1.5) and UX-invariants (1.8).
- Funnel is instrumented and the free-diagnostic path works end-to-end with real email.
- Support content live; pricing decision made and (if paid) checkout tested by qa-reviewer.

**Founder-only in Phase 2:** the pricing/free-vs-paid decision, Stripe account + business/tax setup, marketing budget, brand/voice final approval, channel choice.

---

## Phase 3 — Soft launch (closed / limited cohort)

Prove the machine on a small, controlled group before opening the doors. This is also where the **efficacy cohort** (1.6) gets seeded.

| # | Item | Owner | Depends on |
|---|------|-------|-----------|
| 3.1 | Recruit a **small closed cohort** (e.g. friendly parents / one classroom) — real signed consent, real kids | Founder + growth-marketing | Phase 0 + Phase 1 PASS |
| 3.2 | Onboard them; monitor errors (Sentry), uptime, and the funnel KPIs live | data-analyst + devops-release | 2.5 |
| 3.3 | **Efficacy cohort starts its clock** — diagnose now, re-check at week 6 (the honest evidence for future claims) | data-analyst | 1.6 |
| 3.4 | Collect qualitative feedback (confusion, trust, "would you pay") | support-docs + growth-marketing | 3.1 |
| 3.5 | Triage + fix defects found in real use; each fix re-runs the full green gate before deploy | qa-reviewer + relevant engineer | 3.2 |

**GO / NO-GO to leave Phase 3 (open to public):**
- No P0/P1 defects open from real-cohort use; error rate within SLO (`< 0.5%`), uptime holding.
- Funnel actually converts (a real parent can go cold-diagnostic → signup → play without dropping) — data-analyst confirms with numbers, not vibes.
- Positive/neutral trust signal from the cohort; no compliance or privacy complaint.
- Founder explicitly approves opening up (taste/brand + business readiness call).

**Founder-only in Phase 3:** cohort recruitment, the go/no-go decision to make it public, any spend on incentives.

---

## Phase 4 — Public launch

| # | Item | Owner | Depends on |
|---|------|-------|-----------|
| 4.1 | **Launch-day runbook**: who watches Sentry/uptime/DB, rollback path (Vercel promote-previous), on-call | devops-release | Phase 3 PASS |
| 4.2 | Flip public: announce on chosen channels, remove any "invite-only" gating | growth-marketing + Founder | 4.1 |
| 4.3 | **Capacity/abuse watch**: WAF + Auth rate limits under real load; watch `42501` (RLS-denial) spikes and lead-capture spam | devops-release + security-redteam | 0.2, 0.9 |
| 4.4 | Final pre-flight: green gate + sw.js version bump confirmed on the launch deploy | qa-reviewer + devops-release | — |

**GO / NO-GO for launch-day itself:**
- Launch runbook exists + rollback rehearsed; monitoring dashboards staffed.
- Final deploy green + sw.js bumped + smoke (home/`/auth`/diagnostic 200).
- Founder gives the explicit "go."

**Founder-only in Phase 4:** the launch "go," public announcement, press/community outreach.

---

## Phase 5 — Post-launch

| # | Item | Owner |
|---|------|-------|
| 5.1 | **Week-6 efficacy readout** from the cohort (3.3) → this is what finally lets you scale the *proven-outcome* claim (until then it stays a promise) | data-analyst |
| 5.2 | Funnel/retention analysis vs the KPIs; iterate the weakest step | data-analyst + growth-marketing |
| 5.3 | Ongoing security: Dependabot, quarterly RLS-drift check + PITR restore drill, watch advisor warnings | security-redteam + devops-release |
| 5.4 | Support triage loop; feed recurring confusion back to content/curriculum | support-docs + curriculum-designer |
| 5.5 | Finish deferred hardening: full CSP enforcement (Report-Only → enforced), baseline schema dump | devops-release + security-redteam |
| 5.6 | Only after 5.1 proves out: revisit scaling the guarantee, EU expansion, schools/FERPA track | Founder + data-analyst + compliance-privacy |

**Gate:** don't upgrade any efficacy claim from "promise" to "proven" until 5.1 delivers a real, honest number that data-analyst stands behind.

---

## Open questions for the Founder (decide before/at Phase 1–2)

1. **Free vs paid at launch?** — *Recommendation:* launch **free** (or free diagnostic + free play), defer Stripe to Phase 5. Removes the Stripe long-pole and the payment-pressure UX risk, and there's no proven efficacy number yet to justify charging. Monetize once 5.1 proves outcomes.
2. **US-only or EU in scope?** — *Recommendation:* **US-only at launch.** GDPR-K (and UK Age-Appropriate Design Code) add a materially different consent + legal regime; adding EU now roughly doubles the compliance surface for no launch benefit. Scope EU as Phase 5.6.
3. **Launch cohort age band(s)?** — *Recommendation:* launch the **band that's most polished and lowest-risk** (the 3–5 / 6–11 story chapters look most stable; the 12–14 teen games have had the most churn). Fewer bands = a tighter efficacy story and less QA surface.
4. **Schools/classrooms (FERPA) in scope at launch?** — *Recommendation:* **No — direct-to-parent only at launch.** Schools pull in FERPA + district procurement + a different consent model. Keep grades/teacher features available but not a marketed channel yet.
5. **The "6-week guarantee" wording** — highest-risk claim. *Recommendation:* until 5.1, market it as a **process promise** ("we find the gap and re-check in 6 weeks"), never a **proven outcome** ("90% close the gap"). data-analyst + attorney bless the exact words.
6. **Brand/domain** — `mi2utor.com` vs the Vercel URL vs "Milo": pick the single public-facing brand before marketing copy is written (blocks 2.1/2.3).
7. **Spend authorization** — Sentry, SMTP, monitoring, possibly Supabase paid tier (for PITR), and the **attorney** are all Founder-owned spend that block Phases 0/1. Approve early; the attorney is the long pole.
