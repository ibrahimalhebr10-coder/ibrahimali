import { supabase } from '../lib/supabase';

export interface ShareMessageTemplate {
  template: string;
  websiteUrl: string;
  enabled: boolean;
}

export interface ShareMessageVariables {
  partner_name: string;
  display_name: string;
  website_url: string;
}

export const partnerShareMessageService = {
  async getTemplate(): Promise<ShareMessageTemplate> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', [
          'partner_share_message_template',
          'partner_share_website_url',
          'partner_share_message_enabled'
        ]);

      if (error) throw error;

      const settings: Record<string, string> = {};
      data?.forEach(item => {
        settings[item.key] = item.value;
      });

      return {
        template: settings.partner_share_message_template || '',
        websiteUrl: settings.partner_share_website_url || 'https://ashjari.com',
        enabled: settings.partner_share_message_enabled === 'true'
      };
    } catch (error) {
      console.error('Error fetching share message template:', error);
      return {
        template: `مرحباً! أنا {display_name} - شريك نجاح في منصة حصص زراعية 🌿

عند حجزك، اكتب اسمي: {partner_name}

استثمر في مزارع حقيقية واربح من منتجاتها! 🌱

{website_url}`,
        websiteUrl: 'https://ashjari.com',
        enabled: true
      };
    }
  },

  async updateTemplate(template: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: template, updated_at: new Date().toISOString() })
        .eq('key', 'partner_share_message_template');

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating share message template:', error);
      return { success: false, error: error.message };
    }
  },

  async updateWebsiteUrl(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: url, updated_at: new Date().toISOString() })
        .eq('key', 'partner_share_website_url');

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating website URL:', error);
      return { success: false, error: error.message };
    }
  },

  async toggleEnabled(enabled: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: enabled.toString(), updated_at: new Date().toISOString() })
        .eq('key', 'partner_share_message_enabled');

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error toggling share message:', error);
      return { success: false, error: error.message };
    }
  },

  renderTemplate(template: string, variables: ShareMessageVariables): string {
    let rendered = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      rendered = rendered.replace(regex, value);
    });

    return rendered;
  },

  getAvailableVariables(): string[] {
    return ['{partner_name}', '{display_name}', '{website_url}'];
  }
};
