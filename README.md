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

### New: Enhanced Analytics
- Daily/monthly spending breakdowns
- Budget vs actual comparisons
- Category-wise expense distribution
- Income/expense trend analysis
- Smart budget recommendations
- Export transaction history

## Tech Stack
React 18 · TypeScript · Vite · Tailwind + shadcn/ui · Supabase (Auth + Postgres + Storage) · Recharts · ESLint

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

## Database / Schema
All SQL (tables, indexes, RLS policies, views, migrations) lives in: `supabase/migrations/` → The README intentionally omits SQL for brevity.

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

## License
MIT (see LICENSE)

Built for speed, focus & low-friction financial management.

