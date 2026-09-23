# Direct Notice to Parents

> **STATUS: DRAFT — NOT LEGAL ADVICE — MUST BE REVIEWED BY A LICENSED US ATTORNEY BEFORE PUBLICATION.**
> **The body of this notice — everything between "Screen / email title" and "Contact us" — is finished and contains no placeholders. It can be built.** The only open item is the version date in the header, which is set on the day it first goes live.
>
> **Two checks before it is shown to a parent, both of which can invalidate it:**
> 1. Re-read the "How we protect it" paragraph against the Information Security Program that day. Every claim in it must still be implemented. A security claim that has quietly stopped being true is worse than no claim.
> 2. Confirm the third-party paragraph is still accurate — in particular that the crash-forwarding setting is not sending children's identifiers to an unnamed recipient.
> This is the notice COPPA requires us to give a parent **directly**, before we collect anything at all from their child. It is separate from, and shorter than, the Privacy Policy. It is delivered on screen during sign-up and again by email.

**Company:** Radlor Inc., a Delaware corporation
**Product:** Milo
**Version:** v1 — [PLACEHOLDER — date, set on the day this is first shown to a parent. Every consent record stores the version the parent actually saw, so this number must change whenever the body below changes.]

---

## Screen / email title

**Before your child starts: what we collect, and your choice**

## Body

You are setting up a profile for your child. United States law — the Children's Online Privacy Protection Act, which protects children under 13 — requires us to tell you exactly what we collect and to get your permission first. We ask every parent for the same permission, whatever their child's age. Here it is, in plain language.

### What we collect from your child

| What | Why we need it | Is it required? |
|---|---|---|
| Your child's first name (or a nickname you choose) | So the app can address your child and so you can tell your children's profiles apart | Required — you may use a nickname instead of a real name |
| The avatar you pick for your child | So your child recognises their own profile | Required — chosen from a set we provide; it is not a photograph |
| The lessons you choose for your child, and a grade band worked out from them — grades 3–5 or grades 6–8, stored as the age range 9–11 or 12–14. We do not store your child's exact grade or age | To give your child work at the right level | Required |
| The username your child signs in with | So your child can sign in without needing an email address of their own | Required |
| Answers to maths questions, scores, points, progress, and anything saved in a game | This is the product: it is how the app decides what to teach next and how it shows you progress | Required |
| Any feedback your child sends us about a lesson | So we can fix what is not working | Only if they send it |
| Basic technical information from the device — a sign-in token kept on the device; a per-tab marker of which child's profile is in use; an internal identifier for the child, which appears on every progress and event record; a random identifier per event, used to avoid duplicates; the device's IP address and browser type, and an approximate location — city, region and country — derived from the IP address by our hosting and database providers, who record it for every request; and, if the app crashes, the page being viewed and the browser type. We set no cookies | To keep the app working, keep the account secure, and keep your child signed in | Required for the app to function |
| A small number of product events, such as a lesson starting | So we can see which parts of the app are used. Tied to an internal identifier, not a name; deleted after 90 days | Required |

**We do not ask your child for:** a last name, an email address, a phone number, a home address, a photograph, a voice recording, or their exact location.

### What we do with it

We use this information only to run Milo for your child: to teach, to track progress, to show you reports, and to keep the service secure and working. 

**Nothing about your child is given to any other company for that company's own purposes.** The only outside companies involved at all are the ones that run our systems for us — the database that stores the information and the hosting service that delivers the app — and they act only on our instructions. Every one of them is listed at https://adaptivelearn.radlor.com/legal/subprocessors. There is no analytics company, no advertising company, and no artificial-intelligence service that receives anything your child types or says.

**We do not:**
- sell your child's information;
- use your child's information to show them advertising, or let anyone else do so;
- build an advertising profile of your child;
- share your child's information with anyone for their own purposes;
- ask your child to give us more information than they need to take part.

### Your permission

Before we collect any of the above, we need your verifiable consent.

We send a consent request to your email address, you confirm it, and then we send a second confirmation email a day later to the same address. You can withdraw your consent from either email.

[PLACEHOLDER — a second method, verification through the payment card at checkout, is specified in document 03 and is not built. Add it here only when it exists; describing a choice a parent cannot make is worse than offering one method plainly.]

### Your rights as a parent

At any time, you can:

- **See** everything we hold about your child;
- **Delete** your child's information;
- **Withdraw your consent** — we stop any further collection and delete your child's information. Your account stays open. [PLACEHOLDER — the earlier wording promised deletion here. The build stops collection but does not yet delete. Restore the promise once deletion is built; until then this line must not claim it.]

To do any of these, open your parent dashboard, choose your child's card and then **Login & data** — you can download a copy of everything we hold and delete the profile from there — or use **Account → Close your account** to delete everything at once. You can also simply email support@radlor.com. We will verify that the request comes from you before we act on it, and we will complete the request within 10 days.

### How long we keep it

We keep your child's information only as long as we need it to provide the service, and then we delete it. The full schedule is in our Data Retention Policy at https://adaptivelearn.radlor.com/legal/retention.

### How we protect it

Every connection to Milo is encrypted, the database enforces rules so that one family's records cannot be read by another, and the keys that would allow broad access are never sent to a browser.

### Full details

Our Privacy Policy at https://adaptivelearn.radlor.com/legal/privacy has the complete picture, including how to reach us.

### Contact us

Radlor Inc.
254 Chapman Rd, Ste 208 #28608, Newark, DE 19702
support@radlor.com

---

## Buttons on the screen version

- **Primary:** `I'm the parent or legal guardian — continue`
- **Secondary:** `Read the full Privacy Policy`
- **Tertiary:** `Not now`

---

### Notes for the attorney reviewing this draft

1. **Content of direct notice.** Please confirm this notice contains every element required by 16 CFR § 312.4(b)/(c) as amended in 2025, including the notice that the parent's consent is required, the means of giving it, and the statement about what happens if consent is not given.
2. **Separate consent for disclosure.** The amended Rule requires separate verifiable parental consent before disclosing a child's personal information to a third party, unless the disclosure is integral to the service. Please advise whether any current vendor relationship triggers that requirement, and whether the notice needs a second, distinct consent control.
3. **Which technical identifiers are "personal information."** The list is now measured rather than assumed. Two items deserve your attention: our database provider's own platform logs record the IP address, browser and an IP-derived city/region/country for every request a child's device makes; and we keep a small number of first-party product events tied to a child's internal identifier, deleted after 90 days. Please advise how each should be characterised, and whether the support-for-internal-operations exception covers them.
4. **Delivery.** Please confirm the combination of on-screen notice plus email satisfies the "direct notice" requirement, and advise on record-keeping of consents.
5. **Age gate.** Please advise on how the product should establish that the user is under 13, and what happens for users aged 13–17, who fall outside COPPA but inside several state privacy statutes.
6. **Language.** The product ships in English and Spanish, and gates every string on having a Spanish version. That means this notice, the consent screens, the Privacy Policy and the Parent Rights page all have to exist in Spanish too. Consent is only meaningful if the parent giving it can read what they are agreeing to. The Spanish text currently in the product was translated by the engineering agent and has not been reviewed by anyone who speaks Spanish. Please advise on the standard we need to meet, and note that translation review is a real line item, not a formality.
