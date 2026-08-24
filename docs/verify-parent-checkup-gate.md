# Verifying the /parent checkup gate — by hand, once

I could not drive this one: `launchGame` needs a real signed-in account with a real learner row, and
the harness I used for everything else fakes the session (the server rejects the JWT, correctly).
So it is **unverified**, not verified-and-fine. This is what to check and what counts as a failure.

Five minutes. Do it in the same sitting as the billing smoke test.

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
