
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
