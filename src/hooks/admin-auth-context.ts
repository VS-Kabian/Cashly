import { createContext } from 'react';
import type { Json } from '@/integrations/supabase/types';

export interface Admin {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  last_login_at: string | null;
}

export interface AdminAuthContextType {
  admin: Admin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  logActivity: (actionType: string, description: string, metadata?: Record<string, Json | undefined>) => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);
