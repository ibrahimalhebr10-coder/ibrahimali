import { supabase } from '../lib/supabase';

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export const systemSettingsService = {
  async getSetting(key: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;
      return data?.value || null;
    } catch (error) {
      console.error('Error fetching system setting:', error);
      return null;
    }
  },

  async getWhatsAppNumber(): Promise<string | null> {
    return this.getSetting('whatsapp_admin_number');
  },

  async isWhatsAppEnabled(): Promise<boolean> {
    const enabled = await this.getSetting('whatsapp_enabled');
    return enabled === 'true';
  },

  async getAllSettings(): Promise<SystemSetting[]> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching system settings:', error);
      return [];
    }
  },

  async updateSetting(key: string, value: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          value,
          updated_at: new Date().toISOString()
        })
        .eq('key', key);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating system setting:', error);
      return false;
    }
  },

  async updateWhatsAppNumber(phoneNumber: string): Promise<boolean> {
    return this.updateSetting('whatsapp_admin_number', phoneNumber);
  },

  async setWhatsAppEnabled(enabled: boolean): Promise<boolean> {
    return this.updateSetting('whatsapp_enabled', enabled ? 'true' : 'false');
  }
};
