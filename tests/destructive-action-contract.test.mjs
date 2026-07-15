import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('category deletion is an accessible confirmation that names its irreversible effects', async () => {
  const source = await readSource('../src/components/CategoryManagement.tsx');

  assert.match(source, /AlertDialog/);
  assert.match(source, /<AlertDialogTitle[^>]*>Delete Category<\/AlertDialogTitle>/);
  assert.match(source, /linked budgets will be deleted/i);
  assert.match(source, /historical transactions will become uncategorized/i);
  assert.match(source, /aria-label="Delete category"/);
  assert.match(source, /<AlertDialogAction\s+onClick=\{\(\) => handleDeleteCategory\(category\.id\)\}/);
  assert.doesNotMatch(source, /onClick=\{\(\) => handleDeleteCategory\(category\.id\)\}\s*>\s*<Trash2/);
});

test('transaction deletion remains behind an accessible confirmation action', async () => {
  const source = await readSource('../src/components/TransactionEditModal.tsx');

  assert.match(source, /<AlertDialogTitle[^>]*>Delete Transaction<\/AlertDialogTitle>/);
  assert.match(source, /This action cannot be undone\./);
  assert.match(source, /aria-label="Delete transaction"/);
  assert.match(source, /<AlertDialogAction\s+onClick=\{handleDelete\}/);
});
