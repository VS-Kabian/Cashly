import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const sourceFiles = [
  'src/components/CategoryManagement.tsx',
  'src/components/TransactionEditModal.tsx',
  'src/pages/AddTransaction.tsx',
  'src/pages/Budget.tsx',
  'src/pages/CalendarView.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Insights.tsx',
  'src/pages/Profile.tsx',
  'src/pages/Settings.tsx',
];

const staleEffectFiles = [
  ['src/pages/Budget.tsx', 'fetchData'],
  ['src/pages/CalendarView.tsx', 'fetchMonthTransactions'],
  ['src/pages/Dashboard.tsx', 'fetchDashboardData'],
  ['src/pages/Insights.tsx', 'fetchInsightsData'],
  ['src/pages/Profile.tsx', 'fetchProfile'],
  ['src/pages/Profile.tsx', 'fetchStats'],
  ['src/pages/Settings.tsx', 'fetchProfile'],
  ['src/pages/admin/AdminActivityLogs.tsx', 'filterLogs'],
];

async function source(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('data mutation error handlers keep unknown errors safely typed', async () => {
  const contents = await Promise.all(sourceFiles.map(source));

  for (const content of contents) {
    assert.doesNotMatch(content, /catch \(error: any\)/);
  }
});

test('stale data loaders use stable callbacks in their effects', async () => {
  const categoryManagement = await source('src/components/CategoryManagement.tsx');
  const addTransaction = await source('src/pages/AddTransaction.tsx');

  assert.match(categoryManagement, /useCallback\(/);
  assert.match(categoryManagement, /\[fetchCategories, user\]/);
  assert.match(addTransaction, /useCallback\(/);
  assert.match(addTransaction, /\[checkBudgetImpact, formData\.amount, transactionType\]/);
});

test('Tailwind config uses an ESM plugin import', async () => {
  const config = await source('tailwind.config.ts');

  assert.match(config, /import animate from "tailwindcss-animate"/);
  assert.doesNotMatch(config, /require\(/);
});

test('remaining effect callbacks are stable and listed as dependencies', async () => {
  for (const [path, callback] of staleEffectFiles) {
    const content = await source(path);

    assert.match(content, new RegExp(`const ${callback} = useCallback\\(`));
    assert.match(content, new RegExp(`\\[[^\\]]*${callback}(?:,|\\])`));
  }
});

test('Fast Refresh modules do not export non-components beside components', async () => {
  const button = await source('src/components/ui/button.tsx');
  const toggle = await source('src/components/ui/toggle.tsx');
  const authProvider = await source('src/hooks/AuthProvider.tsx');
  const adminAuthProvider = await source('src/hooks/useAdminAuth.tsx');

  assert.doesNotMatch(button, /export \{ Button, buttonVariants \}/);
  assert.doesNotMatch(toggle, /export \{ Toggle, toggleVariants \}/);
  assert.doesNotMatch(authProvider, /export function useAuth/);
  assert.doesNotMatch(adminAuthProvider, /export function useAdminAuth/);
});
