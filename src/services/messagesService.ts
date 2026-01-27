import { supabase, initializeSupabase } from '../lib/supabase';

export interface Message {
  id: string;
  user_id: string | null;
  type: 'welcome' | 'admin' | 'operational' | 'farm_update' | 'important';
  priority: 'high' | 'medium' | 'low';
  title: string;
  content: string;
  is_read: boolean;
  category: 'important' | 'general';
  related_farm_id: string | null;
  action_url: string | null;
  created_at: string;
  read_at: string | null;
}

export async function getMessages(category?: 'important' | 'general'): Promise<Message[]> {
  try {
    await initializeSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.warn('Auth error in getMessages:', authError);
    }

    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.is('user_id', null);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error in getMessages:', error);
    return [];
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    await initializeSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.warn('Auth error in getUnreadCount:', authError);
    }

    let query = supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);

    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.is('user_id', null);
    }

    const { count, error } = await query;

    if (error) {
      console.warn('Database error in getUnreadCount:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    return 0;
  }
}

export async function markAsRead(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) throw error;
}

export async function markAllAsRead(): Promise<void> {
  try {
    await initializeSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('Cannot mark as read - no user session');
      return;
    }

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
  }
}

export async function createUserWelcomeMessages(userId: string): Promise<void> {
  const welcomeMessages = [
    {
      user_id: userId,
      type: 'admin',
      priority: 'high',
      title: 'مرحباً بك في عائلتنا!',
      content: 'شكراً لانضمامك إلى منصة الاستثمار الزراعي. نحن متحمسون لمرافقتك في رحلتك الاستثمارية. استكشف المزارع المتاحة وابدأ باختيار أول شجرة لك.',
      category: 'important',
      action_url: '/farms'
    },
    {
      user_id: userId,
      type: 'operational',
      priority: 'medium',
      title: 'كيف تبدأ؟',
      content: 'يمكنك الآن تصفح المزارع المتاحة واختيار نوع الشجرة المناسب لك. استخدم حاسبة الاستثمار لتقدير العوائد المتوقعة.',
      category: 'general',
      action_url: '/calculator'
    }
  ];

  const { error } = await supabase
    .from('messages')
    .insert(welcomeMessages);

  if (error) throw error;
}

export async function createFarmUpdateMessage(
  userId: string,
  farmId: string,
  title: string,
  content: string
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({
      user_id: userId,
      type: 'farm_update',
      priority: 'medium',
      title,
      content,
      category: 'general',
      related_farm_id: farmId
    });

  if (error) throw error;
}

export async function createImportantMessage(
  userId: string,
  title: string,
  content: string,
  actionUrl?: string
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({
      user_id: userId,
      type: 'important',
      priority: 'high',
      title,
      content,
      category: 'important',
      action_url: actionUrl
    });

  if (error) throw error;
}
