# Cookie and Tracking Notice

> **STATUS: DRAFT — NOT LEGAL ADVICE — MUST BE REVIEWED BY A LICENSED US ATTORNEY BEFORE PUBLICATION.**
> The table below was read off a real session driven on production on 22 September 2026, not written from memory. One gap remains, marked in the table: a signed-in child's session could not be observed, because that needs a real account.

**Effective:** [PLACEHOLDER — date]

---

## Plain version

**Milo sets no cookies at all.** It stores a small amount of information on your own device so the app can work offline, remember your settings, and keep you signed in. That information stays on the device. **We do not use advertising cookies, we run no third-party tracking of any kind, and nobody can follow your child from Milo to another website or app.**

## What we store on the device

| Name | Where | What it is for | How long it lasts | Type |
|---|---|---|---|---|
| — | Cookies | **We set none.** | — | — |
| `milo-kv-migrated` | Local storage | Remembers that your saved data has already been moved to the newer storage format | Until you clear it | Strictly necessary |
| `milo` database, `kv` store | On-device database | Your child's profile, what they last played, work waiting to sync if you go offline, voice and speed preferences, and the chosen language | Until you clear it | Functional |
| `milo-shell`, `milo-static`, `milo-assets` | Cache storage | The app itself, its images and its audio, so lessons work offline and use less data. About 7 MB after one lesson, growing with each lesson's audio | Until the app updates to a new version | Strictly necessary |
| `al-lang` | Local storage | The language you chose for the parent dashboard and the consent screens (English or Spanish) *(read from the code, 24 Sep 2026)* | Until you clear it | Functional |
| `al-dash-prefs:<account id>` | Local storage | Your dashboard choices: reminders snoozed or hidden, kinds of reminder switched off, when you last visited, which guided tours you have seen. Nothing about a child *(read from the code)* | Until you clear it | Functional |
| `exercise-done:<child id>:<exercise id>` | Local storage | That a child has finished a class exercise, so it shows as done on this device *(read from the code)* | Until you clear it | Functional |
| `exercise-results-pending` | Local storage | A child's class-exercise answers that could not be sent yet (for example, offline), kept until they are sent *(read from the code)* | Until they are sent | Strictly necessary |
| `milo_active_plan_<child id>` | Local storage | An older per-child learning-plan record, still written by some screens *(read from the code)* | Until you clear it | Functional |
| `milo-pwa-dismissed` | Local storage | That you dismissed the "install the app" banner *(read from the code)* | Until you clear it | Functional |
| `milo-auth` | Local storage | Keeps you signed in | Until sign-out or expiry | Strictly necessary |
| `milo_active_learner` | Session storage | Which child's profile this browser tab is using | Until the tab closes | Strictly necessary |

> [PLACEHOLDER — the last two rows are read from the application's configuration rather than observed in a live signed-in session. Before publication, sign a child in and enumerate the storage again, so every row in this table has been seen rather than inferred.]

**If you are not signed in, nothing is stored about your child at all.** Verified: after a full lesson and practice session signed out, the on-device store was empty.

## What we do not do

- No cookies.
- No advertising or marketing storage.
- No third-party scripts, beacons or tracking pixels — **none, anywhere**. The security policy the site serves to your browser only permits connections to Milo itself and to our database provider, so the browser is not able to reach an advertising or analytics company even in principle.
- No device fingerprint, no advertising identifier, no cross-site identifier.
- No session recording.

## What we do record, on our own systems

We log a small number of product events — such as a session starting — so we can see which parts of the app are used. These are stored in our own database, they are tied to a child's internal identifier rather than to a name, and they are **deleted automatically after 90 days**. They are not shared with anyone and they are not used for advertising.

Our database and hosting providers also keep their own request logs, which include the IP address and browser type of every visit. That is described in our [Privacy Policy](https://adaptivelearn.radlor.com/legal/privacy).

## Your choices

Everything we store on the device is needed for the app to work or to remember your settings, so there is nothing to switch off — turning it off would stop the app working. You can clear your browser's storage at any time; if you do, you will be signed out and the offline copy of your lessons will be downloaded again next time.

[PLACEHOLDER — if any non-essential storage is ever added, this section must be replaced with a real consent mechanism, and the default must be off.]

## Questions

support@radlor.com

---

### Notes for the attorney reviewing this draft

1. Please confirm whether a separate notice is needed at all, or whether a section inside the Privacy Policy is sufficient — the product sets no cookies and uses only necessary and functional on-device storage.
2. Please confirm the "no consent banner needed" position holds for every state where we will have users, given that the service is child-directed.
3. Please advise whether the first-party product events described above need to be named more specifically here, or whether the Privacy Policy treatment is enough.
4. If the product is ever offered outside the US, this notice will need to be revisited entirely.
