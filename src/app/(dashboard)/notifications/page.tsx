
'use client'

import { useEffect, useState } from 'react'
import { getNotifications, markNotificationsAsRead } from '@/lib/notifications/notification-service'
import { NotificationItem } from '@/components/notifications/NotificationItem'
import { Skeleton } from '@/components/ui/skeleton'
import { type Notification } from '@/types'
import { useAuth } from '@/lib/auth/auth-helpers'

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return
      setIsLoading(true)
      try {
        const fetchedNotifications = await getNotifications(user.id)
        setNotifications(fetchedNotifications)
        // Mark notifications as read when the page is viewed
        await markNotificationsAsRead(user.id)
      } catch (error) {
        console.error('Failed to fetch notifications', error)
      }
      setIsLoading(false)
    }

    fetchNotifications()
  }, [user])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {notifications.length > 0 ? (
        notifications.map(n => <NotificationItem key={n.id} notification={n} />)
      ) : (
        <p className="text-muted-foreground">You have no new notifications.</p>
      )}
    </div>
  )
}
