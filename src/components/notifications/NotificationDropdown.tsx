'use client'

import { useState, useEffect } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react' // Removed unused icons
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu' // Removed unused DropdownMenu components
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { NotificationItem } from './NotificationItem'
import { getUserNotifications, markAllNotificationsAsRead, getUnreadNotificationCount } from '@/lib/notifications/notification-service' // Removed markNotificationAsRead, deleteNotification
import type { Notification, Profile } from '@/types' // Changed from @/lib/supabase/types
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface NotificationDropdownProps {
  currentUser?: Profile
  className?: string
}

import { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { NotificationItem } from './NotificationItem'
import { getUserNotifications, markAllNotificationsAsRead } from '@/lib/notifications/notification-service'
import type { Notification, Profile } from '@/types'
import { cn } from '@/lib/utils'
import { useNotificationRealtime } from '@/hooks/use-notification-realtime'

interface NotificationDropdownProps {
  currentUser?: Profile
  className?: string
}

export function NotificationDropdown({
  currentUser,
  className
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  
  const { unreadCount, realtimeNotifications, isConnected, markAsRead, removeNotification } = useNotificationRealtime(currentUser?.id);

  const loadNotifications = useCallback(async (pageNum: number = 1) => {
    if (!currentUser || isLoading) return

    setIsLoading(true)
    try {
      const result = await getUserNotifications(currentUser.id, pageNum, 20)
      
      if (pageNum === 1) {
        setNotifications(result.notifications)
      } else {
        setNotifications(prev => [...prev, ...result.notifications])
      }
      
      setHasMore(result.hasMore)
      setPage(pageNum)
    } catch (error) {
      console.error('Load notifications error:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, isLoading])

  useEffect(() => {
    if (isOpen && currentUser && notifications.length === 0) {
      loadNotifications()
    }
  }, [isOpen, currentUser, notifications.length, loadNotifications])

  useEffect(() => {
    if (realtimeNotifications.length > 0) {
      setNotifications(realtimeNotifications)
    }
  }, [realtimeNotifications])

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return

    try {
      await markAllNotificationsAsRead(currentUser.id)
      // The unread count will be updated by the realtime hook's UPDATE listener
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Mark all as read error:', error)
      toast.error('Failed to mark notifications as read')
    }
  }

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadNotifications(page + 1)
    }
  }

  if (!currentUser) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('relative', className)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
                {!isConnected && (
                  <div className="h-2 w-2 rounded-full bg-yellow-500" title="Reconnecting..." />
                )}
              </CardTitle>
              
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-6 px-2 text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {isLoading && notifications.length === 0 ? (
                // Loading skeletons
                <div className="space-y-2 p-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3 p-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={removeNotification}
                      onClick={() => setIsOpen(false)}
                    />
                  ))}
                  
                  {hasMore && (
                    <div className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadMore}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Loading...' : 'Load more'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No notifications yet
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface CompactNotificationDropdownProps extends NotificationDropdownProps {
  showBadgeOnly?: boolean
}

export function CompactNotificationDropdown({
  showBadgeOnly = false,
  ...props
}: CompactNotificationDropdownProps) {
  const { unreadCount } = useNotificationRealtime(props.currentUser?.id)

  if (showBadgeOnly) {
    return (
      <div className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </div>
    )
  }

  return <NotificationDropdown {...props} />
}