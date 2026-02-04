import { supabase } from '../lib/supabase';

export interface MaintenanceRecord {
  id: string;
  farm_id: string;
  maintenance_type: 'periodic' | 'seasonal' | 'emergency';
  maintenance_date: string;
  status: 'draft' | 'published' | 'completed';
  created_at: string;
  updated_at?: string;
}

export interface MaintenanceStage {
  id: string;
  maintenance_id: string;
  stage_title: string;
  stage_note: string;
  stage_date: string;
  created_at: string;
}

export interface MaintenanceMedia {
  id: string;
  maintenance_id: string;
  media_type: 'image' | 'video';
  file_path: string;
  uploaded_at: string;
}

export interface MaintenanceFee {
  id: string;
  maintenance_id: string;
  farm_id: string;
  total_amount: number;
  cost_per_tree: number;
  created_at: string;
}

export interface MaintenanceFeeGrouped {
  id: string;
  farm_id: string;
  fee_title: string;
  fee_period: string | null;
  total_amount: number;
  cost_per_tree: number;
  status: 'draft' | 'published' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface MaintenanceFeeRecord {
  id: string;
  fee_id: string;
  maintenance_id: string;
  created_at: string;
}

export interface GroupedFeeWithRecords extends MaintenanceFeeGrouped {
  records_count: number;
  maintenance_records?: MaintenanceRecord[];
}

export interface MaintenanceFullDetails {
  id: string;
  farm_id: string;
  farm_name: string;
  total_trees: number;
  maintenance_type: string;
  maintenance_date: string;
  status: string;
  created_at: string;
  total_amount: number | null;
  cost_per_tree: number | null;
  stages_count: number;
  media_count: number;
}

export const operationsService = {
  async getMaintenanceRecords(): Promise<MaintenanceFullDetails[]> {
    const { data, error } = await supabase
      .from('maintenance_full_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getMaintenanceRecordById(id: string) {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createMaintenanceRecord(record: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMaintenanceRecord(id: string, updates: Partial<MaintenanceRecord>) {
    const { data, error } = await supabase
      .from('maintenance_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMaintenanceRecord(id: string) {
    const { error } = await supabase
      .from('maintenance_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getMaintenanceStages(maintenanceId: string): Promise<MaintenanceStage[]> {
    const { data, error } = await supabase
      .from('maintenance_stages')
      .select('*')
      .eq('maintenance_id', maintenanceId)
      .order('stage_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createMaintenanceStage(stage: Omit<MaintenanceStage, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('maintenance_stages')
      .insert([stage])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMaintenanceStage(id: string) {
    const { error } = await supabase
      .from('maintenance_stages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getMaintenanceMedia(maintenanceId: string): Promise<MaintenanceMedia[]> {
    const { data, error } = await supabase
      .from('maintenance_media')
      .select('*')
      .eq('maintenance_id', maintenanceId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async uploadMaintenanceMedia(file: File, maintenanceId: string, mediaType: 'image' | 'video') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${maintenanceId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('maintenance-media')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('maintenance_media')
      .insert([{
        maintenance_id: maintenanceId,
        media_type: mediaType,
        file_path: fileName
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMediaUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('maintenance-media')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async deleteMaintenanceMedia(id: string, filePath: string) {
    await supabase.storage
      .from('maintenance-media')
      .remove([filePath]);

    const { error } = await supabase
      .from('maintenance_media')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getMaintenanceFee(maintenanceId: string) {
    const { data, error } = await supabase
      .from('maintenance_fees')
      .select('*')
      .eq('maintenance_id', maintenanceId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createMaintenanceFee(fee: Omit<MaintenanceFee, 'id' | 'created_at' | 'cost_per_tree'>) {
    const { data, error } = await supabase
      .from('maintenance_fees')
      .insert([fee])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMaintenanceFee(id: string, totalAmount: number) {
    const { data, error } = await supabase
      .from('maintenance_fees')
      .update({ total_amount: totalAmount })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMaintenanceFee(id: string) {
    const { error } = await supabase
      .from('maintenance_fees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getFarms() {
    const { data, error } = await supabase
      .from('farms')
      .select('id, name_ar, name_en, total_trees')
      .order('name_ar');

    if (error) throw error;
    return data || [];
  },

  async getMaintenancePaymentsSummary() {
    const { data, error } = await supabase
      .from('maintenance_payments_summary')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getMaintenancePaymentsByFee(feeId: string) {
    const { data, error } = await supabase
      .from('maintenance_payments')
      .select(`
        *,
        user_profiles:user_id (
          full_name,
          phone,
          email
        )
      `)
      .eq('maintenance_fee_id', feeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updatePaymentStatus(paymentId: string, amountPaid: number) {
    const { data, error } = await supabase
      .from('maintenance_payments')
      .update({
        amount_paid: amountPaid,
        payment_status: 'paid',
        payment_date: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPaymentStats() {
    const { data, error } = await supabase.rpc('get_maintenance_payment_stats');

    if (error) throw error;
    return data;
  },

  async getGroupedFees(farmId?: string): Promise<GroupedFeeWithRecords[]> {
    let query = supabase
      .from('maintenance_fees_grouped')
      .select('*')
      .order('created_at', { ascending: false });

    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const feesWithCounts = await Promise.all(
      (data || []).map(async (fee) => {
        const { count } = await supabase
          .from('maintenance_fee_records')
          .select('*', { count: 'exact', head: true })
          .eq('fee_id', fee.id);

        return {
          ...fee,
          records_count: count || 0
        };
      })
    );

    return feesWithCounts;
  },

  async createGroupedFee(fee: Omit<MaintenanceFeeGrouped, 'id' | 'created_at' | 'updated_at' | 'cost_per_tree'>, farmId: string) {
    const farm = await supabase
      .from('farms')
      .select('total_trees')
      .eq('id', farmId)
      .single();

    if (!farm.data) throw new Error('Farm not found');

    const costPerTree = fee.total_amount / farm.data.total_trees;

    const { data, error } = await supabase
      .from('maintenance_fees_grouped')
      .insert([{
        ...fee,
        farm_id: farmId,
        cost_per_tree: costPerTree
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGroupedFee(id: string, updates: Partial<MaintenanceFeeGrouped>) {
    if (updates.total_amount && updates.farm_id) {
      const farm = await supabase
        .from('farms')
        .select('total_trees')
        .eq('id', updates.farm_id)
        .single();

      if (farm.data) {
        updates.cost_per_tree = updates.total_amount / farm.data.total_trees;
      }
    }

    const { data, error } = await supabase
      .from('maintenance_fees_grouped')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGroupedFee(id: string) {
    const { error } = await supabase
      .from('maintenance_fees_grouped')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async linkMaintenanceToFee(feeId: string, maintenanceId: string) {
    const { data, error } = await supabase
      .from('maintenance_fee_records')
      .insert([{
        fee_id: feeId,
        maintenance_id: maintenanceId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unlinkMaintenanceFromFee(feeId: string, maintenanceId: string) {
    const { error } = await supabase
      .from('maintenance_fee_records')
      .delete()
      .eq('fee_id', feeId)
      .eq('maintenance_id', maintenanceId);

    if (error) throw error;
  },

  async getMaintenanceLinkedFees(maintenanceId: string): Promise<GroupedFeeWithRecords[]> {
    const { data, error } = await supabase.rpc('get_maintenance_record_fees', {
      p_maintenance_id: maintenanceId
    });

    if (error) throw error;
    return data || [];
  },

  async getFeeMaintenanceRecords(feeId: string) {
    const { data, error } = await supabase.rpc('get_fee_maintenance_records', {
      p_fee_id: feeId
    });

    if (error) throw error;
    return data || [];
  }
};
