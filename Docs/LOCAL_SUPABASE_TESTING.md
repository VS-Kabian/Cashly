# Local Supabase integration testing

Cashly’s regular `npm test` suite is network-free and validates source-level contracts. Database authorization and financial invariants need a disposable Supabase database because they exercise Postgres roles, Row Level Security, triggers, and constraints.

## Prerequisites

- Docker Desktop is running.
- Supabase CLI is installed and available as `supabase`.
- This repository is the current working directory.

## Run the database test harness

1. Run the local-only harness:

```powershell
$env:CASHLY_RUN_SUPABASE_INTEGRATION='1'
$env:CASHLY_SUPABASE_TARGET='local'
npm run test:integration
```

2. The harness starts and resets the local Supabase stack, then runs `supabase test db --local`. It discovers `supabase/tests/financial_invariants.sql`, which creates disposable test users and rolls back every attempted write.

## Safety rules

- The harness requires `CASHLY_SUPABASE_TARGET=local`; it refuses every other target and never accepts a remote database URL.
- Do not run its commands against production or staging.
- Run `Docs/SUPABASE_VALIDATION.sql` separately in production; it is read-only.
