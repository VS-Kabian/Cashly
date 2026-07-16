-- Run only through `npm run test:integration`, which requires a disposable
-- local Supabase database. This test neither links to nor accepts a remote target.

BEGIN;

SELECT plan(5);

DO $$
DECLARE
  owner_user_id UUID := gen_random_uuid();
  other_user_id UUID := gen_random_uuid();
  owner_category_id UUID;
  other_category_id UUID;
  owner_budget_id UUID;
  test_month INTEGER := 1;
  test_year INTEGER := 2020;
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES
    (
      owner_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      format('cashly-financial-owner-%s@example.test', owner_user_id),
      '$2a$10$cashlyintegrationtestonly', now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      other_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      format('cashly-financial-other-%s@example.test', other_user_id),
      '$2a$10$cashlyintegrationtestonly', now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    );

  -- The signup trigger creates defaults in the normal local schema. Seed a
  -- fallback inside this transaction so the test also remains self-contained
  -- if that trigger is absent from a disposable local reset.
  SELECT category.id
    INTO owner_category_id
    FROM public.categories AS category
   WHERE category.user_id = owner_user_id
   ORDER BY category.id
   LIMIT 1;

  IF owner_category_id IS NULL THEN
    INSERT INTO public.categories (user_id, name, type, color)
    VALUES (owner_user_id, 'Local invariant owner', 'expense', '#EF4444')
    RETURNING id INTO owner_category_id;
  END IF;

  SELECT category.id
    INTO other_category_id
    FROM public.categories AS category
   WHERE category.user_id = other_user_id
   ORDER BY category.id
   LIMIT 1;

  IF other_category_id IS NULL THEN
    INSERT INTO public.categories (user_id, name, type, color)
    VALUES (other_user_id, 'Local invariant other', 'expense', '#F97316')
    RETURNING id INTO other_category_id;
  END IF;

  INSERT INTO public.transactions (user_id, amount, type, category_id, transaction_date)
  VALUES (owner_user_id, 1, 'expense', owner_category_id, now());

  INSERT INTO public.budgets (user_id, amount, month, year, category_id)
  VALUES (owner_user_id, 1, test_month, test_year, NULL)
  RETURNING id INTO owner_budget_id;

  PERFORM set_config('app.cashly_owner_user_id', owner_user_id::text, true);
  PERFORM set_config('app.cashly_other_user_id', other_user_id::text, true);
  PERFORM set_config('app.cashly_owner_category_id', owner_category_id::text, true);
  PERFORM set_config('app.cashly_owner_budget_id', owner_budget_id::text, true);
  PERFORM set_config('app.cashly_test_month', test_month::text, true);
  PERFORM set_config('app.cashly_test_year', test_year::text, true);
  PERFORM set_config('request.jwt.claim.sub', other_user_id::text, true);
END;
$$;

SELECT throws_ok(
  $$
    INSERT INTO public.transactions (user_id, amount, type, transaction_date)
    VALUES (current_setting('app.cashly_owner_user_id')::UUID, -1, 'expense', now())
  $$,
  '23514',
  NULL,
  'new negative transaction amounts are rejected'
);

SELECT throws_ok(
  $$
    INSERT INTO public.transactions (user_id, amount, type, category_id, transaction_date)
    VALUES (
      current_setting('app.cashly_other_user_id')::UUID,
      1,
      'expense',
      current_setting('app.cashly_owner_category_id')::UUID,
      now()
    )
  $$,
  '23514',
  'Transaction category must belong to the same user',
  'transactions cannot use another user''s category'
);

SELECT throws_ok(
  $$
    INSERT INTO public.budgets (user_id, amount, month, year, category_id)
    VALUES (
      current_setting('app.cashly_owner_user_id')::UUID,
      2,
      current_setting('app.cashly_test_month')::INTEGER,
      current_setting('app.cashly_test_year')::INTEGER,
      NULL
    )
  $$,
  '23505',
  NULL,
  'each user has at most one overall budget per month'
);

SELECT throws_ok(
  $$
    INSERT INTO public.budget_alerts (user_id, budget_id, alert_type, message)
    VALUES (
      current_setting('app.cashly_other_user_id')::UUID,
      current_setting('app.cashly_owner_budget_id')::UUID,
      'approaching',
      'local invariant check'
    )
  $$,
  '23514',
  'Budget alert must belong to the same user as its budget',
  'budget alerts cannot use another user''s budget'
);

-- Execute a real browser-role read as the second user. RLS must hide the
-- transaction owned by the first disposable user.
SET LOCAL ROLE authenticated;

SELECT is(
  (
    SELECT count(*)
    FROM public.transactions
    WHERE user_id = current_setting('app.cashly_owner_user_id')::UUID
  ),
  0::BIGINT,
  'RLS hides another user''s transactions from an authenticated user'
);

SELECT * FROM finish();

ROLLBACK;
