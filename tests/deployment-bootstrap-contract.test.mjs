import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

test('the supported deployment runbook applies every required migration in order without legacy passwords', () => {
  const runbook = read('Docs/DEPLOYMENT_RUNBOOK.md');

  const migrations = [
    '20250906124330_90ed8cf6-0f6d-4e5d-9d4a-4a3e4a32749e.sql',
    '20250911035754_c066283a-9eb8-44fb-883e-58fd67106d9f.sql',
    '20250913060501_0cfd1ada-cab5-4a5a-8357-449c849b256a.sql',
    '20260712000000_secure_bootstrap_preflight.sql',
    '20260712000001_secure_admin_bootstrap.sql',
    '20260714000000_harden_admin_authorization.sql',
    '20260714000001_strengthen_financial_integrity.sql',
  ];

  let previousIndex = -1;
  for (const migration of migrations) {
    const index = runbook.indexOf(migration);
    assert.ok(index > previousIndex, `${migration} must appear after the previous migration`);
    previousIndex = index;
  }

  assert.doesNotMatch(runbook, /20251018000000_create_admin_system\.sql/);
  assert.doesNotMatch(runbook, /password_hash\s*=|INSERT INTO public\.admins[\s\S]*password_hash/i);
});

test('the legacy Vercel guide redirects to the supported deployment runbook', () => {
  const guide = read('Docs/VERCEL_DEPLOYMENT_GUIDE.md');

  assert.match(guide, /DEPLOYMENT_RUNBOOK\.md/);
  assert.doesNotMatch(guide, /YourSecurePassword123/);
  assert.doesNotMatch(guide, /20251018000000_create_admin_system\.sql/);
});
