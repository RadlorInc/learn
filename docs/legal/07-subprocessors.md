# Service Providers and Subprocessors

> **STATUS: BETA — published 25 September 2026 on the founder's decisions for the private beta; attorney review pending (each decision is recorded in ATTORNEY-PACKET.md).**
> This list is published alongside the Privacy Policy and must match it exactly. It is also the working document for the vendor review in the Information Security Program.

**Last reviewed:** 22 September 2026, from the code, the database and a driven session on production — not from memory.
**Reviewed by:** Rakif Bobre

---

## How to read this

A **service provider** processes data on our instructions and for no purpose of its own. Under COPPA, handing children's personal information to a third party for the third party's *own* purposes is a **disclosure**, and disclosure needs separate parental consent. The right-hand column is therefore the column that matters.

## The list

| Vendor | What it does for us | Does it receive information about a child? | Exactly what | Where | Basis |
|---|---|---|---|---|---|
| **Supabase** | The entire backend — database, authentication, file storage. The browser talks to it directly. | **Yes.** This is the only service that holds a child's information. | First name, avatar number, age band, grade, chosen lessons; lesson progress, points, game-time settings; "didn't get it" taps; product events; crash records; the child's sign-in credentials | us-east-1 (read from the provider's API) | Service provider — integral to delivering the service |
| **Supabase platform logs** (same vendor, separate matter) | The provider's own request logging, outside our database schema | **Yes, incidentally.** Every request a child's device makes | IP address, user agent, and an approximate location derived from IP — city, region and country — on every request sampled, plus the signed-in account id on most | Same | Service provider. **Outside our own retention jobs — see the Retention Policy** |
| **Vercel** | Hosting and content delivery | **Yes, incidentally.** Request logs, and crash lines written to the console | IP address, request path, user agent; a crash line can carry a child's internal id and the page being viewed | Functions run in iad1, Washington, D.C., USA (confirmed from the Vercel dashboard, 24 September 2026) | Service provider — integral |
| **Stripe** | Subscription checkout and billing — **not used during the beta**: billing is switched off and no data is sent to Stripe | **No.** | None during the beta | — | Service provider, parent data only, once billing starts |
| **Resend** | Delivers every email the service sends. It is configured as the SMTP relay behind the authentication service's mailer, so although the application contains no email code of its own, **every message a parent receives is delivered by Resend** | **No**, unless a progress email is ever built that names a child — none exists | The parent's email address and the content of the message | United States: North Virginia, us-east-1 (confirmed from the Resend dashboard, 24 September 2026) | Service provider |
| **Google Sign-In** | Optional sign-in for adults | **No.** Adults only, by top-level redirect; we send nothing | — | — | Not a recipient of our data |
| **GitHub Actions** | Encrypted database backups, stored as a 30-day build artifact | **Would** — a backup contains everything | The whole database, encrypted | GitHub (github.com), United States; kept 30 days, set by our backup job | Service provider. Backups working again from 23 September 2026; a full restore was proven that day. See the Security Program. |
| **Google Fonts** | Nothing at runtime | **No.** Fonts are downloaded at build time and served from our own domain. Verified: 212 font files emitted, zero references to Google's font host in the built stylesheet | — | — | Not a runtime recipient |

## Services that receive nothing about a child

No analytics provider. No error or crash monitoring provider. No advertising or tracking service. No AI or text-to-speech provider at runtime — every audio clip a child hears is a static file served from our own domain, and where a clip is missing the fallback is the browser's own on-device speech. **No child's input is ever sent to an AI or audio vendor.**

**How this absence was established**, so it can be checked again rather than taken on trust: no analytics package is installed; no external script, beacon, `sendBeacon`, WebSocket or tracking pixel exists in the source; the Content-Security-Policy served by production restricts connections to our own origin and Supabase, so the browser is structurally unable to reach an analytics host; and a real child session driven on production — module list, a full lesson with audio, practice problems — produced 56 requests to exactly one origin, our own, with zero third-party requests. The same capture shows the audio and page loads, which proves the capture was live rather than empty.

## Two questions still open before this list can be relied on

1. **`MONITORING_INGEST_URL` — settled, 23 September 2026. It is not set.** The production environment holds five variables and this is not among them, so although the application would forward crash records if it were configured, nothing is being forwarded. **No crash data leaves our infrastructure for a third party.** Re-check whenever environment variables change, since setting this one silently adds a recipient of children's identifiers. Confirmed on 24 September 2026 from the Vercel dashboard: it is not set in the Preview or Development environments either.
2. **Written terms with Supabase and Vercel** confirming they act on our instructions only. Both are plainly service providers by function; the attorney should confirm the paperwork matches.

## Vendors that must never receive children's data

- **Radlor Ops**, the internal review tool. It lives in a separate database project with its own logins and holds no children's data. Verified 22 September 2026.
- **ElevenLabs** and **Chatterbox** — present only in developer scripts that the application never calls. No child's voice or input reaches either, and none ever should without a fresh review.
- Any analytics, advertising or session-recording service. None is installed, and none may be added without going through the checklist below first.

## Review checklist — run before each release that adds or changes a vendor

- [ ] Is the vendor in the table above?
- [ ] Do we know, from the code rather than from memory, exactly what is sent to it?
- [ ] Does anything about a child reach it? If yes, is that a service-provider relationship or a disclosure?
- [ ] If it is a disclosure, is separate parental consent in place?
- [ ] **Do the vendor's terms permit it to train models on data sent through it?** We promise parents that a child's work is never used for model training. That promise breaks the moment a child's answer reaches a vendor whose terms allow it.
- [ ] Is the Privacy Policy consistent with this table?
- [ ] Is there a written agreement with the vendor covering children's data?

---

### Notes for the attorney reviewing this draft

1. The picture is simpler than feared: **the only service holding a child's information is our own database provider**, with hosting seeing it incidentally through logs. Please confirm both are service providers rather than disclosures, which is what allows email-plus consent to be used at all.
2. The database provider's own platform logs record IP address, user agent and an IP-derived city/region/country for every request a child's device makes. That is more than our own tables hold and it sits outside our deletion jobs. Please advise how it must be described to parents and whether it changes the analysis.
3. Please advise on the written terms needed with the hosting and database providers.
4. Please confirm the treatment of the encrypted backup artifact once backups are working again.
