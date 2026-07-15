import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const { getLocalMonthRange, toLocalDateKey } = await import('../src/utils/dateRanges.ts');

test('getLocalMonthRange includes every instant on the final calendar day', () => {
  const { start, endExclusive } = getLocalMonthRange(2026, 1);

  assert.deepEqual(start, new Date(2026, 1, 1));
  assert.deepEqual(endExclusive, new Date(2026, 2, 1));
  assert.equal(toLocalDateKey(new Date(endExclusive.getTime() - 1)), '2026-02-28');
});

test('toLocalDateKey preserves the local calendar day', () => {
  assert.equal(toLocalDateKey(new Date(2026, 0, 1, 0, 30)), '2026-01-01');
});

test('financial screens use local calendar keys and half-open monthly queries', async () => {
  const [budget, addTransaction, calendar, dashboard, budgetCalculations, dailyTotals] = await Promise.all([
    readFile(new URL('../src/pages/Budget.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/AddTransaction.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/CalendarView.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/Dashboard.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/utils/budgetCalculations.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/utils/dailyTotals.ts', import.meta.url), 'utf8'),
  ]);

  for (const source of [budget, addTransaction, calendar]) {
    assert.match(source, /getLocalMonthRange/);
    assert.match(source, /\.lt\('transaction_date', endExclusive\.toISOString\(\)\)/);
  }

  for (const source of [dashboard, dailyTotals]) {
    assert.match(source, /toLocalDateKey/);
    assert.doesNotMatch(source, /toISOString\(\)\.split\('T'\)\[0\]/);
  }

  assert.match(budgetCalculations, /getLocalMonthRange/);
  assert.match(budgetCalculations, /transactionDate < endExclusive/);
});
