import { useInfiniteQuery, useQuery, type QueryClient } from '@tanstack/react-query';
import {
  fetchTransactionHistoryCategories,
  fetchTransactionHistoryPage,
} from '@/features/transactions/transactionRepository';
import {
  buildTransactionHistoryQueryPlan,
  TRANSACTION_HISTORY_PAGE_SIZE,
  type TransactionHistoryFilters,
} from '@/features/transactions/transactionHistoryQueryPlan';

export {
  buildTransactionHistoryQueryPlan,
  getTransactionHistoryMonthRange,
  normalizeTransactionHistoryFilters,
  TRANSACTION_HISTORY_PAGE_SIZE,
  type TransactionHistoryFilters,
} from '@/features/transactions/transactionHistoryQueryPlan';

export interface TransactionHistoryTransaction {
  id: string;
  amount: number;
  category_id: string | null;
  type: 'income' | 'expense';
  transaction_date: string;
  description: string | null;
  payment_method: string | null;
  categories: { name: string; color: string | null } | null;
}

export interface TransactionHistoryCategory {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  type: 'income' | 'expense';
}

export const transactionHistoryCategoriesQueryKey = (userId: string) =>
  ['transaction-history-categories', userId] as const;

export const invalidateTransactionHistory = (queryClient: QueryClient, userId: string) =>
  queryClient.invalidateQueries({ queryKey: ['transaction-history', userId] });

export const invalidateTransactionHistoryCategories = (queryClient: QueryClient, userId: string) =>
  queryClient.invalidateQueries({ queryKey: transactionHistoryCategoriesQueryKey(userId) });

export const useTransactionHistory = (userId: string | undefined, filters: TransactionHistoryFilters) => {
  const initialPlan = buildTransactionHistoryQueryPlan(userId || '', filters, 0);

  return useInfiniteQuery({
    queryKey: initialPlan.queryKey,
    enabled: Boolean(userId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!userId) {
        return [] as TransactionHistoryTransaction[];
      }

      const plan = buildTransactionHistoryQueryPlan(userId, filters, pageParam);
      return fetchTransactionHistoryPage(userId, plan);
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === TRANSACTION_HISTORY_PAGE_SIZE ? allPages.length : undefined,
  });
};

export const useTransactionHistoryCategories = (userId: string | undefined) => {
  return useQuery({
    queryKey: transactionHistoryCategoriesQueryKey(userId || ''),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [] as TransactionHistoryCategory[];

      return fetchTransactionHistoryCategories(userId);
    },
  });
};
