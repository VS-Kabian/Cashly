import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, Shield, Settings, Activity, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Header component for admin dashboard
 */
function AdminHeader() {
  const { admin, signOut } = useAdminAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
    { path: '/admin/activity-logs', label: 'Activity Logs', icon: Activity },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 shadow-lg">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-purple-400" />
              <h1 className="text-xl font-bold text-white">BoltCash Admin</h1>
            </div>

            <nav className="hidden md:flex items-center space-x-1 ml-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm font-medium text-white">{admin?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex md:hidden items-center space-x-1 mt-4 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

/**
 * Admin Layout Component
 * Protects admin routes and provides consistent layout
 * Ensures only authenticated admins can access admin pages
 */
export default function AdminLayout() {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // Redirect to admin login if not authenticated
  if (!admin && location.pathname !== '/admin/login') {
    return <Navigate to="/admin/login" replace />;
  }

  // Redirect to dashboard if already authenticated and on login page
  if (admin && location.pathname === '/admin/login') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {admin && <AdminHeader />}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
