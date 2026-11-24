# Digitlocka
Family Digilocker

## Money Planner (`planner/index.html`)

A private personal money coach for individuals, usable in any country. One self-contained web page, no server, no sign-up.

- **My plan**: savings goal (e.g. save 100K this year), monthly amount needed, money found toward it, and a checklist action plan
- **Subscriptions**: flags services you rarely or never use and totals what cancelling saves
- **Spending**: essentials vs flexible spending, with suggested targets
- **Idle money**: spots cash earning low interest, sizes a safety net, and compares high-yield savings, term deposits and index funds
- **Owed to me**: tracks IOUs, flags overdue ones and drafts friendly reminders in three tones (gentle, clear, firm)

Data is saved only in the user's own browser. Pick any currency symbol.

To try it, open `planner/index.html` in any browser.

*Educational tool, not financial advice.*

## Financial Planner 2027 (fillable PDF)

`planner/pdf/Financial-Planner-2027-A4.pdf` and `-US-Letter.pdf`: a 23-page editable planner with a currency picker. Type into any box; gold boxes calculate automatically in Adobe Acrobat Reader and most desktop PDF apps.

Pages: cover, how to use, savings goal + milestones, net worth snapshot, subscription audit, spending leaks, idle money check, owed to me (with reminder scripts), savings tracker, earnings tracker, 12 monthly budgets (6 income lines each) with no-spend calendars, year in review.

Rebuild with `python3 planner/pdf/build_planner.py` (needs `reportlab` and `pypdf`).

## Listing kit (`planner/listing/`)

Topmate + Gumroad copy for The Nicheless Niche (`LISTING.md`), six 2000×1600 listing images, Gumroad cover and thumbnail, square Topmate images for the planner, the free Leak Check and the Career + Money bundle, and a sample-filled preview PDF.

## Free lead magnet: Subscription Leak Check

`planner/pdf/Subscription-Leak-Check-A4.pdf` and `-US-Letter.pdf`: a one-page fillable check that totals yearly subscription spend and what cancelling saves, with a link to the full planner. Built by the same script.

Fonts: `planner/pdf/fonts/` holds Gelasio (SIL Open Font License), a Georgia-metric serif matching the TNN kits.
