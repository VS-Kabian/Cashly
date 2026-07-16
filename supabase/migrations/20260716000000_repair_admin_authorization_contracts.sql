-- Forward-only repair for the Auth-backed administrator resolver contract.
-- The frontend resolver selects this column, while RLS policies and protected
-- RPCs require authenticated callers to execute this non-exposed helper.

ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.current_admin_id() FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_admin_id() TO authenticated;
