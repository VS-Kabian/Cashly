import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const searchModule = await import('../src/features/transactions/transactionSearch.ts').catch(() => null);

test('transaction search removes PostgREST predicate characters while preserving words and hyphens', () => {
  assert.ok(searchModule, 'transaction search helper must exist');

  const { sanitizeTransactionSearchTerm } = searchModule;
  assert.equal(
    sanitizeTransactionSearchTerm('  Food),type.eq.expense%_*"\'  '),
    'Food type eq expense',
  );
  assert.equal(sanitizeTransactionSearchTerm('Salary-2026'), 'Salary-2026');
  assert.equal(sanitizeTransactionSearchTerm('***'), '');
});

test('transaction search builds an OR expression only from sanitized text and UUIDs', () => {
  assert.ok(searchModule, 'transaction search helper must exist');

  const { buildSafeTransactionSearchExpression } = searchModule;
  assert.equal(
    buildSafeTransactionSearchExpression('Food),type.eq.expense', [
      'd2719a47-e8ee-4ffb-bd1a-e062a1e82c5f',
      'not-a-uuid',
    ]),
    'description.ilike.%Food type eq expense%,category_id.in.(d2719a47-e8ee-4ffb-bd1a-e062a1e82c5f)',
  );
  assert.equal(buildSafeTransactionSearchExpression('***', []), null);
});

test('transaction history keeps the client import in the repository boundary', async () => {
  const source = await readFile(new URL('../src/hooks/useTransactionHistory.ts', import.meta.url), 'utf8');
  const repository = await readFile(new URL('../src/features/transactions/transactionRepository.ts', import.meta.url), 'utf8');

  assert.match(source, /@\/features\/transactions\/transactionRepository/);
  assert.doesNotMatch(source, /await import\('@\/integrations\/supabase\/client'\)/);
  assert.doesNotMatch(source, /import\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]@\/integrations\/supabase\/client['"]/);
  assert.match(repository, /import \{ supabase \} from '@\/integrations\/supabase\/client'/);
  assert.match(repository, /from '\.\/transactionSearch'/);
});
