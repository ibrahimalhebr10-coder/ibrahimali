import { supabase } from '../lib/supabase';

export interface AdminRole {
  id: string;
  role_key: string;
  role_name_ar: string;
  role_name_en: string;
  description: string;
  is_system_role: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AdminPermission {
  id: string;
  permission_key: string;
  permission_name_ar: string;
  permission_name_en: string;
  category: string;
  description: string;
  is_critical: boolean;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted_at: string;
}

export interface AdminWithRole {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  role_id: string;
  is_active: boolean;
  role_details?: AdminRole;
  permissions?: AdminPermission[];
}

class PermissionsService {
  private permissionsCache: Map<string, AdminPermission[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000;

  async getAllRoles(): Promise<AdminRole[]> {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all roles:', error);
      return [];
    }
  }

  async getRoleById(roleId: string): Promise<AdminRole | null> {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('id', roleId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting role by id:', error);
      return null;
    }
  }

  async getRoleByKey(roleKey: string): Promise<AdminRole | null> {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('role_key', roleKey)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting role by key:', error);
      return null;
    }
  }

  async getAllPermissions(): Promise<AdminPermission[]> {
    try {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .order('category', { ascending: true })
        .order('permission_key', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all permissions:', error);
      return [];
    }
  }

  async getPermissionsByCategory(category: string): Promise<AdminPermission[]> {
    try {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .eq('category', category)
        .order('permission_key', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting permissions by category:', error);
      return [];
    }
  }

  async getRolePermissions(roleId: string): Promise<AdminPermission[]> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          permission:admin_permissions(*)
        `)
        .eq('role_id', roleId);

      if (error) throw error;

      return data?.map(item => item.permission).filter(Boolean) || [];
    } catch (error) {
      console.error('Error getting role permissions:', error);
      return [];
    }
  }

  async getAdminPermissions(adminId: string, useCache: boolean = true): Promise<AdminPermission[]> {
    if (useCache) {
      const cached = this.permissionsCache.get(adminId);
      const expiry = this.cacheExpiry.get(adminId);
      
      if (cached && expiry && Date.now() < expiry) {
        return cached;
      }
    }

    try {
      const { data, error } = await supabase.rpc('get_admin_permissions', {
        p_admin_id: adminId
      });

      if (error) throw error;

      const permissions = data || [];
      
      this.permissionsCache.set(adminId, permissions);
      this.cacheExpiry.set(adminId, Date.now() + this.CACHE_DURATION);

      return permissions;
    } catch (error) {
      console.error('Error getting admin permissions:', error);
      return [];
    }
  }

  async checkPermission(adminId: string, permissionKey: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_admin_permission', {
        p_admin_id: adminId,
        p_permission_key: permissionKey
      });

      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  async checkMultiplePermissions(
    adminId: string,
    permissionKeys: string[]
  ): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};

    await Promise.all(
      permissionKeys.map(async (key) => {
        result[key] = await this.checkPermission(adminId, key);
      })
    );

    return result;
  }

  checkPermissionInList(permissions: AdminPermission[], permissionKey: string): boolean {
    return permissions.some(p => p.permission_key === permissionKey);
  }

  checkAnyPermissionInList(permissions: AdminPermission[], permissionKeys: string[]): boolean {
    return permissionKeys.some(key => this.checkPermissionInList(permissions, key));
  }

  checkAllPermissionsInList(permissions: AdminPermission[], permissionKeys: string[]): boolean {
    return permissionKeys.every(key => this.checkPermissionInList(permissions, key));
  }

  filterByCategory(permissions: AdminPermission[], category: string): AdminPermission[] {
    return permissions.filter(p => p.category === category);
  }

  getCriticalPermissions(permissions: AdminPermission[]): AdminPermission[] {
    return permissions.filter(p => p.is_critical);
  }

  getPermissionsByCategories(permissions: AdminPermission[]): Record<string, AdminPermission[]> {
    const grouped: Record<string, AdminPermission[]> = {};

    permissions.forEach(permission => {
      if (!grouped[permission.category]) {
        grouped[permission.category] = [];
      }
      grouped[permission.category].push(permission);
    });

    return grouped;
  }

  clearCache(adminId?: string) {
    if (adminId) {
      this.permissionsCache.delete(adminId);
      this.cacheExpiry.delete(adminId);
    } else {
      this.permissionsCache.clear();
      this.cacheExpiry.clear();
    }
  }

  async grantPermissionToRole(roleId: string, permissionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('role_permissions')
        .insert({
          role_id: roleId,
          permission_id: permissionId
        });

      if (error) throw error;
      
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error granting permission:', error);
      return false;
    }
  }

  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('permission_id', permissionId);

      if (error) throw error;

      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error revoking permission:', error);
      return false;
    }
  }

  async syncRolePermissions(roleId: string, permissionIds: string[]): Promise<boolean> {
    try {
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      if (permissionIds.length > 0) {
        const { error } = await supabase
          .from('role_permissions')
          .insert(
            permissionIds.map(permissionId => ({
              role_id: roleId,
              permission_id: permissionId
            }))
          );

        if (error) throw error;
      }

      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error syncing role permissions:', error);
      return false;
    }
  }

  async createRole(roleData: {
    role_key: string;
    role_name_ar: string;
    role_name_en: string;
    description?: string;
    priority?: number;
  }): Promise<AdminRole | null> {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .insert({
          ...roleData,
          is_system_role: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating role:', error);
      return null;
    }
  }

  async updateRole(roleId: string, updates: Partial<AdminRole>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_roles')
        .update(updates)
        .eq('id', roleId)
        .eq('is_system_role', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating role:', error);
      return false;
    }
  }

  async deleteRole(roleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_roles')
        .delete()
        .eq('id', roleId)
        .eq('is_system_role', false);

      if (error) throw error;

      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error deleting role:', error);
      return false;
    }
  }

  async getCurrentAdminWithRole(): Promise<{ admin: any; role: AdminRole | null; permissions: AdminPermission[] } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (adminError) throw adminError;
      if (!admin || !admin.role_id) return null;

      const { data: role, error: roleError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('id', admin.role_id)
        .maybeSingle();

      if (roleError) throw roleError;
      if (!role) return null;

      const permissions = await this.getAdminPermissions(admin.id);

      return { admin, role, permissions };
    } catch (error) {
      console.error('Error getting current admin with role:', error);
      return null;
    }
  }

  async hasPermission(permissionKey: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: admin } = await supabase
        .from('admins')
        .select('id, role_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!admin || !admin.role_id) return false;

      const { data: role } = await supabase
        .from('admin_roles')
        .select('role_key')
        .eq('id', admin.role_id)
        .maybeSingle();

      if (role?.role_key === 'super_admin') return true;

      return await this.checkPermission(admin.id, permissionKey);
    } catch (error) {
      console.error('Error checking hasPermission:', error);
      return false;
    }
  }

  async hasAnyPermission(permissionKeys: string[]): Promise<boolean> {
    for (const key of permissionKeys) {
      if (await this.hasPermission(key)) {
        return true;
      }
    }
    return false;
  }

  async logPermissionAction(
    action: 'create_role' | 'update_role' | 'delete_role' | 'assign_permission' | 'revoke_permission' | 'create_admin' | 'update_admin' | 'disable_admin',
    targetId: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!admin) return;

      await supabase.from('admin_logs').insert({
        admin_id: admin.id,
        action_type: action.includes('delete') ? 'delete' : action.includes('create') ? 'create' : 'update',
        entity_type: action.includes('role') ? 'settings' : action.includes('permission') ? 'settings' : 'user',
        entity_id: targetId,
        description,
        metadata: metadata || {}
      });
    } catch (error) {
      console.error('Error logging permission action:', error);
    }
  }

  async getAdminAssignedFarms(adminId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_admin_assigned_farms', {
        p_admin_id: adminId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting admin assigned farms:', error);
      return [];
    }
  }

  async getFarmAssignedAdmins(farmId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_farm_assigned_admins', {
        p_farm_id: farmId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting farm assigned admins:', error);
      return [];
    }
  }

  async assignFarmToAdmin(
    adminId: string,
    farmId: string,
    assignedBy: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('assign_farm_to_admin', {
        p_admin_id: adminId,
        p_farm_id: farmId,
        p_assigned_by: assignedBy,
        p_notes: notes || null
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error assigning farm to admin:', error);
      return false;
    }
  }

  async unassignFarmFromAdmin(adminId: string, farmId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('unassign_farm_from_admin', {
        p_admin_id: adminId,
        p_farm_id: farmId
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unassigning farm from admin:', error);
      return false;
    }
  }

  async updateAdminScope(
    adminId: string,
    scopeType: 'all' | 'farms' | 'farm' | 'tasks',
    scopeValue?: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admins')
        .update({
          scope_type: scopeType,
          scope_value: scopeValue
        })
        .eq('id', adminId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating admin scope:', error);
      return false;
    }
  }

  async getAdminScope(adminId: string): Promise<{ scope_type: string; scope_value: any } | null> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('scope_type, scope_value')
        .eq('id', adminId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting admin scope:', error);
      return null;
    }
  }

  async getAllActionCategories(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('action_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting action categories:', error);
      return [];
    }
  }

  async getAllActions(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('admin_actions')
        .select(`
          *,
          category:action_categories(*)
        `)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all actions:', error);
      return [];
    }
  }

  async getAllActionsWithCategories(): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_all_actions_with_categories');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting actions with categories:', error);
      return [];
    }
  }

  async getActionsByCategory(categoryKey: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_actions_by_category', {
        p_category_key: categoryKey
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting actions by category:', error);
      return [];
    }
  }

  async getActionByKey(actionKey: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('admin_actions')
        .select(`
          *,
          category:action_categories(*)
        `)
        .eq('action_key', actionKey)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting action by key:', error);
      return null;
    }
  }

  async getCategoryByKey(categoryKey: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('action_categories')
        .select('*')
        .eq('category_key', categoryKey)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting category by key:', error);
      return null;
    }
  }
}

export const permissionsService = new PermissionsService();
