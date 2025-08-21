'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getUnreadNotificationCount, markNotificationAsRead, deleteNotification } from '@/lib/notifications/notification-service'
import type { Notification } from '@/types'

export function useNotificationRealtime(userId?: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeNotifications, setRealtimeNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsConnected(false);
      return;
    }

    // Initial fetch of unread count
    getUnreadNotificationCount(userId)
      .then(count => setUnreadCount(count))
      .catch(() => setUnreadCount(0));

    // Setup Supabase Realtime subscription
    const channel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          setRealtimeNotifications((prev) => [payload.new as Notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          // Handle updates, e.g., marking as read
          setRealtimeNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
          );
          if (payload.old.is_read === false && payload.new.is_read === true) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          setRealtimeNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          if (payload.old.is_read === false) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId, userId!);
      // Optimistic update handled by the UPDATE event listener
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const removeNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId, userId!);
      // Optimistic update handled by the DELETE event listener
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return { unreadCount, realtimeNotifications, isConnected, markAsRead, removeNotification };
}
