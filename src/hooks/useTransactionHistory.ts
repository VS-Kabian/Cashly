import { useInfiniteQuery, useQuery, type QueryClient } from '@tanstack/react-query';
import {
  fetchTransactionHistoryCategories,
  fetchTransactionHistoryPage,
} from '@/features/transactions/transactionRepository';
import { sanitizeTransactionSearchTerm } from '@/features/transactions/transactionSearch';

export const TRANSACTION_HISTORY_PAGE_SIZE = 50;

export interface TransactionHistoryFilters {
  searchTerm?: string;
  selectedMonth?: string;
  categoryId?: string;
  type?: 'income' | 'expense' | null;
}

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

interface NormalizedFilters {
  searchTerm: string | null;
  selectedMonth: string | null;
  categoryId: string | null;
  type: 'income' | 'expense' | null;
}

const normalizeFilters = (filters: TransactionHistoryFilters): NormalizedFilters => ({
  searchTerm: filters.searchTerm
    ? sanitizeTransactionSearchTerm(filters.searchTerm).toLowerCase() || null
    : null,
  selectedMonth: filters.selectedMonth && filters.selectedMonth !== 'all-months'
    ? filters.selectedMonth
    : null,
  categoryId: filters.categoryId && filters.categoryId !== 'all' ? filters.categoryId : null,
  type: filters.type || null,
});

const getMonthRange = (selectedMonth: string | null) => {
  if (!selectedMonth || !/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth)) {
    return null;
  }

  const [year, month] = selectedMonth.split('-').map(Number);
  return {
    start: new Date(year, month - 1, 1).toISOString(),
    endExclusive: new Date(year, month, 1).toISOString(),
  };
};

export const buildTransactionHistoryQueryPlan = (
  userId: string,
  filters: TransactionHistoryFilters,
  pageIndex: number,
) => {
  const normalizedFilters = normalizeFilters(filters);
  const safePageIndex = Math.max(0, pageIndex);
  const from = safePageIndex * TRANSACTION_HISTORY_PAGE_SIZE;

  return {
    filters: normalizedFilters,
    monthRange: getMonthRange(normalizedFilters.selectedMonth),
    queryKey: ['transaction-history', userId, normalizedFilters] as const,
    range: {
      from,
      to: from + TRANSACTION_HISTORY_PAGE_SIZE - 1,
    },
  };
};

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
