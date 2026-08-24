# Verifying the /parent checkup gate — by hand, once

I could not drive this one: `launchGame` needs a real signed-in account with a real learner row, and
the harness I used for everything else fakes the session (the server rejects the JWT, correctly).
So it is **unverified**, not verified-and-fine. This is what to check and what counts as a failure.

Five minutes. Do it in the same sitting as the billing smoke test.

---

## STEP 0 — CONFIRM THE DEPLOYED BUILD CONTAINS THE FEATURE

⚠️⚠️ **DO THIS FIRST, EVERY TIME, AND DO NOT SKIP IT BECAUSE THE COMMITS "ARE IN".** On 2026-08-24
this exact verification was run against a build that predated the change: step 4 "failed" (expected —
the code was not there) and step 5 "passed" for a reason unrelated to the feature, because with no
skip button the child could not have skipped and the OLD gate let them through on its own terms. A
pass on a build without the feature is not a weak pass; it is a reading of some other mechanism, and
it is indistinguishable from success.

Nothing here is deployed until it is **pushed** — Vercel builds from GitHub, so local commits, however
many, change nothing about what you are testing.

⚠️⚠️ **GREP EACH ROUTE'S OWN BUNDLE. NEXT CODE-SPLITS PER ROUTE.** The first version of this section
told you to grep `/menu` for every string — and `Skip for now` came back **0**, because it lives on
`/diagnostic` and `/menu` never loads that chunk. That reads as "the feature is not deployed" when it
is. The pre-flight check had the exact defect it was written to prevent; it was caught by running it.

```bash
b() { curl -s "https://adaptivelearn.radlor.com$1" -o /tmp/p.html; : > /tmp/b.js
      for u in $(grep -oE '/_next/static/immutable/chunks/[A-Za-z0-9._-]+\.js' /tmp/p.html | sort -u); do
        curl -s "https://adaptivelearn.radlor.com$u" >> /tmp/b.js; done; }
g() { printf '%-36s %s\n' "$1" "$(grep -c "$1" /tmp/b.js)"; }

b /diagnostic
g "Find your starting point"          # CONTROL — must be ≥1
g "Skip for now"                      # the check is optional
g "Pick up where you left off"        # durable resume
g "Where does it start getting hard"  # 17–18 door 2

b /menu
g "Your plan · step"                  # CONTROL — must be ≥1
g "Starting from the beginning"       # the honest plan subtitle
g "Want a plan built around"          # the one-time re-offer
```

Every line must print **1**. Verified against the deploy of `ee6e05d` — all seven, both controls.

| if a CONTROL is 0 | ⚠️ the grep is broken and every other number is meaningless — the chunk path changed, or the fetch failed. Fix that before reading anything else |
|---|---|
| **if a feature string is 0** | that feature is not deployed. **Stop** — the steps below are not testable and a "pass" would be a reading of some other mechanism |

⚠️ **The control rows are not ceremony.** The first run of this grep used the wrong chunk path
(`/_next/static/chunks/` — prod serves `/_next/static/immutable/chunks/`) and returned 0 for
everything, including strings that were definitely present. Without one you KNOW is there, that is
indistinguishable from "the feature is missing".

Also worth confirming the service worker actually rolled over — `curl -s
https://adaptivelearn.radlor.com/sw.js | head -1` should show at least **v142**. A stale worker can
serve you the previous bundle even after a successful deploy; hard-reload if it disagrees.

---


⚠️ **USE A CHILD WHO HAS NEVER PLAYED AND NEVER DONE A CHECK.** Add a new one if needed. Any child
with play history is *grandfathered* by `isEstablished` and goes straight to the menu — that is the
intended behaviour and it will make every step below pass for the wrong reason.

⚠️ **STAY ON ONE DEVICE AND ONE BROWSER PROFILE THROUGHOUT.** The skip is device-local by design.
Switching mid-test reproduces a known, accepted gap (§ "not a failure" below) and will look like a bug.

---

## The four steps

| # | do | PASS | FAIL — and what it means |
|---|---|---|---|
| 1 | On `/parent`, select the new child and tap **Start learning** | Lands on the checkup screen. The card reads *"Milo will find exactly where your child should start…"* and there is a **"Skip for now"** button under "Let's explore" | **No "Skip for now"** → the check is still effectively mandatory; the offer never became optional |
| 2 | Tap **Skip for now** (once — it should not ask anything back) | Goes straight to the menu. No confirmation, no second screen | **Anything asks "are you sure"** → a skip that argues back is a toll, not an option |
| 3 | Read the green plan card on the menu | *"YOUR PLAN · STEP 1 OF n"*, a chapter name, and the subtitle **"Starting from the beginning — Milo adjusts as they play."** | **No plan card at all** → skipping left the child planless. This is the single worst outcome and the thing the whole design exists to prevent.<br>**Subtitle reads "Milo picked this to close the gap"** → the app is claiming a diagnosis nobody made |
| 4 | Go back to `/parent`, tap **Start learning** on the *same* child again | Lands on the **menu**, not the checkup | **Lands on the checkup again** → the gate ignores the skip. "Optional" then means "asked forever", which is worse than mandatory, because it never resolves |

**Step 4 is the one that matters most.** Steps 1–3 I drove with a planted learner and they held;
step 4 is the line I changed in `parent/page.tsx` and could not exercise.

---

## Not a failure — expected behaviour that looks like one

- **A different device or browser offers the check again**, if the child has still played nothing.
  The skip is device-local; the window closes the moment they play any chapter, after which
  `isEstablished` is true everywhere. Accepted trade — syncing it would mean a second write path that
  can disagree with the first, for that window only.
- **An existing child goes straight to the menu without ever seeing the offer.** Grandfathered on
  purpose; established profiles are never gated.
- **The plan's first chapter is not the band's "hardest" one.** A grade-start plan is the band in
  curriculum order from the beginning — less informed than a diagnosed plan, by design.

## While you are there — the re-offer (optional, needs a played chapter)

Play the plan's first chapter to the end, return to the menu, and a second card should appear below
the plan: *"Want a plan built around \<name\>?"*. Tap **Not now** and it should vanish and stay gone
across reloads. That path I did drive with a planted learner; it is here only because you will be one
chapter away from seeing it for real.
