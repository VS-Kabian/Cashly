# Cashly Updated Implementation and Fix Roadmap

**Status:** Source hardening through Phase 15 is committed to `main` and GitHub CI is green. The remaining release gates require the selected Supabase project, Vercel configuration, Docker, and operator credentials; they are not completed merely because the frontend deploys.

## Completed baseline

- Secure Auth-linked administration, financial-integrity constraints, RLS contract checks, and a forward admin-authorization repair.
- Confirmations for destructive category and transaction actions.
- Lint cleanup, route-level lazy loading, category aggregate counts, CI quality gate, release checklist, and local-only Supabase integration harness.
- Local verification: unit/contract tests, TypeScript, production Vite build, and the disposable Supabase integration harness (12 pgTAP assertions). GitHub CI also passed its quality checks for commit `6644705`.

## Release Gate 1 — Prove the intended Supabase environment

**Goal:** Verify that the real database matches the committed schema before production traffic uses it.

- [x] Choose one Supabase project reference for production and verify it matches both `supabase/config.toml` and Vercel's `VITE_SUPABASE_URL` (`fzeuatalikgawourvkqc`, verified on 2026-07-16).
- [x] Install the Supabase CLI and start Docker Desktop.
- [x] Run the local-only integration harness with `CASHLY_RUN_SUPABASE_INTEGRATION=1`, `CASHLY_SUPABASE_TARGET=local`, and `npm run test:integration`.
- [ ] For a fresh project, apply the nine-file sequence in [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md) without skipping migrations.
- [ ] For an existing project, inspect migration history and data first; apply only the missing forward migrations under an approved change record.
- [ ] Run [SUPABASE_VALIDATION.sql](SUPABASE_VALIDATION.sql) against the selected project and retain the output.

**Exit criteria:** Local integration tests pass; migration history, active admin access, RLS isolation, and financial constraints are recorded for the intended project.

## Release Gate 2 — Configure and verify Vercel production

**Goal:** Launch the same frontend/database pairing that was validated above.

- [ ] Set only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel Production.
- [ ] Set Supabase Auth Site URL and approved redirect URLs for the Vercel domain and any custom domain.
- [ ] Create or relink an Auth-backed administrator and enable MFA.
- [ ] Redeploy, then verify CSP, frame protection, MIME-sniffing protection, and referrer policy on the live URL.
- [ ] Complete the normal-user, cross-user, and administrator smoke tests in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).

**Exit criteria:** The production URL, Supabase project reference, migration versions, header evidence, and smoke-test evidence are recorded together.

## Phase 16 — Production observability

**Goal:** Detect failures without exposing user financial data.

- [ ] Add privacy-safe client error monitoring to the existing error boundary.
- [ ] Capture deployment revision, route, browser context, and sanitized error category; never attach transaction descriptions, amounts, emails, tokens, or Supabase responses.
- [ ] Add an operator runbook for alert triage and rollback decisions.
- [ ] Verify a forced frontend failure produces one sanitized monitoring event and a recoverable user fallback.

**Exit criteria:** A production failure can be detected, triaged, and linked to a deployed revision without leaking financial data.

## Phase 17 — Financial scale and export safety

**Goal:** Keep summaries and exports correct as transaction volume grows.

- [ ] Replace client-side full transaction reads used by dashboard and insight summaries with RLS-safe database aggregates or paginated queries.
- [ ] Convert CSV export to bounded pagination so API row limits cannot silently omit records.
- [ ] Neutralize spreadsheet-formula cells beginning with `=`, `+`, `-`, or `@` before CSV serialization.
- [ ] Add tests using more than 1,000 transactions and hostile CSV values.

**Exit criteria:** Dashboard totals, insights, and exports remain complete and safe beyond the database API default row limit.

## Phase 18 — Data-fetching consistency

**Goal:** Give every financial screen predictable caching, loading, retry, and mutation behavior.

- [ ] Move Dashboard, Budget, Calendar, Insights, Profile, and Settings reads to the established React Query pattern.
- [ ] Centralize query keys and mutation invalidation by authenticated user ID.
- [ ] Use consistent empty, loading, offline, and permission-denied states.
- [ ] Add focused tests for cache invalidation after transactions, categories, budgets, and settings mutations.

**Exit criteria:** No financial page relies on bespoke effect-driven fetching where a shared query/mutation path exists.

## Phase 19 — Correctness and accessible UX

**Goal:** Make edits as safe as creates and prevent irreversible surprises.

- [ ] Reuse the transaction-create validation rules in transaction edit flows.
- [ ] Add accessible labels, keyboard coverage, and clear destructive-action copy for all financial mutations.
- [ ] Replace any remaining per-item count queries with aggregate reads.
- [ ] Add browser-level smoke coverage for sign-in, category management, transaction edits, budget changes, and admin access.

**Exit criteria:** Invalid edits are blocked consistently, destructive actions are explicit, and core flows work by keyboard and screen reader.

## Phase 20 — Ongoing security and maintenance

**Goal:** Keep the release process reliable after launch.

- [ ] Pin GitHub Actions to reviewed commit SHAs and review action updates deliberately.
- [ ] Update stale browser-data dependencies and run the full CI gate after dependency changes.
- [ ] Run the local Supabase integration harness whenever migrations, RLS policies, triggers, or privileged functions change.
- [ ] Review dependency advisories, Vercel logs, Supabase logs, and error-monitoring trends weekly during the first month.

**Exit criteria:** Each release has repeatable CI, database, deployment, and monitoring evidence.

## Execution order

`Release Gate 1` → `Release Gate 2` → `Phase 16` → `Phase 17` → `Phase 18` → `Phase 19` → `Phase 20`

Do not begin feature expansion until both release gates are complete. For every implementation phase, use test-first changes, a focused review, full CI, and a separate migration review whenever database behavior changes.
