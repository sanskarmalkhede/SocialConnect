'use client'

import { useEffect, useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNotificationRealtime } from '@/lib/notifications/realtime-service'
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
  const [initialCount, setInitialCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const {
    unreadCount,
    isConnected,
    setUnreadCount
  } = useNotificationRealtime(currentUser?.id)

  // Load initial unread count
  useEffect(() => {
    if (currentUser) {
      loadInitialCount()
    }
  }, [currentUser])

  // Set initial count to realtime service
  useEffect(() => {
    if (initialCount > 0 && unreadCount === 0) {
      setUnreadCount(initialCount)
    }
  }, [initialCount, unreadCount, setUnreadCount])

  const loadInitialCount = async () => {
    if (!currentUser) return

    setIsLoading(true)
    try {
      const count = await getUnreadNotificationCount(currentUser.id)
      setInitialCount(count)
      setUnreadCount(count)
    } catch (error) {
      console.error('Load initial notification count error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const badgeSizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm'
  }

  if (!currentUser) {
    return null
  }

  const formatCount = (count: number) => {
    if (count > 99) return '99+'
    return count.toString()
  }

  const BellIcon = unreadCount > 0 && showAnimation ? BellRing : Bell

  if (variant === 'icon-only') {
    return (
      <div className={cn('relative', className)} onClick={onClick}>
        <BellIcon className={cn(sizeClasses[size], unreadCount > 0 && showAnimation && 'animate-pulse')} />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className={cn(
              'absolute -top-1 -right-1 p-0 flex items-center justify-center',
              badgeSizeClasses[size]
            )}
          >
            {formatCount(unreadCount)}
          </Badge>
        )}
        {!isConnected && (
          <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-yellow-500" />
        )}
      </div>
    )
  }

  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={onClick}
        className={cn('relative', className)}
        disabled={isLoading}
      >
        <BellIcon className={cn(sizeClasses[size], unreadCount > 0 && showAnimation && 'animate-pulse')} />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className={cn(
              'absolute -top-1 -right-1 p-0 flex items-center justify-center',
              badgeSizeClasses[size]
            )}
          >
            {formatCount(unreadCount)}
          </Badge>
        )}
        {!isConnected && (
          <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-yellow-500" />
        )}
      </Button>
    )
  }

  return (
    <div className={cn('relative inline-flex items-center', className)} onClick={onClick}>
      <BellIcon className={cn(sizeClasses[size], unreadCount > 0 && showAnimation && 'animate-pulse')} />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className={cn(
            'absolute -top-2 -right-2 p-0 flex items-center justify-center',
            badgeSizeClasses[size]
          )}
        >
          {formatCount(unreadCount)}
        </Badge>
      )}
      {!isConnected && (
        <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-yellow-500" title="Reconnecting..." />
      )}
    </div>
  )
}

interface NotificationCounterProps {
  currentUser?: Profile
  className?: string
}

export function NotificationCounter({
  currentUser,
  className
}: NotificationCounterProps) {
  const { unreadCount } = useNotificationRealtime(currentUser?.id)

  if (!currentUser || unreadCount === 0) {
    return null
  }

  return (
    <Badge variant="destructive" className={cn('ml-2', className)}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  )
}

interface NotificationStatusProps {
  currentUser?: Profile
  showText?: boolean
  className?: string
}

export function NotificationStatus({
  currentUser,
  showText = true,
  className
}: NotificationStatusProps) {
  const { unreadCount, isConnected } = useNotificationRealtime(currentUser?.id)

  if (!currentUser) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <div className={cn(
        'h-2 w-2 rounded-full',
        isConnected ? 'bg-green-500' : 'bg-yellow-500'
      )} />
      {showText && (
        <span className="text-muted-foreground">
          {isConnected ? (
            unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'
          ) : (
            'Reconnecting...'
          )}
        </span>
      )}
    </div>
  )
}