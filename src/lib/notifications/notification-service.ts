
import { supabase } from '@/lib/supabase/client'
import { handleDatabaseError } from '@/lib/errors'
import type { Notification } from '@/types'

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, sender:profiles!sender_id(*)')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw handleDatabaseError(error)
  }
  return data as Notification[]
}

export async function markNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', userId)
    .eq('is_read', false)

  if (error) {
    throw handleDatabaseError(error)
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false)

  if (error) {
    throw handleDatabaseError(error)
  }
  return count || 0
}

export async function getNotificationStats(userId: string): Promise<{ total: number; unread: number; read: number }> {
  const { count: total, error: totalError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId);

  if (totalError) {
    throw handleDatabaseError(totalError);
  }

  const { count: unread, error: unreadError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (unreadError) {
    throw handleDatabaseError(unreadError);
  }

  const read = (total || 0) - (unread || 0);

  return { total: total || 0, unread: unread || 0, read };
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('recipient_id', userId);

  if (error) {
    throw handleDatabaseError(error);
  }
}

export async function deleteAllNotifications(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('recipient_id', userId);

  if (error) {
    throw handleDatabaseError(error);
  }
}
