import { supabase } from '../lib/supabase';

export interface InfluencerPartner {
  id: string;
  name: string;
  display_name: string | null;
  is_active: boolean;
  total_bookings: number;
  total_trees_booked: number;
  total_rewards_earned: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface InfluencerSettings {
  id: string;
  is_system_active: boolean;
  trees_required_for_reward: number;
  reward_type: string;
  congratulation_message_ar: string;
  congratulation_message_en: string;
  featured_package_color: string;
  auto_activate_partners: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface CreateInfluencerPartnerData {
  name: string;
  display_name?: string;
  is_active?: boolean;
  notes?: string;
}

export interface UpdateInfluencerPartnerData {
  name?: string;
  display_name?: string;
  is_active?: boolean;
  notes?: string;
}

export const influencerMarketingService = {
  async getAllPartners(): Promise<InfluencerPartner[]> {
    const { data, error } = await supabase
      .from('influencer_partners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPartnerById(id: string): Promise<InfluencerPartner | null> {
    const { data, error } = await supabase
      .from('influencer_partners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async getPartnerByName(name: string): Promise<InfluencerPartner | null> {
    const { data, error } = await supabase
      .rpc('get_influencer_by_name', { partner_name: name });

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async checkPartnerExists(name: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('check_influencer_exists', { partner_name: name });

    if (error) throw error;
    return data || false;
  },

  async createPartner(partnerData: CreateInfluencerPartnerData): Promise<InfluencerPartner> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('influencer_partners')
      .insert([{
        ...partnerData,
        created_by: user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePartner(id: string, updates: UpdateInfluencerPartnerData): Promise<InfluencerPartner> {
    const { data, error } = await supabase
      .from('influencer_partners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePartner(id: string): Promise<void> {
    const { error } = await supabase
      .from('influencer_partners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async togglePartnerStatus(id: string, isActive: boolean): Promise<InfluencerPartner> {
    return this.updatePartner(id, { is_active: isActive });
  },

  async getSettings(): Promise<InfluencerSettings | null> {
    const { data, error } = await supabase
      .from('influencer_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async updateSettings(updates: Partial<InfluencerSettings>): Promise<InfluencerSettings> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('influencer_settings')
      .update({
        ...updates,
        updated_by: user?.id
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSystemSettings() {
    const { data, error } = await supabase
      .rpc('get_influencer_system_settings');

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async getAllStats() {
    const { data, error } = await supabase
      .rpc('get_all_influencer_stats');

    if (error) throw error;
    return data || [];
  },

  async getActivePartners(): Promise<InfluencerPartner[]> {
    const { data, error } = await supabase
      .from('influencer_partners')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }
};
