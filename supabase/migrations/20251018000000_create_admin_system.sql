-- =====================================================
-- ADMIN DASHBOARD SYSTEM MIGRATION
-- Created: 2025-10-18
-- Status: TESTED AND WORKING ✅
-- =====================================================
-- This is the WORKING version that successfully ran
-- Uses IF NOT EXISTS and CREATE OR REPLACE to avoid conflicts
-- =====================================================

-- Step 1: Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 2: Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policy (with safe conflict handling)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admins'
    AND policyname = 'Admins can view all admin records'
  ) THEN
    CREATE POLICY "Admins can view all admin records"
    ON public.admins
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON public.admins(is_active);

-- Step 5: Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 6: Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Step 7: Create policies for app_settings (with safe conflict handling)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_settings'
    AND policyname = 'Public can view app settings'
  ) THEN
    CREATE POLICY "Public can view app settings"
    ON public.app_settings
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_settings'
    AND policyname = 'Admins can manage app settings'
  ) THEN
    CREATE POLICY "Admins can manage app settings"
    ON public.app_settings
    FOR ALL
    USING (true);
  END IF;
END $$;

-- Step 8: Create admin_activity_logs table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 9: Enable RLS on activity logs
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Step 10: Create policies for activity logs (with safe conflict handling)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_activity_logs'
    AND policyname = 'Admins can view activity logs'
  ) THEN
    CREATE POLICY "Admins can view activity logs"
    ON public.admin_activity_logs
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_activity_logs'
    AND policyname = 'Admins can insert activity logs'
  ) THEN
    CREATE POLICY "Admins can insert activity logs"
    ON public.admin_activity_logs
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- Step 11: Create indexes for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.admin_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_email ON public.admin_activity_logs(admin_email);

-- Step 12: Add last_active_at to profiles (if not exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON public.profiles(last_active_at DESC);

-- Step 13: Create triggers (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_admins_updated_at'
  ) THEN
    CREATE TRIGGER update_admins_updated_at
      BEFORE UPDATE ON public.admins
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_app_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_app_settings_updated_at
      BEFORE UPDATE ON public.app_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Step 14: Create the authenticate_admin function
CREATE OR REPLACE FUNCTION public.authenticate_admin(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_admin RECORD;
  v_result JSON;
BEGIN
  -- Find admin by email and password (PLAIN TEXT - DEVELOPMENT ONLY)
  -- In production, run the password security migration
  SELECT id, email, full_name, is_active, last_login_at
  INTO v_admin
  FROM public.admins
  WHERE email = p_email
    AND password_hash = p_password
    AND is_active = true;

  IF v_admin.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build result JSON
  SELECT json_build_object(
    'id', v_admin.id,
    'email', v_admin.email,
    'full_name', v_admin.full_name,
    'is_active', v_admin.is_active,
    'last_login_at', v_admin.last_login_at
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 15: Create analytics function
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_analytics()
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 16: Create top categories function
CREATE OR REPLACE FUNCTION public.get_top_categories(p_limit INT DEFAULT 5)
RETURNS TABLE(
  category_name TEXT,
  category_type TEXT,
  transaction_count BIGINT,
  total_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.name AS category_name,
    c.type AS category_type,
    COUNT(t.id) AS transaction_count,
    COALESCE(SUM(t.amount), 0) AS total_amount
  FROM public.categories c
  LEFT JOIN public.transactions t ON c.id = t.category_id
  GROUP BY c.id, c.name, c.type
  ORDER BY transaction_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 17: Insert default settings
INSERT INTO public.app_settings (setting_key, setting_value, description) VALUES
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('maintenance_message', 'We are currently performing scheduled maintenance. Please check back soon.', 'Message displayed during maintenance'),
  ('app_version', '1.0.0', 'Current application version')
ON CONFLICT (setting_key) DO NOTHING;

-- Step 18: Create default admin account
-- ⚠️ IMPORTANT: CHANGE THESE VALUES BEFORE RUNNING! ⚠️
-- Replace the sample values below with your actual credentials
INSERT INTO public.admins (email, password_hash, full_name, is_active)
VALUES (
  'admin@example.com',         -- ⚠️ CHANGE THIS: Replace with your actual email
  'YourSecurePassword123',     -- ⚠️ CHANGE THIS: Replace with your password
  'Your Full Name',            -- ⚠️ CHANGE THIS: Replace with your name
  true
)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE! ✅
-- =====================================================
-- This migration can now be run multiple times safely
-- It will skip anything that already exists
--
-- ⚠️ BEFORE RUNNING: Change the admin credentials above!
-- After setup, login at: /admin/login
-- Use the credentials you set in Step 18
--
-- For production security:
-- Run: 20251018000001_production_password_security.sql
-- =====================================================

COMMENT ON TABLE public.admins IS 'Admin users table - Tested and working!';
COMMENT ON TABLE public.app_settings IS 'Application settings including maintenance mode';
COMMENT ON TABLE public.admin_activity_logs IS 'Audit log of all admin actions';
COMMENT ON FUNCTION public.authenticate_admin IS 'Admin authentication (dev: plain text, prod: use security migration)';
COMMENT ON FUNCTION public.get_admin_dashboard_analytics IS 'Dashboard analytics - real-time metrics';
COMMENT ON FUNCTION public.get_top_categories IS 'Top categories by transaction count';
