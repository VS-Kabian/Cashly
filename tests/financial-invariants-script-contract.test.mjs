import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

test('the financial invariant harness is a self-contained pgTAP test for the local disposable database', () => {
  const sql = read('supabase/tests/financial_invariants.sql');

  assert.match(sql, /BEGIN;/);
  assert.match(sql, /ROLLBACK;/);
  assert.match(sql, /SELECT plan\(11\);/);
  assert.match(sql, /SELECT \* FROM finish\(\);/);
  assert.match(sql, /INSERT INTO auth\.users/);
  assert.match(sql, /gen_random_uuid\(\)/);
  assert.match(sql, /cashly-financial-owner-/);
  assert.match(sql, /cashly-financial-other-/);
  assert.match(sql, /cashly-financial-admin-/);
  assert.match(sql, /INSERT INTO public\.admins/);
  assert.match(sql, /has_column\(\s*'public',\s*'admins',\s*'last_login_at'/);
  assert.match(sql, /INSERT INTO public\.categories/);
  assert.match(sql, /WHERE category\.user_id = owner_user_id/);
  assert.match(sql, /WHERE category\.user_id = other_user_id/);
  assert.match(sql, /SELECT throws_ok\(/);
  assert.match(sql, /SET LOCAL ROLE authenticated/);
  assert.match(sql, /request\.jwt\.claim\.sub/);
  assert.match(sql, /request\.jwt\.claim\.role/);
  assert.match(sql, /request\.jwt\.claims/);
  assert.match(sql, /cross-user category writes are rejected for an authenticated user/);
  assert.match(sql, /RLS hides another user''s transactions from an authenticated user/);
  assert.match(sql, /public\.get_admin_dashboard_analytics\(\)/);
  assert.match(sql, /Administrator access is required/);
  assert.match(sql, /an anonymous caller cannot execute the private admin resolver/);
  assert.match(sql, /Auth-linked active administrator can execute the private admin resolver/);
  assert.match(sql, /Auth-linked active administrator can call the protected admin RPC/);
  assert.match(sql, /amount.*-1|\-1.*amount/is);
  assert.match(sql, /Transaction category must belong to the same user/);
  assert.match(sql, /Budget alert must belong to the same user/);
  assert.doesNotMatch(sql, /ORDER BY category\.created_at/);
});
