import { supabase } from '@/lib/supabase/client'
import { handleDatabaseError, NotFoundError } from '@/lib/errors'
import type { Notification } from '@/lib/supabase/types'

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string, 
  page: number = 1, 
  limit: number = 20,
  unreadOnly: boolean = false
) {
  try {
    const offset = (page - 1) * limit

    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!notifications_sender_id_fkey (
          id,
          username,
          avatar_url,
          role
        ),
        post:posts (
          id,
          content,
          image_url
        )
      `, { count: 'exact' })
      .eq('recipient_id', userId)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw handleDatabaseError(error)
    }

    return {
      notifications: data as Notification[] || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > offset + limit
    }
  } catch (error) {
    throw error
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)

    if (error) {
      throw handleDatabaseError(error)
    }

    return count || 0
  } catch (error) {
    throw error
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('recipient_id', userId) // Ensure user owns the notification

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    throw error
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    throw error
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', userId) // Ensure user owns the notification

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    throw error
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_id', userId)

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    throw error
  }
}

/**
 * Create a follow notification
 */
export async function createFollowNotification(
  followerId: string, 
  followingId: string
): Promise<void> {
  try {
    // Don't create notification if user follows themselves
    if (followerId === followingId) return

    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: followingId,
        sender_id: followerId,
        notification_type: 'follow',
        message: 'started following you'
      })

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    throw error
  }
}

/**
 * Create a like notification
 */
export async function createLikeNotification(
  userId: string, 
  postId: string, 
  postAuthorId: string
): Promise<void> {
  try {
    // Don't create notification if user likes their own post
    if (userId === postAuthorId) return

    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: postAuthorId,
        sender_id: userId,
        notification_type: 'like',
        post_id: postId,
        message: 'liked your post'
      })

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    throw error
  }
}

/**
 * Create a comment notification
 */
export async function createCommentNotification(
  userId: string, 
  postId: string, 
  postAuthorId: string
): Promise<void> {
  try {
    // Don't create notification if user comments on their own post
    if (userId === postAuthorId) return

    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: postAuthorId,
        sender_id: userId,
        notification_type: 'comment',
        post_id: postId,
        message: 'commented on your post'
      })

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    throw error
  }
}

/**
 * Get notification by ID
 */
export async function getNotificationById(notificationId: string): Promise<Notification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!notifications_sender_id_fkey (
          id,
          username,
          avatar_url,
          role
        ),
        post:posts (
          id,
          content,
          image_url
        )
      `)
      .eq('id', notificationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Notification not found
      }
      throw handleDatabaseError(error)
    }

    return data as Notification
  } catch (error) {
    throw error
  }
}

/**
 * Clean up old notifications (older than 30 days)
 */
export async function cleanupOldNotifications(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', thirtyDaysAgo)
      .select('id')

    if (error) {
      throw handleDatabaseError(error)
    }

    return data?.length || 0
  } catch (error) {
    throw error
  }
}

/**
 * Get notification statistics for a user
 */
export async function getNotificationStats(userId: string) {
  try {
    // Get total notifications
    const { count: totalCount, error: totalError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)

    if (totalError) {
      throw handleDatabaseError(totalError)
    }

    // Get unread notifications
    const { count: unreadCount, error: unreadError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)

    if (unreadError) {
      throw handleDatabaseError(unreadError)
    }

    // Get notifications by type
    const { data: typeData, error: typeError } = await supabase
      .from('notifications')
      .select('notification_type')
      .eq('recipient_id', userId)

    if (typeError) {
      throw handleDatabaseError(typeError)
    }

    const typeStats = typeData?.reduce((acc, notification) => {
      acc[notification.notification_type] = (acc[notification.notification_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return {
      total: totalCount || 0,
      unread: unreadCount || 0,
      read: (totalCount || 0) - (unreadCount || 0),
      byType: typeStats
    }
  } catch (error) {
    console.error('Get notification stats error:', error)
    throw error
  }
}

/**
 * Bulk mark notifications as read
 */
export async function bulkMarkNotificationsAsRead(
  notificationIds: string[], 
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', notificationIds)
      .eq('recipient_id', userId) // Ensure user owns the notifications

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    console.error('Bulk mark notifications as read error:', error)
    throw error
  }
}

/**
 * Bulk delete notifications
 */
export async function bulkDeleteNotifications(
  notificationIds: string[], 
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds)
      .eq('recipient_id', userId) // Ensure user owns the notifications

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    console.error('Bulk delete notifications error:', error)
    throw error
  }
}

/**
 * Get recent activity notifications (for admin/moderation)
 */
export async function getRecentActivityNotifications(limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!notifications_sender_id_fkey (
          id,
          username,
          avatar_url,
          role
        ),
        recipient:profiles!notifications_recipient_id_fkey (
          id,
          username,
          avatar_url
        ),
        post:posts (
          id,
          content
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw handleDatabaseError(error)
    }

    return data as Notification[] || []
  } catch (error) {
    console.error('Get recent activity notifications error:', error)
    throw error
  }
}