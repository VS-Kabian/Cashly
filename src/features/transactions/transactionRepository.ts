import { supabase } from '@/integrations/supabase/client';
import { buildSafeTransactionSearchExpression, sanitizeTransactionSearchTerm } from './transactionSearch';

export interface TransactionHistoryRepositoryFilters {
  searchTerm: string | null;
  categoryId: string | null;
  type: 'income' | 'expense' | null;
}

export interface TransactionHistoryRepositoryPlan {
  filters: TransactionHistoryRepositoryFilters;
  monthRange: { start: string; endExclusive: string } | null;
  range: { from: number; to: number };
}

export interface TransactionHistoryRepositoryTransaction {
  id: string;
  amount: number;
  category_id: string | null;
  type: 'income' | 'expense';
  transaction_date: string;
  description: string | null;
  payment_method: string | null;
  categories: { name: string; color: string | null } | null;
}

export interface TransactionHistoryRepositoryCategory {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  type: 'income' | 'expense';
}

const transactionSelect = `
  id,
  amount,
  category_id,
  type,
  transaction_date,
  description,
  payment_method,
  categories (name, color)
`;

export const fetchTransactionHistoryPage = async (
  userId: string,
  plan: TransactionHistoryRepositoryPlan,
) => {
  let matchingCategoryIds: string[] = [];

  if (plan.filters.searchTerm) {
    const safeSearchTerm = sanitizeTransactionSearchTerm(plan.filters.searchTerm);
    if (safeSearchTerm) {
      const { data: matchingCategories, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', `%${safeSearchTerm}%`);

      if (categoryError) throw categoryError;
      matchingCategoryIds = (matchingCategories || []).map((category) => category.id);
    }
  }

  let query = supabase
    .from('transactions')
    .select(transactionSelect)
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .order('id', { ascending: false })
    .range(plan.range.from, plan.range.to);

  if (plan.filters.categoryId) query = query.eq('category_id', plan.filters.categoryId);
  if (plan.filters.type) query = query.eq('type', plan.filters.type);
  if (plan.monthRange) {
    query = query
      .gte('transaction_date', plan.monthRange.start)
      .lt('transaction_date', plan.monthRange.endExclusive);
  }

  if (plan.filters.searchTerm) {
    const expression = buildSafeTransactionSearchExpression(
      plan.filters.searchTerm,
      matchingCategoryIds,
    );
    if (expression) query = query.or(expression);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []) as unknown as TransactionHistoryRepositoryTransaction[];
};

export const fetchTransactionHistoryCategories = async (userId: string) => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, color, icon, type')
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;
  return (data || []) as unknown as TransactionHistoryRepositoryCategory[];
};
