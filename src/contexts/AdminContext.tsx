import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Admin } from '../services/adminService';
import { adminSessionService } from '../services/adminSessionService';
import { permissionsService, AdminRole } from '../services/permissionsService';

interface AdminContextType {
  admin: Admin | null;
  adminRole: AdminRole | null;
  defaultPage: 'dashboard' | 'harvest' | null;
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  checkAdminSession: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
  onSessionExpire?: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [defaultPage, setDefaultPage] = useState<'dashboard' | 'harvest' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSessionExpire = useCallback(() => {
    setAdmin(null);
    setAdminRole(null);
    setDefaultPage(null);
    console.log('Admin session expired');
  }, []);

  function determineDefaultPage(role: AdminRole | null): 'dashboard' | 'harvest' {
    if (!role) return 'dashboard';

    const operationalRoles = ['worker', 'supervisor', 'farm_supervisor'];

    if (operationalRoles.includes(role.role_key)) {
      return 'harvest';
    }

    return 'dashboard';
  }

  async function checkAdminSession() {
    console.log('🔄 AdminContext: checkAdminSession called');
    try {
      const adminData = await adminSessionService.validateAdminSession();
      console.log('🔄 AdminContext: validateAdminSession returned:', adminData ? 'admin data' : 'null');

      if (adminData) {
        setAdmin(adminData);

        const role = adminData.role_id
          ? await permissionsService.getRoleById(adminData.role_id)
          : null;

        setAdminRole(role);

        const page = determineDefaultPage(role);
        setDefaultPage(page);

        console.log('✅ AdminContext: Admin authenticated');
        console.log('📋 Role:', role?.role_name_ar);
        console.log('🎯 Default page:', page);

        adminSessionService.startSessionMonitoring(handleSessionExpire);
      } else {
        console.log('❌ AdminContext: No admin data');
        setAdmin(null);
        setAdminRole(null);
        setDefaultPage(null);
      }
    } catch (error) {
      console.error('❌ AdminContext: Error checking admin session:', error);
      setAdmin(null);
      setAdminRole(null);
      setDefaultPage(null);
    } finally {
      setIsLoading(false);
      console.log('🔄 AdminContext: isLoading set to false');
    }
  }

  async function signOutAdmin() {
    try {
      await adminSessionService.signOutAdmin();
      setAdmin(null);
      setAdminRole(null);
      setDefaultPage(null);
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
        adminRole,
        defaultPage,
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
