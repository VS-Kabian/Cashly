import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

test('the Supabase validation script checks the hardened authorization boundary without writing data', () => {
  const sql = read('Docs/SUPABASE_VALIDATION.sql');

  assert.match(sql, /BEGIN TRANSACTION READ ONLY/i);
  assert.match(sql, /public\.admins/);
  assert.match(sql, /public\.app_settings/);
  assert.match(sql, /public\.admin_activity_logs/);
  assert.match(sql, /pg_policies/);
  assert.match(sql, /has_function_privilege\('anon'/);
  assert.match(sql, /authenticate_admin/);
  assert.match(sql, /get_admin_dashboard_analytics/);
  assert.match(sql, /ROLLBACK/i);
  assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|ALTER|CREATE|DROP)\b/i);
});
