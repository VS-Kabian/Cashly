import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts', 'run-supabase-integration-tests.mjs');

test('the Supabase integration runner refuses to claim success without explicit local-test opt-in', () => {
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, CASHLY_RUN_SUPABASE_INTEGRATION: '' },
  });

  assert.equal(result.status, 2);
  assert.match(`${result.stdout}${result.stderr}`, /CASHLY_RUN_SUPABASE_INTEGRATION=1/);
});

test('the Supabase integration runner requires the explicit local target before it can reset a database', () => {
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      CASHLY_RUN_SUPABASE_INTEGRATION: '1',
      CASHLY_SUPABASE_TARGET: 'staging',
    },
  });

  assert.equal(result.status, 2);
  assert.match(`${result.stdout}${result.stderr}`, /CASHLY_SUPABASE_TARGET=local/);
});
