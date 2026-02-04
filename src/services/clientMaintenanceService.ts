import { supabase } from '../lib/supabase';

export interface ClientMaintenanceRecord {
  maintenance_id: string;
  maintenance_fee_id: string | null;
  farm_id: string;
  farm_name: string;
  maintenance_type: 'periodic' | 'seasonal' | 'emergency';
  maintenance_date: string;
  status: string;
  total_amount: number | null;
  cost_per_tree: number | null;
  fees_status: string | null;
  client_tree_count: number;
  client_due_amount: number | null;
  payment_status: 'pending' | 'paid';
  payment_id: string | null;
  visible_media_count: number;
}

export interface MaintenanceDetails {
  id: string;
  farm_id: string;
  farm_name: string;
  maintenance_type: string;
  maintenance_date: string;
  status: string;
  client_tree_count: number;
  cost_per_tree: number | null;
  client_due_amount: number | null;
  payment_status: 'pending' | 'paid';
  maintenance_fee_id: string | null;
  stages: MaintenanceStage[];
  media: MaintenanceMedia[];
}

export interface MaintenanceStage {
  id: string;
  stage_title: string;
  stage_note: string;
  stage_date: string;
}

export interface MaintenanceMedia {
  id: string;
  media_type: 'image' | 'video';
  file_path: string;
  media_url?: string;
}

export interface MaintenancePayment {
  id: string;
  maintenance_fee_id: string;
  farm_id: string;
  tree_count: number;
  amount_due: number;
  amount_paid: number;
  payment_status: 'pending' | 'paid';
  payment_date: string | null;
}

export const clientMaintenanceService = {
  async getClientMaintenanceRecords(pathType: 'agricultural' | 'investment' = 'agricultural'): Promise<ClientMaintenanceRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('get_client_maintenance_records', {
        client_user_id: user.id,
        filter_path_type: pathType
      });

    if (error) throw error;
    return data || [];
  },

  async getMaintenanceDetails(maintenanceId: string): Promise<MaintenanceDetails> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const [recordResult, mediaResult, stagesResult] = await Promise.all([
      supabase
        .from('maintenance_records')
        .select(`
          *,
          farms:farm_id (
            name_ar
          ),
          maintenance_fees (
            id,
            total_amount,
            cost_per_tree,
            fees_status
          )
        `)
        .eq('id', maintenanceId)
        .eq('status', 'published')
        .single(),

      supabase.rpc('get_client_visible_media', { p_maintenance_id: maintenanceId }),

      supabase.rpc('get_client_maintenance_stages', { p_maintenance_id: maintenanceId })
    ]);

    if (recordResult.error) throw recordResult.error;

    const reservationResult = await supabase
      .from('reservations')
      .select('total_trees')
      .eq('farm_id', recordResult.data.farm_id)
      .eq('user_id', user.id)
      .in('status', ['confirmed', 'active']);

    const clientTreeCount = reservationResult.data?.reduce((sum, res) => sum + (res.total_trees || 0), 0) || 0;
    const fee = recordResult.data.maintenance_fees?.[0];
    const costPerTree = fee?.cost_per_tree || null;
    const clientDueAmount = fee && costPerTree ? costPerTree * clientTreeCount : null;
    const maintenanceFeeId = fee?.id || null;

    let paymentStatus: 'pending' | 'paid' = 'pending';
    if (maintenanceFeeId) {
      const paymentResult = await supabase
        .from('maintenance_payments')
        .select('payment_status')
        .eq('user_id', user.id)
        .eq('maintenance_fee_id', maintenanceFeeId)
        .maybeSingle();

      if (paymentResult.data?.payment_status === 'paid') {
        paymentStatus = 'paid';
      }
    }

    const media = mediaResult.data || [];
    const mediaWithUrls = await Promise.all(
      media.map(async (m: any) => {
        const { data } = supabase.storage
          .from('maintenance-media')
          .getPublicUrl(m.file_path);
        return { ...m, media_url: data.publicUrl };
      })
    );

    return {
      id: recordResult.data.id,
      farm_id: recordResult.data.farm_id,
      farm_name: recordResult.data.farms?.name_ar || 'غير معروف',
      maintenance_type: recordResult.data.maintenance_type,
      maintenance_date: recordResult.data.maintenance_date,
      status: recordResult.data.status,
      client_tree_count: clientTreeCount,
      cost_per_tree: costPerTree,
      client_due_amount: clientDueAmount,
      payment_status: paymentStatus,
      maintenance_fee_id: maintenanceFeeId,
      stages: stagesResult.data || [],
      media: mediaWithUrls
    };
  },

  async createMaintenancePayment(
    maintenanceFeeId: string,
    farmId: string,
    treeCount: number,
    amountDue: number
  ): Promise<MaintenancePayment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('maintenance_payments')
      .insert([{
        user_id: user.id,
        maintenance_fee_id: maintenanceFeeId,
        farm_id: farmId,
        tree_count: treeCount,
        amount_due: amountDue,
        amount_paid: 0,
        payment_status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePaymentStatus(paymentId: string, status: 'paid', amountPaid: number) {
    const { data, error } = await supabase
      .from('maintenance_payments')
      .update({
        payment_status: status,
        amount_paid: amountPaid
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPaymentDetails(paymentId: string): Promise<MaintenancePayment> {
    const { data, error } = await supabase
      .from('maintenance_payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) throw error;
    return data;
  },

  async checkExistingPayment(maintenanceFeeId: string): Promise<MaintenancePayment | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('maintenance_payments')
      .select('*')
      .eq('user_id', user.id)
      .eq('maintenance_fee_id', maintenanceFeeId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  getMaintenanceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      periodic: 'دورية',
      seasonal: 'موسمية',
      emergency: 'طارئة'
    };
    return labels[type] || type;
  }
};
