# FamilyOS — Master Product Requirements Document v2.0

| Field | Value |
|---|---|
| Status | Working product specification |
| Initial market | India |
| Initial audience | Urban Indian families |
| Primary platform | Mobile-first responsive web application / PWA |
| Initial build approach | Codex-assisted development |
| Working product name | FamilyOS |
| Category | Family Continuity / Family Readiness |
| Document owner | Product |
| Version | 2.0 |

---

## 1. Executive Summary

FamilyOS helps families continue functioning when the person who normally knows, manages or coordinates important household information suddenly cannot.

Families already use:

- Google Drive
- WhatsApp
- email
- DigiLocker
- spreadsheets
- bank portals
- insurance portals
- password managers
- physical folders
- cupboards
- lockers
- their own memory

The problem is not primarily that information is missing. The problem is that it is:

- fragmented
- inconsistently organised
- known by only one person
- inaccessible to the right person
- out of date
- disconnected from responsibility
- difficult to act on in an emergency

FamilyOS creates a **Family Continuity Graph** connecting:

**People → Things → Locations → Access → Responsibility → Actions**

Its core value is not: *"Here are your documents."*

Its core value is: *"Here are the parts of your family's life that currently depend entirely on you, and here is how to fix them."*

---

## 2. Product Vision

Every family should be able to answer:

> If I could not manage anything for the next 30 days, would the people I love know what exists, where to find it, who to contact and what to do?

FamilyOS should make the answer increasingly: **Yes.**

---

## 3. Product Mission

Build the operating layer that helps families:

1. Understand what matters.
2. Find it quickly.
3. Share it with the right people.
4. Assign responsibility.
5. Identify single points of failure.
6. Keep information current.
7. Respond intelligently during an emergency.

---

## 4. Core Problem

Most households do not operate from one organised system. Knowledge is distributed informally.

- One spouse may know the investments.
- The other may manage school and household staff.
- A sibling may know where the will is.
- An insurance adviser may be the only person who understands a policy.
- A parent may keep property documents in a cupboard nobody else knows about.
- Important digital accounts may depend on one mobile phone.

The arrangement works while everybody is healthy, reachable and capable. It fails during:

- hospitalisation
- accident
- incapacity
- sudden travel disruption
- disappearance/unreachability
- death
- fire
- flood
- natural disaster
- device loss
- document loss
- ageing-parent emergencies

The family then faces an information and coordination problem at exactly the moment it has the least capacity to solve one.

---

## 5. The Product Insight

FamilyOS should not ask: *"What documents do you want to store?"*

It should ask: **"What would break if you couldn't manage the family tomorrow?"**

That distinction drives the entire product.

---

## 6. Product Category

FamilyOS should create and own the category: **Family Continuity**.

It sits between cloud storage, estate planning, household organisation and emergency preparedness, without trying to replace any of them.

---

## 7. Core Product Promise

> Make sure your family can find what matters and know what to do when you can't handle it yourself.

Alternative internal articulation:

> Find where your family depends too much on you.

---

## 8. Why Existing Tools Are Not Enough

### Google Drive / Dropbox
Can store files. Cannot reliably answer:
- Who knows this exists?
- Who can access it?
- Who should handle it?
- Is anyone else capable of taking over?
- What is missing?
- What should happen next?

### WhatsApp
Contains valuable family knowledge, but it is buried inside conversations and depends on knowing what to search for.

### Excel
Can create an inventory, but it does not actively identify family dependencies, permissions, responsibilities or emergency actions.

### DigiLocker
Useful source of government-issued documents. It does not model the family's wider financial, medical, legal, digital and operational life.

### Password managers
Excellent for credentials. Not designed for family continuity as a whole.

### Estate planning
Usually focuses on legal/financial arrangements around death. FamilyOS must also work during everyday life, hospitalisation, incapacity, travel emergencies and ageing-parent situations.

---

## 9. Product Moat Hypothesis

The long-term moat is not encrypted file storage. Storage is increasingly commoditised.

The defensible asset is the **Family Continuity Graph**: a graph describing relationships between:

- people
- documents
- accounts
- assets
- responsibilities
- locations
- permissions
- digital services
- advisers
- dependencies
- emergency actions

Over time, FamilyOS should understand:

- What matters to this family?
- Who currently knows about it?
- Who can access it?
- Who is responsible?
- Who is the backup?
- Where is the original?
- When was it last checked?
- What happens if the current owner becomes unavailable?

---

## 10. Target Market

### Phase 1
India. No multi-country complexity in the initial product.

### Initial customer profile
Urban household where:
- primary adults are approximately 35–55
- family has growing financial complexity
- there may be children
- there may be ageing parents
- multiple digital accounts exist
- insurance/investments/property exist
- important information is spread across multiple systems
- one person acts as the informal household administrator

Likely early cities: Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune, Chennai.

Geography itself is less important than household complexity.

---

## 11. Primary Personas

### Persona A: The Family Operator
The person who knows where everything is.
> "If something happens to me, nobody knows half of this."

Primary buyer.

### Persona B: The Less-Involved Spouse
Participates in family decisions but does not know all the operational details.
> "I know roughly what we have, but I wouldn't know where to start."

### Persona C: Adult Child Managing Parents
Supports parents who may live separately. Needs enough visibility to help in an emergency without taking over their independence.

### Persona D: Ageing Parent
Wants children to be able to help if needed but does not necessarily want them to have unrestricted access today.

### Persona E: Trusted Backup Person
Sibling, friend, executor or relative. Does not need the entire family's information. Needs only what they have been authorised to know or handle.

---

## 12. Jobs To Be Done

### JTBD 1: Everyday Retrieval
When someone in the family needs important information, help them find it immediately.
- Where is Riya's birth certificate?
- Who is our CA?
- When does Dad's passport expire?
- Where are the property papers?
- Which insurer covers Mum?

### JTBD 2: Dependency Discovery
Show me which parts of family life currently depend entirely on one person.
> Arun is the only person who knows about 8 critical things.

### JTBD 3: Responsibility Planning
Make sure somebody else knows what to do if the current responsible person cannot.

### JTBD 4: Emergency Response
During a crisis, show only what matters now and tell me what to do next.

### JTBD 5: Family Knowledge Maintenance
Help us keep our family information current as life changes.

### JTBD 6: Family Handover
Allow one family member to take over essential responsibilities without having to reconstruct years of knowledge.

---

## 13. Product Principles

1. **Import before input.** Do not make users recreate information manually when it already exists elsewhere. Prefer upload, connect, forward, photograph, paste, confirm over type, categorise, fill twenty fields.
2. **Confirm, don't interrogate.** If AI can infer something safely, propose it. *"This looks like an LIC policy belonging to Arun. Correct?"*
3. **Storage is secondary.** A document can remain in Google Drive, DigiLocker, a bank locker, a cupboard or a lawyer's office. FamilyOS may simply record where it is.
4. **People matter more than folders.** Every important item should connect to human responsibility.
5. **Access and responsibility are different.** Someone may be allowed to see a document without being responsible for acting on it.
6. **Emergency mode must simplify.** During a crisis, never present the entire database. Present: *Do this first.*
7. **Progressive trust.** Do not demand extremely sensitive information during the first interaction. Earn trust progressively.
8. **Make gaps visible.** Continuously surface what is missing, unshared, stale, inaccessible, unassigned, or dependent on one person.

---

## 14. Product Model

Six core entities:

| Entity | Question |
|---|---|
| People | Who matters? |
| Things | What matters? |
| Locations | Where is it? |
| Access | Who can see it? |
| Responsibility | Who handles it? |
| Actions | What should happen? |

---

## 15. Core Product Experiences

1. Family Home
2. Family Inbox
3. Family Map
4. People
5. Who Knows What
6. Responsibilities
7. Find / Ask FamilyOS
8. Readiness Engine
9. Emergency Mode
10. Reviews & Reminders

---

## 16. Family Home

**Purpose:** Answer *"What should I pay attention to right now?"* The homepage must not feel like document storage.

### Primary elements

- **Family continuity status** — e.g. *76% prepared*
- **Single points of failure** — e.g. *8 important things still depend entirely on Arun.*
- **Top three actions** (never dump 25 tasks), e.g.:
  1. Give Meera access to employer insurance details.
  2. Assign somebody to manage parents' medication renewals.
  3. Record where the locker key is kept.
- **Upcoming** — passport expiry, insurance renewal, school deadline, annual family review
- **Quick actions** — Add something · Ask FamilyOS · Who knows what? · Something happened

---

## 17. Single Point of Failure Metric

A signature product concept. A critical item becomes a single point of failure when:

- only one person knows about it
- only one person can access it
- only one person knows where it is
- only one person has the credentials/instructions
- no backup responsible person exists

Example: *9 important things currently depend entirely on you.*

This should be more prominent than storage quantity.

---

## 18. Family Inbox

**Objective:** Make adding information nearly effortless.

Headline: **Drop it here. We'll help organise it.**

Accepted MVP input: PDF, JPEG, PNG, text, note, URL.

Future: email forwarding, Google Drive, OneDrive, DigiLocker, WhatsApp, cloud import.

---

## 19. Inbox AI Flow

User uploads `LIC_Policy.pdf`. FamilyOS extracts:

> Looks like a life insurance policy.
>
> Suggested:
> - Owner: Arun
> - Insurer: LIC
> - Reference: ending 8732
> - Nominee information: found
> - Relevant date: detected

Then asks only:
- Who else should know this exists?
- Who should handle it if Arun cannot?
- Where is the original?

The user confirms.

---

## 20. Inbox Acceptance Criteria

The system must:

- recognise supported input type
- extract text where available
- classify probable category
- identify likely owner where evidence exists
- detect obvious provider/reference/date fields
- clearly mark AI-generated suggestions
- require user confirmation before treating extracted information as authoritative
- never expose information beyond existing household permissions
- allow user to reject or edit suggestions

---

## 21. Everything We Have / Family Map

The family inventory organises information into human categories.

### Identity
Aadhaar, PAN, passport, driving licence, birth certificates, marriage certificate, visas.

### Money
Bank accounts, demat, mutual funds, EPF, NPS, PPF, fixed deposits, loans, investment platforms.

FamilyOS should not become a wealth-management dashboard. Balances are unnecessary for the initial product.

### Insurance
Life, health, vehicle, property, travel, employer insurance.

### Property & Valuables
Home, land, mortgage, property documents, lockers, jewellery inventories, valuable items.

### Legal
Wills, executor information, guardianship instructions, powers of attorney, lawyer details, nominations.

### Medical
Health insurance, doctors, allergies, important medications, emergency instructions, medical document locations.

FamilyOS is not a medical-record system.

### Work & Benefits
Employer, HR contact, employee life insurance, employee health insurance, EPF, gratuity, stock plans, benefits.

### Children & Dependants
School, birth certificate, passport, health records, emergency contacts, guardianship, school fees, care instructions.

### Digital Life
Must be a primary category.

- **Email:** Gmail, Outlook, other accounts
- **Cloud:** Google Drive, OneDrive, Dropbox, iCloud
- **Social:** LinkedIn, Facebook, Instagram, YouTube, X, other platforms
- **Devices:** mobile phone, laptop, tablet, external drive, NAS
- **Password Management:** record which password manager exists and where emergency instructions are kept. Do not encourage raw-password storage in early versions.
- **Digital Businesses / Assets:** websites, domains, YouTube channels, stores, creator assets, photo libraries
- **Subscriptions:** cloud storage, streaming, software, recurring digital services

### Important People
CA, lawyer, doctor, insurance adviser, broker, banker, employer HR, school contact, trusted relatives.

### Responsibilities
Central to differentiation. Home-loan EMI, school fees, parent expenses, electricity, internet, society dues, domestic staff salary, insurance renewals, tax filing, subscriptions, rent, charitable commitments.

Key question: **What keeps running even if I don't?**

---

## 22. Item Data Model

Every important item should support (not every item requires every field):

- ID
- household ID
- title
- category
- subtype
- owner/person
- description
- source
- attached file
- external location
- physical location
- reference number or partial identifier
- relevant date
- expiry date
- last verified date
- visibility level
- people who know about it
- people who can access it
- responsible person
- backup responsible person
- emergency relevance
- notes
- tags
- confidence level for extracted AI fields
- status

---

## 23. People

Each household may contain: self, spouse/partner, children, parents, siblings, relatives, trusted friends, executor, professional advisers.

Each person should have:
- name
- relationship
- contact information
- household status
- trusted status
- access rights
- responsibilities
- emergency role

---

## 24. Who Knows What

One of the defining screens.

| Item | Arun | Meera | Kavita | Raj |
|---|---|---|---|---|
| LIC policy | ✓ | ✓ | | |
| SBI locker | ✓ | | | |
| Will | ✓ | | ✓ | |
| Parents' medical plan | ✓ | | | ✓ |
| Google Drive | ✓ | ✓ | | |

The system should explicitly call out: *Only Arun currently knows about the SBI locker.*

---

## 25. Access Model

| State | Meaning |
|---|---|
| Private | Only owner. |
| Shared | Visible to explicitly selected people. |
| Emergency Pre-authorised | Information the owner has explicitly designated for emergency access. |
| Conditional Future Access | Future feature requiring stronger verification. |

MVP should primarily support **Private** and **Shared**.

---

## 26. Responsibilities

Access alone is insufficient. Meera may be able to see the LIC policy, but somebody still needs to *contact LIC and initiate the process.*

Each critical item should optionally have:
- primary responsible person
- backup responsible person

---

## 27. Responsibility Map

Dedicated view: **If Arun cannot do this, who will?**

| Task | Who |
|---|---|
| Contact employer | Meera |
| Speak to CA | Meera |
| Manage parents' medical renewals | Nobody assigned |
| Handle locker | Nobody assigned |
| Manage Riya's school | Meera |

This page should expose operational gaps.

---

## 28. Readiness Engine

Continuously evaluates family continuity. It should use **deterministic rules first**. AI may later assist, but the fundamental logic must be understandable.

---

## 29. Gap Types

| Gap | Example |
|---|---|
| Missing | Property listed, but no document location recorded. |
| Unshared | Only Arun knows about this. |
| Inaccessible | Meera knows this exists but has no access route. |
| Unassigned | Nobody is responsible for handling this. |
| Stale | This information has not been verified in 18 months. |
| Expiring | Passport expires in 72 days. |
| Inconsistent | Will exists but original location is missing. |
| Digital Dependency | Primary email recovery depends entirely on Arun's phone. |
| Responsibility Dependency | Parent-care payments depend entirely on one family member. |

---

## 30. Family Continuity Score

The score should reflect practical resilience. Suggested weighting:

| Component | Weight | Question |
|---|---|---|
| Coverage | 25% | Are important areas represented? |
| Shared Knowledge | 20% | Does at least one appropriate backup person know critical information exists? |
| Access | 20% | Can authorised people actually reach the information? |
| Responsibility | 20% | Are critical tasks assigned? |
| Freshness | 10% | Has the information been recently verified? |
| Emergency Preparation | 5% | |

The exact weighting should be tested. Do not imply scientific precision.

---

## 31. Search / Ask FamilyOS

Primary interface: **What are you looking for?**

Example questions:
- Where is Dad's health insurance?
- Who is our CA?
- Which bank locker has the jewellery?
- Who knows about Arun's employer insurance?
- Where are Riya's documents?
- What depends entirely on Mum?

Answers should include: item, owner, location, source, who knows, who has access, responsible person, related file where permitted.

---

## 32. Search Permission Rule

**Search must NEVER become a permission bypass.**

If Kavita has access only to Legal and Emergency items, *"Show me Arun's bank information"* must not expose it.

Search results must be filtered by permission **before** any AI processing or response generation.

---

## 33. Emergency Mode

A prominent **Something Happened** button should be visible throughout the product.

When selected: **What happened?**

Initial scenarios:
- Medical emergency
- Person cannot be reached
- Incapacity
- Death
- Lost documents
- Fire/flood/disaster

MVP can launch with: **Medical emergency, Death, Lost documents.**

---

## 34. Emergency UX Principle

- Normal mode: *Search and explore.*
- Emergency mode: *Act.*

The interface should become more directive. Avoid menus and category browsing.

---

## 35. Medical Emergency Flow

**Do these first**

1. Find health insurance.
2. Get identification.
3. Check medication/allergy information.
4. Call the doctor/emergency contact.
5. Notify relevant family.
6. Check employer medical cover if appropriate.
7. Reassign urgent child/parent responsibilities.

Relevant information shown underneath.

---

## 36. Death Flow

The product should remain calm and structured.

**Today**
- notify closest family
- locate identity documents
- locate will
- identify executor
- notify employer
- secure key phone/email/device access

**This Week**
- identify life insurance
- speak to CA
- speak to lawyer
- understand immediate bills
- identify relevant bank/investment relationships

**Later**
- property
- investments
- subscriptions
- digital accounts
- social media
- estate administration

Country-specific actions must be legally reviewed.

---

## 37. Digital Life After Death

Every important digital account should support a preferred action:

- Keep
- Transfer
- Archive
- Memorialise
- Close
- No instruction

And: responsible person, access instruction location.

Examples:
- **Google Photos** — Action: Preserve · Responsible: Meera
- **Instagram** — Action: Memorialise · Responsible: Riya when appropriate

---

## 38. Family Inbox Sources

Long-term ingestion sources: local upload, camera, Google Drive, OneDrive, DigiLocker, forwarded email, WhatsApp attachments, spreadsheets, CSV, Word documents, notes.

MVP should not attempt all integrations.

---

## 39. Import Existing Excel / Lists

Strategically important. Many organised families already maintain spreadsheets.

FamilyOS should eventually allow: **Upload your existing family spreadsheet.** Then:
- detect rows
- infer categories
- identify people
- create draft items
- ask user to confirm

The product must respect existing behaviour instead of forcing migration-by-hand.

---

## 40. Family Review

Every household should periodically run a **Family Check-Up**.

Possible prompts:
- Changed job?
- New insurance?
- New bank?
- New investment?
- Bought/sold property?
- Changed nominee?
- Passport renewed?
- Child changed school?
- Parent-care situation changed?
- Changed adviser?
- New digital account?
- New subscription?
- Trusted person changed?

Goal: complete in under 10 minutes.

---

## 41. Notifications

Initial notifications:
- expiry approaching
- insurance renewal
- annual review
- invitation pending
- unresolved critical dependency
- item not reviewed for extended period

Avoid excessive alerts. This product must not become nagware.

---

## 42. First-Time Onboarding

Do not begin with: *Complete your profile.*

Start with: **If you couldn't manage anything for the next 30 days, what would break?**

Options: Money · Insurance · Parents · Children · Property · Bills · Work benefits · Digital accounts · Important documents · Something else

Then: **Who currently knows most of this?**

This immediately personalises the experience.

---

## 43. First Session Goal

Within 10–15 minutes, the user should:

1. Create household.
2. Add key family members.
3. Add/import 3–5 important items.
4. See FamilyOS organise them.
5. Discover at least one dependency.
6. Assign/share at least one item.
7. See continuity status.

---

## 44. First Magic Moment

> This important part of your family's life currently depends entirely on you.

That is stronger than: *File uploaded.*

## 45. Second Magic Moment

Another authorised family member asks *"Where is Dad's insurance?"* and receives a direct useful answer.

## 46. Third Magic Moment

Emergency Mode transforms the family's scattered information into an ordered action plan.

---

## 47. Demo Mode

An optional fictional demo household.

Purpose:
- allow prospective users to understand value without entering data
- support sales/demo conversations
- demonstrate continuity gaps
- support partner conversations

Demo should contain realistic Indian household data across: banks, demat, EPF/NPS, insurance, property, wills, parents, children, school, medical, Google Drive, Gmail, social media, password manager, bills, staff, CA, lawyer.

No real personal data.

---

## 48. Security Position

FamilyOS may eventually contain extremely sensitive information. Security is a product requirement, not an infrastructure afterthought.

## 49. MVP Security Requirements

- HTTPS
- encryption at rest
- strong authentication
- MFA
- secure password reset
- secure session expiration
- household data isolation
- granular permission checks
- secure object storage
- signed/private document URLs
- audit logging
- malware scanning on upload
- rate limiting
- backup strategy
- account deletion
- data export
- access revocation

## 50. Prohibited Data / Behaviour

Early versions should explicitly discourage storage of:
- passwords
- PINs
- OTPs
- CVVs
- private encryption keys
- UPI PINs
- banking passwords

If detected in free text where practical, warn the user.

## 51. Admin Access Principle

Administrators must not casually browse family content.

Admin dashboard should expose primarily: account ID, signup date, plan, usage counts, storage utilisation, errors, support status.

Sensitive content access should require: explicit role, business justification, audit trail, limited scope.

## 52. Privacy

Before public launch, obtain specialist review covering applicable Indian privacy/data protection requirements.

Product must support:
- transparent consent
- purpose limitation
- data correction
- deletion
- data export
- retention controls
- consent withdrawal where applicable
- clear subprocessor disclosure
- clear handling of minors' information
- clear rules for information about family members who did not create the account

---

## 53. AI Principles

AI exists to reduce work. **AI is not the source of truth.**

## 54. AI May

- classify documents
- extract metadata
- detect dates
- detect providers
- suggest categories
- suggest likely owner
- identify possible duplication
- help search
- summarise stored information
- surface possible continuity gaps
- explain information in plain language

## 55. AI Must Not

- invent missing information
- make legal determinations
- make medical decisions
- determine legal capacity
- determine death
- alter permissions without approval
- move money
- change beneficiaries
- transfer assets
- reveal information beyond user permissions

## 56. AI Confirmation Requirement

Any material extracted field must show:
- proposed value
- extraction confidence where appropriate
- user ability to edit
- user confirmation

Example: *Nominee appears to be Meera Mehta.* **Confirm / Change**

---

## 57. Initial Technical Architecture

Recommended validation stack:

| Layer | Choice |
|---|---|
| Front end | Next.js |
| Database | PostgreSQL |
| Backend platform | Supabase |
| Authentication | Supabase Auth |
| File storage | Private Supabase Storage or equivalent |
| Hosting | Vercel or equivalent |
| AI | OpenAI API |
| Email | Resend or equivalent |
| Analytics | Privacy-conscious analytics configuration |

Do not send sensitive document text into analytics.

## 58. High-Level Data Model

Core tables/entities:

- users
- households
- household_members
- people
- relationships
- items
- documents
- external_locations
- permissions
- responsibilities
- reminders
- readiness_gaps
- emergency_scenarios
- emergency_actions
- invitations
- audit_events
- ai_extraction_records

## 59. Permission Model Requirements

Every request involving household content must be checked **server-side**. Do not rely solely on UI hiding.

Required rule: a user can retrieve an item only if their authenticated identity has explicit access through the household/permission model.

Database-level security rules should provide a second layer of enforcement.

---

## 60. Functional MVP Scope

### P0: Must Build

- Authentication
- Household creation
- People/family relationships
- Demo mode
- Family Home
- Family Inbox
- File upload
- Basic AI classification/extraction
- Inventory
- Physical/external locations
- People who know
- Sharing permissions
- Responsibilities
- Who Knows What
- Single Point of Failure detection
- Basic Readiness Engine
- Search
- Medical Emergency Mode
- Death Mode
- Lost Document Mode
- Basic reminders
- Audit trail
- Basic analytics

## 61. P1: After Initial Validation

- Google Drive import
- Excel import
- Email forwarding
- richer AI extraction
- recurring household reviews
- parents as linked household
- stronger emergency permissions
- responsibility reminders
- digital-account lifecycle instructions
- richer India-specific emergency playbooks
- configurable trusted backups

## 62. P2: Later

- DigiLocker connectivity
- WhatsApp ingestion
- OneDrive
- native mobile applications
- verified emergency release
- institutional partner dashboard
- insurer integrations
- adviser portal
- employer-sponsored version
- multiple countries
- regional languages

## 63. Explicitly Out of Scope for MVP

- wealth portfolio analytics
- stock pricing
- bank balance aggregation
- UPI payments
- insurance purchasing
- will generation
- probate automation
- automatic death detection
- asset transfers
- full password manager
- blockchain
- inheritance calculations
- complex tax planning
- medical diagnosis
- automated legal advice

## 64. Emergency Access

Sophisticated emergency release is **not** MVP. For initial versions, access is pre-authorised by the owner.

Future break-glass access may use:
- request by trusted person
- second-person confirmation
- identity verification
- supporting event evidence
- cooling period
- owner-defined rules

This requires separate security, legal and fraud design.

---

## 65. Pricing Hypothesis

### Free
Possible: readiness assessment, one household, limited records, demo, basic continuity gaps.

### Family — indicative ₹1,999/year
Potentially includes: full household, secure storage, trusted family members, Find, Emergency Mode, reminders, Readiness Engine, permissions.

Pricing must be validated rather than assumed.

## 66. Future Premium Tier

Potential ₹3,999–5,999/year. Possible additions: linked parent households, larger storage, enhanced emergency access, professional family review, advanced digital-life planning, additional trusted users. Not MVP.

## 67. B2B2C Distribution

Potential partner channels: insurance advisers, insurance companies, employers, CAs, estate lawyers, financial advisers, banks, wealth firms, housing communities.

Partner value proposition:

> Help your clients' families actually find and use the benefits/assets you already help them create.

## 68. Consumer Acquisition Hypothesis

Potential channels: referrals, WhatsApp communities, parent communities, housing societies, LinkedIn, personal finance creators, family/parenting creators, ageing-parent communities.

Avoid assuming paid social will produce viable economics.

## 69. Product Growth Loop

Arun creates FamilyOS → invites Meera → adds parents → makes Kavita trusted backup → Kavita experiences the product → Kavita creates a FamilyOS for her own household.

This loop should be instrumented.

---

## 70. Core Activation Definition

A household is activated when it has:
- at least two people
- at least five meaningful items
- at least one shared item
- at least one responsibility assignment
- at least one continuity gap identified

## 71. Key Product Metrics

- **Acquisition:** readiness-check starts, readiness-check completion, account creation, referral source
- **Activation:** family members added, items added/imported, first gap discovered, first person invited, first responsibility assigned
- **Family Network:** invitations, accepted invitations, trusted people per household
- **Utility:** search usage, document retrieval, Inbox usage, reminders completed, emergency-mode exploration
- **Continuity:** single points of failure identified, single points resolved, critical items with backups, stale items, responsibility coverage
- **Retention:** week 1, week 4, month 3, month 6, annual review completion
- **Commercial:** pricing page views, free-to-paid conversion, annual renewal, acquisition cost, partner acquisition economics

## 72. North-Star Metric

Not files uploaded, storage used or logins.

Preferred: **Percentage of households with no unresolved critical single-person dependencies.**

---

## 73. Validation Stage 1 — Customer Zero

Build and populate one realistic fictional or internal household.

Question: *Does the product actually reveal anything useful?* Do not progress merely because the UI works.

## 74. Validation Stage 2 — 10–20 trusted households

Measure: completion, time to first insight, what users refuse to enter, what they already have organised, what they discover, whether spouse/trusted person is invited.

## 75. Validation Stage 3 — 50 households

Key questions: Do people come back? Do invitees engage? Does another family member find something independently? Are continuity gaps meaningful rather than obvious?

## 76. Validation Stage 4 — 100 households

Introduce actual pricing. Measure: willingness to pay, actual conversion, retention, referrals, use of search/inbox, requests for integrations.

## 77. Strong Product Signals

- "I didn't realise my spouse didn't know this."
- "Can I add my parents?"
- "Can my brother only see the legal information?"
- "Can it connect to my Drive?"
- "Can I import the Excel sheet we already maintain?"
- "I found something I had forgotten about."
- "My wife used it to find something without asking me."

## 78. Weak Signals

- "Nice idea."
- "Interesting."
- "I should probably organise my documents."
- "This looks useful."

Do not confuse politeness with product-market fit.

## 79. Kill / Pivot Conditions

Reassess the proposition if:
- users treat FamilyOS as a one-time checklist
- spouse/trusted invitations remain low
- users refuse meaningful data entry
- very few continuity gaps are discovered
- users see no advantage over Drive/Excel
- emergency workflows feel theoretical
- search is rarely used
- retention is weak
- willingness to pay remains low after genuine product usage

Do not solve these by simply adding features.

---

## 80. Product Design Requirements

The product should feel: calm, warm, competent, trustworthy, modern, human, non-morbid.

Avoid: funeral aesthetics, fear-heavy red alerts, complex financial dashboards, enterprise-software layouts, document-management jargon.

## 81. Language

| Good | Bad |
|---|---|
| Nobody else currently knows about this. | Secondary knowledge custodian missing. |
| Who should handle this if you can't? | Assign alternate responsible entity. |
| Where would your family look for this? | Specify external document repository. |

## 82. Accessibility

- clear typography
- strong contrast
- large touch targets
- keyboard navigation
- screen-reader-friendly labels
- plain English
- no information communicated through colour alone

Older parents may eventually use this product. Accessibility is strategically relevant, not merely compliance.

## 83. Mobile Requirement

Designed mobile-first. Many users will upload from phone, photograph documents, search during emergencies, and use WhatsApp alongside FamilyOS. Every critical workflow must work comfortably on a phone.

## 84. Performance

- homepage useful content visible quickly
- search results near-instant for normal household sizes
- upload progress visible
- AI processing asynchronous where appropriate
- user can leave page without losing uploaded item
- graceful retry on failed extraction

## 85. Reliability

Emergency-related information cannot disappear due to a temporary AI or search failure. Core structured data must remain accessible without AI.

AI enriches the experience. It must not be required to access: document location, contact information, owner, responsible person, stored files.

## 86. Data Portability

Families must not feel trapped. Required:
- export household inventory
- download documents
- export contacts/responsibilities
- delete account
- revoke trusted-person access

Trust increases when exit is easy.

---

## 87. Key Strategic Question

FamilyOS succeeds only if it answers something Drive, WhatsApp and Excel cannot easily answer:

> Where is this family fragile because important knowledge, access or responsibility is concentrated in one person?

Everything else is supporting functionality.

## 88. Product Test

Every proposed feature must pass:

> Does this help another person keep the family functioning if the usual person suddenly cannot?

If no: do not build it.

## 89. MVP Success Definition

The MVP succeeds when a household can take its existing messy information and, with limited effort, reach:

- Here is what we have.
- Here is where it is.
- Here is who knows about it.
- Here is who can access it.
- Here is who should handle it.
- Here is what currently depends on one person.
- Here is what to do if something happens.

## 90. Long-Term Vision

FamilyOS should eventually become the family's continuity layer across physical documents, cloud storage, government documents, financial relationships, insurance, advisers, devices, email, social accounts, household responsibilities and care responsibilities.

The family should not need to remember where everything lives. FamilyOS should know **what exists, where it is and who needs it.**

---

## 91. One-Line Pitch

FamilyOS finds the parts of your family's life that depend entirely on you and helps you make sure somebody else can step in.

## 92. Consumer Version

If you couldn't manage the family tomorrow, what would break? FamilyOS helps you find it and fix it before you need to.

## 93. Partner Version

FamilyOS helps families turn scattered financial, legal, digital and household information into a practical continuity plan the right people can actually use.

## 94. Final Product Principle

The goal is not more organised documents.

The goal is: **a family that can keep functioning when someone important suddenly cannot.**
