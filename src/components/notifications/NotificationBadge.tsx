
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-helpers'
import { supabase } from '@/lib/supabase/client'
import { getUnreadNotificationCount } from '@/lib/notifications/notification-service'
import { Badge } from '@/components/ui/badge'

export function NotificationBadge() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    getUnreadNotificationCount(user.id).then(setUnreadCount)

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        () => {
          getUnreadNotificationCount(user.id).then(setUnreadCount)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  if (unreadCount === 0) {
    return null
  }

  return <Badge color="primary" className="ml-auto">{unreadCount}</Badge>
}
