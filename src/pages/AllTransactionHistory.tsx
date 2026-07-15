import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  invalidateTransactionHistory,
  invalidateTransactionHistoryCategories,
  useTransactionHistory,
  useTransactionHistoryCategories,
  type TransactionHistoryTransaction,
} from '@/hooks/useTransactionHistory';
import { ArrowLeft, Search, Calendar, Filter, Edit } from 'lucide-react';
import { TransactionEditModal } from '@/components/TransactionEditModal';

export default function AllTransactionHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all-months');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [editingTransaction, setEditingTransaction] = useState<TransactionHistoryTransaction | null>(null);

  const filters = useMemo(() => ({
    searchTerm,
    selectedMonth,
    categoryId: selectedCategory,
    type: selectedType === 'all' ? null : selectedType,
  }), [searchTerm, selectedMonth, selectedCategory, selectedType]);
  const historyQuery = useTransactionHistory(user?.id, filters);
  const categoriesQuery = useTransactionHistoryCategories(user?.id);
  const transactions = historyQuery.data?.pages.flat() || [];
  const categories = categoriesQuery.data || [];
  const loading = historyQuery.isLoading || categoriesQuery.isLoading;

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transaction-history-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => { void invalidateTransactionHistory(queryClient, user.id); },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` },
        () => {
          void invalidateTransactionHistory(queryClient, user.id);
          void invalidateTransactionHistoryCategories(queryClient, user.id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);

  useEffect(() => {
    if (historyQuery.error || categoriesQuery.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load transaction data',
      });
    }
  }, [categoriesQuery.error, historyQuery.error, toast]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

  const groupTransactionsByDate = (items: TransactionHistoryTransaction[]) => {
    return items.reduce((groups, transaction) => {
      const date = new Date(transaction.transaction_date).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, TransactionHistoryTransaction[]>);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-dark">
        <div className="animate-pulse space-y-4 w-full max-w-md mx-auto p-4">
          <div className="h-8 bg-muted rounded" />
          <div className="space-y-2">
            {[...Array(6)].map((_, index) => <div key={index} className="h-16 bg-muted rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  const groupedTransactions = groupTransactionsByDate(transactions);
  const hasActiveFilters = Boolean(searchTerm.trim())
    || selectedMonth !== 'all-months'
    || selectedCategory !== 'all'
    || selectedType !== 'all';

  return (
    <div className="min-h-screen gradient-dark">
      <div className="glass-card rounded-none border-x-0 border-t-0 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center space-x-3 md:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] p-2"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">All Transactions</h1>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-12 h-12 text-base"
              aria-label="Search transactions"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="month"
                value={selectedMonth === 'all-months' ? '' : selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value || 'all-months')}
                className="h-12 pl-12 text-base"
                aria-label="Filter by month"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-12 text-base" aria-label="Filter by category">
                <Filter className="h-5 w-5 mr-2" />
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="all" className="h-12 text-base">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id} className="h-12 text-base">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{category.icon || '📄'}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as typeof selectedType)}>
              <SelectTrigger className="h-12 text-base" aria-label="Filter by type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="all" className="h-12 text-base">All types</SelectItem>
                <SelectItem value="income" className="h-12 text-base">Income</SelectItem>
                <SelectItem value="expense" className="h-12 text-base">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 md:p-6 space-y-3 md:space-y-6 pb-20">
        {historyQuery.isError || categoriesQuery.isError ? (
          <Card className="glass-card mx-2 md:mx-0">
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold text-foreground mb-2">Could not load transactions</h3>
              <Button onClick={() => { void historyQuery.refetch(); void categoriesQuery.refetch(); }}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : Object.keys(groupedTransactions).length === 0 ? (
          <Card className="glass-card mx-2 md:mx-0">
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No transactions found</h3>
              <p className="text-muted-foreground mb-6">
                {hasActiveFilters ? 'Try adjusting your filters to see more results' : 'Start tracking your finances to see your transaction history'}
              </p>
              <Link to="/add-transaction">
                <Button className="text-primary-foreground min-h-[44px] px-6 text-base">Add Your First Transaction</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
              <Card key={date} className="glass-card mx-2 md:mx-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg md:text-xl text-foreground">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </CardTitle>
                  <div className="text-sm md:text-base text-muted-foreground font-medium">
                    {dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
                  {dayTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 md:p-4 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/40 transition-colors cursor-pointer min-h-[72px]"
                      onClick={() => setEditingTransaction(transaction)}
                    >
                      <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="text-xl md:text-2xl leading-none">📄</span>
                          <div
                            className="w-3 h-3 md:w-4 md:h-4 rounded-full border border-white/20 flex-shrink-0"
                            style={{ backgroundColor: transaction.categories?.color || '#9ACD32' }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm md:text-base text-foreground truncate leading-tight">
                            {transaction.categories?.name || 'Uncategorized'}
                          </p>
                          <div className="flex items-center space-x-1 text-xs md:text-sm text-muted-foreground mt-0.5">
                            <span className="font-medium">
                              {new Date(transaction.transaction_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {transaction.payment_method && <><span>•</span><span className="capitalize font-medium truncate">{transaction.payment_method}</span></>}
                          </div>
                          {transaction.description && <p className="text-xs md:text-sm text-muted-foreground truncate mt-0.5">{transaction.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                        <div className="text-right">
                          <p className={`font-bold text-sm md:text-lg leading-tight ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-[44px] min-w-[44px] p-2 flex-shrink-0"
                          onClick={(event) => { event.stopPropagation(); setEditingTransaction(transaction); }}
                          aria-label={`Edit ${transaction.categories?.name || 'transaction'}`}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {historyQuery.hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => { void historyQuery.fetchNextPage(); }}
                  disabled={historyQuery.isFetchingNextPage}
                  aria-label="Load more transactions"
                >
                  {historyQuery.isFetchingNextPage ? 'Loading more...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          categories={categories}
          isOpen={Boolean(editingTransaction)}
          onClose={() => setEditingTransaction(null)}
          onSave={() => { if (user) void invalidateTransactionHistory(queryClient, user.id); }}
        />
      )}
    </div>
  );
}
