import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const historyModule = await import('../src/features/transactions/transactionHistoryQueryPlan.ts').catch(() => null);

test('transaction history uses a stable, range-limited query plan for equivalent filters', () => {
  assert.ok(historyModule, 'transaction history query module must exist');

  const { buildTransactionHistoryQueryPlan, TRANSACTION_HISTORY_PAGE_SIZE } = historyModule;
  const first = buildTransactionHistoryQueryPlan('user-1', {
    searchTerm: '  Groceries  ',
    selectedMonth: '2026-07',
    categoryId: 'category-1',
    type: 'expense',
  }, 0);
  const second = buildTransactionHistoryQueryPlan('user-1', {
    searchTerm: 'groceries',
    selectedMonth: '2026-07',
    categoryId: 'category-1',
    type: 'expense',
  }, 1);

  assert.equal(TRANSACTION_HISTORY_PAGE_SIZE, 50);
  assert.deepEqual(first.queryKey, second.queryKey);
  assert.deepEqual(first.range, { from: 0, to: 49 });
  assert.deepEqual(second.range, { from: 50, to: 99 });
  assert.deepEqual(first.monthRange, {
    start: new Date(2026, 6, 1).toISOString(),
    endExclusive: new Date(2026, 7, 1).toISOString(),
  });
});

test('transaction history query plan omits inactive filters from its cache key', () => {
  assert.ok(historyModule, 'transaction history query module must exist');

  const { buildTransactionHistoryQueryPlan } = historyModule;
  const plan = buildTransactionHistoryQueryPlan('user-1', {
    searchTerm: ' ',
    selectedMonth: 'all-months',
    categoryId: 'all',
  }, 0);

  assert.deepEqual(plan.queryKey, ['transaction-history', 'user-1', {
    categoryId: null,
    searchTerm: null,
    selectedMonth: null,
    type: null,
  }]);
  assert.equal(plan.monthRange, null);
});

test('history page sends a selected type to the server query and accepts any calendar month', async () => {
  const page = await readFile(new URL('../src/pages/AllTransactionHistory.tsx', import.meta.url), 'utf8');

  assert.match(page, /const \[selectedType, setSelectedType\] = useState/);
  assert.match(page, /type: selectedType === 'all' \? null : selectedType/);
  assert.match(page, /aria-label="Filter by type"/);
  assert.match(page, /type="month"/);
});
