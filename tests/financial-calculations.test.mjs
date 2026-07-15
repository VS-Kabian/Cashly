import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { build } from 'esbuild';

const importBundledModule = async (entryPoint) => {
  const result = await build({
    entryPoints: [resolve(entryPoint)],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node22',
    write: false,
  });
  const source = Buffer.from(result.outputFiles[0].text).toString('base64');
  return import(`data:text/javascript;base64,${source}`);
};

const { calculateBudgetSummary } = await importBundledModule('src/utils/budgetCalculations.ts');
const { computeDailyTotals } = await importBundledModule('src/utils/dailyTotals.ts');
const { toLocalDateKey } = await importBundledModule('src/utils/dateRanges.ts');

test('budget summary includes an expense made during the final minute of the month', () => {
  const finalMinuteOfJanuary = new Date(2026, 0, 31, 23, 59).toISOString();
  const firstMinuteOfFebruary = new Date(2026, 1, 1, 0, 0).toISOString();

  const summary = calculateBudgetSummary(
    [{ amount: 1_000, category_id: null }],
    [
      { amount: 250, type: 'expense', transaction_date: finalMinuteOfJanuary },
      { amount: 400, type: 'expense', transaction_date: firstMinuteOfFebruary },
    ],
    1,
    2026,
  );

  assert.equal(summary.totalSpent, 250);
  assert.equal(summary.remaining, 750);
});

test('daily totals use the supplied local calendar day rather than a UTC date fragment', () => {
  const selectedLocalDay = new Date(2026, 6, 15, 0, 15);
  const nextLocalDay = new Date(2026, 6, 16, 0, 15);

  const totals = computeDailyTotals(
    [
      { amount: 900, type: 'income', transaction_date: selectedLocalDay.toISOString() },
      { amount: 175, type: 'expense', transaction_date: selectedLocalDay.toISOString() },
      { amount: 300, type: 'expense', transaction_date: nextLocalDay.toISOString() },
    ],
    toLocalDateKey(selectedLocalDay),
  );

  assert.deepEqual(totals, { dailyIncome: 900, dailyExpenses: 175 });
});

test('financial-integrity migration declares invalid financial writes and cross-user ownership invalid', async () => {
  const migration = await readFile(
    new URL('../supabase/migrations/20260714000001_strengthen_financial_integrity.sql', import.meta.url),
    'utf8',
  );

  assert.match(migration, /transactions_amount_positive CHECK \(amount > 0\) NOT VALID/);
  assert.match(migration, /budgets_amount_positive CHECK \(amount > 0\) NOT VALID/);
  assert.match(migration, /categories_name_not_blank CHECK \(btrim\(name\) <> ''\) NOT VALID/);
  assert.match(migration, /budgets_one_overall_per_user_month_idx/);
  assert.match(migration, /Transaction category must belong to the same user/);
  assert.match(migration, /Budget category must belong to the same user/);
});
