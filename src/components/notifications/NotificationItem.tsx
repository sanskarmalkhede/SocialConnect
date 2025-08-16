'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, UserPlus, MoreHorizontal, Check, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatRelativeTime, getInitials } from '@/lib/format'
import { markNotificationAsRead, deleteNotification } from '@/lib/notifications/notification-service'
import type { Notification } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (notificationId: string) => void
  onDelete?: (notificationId: string) => void
  onClick?: () => void
  className?: string
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  className
}: NotificationItemProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (notification.is_read || isLoading) return

    setIsLoading(true)
    try {
      await markNotificationAsRead(notification.id, notification.recipient_id)
      onMarkAsRead?.(notification.id)
      toast.success('Marked as read')
    } catch (error) {
      console.error('Mark as read error:', error)
      toast.error('Failed to mark as read')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLoading) return

    setIsLoading(true)
    try {
      await deleteNotification(notification.id, notification.recipient_id)
      onDelete?.(notification.id)
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Delete notification error:', error)
      toast.error('Failed to delete notification')
    } finally {
      setIsLoading(false)
    }
  }

  const getNotificationIcon = () => {
    switch (notification.notification_type) {
      case 'follow':
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const getNotificationLink = () => {
    if (notification.post_id) {
      return `/posts/${notification.post_id}`
    }
    if (notification.notification_type === 'follow' && notification.sender) {
      return `/profile/${notification.sender.username}`
    }
    return '#'
  }

  const NotificationContent = () => (
    <div 
      className={cn(
        'flex gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer',
        !notification.is_read && 'bg-blue-50 dark:bg-blue-950/20',
        className
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarImage 
            src={notification.sender?.avatar_url || undefined} 
            alt={notification.sender?.username || 'User'} 
          />
          <AvatarFallback className="text-xs">
            {getInitials(notification.sender?.username || 'U')}
          </AvatarFallback>
        </Avatar>
        
        {/* Notification type icon */}
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
          {getNotificationIcon()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-semibold">
                {notification.sender?.username || 'Someone'}
              </span>
              {' '}
              <span className="text-muted-foreground">
                {notification.message}
              </span>
            </p>
            
            {/* Post preview for post-related notifications */}
            {notification.post && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                "{notification.post.content}"
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(notification.created_at)}
              </span>
              
              {!notification.is_read && (
                <Badge variant="secondary" className="h-4 px-1 text-xs">
                  New
                </Badge>
              )}
              
              {notification.sender?.role === 'admin' && (
                <Badge variant="outline" className="h-4 px-1 text-xs">
                  Admin
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!notification.is_read && (
                <DropdownMenuItem onClick={handleMarkAsRead} disabled={isLoading}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark as read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={handleDelete} 
                disabled={isLoading}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="flex-shrink-0 mt-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        </div>
      )}
    </div>
  )

  const link = getNotificationLink()
  
  if (link && link !== '#') {
    return (
      <Link href={link} className="block group">
        <NotificationContent />
      </Link>
    )
  }

  return (
    <div className="group">
      <NotificationContent />
    </div>
  )
}

interface NotificationListProps {
  notifications: Notification[]
  onMarkAsRead?: (notificationId: string) => void
  onDelete?: (notificationId: string) => void
  className?: string
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  onDelete,
  className
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-muted-foreground">No notifications</p>
      </div>
    )
  }

  return (
    <div className={cn('divide-y', className)}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}