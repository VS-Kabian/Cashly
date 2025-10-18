import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Admin user type
interface Admin {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  last_login_at: string | null;
}

// Admin auth context type
interface AdminAuthContextType {
  admin: Admin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  logActivity: (actionType: string, description: string, metadata?: Record<string, any>) => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

/**
 * Admin Authentication Provider
 * Manages admin authentication state and provides admin-specific auth methods
 * Completely separate from regular user authentication
 */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing admin session on mount
  useEffect(() => {
    checkAdminSession();
  }, []);

  /**
   * Check if there's an existing admin session in localStorage
   */
  const checkAdminSession = async () => {
    try {
      const adminSession = localStorage.getItem('admin_session');
      if (adminSession) {
        const sessionData = JSON.parse(adminSession);

        // Verify session is still valid (check expiry)
        const expiryTime = new Date(sessionData.expiresAt).getTime();
        const currentTime = new Date().getTime();

        if (currentTime < expiryTime) {
          // Session is still valid, fetch fresh admin data
          const { data, error } = await supabase
            .from('admins')
            .select('id, email, full_name, is_active, last_login_at')
            .eq('id', sessionData.adminId)
            .eq('is_active', true)
            .single();

          if (!error && data) {
            setAdmin(data);
          } else {
            // Invalid session, clear it
            localStorage.removeItem('admin_session');
          }
        } else {
          // Session expired, clear it
          localStorage.removeItem('admin_session');
        }
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      localStorage.removeItem('admin_session');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Admin sign in with email and password
   * Uses custom admin authentication (separate from Supabase Auth)
   * Note: In production, use an Edge Function for password verification
   */
  const signIn = async (email: string, password: string) => {
    try {
      // For now, we'll use a simple RPC call for authentication
      // In production, you should implement proper password hashing with bcrypt
      const { data, error } = await supabase.rpc('authenticate_admin', {
        p_email: email,
        p_password: password,
      });

      if (error || !data) {
        console.error('Admin sign in error:', error);
        return { error: new Error('Invalid credentials. Please check your email and password.') };
      }

      // Parse the response
      const adminData = data as Admin;

      if (adminData && adminData.is_active) {
        // Store admin session in localStorage
        const sessionData = {
          adminId: adminData.id,
          email: adminData.email,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        };

        localStorage.setItem('admin_session', JSON.stringify(sessionData));
        setAdmin(adminData);

        // Update last login time
        await supabase
          .from('admins')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', adminData.id);

        // Log the login activity
        await logActivity('login', 'Admin logged in successfully');

        return { error: null };
      }

      return { error: new Error('Admin account is inactive') };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  };

  /**
   * Admin sign out
   */
  const signOut = async () => {
    try {
      // Log the logout activity before clearing session
      if (admin) {
        await logActivity('logout', 'Admin logged out');
      }

      // Clear admin session
      localStorage.removeItem('admin_session');
      setAdmin(null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear session even if logging fails
      localStorage.removeItem('admin_session');
      setAdmin(null);
    }
  };

  /**
   * Log admin activity
   */
  const logActivity = async (
    actionType: string,
    description: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!admin) return;

    try {
      await supabase.from('admin_activity_logs').insert({
        admin_id: admin.id,
        admin_email: admin.email,
        action_type: actionType,
        description,
        metadata,
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error, just log it
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        signIn,
        signOut,
        logActivity,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

/**
 * Hook to access admin authentication context
 */
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
