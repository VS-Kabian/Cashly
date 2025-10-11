import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Loader2 } from 'lucide-react';

function Header() {
  return (
    <header className="bg-background border-b border-border">
      <div className="flex items-center py-3 px-4">
        <img
          src="https://ik.imagekit.io/Boltmemo/Money%20Manager?updatedAt=1758465083117"
          alt="BoltCash Logo"
          className="h-10 w-auto ml-5"
        />
        <h1 className="text-xl font-bold text-foreground ml-3">BoltCash</h1>
      </div>
    </header>
  );
}

export default function Layout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && location.pathname !== '/auth') {
    return <Navigate to="/auth" replace />;
  }

  if (user && location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {user && <Header />}
      <main className="pb-20">
        <Outlet />
      </main>
      {user && <BottomNavigation />}
    </div>
  );
}