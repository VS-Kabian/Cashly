import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('application routes are lazy boundaries with a navigation-safe loading fallback', async () => {
  const app = await source('src/App.tsx');
  const lazyRoutes = [
    './pages/Auth',
    './pages/Dashboard',
    './pages/AddTransaction',
    './pages/Insights',
    './pages/CalendarView',
    './pages/Profile',
    './pages/Settings',
    './components/CategoryManagement',
    './pages/AllTransactionHistory',
    './pages/Budget',
    './pages/NotFound',
    './pages/admin/AdminLogin',
    './pages/admin/AdminDashboard',
    './pages/admin/AdminSettings',
    './pages/admin/AdminActivityLogs',
  ];

  for (const route of lazyRoutes) {
    assert.match(
      app,
      new RegExp(`React\\.lazy\\(\\(\\) => import\\(['\"]${route.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}['\"]\\)\\)`),
      `${route} must be a lazy route boundary`,
    );
  }

  assert.match(app, /<Suspense fallback=\{<RouteLoadingFallback\s*\/>\}>/);
  assert.match(app, /function RouteLoadingFallback\(\)/);
  assert.match(app, /role="status"/);
  assert.match(app, /Loading page\.\.\./);
  assert.doesNotMatch(app, /import Admin(Login|Dashboard|Settings|ActivityLogs) from/);
});

test('category counts use one RLS-scoped aggregate relation read instead of a request per category', async () => {
  const categories = await source('src/components/CategoryManagement.tsx');

  assert.match(categories, /\.select\('\*, transactions\(count\)'\)/);
  assert.match(categories, /\.eq\('user_id', user\.id\)/);
  assert.match(categories, /\{ transactions, \.\.\.category \}/);
  assert.match(categories, /transactions\?\.\[0\]\?\.count \?\? 0/);
  assert.doesNotMatch(categories, /\.map\(async \(category\)/);
  assert.doesNotMatch(categories, /head:\s*true/);
});

test('Vite leaves lazy admin routes out of initial-load chunk groups', async () => {
  const config = await source('vite.config.ts');

  assert.doesNotMatch(config, /'admin-pages':\s*\[/);
  assert.doesNotMatch(config, /pages\/admin\/Admin(?:Login|Dashboard|Settings|ActivityLogs)\.tsx/);
});
