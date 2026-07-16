# Cashly Vercel deployment guide

The previous guide used a retired administrator setup and must not be followed.

Use [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md) as the only supported deployment procedure. It verifies that Vercel and Supabase target the same project, applies the complete database schema in dependency order, and creates administrators through Supabase Auth.

For Vercel, use:

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

Set only these browser-visible environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The publishable key is intended for browser use; authorization is enforced by Supabase Auth and Row Level Security. Never add a service-role or secret key to Vercel `VITE_` variables.
