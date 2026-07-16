-- Auth-first administrator and maintenance-mode tables.
-- This migration creates no default administrator and stores no
-- application-managed administrator password. Create administrators in
-- Supabase Auth, then link them using the documented SQL Editor command.

-- Retire the old custom-password boundary when upgrading an existing project.
DROP FUNCTION IF EXISTS public.authenticate_admin(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_admin(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_admin_password(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.reset_admin_password(TEXT, TEXT);

CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.admins
  DROP COLUMN IF EXISTS password_hash;

CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admins FROM anon, authenticated;
REVOKE ALL ON TABLE public.app_settings FROM anon, authenticated;
REVOKE ALL ON TABLE public.admin_activity_logs FROM anon, authenticated;

INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES
  ('maintenance_mode', 'false', 'Whether regular user routes display the maintenance screen'),
  ('maintenance_message', 'We are currently performing maintenance. Please check back soon.', 'Public maintenance message'),
  ('app_version', '1.0.0', 'Public application version')
ON CONFLICT (setting_key) DO NOTHING;

DO $$
BEGIN
  IF to_regprocedure('public.update_updated_at_column()') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;
    CREATE TRIGGER update_admins_updated_at
      BEFORE UPDATE ON public.admins
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
    CREATE TRIGGER update_app_settings_updated_at
      BEFORE UPDATE ON public.app_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END;
$$;
