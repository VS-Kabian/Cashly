-- =====================================================
-- PRODUCTION PASSWORD SECURITY UPGRADE
-- Description: Upgrades admin authentication to use
--              proper bcrypt password hashing
-- =====================================================
-- NOTE: Run this migration AFTER initial setup when
--       moving to production
-- =====================================================

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1. UPDATE AUTHENTICATE ADMIN FUNCTION
-- =====================================================
-- Replace the development version with production-ready password verification
CREATE OR REPLACE FUNCTION public.authenticate_admin(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_admin RECORD;
  v_result JSON;
BEGIN
  -- Find admin by email with bcrypt password verification
  SELECT id, email, full_name, is_active, last_login_at
  INTO v_admin
  FROM public.admins
  WHERE email = p_email
    AND password_hash = crypt(p_password, password_hash)  -- bcrypt verification
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

-- =====================================================
-- 2. CREATE FUNCTION TO UPDATE ADMIN PASSWORD
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_admin_password(
  p_admin_id UUID,
  p_old_password TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_exists BOOLEAN;
BEGIN
  -- Verify old password is correct
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = p_admin_id
      AND password_hash = crypt(p_old_password, password_hash)
      AND is_active = true
  ) INTO v_admin_exists;

  IF NOT v_admin_exists THEN
    RETURN FALSE;
  END IF;

  -- Update password with new hash
  UPDATE public.admins
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = p_admin_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 3. CREATE FUNCTION TO ADD NEW ADMIN
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_admin(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT
)
RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  INSERT INTO public.admins (email, password_hash, full_name, is_active)
  VALUES (
    p_email,
    crypt(p_password, gen_salt('bf')),  -- bcrypt hash
    p_full_name,
    true
  )
  RETURNING id INTO v_admin_id;

  RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 4. MIGRATE EXISTING PLAIN TEXT PASSWORDS
-- =====================================================
-- WARNING: This will hash all existing passwords
-- Make sure you know the current passwords before running!

-- Example: Update default admin password to use bcrypt
-- ⚠️ CHANGE EMAIL AND PASSWORD: Replace with your actual credentials
-- Uncomment and modify before running:

-- UPDATE public.admins
-- SET password_hash = crypt('YourNewSecurePassword', gen_salt('bf'))
-- WHERE email = 'admin@example.com';  -- ⚠️ Change to your email

-- =====================================================
-- 5. CREATE ADMIN PASSWORD RESET FUNCTION
-- =====================================================
-- For emergency password resets (use with caution!)
CREATE OR REPLACE FUNCTION public.reset_admin_password(
  p_admin_email TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.admins
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE email = p_admin_email
    AND is_active = true;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Create a new admin:
-- ⚠️ CHANGE THESE: Replace with your actual values
-- SELECT public.create_admin(
--   'your-email@example.com',        -- ⚠️ Your email
--   'YourSecurePassword123!',         -- ⚠️ Your password
--   'Your Full Name'                  -- ⚠️ Your name
-- );

-- Update admin password:
-- ⚠️ CHANGE THESE: Replace with your actual values
-- SELECT public.update_admin_password(
--   'your-admin-uuid-here',           -- ⚠️ Your admin ID
--   'YourOldPassword',                -- ⚠️ Current password
--   'YourNewPassword123!'             -- ⚠️ New password
-- );

-- Emergency password reset:
-- ⚠️ CHANGE THESE: Replace with your actual values
-- SELECT public.reset_admin_password(
--   'your-email@example.com',         -- ⚠️ Your email
--   'YourNewSecurePassword123!'       -- ⚠️ New password
-- );

-- =====================================================
-- END OF MIGRATION
-- =====================================================

COMMENT ON FUNCTION public.authenticate_admin IS 'Production-ready admin authentication with bcrypt';
COMMENT ON FUNCTION public.create_admin IS 'Creates new admin with hashed password';
COMMENT ON FUNCTION public.update_admin_password IS 'Allows admin to change their own password';
COMMENT ON FUNCTION public.reset_admin_password IS 'Emergency password reset function';
