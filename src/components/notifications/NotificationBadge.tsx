'use client'

import { useEffect, useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getUnreadNotificationCount } from '@/lib/notifications/notification-service'
import type { Profile } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  currentUser?: Profile
  onClick?: () => void
  variant?: 'default' | 'button' | 'icon-only'
  size?: 'sm' | 'md' | 'lg'
  showAnimation?: boolean
  className?: string
}

export function NotificationBadge({
  currentUser,
  onClick,
  variant = 'default',
  size = 'md',
  showAnimation = true,
  className
}: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Load unread count
  const loadUnreadCount = async () => {
    if (!currentUser) return

    try {
      setIsLoading(true)
      const count = await getUnreadNotificationCount(currentUser.id)
      setUnreadCount(count)
    } catch (error) {
      // no-op
    } finally {
      setIsLoading(false)
    }
  }

  // Load initial unread count and refresh every minute
  useEffect(() => {
    if (currentUser) {
      loadUnreadCount()
      
      // Refresh count every minute
      const interval = setInterval(loadUnreadCount, 60000)
      
      return () => clearInterval(interval)
    }
  }, [currentUser])

  if (!currentUser || (unreadCount === 0 && variant === 'icon-only')) {
    return null
  }

  const renderContent = () => {
    switch (variant) {
      case 'button':
        return (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'gap-2',
              showAnimation && unreadCount > 0 && 'animate-pulse',
              className
            )}
            onClick={onClick}
            disabled={isLoading}
          >
            {unreadCount > 0 ? (
              <BellRing className={cn(
                size === 'sm' && 'h-3 w-3',
                size === 'md' && 'h-4 w-4',
                size === 'lg' && 'h-5 w-5'
              )} />
            ) : (
              <Bell className={cn(
                size === 'sm' && 'h-3 w-3',
                size === 'md' && 'h-4 w-4',
                size === 'lg' && 'h-5 w-5'
              )} />
            )}
            {unreadCount} Notification{unreadCount !== 1 ? 's' : ''}
          </Button>
        )

      case 'icon-only':
        return (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'relative',
              showAnimation && unreadCount > 0 && 'animate-pulse',
              className
            )}
            onClick={onClick}
            disabled={isLoading}
          >
            {unreadCount > 0 ? (
              <BellRing className={cn(
                size === 'sm' && 'h-3 w-3',
                size === 'md' && 'h-4 w-4',
                size === 'lg' && 'h-5 w-5'
              )} />
            ) : (
              <Bell className={cn(
                size === 'sm' && 'h-3 w-3',
                size === 'md' && 'h-4 w-4',
                size === 'lg' && 'h-5 w-5'
              )} />
            )}
            <Badge
              variant="destructive"
              className={cn(
                'absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]',
                size === 'sm' && 'h-3 w-3 text-[8px]',
                size === 'lg' && 'h-5 w-5 text-xs'
              )}
            >
              {unreadCount}
            </Badge>
          </Button>
        )

      default:
        return (
          <div
            className={cn(
              'inline-flex items-center gap-2',
              showAnimation && unreadCount > 0 && 'animate-pulse',
              className
            )}
            role="status"
          >
            {unreadCount > 0 ? (
              <BellRing className={cn(
                size === 'sm' && 'h-3 w-3',
                size === 'md' && 'h-4 w-4',
                size === 'lg' && 'h-5 w-5'
              )} />
            ) : (
              <Bell className={cn(
                size === 'sm' && 'h-3 w-3',
                size === 'md' && 'h-4 w-4',
                size === 'lg' && 'h-5 w-5'
              )} />
            )}
            <span>
              {unreadCount} Notification{unreadCount !== 1 ? 's' : ''}
            </span>
          </div>
        )
    }
  }

  return renderContent()
}
