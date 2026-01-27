import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Admin } from '../services/adminService';
import { adminSessionService } from '../services/adminSessionService';

interface AdminContextType {
  admin: Admin | null;
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  checkAdminSession: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
  onSessionExpire?: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSessionExpire = useCallback(() => {
    setAdmin(null);
    console.log('Admin session expired');
  }, []);

  async function checkAdminSession() {
    console.log('🔄 AdminContext: checkAdminSession called');
    try {
      const adminData = await adminSessionService.validateAdminSession();
      console.log('🔄 AdminContext: validateAdminSession returned:', adminData ? 'admin data' : 'null');
      setAdmin(adminData);

      if (adminData) {
        console.log('✅ AdminContext: Admin authenticated, starting monitoring');
        adminSessionService.startSessionMonitoring(handleSessionExpire);
      } else {
        console.log('❌ AdminContext: No admin data');
      }
    } catch (error) {
      console.error('❌ AdminContext: Error checking admin session:', error);
      setAdmin(null);
    } finally {
      setIsLoading(false);
      console.log('🔄 AdminContext: isLoading set to false');
    }
  }

  async function signOutAdmin() {
    try {
      await adminSessionService.signOutAdmin();
      setAdmin(null);
    } catch (error) {
      console.error('Error signing out admin:', error);
    }
  }

  useEffect(() => {
    checkAdminSession();

    return () => {
      adminSessionService.stopSessionMonitoring();
    };
  }, []);

  return (
    <AdminContext.Provider
      value={{
        admin,
        isAdminAuthenticated: !!admin,
        isLoading,
        checkAdminSession,
        signOutAdmin
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
