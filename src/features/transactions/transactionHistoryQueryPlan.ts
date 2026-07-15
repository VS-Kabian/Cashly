export const TRANSACTION_HISTORY_PAGE_SIZE = 50;

export interface TransactionHistoryFilters {
  searchTerm?: string;
  selectedMonth?: string;
  categoryId?: string;
  type?: 'income' | 'expense' | null;
}

export interface NormalizedTransactionHistoryFilters {
  searchTerm: string | null;
  selectedMonth: string | null;
  categoryId: string | null;
  type: 'income' | 'expense' | null;
}

export const normalizeTransactionHistoryFilters = (
  filters: TransactionHistoryFilters,
): NormalizedTransactionHistoryFilters => ({
  searchTerm: filters.searchTerm
    ? filters.searchTerm
      .normalize('NFKC')
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .replace(/\s+/gu, ' ')
      .trim()
      .toLowerCase() || null
    : null,
  selectedMonth: filters.selectedMonth && filters.selectedMonth !== 'all-months'
    ? filters.selectedMonth
    : null,
  categoryId: filters.categoryId && filters.categoryId !== 'all' ? filters.categoryId : null,
  type: filters.type || null,
});

export const getTransactionHistoryMonthRange = (selectedMonth: string | null) => {
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
  const normalizedFilters = normalizeTransactionHistoryFilters(filters);
  const safePageIndex = Math.max(0, pageIndex);
  const from = safePageIndex * TRANSACTION_HISTORY_PAGE_SIZE;

  return {
    filters: normalizedFilters,
    monthRange: getTransactionHistoryMonthRange(normalizedFilters.selectedMonth),
    queryKey: ['transaction-history', userId, normalizedFilters] as const,
    range: {
      from,
      to: from + TRANSACTION_HISTORY_PAGE_SIZE - 1,
    },
  };
};
