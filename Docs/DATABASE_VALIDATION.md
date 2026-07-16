# Database validation guide

## Scope and access boundary

The SQL in this guide is read-only. Run it only in the intended Supabase project's SQL Editor or through a CLI that the project owner has explicitly linked and authenticated. This checkout is not linked to a live project, so applying migrations, changing data, or connecting a service-role key remains an operator action.

Do not add a service-role key to the browser application or use one for ordinary user-flow testing. Validate RLS using two disposable authenticated test users with the normal client credentials.

## Preflight before applying migrations

Confirm the target project and check migration history:

```sql
select version, name
from supabase_migrations.schema_migrations
where version in ('20260714000000', '20260714000001')
order by version;
```

The Phase 3 migration intentionally stops when more than one overall budget exists for the same user/month/year. Review and resolve those records deliberately before running it; do not let a migration choose or delete financial data.

```sql
select user_id, year, month, count(*) as overall_budget_count
from public.budgets
where category_id is null
group by user_id, year, month
having count(*) > 1
order by year, month, user_id;
```

Also inspect data that would violate the new relationships or constraints. The Phase 3 constraints are added `NOT VALID`, so old rows are not rewritten automatically; all future writes are still protected.

```sql
select 'non_positive_transactions' as check_name, count(*) as row_count
from public.transactions where amount <= 0
union all
select 'non_positive_budgets', count(*)
from public.budgets where amount <= 0
union all
select 'blank_categories', count(*)
from public.categories where btrim(name) = '';
```

## Validate Phase 1 administration hardening

After creating the administrator in Supabase Auth and applying the Phase 1 migration, verify that each active administrator is linked to an Auth identity and that legacy password RPCs do not have browser-facing execution privileges.

```sql
select id, email, user_id, is_active
from public.admins
order by created_at;

select routine_schema, routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'authenticate_admin', 'create_admin', 'update_admin_password',
    'reset_admin_password', 'log_admin_activity',
    'get_admin_dashboard_analytics', 'get_top_categories'
  )
order by routine_name, grantee;
```

Expected result: legacy password routines have no `anon`, `authenticated`, or `PUBLIC` execute grant; the three current admin routines are granted only to `authenticated` and reject non-admin callers internally. Use a normal authenticated non-admin user to confirm the admin dashboard RPCs return an authorization error, then an Auth-linked active admin to confirm the intended flow works.

## Validate Phase 3 financial integrity

Confirm the expected constraints, triggers, indexes, policies, and grants exist:

```sql
select conrelid::regclass as table_name, conname, convalidated
from pg_constraint
where conname in (
  'transactions_amount_positive', 'budgets_amount_positive',
  'budgets_user_id_fkey', 'budget_alerts_user_id_fkey',
  'categories_name_not_blank'
)
order by table_name::text, conname;

select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'budgets_one_overall_per_user_month_idx', 'categories_user_name_idx',
    'transactions_user_transaction_date_idx', 'transactions_category_id_idx',
    'budgets_category_id_idx', 'budget_alerts_budget_id_idx'
  )
order by tablename, indexname;

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'categories', 'transactions', 'budgets', 'budget_alerts')
order by tablename, policyname;

select trigger_name, event_object_table, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name in (
    'enforce_transaction_category_owner',
    'enforce_budget_category_owner',
    'enforce_budget_alert_owner'
  )
order by event_object_table, trigger_name;
```

Expected result: the three ownership triggers are present, policies target `authenticated` and compare `auth.uid()` to `user_id`, and all listed indexes are present. `convalidated = false` is expected immediately after this additive migration; validate or clean legacy rows through an approved data-migration process before changing that state.

## RLS and write-path smoke checks

For a stronger database check, use the local-only harness in `Docs/LOCAL_SUPABASE_TESTING.md`. It starts and resets a disposable local Supabase stack, creates its own disposable Auth users, and runs `supabase/tests/financial_invariants.sql` inside a rollback-only transaction. Do not run it as a substitute for the production read-only checks in `SUPABASE_VALIDATION.sql`.

With User A and User B, each using their own normal Supabase Auth session:

1. User A creates a category, transaction, budget, and budget alert.
2. User B must not be able to select, update, or delete User A's rows.
3. User B must not be able to submit a transaction or budget that references User A's category, nor an alert that references User A's budget.
4. Each user must receive a database rejection for zero/negative transaction or budget amounts and blank category names.
5. User A updates the same overall budget twice; exactly one `(user_id, year, month, category_id is null)` record must remain.

Record the test users, project reference, migration versions, and results in the deployment change record. Remove disposable test data only through an approved, scoped operator process.
