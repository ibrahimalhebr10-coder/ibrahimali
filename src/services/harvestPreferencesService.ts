import { supabase } from '../lib/supabase';

export interface HarvestPreference {
  id: string;
  investor_id: string;
  farm_id: string;
  reservation_id?: string;
  preference_type: 'personal_use' | 'gift' | 'charity';
  trees_count: number;
  recipient_name?: string;
  recipient_phone?: string;
  recipient_address?: string;
  charity_name?: string;
  special_instructions?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  processing_notes?: string;
  created_at: string;
  updated_at: string;
  investor_name?: string;
  farm_name?: string;
}

export interface CreateHarvestPreferenceInput {
  investor_id: string;
  farm_id: string;
  reservation_id?: string;
  preference_type: 'personal_use' | 'gift' | 'charity';
  trees_count: number;
  recipient_name?: string;
  recipient_phone?: string;
  recipient_address?: string;
  charity_name?: string;
  special_instructions?: string;
}

export const harvestPreferencesService = {
  async createPreference(input: CreateHarvestPreferenceInput): Promise<HarvestPreference> {
    const { data, error } = await supabase
      .from('harvest_preferences')
      .insert([input])
      .select(`
        *,
        users:investor_id(full_name),
        farms:farm_id(name)
      `)
      .single();

    if (error) {
      console.error('Error creating harvest preference:', error);
      throw error;
    }

    return {
      ...data,
      investor_name: data.users?.full_name,
      farm_name: data.farms?.name
    };
  },

  async getPreferencesByInvestor(investorId: string): Promise<HarvestPreference[]> {
    const { data, error } = await supabase
      .from('harvest_preferences')
      .select(`
        *,
        farms:farm_id(name)
      `)
      .eq('investor_id', investorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching preferences by investor:', error);
      throw error;
    }

    return (data || []).map(pref => ({
      ...pref,
      farm_name: pref.farms?.name
    }));
  },

  async getPreferencesByFarm(farmId: string): Promise<HarvestPreference[]> {
    const { data, error } = await supabase
      .from('harvest_preferences')
      .select(`
        *,
        users:investor_id(full_name),
        farms:farm_id(name)
      `)
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching preferences by farm:', error);
      throw error;
    }

    return (data || []).map(pref => ({
      ...pref,
      investor_name: pref.users?.full_name,
      farm_name: pref.farms?.name
    }));
  },

  async getAllPreferences(): Promise<HarvestPreference[]> {
    const { data, error } = await supabase
      .from('harvest_preferences')
      .select(`
        *,
        users:investor_id(full_name),
        farms:farm_id(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all preferences:', error);
      throw error;
    }

    return (data || []).map(pref => ({
      ...pref,
      investor_name: pref.users?.full_name,
      farm_name: pref.farms?.name
    }));
  },

  async getPreferencesByStatus(status: 'pending' | 'in_progress' | 'completed' | 'cancelled'): Promise<HarvestPreference[]> {
    const { data, error } = await supabase
      .from('harvest_preferences')
      .select(`
        *,
        users:investor_id(full_name),
        farms:farm_id(name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching preferences by status:', error);
      throw error;
    }

    return (data || []).map(pref => ({
      ...pref,
      investor_name: pref.users?.full_name,
      farm_name: pref.farms?.name
    }));
  },

  async updatePreference(preferenceId: string, updates: Partial<CreateHarvestPreferenceInput> & { status?: string; processing_notes?: string }): Promise<HarvestPreference> {
    const { data, error } = await supabase
      .from('harvest_preferences')
      .update(updates)
      .eq('id', preferenceId)
      .select(`
        *,
        users:investor_id(full_name),
        farms:farm_id(name)
      `)
      .single();

    if (error) {
      console.error('Error updating preference:', error);
      throw error;
    }

    return {
      ...data,
      investor_name: data.users?.full_name,
      farm_name: data.farms?.name
    };
  },

  async updatePreferenceStatus(preferenceId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled', processingNotes?: string): Promise<void> {
    const updates: any = { status };
    if (processingNotes) {
      updates.processing_notes = processingNotes;
    }

    const { error } = await supabase
      .from('harvest_preferences')
      .update(updates)
      .eq('id', preferenceId);

    if (error) {
      console.error('Error updating preference status:', error);
      throw error;
    }
  },

  async deletePreference(preferenceId: string): Promise<void> {
    const { error } = await supabase
      .from('harvest_preferences')
      .delete()
      .eq('id', preferenceId);

    if (error) {
      console.error('Error deleting preference:', error);
      throw error;
    }
  }
};
