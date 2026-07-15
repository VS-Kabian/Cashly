-- Phase 3: protect new financial writes without rewriting historical records.
BEGIN;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0) NOT VALID;

ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID,
  ADD CONSTRAINT budgets_amount_positive CHECK (amount > 0) NOT VALID;

ALTER TABLE public.budget_alerts
  ADD CONSTRAINT budget_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_name_not_blank CHECK (btrim(name) <> '') NOT VALID;

-- A nullable category_id makes the original four-column UNIQUE constraint allow
-- multiple overall budgets. Reject that ambiguous state instead of choosing a
-- historical amount automatically.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.budgets
    WHERE category_id IS NULL
    GROUP BY user_id, month, year
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Resolve duplicate overall budgets before applying financial integrity hardening';
  END IF;
END;
$$;

CREATE UNIQUE INDEX budgets_one_overall_per_user_month_idx
  ON public.budgets (user_id, month, year)
  WHERE category_id IS NULL;

CREATE INDEX IF NOT EXISTS categories_user_name_idx
  ON public.categories (user_id, name);

CREATE INDEX IF NOT EXISTS transactions_user_transaction_date_idx
  ON public.transactions (user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS transactions_category_id_idx
  ON public.transactions (category_id);

CREATE INDEX IF NOT EXISTS budgets_category_id_idx
  ON public.budgets (category_id);

CREATE INDEX IF NOT EXISTS budget_alerts_budget_id_idx
  ON public.budget_alerts (budget_id);

-- Enforce same-user relationships that a single-column foreign key cannot express.
CREATE OR REPLACE FUNCTION private.enforce_transaction_category_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.category_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.categories AS category
      WHERE category.id = NEW.category_id
        AND category.user_id = NEW.user_id
    ) THEN
    RAISE EXCEPTION 'Transaction category must belong to the same user'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.enforce_budget_category_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.category_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.categories AS category
      WHERE category.id = NEW.category_id
        AND category.user_id = NEW.user_id
    ) THEN
    RAISE EXCEPTION 'Budget category must belong to the same user'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.enforce_budget_alert_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.budget_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.budgets AS budget
      WHERE budget.id = NEW.budget_id
        AND budget.user_id = NEW.user_id
    ) THEN
    RAISE EXCEPTION 'Budget alert must belong to the same user as its budget'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_transaction_category_owner() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.enforce_budget_category_owner() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.enforce_budget_alert_owner() FROM PUBLIC;

DROP TRIGGER IF EXISTS enforce_transaction_category_owner ON public.transactions;
CREATE TRIGGER enforce_transaction_category_owner
  BEFORE INSERT OR UPDATE OF user_id, category_id ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_transaction_category_owner();

DROP TRIGGER IF EXISTS enforce_budget_category_owner ON public.budgets;
CREATE TRIGGER enforce_budget_category_owner
  BEFORE INSERT OR UPDATE OF user_id, category_id ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_budget_category_owner();

DROP TRIGGER IF EXISTS enforce_budget_alert_owner ON public.budget_alerts;
CREATE TRIGGER enforce_budget_alert_owner
  BEFORE INSERT OR UPDATE OF user_id, budget_id ON public.budget_alerts
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_budget_alert_owner();

-- Replace legacy policies so ownership is explicit for both existing and new rows.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can create their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can view their own budget alerts" ON public.budget_alerts;
DROP POLICY IF EXISTS "Users can create their own budget alerts" ON public.budget_alerts;
DROP POLICY IF EXISTS "Users can update their own budget alerts" ON public.budget_alerts;

CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can manage their own categories"
ON public.categories FOR ALL TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can manage their own transactions"
ON public.transactions FOR ALL TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can manage their own budgets"
ON public.budgets FOR ALL TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can view their own budget alerts"
ON public.budget_alerts FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can create their own budget alerts"
ON public.budget_alerts FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can update their own budget alerts"
ON public.budget_alerts FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.budget_alerts TO authenticated;

COMMIT;
