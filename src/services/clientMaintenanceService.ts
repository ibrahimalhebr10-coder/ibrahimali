import { supabase } from '../lib/supabase';

export interface ClientMaintenanceRecord {
  maintenance_id: string;
  farm_id: string;
  farm_name: string;
  maintenance_type: 'periodic' | 'seasonal' | 'emergency';
  maintenance_date: string;
  status: string;
  total_amount: number | null;
  cost_per_tree: number | null;
  client_tree_count: number;
  client_due_amount: number | null;
  payment_status: 'pending' | 'paid';
  payment_id: string | null;
}

export interface MaintenanceDetails {
  id: string;
  farm_id: string;
  maintenance_type: string;
  maintenance_date: string;
  status: string;
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
  async getClientMaintenanceRecords(): Promise<ClientMaintenanceRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('get_client_maintenance_records', { client_user_id: user.id });

    if (error) throw error;
    return data || [];
  },

  async getMaintenanceDetails(maintenanceId: string): Promise<MaintenanceDetails> {
    const [recordResult, stagesResult, mediaResult] = await Promise.all([
      supabase
        .from('maintenance_records')
        .select('*')
        .eq('id', maintenanceId)
        .eq('status', 'published')
        .single(),

      supabase
        .from('maintenance_stages')
        .select('id, stage_title, stage_note, stage_date')
        .eq('maintenance_id', maintenanceId)
        .order('stage_date', { ascending: true }),

      supabase
        .from('maintenance_media')
        .select('id, media_type, file_path')
        .eq('maintenance_id', maintenanceId)
        .order('uploaded_at', { ascending: false })
    ]);

    if (recordResult.error) throw recordResult.error;

    const media = mediaResult.data || [];
    const mediaWithUrls = await Promise.all(
      media.map(async (m) => {
        const { data } = supabase.storage
          .from('maintenance-media')
          .getPublicUrl(m.file_path);
        return { ...m, media_url: data.publicUrl };
      })
    );

    return {
      ...recordResult.data,
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
