import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import type { Notification } from '@/lib/supabase/types'

export type NotificationEvent = {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  notification: Notification
}

export type NotificationEventHandler = (event: NotificationEvent) => void

/**
 * Real-time notification subscription manager
 */
export class NotificationRealtimeService {
  private channel: RealtimeChannel | null = null
  private handlers: Set<NotificationEventHandler> = new Set()
  private userId: string | null = null

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribe(userId: string): void {
    if (this.channel && this.userId === userId) {
      return // Already subscribed for this user
    }

    this.unsubscribe() // Clean up existing subscription
    this.userId = userId

    this.channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          this.handleRealtimeEvent(payload)
        }
      )
      .subscribe((status) => {
        console.log('Notification subscription status:', status)
      })
  }

  /**
   * Unsubscribe from real-time notifications
   */
  unsubscribe(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel)
      this.channel = null
    }
    this.userId = null
  }

  /**
   * Add event handler
   */
  addHandler(handler: NotificationEventHandler): void {
    this.handlers.add(handler)
  }

  /**
   * Remove event handler
   */
  removeHandler(handler: NotificationEventHandler): void {
    this.handlers.delete(handler)
  }

  /**
   * Handle real-time events from Supabase
   */
  private handleRealtimeEvent(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload

    let notification: Notification
    let type: 'INSERT' | 'UPDATE' | 'DELETE'

    switch (eventType) {
      case 'INSERT':
        notification = newRecord as Notification
        type = 'INSERT'
        break
      case 'UPDATE':
        notification = newRecord as Notification
        type = 'UPDATE'
        break
      case 'DELETE':
        notification = oldRecord as Notification
        type = 'DELETE'
        break
      default:
        return
    }

    // Notify all handlers
    this.handlers.forEach(handler => {
      try {
        handler({ type, notification })
      } catch (error) {
        console.error('Error in notification handler:', error)
      }
    })
  }

  /**
   * Get subscription status
   */
  isSubscribed(): boolean {
    return this.channel !== null
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.userId
  }
}

// Global instance
export const notificationRealtimeService = new NotificationRealtimeService()

/**
 * React hook for real-time notifications
 */
export function useNotificationRealtime(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!userId) {
      notificationRealtimeService.unsubscribe()
      setIsConnected(false)
      return
    }

    const handleNotificationEvent = (event: NotificationEvent) => {
      const { type, notification } = event

      switch (type) {
        case 'INSERT':
          setNotifications(prev => [notification, ...prev])
          if (!notification.is_read) {
            setUnreadCount(prev => prev + 1)
          }
          // Show browser notification if permission granted
          showBrowserNotification(notification)
          break

        case 'UPDATE':
          setNotifications(prev => 
            prev.map(n => n.id === notification.id ? notification : n)
          )
          // Update unread count if read status changed
          if (notification.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
          break

        case 'DELETE':
          setNotifications(prev => 
            prev.filter(n => n.id !== notification.id)
          )
          if (!notification.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
          break
      }
    }

    notificationRealtimeService.addHandler(handleNotificationEvent)
    notificationRealtimeService.subscribe(userId)
    setIsConnected(true)

    return () => {
      notificationRealtimeService.removeHandler(handleNotificationEvent)
      notificationRealtimeService.unsubscribe()
      setIsConnected(false)
    }
  }, [userId])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, is_read: true }))
    )
    setUnreadCount(0)
  }, [])

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId)
      if (notification && !notification.is_read) {
        setUnreadCount(count => Math.max(0, count - 1))
      }
      return prev.filter(n => n.id !== notificationId)
    })
  }, [])

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    setNotifications,
    setUnreadCount
  }
}

/**
 * Show browser notification
 */
function showBrowserNotification(notification: Notification) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  const title = getNotificationTitle(notification)
  const options: NotificationOptions = {
    body: notification.message,
    icon: notification.sender?.avatar_url || '/default-avatar.png',
    badge: '/notification-badge.png',
    tag: notification.id, // Prevent duplicate notifications
    requireInteraction: false,
    silent: false
  }

  const browserNotification = new Notification(title, options)

  // Auto-close after 5 seconds
  setTimeout(() => {
    browserNotification.close()
  }, 5000)

  // Handle click
  browserNotification.onclick = () => {
    window.focus()
    // Navigate to relevant page based on notification type
    if (notification.post_id) {
      window.location.href = `/posts/${notification.post_id}`
    } else if (notification.notification_type === 'follow') {
      window.location.href = `/profile/${notification.sender?.username}`
    }
    browserNotification.close()
  }
}

/**
 * Get notification title based on type
 */
function getNotificationTitle(notification: Notification): string {
  const senderName = notification.sender?.username || 'Someone'
  
  switch (notification.notification_type) {
    case 'follow':
      return `${senderName} started following you`
    case 'like':
      return `${senderName} liked your post`
    case 'comment':
      return `${senderName} commented on your post`
    default:
      return 'New notification'
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  const permission = await Notification.requestPermission()
  return permission
}

/**
 * Check if notifications are supported and enabled
 */
export function areNotificationsSupported(): boolean {
  return 'Notification' in window
}

export function areNotificationsEnabled(): boolean {
  return areNotificationsSupported() && Notification.permission === 'granted'
}