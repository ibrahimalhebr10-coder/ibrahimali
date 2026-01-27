import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type NotificationInsert = Database['public']['Tables']['user_notifications']['Insert']

export const notificationService = {
  async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getUnreadNotifications(userId: string) {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getLatestNotification(userId: string) {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
  },

  async createNotification(notification: NotificationInsert) {
    const { data, error } = await supabase
      .from('user_notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('user_notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
  }
}
