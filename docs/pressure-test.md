# FamilyOS — Pressure Test of PRD v2.0

Purpose: find what could sink FamilyOS before money and months go into building it. Opinions are deliberate. Disagree where your gut says otherwise.

---

## 1. The big unlock: you may not need documents at all for v1

The spec's signature insight (single points of failure, "who knows what") needs only **metadata**: the item's name, who knows it, who can reach it, who handles it, and where the original lives.

It does not need the PDF of the LIC policy.

Why this matters:

- **Trust barrier drops.** "List your things" is a much smaller ask than "upload your property papers to a startup."
- **Security burden drops.** No file storage means no malware scanning, no signed URLs, and far less breach exposure in the first test.
- **AI cost and risk drop.** No extraction pipeline to build or get wrong.
- **Time to first magic moment drops.** The first session can be a 10-minute guided conversation, not an upload marathon.

**Recommendation:** v1 is "metadata first". File upload and AI extraction come in once 10–20 households show they want them (they will ask; that is a strong signal per §77).

---

## 2. Riskiest assumptions, ranked

| # | Assumption | Why it's risky | Cheapest test |
|---|---|---|---|
| 1 | Families will tell a new app about sensitive things | Indian households are rightly cautious about financial and identity data. A new brand has zero trust. | Run the demo with 15 households. Then ask them to do a metadata-only readiness check on their own family. Track who stops, and at which category. |
| 2 | The less-involved spouse will engage | The spouse is, by definition, less involved. If they don't open the invite, the growth loop (§69) and second magic moment (§45) both fail. | In the 10–20 household stage, measure invite acceptance and whether the spouse searches for something on their own within 30 days. |
| 3 | People come back | Continuity is close to a once-a-year job. "Users treat it as a one-time checklist" is your own kill condition #1. | Don't chase weekly use. Measure 90-day and annual return, driven by expiry reminders and the annual check-up. |
| 4 | Consumers will pay ₹1,999/year | Indian consumers pay for outcomes they feel now (OTT, food delivery). Preparedness is a "later" benefit. DigiLocker is free. | Fake-door pricing page after the readiness check, with 3 price points. Then real payment at the 100-household stage. |
| 5 | Gaps found are surprising, not obvious | If the app only tells people what they already know ("only you know your bank password"), it's a nice checklist, not a product. | After each session, ask: "What did you learn that you didn't know?" If more than 40% say "nothing", rethink. |

---

## 3. Pricing: my view

Consumer subscriptions are the hard road in India. The easier road is probably **B2B2C**, and the spec already lists it (§67).

Why partners may care more than consumers:

- **Unclaimed money is a regulator-level problem.** The RBI reported unclaimed bank deposits of about ₹78,213 crore as of March 2024, up 26% in a year, and launched the UDGAM portal to help people trace them. Banks and insurers are under pressure to reduce this. A product that helps families actually know what exists speaks directly to that.
  - Source: RBI Annual Report 2023-24, and RBI press releases on UDGAM (rbi.org.in). *Verify the exact figure before using it externally.*
- **Employers already pay for benefits nobody can find.** Employee life and health cover often goes unclaimed or unknown to the spouse. FamilyOS as an employee benefit is an easy pitch to HR.
- **Insurance advisers and wealth firms want stickiness.** "Your client's family knows where everything is" is a retention story for them.

**Suggested pricing tests:**

| Model | Hypothesis to test |
|---|---|
| Consumer free tier | Readiness check + up to ~15 items + demo. This is the marketing engine, not a revenue line. |
| Consumer paid | Test ₹999, ₹1,999 and ₹2,999/year. Expect the lowest to win on conversion; find out if the higher ones lose much. |
| Partner / employer | Per-family per-year fee, roughly ₹200–500, paid by the partner. Test with 2–3 conversations before building anything partner-specific. |

---

## 4. Legal and privacy watch-outs

- **DPDP Act 2023 and its Rules.** The Rules were notified in November 2025 with a phased rollout. Get counsel to confirm what applies at launch. Source: MeitY (meity.gov.in).
- **Data about people who didn't sign up.** The account holder will enter details about parents, siblings and children. That needs a clear consent and notice approach (§52 flags this; it's harder than it looks).
- **Children's data.** DPDP requires verifiable parental consent for under-18s. Keep children's records minimal in v1.
- **Death and incapacity flows.** Keep them as checklists that point to professionals. Never phrase anything as legal advice (§55 already says this; the UI copy has to honour it).

---

## 5. Competitive reality check

The category exists abroad, which is good news (it proves demand) and a warning (none have become household names).

- US analogues: Trustworthy, Everplans, LegacyShield. Mostly positioned around estate planning and document vaults.
- FamilyOS's difference is the **single-person dependency** lens and the India-specific context (EPF, NPS, lockers, joint families, parents in another city).

Keep that difference loud. If the pitch drifts toward "secure vault", you're competing with free tools.

---

## 6. Sharper kill / pivot thresholds

The spec's kill conditions (§79) are right but not measurable. Proposed numbers (tune after Stage 2):

| Stage | Signal | Keep going if… |
|---|---|---|
| Stage 2 (10–20 households) | Learned something new | ≥ 60% name a dependency they didn't realise existed |
| Stage 2 | Invited someone | ≥ 50% invite a spouse or backup within 7 days |
| Stage 3 (50 households) | Invitee independence | ≥ 25% of invitees find something on their own within 30 days |
| Stage 3 | Return | ≥ 40% come back within 90 days (reminder or check-up) |
| Stage 4 (100 households) | Willingness to pay | ≥ 5% free-to-paid, or 1 partner pilot signed |

If Stage 2 misses badly on the first two, pivot toward the partner route or toward one narrow wedge (see below), rather than adding features.

---

## 7. Possible wedges if the broad product struggles

- **Ageing parents.** "If Dad is hospitalised in Chennai while you're in Bengaluru, do you know his insurer?" Emotionally sharp, clear buyer (the adult child).
- **Employee benefits.** "Does your spouse know your company covers ₹1 crore of life insurance?" Clear B2B buyer.
- **NRI families.** Assets in India, people abroad. High complexity, higher willingness to pay. (Later, since the spec rules out multi-country for now.)

---

## 8. Scope cut for the first build

From the 23 P0 items, build these first:

1. Demo household
2. People and relationships
3. Items (metadata only, with physical/external location)
4. Who knows / who can access / who handles
5. Who Knows What view
6. Single point of failure detection + continuity score (deterministic rules)
7. Family Home (score, dependencies, top 3 actions, upcoming)
8. One emergency flow (Medical), then Death and Lost Documents

Then add: auth and invites, sharing permissions enforced server-side, search, reminders, audit trail. File upload and AI extraction follow validation.
