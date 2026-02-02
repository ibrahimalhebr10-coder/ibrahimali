import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Admin {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      const adminData = sessionStorage.getItem('admin_session');
      if (adminData) {
        const parsedAdmin = JSON.parse(adminData);
        setAdmin(parsedAdmin);
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { success: false, error: 'بيانات الدخول غير صحيحة' };
      }

      if (!authData.user) {
        return { success: false, error: 'بيانات الدخول غير صحيحة' };
      }

      const { data: adminRecord, error: adminError } = await supabase
        .from('admins')
        .select('id, email, full_name, role')
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (adminError) {
        console.error('Admin query error:', adminError);
        await supabase.auth.signOut();
        return { success: false, error: 'خطأ في الاتصال بقاعدة البيانات' };
      }

      if (!adminRecord) {
        await supabase.auth.signOut();
        return { success: false, error: 'هذا الحساب غير مخوّل للدخول إلى لوحة الإدارة' };
      }

      const adminData: Admin = {
        id: adminRecord.id,
        email: adminRecord.email,
        full_name: adminRecord.full_name,
        role: adminRecord.role
      };

      sessionStorage.setItem('admin_session', JSON.stringify(adminData));
      setAdmin(adminData);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('admin_session');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
