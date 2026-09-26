# R7 — SEO review: radlor.com (+ /radlic) and radlic.com public pages

Reviewer: technical-SEO pass, 2026-09-26. Read-only. App repo `w-review` @ `06cee602`, radlor-site `w-review-site` @ `b672ba5`.
Live pages fetched with public GETs only (curl with a Googlebot UA, and headless Chromium via Playwright 1.63).
Raw captures: `review-scratch/seo/live/` (HTML + headers of every page named below).

## Summary

The technical base is good and mostly measured clean: one canonical per page, a correct cross-domain canonical from
radlic.com/ to radlor.com/radlic backed by a browser redirect to the same URL, the shared entity ids match exactly on
both sites, CLS is 0.000 everywhere, and **radlor.com makes zero off-origin requests on all 13 pages** (runtime, after
scroll, with a positive control). The problems are:

1. **The "KG to 8" claim is false today** and the two sites disagree about it (SEO-01).
2. **The product's landing page shares as a blank card** — radlor.com/radlic is the one page on radlor.com with no
   `og:image` (SEO-02), in the week the beta link is being sent around.
3. **radlic.com/ makes a signed-out visitor download ~1 MB of app JS before it sends them to the landing page** —
   2.6 s on slow 4G (SEO-03).
4. **There is almost nothing to rank for.** 282 topics exist; zero of them have a public page (SEO-08).

## 1. Titles, descriptions, canonicals — Measured (live)

| page | title (chars) | description | canonical | og:image |
|---|---|---|---|---|
| radlor.com/ | Radlor — Learning software that adapts… (67) | 194, says **grades 3 to 8** | self | yes |
| radlor.com/radlic | Radlic — math lessons that adapt to your child, **grade KG to 8** (61) | 193, **KG to 8** | self | **NO** |
| radlor.com/about, /contact, /data-and-safety, /for-schools, /privacy, /terms, /waitlist, /writing, /writing/* | 14–61 | 79–276, all distinct | self | yes |
| radlic.com/ | Radlic — … **KG to grade 8** (61) | **KG to grade 8** | **https://radlor.com/radlic** | yes (og:url = radlic.com) |
| radlic.com/help | Help · Radlic (13) | own, 150+ | self | yes, but og:url/og:title are the **site default** |
| radlic.com/legal/privacy, /parent-rights | own | own | self | inherited |
| radlic.com/legal/terms | own | own | self, `noindex, follow` (dark) | — |

- Every radlor.com page title and description is distinct (Measured, table above). `/help`'s 13-char title is weak but
  it is a help page; not worth a finding on its own.
- **radlic.com/ from Google's side.** The server HTML carries `<link rel=canonical href="https://radlor.com/radlic">`
  and a fallback page with no `<h1>`; Googlebot renders JS, `ResumeSignedIn.tsx:25-35` finds no session and calls
  `window.location.replace(LANDING_URL)`. So a rendering crawler gets a canonical AND a JS redirect pointing at the
  same URL — consistent signals, no split (Measured: headless Chromium signed out lands on radlor.com/radlic in 3/3
  runs). A non-rendering crawler (most answer-engine fetchers) sees the canonical only. A cross-domain canonical is a
  hint, not a directive: for the query "radlic", Google *may* still prefer the radlic.com origin because the domain
  matches the brand — **Assumption**, only Search Console can tell (BLOCKED, §9).
- `og:url` on radlic.com/ is `https://radlic.com` while the canonical is radlor.com/radlic, and every app page that
  does not set its own `openGraph` inherits `og:url: '/'` from `src/app/layout.tsx:91-98` — so a shared `/help` link
  previews as the home page (SEO-05).

## 2. Structured data — shared entity ids (Measured, live)

| | radlic.com/ | radlor.com/radlic |
|---|---|---|
| `SoftwareApplication.@id` | `https://radlic.com/#app` | `https://radlic.com/#app` |
| `url` | `https://radlor.com/radlic` | `https://radlor.com/radlic` |
| `publisher.@id` | `https://radlor.com/#organization` | `https://radlor.com/#organization` |
| Organization declared | stub (`@id`, name, url) | full node (sameAs ×6, address, email) on every radlor.com page |

**They match exactly.** The stub Organization on radlic.com/ (`src/app/page.tsx:43`) carries the same `@id` and merges;
harmless. Differences that are fine: `alternateName` (radlor.com adds "AdaptiveLearn", "Milo" — old names, useful for
resolution) and `brand` (app only).

Not gated: `publicSeo.test.ts:95-104` asserts the app's constant equals a literal (good) but checks `page.tsx` by
**grepping its source text** for `publisher: { '@id': COMPANY_ID }` — the grep-coupled shape CLAUDE.md's tautology row
(a) warns about — and nothing anywhere compares the app's ids with radlor.com's. radlor-site has no CI, and
`check:site-claims` reads only fetch-causing tags, not JSON-LD. The claim "they match" is therefore true today by
measurement only (SEO-07). Also stale: `src/app/site.ts:72-73` says radlor.com "still names the pre-rename id" —
Measured false, it names `https://radlic.com/#app`.

`/help` emits `FAQPage` JSON-LD. Google has shown FAQ rich results only for government/health sites since 2023, so it
earns no snippet; it is harmless and still useful to answer engines. Not a finding. `SoftwareApplication` rich results
need a rating/review, so that markup's value here is entity resolution, not a snippet.

## 3. Robots, sitemaps, index coverage — Measured (live)

**radlor.com** — `robots.txt`: `Allow: /`, sitemap, `Host:` (Yandex-only, harmless). Sitemap: 12 URLs = `PAGES` + 3
posts; matches the repo (`app/sitemap.ts`). `/adaptivelearn` → **308** → `/radlic` ✅. `www` → 308 apex ✅.
`/waitlist` is not in the sitemap but is still `index, follow` with a self-canonical and still says the waitlist is the
way in (SEO-09).

**radlic.com** — `robots.txt` disallows exactly `PRIVATE_ROUTES` (`src/app/site.ts:86-90`), matches repo. Sitemap: `/help`
+ the 5 published legal pages; `/legal/terms` (dark, `noindex`) correctly absent. `www.radlic.com` and
`adaptivelearn.radlor.com/` → 308 → radlic.com/ ✅.

Per-route coverage of every signed-in / non-public app route (live, signed out, rendered in Chromium where noted):

| route | robots.txt | meta robots (live) | verdict |
|---|---|---|---|
| /parent*, /admin*, /modules, /lesson, /practice, /game, /play, /story, /menu, /shop, /api/ | Disallow | none | blocked from crawl; can appear URL-only if linked |
| /auth, /auth/* | Disallow | none | **linked 7× from radlor.com (/ ×4, /radlic ×3)** → likeliest to appear URL-only |
| /consent/* | Disallow | `noindex,nofollow` in layout | the noindex is invisible to Google (it may not crawl); token is in the `#fragment` (`features/consent/ConsentLink.tsx:25`), so nothing leaks |
| /lesson-preview | Disallow **by accident** (prefix `/lesson`) | client `noindex` (soft 404, HTTP 200) | fine |
| /ui-preview | allowed | client `noindex`, renders "We can't find that page" at HTTP 200 | fine for Google (renders JS); soft 404 |
| **/demo** | **allowed** | **none** | **indexable**: HTTP 200, default home title + description, body "New lessons are on the way" (SEO-04) |
| /email/unsubscribe | allowed | `noindex,nofollow` | fine (title renders "Radlic · Radlic", cosmetic) |
| 404 | — | `noindex`, real 404 status | fine |

No page with child data is reachable signed out: every signed-in route is client-rendered behind the auth guard, so the
server HTML of `/parent` is the generic app shell (Measured: live `/parent` HTML has the home title and no child
content). The index-coverage gap is SEO hygiene, not a privacy leak — which is why SEO-06 is Low despite rule 7.

## 4. Internal links between the sites — Measured

- radlor.com/ → `/radlic` ×7, `radlic.com/auth` ×4. radlor.com/radlic → `radlic.com/auth` ×3, `/help`, three legal pages
  (one of them, `/legal/terms`, is the dark `noindex` page), and `/` (radlor home).
- radlic.com/ → radlor.com/radlic ×2, radlor.com ×1, `/help`, `/auth`, `/legal/*`.
- radlic.com/help → `/` (which JS-redirects to the landing page), `/parent` ×2, `/legal/privacy`. It does **not** link
  the landing page directly — minor.
- The most-linked radlic.com target from the marketing site is `/auth`, a robots-disallowed URL. See SEO-06.

## 5. Core Web Vitals (lab) — Measured

`review-scratch/seo/cwv.mjs` — Chromium, CPU 4× throttle via CDP, median of 3; mobile 390×844 @3x and desktop
1440×900; **network unthrottled** (this office connection). `review-scratch/seo/redirect-cost.mjs` — mobile, CPU 4× +
"slow 4G"-like network (150 ms RTT, 1.6 Mbps down).

| page | LCP mobile / desktop (unthrottled net) | LCP mobile, slow 4G + 4× CPU | CLS |
|---|---|---|---|
| radlor.com/ | 196 / 164 ms | 976 ms (of the doc) | 0.000 |
| radlor.com/radlic | 240 / 252 ms | 1,396 ms | 0.000 |
| radlic.com/ → radlor.com/radlic | 204 / 192 ms **after** the redirect | **2,594 ms until the landing page is even requested**, then ~1,404 ms LCP ⇒ **~4.0 s** | 0.000 |
| radlic.com/help | 156 / 148 ms | 1,160 ms | 0.000 |
| radlic.com/legal/privacy | 160 / 220 ms | — | 0.000 |

All inside "good" (LCP < 2.5 s, CLS < 0.1) **except the radlic.com/ path on a slow network**, where the visitor waits
for ~975 KB (decoded) of app JavaScript to boot only to learn there is no session (SEO-03). Caveats: lab numbers; at
tens of families there will be no CrUX field data (Assumption), so lab is all there is. The 3D journey on radlor.com/
is imported after mount and does not delay LCP (the LCP element is text).

`/help` downloads 4.57 MB decoded / 35 requests in its first 8 s, including a 2.28 MB (~576 KB brotli) lesson-content
chunk that is not referenced from the HTML — **Suspected** cause: Next `<Link>` prefetch of `/parent`. LCP is unaffected;
it is bandwidth on a phone. Left to the performance reviewer (SEO-12).

## 6. No third-party requests on radlor.com — Measured

`review-scratch/seo/offorigin-all.mjs` loads every URL in the live sitemap plus `/waitlist`, scrolls, waits 4 s, and
counts **every** request whose host is not radlor.com (all resource types, not just script/style/font):
**0 on all 13 pages.** `cwv.mjs` counted off-origin script/style/font on `/` and `/radlic` at both sizes: **0**.
Positive control (`node review-scratch/seo/cwv.mjs --control`): a page with a Google Fonts stylesheet and a jsDelivr
script → the counter saw 3 (stylesheet, script, font) across fonts.googleapis.com / fonts.gstatic.com /
cdn.jsdelivr.net. So "0" is a clean result, not a blind one. The privacy promise holds at runtime, which
`check:site-claims` (static HTML only) cannot see on its own.

radlic.com/help and /legal/privacy: 0 off-origin script/style/font as well. (radlic.com/ shows 22 "off-origin" only
because the final URL is radlor.com — they are radlic.com's own chunks loaded before the redirect.)

## 7. Headings, image alt, OG/Twitter — Measured

- One `<h1>` on every radlor.com page; sensible h2/h3 nesting on `/` and `/radlic`. radlic.com/help: h1 + one h2 per
  question. radlic.com/ has no heading — acceptable, it is a router page canonicalised away.
- Images: radlor.com/ has 1 `<img>`, with alt; `/radlic` has none (the chalkboard demo's words are real HTML text —
  "More friends, more cuts" is in the visible text — good for indexing).
- OG/Twitter: radlor.com pages all have 1200×630 cards **except /radlic** (SEO-02). radlic.com uses `twitter:card:
  summary` with a 1200×630 image (`layout.tsx:101`) — `summary_large_image` would show the card it already makes.

## 8. Content gaps vs what US parents of grades 3–8 search for

What exists publicly to rank: radlor.com/radlic (362 visible words), radlor.com/ (506), /for-schools, three essays,
radlic.com/help. What the product has: **36 modules / 282 topics** (`docs/new-flow/curriculum.md`), each with named,
parent-legible topics ("Division with a remainder", "Fractions on a number line", "Two-digit times two-digit",
"Scientific notation", "The Pythagorean theorem"…). **None has a public page.** The module list appears once, as a
run-on paragraph, in radlor.com's `llms.txt`.

Parent searches in this space are grade + topic shaped ("3rd grade multiplication practice", "4th grade long
division", "5th grade adding fractions with unlike denominators", "how to explain ratios to a 6th grader") —
**Assumption: no search-volume data was sourced for this review**; treat the phrasing as a hypothesis to check in a
keyword tool or Search Console before building anything. Established competitors (IXL, Khan Academy) own these
queries with one page per skill; a new domain will not outrank them on head terms, but grade + module pages are
the cheapest way to exist at all, and each one can carry a real chalkboard demo (the snapshot machinery already exists:
`scripts/landing-demo-snapshot.mts` → `content/radlic-demo.json`).

`APP_GRADES` in radlor-site `site.ts` is a hand copy of the app's `TITLES` (`src/features/lessons/modules.ts:11-26`) —
compared by eye today: identical. It has no gate (its own comment says so); per-grade pages built from it would inherit
that drift risk.

**"Grade KG to 8" vs content (SEO-01).** Measured: the live `/modules` bundle (17 chunks) has 0 hits for
`Kindergarten`/`"KG"`, while the control `g3m1` hits; `src/` on `main` has 0 hits; `GRADES` is `[3..8]`. KG–2 exists
only on the unpushed branch `kg2-story-chapters` (handoff ✉️ ②). Yet the titles/descriptions of radlic.com (every
page that inherits the root), radlor.com/radlic's title, description, JSON-LD and visible copy ("Pick whole modules
or single topics, from any grade from KG to 8"), the OG alt text and radlic.com's `llms.txt` summary line all say KG to 8 —
while radlor.com/'s description, radlor.com's `llms.txt` and radlic.com's own `llms.txt` body say **3 to 8**. A parent of
a first-grader who signs up finds nothing for their child; a search engine or answer engine gets two answers.

## 9. BLOCKED / not verified

- **Search Console / Bing Webmaster**: whether either property is verified, what is actually indexed, which canonical
  Google chose for radlic.com/, and whether `/auth` or `/demo` already appear. Needs Rafi's GSC access.
- Field CWV (CrUX): almost certainly no data at this traffic (Assumption).
- Search volumes for §8: not sourced.
- Safari/WebKit and a real phone: lab Chromium only.

## 10. Recommendations, ranked by impact ÷ effort

| rank | do | impact | effort | bucket |
|---|---|---|---|---|
| 1 | SEO-02: give /radlic a share image (`app/radlic/opengraph-image.tsx`, or `images` in its `openGraph`) | high: the beta link previews blank | S | own |
| 2 | SEO-01: say "grades 3 to 8" everywhere until KG–2 ships, then flip both sites in one change | high: honesty + one entity answer | S | rafi |
| 3 | SEO-04: `robots: { index: false }` on `/demo` (or delete the route with the legacy chapters) | low-med | S | own (noindex) / rafi (delete) |
| 4 | SEO-05: `/help` declares its own `openGraph` (url/title/description); `twitter.card: 'summary_large_image'` | low | S | own |
| 5 | SEO-07: add a live JSON-LD parity assertion to `check:site-claims` (fetch both pages, compare `@id` + `publisher`), watched red with one id changed; fix the stale `site.ts:72-73` comment | med (guards the entity) | S | own |
| 6 | SEO-03: a tiny static pre-hydration script on `/` (like `/text-size.js`) that reads the Supabase storage key synchronously and `location.replace`s to `LANDING_URL` when absent, before the app bundles load | med: ~2.5 s off every cold signed-out visit on slow networks | M | own |
| 7 | SEO-08: six per-grade pages on radlor.com (module + topic names, one chalkboard each), then measure in GSC before going per-module | high long-term, zero today | M–L | rafi |
| 8 | SEO-09: decide /waitlist — noindex it or redirect to /radlic | low | S | rafi |
| 9 | SEO-06: leave Disallow for signed-in routes (not worth it at this size); optionally let `/auth` be crawled with its own title | low | S | own |
| 10 | SEO-11 / SEO-10 / SEO-12 | low | — | see table |

## Findings table

| ID | title | area | severity | evidence | effort | when | bucket | files |
|---|---|---|---|---|---|---|---|---|
| SEO-01 | "Grade KG to 8" in titles, descriptions, JSON-LD, OG alt, llms.txt and visible copy; no KG–2 content is live, and radlor.com/ + both llms.txt bodies say 3 to 8 | content / entity | High | Measured (live bundle 0 hits for KG with `g3m1` control; `GRADES=[3..8]`; live head tags) | S | fix now — beta families are arriving; flip back when `kg2-story-chapters` ships | rafi | radlor-site `app/radlic/page.tsx:21-25,54`; app `src/app/layout.tsx:85-105`, `src/app/page.tsx:38`, `src/app/opengraph-image.tsx:6,39`, `src/app/llms.txt/route.ts:25` |
| SEO-02 | radlor.com/radlic has no og:image/twitter:image (only radlor.com page without); page's `openGraph` object replaces the inherited file-based image (mechanism Suspected) | social / OG | Medium | Measured (live head of all 13 radlor.com pages) | S | fix now — link is being shared this week | own | radlor-site `app/radlic/page.tsx:20-26` |
| SEO-03 | radlic.com/ client redirect: signed-out visitor waits 2.6 s (slow 4G + 4× CPU, median of 3) and ~975 KB decoded app JS before the landing page is requested, ~4 s to landing LCP | performance / redirect | Medium | Measured (`redirect-cost.mjs`) | M | after beta | own | `src/app/page.tsx`, `src/app/ResumeSignedIn.tsx`, `public/` (new static script) |
| SEO-04 | `/demo` is indexable: 200, not disallowed, no noindex, inherits the home title/description, thin legacy "New lessons are on the way" page | index coverage | Low | Measured (live + rendered) | S | after beta | own (noindex) / rafi (delete route) | `src/app/demo/page.tsx`, `src/app/site.ts:86-90` |
| SEO-05 | `/help` (and every app page without its own `openGraph`) inherits `og:url=https://radlic.com` and the home og:title; radlic.com uses `twitter:card: summary` with a 1200×630 image | social / OG | Low | Measured (live head) | S | after beta | own | `src/app/layout.tsx:91-106`, `src/app/help/page.tsx:31-36` |
| SEO-06 | Signed-in routes rely on robots Disallow only (no noindex); `/auth` is linked 7× from radlor.com so can surface URL-only; `/consent`'s noindex is unseeable under Disallow. No child data exposed (client-rendered shell; consent token in #fragment) | index coverage | Low | Measured (live robots + meta); token transport Suspected (read `ConsentLink.tsx:25`) | S | later — not worth it at this size | own | `src/app/site.ts:86-90`, `src/app/robots.ts`, `src/app/consent/layout.tsx:4` |
| SEO-07 | Cross-site entity-id parity is ungated: `publicSeo.test.ts` greps `page.tsx` source text and never compares with radlor.com; radlor-site has no CI; `check:site-claims` ignores JSON-LD. Ids match today (Measured). Stale comment `site.ts:72-73` says radlor.com still has the old id | structured data / checks | Low | Measured (live JSON-LD both sites) | S | after beta | own | `src/__tests__/publicSeo.test.ts:95-104`, `src/app/site.ts:72-73`, radlor-site `scripts/check-site-claims.mjs` |
| SEO-08 | 282 topics / 36 modules, zero public pages; the only public product page is 362 words; no grade or topic landing pages for grade-3–8 searches (search demand = Assumption) | content gap | Medium | Measured (sitemaps, word counts); demand Assumption | M–L | after beta, validate with GSC first | rafi | radlor-site `site.ts` (`APP_GRADES`, `PAGES`), new `app/(site)/grades/*` |
| SEO-09 | `/waitlist` still `index,follow` + self-canonical, off the sitemap, contradicts "Try Radlic" | index / copy | Low | Measured | S | after beta (founder decision, handoff 🌐 item 2) | rafi | radlor-site `app/(site)/waitlist/page.tsx:7-9` |
| SEO-10 | Old host root: adaptivelearn.radlor.com/ → 308 radlic.com/ → JS → radlor.com/radlic (3 hops, one client-side); old backlinks consolidate via canonical hint only | redirects | Low | Measured | S | won't fix — cheap chain, old host has little equity | own | `src/app/site.ts:30-38` |
| SEO-11 | `SoftwareApplication.offers` states price 0 on both sites while paid plans exist (hidden, Stripe test mode) — becomes a false claim the day billing goes live | structured data | Low | Measured (live JSON-LD); billing state from handoff | S | when billing launches | rafi | `src/app/page.tsx:41`, radlor-site `app/radlic/page.tsx:42` |
| SEO-12 | Public `/help` pulls 4.57 MB decoded JS in 8 s incl. a 2.28 MB lesson chunk not in its HTML (Suspected `<Link href="/parent">` prefetch); LCP unaffected | performance | Low | Measured (weight); cause Suspected | S | later — hand to performance review | own | `src/app/help/page.tsx` |
