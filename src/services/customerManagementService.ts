import { supabase } from '../lib/supabase';

export interface Customer {
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string;
  account_status: string;
  green_trees_count: number;
  golden_trees_count: number;
  total_trees_count: number;
  registered_at: string;
  last_login: string | null;
}

export interface CustomerProfile {
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string;
  country: string | null;
  account_status: string;
  email_confirmed: boolean;
  phone_confirmed: boolean;
  registered_at: string;
  last_login: string | null;
  green_trees_count: number;
  golden_trees_count: number;
  farms_count: number;
  pending_payments: number;
  groups: Array<{ group_id: string; group_name: string }>;
}

export interface CustomerGroup {
  id: string;
  group_name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  members_count?: number;
}

export const customerManagementService = {
  async getCustomersList(minTrees?: number, limit = 100, offset = 0) {
    const { data, error } = await supabase
      .rpc('get_customers_list', {
        p_min_trees: minTrees || null,
        p_limit: limit,
        p_offset: offset
      });

    if (error) throw error;
    return data as Customer[];
  },

  async getCustomerProfile(identifier: string) {
    const { data, error } = await supabase
      .rpc('get_customer_profile', {
        p_identifier: identifier
      });

    if (error) throw error;
    return data as CustomerProfile;
  },

  async getCustomerGreenTrees(userId: string) {
    const { data, error } = await supabase
      .rpc('get_customer_green_trees', {
        p_user_id: userId
      });

    if (error) throw error;
    return data;
  },

  async getCustomerGoldenTrees(userId: string) {
    const { data, error } = await supabase
      .rpc('get_customer_golden_trees', {
        p_user_id: userId
      });

    if (error) throw error;
    return data;
  },

  async getCustomerFinancialHistory(userId: string) {
    const { data, error } = await supabase
      .rpc('get_customer_financial_history', {
        p_user_id: userId
      });

    if (error) throw error;
    return data;
  },

  async getCustomerActivityLog(userId: string, limit = 50) {
    const { data, error } = await supabase
      .rpc('get_customer_activity_log', {
        p_user_id: userId,
        p_limit: limit
      });

    if (error) throw error;
    return data;
  },

  async disableCustomerAccount(userId: string, reason: string, durationDays = 30) {
    const { data, error } = await supabase
      .rpc('disable_customer_account', {
        p_user_id: userId,
        p_reason: reason,
        p_duration_days: durationDays
      });

    if (error) throw error;
    return data;
  },

  async deleteCustomerAccount(userId: string, confirmationCode: string, adminReason: string) {
    const { data, error } = await supabase
      .rpc('delete_customer_account', {
        p_user_id: userId,
        p_confirmation_code: confirmationCode,
        p_admin_reason: adminReason
      });

    if (error) throw error;
    return data;
  },

  async getAllGroups() {
    const { data, error } = await supabase
      .from('customer_groups')
      .select(`
        *,
        members:customer_group_members(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(group => ({
      ...group,
      members_count: group.members[0]?.count || 0
    })) as CustomerGroup[];
  },

  async createGroup(groupName: string, description?: string) {
    const { data, error } = await supabase
      .from('customer_groups')
      .insert([{
        group_name: groupName,
        description: description || null,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data as CustomerGroup;
  },

  async updateGroup(groupId: string, groupName: string, description?: string) {
    const { data, error } = await supabase
      .from('customer_groups')
      .update({
        group_name: groupName,
        description: description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return data as CustomerGroup;
  },

  async deleteGroup(groupId: string) {
    const { error } = await supabase
      .from('customer_groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
    return { success: true };
  },

  async getGroupMembers(groupId: string) {
    const { data, error } = await supabase
      .from('customer_group_members')
      .select(`
        *,
        user:auth.users!customer_group_members_user_id_fkey(
          id,
          email
        ),
        profile:user_profiles!customer_group_members_user_id_fkey(
          full_name,
          phone
        )
      `)
      .eq('group_id', groupId);

    if (error) throw error;
    return data;
  },

  async addMemberToGroup(groupId: string, userId: string) {
    const { data, error } = await supabase
      .from('customer_group_members')
      .insert([{
        group_id: groupId,
        user_id: userId,
        added_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeMemberFromGroup(groupId: string, userId: string) {
    const { error } = await supabase
      .from('customer_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  },

  async createGroupFromFilter(groupName: string, customerIds: string[], description?: string) {
    const group = await this.createGroup(groupName, description);

    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const members = customerIds.map(userId => ({
      group_id: group.id,
      user_id: userId,
      added_by: currentUserId
    }));

    const { error } = await supabase
      .from('customer_group_members')
      .insert(members);

    if (error) throw error;
    return group;
  },

  async findDuplicateCustomers() {
    const { data, error } = await supabase
      .rpc('find_duplicate_customers');

    if (error) throw error;
    return data;
  }
};
