# radlic.com (front door) + app.radlic.com (the app)

One deployment answers both hosts. `src/app/hostSplit.ts` keeps each to its half:

| on | path | goes to |
|---|---|---|
| radlic.com | `/`, `/help`, `/legal/*`, `/api/*`, `/llms.txt`, `robots.txt`, `sitemap.xml`, files in `public/` | stays |
| radlic.com | every other top-level route (`/auth`, `/parent`, `/lesson`, `/consent`, …, read from `src/app`) | **308** to the same path on app.radlic.com (query and `#fragment` kept) |
| app.radlic.com | `/` | 307 to `/auth` (which sends a signed-in user home) |
| app.radlic.com | everything else | stays |

Nothing is rewritten: email links, Stripe's return URL, relative links and the old-domain 308 all land on radlic.com
and move on. `/api/*` answers on both hosts because webhooks and one-click unsubscribe POSTs cannot follow a redirect.

**It is OFF until `NEXT_PUBLIC_APP_URL` is set.** A sign-in is kept per domain (localStorage), so a family
signed in on radlic.com is signed OUT by the switch — do it before real families sign in.

## Founder's steps, in this order

0. The rename switch is done first: radlic.com live and `NEXT_PUBLIC_SITE_URL=https://radlic.com` (RENAME-MANUAL §A).
1. **DNS + Vercel:** add `app.radlic.com` to the Vercel project (Settings → Domains). At the DNS host, a `CNAME` for
   `app` → the value Vercel shows (usually `cname.vercel-dns.com`). Wait for Vercel to show it valid.
2. **Supabase → Authentication → URL Configuration:** Site URL = `https://app.radlic.com`; Redirect URLs add
   `https://app.radlic.com/**` (keep the radlic.com entry until the switch has settled). The auth emails'
   `{{ .SiteURL }}` then points at the app.
3. **Google Cloud → OAuth client:** add `https://app.radlic.com` to Authorized JavaScript origins. The redirect URI
   (Supabase's callback) does not change.
4. **Stripe:** nothing. The webhook is `/api/…` and answers on both hosts.
5. **Vercel → Environment Variables (Production):** `NEXT_PUBLIC_APP_URL=https://app.radlic.com`, then **redeploy**
   (the redirects are built in at build time — setting the variable alone changes nothing).
6. **Live checks after the deploy:**
   - `https://radlic.com` shows the landing page; **Log in** lands on `https://app.radlic.com/auth`.
   - `https://app.radlic.com` goes to the sign-in page.
   - `https://radlic.com/legal/privacy` and `/help` stay on radlic.com.
   - Sign up with Google and with email → you end on app.radlic.com, signed in.
   - A consent email's link opens on app.radlic.com with its `#t=` still in the address bar.
   - `curl -sI https://radlic.com/parent` → `308`, `location: https://app.radlic.com/parent`.

Undo: remove `NEXT_PUBLIC_APP_URL` and redeploy. radlic.com serves everything again.
