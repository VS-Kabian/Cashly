# BoltCash Administrator Setup

Cashly administrators use **Supabase Auth**. Browser storage and the former custom-password RPCs are not authorization mechanisms and must not be restored.

## Secure setup

1. In Supabase Dashboard, open **Authentication → Users** and create the administrator’s email/password account. Complete any configured email verification.
2. Apply the application’s existing migrations, followed by `supabase/migrations/20260714000000_harden_admin_authorization.sql`.
3. The hardening migration automatically links an existing administrator record to an Auth user with the same email. Confirm the link in the SQL Editor:

```sql
SELECT id, email, user_id, is_active
FROM public.admins
WHERE email = 'your-admin@example.com';
```

4. If `user_id` is `NULL`, link the already-created Auth account explicitly:

```sql
UPDATE public.admins AS admin
SET user_id = auth_user.id,
    is_active = true
FROM auth.users AS auth_user
WHERE lower(admin.email) = lower(auth_user.email)
  AND lower(admin.email) = lower('your-admin@example.com');
```

5. Visit `/admin/login` and sign in with the Auth account.

## How access works

- The browser establishes a normal Supabase Auth session.
- The `admins.user_id` link and Row Level Security policy decide whether that session is an active administrator.
- Maintenance settings can be read by the app but only active administrators can update them.
- Analytics and audit-log writes validate the caller’s administrator identity inside protected database functions.

## Security rules

- Never put a Supabase service-role or secret key in Vite environment variables.
- Do not grant browser roles access to `create_admin`, password-reset, or legacy custom-password functions.
- Keep the hardening migration applied in every Supabase environment, including preview projects.
- Enable MFA for each administrator in Supabase Auth before production use.

## Troubleshooting

**Admin login succeeds but redirects back to the login page**

The signed-in Auth user is not linked to an active record in `public.admins`. Run the verification query above, then link the account if necessary.

**Maintenance settings cannot be saved**

Confirm the hardening migration ran and that the signed-in user is an active administrator. Ordinary users intentionally receive a permission error.

**Admin dashboard shows a permission error**

Sign out, sign in with the linked Auth user, and confirm the `admins.user_id` value. Dashboard analytics intentionally reject sessions without administrator access.
