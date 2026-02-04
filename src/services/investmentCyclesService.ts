import { supabase } from '../lib/supabase';

export interface InvestmentCycle {
  id: string;
  farm_id: string;
  cycle_types: string[];
  cycle_date: string;
  description: string;
  total_amount: number;
  cost_per_tree: number;
  status: 'draft' | 'published';
  images: string[];
  videos: string[];
  visible_to_client: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentCycleReadiness {
  has_farm: boolean;
  has_description: boolean;
  has_cycle_types: boolean;
  has_documentation: boolean;
  has_cost: boolean;
  ready: boolean;
  error?: string;
}

export interface InvestmentCyclePaymentSummary {
  total_investors: number;
  paid_investors: number;
  pending_investors: number;
  total_collected: number;
  total_pending: number;
  cost_per_tree: number;
  error?: string;
}

export const investmentCyclesService = {
  async getAllCycles() {
    const { data, error } = await supabase
      .from('investment_cycles')
      .select('*, farms(name_ar, total_trees)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getCycleById(id: string) {
    const { data, error } = await supabase
      .from('investment_cycles')
      .select('*, farms(name_ar, total_trees)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getCyclesByFarm(farmId: string) {
    const { data, error } = await supabase
      .from('investment_cycles')
      .select('*')
      .eq('farm_id', farmId)
      .order('cycle_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createCycle(cycle: Omit<InvestmentCycle, 'id' | 'cost_per_tree' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('investment_cycles')
      .insert({
        ...cycle,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCycle(id: string, updates: Partial<InvestmentCycle>) {
    const { data, error } = await supabase
      .from('investment_cycles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCycle(id: string) {
    const { error } = await supabase
      .from('investment_cycles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async publishCycle(id: string) {
    return this.updateCycle(id, { status: 'published' });
  },

  async unpublishCycle(id: string) {
    return this.updateCycle(id, { status: 'draft' });
  },

  async checkReadiness(cycleId: string): Promise<InvestmentCycleReadiness> {
    const { data, error } = await supabase
      .rpc('check_investment_cycle_readiness', { cycle_id: cycleId });

    if (error) throw error;
    return data as InvestmentCycleReadiness;
  },

  async getPaymentSummary(cycleId: string): Promise<InvestmentCyclePaymentSummary> {
    const { data, error } = await supabase
      .rpc('get_investment_cycle_payment_summary', { cycle_id: cycleId });

    if (error) throw error;
    return data as InvestmentCyclePaymentSummary;
  },

  async uploadImage(file: File, cycleId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${cycleId}-${Date.now()}.${fileExt}`;
    const filePath = `investment-cycles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('maintenance-media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('maintenance-media')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async uploadVideo(file: File, cycleId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${cycleId}-${Date.now()}.${fileExt}`;
    const filePath = `investment-cycles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('maintenance-media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('maintenance-media')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};
