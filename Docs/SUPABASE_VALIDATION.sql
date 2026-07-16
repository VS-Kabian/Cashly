-- Run this file in the selected Supabase project's SQL Editor after the
-- deployment runbook. It is intentionally read-only.

BEGIN TRANSACTION READ ONLY;

-- Required application tables must all resolve in this project.
SELECT expected_table,
       to_regclass(expected_table) IS NOT NULL AS exists_in_selected_project
FROM unnest(ARRAY[
  'public.profiles',
  'public.categories',
  'public.transactions',
  'public.budgets',
  'public.budget_alerts',
  'public.admins',
  'public.app_settings',
  'public.admin_activity_logs'
]) AS expected_table;

-- Row Level Security must be enabled for tenant and privileged tables.
SELECT namespace.nspname AS schema_name,
       relation.relname AS table_name,
       relation.relrowsecurity AS row_level_security_enabled,
       relation.relforcerowsecurity AS row_level_security_forced
FROM pg_class AS relation
JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
WHERE namespace.nspname = 'public'
  AND relation.relname IN (
    'profiles', 'categories', 'transactions', 'budgets', 'budget_alerts',
    'admins', 'app_settings', 'admin_activity_logs'
  )
ORDER BY relation.relname;

-- Inspect the exact policy roles and predicates installed in this project.
SELECT schemaname,
       tablename,
       policyname,
       roles,
       cmd,
       qual,
       with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'categories', 'transactions', 'budgets', 'budget_alerts',
    'admins', 'app_settings', 'admin_activity_logs'
  )
ORDER BY tablename, policyname;

-- Browser-facing anonymous callers must not execute privileged routines.
SELECT routine.proname AS routine_name,
       pg_get_function_identity_arguments(routine.oid) AS arguments,
       has_function_privilege('anon', routine.oid, 'EXECUTE') AS anon_can_execute,
       has_function_privilege('authenticated', routine.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc AS routine
JOIN pg_namespace AS namespace ON namespace.oid = routine.pronamespace
WHERE namespace.nspname = 'public'
  AND routine.proname IN (
    'authenticate_admin',
    'create_admin',
    'update_admin_password',
    'reset_admin_password',
    'log_admin_activity',
    'get_admin_dashboard_analytics',
    'get_top_categories'
  )
ORDER BY routine.proname, arguments;

-- Every active administrator must be linked to a Supabase Auth identity.
SELECT id,
       email,
       user_id,
       is_active,
       user_id IS NOT NULL AS linked_to_auth_user
FROM public.admins
ORDER BY created_at;

-- Confirm the additive financial constraints and indexes are present.
SELECT conrelid::regclass AS table_name,
       conname,
       contype,
       convalidated
FROM pg_constraint
WHERE conname IN (
  'transactions_amount_positive',
  'budgets_user_id_fkey',
  'budgets_amount_positive',
  'budget_alerts_user_id_fkey',
  'categories_name_not_blank'
)
ORDER BY table_name::text, conname;

SELECT schemaname,
       tablename,
       indexname,
       indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'budgets_one_overall_per_user_month_idx',
    'categories_user_name_idx',
    'transactions_user_transaction_date_idx',
    'transactions_category_id_idx',
    'budgets_category_id_idx',
    'budget_alerts_budget_id_idx'
  )
ORDER BY indexname;

ROLLBACK;
