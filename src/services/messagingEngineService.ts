import { supabase } from '../lib/supabase';

export type ChannelType = 'internal' | 'sms' | 'whatsapp_business';

export interface MessagePayload {
  recipient_id: string;
  recipient_phone?: string;
  subject?: string;
  content: string;
  template_id?: string;
  variables?: Record<string, string>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  preferred_channel?: ChannelType;
  farm_id?: string;
}

export interface ChannelProvider {
  id: string;
  channel_type: ChannelType;
  provider_name: string;
  is_active: boolean;
  config: Record<string, any>;
}

export interface SendResult {
  success: boolean;
  channel_used: ChannelType;
  message_id?: string;
  external_id?: string;
  error?: string;
  fallback_used?: boolean;
}

class MessagingEngineService {
  private async getActiveProviders(): Promise<ChannelProvider[]> {
    const { data, error } = await supabase
      .from('messaging_providers')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching active providers:', error);
      return [];
    }

    return data || [];
  }

  private async isChannelAvailable(channelType: ChannelType): Promise<boolean> {
    if (channelType === 'internal') {
      return true;
    }

    const providers = await this.getActiveProviders();
    return providers.some(p => p.channel_type === channelType && p.is_active);
  }

  private async sendViaInternal(payload: MessagePayload): Promise<SendResult> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          recipient_id: payload.recipient_id,
          subject: payload.subject || 'إشعار من النظام',
          content: payload.content,
          read: false,
          farm_id: payload.farm_id
        })
        .select()
        .single();

      if (error) throw error;

      await this.logMessage({
        channel: 'internal',
        recipient_id: payload.recipient_id,
        content: payload.content,
        status: 'delivered',
        message_id: message.id
      });

      return {
        success: true,
        channel_used: 'internal',
        message_id: message.id
      };
    } catch (error: any) {
      console.error('Internal send error:', error);
      return {
        success: false,
        channel_used: 'internal',
        error: error.message
      };
    }
  }

  private async sendViaSMS(payload: MessagePayload): Promise<SendResult> {
    try {
      const providers = await this.getActiveProviders();
      const smsProvider = providers.find(p => p.channel_type === 'sms');

      if (!smsProvider) {
        throw new Error('No active SMS provider found');
      }

      console.log(`[SMS Engine] Would send via ${smsProvider.provider_name}`);
      console.log(`[SMS Engine] To: ${payload.recipient_phone}`);
      console.log(`[SMS Engine] Message: ${payload.content}`);

      await this.logMessage({
        channel: 'sms',
        recipient_id: payload.recipient_id,
        recipient_phone: payload.recipient_phone,
        content: payload.content,
        status: 'pending',
        provider_id: smsProvider.id
      });

      return {
        success: true,
        channel_used: 'sms',
        external_id: `sms_pending_${Date.now()}`
      };
    } catch (error: any) {
      console.error('SMS send error:', error);
      return {
        success: false,
        channel_used: 'sms',
        error: error.message
      };
    }
  }

  private async sendViaWhatsApp(payload: MessagePayload): Promise<SendResult> {
    try {
      const providers = await this.getActiveProviders();
      const whatsappProvider = providers.find(p => p.channel_type === 'whatsapp_business');

      if (!whatsappProvider) {
        throw new Error('No active WhatsApp provider found');
      }

      console.log(`[WhatsApp Engine] Would send via ${whatsappProvider.provider_name}`);
      console.log(`[WhatsApp Engine] To: ${payload.recipient_phone}`);
      console.log(`[WhatsApp Engine] Message: ${payload.content}`);

      await this.logMessage({
        channel: 'whatsapp_business',
        recipient_id: payload.recipient_id,
        recipient_phone: payload.recipient_phone,
        content: payload.content,
        status: 'pending',
        provider_id: whatsappProvider.id
      });

      return {
        success: true,
        channel_used: 'whatsapp_business',
        external_id: `whatsapp_pending_${Date.now()}`
      };
    } catch (error: any) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        channel_used: 'whatsapp_business',
        error: error.message
      };
    }
  }

  private async logMessage(data: {
    channel: string;
    recipient_id: string;
    recipient_phone?: string;
    content: string;
    status: string;
    message_id?: string;
    provider_id?: string;
  }): Promise<void> {
    try {
      await supabase.from('messages_log').insert({
        channel: data.channel,
        recipient_id: data.recipient_id,
        recipient_phone: data.recipient_phone,
        message_content: data.content,
        status: data.status,
        internal_message_id: data.message_id,
        provider_id: data.provider_id,
        sent_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging message:', error);
    }
  }

  async send(payload: MessagePayload): Promise<SendResult> {
    const preferredChannel = payload.preferred_channel || 'internal';

    const isPreferredAvailable = await this.isChannelAvailable(preferredChannel);

    if (isPreferredAvailable) {
      let result: SendResult;

      switch (preferredChannel) {
        case 'sms':
          result = await this.sendViaSMS(payload);
          break;
        case 'whatsapp_business':
          result = await this.sendViaWhatsApp(payload);
          break;
        case 'internal':
        default:
          result = await this.sendViaInternal(payload);
          break;
      }

      if (result.success) {
        return result;
      }
    }

    const result = await this.sendViaInternal(payload);
    return {
      ...result,
      fallback_used: preferredChannel !== 'internal'
    };
  }

  async sendBulk(payloads: MessagePayload[]): Promise<SendResult[]> {
    const results: SendResult[] = [];

    for (const payload of payloads) {
      const result = await this.send(payload);
      results.push(result);
    }

    return results;
  }

  async getChannelStatus(): Promise<{
    internal: { available: boolean; always_active: true };
    sms: { available: boolean; provider?: string };
    whatsapp_business: { available: boolean; provider?: string };
  }> {
    const providers = await this.getActiveProviders();

    const smsProvider = providers.find(p => p.channel_type === 'sms');
    const whatsappProvider = providers.find(p => p.channel_type === 'whatsapp_business');

    return {
      internal: {
        available: true,
        always_active: true
      },
      sms: {
        available: !!smsProvider,
        provider: smsProvider?.provider_name
      },
      whatsapp_business: {
        available: !!whatsappProvider,
        provider: whatsappProvider?.provider_name
      }
    };
  }
}

export const messagingEngine = new MessagingEngineService();
