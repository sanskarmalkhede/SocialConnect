'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationList } from '@/components/notifications/NotificationItem'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Bell, CheckCheck, Trash2 } from 'lucide-react'
import type { Notification } from '@/types'
import { useAuth } from '@/lib/auth/auth-helpers'
import { supabase } from '@/lib/supabase/client'
import { deleteAllNotifications, markAllNotificationsAsRead, markNotificationAsRead, deleteNotification, getUserNotifications } from '@/lib/notifications/notification-service'

export default function NotificationsPage() {
  const { profile: currentUser, isLoading: _authLoading } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadNotifications = async () => {
      if (!currentUser) return
      setIsLoading(true)
      try {
        const res = await getUserNotifications(currentUser.id, 1, 50)
        setNotifications(res.notifications || [])
      } catch (_err) { // eslint-disable-line @typescript-eslint/no-unused-vars
        // swallow - UI will show empty state
        setNotifications([])
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()

    // Setup real-time subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${currentUser?.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const handleMarkAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
    // Attempt backend update, ignore errors for now
    try {
      await markNotificationAsRead(notificationId, currentUser?.id)
    } catch (_err) { // eslint-disable-line @typescript-eslint/no-unused-vars
    }
  }

  const handleDelete = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    try {
      await deleteNotification(notificationId, currentUser?.id)
    } catch (_err) { // eslint-disable-line @typescript-eslint/no-unused-vars
    }
  }

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    try {
      await markAllNotificationsAsRead(currentUser!.id)
    } catch (_err) { // eslint-disable-line @typescript-eslint/no-unused-vars
    }
  }

  const handleDeleteAll = async () => {
    setNotifications([])
    try {
      await deleteAllNotifications(currentUser!.id)
    } catch (_err) { // eslint-disable-line @typescript-eslint/no-unused-vars
    }
  }

  const unreadNotifications = notifications.filter(n => !n.is_read)
  const _readNotifications = notifications.filter(n => n.is_read)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentUser) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="ml-4 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h1 className="font-semibold">Notifications</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Notifications</h2>
              <p className="text-muted-foreground">
                {unreadNotifications.length} unread notifications
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadNotifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark all read
                </Button>
              )}
              
              {notifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleDeleteAll}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Notifications */}
          {notifications.length > 0 ? (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Unread ({unreadNotifications.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <Card>
                  <CardContent className="p-0">
                    <NotificationList
                      notifications={notifications}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="unread">
                <Card>
                  <CardContent className="p-0">
                    {unreadNotifications.length > 0 ? (
                      <NotificationList
                        notifications={unreadNotifications}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                      />
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No unread notifications
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                <p className="text-muted-foreground">
                  When someone follows you, likes your posts, or comments, you&apos;ll see it here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
