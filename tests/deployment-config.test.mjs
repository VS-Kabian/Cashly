import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  isPlaceholderValue,
  validatePublicEnv,
} from '../scripts/validate-public-env.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('the public environment validator rejects placeholder Supabase values', () => {
  assert.equal(isPlaceholderValue('your-project.supabase.co'), true);

  assert.throws(
    () => validatePublicEnv({
      VITE_SUPABASE_URL: 'https://your-project.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'your-publishable-key',
    }),
    /placeholder/i,
  );
});

test('the public environment validator rejects a missing Supabase URL or publishable key', () => {
  assert.throws(
    () => validatePublicEnv({ VITE_SUPABASE_PUBLISHABLE_KEY: 'pk_test_value' }),
    /VITE_SUPABASE_URL is required/,
  );
  assert.throws(
    () => validatePublicEnv({ VITE_SUPABASE_URL: 'https://project.supabase.co' }),
    /VITE_SUPABASE_PUBLISHABLE_KEY is required/,
  );
});

test('Vercel config defines the required security header names', async () => {
  const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
  const headerNames = config.headers.flatMap((rule) => rule.headers.map((header) => header.key));

  assert.deepEqual(headerNames.sort(), [
    'Content-Security-Policy',
    'Referrer-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
  ]);
});
