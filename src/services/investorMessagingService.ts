import { supabase } from '../lib/supabase';
import { messagingEngine, ChannelType } from './messagingEngineService';

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
  preferred_channel?: ChannelType;
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

    const preferredChannel = messageData.preferred_channel || 'internal';

    for (const investor of investors) {
      await messagingEngine.send({
        recipient_id: investor.investor_id,
        recipient_phone: investor.email,
        subject: messageData.title,
        content: `تحديث جديد من مزرعتك: ${messageData.title}\n\n${messageData.content}`,
        preferred_channel: preferredChannel,
        farm_id: messageData.farm_id
      });

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
  },

  async getSuperAdminStats(): Promise<{
    total_messages: number;
    total_recipients: number;
    total_farms_messaged: number;
    total_farm_managers: number;
    avg_read_rate: number;
    messages_last_7_days: number;
    messages_last_30_days: number;
  }> {
    const [messagesResult, recipientsResult] = await Promise.all([
      supabase
        .from('investor_messages')
        .select('*'),

      supabase
        .from('investor_message_recipients')
        .select('*')
    ]);

    const messages = messagesResult.data || [];
    const recipients = recipientsResult.data || [];

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const messagesLast7Days = messages.filter(m =>
      new Date(m.sent_at) >= sevenDaysAgo
    ).length;

    const messagesLast30Days = messages.filter(m =>
      new Date(m.sent_at) >= thirtyDaysAgo
    ).length;

    const uniqueFarms = new Set(messages.map(m => m.farm_id)).size;
    const uniqueManagers = new Set(messages.map(m => m.sender_id)).size;

    const readRecipients = recipients.filter(r => r.is_read).length;
    const avgReadRate = recipients.length > 0
      ? Math.round((readRecipients / recipients.length) * 100)
      : 0;

    return {
      total_messages: messages.length,
      total_recipients: recipients.length,
      total_farms_messaged: uniqueFarms,
      total_farm_managers: uniqueManagers,
      avg_read_rate: avgReadRate,
      messages_last_7_days: messagesLast7Days,
      messages_last_30_days: messagesLast30Days
    };
  },

  async getAllMessagesWithStats(): Promise<Array<InvestorMessageWithDetails & {
    read_rate: number;
  }>> {
    const messages = await this.getAllMessagesForAdmin();

    return messages.map(message => ({
      ...message,
      read_rate: message.recipients_count > 0
        ? Math.round((message.read_count / message.recipients_count) * 100)
        : 0
    }));
  },

  async getFarmManagerStats(): Promise<Array<{
    admin_id: string;
    admin_name: string;
    admin_email: string;
    total_messages: number;
    total_recipients: number;
    last_message_date?: string;
    farms_count: number;
  }>> {
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('id, email, full_name')
      .eq('is_active', true);

    if (adminsError) throw adminsError;

    const stats = await Promise.all(
      (admins || []).map(async (admin) => {
        const [messagesResult, farmsResult] = await Promise.all([
          supabase
            .from('investor_messages')
            .select('sent_at, recipients_count')
            .eq('sender_id', admin.id)
            .order('sent_at', { ascending: false }),

          supabase
            .from('admin_farm_assignments')
            .select('farm_id', { count: 'exact', head: true })
            .eq('admin_id', admin.id)
            .eq('is_active', true)
        ]);

        const messages = messagesResult.data || [];
        const totalRecipients = messages.reduce((sum, m) => sum + (m.recipients_count || 0), 0);

        return {
          admin_id: admin.id,
          admin_name: admin.full_name || admin.email,
          admin_email: admin.email,
          total_messages: messages.length,
          total_recipients: totalRecipients,
          last_message_date: messages[0]?.sent_at,
          farms_count: farmsResult.count || 0
        };
      })
    );

    return stats.filter(s => s.total_messages > 0 || s.farms_count > 0);
  }
};
