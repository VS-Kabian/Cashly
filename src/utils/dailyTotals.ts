// Utility functions for computing daily and monthly totals
import { toLocalDateKey } from './dateRanges';

export interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  transaction_date: string;
}

export function computeDailyTotals(transactions: Transaction[], date: string = toLocalDateKey(new Date())) {
  const dayTransactions = transactions.filter(transaction => 
    toLocalDateKey(new Date(transaction.transaction_date)) === date
  );
  
  const dailyIncome = dayTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const dailyExpenses = dayTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return { dailyIncome, dailyExpenses };
}

export function computeMonthlyTotals(transactions: Transaction[], month?: number, year?: number) {
  const currentMonth = month ?? new Date().getMonth();
  const currentYear = year ?? new Date().getFullYear();
  
  const monthlyData = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.transaction_date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyData
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const monthlyExpenses = monthlyData
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return { monthlyIncome, monthlyExpenses };
}

export function formatCurrencyForScreen(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}
