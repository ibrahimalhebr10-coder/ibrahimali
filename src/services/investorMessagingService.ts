import { supabase } from '../lib/supabase';

export interface InvestorMessage {
  id: string;
  farm_id: string;
  sender_id: string;
  title: string;
  content: string;
  summary_data?: Record<string, any>;
  image_urls: string[];
  sent_at: string;
  recipients_count: number;
  read_count: number;
  created_at: string;
  updated_at: string;
}

export interface InvestorMessageRecipient {
  id: string;
  message_id: string;
  investor_id: string;
  reservation_id: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface InvestorMessageWithDetails extends InvestorMessage {
  farms?: {
    id: string;
    name_ar: string;
    name_en: string;
    location?: string;
  };
  admins?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface CreateMessageData {
  farm_id: string;
  title: string;
  content: string;
  summary_data?: Record<string, any>;
  image_urls?: string[];
}

export const investorMessagingService = {
  async getMessagesForFarm(farmId: string): Promise<InvestorMessageWithDetails[]> {
    const { data, error } = await supabase
      .from('investor_messages')
      .select(`
        *,
        farms:farm_id(id, name_ar, name_en, location),
        admins:sender_id(id, email, full_name)
      `)
      .eq('farm_id', farmId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    return data || [];
  },

  async getAllMessagesForAdmin(): Promise<InvestorMessageWithDetails[]> {
    const { data, error } = await supabase
      .from('investor_messages')
      .select(`
        *,
        farms:farm_id(id, name_ar, name_en, location),
        admins:sender_id(id, email, full_name)
      `)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Error fetching all messages:', error);
      throw error;
    }

    return data || [];
  },

  async getMessageById(messageId: string): Promise<InvestorMessageWithDetails | null> {
    const { data, error } = await supabase
      .from('investor_messages')
      .select(`
        *,
        farms:farm_id(id, name_ar, name_en, location),
        admins:sender_id(id, email, full_name)
      `)
      .eq('id', messageId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching message:', error);
      throw error;
    }

    return data;
  },

  async getInvestorsForFarm(farmId: string): Promise<Array<{
    investor_id: string;
    reservation_id: string;
    email: string;
    full_name?: string;
    trees_count: number;
  }>> {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        user_id,
        trees_count,
        users:user_id(id, email, raw_user_meta_data)
      `)
      .eq('farm_id', farmId)
      .eq('status', 'paid')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching investors:', error);
      throw error;
    }

    return (data || []).map((reservation: any) => ({
      investor_id: reservation.user_id,
      reservation_id: reservation.id,
      email: reservation.users?.email || '',
      full_name: reservation.users?.raw_user_meta_data?.full_name,
      trees_count: reservation.trees_count || 0
    }));
  },

  async createMessage(messageData: CreateMessageData, senderId: string): Promise<string> {
    const investors = await this.getInvestorsForFarm(messageData.farm_id);

    if (investors.length === 0) {
      throw new Error('لا يوجد مستثمرون في هذه المزرعة');
    }

    const { data: message, error: messageError } = await supabase
      .from('investor_messages')
      .insert({
        farm_id: messageData.farm_id,
        sender_id: senderId,
        title: messageData.title,
        content: messageData.content,
        summary_data: messageData.summary_data || {},
        image_urls: messageData.image_urls || [],
        recipients_count: investors.length
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      throw messageError;
    }

    const recipients = investors.map(investor => ({
      message_id: message.id,
      investor_id: investor.investor_id,
      reservation_id: investor.reservation_id
    }));

    const { error: recipientsError } = await supabase
      .from('investor_message_recipients')
      .insert(recipients);

    if (recipientsError) {
      console.error('Error creating recipients:', recipientsError);
      throw recipientsError;
    }

    for (const investor of investors) {
      await supabase.from('notifications').insert({
        user_id: investor.investor_id,
        type: 'farm_update',
        title: messageData.title,
        message: `تحديث جديد من مزرعتك: ${messageData.title}`,
        is_read: false,
        action_url: `/investor-messages/${message.id}`
      });
    }

    return message.id;
  },

  async markMessageAsRead(messageId: string, investorId: string): Promise<void> {
    const { error } = await supabase
      .from('investor_message_recipients')
      .update({ is_read: true })
      .eq('message_id', messageId)
      .eq('investor_id', investorId);

    if (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  async getMessagesForInvestor(investorId: string): Promise<Array<InvestorMessageWithDetails & {
    is_read: boolean;
    read_at?: string;
  }>> {
    const { data, error } = await supabase
      .from('investor_message_recipients')
      .select(`
        is_read,
        read_at,
        investor_messages:message_id(
          *,
          farms:farm_id(id, name_ar, name_en, location),
          admins:sender_id(id, email, full_name)
        )
      `)
      .eq('investor_id', investorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching investor messages:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      ...item.investor_messages,
      is_read: item.is_read,
      read_at: item.read_at
    }));
  },

  async getMessageRecipients(messageId: string): Promise<Array<InvestorMessageRecipient & {
    email: string;
    full_name?: string;
  }>> {
    const { data, error } = await supabase
      .from('investor_message_recipients')
      .select(`
        *,
        users:investor_id(email, raw_user_meta_data)
      `)
      .eq('message_id', messageId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipients:', error);
      throw error;
    }

    return (data || []).map((recipient: any) => ({
      ...recipient,
      email: recipient.users?.email || '',
      full_name: recipient.users?.raw_user_meta_data?.full_name
    }));
  },

  async getFarmSummary(farmId: string): Promise<Record<string, any>> {
    const [tasksResult, maintenanceResult] = await Promise.all([
      supabase
        .from('farm_tasks')
        .select('status')
        .eq('farm_id', farmId),

      supabase
        .from('farms')
        .select('name_ar, name_en, location, status')
        .eq('id', farmId)
        .maybeSingle()
    ]);

    const tasks = tasksResult.data || [];
    const farm = maintenanceResult.data;

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;

    return {
      farm_name: farm?.name_ar || farm?.name_en || '',
      location: farm?.location || '',
      status: farm?.status || '',
      total_tasks: tasks.length,
      completed_tasks: completedTasks,
      in_progress_tasks: inProgressTasks,
      pending_tasks: pendingTasks,
      completion_rate: tasks.length > 0
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0
    };
  }
};
