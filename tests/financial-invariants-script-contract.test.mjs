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
  assert.match(sql, /SELECT plan\(5\);/);
  assert.match(sql, /SELECT \* FROM finish\(\);/);
  assert.match(sql, /INSERT INTO auth\.users/);
  assert.match(sql, /gen_random_uuid\(\)/);
  assert.match(sql, /cashly-financial-owner-/);
  assert.match(sql, /cashly-financial-other-/);
  assert.match(sql, /INSERT INTO public\.categories/);
  assert.match(sql, /WHERE category\.user_id = owner_user_id/);
  assert.match(sql, /WHERE category\.user_id = other_user_id/);
  assert.match(sql, /SELECT throws_ok\(/);
  assert.match(sql, /SET LOCAL ROLE authenticated/);
  assert.match(sql, /request\.jwt\.claim\.sub/);
  assert.match(sql, /amount.*-1|\-1.*amount/is);
  assert.match(sql, /Transaction category must belong to the same user/);
  assert.match(sql, /Budget alert must belong to the same user/);
  assert.doesNotMatch(sql, /ORDER BY category\.created_at/);
});
