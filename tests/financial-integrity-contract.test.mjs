import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migration = await readFile(
  new URL('../supabase/migrations/20260714000001_strengthen_financial_integrity.sql', import.meta.url),
  'utf8'
);

test('financial integrity migration constrains amounts, owners, and monthly budgets', () => {
  assert.match(migration, /transactions_amount_positive/i);
  assert.match(migration, /budgets_amount_positive/i);
  assert.match(migration, /FOREIGN KEY \(user_id\) REFERENCES auth\.users\(id\) ON DELETE CASCADE NOT VALID/i);
  assert.match(migration, /budgets_one_overall_per_user_month_idx/i);
  assert.match(migration, /WHERE category_id IS NULL/i);
  assert.match(migration, /private\.enforce_transaction_category_owner/i);
  assert.match(migration, /private\.enforce_budget_category_owner/i);
  assert.match(migration, /private\.enforce_budget_alert_owner/i);
});

test('financial integrity migration makes tenant RLS checks explicit and indexed', () => {
  assert.match(migration, /TO authenticated/i);
  assert.match(migration, /WITH CHECK \(\(select auth\.uid\(\)\) = user_id\)/i);
  assert.match(migration, /transactions_user_transaction_date_idx/i);
  assert.match(migration, /categories_user_name_idx/i);
  assert.match(migration, /budget_alerts_budget_id_idx/i);
});

test('budget saves update an existing overall budget instead of inserting another null category row', async () => {
  const budgetPage = await readFile(new URL('../src/pages/Budget.tsx', import.meta.url), 'utf8');

  assert.match(budgetPage, /selectedCategory === 'total'/);
  assert.match(budgetPage, /\.is\('category_id', null\)/);
  assert.match(budgetPage, /onConflict: 'user_id,month,year,category_id'/);
});
