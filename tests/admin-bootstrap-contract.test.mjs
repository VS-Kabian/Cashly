import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

test('the Auth-first admin bootstrap creates no custom password boundary', () => {
  const migration = read('supabase/migrations/20260712000001_secure_admin_bootstrap.sql');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.admins/);
  assert.match(migration, /user_id UUID UNIQUE REFERENCES auth\.users\(id\) ON DELETE CASCADE/);
  assert.match(migration, /ALTER TABLE public\.admins ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /REVOKE ALL ON TABLE public\.admins FROM anon, authenticated/);
  assert.match(migration, /DROP FUNCTION IF EXISTS public\.authenticate_admin\(TEXT, TEXT\)/);
  assert.match(migration, /DROP COLUMN IF EXISTS password_hash/);
  assert.doesNotMatch(migration, /INSERT INTO public\.admins[\s\S]*password_hash/i);
  assert.doesNotMatch(migration, /admin@example\.com|YourSecurePassword/i);
});

test('the supported clean bootstrap excludes retired password-admin migrations and runs before hardening', () => {
  const migrations = readdirSync(path.join(root, 'supabase', 'migrations')).sort();

  assert.ok(migrations.includes('20260712000000_secure_bootstrap_preflight.sql'));
  assert.ok(migrations.includes('20260712000001_secure_admin_bootstrap.sql'));
  assert.ok(
    migrations.indexOf('20260712000001_secure_admin_bootstrap.sql')
      < migrations.indexOf('20260714000000_harden_admin_authorization.sql'),
  );
  assert.ok(!migrations.some((migration) => migration.includes('create_admin_system')));
  assert.ok(!migrations.some((migration) => migration.includes('production_password_security')));
});

test('the administrator guide can create or relink an Auth-backed administrator record', () => {
  const guide = read('Docs/ADMIN_GUIDE.md');

  assert.match(guide, /INSERT INTO public\.admins \(email, user_id, full_name, is_active\)/);
  assert.match(guide, /ON CONFLICT \(email\) DO UPDATE/);
  assert.match(guide, /FROM auth\.users/);
  assert.doesNotMatch(guide, /password_hash|create_admin\(/i);
});
