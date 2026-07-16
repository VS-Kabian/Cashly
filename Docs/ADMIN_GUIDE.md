# Cashly administrator setup

Cashly administrators use **Supabase Auth**. Browser storage and retired custom-password RPCs are not authorization mechanisms and must not be restored.

Follow the complete, ordered migration sequence in [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md), including `supabase/migrations/20260714000000_harden_admin_authorization.sql` and the forward-only administrator and profile-activity repair migrations.

## Create or relink an administrator

1. In Supabase Dashboard, open **Authentication → Users** and create the administrator’s account. Complete any configured email verification.
2. In SQL Editor, run this as the project database owner, replacing the email once:

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

3. Confirm the identity link:

```sql
SELECT id, email, user_id, is_active
FROM public.admins
WHERE lower(email) = lower('your-admin@example.com');
```

4. Visit `/admin/login` and sign in with the Supabase Auth account.

## How access works

- The browser establishes a normal Supabase Auth session.
- The `admins.user_id` link and Row Level Security policy decide whether that session is an active administrator.
- Maintenance settings can be read by the app, but only active administrators can update them.
- Analytics and audit-log writes validate the caller’s administrator identity inside protected database functions.

## Security rules

- Never put a Supabase service-role or secret key in Vite environment variables.
- Do not grant browser roles access to retired password, administrator-creation, or password-reset functions.
- Keep the hardening migration applied in every Supabase environment, including preview projects.
- Enable MFA for each administrator in Supabase Auth before production use.

## Troubleshooting

**Admin login succeeds but redirects back to the login page**

The signed-in Auth user is not linked to an active `public.admins` record. Run the confirmation query, then run the create-or-relink statement above.

**Maintenance settings cannot be saved**

Confirm that the secure admin bootstrap and hardening migrations ran in the same project and that the signed-in user has a non-null active `admins.user_id` record.

**Admin dashboard shows a permission error**

Sign out, sign in with the linked Auth user, and confirm the `admins.user_id` value. Dashboard analytics intentionally reject sessions without administrator access.
