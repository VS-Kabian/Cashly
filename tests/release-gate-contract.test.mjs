import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

test('pull requests run the offline release gate without embedding Supabase credentials', () => {
  const workflow = read('.github/workflows/ci.yml');

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run lint/);
  assert.match(workflow, /npx tsc -b/);
  assert.match(workflow, /npm run build/);
  assert.doesNotMatch(workflow, /secrets\.|SUPABASE_SERVICE_ROLE|VITE_SUPABASE.*(?:eyJ|sb_)/i);
});

test('the Supabase integration gate is manual and explicitly limited to a disposable target', () => {
  const workflow = read('.github/workflows/ci.yml');

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /run_supabase_integration:/);
  assert.match(workflow, /disposable|local|staging/i);
  assert.match(workflow, /supabase test db/);
});

test('the release checklist makes the required operator-owned production checks explicit', () => {
  const checklist = read('Docs/RELEASE_CHECKLIST.md');

  assert.match(checklist, /migration.*(order|sequence)|sequence.*migration/i);
  assert.match(checklist, /Supabase Auth.*redirect URL|redirect URL.*Supabase Auth/i);
  assert.match(checklist, /VITE_SUPABASE_URL/);
  assert.match(checklist, /VITE_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(checklist, /service-role|secret key/i);
  assert.match(checklist, /Content-Security-Policy/);
  assert.match(checklist, /X-Content-Type-Options/);
  assert.match(checklist, /smoke test/i);
  assert.match(checklist, /credentials|production URL|target URL/i);
  assert.match(checklist, /not .*run|not .*validated|not .*verify/i);
});
