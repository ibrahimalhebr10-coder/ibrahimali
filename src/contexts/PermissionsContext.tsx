import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAdmin } from './AdminContext';
import {
  permissionsService,
  AdminPermission,
  AdminRole
} from '../services/permissionsService';

interface RoleAction {
  action_id: string;
  action_key: string;
  action_name_ar: string;
  scope_level: string;
  is_dangerous: boolean;
  requires_approval: boolean;
}

interface PermissionsContextType {
  permissions: AdminPermission[];
  actions: RoleAction[];
  role: AdminRole | null;
  loading: boolean;
  hasPermission: (permissionKey: string) => boolean;
  hasAction: (actionKey: string) => boolean;
  hasAnyAction: (actionKeys: string[]) => boolean;
  hasAllActions: (actionKeys: string[]) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  hasAllPermissions: (permissionKeys: string[]) => boolean;
  isAuthorized: (requiredPermissions: string | string[], requireAll?: boolean) => boolean;
  canPerformAction: (actionKey: string) => boolean;
  isSuperAdmin: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { admin } = useAdmin();
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [actions, setActions] = useState<RoleAction[]>([]);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPermissions = async () => {
    if (!admin?.id) {
      setPermissions([]);
      setActions([]);
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

      if (roleData?.id) {
        const roleActions = await permissionsService.getEnabledRoleActions(roleData.id);
        setActions(roleActions);
      } else {
        setActions([]);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions([]);
      setActions([]);
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

  const hasAction = (actionKey: string): boolean => {
    if (role?.role_key === 'super_admin') return true;
    return actions.some(action => action.action_key === actionKey);
  };

  const hasAnyAction = (actionKeys: string[]): boolean => {
    if (role?.role_key === 'super_admin') return true;
    return actionKeys.some(key => hasAction(key));
  };

  const hasAllActions = (actionKeys: string[]): boolean => {
    if (role?.role_key === 'super_admin') return true;
    return actionKeys.every(key => hasAction(key));
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

  const canPerformAction = (actionKey: string): boolean => {
    return hasAction(actionKey);
  };

  const isSuperAdmin = role?.role_key === 'super_admin';

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
        actions,
        role,
        loading,
        hasPermission,
        hasAction,
        hasAnyAction,
        hasAllActions,
        hasAnyPermission,
        hasAllPermissions,
        isAuthorized,
        canPerformAction,
        isSuperAdmin,
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
