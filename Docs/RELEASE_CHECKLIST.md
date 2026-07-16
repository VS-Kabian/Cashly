# Cashly release checklist

Use this checklist for a production candidate only after the pull request release gate is green. It records operator-owned deployment evidence; it does not apply migrations, configure Supabase, configure Vercel, or run live checks itself.

## 1. Release candidate and CI

- [ ] Record the release commit and pull request.
- [ ] Confirm the pull-request CI job passed `npm test`, `npm run lint`, `npx tsc -b`, and `npm run build`.
- [ ] Treat the CI build's Supabase values as non-secret build fixtures only. A green CI build confirms local public-environment validation; it does not validate a live Supabase project.
- [ ] If database behavior changed, run the optional `supabase-integration` gate only on the approved disposable local or staging target. Record the target, test users, and result. Never run that gate against production.

## 2. Verify the secure migration sequence

- [ ] Identify the intended Supabase project reference and confirm it is the same project Vercel will use.
- [ ] Apply and verify the complete migration order approved for this release, including the secure bootstrap preflight before privileged tables and the later authorization and financial-integrity migrations.
- [ ] Stop on the first migration error; do not skip ahead or apply only the hardening migrations to an empty project.
- [ ] Confirm the retired custom-password admin migration is absent and no administrator password is stored in `public.admins`.
- [ ] Run the release's approved read-only production SQL checks and retain the output with the release record.
- [ ] In a disposable local or staging project, prove schema order, RLS isolation, authenticated admin access, and financial constraints with the release's approved integration and validation scripts.

## 3. Supabase Auth and administrator access

- [ ] In Supabase Auth, set the Site URL to the intended production URL.
- [ ] Add every approved production origin, including the Vercel production URL and any custom domain, to the Supabase Auth redirect URLs. Cashly redirects to `window.location.origin` after sign-up or OAuth.
- [ ] Create or verify the administrator through Supabase Auth, link the active `public.admins.user_id`, and enable MFA for each administrator.
- [ ] Verify a normal authenticated user cannot access the admin dashboard or its admin RPCs, while the Auth-linked active administrator can.

## 4. Vercel production configuration

- [ ] Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel's Production environment from the selected Supabase project.
- [ ] Recheck that the Vercel URL and the Supabase project reference match before deployment.
- [ ] Do not add a Supabase service-role or secret key to any `VITE_` variable, repository file, client bundle, or CI configuration.
- [ ] Redeploy after changing Vercel variables and confirm `npm run build` succeeds with the selected public values before release.

## 5. Production security headers

- [ ] Request the production URL and confirm the deployed response has `Content-Security-Policy`, `Referrer-Policy`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY` from `vercel.json`.
- [ ] Confirm the Content Security Policy permits only the expected hosted Supabase connections and does not weaken `frame-ancestors`, `object-src`, or script loading.

## 6. Production smoke tests

- [ ] Using a non-admin test account, sign in, create a category, transaction, budget, and budget alert; verify normal reads and writes work.
- [ ] With a second test account, verify cross-user reads and writes are rejected and invalid financial values are rejected by the database.
- [ ] Verify the administrator sign-in and dashboard flow, then verify the same non-admin account remains blocked from `/admin/dashboard`.
- [ ] Check the browser console and network panel for failed requests, CSP errors, or unexpected credentials.
- [ ] Record the production URL, Supabase project reference, migration versions, header evidence, smoke-test results, operator, and timestamp.

## External validation boundary

This repository has not run or validated live Supabase or Vercel checks. Those checks require the release operator's credentials and approved production URL or target URL; do not mark them complete until the operator records the evidence above.
