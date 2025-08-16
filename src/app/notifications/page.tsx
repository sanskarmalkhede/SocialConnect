'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationList } from '@/components/notifications/NotificationItem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Bell, CheckCheck, Trash2 } from 'lucide-react'
import type { Notification, Profile } from '@/lib/supabase/types'

export default function NotificationsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // In a real app, this would load notifications from the API
    // For demo purposes, we'll simulate data
    const mockUser: Profile = {
      id: '1',
      username: 'demo_user',
      bio: 'Welcome to SocialConnect!',
      avatar_url: null,
      role: 'user',
      profile_visibility: 'public',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      post_count: 0,
      follower_count: 0,
      following_count: 0
    }

    const mockNotifications: Notification[] = [
      {
        id: '1',
        recipient_id: '1',
        sender_id: '2',
        notification_type: 'follow',
        message: 'started following you',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        sender: {
          id: '2',
          username: 'john_doe',
          avatar_url: null,
          role: 'user',
          profile_visibility: 'public',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      {
        id: '2',
        recipient_id: '1',
        sender_id: '3',
        notification_type: 'like',
        post_id: 'post1',
        message: 'liked your post',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        sender: {
          id: '3',
          username: 'jane_smith',
          avatar_url: null,
          role: 'user',
          profile_visibility: 'public',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        post: {
          id: 'post1',
          content: 'This is a sample post content',
          image_url: null
        }
      },
      {
        id: '3',
        recipient_id: '1',
        sender_id: '4',
        notification_type: 'comment',
        post_id: 'post2',
        message: 'commented on your post',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        sender: {
          id: '4',
          username: 'mike_wilson',
          avatar_url: null,
          role: 'user',
          profile_visibility: 'public',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        post: {
          id: 'post2',
          content: 'Another sample post',
          image_url: null
        }
      }
    ]

    setCurrentUser(mockUser)
    setNotifications(mockNotifications)
    setIsLoading(false)
  }, [])

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    )
    console.log('Mark as read:', notificationId)
    // In a real app, this would call the API
  }

  const handleDelete = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    console.log('Delete notification:', notificationId)
    // In a real app, this would call the API
  }

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    console.log('Mark all as read')
    // In a real app, this would call the API
  }

  const handleDeleteAll = async () => {
    setNotifications([])
    console.log('Delete all notifications')
    // In a real app, this would call the API
  }

  const unreadNotifications = notifications.filter(n => !n.is_read)
  const readNotifications = notifications.filter(n => n.is_read)

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
                  When someone follows you, likes your posts, or comments, you'll see it here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}