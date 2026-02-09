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
      console.log(`📝 [SYSTEM_SETTINGS] تحديث ${key} = ${value}`);

      // التحقق من وجود الإعداد أولاً
      const { data: existing, error: checkError } = await supabase
        .from('system_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      if (checkError) {
        console.error('❌ [SYSTEM_SETTINGS] خطأ في التحقق من الإعداد:', checkError);
        throw checkError;
      }

      if (existing) {
        // الإعداد موجود - تحديثه
        console.log(`🔄 [SYSTEM_SETTINGS] تحديث إعداد موجود: ${key}`);

        const { error } = await supabase
          .from('system_settings')
          .update({
            value,
            updated_at: new Date().toISOString()
          })
          .eq('key', key);

        if (error) {
          console.error('❌ [SYSTEM_SETTINGS] خطأ في التحديث:', error);
          throw error;
        }

        console.log(`✅ [SYSTEM_SETTINGS] تم تحديث ${key}`);
      } else {
        // الإعداد غير موجود - إنشاؤه
        console.log(`➕ [SYSTEM_SETTINGS] إنشاء إعداد جديد: ${key}`);

        const { error } = await supabase
          .from('system_settings')
          .insert({
            key,
            value,
            category: 'payment',
            description: `إعداد ${key}`
          });

        if (error) {
          console.error('❌ [SYSTEM_SETTINGS] خطأ في الإنشاء:', error);
          throw error;
        }

        console.log(`✅ [SYSTEM_SETTINGS] تم إنشاء ${key}`);
      }

      return true;
    } catch (error) {
      console.error(`❌ [SYSTEM_SETTINGS] خطأ في حفظ ${key}:`, error);
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
