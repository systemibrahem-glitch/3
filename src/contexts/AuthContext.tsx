import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Store } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  store: Store | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const savedUser = localStorage.getItem('ibrahim_user');
      const savedStore = localStorage.getItem('ibrahim_store');
      
      if (savedUser && savedStore) {
        const parsedUser = JSON.parse(savedUser);
        const parsedStore = JSON.parse(savedStore);
        
        // Check if subscription is still valid
        const now = new Date();
        const endDate = new Date(parsedStore.subscription_end_date);
        
        if (endDate > now && parsedStore.is_active) {
          setUser(parsedUser);
          setStore(parsedStore);
        } else {
          // Subscription expired
          localStorage.removeItem('ibrahim_user');
          localStorage.removeItem('ibrahim_store');
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(username: string, password: string) {
    try {
      // First, get the user by username
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .limit(1);

      if (userError || !users || users.length === 0) {
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
      }

      const foundUser = users[0] as User;

      // Note: Password verification should be done server-side for security
      // For now, we'll use a simple comparison (NOT SECURE - for demo only)
      // In production, this should be handled by the server
      const isValidPassword = password === foundUser.password_hash;

      if (!isValidPassword) {
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
      }

      // Get the store
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', foundUser.store_id)
        .single();

      if (storeError || !storeData) {
        return { success: false, error: 'خطأ في تحميل بيانات المتجر' };
      }

      const foundStore = storeData as Store;

      // Check subscription
      const now = new Date();
      const endDate = new Date(foundStore.subscription_end_date);

      if (endDate <= now || !foundStore.is_active) {
        return { 
          success: false, 
          error: 'انتهت صلاحية الاشتراك. يرجى التواصل للتجديد.' 
        };
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', foundUser.id);

      // Save to state and localStorage
      setUser(foundUser);
      setStore(foundStore);
      localStorage.setItem('ibrahim_user', JSON.stringify(foundUser));
      localStorage.setItem('ibrahim_store', JSON.stringify(foundStore));

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
    }
  }

  async function signOut() {
    setUser(null);
    setStore(null);
    localStorage.removeItem('ibrahim_user');
    localStorage.removeItem('ibrahim_store');
  }

  async function updateUser(updates: Partial<User>) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('ibrahim_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, store, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

