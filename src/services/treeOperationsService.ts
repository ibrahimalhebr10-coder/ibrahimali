import { supabase } from '../lib/supabase';

export interface TreeOperation {
  id: string;
  farm_id: string;
  investor_id: string;
  reservation_id?: string;
  operation_type: 'irrigation' | 'maintenance' | 'pruning' | 'harvest';
  operation_date: string;
  trees_count: number;
  total_cost: number;
  cost_per_tree?: number;
  notes?: string;
  status_report?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  media?: TreeOperationMedia[];
  investor_name?: string;
  farm_name?: string;
  farm_nickname?: string;
}

export interface TreeOperationMedia {
  id: string;
  operation_id: string;
  media_type: 'photo' | 'video';
  media_url: string;
  caption?: string;
  created_at: string;
}

export interface CreateTreeOperationInput {
  farm_id: string;
  investor_id: string;
  reservation_id?: string;
  operation_type: 'irrigation' | 'maintenance' | 'pruning' | 'harvest';
  operation_date: string;
  trees_count: number;
  total_cost: number;
  notes?: string;
  status_report?: string;
}

export interface CreateOperationMediaInput {
  operation_id: string;
  media_type: 'photo' | 'video';
  media_url: string;
  caption?: string;
}

export const treeOperationsService = {
  async createOperation(input: CreateTreeOperationInput): Promise<TreeOperation> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('tree_operations')
      .insert([{
        ...input,
        created_by: user?.id
      }])
      .select(`
        *,
        user_profiles!tree_operations_investor_id_fkey(full_name, farm_nickname),
        farms:farm_id(name)
      `)
      .single();

    if (error) {
      console.error('Error creating tree operation:', error);
      throw error;
    }

    return {
      ...data,
      investor_name: data.user_profiles?.full_name,
      farm_name: data.farms?.name,
      farm_nickname: data.user_profiles?.farm_nickname
    };
  },

  async getOperationsByFarm(farmId: string): Promise<TreeOperation[]> {
    const { data, error } = await supabase
      .from('tree_operations')
      .select(`
        *,
        user_profiles!tree_operations_investor_id_fkey(full_name, farm_nickname),
        farms:farm_id(name),
        media:tree_operation_media(*)
      `)
      .eq('farm_id', farmId)
      .order('operation_date', { ascending: false });

    if (error) {
      console.error('Error fetching operations by farm:', error);
      throw error;
    }

    return (data || []).map(op => ({
      ...op,
      investor_name: op.users?.full_name,
      farm_name: op.farms?.name
    }));
  },

  async getOperationsByInvestor(investorId: string): Promise<TreeOperation[]> {
    const { data, error } = await supabase
      .from('tree_operations')
      .select(`
        *,
        farms:farm_id(name),
        media:tree_operation_media(*)
      `)
      .eq('investor_id', investorId)
      .order('operation_date', { ascending: false });

    if (error) {
      console.error('Error fetching operations by investor:', error);
      throw error;
    }

    return (data || []).map(op => ({
      ...op,
      farm_name: op.farms?.name
    }));
  },

  async getOperationById(operationId: string): Promise<TreeOperation | null> {
    const { data, error } = await supabase
      .from('tree_operations')
      .select(`
        *,
        user_profiles!tree_operations_investor_id_fkey(full_name, farm_nickname),
        farms:farm_id(name),
        media:tree_operation_media(*)
      `)
      .eq('id', operationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching operation:', error);
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      investor_name: data.user_profiles?.full_name,
      farm_name: data.farms?.name,
      farm_nickname: data.user_profiles?.farm_nickname
    };
  },

  async updateOperation(operationId: string, updates: Partial<CreateTreeOperationInput>): Promise<TreeOperation> {
    const { data, error } = await supabase
      .from('tree_operations')
      .update(updates)
      .eq('id', operationId)
      .select(`
        *,
        user_profiles!tree_operations_investor_id_fkey(full_name, farm_nickname),
        farms:farm_id(name),
        media:tree_operation_media(*)
      `)
      .single();

    if (error) {
      console.error('Error updating operation:', error);
      throw error;
    }

    return {
      ...data,
      investor_name: data.user_profiles?.full_name,
      farm_name: data.farms?.name,
      farm_nickname: data.user_profiles?.farm_nickname
    };
  },

  async deleteOperation(operationId: string): Promise<void> {
    const { error } = await supabase
      .from('tree_operations')
      .delete()
      .eq('id', operationId);

    if (error) {
      console.error('Error deleting operation:', error);
      throw error;
    }
  },

  async addMedia(input: CreateOperationMediaInput): Promise<TreeOperationMedia> {
    const { data, error } = await supabase
      .from('tree_operation_media')
      .insert([input])
      .select()
      .single();

    if (error) {
      console.error('Error adding operation media:', error);
      throw error;
    }

    return data;
  },

  async deleteMedia(mediaId: string): Promise<void> {
    const { error } = await supabase
      .from('tree_operation_media')
      .delete()
      .eq('id', mediaId);

    if (error) {
      console.error('Error deleting operation media:', error);
      throw error;
    }
  },

  async uploadMediaFile(file: File, operationId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${operationId}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('tree-operation-media')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading media file:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('tree-operation-media')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async getInvestorReservations(investorId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        farm_id,
        farm_name,
        total_trees,
        contract_name,
        duration_years,
        bonus_years,
        farms:farm_id(name)
      `)
      .eq('user_id', investorId)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching investor reservations:', error);
      throw error;
    }

    return data || [];
  }
};
