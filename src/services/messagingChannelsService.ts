import { supabase } from '../lib/supabase';

export type ChannelType = 'sms' | 'whatsapp_business' | 'email';

export interface SMSProviderConfig {
  api_base_url: string;
  api_key: string;
  sender_id: string;
  delivery_report_endpoint: string;
  supports_unicode?: boolean;
  max_message_length?: number;
}

export interface WhatsAppProviderConfig {
  api_base_url: string;
  api_key: string;
  phone_number_id: string;
  business_account_id: string;
  webhook_verify_token: string;
  webhook_endpoint: string;
}

export interface EmailProviderConfig {
  api_base_url: string;
  api_key: string;
  from_email: string;
  from_name: string;
}

export type ProviderConfig = SMSProviderConfig | WhatsAppProviderConfig | EmailProviderConfig;

export interface MessagingProvider {
  id: string;
  channel_type: ChannelType;
  provider_name: string;
  is_active: boolean;
  is_default: boolean;
  config: ProviderConfig;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface MessagingChannelStats {
  id: string;
  provider_id: string;
  messages_sent: number;
  messages_delivered: number;
  messages_failed: number;
  last_sent_at?: string;
  month: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProviderData {
  channel_type: ChannelType;
  provider_name: string;
  is_active: boolean;
  is_default: boolean;
  config: ProviderConfig;
}

export interface UpdateProviderData {
  provider_name?: string;
  is_active?: boolean;
  is_default?: boolean;
  config?: ProviderConfig;
}

class MessagingChannelsService {
  async getProviders(channelType?: ChannelType): Promise<MessagingProvider[]> {
    let query = supabase
      .from('messaging_providers')
      .select('*')
      .order('created_at', { ascending: false });

    if (channelType) {
      query = query.eq('channel_type', channelType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getProvider(id: string): Promise<MessagingProvider | null> {
    const { data, error } = await supabase
      .from('messaging_providers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getDefaultProvider(channelType: ChannelType): Promise<MessagingProvider | null> {
    const { data, error } = await supabase
      .from('messaging_providers')
      .select('*')
      .eq('channel_type', channelType)
      .eq('is_default', true)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createProvider(providerData: CreateProviderData): Promise<MessagingProvider> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!admin) throw new Error('Admin not found');

    const { data, error } = await supabase
      .from('messaging_providers')
      .insert({
        ...providerData,
        created_by: admin.id,
        updated_by: admin.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProvider(id: string, updates: UpdateProviderData): Promise<MessagingProvider> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!admin) throw new Error('Admin not found');

    const { data, error } = await supabase
      .from('messaging_providers')
      .update({
        ...updates,
        updated_by: admin.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteProvider(id: string): Promise<void> {
    const { error } = await supabase
      .from('messaging_providers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleProviderStatus(id: string, isActive: boolean): Promise<void> {
    await this.updateProvider(id, { is_active: isActive });
  }

  async setDefaultProvider(id: string): Promise<void> {
    await this.updateProvider(id, { is_default: true });
  }

  async getChannelStats(providerId: string, month?: string): Promise<MessagingChannelStats[]> {
    let query = supabase
      .from('messaging_channel_stats')
      .select('*')
      .eq('provider_id', providerId)
      .order('month', { ascending: false });

    if (month) {
      query = query.eq('month', month);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getTotalStats(channelType: ChannelType): Promise<{
    total_sent: number;
    total_delivered: number;
    total_failed: number;
  }> {
    const providers = await this.getProviders(channelType);
    const providerIds = providers.map(p => p.id);

    if (providerIds.length === 0) {
      return { total_sent: 0, total_delivered: 0, total_failed: 0 };
    }

    const { data, error } = await supabase
      .from('messaging_channel_stats')
      .select('messages_sent, messages_delivered, messages_failed')
      .in('provider_id', providerIds);

    if (error) throw error;

    const totals = (data || []).reduce((acc, stat) => ({
      total_sent: acc.total_sent + (stat.messages_sent || 0),
      total_delivered: acc.total_delivered + (stat.messages_delivered || 0),
      total_failed: acc.total_failed + (stat.messages_failed || 0)
    }), { total_sent: 0, total_delivered: 0, total_failed: 0 });

    return totals;
  }

  async isChannelConfigured(channelType: ChannelType): Promise<boolean> {
    const provider = await this.getDefaultProvider(channelType);
    return provider !== null;
  }

  async isChannelActive(channelType: ChannelType): Promise<boolean> {
    const { data, error } = await supabase
      .from('messaging_providers')
      .select('id')
      .eq('channel_type', channelType)
      .eq('is_active', true)
      .maybeSingle();

    if (error) return false;
    return data !== null;
  }
}

export const messagingChannelsService = new MessagingChannelsService();
