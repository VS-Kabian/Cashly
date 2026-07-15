# Admin Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Cashly's browser-controlled administrator session with Supabase Auth and database-enforced administrator authorization.

**Architecture:** An administrator signs in through Supabase Auth. An active `public.admins` row is linked to that Auth user by `user_id`; restrictive RLS policies and a private, narrowly scoped helper decide whether that user may read or change privileged data. Existing public `SECURITY DEFINER` RPCs are revoked so no browser caller can create an administrator, reset a password, or access global analytics without a checked administrator identity.

**Tech Stack:** React 18, TypeScript, Supabase Auth/Postgres/RLS, Node built-in test runner.

## Global Constraints

- Do not place a Supabase secret or service-role key in the Vite client.
- Keep ordinary-user authentication and transaction access unchanged.
- Preserve the existing admin routes and maintenance-mode public read path.
- New SQL must be an additive migration; do not alter historical migrations.
- Create proof before production code and run it red then green.

---

### Task 1: Encode the phase-one security contract

**Files:**
- Create: `tests/admin-security-contract.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: source files and the new migration path.
- Produces: `npm test` static regression contract that validates the security-sensitive repository artifacts.

- [ ] **Step 1: Write the failing test**

Create a Node test that asserts the hardening migration exists, creates `admins.user_id`, removes broad legacy admin policies, grants no privileged RPC to `PUBLIC`, and that `useAdminAuth.tsx` no longer contains `admin_session` or `authenticate_admin`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/admin-security-contract.test.mjs`

Expected: FAIL because the hardening migration and Supabase Auth implementation do not yet exist.

- [ ] **Step 3: Add the minimal test command**

Add `"test": "node --test"` to `package.json`.

- [ ] **Step 4: Re-run the focused test**

Run: `npm test -- tests/admin-security-contract.test.mjs`

Expected: FAIL with the same missing-hardening assertion.

### Task 2: Enforce administrator authorization in Postgres

**Files:**
- Create: `supabase/migrations/20260714000000_harden_admin_authorization.sql`
- Test: `tests/admin-security-contract.test.mjs`

**Interfaces:**
- Consumes: Supabase Auth JWT identity via `auth.uid()` and the existing `public.admins` table.
- Produces: `public.admins.user_id`, a private `private.current_admin_id()` helper, restrictive RLS policies, and explicitly limited RPC execution privileges.

- [ ] **Step 1: Write the failing test**

Extend the contract test to require the migration to revoke `PUBLIC` access to `authenticate_admin`, `create_admin`, `update_admin_password`, `reset_admin_password`, `get_admin_dashboard_analytics`, and `get_top_categories`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/admin-security-contract.test.mjs`

Expected: FAIL because the migration is absent.

- [ ] **Step 3: Write minimal migration**

Add `admins.user_id`, pair existing records to matching Auth users when possible, replace broad policies with `TO authenticated` ownership/admin predicates, protect analytics with an in-function administrator check, and revoke unsafe RPC execution from public roles.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/admin-security-contract.test.mjs`

Expected: PASS.

### Task 3: Replace the browser-controlled admin session

**Files:**
- Modify: `src/hooks/useAdminAuth.tsx`
- Modify: `src/integrations/supabase/types.ts`
- Test: `tests/admin-security-contract.test.mjs`

**Interfaces:**
- Consumes: `supabase.auth.getUser()`, `supabase.auth.signInWithPassword()`, and the RLS-protected `admins` table.
- Produces: an `AdminAuthContext` derived from a real Supabase session and active administrator record.

- [ ] **Step 1: Write the failing test**

Require `useAdminAuth.tsx` to use `signInWithPassword` and `auth.getUser`, and forbid the custom session/RPC strings.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/admin-security-contract.test.mjs`

Expected: FAIL because the old custom session remains.

- [ ] **Step 3: Write minimal implementation**

Use Supabase Auth for sign-in/sign-out, resolve the active `admins` row by the authenticated user's `id`, and keep audit logging only when that verified admin is present.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/admin-security-contract.test.mjs`

Expected: PASS.

### Task 4: Document safe administrator setup and validate

**Files:**
- Modify: `README.md`
- Modify: `Docs/ADMIN_GUIDE.md`
- Test: `tests/admin-security-contract.test.mjs`

**Interfaces:**
- Consumes: the hardening migration and Supabase Auth dashboard.
- Produces: a documented sequence: create Auth user, run migration, confirm linked active admin row, and sign in at `/admin/login`.

- [ ] **Step 1: Update documentation**

Remove default credentials and plaintext-password setup instructions. Mark the former custom RPC workflow as superseded by the hardening migration.

- [ ] **Step 2: Run the full local checks**

Run: `npm test`, `npm run lint`, and `npm run build`.

Expected: all pass. If dependencies are not installed, run `npm ci` first and report any unavailable live Supabase integration check.

- [ ] **Step 3: Confirm scope**

Run: `git diff --check` and `git diff --stat`.

Expected: only admin security, generated Supabase types, test harness, and documentation change.
