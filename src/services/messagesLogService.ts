import { supabase } from '../lib/supabase';

export interface MessageLog {
  id: string;
  investor_id: string | null;
  investor_name: string;
  message_type: string;
  template_id: string | null;
  template_name: string | null;
  channel: string;
  subject: string | null;
  content: string;
  sent_by: string | null;
  sent_by_name: string | null;
  farm_id: string | null;
  farm_name: string | null;
  reservation_id: string | null;
  payment_id: string | null;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MessageLogFilters {
  message_type?: string;
  channel?: string;
  status?: string;
  investor_id?: string;
  farm_id?: string;
  sent_by?: string;
  date_from?: string;
  date_to?: string;
}

export const messagesLogService = {
  async getAllMessages(filters?: MessageLogFilters): Promise<MessageLog[]> {
    let query = supabase
      .from('messages_log')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.message_type) {
      query = query.eq('message_type', filters.message_type);
    }

    if (filters?.channel) {
      query = query.eq('channel', filters.channel);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.investor_id) {
      query = query.eq('investor_id', filters.investor_id);
    }

    if (filters?.farm_id) {
      query = query.eq('farm_id', filters.farm_id);
    }

    if (filters?.sent_by) {
      query = query.eq('sent_by', filters.sent_by);
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getMessageById(id: string): Promise<MessageLog | null> {
    const { data, error } = await supabase
      .from('messages_log')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async logMessage(message: Omit<MessageLog, 'id' | 'created_at'>): Promise<MessageLog> {
    const { data, error } = await supabase
      .from('messages_log')
      .insert([message])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMessageStats(): Promise<{
    total: number;
    by_type: Record<string, number>;
    by_channel: Record<string, number>;
    by_status: Record<string, number>;
    recent_count: number;
  }> {
    const { data: all, error: allError } = await supabase
      .from('messages_log')
      .select('message_type, channel, status, created_at');

    if (allError) throw allError;

    const stats = {
      total: all?.length || 0,
      by_type: {} as Record<string, number>,
      by_channel: {} as Record<string, number>,
      by_status: {} as Record<string, number>,
      recent_count: 0
    };

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    all?.forEach((msg) => {
      stats.by_type[msg.message_type] = (stats.by_type[msg.message_type] || 0) + 1;
      stats.by_channel[msg.channel] = (stats.by_channel[msg.channel] || 0) + 1;
      stats.by_status[msg.status] = (stats.by_status[msg.status] || 0) + 1;

      if (new Date(msg.created_at) > oneDayAgo) {
        stats.recent_count++;
      }
    });

    return stats;
  },

  async getInvestorMessages(investorId: string): Promise<MessageLog[]> {
    const { data, error } = await supabase
      .from('messages_log')
      .select('*')
      .eq('investor_id', investorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getFarmMessages(farmId: string): Promise<MessageLog[]> {
    const { data, error } = await supabase
      .from('messages_log')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
