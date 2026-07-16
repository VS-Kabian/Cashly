# Cashly deployment runbook

Use this runbook for every new Supabase environment. It replaces the retired custom-password admin setup. Do not run the retired admin migration and do not store an administrator password in `public.admins`.

## 1. Select one Supabase project

1. In Supabase, copy the project URL and Reference ID for the environment you are deploying.
2. In Vercel, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to values from that same project for the Production environment. The browser does not use `VITE_SUPABASE_PROJECT_ID`; do not treat it as an authorization control.
3. If using the Supabase CLI, first confirm `supabase/config.toml` points to the same Reference ID. Do not apply migrations until the CLI target and Vercel URL match.

## 2. Apply the schema in this exact order

Run these files in the selected project’s SQL Editor, one complete file at a time, and stop on the first error:

1. `supabase/migrations/20250906124330_90ed8cf6-0f6d-4e5d-9d4a-4a3e4a32749e.sql`
2. `supabase/migrations/20250911035754_c066283a-9eb8-44fb-883e-58fd67106d9f.sql`
3. `supabase/migrations/20250913060501_0cfd1ada-cab5-4a5a-8357-449c849b256a.sql`
4. `supabase/migrations/20260712000000_secure_bootstrap_preflight.sql`
5. `supabase/migrations/20260712000001_secure_admin_bootstrap.sql`
6. `supabase/migrations/20260714000000_harden_admin_authorization.sql`
7. `supabase/migrations/20260714000001_strengthen_financial_integrity.sql`
8. `supabase/migrations/20260716000000_repair_admin_authorization_contracts.sql`

The preflight migration must pass before privileged tables are created. If it reports missing core tables, stop and apply the listed earlier migration in this same project; do not skip ahead.

## 3. Create and link an administrator

1. In **Authentication → Users**, create the administrator account and complete any required email verification.
2. In SQL Editor, run the following as the project database owner, replacing the email once:

```sql
INSERT INTO public.admins (email, user_id, full_name, is_active)
SELECT email, id, coalesce(raw_user_meta_data ->> 'full_name', ''), true
FROM auth.users
WHERE lower(email) = lower('your-admin@example.com')
ON CONFLICT (email) DO UPDATE
SET user_id = excluded.user_id,
    full_name = excluded.full_name,
    is_active = true;
```

3. Verify the result has a non-null `user_id`, then sign in at `/admin/login` using the Supabase Auth account.

## 4. Vercel and Auth checks

1. Redeploy Vercel after changing environment variables.
2. Add the Vercel production URL to Supabase Auth redirect URLs because Cashly redirects to `window.location.origin` after sign-up or OAuth.
3. Enable MFA for each administrator before public release.
4. Open the production URL, create a non-admin test user, add a test transaction, and confirm that user cannot access `/admin/dashboard`.
5. Run the SQL checks in `Docs/DATABASE_VALIDATION.md` before importing real financial data.

## Do not do these things

- Do not run the retired custom-password admin migration.
- Do not place a Supabase service-role or secret key in Vercel `VITE_` variables.
- Do not apply only the hardening migrations to an empty project.
- Do not apply migrations to a project whose URL differs from the project Vercel is configured to use.
