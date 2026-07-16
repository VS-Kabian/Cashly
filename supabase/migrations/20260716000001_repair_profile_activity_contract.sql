-- Forward-only repair for the administrator analytics activity metric.
-- The protected analytics RPC reads profiles.last_active_at, which must exist
-- for clean bootstraps and be initialized for both existing and new profiles.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

UPDATE public.profiles
SET last_active_at = COALESCE(last_active_at, updated_at, created_at, NOW())
WHERE last_active_at IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN last_active_at SET DEFAULT NOW(),
  ALTER COLUMN last_active_at SET NOT NULL;
