import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');
const repairMigration = () => {
  const migration = readdirSync(path.join(root, 'supabase', 'migrations'))
    .find((file) => /_repair_admin_authorization_contracts\.sql$/.test(file));

  assert.ok(migration, 'the forward-only admin authorization repair migration must exist');
  return read(`supabase/migrations/${migration}`);
};

test('admin authorization migration links admins to Supabase Auth and removes broad policies', () => {
  const migration = read('supabase/migrations/20260714000000_harden_admin_authorization.sql');

  assert.match(migration, /ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth\.users\(id\)/);
  assert.match(migration, /DROP POLICY IF EXISTS "Admins can view all admin records" ON public\.admins/);
  assert.match(migration, /CREATE POLICY "Authenticated administrators can view their own record"/);
  assert.match(migration, /TO authenticated/);
  assert.match(migration, /private\.current_admin_id\(\)/);
  assert.match(migration, /DROP POLICY IF EXISTS "Admins can manage app settings" ON public\.app_settings/);
  assert.match(migration, /WITH CHECK \(\(select private\.current_admin_id\(\)\) IS NOT NULL\)/);
});

test('admin authorization migration revokes public access to privileged RPCs', () => {
  const migration = read('supabase/migrations/20260714000000_harden_admin_authorization.sql');

  for (const functionName of [
    'authenticate_admin(TEXT, TEXT)',
    'create_admin(TEXT, TEXT, TEXT)',
    'update_admin_password(UUID, TEXT, TEXT)',
    'reset_admin_password(TEXT, TEXT)',
    'get_admin_dashboard_analytics()',
    'get_top_categories(INT)',
  ]) {
    assert.match(
      migration,
      new RegExp(`REVOKE ALL ON FUNCTION public\\.${functionName.replaceAll('(', '\\(').replaceAll(')', '\\)').replaceAll(',', '\\,')} FROM PUBLIC, anon, authenticated`),
    );
  }

  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.get_admin_dashboard_analytics\(\) TO authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.get_top_categories\(INT\) TO authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.log_admin_activity\(TEXT, TEXT, JSONB\) TO authenticated/);
});

test('the forward-only admin authorization repair restores the resolver column and only active admin helper access', () => {
  const migration = repairMigration();

  assert.match(migration, /ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ/);
  assert.match(migration, /REVOKE ALL ON FUNCTION private\.current_admin_id\(\) FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT USAGE ON SCHEMA private TO authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION private\.current_admin_id\(\) TO authenticated/);
  assert.doesNotMatch(migration, /GRANT (?:USAGE ON SCHEMA private|EXECUTE ON FUNCTION private\.current_admin_id\(\)) TO anon/);
});

test('admin frontend uses a verified Supabase session instead of browser-controlled state', () => {
  const source = read('src/hooks/useAdminAuth.tsx');

  assert.doesNotMatch(source, /admin_session/);
  assert.doesNotMatch(source, /authenticate_admin/);
  assert.match(source, /supabase\.auth\.getUser\(\)/);
  assert.match(source, /supabase\.auth\.signInWithPassword/);
  assert.match(source, /supabase\.auth\.signOut\(\)/);
  assert.match(source, /supabase\.rpc\('log_admin_activity'/);
});

test('administrator setup documentation does not promote the retired password RPC flow', () => {
  const readme = read('README.md');
  const guide = read('Docs/ADMIN_GUIDE.md');

  for (const document of [readme, guide]) {
    assert.doesNotMatch(document, /YourSecurePassword123/);
    assert.doesNotMatch(document, /authenticate_admin\(\)/);
    assert.match(document, /Supabase Auth/);
    assert.match(document, /20260714000000_harden_admin_authorization\.sql/);
  }
});
