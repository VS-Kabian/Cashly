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
- **Separate Auth** - Independent admin authentication system
- **Access:** `/admin/login` - Default: `admin@example.com` / `YourSecurePassword123`

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
1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/20251018000000_create_admin_system.sql`
3. **Edit lines 270-273:** Change default admin email/password
4. Copy & paste entire SQL into Supabase SQL Editor
5. Click **Run**
6. Access admin panel: `http://localhost:8080/admin/login`
7. ⚠️ **For production:** Run `20251018000001_production_password_security.sql` for bcrypt hashing

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

## Deployment
Build output: `npm run build` → `dist/`
Deploy to Netlify, Vercel or any static host (SPA rewrite to `/index.html`).

**Before deploying:**
1. Run admin migration in Supabase (see Admin Setup above)
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
- **Admin login fails**: Run admin migration in Supabase SQL Editor first
- **"function authenticate_admin does not exist"**: Migration not executed
- **Admin docs**: See `Docs/ADMIN_GUIDE.md` and `Docs/ULTRA_SYSTEM_CHECK_REPORT.md`

## License
MIT (see LICENSE)

Built for speed, focus & low-friction financial management.

