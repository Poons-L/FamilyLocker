# FamilyOS — Build status

## What's in the repo

| Path | What it is |
|---|---|
| `docs/PRD.md` | Master product spec v2.0 |
| `docs/pressure-test.md` | Riskiest assumptions, pricing view, kill/pivot thresholds, scope cut |
| `demo/index.html` | Clickable demo with a fictional Bengaluru household. Opens in any browser, no setup. |
| `app/` | The real product (Next.js), started metadata-first |
| `supabase/migrations/0001_init.sql` | Database tables and permission rules |

## What the first version does today

- **Readiness Engine** (`app/lib/readiness.ts`): finds gaps (unshared, can't open, nobody responsible, no backup, location missing, expiring, stale), detects single points of failure, calculates the continuity score and picks the top 3 actions. Plain rules, no AI.
- **Permission rule**: a person sees an item only if they own it, created it or it was shared with them. Being the household admin does not unlock someone else's private items. Enforced in the database (row-level security) and again in the app.
- **Home screen** (`app/app/page.tsx`): score, "depends entirely on Arun", top actions and who knows what, built from the demo household.
- **Tests**: 18 automated checks, including a run of the real database rules in an in-memory Postgres.

## Run it

```bash
cd app
npm install
npm test          # 18 tests
npm run dev       # http://localhost:3000
```

## What's needed next (from Aarya)

1. **A Supabase project** (free tier is fine to start). Gives us login, the database and private file storage.
2. **A Vercel account** (or similar) to host it.
3. Later, when document upload is switched on: **an AI API key** for classification. Not needed for the metadata-first version.

## Next build steps

1. Login (email + MFA) and household creation
2. Add people and items, invite a spouse or backup
3. Who Knows What and the "If Arun can't" screens wired to the database
4. Medical, Death and Lost Documents emergency flows
5. Search, filtered by permission first
6. Reminders and the audit trail on every share or view
