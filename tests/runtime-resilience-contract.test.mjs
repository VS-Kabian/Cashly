import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('the application root has a recoverable error boundary that does not expose exception details', async () => {
  const [boundary, main] = await Promise.all([
    source('src/components/AppErrorBoundary.tsx'),
    source('src/main.tsx'),
  ]);

  assert.match(boundary, /class AppErrorBoundary extends Component/);
  assert.match(boundary, /Try again/);
  assert.match(boundary, /window\.location\.reload\(\)/);
  assert.doesNotMatch(boundary, /error\.message|error\.stack/);
  assert.match(main, /<AppErrorBoundary>\s*<App\s*\/?>\s*<\/AppErrorBoundary>/);
});

test('the transaction form blocks invalid financial input and identifies invalid fields accessibly', async () => {
  const form = await source('src/pages/AddTransaction.tsx');

  assert.match(form, /Number\.isFinite\(amount\) && amount > 0/);
  assert.match(form, /isValidLocalDate\(formData\.transactionDate\)/);
  assert.match(form, /aria-invalid=\{Boolean\(validationErrors\.amount\)\}/);
  assert.match(form, /aria-invalid=\{Boolean\(validationErrors\.categoryId\)\}/);
  assert.match(form, /aria-invalid=\{Boolean\(validationErrors\.transactionDate\)\}/);
  assert.match(form, /role="alert"/);
});

test('a successful transaction insert invalidates only the current user history cache', async () => {
  const form = await source('src/pages/AddTransaction.tsx');

  assert.match(form, /useQueryClient/);
  assert.match(form, /invalidateTransactionHistory/);
  assert.match(form, /const queryClient = useQueryClient\(\)/);
  assert.match(form, /invalidateTransactionHistory\(queryClient, user\.id\)/);
});
