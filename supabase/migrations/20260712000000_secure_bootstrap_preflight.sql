-- Verify that the core Cashly schema exists before installing privileged tables.
-- Run after the base and budgets migrations. This migration is intentionally
-- non-destructive and provides an actionable error for incomplete deployments.

DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    missing_tables := array_append(missing_tables, 'public.profiles');
  END IF;

  IF to_regclass('public.categories') IS NULL THEN
    missing_tables := array_append(missing_tables, 'public.categories');
  END IF;

  IF to_regclass('public.transactions') IS NULL THEN
    missing_tables := array_append(missing_tables, 'public.transactions');
  END IF;

  IF to_regclass('public.budgets') IS NULL THEN
    missing_tables := array_append(missing_tables, 'public.budgets');
  END IF;

  IF to_regclass('public.budget_alerts') IS NULL THEN
    missing_tables := array_append(missing_tables, 'public.budget_alerts');
  END IF;

  IF cardinality(missing_tables) > 0 THEN
    RAISE EXCEPTION
      'Cashly core schema is incomplete: %. Apply the 20250906124330 and 20250911035754 migrations to this same Supabase project before continuing.',
      array_to_string(missing_tables, ', ')
      USING ERRCODE = '55000';
  END IF;
END;
$$;
