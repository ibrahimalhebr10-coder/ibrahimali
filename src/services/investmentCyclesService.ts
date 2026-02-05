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

  async getClientInvestmentCycles() {
    console.log('');
    console.log('='.repeat(80));
    console.log('🚀 [InvestmentCycles Service] START getClientInvestmentCycles()');
    console.log('='.repeat(80));

    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 [InvestmentCycles] Current user:', user?.id || 'NO USER');

    if (!user) {
      console.error('❌ [InvestmentCycles] No user authenticated!');
      throw new Error('Not authenticated');
    }

    console.log('📊 [InvestmentCycles] Step 1: Fetching user reservations...');
    const { data: userReservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('farm_id, total_trees, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'confirmed', 'paid'])
      .eq('path_type', 'investment');

    if (reservationsError) {
      console.error('❌ [InvestmentCycles] Error loading user reservations:', reservationsError);
      throw reservationsError;
    }

    console.log('📦 [InvestmentCycles] User reservations found:', userReservations?.length || 0);
    console.table(userReservations);

    if (!userReservations || userReservations.length === 0) {
      console.warn('⚠️ [InvestmentCycles] No investment reservations found for user!');
      console.log('🔍 [InvestmentCycles] This means:');
      console.log('   - User has NO investment path reservations');
      console.log('   - Or all reservations are NOT in status: active/confirmed/paid');
      console.log('   - Returning empty array');
      console.log('='.repeat(80));
      return [];
    }

    const farmTreesMap = userReservations.reduce((acc, r) => {
      if (r.farm_id && r.farm_id !== 'undefined' && r.farm_id !== 'null') {
        acc[r.farm_id] = (acc[r.farm_id] || 0) + (r.total_trees || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    const farmIds = Object.keys(farmTreesMap);
    console.log('🌳 [InvestmentCycles] Farm trees map:', farmTreesMap);
    console.log('🆔 [InvestmentCycles] Farm IDs:', farmIds);

    if (farmIds.length === 0) {
      console.warn('⚠️ [InvestmentCycles] No valid farm IDs found!');
      console.log('='.repeat(80));
      return [];
    }

    console.log('📊 [InvestmentCycles] Step 2: Fetching investment cycles for these farms...');
    const { data, error } = await supabase
      .from('investment_cycles')
      .select(`
        *,
        farms(
          id,
          name_ar,
          total_trees
        )
      `)
      .eq('status', 'published')
      .eq('visible_to_client', true)
      .in('farm_id', farmIds)
      .order('cycle_date', { ascending: false });

    if (error) {
      console.error('❌ [InvestmentCycles] Error loading client cycles:', error);
      throw error;
    }

    console.log('📦 [InvestmentCycles] Investment cycles found:', data?.length || 0);
    console.table(data);

    if (!data || data.length === 0) {
      console.warn('⚠️ [InvestmentCycles] No published cycles found for user farms!');
      console.log('🔍 [InvestmentCycles] This means:');
      console.log('   - User has farms but NO cycles in those farms');
      console.log('   - Or cycles are NOT published');
      console.log('   - Or visible_to_client is false');
      console.log('='.repeat(80));
      return [];
    }

    const cyclesWithTreeCount = (data || []).map(cycle => ({
      ...cycle,
      user_tree_count: farmTreesMap[cycle.farm_id] || 0
    }));

    console.log('✅ [InvestmentCycles] SUCCESS! Final cycles with tree count:');
    console.table(cyclesWithTreeCount.map(c => ({
      cycle_id: c.id,
      farm_name: c.farms?.name_ar,
      user_trees: c.user_tree_count,
      total_amount: c.total_amount,
      cost_per_tree: c.cost_per_tree,
      cycle_date: c.cycle_date
    })));
    console.log('='.repeat(80));
    console.log('');

    return cyclesWithTreeCount;
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
