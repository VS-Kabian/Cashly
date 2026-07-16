import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertCircle, Search, RefreshCw, Filter } from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ActivityLog {
  id: string;
  admin_email: string;
  action_type: string;
  description: string;
  metadata: Json;
  created_at: string;
}

/**
 * Admin Activity Logs Page
 * Displays all admin actions with search and filter capabilities
 */
export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const fetchActivityLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        console.error('Error fetching activity logs:', fetchError);
        setError('Failed to load activity logs');
        return;
      }

      setLogs(data || []);
      setFilteredLogs(data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const filterLogs = useCallback(() => {
    let filtered = [...logs];

    // Apply action type filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter((log) => log.action_type === actionFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.admin_email.toLowerCase().includes(term) ||
          log.action_type.toLowerCase().includes(term) ||
          log.description.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
  }, [actionFilter, logs, searchTerm]);

  useEffect(() => {
    void fetchActivityLogs();
  }, [fetchActivityLogs]);

  useEffect(() => {
    filterLogs();
  }, [filterLogs]);

  const getActionBadgeColor = (actionType: string) => {
    const colorMap: Record<string, string> = {
      login: 'bg-green-900/50 text-green-300 border-green-800',
      logout: 'bg-gray-900/50 text-gray-300 border-gray-800',
      settings_update: 'bg-blue-900/50 text-blue-300 border-blue-800',
      user_action: 'bg-purple-900/50 text-purple-300 border-purple-800',
      delete: 'bg-red-900/50 text-red-300 border-red-800',
    };

    return colorMap[actionType] || 'bg-slate-900/50 text-slate-300 border-slate-800';
  };

  const uniqueActionTypes = Array.from(new Set(logs.map((log) => log.action_type)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Activity className="h-8 w-8 mr-3 text-purple-400" />
          Activity Logs
        </h1>
        <p className="text-slate-400">
          Track all admin actions and system events
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by email, action, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Action Type Filter */}
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing {filteredLogs.length} of {logs.length} logs
            </p>
            <Button
              onClick={fetchActivityLogs}
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <CardDescription className="text-slate-400">
            Latest admin actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full bg-slate-800" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400">
                {searchTerm || actionFilter !== 'all'
                  ? 'No logs match your filters'
                  : 'No activity logs found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">
                      Timestamp
                    </th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">
                      Admin
                    </th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">
                      Action Type
                    </th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-300 text-sm whitespace-nowrap">
                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                      </td>
                      <td className="py-3 px-4 text-white text-sm">
                        {log.admin_email}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={getActionBadgeColor(log.action_type)}
                        >
                          {log.action_type.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-sm">
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
