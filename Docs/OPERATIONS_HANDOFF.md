# Cashly operations handoff

## Scope of this rollout

This release contains Phases 1-9 hardening: Supabase Auth-backed admin access, financial integrity migrations, local-calendar date handling, query-layer/history improvements, error recovery, and transaction form validation. The browser remains a public client and must never receive a Supabase service-role key.

## Preflight

1. Back up the production database and record the deployed application revision.
2. Use [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md) as the sole required migration procedure. Follow its **“Apply the schema in this exact order”** sequence without skipping or substituting steps:
   1. `20250906124330_90ed8cf6-0f6d-4e5d-9d4a-4a3e4a32749e.sql`
   2. `20250911035754_c066283a-9eb8-44fb-883e-58fd67106d9f.sql`
   3. `20250913060501_0cfd1ada-cab5-4a5a-8357-449c849b256a.sql` (category icons)
   4. `20260712000000_secure_bootstrap_preflight.sql`
   5. `20260712000001_secure_admin_bootstrap.sql`
   6. `20260714000000_harden_admin_authorization.sql`
   7. `20260714000001_strengthen_financial_integrity.sql`
   8. `20260716000000_repair_admin_authorization_contracts.sql`
   9. `20260716000001_repair_profile_activity_contract.sql`
3. Before applying the financial-integrity migration, resolve any duplicate overall budgets for the same `(user_id, month, year)`. The migration intentionally stops instead of deleting or choosing financial records.
4. Ensure every intended administrator has an Auth user and that `admins.user_id` is linked to that Auth user before removing the retired password-RPC workflow.
5. Run `npm test`, `npx tsc -b`, and `npm run build` from the release candidate. Check `git diff --check` as well.
6. Verify required public environment values are set only for the Supabase URL and publishable/anon key. Confirm no service-role key appears in the Vite build environment.

## Rollout

1. Apply the required migration sequence to production during a low-traffic window, following [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md) exactly. This handoff does not define an alternative migration path.
2. Run the database validation checklist in `Docs/DATABASE_VALIDATION.md`.
3. Smoke-test normal-user registration/sign-in, category creation, transaction create/update/delete, budget creation, history pagination/filtering, and the admin login flow.
4. Deliberately use an invalid amount, an empty category, and an invalid/empty date to confirm each inline validation message is announced and no transaction is saved.
5. Repeat the smoke tests against production with a non-privileged account first, followed by an admin account.

### Optional staging rehearsal

A staging rehearsal may be used as an additional risk-reduction exercise, following the same runbook sequence and smoke tests. It is optional and is not a release or integration gate. If performed, force a rendering error through the browser tools and confirm the generic recovery screen appears without exception details; select **Try again** to recover.

## Monitoring checks

- Watch Supabase logs for RLS violations, foreign-key/check-constraint failures, and failed `log_admin_activity` calls after deployment.
- Watch browser error monitoring and hosting logs for increases in client render failures, sign-in failures, or transaction-insert failures. The error boundary presents a generic fallback and does not itself transmit error details.
- Check application health after 15 minutes and again after 24 hours: successful transaction creates, history query response time, authentication success rate, and budget-save errors.
- Review migration output and database indexes after deployment. Do not mark the rollout complete until the constraint/RLS checks in `Docs/DATABASE_VALIDATION.md` have been recorded.

## Rollback boundaries

- **Frontend rollback:** revert to the prior deployed frontend revision if user-facing errors rise. The new validation only prevents invalid writes, so a frontend rollback does not reverse existing valid financial data.
- **Database migrations:** do not automatically roll back applied security or integrity migrations. They can change authorization and may protect data written after deployment. Use a reviewed, operator-authored corrective migration after restoring from backup only when necessary.
- **Admin access incident:** retain at least one verified Auth-linked admin before rollout. If admin access fails, repair the `admins.user_id` mapping using a controlled database session; do not restore the retired client-side admin-session or password RPC flow.
