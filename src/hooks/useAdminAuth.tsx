import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { AdminAuthContext, type Admin } from './admin-auth-context';

async function getActiveAdmin(userId: string): Promise<Admin | null> {
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, full_name, is_active, last_login_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error resolving administrator access:', error);
    return null;
  }

  return data;
}

async function recordActivity(
  actionType: string,
  description: string,
  metadata: Record<string, Json | undefined> = {},
) {
  const { error } = await supabase.rpc('log_admin_activity', {
    p_action_type: actionType,
    p_description: description,
    p_metadata: metadata,
  });

  if (error) {
    console.error('Error logging admin activity:', error);
  }
}

/**
 * Resolves administrator access from a real Supabase Auth session. The
 * database policy, rather than browser storage, decides whether the user is
 * an active administrator.
 */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const resolveAdmin = async (userId?: string) => {
      let resolvedUserId = userId;

      if (!resolvedUserId) {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          if (active) {
            setAdmin(null);
            setLoading(false);
          }
          return;
        }
        resolvedUserId = data.user.id;
      }

      const nextAdmin = await getActiveAdmin(resolvedUserId);
      if (active) {
        setAdmin(nextAdmin);
        setLoading(false);
      }
    };

    void resolveAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        if (active) {
          setAdmin(null);
          setLoading(false);
        }
        return;
      }

      void resolveAdmin(session.user.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return { error: error ?? new Error('Unable to sign in. Please try again.') };
    }

    const verifiedAdmin = await getActiveAdmin(data.user.id);
    if (!verifiedAdmin) {
      await supabase.auth.signOut();
      setAdmin(null);
      return { error: new Error('This account is not an active administrator.') };
    }

    setAdmin(verifiedAdmin);
    await recordActivity('login', 'Administrator signed in successfully');
    return { error: null };
  };

  const signOut = async () => {
    if (admin) {
      await recordActivity('logout', 'Administrator signed out');
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out administrator:', error);
    }
    setAdmin(null);
  };

  const logActivity = async (
    actionType: string,
    description: string,
    metadata: Record<string, Json | undefined> = {},
  ) => {
    if (admin) {
      await recordActivity(actionType, description, metadata);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, signIn, signOut, logActivity }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
