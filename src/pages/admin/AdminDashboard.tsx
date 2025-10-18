import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  ArrowUpDown,
  TrendingUp,
  Calendar,
  DollarSign,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Types
interface DashboardAnalytics {
  total_users: number;
  total_transactions: number;
  daily_active_users: number;
  monthly_active_users: number;
  total_income: number;
  total_expense: number;
  avg_transaction_value: number;
}

interface TopCategory {
  category_name: string;
  category_type: string;
  transaction_count: number;
  total_amount: number;
}

/**
 * Stat Card Component
 * Displays a single metric with icon and value
 */
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-200">{title}</CardTitle>
        <Icon className="h-4 w-4 text-purple-400" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24 bg-slate-800" />
        ) : (
          <>
            <div className="text-2xl font-bold text-white">{value}</div>
            {description && (
              <p className="text-xs text-slate-400 mt-1">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Admin Dashboard Page
 * Displays key metrics and analytics for the application
 */
export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_admin_dashboard_analytics');

      if (analyticsError) {
        console.error('Analytics error:', analyticsError);
        setError('Failed to load analytics data');
        return;
      }

      setAnalytics(analyticsData);

      // Fetch top categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .rpc('get_top_categories', { p_limit: 5 });

      if (categoriesError) {
        console.error('Categories error:', categoriesError);
      } else {
        setTopCategories(categoriesData || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">
          Overview of your BoltCash application metrics and analytics
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={analytics?.total_users || 0}
          description="Registered users"
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Total Transactions"
          value={analytics?.total_transactions || 0}
          description="All time transactions"
          icon={ArrowUpDown}
          loading={loading}
        />
        <StatCard
          title="Daily Active Users"
          value={analytics?.daily_active_users || 0}
          description="Last 24 hours"
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title="Monthly Active Users"
          value={analytics?.monthly_active_users || 0}
          description="Last 30 days"
          icon={Calendar}
          loading={loading}
        />
      </div>

      {/* Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Income"
          value={formatCurrency(analytics?.total_income || 0)}
          description="All time income"
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          title="Total Expense"
          value={formatCurrency(analytics?.total_expense || 0)}
          description="All time expenses"
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          title="Avg Transaction"
          value={formatCurrency(analytics?.avg_transaction_value || 0)}
          description="Average value"
          icon={DollarSign}
          loading={loading}
        />
      </div>

      {/* Top Categories Chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Tag className="h-5 w-5 mr-2 text-purple-400" />
            Top 5 Categories
          </CardTitle>
          <CardDescription className="text-slate-400">
            Most used transaction categories by count
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full bg-slate-800" />
          ) : topCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCategories}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="category_name"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'transaction_count') return [value, 'Transactions'];
                    if (name === 'total_amount') return [formatCurrency(value), 'Total Amount'];
                    return [value, name];
                  }}
                />
                <Bar
                  dataKey="transaction_count"
                  fill="#a855f7"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No category data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories Table */}
      {!loading && topCategories.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Category Details</CardTitle>
            <CardDescription className="text-slate-400">
              Breakdown of top categories by usage and amount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">
                      Type
                    </th>
                    <th className="text-right py-3 px-4 text-slate-300 font-medium">
                      Transactions
                    </th>
                    <th className="text-right py-3 px-4 text-slate-300 font-medium">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topCategories.map((category, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="py-3 px-4 text-white font-medium">
                        {category.category_name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            category.category_type === 'income'
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-red-900/50 text-red-300'
                          }`}
                        >
                          {category.category_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {category.transaction_count}
                      </td>
                      <td className="py-3 px-4 text-right text-white font-medium">
                        {formatCurrency(Number(category.total_amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
