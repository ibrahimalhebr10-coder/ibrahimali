import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAdmin } from './AdminContext';
import {
  permissionsService,
  AdminPermission,
  AdminRole
} from '../services/permissionsService';

interface PermissionsContextType {
  permissions: AdminPermission[];
  role: AdminRole | null;
  loading: boolean;
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  hasAllPermissions: (permissionKeys: string[]) => boolean;
  isAuthorized: (requiredPermissions: string | string[], requireAll?: boolean) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { admin } = useAdmin();
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPermissions = async () => {
    if (!admin?.id) {
      setPermissions([]);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [perms, roleData] = await Promise.all([
        permissionsService.getAdminPermissions(admin.id, true),
        admin.role_id ? permissionsService.getRoleById(admin.role_id) : null
      ]);

      setPermissions(perms);
      setRole(roleData);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions([]);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [admin?.id]);

  const hasPermission = (permissionKey: string): boolean => {
    return permissionsService.hasPermission(permissions, permissionKey);
  };

  const hasAnyPermission = (permissionKeys: string[]): boolean => {
    return permissionsService.hasAnyPermission(permissions, permissionKeys);
  };

  const hasAllPermissions = (permissionKeys: string[]): boolean => {
    return permissionsService.hasAllPermissions(permissions, permissionKeys);
  };

  const isAuthorized = (
    requiredPermissions: string | string[],
    requireAll: boolean = false
  ): boolean => {
    const keys = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    if (keys.length === 0) return true;

    return requireAll 
      ? hasAllPermissions(keys) 
      : hasAnyPermission(keys);
  };

  const refreshPermissions = async () => {
    if (admin?.id) {
      permissionsService.clearCache(admin.id);
      await loadPermissions();
    }
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        role,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isAuthorized,
        refreshPermissions
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
