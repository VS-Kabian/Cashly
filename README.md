# BoltCash

<div align="center">
  <img src="https://ik.imagekit.io/Boltmemo/Money%20Manager?updatedAt=1758465083117" alt="BoltCash Logo" width="120" height="120">
</div>

Fast, minimal, cross‑device personal finance manager with transaction tracking, budgeting & insights.

Live Website: https://boltcash.vercel.app/

## Overview
BoltCash is a lightweight, fast finance management app focused on frictionless transaction entry, budget tracking, and comprehensive financial insights. Database logic is isolated with a repository pattern and defensive fallbacks.

## Core Features
- **Transaction Management** - Quick income/expense entry with categories & emoji support
- **Budget Tracking** - Set monthly budgets with real-time progress monitoring
- **Smart Categories** - Custom categories with color coding and emoji icons
- **Financial Insights** - Charts, trends, and spending analysis
- **Calendar View** - Visual timeline of all transactions
- **Dark / Light Mode** - Responsive mobile-first UI with theme switching
- **Secure Authentication** - Email/password with Supabase Auth
- **Real-time Sync** - Instant updates across devices
- **Admin Dashboard** - Comprehensive admin panel with analytics, maintenance mode & activity logs

### New: Enhanced Analytics
- Daily/monthly spending breakdowns
- Budget vs actual comparisons
- Category-wise expense distribution
- Income/expense trend analysis
- Smart budget recommendations
- Export transaction history

### Admin Panel
- **Dashboard Analytics** - Real-time metrics: users, transactions, DAU/MAU, top categories
- **Maintenance Mode** - Toggle with custom HTML/CSS messages (XSS protected with DOMPurify)
- **Activity Logs** - Complete audit trail of all admin actions with search/filter
- **Supabase Auth + Role Check** - Admin access requires a verified Supabase Auth session linked to an active administrator record
- **Access:** `/admin/login`

## Tech Stack
React 18 · TypeScript · Vite · Tailwind + shadcn/ui · Supabase (Auth + Postgres + Storage) · Recharts · DOMPurify · ESLint

## Quick Start
```sh
git clone https://github.com/yourusername/boltcash.git
cd boltcash
npm install
cp .env.example .env   # add Supabase keys
npm run dev
```

App runs at http://localhost:8080

**Environment:**
```
VITE_SUPABASE_PROJECT_ID=""
VITE_SUPABASE_PUBLISHABLE_KEY=""
VITE_SUPABASE_URL=""
```

### Admin Setup
1. Create the administrator in **Supabase Dashboard → Authentication → Users** using the email that should access `/admin`.
2. Apply the regular schema migrations, then apply `supabase/migrations/20260714000000_harden_admin_authorization.sql`.
3. The hardening migration links an existing `admins` record to a matching Auth user by email. If the Auth user was created later, follow [Docs/ADMIN_GUIDE.md](Docs/ADMIN_GUIDE.md) to link it manually.
4. Sign in at `/admin/login` with the Supabase Auth credentials.

The legacy custom-password administrator flow is retired. Do not expose service-role keys in the browser or restore the retired password RPCs.

## Database / Schema
All SQL (tables, indexes, RLS policies, views, migrations) lives in: `supabase/migrations/` → The README intentionally omits SQL for brevity.

**Admin Tables:** `admins`, `app_settings`, `admin_activity_logs` (see admin migration files)

## Scripts
| Command | Desc |
|---------|------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview dist |
| `npm run lint` | Lint code |
| `npm test` | Run repository security-contract tests |

## Deployment
Build output: `npm run build` → `dist/`
Deploy to Netlify, Vercel or any static host (SPA rewrite to `/index.html`).

**Before deploying:**
1. Create the Supabase Auth administrator and apply the admin-hardening migration (see Admin Setup above)
2. Set environment variables in hosting platform (Vercel/Netlify)
3. Test admin login at `[your-domain]/admin/login`

## Roadmap (Excerpt)
- Recurring transactions & subscriptions
- Multiple account support
- Investment tracking
- Bill reminders & notifications
- Data export (CSV, PDF)
- Bank account integration (future)

Full roadmap & issues: use repository Issues board.

## Troubleshooting
- **Schema / migration problems**: see `supabase/migrations/` (includes full copy‑paste block + repair scripts)
- **Auth issues**: verify RLS + re-login
- **Performance**: archive old transactions
- **Admin login fails**: Verify the Auth user exists and is linked to an active `admins.user_id` record.
- **Admin docs**: See `Docs/ADMIN_GUIDE.md`.

## License
MIT (see LICENSE)

Built for speed, focus & low-friction financial management.

