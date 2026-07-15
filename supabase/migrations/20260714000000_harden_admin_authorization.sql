-- Replace browser-controlled admin sessions with Supabase Auth identities.
-- Run this migration only after creating the administrator in Supabase Auth.

ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Link any existing administrator to a Supabase Auth account with the same email.
UPDATE public.admins AS admin
SET user_id = auth_user.id
FROM auth.users AS auth_user
WHERE admin.user_id IS NULL
  AND lower(admin.email) = lower(auth_user.email);

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.current_admin_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id
  FROM public.admins
  WHERE user_id = (select auth.uid())
    AND is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION private.current_admin_id() FROM PUBLIC, anon, authenticated;

-- Privileged tables are no longer reachable through broad, legacy grants.
REVOKE ALL ON TABLE public.admins FROM anon, authenticated;
GRANT SELECT ON TABLE public.admins TO authenticated;

REVOKE ALL ON TABLE public.app_settings FROM anon, authenticated;
GRANT SELECT ON TABLE public.app_settings TO anon, authenticated;
GRANT UPDATE ON TABLE public.app_settings TO authenticated;

REVOKE ALL ON TABLE public.admin_activity_logs FROM anon, authenticated;
GRANT SELECT ON TABLE public.admin_activity_logs TO authenticated;

DROP POLICY IF EXISTS "Admins can view all admin records" ON public.admins;
DROP POLICY IF EXISTS "Public can view app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.admin_activity_logs;

CREATE POLICY "Authenticated administrators can view their own record"
ON public.admins
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()) AND is_active = true);

CREATE POLICY "Visitors can view public application settings"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (setting_key IN ('maintenance_mode', 'maintenance_message', 'app_version'));

CREATE POLICY "Administrators can update application settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING ((select private.current_admin_id()) IS NOT NULL)
WITH CHECK ((select private.current_admin_id()) IS NOT NULL);

CREATE POLICY "Administrators can view activity logs"
ON public.admin_activity_logs
FOR SELECT
TO authenticated
USING ((select private.current_admin_id()) IS NOT NULL);

CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_action_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_admin_id UUID;
  v_admin_email TEXT;
BEGIN
  SELECT id, email
  INTO v_admin_id, v_admin_email
  FROM public.admins
  WHERE user_id = (select auth.uid())
    AND is_active = true;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Administrator access is required'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.admin_activity_logs (
    admin_id,
    admin_email,
    action_type,
    description,
    metadata
  ) VALUES (
    v_admin_id,
    v_admin_email,
    p_action_type,
    p_description,
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_admin_activity(TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_activity(TEXT, TEXT, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSON;
BEGIN
  IF (select private.current_admin_id()) IS NULL THEN
    RAISE EXCEPTION 'Administrator access is required'
      USING ERRCODE = '42501';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_transactions', (SELECT COUNT(*) FROM public.transactions),
    'daily_active_users', (
      SELECT COUNT(DISTINCT user_id)
      FROM public.profiles
      WHERE last_active_at >= NOW() - INTERVAL '24 hours'
    ),
    'monthly_active_users', (
      SELECT COUNT(DISTINCT user_id)
      FROM public.profiles
      WHERE last_active_at >= NOW() - INTERVAL '30 days'
    ),
    'total_income', (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.transactions
      WHERE type = 'income'
    ),
    'total_expense', (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.transactions
      WHERE type = 'expense'
    ),
    'avg_transaction_value', (
      SELECT COALESCE(AVG(amount), 0)
      FROM public.transactions
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_top_categories(p_limit INT DEFAULT 5)
RETURNS TABLE(
  category_name TEXT,
  category_type TEXT,
  transaction_count BIGINT,
  total_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (select private.current_admin_id()) IS NULL THEN
    RAISE EXCEPTION 'Administrator access is required'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    category.name,
    category.type,
    COUNT(transaction.id),
    COALESCE(SUM(transaction.amount), 0)
  FROM public.categories AS category
  LEFT JOIN public.transactions AS transaction ON category.id = transaction.category_id
  GROUP BY category.id, category.name, category.type
  ORDER BY COUNT(transaction.id) DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_analytics() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_top_categories(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_categories(INT) TO authenticated;

-- Disable the legacy password-based administrator RPCs in the browser-facing API.
DO $$
BEGIN
  IF to_regprocedure('public.authenticate_admin(text,text)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.authenticate_admin(TEXT, TEXT) FROM PUBLIC, anon, authenticated';
  END IF;

  IF to_regprocedure('public.create_admin(text,text,text)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.create_admin(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated';
  END IF;

  IF to_regprocedure('public.update_admin_password(uuid,text,text)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.update_admin_password(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated';
  END IF;

  IF to_regprocedure('public.reset_admin_password(text,text)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.reset_admin_password(TEXT, TEXT) FROM PUBLIC, anon, authenticated';
  END IF;
END $$;
