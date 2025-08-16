'use client'

import { useState, useEffect } from 'react'
import { Users, MessageSquare, Heart, TrendingUp, Clock, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCount, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

interface FeedStatsData {
  followingCount: number
  newPostsLast24h: number
  lastUpdated: string
}

interface FeedStatsProps {
  stats?: FeedStatsData
  isLoading?: boolean
  onRefresh?: () => void
  className?: string
}

export function FeedStats({
  stats,
  isLoading = false,
  onRefresh,
  className
}: FeedStatsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (isRefreshing || !onRefresh) return

    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Feed Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6" />
          </div>
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Feed Stats
          </CardTitle>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            Following
          </div>
          <span className="font-medium">{formatCount(stats.followingCount)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            New posts (24h)
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{formatCount(stats.newPostsLast24h)}</span>
            {stats.newPostsLast24h > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-xs">
                New
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Clock className="h-3 w-3" />
          Updated {formatRelativeTime(stats.lastUpdated)}
        </div>
      </CardContent>
    </Card>
  )
}

interface FeedMetricsProps {
  totalPosts: number
  totalLikes: number
  totalComments: number
  engagementRate?: number
  className?: string
}

export function FeedMetrics({
  totalPosts,
  totalLikes,
  totalComments,
  engagementRate,
  className
}: FeedMetricsProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{formatCount(totalPosts)}</div>
          <div className="text-sm text-muted-foreground">Posts</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{formatCount(totalLikes)}</div>
          <div className="text-sm text-muted-foreground">Likes</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">{formatCount(totalComments)}</div>
          <div className="text-sm text-muted-foreground">Comments</div>
        </CardContent>
      </Card>

      {engagementRate !== undefined && (
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{engagementRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Engagement</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface ActivityIndicatorProps {
  isActive: boolean
  lastActivity?: string
  className?: string
}

export function ActivityIndicator({
  isActive,
  lastActivity,
  className
}: ActivityIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <div className={cn(
        'h-2 w-2 rounded-full',
        isActive ? 'bg-green-500' : 'bg-gray-400'
      )} />
      <span className="text-muted-foreground">
        {isActive ? 'Live' : lastActivity ? `Last active ${formatRelativeTime(lastActivity)}` : 'Offline'}
      </span>
    </div>
  )
}

interface FeedHealthProps {
  health: {
    postsToday: number
    averageEngagement: number
    activeUsers: number
    responseTime: number
  }
  className?: string
}

export function FeedHealth({
  health,
  className
}: FeedHealthProps) {
  const getHealthColor = (value: number, thresholds: { good: number; fair: number }) => {
    if (value >= thresholds.good) return 'text-green-500'
    if (value >= thresholds.fair) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Feed Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Posts today</span>
          <span className={cn('font-medium', getHealthColor(health.postsToday, { good: 10, fair: 5 }))}>
            {health.postsToday}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Avg. engagement</span>
          <span className={cn('font-medium', getHealthColor(health.averageEngagement, { good: 5, fair: 2 }))}>
            {health.averageEngagement.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Active users</span>
          <span className={cn('font-medium', getHealthColor(health.activeUsers, { good: 50, fair: 20 }))}>
            {formatCount(health.activeUsers)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Response time</span>
          <span className={cn('font-medium', getHealthColor(1000 - health.responseTime, { good: 800, fair: 500 }))}>
            {health.responseTime}ms
          </span>
        </div>
      </CardContent>
    </Card>
  )
}